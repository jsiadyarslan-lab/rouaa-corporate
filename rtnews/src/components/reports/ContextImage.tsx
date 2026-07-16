// ─── Context-aware image mapping V162 ──────────────────────────
// V162 FIX: Replaced deprecated source.unsplash.com (shut down in 2024)
// with Pollinations.ai AI-generated images. Every image is now AI-generated,
// matching the platform's "AI images only" policy.
//
// Previously used source.unsplash.com which was deprecated and non-functional,
// causing all images to fail and show only emoji fallbacks.

'use client';

import { useState, useMemo } from 'react';
import { getProxiedImageUrl } from '@/lib/image-proxy';

// ─── Context-aware image mapping ─────────────────────────────
const TOPIC_IMAGES: Record<string, { emoji: string; prompt: string; altAr: string }> = {
  '\u0646\u0641\u0637': { emoji: '\uD83D\uDDE2\uFE0F', prompt: 'oil refinery at night industrial, professional business photography, dark cinematic', altAr: '\u062D\u0642\u0648\u0644 \u0646\u0641\u0637' },
  '\u0628\u0631\u0646\u062A': { emoji: '\uD83D\uDDE2\uFE0F', prompt: 'oil pipeline industrial infrastructure, professional business photography, dark cinematic', altAr: '\u0623\u0646\u0627\u0628\u064A\u0628 \u0646\u0641\u0637' },
  '\u0628\u062A\u0631\u0648\u0644': { emoji: '\uD83D\uDDE2\uFE0F', prompt: 'oil refinery petroleum processing, professional business photography, dark cinematic', altAr: '\u0645\u0635\u0641\u0627\u0629 \u0628\u062A\u0631\u0648\u0644' },
  '\u0637\u0627\u0642\u0629': { emoji: '\u26A1', prompt: 'energy power plant infrastructure, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0637\u0627\u0642\u0629' },
  '\u0630\u0647\u0628': { emoji: '\uD83E\uDD47', prompt: 'gold bars dark luxury vault, professional business photography, dark cinematic', altAr: '\u0633\u0628\u0627\u0626\u0643 \u0630\u0647\u0628' },
  '\u0645\u0644\u0627\u0630 \u0622\u0645\u0646': { emoji: '\uD83E\uDD47', prompt: 'gold bullion safe haven investment, professional business photography, dark cinematic', altAr: '\u0630\u0647\u0628 \u0643\u0645\u0644\u0627\u0630 \u0622\u0645\u0646' },
  '\u0635\u064A\u0646': { emoji: '\uD83C\uDDE8\uD83C\uDDF3', prompt: 'china port shipping containers, professional business photography, dark cinematic', altAr: '\u0645\u064A\u0646\u0627\u0621 \u0635\u064A\u0646\u064A' },
  '\u0635\u0627\u062F\u0631\u0627\u062A': { emoji: '\uD83D\uDCE6', prompt: 'shipping containers cargo port, professional business photography, dark cinematic', altAr: '\u062D\u0627\u0648\u064A\u0627\u062A \u0634\u062D\u0646' },
  '\u0623\u0633\u0647\u0645': { emoji: '\uD83D\uDCC8', prompt: 'stock market trading floor wall street, professional business photography, dark cinematic', altAr: '\u062A\u062F\u0627\u0648\u0644 \u0627\u0644\u0623\u0633\u0647\u0645' },
  '\u0628\u0648\u0631\u0635\u0629': { emoji: '\uD83D\uDCC8', prompt: 'stock exchange trading screen, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0628\u0648\u0631\u0635\u0629' },
  '\u0639\u0645\u0644\u0627\u062A': { emoji: '\uD83D\uDCB1', prompt: 'currency exchange forex market, professional business photography, dark cinematic', altAr: '\u062A\u062F\u0627\u0648\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u062A' },
  '\u0641\u0648\u0631\u0643\u0633': { emoji: '\uD83D\uDCB1', prompt: 'forex trading charts candlestick, professional business photography, dark cinematic', altAr: '\u0633\u0648\u0642 \u0627\u0644\u0641\u0648\u0631\u0643\u0633' },
  '\u0643\u0631\u064A\u0628\u062A\u0648': { emoji: '\u20BF', prompt: 'cryptocurrency bitcoin digital blockchain, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0639\u0645\u0644\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629' },
  '\u0628\u062A\u0643\u0648\u064A\u0646': { emoji: '\u20BF', prompt: 'bitcoin cryptocurrency network, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0628\u064A\u062A\u0643\u0648\u064A\u0646' },
  '\u0639\u0642\u0627\u0631\u0627\u062A': { emoji: '\uD83C\uDFE2', prompt: 'real estate modern buildings skyline, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062A' },
  '\u0628\u0646\u0648\u0643': { emoji: '\uD83C\uDFE6', prompt: 'bank building financial district, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0645\u0635\u0631\u0641\u064A' },
  '\u0641\u0627\u0626\u062F\u0629': { emoji: '\uD83C\uDFE6', prompt: 'interest rates central bank policy, professional business photography, dark cinematic', altAr: '\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0641\u0627\u0626\u062F\u0629' },
  '\u062A\u0636\u062E\u0645': { emoji: '\uD83D\uDCC8', prompt: 'inflation rising prices economy, professional business photography, dark cinematic', altAr: '\u0627\u0644\u062A\u0636\u062E\u0645' },
  '\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627': { emoji: '\uD83D\uDCBB', prompt: 'technology innovation digital transformation, professional business photography, dark cinematic', altAr: '\u0627\u0644\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0627' },
  '\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A': { emoji: '\uD83E\uDD16', prompt: 'artificial intelligence neural network, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A' },
  '\u062D\u0631\u0628': { emoji: '\u2694\uFE0F', prompt: 'geopolitical conflict world map, professional business photography, dark cinematic', altAr: '\u0646\u0632\u0627\u0639' },
  '\u0639\u0642\u0648\u0628\u0627\u062A': { emoji: '\uD83D\uDEAB', prompt: 'international sanctions trade restrictions, professional business photography, dark cinematic', altAr: '\u0639\u0642\u0648\u0628\u0627\u062A' },
  '\u063A\u0630\u0627\u0621': { emoji: '\uD83C\uDF3E', prompt: 'agriculture food security farming, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0623\u0645\u0646 \u0627\u0644\u063A\u0630\u0627\u0626\u064A' },
  '\u0635\u062D\u0629': { emoji: '\uD83C\uDFE5', prompt: 'healthcare pharmaceutical medical, professional business photography, dark cinematic', altAr: '\u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0635\u062D\u064A' },
  '\u0633\u064A\u0627\u0631\u0627\u062A': { emoji: '\uD83D\uDE97', prompt: 'automotive industry electric vehicles, professional business photography, dark cinematic', altAr: '\u0642\u0637\u0627\u0639 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A' },
};

