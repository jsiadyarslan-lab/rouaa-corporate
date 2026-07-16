// ─── Spanish Disclaimer Page ────────────────────────────────────
// Server Component — Descargo de responsabilidad financiera

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Descargo de Responsabilidad',
  description: 'Descargo de responsabilidad financiera para la plataforma Rouaa. Información importante sobre los riesgos de inversión y las limitaciones de nuestro contenido financiero.',
  openGraph: {
    locale: 'es_ES',
  },
};

export default function EsDisclaimerPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>Descargo de Responsabilidad Financiera</h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>Última actualización: Marzo 2025</p>
        </div>

        {/* Critical Warning */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.2)' }}>
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#ff4d6a' }}>Aviso Importante de Riesgo</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
                Operar en los mercados financieros conlleva un riesgo sustancial de pérdida y no es adecuado para todos los inversores. El valor de las inversiones puede subir y bajar, y puede perder más que su inversión original. Nunca opere con dinero que no pueda permitirse perder.
              </p>
            </div>
          </div>
        </div>

        {/* Not Financial Advice */}
        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
          <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>No Constituye Asesoramiento Financiero</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Todo el contenido proporcionado en la plataforma Rouaa — incluyendo pero no limitado a artículos de noticias, informes analíticos, señales de trading, comentarios de mercado, infografías y datos del calendario económico — es solo con fines informativos y educativos. Nada de lo contenido en esta plataforma constituye asesoramiento financiero, de inversión, legal, fiscal u otro asesoramiento profesional, y no debe ser considerado como tal.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            La información presentada no constituye una recomendación, solicitud u oferta para comprar o vender instrumentos financieros. Siempre debe buscar el asesoramiento de un profesional financiero calificado antes de tomar cualquier decisión de inversión.
          </p>
        </div>

        {[
          { title: 'Descargo de Señales de Trading', content: 'Las señales de trading generadas por nuestros algoritmos de IA se basan en patrones de datos históricos, indicadores técnicos y análisis de sentimiento del mercado. Estas señales no garantizan resultados futuros y no deben tratarse como recomendaciones definitivas de compra o venta. Las señales se proporcionan como uno de los muchos posibles insumos para su propio análisis y proceso de toma de decisiones independiente.' },
          { title: 'Riesgo de Pérdida', content: 'El trading y la inversión financiera conllevan riesgos inherentes, incluyendo la posibilidad de perder parte o todo su capital invertido. El grado de riesgo varía entre diferentes clases de activos y condiciones de mercado. Los productos apalancados como forex, CFDs y futuros conllevan un alto nivel de riesgo y pueden no ser adecuados para todos los inversores. El rendimiento pasado — ya sea simulado o real — no es indicativo de resultados futuros.' },
          { title: 'Precisión de la Información', content: 'Si bien nos esforzamos por proporcionar información precisa, oportuna y confiable, Rouaa no hace declaraciones ni garantías de ningún tipo sobre la integridad, exactitud, confiabilidad, idoneidad o disponibilidad de la información contenida en la plataforma. Los datos del mercado pueden estar retrasados y los precios pueden diferir de los precios reales del mercado.' },
          { title: 'Contenido Generado por IA', content: 'Partes del contenido de esta plataforma son generadas o asistidas por sistemas de inteligencia artificial. Si bien implementamos controles de calidad y supervisión editorial, el contenido generado por IA puede ocasionalmente contener inexactitudes, omisiones o interpretaciones erróneas. No debe depender únicamente del análisis generado por IA para sus decisiones de inversión.' },
          { title: 'Sin Garantía de Ganancias', content: 'Rouaa no garantiza resultados, rendimientos o ganancias específicos del uso de nuestra plataforma o servicios. Cualquier proyección, pronóstico o estimación presentada es de naturaleza hipotética y se basa en supuestos que pueden no reflejar las condiciones reales del mercado.' },
          { title: 'Contenido de Terceros', content: 'La plataforma puede contener enlaces o contenido incrustado de fuentes de terceros. Rouaa no respalda, verifica ni se responsabiliza de la exactitud, legalidad o contenido de ningún material de terceros.' },
          { title: 'Restricciones Jurisdiccionales', content: 'Los Servicios proporcionados por Rouaa pueden no estar disponibles o ser apropiados en todas las jurisdicciones. Es su responsabilidad garantizar que su uso de la plataforma cumpla con todas las leyes y regulaciones locales, nacionales e internacionales aplicables.' },
          { title: 'Limitación de Responsabilidad', content: 'En la máxima medida permitida por la ley aplicable, Rouaa, sus directores, empleados, socios, agentes, proveedores y afiliados no serán responsables de ningún daño indirecto, incidental, especial, consecuente o punitivo resultante de su acceso o uso de la plataforma.' },
        ].map(section => (
          <div key={section.title} className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>{section.title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>{section.content}</p>
          </div>
        ))}

        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--gold, #d4af37)' }}>Opere con Responsabilidad</p>
          <p className="text-xs leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Siempre realice su propia investigación y consulte con un asesor financiero con licencia antes de tomar decisiones de inversión. Nunca invierta más de lo que pueda permitirse perder.
          </p>
        </div>
      </div>
    </main>
  );
}
