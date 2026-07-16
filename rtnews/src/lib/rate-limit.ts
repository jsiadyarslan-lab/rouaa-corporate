// ─── Rate Limiting for API Routes ─────────────────────────
// Simple in-memory rate limiter per IP address

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const limits = new Map<string, RateLimitEntry>();

// V155: Clean up expired entries every 5 minutes (with unref to avoid blocking process exit)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limits) {
    if (now > entry.resetTime) {
      limits.delete(key);
    }
  }
}, 5 * 60 * 1000);
// Don't prevent the process from exiting
if (cleanupTimer.unref) cleanupTimer.unref();

export interface RateLimitOptions {
  windowMs?: number;  // Time window in milliseconds (default: 60s)
  maxRequests?: number; // Max requests per window (default: 30)
  keyPrefix?: string;  // Prefix for rate limit key
}

export function rateLimit(options: RateLimitOptions = {}): {
  check: (request: Request) => { allowed: boolean; remaining: number; resetTime: number };
} {
  const { windowMs = 60_000, maxRequests = 30, keyPrefix = 'rl' } = options;

  return {
    check(request: Request) {
      // V155: Use LAST IP in x-forwarded-for chain (consistent with middleware.ts).
      // Railway appends the real client IP as the LAST entry.
      // Using the first entry returns the proxy IP, causing all users to share
      // one rate limit bucket.
      const forwarded = request.headers.get('x-forwarded-for');
      let ip = 'unknown';
      if (forwarded) {
        const ips = forwarded.split(',').map(s => s.trim()).filter(Boolean);
        if (ips.length > 0) ip = ips[ips.length - 1]; // Last IP = real client
      }
      if (ip === 'unknown') {
        ip = request.headers.get('x-real-ip') || 'unknown';
      }
      
      const key = `${keyPrefix}:${ip}`;
      const now = Date.now();
      
      let entry = limits.get(key);
      
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + windowMs };
        limits.set(key, entry);
      }
      
      entry.count++;
      
      return {
        allowed: entry.count <= maxRequests,
        remaining: Math.max(0, maxRequests - entry.count),
        resetTime: entry.resetTime,
      };
    },
  };
}

// Pre-configured rate limiters
export const apiRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 60, keyPrefix: 'api' });
export const generateRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 5, keyPrefix: 'gen' });
export const chatRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 10, keyPrefix: 'chat' });
export const authRateLimit = rateLimit({ windowMs: 15 * 60_000, maxRequests: 5, keyPrefix: 'auth' });
export const cronRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 10, keyPrefix: 'cron' });
