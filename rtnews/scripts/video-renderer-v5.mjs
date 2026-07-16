#!/usr/bin/env node
// ─── Professional Video Renderer V5 ──────────────────────────────
// Key-frame Playwright pipeline for Bloomberg/CNBC-style Arabic trading news videos
//
// Architecture:
//   - Each "pulse" (scene) generates N key frames at different animation states
//   - HTML includes a window.setAnimationProgress(p) function (0→1) that updates all animated elements
//   - Playwright sets the HTML once, then calls page.evaluate() to advance animation, then screenshots
//   - FFmpeg stitches frames + voiceover into final video
//
// 9 Pulses:
//   1. Ignition  (0-8s,   10 key frames)  — Countdown + screen activation + ticker starts
//   2. Shock     (8-25s,  14 key frames)  — Main number counts up + gauge fills + timeline draws + flash alert
//   3. Roots     (25-38s, 10 key frames)  — 3 interconnected root cause circles + intersection point
//   4. Race      (38-55s, 14 key frames)  — Racing bar chart of indicators + morph to line chart
//   5. History   (55-68s, 10 key frames)  — 3 historical parallels on vertical timeline + comparison
//   6. Alert     (68-82s, 10 key frames)  — 3 scenario flash alerts (green/yellow/red) with probability bars
//   7. Takeaway  (82-95s, 10 key frames)  — 3 strategic facts slide-up with color coding
//   8. Deal      (95-110s,12 key frames)  — Asset grid (benefiting/harmed) + chart morph to treemap
//   9. Harvest   (110-120s, 8 key frames) — Recommendations ticker + brand logo pulse + fade out
//
// Usage:
//   node scripts/video-renderer-v5.mjs --input /path/to/data.json --output /path/to/output.mp4

import { chromium } from 'playwright';
import { execSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// ─── Constants ────────────────────────────────────────────────────
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24;

const COLORS = {
  bgDark: '#0a1120',
  bgCard: '#121c32',
  bgCardLight: '#192641',
  accentBlue: '#3b82f6',
  accentCyan: '#00E5FF',
  accentGreen: '#22c55e',
  accentRed: '#ef4444',
  accentYellow: '#f59e0b',
  accentGold: '#d4af37',
  accentPurple: '#8b5cf6',
  textWhite: '#ffffff',
  textGray: '#94a3b8',
  textLight: '#cbd5e1',
  textDim: '#64748b',
  borderBlue: 'rgba(59,130,246,0.15)',
  glowBlue: 'rgba(59,130,246,0.3)',
};

// Content area dimensions (between ticker and news bar)
const TICKER_HEIGHT = 48;
const NEWSBAR_HEIGHT = 36;
const CONTENT_HEIGHT = HEIGHT - TICKER_HEIGHT - NEWSBAR_HEIGHT; // 996px

// Pulse definitions: [name, startSec, endSec, keyFrameCount]
const PULSE_DEFS = [
  ['ignition',  0,   8,   10],
  ['shock',     8,   25,  14],
  ['roots',     25,  38,  10],
  ['race',      38,  55,  14],
  ['history',   55,  68,  10],
  ['alert',     68,  82,  10],
  ['takeaway',  82,  95,  10],
  ['deal',      95,  110, 12],
  ['harvest',   110, 120, 8],
];

// Arabic numeral mapping for pulse counter
const AR_NUMERALS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toArabicNumeral(n) {
  return String(n).split('').map(d => AR_NUMERALS[parseInt(d)] || d).join('');
}

// ─── CLI Argument Parsing ────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      parsed[key] = args[i + 1] || true;
      i++;
    }
  }
  return parsed;
}

// ─── Utility Functions ────────────────────────────────────────────
function getImpactColor(marketImpact) {
  if (['bullish', 'positive'].includes(marketImpact)) return COLORS.accentGreen;
  if (['bearish', 'negative'].includes(marketImpact)) return COLORS.accentRed;
  return COLORS.accentGold;
}

function getImpactLabel(marketImpact, locale) {
  if (['bullish', 'positive'].includes(marketImpact)) {
    return locale === 'ar' ? 'صعودي' : 'Bullish';
  }
  if (['bearish', 'negative'].includes(marketImpact)) {
    return locale === 'ar' ? 'هبوطي' : 'Bearish';
  }
  return locale === 'ar' ? 'محايد' : 'Neutral';
}

function getImpactArrow(marketImpact) {
  if (['bullish', 'positive'].includes(marketImpact)) return '↑';
  if (['bearish', 'negative'].includes(marketImpact)) return '↓';
  return '→';
}

function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (typeof num === 'string') return num;
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed ? num.toFixed(1) : String(num);
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

