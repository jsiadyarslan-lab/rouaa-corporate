'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SubscribeForm from '@/components/rouaa/SubscribeForm';
import { sanitizeDisplayText } from '@/lib/clean-markdown';

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

// V68: Timeline item combining reports and analyses
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
  analyses: Analysis[];
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

// ─── Category Definitions ───────────────────────────────────────

const REPORT_CATEGORIES = [
  { id: 'economy', nameAr: 'اقتصاد كلي', nameEn: 'Macro Economy', icon: '🏛️', color: '#FF6B85', colorBg: 'rgba(239,83,80,.12)', colorBorder: 'rgba(239,83,80,.22)' },
  { id: 'forex', nameAr: 'عملات', nameEn: 'Currencies', icon: '💱', color: '#3BA7F0', colorBg: 'rgba(59,167,240,.14)', colorBorder: 'rgba(59,167,240,.3)' },
  { id: 'crypto', nameAr: 'كريبتو', nameEn: 'Crypto', icon: '₿', color: '#A78BFA', colorBg: 'rgba(139,92,246,.14)', colorBorder: 'rgba(139,92,246,.3)' },
  { id: 'energy', nameAr: 'طاقة', nameEn: 'Energy', icon: '⚡', color: '#E8824A', colorBg: 'rgba(232,130,74,.16)', colorBorder: 'rgba(232,130,74,.3)' },
  { id: 'commodities', nameAr: 'سلع', nameEn: 'Commodities', icon: '🥇', color: '#F0A500', colorBg: 'rgba(240,165,0,.18)', colorBorder: 'rgba(240,165,0,.35)' },
  { id: 'realEstate', nameAr: 'عقارات', nameEn: 'Real Estate', icon: '🏗️', color: '#4CC38A', colorBg: 'rgba(76,195,138,.14)', colorBorder: 'rgba(76,195,138,.3)' },
  { id: 'banking', nameAr: 'بنوك', nameEn: 'Banks', icon: '🏦', color: '#94A3B8', colorBg: 'rgba(100,116,139,.12)', colorBorder: 'rgba(100,116,139,.2)' },
  { id: 'stocks', nameAr: 'أسهم', nameEn: 'Stocks', icon: '📈', color: '#5B8DEF', colorBg: 'rgba(91,141,239,.14)', colorBorder: 'rgba(91,141,239,.3)' },
  { id: 'bonds', nameAr: 'سندات', nameEn: 'Bonds', icon: '📜', color: '#8B5CF6', colorBg: 'rgba(139,92,246,.12)', colorBorder: 'rgba(139,92,246,.25)' },
  { id: 'technicalAnalysis', nameAr: 'تحليلات فنية', nameEn: 'Technical Analysis', icon: '📊', color: '#06B6D4', colorBg: 'rgba(6,182,212,.14)', colorBorder: 'rgba(6,182,212,.3)' },
  { id: 'arabMarkets', nameAr: 'أسواق عربية', nameEn: 'Arab Markets', icon: '🕌', color: '#00C9A7', colorBg: 'rgba(0,201,167,.12)', colorBorder: 'rgba(0,201,167,.25)' },
  { id: 'earnings', nameAr: 'أرباح الشركات', nameEn: 'Corporate Earnings', icon: '💰', color: '#FFB800', colorBg: 'rgba(255,184,0,.12)', colorBorder: 'rgba(255,184,0,.25)' },
] as const;

const TYPE_LABELS: Record<string, string> = {
  daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري', quarterly: 'ربع سنوي', special: 'خاص', analysis: 'تحليل',
};
const IMPACT_LABELS: Record<string, string> = {
  bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد',
};
const IMPACT_COLORS: Record<string, string> = {
  bullish: 'var(--bull)', bearish: 'var(--bear)', neutral: 'var(--gold)',
};
const SENTIMENT_LABELS: Record<string, string> = {
  bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد',
};
const RISK_LABELS: Record<string, string> = {
  low: 'منخفض', medium: 'متوسط', high: 'مرتفع', extreme: 'شديد',
};
const TIMEFRAME_LABELS: Record<string, string> = {
  intraday: 'داخل اليوم', daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري', quarterly: 'ربع سنوي',
};

// V68: Asset class display names for timeline
const ASSET_CLASS_DISPLAY: Record<string, string> = {
  economy: 'اقتصاد كلي', forex: 'عملات', crypto: 'كريبتو', energy: 'طاقة',
  commodities: 'سلع', realEstate: 'عقارات', banking: 'بنوك', stocks: 'أسهم', bonds: 'سندات',
  technicalAnalysis: 'تحليلات فنية', arabMarkets: 'أسواق عربية', earnings: 'أرباح الشركات',
};

