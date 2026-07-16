'use client';

import { useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { stripMarkdownHeadings, cleanMarkdown } from '@/lib/clean-markdown';
import { useTelegramWebApp } from '@/lib/telegram-webapp/useTelegramWebApp';
import { SentimentGauge } from '@/components/rouaa/charts';

interface Report {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  reportType: string;
  scope: string;
  sectors: string[];
  countries: string[];
  keyIndicators: Record<string, any>;
  marketImpact: string;
  confidenceScore: number;
  sourceUrls: string[];
  imageUrl?: string | null;
  publishedAt: string | Date | null;
  createdAt: string | Date;
}

interface Props {
  report: Report;
}

const IMPACT_LABELS: Record<string, string> = {
  bullish: 'صعودي 📈',
  bearish: 'هبوطي 📉',
  neutral: 'محايد ➡️',
};

const SCOPE_LABELS: Record<string, string> = {
  strategic: 'استراتيجي',
  daily: 'يومي',
  commodities: 'سلع',
  forex: 'فوركس',
  stocks: 'أسهم',
  crypto: 'عملات رقمية',
  economy: 'اقتصاد',
  energy: 'طاقة',
};

// Simplified markdown components for Telegram
const TG_MARKDOWN_COMPONENTS: Record<string, React.ComponentType<any>> = {
  h1: () => null,
  h2: () => null,
  h3: ({ children }: any) => (
    <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '16px', marginBottom: '8px', color: 'var(--text-head)' }}>{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '6px', color: 'var(--text-head)' }}>{children}</h4>
  ),
  ul: ({ children }: any) => <ul style={{ listStyle: 'disc', paddingRight: '20px', margin: '8px 0' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ listStyle: 'decimal', paddingRight: '20px', margin: '8px 0' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ fontSize: '14px', lineHeight: '2', color: 'var(--text2)', marginBottom: '4px' }}>{children}</li>,
  strong: ({ children }: any) => <strong style={{ fontWeight: 700, color: 'var(--text-head)' }}>{children}</strong>,
  p: ({ children }: any) => <p style={{ margin: '6px 0', fontSize: '14px', lineHeight: '2', color: 'var(--text2)' }}>{children}</p>,
  blockquote: ({ children }: any) => (
    <blockquote style={{ borderInlineStart: '3px solid var(--cyan)', paddingRight: '12px', margin: '8px 0', color: 'var(--text3)' }}>{children}</blockquote>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />,
};

const SECTION_TITLES: Record<string, string> = {
  executiveSummary: 'الملخص التنفيذي',
  introduction: 'مقدمة التقرير',
  context: 'السياق والخلفية',
  economicImpact: 'التداعيات الاقتصادية',
  marketImpact: 'تأثير على أسواق المال',
  scenarios: 'السيناريوهات',
  affectedAssets: 'الأصول المتأثرة',
  strategicRecommendations: 'التوصيات الاستراتيجية',
  rouaRecommendations: 'توصيات رؤى',
  rouaaRecommendations: 'توصيات رؤى',
  followUpIndicators: 'مؤشرات المتابعة',
  goldAnalysis: 'تحليل الذهب والمعادن النفيسة',
  industrialMetals: 'تحليل المعادن الصناعية',
  agriculturalCommodities: 'تحليل السلع الزراعية',
  supplyDemand: 'العرض والطلب العالمي',
  dollarImpact: 'تأثير الدولار على السلع',
  commoditiesEnergy: 'السلع والطاقة',
  riskAssessment: 'تقييم المخاطر',
  outlook: 'التوقعات',
  overview: 'نظرة عامة',
  keyMovers: 'المحركات الرئيسية',
  marketPulse: 'نبض السوق',
  sentimentAnalysis: 'تحليل المشاعر السوقية',
};

