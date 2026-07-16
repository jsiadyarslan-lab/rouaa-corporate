// @ts-nocheck
// ─── Slide With Background Image ────────────────────────────
// V12: Direct Pollinations URLs (no proxy) + faster retry + lazy loading
// Used by StorySlide, DataSlide, ScenariosSlide, AssetsSlide

'use client';

import { ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import { InfographicSlide, COLOR_MAP, getCategoryColor, DESIGN_TOKENS } from '../types';
import { getProxiedImageUrl, getEnhancedImageUrl, isPollinationsUrl } from '@/lib/image-proxy';

interface SlideWithImageProps {
  slide: InfographicSlide;
  children: ReactNode;
  fallbackIcon?: any;
  fallbackText?: string;
  /** V11: Slide type for unique gradient DNA */
  slideType?: 'hero' | 'story' | 'data' | 'scenarios' | 'assets' | 'recommendations';
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

const MAX_RETRIES = 2;
const POLLINATIONS_TIMEOUT_MS = 15000; // V12: Reduced from 30s to 15s

// V12: Translation map
const SLIDE_I18N = {
  ar: { loadingImage: 'جارٍ تحميل الصورة...' },
  en: { loadingImage: 'Loading image...' },
  es: { loadingImage: 'Loading image...' },
  fr: { loadingImage: 'Loading image...' },
  tr: { loadingImage: 'Loading image...' },
};

export default function SlideWithImage({ slide, children, fallbackIcon: FallbackIcon, fallbackText, slideType = 'data', locale = 'ar' }: SlideWithImageProps) {
  const t = SLIDE_I18N[locale];
  const colorName = slide.content.color || slide.color || '';
  const accentColor = COLOR_MAP[colorName] || slide.accentColor || getCategoryColor(slide.content.tag);
  const rawImageUrl = slide.image_url || slide.imageUrl || slide.content?.image_url;
  const unsplashQuery = slide.unsplash_query || slide.content?.unsplash_query;
  // V125: getProxiedImageUrl now returns DIRECT Pollinations URLs (no proxy)
  const imageUrl = getProxiedImageUrl(rawImageUrl, unsplashQuery || undefined);
  const hasImage = !!imageUrl;
  const overlay = slide.image_overlay ?? 0.30; // V211: Reduced from 0.45 — less blur/wash-out on background images

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(imageUrl);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);

  const isPollinations = isPollinationsUrl(rawImageUrl);

  // Reset image state when imageUrl changes (different slide in carousel)
  useEffect(() => {
    setCurrentUrl(imageUrl);
    setImgError(false);
    setImgLoaded(false);
    retryRef.current = 0;
    setRetryCount(0);
  }, [imageUrl]);

  const handleLoad = useCallback(() => {
    setImgLoaded(true);
    setImgError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleError = useCallback(() => {
    if (isPollinations && retryRef.current < MAX_RETRIES) {
      retryRef.current += 1;
      const nextRetry = retryRef.current;
      setRetryCount(nextRetry);
      // V12: Use rawImageUrl for retry (direct Pollinations URL with new seed)
      const newUrl = getEnhancedImageUrl(rawImageUrl, nextRetry);
      console.log(`[SlideWithImage] Retrying image (attempt ${nextRetry}/${MAX_RETRIES})`);
      // V12: Faster retry — 500ms * attempt instead of 1000ms * attempt
      setTimeout(() => { setCurrentUrl(newUrl); }, 500 * nextRetry);
    } else {
      console.warn('[SlideWithImage] Image failed after retries');
      setImgError(true);
    }
  }, [isPollinations, rawImageUrl]);

  useEffect(() => {
    if (isPollinations && currentUrl && !imgLoaded && !imgError) {
      timeoutRef.current = setTimeout(() => {
        if (!imgLoaded) { handleError(); }
      }, POLLINATIONS_TIMEOUT_MS);
    }
    return () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); } };
  }, [currentUrl, imgLoaded, imgError, isPollinations, handleError]);

  const showImage = hasImage && !imgError;

  // V11: Slide-type specific gradient
  const gradientFn = DESIGN_TOKENS.slideGradients[slideType] || DESIGN_TOKENS.slideGradients.data;
  const bgGradient = gradientFn(accentColor);

  return (
    <div className="relative rounded-2xl flex flex-col"
      style={{ background: bgGradient, minHeight: '360px' }}>

      {/* Full background image */}
      {showImage && (
        <>
          {!imgLoaded && (
            <div className="absolute inset-0 z-[1] overflow-hidden">
              <div className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}15 25%, ${accentColor}08 50%, ${accentColor}15 75%, ${accentColor}08 100%)`,
                  backgroundSize: '400% 400%',
                  animation: 'shimmer 3s ease-in-out infinite',
                }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke={accentColor} strokeWidth="2" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {isPollinations && retryCount === 0 && (
                    <span className="text-[9px] font-medium" style={{ color: accentColor }}>{t.loadingImage}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentUrl}
            src={currentUrl || undefined}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0, opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.5s ease-in' }}
            loading="eager"
            onLoad={handleLoad}
            onError={handleError}
          />
          <div className="absolute inset-0" style={{
            zIndex: 1,
            background: `linear-gradient(180deg, rgba(11,14,20,0.05) 0%, rgba(11,14,20,${overlay * 0.4}) 25%, rgba(11,14,20,${overlay * 0.75}) 55%, rgba(11,14,20,0.9) 85%, rgba(11,14,20,0.97) 100%)`
          }} />
        </>
      )}

      {/* Decorative when no image — animated gradient fallback */}
      {(!hasImage || imgError) && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, ${accentColor} 0%, transparent 40%), radial-gradient(circle at 80% 70%, ${accentColor} 0%, transparent 40%)`,
          }} />
          {/* Animated accent glow */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(ellipse at 30% 40%, ${accentColor}12 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, ${accentColor}08 0%, transparent 50%)`,
            backgroundSize: '200% 200%',
            animation: 'gradientShift 8s ease-in-out infinite',
          }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${accentColor} 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, ${accentColor} 0px, transparent 1px, transparent 60px)`,
          }} />
        </div>
      )}

      {/* Content overlaid on image */}
      <div className="relative flex flex-col p-5 sm:p-7 flex-1" style={{ zIndex: 2 }}>
        {children}
      </div>

      {/* Color accent line at bottom */}
      <div className="relative h-[3px]" style={{ zIndex: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Empty slide fallback ──────────────────────────────────
export function EmptySlideFallback({ icon: Icon, text, locale }: { icon: any; text: string; locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl text-center"
      style={{ background: `linear-gradient(180deg, #0C1120 0%, ${DESIGN_TOKENS.bgDeep} 100%)`, minHeight: '320px' }}>
      <Icon size={32} style={{ color: DESIGN_TOKENS.textMuted, marginBottom: '12px' }} aria-hidden="true" />
      <p className="text-[14px]" style={{ color: DESIGN_TOKENS.textSymbol }}>{text}</p>
    </div>
  );
}
