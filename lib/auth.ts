import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Returns true if the request carries a valid Bearer token matching
 * process.env.ADMIN_PASSWORD (constant-time comparison to resist timing attacks).
 */
export function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    // timingSafeEqual requires same-length buffers; early exit on mismatch
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
