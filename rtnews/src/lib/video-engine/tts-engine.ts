// ═══════════════════════════════════════════════════════════════
// ⚠️  DEPRECATED — THIS FILE IS NOT USED IN PRODUCTION
// ═══════════════════════════════════════════════════════════════
// Replaced by Playwright-based renderers in scripts/video-renderer*.mjs
// No code imports this module. Kept for reference only.
// ═══════════════════════════════════════════════════════════════

// ─── TTS Engine for Video Narration (DEPRECATED) ────────────
// Generates narration audio using the AI provider system
// Supports Arabic and English voices via OpenAI-compatible TTS

// @ts-ignore
import { chatWithAI } from '../ai-provider';

// ─── Types ──────────────────────────────────────────────────

export interface TTSOptions {
  locale: 'ar' | 'en' | 'fr';
  speed?: number; // 0.5 - 2.0
  voice?: string;
}

export interface NarrationSegment {
  text: string;
  audioBuffer: Buffer | null;
  durationSec: number;
}

// ─── Narration Script Generator ─────────────────────────────

export interface NarrationScriptParams {
  symbol: string;
  assetName: string;
  currentPrice: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  ma5: number | null;
  ma10: number | null;
  rsi: number | null;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  bollingerPosition: 'upper' | 'middle' | 'lower' | null;
  support: number | null;
  resistance: number | null;
  locale: 'ar' | 'en' | 'fr';
}

export async function generateNarrationScript(params: NarrationScriptParams): Promise<string[]> {
  const {
    symbol, assetName, currentPrice, changePercent, high, low, volume,
    ma5, ma10, rsi, macdSignal, bollingerPosition, support, resistance, locale
  } = params;

  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isPositive = changePercent >= 0;

  const direction = isPositive
    ? (isAr ? 'صعودياً' : isFr ? 'à la hausse' : 'upward')
    : (isAr ? 'هبوطياً' : isFr ? 'à la baisse' : 'downward');

  const macdLabel = macdSignal === 'bullish'
    ? (isAr ? 'صاعد (إشارة شراء)' : isFr ? 'haussier (signal d\'achat)' : 'bullish (buy signal)')
    : macdSignal === 'bearish'
    ? (isAr ? 'هابط (إشارة بيع)' : isFr ? 'baissier (signal de vente)' : 'bearish (sell signal)')
    : (isAr ? 'محايد' : isFr ? 'neutre' : 'neutral');

  const bollingerLabel = bollingerPosition === 'upper'
    ? (isAr ? 'الشريط العلوي (منطقة ذروة شراء)' : isFr ? 'la bande supérieure (zone de surachat)' : 'the upper band (overbought zone)')
    : bollingerPosition === 'lower'
    ? (isAr ? 'الشريط السفلي (منطقة ذروة بيع)' : isFr ? 'la bande inférieure (zone de survente)' : 'the lower band (oversold zone)')
    : (isAr ? 'المنطقة الوسطى' : isFr ? 'la zone médiane' : 'the middle zone');

  if (isAr) {
    return [
      `تحليل ${assetName}، الرمز ${symbol}. يتداول السهم عند ${currentPrice.toFixed(2)} دولار، بتحرك ${direction} بنسبة ${Math.abs(changePercent).toFixed(2)} بالمئة.`,
      `أعلى سعر ${high.toFixed(2)} وأدنى سعر ${low.toFixed(2)}. حجم التداول ${formatVolumeAr(volume)}.`,
      `${rsi !== null ? `مؤشر القوة النسبية RSI عند ${rsi.toFixed(0)}.` : ''} ${ma5 !== null ? `المتوسط المتحرك 5 أيام عند ${ma5.toFixed(2)}.` : ''} إشارة MACD ${macdLabel}.`,
      `السعر يتداول بالقرب من ${bollingerLabel} لبولنجر. ${support ? `مستوى الدعم عند ${support.toFixed(2)}` : ''} ${resistance ? `ومستوى المقاومة عند ${resistance.toFixed(2)}` : ''}.`,
    ].filter(s => s.trim().length > 10);
  } else if (isFr) {
    return [
      `Analyse de ${assetName}, symbole ${symbol}. L'action se négocie à ${formatPriceFr(currentPrice)}, avec un mouvement ${direction} de ${Math.abs(changePercent).toFixed(2)}%.`,
      `Plus haut de la séance à ${formatPriceFr(high)}, plus bas à ${formatPriceFr(low)}. Volume de ${formatVolumeFr(volume)}.`,
      `${rsi !== null ? `Le RSI est à ${rsi.toFixed(0)}.` : ''} ${ma5 !== null ? `Moyenne mobile sur 5 jours à ${formatPriceFr(ma5)}.` : ''} Le signal MACD est ${macdLabel}.`,
      `Le prix se négocie près de ${bollingerLabel} des bandes de Bollinger. ${support ? `Support à ${formatPriceFr(support)}` : ''} ${resistance ? `et résistance à ${formatPriceFr(resistance)}` : ''}.`,
    ].filter(s => s.trim().length > 10);
  } else {
    return [
      `Analysis of ${assetName}, ticker ${symbol}. The stock is trading at ${formatPriceEn(currentPrice)}, moving ${direction} by ${Math.abs(changePercent).toFixed(2)}%.`,
      `Session high at ${formatPriceEn(high)}, low at ${formatPriceEn(low)}. Volume at ${formatVolumeEn(volume)}.`,
      `${rsi !== null ? `RSI is at ${rsi.toFixed(0)}.` : ''} ${ma5 !== null ? `5-day moving average at ${formatPriceEn(ma5)}.` : ''} MACD signal is ${macdLabel}.`,
      `Price is trading near ${bollingerLabel} of the Bollinger Bands. ${support ? `Support at ${formatPriceEn(support)}` : ''} ${resistance ? `and resistance at ${formatPriceEn(resistance)}` : ''}.`,
    ].filter(s => s.trim().length > 10);
  }
}

