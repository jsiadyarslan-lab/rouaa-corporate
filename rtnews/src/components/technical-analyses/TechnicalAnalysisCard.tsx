'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTAStrings, formatTimeAgoTA, TALocale } from '@/lib/technical-analyses-i18n';

export interface ContentAnalysis {
  id: string;
  title: string;
  content: string;
  category: string;
  type: string;
  symbols: string[];
  sentiment: string | number;
  impactLevel: string;
  qualityScore: number;
  tags: string[];
  publishedAt: string;
  summary?: string;
  source?: string;
  priceTarget?: any;
  assetClass?: string;
  analysisType?: string;
  timeFrame?: string;
  riskLevel?: string;
  confidenceScore?: number;
  slug?: string;
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  STOCKS: { ar: 'الأسهم', en: 'Stocks', fr: 'Actions', tr: 'Hisseler', es: 'Acciones' },
  COMMODITIES: { ar: 'السلع', en: 'Commodities', fr: 'Matières premières', tr: 'Emtialar', es: 'Materias primas' },
  FOREX: { ar: 'العملات', en: 'Forex', fr: 'Devises', tr: 'Döviz', es: 'Divisas' },
  CRYPTO: { ar: 'العملات الرقمية', en: 'Crypto', fr: 'Crypto', tr: 'Kripto', es: 'Cripto' },
  BONDS: { ar: 'السندات', en: 'Bonds', fr: 'Obligations', tr: 'Tahviller', es: 'Bonos' },
  ENERGY: { ar: 'الطاقة', en: 'Energy', fr: 'Énergie', tr: 'Enerji', es: 'Energía' },
  ECONOMY: { ar: 'الاقتصاد', en: 'Economy', fr: 'Économie', tr: 'Ekonomi', es: 'Economía' },
  BANKING: { ar: 'البنوك', en: 'Banking', fr: 'Banque', tr: 'Bankacılık', es: 'Banca' },
  earnings: { ar: 'الأرباح', en: 'Earnings', fr: 'Résultats', tr: 'Kazançlar', es: 'Resultados' },
  arabMarkets: { ar: 'الأسواق العربية', en: 'Arab Markets', fr: 'Marchés Arabes', tr: 'Arap Pazarları', es: 'Mercados Árabes' },
  technicalAnalysis: { ar: 'تحليل فني', en: 'Technical', fr: 'Technique', tr: 'Teknik', es: 'Técnico' },
};

const TYPE_LABELS: Record<string, Record<string, string>> = {
  AI_GENERATED: { ar: 'تحليل AI', en: 'AI Analysis', fr: 'Analyse IA', tr: 'AI Analizi', es: 'Análisis IA' },
  TECHNICAL: { ar: 'تحليل فني', en: 'Technical', fr: 'Technique', tr: 'Teknik', es: 'Técnico' },
  FUNDAMENTAL: { ar: 'تحليل أساسي', en: 'Fundamental', fr: 'Fondamentale', tr: 'Temel', es: 'Fundamental' },
  HOURLY_UPDATE: { ar: 'تحديث ساعي', en: 'Hourly Update', fr: 'Mise à jour', tr: 'Saatlik', es: 'Actualización' },
  PAIR_ANALYSIS: { ar: 'تحليل زوج', en: 'Pair Analysis', fr: 'Analyse de paire', tr: 'Çift Analizi', es: 'Análisis de par' },
  WEEKLY_REVIEW: { ar: 'مراجعة أسبوعية', en: 'Weekly Review', fr: 'Revue hebdomadaire', tr: 'Haftalık', es: 'Revisión semanal' },
  NEWS_DIGEST: { ar: 'ملخص أخبار', en: 'News Digest', fr: 'Digest', tr: 'Haber Özeti', es: 'Resumen' },
  ARTICLE: { ar: 'مقال', en: 'Article', fr: 'Article', tr: 'Makale', es: 'Artículo' },
  technical: { ar: 'فني', en: 'Technical', fr: 'Technique', tr: 'Teknik', es: 'Técnico' },
  fundamental: { ar: 'أساسي', en: 'Fundamental', fr: 'Fondamentale', tr: 'Temel', es: 'Fundamental' },
  sentiment: { ar: 'مشاعر', en: 'Sentiment', fr: 'Sentiment', tr: 'Duygu', es: 'Sentimiento' },
};

