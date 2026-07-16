'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getTAStrings, formatTimeAgoTA, TALocale } from '@/lib/technical-analyses-i18n';
import TechnicalAnalysisCard, { ContentAnalysis, translateCategory, translateType, CardSkeleton } from './TechnicalAnalysisCard';

interface Props { locale: TALocale; }

function classifySentiment(s: string | number): 'bullish' | 'bearish' | 'neutral' {
  const str = String(s || '').toLowerCase();
  if (/bull|positive|up|صعود|إيجاب|long|buy/.test(str)) return 'bullish';
  if (/bear|negative|down|هبوط|سلب|short|sell/.test(str)) return 'bearish';
  return 'neutral';
}

function FilterChip({ active, onClick, label, count, colorVar }: { active: boolean; onClick: () => void; label: string; count: number; colorVar: string }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', cursor: 'pointer', background: active ? `var(--${colorVar}2)` : 'transparent', color: active ? `var(--${colorVar})` : 'var(--text3)', border: `1px solid ${active ? `var(--${colorVar}2)` : 'var(--rim)'}`, transition: 'all 0.2s ease', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}><span>{label}</span><span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: active ? `var(--${colorVar}2)` : 'var(--surface-2)', color: active ? `var(--${colorVar})` : 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{count}</span></button>;
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return <div className="glass-card" style={{ padding: '12px 14px', textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: 'var(--font-jetbrains-mono, monospace)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><span style={{ fontSize: '14px' }}>{icon}</span>{value}</div><div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{label}</div></div>;
}

// Heatmap data processor
function HeatmapGrid({ analyses, locale }: { analyses: ContentAnalysis[]; locale: TALocale }) {
  const s = getTAStrings(locale);
  const data = useMemo(() => {
    const categories = ['CRYPTO', 'FOREX', 'STOCKS', 'COMMODITIES', 'ECONOMY', 'BANKING'];
    const grid: Record<string, { bullish: number; bearish: number; neutral: number; total: number }> = {};
    for (const cat of categories) grid[cat] = { bullish: 0, bearish: 0, neutral: 0, total: 0 };
    for (const a of analyses) {
      const cat = String(a.category || a.assetClass || '').toUpperCase();
      if (grid[cat]) { const sc = classifySentiment(a.sentiment); grid[cat][sc]++; grid[cat].total++; }
    }
    return { categories, grid };
  }, [analyses]);

  if (analyses.length === 0) return null;

  return (
    <div className="glass-card" style={{ borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '16px' }}>🔥</span>
        <div><h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)', margin: 0 }}>{s.heatmapTitle}</h3><p style={{ fontSize: '9px', color: 'var(--text3)', margin: 0 }}>{s.heatmapSubtitle}</p></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px' }}>
        {data.categories.map(cat => {
          const d = data.grid[cat]; if (d.total === 0) return null;
          const dominant = d.bullish > d.bearish && d.bullish > d.neutral ? 'bullish' : d.bearish > d.neutral ? 'bearish' : 'neutral';
          const color = dominant === 'bullish' ? 'var(--bull)' : dominant === 'bearish' ? 'var(--bear)' : 'var(--gold)';
          const bg = dominant === 'bullish' ? 'var(--bull2)' : dominant === 'bearish' ? 'var(--bear2)' : 'var(--gold2)';
          return <div key={cat} style={{ padding: '10px', borderRadius: '8px', background: bg, border: `1px solid ${color}33`, textAlign: 'center' }}><div style={{ fontSize: '11px', fontWeight: 700, color, marginBottom: '4px' }}>{translateCategory(cat, locale)}</div><div style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{d.total}</div><div style={{ fontSize: '8px', color, opacity: 0.7 }}>▲{d.bullish} ▼{d.bearish} ◆{d.neutral}</div></div>;
        })}
      </div>
    </div>
  );
}

