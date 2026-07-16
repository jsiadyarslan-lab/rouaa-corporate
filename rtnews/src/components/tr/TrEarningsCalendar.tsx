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

export default function TrEarningsCalendar() {
  const [activeTab, setActiveTab] = useState<'thisWeek' | 'nextWeek' | 'thisMonth'>('thisWeek');
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter earnings based on activeTab
  const filteredEarnings = earnings.filter((item) => {
    const itemTarih = new Date(item.date);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfThisWeek = new Date(startOfToday);
    endOfThisWeek.setDate(endOfThisWeek.getDate() + (7 - endOfThisWeek.getDay()));
    const endOfNextWeek = new Date(endOfThisWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (activeTab === 'thisWeek') return itemTarih >= startOfToday && itemTarih <= endOfThisWeek;
    if (activeTab === 'nextWeek') return itemTarih > endOfThisWeek && itemTarih <= endOfNextWeek;
    if (activeTab === 'thisMonth') return itemTarih >= startOfToday && itemTarih <= endOfMonth;
    return true;
  });

  const featured = filteredEarnings[0];

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch('/api/markets/earnings', { cache: 'no-store' });
        const data = await res.json();
        if (data.earnings?.length > 0) {
          setEarnings(data.earnings);
          setLastUpdated(new Date());
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchEarnings();
    const interval = setInterval(fetchEarnings, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPredictionStyle = (pred: string) => {
    if (pred === 'beat') return { text: 'Aşım', bg: 'var(--bull2)', color: 'var(--bull)' };
    if (pred === 'miss') return { text: 'Hayal Kırıklığı', bg: 'var(--bear2)', color: 'var(--bear)' };
    return { text: 'Uyumlu', bg: 'rgba(100,116,139,0.12)', color: 'var(--text3)' };
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 75) return 'Yüksek';
    if (confidence >= 50) return 'Orta';
    return 'Düşük';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleRefresh = () => {
    setLoading(true);
    const fetchEarnings = async () => {
      try {
        const res = await fetch('/api/markets/earnings', { cache: 'no-store' });
        const data = await res.json();
        if (data.earnings?.length > 0) {
          setEarnings(data.earnings);
          setLastUpdated(new Date());
        }
      } catch { /* silent */ } finally { setLoading(false); }
    };
    fetchEarnings();
  };

  return (
    <section id="earnings" className="section-block" dir="ltr">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <h2>Kazanç Takvimi</h2>
          <span className="badge-ai text-[10px]">YZ TAHMİNLERİ</span>
        </div>
        <p className="text-[14px] mb-5" style={{ color: 'var(--text2)' }}>Yapay zeka tahminleriyle yaklaşan üç aylık kazanç duyuruları</p>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          {([
            { key: 'thisWeek' as const, label: 'Bu Hafta' },
            { key: 'nextWeek' as const, label: 'Gelecek Hafta' },
            { key: 'thisMonth' as const, label: 'Bu Ay' },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`tab-underline ${activeTab === tab.key ? 'active' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Last Updated & Refresh */}
        {!loading && lastUpdated && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px]" style={{ color: 'var(--text3)' }} suppressHydrationWarning>
              Son güncelleme : {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={handleRefresh}
              className="text-[11px] px-3 py-1 rounded-md transition-colors"
              style={{ background: 'var(--bg4)', color: 'var(--text3)' }}
            >
              Yenile
            </button>
          </div>
        )}

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
              <div className="flex items-center justify-center h-full">
                <span className="text-[13px]" style={{ color: 'var(--text3)' }}>Yükleniyor...</span>
              </div>
            </div>
          </div>
        ) : filteredEarnings.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-[13px]" style={{ color: 'var(--text3)' }}>Kazanç verisi mevcut değil</span>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>Kazanç verileri mevcut olduğunda burada görünecektir</p>
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
                  <span className="text-[13px] font-bold" style={{ color: 'var(--gold)' }}>Günün Kazancı</span>
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
                        {formatDate(featured.date)} — {featured.timing === 'after_close' ? 'Kapanış Sonrası' : 'Açılış Öncesi'}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[12px]">
                        <span style={{ color: 'var(--text3)' }}>Beklenen HKB</span>
                        <span className="font-mono-price font-medium" style={{ color: 'var(--text)' }}>${(featured.epsExpected ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span style={{ color: 'var(--text3)' }}>Beklenen Gelir</span>
                        <span className="font-mono-price font-medium" style={{ color: 'var(--text)' }}>{featured.revenueExpected}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl" style={{ background: 'var(--purple2)', border: '1px solid rgba(124,111,205,0.2)' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
                        <span className="text-[10px]" style={{ color: 'var(--purple)' }}>YZ Tahmini :</span>
                      </div>
                      <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        {featured.aiPrediction === 'beat' ? 'Beklentileri Aşım' : featured.aiPrediction === 'miss' ? 'Beklentileri Karşılama' : 'Beklentilere Uyumlu'}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>Güven : {getConfidenceLabel(featured.aiConfidence)}</span>
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
                      <th className="text-left p-3 font-medium" style={{ color: 'var(--text3)' }}>Şirket</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>Tarih</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>Zaman</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>Beklenen HKB</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>Önceki HKB</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>YZ Tahmini</th>
                      <th className="text-center p-3 font-medium" style={{ color: 'var(--text3)' }}>Beklenen Hareket</th>
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
                              {item.timing === 'after_close' ? 'Kapanış Sonrası' : 'Açılış Öncesi'}
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
