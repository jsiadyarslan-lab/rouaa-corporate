// ─── Shared Video Rendering Utilities V5 ──────────────────────────
// Common functions used by BOTH video-renderer.mjs and video-renderer-dataviz.mjs
// Extracted to eliminate code duplication:
//   - TTS (edge-tts + Groq fallback)
//   - AI Image Generation (Pollinations → SDK → CLI → fallback)
//   - Utility functions (stripMarkdown, formatNumber, etc.)
//   - Audio helpers (getAudioDuration, generateBackgroundMusic, mixAudioWithMusic)
//
// Import: import { ... } from './video-shared.mjs';

import { execSync, spawnSync, execFile } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync, statSync } from 'fs';
import { join, tmpdir } from 'path';
import { randomUUID } from 'crypto';

const execFileAsync = (() => {
  const { promisify } = require('util');
  return promisify(execFile);
})();

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

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

function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (typeof num === 'string') return num;
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed ? num.toFixed(1) : String(num);
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function easeOutCubic(t) { const p = clamp(t, 0, 1); return 1 - Math.pow(1 - p, 3); }
function easeInOutCubic(t) { const p = clamp(t, 0, 1); return p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2; }

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Arabic numeral mapping
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

function getImpactColor(marketImpact, colors) {
  if (['bullish', 'positive'].includes(marketImpact)) return colors.accentGreen || '#22C55E';
  if (['bearish', 'negative'].includes(marketImpact)) return colors.accentRed || '#EF4444';
  return colors.accentGold || '#CA8A04';
}

function getImpactLabel(marketImpact, locale) {
  if (['bullish', 'positive'].includes(marketImpact)) {
    return locale === 'ar' ? 'صعودي' : locale === 'tr' ? 'Yükseliş' : locale === 'fr' ? 'Haussier' : 'Bullish';
  }
  if (['bearish', 'negative'].includes(marketImpact)) {
    return locale === 'ar' ? 'هبوطي' : locale === 'tr' ? 'Düşüş' : locale === 'fr' ? 'Baissier' : 'Bearish';
  }
  return locale === 'ar' ? 'محايد' : locale === 'tr' ? 'Nötr' : locale === 'fr' ? 'Neutre' : 'Neutral';
}

