-- =============================================================================
-- Migración 001: Esquema Inicial con soporte Transaccional Draft vs. Live
-- =============================================================================
-- Nota de arquitectura:
-- Tanto los ítems del catálogo (`catalog_items`) como la configuración general
-- y de contacto (`site_settings`) almacenan su estado particionado por la
-- columna `env` ('live' | 'draft').
--
-- * La web pública (/) consulta exclusivamente `env = 'live' AND is_visible = TRUE`.
-- * El panel (/admin) lee y modifica exclusivamente `env = 'draft'`.
-- * "Publicar cambios": En una única transacción SQL, reemplaza los registros
--   `env = 'live'` con una copia exacta de los registros `env = 'draft'`.
-- * "Descartar cambios": En una única transacción SQL, reemplaza los registros
--   `env = 'draft'` con una copia exacta de los registros `env = 'live'`.
-- =============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
    env VARCHAR(10) PRIMARY KEY CHECK (env IN ('live', 'draft')),
    business_name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    hero_title VARCHAR(200) NOT NULL,
    hero_subtitle TEXT NOT NULL,
    whatsapp_url TEXT NOT NULL,
    instagram_url TEXT NOT NULL,
    maps_url TEXT NOT NULL,
    address_text VARCHAR(255) NOT NULL,
    opening_hours VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_items (
    id SERIAL PRIMARY KEY,
    env VARCHAR(10) NOT NULL CHECK (env IN ('live', 'draft')),
    item_type VARCHAR(20) NOT NULL DEFAULT 'service' CHECK (item_type IN ('service', 'product')),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    duration VARCHAR(60) NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_env_order
    ON catalog_items (env, sort_order ASC, id ASC);
