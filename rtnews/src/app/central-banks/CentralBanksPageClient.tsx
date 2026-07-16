'use client';

import { useEffect, useState } from 'react';

/* ─── Types ─── */
interface CentralBank {
  id: string;
  name: string;
  country: string;
  flag: string;
  currentRate: number | null;
  previousRate: number | null;
  nextMeetingDate: string;
  aiPrediction: string;
  aiConfidence: number;
  dataSource?: string;
  predictionSource?: string;
  isDataReal?: boolean;
}

/* ─── Helpers ─── */
function getPredictionStyle(pred: string): { text: string; color: string; bg: string; icon: string } {
  if (pred === 'raise')
    return { text: 'رفع', color: 'var(--down)', bg: 'var(--down-dim)', icon: '▲' };
  if (pred === 'cut')
    return { text: 'خفض', color: 'var(--up)', bg: 'var(--up-dim)', icon: '▼' };
  return { text: 'ثبات', color: 'var(--text-2)', bg: 'var(--surface-2)', icon: '●' };
}

function formatMeetingCountdown(dateStr: string): { text: string; isUrgent: boolean } {
  const target = new Date(dateStr).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return { text: 'انتهى', isUrgent: false };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const isUrgent = diff < 3 * 86400000; // less than 3 days
  if (days > 0) return { text: `${days} يوم`, isUrgent };
  return { text: `${hours} ساعة`, isUrgent: true };
}

