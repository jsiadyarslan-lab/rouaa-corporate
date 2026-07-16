// ─── Trading Insight Card Component ───────────────────────────────
// Highlighted card showing actionable trading implications
// Uses design system CSS variables for visual consistency

interface TradingInsightCardProps {
  title?: string;
  insight: string;
  className?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function TradingInsightCard({ title, insight, className, locale = 'ar' }: TradingInsightCardProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const defaultTitle = locale === 'es' ? 'Qué significa esto para los traders' : locale === 'tr' ? 'Bu, Traderlar İçin Ne Anlama Geliyor' : locale === 'fr' ? "Ce que cela signifie pour les traders" : locale === 'en' ? 'What This Means for Traders' : 'ماذا يعني هذا للمتداولين';
  const displayTitle = title ?? defaultTitle;
  return (
    <div
      className={`p-5 rounded-2xl mb-6 ${className || ''}`}
      style={{
        background: 'var(--cyan3)',
        border: '1px solid rgba(0,201,167,0.2)',
        borderInlineStartWidth: '4px',
        borderInlineStartColor: 'var(--cyan)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
        <h3 className="text-[14px] font-bold" style={{ color: 'var(--cyan)' }}>{displayTitle}</h3>
      </div>
      <p className="text-[15px] leading-[1.9]" style={{ color: 'var(--text)' }}>{insight}</p>
    </div>
  );
}
