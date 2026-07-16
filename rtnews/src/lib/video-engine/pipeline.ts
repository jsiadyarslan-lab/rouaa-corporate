// ═══════════════════════════════════════════════════════════════
// ⚠️  DEPRECATED — THIS FILE IS NOT USED IN PRODUCTION
// ═══════════════════════════════════════════════════════════════
// The video-engine/ module was the original Node.js Canvas-based
// video pipeline. It has been REPLACED by the Playwright-based
// renderer scripts:
//   - scripts/video-renderer.mjs (Pulse/Bloomberg style)
//   - scripts/video-renderer-dataviz.mjs (DataViz/Al Jazeera style)
// No API route or code imports from this module.
// Kept for reference only — DO NOT add new code here.
// ═══════════════════════════════════════════════════════════════

// ─── Video Generation Pipeline (DEPRECATED) ──────────────────────
// Orchestrates the full video generation process:
// 1. Fetch financial data (via existing financial-apis.ts)
// 2. Render chart frames with progressive reveal
// 3. Generate narration script and TTS audio
// 4. Compose video with FFmpeg
// 5. Upload to R2 and return URL
//
// This replaces the failed Python microservice approach with
// a Node.js-native pipeline that works within the Next.js app.

import { getHistoricalData, getQuote, type HistoricalPoint } from '../financial-apis';
import { uploadImageToR2 } from '../image-storage';
import {
  renderCandlestickChart,
  renderTitleCard,
  renderIndicatorCard,
  type ChartRenderResult,
} from './chart-renderer';
import { composeVideo, generateThumbnail, type VideoSegment, type VideoComposeOptions } from './video-composer';
import { generateNarrationScript, generateTTSAudio, type NarrationScriptParams } from './tts-engine';

// ─── Types ──────────────────────────────────────────────────

export interface VideoGenerationRequest {
  symbol: string;
  assetName?: string;
  locale: 'ar' | 'en' | 'fr';
  theme?: 'dark' | 'light';
  includeBollinger?: boolean;
  days?: number;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  sizeBytes: number;
  error?: string;
  /** How long the generation took (ms) */
  generationTimeMs: number;
}

// ─── Technical Indicator Calculations ───────────────────────

function calculateRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  let sum = 0;
  for (let i = data.length - period; i < data.length; i++) sum += data[i];
  return sum / period;
}

function calculateMACD(closes: number[]): { signal: 'bullish' | 'bearish' | 'neutral'; macd: number; signal_line: number } {
  if (closes.length < 26) return { signal: 'neutral', macd: 0, signal_line: 0 };
  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let result = data[0];
    for (let i = 1; i < data.length; i++) result = data[i] * k + result * (1 - k);
    return result;
  };
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = ema12 - ema26;
  // Simplified signal line
  const recentCloses = closes.slice(-9);
  const signalLine = ema(recentCloses.map(() => macd), 9);
  const sig = macd > signalLine ? 'bullish' : macd < signalLine ? 'bearish' : 'neutral';
  return { signal: sig, macd, signal_line: signalLine };
}

function findSupportResistance(data: HistoricalPoint[]): { support: number | null; resistance: number | null } {
  if (data.length < 5) return { support: null, resistance: null };
  const recent = data.slice(-20);
  const closes = recent.map(d => d.close);
  const currentPrice = closes[closes.length - 1];
  const lows = recent.map(d => d.low).sort((a, b) => a - b);
  const highs = recent.map(d => d.high).sort((a, b) => a - b);

  // Support: lowest recent low below current price
  let support: number | null = null;
  for (const l of lows) {
    if (l < currentPrice) { support = l; break; }
  }

  // Resistance: highest recent high above current price
  let resistance: number | null = null;
  for (let i = highs.length - 1; i >= 0; i--) {
    if (highs[i] > currentPrice) { resistance = highs[i]; break; }
  }

  return { support, resistance };
}

