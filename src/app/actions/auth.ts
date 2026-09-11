"use server";

import { redirect } from "next/navigation";

import { rotaBaseDoPerfil, type Perfil } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoLogin = { erro: string | null };

function traduzirErro(mensagem: string | undefined): string {
  switch (mensagem) {
    case "Invalid login credentials":
      return "E-mail ou senha inválidos.";
    case "Email not confirmed":
      return "E-mail ainda não confirmado. Confirme pelo link enviado pelo Supabase.";
    case "Email logins are disabled":
      return "Login por e-mail está desabilitado neste projeto Supabase.";
    default:
      if (mensagem?.includes("Failed to fetch") || mensagem?.includes("fetch failed")) {
        return "Não foi possível falar com o Supabase. Confira NEXT_PUBLIC_SUPABASE_URL no .env.local.";
      }
      return mensagem ? `Não foi possível entrar: ${mensagem}` : "Não foi possível entrar.";
  }
}

export async function entrarAction(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !senha) {
    return { erro: "Informe o e-mail e a senha." };
  }

  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error || !data.user) {
    return { erro: traduzirErro(error?.message) };
  }

  // RLS: o usuário só consegue ler a própria linha.
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("perfil")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!perfil) {
    await supabase.auth.signOut();
    return {
      erro:
        "Este login existe no Supabase Auth, mas ainda não tem perfil cadastrado na operação (tabela `usuarios`). Rode o seed ou peça ao Master para cadastrar você.",
    };
  }

  const destino =
    next.startsWith("/") && !next.startsWith("/login")
      ? next
      : rotaBaseDoPerfil(perfil.perfil as Perfil);

  redirect(destino);
}

export async function sairAction(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
