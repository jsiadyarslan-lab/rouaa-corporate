'use client';

import { useState, useEffect, useCallback } from 'react';
import MiniSparkline from '@/components/rouaa/charts/MiniSparkline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AvailableIndicator {
  id: string; name: string; nameAr: string | null; symbol: string;
  category: string; region: string;
}

interface ComparisonAsset {
  id: string; name: string; nameAr: string; symbol: string;
  category: string; region: string;
  currentData: { value: number; change: number; changePercent: number; lastUpdated: string };
  history30d: { date: string; value: number; pctChange: number }[];
  keyStats: { high30d: number; low30d: number; avg30d: number; volatility: number; range: number; positionInRange: number };
}

interface Correlation { symbol1: string; symbol2: string; correlation: number }

const CATEGORY_LABELS: Record<string, string> = {
  index: 'مؤشرات', commodity: 'سلع', currency: 'عملات', bond_yield: 'سندات', crypto: 'كريبتو',
};

const REGION_LABELS: Record<string, string> = {
  arabic: 'عربي', global: 'عالمي',
};

const CHART_COLORS = ['#00E5FF', '#8B5CF6', '#FFB800', '#22C55E', '#EF5350'];

export default function CompareClient({ availableIndicators }: { availableIndicators: AvailableIndicator[] }) {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['SPX', 'XAU']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [comparison, setComparison] = useState<ComparisonAsset[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'correlation'>('chart');

  const fetchData = useCallback(async () => {
    if (selectedSymbols.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?symbols=${selectedSymbols.join(',')}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.comparison) setComparison(data.comparison);
      if (data.correlations) setCorrelations(data.correlations);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [selectedSymbols]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addSymbol = (symbol: string) => {
    if (selectedSymbols.length >= 5 || selectedSymbols.includes(symbol)) return;
    setSelectedSymbols([...selectedSymbols, symbol]);
    setShowSearch(false);
    setSearchQuery('');
  };

  const removeSymbol = (symbol: string) => {
    setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
  };

  const filteredIndicators = availableIndicators.filter(
    (ind) =>
      !selectedSymbols.includes(ind.symbol) &&
      (ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.nameAr?.includes(searchQuery) ||
        ind.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Merge history data for overlaid chart
  const chartData = comparison.length > 0
    ? comparison[0].history30d.map((h, idx) => {
        const point: Record<string, number | string> = { date: h.date.slice(5) }; // MM-DD
        comparison.forEach((asset) => {
          point[asset.symbol] = asset.history30d[idx]?.pctChange ?? 0;
        });
        return point;
      })
    : [];

  const getCorrelationColor = (val: number) => {
    if (val >= 0.7) return 'var(--bull)';
    if (val >= 0.3) return 'var(--cyan)';
    if (val >= -0.3) return 'var(--text3)';
    if (val >= -0.7) return 'var(--gold)';
    return 'var(--bear)';
  };

  const getCorrelationLabel = (val: number) => {
    if (val >= 0.7) return 'ارتباط قوي';
    if (val >= 0.3) return 'ارتباط متوسط';
    if (val >= -0.3) return 'لا ارتباط';
    if (val >= -0.7) return 'ارتباط عكسي متوسط';
    return 'ارتباط عكسي قوي';
  };

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--ink)' }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ padding: '40px 0 24px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--ambient-tr)', zIndex: 0 }} />
        <div className="max-w-[1200px] mx-auto px-4 relative z-10" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold gradient-text">مقارنة الأصول</h1>
          </div>
          <p className="text-[14px]" style={{ color: 'var(--text2)' }}>قارن بين المؤشرات والأصول المالية جنباً إلى جنب</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
        {/* Selected Assets Bar */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[12px] font-bold" style={{ color: 'var(--text3)' }}>الأصول المحددة:</span>
            {selectedSymbols.map((sym) => {
              const ind = availableIndicators.find((a) => a.symbol === sym);
              return (
                <span
                  key={sym}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: 'var(--cyan2)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    color: 'var(--cyan)',
                  }}
                >
                  {ind?.nameAr || ind?.name || sym}
                  <button
                    onClick={() => removeSymbol(sym)}
                    className="hover:text-[var(--bear)] transition-colors"
                    aria-label={`إزالة ${sym}`}
                  >✕</button>
                </span>
              );
            })}
            {selectedSymbols.length < 5 && (
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background: 'var(--bg4)',
                  border: '1px dashed var(--border)',
                  color: 'var(--text3)',
                }}
              >
                + إضافة أصل
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearch && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مؤشر أو أصل..."
                className="w-full px-3 py-2 rounded-lg text-[13px]"
                style={{
                  background: 'var(--bg4)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
                autoFocus
              />
              {searchQuery && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                >
                  {filteredIndicators.length === 0 ? (
                    <div className="p-3 text-center text-[12px]" style={{ color: 'var(--text3)' }}>لا توجد نتائج</div>
                  ) : (
                    filteredIndicators.slice(0, 20).map((ind) => (
                      <button
                        key={ind.id}
                        onClick={() => addSymbol(ind.symbol)}
                        className="w-full text-right px-3 py-2 flex items-center justify-between hover:bg-[var(--bg4)] transition-colors"
                      >
                        <div>
                          <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{ind.nameAr || ind.name}</span>
                          <span className="text-[10px] mr-2 font-mono-price" style={{ color: 'var(--text3)' }}>{ind.symbol}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                          {CATEGORY_LABELS[ind.category] || ind.category}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center mb-6">
            <div className="skeleton mx-auto" style={{ width: '200px', height: '20px', marginBottom: '12px' }} />
            <div className="skeleton mx-auto" style={{ width: '300px', height: '14px' }} />
          </div>
        ) : comparison.length === 0 ? (
          <div className="glass-card p-8 text-center mb-6">
            <p className="text-[14px]" style={{ color: 'var(--text3)' }}>اختر أصلين على الأقل للمقارنة</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {([
                { key: 'chart', label: '📊 الرسم البياني' },
                { key: 'table', label: '📋 جدول المقارنة' },
                { key: 'correlation', label: '🔗 الارتباط' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`tab-underline whitespace-nowrap text-[12px] ${activeTab === tab.key ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chart Tab */}
            {activeTab === 'chart' && chartData.length > 0 && (
              <div className="glass-card p-5 mb-6">
                <div className="sh mb-4">
                  <div className="sh-title">تغير النسبة المئوية (30 يوم)</div>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>مُعيار إلى نقطة البداية</span>
                </div>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'var(--text3)', fontSize: 10 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text3)', fontSize: 10 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={false}
                        tickFormatter={(v) => `${v.toFixed(1)}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg3)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'var(--text)',
                          direction: 'rtl',
                        }}
                        formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                      />
                      <Legend />
                      {comparison.map((asset, idx) => (
                        <Line
                          key={asset.symbol}
                          type="monotone"
                          dataKey={asset.symbol}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Table Tab */}
            {activeTab === 'table' && (
              <div className="glass-card p-5 mb-6 overflow-x-auto">
                <div className="sh mb-4">
                  <div className="sh-title">مقارنة تفصيلية</div>
                </div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--text3)' }}>المؤشر</th>
                      {comparison.map((asset) => (
                        <th key={asset.symbol} className="text-right py-2 px-3 font-medium" style={{ color: CHART_COLORS[comparison.indexOf(asset) % CHART_COLORS.length] }}>
                          {asset.nameAr}
                          <span className="block text-[10px] font-mono-price" style={{ color: 'var(--text3)' }}>{asset.symbol}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'القيمة الحالية', key: 'value', fmt: (a: ComparisonAsset) => a.currentData.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
                      { label: 'التغير', key: 'change', fmt: (a: ComparisonAsset) => `${a.currentData.change >= 0 ? '+' : ''}${a.currentData.change.toFixed(2)}` },
                      { label: 'نسبة التغير', key: 'changePct', fmt: (a: ComparisonAsset) => `${a.currentData.changePercent >= 0 ? '▲' : '▼'} ${Math.abs(a.currentData.changePercent).toFixed(2)}%` },
                      { label: 'الفئة', key: 'category', fmt: (a: ComparisonAsset) => CATEGORY_LABELS[a.category] || a.category },
                      { label: 'المنطقة', key: 'region', fmt: (a: ComparisonAsset) => REGION_LABELS[a.region] || a.region },
                      { label: 'أعلى سعر (30 يوم)', key: 'high', fmt: (a: ComparisonAsset) => a.keyStats.high30d.toLocaleString() },
                      { label: 'أدنى سعر (30 يوم)', key: 'low', fmt: (a: ComparisonAsset) => a.keyStats.low30d.toLocaleString() },
                      { label: 'المتوسط (30 يوم)', key: 'avg', fmt: (a: ComparisonAsset) => a.keyStats.avg30d.toLocaleString() },
                      { label: 'التذبذب', key: 'vol', fmt: (a: ComparisonAsset) => `${a.keyStats.volatility.toFixed(2)}%` },
                      { label: 'المدى', key: 'range', fmt: (a: ComparisonAsset) => a.keyStats.range.toLocaleString() },
                      { label: 'موقع في المدى', key: 'pos', fmt: (a: ComparisonAsset) => `${a.keyStats.positionInRange}%` },
                    ].map((row) => (
                      <tr key={row.key} style={{ borderBottom: '1px solid var(--border3)' }}>
                        <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--text2)' }}>{row.label}</td>
                        {comparison.map((asset) => {
                          const isChangeRow = row.key === 'change' || row.key === 'changePct';
                          const val = row.fmt(asset);
                          return (
                            <td
                              key={asset.symbol}
                              className="py-2.5 px-3 font-mono-price font-bold"
                              style={{
                                color: isChangeRow
                                  ? asset.currentData.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)'
                                  : 'var(--text)',
                              }}
                              suppressHydrationWarning
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Correlation Tab */}
            {activeTab === 'correlation' && (
              <div className="glass-card p-5 mb-6">
                <div className="sh mb-4">
                  <div className="sh-title">مصفوفة الارتباط</div>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>بناءً على التغيرات اليومية (30 يوم)</span>
                </div>
                {correlations.length === 0 ? (
                  <p className="text-center text-[12px] py-4" style={{ color: 'var(--text3)' }}>اختر أصلين على الأقل لعرض الارتباط</p>
                ) : (
                  <div className="space-y-3">
                    {correlations.map((corr) => (
                      <div
                        key={`${corr.symbol1}-${corr.symbol2}`}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: 'var(--bg2)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>{corr.symbol1}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>↔</span>
                          <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--purple)' }}>{corr.symbol2}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px]" style={{ color: getCorrelationColor(corr.correlation) }}>
                            {getCorrelationLabel(corr.correlation)}
                          </span>
                          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.abs(corr.correlation) * 100}%`,
                                background: getCorrelationColor(corr.correlation),
                              }}
                            />
                          </div>
                          <span className="font-mono-price text-[12px] font-bold" style={{ color: getCorrelationColor(corr.correlation) }}>
                            {corr.correlation.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Statistics Comparison Cards */}
                <div className="mt-6">
                  <div className="sh mb-3">
                    <div className="sh-title">إحصائيات رئيسية</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {comparison.map((asset, idx) => (
                      <div key={asset.symbol} className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                          <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{asset.nameAr}</span>
                          <span className="font-mono-price text-[10px]" style={{ color: 'var(--text3)' }}>{asset.symbol}</span>
                        </div>
                        {asset.history30d.length >= 2 && (
                          <MiniSparkline
                            data={asset.history30d.map((h) => h.value)}
                            color={CHART_COLORS[idx % CHART_COLORS.length]}
                            width={120}
                            height={30}
                            showArea
                          />
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>التذبذب</div>
                            <div className="font-mono-price text-[11px] font-bold" style={{ color: 'var(--gold)' }}>{asset.keyStats.volatility.toFixed(2)}%</div>
                          </div>
                          <div>
                            <div className="text-[9px]" style={{ color: 'var(--text3)' }}>موقع المدى</div>
                            <div className="font-mono-price text-[11px] font-bold" style={{ color: asset.keyStats.positionInRange > 70 ? 'var(--bull)' : asset.keyStats.positionInRange < 30 ? 'var(--bear)' : 'var(--text)' }}>
                              {asset.keyStats.positionInRange}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </main>
  );
}
