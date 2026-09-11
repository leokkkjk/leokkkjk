import { sql } from "drizzle-orm";

import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Healthcheck.
 *
 * Runtime da aplicação depende do Supabase (Auth + PostgREST + RLS). O
 * Postgres local continua sendo o banco de migração deste ambiente, então ele
 * também é reportado. `ok` é true se pelo menos um dos dois responde.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let supabaseAlcancavel: boolean | null = null;
  let detalheSupabase = "não configurado";

  if (url && anonKey) {
    try {
      const resposta = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anonKey },
        cache: "no-store",
      });
      supabaseAlcancavel = resposta.ok;
      detalheSupabase = resposta.ok ? "ok" : `http ${resposta.status}`;
    } catch {
      supabaseAlcancavel = false;
      detalheSupabase = "inacessível";
    }
  }

  let bancoMigracao = "indisponível";
  try {
    await db.execute(sql`select 1`);
    bancoMigracao = "ok";
  } catch {
    bancoMigracao = "indisponível";
  }

  const ok = supabaseAlcancavel === true || bancoMigracao === "ok";

  return Response.json(
    {
      ok,
      supabase: {
        configurado: Boolean(url && anonKey),
        alcancavel: supabaseAlcancavel,
        detalhe: detalheSupabase,
      },
      bancoMigracao,
    },
    { status: ok ? 200 : 500 },
  );
}
