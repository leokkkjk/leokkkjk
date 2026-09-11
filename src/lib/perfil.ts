/**
 * Catálogo de perfis e permissões (FASE 0).
 * Arquivo puro (sem import de node:*) para poder ser usado no middleware.
 */

export const PERFIS = ["master", "parceiro_externo", "gerente", "vendedor"] as const;

export type Perfil = (typeof PERFIS)[number];

export function isPerfil(valor: unknown): valor is Perfil {
  return typeof valor === "string" && (PERFIS as readonly string[]).includes(valor);
}

type DefinicaoPerfil = {
  label: string;
  /** Rota-base (home) do perfil. */
  rota: string;
  descricao: string;
  /** Vê todos os usuários da própria empresa. */
  veTodaEmpresa: boolean;
  /** Vê a si mesmo + toda a descendência (reports_to_id). */
  veDescendencia: boolean;
  /** Pode cadastrar/gerenciar usuários abaixo dele (usado na Fase 1). */
  gerenciaEquipe: boolean;
};

export const PERFIL_INFO: Record<Perfil, DefinicaoPerfil> = {
  master: {
    label: "Master",
    rota: "/master",
    descricao: "Acesso total: vê todos os usuários da própria empresa.",
    veTodaEmpresa: true,
    veDescendencia: true,
    gerenciaEquipe: true,
  },
  parceiro_externo: {
    label: "Parceiro Externo",
    rota: "/parceiro-externo",
    descricao: "Equipe própria com comissão diferenciada. Vê a si mesmo e sua equipe.",
    veTodaEmpresa: false,
    veDescendencia: true,
    gerenciaEquipe: true,
  },
  gerente: {
    label: "Gerente",
    rota: "/gerente",
    descricao: "Gerencia sua equipe: vê a si mesmo e quem reporta pra ele.",
    veTodaEmpresa: false,
    veDescendencia: true,
    gerenciaEquipe: true,
  },
  vendedor: {
    label: "Vendedor",
    rota: "/vendedor",
    descricao: "Vê apenas os próprios dados.",
    veTodaEmpresa: false,
    veDescendencia: false,
    gerenciaEquipe: false,
  },
};

export function rotaBaseDoPerfil(perfil: Perfil): string {
  return PERFIL_INFO[perfil].rota;
}

/** Prefixo protegido -> perfil autorizado a acessá-lo. */
export const ROTAS_PROTEGIDAS: Record<string, Perfil> = {
  "/master": "master",
  "/parceiro-externo": "parceiro_externo",
  "/gerente": "gerente",
  "/vendedor": "vendedor",
};

/** Descobre o prefixo protegido de um pathname ("/gerente/equipe" -> "/gerente"). */
export function prefixoProtegido(pathname: string): string | null {
  const candidatas = Object.keys(ROTAS_PROTEGIDAS).sort((a, b) => b.length - a.length);
  return candidatas.find((rota) => pathname === rota || pathname.startsWith(`${rota}/`)) ?? null;
}
