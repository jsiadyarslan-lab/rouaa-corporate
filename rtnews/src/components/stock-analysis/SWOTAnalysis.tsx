'use client';

// ─── SWOT Analysis Component ──────────────────────────────────
// Generates and displays a SWOT analysis (Strengths, Weaknesses,
// Opportunities, Threats) based on AI-generated content.
// Features a 2×2 grid with color-coded borders, loading skeletons,
// and trilingual labels (en/ar/fr) with RTL support.
// Supports session caching via initialSwot/initialGeneratedAt props.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, RotateCw } from 'lucide-react';
// V1042: Rouaa Assistant integration
import { askAssistant } from '@/lib/assistant/global-bridge';

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    swotAnalysis: 'SWOT Analysis',
    strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    opportunities: 'Opportunities',
    threats: 'Threats',
    generate: 'Generate Analysis',
    regenerating: 'Regenerating',
    loading: 'Generating SWOT analysis...',
    noData: 'Click to generate SWOT analysis',
    askRouaa: '🤖 Ask Rouaa Assistant for SWOT',
    generatedAt: 'Generated',
    error: 'Failed to generate analysis',
    forCompany: 'for',
    lastAnalyzed: 'Last analyzed',
    minutesAgo: 'min ago',
    reAnalyze: 'Re-analyze',
  },
  ar: {
    swotAnalysis: 'تحليل SWOT',
    strengths: 'نقاط القوة',
    weaknesses: 'نقاط الضعف',
    opportunities: 'الفرص',
    threats: 'التهديدات',
    generate: 'إنشاء التحليل',
    regenerating: 'إعادة الإنشاء',
    loading: 'جاري إنشاء تحليل SWOT...',
    noData: 'انقر لإنشاء تحليل SWOT',
    askRouaa: '🤖 اسأل مساعد رؤى عن تحليل SWOT',
    generatedAt: 'تم الإنشاء',
    error: 'فشل إنشاء التحليل',
    forCompany: 'لـ',
    lastAnalyzed: 'آخر تحليل',
    minutesAgo: 'دقيقة مضت',
    reAnalyze: 'إعادة التحليل',
  },
  fr: {
    swotAnalysis: 'Analyse SWOT',
    strengths: 'Forces',
    weaknesses: 'Faiblesses',
    opportunities: 'Opportunités',
    threats: 'Menaces',
    generate: 'Générer',
    regenerating: 'Régénérer',
    loading: "Génération de l'analyse SWOT...",
    noData: "Cliquez pour générer l'analyse SWOT",
    askRouaa: '🤖 Demander à Assistant Rouaa une analyse SWOT',
    generatedAt: 'Généré le',
    error: "Échec de la génération de l'analyse",
    forCompany: 'pour',
    lastAnalyzed: 'Dernière analyse',
    minutesAgo: 'min',
    reAnalyze: 'Réanalyser',
  },
  tr: {
    swotAnalysis: 'SWOT Analizi',
    strengths: 'Güçlü Yönler',
    weaknesses: 'Zayıf Yönler',
    opportunities: 'Fırsatlar',
    threats: 'Tehditler',
    generate: 'Analiz Oluştur',
    regenerating: 'Yeniden oluşturuluyor...',
    loading: 'SWOT analizi oluşturuluyor...',
    noData: 'SWOT analizi oluşturmak için tıklayın',
    askRouaa: '🤖 Rouaa Asistanına SWOT analizi sor',
    generatedAt: 'Oluşturulma',
    error: 'Analiz oluşturulamadı',
    forCompany: 'için',
    lastAnalyzed: 'Son analiz',
    minutesAgo: 'dk önce',
    reAnalyze: 'Yeniden Analiz Et',
  },
  es: {
    swotAnalysis: 'Análisis DAFO',
    strengths: 'Fortalezas',
    weaknesses: 'Debilidades',
    opportunities: 'Oportunidades',
    threats: 'Amenazas',
    generate: 'Generar Análisis',
    regenerating: 'Regenerando',
    loading: 'Generando análisis DAFO...',
    noData: 'Clic para generar análisis DAFO',
    askRouaa: '🤖 Pedir análisis DAFO al Asistente Rouaa',
    generatedAt: 'Generado',
    error: 'Error al generar el análisis',
    forCompany: 'para',
    lastAnalyzed: 'Último análisis',
    minutesAgo: 'min atrás',
    reAnalyze: 'Re-analizar',
  },
};

