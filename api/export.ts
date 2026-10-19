import type { Request, Response } from 'express';
import { getDatabaseClient, initDatabase, formatLinkRecord } from './_lib/database.js';
import { isAuthenticated } from './_lib/auth.js';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Private access PIN required to export data',
    });
  }

  await initDatabase();
  const db = getDatabaseClient();

  try {
    const linksResult = await db.execute(`SELECT * FROM links ORDER BY created_at DESC;`);
    const categoriesResult = await db.execute(`SELECT * FROM categories ORDER BY name ASC;`);

    const links = linksResult.rows.map((row) => formatLinkRecord(row as unknown as Record<string, unknown>));
    const categories = categoriesResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      createdAt: String(row.created_at),
    }));

    const exportPayload = {
      app: 'Link Keeper',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalLinks: links.length,
      categories,
      links,
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `link-keeper-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (err: unknown) {
    console.error('Failed to export links:', err);
    return res.status(500).json({ error: 'Failed to generate export backup', message: String(err) });
  }
}
