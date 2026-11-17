import crypto from 'crypto';
import { env } from './env';

function safeCompareSecret(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, 'utf8');
    const bBuf = Buffer.from(b, 'utf8');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

/**
 * Pure authentication helper for cron execution.
 * Validates the Authorization header strictly without side-effects.
 * 
 * @param authHeader The raw Authorization header (e.g., 'Bearer <token>')
 * @returns boolean True if authorized
 */
export function isValidCronAuthorization(authHeader: string | null): boolean {
  if (!authHeader) return false;
  
  // Must exactly start with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) return false;

  const parts = authHeader.split(' ');
  
  // Reject malformed 'Bearer token extra'
  if (parts.length !== 2) return false;

  const token = parts[1];
  if (!token) return false;

  return safeCompareSecret(token, env.CRON_SECRET);
}
