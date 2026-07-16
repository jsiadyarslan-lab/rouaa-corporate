// ─── Technical Analysis Engine ──────────────────────────────────
// Provides REAL, SPECIFIC analysis that delivers investor value:
// - Support/resistance levels with prices
// - Trend detection and direction
// - Moving averages and crossovers
// - Volatility measurement (ATR)
// - Trade setups with entry/stop/target
// - Risk/reward calculations

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 1-5, how many touches
  labelAr: string;
  labelEn: string;
}

export interface TrendInfo {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  descriptionAr: string;
  descriptionEn: string;
}

export interface MovingAverageInfo {
  sma20: number;
  sma50: number;
  sma200?: number;
  crossover: 'golden' | 'death' | 'none';
  priceVsSMA20: 'above' | 'below';
  priceVsSMA50: 'above' | 'below';
}

export interface TradeSetup {
  direction: 'long' | 'short' | 'wait';
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  riskRewardRatio: number;
  confidence: number; // 0-100
  reasoningAr: string;
  reasoningEn: string;
}

export interface IndicatorSignal {
  name: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  descriptionAr: string;
  descriptionEn: string;
}

export interface TechnicalAnalysisResult {
  symbol: string;
  currentPrice: number;
  changePercent: number;
  trend: TrendInfo;
  supportLevels: SupportResistanceLevel[];
  resistanceLevels: SupportResistanceLevel[];
  movingAverages: MovingAverageInfo;
  indicators: IndicatorSignal[];
  tradeSetup: TradeSetup;
  volatility: number; // ATR-based
  overallSignal: 'bullish' | 'bearish' | 'neutral';
  overallScore: number; // -100 to +100
  summaryAr: string;
  summaryEn: string;
  keyLevelsAr: string;
  keyLevelsEn: string;
  stochastic: { k: number; d: number };
  ichimoku: { tenkan: number; kijun: number; senkouA: number; senkouB: number; cloudColor: 'bullish' | 'bearish' | 'neutral' };
}

// ─── Helper Functions ──────────────────────────────────────────

function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

function calculateEMA(data: number[], period: number): number {
  const k = 2 / (period + 1);
  let result = data[0];
  for (let i = 1; i < data.length; i++) {
    result = data[i] * k + result * (1 - k);
  }
  return result;
}

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calculateATR(data: OHLCV[], period = 14): number {
  if (data.length < period + 1) return 0;
  let atrSum = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const trueRange = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    atrSum += trueRange;
  }
  return atrSum / period;
}

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macd = ema12 - ema26;
  // Simplified signal line
  const macdHistory: number[] = [];
  for (let i = Math.max(0, closes.length - 50); i < closes.length; i++) {
    const e12 = calculateEMA(closes.slice(0, i + 1), 12);
    const e26 = calculateEMA(closes.slice(0, i + 1), 26);
    macdHistory.push(e12 - e26);
  }
  const signal = macdHistory.length >= 9 ? calculateEMA(macdHistory, 9) : macd;
  return { macd, signal, histogram: macd - signal };
}

function calculateStochastic(data: OHLCV[], period = 14): { k: number; d: number } {
  if (data.length < period) return { k: 50, d: 50 };
  const slice = data.slice(-period);
  const highestHigh = Math.max(...slice.map(d => d.high));
  const lowestLow = Math.min(...slice.map(d => d.low));
  const currentClose = data[data.length - 1].close;
  const k = highestHigh === lowestLow ? 50 : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  return { k, d: k }; // Simplified %D
}

function calculateIchimoku(data: OHLCV[]): {
  tenkan: number;
  kijun: number;
  senkouA: number;
  senkouB: number;
  cloudColor: 'bullish' | 'bearish' | 'neutral';
} {
  if (data.length < 52) return { tenkan: 0, kijun: 0, senkouA: 0, senkouB: 0, cloudColor: 'neutral' };
  
  // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
  const recent9 = data.slice(-9);
  const high9 = Math.max(...recent9.map(d => d.high));
  const low9 = Math.min(...recent9.map(d => d.low));
  const tenkan = (high9 + low9) / 2;
  
  // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
  const recent26 = data.slice(-26);
  const high26 = Math.max(...recent26.map(d => d.high));
  const low26 = Math.min(...recent26.map(d => d.low));
  const kijun = (high26 + low26) / 2;
  
  // Senkou Span A (Leading Span A): (Tenkan + Kijun) / 2
  const senkouA = (tenkan + kijun) / 2;
  
  // Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2
  const recent52 = data.slice(-52);
  const high52 = Math.max(...recent52.map(d => d.high));
  const low52 = Math.min(...recent52.map(d => d.low));
  const senkouB = (high52 + low52) / 2;
  
  const cloudColor = senkouA > senkouB ? 'bullish' : senkouA < senkouB ? 'bearish' : 'neutral';
  
  return { tenkan, kijun, senkouA, senkouB, cloudColor };
}

