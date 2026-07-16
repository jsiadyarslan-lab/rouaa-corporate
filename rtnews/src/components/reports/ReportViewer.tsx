'use client';

import React, { useMemo, useState } from 'react';
import { cleanMarkdown, extractRecommendations } from '@/lib/clean-markdown';
import { sanitizeHtml } from '@/lib/sanitize';
import SentimentGauge from './SentimentGauge';
import Recommendations from './Recommendations';
import RelatedReports from './RelatedReports';

// --- Types matching the live Roua platform ---

interface ReportData {
  id: string;
  title: string;
  category: string;
  categoryAr: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentAr: string;
  confidenceLevel: number;
  sentimentScore: number; // 0-100 for the gauge
  sectors: { icon: string; name: string; nameAr: string }[];
  sections: {
    id: string;
    title: string;
    titleAr: string;
    content: string; // Raw Markdown content
  }[];
  type: string;
  typeAr: string;
}

interface ReportViewerProps {
  report: ReportData;
  className?: string;
}

// --- Section label mapping for untranslated keys ---

const SECTION_LABEL_MAP: Record<string, string> = {
  'keyAnalysisPoints': 'نقاط التحليل الرئيسية',
  'keyAnalysis': 'التحليل الرئيسي',
  'marketImpact': 'التأثير على السوق',
  'historicalContext': 'السياق التاريخي',
  'expertOpinions': 'آراء الخبراء',
  'indicators': 'المؤشرات الرئيسية',
  'charts': 'الرسوم البيانية',
  'related': 'تقارير ذات صلة',
  'recommendations': 'التوصيات',
  'scenarios': 'السيناريوهات',
  'affectedAssets': 'الأصول المتأثرة',
  'riskAssessment': 'تقييم المخاطر',
};

function getArabicTitle(sectionId: string, titleAr: string): string {
  if (SECTION_LABEL_MAP[sectionId]) return SECTION_LABEL_MAP[sectionId];
  if (titleAr && !/^[a-zA-Z]/.test(titleAr)) return titleAr;
  return SECTION_LABEL_MAP[sectionId] || titleAr || sectionId;
}

// --- Tab system for report content ---

type ContentTab = 'content' | 'indicators' | 'charts' | 'raw';

interface TabConfig {
  id: ContentTab;
  label: string;
  icon: string;
}

const CONTENT_TABS: TabConfig[] = [
  { id: 'content', label: 'المحتوى', icon: '📄' },
  { id: 'indicators', label: 'المؤشرات', icon: '📊' },
  { id: 'charts', label: 'الرسوم البيانية', icon: '📈' },
  { id: 'raw', label: 'البيانات الخام', icon: '🔧' },
];

// --- Sentiment color helpers ---

const SENTIMENT_COLORS = {
  positive: { bg: 'rgba(0,153,107,0.1)', border: 'rgba(0,153,107,0.3)', text: '#00996B' },
  negative: { bg: 'rgba(212,54,92,0.1)', border: 'rgba(212,54,92,0.3)', text: '#D4365C' },
  neutral: { bg: 'rgba(212,147,13,0.1)', border: 'rgba(212,147,13,0.3)', text: '#D4930D' },
};

// --- Main ReportViewer component ---