interface ContextImageProps {
  text: string;
  size?: number;
  layout?: 'inline' | 'card';
}

export default function ContextImage({ text, size = 120, layout = 'inline' }: ContextImageProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Find the best matching topic
  const match = useMemo(() => {
    let bestMatch: { keyword: string; info: typeof TOPIC_IMAGES[string]; index: number } | null = null;
    for (const [keyword, info] of Object.entries(TOPIC_IMAGES)) {
      const idx = text.indexOf(keyword);
      if (idx !== -1) {
        if (!bestMatch || idx < bestMatch.index) {
          bestMatch = { keyword, info, index: idx };
        }
      }
    }
    return bestMatch;
  }, [text]);

  if (!match) return null;

  const { info } = match;

  // V162: Use Pollinations.ai AI-generated images instead of deprecated Unsplash Source API
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(info.prompt)}?width=320&height=320&nologo=true&seed=${info.prompt.length}&model=flux`;
  // Route through our proxy for caching and reliability
  const imgUrl = getProxiedImageUrl(pollinationsUrl, info.prompt) || pollinationsUrl;

  if (layout === 'card') {
    return (
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        padding: '12px',
        borderRadius: '10px',
        background: 'rgba(128,128,128,0.04)',
        border: '1px solid rgba(128,128,128,0.08)',
        marginBottom: '12px',
      }}>
        {/* Image */}
        <div style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'rgba(128,128,128,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {!imgError ? (
            <>
              <img
                key={imgUrl}
                src={imgUrl}
                alt={info.altAr}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}
              />
              {!imgLoaded && (
                <span style={{ position: 'absolute', fontSize: '32px' }}>{info.emoji}</span>
              )}
            </>
          ) : (
            <span style={{ fontSize: '40px' }}>{info.emoji}</span>
          )}
        </div>
        {/* Caption */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-head)', marginBottom: '4px' }}>
            {info.emoji} {info.altAr}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6', margin: 0 }}>
            صورة مُولّدة بالذكاء الاصطناعي — {info.altAr}
          </p>
        </div>
      </div>
    );
  }

  // Inline layout (floating)
  return (
    <div style={{
      float: 'left',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '8px',
      overflow: 'hidden',
      margin: '0 12px 8px 0',
      background: 'rgba(128,128,128,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(128,128,128,0.08)',
      position: 'relative',
    }}>
      {!imgError ? (
        <>
          <img
            key={imgUrl}
            src={imgUrl}
            alt={info.altAr}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          />
          {!imgLoaded && (
            <span style={{ position: 'absolute', fontSize: '32px' }}>{info.emoji}</span>
          )}
        </>
      ) : (
        <span style={{ fontSize: '40px' }}>{info.emoji}</span>
      )}
    </div>
  );
}
