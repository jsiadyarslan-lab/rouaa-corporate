'use client';

import { useState, useEffect } from 'react';

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

export default function EarningsCalendar() {
  const [activeTab, setActiveTab] = useState<'thisWeek' | 'nextWeek' | 'thisMonth'>('thisWeek');
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchEarnings = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch('/api/markets/earnings', { cache: 'no-store' });
        const data = await res.json();
        if (data.earnings?.length > 0) setEarnings(data.earnings);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchEarnings();
    const interval = setInterval(fetchEarnings, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPredictionStyle = (pred: string) => {
    if (pred === 'beat') return { text: 'تجاوز', bg: 'var(--bull2)', color: 'var(--bull)' };
    if (pred === 'miss') return { text: 'إخفاق', bg: 'var(--bear2)', color: 'var(--bear)' };
    return { text: 'ضمن التوقعات', bg: 'rgba(100,116,139,0.12)', color: 'var(--text3)' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <section id="earnings" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <h2>أرباح الشركات</h2>
          <span className="badge-ai text-[10px]">AI PREDICTIONS</span>
        </div>
        <p className="text-[14px] mb-5" style={{ color: 'var(--text2)' }}>إعلانات الأرباح الفصلية القادمة مع توقعات AI</p>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          {([
            { key: 'thisWeek' as const, label: 'هذا الأسبوع' },
            { key: 'nextWeek' as const, label: 'الأسبوع القادم' },
            { key: 'thisMonth' as const, label: 'هذا الشهر' },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`tab-underline ${activeTab === tab.key ? 'active' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-card p-6" style={{ height: '300px' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '50%' }} />
                <div>
                  <div className="skeleton" style={{ height: '16px', width: '80px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '120px' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: '12px', width: '70%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '12px', width: '50%', marginBottom: '16px' }} />
              <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--r)' }} />
            </div>
            <div className="lg:col-span-2 glass-card p-6" style={{ height: '300px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div className="skeleton" style={{ width: '40px', height: '10px' }} />
                  <div className="skeleton" style={{ width: '80px', height: '10px' }} />
                  <div className="skeleton" style={{ width: '50px', height: '10px' }} />
                  <div className="skeleton" style={{ width: '40px', height: '10px' }} />
                </div>
              ))}
            </div>
          </div>
        ) : filteredEarnings.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>لا توجد بيانات أرباح للفترة المحددة</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Featured Earning */}
            <div className="glass-card-elevated p-6 relative overflow-hidden" style={{ borderTop: '3px solid var(--gold)' }}>
              <div className="absolute top-0 left-0 right-0 h-[100px]" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(232,160,32,0.06), transparent)' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--gold2)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold)"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                  </div>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--gold)' }}>إعلان اليوم</span>
                </div>

                {featured && (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-lg font-bold mb-2" style={{ background: 'var(--bg4)', color: 'var(--text)' }}>
                        {featured.symbol.slice(0, 2)}
                      </div>
                      <div className="font-mono-price text-lg font-bold" style={{ color: 'var(--text)' }}>{featured.symbol}</div>
                      <div className="text-[12px]" style={{ color: 'var(--text2)' }}>{featured.company}</div>
                      <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }} suppressHydrationWarning>
                        {formatDate(featured.date)} — {featured.timing === 'after_close' ? 'بعد الإغلاق' : 'قبل الافتتاح'}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[12px]">
                        <span style={{ color: 'var(--text3)' }}>EPS المتوقع</span>
                        <span className="font-mono-price font-medium" style={{ color: 'var(--text)' }}>${(featured.epsExpected ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span style={{ color: 'var(--text3)' }}>الإيرادات</span>
                        <span className="font-mono-price font-medium" style={{ color: 'var(--text)' }}>{featured.revenueExpected}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl" style={{ background: 'var(--purple2)', border: '1px solid rgba(124,111,205,0.2)' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
                        <span className="text-[10px]" style={{ color: 'var(--purple)' }}>توقع AI:</span>
                      </div>
                      <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text)' }}>
                        {featured.aiPrediction === 'beat' ? 'تجاوز التوقعات' : featured.aiPrediction === 'miss' ? 'إخفاق' : 'ضمن التوقعات'}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 progress-bar h-[6px]">
                          <div className="progress-bar-fill" style={{ width: `${featured.aiConfidence}%`, background: 'var(--purple)' }} />
                        </div>
                        <span className="font-mono-price text-[11px] font-medium" style={{ color: 'var(--purple)' }}>{featured.aiConfidence}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Earnings Table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="text-right p-3 font-medium" style={{ color: 'var(--text3)' }}>الشركة</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>التاريخ</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>الوقت</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>EPS متوقع</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>EPS سابق</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>توقع AI</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>التأثير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEarnings.map((item) => {
                      const pred = getPredictionStyle(item.aiPrediction);
                      return (
                        <tr key={item.symbol} className="transition-colors hover:bg-[var(--bg4)]" style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--bg4)', color: 'var(--text)' }}>
                                {item.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-mono-price font-medium" style={{ color: 'var(--text)' }}>{item.symbol}</div>
                                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{item.company}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center" style={{ color: 'var(--text2)' }} suppressHydrationWarning>{formatDate(item.date)}</td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg5)', color: 'var(--text3)' }}>
                              {item.timing === 'after_close' ? 'بعد الإغلاق' : 'قبل الافتتاح'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono-price font-medium" style={{ color: 'var(--text)' }}>${(item.epsExpected ?? 0).toFixed(2)}</td>
                          <td className="p-3 text-center font-mono-price" style={{ color: 'var(--text2)' }}>${(item.epsPrevious ?? 0).toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: pred.bg, color: pred.color }}>{pred.text}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono-price text-[12px] font-medium" style={{ color: parseFloat(item.expectedMove) >= 5 ? 'var(--bear)' : 'var(--gold)' }}>
                              {item.expectedMove}%
                            </span>
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
      </div>
    </section>
  );
}
