// ═══════════════════════════════════════════════════════════════
// ⚠️  DEPRECATED — THIS FILE IS NOT USED IN PRODUCTION
// ═══════════════════════════════════════════════════════════════
// Replaced by Playwright-based renderers in scripts/video-renderer*.mjs
// No code imports this module. Kept for reference only.
// ═══════════════════════════════════════════════════════════════

// ─── Professional Chart Renderer for Video Engine (DEPRECATED) ─
// Renders ECharts candlestick charts to PNG images using @napi-rs/canvas
// No browser/Chromium needed — pure Node.js + Rust canvas
// Produces Bloomberg/TradingView-quality chart frames for video

import { createCanvas } from '@napi-rs/canvas';
import type { HistoricalPoint } from '../financial-apis';

// ─── Types ──────────────────────────────────────────────────

export interface ChartRenderOptions {
  width: number;
  height: number;
  symbol: string;
  assetName: string;
  locale: 'ar' | 'en' | 'fr';
  theme: 'dark' | 'light';
  showVolume: boolean;
  showMA: boolean;
  showBollinger: boolean;
  /** Number of data points to reveal (for animation) */
  visiblePoints: number;
  /** Current price for highlight */
  currentPrice?: number;
  /** Price change percent */
  changePercent?: number;
  /** Background color override */
  bgColor?: string;
}

export interface ChartRenderResult {
  buffer: Buffer;
  width: number;
  height: number;
}

// ─── Color Constants (Bloomberg Dark Theme) ─────────────────

const COLORS = {
  dark: {
    bg: '#0a0e1a',
    bgGradient: '#0f1628',
    grid: 'rgba(156,163,175,0.06)',
    axisLine: 'rgba(156,163,175,0.15)',
    axisLabel: '#6b7280',
    text: '#f9fafb',
    textMuted: '#9ca3af',
    green: '#10b981',
    greenBg: 'rgba(16,185,129,0.12)',
    red: '#ef4444',
    redBg: 'rgba(239,68,68,0.12)',
    gold: '#d4af37',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    ma5: '#f59e0b',
    ma10: '#3b82f6',
    ma20: '#8b5cf6',
    bollinger: 'rgba(139,92,246,0.15)',
    volumeGreen: 'rgba(16,185,129,0.4)',
    volumeRed: 'rgba(239,68,68,0.4)',
    crosshair: 'rgba(255,255,255,0.2)',
    highlight: 'rgba(212,175,55,0.3)',
  },
  light: {
    bg: '#ffffff',
    bgGradient: '#f8fafc',
    grid: 'rgba(0,0,0,0.06)',
    axisLine: 'rgba(0,0,0,0.15)',
    axisLabel: '#6b7280',
    text: '#111827',
    textMuted: '#6b7280',
    green: '#059669',
    greenBg: 'rgba(5,150,105,0.12)',
    red: '#dc2626',
    redBg: 'rgba(220,38,38,0.12)',
    gold: '#b8960c',
    blue: '#2563eb',
    purple: '#7c3aed',
    ma5: '#d97706',
    ma10: '#2563eb',
    ma20: '#7c3aed',
    bollinger: 'rgba(124,58,237,0.12)',
    volumeGreen: 'rgba(5,150,105,0.3)',
    volumeRed: 'rgba(220,38,38,0.3)',
    crosshair: 'rgba(0,0,0,0.15)',
    highlight: 'rgba(184,150,12,0.2)',
  },
};

// ─── Technical Indicators ────────────────────────────────────

function calculateMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

function calculateBollingerBands(data: number[], period: number = 20, multiplier: number = 2): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const ma = calculateMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (ma[i] === null) { upper.push(null); lower.push(null); continue; }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) sumSq += (data[j] - ma[i]!) ** 2;
    const std = Math.sqrt(sumSq / period);
    upper.push(ma[i]! + multiplier * std);
    lower.push(ma[i]! - multiplier * std);
  }

  return { upper, middle: ma, lower };
}

// ─── Chart Rendering ────────────────────────────────────────

