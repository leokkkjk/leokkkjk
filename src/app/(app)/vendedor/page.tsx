import AvisoSemPermissao from "@/components/aviso-sem-permissao";
import PainelVisibilidade from "@/components/painel-visibilidade";
import { requirePerfil } from "@/lib/usuario-atual";
import { PERFIL_INFO } from "@/lib/perfil";

export const dynamic = "force-dynamic";

export default async function VendedorPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await requirePerfil("vendedor");
  const { erro } = await searchParams;

  return (
    <div className="space-y-6">
      <AvisoSemPermissao erro={erro} />
      <header className="space-y-1">
        <h1 className="m-0 text-xl font-semibold text-slate-900">
          {PERFIL_INFO.vendedor.label}
        </h1>
        <p className="m-0 text-sm text-slate-600">
          Página de confirmação de roteamento e permissão (Fase 0). Nas fases
          seguintes: produtos e comissões, leads recebidos e materiais de estudo.
        </p>
      </header>

      <PainelVisibilidade usuario={usuario} />
    </div>
  );
}
