#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// رؤى V2 Video Renderer — Professional Financial Video
// Design based on broadcast standards (title safe, lower thirds, typography)
//
// Architecture:
// - Each scene: full-screen AI image + lower-third text panel
// - Ken Burns: smooth per-frame zoom (100%→108%)
// - TTS: edge-tts with per-locale voice
// - Transitions: fade between scenes
// - Text: separate narration (audio) vs display (on-screen)
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
const FPS = 24;

// ═══ TTS Voices per locale ═══
const TTS_VOICES = {
  ar: 'ar-AE-FatimaNeural',
  en: 'en-US-JennyNeural',
  fr: 'fr-FR-HenriNeural',
  tr: 'tr-TR-EmelNeural',
  es: 'es-ES-ElviraNeural',
};

// ═══ Helpers ═══
function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function stripMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function generateTTS(text, outputPath, locale) {
  const voice = TTS_VOICES[locale] || TTS_VOICES.ar;
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

// ═══ CSS — Broadcast-grade design ═══
// Based on research:
// - Title safe area: 90% (5% margin all sides)
// - Lower third: bottom 30% of screen
// - Font sizes: title 64px, body 32px, data 80px (for 1080p)
// - One accent color: gold #D4AF37
// - Image overlay: gradient from bottom only (not full screen)
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  overflow: hidden;
  background: #000;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}

/* Full-screen background image with Ken Burns */
.scene-bg {
  position: absolute;
  inset: 0;
  background-size: 100% 100%;
  background-position: center;
  transition: background-size 0.04s linear, background-position 0.04s linear;
}

/* Gradient overlay — bottom 60% only, leaves top 40% clean */
.scene-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0.1) 0%,
    rgba(0,0,0,0.1) 30%,
    rgba(0,0,0,0.5) 60%,
    rgba(0,0,0,0.85) 100%
  );
}

/* Top bar — minimal brand */
.top-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  z-index: 20;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  color: #D4AF37;
  letter-spacing: 2px;
}

