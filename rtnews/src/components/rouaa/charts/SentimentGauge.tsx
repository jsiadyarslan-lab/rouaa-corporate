'use client';

import { useMemo } from 'react';

interface SentimentGaugeProps {
  value: number;
  size?: number;
}

function getZoneColor(val: number): string {
  if (val < 20) return '#D4365C';
  if (val < 40) return '#D4930D';
  if (val < 60) return '#D4930D';
  if (val < 80) return '#00996B';
  return '#00996B';
}

function getZoneLabel(val: number): string {
  if (val < 20) return 'خوف شديد';
  if (val < 40) return 'خوف';
  if (val < 60) return 'محايد';
  if (val < 80) return 'جشع';
  return 'جشع شديد';
}

export default function SentimentGauge({ value, size = 200 }: SentimentGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const color = useMemo(() => getZoneColor(clampedValue), [clampedValue]);
  const label = useMemo(() => getZoneLabel(clampedValue), [clampedValue]);

  return (
    <div
      style={{ width: size }}
      role="meter"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`مؤشر المشاعر: ${label}`}
    >
      {/* Header with score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-head)' }}>
          مقياس المشاعر السوقية
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1, color }}>
            {Math.round(clampedValue)}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 700, color }}>
            {label}
          </span>
        </div>
      </div>

      {/* Gradient bar */}
      <div style={{
        position: 'relative',
        height: '12px',
        borderRadius: '6px',
        background: 'linear-gradient(to left, #D4365C 0%, #D84868 12%, #E06080 22%, #D4930D 42%, #90B040 52%, #40B870 68%, #00996B 82%, #007A55 100%)',
        overflow: 'visible',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {/* Section dividers */}
        {[20, 40, 60, 80].map(mark => (
          <div key={mark} style={{
            position: 'absolute',
            right: `${mark}%`,
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
          right: `${clampedValue}%`,
          transform: 'translate(50%, -50%)',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#fff',
          border: `3px solid ${color}`,
          boxShadow: `0 2px 12px ${color}60`,
          transition: 'right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: 700,
          color,
        }}>
          {Math.round(clampedValue)}
        </div>
      </div>

      {/* Scale labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        {[
          { label: 'خوف شديد', color: '#D4365C' },
          { label: 'خوف', color: '#D46080' },
          { label: 'محايد', color: '#D4930D' },
          { label: 'جشع', color: '#40B870' },
          { label: 'جشع شديد', color: '#00996B' },
        ].map((s, idx) => (
          <span key={idx} style={{ fontSize: '9px', fontWeight: 600, color: s.color }}>{s.label}</span>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--bull)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>صعودي ({'>'}60)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>محايد (40-60)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--bear)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>هبوطي ({'<'}40)</span>
        </div>
      </div>
    </div>
  );
}
