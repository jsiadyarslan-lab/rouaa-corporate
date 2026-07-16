// ─── Custom ECharts Theme for Arabic Finance Infographics ──────────
// V12 design system — only 5 functional colors, matching DESIGN_TOKENS
// RTL-aware base options for all infographic charts
// Key fix: No LinearGradient (fails silently in ECharts 6)

import type { EChartsOption } from 'echarts'

// V212: CSS variable first (next/font/google), literal name second (Google Fonts CDN <link>), Cairo third
const FONT_TITLE = "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif"
const FONT_DATA = "var(--font-jetbrains-mono), 'Inter', monospace"
const FONT_LABEL = "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif"

// V12: Only 5 functional colors — matching DESIGN_TOKENS exactly
export const INFOGRAPHIC_THEME = {
  color: [
    '#D4AF37', // Gold (primary — most used)
    '#10B981', // Emerald green (positive)
    '#EF4444', // Coral red (negative)
    '#3B82F6', // Electric blue (info)
    '#F59E0B', // Amber (warning)
  ],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#F9FAFB',
    fontFamily: FONT_TITLE,
  },
  title: {
    textStyle: {
      color: '#F9FAFB',
      fontFamily: FONT_TITLE,
      fontWeight: 'bold' as const,
    },
    subtextStyle: {
      color: '#9CA3AF',
      fontFamily: FONT_LABEL,
    },
  },
  legend: {
    textStyle: {
      color: '#9CA3AF',
      fontFamily: FONT_LABEL,
    },
  },
  tooltip: {
    backgroundColor: 'rgba(10, 14, 26, 0.95)',
    borderColor: 'rgba(59,130,246,0.2)',
    textStyle: {
      color: '#F9FAFB',
      fontFamily: FONT_LABEL,
    },
  },
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: 'rgba(156,163,175,0.12)' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#9CA3AF',
      fontFamily: FONT_LABEL,
      fontSize: 12,
    },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#9CA3AF',
      fontFamily: FONT_DATA,
      fontSize: 11,
    },
    splitLine: {
      lineStyle: { color: 'rgba(156,163,175,0.06)', type: 'dashed' as const },
    },
  },
}

// RTL-aware base options
export function getRTLBaseOptions(): Partial<EChartsOption> {
  return {
    grid: {
      left: '3%',
      right: '12%',
      top: '12%',
      bottom: '8%',
      containLabel: true,
    },
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
  }
}
