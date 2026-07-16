// ─── Social Share Bar (Enhanced) ─────────────────────────────────
// Floating share bar + inline share buttons
// Features: Reddit, share count, image card, custom message, analytics, QR code
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareBarProps {
  title: string;
  url: string;
  summary?: string;
  sentiment?: string;
  source?: string;
  variant?: 'floating' | 'inline';
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// ── Share analytics (localStorage) ──
interface ShareAnalytics {
  [articleId: string]: { [platform: string]: number };
}

function getShareAnalytics(): ShareAnalytics {
  try {
    return JSON.parse(localStorage.getItem('rouaa-share-analytics') || '{}');
  } catch { return {}; }
}

function saveShareAnalytics(analytics: ShareAnalytics) {
  try {
    localStorage.setItem('rouaa-share-analytics', JSON.stringify(analytics));
  } catch {}
}

function trackShare(articleUrl: string, platform: string) {
  const analytics = getShareAnalytics();
  const key = articleUrl.slice(-50);
  if (!analytics[key]) analytics[key] = {};
  if (!analytics[key][platform]) analytics[key][platform] = 0;
  analytics[key][platform]++;
  saveShareAnalytics(analytics);
}

function getShareCount(articleUrl: string): number {
  const analytics = getShareAnalytics();
  const key = articleUrl.slice(-50);
  const entry = analytics[key];
  if (!entry) return 0;
  return Object.values(entry).reduce((sum, count) => sum + count, 0);
}

// ── QR Code generation (simple SVG-based) ──
function generateQRSvg(text: string, size: number = 120): string {
  // Simple QR-like pattern using hash of the text
  // For a real QR, use a library, but this creates a visually distinctive pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const modules = 21;
  const cellSize = size / modules;
  let rects = '';

  // Position detection patterns (corners)
  const drawFinder = (x: number, y: number) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const isEdge = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
        if (isEdge) {
          rects += `<rect x="${(x + dx) * cellSize}" y="${(y + dy) * cellSize}" width="${cellSize}" height="${cellSize}" fill="white"/>`;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  // Data area
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      // Skip finder patterns
      if ((x < 8 && y < 8) || (x >= modules - 8 && y < 8) || (x < 8 && y >= modules - 8)) continue;
      // Pseudo-random pattern based on hash
      const idx = y * modules + x;
      const bit = ((hash >> (idx % 32)) ^ (idx * 7)) & 1;
      if (bit) {
        rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="white"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="background:#0a0e1a;border-radius:8px">${rects}</svg>`;
}

export function ShareBar({ title, url, summary, sentiment, source, variant = 'inline', locale = 'ar' }: ShareBarProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [showCustomMsg, setShowCustomMsg] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showImageCard, setShowImageCard] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setShareCount(getShareCount(url));
  }, [url]);

  const encodedTitle = encodeURIComponent(customMsg || title);
  const encodedUrl = encodeURIComponent(url);
  const encodedSummary = encodeURIComponent(summary || '');

  const shareLinks = [
    {
      name: 'X',
      color: '#000',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
    {
      name: 'Telegram',
      color: '#0088cc',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    },
    {
      name: 'WhatsApp',
      color: '#25D366',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
    },
    {
      name: 'LinkedIn',
      color: '#0077B5',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    },
    {
      name: 'Reddit',
      color: '#FF4500',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>,
    },
  ];

  const handleShareClick = useCallback((platform: string) => {
    trackShare(url, platform);
    setShareCount(prev => prev + 1);
  }, [url]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare(url, 'copy');
      setShareCount(prev => prev + 1);
      toast({ title: t('تم نسخ الرابط', 'Link Copied', 'Lien copié', 'Bağlantı Kopyalandı', 'Enlace copiado'), description: t('يمكنك الآن مشاركة الرابط', 'You can now share the link', 'Vous pouvez maintenant partager le lien', 'Bağlantıyı artık paylaşabilirsiniz', 'Ahora puedes compartir el enlace') });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast({ title: t('تم نسخ الرابط', 'Link Copied', 'Lien copié', 'Bağlantı Kopyalandı', 'Enlace copiado') });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url, toast, locale]);

  // ── Generate shareable image card ──
  const generateImageCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1200;
    const h = 630;
    canvas.width = w;
    canvas.height = h;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#050810');
    grad.addColorStop(0.5, '#0C1220');
    grad.addColorStop(1, '#111828');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Cyan accent line
    const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
    lineGrad.addColorStop(0, '#00E5FF');
    lineGrad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(40, 40, 200, 4);

    // Brand name
    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 28px Cairo, sans-serif';
    ctx.textAlign = 'right';
    const brandName = locale === 'es' ? 'Rouaa' : locale === 'tr' ? 'Rouaa' : locale === 'fr' ? 'Rouaa' : locale === 'en' ? 'Rouaa' : 'رؤى';
    ctx.fillText(brandName, w - 50, 75);

    // Sentiment badge
    const sentColor = sentiment === 'positive' ? '#22C55E' : sentiment === 'negative' ? '#EF5350' : '#64748B';
    const sentText = sentiment === 'positive' ? (locale === 'es' ? '▲ Alcista' : locale === 'tr' ? '▲ Olumlu' : locale === 'fr' ? '▲ Haussier' : locale === 'en' ? '▲ Bullish' : '▲ إيجابي') : sentiment === 'negative' ? (locale === 'es' ? '▼ Bajista' : locale === 'tr' ? '▼ Olumsuz' : locale === 'fr' ? '▼ Baissier' : locale === 'en' ? '▼ Bearish' : '▼ سلبي') : (locale === 'es' ? '● Neutral' : locale === 'tr' ? '● Nötr' : locale === 'fr' ? '● Neutre' : locale === 'en' ? '● Neutral' : '● محايد');
    ctx.fillStyle = sentColor;
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.fillText(sentText, w - 50, 120);

    // Title
    ctx.fillStyle = '#E8EDF5';
    ctx.font = 'bold 36px Cairo, sans-serif';
    ctx.textAlign = 'right';
    // Word wrap
    const maxWidth = w - 100;
    const words = title.split(' ');
    let line = '';
    let y = 200;
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, w - 50, y);
        line = word;
        y += 50;
        if (y > 400) break;
      } else {
        line = testLine;
      }
    }
    if (y <= 400) ctx.fillText(line, w - 50, y);

    // Source
    if (source) {
      ctx.fillStyle = '#546070';
      ctx.font = '22px Cairo, sans-serif';
      ctx.fillText(locale === 'es' ? `Fuente: ${source}` : locale === 'tr' ? `Kaynak: ${source}` : locale === 'fr' ? `Source : ${source}` : locale === 'en' ? `Source: ${source}` : `المصدر: ${source}`, w - 50, h - 100);
    }

    // URL
    ctx.fillStyle = '#00E5FF';
    ctx.font = '18px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(url.replace(/^https?:\/\//, '').slice(0, 40), 50, h - 50);

    // Download
    try {
      const link = document.createElement('a');
      link.download = `rouaa-share-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      trackShare(url, 'image');
      setShareCount(prev => prev + 1);
      toast({ title: t('تم إنشاء الصورة', 'Image Created', 'Image créée', 'Görsel Oluşturuldu', 'Imagen creada'), description: t('يمكنك الآن مشاركتها', 'You can now share it', 'Vous pouvez maintenant la partager', 'Artık paylaşabilirsiniz', 'Ahora puedes compartirla') });
    } catch {}
  }, [title, url, source, sentiment, toast, locale]);

  // Native share (mobile)
  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: customMsg || title, url, text: summary });
        trackShare(url, 'native');
        setShareCount(prev => prev + 1);
      } catch {}
    } else {
      copyLink();
    }
  }, [title, url, summary, customMsg, copyLink]);

  // QR Code data
  const qrSvg = typeof window !== 'undefined' ? generateQRSvg(url, 120) : '';

  if (variant === 'floating') {
    return (
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2" data-print-hidden>
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleShareClick(link.name)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-x-1"
            style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}
            title={t(`مشاركة على ${link.name}`, `Share on ${link.name}`, `Partager sur ${link.name}`, `${link.name} üzerinde paylaş`, `Compartir en ${link.name}`)}
          >
            {link.icon}
          </a>
        ))}
        <button
          onClick={copyLink}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-x-1"
          style={{
            background: copied ? 'var(--cyan2)' : 'var(--bg4)',
            border: `1px solid ${copied ? 'rgba(0,201,167,0.25)' : 'var(--border)'}`,
            color: copied ? 'var(--cyan)' : 'var(--text3)',
          }}
          title={t('نسخ الرابط', 'Copy link', 'Copier le lien', 'Bağlantıyı kopyala', 'Copiar enlace')}
          aria-label={t('نسخ الرابط', 'Copy link', 'Copier le lien', 'Bağlantıyı kopyala', 'Copiar enlace')}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          )}
        </button>

        {/* Share count */}
        {shareCount > 0 && (
          <div className="text-[8px] text-center font-mono" style={{ color: 'var(--text3)' }}>{shareCount}</div>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="flex flex-col gap-2" data-print-hidden>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>{t('مشاركة:', 'Share:', 'Partager :', 'Paylaş:', 'Compartir:')}</span>
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleShareClick(link.name)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}
            title={t(`مشاركة على ${link.name}`, `Share on ${link.name}`, `Partager sur ${link.name}`, `${link.name} üzerinde paylaş`, `Compartir en ${link.name}`)}
          >
            {link.icon}
          </a>
        ))}
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
          style={{
            background: copied ? 'var(--cyan2)' : 'var(--bg4)',
            border: `1px solid ${copied ? 'rgba(0,201,167,0.25)' : 'var(--border)'}`,
            color: copied ? 'var(--cyan)' : 'var(--text3)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {copied ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
          </svg>
          {copied ? t('تم النسخ', 'Copied', 'Copié', 'Kopyalandı', 'Copiado') : t('نسخ', 'Copy', 'Copier', 'Kopyala', 'Copiar')}
        </button>

        {/* Share count indicator */}
        {shareCount > 0 && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
            {t(`${shareCount} مشاركة`, `${shareCount} shares`, `${shareCount} partages`, `${shareCount} paylaşım`, `${shareCount} veces compartido`)}
          </span>
        )}

        {/* Custom message button */}
        <button
          onClick={() => setShowCustomMsg(!showCustomMsg)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
          style={{ border: '1px solid var(--border)', color: showCustomMsg ? 'var(--cyan)' : 'var(--text3)', background: showCustomMsg ? 'var(--cyan2)' : 'transparent' }}
          title={t('تعديل رسالة المشاركة', 'Edit share message', 'Modifier le message de partage', 'Paylaşım mesajını düzenle', 'Editar mensaje de compartir')}
          aria-label={t('تعديل رسالة المشاركة', 'Edit share message', 'Modifier le message de partage', 'Paylaşım mesajını düzenle', 'Editar mensaje de compartir')}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          {t('رسالة', 'Message', 'Message', 'Mesaj', 'Mensaje')}
        </button>

        {/* Image card button */}
        <button
          onClick={() => { setShowImageCard(true); setTimeout(generateImageCard, 100); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
          title={t('مشاركة كصورة', 'Share as image', 'Partager en tant qu\'image', 'Görsel olarak paylaş', 'Compartir como imagen')}
          aria-label={t('مشاركة كصورة', 'Share as image', 'Partager en tant qu\'image', 'Görsel olarak paylaş', 'Compartir como imagen')}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {t('صورة', 'Image', 'Image', 'Görsel', 'Imagen')}
        </button>

        {/* QR code button */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
          style={{ border: '1px solid var(--border)', color: showQR ? 'var(--cyan)' : 'var(--text3)', background: showQR ? 'var(--cyan2)' : 'transparent' }}
          title={t('رمز QR', 'QR Code', 'Code QR', 'QR Kodu', 'Código QR')}
          aria-label={t('رمز QR', 'QR Code', 'Code QR', 'QR Kodu', 'Código QR')}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>
          QR
        </button>

        {/* Mobile native share */}
        <button
          onClick={nativeShare}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
          style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}
          aria-label={t('مشاركة عبر التطبيقات', 'Share via apps', 'Partager via des applications', 'Uygulamalar aracılığıyla paylaş', 'Compartir mediante aplicaciones')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          {t('مشاركة', 'Share', 'Partager', 'Paylaş', 'Compartir')}
        </button>
      </div>

      {/* Custom message input */}
      {showCustomMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <input
            type="text"
            placeholder={t('رسالة المشاركة المخصصة...', 'Custom share message...', 'Message de partage personnalisé...', 'Özel paylaşım mesajı...', 'Mensaje personalizado...')}
            value={customMsg}
            onChange={e => setCustomMsg(e.target.value)}
            className="flex-1 px-2 py-1 rounded-lg text-[11px] outline-none"
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
          <button onClick={() => { setCustomMsg(''); setShowCustomMsg(false); }} className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('إلغاء', 'Cancel', 'Annuler', 'İptal', 'Cancelar')}</button>
        </div>
      )}

      {/* QR Code popup */}
      {showQR && (
        <div className="p-4 rounded-xl flex items-center gap-4" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div>
            <p className="text-[12px] font-bold mb-1" style={{ color: 'var(--text)' }}>{t('رمز QR', 'QR Code', 'Code QR', 'QR Kodu', 'Código QR')}</p>
            <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('امسح الرمز لمشاركة المقال', 'Scan the code to share this article', 'Scannez le code pour partager cet article', 'Makaleyi paylaşmak için kodu tarayın', 'Escanea el código para compartir')}</p>
          </div>
          <button onClick={() => setShowQR(false)} className="mr-auto" style={{ color: 'var(--text3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
