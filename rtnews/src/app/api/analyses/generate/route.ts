// ─── Manual Analysis Generation Endpoint V62 ───────────────
// POST /api/analyses/generate
// Allows manual triggering of market analysis generation.
// Body: { assetClass: 'stocks' | 'commodities' | 'forex' | 'crypto' | 'bonds', force?: boolean }
// Protected: requires x-internal header or CRON_SECRET

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateMarketAnalysis,
  saveAnalysisToDb,
  type GeneratedAnalysis,
} from '@/lib/report-generator';
import type { AssetClass } from '@/lib/report-templates';
import { ASSET_CLASS_LABELS } from '@/lib/report-templates';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;



// ─── POST Handler ───────────────────────────────────────────
export async function POST(request: Request) {
  const startTime = Date.now();

  // Auth check
  if (!verifyInternalOrCronAuth(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: {
    assetClass?: string;
    force?: boolean;
  };

  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json(
      { error: 'الجسم مطلوب بتنسيق JSON' },
      { status: 400 }
    );
  }

  const { assetClass, force = false } = body;

  if (!assetClass) {
    return NextResponse.json(
      { error: 'فئة الأصل مطلوبة. الفئات: stocks, commodities, forex, crypto, bonds, energy, realEstate, economy, banking' },
      { status: 400 }
    );
  }

  const validClasses: AssetClass[] = ['stocks', 'commodities', 'forex', 'crypto', 'bonds', 'energy', 'realEstate', 'economy', 'banking'];
  if (!validClasses.includes(assetClass as AssetClass)) {
    return NextResponse.json(
      { error: `فئة أصل غير صالحة: "${assetClass}". الفئات المتاحة: ${validClasses.join(', ')}` },
      { status: 400 }
    );
  }

  const ac = assetClass as AssetClass;
  const acLabel = ASSET_CLASS_LABELS[ac];

  // Check if an analysis of the same asset class already exists today (unless force=true)
  if (!force) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingAnalysis = await db.marketAnalysis.findFirst({
        where: {
          assetClass: ac,
          locale: 'ar',  // V337: Arabic dedup only
          createdAt: { gte: today },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingAnalysis) {
        return NextResponse.json({
          success: true,
          message: `تحليل ${acLabel.nameAr} موجود بالفعل اليوم`,
          existingAnalysis: {
            id: existingAnalysis.id,
            title: existingAnalysis.title,
            slug: existingAnalysis.slug,
            sentiment: existingAnalysis.sentiment,
            riskLevel: existingAnalysis.riskLevel,
            confidence: existingAnalysis.confidenceScore,
            published: existingAnalysis.isPublished,
            createdAt: existingAnalysis.createdAt,
            validUntil: existingAnalysis.validUntil,
          },
          tip: 'استخدم force=true لتوليد تحليل جديد بغض النظر عن التحليل الموجود',
        });
      }
    } catch (error: any) {
      console.warn('[AnalysesGenerate] Could not check existing analyses:', error.message);
      // Continue with generation even if check fails
    }
  }

  // Generate the analysis
  try {
    console.log(`[AnalysesGenerate] Generating ${ac} analysis (force=${force})...`);

    // V166: Pass forceFull=true — manual generation should always produce full reports
    const analysis: GeneratedAnalysis = await generateMarketAnalysis(ac, undefined, undefined, undefined, undefined, true);

    // Save to DB
    const saved = await saveAnalysisToDb(analysis, force);

    const duration = Date.now() - startTime;
    console.log(`[AnalysesGenerate] ${ac} analysis generated in ${duration}ms`);

    if (!saved) {
      return NextResponse.json({
        success: false,
        message: 'فشل حفظ التحليل في قاعدة البيانات',
        duration,
        analysis: {
          title: analysis.title,
          confidence: analysis.confidenceScore,
          published: analysis.isPublished,
          sentiment: analysis.sentiment,
          riskLevel: analysis.riskLevel,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      duration,
      analysis: {
        id: saved.id,
        title: saved.title,
        slug: analysis.slug,
        assetClass: analysis.assetClass,
        assetClassNameAr: acLabel.nameAr,
        analysisType: analysis.analysisType,
        timeFrame: analysis.timeFrame,
        sentiment: analysis.sentiment,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidenceScore,
        published: analysis.isPublished,
        validUntil: analysis.validUntil,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[AnalysesGenerate] Error generating ${ac} analysis:`, error.message);

    return NextResponse.json(
      {
        success: false,
        duration,
        error: process.env.NODE_ENV === 'production'
          ? 'حدث خطأ أثناء إنشاء التحليل'
          : error.message,
      },
      { status: 500 }
    );
  }
}
