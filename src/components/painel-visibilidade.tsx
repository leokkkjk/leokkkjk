import { PERFIS, PERFIL_INFO } from "@/lib/perfil";
import { contarPorPerfil, mapaSuperiores, usuariosVisiveis } from "@/lib/hierarquia";
import type { UsuarioAtual } from "@/lib/usuario-atual";

/**
 * Prova prática da política de visibilidade da Fase 0.
 *
 * A lista abaixo é o resultado cru de um SELECT em `usuarios` com a sessão do
 * usuário logado — o RLS é quem corta as linhas. Serve para o Master/Gerente
 * conferirem na própria pele o que cada perfil enxerga.
 */
export default async function PainelVisibilidade({
  usuario,
}: {
  usuario: UsuarioAtual;
}) {
  const lista = await usuariosVisiveis(usuario);
  const contagem = contarPorPerfil(lista);
  const superiores = mapaSuperiores(lista);
  const info = PERFIL_INFO[usuario.perfil];

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-300 bg-white p-5">
        <h2 className="m-0 text-sm font-semibold text-slate-900">
          Regra de visibilidade aplicada
        </h2>
        <p className="mt-2 mb-0 text-sm text-slate-700">{info.descricao}</p>
        <ul className="mt-3 mb-0 space-y-1 pl-4 text-xs text-slate-600">
          <li>
            Vê toda a empresa: <strong>{info.veTodaEmpresa ? "sim" : "não"}</strong>
          </li>
          <li>
            Vê descendência (reports_to_id): <strong>{info.veDescendencia ? "sim" : "não"}</strong>
          </li>
          <li>
            Empresa (tenant): <code className="text-[11px]">{usuario.empresaId}</code>
          </li>
          <li>
            Quem filtra: <strong>RLS no Postgres</strong> — policy{" "}
            <code className="text-[11px]">usuarios_select_hierarquia</code>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 text-sm font-semibold text-slate-900">
            Usuários visíveis para você
          </h2>
          <span className="text-xs text-slate-500">{lista.length} registro(s)</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PERFIS.map((perfil) => (
            <span
              key={perfil}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600"
            >
              {PERFIL_INFO[perfil].label}: {contagem[perfil]}
            </span>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-medium">Usuário</th>
                <th className="py-2 pr-3 font-medium">Perfil</th>
                <th className="py-2 pr-3 font-medium">Reporta para</th>
                <th className="py-2 pr-3 font-medium">Nível</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3">
                    <span className="block font-medium text-slate-900">{u.nome}</span>
                    <span className="block text-xs text-slate-500">{u.email}</span>
                  </td>
                  <td className="py-2 pr-3 text-slate-700">{PERFIL_INFO[u.perfil].label}</td>
                  <td className="py-2 pr-3 text-slate-700">
                    {u.reportsToId ? (superiores.get(u.id) ?? "—") : "—"}
                  </td>
                  <td className="py-2 pr-3 text-slate-700">
                    {u.profundidade === null ? "—" : u.profundidade}
                  </td>
                  <td className="py-2 text-slate-700">{u.ativo ? "ativo" : "inativo"}</td>
                </tr>
              ))}
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-sm text-slate-500">
                    Nenhum usuário visível.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
