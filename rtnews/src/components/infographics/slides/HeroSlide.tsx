// ─── Hero Slide V213 — مطابق للتصميم المرجعي ────────────────
// V213: Added locale prop for English/Arabic UI text translation
// تصميم Bloomberg الهادئ: رقم رفيف + مقياس SVG + شبكة مؤشرات + شريط سريع + تذييل

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { InfographicSlide, COLOR_MAP, STATUS_COLORS, getCategoryColor, DataIndicator, DESIGN_TOKENS, getDirectionColor } from '../types';
import { getProxiedImageUrl, getEnhancedImageUrl, isPollinationsUrl } from '@/lib/image-proxy';
import * as LucideIcons from 'lucide-react';

interface HeroSlideProps {
  slide: any, InfographicSlide;
  category?: string;
  allSlides?: InfographicSlide[];
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
  publishedAt?: string | Date;
}

const MAX_RETRIES = 2;
const POLLINATIONS_TIMEOUT_MS = 15000;

// V213: Translation map
const HERO_I18N = {
  ar: {
    confidence: 'مستوى الثقة',
    quickDecision: 'قرار سريع:',
    watch: 'راقب:',
    sourcePrefix: 'رؤى / استراتيجي / ',
    footerBrand: 'رؤى',
    footerTagline: 'للأخبار المالية',
    disclaimer: 'لأغراض إعلامية فقط — ليس نصيحة استثمارية',
    localeDate: 'ar-EG',
  },
  en: {
    confidence: 'Confidence Level',
    quickDecision: 'Quick Decision:',
    watch: 'Watch:',
    sourcePrefix: 'Rouaa / Strategic / ',
    footerBrand: 'Rouaa',
    footerTagline: 'Financial News',
    disclaimer: 'For informational purposes only — not investment advice',
    localeDate: 'en-US',
  },
  es: {
    confidence: 'Confidence Level',
    quickDecision: 'Quick Decision:',
    watch: 'Watch:',
    sourcePrefix: 'Rouaa / Strategic / ',
    footerBrand: 'Rouaa',
    footerTagline: 'Financial News',
    disclaimer: 'For informational purposes only — not investment advice',
    localeDate: 'en-US',
  },
  fr: {
    confidence: 'Confidence Level',
    quickDecision: 'Quick Decision:',
    watch: 'Watch:',
    sourcePrefix: 'Rouaa / Strategic / ',
    footerBrand: 'Rouaa',
    footerTagline: 'Financial News',
    disclaimer: 'For informational purposes only — not investment advice',
    localeDate: 'en-US',
  },
  tr: {
    confidence: 'Confidence Level',
    quickDecision: 'Quick Decision:',
    watch: 'Watch:',
    sourcePrefix: 'Rouaa / Strategic / ',
    footerBrand: 'Rouaa',
    footerTagline: 'Financial News',
    disclaimer: 'For informational purposes only — not investment advice',
    localeDate: 'en-US',
  },
};

