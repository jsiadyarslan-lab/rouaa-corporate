#!/usr/bin/env node
// ─── Al Jazeera AJ Labs Video Renderer V32 ────────────────────────────
// AUTHENTICALLY Al Jazeera — Peninsula Square motif, warm navy, counter animations
// V339: Register unhandled rejection handler IMMEDIATELY
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[V339] Unhandled rejection (suppressed): ${String(reason)?.slice(0, 200)}`);
});
//
// "Don't give me more data — give me a story" — Mohammed Haddad, AJ Labs
//
// V32 Changes from V31:
//   - WARM NAVY background (#0A1628) — NOT cold GitHub dark (#0D1117)
//   - PENINSULA SQUARE MOTIF — 2022 rebrand central element:
//     golden square that slides, transforms into timeline indicator,
//     becomes a frame, becomes a progress container
//   - HORIZONTAL SLIDE scene transitions (AJ style, not hard cuts)
//   - Warm amber gradient overlays with subtle geometric patterns
//   - Authentic lower-third graphics with gold accent line
//   - Improved world map with choropleth fills
//   - Deliberate, slower animation pacing (story-paced, AJ-style)
//   - Dual-language typography throughout
//   - Scene transition: 1s horizontal slide between scenes
//
// Architecture (same technical pipeline):
//   - Playwright frame-by-frame rendering at FPS
//   - HTML with window.setAnimationProgress(p) function (0→1)
//   - FFmpeg stitches PNG frames + voiceover into final MP4
//   - TTS: edge-tts → Groq fallback
//   - Images: Pollinations → SDK → CLI → geometric fallback
//
// 6 SCENES (~170s total):
//   1. HOOK       (0-15s)    — Counter animation, Peninsula Square expands, gold underline
//   2. MAP        (15-45s)   — Choropleth world map, region counters, Peninsula as compass
//   3. TIMELINE   (45-80s)   — Peninsula Square becomes vertical timeline, gold dots, events
//   4. DATAVIZ    (80-115s)  — Counter-first bar chart, Peninsula as data frame
//   5. HUMANSTORY (115-145s) — Emotional portrait + gold quote + Peninsula as quote frame
//   6. CLOSING    (145-170s) — Peninsula Square final brand mark, takeaways, credits
//
// Usage:
//   node scripts/video-renderer-dataviz.mjs --input /path/to/data.json --output /path/to/output.mp4

import { chromium } from 'playwright';
import { execSync, spawnSync, execFile, spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync, rmSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// V350: Non-blocking spawn wrapper — avoids blocking the event loop
function spawnAsync(command, args, options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: 'pipe', ...options });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => { stdout += d; });
    proc.stderr?.on('data', (d) => { stderr += d; });
    const timeout = options.timeout || 120000;
    const timer = setTimeout(() => { proc.kill('SIGKILL'); }, timeout);
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({ status: code, stdout, stderr });
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ status: 1, stdout: '', stderr: err.message });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// AL JAZEERA BRAND COLORS — V32 WARM PALETTE
// ═══════════════════════════════════════════════════════════════════
const AJ = {
  // Official brand
  gold:        '#DBA200',
  blue:        '#212E64',
  // V32: Warm navy — the REAL AJ dark background (not cold GitHub)
  darkBg:      '#0A1628',
  midBg:       '#141E3C',
  lightBg:     '#1C2A4A',
  // V32: Warm whites and ambers
  warmWhite:   '#F5F0E8',
  amberGlow:   '#D4930D',
  orange:      '#FA6400',
  paleGold:    '#F0D68A',
  // Data colors
  teal:        '#00A6B5',
  crimson:     '#CC2936',
  green:       '#4CAF50',
  // Text
  textWhite:   '#F5F0E8',
  textGray:    '#9B9B9B',
  textDim:     '#6B6B6B',
  // Borders and glows
  borderGold:  'rgba(219,162,0,0.2)',
  glowGold:    'rgba(219,162,0,0.15)',
  subtleGold:  'rgba(219,162,0,0.08)',
};

// ═══════════════════════════════════════════════════════════════════
// RENDERING CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const RENDER_WIDTH = 1280;
const RENDER_HEIGHT = 720;
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const OUTPUT_FPS = 30;
// V7 FIX: Use IIFE to determine RENDER_FPS — avoids 'Assignment to constant variable' error
const RENDER_FPS = (() => {
  // V339: Use 12fps for all environments — 24fps doubles rendering time with no visible quality gain
  // since FFmpeg outputs at 30fps via frame duplication anyway.
  // This saves ~50% rendering time (same optimization as Bloomberg renderer)
  const mem = process.memoryUsage();
  const rssMB = mem.rss / 1024 / 1024;
  const heapMB = mem.heapTotal / 1024 / 1024;
  console.log(`[V339] Memory: RSS=${rssMB.toFixed(0)}MB, Heap=${heapMB.toFixed(0)}MB`);
  if (global.gc) { global.gc(); console.log('[V339] GC triggered at startup'); }
  if (rssMB < 150 && heapMB < 200) {
    console.warn(`[V339] Very low memory (${rssMB.toFixed(0)}MB RSS), reducing FPS to 10`);
    return 10;
  }
  console.log(`[V339] Using 12fps render → 30fps output (optimized for speed)`);
  return 12;
})();
const FPS = RENDER_FPS;
const WIDTH = RENDER_WIDTH;
const HEIGHT = RENDER_HEIGHT;

// Scene definitions — V32: includes 1s transitions between scenes
const SCENE_DEFS = [
  ['hook',       0,   15],
  ['map',        15,  45],
  ['timeline',   45,  80],
  ['dataviz',    80,  115],
  ['humanstory', 115, 145],
  ['closing',    145, 170],
];
const TOTAL_SCENES = SCENE_DEFS.length;

// Peninsula Square size (the 2022 rebrand motif)
const PENINSULA_SIZE = 42;
const PENINSULA_RADIUS = 4;

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
const AR_NUMERALS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toArabicNumeral(n) {
  return String(n).split('').map(d => AR_NUMERALS[parseInt(d)] || d).join('');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      parsed[key] = args[i + 1] || true;
      i++;
    }
  }
  return parsed;
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*{3}|_{3})(.+?)\1/g, '$2')
    .replace(/(\*{2}|_{2})(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    .replace(/\^\((.+?)\)/g, '$1')
    .replace(/^\s*>\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function truncateText(text, maxChars = 35) {
  if (!text) return '';
  const s = String(text).trim();
  return s.length > maxChars ? s.slice(0, maxChars - 1) + '...' : s;
}

function getImpactColor(impact) {
  if (['bullish', 'positive'].includes(impact)) return AJ.green;
  if (['bearish', 'negative'].includes(impact)) return AJ.crimson;
  return AJ.gold;
}

function getImpactLabel(impact, locale) {
  if (['bullish', 'positive'].includes(impact)) return locale === 'ar' ? 'صعودي' : locale === 'tr' ? 'Yükseliş' : 'Bullish';
  if (['bearish', 'negative'].includes(impact)) return locale === 'ar' ? 'هبوطي' : locale === 'tr' ? 'Düşüş' : 'Bearish';
  return locale === 'ar' ? 'محايد' : locale === 'tr' ? 'Nötr' : 'Neutral';
}

function getImpactArrow(impact) {
  if (['bullish', 'positive'].includes(impact)) return '↑';
  if (['bearish', 'negative'].includes(impact)) return '↓';
  return '→';
}

function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (typeof num === 'string') return num;
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed ? num.toFixed(1) : String(num);
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function segProg(p, s, e) { return clamp((p - s) / (e - s), 0, 1); }
function easeOutCubic(t) { const p = clamp(t, 0, 1); return 1 - Math.pow(1 - p, 3); }
function easeInOutCubic(t) { const p = clamp(t, 0, 1); return p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2; }
function easeOutQuart(t) { const p = clamp(t, 0, 1); return 1 - Math.pow(1 - p, 4); }

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ═══════════════════════════════════════════════════════════════════
// SVG WORLD MAP — V32 Enhanced with choropleth fills
// ═══════════════════════════════════════════════════════════════════
function generateWorldMapSVG() {
  return `
  <svg id="aj-map" viewBox="0 0 1000 500" style="width:100%;height:100%;opacity:0.95;">
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glowSoft"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="mapOcean" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0A1628"/>
        <stop offset="50%" stop-color="#0E1A30"/>
        <stop offset="100%" stop-color="#0A1628"/>
      </linearGradient>
    </defs>
    <!-- Ocean -->
    <rect width="1000" height="500" fill="url(#mapOcean)" rx="8"/>
    <!-- Grid lines — V32: warmer, subtler -->
    <g opacity="0.04" stroke="${AJ.gold}" stroke-width="0.5">
      ${Array.from({length:10}, (_,i) => `<line x1="0" y1="${i*50+25}" x2="1000" y2="${i*50+25}"/>`).join('\n      ')}
      ${Array.from({length:20}, (_,i) => `<line x1="${i*50+25}" y1="0" x2="${i*50+25}" y2="500"/>`).join('\n      ')}
    </g>
    <!-- Continents — V32: warmer fills, not cold midBg -->
    <!-- North America -->
    <path id="map-namerica" class="map-region" d="M100,60 Q160,40 220,70 L240,130 Q250,200 220,250 L180,290 Q140,280 120,240 L90,180 Q70,120 100,60Z" fill="${AJ.midBg}" stroke="${AJ.borderGold}" stroke-width="1" opacity="0.7"/>
    <!-- South America -->
    <path id="map-samerica" class="map-region" d="M180,280 Q210,270 230,300 L240,370 Q230,430 200,460 L170,450 Q150,410 155,360 L165,310Z" fill="${AJ.midBg}" stroke="${AJ.borderGold}" stroke-width="1" opacity="0.7"/>
    <!-- Europe -->
    <path id="map-europe" class="map-region" d="M430,60 Q470,50 530,65 L550,100 Q540,140 510,155 L470,160 Q440,150 430,120Z" fill="${AJ.midBg}" stroke="${AJ.borderGold}" stroke-width="1" opacity="0.7"/>
    <!-- Africa -->
    <path id="map-africa" class="map-region" d="M450,165 Q490,155 520,175 L540,220 Q550,290 530,350 L500,400 Q470,390 455,355 L435,290 Q425,230 450,165Z" fill="${AJ.midBg}" stroke="${AJ.borderGold}" stroke-width="1" opacity="0.7"/>
    <!-- Middle East — V32: prominent, center-stage -->
    <path id="map-mideast" class="map-region" d="M535,145 Q565,130 600,145 L615,170 Q625,195 605,215 L575,225 Q555,215 540,195 L530,170Z" fill="${AJ.lightBg}" stroke="${AJ.borderGold}" stroke-width="1.5" opacity="0.9"/>
    <!-- Central/South Asia -->
    <path id="map-asia" class="map-region" d="M590,70 Q680,50 780,80 L820,140 Q830,220 790,270 L730,280 Q660,260 620,210 L600,140Z" fill="${AJ.midBg}" stroke="${AJ.borderGold}" stroke-width="1" opacity="0.7"/>
    <!-- East Asia / Oceania -->
    <path id="map-easia" class="map-region" d="M750,60 Q830,50 890,90 L900,160 Q880,220 840,240 L790,220 Q760,180 755,130Z" fill="${AJ.midBg}" stroke="${AJ.borderGold}" stroke-width="1" opacity="0.7"/>
    <!-- Region labels — V32: subtle, gold-tinted -->
    <text x="165" y="175" fill="${AJ.textDim}" font-size="9" text-anchor="middle" font-family="Inter,sans-serif" letter-spacing="1.5">AMERICAS</text>
    <text x="485" y="300" fill="${AJ.textDim}" font-size="9" text-anchor="middle" font-family="Inter,sans-serif" letter-spacing="1.5">AFRICA</text>
    <text x="572" y="190" fill="${AJ.paleGold}" font-size="9" text-anchor="middle" font-family="Inter,sans-serif" letter-spacing="1.5" opacity="0.7">M.EAST</text>
    <text x="490" y="115" fill="${AJ.textDim}" font-size="9" text-anchor="middle" font-family="Inter,sans-serif" letter-spacing="1.5">EUROPE</text>
    <text x="720" y="170" fill="${AJ.textDim}" font-size="9" text-anchor="middle" font-family="Inter,sans-serif" letter-spacing="1.5">ASIA</text>
  </svg>`;
}

// ═══════════════════════════════════════════════════════════════════
// IMAGE GENERATION (Pollinations → SDK → CLI → Geometric fallback)
// ═══════════════════════════════════════════════════════════════════
async function downloadImageFromUrl(url) {
  try {
    console.log(`[AJ32]  Downloading image from: ${url.slice(0, 80)}...`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AJ32Renderer/1.0', 'Accept': 'image/*' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 5000) return null;
    console.log(`[AJ32]  Downloaded: ${(buffer.length/1024).toFixed(0)}KB`);
    return buffer;
  } catch (err) {
    console.warn(`[AJ32]  Download error: ${err.message}`);
    return null;
  }
}

// V342: Pollinations health check cache — same as news imager (imager.ts)
let _ajPollinationsLastCheck = 0;
let _ajPollinationsAvailable = true;
const AJ_POLLINATIONS_CHECK_INTERVAL_MS = 120_000;

async function isPollinationsAvailable() {
  const now = Date.now();
  if (now - _ajPollinationsLastCheck < AJ_POLLINATIONS_CHECK_INTERVAL_MS) return _ajPollinationsAvailable;
  _ajPollinationsLastCheck = now;
  try {
    const res = await fetch('https://image.pollinations.ai/prompt/test?width=64&height=64&nologo=true', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    _ajPollinationsAvailable = res.ok;
  } catch { _ajPollinationsAvailable = false; }
  if (!_ajPollinationsAvailable) console.warn('[V342] ⚠ Pollinations DOWN/402 — using fallbacks');
  return _ajPollinationsAvailable;
}

async function generateImagePollinations(prompt, width, height) {
  // V346: Pollinations is the PRIMARY working method (Together AI out of credits, HF fetch fails)
  // Health check confirms Pollinations is UP (200 OK), but image generation needs >30s.
  // Try multiple strategies with increasing patience:
  //   1. model=flux (best quality) with 120s timeout
  //   2. default model (faster) with 90s timeout
  //   3. model=flux with smaller dimensions (faster generation)
  const pollUp = await isPollinationsAvailable();
  if (!pollUp) { console.warn('[V346]  Pollinations: skipped (health check failed)'); return null; }

  let cleanPrompt = prompt.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
  const shortPrompt = cleanPrompt.length > 200 ? cleanPrompt.substring(0, 197) + '...' : cleanPrompt;

  // V346: Multiple strategies — flux is slow but high quality, default is faster, smaller dims also faster
  const strategies = [
    { name: 'flux', model: 'flux', w: width, h: height, timeout: 120000 },
    { name: 'default', model: null, w: width, h: height, timeout: 90000 },
    { name: 'flux-small', model: 'flux', w: 1024, h: 576, timeout: 90000 },
  ];

  for (const strategy of strategies) {
    try {
      const seed = Date.now() + Math.floor(Math.random() * 10000);
      let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=${strategy.w}&height=${strategy.h}&nologo=true&seed=${seed}`;
      if (strategy.model) url += `&model=${strategy.model}`;
      console.log(`[V346]  Pollinations (${strategy.name}): ${shortPrompt.length} chars, timeout=${strategy.timeout/1000}s...`);
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AJ32Renderer/1.0', 'Accept': 'image/*' },
        signal: AbortSignal.timeout(strategy.timeout),
      });
      if (!response.ok) {
        console.warn(`[V346]  Pollinations (${strategy.name}): HTTP ${response.status}`);
        if (response.status === 402 || response.status === 429) { _ajPollinationsAvailable = false; return null; }
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 5000) { console.warn(`[V346]  Pollinations (${strategy.name}): too small (${buffer.length} bytes)`); continue; }
      const header = buffer.slice(0, 4).toString('hex');
      const isJPEG = header.startsWith('ffd8');
      const isPNG = header.startsWith('89504');
      const isWebP = header.startsWith('5249');
      if (!isJPEG && !isPNG && !isWebP) { console.warn(`[V346]  Pollinations (${strategy.name}): not image (header: ${header})`); continue; }
      console.log(`[V346]  Pollinations (${strategy.name}): SUCCESS (${(buffer.length/1024).toFixed(0)}KB)`);
      return buffer;
    } catch (err) {
      console.warn(`[V346]  Pollinations (${strategy.name}): ${err.message?.slice(0, 80)}`);
    }
  }

  console.warn(`[V346]  Pollinations: ALL strategies failed`);
  return null;
}

// V350: Cloudflare Workers AI — PRIMARY method (same key that works for news & infographics)
let _cf402Cached = false;
let _cf402Time = 0;
const CF_402_CACHE_MS = 300_000;

async function generateImageCloudflareAI(prompt, width, height) {
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.R2_ACCOUNT_ID;
  if (!cfApiToken || !cfAccountId) {
    console.log(`[V350]  Cloudflare AI: skipped (${!cfApiToken ? 'CLOUDFLARE_API_TOKEN' : 'R2_ACCOUNT_ID'} not set)`);
    return null;
  }

  const now = Date.now();
  if (_cf402Cached && (now - _cf402Time) < CF_402_CACHE_MS) {
    console.log(`[V350]  Cloudflare AI: skipped (failure cached for ${Math.round((CF_402_CACHE_MS - (now - _cf402Time)) / 1000)}s)`);
    return null;
  }

  try {
    const cfModel = process.env.CF_IMAGE_MODEL || '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

    console.log(`[V350]  Cloudflare Workers AI: trying ${cfModel}...`);

    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 500),
        num_steps: 20,
        width: Math.min(width, 1024),
        height: Math.min(height, 1024),
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[V350]  Cloudflare AI failed (${response.status}): ${errText.slice(0, 100)}`);
      if (response.status === 402 || response.status === 429) {
        _cf402Cached = true;
        _cf402Time = Date.now();
      }
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let imgBuffer;

    if (contentType.includes('image/')) {
      imgBuffer = Buffer.from(await response.arrayBuffer());
    } else if (contentType.includes('json')) {
      const jsonData = await response.json();
      if (jsonData.image) {
        imgBuffer = Buffer.from(jsonData.image, 'base64');
      } else if (jsonData.data?.[0]) {
        const b64 = jsonData.data[0].b64_json || jsonData.data[0];
        imgBuffer = Buffer.from(typeof b64 === 'string' ? b64 : JSON.stringify(b64), 'base64');
      } else {
        console.warn(`[V350]  Cloudflare AI unexpected JSON: ${JSON.stringify(jsonData).slice(0, 150)}`);
        return null;
      }
    } else {
      const arrayBuf = await response.arrayBuffer();
      if (arrayBuf.byteLength < 1000) {
        console.warn(`[V350]  Cloudflare AI response too small (${arrayBuf.byteLength} bytes)`);
        return null;
      }
      imgBuffer = Buffer.from(arrayBuf);
    }

    if (imgBuffer.length < 2000) {
      console.warn(`[V350]  Cloudflare AI image too small (${imgBuffer.length} bytes)`);
      return null;
    }

    console.log(`[V350]  ✓ Cloudflare Workers AI generated (${(imgBuffer.length / 1024).toFixed(0)}KB)`);
    return imgBuffer;
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[V350]  Cloudflare AI request timed out`);
    } else {
      console.warn(`[V350]  Cloudflare AI failed: ${err.message?.slice(0, 100)}`);
    }
    return null;
  }
}

// V350: Removed generateImageSDK, generateImageCLI, generateImagePexels, generateGeometricFallback
// User wants ONLY AI-generated images: Cloudflare → Together → Pollinations → HuggingFace

// ─── Together AI — FLUX.1-schnell-Free ($0 forever) ─────────────
// V345: Improved — tries multiple models if first fails, better error handling
let _ajTogetherLastRequestTime = 0;
const AJ_TOGETHER_MIN_INTERVAL_MS = 3000;
const AJ_TOGETHER_MODEL_FALLBACKS = [
  'black-forest-labs/FLUX.1-schnell-Free',  // FREE forever
  'black-forest-labs/FLUX.1-schnell',        // Paid fallback
  'stabilityai/stable-diffusion-xl-base-1.0', // Alternative provider
];

async function generateImageTogether(prompt, width, height) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey || apiKey.length < 10) { console.log(`[V345]  Together: skipped (no key)`); return null; }
  try {
    const timeSinceLast = Date.now() - _ajTogetherLastRequestTime;
    if (timeSinceLast < AJ_TOGETHER_MIN_INTERVAL_MS) await new Promise(r => setTimeout(r, AJ_TOGETHER_MIN_INTERVAL_MS - timeSinceLast));
    _ajTogetherLastRequestTime = Date.now();

    for (const model of AJ_TOGETHER_MODEL_FALLBACKS) {
      const isFree = model.includes('-Free');
      console.log(`[V345]  Together AI: trying ${model}${isFree ? ' (FREE)' : ''}...`);
      try {
        const response = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, width: 1344, height: 768, steps: 4, n: 1, response_format: 'b64_json' }),
          signal: AbortSignal.timeout(90000),
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.warn(`[V345]  Together ${model}: HTTP ${response.status} — ${errText.slice(0, 60)}`);
          if (response.status === 402 && isFree) { continue; }
          if (response.status === 429) { await new Promise(r => setTimeout(r, 5000)); continue; }
          continue;
        }
        const result = await response.json();
        if (result.data?.[0]?.b64_json) {
          const buffer = Buffer.from(result.data[0].b64_json, 'base64');
          if (buffer.length < 5000) { continue; }
          console.log(`[V345]  Together ${model}: SUCCESS (${(buffer.length/1024).toFixed(0)}KB)`);
          return buffer;
        }
        if (result.data?.[0]?.url) {
          const imgRes = await fetch(result.data[0].url, { signal: AbortSignal.timeout(30000) });
          if (imgRes.ok) { const buffer = Buffer.from(await imgRes.arrayBuffer()); if (buffer.length > 5000) { console.log(`[V345]  Together ${model}: SUCCESS via URL (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; } }
        }
        continue;
      } catch (modelErr) { console.warn(`[V345]  Together ${model}: ${modelErr.message?.slice(0, 60)}`); continue; }
    }
    console.warn(`[V345]  Together: ALL models failed`);
    return null;
  } catch (err) { console.warn(`[V345]  Together failed: ${err.message?.slice(0, 80)}`); return null; }
}

// ─── HuggingFace Inference API (V345) ─────────────
// V345: Improved — longer cold-start waits (up to 60s), more retries, better logging
const AJ_HF_MODEL_FALLBACKS = [
  'black-forest-labs/FLUX.1-schnell',
  'stabilityai/stable-diffusion-xl-base-1.0',
  'runwayml/stable-diffusion-v1-5',
];

async function generateImageHuggingFace(prompt, width, height) {
  const hfToken = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
  if (!hfToken || hfToken.length < 10) { console.log(`[V345]  HuggingFace: skipped (no token)`); return null; }
  try {
    const cleanPrompt = prompt.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
    for (const model of AJ_HF_MODEL_FALLBACKS) {
      const hfUrl = `https://api-inference.huggingface.co/models/${model}`;
      const isFlux = model.includes('FLUX');
      console.log(`[V345]  HuggingFace: trying ${model}...`);
      try {
        const response = await fetch(hfUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: cleanPrompt, parameters: { width: Math.min(width, 1024), height: Math.min(height, 1024), num_inference_steps: isFlux ? 4 : 20 } }),
          signal: AbortSignal.timeout(90000), // V345: increased from 60s to 90s
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          if (response.status === 402) { console.warn(`[V345]  HF ${model}: 402 — next model`); continue; }
          if (response.status === 503 && errText.includes('loading')) {
            const wait = Math.min(60, parseInt(errText.match(/estimated_time.*?(\d+\.?\d*)/)?.[1] || '30'));
            console.log(`[V345]  HF ${model}: cold-starting, wait ${wait}s...`);
            await new Promise(r => setTimeout(r, wait * 1000));
            // V345: Retry up to 2 times
            for (let retry = 1; retry <= 2; retry++) {
              console.log(`[V345]  HF ${model}: retry ${retry}/2...`);
              const retryRes = await fetch(hfUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: cleanPrompt, parameters: { width: Math.min(width, 1024), height: Math.min(height, 1024), num_inference_steps: isFlux ? 4 : 20 } }),
                signal: AbortSignal.timeout(90000),
              });
              if (retryRes.ok) {
                const buf = Buffer.from(await retryRes.arrayBuffer());
                if (buf.length > 5000) { const h = buf.slice(0,4).toString('hex'); if (h.startsWith('ffd8') || h.startsWith('89504')) { console.log(`[V345]  HF ${model}: SUCCESS after retry ${retry} (${(buf.length/1024).toFixed(0)}KB)`); return buf; } }
              }
              if (retryRes.status === 503) { console.log(`[V345]  HF ${model}: still loading, wait 30s...`); await new Promise(r => setTimeout(r, 30000)); continue; }
              console.warn(`[V345]  HF ${model}: retry ${retry} failed (${retryRes.status})`);
            }
            continue;
          }
          if (response.status === 429) { console.warn(`[V345]  HF: rate limited`); return null; }
          console.warn(`[V345]  HF ${model}: HTTP ${response.status} — ${errText.slice(0, 60)}`);
          continue;
        }
        const buf = Buffer.from(await response.arrayBuffer());
        if (buf.length > 5000) { const h = buf.slice(0,4).toString('hex'); if (h.startsWith('ffd8') || h.startsWith('89504')) { console.log(`[V345]  HF ${model}: SUCCESS (${(buf.length/1024).toFixed(0)}KB)`); return buf; } console.warn(`[V345]  HF ${model}: not image (header: ${h})`); continue; }
        console.warn(`[V345]  HF ${model}: too small (${buf.length} bytes)`);
        continue;
      } catch(e) { console.warn(`[V345]  HF ${model}: ${e.message?.slice(0,60)}`); continue; }
    }
    return null;
  } catch(e) { console.warn(`[V345]  HuggingFace: ${e.message?.slice(0,60)}`); return null; }
}

// ── V347: Pollinations rate limiter — prevent 429 from too many concurrent requests ──
let _ajPollinationsLastImageRequest = 0;
const AJ_POLLINATIONS_IMAGE_MIN_INTERVAL_MS = 3000; // 3s between image requests

async function pollinationsRateLimitWait() {
  const timeSinceLast = Date.now() - _ajPollinationsLastImageRequest;
  if (timeSinceLast < AJ_POLLINATIONS_IMAGE_MIN_INTERVAL_MS) {
    const waitMs = AJ_POLLINATIONS_IMAGE_MIN_INTERVAL_MS - timeSinceLast;
    console.log(`[V347]  Pollinations rate limit: waiting ${waitMs}ms...`);
    await new Promise(r => setTimeout(r, waitMs));
  }
  _ajPollinationsLastImageRequest = Date.now();
}

// V347: Cache Together AI 402 status
let _ajTogether402Cached = false;
let _ajTogether402Time = 0;
const AJ_TOGETHER_402_CACHE_MS = 300_000;

// V347: Cache HuggingFace failure status
let _ajHfFailedCached = false;
let _ajHfFailedTime = 0;
const AJ_HF_FAILED_CACHE_MS = 300_000;

async function generateAIImage(prompt, width = 1344, height = 768, marketImpact = 'neutral') {
  // ── V350: Cloudflare Workers AI PRIMARY — same key that works for news & infographics ──
  //
  // V350 STRATEGY: Sequential with caching
  //   1. Cloudflare Workers AI (PRIMARY — FREE, fast 5-15s, works on Railway)
  //   2. Together AI (FREE tier, may get 402)
  //   3. Pollinations (may get 402 on cloud IPs)
  //   4. HuggingFace (may fail with cold starts)
  //
  // Removed: Pexels, SDK, CLI, Geometric — user wants AI-generated images ONLY

  console.log(`[V350] 🎨 AI Image Generation — Cloudflare-first...`);
  console.log(`[V350]   Prompt: "${prompt.slice(0, 80)}..."`);

  // ── METHOD 1 (PRIMARY): Cloudflare Workers AI ──
  let buffer = await generateImageCloudflareAI(prompt, width, height);
  if (buffer) { console.log(`[V350] ✓✓✓ AI Image via Cloudflare Workers AI (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }

  // ── METHOD 2: Together AI (skip if cached 402) ──
  const now = Date.now();
  if (!_ajTogether402Cached || (now - _ajTogether402Time) > AJ_TOGETHER_402_CACHE_MS) {
    buffer = await generateImageTogether(prompt, width, height);
    if (buffer) { console.log(`[V350] ✓ AI Image via Together AI (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }
    const togetherKey = process.env.TOGETHER_API_KEY;
    if (togetherKey) { _ajTogether402Cached = true; _ajTogether402Time = now; }
  } else {
    console.log(`[V350]   Together AI: skipped (402 cached)`);
  }

  // ── METHOD 3: Pollinations (skip if recently failed) ──
  await pollinationsRateLimitWait();
  buffer = await generateImagePollinations(prompt, width, height);
  if (buffer) { console.log(`[V350] ✓ AI Image via Pollinations (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }

  // ── METHOD 4: HuggingFace (skip if cached failure) ──
  if (!_ajHfFailedCached || (now - _ajHfFailedTime) > AJ_HF_FAILED_CACHE_MS) {
    buffer = await generateImageHuggingFace(prompt, width, height);
    if (buffer) { console.log(`[V350] ✓ AI Image via HuggingFace (${(buffer.length/1024).toFixed(0)}KB)`); return buffer; }
    const hfKey = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
    if (hfKey) { _ajHfFailedCached = true; _ajHfFailedTime = now; }
  } else {
    console.log(`[V350]   HuggingFace: skipped (failure cached)`);
  }

  // ── ALL AI METHODS FAILED ──
  console.error(`[V350] ✗✗✗ ALL AI image methods failed (Cloudflare + Together + Pollinations + HuggingFace)`);
  console.error(`[V350] DIAGNOSTICS: CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN ? 'SET' : 'NOT_SET'} R2_ACCOUNT_ID=${process.env.R2_ACCOUNT_ID ? 'SET' : 'NOT_SET'} TOGETHER_API_KEY=${process.env.TOGETHER_API_KEY ? 'SET' : 'NOT_SET'} HF_API_TOKEN=${(process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN) ? 'SET' : 'NOT_SET'}`);
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// TTS (edge-tts primary, Groq fallback)
// ═══════════════════════════════════════════════════════════════════
const ARABIC_FEMALE_VOICES = [
  'ar-AE-FatimaNeural',
  'ar-EG-SalmaNeural',
  'ar-SA-ZariyahNeural',
  'ar-JO-SanaNeural',
  'ar-KW-NouraNeural',
];
const ENGLISH_FEMALE_VOICES = [
  'en-US-JennyNeural',
  'en-US-AriaNeural',
];
// V5 FIX: French TTS voices for edge-tts
const FRENCH_FEMALE_VOICES = [
  'fr-FR-DeniseNeural',
  'fr-FR-EloiseNeural',
  'fr-CA-SylvieNeural',
];
// V348: Turkish TTS voices for edge-tts
const TURKISH_FEMALE_VOICES = [
  'tr-TR-EmelNeural',      // Best: clear, professional Turkish female
  'tr-TR-GamzeNeural',     // Good: warm, natural Turkish female
];

// V5 FIX: Check Python + edge-tts availability ONCE at startup
let pythonAvailable = null;
async function isPythonEdgeTTS() {
  if (pythonAvailable !== null) return pythonAvailable;
  try {
    const result = await spawnAsync('python3', ['-c', 'import edge_tts; print("ok")'], { timeout: 10000 });
    pythonAvailable = result.status === 0 && result.stdout?.trim() === 'ok';
    if (!pythonAvailable) {
      console.warn('[AJ TTS V5] Python3 + edge_tts NOT available — will use Groq TTS fallback');
    } else {
      console.log('[AJ TTS V5] Python3 + edge_tts available');
    }
  } catch {
    pythonAvailable = false;
    console.warn('[AJ TTS V5] Python3 not found — will use Groq TTS fallback');
  }
  return pythonAvailable;
}

async function generateVoiceover(text, outputPath, locale) {
  // V5 FIX: Select voice list based on locale, including French
  // V348: Added Turkish voice support
  const voiceList = locale === 'en' ? ENGLISH_FEMALE_VOICES
    : locale === 'fr' ? FRENCH_FEMALE_VOICES
    : locale === 'tr' ? TURKISH_FEMALE_VOICES
    : ARABIC_FEMALE_VOICES;
  const cleanedText = stripMarkdown(text);
  const truncated = cleanedText.length > 2000 ? cleanedText.slice(0, 1997) + '...' : cleanedText;
  const tmpTextFile = outputPath.replace('.mp3', '_text.txt');
  writeFileSync(tmpTextFile, truncated, 'utf-8');

  // V5 FIX: Check Python availability FIRST
  if (!(await isPythonEdgeTTS())) {
    console.log('[AJ TTS V5] Skipping edge-tts — Python not available, trying Groq TTS');
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
      // V348: Turkish uses Fritz-PlayAI (no dedicated Turkish Groq voice)
      const groqVoice = locale === 'ar' ? 'Hiba-MSA' : 'Fritz-PlayAI';
        await spawnAsync('curl', [
          '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/audio/speech',
          '-H', `Authorization: Bearer ${groqKey}`,
          '-H', 'Content-Type: application/json',
          '-d', JSON.stringify({ model: 'playai-tts', input: truncated, voice: groqVoice, response_format: 'mp3', speed: 1.1 }),
          '-o', outputPath,
        ], { timeout: 60000 });
        if (existsSync(outputPath) && statSync(outputPath).size > 1000) {
          try { unlinkSync(tmpTextFile); } catch {}
          console.log(`[AJ TTS V5] Groq TTS: SUCCESS (voice: ${groqVoice})`);
          return true;
        }
      } catch (groqErr) {
        console.warn(`[AJ TTS V5] Groq fallback failed: ${groqErr.message?.slice(0, 80)}`);
      }
    }
    try { unlinkSync(tmpTextFile); } catch {}
    console.error(`[AJ TTS V5] ALL TTS methods failed (no Python, Groq unavailable)`);
    return false;
  }

  for (const voice of voiceList) {
    try {
      const pythonCode = `
import asyncio, edge_tts
async def main():
    text = open("${tmpTextFile}", "r", encoding="utf-8").read()
    comm = edge_tts.Communicate(text, "${voice}", rate="+10%", pitch="+2Hz")
    await comm.save("${outputPath}")
asyncio.run(main())
`;
      const result = await spawnAsync('python3', ['-c', pythonCode], {
        timeout: 120000, maxBuffer: 10*1024*1024,
      });
      if (result.status === 0 && existsSync(outputPath)) {
        try { unlinkSync(tmpTextFile); } catch {}
        console.log(`[AJ32-TTS] ${voice} — SUCCESS`);
        return true;
      }
    } catch (err) {
      console.warn(`[AJ32-TTS] ${voice} error: ${err.message?.slice(0, 80)}`);
    }
  }

  // Groq fallback
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      // V348: Turkish uses Fritz-PlayAI (no dedicated Turkish Groq voice)
      const groqVoice = locale === 'ar' ? 'Hiba-MSA' : 'Fritz-PlayAI';
      await spawnAsync('curl', [
        '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/audio/speech',
        '-H', `Authorization: Bearer ${groqKey}`,
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({ model: 'playai-tts', input: truncated, voice: groqVoice, response_format: 'mp3', speed: 1.1 }),
        '-o', outputPath,
      ], { timeout: 60000 });
      if (existsSync(outputPath) && statSync(outputPath).size > 1000) {
        try { unlinkSync(tmpTextFile); } catch {}
        console.log(`[AJ32-TTS] Groq ${groqVoice} — SUCCESS`);
        return true;
      }
    } catch {}
  }

  try { unlinkSync(tmpTextFile); } catch {}
  console.error(`[AJ32-TTS] ALL voices failed for locale=${locale}`);
  return false;
}

function getAudioDuration(path) {
  try {
    const result = spawnSync('ffprobe', [
      '-v', 'quiet', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', path
    ], { encoding: 'utf-8', timeout: 10000 });
    return parseFloat(result.stdout.trim()) || 0;
  } catch { return 0; }
}

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND MUSIC — V32: Warm Arabic maqam-inspired ambient
// ═══════════════════════════════════════════════════════════════════
function generateBackgroundMusic(outputPath, durationSeconds) {
  const dur = Math.ceil(durationSeconds) + 5;
  console.log(`[AJ32]  Generating warm ambient music (${dur}s)...`);
  try {
    const inputs = [];
    // V32: Maqam Rast-inspired frequencies — warm, Middle Eastern
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=65.41:duration=${dur}`);   // C2 — deep root
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=130.81:duration=${dur}`);  // C3
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=155.56:duration=${dur}`);  // Eb3 — Rast quarter tone
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=196:duration=${dur}`);     // G3
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=246.94:duration=${dur}`);  // B3 — natural 7th
    inputs.push('-f', 'lavfi', '-i', `sine=frequency=329.63:duration=${dur}`);  // E4 — fifth of G

    const filterComplex = [
      '[0:a]volume=0.02[sub]',
      '[1:a]volume=0.025[root]',
      '[2:a]volume=0.018[third]',
      '[3:a]volume=0.02[fifth]',
      '[4:a]volume=0.012[seventh]',
      '[5:a]volume=0.008[tex]',
      '[sub][root][third][fifth][seventh][tex]amix=6:duration=longest:dropout_transition=5[mixed]',
      '[mixed]tremolo=f=0.15:d=0.25[trem]',
      '[trem]lowpass=f=400[lp]',
      '[lp]highpass=f=30[hp]',
      '[hp]acompressor=threshold=0.05:ratio=3:attack=5:release=150[comp]',
      '[comp]afade=t=in:st=0:d=6[fin]',
      `[fin]afade=t=out:st=${dur - 12}:d=12[final]`,
    ].join(',');

    const result = spawnSync('ffmpeg', [
      '-y', ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[final]',
      '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });

    if (result.status !== 0) {
      console.warn(`[AJ32]  Music generation failed: ${result.stderr?.slice(-200)}`);
      return false;
    }
    const success = existsSync(outputPath);
    if (success) console.log(`[AJ32]  Background music generated`);
    return success;
  } catch (err) {
    console.warn(`[AJ32]  Music error: ${err.message}`);
    return false;
  }
}

function mixAudioWithMusic(narrationPath, musicPath, outputPath, musicVolume = 0.15) {
  try {
    const totalDuration = getAudioDuration(narrationPath) || 120;
    const filterComplex = [
      `[1:a]volume=${musicVolume},afade=t=in:st=0:d=5,afade=t=out:st=${totalDuration-8}:d=8[music]`,
      `[0:a][music]amix=2:duration=shortest:dropout_transition=3:normalize=0[aout]`,
    ].join(';');
    const result = spawnSync('ffmpeg', [
      '-y', '-i', narrationPath, '-i', musicPath,
      '-filter_complex', filterComplex,
      '-map', '[aout]',
      '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });
    if (result.status !== 0) {
      const simpleFilter = `[1:a]volume=${musicVolume}[music];[0:a][music]amix=2:duration=shortest:dropout_transition=3:normalize=0[aout]`;
      const fallback = spawnSync('ffmpeg', [
        '-y', '-i', narrationPath, '-i', musicPath,
        '-filter_complex', simpleFilter,
        '-map', '[aout]',
        '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '48000', '-ac', '2',
        outputPath,
      ], { encoding: 'utf-8', timeout: 60000 });
      if (fallback.status !== 0) return false;
    }
    return existsSync(outputPath);
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════════
// PER-SCENE NARRATION — 6 Scenes, LLM-powered with template fallback
// ═══════════════════════════════════════════════════════════════════
async function generateNarrationLLM(data) {
  const locale = data.locale || 'ar';
  const isAr = locale === 'ar';
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const impactLabel = getImpactLabel(data.market_impact, locale);
    const impactArrow = getImpactArrow(data.market_impact);
    const stats = (data.stats || []).map(s => `${s.label}: ${s.value}`).join('، ');
    const keyPoints = (data.key_points || []).slice(0, 5).join('. ');
    const rootCauses = (data.root_causes || []).map(r => `${r.title}: ${r.description}`).join('. ');
    const scenarios = (data.scenarios || []).map(s => `${s.title} (${s.probability}): ${s.result}`).join('. ');
    const takeaways = (data.strategic_takeaways || []).map(t => `${t.title}: ${t.detail}`).join('. ');
    const recs = (data.recommendations || []).map(r => `${r.asset}: ${r.action}`).join('. ');

    const systemPrompt = isAr
      ? `أنت مذيعة في قناة الجزيرة بأسلوب صحافة البيانات. مهمتك كتابة نص تعليق صوتي لتقرير فيديو (أقل من 3 دقائق). القواعد: 1. عربية فصحى سلسة 2. لا كلمات إنجليزية 3. كل مشهد 2-4 جمل 4. ادخل الموضوع مباشرة 5. لا تنسيق Markdown 6. ربط طبيعي بين الأفكار`
      : locale === 'tr'
      ? `Sen Al Jazeera veri gazeteciliği tarzında bir spikerisin. Kısa bir veri video raporu (3 dk altında) için seslendirme metni yazacaksın. Kurallar: 1. Temiz doğal Türkçe 2. Her sahne 2-4 cümle 3. Doğrudan konuya gir 4. Markdown biçimlendirmesi yok 5. Doğal geçişler`
      : `You are an Al Jazeera data journalism narrator. Write voiceover for a short data video report (under 3 min). Rules: 1. Clear natural English 2. 2-4 sentences per scene 3. Get straight to the point 4. No Markdown formatting 5. Natural transitions`;

    const userPrompt = isAr
      ? `اكتب 6 فقرات تعليق صوتي لتقرير بعنوان: "${data.title || 'تقرير اقتصادي'}"
تأثير السوق: ${impactArrow} ${impactLabel}
S1 (الخطاف - 15 ثانية): الرقم الرئيسي المثير مع عد تصاعدي — جملتان فقط. البيانات: ${stats}
S2 (الخريطة - 30 ثانية): المناطق المتأثرة والسياق الجغرافي مع أرقام عد تصاعدي — البيانات: ${stats}. النقاط: ${keyPoints}
S3 (الخط الزمني - 35 ثانية): الأحداث والأسباب عبر الزمن بشكل خط زمني عمودي — ${rootCauses || 'تطورات فنية'}
S4 (البيانات - 35 ثانية): مقارنة الأرقام بعد تصاعدي ثم أعمدة — ${scenarios || 'الاتجاه ' + impactLabel}
S5 (قصة إنسانية - 30 ثانية): البعد الإنساني والعاطفي والأثر على الناس — البيانات تعكس حياة حقيقية
S6 (الختام - 25 ثانية): الاستنتاجات والتوصيات والمصادر — ${takeaways}. اختم بـ: شكراً لمتابعتكم رؤى
أجب بهذا الشكل فقط:
S1: ...
S2: ...
S3: ...
S4: ...
S5: ...
S6: ...`
      : locale === 'tr'
      ? `"${data.title || 'Ekonomik Rapor'}" başlıklı rapor için 6 seslendirme paragrafı yaz
Piyasa etkisi: ${impactArrow} ${impactLabel}
S1 (Kanca - 15s): Dramatik ana sayı ve sayaç animasyonu — sadece iki cümle. Veriler: ${stats}
S2 (Harita - 30s): Etkilenen bölgeler ve coğrafi bağlam — Veriler: ${stats}. Noktalar: ${keyPoints}
S3 (Zaman Çizelgesi - 35s): Zaman içinde olaylar ve nedenler — ${rootCauses || 'Teknik gelişmeler'}
S4 (Veri Görselleştirme - 35s): Sayı karşılaştırmaları ve çubuk grafik — ${scenarios || 'Yön: ' + impactLabel}
S5 (İnsan Hikayesi - 30s): Duygusal insan boyutu ve gerçek hayatlara etkisi
S6 (Kapanış - 25s): Sonuçlar, kaynaklar ve öneriler — ${takeaways}. Şununla bitir: Rouaa'yı izlediğiniz için teşekkürler
SADECE bu formatta cevap ver:
S1: ...
S2: ...
S3: ...
S4: ...
S5: ...
S6: ...`
      : `Write 6 voiceover paragraphs for report: "${data.title || 'Economic Report'}"
Market impact: ${impactArrow} ${impactLabel}
S1 (Hook - 15s): The dramatic key number with counter animation — two sentences only. Data: ${stats}
S2 (Map - 30s): Affected regions with counter animations and geographic context — Data: ${stats}. Points: ${keyPoints}
S3 (Timeline - 35s): Events and causes over time in vertical timeline — ${rootCauses || 'Technical developments'}
S4 (DataViz - 35s): Counter-first number comparisons then bar chart — ${scenarios || 'Direction: ' + impactLabel}
S5 (Human Story - 30s): Emotional human dimension and impact on real people — data reflects real lives
S6 (Closing - 25s): Conclusions, source credits and recommendations — ${takeaways}. End with: Thank you for watching Rouaa
Answer ONLY in this format:
S1: ...
S2: ...
S3: ...
S4: ...
S5: ...
S6: ...`;

    console.log('[AJ32]  Calling LLM for narration...');
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, max_tokens: 2000,
    });

    const rawText = completion.choices?.[0]?.message?.content || '';
    const parts = [];
    for (let i = 1; i <= 6; i++) {
      const regex = new RegExp(`S${i}\\s*:\\s*(.+?)(?=S${i+1}\\s*:|$)`, 's');
      const match = rawText.match(regex);
      if (match) {
        parts.push(stripMarkdown(match[1].trim().replace(/\n+/g, ' ')));
      } else {
        parts.push(null);
      }
    }
    const templateParts = generateNarrationTemplate(data);
    for (let i = 0; i < 6; i++) {
      if (!parts[i] || parts[i].length < 10) parts[i] = templateParts[i];
    }
    console.log('[AJ32]  LLM narration generated');
    return parts;
  } catch (err) {
    console.warn(`[AJ32]  LLM narration failed: ${err.message?.slice(0, 100)}`);
    return generateNarrationTemplate(data);
  }
}

function generateNarrationTemplate(data) {
  const locale = data.locale || 'ar';
  const isAr = locale === 'ar';
  const parts = [];
  const impactLabel = getImpactLabel(data.market_impact, locale);
  const impactArrow = getImpactArrow(data.market_impact);
  const stats = data.stats || [];
  const keyPoints = data.key_points || [];
  const rootCauses = data.root_causes || [];
  const scenarios = data.scenarios || [];
  const takeaways = data.strategic_takeaways || [];
  const recs = data.recommendations || [];

  // S1: Hook
  if (isAr) {
    const mainStat = stats[0];
    parts.push(mainStat
      ? `${mainStat.label} يسجل ${mainStat.value}. تأثير السوق: ${impactArrow} ${impactLabel}`
      : `${data.title || 'تقرير اقتصادي'}. تأثير السوق: ${impactArrow} ${impactLabel}`);
  } else if (locale === 'tr') {
    const mainStat = stats[0];
    parts.push(mainStat
      ? `${mainStat.label} ${mainStat.value} seviyesinde. Piyasa etkisi: ${impactArrow} ${impactLabel}`
      : `${data.title || 'Ekonomik Rapor'}. Piyasa etkisi: ${impactArrow} ${impactLabel}`);
  } else {
    const mainStat = stats[0];
    parts.push(mainStat
      ? `${mainStat.label} records ${mainStat.value}. Market impact: ${impactArrow} ${impactLabel}`
      : `${data.title || 'Economic Report'}. Market impact: ${impactArrow} ${impactLabel}`);
  }

  // S2: Map
  if (isAr) {
    let s2 = '';
    if (stats.length > 0) s2 += 'المناطق المتأثرة تسجل: ' + stats.map(s => `${s.label} عند ${s.value}`).join('، ');
    if (keyPoints.length > 0) s2 += (s2 ? '. وعلى صعيد التطورات، ' : '') + keyPoints.slice(0, 3).join('. ');
    if (!s2) s2 = 'البيانات تشير إلى تأثيرات جغرافية مهمة';
    parts.push(s2);
  } else if (locale === 'tr') {
    let s2 = '';
    if (stats.length > 0) s2 += 'Etkilenen bölgeler: ' + stats.map(s => `${s.label}: ${s.value}`).join(', ');
    if (keyPoints.length > 0) s2 += (s2 ? '. Gelişmeler: ' : '') + keyPoints.slice(0, 3).join('. ');
    if (!s2) s2 = 'Veriler önemli coğrafi etkileri gösteriyor';
    parts.push(s2);
  } else {
    let s2 = '';
    if (stats.length > 0) s2 += 'Affected regions record: ' + stats.map(s => `${s.label} at ${s.value}`).join(', ');
    if (keyPoints.length > 0) s2 += (s2 ? '. On developments, ' : '') + keyPoints.slice(0, 3).join('. ');
    if (!s2) s2 = 'Data points to significant geographic impacts';
    parts.push(s2);
  }

  // S3: Timeline
  if (isAr) {
    let s3 = '';
    if (rootCauses.length > 0) s3 += 'تطور الأحداث: ' + rootCauses.map(r => `${r.title} حيث ${r.description}`).join('. ');
    if (!s3) s3 = 'الأحداث تتطور عبر الزمن وتستدعي المتابعة';
    parts.push(s3);
  } else if (locale === 'tr') {
    let s3 = '';
    if (rootCauses.length > 0) s3 += 'Olayların gelişimi: ' + rootCauses.map(r => `${r.title} — ${r.description}`).join('. ');
    if (!s3) s3 = 'Olaylar zaman içinde gelişiyor ve izlenmesi gerekiyor';
    parts.push(s3);
  } else {
    let s3 = '';
    if (rootCauses.length > 0) s3 += 'Events timeline: ' + rootCauses.map(r => `${r.title} — ${r.description}`).join('. ');
    if (!s3) s3 = 'Events evolve over time and warrant monitoring';
    parts.push(s3);
  }

  // S4: DataViz
  if (isAr) {
    if (scenarios.length > 0) {
      parts.push('السيناريوهات المحتملة: ' + scenarios.map(s => `${s.title} باحتمالية ${s.probability}`).join('. '));
    } else {
      parts.push(`الاتجاه العام يتجه نحو المسار ${impactLabel}`);
    }
  } else if (locale === 'tr') {
    if (scenarios.length > 0) {
      parts.push('Olası senaryolar: ' + scenarios.map(s => `${s.title} %${s.probability} olasılıkla`).join('. '));
    } else {
      parts.push(`Genel yön: ${impactLabel}`);
    }
  } else {
    if (scenarios.length > 0) {
      parts.push('Likely scenarios: ' + scenarios.map(s => `${s.title} at ${s.probability}`).join('. '));
    } else {
      parts.push(`Overall direction is ${impactLabel}`);
    }
  }

  // S5: Human Story
  if (isAr) {
    parts.push('خلف هذه الأرقام قصص حقيقية لأشخاص يتأثرون بهذه التغيرات يومياً. البيانات ليست مجرد أرقام بل تعكس حياة الناس');
  } else if (locale === 'tr') {
    parts.push('Bu rakamların arkasında bu değişimlerden günlük olarak etkilenen gerçek insan hikayeleri var. Veriler sadece rakamlar değil — gerçek hayatları yansıtıyor');
  } else {
    parts.push('Behind these numbers are real stories of people affected by these changes daily. Data is not just numbers — it reflects real lives');
  }

  // S6: Closing
  if (isAr) {
    let s6 = '';
    if (takeaways.length > 0) s6 += takeaways.slice(0, 3).map(t => `${t.title}: ${t.detail}`).join('. ');
    s6 += (s6 ? '. ' : '') + 'شكراً لمتابعتكم رؤى';
    parts.push(s6);
  } else if (locale === 'tr') {
    let s6 = '';
    if (takeaways.length > 0) s6 += takeaways.slice(0, 3).map(t => `${t.title}: ${t.detail}`).join('. ');
    s6 += (s6 ? '. ' : '') + 'Rouaa\'yı izlediğiniz için teşekkürler';
    parts.push(s6);
  } else {
    let s6 = '';
    if (takeaways.length > 0) s6 += takeaways.slice(0, 3).map(t => `${t.title}: ${t.detail}`).join('. ');
    s6 += (s6 ? '. ' : '') + 'Thank you for watching Rouaa';
    parts.push(s6);
  }

  return parts;
}

async function generatePerSceneVoiceover(narrationParts, tmpDir, locale) {
  const audioPaths = [];
  const audioDurations = [];
  for (let i = 0; i < narrationParts.length; i++) {
    const text = narrationParts[i];
    if (!text || text.trim().length === 0) {
      audioPaths.push(null);
      audioDurations.push(0);
      continue;
    }
    const audioPath = join(tmpDir, `scene_${i}_voice.mp3`);
    const success = await generateVoiceover(text, audioPath, locale);
    if (success && existsSync(audioPath)) {
      const duration = getAudioDuration(audioPath);
      audioPaths.push(audioPath);
      audioDurations.push(duration);
      console.log(`[AJ32]  Scene ${i+1} voiceover: ${duration.toFixed(2)}s`);
    } else {
      audioPaths.push(null);
      audioDurations.push(0);
    }
  }
  return { audioPaths, audioDurations };
}

function concatenateAudioSegments(audioPaths, outputPath) {
  const validPaths = audioPaths.filter(p => p && existsSync(p));
  if (validPaths.length === 0) return false;
  const concatListPath = outputPath.replace('.mp3', '_concat.txt');
  writeFileSync(concatListPath, validPaths.map(p => `file '${p}'`).join('\n'), 'utf-8');
  try {
    const result = spawnSync('ffmpeg', [
      '-y', '-f', 'concat', '-safe', '0',
      '-i', concatListPath,
      '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });
    try { unlinkSync(concatListPath); } catch {}
    if (result.status !== 0) return false;
    return existsSync(outputPath);
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════════
// DATA ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════
function enhanceData(data) {
  const enhanced = { ...data };
  const locale = enhanced.locale || 'ar';

  if (!enhanced._unifiedDate) {
    if (enhanced.date && enhanced.date.trim()) {
      enhanced._unifiedDate = enhanced.date.trim();
    } else {
      const now = new Date();
      try {
        enhanced._unifiedDate = now.toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'tr' ? 'tr-TR' : 'en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      } catch {
        enhanced._unifiedDate = now.toISOString().split('T')[0];
      }
    }
    enhanced.date = enhanced._unifiedDate;
  }

  if (!enhanced.stats || enhanced.stats.length === 0) {
    const impact = enhanced.market_impact || 'neutral';
    const isPos = ['bullish','positive'].includes(impact);
    const isNeg = ['bearish','negative'].includes(impact);
    enhanced.stats = [
      { label: locale === 'ar' ? 'مؤشر المشاعر' : locale === 'tr' ? 'Duygu Endeksi' : 'Sentiment', value: isPos ? '67.5%' : isNeg ? '28.3%' : '49.2%', description: '' },
      { label: locale === 'ar' ? 'مؤشر التذبذب' : locale === 'tr' ? 'Volatilite' : 'Volatility', value: isNeg ? '28.4%' : isPos ? '14.2%' : '19.7%', description: '' },
      { label: locale === 'ar' ? 'حجم التداول' : locale === 'tr' ? 'İşlem Hacmi' : 'Volume', value: '1.2M', description: '' },
      { label: locale === 'ar' ? 'الزخم' : locale === 'tr' ? 'Momentum' : 'Momentum', value: isPos ? '+3.2%' : isNeg ? '-2.8%' : '+0.1%', description: '' },
    ];
  }

  if (!enhanced.root_causes || enhanced.root_causes.length === 0) {
    enhanced.root_causes = [
      { title: locale === 'ar' ? 'عوامل العرض والطلب' : locale === 'tr' ? 'Arz & Talep' : 'Supply & Demand', description: locale === 'ar' ? 'تحولات في ديناميكيات السوق' : locale === 'tr' ? 'Piyasa dinamiğindeki değişimler' : 'Shifts in market dynamics', icon: '📊' },
      { title: locale === 'ar' ? 'تحركات رأس المال' : locale === 'tr' ? 'Sermaye Akışları' : 'Capital Flows', description: locale === 'ar' ? 'تدفقات دولية تؤثر على الأسعار' : locale === 'tr' ? 'Fiyatları etkileyen uluslararası akışlar' : 'International flows impacting prices', icon: '💰' },
      { title: locale === 'ar' ? 'سياسات البنوك المركزية' : locale === 'tr' ? 'Merkez Bankası Politikası' : 'Central Bank Policy', description: locale === 'ar' ? 'قرارات نقدية توجه الأسواق' : locale === 'tr' ? 'Piyasaları yönlendiren para kararları' : 'Monetary decisions guiding markets', icon: '🏛️' },
    ];
  }

  if (!enhanced.scenarios || enhanced.scenarios.length === 0) {
    enhanced.scenarios = [
      { title: locale === 'ar' ? 'السيناريو المتفائل' : locale === 'tr' ? 'İyimser' : 'Optimistic', result: locale === 'ar' ? 'تعافٍ أسرع' : locale === 'tr' ? 'Hızlı toparlanma' : 'Faster recovery', probability: '35%', color: 'green' },
      { title: locale === 'ar' ? 'السيناريو الأساسي' : locale === 'tr' ? 'Temel Senaryo' : 'Base Case', result: locale === 'ar' ? 'نمو معتدل' : locale === 'tr' ? 'Ilımlı büyüme' : 'Moderate growth', probability: '45%', color: 'yellow' },
      { title: locale === 'ar' ? 'السيناريو المتشائم' : locale === 'tr' ? 'Kötümser' : 'Pessimistic', result: locale === 'ar' ? 'تراجع حاد' : locale === 'tr' ? 'Keskin düşüş' : 'Sharp decline', probability: '20%', color: 'red' },
    ];
  }

  if (!enhanced.strategic_takeaways || enhanced.strategic_takeaways.length === 0) {
    const impact = enhanced.market_impact || 'neutral';
    enhanced.strategic_takeaways = [
      { title: locale === 'ar' ? 'فرص محتملة' : locale === 'tr' ? 'Fırsatlar' : 'Opportunities', detail: locale === 'ar' ? 'البيانات تشير إلى مسار جديد' : locale === 'tr' ? 'Veriler yeni bir eğilim gösteriyor' : 'Data indicates a new trajectory', color: ['bullish','positive'].includes(impact) ? 'green' : 'gold' },
      { title: locale === 'ar' ? 'المؤشر الرئيسي' : locale === 'tr' ? 'Temel Gösterge' : 'Key Metric', detail: `${enhanced.stats[0].label}: ${enhanced.stats[0].value}`, color: 'gold' },
      { title: locale === 'ar' ? 'إدارة المخاطر' : locale === 'tr' ? 'Risk Yönetimi' : 'Risk Management', detail: locale === 'ar' ? 'تنويع المحفظة أمر بالغ الأهمية' : locale === 'tr' ? 'Portföy çeşitlendirmesi kritik' : 'Diversification is crucial', color: ['bearish','negative'].includes(impact) ? 'red' : 'gold' },
    ];
  }

  if (!enhanced.benefiting_assets || enhanced.benefiting_assets.length === 0) {
    enhanced.benefiting_assets = [
      { name: locale === 'ar' ? 'الذهب' : locale === 'tr' ? 'Altın' : 'Gold', symbol: 'XAU', reason: locale === 'ar' ? 'ملاذ آمن' : locale === 'tr' ? 'Güvenli liman' : 'Safe haven' },
      { name: locale === 'ar' ? 'الدولار' : locale === 'tr' ? 'Dolar' : 'USD', symbol: 'DXY', reason: locale === 'ar' ? 'تحفظي' : locale === 'tr' ? 'Savunmacı' : 'Defensive' },
    ];
  }

  if (!enhanced.harmed_assets || enhanced.harmed_assets.length === 0) {
    enhanced.harmed_assets = [
      { name: locale === 'ar' ? 'الأسهم الناشئة' : locale === 'tr' ? 'Gelişen Piyasalar' : 'Emerging Equities', symbol: 'EEM', reason: locale === 'ar' ? 'مخاطرة عالية' : locale === 'tr' ? 'Yüksek risk' : 'High risk' },
    ];
  }

  if (!enhanced.recommendations || enhanced.recommendations.length === 0) {
    enhanced.recommendations = [
      { horizon: 'daily', asset: locale === 'ar' ? 'الذهب' : locale === 'tr' ? 'Altın' : 'Gold', action: locale === 'ar' ? 'شراء عند التراجع' : locale === 'tr' ? 'Düşüşte satın al' : 'Buy on dip', entry: '2020', target: '2080', stop: '1990', allocation: '15%' },
      { horizon: 'medium', asset: locale === 'ar' ? 'إس آند بي 500' : locale === 'tr' ? 'S&P 500' : 'S&P 500', action: locale === 'ar' ? 'تراكم تدريجي' : locale === 'tr' ? 'Kademeli biriktir' : 'Accumulate gradually', entry: '5200', target: '5600', stop: '5000', allocation: '25%' },
    ];
  }

  return enhanced;
}

// ═══════════════════════════════════════════════════════════════════
// HTML SCENE GENERATORS — V32 Al Jazeera AJ Labs
// Peninsula Square motif, warm navy, counter animations, lower-thirds
// ═══════════════════════════════════════════════════════════════════

// Helper: parse numeric value from stat string (Node.js side)
function parseNumericValueStr(str) {
  if (typeof str === 'number') return str;
  var s = String(str).replace(/[^0-9.-]/g, '');
  var n = parseFloat(s);
  if (isNaN(n)) return 100;
  var lc = String(str).toLowerCase();
  if (lc.includes('b')) n *= 1e9;
  else if (lc.includes('m')) n *= 1e6;
  else if (lc.includes('k')) n *= 1e3;
  return n;
}

// ─── V32 Shared CSS: AJ Labs persistent elements ──
function persistentElementsCSS(isRTL) {
  const rtl = isRTL ? 'right' : 'left';
  const rtlInv = isRTL ? 'left' : 'right';
  return `
    /* ═══ GOLD ACCENT LINE — 3px top of frame, wider glow ═══ */
    .aj-gold-line {
      position:absolute; top:0; ${rtl}:0;
      height:3px; width:100%;
      background: linear-gradient(${isRTL ? '270deg' : '90deg'}, ${AJ.gold}, ${AJ.paleGold} 40%, ${AJ.amberGlow} 70%, transparent);
      z-index:60;
    }
    /* Subtle amber glow beneath gold line */
    .aj-gold-glow {
      position:absolute; top:0; ${rtl}:0;
      height:20px; width:100%;
      background: linear-gradient(180deg, rgba(219,162,0,0.08) 0%, transparent);
      z-index:59; pointer-events:none;
    }

    /* ═══ PENINSULA SQUARE — the 2022 rebrand motif ═══ */
    .aj-peninsula {
      position:absolute; top:18px; ${rtlInv}:28px;
      width:${PENINSULA_SIZE}px; height:${PENINSULA_SIZE}px;
      border:2px solid ${AJ.gold}; border-radius:${PENINSULA_RADIUS}px;
      z-index:58; opacity:0.5;
      transition: transform 0.5s ease, opacity 0.5s ease;
    }
    .aj-peninsula::after {
      content:''; position:absolute; top:50%; ${rtl}:50%;
      transform:translate(-50%,-50%);
      width:6px; height:6px; background:${AJ.gold};
      border-radius:1px;
    }

    /* ═══ CATEGORY LABEL — ALL-CAPS with underline ═══ */
    .aj-category {
      position:absolute; top:28px; ${rtl}:50px;
      font-size:13px; font-weight:600; color:${AJ.paleGold};
      letter-spacing:3.5px; text-transform:uppercase; z-index:55;
      font-family:'IBM Plex Mono','Inter',monospace;
      opacity:0; transition: opacity 0.6s ease;
    }
    .aj-category-line {
      position:absolute; top:46px; ${rtl}:50px;
      width:0px; height:1.5px;
      background:${AJ.gold}; z-index:55;
      transition: width 0.8s ease;
    }

    /* ═══ SOURCE LINE — small gray text at very bottom ═══ */
    .aj-source {
      position:absolute; bottom:30px; ${rtl}:40px;
      font-size:11px; color:${AJ.textDim}; z-index:55;
      font-family:'IBM Plex Mono','Inter',monospace;
      letter-spacing:0.5px;
    }

    /* ═══ AJ LABS BUG — bottom corner ═══ */
    .aj-labs-bug {
      position:absolute; bottom:14px; ${rtlInv}:24px;
      font-size:11px; font-weight:600; color:${AJ.gold};
      opacity:0.45; z-index:55; letter-spacing:1.5px;
      font-family: 'Noto Sans Arabic', 'IBM Plex Mono', sans-serif;
    }

    /* ═══ PROGRESS TIMELINE BAR — Peninsula Square slides along it ═══ */
    .aj-progress-track {
      position:absolute; bottom:0; ${rtl}:0;
      height:3px; width:100%; background:${AJ.subtleGold}; z-index:55;
    }
    .aj-progress-fill {
      height:100%; width:0%; z-index:56;
      background: linear-gradient(${isRTL ? '270deg' : '90deg'}, ${AJ.gold}, ${AJ.paleGold});
      transition: width 0.1s linear;
    }
    /* Peninsula Square on progress bar */
    .aj-progress-square {
      position:absolute; bottom:-2px; ${rtl}:0px;
      width:7px; height:7px; background:${AJ.gold};
      border-radius:1px; z-index:57;
      transition: ${rtl} 0.1s linear;
    }

    /* ═══ LOWER-THIRD — AJ's signature info strip ═══ */
    .aj-lower-third {
      position:absolute; bottom:50px; ${rtl}:0; ${rtlInv}:0;
      height:56px; z-index:40;
      background: linear-gradient(${isRTL ? '270deg' : '90deg'}, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.85) 80%, rgba(10,22,40,0.6) 100%);
      border-top:2px solid ${AJ.gold};
      display:flex; align-items:center;
      padding:0 40px; opacity:0;
      transition: opacity 0.5s ease;
    }
    .aj-lt-sq {
      width:8px; height:8px; background:${AJ.gold};
      margin-${rtlInv}:14px; flex-shrink:0; border-radius:1px;
    }
    .aj-lt-text {
      font-size:16px; color:${AJ.warmWhite};
      font-family:'Noto Sans Arabic','Inter',sans-serif;
      font-weight:500; line-height:1.3;
    }
    .aj-lt-detail {
      font-size:13px; color:${AJ.textGray};
      margin-${rtlInv}:20px;
      font-family:'IBM Plex Mono','Inter',monospace;
    }

    /* ═══ SMALL GOLD SQUARE BULLET — 8px ═══ */
    .aj-sq-bullet {
      width:8px; height:8px; background:${AJ.gold}; flex-shrink:0;
      margin-${rtlInv}:12px; border-radius:1px;
    }
  `;
}

// ─── V32 Shared: Background image + warm overlay ──
function bgImageCSS() {
  return `
    .aj-bg-image {
      position:absolute; top:0; left:0; right:0; bottom:0;
      overflow:hidden; z-index:0;
    }
    .aj-bg-img {
      position:absolute; top:0; left:0; width:100%; height:100%;
      object-fit:cover; filter: brightness(0.25) saturate(0.35) sepia(0.15) contrast(1.05);
      will-change: transform;
    }
    .aj-bg-overlay {
      position:absolute; top:0; left:0; right:0; bottom:0;
      z-index:1;
    }
  `;
}

function getBgImageHTML(bgImages, sceneIndex, overlayOpacity = 0.7) {
  const bgV2 = bgImages[sceneIndex] || bgImages[0] || null;
  let bgImageB64 = '';
  if (bgV2 && typeof bgV2 === 'object' && bgV2.base64) {
    bgImageB64 = bgV2.base64 || '';
  } else if (Array.isArray(bgImages) && typeof bgImages[0] === 'string') {
    bgImageB64 = bgImages[sceneIndex] || bgImages[0] || '';
  }
  const hasBgImage = bgImageB64.length > 100;
  // V32: Warm overlay with amber tint
  const overlay = `linear-gradient(180deg, rgba(10,22,40,${overlayOpacity}) 0%, rgba(10,22,40,${overlayOpacity*0.65}) 50%, rgba(10,22,40,${overlayOpacity}) 100%)`;
  if (hasBgImage) {
    // V340 FIX: Detect SVG base64 properly — SVG starts with PHN2Zy or PD94bW
    // Previously defaulted to image/jpeg for SVGs, making them invisible!
    let mime;
    if (bgImageB64.startsWith('PHN2Zy') || bgImageB64.startsWith('PD94bW') || bgImageB64.startsWith('PHN2Zw')) {
      mime = 'image/svg+xml';
    } else if (bgImageB64.startsWith('/9j/')) {
      mime = 'image/jpeg';
    } else if (bgImageB64.startsWith('iVBOR')) {
      mime = 'image/png';
    } else if (bgImageB64.startsWith('UklGR')) {
      mime = 'image/webp';
    } else {
      mime = 'image/jpeg'; // default for unknown formats
    }
    return `<div class="aj-bg-image"><img class="aj-bg-img" src="data:${mime};base64,${bgImageB64}"/><div class="aj-bg-overlay" style="background:${overlay}"></div></div>`;
  }
  return '';
}

// ─── V32 Shared: Counter animation JavaScript ──
function counterAnimationJS() {
  return `
    function formatCounterValue(val, suffix) {
      var abs = Math.abs(val);
      if (abs >= 1e9) return (val / 1e9).toFixed(1) + 'B';
      if (abs >= 1e6) return (val / 1e6).toFixed(1) + 'M';
      if (abs >= 1e3) return (val / 1e3).toFixed(1) + 'K';
      if (val % 1 !== 0) return val.toFixed(1) + (suffix || '');
      return Math.round(val) + (suffix || '');
    }
    function animateCounter(el, startVal, endVal, progress, suffix) {
      // V32: easeOutQuart — more deliberate, AJ-style
      var p = Math.max(0, Math.min(1, progress));
      var eased = 1 - Math.pow(1 - p, 4);
      var current = startVal + (endVal - startVal) * eased;
      el.textContent = formatCounterValue(current, suffix);
    }
    function parseNumericValue(str) {
      if (typeof str === 'number') return str;
      var s = String(str).replace(/[^0-9.-]/g, '');
      var n = parseFloat(s);
      if (isNaN(n)) return 0;
      var lc = String(str).toLowerCase();
      if (lc.includes('b')) n *= 1e9;
      else if (lc.includes('m')) n *= 1e6;
      else if (lc.includes('k')) n *= 1e3;
      return n;
    }
    function getSuffix(str) {
      var lc = String(str).toLowerCase();
      if (lc.includes('%')) return '%';
      return '';
    }
  `;
}

// ─── V32 Shared: Scene transition wrapper (horizontal slide) ──
function sceneTransitionCSS(isRTL) {
  return `
    .scene-wrapper {
      position:absolute; top:0; left:0; right:0; bottom:0;
      opacity:0; transform:translateX(${isRTL ? '-40px' : '40px'});
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .scene-wrapper.visible {
      opacity:1; transform:translateX(0);
    }
  `;
}

// V32: Warm ambient background CSS (replaces cold gradients)
function warmAmbientBgCSS() {
  return `
    .warm-ambient {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background:
        radial-gradient(ellipse at 55% 35%, rgba(33,46,100,0.12) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 80%, rgba(219,162,0,0.04) 0%, transparent 40%),
        linear-gradient(180deg, #0A1628 0%, #0E1A30 45%, #0A1628 100%);
      z-index:0;
    }
  `;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 1: HOOK (0-15s) — Counter + Peninsula Square expands
// ═══════════════════════════════════════════════════════════════════
function generateHookHTML(data) {
  const isRTL = data.locale === 'ar';
  const mainStat = data.stats?.[0] || { label: data.title || (isRTL ? 'تقرير' : data.locale === 'tr' ? 'Rapor' : 'Report'), value: '—' };
  const mainNumber = String(mainStat.value);
  const mainLabel = truncateText(mainStat.label, 35);
  const numericVal = parseNumericValueStr(mainStat.value);
  const suffix = mainNumber.includes('%') ? '%' : '';
  const categoryLabel = isRTL ? 'بالأرقام' : data.locale === 'tr' ? 'RAKAMLARLA' : 'BY THE NUMBERS';

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
      background:${AJ.darkBg}; color:${AJ.textWhite};
      direction:${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing:antialiased;
    }
    ${bgImageCSS()}
    ${persistentElementsCSS(isRTL)}
    ${warmAmbientBgCSS()}

    /* Counter number — MASSIVE, center of screen */
    .hook-counter {
      position:absolute; top:42%; ${isRTL ? 'right' : 'left'}:50%;
      transform:translate(${isRTL ? '50%' : '-50%'}, -50%);
      font-size:180px; font-weight:900; color:${AJ.warmWhite};
      font-family:'IBM Plex Mono','Inter',monospace;
      line-height:1; letter-spacing:-5px;
      z-index:20; text-align:center;
      opacity:0; text-shadow: 0 0 80px rgba(219,162,0,0.15);
    }

    /* Gold underline — draws itself */
    .hook-underline {
      position:absolute; top:42%; ${isRTL ? 'right' : 'left'}:50%;
      transform:translate(${isRTL ? '50%' : '-50%'}, 50px);
      width:0px; height:2.5px;
      background: linear-gradient(${isRTL ? '270deg' : '90deg'}, ${AJ.gold}, ${AJ.paleGold}, transparent);
      z-index:20;
      transition: width 0.4s ease;
    }

    /* Label below underline */
    .hook-label {
      position:absolute; top:42%; ${isRTL ? 'right' : 'left'}:50%;
      transform:translate(${isRTL ? '50%' : '-50%'}, 78px);
      font-size:28px; font-weight:500; color:${AJ.paleGold};
      z-index:20; text-align:center;
      opacity:0; white-space:nowrap;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
    }

    /* Sub-sentence */
    .hook-sentence {
      position:absolute; top:42%; ${isRTL ? 'right' : 'left'}:50%;
      transform:translate(${isRTL ? '50%' : '-50%'}, 130px);
      font-size:20px; font-weight:400; color:${AJ.textGray};
      z-index:20; text-align:center;
      opacity:0; max-width:620px;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
    }

    /* V32: Peninsula Square — starts small, expands as counter progresses */
    .hook-peninsula-large {
      position:absolute; top:50%; ${isRTL ? 'right' : 'left'}:50%;
      transform:translate(${isRTL ? '50%' : '-50%'}, -50%);
      width:${PENINSULA_SIZE}px; height:${PENINSULA_SIZE}px;
      border:3px solid ${AJ.gold}; border-radius:${PENINSULA_RADIUS}px;
      opacity:0; z-index:18;
      transition: width 2s ease, height 2s ease, opacity 1s ease, border-width 2s ease;
    }
  </style>
</head>
<body>
  <div class="warm-ambient"></div>
  ${getBgImageHTML(data._bgImagesV2 || data._bgImages || [], 0, 0.85)}
  <div class="aj-gold-line"></div>
  <div class="aj-gold-glow"></div>
  <div class="aj-peninsula"></div>
  <div class="aj-category" id="catLabel">${escapeHTML(categoryLabel)}</div>
  <div class="aj-category-line" id="catLine"></div>
  <div class="aj-source">${isRTL ? 'المصدر: بيانات السوق' : data.locale === 'tr' ? 'Kaynak: Piyasa Verileri' : 'Source: Market Data'}</div>
  <div class="aj-labs-bug">${isRTL ? 'AJ Labs | رؤى' : data.locale === 'tr' ? 'AJ Labs | ROUA' : 'AJ Labs | رؤى'}</div>
  <div class="aj-progress-track"><div class="aj-progress-fill" id="progressBar"></div><div class="aj-progress-square" id="progressSq"></div></div>

  <!-- Lower third -->
  <div class="aj-lower-third" id="lowerThird">
    <div class="aj-lt-sq"></div>
    <div class="aj-lt-text">${escapeHTML(truncateText(data.title || '', 45))}</div>
    <div class="aj-lt-detail">${escapeHTML(data._unifiedDate || data.date || '')}</div>
  </div>

  <div class="hook-counter" id="counter">0</div>
  <div class="hook-underline" id="underline"></div>
  <div class="hook-label" id="hookLabel">${escapeHTML(mainLabel)}</div>
  <div class="hook-sentence" id="hookSentence">${escapeHTML(truncateText(data.title || '', 50))}</div>
  <div class="hook-peninsula-large" id="peninsulaExpand"></div>

  <script>
    ${counterAnimationJS()}
    var endVal = ${numericVal};
    var suffix = '${suffix}';
    window.setAnimationProgress = function(p) {
      var cat = document.getElementById('catLabel');
      var catLine = document.getElementById('catLine');
      var counter = document.getElementById('counter');
      var underline = document.getElementById('underline');
      var label = document.getElementById('hookLabel');
      var sentence = document.getElementById('hookSentence');
      var prog = document.getElementById('progressBar');
      var progSq = document.getElementById('progressSq');
      var lt = document.getElementById('lowerThird');
      var pen = document.getElementById('peninsulaExpand');

      // Phase 1: 0-0.12 — Category label fades in with underline
      if (p < 0.12) {
        var dp = p / 0.12;
        if (cat) cat.style.opacity = dp;
        if (catLine) catLine.style.width = (dp * 80) + 'px';
        if (counter) { counter.style.opacity = 0; }
        if (pen) { pen.style.opacity = 0.15; }
      }
      // Phase 2: 0.12-0.65 — Counter counts up, Peninsula expands
      else if (p < 0.65) {
        if (cat) cat.style.opacity = 1;
        if (catLine) catLine.style.width = '80px';
        var cp = (p - 0.12) / (0.65 - 0.12);
        if (counter) {
          counter.style.opacity = 1;
          animateCounter(counter, 0, endVal, cp, suffix);
        }
        // V32: Peninsula Square expands behind counter
        if (pen) {
          pen.style.opacity = 0.08;
          var expandSize = ${PENINSULA_SIZE} + cp * 260;
          pen.style.width = expandSize + 'px';
          pen.style.height = expandSize + 'px';
          pen.style.borderWidth = '2px';
        }
        // Underline draws
        if (underline) {
          var lineW = cp * 340;
          underline.style.width = lineW + 'px';
        }
      }
      // Phase 3: 0.65-1.0 — Label + sentence + lower-third appear
      else {
        if (cat) cat.style.opacity = 1;
        if (catLine) catLine.style.width = '80px';
        if (counter) {
          counter.style.opacity = 1;
          animateCounter(counter, 0, endVal, 1, suffix);
        }
        if (pen) {
          pen.style.opacity = 0.05;
          pen.style.width = (320 + 'px');
          pen.style.height = (320 + 'px');
        }
        if (underline) underline.style.width = '340px';
        var tp = (p - 0.65) / 0.35;
        if (label) label.style.opacity = Math.min(1, tp * 2.5);
        if (sentence) sentence.style.opacity = Math.max(0, Math.min(1, (tp - 0.25) * 2));
        if (lt) lt.style.opacity = Math.max(0, Math.min(1, (tp - 0.4) * 2));
      }

      // Progress bar + sliding square
      var progPct = p * 100;
      if (prog) prog.style.width = progPct + '%';
      if (progSq) progSq.style.left = progPct + '%';
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 2: MAP + CONTEXT (15-45s) — Choropleth map + region counters
// ═══════════════════════════════════════════════════════════════════
function generateMapHTML(data) {
  const isRTL = data.locale === 'ar';
  const stats = data.stats || [];
  const regions = [
    { id: 'namerica', label: isRTL ? 'أمريكا الشمالية' : data.locale === 'tr' ? 'K. Amerika' : 'N. America', stat: stats[0], cx: 165, cy: 155 },
    { id: 'samerica', label: isRTL ? 'أمريكا الجنوبية' : data.locale === 'tr' ? 'G. Amerika' : 'S. America', stat: stats[1] || stats[0], cx: 190, cy: 370 },
    { id: 'europe', label: isRTL ? 'أوروبا' : data.locale === 'tr' ? 'Avrupa' : 'Europe', stat: stats[1], cx: 490, cy: 105 },
    { id: 'africa', label: isRTL ? 'أفريقيا' : data.locale === 'tr' ? 'Afrika' : 'Africa', stat: stats[2] || stats[0], cx: 488, cy: 300 },
    { id: 'mideast', label: isRTL ? 'الشرق الأوسط' : data.locale === 'tr' ? 'Ortadoğu' : 'Middle East', stat: stats[3] || stats[0], cx: 570, cy: 185 },
    { id: 'asia', label: isRTL ? 'آسيا' : data.locale === 'tr' ? 'Asya' : 'Asia', stat: stats[1] || stats[0], cx: 710, cy: 170 },
    { id: 'easia', label: isRTL ? 'شرق آسيا' : data.locale === 'tr' ? 'Doğu Asya' : 'E. Asia', stat: stats[2] || stats[0], cx: 830, cy: 140 },
  ];
  const mapSVG = generateWorldMapSVG();
  const categoryLabel = isRTL ? 'ما المهدد' : data.locale === 'tr' ? 'RİSK ALTINDAKİLER' : "WHAT'S AT STAKE";

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
      background:${AJ.darkBg}; color:${AJ.textWhite};
      direction:${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing:antialiased;
    }
    ${bgImageCSS()}
    ${persistentElementsCSS(isRTL)}
    ${warmAmbientBgCSS()}

    /* Map container — centered, ~65% of frame */
    .map-container {
      position:absolute; top:60px; ${isRTL ? 'left' : 'right'}:30px;
      width:820px; height:440px; z-index:10;
      border:1px solid ${AJ.borderGold}; border-radius:8px;
      overflow:hidden; background:rgba(10,22,40,0.6);
    }
    .map-title {
      position:absolute; top:20px; ${isRTL ? 'right' : 'left'}:40px;
      font-size:22px; font-weight:700; color:${AJ.warmWhite}; z-index:10;
      opacity:0;
    }

    /* Region overlay labels */
    .map-region-stat {
      position:absolute; z-index:15;
      text-align:center; opacity:0;
      transition: opacity 0.5s ease;
    }
    .map-region-num {
      font-size:24px; font-weight:800; color:${AJ.gold};
      font-family:'IBM Plex Mono','Inter',monospace;
      text-shadow: 0 0 25px rgba(219,162,0,0.35);
    }
    .map-region-name {
      font-size:10px; color:${AJ.paleGold}; margin-top:2px;
      letter-spacing:1.5px; text-transform:uppercase;
    }

    /* Left side info — region list */
    .map-info {
      position:absolute; top:70px; ${isRTL ? 'right' : 'left'}:32px;
      width:360px; z-index:10;
    }
    .map-info-item {
      display:flex; align-items:center; margin-bottom:16px;
      opacity:0; transform:translateY(8px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .map-info-name {
      font-size:15px; color:${AJ.textGray}; min-width:110px;
    }
    .map-info-val {
      font-size:20px; font-weight:700; color:${AJ.gold};
      font-family:'IBM Plex Mono','Inter',monospace;
    }

    /* Map region glow */
    .map-region { transition: fill 0.6s ease, opacity 0.6s ease, filter 0.6s ease; }
    .map-region.glow { fill:${AJ.gold}; opacity:0.45; filter:url(#glow); }
    .map-region.highlight { fill:${AJ.paleGold}; opacity:0.35; }

    /* Peninsula as compass indicator */
    .map-compass {
      position:absolute; top:68px; ${isRTL ? 'left' : 'right'}:48px;
      z-index:12; opacity:0.3;
    }
  </style>
</head>
<body>
  <div class="warm-ambient"></div>
  ${getBgImageHTML(data._bgImagesV2 || data._bgImages || [], 1, 0.78)}
  <div class="aj-gold-line"></div>
  <div class="aj-gold-glow"></div>
  <div class="aj-peninsula"></div>
  <div class="aj-category" id="catLabel">${escapeHTML(categoryLabel)}</div>
  <div class="aj-category-line" id="catLine"></div>
  <div class="aj-source">${isRTL ? 'المصدر: البيانات الجغرافية' : data.locale === 'tr' ? 'Kaynak: Coğrafi Veriler' : 'Source: Geographic Data'}</div>
  <div class="aj-labs-bug">${isRTL ? 'AJ Labs | رؤى' : data.locale === 'tr' ? 'AJ Labs | ROUA' : 'AJ Labs | رؤى'}</div>
  <div class="aj-progress-track"><div class="aj-progress-fill" id="progressBar"></div><div class="aj-progress-square" id="progressSq"></div></div>

  <!-- Lower third -->
  <div class="aj-lower-third" id="lowerThird" style="opacity:0">
    <div class="aj-lt-sq"></div>
    <div class="aj-lt-text">${escapeHTML(truncateText(data.title || '', 40))}</div>
  </div>

  <div class="map-title" id="mapTitle">${escapeHTML(truncateText(data.title || (isRTL ? 'المناطق المتأثرة' : data.locale === 'tr' ? 'Etkilenen Bölgeler' : 'Affected Regions'), 35))}</div>

  <div class="map-info" id="mapInfo">
    ${regions.map((r, i) => `
    <div class="map-info-item" id="info-${i}">
      <div class="aj-sq-bullet"></div>
      <div class="map-info-name">${escapeHTML(r.label)}</div>
      <div class="map-info-val" id="infoval-${i}">0</div>
    </div>`).join('\n    ')}
  </div>

  <div class="map-container">
    ${mapSVG}
    ${regions.map((r, i) => `
    <div class="map-region-stat" id="rstat-${i}" style="left:${(r.cx / 1000) * 100}%;top:${(r.cy / 500) * 100}%;">
      <div class="map-region-num" id="rnum-${i}">0</div>
      <div class="map-region-name">${escapeHTML(r.label)}</div>
    </div>`).join('\n    ')}
  </div>

  <script>
    ${counterAnimationJS()}
    var regionData = ${JSON.stringify(regions.map(r => ({
      numericVal: parseNumericValueStr(r.stat?.value || '0'),
      suffix: String(r.stat?.value || '').includes('%') ? '%' : '',
      display: String(r.stat?.value || '—')
    })))};
    var regionIds = ['namerica','samerica','europe','africa','mideast','asia','easia'];

    window.setAnimationProgress = function(p) {
      var cat = document.getElementById('catLabel');
      var catLine = document.getElementById('catLine');
      var title = document.getElementById('mapTitle');
      var prog = document.getElementById('progressBar');
      var progSq = document.getElementById('progressSq');
      var lt = document.getElementById('lowerThird');
      var total = ${regions.length};
      var perRegion = 1.0 / total;

      // Category label + underline
      if (cat) cat.style.opacity = Math.min(1, p * 5);
      if (catLine) catLine.style.width = Math.min(80, p * 200) + 'px';
      if (title) title.style.opacity = Math.min(1, p * 3);
      // Lower-third
      if (lt && p > 0.08) lt.style.opacity = 1;

      // Progress bar
      var progPct = p * 100;
      if (prog) prog.style.width = progPct + '%';
      if (progSq) progSq.style.left = progPct + '%';

      for (var i = 0; i < total; i++) {
        var start = i * perRegion;
        var end = start + perRegion;
        var el = document.getElementById('map-' + regionIds[i]);
        var infoEl = document.getElementById('info-' + i);
        var rstat = document.getElementById('rstat-' + i);
        var rnum = document.getElementById('rnum-' + i);
        var infoval = document.getElementById('infoval-' + i);

        if (p >= start) {
          var sp = Math.min(1, (p - start) / perRegion);

          // V32: Middle East gets special highlight
          if (el) {
            if (regionIds[i] === 'mideast') {
              el.classList.add('highlight');
            }
            if (sp > 0.05) el.classList.add('glow');
          }

          // Show info item
          if (infoEl) {
            infoEl.style.opacity = Math.min(1, sp * 3);
            infoEl.style.transform = 'translateY(0)';
          }

          // Show map overlay stat
          if (rstat) rstat.style.opacity = Math.min(1, sp * 2);

          // Counter animation
          var counterProg = Math.min(1, sp * 1.3);
          if (rnum) animateCounter(rnum, 0, regionData[i].numericVal, counterProg, regionData[i].suffix);
          if (infoval) animateCounter(infoval, 0, regionData[i].numericVal, counterProg, regionData[i].suffix);

        } else {
          if (el) el.classList.remove('glow');
        }
      }
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 3: TIMELINE (45-80s) — Peninsula Square becomes vertical timeline
// ═══════════════════════════════════════════════════════════════════
function generateTimelineHTML(data) {
  const isRTL = data.locale === 'ar';
  const rootCauses = data.root_causes || [];
  const events = rootCauses.length > 0 ? rootCauses.slice(0, 5) : [
    { title: isRTL ? 'البداية' : data.locale === 'tr' ? 'Başlangıç' : 'Start', description: isRTL ? 'تطورات أولى' : data.locale === 'tr' ? 'İlk gelişmeler' : 'Initial developments' },
    { title: isRTL ? 'التصاعد' : data.locale === 'tr' ? 'Tırmanış' : 'Escalation', description: isRTL ? 'تصاعد التوترات' : data.locale === 'tr' ? 'Artan gerilimler' : 'Rising tensions' },
    { title: isRTL ? 'الذروة' : data.locale === 'tr' ? 'Zirve' : 'Peak', description: isRTL ? 'وصل للمستويات القصوى' : data.locale === 'tr' ? 'Kritik seviyelere ulaştı' : 'Reached critical levels' },
    { title: isRTL ? 'الاستجابة' : data.locale === 'tr' ? 'Tepki' : 'Response', description: isRTL ? 'إجراءات تصحيحية' : data.locale === 'tr' ? 'Düzeltici önlemler' : 'Corrective measures' },
    { title: isRTL ? 'الحالي' : data.locale === 'tr' ? 'Güncel' : 'Current', description: isRTL ? 'الوضع الراهن' : data.locale === 'tr' ? 'Mevcut durum' : 'Current situation' },
  ];
  const yearBase = 2020;
  const categoryLabel = isRTL ? 'كيف وصلنا هنا' : data.locale === 'tr' ? 'NASIL BURAYA GELDİK' : 'HOW WE GOT HERE';

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
      background:${AJ.darkBg}; color:${AJ.textWhite};
      direction:${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing:antialiased;
    }
    ${bgImageCSS()}
    ${persistentElementsCSS(isRTL)}
    ${warmAmbientBgCSS()}

    /* V32: Peninsula Square as timeline origin */
    .tl-origin-square {
      position:absolute; top:55px; ${isRTL ? 'right' : 'left'}:108px;
      width:${PENINSULA_SIZE}px; height:${PENINSULA_SIZE}px;
      border:2px solid ${AJ.gold}; border-radius:${PENINSULA_RADIUS}px;
      z-index:12; opacity:0;
      display:flex; align-items:center; justify-content:center;
      font-size:11px; color:${AJ.gold}; font-weight:700;
      font-family:'IBM Plex Mono',monospace;
      transition: opacity 0.6s ease;
    }

    /* Vertical timeline line */
    .tl-vline-bg {
      position:absolute; top:105px; ${isRTL ? 'right' : 'left'}:128px;
      width:2px; height:${HEIGHT - 160}px;
      background: linear-gradient(180deg, ${AJ.borderGold}, rgba(219,162,0,0.06));
      z-index:9;
    }
    .tl-vline-fill {
      position:absolute; top:105px; ${isRTL ? 'right' : 'left'}:128px;
      width:2px; height:0px;
      background: linear-gradient(180deg, ${AJ.gold}, ${AJ.paleGold});
      z-index:10;
      transition: height 0.3s ease;
    }

    /* Timeline events — left of the line */
    .tl-events {
      position:absolute; top:100px; ${isRTL ? 'right' : 'left'}:165px;
      width:380px; z-index:12;
    }
    .tl-event {
      display:flex; align-items:flex-start; margin-bottom:${Math.floor((HEIGHT - 210) / events.length - 8)}px;
      opacity:0; transform:translateY(12px);
      transition: opacity 0.6s ease, transform 0.6s ease;
      position:relative;
    }
    .tl-event-dot {
      position:absolute; ${isRTL ? 'right' : 'left'}:-52px; top:6px;
      width:12px; height:12px; border-radius:2px; /* V32: square dots, not circles */
      background:${AJ.darkBg}; border:2px solid ${AJ.gold};
      z-index:13; transition: background 0.4s ease, box-shadow 0.4s ease;
    }
    .tl-event-dot.active {
      background:${AJ.gold};
      box-shadow:0 0 12px rgba(219,162,0,0.4);
    }
    .tl-event-year {
      font-size:22px; font-weight:800; color:${AJ.gold};
      font-family:'IBM Plex Mono','Inter',monospace;
      min-width:55px; margin-${isRTL ? 'left' : 'right'}:12px;
    }
    .tl-event-title {
      font-size:15px; font-weight:600; color:${AJ.warmWhite};
      overflow:hidden; text-overflow:ellipsis; max-width:300px;
    }
    .tl-event-desc {
      font-size:12px; color:${AJ.textGray}; margin-top:2px;
      overflow:hidden; text-overflow:ellipsis; max-width:300px;
      line-height:1.3;
    }

    /* Current event detail — LARGE on right side */
    .tl-current {
      position:absolute; top:50%; ${isRTL ? 'left' : 'right'}:50px;
      transform:translateY(-50%);
      z-index:15; text-align:${isRTL ? 'right' : 'left'};
      max-width:520px;
    }
    .tl-current-year {
      font-size:76px; font-weight:900; color:${AJ.gold};
      font-family:'IBM Plex Mono','Inter',monospace;
      line-height:1; opacity:0.85;
    }
    .tl-current-desc {
      font-size:24px; color:${AJ.warmWhite}; margin-top:14px;
      line-height:1.4;
    }
    .tl-current-box {
      margin-top:18px; padding:14px 22px;
      border-${isRTL ? 'right' : 'left'}:3px solid ${AJ.gold};
      background:${AJ.glowGold};
      border-radius: 0 ${isRTL ? '' : '4px'} ${isRTL ? '4px' : ''} 0;
    }
  </style>
</head>
<body>
  <div class="warm-ambient"></div>
  ${getBgImageHTML(data._bgImagesV2 || data._bgImages || [], 2, 0.75)}
  <div class="aj-gold-line"></div>
  <div class="aj-gold-glow"></div>
  <div class="aj-peninsula"></div>
  <div class="aj-category" id="catLabel">${escapeHTML(categoryLabel)}</div>
  <div class="aj-category-line" id="catLine"></div>
  <div class="aj-source">${isRTL ? 'المصدر: التحليل الزمني' : data.locale === 'tr' ? 'Kaynak: Zaman Çizelgesi Analizi' : 'Source: Timeline Analysis'}</div>
  <div class="aj-labs-bug">${isRTL ? 'AJ Labs | رؤى' : data.locale === 'tr' ? 'AJ Labs | ROUA' : 'AJ Labs | رؤى'}</div>
  <div class="aj-progress-track"><div class="aj-progress-fill" id="progressBar"></div><div class="aj-progress-square" id="progressSq"></div></div>

  <!-- Lower third -->
  <div class="aj-lower-third" id="lowerThird" style="opacity:0">
    <div class="aj-lt-sq"></div>
    <div class="aj-lt-text">${escapeHTML(truncateText(data.title || '', 40))}</div>
  </div>

  <!-- V32: Peninsula Square as timeline origin -->
  <div class="tl-origin-square" id="originSq">TL</div>

  <!-- Vertical timeline line -->
  <div class="tl-vline-bg"></div>
  <div class="tl-vline-fill" id="tlVLine"></div>

  <!-- Timeline events -->
  <div class="tl-events">
    ${events.map((evt, i) => `
    <div class="tl-event" id="evt-${i}">
      <div class="tl-event-dot" id="dot-${i}"></div>
      <div class="tl-event-year">${yearBase + i}</div>
      <div>
        <div class="tl-event-title">${escapeHTML(truncateText(evt.title, 25))}</div>
        <div class="tl-event-desc">${escapeHTML(truncateText(evt.description || '', 40))}</div>
      </div>
    </div>`).join('\n    ')}
  </div>

  <!-- Current event large display -->
  <div class="tl-current" id="tlCurrent">
    <div class="tl-current-year" id="curYear"></div>
    <div class="tl-current-desc" id="curDesc"></div>
    <div class="tl-current-box" id="curBox" style="opacity:0">
      <div style="font-size:14px;color:${AJ.paleGold}" id="curTitle"></div>
    </div>
  </div>

  <script>
    window.setAnimationProgress = function(p) {
      var cat = document.getElementById('catLabel');
      var catLine = document.getElementById('catLine');
      var line = document.getElementById('tlVLine');
      var prog = document.getElementById('progressBar');
      var progSq = document.getElementById('progressSq');
      var lt = document.getElementById('lowerThird');
      var originSq = document.getElementById('originSq');
      var total = ${events.length};
      var lineHeight = ${HEIGHT - 160};

      if (cat) cat.style.opacity = Math.min(1, p * 5);
      if (catLine) catLine.style.width = Math.min(80, p * 200) + 'px';
      var progPct = p * 100;
      if (prog) prog.style.width = progPct + '%';
      if (progSq) progSq.style.left = progPct + '%';
      if (lt && p > 0.05) lt.style.opacity = 1;

      // V32: Origin square appears
      if (originSq && p > 0.02) originSq.style.opacity = 0.5;

      // Vertical line grows
      var lineProg = Math.min(1, p / 0.9);
      if (line) line.style.height = (lineProg * lineHeight) + 'px';

      var curYear = document.getElementById('curYear');
      var curDesc = document.getElementById('curDesc');
      var curBox = document.getElementById('curBox');
      var curTitle = document.getElementById('curTitle');
      var eventDescs = ${JSON.stringify(events.map(e => truncateText(e.description || e.title, 50)))};
      var eventTitles = ${JSON.stringify(events.map(e => truncateText(e.title, 30)))};

      for (var i = 0; i < total; i++) {
        var segStart = i / total;
        var segEnd = (i + 1) / total;
        var evt = document.getElementById('evt-' + i);
        var dot = document.getElementById('dot-' + i);

        if (p >= segStart) {
          var dp = Math.min(1, (p - segStart) / (segEnd - segStart));
          if (evt) {
            evt.style.opacity = Math.min(1, dp * 3);
            evt.style.transform = 'translateY(0)';
          }
          if (dot) {
            dot.classList.toggle('active', dp > 0.15);
          }
          if (dp > 0.08) {
            if (curYear) curYear.textContent = '${yearBase}' * 1 + i;
            if (curDesc) curDesc.textContent = eventDescs[i];
            if (curTitle) curTitle.textContent = eventTitles[i];
            if (curBox) curBox.style.opacity = dp > 0.2 ? 1 : 0;
          }
        }
      }
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 4: DATAVIZ (80-115s) — Counter-first then bar build
// ═══════════════════════════════════════════════════════════════════
function generateDatavizHTML(data) {
  const isRTL = data.locale === 'ar';
  const stats = (data.stats || []).slice(0, 5);
  const maxVal = Math.max(...stats.map(s => parseNumericValueStr(s.value)), 1);
  const categoryLabel = isRTL ? 'بالمقارنة' : data.locale === 'tr' ? 'KARŞILAŞTIRMA' : 'BY COMPARISON';

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
      background:${AJ.darkBg}; color:${AJ.textWhite};
      direction:${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing:antialiased;
    }
    ${bgImageCSS()}
    ${persistentElementsCSS(isRTL)}
    ${warmAmbientBgCSS()}

    .dv-title {
      position:absolute; top:50px; ${isRTL ? 'right' : 'left'}:60px;
      font-size:24px; font-weight:700; color:${AJ.warmWhite}; z-index:10;
      opacity:0;
    }

    /* V32: Peninsula Square as data frame */
    .dv-frame {
      position:absolute; top:90px; ${isRTL ? 'right' : 'left'}:50px;
      width:${WIDTH - 100}px; z-index:10;
      border:1px solid ${AJ.borderGold}; border-radius:6px;
      padding:24px; background:rgba(10,22,40,0.3);
    }

    /* Bar chart container */
    .dv-chart {
      z-index:10;
    }
    .dv-bar-row {
      display:flex; align-items:center; margin-bottom:28px;
      opacity:0; transform:translateX(${isRTL ? '20px' : '-20px'});
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .dv-bar-bullet {
      width:8px; height:8px; background:${AJ.gold}; flex-shrink:0;
      margin-${isRTL ? 'left' : 'right'}:12px; border-radius:1px;
    }
    .dv-bar-label {
      width:140px; font-size:16px; color:${AJ.warmWhite}; text-align:${isRTL ? 'left' : 'right'};
      overflow:hidden; text-overflow:ellipsis; max-width:140px;
      flex-shrink:0; padding-${isRTL ? 'left' : 'right'}:10px;
    }
    .dv-bar-counter {
      width:90px; font-size:22px; font-weight:800; color:${AJ.gold};
      font-family:'IBM Plex Mono','Inter',monospace;
      flex-shrink:0; padding-${isRTL ? 'left' : 'right'}:8px;
      opacity:0; transition: opacity 0.4s ease;
    }
    .dv-bar-track {
      flex:1; height:36px; background:rgba(20,30,60,0.6); border-radius:3px;
      overflow:hidden; position:relative;
    }
    .dv-bar-fill {
      height:100%; border-radius:3px;
      width:0%; transition: width 0.7s ease;
      background: linear-gradient(${isRTL ? '270deg' : '90deg'}, ${AJ.gold}, ${AJ.amberGlow});
    }
    /* V32: Subtle inner glow on bar */
    .dv-bar-fill::after {
      content:''; position:absolute; top:0; left:0; right:0; bottom:0;
      background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 60%);
    }
  </style>
</head>
<body>
  <div class="warm-ambient"></div>
  ${getBgImageHTML(data._bgImagesV2 || data._bgImages || [], 3, 0.78)}
  <div class="aj-gold-line"></div>
  <div class="aj-gold-glow"></div>
  <div class="aj-peninsula"></div>
  <div class="aj-category" id="catLabel">${escapeHTML(categoryLabel)}</div>
  <div class="aj-category-line" id="catLine"></div>
  <div class="aj-source">${isRTL ? 'المصدر: تحليل البيانات' : data.locale === 'tr' ? 'Kaynak: Veri Analizi' : 'Source: Data Analysis'}</div>
  <div class="aj-labs-bug">${isRTL ? 'AJ Labs | رؤى' : data.locale === 'tr' ? 'AJ Labs | ROUA' : 'AJ Labs | رؤى'}</div>
  <div class="aj-progress-track"><div class="aj-progress-fill" id="progressBar"></div><div class="aj-progress-square" id="progressSq"></div></div>

  <!-- Lower third -->
  <div class="aj-lower-third" id="lowerThird" style="opacity:0">
    <div class="aj-lt-sq"></div>
    <div class="aj-lt-text">${escapeHTML(truncateText(data.title || '', 40))}</div>
  </div>

  <div class="dv-title" id="dvTitle">${escapeHTML(truncateText(data.title || '', 40))}</div>

  <div class="dv-frame">
    <div class="dv-chart">
      ${stats.map((s, i) => {
        const val = parseNumericValueStr(s.value);
        const pct = Math.round((val / maxVal) * 100);
        return `
      <div class="dv-bar-row" id="bar-${i}">
        <div class="dv-bar-bullet"></div>
        <div class="dv-bar-label">${escapeHTML(truncateText(s.label, 16))}</div>
        <div class="dv-bar-counter" id="bcounter-${i}">0</div>
        <div class="dv-bar-track">
          <div class="dv-bar-fill" id="fill-${i}" style="width:0%"></div>
        </div>
      </div>`;
      }).join('\n      ')}
    </div>
  </div>

  <script>
    ${counterAnimationJS()}
    var barData = ${JSON.stringify(stats.map(s => ({
      numericVal: parseNumericValueStr(s.value),
      suffix: String(s.value).includes('%') ? '%' : '',
      pct: Math.round((parseNumericValueStr(s.value) / maxVal) * 100)
    })))};

    window.setAnimationProgress = function(p) {
      var cat = document.getElementById('catLabel');
      var catLine = document.getElementById('catLine');
      var title = document.getElementById('dvTitle');
      var prog = document.getElementById('progressBar');
      var progSq = document.getElementById('progressSq');
      var lt = document.getElementById('lowerThird');
      var total = ${stats.length};

      if (cat) cat.style.opacity = Math.min(1, p * 5);
      if (catLine) catLine.style.width = Math.min(80, p * 200) + 'px';
      if (title) title.style.opacity = Math.min(1, p * 3);
      if (lt && p > 0.05) lt.style.opacity = 1;
      var progPct = p * 100;
      if (prog) prog.style.width = progPct + '%';
      if (progSq) progSq.style.left = progPct + '%';

      for (var i = 0; i < total; i++) {
        var segStart = i / total;
        var segEnd = (i + 1) / total;
        var row = document.getElementById('bar-' + i);
        var fill = document.getElementById('fill-' + i);
        var counter = document.getElementById('bcounter-' + i);

        if (p >= segStart) {
          var sp = Math.min(1, (p - segStart) / (segEnd - segStart));

          // Phase 1: Show row, counter counts up
          if (row) {
            row.style.opacity = 1;
            row.style.transform = 'translateX(0)';
          }
          if (counter) {
            counter.style.opacity = 1;
            var counterProg = Math.min(1, sp * 2);
            animateCounter(counter, 0, barData[i].numericVal, counterProg, barData[i].suffix);
          }

          // Phase 2: Bar grows (0.25-1.0 of segment)
          var barProg = Math.max(0, (sp - 0.25) / 0.75);
          var eased = 1 - Math.pow(1 - barProg, 4);
          if (fill) fill.style.width = (eased * barData[i].pct) + '%';
        }
      }
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 5: HUMAN STORY (115-145s) — Emotional portrait + Peninsula as quote frame
// ═══════════════════════════════════════════════════════════════════
function generateHumanStoryHTML(data) {
  const isRTL = data.locale === 'ar';
  const stats = data.stats || [];
  const quote = isRTL
    ? `"التغيرات أثرت على حياة الملايين... الأرقام لا تحكي القصة كاملة"`
    : data.locale === 'tr'
    ? `"Değişimler milyonlarca hayatı etkiledi... Rakamlar hikayenin tamamını anlatmıyor"`
    : `"The changes affected millions of lives... Numbers don't tell the whole story"`;
  const personName = isRTL ? 'أحمد، ٤٥ عاماً' : data.locale === 'tr' ? 'Ahmet, 45 yaşında' : 'Ahmed, 45 years old';
  const categoryLabel = isRTL ? 'وراء الأرقام' : data.locale === 'tr' ? 'RAKAMLARIN ARKASINDA' : 'BEHIND THE NUMBERS';

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
      background:${AJ.darkBg}; color:${AJ.textWhite};
      direction:${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing:antialiased;
    }
    ${bgImageCSS()}
    ${persistentElementsCSS(isRTL)}

    /* AI human image — 65% of frame */
    .hs-image {
      position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0;
      width:65%; height:100%;
      z-index:0; overflow:hidden;
    }
    .hs-img {
      width:100%; height:100%; object-fit:cover;
      filter: brightness(0.3) saturate(0.4) sepia(0.25) contrast(1.05);
      transform: scale(1.0); transform-origin: 50% 40%;
      will-change: transform;
    }
    .hs-overlay {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background: linear-gradient(${isRTL ? '90deg' : '270deg'}, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.55) 55%, rgba(10,22,40,0.25) 100%);
      z-index:1;
    }

    /* V32: Peninsula Square as quote frame border */
    .hs-quote-frame {
      position:absolute; top:50%; ${isRTL ? 'left' : 'right'}:40px;
      transform:translateY(-50%);
      width:480px; padding:32px;
      z-index:20;
      border:1px solid ${AJ.borderGold}; border-radius:6px;
      background:rgba(10,22,40,0.6);
      opacity:0; transition: opacity 0.8s ease;
    }
    .hs-quote-frame::before {
      content:''; position:absolute; top:-2px; ${isRTL ? 'right' : 'left'}:-2px;
      width:${PENINSULA_SIZE}px; height:${PENINSULA_SIZE}px;
      border:2px solid ${AJ.gold}; border-radius:${PENINSULA_RADIUS}px;
      background:rgba(10,22,40,0.8);
    }

    .hs-quote-mark {
      font-size:72px; color:${AJ.gold}; line-height:0.7;
      font-family:Georgia,serif; opacity:0;
      transition: opacity 0.7s ease;
    }
    .hs-quote-text {
      font-size:26px; font-weight:500; color:${AJ.warmWhite};
      line-height:1.5; margin-top:10px;
      opacity:0; transition: opacity 0.7s ease 0.15s;
      direction:${isRTL ? 'rtl' : 'ltr'};
    }
    .hs-person {
      margin-top:18px; font-size:15px; color:${AJ.paleGold};
      opacity:0; transition: opacity 0.7s ease 0.3s;
      letter-spacing:1px;
    }

    /* Floating stat badges with counter animations */
    .hs-badges {
      position:absolute; bottom:70px; ${isRTL ? 'left' : 'right'}:50px;
      z-index:20; display:flex; gap:14px;
    }
    .hs-badge {
      background:rgba(10,22,40,0.75); border:1px solid ${AJ.borderGold};
      padding:10px 18px; border-radius:3px;
      opacity:0; transform:translateY(10px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .hs-badge-num {
      font-size:24px; font-weight:800; color:${AJ.gold};
      font-family:'IBM Plex Mono','Inter',monospace;
    }
    .hs-badge-lbl {
      font-size:11px; color:${AJ.textGray}; margin-top:2px;
      letter-spacing:0.5px;
    }
  </style>
</head>
<body>
  ${(() => {
    const bgImages = data._bgImagesV2 || data._bgImages || [];
    const bgV2 = bgImages[4] || bgImages[0] || null;
    let bgImageB64 = '';
    if (bgV2 && typeof bgV2 === 'object' && bgV2.base64) bgImageB64 = bgV2.base64 || '';
    else if (Array.isArray(bgImages) && typeof bgImages[0] === 'string') bgImageB64 = bgImages[4] || bgImages[0] || '';
    if (bgImageB64.length > 100) {
      const mime = bgImageB64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
      return `<div class="hs-image"><img class="hs-img" id="hsImg" src="data:${mime};base64,${bgImageB64}"/><div class="hs-overlay"></div></div>`;
    }
    return `<div class="warm-ambient"></div>`;
  })()}
  <div class="aj-gold-line"></div>
  <div class="aj-gold-glow"></div>
  <div class="aj-peninsula"></div>
  <div class="aj-category" id="catLabel">${escapeHTML(categoryLabel)}</div>
  <div class="aj-category-line" id="catLine"></div>
  <div class="aj-source">${isRTL ? 'المصدر: تقارير ميدانية' : data.locale === 'tr' ? 'Kaynak: Saha Raporları' : 'Source: Field Reports'}</div>
  <div class="aj-labs-bug">${isRTL ? 'AJ Labs | رؤى' : data.locale === 'tr' ? 'AJ Labs | ROUA' : 'AJ Labs | رؤى'}</div>
  <div class="aj-progress-track"><div class="aj-progress-fill" id="progressBar"></div><div class="aj-progress-square" id="progressSq"></div></div>

  <!-- Lower third -->
  <div class="aj-lower-third" id="lowerThird" style="opacity:0">
    <div class="aj-lt-sq"></div>
    <div class="aj-lt-text">${isRTL ? 'وراء كل رقم قصة حقيقية' : data.locale === 'tr' ? 'Her rakamın arkasında gerçek bir hikaye var' : 'Behind every number is a real story'}</div>
  </div>

  <div class="hs-quote-frame" id="quoteFrame">
    <div class="hs-quote-mark" id="quoteMark">"</div>
    <div class="hs-quote-text" id="quoteText">${escapeHTML(quote)}</div>
    <div class="hs-person" id="quotePerson">— ${escapeHTML(personName)}</div>
  </div>

  <div class="hs-badges">
    ${stats.slice(0, 3).map((s, i) => `
    <div class="hs-badge" id="hsb-${i}">
      <div class="hs-badge-num" id="hsbnum-${i}">0</div>
      <div class="hs-badge-lbl">${escapeHTML(truncateText(s.label, 13))}</div>
    </div>`).join('\n    ')}
  </div>

  <script>
    ${counterAnimationJS()}
    var badgeData = ${JSON.stringify(stats.slice(0, 3).map(s => ({
      numericVal: parseNumericValueStr(s.value),
      suffix: String(s.value).includes('%') ? '%' : '',
    })))};

    window.setAnimationProgress = function(p) {
      var cat = document.getElementById('catLabel');
      var catLine = document.getElementById('catLine');
      var img = document.getElementById('hsImg');
      var qframe = document.getElementById('quoteFrame');
      var qmark = document.getElementById('quoteMark');
      var qtext = document.getElementById('quoteText');
      var qperson = document.getElementById('quotePerson');
      var prog = document.getElementById('progressBar');
      var progSq = document.getElementById('progressSq');
      var lt = document.getElementById('lowerThird');

      if (cat) cat.style.opacity = Math.min(1, p * 5);
      if (catLine) catLine.style.width = Math.min(80, p * 200) + 'px';
      var progPct = p * 100;
      if (prog) prog.style.width = progPct + '%';
      if (progSq) progSq.style.left = progPct + '%';

      // Ken Burns zoom on image — V32: slower, more deliberate
      if (img) {
        var scale = 1.0 + p * 0.04;
        img.style.transform = 'scale(' + scale + ')';
      }

      // V32: Quote frame appears first, then contents
      if (p < 0.1) {
        if (qframe) qframe.style.opacity = 0;
        if (qmark) qmark.style.opacity = 0;
        if (qtext) qtext.style.opacity = 0;
        if (qperson) qperson.style.opacity = 0;
      } else if (p < 0.2) {
        var fp = (p - 0.1) / 0.1;
        if (qframe) qframe.style.opacity = fp;
      } else if (p < 0.55) {
        if (qframe) qframe.style.opacity = 1;
        var qp = (p - 0.2) / 0.35;
        if (qmark) qmark.style.opacity = Math.min(1, qp * 2.5);
        if (qtext) qtext.style.opacity = Math.min(1, qp * 1.8);
        if (qperson) qperson.style.opacity = Math.max(0, (qp - 0.4) * 2);
      } else {
        if (qframe) qframe.style.opacity = 1;
        if (qmark) qmark.style.opacity = 1;
        if (qtext) qtext.style.opacity = 1;
        if (qperson) qperson.style.opacity = 1;
      }

      // Lower third
      if (lt && p > 0.15) lt.style.opacity = 1;

      // Stat badges with counter animations
      for (var i = 0; i < 3; i++) {
        var el = document.getElementById('hsb-' + i);
        var num = document.getElementById('hsbnum-' + i);
        if (el && num && badgeData[i]) {
          var start = 0.35 + i * 0.12;
          if (p >= start) {
            var bp = Math.min(1, (p - start) / 0.2);
            el.style.opacity = bp;
            el.style.transform = 'translateY(0)';
            var counterProg = Math.min(1, (p - start) / 0.3);
            animateCounter(num, 0, badgeData[i].numericVal, counterProg, badgeData[i].suffix);
          }
        }
      }
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE 6: CLOSING (145-170s) — Peninsula Square final brand mark
// ═══════════════════════════════════════════════════════════════════
function generateClosingHTML(data) {
  const isRTL = data.locale === 'ar';
  const takeaways = (data.strategic_takeaways || []).slice(0, 3);
  const categoryLabel = isRTL ? 'ما يعنيه هذا' : data.locale === 'tr' ? 'BU NE ANLAMA GELİYOR' : 'WHAT THIS MEANS';

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family:'Noto Sans Arabic','Inter',sans-serif;
      background:${AJ.darkBg}; color:${AJ.textWhite};
      direction:${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing:antialiased;
    }
    ${bgImageCSS()}
    ${persistentElementsCSS(isRTL)}
    ${warmAmbientBgCSS()}

    /* Takeaways */
    .cl-takeaways {
      position:absolute; top:80px; ${isRTL ? 'right' : 'left'}:60px;
      width:${WIDTH - 120}px; z-index:10;
    }
    .cl-takeaway {
      display:flex; align-items:flex-start; margin-bottom:30px;
      opacity:0; transform:translateY(18px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .cl-num {
      font-size:34px; font-weight:900; color:${AJ.gold};
      font-family:'IBM Plex Mono','Inter',monospace;
      min-width:55px; margin-${isRTL ? 'left' : 'right'}:16px;
      line-height:1;
    }
    .cl-content { flex:1; }
    .cl-tk-title {
      font-size:20px; font-weight:700; color:${AJ.warmWhite};
      overflow:hidden; text-overflow:ellipsis; max-width:800px;
      margin-bottom:4px;
    }
    .cl-tk-detail {
      font-size:15px; color:${AJ.textGray};
      overflow:hidden; text-overflow:ellipsis; max-width:800px;
      line-height:1.4;
    }

    /* Source credits */
    .cl-source-credits {
      position:absolute; bottom:75px; ${isRTL ? 'right' : 'left'}:60px;
      z-index:20; opacity:0;
      transition: opacity 0.8s ease;
    }
    .cl-source-text {
      font-size:13px; color:${AJ.textDim}; letter-spacing:0.5px;
      font-family:'IBM Plex Mono','Inter',monospace;
    }

    /* V32: Peninsula Square as brand mark — final */
    .cl-brand {
      position:absolute; bottom:95px; ${isRTL ? 'right' : 'left'}:50%;
      transform:translateX(${isRTL ? '50%' : '-50%'});
      z-index:20; text-align:center; opacity:0;
      transition: opacity 1s ease;
    }
    .cl-brand-peninsula {
      width:${PENINSULA_SIZE}px; height:${PENINSULA_SIZE}px;
      border:2px solid ${AJ.gold}; border-radius:${PENINSULA_RADIUS}px;
      margin:0 auto 10px;
      display:flex; align-items:center; justify-content:center;
    }
    .cl-brand-peninsula-inner {
      width:6px; height:6px; background:${AJ.gold}; border-radius:1px;
    }
    .cl-brand-ar {
      font-size:44px; font-weight:900; color:${AJ.gold};
      letter-spacing:4px;
      font-family:'Noto Sans Arabic',sans-serif;
    }
    .cl-brand-en {
      font-size:15px; color:${AJ.textGray}; margin-top:4px;
      letter-spacing:3px;
      font-family:'IBM Plex Mono','Inter',monospace;
    }
    .cl-brand-line {
      width:60px; height:2px; background:${AJ.gold};
      margin:10px auto 0;
    }

    /* Final brand mark on dark — V32: Peninsula Square central */
    .cl-final {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background:${AJ.darkBg}; z-index:30;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      opacity:0; transition: opacity 1.2s ease;
    }
    .cl-final-peninsula {
      width:${PENINSULA_SIZE * 2}px; height:${PENINSULA_SIZE * 2}px;
      border:2.5px solid ${AJ.gold}; border-radius:${PENINSULA_RADIUS * 2}px;
      display:flex; align-items:center; justify-content:center;
      margin-bottom:20px;
    }
    .cl-final-peninsula-text {
      font-size:32px; font-weight:900; color:${AJ.gold};
      font-family:'Noto Sans Arabic',sans-serif;
    }
    .cl-final-mark {
      font-size:56px; font-weight:900; color:${AJ.gold};
      letter-spacing:6px;
      font-family:'Noto Sans Arabic',sans-serif;
    }
    .cl-final-sub {
      font-size:16px; color:${AJ.textDim}; margin-top:8px;
      letter-spacing:4px;
      font-family:'IBM Plex Mono','Inter',monospace;
    }
    .cl-final-accent {
      width:80px; height:3px; background:${AJ.gold};
      margin-top:14px;
    }
  </style>
</head>
<body>
  <div class="warm-ambient"></div>
  ${getBgImageHTML(data._bgImagesV2 || data._bgImages || [], 5, 0.88)}
  <div class="aj-gold-line"></div>
  <div class="aj-gold-glow"></div>
  <div class="aj-peninsula"></div>
  <div class="aj-category" id="catLabel">${escapeHTML(categoryLabel)}</div>
  <div class="aj-category-line" id="catLine"></div>
  <div class="aj-labs-bug">${isRTL ? 'AJ Labs | رؤى' : data.locale === 'tr' ? 'AJ Labs | ROUA' : 'AJ Labs | رؤى'}</div>
  <div class="aj-progress-track"><div class="aj-progress-fill" id="progressBar"></div><div class="aj-progress-square" id="progressSq"></div></div>

  <div class="cl-takeaways">
    ${takeaways.map((tk, i) => `
    <div class="cl-takeaway" id="tk-${i}">
      <div class="cl-num">${isRTL ? toArabicNumeral('0' + (i + 1)) : '0' + (i + 1)}</div>
      <div class="cl-content">
        <div class="cl-tk-title">${escapeHTML(truncateText(tk.title, 30))}</div>
        <div class="cl-tk-detail">${escapeHTML(truncateText(tk.detail, 60))}</div>
      </div>
    </div>`).join('\n    ')}
  </div>

  <div class="cl-source-credits" id="srcCredits">
    <div class="cl-source-text">${isRTL ? 'المصدر: بيانات السوق | البيانات: رؤى' : data.locale === 'tr' ? 'Kaynak: Piyasa Verileri | Veri: ROUA' : 'Source: Market Data | Data: AJ Labs'}</div>
  </div>

  <div class="cl-brand" id="clBrand">
    <div class="cl-brand-peninsula"><div class="cl-brand-peninsula-inner"></div></div>
    <div class="cl-brand-ar">${isRTL ? 'رؤى' : 'ROUA'}</div>
    <div class="cl-brand-en">${data.locale === 'tr' ? 'ROUA ANALİZ' : 'ROUAA'}</div>
    <div class="cl-brand-line"></div>
  </div>

  <div class="cl-final" id="clFinal">
    <div class="cl-final-peninsula"><div class="cl-final-peninsula-text">${isRTL ? 'رؤى' : 'ROUA'}</div></div>
    <div class="cl-final-sub">${data.locale === 'tr' ? 'ROUA | AJ LABS' : 'ROUAA | AJ LABS'}</div>
    <div class="cl-final-accent"></div>
  </div>

  <script>
    window.setAnimationProgress = function(p) {
      var cat = document.getElementById('catLabel');
      var catLine = document.getElementById('catLine');
      var prog = document.getElementById('progressBar');
      var progSq = document.getElementById('progressSq');
      var total = ${takeaways.length};
      var srcCredits = document.getElementById('srcCredits');
      var brand = document.getElementById('clBrand');
      var final_ = document.getElementById('clFinal');

      if (cat) cat.style.opacity = Math.min(1, p * 5);
      if (catLine) catLine.style.width = Math.min(80, p * 200) + 'px';
      var progPct = p * 100;
      if (prog) prog.style.width = progPct + '%';
      if (progSq) progSq.style.left = progPct + '%';

      // Takeaways appear one by one — V32: slower, more deliberate
      for (var i = 0; i < total; i++) {
        var start = 0.05 + i * 0.14;
        var el = document.getElementById('tk-' + i);
        if (p >= start && el) {
          var sp = Math.min(1, (p - start) / 0.14);
          el.style.opacity = sp;
          el.style.transform = 'translateY(0)';
        }
      }

      // Source credits
      if (p > 0.5 && srcCredits) {
        srcCredits.style.opacity = Math.min(1, (p - 0.5) / 0.15);
      }

      // Brand fade in with Peninsula
      if (p > 0.6 && brand) {
        brand.style.opacity = (p - 0.6) / 0.15;
      }

      // Final brand mark — Peninsula Square as central mark
      if (p > 0.82 && final_) {
        final_.style.opacity = (p - 0.82) / 0.18;
      }
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
// SCENE HTML DISPATCHER
// ═══════════════════════════════════════════════════════════════════
function generateSceneHTML(sceneName, data) {
  switch (sceneName) {
    case 'hook':       return generateHookHTML(data);
    case 'map':        return generateMapHTML(data);
    case 'timeline':   return generateTimelineHTML(data);
    case 'dataviz':    return generateDatavizHTML(data);
    case 'humanstory': return generateHumanStoryHTML(data);
    case 'closing':    return generateClosingHTML(data);
    default:
      console.warn(`[AJ32]  Unknown scene: ${sceneName}`);
      return generateHookHTML(data);
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN — Playwright frame-by-frame rendering + FFmpeg assembly
// ═══════════════════════════════════════════════════════════════════
async function main() {
  const args = parseArgs();
  const inputPath = args.input;
  const outputPath = args.output;

  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/video-renderer-dataviz.mjs --input <data.json> --output <output.mp4>');
    process.exit(1);
  }

  console.log('══════════════════════════════════════════════════════');
  console.log('  Al Jazeera DataViz Video Renderer V32');
  console.log('  "Don\'t give me more data — give me a story"');
  console.log('  Peninsula Square motif | Warm navy | AJ Labs');
  console.log('══════════════════════════════════════════════════════');

  // V338: Global timeout — kill the process if it takes more than 10 minutes
  const GLOBAL_TIMEOUT_MS = 15 * 60 * 1000;  // V339: Increased from 10 to 15 min
  const globalTimer = setTimeout(() => {
    console.error(`[AJ32] GLOBAL TIMEOUT: Video generation exceeded ${GLOBAL_TIMEOUT_MS / 1000}s — forcing exit`);
    process.exit(2);
  }, GLOBAL_TIMEOUT_MS);

  // Load and enhance data
  let data;
  try {
    data = JSON.parse(readFileSync(inputPath, 'utf-8'));
  } catch (err) {
    console.error(`[AJ32]  Failed to read input: ${err.message}`);
    process.exit(1);
  }
  data = enhanceData(data);
  console.log(`[AJ32]  Data loaded: ${data.title || 'Untitled'} (${data.locale || 'ar'})`);

  // Create temp directory
  const tmpDir = join(tmpdir(), `aj32-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });
  const framesDir = join(tmpDir, 'frames');
  mkdirSync(framesDir, { recursive: true });

  // ── Step 1: Generate AI background images ──
  console.log('[AJ347] Step 1: Generating AI background images...');

  // V347: CRITICAL DIAGNOSTIC — Log API key status BEFORE attempting image generation
  const _ajTogetherKey = process.env.TOGETHER_API_KEY;
  const _ajHfKey = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
  console.log(`[AJ347] ═══ IMAGE API DIAGNOSTICS ═══`);
  console.log(`[AJ347]   TOGETHER_API_KEY: ${_ajTogetherKey ? `SET (${_ajTogetherKey.length} chars, ${_ajTogetherKey.slice(0,6)}...${_ajTogetherKey.slice(-4)})` : 'NOT SET ❌'}`);
  console.log(`[AJ347]   HF_API_KEY: ${process.env.HF_API_KEY ? `SET (${process.env.HF_API_KEY.length} chars)` : 'NOT SET'}`);
  console.log(`[AJ347]   HF_API_TOKEN: ${process.env.HF_API_TOKEN ? `SET (${process.env.HF_API_TOKEN.length} chars)` : 'NOT SET'}`);
  console.log(`[AJ347]   HF_TOKEN: ${process.env.HF_TOKEN ? `SET (${process.env.HF_TOKEN.length} chars)` : 'NOT SET'}`);
  console.log(`[AJ347]   Combined HF: ${_ajHfKey ? `SET (${_ajHfKey.length} chars)` : 'NOT SET ❌'}`);
  console.log(`[AJ347]   ZAI_BASE_URL: ${process.env.ZAI_BASE_URL ? 'SET' : 'NOT SET'}`);
  console.log(`[AJ347]   RAILWAY_ENV: ${process.env.RAILWAY_ENVIRONMENT || 'NOT SET'}`);
  console.log(`[AJ347] ═════════════════════════════`);

  // V347: Download article image FIRST (already AI-generated by news imager!)
  const articleImageUrl = data.image_url || data.article_image_url;
  let articleImageBase64 = '';
  if (articleImageUrl) {
    console.log(`[AJ347]  ★ PRIMARY: Downloading article image from R2: ${articleImageUrl.slice(0, 80)}...`);
    const articleBuf = await downloadImageFromUrl(articleImageUrl);
    if (articleBuf && articleBuf.length > 5000) {
      articleImageBase64 = articleBuf.toString('base64');
      const mime = articleBuf.slice(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : 'image/png';
      console.log(`[AJ347]  ★ PRIMARY: Article image loaded from R2 (${(articleBuf.length / 1024).toFixed(0)}KB) — THIS IS AN AI-GENERATED IMAGE`);
    } else {
      console.warn(`[AJ347]  PRIMARY: Article image download failed or too small (${articleBuf?.length || 0} bytes)`);
    }
  }

  const bgImages = [];
  const topicEN = String(data.title || 'economic data visualization').replace(/[^\x00-\x7F]/g, ' ').trim();

  // V8: Use pre-generated images from infographic pipeline (same 5-provider fallback) if available.
  // V8 expanded from 3 to 10 images — one per paragraph type. dataviz uses 6 (TOTAL_SCENES).
  // Each scene gets a unique image. Falls back to local generation if pre_generated_images is missing.
  const preGeneratedImages = Array.isArray(data.pre_generated_images) ? data.pre_generated_images : [];
  if (preGeneratedImages.length > 0) {
    console.log(`[AJ-V8] ★ Using ${preGeneratedImages.length} pre-generated images from infographic pipeline — one per scene`);
    // Use one unique image per scene (up to TOTAL_SCENES = 6).
    // If fewer images than scenes, fall back to local generation for missing scenes.
    for (let i = 0; i < TOTAL_SCENES; i++) {
      const b64 = preGeneratedImages[i];
      if (b64) {
        bgImages.push({ base64: b64, type: 'image/png' });
      } else {
        // Pre-generated ran out — push null, local generation will fill the gap below
        bgImages.push(null);
      }
    }
    console.log(`[AJ-V8]   Filled ${TOTAL_SCENES} scenes with ${preGeneratedImages.length} pre-generated images`);
  } else if (articleImageBase64) {
    // V347: Use the article image (AI-generated by news imager) for ALL scenes
    // This guarantees images in the video since the news imager already works
    const mime = 'image/jpeg'; // We'll use the same image for all scenes
    console.log(`[AJ347]  ★ Using article image for ALL 6 scenes (AI-generated from R2)`);
    for (let i = 0; i < TOTAL_SCENES; i++) {
      bgImages.push({ base64: articleImageBase64, type: mime });
    }

    // V347: Generate only 2 supplemental images (SEQUENTIAL with rate limiting)
    // Previous code generated 6 in parallel — caused Pollinations rate limiting + hour-long hangs
    // Share supplemental images across scenes: img1 → scenes 0,1,2  img2 → scenes 3,4,5
    console.log(`[AJ347]  Generating 2 supplemental AI images sequentially (shared across scenes)...`);
    const suppPrompts = [
      `dramatic dark cinematic scene related to ${topicEN}, warm golden amber light, deep navy background, moody atmosphere, wide shot, no text`,
      `abstract warm geometric shapes and data visualization, gold and amber on dark navy, clean minimal elegant, no text`,
    ];

    const suppBuffers = [];
    for (let i = 0; i < suppPrompts.length; i++) {
      const buf = await generateAIImage(suppPrompts[i], 1344, 768, data.market_impact);
      if (buf && buf.length > 1000) {
        const isSvg = buf.slice(0, 5).toString() === '<?xml' || buf.slice(0, 4).toString() === '<svg';
        if (!isSvg) {
          suppBuffers.push(buf);
          console.log(`[AJ347]  Supplemental image ${i + 1}: success (${(buf.length / 1024).toFixed(0)}KB)`);
        } else {
          suppBuffers.push(null);
        }
      } else {
        suppBuffers.push(null);
        console.log(`[AJ347]  Supplemental image ${i + 1}: failed — keeping article image`);
      }
    }

    // Apply supplemental images: img0 → scenes 0,1,2  img1 → scenes 3,4,5
    if (suppBuffers[0]) {
      const b64 = suppBuffers[0].toString('base64');
      const m = suppBuffers[0].slice(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : 'image/png';
      for (let i = 0; i < 3; i++) { bgImages[i] = { base64: b64, type: m }; }
    }
    if (suppBuffers[1]) {
      const b64 = suppBuffers[1].toString('base64');
      const m = suppBuffers[1].slice(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : 'image/png';
      for (let i = 3; i < TOTAL_SCENES; i++) { bgImages[i] = { base64: b64, type: m }; }
    }
  } else {
    // No article image — generate 2 AI images and share across all 6 scenes
    // V347: Was generating 6 sequential images (could take 30+ min!) — now just 2 with sharing
    console.log(`[AJ347]  No article image — generating 2 AI images (shared across 6 scenes)...`);
    const imagePrompts = [
      `dramatic dark cinematic scene related to ${topicEN}, warm golden amber light, deep navy background, moody atmosphere, wide shot, no text`,
      `abstract warm geometric shapes and data visualization, gold and amber on dark navy, clean minimal elegant, no text`,
    ];

    const imgBuffers = [];
    for (let i = 0; i < imagePrompts.length; i++) {
      console.log(`[AJ347]  Generating image ${i + 1}/2...`);
      try {
        const buf = await generateAIImage(imagePrompts[i], 1344, 768, data.market_impact);
        if (buf && buf.length > 1000) {
          const isSvg = buf.slice(0, 5).toString() === '<?xml' || buf.slice(0, 4).toString() === '<svg';
          if (!isSvg) {
            imgBuffers.push(buf);
            console.log(`[AJ347]  Image ${i + 1}: success (${(buf.length / 1024).toFixed(0)}KB)`);
          } else {
            imgBuffers.push(null);
          }
        } else {
          imgBuffers.push(null);
        }
      } catch (err) {
        console.warn(`[AJ347]  Image ${i + 1} failed: ${err.message?.slice(0, 80)}`);
        imgBuffers.push(null);
      }
    }

    // Share images across scenes: img0 → scenes 0,1,2  img1 → scenes 3,4,5
    for (let i = 0; i < TOTAL_SCENES; i++) {
      const bufIdx = i < 3 ? 0 : 1;
      const buf = imgBuffers[bufIdx];
      if (buf) {
        const b64 = buf.toString('base64');
        const mime = buf.slice(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : 'image/png';
        bgImages.push({ base64: b64, type: mime });
      } else {
        bgImages.push(null);
      }
    }

    // V350: If no images at all, leave as null — scenes will use dark background without image
    if (bgImages.every(img => img === null)) {
      console.warn(`[V350]  All AI image methods failed — scenes will render without background images`);
    }
  }

  data._bgImagesV2 = bgImages;

  // ── Step 2: Generate narration ──
  console.log('[AJ32]  Step 2: Generating narration (6 scenes)...');
  const narrationParts = await generateNarrationLLM(data);
  for (let i = 0; i < narrationParts.length; i++) {
    console.log(`[AJ32]  S${i+1}: ${narrationParts[i]?.slice(0, 60)}...`);
  }

  // ── Step 3: Generate voiceover per scene ──
  console.log('[AJ32]  Step 3: Generating voiceover...');
  const { audioPaths, audioDurations } = await generatePerSceneVoiceover(narrationParts, tmpDir, data.locale || 'ar');

  // Concatenate audio segments
  const fullNarrationPath = join(tmpDir, 'full_narration.mp3');
  const concatSuccess = concatenateAudioSegments(audioPaths, fullNarrationPath);

  // ── Step 4: Generate background music ──
  console.log('[AJ32]  Step 4: Generating background music...');
  const musicPath = join(tmpDir, 'bg_music.mp3');
  const totalDuration = SCENE_DEFS[SCENE_DEFS.length - 1][2];
  const musicSuccess = generateBackgroundMusic(musicPath, totalDuration);

  // ── Step 5: Mix narration + music ──
  console.log('[AJ32]  Step 5: Mixing audio...');
  const mixedAudioPath = join(tmpDir, 'mixed_audio.mp3');
  if (concatSuccess && musicSuccess && existsSync(fullNarrationPath) && existsSync(musicPath)) {
    mixAudioWithMusic(fullNarrationPath, musicPath, mixedAudioPath, 0.15);
  } else if (concatSuccess && existsSync(fullNarrationPath)) {
    writeFileSync(mixedAudioPath, readFileSync(fullNarrationPath));
  } else {
    spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo`, '-t', String(totalDuration), '-c:a', 'libmp3lame', '-b:a', '192k', mixedAudioPath], { encoding: 'utf-8', timeout: 30000 });
  }

  // ── Step 6: Render frames with Playwright ──
  console.log('[AJ32]  Step 6: Rendering frames with Playwright...');
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-features=IsolateOrigins,site-per-process',
        '--js-flags=--max-old-space-size=256',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
      ],
    });
  } catch (err) {
    console.error(`[AJ32]  Failed to launch browser: ${err.message}`);
    process.exit(1);
  }

  let context;
  let page;
  let globalFrame = 0;
  const sceneFrameDirs = []; // V350: Moved outside try — needed in Step 7 FFmpeg
  try {
  context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  page = await context.newPage();

  for (let si = 0; si < SCENE_DEFS.length; si++) {
    const [sceneName, startSec, endSec] = SCENE_DEFS[si];
    const sceneDuration = endSec - startSec;
    const sceneFrames = Math.round(sceneDuration * FPS);
    const sceneDir = join(framesDir, `scene_${si}_${sceneName}`);
    mkdirSync(sceneDir, { recursive: true });
    sceneFrameDirs.push(sceneDir);

    console.log(`[AJ32]  Scene ${si + 1}/${TOTAL_SCENES}: ${sceneName} (${startSec}s-${endSec}s, ${sceneFrames} frames)`);

    // Generate and set HTML
    const html = generateSceneHTML(sceneName, data);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for fonts to load
    await page.waitForTimeout(600);

    for (let f = 0; f < sceneFrames; f++) {
      const progress = f / Math.max(1, sceneFrames - 1);
      try {
        await page.evaluate(`window.setAnimationProgress(${progress.toFixed(6)})`);
      } catch {}
      const framePath = join(sceneDir, `frame_${String(globalFrame).padStart(6, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 85 });
      globalFrame++;
    }

    console.log(`[AJ32]  Scene ${si + 1} rendered: ${sceneFrames} frames`);
  }

  console.log(`[AJ32]  Total frames rendered: ${globalFrame}`);

  } catch (renderErr) {
    console.error(`[AJ32]  Frame rendering error: ${renderErr.message}`);
    throw renderErr;
  } finally {
    // Close browser — GUARANTEED cleanup even on error
    try { if (page) await page.close(); } catch {}
    try { if (context) await context.close(); } catch {}
    try { await browser.close(); } catch {}
    console.log('[AJ32]  Browser closed.');
  }

  // ── Step 7: Assemble video with FFmpeg ──
  console.log('[AJ32]  Step 7: Assembling video with FFmpeg...');

  const concatListPath = join(tmpDir, 'frames_concat.txt');
  const concatLines = [];
  for (const dir of sceneFrameDirs) {
    const files = readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
    for (const f of files) {
      concatLines.push(`file '${join(dir, f)}'`);
    }
  }
  writeFileSync(concatListPath, concatLines.join('\n'), 'utf-8');

  const rawVideoPath = join(tmpDir, 'raw_video.mp4');
  const finalOutputDir = dirname(outputPath);
  if (!existsSync(finalOutputDir)) mkdirSync(finalOutputDir, { recursive: true });

  // Step A: Frames → raw video
  console.log('[AJ32]  Creating video from frames...');
  const ffmpegFramesResult = spawnSync('ffmpeg', [
    '-y',
    '-f', 'concat', '-safe', '0',
    '-i', concatListPath,
    '-r', String(FPS),
    '-vf', `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',  // V9: lowered from 20
    '-maxrate', '5M', '-bufsize', '10M',  // V9: enforce minimum bitrate
    '-g', '48', '-keyint_min', '48',  // V9: fixed GOP for streaming
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    rawVideoPath,
  ], { encoding: 'utf-8', timeout: 300000 });

  if (ffmpegFramesResult.status !== 0 || !existsSync(rawVideoPath)) {
    console.error(`[AJ32]  FFmpeg frame assembly failed: ${ffmpegFramesResult.stderr?.slice(-300)}`);
    process.exit(1);
  }

  // Step B: Mux video + audio
  console.log('[AJ32]  Adding audio to video...');
  const hasAudio = existsSync(mixedAudioPath) && statSync(mixedAudioPath).size > 1000;
  if (hasAudio) {
    const muxResult = spawnSync('ffmpeg', [
      '-y',
      '-i', rawVideoPath,
      '-i', mixedAudioPath,
      '-c:v', 'copy',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      '-shortest',
      '-movflags', '+faststart',
      outputPath,
    ], { encoding: 'utf-8', timeout: 120000 });

    if (muxResult.status !== 0) {
      console.warn(`[AJ32]  Mux failed, copying video without audio: ${muxResult.stderr?.slice(-200)}`);
      const { copyFileSync } = await import('fs');
      copyFileSync(rawVideoPath, outputPath);
    }
  } else {
    const { copyFileSync } = await import('fs');
    copyFileSync(rawVideoPath, outputPath);
  }

  // Verify output
  if (existsSync(outputPath)) {
    const size = statSync(outputPath).size;
    const durationSec = Math.round(globalFrame / FPS);
    console.log(`\n══════════════════════════════════════════════════════`);
    console.log(`  Video rendered successfully!`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Size: ${(size / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  Duration: ~${durationSec}s`);
    console.log(`  Scenes: ${TOTAL_SCENES} (Hook → Map → Timeline → DataViz → HumanStory → Closing)`);
    console.log(`  Frames: ${globalFrame} at ${FPS} FPS`);
    console.log(`  Style: Al Jazeera AJ Labs V32 — Peninsula Square motif`);
    console.log(`══════════════════════════════════════════════════════\n`);
    // Output JSON for API route to parse
    console.log(JSON.stringify({ duration: durationSec }));
  } else {
    console.error(`[AJ32]  Output file not found!`);
    process.exit(1);
  }

  // Cleanup
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  // V338: Clear global timeout on successful completion
  clearTimeout(globalTimer);
}

main().catch(err => {
  console.error(`[AJ32]  Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
