-- BriefAI - DDL PostgreSQL (MVP SaaS multi-tenant)
-- Connection (env): DATABASE_URL="postgresql://postgres:Bauex11hxClXD9T1zq6szjp4NhpmhbsN2nRaaTvUKq8PXx9cZqnrLmQf8QSB1FC8@n8n.jrvconsultoria.shop:5432/brief_ai?schema=public"

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Plans (SaaS tiers)
CREATE TABLE IF NOT EXISTS plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    price_cents     INT NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'USD',
    limits_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_plans_name ON plans(name);
CREATE UNIQUE INDEX IF NOT EXISTS ux_plans_default ON plans(is_default) WHERE is_default;

-- Tenants (workspaces)
CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
    plan_id         UUID NOT NULL REFERENCES plans(id),
    limits_override JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Users (global identities; membership links to tenant)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    email           CITEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('super_admin','tenant_admin','architect','client')),
    locale          TEXT NOT NULL DEFAULT 'pt-BR',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Memberships (user-to-tenant roles)
CREATE TABLE IF NOT EXISTS memberships (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('tenant_admin','architect','client')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON memberships(role);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    json_schema     JSONB NOT NULL,
    version         INT NOT NULL DEFAULT 1,
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_templates_tenant ON templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_templates_owner ON templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public);

-- Briefings (instances filled by clients)
CREATE TABLE IF NOT EXISTS briefings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id     UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed')),
    progress        INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    answers_json    JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_briefings_tenant ON briefings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_briefings_template ON briefings(template_id);
CREATE INDEX IF NOT EXISTS idx_briefings_client ON briefings(client_id);
CREATE INDEX IF NOT EXISTS idx_briefings_status ON briefings(status);

-- AI events (suggestions, summaries, conflict detections)
CREATE TABLE IF NOT EXISTS ai_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    briefing_id     UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL CHECK (event_type IN ('suggestions','summary','conflict')),
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_events_tenant ON ai_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_briefing ON ai_events(briefing_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_type ON ai_events(event_type);

-- Images (library and uploads)
CREATE TABLE IF NOT EXISTS images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    label           TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_images_tenant ON images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_id);

-- Audit/version history (optional lightweight)
CREATE TABLE IF NOT EXISTS template_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id     UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    version         INT NOT NULL,
    json_schema     JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_template_versions_version ON template_versions(template_id, version);
CREATE INDEX IF NOT EXISTS idx_template_versions_tenant ON template_versions(tenant_id);

-- Billing usage (for super admin visibility and future billing engine)
CREATE TABLE IF NOT EXISTS billing_usage (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_month    TEXT NOT NULL, -- format YYYY-MM
    briefings_count INT NOT NULL DEFAULT 0,
    ai_tokens       BIGINT NOT NULL DEFAULT 0,
    storage_mb      INT NOT NULL DEFAULT 0,
    pdf_exports     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, period_month)
);
CREATE INDEX IF NOT EXISTS idx_billing_usage_tenant ON billing_usage(tenant_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    target          TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);

-- Seeds (minimal SaaS-ready)
WITH plan_basic AS (
    INSERT INTO plans (name, price_cents, currency, limits_json, is_default)
    VALUES ('Starter', 0, 'USD', '{"briefings_limit":200,"ai_tokens":200000,"storage_mb":5120,"pdf_exports":200}', TRUE)
    ON CONFLICT (name) DO UPDATE SET is_default = EXCLUDED.is_default
    RETURNING id
),
plan_pro AS (
    INSERT INTO plans (name, price_cents, currency, limits_json, is_default)
    VALUES ('Pro', 4900, 'USD', '{"briefings_limit":2000,"ai_tokens":2000000,"storage_mb":20480,"pdf_exports":2000}', FALSE)
    ON CONFLICT (name) DO NOTHING
    RETURNING id
),
super_admin AS (
    INSERT INTO users (name, email, password_hash, role, locale)
    VALUES ('Super Admin', 'admin@brief.ai', crypt('admin123', gen_salt('bf')), 'super_admin', 'pt-BR')
    ON CONFLICT (email) DO UPDATE SET role = 'super_admin'
    RETURNING id
),
tenant_demo AS (
    INSERT INTO tenants (name, slug, status, plan_id)
    SELECT 'Demo Studio', 'demo', 'active', id FROM plan_basic
    ON CONFLICT (slug) DO UPDATE SET status = EXCLUDED.status
    RETURNING id
),
architect_demo AS (
    INSERT INTO users (name, email, password_hash, role, locale)
    VALUES ('Arquiteto Demo', 'arquiteto@brief.ai', crypt('demo123', gen_salt('bf')), 'tenant_admin', 'pt-BR')
    ON CONFLICT (email) DO UPDATE SET role = 'tenant_admin'
    RETURNING id
),
membership_demo AS (
    INSERT INTO memberships (tenant_id, user_id, role)
    SELECT t.id, u.id, 'tenant_admin' FROM tenant_demo t CROSS JOIN architect_demo u
    ON CONFLICT (tenant_id, user_id) DO NOTHING
    RETURNING tenant_id, user_id
),
template_seed AS (
    INSERT INTO templates (tenant_id, owner_id, title, json_schema, version, is_public)
    SELECT t.id, u.id, 'Apartamento 120m2',
           '{"title":"Apartamento 120m2","sections":[{"title":"Estilo","questions":[{"type":"image-choice","question":"Qual estilo voce prefere?","options":[{"image":"/img/industrial.jpg","label":"Industrial"},{"image":"/img/minimalista.jpg","label":"Minimalista"}]}]},{"title":"Comodos","questions":[{"type":"boolean","question":"Deseja integracao sala-cozinha?"}]}]}'::jsonb,
           1, TRUE
    FROM tenant_demo t CROSS JOIN architect_demo u
    ON CONFLICT DO NOTHING
    RETURNING id, tenant_id
)
INSERT INTO template_versions (tenant_id, template_id, version, json_schema)
SELECT t.tenant_id, t.id, 1,
       '{"title":"Apartamento 120m2","sections":[{"title":"Estilo","questions":[{"type":"image-choice","question":"Qual estilo voce prefere?","options":[{"image":"/img/industrial.jpg","label":"Industrial"},{"image":"/img/minimalista.jpg","label":"Minimalista"}]}]},{"title":"Comodos","questions":[{"type":"boolean","question":"Deseja integracao sala-cozinha?"}]}]}'::jsonb
FROM template_seed t
ON CONFLICT DO NOTHING;
