'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalePath } from '@/lib/locale';

// ════════════════════════════════════════════════════════════════════
// V1062: Geopolitical News + Strategic Reports widgets
// Two cards shown side-by-side on the homepage geopolitical section
// ════════════════════════════════════════════════════════════════════

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

const LABELS: Record<Locale, {
  newsTitle: string;
  newsSubtitle: string;
  reportsTitle: string;
  reportsSubtitle: string;
  viewAll: string;
  noData: string;
  minRead: string;
  impact: string;
}> = {
  ar: {
    newsTitle: 'أحدث الأخبار الجيوسياسية',
    newsSubtitle: 'أخبار المؤثرات الجيوسياسية على الأسواق',
    reportsTitle: 'التقارير الاستراتيجية',
    reportsSubtitle: 'تحليلات استراتيجية معمقة',
    viewAll: 'عرض الكل',
    noData: 'لا توجد بيانات',
    minRead: 'دقيقة',
    impact: 'التأثير',
  },
  en: {
    newsTitle: 'Latest Geopolitical News',
    newsSubtitle: 'Geopolitical market-moving news',
    reportsTitle: 'Strategic Reports',
    reportsSubtitle: 'In-depth strategic analysis',
    viewAll: 'View All',
    noData: 'No data available',
    minRead: 'min read',
    impact: 'Impact',
  },
  fr: {
    newsTitle: 'Dernières Actualités Géopolitiques',
    newsSubtitle: 'Actualités géopolitiques des marchés',
    reportsTitle: 'Rapports Stratégiques',
    reportsSubtitle: 'Analyses stratégiques approfondies',
    viewAll: 'Voir Tout',
    noData: 'Aucune donnée',
    minRead: 'min',
    impact: 'Impact',
  },
  tr: {
    newsTitle: 'Son Jeopolitik Haberler',
    newsSubtitle: 'Piyasaları etkileyen jeopolitik haberler',
    reportsTitle: 'Stratejik Raporlar',
    reportsSubtitle: 'Derinlemesine stratejik analiz',
    viewAll: 'Tümünü Gör',
    noData: 'Veri yok',
    minRead: 'dk',
    impact: 'Etki',
  },
  es: {
    newsTitle: 'Últimas Noticias Geopolíticas',
    newsSubtitle: 'Noticias geopolíticas que mueven mercados',
    reportsTitle: 'Informes Estratégicos',
    reportsSubtitle: 'Análisis estratégico profundo',
    viewAll: 'Ver Todo',
    noData: 'Sin datos',
    minRead: 'min',
    impact: 'Impacto',
  },
};

// Geopolitical keywords for filtering news
const GEO_KEYWORDS_AR = ['حرب', 'صراع', 'عقوبات', 'نووي', 'عسكرية', 'غزو', 'حدود', 'مضيق', 'انقلاب', 'انتخابات', 'دبلوماسي', 'قيادة', 'رئيس', 'حكومة', 'احتجاج', 'إرهاب', 'أسلحة', 'صواريخ', 'نفط', 'غاز', 'طاقة', 'أوبك', 'تعريفة', 'تجارة'];
const GEO_KEYWORDS_EN = ['war', 'conflict', 'sanctions', 'nuclear', 'military', 'invasion', 'border', 'strait', 'coup', 'election', 'diplomat', 'missile', 'oil', 'gas', 'energy', 'opec', 'tariff', 'trade war', 'treaty', 'NATO', 'summit'];

interface NewsItem {
  id: string;
  title: string;
  titleAr: string | null;
  summary: string;
  summaryAr: string | null;
  url: string;
  sourceName: string | null;
  sentiment: string;
  impactScore: number;
  publishedAt: string | null;
  slug: string | null;
  imageUrl?: string | null;
}

interface ReportItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  publishedAt: string | null;
}

function timeAgo(dateStr: string, locale: Locale): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 1) return locale === 'ar' ? 'الآن' : 'now';
    if (diffMin < 60) {
      const labels: Record<Locale, string> = { ar: `${diffMin} دقيقة`, en: `${diffMin}m`, fr: `${diffMin} min`, tr: `${diffMin} dk`, es: `${diffMin} min` };
      return labels[locale];
    }
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      const labels: Record<Locale, string> = { ar: `${diffHr} ساعة`, en: `${diffHr}h`, fr: `${diffHr}h`, tr: `${diffHr} saat`, es: `${diffHr}h` };
      return labels[locale];
    }
    const diffDay = Math.floor(diffHr / 24);
    const labels: Record<Locale, string> = { ar: `${diffDay} يوم`, en: `${diffDay}d`, fr: `${diffDay}j`, tr: `${diffDay} gün`, es: `${diffDay}d` };
    return labels[locale];
  } catch { return ''; }
}

