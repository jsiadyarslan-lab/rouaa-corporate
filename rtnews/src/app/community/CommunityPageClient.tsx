'use client';

import { useState, useEffect } from 'react';
import { leaderboard } from '@/data/mock-data';

/* ── Vote types ── */
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
    const filtered = votes.filter((v) => v.symbol !== vote.symbol);
    filtered.push(vote);
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(filtered));
  } catch { /* silent */ }
}

/* ── Discussion type ── */
interface Discussion {
  id: string;
  author: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  replies: number;
  sentiment: 'bull' | 'bear' | 'neutral';
}

const MOCK_DISCUSSIONS: Discussion[] = [] as Discussion[];

/* ── Badge colors ── */
function badgeColor(badge: string) {
  if (badge === 'expert') return { bg: 'var(--gold2)', color: 'var(--gold)', label: 'خبير' };
  if (badge === 'pro') return { bg: 'var(--cyan2)', color: 'var(--cyan)', label: 'محترف' };
  return { bg: 'var(--bull2)', color: 'var(--bull)', label: 'مبتدئ' };
}

/* ═══════════════════════════════════════════════════════════════════════
   CommunityPageClient
   ═══════════════════════════════════════════════════════════════════════ */
export default function CommunityPageClient() {
  const [activeTab, setActiveTab] = useState<'vote' | 'discussions'>('vote');
  const [votedAsset, setVotedAsset] = useState<string | null>(null);
  const [voteDir, setVoteDir] = useState<'up' | 'down' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [votingAssets, setVotingAssets] = useState<VotingAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

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
      try {
        const res = await fetch('/api/markets/sentiment', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
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
          if (data.fearGreedIndex && assets.length === 0) {
            const fg = data.fearGreedIndex.value;
            assets.push(
              { symbol: 'XAUUSD', name: 'الذهب', upPercent: fg > 50 ? 70 : 30, downPercent: fg > 50 ? 30 : 70 },
              { symbol: 'BTCUSD', name: 'بيتكوين', upPercent: fg > 40 ? 60 : 40, downPercent: fg > 40 ? 40 : 60 },
              { symbol: 'EURUSD', name: 'يورو/دولار', upPercent: 50, downPercent: 50 },
              { symbol: 'WTI', name: 'النفط الخام', upPercent: fg > 50 ? 55 : 45, downPercent: fg > 50 ? 45 : 55 },
            );
          }
          if (assets.length > 0) setVotingAssets(assets);
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
    <main className="min-h-screen pb-mobile-safe" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        {/* ── Page Header ── */}
        <div className="max-w-[1280px] mx-auto px-4 mb-2" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-head)' }}>
              مجتمع المتداولين
            </h1>
            <span className="badge-live">
              <span className="live-dot" />
              مباشر
            </span>
          </div>
          <p className="text-[14px] max-w-[600px]" style={{ color: 'var(--text-2)' }}>
            شارك رأيك في اتجاه السوق، تابع أفكار المتداولين، وتنافس في لوحة المتصدرين
          </p>
        </div>

        {/* ── Tab navigation using .tab-underline ── */}
        <section className="section-block" aria-label="تبويبات المجتمع" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid var(--rim)' }}>
              <button
                onClick={() => setActiveTab('vote')}
                className={`tab-underline ${activeTab === 'vote' ? 'active' : ''}`}
              >
                التصويت الحي
              </button>
              <button
                onClick={() => setActiveTab('discussions')}
                className={`tab-underline ${activeTab === 'discussions' ? 'active' : ''}`}
              >
                النقاشات
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ══════════════════════════════════════════════════════
                 Main Content Area (2/3 width)
                 ══════════════════════════════════════════════════════ */}
              <div className="lg:col-span-2">
                {/* ── VOTING TAB ── */}
                {activeTab === 'vote' && (
                  <div>
                    <div className="sh mb-4">
                      <div className="sh-title">توقعات السوق</div>
                      <span className="badge-live text-[9px]">
                        <span className="live-dot" style={{ width: '4px', height: '4px' }} />
                        تصويت مباشر
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="glass-card p-5 animate-pulse" style={{ height: '160px' }}>
                            <div className="skeleton" style={{ height: '14px', width: '50%', marginBottom: '12px' }} />
                            <div className="skeleton" style={{ height: '36px', width: '100%', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ height: '8px', width: '100%' }} />
                          </div>
                        ))
                      ) : votingAssets.length === 0 ? (
                        <div className="col-span-2 text-center py-12">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--text-3)"
                            strokeWidth="1.5"
                            className="mx-auto mb-3"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span className="text-[13px]" style={{ color: 'var(--text-3)' }}>جارٍ تحميل بيانات التصويت...</span>
                        </div>
                      ) : (
                        votingAssets.map((asset) => (
                          <div key={asset.symbol} className="glass-card p-5">
                            {/* Symbol + name */}
                            <div className="flex items-center gap-2 mb-4">
                              <span className="font-mono-price text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>
                                {asset.symbol}
                              </span>
                              <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>{asset.name}</span>
                            </div>

                            {/* Vote buttons */}
                            <div className="flex items-center gap-2 mb-4">
                              <button
                                onClick={() => handleVote(asset.symbol, 'up')}
                                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                                style={{
                                  background:
                                    votedAsset === asset.symbol && voteDir === 'up'
                                      ? 'rgba(34,197,94,0.2)'
                                      : 'var(--up-dim)',
                                  border:
                                    votedAsset === asset.symbol && voteDir === 'up'
                                      ? '1px solid rgba(34,197,94,0.4)'
                                      : '1px solid rgba(34,197,94,0.15)',
                                  color: 'var(--bull)',
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="18,15 12,9 6,15" />
                                </svg>
                                صعود {asset.upPercent}%
                              </button>
                              <button
                                onClick={() => handleVote(asset.symbol, 'down')}
                                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                                style={{
                                  background:
                                    votedAsset === asset.symbol && voteDir === 'down'
                                      ? 'rgba(244,63,94,0.2)'
                                      : 'var(--down-dim)',
                                  border:
                                    votedAsset === asset.symbol && voteDir === 'down'
                                      ? '1px solid rgba(244,63,94,0.4)'
                                      : '1px solid rgba(244,63,94,0.15)',
                                  color: 'var(--bear)',
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6,9 12,15 18,9" />
                                </svg>
                                هبوط {asset.downPercent}%
                              </button>
                            </div>

                            {/* Bull/Bear progress bar */}
                            <div className="progress-bar" style={{ height: '8px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${asset.upPercent}%`,
                                  background: 'linear-gradient(90deg, var(--bull), rgba(34,197,94,0.5))',
                                  borderRadius: asset.upPercent === 100 ? '3px' : '3px 0 0 3px',
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] font-mono-price" style={{ color: 'var(--bull)' }}>
                                {asset.upPercent}% صعود
                              </span>
                              <span className="text-[10px] font-mono-price" style={{ color: 'var(--bear)' }}>
                                {asset.downPercent}% هبوط
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ── DISCUSSIONS TAB ── */}
                {activeTab === 'discussions' && (
                  <div>
                    <div className="sh mb-4">
                      <div className="sh-title">آخر النقاشات</div>
                    </div>

                    <div className="space-y-3">
                      {MOCK_DISCUSSIONS.length === 0 ? (
                        <div className="text-center py-12">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--text-3)"
                            strokeWidth="1.5"
                            className="mx-auto mb-3"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span className="text-[13px]" style={{ color: 'var(--text-3)' }}>لا توجد نقاشات حالياً</span>
                        </div>
                      ) : (
                        MOCK_DISCUSSIONS.map((disc) => (
                          <div
                            key={disc.id}
                            className="glass-card p-4 transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                              borderInlineStart:
                                disc.sentiment === 'bull'
                                  ? '3px solid var(--bull)'
                                  : disc.sentiment === 'bear'
                                    ? '3px solid var(--bear)'
                                    : '3px solid var(--neutral)',
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                                style={{
                                  background:
                                    disc.sentiment === 'bull'
                                      ? 'var(--bull2)'
                                      : disc.sentiment === 'bear'
                                        ? 'var(--bear2)'
                                        : 'var(--cyan2)',
                                  color:
                                    disc.sentiment === 'bull'
                                      ? 'var(--bull)'
                                      : disc.sentiment === 'bear'
                                        ? 'var(--bear)'
                                        : 'var(--cyan)',
                                }}
                              >
                                {disc.avatar}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[13px] font-bold" style={{ color: 'var(--text-1)' }}>
                                    {disc.author}
                                  </span>
                                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                                    {disc.time}
                                  </span>
                                </div>
                                <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'var(--text-2)' }}>
                                  {disc.content}
                                </p>
                                <div className="flex items-center gap-4">
                                  <button className="flex items-center gap-1 text-[11px] transition-colors duration-200 cursor-pointer" style={{ color: 'var(--text-3)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                    {disc.likes}
                                  </button>
                                  <button className="flex items-center gap-1 text-[11px] transition-colors duration-200 cursor-pointer" style={{ color: 'var(--text-3)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    {disc.replies} رد
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════
                 Leaderboard Sidebar (1/3 width)
                 ══════════════════════════════════════════════════════ */}
              <div>
                <div className="glass-card p-5 sticky top-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="sh-title" style={{ marginBottom: 0 }}>لوحة المتصدرين</div>
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: 'var(--gold2)' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-[11px] mb-3" style={{ color: 'var(--text-3)' }}>أفضل المحللين هذا الشهر</div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {leaderboard.length === 0 ? (
                      <div className="text-center py-8">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-3)"
                          strokeWidth="1.5"
                          className="mx-auto mb-2"
                        >
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                        </svg>
                        <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>لا توجد بيانات</span>
                      </div>
                    ) : (
                    leaderboard.map((entry) => {
                      const bc = badgeColor(entry.badge);
                      return (
                        <div
                          key={entry.rank}
                          className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200"
                          style={{
                            background: entry.rank <= 3 ? `${bc.bg}` : 'transparent',
                            border: entry.rank <= 3 ? `1px solid var(--rim)` : '1px solid transparent',
                          }}
                        >
                          {/* Rank */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-mono-price text-[11px] font-bold"
                            style={{
                              background: entry.rank === 1 ? 'var(--gold2)' : entry.rank <= 3 ? 'var(--cyan2)' : 'var(--surface-2)',
                              color: entry.rank === 1 ? 'var(--gold)' : entry.rank <= 3 ? 'var(--cyan)' : 'var(--text-3)',
                            }}
                          >
                            {entry.rank}
                          </div>

                          {/* Name + badge */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-1)' }}>
                                {entry.name}
                              </span>
                              <span
                                className="text-[8px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ background: bc.bg, color: bc.color }}
                              >
                                {bc.label}
                              </span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-left flex-shrink-0">
                            <div className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>
                              {entry.successRate}%
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text-3)' }}>
                              {entry.ideasCount} فكرة
                            </div>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>

                  {/* Leaderboard footer */}
                  <div className="divider mt-4 mb-3" />
                  <div className="text-center">
                    <button className="btn-outline text-[11px] px-4 py-1.5">
                      عرض اللوحة الكاملة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Community Stats ── */}
        <section className="section-block" aria-label="إحصائيات المجتمع" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">إحصائيات المجتمع</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price gradient-text mb-1">—</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>متداول نشط</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price" style={{ color: 'var(--bull)' }}>—</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>تصويت اليوم</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price" style={{ color: 'var(--gold)' }}>—</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>فكرة تداول</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono-price" style={{ color: 'var(--cyan)' }}>—</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>نسبة التصويب</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Toast ── */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] toast-enter">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--rim)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            <span className="text-[13px]" style={{ color: 'var(--text-1)' }}>تم تسجيل تصويتك بنجاح!</span>
          </div>
        </div>
      )}

    </main>
  );
}
