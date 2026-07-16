#!/usr/bin/env node
// ─── Financial Chart Generator using @napi-rs/canvas ──────────
// Renders professional Bloomberg-style candlestick charts for video
// No browser needed — pure canvas rendering
//
// Usage:
//   node scripts/chart-generator.mjs --symbol EURUSD --output ./chart.png --width 1280 --height 720

import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';

const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultVal;
}

const symbol = getArg('symbol', 'EURUSD');
const outputPath = getArg('output', './chart.png');
const width = parseInt(getArg('width', '1280'));
const height = parseInt(getArg('height', '720'));

// Generate OHLCV data
function generateOHLCV(days = 90) {
  const symbolPrices = {
    'EURUSD': 1.0845, 'XAU': 2035.40, 'SPX': 5320.15,
    'DXY': 104.20, 'CL': 78.50, 'BTC': 74220,
    'AAPL': 195, 'TSLA': 245, 'MSFT': 420,
  };
  let price = symbolPrices[symbol] || 100;
  const data = [];
  for (let i = 0; i < days; i++) {
    const vol = price * 0.012;
    const open = price;
    const close = open + (Math.random() - 0.47) * vol;
    const high = Math.max(open, close) + Math.random() * vol * 0.5;
    const low = Math.min(open, close) - Math.random() * vol * 0.5;
    const volume = Math.floor(30000 + Math.random() * 150000);
    data.push({ open, high, low, close, volume });
    price = close;
  }
  return data;
}

// Calculate RSI
function calcRSI(closes, period = 14) {
  const result = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i-1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const diff = closes[i] - closes[i-1];
      avgGain = (avgGain * (period-1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period-1) + (diff < 0 ? -diff : 0)) / period;
    }
    result.push(avgLoss === 0 ? 100 : 100 - 100/(1+avgGain/avgLoss));
  }
  return result;
}

// Calculate Bollinger Bands
function calcBollinger(closes, period = 20) {
  const result = [];
  for (let i = period-1; i < closes.length; i++) {
    const slice = closes.slice(i-period+1, i+1);
    const sma = slice.reduce((a,b) => a+b, 0) / period;
    const std = Math.sqrt(slice.reduce((a,b) => a+(b-sma)**2, 0) / period);
    result.push({ upper: sma + 2*std, middle: sma, lower: sma - 2*std });
  }
  return result;
}

// Main render
const ohlcv = generateOHLCV(90);
const closes = ohlcv.map(d => d.close);
const rsiValues = calcRSI(closes);
const bbValues = calcBollinger(closes);

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// ── Colors ──
const BG = '#0a0e1a';
const GRID = '#1a2332';
const TEXT = '#94a3b8';
const TEXT_DIM = '#475569';
const GREEN = '#22c55e';
const RED = '#ef4444';
const CYAN = '#00e5ff';
const PURPLE = '#a78bfa';
const BLUE = '#3b82f6';
const GOLD = '#f59e0b';

// ── Background ──
ctx.fillStyle = BG;
ctx.fillRect(0, 0, width, height);

// ── Layout ──
const margin = { top: 45, right: 80, bottom: 25, left: 15 };
const mainTop = margin.top;
const mainBottom = Math.floor(height * 0.62);
const rsiTop = mainBottom + 25;
const rsiBottom = height - 55;
const indTop = height - 50;

const chartW = width - margin.left - margin.right;
const chartH = mainBottom - mainTop;

// ── Title ──
ctx.fillStyle = TEXT;
ctx.font = 'bold 14px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText(`${symbol} — شموع يابانية`, margin.left + 5, 25);

// Current price
const currentPrice = closes[closes.length - 1];
const prevPrice = closes[closes.length - 2];
const change = ((currentPrice - prevPrice) / prevPrice * 100);
const isUp = change >= 0;
ctx.fillStyle = isUp ? GREEN : RED;
ctx.font = 'bold 16px -apple-system, sans-serif';
ctx.textAlign = 'right';
const decimals = symbol === 'BTC' ? 0 : symbol === 'DXY' ? 2 : symbol === 'SPX' ? 2 : 4;
ctx.fillText(currentPrice.toFixed(decimals), width - margin.right - 5, 22);
ctx.font = '11px -apple-system, sans-serif';
ctx.fillText(`${isUp ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`, width - margin.right - 5, 37);

