import type { Request, Response } from 'express';
import { getDatabaseClient, initDatabase, formatLinkRecord } from '../_lib/database.js';
import { normalizeAndValidateUrl, makeCategoryId } from '../_lib/validation.js';
import { isAuthenticated } from '../_lib/auth.js';
import { isValidDateOnly } from '../../shared/date.js';

export default async function handler(req: Request, res: Response) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Private access PIN required. Please unlock Link Keeper.',
    });
  }

  await initDatabase();
  const db = getDatabaseClient();

  // Extract ID from params or query
  const id = req.params?.id || req.query?.id;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  // Check link existence
  const existing = await db.execute({
    sql: `SELECT * FROM links WHERE id = ?;`,
    args: [id],
  });

  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Link not found' });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const current = existing.rows[0];
      const body = req.body || {};

      let name = current.name as string;
      if (typeof body.name === 'string') {
        const trimmed = body.name.trim();
        if (!trimmed) {
          return res.status(400).json({ error: 'Website name cannot be empty' });
        }
        if (trimmed.length > 150) {
          return res.status(400).json({ error: 'Website name must be 150 characters or less' });
        }
        name = trimmed;
      }

      let url = current.url as string;
      if (typeof body.url === 'string') {
        const urlValidation = normalizeAndValidateUrl(body.url);
        if (!urlValidation.valid || !urlValidation.normalizedUrl) {
          return res.status(400).json({ error: urlValidation.error || 'Invalid URL' });
        }
        url = urlValidation.normalizedUrl;
      }

      let note = current.note as string | null;
      if (body.note !== undefined) {
        if (typeof body.note === 'string') {
          note = body.note.trim() || null;
          if (note && note.length > 1000) {
            return res.status(400).json({ error: 'Note must be 1,000 characters or less' });
          }
        } else if (body.note === null) {
          note = null;
        }
      }

      let category = current.category as string;
      if (typeof body.category === 'string') {
        category = body.category.trim() || 'Other';
        if (category.length > 50) {
          return res.status(400).json({ error: 'Category name must be 50 characters or less' });
        }
      }

      let isFavorite = Number(current.is_favorite);
      if (typeof body.isFavorite === 'boolean') {
        isFavorite = body.isFavorite ? 1 : 0;
      }

      let remindAt = (current.remind_at as string | null) ?? null;
      if (body.remindAt === null || body.remindAt === '') {
        remindAt = null;
      } else if (body.remindAt !== undefined) {
        if (!isValidDateOnly(body.remindAt)) {
          return res.status(400).json({ error: 'Reminder must be a valid date (YYYY-MM-DD)' });
        }
        remindAt = body.remindAt;
      }

      const updatedAt = new Date().toISOString();

      // Keep created_at and last_viewed_at untouched
      await db.execute({
        sql: `UPDATE links SET name = ?, url = ?, note = ?, category = ?, is_favorite = ?, remind_at = ?, updated_at = ? WHERE id = ?;`,
        args: [name, url, note, category, isFavorite, remindAt, updatedAt, id],
      });

      // Insert category if new
      if (category && category !== 'Other') {
        await db.execute({
          sql: `INSERT OR IGNORE INTO categories (id, name, created_at) VALUES (?, ?, ?);`,
          args: [makeCategoryId(), category, updatedAt],
        });
      }

      const updatedRecord = await db.execute({
        sql: `SELECT * FROM links WHERE id = ?;`,
        args: [id],
      });

      const link = formatLinkRecord(updatedRecord.rows[0] as unknown as Record<string, unknown>);
      return res.status(200).json({ success: true, link });
    } catch (err: unknown) {
      console.error('Failed to update link:', err);
      return res.status(500).json({ error: 'Database update error', message: String(err) });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db.execute({
        sql: `DELETE FROM links WHERE id = ?;`,
        args: [id],
      });

      return res.status(200).json({ success: true, message: 'Link deleted successfully' });
    } catch (err: unknown) {
      console.error('Failed to delete link:', err);
      return res.status(500).json({ error: 'Database delete error', message: String(err) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
