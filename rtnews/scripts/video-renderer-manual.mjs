#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Manual Video Renderer — user-defined scenes
// Each scene has: imagePrompt (→ AI image), narrationText (→ TTS),
// displayText (→ on-screen overlay), duration, transition
// Narration reads ONLY: title + scene titles + narrationText + outroText
// Narration NEVER reads: imagePrompt + displayText
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

const C = {
  bg: '#0B0E14',
  card: '#151A22',
  border: '#D4AF37',
  borderDim: 'rgba(212,175,55,0.3)',
  green: '#10B981',
  red: '#EF4444',
  gold: '#D4AF37',
  white: '#FFFFFF',
  bright: '#F8F9FA',
  dim: 'rgba(255,255,255,0.65)',
};

const TTS_VOICES = {
  ar: 'ar-AE-FatimaNeural',
  en: 'en-US-JennyNeural',
  fr: 'fr-FR-HenriNeural',
  tr: 'tr-TR-EmelNeural',
  es: 'es-ES-ElviraNeural',
};

function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ═══ AI Image Generation ═══

// ═══ TTS ═══
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

// ═══ CSS ═══
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:${C.bg};font-family:'IBM Plex Sans Arabic',sans-serif;color:${C.bright}}
.scene-bg{position:absolute;inset:0;background-position:center;transition:background-size 0.04s linear,background-position 0.04s linear}
.overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,14,20,0.4) 0%,transparent 30%,transparent 50%,rgba(11,14,20,0.7) 100%)}
.hdr{position:absolute;top:0;left:0;right:0;height:60px;background:rgba(11,14,20,0.92);border-bottom:2px solid ${C.borderDim};display:flex;align-items:center;justify-content:space-between;padding:0 40px;z-index:30;backdrop-filter:blur(10px)}
.hdr-logo{font-size:22px;font-weight:700;color:${C.gold};letter-spacing:2px}
.hdr-title{font-size:16px;color:${C.dim};font-weight:400;max-width:800px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ftr{position:absolute;bottom:0;left:0;right:0;height:40px;background:rgba(11,14,20,0.92);border-top:1px solid ${C.borderDim};display:flex;align-items:center;justify-content:center;z-index:30}
.ftr-text{font-size:13px;color:${C.dim};font-family:'JetBrains Mono',monospace}
.content{position:absolute;top:60px;bottom:40px;left:0;right:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 80px;z-index:10}
.scene-title-text{font-size:64px;font-weight:700;color:${C.bright};text-align:center;margin-bottom:30px;text-shadow:0 4px 30px rgba(0,0,0,0.9);animation:fadeUp .8s ease .2s both}
.display-text{font-family:'JetBrains Mono',monospace;font-size:80px;font-weight:700;color:${C.gold};text-align:center;text-shadow:0 0 40px rgba(212,175,55,0.5);animation:fadeUp .8s ease .5s both}
.display-text-small{font-size:40px;font-weight:500;color:${C.bright};text-align:center;line-height:1.5;text-shadow:0 2px 12px rgba(0,0,0,0.9);animation:fadeUp .8s ease .5s both;max-width:1200px}
.outro-content{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center}
.outro-logo{font-size:72px;font-weight:300;color:${C.bright};letter-spacing:-3px;margin-bottom:16px}
.outro-logo em{font-style:normal;color:${C.gold}}
.outro-text{font-size:28px;color:${C.dim};margin-top:30px;max-width:800px;line-height:1.6}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
`;

// ═══ Scene HTML Generator ═══
function sceneHTML(scene, sceneIndex, totalScenes, data) {
  const isOutro = sceneIndex === -1;
  const locale = data.locale || 'ar';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const lang = locale;

  if (isOutro) {
    return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="hdr"><div class="hdr-logo">رؤى</div><div class="hdr-title">${escapeHTML(data.title)}</div></div>
<div class="content">
  <div class="outro-content">
    <div class="outro-logo">رؤى <em>OBSERVATORY</em></div>
    ${data.outroText ? `<div class="outro-text">${escapeHTML(data.outroText)}</div>` : ''}
  </div>
</div>
<div class="ftr"><div class="ftr-text">SCENE ${totalScenes + 1}/${totalScenes + 1} · OUTRO</div></div>
</body></html>`;
  }

  // Regular scene
  const bgStyle = scene.imageBase64
    ? `background-image:url('data:image/png;base64,${scene.imageBase64}');background-position:center`
    : '';

  return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="UTF-8"><style>${CSS}</style></head><body>
