// @ts-nocheck
// ─── Infographic Viewer V16 ────────────────────────────────────
// V16: Added locale prop for English/Arabic UI text translation
// Full background images + auto-play carousel

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { InfographicSlide, isSlideContentValid, getCategoryColor, COLOR_MAP, DESIGN_TOKENS, hexToRgba } from './types';
import HeroSlide from './slides/HeroSlide';
import StorySlide from './slides/StorySlide';
import DataSlide from './slides/DataSlide';
import ScenariosSlide from './slides/ScenariosSlide';
import AssetsSlide from './slides/AssetsSlide';
import RecommendationsSlide from './slides/RecommendationsSlide';
import StatSlide from './slides/StatSlide';
import ComparisonSlide from './slides/ComparisonSlide';
import TimelineSlide from './slides/TimelineSlide';
import ListSlide from './slides/ListSlide';
import ChartSlide from './slides/ChartSlide';
import QuoteSlide from './slides/QuoteSlide';
import SummarySlide from './slides/SummarySlide';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { ChevronLeft, ChevronRight, Maximize2, X, Pause, Play, LayoutGrid, Rows3 } from 'lucide-react';

interface InfographicViewerProps {
  slides: InfographicSlide[];
  category?: string;
  compact?: boolean;
  autoPlayInterval?: number;
  viewMode?: 'carousel' | 'scroll';
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
  publishedAt?: string | Date;
}

const BD = DESIGN_TOKENS.borderDefault;

// V16→V17: Translation map for viewer UI — all 5 locales
const VIEWER_I18N: Record<string, {
  previous: string;
  next: string;
  slide: (n: number) => string;
  prevSlide: string;
  nextSlide: string;
  closeFullscreen: string;
  openFullscreen: string;
  viewAllSlides: string;
  viewCarousel: string;
  stopAutoPlay: string;
  startAutoPlay: string;
}> = {
  ar: {
    previous: 'السابق',
    next: 'التالي',
    slide: (n: number) => `الشريحة ${n}`,
    prevSlide: 'الشريحة السابقة',
    nextSlide: 'الشريحة التالية',
    closeFullscreen: 'إغلاق عرض ملء الشاشة',
    openFullscreen: 'عرض ملء الشاشة',
    viewAllSlides: 'عرض كل الشرائح',
    viewCarousel: 'عرض كاروسيل',
    stopAutoPlay: 'إيقاف التشغيل التلقائي',
    startAutoPlay: 'تشغيل تلقائي',
  },
  en: {
    previous: 'Previous',
    next: 'Next',
    slide: (n: number) => `Slide ${n}`,
    prevSlide: 'Previous slide',
    nextSlide: 'Next slide',
    closeFullscreen: 'Close fullscreen',
    openFullscreen: 'View fullscreen',
    viewAllSlides: 'View all slides',
    viewCarousel: 'View carousel',
    stopAutoPlay: 'Stop auto-play',
    startAutoPlay: 'Auto-play',
  },
  es: {
    previous: 'Anterior',
    next: 'Siguiente',
    slide: (n: number) => `Diapositiva ${n}`,
    prevSlide: 'Diapositiva anterior',
    nextSlide: 'Diapositiva siguiente',
    closeFullscreen: 'Cerrar pantalla completa',
    openFullscreen: 'Pantalla completa',
    viewAllSlides: 'Ver todas las diapositivas',
    viewCarousel: 'Ver carrusel',
    stopAutoPlay: 'Detener reproducción',
    startAutoPlay: 'Reproducción automática',
  },
  fr: {
    previous: 'Précédent',
    next: 'Suivant',
    slide: (n: number) => `Diapositive ${n}`,
    prevSlide: 'Diapositive précédente',
    nextSlide: 'Diapositive suivante',
    closeFullscreen: 'Fermer le plein écran',
    openFullscreen: 'Plein écran',
    viewAllSlides: 'Voir toutes les diapositives',
    viewCarousel: 'Voir le carrousel',
    stopAutoPlay: 'Arrêter la lecture',
    startAutoPlay: 'Lecture automatique',
  },
  tr: {
    previous: 'Önceki',
    next: 'Sonraki',
    slide: (n: number) => `Slayt ${n}`,
    prevSlide: 'Önceki slayt',
    nextSlide: 'Sonraki slayt',
    closeFullscreen: 'Tam ekranı kapat',
    openFullscreen: 'Tam ekran',
    viewAllSlides: 'Tüm slaytları gör',
    viewCarousel: 'Karusel görünümü',
    stopAutoPlay: 'Otomatik oynatmayı durdur',
    startAutoPlay: 'Otomatik oynat',
  },
};