export default function GeopoliticalNewsReports({ locale = 'ar' }: { locale?: Locale }) {
  const t = LABELS[locale];
  const [news, setNews] = useState<NewsItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const basePath = getLocalePath(locale);

  useEffect(() => {
    async function fetchData() {
      try {
        const [newsRes, reportsRes] = await Promise.all([
          fetch(`/api/news/live?limit=20&locale=${locale}`),
          fetch(`/api/reports?type=strategic&limit=5`),
        ]);

        // Filter news for geopolitical keywords
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const allNews = newsData.news || [];
          const geoNews = allNews.filter((n: NewsItem) => {
            const text = `${n.titleAr || n.title} ${n.summaryAr || n.summary} ${n.title} ${n.summary}`.toLowerCase();
            return GEO_KEYWORDS_AR.some(kw => text.includes(kw.toLowerCase()))
              || GEO_KEYWORDS_EN.some(kw => text.includes(kw.toLowerCase()));
          }).slice(0, 5);
          setNews(geoNews);
        }

        // Strategic reports
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          const allReports = (reportsData.reports || []).filter((r: ReportItem) => r.reportType === 'strategic').slice(0, 4);
          setReports(allReports);
        }
      } catch (err) {
        console.error('[GeoNewsReports] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [locale]);

  const impactColors: Record<string, string> = { bullish: 'var(--bull)', bearish: 'var(--bear)', neutral: 'var(--gold)' };
  const impactLabels: Record<string, Record<Locale, string>> = {
    bullish: { ar: 'صعودي', en: 'Bullish', fr: 'Haussier', tr: 'Yükseliş', es: 'Alcista' },
    bearish: { ar: 'هبوطي', en: 'Bearish', fr: 'Baissier', tr: 'Düşüş', es: 'Bajista' },
    neutral: { ar: 'محايد', en: 'Neutral', fr: 'Neutre', tr: 'Nötr', es: 'Neutral' },
  };

  const newsPath = locale === 'ar' ? '/news' : `/${locale}/news`;
  const reportsPath = locale === 'ar' ? '/strategic-reports' : `/${locale}/strategic-reports`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* ═══ Geopolitical News ═══ */}
      <div className="glass-card" style={{
        padding: 'var(--space-md)', borderRadius: 'var(--r2)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>📰 {t.newsTitle}</span>
            <span style={{ fontSize: 10, color: 'var(--text4)', display: 'block' }}>{t.newsSubtitle}</span>
          </div>
          <a href={newsPath} style={{ fontSize: 11, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'none' }}>
            {t.viewAll} →
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 48, borderRadius: 6, background: 'var(--bg4)', opacity: 0.4 }} />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text4)' }}>{t.noData}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, maxHeight: 280, overflowY: 'auto' }} className="custom-scrollbar">
            {news.map((item) => {
              const title = locale === 'ar' ? (item.titleAr || item.title) : item.title;
              const impactColor = impactColors[item.sentiment] || 'var(--text4)';
              const impactLabel = impactLabels[item.sentiment]?.[locale] || item.sentiment;
              return (
                <Link
                  key={item.id}
                  href={item.slug ? `${basePath}/news/${item.slug}` : '#'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 6,
                    background: 'var(--bg4)', textDecoration: 'none',
                    borderInlineStart: `3px solid ${impactColor}`,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg4)'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--text-head)',
                      margin: 0, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{title}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: impactColor }}>{impactLabel}</span>
                      {item.sourceName && <span style={{ fontSize: 9, color: 'var(--text4)' }}>{item.sourceName}</span>}
                      {item.publishedAt && <span style={{ fontSize: 9, color: 'var(--text4)' }}>{timeAgo(item.publishedAt, locale)}</span>}
                    </div>
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={impactColor} strokeWidth="2" style={{ flexShrink: 0, opacity: 0.4 }}>
                    <polyline points={locale === 'ar' ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Strategic Reports ═══ */}
      <div className="glass-card" style={{
        padding: 'var(--space-md)', borderRadius: 'var(--r2)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>📋 {t.reportsTitle}</span>
            <span style={{ fontSize: 10, color: 'var(--text4)', display: 'block' }}>{t.reportsSubtitle}</span>
          </div>
          <a href={reportsPath} style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 700, textDecoration: 'none' }}>
            {t.viewAll} →
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 48, borderRadius: 6, background: 'var(--bg4)', opacity: 0.4 }} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text4)' }}>{t.noData}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, maxHeight: 280, overflowY: 'auto' }} className="custom-scrollbar">
            {reports.map((report) => {
              const impactColor = impactColors[report.marketImpact] || 'var(--text4)';
              const impactLabel = impactLabels[report.marketImpact]?.[locale] || report.marketImpact;
              return (
                <Link
                  key={report.id}
                  href={`${basePath}/strategic-reports/${report.slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 6,
                    background: 'var(--bg4)', textDecoration: 'none',
                    borderInlineStart: `3px solid #8B5CF6`,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg4)'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--text-head)',
                      margin: 0, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{report.title}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: impactColor }}>{impactLabel}</span>
                      {report.confidenceScore > 0 && <span style={{ fontSize: 9, color: 'var(--purple)' }}>{report.confidenceScore}%</span>}
                      {report.publishedAt && <span style={{ fontSize: 9, color: 'var(--text4)' }}>{timeAgo(report.publishedAt, locale)}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
