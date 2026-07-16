// ─── Story Slide V12 — القصة البصرية ────────────────────────
// V12: Added locale prop for English/Arabic UI text translation
// 4 visual patterns: A=Flow, B=Comparison, C=Map, D=Sequence
// V11: Unified DESIGN_TOKENS + slide-type gradient DNA + glassCard preset

'use client';

import { InfographicSlide, COLOR_MAP, getCategoryColor, DESIGN_TOKENS, getDirectionColor, hexToRgba } from '../types';
import SlideWithImage, { EmptySlideFallback } from './SlideWithImage';
import * as LucideIcons from 'lucide-react';

// V11: Unified constants
const TEXT_SHADOW = DESIGN_TOKENS.textShadowOverImage;
const SUCCESS = DESIGN_TOKENS.success;
const DANGER = DESIGN_TOKENS.danger;
const WARNING = DESIGN_TOKENS.warning;

interface StorySlideProps {
  slide: InfographicSlide;
  locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr';
}

// V12: Translation map
const STORY_I18N = {
  ar: {
    flow: 'تدفق',
    comparison: 'مقارنة',
    map: 'خريطة',
    sequence: 'تسلسل',
    noData: 'لا توجد بيانات كافية',
    noStoryData: 'لا توجد بيانات كافية للقصة البصرية',
    before: 'قبل',
    change: 'التغيير',
    after: 'بعد',
    events: 'الأحداث',
    consequences: 'النتائج',
  },
  en: {
    flow: 'Flow',
    comparison: 'Comparison',
    map: 'Map',
    sequence: 'Sequence',
    noData: 'Insufficient data',
    noStoryData: 'Insufficient data for visual story',
    before: 'Before',
    change: 'Change',
    after: 'After',
    events: 'Events',
    consequences: 'Consequences',
  },
  es: {
    flow: 'Flow',
    comparison: 'Comparison',
    map: 'Map',
    sequence: 'Sequence',
    noData: 'Insufficient data',
    noStoryData: 'Insufficient data for visual story',
    before: 'Before',
    change: 'Change',
    after: 'After',
    events: 'Events',
    consequences: 'Consequences',
  },
  fr: {
    flow: 'Flow',
    comparison: 'Comparison',
    map: 'Map',
    sequence: 'Sequence',
    noData: 'Insufficient data',
    noStoryData: 'Insufficient data for visual story',
    before: 'Before',
    change: 'Change',
    after: 'After',
    events: 'Events',
    consequences: 'Consequences',
  },
  tr: {
    flow: 'Flow',
    comparison: 'Comparison',
    map: 'Map',
    sequence: 'Sequence',
    noData: 'Insufficient data',
    noStoryData: 'Insufficient data for visual story',
    before: 'Before',
    change: 'Change',
    after: 'After',
    events: 'Events',
    consequences: 'Consequences',
  },
};

