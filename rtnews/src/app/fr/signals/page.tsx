'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────

interface TradingSignal {
  id: string; pair: string; action: 'BUY' | 'SELL' | 'WAIT'; confidence: number;
  reason: string; entryPrice: number | null; stopLoss: number | null;
  takeProfit: number | null; riskReward?: number | null; status: string;
  createdAt: string; expiresAt: string; source?: string; category?: string;
  timeframe?: string; resultPips?: number | null; resultPercent?: number | null;
}

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
  return {
    ...s, confidence: safeNum(s.confidence, 50),
    entryPrice: (ep !== null && !isNaN(ep)) ? ep : null,
    stopLoss: (sl !== null && !isNaN(sl)) ? sl : null,
    takeProfit: (tp !== null && !isNaN(tp)) ? tp : null,
    riskReward: (rr !== null && !isNaN(rr)) ? rr : null,
    resultPips: s.resultPips != null ? safeNum(s.resultPips, 0) : null,
    resultPercent: s.resultPercent != null ? safeNum(s.resultPercent, 0) : null,
  };
}

function smartFormatPrice(price: number | null, pair?: string): string {
  if (price === null || price === undefined) return '—';
  const numPrice = typeof price === 'number' ? price : Number(price);
  if (isNaN(numPrice)) return '—';
  const pairUpper = (pair || '').toUpperCase();
  if (pairUpper.includes('XAU') || pairUpper.includes('XAG'))
    return numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (pairUpper.includes('EUR') || pairUpper.includes('GBP') || pairUpper.includes('JPY') || pairUpper.includes('USD')) {
    if (pairUpper.includes('/') && !pairUpper.includes('XAU') && !pairUpper.includes('BTC') && !pairUpper.includes('ETH') && !pairUpper.includes('SOL'))
      return safeToFixed(numPrice, 4);
  }
  return '$' + numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcRR(signal: TradingSignal): number | null {
  const e = safeNum(signal.entryPrice, 0);
  const s = safeNum(signal.stopLoss, 0);
  const t = safeNum(signal.takeProfit, 0);
  if (!e || !s || !t) return signal.riskReward != null ? safeNum(signal.riskReward) : null;
  const risk = Math.abs(e - s);
  const reward = Math.abs(t - e);
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

// ─── French Labels ───────────────────────────────────────────────

const ACTION_CFG: Record<string, { label: string; color: string; dim: string; mid: string; icon: string }> = {
  BUY:  { label: 'Achat',  color: T.green, dim: T.greenDim, mid: T.greenMid, icon: '▲' },
  SELL: { label: 'Vente',  color: T.red,   dim: T.redDim,   mid: T.redMid,   icon: '▼' },
  WAIT: { label: 'Attente', color: T.gold,  dim: T.goldDim,  mid: T.goldMid,  icon: '◆' },
  HOLD: { label: 'Conserver', color: T.gold, dim: T.goldDim,  mid: T.goldMid,  icon: '◆' },
};

const TF_LABELS: Record<string, string> = {
  M5: '5 Min',
  M15: '15 Min',
  H1: '1H',
  H4: '4H',
  D1: '1J',
  W1: '1S',
};

const STRENGTH_CFG: Record<string, { label: string; color: string; dim: string; min: number; max: number }> = {
  strong:  { label: 'Fort',    color: T.green, dim: T.greenDim, min: 75, max: 100 },
  medium:  { label: 'Moyen',   color: T.gold,  dim: T.goldDim,  min: 50, max: 74 },
  weak:    { label: 'Faible',  color: T.red,   dim: T.redDim,   min: 0,  max: 49 },
};

// ─── Sparkline Component ─────────────────────────────────────────

function Sparkline({ signal, width = 72, height = 26 }: { signal: TradingSignal; width?: number; height?: number }) {
  const entry = safeNum(signal.entryPrice, 0);
  if (!entry) return <span style={{ color: T.textDim, fontSize: 10 }}>-</span>;

  const isBuy = signal.action === 'BUY';
  const tp = safeNum(signal.takeProfit, 0) || (isBuy ? entry * 1.005 : entry * 0.995);
  const pts = 16;
  const data: number[] = [];
  for (let i = 0; i < pts; i++) {
    const t = i / (pts - 1);
    const base = entry + (tp - entry) * t * 0.7;
    const noise = Math.sin(i * 1.8 + signal.confidence * 0.1) * Math.abs(tp - entry) * 0.08;
    data.push(base + noise);
  }
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const range = mx - mn || 1;
  const cfg = ACTION_CFG[signal.action] || ACTION_CFG.WAIT;

  const pathD = data.map((v, i) => {
    const x = (i / (pts - 1)) * width;
    const y = height - 3 - ((v - mn) / range) * (height - 6);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
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
        gridTemplateColumns: '140px 72px 110px 90px 90px 90px 52px 76px',
        alignItems: 'center',
        padding: '10px 16px',
        background: isSelected ? cfg.mid : hover ? T.bgRowHover : 'transparent',
        borderLeft: isSelected ? `3px solid ${cfg.color}` : '3px solid transparent',
        borderBottom: `1px solid ${T.border}`,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* Paire + Horizon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.textBright }}>{signal.pair}</span>
        {signal.timeframe && (
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: T.cyanDim, color: T.cyan, fontFamily: T.mono, border: `1px solid ${T.cyan}22` }}>
            {TF_LABELS[signal.timeframe] || signal.timeframe}
          </span>
        )}
      </div>

      {/* Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, color: cfg.color }}>{cfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: T.mono }}>{cfg.label}</span>
      </div>

      {/* Confiance */}
      <ConfidenceBar value={signal.confidence} />

      {/* Entrée */}
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.cyan }}>{smartFormatPrice(signal.entryPrice, signal.pair)}</span>

      {/* SL */}
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.red }}>{smartFormatPrice(signal.stopLoss, signal.pair)}</span>

      {/* TP */}
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.green }}>{smartFormatPrice(signal.takeProfit, signal.pair)}</span>

      {/* R:R */}
      {rr !== null ? (
        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: rr >= 2 ? T.green : rr >= 1 ? T.gold : T.red }}>
          {safeToFixed(rr, 1)}:1
        </span>
      ) : <span style={{ color: T.textDim, fontSize: 11 }}>—</span>}

      {/* Tendance */}
      <Sparkline signal={signal} />
    </div>
  );
}

