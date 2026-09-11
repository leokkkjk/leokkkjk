# Log de Progresso do Projeto

> **Instrução para o GLM Code:** ao final de cada sessão de trabalho (ou sempre que fechar uma etapa, mesmo que a sessão continue), adicione uma nova entrada no TOPO deste arquivo, seguindo exatamente o formato abaixo. Nunca apague entradas antigas — este arquivo é o histórico completo do projeto. Sempre que iniciar uma nova sessão, leia as entradas mais recentes antes de começar a trabalhar, para saber exatamente onde o projeto parou.

---

## Formato de cada entrada

```
### [DATA] [HORA] — [Nome curto da sessão/tarefa]

**Fase:** (0, 1, 2...)

**O que foi feito:**
- item 1
- item 2

**Arquivos criados/alterados:**
- caminho/do/arquivo1
- caminho/do/arquivo2

**Decisões técnicas tomadas durante a implementação** (coisas não previstas no brief, que precisaram de uma escolha na hora):
- decisão 1 e por quê

**Pendências / não terminado:**
- item pendente 1

**Desvios do que foi combinado no brief, se houver:**
- nenhum / ou descreva

---
```

## Histórico

### 11/09/2026 05:29 — Migração da Fase 0 para o Supabase (Auth + RLS de verdade)

**Fase:** 0 (migração de ambiente — não é fase nova)

**O que foi feito:**
- Schema portado para o Supabase por SQL direto (`supabase/migrations/0001_fase0.sql`), idempotente: enum `perfil_usuario`, `empresas`, `usuarios` com **`id` = `auth.users.id`** (FK, `on delete cascade`, sem default). Nenhuma tabela de sessão
- Toda a infra de auth caseira foi **deletada**: hash de senha próprio, token HMAC assinado, cookie de sessão, tabela no banco. `grep -rn "scrypt\|sessoes" src/ scripts/ supabase/` retorna **zero**
- Auth substituída por **Supabase Auth com `@supabase/ssr`**: client browser, client server e refresco de sessão no proxy (`src/lib/supabase/{client,server,middleware}.ts`)
- Consultas de runtime migradas para `supabase-js` **com o JWT do usuário logado** → o RLS passa a valer de verdade. Drizzle deixou de ser usado em runtime
- `src/proxy.ts` reescrito: guarda grossa de rota por perfil lendo a sessão do Supabase (e o perfil consultando `usuarios` com a sessão do próprio usuário). Defesa em profundidade mantida em `requireUsuario()` / `requirePerfil()`
- Policies RLS revisadas e aplicadas a partir do antigo rascunho `docs/rls-supabase.sql`, que foi absorvido pela migration e removido (para não existir duas fontes da verdade)
- `scripts/seed.ts`: cria logins via `auth.admin.createUser` + popula `empresas`/`usuarios` com service role (idempotente: reusa login já existente e reseta a senha). Elenco exato do brief: M1, G1, V1, V2, G2, V3, PX, V4 / M2, V5
- `scripts/teste-rls.ts`: matriz de visibilidade com dois modos — `api` (end-to-end, login real + PostgREST, sem secrets) e `rls` (direto no Postgres imitando o PostgREST)
- `scripts/aplicar-migracoes.ts`: aplica as migrations por `SUPABASE_DB_URL`, ou `--local` no Postgres comum
- Harness local (`supabase/local/`) para validar as **mesmas** policies sem Supabase e sem Docker: cria schema `auth`, `auth.uid()` e os papéis `anon`/`authenticated`/`service_role`
- Diagnóstico no login: detecta se as tabelas ainda não existem no projeto Supabase (erro `PGRST205` via anon key) e mostra o passo a passo pendente

**Resultado da matriz (modo `rls`: Postgres real, papel non-superuser + `request.jwt.claim.sub`):**

| Logado como | Vê | NÃO vê | Resultado |
|---|---|---|---|
| M1 (master) | 8 da empresa 1 | qualquer um da empresa 2 | PASS |
| G1 (gerente) | a si + V1 + V2 | V3, V4, PX, G2, M1 | PASS |
| G2 (gerente) | a si + V3 | V1, V2, M1 | PASS |
| V1 (vendedor) | apenas a si | qualquer outro | PASS |
| PX (parceiro) | a si + V4 | V1, V2, V3, G1, G2, M1 | PASS |
| M2 (master) | 2 da empresa 2 | qualquer um da empresa 1 | PASS |

