// ─── Shared API Utilities V47 ─────────────────────────────────
// Standardized auth check and error handling for all admin API routes.
// Ensures consistent security and prevents internal error message leaks.

import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth-utils';

// Standardized admin auth check — returns null if authenticated,
// or a 401 NextResponse if not. Use at the top of every admin handler.
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const isAuth = await isAdminAuthenticated(request);
  if (!isAuth) {
    return NextResponse.json(
      { error: 'غير مصرح — سجّل الدخول أولاً' },
      { status: 401 }
    );
  }
  return null; // Auth passed
}

// Sanitized error response — prevents leaking internal details
// (table names, column names, connection strings) to the client.
// In development, shows more detail for debugging.
export function apiError(error: unknown, context?: string, status: number = 500): NextResponse {
  const message = error instanceof Error ? error.message : String(error);

  // Always log the full error server-side
  console.error(`[API Error${context ? ` / ${context}` : ''}]`, message);

  // In production: generic message to client
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: context ? `خطأ في ${context}` : 'حدث خطأ داخلي' },
      { status }
    );
  }

  // In development: show actual error for debugging
  return NextResponse.json(
    { error: message },
    { status }
  );
}

// Validate required fields in a request body
export function validateRequired(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      return `الحقل "${field}" مطلوب`;
    }
  }
  return null;
}