/* ─── Fed Countdown Banner ─── */
function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [countdownLabel, setCountdownLabel] = useState<string>('');
  const [fedPrediction, setFedPrediction] = useState<string>('hold');

  useEffect(() => {
    const fetchNextMeeting = async () => {
      try {
        const res = await fetch('/api/markets/central-banks', { cache: 'no-store' });
        const data = await res.json();
        const fed = data.banks?.find(
          (b: CentralBank) => b.id === 'fed' || b.name?.includes('Federal') || b.country === 'US'
        );
        if (fed?.nextMeetingDate) {
          const meetingTime = new Date(fed.nextMeetingDate).getTime();
          if (meetingTime > Date.now()) {
            setTargetDate(meetingTime);
            setCountdownLabel(
              new Date(fed.nextMeetingDate).toLocaleDateString('ar-SA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            );
            if (fed.aiPrediction) setFedPrediction(fed.aiPrediction);
            return;
          }
        }
      } catch {
        /* API unavailable */
      }
      setCountdownLabel('');
    };
    fetchNextMeeting();
  }, []);

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, targetDate - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pred = getPredictionStyle(fedPrediction);

  return (
    <div
      className="glass-card-elevated p-5 mb-5"
      style={{
        borderInlineStart: '3px solid var(--gold)',
        background: 'var(--gold-dim)',
      }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--gold-dim)' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M12 12h.01" />
              <path d="M17 12h.01" />
              <path d="M7 12h.01" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold font-heading" style={{ color: 'var(--gold)' }}>
              اجتماع بنك الاحتياطي الفيدرالي
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {countdownLabel ? `الاجتماع القادم: ${countdownLabel}` : 'الاجتماع القادم'}
            </div>
          </div>
        </div>

        {targetDate && (
          <div className="flex items-center gap-2">
            {[
              { val: timeLeft.days, label: 'أيام' },
              { val: timeLeft.hours, label: 'ساعة' },
              { val: timeLeft.minutes, label: 'دقيقة' },
              { val: timeLeft.seconds, label: 'ثانية' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="rounded-xl px-3 py-2 text-center min-w-[52px]"
                  style={{ background: 'var(--gold-dim)' }}
                >
                  <div className="font-mono-price text-xl font-bold" style={{ color: 'var(--gold)' }}>
                    {String(item.val).padStart(2, '0')}
                  </div>
                  <div className="text-[8px]" style={{ color: 'var(--text-3)' }}>
                    {item.label}
                  </div>
                </div>
                {i < 3 && (
                  <span className="text-lg" style={{ color: 'var(--gold)', opacity: 0.4 }}>
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="badge-ai text-[10px]">AI</span>
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-2)' }}>
            التوقع:
          </span>
          <span
            className="text-[12px] px-3 py-1 rounded-full font-bold"
            style={{ background: pred.bg, color: pred.color }}
          >
            {pred.icon} {pred.text}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function CentralBanksPage() {
  const [banks, setBanks] = useState<CentralBank[]>([]);
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
    const fetchBanks = async () => {
      try {
        const res = await fetch('/api/markets/central-banks', { cache: 'no-store' });
        const data = await res.json();
        if (data.banks?.length > 0) setBanks(data.banks);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
    const interval = setInterval(fetchBanks, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        <div className="max-w-[1280px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
          {/* ── Page Header ── */}
          <div className="sh mb-2">
            <div className="sh-title">
              البنوك المركزية العربية
              <span className="badge-exclusive">حصري عربياً</span>
            </div>
            {mounted && (
              <span className="font-mono-price text-[11px]" style={{ color: 'var(--text-3)' }}>
                {banks.length} بنك
              </span>
            )}
          </div>
          <p className="text-[13px] mb-5" style={{ color: 'var(--text-2)' }}>
            قرارات الفائدة، الاجتماعات القادمة، وتأثيرها على عملاتك
          </p>

          {/* ── Fed Countdown Banner ── */}
          <CountdownBanner />

          {/* ── Loading State ── */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass-card p-4" style={{ height: '220px' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                    <div>
                      <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '4px' }} />
                      <div className="skeleton" style={{ height: '10px', width: '50px' }} />
                    </div>
                  </div>
                  <div className="skeleton" style={{ height: '32px', width: '60%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '6px', width: '100%', marginBottom: '12px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '70%' }} />
                </div>
              ))}
            </div>
          ) : banks.length === 0 ? (
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
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M12 12h.01" />
              </svg>
              <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>
                لا توجد بيانات بنوك مركزية حالياً
              </p>
            </div>
          ) : (
            <>
              {/* ── Bank Cards Grid ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                {banks.map((bank) => {
                  const pred = getPredictionStyle(bank.aiPrediction);
                  const rateChange = (bank.currentRate ?? 0) - (bank.previousRate ?? 0);
                  const cd = formatMeetingCountdown(bank.nextMeetingDate);

                  return (
                    <div
                      key={bank.id}
                      className="glass-card p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                      style={{ borderInlineStart: `3px solid ${pred.color}` }}
                    >
                      {/* Bank Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{bank.flag}</span>
                        <div className="min-w-0">
                          <div
                            className="text-[13px] font-semibold truncate"
                            style={{ color: 'var(--text-1)' }}
                          >
                            {bank.name}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                            {bank.country}
                          </div>
                        </div>
                      </div>

                      {/* Current Rate */}
                      <div className="mb-3">
                        <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-3)' }}>
                          الفائدة الحالية
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono-price text-xl font-bold"
                            style={{ color: 'var(--text-1)' }}
                          >
                            {(bank.currentRate ?? 0).toFixed(2)}%
                          </span>
                          {rateChange !== 0 && (
                            <span
                              className="font-mono-price text-[10px] font-bold"
                              style={{ color: rateChange > 0 ? 'var(--down)' : 'var(--up)' }}
                            >
                              {rateChange > 0 ? '+' : ''}
                              {(rateChange ?? 0).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        {/* Rate Progress Bar */}
                        <div className="progress-bar mt-2">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(((bank.currentRate ?? 0) / 30) * 100, 100)}%`,
                              background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                            }}
                          />
                        </div>
                      </div>

                      {/* Next Meeting */}
                      <div className="mb-3">
                        <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-3)' }}>
                          الاجتماع القادم
                        </div>
                        <div
                          className="font-mono-price text-[12px] font-medium"
                          style={{ color: cd.isUrgent ? 'var(--gold)' : 'var(--text-1)' }}
                          suppressHydrationWarning
                        >
                          {new Date(bank.nextMeetingDate).toLocaleDateString('ar-SA', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                        {mounted && (
                          <div
                            className="text-[10px] font-medium mt-0.5"
                            style={{ color: cd.isUrgent ? 'var(--gold)' : 'var(--text-3)' }}
                          >
                            بعد {cd.text}
                          </div>
                        )}
                      </div>

                      {/* AI Prediction */}
                      <div
                        className="pt-2"
                        style={{ borderTop: '1px solid var(--rim)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="badge-ai text-[8px] px-1.5 py-0.5">{bank.predictionSource === 'market-implied' ? 'AI' : '📈'}</span>
                            <span className="text-[10px] font-bold" style={{ color: pred.color }}>
                              {pred.icon} {pred.text}
                            </span>
                          </div>
                          {bank.aiConfidence > 0 && bank.predictionSource === 'market-implied' && (
                            <span
                              className="font-mono-price text-[10px] font-bold"
                              style={{ color: 'var(--purple)' }}
                            >
                              {bank.aiConfidence}%
                            </span>
                          )}
                          {bank.predictionSource === 'reference' && (
                            <span className="text-[8px]" style={{ color: 'var(--text-3)' }}>مرجعي</span>
                          )}
                        </div>
                        {bank.aiConfidence > 0 && bank.predictionSource === 'market-implied' && (
                          <div className="progress-bar mt-1.5">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${bank.aiConfidence}%`,
                                background: 'var(--purple)',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Comparison Table ── */}
              <div className="sh mt-2">
                <div className="sh-title">مقارنة البنوك المركزية</div>
              </div>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--rim)' }}>
                        <th className="text-right p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          البنك
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          الفائدة الحالية
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          السابقة
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          التغيير
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          الاجتماع القادم
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          العد التنازلي
                        </th>
                        <th className="text-center p-3 font-bold" style={{ color: 'var(--text-3)' }}>
                          توقع AI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {banks.map((bank) => {
                        const pred = getPredictionStyle(bank.aiPrediction);
                        const rateChange = (bank.currentRate ?? 0) - (bank.previousRate ?? 0);
                        const cd = formatMeetingCountdown(bank.nextMeetingDate);
                        return (
                          <tr
                            key={bank.id}
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
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{bank.flag}</span>
                                <span className="font-medium" style={{ color: 'var(--text-1)' }}>
                                  {bank.name}
                                </span>
                              </div>
                            </td>
                            <td
                              className="p-3 text-center font-mono-price font-bold"
                              style={{ color: 'var(--text-1)' }}
                            >
                              {(bank.currentRate ?? 0).toFixed(2)}%
                            </td>
                            <td
                              className="p-3 text-center font-mono-price"
                              style={{ color: 'var(--text-2)' }}
                            >
                              {(bank.previousRate ?? 0).toFixed(2)}%
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className="text-[11px] px-2.5 py-1 rounded-full font-mono-price font-bold"
                                style={{
                                  background:
                                    rateChange > 0
                                      ? 'var(--down-dim)'
                                      : rateChange < 0
                                        ? 'var(--up-dim)'
                                        : 'var(--surface-2)',
                                  color:
                                    rateChange > 0
                                      ? 'var(--down)'
                                      : rateChange < 0
                                        ? 'var(--up)'
                                        : 'var(--text-3)',
                                }}
                              >
                                {rateChange > 0 ? '▲ رفع' : rateChange < 0 ? '▼ خفض' : '● ثبات'}
                              </span>
                            </td>
                            <td
                              className="p-3 text-center text-[12px]"
                              style={{ color: 'var(--text-2)' }}
                              suppressHydrationWarning
                            >
                              {new Date(bank.nextMeetingDate).toLocaleDateString('ar-SA', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </td>
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
                            <td className="p-3 text-center">
                              <span
                                className="text-[11px] px-2.5 py-1 rounded-full font-bold"
                                style={{ background: pred.bg, color: pred.color }}
                              >
                                {pred.icon} {pred.text}
                                {bank.aiConfidence > 0 && bank.predictionSource === 'market-implied' && (
                                  <span className="font-mono-price mr-1">({bank.aiConfidence}%)</span>
                                )}
                              </span>
                              {bank.predictionSource === 'reference' && (
                                <div className="text-[8px] mt-0.5" style={{ color: 'var(--text-3)' }}>مرجعي</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </main>
  );
}
