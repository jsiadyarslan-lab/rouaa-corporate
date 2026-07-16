'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #4: AI Audio Brief
// Text-to-speech summary of the report using Web Speech API.
// Supports play/pause, speed control, and language-aware voices.
// ═══════════════════════════════════════════════════════════════

interface Props {
  reportTitle: string;
  reportSummary: string;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'AI Audio Brief',
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    speed: 'Speed',
    listening: 'Listening...',
    ready: 'Ready to listen',
    noSupport: 'Audio playback not supported in this browser',
  },
  fr: {
    title: 'Résumé Audio IA',
    play: 'Écouter',
    pause: 'Pause',
    stop: 'Arrêter',
    speed: 'Vitesse',
    listening: 'En écoute...',
    ready: 'Prêt à écouter',
    noSupport: 'Lecture audio non supportée dans ce navigateur',
  },
  ar: {
    title: 'ملخص صوتي بالذكاء الاصطناعي',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    stop: 'إيقاف',
    speed: 'السرعة',
    listening: 'جاري الاستماع...',
    ready: 'جاهز للاستماع',
    noSupport: 'التشغيل الصوتي غير مدعوم في هذا المتصفح',
  },
  es: {
    title: 'Resumen de Audio IA',
    play: 'Reproducir',
    pause: 'Pausa',
    stop: 'Detener',
    speed: 'Velocidad',
    listening: 'Escuchando...',
    ready: 'Listo para escuchar',
    noSupport: 'La reproducción de audio no es compatible con este navegador',
  },
};

type PlayState = 'idle' | 'playing' | 'paused';

export default function AIAudioBrief({ reportTitle, reportSummary, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const [playState, setPlayState] = useState<PlayState>('idle');
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const langMap: Record<string, string> = { en: 'en', fr: 'fr', ar: 'ar' };
    const targetLang = langMap[locale] || 'en';
    return voices.find(v => v.lang.startsWith(targetLang)) || voices[0] || null;
  }, [locale]);

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const text = `${reportTitle}. ${reportSummary}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = 1;
    utterance.volume = 0.9;

    const voice = getVoice();
    if (voice) utterance.voice = voice;

    if (locale === 'ar') utterance.lang = 'ar-SA';
    else if (locale === 'fr') utterance.lang = 'fr-FR';
    else utterance.lang = 'en-US';

    utterance.onend = () => {
      setPlayState('idle');
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utterance.onerror = () => {
      setPlayState('idle');
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlayState('playing');
    setProgress(0);

    // Estimate progress
    const estimatedDuration = (text.length / 15) / speed; // rough chars/sec estimate
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(95, Math.round((elapsed / estimatedDuration) * 100));
      setProgress(pct);
    }, 500);
  }, [reportTitle, reportSummary, speed, locale, getVoice]);

  const togglePlay = useCallback(() => {
    if (playState === 'playing') {
      window.speechSynthesis?.pause();
      setPlayState('paused');
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (playState === 'paused') {
      window.speechSynthesis?.resume();
      setPlayState('playing');
    } else {
      speak();
    }
  }, [playState, speak]);

  const handleStop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlayState('idle');
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const currentIdx = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    setSpeed(nextSpeed);
    if (playState !== 'idle' && utteranceRef.current) {
      handleStop();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(`${reportTitle}. ${reportSummary}`);
        utterance.rate = nextSpeed;
        const voice = getVoice();
        if (voice) utterance.voice = voice;
        if (locale === 'ar') utterance.lang = 'ar-SA';
        else if (locale === 'fr') utterance.lang = 'fr-FR';
        else utterance.lang = 'en-US';
        utterance.onend = () => { setPlayState('idle'); setProgress(100); };
        utteranceRef.current = utterance;
        window.speechSynthesis?.speak(utterance);
        setPlayState('playing');
      }, 100);
    }
  }, [speed, playState, handleStop, reportTitle, reportSummary, locale, getVoice]);

  if (!isSupported) return null;

  const statusText = playState === 'playing' ? t('listening') : playState === 'paused' ? t('pause') : t('ready');

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px',
      direction: dir,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>&#127911;</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
        <span style={{
          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', marginLeft: 'auto',
          background: playState === 'playing' ? 'rgba(0,153,107,0.1)' : 'rgba(128,128,128,0.06)',
          color: playState === 'playing' ? '#00996B' : 'var(--text3)',
          border: `1px solid ${playState === 'playing' ? 'rgba(0,153,107,0.2)' : 'rgba(128,128,128,0.1)'}`,
        }}>
          {statusText}
        </span>
      </div>

      {/* Progress bar */}
      {playState !== 'idle' && (
        <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(128,128,128,0.12)', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ height: '100%', borderRadius: '2px', width: `${progress}%`, background: 'linear-gradient(90deg, var(--cyan), #00996B)', transition: 'width 0.5s' }} />
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={togglePlay} style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: playState === 'playing' ? 'rgba(0,229,255,0.1)' : 'rgba(0,153,107,0.1)',
          border: `1px solid ${playState === 'playing' ? 'rgba(0,229,255,0.2)' : 'rgba(0,153,107,0.2)'}`,
          color: playState === 'playing' ? 'var(--cyan)' : '#00996B',
          cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {playState === 'playing' ? '⏸' : '▶'}
        </button>

        {playState !== 'idle' && (
          <button onClick={handleStop} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(212,54,92,0.1)', border: '1px solid rgba(212,54,92,0.2)',
            color: '#D4365C', cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ⏹
          </button>
        )}

        <button onClick={handleSpeed} style={{
          padding: '6px 12px', borderRadius: '6px',
          background: 'rgba(128,128,128,0.08)', border: '1px solid rgba(128,128,128,0.15)',
          color: 'var(--text2)', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
        }}>
          {t('speed')}: {speed}x
        </button>
      </div>
    </div>
  );
}
