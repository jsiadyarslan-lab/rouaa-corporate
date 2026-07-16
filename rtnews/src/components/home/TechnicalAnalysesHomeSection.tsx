'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTAStrings, TALocale } from '@/lib/technical-analyses-i18n';
import TechnicalAnalysisCard, { ContentAnalysis, CardSkeleton } from '@/components/technical-analyses/TechnicalAnalysisCard';

interface Props { locale: TALocale; }

const SECTION_TEXT: Record<TALocale, { sectionTitle: string; sectionSubtitle: string; cryptoTitle: string; forexTitle: string; commoditiesTitle: string; viewAll: string; loading: string; empty: string }> = {
  ar: { sectionTitle: 'أحدث التحليلات الفنية', sectionSubtitle: 'تحليلات فنية حية للأسواق الرئيسية — العملات الرقمية، الفوركس، والسلع', cryptoTitle: 'العملات الرقمية', forexTitle: 'الفوركس', commoditiesTitle: 'السلع', viewAll: 'كل التحليلات الفنية', loading: 'جارٍ التحميل…', empty: 'لا توجد تحليلات حالياً' },
  en: { sectionTitle: 'Latest Technical Analyses', sectionSubtitle: 'Live technical analyses across major markets', cryptoTitle: 'Crypto', forexTitle: 'Forex', commoditiesTitle: 'Commodities', viewAll: 'All Technical Analyses', loading: 'Loading…', empty: 'No analyses available' },
  fr: { sectionTitle: 'Dernières Analyses Techniques', sectionSubtitle: 'Analyses techniques en direct', cryptoTitle: 'Crypto', forexTitle: 'Forex', commoditiesTitle: 'Matières premières', viewAll: 'Toutes les analyses', loading: 'Chargement…', empty: 'Aucune analyse disponible' },
  tr: { sectionTitle: 'Son Teknik Analizler', sectionSubtitle: 'Canlı teknik analizler', cryptoTitle: 'Kripto', forexTitle: 'Döviz', commoditiesTitle: 'Emtia', viewAll: 'Tüm Teknik Analizler', loading: 'Yükleniyor…', empty: 'Analiz yok' },
  es: { sectionTitle: 'Últimos Análisis Técnicos', sectionSubtitle: 'Análisis técnicos en vivo', cryptoTitle: 'Cripto', forexTitle: 'Forex', commoditiesTitle: 'Materias primas', viewAll: 'Todos los análisis', loading: 'Cargando…', empty: 'Sin análisis disponibles' },
};

function CategoryColumn({ title, icon, color, items, loading, locale, emptyText, loadingText }: { title: string; icon: string; color: string; items: ContentAnalysis[]; loading: boolean; locale: TALocale; emptyText: string; loadingText: string }) {
  return (
    <div className="glass-card" style={{ borderRadius: '14px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderInlineStart: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid var(--rim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '18px' }}>{icon}</span><h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)', margin: 0 }}>{title}</h3></div>
        <span style={{ fontSize: '10px', fontWeight: 700, color, padding: '2px 7px', borderRadius: '4px', background: `${color}18`, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{items.length}</span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '11px', color: 'var(--text3)' }}>{emptyText}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{items.map(a => <TechnicalAnalysisCard key={a.id} analysis={a} locale={locale} />)}</div>
      )}
    </div>
  );
}

export default function TechnicalAnalysesHomeSection({ locale }: Props) {
  const t = SECTION_TEXT[locale] || SECTION_TEXT.ar;
  const isRTL = locale === 'ar';
  const [cryptoItems, setCryptoItems] = useState<ContentAnalysis[]>([]);
  const [forexItems, setForexItems] = useState<ContentAnalysis[]>([]);
  const [commoditiesItems, setCommoditiesItems] = useState<ContentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // Dual-source: external + local
        const fetchCategory = async (cat: string) => {
          let articles: ContentAnalysis[] = [];
          try { const r = await fetch(`/api/trading-platform/analysis?limit=3&category=${cat}&locale=${locale}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) }); if (r.ok) { const d = await r.json(); if (d.articles) articles = d.articles.map((a: any) => ({ ...a, source: 'external' })); } } catch {}
          return articles;
        };
        const [crypto, forex, commodities] = await Promise.allSettled([fetchCategory('CRYPTO'), fetchCategory('FOREX'), fetchCategory('COMMODITIES')]);
        if (crypto.status === 'fulfilled') setCryptoItems(crypto.value);
        if (forex.status === 'fulfilled') setForexItems(forex.value);
        if (commodities.status === 'fulfilled') setCommoditiesItems(commodities.value);
      } catch {} finally { setLoading(false); }
    };
    fetchAll();
  }, [locale]);

  const allEmpty = !loading && cryptoItems.length === 0 && forexItems.length === 0 && commoditiesItems.length === 0;
  if (allEmpty) return null;
  const href = locale === 'ar' ? '/technical-analyses' : `/${locale}/technical-analyses`;

  return (
    <section className="max-w-[1400px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)', marginBottom: 'var(--space-md)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cyan3)', border: '1px solid var(--cyan2)', color: 'var(--cyan)', fontSize: '16px' }}>📊</div>
          <div><h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-head)', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)', margin: 0, lineHeight: 1.3 }}>{t.sectionTitle}</h2><p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', margin: 0 }}>{t.sectionSubtitle}</p></div>
        </div>
        <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--cyan2)', fontSize: '11px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>{t.viewAll}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}><polyline points="9 18 15 12 9 6" /></svg></Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        <CategoryColumn title={t.cryptoTitle} icon="₿" color="#A78BFA" items={cryptoItems} loading={loading} locale={locale} emptyText={t.empty} loadingText={t.loading} />
        <CategoryColumn title={t.foreexTitle || t.forexTitle} icon="💱" color="#3BA7F0" items={forexItems} loading={loading} locale={locale} emptyText={t.empty} loadingText={t.loading} />
        <CategoryColumn title={t.commoditiesTitle} icon="🥇" color="#F0A500" items={commoditiesItems} loading={loading} locale={locale} emptyText={t.empty} loadingText={t.loading} />
      </div>
    </section>
  );
}
