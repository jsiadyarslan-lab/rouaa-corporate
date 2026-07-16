// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// ═══════════════════════════════════════════════════════════════
// ─── Canvas/Sharp Template Engine V310 ──────────────────────
// Bloomberg/CNBC-quality financial news cover image generator.
// Generates professional article images using @napi-rs/canvas + sharp.
// Works offline, never fails, <500ms.
//
// V310 COMPLETE REDESIGN — "Bloomberg Terminal meets Arabic Finance":
//   - Dual-blob gradient mesh background (modern, not flat black)
//   - Abstract candlestick/sparkline chart in background area
//   - Frosted glass card (glassmorphism) behind title
//   - Full-width category gradient banner at top
//   - Bloomberg-style bottom data strip
//   - Dot grid pattern overlay (data/tech aesthetic)
//   - Gradient-filled title text for impact
//   - Animated-style breaking news indicator
//   - Proper RTL/LTR support throughout
//
// V300: Previous version — dark navy background, simple text, too plain
// ─────────────────────────────────────────────────────────────

import { createCanvas, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import sharp from 'sharp';
import path from 'path';

// ── Font Registration (singleton) ──
let _fontsRegistered = false;

function ensureFontsRegistered(): void {
  if (_fontsRegistered) return;
  try {
    const fontPaths = [
      path.join(process.cwd(), 'public', 'fonts', 'ReadexPro-Variable.ttf'),
      path.join('/app', 'public', 'fonts', 'ReadexPro-Variable.ttf'),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'fonts', 'ReadexPro-Variable.ttf'),
    ];

    let registered = false;
    for (const fontPath of fontPaths) {
      try {
        if (require('fs').existsSync(fontPath)) {
          GlobalFonts.registerFromPath(fontPath, 'Readex Pro');
          registered = true;
          console.log(`[TemplateEngine V310] Readex Pro font registered from: ${fontPath}`);
          break;
        }
      } catch {}
    }

    if (!registered) {
      console.warn('[TemplateEngine V310] Readex Pro font not found — using system sans-serif fallback');
    }
    _fontsRegistered = true;
  } catch (err: any) {
    console.warn(`[TemplateEngine V310] Font registration failed: ${err.message} — using system fonts`);
    _fontsRegistered = true;
  }
}

// ── Brand Colors ──
const BRAND = {
  navy: '#0A0E27',
  darkBlue: '#0F1629',
  midnight: '#060918',
  deepBlack: '#020408',
  cyan: '#00E5FF',
  purple: '#8B5CF6',
  gold: '#d4af37',
  white: '#FFFFFF',
  gray: '#94A3B8',
  lightGray: '#CBD5E1',
  darkGray: '#475569',
  red: '#EF4444',
  green: '#10B981',
  orange: '#F97316',
};

