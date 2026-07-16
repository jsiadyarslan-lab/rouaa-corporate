'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SentimentGaugeProps {
  value: number;       // 0-100 (0 = extreme fear, 100 = extreme greed)
  className?: string;
  animated?: boolean;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  ar: {
    title: 'مقياس المشاعر السوقية',
    extremeFear: 'خوف شديد',
    fear: 'خوف',
    neutral: 'محايد',
    greed: 'جشع',
    extremeGreed: 'جشع شديد',
    bullish: 'صعودي',
    neutralRange: 'محايد',
    bearish: 'هبوطي',
  },
  en: {
    title: 'Market Sentiment Gauge',
    extremeFear: 'Extreme Fear',
    fear: 'Fear',
    neutral: 'Neutral',
    greed: 'Greed',
    extremeGreed: 'Extreme Greed',
    bullish: 'Bullish',
    neutralRange: 'Neutral',
    bearish: 'Bearish',
  },
  fr: {
    title: "Jauge de Sentiment du Marché",
    extremeFear: 'Peur Extrême',
    fear: 'Peur',
    neutral: 'Neutre',
    greed: 'Avidité',
    extremeGreed: 'Avidité Extrême',
    bullish: 'Haussier',
    neutralRange: 'Neutre',
    bearish: 'Baissier',
  },
  tr: {
    title: 'Piyasa Duyarlılık Göstergesi',
    extremeFear: 'Aşırı Korku',
    fear: 'Korku',
    neutral: 'Nötr',
    greed: 'Açgözlülük',
    extremeGreed: 'Aşırı Açgözlülük',
    bullish: 'Yükseliş',
    neutralRange: 'Nötr',
    bearish: 'Düşüş',
  },
  es: {
    title: 'Medidor de Sentimiento del Mercado',
    extremeFear: 'Miedo Extremo',
    fear: 'Miedo',
    neutral: 'Neutral',
    greed: 'Codicia',
    extremeGreed: 'Codicia Extrema',
    bullish: 'Alcista',
    neutralRange: 'Neutral',
    bearish: 'Bajista',
  },
};

function getSentimentLabel(value: number, locale: string): string {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.ar[key] || key;
  if (value <= 20) return t('extremeFear');
  if (value <= 40) return t('fear');
  if (value <= 60) return t('neutral');
  if (value <= 80) return t('greed');
  return t('extremeGreed');
}

function getIndicatorColor(value: number): string {
  if (value <= 20) return '#D4365C'; // Red
  if (value <= 40) return '#D4930D'; // Orange-yellow
  if (value <= 60) return '#D4930D'; // Yellow
  if (value <= 80) return '#00996B'; // Green
  return '#00996B'; // Deep green
}

export default function SentimentGauge({ value, className = '', animated = true, locale = 'ar' }: SentimentGaugeProps) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.ar[key] || key;
  const clampedValue = Math.max(0, Math.min(100, value));

  // When not animated, start at the target value; when animated, start at 0/100 and animate in
  const [displayValue, setDisplayValue] = useState(animated ? 0 : clampedValue);
  const [displayPosition, setDisplayPosition] = useState(animated ? 100 : clampedValue);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animated || hasAnimated.current) return;
    hasAnimated.current = true;

    let rafId: number | null = null;

    // Animate the indicator from right (fear) to its position
    const timer = setTimeout(() => {
      setDisplayPosition(clampedValue);
      // Animate the number counting up
      const duration = 800;
      const startTime = Date.now();

      const countUp = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(clampedValue * eased));

        if (progress < 1) {
          rafId = requestAnimationFrame(countUp);
        }
      };

      rafId = requestAnimationFrame(countUp);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [clampedValue, animated]);

  const indicatorColor = getIndicatorColor(clampedValue);
  const label = getSentimentLabel(clampedValue, locale);

  return (
    <div className={className} style={{
      margin: '16px 0',
      padding: '12px 16px',
      borderRadius: '10px',
      background: 'rgba(128,128,128,0.03)',
      border: '1px solid rgba(128,128,128,0.1)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-head, #fff)',
        }}>
          {t('title')}
        </span>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          color: indicatorColor,
          transition: 'color 0.5s ease',
        }}>
          {displayValue}
        </span>
      </div>

      {/* Gradient Bar */}
      <div style={{
        position: 'relative',
        height: '12px',
        borderRadius: '6px',
        background: 'linear-gradient(to left, #D4365C 0%, #D84868 12%, #E06080 22%, #D4930D 42%, #90B040 52%, #40B870 68%, #00996B 82%, #007A55 100%)',
        overflow: 'visible',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {/* Section dividers */}
        {[20, 40, 60, 80].map(pct => (
          <div key={pct} style={{
            position: 'absolute',
            right: `${pct}%`,
            top: 0,
            height: '12px',
            width: '1px',
            background: 'rgba(255,255,255,0.2)',
          }} />
        ))}

        {/* Indicator dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: `${displayPosition}%`,
          transform: 'translate(50%, -50%)',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#fff',
          border: `3px solid ${indicatorColor}`,
          boxShadow: `0 2px 12px ${indicatorColor}60`,
          transition: animated ? 'right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: 700,
          color: indicatorColor,
        }}>
          {displayValue}
        </div>
      </div>

      {/* Scale labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px',
      }}>
        {[
          { label: t('extremeFear'), color: '#D4365C' },
          { label: t('fear'), color: '#D46080' },
          { label: t('neutral'), color: '#D4930D' },
          { label: t('greed'), color: '#40B870' },
          { label: t('extremeGreed'), color: '#00996B' },
        ].map((s, idx) => (
          <span key={idx} style={{ fontSize: '9px', fontWeight: 600, color: s.color }}>{s.label}</span>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--bull)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{t('bullish')} ({'>'}60)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{t('neutralRange')} (40-60)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--bear)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{t('bearish')} ({'<'}40)</span>
        </div>
      </div>
    </div>
  );
}