export function renderCandlestickChart(
  historicalData: HistoricalPoint[],
  options: Partial<ChartRenderOptions> = {}
): ChartRenderResult {
  const {
    width = 1920,
    height = 1080,
    symbol = 'AAPL',
    assetName = 'Apple Inc.',
    locale = 'en',
    theme = 'dark',
    showVolume = true,
    showMA = true,
    showBollinger = false,
    visiblePoints,
    currentPrice,
    changePercent,
    bgColor,
  } = options;

  const colors = COLORS[theme];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Slice data for animation
  const maxVisible = visiblePoints || historicalData.length;
  const data = historicalData.slice(0, maxVisible);
  if (data.length < 2) {
    // Not enough data — draw placeholder
    ctx.fillStyle = bgColor || colors.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(locale === 'ar' ? 'بيانات غير كافية' : locale === 'fr' ? 'DONNÉES INSUFFISANTES' : 'Insufficient data', width / 2, height / 2);
    return { buffer: canvas.toBuffer('image/png'), width, height };
  }

  // ─── Layout Areas ───
  const margin = { top: 80, right: 80, bottom: showVolume ? 140 : 60, left: 20 };
  const headerHeight = 70;
  const chartTop = margin.top + headerHeight;
  const chartBottom = showVolume ? height - 100 : height - margin.bottom;
  const chartHeight = chartBottom - chartTop;
  const volumeTop = chartBottom + 15;
  const volumeBottom = height - 30;
  const volumeHeight = showVolume ? volumeBottom - volumeTop : 0;
  const chartLeft = margin.left + 10;
  const chartRight = width - margin.right;
  const chartWidth = chartRight - chartLeft;

  // ─── Background ───
  // Gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, bgColor || colors.bg);
  bgGrad.addColorStop(1, bgColor || colors.bgGradient);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // ─── Price Range Calculation ───
  let minPrice = Infinity, maxPrice = -Infinity;
  let maxVolume = 0;

  const closes = data.map(d => d.close);
  const ma5 = showMA ? calculateMA(closes, 5) : [];
  const ma10 = showMA ? calculateMA(closes, 10) : [];
  const ma20 = showMA ? calculateMA(closes, 20) : [];
  const bollinger = showBollinger ? calculateBollingerBands(closes) : null;

  for (const d of data) {
    minPrice = Math.min(minPrice, d.low);
    maxPrice = Math.max(maxPrice, d.high);
    maxVolume = Math.max(maxVolume, d.volume);
  }

  // Include MA/Bollinger in range
  if (showMA) {
    for (const v of [...ma5, ...ma10, ...ma20]) {
      if (v !== null) { minPrice = Math.min(minPrice, v); maxPrice = Math.max(maxPrice, v); }
    }
  }
  if (bollinger) {
    for (const v of [...bollinger.upper, ...bollinger.lower]) {
      if (v !== null) { minPrice = Math.min(minPrice, v); maxPrice = Math.max(maxPrice, v); }
    }
  }

  // Add padding
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.08;
  minPrice -= pricePadding;
  maxPrice += pricePadding;
  if (maxVolume === 0) maxVolume = 1;

  // ─── Helper Functions ───
  const priceToY = (price: number) => chartTop + (1 - (price - minPrice) / (maxPrice - minPrice)) * chartHeight;
  const indexToX = (i: number) => chartLeft + (i / (data.length - 1)) * chartWidth;
  const candleWidth = Math.max(2, (chartWidth / data.length) * 0.7);
  const candleGap = (chartWidth / data.length) * 0.3;

  // ─── Grid Lines ───
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  const numGridLines = 6;
  for (let i = 0; i <= numGridLines; i++) {
    const y = chartTop + (i / numGridLines) * chartHeight;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label
    const price = maxPrice - (i / numGridLines) * (maxPrice - minPrice);
    ctx.fillStyle = colors.axisLabel;
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formatPrice(price), chartRight + 70, y + 4);
  }

  // ─── Bollinger Bands Fill ───
  if (bollinger && data.length > 20) {
    ctx.fillStyle = colors.bollinger;
    ctx.beginPath();
    let started = false;
    for (let i = 19; i < data.length; i++) {
      if (bollinger.upper[i] === null) continue;
      const x = indexToX(i);
      const y = priceToY(bollinger.upper[i]!);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    for (let i = data.length - 1; i >= 19; i--) {
      if (bollinger.lower[i] === null) continue;
      const x = indexToX(i);
      const y = priceToY(bollinger.lower[i]!);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ─── Candlesticks ───
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const x = indexToX(i);
    const isGreen = d.close >= d.open;
    const bodyColor = isGreen ? colors.green : colors.red;
    const bodyTop = priceToY(Math.max(d.open, d.close));
    const bodyBottom = priceToY(Math.min(d.open, d.close));
    const bodyH = Math.max(1, bodyBottom - bodyTop);

    // Wick (shadow)
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, priceToY(d.high));
    ctx.lineTo(x, priceToY(d.low));
    ctx.stroke();

    // Body
    if (isGreen) {
      ctx.fillStyle = bodyColor;
    } else {
      ctx.fillStyle = bodyColor;
    }
    const halfW = candleWidth / 2;
    ctx.fillRect(x - halfW, bodyTop, candleWidth, bodyH);

    // Green candle outline for clarity
    if (isGreen && candleWidth > 4) {
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x - halfW, bodyTop, candleWidth, bodyH);
    }

    // Volume bar
    if (showVolume && maxVolume > 0) {
      const volH = (d.volume / maxVolume) * volumeHeight * 0.8;
      ctx.fillStyle = isGreen ? colors.volumeGreen : colors.volumeRed;
      ctx.fillRect(x - halfW, volumeBottom - volH, candleWidth, volH);
    }
  }

  // ─── Moving Averages ───
  if (showMA) {
    const drawMA = (ma: (number | null)[], color: string, lineWidth: number = 1.5) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        if (ma[i] === null) continue;
        const x = indexToX(i);
        const y = priceToY(ma[i]!);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    drawMA(ma5, colors.ma5, 1.5);
    drawMA(ma10, colors.ma10, 1.5);
    if (data.length > 20) drawMA(ma20, colors.ma20, 1.5);
  }

  // ─── Current Price Line ───
  if (currentPrice && data.length > 0) {
    const y = priceToY(currentPrice);
    const isPositive = (changePercent ?? 0) >= 0;
    const lineColor = isPositive ? colors.green : colors.red;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label on right
    const labelW = 75;
    const labelH = 22;
    ctx.fillStyle = lineColor;
    ctx.fillRect(chartRight + 2, y - labelH / 2, labelW, labelH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatPrice(currentPrice), chartRight + 2 + labelW / 2, y + 4);
  }

  // ─── Header: Symbol, Name, Price ───
  const headerY = margin.top + 10;

  // Symbol
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(symbol, chartLeft, headerY + 28);

  // Asset name
  ctx.fillStyle = colors.textMuted;
  ctx.font = '16px sans-serif';
  ctx.fillText(assetName, chartLeft + ctx.measureText(symbol).width + 16, headerY + 28);

  // Price & change
  if (currentPrice) {
    const isPositive = (changePercent ?? 0) >= 0;
    const changeColor = isPositive ? colors.green : colors.red;
    const arrow = isPositive ? '\u25B2' : '\u25BC';

    ctx.fillStyle = colors.text;
    ctx.font = 'bold 28px monospace';
    const priceStr = formatPrice(currentPrice);
    ctx.textAlign = 'right';
    ctx.fillText(priceStr, chartRight, headerY + 26);

    if (changePercent !== undefined) {
      ctx.fillStyle = changeColor;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`${arrow} ${Math.abs(changePercent).toFixed(2)}%`, chartRight, headerY + 50);
    }
  }

  // ─── Date Labels ───
  ctx.fillStyle = colors.axisLabel;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  const labelInterval = Math.max(1, Math.floor(data.length / 8));
  for (let i = 0; i < data.length; i += labelInterval) {
    const x = indexToX(i);
    ctx.fillText(data[i].date.slice(5), x, chartBottom + 18);
  }

  // ─── MA Legend ───
  if (showMA && data.length > 5) {
    const legendX = chartLeft + 10;
    const legendY = chartTop + 18;
    const drawLegendItem = (label: string, color: string, offset: number) => {
      ctx.fillStyle = color;
      ctx.fillRect(legendX + offset, legendY - 8, 12, 3);
      ctx.fillStyle = colors.textMuted;
      ctx.font = '10px sans-serif';
      ctx.fillText(label, legendX + offset + 16, legendY);
    };
    drawLegendItem('MA5', colors.ma5, 0);
    drawLegendItem('MA10', colors.ma10, 65);
    if (data.length > 20) drawLegendItem('MA20', colors.ma20, 135);
  }

  // ─── Watermark (subtle) ───
  ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(locale === 'ar' ? 'رؤى' : locale === 'fr' ? 'ROUA' : 'ROUA', chartRight, height - 10);

  return { buffer: canvas.toBuffer('image/png'), width, height };
}

