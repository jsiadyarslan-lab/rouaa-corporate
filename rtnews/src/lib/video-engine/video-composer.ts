// ═══════════════════════════════════════════════════════════════
// ⚠️  DEPRECATED — THIS FILE IS NOT USED IN PRODUCTION
// ═══════════════════════════════════════════════════════════════
// Replaced by Playwright-based renderers in scripts/video-renderer*.mjs
// No code imports this module. Kept for reference only.
// ═══════════════════════════════════════════════════════════════

// ─── Professional Video Composer using FFmpeg (DEPRECATED) ────
// Assembles chart frames, title cards, text overlays, and audio
// into a polished stock analysis video (Bloomberg quality)
// Uses FFmpeg directly (no MoviePy, no Chromium, no browser)

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// ─── Types ──────────────────────────────────────────────────

export interface VideoSegment {
  type: 'title' | 'chart' | 'indicator' | 'outro';
  imageBuffer: Buffer;
  duration: number; // seconds
  narrationText?: string;
  audioBuffer?: Buffer;
}

export interface VideoComposeOptions {
  width: number;
  height: number;
  fps: number;
  outputFormat: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high';
  /** Background music buffer (optional) */
  bgMusicBuffer?: Buffer;
  /** Volume of narration (0-1) */
  narrationVolume?: number;
  /** Volume of background music (0-1) */
  bgMusicVolume?: number;
}

export interface VideoComposeResult {
  buffer: Buffer;
  duration: number;
  format: string;
  sizeBytes: number;
}

// ─── Default Options ────────────────────────────────────────

const DEFAULT_OPTIONS: VideoComposeOptions = {
  width: 1920,
  height: 1080,
  fps: 24,
  outputFormat: 'mp4',
  quality: 'high',
  narrationVolume: 1.0,
  bgMusicVolume: 0.15,
};

// ─── FFmpeg Helper ──────────────────────────────────────────

function runFFmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpeg = execFile('ffmpeg', args, {
      timeout: 120_000, // 2 min max per FFmpeg call
      maxBuffer: 50 * 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`FFmpeg error: ${err.message}\n${stderr?.slice(-500)}`));
      } else {
        resolve(stderr); // FFmpeg outputs to stderr
      }
    });
  });
}

// ─── Generate Silent Audio ──────────────────────────────────

async function generateSilentAudio(durationSec: number, outputPath: string): Promise<void> {
  await runFFmpeg([
    '-f', 'lavfi',
    '-i', `anullsrc=r=44100:cl=mono`,
    '-t', durationSec.toFixed(2),
    '-c:a', 'libmp3lame',
    '-q:a', '9',
    '-y',
    outputPath,
  ]);
}

// ─── Main Video Composition ────────────────────────────────

