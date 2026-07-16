// ─── InfographicChart — ECharts wrapper for infographic slides ────────
// Supports: gauge, bar, line, pie, slope, funnel, treemap charts
// Uses custom "Arabic Finance Gold" theme with RTL support
// V2: Improved gauge (bigger ring, more prominent), slope (thicker lines, end labels, animation)

'use client'

import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, GaugeChart, TreemapChart, FunnelChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { INFOGRAPHIC_THEME, getRTLBaseOptions } from '@/lib/echarts-theme'
import type { EChartsOption } from 'echarts'
import { DESIGN_TOKENS } from './types'

// V12: Unified font constants from DESIGN_TOKENS
const FONT_TITLE = DESIGN_TOKENS.fontTitle
const FONT_DATA = DESIGN_TOKENS.fontData
const FONT_LABEL = DESIGN_TOKENS.fontBody

// Register required components
echarts.use([
  BarChart, LineChart, PieChart, GaugeChart, TreemapChart, FunnelChart, ScatterChart,
  GridComponent, TooltipComponent, LegendComponent, TitleComponent, DataZoomComponent,
  CanvasRenderer,
])

// ─── Chart Config Types ────────────────────────────────────
export interface ChartConfig {
  type: 'gauge' | 'bar' | 'line' | 'pie' | 'slope' | 'funnel' | 'treemap';
  // Gauge
  value?: number;
  max?: number;
  unit?: string;
  label?: string;
  // Bar
  categories?: string[];
  values?: number[];
  orientation?: 'horizontal' | 'vertical';
  colors?: string[];
  // Line
  labels?: string[];
  series?: { name: string; data: number[]; color?: string }[];
  // Pie
  data?: { name: string; value: number; color?: string }[];
  // Slope
  leftLabel?: string;
  rightLabel?: string;
  items?: { name: string; leftValue: number; rightValue: number; color?: string }[];
}

interface InfographicChartProps {
  config: ChartConfig
  height?: number | string
  className?: string
}

export function InfographicChart({ config, height = 250, className = '' }: InfographicChartProps) {
  const option = buildChartOption(config)

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme={INFOGRAPHIC_THEME as any}
        style={{ height: '100%', width: '100%' }}
        notMerge={true}
        lazyUpdate={true}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}

function buildChartOption(config: ChartConfig): EChartsOption {
  const base = getRTLBaseOptions()

  switch (config.type) {
    case 'gauge':
      return buildGaugeOption(config, base)
    case 'bar':
      return buildBarOption(config, base)
    case 'line':
      return buildLineOption(config, base)
    case 'pie':
      return buildPieOption(config, base)
    case 'slope':
      return buildSlopeOption(config, base)
    case 'funnel':
      return buildFunnelOption(config, base)
    case 'treemap':
      return buildTreemapOption(config, base)
    default:
      return base
  }
}

function buildGaugeOption(config: ChartConfig, base: Partial<EChartsOption>): EChartsOption {
  const val = config.value || 0
  const max = config.max || 100
  const percent = (val / max) * 100
  // V10: Three-zone color thresholds
  const color = percent > 70 ? '#EF4444' : percent > 40 ? '#F59E0B' : '#10B981'

  return {
    ...base,
    series: [{
      type: 'gauge',
      // V14: Centered in its container — side-by-side layout handles spacing
      center: ['50%', '50%'],
      // V14: Compact radius for side-by-side layout
      radius: '85%',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max,
      progress: {
        show: true,
        width: 14,
        itemStyle: {
          color: color,
        },
      },
      axisLine: {
        lineStyle: {
          width: 18,
          color: [[1, 'rgba(42, 74, 108, 0.2)']] as any,
        },
      },
      axisTick: { show: false },
      splitLine: {
        show: true,
        length: 8,
        lineStyle: {
          width: 2,
          color: 'rgba(255,255,255,0.08)',
        },
      },
      splitNumber: 3,
      axisLabel: {
        show: false,
      },
      pointer: {
        show: true,
        length: '40%',
        width: 3,
        itemStyle: { color },
      },
      anchor: {
        show: true,
        size: 8,
        itemStyle: {
          color: '#0A1628',
          borderColor: color,
          borderWidth: 2,
        },
      },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        fontFamily: FONT_DATA,
        fontWeight: 700 as const,
        color: DESIGN_TOKENS.textPrimary,
        offsetCenter: [0, '40%'],
        formatter: `{value}${config.unit || ''}`,
        textShadowColor: color + '20',
        textShadowBlur: 8,
      },
      data: [{ value: val, name: config.label || '' }],
      animationDuration: 1800,
      animationEasingUpdate: 'cubicOut',
    }],
  }
}

