import type { Request, Response } from 'express';
import { isAuthenticated } from '../_lib/auth.js';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authenticated = isAuthenticated(req);

  return res.status(200).json({
    authenticated,
  });
}
