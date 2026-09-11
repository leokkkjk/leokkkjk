import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const usuario = await getUsuarioAtual();
  if (usuario) redirect(rotaBaseDoPerfil(usuario.perfil));

  const { next, erro } = await searchParams;
  const configurado = supabaseConfigurado();
  const schema = configurado ? await statusSchemaSupabase() : "inacessivel";

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-xl space-y-6">
        <header className="space-y-1">
          <p className="m-0 text-xs uppercase tracking-[0.14em] text-slate-500">
            Plataforma interna · Fase 0
          </p>
          <h1 className="m-0 text-2xl font-semibold text-slate-900">Entrar</h1>
          <p className="m-0 text-sm text-slate-600">
            Autenticação pelo Supabase Auth. A visibilidade de dados é aplicada
            pelo RLS no Postgres, não pela tela.
          </p>
        </header>

        {!configurado ? (
          <p className="m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Supabase não configurado: preencha{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no <code>.env.local</code>.
          </p>
        ) : schema === "sem-tabela" ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="m-0 font-medium">Schema ainda não aplicado neste projeto Supabase.</p>
            <p className="mt-1 mb-0 text-xs">
              Preencha <code>SUPABASE_DB_URL</code> no <code>.env.local</code> e rode{" "}
              <code>node scripts/aplicar-migracoes.ts</code>. Depois{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> + <code>node scripts/seed.ts</code>. As
              policies RLS e a matriz de visibilidade já estão validadas em Postgres.
            </p>
          </div>
        ) : schema === "inacessivel" ? (
          <p className="m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Não foi possível falar com o Supabase. Confira a URL e a anon key no{" "}
            <code>.env.local</code>.
          </p>
        ) : null}

        {erro && MENSAGENS[erro] ? (
          <p className="m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {MENSAGENS[erro]}
          </p>
        ) : null}

        <FormularioLogin proximo={next ?? ""} />

        <p className="m-0 text-xs text-slate-500">
          Dúvida sobre o que cada perfil enxerga? Veja a{" "}
          <Link
            href="/api/usuarios"
            className="underline decoration-dotted hover:text-slate-900"
          >
            consulta de visibilidade
          </Link>{" "}
          (precisa estar logado).
        </p>
      </div>
    </main>
  );
}
