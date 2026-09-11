import { redirect } from "next/navigation";

import { getUsuarioAtual } from "@/lib/usuario-atual";
import { rotaBaseDoPerfil } from "@/lib/perfil";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const usuario = await getUsuarioAtual();
  redirect(usuario ? rotaBaseDoPerfil(usuario.perfil) : "/login");
}