function buildBarOption(config: ChartConfig, base: Partial<EChartsOption>): EChartsOption {
  const isHorizontal = config.orientation === 'horizontal'
  const colors = config.colors && config.colors.length > 0 ? config.colors : INFOGRAPHIC_THEME.color
  const categories = config.categories || []
  const values = config.values || []

  return {
    ...base,
    grid: {
      left: '15%',
      right: '15%',
      top: '8%',
      bottom: '8%',
      containLabel: true,
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    [isHorizontal ? 'yAxis' : 'xAxis']: {
      type: 'category',
      data: categories,
      inverse: isHorizontal,
      axisLabel: {
        color: DESIGN_TOKENS.textPrimary,
        fontFamily: FONT_LABEL,
        fontSize: 13,
        fontWeight: 'bold',
      },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false },
    },
    [isHorizontal ? 'xAxis' : 'yAxis']: {
      type: 'value',
      axisLabel: {
        color: DESIGN_TOKENS.textMuted,
        fontSize: 10,
        fontFamily: FONT_DATA,
      },
      splitLine: { lineStyle: { color: DESIGN_TOKENS.borderSubtle, type: 'dashed' } },
    },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: {
          // V12: Solid color instead of LinearGradient (fails in ECharts 6)
          color: colors[i % colors.length],
          borderRadius: isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
          shadowColor: colors[i % colors.length] + '20',
          shadowBlur: 6,
        },
      })),
      barWidth: '50%',
      barGap: '30%',
      label: {
        show: true,
        position: isHorizontal ? 'right' : 'top',
        color: DESIGN_TOKENS.textPrimary,
        fontFamily: FONT_DATA,
        fontSize: 13,
        fontWeight: 'bold',
        formatter: `{c}${config.unit || ''}`,
      },
      // V10: Staggered animation — bars appear one by one
      animationDuration: 1200,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 150,
    }],
  }
}

function buildLineOption(config: ChartConfig, base: Partial<EChartsOption>): EChartsOption {
  return {
    ...base,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: config.labels || [],
      axisLabel: { color: DESIGN_TOKENS.textSecondary, fontFamily: FONT_LABEL, fontSize: 11 },
      axisLine: { lineStyle: { color: DESIGN_TOKENS.borderSubtle } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: DESIGN_TOKENS.textMuted, fontFamily: FONT_DATA, fontSize: 10 },
      splitLine: { lineStyle: { color: DESIGN_TOKENS.borderSubtle, type: 'dashed' } },
    },
    series: (config.series || []).map((s, sIdx) => {
      const lineColor = s.color || INFOGRAPHIC_THEME.color[sIdx % INFOGRAPHIC_THEME.color.length];
      return {
        type: 'line',
        name: s.name,
        data: s.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: lineColor, shadowColor: lineColor + '30', shadowBlur: 8 },
        itemStyle: { color: lineColor, borderColor: DESIGN_TOKENS.bgDeep, borderWidth: 2 },
        // V12: Solid area fill instead of LinearGradient (fails in ECharts 6)
        areaStyle: {
          color: lineColor + '15',
        },
        label: {
          show: true,
          color: DESIGN_TOKENS.textPrimary,
          fontFamily: FONT_DATA,
          fontSize: 11,
          fontWeight: 'bold',
        },
        animationDuration: 1500,
        animationDelay: sIdx * 200,
      };
    }),
  }
}

function buildPieOption(config: ChartConfig, base: Partial<EChartsOption>): EChartsOption {
  const total = (config.data || []).reduce((sum, d) => sum + d.value, 0);
  return {
    ...base,
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#0A1628',
        borderWidth: 3,
      },
      // V10: Hover emphasis
      emphasis: {
        scaleSize: 8,
        itemStyle: {
          shadowBlur: 16,
          shadowColor: 'rgba(0,0,0,0.4)',
        },
        label: {
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      label: {
        color: DESIGN_TOKENS.textPrimary,
        fontFamily: FONT_LABEL,
        fontSize: 12,
        fontWeight: 'bold',
      },
      data: (config.data || []).map((d, i) => ({
        ...d,
        itemStyle: { color: d.color || INFOGRAPHIC_THEME.color[i % INFOGRAPHIC_THEME.color.length] },
      })),
      animationDuration: 1500,
      animationEasing: 'cubicOut',
    },
    // V10: Center label showing total
    {
      type: 'pie',
      radius: ['0%', '0%'],
      center: ['50%', '50%'],
      silent: true,
      label: {
        show: true,
        position: 'center',
        formatter: `{total|${total}}\n{label|المجموع}`,
        rich: {
          total: {
            fontSize: 28,
            fontWeight: 700 as const,
            fontFamily: FONT_DATA,
            color: DESIGN_TOKENS.textPrimary,
            lineHeight: 32,
          },
          label: {
            fontSize: 11,
            fontFamily: FONT_LABEL,
            color: DESIGN_TOKENS.textSecondary,
            lineHeight: 18,
          },
        },
      },
      data: [{ value: 0 }],
      animationDuration: 0,
    } as any],
  }
}

