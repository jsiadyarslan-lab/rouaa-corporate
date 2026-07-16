// ─── Parallax Hero Image ────────────────────────────────────────
// Adds a subtle parallax scroll effect to hero images using CSS transform
// V231: Uses NewsImage for gradient fallback when image fails
'use client';

import { useState, useEffect, useRef } from 'react';
import NewsImage from '@/components/rouaa/NewsImage';

interface ParallaxHeroImageProps {
  src: string;
  alt: string;
  category?: string;
  height?: string; // e.g. 'h-[280px] md:h-[380px] lg:h-[440px]'
}

export function ParallaxHeroImage({ src, alt, category, height = 'h-[280px] md:h-[380px] lg:h-[440px]' }: ParallaxHeroImageProps) {
  const [offsetY, setOffsetY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Only calculate parallax when the image is in or near the viewport
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        // Subtle parallax: move at 30% of scroll speed, max ±60px
        const raw = (rect.top / window.innerHeight) * 60;
        const clamped = Math.max(-60, Math.min(60, raw));
        setOffsetY(clamped);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${height} overflow-hidden`}>
      <NewsImage
        src={src}
        alt={alt}
        category={category}
        fill
        overlayOpacity={1}
        loading="eager"
      />
      {/* Parallax overlay — applies the transform on a separate layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${offsetY}px) scale(1.1)`,
          transition: 'transform 0.1s linear',
          willChange: 'transform',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </div>
  );
}
