'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Fix legacy local video URLs ──────────────────────────────
function fixVideoUrl(url: string | null): string | null {
  if (!url) return null;
  // Legacy local URLs → serve API
  if (url.startsWith('/generated/videos/')) {
    return url.replace('/generated/videos/', '/api/video/serve/');
  }
  // R2 public URLs → redirect through our serve API as proxy
  if (url.includes('.r2.dev/') || url.includes('.cloudflarestorage.com/')) {
    const match = url.match(/\/videos\/([^?]+)/);
    if (match) {
      return `/api/video/serve/${match[1]}`;
    }
  }
  return url;
}

// ─── Types ──────────────────────────────────────────────────

interface VideoItem {
  id: string;
  title: string;
  slug: string;
  symbol: string;
  assetName: string;
  locale: string;
  reportType: string;
  assetClass: string;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  marketImpact?: string;
}

// ─── Constants (Turkish labels) ──────────────────────────────

const ASSET_CLASS_TABS = [
  { key: 'all', label: 'Tümü', icon: '◎' },
  { key: 'stocks', label: 'Hisseler', icon: '↗' },
  { key: 'crypto', label: 'Kripto', icon: '◆' },
  { key: 'forex', label: 'Forex', icon: '⇄' },
  { key: 'commodities', label: 'Hammaddeler', icon: '◆' },
];

const REPORT_TYPE_TABS = [
  { key: 'all', label: 'Tüm Raporlar', icon: '◉' },
  { key: 'technical_analysis', label: 'Teknik Analiz', icon: '📈' },
  { key: 'economic_report', label: 'Ekonomik Rapor', icon: '🏛' },
  { key: 'market_analysis', label: 'Piyasa Analizi', icon: '📊' },
];

const IMPACT_FILTERS = [
  { key: 'all', label: 'Tümü', color: '#94a3b8' },
  { key: 'bullish', label: 'Yükseliş', color: '#22c55e' },
  { key: 'bearish', label: 'Düşüş', color: '#ef4444' },
  { key: 'neutral', label: 'Nötr', color: '#d4af37' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'En Yeniler' },
  { key: 'views', label: 'En Çok İzlenenler' },
];

// ─── Helpers ────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return '1:30';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Şimdi';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}g`;
  return new Date(dateStr).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
}

function getAssetClassColor(cls: string): string {
  switch (cls) {
    case 'stocks': return '#3b82f6';
    case 'crypto': return '#8b5cf6';
    case 'forex': return '#f59e0b';
    case 'commodities': return '#d4af37';
    default: return '#00E5FF';
  }
}

function getAssetClassLabel(cls: string): string {
  const tab = ASSET_CLASS_TABS.find(t => t.key === cls);
  return tab?.label || cls;
}

function getReportTypeLabel(reportType: string): string {
  const tab = REPORT_TYPE_TABS.find(t => t.key === reportType);
  return tab?.label || reportType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Rapor';
}

function getReportTypeColor(reportType: string): string {
  switch (reportType) {
    case 'technical_analysis': return '#00E5FF';
    case 'economic_report': return '#d4af37';
    case 'market_analysis': return '#8b5cf6';
    default: return '#64748b';
  }
}

