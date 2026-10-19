import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

export interface LinkRecord {
  id: string;
  name: string;
  url: string;
  note: string | null;
  category: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
  last_viewed_at: string | null;
}

export interface LinkItem {
  id: string;
  name: string;
  url: string;
  note?: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string | null;
}

export interface CategoryRecord {
  id: string;
  name: string;
  created_at: string;
}

let dbClient: Client | null = null;
let initialized = false;

export function getDatabaseClient(): Client {
  if (dbClient) {
    return dbClient;
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && url.trim().length > 0) {
    dbClient = createClient({
      url: url.trim(),
      authToken: authToken ? authToken.trim() : undefined,
    });
  } else {
    // Local embedded file for development when Turso credentials are not yet configured
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // ignore if already created
      }
    }
    const dbPath = path.resolve(dataDir, 'linkkeeper.db');
    dbClient = createClient({
      url: `file:${dbPath}`,
    });
  }

  return dbClient;
}

export async function initDatabase(): Promise<void> {
  if (initialized) return;
  const db = getDatabaseClient();

  // 1. Create links table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      note TEXT,
      category TEXT DEFAULT 'Other',
      is_favorite INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_viewed_at TEXT
    );
  `);

  // 2. Create indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_category ON links(category);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_last_viewed_at ON links(last_viewed_at DESC);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_is_favorite ON links(is_favorite);`);

  // 3. Create categories table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
  `);

  // 4. Default categories
  const defaultCategories = [
    { id: 'cat_ai', name: 'AI Tools' },
    { id: 'cat_dev', name: 'Development' },
    { id: 'cat_design', name: 'Design' },
    { id: 'cat_social', name: 'Social Media' },
    { id: 'cat_edu', name: 'Education' },
    { id: 'cat_prod', name: 'Productivity' },
    { id: 'cat_personal', name: 'Personal' },
    { id: 'cat_other', name: 'Other' },
  ];

  for (const cat of defaultCategories) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO categories (id, name, created_at) VALUES (?, ?, ?);`,
      args: [cat.id, cat.name, new Date().toISOString()],
    });
  }

  // 5. Check if links table is empty; if so, populate initial quality sample bookmarks
  const countResult = await db.execute(`SELECT COUNT(*) as count FROM links;`);
  const count = Number(countResult.rows[0].count);

  if (count === 0) {
    const sampleLinks = [
      {
        id: 'link_github',
        name: 'GitHub',
        url: 'https://github.com',
        note: 'Code hosting, collaboration, and repository management',
        category: 'Development',
        is_favorite: 1,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        last_viewed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'link_turso',
        name: 'Turso Database Docs',
        url: 'https://docs.turso.tech',
        note: 'Official documentation for Turso SQLite cloud database and libSQL SDK',
        category: 'Development',
        is_favorite: 1,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        last_viewed_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: 'link_tailwind',
        name: 'Tailwind CSS Documentation',
        url: 'https://tailwindcss.com/docs',
        note: 'Utility-first CSS framework reference and configuration guide',
        category: 'Design',
        is_favorite: 0,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        last_viewed_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: 'link_huggingface',
        name: 'Hugging Face Hub',
        url: 'https://huggingface.co',
        note: 'Open-source AI models, datasets, and machine learning spaces',
        category: 'AI Tools',
        is_favorite: 1,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        last_viewed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'link_linear',
        name: 'Linear App',
        url: 'https://linear.app',
        note: 'Issue tracking and project management for software teams',
        category: 'Productivity',
        is_favorite: 0,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        last_viewed_at: null,
      },
    ];

    for (const link of sampleLinks) {
      await db.execute({
        sql: `INSERT INTO links (id, name, url, note, category, is_favorite, created_at, updated_at, last_viewed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          link.id,
          link.name,
          link.url,
          link.note,
          link.category,
          link.is_favorite,
          link.created_at,
          link.updated_at,
          link.last_viewed_at,
        ],
      });
    }
  }

  initialized = true;
}

export function formatLinkRecord(row: Record<string, unknown>): LinkItem {
  return {
    id: String(row.id),
    name: String(row.name),
    url: String(row.url),
    note: row.note ? String(row.note) : undefined,
    category: String(row.category || 'Other'),
    isFavorite: Number(row.is_favorite) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastViewedAt: row.last_viewed_at ? String(row.last_viewed_at) : null,
  };
}
