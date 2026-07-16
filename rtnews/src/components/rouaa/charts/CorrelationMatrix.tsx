'use client';

import { useMemo, Fragment } from 'react';

interface CorrelationMatrixProps {
  assets: string[];
  labels: string[];
  correlations: number[][];
}

function getCorrelationColor(val: number): { bg: string; text: string } {
  if (val >= 0.7) return { bg: 'rgba(34,197,94,0.3)', text: 'var(--bull)' };
  if (val >= 0.3) return { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' };
  if (val >= -0.3) return { bg: 'rgba(255,255,255,0.04)', text: 'var(--text3)' };
  if (val >= -0.7) return { bg: 'rgba(239,83,80,0.15)', text: '#EF5350' };
  return { bg: 'rgba(239,83,80,0.3)', text: 'var(--bear)' };
}

export default function CorrelationMatrix({
  assets,
  labels,
  correlations,
}: CorrelationMatrixProps) {
  const matrixData = useMemo(() => {
    if (!correlations || correlations.length === 0) return [];
    return correlations.map((row, i) =>
      row.map((val, j) => ({
        value: val,
        ...getCorrelationColor(val),
        rowLabel: labels[i] || assets[i],
        colLabel: labels[j] || assets[j],
      }))
    );
  }, [assets, labels, correlations]);

  if (!correlations || correlations.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-[12px]" style={{ color: 'var(--text3)' }}>
          لا توجد بيانات كافية
        </span>
      </div>
    );
  }

  const cellSize = Math.min(50, Math.max(30, 300 / assets.length));

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateColumns: `auto repeat(${assets.length}, ${cellSize}px)`,
        }}
      >
        {/* Top-left empty cell */}
        <div style={{ width: '60px' }} />

        {/* Column headers */}
        {labels.map((label, i) => (
          <div
            key={`col-${i}`}
            className="text-[9px] font-bold text-center truncate px-0.5"
            style={{
              color: 'var(--text3)',
              height: cellSize,
              writingMode: assets.length > 6 ? 'vertical-rl' : undefined,
              transform: assets.length > 6 ? 'rotate(180deg)' : undefined,
              lineHeight: '1.2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {label}
          </div>
        ))}

        {/* Rows */}
        {matrixData.map((row, i) => (
          <Fragment key={`row-${i}`}>
            {/* Row label */}
            <div
              className="text-[10px] font-bold flex items-center justify-end truncate px-1"
              style={{ color: 'var(--text3)', height: cellSize }}
            >
              {labels[i] || assets[i]}
            </div>
            {/* Cells */}
            {row.map((cell, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="rounded-sm flex items-center justify-center transition-all duration-300"
                style={{
                  background: cell.bg,
                  border: i === j ? '1px solid var(--cyan2)' : '1px solid transparent',
                  width: cellSize,
                  height: cellSize,
                }}
                title={`${cell.rowLabel} × ${cell.colLabel}: ${cell.value.toFixed(2)}`}
              >
                <span
                  className="font-mono-price text-[9px] font-bold"
                  style={{ color: cell.text }}
                >
                  {i === j ? '1.0' : cell.value.toFixed(1)}
                </span>
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'rgba(34,197,94,0.3)' }}
          />
          <span className="text-[9px]" style={{ color: 'var(--text3)' }}>
            ارتباط إيجابي
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
          <span className="text-[9px]" style={{ color: 'var(--text3)' }}>
            لا ارتباط
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'rgba(239,83,80,0.3)' }}
          />
          <span className="text-[9px]" style={{ color: 'var(--text3)' }}>
            ارتباط سلبي
          </span>
        </div>
      </div>
    </div>
  );
}
