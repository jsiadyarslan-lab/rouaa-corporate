// ─── Spanish About Page ─────────────────────────────────────────
// Server Component — About Rouaa platform in Spanish

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acerca de Rouaa',
  description: 'Conozca Rouaa — una plataforma de noticias y análisis financieros impulsada por IA que ofrece información de mercado en tiempo real, señales de trading e informes exhaustivos.',
  openGraph: {
    locale: 'es_ES',
  },
};

export default function EsAboutPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>
            Acerca de Rouaa
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Inteligencia financiera impulsada por IA para el inversor moderno
          </p>
        </div>

        {/* Hero Card */}
        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Rouaa es una plataforma de noticias y análisis financieros de nueva generación que aprovecha el poder de la inteligencia artificial para ofrecer información de mercado en tiempo real a traders, inversores y profesionales financieros de todo el mundo. Nuestra plataforma combina algoritmos de IA de vanguardia con supervisión editorial experta para proporcionar información financiera precisa, oportuna y procesable.
          </p>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Fundada con la misión de democratizar el acceso a la inteligencia financiera de nivel profesional, Rouaa cierra la brecha entre el análisis de nivel institucional y los inversores individuales. Ya sea que opere en forex, materias primas, criptomonedas o acciones, nuestra plataforma le proporciona la información basada en datos que necesita para tomar decisiones informadas en mercados de movimiento rápido.
          </p>
        </div>

        {/* Our Mission */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text, #E8EDF5)' }}>Nuestra Misión</h2>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
              Nuestra misión es empoderar a cada inversor con la misma calidad de inteligencia financiera que antes estaba reservada para los actores institucionales. Creemos que el acceso a un análisis de mercado oportuno, preciso y procesable no debería ser un privilegio — debería ser un estándar.
            </p>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
              Aprovechando la inteligencia artificial y el procesamiento del lenguaje natural, monitoreamos continuamente los mercados globales, agencias de noticias y datos económicos para destacar la información más relevante. Nuestra IA identifica patrones, detecta cambios de sentimiento y genera señales de trading — todo en tiempo real — para que nunca pierda un movimiento crítico del mercado.
            </p>
          </div>
        </div>

        {/* Our Vision */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple, #8B5CF6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text, #E8EDF5)' }}>Nuestra Visión</h2>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
              Visualizamos un mundo donde cada individuo — independientemente de su origen o capital — tenga acceso a análisis financiero y inteligencia de mercado de calidad institucional. Nuestro objetivo es convertirnos en el compañero financiero impulsado por IA más confiable para traders e inversores de todo el mundo.
            </p>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
              A medida que los mercados se vuelven más complejos e interconectados, la necesidad de análisis inteligente y en tiempo real nunca ha sido mayor. Rouaa está construyendo el futuro de la información financiera — uno donde la IA y la experiencia humana trabajan de la mano para aportar claridad al caos, transformando el ruido en conocimiento y la incertidumbre en oportunidad.
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #d4af37)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text, #E8EDF5)' }}>Lo Que Ofrecemos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Noticias de Mercado en Vivo', desc: 'Cobertura de noticias financieras en tiempo real en forex, criptomonedas, materias primas y acciones — impulsada por curación IA.' },
              { title: 'Señales de Trading IA', desc: 'Señales de compra/venta basadas en datos con niveles de entrada, stop-loss y take-profit generados por nuestros algoritmos propietarios.' },
              { title: 'Informes Exhaustivos', desc: 'Informes analíticos integrales sobre tendencias de mercado, eventos económicos y rendimiento sectorial.' },
              { title: 'Calendario Económico', desc: 'Siga los eventos y publicaciones de datos económicos clave que mueven los mercados, con evaluaciones de impacto predichas por IA.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl p-4" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--cyan, #00E5FF)' }}>
            Rouaa — Transformando información en conocimiento, conocimiento en oportunidad.
          </p>
        </div>
      </div>
    </main>
  );
}
