# BriefAI - Plano MVP

## Objetivo
Entregar um MVP SaaS multi-tenant: super admin gerencia tenants/planos/limites; cada tenant (escritorio) permite ao arquiteto criar templates, compartilhar com clientes e receber respostas completas; IA sugere perguntas, gera resumo e detecta inconsistencias. Linguas: pt-BR (default), en, es.

## Escopo MVP (prioridade)
1) Autenticacao: email/senha, Google; perfis SuperAdmin/TenantAdmin/Arquiteto/Cliente; reset de senha.
2) Dashboard Arquiteto: listar briefings e progresso; criar/editar/duplicar templates; compartilhar link.
3) Builder de Briefing: secoes; perguntas (texto, multipla escolha, slider, upload imagem, escolha por imagem); drag-and-drop; salvar como template; exportar template (JSON).
4) Fluxo Cliente (Typeform/chat): exibicao sequencial, barra de progresso, salvar e continuar depois, uploads de referencia.
5) IA: sugerir perguntas adicionais, resumo final, detectar inconsistencias; provider OpenAI gpt-4o-mini (abstracao para alternar providers).
6) Exportacoes: PDF completo e resumido, JSON das respostas, ZIP de imagens.
7) Imagens: biblioteca interna, upload do arquiteto, cards com legenda.
8) i18n: pt-BR/en/es no front e mensagens backend.
9) SaaS Admin: super admin cria/edita tenants, define plano/limites, bloqueia/pausa tenant, visualiza consumo (briefings, armazenamento, chamadas de IA).

## Fora do MVP (pode virar V2)
- Geracao de imagens por IA.
- White-label completo (custom dominio).
- Billing automatizado (usar faturamento manual inicialmente, mas registrar billing_usage para futura cobranca).

## Arquitetura sugerida
- Frontend: Next.js 14+ (app router), TypeScript, Tailwind, shadcn UI; i18n com next-intl ou lingui; state com Zustand; upload via presigned URLs; contexto de tenant (subdominio ou path /t/{slug}).
- Backend: NestJS (Node 20+) com modules (auth, tenants, billing/usage, templates, briefing, ai, images, export); REST + OpenAPI; fila (BullMQ + Redis) para exportacoes; storage S3/R2; i18n por middleware; JWT + refresh tokens; middleware de resolucao de tenant por subdominio/header.
- DB: PostgreSQL (DATABASE_URL fornecida); Prisma como ORM; scoping por tenant_id.
- Infra: Docker compose para dev; Prod em fly.io/render/vercel (front) + railway/fly (api) + S3/R2; opcao de subdominios por tenant (CNAME) na V2.

## Principais endpoints (REST)
- /auth: POST /login, POST /register (tenant-scoped), POST /refresh, POST /logout, POST /forgot-password, POST /reset-password
- /tenants (super admin): POST /, GET /, GET /:id, PATCH /:id (plano/limites/ativo), POST /:id/pause
- /billing (super admin): GET /usage, GET /usage/:tenantId, POST /adjust-credits
- /templates: POST /, GET /, GET /:id, PATCH /:id, DELETE /:id, POST /:id/duplicate, POST /:id/export
- /briefing: POST /, GET /:id, POST /:id/answer, POST /:id/export, GET /:id/progress
- /ai: POST /suggest-questions, POST /summarize, POST /detect-conflicts
- /images: POST /upload (presigned), GET /, DELETE /:id, GET /search?q=

## Modelo de dados (alto nivel)
- tenants: id, name, slug, status (active|paused), plan_id, limits_json, created_at
- plans: id, name, price_cents, currency, limits_json, is_default
- users: id, name, email, role (super_admin|tenant_admin|architect|client), password_hash, locale, created_at
- memberships: id, tenant_id, user_id, role (tenant_admin|architect|client), created_at
- templates: id, tenant_id, owner_id, title, json_schema, version, is_public, created_at, updated_at
- briefings: id, tenant_id, template_id, client_id, status, progress, answers_json, created_at, updated_at
- ai_events: id, briefing_id, type (suggestions|summary|conflict), payload, created_at
- images: id, tenant_id, owner_id, url, label, metadata, created_at
- billing_usage: id, tenant_id, period (month), briefings_count, ai_tokens, storage_mb, pdf_exports
- audit_logs: id, tenant_id, actor_user_id, action, target, metadata, created_at

## Fluxos chave
- Tenant: resolvido por subdominio ou header; checagem de status (active/paused) antes de cada request; scoping por tenant_id em queries.
- Builder: front monta JSON schema; backend valida e persiste; duplicacao reusa schema; export retorna JSON schema.
- Preenchimento: front consome schema, renderiza passo-a-passo; salva progresso parcial; ao finalizar, aciona IA (summary + conflitos) async.
- IA: servico facade chama provider; logs em ai_events; reexecutar idempotente.
- Exportacao: job em fila gera PDF completo/resumido e ZIP; URLs temporarias para download.
- Super admin: CRUD de tenants, troca de plano/limites, pausa/reativa tenant, consulta billing_usage.

## Nao funcionais
- Segurança: JWT + refresh, senha com bcrypt, rate limiting em auth/ai, validação de schema, scoping por tenant_id.
- Observabilidade: logs estruturados, traces para chamadas de IA, health check /health.
- Performance: cache leve em templates publicos; CDN para assets/imagens; limites por plano.
- Acessibilidade: contraste, foco visivel, navegacao por teclado.

## Roadmap curto (2 sprints)
- S1: Fundacoes SaaS (tenants/plans, super admin CRUD basico), Auth, dashboard, templates CRUD, builder drag-drop, salvar/duplicar, i18n base.
- S2: Fluxo cliente, IA (sugestoes/resumo/conflitos), exportacoes PDF/ZIP/JSON, uploads/imagens, polimento UI, billing_usage e pausar tenant.

## Aceite
- Super admin cria tenant e plano; Arquiteto cria template, compartilha link, cliente preenche completo, IA gera sugestoes e resumo, exportacoes funcionam, multilinguagem ativa em pt-BR/en/es; limites por tenant aplicados.
