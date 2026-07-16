// ─── Manual Report Generation Endpoint V317 ────────────────
// POST /api/reports/generate
// Allows manual triggering of report generation for Arabic, English, and French.
// Body: { type, eventType?, force?, scope?, wordCount?, async?, prompt?, assetClass?, publish?, title?, locale? }
// V313: Added locale support — when locale='en', uses English generators from en-report-generator.ts
// V317: Added French support — when locale='fr', uses French generators from fr-report-generator.ts
// V68: Added custom prompt support, assetClass for analysis, publish flag, admin cookie auth
// When async=true, returns 202 immediately and generates in background.
// Protected: requires x-internal header, CRON_SECRET, or admin JWT cookie

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateReport,
  generateMarketAnalysis,
  saveReportToDb,
  saveAnalysisToDb,
  type GeneratedReport,
  type GeneratedAnalysis,
} from '@/lib/report-generator';
import {
  generateDailyBriefEn,
  generateWeeklyAnalysisEn,
  generateMonthlyOutlookEn,
  generateMarketAnalysisEn,
  generateTechnicalAnalysisEn,
  type EnGeneratedReport,
  type EnGeneratedAnalysis,
} from '@/lib/pipeline/agents/en-report-generator';
// V317: French report generators
import {
  generateDailyBriefFr,
  generateWeeklyAnalysisFr,
  generateMonthlyOutlookFr,
  generateMarketAnalysisFr,
  generateTechnicalAnalysisFr,
  type FrGeneratedReport,
  type FrGeneratedAnalysis,
} from '@/lib/pipeline/agents/fr-report-generator';
// V318: Turkish report generators
import {
  generateDailyBriefTr,
  generateWeeklyAnalysisTr,
  generateMonthlyOutlookTr,
  generateMarketAnalysisTr,
  generateTechnicalAnalysisTr,
  type TrGeneratedReport,
  type TrGeneratedAnalysis,
} from '@/lib/pipeline/agents/tr-report-generator';
// V319: Spanish report generators
import {
  generateDailyBriefEs,
  generateWeeklyAnalysisEs,
  generateMonthlyOutlookEs,
  generateMarketAnalysisEs,
  generateTechnicalAnalysisEs,
  type EsGeneratedReport,
  type EsGeneratedAnalysis,
} from '@/lib/pipeline/agents/es-report-generator';
// V315: generateMarketAnalysisEn now returns EnGeneratedAnalysis (saves to MarketAnalysis)
import type { ReportType, AssetClass } from '@/lib/report-templates';
import { verifyAdminToken, verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // V66: Allow up to 5 minutes for multi-pass generation



async function verifyDashboardAuth(request: Request): Promise<boolean> {
  try {
    const token = (request as NextRequest).cookies?.get?.('admin_token')?.value;
    if (!token) return false;
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

async function verifyAuth(request: Request): Promise<boolean> {
  if (verifyInternalOrCronAuth(request)) return true;
  if (await verifyDashboardAuth(request)) return true;
  return false;
}

// ─── Background Generation Tracker ─────────────────────────
interface GenerationJob {
  id: string;
  type: string;
  wordCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  result?: { id: string; title: string; slug: string; confidence: number; published: boolean };
  error?: string;
}

const generationJobs = new Map<string, GenerationJob>();

// V159: Job timeout — mark stale jobs as failed after 10 minutes
const JOB_TIMEOUT_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of generationJobs) {
    if ((job.status === 'pending' || job.status === 'running') && now - job.startedAt > JOB_TIMEOUT_MS) {
      job.status = 'failed';
      job.completedAt = now;
      job.error = 'انتهت مهلة التوليد — استغرق العمل وقتاً أطول من المتوقع';
      console.warn(`[ReportsGenerate] Job ${id} timed out after ${now - job.startedAt}ms`);
    }
  }
}, 60_000); // Check every minute

// ─── Background Generator ──────────────────────────────────
interface GenerationOptions {
  reportType: ReportType;
  eventType?: string;
  scope?: string;
  wordCount?: number;
  force?: boolean;
  prompt?: string;
  title?: string;
  assetClass?: AssetClass;
  publish?: boolean;
  locale?: string; // V313: 'ar' (default), 'en', 'fr' (V317), 'tr' (V318), or 'es' (V319)
  // V316: Strategic report context
  region?: string;
  sectors?: string[];
  scenarios?: string[];
}

