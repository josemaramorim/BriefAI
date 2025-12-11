# BriefAI

Projeto SaaS multi-tenant para briefings de arquitetura.

## Ambiente (sem Docker para Postgres)
- Postgres externo fornecido: use `DATABASE_URL` do `.env.example`.
- Copie `.env.example` para `.env` e mantenha as credenciais seguras.

## Aplicar schema no Postgres existente
Requisitos: `psql` instalado e acesso de rede ao host.

PowerShell:
```powershell
$env:DATABASE_URL="postgresql://postgres:Bauex11hxClXD9T1zq6szjp4NhpmhbsN2nRaaTvUKq8PXx9cZqnrLmQf8QSB1FC8@n8n.jrvconsultoria.shop:5432/brief_ai?schema=public"
psql $env:DATABASE_URL -f docs/db-schema.sql
```

Bash:
```bash
export DATABASE_URL="postgresql://postgres:Bauex11hxClXD9T1zq6szjp4NhpmhbsN2nRaaTvUKq8PXx9cZqnrLmQf8QSB1FC8@n8n.jrvconsultoria.shop:5432/brief_ai?schema=public"
psql "$DATABASE_URL" -f docs/db-schema.sql
```

## Proximos passos
- Adicionar backend (NestJS) com resolucao de tenant e Prisma usando `DATABASE_URL`.
- Implementar migracoes automatizadas (Prisma migrate) apontando para a instancia externa.
- Configurar fila (Redis) e endpoints conforme `docs/mvp-plan.md`.

---

## Parâmetro de Warning de Expiração

- **warning_days** (AppConfig): Define o número de dias antes do fim do trial ou renovação de plano em que o sistema exibe o alerta amarelo (warning) para o usuário.
- O valor pode ser alterado diretamente na tabela AppConfig, sem necessidade de deploy.
- Exemplo: Se warning_days = 3, o alerta será exibido quando faltarem 3 dias ou menos para o fim do período.

---
