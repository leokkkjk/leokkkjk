/**
 * Seed da Fase 0 — Supabase.
 *
 *   Nuvem (default): node scripts/seed.ts
 *     -> precisa de SUPABASE_SERVICE_ROLE_KEY no .env.local
 *     -> cria os logins via auth.admin.createUser e popula empresas/usuarios
 *        com o service role (que passa por cima do RLS, de propósito)
 *   Local:          node scripts/seed.ts --local
 *     -> usa DATABASE_URL e escreve direto no auth.users do harness local
 *
 * Elenco (idêntico ao critério de pronto do brief):
 *   Empresa 1: M1(master) G1(gerente) V1,V2(->G1) G2(gerente) V3(->G2)
 *              PX(parceiro_externo) V4(->PX)
 *   Empresa 2: M2(master) V5(->M2)
 */
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { carregarEnv, exigir } from "./_env.ts";

const LOCAL = process.argv.includes("--local");
carregarEnv();

type Papel = "master" | "parceiro_externo" | "gerente" | "vendedor";

type Pessoa = {
  chave: string;
  nome: string;
  email: string;
  senha: string;
  perfil: Papel;
  empresa: "e1" | "e2";
  reportsTo?: string;
};

const EMPRESAS = [
  { id: randomUUID(), slug: "credito-prime", nome: "Crédito Prime Correspondente" },
  { id: randomUUID(), slug: "outra-operacao", nome: "Outra Operação" },
] as const;

const PESSOAS: Pessoa[] = [
  { chave: "M1", nome: "Marcos Master", email: "master1@demo.com", senha: "master123", perfil: "master", empresa: "e1" },
  { chave: "G1", nome: "Gisele Gerente (Equipe A)", email: "gerente1@demo.com", senha: "gerente123", perfil: "gerente", empresa: "e1", reportsTo: "M1" },
  { chave: "V1", nome: "Vera Vendedora", email: "vendedor1@demo.com", senha: "vendedor123", perfil: "vendedor", empresa: "e1", reportsTo: "G1" },
  { chave: "V2", nome: "Valter Vendedor", email: "vendedor2@demo.com", senha: "vendedor123", perfil: "vendedor", empresa: "e1", reportsTo: "G1" },
  { chave: "G2", nome: "Bruna Gerente (Equipe B)", email: "gerente2@demo.com", senha: "gerente123", perfil: "gerente", empresa: "e1", reportsTo: "M1" },
  { chave: "V3", nome: "Vicente Vendedor (Equipe B)", email: "vendedor3@demo.com", senha: "vendedor123", perfil: "vendedor", empresa: "e1", reportsTo: "G2" },
  { chave: "PX", nome: "Paulo Parceiro Externo", email: "parceiro@demo.com", senha: "parceiro123", perfil: "parceiro_externo", empresa: "e1", reportsTo: "M1" },
  { chave: "V4", nome: "Priscila Vendedora (equipe do parceiro)", email: "vendedor4@demo.com", senha: "vendedor123", perfil: "vendedor", empresa: "e1", reportsTo: "PX" },
  { chave: "M2", nome: "Master de Outra Empresa", email: "master2@outra.com", senha: "master123", perfil: "master", empresa: "e2" },
  { chave: "V5", nome: "Vendedor de Outra Empresa", email: "vendedor5@outra.com", senha: "vendedor123", perfil: "vendedor", empresa: "e2", reportsTo: "M2" },
];

/** Cria (ou reutiliza) o login no Supabase Auth e devolve o auth.users.id. */
async function idNoAuth(supabase: SupabaseClient, pessoa: Pessoa): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: pessoa.email,
    password: pessoa.senha,
    email_confirm: true,
  });

  if (!error && data.user) return data.user.id;

  const mensagem = error?.message ?? "";
  if (!mensagem.includes("already") && !mensagem.includes("já")) {
    throw new Error(`auth.admin.createUser falhou para ${pessoa.email}: ${mensagem}`);
  }

  // Usuário já existe: recupera o id para o seed ser idempotente.
  const { data: lista } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existente = lista?.users?.find((u) => u.email === pessoa.email);
  if (!existente) {
    throw new Error(`Não encontrei o login já existente de ${pessoa.email}`);
  }

  await supabase.auth.admin.updateUserById(existente.id, {
    password: pessoa.senha,
    email_confirm: true,
  });

  return existente.id;
}

