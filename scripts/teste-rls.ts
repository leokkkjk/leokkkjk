/**
 * MATRIZ DE TESTE DO RLS — Fase 0 (Supabase).
 *
 *   node scripts/teste-rls.ts             -> modo "api" (default)
 *       End-to-end de verdade: faz login de cada usuário no Supabase Auth
 *       (POST /auth/v1/token) e consulta o PostgREST (/rest/v1/usuarios) com o
 *       JWT do próprio usuário. Só precisa de URL + anon key, nenhuma secret.
 *
 *   node scripts/teste-rls.ts --modo=rls
 *       Direto no Postgres: conecta como admin, faz SET LOCAL ROLE
 *       authenticated + set_config('request.jwt.claim.sub', ...) — exatamente
 *       o que o PostgREST faz — e roda as mesmas queries. É o modo usado para
 *       validar as policies num Postgres local, sem precisar do Supabase.
 *
 * Saída: PASS/FAIL por caso da matriz + os dois testes de acesso por ID direto
 * + verificação de relrowsecurity em todas as tabelas públicas.
 */
import { Client } from "pg";

import { carregarEnv } from "./_env.ts";

carregarEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const MODO = process.argv.includes("--modo=rls") ? "rls" : "api";

type Caso = {
  papel: string;
  email: string;
  senha: string;
  perfil: string;
  deveVer: string[];
  naoDeveVer: string[];
};

const TODOS_E1 = [
  "master1@demo.com",
  "gerente1@demo.com",
  "vendedor1@demo.com",
  "vendedor2@demo.com",
  "gerente2@demo.com",
  "vendedor3@demo.com",
  "parceiro@demo.com",
  "vendedor4@demo.com",
];

const TODOS_E2 = ["master2@outra.com", "vendedor5@outra.com"];

const CASOS: Caso[] = [
  {
    papel: "M1",
    email: "master1@demo.com",
    senha: "master123",
    perfil: "master",
    deveVer: TODOS_E1,
    naoDeveVer: TODOS_E2,
  },
  {
    papel: "G1",
    email: "gerente1@demo.com",
    senha: "gerente123",
    perfil: "gerente",
    deveVer: ["gerente1@demo.com", "vendedor1@demo.com", "vendedor2@demo.com"],
    naoDeveVer: [
      "vendedor3@demo.com",
      "vendedor4@demo.com",
      "parceiro@demo.com",
      "gerente2@demo.com",
      "master1@demo.com",
      ...TODOS_E2,
    ],
  },
  {
    papel: "G2",
    email: "gerente2@demo.com",
    senha: "gerente123",
    perfil: "gerente",
    deveVer: ["gerente2@demo.com", "vendedor3@demo.com"],
    naoDeveVer: [
      "vendedor1@demo.com",
      "vendedor2@demo.com",
      "gerente1@demo.com",
      "master1@demo.com",
      ...TODOS_E2,
    ],
  },
  {
    papel: "V1",
    email: "vendedor1@demo.com",
    senha: "vendedor123",
    perfil: "vendedor",
    deveVer: ["vendedor1@demo.com"],
    naoDeveVer: [
      "vendedor2@demo.com",
      "vendedor3@demo.com",
      "vendedor4@demo.com",
      "gerente1@demo.com",
      "gerente2@demo.com",
      "parceiro@demo.com",
      "master1@demo.com",
      ...TODOS_E2,
    ],
  },
  {
    papel: "PX",
    email: "parceiro@demo.com",
    senha: "parceiro123",
    perfil: "parceiro_externo",
    deveVer: ["parceiro@demo.com", "vendedor4@demo.com"],
    naoDeveVer: [
      "vendedor1@demo.com",
      "vendedor2@demo.com",
      "vendedor3@demo.com",
      "gerente1@demo.com",
      "gerente2@demo.com",
      "master1@demo.com",
      ...TODOS_E2,
    ],
  },
  {
    papel: "M2",
    email: "master2@outra.com",
    senha: "master123",
    perfil: "master",
    deveVer: TODOS_E2,
    naoDeveVer: TODOS_E1,
  },
];

/**
 * Testes obrigatórios de acesso por ID direto (evitar vazamento por quem
 * descobrir o UUID de outra pessoa). `senhaAlvo` é usada só para logar como o
 * alvo e descobrir o próprio id pelo JWT.
 */
