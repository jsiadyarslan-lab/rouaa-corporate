'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface RelatedReport {
  id: string;
  title: string;
  slug: string;
  reportType: string;
  marketImpact: string;
  confidenceScore: number;
  publishedAt: string | Date | null;
  summary?: string;
}

interface RelatedReportsProps {
  currentReportId: string;
  currentReportType: string;
  currentSectors: string[];
  related?: RelatedReport[];
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  reportContent?: string;  // Current report text for semantic matching
}

const TYPE_LABELS: Record<string, Record<string, string>> = {
  ar: {
    strategic: 'استراتيجي', daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري',
    quarterly: 'ربع سنوي', special: 'خاص', analysis: 'تحليل', technical: 'فني',
    fundamental: 'أساسي', earnings: 'أرباح',
  },
  en: {
    strategic: 'Strategic', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    quarterly: 'Quarterly', special: 'Special', analysis: 'Analysis', technical: 'Technical',
    fundamental: 'Fundamental', earnings: 'Earnings',
  },
};

const IMPACT_COLORS: Record<string, string> = { bullish: '#00996B', bearish: '#D4365C', neutral: '#D4930D' };
const IMPACT_LABELS: Record<string, Record<string, string>> = {
  ar: { bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد' },
  en: { bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral' },
};

const UI_LABELS: Record<string, Record<string, string>> = {
  ar: {
    title: 'تقارير مرتبطة',
    subtitle: 'تقارير سابقة ذات صلة بهذا الموضوع',
    noRelated: 'لا توجد تقارير مرتبطة حالياً',
    viewAll: 'عرض الكل',
    confidence: 'ثقة',
    published: 'نُشر',
    earningsRelated: 'تقارير أرباح سابقة',
    sameSector: 'نفس القطاع',
  },
  en: {
    title: 'Related Reports',
    subtitle: 'Previous reports related to this topic',
    noRelated: 'No related reports available',
    viewAll: 'View All',
    confidence: 'Confidence',
    published: 'Published',
    earningsRelated: 'Previous Earnings Reports',
    sameSector: 'Same Sector',
  },
};

function extractSemanticKeywords(content: string): string[] {
  if (!content) return [];
  const keywords: string[] = [];

  // Extract stock symbols (2-5 uppercase letters)
  const symbols = content.match(/\b[A-Z]{2,5}\b/g) || [];
  keywords.push(...symbols.slice(0, 5));

  // Extract company names (known patterns)
  const companyPatterns = [
    /أوراكل/g, /إنفيديا/g, /آبل/g, /مايكروسوفت/g, /أمازون/g,
    /جوجل/g, /ميتا/g, /تسلا/g, /وول مارت/g, /بنك/g,
    /Oracle/gi, /Nvidia/gi, /Apple/gi, /Microsoft/gi, /Amazon/gi,
  ];
  for (const pattern of companyPatterns) {
    if (pattern.test(content)) {
      keywords.push(pattern.source.replace(/[\\\/]/g, ''));
    }
  }

  // Extract sector keywords
  const sectorKeywords = ['نفط', 'ذهب', 'تكنولوجيا', 'بنوك', 'أرباح', 'إيرادات', 'تضخم', 'فائدة'];
  for (const kw of sectorKeywords) {
    if (content.includes(kw)) keywords.push(kw);
  }

  return [...new Set(keywords)].slice(0, 10);
}

function formatDate(dateStr: string | Date | null, locale: string): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function RelatedReports({
  currentReportId,
  currentReportType,
  currentSectors,
  related = [],
  locale = 'ar',
  reportContent,
}: RelatedReportsProps) {
  const t = (key: string) => UI_LABELS[locale]?.[key] || UI_LABELS.ar[key] || key;
  const [activeFilter, setActiveFilter] = useState<'all' | 'earnings' | 'sector'>('all');
  const [loading, setLoading] = useState(false);
  const [fetchedReports, setFetchedReports] = useState<RelatedReport[]>(related);

  // Fetch related reports if not provided
  useEffect(() => {
    if (related.length > 0) {
      setFetchedReports(related);
      return;
    }

    // Fetch from API
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '6',
          exclude: currentReportId,
          type: currentReportType,
        });
        if (currentSectors.length > 0) {
          params.set('sectors', currentSectors.join(','));
        }
        const semanticKeywords = reportContent ? extractSemanticKeywords(reportContent) : [];
        if (semanticKeywords.length > 0) {
          params.set('keywords', semanticKeywords.join(','));
        }
        const res = await fetch(`/api/reports?${params}`);
        if (res.ok) {
          const data = await res.json();
          setFetchedReports(data.reports || data || []);
        }
      } catch (err) {
        console.warn('[RelatedReports] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentReportId, currentReportType, currentSectors, related, reportContent]);

  // Filter reports
  const filteredReports = fetchedReports.filter(r => {
    if (activeFilter === 'earnings') return r.reportType === 'earnings' || r.reportType === 'analysis';
    if (activeFilter === 'sector') return true; // All are sector-relevant from API
    return true;
  }).slice(0, 5);

  if (filteredReports.length === 0 && !loading) {
    return null;
  }

  return (
    <div style={{
      marginTop: '32px',
      padding: '20px',
      borderRadius: '12px',
      background: 'rgba(128,128,128,0.03)',
      border: '1px solid rgba(128,128,128,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-head, #fff)',
            margin: 0,
          }}>
            {t('title')}
          </h3>
          <p style={{
            fontSize: '11px',
            color: 'var(--text3, #888)',
            margin: '4px 0 0 0',
          }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'earnings', 'sector'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: activeFilter === filter
                  ? '1px solid rgba(0,153,107,0.4)'
                  : '1px solid rgba(128,128,128,0.12)',
                background: activeFilter === filter
                  ? 'rgba(0,153,107,0.1)'
                  : 'transparent',
                color: activeFilter === filter ? '#00996B' : 'var(--text2, #999)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t(filter === 'all' ? 'viewAll' : filter === 'earnings' ? 'earningsRelated' : 'sameSector')}
            </button>
          ))}
        </div>
      </div>

      {/* Report cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            border: '2px solid rgba(128,128,128,0.2)', borderTopColor: '#00996B',
            animation: 'spin 1s linear infinite', margin: '0 auto',
          }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredReports.map(report => {
            const impact = report.marketImpact || 'neutral';
            const impactColor = IMPACT_COLORS[impact] || IMPACT_COLORS.neutral;
            const typeLabel = TYPE_LABELS[locale]?.[report.reportType] || report.reportType;

            return (
              <Link
                key={report.id}
                href={`/reports/${report.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(128,128,128,0.03)',
                  border: '1px solid rgba(128,128,128,0.06)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(128,128,128,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(128,128,128,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(128,128,128,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(128,128,128,0.06)';
                }}
              >
                {/* Impact indicator */}
                <div style={{
                  width: '4px',
                  height: '36px',
                  borderRadius: '2px',
                  background: impactColor,
                  flexShrink: 0,
                }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text2, #ccc)',
                    margin: 0,
                    lineHeight: '1.5',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {report.title}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '4px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                    {/* Type badge */}
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: 'rgba(128,128,128,0.08)',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--text3, #888)',
                    }}>
                      {typeLabel}
                    </span>

                    {/* Impact badge */}
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: `${impactColor}15`,
                      color: impactColor,
                      fontSize: '10px',
                      fontWeight: 600,
                    }}>
                      {IMPACT_LABELS[locale]?.[impact] || impact}
                    </span>

                    {/* Confidence */}
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text3, #888)',
                    }}>
                      {t('confidence')}: {report.confidenceScore}%
                    </span>

                    {/* Date */}
                    {report.publishedAt && (
                      <span style={{
                        fontSize: '10px',
                        color: 'var(--text3, #888)',
                      }}>
                        {formatDate(report.publishedAt, locale)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