async function seedNuvem() {
  const url = exigir(
    "NEXT_PUBLIC_SUPABASE_URL",
    "já está no .env.local (painel > Settings > API > Project URL)",
  );
  const serviceKey = exigir(
    "SUPABASE_SERVICE_ROLE_KEY",
    "painel do Supabase > Settings > API > service_role (secret key) -> SUPABASE_DB_URL não é usada aqui",
  );

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ids = new Map<string, string>();
  for (const pessoa of PESSOAS) {
    ids.set(pessoa.chave, await idNoAuth(admin, pessoa));
    console.log(`✓ auth: ${pessoa.chave} ${pessoa.email}`);
  }

  const { error: erroEmpresas } = await admin
    .from("empresas")
    .upsert(EMPRESAS.map((e) => ({ id: e.id, nome: e.nome, slug: e.slug })), { onConflict: "id" });
  if (erroEmpresas) throw new Error(`empresas: ${erroEmpresas.message}`);

  const { error: erroUsuarios } = await admin.from("usuarios").upsert(
    PESSOAS.map((p) => ({
      id: ids.get(p.chave) as string,
      empresa_id: EMPRESAS[p.empresa === "e1" ? 0 : 1].id,
      nome: p.nome,
      email: p.email,
      perfil: p.perfil,
      reports_to_id: p.reportsTo ? (ids.get(p.reportsTo) as string) : null,
      ativo: true,
    })),
    { onConflict: "id" },
  );
  if (erroUsuarios) throw new Error(`usuarios: ${erroUsuarios.message}`);

  console.log(`\nOK: ${EMPRESAS.length} empresas e ${PESSOAS.length} usuários no Supabase.`);
}

async function seedLocal() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL não definido no .env");

  const cliente = new Client({ connectionString: url });
  await cliente.connect();

  try {
    await cliente.query("begin");
    await cliente.query("truncate table auth.users cascade");
    await cliente.query("truncate table public.empresas cascade");

    const ids = new Map<string, string>();

    for (const empresa of EMPRESAS) {
      await cliente.query("insert into empresas (id, nome, slug) values ($1, $2, $3)", [
        empresa.id,
        empresa.nome,
        empresa.slug,
      ]);
    }

    for (const pessoa of PESSOAS) {
      const id = randomUUID();
      ids.set(pessoa.chave, id);
      await cliente.query("insert into auth.users (id, email) values ($1, $2)", [id, pessoa.email]);
    }

    for (const pessoa of PESSOAS) {
      await cliente.query(
        `insert into usuarios (id, empresa_id, nome, email, perfil, reports_to_id, ativo)
         values ($1, $2, $3, $4, $5, $6, true)`,
        [
          ids.get(pessoa.chave) as string,
          EMPRESAS[pessoa.empresa === "e1" ? 0 : 1].id,
          pessoa.nome,
          pessoa.email,
          pessoa.perfil,
          pessoa.reportsTo ? ids.get(pessoa.reportsTo) : null,
        ],
      );
      console.log(`✓ ${pessoa.chave} ${pessoa.email} (${pessoa.perfil})`);
    }

    await cliente.query("commit");
    console.log(`\nOK: ${EMPRESAS.length} empresas e ${PESSOAS.length} usuários no Postgres local.`);
  } catch (erro) {
    await cliente.query("rollback");
    throw erro;
  } finally {
    await cliente.end().catch(() => undefined);
  }
}

(LOCAL ? seedLocal() : seedNuvem()).catch((erro) => {
  console.error("\nFalha no seed:", erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