async function runGenerationJob(
  job: GenerationJob,
  options: GenerationOptions
) {
  job.status = 'running';
  const { reportType, eventType, scope, wordCount, force, prompt, title, assetClass, publish, locale, region, sectors, scenarios } = options;
  const isEnglish = locale === 'en';
  const isFrench = locale === 'fr';
  const isTurkish = locale === 'tr';
  const isSpanish = locale === 'es';
  console.log(`[ReportsGenerate V319] Background job ${job.id} started: ${reportType} ${wordCount}w ${assetClass ? `assetClass=${assetClass}` : ''} locale=${isSpanish ? 'es' : isTurkish ? 'tr' : isFrench ? 'fr' : isEnglish ? 'en' : 'ar'}`);

  try {
    // ── V318: Turkish generation path ──
    if (isTurkish) {
      if (assetClass) {
        const trAnalysis = await generateMarketAnalysisTr(assetClass as any);
        if (trAnalysis) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '',
            title: trAnalysis.title,
            slug: trAnalysis.slug,
            confidence: trAnalysis.confidenceScore,
            published: trAnalysis.isPublished,
          };
        } else {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'Turkish market analysis returned null — insufficient data or blocked by speculation gate';
        }
      } else {
        let trReport: TrGeneratedReport | null = null;
        switch (reportType) {
          case 'daily':
            trReport = await generateDailyBriefTr('daily', { prompt, title });
            break;
          case 'weekly':
            const weeklyAnalysis = await generateWeeklyAnalysisTr(assetClass || 'stocks' as any);
            if (weeklyAnalysis) {
              job.status = 'completed';
              job.completedAt = Date.now();
              job.result = {
                id: '',
                title: weeklyAnalysis.title,
                slug: weeklyAnalysis.slug,
                confidence: weeklyAnalysis.confidenceScore,
                published: weeklyAnalysis.isPublished,
              };
            } else {
              job.status = 'failed';
              job.completedAt = Date.now();
              job.error = 'Turkish weekly analysis returned null';
            }
            break;
          case 'monthly':
            trReport = await generateMonthlyOutlookTr({ prompt, title });
            break;
          case 'quarterly':
            trReport = await generateDailyBriefTr('quarterly', { prompt, title });
            break;
          case 'special':
            trReport = await generateDailyBriefTr('special', { prompt, title });
            break;
          case 'strategic':
            trReport = await generateDailyBriefTr('strategic', { prompt, title, region, sectors, scenarios });
            break;
          default:
            trReport = await generateDailyBriefTr(reportType, { prompt, title });
        }

        if (reportType !== 'weekly' && trReport) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '',
            title: trReport.title,
            slug: trReport.slug,
            confidence: trReport.confidenceScore,
            published: trReport.isPublished,
          };
        } else if (reportType !== 'weekly' && !trReport) {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'Turkish report generation returned null — insufficient data or blocked by speculation gate';
        }
      }
    }
    // ── V319: Spanish generation path ──
    else if (isSpanish) {
      if (assetClass) {
        const esAnalysis = await generateMarketAnalysisEs(assetClass as any);
        if (esAnalysis) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '',
            title: esAnalysis.title,
            slug: esAnalysis.slug,
            confidence: esAnalysis.confidenceScore,
            published: esAnalysis.isPublished,
          };
        } else {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'Spanish market analysis returned null — insufficient data or blocked by speculation gate';
        }
      } else {
        let esReport: EsGeneratedReport | null = null;
        switch (reportType) {
          case 'daily':
            esReport = await generateDailyBriefEs('daily', { prompt, title });
            break;
          case 'weekly':
            const weeklyAnalysis = await generateWeeklyAnalysisEs(assetClass || 'stocks' as any);
            if (weeklyAnalysis) {
              job.status = 'completed';
              job.completedAt = Date.now();
              job.result = {
                id: '',
                title: weeklyAnalysis.title,
                slug: weeklyAnalysis.slug,
                confidence: weeklyAnalysis.confidenceScore,
                published: weeklyAnalysis.isPublished,
              };
            } else {
              job.status = 'failed';
              job.completedAt = Date.now();
              job.error = 'Spanish weekly analysis returned null';
            }
            break;
          case 'monthly':
            esReport = await generateMonthlyOutlookEs({ prompt, title });
            break;
          case 'quarterly':
            esReport = await generateDailyBriefEs('quarterly', { prompt, title });
            break;
          case 'special':
            esReport = await generateDailyBriefEs('special', { prompt, title });
            break;
          case 'strategic':
            // V319: Strategic Spanish reports — pass full context (title, prompt, region, sectors, scenarios)
            esReport = await generateDailyBriefEs('strategic', { prompt, title, region, sectors, scenarios });
            break;
          default:
            esReport = await generateDailyBriefEs(reportType, { prompt, title });
        }

        if (reportType !== 'weekly' && esReport) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '',
            title: esReport.title,
            slug: esReport.slug,
            confidence: esReport.confidenceScore,
            published: esReport.isPublished,
          };
        } else if (reportType !== 'weekly' && !esReport) {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'Spanish report generation returned null — insufficient data or blocked by speculation gate';
        }
      }
    }
    // ── V317: French generation path ──
    else if (isFrench) {
      if (assetClass) {
        // French market analysis per asset class
        const frAnalysis = await generateMarketAnalysisFr(assetClass as any);
        if (frAnalysis) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '', // FR generator saves directly to DB
            title: frAnalysis.title,
            slug: frAnalysis.slug,
            confidence: frAnalysis.confidenceScore,
            published: frAnalysis.isPublished,
          };
        } else {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'French market analysis returned null — insufficient data or blocked by speculation gate';
        }
      } else {
        // French report by type
        let frReport: FrGeneratedReport | null = null;
        switch (reportType) {
          case 'daily':
            frReport = await generateDailyBriefFr('daily', { prompt, title });
            break;
          case 'weekly':
            const weeklyAnalysis = await generateWeeklyAnalysisFr(assetClass || 'stocks' as any);
            if (weeklyAnalysis) {
              job.status = 'completed';
              job.completedAt = Date.now();
              job.result = {
                id: '',
                title: weeklyAnalysis.title,
                slug: weeklyAnalysis.slug,
                confidence: weeklyAnalysis.confidenceScore,
                published: weeklyAnalysis.isPublished,
              };
            } else {
              job.status = 'failed';
              job.completedAt = Date.now();
              job.error = 'French weekly analysis returned null';
            }
            break;
          case 'monthly':
            frReport = await generateMonthlyOutlookFr();
            break;
          case 'quarterly':
            frReport = await generateDailyBriefFr('quarterly', { prompt, title });
            break;
          case 'special':
            frReport = await generateDailyBriefFr('special', { prompt, title });
            break;
          case 'strategic':
            // V317: Strategic French reports — pass full context (title, prompt, region, sectors, scenarios)
            frReport = await generateDailyBriefFr('strategic', { prompt, title, region, sectors, scenarios });
            break;
          default:
            frReport = await generateDailyBriefFr(reportType, { prompt, title });
        }

        if (reportType !== 'weekly' && frReport) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '',
            title: frReport.title,
            slug: frReport.slug,
            confidence: frReport.confidenceScore,
            published: frReport.isPublished,
          };
        } else if (reportType !== 'weekly' && !frReport) {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'French report generation returned null — insufficient data or blocked by speculation gate';
        }
      }
    }
    // ── V313/V315: English generation path ──
    else if (isEnglish) {
      if (assetClass) {
        // V315: English market analysis per asset class — now returns EnGeneratedAnalysis (saves to MarketAnalysis)
        const enAnalysis = await generateMarketAnalysisEn(assetClass, { prompt, title });
        if (enAnalysis) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '', // EN generator saves directly to DB
            title: enAnalysis.title,
            slug: enAnalysis.slug,
            confidence: enAnalysis.confidenceScore,
            published: enAnalysis.isPublished,
          };
        } else {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'English market analysis returned null — insufficient data or blocked by speculation gate';
        }
      } else {
        // English report by type
        let enReport: EnGeneratedReport | null = null;
        switch (reportType) {
          case 'daily':
            enReport = await generateDailyBriefEn('daily', { prompt, title });
            break;
          case 'weekly':
            // Weekly in EN generates an analysis, not a report
            const weeklyAnalysis = await generateWeeklyAnalysisEn(assetClass || 'stocks', { prompt, title });
            if (weeklyAnalysis) {
              job.status = 'completed';
              job.completedAt = Date.now();
              job.result = {
                id: '',
                title: weeklyAnalysis.title,
                slug: weeklyAnalysis.slug,
                confidence: weeklyAnalysis.confidenceScore,
                published: weeklyAnalysis.isPublished,
              };
            } else {
              job.status = 'failed';
              job.completedAt = Date.now();
              job.error = 'English weekly analysis returned null';
            }
            break;
          case 'monthly':
            enReport = await generateMonthlyOutlookEn({ prompt, title });
            break;
          case 'quarterly':
            enReport = await generateDailyBriefEn('quarterly', { prompt, title });
            break;
          case 'special':
            enReport = await generateDailyBriefEn('special', { event: eventType, prompt, title });
            break;
          case 'strategic':
            // V316: Strategic English reports — pass full context (title, prompt, region, sectors, scenarios)
            enReport = await generateDailyBriefEn('strategic', { prompt, title, region, sectors, scenarios });
            break;
          default:
            enReport = await generateDailyBriefEn(reportType, { prompt, title });
        }

        if (reportType !== 'weekly' && enReport) {
          job.status = 'completed';
          job.completedAt = Date.now();
          job.result = {
            id: '',
            title: enReport.title,
            slug: enReport.slug,
            confidence: enReport.confidenceScore,
            published: enReport.isPublished,
          };
        } else if (reportType !== 'weekly' && !enReport) {
          job.status = 'failed';
          job.completedAt = Date.now();
          job.error = 'English report generation returned null — insufficient data or blocked by speculation gate';
        }
      }
    } else {
      // ── Arabic generation path (original) ──
      // If assetClass is specified, generate a MarketAnalysis instead
      if (assetClass) {
        // V163: Pass forceFull=true for manual generation — user wants full AI report
        const analysis: GeneratedAnalysis = await generateMarketAnalysis(assetClass, undefined, undefined, prompt, title, true);
        
        // V365 FIX: Pass force flag to saveAnalysisToDb so quality gates don't
        // silently unpublish manually-requested reports. Previously, saveAnalysisToDb
        // was called without force, so even though the user sent force=true, the
        // generic content gate, speculation gate, and substantiality gate could
        // all unpublish the analysis — making it seem like generation "didn't work".
        // Now: when force=true (manual trigger), saveAnalysisToDb respects force-publish
        // logic (confidence >= 20 → force-published), matching the cron route behavior.
        //
        // Override publish status if explicitly requested
        // V222→V365: But NOT if the AI explicitly said "لا تنشر" or confidence ≤ 2/10
        if (publish && !analysis.isPublished) {
          const contentStr = typeof analysis.content === 'string' ? analysis.content : JSON.stringify(analysis.content || '');
          const doNotPublishPatterns = [
            /تصنيف\s*النشر\s*:\s*لا\s*تنشر/i,
            /مستوى\s*الثقة\s*[:\s]*([1-2])\s*\/\s*10/i,
            /ثقة\s*[:\s]*([1-2])\s*\/\s*10/i,
          ];
          const hasDoNotPublish = doNotPublishPatterns.some(p => p.test(contentStr));
          if (hasDoNotPublish) {
            console.warn(`[ReportsGenerate V365] BLOCKED manual publish override: AI explicitly said "لا تنشر". Report saved as unpublished.`);
          } else {
            (analysis as any).isPublished = true;
            (analysis as any).publishedAt = new Date();
          }
        }
        
        // V365 FIX: Pass force flag — this is the root cause of manual buttons "not working".
        // Without force=true, quality gates unpublish the analysis even when user requested force+publish.
        const saved = await saveAnalysisToDb(analysis, force || publish);
        
        job.status = 'completed';
        job.completedAt = Date.now();
        if (saved) {
          job.result = {
            id: saved.id,
            title: analysis.title,
            slug: saved.slug || analysis.slug,
            confidence: analysis.confidenceScore,
            published: analysis.isPublished,
          };
        }
      } else {
        const report: GeneratedReport = await generateReport(reportType, {
          event: eventType,
          force,
          scope,
          wordCount: wordCount && wordCount > 0 ? wordCount : undefined,
          prompt,
          title,
        });

        // Override publish status if explicitly requested
        // V365: Same fix as analyses — only block if AI explicitly said "لا تنشر" or confidence ≤ 2/10
        if (publish && !report.isPublished) {
          const contentStr = typeof report.content === 'string' ? report.content : JSON.stringify(report.content || '');
          const doNotPublishPatterns = [
            /تصنيف\s*النشر\s*:\s*لا\s*تنشر/i,
            /مستوى\s*الثقة\s*[:\s]*([1-2])\s*\/\s*10/i,
            /ثقة\s*[:\s]*([1-2])\s*\/\s*10/i,
          ];
          const hasDoNotPublish = doNotPublishPatterns.some(p => p.test(contentStr));
          if (hasDoNotPublish) {
            console.warn(`[ReportsGenerate V365] BLOCKED manual publish override for report: AI explicitly said "لا تنشر". Report saved as unpublished.`);
          } else {
            report.isPublished = true;
            report.publishedAt = new Date();
          }
        }

        const saved = await saveReportToDb(report, force);

        job.status = 'completed';
        job.completedAt = Date.now();
        if (saved) {
          job.result = {
            id: saved.id,
            title: saved.title,
            slug: saved.slug,
            confidence: report.confidenceScore,
            published: report.isPublished,
          };
        }
      }
    }

    console.log(`[ReportsGenerate V317] Background job ${job.id} completed in ${Date.now() - job.startedAt}ms`);
  } catch (error: any) {
    job.status = 'failed';
    job.completedAt = Date.now();
    job.error = error.message;
    console.error(`[ReportsGenerate V317] Background job ${job.id} failed:`, error.message);
  }
}

