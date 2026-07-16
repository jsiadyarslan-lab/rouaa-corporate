'use client';

import React, { useEffect, useState, useCallback, useRef, Component } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// ─── Error Boundary ──────────────────────────────────────────────

const SIGNALS_ERROR_MSGS: Record<string, { title: string; message: string; retry: string }> = {
  ar: { title: 'حدث خطأ غير متوقع', message: 'حدث خطأ أثناء تحميل إشارات التداول. يرجى تحديث الصفحة.', retry: 'تحديث الصفحة' },
  en: { title: 'An unexpected error occurred', message: 'An error occurred while loading trading signals. Please refresh the page.', retry: 'Refresh Page' },
  fr: { title: 'Une erreur inattendue est survenue', message: 'Une erreur s\'est produite lors du chargement des signaux de trading. Veuillez actualiser la page.', retry: 'Actualiser' },
  tr: { title: 'Beklenmeyen bir hata oluştu', message: 'İşaret sinyalleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.', retry: 'Sayfayı Yenile' },
  es: { title: 'Ocurrió un error inesperado', message: 'Ocurrió un error al cargar las señales de trading. Por favor actualice la página.', retry: 'Actualizar Página' },
};

function detectSignalsLocale(): string {
  if (typeof window === 'undefined') return 'ar';
  const path = window.location.pathname;
  if (path.startsWith('/en')) return 'en';
  if (path.startsWith('/fr')) return 'fr';
  if (path.startsWith('/tr')) return 'tr';
  if (path.startsWith('/es')) return 'es';
  return 'ar';
}

class SignalsErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      const locale = detectSignalsLocale();
      const msgs = SIGNALS_ERROR_MSGS[locale] || SIGNALS_ERROR_MSGS.ar;
      const isRTL = locale === 'ar';
      return (
        <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'} style={{ background: '#080c14' }}>
          <div className="text-center p-8 rounded-2xl max-w-md" style={{ background: '#0c1120', border: '1px solid #162040' }}>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#eef2f8' }}>{msgs.title}</h2>
            <p className="text-sm mb-4" style={{ color: '#546580' }}>{msgs.message}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#00d4f0', color: '#080c14' }}>{msgs.retry}</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PlatformChart = dynamic(() => import('@/components/rouaa/charts/PlatformChart'), {
  ssr: false,
  loading: () => <div style={{ height: '350px', background: '#0c1120', borderRadius: '12px' }} />,
});

// ─── Types ───────────────────────────────────────────────────────

interface TradingSignal {
  id: string; pair: string; action: 'BUY' | 'SELL' | 'WAIT'; confidence: number;
  reason: string; entryPrice: number | null; stopLoss: number | null;
  takeProfit: number | null; riskReward?: number | null; status: string;
  createdAt: string; expiresAt: string; source?: string; category?: string;
  timeframe?: string; resultPips?: number | null; resultPercent?: number | null;
}
interface SignalStats { total: number; active: number; expired: number; executed: number; cancelled: number; }
interface CouncilBrief { id: string; pair: string; direction: 'BUY' | 'SELL'; entryPrice: number; stopLoss: number; takeProfit: number; confidence: number; timeframe: string; isActive: boolean; reviewStatus: string; analysisSummary?: string; issuedAt: string; expiresAt: string; consensus?: { totalModels: number; buyVotes: number; sellVotes: number; neutralVotes: number; modelVotes?: CouncilModelVote[]; }; }
interface CouncilModelVote { name: string; nameEn: string; vote: 'BUY' | 'SELL' | 'NEUTRAL'; confidence: number; reasoning?: string; }
interface ScannerItem { symbol: string; name: string; category: string; price: number; change: number; direction: string; technicalScore: number; confidence: number; smartScore?: { compositeScore: number } | number; rsi?: number; sparkline?: number[]; }

type ActiveTab = 'signals' | 'council' | 'scanner' | 'portfolio';
type ClassificationMode = 'pair' | 'timeframe' | 'strength';

// ─── Safe Number Utilities ───────────────────────────────────────

function safeNum(v: any, fallback: number = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'number' ? v : Number(v);
  return isNaN(n) ? fallback : n;
}

function safeToFixed(val: any, digits: number = 2, fallback: string = '—'): string {
  const n = safeNum(val, NaN);
  if (isNaN(n)) return fallback;
  return n.toFixed(digits);
}

function normalizeSignal(s: any): TradingSignal {
  const ep = s.entryPrice != null ? safeNum(s.entryPrice, NaN) : null;
  const sl = s.stopLoss != null ? safeNum(s.stopLoss, NaN) : null;
  const tp = s.takeProfit != null ? safeNum(s.takeProfit, NaN) : null;
  const rr = s.riskReward != null ? safeNum(s.riskReward, NaN) : null;
  return { ...s, confidence: safeNum(s.confidence, 50), entryPrice: (ep !== null && !isNaN(ep)) ? ep : null, stopLoss: (sl !== null && !isNaN(sl)) ? sl : null, takeProfit: (tp !== null && !isNaN(tp)) ? tp : null, riskReward: (rr !== null && !isNaN(rr)) ? rr : null, resultPips: s.resultPips != null ? safeNum(s.resultPips, 0) : null, resultPercent: s.resultPercent != null ? safeNum(s.resultPercent, 0) : null };
}