Extras: **V1 buscando o id de V3 → 0 linhas (PASS)**; **M1 buscando o id de M2 →
0 linhas (PASS)**; `relrowsecurity = true` em `empresas` e `usuarios` (PASS).
Total: **TODOS OS CHECKS PASSARAM**.

**Arquivos criados/alterados:**
- `supabase/migrations/0001_fase0.sql` (novo — fonte da verdade: tabelas + funções + policies + grants)
- `supabase/local/habilitar-local.sql` (novo — harness de auth local)
- `supabase/local/reset-local.sql` (novo — reset descartável do schema public)
- `scripts/aplicar-migracoes.ts` (novo)
- `scripts/seed.ts` (novo — substitui `scripts/seed.mjs`)
- `scripts/teste-rls.ts` (novo — substitui `scripts/verificar-fase0.mjs`)
- `scripts/_env.ts` (novo — carregador de `.env` / `.env.local`)
- `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts` (novos)
- `src/lib/usuario-atual.ts` (novo — substitui `src/lib/auth/atual.ts`)
- `src/lib/hierarquia.ts` (reescrito: SELECT simples, quem filtra é o RLS)
- `src/lib/perfil.ts` (regra de perfis preservada, sem redesenho)
- `src/proxy.ts` (reescrito)
- `src/app/actions/auth.ts` (reescrito com `signInWithPassword` / `signOut`)
- `src/app/login/page.tsx`, `src/app/login/formulario.tsx` (diagnóstico + elenco novo)
- `src/app/api/usuarios/route.ts`, `src/app/api/health/route.ts` (reescritos)
- `src/components/painel-visibilidade.tsx` (passou a informar que quem filtra é o RLS)
- `src/db/schema.ts` (reescrito: `usuarios.id` referencia `auth.users`, sem tabela de sessão)
- `.env` (removido o segredo de assinatura de sessão)
- `.env.local` (novo — URL + anon key reais; as duas secrets ficaram com placeholder)
- `tsconfig.json` (adicionado `allowImportingTsExtensions`, necessário para os scripts TS)
- `README.md` (reescrito)
- `CONTEXTO.md` (arquitetura vigente, status das credenciais, log movido para cá)
- `PROGRESSO.md` (novo — o log passou a viver aqui)
- **Removidos:** `src/lib/auth/{senha,token,sessao,atual}.ts`, `docs/rls-supabase.sql`, `scripts/seed.mjs`, `scripts/verificar-fase0.mjs`

**Decisões técnicas tomadas durante a implementação** (coisas não previstas no brief, que precisaram de uma escolha na hora):
- **SQL direto no lugar de `drizzle-kit push` para o Supabase.** O `drizzle-kit` tentaria criar o schema `auth`, que no Supabase é administrado pelo próprio serviço (permissão negada). O brief já autorizava "drizzle-kit ou SQL direto"; o Drizzle ficou como espelho tipado
- **Harness local que imita o PostgREST.** Como as duas secrets vieram como placeholder, criei um Postgres local com schema `auth`, função `auth.uid()` lendo `request.jwt.claim.sub` e papéis `anon`/`authenticated`/`service_role`. Assim as MESMAS policies foram testadas de verdade — conectando como `authenticated` (non-superuser, sem `bypassrls`) — em vez de entregar policies "não verificadas"
- **`SET LOCAL ROLE authenticated` + `set_config('request.jwt.claim.sub', …)`** no teste, porque `SET` não aceita parâmetro bindado; `set_config(..., true)` é o equivalente transacional
- **Funções do RLS como `SECURITY DEFINER` com `search_path` fixo.** Sem isso o Postgres aborta com "infinite recursion detected in policy", porque a policy de `usuarios` precisa consultar a própria tabela `usuarios`. Foi o ponto mais delicado da revisão do rascunho
- **Profundidade da hierarquia calculada em JavaScript** a partir do `reports_to_id` dentro do conjunto que o RLS devolveu, em vez de CTE via REST: mantém o SELECT simples e o banco como único filtro
- **Perfil consultado em `usuarios` dentro do proxy**, com a sessão do próprio usuário: dado sempre fresco, sem depender de `app_metadata` desatualizado no JWT
- **Seed idempotente**: se o login já existe no Supabase Auth, recupera o `id` via `listUsers` e reseta a senha com `updateUserById`, em vez de falhar
- **Diagnóstico de schema no login**: chamada pública (anon key) ao `/rest/v1/usuarios`; o código `PGRST205` indica tabela inexistente. Sem isso o desenvolvedor veria apenas "e-mail ou senha inválidos" sem entender o porquê
- **`/api/health` híbrido**: reporta Supabase (dependência de runtime) e o Postgres local (banco de migração deste ambiente); `ok` é true se qualquer um responder
- **`allowImportingTsExtensions` no tsconfig** para os scripts compartilharem `scripts/_env.ts` importando com extensão `.ts` (o Node 22 exige a extensão explícita ao ler TypeScript nativamente)

