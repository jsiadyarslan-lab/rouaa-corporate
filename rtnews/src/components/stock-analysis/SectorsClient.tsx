'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalePath, translateSectorToLocale } from '@/lib/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';

interface SectorsClientProps {
  locale: string;
}

const LABELS: Record<string, Record<string, string>> = {
  title: { en: 'Sector Analysis', ar: 'تحليل القطاعات', fr: 'Analyse Sectorielle', tr: 'Sektör Analizi', es: 'Análisis Sectorial' },
  subtitle: { en: 'Explore market sectors with aggregated performance data', ar: 'استكشف قطاعات السوق مع بيانات الأداء المجمعة', fr: 'Explorez les secteurs du marché avec des données de performance agrégées', tr: 'Birleştirilmiş performans verileriyle piyasa sektörlerini keşfedin', es: 'Explora los sectores del mercado con datos de rendimiento agregados' },
  stockCount: { en: 'Stocks', ar: 'الأسهم', fr: 'Actions', tr: 'Hisseler', es: 'Acciones' },
  avgChange: { en: 'Avg Change', ar: 'متوسط التغير', fr: 'Var. Moy.', tr: 'Ort. Değişim', es: 'Cambio Prom.' },
  totalMarketCap: { en: 'Total Mkt Cap', ar: 'إجمالي القيمة', fr: 'Cap. Totale', tr: 'Toplam Piy. Değ.', es: 'Cap. de Mercado Total' },
  noData: { en: 'No sector data available yet. Run the pipeline to generate analyses.', ar: 'لا توجد بيانات قطاعات بعد. قم بتشغيل خط الأنابيب لإنشاء التحليلات.', fr: 'Aucune donnée sectorielle disponible. Lancez le pipeline pour générer des analyses.', tr: 'Henüz sektör verisi mevcut değil. Analizleri oluşturmak için işlem hattını çalıştırın.', es: 'No hay datos sectoriales disponibles aún. Ejecute el pipeline para generar análisis.' },
  backToAnalysis: { en: '← Back to Stock Analysis', ar: '→ العودة لتحليل الأسهم', fr: '← Retour à l\'analyse', tr: '← Hisse Analizine Dön', es: '← Volver al Análisis de Acciones' },
  viewDetails: { en: 'View Details', ar: 'عرض التفاصيل', fr: 'Voir détails', tr: 'Detayları Gör', es: 'Ver Detalles' },
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

interface SectorData {
  sector: string;
  stockCount: number;
  avgChange: number;
  avgConfidence: number;
  totalMarketCap: number;
}

export default function SectorsClient({ locale }: SectorsClientProps) {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = locale === 'ar';

  useEffect(() => {
    async function fetchSectors() {
      try {
        const res = await fetch(`/api/stock-analysis/sectors?locale=${locale}`);
        const data = await res.json();
        if (data.status === 'ok') {
          const translated = (data.sectors || []).map((s: any) => ({
            ...s,
            sector: translateSectorToLocale(s.sector, locale as any),
          }));
          setSectors(translated);
        }
      } catch (err) {
        console.error('Sectors fetch error:', err);
      }
      setLoading(false);
    }
    fetchSectors();
  }, [locale]);

  const getSectorIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('tech')) return '💻';
    if (n.includes('health') || n.includes('pharma')) return '🏥';
    if (n.includes('financ')) return '🏦';
    if (n.includes('energy') || n.includes('oil')) return '⚡';
    if (n.includes('consumer') && n.includes('cyclical')) return '🛍️';
    if (n.includes('consumer') && n.includes('defensive')) return '🛒';
    if (n.includes('industrial') || n.includes('industri')) return '🏭';
    if (n.includes('basic') || n.includes('material') || n.includes('mining')) return '⛏️';
    if (n.includes('utilit')) return '💡';
    if (n.includes('commun') || n.includes('media')) return '📡';
    if (n.includes('real') || n.includes('estate')) return '🏠';
    if (n.includes('etf')) return '📊';
    return '📈';
  };

  return (
    <div className={`min-h-screen ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`${getLocalePath(locale as any)}/stock-analysis`}
            className="text-xs text-gray-400 hover:text-white transition-colors mb-2 inline-block"
          >
            {t('backToAnalysis', locale)}
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('title', locale)}</h1>
              <p className="text-xs text-gray-400">{t('subtitle', locale)}</p>
            </div>
          </div>
        </div>

        {/* Sector Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : sectors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.map((sector) => {
              const isPositive = sector.avgChange >= 0;
              return (
                <Link
                  key={sector.sector}
                  href={`${getLocalePath(locale as any)}/stock-analysis/sectors/${encodeURIComponent(sector.sector)}`}
                  className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{getSectorIcon(sector.sector)}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {sector.sector}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          {sector.stockCount} {t('stockCount', locale)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors ${isRtl ? 'rotate-180' : ''}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">{t('avgChange', locale)}</p>
                      <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isPositive ? '+' : ''}{sector.avgChange.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">{t('totalMarketCap', locale)}</p>
                      <p className="text-sm font-semibold text-gray-300">{formatMarketCap(sector.totalMarketCap)}</p>
                    </div>
                  </div>

                  {/* Performance bar */}
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(5, 50 + sector.avgChange * 2))}%`,
                          backgroundColor: isPositive ? '#10b981' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm">{t('noData', locale)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