const ASSET_ICONS: Record<string, string> = {
  CRYPTO: '₿', FOREX: '💱', STOCKS: '📈', COMMODITIES: '🥇', BONDS: '📜', ENERGY: '⚡', ECONOMY: '🏛️', BANKING: '🏦',
  earnings: '💰', arabMarkets: '🕌', technicalAnalysis: '📊',
};

export function translateCategory(raw: string, locale: TALocale): string {
  if (!raw) return '';
  const labels = CATEGORY_LABELS[String(raw).toUpperCase()] || CATEGORY_LABELS[raw];
  return labels ? labels[locale] : raw;
}

export function translateType(raw: string, locale: TALocale): string {
  if (!raw) return '';
  const labels = TYPE_LABELS[String(raw).toUpperCase()] || TYPE_LABELS[raw];
  return labels ? labels[locale] : raw;
}

export function getAssetIcon(category: string): string {
  return ASSET_ICONS[String(category).toUpperCase()] || ASSET_ICONS[category] || '📊';
}

function classifySentiment(s: string | number): 'bullish' | 'bearish' | 'neutral' {
  const str = String(s || '').toLowerCase();
  if (/bull|positive|up|صعود|إيجاب|long|buy/.test(str)) return 'bullish';
  if (/bear|negative|down|هبوط|سلب|short|sell/.test(str)) return 'bearish';
  return 'neutral';
}

function sColor(c: 'bullish' | 'bearish' | 'neutral'): string { return c === 'bullish' ? 'var(--bull)' : c === 'bearish' ? 'var(--bear)' : 'var(--gold)'; }
function sBg(c: 'bullish' | 'bearish' | 'neutral'): string { return c === 'bullish' ? 'var(--bull2)' : c === 'bearish' ? 'var(--bear2)' : 'var(--gold2)'; }
function sLabel(c: 'bullish' | 'bearish' | 'neutral', l: TALocale): string {
  if (c === 'bullish') return l === 'ar' ? 'صعودي' : l === 'fr' ? 'Haussier' : l === 'es' ? 'Alcista' : l === 'tr' ? 'Yükseliş' : 'Bullish';
  if (c === 'bearish') return l === 'ar' ? 'هبوطي' : l === 'fr' ? 'Baissier' : l === 'es' ? 'Bajista' : l === 'tr' ? 'Düşüş' : 'Bearish';
  return l === 'ar' ? 'محايد' : l === 'fr' ? 'Neutre' : l === 'es' ? 'Neutral' : l === 'tr' ? 'Nötr' : 'Neutral';
}

