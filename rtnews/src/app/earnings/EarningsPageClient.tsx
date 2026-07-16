'use client';

import { useEffect, useState } from 'react';

/* ─── Types ─── */
interface EarningsItem {
  symbol: string;
  company: string;
  date: string;
  timing: string;
  epsExpected: number | null;
  epsPrevious: number | null;
  revenueExpected: string;
  aiPrediction: string;
  aiConfidence: number;
  expectedMove: string;
  source: string;
}

type TabKey = 'thisWeek' | 'nextWeek' | 'thisMonth';

/* ─── Helpers ─── */
function getPredictionStyle(
  pred: string
): { text: string; color: string; bg: string; icon: string } {
  if (pred === 'beat')
    return { text: 'تجاوز', color: 'var(--up)', bg: 'var(--up-dim)', icon: '▲' };
  if (pred === 'miss')
    return { text: 'إخفاق', color: 'var(--down)', bg: 'var(--down-dim)', icon: '▼' };
  return { text: 'ضمن التوقعات', color: 'var(--text-2)', bg: 'var(--surface-2)', icon: '●' };
}

function formatEarningsCountdown(dateStr: string): { text: string; isUrgent: boolean } {
  const target = new Date(dateStr).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return { text: 'اليوم', isUrgent: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const isUrgent = diff < 2 * 86400000; // less than 2 days
  if (days > 0) return { text: `${days} يوم`, isUrgent };
  return { text: `${hours} ساعة`, isUrgent: true };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'short',
  });
}