function buildSlopeOption(config: ChartConfig, base: Partial<EChartsOption>): EChartsOption {
  const items = config.items || [];

  return {
    ...base,
    grid: {
      left: '18%',
      right: '18%',
      top: '12%',
      bottom: '12%',
      containLabel: true,
    },
    tooltip: { trigger: 'item' },
    xAxis: {
      type: 'category',
      data: [config.leftLabel || 'الحالي', config.rightLabel || 'المتوقع'],
      axisLabel: {
        color: DESIGN_TOKENS.textPrimary,
        fontFamily: FONT_LABEL,
        fontSize: 13,
        fontWeight: 'bold',
      },
      axisLine: {
        lineStyle: { color: 'rgba(255,255,255,0.15)' },
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      show: false,
    },
    animationDuration: 1500,
    animationEasing: 'cubicOut',
    series: items.map((item) => {
      const lineColor = item.color || '#D4AF37';
      const isUp = item.rightValue > item.leftValue;
      return {
        type: 'line',
        name: item.name,
        data: [item.leftValue, item.rightValue],
        symbol: 'circle',
        symbolSize: 14,
        lineStyle: {
          width: 4,
          color: lineColor,
          shadowColor: lineColor + '60',
          shadowBlur: 10,
        },
        itemStyle: {
          color: lineColor,
          borderColor: '#0A1628',
          borderWidth: 3,
        },
        label: {
          show: true,
          color: DESIGN_TOKENS.textPrimary,
          fontFamily: FONT_LABEL,
          fontSize: 12,
          fontWeight: 'bold',
          formatter: (params: any) => {
            if (params.dataIndex === 0) {
              return `${item.name}`;
            }
            return `${params.value}`;
          },
        },
        endLabel: {
          show: true,
          formatter: () => {
            const diff = item.rightValue - item.leftValue;
            const pct = item.leftValue !== 0 ? ((diff / Math.abs(item.leftValue)) * 100).toFixed(1) : '0';
            const arrow = isUp ? '↑' : '↓';
            return `${arrow} ${Math.abs(parseFloat(pct))}%`;
          },
          color: lineColor,
          fontFamily: FONT_DATA,
          fontSize: 13,
          fontWeight: 'bold',
        },
        animationDuration: 1500,
        animationDelay: 0,
      };
    }),
  }
}

function buildFunnelOption(config: ChartConfig, base: Partial<EChartsOption>): EChartsOption {
  return {
    ...base,
    grid: {
      left: '5%',
      right: '5%',
      top: '5%',
      bottom: '5%',
      containLabel: true,
    },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'funnel',
      left: '10%',
      right: '10%',
      top: 10,
      bottom: 10,
      width: '80%',
      sort: 'descending',
      gap: 6,
      label: {
        show: true,
        position: 'inside',
        color: DESIGN_TOKENS.textPrimary,
        fontFamily: FONT_LABEL,
        fontSize: 13,
        fontWeight: 'bold',
      },
      labelLine: {
        show: true,
        lineStyle: { color: 'rgba(255,255,255,0.3)' },
      },
      itemStyle: {
        borderColor: DESIGN_TOKENS.bgDeep,
        borderWidth: 3,
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowBlur: 8,
      },
      emphasis: {
        label: {
          fontSize: 15,
        },
      },
      data: (config.data || []).map((d, i) => ({
        ...d,
        itemStyle: { color: d.color || INFOGRAPHIC_THEME.color[i % INFOGRAPHIC_THEME.color.length] },
      })),
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 100,
    }],
  }
}

