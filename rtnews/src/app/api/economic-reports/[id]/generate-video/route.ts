// ─── Economic Report Video Generation API V2 ──────────────
// Generates a professional Bloomberg-style MP4 video from an economic report
// Uses Python script: scripts/generate_economic_video.py (edge-tts + Pillow + FFmpeg)
// Cost: $0 — 100% free tools
// V2: Uses unified video directory, better content extraction, market_impact support
// V3: Robust error handling, dual DB client fallback, better logging

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { db, safeDBQuery } from '@/lib/db';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { uploadVideoToR2, uploadThumbnailToR2 } from '@/lib/video-storage';

const execFileAsync = promisify(execFile);

// Fallback raw PrismaClient in case the extended db has issues
let rawPrisma: PrismaClient | null = null;
function getRawPrisma(): PrismaClient {
  if (!rawPrisma) {
    rawPrisma = new PrismaClient({
      log: ['error'],
    });
  }
  return rawPrisma;
}

// V322: Use /tmp for video output (Next.js doesn't serve runtime files from public/)
const VIDEO_OUTPUT_DIR = path.join(tmpdir(), 'roua-videos');

export const maxDuration = 300; // 5 minutes timeout for video generation
export const dynamic = 'force-dynamic';

function parseKeyIndicators(indicators: any): Array<{ label: string; value: string; description: string }> {
  const stats: Array<{ label: string; value: string; description: string }> = [];

  if (typeof indicators === 'string') {
    try { indicators = JSON.parse(indicators); } catch { return stats; }
  }

  const labelMap: Record<string, string> = {
    gdp: 'الناتج المحلي', inflation: 'التضخم', unemployment: 'البطالة',
    interestRate: 'سعر الفائدة', debt: 'الدين العام', tradeBalance: 'الميزان التجاري',
    oilPrice: 'سعر النفط', goldPrice: 'سعر الذهب', exchangeRate: 'سعر الصرف',
    gdpGrowth: 'نمو الناتج المحلي', cpi: 'مؤشر الأسعار', ppi: 'مؤشر أسعار المنتجين',
    budget: 'الميزانية', deficit: 'العجز', surplus: 'الفائض',
    exports: 'الصادرات', imports: 'الواردات', fdi: 'الاستثمار الأجنبي',
    population: 'السكان', gdpPerCapita: 'نصيب الفرد من الناتج',
  };

  if (typeof indicators === 'object' && indicators !== null) {
    for (const [key, val] of Object.entries(indicators)) {
      if (typeof val === 'object' && val !== null) {
        const v = val as any;
        stats.push({
          label: labelMap[key] || key,
          value: String(v.value ?? v.amount ?? v.rate ?? v.percentage ?? val),
          description: String(v.description ?? v.note ?? v.change ?? v.year ?? ''),
        });
      } else {
        const numVal = typeof val === 'number' ? val : parseFloat(String(val));
        const displayVal = isNaN(numVal)
          ? String(val)
          : numVal > 100 ? numVal.toFixed(0) : numVal.toFixed(2);
        const unit = key.toLowerCase().includes('rate') || key.toLowerCase().includes('inflation')
          || key.toLowerCase().includes('unemployment') || key.toLowerCase().includes('growth')
          ? '%' : '';
        stats.push({
          label: labelMap[key] || key,
          value: `${displayVal}${unit}`,
          description: labelMap[key] || key,
        });
      }
    }
  }

  return stats.slice(0, 4);
}