// V15: Extract image URL from a slide for preloading
function getSlideImageUrl(slide: InfographicSlide): string | null {
  const rawUrl = slide.image_url || slide.imageUrl || slide.content?.image_url;
  if (!rawUrl) return null;
  // Route through proxy for caching (same as SlideWithImage/HeroSlide)
  const proxied = getProxiedImageUrl(rawUrl, slide.unsplash_query || slide.content?.unsplash_query);
  return proxied || rawUrl;
}

function normalizeSlides(slides: InfographicSlide[], category?: string): InfographicSlide[] {
  const primaryColor = getCategoryColor(category);
  return slides.map(slide => {
    const normalized = { ...slide, accentColor: slide.accentColor || primaryColor };
    // V13: Auto-derive confidence for hero slides if missing
    if (normalized.type === 'hero') {
      const hasConfidence = (normalized as any).confidence != null || (normalized.content as any)?.confidence != null;
      if (!hasConfidence) {
        // Derive from metadata confidence or sentiment strength
        // Default to 65 (medium) if no data available
        (normalized as any).confidence = 65;
      }
    }
    return normalized;
  });
}

function renderSlide(slide: InfographicSlide, category?: string, allSlides?: InfographicSlide[], locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr', publishedAt?: string | Date): React.ReactNode {
  const loc = locale || 'ar';
  switch (slide.type) {
    case 'hero': return <HeroSlide slide={slide} category={category} allSlides={allSlides} locale={loc} publishedAt={publishedAt} />;
    case 'story': return <StorySlide slide={slide} locale={loc} />;
    case 'data': return <DataSlide slide={slide} locale={loc} />;
    case 'scenarios': return <ScenariosSlide slide={slide} locale={loc} />;
    case 'assets': return <AssetsSlide slide={slide} locale={loc} />;
    case 'recommendations': return <RecommendationsSlide slide={slide} locale={loc} />;
    case 'stat': return <StatSlide slide={slide} locale={loc} />;
    case 'comparison': return <ComparisonSlide slide={slide} locale={loc} />;
    case 'timeline': return <TimelineSlide slide={slide} locale={loc} />;
    case 'list': return <ListSlide slide={slide} locale={loc} />;
    case 'chart': return <ChartSlide slide={slide} locale={loc} />;
    case 'quote': return <QuoteSlide slide={slide} locale={loc} />;
    case 'summary': return <SummarySlide slide={slide} locale={loc} />;
    default: return <ListSlide slide={slide} locale={loc} />;
  }
}

