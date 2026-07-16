'use client';

import { useState, useEffect } from 'react';

interface SentimentData {
  fearGreedIndex: { value: number; label: string; labelAr: string };
  arabSentimentIndex: { value: number; label: string; majorityVote: string };
  geopoliticalRiskIndex: { value: number; label: string; description: string; impacts: Record<string, { trend: string; value: string }> };
  aiPowered: boolean;
  aiSummary: string | null;
}

// AI signals removed — hardcoded entry/target/stop values were misleading.
// This section now shows sentiment analysis only, with a clear disclaimer.

export default function AnalysisSection() {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);

  useEffect(() => {
    const fetchSentiment = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch('/api/markets/sentiment', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSentimentData(data);
        }
      } catch { /* silent */ }
    };
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const geoRisk = sentimentData?.geopoliticalRiskIndex || { value: 0, label: 'لا توجد بيانات', description: '', impacts: {} as Record<string, { trend: string; value: string }> };
  const bullPercent = sentimentData ? Math.round((sentimentData.fearGreedIndex.value / 100) * 80 + 10) : 0;
  const neutralPercent = Math.round((100 - bullPercent) * 0.2);
  const bearPercent = 100 - bullPercent - neutralPercent;

  return (
    <section id="analysis" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <h2>التحليل والإشارات</h2>
          <span className="badge-ai">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
            AI
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Market Summary */}
          <div className="glass-card-elevated p-6 relative overflow-hidden" style={{ borderTop: '3px solid var(--purple)' }}>
            <div className="absolute top-0 left-0 right-0 h-[120px]" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(124,111,205,0.08), transparent)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>ملخص AI للسوق</h3>
                <span className="badge-ai text-[10px]">LIVE</span>
              </div>

              {/* Mood Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px]" style={{ color: 'var(--text2)' }}>المزاج العام</span>
                  <span className="text-[12px] font-medium" style={{ color: bullPercent > 50 ? 'var(--bull)' : 'var(--bear)' }}>صاعد {bullPercent}%</span>
                </div>
                <div className="flex h-[8px] rounded-full overflow-hidden" style={{ background: 'var(--bg5)' }}>
                  <div style={{ width: `${bullPercent}%`, background: 'var(--bull)', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ width: `${neutralPercent}%`, background: 'var(--text3)' }} />
                  <div style={{ width: `${bearPercent}%`, background: 'var(--bear)', borderRadius: '0 4px 4px 0' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px]" style={{ color: 'var(--bull)' }}>صعودي {bullPercent}%</span>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>محايد {neutralPercent}%</span>
                  <span className="text-[10px]" style={{ color: 'var(--bear)' }}>هبوطي {bearPercent}%</span>
                </div>
              </div>

              {/* Disclaimer — AI analysis notice */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--gold)' }}>تنبيه مهم</span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                  التحليلات المعروضة أعلاه مبنية على تحليل AI للبيانات المتاحة ولا تُعد توصيات تداول أو استثمارية.
                  القرارات المالية يجب أن تُتخذ بناءً على بحثك الخاص واستشارة مختص مالي مرخص.
                  الأداء السابق لا يضمن النتائج المستقبلية.
                </p>
              </div>

              {/* Sentiment Summary */}
              <div className="space-y-3 mt-3">
                {sentimentData?.aiSummary && (
                  <div className="p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
                      <span className="text-[11px] font-bold" style={{ color: 'var(--purple)' }}>ملخص AI</span>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text)' }}>{sentimentData.aiSummary}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Report */}
          <div className="glass-card-elevated p-6 relative overflow-hidden" style={{ borderTop: '3px solid var(--cyan)' }}>
            <div className="absolute top-0 left-0 right-0 h-[120px]" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(0,201,167,0.06), transparent)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <span className="badge-ai text-[10px]">تقرير أسبوعي</span>
              </div>

              <h3 className="text-[18px] font-bold mb-3 leading-relaxed" style={{ color: 'var(--text)' }}>
                {sentimentData?.aiSummary || 'تقرير السوق الأسبوعي — تحليل شامل للأسواق المالية'}
              </h3>
              <p className="text-[13px] mb-5 line-clamp-3 leading-relaxed" style={{ color: 'var(--text2)' }}>
                {sentimentData?.aiSummary 
                  ? `بناءً على تحليل AI: مؤشر الخوف والطمع عند ${sentimentData.fearGreedIndex.value} (${sentimentData.fearGreedIndex.labelAr})`
                  : 'تحليل شامل لأداء الأسواق المالية العالمية والعربية مع توقعات الأسبوع القادم'}
              </p>

              <div className="space-y-3 mb-5">
                {sentimentData?.aiSummary ? [
                  sentimentData.aiSummary
                ].map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cyan2)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
                    </span>
                    <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>{insight}</span>
                  </div>
                )) : (
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cyan2)' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
                    </span>
                    <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text3)' }}>جارٍ تحليل السوق بالذكاء الاصطناعي...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                  اقرأ التقرير كاملاً ←
                </button>
                <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'var(--gold2)', color: 'var(--gold)' }}>للمشتركين Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Geopolitical Risk Strip */}
        <div className="glass-card p-5 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>مؤشر التوترات الجيوسياسية الإقليمية</h3>
            <span className="badge-ai text-[10px]">حصري رؤى</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="flex-1 w-full">
              <div className="h-[10px] rounded-full overflow-hidden" style={{ background: 'var(--bg5)' }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${geoRisk.value}%`,
                  background: geoRisk.value <= 30 ? 'var(--bull)' : geoRisk.value <= 60 ? 'var(--gold)' : 'var(--bear)',
                }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'var(--text3)' }}>
                <span>منخفض</span><span>متوسط</span><span>مرتفع</span><span>حرج</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-price text-2xl font-bold" style={{
                color: geoRisk.value <= 30 ? 'var(--bull)' : geoRisk.value <= 60 ? 'var(--gold)' : 'var(--bear)'
              }}>
                {geoRisk.value}
              </span>
              <span className="text-[14px]" style={{ color: 'var(--text2)' }}>({geoRisk.label})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(geoRisk.impacts || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="text-center px-3 py-2 rounded-xl" style={{ background: 'var(--bg4)' }}>
                  <div className="text-[10px] mb-1" style={{ color: 'var(--text3)' }}>
                    {key === 'oil' ? 'النفط' : key === 'gold' ? 'الذهب' : 'الدولار'}
                  </div>
                  <div className="font-mono-price text-[12px] font-medium" style={{ color: val.trend === 'up' ? 'var(--bull)' : 'var(--bear)' }}>
                    {val.trend === 'up' ? '▲' : '▼'} {val.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
