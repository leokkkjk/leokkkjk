/**
 * navegacao.ts — itens do menu lateral, por perfil.
 *
 * Arquivo 100% dados serializáveis (sem componente, sem JSX): é montado no
 * servidor e passado como prop para o shell client, que resolve o ícone pela
 * chave `icone` (ver src/components/casca-aplicativo.tsx).
 *
 * Regra desta fase: `href` só existe para rota que JÁ existe. O que é de fase
 * futura entra como `emBreve` — clicável não, visível sim. Assim o menu já
 * entrega a forma final do produto sem inventar funcionalidade.
 */
import type { Perfil } from "@/lib/perfil";

export type ChaveIcone =
  | "painel"
  | "equipes"
  | "comissoes"
  | "leads"
  | "materiais";

export type ItemNavegacao = {
  /** Chave do ícone (resolvida no client). */
  icone: ChaveIcone;
  label: string;
  /** Rota existente. `null` quando a seção ainda não foi construída. */
  href: string | null;
  descricao?: string;
};

const VISAO_GERAL: Record<Perfil, ItemNavegacao> = {
  master: {
    icone: "painel",
    label: "Visão geral",
    href: "/master",
    descricao: "Toda a operação",
  },
  parceiro_externo: {
    icone: "painel",
    label: "Visão geral",
    href: "/parceiro-externo",
    descricao: "Sua equipe",
  },
  gerente: {
    icone: "painel",
    label: "Visão geral",
    href: "/gerente",
    descricao: "Sua equipe",
  },
  vendedor: {
    icone: "painel",
    label: "Visão geral",
    href: "/vendedor",
    descricao: "Seus dados",
  },
};

const ITENS_FUTUROS: Record<Perfil, ItemNavegacao[]> = {
  master: [
    { icone: "equipes", label: "Equipes", href: null, descricao: "Fase 1" },
    { icone: "comissoes", label: "Comissões", href: null, descricao: "Fase 2" },
    { icone: "leads", label: "Leads (CRM)", href: null, descricao: "Fase 3" },
    { icone: "materiais", label: "Materiais", href: null, descricao: "Fase 4" },
  ],
  parceiro_externo: [
    { icone: "equipes", label: "Minha equipe", href: null, descricao: "Fase 1" },
    { icone: "comissoes", label: "Comissões", href: null, descricao: "Fase 2" },
  ],
  gerente: [
    { icone: "equipes", label: "Minha equipe", href: null, descricao: "Fase 1" },
    { icone: "comissoes", label: "Comissões", href: null, descricao: "Fase 2" },
  ],
  vendedor: [
    { icone: "comissoes", label: "Minhas comissões", href: null, descricao: "Fase 2" },
    { icone: "leads", label: "Leads recebidos", href: null, descricao: "Fase 3" },
    { icone: "materiais", label: "Materiais de estudo", href: null, descricao: "Fase 4" },
  ],
};

export function itensDaNavegacao(perfil: Perfil): ItemNavegacao[] {
  return [VISAO_GERAL[perfil], ...ITENS_FUTUROS[perfil]];
}
