import type { ReactNode } from "react";

import { sairAction } from "@/app/actions/auth";
import { requireUsuario } from "@/lib/usuario-atual";
import { PERFIL_INFO } from "@/lib/perfil";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const usuario = await requireUsuario();
  const info = PERFIL_INFO[usuario.perfil];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.14em] text-slate-500">
              Plataforma interna · Fase 0
            </p>
            <p className="m-0 text-sm font-semibold text-slate-900">
              {usuario.nome}{" "}
              <span className="font-normal text-slate-500">· {info.label}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{usuario.email}</span>
            <form action={sairAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-900"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
