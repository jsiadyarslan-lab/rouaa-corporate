'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { sanitizeDisplayText } from '@/lib/clean-markdown';
import { formatTimeAgoLocale } from '@/lib/locale';

// ─── Types ──────────────────────────────────────────────────────

interface Analysis {
  id: string; title: string; slug: string; assetClass: string;
  analysisType: string; timeFrame: string; riskLevel: string;
  sentiment: string; confidenceScore: number; priceTarget: any;
  publishedAt: string | null; validUntil: string | null; createdAt: string;
}

interface Report {
  id: string; title: string; slug: string; summary: string;
  reportType: string; scope: string; marketImpact: string;
  confidenceScore: number; imageUrl?: string;
  sectors: string[]; countries: string[];
  publishedAt: string | null; createdAt: string;
}

interface TimelineItem {
  id: string;
  title: string;
  slug: string;
  type: 'report' | 'analysis';
  reportType?: string;
  assetClass?: string;
  marketImpact?: string;
  sentiment?: string;
  confidenceScore: number;
  publishedAt: string;
  createdAt: string;
  summary?: string;
}

interface CategoryData {
  category: string;
  analizs: Analysis[];
}

interface Props {
  initialCategoryData: CategoryData[];
  initialDaily: Report[];
  initialWeekly: Report[];
  initialMonthly: Report[];
  initialQuarterly: Report[];
  initialSpecial: Report[];
  initialStrategic: Report[];
}

// ─── English Category Definitions ───────────────────────────────

const TR_REPORT_CATEGORIES = [
  { id: 'economy', nameTr: 'Makroekonomi', icon: '🏛️', color: '#FF6B85', colorBg: 'rgba(239,83,80,.12)', colorBorder: 'rgba(239,83,80,.22)' },
  { id: 'forex', nameTr: 'Döviz', icon: '💱', color: '#3BA7F0', colorBg: 'rgba(59,167,240,.14)', colorBorder: 'rgba(59,167,240,.3)' },
  { id: 'crypto', nameTr: 'Kripto', icon: '₿', color: '#A78BFA', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)' },
  { id: 'energy', nameTr: 'Enerji', icon: '⚡', color: '#E8824A', colorBg: 'rgba(232,130,74,.16)', colorBorder: 'rgba(232,130,74,.3)' },
  { id: 'commodities', nameTr: 'Hammaddeler', icon: '🥇', color: '#F0A500', colorBg: 'rgba(240,165,0,.18)', colorBorder: 'rgba(240,165,0,.35)' },
  { id: 'stocks', nameTr: 'Hisseler', icon: '📈', color: '#5B8DEF', colorBg: 'rgba(91,141,239,.14)', colorBorder: 'rgba(91,141,239,.3)' },
  { id: 'bonds', nameTr: 'Tahviller', icon: '📜', color: '#8B5CF6', colorBg: 'rgba(139,92,246,.12)', colorBorder: 'rgba(139,92,246,.25)' },
  { id: 'technicalAnalysis', nameTr: 'Teknik Analiz', icon: '📊', color: '#06B6D4', colorBg: 'rgba(6,182,212,.14)', colorBorder: 'rgba(6,182,212,.3)' },
  { id: 'earnings', nameTr: 'Şirket Sonuçları', icon: '💰', color: '#FFB800', colorBg: 'rgba(255,184,0,.12)', colorBorder: 'rgba(255,184,0,.25)' },
];

// English labels
const TYPE_LABELS: Record<string, string> = {
  daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', quarterly: 'Üç Aylık', special: 'Özel', strategic: 'Stratejik', analysis: 'Analiz',
};
const IMPACT_LABELS: Record<string, string> = {
  bullish: 'Yükseliş', bearish: 'Düşüş', neutral: 'Nötr',
};
const IMPACT_COLORS: Record<string, string> = {
  bullish: 'var(--bull)', bearish: 'var(--bear)', neutral: 'var(--gold)',
};
const SENTIMENT_LABELS: Record<string, string> = {
  bullish: 'Yükseliş', bearish: 'Düşüş', neutral: 'Nötr',
};
const RISK_LABELS: Record<string, string> = {
  low: 'Düşük', medium: 'Orta', high: 'Yüksek', extreme: 'Çok Yüksek',
};
const TIMEFRAME_LABELS: Record<string, string> = {
  intraday: 'Gün İçi', daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', quarterly: 'Üç Aylık',
};

