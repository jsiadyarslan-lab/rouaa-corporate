'use client';

import { useState, useEffect } from 'react';

// Vote storage key for localStorage
const VOTE_STORAGE_KEY = 'rouaa_community_votes';

interface VoteRecord {
  symbol: string;
  direction: 'up' | 'down';
  timestamp: number;
}

interface VotingAsset {
  symbol: string;
  name: string;
  upPercent: number;
  downPercent: number;
}

function getStoredVotes(): VoteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(VOTE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveVote(vote: VoteRecord) {
  try {
    const votes = getStoredVotes();
    const filtered = votes.filter(v => v.symbol !== vote.symbol);
    filtered.push(vote);
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(filtered));
  } catch { /* silent */ }
}

export default function CommunitySection() {
  const [activeTab, setActiveTab] = useState<'vote' | 'ideas'>('vote');
  const [votedAsset, setVotedAsset] = useState<string | null>(null);
  const [voteDir, setVoteDir] = useState<'up' | 'down' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [votingAssets, setVotingAssets] = useState<VotingAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  // Restore vote state from localStorage on mount
  useEffect(() => {
    const votes = getStoredVotes();
    if (votes.length > 0) {
      const latest = votes[votes.length - 1];
      setVotedAsset(latest.symbol);
      setVoteDir(latest.direction);
    }
  }, []);

  // Fetch real sentiment data for voting
  useEffect(() => {
    const fetchVotingData = async () => {
        if (document.hidden) return; // V1020: skip polling when tab is hidden
      try {
        const res = await fetch('/api/markets/sentiment', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // Build voting assets from real sentiment data
          const assets: VotingAsset[] = [];
          if (data.geopoliticalRiskIndex?.impacts) {
            const impacts = data.geopoliticalRiskIndex.impacts;
            for (const [key, val] of Object.entries(impacts)) {
              const impact = val as { trend: string; value: string };
              const nameMap: Record<string, string> = { oil: 'النفط الخام', gold: 'الذهب', dollar: 'الدولار' };
              const symbolMap: Record<string, string> = { oil: 'WTI', gold: 'XAUUSD', dollar: 'DXY' };
              if (nameMap[key]) {
                const upPercent = impact.trend === 'up' ? 65 : 35;
                assets.push({ symbol: symbolMap[key], name: nameMap[key], upPercent, downPercent: 100 - upPercent });
              }
            }
          }
          // Add from fear/greed if available
          if (data.fearGreedIndex && assets.length === 0) {
            const fg = data.fearGreedIndex.value;
            assets.push(
              { symbol: 'XAUUSD', name: 'الذهب', upPercent: fg > 50 ? 70 : 30, downPercent: fg > 50 ? 30 : 70 },
              { symbol: 'BTCUSD', name: 'بيتكوين', upPercent: fg > 40 ? 60 : 40, downPercent: fg > 40 ? 40 : 60 },
              { symbol: 'EURUSD', name: 'يورو/دولار', upPercent: 50, downPercent: 50 },
              { symbol: 'WTI', name: 'النفط الخام', upPercent: fg > 50 ? 55 : 45, downPercent: fg > 50 ? 45 : 55 },
            );
          }
          if (assets.length > 0) {
            setVotingAssets(assets);
          }
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchVotingData();
    const interval = setInterval(fetchVotingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = (symbol: string, dir: 'up' | 'down') => {
    setVotedAsset(symbol);
    setVoteDir(dir);
    saveVote({ symbol, direction: dir, timestamp: Date.now() });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <section id="community" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <h2>مجتمع المتداولين</h2>
          <span className="badge-live">
            <span className="live-dot" />
            LIVE
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setActiveTab('vote')}
            className={`tab-underline ${activeTab === 'vote' ? 'active' : ''}`}>
            التصويت الحي
          </button>
          <button onClick={() => setActiveTab('ideas')}
            className={`tab-underline ${activeTab === 'ideas' ? 'active' : ''}`}>
            مختبر الأفكار
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'vote' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass-card p-5 animate-pulse" style={{ height: '140px' }}>
                      <div className="skeleton" style={{ height: '14px', width: '50%', marginBottom: '12px' }} />
                      <div className="skeleton" style={{ height: '36px', width: '100%', marginBottom: '8px' }} />
                      <div className="skeleton" style={{ height: '8px', width: '100%' }} />
                    </div>
                  ))
                ) : votingAssets.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <span className="text-[13px]" style={{ color: 'var(--text3)' }}>جارٍ تحميل بيانات التصويت...</span>
                  </div>
                ) : (
                  votingAssets.map((asset) => (
                    <div key={asset.symbol} className="glass-card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-price text-[14px] font-bold" style={{ color: 'var(--text)' }}>{asset.symbol}</span>
                          <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{asset.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <button onClick={() => handleVote(asset.symbol, 'up')}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                          style={{
                            background: votedAsset === asset.symbol && voteDir === 'up' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.06)',
                            border: votedAsset === asset.symbol && voteDir === 'up' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(34,197,94,0.15)',
                            color: 'var(--bull)',
                          }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18,15 12,9 6,15"/></svg>
                          صعود {asset.upPercent}%
                        </button>
                        <button onClick={() => handleVote(asset.symbol, 'down')}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                          style={{
                            background: votedAsset === asset.symbol && voteDir === 'down' ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.06)',
                            border: votedAsset === asset.symbol && voteDir === 'down' ? '1px solid rgba(244,63,94,0.4)' : '1px solid rgba(244,63,94,0.15)',
                            color: 'var(--bear)',
                          }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                          هبوط {asset.downPercent}%
                        </button>
                      </div>
                      {/* Progress bar */}
                      <div className="h-[8px] rounded-full overflow-hidden flex" style={{ background: 'var(--bg5)' }}>
                        <div className="h-full transition-all duration-500" style={{ width: `${asset.upPercent}%`, background: 'var(--bull)', borderRadius: '4px 0 0 4px' }} />
                        <div className="h-full transition-all duration-500" style={{ width: `${asset.downPercent}%`, background: 'var(--bear)', borderRadius: '0 4px 4px 0' }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'ideas' && (
              <div className="space-y-3">
                <div className="text-center py-12">
                  <div className="mb-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" className="mx-auto">
                      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
                      <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/>
                    </svg>
                  </div>
                  <span className="text-[13px]" style={{ color: 'var(--text3)' }}>مختبر الأفكار متاح قريباً للمشتركين</span>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Sidebar */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>أفضل المحللين هذا الشهر</h3>
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--gold2)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
              </div>
            </div>
            <div className="text-center py-8">
              <span className="text-[12px]" style={{ color: 'var(--text3)' }}>لوحة المتصدرين متاحة قريباً</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] toast-enter">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2.5"><polyline points="20,6 9,17 4,12" /></svg>
            <span className="text-[13px]" style={{ color: 'var(--text)' }}>تم تسجيل تصويتك بنجاح!</span>
          </div>
        </div>
      )}
    </section>
  );
}
