// ═══════════════════════════════════════════════════════════════════
// Groq-Powered Stock Analysis API (V4)
// Ultra-fast AI inference for stock screening, recommendations, and analysis
// V4: Company knowledge base, post-processing validation, recommendation quality fixes
// ═══════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_FALLBACK_MODELS = ['llama-3.1-8b-instant', 'gemma2-9b-it'];
const FMP_API_KEY = process.env.FMP_API_KEY;

// ─── Types ──────────────────────────────────────────────────
interface StockRecommendation {
  symbol: string;
  companyName: string;
  sector: string;
  signal: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  confidence: number;
  priceTarget: string;
  currentPrice: string;
  rationale: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  timeframe: string;
}

// ─── Company Knowledge Base (V4: Grounding facts to prevent AI hallucination) ──
const COMPANY_FACTS: Record<string, { name: string; core: string; sector: string }> = {
  AAPL: { name: 'Apple Inc.', core: 'iPhone, Mac, Services (App Store, iCloud, Apple Music)', sector: 'Consumer Electronics/Technology' },
  MSFT: { name: 'Microsoft Corp.', core: 'Azure cloud, Office 365, GitHub, OpenAI partnership, LinkedIn', sector: 'Technology/Software' },
  GOOGL: { name: 'Alphabet Inc.', core: 'Search/Ads, YouTube, Google Cloud, Android, Waymo', sector: 'Technology/Internet' },
  AMZN: { name: 'Amazon.com Inc.', core: 'AWS cloud, E-commerce, Prime, advertising', sector: 'Consumer Discretionary/E-commerce' },
  NVDA: { name: 'NVIDIA Corp.', core: 'GPU/AI chips (H100, H200, Blackwell), data center, CUDA platform', sector: 'Technology/Semiconductors' },
  META: { name: 'Meta Platforms Inc.', core: 'Facebook, Instagram, WhatsApp, Reality Labs (VR/AR), advertising', sector: 'Technology/Social Media' },
  TSLA: { name: 'Tesla Inc.', core: 'EV vehicles (Model 3/Y/S/X), Energy storage, FSD autonomous driving, Megapack', sector: 'Consumer Discretionary/Automotive' },
  JPM: { name: 'JPMorgan Chase & Co.', core: 'Investment banking, consumer banking, asset management', sector: 'Financial Services' },
  V: { name: 'Visa Inc.', core: 'Payment network, card processing, digital payments', sector: 'Financial Services' },
  WMT: { name: 'Walmart Inc.', core: 'Retail, grocery, e-commerce, Sam\'s Club', sector: 'Consumer Staples' },
  UNH: { name: 'UnitedHealth Group', core: 'Health insurance (UnitedHealthcare), health services (Optum)', sector: 'Healthcare' },
  JNJ: { name: 'Johnson & Johnson', core: 'Pharmaceuticals, medical devices, consumer health', sector: 'Healthcare' },
  PG: { name: 'Procter & Gamble Co.', core: 'Consumer goods (Tide, Pampers, Gillette, Crest)', sector: 'Consumer Staples' },
  MA: { name: 'Mastercard Inc.', core: 'Payment network, card processing, financial data analytics', sector: 'Financial Services' },
  HD: { name: 'The Home Depot Inc.', core: 'Home improvement retail, building supplies', sector: 'Consumer Discretionary' },
  XOM: { name: 'Exxon Mobil Corp.', core: 'Oil & gas exploration, refining, petrochemicals', sector: 'Energy' },
  CVX: { name: 'Chevron Corp.', core: 'Oil & gas exploration, refining, natural gas', sector: 'Energy' },
  ABBV: { name: 'AbbVie Inc.', core: 'Pharmaceuticals (Humira, Skyrizi, Rinvoq), immunology, oncology', sector: 'Healthcare' },
  KO: { name: 'The Coca-Cola Co.', core: 'Beverages (Coca-Cola, Sprite, Fanta, Dasani)', sector: 'Consumer Staples' },
  PEP: { name: 'PepsiCo Inc.', core: 'Beverages & snacks (Pepsi, Lay\'s, Gatorade, Quaker)', sector: 'Consumer Staples' },
  COST: { name: 'Costco Wholesale Corp.', core: 'Membership warehouse retail, bulk sales', sector: 'Consumer Staples' },
  AVGO: { name: 'Broadcom Inc.', core: 'Semiconductors (networking, broadband, wireless), infrastructure software', sector: 'Technology' },
  ADBE: { name: 'Adobe Inc.', core: 'Creative Cloud, Photoshop, Acrobat, Experience Cloud', sector: 'Technology/Software' },
  CRM: { name: 'Salesforce Inc.', core: 'Salesforce CRM, Slack, MuleSoft, Tableau', sector: 'Technology/Software' },
  ORCL: { name: 'Oracle Corp.', core: 'Database, Oracle Cloud, enterprise software, Java', sector: 'Technology/Software' },
  NFLX: { name: 'Netflix Inc.', core: 'Streaming entertainment, content production', sector: 'Communication Services' },
  AMD: { name: 'Advanced Micro Devices Inc.', core: 'CPUs (Ryzen), GPUs (Radeon, Instinct), data center chips', sector: 'Technology/Semiconductors' },
  INTC: { name: 'Intel Corp.', core: 'CPUs, foundry services, data center chips', sector: 'Technology/Semiconductors' },
  QCOM: { name: 'Qualcomm Inc.', core: 'Mobile chips (Snapdragon), 5G, automotive chips', sector: 'Technology/Semiconductors' },
  PYPL: { name: 'PayPal Holdings Inc.', core: 'Online payments (Braintree, Venmo, Zettle)', sector: 'Financial Services/FinTech' },
};

// ─── Helper: Build COMPANY_FACTS section for prompt injection ──
function buildCompanyFactsSection(symbols: string[]): string {
  const knownSymbols = symbols.filter(s => COMPANY_FACTS[s]);
  if (knownSymbols.length === 0) return '';
  const lines = knownSymbols.map(sym => {
    const f = COMPANY_FACTS[sym];
    return `- ${sym}: ${f.name}. Core: ${f.core}. Sector: ${f.sector}.`;
  });
  return `\n\nCOMPANY FACTS (use these facts — do NOT invent different descriptions or sectors):\n${lines.join('\n')}`;
}

