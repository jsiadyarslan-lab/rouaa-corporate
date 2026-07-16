'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SubscribeForm from '@/components/rouaa/SubscribeForm';

// ─── Types ──────────────────────────────────────────────────────

interface StrategicReport {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  imageUrl?: string;
  sectors: string[];
  publishedAt: string | null;
  createdAt: string;
}

interface Props {
  reports: StrategicReport[];
}

// ─── Constants ──────────────────────────────────────────────────

const SCOPE_FILTERS = [
  { id: 'all', label: 'الكل', icon: '📋' },
  { id: 'global', label: 'عالمي', icon: '🌍' },
  { id: 'arabic', label: 'عربي', icon: '🕌' },
  { id: 'regional', label: 'إقليمي', icon: '🗺️' },
] as const;

const CATEGORY_FILTERS = [
  { id: 'all', label: 'الكل', icon: '📋' },
  { id: 'سياسة', label: 'سياسة', icon: '🏛️' },
  { id: 'اقتصاد كلي', label: 'اقتصاد كلي', icon: '📊' },
  { id: 'أسواق', label: 'أسواق', icon: '📈' },
  { id: 'طاقة', label: 'طاقة', icon: '⚡' },
  { id: 'عملات', label: 'عملات', icon: '💱' },
  { id: 'كريبتو', label: 'كريبتو', icon: '₿' },
  { id: 'بنوك', label: 'بنوك', icon: '🏦' },
  { id: 'سلع', label: 'سلع', icon: '🥇' },
] as const;

const IMPACT_LABELS: Record<string, string> = {
  bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد',
};

const IMPACT_COLORS: Record<string, string> = {
  bullish: 'var(--bull)', bearish: 'var(--bear)', neutral: 'var(--gold)',
};

const SCOPE_LABELS: Record<string, string> = {
  global: 'عالمي', arabic: 'عربي', regional: 'إقليمي',
};

const SCOPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  global: { bg: 'rgba(0,229,255,.08)', color: 'var(--cyan)', border: 'rgba(0,229,255,.2)' },
  arabic: { bg: 'rgba(0,201,167,.08)', color: '#00C9A7', border: 'rgba(0,201,167,.2)' },
  regional: { bg: 'rgba(232,130,74,.08)', color: '#E8824A', border: 'rgba(232,130,74,.2)' },
};

// ─── Helpers ────────────────────────────────────────────────────

