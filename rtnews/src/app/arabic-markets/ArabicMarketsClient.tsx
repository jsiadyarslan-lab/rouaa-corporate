'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getIslamicFinanceOverview, GULF_EXCHANGES, COUNTRY_FLAGS } from '@/lib/islamic-finance';
import { ARABIC_MARKET_INDICES } from '@/lib/arabic-markets';

// ─── Types ──────────────────────────────────────────────────

interface MarketIndicator {
  id: string;
  name: string;
  nameAr: string | null;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  category: string;
  lastUpdated: Date;
}

interface EconomicEvent {
  id: string;
  eventName: string;
  eventNameAr: string | null;
  country: string;
  currency: string;
  eventDate: Date;
  importance: string;
  eventType: string;
  forecast: string | null;
  previous: string | null;
}

interface Report {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  marketImpact: string;
  confidenceScore: number;
  publishedAt: Date | null;
}

type ActiveTab = 'overview' | 'islamic' | 'calendar' | 'exchanges';

const IMPACT_COLORS: Record<string, string> = {
  bullish: '#22C55E',
  bearish: '#EF4444',
  neutral: '#F59E0B',
};

const TYPE_LABELS: Record<string, string> = {
  weekly: 'أسبوعي',
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  special: 'خاص',
};

export default function ArabicMarketsClient({
  initialIndicators,
  initialEvents,
  initialReports,
}: {
  initialIndicators: MarketIndicator[];
  initialEvents: EconomicEvent[];
  initialReports: Report[];
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [indicators, setIndicators] = useState(initialIndicators);
  const [loading, setLoading] = useState(false);

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/arabic-markets');
      if (res.ok) {
        const data = await res.json();
        if (data.indices) {
          setIndicators(prev => {
            // Merge with existing indicators
            const map = new Map(prev.map(i => [i.symbol, i]));
            for (const idx of data.indices) {
              map.set(idx.symbol, {
                ...map.get(idx.symbol),
                id: map.get(idx.symbol)?.id || idx.symbol,
                name: idx.name,
                nameAr: idx.nameAr,
                symbol: idx.symbol,
                value: idx.value,
                change: idx.change,
                changePercent: idx.changePercent,
                category: 'index',
                lastUpdated: new Date(idx.lastUpdated),
              });
            }
            return Array.from(map.values());
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh Arabic markets data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, []);

  const islamicData = getIslamicFinanceOverview();

  // Combine indicators with static index definitions for complete picture
  const allIndices = ARABIC_MARKET_INDICES.map(idx => {
    const dbInd = indicators.find(i => i.symbol === idx.symbol);
    return {
      symbol: idx.symbol,
      name: idx.name,
      nameAr: idx.nameAr,
      country: idx.country,
      currency: idx.currency,
      value: dbInd?.value || idx.baseValue,
      change: dbInd?.change || 0,
      changePercent: dbInd?.changePercent || 0,
      lastUpdated: dbInd?.lastUpdated,
    };
  });

  return (
    <div className="min-h-screen" style={{ direction: 'rtl' }}>
      {/* Hero Section */}
      <div className="py-10 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(139,92,246,0.06))' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            🌙 الأسواق العربية
          </h1>
          <p className="text-base mb-6" style={{ color: 'var(--text2)' }}>
            متابعة شاملة لأسواق الخليج العربي والأسواق المالية الإسلامية
          </p>

          {/* Market Summary */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--bull)' }}>
                {allIndices.filter(i => i.changePercent > 0).length}
              </span>
              <span className="text-xs block" style={{ color: 'var(--text3)' }}>صاعد</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--bear)' }}>
                {allIndices.filter(i => i.changePercent < 0).length}
              </span>
              <span className="text-xs block" style={{ color: 'var(--text3)' }}>هابط</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--cyan)' }}>
                {allIndices.length}
              </span>
              <span className="text-xs block" style={{ color: 'var(--text3)' }}>مؤشر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[60px] z-50 px-4"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {([
            { key: 'overview', label: 'نظرة عامة', icon: '📊' },
            { key: 'islamic', label: 'التمويل الإسلامي', icon: '🕌' },
            { key: 'exchanges', label: 'البورصات الخليجية', icon: '🏛️' },
            { key: 'calendar', label: 'الأجندة الاقتصادية', icon: '📅' },
          ] as { key: ActiveTab; label: string; icon: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
              style={{
                background: activeTab === tab.key ? 'rgba(0,229,255,0.12)' : 'transparent',
                color: activeTab === tab.key ? 'var(--cyan)' : 'var(--text3)',
                border: activeTab === tab.key ? '1px solid rgba(0,229,255,0.25)' : '1px solid transparent',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}

          <div className="flex-1" />

          <button
            onClick={refreshData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            {loading ? '⏳' : '🔄'} تحديث
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Market Indices Cards */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                مؤشرات الأسواق العربية
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allIndices.map(idx => (
                  <div key={idx.symbol} className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-lg me-1">{COUNTRY_FLAGS[idx.country] || '🌍'}</span>
                        <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                          {idx.nameAr}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                        style={{ background: 'var(--bg)', color: 'var(--text3)' }}>
                        {idx.symbol}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-bold font-mono-price" style={{ color: 'var(--text)' }}>
                          {idx.value.toLocaleString('en', { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs me-1" style={{ color: 'var(--text3)' }}>
                          {idx.currency}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold"
                          style={{ color: idx.changePercent >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                          {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                        </div>
                        <div className="text-xs"
                          style={{ color: idx.change >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                          {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Movers */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                الأكثر تحركاً
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gainers */}
                <div className="rounded-xl p-4" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--bull)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--bull)' }} />
                    الأعلى صعوداً
                  </h3>
                  {[...allIndices].sort((a, b) => b.changePercent - a.changePercent)
                    .filter(i => i.changePercent > 0)
                    .slice(0, 3)
                    .map(idx => (
                      <div key={idx.symbol} className="flex items-center justify-between py-2 border-b last:border-0"
                        style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{COUNTRY_FLAGS[idx.country]}</span>
                          <span className="text-sm" style={{ color: 'var(--text)' }}>{idx.nameAr}</span>
                        </div>
                        <span className="text-sm font-bold font-mono" style={{ color: 'var(--bull)' }}>
                          +{idx.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>

                {/* Losers */}
                <div className="rounded-xl p-4" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--bear)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--bear)' }} />
                    الأعلى هبوطاً
                  </h3>
                  {[...allIndices].sort((a, b) => a.changePercent - b.changePercent)
                    .filter(i => i.changePercent < 0)
                    .slice(0, 3)
                    .map(idx => (
                      <div key={idx.symbol} className="flex items-center justify-between py-2 border-b last:border-0"
                        style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{COUNTRY_FLAGS[idx.country]}</span>
                          <span className="text-sm" style={{ color: 'var(--text)' }}>{idx.nameAr}</span>
                        </div>
                        <span className="text-sm font-bold font-mono" style={{ color: 'var(--bear)' }}>
                          {idx.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* Recent Reports */}
            {initialReports.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                  أحدث التقارير العربية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {initialReports.map(report => (
                    <Link key={report.id} href={`/reports/${report.slug}`}
                      className="block rounded-xl p-4 transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)' }}>
                          {TYPE_LABELS[report.reportType] || report.reportType}
                        </span>
                        {report.marketImpact && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: `${IMPACT_COLORS[report.marketImpact] || '#F59E0B'}15`,
                              color: IMPACT_COLORS[report.marketImpact] || '#F59E0B',
                            }}>
                            {report.marketImpact === 'bullish' ? 'صاعد' : report.marketImpact === 'bearish' ? 'هابط' : 'محايد'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{report.title}</h3>
                      {report.summary && (
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text2)' }}>{report.summary}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Islamic Finance Tab ── */}
        {activeTab === 'islamic' && (
          <div className="space-y-6">
            {/* Islamic Finance Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 text-center"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <span className="text-2xl font-bold block" style={{ color: 'var(--cyan)' }}>
                  ${islamicData.totalSukukVolume.toFixed(1)}B
                </span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>إجمالي الصكوك</span>
              </div>
              <div className="rounded-xl p-4 text-center"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <span className="text-2xl font-bold block" style={{ color: 'var(--purple)' }}>
                  {islamicData.averageSukukYield.toFixed(2)}%
                </span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>متوسط العائد</span>
              </div>
              <div className="rounded-xl p-4 text-center"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <span className="text-2xl font-bold block" style={{ color: 'var(--bull)' }}>
                  {islamicData.sovereignSukukCount}
                </span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>صكوك سيادية</span>
              </div>
              <div className="rounded-xl p-4 text-center"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <span className="text-2xl font-bold block" style={{ color: 'var(--text)' }}>
                  {islamicData.corporateSukukCount}
                </span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>صكوك شركات</span>
              </div>
            </div>

            {/* Islamic Indices */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                المؤشرات الإسلامية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {islamicData.islamicIndices.map(idx => (
                  <div key={idx.symbol} className="rounded-xl p-4"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{idx.nameAr}</span>
                        <span className="text-[10px] block" style={{ color: 'var(--text3)' }}>{idx.provider}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                        style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)' }}>
                        {idx.symbol}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>{idx.descriptionAr}</p>
                    <div className="text-lg font-bold font-mono-price" style={{ color: 'var(--text)' }}>
                      {idx.baseValue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sukuk */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                الصكوك الرئيسية
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg2)' }}>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text3)' }}>الصك</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text3)' }}>الجهة المصدرة</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text3)' }}>الحجم</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text3)' }}>العائد</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text3)' }}>التقييم</th>
                        <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text3)' }}>النوع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {islamicData.sukukData.map((sukuk, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>
                            {sukuk.nameAr}
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--text2)' }}>
                            {sukuk.issuerAr}
                          </td>
                          <td className="px-4 py-3 font-mono" style={{ color: 'var(--text)' }}>
                            ${sukuk.amount}B
                          </td>
                          <td className="px-4 py-3 font-mono" style={{ color: 'var(--cyan)' }}>
                            {sukuk.yield}%
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--bull)' }}>
                              {sukuk.rating}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: sukuk.type === 'sovereign' ? 'rgba(0,229,255,0.1)' : 'rgba(139,92,246,0.1)',
                                color: sukuk.type === 'sovereign' ? 'var(--cyan)' : 'var(--purple)',
                              }}>
                              {sukuk.type === 'sovereign' ? 'سيادي' : 'شركات'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Shariah Screening */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                معايير التوافق الشرعي
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {islamicData.screeningCriteria.map((criteria, i) => (
                  <div key={i} className="rounded-xl p-4"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>
                      {criteria.criterionAr}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
                      {criteria.descriptionAr}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text3)' }}>الحد الأقصى</span>
                      <span className="text-lg font-bold" style={{ color: 'var(--cyan)' }}>
                        {criteria.threshold}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full mt-2" style={{ background: 'var(--bg)' }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${criteria.threshold}%`,
                          background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Exchanges Tab ── */}
        {activeTab === 'exchanges' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              البورصات الخليجية
            </h2>
            {GULF_EXCHANGES.map(exchange => (
              <div key={exchange.code} className="rounded-xl p-5 transition-all hover:scale-[1.005]"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{COUNTRY_FLAGS[exchange.code === 'TADAWUL' ? 'SA' : exchange.code === 'DFM' || exchange.code === 'ADX' ? 'AE' : exchange.code === 'KSE' ? 'KW' : exchange.code === 'QE' ? 'QA' : exchange.code === 'BSE' ? 'BH' : exchange.code === 'MSM' ? 'OM' : 'EG'] || '🏛️'}</span>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{exchange.nameAr}</h3>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>{exchange.countryAr}</span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-mono"
                    style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                    {exchange.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] block" style={{ color: 'var(--text3)' }}>العملة</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{exchange.currency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block" style={{ color: 'var(--text3)' }}>ساعات التداول</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{exchange.tradingHours}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block" style={{ color: 'var(--text3)' }}>القيمة السوقية</span>
                    <span className="text-sm font-bold font-mono" style={{ color: 'var(--text)' }}>{exchange.marketCap}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block" style={{ color: 'var(--text3)' }}>الشركات المدرجة</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{exchange.listedCompanies}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-xs" style={{ color: 'var(--text3)' }}>
                    أيام التداول: {exchange.tradingDays} • تأسست: {exchange.established}
                  </div>
                  {exchange.islamicIndices.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)' }}>
                      🕌 يتضمن مؤشرات إسلامية
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Calendar Tab ── */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              الأحداث الاقتصادية القادمة
            </h2>
            {initialEvents.length > 0 ? (
              <div className="space-y-3">
                {initialEvents.map(event => (
                  <div key={event.id} className="rounded-xl p-4 flex items-start gap-4"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    {/* Date */}
                    <div className="text-center flex-shrink-0" style={{ minWidth: '60px' }}>
                      <span className="text-lg font-bold block" style={{ color: 'var(--cyan)' }}>
                        {new Date(event.eventDate).getDate()}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                        {new Date(event.eventDate).toLocaleDateString('ar-SA', { month: 'short' })}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                          {event.eventNameAr || event.eventName}
                        </span>
                        {event.importance === 'high' || event.importance === 'critical' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: event.importance === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                              color: event.importance === 'critical' ? '#EF4444' : '#F59E0B',
                            }}>
                            {event.importance === 'critical' ? '🔴 حرج' : '🟡 مهم'}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text3)' }}>
                        <span>{COUNTRY_FLAGS[event.country] || ''} {event.country}</span>
                        <span>{event.currency}</span>
                        <span>{new Date(event.eventDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {(event.forecast || event.previous) && (
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          {event.forecast && (
                            <span style={{ color: 'var(--text2)' }}>
                              التوقعات: <strong style={{ color: 'var(--text)' }}>{event.forecast}</strong>
                            </span>
                          )}
                          {event.previous && (
                            <span style={{ color: 'var(--text2)' }}>
                              السابق: <strong style={{ color: 'var(--text)' }}>{event.previous}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>لا توجد أحداث اقتصادية قادمة</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
