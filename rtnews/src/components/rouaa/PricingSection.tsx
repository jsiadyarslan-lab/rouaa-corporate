'use client';

import { useState } from 'react';
import { pricingPlans } from '@/data/mock-data';

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="section-block">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl md:text-[32px] font-bold mb-3" style={{ color: 'var(--text)' }}>خطط الاشتراك</h2>
          <p className="text-[15px]" style={{ color: 'var(--text2)' }}>اختر الخطة المناسبة لاحتياجاتك — كل الخطط تتضمن 7 أيام مجانية</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-[14px] font-medium ${!isAnnual ? '' : ''}`} style={{ color: !isAnnual ? 'var(--text)' : 'var(--text3)' }}>شهري</span>
          <button onClick={() => setIsAnnual(!isAnnual)}
            className={`toggle-switch ${isAnnual ? 'active' : ''}`}>
            <span className="toggle-switch-knob" />
          </button>
          <span className="text-[14px] font-medium" style={{ color: isAnnual ? 'var(--text)' : 'var(--text3)' }}>
            سنوي
            <span className="me-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--bull2)', color: 'var(--bull)' }}>وفّر 30%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {pricingPlans.map((plan) => (
            <div key={plan.name}
              className={`glass-card-elevated p-6 relative transition-all duration-300 hover:-translate-y-1 ${
                plan.highlighted ? 'card-glow-teal' : ''
              }`}
              style={plan.highlighted ? { border: '1px solid rgba(0,201,167,0.3)' } : {}}>

              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: 'var(--cyan)', color: 'var(--bg)' }}>
                  الأكثر شعبية
                </div>
              )}

              <div className="text-center mb-5">
                <h3 className="text-[18px] font-bold mb-2" style={{ color: 'var(--text)' }}>{plan.nameAr}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-mono-price text-3xl md:text-[42px] font-bold" style={{ color: 'var(--text)' }}>
                    {plan.price === 0 ? '0' : isAnnual ? plan.annualPrice : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[13px]" style={{ color: 'var(--text2)' }}>
                      $/شهر {isAnnual ? '(سنوي)' : ''}
                    </span>
                  )}
                </div>
                {plan.price === 0 && <span className="text-[13px]" style={{ color: 'var(--text3)' }}>مجاني للأبد</span>}
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
