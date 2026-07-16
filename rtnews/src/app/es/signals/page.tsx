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

// ─── Spanish Labels ───────────────────────────────────────────────

const ACTION_CFG: Record<string, { label: string; color: string; dim: string; mid: string; icon: string }> = {
  BUY:  { label: 'Compra',  color: T.green, dim: T.greenDim, mid: T.greenMid, icon: '▲' },
  SELL: { label: 'Venta',  color: T.red,   dim: T.redDim,   mid: T.redMid,   icon: '▼' },
  WAIT: { label: 'Espera', color: T.gold,  dim: T.goldDim,  mid: T.goldMid,  icon: '◆' },
  HOLD: { label: 'Mantener', color: T.gold, dim: T.goldDim,  mid: T.goldMid,  icon: '◆' },
};

const TF_LABELS: Record<string, string> = {
  M5: '5 Min',
  M15: '15 Min',
  H1: '1H',
  H4: '4H',
  D1: '1D',
  W1: '1S',
};

const STRENGTH_CFG: Record<string, { label: string; color: string; dim: string; min: number; max: number }> = {
  strong:  { label: 'Fuerte',  color: T.green, dim: T.greenDim, min: 75, max: 100 },
  medium:  { label: 'Medio',   color: T.gold,  dim: T.goldDim,  min: 50, max: 74 },
  weak:    { label: 'Débil',   color: T.red,   dim: T.redDim,   min: 0,  max: 49 },
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
      {/* Par + Horizonte */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.textBright }}>{signal.pair}</span>
        {signal.timeframe && (
          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: T.cyanDim, color: T.cyan, fontFamily: T.mono, border: `1px solid ${T.cyan}22` }}>
            {TF_LABELS[signal.timeframe] || signal.timeframe}
          </span>
        )}
      </div>

      {/* Acción */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, color: cfg.color }}>{cfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: T.mono }}>{cfg.label}</span>
      </div>

      {/* Confianza */}
      <ConfidenceBar value={signal.confidence} />

      {/* Entrada */}
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

      {/* Tendencia */}
      <Sparkline signal={signal} />
    </div>
  );
}

// ─── Arabic → Spanish Translation Utility ─────────────────────────

