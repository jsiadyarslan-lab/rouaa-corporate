#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// رؤى Observatory — فيديو اقتصادي احترافي كامل
// 8 مشاهد + صور مولدة + TTS + Ken Burns + FFmpeg
// ═══════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, statSync, rmSync, renameSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { generateImage } from './image-gen-shared.mjs';

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24; // 24fps (cinematic, fewer frames than 30)
const SCENE_DURATION = 5; // 5s per scene (matches original template, reduces total frames by ~40%)
const NUM_SCENES = 8;

// ═══ ألوان المشروع (تتناسق مع rouatradingnews) ═══
const C = {
  bg: '#0B0E14',
  card: '#151A22',
  border: '#D4AF37',        // ذهبي (بدل الأخضر)
  borderDim: 'rgba(212,175,55,0.3)',
  borderFaint: 'rgba(212,175,55,0.15)',
  green: '#10B981',          // أخضر المشروع
  red: '#EF4444',
  gold: '#D4AF37',
  amber: '#FFA500',
  white: '#FFFFFF',
  bright: '#F8F9FA',
  dim: 'rgba(255,255,255,0.65)',
  dimmer: 'rgba(255,255,255,0.4)',
  dimmest: 'rgba(255,255,255,0.2)',
};

// ═══ Helper: escape HTML + strip Markdown ═══
function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function stripMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold**
    .replace(/\*(.+?)\*/g, '$1')       // *italic*
    .replace(/__(.+?)__/g, '$1')       // __underline__
    .replace(/`([^`]+)`/g, '$1')       // `code`
    .replace(/#{1,6}\s+/g, '')          // # headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url)
    .replace(/^[-*+]\s+/gm, '')         // bullet lists
    .trim();
}

// ═══ Image background — V13: dynamic per report, not hardcoded ═══
function imgBg(name, imgDir, sceneIndex, data) {
  // Priority 1: pre_generated_images from route.ts (dynamically generated per report)
  const preGen = data?.pre_generated_images;
  if (Array.isArray(preGen) && preGen.length > 0 && preGen[sceneIndex]) {
    // V15: NO background-size here — Ken Burns sets it via page.evaluate per frame
    return `background-image:url('data:image/png;base64,${preGen[sceneIndex]}');background-position:center`;
  }
  // Priority 2: hardcoded fallback (dev/testing only)
  try {
    const b64 = readFileSync(join(imgDir, `${name}.png`)).toString('base64');
    return `background-image:url('data:image/png;base64,${b64}');background-position:center`;
  } catch { return ''; }
}

// ═══ AI Image Generation (Cloudflare FLUX → Pollinations fallback) ═══

const SCENE_IMAGE_PROMPTS = [
  (t)=>`Cinematic financial news scene about "${t}", dramatic lighting, dark background, documentary photography, 8k, no text`,
  (t)=>`Global market context about "${t}", world map, dark navy, financial photography, 8k, no text`,
  (t)=>`Financial data dashboard about "${t}", holographic charts, dark background, green accents, 8k, no text`,
  (t)=>`Root cause analysis about "${t}", interconnected nodes, dark background, 8k, no text`,
  (t)=>`Global impact map about "${t}", satellite view, heat zones, dark space, 8k, no text`,
  (t)=>`Financial assets about "${t}", bull and bear statues, dark marble, spotlight, 8k, no text`,
  (t)=>`Future scenarios about "${t}", branching decision tree, glowing paths, dark room, 8k, no text`,
  (t)=>`Strategic recommendations about "${t}", executive boardroom, holographic projections, night skyline, 8k, no text`,
];

async function ensureSceneImages(data, imgDir) {
  // V15.1: Check if we have ENOUGH images (8), not just > 0
  if (Array.isArray(data.pre_generated_images) && data.pre_generated_images.length >= 8) {
    console.log('[Observatory] Using pre_generated_images from route.ts');
    return;
  }
  // If we have some but not enough, generate the missing ones
  const existing = Array.isArray(data.pre_generated_images) ? data.pre_generated_images : [];
  const title = (data.title || 'financial report').slice(0,80);
  console.log(`[Observatory] Generating ${8 - existing.length} missing scene images for: "${title}"`);
  data.pre_generated_images = [...existing];
  for (let i = existing.length; i < 8; i++) {
    const buffer = await generateImage(SCENE_IMAGE_PROMPTS[i](title), 1344, 768);
    data.pre_generated_images.push(buffer && buffer.length > 1000 ? buffer.toString('base64') : null);
    console.log(`  [${i+1}/8] ${buffer ? '✓' : '✗'}`);
  }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;direction:rtl}
body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:${C.bg};font-family:'IBM Plex Sans Arabic',sans-serif;color:${C.bright}}
.mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}
.scene-bg{position:absolute;inset:0;background-size:100% 100%;background-position:center;transition:background-size 0.04s linear,background-position 0.04s linear}
.overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,14,20,0.3) 0%,transparent 30%,transparent 60%,rgba(11,14,20,0.5) 100%)}
.scanline{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(212,175,55,0.02) 3px,rgba(212,175,55,0.02) 4px);pointer-events:none;z-index:5}
.hdr{position:absolute;top:0;left:0;right:0;height:70px;background:rgba(11,14,20,0.92);border-bottom:2px solid ${C.borderDim};display:flex;align-items:center;justify-content:space-between;padding:0 50px;z-index:30;backdrop-filter:blur(10px)}
.hdr-l{display:flex;align-items:center;gap:20px}
.hdr-logo{font-size:28px;font-weight:700;color:${C.gold};letter-spacing:3px}
.hdr-logo em{font-style:normal;color:${C.bright};font-weight:300}
.hdr-status{font-size:16px;color:${C.gold};font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:10px;font-weight:500}
.hdr-dot{width:10px;height:10px;border-radius:50%;background:${C.gold};animation:blink 1s infinite;box-shadow:0 0 10px ${C.gold}}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0.3}}
.hdr-time{font-size:16px;color:${C.dim};font-family:'JetBrains Mono',monospace;font-weight:500}
.ftr{position:absolute;bottom:0;left:0;right:0;height:60px;background:rgba(11,14,20,0.92);border-top:2px solid ${C.borderDim};display:flex;align-items:center;justify-content:space-between;padding:0 50px;z-index:30;backdrop-filter:blur(10px)}
.ftr-ticker{display:flex;gap:50px;font-size:17px;font-family:'JetBrains Mono',monospace;overflow:hidden;white-space:nowrap;font-weight:500}
.tick-up{color:${C.green}}
.tick-dn{color:${C.red}}
.ftr-info{font-size:15px;color:${C.dim};font-family:'JetBrains Mono',monospace;font-weight:500}
.content{position:absolute;top:70px;bottom:60px;left:0;right:0;padding:80px 100px;display:flex;flex-direction:column;justify-content:center;z-index:10}
.content-box{background:rgba(11,14,20,0.65);backdrop-filter:blur(8px);border-radius:16px;padding:50px 60px;border:1px solid rgba(212,175,55,0.15);max-width:1400px}
.content-box-full{background:rgba(11,14,20,0.65);backdrop-filter:blur(8px);border-radius:16px;padding:50px 60px;border:1px solid rgba(212,175,55,0.15)}
.content-w-sidebar{right:380px}
.hook-q{font-size:108px;font-weight:700;color:${C.bright};line-height:1.15;letter-spacing:-3px;max-width:1400px;text-shadow:0 4px 30px rgba(0,0,0,0.9),0 2px 8px rgba(0,0,0,0.8);animation:fadeUp 1s ease .2s both}
.hook-q em{font-style:normal;color:${C.gold};font-weight:700}
.hook-num{font-family:'JetBrains Mono',monospace;font-size:240px;font-weight:700;color:${C.red};line-height:1;letter-spacing:-12px;margin-top:30px;text-shadow:0 0 40px rgba(255,59,59,0.6),0 4px 20px rgba(0,0,0,0.8);animation:fadeUp 1s ease .5s both}
.hook-label{font-size:36px;color:${C.dim};margin-top:15px;font-weight:400;text-shadow:0 2px 12px rgba(0,0,0,0.9);animation:fadeUp .8s ease .7s both}
.hook-sub{font-size:28px;color:${C.bright};margin-top:40px;line-height:1.6;max-width:1100px;font-weight:400;text-shadow:0 2px 12px rgba(0,0,0,0.9);animation:fadeUp .8s ease .9s both}
.sidebar{position:absolute;top:70px;bottom:60px;right:0;width:380px;background:rgba(21,26,34,0.75);border-left:2px solid ${C.borderDim};padding:40px;z-index:20;display:flex;flex-direction:column;gap:22px;backdrop-filter:blur(10px)}
.sb-title{font-size:16px;color:${C.gold};letter-spacing:4px;font-family:'JetBrains Mono',monospace;margin-bottom:8px;font-weight:600}
.sb-item{padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.1)}
.sb-label{font-size:16px;color:${C.dim};margin-bottom:6px;font-weight:400}
.sb-val{font-size:30px;font-weight:600;font-family:'JetBrains Mono',monospace}
.sb-up{color:${C.green}}
.sb-dn{color:${C.red}}
.scene-title{font-size:72px;font-weight:700;color:${C.bright};letter-spacing:-2px;margin-bottom:12px;text-shadow:0 4px 30px rgba(0,0,0,0.9),0 2px 8px rgba(0,0,0,0.8);animation:fadeUp .8s ease .2s both}
.scene-title em{font-style:normal;color:${C.gold};font-weight:700}
.scene-sub{font-size:26px;color:${C.dim};margin-bottom:50px;font-weight:400;line-height:1.5;text-shadow:0 2px 12px rgba(0,0,0,0.9);animation:fadeUp .8s ease .4s both}
.data-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:30px}
.dc{background:rgba(212,175,55,0.06);border:2px solid ${C.borderFaint};border-radius:12px;padding:32px;backdrop-filter:blur(5px)}
.dc-val{font-family:'JetBrains Mono',monospace;font-size:64px;font-weight:700;line-height:1}
.dc-label{font-size:20px;color:${C.dim};margin-top:12px;font-weight:500}
.dc-desc{font-size:17px;color:${C.dimmer};margin-top:6px}
.chart{position:relative;width:100%;height:420px;margin-top:40px;background:rgba(212,175,55,0.04);border:2px solid ${C.borderFaint};border-radius:12px;padding:30px;backdrop-filter:blur(5px)}
.chart-title{font-size:18px;color:${C.gold};font-family:'JetBrains Mono',monospace;margin-bottom:15px;font-weight:600}
.chart-svg{width:100%;height:320px}
.chart-line{fill:none;stroke:${C.green};stroke-width:3;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 10px rgba(16,185,129,0.7))}
.chart-area{fill:url(#grad);opacity:0.3}
.chart-grid line{stroke:rgba(255,255,255,0.08);stroke-width:1}
.causes-list{display:flex;flex-direction:column;gap:28px;margin-top:30px}
.cause-card{display:flex;align-items:flex-start;gap:32px;padding:32px;background:rgba(11,14,20,0.5);border-radius:12px;border-right:5px solid;backdrop-filter:blur(5px)}
.cause-num{font-family:'JetBrains Mono',monospace;font-size:64px;font-weight:700;min-width:80px;line-height:1}
.cause-title{font-size:32px;font-weight:600;color:${C.bright};margin-bottom:10px}
.cause-desc{font-size:22px;color:${C.dim};line-height:1.6;font-weight:400}
.heatmap{position:relative;width:100%;height:420px;margin-top:40px;background:rgba(11,14,20,0.5);border:2px solid ${C.borderFaint};border-radius:12px;padding:30px;backdrop-filter:blur(5px)}
.hm-title{font-size:18px;color:${C.gold};font-family:'JetBrains Mono',monospace;margin-bottom:15px;font-weight:600}
.hm-map{position:relative;width:100%;height:330px;background:rgba(212,175,55,0.02);border-radius:8px}
.hm-dot{position:absolute;border-radius:50%}
.hm-label{position:absolute;transform:translateX(-50%);font-size:14px;color:${C.dim};font-family:'JetBrains Mono',monospace;font-weight:500}
.assets{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px}
.asset-col{display:flex;flex-direction:column;gap:16px}
.asset-title{font-size:24px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:12px}
.asset-row{display:flex;justify-content:space-between;align-items:center;padding:22px;background:rgba(11,14,20,0.4);border-radius:10px;border-right:4px solid;backdrop-filter:blur(5px)}
.asset-name{font-size:22px;color:${C.bright};font-weight:500}
.asset-sym{font-size:16px;color:${C.dim};font-family:'JetBrains Mono',monospace}
.asset-reason{font-size:17px;font-weight:500}
.scenarios{display:flex;flex-direction:column;gap:24px;margin-top:30px}
.scn{display:flex;align-items:center;gap:32px;padding:30px;background:rgba(11,14,20,0.4);border-radius:12px;backdrop-filter:blur(5px);border:1px solid rgba(255,255,255,0.08)}
.scn-pct{font-family:'JetBrains Mono',monospace;font-size:60px;font-weight:700;min-width:150px;line-height:1}
.scn-body{flex:1}
.scn-title{font-size:28px;font-weight:600;margin-bottom:8px;color:${C.bright}}
.scn-desc{font-size:20px;color:${C.dim};line-height:1.5;font-weight:400}
.scn-bar{height:8px;background:rgba(255,255,255,0.1);border-radius:4px;margin-top:12px;overflow:hidden}
.scn-fill{height:100%;border-radius:4px}
.recos{display:flex;flex-direction:column;gap:22px;margin-top:30px}
.reco{display:flex;align-items:center;gap:36px;padding:30px;background:rgba(212,175,55,0.06);border-right:5px solid ${C.gold};border-radius:12px;backdrop-filter:blur(5px)}
.reco-num{font-family:'JetBrains Mono',monospace;font-size:48px;font-weight:700;color:${C.gold};min-width:70px;line-height:1}
.reco-body{flex:1}
.reco-action{font-size:26px;color:${C.bright};margin-bottom:8px;font-weight:600}
.reco-detail{font-size:18px;color:${C.dim};font-family:'JetBrains Mono',monospace;font-weight:500}
.outro-note{margin-top:60px;text-align:center;font-size:18px;color:${C.dimmer};font-family:'JetBrains Mono',monospace;font-weight:400}
/* V12: Short bullet points (max 10 words each) that appear sequentially */
.bullet-list{display:flex;flex-direction:column;gap:18px;margin-top:20px}
.bullet{display:flex;align-items:flex-start;gap:16px;font-size:28px;color:${C.bright};font-weight:400;line-height:1.4;text-shadow:0 2px 12px rgba(0,0,0,0.9)}
.bullet-dot{width:12px;height:12px;border-radius:50%;background:${C.gold};flex-shrink:0;margin-top:12px;box-shadow:0 0 8px ${C.gold}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
`;