export default function InfographicViewer({ slides: rawSlides, category, compact, autoPlayInterval = 6000, viewMode: initialViewMode, locale = 'ar', publishedAt }: InfographicViewerProps) {
  const t = VIEWER_I18N[locale] || VIEWER_I18N.en;
  const isRtl = locale === 'ar';

  const getSlideColor = (slide: InfographicSlide): string => {
    if (slide.color && COLOR_MAP[slide.color]) return COLOR_MAP[slide.color];
    return slide.accentColor || '#3b82f6';
  };
  const validSlides = normalizeSlides((rawSlides || []).filter(isSlideContentValid), category);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'scroll'>(initialViewMode || 'carousel');

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goNext = useCallback(() => { setCurrentSlide(prev => prev >= validSlides.length - 1 ? 0 : prev + 1); }, [validSlides.length]);
  const goPrev = useCallback(() => { setCurrentSlide(prev => prev <= 0 ? validSlides.length - 1 : prev - 1); }, [validSlides.length]);
  const goToSlide = useCallback((index: number) => { setCurrentSlide(index); }, []);

  const startAutoPlay = useCallback(() => {
    if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    autoPlayTimer.current = setInterval(() => { if (!isPaused) goNext(); }, autoPlayInterval);
  }, [autoPlayInterval, goNext, isPaused]);

  const stopAutoPlay = useCallback(() => { if (autoPlayTimer.current) { clearInterval(autoPlayTimer.current); autoPlayTimer.current = null; } }, []);

  useEffect(() => {
    if (isPlaying && validSlides.length > 1) startAutoPlay(); else stopAutoPlay();
    return () => stopAutoPlay();
  }, [isPlaying, validSlides.length, startAutoPlay, stopAutoPlay]);

  useEffect(() => { if (isPlaying && !isPaused && validSlides.length > 1) startAutoPlay(); }, [isPaused, isPlaying, validSlides.length, startAutoPlay]);
  const togglePlayPause = useCallback(() => { setIsPlaying(prev => !prev); }, []);
  const handleMouseEnter = useCallback(() => { setIsPaused(true); }, []);
  const handleMouseLeave = useCallback(() => { setIsPaused(false); }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; isSwiping.current = true; setIsPaused(true); }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => { if (!isSwiping.current) return; touchEndX.current = e.changedTouches[0].screenX; }, []);
  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) return; isSwiping.current = false;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) >= 50) { if (isRtl ? diff > 0 : diff < 0) goNext(); else goPrev(); }
    touchStartX.current = 0; touchEndX.current = 0;
    setTimeout(() => setIsPaused(false), 3000);
  }, [goNext, goPrev, isRtl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') isRtl ? goPrev() : goNext();
      else if (e.key === 'ArrowLeft') isRtl ? goNext() : goPrev();
      else if (e.key === 'Escape' && fullscreen) setFullscreen(false);
      else if (e.key === ' ') { e.preventDefault(); togglePlayPause(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, fullscreen, togglePlayPause, isRtl]);

  useEffect(() => { if (currentSlide >= validSlides.length) setCurrentSlide(Math.max(0, validSlides.length - 1)); }, [validSlides.length, currentSlide]);

  // V15: Preload next and previous slide images for instant transitions
  useEffect(() => {
    if (validSlides.length <= 1) return;

    const nextIdx = currentSlide >= validSlides.length - 1 ? 0 : currentSlide + 1;
    const prevIdx = currentSlide <= 0 ? validSlides.length - 1 : currentSlide - 1;

    // Preload next and previous slide images
    [nextIdx, prevIdx].forEach(idx => {
      const slideUrl = getSlideImageUrl(validSlides[idx]);
      if (slideUrl) {
        const img = new Image();
        img.src = slideUrl;
        // Fire and forget — just warming the browser cache
      }
    });
  }, [currentSlide, validSlides]);

  if (validSlides.length === 0) return null;
  const slide = validSlides[currentSlide];
  const slideColor = getSlideColor(slide);

  // Navigation buttons with RTL/LTR awareness
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  if (viewMode === 'scroll') {
    return (
      <div className="relative w-full max-w-[720px] mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-end mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setViewMode('carousel')} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ color: slideColor, background: hexToRgba(slideColor, 0.08), border: `1px solid ${hexToRgba(slideColor, 0.15)}` }} aria-label={t.viewCarousel}><LayoutGrid size={16} /></button>
          </div>
        </div>
        <div className="space-y-5">
          {validSlides.map((s, i) => (
            <div key={s.id || i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BD}`, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              {renderSlide(s, category, validSlides, locale, publishedAt)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full max-w-[720px] mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Top controls bar — progress bar only, no slide count text */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: BD }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((currentSlide + 1) / validSlides.length) * 100}%`, background: slideColor }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setViewMode(viewMode === 'carousel' ? 'scroll' : 'carousel')} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ color: DESIGN_TOKENS.textSecondary, background: DESIGN_TOKENS.bgCard, border: `1px solid ${BD}` }} aria-label={viewMode === 'carousel' ? t.viewAllSlides : t.viewCarousel}><Rows3 size={15} /></button>
            {validSlides.length > 1 && (
              <button onClick={togglePlayPause} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ color: isPlaying ? slideColor : DESIGN_TOKENS.textSecondary, background: isPlaying ? hexToRgba(slideColor, 0.08) : DESIGN_TOKENS.bgCard, border: `1px solid ${isPlaying ? hexToRgba(slideColor, 0.15) : BD}` }} aria-label={isPlaying ? t.stopAutoPlay : t.startAutoPlay}>{isPlaying ? <Pause size={14} /> : <Play size={14} />}</button>
            )}
            <button onClick={() => setFullscreen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ color: DESIGN_TOKENS.textSecondary, background: DESIGN_TOKENS.bgCard, border: `1px solid ${BD}` }} aria-label={t.openFullscreen}><Maximize2 size={15} /></button>
          </div>
        </div>

        {/* Slide container */}
        <div className="relative overflow-y-auto overflow-x-hidden rounded-2xl select-none"
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
          onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
          style={{ border: `1px solid ${BD}`, boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`, touchAction: 'pan-y pinch-zoom', maxHeight: '80vh', scrollbarWidth: 'thin', scrollbarColor: `${BD} transparent` }}>
          <div key={slide.id || currentSlide}>{renderSlide(slide, category, validSlides, locale, publishedAt)}</div>
          {/* Auto-progress bar */}
          {isPlaying && validSlides.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-[3px] z-20" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="h-full rounded-full" style={{ background: slideColor, animation: isPaused ? 'none' : `autoProgress ${autoPlayInterval}ms linear` }} />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={goPrev} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:bg-opacity-80" style={{ color: DESIGN_TOKENS.textSecondary, background: DESIGN_TOKENS.bgCard, border: `1px solid ${BD}` }} aria-label={t.prevSlide}><PrevIcon size={16} />{t.previous}</button>
          <div className="flex items-center gap-2">
            {validSlides.map((s, i) => (
              <button key={i} onClick={() => goToSlide(i)} className="rounded-full transition-all duration-300" style={{ background: i === currentSlide ? slideColor : BD, width: i === currentSlide ? '24px' : '8px', height: '8px' }} aria-label={t.slide(i + 1)} aria-current={i === currentSlide ? 'true' : undefined} />
            ))}
          </div>
          <button onClick={goNext} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:bg-opacity-80" style={{ color: DESIGN_TOKENS.textSecondary, background: DESIGN_TOKENS.bgCard, border: `1px solid ${BD}` }} aria-label={t.nextSlide}>{t.next}<NextIcon size={16} /></button>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all z-10" style={{ background: DESIGN_TOKENS.bgCard, color: DESIGN_TOKENS.textSecondary, border: `1px solid ${BD}` }} aria-label={t.closeFullscreen}><X size={18} /></button>
          <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
            {validSlides.length > 1 && (
              <button onClick={togglePlayPause} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ background: DESIGN_TOKENS.bgCard, color: isPlaying ? slideColor : DESIGN_TOKENS.textSecondary, border: `1px solid ${BD}` }} aria-label={isPlaying ? t.stopAutoPlay : t.startAutoPlay}>{isPlaying ? <Pause size={14} /> : <Play size={14} />}</button>
            )}
          </div>
          <div key={validSlides[currentSlide]?.id || currentSlide} className="w-full max-w-[900px] max-h-[85vh] overflow-y-auto select-none">{renderSlide(validSlides[currentSlide], category, validSlides, locale, publishedAt)}</div>
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
            <button onClick={goPrev} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all" style={{ background: DESIGN_TOKENS.bgCard, color: DESIGN_TOKENS.textSecondary, border: `1px solid ${BD}` }} aria-label={t.prevSlide}><PrevIcon size={20} /></button>
            <div className="flex items-center gap-2">
              {validSlides.map((s, i) => (
                <button key={i} onClick={() => goToSlide(i)} className="rounded-full transition-all duration-300" style={{ background: i === currentSlide ? slideColor : BD, width: i === currentSlide ? '28px' : '8px', height: '8px' }} aria-label={t.slide(i + 1)} />
              ))}
            </div>
            <button onClick={goNext} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all" style={{ background: DESIGN_TOKENS.bgCard, color: DESIGN_TOKENS.textSecondary, border: `1px solid ${BD}` }} aria-label={t.nextSlide}><NextIcon size={20} /></button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes autoProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </>
  );
}