// ── Category Visual Configuration ──
interface CategoryConfig {
  primary: string;
  secondary: string;
  gradient: string;      // Gradient end color for backgrounds
  glow: string;          // Glow color (usually lighter version)
  labelAr: string;
  labelEn: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'اقتصاد كلي': { primary: '#3B82F6', secondary: '#1D4ED8', gradient: '#1E3A5F', glow: '#60A5FA', labelAr: 'الاقتصاد', labelEn: 'Economy' },
  'أسهم':       { primary: '#10B981', secondary: '#059669', gradient: '#134E4A', glow: '#34D399', labelAr: 'الأسهم', labelEn: 'Stocks' },
  'عملات':      { primary: '#F59E0B', secondary: '#D97706', gradient: '#78350F', glow: '#FCD34D', labelAr: 'الفوركس', labelEn: 'Forex' },
  'فوركس':      { primary: '#F59E0B', secondary: '#D97706', gradient: '#78350F', glow: '#FCD34D', labelAr: 'الفوركس', labelEn: 'Forex' },
  'تشفير':      { primary: '#8B5CF6', secondary: '#7C3AED', gradient: '#3B0764', glow: '#A78BFA', labelAr: 'الكريبتو', labelEn: 'Crypto' },
  'كريبتو':     { primary: '#8B5CF6', secondary: '#7C3AED', gradient: '#3B0764', glow: '#A78BFA', labelAr: 'الكريبتو', labelEn: 'Crypto' },
  'أصول رقمية': { primary: '#8B5CF6', secondary: '#7C3AED', gradient: '#3B0764', glow: '#A78BFA', labelAr: 'الكريبتو', labelEn: 'Crypto' },
  'طاقة':       { primary: '#EF4444', secondary: '#DC2626', gradient: '#7F1D1D', glow: '#FCA5A5', labelAr: 'الطاقة', labelEn: 'Energy' },
  'نفط':        { primary: '#EF4444', secondary: '#DC2626', gradient: '#7F1D1D', glow: '#FCA5A5', labelAr: 'الطاقة', labelEn: 'Energy' },
  'سلع':        { primary: BRAND.gold, secondary: '#B8960C', gradient: '#713F12', glow: '#FDE68A', labelAr: 'السلع', labelEn: 'Commodities' },
  'ذهب':        { primary: BRAND.gold, secondary: '#B8960C', gradient: '#713F12', glow: '#FDE68A', labelAr: 'السلع', labelEn: 'Commodities' },
  'عقارات':     { primary: '#06B6D4', secondary: '#0891B2', gradient: '#164E63', glow: '#67E8F9', labelAr: 'العقارات', labelEn: 'Real Estate' },
  'بنوك':       { primary: '#6366F1', secondary: '#4F46E5', gradient: '#312E81', glow: '#A5B4FC', labelAr: 'البنوك', labelEn: 'Banking' },
  'أرباح شركات':{ primary: '#14B8A6', secondary: '#0D9488', gradient: '#134E4A', glow: '#5EEAD4', labelAr: 'الأرباح', labelEn: 'Earnings' },
  'تقنية':      { primary: BRAND.cyan, secondary: '#00B8D4', gradient: '#083344', glow: '#67E8F9', labelAr: 'التقنية', labelEn: 'Technology' },
  'تكنولوجيا':  { primary: BRAND.cyan, secondary: '#00B8D4', gradient: '#083344', glow: '#67E8F9', labelAr: 'التقنية', labelEn: 'Technology' },
  'سياسة':      { primary: '#64748B', secondary: '#475569', gradient: '#1E293B', glow: '#94A3B8', labelAr: 'السياسة', labelEn: 'Politics' },
  'economy':     { primary: '#3B82F6', secondary: '#1D4ED8', gradient: '#1E3A5F', glow: '#60A5FA', labelAr: 'الاقتصاد', labelEn: 'Economy' },
  'stocks':      { primary: '#10B981', secondary: '#059669', gradient: '#134E4A', glow: '#34D399', labelAr: 'الأسهم', labelEn: 'Stocks' },
  'forex':       { primary: '#F59E0B', secondary: '#D97706', gradient: '#78350F', glow: '#FCD34D', labelAr: 'الفوركس', labelEn: 'Forex' },
  'crypto':      { primary: '#8B5CF6', secondary: '#7C3AED', gradient: '#3B0764', glow: '#A78BFA', labelAr: 'الكريبتو', labelEn: 'Crypto' },
  'energy':      { primary: '#EF4444', secondary: '#DC2626', gradient: '#7F1D1D', glow: '#FCA5A5', labelAr: 'الطاقة', labelEn: 'Energy' },
  'commodities': { primary: BRAND.gold, secondary: '#B8960C', gradient: '#713F12', glow: '#FDE68A', labelAr: 'السلع', labelEn: 'Commodities' },
  'realEstate':  { primary: '#06B6D4', secondary: '#0891B2', gradient: '#164E63', glow: '#67E8F9', labelAr: 'العقارات', labelEn: 'Real Estate' },
  'banking':     { primary: '#6366F1', secondary: '#4F46E5', gradient: '#312E81', glow: '#A5B4FC', labelAr: 'البنوك', labelEn: 'Banking' },
  'earnings':    { primary: '#14B8A6', secondary: '#0D9488', gradient: '#134E4A', glow: '#5EEAD4', labelAr: 'الأرباح', labelEn: 'Earnings' },
  'technology':  { primary: BRAND.cyan, secondary: '#00B8D4', gradient: '#083344', glow: '#67E8F9', labelAr: 'التقنية', labelEn: 'Technology' },
  'politics':    { primary: '#64748B', secondary: '#475569', gradient: '#1E293B', glow: '#94A3B8', labelAr: 'السياسة', labelEn: 'Politics' },
  'arabMarkets': { primary: '#EAB308', secondary: '#CA8A04', gradient: '#713F12', glow: '#FDE68A', labelAr: 'الأسواق العربية', labelEn: 'Arab Markets' },
  'breaking':    { primary: '#FF0000', secondary: '#CC0000', gradient: '#7F1D1D', glow: '#FF6B6B', labelAr: 'عاجل', labelEn: 'Breaking' },
};

const DEFAULT_CATEGORY: CategoryConfig = {
  primary: BRAND.cyan,
  secondary: '#00B8D4',
  gradient: '#083344',
  glow: '#67E8F9',
  labelAr: 'أخبار',
  labelEn: 'News',
};

function getCategoryConfig(category: string | null | undefined): CategoryConfig {
  if (!category) return DEFAULT_CATEGORY;
  if (CATEGORY_CONFIG[category]) return CATEGORY_CONFIG[category];
  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) return config;
  }
  return DEFAULT_CATEGORY;
}

// ── Canvas Dimensions ──
const WIDTH = 1344;
const HEIGHT = 768;