// ─── Support/Resistance Detection ──────────────────────────────

function findSupportResistance(data: OHLCV[], realCurrentPrice: number): { support: SupportResistanceLevel[]; resistance: SupportResistanceLevel[] } {
  if (data.length < 10) return { support: [], resistance: [] };

  // CRITICAL: Use the REAL current price (from quote), not the last data point
  // The last data point might be stale or from synthetic data that doesn't match
  const currentPrice = realCurrentPrice;
  const levels: Map<number, { price: number; touches: number }> = new Map();

  // Find pivot points (local highs and lows)
  for (let i = 2; i < data.length - 2; i++) {
    // Pivot high
    if (data[i].high > data[i - 1].high && data[i].high > data[i - 2].high &&
        data[i].high > data[i + 1].high && data[i].high > data[i + 2].high) {
      const level = data[i].high;
      const rounded = Math.round(level * 100) / 100;
      const existing = levels.get(rounded) || { price: rounded, touches: 0 };
      existing.touches++;
      levels.set(rounded, existing);
    }

    // Pivot low
    if (data[i].low < data[i - 1].low && data[i].low < data[i - 2].low &&
        data[i].low < data[i + 1].low && data[i].low < data[i + 2].low) {
      const level = data[i].low;
      const rounded = Math.round(level * 100) / 100;
      const existing = levels.get(rounded) || { price: rounded, touches: 0 };
      existing.touches++;
      levels.set(rounded, existing);
    }
  }

  // Also add significant round-number levels near current price
  // These are psychologically important levels that traders watch
  const magnitude = Math.pow(10, Math.floor(Math.log10(currentPrice)) - 1);
  const roundLevels = [
    Math.round(currentPrice / magnitude) * magnitude, // nearest round number
    Math.round((currentPrice + magnitude) / magnitude) * magnitude, // next round above
    Math.round((currentPrice - magnitude) / magnitude) * magnitude, // next round below
  ];
  for (const rl of roundLevels) {
    if (rl > 0 && Math.abs(rl - currentPrice) / currentPrice < 0.15) {
      const key = Math.round(rl * 100) / 100;
      if (!levels.has(key)) {
        levels.set(key, { price: key, touches: 1 });
      }
    }
  }

  // Cluster nearby levels (within 0.5% of each other)
  const clustered: { price: number; touches: number }[] = [];
  const sorted = Array.from(levels.values()).sort((a, b) => a.price - b.price);

  for (const level of sorted) {
    const nearby = clustered.find(c =>
      Math.abs(c.price - level.price) / Math.max(c.price, level.price) < 0.005
    );
    if (nearby) {
      nearby.price = nearby.touches >= level.touches ? nearby.price : level.price;
      nearby.touches += level.touches;
    } else {
      clustered.push({ ...level });
    }
  }

  // Classify relative to REAL current price
  const support: SupportResistanceLevel[] = [];
  const resistance: SupportResistanceLevel[] = [];

  for (const level of clustered) {
    // Only include levels within 15% of current price
    const distance = Math.abs(level.price - currentPrice) / currentPrice;
    if (distance > 0.15) continue;

    const isSupport = level.price < currentPrice;
    const levelObj: SupportResistanceLevel = {
      price: level.price,
      type: isSupport ? 'support' : 'resistance',
      strength: Math.min(5, level.touches),
      labelAr: isSupport ? `دعم ${level.price.toFixed(2)}` : `مقاومة ${level.price.toFixed(2)}`,
      labelEn: isSupport ? `Support ${level.price.toFixed(2)}` : `Resistance ${level.price.toFixed(2)}`,
    };

    if (isSupport) support.push(levelObj);
    else resistance.push(levelObj);
  }

  // Sort: support from nearest to farthest, resistance from nearest to farthest
  support.sort((a, b) => b.price - a.price); // closest support first
  resistance.sort((a, b) => a.price - b.price); // closest resistance first

  // If we don't have enough levels, add dynamic ones based on ATR
  if (support.length === 0 || resistance.length === 0) {
    const atr = calculateATR(data, 14);
    if (atr > 0) {
      if (support.length === 0) {
        const sup = currentPrice - atr * 2;
        support.push({
          price: Math.round(sup * 100) / 100,
          type: 'support',
          strength: 2,
          labelAr: `دعم ${sup.toFixed(2)}`,
          labelEn: `Support ${sup.toFixed(2)}`,
        });
      }
      if (resistance.length === 0) {
        const res = currentPrice + atr * 2;
        resistance.push({
          price: Math.round(res * 100) / 100,
          type: 'resistance',
          strength: 2,
          labelAr: `مقاومة ${res.toFixed(2)}`,
          labelEn: `Resistance ${res.toFixed(2)}`,
        });
      }
    }
  }

  return {
    support: support.slice(0, 3),
    resistance: resistance.slice(0, 3),
  };
}