// ─── Title Card Renderer ────────────────────────────────────

export function renderTitleCard(options: {
  width: number;
  height: number;
  symbol: string;
  assetName: string;
  title: string;
  subtitle?: string;
  locale: 'ar' | 'en' | 'fr';
  theme: 'dark' | 'light';
  changePercent?: number;
  currentPrice?: number;
}): ChartRenderResult {
  const { width = 1920, height = 1080, symbol, assetName, title, subtitle, locale, theme, changePercent, currentPrice } = options;
  const colors = COLORS[theme];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background with gradient
  const grad = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.5, height * 0.5, width * 0.8);
  grad.addColorStop(0, '#1a1a3e');
  grad.addColorStop(0.5, '#0f1628');
  grad.addColorStop(1, '#0a0e1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Accent circles
  ctx.fillStyle = 'rgba(59,130,246,0.05)';
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.2, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(139,92,246,0.04)';
  ctx.beginPath();
  ctx.arc(width * 0.2, height * 0.8, 250, 0, Math.PI * 2);
  ctx.fill();

  // Gold accent line
  const lineY = height * 0.45;
  const lineGrad = ctx.createLinearGradient(width * 0.15, 0, width * 0.85, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.2, colors.gold);
  lineGrad.addColorStop(0.8, colors.gold);
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.15, lineY);
  ctx.lineTo(width * 0.85, lineY);
  ctx.stroke();

  // Symbol
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(symbol, width / 2, lineY - 60);

  // Price
  if (currentPrice) {
    const isPositive = (changePercent ?? 0) >= 0;
    ctx.fillStyle = isPositive ? colors.green : colors.red;
    ctx.font = 'bold 36px monospace';
    ctx.fillText(formatPrice(currentPrice), width / 2, lineY - 10);
  }

  // Title
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(title, width / 2, lineY + 80);

  // Subtitle / asset name
  if (subtitle || assetName) {
    ctx.fillStyle = colors.textMuted;
    ctx.font = '22px sans-serif';
    ctx.fillText(subtitle || assetName, width / 2, lineY + 120);
  }

  // Brand
  ctx.fillStyle = colors.gold;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(locale === 'ar' ? 'رؤى | ROUA' : locale === 'fr' ? 'ROUA Perspectives' : 'ROUA Insights', width / 2, height - 50);

  return { buffer: canvas.toBuffer('image/png'), width, height };
}

