// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalePath, translateSectorToLocale } from '@/lib/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Layers,
  BarChart3,
  Users,
} from 'lucide-react';

interface SectorDetailClientProps {
  locale: string;
  sector: string;
}

const LABELS: Record<string, Record<string, string>> = {
  backToSectors: { en: '← Back to Sectors', ar: '→ العودة للقطاعات', fr: '← Retour aux secteurs', tr: '← Sektörlere Dön', es: '← Volver a Sectores' },
  stocksInSector: { en: 'Stocks in', ar: 'الأسهم في قطاع', fr: 'Actions dans', tr: 'Sektördeki Hiseler', es: 'Acciones en' },
  stockCount: { en: 'stocks', ar: 'سهم', fr: 'actions', tr: 'hisse', es: 'acciones' },
  avgChange: { en: 'Avg Change', ar: 'متوسط التغير', fr: 'Var. Moy.', tr: 'Ort. Değişim', es: 'Cambio Prom.' },
  signalDist: { en: 'Signal Distribution', ar: 'توزيع الإشارات', fr: 'Distribution des signaux', tr: 'Sinyal Dağılımı', es: 'Distribución de Señales' },
  bullish: { en: 'Bullish', ar: 'صاعد', fr: 'Haussier', tr: 'Yükseliş', es: 'Alcista' },
  bearish: { en: 'Bearish', ar: 'هابط', fr: 'Baissier', tr: 'Düşüş', es: 'Bajista' },
  neutral: { en: 'Neutral', ar: 'عرضي', fr: 'Neutre', tr: 'Nötr', es: 'Neutral' },
  price: { en: 'Price', ar: 'السعر', fr: 'Prix', tr: 'Fiyat', es: 'Precio' },
  change: { en: 'Change %', ar: 'التغير %', fr: 'Variation %', tr: 'Değişim %', es: 'Cambio %' },
  signal: { en: 'Signal', ar: 'الإشارة', fr: 'Signal', tr: 'Sinyal', es: 'Señal' },
  confidence: { en: 'Confidence', ar: 'الثقة', fr: 'Confiance', tr: 'Güven', es: 'Confianza' },
  marketCap: { en: 'Mkt Cap', ar: 'القيمة', fr: 'Cap. Bours.', tr: 'Piyasa Değeri', es: 'Cap. Mercado' },
  pe: { en: 'P/E', ar: 'السعر/الربح', fr: 'P/E', tr: 'F/K', es: 'P/E' },
  noStocks: { en: 'No stocks found in this sector.', ar: 'لا توجد أسهم في هذا القطاع.', fr: 'Aucune action trouvée dans ce secteur.', tr: 'Bu sektörde hisse bulunamadı.', es: 'No se encontraron acciones en este sector.' },
};

function t(key: string, locale: string): string {
  return LABELS[key]?.[locale] || LABELS[key]?.en || key;
}