function getImpactArrow(marketImpact) {
  if (['bullish', 'positive'].includes(marketImpact)) return '↑';
  if (['bearish', 'negative'].includes(marketImpact)) return '↓';
  return '→';
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
const FRENCH_FEMALE_VOICES = [
  'fr-FR-DeniseNeural',
  'fr-FR-EloiseNeural',
  'fr-CA-SylvieNeural',
];

// Check Python + edge-tts availability ONCE
let pythonAvailable = null;
function isPythonEdgeTTS() {
  if (pythonAvailable !== null) return pythonAvailable;
  try {
    const result = spawnSync('python3', ['-c', 'import edge_tts; print("ok")'], {
      encoding: 'utf-8',
      timeout: 10000,
    });
    pythonAvailable = result.status === 0 && result.stdout?.trim() === 'ok';
    if (!pythonAvailable) {
      console.warn('[TTS V5] Python3 + edge_tts NOT available — will use Groq TTS fallback');
    } else {
      console.log('[TTS V5] Python3 + edge_tts available');
    }
  } catch {
    pythonAvailable = false;
    console.warn('[TTS V5] Python3 not found — will use Groq TTS fallback');
  }
  return pythonAvailable;
}

function generateVoiceover(text, outputPath, locale) {
  const voiceList = locale === 'en' ? ENGLISH_FEMALE_VOICES : locale === 'fr' ? FRENCH_FEMALE_VOICES : ARABIC_FEMALE_VOICES;
  const cleanedText = stripMarkdown(text);
  const truncated = cleanedText.length > 2000 ? cleanedText.slice(0, 1997) + '...' : cleanedText;
  const tmpTextFile = outputPath.replace('.mp3', '_text.txt');
  writeFileSync(tmpTextFile, truncated, 'utf-8');

  // Check Python availability FIRST — skip edge-tts if not available
  if (!isPythonEdgeTTS()) {
    console.log('[TTS V5] Skipping edge-tts — Python not available, trying Groq TTS');
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqVoice = locale === 'en' ? 'Fritz-PlayAI' : locale === 'fr' ? 'Fritz-PlayAI' : 'Hiba-MSA';
        const curlResult = spawnSync('curl', [
          '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/audio/speech',
          '-H', `Authorization: Bearer ${groqKey}`,
          '-H', 'Content-Type: application/json',
          '-d', JSON.stringify({ model: 'playai-tts', input: truncated, voice: groqVoice, response_format: 'mp3', speed: 1.1 }),
          '-o', outputPath,
        ], { encoding: 'utf-8', timeout: 60000 });
        
        if (existsSync(outputPath) && statSync(outputPath).size > 1000) {
          try { unlinkSync(tmpTextFile); } catch {}
          console.log(`[TTS V5] Groq TTS: SUCCESS (voice: ${groqVoice})`);
          return true;
        }
      } catch (groqErr) {
        console.warn(`[TTS V5] Groq fallback failed: ${groqErr.message?.slice(0, 80)}`);
      }
    }
    try { unlinkSync(tmpTextFile); } catch {}
    console.error(`[TTS V5] ALL TTS methods failed (no Python, Groq unavailable)`);
    return false;
  }

  // Try edge-tts voices
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
      const result = spawnSync('python3', ['-c', pythonCode], {
        encoding: 'utf-8',
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });

      if (result.status === 0 && existsSync(outputPath)) {
        try { unlinkSync(tmpTextFile); } catch {}
        console.log(`[TTS V5] Voice: ${voice} — SUCCESS`);
        return true;
      } else {
        console.warn(`[TTS V5] Voice ${voice} failed: ${result.stderr?.slice(-200)}`);
      }
    } catch (err) {
      console.warn(`[TTS V5] Voice ${voice} error: ${err.message?.slice(0, 80)}`);
    }
  }

  // Groq fallback
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      console.log(`[TTS V5] Trying Groq TTS fallback...`);
      const groqVoice = locale === 'en' ? 'Fritz-PlayAI' : locale === 'fr' ? 'Fritz-PlayAI' : 'Hiba-MSA';
      const curlResult = spawnSync('curl', [
        '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/audio/speech',
        '-H', `Authorization: Bearer ${groqKey}`,
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({ model: 'playai-tts', input: truncated, voice: groqVoice, response_format: 'mp3', speed: 1.1 }),
        '-o', outputPath,
      ], { encoding: 'utf-8', timeout: 60000 });
      
      if (existsSync(outputPath) && readFileSync(outputPath).length > 1000) {
        try { unlinkSync(tmpTextFile); } catch {}
        console.log(`[TTS V5] Groq TTS: SUCCESS (voice: ${groqVoice})`);
        return true;
      }
    } catch (groqErr) {
      console.warn(`[TTS V5] Groq fallback failed: ${groqErr.message?.slice(0, 80)}`);
    }
  }

  try { unlinkSync(tmpTextFile); } catch {}
  console.error(`[TTS V5] ALL ${voiceList.length} voices failed for locale=${locale}`);
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIO HELPERS
// ═══════════════════════════════════════════════════════════════════

