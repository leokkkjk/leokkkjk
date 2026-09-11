import { IconeAlerta } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Aviso exibido quando o proxy bloqueou o acesso à rota de outro perfil.
 */
export default function AvisoSemPermissao({ erro }: { erro?: string }) {
  if (erro !== "sem-permissao") return null;

  return (
    <Alert variant="atencao">
      <IconeAlerta />
      <div className="space-y-1">
        <AlertTitle>Acesso não autorizado para o seu perfil</AlertTitle>
        <AlertDescription>
          Você tentou abrir a área de outro perfil e voltou para a sua. O banco continua
          aplicando o RLS: mesmo que a rota passasse, os dados não vazar.
        </AlertDescription>
      </div>
    </Alert>
  );
}
