import { contarPorPerfil, usuariosVisiveis } from "@/lib/hierarquia";
import { PERFIL_INFO } from "@/lib/perfil";
import { getUsuarioAtual } from "@/lib/usuario-atual";

export const dynamic = "force-dynamic";

/**
 * Verificação da política de visibilidade (FASE 0).
 *
 * A query sai com a sessão do usuário logado, então quem limita o resultado é
 * o RLS do Postgres — este handler não filtra nada além do tenant.
 */
export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return Response.json({ erro: "não autenticado" }, { status: 401 });
  }

  try {
    const lista = await usuariosVisiveis(usuario);

    return Response.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        empresaId: usuario.empresaId,
      },
      regra: PERFIL_INFO[usuario.perfil].descricao,
      aplicadaPor: "RLS (policy usuarios_select_hierarquia)",
      total: lista.length,
      contagemPorPerfil: contarPorPerfil(lista),
      usuarios: lista.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfil: u.perfil,
        reportsToId: u.reportsToId,
        nivel: u.profundidade,
        ativo: u.ativo,
      })),
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "erro inesperado";
    return Response.json({ erro: mensagem }, { status: 500 });
  }
}