// ─── Arabic → French Translation Utility ─────────────────────────

const AR_FR_MAP: [RegExp, string][] = [
  // Headings & structure
  [/الاستراتيجية النهائية للتداول على/gi, 'Stratégie finale de trading sur'],
  [/تنبيه المخاطر/gi, 'Avertissement sur les risques'],
  [/سياق الأخبار/gi, 'Contexte des actualités'],

  // Strategy intro
  [/بناءً على تحليلات المجلس المختلفة، يُنصح بالتوجه إلى استراتيجية/gi, 'Sur la base des diverses analyses du conseil, il est recommandé d\'adopter une stratégie'],
  [/على زوج/gi, 'sur la paire'],

  // Council members
  [/محلل السيناريوهات/gi, 'Analyste de scénarios'],
  [/المحلل الفني/gi, 'Analyste technique'],
  [/خبير المخاطر/gi, 'Expert en risques'],
  [/خبير الأنماط/gi, 'Expert en configurations'],
  [/استراتيجي التنفيذ/gi, 'Stratège d\'exécution'],
  [/محلل التباين/gi, 'Analyste de divergence'],

  // Council consensus
  [/إجماع المجلس/gi, 'Consensus du conseil'],
  [/نماذج/gi, 'modèles'],
  [/بيع واضح/gi, 'VENTE claire'],
  [/شراء واضح/gi, 'ACHAT clair'],
  [/بنسبة ثقة/gi, 'avec une confiance de'],

  // Vote descriptions
  [/تأييد لبيع/gi, 'soutien à la VENTE'],
  [/تأييد لشراء/gi, 'soutien à l\'ACHAT'],
  [/تأييد للحفاظ على المركز الحالي \(HOLD\)/gi, 'recommandation de CONSERVER'],
  [/تأييد/gi, 'soutien'],

  // Signal types
  [/إشارة شراء/gi, 'Signal d\'achat'],
  [/إشارة بيع/gi, 'Signal de vente'],
  [/إشارة انتظار/gi, 'Signal d\'attente'],
  [/بيع \(SELL\)/gi, 'VENTE'],
  [/شراء \(BUY\)/gi, 'ACHAT'],
  [/بيع/gi, 'VENTE'],
  [/شراء/gi, 'ACHAT'],

  // Common analysis phrases
  [/التحليل الفني يشير لاتجاه صاعد محتمل/gi, 'L\'analyse technique suggère une tendance haussière potentielle'],
  [/التحليل الفني يشير لاتجاه هابط محتمل/gi, 'L\'analyse technique suggère une tendance baissière potentielle'],
  [/التحليل الفني يشير لفرصة معقولة/gi, 'L\'analyse technique suggère une opportunité raisonnable'],
  [/السوق متذبذب بدون اتجاه واضح/gi, 'Le marché est volatil sans direction claire'],
  [/بيانات غير كافية لتحديد اتجاه واضح/gi, 'Données insuffisantes pour déterminer une direction claire'],
  [/ينصح بالانتظار لتأكيد إضافي/gi, 'Il est recommandé d\'attendre une confirmation supplémentaire'],

  // Technical terms
  [/تباعد RSI/gi, 'Divergence RSI'],
  [/مؤشر انعكاس قوي/gi, 'Signal de retournement fort'],
  [/تقاطع المتوسطات المتحركة يؤكد الاتجاه/gi, 'Le croisement des moyennes mobiles confirme la direction'],
  [/تقاطع MACD يدعم الصفقة/gi, 'Le croisement MACD soutient le trade'],
  [/السعر عند مستوى دعم\/مقاومة رئيسي/gi, 'Le prix est à un niveau de support/résistance clé'],
  [/دعم/gi, 'support'],
  [/مقاومة/gi, 'résistance'],
  [/متوسط متحرك/gi, 'Moyenne mobile'],
  [/تقاطع/gi, 'croisement'],

  // Risk warning phrasing
  [/هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية/gi, 'Cette analyse est à des fins éducatives uniquement et ne constitue pas un conseil en investissement'],

  // News context
  [/مشاعر=/gi, 'Sentiment='],
  [/لا أخبار متاحة/gi, 'Aucune actualité disponible'],
  [/مخاطر=/gi, 'Risque='],
  [/نقاط=/gi, 'Points='],
  [/خبر حديث/gi, 'actualité récente'],
  [/محايد/gi, 'neutre'],
  [/إيجابي/gi, 'positif'],
  [/سلبي/gi, 'négatif'],
  [/مرتفع/gi, 'élevé'],
  [/منخفض/gi, 'faible'],

  // Connectors & misc
  [/بناءً على/gi, 'Sur la base de'],
  [/يُنصح/gi, 'Il est recommandé'],
  [/سابقة بناءً على التحليل الفني \(محلي\)/gi, 'basé sur l\'analyse technique (locale)'],
];

