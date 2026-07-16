export default function FrFinancialDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text3)' }} dir="ltr">
        ⚠️ Le contenu financier affiché ne constitue pas un conseil en investissement. Consultez un conseiller financier agréé avant de prendre toute décision financière.
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
        <span className="text-[12px] font-bold" style={{ color: 'var(--gold)' }}>Avertissement Financier</span>
      </div>
      <div className="text-[11px] leading-relaxed space-y-1.5" style={{ color: 'var(--text2)' }}>
        <p>Toutes les informations et analyses fournies sur la plateforme Rouaa sont à titre informatif et éducatif uniquement et ne constituent pas un conseil financier, une recommandation d&apos;investissement ou une sollicitation à trader.</p>
        <p>Les performances passées des marchés financiers ne garantissent pas les résultats futurs. Le trading d&apos;instruments financiers comporte un risque élevé et vous pouvez perdre la totalité de votre capital.</p>
        <p>Vous devriez mener vos propres recherches et consulter un conseiller financier agréé avant de prendre toute décision d&apos;investissement. La plateforme Rouaa n&apos;est pas responsable des pertes financières résultant de l&apos;utilisation des informations publiées.</p>
      </div>
    </div>
  );
}