// ─── Clean JSON from summary text ────────────────────────────────
// V202: Also strips #/## markdown headings from summary
function cleanSummary(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/```(?:json)?\s*/gi, '');
  // V202: Strip #/## markdown headings from summary
  cleaned = cleaned.replace(/^\s*[\u200F\u200E]*#{1,2}(?!#)\s*.*$/gm, '');
  cleaned = cleaned.replace(/#{1,2}(?!#)\s*(?:\d+[\.\s]*)?[\u0600-\u06FF]/g, m => m.replace(/#{1,2}\s*(?:\d+[\.\s]*)?/, ''));
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
          // V202: Strip markdown from extracted text too
          let result = textParts.slice(0, 2).join('. ');
          result = result.replace(/^\s*[\u200F\u200E]*#{1,2}(?!#)\s*.*$/gm, '');
          result = result.replace(/#{1,2}(?!#)\s*(?:\d+[\.\s]*)?[\u0600-\u06FF]/g, m => m.replace(/#{1,2}\s*(?:\d+[\.\s]*)?/, ''));
          return result;
        }
      }
    } catch { /* not JSON */ }
  }
  return sanitizeDisplayText(cleaned.slice(0, 200));
}

// ─── Main Component ─────────────────────────────────────────────

// ─── Category Filter Definitions (Arabic) ──────────────────────
const AR_CATEGORY_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'economy', label: 'اقتصاد كلي' },
  { id: 'forex', label: 'فوركس' },
  { id: 'crypto', label: 'عملات رقمية' },
  { id: 'energy', label: 'طاقة' },
  { id: 'commodities', label: 'سلع' },
  { id: 'realEstate', label: 'عقارات' },
  { id: 'banking', label: 'بنوك' },
  { id: 'stocks', label: 'أسهم' },
  { id: 'earnings', label: 'أرباح' },
];

export default function ReportsPageClient({ initialCategoryData, initialDaily, initialWeekly, initialMonthly, initialQuarterly, initialSpecial, initialStrategic }: Props) {
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

  // V68: Build timeline items from all reports and analyses
  const timelineItems: TimelineItem[] = (() => {
    const items: TimelineItem[] = [];
    // Add all reports
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
    // Add all analyses
    for (const catData of categoryData) {
      for (const a of catData.analyses) {
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
    // Sort by publishedAt descending
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return items;
  })();

  // V69: Filtered timeline items
  const filteredTimelineItems = timelineFilter === 'all'
    ? timelineItems
    : timelineItems.filter(item => item.type === timelineFilter);

  // V69: Group timeline items by date
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
        dateLabel = 'اليوم';
      } else if (dateOnly.getTime() === yesterday.getTime()) {
        dateKey = 'yesterday';
        dateLabel = 'أمس';
      } else {
        dateKey = dateOnly.toISOString().split('T')[0];
        dateLabel = date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
      const sections = ['categories', ...REPORT_CATEGORIES.map(c => `cat-${c.id}`), 'timeline', 'daily', 'weekly', 'monthly', 'quarterly', 'special', 'strategic'];
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
    <main className="min-h-screen pb-mobile-safe">
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
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-head)' }}>مركز التقارير</h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  تقارير وتحليلات شاملة مدعومة بالذكاء الاصطناعي تغطي جميع الأسواق والقطاعات
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/reports/search" className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-all" style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.15)', color: 'var(--cyan)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  بحث متقدم
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STICKY NAVIGATION BAR ═══ */}
      <div ref={navRef} className="sticky top-[60px] z-[100]" style={{ background: 'color-mix(in srgb, var(--bg) 95%, transparent)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--rim)' }}>
        <div className="max-w-[1280px] mx-auto" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>
          <div className="flex items-center gap-1 py-2 overflow-x-auto custom-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <NavButton label="التحليلات" sectionId="categories" active={activeSection === 'categories'} onClick={scrollToSection} />
            {REPORT_CATEGORIES.map(cat => (
              <NavButton key={cat.id} label={cat.nameAr} sectionId={`cat-${cat.id}`} active={activeSection === `cat-${cat.id}`} onClick={scrollToSection} icon={cat.icon} />
            ))}
            <div style={{ width: '1px', height: '20px', background: 'var(--rim)', margin: '0 4px', flexShrink: 0 }} />
            <NavButton label="خط زمني" sectionId="timeline" active={activeSection === 'timeline'} onClick={scrollToSection} />
            <NavButton label="يومي" sectionId="daily" active={activeSection === 'daily'} onClick={scrollToSection} />
            <NavButton label="أسبوعي" sectionId="weekly" active={activeSection === 'weekly'} onClick={scrollToSection} />
            <NavButton label="شهري" sectionId="monthly" active={activeSection === 'monthly'} onClick={scrollToSection} />
            <NavButton label="ربع سنوي" sectionId="quarterly" active={activeSection === 'quarterly'} onClick={scrollToSection} />
            <NavButton label="خاص" sectionId="special" active={activeSection === 'special'} onClick={scrollToSection} />
            <NavButton label="استراتيجي" sectionId="strategic" active={activeSection === 'strategic'} onClick={scrollToSection} />
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1280px] mx-auto py-6" style={{ paddingInline: 'clamp(16px, 3vw, 48px)' }}>

        {/* ─── CATEGORY FILTER TABS ─── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {AR_CATEGORY_FILTERS.map((cat) => (
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
          <SectionHeader title="تحليلات الأسواق" subtitle="تحليلات محدثة لكل القطاعات والأصول" />
        </div>

        {categoryData
          .filter((catData) => categoryFilter === 'all' || catData.category === categoryFilter)
          .map((catData) => {
          const catDef = REPORT_CATEGORIES.find(c => c.id === catData.category);
          if (!catDef) return null;
          return (
            <div key={catData.category} id={`cat-${catData.category}`} style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
              <CategorySection
                category={catDef}
                analyses={catData.analyses}
              />
            </div>
          );
        })}

        {/* ─── DIVIDER ─── */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--rim), var(--cyan), var(--rim), transparent)', margin: '40px 0' }} />

        {/* ─── V69: ENHANCED REPORTS TIMELINE WIDGET ─── */}
        <div id="timeline" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="خط زمني للتقارير" subtitle="آخر التقارير والتحليلات المنشورة مرتبة زمنياً" badge="زمني" />
          {timelineItems.length === 0 ? (
            <div className="glass-card flex items-center justify-center" style={{ padding: '40px', minHeight: '120px' }}>
              <div className="text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>لا توجد تقارير منشورة حالياً</p>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              {/* V69: Filter Tabs */}
              <div className="flex items-center gap-2 mb-5" style={{ borderBottom: '1px solid var(--rim)', paddingBottom: '12px' }}>
                {([
                  { key: 'all' as const, label: 'الكل', count: timelineItems.length },
                  { key: 'report' as const, label: 'تقارير', count: timelineItems.filter(i => i.type === 'report').length },
                  { key: 'analysis' as const, label: 'تحليلات', count: timelineItems.filter(i => i.type === 'analysis').length },
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

              {/* V69: Grouped Timeline by Date */}
              {filteredTimelineItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>لا توجد عناصر مطابقة للفلتر</p>
                </div>
              ) : (
                <>
                  {groupedTimelineItems.map(group => {
                    const visibleItems = group.items.slice(0, timelineShowCount);
                    const totalVisibleSoFar = groupedTimelineItems
                      .flatMap(g => g.items)
                      .filter((_, idx) => idx < timelineShowCount);

                    // Only show items that fall within the timelineShowCount window
                    let runningCount = 0;
                    const itemsToShow: TimelineItem[] = [];
                    for (const g of groupedTimelineItems) {
                      if (g.dateKey !== group.dateKey) {
                        runningCount += g.items.length;
                        continue;
                      }
                      for (const item of g.items) {
                        if (runningCount + itemsToShow.length < timelineShowCount) {
                          itemsToShow.push(item);
                        }
                      }
                      break;
                    }

                    // Recalculate visible items for this group properly
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
                            {group.items.length} عنصر
                          </span>
                        </div>

                        {/* Items within this date group */}
                        <div style={{ position: 'relative', paddingRight: '20px' }}>
                          {/* Timeline line for this group */}
                          <div style={{
                            position: 'absolute', right: '4px', top: '6px', bottom: '6px',
                            width: '2px',
                            background: 'linear-gradient(180deg, var(--cyan), rgba(139,92,246,.4), transparent)',
                            borderRadius: '1px',
                          }} />

                          {groupItems.map((item, i) => {
                            const date = new Date(item.publishedAt);
                            const timeLabel = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

                            // Determine badge info
                            let badgeLabel = '';
                            let badgeBg = 'var(--cyan2)';
                            let badgeColor = 'var(--cyan)';
                            let badgeBorder = 'rgba(0,229,255,.15)';

                            if (item.type === 'report') {
                              badgeLabel = TYPE_LABELS[item.reportType || ''] || item.reportType || 'تقرير';
                            } else {
                              const catDef = REPORT_CATEGORIES.find(c => c.id === item.assetClass);
                              badgeLabel = catDef?.nameAr || ASSET_CLASS_DISPLAY[item.assetClass || ''] || 'تحليل';
                              if (catDef) {
                                badgeBg = catDef.colorBg;
                                badgeColor = catDef.color;
                                badgeBorder = catDef.colorBorder;
                              }
                            }

                            // Sentiment/impact color
                            const moodValue = item.type === 'report' ? item.marketImpact : item.sentiment;
                            const moodColor = moodValue === 'bullish' ? 'var(--bull)' : moodValue === 'bearish' ? 'var(--bear)' : 'var(--gold)';
                            const confColor = item.confidenceScore >= 70 ? 'var(--bull)' : item.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)';

                            return (
                              <Link
                                key={item.id}
                                href={`/reports/${item.slug}`}
                                className="group flex items-start gap-2.5 transition-all duration-200 hover:-translate-x-0.5"
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
                                {/* V69: Smaller timeline dot (10px) */}
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
                                    {/* V69: Mini confidence progress bar */}
                                    <div className="flex items-center gap-1" style={{ direction: 'ltr' }}>
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
                                    <span style={{ fontSize: '8px', color: 'var(--text4)', marginRight: 'auto' }}>
                                      {timeLabel}
                                    </span>
                                  </div>
                                  <h4 className="text-[12px] font-semibold line-clamp-1 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                                    {sanitizeDisplayText(item.title)}
                                  </h4>
                                  {/* V69: Summary snippet for reports */}
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

                  {/* V69: Load More Button */}
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
                        عرض المزيد ({filteredTimelineItems.length - timelineShowCount} متبقي)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── DAILY SUMMARY ─── */}
        <div id="daily" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="ملخص يومي" subtitle="تقارير يومية شاملة تلخص أهم أحداث السوق" badge="يومي" />
          <PeriodReportGrid reports={dailyReports} emptyMessage="لا توجد تقارير يومية حالياً" />
        </div>

        {/* ─── WEEKLY REPORTS ─── */}
        <div id="weekly" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="تقارير أسبوعية" subtitle="تحليلات معمقة لأداء الأسواق خلال الأسبوع" badge="أسبوعي" />
          <PeriodReportGrid reports={weeklyReports} emptyMessage="لا توجد تقارير أسبوعية حالياً" />
        </div>

        {/* ─── MONTHLY REPORTS ─── */}
        <div id="monthly" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="تقارير شهرية" subtitle="نظرة شاملة على الاقتصاد والأسواق خلال الشهر" badge="شهري" />
          <PeriodReportGrid reports={monthlyReports} emptyMessage="لا توجد تقارير شهرية حالياً" />
        </div>

        {/* ─── QUARTERLY REPORTS ─── */}
        <div id="quarterly" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="تقارير ربع سنوية" subtitle="تقارير فصلية معمقة تتضمن مراجعة شاملة للأداء والتوقعات" badge="ربع سنوي" />
          <PeriodReportGrid reports={quarterlyReports} emptyMessage="لا توجد تقارير ربع سنوية حالياً" />
        </div>

        {/* ─── SPECIAL REPORTS ─── */}
        <div id="special" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="تقارير خاصة" subtitle="تقارير مخصصة للأحداث الاقتصادية الكبرى والتطورات الاستثنائية" badge="خاص" />
          <PeriodReportGrid reports={specialReports} emptyMessage="لا توجد تقارير خاصة حالياً" />
        </div>

        {/* ─── STRATEGIC REPORTS (V314) ─── */}
        <div id="strategic" style={{ scrollMarginTop: '120px', marginBottom: '32px' }}>
          <SectionHeader title="تقارير استراتيجية" subtitle="تحليلات استراتيجية معمقة مع نمذجة السيناريوهات وتوصيات تنفيذية" badge="استراتيجي" />
          <PeriodReportGrid reports={strategicReports} emptyMessage="لا توجد تقارير استراتيجية حالياً" />
        </div>

        {/* ─── NEWSLETTER ─── */}
        <div className="max-w-[800px] mx-auto mt-10">
          <div className="glass-card" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(0,229,255,.03), rgba(139,92,246,.02))' }}>
            <div className="flex items-center gap-3 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>النشرة البريدية</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>اشترك لتلقي أحدث التقارير والتحليلات مباشرة في بريدك الإلكتروني</p>
            <SubscribeForm />
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Navigation Button ──────────────────────────────────────────

function NavButton({ label, sectionId, active, onClick, icon }: {
  label: string; sectionId: string; active: boolean;
  onClick: (id: string) => void; icon?: string;
}) {
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

// ─── Category Section (1 Big Card + Small Cards + More) ──────

function CategorySection({ category, analyses }: {
  category: typeof REPORT_CATEGORIES[number];
  analyses: Analysis[];
}) {
  const featured = analyses[0];
  const smallCards = analyses.slice(1, 5);
  // hasMore: true if we have more than 5 analyses (we fetch 6, so 6 means there could be more)
  const hasMore = analyses.length > 5;

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
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>{category.nameAr}</h3>
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{category.nameEn}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
            background: category.colorBg, color: category.color,
            border: `1px solid ${category.colorBorder}`,
          }}>
            {analyses.length} تحليل
          </span>
        </div>
        {hasMore && (
          <Link href={`/reports/category/${category.id}`} className="text-[11px] px-3 py-1 rounded-lg transition-all" style={{ color: 'var(--cyan)', background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,.12)' }}>
            المزيد
          </Link>
        )}
      </div>

      {analyses.length === 0 ? (
        <div className="glass-card flex items-center justify-center" style={{ padding: '32px', minHeight: '120px' }}>
          <div className="text-center">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{category.icon}</div>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>لا توجد تحليلات في هذا القسم حالياً</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text4)' }}>يتم إنشاء التحليلات تلقائياً بواسطة الذكاء الاصطناعي</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Big Featured Card */}
          {featured && (
            <Link href={`/reports/${featured.slug}`} className="lg:col-span-1 glass-card group transition-all duration-300 hover:-translate-y-1" style={{
              padding: '20px',
              borderInlineStart: `3px solid ${category.color}`,
              background: `linear-gradient(135deg, ${category.colorBg}, var(--surface-1))`,
            }}>
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                  background: category.colorBg, color: category.color,
                  border: `1px solid ${category.colorBorder}`,
                }}>{category.nameAr}</span>
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
              <h4 className="text-[15px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                {sanitizeDisplayText(featured.title)}
              </h4>

              {/* Confidence & Risk */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: '10px', color: 'var(--text3)' }}>مستوى الثقة</span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: featured.confidenceScore >= 70 ? 'var(--bull)' : featured.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)' }}>
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
                <div className="text-center" style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '2px' }}>المخاطرة</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: featured.riskLevel === 'low' ? 'var(--bull)' : featured.riskLevel === 'high' || featured.riskLevel === 'extreme' ? 'var(--bear)' : 'var(--gold)' }}>
                    {RISK_LABELS[featured.riskLevel] || featured.riskLevel}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--rim)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                  {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text3)' }} className="group-hover:text-[var(--cyan)] transition-colors flex items-center gap-1">
                  اقرأ التقرير
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </span>
              </div>
            </Link>
          )}

          {/* 4 Small Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {smallCards.map((analysis) => (
              <SmallAnalysisCard key={analysis.id} analysis={analysis} category={category} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small Analysis Card ────────────────────────────────────────

function SmallAnalysisCard({ analysis, category }: { analysis: Analysis; category: typeof REPORT_CATEGORIES[number] }) {
  return (
    <Link href={`/reports/${analysis.slug}`} className="glass-card group transition-all duration-200 hover:-translate-y-0.5" style={{ padding: '12px 14px' }}>
      <div className="flex items-start gap-2.5">
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: category.colorBg, border: `1px solid ${category.colorBorder}`,
          fontSize: '13px', flexShrink: 0, marginTop: '2px',
        }}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-[12px] font-semibold line-clamp-1 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
            {sanitizeDisplayText(analysis.title)}
          </h5>
          <div className="flex items-center gap-2 mt-1.5">
            {analysis.sentiment && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                background: analysis.sentiment === 'bullish' ? 'var(--bull2)' : analysis.sentiment === 'bearish' ? 'var(--bear2)' : 'var(--gold2)',
                color: IMPACT_COLORS[analysis.sentiment] || 'var(--gold)',
              }}>
                {SENTIMENT_LABELS[analysis.sentiment] || analysis.sentiment}
              </span>
            )}
            <span className="text-[9px]" style={{ color: 'var(--text3)' }}>
              {analysis.confidenceScore}%
            </span>
            <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
              {analysis.publishedAt ? new Date(analysis.publishedAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : ''}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text4)', marginRight: 'auto' }} className="group-hover:text-[var(--cyan)] transition-colors flex items-center gap-0.5">
              اقرأ المزيد
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Period Report Grid (Daily/Weekly/Monthly/Quarterly/Special) ─

function PeriodReportGrid({ reports, emptyMessage }: { reports: Report[]; emptyMessage: string }) {
  if (reports.length === 0) {
    return (
      <div className="glass-card flex items-center justify-center" style={{ padding: '32px', minHeight: '120px' }}>
        <div className="text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {reports.map(report => {
        const typeLabel = TYPE_LABELS[report.reportType] || report.reportType || 'تقرير';
        const typeColor = report.reportType === 'daily' ? 'var(--bull)' : report.reportType === 'weekly' ? 'var(--cyan)' : report.reportType === 'monthly' ? 'var(--purple)' : report.reportType === 'quarterly' ? 'var(--gold)' : 'var(--orange)';
        const confColor = report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)';
        const pubDate = report.publishedAt ? new Date(report.publishedAt) : null;
        const dateLabel = pubDate ? pubDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        const readingTime = report.summary ? Math.max(1, Math.ceil(report.summary.split(/\s+/).length / 200)) : 3;
        const impactLabel = IMPACT_LABELS[report.marketImpact] || '';
        const impactColor = IMPACT_COLORS[report.marketImpact] || 'var(--gold)';
        const summaryClean = report.summary ? cleanSummary(report.summary) : '';

        return (
          <Link
            key={report.id}
            href={`/reports/${report.slug}`}
            className="glass-card group transition-all duration-300 hover:-translate-y-1 block"
            style={{ padding: '0', overflow: 'hidden', textDecoration: 'none' }}
          >
            {/* Image/Icon Area */}
            <div className="relative" style={{ height: '140px', overflow: 'hidden' }}>
              {report.imageUrl ? (
                <img
                  src={report.imageUrl}
                  alt={report.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  className="group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: `linear-gradient(135deg, ${typeColor}22, var(--surface-1))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={`${typeColor}66`} strokeWidth="1.5" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
              )}
              {/* Type badge overlay */}
              <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{
                  background: `${typeColor}cc`, color: '#fff',
                  backdropFilter: 'blur(8px)',
                }}>
                  {typeLabel}
                </span>
              </div>
              {/* Impact indicator overlay */}
              {impactLabel && (
                <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{
                    background: `${impactColor}cc`, color: '#fff',
                    backdropFilter: 'blur(8px)',
                  }}>
                    {impactLabel}
                  </span>
                </div>
              )}
              {/* Gradient overlay for text readability */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, var(--surface-1), transparent)' }} />
            </div>

            {/* Content */}
            <div style={{ padding: '16px 20px' }}>
              {/* Title */}
              <h4 className="text-[14px] font-bold mb-2 line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)', lineHeight: '1.7' }}>
                {sanitizeDisplayText(report.title)}
              </h4>

              {/* Summary */}
              {summaryClean && (
                <p className="text-[11px] mb-3 line-clamp-2" style={{ color: 'var(--text2)', lineHeight: '1.8' }}>
                  {summaryClean}
                </p>
              )}

              {/* Footer: Date, Reading Time, Read More */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--rim)' }}>
                <div className="flex items-center gap-2">
                  {dateLabel && (
                    <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{dateLabel}</span>
                  )}
                  <span style={{ fontSize: '9px', color: 'var(--text4)' }}>•</span>
                  <span className="flex items-center gap-1" style={{ fontSize: '9px', color: 'var(--text4)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {readingTime} دق
                  </span>
                  {/* Confidence mini bar */}
                  <div className="flex items-center gap-1" style={{ direction: 'ltr' }}>
                    <div style={{ width: '24px', height: '3px', borderRadius: '2px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ width: `${report.confidenceScore}%`, height: '100%', borderRadius: '2px', background: confColor }} />
                    </div>
                    <span style={{ fontSize: '8px', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: confColor }}>
                      {report.confidenceScore}%
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text3)' }} className="group-hover:text-[var(--cyan)] transition-colors flex items-center gap-1">
                  اقرأ المزيد
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