**Pendências / não terminado:**
- **BLOQUEIO PRINCIPAL: `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` vieram como placeholder no brief.** Sem elas não é possível criar as tabelas nem os logins no projeto real. Quando chegarem, rodar nesta ordem:
  1. `node scripts/aplicar-migracoes.ts` (cria tabelas + policies)
  2. `node scripts/seed.ts` (cria os 10 logins)
  3. `node scripts/teste-rls.ts` (matriz no modo `api`, end-to-end de verdade)
- O modo `api` do teste foi escrito mas **não executado** (depende dos logins existirem no Supabase). O modo `rls`, que exercita as mesmas policies, passou 100%
- O caminho "Supabase fora do ar" do proxy (`try/catch` em volta de `getUser()`) não foi testado com o serviço realmente caído
- Confirmar no painel do Supabase se **signup público está desligado** (o seed usa `auth.admin`; signup aberto permitiria criar login órfão sem linha em `usuarios`)

**Desvios do que foi combinado no brief, se houver:**
- **Migration executada em Postgres local, não no Supabase.** O brief pedia "porte o schema via SUPABASE_DB_URL", mas a connection string veio como `[cole aqui…]`. O SQL está pronto e idempotente; o que faltou foi a credencial. Reportado como bloqueio, não contornado
- **`docs/rls-supabase.sql` foi absorvido pela migration e removido.** O brief mandava "revisar e aplicar" — aplicar significou promovê-lo a migration, evitando duas versões da mesma policy
- **Teste da matriz executado no modo banco (`rls`), não no modo API.** Mesmas policies, mesmo resultado esperado; o modo API está pronto e será o executável assim que o seed rodar no Supabase
- **Tabela `auth.users` declarada em `src/db/schema.ts`** (espelho tipado). O brief dizia "nenhuma tabela nova além de empresas e usuarios" — não é uma tabela do sistema, é a referência necessária para a FK de `usuarios.id` existir no modelo tipado; no banco real ela já existe e o SQL não a cria

---
### 11/09/2026 04:19 — Fase 0: login, 4 perfis, hierarquia e visibilidade

**Fase:** 0

**O que foi feito:**
- Modelo de dados criado no Drizzle e aplicado no Postgres (`npx drizzle-kit push`): `empresas`, `usuarios` (com `perfil` enum, `reports_to_id` auto-referência, `empresa_id`) e `sessoes`
- Autenticação por e-mail + senha funcionando: hash scrypt, cookie de sessão httpOnly assinado com HMAC-SHA256 (`AUTH_SECRET` no `.env`), logout que revoga a sessão no banco
- Proteção de rota por perfil em `src/proxy.ts` (novo nome do `middleware` no Next 16 — o nome antigo está deprecado): sem sessão → `/login`; perfil errado → volta pra própria rota com aviso
- Defesa em profundidade: além do proxy, `requirePerfil()` revalida dentro de cada página
- Regra de visibilidade centralizada em `src/lib/hierarquia.ts` (CTE recursiva no banco): master vê toda a empresa; parceiro externo e gerente veem self + descendência; vendedor vê só ele. Sempre filtrado por `empresa_id`
- Página mínima por perfil (`/master`, `/parceiro-externo`, `/gerente`, `/vendedor`), cada uma com o "PainelVisibilidade" que lista quem aquele login enxerga
- `GET /api/usuarios` devolve em JSON exatamente os usuários visíveis (401 sem sessão)
- Seed com 10 usuários fake em 2 empresas, incluindo 2 gerentes com equipes distintas, 1 parceiro externo com equipe própria e um master de outra empresa (prova de isolamento multi-tenant)
- Script de verificação automatizada (`scripts/verificar-fase0.mjs`) que valida o critério de "pronto" do brief via HTTP de verdade: **todos os checks passaram**
- `docs/rls-supabase.sql` com as políticas RLS equivalentes prontas para a migração ao Supabase

