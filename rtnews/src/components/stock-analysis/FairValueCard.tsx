'use client';
import { useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FairValueCardProps {
  currentPrice: number;
  dcf: number;
  priceTarget: { avg: number; high: number; low: number; median: number } | null;
  locale: string;
}

export default function FairValueCard({ currentPrice, dcf, priceTarget, locale }: FairValueCardProps) {
  const labels = {
    fairValue: locale === 'ar' ? 'القيمة العادلة' : locale === 'tr' ? 'Adil Değer' : locale === 'fr' ? 'Valeur Juste' : 'Fair Value',
    analystTarget: locale === 'ar' ? 'هدف المحللين' : locale === 'tr' ? 'Analist Hedefi' : locale === 'fr' ? 'Objectif Analystes' : 'Analyst Target',
    low: locale === 'ar' ? 'أدنى' : locale === 'tr' ? 'Düşük' : locale === 'fr' ? 'Min' : 'Low',
    median: locale === 'ar' ? 'الوسيط' : locale === 'tr' ? 'Medyan' : locale === 'fr' ? 'Médiane' : 'Median',
    high: locale === 'ar' ? 'أعلى' : locale === 'tr' ? 'Yüksek' : locale === 'fr' ? 'Max' : 'High',
    upside: locale === 'ar' ? 'الصعود المحتمل' : locale === 'tr' ? 'Yukarı Potansiyel' : locale === 'fr' ? 'Potentiel Haussier' : 'Upside',
    overvalued: locale === 'ar' ? 'مُبالَغ في التقييم' : locale === 'tr' ? 'Yüksek Değerlenmiş' : locale === 'fr' ? 'Surévalué' : 'Overvalued',
    undervalued: locale === 'ar' ? 'أقل من القيمة' : locale === 'tr' ? 'Düşük Değerlenmiş' : locale === 'fr' ? 'Sous-évalué' : 'Undervalued',
    fair: locale === 'ar' ? 'عادل' : locale === 'tr' ? 'Adil' : locale === 'fr' ? 'Juste' : 'Fair',
    vsCurrent: locale === 'ar' ? 'مقابل الحالي' : locale === 'tr' ? 'Mevcut ile Karşılaştır' : locale === 'fr' ? 'vs Actuel' : 'vs Current',
  };

  const analysis = useMemo(() => {
    const fairValue = dcf > 0 ? dcf : priceTarget?.median || 0;
    if (fairValue <= 0) return { status: 'fair' as const, percent: 0, fairValue: 0 };
    
    const percent = ((fairValue - currentPrice) / currentPrice) * 100;
    const status = percent > 10 ? 'undervalued' as const : percent < -10 ? 'overvalued' as const : 'fair' as const;
    return { status, percent, fairValue };
  }, [currentPrice, dcf, priceTarget]);

  if (analysis.fairValue <= 0) return null;

  const statusColors = {
    undervalued: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', fill: '#10b981' },
    overvalued: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', fill: '#ef4444' },
    fair: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', fill: '#f59e0b' },
  };
  const colors = statusColors[analysis.status];

  // Gauge calculation
  const gaugePercent = priceTarget 
    ? Math.min(100, Math.max(0, ((currentPrice - priceTarget.low) / (priceTarget.high - priceTarget.low)) * 100))
    : 50;

  return (
    <div className={`rounded-xl p-5 border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center gap-2 mb-4">
        <Target className={`w-5 h-5 ${colors.text}`} />
        <h3 className="text-lg font-semibold text-white">{labels.fairValue}</h3>
      </div>

      {/* DCF Value */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">{labels.fairValue} (DCF)</p>
          <p className="text-2xl font-bold text-white">${analysis.fairValue.toFixed(2)}</p>
        </div>
        <div className="text-end">
          <p className="text-xs text-gray-400 mb-1">{labels.vsCurrent}</p>
          <p className={`text-2xl font-bold ${colors.text}`}>
            {analysis.percent >= 0 ? '+' : ''}{analysis.percent.toFixed(1)}%
          </p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
            {labels[analysis.status]}
          </span>
        </div>
      </div>

      {/* Price Target Range Gauge */}
      {priceTarget && priceTarget.high > priceTarget.low && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">{labels.analystTarget}</p>
          <div className="relative h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
            {/* Range fill */}
            <div className="absolute inset-y-0 rounded-lg opacity-20" style={{
              left: '0%',
              right: '0%',
              backgroundColor: colors.fill,
            }} />
            {/* Current price marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
              style={{ left: `${gaugePercent}%` }}
            />
            <div
              className="absolute -top-5 text-[10px] font-bold text-white whitespace-nowrap z-10"
              style={{ left: `${gaugePercent}%`, transform: 'translateX(-50%)' }}
            >
              ${currentPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-500">
            <span>{labels.low}: ${priceTarget.low.toFixed(2)}</span>
            <span>{labels.median}: ${priceTarget.median.toFixed(2)}</span>
            <span>{labels.high}: ${priceTarget.high.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
