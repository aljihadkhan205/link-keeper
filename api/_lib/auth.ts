import crypto from 'crypto';
import type { Request, Response } from 'express';

const isProd = () => process.env.NODE_ENV === 'production';

// Dev-only fallbacks. In production the env vars are REQUIRED (no hardcoded defaults).
const DEV_PIN = '123456';
let warnedDev = false;
function warnDev(msg: string) {
  if (!warnedDev) {
    warnedDev = true;
    console.warn(`[Link Keeper] WARNING: ${msg}`);
  }
}

// PIN required to unlock. Returns null if not configured (login is then refused in production).
export function getPrivateAccessPin(): string | null {
  const pin = process.env.PRIVATE_ACCESS_PIN?.trim();
  if (pin) return pin;
  if (isProd()) return null;
  warnDev(`PRIVATE_ACCESS_PIN not set - using insecure dev PIN "${DEV_PIN}". Set it in .env`);
  return DEV_PIN;
}

// Optional API key for programmatic access. Disabled when unset.
export function getPrivateAccessSecret(): string | null {
  return process.env.PRIVATE_ACCESS_SECRET?.trim() || null;
}

let devSessionSecret: string | null = null;
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (isProd()) {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  warnDev('SESSION_SECRET not set - using a random per-restart secret (sessions reset on restart)');
  devSessionSecret ||= crypto.randomBytes(32).toString('hex');
  return devSessionSecret;
}

// Constant-time string comparison
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export const SESSION_COOKIE = 'lk_session';
export const SESSION_MAX_AGE_SEC = 14 * 24 * 60 * 60;

// Works on both Express and Vercel's response object (which has no res.cookie)
export function setSessionCookie(res: Response, token: string): void {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ];
  if (isProd()) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response): void {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProd()) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

// In-memory rate limiting for login attempts
interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, RateLimitEntry>();

export function checkRateLimit(clientIp: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(clientIp);

  if (!entry) {
    return { allowed: true };
  }

  if (entry.blockedUntil > now) {
    const waitSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // Expired block
  if (entry.blockedUntil !== 0 && entry.blockedUntil <= now) {
    loginAttempts.delete(clientIp);
  }

  return { allowed: true };
}

export function recordFailedAttempt(clientIp: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(clientIp) || { attempts: 0, blockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= 5) {
    entry.blockedUntil = now + 2 * 60 * 1000; // 2 minutes block
    entry.attempts = 0;
  }

  loginAttempts.set(clientIp, entry);
}

export function resetFailedAttempts(clientIp: string): void {
  loginAttempts.delete(clientIp);
}

export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const secret = getSessionSecret();
  const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}.${hmac}`;
}

export function verifySessionToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, providedHmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max session validity: 14 days
  const now = Date.now();
  const maxAge = 14 * 24 * 60 * 60 * 1000;
  if (now - timestamp > maxAge || timestamp > now + 60000) {
    return false;
  }

  const secret = getSessionSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(timestampStr).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  } catch {
    return false;
  }
}

export function getClientIp(req: Request): string {
  return (
    (req.headers['x-real-ip'] as string)?.trim() ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

export function parseCookies(req: Request): Record<string, string> {
  if (req.cookies && typeof req.cookies === 'object') {
    return req.cookies;
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};

  const list: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      try {
        list[key] = decodeURIComponent(val);
      } catch {
        list[key] = val;
      }
    }
  });

  return list;
}

export function isAuthenticated(req: Request): boolean {
  // 1. Check HTTP-only session cookie
  const cookies = parseCookies(req);
  const sessionCookie = cookies[SESSION_COOKIE];
  if (sessionCookie && verifySessionToken(sessionCookie)) {
    return true;
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (verifySessionToken(bearer)) {
      return true;
    }
    // Also allow passing the private secret directly via header
    const apiSecret = getPrivateAccessSecret();
    if (apiSecret && safeEqual(bearer, apiSecret)) {
      return true;
    }
  }

  // 3. Check custom header
  const customKey = req.headers['x-link-keeper-key'];
  const apiSecret2 = getPrivateAccessSecret();
  if (typeof customKey === 'string' && apiSecret2 && safeEqual(customKey, apiSecret2)) {
    return true;
  }

  return false;
}

export function requireAuth(req: Request, res: Response, next: () => void): void {
  if (isAuthenticated(req)) {
    next();
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Private access PIN required. Please unlock Link Keeper.',
      code: 'UNAUTHORIZED',
    });
  }
}