function stripStrategicPrefix(title: string): string {
  return title.replace(/^تقرير استراتيجي:\s*/i, '').replace(/^تقرير استراتيجي\s*[-–—:]\s*/i, '');
}

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `${diffMin} دقيقة`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ساعة`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} يوم`;
    const diffMonth = Math.floor(diffDay / 30);
    return `${diffMonth} شهر`;
  } catch {
    return '';
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ─── Main Component ─────────────────────────────────────────────

export default function StrategicReportsPageClient({ reports }: Props) {
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter reports by scope and category
  const filteredReports = reports.filter(r => {
    if (scopeFilter !== 'all' && r.scope !== scopeFilter) return false;
    if (categoryFilter !== 'all') {
      const sectors = r.sectors || [];
      if (!sectors.some(s => s.includes(categoryFilter) || categoryFilter.includes(s))) return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen pb-mobile-safe">
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative" style={{ padding: '32px 0 0' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="glass-card" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(139,92,246,.06), rgba(0,229,255,.03))' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)',
                    fontSize: '20px',
                  }}>
                    🛡️
                  </div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>التقارير الاستراتيجية</h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  تحليلات استراتيجية معمقة للتحولات الجيوسياسية والاقتصادية وتأثيرها على الأسواق
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/reports"
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all"
                  style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', color: 'var(--cyan)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                  مركز التقارير
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1280px] mx-auto py-6" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>

        {/* ─── SCOPE FILTERS ─── */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginLeft: 4 }}>النطاق:</span>
          {SCOPE_FILTERS.map(filter => {
            const isActive = scopeFilter === filter.id;
            const count = filter.id === 'all'
              ? reports.length
              : reports.filter(r => r.scope === filter.id).length;
            return (
              <button
                key={filter.id}
                onClick={() => setScopeFilter(filter.id)}
                className="flex items-center gap-2 text-[12px] px-4 py-2 rounded-lg transition-all"
                style={{
                  background: isActive ? 'rgba(139,92,246,.14)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(139,92,246,.3)' : 'var(--rim)'}`,
                  color: isActive ? '#8B5CF6' : 'var(--text3)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span>{filter.icon}</span>
                {filter.label}
                <span style={{
                  fontSize: '9px', fontWeight: 700,
                  background: isActive ? 'rgba(139,92,246,.12)' : 'var(--surface-2)',
                  color: isActive ? '#8B5CF6' : 'var(--text4)',
                  padding: '1px 6px', borderRadius: '6px',
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── CATEGORY FILTERS ─── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginLeft: 4 }}>التصنيف:</span>
          {CATEGORY_FILTERS.map(filter => {
            const isActive = categoryFilter === filter.id;
            const count = filter.id === 'all'
              ? reports.length
              : reports.filter(r => (r.sectors || []).some(s => s.includes(filter.id) || filter.id.includes(s))).length;
            return (
              <button
                key={filter.id}
                onClick={() => setCategoryFilter(filter.id)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: isActive ? 'rgba(0,229,255,.1)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(0,229,255,.25)' : 'var(--rim)'}`,
                  color: isActive ? 'var(--cyan)' : 'var(--text3)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 13 }}>{filter.icon}</span>
                {filter.label}
                <span style={{
                  fontSize: '9px', fontWeight: 700,
                  background: isActive ? 'rgba(0,229,255,.1)' : 'var(--surface-2)',
                  color: isActive ? 'var(--cyan)' : 'var(--text4)',
                  padding: '1px 5px', borderRadius: '6px',
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── REPORTS GRID ─── */}
        {filteredReports.length === 0 ? (
          <div className="glass-card flex items-center justify-center" style={{ padding: '60px', minHeight: '200px' }}>
            <div className="text-center">
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛡️</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text3)' }}>
                {scopeFilter === 'all' && categoryFilter === 'all' ? 'لا توجد تقارير استراتيجية حالياً' : `لا توجد تقارير استراتيجية مطابقة للفلاتر المحددة`}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text4)' }}>يتم إنشاء التقارير الاستراتيجية تلقائياً بواسطة الذكاء الاصطناعي</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const scopeStyle = SCOPE_COLORS[report.scope] || SCOPE_COLORS.global;
              const impactColor = IMPACT_COLORS[report.marketImpact] || 'var(--text3)';
              const impactLabel = IMPACT_LABELS[report.marketImpact] || report.marketImpact;
              const scopeLabel = SCOPE_LABELS[report.scope] || report.scope;
              const confColor = report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)';

              return (
                <Link
                  key={report.id}
                  href={`/strategic-reports/${report.slug}`}
                  className="glass-card group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    padding: '20px',
                    borderInlineStart: `3px solid #8B5CF6`,
                    background: `linear-gradient(135deg, rgba(139,92,246,.04), var(--surface-1))`,
                    textDecoration: 'none',
                  }}
                >
                  {/* Tags Row */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {/* Scope Badge */}
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                      background: scopeStyle.bg, color: scopeStyle.color,
                      border: `1px solid ${scopeStyle.border}`,
                    }}>
                      {scopeLabel}
                    </span>
                    {/* Strategic Badge */}
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                      background: 'rgba(139,92,246,.1)', color: '#8B5CF6',
                      border: '1px solid rgba(139,92,246,.2)',
                    }}>
                      🛡️ استراتيجي
                    </span>
                    {/* Impact Badge */}
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                      background: report.marketImpact === 'bullish' ? 'var(--bull2)' : report.marketImpact === 'bearish' ? 'var(--bear2)' : 'var(--gold2)',
                      color: impactColor,
                      border: `1px solid ${report.marketImpact === 'bullish' ? 'rgba(34,197,94,.2)' : report.marketImpact === 'bearish' ? 'rgba(239,68,80,.2)' : 'rgba(255,184,0,.2)'}`,
                    }}>
                      {impactLabel}
                    </span>
                    {/* Sector Badges */}
                    {(report.sectors || []).slice(0, 2).map((sector, idx) => {
                      const sectorIcon = CATEGORY_FILTERS.find(c => sector.includes(c.id) || c.id.includes(sector))?.icon || '📌';
                      return (
                        <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                          background: 'rgba(0,229,255,.06)', color: 'var(--cyan)',
                          border: '1px solid rgba(0,229,255,.12)',
                        }}>
                          {sectorIcon} {sector}
                        </span>
                      );
                    })}
                  </div>

                  {/* Title */}
                  <h4 className="text-[15px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                    {stripStrategicPrefix(report.title)}
                  </h4>

                  {/* Summary Snippet */}
                  {report.summary && (
                    <p className="text-[12px] line-clamp-2 mb-3" style={{ color: 'var(--text3)' }}>
                      {report.summary}
                    </p>
                  )}

                  {/* Confidence & Date */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      {/* Confidence Score */}
                      {report.confidenceScore > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div style={{
                            width: '40px', height: '4px', borderRadius: '2px',
                            background: 'var(--surface-2)', overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${report.confidenceScore}%`, height: '100%',
                              borderRadius: '2px', background: confColor,
                              transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{
                            fontSize: '10px', fontFamily: 'var(--font-jetbrains-mono)',
                            fontWeight: 700, color: confColor,
                          }}>
                            {report.confidenceScore}%
                          </span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text4)' }}>
                      {report.publishedAt ? formatDate(report.publishedAt) : ''}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ─── DIVIDER ─── */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--rim), #8B5CF6, var(--rim), transparent)', margin: '40px 0' }} />

        {/* ─── NEWSLETTER ─── */}
        <div className="max-w-[800px] mx-auto">
          <div className="glass-card" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(139,92,246,.04), rgba(0,229,255,.02))' }}>
            <div className="flex items-center gap-3 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>النشرة البريدية</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>اشترك لتلقي أحدث التقارير الاستراتيجية مباشرة في بريدك الإلكتروني</p>
            <SubscribeForm />
          </div>
        </div>
      </div>
    </main>
  );
}
