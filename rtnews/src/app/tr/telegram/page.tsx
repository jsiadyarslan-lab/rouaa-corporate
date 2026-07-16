// ─── French Telegram Integration Page ─────────────────────────────
// Server Component — Info page about the Telegram bot (French)

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
  description: 'Telegram üzerinden gerçek zamanlı trading sinyalleri, piyasa uyarıları ve yapay zeka analizleri alın',
  openGraph: {
    title: 'Rouaa — Telegram Bot',
    description: 'Telegram üzerinden gerçek zamanlı trading sinyalleri, piyasa uyarıları ve yapay zeka analizleri alın',
  },
};

export default function TrTelegramPage() {
  const features = [
    {
      icon: Zap,
      title: 'Anlık sinyaller',
      description: 'Recevez des signaux de trading alimentés par l\'IA dès leur génération, avec prix d\'entrée, stop-loss et niveaux de take-profit.',
      color: 'var(--gold, #FFB800)',
    },
    {
      icon: Bell,
      title: 'Fiyat uyarıları',
      description: 'Herhangi bir varlık için özel fiyat uyarıları ayarlayın ve hedeflerinize ulaşıldığında bildirim alın.',
      color: 'var(--cyan, #00E5FF)',
    },
    {
      icon: TrendingUp,
      title: 'Piyasa güncellemeleri',
      description: 'Bilgi Sahibi Olun avec les mouvements de marché en temps réel, les actualités de dernière minute et les notifications d\'événements économiques.',
      color: 'var(--bull, #22C55E)',
    },
    {
      icon: BarChart3,
      title: 'Yapay Zeka Analizi',
      description: 'Recevez des analyses de marché concises générées par l\'IA et des rapports de sentiment directement dans votre chat.',
      color: 'var(--purple, #8B5CF6)',
    },
    {
      icon: Globe,
      title: 'Çok Dilli',
      description: 'Botla Türkçe, İngilizce, Fransızca ve Arapça etkileşime geçin. Tek bir komutla istediğiniz zaman dil değiştirin.',
      color: '#3BA7F0',
    },
    {
      icon: Shield,
      title: 'Güvenli ve Özel',
      description: 'Vos données sont chiffrées et jamais partagées. Contrôle total sur les préférences de notification et les paramètres d\'alerte.',
      color: 'var(--bear, #EF5350)',
    },
  ];

  const commands = [
    { cmd: '/start', desc: 'Botu başlatın ve tercihlerinizi ayarlayın' },
    { cmd: '/signals', desc: 'Son aktif trading sinyallerini görün' },
    { cmd: '/alerts', desc: 'Fiyat uyarısı aboneliklerinizi yönetin' },
    { cmd: '/news', desc: 'Son finansal haberlerin özetini alın' },
    { cmd: '/analysis', desc: 'Belirli bir varlık için yapay zeka analizi isteyin' },
    { cmd: '/settings', desc: 'Bildirim tercihlerini ve dili yapılandırın' },
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
            Telegram Bot Rouaa
          </h1>
          <p className="text-sm max-w-lg mx-auto mb-6" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Telegram üzerinden gerçek zamanlı trading sinyalleri, piyasa uyarıları ve yapay zeka analizleri alın. Hiçbir piyasa hareketini kaçırmayın.
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
            Telegram'da Aç
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Features Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>
            Özellikler
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
            Bot Komutları
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
            Başlamak için
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Botu Aç', desc: "Yukarıdaki butona tıklayın veya Telegram'da @rouaa_bot'u arayın" },
              { step: '2', title: 'Tercihleri Ayarla', desc: 'Dilinizi, tercih edilen varlıklarınızı ve bildirim sıklığını seçin' },
              { step: '3', title: 'Bilgi Sahibi Olun', desc: 'Otomatik olarak sinyaller, uyarılar ve gerçek zamanlı piyasa güncellemeleri alın' },
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