// ── Main Chart Grid ──
ctx.strokeStyle = GRID;
ctx.lineWidth = 0.5;
for (let i = 0; i <= 5; i++) {
  const y = mainTop + (chartH / 5) * i;
  ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(width - margin.right, y); ctx.stroke();
}

// ── Price Scale ──
const visibleData = ohlcv.slice(-60);
const allHighs = visibleData.map(d => d.high);
const allLows = visibleData.map(d => d.low);
const priceMin = Math.min(...allLows);
const priceMax = Math.max(...allHighs);
const priceRange = priceMax - priceMin || 1;

function priceToY(p) {
  return mainTop + (1 - (p - priceMin) / priceRange) * chartH;
}

// Price labels
ctx.fillStyle = TEXT_DIM;
ctx.font = '9px -apple-system, sans-serif';
ctx.textAlign = 'right';
for (let i = 0; i <= 5; i++) {
  const p = priceMin + (priceRange / 5) * i;
  ctx.fillText(p.toFixed(decimals), width - 5, priceToY(p) + 3);
}

// ── Candlesticks ──
const candleCount = visibleData.length;
const candleW = Math.max(2, (chartW / candleCount) * 0.7);
const gap = chartW / candleCount;

for (let i = 0; i < candleCount; i++) {
  const d = visibleData[i];
  const x = margin.left + gap * i + gap / 2;
  const isGreen = d.close >= d.open;
  const color = isGreen ? GREEN : RED;
  
  // Wick
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, priceToY(d.high));
  ctx.lineTo(x, priceToY(d.low));
  ctx.stroke();
  
  // Body
  const bodyTop = priceToY(Math.max(d.open, d.close));
  const bodyBottom = priceToY(Math.min(d.open, d.close));
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);
  ctx.fillStyle = color;
  ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyHeight);
}

// ── Bollinger Bands ──
const bbVisible = bbValues.slice(-60);
ctx.strokeStyle = 'rgba(167,139,250,0.3)';
ctx.lineWidth = 1;
ctx.setLineDash([4, 4]);
// Upper
ctx.beginPath();
for (let i = 0; i < bbVisible.length; i++) {
  const x = margin.left + gap * i + gap / 2;
  const y = priceToY(bbVisible[i].upper);
  i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
}
ctx.stroke();
// Lower
ctx.beginPath();
for (let i = 0; i < bbVisible.length; i++) {
  const x = margin.left + gap * i + gap / 2;
  const y = priceToY(bbVisible[i].lower);
  i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
}
ctx.stroke();
ctx.setLineDash([]);

// SMA line
ctx.strokeStyle = 'rgba(59,130,246,0.5)';
ctx.lineWidth = 1.5;
ctx.beginPath();
for (let i = 0; i < bbVisible.length; i++) {
  const x = margin.left + gap * i + gap / 2;
  const y = priceToY(bbVisible[i].middle);
  i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
}
ctx.stroke();

// ── Support/Resistance ──
const recentLows = closes.slice(-30);
const recentHighs = closes.slice(-30);
const support = Math.min(...recentLows);
const resistance = Math.max(...recentHighs);

ctx.setLineDash([6, 4]);
ctx.lineWidth = 1;
// Support
ctx.strokeStyle = 'rgba(34,197,94,0.6)';
ctx.beginPath(); ctx.moveTo(margin.left, priceToY(support)); ctx.lineTo(width - margin.right, priceToY(support)); ctx.stroke();
ctx.fillStyle = GREEN; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
ctx.fillText(`دعم ${support.toFixed(decimals)}`, margin.left + 5, priceToY(support) - 4);

// Resistance
ctx.strokeStyle = 'rgba(239,68,68,0.6)';
ctx.beginPath(); ctx.moveTo(margin.left, priceToY(resistance)); ctx.lineTo(width - margin.right, priceToY(resistance)); ctx.stroke();
ctx.fillStyle = RED;
ctx.fillText(`مقاومة ${resistance.toFixed(decimals)}`, margin.left + 5, priceToY(resistance) - 4);
ctx.setLineDash([]);