// ═══════════════════════════════════════════════════════════════
// LAYOUT ZONES — V310 Bloomberg-style layout
// ═══════════════════════════════════════════════════════════════
const PADDING_X = 64;
const TOP_BAR_HEIGHT = 56;           // Category banner + source
const TITLE_ZONE_TOP = 110;          // Title card starts
const TITLE_ZONE_BOTTOM = 560;       // Title card ends
const BOTTOM_STRIP_HEIGHT = 64;      // Bloomberg data strip
const BOTTOM_STRIP_Y = HEIGHT - BOTTOM_STRIP_HEIGHT;
const GLASS_CARD_MARGIN = 24;        // Margin around glass card
const GLASS_CARD_X = PADDING_X - GLASS_CARD_MARGIN;
const GLASS_CARD_Y = TITLE_ZONE_TOP - GLASS_CARD_MARGIN;
const GLASS_CARD_W = WIDTH - 2 * (PADDING_X - GLASS_CARD_MARGIN);
const GLASS_CARD_H = TITLE_ZONE_BOTTOM - TITLE_ZONE_TOP + 2 * GLASS_CARD_MARGIN;

type Ctx = SKRSContext2D;

// ── Helper: Rounded Rectangle Path ──
function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Helper: Hex to RGBA ──
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Helper: Deterministic random (seeded) ──
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ═══════════════════════════════════════════════════════════════
// Word-boundary text wrapping using Canvas measureText
// ═══════════════════════════════════════════════════════════════
interface TitleLayout {
  font: string;
  lines: string[];
  fontSize: number;
  lineHeight: number;
  totalHeight: number;
  startY: number;
}

function wrapText(
  ctx: Ctx,
  text: string,
  maxWidth: number,
  font: string
): string[] {
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function calculateTitleLayout(
  ctx: Ctx,
  title: string,
  maxLines: number = 3
): TitleLayout {
  const availableHeight = TITLE_ZONE_BOTTOM - TITLE_ZONE_TOP - 20;
  const fontSizes = [52, 48, 44, 40, 36, 32, 28];
  const titleMaxWidth = WIDTH - PADDING_X * 2 - 20;

  for (const fontSize of fontSizes) {
    const font = `bold ${fontSize}px "Readex Pro"`;
    const lines = wrapText(ctx, title, titleMaxWidth, font);
    const clampedLines = lines.slice(0, maxLines);

    const lineHeight = Math.round(fontSize * 1.45);
    const totalHeight = clampedLines.length * lineHeight;

    if (totalHeight <= availableHeight && lines.length <= maxLines) {
      const startY = TITLE_ZONE_TOP + Math.round((availableHeight - totalHeight) / 2);
      return { font, lines: clampedLines, fontSize, lineHeight, totalHeight, startY };
    }
  }

  // Fallback: smallest font, truncate with ellipsis
  const fontSize = 28;
  const font = `bold ${fontSize}px "Readex Pro"`;
  let lines = wrapText(ctx, title, titleMaxWidth, font);
  const lineHeight = Math.round(fontSize * 1.45);

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? last.slice(0, -3) + '...' : last + '...';
  }

  const totalHeight = lines.length * lineHeight;
  const startY = TITLE_ZONE_TOP + Math.round((availableHeight - totalHeight) / 2);
  return { font, lines, fontSize, lineHeight, totalHeight, startY };
}

// ── Helper: Truncate title ──
function truncateTitle(title: string, maxChars: number = 160): string {
  if (title.length <= maxChars) return title;
  const truncated = title.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > maxChars * 0.5 ? truncated.slice(0, lastSpace) + '...' : truncated + '...';
}

// ═══════════════════════════════════════════════════════════════
// DRAWING LAYERS — V310 Professional Financial Design
// ═══════════════════════════════════════════════════════════════

// ── LAYER 1: Rich gradient mesh background ──
function drawBackground(ctx: Ctx, catConfig: CategoryConfig, isRTL: boolean): void {
  // Base: deep dark navy
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#070B1A');
  bgGrad.addColorStop(0.5, '#0A0E27');
  bgGrad.addColorStop(1, '#040610');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Blob 1: Large category-colored gradient orb (top area, opposite side of text)
  const blob1X = isRTL ? WIDTH * 0.2 : WIDTH * 0.8;
  const blob1Y = HEIGHT * 0.25;
  const blob1R = WIDTH * 0.45;
  const blob1 = ctx.createRadialGradient(blob1X, blob1Y, 0, blob1X, blob1Y, blob1R);
  blob1.addColorStop(0, hexToRgba(catConfig.primary, 0.18));
  blob1.addColorStop(0.3, hexToRgba(catConfig.primary, 0.08));
  blob1.addColorStop(0.6, hexToRgba(catConfig.gradient, 0.04));
  blob1.addColorStop(1, 'transparent');
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Blob 2: Secondary warm orb (bottom area)
  const blob2X = isRTL ? WIDTH * 0.8 : WIDTH * 0.2;
  const blob2Y = HEIGHT * 0.75;
  const blob2R = WIDTH * 0.35;
  const blob2 = ctx.createRadialGradient(blob2X, blob2Y, 0, blob2X, blob2Y, blob2R);
  blob2.addColorStop(0, hexToRgba(BRAND.gold, 0.08));
  blob2.addColorStop(0.4, hexToRgba(BRAND.gold, 0.03));
  blob2.addColorStop(1, 'transparent');
  ctx.fillStyle = blob2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Blob 3: Subtle purple accent (center)
  const blob3 = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.5, 0, WIDTH * 0.5, HEIGHT * 0.5, WIDTH * 0.3);
  blob3.addColorStop(0, hexToRgba(BRAND.purple, 0.06));
  blob3.addColorStop(1, 'transparent');
  ctx.fillStyle = blob3;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// ── LAYER 2: Subtle dot grid pattern (Bloomberg Terminal aesthetic) ──
