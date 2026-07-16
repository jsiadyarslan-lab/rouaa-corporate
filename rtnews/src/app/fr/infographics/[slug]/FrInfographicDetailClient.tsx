// ─── Client de détail d'infographie en français ────────────────────────
// Version française du visualiseur de détail d'infographie

'use client';

import InfographicViewer from '@/components/infographics/InfographicViewer';
import Link from 'next/link';
import { ArrowLeft, Calendar, Share2, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DESIGN_TOKENS, hexToRgba } from '@/components/infographics/types';

interface FrInfographicDetailClientProps {
  infographic: any;
}

export default function FrInfographicDetailClient({ infographic }: FrInfographicDetailClientProps) {
  const [shareMsg, setShareMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenStatus, setRegenStatus] = useState<string | null>(null);

  // Vérifier les images manquantes et déclencher la régénération automatique
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
      console.log(`[FR Infographic Detail] ${missingImages.length} diapositives sans images — déclenchement de la régénération en arrière-plan`);
      triggerImageRegeneration();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerImageRegeneration = async () => {
    setRegenerating(true);
    setRegenStatus('Génération des images...');
    try {
      const res = await fetch('/api/infographics/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infographicId: infographic.id }),
      });
      const data = await res.json();
      if (data.success && data.generated > 0) {
        setRegenStatus(`${data.generated} images générées${data.autoPublished ? ' — auto-publiées' : ''}`);
        setTimeout(() => window.location.reload(), 2000);
      } else if (data.generated === 0) {
        setRegenStatus('Aucune nouvelle image générée');
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

  const dateStr = new Date(infographic.publishedAt || infographic.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Lien copié !');
      setTimeout(() => setShareMsg(''), 2000);
    } catch {
      setShareMsg('Échec de la copie');
    }
  };

  return (
    <main className="min-h-screen" dir="ltr" style={{ background: DESIGN_TOKENS.bgDeep }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Bannière de brouillon */}
        {!infographic.isPublished && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-5"
            style={{
              background: hexToRgba(DESIGN_TOKENS.gold, 0.06),
              border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.15)}`,
            }}>
            <EyeOff size={16} style={{ color: DESIGN_TOKENS.gold }} aria-hidden="true" />
            <div className="flex-1">
              <span className="text-[12px] font-bold" style={{ color: DESIGN_TOKENS.gold }}>
                Brouillon
              </span>
              <span className="text-[10px] ms-2" style={{ color: DESIGN_TOKENS.textMuted }}>
                Cette infographie n&apos;est pas encore publiée
              </span>
            </div>
            <Link href="/dashboard/fr/infographics"
              className="text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all"
              style={{ background: hexToRgba(DESIGN_TOKENS.gold, 0.12), color: DESIGN_TOKENS.gold, border: `1px solid ${hexToRgba(DESIGN_TOKENS.gold, 0.25)}` }}>
              Tableau de bord
            </Link>
          </div>
        )}

        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-1.5 mb-5 text-[11px]" style={{ color: DESIGN_TOKENS.textMuted }}
          aria-label="Fil d'Ariane">
          <Link href="/fr" className="transition-colors hover:underline" style={{ color: DESIGN_TOKENS.textMuted }}>Accueil</Link>
          <span aria-hidden="true" style={{ color: DESIGN_TOKENS.borderDefault }}>/</span>
          <Link href="/fr/infographics" className="transition-colors hover:underline" style={{ color: DESIGN_TOKENS.textMuted }}>Infographies</Link>
          <span aria-hidden="true" style={{ color: DESIGN_TOKENS.borderDefault }}>/</span>
          <span className="truncate max-w-[200px]" style={{ color: DESIGN_TOKENS.textSecondary }} aria-current="page">{infographic.title}</span>
        </nav>

        {/* En-tête */}
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
              aria-label="Partager le lien"
              title="Partager">
              <Share2 size={14} aria-hidden="true" />
            </button>
            {shareMsg && (
              <span className="text-[10px] font-semibold" style={{ color: DESIGN_TOKENS.success }} role="status">{shareMsg}</span>
            )}
          </div>
        </div>

        {/* Visualiseur */}
        <InfographicViewer
          slides={infographic.slides || []}
          category={infographic.category}
          locale={"fr" as "ar" | "en"}
          publishedAt={infographic.publishedAt || infographic.createdAt}
        />

        {/* Statut de régénération des images */}
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
              {regenStatus || 'Génération des images...'}
            </span>
          </div>
        )}

        {/* Lien source */}
        {infographic.sourceTitle && (
          <div className="mt-6 p-3.5 rounded-xl" style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}>
            <span className="text-[11px] font-semibold block mb-1.5" style={{ color: DESIGN_TOKENS.textMuted, fontFamily: DESIGN_TOKENS.fontBody }}>Source originale</span>
            {infographic.sourceType === 'news' && infographic.sourceId && (
              <Link href={`/fr/news/${infographic.sourceId}`}
                className="flex items-center gap-2 text-[12px] font-semibold transition-colors"
                style={{ color: DESIGN_TOKENS.textSecondary }}>
                {infographic.sourceTitle}
                <ArrowLeft size={12} aria-hidden="true" />
              </Link>
            )}
            {infographic.sourceType === 'economic_report' && infographic.sourceId && (
              <Link href={`/fr/reports/${infographic.sourceId}`}
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

        {/* Lien retour */}
        <div className="mt-5">
          <Link href="/fr/infographics"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
            style={{ color: DESIGN_TOKENS.textMuted }}>
            <ArrowLeft size={12} aria-hidden="true" />
            Retour aux infographies
          </Link>
        </div>
      </div>
    </main>
  );
}