function normalizeScannerItem(item: any): ScannerItem {
  const safeSmartScore = (() => { if (!item.smartScore) return undefined; if (typeof item.smartScore === 'number') return { compositeScore: safeNum(item.smartScore, 0) } as any; return { ...item.smartScore, compositeScore: safeNum(item.smartScore?.compositeScore, 0) }; })();
  return { ...item, price: safeNum(item.price, 0), change: safeNum(item.change, 0), technicalScore: safeNum(item.technicalScore, 0), confidence: safeNum(item.confidence, 0), smartScore: safeSmartScore, rsi: item.rsi != null ? safeNum(item.rsi, 50) : undefined };
}

function normalizeCouncilBrief(b: any): CouncilBrief {
  const ep = safeNum(b.entryPrice, NaN); const sl = safeNum(b.stopLoss, NaN); const tp = safeNum(b.takeProfit, NaN);
  return { ...b, entryPrice: isNaN(ep) ? 0 : ep, stopLoss: isNaN(sl) ? 0 : sl, takePrice: isNaN(tp) ? 0 : tp, confidence: safeNum(b.confidence, 50) };
}

function smartFormatPrice(price: number | null, pair?: string): string {
  if (price === null || price === undefined) return '—';
  const numPrice = typeof price === 'number' ? price : Number(price);
  if (isNaN(numPrice)) return '—';
  const pairUpper = (pair || '').toUpperCase();
  if (pairUpper.includes('XAU') || pairUpper.includes('XAG')) return numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (pairUpper.includes('EUR') || pairUpper.includes('GBP') || pairUpper.includes('JPY') || pairUpper.includes('USD')) {
    if (pairUpper.includes('/') && !pairUpper.includes('XAU') && !pairUpper.includes('BTC') && !pairUpper.includes('ETH') && !pairUpper.includes('SOL')) return safeToFixed(numPrice, 4);
  }
  return '$' + numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcRR(signal: TradingSignal): number | null {
  const e = safeNum(signal.entryPrice, 0); const s = safeNum(signal.stopLoss, 0); const t = safeNum(signal.takeProfit, 0);
  if (!e || !s || !t) return signal.riskReward != null ? safeNum(signal.riskReward) : null;
  const risk = Math.abs(e - s); const reward = Math.abs(t - e);
  if (risk === 0) return null;
  return reward / risk;
}

// ─── Terminal Design System ──────────────────────────────────────

const T = {
  bg: '#080c14', bgPanel: '#0c1120', bgRow: '#0e1424', bgRowHover: '#121a2e',
  bgRowActive: '#141e34', border: '#162040', borderAccent: '#1e3060',
  cyan: '#00d4f0', cyanDim: 'rgba(0,212,240,0.08)', cyanMid: 'rgba(0,212,240,0.18)',
  green: '#00e87b', greenDim: 'rgba(0,232,123,0.08)', greenMid: 'rgba(0,232,123,0.18)',
  red: '#ff4466', redDim: 'rgba(255,68,102,0.08)', redMid: 'rgba(255,68,102,0.18)',
  gold: '#f0a800', goldDim: 'rgba(240,168,0,0.08)', goldMid: 'rgba(240,168,0,0.18)',
  purple: '#8b5cf6', purpleDim: 'rgba(139,92,246,0.08)', purpleMid: 'rgba(139,92,246,0.18)',
  text: '#c0cee0', textDim: '#546580', textBright: '#eef2f8',
  mono: 'var(--font-mono-price)',
};

const ACTION_CFG: Record<string, { label: string; color: string; dim: string; mid: string; icon: string }> = {
  BUY:  { label: 'شراء',  color: T.green, dim: T.greenDim, mid: T.greenMid, icon: '▲' },
  SELL: { label: 'بيع',   color: T.red,   dim: T.redDim,   mid: T.redMid,   icon: '▼' },
  WAIT: { label: 'انتظار', color: T.gold,  dim: T.goldDim,  mid: T.goldMid,  icon: '◆' },
  HOLD: { label: 'انتظار', color: T.gold,  dim: T.goldDim,  mid: T.goldMid,  icon: '◆' },
};

const TF_LABELS: Record<string, string> = { M5: '5د', M15: '15د', H1: '1س', H4: '4س', D1: 'يومي', W1: 'أسبوعي' };
const STRENGTH_CFG: Record<string, { label: string; color: string; dim: string; min: number; max: number }> = {
  strong:  { label: 'قوية',    color: T.green, dim: T.greenDim, min: 75, max: 100 },
  medium:  { label: 'متوسطة',  color: T.gold,  dim: T.goldDim,  min: 50, max: 74 },
  weak:    { label: 'ضعيفة',   color: T.red,   dim: T.redDim,   min: 0,  max: 49 },
};

const CHART_SYMBOLS = [
  { symbol: 'BTC', nameAr: 'بيتكوين' }, { symbol: 'ETH', nameAr: 'إيثريوم' },
  { symbol: 'XAU', nameAr: 'الذهب' }, { symbol: 'EUR', nameAr: 'يورو/دولار' },
  { symbol: 'WTI', nameAr: 'النفط' }, { symbol: 'SOL', nameAr: 'سولانا' },
];

// ─── Sparkline ───────────────────────────────────────────────────

function Sparkline({ signal, width = 72, height = 26 }: { signal: TradingSignal; width?: number; height?: number }) {
  const entry = safeNum(signal.entryPrice, 0);
  if (!entry) return <span style={{ color: T.textDim, fontSize: 10 }}>-</span>;
  const isBuy = signal.action === 'BUY';
  const tp = safeNum(signal.takeProfit, 0) || (isBuy ? entry * 1.005 : entry * 0.995);
  const pts = 16; const data: number[] = [];
  for (let i = 0; i < pts; i++) {
    const t = i / (pts - 1);
    const base = entry + (tp - entry) * t * 0.7;
    const noise = Math.sin(i * 1.8 + signal.confidence * 0.1) * Math.abs(tp - entry) * 0.08;
    data.push(base + noise);
  }
  const mn = Math.min(...data); const mx = Math.max(...data); const range = mx - mn || 1;
  const cfg = ACTION_CFG[signal.action] || ACTION_CFG.WAIT;
  const pathD = data.map((v, i) => { const x = (i / (pts - 1)) * width; const y = height - 3 - ((v - mn) / range) * (height - 6); return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ');
  const fillD = `${pathD} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ flexShrink: 0 }}>
      <defs><linearGradient id={`sg-${signal.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cfg.color} stopOpacity="0.12" /><stop offset="100%" stopColor={cfg.color} stopOpacity="0" /></linearGradient></defs>
      <path d={fillD} fill={`url(#sg-${signal.id})`} />
      <path d={pathD} fill="none" stroke={cfg.color} strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

// ─── Confidence Bar ──────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const v = safeNum(value, 0);
  const color = v >= 75 ? T.green : v >= 50 ? T.gold : T.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, direction: 'ltr', minWidth: 80 }}>
      <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontFamily: T.mono, fontSize: 11, color, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{v}%</span>
    </div>
  );
}