function stripMd(text: string): string {
  if (!text) return '';
  return String(text).replace(/```[\s\S]*?```/g, '').replace(/^#{1,6}\s+/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^[-*+]\s+/gm, '').trim();
}

function parseAnalysis(raw: { title?: string; content?: string; summary?: string }): { title: string; content: string; summary: string } {
  let title = String(raw.title || '').trim();
  let content = String(raw.content || '').trim();
  let summary = String(raw.summary || '').trim();
  const unescape = (s: string) => s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  const extractField = (text: string, field: string) => { const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's'); const m = text.match(re); return m ? unescape(m[1]) : null; };
  const cleanArtifacts = (s: string) => s.replace(/^\s*\{+\s*/, '').replace(/\s*\}+\s*$/, '').replace(/^\s*"(?:title|content|summary)"\s*:\s*"?\s*/i, '').replace(/"?\s*,?\s*$/, '').trim();

  if (title === '{' && content.length > 2) { const f = title + content; try { const p = JSON.parse(f); if (p.title || p.content) return { title: stripMd(String(p.title || '')).slice(0, 200), content: String(p.content || ''), summary: String(p.summary || '') }; } catch {} const t = extractField(f, 'title'), c = extractField(f, 'content'), su = extractField(f, 'summary'); if (t || c) return { title: stripMd(t || '').slice(0, 200), content: c || '', summary: su || '' }; }
  if (title.startsWith('{')) { try { const p = JSON.parse(title); if (p.title || p.content) return { title: stripMd(String(p.title || '')).slice(0, 200), content: String(p.content || content || ''), summary: String(p.summary || summary || '') }; } catch {} const t = extractField(title, 'title'), c = extractField(title, 'content'); if (t) return { title: stripMd(t).slice(0, 200), content: c || content, summary }; title = cleanArtifacts(title); }
  if (title.includes('"title"') || title.includes('"content"')) { const t = extractField(title, 'title'), c = extractField(title, 'content'); if (t) return { title: stripMd(t).slice(0, 200), content: c || content, summary }; }
  if (content.startsWith('{')) { try { const p = JSON.parse(content); if (p.title || p.content) return { title: stripMd(String(p.title || title || '')).slice(0, 200), content: String(p.content || ''), summary: String(p.summary || summary || '') }; } catch {} const c = extractField(content, 'content'), t = extractField(content, 'title'); if (c || t) return { title: stripMd(t || title || '').slice(0, 200), content: c || '', summary }; content = cleanArtifacts(content); }
  if (content.includes('"content"') || content.includes('"title"')) { const c = extractField(content, 'content'), t = extractField(content, 'title'); if (c) return { title: stripMd(t || title || '').slice(0, 200), content: c, summary }; }
  return { title: stripMd(title).slice(0, 200), content, summary };
}

function parsePriceTarget(pt: any): { current?: number; target?: number; stopLoss?: number; symbol?: string } {
  if (!pt) return {};
  try { const p = typeof pt === 'string' ? JSON.parse(pt) : pt; return { current: p.current || p.currentPrice, target: p.target || p.targetPrice, stopLoss: p.stopLoss || p.stop_loss, symbol: p.symbol }; } catch { return {}; }
}

interface Props { analysis: ContentAnalysis; locale: TALocale; }