<div class="scene-bg" id="bg" style="${bgStyle}"></div>
<div class="overlay"></div>
<div class="hdr"><div class="hdr-logo">رؤى</div><div class="hdr-title">${escapeHTML(data.title)}</div></div>
<div class="content">
  <div class="scene-title-text">${escapeHTML(scene.title)}</div>
  ${scene.displayText
    ? (scene.displayText.length > 30
      ? `<div class="display-text-small">${escapeHTML(scene.displayText)}</div>`
      : `<div class="display-text">${escapeHTML(scene.displayText)}</div>`)
    : ''}
</div>
<div class="ftr"><div class="ftr-text">SCENE ${sceneIndex + 1}/${totalScenes} · ${escapeHTML(scene.title)}</div></div>
</body></html>`;
}

// ═══ Main Pipeline ═══
async function main() {
  const startTime = Date.now();
  console.log('[ManualVideo] Starting...');

  const args = process.argv.slice(2);
  let inputPath = '', outputPath = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i+1]) inputPath = args[++i];
    if (args[i] === '--output' && args[i+1]) outputPath = args[++i];
  }
  if (!inputPath || !outputPath) {
    console.error('Usage: node video-renderer-manual.mjs --input data.json --output video.mp4');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
  const locale = data.locale || 'ar';
  const scenes = data.scenes || [];
  const totalScenes = scenes.length;

  console.log(`[ManualVideo] Title: ${data.title}`);
  console.log(`[ManualVideo] Locale: ${locale}`);
  console.log(`[ManualVideo] Scenes: ${totalScenes}`);

  const tmpDir = join(tmpdir(), `manual-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  // ═══ Step 1: Generate images for each scene ═══
  console.log('[ManualVideo] Step 1: Generate scene images...');
  for (let i = 0; i < totalScenes; i++) {
    const scene = scenes[i];
    if (scene.imagePrompt) {
      console.log(`  [${i+1}/${totalScenes}] Generating image: "${scene.imagePrompt.slice(0, 60)}..."`);
      const buffer = await generateImage(scene.imagePrompt, 1344, 768);
      scene.imageBase64 = buffer ? buffer.toString('base64') : null;
      console.log(`  [${i+1}/${totalScenes}] ${buffer ? '✓' : '✗'}`);
    } else {
      scene.imageBase64 = null;
    }
  }

  // ═══ Step 2: Generate TTS for each scene ═══
  // Narration reads ONLY: title + scene title + narrationText + outroText
  console.log('[ManualVideo] Step 2: Generate TTS...');
  const audioPaths = [];
  const audioDurations = [];

  for (let i = 0; i < totalScenes; i++) {
    const scene = scenes[i];
    // Narration = scene title + narration text (NOT displayText, NOT imagePrompt)
    const narrationText = `${scene.title}. ${scene.narrationText}`;
    const audioPath = join(tmpDir, `scene_${i}.mp3`);
    const success = generateTTS(narrationText, audioPath, locale);
    if (success) {
      audioDurations.push(getAudioDuration(audioPath));
      audioPaths.push(audioPath);
      console.log(`  [${i+1}/${totalScenes}] ✓ ${audioDurations[i].toFixed(1)}s`);
    } else {
      audioDurations.push(scene.duration || 5);
      audioPaths.push(null);
      console.log(`  [${i+1}/${totalScenes}] ✗ TTS failed, using ${scene.duration}s`);
    }
  }

  // Outro TTS
  if (data.outroText) {
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
  console.log('[ManualVideo] Step 3: Audio concat...');
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

  // ═══ Step 4: Render frames ═══
  console.log('[ManualVideo] Step 4: Render frames...');
  const framesDir = join(tmpDir, 'frames');
  mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  let frameCount = 0;
  const hasOutro = !!data.outroText;
  const totalRenderScenes = hasOutro ? totalScenes + 1 : totalScenes;

  for (let s = 0; s < totalRenderScenes; s++) {
    const isOutro = s === totalScenes;
    const scene = isOutro ? { title: 'Outro', imageBase64: null, displayText: '' } : scenes[s];
    const dur = Math.max(scene.duration || 5, isOutro ? 5 : audioDurations[s] || 5);
    const totalFrames = Math.ceil(dur * FPS);
    const sceneStartMs = Date.now();
    console.log(`  [Scene ${s+1}/${totalRenderScenes}] ${isOutro ? 'OUTRO' : scene.title} — ${dur.toFixed(1)}s (${totalFrames} frames)`);

    const html = isOutro
      ? sceneHTML(null, -1, totalScenes, data)
      : sceneHTML(scene, s, totalScenes, data);

    try { await page.setContent(html, { waitUntil: 'domcontentloaded' }); } catch (e) {
      console.error(`  [Scene ${s+1}] setContent failed: ${e.message}`);
      continue;
    }
    await page.waitForTimeout(200);

    // Set initial background-size for Ken Burns
    try {
      await page.evaluate(() => {
        const bg = document.getElementById('bg');
        if (bg) { bg.style.backgroundSize = '100% 100%'; bg.style.backgroundPosition = '50% 50%'; }
      });
    } catch {}

    for (let f = 0; f < totalFrames; f++) {
      // Ken Burns
      const kbProgress = (f + 1) / totalFrames;
      const kbSize = 100 + 6 * kbProgress;
      const kbPosX = 50 - 3 * kbProgress;
      const kbPosY = 50 - 2 * kbProgress;
      try {
        await page.evaluate(({ sz, px, py }) => {
          const bg = document.getElementById('bg');
          if (bg) { bg.style.backgroundSize = sz + '%'; bg.style.backgroundPosition = px + '% ' + py + '%'; }
        }, { sz: kbSize, px: kbPosX, py: kbPosY });
      } catch {}
      try {
        await page.screenshot({ path: join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
      } catch (e) { console.warn(`  Frame ${f} failed: ${e.message?.slice(0,60)}`); }
      frameCount++;
    }

    // Transition: fade out (last 4 frames)
    if (s < totalRenderScenes - 1) {
      const transition = isOutro ? 'fade' : (scenes[s].transition || 'fade');
      if (transition === 'fade') {
        for (let tf = 0; tf < 6; tf++) {
          await page.evaluate(op => { document.body.style.opacity = String(1 - op); }, (tf + 1) / 6);
          await page.screenshot({ path: join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
          frameCount++;
        }
        await page.evaluate(() => { document.body.style.opacity = '1'; });
      }
      // cut = no extra frames, just proceed to next scene
    }

    const sceneElapsed = ((Date.now() - sceneStartMs) / 1000).toFixed(1);
    console.log(`  [Scene ${s+1}] DONE in ${sceneElapsed}s`);
  }
  await browser.close();
  console.log(`[ManualVideo] Total frames: ${frameCount}`);

  // ═══ Step 5: FFmpeg encode ═══
  console.log('[ManualVideo] Step 5: FFmpeg encode...');
  const videoOnlyPath = join(tmpDir, 'video.mp4');
  spawnSync('ffmpeg', ['-y','-framerate',String(FPS),'-i',join(framesDir,'frame_%05d.jpg'),'-vf','format=yuv420p','-pix_fmt','yuv420p','-c:v','libx264','-preset','fast','-crf','18','-maxrate','5M','-g','48','-keyint_min','48','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',videoOnlyPath], { encoding: 'utf-8', timeout: 300000 });

  // ═══ Step 6: Merge audio + video ═══
  console.log('[ManualVideo] Step 6: Merge...');
  const musicFilter = data.music === 'neutral' ? ',aresample=async=1'
    : data.music === 'tense' ? ',aresample=async=1'
    : data.music === 'rising' ? ',aresample=async=1'
    : '';

  if (existsSync(fullAudioPath)) {
    spawnSync('ffmpeg', ['-y','-i',videoOnlyPath,'-i',fullAudioPath,'-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',outputPath], { encoding: 'utf-8', timeout: 120000 });
  } else {
    renameSync(videoOnlyPath, outputPath);
  }

  // ═══ Step 7: Cleanup ═══
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeMB = (statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`[ManualVideo] ✅ Done — ${elapsed}s | ${sizeMB}MB`);
  console.log(`[ManualVideo] Output: ${outputPath}`);
}

main().catch(err => { console.error('[ManualVideo] FATAL:', err.message); process.exit(1); });