function drawDotGrid(ctx: Ctx, catConfig: CategoryConfig): void {
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = catConfig.glow;
  const spacing = 40;
  const dotR = 1;
  for (let x = spacing; x < WIDTH; x += spacing) {
    for (let y = spacing; y < HEIGHT - BOTTOM_STRIP_HEIGHT; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;
}

// ── LAYER 3: Abstract candlestick chart in background ──
function drawAbstractChart(ctx: Ctx, catConfig: CategoryConfig, sentiment: string | undefined, isRTL: boolean): void {
  const chartBaseY = HEIGHT * 0.55;
  const chartHeight = 120;
  const chartLeft = isRTL ? WIDTH * 0.55 : PADDING_X + 40;
  const chartRight = isRTL ? WIDTH - PADDING_X - 40 : WIDTH * 0.45;
  const chartWidth = chartRight - chartLeft;

  // Generate deterministic candlestick data based on sentiment
  const rand = seededRandom(42);
  const isBearish = sentiment === 'bearish' || sentiment === 'negative';
  const numCandles = 18;
  const candleW = chartWidth / numCandles * 0.5;
  const gap = chartWidth / numCandles;

  ctx.globalAlpha = 0.12;

  let prevClose = chartBaseY;
  for (let i = 0; i < numCandles; i++) {
    const x = chartLeft + i * gap + gap * 0.25;
    const trend = isBearish ? -0.3 : 0.3;
    const change = (rand() - 0.45 + trend * 0.3) * chartHeight * 0.5;
    const open = prevClose;
    const close = open + change;
    const high = Math.min(open, close) - rand() * 20;
    const low = Math.max(open, close) + rand() * 20;
    const isUp = close < open; // Y axis inverted

    // Wick
    ctx.strokeStyle = isUp ? hexToRgba(BRAND.green, 0.6) : hexToRgba(BRAND.red, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + candleW / 2, Math.max(high, 50));
    ctx.lineTo(x + candleW / 2, Math.min(low, chartBaseY + chartHeight));
    ctx.stroke();

    // Body
    ctx.fillStyle = isUp ? hexToRgba(BRAND.green, 0.5) : hexToRgba(BRAND.red, 0.5);
    const bodyTop = Math.min(open, close);
    const bodyH = Math.max(Math.abs(close - open), 3);
    ctx.fillRect(x, bodyTop, candleW, bodyH);

    prevClose = close;
  }

  // Sparkline overlay
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = catConfig.glow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const sparkPoints = 30;
  let sparkY = chartBaseY - chartHeight * 0.3;
  for (let i = 0; i <= sparkPoints; i++) {
    const x = chartLeft + (i / sparkPoints) * chartWidth;
    const trendDir = isBearish ? 1 : -1;
    sparkY += (rand() - 0.5 + trendDir * 0.15) * 8;
    sparkY = Math.max(chartBaseY - chartHeight, Math.min(chartBaseY + chartHeight * 0.3, sparkY));
    if (i === 0) ctx.moveTo(x, sparkY);
    else ctx.lineTo(x, sparkY);
  }
  ctx.stroke();

  ctx.globalAlpha = 1.0;
}

// ── LAYER 4: Frosted glass card behind title area ──
function drawGlassCard(ctx: Ctx, catConfig: CategoryConfig): void {
  // Card background with glassmorphism effect
  ctx.save();

  // Dark translucent base
  ctx.fillStyle = 'rgba(8, 12, 30, 0.65)';
  roundRect(ctx, GLASS_CARD_X, GLASS_CARD_Y, GLASS_CARD_W, GLASS_CARD_H, 16);
  ctx.fill();

  // Category color tint at the top edge of the card
  const topTint = ctx.createLinearGradient(0, GLASS_CARD_Y, 0, GLASS_CARD_Y + 6);
  topTint.addColorStop(0, hexToRgba(catConfig.primary, 0.35));
  topTint.addColorStop(1, 'transparent');
  ctx.fillStyle = topTint;
  roundRect(ctx, GLASS_CARD_X, GLASS_CARD_Y, GLASS_CARD_W, GLASS_CARD_H, 16);
  ctx.fill();

  // Top glass highlight (subtle)
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, GLASS_CARD_X, GLASS_CARD_Y, GLASS_CARD_W, GLASS_CARD_H * 0.3, 16);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Border (subtle glow)
  ctx.strokeStyle = hexToRgba(catConfig.primary, 0.2);
  ctx.lineWidth = 1;
  roundRect(ctx, GLASS_CARD_X, GLASS_CARD_Y, GLASS_CARD_W, GLASS_CARD_H, 16);
  ctx.stroke();

  // Inner glow (category color, top edge)
  const innerGlow = ctx.createLinearGradient(0, GLASS_CARD_Y, 0, GLASS_CARD_Y + 40);
  innerGlow.addColorStop(0, hexToRgba(catConfig.primary, 0.08));
  innerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = innerGlow;
  roundRect(ctx, GLASS_CARD_X + 1, GLASS_CARD_Y + 1, GLASS_CARD_W - 2, 40, 15);
  ctx.fill();

  ctx.restore();
}

// ── LAYER 5: Category banner at top ──
function drawCategoryBanner(ctx: Ctx, catConfig: CategoryConfig, isRTL: boolean, isBreaking: boolean, source: string | undefined): void {
  // Full-width category gradient bar
  const bannerH = TOP_BAR_HEIGHT;
  const bannerGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  if (isRTL) {
    bannerGrad.addColorStop(0, hexToRgba(catConfig.primary, 0.25));
    bannerGrad.addColorStop(0.5, hexToRgba(catConfig.primary, 0.08));
    bannerGrad.addColorStop(1, 'rgba(5, 8, 22, 0.9)');
  } else {
    bannerGrad.addColorStop(0, 'rgba(5, 8, 22, 0.9)');
    bannerGrad.addColorStop(0.5, hexToRgba(catConfig.primary, 0.08));
    bannerGrad.addColorStop(1, hexToRgba(catConfig.primary, 0.25));
  }
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, 0, WIDTH, bannerH);

  // Bottom edge of banner: glowing line
  const lineGrad = ctx.createLinearGradient(0, bannerH - 1, WIDTH, bannerH - 1);
  if (isRTL) {
    lineGrad.addColorStop(0, catConfig.primary);
    lineGrad.addColorStop(0.4, hexToRgba(catConfig.primary, 0.4));
    lineGrad.addColorStop(1, 'transparent');
  } else {
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.6, hexToRgba(catConfig.primary, 0.4));
    lineGrad.addColorStop(1, catConfig.primary);
  }
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, bannerH - 1);
  ctx.lineTo(WIDTH, bannerH - 1);
  ctx.stroke();

  // Glow below the line
  const glowBelow = ctx.createLinearGradient(0, bannerH, 0, bannerH + 15);
  glowBelow.addColorStop(0, hexToRgba(catConfig.primary, 0.1));
  glowBelow.addColorStop(1, 'transparent');
  ctx.fillStyle = glowBelow;
  ctx.fillRect(0, bannerH, WIDTH, 15);

  const midY = bannerH / 2;

  // ── Breaking news badge ──
  if (isBreaking) {
    const badgeText = isRTL ? 'عاجل' : 'BREAKING';
    ctx.font = 'bold 13px "Readex Pro"';
    const badgeTextW = ctx.measureText(badgeText).width;
    const badgeW = badgeTextW + 28;
    const badgeH = 28;
    const badgeX = isRTL ? WIDTH - badgeW - PADDING_X : PADDING_X;
    const badgeY = midY - badgeH / 2;

    // Pulsing red glow
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FF0000';
    roundRect(ctx, badgeX - 2, badgeY - 2, badgeW + 4, badgeH + 4, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // Badge background gradient
    const breakGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    breakGrad.addColorStop(0, '#DC2626');
    breakGrad.addColorStop(1, '#991B1B');
    ctx.fillStyle = breakGrad;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();

    // Badge text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, midY);

    // Move category label after badge
    const categoryLabelX = isRTL ? badgeX - 20 : badgeX + badgeW + 20;
    drawCategoryLabel(ctx, catConfig, isRTL, categoryLabelX, midY);
  } else {
    // Category label at the primary position
    drawCategoryLabel(ctx, catConfig, isRTL, isRTL ? WIDTH - PADDING_X : PADDING_X, midY);
  }

  // ── Source name (opposite side of category) ──
  if (source) {
    ctx.font = '13px "Readex Pro"';
    ctx.fillStyle = BRAND.gray;
    ctx.textAlign = isRTL ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(source, isRTL ? PADDING_X : WIDTH - PADDING_X, midY);
  }

  // ── "LIVE" dot indicator (pulsing style) ──
  const liveX = isRTL ? PADDING_X + (source ? ctx.measureText(source).width + 20 : 0) : WIDTH - PADDING_X - (source ? ctx.measureText(source).width + 20 : 0);
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(isRTL ? PADDING_X + 6 : WIDTH - PADDING_X - 6, midY, 5, 0, Math.PI * 2);
  ctx.fillStyle = BRAND.green;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.arc(isRTL ? PADDING_X + 6 : WIDTH - PADDING_X - 6, midY, 3, 0, Math.PI * 2);
  ctx.fillStyle = BRAND.green;
  ctx.fill();
}

