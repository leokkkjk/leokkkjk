import type { ReactNode } from "react";

/**
 * CabecalhoPagina — título padrão de todas as telas internas.
 * Server component puro (nenhum estado, nenhum efeito).
 */
export function CabecalhoPagina({
  sobretitulo,
  titulo,
  descricao,
  acoes,
}: {
  sobretitulo?: string;
  titulo: string;
  descricao?: string;
  /** Canto direito: ações da tela (ainda não usadas na Fase 0). */
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {sobretitulo ? (
          <p className="m-0 text-[11px] font-semibold tracking-[0.14em] text-acento-600 uppercase">
            {sobretitulo}
          </p>
        ) : null}
        <h1 className="m-0 text-2xl font-semibold tracking-tight text-ink-900 sm:text-[1.75rem]">
          {titulo}
        </h1>
        {descricao ? (
          <p className="m-0 max-w-2xl text-sm leading-relaxed text-ink-500">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
    </div>
  );
}
