CREATE TABLE IF NOT EXISTS app_schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_schema_migrations (version)
VALUES ('001_postgresql_jsonb')
ON CONFLICT (version) DO NOTHING;
