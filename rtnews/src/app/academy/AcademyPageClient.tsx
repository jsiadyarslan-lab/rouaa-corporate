'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { lessons, financialTerms, academyCategories } from '@/data/mock-data';
import type { TermItem } from '@/data/mock-data';

/* ── Category map for terms ── */
const TERM_CATEGORIES: { id: string; label: string }[] = [
  { id: 'الكل', label: 'الكل' },
  { id: 'fed', label: 'Fed' },
  { id: 'macro', label: 'ماكرو' },
  { id: 'forex', label: 'عملات' },
  { id: 'market', label: 'أسواق' },
  { id: 'technical', label: 'فني' },
  { id: 'fundamental', label: 'أساسي' },
  { id: 'risk', label: 'مخاطر' },
];

/* ── Impact table data for terms ── */
const TERM_IMPACTS: Record<string, { pair: string; level: 'high' | 'medium' | 'low'; direction: string }[]> = {
  NFP: [
    { pair: 'EUR/USD', level: 'high', direction: 'عكسي لـ USD' },
    { pair: 'GBP/USD', level: 'high', direction: 'عكسي لـ USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'مباشر مع USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'عكسي لـ USD' },
  ],
  CPI: [
    { pair: 'EUR/USD', level: 'high', direction: 'عكسي لـ USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'مباشر مع USD' },
    { pair: 'XAU/USD', level: 'medium', direction: 'مباشر مع التضخم' },
  ],
  FOMC: [
    { pair: 'EUR/USD', level: 'high', direction: 'عكسي لـ USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'مباشر مع USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'عكسي لـ USD' },
    { pair: 'SPX', level: 'high', direction: 'حسب النبرة' },
  ],
  GDP: [
    { pair: 'EUR/USD', level: 'medium', direction: 'عكسي لـ USD' },
    { pair: 'USD/JPY', level: 'medium', direction: 'مباشر مع USD' },
  ],
  DXY: [
    { pair: 'EUR/USD', level: 'high', direction: 'عكسي' },
    { pair: 'XAU/USD', level: 'high', direction: 'عكسي' },
    { pair: 'USD/JPY', level: 'high', direction: 'مباشر' },
  ],
  PMI: [
    { pair: 'EUR/USD', level: 'medium', direction: 'حسب البيان' },
    { pair: 'USD/JPY', level: 'medium', direction: 'حسب البيان' },
  ],
  VIX: [
    { pair: 'SPX', level: 'high', direction: 'عكسي' },
    { pair: 'USD/JPY', level: 'medium', direction: 'عكسي' },
    { pair: 'XAU/USD', level: 'medium', direction: 'مباشر' },
  ],
};

/* ── Level badge helper ── */
function levelBadge(level: string) {
  if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)', label: 'مبتدئ' };
  if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)', label: 'متوسط' };
  return { bg: 'var(--bear2)', color: 'var(--bear)', label: 'متقدم' };
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
  if (level === 'high') return { color: '#FF4444', label: 'مرتفع' };
  if (level === 'medium') return { color: '#FFB800', label: 'متوسط' };
  return { color: '#4CAF50', label: 'منخفض' };
}

/* ═══════════════════════════════════════════════════════════════════════
   AcademyPageClient
   ═══════════════════════════════════════════════════════════════════════ */
