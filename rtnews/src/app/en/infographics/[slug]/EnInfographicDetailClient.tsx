// ─── English Infographic Detail Client V314 ────────────────────────
// English version of the infographic detail viewer

'use client';

import InfographicViewer from '@/components/infographics/InfographicViewer';
import Link from 'next/link';
import { ArrowLeft, Calendar, Share2, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DESIGN_TOKENS, hexToRgba } from '@/components/infographics/types';

interface EnInfographicDetailClientProps {
  infographic: any;
  locale?: 'en' | 'es' | 'fr' | 'tr';
}

const TEXT: Record<string, Record<string, string>> = {
  en: {
    draft: 'Draft',
    draftHint: 'This infographic is not published yet',
    dashboard: 'Dashboard',
    home: 'Home',
    infographics: 'Infographics',
    share: 'Share',
    linkCopied: 'Link copied!',
    copyFailed: 'Copy failed',
    originalSource: 'Original Source',
    backToInfographics: 'Back to Infographics',
    generatingImages: 'Generating images...',
  },
  es: {
    draft: 'Borrador',
    draftHint: 'Esta infografía aún no está publicada',
    dashboard: 'Panel',
    home: 'Inicio',
    infographics: 'Infografías',
    share: 'Compartir',
    linkCopied: '¡Enlace copiado!',
    copyFailed: 'Error al copiar',
    originalSource: 'Fuente Original',
    backToInfographics: 'Volver a Infografías',
    generatingImages: 'Generando imágenes...',
  },
  fr: {
    draft: 'Brouillon',
    draftHint: 'Cette infographie n\'est pas encore publiée',
    dashboard: 'Tableau de bord',
    home: 'Accueil',
    infographics: 'Infographies',
    share: 'Partager',
    linkCopied: 'Lien copié !',
    copyFailed: 'Échec de la copie',
    originalSource: 'Source Originale',
    backToInfographics: 'Retour aux Infographies',
    generatingImages: 'Génération d\'images...',
  },
  tr: {
    draft: 'Taslak',
    draftHint: 'Bu infografik henüz yayınlanmadı',
    dashboard: 'Kontrol Paneli',
    home: 'Ana Sayfa',
    infographics: 'İnfografikler',
    share: 'Paylaş',
    linkCopied: 'Bağlantı kopyalandı!',
    copyFailed: 'Kopyalama başarısız',
    originalSource: 'Orijinal Kaynak',
    backToInfographics: 'İnfografiklere Dön',
    generatingImages: 'Görseller oluşturuluyor...',
  },
};

export default function EnInfographicDetailClient({ infographic, locale = 'en' }: EnInfographicDetailClientProps) {
  const t = TEXT[locale] || TEXT.en;
  const [shareMsg, setShareMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenStatus, setRegenStatus] = useState<string | null>(null);

  // Check for missing images and auto-trigger regeneration
  useEffect(() => {
    const slides = infographic.slides || [];
    const missingImages = slides.filter((s: any) => {
      const isNoImageType = s.type === 'recommendations' || s.type === 'summary';
      if (isNoImageType) return false;
      const position = s.image_position ?? s.content?.image_position;
      if (!position) return false;
      const url = s.image_url || s.content?.image_url;
      if (!url) return true;
      if (url.startsWith('https://')) return false;
      if (url.startsWith('/api/infographic-image')) return false;
      return false;
    });

    if (missingImages.length > 0 && !regenerating) {
      console.log(`[EN Infographic Detail] ${missingImages.length} slides missing images — triggering background regeneration`);
      triggerImageRegeneration();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerImageRegeneration = async () => {
    setRegenerating(true);
    setRegenStatus('Generating images...');
    try {
      const res = await fetch('/api/infographics/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infographicId: infographic.id }),
      });
      const data = await res.json();
      if (data.success && data.generated > 0) {
        setRegenStatus(`${data.generated} images generated${data.autoPublished ? ' — auto-published' : ''}`);
        setTimeout(() => window.location.reload(), 2000);
      } else if (data.generated === 0) {
        setRegenStatus('No new images generated');
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

  const dateLocale = locale === 'en' ? 'en-US' : locale === 'tr' ? 'tr-TR' : locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'ar-SA';
  const dateStr = new Date(infographic.publishedAt || infographic.createdAt).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg(t.linkCopied);
      setTimeout(() => setShareMsg(''), 2000);
    } catch {
      setShareMsg(t.copyFailed);
    }
  };

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: DESIGN_TOKENS.bgDeep }}>
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
                {t.draft}
              </span>
              <span className="text-[10px] ms-2" style={{ color: DESIGN_TOKENS.textMuted }}>
                {t.draftHint}
              </span>
            </div>
            <Link href={`/dashboard/${locale}/infographics`}
              className="text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all"
              style={{ background: hexToRgba(DESIGN_TOKENS.gold, 0.12), color: DESIGN_TOKENS.gold, border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.25)}` }}>
              {t.dashboard}
            </Link>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11px]" style={{ color: DESIGN_TOKENS.textMuted }}
          aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="transition-colors hover:underline" style={{ color: DESIGN_TOKENS.textMuted }}>{t.home}</Link>
          <span aria-hidden="true" style={{ color: DESIGN_TOKENS.borderDefault }}>/</span>
          <Link href={`/${locale}/infographics`} className="transition-colors hover:underline" style={{ color: DESIGN_TOKENS.textMuted }}>{t.infographics}</Link>
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
              aria-label="Share link"
              title={t.share}>
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
          locale={locale}
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
              {regenStatus || t.generatingImages}
            </span>
          </div>
        )}

        {/* Source link */}
        {infographic.sourceTitle && (
          <div className="mt-6 p-3.5 rounded-xl" style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}>
            <span className="text-[11px] font-semibold block mb-1.5" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontBody }}>{t.originalSource}</span>
            {infographic.sourceType === 'news' && infographic.sourceId && (
              <Link href={`/${locale}/news/${infographic.sourceId}`}
                className="flex items-center gap-2 text-[12px] font-semibold transition-colors"
                style={{ color: DESIGN_TOKENS.textSecondary }}>
                {infographic.sourceTitle}
                <ArrowLeft size={12} aria-hidden="true" />
              </Link>
            )}
            {infographic.sourceType === 'economic_report' && infographic.sourceId && (
              <Link href={`/${locale}/reports/${infographic.sourceId}`}
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
          <Link href={`/${locale}/infographics`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
            style={{ color: DESIGN_TOKENS.textMuted }}>
            <ArrowLeft size={12} aria-hidden="true" />
            {t.backToInfographics}
          </Link>
        </div>
      </div>
    </main>
  );
}