// Asset class display names for timeline
const ASSET_CLASS_DISPLAY: Record<string, string> = {
  economy: 'Makroekonomi', forex: 'Döviz', crypto: 'Kripto', energy: 'Enerji',
  commodities: 'Hammaddeler', stocks: 'Hisseler', bonds: 'Tahviller',
  technicalAnalysis: 'Teknik Analiz', earnings: 'Şirket Sonuçları',
};

// ─── Clean JSON from summary text ────────────────────────────────
function cleanSummary(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/```(?:json)?\s*/gi, '');
  // Strip markdown headings
  cleaned = cleaned.replace(/^\s*#{1,2}(?!#)\s*.*$/gm, '');
  cleaned = cleaned.replace(/\n{2,}/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.trim().startsWith('{') || cleaned.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(cleaned.trim());
      if (typeof parsed === 'object' && parsed !== null) {
        const extractText = (obj: any): string[] => {
          const parts: string[] = [];
          if (typeof obj === 'string') { if (obj.length > 10) parts.push(obj); }
          else if (Array.isArray(obj)) { for (const item of obj) parts.push(...extractText(item)); }
          else if (typeof obj === 'object' && obj !== null) {
            for (const val of Object.values(obj)) {
              if (typeof val === 'string' && val.length > 10) parts.push(val);
              else if (typeof val === 'object' && val !== null) parts.push(...extractText(val));
            }
          }
          return parts;
        };
        const textParts = extractText(parsed);
        if (textParts.length > 0) {
          let result = textParts.slice(0, 2).join('. ');
          result = result.replace(/^\s*#{1,2}(?!#)\s*.*$/gm, '');
          return result;
        }
      }
    } catch { /* not JSON */ }
  }
  return sanitizeDisplayText(cleaned.slice(0, 200));
}

// ─── Main Component ─────────────────────────────────────────────

// ─── Category Filter Definitions (English) ──────────────────────
const TR_CATEGORY_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'economy', label: 'Makroekonomi' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Kripto' },
  { id: 'energy', label: 'Enerji' },
  { id: 'commodities', label: 'Hammaddeler' },
  { id: 'realEstate', label: 'Gayrimenkul' },
  { id: 'banking', label: 'Bankacılık' },
  { id: 'stocks', label: 'Hisseler' },
  { id: 'earnings', label: 'Sonuçlar' },
];

export default function TrReportsPageClient({ initialCategoryData, initialDaily, initialWeekly, initialMonthly, initialQuarterly, initialSpecial, initialStrategic }: Props) {
  const [categoryData] = useState<CategoryData[]>(initialCategoryData);
  const [dailyReports] = useState<Report[]>(initialDaily);
  const [weeklyReports] = useState<Report[]>(initialWeekly);
  const [monthlyReports] = useState<Report[]>(initialMonthly);
  const [quarterlyReports] = useState<Report[]>(initialQuarterly);
  const [specialReports] = useState<Report[]>(initialSpecial);
  const [strategicReports] = useState<Report[]>(initialStrategic);
  const [activeSection, setActiveSection] = useState<string>('categories');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'report' | 'analysis'>('all');
  const [timelineShowCount, setTimelineShowCount] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Build timeline items from all reports and analizs
  const timelineItems: TimelineItem[] = (() => {
    const items: TimelineItem[] = [];
    const allReports = [...dailyReports, ...weeklyReports, ...monthlyReports, ...quarterlyReports, ...specialReports, ...strategicReports];
    for (const r of allReports) {
      if (r.publishedAt) {
        items.push({
          id: r.id,
          title: sanitizeDisplayText(r.title),
          slug: r.slug,
          type: 'report',
          reportType: r.reportType,
          marketImpact: r.marketImpact,
          confidenceScore: r.confidenceScore,
          publishedAt: r.publishedAt,
          createdAt: r.createdAt,
          summary: r.summary ? cleanSummary(r.summary) : undefined,
        });
      }
    }
    for (const catData of categoryData) {
      for (const a of catData.analizs) {
        if (a.publishedAt) {
          items.push({
            id: a.id,
            title: sanitizeDisplayText(a.title),
            slug: a.slug,
            type: 'analysis',
            assetClass: a.assetClass,
            sentiment: a.sentiment,
            confidenceScore: a.confidenceScore,
            publishedAt: a.publishedAt,
            createdAt: a.createdAt,
          });
        }
      }
    }
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return items;
  })();

  // Filtered timeline öğe
  const filteredTimelineItems = timelineFilter === 'all'
    ? timelineItems
    : timelineItems.filter(item => item.type === timelineFilter);

  // Group timeline items by date
  const groupedTimelineItems: { dateKey: string; dateLabel: string; items: TimelineItem[] }[] = (() => {
    const groups: Map<string, { dateLabel: string; items: TimelineItem[] }> = new Map();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    for (const item of filteredTimelineItems) {
      const date = new Date(item.publishedAt);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let dateKey: string;
      let dateLabel: string;

      if (dateOnly.getTime() === today.getTime()) {
        dateKey = 'today';
        dateLabel = 'Bugün';
      } else if (dateOnly.getTime() === yesterday.getTime()) {
        dateKey = 'yesterday';
        dateLabel = 'Dün';
      } else {
        dateKey = dateOnly.toISOString().split('T')[0];
        dateLabel = date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { dateLabel, items: [] });
      }
      groups.get(dateKey)!.items.push(item);
    }

    return Array.from(groups.entries()).map(([dateKey, { dateLabel, items }]) => ({ dateKey, dateLabel, items }));
  })();

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const navHeight = navRef.current?.offsetHeight || 60;
      const y = el.getBoundingClientRect().top + window.scrollY - navHeight - 10;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['categories', ...TR_REPORT_CATEGORIES.map(c => `cat-${c.id}`), 'timeline', 'daily', 'weekly', 'monthly', 'quarterly', 'special', 'strategic'];
      const navHeight = navRef.current?.offsetHeight || 60;
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= navHeight + 20 && rect.bottom > navHeight + 20) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr">
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative" style={{ padding: '32px 0 0' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="glass-card" style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(0,229,255,.04), rgba(139,92,246,.03))' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>Rapor Merkezi</h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  Tüm piyasaları ve sektörleri kapsayan yapay zeka destekli kapsamlı raporlar ve analizler
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STICKY NAVIGATION BAR ═══ */}
      <div ref={navRef} className="sticky top-[60px] z-[100]" style={{ background: 'color-mix(in srgb, var(--bg) 95%, transparent)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--rim)' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="flex items-center gap-1 py-2 overflow-x-auto custom-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <NavButton label="Analiz" sectionId="categories" active={activeSection === 'categories'} onClick={scrollToSection} />
            {TR_REPORT_CATEGORIES.map(cat => (
              <NavButton key={cat.id} label={cat.nameTr} sectionId={`cat-${cat.id}`} active={activeSection === `cat-${cat.id}`} onClick={scrollToSection} icon={cat.icon} />
            ))}
            <div style={{ width: '1px', height: '20px', background: 'var(--rim)', margin: '0 4px', flexShrink: 0 }} />
            <NavButton label="Zaman Çizelgesi" sectionId="timeline" active={activeSection === 'timeline'} onClick={scrollToSection} />
            <NavButton label="Günlük" sectionId="daily" active={activeSection === 'daily'} onClick={scrollToSection} />
            <NavButton label="Haftalık" sectionId="weekly" active={activeSection === 'weekly'} onClick={scrollToSection} />
            <NavButton label="Aylık" sectionId="monthly" active={activeSection === 'monthly'} onClick={scrollToSection} />
            <NavButton label="Üç Aylık" sectionId="quarterly" active={activeSection === 'quarterly'} onClick={scrollToSection} />
            <NavButton label="Özel" sectionId="special" active={activeSection === 'special'} onClick={scrollToSection} />
            <NavButton label="Stratejik" sectionId="strategic" active={activeSection === 'strategic'} onClick={scrollToSection} />
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1280px] mx-auto py-6" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>

        {/* ─── CATEGORY FILTER TABS ─── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {TR_CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className="whitespace-nowrap text-[12px] px-4 py-2 rounded-lg transition-all flex-shrink-0"
                style={{
                  background: categoryFilter === cat.id ? 'var(--cyan2)' : 'var(--surface-2)',
                  borderBottom: categoryFilter === cat.id ? '2px solid var(--cyan)' : '2px solid transparent',
                  color: categoryFilter === cat.id ? 'var(--cyan)' : 'var(--text3)',
                  fontWeight: categoryFilter === cat.id ? 700 : 400,
                  borderLeft: categoryFilter === cat.id ? '1px solid rgba(0,229,255,.2)' : '1px solid var(--rim)',
                  borderRight: categoryFilter === cat.id ? '1px solid rgba(0,229,255,.2)' : '1px solid var(--rim)',
                  borderTop: categoryFilter === cat.id ? '1px solid rgba(0,229,255,.2)' : '1px solid var(--rim)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── CATEGORY ANALYSES SECTION ─── */}
        <div id="categories" style={{ scrollMarginTop: '120px' }}>
          <SectionHeader title="Piyasa Analizi" subtitle="Tüm sektörler ve varlıklar için güncel analizler" />
        </div>

        {categoryData
          .filter((catData) => categoryFilter === 'all' || catData.category === categoryFilter)
          .map((catData) => {
          const catDef = TR_REPORT_CATEGORIES.find(c => c.id === catData.category);
          if (!catDef) return null;
          return (
            <div key={catData.category} id={`cat-${catData.category}`} style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
              <CategorySection
                category={catDef}
                analizs={catData.analizs}
              />
            </div>
          );
        })}

        {/* ─── DIVIDER ─── */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--rim), var(--cyan), var(--rim), transparent)', margin: '40px 0' }} />

        {/* ─── REPORTS TIMELINE ─── */}
        <div id="timeline" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="Raporlar Zaman Çizelgesi" subtitle="Yayınlanan en son raporlar ve analizler, kronolojik olarak sıralanmış" badge="Zaman Çizelgesi" />
          {timelineItems.length === 0 ? (
            <div className="glass-card flex items-center justify-center" style={{ padding: '40px', minHeight: '120px' }}>
              <div className="text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Şu anda yayınlanmış rapor yok</p>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mb-5" style={{ borderBottom: '1px solid var(--rim)', paddingBottom: '12px' }}>
                {([
                  { key: 'all' as const, label: 'Tümü', count: timelineItems.length },
                  { key: 'report' as const, label: 'Raporlar', count: timelineItems.filter(i => i.type === 'report').length },
                  { key: 'analysis' as const, label: 'Analiz', count: timelineItems.filter(i => i.type === 'analysis').length },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setTimelineFilter(tab.key); setTimelineShowCount(10); }}
                    className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: timelineFilter === tab.key ? 'var(--cyan2)' : 'transparent',
                      border: `1px solid ${timelineFilter === tab.key ? 'rgba(0,229,255,.2)' : 'var(--rim)'}`,
                      color: timelineFilter === tab.key ? 'var(--cyan)' : 'var(--text3)',
                      fontWeight: timelineFilter === tab.key ? 600 : 400,
                    }}
                  >
                    {tab.label}
                    <span style={{
                      fontSize: '9px', fontWeight: 700,
                      background: timelineFilter === tab.key ? 'rgba(0,229,255,.12)' : 'var(--surface-2)',
                      color: timelineFilter === tab.key ? 'var(--cyan)' : 'var(--text4)',
                      padding: '1px 5px', borderRadius: '6px',
                      fontFamily: 'var(--font-jetbrains-mono)',
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Grouped Timeline by Date */}
              {filteredTimelineItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>Filtreye uyan öğe bulunamadı</p>
                </div>
              ) : (
                <>
                  {groupedTimelineItems.map(group => {
                    // Calculate visible items for this group
                    let globalIndex = 0;
                    let groupItems: TimelineItem[] = [];
                    for (const g of groupedTimelineItems) {
                      if (g.dateKey === group.dateKey) {
                        for (const item of g.items) {
                          if (globalIndex < timelineShowCount) {
                            groupItems.push(item);
                          }
                          globalIndex++;
                        }
                      } else {
                        globalIndex += g.items.length;
                      }
                    }

                    if (groupItems.length === 0) return null;

                    return (
                      <div key={group.dateKey} style={{ marginBottom: '20px' }}>
                        {/* Date Group Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{
                            fontSize: '11px', fontWeight: 700, color: 'var(--cyan)',
                            background: 'var(--cyan2)',
                            padding: '3px 10px', borderRadius: '6px',
                            border: '1px solid rgba(0,229,255,.12)',
                          }}>
                            {group.dateLabel}
                          </div>
                          <div style={{ flex: 1, height: '1px', background: 'var(--rim)' }} />
                          <span style={{ fontSize: '9px', color: 'var(--text4)', fontFamily: 'var(--font-jetbrains-mono)' }}>
                            {group.items.length} öğe
                          </span>
                        </div>

                        {/* Items within this date group */}
                        <div style={{ position: 'relative', paddingLeft: '20px' }}>
                          {/* Timeline line */}
                          <div style={{
                            position: 'absolute', left: '4px', top: '6px', bottom: '6px',
                            width: '2px',
                            background: 'linear-gradient(180deg, var(--cyan), rgba(139,92,246,.4), transparent)',
                            borderRadius: '1px',
                          }} />

                          {groupItems.map((item, i) => {
                            const date = new Date(item.publishedAt);
                            const timeLabel = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                            let badgeLabel = '';
                            let badgeBg = 'var(--cyan2)';
                            let badgeColor = 'var(--cyan)';
                            let badgeBorder = 'rgba(0,229,255,.15)';

                            if (item.type === 'report') {
                              badgeLabel = TYPE_LABELS[item.reportType || ''] || item.reportType || 'Rapor';
                            } else {
                              const catDef = TR_REPORT_CATEGORIES.find(c => c.id === item.assetClass);
                              badgeLabel = catDef?.nameTr || ASSET_CLASS_DISPLAY[item.assetClass || ''] || 'Analiz';
                              if (catDef) {
                                badgeBg = catDef.colorBg;
                                badgeColor = catDef.color;
                                badgeBorder = catDef.colorBorder;
                              }
                            }

                            const moodValue = item.type === 'report' ? item.marketImpact : item.sentiment;
                            const moodColor = moodValue === 'bullish' ? 'var(--bull)' : moodValue === 'bearish' ? 'var(--bear)' : 'var(--gold)';
                            const confColor = item.confidenceScore >= 70 ? 'var(--bull)' : item.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)';

                            return (
                              <Link
                                key={item.id}
                                href={`/tr/reports/${item.slug}`}
                                className="group flex items-start gap-2.5 transition-all duration-200 hover:translate-x-0.5"
                                style={{
                                  padding: '8px 10px 8px 0',
                                  borderRadius: '8px',
                                  marginBottom: '2px',
                                  textDecoration: 'none',
                                  background: 'transparent',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                {/* Timeline dot */}
                                <div style={{
                                  width: '10px', height: '10px', borderRadius: '50%',
                                  border: `2px solid ${i === 0 ? 'var(--cyan)' : 'var(--border)'}`,
                                  background: i === 0 ? 'var(--cyan2)' : 'var(--bg3)',
                                  position: 'relative', zIndex: 1, flexShrink: 0,
                                  marginTop: '5px',
                                  boxShadow: i === 0 ? '0 0 6px rgba(0,229,255,.3)' : 'none',
                                  transition: 'all 0.2s',
                                }} />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <span className="text-[8px] px-1.5 py-px rounded-full font-semibold" style={{
                                      background: badgeBg, color: badgeColor,
                                      border: `1px solid ${badgeBorder}`,
                                    }}>
                                      {badgeLabel}
                                    </span>
                                    {moodValue && (
                                      <span style={{
                                        fontSize: '8px', fontWeight: 700, color: moodColor,
                                        display: 'flex', alignItems: 'center', gap: '1px',
                                      }}>
                                        {moodValue === 'bullish' ? '▲' : moodValue === 'bearish' ? '▼' : '●'}
                                        {IMPACT_LABELS[moodValue] || SENTIMENT_LABELS[moodValue] || ''}
                                      </span>
                                    )}
                                    {/* Mini confidence progress bar */}
                                    <div className="flex items-center gap-1">
                                      <div style={{
                                        width: '32px', height: '3px', borderRadius: '2px',
                                        background: 'var(--surface-2)', overflow: 'hidden',
                                      }}>
                                        <div style={{
                                          width: `${item.confidenceScore}%`, height: '100%',
                                          borderRadius: '2px',
                                          background: confColor,
                                          transition: 'width 0.3s',
                                        }} />
                                      </div>
                                      <span style={{
                                        fontSize: '8px', fontFamily: 'var(--font-jetbrains-mono)',
                                        fontWeight: 700, color: confColor,
                                      }}>
                                        {item.confidenceScore}%
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '8px', color: 'var(--text4)', marginLeft: 'auto' }}>
                                      {timeLabel}
                                    </span>
                                  </div>
                                  <h4 className="text-[12px] font-semibold line-clamp-1 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                                    {sanitizeDisplayText(item.title)}
                                  </h4>
                                  {item.type === 'report' && item.summary && (
                                    <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: 'var(--text3)' }}>
                                      {item.summary}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Load More Button */}
                  {filteredTimelineItems.length > timelineShowCount && (
                    <div className="text-center pt-2" style={{ borderTop: '1px solid var(--rim)' }}>
                      <button
                        onClick={() => setTimelineShowCount(prev => prev + 10)}
                        className="text-[11px] px-5 py-2 rounded-lg transition-all"
                        style={{
                          color: 'var(--cyan)',
                          background: 'var(--cyan2)',
                          border: '1px solid rgba(0,229,255,.15)',
                          fontWeight: 500,
                        }}
                      >
                        Daha fazla yükle ({filteredTimelineItems.length - timelineShowCount} kaldı)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── DAILY REPORTS ─── */}
        <div id="daily" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="Günlük Özet" subtitle="Piyasanın temel olaylarını özetleyen kapsamlı günlük raporlar" badge="Günlük" />
          <PeriodReportGrid reports={dailyReports} emptyMessage="Şu anda günlük rapor mevcut değil" />
        </div>

        {/* ─── WEEKLY REPORTS ─── */}
        <div id="weekly" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="Haftalık Raporlar" subtitle="Hafta boyunca piyasa performansının derinlemesine analizi" badge="Haftalık" />
          <PeriodReportGrid reports={weeklyReports} emptyMessage="Şu anda haftalık rapor mevcut değil" />
        </div>

        {/* ─── MONTHLY REPORTS ─── */}
        <div id="monthly" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="Aylık Raporlar" subtitle="Ay boyunca ekonomi ve piyasaların kapsamlı genel görünümü" badge="Aylık" />
          <PeriodReportGrid reports={monthlyReports} emptyMessage="Şu anda aylık rapor mevcut değil" />
        </div>

        {/* ─── QUARTERLY REPORTS ─── */}
        <div id="quarterly" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="Üç Aylık Raporlar" subtitle="Performans ve beklentilerin kapsamlı incelemesi ile derinlemesine üç aylık raporlar" badge="Üç Aylık" />
          <PeriodReportGrid reports={quarterlyReports} emptyMessage="Şu anda üç aylık rapor mevcut değil" />
        </div>

        {/* ─── SPECIAL REPORTS ─── */}
        <div id="special" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="Özel Raporlar" subtitle="Büyük ekonomik olaylar ve istisnai gelişmeler için özel raporlar" badge="Özel" />
          <PeriodReportGrid reports={specialReports} emptyMessage="Şu anda özel rapor mevcut değil" />
        </div>

        {/* ─── STRATEGIC REPORTS (V314) ─── */}
        <div id="strategic" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="Stratejik Raporlar" subtitle="Senaryo modellemesi ve eyleme geçirilebilir önerilerle derinlemesine stratejik analiz" badge="Stratejik" />
          <PeriodReportGrid reports={strategicReports} emptyMessage="Şu anda stratejik rapor mevcut değil" />
        </div>
      </div>
    </main>
  );
}

// ─── Navigation Button ──────────────────────────────────────────

interface NavButtonProps {
  label: string; sectionId: string; active: boolean;
  onClick: (sectionId: string) => void; icon?: string;
}

function NavButton({ label, sectionId, active, onClick, icon }: NavButtonProps) {
  return (
    <button
      onClick={() => onClick(sectionId)}
      className="whitespace-nowrap text-[12px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0"
      style={{
        background: active ? 'var(--cyan2)' : 'transparent',
        border: `1px solid ${active ? 'rgba(0,229,255,.2)' : 'transparent'}`,
        color: active ? 'var(--cyan)' : 'var(--text3)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {icon && <span className="text-[13px]">{icon}</span>}
      {label}
    </button>
  );
}

// ─── Section Header ─────────────────────────────────────────────

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div style={{ width: '3px', height: '22px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 10px rgba(0,229,255,.3)' }} />
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-head)' }}>
            {title}
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,.15)' }}>{badge}</span>
            )}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Category Section ──────────────────────────────────────────

function CategorySection({ category, analizs }: {
  category: typeof TR_REPORT_CATEGORIES[number];
  analizs: Analysis[];
}) {
  const featured = analizs[0];
  const smallCards = analizs.slice(1, 5);
  const hasMore = analizs.length > 5;

  return (
    <div className="mb-2">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: category.colorBg, border: `1px solid ${category.colorBorder}`,
            fontSize: '16px',
          }}>
            {category.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{category.nameTr}</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
            background: category.colorBg, color: category.color,
            border: `1px solid ${category.colorBorder}`,
          }}>
            {analizs.length} {analizs.length === 1 ? 'analiz' : 'analizs'}
          </span>
        </div>
        {hasMore && (
          <Link href={`/tr/reports/category/${category.id}`} className="text-[11px] px-3 py-1 rounded-lg transition-all" style={{ color: 'var(--cyan)', background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.12)' }}>
            Tümünü gör
          </Link>
        )}
      </div>

      {analizs.length === 0 ? (
        <div className="glass-card flex items-center justify-center" style={{ padding: '32px', minHeight: '120px' }}>
          <div className="text-center">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{category.icon}</div>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Şu anda bu bölümde analiz yok</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text4)' }}>Analizler yapay zeka tarafından otomatik olarak oluşturulur</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Big Featured Card */}
          {featured && (
            <Link href={`/tr/reports/${featured.slug}`} className="lg:col-span-1 glass-card group transition-all duration-300 hover:-translate-y-1" style={{
              padding: '20px',
              borderLeft: `3px solid ${category.color}`,
              background: `linear-gradient(135deg, ${category.colorBg}, var(--surface-1))`,
            }}>
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                  background: category.colorBg, color: category.color,
                  border: `1px solid ${category.colorBorder}`,
                }}>{category.nameTr}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,.12)' }}>
                  {TIMEFRAME_LABELS[featured.timeFrame] || featured.timeFrame}
                </span>
                {featured.sentiment && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                    background: featured.sentiment === 'bullish' ? 'var(--bull2)' : featured.sentiment === 'bearish' ? 'var(--bear2)' : 'var(--gold2)',
                    color: IMPACT_COLORS[featured.sentiment] || 'var(--gold)',
                    border: `1px solid ${featured.sentiment === 'bullish' ? 'rgba(34,197,94,.2)' : featured.sentiment === 'bearish' ? 'rgba(239,68,80,.2)' : 'rgba(255,184,0,.2)'}`,
                  }}>
                    {SENTIMENT_LABELS[featured.sentiment] || featured.sentiment}
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-[14px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                {featured.title}
              </h4>

              {/* Confidence */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: '9px', color: 'var(--text3)' }}>Güven</span>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: featured.confidenceScore >= 70 ? 'var(--bull)' : featured.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)' }}>
                      {featured.confidenceScore}%
                    </span>
                  </div>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{
                      width: `${featured.confidenceScore}%`,
                      background: featured.confidenceScore >= 70 ? 'var(--bull)' : featured.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)',
                    }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold" style={{
                  color: featured.riskLevel === 'low' ? 'var(--bull)' : featured.riskLevel === 'high' ? 'var(--bear)' : 'var(--gold)',
                }}>
                  {RISK_LABELS[featured.riskLevel] || featured.riskLevel} Risk
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--rim, var(--border))' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                  {featured.publishedAt ? formatTimeAgoLocale(featured.publishedAt, 'en') : ''}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text3)' }} className="group-hover:text-[var(--cyan)] transition-colors flex items-center gap-1">
                  Read Analysis
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </span>
              </div>
            </Link>
          )}

          {/* Small Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {smallCards.map((a) => (
              <Link key={a.id} href={`/tr/reports/${a.slug}`} className="glass-card group transition-all duration-300 hover:-translate-y-0.5" style={{
                padding: '14px',
                borderLeft: `2px solid ${category.color}`,
                background: `linear-gradient(135deg, ${category.colorBg}, var(--surface-1))`,
              }}>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[8px] px-1.5 py-px rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,.1)' }}>
                    {TIMEFRAME_LABELS[a.timeFrame] || a.timeFrame}
                  </span>
                  {a.sentiment && (
                    <span className="text-[8px] px-1.5 py-px rounded-full font-semibold" style={{
                      background: a.sentiment === 'bullish' ? 'var(--bull2)' : a.sentiment === 'bearish' ? 'var(--bear2)' : 'var(--gold2)',
                      color: IMPACT_COLORS[a.sentiment] || 'var(--gold)',
                    }}>
                      {SENTIMENT_LABELS[a.sentiment] || a.sentiment}
                    </span>
                  )}
                </div>
                <h4 className="text-[12px] font-semibold mb-1 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                  {a.title}
                </h4>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '9px', color: 'var(--text3)' }}>
                    {a.publishedAt ? formatTimeAgoLocale(a.publishedAt, 'en') : ''}
                  </span>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: a.confidenceScore >= 70 ? 'var(--bull)' : a.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)' }}>
                    {a.confidenceScore}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Period Report Grid ────────────────────────────────────────

function PeriodReportGrid({ reports, emptyMessage }: { reports: Report[]; emptyMessage: string }) {
  if (reports.length === 0) {
    return (
      <div className="glass-card flex items-center justify-center" style={{ padding: '32px', minHeight: '120px' }}>
        <div className="text-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>{emptyMessage}</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text4)' }}>Les rapports sont générés automatiquement par l'IA</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {reports.map(report => (
        <Link
          key={report.id}
          href={`/tr/reports/${report.slug}`}
          className="glass-card group transition-all duration-300 hover:-translate-y-0.5"
          style={{
            padding: '16px',
            borderLeft: '2px solid var(--cyan)',
            textDecoration: 'none',
          }}
        >
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: 'var(--text3)' }}>
            <span className="px-2 py-0.5 rounded-full" style={{
              background: 'rgba(0,212,255,0.12)',
              color: 'var(--cyan, #00d4ff)',
              fontSize: '9px',
            }}>
              {TYPE_LABELS[report.reportType] || report.reportType}
            </span>
            {report.publishedAt && (
              <span style={{ fontSize: '9px' }}>
                {formatTimeAgoLocale(report.publishedAt, 'en')}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-[13px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
            {report.title}
          </h4>

          {/* Summary */}
          {report.summary && (
            <p className="text-[11px] mb-3 line-clamp-2" style={{ color: 'var(--text2)', lineHeight: '1.7' }}>
              {report.summary.slice(0, 120)}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--rim, var(--border))' }}>
            <div className="flex items-center gap-2">
              {report.marketImpact && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                  background: report.marketImpact === 'bullish' ? 'var(--bull2)' : report.marketImpact === 'bearish' ? 'var(--bear2)' : 'var(--gold2)',
                  color: IMPACT_COLORS[report.marketImpact] || 'var(--gold)',
                }}>
                  {IMPACT_LABELS[report.marketImpact] || report.marketImpact}
                </span>
              )}
              {report.confidenceScore > 0 && (
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)' }}>
                  {report.confidenceScore}%
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text3)' }} className="group-hover:text-[var(--cyan)] transition-colors flex items-center gap-1">
              Read
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
