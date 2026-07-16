const DISCLAIMER_TEXT: Record<string, {
  title: string;
  compact: string;
  p1: string;
  p2: string;
  p3: string;
}> = {
  en: {
    title: 'Financial Disclaimer',
    compact: '⚠️ The financial content displayed does not constitute investment advice. Consult a licensed financial advisor before making any financial decisions.',
    p1: 'All information and analyses provided on the Rouaa platform are for informational and educational purposes only and do not constitute financial advice, investment recommendations, or solicitation to trade.',
    p2: 'Past performance of financial markets does not guarantee future results. Trading financial instruments involves high risk and you may lose your entire capital.',
    p3: 'You should conduct your own research and consult a licensed financial advisor before making any investment decision. The Rouaa platform is not responsible for any financial losses resulting from the use of published information.',
  },
  es: {
    title: 'Descargo de Responsabilidad Financiera',
    compact: '⚠️ El contenido financiero mostrado no constituye asesoramiento de inversión. Consulte a un asesor financiero con licencia antes de tomar cualquier decisión financiera.',
    p1: 'Toda la información y los análisis proporcionados en la plataforma Rouaa son solo con fines informativos y educativos y no constituyen asesoramiento financiero, recomendaciones de inversión ni solicitud para operar.',
    p2: 'El rendimiento pasado de los mercados financieros no garantiza resultados futuros. Operar con instrumentos financieros implica un alto riesgo y puede perder todo su capital.',
    p3: 'Debe realizar su propia investigación y consultar a un asesor financiero con licencia antes de tomar cualquier decisión de inversión. La plataforma Rouaa no se responsabiliza de las pérdidas financieras derivadas del uso de la información publicada.',
  },
};

export default function EnFinancialDisclaimer({ compact = false, locale = 'en' }: { compact?: boolean; locale?: 'en' | 'es' | 'fr' | 'tr' }) {
  const t = DISCLAIMER_TEXT[locale] || DISCLAIMER_TEXT.en;

  if (compact) {
    return (
      <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text3)' }} dir="ltr">
        {t.compact}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.15)' }} dir="ltr">
      <div className="flex items-center gap-2 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="text-[12px] font-bold" style={{ color: 'var(--gold)' }}>{t.title}</span>
      </div>
      <div className="text-[11px] leading-relaxed space-y-1.5" style={{ color: 'var(--text2)' }}>
        <p>{t.p1}</p>
        <p>{t.p2}</p>
        <p>{t.p3}</p>
      </div>
    </div>
  );
}