function extractKeyPointsFromContent(content: string): string[] {
  const points: string[] = [];
  if (!content) return points;

  try {
    const parsed = JSON.parse(content);
    const sections = parsed.sections || parsed;

    // Try extracting from known section keys
    const keyPointsKeys = ['keyPoints', 'highlights', 'mainFindings', 'keyTakeaways', 'topNews'];
    for (const key of keyPointsKeys) {
      const data = sections[key] || parsed[key];
      if (Array.isArray(data)) {
        for (const item of data.slice(0, 5)) {
          if (typeof item === 'string' && item.trim().length > 5) {
            points.push(item.trim());
          } else if (typeof item === 'object' && item !== null) {
            const text = (item as any).titleAr || (item as any).title || (item as any).text || '';
            if (text.trim().length > 5) points.push(text.trim());
          }
        }
      }
    }

    // Try extracting from overview/executive summary
    if (points.length === 0) {
      const overviewKeys = ['executiveSummary', 'weeklyOverview', 'economicOverview', 'overview', 'introduction'];
      for (const key of overviewKeys) {
        const text = sections[key] || parsed[key];
        if (typeof text === 'string' && text.trim()) {
          const lines = text.split('\n').filter(l => l.trim());
          for (const line of lines) {
            const cleaned = line.replace(/^[-•*\d.]\s*/, '').trim();
            if (cleaned.length > 10 && cleaned.length < 120) points.push(cleaned);
            if (points.length >= 5) break;
          }
          if (points.length > 0) break;
        }
      }
    }
  } catch {
    // Parse as text
    const lines = content.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const cleaned = line.replace(/^[-•*\d.#]\s*/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 120) points.push(cleaned);
      if (points.length >= 5) break;
    }
  }

  return points;
}

function extractOutlook(content: string, marketImpact: string): string {
  try {
    const parsed = JSON.parse(content);
    const sections = parsed.sections || parsed;
    const outlookKeys = ['outlook', 'tomorrowOutlook', 'monthlyForecast', 'nextQuarterForecast', 'forecasts'];
    for (const key of outlookKeys) {
      const text = sections[key] || parsed[key];
      if (typeof text === 'string' && text.trim()) {
        return text.trim().slice(0, 200);
      }
    }
  } catch {}

  // Fallback based on market impact
  if (marketImpact === 'bullish') return 'الآفاق إيجابية مع توقعات بنمو في الأمد القريب';
  if (marketImpact === 'bearish') return 'الآفاق سلبية مع توقعات بتراجع في الأمد القريب';
  return 'السوق مستقر مع توقعات حيادية';
}

// ─── Find report with fallback ──────────────────────────────
async function findReport(id: string) {
  console.log(`[VideoGen V3] Looking for report with id/slug: "${id}"`);

  // Try 1: Extended db client
  try {
    const report = await db.economicReport.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (report) {
      console.log(`[VideoGen V3] Found report via db client: "${report.title}"`);
      return report;
    }
  } catch (err: any) {
    console.warn(`[VideoGen V3] db.economicReport.findFirst failed: ${err.message?.slice(0, 100)}`);
  }

  // Try 2: Raw PrismaClient (in case extended client has issues)
  try {
    const raw = getRawPrisma();
    const report = await raw.economicReport.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (report) {
      console.log(`[VideoGen V3] Found report via raw PrismaClient: "${report.title}"`);
      return report;
    }
  } catch (err: any) {
    console.warn(`[VideoGen V3] Raw PrismaClient findFirst also failed: ${err.message?.slice(0, 100)}`);
  }

  // Try 3: List all reports to see what's available (for debugging)
  try {
    const raw = getRawPrisma();
    const count = await raw.economicReport.count();
    console.log(`[VideoGen V3] Total EconomicReports in DB: ${count}`);

    if (count > 0) {
      const sample = await raw.economicReport.findMany({
        take: 3,
        select: { id: true, title: true, slug: true, locale: true },
        orderBy: { createdAt: 'desc' },
      });
      console.log(`[VideoGen V3] Sample reports:`, JSON.stringify(sample.map(r => ({ id: r.id.slice(0, 10), title: r.title.slice(0, 40), slug: r.slug?.slice(0, 30), locale: r.locale }))));
    }
  } catch (err: any) {
    console.warn(`[VideoGen V3] Could not list reports: ${err.message?.slice(0, 80)}`);
  }

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    console.log(`[VideoGen V3] POST request received, id="${id}"`);

    const report = await findReport(id);

    if (!report) {
      console.error(`[VideoGen V3] Report not found for id/slug: "${id}"`);
      return NextResponse.json({ error: 'التقرير غير موجود', debug: `Searched for id/slug: "${id}"` }, { status: 404 });
    }

    console.log(`[VideoGen V3] Starting video generation for report: "${report.title}" (id: ${report.id})`);

    // Parse report data
    const keyIndicators = parseKeyIndicators(report.keyIndicators);
    const keyPoints = extractKeyPointsFromContent(report.content);
    const outlook = extractOutlook(report.content, report.marketImpact);

    // Build chart data from key indicators
    let chartData: any = null;
    if (keyIndicators.length >= 2) {
      chartData = {
        title: 'المؤشرات الرئيسية',
        type: 'bar',
        labels: keyIndicators.map(ki => ki.label),
        values: keyIndicators.map(ki => {
          const numVal = parseFloat(ki.value.replace(/[^0-9.-]/g, ''));
          return isNaN(numVal) ? 0 : numVal;
        }),
      };
    }

    // Impact emoji
    const impactEmoji = report.marketImpact === 'bullish' ? '↑'
      : report.marketImpact === 'bearish' ? '↓' : '→';

    // Build input JSON
    const videoInput = {
      title: report.title,
      date: report.publishedAt
        ? new Date(report.publishedAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })
        : new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
      locale: report.locale || 'ar',
      summary: report.summary || '',
      report_type_label: report.reportType === 'daily' ? 'تقرير يومي'
        : report.reportType === 'weekly' ? 'تقرير أسبوعي'
        : report.reportType === 'monthly' ? 'تقرير شهري'
        : report.reportType === 'quarterly' ? 'تقرير ربعي'
        : 'تقرير اقتصادي',
      stats: keyIndicators.length > 0 ? keyIndicators : [
        { label: 'مستوى الثقة', value: `${report.confidenceScore}%`, description: 'مستوى موثوقية التقرير' },
        { label: 'التأثير', value: report.marketImpact === 'bullish' ? 'إيجابي ↑' : report.marketImpact === 'bearish' ? 'سلبي ↓' : 'محايد →', description: 'التأثير المتوقع على السوق' },
      ],
      chart_data: chartData,
      key_points: keyPoints.length > 0 ? keyPoints : [report.summary || 'لا توجد نقاط رئيسية محددة'],
      outlook,
      market_impact: report.marketImpact || 'neutral',
      impact_emoji: impactEmoji,
    };

    // Ensure output directory
    if (!existsSync(VIDEO_OUTPUT_DIR)) {
      await mkdir(VIDEO_OUTPUT_DIR, { recursive: true });
    }

    // Create temp input and output paths
    const videoId = randomUUID();
    const tempInputPath = path.join(VIDEO_OUTPUT_DIR, `input_${videoId}.json`);
    const outputVideoPath = path.join(VIDEO_OUTPUT_DIR, `${videoId}.mp4`);

    await writeFile(tempInputPath, JSON.stringify(videoInput, null, 2), 'utf-8');

    console.log(`[VideoGen V3] Running Python script...`);

    // Find Python executable
    let pythonCmd = 'python3';
    try {
      const { execSync } = require('child_process');
      execSync('python3 --version', { stdio: 'ignore', timeout: 3000 });
    } catch {
      try {
        const { execSync } = require('child_process');
        execSync('python --version', { stdio: 'ignore', timeout: 3000 });
        pythonCmd = 'python';
      } catch {
        console.warn('[VideoGen V3] Neither python3 nor python found');
      }
    }

    // Run Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_economic_video.py');

    // Check if script exists
    if (!existsSync(scriptPath)) {
      throw new Error(`Python script not found at: ${scriptPath}`);
    }

    const { stdout, stderr } = await execFileAsync(pythonCmd, [
      scriptPath,
      '--input', tempInputPath,
      '--output', outputVideoPath,
    ], {
      timeout: 240000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    console.log(`[VideoGen V3] Python stdout: ${stdout?.slice(-300) || 'none'}`);
    if (stderr) console.log(`[VideoGen V3] Python stderr: ${stderr?.slice(-300) || 'none'}`);

    if (!existsSync(outputVideoPath)) {
      throw new Error('Video file was not generated');
    }

    // Clean up temp input
    try { await unlink(tempInputPath); } catch {}

    // Get file size
    const fileStats = await stat(outputVideoPath);
    const fileSizeMB = fileStats.size / (1024 * 1024);

    // Generate thumbnail
    const thumbnailPath = path.join(VIDEO_OUTPUT_DIR, `${videoId}_thumb.png`);
    try {
      await execFileAsync('ffmpeg', [
        '-y', '-i', outputVideoPath, '-vframes', '1', '-q:v', '2', thumbnailPath,
      ], { timeout: 15000 });
    } catch {}

    // Video URL — now uploads to R2 for persistent storage
    let videoUrl = `/api/video/serve/${videoId}.mp4`;
    let thumbnailUrl = existsSync(thumbnailPath) ? `/api/video/serve/${videoId}_thumb.png` : null;

    // Upload video to R2 (survives Railway redeployment)
    try {
      const r2Result = await uploadVideoToR2(videoId, outputVideoPath);
      if (r2Result.success && r2Result.url) {
        videoUrl = r2Result.url;
        console.log(`[VideoGen V3] Video uploaded to R2: ${r2Result.url.slice(0, 80)}...`);
      } else {
        console.warn(`[VideoGen V3] R2 upload failed, using local URL: ${r2Result.error}`);
      }
    } catch (r2Err: any) {
      console.warn(`[VideoGen V3] R2 upload error, using local URL: ${r2Err.message}`);
    }

    // Upload thumbnail to R2
    if (existsSync(thumbnailPath)) {
      try {
        const thumbResult = await uploadThumbnailToR2(videoId, thumbnailPath);
        if (thumbResult.success && thumbResult.url) {
          thumbnailUrl = thumbResult.url;
        }
      } catch (thumbR2Err: any) {
        console.warn(`[VideoGen V3] Thumbnail R2 upload error: ${thumbR2Err.message}`);
      }
    }

    // Create or update VideoReport — try both db and raw client
    const videoReportData = {
      title: `فيديو: ${report.title}`,
      slug: `video-${report.slug || report.id}-${Date.now()}`,
      symbol: 'ECONOMIC',
      assetName: report.title.slice(0, 100),
      locale: report.locale || 'ar',
      reportType: report.reportType,
      assetClass: 'economy',
      videoUrl,
      thumbnailUrl,
      chartMode: 'bg',
      style: 'pulse',
      marketImpact: report.marketImpact || 'neutral',
      status: 'completed' as const,
      duration: 90,
      isPublished: true,
      publishedAt: new Date(),
      analysisText: JSON.stringify(videoInput),
      sourceReportId: report.id,
      sourceType: 'economic_report',
    };

    try {
      // Check for existing video
      const existingVideo = await db.videoReport.findFirst({
        where: { sourceReportId: report.id, sourceType: 'economic_report' },
      });

      if (existingVideo) {
        await db.videoReport.update({
          where: { id: existingVideo.id },
          data: videoReportData,
        });
      } else {
        await db.videoReport.create({ data: videoReportData });
      }
    } catch (dbErr: any) {
      console.warn(`[VideoGen V3] db.videoReport write failed, trying raw client: ${dbErr.message?.slice(0, 80)}`);
      try {
        const raw = getRawPrisma();
        const existingVideo = await raw.videoReport.findFirst({
          where: { sourceReportId: report.id, sourceType: 'economic_report' },
        });

        if (existingVideo) {
          await raw.videoReport.update({
            where: { id: existingVideo.id },
            data: videoReportData,
          });
        } else {
          await raw.videoReport.create({ data: videoReportData });
        }
      } catch (rawErr: any) {
        console.error(`[VideoGen V3] Raw PrismaClient videoReport write also failed: ${rawErr.message?.slice(0, 80)}`);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[VideoGen V3] Completed in ${elapsed}ms — ${videoUrl} (${fileSizeMB.toFixed(1)} MB)`);

    return NextResponse.json({
      success: true,
      videoUrl,
      thumbnailUrl,
      duration: 90,
      fileSize: `${fileSizeMB.toFixed(1)} MB`,
      elapsed,
    });

  } catch (error: any) {
    console.error('[VideoGen V3] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'فشل في توليد الفيديو' },
      { status: 500 }
    );
  }
}
