// ─── English Community Page ────────────────────────────────────────
// Server Component — Community features placeholder

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
  title: 'Community',
  description: 'Join the Rouaa trading community — share insights, discuss strategies, and learn from fellow traders',
  openGraph: {
    title: 'Rouaa — Community',
    description: 'Join the Rouaa trading community — share insights, discuss strategies, and learn from fellow traders',
  },
};

export default function EnCommunityPage() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Discussion Forums',
      description: 'Discuss market trends, share analysis, and exchange trading ideas with a community of informed traders.',
      color: 'var(--cyan, #00E5FF)',
    },
    {
      icon: Trophy,
      title: 'Leaderboards',
      description: 'Compete with other traders on signal accuracy and analysis quality. Rise through the ranks and earn recognition.',
      color: 'var(--gold, #FFB800)',
    },
    {
      icon: Lightbulb,
      title: 'Shared Analysis',
      description: 'Publish your own market analysis, get feedback from peers, and discover unique perspectives from other traders.',
      color: 'var(--purple, #8B5CF6)',
    },
    {
      icon: Star,
      title: 'Expert Insights',
      description: 'Follow top contributors and get notified when they publish new analysis or share trading signals.',
      color: '#3BA7F0',
    },
    {
      icon: Heart,
      title: 'Reactions & Feedback',
      description: 'React to analyses with bullish/bearish votes, leave comments, and help surface the best content.',
      color: 'var(--bull, #22C55E)',
    },
    {
      icon: Share2,
      title: 'Content Sharing',
      description: 'Share articles, infographics, and reports directly to the community feed or your social channels.',
      color: 'var(--bear, #EF5350)',
    },
  ];

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
            Community
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Connect, share, and learn with fellow traders
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
            Community Features Coming Soon
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            We are building a vibrant community platform where traders can share insights, compete on leaderboards, and learn from each other. Stay tuned for the launch.
          </p>
        </div>

        {/* Planned Features */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>
            Planned Features
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
            Be the First to Know
          </h3>
          <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Join our Telegram channel to get notified when community features launch and be among the first to participate.
          </p>
          <a
            href="/en/telegram"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '10px',
              background: 'var(--cyan, #00E5FF)', color: '#000',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            Join Telegram Channel
          </a>
        </div>
      </div>
    </main>
  );
}