function getImpactInfo(impact: string | undefined) {
  if (!impact || impact === 'neutral') return { label: 'Nötr', color: '#d4af37', arrow: '→', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.2)' };
  if (['bullish', 'positive'].includes(impact)) return { label: 'Yükseliş', color: '#22c55e', arrow: '↑', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' };
  if (['bearish', 'negative'].includes(impact)) return { label: 'Düşüş', color: '#ef4444', arrow: '↓', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
  return { label: 'Nötr', color: '#d4af37', arrow: '→', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.2)' };
}

// ─── Animated Gradient Border Wrapper ──────────────────────

function AnimatedBorderWrapper({ children, borderRadius = 16 }: { children: React.ReactNode; borderRadius?: number }) {
  return (
    <div className="relative" style={{ borderRadius }}>
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius, padding: 1.5 }}
        animate={{
          background: [
            'linear-gradient(0deg, #00E5FF, #d4af37, #8b5cf6, #00E5FF)',
            'linear-gradient(90deg, #00E5FF, #d4af37, #8b5cf6, #00E5FF)',
            'linear-gradient(180deg, #00E5FF, #d4af37, #8b5cf6, #00E5FF)',
            'linear-gradient(270deg, #00E5FF, #d4af37, #8b5cf6, #00E5FF)',
            'linear-gradient(360deg, #00E5FF, #d4af37, #8b5cf6, #00E5FF)',
          ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-full h-full" style={{ borderRadius: borderRadius - 1.5, background: '#050810' }} />
      </motion.div>
      <div className="relative z-10" style={{ borderRadius: borderRadius - 1.5 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Thumbnail Component ────────────────────────────────────

function VideoThumbnail({ video, size = 'normal' }: { video: VideoItem; size?: 'hero' | 'normal' }) {
  const cls = video.assetClass;
  const clsColor = getAssetClassColor(cls);
  const impact = getImpactInfo(video.marketImpact);
  const symbol = video.symbol.split('-')[0].split('=')[0];
  const isHero = size === 'hero';

  const symbolHash = video.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradientAngle = (symbolHash % 360);

  // If thumbnail exists, show it
  if (video.thumbnailUrl) {
    const fixedUrl = fixVideoUrl(video.thumbnailUrl);
    return (
      <div className="relative w-full h-full overflow-hidden">
        <img
          src={fixedUrl || video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.85) contrast(1.05)' }}
        />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(0deg, rgba(5,8,16,0.85) 0%, rgba(5,8,16,0.2) 40%, transparent 100%)`,
        }} />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className="text-[9px] px-2 py-0.5 rounded-md font-bold" style={{
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            color: clsColor, border: `1px solid ${clsColor}30`,
          }}>
            {getAssetClassLabel(cls)}
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md font-bold" style={{
            background: impact.bg, color: impact.color, border: `1px solid ${impact.border}`,
          }}>
            {impact.arrow} {impact.label}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold z-10" style={{
          background: 'rgba(0,0,0,0.75)', color: '#fff', backdropFilter: 'blur(4px)',
        }}>
          {formatDuration(video.duration)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{
      background: `linear-gradient(${gradientAngle}deg, #050810 0%, #0c1426 40%, #0a1120 70%, #050810 100%)`,
    }}>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at 70% 40%, ${clsColor}08 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, ${impact.color}06 0%, transparent 50%)`,
      }} />
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `linear-gradient(${clsColor}50 1px, transparent 1px), linear-gradient(90deg, ${clsColor}50 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
        style={{ opacity: 0.04, fontSize: isHero ? '200px' : '100px', fontWeight: 900, color: clsColor, letterSpacing: '-8px' }}
      >
        {symbol}
      </div>
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, transparent 40%, ${clsColor}05 50%, transparent 60%)`,
      }} />

      {/* Top badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <span className="text-[9px] px-2 py-0.5 rounded-md font-bold" style={{
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          color: clsColor, border: `1px solid ${clsColor}30`,
        }}>
          {getAssetClassLabel(cls)}
        </span>
        <span className="text-[9px] px-2 py-0.5 rounded-md font-bold" style={{
          background: impact.bg, color: impact.color, border: `1px solid ${impact.border}`,
        }}>
          {impact.arrow} {impact.label}
        </span>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 z-10" style={{
        background: 'linear-gradient(0deg, rgba(5,8,16,0.95) 0%, rgba(5,8,16,0.6) 60%, transparent 100%)',
        padding: isHero ? '40px 24px 20px' : '30px 16px 12px',
      }}>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold" style={{
          background: 'rgba(0,0,0,0.75)', color: '#fff', backdropFilter: 'blur(4px)',
        }}>
          {formatDuration(video.duration)}
        </div>
      </div>

      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{
        background: 'rgba(5,8,16,0.3)', backdropFilter: 'blur(2px)',
      }}>
        <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{
          width: isHero ? 72 : 48, height: isHero ? 72 : 48, borderRadius: '50%',
          background: 'rgba(255,255,255,0.95)',
          boxShadow: `0 0 30px ${clsColor}40, 0 4px 24px rgba(0,0,0,0.5)`,
        }}>
          <svg width={isHero ? 28 : 18} height={isHero ? 28 : 18} viewBox="0 0 24 24" fill="#050810">
            <polygon points="7,4 20,12 7,20" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function TrVideosPageClient() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [latestUpdateTime, setLatestUpdateTime] = useState<string>('');

  useEffect(() => { fetchVideos(); }, [activeTab]);

  async function fetchVideos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('locale', 'tr');
      if (activeTab !== 'all') params.set('assetClass', activeTab);
      const res = await fetch(`/api/video/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        const videoList = data.videos || [];
        setVideos(videoList);
        if (videoList.length > 0) {
          const latestDate = videoList.reduce((latest: string, v: VideoItem) => {
            const d = v.publishedAt || v.createdAt;
            return d > latest ? d : latest;
          }, '');
          setLatestUpdateTime(latestDate);
        }
      }
    } catch (err) {
      console.error('Videolar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredVideos = videos
    .filter(v => {
      if (reportTypeFilter !== 'all') {
        const rt = v.reportType || '';
        if (reportTypeFilter === 'technical_analysis' && !['technical_analysis', 'analysis'].includes(rt)) return false;
        if (reportTypeFilter === 'economic_report' && !['economic_report', 'weekly', 'monthly', 'quarterly', 'special'].includes(rt)) return false;
        if (reportTypeFilter === 'market_analysis' && !['market_analysis'].includes(rt)) return false;
      }
      if (impactFilter === 'all') return true;
      const impact = v.marketImpact || 'neutral';
      if (impactFilter === 'bullish') return ['bullish', 'positive'].includes(impact);
      if (impactFilter === 'bearish') return ['bearish', 'negative'].includes(impact);
      return impact === 'neutral';
    })
    .filter(v => {
      if (!searchSymbol.trim()) return true;
      const q = searchSymbol.trim().toLowerCase();
      return (
        v.symbol.toLowerCase().includes(q) ||
        v.assetName.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
      return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
    });

  const heroVideo = filteredVideos[0];
  const gridVideos = filteredVideos.slice(1);
  const totalViews = videos.reduce((s, v) => s + (v.viewCount || 0), 0);

  return (
    <div dir="ltr" className="min-h-screen" style={{ paddingTop: '4px' }}>

      {/* ═══ Hero Header with Animated Gradient Border ═══ */}
      <AnimatedBorderWrapper borderRadius={20}>
        <div className="relative overflow-hidden" style={{
          background: 'linear-gradient(145deg, #050810 0%, #0a1020 40%, #060d1f 100%)',
        }}>
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 90% 50%, rgba(0,229,255,0.04) 0%, transparent 50%), radial-gradient(ellipse at 10% 30%, rgba(139,92,246,0.03) 0%, transparent 40%)',
          }} />

          <div className="relative z-10">
            {/* Title Row */}
            <div className="flex items-center gap-4 px-6 pt-5 pb-4">
              <div className="relative">
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37, #F59E0B)',
                    boxShadow: '0 0 24px rgba(212,175,55,0.2)',
                  }}
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#050810">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ background: '#EF4444' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: '#fff' }}>
                  Ekonomik Nabız
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold" style={{
                    background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)',
                    boxShadow: '0 0 8px rgba(239,68,68,0.15)',
                  }}>
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ● CANLI
                    </motion.span>
                  </span>
                </h1>
                <p className="text-[12px] mt-0.5" style={{ color: '#64748b' }}>
                  Profesyonel video analizleri...
                </p>
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex items-center gap-2 px-6 pb-5 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{
                background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.08)',
              }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
                <div>
                  <div className="text-[16px] font-bold leading-tight" style={{ color: '#d4af37' }}>{videos.length}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: '#64748b' }}>Videolar</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{
                background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.08)',
              }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="text-[16px] font-bold leading-tight" style={{ color: '#3b82f6' }}>{formatViewCount(totalViews)}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: '#64748b' }}>Görüntülenme</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{
                background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.08)',
              }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-bold leading-tight" style={{ color: '#00E5FF' }}>
                    {latestUpdateTime ? timeAgo(latestUpdateTime) : '—'}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: '#64748b' }}>Son Güncelleme</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedBorderWrapper>

      {/* ═══ Filter Section — 3 Clear Rows ═══ */}
      <div className="rounded-2xl p-5 mt-6 mb-6" style={{
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Row 1: Asset Class Tabs */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold mb-2" style={{ color: '#475569' }}>Varlık Sınıfı</div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {ASSET_CLASS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap"
                style={{
                  background: activeTab === tab.key
                    ? 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(59,130,246,0.06))'
                    : 'rgba(255,255,255,0.02)',
                  color: activeTab === tab.key ? '#00E5FF' : '#64748b',
                  border: activeTab === tab.key
                    ? '1px solid rgba(0,229,255,0.15)'
                    : '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                }}
              >
                <span className="text-[13px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Report Type Tabs */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold mb-2" style={{ color: '#475569' }}>Rapor Türü</div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {REPORT_TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setReportTypeFilter(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap"
                style={{
                  background: reportTypeFilter === tab.key
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))'
                    : 'rgba(255,255,255,0.02)',
                  color: reportTypeFilter === tab.key ? '#d4af37' : '#64748b',
                  border: reportTypeFilter === tab.key
                    ? '1px solid rgba(212,175,55,0.15)'
                    : '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                }}
              >
                <span className="text-[12px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider between tab rows and search row */}
        <div className="w-full h-px mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Row 3: Search + Impact + Sort */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Symbol Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Sembol ara..."
              value={searchSymbol}
              onChange={e => setSearchSymbol(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-[12px] font-medium outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#fff',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
            />
          </div>

          {/* Impact filters */}
          <div className="flex items-center gap-2">
            {IMPACT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setImpactFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: impactFilter === f.key ? `${f.color}15` : 'transparent',
                  color: impactFilter === f.key ? f.color : '#475569',
                  border: impactFilter === f.key ? `1px solid ${f.color}30` : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Sort */}
          <div className="flex items-center gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: sortBy === opt.key ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: sortBy === opt.key ? '#fff' : '#475569',
                  border: sortBy === opt.key ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Hero Video Card ═══ */}
      <AnimatePresence mode="wait">
        {heroVideo && !loading && (
          <motion.div
            key={heroVideo.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-8"
          >
            <Link href={`/tr/videos/${heroVideo.id}`} className="block group">
              <AnimatedBorderWrapper borderRadius={20}>
                <div className="flex flex-col sm:flex-row sm:min-h-[320px]" style={{ background: '#050810' }}>
                  {/* ─── Visual Area (60%) ─── */}
                  <div className="relative w-full sm:w-[60%] overflow-hidden" style={{ minHeight: '220px' }}>
                    {/* Thumbnail or gradient background */}
                    {heroVideo.thumbnailUrl ? (
                      <img
                        src={heroVideo.thumbnailUrl}
                        alt={heroVideo.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'brightness(0.8) contrast(1.05)' }}
                      />
                    ) : (
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(${(heroVideo.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360)}deg, #050810 0%, #0c1426 40%, #0a1120 70%, #050810 100%)`,
                      }} />
                    )}

                    {/* Subtle vignette overlay */}
                    <div className="absolute inset-0" style={{
                      background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,8,16,0.5) 100%)',
                    }} />

                    {/* Featured badge — top left (start in LTR) */}
                    <motion.div
                      className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.12))',
                        border: '1px solid rgba(212,175,55,0.3)',
                        backdropFilter: 'blur(12px)',
                      }}
                      animate={{ boxShadow: ['0 0 0px rgba(212,175,55,0)', '0 0 20px rgba(212,175,55,0.15)', '0 0 0px rgba(212,175,55,0)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#d4af37">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                      <span className="text-[10px] font-bold" style={{ color: '#d4af37' }}>Öne Çıkan</span>
                    </motion.div>

                    {/* Duration badge — bottom right */}
                    <div className="absolute bottom-4 right-4 z-30 px-3 py-1.5 rounded-lg" style={{
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}>
                      {formatDuration(heroVideo.duration)}
                    </div>

                    {/* Play button overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.95)',
                        boxShadow: `0 0 30px ${getAssetClassColor(heroVideo.assetClass)}40, 0 4px 24px rgba(0,0,0,0.5)`,
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#050810">
                          <polygon points="7,4 20,12 7,20" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* ─── Content Area (40%) ─── */}
                  <div className="relative w-full sm:w-[40%] flex flex-col justify-between p-5 sm:p-7 overflow-hidden" style={{
                    background: 'linear-gradient(180deg, #080e22 0%, #050810 100%)',
                  }}>
                    {/* Ambient glow matching asset class */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${getAssetClassColor(heroVideo.assetClass)}06 0%, transparent 60%)`,
                    }} />

                    {/* Top: Badges + Title */}
                    <div className="relative">
                      {/* Badges row — pill style */}
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {(() => {
                          const imp = getImpactInfo(heroVideo.marketImpact);
                          return (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                              background: imp.bg, color: imp.color, border: `1px solid ${imp.border}`,
                            }}>
                              {imp.arrow} {imp.label}
                            </span>
                          );
                        })()}
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{
                          background: `${getReportTypeColor(heroVideo.reportType)}12`,
                          color: getReportTypeColor(heroVideo.reportType),
                          border: `1px solid ${getReportTypeColor(heroVideo.reportType)}20`,
                        }}>
                          {getReportTypeLabel(heroVideo.reportType)}
                        </span>
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                          background: `${getAssetClassColor(heroVideo.assetClass)}12`,
                          color: getAssetClassColor(heroVideo.assetClass),
                          border: `1px solid ${getAssetClassColor(heroVideo.assetClass)}25`,
                        }}>
                          {getAssetClassLabel(heroVideo.assetClass)}
                        </span>
                      </div>

                      {/* Title — up to 3 lines */}
                      <h2 className="text-lg sm:text-xl font-bold group-hover:text-[#00E5FF] transition-colors leading-relaxed line-clamp-3" style={{ color: '#fff' }}>
                        {heroVideo.title}
                      </h2>
                    </div>

                    {/* Bottom: Meta info with separator */}
                    <div className="relative mt-auto pt-4">
                      {/* Separator line */}
                      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <div className="flex items-center gap-3 text-[12px] flex-wrap" style={{ color: '#64748b' }}>
                        <span className="font-mono font-bold" style={{ color: getAssetClassColor(heroVideo.assetClass) }}>
                          {heroVideo.symbol.split('-')[0].split('=')[0]}
                        </span>
                        <span style={{ color: '#1e293b' }}>·</span>
                        <span>{heroVideo.assetName}</span>
                        <span style={{ color: '#1e293b' }}>·</span>
                        <span>{timeAgo(heroVideo.publishedAt || heroVideo.createdAt)}</span>
                        <span style={{ color: '#1e293b' }}>·</span>
                        <div className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          {heroVideo.viewCount} görüntülenme
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedBorderWrapper>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Video Grid ═══ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <div className="aspect-video" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <motion.div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)' }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.015)' }} />
                <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.01)' }} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        /* ═══ Empty State ═══ */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="max-w-sm mx-auto">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl" style={{
                background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
              }} />
              <div className="relative w-full h-full rounded-2xl flex items-center justify-center" style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-2" style={{ color: '#94a3b8' }}>Video mevcut değil</h3>
            <p className="text-sm" style={{ color: '#475569' }}>
              {searchSymbol
                ? `"${searchSymbol}" ile eşleşen video bulunamadı. Başka bir arama terimi deneyin.`
                : reportTypeFilter !== 'all'
                  ? 'Bu rapor türü için video bulunamadı. Başka bir filtre deneyin.'
                  : 'Videolar mevcut olduğunda burada görünecektir.'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(heroVideo ? gridVideos : filteredVideos).map((video, idx) => {
            const clsColor = getAssetClassColor(video.assetClass);
            const impact = getImpactInfo(video.marketImpact);
            const symbol = video.symbol.split('-')[0].split('=')[0];
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <Link href={`/tr/videos/${video.id}`} className="block group">
                  <div className="rounded-xl overflow-hidden" style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${clsColor}30`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${clsColor}08`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video">
                      <VideoThumbnail video={video} size="normal" />
                    </div>

                    {/* Card Info */}
                    <div className="p-3.5">
                      {/* Title — 2 lines max */}
                      <h3 className="text-[13px] font-bold leading-snug mb-2 line-clamp-2 group-hover:text-[#00E5FF] transition-colors" style={{ color: '#e2e8f0' }}>
                        {video.title}
                      </h3>

                      {/* Single info line: symbol · type · time */}
                      <div className="flex items-center gap-1.5 text-[11px] flex-wrap" style={{ color: '#64748b' }}>
                        <span className="font-bold" style={{ color: clsColor }}>{symbol}</span>
                        <span style={{ color: '#1e293b' }}>·</span>
                        <span>{getReportTypeLabel(video.reportType)}</span>
                        <span style={{ color: '#1e293b' }}>·</span>
                        <span>{timeAgo(video.publishedAt || video.createdAt)}</span>
                      </div>

                      {/* Impact badge + Views */}
                      <div className="flex items-center justify-between mt-2.5">
                        {video.marketImpact && video.marketImpact !== 'neutral' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{
                            background: impact.bg,
                            color: impact.color,
                            border: `1px solid ${impact.border}`,
                          }}>
                            {impact.arrow} {impact.label}
                          </span>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: '#475569' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          {formatViewCount(video.viewCount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
