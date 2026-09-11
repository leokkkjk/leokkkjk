/**
 * Cliente Supabase para SERVER COMPONENTS, SERVER ACTIONS e ROUTE HANDLERS.
 *
 * Todas as consultas de runtime passam por aqui, com o JWT do usuário logado.
 * É isso que faz o RLS valer de verdade: a query sai com o papel
 * `authenticated` e o banco devolve só o que a policy permite.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function variaveisPublicas() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios no .env.local",
    );
  }

  return { url, anonKey };
}

export function supabaseConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Diagnóstico público (usa só a anon key): informa se as tabelas da Fase 0
 * já existem no Supabase. Serve para o login avisar o desenvolvedor o que
 * está pendente em vez de falhar com "credenciais inválidas" sem explicação.
 */
export type StatusSchema = "ok" | "sem-tabela" | "inacessivel" | "outro";

export async function statusSchemaSupabase(): Promise<StatusSchema> {
  try {
    const { url, anonKey } = variaveisPublicas();
    const resposta = await fetch(`${url}/rest/v1/usuarios?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      cache: "no-store",
    });

    if (resposta.ok) return "ok";

    const corpo = (await resposta.json().catch(() => null)) as { code?: string } | null;
    if (corpo?.code === "PGRST205") return "sem-tabela";
    return "outro";
  } catch {
    return "inacessivel";
  }
}

export async function criarClienteServidor() {
  const cookieStore = await cookies();
  const { url, anonKey } = variaveisPublicas();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaDefinir) {
        try {
          for (const { name, value, options } of cookiesParaDefinir) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component não pode escrever cookie. O proxy já refresha a
          // sessão antes de chegar aqui, então ignorar é o comportamento correto.
        }
      },
    },
  });
}
