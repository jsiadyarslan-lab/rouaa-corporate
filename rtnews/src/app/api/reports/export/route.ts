// ─── Report Export API V63 ───────────────────────────────────
// Export economic reports and market analyses in various formats
// GET /api/reports/export?id=xxx&format=pdf|json|markdown&type=economic_report|market_analysis

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// ─── HTML Entity Escaping — XSS Prevention ──────────────────
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Content Sanitizer for Export HTML ──────────────────────
// Strips dangerous tags while preserving safe formatting
function sanitizeContentForHtml(content: string): string {
  if (!content) return '';
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '');
}

// GET /api/reports/export — Export a report in specified format
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const format = searchParams.get('format') || 'json';
    const reportType = searchParams.get('type') || 'economic_report';

    if (!id) {
      return NextResponse.json({ error: 'معرف التقرير مطلوب' }, { status: 400 });
    }

    // Fetch the report/analysis
    let report: any = null;

    if (reportType === 'economic_report') {
      report = await db.economicReport.findFirst({
        where: { OR: [{ id }, { slug: id }], isPublished: true },
      });
      if (report) {
        report.sectors = JSON.parse(report.sectors);
        report.countries = JSON.parse(report.countries);
        report.keyIndicators = JSON.parse(report.keyIndicators);
        report.sourceUrls = JSON.parse(report.sourceUrls);
      }
    } else if (reportType === 'market_analysis') {
      report = await db.marketAnalysis.findFirst({
        where: { OR: [{ id }, { slug: id }], isPublished: true },
      });
      if (report) {
        report.indicators = JSON.parse(report.indicators);
        report.priceTarget = JSON.parse(report.priceTarget);
        report.relatedNewsIds = JSON.parse(report.relatedNewsIds);
      }
    }

    if (!report) {
      return NextResponse.json({ error: 'التقرير غير موجود أو غير منشور' }, { status: 404 });
    }

    // Track view
    try {
      const headers = request.headers;
      await db.reportView.create({
        data: {
          reportId: report.id,
          reportType,
          ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || null,
          userAgent: headers.get('user-agent') || null,
          referrer: headers.get('referer') || null,
        },
      });
    } catch {
      // View tracking is non-critical
    }

    // Return in requested format
    switch (format) {
      case 'json':
        return NextResponse.json({
          report,
          exportedAt: new Date().toISOString(),
          format: 'json',
        });

      case 'markdown':
        return new NextResponse(generateMarkdown(report, reportType), {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${report.slug || report.id}.md"`,
          },
        });

      case 'pdf':
        // Return printable HTML that can be converted to PDF
        return new NextResponse(generatePrintableHTML(report, reportType), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename="${report.slug || report.id}.html"`,
          },
        });

      default:
        return NextResponse.json({ error: 'صيغة غير مدعومة. الصيغ المتاحة: json, markdown, pdf' }, { status: 400 });
    }
  } catch (error) {
    return apiError(error, 'تصدير تقرير');
  }
}

// ─── Markdown Generator ─────────────────────────────────────
function generateMarkdown(report: any, reportType: string): string {
  const separator = '---';
  let md = `${separator}\n`;

  if (reportType === 'economic_report') {
    md += `# ${report.title}\n\n`;
    md += `**النوع:** ${report.reportType} | **النطاق:** ${report.scope} | **تأثير السوق:** ${report.marketImpact}\n\n`;
    md += `**مستوى الثقة:** ${report.confidenceScore}/100\n\n`;

    if (report.summary) {
      md += `## ملخص تنفيذي\n\n${report.summary}\n\n`;
    }

    if (report.sectors?.length) {
      md += `## القطاعات المعنية\n\n`;
      report.sectors.forEach((s: string) => { md += `- ${s}\n`; });
      md += '\n';
    }

    if (report.countries?.length) {
      md += `## الدول المعنية\n\n`;
      report.countries.forEach((c: string) => { md += `- ${c}\n`; });
      md += '\n';
    }

    if (report.content) {
      md += `## المحتوى التفصيلي\n\n${report.content}\n\n`;
    }

    if (report.keyIndicators && Object.keys(report.keyIndicators).length) {
      md += `## المؤشرات الرئيسية\n\n`;
      Object.entries(report.keyIndicators).forEach(([key, value]) => {
        md += `- **${key}:** ${value}\n`;
      });
      md += '\n';
    }

    if (report.publishedAt) {
      md += `*تاريخ النشر: ${new Date(report.publishedAt).toLocaleDateString('ar-SA')}*\n\n`;
    }
  } else {
    // Market Analysis
    md += `# ${report.title}\n\n`;
    md += `**فئة الأصول:** ${report.assetClass} | **نوع التحليل:** ${report.analysisType} | **الإطار الزمني:** ${report.timeFrame}\n\n`;
    md += `**مستوى المخاطر:** ${report.riskLevel} | **المشاعر:** ${report.sentiment} | **مستوى الثقة:** ${report.confidenceScore}/100\n\n`;

    if (report.content) {
      md += `## التحليل\n\n${report.content}\n\n`;
    }

    if (report.priceTarget && Object.keys(report.priceTarget).length) {
      md += `## السعر المستهدف\n\n`;
      const pt = report.priceTarget;
      if (pt.current) md += `- **السعر الحالي:** ${pt.current}\n`;
      if (pt.target) md += `- **الهدف:** ${pt.target}\n`;
      if (pt.stopLoss) md += `- **وقف الخسارة:** ${pt.stopLoss}\n`;
      md += '\n';
    }

    if (report.indicators && Object.keys(report.indicators).length) {
      md += `## المؤشرات الفنية\n\n`;
      Object.entries(report.indicators).forEach(([key, value]) => {
        md += `- **${key}:** ${value}\n`;
      });
      md += '\n';
    }

    if (report.publishedAt) {
      md += `*تاريخ النشر: ${new Date(report.publishedAt).toLocaleDateString('ar-SA')}*\n`;
      if (report.validUntil) {
        md += `*صالح حتى: ${new Date(report.validUntil).toLocaleDateString('ar-SA')}*\n`;
      }
    }
  }

  md += `${separator}\n`;
  md += `*تم التصدير من منصة رؤى في ${new Date().toLocaleDateString('ar-SA')}*\n`;

  return md;
}