export default function TechnicalAnalysisCard({ analysis, locale }: Props) {
  const s = getTAStrings(locale);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const sClass = classifySentiment(analysis.sentiment);
  const sc = sColor(sClass); const sb = sBg(sClass); const si = sClass === 'bullish' ? '▲' : sClass === 'bearish' ? '▼' : '◆';
  const parsed = parseAnalysis({ title: analysis.title, content: analysis.content, summary: analysis.summary });
  const title = parsed.title; const content = parsed.content;
  const summaryPlain = stripMd(parsed.summary || content).slice(0, 180);
  const symbols = Array.isArray(analysis.symbols) ? analysis.symbols.slice(0, 5) : [];
  const primarySymbol = symbols[0] ? String(symbols[0]).replace('/USDT', '').replace('/USD', '') : (analysis.slug ? analysis.slug.replace(/-/g, '/').toUpperCase().slice(0, 8) : '');
  const isHighImpact = String(analysis.impactLevel || '').toUpperCase() === 'HIGH';
  const quality = analysis.qualityScore || analysis.confidenceScore || 0;
  const pt = parsePriceTarget(analysis.priceTarget);
  const assetIcon = getAssetIcon(analysis.category || analysis.assetClass || '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <>
      <div className="glass-card group transition-all duration-300 hover:-translate-y-1" style={{ padding: 0, overflow: 'hidden', borderInlineStart: `3px solid ${sc}`, display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setShowModal(true)}>
        {/* Hero gradient strip with asset icon */}
        <div style={{ height: '60px', background: `linear-gradient(135deg, ${sb}, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {primarySymbol && <span style={{ fontSize: '14px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{primarySymbol}</span>}
            {assetIcon && <span style={{ fontSize: '20px' }}>{assetIcon}</span>}
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: sb, color: sc }}>{si} {sLabel(sClass, locale)}</span>
        </div>

        <div style={{ padding: '12px 14px 8px' }}>
          {analysis.category && <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--cyan)', padding: '2px 7px', borderRadius: '4px', background: 'var(--cyan3)', marginBottom: '6px', display: 'inline-block' }}>{translateCategory(analysis.category || analysis.assetClass, locale)}</span>}
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-head)', lineHeight: 1.6, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }} className="group-hover:text-[var(--cyan)]">{title}</h4>
          {summaryPlain && <p style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{summaryPlain}</p>}
        </div>

        {/* Price targets mini-row */}
        {(pt.current || pt.target || pt.stopLoss) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '0 14px 8px' }}>
            {pt.current != null && <div style={{ textAlign: 'center', padding: '4px 6px', borderRadius: '6px', background: 'var(--surface-2)' }}><div style={{ fontSize: '7px', color: 'var(--text3)', textTransform: 'uppercase' }}>{s.currentLabel}</div><div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{Number(pt.current).toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>}
            {pt.target != null && <div style={{ textAlign: 'center', padding: '4px 6px', borderRadius: '6px', background: 'var(--bull2)' }}><div style={{ fontSize: '7px', color: 'var(--bull)', textTransform: 'uppercase' }}>{s.targetLabel}</div><div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bull)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{Number(pt.target).toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>}
            {pt.stopLoss != null && <div style={{ textAlign: 'center', padding: '4px 6px', borderRadius: '6px', background: 'var(--bear2)' }}><div style={{ fontSize: '7px', color: 'var(--bear)', textTransform: 'uppercase' }}>{s.stopLossLabel}</div><div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{Number(pt.stopLoss).toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>}
          </div>
        )}

        <div style={{ padding: '8px 14px', marginTop: 'auto', borderTop: '1px solid var(--rim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{analysis.publishedAt ? formatTimeAgoTA(analysis.publishedAt, locale) : ''}</span>
            {isHighImpact && <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--bear)' }}>🔥</span>}
            {quality > 0 && <span style={{ fontSize: '10px', fontWeight: 700, color: quality >= 80 ? 'var(--bull)' : quality >= 50 ? 'var(--gold)' : 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{quality}%</span>}
            {analysis.source && <span style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '3px', background: 'var(--surface-2)', color: 'var(--text3)' }}>{analysis.source === 'local' ? s.sourceLocal : s.sourceExternal}</span>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShowModal(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 10px', borderRadius: '6px', background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid var(--cyan2)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)' }}>
            {s.readMore}<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: s.dir === 'rtl' ? 'scaleX(-1)' : 'none' }}><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {showModal && <AnalysisModal analysis={analysis} locale={locale} title={title} content={content} sClass={sClass} sc={sc} sb={sb} si={si} isHighImpact={isHighImpact} symbols={symbols} quality={quality} pt={pt} assetIcon={assetIcon} copied={copied} onCopy={handleCopy} onClose={() => setShowModal(false)} />}
    </>
  );
}

interface ModalProps { analysis: ContentAnalysis; locale: TALocale; title: string; content: string; sClass: 'bullish' | 'bearish' | 'neutral'; sc: string; sb: string; si: string; isHighImpact: boolean; symbols: string[]; quality: number; pt: any; assetIcon: string; copied: boolean; onCopy: (e: React.MouseEvent) => void; onClose: () => void; }

function AnalysisModal({ analysis, locale, title, content, sClass, sc, sb, si, isHighImpact, symbols, quality, pt, assetIcon, copied, onCopy, onClose }: ModalProps) {
  const s = getTAStrings(locale);
  const isRTL = s.dir === 'rtl';
  const publishDate = analysis.publishedAt ? new Date(analysis.publishedAt) : null;
  const MONTHS: Record<string, string[]> = { ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'], en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], fr: ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'], tr: ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'], es: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'] };
  const AMPM: Record<string, { am: string; pm: string }> = { ar: { am: 'ص', pm: 'م' }, en: { am: 'AM', pm: 'PM' }, fr: { am: '', pm: '' }, tr: { am: 'ÖÖ', pm: 'ÖS' }, es: { am: 'a.m.', pm: 'p.m.' } };
  const formattedDate = (() => { if (!publishDate) return ''; const m = MONTHS[locale][publishDate.getMonth()]; const d = String(publishDate.getDate()).padStart(2, '0'); const y = publishDate.getFullYear(); const h24 = publishDate.getHours(); const min = String(publishDate.getMinutes()).padStart(2, '0'); const ap = h24 < 12 ? AMPM[locale].am : AMPM[locale].pm; let h12 = h24 % 12; if (h12 === 0) h12 = 12; if (locale === 'fr') return `${d} ${m} ${y}, ${String(h24).padStart(2,'0')}:${min}`; return `${d} ${m} ${y}, ${String(h12).padStart(2,'0')}:${min} ${ap}`; })();

  useEffect(() => { const p = document.body.style.overflow; document.body.style.overflow = 'hidden'; const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => { document.body.style.overflow = p; window.removeEventListener('keydown', h); }; }, [onClose]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(title);

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'mFI 0.2s ease' }}>
      <style>{`@keyframes mFI{from{opacity:0}to{opacity:1}}@keyframes mSU{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.ta-mc{max-height:88vh;overflow-y:auto;scrollbar-width:thin}.ta-mc::-webkit-scrollbar{width:6px}.ta-mc::-webkit-scrollbar-thumb{background:var(--rim);border-radius:3px}.ta-md{color:var(--text2);line-height:1.9;font-size:14px}.ta-md h1,.ta-md h2{display:none}.ta-md h3{color:var(--text-head);font-size:16px;font-weight:700;margin:20px 0 10px;padding-bottom:8px;border-bottom:1px solid var(--rim)}.ta-md h4{color:var(--cyan);font-size:14px;font-weight:700;margin:16px 0 8px}.ta-md p{margin:10px 0}.ta-md strong{color:var(--text-head);font-weight:700}.ta-md ul,.ta-md ol{margin:10px 0;padding-inline-start:24px}.ta-md li{margin:6px 0;color:var(--text2)}.ta-md ul li::marker{color:var(--cyan)}.ta-md blockquote{margin:14px 0;padding:10px 16px;background:var(--surface-2);border-inlineStart:3px solid var(--cyan);border-radius:6px}.ta-md code{background:var(--surface-2);padding:2px 6px;border-radius:4px;font-size:12px;color:var(--gold)}.ta-md hr{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--rim),transparent);margin:20px 0}`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg3)', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--rim)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'mSU 0.25s ease' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--rim)', background: `linear-gradient(135deg, ${sb}, transparent)`, position: 'relative', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '14px', insetInlineEnd: '14px', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--text3)', border: '1px solid var(--rim)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {symbols.map((sym, i) => <span key={i} style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono, monospace)', border: '1px solid var(--rim)' }}>{String(sym).replace('/USDT', '').replace('/USD', '')}</span>)}
            {assetIcon && <span style={{ fontSize: '16px' }}>{assetIcon}</span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: sb, color: sc }}>{si} {sLabel(sClass, locale)}</span>
            {isHighImpact && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--bear)', padding: '3px 8px', borderRadius: '4px', background: 'var(--bear2)' }}>🔥 {locale === 'ar' ? 'تأثير عالي' : 'High Impact'}</span>}
            {quality > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: quality >= 80 ? 'var(--bull)' : 'var(--gold)', padding: '3px 8px', borderRadius: '4px', background: 'var(--surface-2)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>🛡 {quality}%</span>}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-head)', lineHeight: 1.5, marginBottom: '8px', fontFamily: 'var(--font-readex-pro, Readex Pro, sans-serif)', paddingInlineEnd: '40px' }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>
            {formattedDate && <span>📅 {formattedDate}</span>}
            {analysis.category && <span style={{ color: 'var(--cyan)' }}>· {translateCategory(analysis.category || analysis.assetClass, locale)}</span>}
            {analysis.type && <span style={{ color: 'var(--purple)' }}>· {translateType(analysis.type || analysis.analysisType, locale)}</span>}
          </div>
        </div>

        <div className="ta-mc" style={{ padding: '22px 26px', flex: 1 }}>
          {(pt.current || pt.target || pt.stopLoss) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {pt.current != null && <div style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', background: 'var(--surface-2)' }}><div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase' }}>{s.currentLabel}</div><div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{Number(pt.current).toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>}
              {pt.target != null && <div style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', background: 'var(--bull2)' }}><div style={{ fontSize: '9px', color: 'var(--bull)', textTransform: 'uppercase' }}>{s.targetLabel}</div><div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bull)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{Number(pt.target).toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>}
              {pt.stopLoss != null && <div style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', background: 'var(--bear2)' }}><div style={{ fontSize: '9px', color: 'var(--bear)', textTransform: 'uppercase' }}>{s.stopLossLabel}</div><div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{Number(pt.stopLoss).toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>}
            </div>
          )}
          <div className="ta-md">{content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : <p style={{ color: 'var(--text3)' }}>{s.noAnalysesHint}</p>}</div>
          {Array.isArray(analysis.tags) && analysis.tags.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--rim)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {analysis.tags.slice(0, 10).map((tag, i) => <span key={i} style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: 'var(--surface-2)', color: 'var(--cyan)' }}>#{tag}</span>)}
            </div>
          )}
          {/* Share buttons */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--rim)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{s.shareOn}:</span>
            <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" style={{ padding: '5px 12px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text2)', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>{s.shareTwitter}</a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`} target="_blank" rel="noopener" style={{ padding: '5px 12px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text2)', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>{s.shareTelegram}</a>
            <a href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" style={{ padding: '5px 12px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text2)', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>{s.shareWhatsApp}</a>
            <button onClick={onCopy} style={{ padding: '5px 12px', borderRadius: '6px', background: copied ? 'var(--bull2)' : 'var(--surface-2)', color: copied ? 'var(--bull)' : 'var(--text2)', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>{copied ? s.copyLinkSuccess : s.shareCopy}</button>
          </div>
          <div style={{ marginTop: '16px', padding: '12px 14px', background: 'var(--gold2)', borderRadius: '8px', borderInlineStart: '3px solid var(--gold)', fontSize: '11px', color: 'var(--text2)', lineHeight: 1.7 }}>⚠️ {locale === 'ar' ? 'هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية.' : locale === 'fr' ? 'Cette analyse est à but éducatif uniquement.' : locale === 'es' ? 'Este análisis es solo educativo.' : locale === 'tr' ? 'Bu analiz eğitim amaçlıdır.' : 'This analysis is for educational purposes only.'}</div>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader
export function CardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px', borderInlineStart: '3px solid var(--rim)' }}>
      <div style={{ height: '60px', background: 'var(--surface-2)' }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ width: '60%', height: '10px', borderRadius: '4px', background: 'var(--surface-2)', marginBottom: '8px' }} />
        <div style={{ width: '90%', height: '12px', borderRadius: '4px', background: 'var(--surface-2)', marginBottom: '4px' }} />
        <div style={{ width: '70%', height: '12px', borderRadius: '4px', background: 'var(--surface-2)' }} />
      </div>
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--rim)' }}>
        <div style={{ width: '40%', height: '8px', borderRadius: '4px', background: 'var(--surface-2)' }} />
      </div>
    </div>
  );
}
