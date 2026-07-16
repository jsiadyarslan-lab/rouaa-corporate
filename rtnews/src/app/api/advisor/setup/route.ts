// ─── مساعد رؤى — Setup API ─────────────────────────────
// GET: فحص حالة الجداول
// POST: إنشاء الجداول المطلوبة إذا لم تكن موجودة

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * إنشاء الجداول المطلوبة لمساعد رؤى باستخدام raw SQL
 * يتم استدعاء هذا تلقائياً عند الحاجة
 */
async function ensureAdvisorTables(): Promise<{ created: string[]; existing: string[]; errors: string[] }> {
  const created: string[] = [];
  const existing: string[] = [];
  const errors: string[] = [];

  // جدول users — قد يكون موجوداً بالفعل
  try {
    await db.$queryRaw`SELECT 1 FROM users LIMIT 1`;
    existing.push('users');
  } catch {
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          "passwordHash" TEXT,
          image TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          provider TEXT NOT NULL DEFAULT 'email',
          plan TEXT NOT NULL DEFAULT 'free',
          "planExpiresAt" TIMESTAMP(3),
          "emailVerified" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
      `);
      created.push('users');
    } catch (e: any) {
      errors.push(`users: ${e.message}`);
    }
  }

  // جدول notifications
  try {
    await db.$queryRaw`SELECT 1 FROM notifications LIMIT 1`;
    existing.push('notifications');
  } catch {
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'info',
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          link TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS notifications_userId_isRead_idx ON notifications("userId", "isRead");
        CREATE INDEX IF NOT EXISTS notifications_userId_createdAt_idx ON notifications("userId", "createdAt");
      `);
      created.push('notifications');
    } catch (e: any) {
      errors.push(`notifications: ${e.message}`);
    }
  }

  // جدول user_profiles
  try {
    await db.$queryRaw`SELECT 1 FROM user_profiles LIMIT 1`;
    existing.push('user_profiles');
  } catch {
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          "experienceLevel" TEXT NOT NULL DEFAULT 'beginner',
          "riskTolerance" TEXT NOT NULL DEFAULT 'moderate',
          "investmentHorizon" TEXT NOT NULL DEFAULT 'medium',
          "preferredAssets" TEXT NOT NULL DEFAULT '[]',
          "preferredMarkets" TEXT NOT NULL DEFAULT '[]',
          "capitalRange" TEXT NOT NULL DEFAULT 'unknown',
          "tradingFrequency" TEXT NOT NULL DEFAULT 'weekly',
          interests TEXT NOT NULL DEFAULT '[]',
          "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
          "onboardingStep" INTEGER NOT NULL DEFAULT 0,
          "lastAdvisorRun" TIMESTAMP(3),
          "advisorEnabled" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS user_profiles_userId_idx ON user_profiles("userId");
        CREATE INDEX IF NOT EXISTS user_profiles_experienceLevel_idx ON user_profiles("experienceLevel");
        CREATE INDEX IF NOT EXISTS user_profiles_riskTolerance_idx ON user_profiles("riskTolerance");
      `);
      created.push('user_profiles');
    } catch (e: any) {
      errors.push(`user_profiles: ${e.message}`);
    }
  }

  // جدول personalized_recommendations
  try {
    await db.$queryRaw`SELECT 1 FROM personalized_recommendations LIMIT 1`;
    existing.push('personalized_recommendations');
  } catch {
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS personalized_recommendations (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "userId" TEXT NOT NULL,
          "profileId" TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          "recommendationType" TEXT NOT NULL,
          title TEXT NOT NULL,
          "titleEn" TEXT,
          summary TEXT NOT NULL DEFAULT '',
          reasoning TEXT NOT NULL DEFAULT '',
          "actionItems" TEXT NOT NULL DEFAULT '[]',
          "relatedAssetClasses" TEXT NOT NULL DEFAULT '[]',
          "relatedSymbols" TEXT NOT NULL DEFAULT '[]',
          "relatedReportIds" TEXT NOT NULL DEFAULT '[]',
          "relatedNewsIds" TEXT NOT NULL DEFAULT '[]',
          "confidenceScore" INTEGER NOT NULL DEFAULT 50,
          "urgencyLevel" TEXT NOT NULL DEFAULT 'normal',
          "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "validUntil" TIMESTAMP(3),
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "isDismissed" BOOLEAN NOT NULL DEFAULT false,
          "isActioned" BOOLEAN NOT NULL DEFAULT false,
          "userFeedback" TEXT,
          "sourceData" TEXT NOT NULL DEFAULT '{}',
          "generatedBy" TEXT NOT NULL DEFAULT 'advisor',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS pers_rec_userId_isRead_idx ON personalized_recommendations("userId", "isRead");
        CREATE INDEX IF NOT EXISTS pers_rec_userId_isDismissed_idx ON personalized_recommendations("userId", "isDismissed");
        CREATE INDEX IF NOT EXISTS pers_rec_userId_createdAt_idx ON personalized_recommendations("userId", "createdAt");
        CREATE INDEX IF NOT EXISTS pers_rec_type_urgency_idx ON personalized_recommendations("recommendationType", "urgencyLevel");
        CREATE INDEX IF NOT EXISTS pers_rec_validFrom_validUntil_idx ON personalized_recommendations("validFrom", "validUntil");
      `);
      created.push('personalized_recommendations');
    } catch (e: any) {
      errors.push(`personalized_recommendations: ${e.message}`);
    }
  }

  // ─── PR#23: إضافة الأعمدة الجديدة إذا لم تكن موجودة ────────

  // أعمدة user_profiles الجديدة
  const userProfileNewCols = [
    { name: 'excludedAssets', type: 'TEXT NOT NULL DEFAULT \'[]\'' },
    { name: 'minConfidenceScore', type: 'INTEGER NOT NULL DEFAULT 40' },
    { name: 'successRate', type: 'DOUBLE PRECISION NOT NULL DEFAULT 0' },
    { name: 'allowGeneralRecommendations', type: 'BOOLEAN NOT NULL DEFAULT false' },
  ];

  for (const col of userProfileNewCols) {
    try {
      const exists = await db.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = ${col.name}
      ` as any[];
      if (exists.length === 0) {
        await db.$executeRawUnsafe(`ALTER TABLE "user_profiles" ADD COLUMN "${col.name}" ${col.type}`);
        created.push(`user_profiles.${col.name}`);
      }
    } catch (e: any) {
      errors.push(`user_profiles.${col.name}: ${e.message}`);
    }
  }

  // أعمدة personalized_recommendations الجديدة
  const recNewCols = [
    { name: 'reportId', type: 'TEXT' },
    { name: 'reportSlug', type: 'TEXT' },
    { name: 'reportTitle', type: 'TEXT' },
    { name: 'asset', type: 'TEXT' },
    { name: 'action', type: 'TEXT' },
    { name: 'entryPrice', type: 'TEXT' },
    { name: 'targetPrice', type: 'TEXT' },
    { name: 'stopLoss', type: 'TEXT' },
    { name: 'timeHorizon', type: 'TEXT' },
    { name: 'allocationPercent', type: 'TEXT' },
    { name: 'feedbackType', type: 'TEXT' },
    { name: 'executedAt', type: 'TIMESTAMP(3)' },
    { name: 'executionPrice', type: 'TEXT' },
    { name: 'actualProfitLoss', type: 'DOUBLE PRECISION' },
    { name: 'isSuccessful', type: 'BOOLEAN' },
  ];

  for (const col of recNewCols) {
    try {
      const exists = await db.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'personalized_recommendations' AND column_name = ${col.name}
      ` as any[];
      if (exists.length === 0) {
        await db.$executeRawUnsafe(`ALTER TABLE "personalized_recommendations" ADD COLUMN "${col.name}" ${col.type}`);
        created.push(`personalized_recommendations.${col.name}`);
      }
    } catch (e: any) {
      errors.push(`personalized_recommendations.${col.name}: ${e.message}`);
    }
  }

  // فهارس PR#23
  try {
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_asset_idx ON personalized_recommendations("asset")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_feedbackType_idx ON personalized_recommendations("feedbackType")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_isSuccessful_idx ON personalized_recommendations("isSuccessful")`);
  } catch (e: any) {
    errors.push(`PR23_indexes: ${e.message}`);
  }

  return { created, existing, errors };
}

export async function GET(request: NextRequest) {
  try {
    const result = await ensureAdvisorTables();
    return NextResponse.json({
      success: true,
      message: 'Advisor tables check complete',
      ...result,
    });
  } catch (error: any) {
    console.error('[API:Advisor:Setup] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await ensureAdvisorTables();
    return NextResponse.json({
      success: true,
      message: 'Advisor tables setup complete',
      ...result,
    });
  } catch (error: any) {
    console.error('[API:Advisor:Setup] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