export default function StorySlide({ slide, locale = 'ar' }: StorySlideProps) {
  const t = STORY_I18N[locale];
  const colorName = (slide as any).content.color || slide.color || '';
  const accentColor = COLOR_MAP[colorName] || slide.accentColor || getCategoryColor(slide.content.tag);
  const pattern = slide.content.pattern || 'A';
  const elements = slide.content.elements;

  // Pattern A: Flow (from/event/to/impact)
  if (pattern === 'A' && elements && !Array.isArray(elements)) {
    const e = elements as any;
    return (
      <SlideWithImage slide={slide} fallbackIcon={LucideIcons.Layers} fallbackText={t.noData} slideType="story" locale={locale}>
        <Header title={slide.title} accentColor={accentColor} pattern={pattern} locale={locale} />
        <div className="flex-1 flex items-center justify-center">
          <FlowPattern from={e.from} event={e.event} to={e.to} impact={e.impact} accentColor={accentColor} />
        </div>
      </SlideWithImage>
    );
  }

  // Pattern B: Comparison (before/after/change)
  if (pattern === 'B' && elements && !Array.isArray(elements)) {
    const e = elements as any;
    return (
      <SlideWithImage slide={slide} fallbackIcon={LucideIcons.Layers} fallbackText={t.noData} slideType="story" locale={locale}>
        <Header title={slide.title} accentColor={accentColor} pattern={pattern} locale={locale} />
        <div className="flex-1 flex items-center justify-center">
          <ComparisonPattern before={e.before} after={e.after} change={e.change} accentColor={accentColor} locale={locale} />
        </div>
      </SlideWithImage>
    );
  }

  // Pattern C: Map (regions array)
  if (pattern === 'C' && elements && !Array.isArray(elements)) {
    const e = elements as any;
    return (
      <SlideWithImage slide={slide} fallbackIcon={LucideIcons.Layers} fallbackText={t.noData} slideType="story" locale={locale}>
        <Header title={slide.title} accentColor={accentColor} pattern={pattern} locale={locale} />
        <div className="flex-1 flex items-center justify-center">
          <MapPattern regions={e.regions} accentColor={accentColor} />
        </div>
      </SlideWithImage>
    );
  }

  // Pattern D: Sequence
  if (pattern === 'D' && elements && !Array.isArray(elements)) {
    const e = elements as any;
    if (Array.isArray(e.steps) && e.steps.length > 0) {
      return (
        <SlideWithImage slide={slide} fallbackIcon={LucideIcons.Layers} fallbackText={t.noData} slideType="story" locale={locale}>
          <Header title={slide.title} accentColor={accentColor} pattern={pattern} locale={locale} />
          <div className="flex-1 flex items-center justify-center">
            <SequencePattern steps={e.steps} accentColor={accentColor} locale={locale} />
          </div>
        </SlideWithImage>
      );
    }
    const hasEvents = e.event1 || e.event2 || e.event3;
    const hasConsequences = e.consequence1 || e.consequence2 || e.consequence3;
    if (hasEvents || hasConsequences) {
      return (
        <SlideWithImage slide={slide} fallbackIcon={LucideIcons.Layers} fallbackText={t.noData} slideType="story" locale={locale}>
          <Header title={slide.title} accentColor={accentColor} pattern={pattern} locale={locale} />
          <div className="flex-1 flex items-center justify-center">
            <CauseEffectPattern
              events={[e.event1, e.event2, e.event3].filter(Boolean)}
              consequences={[e.consequence1, e.consequence2, e.consequence3].filter(Boolean)}
              accentColor={accentColor}
              locale={locale}
            />
          </div>
        </SlideWithImage>
      );
    }
    return <EmptySlideFallback icon={LucideIcons.Layers} text={t.noStoryData} locale={locale} />;
  }

  // Fallback: Array-based elements (legacy format)
  const arr = Array.isArray(elements) ? elements : [];
  if (arr.length === 0) {
    return <EmptySlideFallback icon={LucideIcons.Layers} text={t.noStoryData} locale={locale} />;
  }

  return (
    <SlideWithImage slide={slide} fallbackIcon={LucideIcons.Layers} fallbackText={t.noData} slideType="story" locale={locale}>
      <Header title={slide.title} accentColor={accentColor} pattern={pattern} locale={locale} />
      <div className="flex-1 flex items-center justify-center">
        {pattern === 'A' ? <FlowElements elements={arr} accentColor={accentColor} />
          : pattern === 'B' ? <ComparisonLegacy slide={slide} accentColor={accentColor} locale={locale} />
          : pattern === 'C' ? <MapElements elements={arr} accentColor={accentColor} />
          : <SequenceElements elements={arr} accentColor={accentColor} locale={locale} />}
      </div>
    </SlideWithImage>
  );
}

// ─── Header ────────────────────────────────────────────────
function Header({ title, accentColor, pattern, locale = 'ar' }: { title: string; accentColor: string; pattern: string; locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  const t = STORY_I18N[locale];
  return (
    <div className="flex items-center gap-3 mb-5 sm:mb-6">
      <div className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: accentColor + '18', color: accentColor }}>
        <LucideIcons.Layers size={20} aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-[20px] sm:text-[22px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary }}>{title}</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: accentColor + '12', color: accentColor }}>
          {pattern === 'A' ? t.flow : pattern === 'B' ? t.comparison : pattern === 'C' ? t.map : t.sequence}
        </span>
      </div>
    </div>
  );
}

// ─── Pattern A: Flow (object) ──────────────────────────────
function FlowPattern({ from, event, to, impact, accentColor }: any) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {from && <FlowCard label={from} accentColor={accentColor} />}
      {from && event && <LucideIcons.ArrowLeft size={18} style={{ color: accentColor }} aria-hidden="true" />}
      {event && <FlowCard label={event} accentColor={accentColor} highlight />}
      {event && to && <LucideIcons.ArrowLeft size={18} style={{ color: accentColor }} aria-hidden="true" />}
      {to && <FlowCard label={to} accentColor={accentColor} />}
      {impact && <LucideIcons.ArrowLeft size={18} style={{ color: accentColor }} aria-hidden="true" />}
      {impact && <FlowCard label={impact} accentColor={accentColor} />}
    </div>
  );
}