function hdr(data) {
  return `<div class="hdr">
    <div class="hdr-l">
      <div class="hdr-logo">رؤى <em>OBSERVATORY</em></div>
      <div class="hdr-status"><div class="hdr-dot"></div>LIVE FEED</div>
    </div>
    <div class="hdr-time">${escapeHTML(stripMarkdown(data.date || ''))} · ${escapeHTML(stripMarkdown(data.category || ''))}</div>
  </div>`;
}

function ftr(sceneNum, sceneName, data) {
  // V15: Dynamic ticker from data.stats — no more hardcoded FAO/WHEAT/CORN
  const tickerItems = (data?.stats && data.stats.length > 0)
    ? data.stats.map(s => {
        const val = String(s.value || '');
        const isUp = val.includes('+') || (!val.includes('-') && !val.includes('▼'));
        const cls = isUp ? 'tick-up' : 'tick-dn';
        const arrow = isUp ? '▲' : '▼';
        return `<span class="${cls}">${escapeHTML(stripMarkdown(s.label))} ${escapeHTML(stripMarkdown(val))} ${arrow}</span>`;
      }).join(' ')
    : '<span class="tick-up">— —</span>';
  return `<div class="ftr">
    <div class="ftr-ticker">${tickerItems}</div>
    <div class="ftr-info">SCENE ${sceneNum}/8 · ${sceneName}</div>
  </div>`;
}

