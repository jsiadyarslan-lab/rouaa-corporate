'use client';

// ─── HomeVideosSection — Latest 4 videos for homepage (all locales) ──
// V1044: Adds a "Latest Videos" section to the homepage between Stock
// Analysis and Most Active Markets. Reused across all 5 locales via the
// `locale` prop. Fetches from the existing /api/video/list endpoint.
//
// Features:
// - 4 latest videos in a responsive grid (4 → 2 → 1)
// - Locale-aware (ar/en/fr/tr/es) — fetches videos for the current locale
// - Glass-card design matching the rest of the homepage
// - Skeleton loading state
// - Hidden silently if no videos exist (no error message)
// - "View All" link to /{locale}/videos

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────

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

// ─── Locale text ────────────────────────────────────────────────

const TEXT: Record<string, {
  sectionTitle: string;
  viewAll: string;
  live: string;
  bullish: string;
  bearish: string;
  neutral: string;
  timeAgo: (dateStr: string) => string;
  reportTypes: Record<string, string>;
}> = {
  ar: {
    sectionTitle: 'أحدث الفيديوهات',
    viewAll: 'عرض الكل',
    live: 'مباشر',
    bullish: 'صعودي',
    bearish: 'هبوطي',
    neutral: 'محايد',
    timeAgo: (d: string) => {
      const diff = Date.now() - new Date(d).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `منذ ${mins} دقيقة`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `منذ ${hrs} ساعة`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `منذ ${days} يوم`;
      return new Date(d).toLocaleDateString('ar-SA');
    },
    reportTypes: {
      analysis: 'تحليل',
      daily: 'يومي',
      weekly: 'أسبوعي',
      strategic: 'استراتيجي',
      technical_analysis: 'تحليل فني',
      economic_report: 'تقرير اقتصادي',
      market_analysis: 'تحليل سوق',
    },
  },
  en: {
    sectionTitle: 'Latest Videos',
    viewAll: 'View All',
    live: 'LIVE',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    timeAgo: (d: string) => {
      const diff = Date.now() - new Date(d).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(d).toLocaleDateString('en-US');
    },
    reportTypes: {
      analysis: 'Analysis',
      daily: 'Daily',
      weekly: 'Weekly',
      strategic: 'Strategic',
      technical_analysis: 'Technical',
      economic_report: 'Economic',
      market_analysis: 'Market',
    },
  },
  fr: {
    sectionTitle: 'Dernières Vidéos',
    viewAll: 'Voir Tout',
    live: 'DIRECT',
    bullish: 'Haussier',
    bearish: 'Baissier',
    neutral: 'Neutre',
    timeAgo: (d: string) => {
      const diff = Date.now() - new Date(d).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `il y a ${mins} min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `il y a ${hrs}h`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `il y a ${days}j`;
      return new Date(d).toLocaleDateString('fr-FR');
    },
    reportTypes: {
      analysis: 'Analyse',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      strategic: 'Stratégique',
      technical_analysis: 'Technique',
      economic_report: 'Économique',
      market_analysis: 'Marché',
    },
  },
  tr: {
    sectionTitle: 'Son Videolar',
    viewAll: 'Tümünü Gör',
    live: 'CANLI',
    bullish: 'Yükseliş',
    bearish: 'Düşüş',
    neutral: 'Nötr',
    timeAgo: (d: string) => {
      const diff = Date.now() - new Date(d).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins} dk önce`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} sa önce`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days} gün önce`;
      return new Date(d).toLocaleDateString('tr-TR');
    },
    reportTypes: {
      analysis: 'Analiz',
      daily: 'Günlük',
      weekly: 'Haftalık',
      strategic: 'Stratejik',
      technical_analysis: 'Teknik',
      economic_report: 'Ekonomik',
      market_analysis: 'Piyasa',
    },
  },
  es: {
    sectionTitle: 'Últimos Videos',
    viewAll: 'Ver Todo',
    live: 'EN VIVO',
    bullish: 'Alcista',
    bearish: 'Bajista',
    neutral: 'Neutral',
    timeAgo: (d: string) => {
      const diff = Date.now() - new Date(d).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `hace ${mins} min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `hace ${hrs}h`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `hace ${days}d`;
      return new Date(d).toLocaleDateString('es-ES');
    },
    reportTypes: {
      analysis: 'Análisis',
      daily: 'Diario',
      weekly: 'Semanal',
      strategic: 'Estratégico',
      technical_analysis: 'Técnico',
      economic_report: 'Económico',
      market_analysis: 'Mercado',
    },
  },
};

// ─── Helpers ────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return '1:30';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
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

function getImpactInfo(impact: string | undefined, t: typeof TEXT['en']) {
  if (!impact || impact === 'neutral') return { label: t.neutral, color: '#d4af37', arrow: '→', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.2)' };
  if (['bullish', 'positive'].includes(impact)) return { label: t.bullish, color: '#22c55e', arrow: '↑', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' };
  if (['bearish', 'negative'].includes(impact)) return { label: t.bearish, color: '#ef4444', arrow: '↓', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
  return { label: t.neutral, color: '#d4af37', arrow: '→', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.2)' };
}

// ─── Component ──────────────────────────────────────────────────

interface HomeVideosSectionProps {
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export default function HomeVideosSection({ locale }: HomeVideosSectionProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = TEXT[locale] || TEXT.en;
  const isRTL = locale === 'ar';
  const videosPath = locale === 'ar' ? '/videos' : `/${locale}/videos`;

  useEffect(() => {
    let cancelled = false;
    async function fetchVideos() {
      try {
        const res = await fetch(`/api/video/list?locale=${locale}&limit=4`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.videos)) {
            setVideos(data.videos.slice(0, 4));
          }
        }
      } catch {
        // Silent fail — hide the section if videos can't be loaded
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchVideos();
    return () => { cancelled = true; };
  }, [locale]);

  // Hide the section entirely if no videos exist for this locale
  if (!loading && videos.length === 0) return null;

  return (
    <section style={{ marginBottom: 'var(--space-lg)' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 8px rgba(0,229,255,.3)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>📺 {t.sectionTitle}</span>
          <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: 'var(--cyan2)', color: 'var(--cyan)', letterSpacing: 0.5 }}>{t.live}</span>
        </div>
        <Link
          href={videosPath}
          style={{
            background: 'rgba(0,229,255,.12)',
            border: '1px solid rgba(0,229,255,.25)',
            borderRadius: 'var(--r)',
            padding: '5px 14px',
            color: 'var(--cyan)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all .2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {t.viewAll}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {isRTL ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
          </svg>
        </Link>
      </div>

      {/* Videos Grid — 4 columns desktop, 2 tablet, 1 mobile */}
      <div className="home-videos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
        {loading ? (
          // Skeleton placeholders
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ background: 'var(--bg3)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
              <div style={{ aspectRatio: '16/9', background: 'var(--bg4)' }} />
              <div style={{ padding: 12 }}>
                <div style={{ height: 12, background: 'var(--bg4)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 10, background: 'var(--bg4)', borderRadius: 4, width: '60%' }} />
              </div>
            </div>
          ))
        ) : (
          videos.map((video) => {
            const clsColor = getAssetClassColor(video.assetClass);
            const impact = getImpactInfo(video.marketImpact, t);
            const symbol = video.symbol.split('-')[0].split('=')[0];
            const reportTypeLabel = t.reportTypes[video.reportType] || video.reportType;
            const videoHref = locale === 'ar' ? `/videos/${video.id}` : `/${locale}/videos/${video.id}`;

            return (
              <Link key={video.id} href={videoHref} className="block group" style={{ textDecoration: 'none' }}>
                <div
                  className="glass-card"
                  style={{
                    background: 'var(--bg3)',
                    borderRadius: 'var(--r2)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${clsColor}40`;
                    e.currentTarget.style.boxShadow = `0 4px 24px ${clsColor}10`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg4)' }}>
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                        className="group-hover:scale-105"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: `linear-gradient(135deg, ${clsColor}30, var(--bg4))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 36, fontWeight: 800, color: `${clsColor}40`, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{symbol}</span>
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,8,16,0.6) 0%, transparent 50%)' }} />

                    {/* Asset class badge (top-right) */}
                    <span style={{
                      position: 'absolute', top: 8, insetInlineEnd: 8,
                      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: `${clsColor}20`, color: clsColor, border: `1px solid ${clsColor}40`,
                      backdropFilter: 'blur(8px)',
                    }}>
                      {video.assetClass}
                    </span>

                    {/* Duration badge (bottom-left) */}
                    <span style={{
                      position: 'absolute', bottom: 8, insetInlineStart: 8,
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(0,0,0,0.75)', color: '#fff',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                    }}>
                      ⏱ {formatDuration(video.duration)}
                    </span>

                    {/* Play button on hover */}
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s',
                    }} className="group-hover:opacity-100">
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(0,229,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 24px rgba(0,229,255,0.4)',
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#050810">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Title — 2 lines max */}
                    <h3 style={{
                      fontSize: 13, fontWeight: 700, lineHeight: 1.5, marginBottom: 8,
                      color: 'var(--text)', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      transition: 'color 0.2s',
                    }} className="group-hover:text-[var(--cyan)]">
                      {video.title}
                    </h3>

                    {/* Info line: symbol · reportType · timeAgo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: clsColor }}>{symbol}</span>
                      <span style={{ color: 'var(--text4)' }}>·</span>
                      <span>{reportTypeLabel}</span>
                      <span style={{ color: 'var(--text4)' }}>·</span>
                      <span>{t.timeAgo(video.publishedAt || video.createdAt)}</span>
                    </div>

                    {/* Impact badge + Views */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      {video.marketImpact && video.marketImpact !== 'neutral' ? (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                          background: impact.bg, color: impact.color, border: `1px solid ${impact.border}`,
                        }}>
                          {impact.arrow} {impact.label}
                        </span>
                      ) : (
                        <span />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text4)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {formatViews(video.viewCount)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Responsive CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .home-videos-grid { grid-template-columns: repeat(4, 1fr) !important; }
          @media (max-width: 1100px) { .home-videos-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 640px) { .home-videos-grid { grid-template-columns: 1fr !important; } }
        `,
      }} />
    </section>
  );
}