export default function ReportViewer({ report, className = '' }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>('content');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Process all sections through cleanMarkdown with deduplication
  const processedSections = useMemo(() => {
    // Combine all section content into one Markdown string for dedup
    const fullMarkdown = report.sections
      .map(s => `## ${s.titleAr || s.title}\n${s.content}`)
      .join('\n\n');

    // Extract recommendations from the full content
    const recs = extractRecommendations(fullMarkdown);

    // Process each section individually through cleanMarkdown
    const processed = report.sections.map(section => ({
      id: section.id,
      title: getArabicTitle(section.id, section.titleAr),
      html: cleanMarkdown(section.content),
      rawMarkdown: section.content,
    }));

    return { sections: processed, recommendations: recs };
  }, [report.sections]);

  const sentimentStyle = SENTIMENT_COLORS[report.sentiment] || SENTIMENT_COLORS.neutral;

  // Handle feedback submission
  const handleFeedback = async (
    recommendationId: string,
    feedbackType: string,
    executedPrice?: number
  ) => {
    try {
      const res = await fetch('/api/advisor/feedback?XTransformPort=3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId,
          feedbackType,
          reportId: report.id,
          executedPrice,
        }),
      });
      if (!res.ok) throw new Error('Feedback submission failed');
    } catch (err) {
      console.error('Feedback error:', err);
      throw err;
    }
  };

  return (
    <div
      className={className}
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '32px 16px',
        paddingInline: 'clamp(16px, 3vw, 48px)',
      }}
    >
      {/* Back link */}
      <a
        href="/ar/reports"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text2, #999)',
          fontSize: '13px',
          textDecoration: 'none',
          marginBottom: '16px',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        العودة لقائمة التقارير
      </a>

      <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
        {/* Sidebar TOC (desktop only) */}
        <aside
          className="hidden xl:block"
          style={{ width: '220px', flexShrink: 0 }}
        >
          <div style={{
            position: 'sticky',
            top: '80px',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-head, #fff)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(128,128,128,0.12)',
            }}>
              فهرس التقرير
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {processedSections.sections.map(section => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    display: 'block',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: activeSection === section.id ? 'var(--text-head, #fff)' : 'var(--text2, #999)',
                    background: activeSection === section.id ? 'rgba(128,128,128,0.1)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    fontWeight: activeSection === section.id ? 600 : 400,
                  }}
                >
                  {section.title}
                </a>
              ))}
            </nav>

            <div style={{ height: '1px', background: 'rgba(128,128,128,0.12)', margin: '16px 0' }} />

            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(128,128,128,0.08)',
              border: '1px solid rgba(128,128,128,0.15)',
              color: 'var(--text2, #999)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              مشاركة التقرير
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            position: 'relative',
            borderRadius: '12px',
            background: 'var(--card, rgba(20,20,30,0.8))',
            border: '1px solid rgba(128,128,128,0.1)',
            overflow: 'hidden',
          }}>
            {/* Watermark */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '80px',
              fontWeight: 700,
              color: 'rgba(0,229,255,0.025)',
              pointerEvents: 'none',
              zIndex: 0,
              whiteSpace: 'nowrap',
              letterSpacing: '8px',
              userSelect: 'none',
              textShadow: '0 0 40px rgba(0,229,255,0.03)',
            }}>
              رؤى
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Header bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: '1px solid rgba(128,128,128,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{ fontWeight: 700, color: 'var(--text-head, #fff)' }}>رؤى</span>
                  <span style={{ color: 'rgba(128,128,128,0.4)', margin: '0 4px' }}>|</span>
                  <span style={{ fontSize: '12px', color: 'var(--text2, #999)' }}>{report.typeAr}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text2, #999)' }}>
                  <span>{report.date}</span>
                  <span style={{ color: 'rgba(128,128,128,0.4)' }}>|</span>
                  <span>{report.categoryAr}</span>
                </div>
              </div>

              {/* Classification stamps */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: sentimentStyle.bg,
                  border: `1px solid ${sentimentStyle.border}`,
                  color: sentimentStyle.text,
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {report.sentimentAr}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(128,128,128,0.08)',
                  border: '1px solid rgba(128,128,128,0.15)',
                  color: 'var(--text2, #999)',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  مدعوم بالذكاء الاصطناعي
                </span>
                {/* V224: "ثقة X%" stamp removed from classification row — shown in confidence card instead */}
              </div>

              {/* Sentiment Gauge */}
              <div style={{ padding: '0 20px' }}>
                <SentimentGauge value={report.sentimentScore} />
              </div>

              {/* Meta info row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '8px',
                padding: '12px 20px',
                borderTop: '1px solid rgba(128,128,128,0.06)',
              }}>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--text2, #999)' }}>نوع التقرير</span>
                  <span style={{ color: 'var(--text-head, #fff)', fontWeight: 600, marginRight: '6px' }}>{report.typeAr}</span>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--text2, #999)' }}>النطاق</span>
                  <span style={{ color: 'var(--text-head, #fff)', fontWeight: 600, marginRight: '6px' }}>{report.categoryAr}</span>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--text2, #999)' }}>تاريخ النشر</span>
                  <span style={{ color: 'var(--text-head, #fff)', fontWeight: 600, marginRight: '6px' }}>{report.date}</span>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: 'var(--text2, #999)' }}>مستوى الثقة</span>
                  <span style={{ color: 'var(--text-head, #fff)', fontWeight: 600, marginRight: '6px' }}>{report.confidenceLevel}%</span>
                </div>
              </div>

              {/* Sectors */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderTop: '1px solid rgba(128,128,128,0.06)',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text2, #999)' }}>القطاعات</span>
                {report.sectors.map((sector, i) => (
                  <span key={i} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(128,128,128,0.06)',
                    fontSize: '11px',
                    color: 'var(--text2, #999)',
                  }}>
                    {sector.icon} {sector.nameAr}
                  </span>
                ))}
              </div>

              {/* Content tabs */}
              <div style={{
                display: 'flex',
                gap: '0',
                padding: '0 20px',
                borderTop: '1px solid rgba(128,128,128,0.06)',
                borderBottom: '1px solid rgba(128,128,128,0.1)',
              }}>
                {CONTENT_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: activeTab === tab.id ? 700 : 400,
                      color: activeTab === tab.id ? 'var(--text-head, #fff)' : 'var(--text2, #999)',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '2px solid var(--accent, #00996B)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding: '20px' }}>
                {activeTab === 'content' && (
                  <div className="report-markdown-content">
                    {processedSections.sections.map(section => (
                      <div key={section.id} id={section.id} style={{ marginBottom: '8px' }}>
                        {/* Section header */}
                        <div style={{
                          marginBottom: '16px',
                        }}>
                          <h2 style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'var(--text-head, #fff)',
                            paddingBottom: '8px',
                            borderBottom: '1px solid rgba(128,128,128,0.12)',
                          }}>
                            {section.title}
                          </h2>
                        </div>

                        {/* Section content (rendered from cleanMarkdown) */}
                        <div
                          className="report-section-content"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.html) }}
                        />

                        {/* Separator between sections */}
                        <hr style={{
                          border: 'none',
                          borderTop: '1px solid rgba(128,128,128,0.08)',
                          margin: '24px 0',
                        }} />
                      </div>
                    ))}

                    {/* Recommendations with interaction buttons */}
                    <Recommendations
                      recommendations={processedSections.recommendations}
                      reportId={report.id}
                      onFeedbackSubmit={handleFeedback}
                    />

                    {/* Related Reports (V320: Phase 3) */}
                    <RelatedReports
                      currentReportId={report.id}
                      currentReportType={report.type}
                      currentSectors={report.sectors.map(s => s.name)}
                      locale="ar"
                      reportContent={report.sections.map(s => s.content).join('\n')}
                    />
                  </div>
                )}

                {activeTab === 'indicators' && (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text2, #999)',
                    fontSize: '13px',
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                    المؤشرات الرئيسية متاحة في التقرير الكامل
                    <br />
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>يتم تحديث المؤشرات تلقائياً كل 15 دقيقة</span>
                  </div>
                )}

                {activeTab === 'charts' && (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text2, #999)',
                    fontSize: '13px',
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
                    الرسوم البيانية التفاعلية قيد التطوير
                    <br />
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>ستتوفر قريباً مع بيانات حية من الأسواق</span>
                  </div>
                )}

                {activeTab === 'raw' && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(128,128,128,0.1)',
                    maxHeight: '500px',
                    overflow: 'auto',
                  }}>
                    <pre style={{
                      fontSize: '11px',
                      lineHeight: '1.7',
                      color: 'var(--text2, #999)',
                      fontFamily: 'var(--font-mono, monospace)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      direction: 'rtl',
                    }}>
                      {report.sections.map(s => `## ${s.titleAr || s.title}\n${s.content}`).join('\n\n')}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
