'use client';

import { useState, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  duration?: number | null;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  duration,
  locale = 'ar',
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handlePlay() {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden group"
      style={{
        background: '#0f172a',
        border: '1px solid var(--border)',
        direction: locale === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {/* Video Header */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #EF4444, #F97316)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </div>
        <span className="text-[11px] font-bold text-white/90 truncate flex-1">{title}</span>
        {duration && (
          <span className="text-[10px] font-mono text-white/60">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Video Element */}
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl || undefined}
          className="w-full aspect-video"
          controls
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          {locale === 'ar'
            ? 'متصفحك لا يدعم تشغيل الفيديو'
            : 'Your browser does not support video playback'}
        </video>
      </div>
    </div>
  );
}
