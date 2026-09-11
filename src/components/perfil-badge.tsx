import { Badge } from "@/components/ui/badge";
import { PERFIL_INFO, type Perfil } from "@/lib/perfil";

/**
 * Badge colorido por perfil — o único ponto do app que traduz perfil em cor.
 * Cores vem sempre dos tokens de globals.css (acento / positivo / atencao / ink).
 */
const ESTILO: Record<Perfil, React.ComponentProps<typeof Badge>["variant"]> = {
  master: "acento",
  parceiro_externo: "atencao",
  gerente: "positivo",
  vendedor: "neutro",
};

const ROTULO_CURTO: Record<Perfil, string> = {
  master: "Master",
  parceiro_externo: "Parceiro",
  gerente: "Gerente",
  vendedor: "Vendedor",
};

export function PerfilBadge({
  perfil,
  /** `curto` troca "Parceiro Externo" por "Parceiro" — para espaços apertados. */
  curto = false,
  size,
  className,
}: {
  perfil: Perfil;
  curto?: boolean;
  size?: React.ComponentProps<typeof Badge>["size"];
  className?: string;
}) {
  return (
    <Badge variant={ESTILO[perfil]} size={size} className={className}>
      {curto ? ROTULO_CURTO[perfil] : PERFIL_INFO[perfil].label}
    </Badge>
  );
}
