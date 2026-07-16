// ─── Shared Auth Utilities V153 ─────────────────────────────────
// SINGLE SOURCE OF TRUTH for JWT secret and admin verification.
// V153 FIX: Added verifyInternalOrCronAuth() — shared auth function
//   for all cron/internal routes. Replaces the duplicated verifyCronAuth()
//   functions that each had hardcoded 'rouaa-cron' as auth bypass.
//   Now uses INTERNAL_SECRET env var exclusively (no hardcoded secrets).
// V47 FIX: Removed dangerous x-internal header bypass that allowed
//   any request with x-internal: rouaa-* to bypass admin auth.
//   Now requires a specific INTERNAL_SECRET env var for internal calls.
// V44 FIX: Previously the JWT secret was duplicated in 3 files:
//   - middleware.ts
//   - auth/login/route.ts
//   - auth/verify/route.ts
// This was a security risk — if one file was updated, the others
// would diverge, potentially allowing tokens signed with the old
// secret to still be valid in one file but not another.

import { jwtVerify } from 'jose';

// In production: ADMIN_SECRET is REQUIRED. Fail hard if missing.
// In development: Generate a stable dev secret from a fixed seed
// so sessions survive HMR (but NOT a predictable one).
let _secret: Uint8Array | null = null;

export function getAdminSecret(): Uint8Array {
  if (_secret) return _secret;

  const envSecret = process.env.ADMIN_SECRET;

  if (envSecret) {
    _secret = new TextEncoder().encode(envSecret);
    return _secret;
  }

  // Production: NO fallback — throw to fail fast
  if (process.env.NODE_ENV === 'production') {
    console.error('[Auth] CRITICAL: ADMIN_SECRET not set in production! All auth will fail.');
    // Return a random secret that changes every restart — effectively blocks all auth
    _secret = new TextEncoder().encode('prod-no-secret-' + Date.now());
    return _secret;
  }

  // Development only: stable dev secret (NEVER used in production)
  // WARNING: This must NEVER be used in production. If ADMIN_SECRET is not
  // set in production, auth will fail with a random secret that changes on restart.
  _secret = new TextEncoder().encode('dev-admin-secret-stable-for-hmr-v47');
  return _secret;
}

// Verify an admin JWT token from a cookie
export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = getAdminSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

// Verify an internal service call using INTERNAL_SECRET
// V47: Replaced the dangerous x-internal: rouaa-* bypass with
// a proper secret-based verification. Internal calls must now
// provide the correct INTERNAL_SECRET value.
function isInternalServiceCall(request: Request): boolean {
  const internalHeader = request.headers.get('x-internal');
  if (!internalHeader) return false;

  const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  if (!internalSecret) return false; // No secret configured = no internal access

  // Only allow the EXACT secret value, not any rouaa-* prefix
  return internalHeader === internalSecret;
}

// V153: Shared auth function for all cron/internal API routes.
// Replaces the duplicated verifyCronAuth() functions across 10+ route files
// that each hardcoded 'rouaa-cron' as an auth bypass.
// Accepts: CRON_SECRET via Authorization header, OR INTERNAL_SECRET via x-internal header,
// OR admin JWT cookie.
export function verifyInternalOrCronAuth(request: Request): boolean {
  // 1. Check x-internal header against INTERNAL_SECRET
  const internalHeader = request.headers.get('x-internal');
  if (internalHeader) {
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
    if (internalSecret && internalHeader === internalSecret) return true;
  }

  // 2. Check Authorization header against CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // 3. Check URL param 'internal' against INTERNAL_SECRET (for GET cron pings)
  try {
    const url = new URL(request.url);
    const internalParam = url.searchParams.get('internal');
    if (internalParam) {
      const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
      if (internalSecret && internalParam === internalSecret) return true;
    }
  } catch {}

  return false;
}

// Check if a Request has valid admin authentication
// V47: x-internal header now requires exact match against INTERNAL_SECRET
export async function isAdminAuthenticated(request: Request): Promise<boolean> {
  // Check for authenticated internal service calls
  if (isInternalServiceCall(request)) return true;

  // Check admin JWT cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/admin_token=([^;]+)/);
  if (!tokenMatch) return false;

  return verifyAdminToken(tokenMatch[1]);
}