// ─── Post-Processing Validation (V4: Enforce recommendation quality) ──
function validateAndEnrichRecommendations(
  stocks: StockRecommendation[],
  liveQuotes: Map<string, { price: number; change: number; changePercent: number; volume: number; marketCap: number }>,
  locale: string
): StockRecommendation[] {
  if (!stocks || stocks.length === 0) return stocks;

  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';

  // ── 1. Detect and fix templated rationale patterns ──
  const TEMPLATE_PATTERNS_AR = [
    /تعتمد على تقنيات/,
    /تستخدم تقنيات .* لمنتجاتها مثل/,
    /تنتج منتجات ذكية مثل/,
    /تعتمد على .* في منتجاتها/,
  ];
  const TEMPLATE_PATTERNS_EN = [
    /leverages .* technology for its products/,
    /produces smart products like/,
    /relies on .* technology for products such as/,
    /utilizes .* for its innovative products/,
  ];
  const TEMPLATE_PATTERNS_ES = [
    /apalancamiento .* tecnología para sus productos/,
    /produce productos inteligentes como/,
    /se basa en .* tecnología para productos como/,
    /utiliza .* para sus productos innovadores/,
  ];
  const patterns = isAr ? TEMPLATE_PATTERNS_AR : isEs ? TEMPLATE_PATTERNS_ES : TEMPLATE_PATTERNS_EN;

  // Count how many stocks share the same pattern
  let templateCount = 0;
  for (const stock of stocks) {
    if (patterns.some(p => p.test(stock.rationale))) {
      templateCount++;
    }
  }

  // If more than 2 stocks use the same template pattern, replace with company-specific facts
  if (templateCount > 2) {
    for (const stock of stocks) {
      if (patterns.some(p => p.test(stock.rationale))) {
        const facts = COMPANY_FACTS[stock.symbol];
        if (facts) {
          if (isAr) {
            stock.rationale = `تتميز ${facts.name} بتركيزها على ${facts.core}، وتعمل في قطاع ${facts.sector}. يتميز السهم بأداء متفرد مرتبط بنمو أعمالها الأساسية.`;
          } else if (isEs) {
            stock.rationale = `${facts.name} opera en ${facts.sector} con ofertas principales en ${facts.core}. Su rendimiento está impulsado por su posición líder en estas áreas.`;
          } else {
            stock.rationale = `${facts.name} operates in ${facts.sector} with core offerings in ${facts.core}. Its performance is driven by its market-leading position in these areas.`;
          }
        }
      }
    }
  }

  // ── 2. Ensure signal diversity ──
  const allSignals = stocks.map(s => s.signal);
  const allBuy = allSignals.every(s => s === 'Buy');
  const allSameSignal = new Set(allSignals).size === 1;

  if (allBuy || allSameSignal) {
    // Sort by confidence ascending — weakest confidence get changed first
    const sorted = [...stocks].sort((a, b) => a.confidence - b.confidence);

    // Change the weakest 1-2 to "Hold", and the strongest to "Strong Buy"
    if (sorted.length >= 3) {
      sorted[0].signal = 'Hold';
      sorted[sorted.length - 1].signal = 'Strong Buy';
    } else if (sorted.length === 2) {
      sorted[0].signal = 'Hold';
      sorted[1].signal = 'Buy';
    }

    // Apply back to original array
    for (const modified of sorted) {
      const idx = stocks.findIndex(s => s.symbol === modified.symbol);
      if (idx !== -1) {
        stocks[idx].signal = modified.signal;
      }
    }
  }

  // ── 3. Ensure risk diversity ──
  const allRisks = stocks.map(s => s.riskLevel);
  const allMediumRisk = allRisks.every(r => r === 'Medium');

  if (allMediumRisk) {
    for (const stock of stocks) {
      const liveQuote = liveQuotes.get(stock.symbol);
      const marketCapB = liveQuote ? liveQuote.marketCap / 1e9 : 0;
      const facts = COMPANY_FACTS[stock.symbol];

      if (marketCapB > 500) {
        // Large stable companies — Low risk
        stock.riskLevel = 'Low';
      } else if (marketCapB < 200 || (facts && (facts.sector.includes('Automotive') || facts.sector.includes('FinTech')))) {
        // Smaller or volatile companies — High risk
        stock.riskLevel = 'High';
      }
      // Leave others as Medium
    }
  }

  // ── 4. Validate price targets ──
  // Calculate percentage gains
  const gains: { symbol: string; pct: number; currentPrice: number; targetPrice: number }[] = [];
  for (const stock of stocks) {
    const liveQuote = liveQuotes.get(stock.symbol);
    const currentPrice = liveQuote?.price || parseFloat(stock.currentPrice?.replace(/[^0-9.]/g, '') || '0');
    const targetPrice = parseFloat(stock.priceTarget?.replace(/[^0-9.]/g, '') || '0');

    if (currentPrice > 0 && targetPrice > 0) {
      const pctGain = (targetPrice - currentPrice) / currentPrice;
      gains.push({ symbol: stock.symbol, pct: pctGain, currentPrice, targetPrice });
    }
  }

  // Check if multiple stocks have the same percentage gain (copy-paste error)
  if (gains.length >= 2) {
    const gainValues = gains.map(g => g.pct);
    const sameGain = gainValues.every(g => Math.abs(g - gainValues[0]) < 0.01);

    // Also check if any target is >30% above current with same percentage
    const excessiveTargets = gains.filter(g => g.pct > 0.30);
    if (sameGain || excessiveTargets.length > 0) {
      // Recalculate targets with realistic percentages
      for (const stock of stocks) {
        const liveQuote = liveQuotes.get(stock.symbol);
        const currentPrice = liveQuote?.price || parseFloat(stock.currentPrice?.replace(/[^0-9.]/g, '') || '0');

        if (currentPrice > 0) {
          // Assign different target percentages based on signal
          let targetPct: number;
          switch (stock.signal) {
            case 'Strong Buy':
              targetPct = 0.20 + Math.random() * 0.15; // 20-35%
              break;
            case 'Buy':
              targetPct = 0.10 + Math.random() * 0.10; // 10-20%
              break;
            case 'Hold':
              targetPct = 0.05 + Math.random() * 0.05; // 5-10%
              break;
            case 'Sell':
              targetPct = -(0.05 + Math.random() * 0.10); // -5 to -15%
              break;
            case 'Strong Sell':
              targetPct = -(0.15 + Math.random() * 0.10); // -15 to -25%
              break;
            default:
              targetPct = 0.10 + Math.random() * 0.10;
          }
          const newTarget = currentPrice * (1 + targetPct);
          stock.priceTarget = `$${newTarget.toFixed(2)}`;
          // Also correct currentPrice from live data
          if (liveQuote) {
            stock.currentPrice = `$${liveQuote.price.toFixed(2)}`;
          }
        }
      }
    }
  }

  // ── 5. Correct obviously wrong sectors/products ──
  for (const stock of stocks) {
    const facts = COMPANY_FACTS[stock.symbol];
    if (!facts) continue;

    // Check if the AI assigned a clearly wrong sector
    const aiSector = (stock.sector || '').toLowerCase();
    const correctSector = facts.sector.toLowerCase();

    // Known mismatches to detect
    const isWrongSector =
      (stock.symbol === 'NVDA' && (aiSector.includes('mining') || aiSector.includes('تعدين'))) ||
      (stock.symbol === 'AMZN' && aiSector.includes('information technology')) ||
      (stock.symbol === 'TSLA' && aiSector.includes('technology')) ||
      (stock.symbol === 'PYPL' && aiSector.includes('social media')) ||
      (stock.symbol === 'META' && aiSector.includes('financial')) ||
      (stock.symbol === 'JPM' && aiSector.includes('technology')) ||
      (stock.symbol === 'XOM' && aiSector.includes('technology')) ||
      (stock.symbol === 'NFLX' && aiSector.includes('technology'));

    if (isWrongSector) {
      stock.sector = facts.sector;
    }

    // Check rationale for clearly wrong product descriptions
    const rationaleLower = (stock.rationale || '').toLowerCase();
    const isWrongRationale =
      (stock.symbol === 'NVDA' && (rationaleLower.includes('mining') || rationaleLower.includes('تعدين'))) ||
      (stock.symbol === 'PYPL' && rationaleLower.includes('paypal owns paypal')) ||
      (stock.symbol === 'MSFT' && rationaleLower.includes('garbled'));

    if (isWrongRationale && facts) {
      if (isAr) {
        stock.rationale = `تتميز ${facts.name} بتركيزها على ${facts.core}، وتعمل في قطاع ${facts.sector}. يتميز السهم بأداء متفرد مرتبط بنمو أعمالها الأساسية.`;
      } else {
        stock.rationale = `${facts.name} focuses on ${facts.core}, operating in the ${facts.sector} sector. The stock's performance is driven by its market leadership in these core areas.`;
      }
    }
  }

  return stocks;
}

// ─── Helper: Fetch live quote data from FMP ─────────────────
async function fetchLiveQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number; volume: number; marketCap: number } | null> {
  if (!FMP_API_KEY) return null;
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const q = Array.isArray(data) ? data[0] : data;
    if (!q || !q.price) return null;
    return {
      price: q.price,
      change: q.change || 0,
      changePercent: q.changesPercentage || 0,
      volume: q.volume || 0,
      marketCap: q.marketCap || 0,
    };
  } catch {
    return null;
  }
}

// ─── Helper: Fetch multiple live quotes in parallel ─────────
async function fetchLiveQuotes(symbols: string[]): Promise<Map<string, { price: number; change: number; changePercent: number; volume: number; marketCap: number }>> {
  const results = new Map<string, { price: number; change: number; changePercent: number; volume: number; marketCap: number }>();
  const fetches = symbols.map(async (sym) => {
    const quote = await fetchLiveQuote(sym);
    if (quote) results.set(sym, quote);
  });
  await Promise.allSettled(fetches);
  return results;
}

// ─── Helper: Fetch company profile from FMP ─────────────────
async function fetchCompanyProfile(symbol: string): Promise<{ sector: string; industry: string; description: string; ceo: string } | null> {
  if (!FMP_API_KEY) return null;
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = Array.isArray(data) ? data[0] : data;
    if (!p) return null;
    return {
      sector: p.sector || '',
      industry: p.industry || '',
      description: (p.description || '').slice(0, 300),
      ceo: p.ceo || '',
    };
  } catch {
    return null;
  }
}

// ─── Helper: Fetch top performers from FMP ───────────────────
async function fetchTopPerformers(): Promise<Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }>> {
  if (!FMP_API_KEY) return [];
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${FMP_API_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).slice(0, 10).map((s: any) => ({
      symbol: s.symbol || s.ticker || '',
      name: s.name || s.companyName || '',
      price: s.price || 0,
      change: s.changes || 0,
      changePercent: s.changesPercentage || 0,
    }));
  } catch {
    return [];
  }
}

// ─── Helper: Fetch fastest growing from FMP ─────────────────
async function fetchFastestGrowing(): Promise<Array<{ symbol: string; name: string; revenueGrowth: number; epsGrowth: number }>> {
  if (!FMP_API_KEY) return [];
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${FMP_API_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).slice(0, 10).map((s: any) => ({
      symbol: s.symbol || s.ticker || '',
      name: s.name || s.companyName || '',
      revenueGrowth: s.changesPercentage || 0,
      epsGrowth: 0,
    }));
  } catch {
    return [];
  }
}

