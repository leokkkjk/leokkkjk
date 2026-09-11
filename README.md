# Plataforma Interna — Correspondente Bancário

**Fase 0**, migrada para o **Supabase**: autenticação por e-mail/senha no
Supabase Auth, 4 perfis, hierarquia (`reports_to_id`) e visibilidade aplicada
por **RLS no Postgres** — não pela tela.

## Arquitetura desta fase

| Camada | O quê |
| --- | --- |
| Auth | Supabase Auth (GoTrue) + `@supabase/ssr` (App Router) |
| Dados | Postgres do Supabase via PostgREST (`supabase-js`), sempre com o JWT do usuário logado |
| Permissão | RLS: policy `usuarios_select_hierarquia` (o banco devolve só o que pode) |
| Rota | `src/proxy.ts` — guarda grossa por perfil; a linha fina é o RLS |
| Schema | `supabase/migrations/*.sql` (SQL direto). Drizzle fica só como espelho tipado |

**Não existe mais auth caseira**: nada de hash próprio, token HMAC ou tabela de
sessão. O Drizzle deixou de ser usado em runtime — só para tipo/migração.

### Regra de visibilidade (continua a mesma da Fase 0)

| Perfil | Vê |
| --- | --- |
| Master | todos os usuários da própria empresa |
| Parceiro Externo | a si mesmo + toda a sua descendência |
| Gerente | a si mesmo + toda a sua descendência |
| Vendedor | apenas a si mesmo |

`usuarios.id = auth.users.id` (mesmo UUID, FK com `on delete cascade`).

## Setup

```bash
# 1) .env.local  (as duas secrets abaixo vieram como placeholder no brief)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # única chave que vai ao browser
SUPABASE_SERVICE_ROLE_KEY=...            # painel > Settings > API > service_role
SUPABASE_DB_URL=...                      # painel > Settings > Database > URI

# 2) criar tabelas + policies (idempotente)
node scripts/aplicar-migracoes.ts

# 3) criar os logins e popular empresas/usuarios
node scripts/seed.ts

# 4) provar a matriz de visibilidade (não precisa de nenhuma secret)
node scripts/teste-rls.ts

# 5) rodar a aplicação
npm run build && npm run start
```

### Sem as secrets ainda?

Dá para validar as policies num Postgres comum, sem Supabase e sem Docker:

```bash
node scripts/aplicar-migracoes.ts --local        # cria harness auth + policies
node scripts/seed.ts --local
node scripts/teste-rls.ts --modo=rls
```

O harness (`supabase/local/habilitar-local.sql`) cria o schema `auth`, a função
`auth.uid()` e os papéis `anon`/`authenticated`/`service_role`. O teste conecta
como `authenticated` e faz `set_config('request.jwt.claim.sub', ...)` — que é
exatamente o que o PostgREST faz no Supabase. As **mesmas** policies são
testadas nos dois cenários.

## Matriz validada

| Logado como | Deve ver | NÃO deve ver | Resultado |
| --- | --- | --- | --- |
| M1 (master) | 8 usuários da empresa 1 | qualquer usuário da empresa 2 | **PASS** |
| G1 (gerente) | a si + V1 + V2 | V3, V4, PX, G2, M1 | **PASS** |
| G2 (gerente) | a si + V3 | V1, V2, M1 | **PASS** |
| V1 (vendedor) | apenas a si | qualquer outro | **PASS** |
| PX (parceiro) | a si + V4 | V1, V2, V3, G1, G2, M1 | **PASS** |
| M2 (master) | 2 usuários da empresa 2 | qualquer usuário da empresa 1 | **PASS** |

Extras: **V1 buscando o id de V3 → 0 linhas**; **M1 buscando o id de M2 → 0
linhas**; `relrowsecurity = true` em todas as tabelas públicas. Tudo PASS.

## Usuários de teste

| E-mail | Senha | Papel |
| --- | --- | --- |
| master1@demo.com | master123 | M1 · Master (empresa 1) |
| gerente1@demo.com | gerente123 | G1 · Gerente equipe A |
| gerente2@demo.com | gerente123 | G2 · Gerente equipe B |
| vendedor1@demo.com | vendedor123 | V1 · Vendedor |
| vendedor2@demo.com | vendedor123 | V2 · Vendedor |
| vendedor3@demo.com | vendedor123 | V3 · Vendedor (equipe B) |
| parceiro@demo.com | parceiro123 | PX · Parceiro externo |
| vendedor4@demo.com | vendedor123 | V4 · Equipe do parceiro |
| master2@outra.com | master123 | M2 · Master (empresa 2) |
| vendedor5@outra.com | vendedor123 | V5 · Empresa 2 |

## Regras de segurança

- `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` vivem **só** em `.env.local`,
  em `scripts/` e em código de servidor. Nunca com prefixo `NEXT_PUBLIC_`, nunca
  em componente de cliente.
- A única chave no browser é a anon/publishable.
- Nenhuma tabela pública sem RLS; nenhuma policy que ignore `empresa_id`.

## Estrutura

```
src/
  app/
    (app)/{master,gerente,vendedor,parceiro-externo}/page.tsx  # página por perfil
    api/usuarios/route.ts     # visibilidade em JSON (RLS aplicando)
    api/health/route.ts
    actions/auth.ts           # signInWithPassword / signOut
    login/                    # formulário (client) + página (server)
  components/                 # painel de visibilidade + avisos
  lib/
    supabase/{client,server,middleware}.ts   # @supabase/ssr
    hierarquia.ts             # SELECT simples; quem filtra é o RLS
    usuario-atual.ts          # auth.getUser() + linha de `usuarios`
    perfil.ts                 # catálogo de perfis/rotas/permissões
  proxy.ts                    # guarda grossa de rota por perfil
  db/schema.ts                # espelho tipado (empresas, usuarios)
supabase/
  migrations/0001_fase0.sql   # fonte da verdade: tabelas + funções + policies
  local/                      # harness e reset (não roda no Supabase)
scripts/
  aplicar-migracoes.ts        # aplica migrations (--local para o harness)
  seed.ts                     # auth.admin.createUser + empresas/usuarios
  teste-rls.ts                # matriz de visibilidade (--modo=api|--modo=rls)
```

## Fora do escopo desta fase

Dashboard visual (Fase 6), gestão de equipes (Fase 1), comissões (Fase 2),
leads (Fase 3), materiais (Fase 4), automação dos portais Nexo/BV (Fase 5).
