/**
 * Usuário da requisição atual, lido do Supabase Auth + tabela `usuarios`.
 *
 * `supabase.auth.getUser()` valida o JWT no servidor (não confia só no cookie)
 * e a linha de `usuarios` vem pelo RLS — cada usuário consegue ler a própria
 * linha, nada mais.
 */
import { cache } from "react";
import { redirect } from "next/navigation";

import { criarClienteServidor } from "@/lib/supabase/server";
import { PERFIL_INFO, type Perfil } from "@/lib/perfil";

export type UsuarioAtual = {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  perfil: Perfil;
};

export const getUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, empresa_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    empresaId: data.empresa_id,
    nome: data.nome,
    email: data.email,
    perfil: data.perfil as Perfil,
  };
});

/** Exige sessão válida; caso contrário manda para o login. */
export async function requireUsuario(destino?: string): Promise<UsuarioAtual> {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    redirect(destino ? `/login?next=${encodeURIComponent(destino)}` : "/login");
  }
  return usuario;
}

/**
 * Exige um perfil específico. O proxy já é a guarda grossa; isto é a linha
 * fina — o RLS continua sendo quem realmente limita os dados.
 */
export async function requirePerfil(perfil: Perfil): Promise<UsuarioAtual> {
  const destino = PERFIL_INFO[perfil].rota;
  const usuario = await requireUsuario(destino);
  if (usuario.perfil !== perfil) {
    redirect(`${PERFIL_INFO[usuario.perfil].rota}?erro=sem-permissao`);
  }
  return usuario;
}
