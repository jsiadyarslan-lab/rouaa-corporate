// ─── Spanish Contact Page ───────────────────────────────────────
// Server Component — Información de contacto en español

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contáctenos',
  description: 'Póngase en contacto con el equipo de Rouaa. Encuentre nuestra información de contacto, canales de soporte y redes sociales.',
  openGraph: {
    locale: 'es_ES',
  },
};

export default function EsContactPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>Contáctenos</h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>Estamos aquí para ayudar. Contáctenos a través de cualquiera de los canales a continuación.</p>
        </div>

        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Ya sea que tenga una pregunta sobre nuestra plataforma, necesite soporte técnico, quiera informar un problema o esté interesado en oportunidades de asociación, nuestro equipo está listo para asistirle. Nuestro objetivo es responder a todas las consultas dentro de 24–48 horas hábiles.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Para obtener la respuesta más rápida, utilice el canal de contacto apropiado que se indica a continuación. Incluir detalles relevantes — como su correo electrónico de cuenta, la página en la que estaba o una captura de pantalla del problema — nos ayudará a resolver su consulta de manera más eficiente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { title: 'Correo Electrónico', detail: 'support@rouaa.com', sub: 'Consultas generales y soporte', accent: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)' },
            { title: 'Telegram', detail: '@rouaa_support', sub: 'Chat en tiempo real y notificaciones', accent: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
            { title: 'Consultas de Negocios', detail: 'partnerships@rouaa.com', sub: 'Asociaciones y publicidad', accent: 'rgba(212,175,55,0.08)', border: 'rgba(212,175,55,0.2)' },
            { title: 'Soporte Técnico', detail: 'tech@rouaa.com', sub: 'Informes de errores y problemas de plataforma', accent: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.2)' },
          ].map(channel => (
            <div key={channel.title} className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: channel.accent, border: `1px solid ${channel.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text, #E8EDF5)' }}>{channel.title}</h3>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--cyan, #00E5FF)' }}>{channel.detail}</p>
              <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>{channel.sub}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text, #E8EDF5)' }}>Síguenos</h2>
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
              Manténgase conectado con Rouaa en redes sociales para las últimas actualizaciones del mercado, anuncios de la plataforma y discusiones de la comunidad.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'X (Twitter)', handle: '@rouaa_news' },
                { name: 'Telegram', handle: 't.me/rouaa_news' },
                { name: 'LinkedIn', handle: 'Rouaa Financial' },
                { name: 'YouTube', handle: 'Rouaa Finance' },
              ].map(social => (
                <span key={social.name} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', color: 'var(--text2, #B0C4D8)' }}>
                  {social.name}: <span style={{ color: 'var(--cyan, #00E5FF)', marginLeft: '4px' }}>{social.handle}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--purple, #8B5CF6)' }}>Rouaa Inteligencia Financiera</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Operando globalmente con un equipo distribuido en múltiples zonas horarias, asegurando que nuestra plataforma funcione 24/7 para servir a traders e inversores de todo el mundo.
          </p>
        </div>
      </div>
    </main>
  );
}
