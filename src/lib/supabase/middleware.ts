/**
 * Sessão do Supabase para o proxy (antigo "middleware").
 *
 * Padrão do @supabase/ssr: cria o client lendo os cookies da REQUEST, chama
 * auth.getUser() — que refresha o token quando está perto de expirar e devolve
 * os cookies atualizados — e devolve a resposta com os cookies reescritos.
 *
 * Também resolve o PERFIL do usuário consultando `usuarios` com a sessão dele
 * (RLS: cada um lê apenas a própria linha). Assim o proxy decide a rota-base
 * com dado sempre fresco, sem depender de claim desatualizado no JWT.
 *
 * Importante: não fazer nada entre createServerClient e getUser().
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Perfil } from "@/lib/perfil";

export type ResultadoSessao = {
  userId: string | null;
  perfil: Perfil | null;
  response: NextResponse;
};

export async function atualizarSessao(request: NextRequest): Promise<ResultadoSessao> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Sem config o app não autentica: segue para o login explicar o problema.
    return { userId: null, perfil: null, response: NextResponse.next({ request }) };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaDefinir) {
        for (const { name, value } of cookiesParaDefinir) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaDefinir) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { userId: null, perfil: null, response };
    }

    // RLS devolve a linha apenas se ela for do próprio usuário.
    const { data } = await supabase
      .from("usuarios")
      .select("perfil")
      .eq("id", user.id)
      .maybeSingle();

    return { userId: user.id, perfil: (data?.perfil as Perfil | undefined) ?? null, response };
  } catch {
    // Supabase fora do ar / rede indisponível: tratar como não logado em vez de
    // derrubar a aplicação com 500.
    return { userId: null, perfil: null, response };
  }
}
