// ─── Infographic Detail Client V16 ────────────────────────────
// V16: Auto-trigger image regeneration for slides missing images

'use client';

import InfographicViewer from '@/components/infographics/InfographicViewer';
import Link from 'next/link';
import { ArrowRight, Calendar, ArrowLeft, Share2, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DESIGN_TOKENS, hexToRgba } from '@/components/infographics/types';

interface InfographicDetailClientProps {
  infographic: any;
}

export default function InfographicDetailClient({ infographic }: InfographicDetailClientProps) {
  const [shareMsg, setShareMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenStatus, setRegenStatus] = useState<string | null>(null);

  // V5: Check for missing images and auto-trigger regeneration
  // Pollinations URLs ARE valid — don't trigger regeneration for them
  useEffect(() => {
    const slides = infographic.slides || [];
    const missingImages = slides.filter((s: any) => {
      const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
      if (isNoImageType) return false;
      const position = s.image_position ?? s.content?.image_position;
      if (!position) return false;
      const url = s.image_url || s.content?.image_url;
      // V5: Only truly missing/invalid URLs need regeneration
      // Pollinations URLs are valid and don't need fixing
      if (!url) return true;
      if (url.startsWith('https://')) return false; // All HTTPS URLs (including Pollinations) are valid
      if (url.startsWith('/api/infographic-image')) return false; // Local API URLs
      return false; // Default: assume valid
    });

    if (missingImages.length > 0 && !regenerating) {
      console.log(`[Infographic Detail] ${missingImages.length} slides missing images — triggering background regeneration`);
      triggerImageRegeneration();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerImageRegeneration = async () => {
    setRegenerating(true);
    setRegenStatus('جارٍ توليد الصور...');
    try {
      const res = await fetch('/api/infographics/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infographicId: infographic.id }),
      });
      const data = await res.json();
      if (data.success && data.generated > 0) {
        setRegenStatus(`تم توليد ${data.generated} صورة ${data.autoPublished ? '— تم النشر تلقائياً' : ''}`);
        // Reload the page to show new images if any were generated
        setTimeout(() => window.location.reload(), 2000);
      } else if (data.generated === 0) {
        setRegenStatus('لم يتم توليد صور جديدة');
        setTimeout(() => setRegenStatus(null), 3000);
      } else {
        setRegenStatus(null);
      }
    } catch {
      setRegenStatus(null);
    } finally {
      setRegenerating(false);
    }
  };

  const dateStr = new Date(infographic.publishedAt || infographic.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('تم نسخ الرابط!');
      setTimeout(() => setShareMsg(''), 2000);
    } catch {
      setShareMsg('فشل النسخ');
    }
  };

  return (
    <main className="min-h-screen" style={{ background: DESIGN_TOKENS.bgDeep }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Draft Banner */}
        {!infographic.isPublished && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-5"
            style={{
              background: hexToRgba(DESIGN_TOKENS.gold, 0.06),
              border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.15)}`,
            }}>
            <EyeOff size={16} style={{ color: DESIGN_TOKENS.gold }} aria-hidden="true" />
            <div className="flex-1">
              <span className="text-[12px] font-bold" style={{ color: DESIGN_TOKENS.gold }}>
                مسودة
              </span>
              <span className="text-[10px] ms-2" style={{ color: DESIGN_TOKENS.textMuted }}>
                هذا الإنفوغرافيك غير منشور بعد
              </span>
            </div>
            <Link href="/dashboard/infographics"
              className="text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all"
              style={{ background: hexToRgba(DESIGN_TOKENS.gold, 0.12), color: DESIGN_TOKENS.gold, border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.25)}` }}>
              لوحة التحكم
            </Link>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11px]" style={{ color: DESIGN_TOKENS.textMuted }}
          aria-label="التنقل التفصيلي">
          <Link href="/" className="transition-colors hover:underline" style={{ color: DESIGN_TOKENS.textMuted }}>الرئيسية</Link>
          <span aria-hidden="true" style={{ color: DESIGN_TOKENS.borderDefault }}>/</span>
          <Link href="/infographics" className="transition-colors hover:underline" style={{ color: DESIGN_TOKENS.textMuted }}>إنفوغرافيك</Link>
          <span aria-hidden="true" style={{ color: DESIGN_TOKENS.borderDefault }}>/</span>
          <span className="truncate max-w-[200px]" style={{ color: DESIGN_TOKENS.textSecondary }} aria-current="page">{infographic.title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1">
            <h1 className="text-[22px] sm:text-[28px] font-bold mb-2 leading-tight"
              style={{ color: DESIGN_TOKENS.textPrimary, fontFamily: DESIGN_TOKENS.fontTitle }}>
              {infographic.title}
            </h1>
            {infographic.subtitle && (
              <p className="text-[13px] mb-3 leading-relaxed"
                style={{ color: DESIGN_TOKENS.textSecondary, fontFamily: DESIGN_TOKENS.fontBody }}>
                {infographic.subtitle}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontBody }}>
                <Calendar size={11} aria-hidden="true" />
                {dateStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: DESIGN_TOKENS.bgCard, color: DESIGN_TOKENS.textSecondary, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}
              aria-label="مشاركة الرابط"
              title="مشاركة">
              <Share2 size={14} aria-hidden="true" />
            </button>
            {shareMsg && (
              <span className="text-[10px] font-semibold" style={{ color: DESIGN_TOKENS.success }} role="status">{shareMsg}</span>
            )}
          </div>
        </div>

        {/* Viewer */}
        <InfographicViewer
          slides={infographic.slides || []}
          category={infographic.category}
          publishedAt={infographic.publishedAt || infographic.createdAt}
        />

        {/* Image Regeneration Status */}
        {(regenerating || regenStatus) && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5"
            style={{
              background: hexToRgba(DESIGN_TOKENS.cyan || '#00BCD4', 0.06),
              border: `1px solid ${hexToRgba(DESIGN_TOKENS.cyan || '#00BCD4', 0.15)}`,
            }}>
            {regenerating ? (
              <Loader2 size={14} className="animate-spin" style={{ color: DESIGN_TOKENS.cyan || '#00BCD4' }} />
            ) : (
              <Sparkles size={14} style={{ color: DESIGN_TOKENS.cyan || '#00BCD4' }} />
            )}
            <span className="text-[12px] font-semibold" style={{ color: DESIGN_TOKENS.cyan || '#00BCD4' }}>
              {regenStatus || 'جارٍ توليد الصور...'}
            </span>
          </div>
        )}

        {/* Source link */}
        {infographic.sourceTitle && (
          <div className="mt-6 p-3.5 rounded-xl" style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}>
            <span className="text-[11px] font-semibold block mb-1.5" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontBody }}>المصدر الأصلي</span>
            {infographic.sourceType === 'news' && infographic.sourceId && (
              <Link href={`/news/${infographic.sourceId}`}
                className="flex items-center gap-2 text-[12px] font-semibold transition-colors"
                style={{ color: DESIGN_TOKENS.textSecondary }}>
                {infographic.sourceTitle}
                <ArrowLeft size={12} aria-hidden="true" />
              </Link>
            )}
            {infographic.sourceType === 'economic_report' && infographic.sourceId && (
              <Link href={`/reports/${infographic.sourceId}`}
                className="flex items-center gap-2 text-[12px] font-semibold transition-colors"
                style={{ color: DESIGN_TOKENS.textSecondary }}>
                {infographic.sourceTitle}
                <ArrowLeft size={12} aria-hidden="true" />
              </Link>
            )}
            {infographic.sourceType === 'market_analysis' && (
              <span className="text-[12px] font-semibold" style={{ color: DESIGN_TOKENS.textSecondary }}>
                {infographic.sourceTitle}
              </span>
            )}
          </div>
        )}

        {/* Back link */}
        <div className="mt-5">
          <Link href="/infographics"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
            style={{ color: DESIGN_TOKENS.textMuted }}>
            <ArrowRight size={12} aria-hidden="true" />
            العودة للإنفوغرافيك
          </Link>
        </div>
      </div>
    </main>
  );
}
