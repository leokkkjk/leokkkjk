"use client";

import { useActionState, useState } from "react";

import { entrarAction, type EstadoLogin } from "@/app/actions/auth";

const estadoInicial: EstadoLogin = { erro: null };

const CONTAS_DEMO = [
  { email: "master1@demo.com", senha: "master123", papel: "M1 · Master — vê a empresa inteira" },
  { email: "gerente1@demo.com", senha: "gerente123", papel: "G1 · Gerente — equipe A" },
  { email: "gerente2@demo.com", senha: "gerente123", papel: "G2 · Gerente — equipe B" },
  { email: "vendedor1@demo.com", senha: "vendedor123", papel: "V1 · Vendedor — só ele mesmo" },
  { email: "parceiro@demo.com", senha: "parceiro123", papel: "PX · Parceiro externo" },
  { email: "master2@outra.com", senha: "master123", papel: "M2 · Master de outra empresa" },
];

export default function FormularioLogin({ proximo }: { proximo: string }) {
  const [estado, acao, pendente] = useActionState(entrarAction, estadoInicial);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  return (
    <div className="space-y-4">
      <form action={acao} className="space-y-4 rounded-xl border border-slate-300 bg-white p-5">
        <input type="hidden" name="next" value={proximo} />

        <label className="block space-y-1 text-sm text-slate-800">
          <span className="font-medium">E-mail</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </label>

        <label className="block space-y-1 text-sm text-slate-800">
          <span className="font-medium">Senha</span>
          <input
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </label>

        {estado.erro ? (
          <p className="m-0 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{estado.erro}</p>
        ) : null}

        <button
          type="submit"
          disabled={pendente}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <section className="rounded-xl border border-slate-300 bg-white p-5">
        <h2 className="m-0 text-sm font-semibold text-slate-900">Usuários de teste (seed)</h2>
        <p className="mt-1 mb-3 text-xs text-slate-600">
          Clique para preencher e conferir o que cada perfil enxerga. Estes logins só
          existem depois de rodar <code>node scripts/seed.ts</code>.
        </p>
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {CONTAS_DEMO.map((conta) => (
            <li key={conta.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(conta.email);
                  setSenha(conta.senha);
                }}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-left transition hover:border-slate-900"
              >
                <span className="block font-mono text-[11px] text-slate-900">{conta.email}</span>
                <span className="block text-[11px] text-slate-500">
                  {conta.papel} · {conta.senha}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
