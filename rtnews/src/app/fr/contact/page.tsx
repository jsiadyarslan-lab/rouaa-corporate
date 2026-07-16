// ─── Page Contact en français ────────────────────────────────────────────
// Composant serveur — Informations de contact pour la plateforme Rouaa

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nous contacter',
  description:
    'Contactez l\'équipe Rouaa. Retrouvez nos coordonnées, canaux de support et liens vers nos réseaux sociaux.',
};

export default function FrContactPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* En-tête */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Nous contacter
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Nous sommes là pour vous aider. Contactez-nous via l&apos;un des canaux ci-dessous.
          </p>
        </div>

        {/* Carte d'introduction */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Que vous ayez une question sur notre plateforme, besoin d&apos;assistance technique,
            souhaitiez signaler un problème ou soyez intéressé par des opportunités de partenariat,
            notre équipe est prête à vous aider. Nous nous engageons à répondre à toutes les demandes
            dans un délai de 24 à 48 heures ouvrées.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Pour une réponse plus rapide, veuillez utiliser le canal de contact approprié
            ci-dessous. Inclure des détails pertinents — tels que votre adresse e-mail de compte,
            la page sur laquelle vous étiez, ou une capture d&apos;écran du problème — nous aidera
            à traiter votre demande plus efficacement.
          </p>
        </div>

        {/* Canaux de contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              ),
              title: 'E-mail',
              detail: 'support@rouaa.com',
              sub: 'Demandes générales et support',
              accent: 'rgba(0,229,255,0.08)',
              border: 'rgba(0,229,255,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple, #8B5CF6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              ),
              title: 'Telegram',
              detail: '@rouaa_support',
              sub: 'Chat en temps réel et notifications',
              accent: 'rgba(139,92,246,0.08)',
              border: 'rgba(139,92,246,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #d4af37)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              ),
              title: 'Demandes commerciales',
              detail: 'partnerships@rouaa.com',
              sub: 'Partenariats et publicité',
              accent: 'rgba(212,175,55,0.08)',
              border: 'rgba(212,175,55,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              ),
              title: 'Support technique',
              detail: 'tech@rouaa.com',
              sub: 'Rapports de bugs et problèmes de plateforme',
              accent: 'rgba(0,229,255,0.08)',
              border: 'rgba(0,229,255,0.2)',
            },
          ].map(channel => (
            <div
              key={channel.title}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: channel.accent,
                  border: `1px solid ${channel.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                {channel.icon}
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{ color: 'var(--text, #E8EDF5)' }}
              >
                {channel.title}
              </h3>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: 'var(--cyan, #00E5FF)' }}
              >
                {channel.detail}
              </p>
              <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>
                {channel.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Réseaux sociaux */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Suivez-nous
          </h2>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Restez connecté avec Rouaa sur les réseaux sociaux pour les dernières mises à jour du marché,
              les annonces de la plateforme et les discussions de la communauté. Suivez-nous pour des analyses
              en temps réel et rejoignez une communauté croissante de traders et investisseurs.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'X (Twitter)', handle: '@rouaa_news' },
                { name: 'Telegram', handle: 't.me/rouaa_news' },
                { name: 'LinkedIn', handle: 'Rouaa Financial' },
                { name: 'YouTube', handle: 'Rouaa Finance' },
              ].map(social => (
                <span
                  key={social.name}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(0,229,255,0.06)',
                    border: '1px solid rgba(0,229,255,0.15)',
                    color: 'var(--text2, #B0C4D8)',
                  }}
                >
                  {social.name}: <span style={{ color: 'var(--cyan, #00E5FF)', marginLeft: '4px' }}>{social.handle}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section FAQ */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Comment signaler un bug ou un problème technique ?',
                a: 'Envoyez un e-mail à tech@rouaa.com avec une description du problème, le navigateur ou l\'appareil que vous utilisez, et toute capture d\'écran pertinente. Notre équipe technique répond généralement dans les 24 heures.',
              },
              {
                q: 'Comment demander une fonctionnalité ou une amélioration ?',
                a: 'Nous adorons recevoir les retours de nos utilisateurs ! Envoyez vos suggestions à support@rouaa.com ou envoyez-nous un message sur Telegram. Nous examinons toutes les suggestions et les classons par priorité en fonction de la demande de la communauté.',
              },
              {
                q: 'Comment puis-je faire de la publicité ou collaborer avec Rouaa ?',
                a: 'Pour la publicité, les parrainages ou les partenariats stratégiques, veuillez contacter partnerships@rouaa.com avec une brève description de votre proposition. Notre équipe de développement commercial vous recontactera.',
              },
            ].map(faq => (
              <div
                key={faq.q}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--text, #E8EDF5)' }}
                >
                  {faq.q}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text3, #8A9DB2)' }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Informations sur le bureau */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(139,92,246,0.04)',
            border: '1px solid rgba(139,92,246,0.12)',
          }}
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--purple, #8B5CF6)' }}
          >
            Rouaa Financial Intelligence
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Opérant à l&apos;échelle mondiale avec une équipe distribuée sur plusieurs fuseaux horaires,
            garantissant le fonctionnement de notre plateforme 24h/24 et 7j/7 pour servir les traders et investisseurs du monde entier.
          </p>
        </div>
      </div>
    </main>
  );
}
