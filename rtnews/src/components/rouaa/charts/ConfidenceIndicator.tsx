'use client';

import { useMemo } from 'react';

interface ConfidenceIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

const SIZE_MAP = {
  sm: { svg: 40, stroke: 4, fontSize: '12px', labelSize: '8px' },
  md: { svg: 64, stroke: 5, fontSize: '16px', labelSize: '9px' },
  lg: { svg: 96, stroke: 6, fontSize: '22px', labelSize: '10px' },
};

function getScoreColor(score: number): string {
  if (score < 40) return '#EF4444';
  if (score < 60) return '#F97316';
  if (score < 80) return '#84CC16';
  return 'var(--bull)';
}

function getScoreLabel(score: number, locale?: string): string {
  if (locale === 'en') {
    if (score < 40) return 'Low';
    if (score < 60) return 'Medium';
    if (score < 80) return 'Good';
    return 'Excellent';
  }
  if (locale === 'fr') {
    if (score < 40) return 'Faible';
    if (score < 60) return 'Moyen';
    if (score < 80) return 'Bon';
    return 'Excellent';
  }
  if (locale === 'tr') {
    if (score < 40) return 'Düşük';
    if (score < 60) return 'Orta';
    if (score < 80) return 'İyi';
    return 'Mükemmel';
  }
  if (locale === 'es') {
    if (score < 40) return 'Bajo';
    if (score < 60) return 'Medio';
    if (score < 80) return 'Bueno';
    return 'Excelente';
  }
  if (score < 40) return 'منخفض';
  if (score < 60) return 'متوسط';
  if (score < 80) return 'جيد';
  return 'ممتاز';
}

export default function ConfidenceIndicator({
  score,
  size = 'md',
  showLabel = true,
  locale,
}: ConfidenceIndicatorProps) {
  const config = SIZE_MAP[size];
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = useMemo(() => getScoreColor(clampedScore), [clampedScore]);
  const label = useMemo(() => getScoreLabel(clampedScore, locale), [clampedScore, locale]);

  const radius = (config.svg - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clampedScore / 100) * circumference;
  const center = config.svg / 2;

  return (
    <div
      className="flex flex-col items-center"
      role="meter"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={locale === 'en' ? `Confidence: ${clampedScore}% - ${label}` : locale === 'fr' ? `Confiance: ${clampedScore}% - ${label}` : locale === 'tr' ? `Güven: ${clampedScore}% - ${label}` : locale === 'es' ? `Confianza: ${clampedScore}% - ${label}` : `مستوى الثقة: ${clampedScore}% - ${label}`}
    >
      <div className="relative" style={{ width: config.svg, height: config.svg }}>
        <svg
          width={config.svg}
          height={config.svg}
          viewBox={`0 0 ${config.svg} ${config.svg}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--bg5)"
            strokeWidth={config.stroke}
          />
          {/* Filled arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            style={{
              transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 4px ${color}30)`,
            }}
          />
        </svg>

        {/* Center text - overlaid */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            className="font-mono-price font-bold"
            style={{ color, fontSize: config.fontSize }}
          >
            {Math.round(clampedScore)}
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          className="font-bold mt-1"
          style={{ color, fontSize: config.labelSize }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
