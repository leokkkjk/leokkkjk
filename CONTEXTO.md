# CONTEXTO DO PROJETO — cole isso no início de qualquer chat novo (idealização ou geração de código)

## Quem sou eu (desenvolvedor)
Estou construindo esse sistema via "vibe coding" (desenvolvimento assistido por IA), sou iniciante, ainda sem histórico/portfólio consolidado. Por isso o projeto está sendo cobrado do cliente em fases pequenas e baratas no início, para construir confiança antes de cobrar valores maiores.

## Quem é o cliente
Dono de uma operação de correspondente bancário / equipe de vendas ligada a promotoras de crédito (trabalha com pelo menos duas promotoras: **Nexo** e **BV**). Ele tem uma equipe de vendedores e gerentes, e também parceiros externos com equipes próprias e comissão diferenciada.

## O que ele pediu (consolidado de vídeo + áudios que ele mandou)

Não é só uma "calculadora de comissão" — é uma **plataforma interna completa**, com:

1. **Hierarquia de 4 perfis:**
   - **Master** (o cliente) — acesso total a tudo
   - **Parceiro Externo** — tem equipe própria, comissão diferenciada e configurável
   - **Gerente** — gerencia sua equipe: cadastra vendedores, vê quanto cada um ganha, define comissão de cada vendedor
   - **Vendedor** — vê produtos, comissões, leads recebidos, materiais de estudo

2. **CRM + Leads** — Master distribui leads para vendedores trabalharem

3. **Central de materiais de estudo** — área de conteúdo/treinamento para vendedores

4. **Motor de comissões** — cada perfil vê quanto tem a receber; gerente/master configuram % por pessoa/perfil/produto

5. **Integração com portais das promotoras (o ponto mais delicado):**
   - **Nexo**: só precisa de 1 senha para acessar a "conta corrente" (comissão a receber) em "lista de coeficiente de comissão"
   - **BV**: precisa de 2 senhas — login normal + uma "senha de relatório" separada, na área de tabela de comissão
   - O cliente quer que o sistema **consulte automaticamente** esses portais e traga o valor de comissão de cada vendedor/gerente
   - Ele **não quer** trazer: usuários do banco, opção de "pedir novo contrato", valor de operação (por enquanto)
   - Ele **quer** trazer: conta corrente (quanto tem pra receber) e contratos digitados
   - Referência visual: ele gostou do dashboard da BV (mais bonito, visual chamativo, mostra produção) mais do que o da Nexo

## Decisão de arquitetura tomada (importante para o GLM seguir)

**Não construir a automação dos portais (scraping/RPA) primeiro.** A ordem certa é:
1. Primeiro, construir o sistema com **lançamento manual/importação** dos valores de comissão (tela onde alguém digita ou sobe uma planilha)
2. Depois, quando essa base estiver estável, plugar um "conector" de automação por cima que preenche essa mesma tabela sozinho

Isso porque a automação de login em portal de terceiro é frágil (quebra quando o site muda de layout), tem risco de segurança (guardar senha de terceiros) e possível questão de termos de uso — não deve ser a fundação do sistema.

## Stack técnica decidida

- **Frontend + Backend:** Next.js (App Router)
- **Banco de dados + Auth:** Supabase (Postgres + autenticação + row-level security para separar o que cada perfil vê)
- **Storage:** Supabase Storage (materiais de estudo, arquivos)
- **Automação dos portais (fase futura):** worker separado com Playwright, fora do processo principal da aplicação

## Arquitetura de auth/permissão vigente (Fase 0 migrada para o Supabase)

**Estado atual: autenticação e permissão são do Supabase.** A versão caseira da
Fase 0 foi inteiramente removida do código (`grep -rn "scrypt\|sessoes" src/ scripts/ supabase/`
retorna zero).