function easeInOutCubic(t) {
  const p = Math.max(0, Math.min(1, t));
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function easeOutElastic(t) {
  const p = Math.max(0, Math.min(1, t));
  if (p === 0 || p === 1) return p;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function segmentProgress(p, start, end) {
  return clamp((p - start) / (end - start), 0, 1);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Voiceover Generation ────────────────────────────────────────
function generateVoiceover(text, outputPath, locale) {
  const voice = locale === 'en' ? 'en-US-GuyNeural' : 'ar-SA-HamedNeural';
  const truncated = text.length > 2000 ? text.slice(0, 1997) + '...' : text;

  const tmpTextFile = outputPath.replace('.mp3', '_text.txt');
  writeFileSync(tmpTextFile, truncated, 'utf-8');

  try {
    const pythonCode = `
import asyncio, edge_tts
async def main():
    text = open("${tmpTextFile}", "r", encoding="utf-8").read()
    comm = edge_tts.Communicate(text, "${voice}", rate="+0%")
    await comm.save("${outputPath}")
asyncio.run(main())
`;
    const result = spawnSync('python3', ['-c', pythonCode], {
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.status !== 0) {
      console.error(`[TTS] edge-tts error: ${result.stderr?.slice(-300)}`);
      return false;
    }

    try { unlinkSync(tmpTextFile); } catch {}
    return existsSync(outputPath);
  } catch (err) {
    console.error(`[TTS] Failed: ${err.message}`);
    try { unlinkSync(tmpTextFile); } catch {}
    return false;
  }
}

// ─── Audio Duration Detection ────────────────────────────────────
function getAudioDuration(path) {
  try {
    const result = spawnSync('ffprobe', [
      '-v', 'quiet', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', path
    ], { encoding: 'utf-8', timeout: 10000 });
    return parseFloat(result.stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

// ─── Data Enhancement Functions ───────────────────────────────────

function generateDefaultRootCauses(data) {
  const locale = data.locale || 'ar';
  const title = (data.title || '').toLowerCase();
  const summary = (data.summary || '').toLowerCase();
  const keyPoints = (data.key_points || []).join(' ').toLowerCase();
  const combined = `${title} ${summary} ${keyPoints}`;

  const causes = [];

  // Keyword-based root cause generation
  if (combined.includes('inflation') || combined.includes('تضخم') || combined.includes('أسعار')) {
    causes.push({
      title: locale === 'ar' ? 'ضغوط تضخمية' : 'Inflationary Pressures',
      description: locale === 'ar' ? 'ارتفاع مستمر في مستوى الأسعار يؤثر على القوة الشرائية' : 'Sustained rise in price levels affecting purchasing power',
      icon: '📈',
    });
  }
  if (combined.includes('interest') || combined.includes('فائدة') || combined.includes('rate') || combined.includes('سياسة')) {
    causes.push({
      title: locale === 'ar' ? 'قرارات أسعار الفائدة' : 'Interest Rate Decisions',
      description: locale === 'ar' ? 'تغييرات في السياسة النقدية تؤثر على تكلفة الاقتراض' : 'Monetary policy changes affecting borrowing costs',
      icon: '🏦',
    });
  }
  if (combined.includes('oil') || combined === 'نفط' || combined.includes('طاقة') || combined.includes('energy')) {
    causes.push({
      title: locale === 'ar' ? 'تقلبات أسعار الطاقة' : 'Energy Price Volatility',
      description: locale === 'ar' ? 'تذبذب حاد في أسعار النفط والغاز يؤثر على الأسواق' : 'Sharp fluctuation in oil and gas prices affecting markets',
      icon: '🛢️',
    });
  }
  if (combined.includes('geopolitic') || combined.includes('حرب') || combined.includes('صراع') || combined.includes('sanction') || combined.includes('عقوبات')) {
    causes.push({
      title: locale === 'ar' ? 'توترات جيوسياسية' : 'Geopolitical Tensions',
      description: locale === 'ar' ? 'تصاعد التوترات الإقليمية والدولية يؤثر على استقرار الأسواق' : 'Rising regional and international tensions affecting market stability',
      icon: '⚔️',
    });
  }
  if (combined.includes('growth') || combined.includes('نمو') || combined.includes('gdp') || combined.includes('الناتج')) {
    causes.push({
      title: locale === 'ar' ? 'تباطؤ النمو الاقتصادي' : 'Economic Growth Slowdown',
      description: locale === 'ar' ? 'تراجع معدلات النمو مع تحديات هيكلية في الاقتصاد' : 'Declining growth rates with structural economic challenges',
      icon: '📉',
    });
  }
  if (combined.includes('trade') || combined.includes('تجارة') || combined.includes('import') || combined.includes('export') || combined.includes('تصدير') || combined.includes('استيراد')) {
    causes.push({
      title: locale === 'ar' ? 'اختلالات التجارة' : 'Trade Imbalances',
      description: locale === 'ar' ? 'فجوات تجارية متزايدة تعكس تحديات في الميزان التجاري' : 'Growing trade gaps reflecting balance of payments challenges',
      icon: '⚖️',
    });
  }

  // Fill to at least 3 causes
  const fallbackCauses = [
    { title: locale === 'ar' ? 'عوامل العرض والطلب' : 'Supply & Demand Factors', description: locale === 'ar' ? 'تحولات في ديناميكيات العرض والطلب تؤثر على الأسواق' : 'Shifts in supply-demand dynamics affecting markets', icon: '📊' },
    { title: locale === 'ar' ? 'تحركات رأس المال' : 'Capital Flows', description: locale === 'ar' ? 'تدفقات رأس المال الدولية تؤثر على أسعار الأصول' : 'International capital flows impacting asset prices', icon: '💰' },
    { title: locale === 'ar' ? 'سياسات البنوك المركزية' : 'Central Bank Policies', description: locale === 'ar' ? 'قرارات البنوك المركزية توجه مسار الأسواق المالية' : 'Central bank decisions guiding financial market direction', icon: '🏛️' },
  ];

  while (causes.length < 3) {
    const next = fallbackCauses[causes.length];
    if (next) causes.push(next);
    else break;
  }

  return causes.slice(0, 3);
}

function generateDefaultHistoricalParallels(data) {
  const locale = data.locale || 'ar';
  const title = (data.title || '').toLowerCase();
  const summary = (data.summary || '').toLowerCase();
  const combined = `${title} ${summary}`;

  const parallels = [];

  if (combined.includes('inflation') || combined.includes('تضخم')) {
    parallels.push({
      year: '2008',
      title: locale === 'ar' ? 'أزمة التضخم العالمية' : 'Global Inflation Crisis',
      cause: locale === 'ar' ? 'ارتفاع أسعار السلع والطاقة' : 'Surge in commodity and energy prices',
      result: locale === 'ar' ? 'تراجع الأسواق بنسبة 40%' : 'Markets declined by 40%',
    });
    parallels.push({
      year: '1970s',
      title: locale === 'ar' ? 'فترة الركود التضخمي' : 'Stagflation Era',
      cause: locale === 'ar' ? 'صدمات نفطية وسياسة نقدية ضعيفة' : 'Oil shocks and loose monetary policy',
      result: locale === 'ar' ? 'عقد من النمو المنخفض والتضخم المرتفع' : 'A decade of low growth and high inflation',
    });
  }

  if (combined.includes('oil') || combined.includes('نفط') || combined.includes('طاقة')) {
    parallels.push({
      year: '2014',
      title: locale === 'ar' ? 'انهيار أسعار النفط' : 'Oil Price Collapse',
      cause: locale === 'ar' ? 'فائض المعروض وتباطؤ الطلب الصيني' : 'Supply glut and slowing Chinese demand',
      result: locale === 'ar' ? 'انخفاض النفط من 115$ إلى 30$' : 'Oil dropped from $115 to $30',
    });
  }

  if (combined.includes('interest') || combined.includes('فائدة') || combined.includes('rate')) {
    parallels.push({
      year: '2022',
      title: locale === 'ar' ? 'دورة تشديد نقدية' : 'Monetary Tightening Cycle',
      cause: locale === 'ar' ? 'رفع الفائدة لمحاربة التضخم' : 'Rate hikes to combat inflation',
      result: locale === 'ar' ? 'ضغط على السندات والأسهم' : 'Pressure on bonds and equities',
    });
  }

  if (combined.includes('crisis') || combined.includes('أزمة') || combined.includes('recession') || combined.includes('ركود')) {
    parallels.push({
      year: '2008',
      title: locale === 'ar' ? 'الأزمة المالية العالمية' : 'Global Financial Crisis',
      cause: locale === 'ar' ? 'انهيار سوق الرهن العقاري' : 'Subprime mortgage market collapse',
      result: locale === 'ar' ? 'ركود عالمي وإنقاذ حكومي' : 'Global recession and government bailouts',
    });
  }

  // Default parallels to fill to 3
  const defaultParallels = [
    {
      year: '2020',
      title: locale === 'ar' ? 'صدمة كوفيد-19' : 'COVID-19 Shock',
      cause: locale === 'ar' ? 'جائحة عالمية أوقفت الاقتصاد' : 'Global pandemic halting economic activity',
      result: locale === 'ar' ? 'تعاف سريع بدعم حكومي' : 'Swift recovery with government support',
    },
    {
      year: '2016',
      title: locale === 'ar' ? 'صدمة بريكست' : 'Brexit Shock',
      cause: locale === 'ar' ? 'تصويت بريطانيا للخروج من الاتحاد الأوروبي' : 'UK vote to leave the European Union',
      result: locale === 'ar' ? 'تذبذب حاد في العملات' : 'Sharp currency volatility',
    },
    {
      year: '1997',
      title: locale === 'ar' ? 'أزمة الأسواق الناشئة' : 'Emerging Markets Crisis',
      cause: locale === 'ar' ? 'انهيار العملات الآسيوية' : 'Asian currency collapse',
      result: locale === 'ar' ? 'انتقال العدوى للأسواق العالمية' : 'Contagion to global markets',
    },
  ];

  while (parallels.length < 3) {
    const next = defaultParallels[parallels.length];
    if (next) parallels.push(next);
    else break;
  }

  return parallels.slice(0, 3);
}

function generateDefaultStrategicTakeaways(data) {
  const locale = data.locale || 'ar';
  const outlook = (data.outlook || '').toLowerCase();
  const impact = data.market_impact || 'neutral';
  const stats = data.stats || [];

  const takeaways = [];

  if (['bullish', 'positive'].includes(impact)) {
    takeaways.push({
      title: locale === 'ar' ? 'فرص نمو محتملة' : 'Potential Growth Opportunities',
      detail: locale === 'ar'
        ? 'البيانات الحالية تشير إلى مسار صعودي مع فرص للمستثمرين'
        : 'Current data indicates an upward trajectory with opportunities for investors',
      color: 'green',
    });
  } else if (['bearish', 'negative'].includes(impact)) {
    takeaways.push({
      title: locale === 'ar' ? 'مخاطر هبوطية' : 'Downside Risks',
      detail: locale === 'ar'
        ? 'المؤشرات تشير إلى ضغوط هبوطية تستدعي الحيطة'
        : 'Indicators point to downward pressures requiring caution',
      color: 'red',
    });
  } else {
    takeaways.push({
      title: locale === 'ar' ? 'اتجاه متحفظ' : 'Cautious Stance',
      detail: locale === 'ar'
        ? 'السوق في مرحلة مراقبة مع توقعات متباينة'
        : 'Market in observation phase with mixed expectations',
      color: 'gold',
    });
  }

  if (stats.length > 0) {
    const mainStat = stats[0];
    takeaways.push({
      title: locale === 'ar' ? `مؤشر ${mainStat.label} محوري` : `${mainStat.label} is Key`,
      detail: locale === 'ar'
        ? `${mainStat.value} — ${mainStat.description || (locale === 'ar' ? 'رقم حرج يحدد الاتجاه' : 'Critical number defining the trend')}`
        : `${mainStat.value} — ${mainStat.description || 'Critical number defining the trend'}`,
      color: 'gold',
    });
  }

  takeaways.push({
    title: locale === 'ar' ? 'إدارة المخاطر ضرورية' : 'Risk Management Essential',
    detail: locale === 'ar'
      ? 'تنويع المحفظة وتحديد نقاط الخروج أمر بالغ الأهمية في الظروف الحالية'
      : 'Portfolio diversification and exit point definition are crucial in current conditions',
    color: ['bullish', 'positive'].includes(impact) ? 'green' : 'red',
  });

  while (takeaways.length < 3) {
    takeaways.push({
      title: locale === 'ar' ? 'مراقبة مستمرة' : 'Ongoing Monitoring',
      detail: locale === 'ar' ? 'متابعة التطورات عن كثب لتعديل الاستراتيجية' : 'Closely monitoring developments to adjust strategy',
      color: 'gold',
    });
  }

  return takeaways.slice(0, 3);
}

function enhanceDataWithDefaults(data) {
  const enhanced = { ...data };

  if (!enhanced.root_causes || enhanced.root_causes.length === 0) {
    enhanced.root_causes = generateDefaultRootCauses(enhanced);
  }
  if (!enhanced.historical_parallels || enhanced.historical_parallels.length === 0) {
    enhanced.historical_parallels = generateDefaultHistoricalParallels(enhanced);
  }
  if (!enhanced.strategic_takeaways || enhanced.strategic_takeaways.length === 0) {
    enhanced.strategic_takeaways = generateDefaultStrategicTakeaways(enhanced);
  }
  if (!enhanced.scenarios || enhanced.scenarios.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.scenarios = [
      { title: locale === 'ar' ? 'السيناريو المتفائل' : 'Optimistic Scenario', result: locale === 'ar' ? 'تعافٍ أسرع من المتوقع' : 'Faster-than-expected recovery', probability: '35%', color: 'green' },
      { title: locale === 'ar' ? 'السيناريو الأساسي' : 'Base Scenario', result: locale === 'ar' ? 'نمو معتدل مع تقلبات' : 'Moderate growth with volatility', probability: '45%', color: 'yellow' },
      { title: locale === 'ar' ? 'السيناريو المتشائم' : 'Pessimistic Scenario', result: locale === 'ar' ? 'تراجع حاد في الأسواق' : 'Sharp market decline', probability: '20%', color: 'red' },
    ];
  }
  if (!enhanced.benefiting_assets || enhanced.benefiting_assets.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.benefiting_assets = [
      { name: locale === 'ar' ? 'الذهب' : 'Gold', symbol: 'XAU', reason: locale === 'ar' ? 'ملاذ آمن' : 'Safe haven' },
      { name: locale === 'ar' ? 'الدولار' : 'USD', symbol: 'DXY', reason: locale === 'ar' ? 'تحفظي' : 'Defensive' },
    ];
  }
  if (!enhanced.harmed_assets || enhanced.harmed_assets.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.harmed_assets = [
      { name: locale === 'ar' ? 'الأسهم الناشئة' : 'Emerging Equities', symbol: 'EEM', reason: locale === 'ar' ? 'مخاطرة عالية' : 'High risk' },
    ];
  }
  if (!enhanced.recommendations || enhanced.recommendations.length === 0) {
    const locale = enhanced.locale || 'ar';
    enhanced.recommendations = [
      { horizon: 'daily', asset: locale === 'ar' ? 'الذهب' : 'Gold', action: locale === 'ar' ? 'شراء عند التراجع' : 'Buy on dip', entry: '2020', target: '2080', stop: '1990', allocation: '15%' },
      { horizon: 'medium', asset: locale === 'ar' ? 'س&P 500' : 'S&P 500', action: locale === 'ar' ? 'تراكم تدريجي' : 'Accumulate gradually', entry: '5200', target: '5600', stop: '5000', allocation: '25%' },
      { horizon: 'long', asset: locale === 'ar' ? 'سندات أمريكية' : 'US Treasuries', action: locale === 'ar' ? 'استثمار طويل' : 'Long investment', entry: '4.2%', target: '3.5%', stop: '4.8%', allocation: '20%' },
    ];
  }
  if (!enhanced.live_prices || enhanced.live_prices.length === 0) {
    enhanced.live_prices = [
      { symbol: 'XAU', price: '2035.40', change: '+0.8%' },
      { symbol: 'DXY', price: '104.20', change: '+0.3%' },
      { symbol: 'SPX', price: '5320.15', change: '-0.2%' },
      { symbol: 'CL', price: '78.50', change: '+1.1%' },
      { symbol: 'EUR', price: '1.0845', change: '-0.1%' },
      { symbol: 'BTC', price: '67420', change: '+2.5%' },
    ];
  }

  return enhanced;
}

// ─── Ticker Bar Generator ────────────────────────────────────────
function generateTickerBar(data) {
  const isRTL = data.locale === 'ar';
  const livePrices = data.live_prices || [];

  const priceItems = livePrices.map(p => {
    const isUp = (p.change || '').includes('+') || (p.change || '').includes('▲');
    const arrowChar = isUp ? '▲' : '▼';
    const changeColor = isUp ? COLORS.accentGreen : COLORS.accentRed;
    return `<span class="ticker-item">
      <span class="ticker-symbol">${escapeHTML(p.symbol)}</span>
      <span class="ticker-price">${escapeHTML(p.price)}</span>
      <span class="ticker-change" style="color:${changeColor}">${arrowChar} ${escapeHTML(p.change)}</span>
    </span>`;
  }).join('<span class="ticker-sep">│</span>');

  // Duplicate for seamless scroll
  const doubled = priceItems + '<span class="ticker-sep">│</span>' + priceItems;

  return `
    <div id="ticker-bar" style="
      position:absolute; top:0; left:0; right:0; height:${TICKER_HEIGHT}px;
      background: linear-gradient(180deg, rgba(12,20,38,0.97) 0%, rgba(10,17,32,0.93) 100%);
      border-bottom: 1px solid ${COLORS.borderBlue};
      display:flex; align-items:center; overflow:hidden; z-index:100;
    ">
      <div style="
        position:absolute; left:0; top:0; bottom:0; width:80px;
        background: linear-gradient(90deg, rgba(10,17,32,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div style="
        position:absolute; right:0; top:0; bottom:0; width:80px;
        background: linear-gradient(-90deg, rgba(10,17,32,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div class="ticker-scroll" style="
        white-space:nowrap; animation: tickerScroll 40s linear infinite;
        padding: 0 80px; font-size:13px;
      ">${doubled}</div>
    </div>
  `;
}

// ─── News Bar Generator ──────────────────────────────────────────
function generateNewsBar(data) {
  const isRTL = data.locale === 'ar';
  const tickerItems = [
    data.title || '',
    data.summary || '',
    ...(data.stats || []).map(s => `${s.label}: ${s.value}`),
    ...(data.key_points || []).slice(0, 2),
  ].filter(Boolean);

  const tickerText = tickerItems.join(' <span style="color:' + COLORS.accentBlue + ';margin:0 8px;">●</span> ');
  const doubled = tickerText + ' <span style="color:' + COLORS.accentBlue + ';margin:0 8px;">●</span> ' + tickerText;

  return `
    <div id="news-bar" style="
      position:absolute; bottom:0; left:0; right:0; height:${NEWSBAR_HEIGHT}px;
      background: linear-gradient(0deg, rgba(12,20,38,0.98) 0%, rgba(10,17,32,0.92) 100%);
      border-top: 1px solid ${COLORS.borderBlue};
      display:flex; align-items:center; overflow:hidden; z-index:100;
    ">
      <div style="
        position:absolute; left:0; top:0; bottom:0; width:60px;
        background: linear-gradient(90deg, rgba(10,17,32,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div style="
        position:absolute; right:0; top:0; bottom:0; width:60px;
        background: linear-gradient(-90deg, rgba(10,17,32,1) 0%, transparent 100%);
        z-index:2;
      "></div>
      <div style="
        display:flex; align-items:center; gap:8px;
        position:absolute; ${isRTL ? 'right' : 'left'}:16px; z-index:3;
      ">
        <div style="width:7px; height:7px; background:${COLORS.accentRed}; border-radius:50%; box-shadow:0 0 6px ${COLORS.accentRed}; animation: pulseDot 1.5s ease-in-out infinite;"></div>
        <span style="font-size:11px; font-weight:700; color:${COLORS.accentRed}; letter-spacing:2px;">${isRTL ? 'مباشر' : 'LIVE'}</span>
      </div>
      <div class="news-scroll" style="
        white-space:nowrap; animation: newsScroll 50s linear infinite;
        padding: 0 100px; font-size:13px; color:${COLORS.textGray};
      ">${doubled}</div>
    </div>
  `;
}

// ─── Base HTML Generator ─────────────────────────────────────────
function generateBaseHTML(content, data, pulseIndex, pulseTitle) {
  const isRTL = data.locale === 'ar';
  const pulseCounter = isRTL ? `${toArabicNumeral(pulseIndex + 1)} / ${toArabicNumeral(9)}` : `${pulseIndex + 1}/9`;
  const impactColor = getImpactColor(data.market_impact);

  return `<!DOCTYPE html>
<html lang="${data.locale || 'ar'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden;
      font-family: 'Noto Sans Arabic', 'Inter', 'DejaVu Sans', sans-serif;
      background: ${COLORS.bgDark}; color: ${COLORS.textWhite};
      direction: ${isRTL ? 'rtl' : 'ltr'}; position:relative;
      -webkit-font-smoothing: antialiased;
    }

    /* Grid background */
    .grid-bg {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background-image:
        linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events:none; z-index:0;
    }

    /* Radial gradient overlay */
    .radial-overlay {
      position:absolute; top:0; left:0; right:0; bottom:0;
      background: radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 55%);
      pointer-events:none; z-index:1;
    }

    /* Brand badge (top-left / top-right in RTL) */
    .brand-badge {
      position:absolute; top:${TICKER_HEIGHT + 12}px; ${isRTL ? 'right' : 'left'}:24px; z-index:50;
      display:flex; align-items:center; gap:8px;
      padding: 6px 14px; border-radius:8px;
      background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(0,229,255,0.08) 100%);
      border: 1px solid rgba(59,130,246,0.2);
      opacity:0; transition: opacity 0.6s ease;
    }
    .brand-badge.visible { opacity:1; }
    .brand-badge-icon {
      width:28px; height:28px; border-radius:6px;
      background: linear-gradient(135deg, ${COLORS.accentBlue}, ${COLORS.accentCyan});
      display:flex; align-items:center; justify-content:center;
      font-size:14px; font-weight:900; color:white; font-family:'Inter',sans-serif;
    }
    .brand-badge-text {
      font-size:12px; font-weight:700; color:${COLORS.accentBlue}; letter-spacing:2px;
    }

    /* Pulse counter (bottom-right / bottom-left in RTL) */
    .pulse-counter {
      position:absolute; bottom:${NEWSBAR_HEIGHT + 10}px; ${isRTL ? 'left' : 'right'}:24px; z-index:50;
      padding: 4px 12px; border-radius:6px;
      background: rgba(18,28,50,0.8); border:1px solid ${COLORS.borderBlue};
      font-size:13px; font-weight:600; color:${COLORS.textGray}; letter-spacing:1px;
      opacity:0; transition: opacity 0.6s ease;
    }
    .pulse-counter.visible { opacity:1; }
    .pulse-counter-label {
      font-size:9px; color:${COLORS.textDim}; letter-spacing:2px; display:block;
      text-transform:uppercase; margin-bottom:1px;
    }
    .pulse-counter-num { color:${COLORS.accentCyan}; font-size:16px; font-weight:800; }

    /* Ticker scroll animation */
    @keyframes tickerScroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes newsScroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes pulseDot {
      0%,100% { opacity:1; box-shadow:0 0 6px ${COLORS.accentRed}; }
      50% { opacity:0.4; box-shadow:0 0 12px ${COLORS.accentRed}; }
    }

    /* Ticker items */
    .ticker-item { display:inline-flex; align-items:center; gap:5px; margin:0 6px; }
    .ticker-symbol { font-size:12px; font-weight:700; color:${COLORS.textWhite}; letter-spacing:0.5px; }
    .ticker-price { font-size:12px; color:${COLORS.textLight}; font-weight:500; }
    .ticker-change { font-size:11px; font-weight:600; }
    .ticker-sep { color:${COLORS.borderBlue}; margin:0 4px; font-size:10px; }

    /* Content area */
    .content-area {
      position:absolute;
      top:${TICKER_HEIGHT}px;
      left:0; right:0;
      height:${CONTENT_HEIGHT}px;
      z-index:10;
      overflow:hidden;
    }

    /* Breathing animation for background elements */
    @keyframes breathe {
      0%,100% { transform:scale(1); opacity:0.5; }
      50% { transform:scale(1.03); opacity:0.7; }
    }
    .breathe-bg {
      animation: breathe 6s ease-in-out infinite;
    }

    /* Accent line animations */
    @keyframes lineGlow {
      0%,100% { opacity:0.3; }
      50% { opacity:0.8; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  </style>
</head>
<body>
  <!-- Background layers -->
  <div class="grid-bg"></div>
  <div class="radial-overlay breathe-bg"></div>

  <!-- Ticker Bar (top) -->
  ${generateTickerBar(data)}

  <!-- Brand Badge -->
  <div class="brand-badge" id="brand-badge">
    <div class="brand-badge-icon">R</div>
    <div>
      <div class="brand-badge-text">رؤى | ROUA</div>
    </div>
  </div>

  <!-- Main content area -->
  <div class="content-area">
    ${content}
  </div>

  <!-- Pulse Counter -->
  <div class="pulse-counter" id="pulse-counter">
    <span class="pulse-counter-label">${isRTL ? 'نبضة' : 'PULSE'}</span>
    <span class="pulse-counter-num">${pulseCounter}</span>
  </div>

  <!-- News Bar (bottom) -->
  ${generateNewsBar(data)}

  <!-- Base animation controller -->
  <script>
    window._baseProgress = 0;
    window.setAnimationProgress = function(p) {
      window._baseProgress = p;
      // Show brand badge and pulse counter after 10% progress
      var bb = document.getElementById('brand-badge');
      var pc = document.getElementById('pulse-counter');
      if (bb) bb.classList.toggle('visible', p > 0.05);
      if (pc) pc.classList.toggle('visible', p > 0.05);
    };
  </script>
</body>
</html>`;
}

// ─── Pulse 1: Ignition ───────────────────────────────────────────
// Countdown + screen activation + ticker starts
function generateIgnitionPulse(data) {
  const isRTL = data.locale === 'ar';
  const impactColor = getImpactColor(data.market_impact);
  const impactLabel = getImpactLabel(data.market_impact, data.locale);
  const reportLabel = data.report_type_label || (isRTL ? 'تقرير اقتصادي عاجل' : 'Breaking Economic Report');

  return `
    <style>
      .ignition-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
      }

      /* Scanlines overlay for boot-up feel */
      .ignition-scanlines {
        position:absolute; top:0; left:0; right:0; bottom:0;
        background: repeating-linear-gradient(
          0deg, transparent, transparent 2px,
          rgba(59,130,246,0.015) 2px, rgba(59,130,246,0.015) 4px
        );
        pointer-events:none; z-index:1;
        opacity:0; transition: opacity 1s ease;
      }

      /* Center countdown ring */
      .ignition-countdown-wrap {
        position:relative; width:220px; height:220px;
        opacity:0; transform:scale(0.8); transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .ignition-countdown-wrap.active { opacity:1; transform:scale(1); }

      .ignition-ring-svg {
        position:absolute; top:0; left:0; width:220px; height:220px;
      }
      .ignition-ring-bg { fill:none; stroke:rgba(59,130,246,0.1); stroke-width:4; }
      .ignition-ring-progress {
        fill:none; stroke:${COLORS.accentCyan}; stroke-width:4;
        stroke-linecap:round; stroke-dasharray:628; stroke-dashoffset:628;
        transform: rotate(-90deg); transform-origin: center;
        transition: stroke-dashoffset 0.3s ease;
        filter: drop-shadow(0 0 8px ${COLORS.accentCyan});
      }

      .ignition-countdown-number {
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        font-size:72px; font-weight:900; color:${COLORS.accentCyan};
        text-shadow: 0 0 30px rgba(0,229,255,0.4);
        font-family:'Inter','Noto Sans Arabic',sans-serif;
      }

      /* Title reveal */
      .ignition-title-area {
        text-align:center; margin-top:40px;
        opacity:0; transform:translateY(20px);
        transition: opacity 0.8s ease, transform 0.8s ease;
      }
      .ignition-title-area.revealed { opacity:1; transform:translateY(0); }

      .ignition-report-badge {
        display:inline-flex; align-items:center; gap:8px;
        padding:8px 24px; border-radius:100px;
        border:1px solid ${impactColor}40;
        background:${impactColor}10; margin-bottom:20px;
      }
      .ignition-report-dot {
        width:8px; height:8px; border-radius:50%;
        background:${impactColor}; box-shadow:0 0 6px ${impactColor};
      }
      .ignition-report-label {
        font-size:14px; font-weight:600; color:${impactColor}; letter-spacing:1px;
      }

      .ignition-main-title {
        font-size:46px; font-weight:800; line-height:1.3;
        max-width:1200px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        margin-bottom:16px;
      }

      .ignition-date {
        font-size:18px; color:${COLORS.textGray}; margin-bottom:16px;
      }

      .ignition-impact-badge {
        display:inline-flex; align-items:center; gap:8px;
        padding:8px 20px; border-radius:10px;
        background:${impactColor}08; border:1px solid ${impactColor}25;
      }
      .ignition-impact-arrow { font-size:24px; font-weight:800; color:${impactColor}; }
      .ignition-impact-text { font-size:16px; font-weight:600; color:${impactColor}; }

      /* Flash overlay for screen activation */
      .ignition-flash {
        position:absolute; top:0; left:0; right:0; bottom:0;
        background:white; opacity:0; pointer-events:none; z-index:100;
        transition: opacity 0.15s ease;
      }

      /* Decorative corner brackets */
      .ignition-corner {
        position:absolute; width:40px; height:40px; z-index:5;
        opacity:0; transition: opacity 0.6s ease;
      }
      .ignition-corner.tl { top:30px; ${isRTL ? 'right' : 'left'}:40px; border-top:2px solid ${COLORS.accentBlue}40; border-${isRTL ? 'right' : 'left'}:2px solid ${COLORS.accentBlue}40; }
      .ignition-corner.tr { top:30px; ${isRTL ? 'left' : 'right'}:40px; border-top:2px solid ${COLORS.accentBlue}40; border-${isRTL ? 'left' : 'right'}:2px solid ${COLORS.accentBlue}40; }
      .ignition-corner.bl { bottom:30px; ${isRTL ? 'right' : 'left'}:40px; border-bottom:2px solid ${COLORS.accentBlue}40; border-${isRTL ? 'right' : 'left'}:2px solid ${COLORS.accentBlue}40; }
      .ignition-corner.br { bottom:30px; ${isRTL ? 'left' : 'right'}:40px; border-bottom:2px solid ${COLORS.accentBlue}40; border-${isRTL ? 'left' : 'right'}:2px solid ${COLORS.accentBlue}40; }

      /* Horizontal accent line */
      .ignition-accent-line {
        width:80px; height:2px; margin:0 auto 16px;
        background:linear-gradient(90deg, transparent, ${COLORS.accentBlue}, transparent);
        opacity:0; transition: opacity 0.6s ease;
      }
    </style>

    <div class="ignition-container" id="ignition-root">
      <div class="ignition-scanlines" id="ignition-scanlines"></div>
      <div class="ignition-flash" id="ignition-flash"></div>

      <!-- Corner brackets -->
      <div class="ignition-corner tl" id="ignition-corner-tl"></div>
      <div class="ignition-corner tr" id="ignition-corner-tr"></div>
      <div class="ignition-corner bl" id="ignition-corner-bl"></div>
      <div class="ignition-corner br" id="ignition-corner-br"></div>

      <!-- Countdown ring -->
      <div class="ignition-countdown-wrap" id="ignition-countdown">
        <svg class="ignition-ring-svg" viewBox="0 0 220 220">
          <circle class="ignition-ring-bg" cx="110" cy="110" r="100"/>
          <circle class="ignition-ring-progress" id="ignition-ring" cx="110" cy="110" r="100"/>
        </svg>
        <div class="ignition-countdown-number" id="ignition-number">3</div>
      </div>

      <!-- Title area -->
      <div class="ignition-title-area" id="ignition-title-area">
        <div class="ignition-report-badge">
          <div class="ignition-report-dot"></div>
          <span class="ignition-report-label">${escapeHTML(reportLabel)}</span>
        </div>
        <div class="ignition-accent-line" id="ignition-accent-line"></div>
        <h1 class="ignition-main-title">${escapeHTML(data.title || '')}</h1>
        <div class="ignition-date">${escapeHTML(data.date || '')}</div>
        <div class="ignition-impact-badge">
          <span class="ignition-impact-arrow">${getImpactArrow(data.market_impact)}</span>
          <span class="ignition-impact-text">${escapeHTML(impactLabel)}</span>
        </div>
      </div>
    </div>

    <script>
    (function() {
      var countdown = document.getElementById('ignition-countdown');
      var ring = document.getElementById('ignition-ring');
      var number = document.getElementById('ignition-number');
      var titleArea = document.getElementById('ignition-title-area');
      var flash = document.getElementById('ignition-flash');
      var scanlines = document.getElementById('ignition-scanlines');
      var accentLine = document.getElementById('ignition-accent-line');
      var corners = ['tl','tr','bl','br'].map(function(id) {
        return document.getElementById('ignition-corner-' + id);
      });

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.35 — Countdown
        var countPhase = segmentProgress(p, 0, 0.35);
        if (countPhase > 0) {
          countdown.classList.add('active');
          scanlines.style.opacity = '1';

          // Number cycles 3→2→1
          var num = 3 - Math.floor(countPhase * 3);
          if (num < 1) num = 1;
          number.textContent = num;

          // Ring progress
          var ringOffset = 628 - (628 * countPhase);
          ring.style.strokeDashoffset = ringOffset;
        }

        // Phase 2: 0.30-0.45 — Flash + screen activation
        var flashPhase = segmentProgress(p, 0.30, 0.45);
        if (flashPhase > 0 && flashPhase < 1) {
          var flashIntensity = flashPhase < 0.5 ? flashPhase * 2 : (1 - flashPhase) * 2;
          flash.style.opacity = String(flashIntensity * 0.6);
        } else {
          flash.style.opacity = '0';
        }

        // Phase 3: 0.40-1.0 — Title reveal
        var titlePhase = segmentProgress(p, 0.40, 1.0);
        if (titlePhase > 0) {
          titleArea.classList.add('revealed');
          accentLine.style.opacity = String(Math.min(1, titlePhase * 2));
          corners.forEach(function(c) { c.style.opacity = String(Math.min(1, titlePhase * 1.5)); });
        }

        // Phase 4: 0.80-1.0 — Countdown fades out
        var fadePhase = segmentProgress(p, 0.80, 1.0);
        if (fadePhase > 0) {
          countdown.style.opacity = String(1 - fadePhase);
          countdown.style.transform = 'scale(' + (1 + fadePhase * 0.3) + ')';
        }

        // Breathing effect on number
        if (countPhase > 0 && fadePhase === 0) {
          var breathe = 1 + Math.sin(p * 40) * 0.03;
          countdown.style.transform = 'scale(' + breathe + ')';
        }
      };
    })();
    </script>
  `;
}

// ─── Pulse 2: Shock ──────────────────────────────────────────────
// Main number counts up + gauge fills + timeline draws + flash alert
function generateShockPulse(data) {
  const isRTL = data.locale === 'ar';
  const stats = (data.stats || []).slice(0, 4);
  const impactColor = getImpactColor(data.market_impact);
  const impactLabel = getImpactLabel(data.market_impact, data.locale);
  const impactArrow = getImpactArrow(data.market_impact);

  // Build timeline items from key_points
  const timelineItems = (data.key_points || []).slice(0, 4).map((point, i) => {
    const dotColor = [COLORS.accentBlue, COLORS.accentCyan, COLORS.accentGreen, COLORS.accentYellow][i % 4];
    return { text: point, color: dotColor, index: i };
  });

  // Gauge value based on impact
  let gaugeTarget = 50;
  if (['bullish', 'positive'].includes(data.market_impact)) gaugeTarget = 82;
  else if (['bearish', 'negative'].includes(data.market_impact)) gaugeTarget = 22;

  // Stat value parsing for count-up
  const mainStat = stats[0] || { label: '', value: '0', description: '' };
  const numericValue = parseFloat(String(mainStat.value).replace(/[^0-9.\-]/g, '')) || 0;
  const valuePrefix = String(mainStat.value).match(/^[^0-9\-]*/)?.[0] || '';
  const valueSuffix = String(mainStat.value).match(/[^0-9.]*$/)?.[0] || '';

  return `
    <style>
      .shock-layout {
        width:100%; height:100%; display:flex; position:relative;
        padding: 32px 48px;
      }
      .shock-left {
        flex:1.1; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
      }
      .shock-right {
        flex:0.9; display:flex; flex-direction:column;
        justify-content:center; padding-${isRTL ? 'right' : 'left'}:32px;
      }

      /* Main stat card */
      .shock-stat-card {
        width:680px; position:relative;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue}; border-radius:24px;
        padding:48px 64px; overflow:hidden;
      }
      .shock-stat-card::before {
        content:''; position:absolute; top:0; left:0; right:0; height:3px;
        background:linear-gradient(90deg, transparent, ${impactColor}, transparent);
        opacity:0; transition:opacity 0.5s ease;
      }
      .shock-stat-card.glow::before { opacity:1; }

      .shock-stat-label {
        font-size:20px; color:${COLORS.textGray}; font-weight:500;
        text-align:center; margin-bottom:20px; letter-spacing:1px;
      }
      .shock-stat-value {
        font-size:88px; font-weight:900; text-align:center;
        letter-spacing:-2px; line-height:1.1;
        text-shadow:0 0 40px ${impactColor}30;
        transition: color 0.3s ease;
      }
      .shock-stat-desc {
        font-size:18px; color:${COLORS.textLight}; text-align:center;
        line-height:1.6; margin-top:20px; opacity:0.85;
      }

      /* Mini stats row */
      .shock-mini-stats {
        display:flex; gap:16px; margin-top:24px;
      }
      .shock-mini-stat {
        flex:1; padding:14px 18px; border-radius:12px;
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        text-align:center;
        opacity:0; transform:translateY(10px);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .shock-mini-stat.visible { opacity:1; transform:translateY(0); }
      .shock-mini-stat-val { font-size:22px; font-weight:700; color:${COLORS.textWhite}; }
      .shock-mini-stat-label { font-size:12px; color:${COLORS.textDim}; margin-top:4px; }

      /* Gauge */
      .shock-gauge-section {
        margin-bottom:28px;
        opacity:0; transform:translateX(${isRTL ? '-' : ''}20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .shock-gauge-section.visible { opacity:1; transform:translateX(0); }

      .shock-gauge-title {
        font-size:14px; color:${COLORS.accentYellow}; font-weight:600;
        letter-spacing:2px; text-transform:uppercase; margin-bottom:12px;
      }
      .shock-gauge-bar-bg {
        height:16px; border-radius:8px; position:relative; overflow:hidden;
        background:linear-gradient(90deg, ${COLORS.accentRed}20, ${COLORS.accentGold}20, ${COLORS.accentGreen}20);
      }
      .shock-gauge-bar-fill {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0; height:100%;
        border-radius:8px;
        background:linear-gradient(90deg, ${COLORS.accentRed}, ${COLORS.accentGold}, ${impactColor});
        width:0%; transition: width 0.3s ease;
      }
      .shock-gauge-labels {
        display:flex; justify-content:space-between; margin-top:8px;
      }
      .shock-gauge-label-text { font-size:12px; }
      .shock-gauge-value {
        text-align:center; margin-top:8px;
        font-size:20px; font-weight:700; color:${impactColor};
      }

      /* Timeline */
      .shock-timeline {
        position:relative; padding-${isRTL ? 'right' : 'left'}:24px;
        opacity:0; transform:translateX(${isRTL ? '-' : ''}20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .shock-timeline.visible { opacity:1; transform:translateX(0); }

      .shock-timeline-line {
        position:absolute; ${isRTL ? 'right' : 'left'}:8px; top:0; bottom:0;
        width:2px; background:linear-gradient(180deg, ${COLORS.accentBlue}, ${COLORS.accentCyan}40);
        transform-origin:top; transform:scaleY(0); transition:transform 0.6s ease;
      }
      .shock-timeline.line-drawn .shock-timeline-line { transform:scaleY(1); }

      .shock-timeline-item {
        display:flex; align-items:flex-start; gap:16px;
        margin-bottom:20px; position:relative;
        opacity:0; transform:translateY(8px);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .shock-timeline-item.visible { opacity:1; transform:translateY(0); }

      .shock-timeline-dot {
        width:14px; height:14px; border-radius:50%; flex-shrink:0;
        position:relative; ${isRTL ? 'margin-right' : 'margin-left'}:-3px;
        border:2px solid; background:${COLORS.bgDark};
      }
      .shock-timeline-dot::after {
        content:''; position:absolute; top:-4px; left:-4px; right:-4px; bottom:-4px;
        border-radius:50%; background:inherit; opacity:0.2;
      }
      .shock-timeline-text {
        font-size:15px; color:${COLORS.textLight}; line-height:1.6;
        padding-top:0;
      }

      /* Flash alert box */
      .shock-flash-alert {
        position:absolute; top:24px; ${isRTL ? 'left' : 'right'}:24px;
        padding:12px 20px; border-radius:10px;
        background:${impactColor}10; border:1px solid ${impactColor}30;
        display:flex; align-items:center; gap:10px;
        opacity:0; transform:translateY(-10px) scale(0.95);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .shock-flash-alert.visible { opacity:1; transform:translateY(0) scale(1); }
      .shock-flash-alert-icon { font-size:24px; }
      .shock-flash-alert-text { font-size:14px; font-weight:600; color:${impactColor}; }

      /* Decorative bars */
      .shock-deco-bars {
        position:absolute; bottom:20px; ${isRTL ? 'right' : 'left'}:20px;
        display:flex; align-items:flex-end; gap:3px; opacity:0.1;
      }
    </style>

    <div class="shock-layout" id="shock-root">
      <!-- Flash alert -->
      <div class="shock-flash-alert" id="shock-flash-alert">
        <span class="shock-flash-alert-icon">⚡</span>
        <span class="shock-flash-alert-text">${isRTL ? 'تنبيه: حركة سعرية قوية' : 'ALERT: Strong Price Action'}</span>
      </div>

      <div class="shock-left">
        <div class="shock-stat-card" id="shock-stat-card">
          <div class="shock-stat-label">${escapeHTML(mainStat.label)}</div>
          <div class="shock-stat-value" id="shock-value" style="color:${impactColor}">${escapeHTML(valuePrefix)}0${escapeHTML(valueSuffix)}</div>
          <div class="shock-stat-desc">${escapeHTML(mainStat.description || '')}</div>

          <!-- Mini stats -->
          <div class="shock-mini-stats">
            ${stats.slice(1, 4).map((s, i) => `
              <div class="shock-mini-stat" id="shock-mini-${i}">
                <div class="shock-mini-stat-val">${escapeHTML(s.value)}</div>
                <div class="shock-mini-stat-label">${escapeHTML(s.label)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Deco bars -->
          <div class="shock-deco-bars">
            ${[40,65,35,80,55,70,45,90,60,50,75,55].map(h =>
              `<div style="width:5px;height:${h*0.5}px;background:${COLORS.accentBlue};border-radius:2px;"></div>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="shock-right">
        <!-- Gauge -->
        <div class="shock-gauge-section" id="shock-gauge">
          <div class="shock-gauge-title">${isRTL ? '◇ مقياس التأثير' : '◇ IMPACT GAUGE'}</div>
          <div class="shock-gauge-bar-bg">
            <div class="shock-gauge-bar-fill" id="shock-gauge-fill"></div>
          </div>
          <div class="shock-gauge-labels">
            <span class="shock-gauge-label-text" style="color:${COLORS.accentRed}">${isRTL ? 'هبوطي' : 'Bearish'}</span>
            <span class="shock-gauge-label-text" style="color:${COLORS.accentGold}">${isRTL ? 'محايد' : 'Neutral'}</span>
            <span class="shock-gauge-label-text" style="color:${COLORS.accentGreen}">${isRTL ? 'صعودي' : 'Bullish'}</span>
          </div>
          <div class="shock-gauge-value" id="shock-gauge-value">${impactArrow} ${escapeHTML(impactLabel)}</div>
        </div>

        <!-- Timeline -->
        <div class="shock-timeline" id="shock-timeline">
          <div class="shock-timeline-line"></div>
          ${timelineItems.map((item, i) => `
            <div class="shock-timeline-item" id="shock-tl-${i}">
              <div class="shock-timeline-dot" style="border-color:${item.color}; background:${item.color}20;"></div>
              <div class="shock-timeline-text">${escapeHTML(item.text)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <script>
    (function() {
      var valueEl = document.getElementById('shock-value');
      var gaugeFill = document.getElementById('shock-gauge-fill');
      var gaugeSection = document.getElementById('shock-gauge');
      var timeline = document.getElementById('shock-timeline');
      var flashAlert = document.getElementById('shock-flash-alert');
      var statCard = document.getElementById('shock-stat-card');

      var targetValue = ${numericValue};
      var valuePrefix = '${escapeHTML(valuePrefix)}';
      var valueSuffix = '${escapeHTML(valueSuffix)}';
      var gaugeTarget = ${gaugeTarget};

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.5 — Main value counts up
        var countPhase = segmentProgress(p, 0, 0.5);
        if (countPhase > 0) {
          var eased = easeOutCubic(countPhase);
          var currentVal = Math.round(targetValue * eased);
          valueEl.textContent = valuePrefix + currentVal.toLocaleString() + valueSuffix;
          statCard.classList.add('glow');
        }

        // Phase 2: 0.15-0.55 — Gauge fills
        var gaugePhase = segmentProgress(p, 0.15, 0.55);
        if (gaugePhase > 0) {
          gaugeSection.classList.add('visible');
          var gaugeEased = easeOutCubic(gaugePhase);
          gaugeFill.style.width = (gaugeTarget * gaugeEased) + '%';
        }

        // Phase 3: 0.25-0.70 — Timeline draws
        var tlPhase = segmentProgress(p, 0.25, 0.70);
        if (tlPhase > 0) {
          timeline.classList.add('visible');
          if (tlPhase > 0.1) timeline.classList.add('line-drawn');

          var items = timeline.querySelectorAll('.shock-timeline-item');
          items.forEach(function(item, i) {
            var itemPhase = segmentProgress(p, 0.28 + i * 0.1, 0.38 + i * 0.1);
            if (itemPhase > 0) item.classList.add('visible');
          });
        }

        // Phase 4: 0.50-0.65 — Mini stats appear
        var miniPhase = segmentProgress(p, 0.50, 0.65);
        for (var m = 0; m < 3; m++) {
          var miniEl = document.getElementById('shock-mini-' + m);
          if (miniEl) {
            var mPhase = segmentProgress(p, 0.50 + m * 0.05, 0.55 + m * 0.05);
            if (mPhase > 0) miniEl.classList.add('visible');
          }
        }

        // Phase 5: 0.70-0.80 — Flash alert
        var alertPhase = segmentProgress(p, 0.70, 0.80);
        if (alertPhase > 0) {
          flashAlert.classList.add('visible');
        }

        // Breathing effect on stat card
        var breathe = 1 + Math.sin(p * 30) * 0.008;
        statCard.style.transform = 'scale(' + breathe + ')';
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 3: Roots ──────────────────────────────────────────────
// ★NEW — 3 interconnected root cause circles + intersection point
function generateRootsPulse(data) {
  const isRTL = data.locale === 'ar';
  const rootCauses = (data.root_causes || []).slice(0, 3);
  const sectionTitle = isRTL ? 'الجذور العميقة' : 'Root Causes';
  const sectionSub = isRTL ? 'تحليل الأسباب الرئيسية' : 'Analysis of Key Drivers';
  const intersectionLabel = isRTL ? 'نقطة التقاطع' : 'Intersection Point';

  // Circle positions for a triangle layout
  const circles = [
    { cx: 960, cy: 260, color: COLORS.accentBlue, iconColor: COLORS.accentBlue },
    { cx: 640, cy: 620, color: COLORS.accentCyan, iconColor: COLORS.accentCyan },
    { cx: 1280, cy: 620, color: COLORS.accentPurple, iconColor: COLORS.accentPurple },
  ];

  // Intersection point (center of triangle)
  const intersectCx = 960;
  const intersectCy = 500;

  return `
    <style>
      .roots-container {
        width:100%; height:100%; position:relative;
        display:flex; flex-direction:column; align-items:center;
      }

      .roots-header {
        text-align:center; margin-top:24px; margin-bottom:8px;
        opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .roots-header.visible { opacity:1; transform:translateY(0); }
      .roots-header-sub {
        font-size:12px; color:${COLORS.accentCyan}; font-weight:600;
        letter-spacing:3px; text-transform:uppercase; margin-bottom:6px;
      }
      .roots-header-title {
        font-size:32px; font-weight:800; color:${COLORS.textWhite};
      }

      .roots-svg-area {
        position:relative; width:100%; flex:1;
      }
      .roots-svg {
        width:100%; height:100%; position:absolute; top:0; left:0;
      }

      /* Connection lines between circles */
      .roots-conn-line {
        stroke-width:2; fill:none; opacity:0;
        transition: opacity 0.5s ease;
      }
      .roots-conn-line.visible { opacity:1; }

      /* Root cause circle group */
      .roots-circle-group {
        opacity:0; transition: opacity 0.5s ease;
      }
      .roots-circle-group.visible { opacity:1; }

      .roots-circle-outer {
        fill:none; stroke-width:2; opacity:0.3;
      }
      .roots-circle-fill {
        opacity:0.08;
      }
      .roots-circle-icon {
        font-size:32px; text-anchor:middle; dominant-baseline:central;
      }
      .roots-circle-title {
        font-size:18px; font-weight:700; fill:${COLORS.textWhite};
        text-anchor:middle; dominant-baseline:central;
      }
      .roots-circle-desc {
        font-size:13px; fill:${COLORS.textGray};
        text-anchor:middle;
      }

      /* Intersection point */
      .roots-intersect {
        opacity:0; transition: opacity 0.8s ease;
      }
      .roots-intersect.visible { opacity:1; }
      .roots-intersect-ring {
        fill:none; stroke:${COLORS.accentGold}; stroke-width:2;
        stroke-dasharray:4 3; opacity:0.6;
      }
      .roots-intersect-dot {
        fill:${COLORS.accentGold}; filter: drop-shadow(0 0 8px ${COLORS.accentGold});
      }
      .roots-intersect-label {
        font-size:14px; font-weight:700; fill:${COLORS.accentGold};
        text-anchor:middle; dominant-baseline:central;
      }
      .roots-intersect-sublabel {
        font-size:11px; fill:${COLORS.textDim};
        text-anchor:middle;
      }

      /* Animated dashed lines flowing */
      @keyframes dashFlow {
        0% { stroke-dashoffset:20; }
        100% { stroke-dashoffset:0; }
      }
      .roots-conn-line.flowing {
        stroke-dasharray:8 4;
        animation: dashFlow 1.5s linear infinite;
      }

      /* Pulse ring animation */
      @keyframes pulseRing {
        0% { r:55; opacity:0.4; }
        100% { r:80; opacity:0; }
      }
    </style>

    <div class="roots-container" id="roots-root">
      <!-- Header -->
      <div class="roots-header" id="roots-header">
        <div class="roots-header-sub">◆ ${isRTL ? 'تحليل' : 'ANALYSIS'}</div>
        <div class="roots-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <!-- SVG area with circles and connections -->
      <div class="roots-svg-area">
        <svg class="roots-svg" viewBox="0 0 1920 996" xmlns="http://www.w3.org/2000/svg">
          <defs>
            ${circles.map((c, i) => `
              <radialGradient id="rootGrad${i}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="${c.color}" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="${c.color}" stop-opacity="0.02"/>
              </radialGradient>
              <filter id="rootGlow${i}">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            `).join('')}
            <radialGradient id="intersectGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="${COLORS.accentGold}" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="${COLORS.accentGold}" stop-opacity="0.02"/>
            </radialGradient>
          </defs>

          <!-- Connection lines -->
          <line class="roots-conn-line" id="roots-conn-0" x1="${circles[0].cx}" y1="${circles[0].cy}" x2="${circles[1].cx}" y2="${circles[1].cy}" stroke="${COLORS.accentBlue}" />
          <line class="roots-conn-line" id="roots-conn-1" x1="${circles[1].cx}" y1="${circles[1].cy}" x2="${circles[2].cx}" y2="${circles[2].cy}" stroke="${COLORS.accentCyan}" />
          <line class="roots-conn-line" id="roots-conn-2" x1="${circles[0].cx}" y1="${circles[0].cy}" x2="${circles[2].cx}" y2="${circles[2].cy}" stroke="${COLORS.accentPurple}" />

          <!-- Lines from circles to intersection -->
          <line class="roots-conn-line" id="roots-conn-3" x1="${circles[0].cx}" y1="${circles[0].cy}" x2="${intersectCx}" y2="${intersectCy}" stroke="${COLORS.accentGold}" stroke-dasharray="4 4" />
          <line class="roots-conn-line" id="roots-conn-4" x1="${circles[1].cx}" y1="${circles[1].cy}" x2="${intersectCx}" y2="${intersectCy}" stroke="${COLORS.accentGold}" stroke-dasharray="4 4" />
          <line class="roots-conn-line" id="roots-conn-5" x1="${circles[2].cx}" y1="${circles[2].cy}" x2="${intersectCx}" y2="${intersectCy}" stroke="${COLORS.accentGold}" stroke-dasharray="4 4" />

          ${circles.map((c, i) => {
            const cause = rootCauses[i] || { title: '', description: '', icon: '📊' };
            return `
              <g class="roots-circle-group" id="roots-circle-${i}" filter="url(#rootGlow${i})">
                <!-- Pulse ring -->
                <circle cx="${c.cx}" cy="${c.cy}" r="55" fill="none" stroke="${c.color}" stroke-width="1.5" opacity="0.2" id="roots-pulse-${i}"/>

                <!-- Outer ring -->
                <circle class="roots-circle-outer" cx="${c.cx}" cy="${c.cy}" r="65" stroke="${c.color}"/>

                <!-- Fill area -->
                <circle class="roots-circle-fill" cx="${c.cx}" cy="${c.cy}" r="65" fill="url(#rootGrad${i})"/>

                <!-- Icon -->
                <text class="roots-circle-icon" x="${c.cx}" y="${c.cy - 18}" font-size="28">${cause.icon}</text>

                <!-- Title -->
                <text class="roots-circle-title" x="${c.cx}" y="${c.cy + 14}" font-size="16">${escapeHTML(cause.title)}</text>

                <!-- Description (below circle) -->
                <foreignObject x="${c.cx - 120}" y="${c.cy + 45}" width="240" height="60">
                  <div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center; font-size:12px; color:${COLORS.textGray}; line-height:1.5; font-family:'Noto Sans Arabic','Inter',sans-serif; direction:${isRTL ? 'rtl' : 'ltr'};">${escapeHTML(cause.description)}</div>
                </foreignObject>
              </g>
            `;
          }).join('')}

          <!-- Intersection point -->
          <g class="roots-intersect" id="roots-intersect">
            <circle cx="${intersectCx}" cy="${intersectCy}" r="35" fill="url(#intersectGrad)" />
            <circle class="roots-intersect-ring" cx="${intersectCx}" cy="${intersectCy}" r="28" id="roots-int-ring" />
            <circle class="roots-intersect-dot" cx="${intersectCx}" cy="${intersectCy}" r="8" id="roots-int-dot" />
            <text class="roots-intersect-label" x="${intersectCx}" y="${intersectCy + 50}">${escapeHTML(intersectionLabel)}</text>
            <text class="roots-intersect-sublabel" x="${intersectCx}" y="${intersectCy + 68}">${escapeHTML(data.title || '').substring(0, 40)}</text>
          </g>
        </svg>
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('roots-header');
      var conns = [];
      for (var ci = 0; ci < 6; ci++) {
        conns.push(document.getElementById('roots-conn-' + ci));
      }
      var circles = [
        document.getElementById('roots-circle-0'),
        document.getElementById('roots-circle-1'),
        document.getElementById('roots-circle-2'),
      ];
      var intersect = document.getElementById('roots-intersect');
      var intRing = document.getElementById('roots-int-ring');

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.15 — Header
        var headerPhase = segmentProgress(p, 0, 0.15);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 2: 0.10-0.50 — Circles appear one by one
        for (var i = 0; i < 3; i++) {
          var circlePhase = segmentProgress(p, 0.10 + i * 0.12, 0.20 + i * 0.12);
          if (circlePhase > 0 && circles[i]) {
            circles[i].classList.add('visible');
            // Scale-in effect
            var scale = 0.6 + 0.4 * easeOutCubic(circlePhase);
            var opacity = circlePhase;
            circles[i].style.opacity = opacity;
            circles[i].style.transform = 'scale(' + scale + ')';
            circles[i].style.transformOrigin = '${circles[i] ? circles[i].cx : 960}px ${circles[i] ? circles[i].cy : 300}px';
          }
        }

        // Phase 3: 0.35-0.60 — Connection lines appear
        for (var j = 0; j < 3; j++) {
          var connPhase = segmentProgress(p, 0.35 + j * 0.06, 0.42 + j * 0.06);
          if (connPhase > 0 && conns[j]) {
            conns[j].classList.add('visible');
            conns[j].style.opacity = String(easeOutCubic(connPhase) * 0.6);
            if (connPhase > 0.5) conns[j].classList.add('flowing');
          }
        }

        // Phase 4: 0.55-0.70 — Lines to intersection
        for (var k = 3; k < 6; k++) {
          var intConnPhase = segmentProgress(p, 0.55 + (k - 3) * 0.04, 0.62 + (k - 3) * 0.04);
          if (intConnPhase > 0 && conns[k]) {
            conns[k].classList.add('visible');
            conns[k].style.opacity = String(easeOutCubic(intConnPhase) * 0.5);
            conns[k].classList.add('flowing');
          }
        }

        // Phase 5: 0.65-0.85 — Intersection point
        var intPhase = segmentProgress(p, 0.65, 0.85);
        if (intPhase > 0) {
          intersect.classList.add('visible');
          intersect.style.opacity = String(easeOutCubic(intPhase));
          // Ring pulse
          var ringR = 28 + Math.sin(intPhase * Math.PI * 4) * 5;
          if (intRing) intRing.setAttribute('r', String(ringR));
        }

        // Breathing on circles
        if (p > 0.3) {
          var breathe = Math.sin(p * 25) * 0.015;
          circles.forEach(function(c, idx) {
            if (c) {
              var s = 1 + breathe * (idx + 1);
              c.style.transform = 'scale(' + s + ')';
            }
          });
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 4: Race ───────────────────────────────────────────────
// Racing bar chart of indicators + morph to line chart
function generateRacePulse(data) {
  const isRTL = data.locale === 'ar';
  const chartData = data.chart_data || {};
  const labels = chartData.labels || [];
  const values = chartData.values || [];
  const chartTitle = chartData.title || (isRTL ? 'مؤشرات الأداء' : 'Performance Indicators');
  const sectionSub = isRTL ? 'سباق المؤشرات' : 'Indicator Race';

  // Generate indicator bars from stats + chart data
  const indicators = (data.stats || []).slice(0, 6).map((s, i) => {
    const numVal = parseFloat(String(s.value).replace(/[^0-9.\-]/g, '')) || (Math.random() * 80 + 20);
    const isUp = !String(s.value).includes('↓') && !String(s.value).includes('-');
    return {
      label: s.label,
      value: s.value,
      numValue: Math.abs(numVal),
      color: isUp ? COLORS.accentGreen : COLORS.accentRed,
      direction: isUp ? 1 : -1,
    };
  });

  // If not enough stats, add from chart data
  if (indicators.length < 3 && values.length > 0) {
    for (let i = indicators.length; i < Math.min(6, values.length); i++) {
      const v = values[i] || 50;
      indicators.push({
        label: labels[i] || (isRTL ? `مؤشر ${i + 1}` : `Indicator ${i + 1}`),
        value: String(v),
        numValue: Math.abs(v),
        color: v >= 0 ? COLORS.accentGreen : COLORS.accentRed,
        direction: v >= 0 ? 1 : -1,
      });
    }
  }

  // Ensure at least 3 indicators
  while (indicators.length < 3) {
    const idx = indicators.length;
    indicators.push({
      label: isRTL ? `مؤشر ${idx + 1}` : `Indicator ${idx + 1}`,
      value: String(Math.round(50 + Math.random() * 40)),
      numValue: 50 + Math.random() * 40,
      color: [COLORS.accentBlue, COLORS.accentCyan, COLORS.accentGreen][idx % 3],
      direction: 1,
    });
  }

  const maxIndicatorVal = Math.max(...indicators.map(ind => ind.numValue), 1);

  // SVG chart data for morph phase
  const chartPoints = values.length > 0 ? values.slice(0, 10) : indicators.map(ind => ind.numValue);
  const chartLabelsArr = values.length > 0 ? labels.slice(0, 10) : indicators.map(ind => ind.label);

  return `
    <style>
      .race-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        padding:28px 56px 20px; position:relative;
      }

      .race-header {
        text-align:center; margin-bottom:20px;
        opacity:0; transform:translateY(-10px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .race-header.visible { opacity:1; transform:translateY(0); }
      .race-header-sub { font-size:12px; color:${COLORS.accentCyan}; font-weight:600; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px; }
      .race-header-title { font-size:28px; font-weight:800; color:${COLORS.textWhite}; }

      .race-body {
        flex:1; display:flex; gap:32px; position:relative;
      }

      /* Bar chart area */
      .race-bars {
        flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;
      }

      .race-bar-row {
        display:flex; align-items:center; gap:16px;
        opacity:0; transform:translateX(${isRTL ? '' : '-'}20px);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .race-bar-row.visible { opacity:1; transform:translateX(0); }

      .race-bar-label {
        width:140px; font-size:14px; font-weight:600; color:${COLORS.textLight};
        text-align:${isRTL ? 'left' : 'right'}; white-space:nowrap; overflow:hidden;
        text-overflow:ellipsis;
      }
      .race-bar-track {
        flex:1; height:36px; background:${COLORS.bgCard}; border-radius:8px;
        border:1px solid ${COLORS.borderBlue}; position:relative; overflow:hidden;
      }
      .race-bar-fill {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0; height:100%;
        border-radius:8px; width:0%; transition: width 0.4s ease;
      }
      .race-bar-fill-inner {
        height:100%; border-radius:8px;
        display:flex; align-items:center; justify-content:flex-end;
        padding-${isRTL ? 'left' : 'right'}:12px;
      }
      .race-bar-value {
        font-size:13px; font-weight:700; color:white;
        text-shadow:0 1px 3px rgba(0,0,0,0.3);
        white-space:nowrap;
      }
      .race-bar-rank {
        width:32px; height:32px; border-radius:8px;
        display:flex; align-items:center; justify-content:center;
        font-size:14px; font-weight:800;
      }

      /* Line chart area */
      .race-line-chart {
        flex:0.9; position:relative;
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        border-radius:16px; padding:20px;
        opacity:0; transform:scale(0.95);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .race-line-chart.visible { opacity:1; transform:scale(1); }
      .race-line-chart-title {
        font-size:14px; font-weight:600; color:${COLORS.textGray};
        margin-bottom:12px;
      }

      /* Morph transition overlay */
      .race-morph-label {
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        font-size:16px; font-weight:600; color:${COLORS.accentCyan};
        letter-spacing:2px; text-transform:uppercase;
        opacity:0; transition: opacity 0.3s ease;
        z-index:10;
      }
      .race-morph-label.visible { opacity:0.8; }
    </style>

    <div class="race-container" id="race-root">
      <!-- Header -->
      <div class="race-header" id="race-header">
        <div class="race-header-sub">📊 ${escapeHTML(sectionSub)}</div>
        <div class="race-header-title">${escapeHTML(chartTitle)}</div>
      </div>

      <!-- Body -->
      <div class="race-body">
        <!-- Racing bars -->
        <div class="race-bars" id="race-bars">
          ${indicators.map((ind, i) => `
            <div class="race-bar-row" id="race-row-${i}">
              <div class="race-bar-rank" style="background:${ind.color}15; color:${ind.color}; border:1px solid ${ind.color}30;">${i + 1}</div>
              <div class="race-bar-label">${escapeHTML(ind.label)}</div>
              <div class="race-bar-track">
                <div class="race-bar-fill" id="race-fill-${i}">
                  <div class="race-bar-fill-inner" style="background:linear-gradient(90deg, ${ind.color}40, ${ind.color});">
                    <span class="race-bar-value">${escapeHTML(ind.value)}</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Line chart -->
        <div class="race-line-chart" id="race-line-chart">
          <div class="race-line-chart-title">${isRTL ? 'اتجاه المؤشرات' : 'Indicator Trend'}</div>
          <svg id="race-line-svg" viewBox="0 0 600 400" width="100%" height="380" style="overflow:visible;">
            <defs>
              <linearGradient id="raceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${COLORS.accentBlue}" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="${COLORS.accentBlue}" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <!-- Grid -->
            ${[0,1,2,3,4].map(i => `
              <line x1="50" y1="${20 + i * 80}" x2="580" y2="${20 + i * 80}" stroke="rgba(59,130,246,0.06)" stroke-width="1"/>
            `).join('')}
            <!-- Area path -->
            <path id="race-area-path" fill="url(#raceAreaGrad)" d="" />
            <!-- Line path -->
            <path id="race-line-path" fill="none" stroke="${COLORS.accentBlue}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="" />
            <!-- Data points (will be added dynamically) -->
            <g id="race-points"></g>
          </svg>
        </div>
      </div>

      <!-- Morph label -->
      <div class="race-morph-label" id="race-morph-label">${isRTL ? 'تحويل ◆' : '◆ MORPH'}</div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('race-header');
      var barsContainer = document.getElementById('race-bars');
      var lineChart = document.getElementById('race-line-chart');
      var linePath = document.getElementById('race-line-path');
      var areaPath = document.getElementById('race-area-path');
      var pointsGroup = document.getElementById('race-points');
      var morphLabel = document.getElementById('race-morph-label');

      var indicators = ${JSON.stringify(indicators.map(ind => ({ label: ind.label, value: ind.value, numValue: ind.numValue, color: ind.color })))};
      var maxVal = ${maxIndicatorVal};
      var chartPoints = ${JSON.stringify(chartPoints)};
      var chartLabels = ${JSON.stringify(chartLabelsArr)};

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.10 — Header
        var headerPhase = segmentProgress(p, 0, 0.10);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 2: 0.08-0.55 — Racing bars animate in
        for (var i = 0; i < indicators.length; i++) {
          var rowEl = document.getElementById('race-row-' + i);
          var fillEl = document.getElementById('race-fill-' + i);
          var barStart = 0.08 + i * 0.06;
          var barEnd = 0.20 + i * 0.06;
          var barPhase = segmentProgress(p, barStart, barEnd);

          if (barPhase > 0 && rowEl) {
            rowEl.classList.add('visible');
          }

          // Bar fill animation extends from barStart to 0.55
          var fillPhase = segmentProgress(p, barStart, 0.55);
          if (fillPhase > 0 && fillEl) {
            var targetWidth = (indicators[i].numValue / maxVal) * 100;
            var currentWidth = targetWidth * easeOutCubic(fillPhase);
            fillEl.style.width = currentWidth + '%';
          }
        }

        // Phase 3: 0.50-0.65 — Line chart appears
        var linePhase = segmentProgress(p, 0.50, 0.65);
        if (linePhase > 0) {
          lineChart.classList.add('visible');
          drawLineChart(easeOutCubic(linePhase));
        }

        // Phase 4: 0.60-0.72 — Morph label flash
        var morphPhase = segmentProgress(p, 0.60, 0.72);
        if (morphPhase > 0 && morphPhase < 1) {
          morphLabel.classList.add('visible');
        } else {
          morphLabel.classList.remove('visible');
        }

        // Phase 5: 0.72-1.0 — Both fully visible, bars slightly dim, line chart prominent
        var finalPhase = segmentProgress(p, 0.72, 1.0);
        if (finalPhase > 0) {
          barsContainer.style.opacity = String(0.7 + 0.3 * (1 - finalPhase * 0.3));
          lineChart.style.transform = 'scale(' + (1 + finalPhase * 0.02) + ')';
        }
      };

      function drawLineChart(progress) {
        if (chartPoints.length === 0) return;
        var points = chartPoints;
        var W = 600, H = 400;
        var padL = 50, padR = 20, padT = 20, padB = 40;
        var chartW = W - padL - padR;
        var chartH = H - padT - padB;
        var maxP = Math.max.apply(null, points) * 1.15;
        var minP = Math.min.apply(null, Math.min(0, points));
        var range = maxP - minP || 1;

        var visibleCount = Math.ceil(points.length * progress);
        var coords = [];
        for (var i = 0; i < visibleCount; i++) {
          var x = padL + (chartW / Math.max(1, points.length - 1)) * i;
          var y = padT + chartH - ((points[i] - minP) / range * chartH);
          coords.push({ x: x, y: y });
        }

        if (coords.length === 0) return;

        // Line path
        var lineD = 'M' + coords[0].x + ',' + coords[0].y;
        for (var j = 1; j < coords.length; j++) {
          lineD += ' L' + coords[j].x + ',' + coords[j].y;
        }
        linePath.setAttribute('d', lineD);

        // Area path
        var areaD = lineD + ' L' + coords[coords.length - 1].x + ',' + (padT + chartH) + ' L' + coords[0].x + ',' + (padT + chartH) + ' Z';
        areaPath.setAttribute('d', areaD);

        // Data points
        var pointsHTML = '';
        for (var k = 0; k < coords.length; k++) {
          pointsHTML += '<circle cx="' + coords[k].x + '" cy="' + coords[k].y + '" r="4" fill="' + '${COLORS.accentBlue}' + '" stroke="white" stroke-width="1.5" opacity="0.9"/>';
          if (chartLabels[k]) {
            pointsHTML += '<text x="' + coords[k].x + '" y="' + (padT + chartH + 18) + '" text-anchor="middle" fill="${COLORS.textDim}" font-size="10" font-family="Inter,sans-serif">' + chartLabels[k].substring(0, 8) + '</text>';
          }
        }
        pointsGroup.innerHTML = pointsHTML;
      }

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 5: History ────────────────────────────────────────────
// ★NEW — 3 historical parallels on vertical timeline + comparison
function generateHistoryPulse(data) {
  const isRTL = data.locale === 'ar';
  const parallels = (data.historical_parallels || []).slice(0, 3);
  const sectionTitle = isRTL ? 'أوجه الشبه التاريخية' : 'Historical Parallels';
  const sectionSub = isRTL ? 'الماضي يعيد نفسه؟' : 'History Repeats?';
  const compareToLabel = isRTL ? 'مقارنة مع الوضع الحالي' : 'Compared to Current Situation';

  // Color coding for each parallel
  const parallelColors = [COLORS.accentBlue, COLORS.accentCyan, COLORS.accentPurple];

  return `
    <style>
      .history-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        padding:24px 56px 16px; position:relative;
      }

      .history-header {
        text-align:center; margin-bottom:16px;
        opacity:0; transform:translateY(-10px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .history-header.visible { opacity:1; transform:translateY(0); }
      .history-header-sub { font-size:12px; color:${COLORS.accentYellow}; font-weight:600; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px; }
      .history-header-title { font-size:30px; font-weight:800; color:${COLORS.textWhite}; }

      .history-body {
        flex:1; display:flex; gap:24px; position:relative;
      }

      /* Vertical timeline */
      .history-timeline {
        width:4px; position:relative; margin-${isRTL ? 'left' : 'right'}:28px;
        background:linear-gradient(180deg, ${COLORS.accentBlue}40, ${COLORS.accentCyan}30, ${COLORS.accentPurple}20);
        border-radius:2px;
        transform:scaleY(0); transform-origin:top;
        transition:transform 0.8s ease;
      }
      .history-timeline.drawn { transform:scaleY(1); }

      .history-timeline-dot {
        position:absolute; ${isRTL ? 'right' : 'left'}:-8px; width:20px; height:20px;
        border-radius:50%; border:2px solid; background:${COLORS.bgDark};
        display:flex; align-items:center; justify-content:center;
        opacity:0; transform:scale(0.5);
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      .history-timeline-dot.visible { opacity:1; transform:scale(1); }
      .history-timeline-dot-inner {
        width:8px; height:8px; border-radius:50%;
      }

      /* Parallel cards */
      .history-cards {
        flex:1; display:flex; flex-direction:column; gap:16px;
        justify-content:center;
      }

      .history-card {
        display:flex; gap:20px; padding:20px 24px;
        background:linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue}; border-radius:16px;
        position:relative; overflow:hidden;
        opacity:0; transform:translateX(${isRTL ? '' : '-'}25px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .history-card.visible { opacity:1; transform:translateX(0); }

      .history-card-year-badge {
        min-width:80px; height:80px; border-radius:12px;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        font-size:28px; font-weight:900; line-height:1;
      }
      .history-card-year-label {
        font-size:10px; font-weight:600; letter-spacing:1px; margin-top:2px;
        text-transform:uppercase;
      }

      .history-card-content { flex:1; }
      .history-card-title {
        font-size:18px; font-weight:700; color:${COLORS.textWhite}; margin-bottom:6px;
      }
      .history-card-cause {
        font-size:13px; color:${COLORS.textGray}; line-height:1.5; margin-bottom:8px;
      }
      .history-card-cause-label {
        display:inline; font-size:11px; font-weight:600; color:${COLORS.accentYellow};
        letter-spacing:1px; text-transform:uppercase;
      }
      .history-card-result {
        display:flex; align-items:center; gap:8px;
        padding:8px 14px; border-radius:8px;
        background:rgba(0,0,0,0.2); border:1px solid ${COLORS.borderBlue};
      }
      .history-card-result-icon { font-size:14px; }
      .history-card-result-label {
        font-size:11px; color:${COLORS.textDim}; letter-spacing:1px;
        text-transform:uppercase;
      }
      .history-card-result-text {
        font-size:13px; color:${COLORS.textLight}; font-weight:500;
      }

      /* Comparison section */
      .history-compare {
        flex:0.6; display:flex; flex-direction:column; justify-content:center;
        padding:24px;
        opacity:0; transform:scale(0.95);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .history-compare.visible { opacity:1; transform:scale(1); }

      .history-compare-card {
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        border-radius:16px; padding:24px; position:relative; overflow:hidden;
      }
      .history-compare-card::before {
        content:''; position:absolute; top:0; left:0; right:0; height:3px;
        background:linear-gradient(90deg, ${COLORS.accentBlue}, ${COLORS.accentCyan}, ${COLORS.accentPurple});
      }
      .history-compare-title {
        font-size:14px; font-weight:600; color:${COLORS.accentCyan};
        letter-spacing:1px; margin-bottom:16px;
        display:flex; align-items:center; gap:8px;
      }
      .history-compare-item {
        display:flex; align-items:center; gap:12px;
        padding:10px 0; border-bottom:1px solid ${COLORS.borderBlue};
      }
      .history-compare-item:last-child { border-bottom:none; }
      .history-compare-year {
        font-size:13px; font-weight:700; width:50px;
      }
      .history-compare-bar-track {
        flex:1; height:8px; background:rgba(59,130,246,0.1);
        border-radius:4px; position:relative; overflow:hidden;
      }
      .history-compare-bar-fill {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0;
        height:100%; border-radius:4px; width:0%;
        transition: width 0.5s ease;
      }
      .history-compare-similarity {
        font-size:12px; font-weight:600; width:40px; text-align:${isRTL ? 'left' : 'right'};
      }

      /* Accent decorations */
      .history-card-accent {
        position:absolute; top:0; ${isRTL ? 'left' : 'right'}:0;
        width:60px; height:60px; opacity:0.05;
      }
    </style>

    <div class="history-container" id="history-root">
      <!-- Header -->
      <div class="history-header" id="history-header">
        <div class="history-header-sub">🕐 ${escapeHTML(sectionSub)}</div>
        <div class="history-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <!-- Body -->
      <div class="history-body">
        <!-- Left side: Timeline + Cards -->
        <div style="flex:1; display:flex; position:relative;">
          <!-- Timeline bar -->
          <div class="history-timeline" id="history-timeline">
            ${parallels.map((_, i) => {
              const topPercent = 15 + i * 30;
              return `<div class="history-timeline-dot" id="history-dot-${i}" style="top:${topPercent}%; border-color:${parallelColors[i]};">
                <div class="history-timeline-dot-inner" style="background:${parallelColors[i]};"></div>
              </div>`;
            }).join('')}
          </div>

          <!-- Cards -->
          <div class="history-cards">
            ${parallels.map((par, i) => `
              <div class="history-card" id="history-card-${i}">
                <div class="history-card-year-badge" style="background:${parallelColors[i]}12; border:1px solid ${parallelColors[i]}30;">
                  <span style="color:${parallelColors[i]};">${escapeHTML(par.year)}</span>
                  <span class="history-card-year-label" style="color:${parallelColors[i]}60;">${isRTL ? 'سنة' : 'YR'}</span>
                </div>
                <div class="history-card-content">
                  <div class="history-card-title">${escapeHTML(par.title)}</div>
                  <div class="history-card-cause">
                    <span class="history-card-cause-label">${isRTL ? 'السبب:' : 'CAUSE:'}</span>
                    ${escapeHTML(par.cause)}
                  </div>
                  <div class="history-card-result">
                    <span class="history-card-result-icon">📊</span>
                    <span class="history-card-result-label">${isRTL ? 'النتيجة:' : 'RESULT:'}</span>
                    <span class="history-card-result-text">${escapeHTML(par.result)}</span>
                  </div>
                </div>
                <div class="history-card-accent">
                  <svg viewBox="0 0 60 60" fill="${parallelColors[i]}">
                    <circle cx="30" cy="30" r="30"/>
                  </svg>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right side: Comparison -->
        <div class="history-compare" id="history-compare">
          <div class="history-compare-card">
            <div class="history-compare-title">
              <span>⚡</span>
              <span>${escapeHTML(compareToLabel)}</span>
            </div>
            ${parallels.map((par, i) => {
              // Simulated similarity percentages
              const similarities = [78, 62, 55];
              const sim = similarities[i] || 50;
              return `
                <div class="history-compare-item">
                  <span class="history-compare-year" style="color:${parallelColors[i]};">${escapeHTML(par.year)}</span>
                  <div class="history-compare-bar-track">
                    <div class="history-compare-bar-fill" id="history-bar-${i}" style="background:${parallelColors[i]};"></div>
                  </div>
                  <span class="history-compare-similarity" style="color:${parallelColors[i]};">${sim}%</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('history-header');
      var timeline = document.getElementById('history-timeline');
      var compare = document.getElementById('history-compare');

      var dots = [];
      var cards = [];
      var bars = [];
      for (var i = 0; i < 3; i++) {
        dots.push(document.getElementById('history-dot-' + i));
        cards.push(document.getElementById('history-card-' + i));
        bars.push(document.getElementById('history-bar-' + i));
      }

      var similarities = [78, 62, 55];
      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: 0-0.10 — Header
        var headerPhase = segmentProgress(p, 0, 0.10);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 2: 0.08-0.30 — Timeline draws
        var tlPhase = segmentProgress(p, 0.08, 0.30);
        if (tlPhase > 0) {
          timeline.classList.add('drawn');
          timeline.style.transform = 'scaleY(' + easeOutCubic(tlPhase) + ')';
        }

        // Phase 3: 0.15-0.70 — Cards and dots appear
        for (var i = 0; i < 3; i++) {
          var cardStart = 0.15 + i * 0.15;
          var cardEnd = 0.25 + i * 0.15;
          var cardPhase = segmentProgress(p, cardStart, cardEnd);

          if (cardPhase > 0) {
            if (dots[i]) dots[i].classList.add('visible');
            if (cards[i]) cards[i].classList.add('visible');
          }
        }

        // Phase 4: 0.55-0.80 — Comparison section
        var compPhase = segmentProgress(p, 0.55, 0.70);
        if (compPhase > 0) {
          compare.classList.add('visible');

          // Animate comparison bars
          for (var j = 0; j < 3; j++) {
            var barPhase = segmentProgress(p, 0.58 + j * 0.06, 0.68 + j * 0.06);
            if (barPhase > 0 && bars[j]) {
              bars[j].style.width = (similarities[j] * easeOutCubic(barPhase)) + '%';
            }
          }
        }

        // Phase 5: 0.80-1.0 — Breathing / subtle pulse
        if (p > 0.8) {
          var breathe = Math.sin(p * 25) * 0.008;
          cards.forEach(function(card) {
            if (card) card.style.transform = 'scale(' + (1 + breathe) + ')';
          });
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 6: Alert ───────────────────────────────────────────────
// 3 scenario flash alerts appearing one by one with probability bars
function generateAlertPulse(data) {
  const isRTL = data.locale === 'ar';
  const scenarios = (data.scenarios || []).slice(0, 3);
  const sectionTitle = isRTL ? 'سيناريوهات محتملة' : 'Likely Scenarios';
  const probabilityLabel = isRTL ? 'الاحتمالية' : 'Probability';
  const resultLabel = isRTL ? 'النتيجة' : 'Result';

  // Map color name to hex
  function scenarioColor(colorName) {
    if (colorName === 'green') return COLORS.accentGreen;
    if (colorName === 'yellow') return COLORS.accentYellow;
    if (colorName === 'red') return COLORS.accentRed;
    return COLORS.accentGold;
  }

  // Parse probability string to number (0-100)
  function parseProbability(prob) {
    const num = parseInt(String(prob).replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 50 : Math.min(100, Math.max(0, num));
  }

  const alertCardsHTML = scenarios.map((sc, i) => {
    const color = scenarioColor(sc.color);
    const prob = parseProbability(sc.probability);
    const delay = i * 0.2;
    return `
      <div class="alert-card" id="alert-card-${i}" style="
        opacity:0; transform:translateY(30px) scale(0.95);
        border-left:4px solid ${color};
      ">
        <div class="alert-card-header">
          <div class="alert-color-dot" style="background:${color}; box-shadow:0 0 8px ${color};"></div>
          <span class="alert-card-title" style="color:${color};">${escapeHTML(sc.title)}</span>
          <span class="alert-card-prob-badge" style="background:${color}15; color:${color}; border:1px solid ${color}30;">${escapeHTML(sc.probability)}</span>
        </div>
        <div class="alert-card-result">
          <span class="alert-result-label">${escapeHTML(resultLabel)}:</span>
          <span class="alert-result-value">${escapeHTML(sc.result)}</span>
        </div>
        <div class="alert-prob-row">
          <span class="alert-prob-label">${escapeHTML(probabilityLabel)}</span>
          <div class="alert-prob-bar-bg">
            <div class="alert-prob-bar-fill" id="alert-bar-${i}" style="width:0%; background:linear-gradient(90deg, ${color}, ${color}cc);"></div>
          </div>
          <span class="alert-prob-num" id="alert-prob-num-${i}" style="color:${color};">0%</span>
        </div>
      </div>`;
  }).join('');

  return `
    <style>
      .alert-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
        padding: 40px 80px;
      }

      .alert-header {
        display:flex; align-items:center; gap:14px;
        margin-bottom:36px; opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .alert-header.visible { opacity:1; transform:translateY(0); }

      .alert-header-icon {
        width:42px; height:42px; border-radius:10px;
        background: linear-gradient(135deg, ${COLORS.accentYellow}20, ${COLORS.accentRed}15);
        border:1px solid ${COLORS.accentYellow}30;
        display:flex; align-items:center; justify-content:center;
        font-size:20px;
      }
      .alert-header-title {
        font-size:28px; font-weight:800; letter-spacing:0.5px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      }

      .alert-cards-wrap {
        width:100%; max-width:1100px; display:flex; flex-direction:column;
        gap:20px;
      }

      .alert-card {
        width:100%; padding:24px 32px; border-radius:16px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease;
        position:relative; overflow:hidden;
      }
      .alert-card.visible {
        opacity:1 !important; transform:translateY(0) scale(1) !important;
      }
      .alert-card::after {
        content:''; position:absolute; top:0; left:0; right:0; bottom:0;
        opacity:0; pointer-events:none; transition: opacity 0.5s ease;
      }
      .alert-card.flash::after {
        opacity:0.08;
      }

      .alert-card-header {
        display:flex; align-items:center; gap:12px; margin-bottom:14px;
      }
      .alert-color-dot {
        width:10px; height:10px; border-radius:50%; flex-shrink:0;
      }
      .alert-card-title {
        font-size:20px; font-weight:700; flex:1;
      }
      .alert-card-prob-badge {
        padding:4px 14px; border-radius:100px;
        font-size:14px; font-weight:700; letter-spacing:0.5px;
      }

      .alert-card-result {
        font-size:15px; color:${COLORS.textLight}; margin-bottom:16px;
        line-height:1.5;
      }
      .alert-result-label {
        color:${COLORS.textDim}; font-weight:500; margin-${isRTL ? 'left' : 'right'}:6px;
      }
      .alert-result-value {
        color:${COLORS.textWhite}; font-weight:600;
      }

      .alert-prob-row {
        display:flex; align-items:center; gap:12px;
      }
      .alert-prob-label {
        font-size:12px; color:${COLORS.textDim}; font-weight:500;
        min-width:${isRTL ? '60px' : '80px'}; text-align:${isRTL ? 'right' : 'left'};
      }
      .alert-prob-bar-bg {
        flex:1; height:8px; border-radius:4px;
        background:rgba(255,255,255,0.06);
        overflow:hidden;
      }
      .alert-prob-bar-fill {
        height:100%; border-radius:4px;
        transition: width 0.8s cubic-bezier(0.16,1,0.3,1);
      }
      .alert-prob-num {
        font-size:16px; font-weight:800; min-width:48px;
        text-align:${isRTL ? 'left' : 'right'};
      }

      /* Screen flash overlay */
      .alert-screen-flash {
        position:absolute; top:0; left:0; right:0; bottom:0;
        pointer-events:none; z-index:50;
        opacity:0; transition: opacity 0.15s ease;
      }
    </style>

    <div class="alert-container" id="alert-root">
      <div class="alert-screen-flash" id="alert-screen-flash"></div>

      <div class="alert-header" id="alert-header">
        <div class="alert-header-icon">⚡</div>
        <div class="alert-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <div class="alert-cards-wrap">
        ${alertCardsHTML}
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('alert-header');
      var screenFlash = document.getElementById('alert-screen-flash');
      var cards = [];
      var bars = [];
      var probNums = [];
      var colors = [${scenarios.map(s => `"${scenarioColor(s.color)}"`).join(',')}];
      var probs = [${scenarios.map(s => parseProbability(s.probability)).join(',')}];

      for (var i = 0; i < ${scenarios.length}; i++) {
        cards.push(document.getElementById('alert-card-' + i));
        bars.push(document.getElementById('alert-bar-' + i));
        probNums.push(document.getElementById('alert-prob-num-' + i));
      }

      var baseSetProgress = window.setAnimationProgress;
      var flashed = [false, false, false];

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 0: Header appears
        var headerPhase = segmentProgress(p, 0, 0.08);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 1: Alert1 appears (0-0.3)
        var a1Phase = segmentProgress(p, 0.06, 0.30);
        if (a1Phase > 0 && cards[0]) {
          cards[0].classList.add('visible');
          // Flash effect
          if (!flashed[0] && a1Phase > 0.01) {
            flashed[0] = true;
            screenFlash.style.background = colors[0];
            screenFlash.style.opacity = '0.12';
            setTimeout(function() { screenFlash.style.opacity = '0'; }, 200);
            cards[0].classList.add('flash');
            cards[0].querySelector('.alert-card-header') || null;
          }
          // Animate bar
          var barProg = easeOutCubic(a1Phase);
          bars[0].style.width = (probs[0] * barProg) + '%';
          probNums[0].textContent = Math.round(probs[0] * barProg) + '%';
        }

        // Phase 2: Alert2 appears (0.3-0.6)
        var a2Phase = segmentProgress(p, 0.30, 0.60);
        if (a2Phase > 0 && cards[1]) {
          cards[1].classList.add('visible');
          if (!flashed[1] && a2Phase > 0.01) {
            flashed[1] = true;
            screenFlash.style.background = colors[1];
            screenFlash.style.opacity = '0.12';
            setTimeout(function() { screenFlash.style.opacity = '0'; }, 200);
            cards[1].classList.add('flash');
          }
          var barProg2 = easeOutCubic(a2Phase);
          bars[1].style.width = (probs[1] * barProg2) + '%';
          probNums[1].textContent = Math.round(probs[1] * barProg2) + '%';
        }

        // Phase 3: Alert3 appears (0.6-0.85)
        var a3Phase = segmentProgress(p, 0.60, 0.85);
        if (a3Phase > 0 && cards[2]) {
          cards[2].classList.add('visible');
          if (!flashed[2] && a3Phase > 0.01) {
            flashed[2] = true;
            screenFlash.style.background = colors[2];
            screenFlash.style.opacity = '0.12';
            setTimeout(function() { screenFlash.style.opacity = '0'; }, 200);
            cards[2].classList.add('flash');
          }
          var barProg3 = easeOutCubic(a3Phase);
          bars[2].style.width = (probs[2] * barProg3) + '%';
          probNums[2].textContent = Math.round(probs[2] * barProg3) + '%';
        }

        // Phase 4: Settle — subtle breathing (0.85-1.0)
        if (p > 0.85) {
          var breathe = Math.sin(p * 30) * 0.005;
          for (var k = 0; k < cards.length; k++) {
            if (cards[k] && cards[k].classList.contains('visible')) {
              cards[k].style.transform = 'translateY(0) scale(' + (1 + breathe) + ')';
            }
          }
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 7: Takeaway ──────────────────────────────────────────
// 3 strategic fact cards that slide up one by one with color coding
function generateTakeawayPulse(data) {
  const isRTL = data.locale === 'ar';
  const takeaways = (data.strategic_takeaways || []).slice(0, 3);
  const sectionTitle = isRTL ? 'خلاصة استراتيجية' : 'Strategic Takeaways';
  const progressLabel = isRTL ? 'حقيقة' : 'Fact';

  // Map color name to hex
  function takeawayColor(colorName) {
    if (colorName === 'green') return COLORS.accentGreen;
    if (colorName === 'gold') return COLORS.accentGold;
    if (colorName === 'red') return COLORS.accentRed;
    return COLORS.accentGold;
  }

  const factCardsHTML = takeaways.map((tw, i) => {
    const color = takeawayColor(tw.color);
    const counterNum = isRTL ? toArabicNumeral(i + 1) : String(i + 1);
    const counterTotal = isRTL ? toArabicNumeral(3) : '3';
    return `
      <div class="takeaway-card" id="takeaway-card-${i}" style="
        opacity:0; transform:translateY(40px);
        border-${isRTL ? 'right' : 'left'}:5px solid ${color};
      " data-color="${color}">
        <div class="takeaway-card-top">
          <div class="takeaway-counter" style="color:${color};">
            <span class="takeaway-counter-label">${escapeHTML(progressLabel)}</span>
            <span class="takeaway-counter-num">${counterNum}/${counterTotal}</span>
          </div>
          <div class="takeaway-title" style="color:${COLORS.textWhite};">${escapeHTML(tw.title)}</div>
        </div>
        <div class="takeaway-detail">${escapeHTML(tw.detail)}</div>
        <div class="takeaway-glow" id="takeaway-glow-${i}" style="background:radial-gradient(ellipse at ${isRTL ? 'right' : 'left'} center, ${color}10, transparent 70%);"></div>
      </div>`;
  }).join('');

  return `
    <style>
      .takeaway-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; justify-content:center; position:relative;
        padding: 40px 80px;
      }

      .takeaway-header {
        display:flex; align-items:center; gap:14px;
        margin-bottom:32px; opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .takeaway-header.visible { opacity:1; transform:translateY(0); }

      .takeaway-header-icon {
        width:42px; height:42px; border-radius:10px;
        background: linear-gradient(135deg, ${COLORS.accentGold}20, ${COLORS.accentBlue}10);
        border:1px solid ${COLORS.accentGold}30;
        display:flex; align-items:center; justify-content:center;
        font-size:20px;
      }
      .takeaway-header-title {
        font-size:28px; font-weight:800; letter-spacing:0.5px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      }

      .takeaway-cards-wrap {
        width:100%; max-width:1000px; display:flex; flex-direction:column;
        gap:18px;
      }

      .takeaway-card {
        width:100%; padding:24px 32px 24px 28px; border-radius:16px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        position:relative; overflow:hidden;
        transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
      }
      .takeaway-card.visible {
        opacity:1 !important; transform:translateY(0) !important;
      }

      .takeaway-glow {
        position:absolute; top:0; ${isRTL ? 'right' : 'left'}:0; bottom:0; width:60%;
        pointer-events:none; opacity:0; transition: opacity 0.8s ease;
      }
      .takeaway-card.active-glow .takeaway-glow { opacity:1; }

      .takeaway-card-top {
        display:flex; align-items:center; gap:16px; margin-bottom:10px;
      }

      .takeaway-counter {
        display:flex; flex-direction:column; align-items:center;
        min-width:56px; padding:6px 0;
      }
      .takeaway-counter-label {
        font-size:10px; font-weight:500; opacity:0.7; letter-spacing:1px;
      }
      .takeaway-counter-num {
        font-size:18px; font-weight:900; letter-spacing:0.5px;
      }

      .takeaway-title {
        font-size:22px; font-weight:700; line-height:1.3; flex:1;
      }

      .takeaway-detail {
        font-size:15px; color:${COLORS.textLight}; line-height:1.6;
        padding-${isRTL ? 'right' : 'left'}:72px;
      }

      /* Progress bar at bottom */
      .takeaway-progress-section {
        width:100%; max-width:1000px; margin-top:28px;
        display:flex; align-items:center; gap:16px;
        opacity:0; transition: opacity 0.6s ease;
      }
      .takeaway-progress-section.visible { opacity:1; }

      .takeaway-progress-bar-bg {
        flex:1; height:4px; border-radius:2px;
        background:rgba(255,255,255,0.06);
        overflow:hidden;
      }
      .takeaway-progress-bar-fill {
        height:100%; border-radius:2px;
        background:linear-gradient(90deg, ${COLORS.accentBlue}, ${COLORS.accentCyan});
        width:0%; transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
      }
      .takeaway-progress-text {
        font-size:13px; color:${COLORS.textDim}; font-weight:600;
        min-width:40px; text-align:${isRTL ? 'left' : 'right'};
      }
    </style>

    <div class="takeaway-container" id="takeaway-root">
      <div class="takeaway-header" id="takeaway-header">
        <div class="takeaway-header-icon">🎯</div>
        <div class="takeaway-header-title">${escapeHTML(sectionTitle)}</div>
      </div>

      <div class="takeaway-cards-wrap">
        ${factCardsHTML}
      </div>

      <div class="takeaway-progress-section" id="takeaway-progress-section">
        <div class="takeaway-progress-bar-bg">
          <div class="takeaway-progress-bar-fill" id="takeaway-progress-fill"></div>
        </div>
        <div class="takeaway-progress-text" id="takeaway-progress-text">0/3</div>
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('takeaway-header');
      var progressSection = document.getElementById('takeaway-progress-section');
      var progressFill = document.getElementById('takeaway-progress-fill');
      var progressText = document.getElementById('takeaway-progress-text');
      var cards = [];
      var glows = [];

      for (var i = 0; i < ${takeaways.length}; i++) {
        cards.push(document.getElementById('takeaway-card-' + i));
        glows.push(document.getElementById('takeaway-glow-' + i));
      }

      var baseSetProgress = window.setAnimationProgress;
      var visibleCount = 0;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Header
        var headerPhase = segmentProgress(p, 0, 0.08);
        if (headerPhase > 0) {
          header.classList.add('visible');
          progressSection.classList.add('visible');
        }

        // Phase 1: Fact1 slide-up (0-0.3)
        var f1Phase = segmentProgress(p, 0.06, 0.30);
        if (f1Phase > 0 && cards[0]) {
          cards[0].classList.add('visible');
          cards[0].classList.add('active-glow');
          visibleCount = 1;
        }

        // Phase 2: Fact2 slide-up (0.3-0.6)
        var f2Phase = segmentProgress(p, 0.30, 0.60);
        if (f2Phase > 0 && cards[1]) {
          if (cards[0]) cards[0].classList.remove('active-glow');
          cards[1].classList.add('visible');
          cards[1].classList.add('active-glow');
          visibleCount = 2;
        }

        // Phase 3: Fact3 slide-up (0.6-0.85)
        var f3Phase = segmentProgress(p, 0.60, 0.85);
        if (f3Phase > 0 && cards[2]) {
          if (cards[1]) cards[1].classList.remove('active-glow');
          cards[2].classList.add('visible');
          cards[2].classList.add('active-glow');
          visibleCount = 3;
        }

        // Update progress bar
        var progPhase = segmentProgress(p, 0.06, 0.85);
        var fillPct = Math.min(100, easeOutCubic(progPhase) * 100);
        progressFill.style.width = fillPct + '%';
        var shown = Math.min(3, Math.floor(progPhase * 3.01) + (progPhase > 0 ? 1 : 0));
        if (progPhase <= 0) shown = 0;
        shown = Math.min(shown, visibleCount);
        progressText.textContent = shown + '/3';

        // Phase 4: Settle — breathing
        if (p > 0.85) {
          var breathe = Math.sin(p * 30) * 0.005;
          for (var k = 0; k < cards.length; k++) {
            if (cards[k] && cards[k].classList.contains('visible')) {
              cards[k].style.transform = 'translateY(0) scale(' + (1 + breathe) + ')';
            }
          }
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
    })();
    </script>
  `;
}

// ─── Pulse 8: Deal ──────────────────────────────────────────────
// Asset grid (benefiting/harmed) + chart morph to treemap
function generateDealPulse(data) {
  const isRTL = data.locale === 'ar';
  const benefitingAssets = (data.benefiting_assets || []).slice(0, 4);
  const harmedAssets = (data.harmed_assets || []).slice(0, 3);
  const benefitingLabel = isRTL ? 'أصول مستفيدة ✅' : 'Benefiting Assets ✅';
  const harmedLabel = isRTL ? 'أصول متضررة ❌' : 'Harmed Assets ❌';

  // Generate random-ish sparkline SVG path for an asset
  function generateSparkline(seed, isPositive) {
    const points = [];
    const w = 80;
    const h = 28;
    let y = h / 2;
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * w;
      const delta = ((Math.sin(seed * 7 + i * 3.7) * 0.5 + Math.cos(seed * 2.3 + i * 1.9) * 0.3) * h * 0.3);
      y = clamp(y + delta, 4, h - 4);
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const color = isPositive ? COLORS.accentGreen : COLORS.accentRed;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="flex-shrink:0;">
      <path d="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // Build asset card HTML
  function assetCardHTML(asset, index, isBenefiting) {
    const sparkSeed = index * 13 + (isBenefiting ? 37 : 71);
    const sparkline = generateSparkline(sparkSeed, isBenefiting);
    const nameColor = isBenefiting ? COLORS.accentGreen : COLORS.accentRed;
    const icon = isBenefiting ? '📈' : '📉';
    return `
      <div class="deal-asset-card" id="deal-asset-${isBenefiting ? 'b' : 'h'}-${index}" style="
        opacity:0; transform:translateX(${isBenefiting ? '-30px' : '30px'});
      ">
        <div class="deal-asset-icon">${icon}</div>
        <div class="deal-asset-info">
          <div class="deal-asset-name" style="color:${nameColor};">${escapeHTML(asset.name)}</div>
          <div class="deal-asset-symbol">${escapeHTML(asset.symbol)}</div>
          <div class="deal-asset-reason">${escapeHTML(asset.reason)}</div>
        </div>
        <div class="deal-asset-spark">${sparkline}</div>
      </div>`;
  }

  const benefitingCardsHTML = benefitingAssets.map((a, i) => assetCardHTML(a, i, true)).join('');
  const harmedCardsHTML = harmedAssets.map((a, i) => assetCardHTML(a, i, false)).join('');

  // Build treemap rectangles
  function buildTreemapRects() {
    const allAssets = [
      ...benefitingAssets.map(a => ({ ...a, isBenefiting: true, size: 80 + Math.random() * 40 })),
      ...harmedAssets.map(a => ({ ...a, isBenefiting: false, size: 50 + Math.random() * 30 })),
    ];
    // Simple treemap layout using slice-and-dice
    const rects = [];
    const totalW = 1600;
    const totalH = 600;
    const totalSize = allAssets.reduce((s, a) => s + a.size, 0);
    const gap = 4;
    let cx = 0;
    let cy = 0;
    let remainingW = totalW;
    let remainingH = totalH;
    let horizontal = true;

    allAssets.forEach((asset, i) => {
      const fraction = asset.size / totalSize;
      const color = asset.isBenefiting ? COLORS.accentGreen : COLORS.accentRed;
      const bgColor = asset.isBenefiting ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)';

      let rw, rh;
      if (horizontal) {
        rw = Math.max(1, remainingW * fraction);
        rh = remainingH;
      } else {
        rw = remainingW;
        rh = Math.max(1, remainingH * fraction);
      }

      rects.push({
        x: cx, y: cy,
        w: Math.max(1, rw - gap),
        h: Math.max(1, rh - gap),
        color, bgColor,
        name: asset.name,
        symbol: asset.symbol,
        isBenefiting: asset.isBenefiting,
      });

      if (horizontal) {
        cx += rw;
        remainingW -= rw;
        if (remainingW < 20) { remainingW = totalW; cx = 0; cy += remainingH; horizontal = !horizontal; }
      } else {
        cy += rh;
        remainingH -= rh;
        if (remainingH < 20) { remainingH = totalH; cy = 0; cx += remainingW; horizontal = !horizontal; }
      }
    });

    return rects;
  }

  const treemapRects = buildTreemapRects();
  const treemapSVG = `<svg width="1600" height="600" viewBox="0 0 1600 600" style="width:100%;height:auto;">
    ${treemapRects.map((r, i) => `
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="6"
        fill="${r.bgColor}" stroke="${r.color}" stroke-width="1.5" stroke-opacity="0.5"
        class="deal-treemap-rect" id="deal-trect-${i}"/>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 - 8}" text-anchor="middle"
        fill="${r.color}" font-size="16" font-weight="700" font-family="Inter,Noto Sans Arabic,sans-serif"
        class="deal-treemap-text" id="deal-ttext-${i}">${escapeHTML(r.symbol)}</text>
      <text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 14}" text-anchor="middle"
        fill="${COLORS.textLight}" font-size="12" font-weight="500" font-family="Noto Sans Arabic,Inter,sans-serif"
        class="deal-treemap-text" id="deal-ttext-sub-${i}">${escapeHTML(r.name)}</text>
    `).join('')}
  </svg>`;

  return `
    <style>
      .deal-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; position:relative; padding: 32px 48px;
      }

      .deal-header {
        display:flex; align-items:center; gap:14px;
        margin-bottom:24px; opacity:0; transform:translateY(-15px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .deal-header.visible { opacity:1; transform:translateY(0); }

      .deal-header-icon {
        width:42px; height:42px; border-radius:10px;
        background: linear-gradient(135deg, ${COLORS.accentGreen}15, ${COLORS.accentRed}15);
        border:1px solid ${COLORS.accentBlue}25;
        display:flex; align-items:center; justify-content:center;
        font-size:20px;
      }
      .deal-header-title {
        font-size:26px; font-weight:800; letter-spacing:0.5px;
        background:linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      }

      .deal-grid-view {
        width:100%; display:flex; gap:32px; flex:1;
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .deal-grid-view.hidden {
        opacity:0; transform:scale(0.95); pointer-events:none;
      }

      .deal-col {
        flex:1; display:flex; flex-direction:column;
      }
      .deal-col-label {
        font-size:16px; font-weight:700; margin-bottom:14px;
        padding:8px 16px; border-radius:8px;
        background:${COLORS.bgCard}; border:1px solid ${COLORS.borderBlue};
        text-align:center;
      }
      .deal-col-label-ben { color:${COLORS.accentGreen}; }
      .deal-col-label-harm { color:${COLORS.accentRed}; }

      .deal-asset-card {
        display:flex; align-items:center; gap:14px;
        padding:14px 18px; border-radius:12px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        margin-bottom:10px;
        transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1);
      }
      .deal-asset-card.visible {
        opacity:1 !important; transform:translateX(0) !important;
      }

      .deal-asset-icon { font-size:22px; flex-shrink:0; }
      .deal-asset-info { flex:1; }
      .deal-asset-name { font-size:16px; font-weight:700; }
      .deal-asset-symbol { font-size:12px; color:${COLORS.textDim}; font-weight:600; letter-spacing:1px; }
      .deal-asset-reason { font-size:12px; color:${COLORS.textLight}; margin-top:2px; }
      .deal-asset-spark { flex-shrink:0; }

      /* Treemap view */
      .deal-treemap-view {
        width:100%; max-width:1600px; flex:1;
        display:flex; align-items:center; justify-content:center;
        opacity:0; transform:scale(0.92);
        transition: opacity 0.6s ease, transform 0.6s ease;
        position:relative;
      }
      .deal-treemap-view.visible {
        opacity:1; transform:scale(1);
      }

      .deal-treemap-rect {
        transition: opacity 0.4s ease;
      }
      .deal-treemap-text {
        transition: opacity 0.4s ease;
      }
    </style>

    <div class="deal-container" id="deal-root">
      <div class="deal-header" id="deal-header">
        <div class="deal-header-icon">📊</div>
        <div class="deal-header-title">${isRTL ? 'تأثير على الأصول' : 'Asset Impact'}</div>
      </div>

      <div class="deal-grid-view" id="deal-grid-view">
        <div class="deal-col">
          <div class="deal-col-label deal-col-label-ben">${escapeHTML(benefitingLabel)}</div>
          ${benefitingCardsHTML}
        </div>
        <div class="deal-col">
          <div class="deal-col-label deal-col-label-harm">${escapeHTML(harmedLabel)}</div>
          ${harmedCardsHTML}
        </div>
      </div>

      <div class="deal-treemap-view" id="deal-treemap-view">
        ${treemapSVG}
      </div>
    </div>

    <script>
    (function() {
      var header = document.getElementById('deal-header');
      var gridView = document.getElementById('deal-grid-view');
      var treemapView = document.getElementById('deal-treemap-view');

      var benCards = [];
      var harmCards = [];
      for (var i = 0; i < ${benefitingAssets.length}; i++) {
        benCards.push(document.getElementById('deal-asset-b-' + i));
      }
      for (var j = 0; j < ${harmedAssets.length}; j++) {
        harmCards.push(document.getElementById('deal-asset-h-' + j));
      }

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Header
        var headerPhase = segmentProgress(p, 0, 0.06);
        if (headerPhase > 0) header.classList.add('visible');

        // Phase 1: Benefiting assets appear (0-0.35)
        for (var i = 0; i < benCards.length; i++) {
          var start = 0.05 + i * 0.08;
          var end = start + 0.12;
          var phase = segmentProgress(p, start, end);
          if (phase > 0 && benCards[i]) {
            benCards[i].classList.add('visible');
          }
        }

        // Phase 2: Harmed assets appear (0.35-0.6)
        for (var j = 0; j < harmCards.length; j++) {
          var hstart = 0.35 + j * 0.08;
          var hend = hstart + 0.12;
          var hphase = segmentProgress(p, hstart, hend);
          if (hphase > 0 && harmCards[j]) {
            harmCards[j].classList.add('visible');
          }
        }

        // Phase 3: Morph transition (0.6-0.75)
        var morphPhase = segmentProgress(p, 0.60, 0.75);
        if (morphPhase > 0) {
          gridView.classList.add('hidden');
        } else {
          gridView.classList.remove('hidden');
        }

        // Phase 4: Treemap visible (0.75-1.0)
        var treePhase = segmentProgress(p, 0.70, 0.85);
        if (treePhase > 0) {
          treemapView.classList.add('visible');
        } else {
          treemapView.classList.remove('visible');
        }

        // Subtle treemap rect animation
        if (p > 0.75) {
          var breathe = Math.sin(p * 25) * 0.003;
          treemapView.style.transform = 'scale(' + (1 + breathe) + ')';
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
    })();
    </script>
  `;
}

// ─── Pulse 9: Harvest ───────────────────────────────────────────
// Recommendations ticker + brand logo pulse + fade out
function generateHarvestPulse(data) {
  const isRTL = data.locale === 'ar';
  const recommendations = (data.recommendations || []).slice(0, 3);
  const tagline = isRTL ? 'رؤى اقتصادية تصنع الفرق' : 'Economic Insights That Make a Difference';

  // Horizon labels
  function horizonLabel(horizon) {
    if (horizon === 'daily') return isRTL ? 'يومي' : 'Daily';
    if (horizon === 'medium') return isRTL ? 'متوسط' : 'Medium';
    if (horizon === 'long') return isRTL ? 'طويل' : 'Long-Term';
    return horizon;
  }

  function horizonBadgeColor(horizon) {
    if (horizon === 'daily') return COLORS.accentCyan;
    if (horizon === 'medium') return COLORS.accentYellow;
    if (horizon === 'long') return COLORS.accentPurple;
    return COLORS.accentBlue;
  }

  function actionLabel(action) {
    if (!action) return '';
    const lower = action.toLowerCase();
    if (lower.includes('شراء') || lower.includes('buy')) return isRTL ? 'شراء' : 'Buy';
    if (lower.includes('بيع') || lower.includes('sell')) return isRTL ? 'بيع' : 'Sell';
    return action;
  }

  function actionColor(action) {
    const lower = (action || '').toLowerCase();
    if (lower.includes('شراء') || lower.includes('buy')) return COLORS.accentGreen;
    if (lower.includes('بيع') || lower.includes('sell')) return COLORS.accentRed;
    return COLORS.accentBlue;
  }

  const recCardsHTML = recommendations.map((rec, i) => {
    const hBadgeColor = horizonBadgeColor(rec.horizon);
    const aColor = actionColor(rec.action);
    const isDaily = rec.horizon === 'daily';
    const entryLabel = isRTL ? 'دخول' : 'Entry';
    const targetLabel = isRTL ? 'هدف' : 'Target';
    const stopLabel = isRTL ? 'وقف' : 'Stop';
    const allocLabel = isRTL ? 'تخصيص' : 'Alloc';
    return `
      <div class="harvest-rec-card" id="harvest-rec-${i}">
        <div class="harvest-rec-horizon" style="background:${hBadgeColor}18; color:${hBadgeColor}; border:1px solid ${hBadgeColor}30;">
          ${escapeHTML(horizonLabel(rec.horizon))}
        </div>
        <div class="harvest-rec-body">
          <div class="harvest-rec-asset">${escapeHTML(rec.asset)}</div>
          <div class="harvest-rec-action" style="color:${aColor};">${escapeHTML(actionLabel(rec.action))}</div>
        </div>
        ${isDaily ? `
        <div class="harvest-rec-prices">
          <div class="harvest-price-item">
            <span class="harvest-price-label">${escapeHTML(entryLabel)}</span>
            <span class="harvest-price-val">${escapeHTML(rec.entry || '—')}</span>
          </div>
          <div class="harvest-price-item">
            <span class="harvest-price-label">${escapeHTML(targetLabel)}</span>
            <span class="harvest-price-val" style="color:${COLORS.accentGreen};">${escapeHTML(rec.target || '—')}</span>
          </div>
          <div class="harvest-price-item">
            <span class="harvest-price-label">${escapeHTML(stopLabel)}</span>
            <span class="harvest-price-val" style="color:${COLORS.accentRed};">${escapeHTML(rec.stop || '—')}</span>
          </div>
        </div>
        ` : `
        <div class="harvest-rec-alloc">
          <span class="harvest-alloc-label">${escapeHTML(allocLabel)}</span>
          <span class="harvest-alloc-val" style="color:${hBadgeColor};">${escapeHTML(rec.allocation || '—')}</span>
        </div>
        `}
      </div>`;
  }).join('');

  // Scrolling ticker for recommendations
  const tickerItems = recommendations.map(rec => {
    const aColor = actionColor(rec.action);
    return `<span class="harvest-ticker-item">
      <span class="harvest-ticker-asset">${escapeHTML(rec.asset)}</span>
      <span class="harvest-ticker-action" style="color:${aColor};">${escapeHTML(actionLabel(rec.action))}</span>
    </span>`;
  }).join('<span style="color:' + COLORS.accentBlue + ';margin:0 12px;">●</span>');
  const doubledTicker = tickerItems + '<span style="color:' + COLORS.accentBlue + ';margin:0 12px;">●</span>' + tickerItems;

  return `
    <style>
      .harvest-container {
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; position:relative; padding:0;
      }

      /* Scrolling ticker at top of content area */
      .harvest-ticker {
        width:100%; padding:10px 0; overflow:hidden;
        background: linear-gradient(180deg, rgba(12,20,38,0.7) 0%, transparent 100%);
        border-bottom:1px solid ${COLORS.borderBlue};
        opacity:0; transition: opacity 0.6s ease;
      }
      .harvest-ticker.visible { opacity:1; }

      .harvest-ticker-scroll {
        white-space:nowrap; animation: tickerScroll 20s linear infinite;
        padding:0 40px; font-size:14px;
      }
      .harvest-ticker-item { display:inline-flex; align-items:center; gap:6px; margin:0 8px; }
      .harvest-ticker-asset { font-size:14px; font-weight:700; color:${COLORS.textWhite}; }
      .harvest-ticker-action { font-size:13px; font-weight:600; }

      /* Recommendation cards */
      .harvest-recs-wrap {
        width:100%; max-width:1200px;
        display:flex; gap:20px; justify-content:center;
        padding:24px 48px 0; flex:1; align-items:flex-start;
      }

      .harvest-rec-card {
        flex:1; max-width:360px; padding:20px 24px;
        border-radius:16px;
        background: linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgCardLight} 100%);
        border:1px solid ${COLORS.borderBlue};
        opacity:0; transform:translateY(30px);
        transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
      }
      .harvest-rec-card.visible {
        opacity:1; transform:translateY(0);
      }

      .harvest-rec-horizon {
        display:inline-block; padding:4px 14px; border-radius:100px;
        font-size:12px; font-weight:700; letter-spacing:1px; margin-bottom:14px;
      }

      .harvest-rec-body {
        display:flex; align-items:center; gap:10px; margin-bottom:14px;
      }
      .harvest-rec-asset {
        font-size:20px; font-weight:800; color:${COLORS.textWhite};
      }
      .harvest-rec-action {
        font-size:15px; font-weight:700; letter-spacing:0.5px;
      }

      .harvest-rec-prices {
        display:flex; gap:12px;
      }
      .harvest-price-item {
        flex:1; padding:8px 10px; border-radius:8px;
        background:rgba(255,255,255,0.03); text-align:center;
      }
      .harvest-price-label {
        display:block; font-size:10px; color:${COLORS.textDim};
        font-weight:500; letter-spacing:0.5px; margin-bottom:4px;
      }
      .harvest-price-val {
        font-size:14px; font-weight:700; color:${COLORS.textWhite};
      }

      .harvest-rec-alloc {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 14px; border-radius:8px;
        background:rgba(255,255,255,0.03);
      }
      .harvest-alloc-label {
        font-size:13px; color:${COLORS.textDim}; font-weight:500;
      }
      .harvest-alloc-val {
        font-size:20px; font-weight:800;
      }

      /* Brand logo center */
      .harvest-brand-area {
        display:flex; flex-direction:column; align-items:center;
        padding:24px 0; opacity:0; transform:scale(0.8);
        transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1);
      }
      .harvest-brand-area.visible {
        opacity:1; transform:scale(1);
      }

      .harvest-logo-svg {
        width:80px; height:80px; margin-bottom:16px;
      }

      .harvest-tagline {
        font-size:22px; font-weight:700; color:${COLORS.textLight};
        letter-spacing:1px; opacity:0;
        transition: opacity 0.8s ease;
      }
      .harvest-tagline.visible { opacity:1; }

      /* Fade to black overlay */
      .harvest-fade-overlay {
        position:absolute; top:0; left:0; right:0; bottom:0;
        background:black; opacity:0; pointer-events:none; z-index:200;
        transition: opacity 1s ease;
      }
    </style>

    <div class="harvest-container" id="harvest-root">
      <div class="harvest-fade-overlay" id="harvest-fade"></div>

      <!-- Scrolling ticker -->
      <div class="harvest-ticker" id="harvest-ticker">
        <div class="harvest-ticker-scroll">${doubledTicker}</div>
      </div>

      <!-- Recommendation cards -->
      <div class="harvest-recs-wrap">
        ${recCardsHTML}
      </div>

      <!-- Brand logo -->
      <div class="harvest-brand-area" id="harvest-brand">
        <svg class="harvest-logo-svg" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="harvest-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${COLORS.accentBlue};"/>
              <stop offset="100%" style="stop-color:${COLORS.accentCyan};"/>
            </linearGradient>
          </defs>
          <rect width="80" height="80" rx="18" fill="url(#harvest-logo-grad)"/>
          <text x="40" y="52" text-anchor="middle" fill="white" font-size="40" font-weight="900" font-family="Inter,sans-serif">R</text>
        </svg>
        <div class="harvest-tagline" id="harvest-tagline">${escapeHTML(tagline)}</div>
      </div>
    </div>

    <script>
    (function() {
      var ticker = document.getElementById('harvest-ticker');
      var brand = document.getElementById('harvest-brand');
      var tagline = document.getElementById('harvest-tagline');
      var fade = document.getElementById('harvest-fade');
      var recCards = [];

      for (var i = 0; i < ${recommendations.length}; i++) {
        recCards.push(document.getElementById('harvest-rec-' + i));
      }

      var baseSetProgress = window.setAnimationProgress;

      window.setAnimationProgress = function(p) {
        if (baseSetProgress) baseSetProgress(p);

        // Phase 1: Recommendations scroll (0-0.4)
        var recPhase = segmentProgress(p, 0, 0.40);
        if (recPhase > 0) {
          ticker.classList.add('visible');
          // Cards appear one by one
          for (var i = 0; i < recCards.length; i++) {
            var cardStart = 0.05 + i * 0.10;
            var cardEnd = cardStart + 0.15;
            var cardPhase = segmentProgress(p, cardStart, cardEnd);
            if (cardPhase > 0 && recCards[i]) {
              recCards[i].classList.add('visible');
            }
          }
        }

        // Phase 2: Logo appears (0.4-0.6) with pulse
        var logoPhase = segmentProgress(p, 0.40, 0.60);
        if (logoPhase > 0) {
          brand.classList.add('visible');
          // Pulse animation: scale 0.8 → 1.1 → 1.0
          var easedLogo = easeOutCubic(logoPhase);
          var scaleVal;
          if (easedLogo < 0.7) {
            scaleVal = lerp(0.8, 1.1, easedLogo / 0.7);
          } else {
            scaleVal = lerp(1.1, 1.0, (easedLogo - 0.7) / 0.3);
          }
          brand.style.transform = 'scale(' + scaleVal + ')';
        }

        // Phase 3: Tagline fades (0.6-0.8)
        var tagPhase = segmentProgress(p, 0.60, 0.80);
        if (tagPhase > 0) {
          tagline.classList.add('visible');
          tagline.style.opacity = String(easeOutCubic(tagPhase));
        }

        // Phase 4: Fade to black (0.8-1.0)
        var fadePhase = segmentProgress(p, 0.80, 1.0);
        if (fadePhase > 0) {
          fade.style.opacity = String(easeOutCubic(fadePhase));
        }
      };

      function segmentProgress(p, start, end) {
        return Math.max(0, Math.min(1, (p - start) / (end - start)));
      }
      function easeOutCubic(t) {
        var c = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - c, 3);
      }
      function lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
      }
    })();
    </script>
  `;
}

// ─── Main Video Generation Pipeline ──────────────────────────────
async function generateVideo(inputPath, outputPath) {
  const startTime = Date.now();
  console.log('[V5] Starting video generation pipeline...');

  // Step 1: Read & parse input JSON
  console.log('[V5] Step 1: Reading input JSON...');
  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const rawData = JSON.parse(readFileSync(inputPath, 'utf-8'));
  console.log(`[V5] Input data loaded. Title: "${rawData.title || '(no title)'}"`);

  // Step 2: Enhance data with defaults
  console.log('[V5] Step 2: Enhancing data with defaults...');
  const data = enhanceDataWithDefaults(rawData);
  const locale = data.locale || 'ar';

  // Step 3: Generate AI background image
  console.log('[V5] Step 3: Generating AI background image...');
  let backgroundImageB64 = '';
  try {
    const bgPrompt = `Professional financial news background, dark blue theme, abstract data visualization, bloomberg terminal style, ${data.title || 'market analysis'}`;
    const bgTmpPath = join(tmpdir(), `roua-bg-${randomUUID()}.png`);
    const bgResult = spawnSync('z-ai-generate', [
      '--prompt', bgPrompt,
      '--output', bgTmpPath,
      '--width', '1920',
      '--height', '1080',
    ], { encoding: 'utf-8', timeout: 60000 });

    if (bgResult.status === 0 && existsSync(bgTmpPath)) {
      backgroundImageB64 = readFileSync(bgTmpPath, 'base64');
      console.log('[V5] Background image generated successfully.');
      try { unlinkSync(bgTmpPath); } catch {}
    } else {
      console.warn('[V5] Background image generation failed, proceeding without it.');
    }
  } catch (err) {
    console.warn(`[V5] Background image generation error: ${err.message}`);
  }

  // Pass background image to data for use in pulses
  if (backgroundImageB64) {
    data._backgroundImageB64 = backgroundImageB64;
  }

  // Step 4: Build all 9 pulses
  console.log('[V5] Step 4: Building all 9 pulse HTML strings...');
  const pulseGenerators = [
    generateIgnitionPulse,
    generateShockPulse,
    generateRootsPulse,
    generateRacePulse,
    generateHistoryPulse,
    generateAlertPulse,
    generateTakeawayPulse,
    generateDealPulse,
    generateHarvestPulse,
  ];

  const pulses = PULSE_DEFS.map(([name, startSec, endSec, numKeyFrames], idx) => {
    const generator = pulseGenerators[idx];
    if (!generator) {
      throw new Error(`No generator for pulse index ${idx} (${name})`);
    }
    const contentHTML = generator(data);
    const fullHTML = generateBaseHTML(contentHTML, data, idx, name);
    const duration = endSec - startSec;
    return {
      name,
      html: fullHTML,
      duration,
      numKeyFrames,
      startSec,
      endSec,
    };
  });
  console.log(`[V5] Built ${pulses.length} pulses.`);

  // Step 5: Build narration text from all pulse data
  console.log('[V5] Step 5: Building narration text...');
  const narrationParts = [];

  // Pulse 1 narration
  narrationParts.push(data.title || (locale === 'ar' ? 'تقرير اقتصادي عاجل' : 'Breaking Economic Report'));
  if (data.date) narrationParts.push(data.date);

  // Pulse 2 narration
  const stats = data.stats || [];
  if (stats.length > 0) {
    narrationParts.push(stats.map(s => `${s.label}: ${s.value}`).join('. '));
  }

  // Pulse 3 narration
  const rootCauses = data.root_causes || [];
  if (rootCauses.length > 0) {
    narrationParts.push(
      (locale === 'ar' ? 'الأسباب الجذرية: ' : 'Root causes: ') +
      rootCauses.map(r => r.title).join(', ')
    );
  }

  // Pulse 4 narration - indicators/race
  if (data.key_points && data.key_points.length > 0) {
    narrationParts.push(data.key_points.slice(0, 3).join('. '));
  }

  // Pulse 5 narration
  const parallels = data.historical_parallels || [];
  if (parallels.length > 0) {
    narrationParts.push(
      (locale === 'ar' ? 'أحداث مشابهة: ' : 'Similar events: ') +
      parallels.map(p => `${p.year} - ${p.title}`).join(', ')
    );
  }

  // Pulse 6 narration
  const scenarios = data.scenarios || [];
  if (scenarios.length > 0) {
    narrationParts.push(
      (locale === 'ar' ? 'السيناريوهات: ' : 'Scenarios: ') +
      scenarios.map(s => `${s.title} ${s.probability}`).join(', ')
    );
  }

  // Pulse 7 narration
  const takeaways = data.strategic_takeaways || [];
  if (takeaways.length > 0) {
    narrationParts.push(
      (locale === 'ar' ? 'الخلاصة: ' : 'Takeaways: ') +
      takeaways.map(t => t.title).join(', ')
    );
  }

  // Pulse 8 narration
  const benAssets = data.benefiting_assets || [];
  const harmAssets = data.harmed_assets || [];
  if (benAssets.length > 0 || harmAssets.length > 0) {
    const benNames = benAssets.map(a => a.name).join(', ');
    const harmNames = harmAssets.map(a => a.name).join(', ');
    narrationParts.push(
      (locale === 'ar' ? `أصول مستفيدة: ${benNames}. أصول متضررة: ${harmNames}` :
        `Benefiting: ${benNames}. Harmed: ${harmNames}`)
    );
  }

  // Pulse 9 narration
  const recs = data.recommendations || [];
  if (recs.length > 0) {
    narrationParts.push(
      (locale === 'ar' ? 'التوصيات: ' : 'Recommendations: ') +
      recs.map(r => `${r.asset} - ${r.action}`).join(', ')
    );
  }

  const narrationText = narrationParts.filter(Boolean).join('. ');
  console.log(`[V5] Narration text length: ${narrationText.length} chars`);

  // Step 6: Generate voiceover with edge-tts
  console.log('[V5] Step 6: Generating voiceover...');
  const tmpDir = join(tmpdir(), `roua-v5-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  const audioPath = join(tmpDir, 'voiceover.mp3');
  let audioDuration = 0;

  const ttsSuccess = generateVoiceover(narrationText, audioPath, locale);
  if (ttsSuccess) {
    audioDuration = getAudioDuration(audioPath);
    console.log(`[V5] Voiceover generated. Duration: ${audioDuration.toFixed(2)}s`);
  } else {
    console.warn('[V5] Voiceover generation failed. Proceeding without audio.');
  }

  // Step 7: Sync audio/video durations
  console.log('[V5] Step 7: Syncing audio/video durations...');
  const totalVideoDuration = PULSE_DEFS[PULSE_DEFS.length - 1][2]; // 120s
  let finalDuration = totalVideoDuration;

  if (audioDuration > 0 && audioDuration < totalVideoDuration * 1.5) {
    // If audio is significantly shorter, we could adjust pulse durations
    // For now, keep the defined durations and pad audio or trim
    finalDuration = totalVideoDuration;
    console.log(`[V5] Video duration: ${finalDuration}s, Audio duration: ${audioDuration.toFixed(2)}s`);
  } else if (audioDuration > totalVideoDuration * 1.5) {
    // Audio too long — cap at video duration
    console.log(`[V5] Audio longer than video. Capping at ${totalVideoDuration}s.`);
  }

  // Step 8: Launch Playwright Chromium
  console.log('[V5] Step 8: Launching Playwright Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const framesDir = join(tmpDir, 'frames');
  mkdirSync(framesDir, { recursive: true });

  // Step 9: Frame capture - for each pulse
  console.log('[V5] Step 9: Capturing frames...');
  const allFramePaths = [];
  const allFrameDurations = [];

  for (let pulseIdx = 0; pulseIdx < pulses.length; pulseIdx++) {
    const pulse = pulses[pulseIdx];
    console.log(`[V5]   Pulse ${pulseIdx + 1}/9: ${pulse.name} (${pulse.numKeyFrames} key frames, ${pulse.duration}s)`);

    // a. Set page content
    await page.setContent(pulse.html, { waitUntil: 'domcontentloaded' });

    // b. Wait for rendering to stabilize
    await page.waitForTimeout(500);

    // c. For each key frame
    const frameDuration = pulse.duration / pulse.numKeyFrames;
    for (let kf = 0; kf < pulse.numKeyFrames; kf++) {
      const progress = pulse.numKeyFrames > 1 ? kf / (pulse.numKeyFrames - 1) : 1;

      // Advance animation
      await page.evaluate((p) => window.setAnimationProgress(p), progress);

      // Small delay for rendering
      await page.waitForTimeout(50);

      // Screenshot
      const framePath = join(framesDir, `pulse${pulseIdx}_frame${String(kf).padStart(4, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });

      allFramePaths.push(framePath);
      allFrameDurations.push(frameDuration);
    }
  }

  console.log(`[V5] Captured ${allFramePaths.length} total frames.`);

  // Close browser
  await browser.close();
  console.log('[V5] Browser closed.');

  // Step 10: Compose video with FFmpeg
  console.log('[V5] Step 10: Composing video with FFmpeg...');

  // Create concat demuxer file
  const concatFilePath = join(tmpDir, 'concat.txt');
  let concatContent = '';
  for (let i = 0; i < allFramePaths.length; i++) {
    const duration = allFrameDurations[i];
    concatContent += `file '${allFramePaths[i]}'\n`;
    concatContent += `duration ${duration}\n`;
  }
  // Last frame needs to be repeated for proper concat
  if (allFramePaths.length > 0) {
    concatContent += `file '${allFramePaths[allFramePaths.length - 1]}'\n`;
  }
  writeFileSync(concatFilePath, concatContent, 'utf-8');

  // Build FFmpeg command
  const videoOnlyPath = join(tmpDir, 'video_only.mp4');

  // Create video from frames using concat demuxer
  const ffmpegVideoArgs = [
    '-y',
    '-f', 'concat', '-safe', '0', '-i', concatFilePath,
    '-vsync', 'vfr',
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    videoOnlyPath,
  ];

  console.log('[V5] Running FFmpeg video-only pass...');
  const videoResult = spawnSync('ffmpeg', ffmpegVideoArgs, {
    encoding: 'utf-8',
    timeout: 300000,
    maxBuffer: 50 * 1024 * 1024,
  });

  if (videoResult.status !== 0) {
    console.error(`[V5] FFmpeg video pass error: ${videoResult.stderr?.slice(-500)}`);
    throw new Error('FFmpeg video-only pass failed');
  }
  console.log('[V5] Video-only pass complete.');

  // Combine video + audio if audio exists
  if (ttsSuccess && existsSync(audioPath)) {
    console.log('[V5] Merging audio with video...');
    const mergeArgs = [
      '-y',
      '-i', videoOnlyPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outputPath,
    ];

    const mergeResult = spawnSync('ffmpeg', mergeArgs, {
      encoding: 'utf-8',
      timeout: 300000,
      maxBuffer: 50 * 1024 * 1024,
    });

    if (mergeResult.status !== 0) {
      console.error(`[V5] FFmpeg merge error: ${mergeResult.stderr?.slice(-500)}`);
      // Fall back to video-only
      console.log('[V5] Falling back to video-only output.');
      const cpResult = spawnSync('cp', [videoOnlyPath, outputPath]);
      if (cpResult.status !== 0) {
        throw new Error('Failed to copy video-only output');
      }
    }
  } else {
    // No audio — just copy video
    console.log('[V5] No audio. Copying video-only output.');
    const cpResult = spawnSync('cp', [videoOnlyPath, outputPath]);
    if (cpResult.status !== 0) {
      throw new Error('Failed to copy video-only output');
    }
  }

  // Step 11: Verify output, cleanup temp files
  console.log('[V5] Step 11: Verifying output...');
  if (!existsSync(outputPath)) {
    throw new Error('Output file was not created');
  }

  // Get output file size
  const outputStat = spawnSync('stat', ['-c', '%s', outputPath], { encoding: 'utf-8' });
  const outputSize = parseInt(outputStat.stdout.trim(), 10) || 0;
  const outputSizeMB = (outputSize / (1024 * 1024)).toFixed(2);

  // Get output duration
  const outputDuration = getAudioDuration(outputPath) || getAudioDuration(videoOnlyPath) || finalDuration;

  console.log(`[V5] Output: ${outputPath} (${outputSizeMB} MB, ${outputDuration.toFixed(2)}s)`);

  // Cleanup temp files
  console.log('[V5] Cleaning up temp files...');
  try {
    // Remove frames directory
    const frameFiles = readdirSync(framesDir);
    for (const f of frameFiles) {
      try { unlinkSync(join(framesDir, f)); } catch {}
    }
    try { unlinkSync(concatFilePath); } catch {}
    try { unlinkSync(videoOnlyPath); } catch {}
    try { unlinkSync(audioPath); } catch {}
    try { unlinkSync(join(tmpDir, 'voiceover_text.txt')); } catch {}
    // Try to remove tmp dir (may fail if not empty)
    try { unlinkSync(framesDir); } catch {}
    try { unlinkSync(tmpDir); } catch {}
  } catch (err) {
    console.warn(`[V5] Cleanup warning: ${err.message}`);
  }

  // Step 12: Return result JSON
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const result = {
    success: true,
    output: outputPath,
    duration: outputDuration,
    size_bytes: outputSize,
    size_mb: parseFloat(outputSizeMB),
    frame_count: allFramePaths.length,
    pulse_count: pulses.length,
    audio_duration: audioDuration,
    generation_time_seconds: parseFloat(elapsed),
    locale: locale,
  };

  console.log(`[V5] Video generation complete in ${elapsed}s. ${allFramePaths.length} frames, ${pulses.length} pulses.`);
  return result;
}

// ─── CLI Entry Point ─────────────────────────────────────────────
async function main() {
  const args = parseArgs();
  const inputPath = args.input;
  const outputPath = args.output;

  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/video-renderer-v5.mjs --input <data.json> --output <video.mp4>');
    process.exit(1);
  }

  try {
    const result = await generateVideo(inputPath, outputPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`[V5] Fatal error: ${err.message}`);
    console.error(err.stack);
    const errorResult = {
      success: false,
      error: err.message,
    };
    console.log(JSON.stringify(errorResult, null, 2));
    process.exit(1);
  }
}

// Run if executed directly
main();

export {
  WIDTH, HEIGHT, FPS, COLORS, TICKER_HEIGHT, NEWSBAR_HEIGHT, CONTENT_HEIGHT,
  PULSE_DEFS, AR_NUMERALS,
  parseArgs, getImpactColor, getImpactLabel, getImpactArrow,
  formatNumber, escapeHTML, lerp, easeOutCubic, easeInOutCubic,
  easeOutElastic, clamp, segmentProgress, hexToRgba, toArabicNumeral,
  generateVoiceover, getAudioDuration,
  enhanceDataWithDefaults, generateDefaultRootCauses,
  generateDefaultHistoricalParallels, generateDefaultStrategicTakeaways,
  generateBaseHTML, generateTickerBar, generateNewsBar,
  generateIgnitionPulse, generateShockPulse, generateRootsPulse,
  generateRacePulse, generateHistoryPulse,
  generateAlertPulse, generateTakeawayPulse, generateDealPulse,
  generateHarvestPulse,
  generateVideo, main,
};
