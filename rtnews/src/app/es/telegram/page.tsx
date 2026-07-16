// ─── Spanish Telegram Page ──────────────────────────────────────
// Server Component — Página de información sobre el bot de Telegram en español

import { Metadata } from 'next';
import {
  MessageCircle,
  Bell,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Globe,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bot de Telegram',
  description: 'Reciba señales de trading en tiempo real, alertas de mercado y análisis IA directamente en Telegram',
  openGraph: {
    title: 'Rouaa — Bot de Telegram',
    description: 'Reciba señales de trading en tiempo real, alertas de mercado y análisis IA directamente en Telegram',
    locale: 'es_ES',
  },
};

export default function EsTelegramPage() {
  const features = [
    { icon: Zap, title: 'Señales Instantáneas', description: 'Reciba señales de trading impulsadas por IA en el momento en que se generan, con precios de entrada, stop-loss y take-profit.', color: 'var(--gold, #FFB800)' },
    { icon: Bell, title: 'Alertas de Precio', description: 'Establezca alertas de precio personalizadas para cualquier activo y reciba notificaciones cuando se alcancen sus objetivos.', color: 'var(--cyan, #00E5FF)' },
    { icon: TrendingUp, title: 'Actualizaciones de Mercado', description: 'Manténgase informado con movimientos de mercado en tiempo real, noticias de última hora y notificaciones de eventos económicos.', color: 'var(--bull, #22C55E)' },
    { icon: BarChart3, title: 'Análisis IA', description: 'Reciba análisis de mercado concisos generados por IA e informes de sentimiento directamente en su chat.', color: 'var(--purple, #8B5CF6)' },
    { icon: Globe, title: 'Multilingüe', description: 'Interactúe con el bot en español, inglés y árabe. Cambie de idioma en cualquier momento con un solo comando.', color: '#3BA7F0' },
    { icon: Shield, title: 'Seguro y Privado', description: 'Sus datos están cifrados y nunca se comparten. Control total sobre las preferencias de notificación y configuración de alertas.', color: 'var(--bear, #EF5350)' },
  ];

  const commands = [
    { cmd: '/start', desc: 'Inicializar el bot y configurar sus preferencias' },
    { cmd: '/signals', desc: 'Ver las últimas señales de trading activas' },
    { cmd: '/alerts', desc: 'Gestionar sus suscripciones de alertas de precio' },
    { cmd: '/news', desc: 'Obtener el resumen de las últimas noticias financieras' },
    { cmd: '/analysis', desc: 'Solicitar análisis IA para un activo específico' },
    { cmd: '/settings', desc: 'Configurar preferencias de notificación e idioma' },
  ];

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Hero */}
        <div className="rounded-2xl p-8 mb-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(0,136,204,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(0,136,204,0.2)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <MessageCircle size={36} style={{ color: '#0088CC' }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>Bot de Telegram de Rouaa</h1>
          <p className="text-sm max-w-lg mx-auto mb-6" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Reciba señales de trading en tiempo real, alertas de mercado y análisis IA directamente en su Telegram. No pierda ningún movimiento del mercado.
          </p>
          <a href="https://t.me/rouaa_bot" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '12px', background: '#0088CC', color: '#fff', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,136,204,0.3)' }}>
            <MessageCircle size={18} />
            Abrir en Telegram
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Features */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>Características</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => (
              <div key={feature.title} className="rounded-xl p-4" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${feature.color}15`, border: `1px solid ${feature.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <feature.icon size={20} style={{ color: feature.color }} />
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>{feature.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Commands */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>Comandos del Bot</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            {commands.map((cmd, i) => (
              <div key={cmd.cmd} className="flex items-center gap-4 p-4" style={{ borderBottom: i < commands.length - 1 ? '1px solid var(--border, rgba(255,255,255,0.06))' : 'none' }}>
                <code className="px-3 py-1 rounded-md text-sm font-bold" style={{ background: 'rgba(0,229,255,0.08)', color: 'var(--cyan, #00E5FF)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{cmd.cmd}</code>
                <span className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>{cmd.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Getting Started */}
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>Comenzar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Abrir el Bot', desc: 'Haga clic en el botón de arriba o busque @rouaa_bot en Telegram' },
              { step: '2', title: 'Configurar Preferencias', desc: 'Elija su idioma, activos preferidos y frecuencia de notificación' },
              { step: '3', title: 'Manténgase Informado', desc: 'Reciba señales, alertas y actualizaciones de mercado en tiempo real automáticamente' },
            ].map(item => (
              <div key={item.step} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--cyan, #00E5FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '14px', fontWeight: 700, color: '#000' }}>{item.step}</div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>{item.title}</h3>
                <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
