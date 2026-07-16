// ─── French Privacy Policy Page ─────────────────────────────────────
// Server Component — Gizlilik Politikası pour la plateforme Rouaa

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description:
    'Gizlilik Politikası de la plateforme Rouaa d\'actualités et d\'analyses financières. Découvrez comment nous collectons, utilisons et protégeons vos informations personnelles.',
};

export default function TrPrivacyPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Gizlilik Politikası
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Son güncelleme: Mart 2025
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
            Chez Rouaa, nous prenons votre vie privée au sérieux. Cette Gizlilik Politikası
            décrit comment nous collectons, utilisons, divulguons et protégeons vos informations
            personnelles lorsque vous utilisez notre plateforme, notre site web, nos applications
            mobiles et nos services associés (collectivement, les &quot;Services&quot;). Nous nous
            engageons à garantir que vos données personnelles sont traitées de manière responsable
            et conformément aux lois applicables en matière de protection des données.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            En utilisant nos Services, vous consentez aux pratiques en matière de données décrites
            dans cette Gizlilik Politikası. Si vous n&apos;êtes pas d&apos;accord avec les termes
            de cette politique, veuillez ne pas accéder ou utiliser les Services. Nous vous
            encourageons à revoir cette politique périodiquement, car nous pouvons la mettre à
            jour de temps à autre.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Informations que nous collectons',
            content: `Nous collectons plusieurs types d'informations pour fournir et améliorer nos Services :

Informations personnelles : Lorsque vous créez un compte, nous collectons votre nom, votre adresse e-mail et toute autre information que vous fournissez volontairement. Cela peut inclure votre numéro de téléphone si vous optez pour les notifications par SMS ou Telegram.

Données d'utilisation : Nous collectons automatiquement des informations sur la façon dont vous interagissez avec les Services, y compris les pages visitées, le temps passé sur les pages, les habitudes de clic, le type de navigateur, les informations sur l'appareil, l'adresse IP et les URL de référence.

Cookies et suivi : Nous utilisons des cookies et des technologies de suivi similaires pour améliorer votre expérience, analyser les tendances et rassembler des informations démographiques. Vous pouvez contrôler les préférences de cookies via les paramètres de votre navigateur.

Préférences financières : Si vous personnalisez votre liste de suivi des marchés, définissez des alertes de prix ou enregistrez des favoris, nous stockons ces préférences pour personnaliser votre expérience.`,
          },
          {
            title: '2. Comment nous utilisons vos informations',
            content: `Nous utilisons les informations que nous collectons aux fins suivantes :

• Pour fournir, maintenir et améliorer les Services, y compris la personnalisation du contenu et la livraison d'actualités et de signaux de marché pertinents.
• Pour créer et gérer votre compte, authentifier votre identité et fournir un support client.
• Pour vous envoyer des notifications, des alertes et des communications auxquelles vous avez consenti, y compris les alertes de prix, les signaux de trading et les mises à jour du marché.
• Pour analyser les modes et tendances d'utilisation afin d'améliorer la fonctionnalité de notre plateforme et l'expérience utilisateur.
• Pour détecter, prévenir et traiter la fraude, les violations de sécurité et autres activités potentiellement interdites ou illégales.
• Pour nous conformer aux obligations légales et faire respecter nos Conditions d'utilisation.`,
          },
          {
            title: '3. Partage et divulgation des informations',
            content: `Nous ne vendons pas vos informations personnelles à des tiers. Nous pouvons partager vos informations dans les circonstances suivantes :

Fournisseurs de services : Nous pouvons partager des informations avec des fournisseurs de services tiers de confiance qui nous assistent dans l'exploitation de la plateforme, tels que les fournisseurs d'hébergement cloud, les services d'analyse et les plateformes de communication. Ces fournisseurs sont contractuellement tenus de traiter vos données de manière sécurisée et uniquement aux fins que nous spécifions.

Exigences légales : Nous pouvons divulguer vos informations si cela est exigé par la loi, la réglementation, un processus légal ou une demande gouvernementale. Nous pouvons également divulguer des informations lorsque nous croyons de bonne foi que la divulgation est nécessaire pour protéger nos droits, votre sécurité ou la sécurité d'autrui.

Transferts commerciaux : En cas de fusion, d'acquisition, de réorganisation ou de vente d'actifs, vos informations personnelles peuvent être transférées dans le cadre de la transaction. Nous vous informerons de tout tel transfert et de vos choix concernant vos informations.`,
          },
          {
            title: '4. Sécurité des données',
            content: `Nous mettons en œuvre des mesures de sécurité conformes aux normes de l'industrie pour protéger vos informations personnelles contre tout accès, modification, divulgation ou destruction non autorisés. Ces mesures incluent le chiffrement des données en transit et au repos, des audits de sécurité réguliers, des contrôles d'accès et une infrastructure sécurisée. Cependant, aucune méthode de transmission sur Internet ou de stockage électronique n'est sûre à 100 %. Bien que nous nous efforcions d'utiliser des moyens commercialement acceptables pour protéger vos données, nous ne pouvons garantir leur sécurité absolue.`,
          },
          {
            title: '5. Conservation des données',
            content: `Nous conservons vos informations personnelles uniquement aussi longtemps que nécessaire pour atteindre les objectifs pour lesquels elles ont été collectées, y compris pour satisfaire à toute exigence légale, comptable ou de déclaration. Lorsque vous supprimez votre compte, nous supprimerons ou anonymiserons vos données personnelles dans un délai raisonnable, sauf lorsque nous sommes tenus par la loi de conserver certaines informations.`,
          },
          {
            title: '6. Vos droits',
            content: `Selon votre juridiction, vous pouvez avoir les droits suivants concernant vos données personnelles :

• Accès : Demander une copie des données personnelles que nous détenons à votre sujet.
• Rectification : Demander la correction de données personnelles inexactes ou incomplètes.
• Suppression : Demander la suppression de vos données personnelles, sous réserve des exigences de conservation légales.
• Portabilité : Demander le transfert de vos données dans un format lisible par machine.
• Opposition : Vous opposer au traitement de vos données à certaines fins.
• Limitation : Demander la limitation du traitement de vos données dans certaines circonstances.

Pour exercer l'un de ces droits, veuillez nous contacter à privacy@rouaa.com.`,
          },
          {
            title: '7. Liens vers des tiers',
            content: `Nos Services peuvent contenir des liens vers des sites web ou services tiers qui ne sont ni détenus ni contrôlés par Rouaa. Cette Gizlilik Politikası ne s'applique pas à ces services tiers. Nous vous encourageons à consulter les politiques de confidentialité de tout service tiers auquel vous accédez, car nous n'avons aucun contrôle sur leur contenu, leurs politiques de confidentialité ou leurs pratiques et n'assumons aucune responsabilité à cet égard.`,
          },
          {
            title: '8. Confidentialité des enfants',
            content: `Nos Services ne s'adressent pas aux personnes de moins de 18 ans. Nous ne collectons pas sciemment d'informations personnelles auprès d'enfants. Si nous découvrons que nous avons collecté des données personnelles d'un enfant de moins de 18 ans, nous prendrons des mesures pour supprimer ces informations rapidement. Si vous pensez que nous avons inadvertently collecté des informations d'un mineur, veuillez nous contacter immédiatement.`,
          },
          {
            title: '9. Modifications de cette politique',
            content: `Nous pouvons mettre à jour cette Gizlilik Politikası de temps à autre. Nous vous informerons de tout changement matériel en publiant la politique mise à jour sur notre plateforme et, le cas échéant, en vous envoyant une notification par e-mail ou par message in-app. Votre utilisation continue des Services après la date d'entrée en vigueur de tout changement constitue votre acceptation de la politique mise à jour.`,
          },
          {
            title: '10. Nous contacter',
            content: `Si vous avez des questions ou des préoccupations concernant cette Gizlilik Politikası ou nos pratiques en matière de données, veuillez nous contacter à privacy@rouaa.com ou via notre page Contact. Nous nous engageons à répondre à vos demandes de manière rapide et transparente.`,
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
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text2, #B0C4D8)' }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
