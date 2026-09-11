/**
 * Regra de visibilidade da Fase 0 — versão Supabase.
 *
 * AQUI MUDOU A ARQUITETURA, NÃO A REGRA:
 *   antes: a aplicação montava a CTE recursiva e filtrava quem pode ver quem
 *   agora: a aplicação faz um SELECT simples e o RLS do Postgres filtra
 *
 *   master           -> todos os usuários da própria empresa
 *   parceiro_externo -> self + toda a descendência (reports_to_id)
 *   gerente          -> self + toda a descendência (reports_to_id)
 *   vendedor         -> apenas self
 *
 * O `.eq("empresa_id", ...)` é defesa em profundidade (redundante de propósito):
 * quem limita de verdade é a policy `usuarios_select_hierarquia`.
 *
 * A profundidade na hierarquia não vem do banco: é calculada aqui a partir do
 * `reports_to_id` dentro do conjunto que o RLS devolveu.
 */
import { PERFIL_INFO, type Perfil } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export type UsuarioVisivel = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  reportsToId: string | null;
  ativo: boolean;
  /** Distância na hierarquia a partir do usuário logado (0 = ele mesmo). */
  profundidade: number | null;
};

type ContextoHierarquia = {
  id: string;
  empresaId: string;
  perfil: Perfil;
};

const CAMPOS = "id, nome, email, perfil, reports_to_id, ativo" as const;

type LinhaUsuarios = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  reports_to_id: string | null;
  ativo: boolean;
};

function calcularProfundidade(linha: LinhaUsuarios, porId: Map<string, LinhaUsuarios>): number | null {
  let profundidade = 0;
  let atual: LinhaUsuarios | undefined = linha;
  const vistos = new Set<string>();

  while (atual?.reports_to_id && !vistos.has(atual.id)) {
    vistos.add(atual.id);
    const superior = porId.get(atual.reports_to_id);
    if (!superior) return profundidade > 0 ? profundidade : null;
    profundidade += 1;
    atual = superior;
  }

  return profundidade;
}

/** Lista de usuários visíveis, já ordenada por proximidade na hierarquia. */
export async function usuariosVisiveis(ctx: ContextoHierarquia): Promise<UsuarioVisivel[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("usuarios")
    .select(CAMPOS)
    .eq("empresa_id", ctx.empresaId)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Falha ao listar usuários visíveis: ${error.message}`);
  }

  const linhas = (data ?? []) as LinhaUsuarios[];
  const porId = new Map(linhas.map((linha) => [linha.id, linha]));

  return linhas
    .map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      email: linha.email,
      perfil: linha.perfil,
      reportsToId: linha.reports_to_id,
      ativo: linha.ativo,
      profundidade: linha.id === ctx.id ? 0 : calcularProfundidade(linha, porId),
    }))
    .sort((a, b) => {
      const pa = a.profundidade ?? Number.MAX_SAFE_INTEGER;
      const pb = b.profundidade ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
}

/**
 * Acesso por ID direto — o teste de vazamento do brief.
 * Se o RLS não permitir, o PostgREST devolve 0 linhas e o resultado é null.
 */
export async function buscarUsuarioPorId(
  _ctx: ContextoHierarquia,
  idAlvo: string,
): Promise<UsuarioVisivel | null> {
  const supabase = await criarClienteServidor();

  const { data } = await supabase
    .from("usuarios")
    .select(CAMPOS)
    .eq("id", idAlvo)
    .maybeSingle();

  if (!data) return null;
  const linha = data as LinhaUsuarios;

  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    perfil: linha.perfil,
    reportsToId: linha.reports_to_id,
    ativo: linha.ativo,
    profundidade: null,
  };
}

/** Usado para mostrar o nome do superior direto na listagem. */
export function mapaSuperiores(lista: UsuarioVisivel[]): Map<string, string> {
  const porId = new Map(lista.map((u) => [u.id, u]));
  const mapa = new Map<string, string>();
  for (const u of lista) {
    if (u.reportsToId) {
      mapa.set(u.id, porId.get(u.reportsToId)?.nome ?? "fora do seu alcance");
    }
  }
  return mapa;
}

export function contarPorPerfil(lista: UsuarioVisivel[]): Record<Perfil, number> {
  const contagem: Record<Perfil, number> = {
    master: 0,
    parceiro_externo: 0,
    gerente: 0,
    vendedor: 0,
  };
  for (const u of lista) contagem[u.perfil] += 1;
  return contagem;
}

export function descricaoDaRegra(perfil: Perfil): string {
  return PERFIL_INFO[perfil].descricao;
}