function FlowCard({ label, accentColor, highlight }: { label: string; accentColor: string; highlight?: boolean }) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl min-w-[80px] sm:min-w-[100px]"
      style={{ ...DESIGN_TOKENS.glassCard(highlight ? accentColor + '40' : undefined), border: highlight ? `2px solid ${accentColor}60` : `1px solid ${DESIGN_TOKENS.borderSubtle}` }}>
      <span className="text-[12px] sm:text-[14px] font-bold text-center block" style={{ color: highlight ? accentColor : DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW }}>
        {label}
      </span>
    </div>
  );
}

// ─── Pattern B: Comparison (object) ────────────────────────
function ComparisonPattern({ before, after, change, accentColor, locale = 'ar' }: any) {
  const t = STORY_I18N[locale];
  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg" style={{ background: hexToRgba(DANGER, 0.06) }}>
          <span className="text-[12px] font-bold" style={{ color: DANGER }}>{before?.label || t.before}</span>
          <span className="block text-[16px] font-bold mt-1" style={{ color: DESIGN_TOKENS.textPrimary }}>{before?.value || '—'}</span>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: hexToRgba(accentColor, 0.05) }}>
          <span className="text-[12px] font-bold block" style={{ color: accentColor }}>{t.change}</span>
          <span className="block text-[16px] font-bold mt-1" style={{ color: getDirectionColor(change?.direction) }}>
            {change?.amount || '—'}
          </span>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: hexToRgba(SUCCESS, 0.06) }}>
          <span className="text-[12px] font-bold" style={{ color: SUCCESS }}>{after?.label || t.after}</span>
          <span className="block text-[16px] font-bold mt-1" style={{ color: DESIGN_TOKENS.textPrimary }}>{after?.value || '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pattern C: Map (object) ───────────────────────────────
function MapPattern({ regions, accentColor }: any) {
  if (!Array.isArray(regions)) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
      {regions.map((r: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-3 rounded-2xl"
          style={{ ...DESIGN_TOKENS.glassCard(), borderInlineStart: `3px solid ${r.impact === 'positive' ? SUCCESS : r.impact === 'negative' ? DANGER : DESIGN_TOKENS.textMuted}` }}>
          <LucideIcons.MapPin size={16} style={{ color: accentColor }} aria-hidden="true" />
          <span className="text-[12px] sm:text-[13px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW }}>{r.name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Pattern D: Sequence (object) ──────────────────────────
function SequencePattern({ steps, accentColor, locale = 'ar' }: any) {
  const isRtl = locale === 'ar';
  if (!Array.isArray(steps)) return null;
  return (
    <div className="w-full space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
      {steps.map((s: any, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px]"
            style={{ background: accentColor + '20', border: `2px solid ${accentColor}`, color: accentColor }}>
            {s.order || i + 1}
          </div>
          <div className="flex-1 p-3 rounded-xl" style={DESIGN_TOKENS.glassCard()}>
            <span className="text-[13px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW }}>{s.event}</span>
            {s.time && <span className="text-[10px] mr-2 px-1.5 py-0.5 rounded" style={{ background: accentColor + '20', color: accentColor }}>{s.time}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Pattern D-alt: Cause-Effect ──
function CauseEffectPattern({ events, consequences, accentColor, locale = 'ar' }: { events: string[]; consequences: string[]; accentColor: string; locale?: 'ar' | 'en' | 'es' | 'fr' | 'tr' }) {
  const t = STORY_I18N[locale];
  const isRtl = locale === 'ar';
  return (
    <div className="w-full space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {events.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LucideIcons.Zap size={14} style={{ color: accentColor }} aria-hidden="true" />
            <span className="text-[12px] font-bold" style={{ color: accentColor }}>{t.events}</span>
            <div className="flex-1 h-px" style={{ background: accentColor + '30' }} />
          </div>
          <div className="space-y-2">
            {events.map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px]"
                  style={{ background: accentColor + '20', border: `2px solid ${accentColor}`, color: accentColor }}>
                  {i + 1}
                </div>
                <div className="flex-1 p-2.5 rounded-xl" style={DESIGN_TOKENS.glassCard()}>
                  <span className="text-[12px] sm:text-[13px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW }}>{event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && consequences.length > 0 && (
        <div className="flex justify-center">
          <LucideIcons.ArrowDown size={18} style={{ color: accentColor }} aria-hidden="true" />
        </div>
      )}

      {consequences.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LucideIcons.AlertTriangle size={14} style={{ color: WARNING }} aria-hidden="true" />
            <span className="text-[12px] font-bold" style={{ color: WARNING }}>{t.consequences}</span>
            <div className="flex-1 h-px" style={{ background: hexToRgba(WARNING, 0.2) }} />
          </div>
          <div className="space-y-2">
            {consequences.map((consequence, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px]"
                  style={{ background: hexToRgba(WARNING, 0.1), border: `2px solid ${WARNING}`, color: WARNING }}>
                  {i + 1}
                </div>
                <div className="flex-1 p-2.5 rounded-xl" style={{ ...DESIGN_TOKENS.glassCard(WARNING + '30'), borderInlineStart: `3px solid ${WARNING}` }}>
                  <span className="text-[12px] sm:text-[13px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary, textShadow: TEXT_SHADOW }}>{consequence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legacy array-based patterns ───────────────────────────
function FlowElements({ elements, accentColor }: any) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {elements.map((el: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <FlowCard label={el.label} accentColor={accentColor} />
          {i < elements.length - 1 && <LucideIcons.ArrowLeft size={16} style={{ color: accentColor }} aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

function ComparisonLegacy({ slide, accentColor, locale = 'ar' }: any) {
  const t = STORY_I18N[locale];
  const beforeItems = slide.content.beforeItems || [];
  const afterItems = slide.content.afterItems || [];
  const changeItems = slide.content.changeItems || [];
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center p-2 rounded-lg" style={{ background: hexToRgba(DANGER, 0.07) }}><span className="text-[11px] font-bold" style={{ color: DANGER }}>{t.before}</span></div>
        <div className="text-center p-2 rounded-lg" style={{ background: hexToRgba(DESIGN_TOKENS.textSymbol, 0.07) }}><span className="text-[11px] font-bold" style={{ color: DESIGN_TOKENS.textSymbol }}>{t.change}</span></div>
        <div className="text-center p-2 rounded-lg" style={{ background: hexToRgba(SUCCESS, 0.07) }}><span className="text-[11px] font-bold" style={{ color: SUCCESS }}>{t.after}</span></div>
      </div>
      {beforeItems.map((item: string, i: number) => (
        <div key={i} className="grid grid-cols-3 gap-2 mb-2">
          <div className="p-2 rounded-lg text-center" style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}><span className="text-[11px]" style={{ color: DESIGN_TOKENS.textPrimary }}>{item}</span></div>
          <div className="p-2 rounded-lg text-center" style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}><span className="text-[11px]" style={{ color: accentColor }}>{changeItems[i] || '—'}</span></div>
          <div className="p-2 rounded-lg text-center" style={{ background: DESIGN_TOKENS.bgCard, border: `1px solid ${DESIGN_TOKENS.borderDefault}` }}><span className="text-[11px]" style={{ color: DESIGN_TOKENS.textPrimary }}>{afterItems[i] || '—'}</span></div>
        </div>
      ))}
    </div>
  );
}

function MapElements({ elements, accentColor }: any) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {elements.map((el: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-3 rounded-xl" style={{ ...DESIGN_TOKENS.glassCard(), borderInlineStart: `3px solid ${accentColor}` }}>
          <LucideIcons.MapPin size={16} style={{ color: accentColor }} aria-hidden="true" />
          <div><span className="text-[12px] font-bold block" style={{ color: DESIGN_TOKENS.textPrimary }}>{el.label}</span>
          {el.description && <span className="text-[10px]" style={{ color: DESIGN_TOKENS.textSymbol }}>{el.description}</span>}</div>
        </div>
      ))}
    </div>
  );
}

function SequenceElements({ elements, accentColor, locale = 'ar' }: any) {
  const isRtl = locale === 'ar';
  return (
    <div className="w-full space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
      {elements.map((el: any, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px]"
            style={{ background: accentColor + '20', border: `2px solid ${accentColor}`, color: accentColor }}>{i + 1}</div>
          <div className="flex-1 p-3 rounded-xl" style={DESIGN_TOKENS.glassCard()}>
            <span className="text-[13px] font-bold" style={{ color: DESIGN_TOKENS.textPrimary }}>{el.label}</span>
            {el.description && <p className="text-[11px] mt-1" style={{ color: DESIGN_TOKENS.textSymbol }}>{el.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
