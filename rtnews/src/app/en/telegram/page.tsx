// ─── English Telegram Integration Page ─────────────────────────────
// Server Component — Info page about the Telegram bot

import { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageCircle,
  Bell,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Globe,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Telegram Bot',
  description: 'Get real-time trading signals, market alerts, and AI analysis directly on Telegram',
  openGraph: {
    title: 'Rouaa — Telegram Bot',
    description: 'Get real-time trading signals, market alerts, and AI analysis directly on Telegram',
  },
};

export default function EnTelegramPage() {
  const features = [
    {
      icon: Zap,
      title: 'Instant Signals',
      description: 'Receive AI-powered trading signals the moment they are generated, with entry prices, stop-loss, and take-profit levels.',
      color: 'var(--gold, #FFB800)',
    },
    {
      icon: Bell,
      title: 'Price Alerts',
      description: 'Set custom price alerts for any asset and get notified when your targets are hit.',
      color: 'var(--cyan, #00E5FF)',
    },
    {
      icon: TrendingUp,
      title: 'Market Updates',
      description: 'Stay informed with real-time market movements, breaking news, and economic event notifications.',
      color: 'var(--bull, #22C55E)',
    },
    {
      icon: BarChart3,
      title: 'AI Analysis',
      description: 'Get concise AI-generated market analysis and sentiment reports delivered to your chat.',
      color: 'var(--purple, #8B5CF6)',
    },
    {
      icon: Globe,
      title: 'Multi-Language',
      description: 'Interact with the bot in both English and Arabic. Switch languages anytime with a single command.',
      color: '#3BA7F0',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and never shared. Full control over notification preferences and alert settings.',
      color: 'var(--bear, #EF5350)',
    },
  ];

  const commands = [
    { cmd: '/start', desc: 'Initialize the bot and set your preferences' },
    { cmd: '/signals', desc: 'View the latest active trading signals' },
    { cmd: '/alerts', desc: 'Manage your price alert subscriptions' },
    { cmd: '/news', desc: 'Get the latest financial news summary' },
    { cmd: '/analysis', desc: 'Request AI analysis for a specific asset' },
    { cmd: '/settings', desc: 'Configure notification preferences and language' },
  ];

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Hero Section */}
        <div
          className="rounded-2xl p-8 mb-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,136,204,0.12), rgba(139,92,246,0.08))',
            border: '1px solid rgba(0,136,204,0.2)',
          }}
        >
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'rgba(0,136,204,0.15)',
            border: '1px solid rgba(0,136,204,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <MessageCircle size={36} style={{ color: '#0088CC' }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>
            Rouaa Telegram Bot
          </h1>
          <p className="text-sm max-w-lg mx-auto mb-6" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Get real-time trading signals, market alerts, and AI analysis delivered directly to your Telegram. Never miss a market move again.
          </p>
          <a
            href="https://t.me/rouaa_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', borderRadius: '12px',
              background: '#0088CC', color: '#fff',
              fontSize: '16px', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(0,136,204,0.3)',
            }}
          >
            <MessageCircle size={18} />
            Open in Telegram
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Features Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>
            Features
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

        {/* Commands Reference */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>
            Bot Commands
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            {commands.map((cmd, i) => (
              <div
                key={cmd.cmd}
                className="flex items-center gap-4 p-4"
                style={{
                  borderBottom: i < commands.length - 1 ? '1px solid var(--border, rgba(255,255,255,0.06))' : 'none',
                }}
              >
                <code
                  className="px-3 py-1 rounded-md text-sm font-bold"
                  style={{
                    background: 'rgba(0,229,255,0.08)',
                    color: 'var(--cyan, #00E5FF)',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cmd.cmd}
                </code>
                <span className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
                  {cmd.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* How to get started */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Open the Bot', desc: 'Click the button above or search @rouaa_bot on Telegram' },
              { step: '2', title: 'Set Preferences', desc: 'Choose your language, preferred assets, and notification frequency' },
              { step: '3', title: 'Stay Informed', desc: 'Receive real-time signals, alerts, and market updates automatically' },
            ].map(item => (
              <div
                key={item.step}
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--cyan, #00E5FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '14px', fontWeight: 700, color: '#000',
                }}>
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>
                  {item.title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
