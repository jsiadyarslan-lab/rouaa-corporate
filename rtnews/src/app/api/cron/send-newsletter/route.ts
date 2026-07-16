// ─── Newsletter Sender Cron V62 ──────────────────────────────
// Sends report newsletters to confirmed subscribers
// POST /api/cron/send-newsletter?action=send-daily|send-weekly|send-monthly
// Protected with CRON_SECRET + x-internal header check

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-utils';
import { verifyInternalOrCronAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;



interface NewsletterResult {
  email: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
}

// POST /api/cron/send-newsletter
export async function POST(request: Request) {
  if (!verifyInternalOrCronAuth(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!action || !['send-daily', 'send-weekly', 'send-monthly'].includes(action)) {
    return NextResponse.json(
      { error: 'الإجراء مطلوب. الإجراءات المتاحة: send-daily, send-weekly, send-monthly' },
      { status: 400 }
    );
  }

  const frequency = action.replace('send-', '') as 'daily' | 'weekly' | 'monthly';
  console.log(`[Newsletter] Starting ${frequency} newsletter send...`);

  try {
    // Get confirmed subscribers for this frequency
    const subscribers = await db.reportSubscription.findMany({
      where: {
        frequency,
        isActive: true,
        isConfirmed: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        categories: true,
        regions: true,
      },
    });

    if (subscribers.length === 0) {
      console.log(`[Newsletter] No confirmed ${frequency} subscribers found`);
      return NextResponse.json({
        success: true,
        frequency,
        sent: 0,
        failed: 0,
        skipped: 0,
        message: 'لا يوجد مشتركين مؤكدين لهذه الفترة',
      });
    }

    // Get recent reports for this period
    const now = new Date();
    const periodStart = new Date();
    if (frequency === 'daily') periodStart.setDate(now.getDate() - 1);
    else if (frequency === 'weekly') periodStart.setDate(now.getDate() - 7);
    else periodStart.setMonth(now.getMonth() - 1);

    const [reports, analyses] = await Promise.all([
      db.economicReport.findMany({
        where: {
          isPublished: true,
          locale: 'ar',  // V337: Arabic newsletter
          publishedAt: { gte: periodStart },
        },
        select: {
          id: true, title: true, slug: true, summary: true,
          reportType: true, scope: true, marketImpact: true,
          confidenceScore: true, publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      }),
      db.marketAnalysis.findMany({
        where: {
          isPublished: true,
          locale: 'ar',  // V337: Arabic newsletter
          publishedAt: { gte: periodStart },
        },
        select: {
          id: true, title: true, slug: true, assetClass: true,
          sentiment: true, confidenceScore: true, publishedAt: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
    ]);

    if (reports.length === 0 && analyses.length === 0) {
      console.log(`[Newsletter] No new content for ${frequency} newsletter`);
      return NextResponse.json({
        success: true,
        frequency,
        sent: 0,
        failed: 0,
        skipped: subscribers.length,
        message: 'لا يوجد محتوى جديد لهذه الفترة',
      });
    }

    // Process each subscriber
    const results: NewsletterResult[] = [];
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const subscriber of subscribers) {
      try {
        // Filter content based on subscriber preferences
        const subscriberCategories = JSON.parse(subscriber.categories || '[]') as string[];
        const subscriberRegions = JSON.parse(subscriber.regions || '[]') as string[];

        let filteredReports = reports;
        let filteredAnalyses = analyses;

        if (subscriberCategories.length > 0) {
          filteredReports = reports.filter(r => {
            try {
              const sectors = JSON.parse(r.scope);
              return subscriberCategories.some((c: string) => sectors.includes(c));
            } catch {
              return true;
            }
          });
        }

        if (subscriberRegions.length > 0) {
          filteredReports = filteredReports.filter(r =>
            subscriberRegions.includes(r.scope)
          );
        }

        // Skip if no relevant content
        if (filteredReports.length === 0 && filteredAnalyses.length === 0) {
          skipped++;
          results.push({ email: subscriber.email, status: 'skipped', reason: 'لا محتوى مطابق' });
          continue;
        }

        // Build newsletter content
        const newsletterContent = buildNewsletterContent(
          subscriber,
          filteredReports,
          filteredAnalyses,
          frequency
        );

        // In production, send actual email via SMTP here
        // For now, log what would be sent
        console.log(`[Newsletter] Would send to ${subscriber.email}:`);
        console.log(`  - Reports: ${filteredReports.length}`);
        console.log(`  - Analyses: ${filteredAnalyses.length}`);
        console.log(`  - Subject: ${newsletterContent.subject}`);

        sent++;
        results.push({ email: subscriber.email, status: 'sent' });
      } catch (error: any) {
        console.error(`[Newsletter] Failed for ${subscriber.email}:`, error.message);
        failed++;
        results.push({ email: subscriber.email, status: 'failed', reason: error.message });
      }
    }

    console.log(`[Newsletter] ${frequency} complete: sent=${sent}, failed=${failed}, skipped=${skipped}`);

    return NextResponse.json({
      success: true,
      frequency,
      sent,
      failed,
      skipped,
      totalSubscribers: subscribers.length,
      totalReports: reports.length,
      totalAnalyses: analyses.length,
      results: process.env.NODE_ENV === 'production' ? undefined : results,
    });
  } catch (error) {
    return apiError(error, 'إرسال النشرة');
  }
}

// ─── Newsletter Content Builder ─────────────────────────────
function buildNewsletterContent(
  subscriber: { email: string; name: string | null },
  reports: any[],
  analyses: any[],
  frequency: string
): { subject: string; html: string } {
  const freqAr = frequency === 'daily' ? 'اليومي' : frequency === 'weekly' ? 'الأسبوعي' : 'الشهري';
  const name = subscriber.name || 'مشترك';

  const subject = `نشرة رؤى ${freqAr} — ${new Date().toLocaleDateString('ar-SA')}`;

  const reportsHtml = reports.map(r => `
    <div style="padding:16px;margin-bottom:12px;background:#f8fafc;border-radius:8px;border-right:3px solid ${r.marketImpact === 'bullish' ? '#22C55E' : r.marketImpact === 'bearish' ? '#EF4444' : '#F59E0B'}">
      <h3 style="margin:0 0 8px;color:#1a1a2e;font-size:16px">${r.title}</h3>
      ${r.summary ? `<p style="margin:0;color:#666;font-size:14px">${r.summary.slice(0, 200)}${r.summary.length > 200 ? '...' : ''}</p>` : ''}
      <div style="margin-top:8px;font-size:12px;color:#999">
        <span>${r.reportType === 'weekly' ? 'أسبوعي' : r.reportType === 'monthly' ? 'شهري' : 'يومي'}</span> •
        <span>ثقة: ${r.confidenceScore}%</span>
      </div>
    </div>
  `).join('');

  const analysesHtml = analyses.map(a => `
    <div style="padding:12px;margin-bottom:8px;background:#f0f4ff;border-radius:8px">
      <h4 style="margin:0 0 4px;color:#1a1a2e;font-size:14px">${a.title}</h4>
      <span style="font-size:12px;color:#8B5CF6">${a.assetClass}</span> •
      <span style="font-size:12px;color:${a.sentiment === 'bullish' ? '#22C55E' : a.sentiment === 'bearish' ? '#EF4444' : '#F59E0B'}">${a.sentiment === 'bullish' ? 'صاعد' : a.sentiment === 'bearish' ? 'هابط' : 'محايد'}</span>
    </div>
  `).join('');

  const html = `
    <div dir="rtl" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px">
      <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #00E5FF;padding-bottom:16px">
        <h1 style="color:#1a1a2e;font-size:24px;margin:0">رؤى — نشرة ${freqAr}</h1>
        <p style="color:#666;margin:8px 0 0">مرحباً ${name}،</p>
      </div>

      ${reports.length > 0 ? `
        <h2 style="color:#1a1a2e;font-size:18px;border-bottom:1px solid #e2e8f0;padding-bottom:8px">التقارير الاقتصادية</h2>
        ${reportsHtml}
      ` : ''}

      ${analyses.length > 0 ? `
        <h2 style="color:#1a1a2e;font-size:18px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-top:24px">تحليلات السوق</h2>
        ${analysesHtml}
      ` : ''}

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#999">
        <p>تم الإرسال بواسطة منصة رؤى</p>
        <p>لإلغاء الاشتراك: <a href="#" style="color:#00E5FF">اضغط هنا</a></p>
        <p style="font-style:italic;margin-top:8px">هذا التقرير لأغراض إعلامية فقط ولا يُعد نصيحة استثمارية</p>
      </div>
    </div>
  `;

  return { subject, html };
}

// Allow GET for easy cron pings
export async function GET(request: Request) {
  return POST(request);
}
