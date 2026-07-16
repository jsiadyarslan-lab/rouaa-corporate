'use client';

import { useMemo } from 'react';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showArea?: boolean;
}

export default function MiniSparkline({
  data,
  color,
  width = 60,
  height = 20,
  showArea = false,
}: MiniSparklineProps) {
  const strokeColor = color || 'var(--cyan)';  // Default to brand color

  const pathData = useMemo(() => {
    if (!data || data.length < 2) return { line: '', area: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 1;

    const points = data.map((v, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - (v - min) / range) * (height - padding * 2),
    }));

    const line = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
      .join(' ');

    const area =
      line +
      ` L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

    return { line, area };
  }, [data, width, height]);

  if (!data || data.length < 2) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
      role="img"
      aria-label="اتجاه المؤشر"
    >
      {showArea && pathData.area && (
        <defs>
          <linearGradient id={`spark-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {showArea && pathData.area && (
        <path
          d={pathData.area}
          fill={`url(#spark-grad-${color})`}
        />
      )}
      <path
        d={pathData.line}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