function drawCategoryLabel(ctx: Ctx, catConfig: CategoryConfig, isRTL: boolean, x: number, midY: number): void {
  const categoryLabel = isRTL ? catConfig.labelAr : catConfig.labelEn;

  // Category dot
  const dotX = isRTL ? x - 4 : x + 4;
  ctx.beginPath();
  ctx.arc(isRTL ? x : x, midY, 4, 0, Math.PI * 2);
  ctx.fillStyle = catConfig.primary;
  ctx.fill();

  // Glow around dot
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(isRTL ? x : x, midY, 8, 0, Math.PI * 2);
  ctx.fillStyle = catConfig.glow;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Category text
  ctx.font = 'bold 14px "Readex Pro"';
  ctx.fillStyle = catConfig.glow;
  ctx.textAlign = isRTL ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(categoryLabel, isRTL ? x - 14 : x + 14, midY);
}

// ── LAYER 6: Title text with gradient fill ──
function drawTitle(ctx: Ctx, title: string, catConfig: CategoryConfig, isRTL: boolean): TitleLayout {
  const displayTitle = truncateTitle(title);
  const titleLayout = calculateTitleLayout(ctx, displayTitle);

  const titleX = isRTL ? WIDTH - PADDING_X : PADDING_X;
  ctx.textAlign = isRTL ? 'right' : 'left';
  ctx.textBaseline = 'top';

  for (let i = 0; i < titleLayout.lines.length; i++) {
    const y = titleLayout.startY + i * titleLayout.lineHeight;
    ctx.font = titleLayout.font;

    // Deep shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // Stroke outline for readability
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = titleLayout.fontSize >= 40 ? 6 : 4;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(titleLayout.lines[i], titleX, y);

    // Gradient fill for title text (white → slight category tint)
    const textGrad = ctx.createLinearGradient(0, y, 0, y + titleLayout.lineHeight);
    textGrad.addColorStop(0, '#FFFFFF');
    textGrad.addColorStop(0.8, '#F0F0F0');
    textGrad.addColorStop(1, hexToRgba(catConfig.glow, 0.85));
    ctx.fillStyle = textGrad;
    ctx.fillText(titleLayout.lines[i], titleX, y);
  }

  // Clear shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  return titleLayout;
}