export default function TechnicalAnalysesCenter({ locale }: Props) {
  const s = getTAStrings(locale);
  const isRTL = s.dir === 'rtl';
  const [mounted, setMounted] = useState(false);
  const [analyses, setAnalyses] = useState<ContentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Fetch from external source (roua-trading content agent)
  useEffect(() => {
    setMounted(true); window.scrollTo(0, 0);
    const fetchAnalyses = async () => {
      try {
        setLoading(true); setError(null);
        const extRes = await fetch(`/api/trading-platform/analysis?limit=30&locale=${locale}`, { cache: 'no-store', signal: AbortSignal.timeout(12000) }).then(r => r.ok ? r.json() : null).catch(() => null);
        let articles: ContentAnalysis[] = [];
        if (extRes && Array.isArray(extRes.articles) && extRes.articles.length > 0) {
          articles = extRes.articles.map((a: any) => ({ ...a, source: 'external' }));
        }
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setAnalyses(articles);
      } catch (err) { setError(err instanceof Error ? err.message : String(err)); } finally { setLoading(false); }
    };
    fetchAnalyses();
  }, [locale]);

  const categories = useMemo(() => { const set = new Set<string>(); for (const a of analyses) { const c = a.category || a.assetClass; if (c) set.add(c); } return Array.from(set).sort(); }, [analyses]);
  const types = useMemo(() => { const set = new Set<string>(); for (const a of analyses) { const t = a.type || a.analysisType; if (t) set.add(t); } return Array.from(set).sort(); }, [analyses]);

  const filteredAnalyses = useMemo(() => {
    let result = [...analyses];
    // Tab filter
    if (activeTab !== 'all') {
      const tabMap: Record<string, string[]> = { crypto: ['CRYPTO', 'crypto'], forex: ['FOREX', 'forex'], stocks: ['STOCKS', 'stocks'], commodities: ['COMMODITIES', 'commodities'] };
      const allowed = tabMap[activeTab] || [activeTab];
      result = result.filter(a => { const c = String(a.category || a.assetClass || '').toUpperCase(); return allowed.some(al => c === al.toUpperCase()); });
    }
    if (typeFilter !== 'all') result = result.filter(a => { const t = a.type || a.analysisType; return t === typeFilter; });
    if (sentimentFilter !== 'all') result = result.filter(a => classifySentiment(a.sentiment) === sentimentFilter);
    if (impactFilter !== 'all') { const wantHigh = impactFilter === 'high'; result = result.filter(a => { const imp = String(a.impactLevel || a.riskLevel || '').toUpperCase(); return wantHigh ? imp === 'HIGH' || imp === 'EXTREME' : imp !== 'HIGH' && imp !== 'EXTREME'; }); }
    if (timeFilter !== 'all') { const now = Date.now(); const cutoff = timeFilter === 'today' ? 24 * 3600000 : timeFilter === 'thisWeek' ? 7 * 24 * 3600000 : 30 * 24 * 3600000; result = result.filter(a => now - new Date(a.publishedAt).getTime() < cutoff); }
    if (searchQuery.trim()) { const q = searchQuery.trim().toLowerCase(); result = result.filter(a => { const title = (a.title || '').toLowerCase(); const symbols = (a.symbols || []).join(' ').toLowerCase(); const tags = (a.tags || []).join(' ').toLowerCase(); return title.includes(q) || symbols.includes(q) || tags.includes(q); }); }
    return result;
  }, [analyses, activeTab, typeFilter, sentimentFilter, impactFilter, timeFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: analyses.length, bullish: analyses.filter(a => classifySentiment(a.sentiment) === 'bullish').length,
    bearish: analyses.filter(a => classifySentiment(a.sentiment) === 'bearish').length,
    highRisk: analyses.filter(a => { const imp = String(a.impactLevel || a.riskLevel || '').toUpperCase(); return imp === 'HIGH' || imp === 'EXTREME'; }).length,
    highQuality: analyses.filter(a => (a.qualityScore || a.confidenceScore || 0) >= 80).length,
  }), [analyses]);

  const tabs = [
    { id: 'all', label: s.tabAll, icon: '📋' },
    { id: 'crypto', label: s.tabCrypto, icon: '₿' },
    { id: 'forex', label: s.tabForex, icon: '💱' },
    { id: 'stocks', label: s.tabStocks, icon: '📈' },
    { id: 'commodities', label: s.tabCommodities, icon: '🥇' },
  ];

  const taHref = locale === 'ar' ? '/technical-analyses' : `/${locale}/technical-analyses`;

  return (
    <main className="min-h-screen pb-mobile-safe" dir={s.dir} style={{ background: 'var(--ink)' }}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* Hero header */}
      <section style={{ padding: '28px 0 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingInline: 'clamp(16px, 4vw, 48px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cyan3)', border: '1px solid var(--cyan2)', color: 'var(--cyan)', fontSize: '22px' }}>📊</div>
              <div><h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)', marginBottom: '2px' }}>{s.pageTitle}</h1><p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{s.reportsCount.replace('{count}', String(analyses.length))}</p></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setShowSearch(!showSearch)} style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: showSearch ? 'var(--cyan2)' : 'var(--bg3)', border: `1px solid ${showSearch ? 'var(--cyan2)' : 'var(--rim)'}`, color: showSearch ? 'var(--cyan)' : 'var(--text3)', cursor: 'pointer' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></button>
              <a href={taHref + '/feed.xml'} style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--surface-2)', color: 'var(--text3)', fontSize: '11px', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-jetbrains-mono, monospace)' }} title={s.rssFeed}>RSS</a>
              <Link href={locale === 'ar' ? '/reports' : `/${locale}/reports`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--cyan2)', textDecoration: 'none', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>{s.backToReports}</Link>
            </div>
          </div>
          {showSearch && <div style={{ marginBottom: '12px', animation: 'fadeInUp 0.3s ease' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '10px', background: 'var(--bg3)', border: '1px solid var(--cyan2)', maxWidth: '500px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={s.searchPlaceholder} autoFocus style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent', color: 'var(--text-head)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }} />{searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>✕</button>}</div></div>}
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{s.pageSubtitle}</p>
        </div>
      </section>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px) 48px' }}>
        <style>{`@media(min-width:900px){.ta-tc{grid-template-columns:5fr 2fr!important}}`}</style>
        <div className="ta-tc" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', marginBottom: '16px' }}>
              <StatCard label={s.totalAnalyses} value={stats.total} color="var(--text-head)" icon="📊" />
              <StatCard label={s.bullishCount} value={stats.bullish} color="var(--bull)" icon="▲" />
              <StatCard label={s.bearishCount} value={stats.bearish} color="var(--bear)" icon="▼" />
              <StatCard label={s.highRiskCount} value={stats.highRisk} color="var(--bear)" icon="⚠" />
              <StatCard label={s.highConfidenceCount} value={stats.highQuality} color="var(--gold)" icon="🛡" />
            </div>

            {/* Heatmap */}
            {!loading && analyses.length > 0 && <HeatmapGrid analyses={analyses} locale={locale} />}

            {/* Category Tabs */}
            {!loading && analyses.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: activeTab === tab.id ? 700 : 500, cursor: 'pointer', background: activeTab === tab.id ? 'var(--cyan2)' : 'transparent', color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text3)', border: `1px solid ${activeTab === tab.id ? 'var(--cyan2)' : 'var(--rim)'}`, transition: 'all 0.2s', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}><span>{tab.icon}</span>{tab.label}</button>)}
              </div>
            )}

            {/* Filters */}
            {!loading && analyses.length > 0 && (
              <div className="glass-card" style={{ borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
                {types.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}><span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', marginRight: '6px', textTransform: 'uppercase' }}>{s.filterByType}:</span><FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} label={s.all} count={analyses.length} colorVar="purple" />{types.map(t => <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} label={translateType(t, locale)} count={analyses.filter(a => (a.type || a.analysisType) === t).length} colorVar="purple" />)}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}><span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', marginRight: '6px', textTransform: 'uppercase' }}>{s.filterByRisk}:</span><FilterChip active={impactFilter === 'all'} onClick={() => setImpactFilter('all')} label={s.all} count={analyses.length} colorVar="bear" /><FilterChip active={impactFilter === 'high'} onClick={() => setImpactFilter('high')} label={`🔥 ${locale === 'ar' ? 'عالي' : locale === 'fr' ? 'Élevé' : locale === 'es' ? 'Alto' : locale === 'tr' ? 'Yüksek' : 'High'}`} count={stats.highRisk} colorVar="bear" /><FilterChip active={impactFilter === 'medium'} onClick={() => setImpactFilter('medium')} label={locale === 'ar' ? 'متوسط/منخفض' : locale === 'fr' ? 'Moyen/Bas' : locale === 'es' ? 'Medio/Bajo' : locale === 'tr' ? 'Orta/Düşük' : 'Med/Low'} count={analyses.length - stats.highRisk} colorVar="gold" /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}><span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', marginRight: '6px', textTransform: 'uppercase' }}>{s.filterBySentiment}:</span><FilterChip active={sentimentFilter === 'all'} onClick={() => setSentimentFilter('all')} label={s.all} count={analyses.length} colorVar="gold" /><FilterChip active={sentimentFilter === 'bullish'} onClick={() => setSentimentFilter('bullish')} label={`▲ ${s.bullishCount}`} count={stats.bullish} colorVar="bull" /><FilterChip active={sentimentFilter === 'bearish'} onClick={() => setSentimentFilter('bearish')} label={`▼ ${s.bearishCount}`} count={stats.bearish} colorVar="bear" /><FilterChip active={sentimentFilter === 'neutral'} onClick={() => setSentimentFilter('neutral')} label={`◆ ${locale === 'ar' ? 'محايد' : locale === 'fr' ? 'Neutre' : locale === 'es' ? 'Neutral' : locale === 'tr' ? 'Nötr' : 'Neutral'}`} count={analyses.length - stats.bullish - stats.bearish} colorVar="gold" /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}><span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', marginRight: '6px', textTransform: 'uppercase' }}>{s.filterByTime}:</span><FilterChip active={timeFilter === 'all'} onClick={() => setTimeFilter('all')} label={s.all} count={analyses.length} colorVar="cyan" /><FilterChip active={timeFilter === 'today'} onClick={() => setTimeFilter('today')} label={s.today} count={analyses.filter(a => Date.now() - new Date(a.publishedAt).getTime() < 86400000).length} colorVar="cyan" /><FilterChip active={timeFilter === 'thisWeek'} onClick={() => setTimeFilter('thisWeek')} label={s.thisWeek} count={analyses.filter(a => Date.now() - new Date(a.publishedAt).getTime() < 604800000).length} colorVar="cyan" /><FilterChip active={timeFilter === 'thisMonth'} onClick={() => setTimeFilter('thisMonth')} label={s.thisMonth} count={analyses.filter(a => Date.now() - new Date(a.publishedAt).getTime() < 2592000000).length} colorVar="cyan" /></div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>}

            {/* Error */}
            {error && <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '16px', border: '1px solid rgba(239,68,68,.2)' }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div><p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bear)', marginBottom: '6px' }}>{locale === 'ar' ? 'تعذّر تحميل التحليلات' : 'Failed to load'}</p><p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>{error}</p><button onClick={() => window.location.reload()} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--cyan2)', cursor: 'pointer' }}>{locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>}

            {/* Empty state with CTA */}
            {!loading && !error && analyses.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.3 }}>📊</div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text2)', marginBottom: '6px' }}>{s.noAnalyses}</p>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>{s.noAnalysesHint}</p>
                <Link href={s.noAnalysesCtaHref.startsWith('/') ? (locale === 'ar' ? s.noAnalysesCtaHref : `/${locale}${s.noAnalysesCtaHref}`) : s.noAnalysesCtaHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--cyan2)', textDecoration: 'none', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{s.noAnalysesCta}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}><polyline points="9 18 15 12 9 6" /></svg></Link>
              </div>
            )}

            {/* Grid */}
            {!loading && !error && filteredAnalyses.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>{filteredAnalyses.map(a => <TechnicalAnalysisCard key={a.id} analysis={a} locale={locale} />)}</div>
                <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{filteredAnalyses.length} / {analyses.length}</div>
              </>
            )}

            {/* No results after filtering */}
            {!loading && !error && analyses.length > 0 && filteredAnalyses.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px' }}><div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📊</div><p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text2)' }}>{s.noAnalyses}</p></div>
            )}
          </div>

          {/* Sidebar */}
          {!loading && !error && analyses.length > 0 && (
            <aside>
              <TopSidebar analyses={analyses} locale={locale} />
              {/* Alerts widget */}
              <div className="glass-card" style={{ borderRadius: '14px', padding: '14px 16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><span style={{ fontSize: '16px' }}>🔔</span><div><h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)', margin: 0 }}>{s.alertTitle}</h3><p style={{ fontSize: '9px', color: 'var(--text3)', margin: 0 }}>{s.alertSubtitle}</p></div></div>
                <button style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--cyan2)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{s.alertButton}</button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}

