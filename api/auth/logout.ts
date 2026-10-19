import type { Request, Response } from 'express';
import { clearSessionCookie } from '../_lib/auth.js';

export default async function handler(req: Request, res: Response) {
  clearSessionCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