// ─── Signal Table Row ────────────────────────────────────────────

function SignalRow({ signal, isSelected, onClick }: { signal: TradingSignal; isSelected: boolean; onClick: () => void }) {
  const cfg = ACTION_CFG[signal.action] || ACTION_CFG.WAIT;
  const rr = calcRR(signal);
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '130px 68px 110px 88px 88px 88px 48px 76px',
        alignItems: 'center',
        padding: '10px 16px',
        background: isSelected ? cfg.mid : hover ? T.bgRowHover : 'transparent',
        borderRight: isSelected ? `3px solid ${cfg.color}` : '3px solid transparent',
        borderBottom: `1px solid ${T.border}`,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        direction: 'rtl',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.textBright }}>{signal.pair}</span>
        {signal.timeframe && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: T.cyanDim, color: T.cyan, fontFamily: T.mono, border: `1px solid ${T.cyan}22` }}>{TF_LABELS[signal.timeframe] || signal.timeframe}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, color: cfg.color }}>{cfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: T.mono }}>{cfg.label}</span>
      </div>
      <ConfidenceBar value={signal.confidence} />
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.cyan }}>{smartFormatPrice(signal.entryPrice, signal.pair)}</span>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.red }}>{smartFormatPrice(signal.stopLoss, signal.pair)}</span>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green }}>{smartFormatPrice(signal.takeProfit, signal.pair)}</span>
      {rr !== null ? (
        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: rr >= 2 ? T.green : rr >= 1 ? T.gold : T.red }}>{safeToFixed(rr, 1)}:1</span>
      ) : <span style={{ color: T.textDim, fontSize: 11 }}>—</span>}
      <Sparkline signal={signal} />
    </div>
  );
}

// ─── Formatted Analysis Component (Arabic) ────────────────────────

