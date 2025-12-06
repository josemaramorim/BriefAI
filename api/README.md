# BriefAI API (NestJS + Prisma)

## Configuracao
1) Copie `.env.example` para `.env` e mantenha a `DATABASE_URL` fornecida (Postgres externo). Opcional: ajuste `PORT`.
2) Instale dependencias (Node 20+ recomendado):
```bash
npm install
```

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

Os testes de exemplo incluem verificacoes para `TenantMiddleware` e `TenantActiveGuard`.

## Desenvolvimento
```bash
npm run start:dev
```
API sobe em `/api` com health check em `/api/health`.

## Estrutura
- `src/main.ts`: bootstrap Nest, prefixo `api`, validation pipe.
- `src/prisma`: provider global do Prisma Client.
- `src/health`: endpoint de saude.
- `prisma/schema.prisma`: modelos multi-tenant alinhados ao DDL de `docs/db-schema.sql`.

## Proximos passos
- Adicionar middlewares/guards para resolver `tenant` por subdominio/header.
- Implementar modulos: auth, tenants, plans, memberships, templates, briefings, ai, images, export.
- Criar migracao inicial a partir do schema Prisma (`prisma migrate dev`).