const AR_ES_MAP: [RegExp, string][] = [
  // ═══ LONGEST PHRASES FIRST (critical for correct matching) ═══

  // Strategy intro (full sentence)
  [/بناءً على تحليلات المجلس المختلفة، يُنصح بالتوجه إلى استراتيجية/gi, 'Basándose en los diversos análisis del consejo, se recomienda adoptar una estrategia de'],
  [/استنادًا إلى التحليلات المتعددة من مختلف الخبراء، يمكن تلخيص/gi, 'Basándose en los múltiples análisis de diversos expertos, se puede resumir'],
  [/هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية/gi, 'Este análisis es solo con fines educativos y no constituye asesoramiento de inversión'],
  [/التحليل الفني يشير لاتجاه صاعد محتمل/gi, 'El análisis técnico sugiere una tendencia alcista potencial'],
  [/التحليل الفني يشير لاتجاه هابط محتمل/gi, 'El análisis técnico sugiere una tendencia bajista potencial'],
  [/التحليل الفني يشير لفرصة معقولة/gi, 'El análisis técnico sugiere una oportunidad razonable'],
  [/السوق متذبذب بدون اتجاه واضح/gi, 'El mercado es volátil sin dirección clara'],
  [/بيانات غير كافية لتحديد اتجاه واضح/gi, 'Datos insuficientes para determinar una dirección clara'],
  [/ينصح بالانتظار لتأكيد إضافي/gi, 'Se recomienda esperar una confirmación adicional'],
  [/تقاطع المتوسطات المتحركة يؤكد الاتجاه/gi, 'El cruce de medias móviles confirma la dirección'],
  [/تقاطع MACD يدعم الصفقة/gi, 'El cruce MACD respalda la operación'],
  [/السعر عند مستوى دعم\/مقاومة رئيسي/gi, 'El precio en nivel clave de soporte/resistencia'],

  // Detailed analysis phrases (from AI council analysis)
  [/قد يستمر السعر في الانخفاض بشكل كبير/gi, 'El precio puede seguir cayendo significativamente'],
  [/قد تكون المشاعر الزائدة سببًا في انعكاس مفاجئ للاتجاه/gi, 'Los sentimientos excesivos pueden causar un cambio repentino de dirección'],
  [/المشاعر الإيجابية قد تكون متحيزةً/gi, 'Los sentimientos positivos pueden estar sesgados'],
  [/قد تكون المخاطرة مقبولة/gi, 'El riesgo puede ser aceptable'],
  [/المؤشرات الاقتصادية تدعم/gi, 'Los indicadores económicos respaldan'],
  [/استمرار الضعف الاقتصادي قد يؤدي إلى انخفاض أكبر/gi, 'La continuación de la debilidad económica puede llevar a una mayor caída'],
  [/الأنماط الفنية تدعم الهبوط/gi, 'Los patrones técnicos respaldan el descenso'],
  [/قد تستمر الأنماط في الإشارة إلى انخفاض مستمر/gi, 'Los patrones pueden seguir indicando una caída continua'],
  [/قد تكون استراتيجيات التنفيذ متحيزة/gi, 'Las estrategias de ejecución pueden estar sesgadas'],
  [/قد يؤدي تنفيذ الاستراتيجيات إلى خسائر/gi, 'La ejecución de las estrategias puede llevar a pérdidas'],
  [/التباين يشير إلى عدم استقرار وهبوط محتمل/gi, 'La divergencia indica inestabilidad y posible descenso'],
  [/قد يرتفع التباين بشكل كبير مما يؤدي إلى انخفاض سريع/gi, 'La divergencia puede aumentar significativamente, provocando una caída rápida'],
  [/معظم التحليلات تدعم/gi, 'La mayoría de los análisis respaldan'],
  [/مما يشير إلى أن/gi, 'lo que indica que'],
  [/قد يستمر في الهبوط/gi, 'puede seguir cayendo'],
  [/هناك تضارب في التحليلات بين/gi, 'Hay conflicto en los análisis entre'],
  [/يجب الانتباه إلى احتمال انعكاس مفاجئ في المشاعر أو السوق/gi, 'Se debe prestar atención a la posibilidad de un cambio repentino en los sentimientos o el mercado'],
  [/بالنظر إلى غالبية التحليلات التي توصي/gi, 'Teniendo en cuenta la mayoría de los análisis que recomiendan'],
  [/مع التركيز على الاتجاهات السلبية والمخاطر المحتملة/gi, 'con el enfoque en las tendencias negativas y los riesgos potenciales'],
  [/فإن استراتيجية التداول النهائية هي/gi, 'la estrategia de trading final es'],
  [/مع التركيز على المراقبة المستمرة للتغيرات في السوق/gi, 'con el enfoque en la monitorización continua de los cambios en el mercado'],
  [/انخفاض قيمة العملة بشكل غير متوقع/gi, 'Caída inesperada del valor de la moneda'],
  [/إذا لم تتغير السوق بشكل مفاجئ/gi, 'si el mercado no cambia repentinamente'],
  [/خاصة مع وجود تحليلات إيجابية قوية/gi, 'especialmente con análisis positivos fuertes'],
  [/يشير إلى اتجاه هبوطي قوي/gi, 'Indica una tendencia bajista fuerte'],
  [/سابقة بناءً على التحليل الفني \(محلي\)/gi, 'basado en el análisis técnico (local)'],

  // ═══ HEADINGS & STRUCTURE ═══
  [/الاستراتيجية النهائية للتداول على/gi, 'Estrategia final de trading en'],
  [/استراتيجية التداول النهائية/gi, 'Estrategia de trading final'],
  [/تنبيه المخاطر/gi, 'Advertencia de riesgo'],
  [/تنبيهات المخاطر/gi, 'Alertas de riesgo'],
  [/سياق الأخبار/gi, 'Contexto de noticias'],
  [/تحليل شامل/gi, 'Análisis exhaustivo'],
  [/الخلاصة/gi, 'Conclusión'],
  [/على زوج/gi, 'en el par'],

  // ═══ COUNCIL MEMBERS ═══
  [/محلل السيناريوهات/gi, 'Analista de escenarios'],
  [/المحلل الفني/gi, 'Analista técnico'],
  [/محلل المشاعر/gi, 'Analista de sentimiento'],
  [/خبير المخاطر/gi, 'Experto en riesgos'],
  [/خبير الماكرو/gi, 'Experto macroeconómico'],
  [/خبير الأنماط/gi, 'Experto en patrones'],
  [/استراتيجي التنفيذ/gi, 'Estratega de ejecución'],
  [/محلل التباين/gi, 'Analista de divergencia'],

  // ═══ COUNCIL CONSENSUS ═══
  [/إجماع المجلس/gi, 'Consenso del consejo'],
  [/نماذج/gi, 'modelos'],
  [/بيع واضح/gi, 'VENTA clara'],
  [/شراء واضح/gi, 'COMPRA clara'],
  [/بنسبة ثقة/gi, 'con una confianza de'],

  // ═══ VOTE DESCRIPTIONS ═══
  [/تأييد لبيع/gi, 'apoyo a la VENTA'],
  [/تأييد لشراء/gi, 'apoyo a la COMPRA'],
  [/تأييد للحفاظ على المركز الحالي \(HOLD\)/gi, 'recomendación de MANTENER'],
  [/تأييد/gi, 'apoyo'],
  [/الذين يفضلون/gi, 'que favorecen'],

  // ═══ SIGNAL TYPES ═══
  [/إشارة شراء/gi, 'Señal de compra'],
  [/إشارة بيع/gi, 'Señal de venta'],
  [/إشارة انتظار/gi, 'Señal de espera'],
  [/بيع \(SELL\)/gi, 'VENTA'],
  [/شراء \(BUY\)/gi, 'COMPRA'],
  [/بيع/gi, 'VENTA'],
  [/شراء/gi, 'COMPRA'],

  // ═══ DETAILED ANALYSIS COMPONENTS ═══
  // Risk factors
  [/عوامل المخاطر/gi, 'Factores de riesgo'],
  [/أسوأ سيناريو/gi, 'Peor escenario'],
  [/يوصي بـ/gi, 'recomienda'],
  [/يشير إلى/gi, 'Indica'],
  [/اتجاه هبوطي قوي/gi, 'tendencia bajista fuerte'],
  [/قد يستمر السعر في/gi, 'El precio puede seguir'],
  [/بشكل كبير/gi, 'significativamente'],
  [/بشكل غير متوقع/gi, 'de forma inesperada'],
  [/المشاعر المتضاربة/gi, 'Sentimientos contradictorios'],
  [/الحالات الاستثنائية/gi, 'Casos excepcionales'],
  [/الاتجاه العام/gi, 'Tendencia general'],
  [/الضعف الاقتصادي/gi, 'debilidad económica'],
  [/الأنماط الفنية/gi, 'Los patrones técnicos'],
  [/استراتيجيات التنفيذ/gi, 'Las estrategias de ejecución'],
  [/عدم استقرار/gi, 'inestabilidad'],
  [/وهبوط محتمل/gi, 'y posible descenso'],
  [/انخفاض قيمة/gi, 'Caída del valor'],
  [/المراقبة المستمرة/gi, 'monitorización continua'],
  [/التغيرات في السوق/gi, 'los cambios en el mercado'],
  [/مع التركيز على/gi, 'con el enfoque en'],
  [/المخاطر المحتملة/gi, 'los riesgos potenciales'],
  [/الاتجاهات السلبية/gi, 'las tendencias negativas'],
  [/تحليلات إيجابية/gi, 'análisis positivos'],
  [/انعكاس مفاجئ/gi, 'cambio repentino'],
  [/للاتجاه/gi, 'de dirección'],
  [/في المشاعر/gi, 'en los sentimientos'],
  [/أو السوق/gi, 'o el mercado'],
  [/قد تكون/gi, 'pueden ser'],
  [/متحيزة/gi, 'sesgadas'],
  [/سببًا في/gi, 'causa de'],
  [/مما يؤدي إلى/gi, 'lo que provoca'],
  [/قد يؤدي إلى/gi, 'puede llevar a'],
  [/إلى خسائر/gi, 'a pérdidas'],
  [/إلى انخفاض أكبر/gi, 'a una mayor caída'],
  [/إلى انخفاض سريع/gi, 'a una caída rápida'],
  [/العملة/gi, 'la moneda'],
  [/بشكل مفاجئ/gi, 'repentinamente'],
  [/كالآتي/gi, 'como sigue'],
  [/يمكن تلخيص/gi, 'se puede resumir'],
  [/فإن/gi, 'por lo tanto'],
  [/خاصة مع وجود/gi, 'especialmente con'],
  [/بالنظر إلى/gi, 'Teniendo en cuenta'],

  // ═══ TECHNICAL TERMS ═══
  [/تباعد RSI/gi, 'Divergencia RSI'],
  [/مؤشر انعكاس قوي/gi, 'señal de reversión fuerte'],
  [/دعم/gi, 'soporte'],
  [/مقاومة/gi, 'resistencia'],
  [/متوسط متحرك/gi, 'Media móvil'],
  [/تقاطع/gi, 'cruce'],

  // ═══ NEWS CONTEXT ═══
  [/مشاعر=/gi, 'Sentimiento='],
  [/لا أخبار متاحة/gi, 'No hay noticias disponibles'],
  [/مخاطر=/gi, 'Riesgo='],
  [/نقاط=/gi, 'Puntos='],
  [/خبر حديث/gi, 'noticia reciente'],
  [/محايد/gi, 'neutral'],
  [/إيجابي/gi, 'positivo'],
  [/سلبي/gi, 'negativo'],
  [/مرتفع/gi, 'alto'],
  [/منخفض/gi, 'bajo'],

  // ═══ GENERAL WORDS (last resort - short words) ═══
  [/الهبوط/gi, 'el descenso'],
  [/السوق/gi, 'el mercado'],
  [/الاتجاه/gi, 'la tendencia'],
  [/المشاعر/gi, 'Los sentimientos'],
  [/السعر/gi, 'El precio'],
  [/المخاطرة/gi, 'el riesgo'],
  [/المخاطر/gi, 'los riesgos'],
  [/التحليل/gi, 'el análisis'],
  [/التحليلات/gi, 'los análisis'],
  [/الأنماط/gi, 'Los patrones'],
  [/التباين/gi, 'La divergencia'],
  [/التغيرات/gi, 'los cambios'],
  [/المراقبة/gi, 'la monitorización'],
  [/الاستقرار/gi, 'la estabilidad'],
  [/الضعف/gi, 'la debilidad'],
  [/الاقتصادي/gi, 'económico'],
  [/الاقتصادية/gi, 'económicos'],
  [/المؤشرات/gi, 'Los indicadores'],
  [/الاستثمارية/gi, 'de inversión'],
  [/الاستثمار/gi, 'la inversión'],
  [/الفرصة/gi, 'la oportunidad'],
  [/التوصية/gi, 'la recomendación'],
  [/الاستراتيجية/gi, 'la estrategia'],
  [/النتيجة/gi, 'el resultado'],
  [/الإيجابية/gi, 'positivos'],
  [/السلبية/gi, 'negativos'],
  [/العملات/gi, 'las monedas'],
  [/التداول/gi, 'el trading'],
  [/الأسعار/gi, 'los precios'],
  [/الأرباح/gi, 'las ganancias'],
  [/الخسائر/gi, 'las pérdidas'],
  [/الفنية/gi, 'técnicos'],
  [/الفني/gi, 'técnico'],
  [/المالية/gi, 'financieros'],
  [/المالي/gi, 'financiero'],
  [/السابقة/gi, 'anteriores'],
  [/القادمة/gi, 'próximos'],
  [/الحالية/gi, 'actuales'],
  [/المستقبل/gi, 'futuro'],
  [/الاحتمال/gi, 'la probabilidad'],
  [/التحسن/gi, 'la mejora'],
  [/التراجع/gi, 'el retroceso'],
  [/الارتفاع/gi, 'el aumento'],
  [/الانخفاض/gi, 'la caída'],
  [/النمو/gi, 'el crecimiento'],
  [/الأداء/gi, 'el rendimiento'],
  [/الحركة/gi, 'el movimiento'],
  [/الاتجاهات/gi, 'las tendencias'],
  [/المستويات/gi, 'los niveles'],
  [/المستوى/gi, 'el nivel'],
  [/النقاط/gi, 'los puntos'],
  [/الهدف/gi, 'el objetivo'],
  [/الأهداف/gi, 'los objetivos'],
  [/الإشارة/gi, 'la señal'],
  [/الإشارات/gi, 'las señales'],
  [/الزوج/gi, 'el par'],
  [/الأزواج/gi, 'los pares'],
  [/الإجراء/gi, 'la acción'],
  [/الثقة/gi, 'la confianza'],
  [/الدخول/gi, 'la entrada'],
  [/الوقف/gi, 'el stop'],
  [/الوقف/gi, 'el stop'],
  [/الخروج/gi, 'la salida'],
  [/الربح/gi, 'el beneficio'],
  [/الجني/gi, 'la toma'],
  [/الخسارة/gi, 'la pérdida'],
  [/الوقف/gi, 'el stop loss'],

  // ═══ CONNECTORS & MISC ═══
  [/بناءً على/gi, 'Basándose en'],
  [/يُنصح/gi, 'Se recomienda'],
  [/يوصي/gi, 'recomienda'],
  [/و/gi, 'y'],
];