function sidebar(data) {
  return `<div class="sidebar">
    <div class="sb-title">▸ المراقبة الحية</div>
    <div class="sb-item"><div class="sb-label">مؤشر الفاو للغذاء</div><div class="sb-val sb-up mono">132.4 ▲</div></div>
    <div class="sb-item"><div class="sb-label">قمح · بوشل</div><div class="sb-val sb-up mono">545¢ ▲</div></div>
    <div class="sb-item"><div class="sb-label">أسمدة · NTR</div><div class="sb-val sb-up mono">47.20 ▲</div></div>
    <div class="sb-item"><div class="sb-label">الدولار · DXY</div><div class="sb-val sb-dn mono">100.85 ▼</div></div>
    <div class="sb-item"><div class="sb-label">ثقة التقرير</div><div class="sb-val" style="color:${C.gold}">${data.confidence}</div></div>
  </div>`;
}

// ═══ Helper: split text into short bullets (max 10 words each) ═══
function toBullets(text, maxBullets = 4) {
  if (!text) return [];
  // V15: Force-split into chunks of max 8 words regardless of punctuation
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const bullets = [];
  for (let i = 0; i < words.length && bullets.length < maxBullets; i += 8) {
    const chunk = words.slice(i, i + 8).join(' ');
    if (chunk.length > 3) bullets.push(chunk);
  }
  return bullets.slice(0, maxBullets);
}