const ACESSO_DIRETO = [
  {
    quem: "vendedor1@demo.com",
    senha: "vendedor123",
    alvo: "vendedor3@demo.com",
    senhaAlvo: "vendedor123",
    rotulo: "V1 buscando o id de V3",
  },
  {
    quem: "master1@demo.com",
    senha: "master123",
    alvo: "master2@outra.com",
    senhaAlvo: "master123",
    rotulo: "M1 buscando o id de M2",
  },
];

type Verificacao = { nome: string; ok: boolean; detalhe: string };

const impresso: { caso: Caso; visiveis: string[]; verificacoes: Verificacao[] }[] = [];
let falhas = 0;

function registrar(verificacao: Verificacao) {
  if (!verificacao.ok) falhas += 1;
  console.log(`  ${verificacao.ok ? "PASS" : "FAIL"} · ${verificacao.nome} ${verificacao.detalhe}`);
}

// ---------------------------------------------------------------------------
// Driver API (PostgREST + JWT)
// ---------------------------------------------------------------------------
async function loginApi(email: string, senha: string): Promise<string> {
  const resposta = await fetch(`${URL_SUPABASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: senha }),
  });
  const dados = (await resposta.json()) as { access_token?: string; error_description?: string; msg?: string };
  if (!resposta.ok || !dados.access_token) {
    throw new Error(
      `login de ${email} falhou (${resposta.status}): ${dados.error_description ?? dados.msg ?? "?"}`,
    );
  }
  return dados.access_token;
}

async function consultarApi(token: string, query: string): Promise<string[]> {
  const resposta = await fetch(`${URL_SUPABASE}/rest/v1/usuarios?${query}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  });
  if (!resposta.ok) {
    throw new Error(`PostgREST ${resposta.status}: ${await resposta.text()}`);
  }
  const linhas = (await resposta.json()) as { email?: string }[];
  return linhas.map((linha) => linha.email ?? "").filter(Boolean);
}

// ---------------------------------------------------------------------------
// Driver RLS (Postgres puro, imitando o PostgREST)
// ---------------------------------------------------------------------------
async function conectarAdmin(): Promise<Client> {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "";
  if (!url) throw new Error("Modo rls precisa de SUPABASE_DB_URL ou DATABASE_URL.");
  const cliente = new Client({
    connectionString: url,
    ssl: process.env.SUPABASE_DB_URL ? { rejectUnauthorized: false } : undefined,
  });
  await cliente.connect();
  return cliente;
}

async function comoUsuario<T>(cliente: Client, id: string, sql: string, params: unknown[] = []): Promise<T[]> {
  await cliente.query("begin");
  await cliente.query("set local role authenticated");
  await cliente.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
  const resultado = await cliente.query(sql, params);
  await cliente.query("rollback");
  return resultado.rows as T[];
}

// ---------------------------------------------------------------------------
async function modoApi() {
  console.log("Modo: api (end-to-end via Supabase Auth + PostgREST)\n");

  for (const caso of CASOS) {
    console.log(`\n— ${caso.papel} ${caso.email} (${caso.perfil})`);
    const token = await loginApi(caso.email, caso.senha);
    const visiveis = await consultarApi(token, "select=email");
    const verificacoes: Verificacao[] = [];

    const faltando = caso.deveVer.filter((email) => !visiveis.includes(email));
    const vazou = caso.naoDeveVer.filter((email) => visiveis.includes(email));

    verificacoes.push({
      nome: `vê exatamente ${caso.deveVer.length}`,
      ok: visiveis.length === caso.deveVer.length,
      detalhe: `(obteve ${visiveis.length})`,
    });
    verificacoes.push({
      nome: "contém quem deve conter",
      ok: faltando.length === 0,
      detalhe: faltando.length ? `faltou ${faltando.join(", ")}` : "",
    });
    verificacoes.push({
      nome: "NÃO contém quem não deve",
      ok: vazou.length === 0,
      detalhe: vazou.length ? `VAZOU ${vazou.join(", ")}` : "",
    });

    for (const verificacao of verificacoes) registrar(verificacao);
    impresso.push({ caso, visiveis, verificacoes });
  }

  // Acesso por ID direto
  console.log("\n— Acesso por ID direto");
  for (const teste of ACESSO_DIRETO) {
    const token = await loginApi(teste.quem, teste.senha);
    const tokenAlvo = await loginApi(teste.alvo, teste.senhaAlvo);
    const idAlvo = decodificarSub(tokenAlvo);
    const linhas = await consultarApi(token, `select=email&id=eq.${idAlvo}`);
    registrar({
      nome: teste.rotulo,
      ok: linhas.length === 0,
      detalhe: `(${linhas.length} linha(s))`,
    });
  }

  console.log(
    "\nObs.: neste modo não é possível consultar pg_class pelo REST. O fato de a\n" +
      "matriz passar já implica RLS ativo (com RLS desligado, todo authenticated\n" +
      "veria todas as linhas). Rode também: node scripts/aplicar-migracoes.ts\n" +
      "para conferir relrowsecurity = true tabela por tabela.",
  );
}

