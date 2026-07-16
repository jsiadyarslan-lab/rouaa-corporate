// ─── French Community Page ────────────────────────────────────────
// Server Component — Community features placeholder (French)

import { Metadata } from 'next';
import {
  Users,
  MessageSquare,
  Trophy,
  Star,
  TrendingUp,
  Lightbulb,
  Heart,
  Share2,
  Award,
  Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Communauté',
  description: 'Rejoignez la communauté de trading Rouaa — partagez des insights, discutez stratégies et apprenez des autres traders',
  openGraph: {
    title: 'Rouaa — Communauté',
    description: 'Rejoignez la communauté de trading Rouaa — partagez des insights, discutez stratégies et apprenez des autres traders',
  },
};

export default function FrCommunityPage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Forums de discussion',
      description: 'Discutez des tendances du marché, partagez des analyses et échangez des idées de trading avec une communauté de traders informés.',
      color: 'var(--cyan, #00E5FF)',
    },
    {
      icon: Trophy,
      title: 'Classements',
      description: 'Compétissez avec d\'autres traders sur la précision des signaux et la qualité des analyses. Grimpez dans les rangs et gagnez en reconnaissance.',
      color: 'var(--gold, #FFB800)',
    },
    {
      icon: Lightbulb,
      title: 'Analyses partagées',
      description: 'Publiez vos propres analyses de marché, recevez des retours de vos pairs et découvrez des perspectives uniques d\'autres traders.',
      color: 'var(--purple, #8B5CF6)',
    },
    {
      icon: Star,
      title: 'Insights d\'experts',
      description: 'Suivez les meilleurs contributeurs et soyez notifié lorsqu\'ils publient de nouvelles analyses ou partagent des signaux de trading.',
      color: '#3BA7F0',
    },
    {
      icon: Heart,
      title: 'Réactions & Retours',
      description: 'Réagissez aux analyses avec des votes haussier/baissier, laissez des commentaires et aidez à faire ressortir le meilleur contenu.',
      color: 'var(--bull, #22C55E)',
    },
    {
      icon: Share2,
      title: 'Partage de contenu',
      description: 'Partagez des articles, infographies et rapports directement dans le flux communautaire ou sur vos réseaux sociaux.',
      color: 'var(--bear, #EF5350)',
    },
  ];

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
            Communauté
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Connectez-vous, partagez et apprenez avec d&apos;autres traders
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div
          className="rounded-2xl p-8 mb-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(139,92,246,0.08))',
            border: '1px solid rgba(0,229,255,0.15)',
          }}
        >
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))',
            border: '1px solid rgba(0,229,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Users size={36} style={{ color: 'var(--cyan, #00E5FF)' }} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>
            Fonctionnalités communautaires bientôt disponibles
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Nous construisons une plateforme communautaire dynamique où les traders pourront partager des insights, compétir sur les classements et apprendre les uns des autres. Restez à l&apos;écoute pour le lancement.
          </p>
        </div>

        {/* Planned Features */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>
            Fonctionnalités prévues
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => (
              <div
                key={feature.title}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `${feature.color}15`,
                  border: `1px solid ${feature.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <feature.icon size={20} style={{ color: feature.color }} />
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Join CTA */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <Globe size={24} style={{ color: 'var(--cyan, #00E5FF)', margin: '0 auto 12px' }} />
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Soyez le premier informé
          </h3>
          <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Rejoignez notre canal Telegram pour être notifié du lancement des fonctionnalités communautaires et être parmi les premiers à participer.
          </p>
          <a
            href="/fr/telegram"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '10px',
              background: 'var(--cyan, #00E5FF)', color: '#000',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            Rejoindre le canal Telegram
          </a>
        </div>
      </div>
    </main>
  );
}
