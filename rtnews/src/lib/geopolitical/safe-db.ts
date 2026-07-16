// ─── Safe Database Queries for Geopolitical Module ──────────────
// Wraps all Prisma queries with try-catch to handle missing tables
// When tables don't exist (before prisma db push), returns empty results

import { db } from '@/lib/db';

/**
 * Safely query geopolitical risks. Returns empty array if table doesn't exist.
 */
export async function safeFindRisks(
  where: Record<string, unknown>,
  options?: { take?: number; orderBy?: Record<string, string>; select?: Record<string, boolean> }
): Promise<any[]> {
  try {
    return await db.geopoliticalRisk.findMany({
      where: where as any,
      ...(options?.take ? { take: options.take } : {}),
      ...(options?.orderBy ? { orderBy: options.orderBy } : {}),
      ...(options?.select ? { select: options.select } : {}),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[SafeDB] geopoliticalRisk.findMany failed:', msg.slice(0, 120));
    return [];
  }
}

/**
 * Safely find a single geopolitical risk. Returns null if table doesn't exist.
 */
export async function safeFindRisk(
  where: Record<string, unknown>
): Promise<any | null> {
  try {
    return await db.geopoliticalRisk.findFirst({ where: where as any });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[SafeDB] geopoliticalRisk.findFirst failed:', msg.slice(0, 120));
    return null;
  }
}

/**
 * Safely find a unique geopolitical risk. Returns null if table doesn't exist.
 */
export async function safeFindUniqueRisk(
  where: Record<string, unknown>
): Promise<any | null> {
  try {
    return await db.geopoliticalRisk.findUnique({ where: where as any });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[SafeDB] geopoliticalRisk.findUnique failed:', msg.slice(0, 120));
    return null;
  }
}

/**
 * Safely count geopolitical risks. Returns 0 if table doesn't exist.
 */
export async function safeCountRisks(
  where: Record<string, unknown>
): Promise<number> {
  try {
    return await db.geopoliticalRisk.count({ where: where as any });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[SafeDB] geopoliticalRisk.count failed:', msg.slice(0, 120));
    return 0;
  }
}

/**
 * Safely query country risk scores. Returns empty array if table doesn't exist.
 */
export async function safeFindCountryScores(
  options?: { orderBy?: Record<string, string>; take?: number; where?: Record<string, unknown> }
): Promise<any[]> {
  try {
    return await db.countryRiskScore.findMany({
      ...(options?.where ? { where: options.where as any } : {}),
      ...(options?.orderBy ? { orderBy: options.orderBy } : {}),
      ...(options?.take ? { take: options.take } : {}),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[SafeDB] countryRiskScore.findMany failed:', msg.slice(0, 120));
    return [];
  }
}

/**
 * Safely query geopolitical events. Returns empty array if table doesn't exist.
 */
export async function safeFindEvents(
  where?: Record<string, unknown>,
  options?: { orderBy?: Record<string, string>; take?: number }
): Promise<any[]> {
  try {
    return await db.geopoliticalEvent.findMany({
      ...(where ? { where: where as any } : {}),
      ...(options?.orderBy ? { orderBy: options.orderBy } : {}),
      ...(options?.take ? { take: options.take } : {}),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[SafeDB] geopoliticalEvent.findMany failed:', msg.slice(0, 120));
    return [];
  }
}
