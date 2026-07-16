// ─── French Disclaimer Page ─────────────────────────────────────────
// Server Component — Avertissement financier pour la plateforme Rouaa

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Avertissement financier',
  description:
    "Avertissement financier de la plateforme Rouaa. Informations importantes sur les risques d'investissement et les limites de notre contenu financier.",
};

export default function FrDisclaimerPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Avertissement financier
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Dernière mise à jour : Mars 2025
          </p>
        </div>

        {/* Critical Warning Banner */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(255,77,106,0.06)',
            border: '1px solid rgba(255,77,106,0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff4d6a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: '2px' }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#ff4d6a' }}>
                Avertissement important sur les risques
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
                Le trading sur les marchés financiers comporte un risque substantiel de perte et
                ne convient pas à tous les investisseurs. La valeur des investissements peut
                baisser aussi bien que monter, et vous pouvez perdre plus que votre investissement
                initial. Ne tradez jamais avec de l&apos;argent que vous ne pouvez pas vous permettre
                de perdre.
              </p>
            </div>
          </div>
        </div>

        {/* Not Financial Advice */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <h2
            className="text-base font-bold mb-3"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Pas un conseil financier
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Tout le contenu fourni sur la plateforme Rouaa — y compris mais sans s&apos;y limiter
            les articles d&apos;actualité, les rapports analytiques, les signaux de trading, les
            commentaires de marché, les infographies et les données du calendrier économique —
            est fourni à titre informatif et éducatif uniquement. Rien sur cette plateforme ne
            constitue un conseil financier, en investissement, juridique, fiscal ou autre conseil
            professionnel, et ne doit pas être considéré comme tel.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Les informations présentées ne constituent pas une recommandation, une sollicitation
            ou une offre d&apos;achat ou de vente d&apos;instruments financiers, y compris mais sans
            s&apos;y limiter les actions, les obligations, le forex, les cryptomonnaies, les
            matières premières ou les produits dérivés. Vous devez toujours consulter un
            professionnel financier qualifié avant de prendre toute décision d&apos;investissement.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: 'Avertissement concernant les signaux de trading',
            content: `Les signaux de trading générés par nos algorithmes d'IA sont basés sur des modèles de données historiques, des indicateurs techniques et une analyse du sentiment du marché. Ces signaux ne garantissent pas de résultats futurs et ne doivent pas être traités comme des recommandations d'achat ou de vente définitives. Les signaux sont fournis comme l'un des nombreux intrants possibles pour votre propre analyse et processus de décision indépendant. Vous êtes seul responsable de déterminer si vous devez agir sur un signal, et vous assumez l'entière responsabilité des résultats de vos décisions de trading.`,
          },
          {
            title: 'Risque de perte',
            content: `Le trading et l'investissement financiers comportent des risques inhérents, y compris la possibilité de perdre une partie ou la totalité de votre capital investi. Le degré de risque varie selon les différentes classes d'actifs et les conditions du marché. Les produits à effet de levier tels que le forex, les CFD et les contrats à terme comportent un niveau de risque élevé et peuvent ne pas convenir à tous les investisseurs. Vous devez examiner attentivement votre situation financière, votre expérience en investissement et votre tolérance au risque avant de vous engager dans toute activité de trading. Les performances passées — qu'elles soient simulées ou réelles — ne sont pas indicatives des résultats futurs.`,
          },
          {
            title: 'Exactitude des informations',
            content: `Bien que nous nous efforcions de fournir des informations exactes, opportunes et fiables, Rouaa ne fait aucune déclaration ou garantie d'aucune sorte, expresse ou implicite, concernant l'exhaustivité, l'exactitude, la fiabilité, l'adéquation ou la disponibilité des informations, produits, services ou graphiques associés contenus sur la plateforme à quelque fin que ce soit. Les données du marché peuvent être retardées et les prix peuvent différer des prix réels du marché. Toute confiance que vous accordez à ces informations est donc strictement à vos propres risques.`,
          },
          {
            title: 'Contenu généré par l\'IA',
            content: `Des parties du contenu sur cette plateforme sont générées ou assistées par des systèmes d'intelligence artificielle. Bien que nous mettions en œuvre des contrôles de qualité et une supervision éditoriale, le contenu généré par l'IA peut occasionnellement contenir des inexactitudes, des omissions ou des mauvaises interprétations. Vous ne devez pas vous fier uniquement à l'analyse générée par l'IA pour vos décisions d'investissement. Vérifiez toujours les informations critiques auprès de sources indépendantes et de conseillers professionnels avant d'agir sur tout contenu trouvé sur cette plateforme.`,
          },
          {
            title: 'Aucune garantie de profits',
            content: `Rouaa ne garantit aucun résultat, rendement ou profit spécifique de l'utilisation de notre plateforme ou de nos services. Toutes les projections, prévisions ou estimations présentées sont de nature hypothétique et sont basées sur des hypothèses qui peuvent ne pas refléter les conditions réelles du marché. Il n'y a aucune garantie qu'une stratégie, un signal ou une analyse particulier entraînera des profits ou évitera des pertes. Les marchés financiers sont par nature imprévisibles, et même les modèles les plus sophistiqués ne peuvent pas éliminer le risque de perte.`,
          },
          {
            title: 'Contenu tiers',
            content: `La plateforme peut contenir des liens vers ou intégrer du contenu provenant de sources tierces, y compris des agences de presse, des fournisseurs de données et des plateformes de médias sociaux. Rouaa n'approuve pas, ne vérifie pas et n'assume aucune responsabilité quant à l'exactitude, la légalité ou le contenu de tout matériel tiers. L'inclusion de contenu tiers n'implique pas d'approbation ou de recommandation. Vous accédez au contenu tiers à vos propres risques.`,
          },
          {
            title: 'Restrictions juridictionnelles',
            content: `Les Services fournis par Rouaa peuvent ne pas être disponibles ou appropriés dans toutes les juridictions. Il est de votre responsabilité de vous assurer que votre utilisation de la plateforme est conforme à toutes les lois et réglementations locales, nationales et internationales applicables. Rouaa ne déclare pas que le contenu ou les services sont appropriés ou disponibles pour une utilisation dans tous les lieux. Si vous accédez à la plateforme depuis une juridiction où le trading financier ou la fourniture d'informations financières est restreint, vous le faites à vos propres risques et êtes seul responsable de la conformité aux lois locales.`,
          },
          {
            title: 'Limitation de responsabilité',
            content: `Dans la mesure maximale permise par la loi applicable, Rouaa, ses directeurs, employés, partenaires, agents, fournisseurs et affiliés ne seront pas responsables de tout dommage indirect, accessoire, spécial, consécutif ou punitif, y compris la perte de profits, de données ou d'autres pertes incorporelles, résultant de votre accès ou utilisation de (ou de l'incapacité d'accéder ou d'utiliser) la plateforme, de tout contenu obtenu depuis la plateforme, ou de toute conduite ou contenu de tout tiers sur la plateforme.`,
          },
        ].map(section => (
          <div
            key={section.title}
            className="rounded-2xl p-6 mb-4"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              {section.title}
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              {section.content}
            </p>
          </div>
        ))}

        {/* Bottom warning */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(212,175,55,0.04)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--gold, #d4af37)' }}>
            Tradez de manière responsable
          </p>
          <p className="text-xs leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Effectuez toujours vos propres recherches et consultez un conseiller financier
            agréé avant de prendre des décisions d&apos;investissement. N&apos;investissez jamais plus
            que ce que vous pouvez vous permettre de perdre.
          </p>
        </div>
      </div>
    </main>
  );
}
