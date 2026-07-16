// ─── Bull vs Bear Section Component ───────────────────────────────
// Two side-by-side cards showing bullish and bearish factors
// Uses design system CSS variables for visual consistency

interface BullBearSectionProps {
  bullishFactors: string[];
  bearishFactors: string[];
  className?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function BullBearSection({ bullishFactors, bearishFactors, className, locale = 'ar' }: BullBearSectionProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  if (bullishFactors.length === 0 && bearishFactors.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${className || ''}`}>
      {/* Bullish Card */}
      {bullishFactors.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
            </svg>
            <h3 className="text-[13px] font-bold" style={{ color: 'var(--bull)' }}>{t('عوامل إيجابية', 'Bullish Factors', 'Facteurs haussiers', 'Yükseliş Faktörleri', 'Factores alcistas')}</h3>
          </div>
          <ul className="space-y-2.5">
            {bullishFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2.5 text-[13px] leading-[1.8]" style={{ color: 'var(--text2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bearish Card */}
      {bearishFactors.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/>
            </svg>
            <h3 className="text-[13px] font-bold" style={{ color: 'var(--bear)' }}>{t('عوامل سلبية', 'Bearish Factors', 'Facteurs baissiers', 'Düşüş Faktörleri', 'Factores bajistas')}</h3>
          </div>
          <ul className="space-y-2.5">
            {bearishFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2.5 text-[13px] leading-[1.8]" style={{ color: 'var(--text2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
