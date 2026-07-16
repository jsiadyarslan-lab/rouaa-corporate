// ─── Spanish Community Page ─────────────────────────────────────
// Server Component — Características de la comunidad en español

import { Metadata } from 'next';
import { Users, MessageSquare, Trophy, Star, TrendingUp, Lightbulb, Heart, Share2, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Comunidad',
  description: 'Únase a la comunidad de trading de Rouaa — comparta ideas, discuta estrategias y aprenda de otros traders',
  openGraph: {
    title: 'Rouaa — Comunidad',
    description: 'Únase a la comunidad de trading de Rouaa — comparta ideas, discuta estrategias y aprenda de otros traders',
    locale: 'es_ES',
  },
};

export default function EsCommunityPage() {
  const features = [
    { icon: MessageSquare, title: 'Foros de Discusión', description: 'Discuta tendencias de mercado, comparta análisis e intercambie ideas de trading con una comunidad de traders informados.', color: 'var(--cyan, #00E5FF)' },
    { icon: Trophy, title: 'Clasificaciones', description: 'Compite con otros traders en precisión de señales y calidad de análisis. Ascienda en el ranking y gane reconocimiento.', color: 'var(--gold, #FFB800)' },
    { icon: Lightbulb, title: 'Análisis Compartido', description: 'Publique su propio análisis de mercado, reciba comentarios de sus compañeros y descubra perspectivas únicas de otros traders.', color: 'var(--purple, #8B5CF6)' },
    { icon: Star, title: 'Perspectivas de Expertos', description: 'Siga a los mejores contribuyentes y reciba notificaciones cuando publiquen nuevos análisis o compartan señales de trading.', color: '#3BA7F0' },
    { icon: Heart, title: 'Reacciones y Comentarios', description: 'Reaccione a los análisis con votos alcistas/bajistas, deje comentarios y ayude a destacar el mejor contenido.', color: 'var(--bull, #22C55E)' },
    { icon: Share2, title: 'Compartir Contenido', description: 'Comparta artículos, infografías e informes directamente en el feed de la comunidad o en sus redes sociales.', color: 'var(--bear, #EF5350)' },
  ];

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>Comunidad</h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>Conecte, comparta y aprenda con otros traders</p>
        </div>

        <div className="rounded-2xl p-8 mb-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(0,229,255,0.15)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Users size={36} style={{ color: 'var(--cyan, #00E5FF)' }} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>Características de la Comunidad — Próximamente</h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Estamos construyendo una plataforma comunitaria vibrante donde los traders pueden compartir ideas, competir en clasificaciones y aprender unos de otros. Manténgase atento al lanzamiento.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>Características Planificadas</h2>
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

        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
          <Globe size={24} style={{ color: 'var(--cyan, #00E5FF)', margin: '0 auto 12px' }} />
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text2, #B0C4D8)' }}>Sea el Primero en Saber</h3>
          <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Únase a nuestro canal de Telegram para recibir notificaciones cuando se lancen las funciones de la comunidad y ser de los primeros en participar.
          </p>
          <a href="/es/telegram" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', background: 'var(--cyan, #00E5FF)', color: '#000', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
            Unirse al Canal de Telegram
          </a>
        </div>
      </div>
    </main>
  );
}