function FormattedAnalysisAr({ text }: { text: string }) {
  // Split into sections by ### headings
  const sections = text.split(/(?=###\s)/);

  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  for (const section of sections) {
    if (!section.trim()) continue;
    const lines = section.split('\n');
    const nodes: React.ReactNode[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Heading line: ### Some text
      if (trimmed.startsWith('### ')) {
        const headingText = trimmed.replace(/^###\s+/, '');
        nodes.push(
          <div key={`h-${keyIdx}`} style={{ fontSize: 11, fontWeight: 700, color: T.cyan, marginTop: 10, marginBottom: 4, lineHeight: 1.4 }}>
            {renderInlineMarkdownAr(headingText)}
          </div>
        );
      }
      // List item: - some text
      else if (trimmed.startsWith('- ')) {
        const itemText = trimmed.replace(/^-\s+/, '');
        nodes.push(
          <div key={`li-${keyIdx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.cyan, marginTop: 5, flexShrink: 0, opacity: 0.7 }} />
            <span style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{renderInlineMarkdownAr(itemText)}</span>
          </div>
        );
      }
      // Regular paragraph
      else {
        nodes.push(
          <div key={`p-${keyIdx}`} style={{ fontSize: 11, color: T.text, lineHeight: 1.6, marginBottom: 4 }}>
            {renderInlineMarkdownAr(trimmed)}
          </div>
        );
      }
      keyIdx++;
    }

    if (nodes.length > 0) {
      elements.push(<div key={`sec-${keyIdx}`} style={{ marginBottom: 8 }}>{nodes}</div>);
    }
  }

  return <>{elements}</>;
}

function renderInlineMarkdownAr(text: string): React.ReactNode {
  // Handle **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: T.textBright, fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ─── Signal Detail Drawer ────────────────────────────────────────

function SignalDetailDrawer({ signal, onClose }: { signal: TradingSignal | null; onClose: () => void }) {
  if (!signal) return null;
  const cfg = ACTION_CFG[signal.action] || ACTION_CFG.WAIT;
  const rr = calcRR(signal);

  const reasons: { text: string; positive: boolean }[] = [];
  if (signal.confidence >= 75) reasons.push({ text: `مستوى ثقة مرتفع (${signal.confidence}%) — توافق عدة مؤشرات فنية`, positive: true });
  else if (signal.confidence >= 50) reasons.push({ text: `مستوى ثقة متوسط (${signal.confidence}%) — بعض المؤشرات محايدة`, positive: false });
  else reasons.push({ text: `مستوى ثقة منخفض (${signal.confidence}%) — يحتاج تأكيد إضافي`, positive: false });
  if (rr !== null) {
    if (rr >= 2) reasons.push({ text: `نسبة المخاطرة/العائد ${safeToFixed(rr, 1)}:1 — ممتازة`, positive: true });
    else if (rr >= 1) reasons.push({ text: `نسبة المخاطرة/العائد ${safeToFixed(rr, 1)}:1 — مقبولة`, positive: false });
    else reasons.push({ text: `نسبة المخاطرة/العائد ${safeToFixed(rr, 1)}:1 — ضعيفة`, positive: false });
  }
  if (signal.reason) {
    const r = signal.reason.toLowerCase();
    if (r.includes('rsi') || r.includes('divergence') || r.includes('تباعد')) reasons.push({ text: 'تباعد RSI — مؤشر انعكاس قوي', positive: true });
    if (r.includes('ma') || r.includes('moving average') || r.includes('متوسط')) reasons.push({ text: 'تقاطع المتوسطات المتحركة يؤكد الاتجاه', positive: true });
    if (r.includes('macd')) reasons.push({ text: 'تقاطع MACD يدعم الصفقة', positive: true });
    if (r.includes('support') || r.includes('resistance') || r.includes('دعم') || r.includes('مقاومة')) reasons.push({ text: 'السعر عند مستوى دعم/مقاومة رئيسي', positive: true });
  }
  if (reasons.length <= 2) reasons.push({ text: signal.confidence >= 60 ? 'التحليل الفني يشير لفرصة معقولة' : 'ينصح بالانتظار لتأكيد إضافي', positive: signal.confidence >= 60 });

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = Date.now(); const expiry = new Date(signal.expiresAt).getTime(); const remaining = expiry - now;
      if (remaining <= 0) { setTimeLeft('منتهية'); return; }
      const h = Math.floor(remaining / 3600000); const m = Math.floor((remaining % 3600000) / 60000); const s = Math.floor((remaining % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}س ${m}د`); else if (m > 0) setTimeLeft(`${m}د ${s}ث`); else setTimeLeft(`${s}ث`);
    };
    update(); const iv = setInterval(() => { if (document.hidden) return; update(); }, 1000); return () => clearInterval(iv);
  }, [signal.expiresAt, signal.createdAt]);

  return (
    <div className="fixed inset-0 z-[9999] flex" style={{ background: 'rgba(4,6,12,0.75)', backdropFilter: 'blur(6px)', paddingTop: '68px' }} onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto"
        style={{ marginRight: 'auto', background: 'linear-gradient(180deg, #0a1020, #080c18)', borderRight: `1px solid ${cfg.color}20`, boxShadow: `10px 0 40px ${cfg.color}06`, animation: 'drawerInRTL 0.3s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes drawerInRTL { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        <div style={{ padding: 20, borderBottom: `1px solid ${T.border}`, background: `linear-gradient(135deg, ${cfg.dim}, transparent)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: T.textBright }}>{signal.pair}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: cfg.mid, color: cfg.color, border: `1px solid ${cfg.color}30` }}>{cfg.icon} {cfg.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {signal.timeframe && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}18` }}>{TF_LABELS[signal.timeframe] || signal.timeframe}</span>}
                <ConfidenceBar value={signal.confidence} />
              </div>
            </div>
            <button onClick={onClose} style={{ background: T.bgRow, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', color: T.textDim, cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'سعر الدخول', value: smartFormatPrice(signal.entryPrice, signal.pair), color: T.cyan, bg: T.cyanDim },
              { label: 'وقف الخسارة', value: smartFormatPrice(signal.stopLoss, signal.pair), color: T.red, bg: T.redDim },
              { label: 'جني الأرباح', value: smartFormatPrice(signal.takeProfit, signal.pair), color: T.green, bg: T.greenDim },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 8px', borderRadius: 8, background: item.bg, border: `1px solid ${item.color}12`, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: item.color, marginBottom: 3, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          {rr !== null && (
            <div style={{ padding: 12, borderRadius: 8, background: T.cyanDim, border: `1px solid ${T.cyan}10`, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: T.textDim }}>نسبة المخاطرة/العائد</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: rr >= 2 ? T.green : rr >= 1 ? T.gold : T.red }}>{safeToFixed(rr, 1)}:1</span>
              </div>
              <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((rr / 4) * 100, 100)}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${T.red}, ${T.gold}, ${T.green})` }} />
              </div>
            </div>
          )}
          <div style={{ padding: 14, borderRadius: 8, background: T.purpleDim, border: `1px solid ${T.purple}12`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 10 }}>لماذا هذه الإشارة قوية؟</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.positive ? T.green : T.gold, marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
          {signal.reason && (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, marginBottom: 6, letterSpacing: '0.05em' }}>التحليل</div>
              <FormattedAnalysisAr text={signal.reason} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span style={{ fontSize: 10, color: T.textDim }}>وقت الانتهاء</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: timeLeft === 'منتهية' ? T.red : T.textBright }}>{timeLeft}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Signal Group View ───────────────────────────────────────────

function SignalGroupView({ signals, mode, onSelect, selectedId }: { signals: TradingSignal[]; mode: ClassificationMode; onSelect: (s: TradingSignal) => void; selectedId: string | null }) {
  const groups: { key: string; label: string; color: string; dim: string; signals: TradingSignal[] }[] = [];

  if (mode === 'pair') {
    const map: Record<string, TradingSignal[]> = {};
    signals.forEach(s => { if (!map[s.pair]) map[s.pair] = []; map[s.pair].push(s); });
    Object.entries(map).forEach(([pair, sigs]) => { const cfg = ACTION_CFG[sigs[0]?.action || 'WAIT'] || ACTION_CFG.WAIT; groups.push({ key: pair, label: pair, color: cfg.color, dim: cfg.dim, signals: sigs }); });
  } else if (mode === 'timeframe') {
    const map: Record<string, TradingSignal[]> = {};
    signals.forEach(s => { const k = s.timeframe || 'H1'; if (!map[k]) map[k] = []; map[k].push(s); });
    ['M5', 'M15', 'H1', 'H4', 'D1', 'W1'].forEach(tf => { if (map[tf]) groups.push({ key: tf, label: TF_LABELS[tf] || tf, color: T.cyan, dim: T.cyanDim, signals: map[tf] }); });
  } else if (mode === 'strength') {
    ['strong', 'medium', 'weak'].forEach(key => { const conf = STRENGTH_CFG[key]; const sigs = signals.filter(s => s.confidence >= conf.min && s.confidence <= conf.max); if (sigs.length > 0) groups.push({ key, label: conf.label, color: conf.color, dim: conf.dim, signals: sigs }); });
  }

  if (groups.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map(group => (
        <div key={group.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '0 16px' }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: group.color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: group.color, fontFamily: T.mono }}>{group.label}</span>
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: group.dim, color: group.color, fontWeight: 700, border: `1px solid ${group.color}20` }}>{group.signals.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 68px 110px 88px 88px 88px 48px 76px', padding: '6px 16px', borderBottom: `1px solid ${T.border}`, background: T.bgPanel, fontSize: 9, fontWeight: 700, color: T.textDim, letterSpacing: '0.05em', direction: 'rtl' }}>
            <span>الزوج</span><span>الإجراء</span><span>الثقة</span><span>الدخول</span><span>الوقف</span><span>الهدف</span><span>م/م</span><span>الاتجاه</span>
          </div>
          {group.signals.map(signal => <SignalRow key={signal.id} signal={signal} isSelected={selectedId === signal.id} onClick={() => onSelect(signal)} />)}
        </div>
      ))}
    </div>
  );
}

// ─── Council Brief Card ──────────────────────────────────────────

function CouncilBriefCard({ brief }: { brief: CouncilBrief }) {
  const cfg = ACTION_CFG[brief.direction] || ACTION_CFG.WAIT;
  const buyVotes = brief.consensus?.buyVotes ?? (brief.direction === 'BUY' ? Math.ceil(brief.confidence / 100 * 8) : Math.floor((100 - brief.confidence) / 100 * 8));
  const sellVotes = brief.consensus?.sellVotes ?? (8 - buyVotes);

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', background: T.bgPanel, border: `1px solid ${T.purple}15` }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${T.purple}44, transparent)` }} />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ConfidenceBar value={brief.confidence} />
            <div>
              <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: T.textBright }}>{brief.pair}</span>
              <span style={{ fontSize: 9, display: 'block', color: T.purple }}>إجماع المجلس الذكي</span>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: cfg.mid, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
        </div>
        <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden', marginBottom: 10, background: T.border }}>
          {buyVotes > 0 && <div style={{ width: `${(buyVotes / 8) * 100}%`, background: T.greenDim, color: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{buyVotes} شراء</div>}
          {sellVotes > 0 && <div style={{ width: `${(sellVotes / 8) * 100}%`, background: T.redDim, color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{sellVotes} بيع</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
          {[
            { l: 'الدخول', v: smartFormatPrice(brief.entryPrice, brief.pair), c: T.cyan },
            { l: 'الوقف', v: smartFormatPrice(brief.stopLoss, brief.pair), c: T.red },
            { l: 'الهدف', v: smartFormatPrice(brief.takeProfit, brief.pair), c: T.green },
          ].map(p => (
            <div key={p.l} style={{ padding: '6px 4px', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: `1px solid ${p.c}08`, textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: p.c }}>{p.l}</div>
              <div style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: p.c }}>{p.v}</div>
            </div>
          ))}
        </div>
        {brief.analysisSummary && <p style={{ fontSize: 10, color: T.text, lineHeight: 1.5, margin: 0 }}>{brief.analysisSummary.length > 150 ? brief.analysisSummary.substring(0, 150) + '...' : brief.analysisSummary}</p>}
      </div>
    </div>
  );
}

// ─── Scanner Item ────────────────────────────────────────────────

function ScannerItemRow({ item }: { item: ScannerItem }) {
  const cfg = ACTION_CFG[item.direction?.toUpperCase()] || ACTION_CFG.WAIT;
  const isPositive = item.change >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: T.bgPanel, border: `1px solid ${T.border}` }}>
      <div style={{ width: 24, height: 24, borderRadius: 4, background: cfg.dim, border: `1px solid ${cfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: cfg.color }}>{cfg.icon}</span>
      </div>
      <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.textBright }}>{item.symbol}</span>
      <span style={{ fontSize: 9, color: T.textDim }}>{item.category}</span>
      {item.price > 0 && <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text, marginRight: 'auto' }}>${item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>}
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: isPositive ? T.greenDim : T.redDim, color: isPositive ? T.green : T.red }}>
        {isPositive ? '+' : ''}{safeToFixed(item.change, 2)}%
      </span>
      {item.rsi != null && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: item.rsi < 30 ? T.greenDim : item.rsi > 70 ? T.redDim : 'rgba(255,255,255,0.03)', color: item.rsi < 30 ? T.green : item.rsi > 70 ? T.red : T.textDim }}>RSI {safeToFixed(item.rsi, 0, '50')}</span>}
    </div>
  );
}

// ─── Currency Strength ───────────────────────────────────────────

function CurrencyStrength({ signals }: { signals: TradingSignal[] }) {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'XAU', 'BTC', 'ETH', 'SOL'];
  const map: Record<string, { score: number; count: number }> = {};
  signals.forEach(s => { const pair = s.pair.toUpperCase(); currencies.forEach(cur => { if (pair.includes(cur)) { if (!map[cur]) map[cur] = { score: 0, count: 0 }; map[cur].score += s.confidence; map[cur].count++; } }); });
  const data = currencies.filter(c => map[c]).map(c => ({ currency: c, avg: Math.round(map[c].score / map[c].count) })).sort((a, b) => b.avg - a.avg);
  if (data.length === 0) return null;

  return (
    <div style={{ padding: 14, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textBright, marginBottom: 10, fontFamily: T.mono }}>قوة العملات</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map(item => {
          const color = item.avg >= 75 ? T.green : item.avg >= 50 ? T.gold : T.red;
          return (
            <div key={item.currency} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.textBright, minWidth: 28 }}>{item.currency}</span>
              <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${item.avg}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color, minWidth: 24, textAlign: 'right' }}>{item.avg}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Portfolio Tab ───────────────────────────────────────────────

function PortfolioTab({ signals, stats }: { signals: TradingSignal[]; stats: SignalStats | null }) {
  const wins = signals.filter(s => s.status === 'HIT_TP').length;
  const losses = signals.filter(s => s.status === 'HIT_SL').length;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const active = signals.filter(s => s.status === 'ACTIVE');
  const closed = signals.filter(s => ['HIT_TP', 'HIT_SL', 'EXECUTED', 'EXPIRED'].includes(s.status));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'نسبة الربح', value: `${winRate}%`, color: winRate >= 50 ? T.green : T.red },
          { label: 'إشارات نشطة', value: active.length, color: T.cyan },
          { label: 'الإجمالي', value: stats?.total ?? signals.length, color: T.text },
          { label: 'منفذة', value: closed.length, color: T.purple },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '10px 12px', borderRadius: 6, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 9, color: T.textDim, fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SignalsPageClientWrapper() {
  return (<SignalsErrorBoundary><SignalsPageClient /></SignalsErrorBoundary>);
}

function SignalsPageClient() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [briefs, setBriefs] = useState<CouncilBrief[]>([]);
  const [scannerItems, setScannerItems] = useState<ScannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('signals');
  const [selectedChartSymbol, setSelectedChartSymbol] = useState('BTC');
  const [classificationMode, setClassificationMode] = useState<ClassificationMode>('pair');
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [activeRes, historyRes, statsRes, briefsRes, scannerRes] = await Promise.allSettled([
        fetch('/api/integration/signals?mode=active&limit=50', { cache: 'no-store' }),
        fetch('/api/integration/signals?mode=history&limit=50', { cache: 'no-store' }),
        fetch('/api/integration/signals?mode=stats', { cache: 'no-store' }),
        fetch('/api/integration/council?mode=briefs', { cache: 'no-store' }),
        fetch('/api/integration/scanner?mode=overview', { cache: 'no-store' }),
      ]);
      const allSignals: TradingSignal[] = [];
      if (activeRes.status === 'fulfilled' && activeRes.value.ok) { const data = await activeRes.value.json(); const raw = Array.isArray(data) ? data : data.signals || []; allSignals.push(...raw.map(normalizeSignal)); }
      if (historyRes.status === 'fulfilled' && historyRes.value.ok) { const data = await historyRes.value.json(); const raw = Array.isArray(data) ? data : data.signals || []; const ids = new Set(allSignals.map(s => s.id)); raw.forEach((s: any) => { if (!ids.has(s.id)) allSignals.push(normalizeSignal(s)); }); }
      setSignals(allSignals);
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) { const data = await statsRes.value.json(); if (data.total !== undefined) setStats(data); }
      if (briefsRes.status === 'fulfilled' && briefsRes.value.ok) { const data = await briefsRes.value.json(); const list = data?.data?.active || data?.active || data?.data || []; if (Array.isArray(list)) setBriefs(list.map(normalizeCouncilBrief)); }
      if (scannerRes.status === 'fulfilled' && scannerRes.value.ok) { const data = await scannerRes.value.json(); const sd = data?.data || data; const items = sd?.items || sd?.topGainers || sd?.strongestSignals || []; if (Array.isArray(items) && items.length > 0) setScannerItems(items.map(normalizeScannerItem)); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(() => { if (document.hidden) return; fetchData(); }, 60000); return () => clearInterval(interval); }, [fetchData]);

  const activeSignals = signals.filter(s => s.status === 'ACTIVE');
  const classifiableSignals = signals.length > 0 ? signals : [];

  const tabItems: { key: ActiveTab; label: string; color: string; count: number }[] = [
    { key: 'signals', label: 'الإشارات', color: T.cyan, count: activeSignals.length },
    { key: 'council', label: 'المجلس الذكي', color: T.purple, count: briefs.length },
    { key: 'scanner', label: 'السكانر', color: T.gold, count: scannerItems.length },
    { key: 'portfolio', label: 'المحفظة', color: T.green, count: 0 },
  ];

  const filterTabs: { key: ClassificationMode; label: string }[] = [
    { key: 'pair', label: 'حسب الأزواج' },
    { key: 'timeframe', label: 'حسب التوقيت' },
    { key: 'strength', label: 'حسب القوة' },
  ];

  return (
    <main className="min-h-screen" style={{ background: T.bg }}>
      <div dir="rtl">
        {/* ═══════ HEADER ═══════ */}
        <header style={{ borderBottom: `1px solid ${T.border}`, background: 'linear-gradient(180deg, #0a1020, #080c14)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, ${T.cyan}08, ${T.purple}08)`, border: `1px solid ${T.cyan}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.cyan} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
                <div>
                  <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 800, color: T.textBright, margin: 0, lineHeight: 1.2 }}>إشارات التداول</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: T.greenDim, color: T.green, border: `1px solid ${T.green}20`, letterSpacing: '0.08em' }}>● مباشر</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}15`, letterSpacing: '0.1em' }}>TERMINAL</span>
                  </div>
                </div>
              </div>
              <Link href="/markets" style={{ fontSize: 11, padding: '6px 14px', borderRadius: 6, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}12`, textDecoration: 'none', fontWeight: 600 }}>مركز الأسواق ←</Link>
            </div>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'نشطة', value: stats.active, color: T.green },
                  { label: 'منفذة', value: stats.executed, color: T.cyan },
                  { label: 'منتهية', value: stats.expired, color: T.textDim },
                  { label: 'الإجمالي', value: stats.total, color: T.purple },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '8px 12px', borderRadius: 6, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                    <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 9, color: T.textDim, fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ═══════ TAB NAV ═══════ */}
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            {tabItems.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: activeTab === tab.key ? `${tab.color}18` : 'transparent',
                color: activeTab === tab.key ? tab.color : T.textDim,
                border: activeTab === tab.key ? `1px solid ${tab.color}30` : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {tab.label}
                {tab.count > 0 && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: `${tab.color}10`, color: tab.color, marginRight: 4 }}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════ TAB CONTENT ═══════ */}
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 20px 24px' }}>

          {/* ── Signals Tab ── */}
          {activeTab === 'signals' && (
            <>
              {classifiableSignals.length > 0 ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <CurrencyStrength signals={classifiableSignals} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                    {filterTabs.map(tab => (
                      <button key={tab.key} onClick={() => setClassificationMode(tab.key)} style={{
                        flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: classificationMode === tab.key ? T.cyanMid : 'transparent',
                        color: classificationMode === tab.key ? T.cyan : T.textDim,
                        border: classificationMode === tab.key ? `1px solid ${T.cyan}30` : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, overflowX: 'auto' }}>
                    <SignalGroupView signals={classifiableSignals} mode={classificationMode} onSelect={setSelectedSignal} selectedId={selectedSignal?.id ?? null} />
                  </div>
                </>
              ) : loading ? (
                <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: T.textDim }}>جاري التحميل...</p>
                </div>
              ) : (
                <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>لا توجد إشارات تداول حالياً</p>
                  <p style={{ fontSize: 12, color: T.textDim }}>يتم إنشاء الإشارات تلقائياً بواسطة الذكاء الاصطناعي</p>
                </div>
              )}
              <SignalDetailDrawer signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
            </>
          )}

          {/* ── Council Tab ── */}
          {activeTab === 'council' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textBright }}>إحاطات المجلس الذكي</span>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: T.purpleDim, color: T.purple }}>8 نماذج ذكاء اصطناعي</span>
              </div>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{[1, 2].map(i => <div key={i} style={{ height: 200, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}` }} />)}</div>
              ) : briefs.length === 0 ? (
                <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: T.text }}>لا توجد إحاطات نشطة من المجلس الذكي</p>
                  <p style={{ fontSize: 11, color: T.textDim }}>يعقد المجلس جلسة كل ساعة</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{briefs.map(brief => <CouncilBriefCard key={brief.id} brief={brief} />)}</div>
              )}
            </>
          )}

          {/* ── Portfolio Tab ── */}
          {activeTab === 'portfolio' && <PortfolioTab signals={signals} stats={stats} />}

          {/* ── Scanner Tab ── */}
          {activeTab === 'scanner' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textBright }}>فحص السوق</span>
              </div>
              {scannerItems.length === 0 ? (
                <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: T.text }}>لا توجد بيانات سكانر متاحة حالياً</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{scannerItems.map((item, idx) => <ScannerItemRow key={item.symbol || idx} item={item} />)}</div>
              )}
            </>
          )}
        </div>

        {/* ═══════ LIVE CHART ═══════ */}
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.textBright }}>شارت مباشر</span>
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: T.greenDim, color: T.green, border: `1px solid ${T.green}20` }}>● LIVE</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {CHART_SYMBOLS.map(cs => (
              <button key={cs.symbol} onClick={() => setSelectedChartSymbol(cs.symbol)} style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: selectedChartSymbol === cs.symbol ? T.cyan : 'rgba(255,255,255,0.03)',
                color: selectedChartSymbol === cs.symbol ? T.bg : T.textDim,
                border: `1px solid ${selectedChartSymbol === cs.symbol ? T.cyan : T.border}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {cs.nameAr}
              </button>
            ))}
          </div>
          <div style={{ borderRadius: 8, overflow: 'hidden', background: T.bgPanel, border: `1px solid ${T.border}` }}>
            <PlatformChart symbol={selectedChartSymbol} nameAr={CHART_SYMBOLS.find(c => c.symbol === selectedChartSymbol)?.nameAr} locale="ar" height={350} showVolume={true} showToolbar={true} />
          </div>
        </div>

        {/* ═══════ DISCLAIMER ═══════ */}
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 20px 24px' }}>
          <div style={{ padding: 14, borderRadius: 8, background: T.goldDim, border: `1px solid ${T.gold}18`, fontSize: 11, color: T.text, lineHeight: 1.6 }}>
            <strong style={{ color: T.gold }}>تنبيه:</strong> الإشارات المقدمة هي توصيات مبنية على تحليل الذكاء الاصطناعي ولا تُعد نصيحة مالية. التداول ينطوي على مخاطر عالية وقد تخسر رأس مالك.
          </div>
        </div>
      </div>
    </main>
  );
}
