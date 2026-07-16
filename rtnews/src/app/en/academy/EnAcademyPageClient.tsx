'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { lessons, financialTerms, academyCategories } from '@/data/mock-data';
import type { TermItem } from '@/data/mock-data';
import {
  translateAcademyCategory,
  translateLessonDuration,
  translateLessonTitle,
  translateTermFull,
  translateTermDescription,
} from '@/data/mock-data';

const LOCALE = 'en' as const;

/* ── Category map for terms ── */
const TERM_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fed', label: 'Fed' },
  { id: 'macro', label: 'Macro' },
  { id: 'forex', label: 'Currencies' },
  { id: 'market', label: 'Markets' },
  { id: 'technical', label: 'Technical' },
  { id: 'fundamental', label: 'Fundamental' },
  { id: 'risk', label: 'Risk' },
];

/* ── Impact table data for terms ── */
const TERM_IMPACTS: Record<string, { pair: string; level: 'high' | 'medium' | 'low'; direction: string }[]> = {
  NFP: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse to USD' },
    { pair: 'GBP/USD', level: 'high', direction: 'Inverse to USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct with USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverse to USD' },
  ],
  CPI: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse to USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct with USD' },
    { pair: 'XAU/USD', level: 'medium', direction: 'Direct with inflation' },
  ],
  FOMC: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse to USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct with USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverse to USD' },
    { pair: 'SPX', level: 'high', direction: 'Depends on tone' },
  ],
  GDP: [
    { pair: 'EUR/USD', level: 'medium', direction: 'Inverse to USD' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Direct with USD' },
  ],
  DXY: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverse' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct' },
  ],
  PMI: [
    { pair: 'EUR/USD', level: 'medium', direction: 'Depends on data' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Depends on data' },
  ],
  VIX: [
    { pair: 'SPX', level: 'high', direction: 'Inverse' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Inverse' },
    { pair: 'XAU/USD', level: 'medium', direction: 'Direct' },
  ],
};

/* ── Level badge helper ── */
function levelBadge(level: string) {
  if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)', label: 'Beginner' };
  if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)', label: 'Intermediate' };
  return { bg: 'var(--bear2)', color: 'var(--bear)', label: 'Advanced' };
}

/* ── Category color helper ── */
function categoryColor(cat: string) {
  switch (cat) {
    case 'fed': return '#FF4444';
    case 'macro': return '#FFB800';
    case 'forex': return '#00E5FF';
    case 'market': return '#4CAF50';
    case 'technical': return '#7B5EA7';
    case 'fundamental': return '#FF8C00';
    case 'risk': return '#FF4444';
    default: return '#00E5FF';
  }
}

function categoryLabel(cat: string) {
  const found = TERM_CATEGORIES.find(c => c.id === cat);
  return found ? found.label : cat;
}

/* ── Impact level badge ── */
function impactBadge(level: 'high' | 'medium' | 'low') {
  if (level === 'high') return { color: '#FF4444', label: 'High' };
  if (level === 'medium') return { color: '#FFB800', label: 'Medium' };
  return { color: '#4CAF50', label: 'Low' };
}

/* ═══════════════════════════════════════════════════════════════════════
   EnAcademyPageClient
   ═══════════════════════════════════════════════════════════════════════ */
