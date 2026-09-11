/**
 * Aviso exibido quando o proxy bloqueou o acesso à rota de outro perfil.
 */
export default function AvisoSemPermissao({ erro }: { erro?: string }) {
  if (erro !== "sem-permissao") return null;

  return (
    <p className="m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      Você não tem permissão para acessar a área que tentou abrir e foi trazido
      de volta para a sua própria área.
    </p>
  );
}
