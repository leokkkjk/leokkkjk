import { NextResponse, type NextRequest } from "next/server";

import { ROTAS_PROTEGIDAS, prefixoProtegido, rotaBaseDoPerfil } from "@/lib/perfil";
import { atualizarSessao } from "@/lib/supabase/middleware";

/**
 * Proxy (antigo "middleware") — guarda GROSSA de rota por perfil.
 *
 * Responsabilidade: refreshar a sessão do Supabase (cookies) e barrar
 * navegação para área de outro perfil. A linha FINA é o RLS do Postgres:
 * mesmo que um request atravesse aqui, o banco só devolve o que a policy
 * permite. Nunca confiar só nesta camada.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { userId, perfil, response } = await atualizarSessao(request);

  if (pathname === "/login") {
    if (userId && perfil) {
      return NextResponse.redirect(new URL(rotaBaseDoPerfil(perfil), request.url));
    }
    return response;
  }

  if (pathname === "/") {
    const destino = userId && perfil ? rotaBaseDoPerfil(perfil) : "/login";
    return NextResponse.redirect(new URL(destino, request.url));
  }

  const prefixo = prefixoProtegido(pathname);
  if (!prefixo) return response;

  if (!userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // Logou no Supabase Auth mas não existe linha em `usuarios`.
  if (!perfil) {
    const login = new URL("/login", request.url);
    login.searchParams.set("erro", "sem-perfil");
    return NextResponse.redirect(login);
  }

  if (ROTAS_PROTEGIDAS[prefixo] !== perfil) {
    return NextResponse.redirect(
      new URL(`${rotaBaseDoPerfil(perfil)}?erro=sem-permissao`, request.url),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/master/:path*",
    "/parceiro-externo/:path*",
    "/gerente/:path*",
    "/vendedor/:path*",
  ],
};