function getBollingerPosition(closes: number[]): 'upper' | 'middle' | 'lower' | null {
  if (closes.length < 20) return null;
  const current = closes[closes.length - 1];
  const ma20 = calculateMA(closes, 20);
  if (!ma20) return null;

  let sumSq = 0;
  for (let i = closes.length - 20; i < closes.length; i++) {
    sumSq += (closes[i] - ma20) ** 2;
  }
  const std = Math.sqrt(sumSq / 20);
  const upper = ma20 + 2 * std;
  const lower = ma20 - 2 * std;

  if (current >= upper) return 'upper';
  if (current <= lower) return 'lower';
  if (current >= ma20) return 'middle';
  return 'middle';
}

// ─── Main Pipeline ──────────────────────────────────────────

export async function generateVideo(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  const startTime = Date.now();
  const { symbol, locale, theme = 'dark', includeBollinger = true, days = 90 } = request;
  let assetName = request.assetName || symbol;

  console.log(`[VideoPipeline] Starting video generation for ${symbol} (${locale})`);

  try {
    // ─── Step 1: Fetch Financial Data ───
    console.log(`[VideoPipeline] Step 1: Fetching data for ${symbol}...`);
    const [quote, historicalData] = await Promise.all([
      getQuote(symbol),
      getHistoricalData(symbol, days),
    ]);

    if (historicalData.length < 10) {
      return {
        success: false,
        videoUrl: null,
        thumbnailUrl: null,
        duration: 0,
        sizeBytes: 0,
        error: `Insufficient historical data for ${symbol} (got ${historicalData.length} points)`,
        generationTimeMs: Date.now() - startTime,
      };
    }

    const currentPrice = quote?.price || historicalData[historicalData.length - 1].close;
    const changePercent = quote?.changePercent || 0;
    assetName = request.assetName || symbol;

    console.log(`[VideoPipeline] Data fetched: ${historicalData.length} points, price=${currentPrice}`);

    // ─── Step 2: Calculate Indicators ───
    const closes = historicalData.map(d => d.close);
    const rsi = calculateRSI(closes);
    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    const macdResult = calculateMACD(closes);
    const bollingerPos = getBollingerPosition(closes);
    const { support, resistance } = findSupportResistance(historicalData);

    // ─── Step 3: Render Chart Frames (Progressive Reveal) ───
    console.log(`[VideoPipeline] Step 3: Rendering chart frames...`);

    // Title card
    const titleCard = renderTitleCard({
      width: 1920,
      height: 1080,
      symbol,
      assetName,
      title: locale === 'ar' ? 'تحليل فني' : locale === 'fr' ? 'Analyse Technique' : 'Technical Analysis',
      subtitle: locale === 'ar'
        ? `${new Date().toLocaleDateString('ar-SA')} | رؤى`
        : locale === 'fr'
        ? `${new Date().toLocaleDateString('fr-FR')} | ROUA Perspectives`
        : `${new Date().toLocaleDateString('en-US')} | ROUA Insights`,
      locale,
      theme,
      changePercent,
      currentPrice,
    });

    // Chart frames: progressively reveal more data
    const totalFrames = 12; // ~3 seconds at 4fps reveal speed
    const chartFrames: ChartRenderResult[] = [];
    for (let i = 0; i < totalFrames; i++) {
      const visiblePoints = Math.max(5, Math.floor(((i + 1) / totalFrames) * historicalData.length));
      const frame = renderCandlestickChart(historicalData, {
        width: 1920,
        height: 1080,
        symbol,
        assetName,
        locale,
        theme,
        showVolume: true,
        showMA: true,
        showBollinger: includeBollinger,
        visiblePoints,
        currentPrice: i === totalFrames - 1 ? currentPrice : undefined,
        changePercent: i === totalFrames - 1 ? changePercent : undefined,
      });
      chartFrames.push(frame);
    }

    // Full chart with all indicators visible
    const fullChart = renderCandlestickChart(historicalData, {
      width: 1920,
      height: 1080,
      symbol,
      assetName,
      locale,
      theme,
      showVolume: true,
      showMA: true,
      showBollinger: includeBollinger,
      visiblePoints: historicalData.length,
      currentPrice,
      changePercent,
    });

    // Indicator cards
    const rsiCard = rsi !== null ? renderIndicatorCard({
      width: 1920,
      height: 1080,
      symbol,
      indicator: 'RSI (14)',
      value: rsi.toFixed(1),
      signal: rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral',
      description: rsi > 70
        ? (locale === 'ar' ? 'السهم في منطقة ذروة الشراء — قد يحدث تصحيح' : 'Overbought — correction may occur')
        : rsi < 30
        ? (locale === 'ar' ? 'السهم في منطقة ذروة البيع — قد يرتد' : 'Oversold — bounce may occur')
        : (locale === 'ar' ? 'السهم في نطاق تداول طبيعي' : 'Trading in normal range'),
      locale,
      theme,
    }) : null;

    const macdCard = renderIndicatorCard({
      width: 1920,
      height: 1080,
      symbol,
      indicator: 'MACD',
      value: macdResult.macd.toFixed(2),
      signal: macdResult.signal,
      description: macdResult.signal === 'bullish'
        ? (locale === 'ar' ? 'الMACD أعلى خط الإشارة — زخم صعودي' : 'MACD above signal line — bullish momentum')
        : macdResult.signal === 'bearish'
        ? (locale === 'ar' ? 'الMACD أدنى خط الإشارة — زخم هبوطي' : 'MACD below signal line — bearish momentum')
        : (locale === 'ar' ? 'الMACD بالقرب من خط الإشارة' : 'MACD near signal line'),
      locale,
      theme,
    });

    // ─── Step 4: Generate Narration ───
    console.log(`[VideoPipeline] Step 4: Generating narration...`);

    const narrationParams: NarrationScriptParams = {
      symbol,
      assetName,
      currentPrice,
      changePercent,
      high: quote?.high || historicalData[historicalData.length - 1].high,
      low: quote?.low || historicalData[historicalData.length - 1].low,
      volume: quote?.volume || historicalData[historicalData.length - 1].volume,
      ma5,
      ma10,
      rsi,
      macdSignal: macdResult.signal,
      bollingerPosition: bollingerPos,
      support,
      resistance,
      locale,
    };

    const narrationScripts = await generateNarrationScript(narrationParams);

    // Generate TTS for each segment
    const narrationAudios: { buffer: Buffer | null; duration: number }[] = [];
    for (const script of narrationScripts) {
      const audio = await generateTTSAudio(script, { locale });
      narrationAudios.push(audio as any);
    }

    // ─── Step 5: Build Video Segments ───
    console.log(`[VideoPipeline] Step 5: Composing video...`);

    const segments: VideoSegment[] = [];

    // Title card (3 seconds)
    segments.push({
      type: 'title',
      imageBuffer: titleCard.buffer,
      duration: 3,
      narrationText: narrationScripts[0],
      audioBuffer: narrationAudios[0]?.buffer || undefined,
    });

    // Chart reveal animation (use the last full frame as the still, hold for narration)
    // Each chart frame is displayed for 0.25s = 4fps animation
    const chartRevealDuration = totalFrames * 0.25; // ~3 seconds

    // We add chart animation as a single segment with the full chart
    // The animation frames would need the animated chart composer, but for simplicity
    // we'll use the full chart with a longer hold
    const chartHoldDuration = Math.max(5, narrationAudios.slice(1).reduce((sum, a) => sum + a.duration, 0));

    segments.push({
      type: 'chart',
      imageBuffer: fullChart.buffer,
      duration: chartHoldDuration,
      narrationText: narrationScripts[1],
      audioBuffer: narrationAudios[1]?.buffer || undefined,
    });

    // Indicator cards (3 seconds each)
    const indicatorScriptIdx = 2;
    if (rsiCard) {
      segments.push({
        type: 'indicator',
        imageBuffer: rsiCard.buffer,
        duration: 4,
        narrationText: narrationScripts[indicatorScriptIdx],
        audioBuffer: narrationAudios[indicatorScriptIdx]?.buffer || undefined,
      });
    }

    if (macdCard) {
      segments.push({
        type: 'indicator',
        imageBuffer: macdCard.buffer,
        duration: 4,
        narrationText: narrationScripts[Math.min(indicatorScriptIdx + 1, narrationScripts.length - 1)],
        audioBuffer: narrationAudios[Math.min(indicatorScriptIdx + 1, narrationAudios.length - 1)]?.buffer || undefined,
      });
    }

    // Final chart hold with summary (5 seconds)
    segments.push({
      type: 'chart',
      imageBuffer: fullChart.buffer,
      duration: 5,
      narrationText: narrationScripts[narrationScripts.length - 1],
      audioBuffer: narrationAudios[narrationAudios.length - 1]?.buffer || undefined,
    });

    // ─── Step 6: Compose Video ───
    const videoResult = await composeVideo(segments, {
      width: 1920,
      height: 1080,
      fps: 24,
      quality: 'high',
      outputFormat: 'mp4',
    });

    console.log(`[VideoPipeline] Video composed: ${(videoResult.sizeBytes / 1024).toFixed(0)}KB, ${videoResult.duration.toFixed(1)}s`);

    // ─── Step 7: Generate Thumbnail ───
    const thumbnailBuffer = await generateThumbnail(
      fullChart.buffer,
      symbol,
      changePercent,
      locale,
    );

    // ─── Step 8: Upload to R2 ───
    console.log(`[VideoPipeline] Step 8: Uploading to R2...`);

    const videoId = `vid-${symbol.toLowerCase()}-${Date.now()}`;
    const videoUpload = await uploadVideoToR2(videoId, videoResult.buffer);
    const thumbUpload = await uploadImageToR2(`${videoId}-thumb`, thumbnailBuffer, 'image/png');

    const generationTimeMs = Date.now() - startTime;
    console.log(`[VideoPipeline] Complete in ${(generationTimeMs / 1000).toFixed(1)}s — video: ${videoUpload.url?.slice(0, 60)}...`);

    return {
      success: videoUpload.success,
      videoUrl: videoUpload.url || null,
      thumbnailUrl: thumbUpload.url || null,
      duration: videoResult.duration,
      sizeBytes: videoResult.sizeBytes,
      generationTimeMs,
      error: videoUpload.success ? undefined : videoUpload.error,
    };

  } catch (err: any) {
    const generationTimeMs = Date.now() - startTime;
    console.error(`[VideoPipeline] FAILED for ${symbol}: ${err.message}`);

    return {
      success: false,
      videoUrl: null,
      thumbnailUrl: null,
      duration: 0,
      sizeBytes: 0,
      error: err.message,
      generationTimeMs,
    };
  }
}

