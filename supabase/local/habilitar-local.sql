-- =============================================================================
-- HARNESS LOCAL — réplica mínima do ambiente de auth do Supabase
-- Arquivo: supabase/local/habilitar-local.sql
--
-- NÃO RODAR NO SUPABASE. Serve para testar as MESMAS políticas de
-- supabase/migrations/0001_fase0.sql contra um Postgres comum, sem precisar de
-- Docker/CLI: o teste conecta como um papel non-superuser e seta
-- request.jwt.claim.sub, que é exatamente o que o PostgREST faz no Supabase.
--
-- Cria:
--   * schema auth + tabela auth.users (só as colunas que o sistema usa)
--   * função auth.uid() idêntica à do Supabase (lê request.jwt.claim.sub)
--   * papéis anon / authenticated / service_role (authenticated NÃO é
--     superusuário e NÃO tem bypassrls, então o RLS vale de verdade)
-- =============================================================================

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
