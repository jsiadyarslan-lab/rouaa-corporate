// ─── Comments Section Component (Enhanced) ─────────────────────
// Full comment system: list, add, reply, upvote, downvote, sort, search, report, expert badge
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type Comment, type CommentSortOption } from '@/lib/comments.types';

interface CommentsSectionProps {
  newsId: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// ── Arabic relative time formatter ──
function formatRelativeTime(dateStr: string, locale: 'ar' | 'en' | 'fr' | 'tr' | 'es' = 'ar'): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);

    if (locale === 'es') {
      if (diffSec < 60) return 'Ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      if (diffHour < 24) return `hace ${diffHour}h`;
      if (diffDay === 1) return 'Ayer';
      if (diffDay < 7) return `hace ${diffDay}d`;
      if (diffWeek < 4) return `hace ${diffWeek}sem`;
      if (diffMonth < 12) return `hace ${diffMonth}meses`;
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    if (locale === 'tr') {
      if (diffSec < 60) return 'şimdi';
      if (diffMin < 60) return `${diffMin} dakika önce`;
      if (diffHour < 24) return `${diffHour} saat önce`;
      if (diffDay === 1) return 'Dün';
      if (diffDay < 7) return `${diffDay} gün önce`;
      if (diffWeek < 4) return `${diffWeek} hafta önce`;
      if (diffMonth < 12) return `${diffMonth} ay önce`;
      return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    if (locale === 'fr') {
      if (diffSec < 60) return 'maintenant';
      if (diffMin < 60) return `il y a ${diffMin} min`;
      if (diffHour < 24) return `il y a ${diffHour}h`;
      if (diffDay === 1) return 'Hier';
      if (diffDay < 7) return `il y a ${diffDay}j`;
      if (diffWeek < 4) return `il y a ${diffWeek} sem.`;
      if (diffMonth < 12) return `il y a ${diffMonth} mois`;
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    if (locale === 'en') {
      if (diffSec < 60) return 'now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;
      if (diffWeek < 4) return `${diffWeek}w ago`;
      if (diffMonth < 12) return `${diffMonth}mo ago`;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    if (diffSec < 60) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} ${diffMin === 1 ? 'دقيقة' : diffMin === 2 ? 'دقيقتين' : diffMin <= 10 ? 'دقائق' : 'دقيقة'}`;
    if (diffHour < 24) return `منذ ${diffHour} ${diffHour === 1 ? 'ساعة' : diffHour === 2 ? 'ساعتين' : diffHour <= 10 ? 'ساعات' : 'ساعة'}`;
    if (diffDay === 1) return 'أمس';
    if (diffDay < 7) return `منذ ${diffDay} ${diffDay <= 10 ? 'أيام' : 'يوم'}`;
    if (diffWeek < 4) return `منذ ${diffWeek} ${diffWeek === 1 ? 'أسبوع' : diffWeek === 2 ? 'أسبوعين' : 'أسبوع'}`;
    if (diffMonth < 12) return `منذ ${diffMonth} ${diffMonth === 1 ? 'شهر' : diffMonth === 2 ? 'شهرين' : 'أشهر'}`;
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ── Expert names list (configurable) ──
const EXPERT_NAMES = ['خبير مالي', 'محلل اقتصادي', 'مستشار استثماري', 'محلل فني', 'خبير أسواق', 'Finansal Uzman', 'Ekonomi Analisti', 'Yatırım Danışmanı', 'Teknik Analist', 'Piyasa Uzmanı', 'Experto Financiero'];

function CommentItem({
  comment,
  newsId,
  onReplyAdded,
  depth = 0,
  locale = 'ar',
}: {
  comment: Comment;
  newsId: string;
  onReplyAdded: () => void;
  depth?: number;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}) {
  const { toast } = useToast();
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyName, setReplyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

  const isExpert = comment.isExpert || EXPERT_NAMES.some(n => comment.authorName.includes(n));
  const voteScore = (comment.upvotes || 0) - (comment.downvotes || 0);

  const handleVote = useCallback(async (action: 'upvote' | 'downvote') => {
    try {
      await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id, action }),
      });
      onReplyAdded();
    } catch {}
  }, [comment.id, onReplyAdded]);

  const handleReport = useCallback(async () => {
    try {
      await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id, action: 'report' }),
      });
      setShowReportConfirm(false);
      toast({ title: t('تم الإبلاغ', 'Reported', 'Signalé', 'Bildirildi', 'Reportado'), description: t('شكراً لمساعدتنا في الحفاظ على جودة النقاش', 'Thanks for helping maintain discussion quality', 'Merci de nous aider à maintenir la qualité de la discussion', 'Tartışma kalitesini korumamıza yardımcı olduğunuz için teşekkürler', 'Gracias por ayudarnos a mantener la calidad de la discusión') });
      onReplyAdded();
    } catch {}
  }, [comment.id, onReplyAdded, toast]);

  const handleSubmitReply = useCallback(async () => {
    if (!replyText.trim() || !replyName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId, content: replyText, authorName: replyName, parentId: comment.id }),
      });
      if (res.ok) {
        setReplyText('');
        setReplyName('');
        setShowReplyForm(false);
        onReplyAdded();
        toast({ title: t('تم إرسال الرد', 'Reply Sent', 'Réponse envoyée', 'Yanıt Gönderildi', 'Respuesta enviada') });
      } else {
        const data = await res.json();
        toast({ title: t('خطأ', 'Error', 'Erreur', 'Hata', 'Error'), description: data.error || t('فشل إرسال الرد', 'Failed to send reply', 'Échec de l\'envoi de la réponse', 'Yanıt gönderilemedi', 'Error al enviar respuesta'), variant: 'destructive' });
      }
    } catch {}
    setSubmitting(false);
  }, [newsId, replyText, replyName, comment.id, onReplyAdded, toast]);

  // Don't show heavily reported comments
  if ((comment.reports || 0) >= 5) {
    return (
      <div className="mb-4 p-4 rounded-xl text-center" style={{ background: 'var(--bg4)', border: '1px solid var(--border)', opacity: 0.5 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" className="mx-auto mb-1">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{t('تم إخفاء هذا التعليق بسبب البلاغات', 'This comment has been hidden due to reports', 'Ce commentaire a été masqué en raison de signalements', 'Bu yorum bildiriler nedeniyle gizlendi', 'Este comentario ha sido ocultado')}</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="p-4 rounded-xl" style={{ background: 'var(--bg4)', border: isExpert ? '1px solid rgba(255,184,0,0.3)' : '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: isExpert ? 'var(--gold2)' : 'var(--cyan2)', color: isExpert ? 'var(--gold)' : 'var(--cyan)' }}>
            {comment.authorName.charAt(0)}
          </div>
          <span className="text-[12px] font-bold" style={{ color: isExpert ? 'var(--gold)' : 'var(--text2)' }}>{comment.authorName}</span>
          {isExpert && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{ background: 'var(--gold2)', color: 'var(--gold)', border: '1px solid rgba(255,184,0,0.25)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--gold)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {t('خبير مالي', 'Financial Expert', 'Expert financier', 'Finans Uzmanı', 'Experto Financiero')}
            </span>
          )}
          <span className="text-[10px]" style={{ color: 'var(--text3)' }} title={new Date(comment.createdAt).toLocaleString(locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ar-SA')}>{formatRelativeTime(comment.createdAt, locale)}</span>
        </div>
        <p className="text-[14px] leading-[1.9] mb-3" style={{ color: 'var(--text)', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>{comment.content}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Upvote */}
          <button onClick={() => handleVote('upvote')} className="flex items-center gap-1 text-[10px] transition-colors hover:text-[var(--bull)]" style={{ color: 'var(--text3)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            {comment.upvotes || 0}
          </button>
          {/* Downvote */}
          <button onClick={() => handleVote('downvote')} className="flex items-center gap-1 text-[10px] transition-colors hover:text-[var(--bear)]" style={{ color: 'var(--text3)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(180deg)' }}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            {comment.downvotes || 0}
          </button>
          {/* Score */}
          <span className="text-[10px] font-mono" style={{ color: voteScore > 0 ? 'var(--bull)' : voteScore < 0 ? 'var(--bear)' : 'var(--text3)' }}>
            {voteScore > 0 ? '+' : ''}{voteScore}
          </span>
          {/* Reply button (only if depth < 2) */}
          {depth < 2 && (
            <button onClick={() => setShowReplyForm(!showReplyForm)} className="text-[10px] font-medium" style={{ color: 'var(--cyan)' }}>
              {t('رد', 'Reply', 'Répondre', 'Yanıtla', 'Responder')}
            </button>
          )}
          {/* Report */}
          <button onClick={() => setShowReportConfirm(true)} className="text-[10px] transition-colors mr-auto" style={{ color: 'var(--text3)' }} title={t('إبلاغ عن تعليق غير لائق', 'Report inappropriate comment', 'Signaler un commentaire inapproprié', 'Uygunsuz yorumu bildir', 'Reportar comentario inapropiado')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          </button>
        </div>

        {/* Report confirmation */}
        {showReportConfirm && (
          <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{t('هل تريد الإبلاغ عن هذا التعليق؟', 'Do you want to report this comment?', 'Voulez-vous signaler ce commentaire ?', 'Bu yorumu bildirmek istiyor musunuz?', '¿Deseas reportar este comentario?')}</span>
            <button onClick={handleReport} className="px-3 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--bear)', border: '1px solid rgba(244,63,94,0.25)' }}>{t('نعم', 'Yes', 'Oui', 'Evet', 'Sí')}</button>
            <button onClick={() => setShowReportConfirm(false)} className="px-3 py-1 rounded-lg text-[10px]" style={{ color: 'var(--text3)' }}>{t('إلغاء', 'Cancel', 'Annuler', 'İptal', 'Cancelar')}</button>
          </div>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder={t('اسمك', 'Your name', 'Votre nom', 'Adınız', 'Tu nombre')}
              value={replyName}
              onChange={e => setReplyName(e.target.value)}
              className="w-full mb-2 px-3 py-2 rounded-lg text-[12px] outline-none"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
            <div className="relative">
              <textarea
                placeholder={t('اكتب ردك...', 'Write your reply...', 'Écrivez votre réponse...', 'Yanıtınızı yazın...', 'Escribe tu respuesta...')}
                value={replyText}
                onChange={e => setReplyText(e.target.value.slice(0, 1000))}
                rows={2}
                maxLength={1000}
                className="w-full mb-1 px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
              />
              <span className="absolute left-2 bottom-2 text-[9px]" style={{ color: replyText.length > 900 ? 'var(--bear)' : 'var(--text3)' }}>{replyText.length}/1000</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReply}
                disabled={submitting || !replyText.trim() || !replyName.trim()}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
                style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.25)' }}
              >
                {submitting ? t('جارٍ الإرسال...', 'Sending...', 'Envoi en cours...', 'Gönderiliyor...', 'Enviando...') : t('إرسال الرد', 'Send Reply', 'Envoyer la réponse', 'Yanıtı Gönder', 'Enviar Respuesta')}
              </button>
              <button onClick={() => setShowReplyForm(false)} className="px-3 py-1.5 rounded-lg text-[11px]" style={{ color: 'var(--text3)' }}>
                {t('إلغاء', 'Cancel', 'Annuler', 'İptal', 'Cancelar')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mr-6 mt-2" style={{ borderInlineStart: depth < 2 ? '2px solid var(--border)' : 'none' }}>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} newsId={newsId} onReplyAdded={onReplyAdded} depth={depth + 1} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsSection({ newsId, locale = 'ar' }: CommentsSectionProps) {
  const { toast } = useToast();
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<CommentSortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ newsId, sort: sortBy });
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/comments?${params.toString()}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  }, [newsId, sortBy, searchQuery]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim() || !authorName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId, content, authorName }),
      });
      if (res.ok) {
        setContent('');
        fetchComments();
        toast({ title: t('تم إرسال التعليق', 'Comment Posted', 'Commentaire publié', 'Yorum Gönderildi', 'Comentario publicado'), description: t('شكراً لمشاركتك!', 'Thanks for sharing!', 'Merci d\'avoir partagé !', 'Paylaşımınız için teşekkürler!', '¡Gracias por compartir!') });
      } else {
        const data = await res.json();
        toast({ title: t('خطأ', 'Error', 'Erreur', 'Hata', 'Error'), description: data.error || t('فشل إرسال التعليق', 'Failed to post comment', 'Échec de la publication du commentaire', 'Yorum gönderilemedi', 'Error al publicar comentario'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('خطأ', 'Error', 'Erreur', 'Hata', 'Error'), description: t('فشل الاتصال', 'Connection failed', 'Échec de connexion', 'Bağlantı başarısız', 'Error de conexión'), variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setLoading(true);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setLoading(true);
  };

  const sortOptions: { value: CommentSortOption; label: string }[] = [
    { value: 'newest', label: t('الأحدث', 'Newest', 'Plus récents', 'En yeni', 'Más recientes') },
    { value: 'oldest', label: t('الأقدم', 'Oldest', 'Plus anciens', 'En eski', 'Más antiguos') },
    { value: 'most_upvoted', label: t('الأكثر تأييداً', 'Most Liked', 'Plus aimés', 'En beğenilen', 'Más apoyados') },
  ];

  const charCountColor = content.length > 900 ? 'var(--bear)' : content.length > 700 ? 'var(--gold)' : 'var(--text3)';

  return (
    <section className="mt-8 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3 className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{t('التعليقات', 'Comments', 'Commentaires', 'Yorumlar', 'Comentarios')}</h3>
        <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>{total}</span>
        <span className="flex-1" />

        {/* Search toggle */}
        <button
          onClick={() => { setShowSearch(!showSearch); if (showSearch) clearSearch(); }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
          style={{
            border: '1px solid var(--border)',
            color: showSearch ? 'var(--cyan)' : 'var(--text3)',
            background: showSearch ? 'var(--cyan2)' : 'transparent',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {t('بحث', 'Search', 'Rechercher', 'Ara', 'Buscar')}
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder={t('ابحث في التعليقات...', 'Search comments...', 'Rechercher des commentaires...', 'Yorumlarda ara...', 'Buscar comentarios...')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 rounded-lg text-[12px] outline-none"
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
          <button onClick={handleSearch} className="px-3 py-2 rounded-lg text-[11px] font-bold" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.25)' }}>
            {t('بحث', 'Search', 'Rechercher', 'Ara', 'Buscar')}
          </button>
          {searchQuery && (
            <button onClick={clearSearch} className="px-3 py-2 rounded-lg text-[11px]" style={{ color: 'var(--text3)' }}>
              {t('مسح', 'Clear', 'Effacer', 'Temizle', 'Limpiar')}
            </button>
          )}
        </div>
      )}

      {/* Sort options */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>{t('ترتيب:', 'Sort:', 'Trier :', 'Sıralama:', 'Ordenar:')}</span>
        {sortOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setSortBy(opt.value); setLoading(true); }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
            style={{
              background: sortBy === opt.value ? 'var(--cyan2)' : 'transparent',
              color: sortBy === opt.value ? 'var(--cyan)' : 'var(--text3)',
              border: sortBy === opt.value ? '1px solid rgba(0,201,167,0.25)' : '1px solid transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Add comment form */}
      <div className="p-5 rounded-2xl mb-6" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>{t('أضف تعليقك', 'Add your comment', 'Ajoutez votre commentaire', 'Yorumunuzu ekleyin', 'Añade tu comentario')}</span>
        </div>
        <input
          type="text"
          placeholder={t('اسمك', 'Your name', 'Votre nom', 'Adınız', 'Tu nombre')}
          value={authorName}
          onChange={e => setAuthorName(e.target.value.slice(0, 50))}
          className="w-full mb-3 px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all focus:ring-1 focus:ring-cyan-400"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        />
        <div className="relative">
          <textarea
            placeholder={t('شاركنا رأيك في هذا الخبر...', 'Share your opinion on this news...', 'Partagez votre avis sur cette actualité...', 'Bu haber hakkındaki düşüncelerinizi paylaşın...', 'Comparte tu opinión...')}
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 1000))}
            rows={3}
            maxLength={1000}
            className="w-full mb-2 px-4 py-2.5 rounded-xl text-[13px] outline-none resize-none transition-all focus:ring-1 focus:ring-cyan-400"
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
          {/* Character count */}
          <div className="absolute left-3 bottom-3 flex items-center gap-1.5">
            <span className="text-[9px]" style={{ color: charCountColor }}>{content.length}</span>
            <span className="text-[9px]" style={{ color: 'var(--text3)' }}>/1000</span>
            {content.length > 900 && (
              <span className="text-[8px]" style={{ color: 'var(--bear)' }}>⚠ {t('قرب الحد', 'Near limit', 'Limite proche', 'Sınıra yakın', 'Cerca del límite')}</span>
            )}
          </div>
          {/* Character bar */}
          <div className="absolute right-3 bottom-3 w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{
              width: `${Math.min(100, (content.length / 1000) * 100)}%`,
              background: content.length > 900 ? 'var(--bear)' : content.length > 700 ? 'var(--gold)' : 'var(--cyan)',
            }} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('الحد الأقصى 1000 حرف', 'Max 1000 characters', 'Maximum 1000 caractères', 'Maksimum 1000 karakter', 'Máximo 1000 caracteres')}</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !authorName.trim()}
            className="px-5 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}
          >
            {submitting ? t('جارٍ الإرسال...', 'Sending...', 'Envoi en cours...', 'Gönderiliyor...', 'Enviando...') : t('نشر التعليق', 'Post Comment', 'Publier', 'Yorum gönder', 'Publicar comentario')}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--cyan)', borderTopColor: 'transparent' }} />
        </div>
      ) : searchQuery && comments.length === 0 ? (
        <div className="text-center py-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" className="mx-auto mb-3">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>{t('لا توجد تعليقات تطابق البحث', 'No comments match the search', 'Aucun commentaire ne correspond à la recherche', 'Aramayla eşleşen yorum yok', 'No hay comentarios que coincidan con la búsqueda')}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" className="mx-auto mb-3">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>{t('لا توجد تعليقات بعد. كن أول من يعلق!', 'No comments yet. Be the first to comment!', 'Aucun commentaire pour l\'instant. Soyez le premier à commenter !', 'Henüz yorum yok. İlk siz yorum yapın!', 'No hay comentarios aún. ¡Sé el primero en comentar!')}</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} newsId={newsId} onReplyAdded={fetchComments} depth={0} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
