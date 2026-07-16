#!/usr/bin/env node
// ─── Financial Chart Capture Utility ──────────────────────
// Renders professional financial charts using TradingView Lightweight Charts
// in a headless browser via Playwright, then captures screenshots
//
// Supports:
//   - Candlestick charts with volume
//   - RSI, MACD, Bollinger Bands overlays
//   - Support/Resistance levels
//   - Dark theme matching video renderer style
//
// Usage:
//   node scripts/chart-capture.mjs --symbol EURUSD --output ./chart.png --width 1280 --height 720

import { chromium } from 'playwright';
import { writeFileSync, existsSync } from 'fs';

const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultVal;
}

const symbol = getArg('symbol', 'EURUSD');
const outputPath = getArg('output', './chart-capture.png');
const width = parseInt(getArg('width', '1280'));
const height = parseInt(getArg('height', '720'));
const darkTheme = getArg('dark', 'true') === 'true';

// Generate realistic OHLCV data for the chart
function generateOHLCVData(days = 90) {
  const data = [];
  let basePrice;
  const symbolMap = {
    'EURUSD': 1.0845, 'XAU': 2035.40, 'SPX': 5320.15,
    'DXY': 104.20, 'CL': 78.50, 'BTC': 74220,
    'AAPL': 195, 'TSLA': 245, 'MSFT': 420, 'GOOGL': 175,
  };
  basePrice = symbolMap[symbol] || 100;
  
  const now = Date.now();
  const dayMs = 86400000;
  let price = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const time = Math.floor((now - i * dayMs) / 1000);
    const volatility = basePrice * 0.015;
    const open = price;
    const change = (Math.random() - 0.48) * volatility; // slight upward bias
    const high = open + Math.abs(change) + Math.random() * volatility * 0.5;
    const low = open - Math.abs(change) - Math.random() * volatility * 0.5;
    const close = open + change;
    const volume = Math.floor(50000 + Math.random() * 200000);
    
    data.push({ time, open: +open.toFixed(4), high: +high.toFixed(4), low: +low.toFixed(4), close: +close.toFixed(4), volume });
    price = close;
  }
  return data;
}

// Calculate RSI
function calculateRSI(closes, period = 14) {
  const rsiValues = [];
  let gains = 0, losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const diff = closes[i] - closes[i - 1];
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push({ time: 0, value: +(100 - 100 / (1 + rs)).toFixed(2) });
  }
  return rsiValues;
}

// Calculate MACD
function calculateMACD(closes) {
  function ema(data, period) {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  }
  
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => +(v - ema26[i]).toFixed(6));
  const signalLine = ema(macdLine, 9);
  const histogram = macdLine.map((v, i) => +(v - signalLine[i]).toFixed(6));
  
  return { macdLine, signalLine: signalLine.map(v => +v.toFixed(6)), histogram };
}

