'use client';

import { useState, useEffect } from 'react';

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

function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [countdownLabel, setCountdownLabel] = useState<string>('');
  const [fedPrediction, setFedPrediction] = useState<{ aiPrediction: string; aiConfidence: number } | null>(null);

  // Dynamically fetch the next FOMC meeting date from the API
  useEffect(() => {
    const fetchNextMeeting = async () => {
      try {
        const res = await fetch('/api/markets/central-banks', { cache: 'no-store' });
        const data = await res.json();
        // Look for the Fed in the banks data and use its nextMeetingDate
        const fed = data.banks?.find((b: any) => b.id === 'fed' || b.name?.includes('Federal') || b.country === 'US');
        if (fed) {
          // Store Fed AI prediction if available
          if (fed.aiPrediction) {
            setFedPrediction({ aiPrediction: fed.aiPrediction, aiConfidence: fed.aiConfidence ?? 0 });
          }
          if (fed.nextMeetingDate) {
            const meetingTime = new Date(fed.nextMeetingDate).getTime();
            if (meetingTime > Date.now()) {
              setTargetDate(meetingTime);
              setCountdownLabel(new Date(fed.nextMeetingDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' }));
            }
          }
          return;
        }
      } catch {
        // API unavailable — fall through to generic label
      }
      // Fallback: show generic label without countdown
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

  return (
    <div className="glass-card-elevated p-5 mb-5" style={{ background: 'rgba(232,160,32,0.04)', border: '1px solid rgba(232,160,32,0.15)' }}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div>
            <span className="text-[14px] font-bold" style={{ color: 'var(--gold)' }}>اجتماع بنك الاحتياطي الفيدرالي</span>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{countdownLabel ? `الاجتماع القادم: ${countdownLabel}` : 'الاجتماع القادم'}</div>
          </div>
        </div>
        {targetDate ? (
          <div className="flex items-center gap-2">
            {[
              { val: timeLeft.days, label: 'أيام' },
              { val: timeLeft.hours, label: 'ساعة' },
              { val: timeLeft.minutes, label: 'دقيقة' },
              { val: timeLeft.seconds, label: 'ثانية' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="rounded-xl px-3 py-2 text-center min-w-[52px]" style={{ background: 'rgba(232,160,32,0.1)' }}>
                  <div className="font-mono-price text-xl font-bold" style={{ color: 'var(--gold)' }}>{String(item.val).padStart(2, '0')}</div>
                  <div className="text-[8px]" style={{ color: 'var(--text3)' }}>{item.label}</div>
                </div>
                {i < 3 && <span className="text-lg" style={{ color: 'var(--gold)', opacity: 0.5 }}>:</span>}
              </div>
            ))}
          </div>
        ) : null}
        <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
          {fedPrediction ? (
            <>
              توقع AI: <span className="font-semibold" style={{ color: fedPrediction.aiPrediction === 'raise' ? 'var(--bear)' : fedPrediction.aiPrediction === 'cut' ? 'var(--bull)' : 'var(--text2)' }}>
                {fedPrediction.aiPrediction === 'raise' ? 'رفع الفائدة' : fedPrediction.aiPrediction === 'cut' ? 'خفض الفائدة' : 'ثبات الفائدة'}
              </span>
              {fedPrediction.aiConfidence > 0 && <span className="text-[10px] mr-1" style={{ color: 'var(--text3)' }}>({fedPrediction.aiConfidence}%)</span>}
            </>
          ) : (
            <>توقع AI: <span style={{ color: 'var(--text3)' }}>—</span></>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArabCentralBanks() {
  const [banks, setBanks] = useState<CentralBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanks = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch('/api/markets/central-banks', { cache: 'no-store' });
        const data = await res.json();
        if (data.banks?.length > 0) setBanks(data.banks);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchBanks();
    const interval = setInterval(fetchBanks, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPredictionLabel = (pred: string) => {
    if (pred === 'raise') return { text: 'رفع', color: 'var(--bear)', bg: 'var(--bear2)' };
    if (pred === 'cut') return { text: 'خفض', color: 'var(--bull)', bg: 'var(--bull2)' };
    return { text: 'ثبات', color: 'var(--text2)', bg: 'rgba(100,116,139,0.12)' };
  };

  return (
    <section id="central-banks" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <h2>البنوك المركزية العربية</h2>
          <span className="badge-exclusive">حصري عربياً</span>
        </div>
        <p className="text-[14px] mb-5" style={{ color: 'var(--text2)' }}>قرارات الفائدة، الاجتماعات القادمة، وتأثيرها على عملاتك</p>

        <CountdownBanner />

        {loading ? (
          <div className="flex flex-col gap-2 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-3" style={{ height: '52px' }}>
                <div className="skeleton" style={{ height: '16px', width: '100%' }} />
              </div>
            ))}
          </div>
        ) : banks.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>لا توجد بيانات بنوك مركزية حالياً</span>
          </div>
        ) : (
          <>
            {/* V44: Horizontal bank cards — عرضي بدلاً من طولي */}
            <div className="flex flex-col gap-2 mb-5">
              {banks.map((bank) => {
                const pred = getPredictionLabel(bank.aiPrediction);
                const rateChange = (bank.currentRate ?? 0) - (bank.previousRate ?? 0);
                return (
                  <div
                    key={bank.id}
                    className="glass-card cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      borderInlineStart: `3px solid ${pred.color}`,
                    }}
                  >
                    {/* Flag */}
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{bank.flag}</span>

                    {/* Name + Country */}
                    <div style={{ flex: '0 0 auto', minWidth: 100 }}>
                      <div className="text-[13px] font-bold" style={{ color: 'var(--text-head)', lineHeight: 1.4 }}>{bank.name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{bank.country}</div>
                    </div>

                    {/* Rate */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <span className="font-mono-price text-lg font-bold" style={{ color: 'var(--cyan)' }}>{(bank.currentRate ?? 0).toFixed(2)}%</span>
                      {rateChange !== 0 && (
                        <span className="font-mono-price text-[11px] font-bold" style={{ color: rateChange > 0 ? 'var(--bear)' : 'var(--bull)' }}>
                          {rateChange > 0 ? '▲' : '▼'} {Math.abs(rateChange).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Next Meeting */}
                    <div style={{ flex: '0 0 auto', textAlign: 'center' as const }}>
                      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>القرار القادم</div>
                      <div className="text-[11px] font-semibold" style={{ color: 'var(--text2)' }} suppressHydrationWarning>
                        {new Date(bank.nextMeetingDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>

                    {/* AI Prediction */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: pred.bg, color: pred.color }}>
                        {pred.text}
                      </span>
                      {bank.aiConfidence > 0 && bank.predictionSource === 'market-implied' && (
                        <span className="font-mono-price text-[10px]" style={{ color: 'var(--purple)' }}>{bank.aiConfidence}%</span>
                      )}
                      {bank.predictionSource === 'reference' && (
                        <span className="text-[8px]" style={{ color: 'var(--text3)' }}>مرجعي</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="text-right p-3 font-medium" style={{ color: 'var(--text3)' }}>البنك</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>الفائدة الحالية</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>السابقة</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>التغيير</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>التالي</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>توقع AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banks.map((bank) => {
                      const pred = getPredictionLabel(bank.aiPrediction);
                      const rateChange = (bank.currentRate ?? 0) - (bank.previousRate ?? 0);
                      return (
                        <tr key={bank.id} className="transition-colors hover:bg-[var(--bg4)]" style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="p-3" style={{ color: 'var(--text)' }}>{bank.flag} {bank.name}</td>
                          <td className="p-3 text-center font-mono-price" style={{ color: 'var(--text)' }}>{(bank.currentRate ?? 0).toFixed(2)}%</td>
                          <td className="p-3 text-center font-mono-price" style={{ color: 'var(--text2)' }}>{(bank.previousRate ?? 0).toFixed(2)}%</td>
                          <td className="p-3 text-center">
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono-price" style={{
                              background: rateChange > 0 ? 'var(--bear2)' : rateChange < 0 ? 'var(--bull2)' : 'rgba(100,116,139,0.1)',
                              color: rateChange > 0 ? 'var(--bear)' : rateChange < 0 ? 'var(--bull)' : 'var(--text3)',
                            }}>
                              {rateChange > 0 ? '▲ رفع' : rateChange < 0 ? '▼ خفض' : '● ثبات'}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[12px]" style={{ color: 'var(--text2)' }} suppressHydrationWarning>
                            {new Date(bank.nextMeetingDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: pred.bg, color: pred.color }}>
                              {pred.text}
                              {bank.aiConfidence > 0 && bank.predictionSource === 'market-implied' && (
                                <span className="font-mono-price mr-1">({bank.aiConfidence}%)</span>
                              )}
                            </span>
                            {bank.predictionSource === 'reference' && (
                              <div className="text-[8px] mt-0.5" style={{ color: 'var(--text3)' }}>مرجعي</div>
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
    </section>
  );
}
