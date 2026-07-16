// ─── مساعد رؤى — Profile API ─────────────────────────────
// GET: جلب الملف الشخصي
// POST: إنشاء أو تحديث الملف الشخصي (onboarding)
//
// FIX 1: UserProfile has a required FK to User table.
//   When onboarding generates a guest userId, the User record
//   doesn't exist yet, causing FK constraint violation.
//   Solution: Ensure a User record exists before creating/updating UserProfile.
//
// FIX 2: prisma db push in build script may silently fail,
//   leaving user_profiles / personalized_recommendations tables
//   non-existent in production. Solution: Auto-create missing
//   tables using raw SQL on first API call.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── تتبع هل تم فحص الجداول مسبقاً (في ذاكرة العملية فقط) ──
let tablesChecked = false;

/**
 * إنشاء الجداول المطلوبة لمساعد رؤى باستخدام raw SQL
 * يعمل فقط مرة واحدة لكل عملية — بعدها tablesChecked = true
 */
async function ensureAdvisorTables(): Promise<void> {
  if (tablesChecked) return;

  // ── Step 1: Check if user_profiles table exists ──
  let profilesTableExists = true;
  try {
    await db.$queryRaw`SELECT 1 FROM user_profiles LIMIT 1`;
  } catch {
    profilesTableExists = false;
    console.log('[API:Advisor:Profile] user_profiles table missing — creating advisor tables...');
  }

  // ── Step 2: Create tables if they don't exist ──

  // جدول notifications — قد يكون مفقوداً أيضاً
  if (!profilesTableExists) {
    try {
      await db.$queryRaw`SELECT 1 FROM notifications LIMIT 1`;
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
          )
        `);
        await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS notifications_userId_isRead_idx ON notifications("userId", "isRead")`);
        await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS notifications_userId_createdAt_idx ON notifications("userId", "createdAt")`);
        console.log('[API:Advisor:Profile] ✓ Created notifications table');
      } catch (e: any) {
        console.error('[API:Advisor:Profile] ✗ Failed to create notifications:', e.message);
      }
    }

    // جدول user_profiles
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "excludedAssets" TEXT NOT NULL DEFAULT '[]',
          "minConfidenceScore" INTEGER NOT NULL DEFAULT 40,
          "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "allowGeneralRecommendations" BOOLEAN NOT NULL DEFAULT false
        )
      `);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS user_profiles_userId_idx ON user_profiles("userId")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS user_profiles_experienceLevel_idx ON user_profiles("experienceLevel")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS user_profiles_riskTolerance_idx ON user_profiles("riskTolerance")`);
      console.log('[API:Advisor:Profile] ✓ Created user_profiles table');
    } catch (e: any) {
      console.error('[API:Advisor:Profile] ✗ Failed to create user_profiles:', e.message);
      // Don't throw — continue to fix constraints below
    }

    // جدول personalized_recommendations
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
          "reportId" TEXT,
          "reportSlug" TEXT,
          "reportTitle" TEXT,
          asset TEXT,
          action TEXT,
          "entryPrice" TEXT,
          "targetPrice" TEXT,
          "stopLoss" TEXT,
          "timeHorizon" TEXT,
          "allocationPercent" TEXT,
          "feedbackType" TEXT,
          "executedAt" TIMESTAMP(3),
          "executionPrice" TEXT,
          "actualProfitLoss" DOUBLE PRECISION,
          "isSuccessful" BOOLEAN,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_userId_isRead_idx ON personalized_recommendations("userId", "isRead")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_userId_isDismissed_idx ON personalized_recommendations("userId", "isDismissed")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_userId_createdAt_idx ON personalized_recommendations("userId", "createdAt")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_type_urgency_idx ON personalized_recommendations("recommendationType", "urgencyLevel")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_validFrom_validUntil_idx ON personalized_recommendations("validFrom", "validUntil")`);
      console.log('[API:Advisor:Profile] ✓ Created personalized_recommendations table');
    } catch (e: any) {
      console.error('[API:Advisor:Profile] ✗ Failed to create personalized_recommendations:', e.message);
    }
  }

  // ── Step 3: Fix missing UNIQUE constraint on user_profiles.userId ──
  // ROOT CAUSE: CREATE TABLE IF NOT EXISTS doesn't add constraints
  // if the table already exists without them. This causes Prisma upsert()
  // to fail with error 42P10: "no unique or exclusion constraint matching
  // the ON CONFLICT specification"
  try {
    const uniqueConstraints = await db.$queryRaw`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'user_profiles'
        AND constraint_type = 'UNIQUE'
        AND column_name = 'userId'
    ` as any[];

    // Also check via the constraint_column_usage view
    const hasUserIdUnique = await db.$queryRaw`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'user_profiles'
        AND tc.constraint_type = 'UNIQUE'
        AND ccu.column_name = 'userId'
    ` as any[];

    if (hasUserIdUnique.length === 0) {
      // Remove duplicate userId rows first (keep the latest)
      try {
        await db.$executeRawUnsafe(`
          DELETE FROM user_profiles a USING user_profiles b
          WHERE a.id < b.id AND a."userId" = b."userId"
        `);
        console.log('[API:Advisor:Profile] ✓ Removed duplicate userId rows from user_profiles');
      } catch (dedupErr: any) {
        console.warn('[API:Advisor:Profile] Dedup warning:', dedupErr.message);
      }

      // Add the unique constraint
      await db.$executeRawUnsafe(`
        ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_key" UNIQUE ("userId")
      `);
      console.log('[API:Advisor:Profile] ✓ Added UNIQUE constraint on user_profiles.userId');
    }
  } catch (e: any) {
    // Constraint may already exist with different name, or other error
    console.warn('[API:Advisor:Profile] UNIQUE constraint check/add:', e.message);
  }

  // ── Step 4: Add missing columns to user_profiles (PR#23) ──
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
        console.log(`[API:Advisor:Profile] ✓ Added column user_profiles.${col.name}`);
      }
    } catch (e: any) {
      console.warn(`[API:Advisor:Profile] Column user_profiles.${col.name}:`, e.message);
    }
  }

  // ── Step 5: Add missing columns to personalized_recommendations (PR#23) ──
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
        console.log(`[API:Advisor:Profile] ✓ Added column personalized_recommendations.${col.name}`);
      }
    } catch (e: any) {
      console.warn(`[API:Advisor:Profile] Column personalized_recommendations.${col.name}:`, e.message);
    }
  }

  // ── Step 6: Add missing indexes for PR#23 ──
  try {
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_asset_idx ON personalized_recommendations("asset")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_feedbackType_idx ON personalized_recommendations("feedbackType")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS pers_rec_isSuccessful_idx ON personalized_recommendations("isSuccessful")`);
  } catch (e: any) {
    console.warn('[API:Advisor:Profile] PR#23 indexes:', e.message);
  }

  tablesChecked = true;
}

/**
 * ضمان وجود سجل User في قاعدة البيانات قبل إنشاء UserProfile
 * إذا لم يكن المستخدم موجوداً، يتم إنشاء سجل ضيف تلقائياً
 */
async function ensureUserExists(userId: string): Promise<void> {
  if (!userId) return;

  const existingUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existingUser) {
    const guestEmail = `guest_${userId}@rouaa.app`;
    try {
      await db.user.create({
        data: {
          id: userId,
          email: guestEmail,
          name: 'ضيف رؤى',
          role: 'user',
          provider: 'guest',
          plan: 'free',
        },
      });
      console.log(`[API:Advisor:Profile] Created guest user: ${userId}`);
    } catch (createError: any) {
      if (createError.code === 'P2002') {
        const altEmail = `guest_${userId}_${Date.now()}@rouaa.app`;
        await db.user.create({
          data: {
            id: userId,
            email: altEmail,
            name: 'ضيف رؤى',
            role: 'user',
            provider: 'guest',
            plan: 'free',
          },
        });
        console.log(`[API:Advisor:Profile] Created guest user with alt email: ${userId}`);
      } else {
        throw createError;
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // ضمان وجود الجداول قبل أي عملية
    await ensureAdvisorTables();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Use findFirst instead of findUnique — findUnique requires a UNIQUE constraint
    // on userId which may not exist if the table was created by raw SQL.
    const profile = await db.userProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ exists: false, profile: null });
    }

    return NextResponse.json({
      exists: true,
      profile: {
        id: profile.id,
        experienceLevel: profile.experienceLevel,
        riskTolerance: profile.riskTolerance,
        investmentHorizon: profile.investmentHorizon,
        preferredAssets: JSON.parse(profile.preferredAssets || '[]'),
        preferredMarkets: JSON.parse(profile.preferredMarkets || '[]'),
        capitalRange: profile.capitalRange,
        tradingFrequency: profile.tradingFrequency,
        interests: JSON.parse(profile.interests || '[]'),
        onboardingComplete: profile.onboardingComplete,
        onboardingStep: profile.onboardingStep,
        advisorEnabled: profile.advisorEnabled,
        lastAdvisorRun: profile.lastAdvisorRun,
        allowGeneralRecommendations: profile.allowGeneralRecommendations ?? false,
      },
    });
  } catch (error: any) {
    console.error('[API:Advisor:Profile] GET error:', error.message, error.code);
    return NextResponse.json({
      error: 'Failed to fetch profile',
      detail: error.message,
      code: error.code || 'UNKNOWN',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // ضمان وجود الجداول قبل أي عملية
    await ensureAdvisorTables();

    const body = await request.json();
    const {
      userId,
      experienceLevel,
      riskTolerance,
      investmentHorizon,
      preferredAssets,
      preferredMarkets,
      capitalRange,
      tradingFrequency,
      interests,
      onboardingComplete,
      onboardingStep,
      allowGeneralRecommendations,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // ضمان وجود سجل User قبل إنشاء/تحديث UserProfile
    await ensureUserExists(userId);

    // ── Use findFirst + create/update instead of upsert ──
    // upsert() requires a UNIQUE constraint on userId to generate
    // INSERT ... ON CONFLICT ("userId") DO UPDATE. If the constraint
    // is missing (common when tables were created by raw SQL), the
    // upsert fails with PostgreSQL error 42P10 wrapped as UNKNOWN.
    // findFirst() doesn't need a unique constraint and is safer.
    const updateData = {
      ...(experienceLevel && { experienceLevel }),
      ...(riskTolerance && { riskTolerance }),
      ...(investmentHorizon && { investmentHorizon }),
      ...(preferredAssets && { preferredAssets: JSON.stringify(preferredAssets) }),
      ...(preferredMarkets && { preferredMarkets: JSON.stringify(preferredMarkets) }),
      ...(capitalRange && { capitalRange }),
      ...(tradingFrequency && { tradingFrequency }),
      ...(interests && { interests: JSON.stringify(interests) }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
      ...(onboardingStep !== undefined && { onboardingStep }),
      ...(allowGeneralRecommendations !== undefined && { allowGeneralRecommendations }),
    };
    const createData = {
      userId,
      experienceLevel: experienceLevel || 'beginner',
      riskTolerance: riskTolerance || 'moderate',
      investmentHorizon: investmentHorizon || 'medium',
      preferredAssets: JSON.stringify(preferredAssets || []),
      preferredMarkets: JSON.stringify(preferredMarkets || []),
      capitalRange: capitalRange || 'unknown',
      tradingFrequency: tradingFrequency || 'weekly',
      interests: JSON.stringify(interests || []),
      onboardingComplete: onboardingComplete || false,
      onboardingStep: onboardingStep || 0,
      allowGeneralRecommendations: allowGeneralRecommendations || false,
    };

    let profile;
    try {
      const existingProfile = await db.userProfile.findFirst({
        where: { userId },
      });

      if (existingProfile) {
        profile = await db.userProfile.update({
          where: { id: existingProfile.id },
          data: updateData,
        });
      } else {
        profile = await db.userProfile.create({
          data: createData,
        });
      }
    } catch (findFirstError: any) {
      // Fallback: If create/update fails due to missing column or constraint,
      // try fixing the schema and retry.
      console.warn('[API:Advisor:Profile] findFirst+create/update failed, attempting schema fix:', findFirstError.message?.slice(0, 300));
      console.warn('[API:Advisor:Profile] Error code:', findFirstError.code, '| meta:', JSON.stringify(findFirstError.meta)?.slice(0, 200));
      tablesChecked = false; // Reset so ensureAdvisorTables re-runs on next request

      // Try adding missing columns
      const missingCols = [
        { name: 'allowGeneralRecommendations', type: 'BOOLEAN NOT NULL DEFAULT false' },
        { name: 'excludedAssets', type: 'TEXT NOT NULL DEFAULT \'[]\'' },
        { name: 'minConfidenceScore', type: 'INTEGER NOT NULL DEFAULT 40' },
        { name: 'successRate', type: 'DOUBLE PRECISION NOT NULL DEFAULT 0' },
      ];
      for (const col of missingCols) {
        try { await db.$executeRawUnsafe(`ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`); } catch {}
      }

      // Try ensuring the UNIQUE constraint on userId (needed for upsert fallback)
      try {
        const hasUnique = await db.$queryRaw`
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = 'user_profiles'
            AND tc.constraint_type = 'UNIQUE'
            AND ccu.column_name = 'userId'
        ` as any[];
        if (hasUnique.length === 0) {
          // Remove duplicates first
          try {
            await db.$executeRawUnsafe(`
              DELETE FROM user_profiles a USING user_profiles b
              WHERE a.id < b.id AND a."userId" = b."userId"
            `);
          } catch {}
          await db.$executeRawUnsafe(`ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_key" UNIQUE ("userId")`);
          console.log('[API:Advisor:Profile] ✓ Added UNIQUE constraint on userId via fallback');
        }
      } catch (e: any) {
        console.warn('[API:Advisor:Profile] UNIQUE constraint fallback:', e.message?.slice(0, 100));
      }

      // Retry with findFirst + create/update again
      const existingProfile = await db.userProfile.findFirst({
        where: { userId },
      });

      if (existingProfile) {
        profile = await db.userProfile.update({
          where: { id: existingProfile.id },
          data: updateData,
        });
      } else {
        try {
          profile = await db.userProfile.create({
            data: createData,
          });
        } catch (createError: any) {
          // Race condition: another request may have created the profile concurrently
          if (createError.code === 'P2002') {
            // Unique constraint violation — profile was created by concurrent request
            const concurrentProfile = await db.userProfile.findFirst({ where: { userId } });
            if (concurrentProfile) {
              profile = await db.userProfile.update({
                where: { id: concurrentProfile.id },
                data: updateData,
              });
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
    }

    if (onboardingComplete) {
      try {
        await db.notification.create({
          data: {
            userId,
            title: 'مرحباً بك في مساعد رؤى!',
            message: 'تم إعداد ملفك الشخصي. سنبدأ بتقديم توصيات مخصصة لك بناءً على اهتماماتك وتحملك للمخاطر.',
            type: 'system',
            link: '/advisor',
          },
        });
      } catch (notifError: any) {
        console.error('[API:Advisor:Profile] Notification creation failed:', notifError.message);
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        experienceLevel: profile.experienceLevel,
        riskTolerance: profile.riskTolerance,
        investmentHorizon: profile.investmentHorizon,
        onboardingComplete: profile.onboardingComplete,
        onboardingStep: profile.onboardingStep,
      },
    });
  } catch (error: any) {
    console.error('[API:Advisor:Profile] POST error:', error.message, error.code, error.meta);
    // Reset tablesChecked so the next request re-verifyies the schema
    tablesChecked = false;
    return NextResponse.json({
      error: 'Failed to save profile',
      detail: error.message?.slice(0, 500),
      code: error.code || 'UNKNOWN',
      ...(error.meta && { meta: JSON.stringify(error.meta)?.slice(0, 300) }),
    }, { status: 500 });
  }
}
