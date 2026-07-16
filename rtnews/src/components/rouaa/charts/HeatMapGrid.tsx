'use client';

import { useMemo } from 'react';

interface HeatMapGridProps {
  data: {
    category: string;
    count: number;
    avgSentiment: number;
    label: string;
  }[];
  onCategoryClick?: (category: string) => void;
}

export default function HeatMapGrid({ data, onCategoryClick }: HeatMapGridProps) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => {
      const isBullish = item.avgSentiment >= 50;
      const intensity = Math.abs(item.avgSentiment - 50) / 50; // 0 to 1

      let bg: string;
      let border: string;
      let textColor: string;

      if (item.avgSentiment >= 60) {
        // Bullish
        bg = `rgba(34,197,94,${0.06 + intensity * 0.18})`;
        border = `rgba(34,197,94,${0.15 + intensity * 0.15})`;
        textColor = 'var(--bull)';
      } else if (item.avgSentiment >= 40) {
        // Neutral
        bg = `rgba(212,160,23,${0.04 + (1 - intensity) * 0.08})`;
        border = `rgba(212,160,23,${0.1 + (1 - intensity) * 0.1})`;
        textColor = 'var(--gold)';
      } else {
        // Bearish
        bg = `rgba(239,83,80,${0.06 + intensity * 0.18})`;
        border = `rgba(239,83,80,${0.15 + intensity * 0.15})`;
        textColor = 'var(--bear)';
      }

      return {
        ...item,
        isBullish,
        bg,
        border,
        textColor,
        intensity,
      };
    });
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
          لا توجد بيانات كافية حالياً
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
      {processedData.map(item => (
        <div
          key={item.category}
          className="rounded-lg p-3 text-center transition-all duration-300 cursor-pointer hover:scale-105"
          style={{
            background: item.bg,
            border: `1px solid ${item.border}`,
          }}
          onClick={() => onCategoryClick?.(item.category)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCategoryClick?.(item.category);
            }
          }}
          aria-label={`${item.label || item.category}: مشاعر ${item.avgSentiment}`}
        >
          <div
            className="text-[11px] font-bold mb-1 truncate"
            style={{ color: 'var(--text)' }}
          >
            {item.label || item.category}
          </div>
          <div
            className="font-mono-price text-sm font-bold"
            style={{ color: item.textColor }}
          >
            {item.avgSentiment}
          </div>
          <div className="text-[9px]" style={{ color: 'var(--text3)' }}>
            {item.count} خبر
          </div>
        </div>
      ))}
    </div>
  );
}
