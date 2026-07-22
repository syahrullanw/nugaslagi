CREATE TABLE IF NOT EXISTS app_collection_registry (
    collection_name TEXT PRIMARY KEY CHECK (collection_name ~ '^[A-Za-z0-9_-]+$'),
    table_name TEXT NOT NULL UNIQUE CHECK (table_name ~ '^app_doc_[A-Za-z0-9_-]+$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_schema_migrations (version)
VALUES ('002_domain_tables')
ON CONFLICT (version) DO NOTHING;