function buildTreemapOption(config: ChartConfig, base: Partial<EChartsOption>): EChartsOption {
  return {
    ...base,
    grid: {
      left: '3%',
      right: '3%',
      top: '3%',
      bottom: '3%',
    },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'treemap',
      width: '95%',
      height: '90%',
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: {
        show: true,
        color: DESIGN_TOKENS.textPrimary,
        fontFamily: FONT_LABEL,
        fontSize: 13,
        fontWeight: 'bold',
      },
      upperLabel: {
        show: true,
        height: 28,
        color: DESIGN_TOKENS.textPrimary,
        fontFamily: FONT_LABEL,
        fontSize: 12,
        fontWeight: 'bold',
      },
      itemStyle: {
        borderColor: DESIGN_TOKENS.bgDeep,
        borderWidth: 4,
        gapWidth: 4,
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowBlur: 6,
      },
      emphasis: {
        label: {
          fontSize: 15,
        },
      },
      data: (config.data || []).map((d, i) => ({
        ...d,
        itemStyle: { color: d.color || INFOGRAPHIC_THEME.color[i % INFOGRAPHIC_THEME.color.length] },
      })),
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      animationDelay: 0,
    }] as any,
  }
}

// ─── Helper: Build chart config from slide data ────────────
// Generates chart configurations based on slide type and content
export function buildSlideChartConfig(slide: any): ChartConfig | null {
  const c = slide.content || {};
  const type = slide.type;

  switch (type) {
    case 'hero': {
      // Gauge chart for hero slide
      const heroNum = parseFloat(c.heroNumber || slide.heroNumber || '0');
      if (isNaN(heroNum) || heroNum === 0) return null;
      const max = heroNum > 100 ? heroNum * 1.5 : 100;
      return {
        type: 'gauge',
        value: heroNum,
        max,
        unit: c.heroUnit || slide.heroUnit || '',
        label: c.tag || '',
      };
    }

    case 'data': {
      // Horizontal bar chart for data indicators
      const indicators = c.indicators || [];
      if (indicators.length === 0) return null;
      const categories = indicators.map((ind: any) => ind.symbol || ind.name);
      const values = indicators.map((ind: any) => {
        const num = parseFloat(String(ind.value || '0').replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : Math.abs(num);
      });
      const colors = indicators.map((ind: any) =>
        ind.direction === 'up' ? '#10B981' : ind.direction === 'down' ? '#EF4444' : '#3B82F6'
      );
      return {
        type: 'bar',
        orientation: 'horizontal',
        categories,
        values,
        colors,
      };
    }

    case 'scenarios': {
      // Slope chart for scenarios
      const scenarios = c.scenarios || [];
      if (scenarios.length === 0) return null;
      const items = scenarios.map((s: any) => {
        const priceNum = parseFloat(String(s.price || '0').replace(/[^0-9.-]/g, ''));
        const currentNum = priceNum > 0 ? priceNum * (s.type === 'optimistic' ? 0.85 : s.type === 'pessimistic' ? 1.15 : 1) : 50;
        return {
          name: s.name || '',
          leftValue: currentNum,
          rightValue: priceNum || currentNum,
          color: s.type === 'optimistic' ? '#10B981' : s.type === 'pessimistic' ? '#EF4444' : '#F59E0B',
        };
      });
      return {
        type: 'slope',
        leftLabel: 'الحالي',
        rightLabel: 'المتوقع',
        items,
      };
    }

    case 'assets': {
      // V10: Treemap for assets — use expected_move for sizing
      const benefiting = c.benefiting || [];
      const harmed = c.harmed || [];
      if (benefiting.length === 0 && harmed.length === 0) return null;
      const parseMove = (move?: string | null) => {
        if (!move) return 50; // default size
        const num = parseFloat(String(move).replace(/[^0-9.]/g, ''));
        return isNaN(num) || num === 0 ? 50 : Math.max(20, Math.min(200, num * 10));
      };
      const data = [
        ...benefiting.map((a: any) => ({
          name: `${a.name}${a.symbol ? ` (${a.symbol})` : ''}`,
          value: parseMove(a.expected_move),
          color: '#10B981',
        })),
        ...harmed.map((a: any) => ({
          name: `${a.name}${a.symbol ? ` (${a.symbol})` : ''}`,
          value: parseMove(a.expected_move),
          color: '#EF4444',
        })),
      ];
      return { type: 'treemap', data };
    }

    case 'recommendations': {
      // Funnel chart for recommendations
      const recs = c.recommendations || {};
      const funnelData: { name: string; value: number; color?: string }[] = [];
      if (recs.daily) funnelData.push({ name: recs.daily.asset || 'يومي', value: 100, color: '#D4AF37' });
      if (recs.medium) funnelData.push({ name: recs.medium.asset || 'متوسط', value: 70, color: '#00BCD4' });
      if (recs.long) funnelData.push({ name: recs.long.asset || 'طويل', value: 40, color: '#3B82F6' });
      if (funnelData.length === 0) return null;
      return { type: 'funnel', data: funnelData };
    }

    default:
      return null;
  }
}
