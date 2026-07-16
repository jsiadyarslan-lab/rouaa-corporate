// ─── Spanish Privacy Policy Page ────────────────────────────────
// Server Component — Política de Privacidad para la plataforma Rouaa

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de Privacidad para la plataforma de noticias y análisis financieros Rouaa. Conozca cómo recopilamos, usamos y protegemos su información personal.',
  openGraph: {
    locale: 'es_ES',
  },
};

export default function EsPrivacyPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text, #E8EDF5)' }}>Política de Privacidad</h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>Última actualización: Marzo 2025</p>
        </div>

        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            En Rouaa, nos tomamos su privacidad en serio. Esta Política de Privacidad describe cómo recopilamos, usamos, divulgamos y protegemos su información personal cuando utiliza nuestra plataforma, sitio web, aplicaciones móviles y servicios relacionados (colectivamente, los &quot;Servicios&quot;). Estamos comprometidos a garantizar que sus datos personales se manejen de manera responsable y en cumplimiento con las leyes de protección de datos aplicables.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Al usar nuestros Servicios, usted acepta las prácticas de datos descritas en esta Política de Privacidad. Si no está de acuerdo con los términos de esta política, por favor no acceda ni use los Servicios.
          </p>
        </div>

        {[
          { title: '1. Información que Recopilamos', content: 'Recopilamos varios tipos de información para proporcionar y mejorar nuestros Servicios:\n\nInformación Personal: Al crear una cuenta, recopilamos su nombre, dirección de correo electrónico y cualquier otra información que proporcione voluntariamente.\n\nDatos de Uso: Recopilamos automáticamente información sobre cómo interactúa con los Servicios, incluyendo páginas visitadas, tiempo pasado, patrones de clics, tipo de navegador, información del dispositivo, dirección IP y URLs de referencia.\n\nCookies y Seguimiento: Usamos cookies y tecnologías de seguimiento similares para mejorar su experiencia, analizar tendencias y recopilar información demográfica.\n\nPreferencias Financieras: Si personaliza su lista de seguimiento de mercados, establece alertas de precios o guarda marcadores, almacenamos estas preferencias para personalizar su experiencia.' },
          { title: '2. Cómo Usamos su Información', content: 'Usamos la información que recopilamos para los siguientes fines:\n\n• Proporcionar, mantener y mejorar los Servicios, incluyendo la personalización de contenido y la entrega de noticias y señales de mercado relevantes.\n• Crear y gestionar su cuenta, autenticar su identidad y proporcionar soporte al cliente.\n• Enviarle notificaciones, alertas y comunicaciones que haya aceptado recibir.\n• Analizar patrones y tendencias de uso para mejorar la funcionalidad de nuestra plataforma.\n• Detectar, prevenir y abordar fraudes, brechas de seguridad y otras actividades potencialmente prohibidas o ilegales.' },
          { title: '3. Compartir y Divulgación de Información', content: 'No vendemos su información personal a terceros. Podemos compartir su información en las siguientes circunstancias:\n\nProveedores de Servicios: Podemos compartir información con proveedores de servicios de confianza que nos ayudan a operar la plataforma.\n\nRequisitos Legales: Podemos divulgar su información si lo requiere la ley, regulación, proceso legal o solicitud gubernamental.\n\nTransferencias Comerciales: En caso de fusión, adquisición o venta de activos, su información personal puede ser transferida como parte de la transacción.' },
          { title: '4. Seguridad de Datos', content: 'Implementamos medidas de seguridad de estándar de la industria para proteger su información personal del acceso no autorizado, alteración, divulgación o destrucción. Estas medidas incluyen cifrado de datos en tránsito y en reposo, auditorías de seguridad regulares, controles de acceso e infraestructura segura.' },
          { title: '5. Retención de Datos', content: 'Retenemos su información personal solo durante el tiempo necesario para cumplir con los fines para los que fue recopilada, incluyendo la satisfacción de cualquier requisito legal, contable o de informe. Cuando elimine su cuenta, eliminaremos o anonimizaremos sus datos personales dentro de un período razonable.' },
          { title: '6. Sus Derechos', content: 'Dependiendo de su jurisdicción, puede tener los siguientes derechos respecto a sus datos personales:\n\n• Acceso: Solicitar una copia de los datos personales que tenemos sobre usted.\n• Corrección: Solicitar la corrección de datos personales inexactos o incompletos.\n• Eliminación: Solicitar la eliminación de sus datos personales, sujeto a requisitos de retención legal.\n• Portabilidad: Solicitar la transferencia de sus datos en un formato legible por máquina.\n• Oposición: Oponerse al procesamiento de sus datos para ciertos fines.\n\nPara ejercer cualquiera de estos derechos, contáctenos en privacy@rouaa.com.' },
          { title: '7. Enlaces a Terceros', content: 'Nuestros Servicios pueden contener enlaces a sitios web o servicios de terceros que no son propiedad ni están controlados por Rouaa. Esta Política de Privacidad no se aplica a esos servicios de terceros.' },
          { title: '8. Privacidad de Menores', content: 'Nuestros Servicios no están dirigidos a personas menores de 18 años. No recopilamos conscientemente información personal de menores de edad.' },
          { title: '9. Cambios a Esta Política', content: 'Podemos actualizar esta Política de Privacidad de vez en cuando. Le notificaremos sobre cambios materiales publicando la política actualizada en nuestra plataforma.' },
          { title: '10. Contáctenos', content: 'Si tiene preguntas o inquietudes sobre esta Política de Privacidad o nuestras prácticas de datos, contáctenos en privacy@rouaa.com o a través de nuestra página de Contacto.' },
        ].map(section => (
          <div key={section.title} className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text, #E8EDF5)' }}>{section.title}</h2>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text2, #B0C4D8)' }}>{section.content}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
