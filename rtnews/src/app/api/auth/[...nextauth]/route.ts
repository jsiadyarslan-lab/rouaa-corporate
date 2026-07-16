// ─── NextAuth API Route Handler V4 ──────────────────────────
// V4: Wrapped with per-request logging to capture OAuth callback errors
// that NextAuth silently swallows in production (debug:false).
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';

const baseHandler = NextAuth(authOptions);

async function wrappedHandler(req: Request, ctx: any) {
  const url = new URL(req.url);
  const isCallback = url.pathname.includes('/callback/');
  const provider = url.pathname.split('/callback/')[1]?.split('?')[0] || 'unknown';

  if (isCallback) {
    console.log(`[NextAuth V4] OAuth callback START — provider=${provider}, method=${req.method}`);
    console.log(`[NextAuth V4] Callback URL: ${url.pathname}${url.search.slice(0, 50)}`);
  }

  try {
    const result = await baseHandler(req, ctx);

    if (isCallback) {
      const location = result.headers?.get?.('location') || '';
      const hasError = location.includes('error=');
      console.log(`[NextAuth V4] OAuth callback END — provider=${provider}, status=${result.status}, redirect=${location.slice(0, 80)}${hasError ? ' ❌ HAS ERROR' : ''}`);
    }

    return result;
  } catch (err: any) {
    console.error(`[NextAuth V4] OAuth callback UNCAUGHT ERROR — provider=${provider}:`, err?.message || err);
    console.error(`[NextAuth V4] Error stack:`, err?.stack?.slice(0, 500));
    throw err;
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