// ─── Video Upload to R2 ─────────────────────────────────────

async function uploadVideoToR2(
  videoId: string,
  videoBuffer: Buffer
): Promise<{ success: boolean; url: string; error?: string }> {
  // Try R2 first (same as image storage)
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL || '';

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    // R2 not configured — return the buffer as a data URL (not ideal but works for demo)
    console.warn('[VideoPipeline] R2 not configured — video cannot be stored persistently');
    return {
      success: false,
      url: '',
      error: 'R2 not configured',
    };
  }

  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const key = `videos/${videoId}.mp4`;

    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: videoBuffer,
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=31536000',
    }));

    if (!publicUrl) {
      return { success: false, url: '', error: 'R2_PUBLIC_URL not set' };
    }

    const url = `${publicUrl.replace(/\/$/, '')}/${key}`;
    return { success: true, url };
  } catch (err: any) {
    return { success: false, url: '', error: err.message };
  }
}

// ─── List Available Videos ──────────────────────────────────

export interface VideoListItem {
  id: string;
  symbol: string;
  assetName: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  status: 'ready' | 'processing' | 'failed';
  createdAt: string;
  locale: 'ar' | 'en' | 'fr';
}

// In-memory video store (DEPRECATED — NOT USED IN PRODUCTION)
// V5 FIX: This Map is lost on restart. The active system uses Prisma VideoReport table.
// Kept for API compatibility but should never be called in production.
const videoStore = new Map<string, VideoListItem>();

export function storeVideoResult(video: VideoListItem): void {
  videoStore.set(video.id, video);
}

export function getStoredVideos(locale?: string, assetClass?: string): VideoListItem[] {
  let videos = Array.from(videoStore.values());
  if (locale) videos = videos.filter(v => v.locale === locale);
  return videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getStoredVideo(id: string): VideoListItem | undefined {
  return videoStore.get(id);
}
