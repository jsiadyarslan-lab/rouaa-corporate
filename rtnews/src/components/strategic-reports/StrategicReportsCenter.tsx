'use client';

// ═══════════════════════════════════════════════════════════════════
// StrategicReportsCenter — unified page for all 5 locales
// V2: Uses project CSS variables (--bg, --cyan, --purple, etc.) for
// consistent dark-mode appearance matching the rest of the project.
// (V1 used hardcoded #0A0E27 blue background, project uses #050810 black.)
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getStrategicStrings, StrategicLocale, formatTimeAgoStrategic } from '@/lib/strategic-reports-i18n';
import StrategicReportCard, { StrategicReport } from './StrategicReportCard';

interface Props {
  locale: StrategicLocale;
  reports: StrategicReport[];
}

// ─── Filter chip ───────────────────────────────────────────────
function FilterChip({
  active, onClick, label, count, colorVar,
}: {
  active: boolean; onClick: () => void; label: string; count: number; colorVar: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '6px 12px', borderRadius: '8px',
        fontSize: '11px', fontWeight: active ? 700 : 500,
        whiteSpace: 'nowrap', cursor: 'pointer',
        background: active ? `var(--${colorVar}2)` : 'transparent',
        color: active ? `var(--${colorVar})` : 'var(--text3)',
        border: `1px solid ${active ? `var(--${colorVar}2)` : 'var(--rim)'}`,
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
      }}
    >
      <span>{label}</span>
      <span style={{
        fontSize: '9px', fontWeight: 700,
        padding: '1px 5px', borderRadius: '4px',
        background: active ? `var(--${colorVar}2)` : 'var(--surface-2)',
        color: active ? `var(--${colorVar})` : 'var(--text3)',
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
      }}>
        {count}
      </span>
    </button>
  );
}

