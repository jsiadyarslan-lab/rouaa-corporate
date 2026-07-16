'use client';

// ═══════════════════════════════════════════════════════════════════
// AudioDigestButton — "Listen to the news" — TTS for top headlines
// ═══════════════════════════════════════════════════════════════════
// On click: builds a short digest script from the top 5 headlines,
// calls /api/assistant/tts to generate audio, plays it inline.
//
// Use case: user is commuting / cooking / at the gym — they hit play
// and listen to the most important headlines of the moment in their
// own language. This is the "Audio Digest" revolutionary feature.

import { useState, useRef, useCallback } from 'react';
import { getNewsStrings, NewsLocale } from '@/lib/news-i18n';

interface NewsDigestItem {
  title: string;
  source?: string;
  category?: string;
}

interface AudioDigestButtonProps {
  locale: NewsLocale;
  headlines: NewsDigestItem[];
  colors: {
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderHover: string;
    cyan: string;
    cyanDim: string;
    cyanBorder: string;
    purple: string;
    purpleDim: string;
    green: string;
    red: string;
    isDark: boolean;
    bg: string;
  };
}

type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export default function AudioDigestButton({ locale, headlines, colors: C }: AudioDigestButtonProps) {
  const s = getNewsStrings(locale);
  const [state, setState] = useState<PlayState>('idle');
  const [progress, setProgress] = useState(0);          // 0-100
  const [currentHeadlineIdx, setCurrentHeadlineIdx] = useState(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build the digest script — top 5 headlines, locale-appropriate intro/outro
  const buildDigestScript = useCallback((): string => {
    const top5 = headlines.slice(0, 5);
    if (top5.length === 0) return '';

    const intros: Record<string, string> = {
      ar: 'مرحباً بكم في الملخص الصوتي لأخبار رؤى. إليكم أهم العناوين:',
      en: 'Welcome to the Roua News audio digest. Here are the top headlines:',
      fr: 'Bienvenue dans le résumé audio des actualités Roua. Voici les principaux titres :',
      tr: 'Roua Haber sesli özetine hoş geldiniz. İşte önemli başlıklar:',
      es: 'Bienvenido al resumen de audio de noticias de Roua. Aquí están los principales titulares:',
    };
    const outros: Record<string, string> = {
      ar: 'هذا كان ملخص أخبار رؤى. للمزيد من التحليلات، زوروا موقعنا.',
      en: 'That was the Roua news digest. For more in-depth analysis, visit our site.',
      fr: 'Ceci était le résumé des actualités Roua. Pour des analyses plus approfondies, visitez notre site.',
      tr: 'Bu Roua haber özetiydi. Daha derin analizler için sitemizi ziyaret edin.',
      es: 'Este fue el resumen de noticias de Roua. Para análisis más profundos, visite nuestro sitio.',
    };
    const separators: Record<string, string> = {
      ar: 'الخبر التالي.',
      en: 'Next.',
      fr: 'Suivant.',
      tr: 'Sıradaki.',
      es: 'Siguiente.',
    };

    const parts = [intros[locale] || intros.en];
    top5.forEach((item, idx) => {
      if (idx > 0) parts.push(separators[locale] || separators.en);
      parts.push(item.title);
    });
    parts.push(outros[locale] || outros.en);

    return parts.join(' ');
  }, [headlines, locale]);

  const startPlayback = useCallback(async () => {
    if (state === 'playing') {
      // Pause
      audioRef.current?.pause();
      setState('paused');
      return;
    }
    if (state === 'paused' && audioRef.current) {
      // Resume
      audioRef.current.play();
      setState('playing');
      return;
    }

    // Fresh start
    setState('loading');
    setErrorMsg(null);
    setProgress(0);
    setCurrentHeadlineIdx(0);

    try {
      const script = buildDigestScript();
      if (!script) {
        setState('error');
        setErrorMsg(s.noNewsHint);
        return;
      }

      const res = await fetch('/api/assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          locale,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          errDetail = errBody.error || errDetail;
        } catch {}
        throw new Error(errDetail);
      }

      // TTS endpoint returns audio bytes directly (audio/wav)
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);

      // Stop any existing playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        setProgress(pct);
        // Estimate current headline based on duration / 5
        if (audio.duration > 0) {
          const segmentLen = audio.duration / 5;
          const idx = Math.min(4, Math.floor(audio.currentTime / segmentLen));
          setCurrentHeadlineIdx(idx);
        }
      });
      audio.addEventListener('ended', () => {
        setState('idle');
        setProgress(100);
        setCurrentHeadlineIdx(-1);
      });
      audio.addEventListener('error', () => {
        setState('error');
        setErrorMsg(s.digestFailed);
      });

      await audio.play();
      setState('playing');
    } catch (err) {
      console.error('[AudioDigest] Playback failed:', err);
      setState('error');
      setErrorMsg(s.digestFailed);
    }
  }, [state, buildDigestScript, locale, s.digestFailed, s.noNewsHint]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      // Revoke the blob URL to free memory
      const src = audioRef.current.src;
      if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
      audioRef.current = null;
    }
    setState('idle');
    setProgress(0);
    setCurrentHeadlineIdx(-1);
  }, []);

  if (headlines.length === 0) return null;

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';
  const isError = state === 'error';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={startPlayback}
        disabled={headlines.length === 0}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '7px 14px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          background: isPlaying
            ? `linear-gradient(135deg, ${C.purple}, #a855f7)`
            : isLoading
              ? C.purpleDim
              : 'rgba(139,92,246,0.12)',
          color: isPlaying ? '#fff' : C.purple,
          border: `1px solid ${isPlaying ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.25)'}`,
          cursor: headlines.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: headlines.length === 0 ? 0.5 : 1,
          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          letterSpacing: '0.3px',
        }}
        title={isError ? errorMsg || s.digestFailed : s.audioDigest}
        onMouseEnter={e => {
          if (!isPlaying && !isLoading && headlines.length > 0) {
            e.currentTarget.style.background = 'rgba(139,92,246,0.18)';
          }
        }}
        onMouseLeave={e => {
          if (!isPlaying && !isLoading) {
            e.currentTarget.style.background = 'rgba(139,92,246,0.12)';
          }
        }}
      >
        {/* Icon */}
        {isLoading ? (
          // Spinner
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : isPlaying ? (
          // Pause icon
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : isError ? (
          // Error icon
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ) : (
          // Play icon (sound waves)
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}

        <span>{isLoading ? s.audioDigestLoading : isPlaying ? s.audioDigestStop : s.audioDigest}</span>

        {/* Headline counter */}
        {isPlaying && currentHeadlineIdx >= 0 && (
          <span style={{
            fontSize: '9px', opacity: 0.8,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>
            {currentHeadlineIdx + 1}/5
          </span>
        )}
      </button>

      {/* Progress bar (shown while playing) */}
      {(isPlaying || state === 'paused') && (
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          left: '8px',
          right: '8px',
          height: '2px',
          background: 'rgba(139,92,246,0.2)',
          borderRadius: '1px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${C.purple}, #a855f7)`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Stop button (shown while playing or paused) */}
      {(isPlaying || state === 'paused') && (
        <button
          onClick={stopPlayback}
          style={{
            position: 'absolute',
            top: '-6px',
            insetInlineEnd: '-6px',
            width: '16px', height: '16px',
            borderRadius: '50%',
            background: C.red,
            color: '#fff',
            border: '2px solid ' + C.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
          title={s.audioDigestStop}
        >
          ✕
        </button>
      )}
    </div>
  );
}
