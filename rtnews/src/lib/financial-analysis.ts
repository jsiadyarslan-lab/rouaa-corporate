// ─── Deep Financial Technical Analysis Engine ───────────────────
// Uses the `technicalindicators` npm package for professional-grade
// indicator calculations: RSI, MACD, Bollinger Bands, SMA, EMA,
// Stochastic, ADX, ATR — with Arabic market commentary.
// Server-side only.

import {
  RSI,
  MACD,
  BollingerBands,
  SMA,
  EMA,
  Stochastic,
  ADX,
  ATR,
} from 'technicalindicators';

// ─── Exported Interfaces ────────────────────────────────────────

export interface RSIResult {
  value: number;
  signal: 'overbought' | 'oversold' | 'neutral';
  description: string;
}

export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  position: 'above_upper' | 'below_lower' | 'middle';
  squeeze: boolean;
  description: string;
}

export interface SMAResult {
  value: number;
  trend: 'above' | 'below';
}

export interface StochasticResult {
  k: number;
  d: number;
  signal: string;
}

export interface ADXResult {
  value: number;
  trend: 'strong' | 'weak' | 'neutral';
  description: string;
}

export interface ATRResult {
  value: number;
  volatility: 'high' | 'medium' | 'low';
}

export interface OverallSignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;   // 0-100
  confidence: number; // 0-100
}

export interface MarketAnalysis {
  rsi: RSIResult;
  macd: MACDResult;
  bollingerBands: BollingerBandsResult;
  sma: Record<string, SMAResult>;
  stochastic: StochasticResult;
  adx: ADXResult;
  atr: ATRResult;
  overallSignal: OverallSignal;
  supportLevels: number[];
  resistanceLevels: number[];
  arabicSummary: string;
  keyInsights: string[];
}

// ─── Helper: safe last value from indicator array ───────────────

function safeLast(arr: (number | undefined)[] | undefined, fallback: number): number {
  if (!arr || arr.length === 0) return fallback;
  const val = arr[arr.length - 1];
  return typeof val === 'number' && isFinite(val) ? val : fallback;
}

// ─── Helper: safe first/last of 2D arrays (Stochastic, ADX) ────

function safeLastRecord<T>(arr: T[] | undefined, fallback: T): T {
  if (!arr || arr.length === 0) return fallback;
  return arr[arr.length - 1];
}

// ─── Pivot Point Support/Resistance ────────────────────────────

function calculatePivotLevels(
  high: number,
  low: number,
  close: number
): { supports: number[]; resistances: number[] } {
  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const r2 = pivot + (high - low);
  const r3 = high + 2 * (pivot - low);
  const s1 = 2 * pivot - high;
  const s2 = pivot - (high - low);
  const s3 = low - 2 * (high - pivot);

  return {
    supports: [s1, s2, s3].map(v => Math.round(v * 100) / 100),
    resistances: [r1, r2, r3].map(v => Math.round(v * 100) / 100),
  };
}

// ─── Bollinger Band Squeeze Detection ──────────────────────────

function detectSqueeze(
  bbResults: { upper: number; middle: number; lower: number }[] | undefined,
  lookback: number = 20
): boolean {
  if (!bbResults || bbResults.length < lookback) return false;

  const recent = bbResults.slice(-lookback);
  const bandwidths = recent.map(b => {
    const bw = b.middle !== 0 ? (b.upper - b.lower) / b.middle : 0;
    return bw;
  });

  if (bandwidths.length < 6) return false;

  const currentBW = bandwidths[bandwidths.length - 1];
  const avgBW = bandwidths.slice(0, -1).reduce((s, v) => s + v, 0) / (bandwidths.length - 1);

  // Squeeze when current bandwidth is less than 60% of average
  return currentBW < avgBW * 0.6;
}

// ─── Arabic Description Generators ─────────────────────────────

function rsiDescriptionAr(value: number, signal: RSIResult['signal']): string {
  const rounded = value.toFixed(1);
  switch (signal) {
    case 'overbought':
      return `مؤشر القوة النسبية عند ${rounded} يشير إلى منطقة تشبع شرائي — احتمال تصحيح قريب`;
    case 'oversold':
      return `مؤشر القوة النسبية عند ${rounded} يشير إلى منطقة تشبع بيعي — فرصة ارتداد محتملة`;
    default:
      return `مؤشر القوة النسبية عند ${rounded} في نطاق طبيعي — لا إشارة حاسمة`;
  }
}

