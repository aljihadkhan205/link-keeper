-- Database Schema for Link Keeper
-- Compatible with Turso / libSQL / SQLite

-- Links table
CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    note TEXT,
    category TEXT DEFAULT 'Other',
    is_favorite INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_viewed_at TEXT,
    remind_at TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_links_category ON links(category);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_last_viewed_at ON links(last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_is_favorite ON links(is_favorite);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

-- Pre-seed core categories if empty
INSERT OR IGNORE INTO categories (id, name, created_at) VALUES
    ('cat_ai', 'AI Tools', '2026-01-01T00:00:00.000Z'),
    ('cat_dev', 'Development', '2026-01-01T00:00:00.000Z'),
    ('cat_design', 'Design', '2026-01-01T00:00:00.000Z'),
    ('cat_social', 'Social Media', '2026-01-01T00:00:00.000Z'),
    ('cat_edu', 'Education', '2026-01-01T00:00:00.000Z'),
    ('cat_prod', 'Productivity', '2026-01-01T00:00:00.000Z'),
    ('cat_personal', 'Personal', '2026-01-01T00:00:00.000Z'),
    ('cat_other', 'Other', '2026-01-01T00:00:00.000Z');
