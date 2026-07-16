// V1035: Stub module — referenced by analysis components but never existed.
// Provides the Locale type and timeAgo utility used by TradingQuotesPanel, RiskCalculator, etc.

export type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

export const timeAgo = (dateStr: string, locale: Locale = 'ar'): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const labels: Record<Locale, { now: string; min: string; hr: string; day: string }> = {
    ar: { now: 'الآن', min: 'دقيقة', hr: 'ساعة', day: 'يوم' },
    en: { now: 'now', min: 'min', hr: 'hr', day: 'day' },
    fr: { now: 'maintenant', min: 'min', hr: 'h', day: 'j' },
    tr: { now: 'şimdi', min: 'dk', hr: 'sa', day: 'gün' },
    es: { now: 'ahora', min: 'min', hr: 'h', day: 'día' },
  };
  const l = labels[locale] || labels.ar;
  if (diffMin < 1) return l.now;
  if (diffMin < 60) return locale === 'ar' ? `قبل ${diffMin} ${l.min}` : `${diffMin} ${l.min} ago`;
  if (diffHr < 24) return locale === 'ar' ? `قبل ${diffHr} ${l.hr}` : `${diffHr} ${l.hr} ago`;
  return locale === 'ar' ? `قبل ${diffDay} ${l.day}` : `${diffDay} ${l.day} ago`;
};