function bulletsHTML(text, maxBullets = 4) {
  const bullets = toBullets(stripMarkdown(text), maxBullets);
  return `<div class="bullet-list">${bullets.map((b, i) =>
    `<div class="bullet" style="animation:fadeUp .6s ease ${0.3 + i * 0.3}s both"><div class="bullet-dot"></div><div>${escapeHTML(b)}</div></div>`
  ).join('')}</div>`;
}

// ═══ 8 Scenes ═══
function scene1(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('01_hook', imgDir, 0, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="hook-q">${escapeHTML(stripMarkdown(d.title || t.hookQEm))}</div>
    <div class="hook-num mono">${(d.stats?.[0]?.value) || '—'}</div>
    <div class="hook-label">${escapeHTML(stripMarkdown(d.stats?.[0]?.label || t.hookLabel))}</div>
    ${bulletsHTML(d.summary || (d.key_points || []).join('. '), 3)}
  </div>
</div>
${ftr(1, 'HOOK', d)}
</body></html>`;
}

function scene2(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('02_context', imgDir, 1, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="scene-title">${t.s2Title} <em>${t.s2Em}</em> ${t.s2TitleEnd}</div>
    ${bulletsHTML(d.summary || (d.key_points || []).join('. '), 4)}
    <div class="data-bar">
      ${d.stats.map(s => {
        const c = String(s.value).includes('-') ? C.red : String(s.value).includes('+') ? C.green : C.gold;
        return `<div class="dc"><div class="dc-val" style="color:${c}">${escapeHTML(stripMarkdown(String(s.value)))}</div><div class="dc-label">${escapeHTML(stripMarkdown(s.label))}</div><div class="dc-desc">${escapeHTML(stripMarkdown(s.description || ""))}</div></div>`;
      }).join('')}
    </div>
  </div>
</div>
${ftr(2, 'CONTEXT', d)}
</body></html>`;
}

function scene3(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  const points = [];
  const vals = [110,115,118,125,130,128,135,140,138,145,150,148,155,160,158,165,170,168,175,180];
  const w=1400,h=280,pad=40;
  vals.forEach((v,i) => {
    const x = pad + (i/(vals.length-1))*(w-2*pad);
    const y = h - pad - ((v-100)/100)*(h-2*pad);
    points.push(`${x},${y}`);
  });
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('03_data', imgDir, 2, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="scene-title">${t.s3Title} <em>${t.s3Em}</em> ${t.s3TitleEnd}</div>
    <div class="chart">
      <div class="chart-title">▸ FAO FOOD PRICE INDEX · MONTHLY</div>
      <svg class="chart-svg" viewBox="0 0 ${w} ${h}">
        <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${C.green}" stop-opacity="0.5"/><stop offset="100%" stop-color="${C.green}" stop-opacity="0"/></linearGradient></defs>
        <g class="chart-grid"><line x1="${pad}" y1="${pad}" x2="${w-pad}" y2="${pad}"/><line x1="${pad}" y1="${h/2}" x2="${w-pad}" y2="${h/2}"/><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}"/></g>
        <path class="chart-area" d="M ${pad},${h-pad} L ${points.join(' L ')} L ${w-pad},${h-pad} Z"/>
        <path class="chart-line" d="M ${points.join(' L ')}"/>
      </svg>
    </div>
    ${bulletsHTML(d.summary || (d.key_points || []).join(". "), 3)}
  </div>
</div>
${ftr(3, 'DATA', d)}
</body></html>`;
}

function scene4(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('04_causes', imgDir, 3, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="scene-title">${t.s4Title} <em>${t.s4Em}</em> ${t.s4TitleEnd}</div>
    <div class="causes-list">
      ${d.root_causes.map((r,i) => {
        const colors = [C.red, C.amber, C.green];
        const c = colors[i%3];
        return `<div class="cause-card" style="border-color:${c}"><div class="cause-num" style="color:${c}">0${i+1}</div><div style="flex:1"><div class="cause-title">${escapeHTML(stripMarkdown(r.title))}</div><div class="cause-desc">${escapeHTML(stripMarkdown(r.description || ""))}</div></div></div>`;
      }).join('')}
    </div>
  </div>
</div>
${ftr(4, 'CAUSES', d)}
</body></html>`;
}

function scene5(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  const dots = [
    {x:25,y:40,color:C.red,size:36,label:'أمريكا الجنوبية'},
    {x:50,y:32,color:C.red,size:30,label:'أوروبا الشرقية'},
    {x:60,y:48,color:C.amber,size:24,label:'الشرق الأوسط'},
    {x:75,y:42,color:C.red,size:34,label:'آسيا'},
    {x:80,y:65,color:C.amber,size:22,label:'أستراليا'},
    {x:20,y:35,color:C.green,size:26,label:'أمريكا الشمالية'},
  ];
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('05_heatmap', imgDir, 4, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="scene-title">${t.s5Title} <em>${t.s5Em}</em> ${t.s5TitleEnd}</div>
    <div class="heatmap">
      <div class="hm-title">▸ GLOBAL AGRICULTURAL IMPACT MAP</div>
      <div class="hm-map">
        ${dots.map(dt => `<div class="hm-dot" style="left:${dt.x}%;top:${dt.y}%;width:${dt.size}px;height:${dt.size}px;background:${dt.color};box-shadow:0 0 ${dt.size*1.5}px ${dt.color}"></div>`).join('')}
        ${dots.map(dt => `<div class="hm-label" style="left:${dt.x}%;top:${dt.y + dt.size/2 + 8}px">${dt.label}</div>`).join('')}
      </div>
    </div>
    ${bulletsHTML(d.summary || (d.key_points || []).join(". "), 3)}
  </div>
</div>
${ftr(5, 'HEATMAP', d)}
</body></html>`;
}

function scene6(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('06_assets', imgDir, 5, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="scene-title">${t.s6Title} <em>${t.s6Em}</em> ${t.s6TitleEnd}</div>
    <div class="assets">
      <div class="asset-col">
        <div class="asset-title" style="color:${C.green}">▲ يستفيد</div>
        ${d.benefiting_assets.map(a => `<div class="asset-row" style="border-color:${C.green}"><div><div class="asset-name">${escapeHTML(stripMarkdown(a.name))}</div><div class="asset-sym">${escapeHTML(a.symbol || "")}</div></div><div class="asset-reason" style="color:${C.green}">${escapeHTML(stripMarkdown(a.reason || ""))}</div></div>`).join('')}
      </div>
      <div class="asset-col">
        <div class="asset-title" style="color:${C.red}">▼ يتضرر</div>
        ${d.harmed_assets.map(a => `<div class="asset-row" style="border-color:${C.red}"><div><div class="asset-name">${escapeHTML(stripMarkdown(a.name))}</div><div class="asset-sym">${escapeHTML(a.symbol || "")}</div></div><div class="asset-reason" style="color:${C.red}">${escapeHTML(stripMarkdown(a.reason || ""))}</div></div>`).join('')}
      </div>
    </div>
  </div>
</div>
${ftr(6, 'ASSETS', d)}
</body></html>`;
}

function scene7(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('07_scenarios', imgDir, 6, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="scene-title">${t.s7Title} <em>${t.s7Em}</em> ${t.s7TitleEnd}</div>
    <div class="scenarios">
      ${d.scenarios.map(s => {
        const pct = parseInt(s.probability)||0;
        return `<div class="scn"><div class="scn-pct" style="color:${s.color}">${pct}%</div><div class="scn-body"><div class="scn-title">${escapeHTML(stripMarkdown(s.title))}</div><div class="scn-desc">${escapeHTML(stripMarkdown(s.result || ""))}</div><div class="scn-bar"><div class="scn-fill" style="width:${pct}%;background:${s.color}"></div></div></div></div>`;
      }).join('')}
    </div>
  </div>
</div>
${ftr(7, 'SCENARIOS', d)}
</body></html>`;
}

function scene8(d, imgDir) {
  const t = getI18N(d.locale || "ar");
  return `<!DOCTYPE html><html lang="${d.locale || 'ar'}" dir="${getI18N(d.locale || 'ar').dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${imgBg('08_recommendations', imgDir, 7, d)}"></div>
<div class="overlay"></div><div class="scanline"></div>
${hdr(d)}
<div class="content">
  <div class="content-box">
    <div class="scene-title">${t.s8Title} <em>${t.s8Em}</em> ${t.s8TitleEnd}</div>
    <div class="recos">
      ${d.recommendations.map((r,i) => `<div class="reco"><div class="reco-num">0${i+1}</div><div class="reco-body"><div class="reco-action">${escapeHTML(stripMarkdown(r.asset))}</div><div class="reco-detail">${escapeHTML(stripMarkdown(r.action))}</div></div></div>`).join('')}
    </div>
    <div class="outro-note">${t.outro}</div>
  </div>
</div>
${ftr(8, 'RECOMMENDATIONS', d)}
</body></html>`;
}

// ═══ i18n — 5 languages ═══
const I18N = {
  ar: {
    dir: 'rtl', ttsVoice: 'ar-AE-FatimaNeural',
    hookQ: 'هل أصبح', hookQEm: 'الغذاء', hookQEnd: 'السلاح الأقوى في العالم؟',
    hookLabel: '${t.hookLabel}',
    s2Title: 'ماذا يحدث', s2Em: 'الآن', s2TitleEnd: '؟',
    s3Title: 'الأرقام', s3Em: 'تكشف', s3TitleEnd: 'الحقيقة',
    s4Title: 'لماذا', s4Em: 'يحدث', s4TitleEnd: 'هذا؟',
    s5Title: 'خريطة', s5Em: 'التأثير', s5TitleEnd: 'العالمي',
    s6Title: 'من', s6Em: 'يستفيد', s6TitleEnd: '؟ من يتضرر؟',
    s7Title: 'إلى أين', s7Em: 'نتجه', s7TitleEnd: '؟',
    s8Title: 'ماذا', s8Em: 'تفعل', s8TitleEnd: 'الآن؟',
    benefiting: 'يستفيد', harmed: 'يتضرر',
    outro: 'رؤى OBSERVATORY · للأغراض الإعلامية فقط — لا يُعد نصيحة استثمارية',
    nHookPrefix: 'هل أصبح',
    nContext: 'ماذا يحدث الآن؟',
    nData: 'الأرقام تكشف الحقيقة.',
    nCauses: 'لماذا يحدث هذا؟',
    nAssets: 'من يستفيد ومن يتضرر؟',
    nScenarios: 'إلى أين نتجه؟',
    nRecos: 'ماذا تفعل الآن؟',
    nOutro: 'شكراً لمتابعتكم تقرير رؤى. هذا التقرير للأغراض الإعلامية فقط ولا يُعد نصيحة استثمارية.',
  },
  en: {
    dir: 'ltr', ttsVoice: 'en-US-JennyNeural',
    hookQ: 'Has', hookQEm: 'food', hookQEnd: 'become the world\'s most powerful weapon?',
    hookLabel: 'Global crop productivity decline',
    s2Title: 'What\'s', s2Em: 'happening', s2TitleEnd: 'now?',
    s3Title: 'Numbers', s3Em: 'reveal', s3TitleEnd: 'the truth',
    s4Title: 'Why is this', s4Em: 'happening', s4TitleEnd: '?',
    s5Title: 'Global impact', s5Em: 'map', s5TitleEnd: '',
    s6Title: 'Who', s6Em: 'benefits', s6TitleEnd: '? Who loses?',
    s7Title: 'Where are we', s7Em: 'heading', s7TitleEnd: '?',
    s8Title: 'What should you', s8Em: 'do', s8TitleEnd: 'now?',
    benefiting: 'Benefits', harmed: 'Harmed',
    outro: 'Rouaa OBSERVATORY · For informational purposes only — not investment advice',
    nHookPrefix: 'Has',
    nContext: 'What\'s happening now?',
    nData: 'Numbers reveal the truth.',
    nCauses: 'Why is this happening?',
    nAssets: 'Who benefits and who loses?',
    nScenarios: 'Where are we heading?',
    nRecos: 'What should you do now?',
    nOutro: 'Thank you for watching the Rouaa Report. This report is for informational purposes only.',
  },
  fr: {
    dir: 'ltr', ttsVoice: 'fr-FR-HenriNeural',
    hookQ: 'La', hookQEm: 'nourriture', hookQEnd: 'est-elle devenue l\'arme la plus puissante du monde ?',
    hookLabel: 'Baisse de la productivité agricole mondiale',
    s2Title: 'Que', s2Em: 'se passe-t-il', s2TitleEnd: 'maintenant ?',
    s3Title: 'Les chiffres', s3Em: 'révèlent', s3TitleEnd: 'la vérité',
    s4Title: 'Pourquoi cela', s4Em: 'arrive-t-il', s4TitleEnd: '?',
    s5Title: 'Carte d\'impact', s5Em: 'mondial', s5TitleEnd: '',
    s6Title: 'Qui', s6Em: 'bénéficie', s6TitleEnd: '? Qui perd ?',
    s7Title: 'Où', s6Em: 'allons-nous', s7TitleEnd: '?',
    s8Title: 'Que', s8Em: 'faire', s8TitleEnd: 'maintenant ?',
    benefiting: 'Bénéficie', harmed: 'Affecté',
    outro: 'Rouaa OBSERVATORY · À titre informatif uniquement — ne constitue pas un conseil en investissement',
    nHookPrefix: 'La question est devenue',
    nContext: 'Que se passe-t-il maintenant ?',
    nData: 'Les chiffres révèlent la vérité.',
    nCauses: 'Pourquoi cela arrive-t-il ?',
    nAssets: 'Qui bénéficie et qui perd ?',
    nScenarios: 'Où allons-nous ?',
    nRecos: 'Que faire maintenant ?',
    nOutro: 'Merci d\'avoir suivi le rapport Rouaa. Ce rapport est à titre informatif uniquement.',
  },
  tr: {
    dir: 'ltr', ttsVoice: 'tr-TR-EmelNeural',
    hookQ: 'Gıda dünyanın en güçlü', hookQEm: 'silahı', hookQEnd: 'mı oldu?',
    hookLabel: 'Küresel mahsul verimliliğinde düşüş',
    s2Title: 'Şu an', s2Em: 'neler', s2TitleEnd: 'oluyor?',
    s3Title: 'Rakamlar', s3Em: 'gerçeği', s3TitleEnd: 'ortaya koyuyor',
    s4Title: 'Bu neden', s4Em: 'oluyor', s4TitleEnd: '?',
    s5Title: 'Küresel etki', s5Em: 'haritası', s5TitleEnd: '',
    s6Title: 'Kim', s6Em: 'kazançlı', s6TitleEnd: '? Kim zararlı?',
    s7Title: 'Nereye', s7Em: 'gidiyoruz', s7TitleEnd: '?',
    s8Title: 'Şimdi ne', s8Em: 'yapmalısın', s8TitleEnd: '?',
    benefiting: 'Kazançlı', harmed: 'Zararlı',
    outro: 'Rouaa OBSERVATORY · Yalnızca bilgilendirme amaçlıdır — yatırım tavsiyesi değildir',
    nHookPrefix: 'Güncel konu:',
    nContext: 'Şu an neler oluyor?',
    nData: 'Rakamlar gerçeği ortaya koyuyor.',
    nCauses: 'Bu neden oluyor?',
    nAssets: 'Kim kazançlı ve kim zararlı?',
    nScenarios: 'Nereye gidiyoruz?',
    nRecos: 'Şimdi ne yapmalısın?',
    nOutro: 'Rouaa raporunu izlediğiniz için teşekkürler. Bu rapor yalnızca bilgilendirme amaçlıdır.',
  },
  es: {
    dir: 'ltr', ttsVoice: 'es-ES-ElviraNeural',
    hookQ: '¿Se ha convertido la', hookQEm: 'comida', hookQEnd: 'en el arma más poderosa del mundo?',
    hookLabel: 'Caída de la productividad agrícola mundial',
    s2Title: 'Qué está', s2Em: 'pasando', s2TitleEnd: 'ahora?',
    s3Title: 'Los números', s3Em: 'revelan', s3TitleEnd: 'la verdad',
    s4Title: 'Por qué está', s4Em: 'pasando', s4TitleEnd: 'esto?',
    s5Title: 'Mapa de impacto', s5Em: 'mundial', s5TitleEnd: '',
    s6Title: 'Quién', s6Em: 'se beneficia', s6TitleEnd: '? Quién pierde?',
    s7Title: 'Hacia dónde', s7Em: 'vamos', s7TitleEnd: '?',
    s8Title: 'Qué debes', s8Em: 'hacer', s8TitleEnd: 'ahora?',
    benefiting: 'Se beneficia', harmed: 'Se perjudica',
    outro: 'Rouaa OBSERVATORY · Solo para fines informativos — no constituye asesoramiento financiero',
    nHookPrefix: 'Se ha convertido',
    nContext: 'Qué está pasando ahora?',
    nData: 'Los números revelan la verdad.',
    nCauses: 'Por qué está pasando esto?',
    nAssets: 'Quién se beneficia y quién pierde?',
    nScenarios: 'Hacia dónde vamos?',
    nRecos: 'Qué debes hacer ahora?',
    nOutro: 'Gracias por seguir el informe Rouaa. Este informe es solo para fines informativos.',
  },
};
function getI18N(locale) { return I18N[locale] || I18N.en; }

// ═══ Narration — reads displayed text per scene (i18n) ═══
function generateNarration(d) {
  const t = getI18N(d.locale || 'ar');
  const stats = (d.stats||[]).map(s => `${s.label}: ${s.value}`).join(d.locale === 'ar' ? '، ' : ', ');
  const rootCauses = (d.root_causes||[]).map(r => `${r.title}. ${r.description}`).join('. ');
  const benAssets = (d.benefiting_assets||[]).map(a => `${a.name} (${a.symbol})`).join(d.locale === 'ar' ? '، ' : ', ');
  const harmAssets = (d.harmed_assets||[]).map(a => `${a.name} (${a.symbol})`).join(d.locale === 'ar' ? '، ' : ', ');
  const scenarios = (d.scenarios||[]).map(s => `${s.title}: ${s.result}`).join('. ');
  const recs = (d.recommendations||[]).map(r => `${r.asset}: ${r.action}`).join('. ');
  return [
    `${t.nHookPrefix} ${d.title || ''}. ${d.summary}`,
    `${t.nContext} ${d.summary}`,
    `${t.nData} ${stats}`,
    `${t.nCauses} ${rootCauses}`,
    `${t.nAssets} ${t.benefiting}: ${benAssets}. ${t.harmed}: ${harmAssets}.`,
    `${t.nScenarios} ${scenarios}`,
    `${t.nRecos} ${recs}`,
    t.nOutro,
  ];
}

// ═══ TTS via edge-tts (i18n voice per locale) ═══
function generateTTS(text, outputPath, locale) {
  const t = getI18N(locale || 'ar');
  const voice = t.ttsVoice;
  const tmpFile = outputPath.replace('.mp3', '_text.txt');
  writeFileSync(tmpFile, text, 'utf-8');
  const py = `import asyncio, edge_tts\nasync def main():\n    text = open("${tmpFile}", "r", encoding="utf-8").read()\n    comm = edge_tts.Communicate(text, "${voice}", rate="-5%", pitch="+0Hz")\n    await comm.save("${outputPath}")\nasyncio.run(main())`;
  const result = spawnSync('python3', ['-c', py], { encoding: 'utf-8', timeout: 120000 });
  try { unlinkSync(tmpFile); } catch {}
  return result.status === 0 && existsSync(outputPath) && statSync(outputPath).size > 1000;
}

function getAudioDuration(path) {
  try {
    const r = spawnSync('ffprobe', ['-v','quiet','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1', path], { encoding: 'utf-8', timeout: 10000 });
    return parseFloat(r.stdout?.trim()) || 0;
  } catch { return 0; }
}

// ═══ Main Pipeline ═══
async function main() {
  const startTime = Date.now();
  console.log('[Observatory] Starting full video generation...');

  const args = process.argv.slice(2);
  let inputPath = '', outputPath = '', imgDir = join(process.cwd(), 'public', 'observatory_images');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i+1]) inputPath = args[++i];
    if (args[i] === '--output' && args[i+1]) outputPath = args[++i];
    if (args[i] === '--images' && args[i+1]) imgDir = args[++i];
  }
  if (!inputPath || !outputPath) {
    console.error('Usage: node observatory_renderer.mjs --input data.json --output video.mp4 --images /path/to/images');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
  console.log(`[Observatory] Title: ${data.title}`);

  // Fallback to local images if /app path doesn't exist
  if (!existsSync(join(imgDir, '01_hook.png'))) {
    imgDir = '/home/z/my-project/download/observatory_images';
    console.log(`[Observatory] Using local images: ${imgDir}`);
  }

  // 1. Narration
  console.log('[Observatory] Step 0: Ensure scene images...');
  await ensureSceneImages(data, imgDir);

  console.log('[Observatory] Step 1: Narration...');
  const narrations = generateNarration(data);

  // 2. TTS per scene
  console.log('[Observatory] Step 2: TTS...');
  const tmpDir = join(tmpdir(), `observatory-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });
  const audioPaths = [];
  const audioDurations = [];

  for (let i = 0; i < NUM_SCENES; i++) {
    const audioPath = join(tmpDir, `scene_${i}.mp3`);
    const success = generateTTS(narrations[i] || '', audioPath, data.locale || 'ar');
    if (success) {
      audioDurations.push(getAudioDuration(audioPath));
      audioPaths.push(audioPath);
      console.log(`  S${i+1}: ${audioDurations[i].toFixed(1)}s`);
    } else {
      audioDurations.push(SCENE_DURATION);
      audioPaths.push(null);
      console.log(`  S${i+1}: TTS failed, using ${SCENE_DURATION}s`);
    }
  }

  // 3. Concatenate audio
  console.log('[Observatory] Step 3: Audio concat...');
  const fullAudioPath = join(tmpDir, 'full.mp3');
  const validAudio = audioPaths.filter(p => p);
  if (validAudio.length > 0) {
    const listFile = join(tmpDir, 'list.txt');
    writeFileSync(listFile, validAudio.map(p => `file '${p}'`).join('\n'));
    spawnSync('ffmpeg', ['-y','-f','concat','-safe','0','-i',listFile,'-c:a','libmp3lame','-b:a','192k',fullAudioPath], { encoding: 'utf-8', timeout: 60000 });
    const procPath = fullAudioPath.replace('.mp3','_proc.mp3');
    spawnSync('ffmpeg', ['-y','-i',fullAudioPath,'-af','silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-40dB,loudnorm=I=-16:LRA=11:TP=-1.5','-c:a','libmp3lame','-b:a','192k',procPath], { encoding: 'utf-8', timeout: 120000 });
    if (existsSync(procPath)) { try { unlinkSync(fullAudioPath); } catch {} renameSync(procPath, fullAudioPath); }
  }

  // 4. Render frames with Ken Burns
  console.log('[Observatory] Step 4: Rendering frames...');
  const framesDir = join(tmpDir, 'frames');
  mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  const scenes = [scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8];
  let frameCount = 0;

  for (let s = 0; s < NUM_SCENES; s++) {
    const dur = Math.max(SCENE_DURATION, audioDurations[s] || 0);
    const totalFrames = Math.ceil(dur * FPS);
    const sceneStartMs = Date.now();
    console.log(`  [Scene ${s+1}/8] START — dur=${dur.toFixed(1)}s frames=${totalFrames}`);

    const html = scenes[s](data, imgDir);
    try { await page.setContent(html, { waitUntil: 'domcontentloaded' }); } catch (e) {
      console.error(`  [Scene ${s+1}] setContent failed: ${e.message}`);
      continue;
    }
    await page.waitForTimeout(200);

    // V15: Set initial background-size before rendering frames (Ken Burns starts from 100%)
    try {
      await page.evaluate(() => {
        const bg = document.getElementById('bg');
        if (bg) { bg.style.backgroundSize = '100% 100%'; bg.style.backgroundPosition = '50% 50%'; }
      });
    } catch {}

    for (let f = 0; f < totalFrames; f++) {
      // Ken Burns: smooth per-frame update (transition: 0.04s linear makes it seamless at 24fps)
      const kbProgress = (f + 1) / totalFrames;
      const kbSize = 100 + 8 * kbProgress;
      const kbPosX = 50 - 5 * kbProgress;
      const kbPosY = 50 - 3 * kbProgress;
      try {
        await page.evaluate(({ sz, px, py }) => {
          const bg = document.getElementById('bg');
          if (bg) { bg.style.backgroundSize = sz + '%'; bg.style.backgroundPosition = px + '% ' + py + '%'; }
        }, { sz: kbSize, px: kbPosX, py: kbPosY });
      } catch (e) {
        // Log first error only to avoid spam
        if (f === 0) console.warn(`  [Scene ${s+1}] Ken Burns evaluate failed: ${e.message?.slice(0, 80)}`);
      }
      try {
        await page.screenshot({ path: join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
      } catch (e) { console.warn(`  Frame ${f} failed: ${e.message?.slice(0,60)}`); }
      frameCount++;
    }
    const sceneElapsed = ((Date.now() - sceneStartMs) / 1000).toFixed(1);
    console.log(`  [Scene ${s+1}/8] DONE in ${sceneElapsed}s — frames so far: ${frameCount}`);
  }
  await browser.close();
  console.log(`[Observatory] Total frames: ${frameCount}`);

  // 5. FFmpeg encode
  console.log('[Observatory] Step 5: FFmpeg encode...');
  const videoOnlyPath = join(tmpDir, 'video.mp4');
  spawnSync('ffmpeg', ['-y','-framerate',String(FPS),'-i',join(framesDir,'frame_%05d.jpg'),'-vf','format=yuv420p','-pix_fmt','yuv420p','-c:v','libx264','-preset','fast','-crf','18','-maxrate','5M','-g','48','-keyint_min','48','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',videoOnlyPath], { encoding: 'utf-8', timeout: 300000 });

  // 6. Merge
  console.log('[Observatory] Step 6: Merge audio + video...');
  if (existsSync(fullAudioPath)) {
    spawnSync('ffmpeg', ['-y','-i',videoOnlyPath,'-i',fullAudioPath,'-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',outputPath], { encoding: 'utf-8', timeout: 120000 });
  } else {
    renameSync(videoOnlyPath, outputPath);
  }

  // 7. Cleanup
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeMB = (statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`[Observatory] ✅ Done — ${elapsed}s | ${sizeMB}MB`);
  console.log(`[Observatory] Output: ${outputPath}`);
}

main().catch(err => { console.error('[Observatory] FATAL:', err.message); process.exit(1); });
