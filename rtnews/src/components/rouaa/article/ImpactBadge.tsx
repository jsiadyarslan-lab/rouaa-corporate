// ─── Impact Badge Component ─────────────────────────────────────
// Shows the impact level of news (High / Medium / Low)
// Color-coded for quick visual scanning

import { Badge } from '@/components/ui/badge';

interface ImpactBadgeProps {
  level: 'high' | 'medium' | 'low';
  className?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function ImpactBadge({ level, className, locale = 'ar' }: ImpactBadgeProps) {
  const variants = {
    high: {
      label: locale === 'es' ? 'Alto Impacto' : locale === 'tr' ? 'Yüksek Etki' : locale === 'fr' ? 'Impact élevé' : locale === 'en' ? 'High Impact' : 'تأثير عالي',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
    },
    medium: {
      label: locale === 'es' ? 'Impacto Medio' : locale === 'tr' ? 'Orta Etki' : locale === 'fr' ? 'Impact moyen' : locale === 'en' ? 'Medium Impact' : 'تأثير متوسط',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
    },
    low: {
      label: locale === 'es' ? 'Bajo Impacto' : locale === 'tr' ? 'Düşük Etki' : locale === 'fr' ? 'Impact faible' : locale === 'en' ? 'Low Impact' : 'تأثير منخفض',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
    },
  };

  const variant = variants[level];

  return (
    <Badge
      className={`${variant.bgColor} ${variant.textColor} ${variant.borderColor} border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {variant.label}
    </Badge>
  );
}
