'use client';

import { useMemo } from 'react';
import { getRiskColor, getRiskLabel } from '@/lib/geopolitical/risk-thresholds';

interface RiskScoreGaugeProps {
  score: number;
  locale?: string;
  size?: number;
}

export default function RiskScoreGauge({ score, locale = 'ar', size = 180 }: RiskScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = getRiskColor(clampedScore);
  const label = getRiskLabel(clampedScore, locale);

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progressOffset = useMemo(() => {
    const progress = clampedScore / 100;
    return circumference * (1 - progress * 0.75);
  }, [clampedScore, circumference]);

  const startAngle = 135;
  const endAngle = 405;
  const arcLength = endAngle - startAngle;
  const dashArray = (arcLength / 360) * circumference;

  const isRtl = locale === 'ar';

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-0"
      >
        {/* Background track arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--bg4)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(${startAngle} ${center} ${center})`}
        />

        {/* Foreground progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeDashoffset={progressOffset}
          transform={`rotate(${startAngle} ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
            filter: `drop-shadow(0 0 6px ${color}66)`,
          }}
        />

        {/* Tick marks */}
        {Array.from({ length: 11 }, (_, i) => {
          const angle = startAngle + (arcLength * i) / 10;
          const rad = (angle * Math.PI) / 180;
          const innerR = radius - strokeWidth / 2 - 4;
          const outerR = radius - strokeWidth / 2 - 10;
          const x1 = center + innerR * Math.cos(rad);
          const y1 = center + innerR * Math.sin(rad);
          const x2 = center + outerR * Math.cos(rad);
          const y2 = center + outerR * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--text3)"
              strokeWidth={i % 5 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{
            color: 'var(--text-head)',
            fontSize: size * 0.22,
          }}
        >
          {clampedScore}
        </span>
        <span
          className="mt-1 font-semibold uppercase tracking-wider"
          style={{
            color: color,
            fontSize: size * 0.08,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
