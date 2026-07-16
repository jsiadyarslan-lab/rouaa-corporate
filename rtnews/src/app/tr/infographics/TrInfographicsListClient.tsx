// ─── French Infographics List Client Component ───────────────
// Based on EnInfographicsListClient — LTR + French translations

'use client';

import { useState, useMemo, useCallback } from 'react';
import { InfographicData, DESIGN_TOKENS, getCategoryColor, hexToRgba } from '@/components/infographics/types';
import InfographicCard from '@/components/infographics/InfographicCard';
import Link from 'next/link';

const ITEMS_PER_PAGE = 9;

type TimeFilter = 'all' | 'today' | 'week';

interface TrInfographicsListClientProps {
  infographics: any[];
}

export default function TrInfographicsListClient({ infographics }: TrInfographicsListClientProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Filter by time
  const filteredByTime = useMemo(() => {
    if (timeFilter === 'all') return infographics;
    const now = new Date();
    return infographics.filter((i: any) => {
      const date = new Date(i.publishedAt || i.createdAt);
      if (timeFilter === 'today') {
        return date.toDateString() === now.toDateString();
      }
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      return true;
    });
  }, [infographics, timeFilter]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTime;
    const q = searchQuery.trim().toLowerCase();
    return filteredByTime.filter((i: any) =>
      (i.title || '').toLowerCase().includes(q) ||
      (i.subtitle || '').toLowerCase().includes(q)
    );
  }, [filteredByTime, searchQuery]);

  // Featured — newest infographic
  const featured = useMemo(() => {
    if (infographics.length === 0) return null;
    if (timeFilter !== 'all' || searchQuery.trim()) return null;
    return infographics[0] as InfographicData;
  }, [infographics, timeFilter, searchQuery]);

  // Remaining infographics (excluding featured)
  const remaining = useMemo(() => {
    if (!featured) return filtered;
    return filtered.filter((i: any) => i.id !== featured.id);
  }, [filtered, featured]);

  // Visible items (load more)
  const visibleItems = useMemo(() => {
    return remaining.slice(0, visibleCount);
  }, [remaining, visibleCount]);

  const hasMore = remaining.length > visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const handleTimeFilterChange = useCallback((filter: TimeFilter) => {
    setTimeFilter(filter);
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  // Time filter config — French
  const timeFilters: { key: TimeFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'Tümü', icon: '📋' },
    { key: 'today', label: 'Bugün', icon: '📅' },
    { key: 'week', label: 'Bu hafta', icon: '📊' },
  ];

  return (
    <div className="min-h-screen" dir="ltr" style={{ background: DESIGN_TOKENS.bgDeep }}>
      {/* ─── Hero Header Section ─── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${DESIGN_TOKENS.bgSlide} 0%, ${DESIGN_TOKENS.bgDeep} 100%)` }}>
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 15% 25%, ${DESIGN_TOKENS.gold} 0%, transparent 45%), radial-gradient(circle at 85% 75%, ${DESIGN_TOKENS.info} 0%, transparent 45%)`,
        }} />
        <div className="absolute inset-0 opacity-[0.012]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${DESIGN_TOKENS.gold} 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, ${DESIGN_TOKENS.gold} 0px, transparent 1px, transparent 80px)`,
        }} />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-6 sm:pb-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-xl text-[12px] font-bold mb-5"
              style={{ background: hexToRgba(DESIGN_TOKENS.gold, 0.08), color: DESIGN_TOKENS.gold, border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.15)}` }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              Rouaa İnfografikleri
            </div>

            <h1 className="text-[28px] sm:text-[40px] font-bold mb-3 leading-tight"
              style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontTitle }}>
              Görsel Ekonomik Analiz
            </h1>
            <p className="text-[13px] sm:text-[15px] max-w-[500px] mx-auto leading-relaxed"
              style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
              Actualités économiques et rapports transformés en diapositives visuelles interactives
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-12">
        {/* ─── Search Bar ─── */}
        <div className="relative -mt-5 mb-5 max-w-[520px] mx-auto">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DESIGN_TOKENS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="İnfografik ara..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-[16px] sm:text-[13px] font-medium outline-none transition-all duration-200"
              style={{
                background: DESIGN_TOKENS.bgCard,
                color: DESIGN_TOKENS.textPrimary,
                border: `1px solid ${DESIGN_TOKENS.borderDefault}`,
                fontFamily: DESIGN_TOKENS.fontBody,
                boxShadow: DESIGN_TOKENS.shadowCard,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = DESIGN_TOKENS.info + '40';
                e.currentTarget.style.boxShadow = `0 0 0 3px ${hexToRgba(DESIGN_TOKENS.info, 0.08)}, ${DESIGN_TOKENS.shadowCard}`;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = DESIGN_TOKENS.borderDefault;
                e.currentTarget.style.boxShadow = DESIGN_TOKENS.shadowCard;
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setVisibleCount(ITEMS_PER_PAGE); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-all"
                style={{ background: hexToRgba(DESIGN_TOKENS.textMuted, 0.10), color: DESIGN_TOKENS.textMuted }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* ─── Time Filter ─── */}
        <div className="flex items-center justify-center gap-2 mb-7">
          {timeFilters.map(tf => {
            const isActive = timeFilter === tf.key;
            return (
              <button
                key={tf.key}
                onClick={() => handleTimeFilterChange(tf.key)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl text-[12px] font-bold transition-all duration-200 flex items-center gap-2"
                style={{
                  background: isActive ? hexToRgba(DESIGN_TOKENS.info, 0.12) : DESIGN_TOKENS.bgCard,
                  color: isActive ? DESIGN_TOKENS.info : DESIGN_TOKENS.textSecondary,
                  border: `1px solid ${isActive ? hexToRgba(DESIGN_TOKENS.info, 0.20) : DESIGN_TOKENS.borderDefault}`,
                  fontFamily: DESIGN_TOKENS.fontBody,
                  boxShadow: isActive ? DESIGN_TOKENS.shadowGlow(DESIGN_TOKENS.info, 10) : 'none',
                }}>
                <span className="text-[14px]">{tf.icon}</span>
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Results info */}
        {(timeFilter !== 'all' || searchQuery.trim()) && (
          <div className="flex items-center gap-2 mb-5 px-1 justify-center">
            <span className="text-[12px]" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontBody }}>
              {filtered.length} sonuç
            </span>
            {timeFilter !== 'all' && (
              <>
                <span className="text-[12px]" style={{ color: DESIGN_TOKENS.textMuted }}>içinde</span>
                <span className="text-[12px] font-bold" style={{ color: DESIGN_TOKENS.info, fontFamily: DESIGN_TOKENS.fontBody }}>
                  {timeFilter === 'today' ? 'Bugün' : 'Bu hafta'}
                </span>
              </>
            )}
            {searchQuery.trim() && (
              <>
                <span className="text-[12px]" style={{ color: DESIGN_TOKENS.textMuted }}>için</span>
                <span className="text-[12px] font-bold" style={{ color: DESIGN_TOKENS.info, fontFamily: DESIGN_TOKENS.fontBody }}>
                  &ldquo;{searchQuery}&rdquo;
                </span>
              </>
            )}
            <button
              onClick={() => { handleTimeFilterChange('all'); setSearchQuery(''); }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ml-2"
              style={{ background: hexToRgba(DESIGN_TOKENS.textMuted, 0.08), color: DESIGN_TOKENS.textMuted }}>
              Filtreleri temizle
            </button>
          </div>
        )}

        {/* ─── Featured Infographic ─── */}
        {timeFilter === 'all' && !searchQuery.trim() && featured && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 rounded-full" style={{ background: DESIGN_TOKENS.gold }} />
              <span className="text-[13px] font-bold" style={{ color: DESIGN_TOKENS.gold, fontFamily: DESIGN_TOKENS.fontTitle }}>En Son</span>
              <div className="flex-1 h-px" style={{ background: hexToRgba(DESIGN_TOKENS.gold, 0.12) }} />
            </div>
            <Link href={`/tr/infographics/${featured.slug}`}>
              <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer"
                style={{
                  border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.18)}`,
                  boxShadow: `0 6px 28px rgba(0,0,0,0.35), 0 0 16px ${hexToRgba(DESIGN_TOKENS.gold, 0.06)}`,
                  background: DESIGN_TOKENS.bgSlide,
                }}
                onMouseEnter={e => {
                  const catColor = getCategoryColor(featured.category);
                  e.currentTarget.style.borderColor = catColor + '35';
                  e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.45), 0 0 20px ${catColor}12`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = hexToRgba(DESIGN_TOKENS.gold, 0.18);
                  e.currentTarget.style.boxShadow = `0 6px 28px rgba(0,0,0,0.35), 0 0 16px ${hexToRgba(DESIGN_TOKENS.gold, 0.06)}`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Left: Preview area */}
                  <div className="relative min-h-[280px] sm:min-h-[340px] overflow-hidden"
                    style={{ background: `linear-gradient(145deg, ${getCategoryColor(featured.category)}10 0%, ${DESIGN_TOKENS.bgDeep} 40%)` }}>
                    {(() => {
                      const fs = (featured as any).slides?.[0];
                      const imgUrl = fs?.image_url || fs?.imageUrl || fs?.content?.image_url;
                      if (imgUrl) {
                        return (
                          <>
                            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                              style={{ backgroundImage: `url(${imgUrl})` }} />
                            <div className="absolute inset-0" style={{
                              background: `linear-gradient(270deg, rgba(10,14,26,0.25) 0%, rgba(10,14,26,0.80) 65%, rgba(10,14,26,0.97) 100%)`
                            }} />
                          </>
                        );
                      }
                      return (
                        <div className="absolute inset-0 opacity-[0.04]" style={{
                          backgroundImage: `radial-gradient(circle at 30% 40%, ${getCategoryColor(featured.category)} 0%, transparent 50%), radial-gradient(circle at 70% 60%, ${getCategoryColor(featured.category)} 0%, transparent 50%)`,
                        }} />
                      );
                    })()}

                    {/* Hero number */}
                    {(() => {
                      const fs = (featured as any).slides?.[0];
                      const hNum = fs?.content?.heroNumber || fs?.heroNumber;
                      const hUnit = fs?.content?.heroUnit || fs?.heroUnit;
                      const catColor = getCategoryColor(featured.category);
                      if (hNum) {
                        return (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none">
                            <span className="text-[56px] sm:text-[72px] font-bold leading-none"
                              style={{ color: catColor, textShadow: `0 4px 36px ${catColor}28`, fontFamily: DESIGN_TOKENS.fontData }}>
                              {hNum}
                            </span>
                            {hUnit && (
                              <span className="block text-[13px] sm:text-[15px] font-semibold mt-2"
                                style={{ color: DESIGN_TOKENS.textLabel, fontFamily: DESIGN_TOKENS.fontBody }}>
                                {hUnit}
                              </span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Right: Info */}
                  <div className="flex flex-col justify-center p-6 sm:p-8 md:p-9">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] px-2.5 py-1 rounded-md font-bold"
                        style={{ background: hexToRgba(DESIGN_TOKENS.gold, 0.08), color: DESIGN_TOKENS.gold, border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.12)}` }}>
                        Öne Çıkan
                      </span>
                    </div>
                    <h2 className="text-[18px] sm:text-[22px] font-bold mb-2.5 leading-tight"
                      style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontTitle }}>
                      {featured.title}
                    </h2>
                    {featured.subtitle && (
                      <p className="text-[12px] sm:text-[13px] mb-4 leading-relaxed line-clamp-3"
                        style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
                        {featured.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center gap-1.5 text-[11px]" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontBody }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {new Date(featured.publishedAt || featured.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 text-[12px] font-bold self-start px-4 py-2 rounded-lg transition-all duration-200 group-hover:gap-3"
                      style={{ background: hexToRgba(getCategoryColor(featured.category), 0.10), color: getCategoryColor(featured.category), border: `1px solid ${hexToRgba(getCategoryColor(featured.category), 0.18)}` }}>
                      Detayları görüntüle
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {(timeFilter !== 'all' || searchQuery.trim() ? filtered : visibleItems).map((infographic) => (
                <InfographicCard key={infographic.id} infographic={infographic as InfographicData} locale="tr" />
              ))}
            </div>

            {/* Load More */}
            {(timeFilter !== 'all' || searchQuery.trim()) ? null : hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 min-h-[48px] rounded-xl text-[13px] font-bold transition-all duration-200"
                  style={{
                    background: DESIGN_TOKENS.bgCard,
                    color: DESIGN_TOKENS.textSecondary,
                    border: `1px solid ${DESIGN_TOKENS.borderDefault}`,
                    fontFamily: DESIGN_TOKENS.fontBody,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = DESIGN_TOKENS.info + '35';
                    e.currentTarget.style.color = DESIGN_TOKENS.info;
                    e.currentTarget.style.background = hexToRgba(DESIGN_TOKENS.info, 0.06);
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = DESIGN_TOKENS.borderDefault;
                    e.currentTarget.style.color = DESIGN_TOKENS.textSecondary;
                    e.currentTarget.style.background = DESIGN_TOKENS.bgCard;
                  }}>
                  Daha fazla yükle
                  <span className="ml-1.5 text-[11px] font-semibold" style={{ color: DESIGN_TOKENS.textMuted }}>
                    ({remaining.length - visibleCount} kalan)
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: hexToRgba(DESIGN_TOKENS.textMuted, 0.06) }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={DESIGN_TOKENS.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-[14px] font-bold mb-2" style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
              Sonuç bulunamadı
            </p>
            <p className="text-[12px]" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontBody }}>
              Aramanızı ayarlamayı veya farklı bir dönem seçmeyi deneyin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
