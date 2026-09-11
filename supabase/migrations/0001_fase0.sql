-- =============================================================================
-- FASE 0 — SCHEMA + RLS (Supabase)
-- Arquivo: supabase/migrations/0001_fase0.sql
--
-- É a fonte da verdade do banco. Idempotente: pode ser rodado mais de uma vez.
--
-- Decisão travada no brief:
--   usuarios.id = auth.users.id  (mesmo UUID, FK para auth.users, sem default)
--
-- Aplicar no Supabase:   node scripts/aplicar-migracoes.ts
-- Aplicar no Postgres local (harness de teste de RLS):
--                         node scripts/aplicar-migracoes.ts --local
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) ENUM do perfil
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'perfil_usuario' and n.nspname = 'public'
  ) then
    create type public.perfil_usuario as enum
      ('master', 'parceiro_externo', 'gerente', 'vendedor');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2) TABELAS (apenas empresas e usuarios — nenhuma tabela de sessão)
-- ---------------------------------------------------------------------------
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  criado_em timestamptz not null default now()
);

create unique index if not exists empresas_slug_unico on public.empresas (slug);

create table if not exists public.usuarios (
  -- mesmo UUID do auth.users; NÃO inventa id próprio
  id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  email text not null,
  perfil public.perfil_usuario not null,
  reports_to_id uuid references public.usuarios (id) on delete set null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists usuarios_email_unico on public.usuarios (email);
create index if not exists usuarios_empresa_idx on public.usuarios (empresa_id);
create index if not exists usuarios_reports_to_idx on public.usuarios (reports_to_id);
create index if not exists usuarios_perfil_idx on public.usuarios (perfil);

-- ---------------------------------------------------------------------------
-- 3) FUNÇÕES AUXILIARES (SECURITY DEFINER de propósito)
--
-- Por que security definer: a policy de `usuarios` precisa consultar a própria
-- tabela `usuarios` para descobrir perfil/empresa/equipe. Se a consulta
-- rodasse como o papel do usuário, o RLS seria aplicado dentro da policy e o
-- Postgres abortaria com "infinite recursion detected in policy". Rodando como
-- o dono da tabela (que não é o papel da aplicação), a recursão não acontece.
--
-- Por que search_path fixo: função security definer com search_path aberto é
-- vetor de escalonamento de privilégio.
--
-- `ids_da_equipe` usa CTE RECURSIVA: cobre 1 nível (o suficiente para o
-- piloto) e também níveis múltiplos, se a hierarquia deepening (gerente ->
-- coordenador -> vendedor) for adotada depois.
-- ---------------------------------------------------------------------------
create or replace function public.empresa_do_usuario(p_usuario uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select u.empresa_id from public.usuarios u where u.id = p_usuario;
$$;

create or replace function public.perfil_do_usuario(p_usuario uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.perfil::text from public.usuarios u where u.id = p_usuario;
$$;

create or replace function public.ids_da_equipe(p_usuario uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  with recursive arvore as (
    select u.id, 0 as profundidade
    from public.usuarios u
    where u.id = p_usuario
    union all
    select u2.id, a.profundidade + 1
    from public.usuarios u2
    inner join arvore a on u2.reports_to_id = a.id
  )
  select id from arvore;
$$;

revoke all on function public.empresa_do_usuario(uuid) from public;
revoke all on function public.perfil_do_usuario(uuid) from public;
revoke all on function public.ids_da_equipe(uuid) from public;

grant execute on function public.empresa_do_usuario(uuid) to authenticated, service_role;
grant execute on function public.perfil_do_usuario(uuid) to authenticated, service_role;
grant execute on function public.ids_da_equipe(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) RLS — REGRA DE VISIBILIDADE
--
--   master           -> todos os usuários da própria empresa
--   parceiro_externo -> self + toda a descendência (reports_to_id)
--   gerente          -> self + toda a descendência (reports_to_id)
--   vendedor         -> apenas self
--
-- O filtro por empresa_id aparece em TODOS os ramos: nenhuma policy deixa
-- vazar linha de outro tenant, mesmo que um reports_to_id atravesse empresas.
-- ---------------------------------------------------------------------------
alter table public.usuarios enable row level security;
alter table public.empresas enable row level security;

-- SELECT
drop policy if exists usuarios_select_hierarquia on public.usuarios;
create policy usuarios_select_hierarquia
on public.usuarios
for select
to authenticated
using (
  usuarios.empresa_id = public.empresa_do_usuario(auth.uid())
  and (
    usuarios.id = auth.uid()
    or public.perfil_do_usuario(auth.uid()) = 'master'
    or (
      public.perfil_do_usuario(auth.uid()) in ('gerente', 'parceiro_externo')
      and usuarios.id in (select public.ids_da_equipe(auth.uid()))
    )
  )
);

-- INSERT (usado na Fase 1: gerente/parceiro cadastra a própria equipe,
-- master cadastra qualquer pessoa da empresa)
drop policy if exists usuarios_insert_hierarquia on public.usuarios;
create policy usuarios_insert_hierarquia
on public.usuarios
for insert
to authenticated
with check (
  usuarios.empresa_id = public.empresa_do_usuario(auth.uid())
  and (
    public.perfil_do_usuario(auth.uid()) = 'master'
    or usuarios.reports_to_id = auth.uid()
  )
);

-- UPDATE (quem está na subárvore de quem edita)
drop policy if exists usuarios_update_hierarquia on public.usuarios;
create policy usuarios_update_hierarquia
on public.usuarios
for update
to authenticated
using (
  usuarios.empresa_id = public.empresa_do_usuario(auth.uid())
  and usuarios.id in (select public.ids_da_equipe(auth.uid()))
);

-- DELETE (apenas master, dentro da própria empresa)
drop policy if exists usuarios_delete_master on public.usuarios;
create policy usuarios_delete_master
on public.usuarios
for delete
to authenticated
using (
  usuarios.empresa_id = public.empresa_do_usuario(auth.uid())
  and public.perfil_do_usuario(auth.uid()) = 'master'
);

-- EMPRESAS: cada usuário só vê a própria empresa. Insert/delete fica só para
-- service_role (seed/admin), update é do master da própria empresa.
drop policy if exists empresas_select_propria on public.empresas;
create policy empresas_select_propria
on public.empresas
for select
to authenticated
using (id = public.empresa_do_usuario(auth.uid()));

drop policy if exists empresas_update_master on public.empresas;
create policy empresas_update_master
on public.empresas
for update
to authenticated
using (
  public.perfil_do_usuario(auth.uid()) = 'master'
  and id = public.empresa_do_usuario(auth.uid())
);

-- ---------------------------------------------------------------------------
-- 5) GRANTS explícitos (não depender do default do projeto)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on public.empresas to authenticated, service_role;
grant select, insert, update, delete on public.usuarios to authenticated, service_role;