- **Auth:** Supabase Auth (GoTrue) via `@supabase/ssr` — `src/lib/supabase/{client,server,middleware}.ts`.
- **Identidade:** `usuarios.id = auth.users.id` (mesmo UUID, FK com `on delete cascade`).
- **Permissão:** RLS no Postgres, aplicado de verdade, porque toda consulta de
  runtime sai pelo PostgREST com o JWT do usuário logado (papel `authenticated`).
  Policy central: `usuarios_select_hierarquia`.
- **Rota:** `src/proxy.ts` é só a guarda grossa por perfil; a linha fina é o RLS.
- **Fonte da verdade do schema:** `supabase/migrations/0001_fase0.sql` (SQL
  direto, idempotente). O Drizzle ficou como espelho tipado (`src/db/schema.ts`)
  e não é usado em runtime.
- **Funções auxiliares do RLS** (`empresa_do_usuario`, `perfil_do_usuario`,
  `ids_da_equipe`) são `SECURITY DEFINER` com `search_path` fixo: sem isso o
  Postgres aborta com "infinite recursion detected in policy", porque a policy
  de `usuarios` precisa consultar a própria tabela `usuarios`.
- **Nada de tabela de sessão própria:** quem expira/revoga é o Supabase Auth.

### Situação das credenciais do Supabase (bloqueio em 11/09)

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão no `.env.local`
  e **funcionam** (o projeto responde: GoTrue health 200, PostgREST ativo).
- `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` vieram **como placeholder** no
  brief. Sem elas não é possível criar as tabelas nem os logins no projeto real.
- O que já foi feito sem as secrets: as policies e a matriz de visibilidade
  foram **validadas num Postgres real** com um harness que imita o PostgREST
  (`supabase/local/`), com papel non-superuser + `request.jwt.claim.sub`.
  Resultado: matriz 100% PASS, incluindo acesso por ID direto e
  `relrowsecurity = true`.
- Passo a passo quando as secrets chegarem: `node scripts/aplicar-migracoes.ts`
  → `node scripts/seed.ts` → `node scripts/teste-rls.ts` (modo api, end-to-end).

## Modelo de dados inicial (entidades centrais)

- `empresas` (multi-tenant, mesmo que hoje seja só 1 cliente)
- `usuarios` (campo `perfil`: master / parceiro_externo / gerente / vendedor; campo `reports_to_id` para hierarquia)
- `regras_comissao` (percentual, por perfil, por produto, por promotora)
- `leads`
- `materiais_estudo`
- `lancamentos_comissao` (dado bruto vindo de cada promotora — manual no início, depois automático)
- `calculos_repasse` (resultado do motor de cálculo, por pessoa/período)
- `sessoes` (adicionada na Fase 0 — fora do brief, necessária para logout/revogação de sessão)

## Fases do projeto (ordem de construção)

| Fase | O que entrega | Status |
|---|---|---|
| 0 | Login + 4 perfis + hierarquia + permissões de visibilidade | **CONCLUÍDO** |
| 1 | Gestão de equipes (gerente cadastra vendedor, define comissão) | A FAZER |
| 2 | Motor de comissões com lançamento manual + regras + extrato | A FAZER |
| 3 | CRM e distribuição de leads | A FAZER |
| 4 | Central de materiais de estudo | A FAZER |
| 5 | Automação dos portais Nexo e BV (robô sob demanda, depois agendado) | A FAZER (por último, de propósito) |
| 6 | Dashboards e relatórios visuais | A FAZER |

*(Atualize a coluna "Status" conforme for avançando: A FAZER / EM ANDAMENTO / CONCLUÍDO)*

## Combinado comercial com o cliente

- Primeira entrega (Fase 0 + Fase 1) fechada em **R$ 2.500**, como projeto piloto para construir confiança
- As fases seguintes serão orçadas separadamente, como projetos novos, depois que a primeira entrega for validada
- A automação das promotoras (Fase 5) deve ser vendida à parte, com uma manutenção mensal específica, porque exige manutenção contínua (o robô quebra quando o portal da promotora muda)