// ── Volume bars ──
const volMax = Math.max(...visibleData.map(d => d.volume));
const volHeight = 40;
for (let i = 0; i < candleCount; i++) {
  const d = visibleData[i];
  const x = margin.left + gap * i + gap / 2;
  const h = (d.volume / volMax) * volHeight;
  const isGreen = d.close >= d.open;
  ctx.fillStyle = isGreen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
  ctx.fillRect(x - candleW / 2, mainBottom - h, candleW, h);
}

// ── RSI Section ──
ctx.fillStyle = TEXT_DIM;
ctx.font = '9px sans-serif';
ctx.textAlign = 'left';
ctx.fillText('RSI (14)', margin.left + 5, rsiTop - 5);

const rsiH = rsiBottom - rsiTop;
function rsiToY(v) { return rsiTop + (1 - v / 100) * rsiH; }

// RSI grid
ctx.strokeStyle = GRID; ctx.lineWidth = 0.5;
ctx.beginPath(); ctx.moveTo(margin.left, rsiTop); ctx.lineTo(width - margin.right, rsiTop); ctx.stroke();
ctx.beginPath(); ctx.moveTo(margin.left, rsiBottom); ctx.lineTo(width - margin.right, rsiBottom); ctx.stroke();

// RSI 70/30 lines
ctx.strokeStyle = 'rgba(239,68,68,0.3)'; ctx.setLineDash([3, 3]);
ctx.beginPath(); ctx.moveTo(margin.left, rsiToY(70)); ctx.lineTo(width - margin.right, rsiToY(70)); ctx.stroke();
ctx.strokeStyle = 'rgba(34,197,94,0.3)';
ctx.beginPath(); ctx.moveTo(margin.left, rsiToY(30)); ctx.lineTo(width - margin.right, rsiToY(30)); ctx.stroke();
ctx.setLineDash([]);

// RSI labels
ctx.fillStyle = TEXT_DIM; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
ctx.fillText('70', width - 5, rsiToY(70) + 3);
ctx.fillText('30', width - 5, rsiToY(30) + 3);

// RSI line
const rsiVisible = rsiValues.slice(-60);
ctx.strokeStyle = PURPLE; ctx.lineWidth = 1.5;
ctx.beginPath();
for (let i = 0; i < rsiVisible.length; i++) {
  const x = margin.left + gap * i + gap / 2;
  const y = rsiToY(Math.max(0, Math.min(100, rsiVisible[i])));
  i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
}
ctx.stroke();

// ── Indicators Bar ──
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, indTop - 5, width, 55);
ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 0.5;
ctx.beginPath(); ctx.moveTo(0, indTop - 5); ctx.lineTo(width, indTop - 5); ctx.stroke();

const indicators = [
  { label: 'RSI', value: rsiValues[rsiValues.length-1]?.toFixed(1) || '—', color: rsiValues[rsiValues.length-1] > 70 ? RED : rsiValues[rsiValues.length-1] < 30 ? GREEN : TEXT },
  { label: 'دعم', value: support.toFixed(decimals), color: GREEN },
  { label: 'مقاومة', value: resistance.toFixed(decimals), color: RED },
  { label: 'SMA 20', value: bbValues[bbValues.length-1]?.middle.toFixed(decimals) || '—', color: BLUE },
  { label: 'بولينجر علوي', value: bbValues[bbValues.length-1]?.upper.toFixed(decimals) || '—', color: PURPLE },
  { label: 'بولينجر سفلي', value: bbValues[bbValues.length-1]?.lower.toFixed(decimals) || '—', color: PURPLE },
];

const indWidth = chartW / indicators.length;
indicators.forEach((ind, i) => {
  const cx = margin.left + indWidth * i + indWidth / 2;
  ctx.fillStyle = TEXT_DIM; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(ind.label, cx, indTop + 10);
  ctx.fillStyle = ind.color; ctx.font = 'bold 11px -apple-system, sans-serif';
  ctx.fillText(ind.value, cx, indTop + 28);
});

// ── Brand ──
ctx.fillStyle = 'rgba(0,229,255,0.3)';
ctx.font = 'bold 10px sans-serif';
ctx.textAlign = 'left';
ctx.fillText('ROUA', width - margin.right - 40, 20);

// ── Save ──
const buffer = canvas.toBuffer('image/png');
writeFileSync(outputPath, buffer);
console.log(`[ChartGen] Chart saved: ${outputPath} (${width}x${height}, ${buffer.length/1024}KB)`);