**Arquivos criados/alterados:**
- `src/db/schema.ts`
- `src/db/index.ts` (não alterado — já existia)
- `src/lib/perfil.ts`
- `src/lib/auth/senha.ts`
- `src/lib/auth/token.ts`
- `src/lib/auth/sessao.ts`
- `src/lib/auth/atual.ts`
- `src/lib/hierarquia.ts`
- `src/proxy.ts`
- `src/app/actions/auth.ts`
- `src/app/login/page.tsx`
- `src/app/login/formulario.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/master/page.tsx`
- `src/app/(app)/gerente/page.tsx`
- `src/app/(app)/vendedor/page.tsx`
- `src/app/(app)/parceiro-externo/page.tsx`
- `src/components/painel-visibilidade.tsx`
- `src/components/aviso-sem-permissao.tsx`
- `src/app/api/usuarios/route.ts`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `.env` (adicionado `AUTH_SECRET`)
- `scripts/seed.mjs`
- `scripts/verificar-fase0.mjs`
- `docs/rls-supabase.sql`
- `README.md`
- `CONTEXTO.md` (status da Fase 0 → CONCLUÍDO + esta entrada)

**Decisões técnicas tomadas durante a implementação** (coisas não previstas no brief, que precisaram de uma escolha na hora):
- **Postgres local + Drizzle no lugar do Supabase** (o ambiente do piloto entrega isso). O modelo de tabelas é idêntico ao previsto; auth e isolamento ficaram na camada de aplicação. Registrado em seção própria acima
- **RLS escrita mas não aplicada no piloto**: o acesso local é pelo papel `postgres` (superusuário), que ignora RLS. Aplicar ali seria segurança de fachada. A regra então ficou em um único arquivo de aplicação (`src/lib/hierarquia.ts`) e as policies equivalentes foram documentadas em `docs/rls-supabase.sql` com funções `SECURITY DEFINER` (para escapar da recursão "policy consultando a própria tabela")
- **Tabela extra `sessoes`** (fora do brief, que pedia só `empresas` e `usuarios`): necessária para logout/revogação funcionar de verdade
- **scrypt do `node:crypto`** para hash de senha, em vez de bcrypt: mesmo nível de segurança sem nova dependência
- **`src/proxy.ts` em vez de `middleware.ts`**: no Next 16 o `middleware` está deprecado (aparece warning no build). Mesma lógica, só o nome do arquivo e da função mudaram
- **shadcn/ui não instalado**: nenhuma tela da Fase 0 precisa de componente além de Tailwind puro. Fica para quando houver UI de verdade (Fase 6). Precisa ser alinhado com o Idealizador se isso conta como desvio do combinado
- **Assinatura do cookie via Web Crypto (`crypto.subtle`)** em vez de `node:crypto`: o mesmo arquivo de token precisa funcionar no proxy e no servidor
- **Acesso direto à sessão em `/api/usuarios`**: adicionado para poder validar o isolamento de forma automatizada, sem depender de olhar a tela

**Pendências / não terminado:**
- Nada da Fase 0. Próximo passo é a **Fase 1** (gestão de equipes: gerente cadastra vendedor e define comissão dele)
- Ao migrar para o Supabase Cloud: aplicar `docs/rls-supabase.sql`, trocar a auth própria pelo GoTrue e remover a tabela `sessoes`
- `AUTH_SECRET` está com valor de desenvolvimento no `.env` local — precisa de valor aleatório forte no deploy
- Falta decidir (com o Idealizador) se a criação do primeiro Master continua sendo seed manual quando o ambiente for o Supabase

**Desvios do que foi combinado no brief, se houver:**
- Ambiente: Postgres local + Drizzle em vez de Supabase (detalhado acima) — sem impacto no modelo de dados
- shadcn/ui não foi instalado nesta fase (detalhado acima)
- Tabela `sessoes` adicionada além de `empresas`/`usuarios` (detalhado acima)

---