// ─── Trend Detection ───────────────────────────────────────────

function detectTrend(data: OHLCV[]): TrendInfo {
  if (data.length < 20) {
    return {
      direction: 'neutral',
      strength: 0,
      descriptionAr: 'بيانات غير كافية لتحديد الاتجاه',
      descriptionEn: 'Insufficient data to determine trend',
    };
  }

  const closes = data.map(d => d.close);
  const recent = closes.slice(-20);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = closes.length >= 50 ? calculateSMA(closes, 50) : sma20;

  // Linear regression on last 20 points for trend direction
  const n = recent.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recent[i];
    sumXY += i * recent[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const avgPrice = sumY / n;
  const normalizedSlope = slope / avgPrice * 100; // percentage slope

  // Count higher highs and higher lows (bullish) or lower highs and lower lows (bearish)
  let bullPoints = 0, bearPoints = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) bullPoints++;
    else bearPoints++;
  }

  // Price vs moving averages
  const currentPrice = closes[closes.length - 1];
  const aboveSMA20 = currentPrice > sma20;
  const aboveSMA50 = currentPrice > sma50;

  // Score calculation
  let score = 0;
  score += normalizedSlope > 0.05 ? 25 : normalizedSlope < -0.05 ? -25 : 0;
  score += bullPoints > bearPoints * 1.3 ? 20 : bearPoints > bullPoints * 1.3 ? -20 : 0;
  score += aboveSMA20 ? 15 : -15;
  score += aboveSMA50 ? 15 : -15;
  score += sma20 > sma50 ? 15 : -15;

  const direction: 'bullish' | 'bearish' | 'neutral' =
    score > 25 ? 'bullish' : score < -25 ? 'bearish' : 'neutral';

  const strength = Math.min(100, Math.abs(score));

  const descriptions = {
    bullish: {
      ar: `الاتجاه صاعد بقوة ${strength}%. السعر فوق المتوسطات المتحركة وأعلى نقاط القمم في ارتفاع.`,
      en: `Uptrend with ${strength}% strength. Price is above moving averages and forming higher highs.`,
    },
    bearish: {
      ar: `الاتجاه هابط بقوة ${strength}%. السعر تحت المتوسطات المتحركة وأقل نقاط القيعان في انخفاض.`,
      en: `Downtrend with ${strength}% strength. Price is below moving averages and forming lower lows.`,
    },
    neutral: {
      ar: `الاتجاه عرضي بدون زخم واضح. السعر يتداول في نطاق محدود.`,
      en: `Sideways trend with no clear momentum. Price is trading in a range.`,
    },
  };

  return {
    direction,
    strength,
    descriptionAr: descriptions[direction].ar,
    descriptionEn: descriptions[direction].en,
  };
}

// ─── Main Analysis Function ────────────────────────────────────

