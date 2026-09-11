/**
 * Carregador de .env / .env.local para os scripts (Node não carrega sozinho).
 * Rodar com: node scripts/<nome>.ts   (Node 22+ lê TypeScript nativamente)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIRETORIO_RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function carregarEnv(): void {
  // .env.local tem prioridade sobre .env (mesma regra do Next.js).
  for (const nome of [".env", ".env.local"]) {
    try {
      const conteudo = readFileSync(path.join(DIRETORIO_RAIZ, nome), "utf8");
      for (const linhaBruta of conteudo.split("\n")) {
        const linha = linhaBruta.trim();
        if (!linha || linha.startsWith("#")) continue;

        const igual = linha.indexOf("=");
        if (igual <= 0) continue;

        const chave = linha.slice(0, igual).trim();
        const valor = linha.slice(igual + 1).trim();
        if (chave === "SUPABASE_SERVICE_ROLE_KEY" || chave === "SUPABASE_DB_URL") {
          // Secret nunca vai para o bundle nem para log.
          if (valor) process.env[chave] = valor;
          continue;
        }
        if (process.env[chave] === undefined) process.env[chave] = valor;
      }
    } catch {
      // arquivo opcional
    }
  }
}

export function exigir(nome: string, comoConseguir: string): string {
  const valor = process.env[nome];
  if (!valor) {
    console.error(`\nFalta a variável ${nome}.`);
    console.error(`  Como conseguir: ${comoConseguir}\n`);
    process.exit(1);
  }
  return valor;
}