export default function TgReportClient({ report }: Props) {
  const { isTelegram, user, webApp, showMainButton, hideMainButton } = useTelegramWebApp();

  // Initialize Telegram back button
  useEffect(() => {
    if (webApp) {
      webApp.setHeaderColor('#0a0a1a');
      webApp.setBackgroundColor('#0a0a1a');

      // Show MainButton for sharing
      showMainButton('مشاركة التقرير', () => {
        const url = window.location.href.replace('/tg/', '/reports/');
        if (navigator.share) {
          navigator.share({ title: report.title, url });
        } else {
          navigator.clipboard.writeText(url);
        }
      });

      return () => hideMainButton();
    }
  }, [webApp, report.title]);

  // Parse content
  const { sections: parsedSections, sentiment } = useMemo(() => {
    let rawContent = report.content;
    let contentData: any = {};
    try {
      contentData = JSON.parse(rawContent);
    } catch {
      contentData = { sections: { overview: rawContent } };
    }

    const sections = contentData.sections || {};
    const overviewKeys = ['introduction', 'executiveSummary', 'weeklyOverview', 'economicOverview', 'quarterlyOverview', 'eventAnalysis', 'overview', 'context'];

    const detailSections: { title: string; content: string }[] = [];
    for (const [key, value] of Object.entries(sections)) {
      if (typeof value !== 'string' || value.trim().length < 20) continue;
      if (overviewKeys.includes(key)) continue;
      if (['rawContent', 'highlights', 'keyPoints', 'mainFindings', 'categories'].includes(key)) continue;

      const title = SECTION_TITLES[key] || key;
      const cleaned = stripMarkdownHeadings(value);
      if (cleaned.trim().length > 20) {
        detailSections.push({ title, content: cleaned });
      }
    }

    const sentimentScore = report.marketImpact === 'bullish' ? 72
      : report.marketImpact === 'bearish' ? 28
      : 50;

    return { sections: detailSections, sentiment: sentimentScore };
  }, [report]);

  const publishedDate = report.publishedAt ? new Date(report.publishedAt) : new Date(report.createdAt);
  const dateStr = publishedDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const impactLabel = IMPACT_LABELS[report.marketImpact] || 'محايد';
  const scopeLabel = SCOPE_LABELS[report.scope] || report.scope;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #0a0a1a)',
      color: 'var(--text2, #999)',
      direction: 'rtl',
      fontFamily: 'var(--font-arabic), system-ui, -apple-system, sans-serif',
      padding: '0 0 32px',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border, rgba(128,128,128,0.1))',
        background: 'var(--bg2, #0f0f23)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan, #00e5ff)', background: 'rgba(0,229,255,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
            {scopeLabel}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text3, #666)' }}>{dateStr}</span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-head, #fff)', lineHeight: '1.5', marginBottom: '8px' }}>
          {report.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: report.marketImpact === 'bullish' ? '#00996B' : report.marketImpact === 'bearish' ? '#D4365C' : '#D4930D' }}>
            {impactLabel}
          </span>
          {/* V224: "ثقة X%" removed from stamp — shown in confidence card section */}
        </div>
      </div>

      {/* Sentiment Gauge */}
      <div style={{ padding: '12px 16px' }}>
        <SentimentGauge value={sentiment} size={280} />
      </div>

      {/* Summary */}
      {report.summary && (
        <div style={{
          margin: '0 16px 16px',
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'var(--bg3, rgba(128,128,128,0.06))',
          border: '1px solid var(--border, rgba(128,128,128,0.1))',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan)', marginBottom: '6px' }}>الملخص</div>
          <div className="report-markdown-content" style={{ fontSize: '14px', lineHeight: '2' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={TG_MARKDOWN_COMPONENTS}>
              {stripMarkdownHeadings(report.summary)}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Sections */}
      {parsedSections.map((section, i) => (
        <div key={i} style={{
          margin: '0 16px 12px',
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'var(--card, rgba(20,20,30,0.8))',
          border: '1px solid var(--border, rgba(128,128,128,0.1))',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-head, #fff)',
            paddingBottom: '8px',
            marginBottom: '12px',
            borderBottom: '1px solid var(--border, rgba(128,128,128,0.12))',
          }}>
            {section.title}
          </h2>
          <div className="report-markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={TG_MARKDOWN_COMPONENTS}>
              {stripMarkdownHeadings(section.content)}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        padding: '16px',
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text3, #666)',
        marginTop: '8px',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--cyan, #00e5ff)' }}>رؤى</span>
        {' '}للأخبار المالية — مدعوم بالذكاء الاصطناعي
        {isTelegram && user && (
          <div style={{ marginTop: '4px' }}>
            مرحباً {user.first_name} 👋
          </div>
        )}
      </div>
    </div>
  );
}