// ─── Printable HTML Generator (XSS-safe V63) ───────────────
function generatePrintableHTML(report: any, reportType: string): string {
  const isEconomic = reportType === 'economic_report';
  const impactColors: Record<string, string> = {
    bullish: '#22C55E',
    bearish: '#EF4444',
    neutral: '#F59E0B',
  };
  const riskColors: Record<string, string> = {
    low: '#22C55E',
    medium: '#F59E0B',
    high: '#EF4444',
    extreme: '#DC2626',
  };

  // Escape all user-generated content for XSS prevention
  const safeTitle = escapeHtml(report.title);
  const safeSummary = escapeHtml(report.summary || '');
  const safeContent = sanitizeContentForHtml(report.content || '');
  const safeReportType = escapeHtml(report.reportType || '');
  const safeScope = escapeHtml(report.scope || '');
  const safeAssetClass = escapeHtml(report.assetClass || '');
  const safeAnalysisType = escapeHtml(report.analysisType || '');
  const safeTimeFrame = escapeHtml(report.timeFrame || '');

  const sectorsHtml = isEconomic && report.sectors?.length
    ? `<div class="section">
      <h2>القطاعات المعنية</h2>
      <div class="tags">${report.sectors.map((s: string) => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
    </div>`
    : '';

  const countriesHtml = isEconomic && report.countries?.length
    ? `<div class="section">
      <h2>الدول المعنية</h2>
      <div class="tags">${report.countries.map((c: string) => `<span class="tag">${escapeHtml(c)}</span>`).join('')}</div>
    </div>`
    : '';

  const keyIndicatorsHtml = isEconomic && report.keyIndicators && Object.keys(report.keyIndicators).length
    ? `<div class="section">
      <h2>المؤشرات الرئيسية</h2>
      <div class="indicator-grid">
        ${Object.entries(report.keyIndicators).map(([key, value]) => `
          <div class="indicator-item">
            <div class="label">${escapeHtml(String(key))}</div>
            <div class="value">${escapeHtml(String(value))}</div>
          </div>
        `).join('')}
      </div>
    </div>`
    : '';

  const analysisIndicatorsHtml = !isEconomic && report.indicators && Object.keys(report.indicators).length
    ? `<div class="section">
      <h2>المؤشرات الفنية</h2>
      <div class="indicator-grid">
        ${Object.entries(report.indicators).map(([key, value]) => `
          <div class="indicator-item">
            <div class="label">${escapeHtml(String(key))}</div>
            <div class="value">${escapeHtml(String(value))}</div>
          </div>
        `).join('')}
      </div>
    </div>`
    : '';

  const marketImpactBadge = isEconomic
    ? `<span class="badge ${report.marketImpact}" style="color:${impactColors[report.marketImpact] || '#666'}">${report.marketImpact === 'bullish' ? 'صاعد' : report.marketImpact === 'bearish' ? 'هابط' : 'محايد'}</span>`
    : `<span class="badge" style="background:${riskColors[report.riskLevel] || '#666'}">${report.riskLevel === 'low' ? 'منخفض المخاطر' : report.riskLevel === 'medium' ? 'متوسط المخاطر' : report.riskLevel === 'high' ? 'مرتفع المخاطر' : 'شديد المخاطر'}</span>`;

  const metaHtml = isEconomic
    ? `<span>النوع: ${safeReportType}</span><span>النطاق: ${safeScope}</span>${marketImpactBadge}`
    : `<span>فئة الأصول: ${safeAssetClass}</span><span>نوع التحليل: ${safeAnalysisType}</span><span>الإطار: ${safeTimeFrame}</span>${marketImpactBadge}`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} — رؤى</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #1a1a2e; background: #fff; line-height: 1.8; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 3px solid #00E5FF; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #1a1a2e; margin-bottom: 10px; }
    .header .meta { display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; color: #666; }
    .header .meta span { background: #f0f4f8; padding: 4px 12px; border-radius: 6px; }
    .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #fff; }
    .badge.bullish { background: #22C55E; }
    .badge.bearish { background: #EF4444; }
    .badge.neutral { background: #F59E0B; }
    .summary { background: #f8fafc; border-radius: 12px; padding: 24px; margin: 20px 0; border-right: 4px solid #00E5FF; }
    .summary h2 { font-size: 18px; color: #1a1a2e; margin-bottom: 10px; }
    .content { margin: 20px 0; line-height: 2; white-space: pre-wrap; }
    .section { margin: 20px 0; }
    .section h2 { font-size: 18px; color: #1a1a2e; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
    .tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .tag { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 6px; font-size: 13px; }
    .indicator-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .indicator-item { background: #f8fafc; padding: 12px; border-radius: 8px; }
    .indicator-item .label { font-size: 12px; color: #666; }
    .indicator-item .value { font-size: 16px; font-weight: 600; }
    .confidence-bar { height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 8px; }
    .confidence-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #00E5FF, #8B5CF6); }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
    .print-btn { position: fixed; top: 20px; left: 20px; background: #00E5FF; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">طباعة / حفظ PDF</button>
  
  <div class="header">
    <h1>${safeTitle}</h1>
    <div class="meta">${metaHtml}</div>
    <div style="margin-top:12px">
      <span style="font-size:13px;color:#666">مستوى الثقة: ${report.confidenceScore}%</span>
      <div class="confidence-bar"><div class="confidence-fill" style="width:${report.confidenceScore}%"></div></div>
    </div>
  </div>

  ${safeSummary ? `<div class="summary"><h2>ملخص تنفيذي</h2><p>${safeSummary}</p></div>` : ''}
  ${sectorsHtml}
  ${countriesHtml}
  ${safeContent ? `<div class="section"><h2>${isEconomic ? 'المحتوى التفصيلي' : 'التحليل'}</h2><div class="content">${safeContent}</div></div>` : ''}
  ${keyIndicatorsHtml}
  ${analysisIndicatorsHtml}

  <div class="footer">
    <p>صادر عن منصة رؤى — ${new Date().toLocaleDateString('ar-SA')}</p>
    ${report.publishedAt ? `<p>تاريخ النشر: ${new Date(report.publishedAt).toLocaleDateString('ar-SA')}</p>` : ''}
    <p style="margin-top:8px;font-style:italic">هذا التقرير لأغراض إعلامية فقط ولا يُعد نصيحة استثمارية</p>
  </div>
</body>
</html>`;
}
