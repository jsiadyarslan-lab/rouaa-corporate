// ─── Event Timeline ────────────────────────────────────────────
// Vertical timeline of key events mentioned in the analysis
// Shows a timeline with dots, connecting lines, time labels and descriptions
'use client';

interface TimelineEvent {
  time: string;
  label: string;
  description: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface EventTimelineProps {
  events: TimelineEvent[];
  title?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function EventTimeline({ events, title, locale = 'ar' }: EventTimelineProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const resolvedTitle = title || t('الجدول الزمني للأحداث', 'Event Timeline', 'Chronologie des Événements', 'Olay Zaman Çizelgesi', 'Cronología de eventos');
  if (!events || events.length === 0) return null;

  const getDotColor = (sentiment?: string) => {
    if (sentiment === 'positive') return 'var(--bull)';
    if (sentiment === 'negative') return 'var(--bear)';
    return 'var(--cyan)';
  };

  const getDotGlow = (sentiment?: string) => {
    if (sentiment === 'positive') return '0 0 8px rgba(34,197,94,0.4)';
    if (sentiment === 'negative') return '0 0 8px rgba(239,83,80,0.4)';
    return '0 0 8px rgba(0,229,255,0.4)';
  };

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
        <span className="text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>{resolvedTitle}</span>
      </div>

      {/* Timeline */}
      <div className="relative" style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
        {events.map((event, i) => (
          <div key={i} className="flex gap-4 relative" style={{ minHeight: i < events.length - 1 ? '72px' : 'auto' }}>
            {/* Connecting line */}
            {i < events.length - 1 && (
              <div
                className="absolute"
                style={{
                  right: '7px',
                  top: '20px',
                  bottom: '0',
                  width: '2px',
                  background: 'linear-gradient(180deg, var(--border2), var(--border))',
                  borderRadius: '1px',
                }}
              />
            )}

            {/* Dot */}
            <div className="flex-shrink-0 relative z-10 mt-1">
              <div
                className="w-[16px] h-[16px] rounded-full"
                style={{
                  background: getDotColor(event.sentiment),
                  boxShadow: getDotGlow(event.sentiment),
                  border: '2px solid var(--bg4)',
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono-price font-bold" style={{ color: 'var(--text2)' }}>
                  {event.time}
                </span>
                <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>
                  {event.label}
                </span>
              </div>
              {event.description && (
                <p className="text-[12px] leading-[1.8]" style={{ color: 'var(--text3)' }}>
                  {event.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helper: Build timeline events from article data ──────────
// Attempts to extract events from keyTakeaways and analysis
export function buildTimelineEvents(data: {
  keyTakeaways?: any[];
  introduction?: string;
  body?: string;
  publishedAt?: string;
  category?: string;
}, locale: 'ar' | 'en' | 'fr' | 'tr' | 'es' = 'ar'): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Publication event
  if (data.publishedAt) {
    try {
      const date = new Date(data.publishedAt);
      const loc = locale;
      const dateLocale = loc === 'es' ? 'es-ES' : loc === 'tr' ? 'tr-TR' : loc === 'en' ? 'en-US' : loc === 'fr' ? 'fr-FR' : 'ar-SA';
      const timeStr = date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
      const pubLabel = loc === 'es' ? 'Noticia publicada' : loc === 'tr' ? 'Haber Yayınlandı' : loc === 'en' ? 'News Published' : loc === 'fr' ? 'Actualité Publiée' : 'نشر الخبر';
      const pubDesc = data.category
        ? (loc === 'es' ? `Noticia en categoría ${data.category}` : loc === 'tr' ? `${data.category} kategorisinde haber` : loc === 'en' ? `News in ${data.category} category` : loc === 'fr' ? `Actualité dans la catégorie ${data.category}` : `خبر في تصنيف ${data.category}`)
        : (loc === 'es' ? 'Noticia publicada' : loc === 'tr' ? 'Haber yayınlandı' : loc === 'en' ? 'News published' : loc === 'fr' ? 'Actualité publiée' : 'تم نشر الخبر');
      events.push({
        time: timeStr,
        label: pubLabel,
        description: pubDesc,
        sentiment: 'neutral',
      });
    } catch {}
  }

  // Extract events from keyTakeaways
  if (data.keyTakeaways && Array.isArray(data.keyTakeaways)) {
    data.keyTakeaways.slice(0, 4).forEach((takeaway: any, i: number) => {
      const text = typeof takeaway === 'string' ? takeaway : takeaway?.text || takeaway?.content || '';
      if (text) {
        // Simple sentiment detection from text
        const hasPositive = /إيجاب|ارتف|نم|تحس|فاق|أعلن.*زياد/i.test(text);
        const hasNegative = /سلبي|انخف|تراج|خسار|تدهور|انكماش/i.test(text);
        events.push({
          time: locale === 'es' ? `+${(i + 1) * 15}m` : locale === 'tr' ? `+${(i + 1) * 15}dk` : locale === 'en' ? `+${(i + 1) * 15}m` : `+${(i + 1) * 15}د`,
          label: text.length > 50 ? text.slice(0, 50) + '...' : text,
          description: text.length > 50 ? text : '',
          sentiment: hasPositive ? 'positive' : hasNegative ? 'negative' : 'neutral',
        });
      }
    });
  }

  return events;
}
