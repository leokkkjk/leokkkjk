/**
 * Cliente Supabase para COMPONENTES DE CLIENTE.
 *
 * Só usa as variáveis NEXT_PUBLIC_ (anon/publishable). Nenhuma secret chega
 * aqui — é o único par de credenciais que vai ao browser.
 */
import { createBrowserClient } from "@supabase/ssr";

export function criarClienteBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios no .env.local",
    );
  }

  return createBrowserClient(url, anonKey);
}
