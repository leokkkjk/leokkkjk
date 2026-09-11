import type { SVGProps } from "react";

/**
 * icons.tsx — ícones inline (stroke, currentColor).
 *
 * Desenhados à mão no próprio projeto: zero dependência de biblioteca de
 * ícones e zero requisição externa (brief: sem imagens externas). Herdam a cor
 * do texto, então ficam coerentes com os tokens automaticamente.
 */
type IconeProps = SVGProps<SVGSVGElement>;

function base(props: IconeProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconeMenu(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

export function IconeFechar(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconePainel(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.75" y="3.75" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3.75" width="6.75" height="4.5" rx="1.5" />
      <rect x="13.5" y="11.25" width="6.75" height="9" rx="1.5" />
      <rect x="3.75" y="14.25" width="7.5" height="6" rx="1.5" />
    </svg>
  );
}

export function IconeEquipes(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M15.75 20.25v-1.5a3.75 3.75 0 0 0-3.75-3.75H6.75A3.75 3.75 0 0 0 3 18.75v1.5" />
      <circle cx="9.375" cy="8.25" r="3" />
      <path d="M21 20.25v-1.5a3.75 3.75 0 0 0-2.625-3.56M15.75 5.42a3 3 0 0 1 0 5.66" />
    </svg>
  );
}

export function IconeComissoes(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6.75v10.5M15.75 9.75a2.25 2.25 0 0 0-2.25-2.25h-2.25a2.25 2.25 0 0 0 0 4.5h1.5a2.25 2.25 0 0 1 0 4.5H10.5A2.25 2.25 0 0 1 8.25 14.5" />
      <circle cx="12" cy="12" r="8.25" />
    </svg>
  );
}

export function IconeLeads(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 2.25v3M12 18.75v3M2.25 12h3M18.75 12h3" />
    </svg>
  );
}

export function IconeMateriais(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6.75C10.2 5.1 7.65 4.65 4.5 4.8v12.75c3.15-.15 5.7.3 7.5 1.95 1.8-1.65 4.35-2.1 7.5-1.95V4.8c-3.15-.15-5.7.3-7.5 1.95Z" />
      <path d="M12 6.75v12.75" />
    </svg>
  );
}

export function IconeSair(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M15.75 9V6.75A1.5 1.5 0 0 0 14.25 5.25H5.25A1.5 1.5 0 0 0 3.75 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V15" />
      <path d="M20.25 12H9.75M18 9.375 20.625 12 18 14.625" />
    </svg>
  );
}

export function IconeEscudo(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.75 5.25 6.375v5.25c0 4.2 2.85 7.5 6.75 9.125 3.9-1.625 6.75-4.925 6.75-9.125v-5.25Z" />
      <path d="M9.375 12.15l1.875 1.875 3.375-3.75" />
    </svg>
  );
}

export function IconeOlho(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 12S6 5.625 12 5.625 21.5 12 21.5 12 18 18.375 12 18.375 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.625" />
    </svg>
  );
}

export function IconeOlhoFechado(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 8.25C3.2 9.4 2.5 12 2.5 12s3.5 6.375 9.5 6.375c1.2 0 2.3-.2 3.3-.6M8.4 8.05A9.6 9.6 0 0 1 12 7.5c6 0 9.5 4.5 9.5 4.5s-1 1.8-2.8 3.2" />
      <path d="M9.75 10.5a2.625 2.625 0 0 0 3.7 3.7M4.125 4.125l15.75 15.75" />
    </svg>
  );
}

export function IconeAlerta(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4.125 2.875 19.875h18.25Z" />
      <path d="M12 9.75v4.5M12 16.875h.007" />
    </svg>
  );
}

export function IconeInfo(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11.25v5.25M12 8.25h.007" />
    </svg>
  );
}

export function IconeSetaDireita(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12h15M17.25 7.5 21.75 12l-4.5 4.5" />
    </svg>
  );
}

export function IconePessoa(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8.25" r="3.75" />
      <path d="M5.25 20.25a6.75 6.75 0 0 1 13.5 0" />
    </svg>
  );
}

export function IconeParceiro(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M8.25 12.75 5.25 9.75a2.1 2.1 0 0 1 3-3l3 3" />
      <path d="M15.75 11.25 18.75 8.25a2.1 2.1 0 0 0-3-3l-8.5 8.5" />
      <path d="M11.25 15.75 8.625 18.375a2.1 2.1 0 0 0 3 3L14.25 18.75" />
      <path d="M13.5 14.25l3.75 3.75" />
    </svg>
  );
}

/** Marca do sistema: árvore de hierarquia (master -> gerente -> vendedores). */
export function IconeMarca(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.75v3.5" />
      <circle cx="12" cy="3" r="1.5" />
      <path d="M6.75 11.25v3.5M17.25 11.25v3.5" />
      <circle cx="6.75" cy="10.5" r="1.5" />
      <circle cx="17.25" cy="10.5" r="1.5" />
      <path d="M4.5 17.25h4.5M15 17.25h4.5" />
      <circle cx="6.75" cy="18" r="1.5" />
      <circle cx="17.25" cy="18" r="1.5" />
    </svg>
  );
}

export function IconeBuscaVazia(props: IconeProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.875" cy="10.875" r="6.375" />
      <path d="M15.75 15.75 20.25 20.25M8.25 10.875h5.25" />
    </svg>
  );
}