export async function composeVideo(
  segments: VideoSegment[],
  options: Partial<VideoComposeOptions> = {}
): Promise<VideoComposeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tmpDir = path.join(os.tmpdir(), `roua-video-${Date.now()}`);

  try {
    await fs.mkdir(tmpDir, { recursive: true });

    // ─── Step 1: Write segment images ───
    const segmentDirs: string[] = [];
    const audioFiles: string[] = [];
    let totalDuration = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segDir = path.join(tmpDir, `seg${i}`);
      await fs.mkdir(segDir, { recursive: true });

      // Write the image as a single frame
      const imgPath = path.join(segDir, 'frame.png');
      await fs.writeFile(imgPath, seg.imageBuffer);

      segmentDirs.push(segDir);
      totalDuration += seg.duration;

      // Write audio if provided
      if (seg.audioBuffer) {
        const audioPath = path.join(segDir, 'narration.mp3');
        await fs.writeFile(audioPath, seg.audioBuffer);
        audioFiles.push(audioPath);
      } else {
        // Generate silent audio for this segment
        const audioPath = path.join(segDir, 'narration.mp3');
        await generateSilentAudio(seg.duration, audioPath);
        audioFiles.push(audioPath);
      }
    }

    // ─── Step 2: Create individual segment videos (image + audio) ───
    const segmentVideos: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segDir = segmentDirs[i];
      const imgPath = path.join(segDir, 'frame.png');
      const audioPath = path.join(segDir, 'narration.mp3');
      const outputPath = path.join(tmpDir, `segment${i}.mp4`);

      const crf = opts.quality === 'high' ? '18' : opts.quality === 'medium' ? '23' : '28';

      // Create video from still image + audio
      await runFFmpeg([
        '-loop', '1',
        '-i', imgPath,
        '-i', audioPath,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-t', seg.duration.toFixed(2),
        '-r', opts.fps.toString(),
        '-crf', crf,
        '-preset', 'fast',
        '-shortest',
        '-y',
        outputPath,
      ]);

      segmentVideos.push(outputPath);
    }

    // ─── Step 3: Create concat list and merge ───
    const concatListPath = path.join(tmpDir, 'concat.txt');
    const concatContent = segmentVideos.map(v => `file '${v}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);

    const mergedPath = path.join(tmpDir, 'merged.mp4');
    await runFFmpeg([
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      '-y',
      mergedPath,
    ]);

    // ─── Step 4: Add text overlay (brand watermark) ───
    const finalPath = path.join(tmpDir, 'final.mp4');

    // Add subtle brand watermark using properly escaped drawtext
    try {
      await runFFmpeg([
        '-i', mergedPath,
        '-vf', `drawtext=text='ROUA':fontcolor=0x4DD4AF37:fontsize=14:x=W-tw-20:y=H-25`,
        '-c:a', 'copy',
        '-y',
        finalPath,
      ]);
    } catch {
      // Fallback: if drawtext fails (e.g., no font), just copy the merged video
      await fs.copyFile(mergedPath, finalPath);
    }

    // ─── Step 5: Read final video buffer ───
    const videoBuffer = await fs.readFile(finalPath);

    console.log(`[VideoComposer] Video composed: ${segments.length} segments, ${(totalDuration).toFixed(1)}s, ${(videoBuffer.length / 1024).toFixed(0)}KB`);

    return {
      buffer: videoBuffer,
      duration: totalDuration,
      format: opts.outputFormat,
      sizeBytes: videoBuffer.length,
    };

  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ─── Animated Chart Video ───────────────────────────────────
// Generates a video that progressively reveals chart data
// (animation effect — candles appear one by one)

export async function composeAnimatedChartVideo(
  chartFrames: Buffer[],
  audioBuffer: Buffer | null,
  options: Partial<VideoComposeOptions> = {}
): Promise<VideoComposeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tmpDir = path.join(os.tmpdir(), `roua-chart-vid-${Date.now()}`);

  try {
    await fs.mkdir(tmpDir, { recursive: true });

    // Write all frames as numbered images
    for (let i = 0; i < chartFrames.length; i++) {
      await fs.writeFile(path.join(tmpDir, `frame_${String(i).padStart(5, '0')}.png`), chartFrames[i]);
    }

    const crf = opts.quality === 'high' ? '18' : opts.quality === 'medium' ? '23' : '28';
    const outputPath = path.join(tmpDir, 'output.mp4');

    if (audioBuffer) {
      const audioPath = path.join(tmpDir, 'audio.mp3');
      await fs.writeFile(audioPath, audioBuffer);

      await runFFmpeg([
        '-framerate', opts.fps.toString(),
        '-i', path.join(tmpDir, 'frame_%05d.png'),
        '-i', audioPath,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-crf', crf,
        '-preset', 'fast',
        '-shortest',
        '-y',
        outputPath,
      ]);
    } else {
      await runFFmpeg([
        '-framerate', opts.fps.toString(),
        '-i', path.join(tmpDir, 'frame_%05d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', crf,
        '-preset', 'fast',
        '-y',
        outputPath,
      ]);
    }

    const videoBuffer = await fs.readFile(outputPath);
    const duration = chartFrames.length / opts.fps;

    return {
      buffer: videoBuffer,
      duration,
      format: opts.outputFormat,
      sizeBytes: videoBuffer.length,
    };

  } finally {
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── Thumbnail Generator ────────────────────────────────────

export async function generateThumbnail(
  chartImageBuffer: Buffer,
  symbol: string,
  changePercent: number,
  locale: 'ar' | 'en' | 'fr'
): Promise<Buffer> {
  const tmpDir = path.join(os.tmpdir(), `roua-thumb-${Date.now()}`);
  try {
    await fs.mkdir(tmpDir, { recursive: true });
    const inputPath = path.join(tmpDir, 'chart.png');
    const outputPath = path.join(tmpDir, 'thumb.png');
    await fs.writeFile(inputPath, chartImageBuffer);

    const isPositive = changePercent >= 0;
    const color = isPositive ? '#10b981' : '#ef4444';
    const arrow = isPositive ? '\u25B2' : '\u25BC';
    const text = `${symbol} ${arrow}${Math.abs(changePercent).toFixed(2)}%`;

    await runFFmpeg([
      '-i', inputPath,
      '-vf', `drawtext=text='${text}':fontcolor=${color}:fontsize=36:x=40:y=40:shadowcolor=black:shadowx=2:shadowy=2:font=sans-serif`,
      '-y',
      outputPath,
    ]);

    return await fs.readFile(outputPath);
  } finally {
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}
