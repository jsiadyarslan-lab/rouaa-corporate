// ─── Volatility Indicator ──────────────────────────────────────
// Visual bar showing expected volatility level
'use client';

interface VolatilityIndicatorProps {
  impactLevel: string;
  sentimentScore?: number;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function VolatilityIndicator({ impactLevel, sentimentScore, locale = 'ar' }: VolatilityIndicatorProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const level = impactLevel === 'high' ? 3 : impactLevel === 'medium' ? 2 : 1;
  const labels = [t('منخفض', 'Low', 'Faible', 'Düşük', 'Bajo'), t('متوسط', 'Medium', 'Moyen', 'Orta', 'Medio'), t('عالي', 'High', 'Élevé', 'Yüksek', 'Alto')];
  const colors = ['var(--bull)', 'var(--gold)', 'var(--bear)'];
  const score = sentimentScore || 50;

  // Calculate volatility based on impact and sentiment deviation from neutral
  const deviation = Math.abs(score - 50);
  const volatility = Math.min(100, Math.round((level * 25) + (deviation * 0.5)));

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span className="text-[12px] font-bold" style={{ color: 'var(--gold)' }}>{t('مؤشر التقلب', 'Volatility Indicator', 'Indicateur de volatilité', 'Volatilite Göstergesi', 'Indicador de volatilidad')}</span>
        </div>
        <span className="text-[11px] font-bold" style={{ color: colors[level - 1] }}>
          {labels[level - 1]} ({volatility}%)
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${volatility}%`,
            background: `linear-gradient(90deg, var(--bull), var(--gold), var(--bear))`,
          }}
        />
      </div>
    </div>
  );
}