// ── LAYER 7: Gold accent divider ──
function drawDivider(ctx: Ctx, titleLayout: TitleLayout, catConfig: CategoryConfig, isRTL: boolean): void {
  const dividerY = Math.min(
    titleLayout.startY + titleLayout.totalHeight + 25,
    GLASS_CARD_Y + GLASS_CARD_H - 10
  );

  const divGrad = ctx.createLinearGradient(PADDING_X, dividerY, WIDTH - PADDING_X, dividerY);
  if (isRTL) {
    divGrad.addColorStop(0, hexToRgba(catConfig.primary, 0.6));
    divGrad.addColorStop(0.3, hexToRgba(BRAND.gold, 0.5));
    divGrad.addColorStop(0.7, hexToRgba(BRAND.gold, 0.15));
    divGrad.addColorStop(1, 'transparent');
  } else {
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.3, hexToRgba(BRAND.gold, 0.15));
    divGrad.addColorStop(0.7, hexToRgba(BRAND.gold, 0.5));
    divGrad.addColorStop(1, hexToRgba(catConfig.primary, 0.6));
  }
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING_X, dividerY);
  ctx.lineTo(WIDTH - PADDING_X, dividerY);
  ctx.stroke();

  // Small diamond accent in the middle
  const midX = WIDTH / 2;
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = BRAND.gold;
  ctx.save();
  ctx.translate(midX, dividerY);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.globalAlpha = 1.0;
}