// ─── POST Handler ───────────────────────────────────────────
export async function POST(request: Request) {
  const startTime = Date.now();

  // Auth check — V68: also accepts admin cookie
  if (!(await verifyAuth(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: {
    type?: string;
    eventType?: string;
    force?: boolean;
    scope?: string;
    wordCount?: number;
    async?: boolean;
    prompt?: string;
    title?: string;
    assetClass?: string;
    publish?: boolean;
    locale?: string; // V313/V317: 'ar' (default), 'en', or 'fr'
    // V316: Strategic report context
    region?: string;
    sectors?: string[];
    scenarios?: string[];
  };

  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json(
      { error: 'الجسم مطلوب بتنسيق JSON' },
      { status: 400 }
    );
  }

  const { type, eventType, force = false, scope, wordCount, async: asyncMode = false, prompt, title, assetClass, publish = false, locale, region, sectors, scenarios } = body;
  const isEnglish = locale === 'en';
  const isFrench = locale === 'fr';
  const isTurkish = locale === 'tr';
  const isSpanish = locale === 'es';
  const effectiveLocale = isSpanish ? 'es' : isTurkish ? 'tr' : isFrench ? 'fr' : isEnglish ? 'en' : 'ar';

  if (!type) {
    return NextResponse.json(
      { error: 'نوع التقرير مطلوب. الأنواع: daily, weekly, monthly, quarterly, special, strategic' },
      { status: 400 }
    );
  }

  const validTypes: ReportType[] = ['daily', 'weekly', 'monthly', 'quarterly', 'special', 'strategic'];
  if (!validTypes.includes(type as ReportType)) {
    return NextResponse.json(
      { error: `نوع تقرير غير صالح: "${type}". الأنواع المتاحة: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  const reportType = type as ReportType;

  // V73: Include ALL asset classes (including strategic) for manual report generation
  const validAssetClasses: AssetClass[] = ['strategic', 'stocks', 'commodities', 'forex', 'crypto', 'bonds', 'energy', 'realEstate', 'economy', 'banking', 'technicalAnalysis', 'arabMarkets', 'earnings'];
  const parsedAssetClass = assetClass as AssetClass | undefined;
  if (parsedAssetClass && !validAssetClasses.includes(parsedAssetClass)) {
    return NextResponse.json(
      { error: `تصنيف أصول غير صالح: "${assetClass}". التصنيفات المتاحة: ${validAssetClasses.join(', ')}` },
      { status: 400 }
    );
  }

  // V223: Block disabled asset classes — chronic quality issues
  // V335: Re-enabled arabMarkets — data sources now sufficient
  const V223_DISABLED: AssetClass[] = ['realEstate'];
  if (parsedAssetClass && V223_DISABLED.includes(parsedAssetClass)) {
    return NextResponse.json(
      { error: `تصنيف "${assetClass}" معلق مؤقتاً بسبب جودة البيانات غير الكافية. سيتم إعادة تفعيله لاحقاً.` },
      { status: 422 }
    );
  }

  // Special reports require an event type OR a custom prompt OR an assetClass
  // V158: Also allow special reports when assetClass is provided (analysis mode)
  if (reportType === 'special' && !eventType && !prompt && !parsedAssetClass) {
    return NextResponse.json(
      { error: 'نوع الحدث أو عنوان/وصف مطلوب للتقارير الخاصة. مثال: FOMC, OPEC, NFP' },
      { status: 400 }
    );
  }

  // Strategic reports require a custom prompt or title
  if (reportType === 'strategic' && !prompt && !title) {
    return NextResponse.json(
      { error: 'عنوان أو توجيه مطلوب للتقارير الاستراتيجية' },
      { status: 400 }
    );
  }

  // Check if a report of the same type already exists today (unless force=true)
  if (!force && !parsedAssetClass) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingReport = await db.economicReport.findFirst({
        where: {
          reportType,
          locale: effectiveLocale,
          createdAt: { gte: today },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingReport) {
        return NextResponse.json({
          success: true,
          message: `تقرير ${reportType} موجود بالفعل اليوم`,
          existingReport: {
            id: existingReport.id,
            title: existingReport.title,
            slug: existingReport.slug,
            confidence: existingReport.confidenceScore,
            published: existingReport.isPublished,
            createdAt: existingReport.createdAt,
          },
          tip: 'استخدم force=true لتوليد تقرير جديد بغض النظر عن التقرير الموجود',
        });
      }
    } catch (error: any) {
      console.warn('[ReportsGenerate] Could not check existing reports:', error.message);
    }
  }

  // ── V66: Async mode — return immediately and generate in background ──
  // V68: Always use async for custom prompt/analysis generation
  const useAsync = asyncMode || !!wordCount || !!prompt || !!parsedAssetClass;

  if (useAsync) {
    const jobId = `gen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const job: GenerationJob = {
      id: jobId,
      type: reportType,
      wordCount: wordCount || 0,
      status: 'pending',
      startedAt: Date.now(),
    };
    generationJobs.set(jobId, job);

    // Start generation in background using a fire-and-forget pattern
    const generationOptions: GenerationOptions = {
      reportType,
      eventType,
      scope,
      wordCount,
      force,
      prompt,
      title,
      assetClass: parsedAssetClass,
      publish,
      locale: effectiveLocale, // V317: Now supports 'fr' too
      // V316: Strategic report context
      region,
      sectors,
      scenarios,
    };
    const generationPromise = runGenerationJob(job, generationOptions);
    generationPromise.catch(err => console.error('[Reports V317] Report generation failed:', err instanceof Error ? err.message : err)); // Prevent unhandled rejection

    // Clean up old jobs (keep last 50)
    if (generationJobs.size > 50) {
      const sortedKeys = [...generationJobs.keys()].sort();
      for (let i = 0; i < generationJobs.size - 50; i++) {
        generationJobs.delete(sortedKeys[i]);
      }
    }

    const localeMessages: Record<string, { started: string; checkStatus: string }> = {
      es: { started: 'Generación de informe español iniciada en segundo plano', checkStatus: 'Use GET ?jobId=... para verificar el estado de generación' },
      tr: { started: 'Türkçe rapor oluşturma arka planda başlatıldı', checkStatus: 'Durumu kontrol etmek için GET ?jobId=... kullanın' },
      fr: { started: 'Génération du rapport français lancée en arrière-plan', checkStatus: 'Utilisez GET ?jobId=... pour vérifier le statut' },
      en: { started: 'English report generation started in background', checkStatus: 'Use GET ?jobId=... to check generation status' },
      ar: { started: 'تم بدء توليد التقرير في الخلفية', checkStatus: 'استخدم GET ?jobId=... للتحقق من حالة التوليد' },
    };
    const msg = localeMessages[effectiveLocale] || localeMessages.ar;

    return NextResponse.json({
      success: true,
      message: msg.started,
      jobId,
      status: 'pending',
      type: reportType,
      locale: effectiveLocale,
      wordCount: wordCount || 'default',
      assetClass: parsedAssetClass || null,
      hasPrompt: !!prompt,
      checkStatusUrl: `/api/reports/generate?jobId=${jobId}`,
      note: msg.checkStatus,
    }, { status: 202 });
  }

  // ── Sync mode — wait for generation to complete ──
  try {
    console.log(`[ReportsGenerate] Generating ${reportType} report (force=${force}, sync mode, locale=${effectiveLocale})...`);

    // V319: Spanish sync mode
    if (isSpanish) {
      const esReport = await generateDailyBriefEs(reportType, { prompt, title, region, sectors, scenarios });
      if (esReport) {
        return NextResponse.json({
          success: true,
          duration: Date.now() - startTime,
          report: {
            id: '',
            title: esReport.title,
            slug: esReport.slug,
            type: esReport.reportType,
            confidence: esReport.confidenceScore,
            published: esReport.isPublished,
            marketImpact: esReport.marketImpact,
          },
        });
      } else {
        return NextResponse.json({ success: false, error: 'Spanish report generation returned null' }, { status: 500 });
      }
    }

    // V318: Turkish sync mode
    if (isTurkish) {
      const trReport = await generateDailyBriefTr(reportType as any, { prompt, title, region, sectors, scenarios });
      if (trReport) {
        return NextResponse.json({
          success: true,
          duration: Date.now() - startTime,
          report: {
            id: '',
            title: trReport.title,
            slug: trReport.slug,
            type: trReport.reportType,
            confidence: trReport.confidenceScore,
            published: trReport.isPublished,
            marketImpact: trReport.marketImpact,
          },
        });
      } else {
        return NextResponse.json({ success: false, error: 'Turkish report generation returned null' }, { status: 500 });
      }
    }

    // V317: French sync mode
    if (isFrench) {
      const frReport = await generateDailyBriefFr(reportType, { prompt, title, region, sectors, scenarios });
      if (frReport) {
        return NextResponse.json({
          success: true,
          duration: Date.now() - startTime,
          report: {
            id: '',
            title: frReport.title,
            slug: frReport.slug,
            type: frReport.reportType,
            confidence: frReport.confidenceScore,
            published: frReport.isPublished,
            marketImpact: frReport.marketImpact,
          },
        });
      } else {
        return NextResponse.json({ success: false, error: 'French report generation returned null' }, { status: 500 });
      }
    }

    const report: GeneratedReport = await generateReport(reportType, {
      event: eventType,
      force,
      scope,
      wordCount: wordCount && wordCount > 0 ? wordCount : undefined,
      prompt,
      title,
    });

    const saved = await saveReportToDb(report, force);

    const duration = Date.now() - startTime;
    console.log(`[ReportsGenerate] ${reportType} report generated in ${duration}ms`);

    if (!saved) {
      return NextResponse.json({
        success: false,
        message: 'فشل حفظ التقرير في قاعدة البيانات',
        duration,
        report: {
          title: report.title,
          confidence: report.confidenceScore,
          published: report.isPublished,
          marketImpact: report.marketImpact,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      duration,
      report: {
        id: saved.id,
        title: saved.title,
        slug: saved.slug, // V107: Use actual DB slug, not GeneratedReport slug (fixes 404)
        type: report.reportType,
        scope: report.scope,
        confidence: report.confidenceScore,
        published: report.isPublished,
        marketImpact: report.marketImpact,
        summary: report.summary,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[ReportsGenerate] Error generating ${reportType} report:`, error.message);

    return NextResponse.json(
      {
        success: false,
        duration,
        error: process.env.NODE_ENV === 'production'
          ? 'حدث خطأ أثناء إنشاء التقرير'
          : error.message,
      },
      { status: 500 }
    );
  }
}

// ─── GET: Check Job Status or List Recent Jobs ─────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (jobId) {
    const job = generationJobs.get(jobId);

    // V159: If job not found in memory (container restart), fallback to DB search
    if (!job) {
      console.log(`[ReportsGenerate] Job ${jobId} not found in memory — searching DB for recent report`);
      try {
        // Look for a report created within the last 15 minutes (generation window)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentReport = await db.economicReport.findFirst({
          where: {
            createdAt: { gte: fifteenMinutesAgo },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            confidenceScore: true,
            isPublished: true,
            reportType: true,
            createdAt: true,
          },
        });

        if (recentReport) {
          console.log(`[ReportsGenerate] Found recent report as fallback: ${recentReport.title}`);
          return NextResponse.json({
            jobId,
            type: recentReport.reportType,
            wordCount: 0,
            status: 'completed',
            duration: Date.now() - recentReport.createdAt.getTime(),
            result: {
              id: recentReport.id,
              title: recentReport.title,
              slug: recentReport.slug,
              confidence: recentReport.confidenceScore,
              published: recentReport.isPublished,
            },
            note: 'تم استعادة الحالة من قاعدة البيانات (الحاوية أعيد تشغيلها أثناء التوليد)',
          });
        }

        // Also check market analyses
        const recentAnalysis = await db.marketAnalysis.findFirst({
          where: {
            createdAt: { gte: fifteenMinutesAgo },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            confidenceScore: true,
            isPublished: true,
            assetClass: true,
            createdAt: true,
          },
        });

        if (recentAnalysis) {
          console.log(`[ReportsGenerate] Found recent analysis as fallback: ${recentAnalysis.title}`);
          return NextResponse.json({
            jobId,
            type: 'analysis',
            wordCount: 0,
            status: 'completed',
            duration: Date.now() - recentAnalysis.createdAt.getTime(),
            result: {
              id: recentAnalysis.id,
              title: recentAnalysis.title,
              slug: recentAnalysis.slug,
              confidence: recentAnalysis.confidenceScore,
              published: recentAnalysis.isPublished,
            },
            note: 'تم استعادة الحالة من قاعدة البيانات (الحاوية أعيد تشغيلها أثناء التوليد)',
          });
        }

        // No recent report found — job truly lost
        return NextResponse.json({
          jobId,
          status: 'failed',
          error: 'فُقدت حالة التوليد — ربما أُعيد تشغيل الخادم. تحقق من قائمة التقارير، قد يكون التقرير قد أُنشئ.',
          duration: 0,
        });
      } catch (dbError: any) {
        console.error('[ReportsGenerate] DB fallback search failed:', dbError.message);
        return NextResponse.json({
          jobId,
          status: 'failed',
          error: 'فُقدت حالة التوليد وفشل البحث في قاعدة البيانات',
          duration: 0,
        });
      }
    }

    return NextResponse.json({
      jobId: job.id,
      type: job.type,
      wordCount: job.wordCount,
      status: job.status,
      duration: job.completedAt ? job.completedAt - job.startedAt : Date.now() - job.startedAt,
      result: job.result,
      error: job.error,
    });
  }

  // List all recent jobs
  const jobs = [...generationJobs.values()].slice(-20).reverse();
  return NextResponse.json({
    totalJobs: generationJobs.size,
    recentJobs: jobs.map(j => ({
      jobId: j.id,
      type: j.type,
      wordCount: j.wordCount,
      status: j.status,
      duration: j.completedAt ? j.completedAt - j.startedAt : Date.now() - j.startedAt,
      result: j.result ? { title: j.result.title, slug: j.result.slug } : undefined,
      error: j.error,
    })),
  });
}
