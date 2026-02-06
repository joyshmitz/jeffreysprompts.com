//! Database schema and migrations

/// Current schema version
pub const SCHEMA_VERSION: i32 = 2;

/// SQL to create the database schema
pub const CREATE_SCHEMA: &str = r#"
-- Prompts table (with denormalized tags_text for FTS)
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags_text TEXT, -- Denormalized tags for FTS
    featured INTEGER NOT NULL DEFAULT 0,
    version TEXT,
    author TEXT,
    saved_at TEXT,
    is_local INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tags table (many-to-many, normalized source)
CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (prompt_id, tag),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Variables table
CREATE TABLE IF NOT EXISTS prompt_variables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id TEXT NOT NULL,
    name TEXT NOT NULL,
    var_type TEXT NOT NULL DEFAULT 'text',
    required INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    default_value TEXT,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Bundles table
CREATE TABLE IF NOT EXISTS bundles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    version TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    author TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bundle prompts (many-to-many)
CREATE TABLE IF NOT EXISTS bundle_prompts (
    bundle_id TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (bundle_id, prompt_id),
    FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Registry metadata
CREATE TABLE IF NOT EXISTS registry_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- FTS5 for full-text search (standalone, not content-linked)
-- We manage it manually in the upsert logic
CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
    id,
    title,
    description,
    content,
    tags_text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_featured ON prompts(featured) WHERE featured = 1;
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON prompt_tags(tag);
"#;

/// SQL to drop all tables (for reset)
pub const DROP_SCHEMA: &str = r#"
DROP TABLE IF EXISTS bundle_prompts;
DROP TABLE IF EXISTS bundles;
DROP TABLE IF EXISTS prompt_variables;
DROP TABLE IF EXISTS prompt_tags;
DROP TABLE IF EXISTS prompts_fts;
DROP TABLE IF EXISTS prompts;
DROP TABLE IF EXISTS registry_meta;
"#;