export default function AcademyPageClient() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [mounted, setMounted] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermItem | null>(null);
  const [termSearch, setTermSearch] = useState('');
  const [termCategoryFilter, setTermCategoryFilter] = useState('الكل');

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
  const todaysTerm = financialTerms.length > 0 ? financialTerms[dayIndex] : { term: '—', full: 'لا توجد بيانات', description: 'لا توجد مصطلحات مالية متاحة حالياً', category: '' };

  // Filter lessons
  const filteredLessons =
    selectedCategory === 'الكل'
      ? lessons
      : lessons.filter((l) => l.category === selectedCategory);

  // Filter terms
  const filteredTerms = financialTerms.filter((t) => {
    const matchSearch = termSearch === '' || t.term.toLowerCase().includes(termSearch.toLowerCase()) || t.full.includes(termSearch);
    const matchCat = termCategoryFilter === 'الكل' || t.category === termCategoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        {/* ── Page Header ── */}
        <div className="max-w-[1280px] mx-auto px-4 mb-2" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-head)' }}>
              الأكاديمية المالية
            </h1>
            <span className="badge-ai">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
              </svg>
              تعلّم
            </span>
          </div>
          <p className="text-[14px] max-w-[600px]" style={{ color: 'var(--text-2)' }}>
            مسارات تعليمية شاملة لفهم الأسواق المالية وتطوير مهاراتك في التداول والاستثمار
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
           FINANCIAL TERMS — Interactive Sidebar + Detail
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="المصطلحات المالية" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">المصطلحات المالية</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {financialTerms.length} مصطلح
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
                      placeholder="ابحث عن مصطلح..."
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
                      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>لا توجد نتائج</span>
                    </div>
                  ) : (
                    filteredTerms.map((term) => {
                      const isSelected = selectedTerm?.term === term.term;
                      const catColor = categoryColor(term.category);
                      return (
                        <button
                          key={term.term}
                          onClick={() => setSelectedTerm(term)}
                          className="w-full flex items-center gap-3 p-3 text-right transition-all duration-200 cursor-pointer"
                          style={{
                            background: isSelected ? `${catColor}10` : 'transparent',
                            borderInlineStart: isSelected ? `3px solid ${catColor}` : '3px solid transparent',
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
                              {term.full}
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
                        {selectedTerm.full}
                      </h2>

                      {/* Definition */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>التعريف</h3>
                        </div>
                        <p className="text-[14px] leading-[2]" style={{ color: 'var(--text-2)' }}>
                          {selectedTerm.description}
                        </p>
                      </div>

                      {/* AI Market Insight */}
                      <div className="p-4 rounded-xl mb-6 relative overflow-hidden" style={{ background: 'rgba(124,111,205,0.08)', border: '1px solid rgba(124,111,205,0.2)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[16px]">🧠</span>
                          <span className="text-[12px] font-bold" style={{ color: 'var(--purple)' }}>تحليل AI للسوق</span>
                        </div>
                        <p className="text-[12px] leading-[1.9]" style={{ color: 'var(--text-2)' }}>
                          {selectedTerm.term === 'NFP' && 'بيانات التوظيف غير الزراعية تُعد المحرك الأقوى للدولار شهرياً. عندما يتجاوز الرقم التوقعات بأكثر من 50 ألف وظيفة، يتحرك EUR/USD بمتوسط 60-80 نقطة خلال الساعة الأولى. راقب أيضاً متوسط الأجور الذي قد يكون أقوى تأثيراً من رقم التوظيف نفسه.'}
                          {selectedTerm.term === 'CPI' && 'مؤشر أسعار المستهلكين هو المقياس الرئيسي للبنوك المركزية. ارتفاع CPI أعلى من المتوقع يزيد احتمال رفع الفائدة مما يدعم العملة. التأثير الأقوى يكون على الدولار واليورو، مع ارتدادات مباشرة على الذهب والأسهم.'}
                          {selectedTerm.term === 'FOMC' && 'قرارات FOMC تحدد مسار الدولار للأسابيع القادمة. البيان المصاحب ومؤتمر باول الصحفي أهم من القرار نفسه. كلمات مثل "patient" أو "data-dependent" تغير توقعات الفائدة وتحرك الأسواق بقوة.'}
                          {selectedTerm.term === 'GDP' && 'الناتج المحلي الإجمالي يعطي صورة شاملة عن صحة الاقتصاد. نمو GDP أعلى من المتوقع يدعم العملة لكن التأثير يكون أبطأ من NFP وCPI لأن البيانات تتأخر ( retroactive ).'}
                          {selectedTerm.term === 'DXY' && 'مؤشر الدولار يتحرك عكسياً مع معظم السلع والعملات. DXY فوق 105 يشكل ضغطاً على الذهب والأسواق الناشئة، بينما تحت 100 يفتح المجال لصعود المخاطر.'}
                          {selectedTerm.term === 'PMI' && 'PMI مؤشر رائد يسبق البيانات الرسمية بـ 2-3 أشهر. قراءة تحت 45 تنذر بركود، وفوق 55 تشير لنمو قوي. تأثيره على EUR/USD يكون 20-30 نقطة عادةً.'}
                          {selectedTerm.term === 'VIX' && 'VIX فوق 30 يدل على خوف شديد وقد يشير لقاع قريب. تحت 15 يدل على تراخٍ قد يسبق تصحيحاً. استخدمه كمؤشر عاطفي معاكس: اشترِ عند الخوف وبع عند الطمأنينة.'}
                          {selectedTerm.term === 'RSI' && 'الدايفرجنس على RSI من أقوى إشارات التداول. عندما يخالف RSI اتجاه السعر، احتمال الانعكاس يصل لـ 70% على الإطار اليومي. الأفضل استخدامه مع مستويات دعم/مقاومة.'}
                          {selectedTerm.term === 'MACD' && 'تقاطعات MACD على الإطار الأسبوعي أكثر موثوقية من اليومي. المدرج التكراري يعطي إنذاراً مبكراً قبل التقاطع بـ 2-3 شموع، مما يتيح دخولاً مبكراً بوقف خسارة أضيق.'}
                          {!['NFP','CPI','FOMC','GDP','DXY','PMI','VIX','RSI','MACD'].includes(selectedTerm.term) && `فهم ${selectedTerm.full} ضروري لأي متداول. هذا المصطلح يؤثر على قرارات التداول اليومية وتحليل الأسواق. تابع تحليلاتنا AI للحصول على رؤى فورية حول تأثيره على الأزواج الرئيسية.`}
                        </p>
                      </div>

                      {/* Impact Table */}
                      {TERM_IMPACTS[selectedTerm.term] && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                            </svg>
                            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>جدول التأثير على الأزواج</h3>
                          </div>
                          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--rim)' }}>
                            <table className="w-full text-[12px]">
                              <thead>
                                <tr style={{ background: 'var(--bg4)' }}>
                                  <th className="p-2.5 text-right font-semibold" style={{ color: 'var(--text-2)' }}>الزوج</th>
                                  <th className="p-2.5 text-center font-semibold" style={{ color: 'var(--text-2)' }}>مستوى التأثير</th>
                                  <th className="p-2.5 text-right font-semibold" style={{ color: 'var(--text-2)' }}>اتجاه التأثير</th>
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
                    <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>اختر مصطلحاً من القائمة لعرض شرحه</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           CATEGORY FILTERS
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="تصفح حسب الفئة" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">تصفح حسب الفئة</div>
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
                    {cat.name}
                  </div>
                  <div className="text-[10px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                    {cat.count} درس
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           OVERALL PROGRESS BAR
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="تقدمك" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>تقدمك في الأكاديمية</span>
                <span className="font-mono-price text-[13px] font-medium" style={{ color: 'var(--cyan)' }}>
                  {completedLessons.length} / {lessons.length} درساً
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
        <section className="section-block" aria-label="الدروس" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">الدروس التعليمية</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {filteredLessons.length} درس
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredLessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const lb = levelBadge(lesson.level);
                const catObj = academyCategories.find(c => c.name === lesson.category);
                const catColor = catObj?.color || 'var(--cyan)';
                return (
                  <Link key={lesson.id} href={`/academy/lesson/${lesson.id}`} className="block">
                    <div className="glass-card p-4 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1">
                      {/* Completed check */}
                      {isCompleted && (
                        <div
                          className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
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
                        <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{lesson.duration}</span>
                      </div>

                      <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{lesson.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${catColor}15`, color: catColor }}>{lesson.category}</span>

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
                          اقرأ الدرس
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
        <section className="section-block" aria-label="نصائح سريعة" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">نصائح ذهبية</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 1, title: 'لا تتداول بأموال لا تملك خسارتها', description: 'قاعدة ذهبية: استثمر فقط ما يمكنك تحمل خسارته الكاملة', icon: '🛡️' },
                { id: 2, title: 'استخدم أوامر وقف الخسارة دائماً', description: 'حماية رأس المال أهم من تحقيق الأرباح', icon: '🛑' },
                { id: 3, title: 'تداول مع الاتجاه العام', description: 'الاتجاه صديقك — لا تحارب السوق', icon: '📈' },
                { id: 4, title: 'حافظ على يوميات تداول', description: 'سجّل صفقاتك وأخطائك لتتعلم من كل تجربة', icon: '📝' },
                { id: 5, title: 'تجنب التداول العاطفي', description: 'لا تدخل صفقة انتقاماً من السوق أو طمعاً في تعويض خسارة', icon: '🧠' },
                { id: 6, title: 'نوّع محفظتك الاستثمارية', description: 'لا تضع كل أموالك في أصل واحد أو قطاع واحد', icon: '⚖️' },
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