function formatMarketCap(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

interface StockData {
  id: string;
  symbol: string;
  title?: string;
  price: number;
  change: number;
  changePercent: number;
  overallSignal: string;
  overallScore: number;
  confidenceScore: number;
  riskLevel: string;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  company?: { name?: string; nameAr?: string; nameFr?: string; logoUrl?: string; country?: string };
}

interface SectorDetail {
  sector: string;
  stockCount: number;
  avgChange: number;
  signalDistribution: Record<string, number>;
  totalMarketCap: number;
  analyses: StockData[];
}

export default function SectorDetailClient({ locale, sector }: SectorDetailClientProps) {
  const [data, setData] = useState<SectorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const isRtl = locale === 'ar';

  useEffect(() => {
    async function fetchSectorDetail() {
      try {
        const res = await fetch(`/api/stock-analysis/sectors?locale=${locale}&sector=${encodeURIComponent(sector)}`);
        const result = await res.json();
        if (result.status === 'ok') {
          setData(result);
        }
      } catch (err) {
        console.error('Sector detail fetch error:', err);
      }
      setLoading(false);
    }
    fetchSectorDetail();
  }, [locale, sector]);

  const getCompanyName = (item: StockData) => {
    if (locale === 'ar' && item.company?.nameAr) return item.company.nameAr;
    if (locale === 'fr' && item.company?.nameFr) return item.company.nameFr;
    return item.company?.name || item.title || item.symbol;
  };

  const getSignalColor = (signal: string) => {
    if (signal === 'bullish') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (signal === 'bearish') return 'bg-red-500/10 border-red-500/30 text-red-400';
    return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  };

  const getSignalIcon = (signal: string) => {
    if (signal === 'bullish') return <TrendingUp className="w-3 h-3" />;
    if (signal === 'bearish') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const totalSignals = data?.signalDistribution
    ? Object.values(data.signalDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className={`min-h-screen ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href={`${getLocalePath(locale)}/stock-analysis/sectors`}
          className="text-xs text-gray-400 hover:text-white transition-colors mb-2 inline-flex items-center gap-1"
        >
          {isRtl ? <ArrowLeft className="w-3 h-3 rotate-180" /> : <ArrowLeft className="w-3 h-3" />}
          {t('backToSectors', locale)}
        </Link>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 bg-white/5 rounded-xl" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 bg-white/5 rounded-lg" />
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            {/* Sector header */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {t('stocksInSector', locale)} {translateSectorToLocale(sector, locale)}
                  </h1>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {data.stockCount} {t('stockCount', locale)}
                    </span>
                    <span className={`text-xs font-medium flex items-center gap-1 ${data.avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {data.avgChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {t('avgChange', locale)}: {data.avgChange >= 0 ? '+' : ''}{data.avgChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Signal distribution */}
              {totalSignals > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{t('signalDist', locale)}</p>
                  <div className="flex items-center gap-3">
                    {(['bullish', 'bearish', 'neutral'] as const).map((signal) => {
                      const count = data.signalDistribution[signal] || 0;
                      const pct = totalSignals > 0 ? (count / totalSignals) * 100 : 0;
                      const colors = {
                        bullish: 'bg-emerald-500 text-emerald-400',
                        bearish: 'bg-red-500 text-red-400',
                        neutral: 'bg-amber-500 text-amber-400',
                      };
                      return (
                        <div key={signal} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: signal === 'bullish' ? '#10b981' : signal === 'bearish' ? '#ef4444' : '#f59e0b' }} />
                          <span className="text-[11px] text-gray-400">{count} {t(signal, locale)}</span>
                          <span className="text-[9px] text-gray-600">({pct.toFixed(0)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Stocks table */}
            {data.analyses && data.analyses.length > 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[80px_1fr_90px_90px_100px_80px_100px_80px] gap-2 px-4 py-2 border-b border-white/10 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Symbol</span>
                  <span>Name</span>
                  <span>{t('price', locale)}</span>
                  <span>{t('change', locale)}</span>
                  <span>{t('signal', locale)}</span>
                  <span>{t('confidence', locale)}</span>
                  <span>{t('marketCap', locale)}</span>
                  <span>{t('pe', locale)}</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {data.analyses.map((item) => {
                    const isPositive = (item.changePercent || 0) >= 0;
                    return (
                      <Link
                        key={item.id}
                        href={`${getLocalePath(locale)}/stock-analysis/${item.symbol}`}
                        className="grid grid-cols-[80px_1fr_90px_90px_100px_80px_100px_80px] gap-2 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors items-center"
                      >
                        <span className="text-xs font-bold text-white truncate">{item.symbol}</span>
                        <span className="text-[11px] text-gray-400 truncate">{getCompanyName(item)}</span>
                        <span className="text-xs font-semibold text-white">${item.price?.toFixed(2)}</span>
                        <span className={`text-xs font-medium flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                        </span>
                        <Badge className={`text-[9px] border px-1.5 py-0 ${getSignalColor(item.overallSignal)}`}>
                          {getSignalIcon(item.overallSignal)}
                          <span className="ml-0.5">{t(item.overallSignal, locale)}</span>
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.confidenceScore || 0}%`,
                                backgroundColor: (item.confidenceScore || 0) >= 70 ? '#10b981' : (item.confidenceScore || 0) >= 40 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-500">{item.confidenceScore || 0}%</span>
                        </div>
                        <span className="text-[11px] text-gray-400">{formatMarketCap(item.marketCap)}</span>
                        <span className="text-[11px] text-gray-400">{item.peRatio ? item.peRatio.toFixed(1) : '—'}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">{t('noStocks', locale)}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm">{t('noStocks', locale)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
