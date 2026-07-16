// ─── Insight Card Component ───────────────────────────────────────
// Shows key insights as bullet points for quick scanning
// Uses design system CSS variables for visual consistency

interface InsightCardProps {
  insights: string[];
  className?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function InsightCard({ insights, className, locale = 'ar' }: InsightCardProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  return (
    <div
      className={`rounded-2xl p-6 mb-6 ${className || ''}`}
      style={{
        background: 'var(--bg4)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
          <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/>
        </svg>
        <h3 className="text-[15px] font-bold" style={{ color: 'var(--cyan)' }}>{t('الرؤى الأساسية', 'Key Insights', 'Points clés', 'Temel Çıkarımlar', 'Perspectivas Clave')}</h3>
      </div>
      <ul className="space-y-3">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start gap-3 text-[14px] leading-[1.9]" style={{ color: 'var(--text2)' }}>
            <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold mt-0.5" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>{index + 1}</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