## Riscos já identificados (não esquecer)

- Guardar senha de login de terceiros (Nexo/BV) no sistema exige criptografia e cuidado extra
- Sistema vai lidar com dados de comissão/financeiro e dados de cliente via CRM — considerar LGPD desde o modelo de dados
- Cliente tende a ir pedindo mais coisas durante a conversa — fechar por escrito o que está incluso em cada fase antes de começar

## Microdecisões técnicas da Fase 0 (travadas em 11/09)

| Decisão | Escolha |
|---|---|
| Método de login | E-mail + senha |
| Criação do primeiro Master | Seed manual direto no painel do Supabase (sem tela de onboarding no piloto) |
| UI | Tailwind + shadcn/ui |
| Deploy | Vercel + Supabase Cloud |

## Microdecisões adicionais tomadas na implementação da Fase 0 (histórico)

> As quatro primeiras linhas descrevem a versão caseira, que foi **substituída**
> na migração para o Supabase. Estão aqui porque o protocolo manda preservar a
> história — o código correspondente não existe mais.

| Decisão | Escolha | Situação |
|---|---|---|
| Hash de senha próprio | biblioteca padrão do Node | **Removido** — agora é Supabase Auth |
| Sessão própria | cookie assinado + tabela no banco | **Removido** — agora é Supabase Auth |
| Proteção de rota | `src/proxy.ts` (novo nome do `middleware` no Next 16, que deprecou o antigo) | **Vigente** — proxy é guarda grossa; RLS é a linha fina |
| shadcn/ui | não instalado nesta fase; só Tailwind puro | **Vigente** — UI elaborada é Fase 6 |
| Rota-base por perfil | `/master`, `/parceiro-externo`, `/gerente`, `/vendedor` | **Vigente** |
| Visibilidade | RLS no Postgres (`usuarios_select_hierarquia`), consultas de runtime via `supabase-js` com o JWT do usuário | **Vigente** (desde a migração) |
| Schema no Supabase | SQL direto (`supabase/migrations/*.sql`) em vez de `drizzle-kit push` | `drizzle-kit` tentaria criar o schema `auth`, que no Supabase é administrado pelo serviço (permissão negada) |
| Profundidade na hierarquia | calculada em JS a partir do `reports_to_id` dentro do conjunto que o RLS devolveu | evita CTE via REST e mantém o SELECT simples |
| Perfil do usuário no proxy | consultado em `usuarios` com a sessão do próprio usuário | dado sempre fresco, sem depender de claim desatualizado no JWT |
| Scripts em TypeScript | `node scripts/*.ts` (Node 22 lê TS nativamente) + `allowImportingTsExtensions` no tsconfig | evita dependência extra (tsx) e mantém os scripts tipados |

## Alerta de escopo ativo (repetir para o GLM Code sempre que relevante)

O dashboard visual estilo BV (gráficos, produção, visual "bonito") é **Fase 6**, não Fase 0. A Fase 0 entrega só autenticação, perfis e permissões de visibilidade (RLS) — sem preocupação estética além do funcional. Se o cliente pedir dashboard antes da hora, isso é trabalho fora do escopo de R$ 2.500 e não deve ser feito sem repactuar.

---

## Protocolo de handoff entre Idealizador e Código

Este projeto usa dois chats de IA separados (um GLM para idealizar, um GLM para gerar código), com o desenvolvedor + Claude fazendo a ponte entre os dois. Para isso não virar bagunça, seguir sempre este ciclo:

**1. Idealizador decide** → produz um plano/decisão (como o bloco de Fase 0 acima)

