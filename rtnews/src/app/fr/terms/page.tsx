// ─── French Terms of Service Page ────────────────────────────────────
// Server Component — Conditions d'utilisation pour la plateforme Rouaa

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description:
    "Conditions d'utilisation de la plateforme Rouaa d'actualités et d'analyses financières. Lisez nos conditions régissant l'utilisation de nos services.",
};

export default function FrTermsPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Conditions d&apos;utilisation
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Dernière mise à jour : Mars 2025
          </p>
        </div>

        {/* Intro */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Bienvenue sur Rouaa. Ces Conditions d&apos;utilisation (&quot;Conditions&quot;) régissent votre
            accès et votre utilisation de la plateforme Rouaa, y compris notre site web, nos
            applications mobiles, nos API et tous les services associés (collectivement, les
            &quot;Services&quot;). En accédant ou en utilisant nos Services, vous acceptez d&apos;être lié par
            ces Conditions. Si vous n&apos;êtes pas d&apos;accord avec une partie de ces Conditions, vous
            devez cesser immédiatement d&apos;utiliser les Services.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Ces Conditions constituent un accord juridiquement contraignant entre vous
            (&quot;Utilisateur&quot;, &quot;vous&quot; ou &quot;votre&quot;) et Rouaa (&quot;nous&quot;, &quot;notre&quot; ou &quot;nos&quot;). Nous nous
            réservons le droit de modifier ces Conditions à tout moment, et votre utilisation
            continue des Services après tout changement constitue votre acceptation des
            Conditions mises à jour.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Éligibilité',
            content: `Vous devez avoir au moins 18 ans pour utiliser nos Services. En utilisant les Services, vous déclarez et garantissez que vous avez au moins 18 ans et que vous avez la capacité juridique de conclure ces Conditions. Si vous utilisez les Services au nom d'une organisation, vous déclarez que vous avez l'autorité d'engager cette organisation dans ces Conditions. Les utilisateurs de moins de 18 ans sont strictement interdits d'accès ou d'utilisation de la plateforme.`,
          },
          {
            title: '2. Inscription au compte',
            content: `Certaines fonctionnalités des Services peuvent nécessiter la création d'un compte. Vous acceptez de fournir des informations exactes, actuelles et complètes lors de l'inscription et de mettre à jour ces informations si nécessaire. Vous êtes responsable de la protection de vos identifiants de compte et de toutes les activités qui se produisent sous votre compte. Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte. Nous ne serons pas responsables de toute perte ou dommage résultant de votre défaut de maintenir la sécurité de votre compte.`,
          },
          {
            title: '3. Utilisation acceptable',
            content: `Vous acceptez d'utiliser les Services uniquement à des fins licites et conformément à ces Conditions. Vous ne devez pas : (a) utiliser les Services de manière à violer les lois ou réglementations applicables ; (b) tenter d'accéder de manière non autorisée à toute partie des Services ou à ses systèmes associés ; (c) utiliser les Services pour transmettre tout logiciel malveillant, spam ou contenu non autorisé ; (d) interférer avec ou perturber l'intégrité ou les performances des Services ; (e) copier, modifier ou distribuer toute partie des Services sans notre consentement écrit préalable ; (f) utiliser des scripts automatisés ou des bots pour accéder aux Services sans autorisation.`,
          },
          {
            title: '4. Propriété intellectuelle',
            content: `Tout le contenu, les fonctionnalités et les fonctionnalités des Services — y compris mais sans s'y limiter les textes, graphiques, logos, icônes, images, clips audio, compilations de données et logiciels — sont la propriété exclusive de Rouaa ou de ses concédants de licence et sont protégés par les lois internationales sur le droit d'auteur, les marques commerciales, les brevets et autres lois sur la propriété intellectuelle. Vous ne pouvez pas reproduire, distribuer, modifier, créer des œuvres dérivées, afficher publiquement ou exploiter tout contenu des Services sans notre autorisation écrite expresse.`,
          },
          {
            title: '5. Avertissement concernant les informations financières',
            content: `Les Services fournissent des actualités financières, des analyses et des signaux de trading à titre informatif uniquement. Rien sur la plateforme ne constitue un conseil financier, en investissement, juridique ou fiscal. Vous ne devez pas interpréter tout contenu comme une recommandation ou une sollicitation d'achat, de vente ou de conservation d'un instrument financier. Toutes les décisions de trading et d'investissement relèvent de votre seule responsabilité. Les performances passées ne sont pas indicatives des résultats futurs, et vous devez toujours consulter un conseiller financier qualifié avant de prendre toute décision d'investissement.`,
          },
          {
            title: '6. Limitation de responsabilité',
            content: `Dans la mesure maximale permise par la loi, Rouaa et ses dirigeants, directeurs, employés et agents ne seront pas responsables de tout dommage indirect, accessoire, spécial, consécutif ou punitif, y compris mais sans s'y limiter la perte de profits, de données ou de clientèle, découlant de ou en lien avec votre utilisation des Services. Cette limitation s'applique indépendamment de la théorie juridique sur laquelle ces dommages sont réclamés, que ce soit dans le cadre d'un contrat, d'un délit, d'une responsabilité stricte ou autre.`,
          },
          {
            title: '7. Indemnisation',
            content: `Vous acceptez d'indemniser, de défendre et de dégager de toute responsabilité Rouaa et ses dirigeants, directeurs, employés et agents de et contre toutes les réclamations, responsabilités, dommages, pertes et dépenses (y compris les honoraires d'avocat raisonnables) découlant de ou liés de quelque manière que ce soit à votre accès ou utilisation des Services, votre violation de ces Conditions ou votre violation des droits d'un tiers.`,
          },
          {
            title: '8. Résiliation',
            content: `Nous nous réservons le droit de suspendre ou de résilier votre accès aux Services à tout moment, avec ou sans motif, et avec ou sans préavis. En cas de résiliation, votre droit d'utiliser les Services cessera immédiatement. Toutes les dispositions de ces Conditions qui par leur nature doivent survivre à la résiliation — y compris les dispositions relatives à la propriété, les déclarations de non-garantie, l'indemnisation et les limitations de responsabilité — survivront à la résiliation.`,
          },
          {
            title: '9. Loi applicable',
            content: `Ces Conditions seront régies par et interprétées conformément aux lois de la juridiction dans laquelle Rouaa opère, sans égard à ses dispositions relatives aux conflits de lois. Tout litige découlant de ou en lien avec ces Conditions sera résolu par arbitrage contraignant conformément aux règles d'arbitrage applicables, ou devant les tribunaux de la juridiction pertinente.`,
          },
          {
            title: '10. Contact',
            content: `Si vous avez des questions concernant ces Conditions d'utilisation, veuillez nous contacter via notre page Contact ou nous envoyer un e-mail à legal@rouaa.com. Nous nous engageons à traiter vos préoccupations de manière rapide et transparente.`,
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
      </div>
    </main>
  );
}