function decodificarSub(jwt: string): string {
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8")) as {
    sub?: string;
  };
  return payload.sub ?? "";
}

async function modoRls() {
  console.log("Modo: rls (Postgres, imitando o PostgREST)\n");
  const cliente = await conectarAdmin();

  try {
    const { rows: todos } = await cliente.query<{ id: string; email: string }>(
      "select id, email from public.usuarios",
    );
    const idPorEmail = new Map(todos.map((linha) => [linha.email, linha.id]));

    for (const caso of CASOS) {
      console.log(`\n— ${caso.papel} ${caso.email} (${caso.perfil})`);
      const id = idPorEmail.get(caso.email);
      if (!id) throw new Error(`Usuário ${caso.email} não existe. Rode o seed.`);

      const linhas = await comoUsuario<{ email: string }>(cliente, id, "select email from public.usuarios");
      const visiveis = linhas.map((linha) => linha.email);
      const verificacoes: Verificacao[] = [];

      const faltando = caso.deveVer.filter((email) => !visiveis.includes(email));
      const vazou = caso.naoDeveVer.filter((email) => visiveis.includes(email));

      verificacoes.push({
        nome: `vê exatamente ${caso.deveVer.length}`,
        ok: visiveis.length === caso.deveVer.length,
        detalhe: `(obteve ${visiveis.length})`,
      });
      verificacoes.push({
        nome: "contém quem deve conter",
        ok: faltando.length === 0,
        detalhe: faltando.length ? `faltou ${faltando.join(", ")}` : "",
      });
      verificacoes.push({
        nome: "NÃO contém quem não deve",
        ok: vazou.length === 0,
        detalhe: vazou.length ? `VAZOU ${vazou.join(", ")}` : "",
      });

      for (const verificacao of verificacoes) registrar(verificacao);
      impresso.push({ caso, visiveis, verificacoes });
    }

    console.log("\n— Acesso por ID direto");
    for (const teste of ACESSO_DIRETO) {
      const idQuem = idPorEmail.get(teste.quem);
      const idAlvo = idPorEmail.get(teste.alvo);
      if (!idQuem || !idAlvo) {
        registrar({ nome: teste.rotulo, ok: false, detalhe: "(id desconhecido)" });
        continue;
      }
      const linhas = await comoUsuario(
        cliente,
        idQuem,
        "select id from public.usuarios where id = $1",
        [idAlvo],
      );
      registrar({
        nome: teste.rotulo,
        ok: linhas.length === 0,
        detalhe: `(${linhas.length} linha(s))`,
      });
    }

    console.log("\n— relrowsecurity nas tabelas públicas");
    const { rows } = await cliente.query<{ tabela: string; rls: boolean }>(
      `select c.relname as tabela, c.relrowsecurity as rls
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
       order by c.relname`,
    );
    for (const linha of rows) {
      registrar({
        nome: `${linha.tabela}.relrowsecurity`,
        ok: linha.rls === true,
        detalhe: `(${linha.rls})`,
      });
    }
  } finally {
    await cliente.end().catch(() => undefined);
  }
}

function imprimirMatriz() {
  console.log("\n==================== MATRIZ — RESUMO ====================");
  for (const entrada of impresso) {
    const ok = entrada.verificacoes.every((verificacao) => verificacao.ok);
    console.log(
      `${ok ? "PASS" : "FAIL"} ${entrada.caso.papel.padEnd(3)} (${entrada.caso.perfil.padEnd(16)}) ` +
        `vê ${entrada.visiveis.length} usuário(s): ${entrada.visiveis.join(", ")}`,
    );
  }
  console.log("========================================================");
}

(MODO === "rls" ? modoRls() : modoApi())
  .then(() => {
    imprimirMatriz();
    console.log(falhas === 0 ? "\nTODOS OS CHECKS PASSARAM" : `\n${falhas} CHECK(S) FALHARAM`);
    process.exit(falhas === 0 ? 0 : 1);
  })
  .catch((erro) => {
    console.error("\nErro no teste:", erro instanceof Error ? erro.message : erro);
    process.exit(1);
  });
