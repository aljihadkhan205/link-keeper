import type { Request, Response } from 'express';
import { getDatabaseClient, initDatabase } from '../_lib/database.js';
import { isAuthenticated } from '../_lib/auth.js';
import { makeCategoryId } from '../_lib/validation.js';

export interface CategoryWithCount {
  id: string;
  name: string;
  count: number;
}

export default async function handler(req: Request, res: Response) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Private access PIN required',
    });
  }

  await initDatabase();
  const db = getDatabaseClient();

  if (req.method === 'GET') {
    try {
      // Fetch categories along with number of links in each category
      const categoriesResult = await db.execute(`
        SELECT c.id, c.name, COUNT(l.id) as count
        FROM categories c
        LEFT JOIN links l ON l.category = c.name
        GROUP BY c.id, c.name
        ORDER BY c.name ASC;
      `);

      const categories: CategoryWithCount[] = categoriesResult.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        count: Number(row.count || 0),
      }));

      return res.status(200).json({ categories });
    } catch (err: unknown) {
      console.error('Failed to fetch categories:', err);
      return res.status(500).json({ error: 'Failed to fetch categories', message: String(err) });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name } = req.body || {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const trimmedName = name.trim();
      if (trimmedName.length > 50) {
        return res.status(400).json({ error: 'Category name must be 50 characters or less' });
      }

      const now = new Date().toISOString();

      // Case-insensitive duplicate check: return the existing category instead of a phantom one
      const existing = await db.execute({
        sql: `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?);`,
        args: [trimmedName],
      });
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        return res.status(200).json({
          success: true,
          existing: true,
          category: { id: String(row.id), name: String(row.name), count: 0 },
        });
      }

      const id = makeCategoryId();
      await db.execute({
        sql: `INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?);`,
        args: [id, trimmedName, now],
      });

      return res.status(201).json({
        success: true,
        category: { id, name: trimmedName, count: 0 },
      });
    } catch (err: unknown) {
      console.error('Failed to create category:', err);
      return res.status(500).json({ error: 'Failed to create category', message: String(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