export default function EnAcademyPageClient() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermItem | null>(null);
  const [termSearch, setTermSearch] = useState('');
  const [termCategoryFilter, setTermCategoryFilter] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('completedLessons');
      if (saved) setCompletedLessons(JSON.parse(saved));
    } catch { /* silent */ }
  }, []);

  const progressPercent = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  // Term of the day
  const dayIndex = mounted && financialTerms.length > 0 ? Math.floor(Date.now() / 86400000) % financialTerms.length : 0;
  const todaysTerm = financialTerms.length > 0 ? financialTerms[dayIndex] : { term: '—', full: 'No data', description: 'No financial terms available at this time', category: '' };

  // Filter lessons
  const filteredLessons =
    selectedCategory === 'all'
      ? lessons
      : lessons.filter((l) => l.category === selectedCategory);

  // Filter terms
  const filteredTerms = financialTerms.filter((t) => {
    const matchSearch = termSearch === '' || t.term.toLowerCase().includes(termSearch.toLowerCase()) || t.full.includes(termSearch);
    const matchCat = termCategoryFilter === 'all' || t.category === termCategoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        {/* ── Page Header ── */}
        <div className="max-w-[1280px] mx-auto px-4 mb-2" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-head)' }}>
              Financial Academy
            </h1>
            <span className="badge-ai">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
              </svg>
              Learn
            </span>
          </div>
          <p className="text-[14px] max-w-[600px]" style={{ color: 'var(--text-2)' }}>
            Comprehensive learning paths to understand financial markets and develop your trading and investing skills
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
           FINANCIAL TERMS — Interactive Sidebar + Detail
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Financial Terms" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Financial Terms</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {financialTerms.length} terms
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {/* ── Sidebar: Search + Category + List ── */}
              <div className="md:w-[280px] flex-shrink-0">
                {/* Search */}
                <div className="glass-card p-3 mb-3">
                  <div className="relative">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" className="absolute start-3 top-1/2 -translate-y-1/2">
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search for a term..."
                      value={termSearch}
                      onChange={(e) => setTermSearch(e.target.value)}
                      className="w-full text-[13px] py-2 ps-9 pe-3 rounded-lg outline-none"
                      style={{ background: 'var(--bg4)', border: '1px solid var(--rim)', color: 'var(--text-1)' }}
                    />
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {TERM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setTermCategoryFilter(cat.id)}
                      className="text-[10px] px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer"
                      style={{
                        background: termCategoryFilter === cat.id ? 'var(--cyan2)' : 'var(--bg4)',
                        color: termCategoryFilter === cat.id ? 'var(--cyan)' : 'var(--text-3)',
                        border: termCategoryFilter === cat.id ? '1px solid rgba(0,229,255,0.25)' : '1px solid var(--rim)',
                        fontWeight: termCategoryFilter === cat.id ? 600 : 400,
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Terms List */}
                <div className="glass-card max-h-[500px] overflow-y-auto custom-scrollbar">
                  {filteredTerms.length === 0 ? (
                    <div className="p-4 text-center">
                      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>No results found</span>
                    </div>
                  ) : (
                    filteredTerms.map((term) => {
                      const isSelected = selectedTerm?.term === term.term;
                      const catColor = categoryColor(term.category);
                      return (
                        <button
                          key={term.term}
                          onClick={() => setSelectedTerm(term)}
                          className="w-full flex items-center gap-3 p-3 text-left transition-all duration-200 cursor-pointer"
                          style={{
                            background: isSelected ? `${catColor}10` : 'transparent',
                            borderLeft: isSelected ? `3px solid ${catColor}` : '3px solid transparent',
                            borderBottom: '1px solid var(--rim)',
                          }}
                        >
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono-price"
                            style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}25` }}
                          >
                            {term.term.slice(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold truncate" style={{ color: isSelected ? catColor : 'var(--text-1)' }}>
                              {term.term}
                            </div>
                            <div className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>
                              {translateTermFull(term.term, term.full, LOCALE)}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Main Panel: Term Detail ── */}
              <div className="flex-1 min-w-0">
                {selectedTerm ? (
                  <div className="glass-card-elevated p-6 relative overflow-hidden" style={{ borderTop: `3px solid ${categoryColor(selectedTerm.category)}` }}>
                    <div className="absolute top-0 left-0 right-0 h-[120px]" style={{ background: `radial-gradient(ellipse at 50% -20%, ${categoryColor(selectedTerm.category)}10, transparent)` }} />
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="text-3xl font-bold font-mono-price px-4 py-2 rounded-xl"
                          style={{ color: categoryColor(selectedTerm.category), border: `2px solid ${categoryColor(selectedTerm.category)}40`, background: `${categoryColor(selectedTerm.category)}10` }}
                        >
                          {selectedTerm.term}
                        </div>
                        <span
                          className="text-[11px] px-3 py-1 rounded-full font-medium"
                          style={{ background: `${categoryColor(selectedTerm.category)}18`, color: categoryColor(selectedTerm.category), border: `1px solid ${categoryColor(selectedTerm.category)}25` }}
                        >
                          {categoryLabel(selectedTerm.category)}
                        </span>
                      </div>

                      {/* Full Name */}
                      <h2 className="text-[18px] font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                        {translateTermFull(selectedTerm.term, selectedTerm.full, LOCALE)}
                      </h2>

                      {/* Definition */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>Definition</h3>
                        </div>
                        <p className="text-[14px] leading-[2]" style={{ color: 'var(--text-2)' }}>
                          {translateTermDescription(selectedTerm.term, selectedTerm.description, LOCALE)}
                        </p>
                      </div>

                      {/* AI Market Insight */}
                      <div className="p-4 rounded-xl mb-6 relative overflow-hidden" style={{ background: 'rgba(124,111,205,0.08)', border: '1px solid rgba(124,111,205,0.2)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[16px]">🧠</span>
                          <span className="text-[12px] font-bold" style={{ color: 'var(--purple)' }}>AI Market Insight</span>
                        </div>
                        <p className="text-[12px] leading-[1.9]" style={{ color: 'var(--text-2)' }}>
                          {selectedTerm.term === 'NFP' && 'Non-Farm Payrolls data is the strongest monthly driver for the US Dollar. When the number beats expectations by more than 50K jobs, EUR/USD moves an average of 60-80 pips in the first hour. Also watch average earnings which can have a stronger impact than the employment number itself.'}
                          {selectedTerm.term === 'CPI' && 'The Consumer Price Index is the central banks\' primary inflation gauge. CPI rising above expectations increases the likelihood of rate hikes, which strengthens the currency. The strongest impact is on the Dollar and Euro, with direct reactions on Gold and Equities.'}
                          {selectedTerm.term === 'FOMC' && 'FOMC decisions set the Dollar\'s trajectory for weeks ahead. The accompanying statement and Powell\'s press conference are more important than the decision itself. Words like "patient" or "data-dependent" shift rate expectations and move markets significantly.'}
                          {selectedTerm.term === 'GDP' && 'Gross Domestic Product gives a comprehensive picture of economic health. GDP growth above expectations supports the currency, but the impact is slower than NFP and CPI because the data is retrospective.'}
                          {selectedTerm.term === 'DXY' && 'The Dollar Index moves inversely with most commodities and currencies. DXY above 105 puts pressure on Gold and emerging markets, while below 100 opens the door for risk-on rallies.'}
                          {selectedTerm.term === 'PMI' && 'PMI is a leading indicator that precedes official data by 2-3 months. A reading below 45 signals recession, and above 55 indicates strong growth. Its impact on EUR/USD is typically 20-30 pips.'}
                          {selectedTerm.term === 'VIX' && 'VIX above 30 indicates extreme fear and may signal a near-term bottom. Below 15 indicates complacency that may precede a correction. Use it as a contrarian sentiment indicator: buy when fearful, sell when complacent.'}
                          {selectedTerm.term === 'RSI' && 'RSI divergence is one of the strongest trading signals. When RSI contradicts price direction, the probability of reversal reaches 70% on the daily timeframe. Best used with support/resistance levels.'}
                          {selectedTerm.term === 'MACD' && 'MACD crossovers on the weekly timeframe are more reliable than daily. The histogram gives an early warning 2-3 candles before the crossover, allowing for early entries with tighter stop losses.'}
                          {!['NFP','CPI','FOMC','GDP','DXY','PMI','VIX','RSI','MACD'].includes(selectedTerm.term) && `Understanding ${selectedTerm.full} is essential for any trader. This term affects daily trading decisions and market analysis. Follow our AI analysis for real-time insights on its impact on major pairs.`}
                        </p>
                      </div>

                      {/* Impact Table */}
                      {TERM_IMPACTS[selectedTerm.term] && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                            </svg>
                            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>Impact on Pairs</h3>
                          </div>
                          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--rim)' }}>
                            <table className="w-full text-[12px]">
                              <thead>
                                <tr style={{ background: 'var(--bg4)' }}>
                                  <th className="p-2.5 text-left font-semibold" style={{ color: 'var(--text-2)' }}>Pair</th>
                                  <th className="p-2.5 text-center font-semibold" style={{ color: 'var(--text-2)' }}>Impact Level</th>
                                  <th className="p-2.5 text-left font-semibold" style={{ color: 'var(--text-2)' }}>Direction</th>
                                </tr>
                              </thead>
                              <tbody>
                                {TERM_IMPACTS[selectedTerm.term].map((imp, i) => {
                                  const ib = impactBadge(imp.level);
                                  return (
                                    <tr key={i} style={{ borderBottom: i < TERM_IMPACTS[selectedTerm.term].length - 1 ? '1px solid var(--rim)' : 'none' }}>
                                      <td className="p-2.5 font-mono-price font-semibold" style={{ color: 'var(--cyan)' }}>{imp.pair}</td>
                                      <td className="p-2.5 text-center">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-block" style={{ background: `${ib.color}18`, color: ib.color }}>
                                          {ib.label}
                                        </span>
                                      </td>
                                      <td className="p-2.5" style={{ color: 'var(--text-2)' }}>{imp.direction}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" className="mb-4 opacity-40">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
                    </svg>
                    <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>Select a term from the list to view its explanation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           CATEGORY FILTERS
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Browse by Category" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Browse by Category</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {academyCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="glass-card p-3 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                  style={{
                    borderTop: selectedCategory === cat.name ? `2px solid ${cat.color}` : '2px solid transparent',
                    background: selectedCategory === cat.name ? `${cat.color}08` : undefined,
                  }}
                >
                  <div
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                    style={{ background: `${cat.color}18`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div className="text-[12px] font-medium block" style={{ color: selectedCategory === cat.name ? cat.color : 'var(--text-2)' }}>
                    {translateAcademyCategory(cat.name, LOCALE)}
                  </div>
                  <div className="text-[10px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                    {cat.count} lessons
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           OVERALL PROGRESS BAR
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Your Progress" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>Your Academy Progress</span>
                <span className="font-mono-price text-[13px] font-medium" style={{ color: 'var(--cyan)' }}>
                  {completedLessons.length} / {lessons.length} lessons
                </span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           LESSON LIST
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Educational Lessons" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Educational Lessons</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {filteredLessons.length} lessons
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredLessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const lb = levelBadge(lesson.level);
                const catObj = academyCategories.find(c => c.name === lesson.category);
                const catColor = catObj?.color || 'var(--cyan)';
                return (
                  <Link key={lesson.id} href={`/en/academy/lesson/${lesson.id}`} className="block">
                    <div className="glass-card p-4 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1">
                      {/* Completed check */}
                      {isCompleted && (
                        <div
                          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--bull)' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </div>
                      )}

                      {/* Level badge + duration */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: lb.bg, color: lb.color }}
                        >
                          {lb.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{translateLessonDuration(lesson.duration, LOCALE)}</span>
                      </div>

                      <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{translateLessonTitle(lesson.id, lesson.title, LOCALE)}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${catColor}15`, color: catColor }}>{translateAcademyCategory(lesson.category, LOCALE)}</span>

                      {/* Hover overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{
                          background: 'rgba(10,14,26,0.8)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: 'var(--card-radius)',
                        }}
                      >
                        <span className="text-[12px] font-medium flex items-center gap-1" style={{ color: 'var(--cyan)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                          Read Lesson
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           QUICK TIPS
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Golden Tips" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Golden Tips</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 1, title: 'Never trade money you can\'t afford to lose', description: 'Golden rule: only invest what you can afford to lose completely', icon: '🛡️' },
                { id: 2, title: 'Always use stop-loss orders', description: 'Protecting your capital is more important than making profits', icon: '🛑' },
                { id: 3, title: 'Trade with the trend', description: 'The trend is your friend — don\'t fight the market', icon: '📈' },
                { id: 4, title: 'Keep a trading journal', description: 'Record your trades and mistakes to learn from every experience', icon: '📝' },
                { id: 5, title: 'Avoid emotional trading', description: 'Don\'t enter a trade out of revenge or greed to recover losses', icon: '🧠' },
                { id: 6, title: 'Diversify your portfolio', description: 'Don\'t put all your money in a single asset or sector', icon: '⚖️' },
              ].map((tip) => (
                <div key={tip.id} className="glass-card p-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <div>
                      <h4 className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>{tip.title}</h4>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{tip.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