// ── Types ──
interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface Props {
  symbol: string;
  locale: string;
  companyName?: string;
  sector?: string;
  initialSwot?: SwotData | null;
  initialGeneratedAt?: string | null;
  onSwotGenerated?: (data: { swot: SwotData; generatedAt: string }) => void;
}

// ── SWOT Section Configuration ──
const SECTIONS = [
  {
    key: 'strengths' as const,
    color: 'emerald',
    iconPath:
      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  },
  {
    key: 'weaknesses' as const,
    color: 'red',
    iconPath:
      'M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'opportunities' as const,
    color: 'blue',
    iconPath:
      'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    key: 'threats' as const,
    color: 'orange',
    iconPath:
      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
] as const;

// Color mapping helper
function getColorClasses(color: string) {
  switch (color) {
    case 'emerald':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/5',
        border: 'border-emerald-500/20',
        headerBg: 'bg-emerald-500/10',
        bullet: 'text-emerald-400',
      };
    case 'red':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500/5',
        border: 'border-red-500/20',
        headerBg: 'bg-red-500/10',
        bullet: 'text-red-400',
      };
    case 'blue':
      return {
        text: 'text-blue-400',
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
        headerBg: 'bg-blue-500/10',
        bullet: 'text-blue-400',
      };
    case 'orange':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-500/5',
        border: 'border-orange-500/20',
        headerBg: 'bg-orange-500/10',
        bullet: 'text-orange-400',
      };
    default:
      return {
        text: 'text-gray-400',
        bg: 'bg-white/5',
        border: 'border-white/10',
        headerBg: 'bg-white/10',
        bullet: 'text-gray-400',
      };
  }
}

function getStrokeColor(color: string): string {
  switch (color) {
    case 'emerald': return '#10b981';
    case 'red': return '#ef4444';
    case 'blue': return '#3b82f6';
    case 'orange': return '#f97316';
    default: return '#6b7280';
  }
}

// ── Loading Skeleton for a single card ──
function CardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