// ─── Indicator Card Renderer ────────────────────────────────

export function renderIndicatorCard(options: {
  width: number;
  height: number;
  symbol: string;
  indicator: string;
  value: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
  locale: 'ar' | 'en' | 'fr';
  theme: 'dark' | 'light';
}): ChartRenderResult {
  const { width = 1920, height = 1080, symbol, indicator, value, signal, description, locale, theme } = options;
  const colors = COLORS[theme];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, colors.bg);
  bgGrad.addColorStop(1, colors.bgGradient);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Signal color
  const signalColor = signal === 'bullish' ? colors.green : signal === 'bearish' ? colors.red : colors.gold;
  const signalLabel = signal === 'bullish' ? (locale === 'ar' ? 'صاعد' : locale === 'fr' ? 'HAUSSIER' : 'BULLISH')
    : signal === 'bearish' ? (locale === 'ar' ? 'هابط' : locale === 'fr' ? 'BAISSIER' : 'BEARISH')
    : (locale === 'ar' ? 'محايد' : locale === 'fr' ? 'NEUTRE' : 'NEUTRAL');

  // Left accent bar
  ctx.fillStyle = signalColor;
  ctx.fillRect(60, height * 0.25, 6, height * 0.5);

  // Indicator name
  ctx.fillStyle = colors.textMuted;
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(indicator, 90, height * 0.35);

  // Value
  ctx.fillStyle = signalColor;
  ctx.font = 'bold 64px monospace';
  ctx.fillText(value, 90, height * 0.52);

  // Signal badge
  ctx.fillStyle = signalColor + '20';
  const badgeW = ctx.measureText(signalLabel).width + 30;
  ctx.fillRect(90, height * 0.58, badgeW, 36);
  ctx.strokeStyle = signalColor + '60';
  ctx.lineWidth = 1;
  ctx.strokeRect(90, height * 0.58, badgeW, 36);
  ctx.fillStyle = signalColor;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(signalLabel, 105, height * 0.58 + 25);

  // Description
  ctx.fillStyle = colors.textMuted;
  ctx.font = '18px sans-serif';
  ctx.fillText(description, 90, height * 0.72);

  // Brand
  ctx.fillStyle = 'rgba(212,175,55,0.3)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(locale === 'ar' ? 'رؤى' : locale === 'fr' ? 'ROUA' : 'ROUA', width - 40, height - 30);

  return { buffer: canvas.toBuffer('image/png'), width, height };
}

// ─── Utility ────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 10000) return price.toFixed(0);
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(3);
  return price.toFixed(6);
}
