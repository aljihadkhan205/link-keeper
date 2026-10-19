import type { Request, Response } from 'express';
import { getDatabaseClient, initDatabase, formatLinkRecord } from '../../_lib/database.js';
import { isAuthenticated } from '../../_lib/auth.js';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Private access PIN required',
    });
  }

  await initDatabase();
  const db = getDatabaseClient();

  const id = req.params?.id || req.query?.id;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  try {
    const existing = await db.execute({
      sql: `SELECT * FROM links WHERE id = ?;`,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const now = new Date().toISOString();

    // Update only last_viewed_at; leave created_at and updated_at unchanged
    await db.execute({
      sql: `UPDATE links SET last_viewed_at = ? WHERE id = ?;`,
      args: [now, id],
    });

    const updated = await db.execute({
      sql: `SELECT * FROM links WHERE id = ?;`,
      args: [id],
    });

    const link = formatLinkRecord(updated.rows[0] as unknown as Record<string, unknown>);

    return res.status(200).json({
      success: true,
      lastViewedAt: now,
      link,
    });
  } catch (err: unknown) {
    console.error('Failed to update view timestamp:', err);
    return res.status(500).json({ error: 'Failed to record view timestamp', message: String(err) });
  }
}
