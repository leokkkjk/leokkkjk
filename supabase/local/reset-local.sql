-- =============================================================================
-- RESET DO AMBIENTE LOCAL (descartável) — NUNCA RODAR NO SUPABASE
-- =============================================================================
-- Descarta TUDO que existir no schema public para que
-- supabase/migrations/*.sql crie as tabelas do zero.
-- Usado apenas por: node scripts/aplicar-migracoes.ts --local --reset
--
-- É genérico de propósito: não conhece nomes de tabelas legadas, apenas limpa
-- o schema. Em banco novo (como o do Supabase) este arquivo é desnecessário.
-- =============================================================================

do $$
declare
  registro record;
begin
  for registro in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', registro.tablename);
  end loop;
end
$$;

drop type if exists public.perfil_usuario;
