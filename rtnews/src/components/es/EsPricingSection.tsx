'use client';

import { useState } from 'react';

interface EsPricingPlan {
  name: string;
  nameEs: string;
  price: number;
  annualPrice: number;
  features: string[];
  highlighted: boolean;
  cta: string;
}

const ES_PRICING_PLANS: EsPricingPlan[] = [
  {
    name: 'free',
    nameEs: 'Gratuito',
    price: 0,
    annualPrice: 0,
    features: [
      'Noticias financieras en español — actualizadas al instante',
      'Análisis de sentimiento IA para cada noticia',
      'Cinta de precios en vivo para divisas y metales',
      'Lectura de 3 artículos diarios',
      'Navegación por la sección de Mercados y Mapa de Calor',
      'Uso limitado del Entrenador IA',
    ],
    highlighted: false,
    cta: 'Comenzar gratis',
  },
  {
    name: 'pro',
    nameEs: 'Profesional',
    price: 29,
    annualPrice: 20,
    features: [
      'Todas las funciones del plan Gratuito',
      'Señales de trading IA ilimitadas',
      'Resúmenes del Consejo Inteligente — 8 modelos IA',
      'Escáner de Mercado Avanzado',
      'Lectura y descarga de todos los artículos e informes',
      'Entrenador IA ilimitado con análisis profundo',
      'Alertas personalizadas de precios y noticias',
      'Acceso completo a la Academia y Biblioteca',
      'Gráfico en vivo desde la plataforma Rouaa Trading',
    ],
    highlighted: true,
    cta: 'Suscribirse ahora',
  },
  {
    name: 'elite',
    nameEs: 'Élite',
    price: 79,
    annualPrice: 55,
    features: [
      'Todas las funciones del plan Profesional',
      'Canales exclusivos de Telegram premium',
      'Alertas de prioridad instantáneas',
      'Filtrado avanzado de señales y noticias',
      'Informes semanales detallados',
      'Acceso anticipado a nuevas funciones',
      'Soporte técnico prioritario 24/7',
      'Sesiones de análisis semanal en vivo',
    ],
    highlighted: false,
    cta: 'Unirse a Élite',
  },
];

export default function EsPricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-[32px] font-bold mb-3" style={{ color: 'var(--text)' }}>Planes de Suscripción</h2>
          <p className="text-[15px]" style={{ color: 'var(--text2)' }}>Elija el plan adecuado para sus necesidades — todos los planes incluyen 7 días gratis</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-[14px] font-medium ${!isAnnual ? '' : ''}`} style={{ color: !isAnnual ? 'var(--text)' : 'var(--text3)' }}>Mensual</span>
          <button onClick={() => setIsAnnual(!isAnnual)}
            className={`toggle-switch ${isAnnual ? 'active' : ''}`}>
            <span className="toggle-switch-knob" />
          </button>
          <span className="text-[14px] font-medium" style={{ color: isAnnual ? 'var(--text)' : 'var(--text3)' }}>
            Anual
            <span className="me-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--bull2)', color: 'var(--bull)' }}>Ahorra 30%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {ES_PRICING_PLANS.map((plan) => (
            <div key={plan.name}
              className={`glass-card-elevated p-6 relative transition-all duration-300 hover:-translate-y-1 ${
                plan.highlighted ? 'card-glow-teal' : ''
              }`}
              style={plan.highlighted ? { border: '1px solid rgba(0,201,167,0.3)' } : {}}>

              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: 'var(--cyan)', color: 'var(--bg)' }}>
                  Más Popular
                </div>
              )}

              <div className="text-center mb-5">
                <h3 className="text-[18px] font-bold mb-2" style={{ color: 'var(--text)' }}>{plan.nameEs}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-mono-price text-3xl md:text-[42px] font-bold" style={{ color: 'var(--text)' }}>
                    {plan.price === 0 ? '0' : isAnnual ? plan.annualPrice : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[13px]" style={{ color: 'var(--text2)' }}>
                      $/mes {isAnnual ? '(anual)' : ''}
                    </span>
                  )}
                </div>
                {plan.price === 0 && <span className="text-[13px]" style={{ color: 'var(--text3)' }}>Gratis para siempre</span>}
              </div>

              <div className="space-y-2.5 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[13px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    <span style={{ color: 'var(--text2)' }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-3.5 rounded-xl text-[14px] font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                plan.highlighted ? '' : ''
              }`} style={
                plan.highlighted
                  ? { background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white', boxShadow: '0 8px 24px rgba(0,201,167,0.2)' }
                  : { border: '1px solid var(--border)', color: 'var(--text2)', background: 'transparent' }
              }>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
