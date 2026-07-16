// ─── Sentiment Badge Component ───────────────────────────────────
// Shows the sentiment (Bullish / Bearish / Neutral)
// Color-coded for quick visual scanning

import { Badge } from '@/components/ui/badge';

interface SentimentBadgeProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score?: number; // AI confidence score (0-100)
  className?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function SentimentBadge({ sentiment, score, className, locale = 'ar' }: SentimentBadgeProps) {
  const variants = {
    bullish: {
      label: locale === 'tr' ? 'Olumlu' : locale === 'fr' ? 'Haussier' : locale === 'en' ? 'Bullish' : 'إيجابي',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      icon: '📈',
    },
    bearish: {
      label: locale === 'tr' ? 'Olumsuz' : locale === 'fr' ? 'Baissier' : locale === 'en' ? 'Bearish' : 'سلبي',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      icon: '📉',
    },
    neutral: {
      label: locale === 'tr' ? 'Nötr' : locale === 'fr' ? 'Neutre' : locale === 'en' ? 'Neutral' : 'محايد',
      bgColor: 'bg-gray-500/10',
      textColor: 'text-gray-300',
      borderColor: 'border-gray-500/30',
      icon: '⚖️',
    },
  };

  const variant = variants[sentiment];

  return (
    <Badge
      className={`${variant.bgColor} ${variant.textColor} ${variant.borderColor} border px-3 py-1 text-xs font-semibold flex items-center gap-1 ${className}`}
    >
      <span>{variant.icon}</span>
      <span>{variant.label}</span>
      {score !== undefined && (
        <span className="opacity-60">({score}%)</span>
      )}
    </Badge>
  );
}
