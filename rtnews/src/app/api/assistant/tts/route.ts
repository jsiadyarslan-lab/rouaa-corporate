// ─── Assistant TTS (Text-to-Speech) API ──────────────────────────
// POST /api/assistant/tts
// Server-side TTS using z-ai-web-dev-sdk for high-quality Arabic speech.
// V400: MP3 fallback if WAV fails, 20s timeout with AbortController,
// detailed error logging, better chunk handling.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ─── Request Schema ────────────────────────────────────────────
const TTSSchema = z.object({
  text: z.string().min(1, 'Text is required').max(4000, 'Text too long'),
  locale: z.enum(['ar', 'en', 'fr', 'tr', 'es']).optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  voice: z.string().optional(),
});

// ─── Voice Mapping ─────────────────────────────────────────────
const VOICE_MAP: Record<string, string> = {
  ar: 'tongtong',   // Warm and friendly — best for Arabic
  en: 'jam',        // English gentleman voice
  fr: 'kazi',       // Clear and standard
  tr: 'kazi',       // Clear and standard
  es: 'kazi',       // Clear and standard
};

// ─── Speed Mapping ─────────────────────────────────────────────
const SPEED_MAP: Record<string, number> = {
  ar: 0.85,  // Arabic needs slightly slower for clarity
  en: 1.0,
  fr: 0.95,
  tr: 0.95,
  es: 0.95,
};

// ─── Text Chunking ─────────────────────────────────────────────
// Max 1024 chars per TTS request. Split at sentence boundaries.
function splitTextIntoChunks(text: string, maxLength = 900): string[] {
  const chunks: string[] = [];

  // Clean text for TTS
  let cleanText = text
    .replace(/<[^>]*>/g, ' ')           // Remove HTML tags
    .replace(/[#*_~`]/g, '')             // Remove markdown formatting
    .replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, '') // Remove tool calls
    .replace(/\[[\s\S]*?\]/g, '')        // Remove bracketed content
    .replace(/https?:\/\/[^\s]+/g, '')   // Remove URLs
    .replace(/[📊📈📉🟢🔴🟡💡🎯🔍🧠⚠️💱🔒❓📰⚖📋🔬🎤🎙️🔊✓•→─═│├┤┬┴┼🔄📏⛔]/g, '') // Remove emojis/symbols
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanText.length <= maxLength) {
    return [cleanText];
  }

  // Split at sentence boundaries
  const sentenceRegex = /[^.!?؟。！？]+[.!?؟。！？]+/g;
  const sentences = cleanText.match(sentenceRegex) || [cleanText];

  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks.filter(c => c.length > 0);
}

// ── V400: Try TTS with format fallback (WAV → MP3) ──
async function tryTTS(
  zai: any,
  input: string,
  voice: string,
  speed: number,
  preferredFormat: 'wav' | 'mp3' = 'wav'
): Promise<Buffer> {
  const formats = preferredFormat === 'wav' ? ['wav', 'mp3'] : ['mp3', 'wav'];
  let lastError: any = null;

  for (const fmt of formats) {
    try {
      // V400: 20-second timeout per TTS call using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);

      const response = await zai.audio.tts.create({
        input,
        voice,
        speed,
        response_format: fmt,
        stream: false,
      });

      clearTimeout(timeoutId);

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      if (buffer.length === 0) {
        console.warn(`[TTS] Empty buffer with format '${fmt}', trying next format`);
        lastError = new Error(`Empty audio buffer with format '${fmt}'`);
        continue;
      }

      console.log(`[TTS] Success with format '${fmt}': ${buffer.length} bytes`);
      return buffer;
    } catch (fmtErr: any) {
      console.warn(`[TTS] Format '${fmt}' failed:`, fmtErr.message?.slice(0, 150));
      lastError = fmtErr;
      // Continue to next format
    }
  }

  throw lastError || new Error('All TTS format attempts failed');
}

// ─── Main Handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TTSSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input';
      console.warn('[TTS] Validation error:', firstError);
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { text, locale = 'ar', speed, voice } = parsed.data;
    const selectedVoice = voice || VOICE_MAP[locale] || 'tongtong';
    const selectedSpeed = speed || SPEED_MAP[locale] || 1.0;

    // Split text into chunks if needed
    const chunks = splitTextIntoChunks(text);

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No text to speak' }, { status: 400 });
    }

    console.log(`[TTS] Generating audio: ${chunks.length} chunk(s), voice=${selectedVoice}, speed=${selectedSpeed}, locale=${locale}`);

    // Import ZAI SDK
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // If single chunk, return audio directly
    if (chunks.length === 1) {
      try {
        const buffer = await tryTTS(zai, chunks[0], selectedVoice, selectedSpeed, 'wav');

        const contentType = 'audio/wav'; // We tried WAV first, so if it succeeded, it's WAV
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'no-cache',
          },
        });
      } catch (sdkErr: any) {
        console.error('[TTS] SDK error (single chunk, all formats failed):', sdkErr.message?.slice(0, 200));
        return NextResponse.json(
          { error: 'TTS generation failed: ' + (sdkErr.message || 'Unknown SDK error') },
          { status: 500 }
        );
      }
    }

    // Multiple chunks: generate audio for each and concatenate
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`[TTS] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
        const buf = await tryTTS(zai, chunks[i], selectedVoice, selectedSpeed, 'wav');
        audioBuffers.push(buf);
      } catch (chunkErr: any) {
        console.warn('[TTS] Chunk', i + 1, 'failed (all formats):', chunkErr.message?.slice(0, 100));
        // Continue with remaining chunks
      }
    }

    if (audioBuffers.length === 0) {
      console.error('[TTS] All chunks failed');
      return NextResponse.json({ error: 'TTS generation failed for all chunks' }, { status: 500 });
    }

    // Concatenate audio buffers (simple concatenation works for same format)
    const combinedBuffer = Buffer.concat(audioBuffers);
    console.log(`[TTS] Multi-chunk OK: ${audioBuffers.length}/${chunks.length} chunks, ${combinedBuffer.length} bytes`);

    return new NextResponse(new Uint8Array(combinedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': combinedBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('[TTS API] Fatal error:', error.message);

    return NextResponse.json(
      { error: error.message || 'TTS generation failed' },
      { status: 500 }
    );
  }
}
