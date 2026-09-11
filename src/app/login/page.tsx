import Link from "next/link";
import { redirect } from "next/navigation";

import { IconeEscudo, IconeEquipes, IconeMarca, IconeOlho } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUsuarioAtual } from "@/lib/usuario-atual";
import { rotaBaseDoPerfil } from "@/lib/perfil";
import { statusSchemaSupabase, supabaseConfigurado } from "@/lib/supabase/server";
import FormularioLogin from "./formulario";

export const dynamic = "force-dynamic";

const MENSAGENS: Record<string, string> = {
  "sem-perfil":
    "Seu login existe no Supabase Auth, mas não existe linha na tabela `usuarios`. Rode o seed ou peça ao Master para cadastrar você.",
  "sem-permissao": "Você não tem permissão para acessar aquela área.",
};

const DIFERENCIAIS = [
  {
    icone: IconeEquipes,
    titulo: "Hierarquia de verdade",
    texto: "Master, parceiro externo, gerente e vendedor — cada um com o seu alcance.",
  },
  {
    icone: IconeEscudo,
    titulo: "Permissão no banco",
    texto: "O RLS do Postgres decide o que cada login enxerga. A tela só mostra o retorno.",
  },
  {
    icone: IconeOlho,
    titulo: "Auditoria simples",
    texto: "Dúvida sobre o que alguém vê? A mesma consulta está exposta em /api/usuarios.",
  },
] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const configurado = supabaseConfigurado();

  // Sem as variáveis do Supabase, `criarClienteServidor()` lançaria e a tela
  // viraria 500 em vez de mostrar o aviso amigável logo abaixo.
  const usuario = configurado ? await getUsuarioAtual() : null;
  if (usuario) redirect(rotaBaseDoPerfil(usuario.perfil));

  const { next, erro } = await searchParams;
  const schema = configurado ? await statusSchemaSupabase() : "inacessivel";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------- painel de marca ------------------------ */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink-950 p-12 lg:flex">
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-acento-400 to-acento-700 text-white shadow-sm">
            <IconeMarca className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">Central de Equipes</span>
            <span className="block text-[11px] tracking-wide text-ink-400">
              Correspondente bancário
            </span>
          </span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h2 className="m-0 text-3xl leading-tight font-semibold tracking-tight text-white">
            Toda a sua equipe,
            <br />
            em um só lugar.
          </h2>
          <p className="m-0 text-sm leading-relaxed text-ink-300">
            Plataforma interna da operação de crédito. Um login por pessoa, com o alcance
            certo — sem planilha paralela e sem dado de parceiro vazando entre equipes.
          </p>

          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {DIFERENCIAIS.map((item) => (
              <li key={item.titulo} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-acento-300">
                  <item.icone className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{item.titulo}</span>
                  <span className="block text-xs leading-relaxed text-ink-400">{item.texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 m-0 text-[11px] text-ink-500">
          Fase 0 — autenticação, perfis e visibilidade de dados.
        </p>

        <div className="pointer-events-none absolute -top-28 -left-20 size-[26rem] rounded-full bg-acento-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 bottom-[-6rem] size-[24rem] rounded-full bg-acento-800/40 blur-3xl" />
      </section>

      {/* --------------------------- formulário -------------------------- */}
      <section className="flex items-center justify-center bg-ink-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm space-y-7">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-acento-400 to-acento-700 text-white shadow-sm">
              <IconeMarca className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">Central de Equipes</span>
              <span className="block text-[11px] text-ink-500">Correspondente bancário</span>
            </span>
          </div>

          <header className="space-y-2">
            <h1 className="m-0 text-2xl font-semibold tracking-tight text-ink-900">Entrar</h1>
            <p className="m-0 text-sm leading-relaxed text-ink-500">
              Use o e-mail e a senha cadastrados pelo Master da sua operação.
            </p>
          </header>

          {!configurado ? (
            <Alert variant="atencao">
              <div className="space-y-1">
                <AlertTitle>Supabase não configurado</AlertTitle>
                <AlertDescription>
                  Preencha <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no <code>.env.local</code>.
                </AlertDescription>
              </div>
            </Alert>
          ) : schema === "sem-tabela" ? (
            <Alert variant="atencao">
              <div className="space-y-1">
                <AlertTitle>Schema ainda não aplicado neste projeto Supabase</AlertTitle>
                <AlertDescription>
                  Preencha <code>SUPABASE_DB_URL</code> no <code>.env.local</code> e rode{" "}
                  <code>node scripts/aplicar-migracoes.ts</code>. Depois{" "}
                  <code>SUPABASE_SERVICE_ROLE_KEY</code> + <code>node scripts/seed.ts</code>. As
                  policies RLS e a matriz de visibilidade já estão validadas em Postgres.
                </AlertDescription>
              </div>
            </Alert>
          ) : schema === "inacessivel" ? (
            <Alert variant="atencao">
              <div className="space-y-1">
                <AlertTitle>Supabase inacessível</AlertTitle>
                <AlertDescription>
                  Não foi possível falar com o Supabase. Confira a URL e a anon key no{" "}
                  <code>.env.local</code>.
                </AlertDescription>
              </div>
            </Alert>
          ) : null}

          {erro && MENSAGENS[erro] ? (
            <Alert variant="atencao">
              <AlertDescription>{MENSAGENS[erro]}</AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-(--radius-card) border border-ink-200/80 bg-white p-5 shadow-(--shadow-card) sm:p-7">
            <FormularioLogin proximo={next ?? ""} />
          </div>

          <p className="m-0 text-center text-xs leading-relaxed text-ink-500">
            Credenciais de demonstração: veja o README do projeto.
            <br />
            Dúvida sobre o que cada perfil enxerga?{" "}
            <Link
              href="/api/usuarios"
              className="font-medium text-acento-600 underline decoration-acento-300 underline-offset-2 hover:text-acento-700"
            >
              Consulta de visibilidade
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
