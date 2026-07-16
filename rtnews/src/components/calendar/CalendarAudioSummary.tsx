'use client';

// ═══════════════════════════════════════════════════════════════════
// CalendarAudioSummary — "Listen to Economic Week" TTS button
// ═══════════════════════════════════════════════════════════════════
// Builds a short TTS script from the top 5 upcoming critical events
// (event name + country + time + importance), calls /api/assistant/tts
// to generate audio, plays it inline with progress tracking.

import { useState, useRef, useCallback } from 'react';
import { getCalendarStrings, CalendarLocale, formatCountdown } from '@/lib/calendar-i18n';

interface EventDigestItem {
  eventName: string;
  country: string;
  eventDate: string;
  importance: string;
}

interface CalendarAudioSummaryProps {
  locale: CalendarLocale;
  events: EventDigestItem[];
  colors: CalendarColors;
}

interface CalendarColors {
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
  gold: string;
  goldDim: string;
  inputBg: string;
  isDark: boolean;
  bg: string;
}

type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export default function CalendarAudioSummary({ locale, events, colors: C }: CalendarAudioSummaryProps) {
  const s = getCalendarStrings(locale);
  const [state, setState] = useState<PlayState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build the digest script: intro + top 5 events + outro
  const buildDigestScript = useCallback((): string => {
    const top5 = events.slice(0, 5);
    if (top5.length === 0) return '';

    const intros: Record<string, string> = {
      ar: 'مرحباً بكم في ملخص الأسبوع الاقتصادي من رؤى. إليكم أهم 5 أحداث قادمة:',
      en: 'Welcome to the Roua Economic Week digest. Here are the top 5 upcoming events:',
      fr: 'Bienvenue dans le résumé de la semaine économique de Roua. Voici les 5 principaux événements à venir :',
      tr: 'Roua Ekonomik Hafta özetine hoş geldiniz. İşte yaklaşan 5 önemli olay:',
      es: 'Bienvenido al resumen de la semana económica de Roua. Aquí están los 5 principales eventos próximos:',
    };
    const outros: Record<string, string> = {
      ar: 'هذا كان ملخص رؤى للاسبوع الاقتصادي. للمزيد من التحليلات، زوروا موقعنا.',
      en: 'That was the Roua economic week digest. For more in-depth analysis, visit our site.',
      fr: 'Ceci était le résumé économique de Roua. Pour des analyses plus approfondies, visitez notre site.',
      tr: 'Bu Roua ekonomik hafta özetiydi. Daha derin analizler için sitemizi ziyaret edin.',
      es: 'Este fue el resumen económico de Roua. Para análisis más profundos, visite nuestro sitio.',
    };
    const separators: Record<string, string> = {
      ar: 'الحدث التالي.',
      en: 'Next event.',
      fr: 'Événement suivant.',
      tr: 'Sıradaki olay.',
      es: 'Siguiente evento.',
    };

    const parts: string[] = [intros[locale] || intros.en];
    top5.forEach((evt, idx) => {
      if (idx > 0) parts.push(separators[locale] || separators.en);
      const countdown = formatCountdown(evt.eventDate, locale);
      const when = countdown.isPast
        ? (locale === 'ar' ? 'انتهى' : 'has ended')
        : countdown.text;
      const importanceLabel = evt.importance === 'critical' || evt.importance === 'high' || evt.importance === '3'
        ? (locale === 'ar' ? 'عالي التأثير' : 'high impact')
        : evt.importance === 'medium' || evt.importance === '2'
          ? (locale === 'ar' ? 'متوسط التأثير' : 'medium impact')
          : (locale === 'ar' ? 'منخفض التأثير' : 'low impact');
      parts.push(`${evt.eventName}, ${evt.country}, ${importanceLabel}, ${when}.`);
    });
    parts.push(outros[locale] || outros.en);

    return parts.join(' ');
  }, [events, locale]);

  const startPlayback = useCallback(async () => {
    if (state === 'playing') {
      audioRef.current?.pause();
      setState('paused');
      return;
    }
    if (state === 'paused' && audioRef.current) {
      audioRef.current.play();
      setState('playing');
      return;
    }

    setState('loading');
    setErrorMsg(null);
    setProgress(0);
    setCurrentIdx(0);

    try {
      const script = buildDigestScript();
      if (!script) {
        setState('error');
        setErrorMsg(s.noEventsHint);
        return;
      }

      const res = await fetch('/api/assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, locale }),
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

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        setProgress(pct);
        if (audio.duration > 0) {
          const segmentLen = audio.duration / 5;
          const idx = Math.min(4, Math.floor(audio.currentTime / segmentLen));
          setCurrentIdx(idx);
        }
      });
      audio.addEventListener('ended', () => {
        setState('idle');
        setProgress(100);
        setCurrentIdx(-1);
      });
      audio.addEventListener('error', () => {
        setState('error');
        setErrorMsg(s.audioSummaryFailed);
      });

      await audio.play();
      setState('playing');
    } catch (err) {
      console.error('[CalendarAudioSummary] Playback failed:', err);
      setState('error');
      setErrorMsg(s.audioSummaryFailed);
    }
  }, [state, buildDigestScript, locale, s.audioSummaryFailed, s.noEventsHint]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      const src = audioRef.current.src;
      if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
      audioRef.current = null;
    }
    setState('idle');
    setProgress(0);
    setCurrentIdx(-1);
  }, []);

  if (events.length === 0) return null;

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';
  const isError = state === 'error';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={startPlayback}
        disabled={events.length === 0}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '7px 14px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          background: isPlaying
            ? `linear-gradient(135deg, ${C.gold}, #f59e0b)`
            : isLoading
              ? C.goldDim
              : 'rgba(232,160,32,0.12)',
          color: isPlaying ? '#fff' : C.gold,
          border: `1px solid ${isPlaying ? 'rgba(232,160,32,0.5)' : 'rgba(232,160,32,0.25)'}`,
          cursor: events.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: events.length === 0 ? 0.5 : 1,
          fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)',
          letterSpacing: '0.3px',
        }}
        title={isError ? errorMsg || s.audioSummaryFailed : s.audioSummary}
      >
        {isLoading ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : isError ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}

        <span>{isLoading ? s.audioSummaryLoading : isPlaying ? s.audioSummaryStop : s.audioSummary}</span>

        {isPlaying && currentIdx >= 0 && (
          <span style={{
            fontSize: '9px', opacity: 0.8,
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
          }}>
            {currentIdx + 1}/5
          </span>
        )}
      </button>

      {/* Progress bar */}
      {(isPlaying || state === 'paused') && (
        <div style={{
          position: 'absolute', bottom: '-4px',
          left: '8px', right: '8px', height: '2px',
          background: 'rgba(232,160,32,0.2)',
          borderRadius: '1px', overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: `linear-gradient(90deg, ${C.gold}, #f59e0b)`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Stop button */}
      {(isPlaying || state === 'paused') && (
        <button
          onClick={stopPlayback}
          style={{
            position: 'absolute', top: '-6px', insetInlineEnd: '-6px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: C.red, color: '#fff',
            border: `2px solid ${C.bg}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', fontWeight: 700,
            cursor: 'pointer', padding: 0, lineHeight: 1,
          }}
          title={s.audioSummaryStop}
        >
          ✕
        </button>
      )}
    </div>
  );
}
