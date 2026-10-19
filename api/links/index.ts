import type { Request, Response } from 'express';
import { getDatabaseClient, initDatabase, formatLinkRecord } from '../_lib/database.js';
import { validateLinkPayload, getSafeSortClause, escapeLike, makeCategoryId } from '../_lib/validation.js';
import { isAuthenticated } from '../_lib/auth.js';

export default async function handler(req: Request, res: Response) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Private access PIN required. Please unlock Link Keeper.',
    });
  }

  await initDatabase();
  const db = getDatabaseClient();

  if (req.method === 'GET') {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
      const favorite = req.query.favorite === 'true';
      const sortKey = typeof req.query.sort === 'string' ? req.query.sort : 'recent_added';

      const conditions: string[] = [];
      const args: (string | number)[] = [];

      if (search) {
        conditions.push(`(name LIKE ? ESCAPE '\\' OR url LIKE ? ESCAPE '\\' OR note LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\')`);
        const searchPattern = `%${escapeLike(search)}%`;
        args.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (category && category !== 'All Links' && category !== 'All') {
        conditions.push(`category = ?`);
        args.push(category);
      }

      if (favorite) {
        conditions.push(`is_favorite = 1`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sortClause = getSafeSortClause(sortKey);

      const sql = `SELECT * FROM links ${whereClause} ORDER BY ${sortClause};`;
      const result = await db.execute({ sql, args });

      // Also get overall counts for header stats
      const totalCountRes = await db.execute(`SELECT COUNT(*) as count FROM links;`);
      const favCountRes = await db.execute(`SELECT COUNT(*) as count FROM links WHERE is_favorite = 1;`);

      const links = result.rows.map((r) => formatLinkRecord(r as unknown as Record<string, unknown>));

      return res.status(200).json({
        links,
        total: Number(totalCountRes.rows[0].count),
        favoritesCount: Number(favCountRes.rows[0].count),
      });
    } catch (err: unknown) {
      console.error('Failed to query links:', err);
      return res.status(500).json({ error: 'Database query error', message: String(err) });
    }
  }

  if (req.method === 'POST') {
    try {
      const validation = validateLinkPayload(req.body);
      if (!validation.valid || !validation.data) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validation.errors,
        });
      }

      const { name, url, note, category, isFavorite } = validation.data;
      const id = `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();
      const cleanNote: string | null = note ? String(note) : null;
      const finalCategory: string = category || 'Other';

      await db.execute({
        sql: `INSERT INTO links (id, name, url, note, category, is_favorite, created_at, updated_at, last_viewed_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [id, name, url, cleanNote, finalCategory, isFavorite ? 1 : 0, now, now, null],
      });

      // Auto-ensure category exists in categories table
      if (category && category !== 'Other') {
        await db.execute({
          sql: `INSERT OR IGNORE INTO categories (id, name, created_at) VALUES (?, ?, ?);`,
          args: [makeCategoryId(), category, now],
        });
      }

      const createdRecord = await db.execute({
        sql: `SELECT * FROM links WHERE id = ?;`,
        args: [id],
      });

      const link = formatLinkRecord(createdRecord.rows[0] as unknown as Record<string, unknown>);
      return res.status(201).json({ success: true, link });
    } catch (err: unknown) {
      console.error('Failed to create link:', err);
      return res.status(500).json({ error: 'Database insert error', message: String(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
