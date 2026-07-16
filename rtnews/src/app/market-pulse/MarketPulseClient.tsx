'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeatMapGrid, SentimentGauge, MiniSparkline, ConfidenceIndicator } from '@/components/rouaa/charts';
import AssistantChatWidget from '@/components/assistant/AssistantChatWidget';

interface Indicator {
  id: string; name: string; nameAr?: string; symbol: string;
  value: number; change: number; changePercent: number;
  category: string; region: string;
  history: { date: string; value: number }[];
  lastUpdated: string;
}

interface Props {
  initialIndicators: Indicator[];
  latestReports: any[];
  latestAnalyses: any[];
  sentiment: { bullish: number; bearish: number; neutral: number };
  heatmap: { category: string; count: number; avgSentiment: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  index: 'مؤشرات', commodity: 'سلع', currency: 'عملات', bond_yield: 'سندات', crypto: 'كريبتو',
};
const CATEGORY_ICONS: Record<string, string> = {
  index: '📊', commodity: '🛢️', currency: '💱', bond_yield: '📜', crypto: '₿',
};

const ASSET_CLASS_LABELS: Record<string, string> = {
  stocks: 'أسهم', commodities: 'سلع', forex: 'فوركس', crypto: 'كريبتو', bonds: 'سندات',
};
const RISK_COLORS: Record<string, string> = {
  low: 'var(--bull)', medium: 'var(--gold)', high: '#FF8040', extreme: 'var(--bear)',
};
const RISK_LABELS: Record<string, string> = {
  low: 'منخفض', medium: 'متوسط', high: 'مرتفع', extreme: 'شديد',
};
const SENTIMENT_COLORS: Record<string, string> = {
  bullish: 'var(--bull)', bearish: 'var(--bear)', neutral: 'var(--gold)',
};
const SENTIMENT_LABELS: Record<string, string> = {
  bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد',
};
const TYPE_LABELS: Record<string, string> = {
  weekly: 'أسبوعي', monthly: 'شهري', quarterly: 'ربع سنوي', special: 'خاص',
};

// Map heatmap category keys to Arabic labels
const HEATMAP_LABELS: Record<string, string> = {
  index: 'مؤشرات', commodity: 'سلع', currency: 'عملات', bond_yield: 'سندات', crypto: 'كريبتو',
  stocks: 'أسهم', forex: 'فوركس', bonds: 'سندات', metals: 'معادن', energy: 'طاقة',
  technology: 'تقنية', finance: 'مالية', healthcare: 'صحة', real_estate: 'عقارات',
};

export default function MarketPulseClient({ initialIndicators, latestReports, latestAnalyses, sentiment, heatmap }: Props) {
  const [indicators, setIndicators] = useState<Indicator[]>(initialIndicators);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedHeatCategory, setSelectedHeatCategory] = useState<string | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/market-indicators');
        const data = await res.json();
        if (data.indicators) setIndicators(data.indicators);
      } catch { /* silent */ }
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredIndicators = activeCategory === 'all'
    ? indicators
    : indicators.filter(i => i.category === activeCategory);

  const topGainers = [...indicators].filter(i => i.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...indicators].filter(i => i.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const totalSentiment = sentiment.bullish + sentiment.bearish + sentiment.neutral;
  // Calculate sentiment gauge value (0-100): 50 = neutral, 0 = extreme fear, 100 = extreme greed
  const sentimentGaugeValue = totalSentiment > 0
    ? Math.round(((sentiment.bullish * 100 + sentiment.neutral * 50) / (totalSentiment * 100)) * 100)
    : 50;

  // Prepare heatmap data with labels
  const heatmapData = heatmap.map(item => ({
    category: item.category,
    count: item.count,
    avgSentiment: item.avgSentiment,
    label: HEATMAP_LABELS[item.category] || item.category,
  }));

  const handleHeatCategoryClick = (category: string) => {
    setSelectedHeatCategory(prev => prev === category ? null : category);
    setActiveCategory(prev => {
      // Map heatmap category to indicator category
      const catMap: Record<string, string> = {
        index: 'index', commodity: 'commodity', currency: 'currency',
        bond_yield: 'bond_yield', crypto: 'crypto',
      };
      const mapped = catMap[category];
      if (prev === mapped || prev === category) return 'all';
      return mapped || category;
    });
  };

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ padding: '40px 0 24px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--ambient-tr)', zIndex: 0 }} />
        <div className="max-w-[1200px] mx-auto px-4 relative z-10" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bull2)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold gradient-text">نبض السوق</h1>
            <span className="badge-live"><span className="live-dot" />مباشر</span>
          </div>
          <p className="text-[14px]" style={{ color: 'var(--text2)' }}>لقطة شاملة لأوضاع الأسواق العالمية والعربية في الوقت الحقيقي</p>
        </div>
      </div>

      {/* Live Indicators Row */}
      <div className="max-w-[1200px] mx-auto px-4 mb-6" style={{ paddingInline: 'var(--space-md)' }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {indicators.filter(i => ['SPX', 'XAU', 'BTC', 'WTI', 'EURUSD', 'TASI'].includes(i.symbol)).map(ind => (
            <div key={ind.id} className="glass-card px-3 py-2 flex items-center gap-3 flex-shrink-0 min-w-[180px] cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] truncate" style={{ color: 'var(--text3)' }}>{ind.nameAr || ind.name}</div>
                <div className="font-mono-price text-[14px] font-bold" style={{ color: 'var(--text)' }} suppressHydrationWarning>
                  {ind.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
              <MiniSparkline
                data={ind.history.map(h => h.value)}
                color={ind.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)'}
                width={50}
                height={18}
              />
              <div className="text-left flex-shrink-0">
                <span className={`font-mono-price text-[11px] font-bold ${(ind.changePercent) >= 0 ? 'flash-up' : 'flash-down'}`}
                  style={{ color: ind.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                  {ind.changePercent >= 0 ? '▲' : '▼'} {Math.abs(ind.changePercent).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          
          {/* Sentiment Gauge - 1 col */}
          <div className="glass-card p-5">
            <div className="sh mb-4">
              <div className="sh-title">مشاعر السوق</div>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>آخر 7 أيام</span>
            </div>
            <div className="flex items-center justify-center mb-4">
              <SentimentGauge value={sentimentGaugeValue} size={180} />
            </div>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--bull)' }}>{sentiment.bullish}</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>صعودي</div>
              </div>
              <div className="text-center">
                <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--gold)' }}>{sentiment.neutral}</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>محايد</div>
              </div>
              <div className="text-center">
                <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--bear)' }}>{sentiment.bearish}</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>هبوطي</div>
              </div>
            </div>
          </div>

          {/* Sector Heatmap - 2 cols */}
          <div className="glass-card p-5 lg:col-span-2">
            <div className="sh mb-4">
              <div className="sh-title">خريطة حرارية للقطاعات</div>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>آخر 24 ساعة</span>
            </div>
            <HeatMapGrid
              data={heatmapData}
              onCategoryClick={handleHeatCategoryClick}
            />
            {selectedHeatCategory && (
              <div className="mt-2 text-center">
                <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  تصفية: {HEATMAP_LABELS[selectedHeatCategory] || selectedHeatCategory}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Movers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Gainers */}
          <div className="glass-card p-5">
            <div className="sh mb-3">
              <div className="sh-title" style={{ color: 'var(--bull)' }}>الأكثر ارتفاعاً</div>
            </div>
            {topGainers.length === 0 ? (
              <p className="text-[12px] text-center py-4" style={{ color: 'var(--text3)' }}>لا توجد بيانات</p>
            ) : (
              <div className="space-y-2">
                {topGainers.map(ind => (
                  <div key={ind.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors" style={{ background: 'var(--bg2)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold truncate" style={{ color: 'var(--text)' }}>{ind.nameAr || ind.name}</div>
                      <div className="font-mono-price text-[11px]" style={{ color: 'var(--text3)' }}>{ind.symbol}</div>
                    </div>
                    <MiniSparkline
                      data={ind.history.map(h => h.value)}
                      color="var(--bull)"
                      width={60}
                      height={20}
                      showArea
                    />
                    <div className="text-left flex-shrink-0">
                      <div className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--bull)' }} suppressHydrationWarning>
                        +{ind.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Losers */}
          <div className="glass-card p-5">
            <div className="sh mb-3">
              <div className="sh-title" style={{ color: 'var(--bear)' }}>الأكثر انخفاضاً</div>
            </div>
            {topLosers.length === 0 ? (
              <p className="text-[12px] text-center py-4" style={{ color: 'var(--text3)' }}>لا توجد بيانات</p>
            ) : (
              <div className="space-y-2">
                {topLosers.map(ind => (
                  <div key={ind.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors" style={{ background: 'var(--bg2)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold truncate" style={{ color: 'var(--text)' }}>{ind.nameAr || ind.name}</div>
                      <div className="font-mono-price text-[11px]" style={{ color: 'var(--text3)' }}>{ind.symbol}</div>
                    </div>
                    <MiniSparkline
                      data={ind.history.map(h => h.value)}
                      color="var(--bear)"
                      width={60}
                      height={20}
                      showArea
                    />
                    <div className="text-left flex-shrink-0">
                      <div className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--bear)' }} suppressHydrationWarning>
                        {ind.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Indicators Table */}
        <div className="glass-card p-5 mb-6">
          <div className="sh mb-4">
            <div className="sh-title">جميع المؤشرات</div>
          </div>
          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            <button onClick={() => setActiveCategory('all')}
              className={`tab-underline whitespace-nowrap text-[12px] ${activeCategory === 'all' ? 'active' : ''}`}>الكل</button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setActiveCategory(key)}
                className={`tab-underline whitespace-nowrap text-[12px] ${activeCategory === key ? 'active' : ''}`}>
                {CATEGORY_ICONS[key]} {label}
              </button>
            ))}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text3)' }}>المؤشر</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text3)' }}>المنطقة</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text3)' }}>القيمة</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text3)' }}>التغير</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text3)' }}>نسبة التغير</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text3)' }}>الاتجاه</th>
                </tr>
              </thead>
              <tbody>
                {filteredIndicators.map(ind => (
                  <tr key={ind.id} className="transition-colors hover:bg-[var(--bg2)]" style={{ borderBottom: '1px solid var(--border3)' }}>
                    <td className="py-2.5 px-2">
                      <div className="font-bold" style={{ color: 'var(--text)' }}>{ind.nameAr || ind.name}</div>
                      <div className="font-mono-price text-[10px]" style={{ color: 'var(--text3)' }}>{ind.symbol}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: ind.region === 'arabic' ? 'var(--purple2)' : 'var(--cyan2)', color: ind.region === 'arabic' ? 'var(--purple)' : 'var(--cyan)' }}>
                        {ind.region === 'arabic' ? 'عربي' : 'عالمي'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono-price font-bold" style={{ color: 'var(--text)' }} suppressHydrationWarning>
                      {ind.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 font-mono-price" style={{ color: ind.change >= 0 ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                      {ind.change >= 0 ? '+' : ''}{ind.change.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 font-mono-price font-bold" style={{ color: ind.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)' }} suppressHydrationWarning>
                      {ind.changePercent >= 0 ? '▲' : '▼'} {Math.abs(ind.changePercent).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-2">
                      <MiniSparkline
                        data={ind.history.map(h => h.value)}
                        color={ind.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)'}
                        width={60}
                        height={20}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Reports & Analyses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Latest Reports */}
          <div>
            <div className="sh mb-3">
              <div className="sh-title">أحدث التقارير</div>
              <Link href="/reports" className="sh-link">عرض الكل</Link>
            </div>
            {latestReports.length === 0 ? (
              <div className="glass-card p-4 text-center">
                <p className="text-[12px]" style={{ color: 'var(--text3)' }}>لا توجد تقارير بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {latestReports.map((r: any) => (
                  <Link key={r.id} href={`/reports/${r.slug}`} className="glass-card p-3 block transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                          {TYPE_LABELS[r.reportType] || r.reportType}
                        </span>
                        {r.confidenceScore !== undefined && (
                          <ConfidenceIndicator score={r.confidenceScore} size="sm" showLabel={false} />
                        )}
                      </div>
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                        {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('ar-SA') : ''}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-bold line-clamp-1" style={{ color: 'var(--text)' }}>{r.title}</h4>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Latest Analyses */}
          <div>
            <div className="sh mb-3">
              <div className="sh-title">أحدث التحليلات</div>
              <Link href="/analysis" className="sh-link">عرض الكل</Link>
            </div>
            {latestAnalyses.length === 0 ? (
              <div className="glass-card p-4 text-center">
                <p className="text-[12px]" style={{ color: 'var(--text3)' }}>لا توجد تحليلات بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {latestAnalyses.map((a: any) => (
                  <Link key={a.id} href={`/reports/${a.slug}`} className="glass-card p-3 block transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--purple2)', color: 'var(--purple)' }}>
                          {ASSET_CLASS_LABELS[a.assetClass] || a.assetClass}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: `${RISK_COLORS[a.riskLevel]}18`, color: RISK_COLORS[a.riskLevel] }}>
                          {RISK_LABELS[a.riskLevel]}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: SENTIMENT_COLORS[a.sentiment] || 'var(--text3)' }}>
                        {SENTIMENT_LABELS[a.sentiment] || a.sentiment}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-bold line-clamp-1" style={{ color: 'var(--text)' }}>{a.title}</h4>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AssistantChatWidget variant="embedded" reportType="market-pulse" />
    </main>
  );
}