function TopSidebar({ analyses, locale }: { analyses: ContentAnalysis[]; locale: TALocale }) {
  const s = getTAStrings(locale);
  const top = useMemo(() => [...analyses].filter(a => (a.qualityScore || a.confidenceScore || 0) >= 70).sort((a, b) => (b.qualityScore || b.confidenceScore || 0) - (a.qualityScore || a.confidenceScore || 0)).slice(0, 5), [analyses]);
  const items = top.length > 0 ? top : [...analyses].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 5);
  if (items.length === 0) return null;
  const title = top.length > 0 ? s.topConfidence : s.latestAnalyses;
  return (
    <div className="glass-card" style={{ borderRadius: '14px', overflow: 'hidden', position: 'sticky', top: '80px' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: top.length > 0 ? 'var(--bull2)' : 'var(--cyan3)', border: `1px solid ${top.length > 0 ? 'rgba(0,153,107,.2)' : 'var(--cyan2)'}`, color: top.length > 0 ? 'var(--bull)' : 'var(--cyan)', fontSize: '14px' }}>{top.length > 0 ? '🛡' : '⏱'}</div>
        <div><h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)', margin: 0 }}>{title}</h3><p style={{ fontSize: '9px', color: 'var(--text3)', margin: 0 }}>{s.topConfidenceSubtitle}</p></div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {items.map((a, idx) => {
          const sc = classifySentiment(a.sentiment); const col = sc === 'bullish' ? 'var(--bull)' : sc === 'bearish' ? 'var(--bear)' : 'var(--gold)';
          const medals = ['#FFB800', '#C0C0C0', '#CD7F32']; const mBgs = ['rgba(255,184,0,0.1)', 'rgba(192,192,192,0.1)', 'rgba(205,127,50,0.1)'];
          return <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: top.length > 0 && idx < 3 ? mBgs[idx] : 'var(--surface-2)', color: top.length > 0 && idx < 3 ? medals[idx] : 'var(--text3)', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{idx + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>{(a.title || '').slice(0, 80)}</div><div style={{ fontSize: '9px', color: col, marginTop: '2px', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{formatTimeAgoTA(a.publishedAt, locale)}{a.qualityScore || a.confidenceScore ? ` · ${a.qualityScore || a.confidenceScore}%` : ''}{a.source ? ` · ${a.source === 'local' ? '📍' : '🔗'}` : ''}</div></div>
          </div>;
        })}
      </div>
    </div>
  );
}