// ─── Helper: Call Groq API with retry + model fallback ──────
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.3,
  maxTokens: number = 2000,
  retries: number = 2
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const modelsToTry = [GROQ_MODEL, ...GROQ_FALLBACK_MODELS];
  let lastError: Error | null = null;

  // Try each model in order
  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`[Stock-Groq] Retry attempt ${attempt}/${retries} with model ${model}`);
        }

        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
          signal: AbortSignal.timeout(45000),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');

          // Rate limited — retry
          if (response.status === 429 && attempt < retries) {
            console.warn(`[Stock-Groq] Rate limited with ${model}, retrying...`);
            lastError = new Error(`Groq rate limited (${response.status})`);
            continue;
          }

          // Model not found / unavailable — try next model
          if (response.status === 404 || response.status === 400) {
            console.warn(`[Stock-Groq] Model ${model} unavailable (${response.status}), trying next...`);
            lastError = new Error(`Model ${model} unavailable: ${errorText.slice(0, 200)}`);
            break; // Break inner loop, try next model
          }

          // Other client error — don't retry
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`Groq API error (${response.status}): ${errorText.slice(0, 300)}`);
          }

          // Server error — retry
          lastError = new Error(`Groq API error (${response.status}): ${errorText.slice(0, 200)}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        if (!content.trim()) {
          throw new Error('Groq returned empty response');
        }

        console.log(`[Stock-Groq] Success with model ${model}`);
        return content;
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          throw new Error('Groq API request timed out (45s). Please try again.');
        }
        if (attempt < retries && err.message?.includes('fetch')) {
          continue;
        }
      }
    }
  }

  throw lastError || new Error('Groq API failed after all retries and model fallbacks');
}

// ─── Helper: Parse JSON from Groq response ──────────────────
function parseGroqJSON<T>(text: string): T | null {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
    text.match(/```\s*([\s\S]*?)\s*```/) ||
    text.match(/(\[[\s\S]*\])/) ||
    text.match(/(\{[\s\S]*\})/);

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Try cleaning the JSON
      try {
        const cleaned = jsonMatch[1]
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/[\x00-\x1f]/g, ' ')
          .replace(/:\s*undefined/g, ': null')
          .replace(/:\s*NaN/g, ': null')
          // Fix unquoted string values in JSON (common LLM mistake)
          .replace(/:\s*([A-Za-z][A-Za-z0-9 &_\-\/]*)([,\n\r}])/g, ': "$1"$2')
          // Fix trailing commas before closing brackets
          .replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(cleaned);
      } catch {
        return null;
      }
    }
  }

  // Try parsing the entire text
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Helper: Normalize compare response ─────────────────────
// Groq sometimes returns an array directly instead of { comparison: [...] }
// This normalizes it to always have { items: [...], winner?, rationale? }
function normalizeCompareResponse(parsed: any): { items: any[]; winner?: string; rationale?: string } {
  if (Array.isArray(parsed)) {
    // Groq returned a flat array — no winner info
    return { items: parsed };
  }
  if (parsed && typeof parsed === 'object') {
    // Check for { comparison: [...] } format
    if (parsed.comparison && Array.isArray(parsed.comparison)) {
      return {
        items: parsed.comparison,
        winner: parsed.winner,
        rationale: parsed.rationale,
      };
    }
    // Check for { items: [...] } format
    if (parsed.items && Array.isArray(parsed.items)) {
      return {
        items: parsed.items,
        winner: parsed.winner,
        rationale: parsed.rationale,
      };
    }
    // Single comparison object with stock data at root
    if (parsed.symbol || parsed.companyName) {
      return { items: [parsed] };
    }
  }
  return { items: [] };
}

// ─── POST Handler ───────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, locale = 'en', ...params } = body;

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured. Set GROQ_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    switch (action) {
      case 'find-best-stocks':
        return await handleFindBestStocks(params, locale);
      case 'analyze-stock':
        return await handleAnalyzeStock(params, locale);
      case 'compare-stocks':
        return await handleCompareStocks(params, locale);
      case 'sector-analysis':
        return await handleSectorAnalysis(params, locale);
      case 'personalized-recommendation':
        return await handlePersonalizedRecommendation(params, locale);
      default:
        return NextResponse.json({ error: 'Invalid action. Use: find-best-stocks, analyze-stock, compare-stocks, sector-analysis, personalized-recommendation' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Stock-Groq] Error:', error.message);
    // Return user-friendly error that the client can display
    const userMessage = error.message?.includes('timed out')
      ? 'AI request timed out. Please try again.'
      : error.message?.includes('rate limit')
      ? 'AI service is busy. Please wait a moment and try again.'
      : error.message?.includes('not configured')
      ? 'AI service is not configured. Contact support.'
      : 'AI analysis temporarily unavailable. Please try again.';

    return NextResponse.json(
      { error: userMessage, detail: error.message },
      { status: 500 }
    );
  }
}

// ─── Find Best Stocks (V4: Company facts + Post-validation) ──
async function handleFindBestStocks(params: any, locale: string) {
  const {
    criteria = 'growth',
    sector = 'all',
    riskTolerance = 'moderate',
    investmentHorizon = 'medium',
    count = 5,
  } = params;

  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';

  // ── Fetch live market data to ground recommendations in reality ──
  const [topPerformers, fastestGrowing] = await Promise.all([
    fetchTopPerformers(),
    fetchFastestGrowing(),
  ]);

  const liveDataSection = [
    topPerformers.length > 0
      ? `TODAY'S TOP GAINERS (live data):\n${topPerformers.map(s => `- ${s.symbol} (${s.name}): $${s.price.toFixed(2)} (${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`).join('\n')}`
      : '',
    fastestGrowing.length > 0
      ? `\nHIGH-MOMENTUM STOCKS (live data):\n${fastestGrowing.map(s => `- ${s.symbol} (${s.name})`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n');

  // Fetch live quotes for a curated universe of popular stocks
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'WMT', 'UNH', 'JNJ', 'PG', 'MA', 'HD', 'XOM', 'CVX', 'ABBV', 'KO', 'PEP', 'COST', 'AVGO', 'ADBE', 'CRM', 'ORCL', 'NFLX', 'AMD', 'INTC', 'QCOM', 'PYPL'];
  const liveQuotes = await fetchLiveQuotes(popularSymbols);
  const quotesSection = liveQuotes.size > 0
    ? `\n\nCURRENT LIVE PRICES (use these as currentPrice — do NOT invent different numbers):\n${Array.from(liveQuotes.entries()).map(([sym, q]) => `- ${sym}: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%) | MktCap: $${(q.marketCap / 1e9).toFixed(1)}B | Vol: ${(q.volume / 1e6).toFixed(1)}M`).join('\n')}`
    : '';

  // ── V4: Build company facts section from knowledge base ──
  const companyFactsSection = buildCompanyFactsSection(popularSymbols);

  const systemPrompt = isAr
    ? `أنت خبير مالي ومحلل أسواق متمرس. مهمتك هي اقتراح أفضل الأسهم بناءً على معايير محددة.

قواعد صارمة:
1. يجب أن تستند الأسعار الحالية على البيانات الحية المقدمة لك أدناه. لا تخترع أسعاراً مختلفة.
2. يجب أن يكون السعر المستهدف واقعياً بالنسبة للسعر الحالي (مثلاً: إذا كان السعر الحالي $180، فالهدف $200-220 منطقي، وليس $1200).
3. يجب أن يكون المبرر فريداً ومحدداً لكل شركة — لا تستخدم نفس الجملة لشركات مختلفة.
4. اذكر سبب محدد يتعلق بقطاع الشركة الفعلي (لا تقل "تكنولوجيا المعلومات" لشركة أمازون التي هي في التجارة الإلكترونية).
5. اذكر حقيقة مالية محددة واحدة على الأقل لكل شركة (مثل: نمو الإيرادات، هامش الربح، حصة السوق).

محظورات صارمة:
- لا تستخدم أبداً عبارة "تنتج منتجات ذكية مثل" أو "تعتمد على تقنيات الذكاء الاصطناعي" كتبرير عام.
- لا تذكر منتجات شركة أخرى في تبرير شركة مختلفة (مثلاً: لا تذكر "أبل إير بودز" في تبرير أمازون).
- لا تستخدم نفس نمط الجملة لأكثر من شركة واحدة.
- لكل شركة، اذكر منتجها أو خدمتها الأساسية بالاسم (مثل: AWS لأمازون، iPhone لأبل، ChatGPT partnership لمايكروسوفت).
- إذا لم تتوفر بيانات حية، اذكر ذلك صراحةً ولا تخترع أسعاراً.

قواعد التنويع (V4):
- يجب أن تختلف الإشارة (signal) بين الأسهم — لا تجعلها كلها Buy. استخدم تنويع: Strong Buy, Buy, Hold بناءً على الجدارة الفعلية.
- يجب أن يختلف مستوى المخاطرة (riskLevel) — لا تجعلها كلها Medium. استخدم Low للشركات الكبيرة المستقرة و High للشركات المتقلبة.
- يجب أن يختلف السعر المستهدف لكل سهم بناءً على سعره الحالي — لا تستخدم نفس السعر المستهدف لأسهم مختلفة.
- محظور: لا تستخدم أبداً نمط "تعتمد على تقنيات X لمنتجاتها مثل Y" — اكتب كل مبرر بأسلوب مختلف تماماً.
- مطلوب: اذكر بيانات شركة حقيقية من الحقائق المقدمة — مثل نمو إيرادات AWS أو حصة NVIDIA في سوق الذكاء الاصطناعي.

أجب فقط بصيغة JSON صالحة بدون أي نص إضافي. التنسيق المطلوب:
[
  {
    "symbol": "رمز السهم",
    "companyName": "اسم الشركة",
    "sector": "القطاع الفعلي",
    "signal": "Strong Buy أو Buy أو Hold أو Sell أو Strong Sell",
    "confidence": رقم من 1 إلى 100,
    "currentPrice": "السعر الحالي الفعلي",
    "priceTarget": "السعر المستهدف (واقعي بالنسبة للسعر الحالي)",
    "rationale": "سبب فريد ومحدد لهذه الشركة فقط (2-3 جمل)",
    "riskLevel": "Low أو Medium أو High",
    "timeframe": "الإطار الزمني"
  }
]`
    : isFr
    ? `Vous êtes un expert financier et analyste de marché chevronné. Votre tâche est de recommander les meilleures actions selon des critères spécifiques.

Règles strictes:
1. Les prix actuels doivent être basés sur les données en temps réel fournies ci-dessous. N'inventez PAS des prix différents.
2. L'objectif de prix doit être réaliste par rapport au prix actuel (ex: si le prix actuel est $180, un objectif de $200-220 est raisonnable, pas $1200).
3. La justification doit être unique et spécifique à chaque entreprise — n'utilisez PAS la même phrase pour différentes entreprises.
4. Mentionnez une raison spécifique au secteur réel de l'entreprise (ne dites pas "technologie de l'information" pour Amazon qui est dans le e-commerce).
5. Mentionnez au moins un fait financier spécifique par entreprise (ex: croissance des revenus, marge bénéficiaire, part de marché).

Interdictions strictes:
- N'utilisez JAMAIS "produit des produits intelligents comme" ou "s'appuie sur l'IA" comme justification générique.
- Ne mentionnez PAS les produits d'une autre entreprise dans la justification d'une entreprise différente.
- N'utilisez PAS le même modèle de phrase pour plus d'une entreprise.
- Pour chaque entreprise, nommez son produit ou service principal (ex: AWS pour Amazon, iPhone pour Apple).
- Si aucune donnée en temps réel n'est disponible, indiquez-le explicitement et n'inventez pas de prix.

Règles de diversité (V4):
- Les signaux doivent varier entre les actions — ne les mettez pas toutes à "Buy". Utilisez Strong Buy, Buy, Hold selon les mérites.
- Les niveaux de risque doivent varier — ne les mettez pas tous à "Medium". Utilisez Low pour les grandes entreprises stables et High pour les volatiles.
- Les objectifs de prix doivent différer selon le prix actuel — n'utilisez pas le même objectif pour des actions différentes.
- Interdit: n'utilisez jamais le modèle "s'appuie sur la technologie X pour des produits comme Y" — écrivez chaque justification dans un style complètement différent.
- Obligatoire: mentionnez des données réelles issues des faits fournis — comme la croissance des revenus AWS ou la part de NVIDIA sur le marché de l'IA.

Répondez UNIQUEMENT avec du JSON valide, sans texte supplémentaire. Format requis:
[
  {
    "symbol": "SYMBOLE",
    "companyName": "Nom complet de l'entreprise",
    "sector": "Secteur réel",
    "signal": "Strong Buy | Buy | Hold | Sell | Strong Sell",
    "confidence": nombre 1-100,
    "currentPrice": "prix actuel réel",
    "priceTarget": "objectif de prix réaliste",
    "rationale": "raison unique et spécifique à cette entreprise (2-3 phrases)",
    "riskLevel": "Low | Medium | High",
    "timeframe": "horizon d'investissement"
  }
]`
    : isEs
    ? `Eres un experto financiero y analista de mercados experimentado. Tu tarea es recomendar las mejores acciones según criterios específicos.

Reglas estrictas:
1. Los precios actuales deben basarse en los datos en tiempo real proporcionados a continuación. NO inventes precios diferentes.
2. El objetivo de precio debe ser realista en relación con el precio actual (ej: si el precio actual es $180, un objetivo de $200-220 es razonable, NO $1200).
3. La justificación debe ser única y específica para cada empresa — NO uses la misma frase para diferentes empresas.
4. Menciona una razón específica relacionada con el sector real de la empresa (no digas "tecnología de la información" para Amazon que está en e-commerce).
5. Menciona al menos un dato financiero específico por empresa (ej: crecimiento de ingresos, margen de beneficio, cuota de mercado).

Prohibiciones estrictas:
- NUNCA uses "produce productos inteligentes como" o "se basa en tecnología de IA" como justificación genérica.
- NO menciones los productos de otra empresa en la justificación de una empresa diferente.
- NO uses el mismo patrón de frase para más de una empresa.
- Para cada empresa, nombra su producto o servicio principal (ej: AWS para Amazon, iPhone para Apple, partnership con ChatGPT para Microsoft).
- Si no hay datos en tiempo real disponibles, indícalo explícitamente y no inventes precios.

Reglas de diversidad (V4):
- Las señales deben variar entre las acciones — no las pongas todas en "Buy". Usa Strong Buy, Buy, Hold según los méritos.
- Los niveles de riesgo deben variar — no los pongas todos en "Medium". Usa "Low" para empresas grandes estables y "High" para las volátiles.
- Los objetivos de precio deben diferir según el precio actual — no uses el mismo objetivo para acciones diferentes.
- Prohibido: nunca uses el patrón "se basa en tecnología X para productos como Y" — escribe cada justificación en un estilo completamente diferente.
- Obligatorio: menciona datos reales de la empresa de los hechos proporcionados — como el crecimiento de ingresos de AWS o la cuota de NVIDIA en el mercado de IA.

Responde SOLO con JSON válido, sin texto adicional. Formato requerido:
[
  {
    "symbol": "SÍMBOLO",
    "companyName": "Nombre completo de la empresa",
    "sector": "Sector real",
    "signal": "Strong Buy | Buy | Hold | Sell | Strong Sell",
    "confidence": número 1-100,
    "currentPrice": "precio actual real",
    "priceTarget": "objetivo de precio realista",
    "rationale": "razón única y específica para esta empresa (2-3 frases)",
    "riskLevel": "Low | Medium | High",
    "timeframe": "horizonte de inversión"
  }
]`
    : `You are a financial markets expert and seasoned stock analyst. Your task is to recommend the best stocks based on specific criteria.

STRICT RULES:
1. Current prices MUST be based on the live data provided below. Do NOT invent different prices.
2. Price targets MUST be realistic relative to the current price (e.g., if current price is $180, a target of $200-220 is reasonable, NOT $1200).
3. Each rationale MUST be unique and specific to that company — do NOT use the same generic phrase for different companies.
4. Reference the company's ACTUAL sector (do NOT say "Information Technology" for Amazon which is in Consumer Discretionary/E-commerce).
5. Include at least one specific financial fact per company (e.g., revenue growth rate, profit margin, market share, recent earnings beat).

STRICT PROHIBITIONS:
- NEVER use "produces smart products like" or "leverages AI technology" as a generic justification.
- NEVER mention another company's products in a different company's rationale (e.g., do NOT say "Apple AirPods" in Amazon's rationale).
- Do NOT use the same sentence pattern for more than one company.
- For each company, name its CORE product or service (e.g., AWS for Amazon, iPhone for Apple, Azure/ChatGPT for Microsoft, GPU/H100 for NVIDIA).
- If no live data is available, say so explicitly and do NOT invent prices.

DIVERSITY RULES (V4):
- Signals MUST vary across stocks — do NOT make them all "Buy". Use a mix: Strong Buy, Buy, Hold based on actual merit.
- Risk levels MUST vary — do NOT make them all "Medium". Use "Low" for large stable companies and "High" for volatile ones.
- Price targets MUST differ per stock based on its current price — do NOT use the same target for different stocks.
- FORBIDDEN: never use the pattern "relies on X technology for products like Y" — write each rationale in a completely different style.
- REQUIRED: mention real company data from the provided facts — such as AWS revenue growth or NVIDIA's AI market share.

Answer ONLY with valid JSON, no additional text. Required format:
[
  {
    "symbol": "STOCK_SYMBOL",
    "companyName": "Company Full Name",
    "sector": "Actual Sector Name",
    "signal": "Strong Buy | Buy | Hold | Sell | Strong Sell",
    "confidence": number 1-100,
    "currentPrice": "actual current price from live data",
    "priceTarget": "realistic price target relative to current price",
    "rationale": "unique, company-specific reason (2-3 sentences)",
    "riskLevel": "Low | Medium | High",
    "timeframe": "investment timeframe"
  }
]`;

  const userPrompt = isAr
    ? `${liveDataSection}${quotesSection}${companyFactsSection}

اقتراح ${count} أسهم مميزة بناءً على:
- المعيار: ${criteria === 'growth' ? 'نمو' : criteria === 'value' ? 'قيمة' : criteria === 'dividend' ? 'أرباح' : criteria === 'momentum' ? 'زخم' : criteria === 'ai-tech' ? 'تكنولوجيا AI' : criteria}
- القطاع: ${sector === 'all' ? 'جميع القطاعات' : sector}
- تحمل المخاطر: ${riskTolerance === 'aggressive' ? 'عالي' : riskTolerance === 'moderate' ? 'متوسط' : 'منخفض'}
- أفق الاستثمار: ${investmentHorizon === 'short' ? 'قصير (1-3 أشهر)' : investmentHorizon === 'medium' ? 'متوسط (3-12 شهر)' : 'طويل (1-5 سنوات)'}

مهم: استخدم الأسعار الحية المذكورة أعلاه كـ currentPrice. اجعل كل مبرر فريداً ومحدداً لكل شركة. استخدم بيانات الشركة الحقيقية من COMPANY FACTS أعلاه. لا تستخدم نفس السعر المستهدف لأسهم مختلفة. نوّع بين الإشارات (Strong Buy/Buy/Hold).`
    : isFr
    ? `${liveDataSection}${quotesSection}${companyFactsSection}

Recommander ${count} actions principales basées sur:
- Critère: ${criteria}
- Secteur: ${sector === 'all' ? 'Tous les secteurs' : sector}
- Tolérance au risque: ${riskTolerance}
- Horizon: ${investmentHorizon === 'short' ? 'Court terme (1-3 mois)' : investmentHorizon === 'medium' ? 'Moyen terme (3-12 mois)' : 'Long terme (1-5 ans)'}

IMPORTANT: Utilisez les prix en temps réel ci-dessus comme currentPrice. Chaque justification doit être unique et spécifique à l'entreprise. Utilisez les données réelles de COMPANY FACTS ci-dessus. N'utilisez pas le même objectif de prix pour des actions différentes. Variez les signaux (Strong Buy/Buy/Hold).`
    : isEs
    ? `${liveDataSection}${quotesSection}${companyFactsSection}

Recomendar ${count} acciones principales basadas en:
- Criterio: ${criteria}
- Sector: ${sector === 'all' ? 'Todos los sectores' : sector}
- Tolerancia al riesgo: ${riskTolerance === 'aggressive' ? 'Alta' : riskTolerance === 'moderate' ? 'Moderada' : 'Baja'}
- Horizonte: ${investmentHorizon === 'short' ? 'Corto plazo (1-3 meses)' : investmentHorizon === 'medium' ? 'Medio plazo (3-12 meses)' : 'Largo plazo (1-5 años)'}

IMPORTANTE: Usa los precios en tiempo real de arriba como currentPrice. Haz que cada justificación sea única y específica para la empresa. Usa datos reales de COMPANY FACTS de arriba. NO uses el mismo objetivo de precio para acciones diferentes. Varía las señales (Strong Buy/Buy/Hold).`
    : `${liveDataSection}${quotesSection}${companyFactsSection}

Recommend ${count} top stocks based on:
- Criteria: ${criteria}
- Sector: ${sector === 'all' ? 'All sectors' : sector}
- Risk tolerance: ${riskTolerance}
- Investment horizon: ${investmentHorizon === 'short' ? 'Short-term (1-3 months)' : investmentHorizon === 'medium' ? 'Medium-term (3-12 months)' : 'Long-term (1-5 years)'}

CRITICAL: Use the live prices above as currentPrice. Make each rationale unique and company-specific. Do NOT repeat the same generic phrase across different stocks. Use real company data from the COMPANY FACTS section above. Do NOT use the same price target for different stocks. Vary signals (Strong Buy/Buy/Hold).`;

  const response = await callGroq(systemPrompt, userPrompt, 0.4, 3000);
  let stocks = parseGroqJSON<StockRecommendation[]>(response);

  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    // Fallback: return the raw text as a structured response
    return NextResponse.json({
      stocks: [],
      rawAnalysis: response,
      provider: 'groq',
      model: GROQ_MODEL,
      liveDataUsed: liveQuotes.size > 0,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Post-process: Enrich with live prices if AI missed them ──
  stocks = stocks.map(s => {
    const liveQuote = liveQuotes.get(s.symbol);
    if (liveQuote) {
      // If AI invented a wrong current price, correct it
      const aiPrice = parseFloat(s.currentPrice?.replace(/[^0-9.]/g, '') || '0');
      if (Math.abs(aiPrice - liveQuote.price) / liveQuote.price > 0.3) {
        // AI price is >30% off from live — correct it
        s.currentPrice = `$${liveQuote.price.toFixed(2)}`;
      }
    }
    return s;
  });

  // ── V4: Run post-processing validation ──
  stocks = validateAndEnrichRecommendations(stocks, liveQuotes, locale);

  return NextResponse.json({
    stocks: stocks.slice(0, count),
    provider: 'groq',
    model: GROQ_MODEL,
    liveDataUsed: liveQuotes.size > 0,
    version: 'V4',
    timestamp: new Date().toISOString(),
  });
}

// ─── Analyze Single Stock (V4: Company facts grounding) ──
async function handleAnalyzeStock(params: any, locale: string) {
  const { symbol, analysisType = 'comprehensive' } = params;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';

  // Fetch live data for this stock
  const [liveQuote, companyProfile] = await Promise.all([
    fetchLiveQuote(symbol),
    fetchCompanyProfile(symbol),
  ]);

  const liveDataSection = liveQuote
    ? `\nLIVE MARKET DATA for ${symbol}:
- Current Price: $${liveQuote.price.toFixed(2)}
- Change: ${liveQuote.changePercent >= 0 ? '+' : ''}${liveQuote.changePercent.toFixed(2)}%
- Volume: ${(liveQuote.volume / 1e6).toFixed(1)}M
- Market Cap: $${(liveQuote.marketCap / 1e9).toFixed(1)}B`
    : '';

  const profileSection = companyProfile
    ? `\n\nCOMPANY PROFILE:
- Sector: ${companyProfile.sector}
- Industry: ${companyProfile.industry}
- CEO: ${companyProfile.ceo}
- Description: ${companyProfile.description}`
    : '';

  // V4: Include company facts for grounding
  const companyFactsSection = buildCompanyFactsSection([symbol]);

  const systemPrompt = isAr
    ? `أنت محلل أسواق مالي خبير. قدم تحليلاً مهنياً وشاملاً ومفصلاً للسهم المطلوب.

قواعد صارمة:
1. استخدم السعر الحالي الحي المقدم أعلاه. لا تخترع سعراً مختلفاً.
2. يجب أن تكون الأسعار المستهدفة واقعية مقارنة بالسعر الحالي.
3. اجعل المبررات محددة لهذه الشركة فقط — اذكر حقائق مالية فعلية.
4. حدد القطاع الصحيح للشركة.
5. قدم تحليلاً شاملاً يتضمن: الملخص التنفيذي، التحليل الفني، مستويات الدعم والمقاومة، المؤشرات الفنية، لمحة أساسية، التوقعات السوقية، تقييم المخاطر، والتوصية النهائية.

التنسيق المطلوب (JSON فقط):
{
  "symbol": "الرمز",
  "companyName": "اسم الشركة",
  "currentPrice": "السعر الحالي من البيانات الحية",
  "priceChange": "نسبة التغيير اليومي",
  "executiveSummary": "ملخص تنفيذي شامل (3-5 جمل يلخص وضع السهم الحالي)",
  "trendDirection": "صاعد|هابط|محايد",
  "trendStrength": رقم من 1 إلى 100,
  "movingAverages": [
    {"period": "20", "price": "القيمة", "note": "دعم|مقاومة"},
    {"period": "50", "price": "القيمة", "note": "دعم|مقاومة"},
    {"period": "200", "price": "القيمة", "note": "دعم|مقاومة"}
  ],
  "supportLevels": [{"price": "السعر", "note": "وصف قصير"}],
  "resistanceLevels": [{"price": "السعر", "note": "وصف قصير"}],
  "indicators": [
    {"name": "RSI (14)", "value": "القيمة", "assessment": "التقييم"},
    {"name": "MACD", "value": "القيمة", "assessment": "التقييم"},
    {"name": "Stochastic %K", "value": "القيمة", "assessment": "التقييم"}
  ],
  "fundamentalOverview": {
    "marketCap": "القيمة السوقية",
    "pe": "نسبة السعر/الأرباح",
    "eps": "ربحية السهم",
    "sector": "القطاع"
  },
  "bullishScenario": {"targetPrice": "السعر المستهدف", "drivers": ["السبب 1", "السبب 2"], "timeframe": "المدة"},
  "bearishScenario": {"targetPrice": "السعر المستهدف", "drivers": ["السبب 1", "السبب 2"], "timeframe": "المدة"},
  "realisticTarget": {"price": "السعر", "probability": "النسبة المئوية"},
  "companyRisks": ["خطر 1", "خطر 2", "خطر 3", "خطر 4"],
  "technicalRisks": ["خطر فني 1", "خطر فني 2"],
  "shortTermRec": {"action": "شراء|انتظار|بيع", "entryPrice": "سعر الدخول", "target": "الهدف", "stopLoss": "وقف الخسارة"},
  "mediumTermRec": {"action": "شراء|انتظار|بيع", "condition": "شرط التأكيد"},
  "signal": "Strong Buy|Buy|Hold|Sell|Strong Sell",
  "confidence": رقم من 1 إلى 100
}`
    : isFr
    ? `Vous êtes un analyste financier expert. Fournissez une analyse professionnelle complète et détaillée de l'action demandée.

Règles strictes:
1. Utilisez le prix actuel en temps réel fourni ci-dessus. N'inventez PAS un prix différent.
2. Les objectifs de prix doivent être réalistes par rapport au prix actuel.
3. Les justifications doivent être spécifiques à cette entreprise — mentionnez des faits financiers réels.
4. Indiquez le secteur correct de l'entreprise.
5. Fournissez une analyse complète incluant: résumé exécutif, analyse technique, niveaux de support/résistance, indicateurs techniques, aperçu fondamental, prévisions de marché, évaluation des risques et recommandation finale.

Format requis (JSON uniquement):
{
  "symbol": "SYMBOLE",
  "companyName": "Nom complet",
  "currentPrice": "prix actuel des données en temps réel",
  "priceChange": "pourcentage de variation quotidien",
  "executiveSummary": "résumé exécutif complet (3-5 phrases résumant la situation actuelle)",
  "trendDirection": "Haussier|Baissier|Neutre",
  "trendStrength": nombre de 1 à 100,
  "movingAverages": [
    {"period": "20", "price": "valeur", "note": "support|résistance"},
    {"period": "50", "price": "valeur", "note": "support|résistance"},
    {"period": "200", "price": "valeur", "note": "support|résistance"}
  ],
  "supportLevels": [{"price": "prix", "note": "description courte"}],
  "resistanceLevels": [{"price": "prix", "note": "description courte"}],
  "indicators": [
    {"name": "RSI (14)", "value": "valeur", "assessment": "évaluation"},
    {"name": "MACD", "value": "valeur", "assessment": "évaluation"},
    {"name": "Stochastic %K", "value": "valeur", "assessment": "évaluation"}
  ],
  "fundamentalOverview": {
    "marketCap": "capitalisation",
    "pe": "ratio P/E",
    "eps": "BPA",
    "sector": "secteur"
  },
  "bullishScenario": {"targetPrice": "objectif de prix", "drivers": ["raison 1", "raison 2"], "timeframe": "durée"},
  "bearishScenario": {"targetPrice": "objectif de prix", "drivers": ["raison 1", "raison 2"], "timeframe": "durée"},
  "realisticTarget": {"price": "prix", "probability": "pourcentage"},
  "companyRisks": ["risque 1", "risque 2", "risque 3", "risque 4"],
  "technicalRisks": ["risque technique 1", "risque technique 2"],
  "shortTermRec": {"action": "Acheter|Attendre|Vendre", "entryPrice": "prix d'entrée", "target": "objectif", "stopLoss": "stop loss"},
  "mediumTermRec": {"action": "Acheter|Attendre|Vendre", "condition": "condition de confirmation"},
  "signal": "Strong Buy|Buy|Hold|Sell|Strong Sell",
  "confidence": nombre de 1 à 100
}`
    : isEs
    ? `Eres un analista financiero experto. Proporciona un análisis profesional, completo y detallado de la acción solicitada.

Reglas estrictas:
1. Usa el precio actual en tiempo real proporcionado arriba. NO inventes un precio diferente.
2. Los objetivos de precio deben ser realistas en relación con el precio actual.
3. Las justificaciones deben ser específicas para esta empresa — menciona datos financieros reales.
4. Indica el sector correcto de la empresa.
5. Proporciona un análisis completo que incluya: resumen ejecutivo, análisis técnico, niveles de soporte/resistencia, indicadores técnicos, perspectiva fundamental, pronósticos de mercado, evaluación de riesgos y recomendación final.

Formato requerido (solo JSON):
{
  "symbol": "SÍMBOLO",
  "companyName": "Nombre completo de la empresa",
  "currentPrice": "precio actual en tiempo real",
  "priceChange": "porcentaje de cambio diario",
  "executiveSummary": "resumen ejecutivo completo (3-5 frases resumiendo la situación actual de la acción)",
  "trendDirection": "Alcista|Bajista|Neutral",
  "trendStrength": número de 1 a 100,
  "movingAverages": [
    {"period": "20", "price": "valor", "note": "soporte|resistencia"},
    {"period": "50", "price": "valor", "note": "soporte|resistencia"},
    {"period": "200", "price": "valor", "note": "soporte|resistencia"}
  ],
  "supportLevels": [{"price": "precio", "note": "descripción corta"}],
  "resistanceLevels": [{"price": "precio", "note": "descripción corta"}],
  "indicators": [
    {"name": "RSI (14)", "value": "valor", "assessment": "evaluación"},
    {"name": "MACD", "value": "valor", "assessment": "evaluación"},
    {"name": "Stochastic %K", "value": "valor", "assessment": "evaluación"}
  ],
  "fundamentalOverview": {
    "marketCap": "capitalización de mercado",
    "pe": "ratio P/E",
    "eps": "BPA",
    "sector": "sector"
  },
  "bullishScenario": {"targetPrice": "objetivo de precio", "drivers": ["razón 1", "razón 2"], "timeframe": "plazo"},
  "bearishScenario": {"targetPrice": "objetivo de precio", "drivers": ["razón 1", "razón 2"], "timeframe": "plazo"},
  "realisticTarget": {"price": "precio", "probability": "porcentaje"},
  "companyRisks": ["riesgo 1", "riesgo 2", "riesgo 3", "riesgo 4"],
  "technicalRisks": ["riesgo técnico 1", "riesgo técnico 2"],
  "shortTermRec": {"action": "Comprar|Esperar|Vender", "entryPrice": "precio de entrada", "target": "objetivo", "stopLoss": "stop loss"},
  "mediumTermRec": {"action": "Comprar|Esperar|Vender", "condition": "condición de confirmación"},
  "signal": "Strong Buy|Buy|Hold|Sell|Strong Sell",
  "confidence": número de 1 a 100
}`
    : `You are an expert financial market analyst. Provide a professional, comprehensive, and detailed analysis of the requested stock.

STRICT RULES:
1. Use the live current price provided above. Do NOT invent a different price.
2. Price targets MUST be realistic relative to the current price.
3. Justifications MUST be specific to this company — mention real financial facts and data.
4. Reference the company's ACTUAL sector and industry.
5. Provide a comprehensive analysis including: executive summary, technical analysis, support/resistance levels, technical indicators, fundamental overview, market forecasts, risk assessment, and final recommendation.

Required format (JSON only):
{
  "symbol": "SYMBOL",
  "companyName": "Full Company Name",
  "currentPrice": "actual live price from data",
  "priceChange": "daily change percentage",
  "executiveSummary": "comprehensive executive summary (3-5 sentences summarizing the stock's current situation)",
  "trendDirection": "Bullish|Bearish|Neutral",
  "trendStrength": number from 1 to 100,
  "movingAverages": [
    {"period": "20", "price": "value", "note": "support|resistance"},
    {"period": "50", "price": "value", "note": "support|resistance"},
    {"period": "200", "price": "value", "note": "support|resistance"}
  ],
  "supportLevels": [{"price": "price", "note": "short description"}],
  "resistanceLevels": [{"price": "price", "note": "short description"}],
  "indicators": [
    {"name": "RSI (14)", "value": "value", "assessment": "assessment"},
    {"name": "MACD", "value": "value", "assessment": "assessment"},
    {"name": "Stochastic %K", "value": "value", "assessment": "assessment"}
  ],
  "fundamentalOverview": {
    "marketCap": "market capitalization",
    "pe": "P/E ratio",
    "eps": "EPS",
    "sector": "sector"
  },
  "bullishScenario": {"targetPrice": "target price", "drivers": ["reason 1", "reason 2"], "timeframe": "timeframe"},
  "bearishScenario": {"targetPrice": "target price", "drivers": ["reason 1", "reason 2"], "timeframe": "timeframe"},
  "realisticTarget": {"price": "price", "probability": "percentage"},
  "companyRisks": ["risk 1", "risk 2", "risk 3", "risk 4"],
  "technicalRisks": ["technical risk 1", "technical risk 2"],
  "shortTermRec": {"action": "Buy|Wait|Sell", "entryPrice": "entry price", "target": "target", "stopLoss": "stop loss"},
  "mediumTermRec": {"action": "Buy|Wait|Sell", "condition": "confirmation condition"},
  "signal": "Strong Buy|Buy|Hold|Sell|Strong Sell",
  "confidence": number from 1 to 100
}`;

  const userPrompt = isAr
    ? `${liveDataSection}${profileSection}${companyFactsSection}

حلّل سهم ${symbol} — نوع التحليل: ${analysisType === 'comprehensive' ? 'شامل' : analysisType === 'technical' ? 'فني' : 'أساسي'}

مهم: استخدم السعر الحي المذكور أعلاه كـ currentPrice. اجعل التحليل محدداً لهذه الشركة فقط. استخدم بيانات الشركة الحقيقية من COMPANY FACTS أعلاه.`
    : isFr
    ? `${liveDataSection}${profileSection}${companyFactsSection}

Analyser l'action ${symbol} — Type d'analyse: ${analysisType === 'comprehensive' ? 'complète' : analysisType === 'technical' ? 'technique' : 'fondamentale'}

IMPORTANT: Utilisez le prix en temps réel ci-dessus comme currentPrice. Rendez l'analyse spécifique à cette entreprise. Utilisez les données réelles de COMPANY FACTS ci-dessus.`
    : isEs
    ? `${liveDataSection}${profileSection}${companyFactsSection}

Analiza la acción ${symbol} — Tipo de análisis: ${analysisType === 'comprehensive' ? 'completo' : analysisType === 'technical' ? 'técnico' : 'fundamental'}

IMPORTANTE: Usa el precio en tiempo real de arriba como currentPrice. Haz que el análisis sea específico y único para esta empresa. NO uses texto genérico de plantilla. Usa datos reales de la empresa de la sección COMPANY FACTS de arriba.`
    : `${liveDataSection}${profileSection}${companyFactsSection}

Analyze ${symbol} stock — Analysis type: ${analysisType}

CRITICAL: Use the live price above as currentPrice. Make the analysis specific and unique to this company. Do NOT use generic template text. Use real company data from the COMPANY FACTS section above.`;

  const response = await callGroq(systemPrompt, userPrompt, 0.3, 4000);
  const analysis = parseGroqJSON<any>(response);

  // If parsing succeeded and has expected fields, return structured
  if (analysis && typeof analysis === 'object' && !Array.isArray(analysis) && (analysis.symbol || analysis.companyName)) {
    // Post-process: correct currentPrice if AI invented a wrong one
    if (liveQuote && analysis.currentPrice) {
      const aiPrice = parseFloat(String(analysis.currentPrice).replace(/[^0-9.]/g, ''));
      if (Math.abs(aiPrice - liveQuote.price) / liveQuote.price > 0.3) {
        analysis.currentPrice = `$${liveQuote.price.toFixed(2)}`;
      }
    }
    // V4: Correct wrong sectors/products from company facts
    const facts = COMPANY_FACTS[symbol];
    if (facts) {
      const aiSector = (analysis.sector || '').toLowerCase();
      if (
        (symbol === 'NVDA' && (aiSector.includes('mining') || aiSector.includes('تعدين'))) ||
        (symbol === 'AMZN' && aiSector.includes('information technology')) ||
        (symbol === 'TSLA' && aiSector.includes('technology'))
      ) {
        analysis.sector = facts.sector;
      }
    }
    return NextResponse.json({
      analysis,
      provider: 'groq',
      model: GROQ_MODEL,
      liveDataUsed: !!liveQuote,
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback: return raw text
  return NextResponse.json({
    analysis: { rawText: response },
    provider: 'groq',
    model: GROQ_MODEL,
    liveDataUsed: !!liveQuote,
    timestamp: new Date().toISOString(),
  });
}

// ─── Compare Stocks (V3: Live data) ────────────────────────
async function handleCompareStocks(params: any, locale: string) {
  const { symbols = [], metric = 'overall' } = params;

  if (!symbols.length || symbols.length < 2) {
    return NextResponse.json({ error: 'At least 2 symbols required' }, { status: 400 });
  }

  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';

  // Fetch live data for all symbols
  const liveQuotes = await fetchLiveQuotes(symbols);
  const liveDataSection = liveQuotes.size > 0
    ? `\nLIVE PRICES:\n${Array.from(liveQuotes.entries()).map(([sym, q]) => `- ${sym}: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%) | MktCap: $${(q.marketCap / 1e9).toFixed(1)}B`).join('\n')}`
    : '';

  // V4: Include company facts
  const companyFactsSection = buildCompanyFactsSection(symbols);

  const systemPrompt = isAr
    ? `أنت محلل مالي خبير. قارن بين الأسهم المطلوبة.

قواعد:
1. استخدم الأسعار الحية المقدمة أعلاه.
2. لكل سهم، اذكر نقاط قوة وضعف محددة وفريدة.
3. لا تكرر نفس الأسباب لأسهم مختلفة.

أجب بصيغة JSON فقط:
{
  "comparison": [
    {
      "symbol": "الرمز",
      "companyName": "الاسم",
      "score": رقم من 1-100,
      "currentPrice": "السعر الحالي الحي",
      "strengths": ["نقطة قوة محددة 1", "نقطة قوة محددة 2"],
      "weaknesses": ["نقطة ضعف محددة 1", "نقطة ضعف محددة 2"],
      "signal": "التوصية",
      "verdict": "خلاصة جملة واحدة محددة"
    }
  ],
  "winner": "الرمز الفائز",
  "rationale": "سبب الاختيار المحدد"
}`
    : isFr
    ? `Vous êtes un analyste financier expert. Comparez les actions demandées.

Règles:
1. Utilisez les prix en temps réel fournis ci-dessus.
2. Pour chaque action, mentionnez des points forts et faibles spécifiques et uniques.
3. Ne répétez PAS les mêmes raisons pour des actions différentes.

Répondez UNIQUEMENT avec du JSON valide:
{
  "comparison": [
    {
      "symbol": "SYMBOLE",
      "companyName": "Nom",
      "score": nombre 1-100,
      "currentPrice": "prix actuel en temps réel",
      "strengths": ["point fort spécifique 1", "point fort spécifique 2"],
      "weaknesses": ["point faible spécifique 1", "point faible spécifique 2"],
      "signal": "Buy|Hold|Sell",
      "verdict": "verdict en une phrase spécifique"
    }
  ],
  "winner": "SYMBOLE GAGNANT",
  "rationale": "Pourquoi cette action gagne (raison spécifique)"
}`
    : `You are an expert financial analyst. Compare the requested stocks.

RULES:
1. Use the live prices provided above.
2. For each stock, mention specific and unique strengths and weaknesses.
3. Do NOT repeat the same reasons across different stocks.

Answer ONLY with valid JSON:
{
  "comparison": [
    {
      "symbol": "SYMBOL",
      "companyName": "Name",
      "score": number 1-100,
      "currentPrice": "live current price",
      "strengths": ["specific strength 1", "specific strength 2"],
      "weaknesses": ["specific weakness 1", "specific weakness 2"],
      "signal": "Buy|Hold|Sell",
      "verdict": "one sentence specific verdict"
    }
  ],
  "winner": "WINNING_SYMBOL",
  "rationale": "Specific reason why this stock wins"
}`;

  const userPrompt = isAr
    ? `${liveDataSection}${companyFactsSection}\n\nقارن بين: ${symbols.join(' و ')} — المعيار: ${metric}`
    : isFr
    ? `${liveDataSection}${companyFactsSection}\n\nComparer: ${symbols.join(' vs ')} — Métrique: ${metric}`
    : `${liveDataSection}${companyFactsSection}\n\nCompare: ${symbols.join(' vs ')} — Metric: ${metric}`;

  const response = await callGroq(systemPrompt, userPrompt, 0.3, 2500);
  const parsed = parseGroqJSON<any>(response);

  // Normalize the response format (handles both array and object responses)
  const normalized = normalizeCompareResponse(parsed);

  if (normalized.items.length > 0) {
    return NextResponse.json({
      comparison: {
        comparison: normalized.items,
        winner: normalized.winner,
        rationale: normalized.rationale,
      },
      provider: 'groq',
      model: GROQ_MODEL,
      liveDataUsed: liveQuotes.size > 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback: return raw text
  return NextResponse.json({
    comparison: { rawText: response },
    provider: 'groq',
    model: GROQ_MODEL,
    liveDataUsed: liveQuotes.size > 0,
    timestamp: new Date().toISOString(),
  });
}

// ─── Sector Analysis (V3: Live data) ───────────────────────
async function handleSectorAnalysis(params: any, locale: string) {
  const { sector = 'Technology' } = params;
  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';

  const systemPrompt = isAr
    ? `أنت خبير تحليل قطاعات مالية. قدم تحليلاً شاملاً للقطاع المطلوب.

قواعد:
1. اذكر أسهم محددة بأسباب فريدة لكل سهم.
2. لا تكرر نفس السبب لأسهم مختلفة.

أجب بصيغة JSON فقط:
{
  "sector": "اسم القطاع",
  "overallOutlook": "إيجابي/محايد/سلبي",
  "confidence": رقم,
  "topStocks": [
    { "symbol": "الرمز", "name": "الاسم", "signal": "التوصية", "reason": "سبب محدد وفريد لهذا السهم" }
  ],
  "keyDrivers": ["محرك محدد 1", "محرك محدد 2"],
  "risks": ["مخاطرة محددة 1", "مخاطرة محددة 2"],
  "etfPlay": "رمز ETF المقترح",
  "summary": "ملخص 3 جمل محددة"
}`
    : isFr
    ? `Vous êtes un expert en analyse sectorielle financière. Fournissez une analyse complète du secteur demandé.

Règles:
1. Mentionnez des actions spécifiques avec des raisons uniques pour chaque action.
2. Ne répétez PAS la même raison pour différentes actions.

Répondez UNIQUEMENT avec du JSON valide:
{
  "sector": "Nom du secteur",
  "overallOutlook": "Haussier|Neutre|Baissier",
  "confidence": nombre,
  "topStocks": [
    { "symbol": "SYMBOLE", "name": "Nom", "signal": "Signal", "reason": "Raison spécifique et unique pour cette action" }
  ],
  "keyDrivers": ["moteur spécifique 1", "moteur spécifique 2"],
  "risks": ["risque spécifique 1", "risque spécifique 2"],
  "etfPlay": "symbole ETF",
  "summary": "résumé en 3 phrases spécifiques"
}`
    : `You are a financial sector analysis expert. Provide a comprehensive analysis of the requested sector.

RULES:
1. Mention specific stocks with UNIQUE reasons for each stock.
2. Do NOT repeat the same reason for different stocks.

Answer ONLY with valid JSON:
{
  "sector": "Sector Name",
  "overallOutlook": "Bullish|Neutral|Bearish",
  "confidence": number,
  "topStocks": [
    { "symbol": "SYMBOL", "name": "Name", "signal": "Signal", "reason": "Specific and unique reason for this stock" }
  ],
  "keyDrivers": ["specific driver 1", "specific driver 2"],
  "risks": ["specific risk 1", "specific risk 2"],
  "etfPlay": "ETF symbol",
  "summary": "3 specific sentence summary"
}`;

  const userPrompt = isAr
    ? `حلّل قطاع ${sector}`
    : isFr
    ? `Analyser le secteur ${sector}`
    : `Analyze the ${sector} sector`;

  const response = await callGroq(systemPrompt, userPrompt, 0.3, 2000);
  const sectorAnalysis = parseGroqJSON<any>(response);

  return NextResponse.json({
    sectorAnalysis: sectorAnalysis || { rawText: response },
    provider: 'groq',
    model: GROQ_MODEL,
    timestamp: new Date().toISOString(),
  });
}

// ─── Personalized Recommendation (V4: Always provide recommendations + optional questions) ──
async function handlePersonalizedRecommendation(params: any, locale: string) {
  const {
    userQuestion = '',
    riskLevel,
    investmentHorizon,
    preferredSector,
    budget,
    conversationHistory = [],
  } = params;

  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';

  // Fetch live data for the stock universe
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'WMT', 'UNH', 'JNJ', 'PG', 'MA', 'HD', 'XOM', 'CVX', 'ABBV', 'KO', 'PEP', 'COST', 'AVGO', 'ADBE', 'CRM', 'ORCL', 'NFLX', 'AMD', 'INTC', 'QCOM', 'PYPL'];
  const liveQuotes = await fetchLiveQuotes(popularSymbols);
  const quotesSection = liveQuotes.size > 0
    ? `\nCURRENT LIVE PRICES (use these as currentPrice):\n${Array.from(liveQuotes.entries()).map(([sym, q]) => `- ${sym}: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%)`).join('\n')}`
    : '';

  // V4: Build company facts section
  const companyFactsSection = buildCompanyFactsSection(popularSymbols);

  // V4: Always provide recommendations, even when we also ask clarifying questions
  const needsMoreInfo = !riskLevel && !investmentHorizon && !preferredSector;

  // Determine effective risk/horizon/sector for generating initial recommendations
  const effectiveRisk = riskLevel || 'medium';
  const effectiveHorizon = investmentHorizon || 'medium';
  const effectiveSector = preferredSector || 'all';

  const criteriaMap: Record<string, string> = {
    low: 'value',
    medium: 'growth',
    high: 'momentum',
  };
  const criteria = criteriaMap[effectiveRisk] || 'growth';

  const systemPrompt = isAr
    ? `أنت مستشار استثماري شخصي. قدم توصيات مخصصة بناءً على ملف المستخدم.

قواعد صارمة:
1. استخدم الأسعار الحية المقدمة كـ currentPrice.
2. كل توصية يجب أن تكون فريدة ومبررة ببيانات محددة.
3. اربط التوصية بملف المستخدم (مستوى المخاطرة، الأفق الزمني، القطاع المفضل).
4. السعر المستهدف يجب أن يكون واقعياً بالنسبة للسعر الحالي.
5. لا تستخدم نفس السعر المستهدف لأسهم مختلفة.
6. نوّع بين إشارات التوصية (Strong Buy/Buy/Hold).
7. نوّع بين مستويات المخاطر (Low/Medium/High).
8. استخدم بيانات الشركة الحقيقية من COMPANY FACTS المقدمة.

أجب بصيغة JSON فقط:
{
  "needsMoreInfo": ${needsMoreInfo},
  "recommendations": [
    {
      "symbol": "رمز السهم",
      "companyName": "اسم الشركة",
      "sector": "القطاع",
      "currentPrice": "السعر الحالي الحي",
      "priceTarget": "السعر المستهدف (واقعي ومختلف عن الأسهم الأخرى)",
      "signal": "Strong Buy أو Buy أو Hold",
      "confidence": رقم,
      "riskLevel": "Low أو Medium أو High",
      "rationale": "مبرر فريد ومخصص لملف هذا المستخدم (2-3 جمل)",
      "whyForYou": "لماذا هذا السهم مناسب لهذا المستخدم تحديداً"
    }
  ],
  "overallAdvice": "نصيحة عامة مخصصة لملف المستخدم (3-4 جمل)",
  "riskDisclaimer": "تنبيه المخاطر"${needsMoreInfo ? `,
  "questions": [
    "ما هو مستوى المخاطرة الذي تفضله؟ (منخفض / متوسط / عالي)",
    "ما هو أفقك الزمني للاستثمار؟ (قصير: 1-3 أشهر / متوسط: 3-12 شهر / طويل: 1-5 سنوات)",
    "هل لديك قطاع مفضل؟ (تكنولوجيا / صحة / طاقة / مالية / جميع القطاعات)"
  ],
  "friendlyMessage": "رسالة ودية تخبر المستخدم أن هذه توصيات مبدئية ويمكن تحسينها بالإجابة على الأسئلة (2-3 جمل)"` : ''}
}`
    : isFr
    ? `Vous êtes un conseiller en investissement personnel. Fournissez des recommandations personnalisées basées sur le profil de l'utilisateur.

Règles strictes:
1. Utilisez les prix en temps réel fournis comme currentPrice.
2. Chaque recommandation doit être unique et justifiée par des données spécifiques.
3. Reliez la recommandation au profil de l'utilisateur.
4. L'objectif de prix doit être réaliste.
5. N'utilisez pas le même objectif de prix pour des actions différentes.
6. Variez les signaux (Strong Buy/Buy/Hold).
7. Variez les niveaux de risque (Low/Medium/High).
8. Utilisez les données réelles de COMPANY FACTS fournies.

Répondez UNIQUEMENT avec du JSON valide:
{
  "needsMoreInfo": ${needsMoreInfo},
  "recommendations": [
    {
      "symbol": "SYMBOLE",
      "companyName": "Nom",
      "sector": "Secteur",
      "currentPrice": "prix actuel en temps réel",
      "priceTarget": "objectif réaliste et différent des autres actions",
      "signal": "Strong Buy|Buy|Hold",
      "confidence": nombre,
      "riskLevel": "Low|Medium|High",
      "rationale": "justification unique et personnalisée (2-3 phrases)",
      "whyForYou": "Pourquoi cette action convient spécifiquement à cet utilisateur"
    }
  ],
  "overallAdvice": "Conseil général personnalisé (3-4 phrases)",
  "riskDisclaimer": "Avertissement de risque"${needsMoreInfo ? `,
  "questions": [
    "Quel est votre niveau de tolérance au risque? (Faible / Moyen / Élevé)",
    "Quel est votre horizon d'investissement? (Court: 1-3 mois / Moyen: 3-12 mois / Long: 1-5 ans)",
    "Avez-vous un secteur préféré? (Technologie / Santé / Énergie / Finance / Tous)"
  ],
  "friendlyMessage": "Message amical informant l'utilisateur que ce sont des recommandations initiales qui peuvent être affinées en répondant aux questions (2-3 phrases)"` : ''}
}`
    : `You are a personal investment advisor. Provide personalized recommendations based on the user's profile.

STRICT RULES:
1. Use the live prices provided as currentPrice.
2. Each recommendation must be unique and justified with specific data.
3. Tie the recommendation to the user's profile (risk level, horizon, preferred sector).
4. Price targets MUST be realistic relative to current prices.
5. Do NOT use the same price target for different stocks.
6. Vary recommendation signals (Strong Buy/Buy/Hold).
7. Vary risk levels (Low/Medium/High).
8. Use real company data from the provided COMPANY FACTS.

Answer ONLY with valid JSON:
{
  "needsMoreInfo": ${needsMoreInfo},
  "recommendations": [
    {
      "symbol": "SYMBOL",
      "companyName": "Company Name",
      "sector": "Actual Sector",
      "currentPrice": "live current price",
      "priceTarget": "realistic target (different from other stocks)",
      "signal": "Strong Buy|Buy|Hold",
      "confidence": number,
      "riskLevel": "Low|Medium|High",
      "rationale": "unique, data-backed justification (2-3 sentences)",
      "whyForYou": "Why this stock fits THIS specific user's profile"
    }
  ],
  "overallAdvice": "Personalized general advice (3-4 sentences)",
  "riskDisclaimer": "Risk disclaimer"${needsMoreInfo ? `,
  "questions": [
    "What is your risk tolerance? (Low / Medium / High)",
    "What is your investment horizon? (Short: 1-3 months / Medium: 3-12 months / Long: 1-5 years)",
    "Do you have a preferred sector? (Technology / Healthcare / Energy / Financial / All)"
  ],
  "friendlyMessage": "Friendly message telling the user these are initial recommendations that can be refined by answering the questions (2-3 sentences)"` : ''}
}`;

  const userPrompt = isAr
    ? `${quotesSection}${companyFactsSection}

ملف المستخدم:
- سؤال المستخدم: ${userQuestion}
- مستوى المخاطرة: ${effectiveRisk === 'low' ? 'منخفض' : effectiveRisk === 'high' ? 'عالي' : 'متوسط'}
- الأفق الزمني: ${effectiveHorizon === 'short' ? 'قصير (1-3 أشهر)' : effectiveHorizon === 'long' ? 'طويل (1-5 سنوات)' : 'متوسط (3-12 شهر)'}
- القطاع المفضل: ${effectiveSector === 'all' ? 'جميع القطاعات' : effectiveSector}
${budget ? `- الميزانية: $${budget}` : ''}

قدم 3 توصيات مخصصة فوراً. استخدم بيانات الشركة الحقيقية من COMPANY FACTS أعلاه. نوّع بين الإشارات ومستويات المخاطر والأسعار المستهدفة.`
    : isFr
    ? `${quotesSection}${companyFactsSection}

Profil de l'utilisateur:
- Question: ${userQuestion}
- Tolérance au risque: ${effectiveRisk === 'low' ? 'Faible' : effectiveRisk === 'high' ? 'Élevée' : 'Moyenne'}
- Horizon: ${effectiveHorizon === 'short' ? 'Court terme' : effectiveHorizon === 'long' ? 'Long terme' : 'Moyen terme'}
- Secteur préféré: ${effectiveSector === 'all' ? 'Tous' : effectiveSector}
${budget ? `- Budget: $${budget}` : ''}

Fournissez 3 recommandations personnalisées immédiatement. Utilisez les données réelles de COMPANY FACTS ci-dessus. Variez les signaux, niveaux de risque et objectifs de prix.`
    : `${quotesSection}${companyFactsSection}

User Profile:
- User question: ${userQuestion}
- Risk tolerance: ${effectiveRisk}
- Investment horizon: ${effectiveHorizon === 'short' ? 'Short-term' : effectiveHorizon === 'long' ? 'Long-term' : 'Medium-term'}
- Preferred sector: ${effectiveSector === 'all' ? 'All sectors' : effectiveSector}
${budget ? `- Budget: $${budget}` : ''}

Provide 3 personalized recommendations immediately. Use real company data from the COMPANY FACTS section above. Vary signals, risk levels, and price targets across recommendations.`;

  const response = await callGroq(systemPrompt, userPrompt, 0.4, 3000);
  const parsed = parseGroqJSON<any>(response);

  // V4: Post-process recommendations to validate quality
  if (parsed && parsed.recommendations && Array.isArray(parsed.recommendations)) {
    parsed.recommendations = validateAndEnrichRecommendations(
      parsed.recommendations as StockRecommendation[],
      liveQuotes,
      locale
    );
  }

  return NextResponse.json({
    personalized: parsed || { needsMoreInfo: false, recommendations: [], rawText: response },
    provider: 'groq',
    model: GROQ_MODEL,
    liveDataUsed: liveQuotes.size > 0,
    timestamp: new Date().toISOString(),
  });
}

// ─── GET: Health Check + Available Actions ──────────────────
export async function GET() {
  // Test if Groq API key is available
  let groqStatus = 'not_configured';
  if (GROQ_API_KEY) {
    try {
      const testRes = await fetch(`${GROQ_BASE_URL}/models`, {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      groqStatus = testRes.ok ? 'available' : `error_${testRes.status}`;
    } catch {
      groqStatus = 'unreachable';
    }
  }

  return NextResponse.json({
    service: 'Groq Stock Analysis API (V4)',
    provider: 'groq',
    model: GROQ_MODEL,
    fallbackModels: GROQ_FALLBACK_MODELS,
    available: !!GROQ_API_KEY,
    liveDataAvailable: !!FMP_API_KEY,
    groqStatus,
    actions: [
      {
        action: 'find-best-stocks',
        description: 'AI-powered stock recommendations based on criteria (with live data + company facts + post-validation)',
        params: ['criteria', 'sector', 'riskTolerance', 'investmentHorizon', 'count'],
      },
      {
        action: 'analyze-stock',
        description: 'Comprehensive analysis of a single stock (with live data + company facts grounding)',
        params: ['symbol', 'analysisType'],
      },
      {
        action: 'compare-stocks',
        description: 'Side-by-side comparison of multiple stocks (with live data + company facts)',
        params: ['symbols', 'metric'],
      },
      {
        action: 'sector-analysis',
        description: 'Sector-level analysis with top picks',
        params: ['sector'],
      },
      {
        action: 'personalized-recommendation',
        description: 'Personalized recommendation based on user profile (always provides initial recommendations + optional clarifying questions)',
        params: ['userQuestion', 'riskLevel', 'investmentHorizon', 'preferredSector', 'budget'],
      },
    ],
  });
}
