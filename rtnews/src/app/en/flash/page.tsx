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

export default function EnFlashPage() {
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

  useEffect(() => {
    if (breakingNews.length > 0) {
      setFlashItems(breakingNews.map(n => ({
        id: n.id,
        title: n.title || n.translatedTitle || n.titleAr || '',
        time: n.time,
        affectedAssets: n.affectedAssets || [{ symbol: 'MIX', change: 0 }],
        sentiment: n.sentiment,
        impactLevel: n.impactLevel,
      })));
    }
  }, [breakingNews]);

  useEffect(() => { fetchBreakingNews(); }, [fetchBreakingNews]);

  useEffect(() => {
    const interval = setInterval(() => { if (document.hidden) return; fetchBreakingNews(); }, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBreakingNews]);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('en-flash-welcome-dismissed');
    if (dismissed) setShowWelcome(false);
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('en-flash-welcome-dismissed', 'true');
  };

  const formatFlashTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return 'NOW';
    }
  };

  return (
    <div className="min-h-screen bg-[#03050A] text-white" dir="ltr">
      {/* Flash Header */}
      <header className="h-12 bg-[rgba(3,5,10,0.95)] backdrop-blur-xl border-b border-[rgba(239,68,68,0.15)] flex items-center px-4 sticky top-0 z-50">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[#EF4444] font-bold">⚡ ROUAA Flash</span>
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
            {breakingNewsLoading ? '...' : 'Refresh'}
          </button>
          <a href="/en" className="px-3 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[#94A3B8] hover:text-white transition-colors">
            Home
          </a>
        </div>
      </header>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-[100] flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-md w-full border-[rgba(239,68,68,0.3)]">
            <h3 className="text-lg font-bold text-[#EF4444] mb-2">⚡ Flash News Mode</h3>
            <p className="text-sm text-[#94A3B8] mb-4">
              You are now in Flash News mode — only high-impact news will appear here. Auto-refreshes every 30 seconds.
            </p>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="accent-[#EF4444]"
              />
              <span className="text-sm text-[#94A3B8]">Enable sound for new alerts</span>
            </label>
            <button
              onClick={dismissWelcome}
              className="w-full py-2.5 rounded-xl bg-[#EF4444] text-white text-sm font-bold hover:bg-[#DC2626] transition-colors"
            >
              Got it, start
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Side Panel */}
      {selectedItem && (
        <div className="fixed top-12 left-0 bottom-0 w-[380px] bg-[#0D1421] border-r border-[rgba(239,68,68,0.2)] z-40 overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <h3 className="text-sm font-semibold">🤖 AI Analysis</h3>
            <button onClick={() => setSelectedItem(null)} className="text-[#94A3B8] hover:text-white">✕</button>
          </div>
          <div className="p-4 space-y-4">
            {(() => {
              const item = flashItems.find(f => f.id === selectedItem);
              if (!item) return null;
              return (
                <>
                  <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
                    <div className="text-xs text-[#EF4444] mb-1">Impact: {item.impactLevel === 'high' ? 'High' : item.impactLevel === 'medium' ? 'Medium' : 'Low'}</div>
                    <div className="text-sm text-white">{item.title}</div>
                  </div>
                  <div>
                    <h4 className="text-xs text-[#94A3B8] mb-2">Affected Assets:</h4>
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
                    <div className="text-xs text-[#6366F1] mb-1">Sentiment-based AI Analysis:</div>
                    <div className="text-sm text-white font-semibold">
                      {item.sentiment === 'positive' ? 'Bullish trend — may support upside' :
                       item.sentiment === 'negative' ? 'Bearish trend — may pressure downside' :
                       'Neutral — wait for confirmation'}
                    </div>
                    <div className="text-[10px] text-[#94A3B8] mt-1">Automated analysis based on keywords</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Flash Feed */}
      <div className={`max-w-3xl mx-auto ${selectedItem ? 'mr-[380px]' : ''}`}>
        {/* Loading state */}
        {breakingNewsLoading && flashItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <span className="text-[#EF4444] text-sm">Loading breaking news...</span>
          </div>
        )}

        {/* News items */}
        <div className="flex flex-col gap-0">
          {flashItems.map((item, index) => (
            <article
              key={item.id}
              className={`flex items-start gap-4 px-5 py-4 border-b border-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.05)] transition-colors ${
                index === 0 ? 'border-l-3 border-l-[#EF4444] bg-[rgba(239,68,68,0.05)]' : ''
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
                  🤖 Instant AI Analysis
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Empty state */}
        {!breakingNewsLoading && flashItems.length === 0 && (
          <div className="text-center py-12 text-[#4B5563] text-xs">
            <div className="text-3xl mb-2">📡</div>
            No breaking news right now — auto-refreshing
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes flashNew {
          0% { background: rgba(239,68,68,0.2); }
          100% { background: transparent; }
        }
        .border-l-3 {
          border-left-width: 3px;
        }
      `}</style>
    </div>
  );
}
