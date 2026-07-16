// ─── Animated Sentiment Gauge ──────────────────────────────────
// SVG arc gauge with gradient color and confidence percentage
'use client';

interface SentimentGaugeProps {
  sentiment: string;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function AnimatedSentimentGauge({ sentiment, confidence, size = 'md', locale = 'ar' }: SentimentGaugeProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const angle = sentiment === 'positive' ? Math.min(confidence * 0.9, 90) :
    sentiment === 'negative' ? Math.max(-confidence * 0.9, -90) : 0;

  const color = sentiment === 'positive' ? 'var(--bull)' :
    sentiment === 'negative' ? 'var(--bear)' : 'var(--neutral)';

  const label = sentiment === 'positive' ? t('إيجابي', 'Bullish', 'Haussier', 'Yükseliş', 'Alcista') :
    sentiment === 'negative' ? t('سلبي', 'Bearish', 'Baissier', 'Düşüş', 'Bajista') : t('محايد', 'Neutral', 'Neutre', 'Nötr', 'Neutral');

  const icon = sentiment === 'positive' ? '▲' :
    sentiment === 'negative' ? '▼' : '●';

  const sizeMap = { sm: 48, md: 64, lg: 80 };
  const px = sizeMap[size];

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
      {/* Gauge */}
      <div className="relative flex-shrink-0" style={{ width: px, height: px }}>
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          {/* Background arc */}
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="5" strokeDasharray="122.5 40.8" />
          {/* Active arc */}
          <circle
            cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${Math.abs(angle) * 1.36} 163.3`}
            strokeLinecap="round" opacity="0.85"
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold" style={{ color, fontSize: size === 'sm' ? '14px' : size === 'lg' ? '22px' : '18px' }}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="font-bold" style={{ color, fontSize: size === 'sm' ? '13px' : '16px' }}>{label}</div>
        <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
          {t('مستوى الثقة:', 'Confidence Level:', 'Niveau de confiance :', 'Güven Seviyesi:', 'Nivel de confianza:')} <span className="font-mono-price font-bold" style={{ color: 'var(--text2)' }}>{confidence}%</span>
        </div>
        {/* Confidence bar */}
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)', width: '120px' }}>
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${confidence}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
