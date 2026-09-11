"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PerfilBadge } from "@/components/perfil-badge";
import {
  IconeComissoes,
  IconeEquipes,
  IconeFechar,
  IconeLeads,
  IconeMateriais,
  IconeMarca,
  IconeMenu,
  IconePainel,
  IconeSair,
} from "@/components/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Perfil } from "@/lib/perfil";
import type { ChaveIcone, ItemNavegacao } from "@/lib/navegacao";
import { cn, iniciais, primeiroNome } from "@/lib/utils";

/**
 * casca-aplicativo.tsx — shell das telas logadas.
 *
 * É client porque o menu lateral precisa de estado (aberto/fechado no mobile)
 * e de `usePathname` para marcar o item ativo. Todo o conteúdo da página
 * (`children`) continua sendo server component: só a moldura é client.
 *
 * Animações: só transform/opacity (Tailwind), nada de biblioteca de animação.
 */

const ICONES: Record<ChaveIcone, ComponentType<{ className?: string }>> = {
  painel: IconePainel,
  equipes: IconeEquipes,
  comissoes: IconeComissoes,
  leads: IconeLeads,
  materiais: IconeMateriais,
};

export type UsuarioCasca = {
  nome: string;
  email: string;
  perfil: Perfil;
};

export function CascaAplicativo({
  itens,
  usuario,
  sair,
  children,
}: {
  itens: ItemNavegacao[];
  usuario: UsuarioCasca;
  /** Server action de logout, passada pelo layout (server component). */
  sair: () => Promise<void>;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const rotaInicial = itens.find((item) => item.href)?.href ?? "/";

  // Trocar de página fecha o menu do celular.
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Esc fecha o menu — mesmo comportamento de um drawer nativo.
  useEffect(() => {
    if (!aberto) return;
    const aoPrecionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoPrecionar);
    return () => window.removeEventListener("keydown", aoPrecionar);
  }, [aberto]);

  // Menu aberto congela o scroll do fundo (só no mobile, onde o drawer existe).
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Fundo escurecido do drawer — só existe abaixo do breakpoint lg. */}
      <div
        onClick={() => setAberto(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          aberto ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Menu principal"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink-950 text-ink-100",
          "transition-transform duration-300 ease-out lg:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 px-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-acento-400 to-acento-700 text-white shadow-sm">
            <IconeMarca className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">
              Central de Equipes
            </span>
            <span className="block text-[11px] tracking-wide text-ink-400">
              Correspondente bancário
            </span>
          </span>
          <Button
            type="button"
            variant="invertido"
            size="icon-sm"
            className="ml-auto lg:hidden"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
          >
            <IconeFechar />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">
            Operação
          </p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {itens.map((item) => {
              const Icone = ICONES[item.icone];
              const ativo = item.href !== null && pathname === item.href;
              const emBreve = item.href === null;

              const baseClasses = cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                emBreve && "cursor-not-allowed text-ink-500",
                !emBreve && !ativo && "text-ink-300 hover:bg-white/5 hover:text-white",
                ativo && "bg-acento-600 text-white",
              );

              const conteudo = (
                <>
                  <Icone className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-medium">{item.label}</span>
                    {item.descricao ? (
                      <span
                        className={cn(
                          "block truncate text-[11px]",
                          ativo ? "text-acento-100" : "text-ink-500",
                        )}
                      >
                        {item.descricao}
                      </span>
                    ) : null}
                  </span>
                  {emBreve ? <Badge variant="escuro" size="sm">Em breve</Badge> : null}
                </>
              );

              return (
                <li key={`${item.icone}-${item.label}`}>
                  {emBreve ? (
                    <span className={baseClasses} aria-disabled="true" title="Disponível em fase futura">
                      {conteudo}
                    </span>
                  ) : (
                    <Link
                      href={item.href as string}
                      aria-current={ativo ? "page" : undefined}
                      className={baseClasses}
                    >
                      {conteudo}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border-white/15 bg-white/10">
              <AvatarFallback className="text-ink-100">{iniciais(usuario.nome)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                {usuario.nome}
              </span>
              <span className="block truncate text-[11px] text-ink-400">{usuario.email}</span>
            </span>
          </div>
          <p className="mt-3 mb-0 text-[11px] leading-relaxed text-ink-500">
            Visibilidade de dados aplicada pelo RLS do Postgres.
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-white/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setAberto(true)}
              aria-label="Abrir menu"
              aria-expanded={aberto}
            >
              <IconeMenu />
            </Button>

            <Link
              href={rotaInicial}
              className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-ink-900 lg:hidden"
            >
              <span className="truncate">Central de Equipes</span>
            </Link>

            <p className="m-0 hidden text-sm text-ink-500 lg:block">
              Bem-vindo de volta,{" "}
              <span className="font-medium text-ink-900">{primeiroNome(usuario.nome)}</span>.
            </p>

            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex min-w-0 items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pr-2 pl-1">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">
                    {iniciais(usuario.nome)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[9rem] truncate text-sm font-medium text-ink-900 sm:block">
                  {primeiroNome(usuario.nome)}
                </span>
                <PerfilBadge perfil={usuario.perfil} curto size="sm" />
              </span>

              <form action={sair}>
                <Button type="submit" variant="outline" size="sm">
                  <IconeSair />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-14 sm:px-6 sm:pt-8 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-ink-200/80 px-4 py-5 sm:px-6 lg:px-8">
          <p className="m-0 text-center text-xs text-ink-400 sm:text-left">
            Central de Equipes · Fase 0 — autenticação, perfis e visibilidade.
          </p>
        </footer>
      </div>
    </div>
  );
}
