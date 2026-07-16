'use client';

import { useState, useEffect, useRef } from 'react';
import { useNewsStore, useShallow } from '@/stores/news-store';

interface FlashItem {
  id: string;
  title: string;
  time: string;
  affectedAssets: { symbol: string; change: number }[];
  sentiment: string;
  impactLevel: string;
}

export default function FlashPage() {
  const {
    breakingNews,
    breakingNewsLoading,
    fetchBreakingNews,
  } = useNewsStore(
    useShallow((state) => ({
      breakingNews: state.breakingNews,
      breakingNewsLoading: state.breakingNewsLoading,
      fetchBreakingNews: state.fetchBreakingNews,
    }))
  );

  const [flashItems, setFlashItems] = useState<FlashItem[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convert breaking news from store to flash items
  useEffect(() => {
    if (breakingNews.length > 0) {
      setFlashItems(breakingNews.map(n => ({
        id: n.id,
        title: n.translatedTitle || n.titleAr || n.title,
        time: n.time,
        affectedAssets: n.affectedAssets || [{ symbol: 'MIX', change: 0 }],
        sentiment: n.sentiment,
        impactLevel: n.impactLevel,
      })));
    }
  }, [breakingNews]);

  // Fetch breaking news on mount
  useEffect(() => { fetchBreakingNews(); }, [fetchBreakingNews]);

  // Auto-refresh every 60 seconds for flash mode
  useEffect(() => {
    const interval = setInterval(() => { if (document.hidden) return; fetchBreakingNews(); }, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBreakingNews]);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('flash-welcome-dismissed');
    if (dismissed) setShowWelcome(false);
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('flash-welcome-dismissed', 'true');
  };

  const formatFlashTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return 'الآن';
    }
  };

  return (
    <div className="min-h-screen bg-[#03050A] text-white" dir="rtl">
      {/* Flash Header */}
      <header className="h-12 bg-[rgba(3,5,10,0.95)] backdrop-blur-xl border-b border-[rgba(239,68,68,0.15)] flex items-center px-4 sticky top-0 z-50">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[#EF4444] font-bold">⚡ رؤى Flash</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono-price text-[#EF4444]">{currentTime}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot" />
            <span className="text-[#10B981]">LIVE</span>
          </span>
          <button
            onClick={() => fetchBreakingNews()}
            className="px-3 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[#94A3B8] hover:text-white transition-colors"
            disabled={breakingNewsLoading}
          >
            {breakingNewsLoading ? '...' : 'تحديث'}
          </button>
          <a href="/" className="px-3 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[#94A3B8] hover:text-white transition-colors">
            العودة للرئيسية
          </a>
        </div>
      </header>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-[100] flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-md w-full border-[rgba(239,68,68,0.3)]">
            <h3 className="text-lg font-bold text-[#EF4444] mb-2">⚡ وضع الأخبار العاجلة</h3>
            <p className="text-sm text-[#94A3B8] mb-4">
              أنت الآن في وضع الأخبار العاجلة — فقط الأخبار عالية التأثير ستظهر هنا. يتم التحديث تلقائياً كل 30 ثانية.
            </p>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="accent-[#EF4444]"
              />
              <span className="text-sm text-[#94A3B8]">تفعيل الصوت عند كل خبر جديد 🔔</span>
            </label>
            <button
              onClick={dismissWelcome}
              className="w-full py-2.5 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-[#DC2626] transition-colors"
            >
              فهمت، ابدأ
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Side Panel */}
      {selectedItem && (
        <div className="fixed top-12 right-0 bottom-0 w-[380px] bg-[#0D1421] border-l border-[rgba(239,68,68,0.2)] z-40 overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <h3 className="text-sm font-semibold">🤖 تحليل AI</h3>
            <button onClick={() => setSelectedItem(null)} className="text-[#94A3B8] hover:text-white">✕</button>
          </div>
          <div className="p-4 space-y-4">
            {(() => {
              const item = flashItems.find(f => f.id === selectedItem);
              if (!item) return null;
              return (
                <>
                  <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
                    <div className="text-xs text-[#EF4444] mb-1">تأثير الخبر: {item.impactLevel === 'high' ? 'عالٍ 🔴' : item.impactLevel === 'medium' ? 'متوسط 🟡' : 'منخفض 🟢'}</div>
                    <div className="text-sm text-white">{item.title}</div>
                  </div>
                  <div>
                    <h4 className="text-xs text-[#94A3B8] mb-2">الأصول المتأثرة:</h4>
                    <div className="space-y-2">
                      {item.affectedAssets.map((a) => (
                        <div key={a.symbol} className="flex items-center justify-between p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
                          <span className="font-mono-price text-sm text-white">{a.symbol}</span>
                          <span className={`font-mono-price text-sm ${a.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {a.change >= 0 ? '+' : ''}{a.change}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)]">
                    <div className="text-xs text-[#6366F1] mb-1">تحليل AI مبني على المشاعر:</div>
                    <div className="text-sm text-white font-semibold">
                      {item.sentiment === 'positive' ? 'اتجاه إيجابي — قد يدعم الصعود' :
                       item.sentiment === 'negative' ? 'اتجاه سلبي — قد يضغط على الهبوط' :
                       'اتجاه محايد — انتظر تأكيداً'}
                    </div>
                    <div className="text-[10px] text-[#94A3B8] mt-1">تحليل آلي مبني على الكلمات المفتاحية</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Flash Feed */}
      <div className={`max-w-3xl mx-auto ${selectedItem ? 'ml-[380px]' : ''}`}>
        {/* Loading state */}
        {breakingNewsLoading && flashItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <span className="text-[#EF4444] text-sm">جارٍ تحميل الأخبار العاجلة...</span>
          </div>
        )}

        {/* News items */}
        <div className="flex flex-col gap-0">
          {flashItems.map((item, index) => (
            <article
              key={item.id}
              className={`flex items-start gap-4 px-5 py-4 border-b border-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.05)] transition-colors ${
                index === 0 ? 'border-r-3 border-r-[#EF4444] bg-[rgba(239,68,68,0.05)]' : ''
              }`}
              style={index === 0 ? { animation: 'flashNew 2s ease-out' } : undefined}
            >
              <div className="font-mono-price text-xs text-[rgba(239,68,68,0.7)] flex-shrink-0 w-16 pt-0.5">
                {formatFlashTime(item.time)}
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-white mb-2 leading-relaxed">{item.title}</div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {item.affectedAssets.map((a) => (
                    <span key={a.symbol} className={`text-[10px] px-2 py-0.5 rounded-full font-mono-price ${
                      a.change >= 0 ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]' : 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'
                    }`}>
                      {a.symbol} {a.change >= 0 ? '+' : ''}{a.change}%
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedItem(item.id)}
                  className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
                >
                  🤖 تحليل AI فوري
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Empty state */}
        {!breakingNewsLoading && flashItems.length === 0 && (
          <div className="text-center py-12 text-[#4B5563] text-xs">
            <div className="text-3xl mb-2">📡</div>
            لا توجد أخبار عاجلة حالياً — يتم التحديث تلقائياً
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes flashNew {
          0% { background: rgba(239,68,68,0.2); }
          100% { background: transparent; }
        }
        .border-r-3 {
          border-right-width: 3px;
        }
      `}</style>
    </div>
  );
}