// ── LAYER 8: Bloomberg-style bottom data strip ──
function drawBottomStrip(ctx: Ctx, catConfig: CategoryConfig, isRTL: boolean, sentiment: string | undefined): void {
  // Background
  const stripGrad = ctx.createLinearGradient(0, BOTTOM_STRIP_Y, 0, HEIGHT);
  stripGrad.addColorStop(0, 'rgba(3, 5, 15, 0.95)');
  stripGrad.addColorStop(0.3, 'rgba(6, 9, 20, 0.98)');
  stripGrad.addColorStop(1, 'rgba(2, 4, 10, 1)');
  ctx.fillStyle = stripGrad;
  ctx.fillRect(0, BOTTOM_STRIP_Y, WIDTH, BOTTOM_STRIP_HEIGHT);

  // Top edge: glowing line
  const edgeGrad = ctx.createLinearGradient(0, BOTTOM_STRIP_Y, WIDTH, BOTTOM_STRIP_Y);
  edgeGrad.addColorStop(0, 'transparent');
  edgeGrad.addColorStop(0.2, hexToRgba(BRAND.gold, 0.3));
  edgeGrad.addColorStop(0.5, BRAND.gold);
  edgeGrad.addColorStop(0.8, hexToRgba(BRAND.gold, 0.3));
  edgeGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = edgeGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, BOTTOM_STRIP_Y);
  ctx.lineTo(WIDTH, BOTTOM_STRIP_Y);
  ctx.stroke();

  // Gold glow below line
  const goldGlow = ctx.createLinearGradient(0, BOTTOM_STRIP_Y, 0, BOTTOM_STRIP_Y + 8);
  goldGlow.addColorStop(0, hexToRgba(BRAND.gold, 0.08));
  goldGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = goldGlow;
  ctx.fillRect(0, BOTTOM_STRIP_Y, WIDTH, 8);

  const midY = BOTTOM_STRIP_Y + BOTTOM_STRIP_HEIGHT / 2;

  // ── Brand name: "رؤى | ROUAA" ──
  const brandAr = isRTL ? 'رؤى' : 'ROUAA';
  const brandEn = isRTL ? 'ROUAA' : 'رؤى';
  ctx.font = 'bold 18px "Readex Pro"';
  ctx.textAlign = isRTL ? 'right' : 'left';
  ctx.textBaseline = 'middle';

  // Gold brand with subtle glow
  ctx.shadowColor = hexToRgba(BRAND.gold, 0.25);
  ctx.shadowBlur = 12;
  ctx.fillStyle = BRAND.gold;
  const brandX = isRTL ? WIDTH - PADDING_X : PADDING_X;
  ctx.fillText(brandAr, brandX, midY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Separator
  const brandW = ctx.measureText(brandAr).width;
  ctx.font = '16px "Readex Pro"';
  ctx.fillStyle = BRAND.darkGray;
  const sepX = isRTL ? brandX - brandW - 10 : brandX + brandW + 10;
  ctx.fillText('|', sepX, midY);

  // Secondary brand text
  ctx.font = '13px "Readex Pro"';
  ctx.fillStyle = BRAND.gray;
  const secBrandX = isRTL ? sepX - 14 : sepX + 14;
  ctx.fillText(brandEn, secBrandX, midY);

  // Secondary separator
  const secBrandW = ctx.measureText(brandEn).width;
  ctx.fillStyle = BRAND.darkGray;
  ctx.font = '16px "Readex Pro"';
  const sep2X = isRTL ? secBrandX - secBrandW - 10 : secBrandX + secBrandW + 10;
  ctx.fillText('|', sep2X, midY);

  // Category sublabel
  const categoryLabel = isRTL ? catConfig.labelAr : catConfig.labelEn;
  ctx.font = '13px "Readex Pro"';
  ctx.fillStyle = catConfig.glow;
  const catLabelX = isRTL ? sep2X - 14 : sep2X + 14;
  ctx.fillText(categoryLabel, catLabelX, midY);

  // ── Date (right side for LTR, left for RTL) ──
  const dateStr = new Date().toLocaleDateString(
    isRTL ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
  ctx.font = '13px "Readex Pro"';
  ctx.fillStyle = BRAND.gray;
  ctx.textAlign = isRTL ? 'left' : 'right';
  ctx.fillText(dateStr, isRTL ? PADDING_X : WIDTH - PADDING_X, midY);

  // ── Sentiment indicator ──
  if (sentiment && sentiment !== 'neutral') {
    const isBullish = sentiment === 'bullish' || sentiment === 'positive';
    const sentimentColor = isBullish ? BRAND.green : BRAND.red;
    const sentimentArrow = isBullish ? '▲' : '▼';
    const sentimentLabel = isBullish
      ? (isRTL ? 'صعودي' : 'Bullish')
      : (isRTL ? 'هبوطي' : 'Bearish');

    const sentimentFullText = `${sentimentArrow} ${sentimentLabel}`;

    // Calculate position: between date and brand
    ctx.font = 'bold 13px "Readex Pro"';
    ctx.textAlign = isRTL ? 'left' : 'right';
    const dateWidth = ctx.measureText(dateStr).width;
    const sentX = isRTL
      ? PADDING_X + dateWidth + 30
      : WIDTH - PADDING_X - dateWidth - 30 - ctx.measureText(sentimentFullText).width;

    // Sentiment dot (glowing)
    const dotSentX = isRTL
      ? sentX - 12
      : sentX + ctx.measureText(sentimentFullText).width + 12;

    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(dotSentX, midY, 6, 0, Math.PI * 2);
    ctx.fillStyle = sentimentColor;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.beginPath();
    ctx.arc(dotSentX, midY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = sentimentColor;
    ctx.fill();

    ctx.fillStyle = sentimentColor;
    ctx.textAlign = isRTL ? 'left' : 'right';
    ctx.fillText(sentimentFullText, sentX + (isRTL ? 0 : 0), midY);
  }

  // ── Decorative ticker-style separators ──
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = BRAND.gold;
  // Small vertical bars across the strip for Bloomberg terminal feel
  for (let i = 1; i < 6; i++) {
    const tickX = PADDING_X + (WIDTH - 2 * PADDING_X) * (i / 6);
    ctx.fillRect(tickX, BOTTOM_STRIP_Y + 12, 1, BOTTOM_STRIP_HEIGHT - 24);
  }
  ctx.globalAlpha = 1.0;
}

// ── LAYER 9: Ambient particles (subtle depth) ──
function drawParticles(ctx: Ctx, catConfig: CategoryConfig): void {
  const rand = seededRandom(314159);
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 40; i++) {
    const px = rand() * WIDTH;
    const py = rand() * (BOTTOM_STRIP_Y - 20);
    const size = rand() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? catConfig.glow : i % 3 === 1 ? BRAND.gold : '#FFFFFF';
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

// ── LAYER 10: Side accent glow ──
function drawSideAccent(ctx: Ctx, catConfig: CategoryConfig, isRTL: boolean): void {
  // Vertical glowing bar on the side
  const barX = isRTL ? WIDTH - 3 : 0;
  const sideBar = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sideBar.addColorStop(0, hexToRgba(catConfig.primary, 0.8));
  sideBar.addColorStop(0.3, catConfig.primary);
  sideBar.addColorStop(0.5, hexToRgba(catConfig.glow, 0.6));
  sideBar.addColorStop(0.7, catConfig.primary);
  sideBar.addColorStop(1, hexToRgba(catConfig.primary, 0.3));
  ctx.fillStyle = sideBar;
  ctx.fillRect(barX, 0, 3, HEIGHT);

  // Glow spread
  const glowSpread = isRTL ? -15 : 3;
  const glowGrad = ctx.createLinearGradient(barX + glowSpread, 0, barX + (isRTL ? -40 : 40), 0);
  glowGrad.addColorStop(0, hexToRgba(catConfig.primary, 0.08));
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(isRTL ? barX - 40 : 0, 0, 40, HEIGHT);
}

// ═══════════════════════════════════════════════════════════════
// Main: Generate Article Image
// ═══════════════════════════════════════════════════════════════
export interface ArticleImageParams {
  title: string;
  category: string;
  locale: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  newsType?: string;
  sentiment?: string;
  source?: string;
}

export async function generateArticleImage(params: ArticleImageParams): Promise<Buffer> {
  ensureFontsRegistered();

  const { title, category, locale, newsType, sentiment, source } = params;
  const isRTL = locale === 'ar';
  const catConfig = getCategoryConfig(category);
  const isBreaking = newsType === 'breaking';

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ── Render all layers in order ──
  drawBackground(ctx, catConfig, isRTL);
  drawDotGrid(ctx, catConfig);
  drawAbstractChart(ctx, catConfig, sentiment, isRTL);
  drawSideAccent(ctx, catConfig, isRTL);
  drawGlassCard(ctx, catConfig);
  drawCategoryBanner(ctx, catConfig, isRTL, isBreaking, source);
  const titleLayout = drawTitle(ctx, title, catConfig, isRTL);
  drawDivider(ctx, titleLayout, catConfig, isRTL);
  drawBottomStrip(ctx, catConfig, isRTL, sentiment);
  drawParticles(ctx, catConfig);

  // ═══════════════════════════════════════════════════════════
  // EXPORT: PNG → JPEG (sharp compression)
  // ═══════════════════════════════════════════════════════════
  const pngBuffer = canvas.toBuffer('image/png');

  const jpegBuffer = await sharp(pngBuffer)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return jpegBuffer;
}

/**
 * Quick test function — generates a sample image and returns the buffer.
 */
export async function testTemplateEngine(): Promise<{ success: boolean; sizeBytes: number; durationMs: number; error?: string }> {
  const start = Date.now();
  try {
    const buffer = await generateArticleImage({
      title: 'مضيق هرمز: صدمة إمدادات قد تُغيّر مسار أسواق الطاقة العالمية',
      category: 'طاقة',
      locale: 'ar',
      newsType: 'breaking',
      sentiment: 'bearish',
      source: 'رويترز',
    });
    return {
      success: true,
      sizeBytes: buffer.length,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      sizeBytes: 0,
      durationMs: Date.now() - start,
      error: err.message,
    };
  }
}
