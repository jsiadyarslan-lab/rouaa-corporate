// ─── Text-to-Speech Button ─────────────────────────────────────
// Uses Web Speech API to read article content aloud in Arabic
'use client';

import { useState, useCallback, useRef } from 'react';

interface TextToSpeechProps {
  text: string;
  lang?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function TextToSpeechBtn({ text, lang, locale = 'ar' }: TextToSpeechProps) {
  const resolvedLang = lang || (locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ar-SA');
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    if (!window.speechSynthesis) return;

    // Stop if already playing
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Clean text for speech
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/\[object Object\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = resolvedLang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = resolvedLang.split('-')[0];
    const matchingVoice = voices.find(v => v.lang.startsWith(targetPrefix));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [text, resolvedLang, isPlaying]);

  const pause = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  return (
    <button
      onClick={isPlaying ? pause : speak}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-[var(--bg4)]"
      style={{
        border: '1px solid var(--border)',
        color: isPlaying ? 'var(--purple)' : 'var(--text3)',
        background: isPlaying ? 'var(--violet-dim)' : 'transparent',
      }}
      title={isPlaying ? t('إيقاف القراءة', 'Stop Reading', 'Arrêter la lecture', 'Okumayı Durdur', 'Detener lectura') : t('استمع للمقال', 'Listen to Article', "Écouter l'article", 'Makaleyi Dinle', 'Escuchar artículo')}
      aria-label={isPlaying ? t('إيقاف القراءة', 'Stop Reading', 'Arrêter la lecture', 'Okumayı Durdur', 'Detener lectura') : t('استمع للمقال', 'Listen to Article', "Écouter l'article", 'Makaleyi Dinle', 'Escuchar artículo')}
    >
      {isPlaying ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          {t('إيقاف', 'Stop', 'Arrêter', 'Durdur', 'Detener')}
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          {t('استمع', 'Listen', 'Écouter', 'Dinle', 'Escuchar')}
        </>
      )}
    </button>
  );
}
