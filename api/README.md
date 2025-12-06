# BriefAI API (NestJS + Prisma)

## Configuracao
1) Copie `.env.example` para `.env`, mantenha a `DATABASE_URL` fornecida (Postgres externo) e defina os segredos `JWT_SECRET`/`JWT_EXPIRES_IN`.
2) Instale dependencias (Node 20+ recomendado):
```bash
npm install
```

Senha padrao usada pelo seed (`npm run prisma:seed`): `ChangeMe123!` (ajustavel via `SEED_DEFAULT_PASSWORD`).

## Prisma
- Gerar client: `npm run prisma:generate`
- Aplicar migracoes (quando criadas): `npm run prisma:migrate`
- Deploy migracoes em prod: `npm run prisma:deploy`

## Testes

Instalacao (dentro de `api`):

```powershell
cd api
npm install
```

Rodar testes unitarios:

```powershell
npm test
```

Rodar em watch durante desenvolvimento:

```powershell
npm run test:watch
```

Gerar cobertura:

```powershell
npm run test:cov
```

Os testes de exemplo cobrem `TenantMiddleware`, `TenantActiveGuard`, `AuthService` e `RolesGuard`. O Jest valida cobertura minima global de 60% (enforce no CI).

## Desenvolvimento
```bash
npm run start:dev
```
API sobe em `/api` com health check em `/api/health`.

## Autenticacao
- `POST /api/auth/login`: autentica usuario (header `x-tenant` ou `tenantSlug` no body para usuarios de tenant).
- `POST /api/auth/register`: registra usuario ligado a um tenant (nao permite `SUPER_ADMIN`).
- `GET /api/auth/me`: retorna usuario autenticado (com `Bearer token`).
- `GET /api/auth/super-admin/ping`: exemplo protegido por role (`SUPER_ADMIN`).

Utiliza JWT (claims incluem role, tenantId/slug e membershipRole) e guards (`JwtAuthGuard`, `RolesGuard`).

## Estrutura
- `src/main.ts`: bootstrap Nest, prefixo `api`, validation pipe.
- `src/prisma`: provider global do Prisma Client.
- `src/health`: endpoint de saude.
- `src/auth`: modulo de autenticacao (JWT, guards, DTOs).
- `prisma/schema.prisma`: modelos multi-tenant alinhados ao DDL de `docs/db-schema.sql`.

## Proximos passos
- Implementar modulos: tenants (CRUD), planos, templates, briefings, ai, images, export.
- Criar fluxo de convites e reset de senha.
- Adicionar testes end-to-end cobrindo rotas criticas.
