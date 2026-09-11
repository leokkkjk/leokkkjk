/**
 * Aplica as migrações SQL em supabase/migrations/*.sql.
 *
 *   Supabase (nuvem):  node scripts/aplicar-migracoes.ts
 *                      -> precisa de SUPABASE_DB_URL no .env.local
 *   Postgres local:    node scripts/aplicar-migracoes.ts --local
 *                      -> usa DATABASE_URL e aplica antes o harness local
 *                         (supabase/local/habilitar-local.sql), que cria o
 *                         schema auth, auth.uid() e os papéis
 *                         anon/authenticated/service_role
 *
 * O SQL é idempotente (IF EXISTS / OR REPLACE), então rodar duas vezes não
 * duplica nada nem quebra.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

import { carregarEnv, exigir } from "./_env.ts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL = process.argv.includes("--local");
const RESET = process.argv.includes("--reset");

carregarEnv();

const url = LOCAL
  ? process.env.DATABASE_URL ?? ""
  : exigir(
      "SUPABASE_DB_URL",
      "painel do Supabase > Settings > Database > Connection string (URI), na variável SUPABASE_DB_URL do .env.local",
    );

const cliente = new Client({
  connectionString: url,
  ssl: LOCAL ? undefined : { rejectUnauthorized: false },
});

async function main() {
  await cliente.connect();

  if (LOCAL) {
    if (RESET) {
      const reset = await readFile(path.join(RAIZ, "supabase", "local", "reset-local.sql"), "utf8");
      await cliente.query(reset);
      console.log("✓ supabase/local/reset-local.sql (tabelas descartadas)");
    }

    const harness = await readFile(path.join(RAIZ, "supabase", "local", "habilitar-local.sql"), "utf8");
    await cliente.query(harness);
    console.log("✓ supabase/local/habilitar-local.sql (harness de auth local)");
  }

  const pasta = path.join(RAIZ, "supabase", "migrations");
  const arquivos = (await readdir(pasta)).filter((nome) => nome.endsWith(".sql")).sort();

  for (const arquivo of arquivos) {
    const sql = await readFile(path.join(pasta, arquivo), "utf8");
    await cliente.query(sql);
    console.log(`✓ supabase/migrations/${arquivo}`);
  }

  const { rows } = await cliente.query<{
    tabela: string;
    relrowsecurity: boolean;
    policies: string;
  }>(`
    select c.relname as tabela,
           c.relrowsecurity as relrowsecurity,
           count(p.polname) as policies
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_policy p on p.polrelid = c.oid
    where n.nspname = 'public' and c.relkind = 'r'
    group by c.relname, c.relrowsecurity
    order by c.relname
  `);

  console.log("\nTabelas públicas:");
  for (const linha of rows) {
    console.log(
      `  ${linha.tabela.padEnd(12)} relrowsecurity=${linha.relrowsecurity ? "true" : "FALSE"}  policies=${linha.policies}`,
    );
  }

  const semRls = rows.filter((linha) => !linha.relrowsecurity);
  if (semRls.length > 0) {
    console.error(`\nFALHOU: ${semRls.length} tabela(s) sem RLS.`);
    process.exitCode = 1;
  } else {
    console.log("\nOK: RLS habilitado em todas as tabelas públicas.");
  }
}

main()
  .catch((erro) => {
    console.error("\nFalha ao aplicar migrações:", erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(() => cliente.end().catch(() => undefined));