// ── Main Component ──
export default function SWOTAnalysis({ symbol, locale, companyName, sector, initialSwot, initialGeneratedAt, onSwotGenerated }: Props) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  const [swot, setSwot] = useState<SwotData | null>(initialSwot || null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt || null);
  const [error, setError] = useState<string | null>(null);
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);
  const autoFetchedRef = useRef(false);

  // Calculate minutes since last analysis
  useEffect(() => {
    if (!generatedAt) { setMinutesAgo(null); return; }
    const calc = () => {
      const diff = Date.now() - new Date(generatedAt).getTime();
      setMinutesAgo(Math.floor(diff / 60000));
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [generatedAt]);

  const generateSwot = useCallback(async (force = false) => {
    // If we have cached data and not forcing, skip API call
    if (!force && swot && generatedAt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stock-analysis/${encodeURIComponent(symbol)}/swot?locale=${locale}`,
        { method: 'POST' }
      );
      if (res.ok) {
        const data = await res.json();
        setSwot(data.swot);
        setGeneratedAt(data.generatedAt);
        setMinutesAgo(0);
        // Notify parent of new data for caching
        if (onSwotGenerated) {
          onSwotGenerated({ swot: data.swot, generatedAt: data.generatedAt });
        }
      } else {
        setError(t.error);
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [symbol, locale, t.error, swot, generatedAt, onSwotGenerated]);

  // Auto-generate on mount (only if no initial data)
  useEffect(() => {
    if (!autoFetchedRef.current && !initialSwot && !loading) {
      autoFetchedRef.current = true;
      generateSwot();
    }
  }, [symbol, locale, initialSwot, generateSwot, loading]);

  return (
    <div dir={dir} className="bg-white/5 border border-white/10 rounded-xl">
      {/* Header - matching page style: icon + title with border-bottom */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-white">{t.swotAnalysis}</h2>
            {(companyName || sector) && (
              <span className="text-[10px] text-gray-500">
                {t.forCompany} {companyName || symbol}
                {sector ? ` · ${sector}` : ''}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => generateSwot(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? t.regenerating : t.reAnalyze}
        </button>
      </div>

      <div className="p-5">
        {/* Cached timestamp with "X minutes ago" */}
        {(generatedAt || minutesAgo !== null) && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-gray-500">
              {t.lastAnalyzed}: {minutesAgo !== null ? `${minutesAgo} ${t.minutesAgo}` : (generatedAt ? new Date(generatedAt).toLocaleString() : '')}
            </span>
            {generatedAt && (
              <span className="text-[10px] text-gray-600">
                {t.generatedAt}: {new Date(generatedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading Skeleton: 2×2 grid of skeleton cards */}
        {loading && !swot && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* SWOT Grid: 2×2 */}
        {swot && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTIONS.map((section) => {
              const items = swot[section.key] || [];
              const label = t[section.key];
              const colors = getColorClasses(section.color);
              const strokeColor = getStrokeColor(section.color);

              return (
                <div
                  key={section.key}
                  className={`p-4 rounded-lg ${colors.bg} border ${colors.border} transition-colors hover:border-opacity-50`}
                >
                  {/* Card header */}
                  <div className={`flex items-center gap-2 mb-3 px-2 py-1 rounded-md ${colors.headerBg}`}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={section.iconPath} />
                    </svg>
                    <span className={`text-xs font-bold ${colors.text}`}>
                      {label}
                    </span>
                  </div>

                  {/* Bullet points */}
                  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {items.slice(0, 5).map((point: string, i: number) => (
                      <div
                        key={i}
                        className="text-xs text-gray-300 leading-relaxed px-2 py-1.5 rounded-md bg-black/20"
                      >
                        <span className={`font-bold ${colors.bullet}`}>
                          •
                        </span>{' '}
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state: no data and not loading */}
        {!loading && !swot && !error && (
          <div className="text-center py-8 flex flex-col items-center gap-3">
            <button
              onClick={() => generateSwot()}
              className="px-6 py-2.5 rounded-lg border border-white/10 bg-cyan-500/10 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition-colors"
            >
              {t.noData}
            </button>
            {/* V1042: Alternative — ask Rouaa Assistant for SWOT analysis */}
            <button
              onClick={() => {
                const prompt = locale === 'ar' ? `حلل سهم ${symbol} باستخدام تحليل SWOT (نقاط القوة، نقاط الضعف، الفرص، التهديدات)${companyName ? ` لشركة ${companyName}` : ''}` :
                  locale === 'fr' ? `Analyse l'action ${symbol} avec une analyse SWOT (Forces, Faiblesses, Opportunités, Menaces)${companyName ? ` pour ${companyName}` : ''}` :
                  locale === 'tr' ? `${symbol} hissesini SWOT analizi ile analiz et (Güçlü yönler, Zayıf yönler, Fırsatlar, Tehditler)${companyName ? ` - ${companyName}` : ''}` :
                  locale === 'es' ? `Analiza la acción ${symbol} con un análisis SWOT (Fortalezas, Debilidades, Oportunidades, Amenazas)${companyName ? ` para ${companyName}` : ''}` :
                  `Analyze ${symbol} stock with a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)${companyName ? ` for ${companyName}` : ''}`;
                askAssistant(prompt, { reportType: 'stock-analysis', deepSearch: true });
              }}
              className="px-6 py-2.5 rounded-lg border border-cyan-400/40 text-sm font-bold transition-colors"
              style={{
                background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))',
                color: 'var(--cyan, #00E5FF)',
                boxShadow: '0 0 12px rgba(0,229,255,0.15)',
              }}
            >
              {t.askRouaa}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
