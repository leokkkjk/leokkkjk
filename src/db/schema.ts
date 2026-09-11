/**
 * FASE 0 — modelo de dados (versão Supabase).
 *
 * Este arquivo é o espelho tipado do banco, usado para tipos e para
 * `drizzle-kit` no Postgres local. A fonte da verdade do schema no Supabase é
 * `supabase/migrations/0001_fase0.sql` (SQL direto), porque o
 * `drizzle-kit push` tentaria criar o schema `auth` — que no Supabase é
 * administrado pelo próprio serviço (permissão negada).
 *
 * Mudanças da migração para o Supabase:
 *   - `usuarios.id` É o `auth.users.id` (mesmo UUID, FK, sem default)
 *   - a tabela própria de sessão FOI REMOVIDA: sessão é responsabilidade do
 *     Supabase Auth (GoTrue) + @supabase/ssr
 */
import {
  boolean,
  index,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const perfilEnum = pgEnum("perfil_usuario", [
  "master",
  "parceiro_externo",
  "gerente",
  "vendedor",
]);

/** Schema gerenciado pelo Supabase Auth — declarado só para a FK de usuarios.id. */
export const auth = pgSchema("auth");

export const authUsers = auth.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Multi-tenant. Hoje existe 1 empresa, mas o isolamento já nasce no modelo. */
export const empresas = pgTable(
  "empresas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    slug: text("slug").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("empresas_slug_unico").on(t.slug)],
);

/**
 * Perfil operacional de cada usuário do Supabase Auth.
 * - `id` = auth.users.id
 * - `perfil`: master | parceiro_externo | gerente | vendedor
 * - `reportsToId`: superior direto (monta a hierarquia usada pelo RLS)
 * - `empresaId`: tenant (nenhuma policy devolve linha de outra empresa)
 */
export const usuarios = pgTable(
  "usuarios",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    perfil: perfilEnum("perfil").notNull(),
    reportsToId: uuid("reports_to_id").references((): AnyPgColumn => usuarios.id, {
      onDelete: "set null",
    }),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("usuarios_email_unico").on(t.email),
    index("usuarios_empresa_idx").on(t.empresaId),
    index("usuarios_reports_to_idx").on(t.reportsToId),
    index("usuarios_perfil_idx").on(t.perfil),
  ],
);

export type Empresa = typeof empresas.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type PerfilUsuario = Usuario["perfil"];
