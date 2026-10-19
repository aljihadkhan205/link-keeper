import type { Request, Response } from 'express';
import {
  getPrivateAccessPin,
  createSessionToken,
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
  getClientIp,
  safeEqual,
  setSessionCookie,
} from '../_lib/auth.js';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Too many incorrect attempts. Please wait ${rateLimit.waitSeconds} seconds before trying again.`,
    });
  }

  const body = req.body || {};
  // Accept 'pin' or 'passcode'
  const submittedPin = typeof body.pin === 'string' ? body.pin : typeof body.passcode === 'string' ? body.passcode : '';

  if (!submittedPin || !submittedPin.trim()) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const expectedPin = getPrivateAccessPin();
  if (!expectedPin) {
    return res.status(500).json({
      error: 'Server not configured',
      message: 'PRIVATE_ACCESS_PIN is not set on the server. Add it to your environment variables.',
    });
  }

  if (!safeEqual(submittedPin.trim(), expectedPin)) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({
      error: 'Invalid PIN',
      message: 'The access PIN is incorrect.',
    });
  }

  // Correct PIN -> Reset failed attempts counter
  resetFailedAttempts(clientIp);
  const token = createSessionToken();

  setSessionCookie(res, token);

  return res.status(200).json({
    success: true,
    message: 'Unlocked successfully',
  });
}