function getAudioDuration(path) {
  try {
    const result = spawnSync('ffprobe', [
      '-v', 'quiet', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', path
    ], { encoding: 'utf-8', timeout: 10000 });
    return parseFloat(result.stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

function generateBackgroundMusic(outputPath, durationSeconds, style = 'pulse') {
  const dur = Math.ceil(durationSeconds) + 5;
  console.log(`[V5] Generating ambient background music (${dur}s, style=${style})...`);

  try {
    const inputs = [];
    // Different harmonic profiles for different styles
    if (style === 'dataviz') {
      // Maqam Rast-inspired — warm, Middle Eastern
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=65.41:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=130.81:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=155.56:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=196:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=246.94:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=329.63:duration=${dur}`);
    } else {
      // Am → F → C → G (corporate/news)
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=55:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=110:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=130.81:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=164.81:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=220:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=440:duration=${dur}`);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=880:duration=${dur}`);
    }

    const numInputs = inputs.length / 3;
    const volumes = style === 'dataviz'
      ? ['0.02', '0.025', '0.018', '0.02', '0.012', '0.008']
      : ['0.025', '0.035', '0.025', '0.018', '0.012', '0.006', '0.003'];

    const volumeLabels = volumes.map((v, i) => `[${i}:a]volume=${v}[v${i}]`).join(',');
    const mixInput = volumes.map((_, i) => `[v${i}]`).join('');
    const fadeDur = style === 'dataviz' ? 12 : 10;

    const filterComplex = [
      volumeLabels,
      `${mixInput}amix=${numInputs}:duration=longest:dropout_transition=5[mixed]`,
      '[mixed]tremolo=f=0.25:d=0.35[trem]',
      '[trem]lowpass=f=500:poles=4[lp]',
      '[lp]highpass=f=35[hp]',
      '[hp]acompressor=threshold=0.06:ratio=3:attack=5:release=120[comp]',
      '[comp]afade=t=in:st=0:d=5[fin]',
      `[fin]afade=t=out:st=${dur - fadeDur}:d=${fadeDur}[final]`,
    ].join(',');

    const result = spawnSync('ffmpeg', [
      '-y',
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[final]',
      '-c:a', 'libmp3lame', '-b:a', '192k',
      '-ar', '48000', '-ac', '2',
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });

    if (result.status !== 0) {
      console.warn(`[V5] Background music generation failed: ${result.stderr?.slice(-200)}`);
      return false;
    }

    const success = existsSync(outputPath);
    if (success) {
      const size = statSync(outputPath).size;
      console.log(`[V5] Background music generated: ${(size / 1024).toFixed(0)}KB`);
    }
    return success;
  } catch (err) {
    console.warn(`[V5] Background music error: ${err.message}`);
    return false;
  }
}

function mixAudioWithMusic(narrationPath, musicPath, outputPath, musicVolume = 0.18) {
  console.log(`[V5] Mixing narration + background music...`);
  try {
    const totalDuration = getAudioDuration(narrationPath) || 120;
    const filterComplex = [
      `[1:a]volume=${musicVolume},afade=t=in:st=0:d=5,afade=t=out:st=${totalDuration - 8}:d=8[music]`,
      `[0:a][music]amix=2:duration=shortest:dropout_transition=3:normalize=0[aout]`,
    ].join(';');

    const result = spawnSync('ffmpeg', [
      '-y', '-i', narrationPath, '-i', musicPath,
      '-filter_complex', filterComplex,
      '-map', '[aout]',
      '-c:a', 'libmp3lame', '-b:a', '192k',
      '-ar', '48000', '-ac', '2',
      outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });

    if (result.status !== 0) {
      console.warn(`[V5] Primary mix failed, falling back to basic mix...`);
      const simpleFilter = `[1:a]volume=${musicVolume}[music];[0:a][music]amix=2:duration=shortest:dropout_transition=3:normalize=0[aout]`;
      const fallbackResult = spawnSync('ffmpeg', [
        '-y', '-i', narrationPath, '-i', musicPath,
        '-filter_complex', simpleFilter,
        '-map', '[aout]',
        '-c:a', 'libmp3lame', '-b:a', '192k',
        '-ar', '48000', '-ac', '2',
        outputPath,
      ], { encoding: 'utf-8', timeout: 60000 });

      if (fallbackResult.status !== 0) {
        console.warn(`[V5] Basic mix also failed`);
        return false;
      }
    }

    const success = existsSync(outputPath);
    if (success) {
      const duration = getAudioDuration(outputPath);
      console.log(`[V5] Mixed audio: ${duration.toFixed(2)}s`);
    }
    return success;
  } catch (err) {
    console.warn(`[V5] Audio mixing error: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// AI IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════

// V5 FIX: Reusable article image download — avoids re-generating images
async function downloadImageFromUrl(url) {
  try {
    console.log(`[V5] Downloading article image from: ${url.slice(0, 80)}...`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RouaVideoRenderer/1.0', 'Accept': 'image/*' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      console.warn(`[V5] Download failed: HTTP ${response.status}`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 5000) {
      console.warn(`[V5] Downloaded image too small (${buffer.length} bytes)`);
      return null;
    }
    console.log(`[V5] Article image downloaded: ${(buffer.length / 1024).toFixed(0)}KB`);
    return buffer;
  } catch (err) {
    console.warn(`[V5] Download error: ${err.message}`);
    return null;
  }
}

// Method 1: Pollinations.ai FREE default model (FAST 1-5s)
async function generateImagePollinations(prompt, width, height) {
  let cleanPrompt = prompt.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
  const shortPrompt = cleanPrompt.length > 200 ? cleanPrompt.substring(0, 197) + '...' : cleanPrompt;
  try {
    const seed = Date.now();
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
    console.log(`[V5] Pollinations (free): ${shortPrompt.length} chars...`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RouaVideoRenderer/1.0', 'Accept': 'image/*' },
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) {
      console.warn(`[V5] Pollinations HTTP ${response.status} — skipping`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 5000) return null;
    // Validate it's actually an image
    const header = buffer.slice(0, 4).toString('hex');
    const isJPEG = header.startsWith('ffd8');
    const isPNG = header.startsWith('89504');
    const isWebP = header.startsWith('5249');
    if (!isJPEG && !isPNG && !isWebP) {
      console.warn(`[V5] Pollinations: not a valid image (header: ${header})`);
      return null;
    }
    console.log(`[V5] Pollinations success: ${(buffer.length / 1024).toFixed(0)}KB`);
    return buffer;
  } catch (err) {
    console.warn(`[V5] Pollinations failed: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

// Method 2: z-ai-web-dev-sdk (reliable, high quality, but slower 25-35s)
async function generateImageSDK(prompt, width, height) {
  try {
    console.log(`[V5] SDK: generating image via z-ai-web-dev-sdk (30s timeout)...`);
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const sdkSize = '1344x768';
    // V338: Added 30s timeout — SDK could hang forever on Railway
    const response = await Promise.race([
      zai.images.generations.create({ prompt, size: sdkSize }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SDK timeout after 30s')), 30000)),
    ]);
    const base64 = response.data?.[0]?.base64;
    if (!base64) {
      console.warn(`[V5] SDK: no base64 in response`);
      return null;
    }
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length < 5000) return null;
    console.log(`[V5] SDK success: ${(buffer.length / 1024).toFixed(0)}KB`);
    return buffer;
  } catch (err) {
    console.warn(`[V5] SDK failed: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

// Method 3: z-ai-generate CLI
function generateImageCLI(prompt, outputPath, width, height) {
  const zAiCandidates = ['z-ai', '/usr/local/bin/z-ai'];
  for (const cmd of zAiCandidates) {
    try {
      const result = spawnSync(cmd, ['image', '--prompt', prompt, '--output', outputPath, '--size', `${width}x${height}`], {
        encoding: 'utf-8', timeout: 120000,
      });
      if (result.status === 0 && existsSync(outputPath)) {
        const buf = readFileSync(outputPath);
        if (buf.length > 5000) {
          try { unlinkSync(outputPath); } catch {}
          console.log(`[V5] CLI (z-ai image): success (${(buf.length / 1024).toFixed(0)}KB)`);
          return buf;
        }
      }
    } catch {}
  }
  const legacyCandidates = [
    'z-ai-generate', '/usr/local/bin/z-ai-generate',
    '/app/node_modules/.bin/z-ai-generate',
    join(process.cwd(), 'node_modules', '.bin', 'z-ai-generate'),
  ];
  for (const cmd of legacyCandidates) {
    try {
      const result = spawnSync(cmd, ['--prompt', prompt, '--output', outputPath, '--size', `${width}x${height}`], {
        encoding: 'utf-8', timeout: 120000,
      });
      if (result.status === 0 && existsSync(outputPath)) {
        const buf = readFileSync(outputPath);
        if (buf.length > 5000) {
          try { unlinkSync(outputPath); } catch {}
          console.log(`[V5] CLI (z-ai-generate): success (${(buf.length / 1024).toFixed(0)}KB)`);
          return buf;
        }
      }
    } catch {}
  }
  return null;
}

// Professional gradient SVG fallback
function generateGradientFallback(width, height, marketImpact, style = 'pulse') {
  if (style === 'dataviz') {
    // Al Jazeera warm gold tones
    const accentColor = ['bullish','positive'].includes(marketImpact) ? '#4CAF50' : ['bearish','negative'].includes(marketImpact) ? '#CC2936' : '#DBA200';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#060E1E"/>
          <stop offset="50%" stop-color="#0A1628"/>
          <stop offset="100%" stop-color="#0C1830"/>
        </linearGradient>
        <radialGradient id="g1" cx="65%" cy="30%" r="55%">
          <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#0A1628" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg1)"/>
      <rect width="100%" height="100%" fill="url(#g1)"/>
      <rect x="${width*0.82}" y="${height*0.12}" width="105" height="105" fill="none" stroke="#DBA200" stroke-width="1.5" opacity="0.15" rx="4"/>
      <polygon points="${width*0.6},0 ${width},0 ${width},${height*0.3}" fill="#DBA200" opacity="0.06"/>
      <polygon points="0,${height*0.6} ${width*0.4},${height} 0,${height}" fill="${accentColor}" opacity="0.05"/>
    </svg>`;
    return Buffer.from(svg);
  }

  // Bloomberg/Pulse style
  const color = marketImpact === 'bullish' ? '#0a3d0a' : marketImpact === 'bearish' ? '#3d0a0a' : '#0a1a3d';
  const accentColor = marketImpact === 'bullish' ? '#22c55e' : marketImpact === 'bearish' ? '#ef4444' : '#3b82f6';
  const accentColor2 = marketImpact === 'bullish' ? '#15803d' : marketImpact === 'bearish' ? '#dc2626' : '#2563eb';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="g1" cx="30%" cy="40%" r="70%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.2"/>
        <stop offset="50%" stop-color="${color}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#050810" stop-opacity="1"/>
      </radialGradient>
      <radialGradient id="g2" cx="70%" cy="60%" r="60%">
        <stop offset="0%" stop-color="${accentColor2}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#050810" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="#050810"/>
    <rect width="100%" height="100%" fill="url(#g1)"/>
    <rect width="100%" height="100%" fill="url(#g2)"/>
    <g opacity="0.04" stroke="${accentColor}" stroke-width="0.5">
      ${Array.from({length: 20}, (_, i) => `<line x1="0" y1="${i * (height/20)}" x2="${width}" y2="${i * (height/20)}"/>`).join('\n      ')}
      ${Array.from({length: 25}, (_, i) => `<line x1="${i * (width/25)}" y1="0" x2="${i * (width/25)}" y2="${height}"/>`).join('\n      ')}
    </g>
  </svg>`;
  return Buffer.from(svg);
}

// Main AI image generation function
async function generateAIImage(prompt, width = 1344, height = 768, marketImpact = 'neutral', style = 'pulse') {
  // Priority: Pollinations (fast 1-5s) → SDK (reliable 25-35s) → CLI → Gradient fallback
  let buffer = await generateImagePollinations(prompt, width, height);
  if (buffer) return buffer;

  buffer = await generateImageSDK(prompt, width, height);
  if (buffer) return buffer;

  const tmpPath = join(tmpdir(), `roua-bg-${randomUUID()}.png`);
  buffer = generateImageCLI(prompt, tmpPath, width, height);
  if (buffer) return buffer;

  console.warn(`[V5] All AI image generation methods failed! Using gradient fallback.`);
  return generateGradientFallback(width, height, marketImpact, style);
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export {
  // Utilities
  escapeHTML,
  stripMarkdown,
  formatNumber,
  lerp,
  clamp,
  easeOutCubic,
  easeInOutCubic,
  hexToRgba,
  AR_NUMERALS,
  toArabicNumeral,
  parseArgs,
  getImpactColor,
  getImpactLabel,
  getImpactArrow,
  // TTS
  isPythonEdgeTTS,
  generateVoiceover,
  ARABIC_FEMALE_VOICES,
  ENGLISH_FEMALE_VOICES,
  FRENCH_FEMALE_VOICES,
  // Audio
  getAudioDuration,
  generateBackgroundMusic,
  mixAudioWithMusic,
  // Images
  downloadImageFromUrl,
  generateImagePollinations,
  generateImageSDK,
  generateImageCLI,
  generateGradientFallback,
  generateAIImage,
  // Low-level
  execFileAsync,
  spawnSync,
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  join,
  tmpdir,
  randomUUID,
};
