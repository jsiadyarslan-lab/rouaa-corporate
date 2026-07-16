// ─── French About Page ──────────────────────────────────────────────
// Server Component — About Rouaa platform (French version)

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos de Rouaa',
  description:
    'Découvrez Rouaa — une plateforme d\'actualités et d\'analyses financières alimentée par l\'IA, offrant des insights de marché en temps réel, des signaux de trading et des rapports approfondis.',
};

export default function FrAboutPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            À propos de Rouaa
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Intelligence financière alimentée par l&apos;IA pour l&apos;investisseur moderne
          </p>
        </div>

        {/* Hero Card */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p
            className="text-base leading-relaxed mb-4"
            style={{ color: 'var(--text2, #B0C4D8)' }}
          >
            Rouaa est une plateforme de nouvelle génération d&apos;actualités et d&apos;analyses financières
            qui exploite la puissance de l&apos;intelligence artificielle pour fournir des insights de
            marché en temps réel aux traders, investisseurs et professionnels de la finance du monde
            entier. Notre plateforme combine des algorithmes d&apos;IA de pointe avec une supervision
            éditoriale experte pour fournir des informations financières précises, opportunes et
            exploitables.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--text2, #B0C4D8)' }}
          >
            Fondée avec la mission de démocratiser l&apos;accès à l&apos;intelligence financière de
            niveau institutionnel, Rouaa comble le fossé entre l&apos;analyse de niveau institutionnel
            et les investisseurs individuels. Que vous négociiez le forex, les matières premières,
            les cryptomonnaies ou les actions, notre plateforme vous équipe des insights basés sur
            les données dont vous avez besoin pour prendre des décisions éclairées sur des marchés
            en évolution rapide.
          </p>
        </div>

        {/* Our Mission */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--cyan, #00E5FF)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Notre Mission
            </h2>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Notre mission est de donner à chaque investisseur accès à la même qualité
              d&apos;intelligence financière qui était autrefois réservée aux acteurs institutionnels.
              Nous croyons que l&apos;accès à une analyse de marché opportune, précise et exploitable
              ne devrait pas être un privilège — il devrait être la norme.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              En exploitant l&apos;intelligence artificielle et le traitement du langage naturel,
              nous surveillons en permanence les marchés mondiaux, les fils d&apos;actualité et les
              données économiques pour faire émerger les insights les plus importants. Notre IA
              identifie les tendances, détecte les changements de sentiment et génère des signaux
              de trading — le tout en temps réel — pour que vous ne manquiez jamais un mouvement
              de marché critique.
            </p>
          </div>
        </div>

        {/* Our Vision */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--purple, #8B5CF6)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Notre Vision
            </h2>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Nous envisageons un monde où chaque individu — quel que soit son parcours ou son
              capital — a accès à une analyse financière et une intelligence de marché de qualité
              institutionnelle. Notre objectif est de devenir le compagnon financier alimenté par
              l&apos;IA le plus fiable pour les traders et investisseurs du monde entier.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Alors que les marchés deviennent plus complexes et interconnectés, le besoin
              d&apos;analyse intelligente en temps réel n&apos;a jamais été aussi grand. Rouaa construit
              l&apos;avenir de l&apos;information financière — un avenir où l&apos;IA et l&apos;expertise humaine
              travaillent main dans la main pour apporter de la clarté au chaos, transformant le
              bruit en connaissance et l&apos;incertitude en opportunité.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold, #d4af37)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              Ce que nous offrons
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Actualités de marché en direct',
                desc: 'Couverture d\'actualités financières en temps réel sur le forex, les crypto, les matières premières et les actions — alimentée par la curation IA.',
              },
              {
                title: 'Signaux de trading IA',
                desc: 'Signaux d\'achat/vente basés sur les données avec niveaux d\'entrée, de stop-loss et de take-profit générés par nos algorithmes propriétaires.',
              },
              {
                title: 'Rapports approfondis',
                desc: 'Rapports analytiques complets sur les tendances du marché, les événements économiques et la performance sectorielle.',
              },
              {
                title: 'Calendrier économique',
                desc: 'Suivez les événements économiques clés et les publications de données qui font bouger les marchés, avec des évaluations d\'impact prédites par l\'IA.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--text, #E8EDF5)' }}
                >
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.12)',
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--cyan, #00E5FF)' }}
          >
            Rouaa — Transformer l&apos;information en insight, l&apos;insight en opportunité.
          </p>
        </div>
      </div>
    </main>
  );
}