export default function HeroSlide({ slide, category, allSlides, locale = 'ar', publishedAt }: HeroSlideProps) {
  const t = HERO_I18N[locale];
  const isRtl = locale === 'ar';

  const heroNumber = slide.content.heroNumber || '';
  const heroUnit = slide.content.heroUnit || '';
  const tag = slide.content.tag || category || '';
  const status = slide.content.status || '';
  const colorName = (slide as any).content.color || slide.color || '';
  const confidence = (slide as any).confidence || (slide.content as any).confidence || null;

  const mainColor = COLOR_MAP[colorName] || slide.accentColor || getCategoryColor(category);
  const statusColor = STATUS_COLORS[status] || mainColor;

  // Background image
  const rawImageUrl = (slide as any).image_url || slide.imageUrl || (slide as any).content?.image_url;
  const unsplashQuery = (slide as any).unsplash_query || (slide as any).content?.unsplash_query;
  const imageUrl = getProxiedImageUrl(rawImageUrl, unsplashQuery || undefined);

  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(imageUrl);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);

  const isPollinations = isPollinationsUrl(rawImageUrl);

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
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  const handleError = useCallback(() => {
    if (isPollinations && retryRef.current < MAX_RETRIES) {
      retryRef.current += 1;
      const nextRetry = retryRef.current;
      setRetryCount(nextRetry);
      const newUrl = getEnhancedImageUrl(rawImageUrl, nextRetry);
      setTimeout(() => { setCurrentUrl(newUrl); }, 500 * nextRetry);
    } else {
      setImgError(true);
    }
  }, [isPollinations, rawImageUrl]);

  useEffect(() => {
    if (isPollinations && currentUrl && !imgLoaded && !imgError) {
      timeoutRef.current = setTimeout(() => { if (!imgLoaded) handleError(); }, POLLINATIONS_TIMEOUT_MS);
    }
    return () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); } };
  }, [currentUrl, imgLoaded, imgError, isPollinations, handleError]);

  const showImage = imageUrl && !imgError;

  // Extract key indicators from data slide
  const dataSlide = (allSlides || []).find(s => s.type === 'data');
  const keyIndicators: DataIndicator[] = dataSlide?.content?.indicators || [];
  const topIndicators = keyIndicators.slice(0, 3);

  // Extract quick bar data from recommendations slide
  const recsSlide = (allSlides || []).find(s => s.type === 'recommendations');
  const recSummary: string[] = recsSlide?.content?.summary || [];

  // Gauge SVG calculation
  const gaugeValue = confidence ?? 65;
  const circumference = 2 * Math.PI * 32; // r=32
  const dashOffset = circumference - (gaugeValue / 100) * circumference;

  // Confidence color for the gradient bar
  const confGradientColor = gaugeValue < 30 ? '#EF4444' : gaugeValue <= 70 ? '#F59E0B' : '#10B981';

  // Direction to color for metrics
  const dirToColor = (dir: string) => dir === 'up' ? '#10B981' : dir === 'down' ? '#EF4444' : '#3B82F6';

  // Tag text: combine tag + status
  const tagText = [tag, status].filter(Boolean).join(' — ');

  // Source line — use the infographic's publishedAt/createdAt date, NOT today's date
  const dateForDisplay = publishedAt ? new Date(publishedAt) : new Date();
  const dateStr = dateForDisplay.toLocaleDateString(t.localeDate, { day: 'numeric', month: 'long', year: 'numeric' });
  const sourceText = `${t.sourcePrefix}${dateStr}`;

  return (
    <div style={{
      background: '#0B0E17',
      borderRadius: '16px',
      overflow: 'hidden',
      fontFamily: locale === 'en'
        ? "var(--font-jetbrains-mono), 'Inter', 'JetBrains Mono', sans-serif"
        : "var(--font-readex-pro), 'Readex Pro', 'Cairo', sans-serif",
      direction: isRtl ? 'rtl' : 'ltr',
    }}>
      {/* ─── Main Hero Area ─── */}
      <div style={{
        position: 'relative',
        minHeight: '420px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        background: '#0B0E17',
      }}>
        {/* Grid pattern overlay */}
        {!showImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px)
            `,
            pointerEvents: 'none',
          }} />
        )}

        {/* Background image with overlay */}
        {showImage && (
          <>
            {!imgLoaded && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden',
                background: `linear-gradient(135deg, ${mainColor}08 0%, ${mainColor}15 50%, ${mainColor}08 100%)`,
                backgroundSize: '400% 400%',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', opacity: 0.4,
                }}>
                  <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke={mainColor} strokeWidth="2" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke={mainColor} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            )}
            <img
              key={currentUrl}
              src={currentUrl || undefined}
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', zIndex: 0, opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease-in',
              }}
              loading="eager"
              onLoad={handleLoad}
              onError={handleError}
            />
            {/* Bottom gradient overlay on image */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
              background: 'linear-gradient(to top, #0B0E17, transparent)',
              zIndex: 1,
            }} />
            {/* Top gradient for readability */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
              background: 'linear-gradient(to bottom, rgba(11,14,23,0.7), transparent)',
              zIndex: 1,
            }} />
          </>
        )}

        {/* ─── Top Row: Tag + Source ─── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2,
        }}>
          {tagText && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              padding: '5px 14px',
              borderRadius: '20px',
              background: showImage ? 'rgba(0,0,0,0.4)' : `${mainColor}1F`,
              color: showImage ? '#fff' : mainColor,
              border: `0.5px solid ${showImage ? 'rgba(255,255,255,0.15)' : `${mainColor}4D`}`,
              backdropFilter: showImage ? 'blur(4px)' : undefined,
            }}>
              {/* Blinking dot */}
              <span style={{
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: mainColor,
                display: 'inline-block',
                animation: 'heroBlink 1.8s ease-in-out infinite',
              }} />
              {tagText}
            </div>
          )}
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.28)',
          }}>
            {sourceText}
          </div>
        </div>

        {/* ─── Number Area ─── */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          margin: '8px 0',
        }}>
          {/* Gauge + Big Number */}
          {(heroNumber || confidence != null) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '12px',
            }}>
              {/* SVG Gauge Ring */}
              <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke={showImage ? 'rgba(255,255,255,0.08)' : `${mainColor}1F`}
                    strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke={mainColor}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round" />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 500,
                  color: mainColor,
                  fontFamily: "'Inter', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {heroNumber || `${gaugeValue}%`}
                </div>
              </div>

              {/* Number Block */}
              {heroNumber && (
                <div>
                  <div style={{
                    fontSize: '64px',
                    fontWeight: 300,
                    color: mainColor,
                    lineHeight: 1,
                    letterSpacing: '-3px',
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: "'Inter', 'JetBrains Mono', monospace",
                    textShadow: `0 0 24px ${mainColor}25`,
                  }}>
                    {heroNumber}
                  </div>
                  {heroUnit && (
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: showImage ? 'rgba(255,255,255,0.55)' : `${mainColor}A6`,
                      marginTop: '4px',
                    }}>
                      {heroUnit}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: '18px',
            fontWeight: 500,
            color: '#fff',
            lineHeight: 1.4,
            marginBottom: '6px',
            position: 'relative',
            zIndex: 2,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            {slide.title}
          </div>

          {/* Subtitle */}
          {slide.subtitle && (
            <div style={{
              fontSize: '12px',
              fontWeight: 400,
              color: showImage ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.42)',
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 2,
              maxWidth: '480px',
            }}>
              {slide.subtitle}
            </div>
          )}

          {/* Confidence Row */}
          {confidence != null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '16px',
              position: 'relative',
              zIndex: 2,
            }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                {t.confidence}
              </span>
              <div style={{
                flex: 1, height: '3px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(confidence, 100)}%`,
                  background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                  borderRadius: '2px',
                  transition: 'width 0.7s ease',
                }} />
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 500,
                color: '#3B82F6', flexShrink: 0,
                fontFamily: "'Inter', monospace",
                fontVariantNumeric: 'tabular-nums',
              }}>
                {confidence}%
              </span>
            </div>
          )}
        </div>

        {/* ─── Metrics Grid ─── */}
        {topIndicators.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            marginTop: '20px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
          }}>
            {topIndicators.map((ind, i) => {
              const valColor = dirToColor(ind.direction);
              return (
                <div key={i} style={{
                  background: showImage ? 'rgba(14,20,32,0.85)' : '#0E1420',
                  padding: '14px 16px',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.32)',
                    marginBottom: '5px',
                    fontWeight: 400,
                  }}>
                    {ind.name}
                  </div>
                  <div style={{
                    fontSize: '19px',
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                    color: valColor,
                    fontFamily: "'Inter', monospace",
                  }}>
                    {ind.value}
                  </div>
                  {ind.reason && (
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.28)',
                      marginTop: '3px',
                    }}>
                      {ind.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Quick Bar ─── */}
      {recSummary.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#090C14',
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
          position: 'relative',
          zIndex: 2,
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          {recSummary.slice(0, 2).map((text, i) => {
            const icon = i === 0 ? LucideIcons.Clock : LucideIcons.Eye;
            const label = i === 0 ? t.quickDecision : t.watch;
            const IconComp = icon;
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.35)',
              }}>
                <IconComp size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
                {label}
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Footer Row ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#0B0E17',
        borderTop: '0.5px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
          {t.footerBrand} <span style={{ color: '#3B82F6' }}>{t.footerTagline}</span>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)' }}>
          {t.disclaimer}
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes heroBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
