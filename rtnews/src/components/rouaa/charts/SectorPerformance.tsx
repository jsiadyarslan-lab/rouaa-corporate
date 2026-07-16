'use client';

import { useMemo } from 'react';

interface SectorPerformanceProps {
  data: {
    sector: string;
    change: number;
    label: string;
  }[];
}

export default function SectorPerformance({ data }: SectorPerformanceProps) {
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => b.change - a.change);
  }, [data]);

  const maxAbsChange = useMemo(() => {
    if (sortedData.length === 0) return 1;
    return Math.max(...sortedData.map(d => Math.abs(d.change)), 1);
  }, [sortedData]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
          لا توجد بيانات كافية
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedData.map(item => {
        const isPositive = item.change >= 0;
        const barWidth = (Math.abs(item.change) / maxAbsChange) * 100;
        const barColor = isPositive ? 'var(--bull)' : 'var(--bear)';
        const barBg = isPositive ? 'var(--bull2)' : 'var(--bear2)';

        return (
          <div key={item.sector} className="flex items-center gap-3">
            {/* Label */}
            <div
              className="text-[12px] font-bold text-right truncate"
              style={{ color: 'var(--text)', minWidth: '80px', maxWidth: '100px' }}
            >
              {item.label || item.sector}
            </div>

            {/* Bar container */}
            <div className="flex-1 relative" style={{ height: '20px' }}>
              {/* Center line */}
              <div
                className="absolute top-0 bottom-0"
                style={{
                  right: '50%',
                  width: '1px',
                  background: 'var(--border)',
                }}
              />
              {/* Bar */}
              <div
                className="absolute top-1 bottom-1 rounded-sm transition-all duration-700"
                style={{
                  [isPositive ? 'left' : 'right']: '50%',
                  width: `${barWidth / 2}%`,
                  background: barBg,
                  border: `1px solid ${barColor}40`,
                }}
              >
                <div
                  className="absolute inset-y-0 rounded-sm"
                  style={{
                    [isPositive ? 'right' : 'left']: 0,
                    width: '40%',
                    background: barColor,
                    opacity: 0.6,
                    borderRadius: isPositive ? '3px 0 0 3px' : '0 3px 3px 0',
                  }}
                />
              </div>
            </div>

            {/* Value */}
            <div
              className="font-mono-price text-[12px] font-bold text-left"
              style={{
                color: barColor,
                minWidth: '60px',
              }}
            >
              {isPositive ? '+' : ''}
              {item.change.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
