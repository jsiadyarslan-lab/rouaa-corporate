// ─── Reading Stats Component ───────────────────────────────────
// Shows estimated reading time, word count, reading progress, time remaining
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface ReadingStatsProps {
  wordCount: number;
  title?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// Average Arabic reading speed: ~200 words per minute
const WORDS_PER_MINUTE = 200;

export function ReadingStats({ wordCount, title, locale = 'ar' }: ReadingStatsProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const readingTime = useMemo(() => Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)), [wordCount]);

  // Calculate reading progress based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
        setProgress(pct);

        // Calculate time remaining
        const remainingPct = (100 - pct) / 100;
        const remainingMin = Math.max(0, Math.ceil(readingTime * remainingPct));
        if (remainingMin === 0) {
          setTimeRemaining(t('انتهيت!', 'Done!', 'Terminé !', 'Bitti!', '¡Listo!'));
        } else if (remainingMin === 1) {
          setTimeRemaining(t('أقل من دقيقة', 'Less than a minute', "Moins d'une minute", 'Bir dakikadan az', 'Menos de un minuto'));
        } else {
          setTimeRemaining(t(`${remainingMin} دقيقة متبقية`, `${remainingMin} min remaining`, `${remainingMin} min restantes`, `${remainingMin} dk kaldı`, `${remainingMin} min restantes`));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingTime, locale]);

  // Toggle visibility
  const toggle = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Store preference
  useEffect(() => {
    const pref = localStorage.getItem('rouaa-reading-stats-visible');
    if (pref === 'true') setIsVisible(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('rouaa-reading-stats-visible', String(isVisible));
  }, [isVisible]);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-[var(--bg4)]"
        style={{ border: '1px solid var(--border)', color: isVisible ? 'var(--cyan)' : 'var(--text3)', background: isVisible ? 'var(--cyan2)' : 'transparent' }}
        title={t('إحصائيات القراءة', 'Reading Stats', 'Statistiques de lecture', 'Okuma İstatistikleri', 'Estadísticas de lectura')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        {isVisible ? t('إخفاء', 'Hide', 'Masquer', 'Gizle', 'Ocultar') : t('إحصائيات', 'Stats', 'Stats', 'İstatistikler', 'Estadísticas')}
      </button>

      {/* Stats panel */}
      {isVisible && (
        <div
          className="absolute top-full mt-2 left-0 z-50 p-4 rounded-xl min-w-[240px]"
          style={{
            background: 'var(--bg4)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span className="text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>{t('إحصائيات القراءة', 'Reading Stats', 'Statistiques de lecture', 'Okuma İstatistikleri', 'Estadísticas de lectura')}</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>{t('وقت القراءة', 'Reading Time', 'Temps de lecture', 'Okuma Süresi', 'Tiempo de lectura')}</div>
              <div className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{readingTime}</div>
              <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{t('دقيقة', 'min', 'min', 'dk', 'min')}</div>
            </div>
            <div className="p-2.5 rounded-lg" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <div className="text-[9px] mb-1" style={{ color: 'var(--text3)' }}>{t('عدد الكلمات', 'Word Count', 'Nombre de mots', 'Kelime Sayısı', 'Conteo de palabras')}</div>
              <div className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{wordCount.toLocaleString(locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ar-SA')}</div>
              <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{t('كلمة', 'words', 'mots', 'kelime', 'palabras')}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('تقدم القراءة', 'Reading Progress', 'Progression de lecture', 'Okuma İlerlemesi', 'Progreso de lectura')}</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: progress >= 100 ? 'var(--bull)' : 'var(--cyan)' }}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100
                    ? 'linear-gradient(90deg, var(--bull), var(--cyan))'
                    : 'linear-gradient(90deg, var(--cyan), var(--purple))',
                }}
              />
            </div>
          </div>

          {/* Time remaining */}
          <div className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{timeRemaining}</span>
          </div>

          {/* Speed indicator */}
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[9px]" style={{ color: 'var(--text3)' }}>{t(`سرعة القراءة المقدرة: ${WORDS_PER_MINUTE} كلمة/دقيقة`, `Estimated reading speed: ${WORDS_PER_MINUTE} words/min`, `Vitesse de lecture estimée : ${WORDS_PER_MINUTE} mots/min`, `Tahmini okuma hızı: ${WORDS_PER_MINUTE} kelime/dk`, `Velocidad de lectura estimada: ${WORDS_PER_MINUTE} palabras/min`)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