.scene-counter {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

/* Lower third — text panel at bottom 35% */
.lower-third {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px 80px 60px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Scene title — large, bold, white */
.scene-title {
  font-size: 48px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.3;
  text-shadow: 0 2px 20px rgba(0,0,0,0.8);
  max-width: 1400px;
  animation: fadeUp 0.6s ease 0.2s both;
}

/* Display text — large data/numbers in gold */
.display-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 56px;
  font-weight: 700;
  color: #D4AF37;
  line-height: 1.2;
  text-shadow: 0 2px 15px rgba(0,0,0,0.8);
  animation: fadeUp 0.6s ease 0.5s both;
}

/* Display text — smaller variant for long text */
.display-text-small {
  font-size: 32px;
  font-weight: 500;
  color: #D4AF37;
  line-height: 1.5;
  text-shadow: 0 2px 12px rgba(0,0,0,0.8);
  max-width: 1200px;
  animation: fadeUp 0.6s ease 0.5s both;
}

/* Narration bullets — short points below title */
.narration-bullets {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.bullet {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 22px;
  color: rgba(255,255,255,0.75);
  line-height: 1.5;
  text-shadow: 0 1px 8px rgba(0,0,0,0.8);
}

.bullet-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D4AF37;
  flex-shrink: 0;
  margin-top: 10px;
}

/* Outro */
.outro {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 15;
  text-align: center;
}

.outro-logo {
  font-size: 64px;
  font-weight: 300;
  color: #FFFFFF;
  letter-spacing: -2px;
  margin-bottom: 12px;
  animation: fadeIn 1s ease both;
}

.outro-logo em {
  font-style: normal;
  color: #D4AF37;
  font-weight: 600;
}

.outro-text {
  font-size: 24px;
  color: rgba(255,255,255,0.5);
  max-width: 700px;
  line-height: 1.6;
  animation: fadeIn 1s ease 0.4s both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

// ═══ Scene HTML Generator ═══
function generateSceneHTML(scene, sceneIndex, totalScenes, data) {
  const isOutro = sceneIndex === -1;
  const locale = data.locale || 'ar';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const lang = locale;

  // Outro scene
  if (isOutro) {
    return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="outro">
  <div class="outro-logo">رؤى <em>Rouaa</em></div>
  ${data.outroText ? `<div class="outro-text">${escapeHTML(stripMarkdown(data.outroText))}</div>` : ''}
</div>
</body></html>`;
  }

  // Regular scene
  const bgStyle = scene.imageBase64
    ? `background-image:url('data:image/png;base64,${scene.imageBase64}')`
    : '';

  // Display text: large if short, small if long
  const displayTextHTML = scene.displayText
    ? (scene.displayText.length > 40
      ? `<div class="display-text-small">${escapeHTML(stripMarkdown(scene.displayText))}</div>`
      : `<div class="display-text">${escapeHTML(stripMarkdown(scene.displayText))}</div>`)
    : '';

  return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${bgStyle}"></div>
<div class="scene-overlay"></div>

<div class="top-bar">
  <div class="brand">رؤى</div>
  <div class="scene-counter">${sceneIndex + 1} / ${totalScenes}</div>
</div>

<div class="lower-third">
  <div class="scene-title">${escapeHTML(stripMarkdown(scene.title))}</div>
  ${displayTextHTML}
</div>
</body></html>`;
}

// ═══ Main Pipeline ═══
async function main() {
  const startTime = Date.now();
  console.log('[V2-Renderer] Starting...');

  const args = process.argv.slice(2);
  let inputPath = '', outputPath = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i+1]) inputPath = args[++i];
    if (args[i] === '--output' && args[i+1]) outputPath = args[++i];
  }
  if (!inputPath || !outputPath) {
    console.error('Usage: node video-renderer-v2.mjs --input data.json --output video.mp4');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
  const locale = data.locale || 'ar';
  const scenes = data.scenes || [];
  const hasOutro = !!data.outroText;
  const totalScenes = scenes.length;
  const totalRenderScenes = hasOutro ? totalScenes + 1 : totalScenes;

  console.log(`[V2-Renderer] Title: ${data.title}`);
  console.log(`[V2-Renderer] Locale: ${locale}, Scenes: ${totalScenes}, Outro: ${hasOutro}`);

  const tmpDir = join(tmpdir(), `v2-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  // ═══ Step 1: Generate images IN PARALLEL (concurrency=3) ═══
  console.log('[V2-Renderer] Step 1: Generate images (parallel, concurrency=3)...');
  const imageTasks = scenes.map((scene, i) => async () => {
    if (!scene.imagePrompt) { scene.imageBase64 = null; return; }
    console.log(`  [${i+1}/${totalScenes}] Starting: "${scene.imagePrompt.slice(0, 60)}..."`);
    const buffer = await generateImage(scene.imagePrompt);
    scene.imageBase64 = buffer ? buffer.toString('base64') : null;
    console.log(`  [${i+1}/${totalScenes}] ${buffer ? '✓' : '✗'}`);
  });

  // Run with concurrency=3 (like image-gen.ts does for infographics)
  const concurrency = 3;
  let taskIndex = 0;
  async function runWorker() {
    while (taskIndex < imageTasks.length) {
      const idx = taskIndex++;
      await imageTasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, imageTasks.length) }, () => runWorker()));
  console.log('[V2-Renderer] All images done.');

  // ═══ Step 2: Generate TTS ═══
  // STRICT RULE: narration reads ONLY title + scene.title + narrationText + outroText
  // NEVER reads: imagePrompt, displayText
  console.log('[V2-Renderer] Step 2: Generate TTS...');
  const audioPaths = [];
  const audioDurations = [];

  for (let i = 0; i < totalScenes; i++) {
    const scene = scenes[i];
    // Narration = scene title + narration text
    const narrationText = `${scene.title}. ${scene.narrationText}`;
    const audioPath = join(tmpDir, `scene_${i}.mp3`);
    const success = generateTTS(narrationText, audioPath, locale);
    if (success) {
      audioDurations.push(getAudioDuration(audioPath));
      audioPaths.push(audioPath);
      console.log(`  [${i+1}/${totalScenes}] ✓ ${audioDurations[i].toFixed(1)}s`);
    } else {
      // Fallback: use scene duration
      audioDurations.push(scene.duration || 6);
      audioPaths.push(null);
      console.log(`  [${i+1}/${totalScenes}] ✗ TTS failed, using ${scene.duration || 6}s`);
    }
  }

  // Outro TTS
  if (hasOutro) {
    const outroAudioPath = join(tmpDir, `outro.mp3`);
    const success = generateTTS(data.outroText, outroAudioPath, locale);
    if (success) {
      audioDurations.push(getAudioDuration(outroAudioPath));
      audioPaths.push(outroAudioPath);
      console.log(`  [outro] ✓ ${audioDurations[totalScenes].toFixed(1)}s`);
    } else {
      audioDurations.push(5);
      audioPaths.push(null);
    }
  }

  // ═══ Step 3: Concatenate audio ═══
  console.log('[V2-Renderer] Step 3: Audio concat...');
  const fullAudioPath = join(tmpDir, 'full.mp3');
  const validAudio = audioPaths.filter(p => p);
  if (validAudio.length > 0) {
    const listFile = join(tmpDir, 'list.txt');
    writeFileSync(listFile, validAudio.map(p => `file '${p}'`).join('\n'));
    spawnSync('ffmpeg', ['-y','-f','concat','-safe','0','-i',listFile,'-c:a','libmp3lame','-b:a','192k',fullAudioPath], { encoding: 'utf-8', timeout: 60000 });
    // Loudnorm
    const procPath = fullAudioPath.replace('.mp3', '_proc.mp3');
    spawnSync('ffmpeg', ['-y','-i',fullAudioPath,'-af','silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-40dB,loudnorm=I=-16:LRA=11:TP=-1.5','-c:a','libmp3lame','-b:a','192k',procPath], { encoding: 'utf-8', timeout: 120000 });
    if (existsSync(procPath)) { try { unlinkSync(fullAudioPath); } catch {} renameSync(procPath, fullAudioPath); }
  }

  // ═══ Step 4: Render frames ═══
  console.log('[V2-Renderer] Step 4: Render frames...');
  const framesDir = join(tmpDir, 'frames');
  mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  let frameCount = 0;

  for (let s = 0; s < totalRenderScenes; s++) {
    const isOutro = s === totalScenes;
    const scene = isOutro ? {} : scenes[s];
    const dur = isOutro ? Math.max(5, audioDurations[s] || 5) : Math.max(scene.duration || 6, audioDurations[s] || 6);
    const totalFrames = Math.ceil(dur * FPS);
    const sceneStartMs = Date.now();
    console.log(`  [Scene ${s+1}/${totalRenderScenes}] ${isOutro ? 'OUTRO' : scene.title} — ${dur.toFixed(1)}s (${totalFrames} frames)`);

    const html = isOutro
      ? generateSceneHTML(null, -1, totalScenes, data)
      : generateSceneHTML(scene, s, totalScenes, data);

    try { await page.setContent(html, { waitUntil: 'domcontentloaded' }); } catch (e) {
      console.error(`  [Scene ${s+1}] setContent failed: ${e.message}`);
      continue;
    }
    await page.waitForTimeout(300);

    // Set initial background-size for Ken Burns
    try {
      await page.evaluate(() => {
        const bg = document.getElementById('bg');
        if (bg) { bg.style.backgroundSize = '100% 100%'; bg.style.backgroundPosition = '50% 50%'; }
      });
    } catch {}

    for (let f = 0; f < totalFrames; f++) {
      // Ken Burns: smooth zoom 100% → 108%
      const kbProgress = (f + 1) / totalFrames;
      const kbSize = 100 + 8 * kbProgress;
      const kbPosX = 50 - 3 * kbProgress;
      const kbPosY = 50 - 2 * kbProgress;
      try {
        await page.evaluate(({ sz, px, py }) => {
          const bg = document.getElementById('bg');
          if (bg) { bg.style.backgroundSize = sz + '%'; bg.style.backgroundPosition = px + '% ' + py + '%'; }
        }, { sz: kbSize, px: kbPosX, py: kbPosY });
      } catch (e) {
        if (f === 0) console.warn(`  [Scene ${s+1}] Ken Burns failed: ${e.message?.slice(0, 80)}`);
      }
      try {
        await page.screenshot({ path: join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
      } catch (e) { console.warn(`  Frame ${f} failed: ${e.message?.slice(0, 60)}`); }
      frameCount++;
    }

    // Fade transition (8 frames = 0.33s)
    if (s < totalRenderScenes - 1) {
      const transition = isOutro ? 'fade' : (scene.transition || 'fade');
      if (transition === 'fade') {
        for (let tf = 0; tf < 8; tf++) {
          await page.evaluate(op => { document.body.style.opacity = String(1 - op); }, (tf + 1) / 8);
          await page.screenshot({ path: join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
          frameCount++;
        }
        await page.evaluate(() => { document.body.style.opacity = '1'; });
      }
    }

    const sceneElapsed = ((Date.now() - sceneStartMs) / 1000).toFixed(1);
    console.log(`  [Scene ${s+1}] DONE in ${sceneElapsed}s`);
  }
  await browser.close();
  console.log(`[V2-Renderer] Total frames: ${frameCount}`);

  // ═══ Step 5: FFmpeg encode ═══
  console.log('[V2-Renderer] Step 5: FFmpeg encode...');
  const videoOnlyPath = join(tmpDir, 'video.mp4');
  spawnSync('ffmpeg', ['-y','-framerate',String(FPS),'-i',join(framesDir,'frame_%05d.jpg'),'-vf','format=yuv420p','-pix_fmt','yuv420p','-c:v','libx264','-preset','fast','-crf','16','-maxrate','6M','-g','48','-keyint_min','48','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',videoOnlyPath], { encoding: 'utf-8', timeout: 300000 });

  // ═══ Step 6: Merge audio + video ═══
  console.log('[V2-Renderer] Step 6: Merge...');
  if (existsSync(fullAudioPath)) {
    spawnSync('ffmpeg', ['-y','-i',videoOnlyPath,'-i',fullAudioPath,'-c:v','copy','-c:a','aac','-b:a','192k','-ac','2','-shortest','-movflags','+faststart',outputPath], { encoding: 'utf-8', timeout: 120000 });
  } else {
    renameSync(videoOnlyPath, outputPath);
  }

  // ═══ Step 7: Cleanup ═══
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeMB = (statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`[V2-Renderer] ✅ Done — ${elapsed}s | ${sizeMB}MB`);
  console.log(`[V2-Renderer] Output: ${outputPath}`);
}

main().catch(err => { console.error('[V2-Renderer] FATAL:', err.message); process.exit(1); });