/* ─── Featured Earnings Card ─── */
function FeaturedCard({ item }: { item: EarningsItem }) {
  const pred = getPredictionStyle(item.aiPrediction);
  const cd = formatEarningsCountdown(item.date);
  const epsChange =
    item.epsExpected && item.epsPrevious
      ? ((item.epsExpected - item.epsPrevious) / Math.abs(item.epsPrevious || 1)) * 100
      : null;

  return (
    <div
      className="glass-card-elevated p-6 relative overflow-hidden"
      style={{ borderTop: '3px solid var(--gold)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -20%, var(--gold-dim), transparent)' }}
      />

      <div className="relative z-10">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'var(--gold-dim)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold)">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
          <span className="text-[13px] font-bold" style={{ color: 'var(--gold)' }}>
            إعلان مميز
          </span>
          {cd.isUrgent && (
            <span className="badge-live text-[9px]">
              <span className="live-dot" />
              قريباً
            </span>
          )}
        </div>

        {/* Company Info */}
        <div className="text-center mb-4">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-lg font-bold mb-2"
            style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}
          >
            {item.symbol.slice(0, 2)}
          </div>
          <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--text-1)' }}>
            {item.symbol}
          </div>
          <div className="text-[12px]" style={{ color: 'var(--text-2)' }}>
            {item.company}
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }} suppressHydrationWarning>
            {formatDate(item.date)} —{' '}
            {item.timing === 'after_close' ? 'بعد الإغلاق' : 'قبل الافتتاح'}
          </div>
          <div className="text-[10px] font-mono-price font-bold mt-1" style={{ color: cd.isUrgent ? 'var(--gold)' : 'var(--cyan)' }}>
            بعد {cd.text}
          </div>
        </div>

        {/* EPS & Revenue */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-[12px]">
            <span style={{ color: 'var(--text-3)' }}>EPS المتوقع</span>
            <span className="font-mono-price font-bold" style={{ color: 'var(--text-1)' }}>
              ${(item.epsExpected ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span style={{ color: 'var(--text-3)' }}>EPS السابق</span>
            <span className="font-mono-price" style={{ color: 'var(--text-2)' }}>
              ${(item.epsPrevious ?? 0).toFixed(2)}
            </span>
          </div>
          {epsChange !== null && (
            <div className="flex justify-between text-[12px]">
              <span style={{ color: 'var(--text-3)' }}>التغير المتوقع</span>
              <span
                className="font-mono-price font-bold"
                style={{ color: epsChange >= 0 ? 'var(--up)' : 'var(--down)' }}
              >
                {epsChange >= 0 ? '+' : ''}
                {epsChange.toFixed(1)}%
              </span>
            </div>
          )}
          <div className="flex justify-between text-[12px]">
            <span style={{ color: 'var(--text-3)' }}>الإيرادات</span>
            <span className="font-mono-price font-bold" style={{ color: 'var(--text-1)' }}>
              {item.revenueExpected}
            </span>
          </div>
          {item.expectedMove && (
            <div className="flex justify-between text-[12px]">
              <span style={{ color: 'var(--text-3)' }}>التأثير المتوقع</span>
              <span
                className="font-mono-price font-bold"
                style={{
                  color:
                    parseFloat(item.expectedMove) >= 5
                      ? 'var(--down)'
                      : parseFloat(item.expectedMove) >= 3
                        ? 'var(--gold)'
                        : 'var(--text-2)',
                }}
              >
                {item.expectedMove}%
              </span>
            </div>
          )}
        </div>

        {/* AI Prediction */}
        <div
          className="p-3 rounded-xl"
          style={{
            background: 'var(--violet-dim)',
            border: '1px solid var(--rim-strong)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="badge-ai text-[8px] px-1.5 py-0.5">AI</span>
              <span className="text-[11px] font-bold" style={{ color: 'var(--purple)' }}>
                التوقع
              </span>
            </div>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: pred.bg, color: pred.color }}
            >
              {pred.icon} {pred.text}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${item.aiConfidence || 50}%`,
                  background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                }}
              />
            </div>
            <span className="font-mono-price text-[11px] font-bold" style={{ color: 'var(--purple)' }}>
              {item.aiConfidence || 50}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('thisWeek');
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch('/api/markets/earnings', { cache: 'no-store' });
        const data = await res.json();
        if (data.earnings?.length > 0) setEarnings(data.earnings);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
    const interval = setInterval(fetchEarnings, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter earnings based on activeTab
  const filteredEarnings = earnings.filter((item) => {
    const itemDate = new Date(item.date);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfThisWeek = new Date(startOfToday);
    endOfThisWeek.setDate(endOfThisWeek.getDate() + (7 - endOfThisWeek.getDay()));
    const endOfNextWeek = new Date(endOfThisWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (activeTab === 'thisWeek') return itemDate >= startOfToday && itemDate <= endOfThisWeek;
    if (activeTab === 'nextWeek') return itemDate > endOfThisWeek && itemDate <= endOfNextWeek;
    if (activeTab === 'thisMonth') return itemDate >= startOfToday && itemDate <= endOfMonth;
    return true;
  });

  const featured = filteredEarnings[0];
  const tabOptions: { key: TabKey; label: string }[] = [
    { key: 'thisWeek', label: 'هذا الأسبوع' },
    { key: 'nextWeek', label: 'الأسبوع القادم' },
    { key: 'thisMonth', label: 'هذا الشهر' },
  ];

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        <div className="max-w-[1280px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
          {/* ── Page Header ── */}
          <div className="sh mb-2">
            <div className="sh-title">
              أرباح الشركات
              <span className="badge-ai text-[10px]">AI PREDICTIONS</span>
            </div>
            {mounted && (
              <span className="font-mono-price text-[11px]" style={{ color: 'var(--text-3)' }}>
                {filteredEarnings.length} شركة
              </span>
            )}
          </div>
          <p className="text-[13px] mb-5" style={{ color: 'var(--text-2)' }}>
            إعلانات الأرباح الفصلية القادمة مع توقعات AI
          </p>

          {/* ── Tab Bar ── */}
          <div
            className="flex items-center gap-1 mb-5"
            style={{ borderBottom: '1px solid var(--rim)' }}
          >
            {tabOptions.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-underline ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Loading State ── */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="glass-card p-6" style={{ height: '350px' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: 'var(--r3)' }} />
                  <div>
                    <div className="skeleton" style={{ height: '16px', width: '80px', marginBottom: '6px' }} />
                    <div className="skeleton" style={{ height: '12px', width: '120px' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: '12px', width: '70%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--r)' }} />
              </div>
              <div className="lg:col-span-2 glass-card p-6" style={{ height: '350px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2"
                    style={{ borderBottom: i < 3 ? '1px solid var(--rim)' : 'none' }}
                  >
                    <div className="skeleton" style={{ width: '40px', height: '10px' }} />
                    <div className="skeleton" style={{ width: '80px', height: '10px' }} />
                    <div className="skeleton" style={{ width: '50px', height: '10px' }} />
                    <div className="skeleton" style={{ width: '40px', height: '10px' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredEarnings.length === 0 ? (
            /* ── Empty State ── */
            <div className="glass-card p-8 text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-3)"
                strokeWidth="1.5"
                className="mx-auto mb-3"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>
                لا توجد بيانات أرباح للفترة المحددة
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* ── Featured Earning ── */}
              {featured && <FeaturedCard item={featured} />}

              {/* ── Earnings Table ── */}
              <div className="lg:col-span-2 glass-card overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--rim)' }}>
                        <th className="text-right p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          الشركة
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          التاريخ
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          الوقت
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          EPS متوقع
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          EPS سابق
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          العد التنازلي
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          توقع AI
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          التأثير
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEarnings.map((item) => {
                        const pred = getPredictionStyle(item.aiPrediction);
                        const cd = formatEarningsCountdown(item.date);
                        return (
                          <tr
                            key={item.symbol}
                            className="transition-colors"
                            style={{
                              borderBottom: '1px solid var(--rim)',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            {/* Company */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                  style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}
                                >
                                  {item.symbol.slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className="font-mono-price font-bold truncate"
                                    style={{ color: 'var(--text-1)' }}
                                  >
                                    {item.symbol}
                                  </div>
                                  <div
                                    className="text-[10px] truncate"
                                    style={{ color: 'var(--text-3)' }}
                                  >
                                    {item.company}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td
                              className="p-3 text-center"
                              style={{ color: 'var(--text-2)' }}
                              suppressHydrationWarning
                            >
                              {formatShortDate(item.date)}
                            </td>

                            {/* Timing */}
                            <td className="p-3 text-center">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                                style={{
                                  background: 'var(--surface-2)',
                                  color: 'var(--text-3)',
                                }}
                              >
                                {item.timing === 'after_close' ? 'بعد الإغلاق' : 'قبل الافتتاح'}
                              </span>
                            </td>

                            {/* EPS Expected */}
                            <td
                              className="p-3 text-center font-mono-price font-bold"
                              style={{ color: 'var(--text-1)' }}
                            >
                              ${(item.epsExpected ?? 0).toFixed(2)}
                            </td>

                            {/* EPS Previous */}
                            <td
                              className="p-3 text-center font-mono-price"
                              style={{ color: 'var(--text-2)' }}
                            >
                              ${(item.epsPrevious ?? 0).toFixed(2)}
                            </td>

                            {/* Countdown */}
                            <td className="p-3 text-center">
                              {mounted && (
                                <span
                                  className="font-mono-price text-[11px] font-bold"
                                  style={{
                                    color: cd.isUrgent ? 'var(--gold)' : 'var(--text-2)',
                                  }}
                                >
                                  {cd.text}
                                </span>
                              )}
                            </td>

                            {/* AI Prediction */}
                            <td className="p-3 text-center">
                              <span
                                className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                                style={{ background: pred.bg, color: pred.color }}
                              >
                                {pred.icon} {pred.text}
                              </span>
                            </td>

                            {/* Expected Move */}
                            <td className="p-3 text-center">
                              {item.expectedMove ? (
                                <span
                                  className="font-mono-price text-[12px] font-bold"
                                  style={{
                                    color:
                                      parseFloat(item.expectedMove) >= 5
                                        ? 'var(--down)'
                                        : parseFloat(item.expectedMove) >= 3
                                          ? 'var(--gold)'
                                          : 'var(--text-2)',
                                  }}
                                >
                                  {item.expectedMove}%
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-3)' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Earnings Calendar Grid ── */}
          {!loading && filteredEarnings.length > 1 && (
            <div className="mt-5">
              <div className="sh">
                <div className="sh-title">جميع الإعلانات</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredEarnings.slice(1).map((item) => {
                  const pred = getPredictionStyle(item.aiPrediction);
                  const cd = formatEarningsCountdown(item.date);

                  return (
                    <div
                      key={item.symbol}
                      className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                      style={{ borderInlineStart: `3px solid ${pred.color}` }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}
                          >
                            {item.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div
                              className="font-mono-price text-[13px] font-bold"
                              style={{ color: 'var(--text-1)' }}
                            >
                              {item.symbol}
                            </div>
                            <div
                              className="text-[10px] truncate max-w-[100px]"
                              style={{ color: 'var(--text-3)' }}
                            >
                              {item.company}
                            </div>
                          </div>
                        </div>
                        <span className="badge-ai text-[8px] px-1.5 py-0.5">AI</span>
                      </div>

                      {/* Date & Timing */}
                      <div className="flex items-center gap-2 text-[11px] mb-3">
                        <span style={{ color: 'var(--text-2)' }} suppressHydrationWarning>
                          {formatShortDate(item.date)}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
                        >
                          {item.timing === 'after_close' ? 'بعد الإغلاق' : 'قبل الافتتاح'}
                        </span>
                      </div>

                      {/* EPS */}
                      <div className="flex items-center gap-3 text-[11px] mb-3">
                        <div>
                          <span style={{ color: 'var(--text-3)' }}>EPS </span>
                          <span
                            className="font-mono-price font-bold"
                            style={{ color: 'var(--text-1)' }}
                          >
                            ${(item.epsExpected ?? 0).toFixed(2)}
                          </span>
                        </div>
                        {item.expectedMove && (
                          <span
                            className="font-mono-price font-bold"
                            style={{
                              color:
                                parseFloat(item.expectedMove) >= 5
                                  ? 'var(--down)'
                                  : 'var(--gold)',
                            }}
                          >
                            {item.expectedMove}%
                          </span>
                        )}
                      </div>

                      {/* AI Prediction Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: pred.color }}
                          >
                            {pred.icon} {pred.text}
                          </span>
                          <span
                            className="font-mono-price text-[10px] font-bold"
                            style={{ color: 'var(--purple)' }}
                          >
                            {item.aiConfidence || 50}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${item.aiConfidence || 50}%`,
                              background: `linear-gradient(90deg, var(--cyan), ${pred.color})`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Countdown Footer */}
                      {mounted && (
                        <div
                          className="flex items-center gap-1.5 text-[10px] pt-2"
                          style={{ borderTop: '1px solid var(--rim)' }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={cd.isUrgent ? 'var(--gold)' : 'var(--cyan)'}
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                          </svg>
                          <span style={{ color: 'var(--text-3)' }}>بعد</span>
                          <span
                            className="font-mono-price font-bold"
                            style={{
                              color: cd.isUrgent ? 'var(--gold)' : 'var(--cyan)',
                            }}
                          >
                            {cd.text}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

    </main>
  );
}