export function performTechnicalAnalysis(
  data: OHLCV[],
  symbol: string,
  currentPrice: number,
  changePercent: number,
): TechnicalAnalysisResult {
  if (data.length < 5) {
    return createMinimalResult(symbol, currentPrice, changePercent);
  }

  const closes = data.map(d => d.close);
  const lastClose = closes[closes.length - 1];

  // Use provided price or last close
  const price = currentPrice || lastClose;

  // ─── 1. Trend Detection ───
  const trend = detectTrend(data);

  // ─── 2. Support/Resistance ───
  // CRITICAL: Pass the REAL current price so levels are classified correctly
  const { support: supportLevels, resistance: resistanceLevels } = findSupportResistance(data, price);

  // ─── 3. Moving Averages ───
  const sma20 = calculateSMA(closes, 20);
  const sma50 = closes.length >= 50 ? calculateSMA(closes, 50) : sma20;
  const sma200 = closes.length >= 200 ? calculateSMA(closes, 200) : undefined;

  const prevSMA20 = closes.length >= 21 ? calculateSMA(closes.slice(0, -1), 20) : sma20;
  const prevSMA50 = closes.length >= 51 ? calculateSMA(closes.slice(0, -1), 50) : sma50;

  const movingAverages: MovingAverageInfo = {
    sma20: Math.round(sma20 * 100) / 100,
    sma50: Math.round(sma50 * 100) / 100,
    sma200: sma200 ? Math.round(sma200 * 100) / 100 : undefined,
    crossover: prevSMA20 <= prevSMA50 && sma20 > sma50 ? 'golden'
      : prevSMA20 >= prevSMA50 && sma20 < sma50 ? 'death' : 'none',
    priceVsSMA20: price > sma20 ? 'above' : 'below',
    priceVsSMA50: price > sma50 ? 'above' : 'below',
  };

  // ─── 4. Indicators ───
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const stoch = calculateStochastic(data, 14);
  const atr = calculateATR(data, 14);

  // ─── 4b. Bollinger Bands (20-period SMA ± 2σ) ───
  const bbPeriod = 20;
  const bbMultiplier = 2;
  let bbUpper = 0, bbMiddle = 0, bbLower = 0;
  if (closes.length >= bbPeriod) {
    bbMiddle = calculateSMA(closes, bbPeriod);
    const bbSlice = closes.slice(-bbPeriod);
    const variance = bbSlice.reduce((sum, v) => sum + Math.pow(v - bbMiddle, 2), 0) / bbPeriod;
    const stdDev = Math.sqrt(variance);
    bbUpper = bbMiddle + bbMultiplier * stdDev;
    bbLower = bbMiddle - bbMultiplier * stdDev;
  }

  // ─── 4c. Ichimoku Cloud ───
  const ichimoku = calculateIchimoku(data);

  const indicators: IndicatorSignal[] = [
    {
      name: 'RSI (14)',
      value: rsi,
      signal: rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral',
      descriptionAr: rsi > 70 ? `RSI = ${rsi.toFixed(1)} — ذروة شراء، احتمال تصحيح` :
                     rsi < 30 ? `RSI = ${rsi.toFixed(1)} — ذروة بيع، فرصة ارتداد` :
                     `RSI = ${rsi.toFixed(1)} — نطاق طبيعي`,
      descriptionEn: rsi > 70 ? `RSI = ${rsi.toFixed(1)} — Overbought, correction likely` :
                     rsi < 30 ? `RSI = ${rsi.toFixed(1)} — Oversold, bounce possible` :
                     `RSI = ${rsi.toFixed(1)} — Normal range`,
    },
    {
      name: 'MACD',
      value: macd.macd,
      signal: macd.histogram > 0 ? 'bullish' : macd.histogram < 0 ? 'bearish' : 'neutral',
      descriptionAr: macd.histogram > 0 ? `MACD إيجابي (${macd.histogram.toFixed(2)}) — زخم صعودي` :
                     `MACD سلبي (${macd.histogram.toFixed(2)}) — زخم هبوطي`,
      descriptionEn: macd.histogram > 0 ? `MACD positive (${macd.histogram.toFixed(2)}) — Bullish momentum` :
                     `MACD negative (${macd.histogram.toFixed(2)}) — Bearish momentum`,
    },
    {
      name: 'Bollinger Bands',
      value: price,
      signal: price > bbUpper ? 'bearish' : price < bbLower ? 'bullish' : 'neutral',
      descriptionAr: bbMiddle > 0
        ? price > bbUpper ? `السعر فوق الحد العلوي (${bbUpper.toFixed(2)}) — ذروة شراء`
          : price < bbLower ? `السعر تحت الحد السفلي (${bbLower.toFixed(2)}) — ذروة بيع`
          : `السعر داخل النطاق [${bbLower.toFixed(2)} — ${bbUpper.toFixed(2)}]`
        : 'بيانات غير كافية لحساب بولينجر',
      descriptionEn: bbMiddle > 0
        ? price > bbUpper ? `Price above upper band (${bbUpper.toFixed(2)}) — Overbought`
          : price < bbLower ? `Price below lower band (${bbLower.toFixed(2)}) — Oversold`
          : `Price within bands [${bbLower.toFixed(2)} — ${bbUpper.toFixed(2)}]`
        : 'Insufficient data for Bollinger Bands',
    },
    {
      name: 'Stochastic %K/%D',
      value: stoch.k,
      signal: stoch.k > 80 ? 'bearish' : stoch.k < 20 ? 'bullish' : 'neutral',
      descriptionAr: stoch.k > 80 ? `%K = ${stoch.k.toFixed(1)} — ذروة شراء، احتمال تصحيح` :
                     stoch.k < 20 ? `%K = ${stoch.k.toFixed(1)} — ذروة بيع، فرصة ارتداد` :
                     `%K = ${stoch.k.toFixed(1)} — نطاق عادي`,
      descriptionEn: stoch.k > 80 ? `%K = ${stoch.k.toFixed(1)} — Overbought, correction likely` :
                     stoch.k < 20 ? `%K = ${stoch.k.toFixed(1)} — Oversold, bounce possible` :
                     `%K = ${stoch.k.toFixed(1)} — Normal range`,
    },
    {
      name: 'Ichimoku Cloud',
      value: ichimoku.tenkan,
      signal: ichimoku.cloudColor === 'bullish' ? 'bullish' : ichimoku.cloudColor === 'bearish' ? 'bearish' : 'neutral',
      descriptionAr: ichimoku.tenkan > 0
        ? ichimoku.cloudColor === 'bullish'
          ? `سحابة صاعدة — التينكان ${ichimoku.tenkan.toFixed(2)} / الكيجون ${ichimoku.kijun.toFixed(2)}`
          : `سحابة هابطة — التينكان ${ichimoku.tenkan.toFixed(2)} / الكيجون ${ichimoku.kijun.toFixed(2)}`
        : 'بيانات غير كافية لإشكيموكو',
      descriptionEn: ichimoku.tenkan > 0
        ? ichimoku.cloudColor === 'bullish'
          ? `Bullish cloud — Tenkan ${ichimoku.tenkan.toFixed(2)} / Kijun ${ichimoku.kijun.toFixed(2)}`
          : `Bearish cloud — Tenkan ${ichimoku.tenkan.toFixed(2)} / Kijun ${ichimoku.kijun.toFixed(2)}`
        : 'Insufficient data for Ichimoku',
    },
  ];

  // Add SMA crossover signal if applicable
  if (movingAverages.crossover !== 'none') {
    indicators.push({
      name: 'SMA Cross',
      value: sma20 - sma50,
      signal: movingAverages.crossover === 'golden' ? 'bullish' : 'bearish',
      descriptionAr: movingAverages.crossover === 'golden'
        ? `تقاطع ذهبي: SMA20 فوق SMA50 — إشارة صعودية قوية`
        : `تقاطع الموت: SMA20 تحت SMA50 — إشارة هبوطية قوية`,
      descriptionEn: movingAverages.crossover === 'golden'
        ? `Golden Cross: SMA20 above SMA50 — Strong bullish signal`
        : `Death Cross: SMA20 below SMA50 — Strong bearish signal`,
    });
  }

  // ─── 5. Trade Setup ───
  // Use ATR for reasonable stop/target distances
  // Fallback to 2% of price if ATR is 0 or unreasonable
  const reasonableATR = (atr > 0 && atr < price * 0.15) ? atr : price * 0.02;
  const nearestSupport = supportLevels[0]?.price || (price - reasonableATR * 2);
  const nearestResistance = resistanceLevels[0]?.price || (price + reasonableATR * 2);

  let tradeSetup: TradeSetup;

  if (trend.direction === 'bullish' && rsi < 70) {
    const entry = price;
    // Stop loss: just below nearest support, or 1.5x ATR below entry
    const stopLoss = Math.min(nearestSupport - reasonableATR * 0.3, entry - reasonableATR * 1.5);
    // Target: just above nearest resistance, or 2x ATR above entry
    const target = Math.max(nearestResistance + reasonableATR * 0.3, entry + reasonableATR * 2);
    const risk = entry - stopLoss;
    const reward = target - entry;
    const rr = risk > 0 ? reward / risk : 0;
    tradeSetup = {
      direction: 'long',
      entryPrice: Math.round(entry * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      targetPrice: Math.round(target * 100) / 100,
      riskRewardRatio: Math.round(rr * 100) / 100,
      confidence: Math.min(85, trend.strength + (macd.histogram > 0 ? 15 : 0)),
      reasoningAr: `الاتجاه صاعد مع RSI في نطاق جيد. الدخول شراء عند ${entry.toFixed(2)} مع وقف خسارة عند ${stopLoss.toFixed(2)} واستهداف ${target.toFixed(2)}. نسبة المخاطرة/العائد ${rr.toFixed(1)}:1`,
      reasoningEn: `Uptrend with RSI in favorable range. Buy entry at ${entry.toFixed(2)} with stop loss at ${stopLoss.toFixed(2)} targeting ${target.toFixed(2)}. Risk/Reward ratio ${rr.toFixed(1)}:1`,
    };
  } else if (trend.direction === 'bearish' && rsi > 30) {
    const entry = price;
    // Stop loss: just above nearest resistance, or 1.5x ATR above entry
    const stopLoss = Math.max(nearestResistance + reasonableATR * 0.3, entry + reasonableATR * 1.5);
    // Target: just below nearest support, or 2x ATR below entry
    const target = Math.min(nearestSupport - reasonableATR * 0.3, entry - reasonableATR * 2);
    const risk = stopLoss - entry;
    const reward = entry - target;
    const rr = risk > 0 ? reward / risk : 0;
    tradeSetup = {
      direction: 'short',
      entryPrice: Math.round(entry * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      targetPrice: Math.round(target * 100) / 100,
      riskRewardRatio: Math.round(rr * 100) / 100,
      confidence: Math.min(85, trend.strength + (macd.histogram < 0 ? 15 : 0)),
      reasoningAr: `الاتجاه هابط مع RSI في نطاق جيد. الدخول بيع عند ${entry.toFixed(2)} مع وقف خسارة عند ${stopLoss.toFixed(2)} واستهداف ${target.toFixed(2)}. نسبة المخاطرة/العائد ${rr.toFixed(1)}:1`,
      reasoningEn: `Downtrend with RSI in favorable range. Sell entry at ${entry.toFixed(2)} with stop loss at ${stopLoss.toFixed(2)} targeting ${target.toFixed(2)}. Risk/Reward ratio ${rr.toFixed(1)}:1`,
    };
  } else {
    tradeSetup = {
      direction: 'wait',
      entryPrice: Math.round(price * 100) / 100,
      stopLoss: 0,
      targetPrice: 0,
      riskRewardRatio: 0,
      confidence: 0,
      reasoningAr: `لا توجد إشارة واضحة حالياً. الاتجاه عرضي أو المؤشرات متضاربة. يُنصح بالانتظار حتى تتضح الإشارة.`,
      reasoningEn: `No clear signal at this time. Trend is sideways or indicators are conflicting. Advisable to wait for a clearer setup.`,
    };
  }

  // ─── 6. Overall Score ───
  let score = 0;
  score += trend.direction === 'bullish' ? 25 : trend.direction === 'bearish' ? -25 : 0;
  score += rsi > 70 ? -15 : rsi < 30 ? 15 : 0;
  score += macd.histogram > 0 ? 15 : macd.histogram < 0 ? -15 : 0;
  score += movingAverages.priceVsSMA20 === 'above' ? 10 : -10;
  score += movingAverages.crossover === 'golden' ? 20 : movingAverages.crossover === 'death' ? -20 : 0;
  score += changePercent > 0 ? 5 : changePercent < 0 ? -5 : 0;
  // Bollinger Bands contribution to score
  if (bbMiddle > 0) {
    score += price > bbUpper ? -10 : price < bbLower ? 10 : 0;
  }
  // Ichimoku Cloud contribution to score
  if (ichimoku.tenkan > 0) {
    score += ichimoku.cloudColor === 'bullish' ? 10 : ichimoku.cloudColor === 'bearish' ? -10 : 0;
  }
  // Stochastic contribution to score
  if (stoch.k > 80) score -= 10;
  else if (stoch.k < 20) score += 10;

  const overallSignal: 'bullish' | 'bearish' | 'neutral' = score > 20 ? 'bullish' : score < -20 ? 'bearish' : 'neutral';

  // ─── 7. Summaries ───
  const isUp = changePercent >= 0;
  const directionAr = trend.direction === 'bullish' ? 'صاعداً' : trend.direction === 'bearish' ? 'هابطاً' : 'عرضياً';
  const directionEn = trend.direction === 'bullish' ? 'bullish' : trend.direction === 'bearish' ? 'bearish' : 'sideways';

  const summaryAr = `${symbol} يتجه ${directionAr} بقوة ${trend.strength}%. السعر الحالي ${price.toFixed(2)} (${isUp ? '+' : ''}${changePercent.toFixed(2)}%). ${rsi > 70 ? 'مؤشر RSI في ذروة الشراء مما قد يشير لتصحيح قريب.' : rsi < 30 ? 'مؤشر RSI في ذروة البيع مما قد يشير لفرصة ارتداد.' : 'مؤشر RSI في نطاق طبيعي.'} ${macd.histogram > 0 ? 'زخم MACD إيجابي.' : 'زخم MACD سلبي.'} الإشارة العامة: ${overallSignal === 'bullish' ? 'شرائية' : overallSignal === 'bearish' ? 'بيعية' : 'محايدة'}.`;

  const summaryEn = `${symbol} is in a ${directionEn} trend with ${trend.strength}% strength. Current price ${price.toFixed(2)} (${isUp ? '+' : ''}${changePercent.toFixed(2)}%). ${rsi > 70 ? 'RSI is overbought, suggesting a potential correction.' : rsi < 30 ? 'RSI is oversold, suggesting a potential bounce.' : 'RSI is in normal range.'} ${macd.histogram > 0 ? 'MACD momentum is positive.' : 'MACD momentum is negative.'} Overall signal: ${overallSignal}.`;

  // Key levels text
  const supportText = supportLevels.slice(0, 2).map(l => l.price.toFixed(2)).join(' و ');
  const resistText = resistanceLevels.slice(0, 2).map(l => l.price.toFixed(2)).join(' و ');

  const keyLevelsAr = supportText ? `مستويات الدعم: ${supportText}` : 'لا مستويات دعم واضحة';
  const keyLevelsEn = supportText ? `Support levels: ${supportText}` : 'No clear support levels';
  const keyLevelsArFull = `${keyLevelsAr}. ${resistText ? `مستويات المقاومة: ${resistText}` : 'لا مستويات مقاومة واضحة'}`;
  const keyLevelsEnFull = `${keyLevelsEn}. ${resistText ? `Resistance levels: ${resistText}` : 'No clear resistance levels'}`;

  return {
    symbol,
    currentPrice: price,
    changePercent,
    trend,
    supportLevels,
    resistanceLevels,
    movingAverages,
    indicators,
    tradeSetup,
    volatility: atr,
    overallSignal,
    overallScore: score,
    summaryAr,
    summaryEn,
    keyLevelsAr: keyLevelsArFull,
    keyLevelsEn: keyLevelsEnFull,
    stochastic: stoch,
    ichimoku,
  };
}

function createMinimalResult(symbol: string, currentPrice: number, changePercent: number): TechnicalAnalysisResult {
  return {
    symbol,
    currentPrice,
    changePercent,
    trend: { direction: 'neutral', strength: 0, descriptionAr: 'بيانات غير كافية', descriptionEn: 'Insufficient data' },
    supportLevels: [],
    resistanceLevels: [],
    movingAverages: { sma20: currentPrice, sma50: currentPrice, crossover: 'none', priceVsSMA20: 'above', priceVsSMA50: 'above' },
    indicators: [],
    tradeSetup: { direction: 'wait', entryPrice: currentPrice, stopLoss: 0, targetPrice: 0, riskRewardRatio: 0, confidence: 0, reasoningAr: 'بيانات غير كافية', reasoningEn: 'Insufficient data' },
    volatility: 0,
    overallSignal: 'neutral',
    overallScore: 0,
    summaryAr: `لا تتوفر بيانات كافية لتحليل ${symbol}`,
    summaryEn: `Insufficient data available for ${symbol} analysis`,
    keyLevelsAr: 'لا مستويات متاحة',
    keyLevelsEn: 'No levels available',
    stochastic: { k: 50, d: 50 },
    ichimoku: { tenkan: 0, kijun: 0, senkouA: 0, senkouB: 0, cloudColor: 'neutral' as const },
  };
}