function macdDescriptionAr(histogram: number, trend: MACDResult['trend']): string {
  const rounded = histogram.toFixed(2);
  switch (trend) {
    case 'bullish':
      return `تقاطع MACD إيجابي (هيستوغرام ${rounded}) يدعم الاتجاه الصعودي`;
    case 'bearish':
      return `تقاطع MACD سلبي (هيستوغرام ${rounded}) يؤكد الاتجاه الهبوطي`;
    default:
      return `MACD متعادل (هيستوغرام ${rounded}) — لا زخم واضح`;
  }
}

function bbDescriptionAr(position: BollingerBandsResult['position'], squeeze: boolean): string {
  let desc = '';
  switch (position) {
    case 'above_upper':
      desc = 'السعر فوق الحد العلوي لبولينجر — ذروة شرائية';
      break;
    case 'below_lower':
      desc = 'السعر تحت الحد السفلي لبولينجر — ذروة بيعية';
      break;
    default:
      desc = 'السعر يتداول داخل نطاق بولينجر — وضع طبيعي';
  }
  if (squeeze) {
    desc += '. النطاق يشهد تضيقاً قد يسبق حركة قوية';
  }
  return desc;
}

function adxDescriptionAr(value: number, trend: ADXResult['trend']): string {
  const rounded = value.toFixed(1);
  switch (trend) {
    case 'strong':
      return `مؤشر ADX عند ${rounded} — اتجاه قوي ومحدد`;
    case 'weak':
      return `مؤشر ADX عند ${rounded} — اتجاه ضعيف أو عرضي`;
    default:
      return `مؤشر ADX عند ${rounded} — لا اتجاه واضح`;
  }
}

// ─── Main Analysis Function ────────────────────────────────────