function translateAnalysisToFr(text: string): string {
  let result = text;
  for (const [pattern, replacement] of AR_FR_MAP) {
    result = result.replace(pattern, replacement);
  }

  // Fallback: remove any remaining Arabic characters that weren't translated
  result = result.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '').trim();
  result = result.replace(/\s{2,}/g, ' ').replace(/\.\s*\./g, '.').replace(/,\s*,/g, ',').replace(/\(\s*\)/g, '').trim();

  return result;
}

// ─── Formatted Analysis Component ─────────────────────────────────

function FormattedAnalysis({ text }: { text: string }) {
  const translated = translateAnalysisToFr(text);

  // Split into sections by ### headings
  const sections = translated.split(/(?=###\s)/);

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
            {renderInlineMarkdown(headingText)}
          </div>
        );
      }
      // List item: - some text
      else if (trimmed.startsWith('- ')) {
        const itemText = trimmed.replace(/^-\s+/, '');
        nodes.push(
          <div key={`li-${keyIdx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.cyan, marginTop: 5, flexShrink: 0, opacity: 0.7 }} />
            <span style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{renderInlineMarkdown(itemText)}</span>
          </div>
        );
      }
      // Regular paragraph
      else {
        nodes.push(
          <div key={`p-${keyIdx}`} style={{ fontSize: 11, color: T.text, lineHeight: 1.6, marginBottom: 4 }}>
            {renderInlineMarkdown(trimmed)}
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

function renderInlineMarkdown(text: string): React.ReactNode {
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
  if (signal.confidence >= 75) reasons.push({ text: `Confiance élevée (${signal.confidence}%) — plusieurs indicateurs sont en accord`, positive: true });
  else if (signal.confidence >= 50) reasons.push({ text: `Confiance modérée (${signal.confidence}%) — certains indicateurs sont neutres`, positive: false });
  else reasons.push({ text: `Faible confiance (${signal.confidence}%) — confirmation supplémentaire nécessaire`, positive: false });
  if (rr !== null) {
    if (rr >= 2) reasons.push({ text: `R:R ${safeToFixed(rr, 1)}:1 — Excellent ratio risque/récompense`, positive: true });
    else if (rr >= 1) reasons.push({ text: `R:R ${safeToFixed(rr, 1)}:1 — Ratio risque/récompense acceptable`, positive: false });
    else reasons.push({ text: `R:R ${safeToFixed(rr, 1)}:1 — En dessous du seuil`, positive: false });
  }
  if (signal.reason) {
    const r = signal.reason.toLowerCase();
    if (r.includes('rsi') || r.includes('divergence') || r.includes('تباعد')) reasons.push({ text: 'Divergence RSI — signal de retournement fort', positive: true });
    if (r.includes('ma') || r.includes('moving average') || r.includes('متوسط')) reasons.push({ text: 'Le croisement des moyennes mobiles confirme la direction', positive: true });
    if (r.includes('macd')) reasons.push({ text: 'Le croisement MACD soutient le trade', positive: true });
    if (r.includes('support') || r.includes('resistance') || r.includes('دعم') || r.includes('مقاومة')) reasons.push({ text: 'Le prix est à un niveau de support/résistance clé', positive: true });
  }
  if (reasons.length <= 2) reasons.push({ text: signal.confidence >= 60 ? 'L\'analyse technique suggère une opportunité' : 'Attendez une confirmation supplémentaire', positive: signal.confidence >= 60 });

  // Countdown
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const expiry = new Date(signal.expiresAt).getTime();
      const start = new Date(signal.createdAt).getTime();
      const remaining = expiry - now;
      if (remaining <= 0) { setTimeLeft('Expiré'); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    };
    update();
    const iv = setInterval(() => { if (document.hidden) return; update(); }, 1000);
    return () => clearInterval(iv);
  }, [signal.expiresAt, signal.createdAt]);

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(4,6,12,0.75)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto"
        style={{
          marginLeft: 'auto',
          background: `linear-gradient(180deg, #0a1020, #080c18)`,
          borderLeft: `1px solid ${cfg.color}20`,
          boxShadow: `-10px 0 40px ${cfg.color}06`,
          animation: 'drawerIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes drawerIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* En-tête */}
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

        {/* Niveaux de prix */}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Entrée', value: smartFormatPrice(signal.entryPrice, signal.pair), color: T.cyan, bg: T.cyanDim },
              { label: 'Stop Loss', value: smartFormatPrice(signal.stopLoss, signal.pair), color: T.red, bg: T.redDim },
              { label: 'Take Profit', value: smartFormatPrice(signal.takeProfit, signal.pair), color: T.green, bg: T.greenDim },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 8px', borderRadius: 8, background: item.bg, border: `1px solid ${item.color}12`, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: item.color, marginBottom: 3, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* R:R */}
          {rr !== null && (
            <div style={{ padding: 12, borderRadius: 8, background: T.cyanDim, border: `1px solid ${T.cyan}10`, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: T.textDim }}>Risque / Récompense</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: rr >= 2 ? T.green : rr >= 1 ? T.gold : T.red }}>{safeToFixed(rr, 1)}:1</span>
              </div>
              <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((rr / 4) * 100, 100)}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${T.red}, ${T.gold}, ${T.green})` }} />
              </div>
            </div>
          )}

          {/* Pourquoi ce signal est-il fort ? */}
          <div style={{ padding: 14, borderRadius: 8, background: T.purpleDim, border: `1px solid ${T.purple}12`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 10 }}>Pourquoi ce signal est-il fort ?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.positive ? T.green : T.gold, marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analyse */}
          {signal.reason && (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Analyse</div>
              <FormattedAnalysis text={signal.reason} />
            </div>
          )}

          {/* Temps restant */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span style={{ fontSize: 10, color: T.textDim }}>Expire dans</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: timeLeft === 'Expiré' ? T.red : T.textBright }}>{timeLeft}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Grouped Signal View ─────────────────────────────────────────

function SignalGroupView({ signals, mode, onSelect, selectedId }: { signals: TradingSignal[]; mode: ClassificationMode; onSelect: (s: TradingSignal) => void; selectedId: string | null }) {
  const groups: { key: string; label: string; color: string; dim: string; signals: TradingSignal[] }[] = [];

  if (mode === 'pair') {
    const map: Record<string, TradingSignal[]> = {};
    signals.forEach(s => { if (!map[s.pair]) map[s.pair] = []; map[s.pair].push(s); });
    Object.entries(map).forEach(([pair, sigs]) => {
      const cfg = ACTION_CFG[sigs[0]?.action || 'WAIT'] || ACTION_CFG.WAIT;
      groups.push({ key: pair, label: pair, color: cfg.color, dim: cfg.dim, signals: sigs });
    });
  } else if (mode === 'timeframe') {
    const map: Record<string, TradingSignal[]> = {};
    signals.forEach(s => { const k = s.timeframe || 'H1'; if (!map[k]) map[k] = []; map[k].push(s); });
    ['M5', 'M15', 'H1', 'H4', 'D1', 'W1'].forEach(tf => { if (map[tf]) groups.push({ key: tf, label: TF_LABELS[tf] || tf, color: T.cyan, dim: T.cyanDim, signals: map[tf] }); });
  } else if (mode === 'strength') {
    ['strong', 'medium', 'weak'].forEach(key => {
      const conf = STRENGTH_CFG[key];
      const sigs = signals.filter(s => s.confidence >= conf.min && s.confidence <= conf.max);
      if (sigs.length > 0) groups.push({ key, label: conf.label, color: conf.color, dim: conf.dim, signals: sigs });
    });
  }

  if (groups.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map(group => (
        <div key={group.key}>
          {/* En-tête du groupe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '0 16px' }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: group.color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: group.color, fontFamily: T.mono }}>{group.label}</span>
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: group.dim, color: group.color, fontWeight: 700, border: `1px solid ${group.color}20` }}>{group.signals.length}</span>
          </div>
          {/* En-tête du tableau */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 72px 110px 90px 90px 90px 52px 76px',
            padding: '6px 16px', borderBottom: `1px solid ${T.border}`, background: T.bgPanel,
            fontSize: 9, fontWeight: 700, color: T.textDim, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            <span>Paire</span><span>Action</span><span>Confiance</span><span>Entrée</span><span>Stop</span><span>Cible</span><span>R:R</span><span>Tendance</span>
          </div>
          {/* Lignes */}
          {group.signals.map(signal => (
            <SignalRow key={signal.id} signal={signal} isSelected={selectedId === signal.id} onClick={() => onSelect(signal)} />
          ))}
        </div>
      ))}
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
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textBright, marginBottom: 10, fontFamily: T.mono }}>FORCE DES DEVISES</div>
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

// ═══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

export default function FrSignalsPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [classificationMode, setClassificationMode] = useState<ClassificationMode>('pair');
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const [activeRes, historyRes] = await Promise.all([
          fetch('/api/integration/signals?mode=active&limit=50', { cache: 'no-store' }),
          fetch('/api/integration/signals?mode=history&limit=50', { cache: 'no-store' }),
        ]);
        const allSignals: TradingSignal[] = [];
        if (activeRes.ok) { const data = await activeRes.json(); const raw = Array.isArray(data) ? data : data.signals || []; allSignals.push(...raw.map(normalizeSignal)); }
        if (historyRes.ok) { const data = await historyRes.json(); const raw = Array.isArray(data) ? data : data.signals || []; const ids = new Set(allSignals.map(s => s.id)); raw.forEach((s: any) => { if (!ids.has(s.id)) allSignals.push(normalizeSignal(s)); }); }
        setSignals(allSignals);
      } catch { /* silent */ }
      setLoading(false);
    }
    fetchSignals();
    const interval = setInterval(() => { if (document.hidden) return; fetchSignals(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeSignals = signals.filter(s => s.status === 'ACTIVE');
  const classifiableSignals = signals.length > 0 ? signals : [];
  const completedSignals = signals.filter(s => ['HIT_TP', 'HIT_SL'].includes(s.status));
  const wins = completedSignals.filter(s => s.status === 'HIT_TP').length;
  const winRate = completedSignals.length > 0 ? Math.round((wins / completedSignals.length) * 100) : 0;

  const filterTabs: { key: ClassificationMode; label: string }[] = [
    { key: 'pair', label: 'Par Paires' },
    { key: 'timeframe', label: 'Par Horizon' },
    { key: 'strength', label: 'Par Force' },
  ];

  return (
    <div className="min-h-screen" dir="ltr" style={{ background: T.bg }}>
      {/* ═══════ EN-TÊTE TERMINAL ═══════ */}
      <header style={{ borderBottom: `1px solid ${T.border}`, background: 'linear-gradient(180deg, #0a1020, #080c14)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, ${T.cyan}08, ${T.purple}08)`, border: `1px solid ${T.cyan}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.cyan} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: T.textBright, margin: 0, lineHeight: 1.2 }}>Signaux de Trading</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: T.greenDim, color: T.green, border: `1px solid ${T.green}20`, letterSpacing: '0.08em' }}>● EN DIRECT</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}15`, letterSpacing: '0.1em' }}>TERMINAL</span>
                </div>
              </div>
            </div>
            <Link href="/fr/markets" style={{ fontSize: 11, padding: '6px 14px', borderRadius: 6, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}12`, textDecoration: 'none', fontWeight: 600 }}>
              → Marchés
            </Link>
          </div>

          {/* Ruban de statistiques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Actifs', value: activeSignals.length, color: T.green },
              { label: 'Total', value: signals.length, color: T.cyan },
              { label: 'Taux de réussite', value: `${winRate}%`, color: winRate >= 50 ? T.green : T.red },
              { label: 'Terminés', value: completedSignals.length, color: T.purple },
            ].map(stat => (
              <div key={stat.label} style={{ padding: '8px 12px', borderRadius: 6, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: T.textDim, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ═══════ CONTENU PRINCIPAL ═══════ */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px 40px' }}>
        <p style={{ fontSize: 12, color: T.textDim, marginBottom: 16 }}>Recommandations de trading propulsées par l'IA avec niveaux d'entrée, stop-loss et take-profit</p>

        {classifiableSignals.length > 0 ? (
          <>
            {/* Force des devises */}
            <div style={{ marginBottom: 16 }}>
              <CurrencyStrength signals={classifiableSignals} />
            </div>

            {/* Barre de filtrage */}
            <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setClassificationMode(tab.key)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: classificationMode === tab.key ? T.cyanMid : 'transparent',
                    color: classificationMode === tab.key ? T.cyan : T.textDim,
                    border: classificationMode === tab.key ? `1px solid ${T.cyan}30` : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tableau des signaux */}
            <div style={{ borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, overflowX: 'auto' }}>
              <SignalGroupView signals={classifiableSignals} mode={classificationMode} onSelect={setSelectedSignal} selectedId={selectedSignal?.id ?? null} />
            </div>
          </>
        ) : !loading ? (
          <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>Aucun signal de trading disponible</p>
            <p style={{ fontSize: 12, color: T.textDim }}>Les signaux sont générés automatiquement par l'IA. Revenez bientôt !</p>
          </div>
        ) : (
          <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: T.textDim }}>Chargement des signaux...</p>
          </div>
        )}

        {/* Tiroir de détail */}
        <SignalDetailDrawer signal={selectedSignal} onClose={() => setSelectedSignal(null)} />

        {/* Avertissement */}
        <div style={{ marginTop: 24, padding: 14, borderRadius: 8, background: T.goldDim, border: `1px solid ${T.gold}18`, fontSize: 11, color: T.text, lineHeight: 1.6 }}>
          <strong style={{ color: T.gold }}>Avertissement sur les risques :</strong> Les signaux de trading sont générés par l'IA et ne constituent pas des conseils financiers. Le trading comporte un risque substantiel. Utilisez toujours une gestion appropriée des risques.
        </div>
      </main>
    </div>
  );
}
