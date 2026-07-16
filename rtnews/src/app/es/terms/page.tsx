// ─── Spanish Terms of Service Page ──────────────────────────────
// Server Component — Términos de Servicio para la plataforma Rouaa

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: 'Términos de Servicio para la plataforma de noticias y análisis financieros Rouaa. Lea nuestros términos que rigen el uso de nuestros servicios.',
  openGraph: {
    locale: 'es_ES',
  },
};

export default function EsTermsPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>Términos de Servicio</h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>Última actualización: Marzo 2025</p>
        </div>

        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Bienvenido a Rouaa. Estos Términos de Servicio (&quot;Términos&quot;) rigen su acceso y uso de la plataforma Rouaa, incluyendo nuestro sitio web, aplicaciones móviles, APIs y todos los servicios relacionados (colectivamente, los &quot;Servicios&quot;). Al acceder o utilizar nuestros Servicios, usted acepta estar sujeto a estos Términos. Si no está de acuerdo con alguna parte de estos Términos, debe dejar de usar los Servicios inmediatamente.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Estos Términos constituyen un acuerdo legalmente vinculante entre usted (&quot;Usuario,&quot; &quot;usted,&quot; o &quot;su&quot;) y Rouaa (&quot;nosotros,&quot; &quot;nos,&quot; o &quot;nuestro&quot;). Nos reservamos el derecho de modificar estos Términos en cualquier momento, y su uso continuado de los Servicios después de cualquier cambio constituye su aceptación de los Términos actualizados.
          </p>
        </div>

        {[
          { title: '1. Elegibilidad', content: 'Debe tener al menos 18 años de edad para usar nuestros Servicios. Al usar los Servicios, usted declara y garantiza que tiene al menos 18 años y tiene la capacidad legal para celebrar estos Términos. Los menores de 18 años tienen estrictamente prohibido acceder o usar la plataforma.' },
          { title: '2. Registro de Cuenta', content: 'Algunas funciones de los Servicios pueden requerir que cree una cuenta. Usted acepta proporcionar información precisa, actualizada y completa durante el registro y actualizar dicha información según sea necesario. Usted es responsable de salvaguardar las credenciales de su cuenta y de todas las actividades que ocurran bajo su cuenta.' },
          { title: '3. Uso Aceptable', content: 'Usted acepta usar los Servicios solo con fines legales y de acuerdo con estos Términos. No deberá: (a) usar los Servicios de cualquier manera que viole las leyes aplicables; (b) intentar obtener acceso no autorizado a cualquier parte de los Servicios; (c) usar los Servicios para transmitir software malicioso, spam o contenido no autorizado; (d) interferir o interrumpir la integridad o el rendimiento de los Servicios.' },
          { title: '4. Propiedad Intelectual', content: 'Todo el contenido, características y funcionalidades de los Servicios — incluyendo pero no limitado a texto, gráficos, logotipos, iconos, imágenes, compilaciones de datos y software — son propiedad exclusiva de Rouaa o sus licenciantes y están protegidos por las leyes internacionales de derechos de autor, marcas registradas, patentes y otra propiedad intelectual.' },
          { title: '5. Descargo de Información Financiera', content: 'Los Servicios proporcionan noticias financieras, análisis y señales de trading solo con fines informativos. Nada en la plataforma constituye asesoramiento financiero, de inversión, legal o fiscal. No debe interpretar ningún contenido como una recomendación o solicitud para comprar, vender o mantener cualquier instrumento financiero. Todas las decisiones de trading e inversión son responsabilidad exclusiva suya.' },
          { title: '6. Limitación de Responsabilidad', content: 'En la máxima medida permitida por la ley, Rouaa y sus directores, empleados y agentes no serán responsables de ningún daño indirecto, incidental, especial, consecuente o punitivo, incluyendo pero no limitado a la pérdida de beneficios, datos o buena voluntad, derivados de o en conexión con su uso de los Servicios.' },
          { title: '7. Indemnización', content: 'Usted acepta indemnizar, defender y mantener indemne a Rouaa y sus directores, empleados y agentes de y contra cualquier y todos los reclamos, responsabilidades, daños, pérdidas y gastos que surjan de o en cualquier manera relacionados con su acceso o uso de los Servicios.' },
          { title: '8. Terminación', content: 'Nos reservamos el derecho de suspender o terminar su acceso a los Servicios en cualquier momento, con o sin causa, y con o sin previo aviso. Tras la terminación, su derecho a usar los Servicios cesará inmediatamente.' },
          { title: '9. Ley Aplicable', content: 'Estos Términos se regirán e interpretarán de acuerdo con las leyes de la jurisdicción en la que opera Rouaa, sin tener en cuenta sus disposiciones sobre conflictos de leyes.' },
          { title: '10. Contacto', content: 'Si tiene alguna pregunta sobre estos Términos de Servicio, contáctenos a través de nuestra página de Contacto o envíenos un correo electrónico a legal@rouaa.com.' },
        ].map(section => (
          <div key={section.title} className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>{section.title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>{section.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