async function captureChart() {
  console.log(`[ChartCapture] Generating chart for ${symbol}...`);
  
  const ohlcv = generateOHLCVData(90);
  const closes = ohlcv.map(d => d.close);
  const rsiData = calculateRSI(closes);
  
  // Match RSI times with OHLCV data
  for (let i = 0; i < rsiData.length; i++) {
    rsiData[i].time = ohlcv[i + (ohlcv.length - rsiData.length)].time;
  }
  
  const macdResult = calculateMACD(closes);
  
  // Calculate support/resistance levels
  const recentLow = Math.min(...closes.slice(-30));
  const recentHigh = Math.max(...closes.slice(-30));
  const support = +recentLow.toFixed(4);
  const resistance = +recentHigh.toFixed(4);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate Bollinger Bands
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const stdDev = Math.sqrt(closes.slice(-20).reduce((a, b) => a + (b - sma20) ** 2, 0) / 20);
  const bbUpper = +(sma20 + 2 * stdDev).toFixed(4);
  const bbLower = +(sma20 - 2 * stdDev).toFixed(4);
  
  // Build chart HTML with Lightweight Charts
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: ${darkTheme ? '#0a0e1a' : '#ffffff'}; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }
    #main-chart { width: ${width}px; height: ${Math.floor(height * 0.65)}px; }
    #rsi-chart { width: ${width}px; height: ${Math.floor(height * 0.25)}px; }
    .chart-label {
      position: absolute; top: 8px; left: 12px; z-index: 10;
      color: ${darkTheme ? '#94a3b8' : '#475569'}; font-size: 11px; font-weight: 600;
      background: ${darkTheme ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)'};
      padding: 2px 8px; border-radius: 4px;
    }
    .price-info {
      position: absolute; top: 8px; right: 12px; z-index: 10;
      color: ${darkTheme ? '#e2e8f0' : '#1e293b'}; font-size: 12px; text-align: right;
      background: ${darkTheme ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)'};
      padding: 4px 10px; border-radius: 4px;
    }
    .price-info .price { font-size: 18px; font-weight: 700; }
    .price-info .change { font-size: 11px; }
    .up { color: #22c55e; }
    .down { color: #ef4444; }
    .indicators-bar {
      position: absolute; bottom: 0; left: 0; right: 0; height: ${Math.floor(height * 0.1)}px;
      background: ${darkTheme ? '#0f172a' : '#f8fafc'};
      border-top: 1px solid ${darkTheme ? '#1e293b' : '#e2e8f0'};
      display: flex; align-items: center; justify-content: space-around;
      padding: 0 20px; font-size: 10px;
      color: ${darkTheme ? '#94a3b8' : '#475569'};
    }
    .ind-item { text-align: center; }
    .ind-item .ind-value { font-weight: 700; font-size: 12px; }
  </style>
  <script src="https://unpkg.com/lightweight-charts@5.0.2/dist/lightweight-charts.standalone.production.js"></script>
</head>
<body>
  <div style="position: relative;">
    <div class="chart-label">${symbol} — شموع يابانية</div>
    <div class="price-info">
      <div class="price ${currentPrice >= ohlcv[ohlcv.length - 2].close ? 'up' : 'down'}">${currentPrice.toFixed(symbol === 'BTC' ? 0 : symbol === 'DXY' ? 2 : 4)}</div>
      <div class="change ${currentPrice >= ohlcv[ohlcv.length - 2].close ? 'up' : 'down'}">
        ${currentPrice >= ohlcv[ohlcv.length - 2].close ? '▲' : '▼'} 
        ${Math.abs(((currentPrice - ohlcv[ohlcv.length - 2].close) / ohlcv[ohlcv.length - 2].close) * 100).toFixed(2)}%
      </div>
    </div>
    <div id="main-chart"></div>
  </div>
  <div style="position: relative;">
    <div class="chart-label">RSI (14)</div>
    <div id="rsi-chart"></div>
  </div>
  <div class="indicators-bar">
    <div class="ind-item">
      <div>RSI</div>
      <div class="ind-value ${rsiData[rsiData.length - 1]?.value > 70 ? 'down' : rsiData[rsiData.length - 1]?.value < 30 ? 'up' : ''}">${rsiData[rsiData.length - 1]?.value || '—'}</div>
    </div>
    <div class="ind-item">
      <div>MACD</div>
      <div class="ind-value ${macdResult.histogram[macdResult.histogram.length - 1] > 0 ? 'up' : 'down'}">${macdResult.macdLine[macdResult.macdLine.length - 1]?.toFixed(4) || '—'}</div>
    </div>
    <div class="ind-item">
      <div>دعم</div>
      <div class="ind-value up">${support}</div>
    </div>
    <div class="ind-item">
      <div>مقاومة</div>
      <div class="ind-value down">${resistance}</div>
    </div>
    <div class="ind-item">
      <div>بولينجر</div>
      <div class="ind-value">${bbUpper} / ${bbLower}</div>
    </div>
  </div>

  <script>
    const chartOptions = {
      layout: { 
        background: { type: 'solid', color: '${darkTheme ? '#0a0e1a' : '#ffffff'}' },
        textColor: '${darkTheme ? '#94a3b8' : '#475569'}',
      },
      grid: {
        vertLines: { color: '${darkTheme ? '#1e293b' : '#f1f5f9'}' },
        horzLines: { color: '${darkTheme ? '#1e293b' : '#f1f5f9'}' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '${darkTheme ? '#1e293b' : '#e2e8f0'}' },
      timeScale: { borderColor: '${darkTheme ? '#1e293b' : '#e2e8f0'}', timeVisible: false },
    };

    // Main chart
    const chart = LightweightCharts.createChart(document.getElementById('main-chart'), chartOptions);
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });
    candleSeries.setData(${JSON.stringify(ohlcv)});

    // Volume
    const volumeSeries = chart.addHistogramSeries({
      color: '#3b82f6', priceFormat: { type: 'volume' },
      priceScaleId: '', scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(${JSON.stringify(ohlcv.map(d => ({
      time: d.time, value: d.volume,
      color: d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
    })))});

    // Support/Resistance lines
    candleSeries.createPriceLine({ price: ${support}, color: '#22c55e', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'دعم' });
    candleSeries.createPriceLine({ price: ${resistance}, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'مقاومة' });

    // Bollinger Bands
    const bbData = ${JSON.stringify(ohlcv.map((d, i, arr) => {
      if (i < 19) return null;
      const slice = arr.slice(i - 19, i + 1).map(x => x.close);
      const sma = slice.reduce((a, b) => a + b, 0) / 20;
      const std = Math.sqrt(slice.reduce((a, b) => a + (b - sma) ** 2, 0) / 20);
      return { time: d.time, upper: +(sma + 2 * std).toFixed(4), middle: +sma.toFixed(4), lower: +(sma - 2 * std).toFixed(4) };
    }).filter(Boolean))};

    if (bbData.length > 0) {
      const bbUpperSeries = chart.addLineSeries({ color: 'rgba(139,92,246,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      bbUpperSeries.setData(bbData.map(d => ({ time: d.time, value: d.upper })));
      const bbLowerSeries = chart.addLineSeries({ color: 'rgba(139,92,246,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      bbLowerSeries.setData(bbData.map(d => ({ time: d.time, value: d.lower })));
    }

    // RSI chart
    const rsiChart = LightweightCharts.createChart(document.getElementById('rsi-chart'), {
      ...chartOptions,
      rightPriceScale: { ...chartOptions.rightPriceScale, scaleMargins: { top: 0.1, bottom: 0.1 } },
    });
    const rsiSeries = rsiChart.addLineSeries({ color: '#a78bfa', lineWidth: 2, priceLineVisible: false });
    rsiSeries.setData(${JSON.stringify(rsiData)});
    rsiSeries.createPriceLine({ price: 70, color: 'rgba(239,68,68,0.5)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'تشبع' });
    rsiSeries.createPriceLine({ price: 30, color: 'rgba(34,197,94,0.5)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'تشبع بيعي' });

    chart.timeScale().fitContent();
    rsiChart.timeScale().fitContent();

    // Signal that chart is ready for screenshot
    window.__chartReady = true;
  </script>
</body>
</html>`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width, height } });
    
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    // Wait for Lightweight Charts script to load and render
    await page.waitForTimeout(5000); // Wait for CDN script to load
    
    // Check if the chart library loaded
    const chartLoaded = await page.evaluate(() => {
      return typeof window.LightweightCharts !== 'undefined';
    });
    
    if (!chartLoaded) {
      console.log('[ChartCapture] LightweightCharts not loaded from CDN, trying alternative...');
      // Try loading from another CDN
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/lightweight-charts@5.0.2/dist/lightweight-charts.standalone.production.js';
        document.head.appendChild(script);
      });
      await page.waitForTimeout(5000);
    }
    
    // Try rendering chart manually if needed
    const chartReady = await page.evaluate(() => window.__chartReady === true).catch(() => false);
    if (!chartReady) {
      console.log('[ChartCapture] Chart not auto-rendered, forcing render...');
      await page.evaluate(() => {
        if (typeof LightweightCharts !== 'undefined' && document.getElementById('main-chart')) {
          try {
            const chartOptions = {
              layout: { background: { type: 'solid', color: '#0a0e1a' }, textColor: '#94a3b8' },
              grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
              rightPriceScale: { borderColor: '#1e293b' },
              timeScale: { borderColor: '#1e293b', timeVisible: false },
            };
            const chart = LightweightCharts.createChart(document.getElementById('main-chart'), chartOptions);
            const candleSeries = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', borderUpColor: '#22c55e', borderDownColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444' });
            // Sample data
            const sampleData = [];
            let price = 1.0845;
            const now = Math.floor(Date.now() / 1000);
            for (let i = 90; i >= 0; i--) {
              const time = now - i * 86400;
              const o = price;
              const c = o + (Math.random() - 0.48) * 0.015;
              const h = Math.max(o, c) + Math.random() * 0.005;
              const l = Math.min(o, c) - Math.random() * 0.005;
              sampleData.push({ time, open: +o.toFixed(5), high: +h.toFixed(5), low: +l.toFixed(5), close: +c.toFixed(5) });
              price = c;
            }
            candleSeries.setData(sampleData);
            chart.timeScale().fitContent();
            
            // RSI chart
            if (document.getElementById('rsi-chart')) {
              const rsiChart = LightweightCharts.createChart(document.getElementById('rsi-chart'), chartOptions);
              const rsiSeries = rsiChart.addLineSeries({ color: '#a78bfa', lineWidth: 2 });
              const rsiData = [];
              for (let i = 30; i < 91; i++) {
                rsiData.push({ time: sampleData[i].time, value: 30 + Math.random() * 40 });
              }
              rsiSeries.setData(rsiData);
              rsiChart.timeScale().fitContent();
            }
          } catch (e) { console.error('Chart render error:', e); }
        }
        window.__chartReady = true;
      });
    }
    
    await page.waitForTimeout(3000); // Extra wait for rendering
    
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`[ChartCapture] Chart saved to ${outputPath} (${width}x${height})`);
    
  } catch (err) {
    console.error(`[ChartCapture] Error: ${err.message}`);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}

captureChart().catch(err => {
  console.error('[ChartCapture] Fatal error:', err);
  process.exit(1);
});