**2. Ponte (dev + Claude) traduz em "Brief de Código"** → um resumo curto e prático, só com o que o coder precisa saber pra executar aquela etapa específica — não o histórico todo do projeto. Formato:
   - O que construir agora (escopo fechado dessa sessão)
   - O que NÃO construir agora (fora de escopo, mesmo que pareça óbvio)
   - Decisões técnicas já travadas que afetam essa etapa
   - Critério de "pronto" (o que precisa funcionar pra considerar a etapa concluída)

**3. GLM Code executa** e, ao final da sessão (antes de fechar por token ou por ter terminado), preenche um **Relatório Técnico de Retorno**, formato fixo:
   - Arquivos criados/alterados (lista de caminhos)
   - Decisões técnicas tomadas durante a implementação que não estavam no brief (ex: "usei X biblioteca pra resolver Y")
   - O que ficou pendente ou não terminado
   - Qualquer desvio do brief original e por quê

**4. Esse Relatório Técnico volta pro dev**, que atualiza a tabela de Status das Fases neste `CONTEXTO.md` e leva qualquer decisão nova pro Idealizador na próxima rodada, fechando o ciclo.

Isso garante que o Idealizador nunca precisa saber detalhe de código, e o Coder nunca precisa saber o histórico de negociação/negócio — cada um recebe só o que precisa pra fazer sua parte, e o `CONTEXTO.md` é o único lugar que sabe a história completa.

---

## Instrução para o assistente que ler este contexto

Ao continuar este projeto em qualquer chat novo (idealização ou geração de código), siga as decisões já tomadas acima. Se for necessário tomar uma nova decisão de arquitetura ou escopo, atualize este arquivo `CONTEXTO.md` (ou peça para o desenvolvedor atualizar) antes de prosseguir, para manter a continuidade entre sessões.

---

## Brief de Código — Fase 0 (pronto para colar no GLM Code)

**O que construir agora:**
1. Setup do projeto Next.js (App Router) + conexão com Supabase
2. Migração SQL com as tabelas `empresas` e `usuarios` (usuarios com campos: perfil [master/parceiro_externo/gerente/vendedor], reports_to_id, empresa_id)
3. Autenticação por e-mail e senha (login/logout)
4. Políticas RLS: cada usuário só vê a si mesmo e quem está abaixo dele na hierarquia (via reports_to_id); master vê todos da própria empresa
5. Middleware de rotas protegidas por perfil
6. Uma página mínima (só texto/placeholder) por perfil, só para confirmar que o roteamento e a permissão funcionam

**O que NÃO construir agora:**
- Nenhum dashboard visual, gráfico ou estilo elaborado — isso é Fase 6
- Nenhuma tela de onboarding/cadastro do primeiro Master — ele será criado via seed manual no painel do Supabase
- Nenhuma tabela além de `empresas` e `usuarios` (leads, comissões, materiais entram nas fases seguintes)
- Nenhuma automação com Nexo/BV

**Decisões técnicas travadas que afetam esta etapa:**
- Next.js (App Router) + Supabase (Postgres + Auth + RLS)
- Login por e-mail/senha (não usar magic link)
- Tailwind + shadcn/ui para os componentes
- Deploy alvo: Vercel + Supabase Cloud

**Critério de "pronto" desta etapa:**
- Existem usuários fake dos 4 perfis no banco (pode ser via seed/script)
- Login funciona para cada um
- Um gerente de teste, ao logar, só enxerga (via política RLS) a si mesmo e os usuários que reportam pra ele — não enxerga usuários de outra equipe
- O master, ao logar, enxerga todos os usuários da empresa

**Ao final, retornar o Relatório Técnico** (arquivos criados, decisões tomadas na prática, pendências, desvios do brief).

---

## Log de Progresso

O histórico completo das sessões de trabalho, com os Relatórios Técnicos de
Retorno, vive em [`PROGRESSO.md`](./PROGRESSO.md).

Regra do protocolo: **nunca apagar entradas antigas** — cada entrada é o
registro do que foi decidido e por quê. Ao iniciar uma sessão nova, ler as duas
entradas mais recentes antes de começar.