export function analyzeMarketData(
  closingPrices: number[],
  highs?: number[],
  lows?: number[],
  volumes?: number[]
): MarketAnalysis {
  // Fallbacks: if highs/lows not provided, derive from closes with small estimate
  const closes = closingPrices.filter(v => isFinite(v) && v > 0);
  const h = highs && highs.length > 0
    ? highs.filter(v => isFinite(v) && v > 0)
    : closes.map(c => c * 1.002); // estimate ~0.2% above close
  const l = lows && lows.length > 0
    ? lows.filter(v => isFinite(v) && v > 0)
    : closes.map(c => c * 0.998); // estimate ~0.2% below close

  if (closes.length < 2) {
    return createEmptyAnalysis();
  }

  const currentPrice = closes[closes.length - 1];

  // ─── RSI (14) ─────────────────────────────────────────────
  const rsiValues = RSI.calculate({ values: closes, period: 14 });
  const rsiValue = safeLast(rsiValues, 50);
  const rsiSignal: RSIResult['signal'] =
    rsiValue > 70 ? 'overbought' : rsiValue < 30 ? 'oversold' : 'neutral';

  // ─── MACD (12, 26, 9) ────────────────────────────────────
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const lastMACD = safeLastRecord(macdValues, {
    MACD: 0,
    signal: 0,
    histogram: 0,
  });
  const macdLine = typeof lastMACD.MACD === 'number' ? lastMACD.MACD : 0;
  const signalLine = typeof lastMACD.signal === 'number' ? lastMACD.signal : 0;
  const histogram = typeof lastMACD.histogram === 'number' ? lastMACD.histogram : 0;
  const macdTrend: MACDResult['trend'] =
    histogram > 0 ? 'bullish' : histogram < 0 ? 'bearish' : 'neutral';

  // ─── Bollinger Bands (20, 2) ──────────────────────────────
  const bbValues = BollingerBands.calculate({
    values: closes,
    period: 20,
    stdDev: 2,
  });
  const lastBB = safeLastRecord(bbValues, {
    upper: currentPrice * 1.02,
    middle: currentPrice,
    lower: currentPrice * 0.98,
    pb: 0.5,
  });
  const bbUpper = typeof lastBB.upper === 'number' ? lastBB.upper : currentPrice * 1.02;
  const bbMiddle = typeof lastBB.middle === 'number' ? lastBB.middle : currentPrice;
  const bbLower = typeof lastBB.lower === 'number' ? lastBB.lower : currentPrice * 0.98;
  const bbPosition: BollingerBandsResult['position'] =
    currentPrice > bbUpper ? 'above_upper' : currentPrice < bbLower ? 'below_lower' : 'middle';
  const bbSqueeze = detectSqueeze(bbValues as { upper: number; middle: number; lower: number }[] | undefined);

  // ─── SMA (5, 10, 20, 50) ─────────────────────────────────
  const smaResults: Record<string, SMAResult> = {};
  for (const period of [5, 10, 20, 50]) {
    if (closes.length >= period) {
      const vals = SMA.calculate({ values: closes, period });
      const val = safeLast(vals, currentPrice);
      smaResults[`sma${period}`] = {
        value: Math.round(val * 100) / 100,
        trend: currentPrice > val ? 'above' : 'below',
      };
    }
  }

  // ─── EMA (12, 26) ────────────────────────────────────────
  for (const period of [12, 26]) {
    const vals = EMA.calculate({ values: closes, period });
    const val = safeLast(vals, currentPrice);
    smaResults[`ema${period}`] = {
      value: Math.round(val * 100) / 100,
      trend: currentPrice > val ? 'above' : 'below',
    };
  }

  // ─── Stochastic (14, 3) ──────────────────────────────────
  const stochInput = closes.map((c, i) => ({
    high: h[i] ?? c,
    low: l[i] ?? c,
    close: c,
  }));
  const stochValues = Stochastic.calculate({
    high: stochInput.map(s => s.high),
    low: stochInput.map(s => s.low),
    close: stochInput.map(s => s.close),
    period: 14,
    signalPeriod: 3,
  });
  const lastStoch = safeLastRecord(stochValues, { k: 50, d: 50 });
  const stochK = typeof lastStoch.k === 'number' ? lastStoch.k : 50;
  const stochD = typeof lastStoch.d === 'number' ? lastStoch.d : 50;
  let stochSignal: string;
  if (stochK > 80 && stochD > 80) stochSignal = 'ذروة شرائية — احتمال تصحيح';
  else if (stochK < 20 && stochD < 20) stochSignal = 'ذروة بيعية — فرصة ارتداد';
  else if (stochK > stochD) stochSignal = 'زخم صعودي';
  else stochSignal = 'زخم هبوطي';

  // ─── ADX (14) ────────────────────────────────────────────
  const adxInput = closes.map((_, i) => ({
    high: h[i] ?? closes[i],
    low: l[i] ?? closes[i],
    close: closes[i],
  }));
  const adxValues = ADX.calculate({
    high: adxInput.map(a => a.high),
    low: adxInput.map(a => a.low),
    close: adxInput.map(a => a.close),
    period: 14,
  });
  const lastADX = safeLastRecord(adxValues, { adx: 0, pdi: 0, mdi: 0 });
  const adxValue = typeof lastADX.adx === 'number' ? lastADX.adx : 0;
  const adxTrend: ADXResult['trend'] =
    adxValue > 25 ? 'strong' : adxValue > 15 ? 'neutral' : 'weak';

  // ─── ATR (14) ────────────────────────────────────────────
  const atrInput = closes.map((_, i) => ({
    high: h[i] ?? closes[i],
    low: l[i] ?? closes[i],
    close: closes[i],
  }));
  const atrValues = ATR.calculate({
    high: atrInput.map(a => a.high),
    low: atrInput.map(a => a.low),
    close: atrInput.map(a => a.close),
    period: 14,
  });
  const atrValue = safeLast(atrValues, currentPrice * 0.01);
  const atrPct = currentPrice > 0 ? (atrValue / currentPrice) * 100 : 0;
  const volatility: ATRResult['volatility'] =
    atrPct > 2 ? 'high' : atrPct > 0.8 ? 'medium' : 'low';

  // ─── Support / Resistance via Pivot Points ────────────────
  const recentHigh = Math.max(...h.slice(-14));
  const recentLow = Math.min(...l.slice(-14));
  const pivotResult = calculatePivotLevels(recentHigh, recentLow, currentPrice);

  // Filter: supports below current price, resistances above
  const supportLevels = pivotResult.supports.filter(s => s < currentPrice);
  const resistanceLevels = pivotResult.resistances.filter(r => r > currentPrice);

  // ─── Overall Signal ───────────────────────────────────────
  let bullScore = 0;
  let bearScore = 0;
  let totalWeight = 0;

  // RSI (weight: 20)
  totalWeight += 20;
  if (rsiSignal === 'oversold') bullScore += 20;
  else if (rsiSignal === 'overbought') bearScore += 20;
  else if (rsiValue < 45) bullScore += 8;
  else if (rsiValue > 55) bearScore += 8;

  // MACD (weight: 20)
  totalWeight += 20;
  if (macdTrend === 'bullish') bullScore += 20;
  else if (macdTrend === 'bearish') bearScore += 20;
  else { bullScore += 5; bearScore += 5; }

  // Bollinger position (weight: 15)
  totalWeight += 15;
  if (bbPosition === 'below_lower') bullScore += 15;
  else if (bbPosition === 'above_upper') bearScore += 15;
  else { bullScore += 5; bearScore += 5; }

  // SMA trend (weight: 15)
  totalWeight += 15;
  const smaAboveCount = Object.values(smaResults).filter(s => s.trend === 'above').length;
  const smaBelowCount = Object.values(smaResults).filter(s => s.trend === 'below').length;
  const smaBull = (smaAboveCount / Math.max(Object.keys(smaResults).length, 1)) * 15;
  const smaBear = (smaBelowCount / Math.max(Object.keys(smaResults).length, 1)) * 15;
  bullScore += smaBull;
  bearScore += smaBear;

  // Stochastic (weight: 10)
  totalWeight += 10;
  if (stochK < 20) bullScore += 10;
  else if (stochK > 80) bearScore += 10;
  else if (stochK > stochD) bullScore += 5;
  else bearScore += 5;

  // ADX (weight: 10)
  totalWeight += 10;
  if (adxTrend === 'strong') {
    // Direction depends on who's winning
    if (bullScore > bearScore) bullScore += 10;
    else bearScore += 10;
  } else {
    bullScore += 3;
    bearScore += 3;
  }

  // ATR (weight: 10) — volatility amplifies direction
  totalWeight += 10;
  if (volatility === 'high') {
    if (bullScore > bearScore) bullScore += 10;
    else bearScore += 10;
  } else {
    bullScore += 4;
    bearScore += 4;
  }

  const netScore = bullScore - bearScore;
  const direction: OverallSignal['direction'] =
    netScore > 15 ? 'bullish' : netScore < -15 ? 'bearish' : 'neutral';
  const strength = Math.min(100, Math.round((Math.abs(netScore) / totalWeight) * 200));
  const confidence = Math.min(100, Math.round(
    (Math.abs(netScore) / totalWeight) * 100 + (adxTrend === 'strong' ? 15 : 0) + (bbSqueeze ? 10 : 0)
  ));

  // ─── Arabic Summary ──────────────────────────────────────
  const rsiPhrase = rsiSignal === 'overbought'
    ? `مؤشر القوة النسبية عند ${rsiValue.toFixed(0)} يشير إلى منطقة تشبع شرائي`
    : rsiSignal === 'oversold'
      ? `مؤشر القوة النسبية عند ${rsiValue.toFixed(0)} يشير إلى منطقة تشبع بيعي`
      : `مؤشر القوة النسبية عند ${rsiValue.toFixed(0)} في نطاق متعادل`;

  const macdPhrase = macdTrend === 'bullish'
    ? 'تقاطع MACD الإيجابي يدعم الاتجاه الصعودي'
    : macdTrend === 'bearish'
      ? 'تقاطع MACD السلبي يؤكد الاتجاه الهبوطي'
      : 'MACD متعادل بدون زخم واضح';

  const bbPhrase = bbSqueeze
    ? 'نطاق بولينجر يشهد تضيقاً قد يسبق حركة قوية'
    : 'نطاق بولينجر متسع بشكل طبيعي';

  const directionPhrase =
    direction === 'bullish' ? 'الإشارة العامة صعودية' :
    direction === 'bearish' ? 'الإشارة العامة هبوطية' :
    'الإشارة العامة محايدة';

  const arabicSummary = `${rsiPhrase}، بينما ${macdPhrase}. ${bbPhrase}. ${directionPhrase} بقوة ${strength}%.`;

  // ─── Key Insights (3-5 in Arabic) ────────────────────────
  const keyInsights: string[] = [];

  // RSI insight
  if (rsiSignal === 'overbought') {
    keyInsights.push(`RSI يهدد بتجاوز 70 عند ${rsiValue.toFixed(1)} — احتمال تصحيح قريب`);
  } else if (rsiSignal === 'oversold') {
    keyInsights.push(`RSI تحت 30 عند ${rsiValue.toFixed(1)} — فرصة ارتداد محتملة`);
  }

  // Resistance insight
  if (resistanceLevels.length > 0) {
    const nearest = resistanceLevels[0];
    keyInsights.push(`السعر يقترب من مقاومة ${nearest.toFixed(2)} — اختراقها قد يدفع السعر إلى ${(nearest * 1.015).toFixed(2)}`);
  }

  // Support insight
  if (supportLevels.length > 0) {
    const nearest = supportLevels[0];
    keyInsights.push(`دعم رئيسي عند ${nearest.toFixed(2)} — كسره قد يفتح الطريق نحو ${(nearest * 0.985).toFixed(2)}`);
  }

  // Squeeze insight
  if (bbSqueeze) {
    keyInsights.push('تضيق بولينجر يشير إلى حركة قوية قادمة — راقب الاختراق');
  }

  // ADX insight
  if (adxTrend === 'strong') {
    keyInsights.push(`ADX عند ${adxValue.toFixed(1)} يؤكد قوة الاتجاه — يُنصح بمتابعة الزخم`);
  } else if (adxTrend === 'weak') {
    keyInsights.push('الاتجاه ضعيف — يُفضل الانتظار حتى يتضح المسار');
  }

  // Ensure at least 3 insights
  if (keyInsights.length < 3) {
    if (macdTrend === 'bullish') {
      keyInsights.push('MACD يظهر تقاطعاً صعودياً — إشارة شرائية');
    } else if (macdTrend === 'bearish') {
      keyInsights.push('MACD يظهر تقاطعاً هبوطياً — إشارة بيعية');
    }
  }
  if (keyInsights.length < 3) {
    keyInsights.push(`ATR عند ${atrValue.toFixed(2)} — تقلب ${volatility === 'high' ? 'مرتفع' : volatility === 'low' ? 'منخفض' : 'متوسط'}`);
  }

  return {
    rsi: {
      value: Math.round(rsiValue * 100) / 100,
      signal: rsiSignal,
      description: rsiDescriptionAr(rsiValue, rsiSignal),
    },
    macd: {
      macdLine: Math.round(macdLine * 10000) / 10000,
      signalLine: Math.round(signalLine * 10000) / 10000,
      histogram: Math.round(histogram * 10000) / 10000,
      trend: macdTrend,
      description: macdDescriptionAr(histogram, macdTrend),
    },
    bollingerBands: {
      upper: Math.round(bbUpper * 100) / 100,
      middle: Math.round(bbMiddle * 100) / 100,
      lower: Math.round(bbLower * 100) / 100,
      position: bbPosition,
      squeeze: bbSqueeze,
      description: bbDescriptionAr(bbPosition, bbSqueeze),
    },
    sma: smaResults,
    stochastic: {
      k: Math.round(stochK * 100) / 100,
      d: Math.round(stochD * 100) / 100,
      signal: stochSignal,
    },
    adx: {
      value: Math.round(adxValue * 100) / 100,
      trend: adxTrend,
      description: adxDescriptionAr(adxValue, adxTrend),
    },
    atr: {
      value: Math.round(atrValue * 100) / 100,
      volatility,
    },
    overallSignal: {
      direction,
      strength,
      confidence,
    },
    supportLevels,
    resistanceLevels,
    arabicSummary,
    keyInsights: keyInsights.slice(0, 5),
  };
}

// ─── Empty Analysis Fallback ────────────────────────────────────

function createEmptyAnalysis(): MarketAnalysis {
  return {
    rsi: { value: 50, signal: 'neutral', description: 'بيانات غير كافية لحساب RSI' },
    macd: { macdLine: 0, signalLine: 0, histogram: 0, trend: 'neutral', description: 'بيانات غير كافية لحساب MACD' },
    bollingerBands: { upper: 0, middle: 0, lower: 0, position: 'middle', squeeze: false, description: 'بيانات غير كافية لحساب بولينجر' },
    sma: {},
    stochastic: { k: 50, d: 50, signal: 'بيانات غير كافية' },
    adx: { value: 0, trend: 'neutral', description: 'بيانات غير كافية لحساب ADX' },
    atr: { value: 0, volatility: 'low' },
    overallSignal: { direction: 'neutral', strength: 0, confidence: 0 },
    supportLevels: [],
    resistanceLevels: [],
    arabicSummary: 'لا تتوفر بيانات كافية لإجراء التحليل الفني',
    keyInsights: ['لا تتوفر بيانات كافية — يرجى المحاولة لاحقاً'],
  };
}