// ─── Most Read Sidebar ─────────────────────────────────────────
function MostReadSidebar({
  reports, locale,
}: { reports: StrategicReport[]; locale: StrategicLocale }) {
  const s = getStrategicStrings(locale);

  const top5 = useMemo(() => {
    return [...reports]
      .sort((a, b) => {
        const aScore = a.confidenceScore + (Date.now() - new Date(a.publishedAt || a.createdAt).getTime()) / (24 * 60 * 60 * 1000) * -2;
        const bScore = b.confidenceScore + (Date.now() - new Date(b.publishedAt || b.createdAt).getTime()) / (24 * 60 * 60 * 1000) * -2;
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [reports]);

  if (top5.length === 0) return null;

  return (
    <div className="glass-card" style={{
      borderRadius: '14px',
      overflow: 'hidden',
      position: 'sticky', top: '80px',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--rim)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--purple2)', border: '1px solid var(--violet-dim)',
          color: 'var(--purple)', fontSize: '14px',
        }}>🔥</div>
        <div>
          <h3 style={{
            fontSize: '13px', fontWeight: 700, color: 'var(--text-head)',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>{s.mostReadTitle}</h3>
          <p style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '1px' }}>{s.mostReadSubtitle}</p>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '8px 10px' }}>
        {top5.map((report, idx) => {
          const href = locale === 'ar' ? `/strategic-reports/${report.slug}` : `/${locale}/strategic-reports/${report.slug}`;
          const medalColors = ['#FFB800', '#C0C0C0', '#CD7F32'];
          const medalBgs = ['rgba(255,184,0,0.1)', 'rgba(192,192,192,0.1)', 'rgba(205,127,50,0.1)'];
          const cleanTitle = report.title
            .replace(/^تقرير استراتيجي:\s*/i, '')
            .replace(/^تقرير استراتيجي\s*[-–—:]\s*/i, '')
            .replace(/^Strategic Report:\s*/i, '')
            .trim();

          return (
            <Link
              key={report.id}
              href={href}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '8px 10px', borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: idx < 3 ? medalBgs[idx] : 'var(--surface-2)',
                color: idx < 3 ? medalColors[idx] : 'var(--text3)',
                fontSize: '11px', fontWeight: 700,
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
              }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{cleanTitle}</div>
                <div style={{
                  fontSize: '9px', color: 'var(--text3)', marginTop: '2px',
                  fontFamily: 'var(--font-jetbrains-mono, monospace)',
                }}>
                  {formatTimeAgoStrategic(report.publishedAt || report.createdAt, locale)} · {report.confidenceScore}%
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function StrategicReportsCenter({ locale, reports }: Props) {
  const s = getStrategicStrings(locale);
  const isRTL = s.dir === 'rtl';

  const [mounted, setMounted] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
  }, []);

  // Filter logic
  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (scopeFilter !== 'all') {
      result = result.filter(r => r.scope === scopeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(r => {
        const sectors = r.sectors || [];
        return sectors.some(sec =>
          sec.includes(categoryFilter) || categoryFilter.includes(sec) ||
          sec.toLowerCase().includes(categoryFilter.toLowerCase())
        );
      });
    }

    if (impactFilter !== 'all') {
      result = result.filter(r => r.marketImpact === impactFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => {
        const title = r.title.toLowerCase();
        const summary = (r.summary || '').toLowerCase();
        const sectors = (r.sectors || []).join(' ').toLowerCase();
        return title.includes(q) || summary.includes(q) || sectors.includes(q);
      });
    }

    return result;
  }, [reports, scopeFilter, categoryFilter, impactFilter, searchQuery]);

  // Counts for each filter
  const scopeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: reports.length, global: 0, arabic: 0, regional: 0, domestic: 0 };
    for (const r of reports) counts[r.scope] = (counts[r.scope] || 0) + 1;
    return counts;
  }, [reports]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: reports.length };
    const cats = ['سياسة', 'اقتصاد', 'أسواق', 'طاقة', 'عملات', 'كريبتو', 'بنوك', 'سلع', 'تقنية', 'جيوسياسي', 'غذاء'];
    for (const cat of cats) {
      counts[cat] = reports.filter(r => (r.sectors || []).some(sec => sec.includes(cat) || cat.includes(sec))).length;
    }
    return counts;
  }, [reports]);

  const impactCounts = useMemo(() => {
    const counts: Record<string, number> = { all: reports.length, bullish: 0, bearish: 0, neutral: 0 };
    for (const r of reports) counts[r.marketImpact] = (counts[r.marketImpact] || 0) + 1;
    return counts;
  }, [reports]);

  // Filter options
  const scopeOptions = [
    { id: 'all', label: s.all, icon: '📋' },
    { id: 'global', label: s.scopeGlobal, icon: '🌍' },
    { id: 'arabic', label: s.scopeArabic, icon: '🕌' },
    { id: 'regional', label: s.scopeRegional, icon: '🗺️' },
    { id: 'domestic', label: s.scopeDomestic, icon: '🏠' },
  ];

  const categoryOptions = [
    { id: 'all', label: s.all, icon: '📋' },
    { id: 'سياسة', label: s.catPolitics, icon: '🏛️' },
    { id: 'اقتصاد', label: s.catEconomy, icon: '📊' },
    { id: 'أسواق', label: s.catMarkets, icon: '📈' },
    { id: 'طاقة', label: s.catEnergy, icon: '⚡' },
    { id: 'عملات', label: s.catCurrencies, icon: '💱' },
    { id: 'كريبتو', label: s.catCrypto, icon: '₿' },
    { id: 'بنوك', label: s.catBanks, icon: '🏦' },
    { id: 'سلع', label: s.catCommodities, icon: '🥇' },
    { id: 'تقنية', label: s.catTech, icon: '💻' },
    { id: 'جيوسياسي', label: s.catGeopolitics, icon: '🌍' },
    { id: 'غذاء', label: s.catFood, icon: '🌾' },
  ];

  const impactOptions = [
    { id: 'all', label: s.all, colorVar: 'gold' },
    { id: 'bullish', label: s.impactBullish, colorVar: 'bull' },
    { id: 'bearish', label: s.impactBearish, colorVar: 'bear' },
    { id: 'neutral', label: s.impactNeutral, colorVar: 'gold' },
  ];

  return (
    <main className="min-h-screen pb-mobile-safe" dir={s.dir} style={{ background: 'var(--ink)' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══ HERO HEADER ═══ */}
      <section style={{ padding: '28px 0 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '14px', marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--purple2)', border: '1px solid var(--violet-dim)',
                color: 'var(--purple)', fontSize: '22px',
              }}>🛡️</div>
              <div>
                <h1 style={{
                  fontSize: '26px', fontWeight: 700, color: 'var(--text-head)',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                  marginBottom: '2px',
                }}>{s.pageTitle}</h1>
                <p style={{
                  fontSize: '12px', color: 'var(--text3)',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{s.reportsCount.replace('{count}', String(reports.length))}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowSearch(!showSearch)}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: showSearch ? 'var(--cyan2)' : 'var(--bg3)',
                  border: `1px solid ${showSearch ? 'var(--cyan2)' : 'var(--rim)'}`,
                  color: showSearch ? 'var(--cyan)' : 'var(--text3)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                aria-label="Search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <Link
                href={locale === 'ar' ? '/reports' : `/${locale}/reports`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                  background: 'var(--cyan2)', color: 'var(--cyan)',
                  border: '1px solid var(--cyan2)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}>
                  <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
                </svg>
                {s.backToReports}
              </Link>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div style={{ marginBottom: '12px', animation: 'fadeInUp 0.3s ease' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '10px',
                background: 'var(--bg3)', border: '1px solid var(--cyan2)',
                maxWidth: '500px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={s.searchPlaceholder}
                  autoFocus
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '14px',
                    background: 'transparent', color: 'var(--text-head)',
                    fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>
                )}
              </div>
            </div>
          )}

          <p style={{
            fontSize: '13px', color: 'var(--text2)', marginBottom: '20px',
            fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          }}>{s.pageSubtitle}</p>
        </div>
      </section>

      {/* ═══ MAIN CONTENT — Two-Column Layout ═══ */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px) 48px' }}>
        <style>{`
          @media (min-width: 900px) {
            .strategic-two-col { grid-template-columns: 5fr 2fr !important; }
          }
        `}</style>
        <div className="strategic-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* ═══ MAIN COLUMN ═══ */}
          <div>
            {/* Filters */}
            <div className="glass-card" style={{
              borderRadius: '12px', padding: '12px 14px',
              marginBottom: '16px',
            }}>
              {/* Scope filter row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginRight: '6px',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{s.filterByScope}:</span>
                {scopeOptions.map(opt => (
                  <FilterChip
                    key={opt.id}
                    active={scopeFilter === opt.id}
                    onClick={() => setScopeFilter(opt.id)}
                    label={`${opt.icon} ${opt.label}`}
                    count={scopeCounts[opt.id] || 0}
                    colorVar="purple"
                  />
                ))}
              </div>

              {/* Category filter row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
                marginBottom: '10px',
              }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginRight: '6px',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{s.filterByCategory}:</span>
                {categoryOptions.map(opt => (
                  <FilterChip
                    key={opt.id}
                    active={categoryFilter === opt.id}
                    onClick={() => setCategoryFilter(opt.id)}
                    label={`${opt.icon} ${opt.label}`}
                    count={categoryCounts[opt.id] || 0}
                    colorVar="cyan"
                  />
                ))}
              </div>

              {/* Impact filter row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginRight: '6px',
                  fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                }}>{s.filterByImpact}:</span>
                {impactOptions.map(opt => (
                  <FilterChip
                    key={opt.id}
                    active={impactFilter === opt.id}
                    onClick={() => setImpactFilter(opt.id)}
                    label={opt.label}
                    count={impactCounts[opt.id] || 0}
                    colorVar={opt.colorVar}
                  />
                ))}
              </div>
            </div>

            {/* Empty state */}
            {filteredReports.length === 0 ? (
              <div className="glass-card" style={{
                textAlign: 'center', padding: '60px 24px',
                borderRadius: '16px',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.3 }}>🛡️</div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text2)', marginBottom: '6px' }}>
                  {s.noReports}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>{s.noReportsHint}</p>
                <button
                  onClick={() => { setScopeFilter('all'); setCategoryFilter('all'); setImpactFilter('all'); setSearchQuery(''); }}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--cyan2)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
                  }}
                >
                  {s.all}
                </button>
              </div>
            ) : (
              <>
                {/* Reports grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px',
                }}>
                  {filteredReports.map(report => (
                    <StrategicReportCard
                      key={report.id}
                      report={report}
                      locale={locale}
                    />
                  ))}
                </div>

                {/* Result count */}
                <div style={{
                  textAlign: 'center', padding: '16px 0',
                  fontSize: '11px', color: 'var(--text3)',
                  fontFamily: 'var(--font-jetbrains-mono, monospace)',
                }}>
                  {filteredReports.length} / {reports.length}
                </div>
              </>
            )}

            {/* Disclaimer */}
            <div style={{
              marginTop: '20px', padding: '14px 16px',
              background: 'var(--gold2)', borderRadius: '10px',
              border: '1px solid var(--gold-dim)',
              borderInlineStart: '3px solid var(--gold)',
            }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, color: 'var(--gold)',
                marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
                fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
              }}>⚠️ {s.disclaimerTitle}</div>
              <p style={{
                fontSize: '11px', color: 'var(--text2)', lineHeight: 1.7,
              }}>{s.disclaimerBody}</p>
            </div>
          </div>

          {/* ═══ SIDEBAR ═══ */}
          <aside>
            <MostReadSidebar reports={reports} locale={locale} />
          </aside>
        </div>
      </div>
    </main>
  );
}