function translateAnalysisToEs(text: string): string {
  let result = text;
  for (const [pattern, replacement] of AR_ES_MAP) {
    result = result.replace(pattern, replacement);
  }

  // Fallback: remove any remaining Arabic characters that weren't translated
  // This prevents garbled mixed-language text from appearing to the user
  result = result.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '').trim();
  // Clean up double spaces and other artifacts from removal
  result = result.replace(/\s{2,}/g, ' ').replace(/\.\s*\./g, '.').replace(/,\s*,/g, ',').replace(/\(\s*\)/g, '').trim();

  return result;
}

// ─── Formatted Analysis Component ─────────────────────────────────

function FormattedAnalysis({ text }: { text: string }) {
  const translated = translateAnalysisToEs(text);

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
  if (signal.confidence >= 75) reasons.push({ text: `Alta confianza (${signal.confidence}%) — múltiples indicadores coinciden`, positive: true });
  else if (signal.confidence >= 50) reasons.push({ text: `Confianza moderada (${signal.confidence}%) — algunos indicadores son neutrales`, positive: false });
  else reasons.push({ text: `Baja confianza (${signal.confidence}%) — se necesita confirmación adicional`, positive: false });
  if (rr !== null) {
    if (rr >= 2) reasons.push({ text: `R:R ${safeToFixed(rr, 1)}:1 — Excelente ratio riesgo/beneficio`, positive: true });
    else if (rr >= 1) reasons.push({ text: `R:R ${safeToFixed(rr, 1)}:1 — Ratio riesgo/beneficio aceptable`, positive: false });
    else reasons.push({ text: `R:R ${safeToFixed(rr, 1)}:1 — Por debajo del umbral`, positive: false });
  }
  if (signal.reason) {
    const r = signal.reason.toLowerCase();
    if (r.includes('rsi') || r.includes('divergence') || r.includes('تباعد')) reasons.push({ text: 'Divergencia RSI — señal de reversión fuerte', positive: true });
    if (r.includes('ma') || r.includes('moving average') || r.includes('متوسط')) reasons.push({ text: 'El cruce de medias móviles confirma la dirección', positive: true });
    if (r.includes('macd')) reasons.push({ text: 'El cruce MACD respalda la operación', positive: true });
    if (r.includes('support') || r.includes('resistance') || r.includes('دعم') || r.includes('مقاومة')) reasons.push({ text: 'El precio en nivel clave de soporte/resistencia', positive: true });
  }
  if (reasons.length <= 2) reasons.push({ text: signal.confidence >= 60 ? 'El análisis técnico sugiere una oportunidad' : 'Espere una confirmación adicional', positive: signal.confidence >= 60 });

  // Countdown
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const expiry = new Date(signal.expiresAt).getTime();
      const start = new Date(signal.createdAt).getTime();
      const remaining = expiry - now;
      if (remaining <= 0) { setTimeLeft('Expirado'); return; }
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

        {/* Encabezado */}
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

        {/* Niveles de precio */}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Entrada', value: smartFormatPrice(signal.entryPrice, signal.pair), color: T.cyan, bg: T.cyanDim },
              { label: 'Pérdida de Parada', value: smartFormatPrice(signal.stopLoss, signal.pair), color: T.red, bg: T.redDim },
              { label: 'Toma de Ganancia', value: smartFormatPrice(signal.takeProfit, signal.pair), color: T.green, bg: T.greenDim },
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
                <span style={{ fontSize: 10, color: T.textDim }}>Riesgo / Beneficio</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: rr >= 2 ? T.green : rr >= 1 ? T.gold : T.red }}>{safeToFixed(rr, 1)}:1</span>
              </div>
              <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((rr / 4) * 100, 100)}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${T.red}, ${T.gold}, ${T.green})` }} />
              </div>
            </div>
          )}

          {/* ¿Por qué es fuerte esta señal? */}
          <div style={{ padding: 14, borderRadius: 8, background: T.purpleDim, border: `1px solid ${T.purple}12`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 10 }}>¿Por qué es fuerte esta señal?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.positive ? T.green : T.gold, marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Análisis */}
          {signal.reason && (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Análisis</div>
              <FormattedAnalysis text={signal.reason} />
            </div>
          )}

          {/* Tiempo restante */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span style={{ fontSize: 10, color: T.textDim }}>Expira en</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: timeLeft === 'Expirado' ? T.red : T.textBright }}>{timeLeft}</span>
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
          {/* Encabezado del grupo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '0 16px' }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: group.color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: group.color, fontFamily: T.mono }}>{group.label}</span>
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: group.dim, color: group.color, fontWeight: 700, border: `1px solid ${group.color}20` }}>{group.signals.length}</span>
          </div>
          {/* Encabezado de tabla */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 72px 110px 90px 90px 90px 52px 76px',
            padding: '6px 16px', borderBottom: `1px solid ${T.border}`, background: T.bgPanel,
            fontSize: 9, fontWeight: 700, color: T.textDim, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            <span>Par</span><span>Acción</span><span>Confianza</span><span>Entrada</span><span>Stop</span><span>Objetivo</span><span>R:R</span><span>Tendencia</span>
          </div>
          {/* Filas */}
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
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textBright, marginBottom: 10, fontFamily: T.mono }}>FUERZA DE DIVISAS</div>
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
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function EsSignalsPage() {
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
    { key: 'pair', label: 'Por Pares' },
    { key: 'timeframe', label: 'Por Horizonte' },
    { key: 'strength', label: 'Por Fuerza' },
  ];

  return (
    <div className="min-h-screen" dir="ltr" style={{ background: T.bg }}>
      {/* ═══════ ENCABEZADO TERMINAL ═══════ */}
      <header style={{ borderBottom: `1px solid ${T.border}`, background: 'linear-gradient(180deg, #0a1020, #080c14)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, ${T.cyan}08, ${T.purple}08)`, border: `1px solid ${T.cyan}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.cyan} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: T.textBright, margin: 0, lineHeight: 1.2 }}>Señales de Trading</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: T.greenDim, color: T.green, border: `1px solid ${T.green}20`, letterSpacing: '0.08em' }}>● EN VIVO</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}15`, letterSpacing: '0.1em' }}>TERMINAL</span>
                </div>
              </div>
            </div>
            <Link href="/es/markets" style={{ fontSize: 11, padding: '6px 14px', borderRadius: 6, background: T.cyanDim, color: T.cyan, border: `1px solid ${T.cyan}12`, textDecoration: 'none', fontWeight: 600 }}>
              → Mercados
            </Link>
          </div>

          {/* Cinta de estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Activas', value: activeSignals.length, color: T.green },
              { label: 'Total', value: signals.length, color: T.cyan },
              { label: 'Tasa de Aciertos', value: `${winRate}%`, color: winRate >= 50 ? T.green : T.red },
              { label: 'Completadas', value: completedSignals.length, color: T.purple },
            ].map(stat => (
              <div key={stat.label} style={{ padding: '8px 12px', borderRadius: 6, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: T.textDim, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ═══════ CONTENIDO PRINCIPAL ═══════ */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px 40px' }}>
        <p style={{ fontSize: 12, color: T.textDim, marginBottom: 16 }}>Recomendaciones de trading impulsadas por IA con niveles de entrada, stop-loss y take-profit</p>

        {classifiableSignals.length > 0 ? (
          <>
            {/* Fuerza de divisas */}
            <div style={{ marginBottom: 16 }}>
              <CurrencyStrength signals={classifiableSignals} />
            </div>

            {/* Barra de filtrado */}
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

            {/* Tabla de señales */}
            <div style={{ borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, overflowX: 'auto' }}>
              <SignalGroupView signals={classifiableSignals} mode={classificationMode} onSelect={setSelectedSignal} selectedId={selectedSignal?.id ?? null} />
            </div>
          </>
        ) : !loading ? (
          <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>No hay señales de trading disponibles</p>
            <p style={{ fontSize: 12, color: T.textDim }}>Las señales son generadas automáticamente por IA. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div style={{ padding: 48, borderRadius: 8, background: T.bgPanel, border: `1px solid ${T.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: T.textDim }}>Cargando señales...</p>
          </div>
        )}

        {/* Panel de detalle */}
        <SignalDetailDrawer signal={selectedSignal} onClose={() => setSelectedSignal(null)} />

        {/* Advertencia */}
        <div style={{ marginTop: 24, padding: 14, borderRadius: 8, background: T.goldDim, border: `1px solid ${T.gold}18`, fontSize: 11, color: T.text, lineHeight: 1.6 }}>
          <strong style={{ color: T.gold }}>Advertencia de riesgo:</strong> Las señales de trading son generadas por IA y no constituyen asesoramiento financiero. El trading conlleva un riesgo sustancial. Utilice siempre una gestión de riesgo adecuada.
        </div>
      </main>
    </div>
  );
}