// ─── Simple TTS via Web Speech API (fallback) ───────────────
// For now, we generate silent audio placeholders.
// In production, connect to OpenAI TTS, ElevenLabs, or Google TTS.

export async function generateTTSAudio(
  text: string,
  options: TTSOptions
): Promise<{ audioBuffer: Buffer | null; durationSec: number }> {
  // Estimate duration based on text length
  // Arabic: ~120 words/min, French: ~140 words/min, English: ~150 words/min
  const wordsPerMin = options.locale === 'ar' ? 120 : options.locale === 'fr' ? 140 : 150;
  const wordCount = text.split(/\s+/).length;
  const durationSec = (wordCount / wordsPerMin) * 60;

  // Try to use OpenAI TTS if API key is available
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: text,
          voice: options.locale === 'ar' ? 'shimmer' : options.locale === 'fr' ? 'coral' : 'alloy',
          speed: options.speed || 1.1,
          response_format: 'mp3',
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        // Estimate real duration from buffer size (mp3 ~128kbps)
        const realDuration = audioBuffer.length / (128000 / 8);
        return { audioBuffer, durationSec: realDuration };
      }
    } catch (err: any) {
      console.warn(`[TTSEngine] OpenAI TTS failed: ${err.message?.slice(0, 100)}`);
    }
  }

  // Try Groq TTS (if available)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'playai-tts',
          input: text,
          voice: options.locale === 'ar' ? 'Hiba-MSA' : options.locale === 'fr' ? 'Fritz-PlayAI' : 'Fritz-PlayAI',
          response_format: 'mp3',
          speed: 1.1,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        const realDuration = audioBuffer.length / (128000 / 8);
        return { audioBuffer, durationSec: realDuration };
      }
    } catch (err: any) {
      console.warn(`[TTSEngine] Groq TTS failed: ${err.message?.slice(0, 100)}`);
    }
  }

  // No TTS available — return silent placeholder with estimated duration
  return { audioBuffer: null, durationSec: Math.max(3, durationSec) };
}

// ─── Helpers ────────────────────────────────────────────────

function formatVolumeAr(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)} مليار`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)} مليون`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)} ألف`;
  return volume.toString();
}

function formatVolumeEn(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return volume.toString();
}

function formatPriceEn(price: number): string {
  if (price >= 100) return `$${price.toFixed(2)}`;
  if (price >= 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(6)}`;
}

function formatVolumeFr(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)} milliards`;
  if (volume >= 1_000_000) return `volume de ${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return volume.toString();
}

function formatPriceFr(price: number): string {
  if (price >= 100) return `${price.toFixed(2)} $`;
  if (price >= 1) return `${price.toFixed(3)} $`;
  return `${price.toFixed(6)} $`;
}
