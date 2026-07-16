// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// Copyright © 2024–2026 Rouaa (رؤى). All rights reserved.
// PROPRIETARY AND CONFIDENTIAL — See LICENSE file for terms.
// Patent Pending: "System and Method for Automated Financial
// News Classification Based on Tradability Potential"
// ═══════════════════════════════════════════════════════════════
// ─── Multi-Source News Fetcher ──────────────────────────────
// A permanent, reliable news fetching system that works from ANY environment
// Sources: RSS Feeds → Finnhub → Database fallback
// Auto-translates English news to Arabic using AI (Groq/Gemini/GLM/Bedrock)
// No z.ai dependency — uses multi-provider AI service

import { db } from '@/lib/db';
import { translateToArabic, chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { resetDBInit } from '@/lib/db-init';
import { updateProcessingStage } from '@/lib/news-ready';
import { PIPELINE_CONFIG } from '@/lib/pipeline/config';

// ─── z-ai-web-dev-sdk Config Helper (V132) ──────────────────────
// The SDK requires a .z-ai-config file on disk. This helper ensures
// the file exists by checking common paths and creating it from env vars.
let _zaiConfigEnsured = false;

async function ensureZAIConfig(): Promise<boolean> {
  if (_zaiConfigEnsured) return true;

  const zaiBaseUrl = process.env.ZAI_BASE_URL;
  const zaiApiKey = process.env.ZAI_API_KEY;

  if (!zaiBaseUrl || !zaiApiKey) {
    return false; // Can't configure without env vars
  }

  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');

    // Check if config file already exists at common SDK search paths
    const configPaths = [
      path.join(process.cwd(), '.z-ai-config'),
      path.join(os.homedir(), '.z-ai-config'),
      '/etc/.z-ai-config',
    ];

    for (const configPath of configPaths) {
      try {
        await fs.access(configPath);
        _zaiConfigEnsured = true;
        return true; // Config file exists
      } catch {
        // File doesn't exist, continue checking
      }
    }

    // No config file found — create one from env vars
    const configData: Record<string, string> = {
      baseUrl: zaiBaseUrl,
      apiKey: zaiApiKey,
    };
    if (process.env.ZAI_CHAT_ID) configData.chatId = process.env.ZAI_CHAT_ID;
    if (process.env.ZAI_USER_ID) configData.userId = process.env.ZAI_USER_ID;
    if (process.env.ZAI_TOKEN) configData.token = process.env.ZAI_TOKEN;

    const configPath = path.join(process.cwd(), '.z-ai-config');
    await fs.writeFile(configPath, JSON.stringify(configData), 'utf-8');
    console.log('[ZAI] Created .z-ai-config from environment variables');

    _zaiConfigEnsured = true;
    return true;
  } catch (err: any) {
    console.error('[ZAI] Failed to create .z-ai-config:', err.message);
    return false;
  }
}

// ─── Deep String Conversion Helper ─────────────────────────────
// Converts any value (string, array of strings, array of objects, object)
// into a clean string. Prevents [object Object] from appearing in content.
function deepToString(val: any): string {
  if (val == null) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'string') {
    // V16 FIX: Detect double-encoded JSON strings
    // AI sometimes returns JSON nested inside a string field, e.g.:
    //   "introduction": "{\"introduction\": \"actual text\", ...}"
    // This produces raw JSON text in fullContent instead of Arabic text.
    // We detect this and recursively extract the actual text.
    const trimmed = val.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'object' && parsed !== null) {
          // Recursively extract text from the parsed object
          const extracted = extractArabicTextFromObject(parsed);
          if (extracted && extracted.length > 20 && /[\u0600-\u06FF]/.test(extracted)) {
            return extracted;
          }
        }
      } catch {
        // Not valid JSON — return as-is
      }
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .map(item => {
        if (typeof item === 'string') return item;
        if (item != null && typeof item === 'object') {
          // Try common text fields in order of preference
          if (typeof item.text === 'string') return item.text;
          if (typeof item.content === 'string') return item.content;
          if (typeof item.value === 'string') return item.value;
          if (typeof item.paragraph === 'string') return item.paragraph;
          if (typeof item.p === 'string') return item.p;
          // If it's a simple object with one string value, extract it
          const vals = Object.values(item).filter(v => typeof v === 'string') as string[];
          if (vals.length === 1) return vals[0];
          // Last resort: JSON stringify (better than [object Object])
          try { return JSON.stringify(item); } catch { return ''; }
        }
        return typeof item === 'string' ? item : '';
      })
      .filter(s => s.length > 0)
      .join('\n\n');
  }
  if (typeof val === 'object') {
    // Single object — try to extract text
    if (typeof val.text === 'string') return val.text;
    if (typeof val.content === 'string') return val.content;
    if (typeof val.value === 'string') return val.value;
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return String(val);
}

// V16 FIX: Extract the best Arabic text from a parsed JSON object.
// When AI returns double-encoded JSON (JSON inside a string field),
// we need to recursively extract the actual Arabic text content.
// Priority: articleBody > body > introduction > content > conclusion
function extractArabicTextFromObject(obj: any): string {
  if (!obj || typeof obj !== 'object') return '';
  
  // Try the most content-rich fields first
  const textFields = ['articleBody', 'body', 'introduction', 'content', 'conclusion', 'text'];
  const parts: string[] = [];
  
  for (const field of textFields) {
    if (obj[field]) {
      const text = deepToString(obj[field]); // recursive — handles further nesting
      if (text && text.length > 20 && /[\u0600-\u06FF]/.test(text)) {
        parts.push(text);
      }
    }
  }
  
  if (parts.length > 0) return parts.join('\n\n');
  
  // If no standard fields worked, try all string values that contain Arabic
  for (const value of Object.values(obj)) {
    if (typeof value === 'string' && value.length > 20 && /[\u0600-\u06FF]/.test(value)) {
      parts.push(value);
    }
  }
  
  return parts.join('\n\n');
}

// Clean [object Object] artifacts from any text
function cleanObjectArtifacts(text: string): string {
  if (!text) return text;
  return text
    .replace(/\[object Object\]/g, '')
    .replace(/\[object\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Text Similarity Helper ─────────────────────────────────
// Calculates Jaccard similarity between two texts using word sets.
// Used to detect when contentAr was wrongly filled with AI analysis text.
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const normalize = (t: string) => t.replace(/[\s\n]+/g, ' ').trim().toLowerCase();
  const words1 = new Set(normalize(text1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalize(text2).split(' ').filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

// ─── URL-Safe Base64 Helpers ─────────────────────────────────
export function toUrlSafeBase64(str: string): string {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromUrlSafeBase64(b64: string): string {
  let str = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

// ─── Category Default Images (V162: AI-generated via Pollinations.ai) ──
// V162 FIX: All Unsplash URLs replaced with Pollinations.ai AI-generated images.
// Assigns a category-specific AI image immediately when a new article is created.
// This ensures NO article is ever published without an image.
// The AI-generated image from the pipeline will replace this later if successful.
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'أسهم': 'https://image.pollinations.ai/prompt/stock%20market%20trading%20floor%20with%20digital%20charts?width=1200&height=675&nologo=true&seed=stocks14&model=flux',
  'كريبتو': 'https://image.pollinations.ai/prompt/cryptocurrency%20blockchain%20network%20glowing%20nodes?width=1200&height=675&nologo=true&seed=crypto14&model=flux',
  'عملات رقمية': 'https://image.pollinations.ai/prompt/cryptocurrency%20digital%20coins%20blockchain%20visualization?width=1200&height=675&nologo=true&seed=digital14&model=flux',
  'طاقة': 'https://image.pollinations.ai/prompt/oil%20refinery%20at%20sunset%20energy%20infrastructure?width=1200&height=675&nologo=true&seed=energy14&model=flux',
  'اقتصاد أمريكي': 'https://image.pollinations.ai/prompt/wall%20street%20american%20flag%20financial%20district?width=1200&height=675&nologo=true&seed=usecon14&model=flux',
  'عملات': 'https://image.pollinations.ai/prompt/world%20currencies%20floating%20exchange%20rate?width=1200&height=675&nologo=true&seed=currency14&model=flux',
  'فوركس': 'https://image.pollinations.ai/prompt/forex%20trading%20screen%20candlestick%20charts?width=1200&height=675&nologo=true&seed=forex14&model=flux',
  'بنوك مركزية': 'https://image.pollinations.ai/prompt/grand%20central%20bank%20building%20monetary%20policy?width=1200&height=675&nologo=true&seed=cbank14&model=flux',
  'أسواق عربية': 'https://image.pollinations.ai/prompt/middle%20eastern%20financial%20district%20modern%20skyscrapers?width=1200&height=675&nologo=true&seed=arabmkt14&model=flux',
  'سلع': 'https://image.pollinations.ai/prompt/gold%20bars%20crude%20oil%20barrels%20professional?width=1200&height=675&nologo=true&seed=commod14&model=flux',
  'عقارات': 'https://image.pollinations.ai/prompt/modern%20real%20estate%20luxury%20buildings?width=1200&height=675&nologo=true&seed=realest14&model=flux',
  'تقنية': 'https://image.pollinations.ai/prompt/futuristic%20technology%20AI%20digital%20transformation?width=1200&height=675&nologo=true&seed=tech14&model=flux',
  'سياسة': 'https://image.pollinations.ai/prompt/government%20building%20policy%20documents?width=1200&height=675&nologo=true&seed=politics14&model=flux',
  'أرباح شركات': 'https://image.pollinations.ai/prompt/corporate%20earnings%20profit%20charts%20growth?width=1200&height=675&nologo=true&seed=earnings14&model=flux',
  'اقتصاد كلي': 'https://image.pollinations.ai/prompt/global%20economy%20interconnected%20financial%20networks?width=1200&height=675&nologo=true&seed=macro14&model=flux',
  'عاجل': 'https://image.pollinations.ai/prompt/breaking%20news%20studio%20financial%20ticker?width=1200&height=675&nologo=true&seed=urgent14&model=flux',
  'stocks': 'https://image.pollinations.ai/prompt/stock%20market%20trading%20floor%20with%20digital%20charts?width=1200&height=675&nologo=true&seed=stocks14en&model=flux',
  'crypto': 'https://image.pollinations.ai/prompt/cryptocurrency%20blockchain%20network%20glowing%20nodes?width=1200&height=675&nologo=true&seed=crypto14en&model=flux',
  'forex': 'https://image.pollinations.ai/prompt/forex%20trading%20screen%20candlestick%20charts?width=1200&height=675&nologo=true&seed=forex14en&model=flux',
  'energy': 'https://image.pollinations.ai/prompt/oil%20refinery%20at%20sunset%20energy%20infrastructure?width=1200&height=675&nologo=true&seed=energy14en&model=flux',
  'economy': 'https://image.pollinations.ai/prompt/global%20economy%20interconnected%20financial%20networks?width=1200&height=675&nologo=true&seed=economy14en&model=flux',
};

function getCategoryDefaultImage(category: string | undefined): string {
  return CATEGORY_DEFAULT_IMAGES[category || ''] || CATEGORY_DEFAULT_IMAGES['اقتصاد كلي'];
}

// ─── Types ──────────────────────────────────────────────────
export interface NewsItem {
  id?: string;
  title: string;
  titleAr?: string;
  summary: string;
  summaryAr?: string;
  url: string;
  source: string;
  date: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  impactLevel: 'high' | 'medium' | 'low';
  impactScore: number; // V101: 0-100 importance score
  language: 'ar' | 'en';
  imageUrl?: string;
  views?: number; // Article view count
}

export interface FetchResult {
  source: string;
  items: NewsItem[];
  duration: number;
  error?: string;
}

// ─── RSS Feed Sources (FREE & PERMANENT) ────────────────────
// V400: Massive expansion — 100+ EN + 14 AR sources for comprehensive coverage
const RSS_FEEDS = [
  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH STOCKS & MARKETS ──────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', category: 'أسهم', language: 'en' as const },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', category: 'أسهم', language: 'en' as const },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', category: 'اقتصاد أمريكي', language: 'en' as const },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839135', category: 'أسهم', language: 'en' as const },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=102811518', category: 'أسهم', language: 'en' as const },
  { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', category: 'أسهم', language: 'en' as const },
  { url: 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse', category: 'أسهم', language: 'en' as const },
  { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://seekingalpha.com/market_currents.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.benzinga.com/feed', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.fool.com/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.morningstar.com/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headlines', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.nasdaqtrader.com/RSS.aspx?RSSFeed=News&RSSFeed=EquityAlerts', category: 'أسهم', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH ECONOMY & MACRO ──────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.economist.com/finance-and-economics/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.economist.com/international/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.investing.com/rss/news_301.rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.businessinsider.com/custom/all', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://news.google.com/rss/search?q=financial+markets+economy+stocks&hl=en-US&gl=US&ceid=US:en', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.theguardian.com/business/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.theguardian.com/money/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ft.com/rss/home', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://rss.cnn.com/rss/money_news_economy.rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://rss.dw.com/rdf/dw-en-biz', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://rss.dw.com/rdf/dw-en-world', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.france24.com/en/business-tech/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.forbes.com/markets/feed/', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.forbes.com/innovation/feed2', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.apnews.com/rss/apf-topnews', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.npr.org/1001/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://api.axios.com/feed', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH FOREX ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001447', category: 'عملات', language: 'en' as const },
  { url: 'https://investinglive.com/feed/', category: 'عملات', language: 'en' as const },
  { url: 'https://www.investing.com/rss/news_119.rss', category: 'عملات', language: 'en' as const },
  { url: 'https://www.fxstreet.com/rss', category: 'عملات', language: 'en' as const },
  { url: 'https://www.dailyfx.com/feeds/all', category: 'عملات', language: 'en' as const },
  { url: 'https://www.litefinance.org/rss', category: 'عملات', language: 'en' as const },
  { url: 'https://www.myfxbook.com/rss', category: 'عملات', language: 'en' as const },
  { url: 'https://www.instaforex.com/forex_rss', category: 'عملات', language: 'en' as const },
  { url: 'https://www.forexcrunch.com/feed/', category: 'عملات', language: 'en' as const },
  { url: 'https://www.babypips.com/feeds/all', category: 'عملات', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH CRYPTO ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss', category: 'كريبتو', language: 'en' as const },
  { url: 'https://cointelegraph.com/rss', category: 'كريبتو', language: 'en' as const },
  { url: 'https://cointelegraph.com/rss/tag/ethereum', category: 'كريبتو', language: 'en' as const },
  { url: 'https://cointelegraph.com/rss/tag/bitcoin', category: 'كريبتو', language: 'en' as const },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910', category: 'كريبتو', language: 'en' as const },
  { url: 'https://decrypt.co/feed', category: 'كريبتو', language: 'en' as const },
  { url: 'https://cryptoslate.com/feed/', category: 'كريبتو', language: 'en' as const },
  { url: 'https://cryptopotato.com/feed/', category: 'كريبتو', language: 'en' as const },
  { url: 'https://cryptonews.com/news/feed/', category: 'كريبتو', language: 'en' as const },
  { url: 'https://thedefiant.io/feed/', category: 'كريبتو', language: 'en' as const },
  { url: 'https://bitcoinmagazine.com/.rss/full/', category: 'كريبتو', language: 'en' as const },
  { url: 'https://www.theblock.co/rss', category: 'كريبتو', language: 'en' as const },
  { url: 'https://smartliquidity.info/feed/', category: 'كريبتو', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH ENERGY ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://oilprice.com/rss/main', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.spglobal.com/energy/en/news-research/rss-feed', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.rigzone.com/news/rss.asp', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.eia.gov/rss/today_in_energy.xml', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.energyintel.com/rss-feed', category: 'طاقة', language: 'en' as const },
  { url: 'https://cleantechnica.com/feed', category: 'طاقة', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH COMMODITIES ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.investing.com/rss/news_11.rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.gold.org/rss/insights', category: 'سلع', language: 'en' as const },
  { url: 'https://www.kitco.com/news/rss.xml', category: 'سلع', language: 'en' as const },
  { url: 'https://www.investing.com/rss/news_302.rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.investing.com/rss/news_303.rss', category: 'سلع', language: 'en' as const },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100001909', category: 'سلع', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH BONDS & CENTRAL BANKS ────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100001985', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.investing.com/rss/news_305.rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.investing.com/rss/news_300.rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH TECHNOLOGY ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://techcrunch.com/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://techcrunch.com/startups/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://venturebeat.com/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.wired.com/feed/rss', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'تقنية', language: 'en' as const },
  { url: 'https://arstechnica.com/open-source/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.technologyreview.com/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://spectrum.ieee.org/rss/fulltext', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.cbinsights.com/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://pitchbook.com/news/rss', category: 'تقنية', language: 'en' as const },
  { url: 'https://stratechery.com/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://a16z.com/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://review.firstround.com/rss', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.fastcompany.com/rss', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.inc.com/rss', category: 'تقنية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENGLISH GEOPOLITICS & WORLD ──────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://rss.dw.com/rdf/dw-en-biz', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://rss.dw.com/rdf/dw-en-world', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.france24.com/en/business-tech/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ft.com/rss/home', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://rss.cnn.com/rss/money_news_economy.rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.theguardian.com/business/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.theguardian.com/money/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://feeds.washingtonpost.com/rss/national', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://theintercept.com/feed/?lang=en', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://foreignpolicy.com/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.politico.com/rss/politicopicks.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.theguardian.com/world/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.investing.com/rss/news_291.rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.marketwatch.com/rss/headliner', category: 'اقتصاد كلي', language: 'en' as const },
  // RT (Russia Today) English — alternative perspective on global news
  { url: 'https://www.rt.com/rss/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.rt.com/rss/business/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.rt.com/rss/usa/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.rt.com/rss/uk/', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ARABIC FINANCIAL NEWS — VERIFIED WORKING (V212, tested 2026-05-17) ──
  // ═══════════════════════════════════════════════════════════
  // Sky News Arabia Business — 100 items, 59% financial, EXCELLENT quality
  { url: 'https://www.skynewsarabia.com/rss/business.xml', category: 'اقتصاد كلي', language: 'ar' as const },
  // Sky News Arabia Technology — 100 items, covers tech/business intersection (Apple, AI, etc.)
  { url: 'https://www.skynewsarabia.com/rss/technology.xml', category: 'تقنية', language: 'ar' as const },
  // RT Arabic Economy — 100 items, Arabic financial/economic news (some politics, filtered by pipeline)
  { url: 'https://arabic.rt.com/rss/?category=economy', category: 'اقتصاد كلي', language: 'ar' as const },
  // Investing.com Arabic — 10 items, high-quality Arabic financial news (stocks, crypto, forex)
  { url: 'https://sa.investing.com/rss/news_301.rss', category: 'أسهم', language: 'ar' as const },
  // Investing.com Arabic General — 10 items, broader financial coverage in Arabic
  { url: 'https://sa.investing.com/rss/news.rss', category: 'اقتصاد كلي', language: 'ar' as const },
  // CNN Arabic — 20 items, general Arabic news (needs financial filter, but some business coverage)
  { url: 'https://arabic.cnn.com/rss.xml', category: 'اقتصاد كلي', language: 'ar' as const },
  // Al Jazeera RSS — 25 items, general Arabic news (financial items filtered by pipeline)
  { url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9', category: 'اقتصاد كلي', language: 'ar' as const },
  // France24 Arabic Economy — 29 items, 53% financial, EXCELLENT Arabic economic coverage (energy, oil, trade)
  { url: 'https://www.france24.com/ar/%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF/rss', category: 'اقتصاد كلي', language: 'ar' as const },
  // QNA (Qatar News Agency) Economy Local — 40+ items, PURE economic news (stocks, trade, investment, oil)
  { url: 'https://qna.org.qa/ar-QA/Pages/RSS-Feeds/Economy-Local', category: 'اقتصاد كلي', language: 'ar' as const },
  // QNA (Qatar News Agency) Economy International — 30+ items, global economic news in Arabic (oil, markets, trade)
  { url: 'https://qna.org.qa/ar-QA/Pages/RSS-Feeds/Economy-International', category: 'اقتصاد كلي', language: 'ar' as const },
  // Al Khaleej (UAE) Economy — 20+ items, Gulf economic news (crypto, markets, commodities)
  { url: 'https://www.alkhaleej.ae/rssFeed/158', category: 'اقتصاد كلي', language: 'ar' as const },
  // Al Khaleej (UAE) Arab & World — 20+ items, general news with economic content
  { url: 'https://www.alkhaleej.ae/rssFeed/159', category: 'اقتصاد كلي', language: 'ar' as const },
  // Sputnik Arabic — 100+ items, general news with business/economy section (mixed, pipeline filters)
  { url: 'https://sarabic.ae/export/rss2/archive/index.xml', category: 'اقتصاد كلي', language: 'ar' as const },
  // Al Watan (Saudi) Economy — 20+ items, Saudi economic & business news
  { url: 'https://www.alwatan.com.sa/rssFeed/2', category: 'اقتصاد كلي', language: 'ar' as const },

  // ═══════════════════════════════════════════
  // ── NEW SOURCES V402 — Enhanced Arabic Economic Coverage ──
  // ═══════════════════════════════════════════

  // ── Al Bayan (UAE) Economy — Gulf economic & business news ──
  { url: 'https://www.albayan.ae/rss/economy.xml', category: 'اقتصاد كلي', language: 'ar' as const },

  // ── Al Masry Al Youm (Egypt) Economy — Egyptian economic news ──
  { url: 'https://www.almasryalyoum.com/rss/Economy', category: 'اقتصاد كلي', language: 'ar' as const },

  // ── Al Ghad (Jordan) Economy — Jordanian & regional economic news ──
  { url: 'https://www.alghad.com/rss/economy.xml', category: 'اقتصاد كلي', language: 'ar' as const },

  // ── Google News AR — أسواق مالية عربية ──
  { url: 'https://news.google.com/rss/search?q=%D8%A3%D8%B3%D9%88%D8%A7%D9%82+%D9%85%D8%A7%D9%84%D9%8A%D8%A9+%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9+%D8%AA%D8%AF%D8%A7%D9%88%D9%84+%D8%A3%D8%B3%D9%87%D9%85&hl=ar&gl=EG&ceid=EG:ar', category: 'أسهم', language: 'ar' as const },

  // ── Google News AR — بنوك مركزية وسياسة نقدية ──
  { url: 'https://news.google.com/rss/search?q=%D8%A8%D9%86%D9%88%D9%83+%D9%85%D8%B1%D9%83%D8%B2%D9%8A%D8%A9+%D8%B3%D9%8A%D8%A7%D8%B3%D8%A9+%D9%86%D9%82%D8%AF%D9%8A%D8%A9+%D9%81%D8%A7%D8%A6%D8%AF%D8%A9&hl=ar&gl=EG&ceid=EG:ar', category: 'بنوك مركزية', language: 'ar' as const },

  // ── Google News AR — عقارات وخليج ──
  { url: 'https://news.google.com/rss/search?q=%D8%B9%D9%82%D8%A7%D8%B1%D8%A7%D8%AA+%D8%AE%D9%84%D9%8A%D8%AC+%D8%A5%D9%85%D8%A7%D8%B1%D8%A7%D8%AA+%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9+%D8%A7%D8%B3%D8%AA%D8%AB%D9%85%D8%A7%D8%B1&hl=ar&gl=EG&ceid=EG:ar', category: 'عقارات', language: 'ar' as const },

  // ── Google News AR — عملات رقمية وكريبتو عربي ──
  { url: 'https://news.google.com/rss/search?q=%D8%B9%D9%85%D9%84%D8%A7%D8%AA+%D8%B1%D9%82%D9%85%D9%8A%D8%A9+%D9%83%D8%B1%D9%8A%D8%A8%D8%AA%D9%88+%D8%A8%D9%84%D9%88%D9%83%D8%AA%D8%B4%D9%8A%D9%86&hl=ar&gl=EG&ceid=EG:ar', category: 'كريبتو', language: 'ar' as const },

  // ── Google News AR — تجارة دولية ──
  { url: 'https://news.google.com/rss/search?q=%D8%AA%D8%AC%D8%A7%D8%B1%D8%A9+%D8%AF%D9%88%D9%84%D9%8A%D8%A9+%D9%88%D8%A7%D8%B1%D8%AF%D8%A7%D8%AA+%D8%B5%D8%A7%D8%AF%D8%B1%D8%A7%D8%AA+%D8%AE%D9%84%D9%8A%D8%AC&hl=ar&gl=EG&ceid=EG:ar', category: 'اقتصاد كلي', language: 'ar' as const },

  // ── Google News AR — أرباح شركات ──
  { url: 'https://news.google.com/rss/search?q=%D8%A3%D8%B1%D8%A8%D8%A7%D8%AD+%D8%B4%D8%B1%D9%83%D8%A7%D8%AA+%D9%82%D9%88%D8%A7%D8%A6%D9%85+%D9%85%D8%A7%D9%84%D9%8A%D8%A9+%D8%AA%D9%82%D8%A7%D8%B1%D9%8A%D8%B1&hl=ar&gl=EG&ceid=EG:ar', category: 'أرباح شركات', language: 'ar' as const },

  // ── REMOVED dead feeds (tested 2026-05-17/09) ──
  // Reuters: Connection refused | FXStreet: 403 | ZeroHedge: 404
  // Yahoo Finance RSS: only 1 item, unreliable
  // Al Jazeera economy: 404 | Argaam: 404 | Mubasher: 403
  // Al Arabiya: 403 | Asharq Business: 403 | Zawya: 403 | Hespress: 403
  // France24 Arabic general: 403 | DW Arabic: empty content

  // ═══════════════════════════════════════════════════════════
  // ── WIRE SERVICES & PRESS RELEASES ───────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://feeds.content.dowjones.io/public/rss/SB10001424053111904194604576566112592411558', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.prnewswire.com/rss/business-technology-latest-news/rss.xml', category: 'أرباح شركات', language: 'en' as const },
  { url: 'https://www.prnewswire.com/rss/financial-services-latest-news/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.businesswire.com/portal/site/home/rss/?ndmViewId=news_view&newsLang=en&category=financial', category: 'أرباح شركات', language: 'en' as const },
  { url: 'https://www.globenewswire.com/RssFeed/industry/1400/Financial%20Services', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── CENTRAL BANKS ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.federalreserve.gov/feeds/speeches.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.ecb.europa.eu/rss/press.html', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bankofengland.co.uk/news/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bankofcanada.ca/content_type/press-releases/feed/', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rba.gov.au/rss/rss-cb-media-releases.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.snb.ch/en/snb/about/snb_pub/id/snb_pub_rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB+EN/RSS', category: 'بنوك مركزية', language: 'tr' as const },
  { url: 'https://www.bis.org/list/press/index.rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── INTERNATIONAL FINANCIAL INSTITUTIONS ─────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.imf.org/en/Countries?type=news&period=any& rss=1', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.worldbank.org/en/news/all/newsrss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.wto.org/library/rss/statistics_news_e.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.oecd.org/newsroom/rss/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.afdb.org/en/news-and-events/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.adb.org/rss/news', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── GOVERNMENT ECONOMIC DATA ─────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.bls.gov/feed/release.rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.bea.gov/news/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://home.treasury.gov/rss/press-releases', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://ec.europa.eu/eurostat/rss/news', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ENERGY & COMMODITIES ─────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.eia.gov/rss/today_in_energy.xml', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.iea.org/rss/', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.opec.org/rss/rss.xml', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.gold.org/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.cmegroup.com/rss/', category: 'سلع', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── CREDIT RATING AGENCIES ───────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.fitchratings.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.moodys.com/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── FINANCIAL REGULATORS ─────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.sec.gov/rss/press.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.sec.gov/rss/litigation/litreleases.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cftc.gov/PressRoom/RSS/rss_press.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.fca.org.uk/news/rss/news-feed.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.esma.europa.eu/rss-news', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.eba.europa.eu/rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── SOVEREIGN WEALTH FUNDS ───────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.pif.gov.sa/en/Pages/RSS.aspx', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.nbim.no/en/news/feed/', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ECONOMIC THINK TANKS ─────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.brookings.edu/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.piie.com/rss/feeds/all', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.nber.org/rss_feed_33063/new_papers', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://cepr.org/rss/insights.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.bruegel.org/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.atlanticcouncil.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── MULTILATERAL DEVELOPMENT BANKS ───────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.eib.org/en/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ebrd.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.aiib.org/rss/press-releases.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.iadb.org/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.isdb.org/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ISLAMIC FINANCE ──────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.ifsb.org/rss/press.xml', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── REGIONAL FINANCIAL NEWS — FRENCH ─────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://services.lesechos.fr/rss/les-echos-une.xml', category: 'اقتصاد كلي', language: 'fr' as const },
  { url: 'https://services.lesechos.fr/rss/les-echos-economie.xml', category: 'اقتصاد كلي', language: 'fr' as const },
  { url: 'https://services.lesechos.fr/rss/les-echos-finance.xml', category: 'أسهم', language: 'fr' as const },
  { url: 'https://www.latribune.fr/feed.xml', category: 'اقتصاد كلي', language: 'fr' as const },

  // ═══════════════════════════════════════════════════════════
  // ── REGIONAL FINANCIAL NEWS — TURKISH ────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.dunya.com/rss', category: 'اقتصاد كلي', language: 'tr' as const },
  { url: 'https://www.bloomberght.com/rss', category: 'أسهم', language: 'tr' as const },

  // ═══════════════════════════════════════════════════════════
  // ── REGIONAL FINANCIAL NEWS — SPANISH ────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.eleconomista.es/rss/rss_feed.php?r=all', category: 'اقتصاد كلي', language: 'es' as const },
  { url: 'https://cincodias.elpais.com/rss/rss.html', category: 'اقتصاد كلي', language: 'es' as const },
  { url: 'https://www.expansion.com/rss', category: 'أسهم', language: 'es' as const },

  // ═══════════════════════════════════════════════════════════
  // ── MAJOR COMMODITY COMPANIES ────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.glencore.com/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.riotinto.com/en/news/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.bhp.com/news/rss', category: 'سلع', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── INSURANCE REGULATORS ─────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.eiopa.europa.eu/rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ADDITIONAL CENTRAL BANKS ─────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.banxico.org.mx/rss/prensa.html', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.riksbank.se/en-gb/rss/press-releases/', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.norges-bank.no/en/news/RSS/', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nationalbanken.dk/en/rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── STOCK EXCHANGES ──────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.nyse.com/rss/press-releases', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.nasdaq.com/rss/rss-feed?category=Markets', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.londonstockexchange.com/rss/news', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.hkex.com.hk/rss/news', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.deutsche-boerse.com/dbg-en/rss/news', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.euronext.com/en/rss/news', category: 'أسهم', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── BANK RESEARCH DIVISIONS ──────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://economic-research.bnpparibas.com/rss', category: 'اقتصاد كلي', language: 'fr' as const },
  { url: 'https://www.dbresearch.com/RSS/profil/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── FINTECH & PAYMENTS ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.paymentsdive.com/feeds/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.bankingdive.com/feeds/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.fintechweekly.com/feed', category: 'تقنية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── TRADE ASSOCIATIONS ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.uschamber.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.sifma.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.iif.com/feed', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── REAL ESTATE ECONOMICS ────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.cbre.com/about-us/media-center/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ARABIC REGIONAL FINANCIAL ────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://gulfbusiness.com/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.arabianbusiness.com/feed', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ADDITIONAL INTERNATIONAL NEWS ────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.economist.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.france24.com/en/business-tech/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.dw.com/en/business/s-1431/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── FEDERAL RESERVE BANKS (REGIONAL) ─────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.newyorkfed.org/rss/news', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.frbsf.org/research-and-insights/rss/', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.frbatlanta.org/rss/news.cfm', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.chicagofed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.stlouisfed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.dallasfed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.clevelandfed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.kansascityfed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.philadelphiafed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://richmondfed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.minneapolisfed.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bostonfed.org/rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ALL CENTRAL BANKS WORLDWIDE (BIS members) ───────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.banque-france.fr/en/rss.xml', category: 'بنوك مركزية', language: 'fr' as const },
  { url: 'https://www.bportugal.pt/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bportugal.pt/pt/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bde.es/webbde/es/secciones/sala_prensa/RSS', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bportugal.pt/pt/rss', category: 'بنوك مركزية', language: 'pt' as const },
  { url: 'https://www.banxico.org.mx/rss/prensa.html', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcrp.gob.pe/rss.html', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcb.gov.br/rss', category: 'بنوك مركزية', language: 'pt' as const },
  { url: 'https://www.bccr.fi.cr/en/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcentral.cl/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcv.org.ve/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcr.gob.sv/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcn.gob.ni/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.banguat.gob.gt/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcp.gov.py/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcra.gob.ar/RSS/rss.asp', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bch.hn/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.banrep.gov.co/en/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcv.cv/rss', category: 'بنوك مركزية', language: 'pt' as const },
  { url: 'https://www.bancentral.gov.do/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.rbi.org.in/Scripts/RSS.aspx', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rbi.org.in/Scripts/RSS_RbiNotification.aspx', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bnm.gov.my/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bsp.gov.ph/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.mas.gov.sg/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rbnz.govt.nz/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rba.gov.au/rss/rss-cb-media-releases.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bok.or.kr/eng/rss.do', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bot.or.th/english/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.boj.or.jp/en/rss/index.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.sbv.gov.vn/webcenter/portal/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.pbc.gov.cn/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbr.ru/eng/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB+EN/RSS', category: 'بنوك مركزية', language: 'tr' as const },
  { url: 'https://www.cbar.az/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbar.az/rss-az', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbj.gov.jo/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbk.gov.kw/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.qcb.gov.qa/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbo.gov.om/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbi.ir/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.sbp.org.pk/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bdl.gov.lb/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.pma.ps/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbl.gov.ly/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbsl.gov.lk/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nrb.org.np/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bb.org.bd/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbp.pl/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbs.rs/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cnb.cz/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbrm.mk/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbbh.ba/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bsi.si/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.hnb.hr/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbs.sk/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bnr.ro/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bnb.bg/RSS', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cba.am/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbrb.by/engl/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://bank.gov.ua/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nationalbank.kz/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbt.tj/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbu.uz/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cb.gov.sy/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbi.iq/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cby-ye.com/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbt.tm/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.mongolbank.mn/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bol.gov.la/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bank.lv/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.lb.lt/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.eestipank.ee/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cb.is/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bcl.lu/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbcg.me/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bcsm.sm/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.centralbank.cy/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.centralbankmalta.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bankofgreece.gr/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bankofalbania.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bkam.ma/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bct.gov.tn/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbe.org.eg/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bna.ao/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bcc.cd/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bnr.rw/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.boz.zm/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bon.com.na/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rbm.mw/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bog.gov.gh/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbn.gov.ng/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bsl.gov.sl/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bou.or.ug/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bnr.rw/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bom.mu/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bot.go.tz/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bcm.co.mz/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bancomoc.mz/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.resbank.co.za/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bcv.cv/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bcrg-guinee.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.beac.int/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bceao.int/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbg.gm/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbl.org.lr/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.brh.ht/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbb.gov.bh/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cimoney.com.ky/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bma.bm/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.centralbankbahamas.com/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.central-bank.org.tt/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.centralbank.cw/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.eccb-centralbank.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbs.sc/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbs.gov.ws/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rbf.gov.fj/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bankpng.gov.pg/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rbv.gov.vu/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.reservebank.to/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbsi.com.sb/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rma.org.bt/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.mma.gov.mv/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.amcm.gov.mo/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bcc.bb/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbe.gov.et/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bancaditalia.it/rss', category: 'بنوك مركزية', language: 'it' as const },
  { url: 'https://www.oenb.at/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bportugal.pt/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.suomenpankki.fi/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.dnb.nl/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbb.be/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.centralbank.ie/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbg.gov.ge/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbkr.kg/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.nbc.org.kh/english/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.dab.gov.af/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bqk-kos.org/?lang=en&rss=1', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cbvs.sr/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bankofguyana.org.gy/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bc.gob.cu/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.banconal.com.pa/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bcb.gob.bo/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.bce.fin.ec/en/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.boi.org.il/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bdcb.gov.bn/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bportugal.pt/pt/rss', category: 'بنوك مركزية', language: 'pt' as const },
  { url: 'https://www.banky-foibe.mg/rss', category: 'بنوك مركزية', language: 'fr' as const },
  { url: 'https://english.mnb.hu/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.rbz.co.zw/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bank-of-algeria.dz/rss', category: 'بنوك مركزية', language: 'fr' as const },
  { url: 'https://www.bankofbotswana.bw/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bma.bm/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bportugal.pt/pt/rss', category: 'بنوك مركزية', language: 'pt' as const },
  { url: 'https://www.sama.gov.sa/en-us/Pages/RSS.aspx', category: 'بنوك مركزية', language: 'ar' as const },
  { url: 'https://www.cbos.gov.sd/en/rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── FINANCE/TREASURY MINISTRIES ──────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://home.treasury.gov/rss/press-releases', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.gov.uk/government/organisations/hm-treasury.atom', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.bundesfinanzministerium.de/Monatsschau/rss.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.economie.gouv.fr/rss', category: 'بنوك مركزية', language: 'fr' as const },
  { url: 'https://www.mef.gov.it/en/rss/', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.minhafp.gob.es/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.cbo.gov/rss/budget', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.trade.gov/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── SECURITIES REGULATORS (IOSCO members) ────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.sec.gov/rss/press.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.sec.gov/rss/litigation/litreleases.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cftc.gov/PressRoom/RSS/rss_press.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.fca.org.uk/news/rss/news-feed.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.esma.europa.eu/rss-news', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.eba.europa.eu/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.baFin.de/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.amf-france.org/en/rss', category: 'بنوك مركزية', language: 'fr' as const },
  { url: 'https://www.consob.it/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.cnmv.es/rss', category: 'بنوك مركزية', language: 'es' as const },
  { url: 'https://www.cmb.gov.tr/en/rss', category: 'بنوك مركزية', language: 'tr' as const },
  { url: 'https://www.sca.gov.ae/en/rss', category: 'بنوك مركزية', language: 'ar' as const },
  { url: 'https://www.cma.org.sa/en/rss', category: 'بنوك مركزية', language: 'ar' as const },
  { url: 'https://www.sebi.gov.in/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.sfc.hk/en/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.mas.gov.sg/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.sc.com.my/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.asic.gov.au/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.osc.ca.gov/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.csa-acvm.ca/rss', category: 'بنوك مركزية', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── STATISTICS OFFICES WORLDWIDE ─────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.bls.gov/feed/release.rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.bea.gov/news/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.census.gov/rss/econ.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://ec.europa.eu/eurostat/rss/news', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.stats.gov.cn/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ons.gov.uk/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.insee.fr/en/rss', category: 'اقتصاد كلي', language: 'fr' as const },
  { url: 'https://www.destatis.de/EN/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.istat.it/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ine.es/rss', category: 'اقتصاد كلي', language: 'es' as const },
  { url: 'https://www.tuik.gov.tr/rss', category: 'اقتصاد كلي', language: 'tr' as const },
  { url: 'https://www.stats.gov.sa/en/rss', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.statcan.gc.ca/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.abs.gov.au/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.stat.go.jp/english/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ibge.gov.br/rss', category: 'اقتصاد كلي', language: 'pt' as const },
  { url: 'https://www.inegi.org.mx/rss', category: 'اقتصاد كلي', language: 'es' as const },
  { url: 'https://www.rosstat.gov.ru/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.mospi.gov.in/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.statsa.gov.za/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ibs.gov.pk/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.dane.gov.co/rss', category: 'اقتصاد كلي', language: 'es' as const },
  { url: 'https://www.ine.cl/rss', category: 'اقتصاد كلي', language: 'es' as const },

  // ═══════════════════════════════════════════════════════════
  // ── SOVEREIGN WEALTH FUNDS & PENSION FUNDS ───────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.pif.gov.sa/en/Pages/RSS.aspx', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.nbim.no/en/news/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://news.calpers.ca.gov/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.cppinvestments.com/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.gic.com.sg/news/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.temasek.com.sg/news/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.adia.ae/en/news/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.mubadala.com/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.kia.gov.kw/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.qia.qa/en/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ECONOMIC THINK TANKS & RESEARCH ──────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.brookings.edu/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.piie.com/rss/feeds/all', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.nber.org/rss_feed_33063/new_papers', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://cepr.org/rss/insights.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.bruegel.org/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.atlanticcouncil.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.heritage.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.aei.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.cato.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.imf.org/en/Countries?type=news&period=any&rss=1', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.conference-board.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://economic-research.bnpparibas.com/rss', category: 'اقتصاد كلي', language: 'fr' as const },
  { url: 'https://www.dbresearch.com/RSS/profil/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ubs.com/global/en/about-ubs/news.html/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── TRADE ORGANIZATIONS ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.wto.org/library/rss/statistics_news_e.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.wto.org/library/rss/news_e.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://unctad.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.uschamber.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.sifma.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.iif.com/feed', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.gfma.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.isda.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── UN COMTRADE & INTERNATIONAL DATA ─────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://data.worldbank.org/indicator/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://comtrade.un.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://data.imf.org/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── FINANCIAL STANDARD SETTERS ───────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.fsb.org/feed/', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.iosco.org/rss/news.xml', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.ifrs.org/news/rss/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.bis.org/list/cpmi/index.rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.swift.com/news/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ADDITIONAL MDBs ──────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.caf.com/en/rss/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.eib.org/en/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ebrd.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.aiib.org/rss/press-releases.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ndb.int/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.iadb.org/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.afdb.org/en/news-and-events/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.isdb.org/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ADDITIONAL CREDIT RATING AGENCIES ────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.fitchratings.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.moodys.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://dbrs.morningstar.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.scoperatings.com/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── MAJOR INSURANCE & REINSURANCE ────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.munichre.com/en/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.swissre.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.allianz.com/en/news/rss.html', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.axa.com/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.zurich.com/en/news/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── NON-ENGLISH FINANCIAL PRESS ──────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.handelsblatt.com/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://asia.nikkei.com/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.caixinglobal.com/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://english.news.cn/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ADDITIONAL INTERNATIONAL ORGANIZATIONS ───────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.ilo.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.unido.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.undp.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.fao.org/news/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.unctad.org/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ADDITIONAL TAX AUTHORITIES ───────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.irs.gov/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.gov.uk/government/organisations/hm-revenue-customs.atom', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://sede.agenciatributaria.gob.es/RSS', category: 'اقتصاد كلي', language: 'es' as const },
  { url: 'https://taxation-customs.ec.europa.eu/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── REAL ESTATE FIRMS ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.cbre.com/about-us/media-center/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.jll.com/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.cushmanwakefield.com/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.knightfrank.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.savills.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.zillow.com/research/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.redfin.com/news/feed/', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── FINTECH & PAYMENTS COMPANIES ─────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://www.visa.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.mastercard.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.paypal.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.stripe.com/blog/feed', category: 'تقنية', language: 'en' as const },
  { url: 'https://www.ripple.com/rss', category: 'كريبتو', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════
  // ── ADDITIONAL ARABIC REGIONAL ───────────────────────────
  // ═══════════════════════════════════════════════════════════
  { url: 'https://gulfbusiness.com/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.arabianbusiness.com/feed', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.aleqt.com/rss', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.argaam.com/en/rss', category: 'أسهم', language: 'ar' as const },
  // ═══════════════════════════════════════════════════════════════
  // V1058: STOCK EXCHANGES WORLDWIDE (32 new sources)
  // ═══════════════════════════════════════════════════════════════
  { url: 'https://www.nyse.com/rss/feeds/announcements', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.nasdaq.com/feed/rssoutbound?category=Market%20News', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.euronext.com/en/rss/news', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.deutsche-boerse.com/dbg-en/rss/news', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.jpx.co.jp/english/listing/news/rss.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.sse.com.cn/en/aboutus/news/rss.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.szse.cn/api/RSS/disclosure/en.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.hkex.com.hk/News/Market-Communications-and-Announcements/RSS', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.nseindia.com/rss/content/announcements.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.bseindia.com/Masters/XML/RSSFeeds.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.asx.com.au/asx/v2/rss/news.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.tsx.com/news/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.b3.com.br/en_us/news/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.boursakuwait.com.kw/en/rss', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.adx.ae/English/Pages/RSS.aspx', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.dfm.ae/TheModule/RSS.aspx', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.saudiexchange.sa/RSS', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.bahrainbourse.net/rss', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.msm.gov.om/English/Pages/RSS.aspx', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.qex.qa/rss', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.egx.com.eg/English/Pages/RSS.aspx', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.bvmt.com.tn/en/rss', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.casablanca-bourse.com/rss', category: 'أسهم', language: 'ar' as const },
  { url: 'https://www.jse.co.za/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.krx.co.kr/eng/rss/main.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.twse.com.tw/en/rss/news.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.idx.co.id/en/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.set.or.th/en/rss/news.xml', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.pse.com.ph/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.bvl.com.pe/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.bcba.com.ar/rss', category: 'أسهم', language: 'en' as const },
  { url: 'https://subscribe.news.eu.nasdaq.com/RSS/MarketNotices', category: 'أسهم', language: 'en' as const },
  { url: 'https://www.lseg.com/rss', category: 'أسهم', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════════
  // V1058: COMMODITY EXCHANGES (6 new sources)
  // ═══════════════════════════════════════════════════════════════
  { url: 'https://www.cmegroup.com/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.theice.com/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.lme.com/en/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.cmegroup.com/markets/metals/rss', category: 'سلع', language: 'en' as const },
  { url: 'https://www.cmegroup.com/markets/energy/rss', category: 'طاقة', language: 'en' as const },
  { url: 'https://www.cmegroup.com/markets/agriculture/rss', category: 'سلع', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════════
  // V1058: RESEARCH INSTITUTES (10 new sources)
  // ═══════════════════════════════════════════════════════════════
  { url: 'https://www.brookings.edu/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.cato.org/rss.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.heritage.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.aei.org/feed/', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.bruegel.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://cepr.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ifri.org/en/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.chathamhouse.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.cfr.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.lowyinstitute.org/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════════
  // V1058: ADDITIONAL GOVERNMENT SOURCES (10 new)
  // ═══════════════════════════════════════════════════════════════
  { url: 'https://www.govinfo.gov/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.treasurydirect.gov/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.sba.gov/about-sba/sba-newsroom/press-releases-media-advisories/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.trade.gov/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.fda.gov/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.fcc.gov/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.dol.gov/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.mof.go.jp/english/rss/index.xml', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.ffiec.gov/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.stat.gov.rs/en-us/rss/', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════════
  // V1058: ARAB/MIDDLE EAST OFFICIAL SOURCES (9 new)
  // ═══════════════════════════════════════════════════════════════
  { url: 'https://www.amf.org.ae/rss', category: 'بنوك مركزية', language: 'ar' as const },
  { url: 'https://www.spa.gov.sa/rss.xml', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.wam.ae/rss', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.qna.org.qa/rss', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.kuna.net.kw/rss', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.map.org.ma/en/rss', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.pif.gov.sa/en/Pages/RSS.aspx', category: 'اقتصاد كلي', language: 'ar' as const },
  { url: 'https://www.insuranceeurope.eu/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.wcoomd.org/en/rss', category: 'اقتصاد كلي', language: 'en' as const },

  // ═══════════════════════════════════════════════════════════════
  // V1058: ADDITIONAL FOUND SOURCES (5 new)
  // ═══════════════════════════════════════════════════════════════
  { url: 'https://www.centralbanking.com/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://data.bis.org/rss', category: 'بنوك مركزية', language: 'en' as const },
  { url: 'https://www.ratings.moodys.com/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.financing.desa.un.org/rss', category: 'اقتصاد كلي', language: 'en' as const },
  { url: 'https://www.mof.gov.cy/en/rss', category: 'اقتصاد كلي', language: 'en' as const },

];

// ─── Sentiment Analysis (keyword-based, no AI needed) ──────
const positiveWords = [
  'rise', 'surge', 'gain', 'rally', 'boost', 'jump', 'climb', 'high', 'record', 'beat',
  'exceed', 'soar', 'boom', 'bull', 'recovery', 'growth', 'profit', 'advance', 'breakthrough',
  'ارتفاع', 'صعود', 'قفز', 'ارتفع', 'قوي', 'أرباح', 'فاق', 'تجاوز', 'قفزة', 'انتعاش',
  'نمو', 'ارباح', 'صاعد', 'إيجابي', 'تحسن', 'تقدم', 'مكاسب', 'اختراق',
];

const negativeWords = [
  'fall', 'drop', 'decline', 'slide', 'sink', 'crash', 'loss', 'low', 'miss', 'cut', 'risk',
  'fear', 'bear', 'recession', 'collapse', 'plunge', 'dive', 'tumble', 'slump', 'panic',
  'هبوط', 'تراجع', 'انخفاض', 'خسارة', 'ضعف', 'أزمة', 'توتر', 'خسائر', 'انهيار',
  'سقوط', 'خفض', 'تخفيض', 'سلبي', 'ركود', 'قلق', 'توترات', 'تدهور', 'ضغط',
];

function analyzeSentiment(title: string, summary: string): { sentiment: 'positive' | 'negative' | 'neutral'; score: number } {
  const text = `${title} ${summary}`.toLowerCase();
  let posScore = 0;
  let negScore = 0;
  
  positiveWords.forEach(w => { if (text.includes(w)) posScore += 10; });
  negativeWords.forEach(w => { if (text.includes(w)) negScore += 10; });
  
  if (posScore > negScore + 10) return { sentiment: 'positive', score: Math.min(55 + posScore, 95) };
  if (negScore > posScore + 10) return { sentiment: 'negative', score: Math.min(55 + negScore, 95) };
  return { sentiment: 'neutral', score: 55 };
}

// ─── Impact Evaluation V101 ──────────────────────────────────
// Comprehensive importance scoring: economic + political + geopolitical impact.
// Returns { impactLevel, impactScore } where score is 0-100.
// Multiple keyword hits accumulate — more impactful topics score higher.
// This is the CHECKPOINT for news importance before AI processing.

interface ImpactResult {
  impactLevel: 'high' | 'medium' | 'low';
  impactScore: number; // 0-100
}

function evaluateImpact(title: string, summary: string): ImpactResult {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;

  // ── Tier 1: Critical Economic Events (25 pts each, cap 50) ──
  // Central bank decisions, major economic indicators that move ALL markets
  const criticalEconKw = [
    'fed ', 'federal reserve', 'fomc', 'interest rate', 'rate hike', 'rate cut',
    'nfp', 'nonfarm', 'non-farm', 'cpi', 'inflation rate', 'gdp growth',
    'ecb', 'bank of japan', 'boj', 'bank of england', 'boe',
    'الفيدرالي', 'الفائدة', 'رفع الفائدة', 'خفض الفائدة', 'التضخم',
    'نسبة البطالة', 'الناتج المحلي', 'البنك المركزي الأوروبي', 'بنك اليابان',
  ];
  let critCount = 0;
  for (const kw of criticalEconKw) {
    if (text.includes(kw)) { score += 25; critCount++; if (critCount >= 2) break; }
  }

  // ── Tier 2: Geopolitical & Political Impact (15 pts each, cap 45) ──
  // Wars, sanctions, trade wars, elections — affect markets globally
  const geopoliticalKw = [
    'war', 'conflict', 'invasion', 'military', 'sanctions', 'embargo',
    'trade war', 'tariff', 'tariffs', 'trade deal', 'trade agreement',
    'election', 'presidential', 'summit', 'treaty', 'diplomacy',
    'opec+', 'opec meeting', 'opec cut', 'opec increase',
    'nato', 'g7', 'g20', 'imf', 'world bank',
    'سقوط', 'حرب', 'صراع', 'غزو', 'عقوبات', 'حظر',
    'حرب تجارية', 'رسوم جمركية', 'انتخابات', 'رئاسي', 'قمة', 'معاهدة',
    'أوبك+', 'أوبك', 'اجتماع أوبك', 'خفض الإنتاج',
  ];
  let geoCount = 0;
  for (const kw of geopoliticalKw) {
    if (text.includes(kw)) { score += 15; geoCount++; if (geoCount >= 3) break; }
  }

  // ── Tier 3: Major Market Movers (10 pts each, cap 30) ──
  // Significant market events that traders act on
  const marketMoverKw = [
    'crash', 'selloff', 'rally', 'surge', 'plunge', 'slump', 'recession',
    'bear market', 'bull market', 'correction', 'all-time high', 'record high',
    'default', 'bankruptcy', 'bailout', 'rescue', 'stimulus', 'qE',
    'oil price', 'crude oil', 'gold price', 'bitcoin price', 'dollar index',
    'انهيار', 'هبوط حاد', 'ارتفاع قياسي', 'مستوى قياسي', 'ركود',
    'سوق هابط', 'سوق صاعد', 'تخلف عن السداد', 'إفلاس', 'إنقاذ', 'تحفيز',
  ];
  let mmCount = 0;
  for (const kw of marketMoverKw) {
    if (text.includes(kw)) { score += 10; mmCount++; if (mmCount >= 3) break; }
  }

  // ── Tier 4: Notable Events (5 pts each, cap 15) ──
  // Earnings, commodities, crypto — important but not market-shaking alone
  const notableKw = [
    'earnings', 'revenue', 'profit', 'ipo', 'acquisition', 'merger',
    'oil', 'gold', 'bitcoin', 'ethereum', 'crypto',
    'pmi', 'jobless claims', 'retail sales', 'housing', 'durable goods',
    'أرباح', 'إيرادات', 'اكتتاب', 'استحواذ', 'اندماج',
    'النفط', 'الذهب', 'بيتكوين', 'إيثريوم', 'عملات رقمية',
  ];
  let noteCount = 0;
  for (const kw of notableKw) {
    if (text.includes(kw)) { score += 5; noteCount++; if (noteCount >= 3) break; }
  }

  // ── Breaking/Urgent Bonus (+15) ──
  // Breaking news gets priority regardless of topic
  const breakingKw = ['breaking', 'urgent', 'alert', 'just in', 'عاجل', 'طوارئ', 'خبر عاجل', 'فوري'];
  for (const kw of breakingKw) {
    if (text.includes(kw)) { score += 15; break; }
  }

  // ── Multi-Issue Bonus (+10) ──
  // Articles touching multiple domains (e.g., geopolitics + oil) are more impactful
  const domainHits = [critCount > 0, geoCount > 0, mmCount > 0, noteCount > 0].filter(Boolean).length;
  if (domainHits >= 3) score += 10;

  // Cap at 100
  score = Math.min(score, 100);

  // Map score to impactLevel
  let impactLevel: 'high' | 'medium' | 'low';
  if (score >= 50) impactLevel = 'high';
  else if (score >= 20) impactLevel = 'medium';
  else impactLevel = 'low';

  return { impactLevel, impactScore: score };
}

// ─── Geographic Priority Filter V129 ──────────────────────────
// Evaluates geographic relevance of news articles.
// High priority: Global markets (US, EU, major Asia), Arab markets, global commodities
// Low priority: Local markets of non-Arab/non-major countries
// Neutral: No specific country mention (general market news stays as-is)
function evaluateGeoPriority(title: string, summary: string): 'high' | 'low' | 'neutral' {
  const text = `${title} ${summary}`.toLowerCase();

  // ── High-priority regions: global financial hubs + Arab markets ──
  const highPriorityKw = [
    // Americas
    'us ', 'usa', 'united states', 'american', 'wall street', 'new york', 'nasdaq', 'nyse', 's&p',
    'dow jones', 'federal reserve', 'fed ',
    // Europe
    'europe', 'european', 'eu ', 'uk ', 'britain', 'london', 'germany', 'frankfurt', 'france', 'paris',
    'ecb', 'eurozone', 'ftse', 'dax', 'cac',
    // Major Asia
    'japan', 'tokyo', 'nikkei', 'china', 'shanghai', 'beijing', 'hong kong', 'hang seng',
    'south korea', 'seoul', 'kospi', 'india', 'mumbai', 'sensex', 'nifty',
    // Arab markets
    'saudi', 'riyadh', 'tadawul', 'uae', 'dubai', 'abu dhabi', 'emirate',
    'egypt', 'cairo', 'egx', 'qatar', 'doha', 'bahrain', 'kuwait', 'oman', 'jordan',
    'gcc', 'gulf',
    // Global commodities (location-independent)
    'oil', 'crude', 'wti', 'brent', 'gold', 'silver', 'copper', 'opec',
    'bitcoin', 'ethereum', 'crypto',
    // العربية
    'أمريكا', 'أمريكي', 'أوروبا', 'أوروبي', 'بريطانيا', 'ألمانيا', 'فرنسا',
    'اليابان', 'الصين', 'كوريا', 'الهند',
    'سعودي', 'السعودية', 'إمارات', 'الإمارات', 'دبي', 'أبوظبي', 'مصر', 'القاهرة',
    'قطر', 'الكويت', 'البحرين', 'عمان', 'الأردن', 'الخليج',
    'النفط', 'الذهب', 'الفضة', 'بيتكوين', 'عملات رقمية',
  ];

  // ── Low-priority regions: non-Arab, non-major markets ──
  const lowPriorityKw = [
    'pakistan', 'karachi', 'bangladesh', 'dhaka', 'ethiopia', 'addis ababa',
    'nigeria', 'lagos', 'kenya', 'nairobi', 'uganda', 'ghana', 'accra',
    'zimbabwe', 'mozambique', 'tanzania', 'cameroon', 'senegal',
    'myanmar', 'cambodia', 'laos', 'nepal', 'sri lanka', 'colombo',
    'bolivia', 'ecuador', 'paraguay', 'honduras', 'guatemala',
    'باكستان', 'بنغلاديش', 'إثيوبيا', 'نيجيريا', 'كينيا', 'أوغندا', 'غانا',
    'زيمبابوي', 'موزمبيق', 'ميانمار', 'كمبوديا', 'نيبال', 'سريلانكا',
    'بوليفيا', 'إكوادور', 'باراغواي', 'هندوراس', 'غواتيمالا',
  ];

  // Check low-priority first (more specific — overrides general)
  for (const kw of lowPriorityKw) {
    if (text.includes(kw)) {
      // But if it also mentions a high-priority region, it's still relevant
      // (e.g., "Pakistan trade deal with China" — China is high priority)
      const hasHighPriority = highPriorityKw.some(hkw => text.includes(hkw));
      if (!hasHighPriority) {
        return 'low';
      }
    }
  }

  // Check high-priority
  for (const kw of highPriorityKw) {
    if (text.includes(kw)) {
      return 'high';
    }
  }

  // No specific region mentioned — neutral (global market news, etc.)
  return 'neutral';
}

// Apply geographic priority adjustment to impact scores
function applyGeoPriority(item: NewsItem): NewsItem {
  const geoPriority = evaluateGeoPriority(item.title, item.summary);
  if (geoPriority === 'low') {
    // Downgrade impact for low-priority geographic news
    item.impactScore = Math.max(0, item.impactScore - 20);
    if (item.impactScore < 20) item.impactLevel = 'low';
    else if (item.impactScore < 50) item.impactLevel = 'medium';
  } else if (geoPriority === 'high') {
    // Boost impact for high-priority geographic news
    item.impactScore = Math.min(100, item.impactScore + 10);
    if (item.impactScore >= 50 && item.impactLevel === 'low') item.impactLevel = 'medium';
    if (item.impactScore >= 50 && item.impactLevel === 'medium') item.impactLevel = 'high';
  }
  return item;
}

// Legacy wrapper for backward compatibility
function detectImpact(title: string, summary: string): 'high' | 'medium' | 'low' {
  return evaluateImpact(title, summary).impactLevel;
}

// ─── Category Detection ────────────────────────────────────
// V68: Expanded keyword list with healthcare, M&A, pharma, biotech keywords
// Order matters: more specific keywords should come before general ones
const categoryMap: Record<string, string> = {
  // ── سلع (Commodities) ──
  'gold': 'سلع', 'xau': 'سلع', 'silver': 'سلع', 'ذهب': 'سلع', 'فضة': 'سلع',
  // ── طاقة (Energy) ──
  'oil': 'طاقة', 'crude': 'طاقة', 'wti': 'طاقة', 'brent': 'طاقة', 'نفط': 'طاقة', 'خام': 'طاقة',
  // ── كريبتو (Crypto) ──
  'bitcoin': 'كريبتو', 'crypto': 'كريبتو', 'ethereum': 'كريبتو', 'btc': 'كريبتو', 'بيتكوين': 'كريبتو', 'عملات رقمية': 'كريبتو',
  // ── بنوك مركزية (Central Banks) ──
  'fed': 'بنوك مركزية', 'federal': 'بنوك مركزية', 'ecb': 'بنوك مركزية', 'interest rate': 'بنوك مركزية',
  'الفيدرالي': 'بنوك مركزية', 'الفائدة': 'بنوك مركزية', 'بنك مركزي': 'بنوك مركزية',
  // ── عملات (Forex) ──
  'forex': 'عملات', 'currency': 'عملات', 'dollar': 'عملات', 'euro': 'عملات', 'دولار': 'عملات', 'يورو': 'عملات',
  'usd': 'عملات', 'eur': 'عملات', 'gbp': 'عملات', 'jpy': 'عملات', 'exchange rate': 'عملات', 'سعر صرف': 'عملات',
  // ─ـ أسهم (Stocks) — V68: Greatly expanded ──
  'stock': 'أسهم', 'stocks': 'أسهم', 's&p': 'أسهم', 'nasdaq': 'أسهم', 'nyse': 'أسهم', 'أسهم': 'أسهم', 'بورصة': 'أسهم',
  'share': 'أسهم', 'shares': 'أسهم', 'shareholder': 'أسهم', 'ticker': 'أسهم',
  'acquisition': 'أسهم', 'merger': 'أسهم', 'deal': 'أسهم', 'buyout': 'أسهم', 'takeover': 'أسهم',
  'استحواذ': 'أسهم', 'اندماج': 'أسهم', 'صفقة': 'أسهم', 'شراء': 'أسهم',
  'subsidiary': 'أسهم', 'شركة تابعة': 'أسهم',
  'pharmaceutical': 'أسهم', 'pharma': 'أسهم', 'biotech': 'أسهم', 'drug': 'أسهم', 'clinical': 'أسهم',
  'fda': 'أسهم', 'therapy': 'أسهم', 'therapeutics': 'أسهم', 'أدوية': 'أسهم', 'دواء': 'أسهم',
  'صيدلية': 'أسهم', 'صيدلة': 'أسهم', 'رعاية صحية': 'أسهم', 'صحي': 'أسهم', 'طبي': 'أسهم',
  'technology': 'أسهم', 'tech': 'أسهم', 'ai ': 'أسهم', 'software': 'أسهم', 'تقنية': 'أسهم', 'تكنولوجيا': 'أسهم',
  'healthcare': 'أسهم', 'medical': 'أسهم', 'hospital': 'أسهم', 'صحة': 'أسهم', 'مستشفى': 'أسهم',
  'holding': 'أسهم', 'holdings': 'أسهم', 'هولدنغ': 'أسهم',
  'holding company': 'أسهم', 'شركة قابضة': 'أسهم',
  'definitive agreement': 'أسهم', 'اتفاق نهائي': 'أسهم',
  'stock acquisition': 'أسهم', 'شراء أسهم': 'أسهم',
  'ipo': 'أسهم', 'اكتتاب': 'أسهم', 'nvidia': 'أسهم', 'apple': 'أسهم', 'tesla': 'أسهم',
  // ─ـ اقتصاد كلي (Macro) ──
  'inflation': 'اقتصاد كلي', 'cpi': 'اقتصاد كلي', 'gdp': 'اقتصاد كلي', 'تضخم': 'اقتصاد كلي',
  // ─ـ أسواق عربية (Arab Markets) ──
  'saudi': 'أسواق عربية', 'uae': 'أسواق عربية', 'dubai': 'أسواق عربية', 'سعودي': 'أسواق عربية', 'إمارات': 'أسواق عربية',
  'tadawul': 'أسواق عربية', 'تاسي': 'أسواق عربية', 'abu dhabi': 'أسواق عربية', 'أبوظبي': 'أسواق عربية',
  'riyadh': 'أسواق عربية', 'الرياض': 'أسواق عربية', 'السعودية': 'أسواق عربية',
  'gcc': 'أسواق عربية', 'gulf': 'أسواق عربية', 'الخليج': 'أسواق عربية', 'خليج': 'أسواق عربية',
  'qatar': 'أسواق عربية', 'قطر': 'أسواق عربية', 'doha': 'أسواق عربية',
  'kuwait': 'أسواق عربية', 'الكويت': 'أسواق عربية', 'bahrain': 'أسواق عربية', 'البحرين': 'أسواق عربية',
  'oman': 'أسواق عربية', 'عمان': 'أسواق عربية', 'muscat': 'أسواق عربية', 'مسقط': 'أسواق عربية',
  'egypt': 'أسواق عربية', 'مصر': 'أسواق عربية', 'cairo': 'أسواق عربية', 'القاهرة': 'أسواق عربية', 'egx': 'أسواق عربية',
  'jordan': 'أسواق عربية', 'الأردن': 'أسواق عربية', 'amman': 'أسواق عربية', 'عمّان': 'أسواق عربية',
  'dfm': 'أسواق عربية', 'دبي المالي': 'أسواق عربية',
  // ─ـ أرباح شركات (Earnings) ──
  'earnings': 'أرباح شركات', 'أرباح': 'أرباح شركات', 'revenue': 'أرباح شركات', 'profit': 'أرباح شركات',
};

function detectCategory(title: string, summary: string, defaultCategory?: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  // V68: Priority-based detection — count matches per category, return highest
  // This prevents "dollar" in a stock deal headline from overriding the "stocks" category
  const categoryScores: Record<string, number> = {};
  const categoryPriority: Record<string, number> = {
    'كريبتو': 10,
    'طاقة': 9,
    'سلع': 8,
    'بنوك مركزية': 7,
    'عملات': 6,   // Lower priority: many stock articles mention "dollar" amounts
    'أسواق عربية': 5, // V230: Raised from 3 to 5 — Arab market keywords should override generic categories
    'أرباح شركات': 4,
    'أسهم': 3,    // Lowered from 4 — many Arab market articles were being classified as "stocks"
    'اقتصاد كلي': 2,
  };

  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (text.includes(keyword)) {
      const priority = categoryPriority[category] || 1;
      categoryScores[category] = (categoryScores[category] || 0) + priority;
    }
  }

  const entries = Object.entries(categoryScores);
  if (entries.length > 0) {
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }
  return defaultCategory || 'اقتصاد كلي';
}

// ─── Source 1: RSS Feeds (FREE & PERMANENT) ────────────────
async function fetchRSSFeed(feedUrl: string, category: string, language: 'ar' | 'en'): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 300 },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return [];
    
    const xml = await response.text();
    return parseRSSXML(xml, category, language);
  } catch (err: any) {
    console.error(`[RSS] Failed ${feedUrl}:`, err.message);
    return [];
  }
}

function parseRSSXML(xml: string, defaultCategory: string, language: 'ar' | 'en'): NewsItem[] {
  const items: NewsItem[] = [];
  
  try {
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    
    const matches = [...xml.matchAll(itemRegex), ...xml.matchAll(entryRegex)];
    
    for (const match of matches.slice(0, 15)) {
      const content = match[1];
      
      const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&#x27;/g, "'") : '';
      
      if (!title || title.length < 10) continue;
      
      const descMatch = content.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
        || content.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)
        || content.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
      const summary = descMatch ? descMatch[1].trim().replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").slice(0, 500) : '';
      
      const linkMatch = content.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i)
        || content.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const url = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
      
      if (!url) continue;
      
      const dateMatch = content.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)
        || content.match(/<published[^>]*>([\s\S]*?)<\/published>/i)
        || content.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)
        || content.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      const dateStr = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
      
      const sourceMatch = content.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i)
        || content.match(/<author[^>]*>([\s\S]*?)<\/author>/i);
      const source = sourceMatch ? sourceMatch[1].trim().replace(/<[^>]*>/g, '') : '';
      
      const { sentiment, score } = analyzeSentiment(title, summary);
      const detectedLang = /[\u0600-\u06FF]/.test(title) ? 'ar' : 'en';
      
      items.push({
        title,
        summary,
        url,
        source: source || extractDomain(url) || 'RSS Feed',
        date: parseDate(dateStr),
        category: detectCategory(title, summary, defaultCategory),
        sentiment,
        sentimentScore: score,
        ...evaluateImpact(title, summary),
        language: detectedLang || language,
      });
    }
  } catch (err) {
    console.error('[RSS] Parse error:', err);
  }
  
  return items;
}

function parseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

// ─── Source 2: Finnhub API (FREE - 60 calls/min) ──────────
async function fetchFinnhubNews(): Promise<NewsItem[]> {
  try {
    // Support both FINNHUB_API_KEY and FINNHUB_KEY env var names
    const apiKey = process.env.FINNHUB_API_KEY || process.env.FINNHUB_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.log('[Finnhub] No API key set, skipping');
      return [];
    }
    
    const categories = ['general', 'forex', 'crypto', 'merger'];
    const allItems: NewsItem[] = [];
    
    for (const category of categories) {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`,
          { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) continue;
        const data = await res.json();
        
        if (Array.isArray(data)) {
          for (const item of data.slice(0, 10)) {
            const title = item.headline || '';
            const summary = item.summary || '';
            if (!title) continue;
            
            const { sentiment, score } = analyzeSentiment(title, summary);
            
            allItems.push({
              title,
              summary: summary.slice(0, 250),
              url: item.url || '',
              source: item.source || 'Finnhub',
              date: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
              category: detectCategory(title, summary),
              sentiment,
              sentimentScore: score,
              ...evaluateImpact(title, summary),
              language: 'en',
              imageUrl: item.image || undefined,
            });
          }
        }
      } catch {
        // Skip failed categories
      }
    }
    
    return allItems;
  } catch (err: any) {
    console.error('[Finnhub] Error:', err.message);
    return [];
  }
}

// ─── Source 3: NewsAPI.org (FREE - 100 requests/day on dev plan) ──
// V129: Geographic filter — top-headlines with country param + everything with geo domains
async function fetchNewsAPINews(): Promise<NewsItem[]> {
  try {
    const apiKey = process.env.NEWSAPI_API_KEY || process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.log('[NewsAPI] No API key set, skipping');
      return [];
    }
    
    const allItems: NewsItem[] = [];
    
    // V129: Query 1 — top-headlines with country=us (most relevant financial market)
    try {
      const topUrl = `https://newsapi.org/v2/top-headlines?country=us&category=business&pageSize=10&apiKey=${apiKey}`;
      const topRes = await fetch(topUrl, { 
        next: { revalidate: 300 }, 
        signal: AbortSignal.timeout(8000) 
      });
      if (topRes.ok) {
        const topData = await topRes.json();
        if (topData.articles && Array.isArray(topData.articles)) {
          for (const item of topData.articles) {
            const title = item.title || '';
            const summary = item.description || item.content?.replace(/\[\+\d+ chars\]/g, '') || '';
            if (!title || title === '[Removed]') continue;
            const { sentiment, score } = analyzeSentiment(title, summary);
            allItems.push({
              title, summary: summary.slice(0, 250),
              url: item.url || '', source: item.source?.name || 'NewsAPI',
              date: item.publishedAt || new Date().toISOString(),
              category: detectCategory(title, summary),
              sentiment, sentimentScore: score,
              ...evaluateImpact(title, summary), language: 'en',
              imageUrl: item.urlToImage || undefined,
            });
          }
        }
      }
    } catch { /* skip failed top-headlines */ }
    
    // Query 2 — everything with financial keywords (no country param on this endpoint)
    try {
      const q = 'finance OR stock market OR gold oil';
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
      const res = await fetch(url, { 
        next: { revalidate: 300 }, 
        signal: AbortSignal.timeout(8000) 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.articles && Array.isArray(data.articles)) {
          for (const item of data.articles) {
            const title = item.title || '';
            const summary = item.description || item.content?.replace(/\[\+\d+ chars\]/g, '') || '';
            if (!title || title === '[Removed]') continue;
            const { sentiment, score } = analyzeSentiment(title, summary);
            allItems.push({
              title, summary: summary.slice(0, 250),
              url: item.url || '', source: item.source?.name || 'NewsAPI',
              date: item.publishedAt || new Date().toISOString(),
              category: detectCategory(title, summary),
              sentiment, sentimentScore: score,
              ...evaluateImpact(title, summary), language: 'en',
              imageUrl: item.urlToImage || undefined,
            });
          }
        }
      }
    } catch {
      // Skip failed everything query
    }
    
    return allItems;
  } catch (err: any) {
    console.error('[NewsAPI] Error:', err.message);
    return [];
  }
}

// ─── Source 4: CryptoPanic API — DISABLED V135 ──
// CryptoPanic API now returns 502/404 consistently (API discontinued or changed).
// Replaced with additional Cointelegraph RSS feeds (see RSS_FEEDS array above).
// Keeping function signature for compatibility but returning empty.
async function fetchCryptoPanicNews(): Promise<NewsItem[]> {
  // V135: CryptoPanic API is permanently broken (502/404 on all endpoints).
  // Crypto news now comes from Cointelegraph RSS feeds (3 feeds in RSS_FEEDS).
  // If CryptoPanic restores their API, re-enable by removing this early return.
  console.log('[CryptoPanic] SKIPPED — API is permanently broken (V135). Using Cointelegraph RSS instead.');
  return [];
}

// ─── Source 5: CurrentsAPI (currentsapi.services) ──────────
// Free tier: 200 requests/day, supports language & category filters
// Provides diverse news from multiple global sources with images
// V129: Geographic filter — country param targets relevant markets only
async function fetchCurrentsAPINews(): Promise<NewsItem[]> {
  try {
    const apiKey = process.env.CURRENTS_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.log('[CurrentsAPI] No API key set, skipping');
      return [];
    }

    const allItems: NewsItem[] = [];
    // V130: CurrentsAPI only supports a SINGLE country code per request.
    // V129 sent comma-separated countries (us,gb,de,...) which caused HTTP 400.
    // Now we query top markets individually with a per-country limit.
    const EN_MARKets = ['us', 'gb', 'ae']; // Top English-language financial markets
    const AR_MARKETS = ['sa', 'ae', 'eg']; // Arabic-language financial markets

    const queries: { category: string; language: string; country: string }[] = [];
    for (const country of EN_MARKets) {
      queries.push({ category: 'business', language: 'en', country });
    }
    queries.push({ category: 'technology', language: 'en', country: 'us' });
    for (const country of AR_MARKETS) {
      queries.push({ category: 'business', language: 'ar', country });
    }

    for (const q of queries) {
      try {
        const url = `https://api.currentsapi.services/v1/latest-news?apiKey=${apiKey}&language=${q.language}&category=${q.category}&country=${q.country}`;
        const res = await fetch(url, {
          next: { revalidate: 300 },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          // V130: Include response body for better debugging of HTTP 400 errors
          const errorBody = await res.text().catch(() => '');
          console.warn(`[CurrentsAPI] HTTP ${res.status} for category=${q.category}, country=${q.country}, lang=${q.language}${errorBody ? ` — ${errorBody.slice(0, 200)}` : ''}`);
          continue;
        }
        const data = await res.json();

        if (data.news && Array.isArray(data.news)) {
          for (const item of data.news.slice(0, 15)) {
            const title = item.title || '';
            const summary = item.description || '';
            const url = item.url || '';
            if (!title || !url) continue;
            // Skip non-financial articles — CurrentsAPI categories are broad
            const financialKw = [
              'market', 'stock', 'economy', 'trade', 'finance', 'bank', 'invest',
              'fed', 'rate', 'oil', 'gold', 'bitcoin', 'crypto', 'dollar', 'currency',
              'inflation', 'gdp', 'merger', 'acquisition', 'earnings', 'revenue',
              'profit', 'ipo', 'tariff', 'sanction', 'opec', 'bond',
              'سوق', 'اقتصاد', 'بورصة', 'فائدة', 'نفط', 'ذهب', 'دولار', 'تضخم',
              'أسهم', 'عملات', 'بنك', 'استثمار', 'تجارة', 'أرباح',
            ];
            const textToCheck = `${title} ${summary}`.toLowerCase();
            const isFinancial = financialKw.some(kw => textToCheck.includes(kw));
            if (!isFinancial) continue; // Skip non-financial articles

            const detectedLang = /[\u0600-\u06FF]/.test(title) ? 'ar' : 'en';
            const { sentiment, score } = analyzeSentiment(title, summary);

            allItems.push({
              title,
              summary: summary.slice(0, 250),
              url,
              source: item.author || extractDomain(url) || 'CurrentsAPI',
              date: item.published || new Date().toISOString(),
              category: detectCategory(title, summary),
              sentiment,
              sentimentScore: score,
              ...evaluateImpact(title, summary),
              language: detectedLang,
              imageUrl: item.image || undefined,
            });
          }
        }
      } catch {
        // Skip failed queries
      }
    }

    console.log(`[CurrentsAPI] Fetched ${allItems.length} items`);
    return allItems;
  } catch (err: any) {
    console.error('[CurrentsAPI] Error:', err.message);
    return [];
  }
}

// ─── Source 6: Web Search (V133: ZAI SDK + Google News RSS fallback) ──
async function fetchWebSearchNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  // ── Method 1: Try z-ai-web-dev-sdk (works on Z.ai platform internally) ──
  if (await ensureZAIConfig()) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const queries = [
        'financial markets news today ' + new Date().toISOString().slice(0,10),
        'stock market latest news today',
        'forex gold oil news today',
        'crypto bitcoin ethereum news today',
        'central bank Fed ECB news today',
      ];

      for (const q of queries) {
        try {
          const searchResult = await zai.functions.invoke('web_search', { query: q, num: 8 });
          if (Array.isArray(searchResult)) {
            for (const item of searchResult) {
              const title = item.name || '';
              const summary = item.snippet || '';
              const url = item.url || '';
              if (!title || !url) continue;

              const { sentiment, score } = analyzeSentiment(title, summary);
              const dateStr = item.date || new Date().toISOString();

              allItems.push({
                title,
                summary: summary.slice(0, 250),
                url,
                source: (item as any).host_name || extractDomain(url) || 'Web Search',
                date: parseDate(dateStr),
                category: detectCategory(title, summary),
                sentiment,
                sentimentScore: score,
                ...evaluateImpact(title, summary),
                language: 'en',
              });
            }
          }
        } catch (searchErr: any) {
          console.warn(`[WebSearch/ZAI] Query "${q}" failed: ${searchErr.message}`);
        }
      }

      if (allItems.length > 0) {
        console.log(`[WebSearch/ZAI] Fetched ${allItems.length} items`);
        return allItems;
      }
    } catch (err: any) {
      console.warn(`[WebSearch/ZAI] Failed: ${err.message} — falling back to Google News RSS`);
    }
  } else {
    console.log('[WebSearch/ZAI] Not configured — using Google News RSS fallback');
  }

  // ── Method 2: Google News RSS Fallback (works everywhere, no API key needed) ──
  try {
    const rssQueries = [
      'https://news.google.com/rss/search?q=financial+markets+stock+forex+gold+oil&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=crypto+bitcoin+ethereum+blockchain&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=central+bank+federal+reserve+ECB+interest+rate&hl=en-US&gl=US&ceid=US:en',
    ];

    for (const rssUrl of rssQueries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(rssUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
        });
        clearTimeout(timeout);

        if (!response.ok) continue;
        const xml = await response.text();

        // Parse Google News RSS XML
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null) {
          const itemXml = match[1];

          // Extract title
          const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                             itemXml.match(/<title>(.*?)<\/title>/);
          const title = titleMatch ? titleMatch[1].trim() : '';
          if (!title) continue;

          // Extract link
          const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
          const url = linkMatch ? linkMatch[1].trim() : '';
          if (!url) continue;

          // Extract description/snippet
          const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                           itemXml.match(/<description>(.*?)<\/description>/);
          const summary = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Extract pubDate
          const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
          const dateStr = dateMatch ? dateMatch[1].trim() : '';

          // Extract source
          const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);
          const source = sourceMatch ? sourceMatch[1].trim() : 'Google News';

          const { sentiment, score } = analyzeSentiment(title, summary);

          allItems.push({
            title,
            summary: summary.slice(0, 250),
            url,
            source,
            date: parseDate(dateStr) || new Date(),
            category: detectCategory(title, summary),
            sentiment,
            sentimentScore: score,
            ...evaluateImpact(title, summary),
            language: 'en',
          });
        }
      } catch (rssErr: any) {
        console.warn(`[WebSearch/GoogleRSS] Query failed: ${rssErr.message}`);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.url.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`[WebSearch/GoogleRSS] Fetched ${deduped.length} items (from ${allItems.length} total)`);
    return deduped;
  } catch (err: any) {
    console.error('[WebSearch/GoogleRSS] Error:', err.message);
    return allItems; // Return whatever we got from ZAI SDK
  }
}

// ─── Auto-Translate English News to Arabic (Parallel Batches) ──
export async function autoTranslateItems(items: NewsItem[]): Promise<NewsItem[]> {
  const BATCH_SIZE = 10; // Translate 10 items concurrently to reduce AI rate limit issues
  const RETRY_ATTEMPTS = 2; // Retry failed translations twice (was 1) for better resilience
  const RETRY_DELAY = 1500; // 1.5 second delay between retries (was 1s)
  const TIMEOUT = 15000; // 15 second timeout per translation (was 10s) — some providers are slow

  const translatedItems: NewsItem[] = [];
  let successCount = 0;
  let failCount = 0;
  let providerStats: Record<string, number> = {};

  // Pre-process: Arabic items don't need translation
  for (const item of items) {
    if (item.language !== 'en') {
      translatedItems.push({ ...item, titleAr: item.title, summaryAr: item.summary });
    }
  }

  // Collect English items that need translation
  const englishItems = items.filter(item => item.language === 'en');

  if (englishItems.length === 0) {
    return translatedItems;
  }

  console.log(`[Translate] Starting translation of ${englishItems.length} English items in batches of ${BATCH_SIZE}...`);

  // Process in parallel batches with retry logic
  for (let i = 0; i < englishItems.length; i += BATCH_SIZE) {
    const batch = englishItems.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
          try {
            // Add timeout to translation
            const translation = await Promise.race([
              translateToArabic(item.title, item.summary),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), TIMEOUT))
            ]) as { translatedTitle: string; translatedSummary: string; provider?: string };

            // Check if translation actually produced Arabic text
            const isArabicTitle = translation.translatedTitle && /[\u0600-\u06FF]/.test(translation.translatedTitle);

            if (isArabicTitle) {
              // Track provider stats
              const provider = translation.provider || 'unknown';
              providerStats[provider] = (providerStats[provider] || 0) + 1;

              successCount++;
              return {
                ...item,
                titleAr: translation.translatedTitle,
                summaryAr: translation.translatedSummary,
              };
            } else {
              throw new Error('Translation did not produce Arabic text');
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`[Translate] Attempt ${attempt + 1}/${RETRY_ATTEMPTS + 1} failed for "${item.title.slice(0, 40)}...": ${err.message}`);

            // If not last attempt, wait before retry
            if (attempt < RETRY_ATTEMPTS) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
            }
          }
        }

        // All attempts failed
        failCount++;
        console.error(`[Translate] All attempts failed for "${item.title.slice(0, 40)}...": ${lastError?.message}`);
        return { ...item };
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        translatedItems.push(result.value);
      } else {
        const failedIdx = batchResults.indexOf(result);
        const failedItem = batch[failedIdx] || batch[0];
        failCount++;
        translatedItems.push({ ...failedItem });
      }
    }
  }

  console.log(`[Translate] Completed: ${successCount} translated, ${failCount} failed out of ${englishItems.length} English items`);
  console.log(`[Translate] Provider stats:`, providerStats);

  return translatedItems;
}

// ─── Main Fetcher: Multi-Source with Auto-Translation ──────
export async function fetchAllNews(options?: {
  includeRSS?: boolean;
  includeFinnhub?: boolean;
  autoTranslate?: boolean;
  maxItems?: number;
}): Promise<{
  news: NewsItem[];
  sources: { source: string; items: number; duration: number; error?: string }[];
  totalFetched: number;
  duration: number;
}> {
  const startTime = Date.now();
  const includeRSS = options?.includeRSS !== false;
  const includeFinnhub = options?.includeFinnhub !== false;
  const autoTranslate = options?.autoTranslate !== false; // Default: YES
  // CRITICAL FIX: Default maxItems raised to 50 (was 40).
  // With duplicate detection now working properly, we can fetch more
  // items to ensure we have a diverse set of news.
  const maxItems = options?.maxItems || 50;
  
  const sources: { source: string; items: number; duration: number; error?: string }[] = [];
  const allItems: NewsItem[] = [];
  
  // ── Fetch from all sources in parallel ──
  const fetchPromises: Promise<{ name: string; items: NewsItem[]; duration: number; error?: string }>[] = [];
  
  if (includeRSS) {
    for (const feed of RSS_FEEDS) {
      fetchPromises.push(
        fetchRSSFeed(feed.url, feed.category, feed.language)
          .then(items => ({ name: `RSS:${extractDomain(feed.url)}`, items, duration: Date.now() - startTime }))
          .catch(err => ({ name: `RSS:${extractDomain(feed.url)}`, items: [] as NewsItem[], duration: Date.now() - startTime, error: err.message }))
      );
    }
  }
  
  if (includeFinnhub) {
    fetchPromises.push(
      fetchFinnhubNews()
        .then(items => ({ name: 'Finnhub', items, duration: Date.now() - startTime }))
        .catch(err => ({ name: 'Finnhub', items: [] as NewsItem[], duration: Date.now() - startTime, error: err.message }))
    );
    
    // NewsAPI.org source
    fetchPromises.push(
      fetchNewsAPINews()
        .then(items => ({ name: 'NewsAPI', items, duration: Date.now() - startTime }))
        .catch(err => ({ name: 'NewsAPI', items: [] as NewsItem[], duration: Date.now() - startTime, error: err.message }))
    );
    
    // z-ai web search fallback (always available)
    fetchPromises.push(
      fetchWebSearchNews()
        .then(items => ({ name: 'WebSearch', items, duration: Date.now() - startTime }))
        .catch(err => ({ name: 'WebSearch', items: [] as NewsItem[], duration: Date.now() - startTime, error: err.message }))
    );

    // CryptoPanic — crypto & financial news aggregator (free)
    fetchPromises.push(
      fetchCryptoPanicNews()
        .then(items => ({ name: 'CryptoPanic', items, duration: Date.now() - startTime }))
        .catch(err => ({ name: 'CryptoPanic', items: [] as NewsItem[], duration: Date.now() - startTime, error: err.message }))
    );

    // CurrentsAPI — diverse global news with financial filter (200 req/day free)
    fetchPromises.push(
      fetchCurrentsAPINews()
        .then(items => ({ name: 'CurrentsAPI', items, duration: Date.now() - startTime }))
        .catch(err => ({ name: 'CurrentsAPI', items: [] as NewsItem[], duration: Date.now() - startTime, error: err.message }))
    );
  }
  
  const results = await Promise.allSettled(fetchPromises);
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { name, items, duration, error } = result.value;
      sources.push({ source: name, items: items.length, duration, error });
      allItems.push(...items);
    } else {
      sources.push({ source: 'unknown', items: 0, duration: 0, error: result.reason?.message || 'Failed' });
    }
  }
  
  // ── Deduplicate by URL ──
  const seenUrls = new Set<string>();
  let uniqueItems = allItems.filter(item => {
    if (!item.url || seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });
  
  // ── V129: Apply geographic priority filter ──
  // Adjusts impact scores based on geographic relevance
  let geoStats = { high: 0, low: 0, neutral: 0 };
  for (const item of uniqueItems) {
    const geo = evaluateGeoPriority(item.title, item.summary);
    geoStats[geo]++;
    applyGeoPriority(item);
  }
  console.log(`[News V129] Geographic priority: ${geoStats.high} high, ${geoStats.neutral} neutral, ${geoStats.low} low`);
  
  // ── Sort by date (newest first), with geo-low items at the bottom ──
  uniqueItems.sort((a, b) => {
    // Low-priority geo items go to the end
    const geoA = evaluateGeoPriority(a.title, a.summary);
    const geoB = evaluateGeoPriority(b.title, b.summary);
    if (geoA === 'low' && geoB !== 'low') return 1;
    if (geoB === 'low' && geoA !== 'low') return -1;
    // Within same priority, sort by date
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // ── Limit items before translation (to save API calls) ──
  uniqueItems = uniqueItems.slice(0, maxItems);
  
  // ── Auto-translate English news to Arabic ──
  // V98: Skip when SKIP_PREPROCESS_AI is true — pipeline's Unified Processor handles translation
  if (autoTranslate && !PIPELINE_CONFIG.SKIP_PREPROCESS_AI) {
    console.log(`[News] Auto-translating ${uniqueItems.filter(i => i.language === 'en').length} English items...`);
    const translateStart = Date.now();
    uniqueItems = await autoTranslateItems(uniqueItems);
    console.log(`[News] Translation completed in ${Date.now() - translateStart}ms`);
  } else if (PIPELINE_CONFIG.SKIP_PREPROCESS_AI) {
    console.log(`[News V98] Skipping auto-translate — pipeline Unified Processor will handle it`);
  }
  
  return {
    news: uniqueItems,
    sources,
    totalFetched: allItems.length,
    duration: Date.now() - startTime,
  };
}

// ─── Fetch Breaking News Specifically ──────────────────────
export async function fetchBreakingNews(options?: { autoTranslate?: boolean }): Promise<{
  news: NewsItem[];
  sources: { source: string; items: number }[];
  duration: number;
}> {
  // autoTranslate defaults to FALSE — bootstrap calls with false,
  // process cron handles translation via prefetchArticleContent.
  const autoTranslate = options?.autoTranslate ?? false;
  const startTime = Date.now();
  const allItems: NewsItem[] = [];
  const sources: { source: string; items: number }[] = [];
  
  const breakingKw = [
    'fed', 'rate', 'crash', 'surge', 'war', 'crisis', 'emergency', 'record', 'breaking',
    'plunge', 'soar', 'collapse', 'sanctions', 'pandemic', 'default',
    'فيدرالي', 'أزمة', 'عاجل', 'حرب', 'ارتفاع', 'هبوط', 'قرار', 'طوارئ', 'انهيار',
    'اختراق', 'قفزة', 'تراجع', 'خفض', 'رفع', 'فائدة', 'تضخم', 'حاسم', 'مفاجئ',
  ];
  
  function isBreaking(title: string): boolean {
    const lower = title.toLowerCase();
    return breakingKw.some(kw => lower.includes(kw));
  }
  
  // V112: Updated breaking RSS — removed dead MarketWatch feed
  const breakingRSS = [
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.cnbc.com/id/10001147/device/rss/rss.html',
    'https://www.cnbc.com/id/10000664/device/rss/rss.html',
    'https://www.skynewsarabia.com/rss/business.xml',
  ];
  
  const rssResults = await Promise.allSettled(
    breakingRSS.map(url => fetchRSSFeed(url, 'عاجل', 'en'))
  );
  
  let rssCount = 0;
  rssResults.forEach(result => {
    if (result.status === 'fulfilled') {
      rssCount += result.value.length;
      allItems.push(...result.value);
    }
  });
  sources.push({ source: 'RSS', items: rssCount });
  
  const finnhubItems = await fetchFinnhubNews();
  sources.push({ source: 'Finnhub', items: finnhubItems.length });
  allItems.push(...finnhubItems);
  
  // Deduplicate
  const seenUrls = new Set<string>();
  const uniqueItems = allItems.filter(item => {
    if (!item.url || seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });
  
  // Prioritize breaking news
  const breakingItems = uniqueItems.filter(item => isBreaking(item.title));
  const highImpactItems = uniqueItems.filter(item => !isBreaking(item.title) && item.impactLevel !== 'low');
  const otherItems = uniqueItems.filter(item => !isBreaking(item.title) && item.impactLevel === 'low');
  
  let finalItems = [...breakingItems, ...highImpactItems, ...otherItems].slice(0, 12);
  
  // Auto-translate breaking news ONLY if requested (false by default)
  // Translation is normally handled by the process cron to avoid blocking bootstrap.
  if (autoTranslate) {
    try {
      console.log(`[Breaking] Auto-translating ${finalItems.filter(i => i.language === 'en').length} English items...`);
      finalItems = await autoTranslateItems(finalItems);
    } catch (err: any) {
      console.warn('[Breaking] Translation failed:', err.message);
    }
  } else {
    console.log(`[Breaking] Skipping translation (autoTranslate=false) — process cron will handle it`);
  }

  return {
    news: finalItems,
    sources,
    duration: Date.now() - startTime,
  };
}

// ─── Save News to Database (Supabase PostgreSQL) ──────────
export async function saveNewsToDB(items: NewsItem[], newsType: 'live' | 'breaking' | 'article' = 'live'): Promise<number> {

// V1050: تحديد ما إذا كان المصدر رسمي (بنك مركزي، وزارة، منظمة دولية)
const OFFICIAL_SOURCE_DOMAINS = [
  // Central banks
  'federalreserve.gov', 'ecb.europa.eu', 'bis.org', 'imf.org', 'worldbank.org',
  'sec.gov', 'treasury.gov', 'whitehouse.gov', 'commerce.gov',
  'bankofengland.co.uk', 'boj.or.jp', 'pboc.gov.cn', 'rba.gov.au',
  'banque-france.fr', 'bundesbank.de', 'bancaditalia.it', 'dnb.nl',
  'riksbank.se', 'norges-bank.no', 'bankofcanada.ca',
  'centralbank.org', 'centralbank.gov', 'cbuae.gov.ae', 'sama.gov.sa',
  'mas.gov.sg', 'hkma.gov.hk', 'rbi.org.in', 'bankofkorea.or.kr',
  'tcmb.gov.tr', 'banxico.org.mx', 'bcra.gob.ar', 'bcb.gov.br',
  'centralbanking.com', 'data.bis.org', 'ffiec.gov',
  // Statistics
  'stats.gov', 'census.gov', 'bea.gov', 'bls.gov', 'stat.gov.rs', 'eurostat',
  // International organizations
  'iosco.org', 'fasb.org', 'ifrs.org', 'iaasb.org',
  'wto.org', 'oecd.org', 'un.org', 'unctad.org', 'financing.desa.un.org',
  'sifma.org', 'iif.com', 'isdb.org', 'wcoomd.org',
  // Credit rating
  'moodys.com', 'ratings.moodys.com', 'fitchratings.com', 'spglobal.com',
  // Government
  'govinfo.gov', 'treasurydirect.gov', 'sba.gov', 'trade.gov', 'dol.gov',
  'mof.go.jp', 'mof.gov.cy', 'fcc.gov', 'fda.gov',
  // Arab official sources
  'amf.org.ae', 'spa.gov.sa', 'wam.ae', 'qna.org.qa', 'kuna.net.kw',
  'map.org.ma', 'pif.gov.sa',
  // Stock exchanges
  'nyse.com', 'nasdaq.com', 'euronext.com', 'deutsche-boerse.com',
  'jpx.co.jp', 'sse.com.cn', 'szse.cn', 'hkex.com.hk',
  'nseindia.com', 'bseindia.com', 'asx.com.au', 'tsx.com',
  'b3.com.br', 'boursakuwait.com', 'adx.ae', 'dfm.ae',
  'saudiexchange.sa', 'bahrainbourse.net', 'msm.gov.om',
  'qex.qa', 'egx.com.eg', 'bvmt.com.tn', 'casablanca-bourse.com',
  'jse.co.za', 'krx.co.kr', 'twse.com.tw', 'idx.co.id',
  'set.or.th', 'pse.com.ph', 'bvl.com.pe', 'bcba.com.ar',
  'subscribe.news.eu.nasdaq.com', 'lseg.com',
  // Commodity exchanges
  'cmegroup.com', 'theice.com', 'lme.com',
  // Research institutes
  'brookings.edu', 'cato.org', 'heritage.org', 'aei.org',
  'bruegel.org', 'cepr.org', 'ifri.org', 'chathamhouse.org',
  'cfr.org', 'lowyinstitute.org',
  // Insurance
  'insuranceeurope.eu', 'naic.org', 'eiopa.europa.eu', 'swissre.com', 'munichre.com',
  // Energy
  'iea.org', 'opec.org', 'eia.gov',
  // Development banks
  'adb.org', 'afdb.org', 'eib.org', 'ebrd.com', 'aiib.org',
];

const OFFICIAL_SOURCE_NAMES = [
  'Federal Reserve', 'European Central Bank', 'Bank of England',
  'Bank of Japan', 'BIS', 'IMF', 'World Bank',
  'SEC', 'Treasury', 'Central Bank', 'Ministry of Finance',
  'Statistics Office', 'IOSCO', 'WTO', 'OECD',
];

function isOfficialSourceUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return OFFICIAL_SOURCE_DOMAINS.some(d => lower.includes(d));
}

function isOfficialSourceName(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return OFFICIAL_SOURCE_NAMES.some(n => lower.includes(n.toLowerCase()));
}

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    console.warn('[DB] DATABASE_URL not configured, skipping save');
    return 0;
  }

  if (items.length === 0) return 0;

  // V59: Removed ensureTablesExist() — was doing ALTER TABLE on every cron run.
  // DB schema is ensured at startup and in admin routes only.

  try {
    let saved = 0;
    let duplicatesSkipped = 0;

    // Save items one by one to handle slug uniqueness constraints
    let firstErrorLogged = false;
    for (const item of items) {
      try {
        const idBase = toUrlSafeBase64(item.url);
        const hash = idBase.length > 40 
          ? idBase.slice(0, 20) + idBase.slice(-20)
          : idBase;
        const id = `${newsType}-${hash}`;
        
        // Generate slug from Arabic title, or English title as fallback
        // CRITICAL: Always generate a slug so articles are accessible via /article/[slug]
        const slug = generateSlug(item.titleAr || item.title);
        // V3: isPublished is NOT the visibility flag — isReady is.
        // isReady=false (default) means article is invisible until pipeline publishes it.
        const isPublished = false;

        // ── CRITICAL FIX: Check for existing item by URL FIRST ──
        // Previously, we only checked by ID (which includes newsType prefix).
        // This meant the same URL was saved TWICE: once as "live-{hash}" and
        // once as "breaking-{hash}". Now we check by URL first to prevent
        // duplicates across newsTypes.
        let existing: any = null;
        try {
          // First: check by the expected ID (same newsType)
          existing = await db.newsItem.findUnique({ where: { id } });
          
          // If not found by ID, check by URL (might exist with different newsType)
          if (!existing && item.url) {
            existing = await db.newsItem.findFirst({ 
              where: { url: item.url },
              orderBy: { fetchedAt: 'desc' },
            });
            if (existing && existing.id !== id) {
              // Same URL exists but with different newsType — skip creating duplicate
              // Instead, update the existing record with any new data
              duplicatesSkipped++;
              console.log(`[DB] Skipping duplicate URL (exists as ${existing.id}, tried ${id}): ${item.url.slice(0, 60)}`);
              
              // Upgrade newsType if breaking > live (breaking is higher priority)
              const updateData: any = {};
              if (newsType === 'breaking' && existing.newsType === 'live') {
                updateData.newsType = 'breaking';
              }
              // Update Arabic fields if we have new data and existing doesn't
              if (item.titleAr && /[؀-ۿ]/.test(item.titleAr) && (!existing.titleAr || !/[؀-ۿ]/.test(existing.titleAr))) {
                updateData.titleAr = item.titleAr;
              }
              if (item.summaryAr && /[؀-ۿ]/.test(item.summaryAr) && (!existing.summaryAr || !/[؀-ۿ]/.test(existing.summaryAr))) {
                updateData.summaryAr = item.summaryAr;
              }
              if (Object.keys(updateData).length > 0) {
                try {
                  await db.newsItem.update({ where: { id: existing.id }, data: updateData });
                } catch {}
              }
              saved++; // Count as saved (updated existing)
              continue; // Skip creating a duplicate
            }
          }
        } catch (findErr: any) {
          console.error(`[DB] findUnique/URL check failed for id="${id}": ${findErr.message}`);
        }
        
        if (existing) {
          // Check if slug already belongs to a different item before updating
          let safeSlug = slug;
          if (safeSlug && existing.slug !== safeSlug) {
            try {
              const slugOwner = await db.newsItem.findFirst({ where: { slug: safeSlug } });
              if (slugOwner && slugOwner.id !== id) {
                safeSlug = `${slug}-${Date.now().toString(36)}`;
              }
            } catch {}
          }

          // Update - only update fields that have NEW data
          // CRITICAL: Never overwrite existing Arabic content with undefined/empty
          // CRITICAL: NEVER change the slug on update! Changing the slug breaks
          // existing URLs that users have already visited or bookmarked.
          // The slug is set ONCE on creation and never changed.
          const updateData: any = {
            // CRITICAL FIX: Do NOT update fetchedAt on every cron run!
            // Previously, every cron run would update fetchedAt to now(),
            // which made ALL articles appear "new" and pushed truly old
            // articles down. Now we only update fetchedAt if the article
            // was fetched more than 6 hours ago (prevents stale sorting
            // while avoiding unnecessary timestamp refreshes).
            ...(existing.fetchedAt && (Date.now() - new Date(existing.fetchedAt).getTime() < 6 * 60 * 60 * 1000)
              ? {} // Don't update fetchedAt if less than 6 hours old
              : { fetchedAt: new Date() }),
            sentiment: item.sentiment,
            sentimentScore: item.sentimentScore,
            // V39 GOLDEN RULE: NEVER reset isPublished or isReady on published articles!
            // Previously, this unconditionally set isPublished=false, which "unpublished"
            // articles that the pipeline had already published. This caused articles
            // to disappear from the sitemap and v1 API after the next cron cycle.
            // Now we ONLY set isPublished for UNPUBLISHED articles.
            ...(existing.isReady ? {} : { isPublished }),
          };
          // Only update Arabic fields if we have NEW Arabic content AND existing is empty
          // This prevents overwriting good translations with new ones that might differ slightly
          if (item.titleAr && /[؀-ۿ]/.test(item.titleAr) && (!existing.titleAr || !/[؀-ۿ]/.test(existing.titleAr))) {
            updateData.titleAr = item.titleAr;
            // DO NOT regenerate slug on update — it breaks existing URLs!
            // Slug is set once on creation and should never change.
          }
          if (item.summaryAr && /[؀-ۿ]/.test(item.summaryAr) && (!existing.summaryAr || !/[؀-ۿ]/.test(existing.summaryAr))) {
            updateData.summaryAr = item.summaryAr;
          }
          // If existing has no slug but we have one, add it (first time only)
          if (!existing.slug && safeSlug) {
            updateData.slug = safeSlug;
          }
          try {
            await db.newsItem.update({
              where: { id },
              data: updateData,
            });
          } catch (updateErr: any) {
            console.error(`[DB] Update failed for id="${id}": ${updateErr.message}`);
            if (!firstErrorLogged) {
              console.error(`[DB] Full update error:`, updateErr.stack?.slice(0, 500));
              firstErrorLogged = true;
            }
          }
        } else {
          // Create - handle slug uniqueness by appending a suffix if needed
          // CRITICAL: Always generate a slug from titleAr or English title
          let finalSlug = slug || generateSlug(item.title);
          if (finalSlug) {
            try {
              const slugExists = await db.newsItem.findFirst({ where: { slug: finalSlug } });
              if (slugExists) {
                finalSlug = `${slug}-${Date.now().toString(36)}`;
              }
            } catch {}
          }
          if (!finalSlug) {
            finalSlug = `news-${Date.now().toString(36)}`;
          }
          
        // V23: NO immediate translation! Just save raw data.
        // Translation + AI analysis + image = done by pipeline-worker ONE AT A TIME.
        // This prevents empty articles from being published.
        // Articles are saved as isReady=false and stay invisible until fully processed.
        // V23 FIX: Do NOT set generatedImage here! A default image lets articles
        // pass readiness checks without real content. Pipeline assigns images AFTER content.

          // For Arabic source articles, titleAr = title (already Arabic)
          const titleArForCreate = item.language === 'ar' ? item.title : (item.titleAr || null);
          const summaryArForCreate = item.language === 'ar' ? item.summary.slice(0, 250) : (item.summaryAr || null);

          try {
            await db.newsItem.create({
              data: {
                id,
                title: item.title,
                titleAr: titleArForCreate,
                summary: item.summary.slice(0, 250),
                summaryAr: summaryArForCreate,
                contentAr: null,
                source: item.source,
                isOfficialSource: isOfficialSourceUrl(item.url) || isOfficialSourceName(item.source),
                url: item.url,
                category: item.category,
                sentiment: item.sentiment,
                sentimentScore: item.sentimentScore,
                impactLevel: item.impactLevel,
                impactScore: item.impactScore,   // V101: Importance score for priority sorting
                originalLanguage: item.language,
                locale: 'ar',
                newsType,
                affectedAssets: '[]',
                isPublished,
                processingStage: 'fetched', // V23: Always start at 'fetched' — pipeline will process
                imageUrl: item.imageUrl || null, // V32: Keep source image in DB as fallback, but display prefers generatedImage
                generatedImage: null, // V23: NO default image! Pipeline assigns image AFTER content
                slug: finalSlug,
                fetchedAt: new Date(),
              },
            });
          } catch (createErr: any) {
            console.error(`[DB] Create failed for id="${id}" title="${item.title.slice(0, 30)}": ${createErr.message}`);
            if (!firstErrorLogged) {
              console.error(`[DB] Full create error:`, createErr.stack?.slice(0, 800));
              firstErrorLogged = true;
            }
          }
        }
        saved++;
      } catch (itemErr: any) {
        console.error(`[DB] Unexpected error for "${item.title.slice(0, 30)}": ${itemErr.message}`);
        if (!firstErrorLogged) {
          console.error(`[DB] Full error for first failure:`, itemErr.stack?.slice(0, 500));
          firstErrorLogged = true;
        }
      }
    }

    console.log(`[DB] Saved ${saved}/${items.length} ${newsType} items (${duplicatesSkipped} duplicates skipped)`);
    return saved;
  } catch (err: any) {
    console.error('[DB] Batch save failed:', err.message);
    // DO NOT resetDBInit() - it causes cascade failures
    return 0;
  }
}

// ─── Get News from Database (always available) ─────────────
export async function getNewsFromDB(options?: {
  newsType?: 'live' | 'breaking' | 'article' | 'stock_analysis';
  category?: string;
  limit?: number;
  maxAge?: number; // in hours — OPTIONAL, no default = all ages included
  offset?: number; // for pagination
  locale?: string; // 'ar' | 'en' — filter by content locale
  sortBy?: string; // 'views' to sort by views, default is by fetchedAt
  sortOrder?: 'asc' | 'desc'; // sort direction, default 'desc'
}): Promise<{ items: NewsItem[]; total: number }> {
  // ARCHIVE-FIRST DESIGN: No default maxAge — ALL articles are returned
  // regardless of age. The user wants every news item archived forever.
  // maxAge is only applied when explicitly passed by the caller.
  // Default limit is 200 for the homepage. Pagination (offset/limit) allows
  // browsing the full archive.
  const { newsType, category, limit = 200, maxAge, offset = 0, locale, sortBy, sortOrder = 'desc' } = options || {};

  try {
    // Check if DATABASE_URL is properly configured (not a dummy URL)
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      console.warn('[DB] DATABASE_URL not properly configured, skipping DB query');
      return { items: [], total: 0 };
    }

    // V59: Removed ensureTablesExist() — was doing ALTER TABLE on every page visit.
    // DB schema is ensured at startup and in admin routes only.
    // Also removed V50 DEBUG counts (6 extra COUNT queries per page load).

    // V73: Relaxed visibility check — only require essential fields for display.
    // Previous V50 required generatedImage, contentAr, and aiAnalysis to be non-empty,
    // which caused many valid articles to be hidden from the main page if AI processing
    // hadn't completed yet. Now we only require:
    //   - isReady: article has been fetched and basic-processed
    //   - isPublished: approved for display
    //   - slug: navigation works
    //   - titleAr: Arabic title available for display
    // Images are handled by /api/article-image/{id} proxy (fallback to placeholder).
    // Content and AI analysis are loaded on the article detail page.
    const where: any = {
      slug: { not: '' },
      isReady: true,
      isPublished: true,
      // ROOT CAUSE FIX: Use POSITIVE whitelist for newsType instead of negative blacklist.
      // The previous filter { not: 'stock_analysis' } allowed articles with newsType='article'
      // or 'analysis' to leak into news feeds. Only 'live' and 'breaking' are legitimate news.
      newsType: { in: ['live', 'breaking'] },
    };
    // For Arabic locale, require Arabic title; for all other locales, require locale title
    if (locale === 'ar') {
      where.titleAr = { not: '' };
    } else {
      where.title = { not: '' };
    }
    if (locale) {
      where.locale = locale;
    }
    // If caller explicitly requests stock_analysis newsType, allow it (override the default exclusion)
    if (newsType) {
      where.newsType = newsType;
    }
    if (category) where.category = category;
    if (maxAge) {
      where.fetchedAt = { gte: new Date(Date.now() - maxAge * 60 * 60 * 1000) };
    }

    // Get total count for pagination
    const total = await db.newsItem.count({ where });

    // V59 PERFORMANCE: Removed generatedImage and imageUrl from SELECT.
    // generatedImage can be 100+ KB of base64 per article — for 50 articles that's
    // 5+ MB from the DB per page load. Since the WHERE clause guarantees
    // generatedImage { not: '' }, we ALWAYS use /api/article-image/{id} as the
    // imageUrl. The proxy route handles both URL-based and base64 images.
    // Also removed aiAnalysis from list SELECT — it's only needed on detail pages.
    const dbItems = await db.newsItem.findMany({
      where: { ...where, isReady: true },
      orderBy: sortBy === 'views' ? { views: sortOrder } : { fetchedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        url: true,
        source: true,
        category: true,
        sentiment: true,
        sentimentScore: true,
        impactLevel: true,
        // impactScore NOT in select — column may not exist yet during migration
        // We add it with default 0 in the mapping below
        originalLanguage: true,
        newsType: true,
        slug: true,
        fetchedAt: true,
        publishedAt: true,
        views: true,
        // V59: REMOVED from list query — too heavy for lists:
        // generatedImage: true  (100+ KB base64 per article — use /api/article-image/{id})
        // imageUrl: true  (redundant — proxy handles fallback)
        // aiAnalysis: true  (only needed on article detail page, not lists)
        // contentAr: true  (only needed on article detail page, not lists)
      },
    });

    // V59: Since WHERE guarantees generatedImage exists, always use proxy route
    // V61 FIX: Restored newsType and slug to output — they were fetched in the
    // SELECT clause but silently dropped by the mapping, causing server-rendered
    // articles to always have newsType='live' and slug=undefined. This mismatch
    // between server data and API data caused hydration issues and lost slugs.
    const items = dbItems.map((item: any) => {
      return {
        id: item.id,
        title: item.title,
        titleAr: item.titleAr || undefined,
        summary: item.summary || '',
        summaryAr: item.summaryAr || undefined,
        url: item.url || '',
        source: item.source || '',
        date: item.fetchedAt?.toISOString() || new Date().toISOString(),
        category: item.category || 'اقتصاد كلي',
        newsType: (item.newsType as 'live' | 'breaking' | 'article') || 'live',
        slug: item.slug || undefined,
        generatedImage: undefined, // V59: Not fetched in list queries
        sentiment: (item.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
        sentimentScore: item.sentimentScore || 55,
        impactLevel: (item.impactLevel as 'high' | 'medium' | 'low') || 'low',
        impactScore: item.impactScore || 0,  // V101: Importance score
        language: (item.originalLanguage as 'ar' | 'en') || 'en',
        views: item.views || 0,
        imageUrl: `/api/article-image/${item.id}`, // V59: Always proxy — handles URL/base64
        aiAnalysis: undefined, // V59: Not fetched in list queries
        contentAr: undefined, // V59: Not fetched in list queries
        publishedAt: item.publishedAt?.toISOString() || null,
        fetchedAt: item.fetchedAt?.toISOString() || null,
      };
    });

    return { items, total };
  } catch (err: any) {
    // Don't log full error for connection failures — too noisy
    if (!err.message?.includes('connect') && !err.message?.includes('ECONNREFUSED')) {
      console.error('[DB] Failed to get news:', err.message);
    }
    // CRITICAL FIX: Only reset DB init for schema errors, not transient connection errors.
    const isSchemaError = err.message?.includes('does not exist') ||
      err.message?.includes('relation') ||
      err.message?.includes('column') ||
      err.message?.includes('schema');
    if (isSchemaError) {
      console.warn('[DB] Schema error detected, will retry table creation on next call');
      resetDBInit();
    }
    return { items: [], total: 0 };
  }
}

// ─── Pre-processing: Fetch, Translate & Generate Analysis ────
// After news items are saved to DB, this function:
// 1. Fetches the full article content from the source URL
// 2. Translates it to Arabic
// 3. Generates AI analysis (intro, body, conclusion, keyTakeaways, etc.)
// 4. Saves everything to the database
//
// This MUST be AWAITED in the cron job so that NO visitor ever sees
// untranslated content. All content is pre-ready before display.

export async function prefetchArticleContent(items: NewsItem[], newsType: 'live' | 'breaking' = 'live'): Promise<{
  contentTranslated: number;
  analysisGenerated: number;
  titlesTranslated: number;
  failed: number;
  processed: number;
  skipped: number;
  duration: number;
}> {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return { contentTranslated: 0, analysisGenerated: 0, titlesTranslated: 0, failed: 0, processed: 0, skipped: 0, duration: 0 };
  }
  if (items.length === 0) {
    return { contentTranslated: 0, analysisGenerated: 0, titlesTranslated: 0, failed: 0, processed: 0, skipped: 0, duration: 0 };
  }

  // Process ALL items that have a URL (not just English - Arabic items may still need content/analysis)
  const processableItems = items.filter(item => item.url);
  if (processableItems.length === 0) {
    return { contentTranslated: 0, analysisGenerated: 0, titlesTranslated: 0, failed: 0, processed: 0, skipped: 0, duration: 0 };
  }

  console.log(`[PreProcess] Starting FULL pre-processing for ${processableItems.length} articles (content+translation+analysis)...`);
  const startTime = Date.now();
  let contentTranslated = 0;
  let analysisGenerated = 0;
  let titlesTranslated = 0;
  let failed = 0;
  let processed = 0;
  let skipped = 0;

  // Process in parallel batches for faster completion
  // FIX: Reduced from 3 to 2 to avoid AI rate limits and timeouts.
  // Sequential processing (1) is most reliable but too slow.
  // Batch of 2 is a good compromise between speed and reliability.
  const BATCH_SIZE = 2;
  for (let i = 0; i < processableItems.length; i += BATCH_SIZE) {
    const batch = processableItems.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(batch.map(async (item) => {
      try {
        // Use the provided DB ID if available (from catch-up), otherwise calculate from URL
        let id = item.id;
        if (!id) {
          const idBase = toUrlSafeBase64(item.url);
          const hash = idBase.length > 40 ? idBase.slice(0, 20) + idBase.slice(-20) : idBase;
          id = `${newsType}-${hash}`;
        }

        // Check what we already have for this item
        let existing = await db.newsItem.findUnique({
          where: { id },
          select: { titleAr: true, summaryAr: true, content: true, contentAr: true, aiAnalysis: true, slug: true, newsType: true },
        }).catch(err => { console.warn('[NewsSources V156] DB article lookup failed:', err instanceof Error ? err.message : err); return null; });

        // If we can't find the record by ID, try URL-based lookup
        if (!existing) {
          console.warn(`[PreProcess] No DB record found for id="${id}", trying URL lookup for "${item.title.slice(0, 40)}..."`);
          try {
            const byUrl = await db.newsItem.findFirst({ where: { url: item.url } });
            if (byUrl) {
              id = byUrl.id;
              existing = byUrl as any;
              console.log(`[PreProcess] Found article by URL, using id="${id}"`);
            }
          } catch {}
        }

        // If still not found, try title-based lookup (last resort)
        if (!existing) {
          try {
            const byTitle = await db.newsItem.findFirst({
              where: {
                title: item.title,
                fetchedAt: { gte: new Date(Date.now() - 720 * 60 * 60 * 1000) },
              },
            });
            if (byTitle) {
              id = byTitle.id;
              existing = byTitle as any;
              console.log(`[PreProcess] Found article by title, using id="${id}"`);
            }
          } catch {}
        }

        if (!existing) {
          console.error(`[PreProcess] Cannot find article in DB for "${item.title.slice(0, 40)}..." — skipping`);
          failed++;
          return;
        }

        const record = existing;
        const hasTitleAr = record?.titleAr && record.titleAr.length > 5 && /[\u0600-\u06FF]/.test(record.titleAr);
        const hasSummaryAr = record?.summaryAr && record.summaryAr.length > 5 && /[\u0600-\u06FF]/.test(record.summaryAr);
        // UNIFIED THRESHOLD: contentAr > 50 chars with Arabic chars.
        // This matches markArticleReady() which requires > 100 for "ready" status,
        // but we use > 50 here to allow re-processing of short contentAr that
        // may have been wrongly saved as summaryAr before the fix.
        const hasContent = record?.contentAr && record.contentAr.length > 50 && /[\u0600-\u06FF]/.test(record.contentAr);
        // Check if aiAnalysis is meaningful (not just a minimal/summary placeholder)
        let isMinimalAnalysis = false;
        let hasRealBody = false; // Does the analysis have real body content (not just a placeholder)?
        try {
          const parsed = record?.aiAnalysis ? JSON.parse(record.aiAnalysis) : {};
          isMinimalAnalysis = parsed.isMinimal === true || parsed.isSummaryFallback === true;
          // Check if the analysis has actual body content (more than just a summary)
          hasRealBody = !!(parsed.body && parsed.body.length > 30) || !!(parsed.fullContent && parsed.fullContent.length > 100);
        } catch {}
        const hasAnalysis = !isMinimalAnalysis && record?.aiAnalysis && record.aiAnalysis.length > 50;

        // FIX: Only skip if ALL fields are present AND analysis has real body content.
        // Articles that have titleAr + summaryAr but NO AI analysis should NOT be skipped —
        // they need AI analysis to enrich the content.
        // UNIFIED THRESHOLD: contentAr > 100 chars with Arabic — matches markArticleReady().
        // Previously used > 500 which caused articles with 150-char contentAr to be
        // re-processed every cron run (wasting AI calls) even though they were already ready.
        // contentAr is OPTIONAL — it only exists when the source URL was successfully
        // fetched and translated. Many articles have only AI analysis (no source translation).
        // An article is fully processed if it has Arabic title/summary + good AI analysis.
        const isFullyProcessed = hasTitleAr && hasSummaryAr && hasAnalysis && hasRealBody;
        if (isFullyProcessed) {
          // Even if fully processed, ensure slug exists
          if (!record?.slug) {
            try {
              const fallbackSlug = generateSlug(record?.titleAr || item.titleAr || item.title);
              if (fallbackSlug) {
                await db.newsItem.update({
                  where: { id },
                  data: { slug: fallbackSlug },
                });
                console.log(`[PreProcess] Added missing slug for "${item.title.slice(0, 40)}..."`);
              }
            } catch {}
          }
          console.log(`[PreProcess] Skipping fully processed article "${item.title.slice(0, 40)}..."`);
          skipped++;
          return; // Skip - fully processed
        }
        processed++;

        // ── V98: Cost Optimization ──
        // When SKIP_PREPROCESS_AI is true, we skip ALL AI calls during fetch.
        // The pipeline's Unified Processor handles translation + analysis in a single call,
        // producing HIGHER quality output at half the cost.
        // Only Step 1 (HTTP content fetch, no AI) runs to enrich the English content field.
        if (PIPELINE_CONFIG.SKIP_PREPROCESS_AI) {
          // ── Step 1 ONLY: Fetch article content from source URL (no AI) ──
          if (item.language === 'en' && item.url) {
            let articleContent = '';
            try {
              const fetchRes = await fetch(item.url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.5',
                  'Accept-Encoding': 'gzip, deflate',
                  'Cache-Control': 'no-cache',
                },
                signal: AbortSignal.timeout(15000),
                redirect: 'follow',
              });
              if (fetchRes.ok) {
                const html = await fetchRes.text();
                articleContent = extractTextFromHtml(html);
              }
            } catch {}

            // Also try z-ai page_reader if direct fetch failed
            if (!articleContent || articleContent.length < 100) {
              try {
                if (!await ensureZAIConfig()) throw new Error('ZAI not configured');
                const ZAI = (await import('z-ai-web-dev-sdk')).default;
                const zai = await ZAI.create();
                const readerResult = await zai.functions.invoke('page_reader', { url: item.url });
                if (readerResult?.data?.html && readerResult.data.html.length > 100) {
                  const readerContent = extractTextFromHtml(readerResult.data.html);
                  if (readerContent.length > articleContent.length) {
                    articleContent = readerContent;
                  }
                }
              } catch {}
            }

            // Save English content to content field (gives Unified Processor more context)
            if (articleContent && articleContent.length >= 50) {
              try {
                await db.newsItem.update({
                  where: { id },
                  data: { content: articleContent.slice(0, 12000) },
                });
              } catch {}
            }
          }

          // Advance to content_loaded so the pipeline's Unified Processor picks it up
          await updateProcessingStage(id, 'content_loaded');
          console.log(`[PreProcess V98] ✓ Article saved (content fetch only, AI deferred to pipeline) for "${item.title.slice(0, 40)}..."`);
          return; // Skip all AI steps — pipeline will handle everything
        }

        // ── Step 0: Translate title/summary if missing ──
        // This catches items where autoTranslateItems failed in the initial pass
        if (!hasTitleAr && item.language === 'en') {
          try {
            const titleTranslation = await translateToArabic(item.title, item.summary);
            if (titleTranslation.translatedTitle && /[\u0600-\u06FF]/.test(titleTranslation.translatedTitle)) {
              // CRITICAL: Only add titleAr/summaryAr — NEVER change the slug!
              // Slug was set on creation and changing it breaks existing URLs.
              // Only set slug if the article has NO slug at all (edge case).
              const currentRecord = await db.newsItem.findUnique({
                where: { id },
                select: { slug: true },
              });
              const updateData: any = {
                titleAr: titleTranslation.translatedTitle,
                summaryAr: titleTranslation.translatedSummary && /[\u0600-\u06FF]/.test(titleTranslation.translatedSummary)
                  ? titleTranslation.translatedSummary : undefined,
                // V38: Do NOT set isPublished=true here! Only the Publisher agent does that.
              };
              // Only add slug if missing entirely (shouldn't normally happen)
              if (!currentRecord?.slug) {
                updateData.slug = generateSlug(titleTranslation.translatedTitle);
              }
              await db.newsItem.update({
                where: { id },
                data: updateData,
              });
              titlesTranslated++;
              console.log(`[PreProcess] ✓ Late title translation saved for "${item.title.slice(0, 40)}..." (slug NOT changed)`);
            } else {
              // Translation failed or returned empty - increment retryCount
              // Article will be re-processed in the next pipeline cycle
              try {
                const current = await db.newsItem.findUnique({ where: { id }, select: { retryCount: true } });
                const newRetryCount = (current?.retryCount || 0) + 1;
                await db.newsItem.update({
                  where: { id },
                  data: { retryCount: newRetryCount, lastError: 'Title translation failed' }
                });
              } catch {}
              console.log(`[PreProcess] ✗ Title translation failed for "${item.title.slice(0, 40)}...", will retry in next cycle.`);
            }
          } catch (titleErr: any) {
            console.warn(`[PreProcess] Title translation failed for "${item.title.slice(0, 30)}": ${titleErr.message}`);
            // Increment retryCount instead of pushing to past
            try {
              const current = await db.newsItem.findUnique({ where: { id }, select: { retryCount: true } });
              const newRetryCount = (current?.retryCount || 0) + 1;
              await db.newsItem.update({ where: { id }, data: { retryCount: newRetryCount, lastError: titleErr.message } });
            } catch {}
          }
        }

        // Re-read DB state after potential title translation
        const currentState = await db.newsItem.findUnique({
          where: { id },
          select: { titleAr: true, summaryAr: true, contentAr: true, aiAnalysis: true },
        });

        const currentTitleAr = currentState?.titleAr || item.titleAr || '';
        const currentSummaryAr = currentState?.summaryAr || item.summaryAr || '';
        const currentContentAr = currentState?.contentAr;
        // FIX: Unified threshold from 20 to 50 chars so short Arabic content isn't rejected
        const currentHasContent = currentContentAr && currentContentAr.length > 50 && /[\u0600-\u06FF]/.test(currentContentAr);
        // Check if current analysis is meaningful (not minimal/summary placeholder)
        // AND has real body content (not just an empty body)
        let currentIsMinimal = false;
        let currentHasRealBody = false;
        try {
          const currentParsed = currentState?.aiAnalysis ? JSON.parse(currentState.aiAnalysis) : {};
          currentIsMinimal = currentParsed.isMinimal === true || currentParsed.isSummaryFallback === true;
          currentHasRealBody = !!(currentParsed.body && currentParsed.body.length > 30) || !!(currentParsed.fullContent && currentParsed.fullContent.length > 100);
        } catch {}
        // Analysis is considered valid only if it's NOT a placeholder AND has real body content
        const currentHasAnalysis = !currentIsMinimal && currentHasRealBody && currentState?.aiAnalysis && currentState.aiAnalysis.length > 50;

        // ── Step 1: Fetch article content from source URL ──
        // Try multiple methods in order: direct fetch → page_reader → web_search → AI summary
        let articleContent = '';

        if (item.language === 'en' && item.url) {
          // Method 1: Direct HTTP fetch with browser-like headers
          try {
            const fetchRes = await fetch(item.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache',
              },
              signal: AbortSignal.timeout(15000),
              redirect: 'follow',
            });

            if (fetchRes.ok) {
              const html = await fetchRes.text();
              articleContent = extractTextFromHtml(html);
              if (articleContent.length > 100) {
                console.log(`[PreProcess] Direct fetch got ${articleContent.length} chars for ${item.url.slice(0, 50)}`);
              }
            }
          } catch (fetchErr: any) {
            console.warn(`[PreProcess] Direct fetch failed for ${item.url.slice(0, 50)}: ${fetchErr.message}`);
          }

          // Method 2: Try z-ai-web-dev-sdk page_reader (handles paywalls, JS-rendered pages)
          if (!articleContent || articleContent.length < 100) {
            try {
              if (!await ensureZAIConfig()) throw new Error('ZAI not configured');
              const ZAI = (await import('z-ai-web-dev-sdk')).default;
              const zai = await ZAI.create();
              const readerResult = await zai.functions.invoke('page_reader', { url: item.url });
              if (readerResult?.data?.html && readerResult.data.html.length > 100) {
                const readerContent = extractTextFromHtml(readerResult.data.html);
                if (readerContent.length > articleContent.length) {
                  articleContent = readerContent;
                  console.log(`[PreProcess] page_reader got ${readerContent.length} chars for ${item.url.slice(0, 50)}`);
                }
              }
              // Also check for text content directly from page_reader
              if ((readerResult?.data as any)?.text && ((readerResult?.data as any)?.text?.length || 0) > articleContent.length) {
                articleContent = (readerResult?.data as any)?.text || articleContent;
                console.log(`[PreProcess] page_reader (text) got ${((readerResult?.data as any)?.text?.length || 0)} chars for ${item.url.slice(0, 50)}`);
              }
            } catch (readerErr: any) {
              console.warn(`[PreProcess] page_reader failed for ${item.url.slice(0, 50)}: ${readerErr.message}`);
            }
          }

          // Methods 3 and 4 (web_search and AI expansion) have been removed.
          // They were causing completely unrelated text (search snippets) or 
          // hallucinated details to be fetched when the original article fetch failed.
          // If we can't fetch the real article content, it's better to fall back 
          // to just translating the summary rather than hallucinating details.
        }

        // ── Step 2: Fetch & translate source article → contentAr ──
        // contentAr = REAL translated article content from the source URL.
        // This is NEVER overwritten by AI-generated content.
        // If the source can't be fetched/translated, contentAr stays empty
        // and the AI analysis (Step 3) becomes the primary content.
        // IMPORTANT: Only re-translate if contentAr is truly empty or very short (<50 chars).
        // Good translations (>=50 chars) are NEVER overwritten — this prevents wasting AI
        // calls and potentially replacing good content on every cron run.
        const needsTranslation = !currentHasContent
          || (currentState?.contentAr && currentState.contentAr.length < 50 && /[\u0600-\u06FF]/.test(currentState.contentAr));
        if (needsTranslation) {
          // Save English content to content field (for reference)
          if (articleContent && articleContent.length >= 50) {
            try {
              const currentContent = currentState as any;
              if (!currentContent?.content || currentContent.content.length < articleContent.length) {
                await db.newsItem.update({
                  where: { id },
                  data: { content: articleContent.slice(0, 12000) },
                });
              }
            } catch {}
          }

          // Translate source content to Arabic → contentAr
          if (articleContent && articleContent.length >= 50) {
            try {
              const maxChars = 10000;
              const textToTranslate = articleContent.slice(0, maxChars);

              const result = await chatCompletion(
                [
                  {
                    role: 'system',
                    content: 'أنت مترجم مالي محترف من الإنجليزية إلى العربية بخبرة تزيد عن ٢٠ عاماً في ترجمة المقالات المالية والاقتصادية لصحف عربية رائدة. ترجم النص بأسلوب صحفي عربي احترافي يقرأ وكأنه كتب أصلاً بالعربية.\n\nقواعد صارمة:\n- ترجم بأسلوب صحفي عربي سلس وطبيعي — تجنب الترجمة الحرفية التي تبدو آلية\n- استخدم المصطلحات المالية العربية المعتمدة: (stocks = أسهم، bonds = سندات، inflation = تضخم، GDP = الناتج المحلي الإجمالي، Federal Reserve = الاحتياطي الفيدرالي، Treasury = الخزانة الأمريكية، hedge fund = صندوق تحوط، bull market = سوق صاعد، bear market = سوق هابط، recession = ركود، rally = ارتفاع/صعود، sell-off = موجة بيع، downturn = تراجع، turnaround = تعافي)\n- أسماء الشركات والعملات تُكتب بحروف عربية (مثل: Wall Street = وول ستريت، S&P 500 = إس آند بي 500، Nasdaq = ناسداك، Dow Jones = داو جونز، Bitcoin = بيتكوين، Ethereum = إيثريوم، JPMorgan = جي بي مورغان، Goldman Sachs = غولدمان ساكس)\n- الأرقام والنسب المئوية تبقى كما هي\n- حافظ على تقسيم الفقرات الأصلي\n- لا تستخدم رموز العملات ($ € £ ¥) — بل اكتبها بالعربية (دولار، يورو، جنيه إسترليني، ين ياباني)\n- ترجم الرموز: % = بالمئة، Q1/Q2/Q3/Q4 = الربع الأول/الثاني/الثالث/الرابع، YoY = على أساس سنوي، MoM = على أساس شهري\n- لا تترك أي كلمة إنجليزية بدون ترجمة\n- اكتب الترجمة فقط بدون أي شرح إضافي',
                  },
                  {
                    role: 'user',
                    content: 'ترجم النص المالي التالي من الإنجليزية إلى العربية:\n\n' + textToTranslate,
                  },
                ],
                { temperature: 0.2, maxTokens: 6000, priority: 'translation' }  // V54: Auto-select best available provider
              );

              const translatedText = result.content?.trim() || '';
              const isArabic = /[\u0600-\u06FF]/.test(translatedText);

              if (isArabic && translatedText.length > 100) {
                await db.newsItem.update({
                  where: { id },
                  data: { contentAr: translatedText },
                });
                contentTranslated++;
                console.log(`[PreProcess] ✓ contentAr (real translation) saved for "${(currentTitleAr || item.title).slice(0, 40)}..." (${translatedText.length} chars)`);
              }
            } catch (translateErr: any) {
              console.warn(`[PreProcess] Content translation failed for "${item.title.slice(0, 30)}": ${translateErr.message}`);
            }
          }

          // V23 REMOVED: Previously, if source content couldn't be fetched/translated,
          // we would save summaryAr as contentAr. This was a MAJOR cause of empty articles:
          // summaryAr is typically 1-2 sentences, which makes articles look "title-only".
          // Now we leave contentAr empty — the AI analysis (Step 3) will provide the content.
          // The pipeline-worker will also set contentAr from the AI analysis fullContent.
        }

        // ── Update processing stage to 'translated' after content fetch + translation ──
        await updateProcessingStage(id, 'translated');

        // ── Step 3: Generate AI analysis → aiAnalysis ONLY ──
        // CRITICAL ARCHITECTURE: aiAnalysis and contentAr are SEPARATE.
        // - contentAr = real translated article from the source (Step 2)
        // - aiAnalysis = AI-generated FINANCIAL ANALYSIS (this step)
        // aiAnalysis is NEVER saved to contentAr. This prevents duplicate display.
        // If contentAr is empty (source unavailable), the AI analysis becomes the
        // primary content and will be shown as the article body.
        if (!currentHasAnalysis) {
          try {
            const analysisTitle = currentTitleAr || item.titleAr || item.title;
            const analysisSummary = currentSummaryAr || item.summaryAr || item.summary;

            const analysisResult = await chatCompletion(
              [
                {
                  role: 'system',
                  content: 'أنت محلل مالي أول في منصة "رؤى" للأخبار الاقتصادية، بخبرة ٢٠ عاماً في تحليل الأسواق المالية العالمية ومستشار استثماري معتمد (CFA). مهمتك كتابة تحليل مالي عميق ومستقل باللغة العربية.\n\nقواعد صارمة — التحليل يجب أن يكون مختلفاً جذرياً عن نص الخبر:\n\n1. المحتوى المطلوب (تحليل فقط — لا إعادة صياغة):\n   - لماذا هذا الحدث مهم فعلياً؟ ما الذي لا يقوله الخبر صراحة؟\n   - ما الأسباب الجذرية وراء الحدث — وليس مجرد وصف ما حدث\n   - مقارنة مع أحداث تاريخية مشابهة: ماذا حدث حينها وكيف تطورت الأسواق؟\n   - من المستفيد ومن المتضرر فعلياً — والسبب وراء ذلك\n   - السيناريوهات المحتملة: المتفائل والمتشائم والأكثر احتمالاً\n   - ما الذي يجب أن يفعله المستثمر العربي تحديداً بناءً على هذا الخبر\n\n2. محتوى محظور (لا تكتبه أبداً):\n   - إعادة صياغة أو تلخيص نص الخبر — هذا موجود بالفعل في قسم "الخبر من المصدر"\n   - ذكر تفاصيل الخبر الأساسية (من قال ماذا ومتى وأين) — القارئ قرأها بالفعل\n   - العبارات العامة الفارغة مثل "من المتوقع أن يؤثر" بدون تحديد كيف ولماذا\n   - تكرار نفس المعلومة في أقسام مختلفة\n   - عبارات التحفظ الزائد مثل "قد يشهد السوق تقلبات"\n\n3. أسلوب الكتابة:\n   - اكتب بأسلوب تحليلي حاسم ومباشر — كأنك تكتب تقريراً لصندوق تحوط\n   - كل فقرة ٤-٦ جمل كحد أدنى\n   - استخدم لغة مالية دقيقة ومصطلحات عربية متخصصة\n   - كن حاسماً في استنتاجاتك — تجنب التردد والتعميم\n   - لا تستخدم علامات Markdown (لا ## لا ** لا -)\n\n4. تنسيق JSON:\n   - articleBody: نص واحد طويل يحتوي على ٣-٤ فقرات تحليلية مفصلة مفصولة بسطر جديد\n   - keyTakeaways: مصفوفة نصوص تحليلية (ليست تلخيصاً للخبر)\n   - affectedAssets: أضف أصولاً فقط إذا كان التأثير المالي مباشر وواضح\n   - recommendation: توصية عملية محددة أو "لا توصية — خبر إخباري عام"\n   - sentiment: بناءً على التأثير المالي الفعلي وليس نبرة الخبر\n\nأجب دائماً بصيغة JSON صحيحة فقط بدون أي نص إضافي.',
                },
                {
                  role: 'user',
                  content: 'اكتب تحليلاً مالياً عميقاً ومستقلاً بناءً على الخبر التالي. تذكر: أنت تكتب تحليلاً وليس تلخيصاً — القارئ قرأ الخبر بالفعل ويريد فهم الأبعاد الخفية والآثار المستقبلية.\n\nالعنوان: ' + analysisTitle + '\nالملخص: ' + analysisSummary + '\nالتصنيف: ' + item.category + '\n\nأجب بصيغة JSON فقط:\n{\n  "introduction": "مقدمة تحليلية تشرح لماذا هذا الخبر مهم للأسواق فعلياً وما الذي لا يقوله صراحة (٤-٦ جمل تحليلية وليست إخبارية)",\n  "articleBody": "٣-٤ فقرات تحليلية تشمل: الأسباب الجذرية، مقارنة تاريخية مع أحداث مشابهة وتأثيرها آنذاك، من المستفيد/المتضرر ولماذا، والسيناريوهات المحتملة. كل فقرة ٤-٦ جمل. افصل بين الفقرات بسطر جديد.",\n  "conclusion": "خلاصة استشرافية تعطي توقعاً حاسماً مختلفاً عما ذكر في المقدمة مع توصية عملية للمستثمر العربي (٣-٥ جمل)",\n  "keyTakeaways": ["استنتاج تحليلي 1 — ليس تلخيصاً", "استنتاج تحليلي 2", "استنتاج تحليلي 3"],\n  "affectedAssets": [{"symbol": "XXX", "direction": "up|down|neutral", "reason": "السبب التحليلي الدقيق"}],\n  "sentiment": "positive|negative|neutral",\n  "recommendation": "توصية مالية عملية محددة أو \\"لا توصية — خبر إخباري عام\\""\n}',
                },
              ],
              { temperature: 0.5, maxTokens: 5000, priority: 'generation' }  // V54: Auto-select best available provider
            );

            const jsonMatch = analysisResult.content?.match(/\{[\s\S]*\}/);
            let analysisSaved = false;

            if (jsonMatch) {
              try {
                const generated = JSON.parse(jsonMatch[0]);
                // Use deepToString to prevent [object Object] artifacts
                const introduction = cleanObjectArtifacts(deepToString(generated.introduction));
                const articleBody = cleanObjectArtifacts(
                  deepToString(generated.articleBody) || deepToString(generated.body)
                );
                const conclusion = cleanObjectArtifacts(deepToString(generated.conclusion));
                const fullContent = cleanObjectArtifacts([introduction, articleBody, conclusion].filter(Boolean).join('\n\n'));

                // Clean keyTakeaways: convert any objects to strings
                const keyTakeaways = Array.isArray(generated.keyTakeaways)
                  ? generated.keyTakeaways.map((item: any) => deepToString(item)).filter((s: string) => s.length > 0)
                  : [];

                // Clean affectedAssets: ensure each has symbol/direction/reason
                const affectedAssets = Array.isArray(generated.affectedAssets)
                  ? generated.affectedAssets.map((asset: any) => {
                      if (typeof asset === 'string') return { symbol: asset, direction: 'neutral', reason: '' };
                      return {
                        symbol: String(asset.symbol || asset.name || asset.ticker || ''),
                        direction: String(asset.direction || 'neutral'),
                        reason: String(asset.reason || ''),
                      };
                    }).filter((a: any) => a.symbol.length > 0)
                  : [];

                if (fullContent.length > 50) {
                  const wordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;
                  const analysisData = {
                    fullContent,
                    introduction,
                    body: articleBody,
                    conclusion,
                    keyTakeaways,
                    affectedAssets,
                    recommendation: String(generated.recommendation || ''),
                    sentiment: String(generated.sentiment || 'neutral'),
                    wordCount,
                    generatedAt: new Date().toISOString(),
                  };

                  // CRITICAL: Save ONLY to aiAnalysis. NEVER overwrite contentAr.
                  // contentAr contains the real translated article (from Step 2).
                  // aiAnalysis contains the AI-generated financial analysis.
                  // These are displayed in SEPARATE sections on the article page.
                  await db.newsItem.update({
                    where: { id },
                    data: { aiAnalysis: JSON.stringify(analysisData) },
                  });
                  analysisGenerated++;
                  analysisSaved = true;
                  console.log(`[PreProcess] ✓ AI analysis saved (aiAnalysis only, NOT contentAr) for "${(currentTitleAr || item.title).slice(0, 40)}..." (${fullContent.length} chars)`);
                }
              } catch (parseErr: any) {
                console.warn(`[PreProcess] AI analysis JSON parse failed for "${item.title.slice(0, 30)}": ${parseErr.message}`);

                // Second attempt: try to fix common JSON issues
                try {
                  let fixedJson = jsonMatch[0]
                    .replace(/,\s*([}\]])/g, '$1')
                    .replace(/(\w+)\s*:/g, '"$1":')
                    .replace(/""/g, '"');
                  const generated = JSON.parse(fixedJson);
                  // Use deepToString to prevent [object Object] artifacts
                  const introduction = cleanObjectArtifacts(deepToString(generated.introduction));
                  const articleBody = cleanObjectArtifacts(
                    deepToString(generated.articleBody) || deepToString(generated.body)
                  );
                  const conclusion = cleanObjectArtifacts(deepToString(generated.conclusion));
                  const fullContent = cleanObjectArtifacts([introduction, articleBody, conclusion].filter(Boolean).join('\n\n'));

                  const keyTakeaways = Array.isArray(generated.keyTakeaways)
                    ? generated.keyTakeaways.map((item: any) => deepToString(item)).filter((s: string) => s.length > 0)
                    : [];
                  const affectedAssets = Array.isArray(generated.affectedAssets)
                    ? generated.affectedAssets.map((asset: any) => {
                        if (typeof asset === 'string') return { symbol: asset, direction: 'neutral', reason: '' };
                        return {
                          symbol: String(asset.symbol || asset.name || asset.ticker || ''),
                          direction: String(asset.direction || 'neutral'),
                          reason: String(asset.reason || ''),
                        };
                      }).filter((a: any) => a.symbol.length > 0)
                    : [];

                  if (fullContent.length > 50) {
                    const wordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;
                    const analysisData = {
                      fullContent,
                      introduction,
                      body: articleBody,
                      conclusion,
                      keyTakeaways,
                      affectedAssets,
                      recommendation: String(generated.recommendation || ''),
                      sentiment: String(generated.sentiment || 'neutral'),
                      wordCount,
                      generatedAt: new Date().toISOString(),
                    };

                    // CRITICAL: Save ONLY to aiAnalysis, NOT contentAr
                    await db.newsItem.update({
                      where: { id },
                      data: { aiAnalysis: JSON.stringify(analysisData) },
                    });
                    analysisGenerated++;
                    analysisSaved = true;
                    console.log(`[PreProcess] ✓ AI analysis saved (JSON fix, aiAnalysis only) for "${(currentTitleAr || item.title).slice(0, 40)}..." (${fullContent.length} chars)`);
                  }
                } catch (fixErr: any) {
                  console.warn(`[PreProcess] AI analysis JSON fix also failed for "${item.title.slice(0, 30)}": ${fixErr.message}`);
                }
              }
            }

            // Fallback: if JSON parsing failed, save raw AI text as aiAnalysis only
            if (!analysisSaved && analysisResult.content && analysisResult.content.trim().length > 30) {
              const rawText = analysisResult.content.trim();
              if (/[\u0600-\u06FF]/.test(rawText)) {
                const introEnd = rawText.indexOf('\n');
                const analysisData = {
                  fullContent: rawText,
                  introduction: rawText.slice(0, introEnd > 0 ? Math.min(introEnd, 200) : 200),
                  body: rawText,
                  conclusion: '',
                  keyTakeaways: [],
                  affectedAssets: [],
                  recommendation: '',
                  sentiment: 'neutral',
                  generatedAt: new Date().toISOString(),
                };

                // CRITICAL: Save ONLY to aiAnalysis, NOT contentAr
                await db.newsItem.update({
                  where: { id },
                  data: { aiAnalysis: JSON.stringify(analysisData) },
                });
                analysisGenerated++;
                console.log(`[PreProcess] ✓ AI analysis (raw fallback, aiAnalysis only) saved for "${(currentTitleAr || item.title).slice(0, 40)}..." (${rawText.length} chars)`);
              }
            }
          } catch (analysisErr: any) {
            console.warn(`[PreProcess] AI analysis generation failed for "${item.title.slice(0, 30)}": ${analysisErr.message}`);
            // Increment retryCount instead of pushing to past
            try {
              const current = await db.newsItem.findUnique({ where: { id }, select: { retryCount: true } });
              const newRetryCount = (current?.retryCount || 0) + 1;
              await db.newsItem.update({ where: { id }, data: { retryCount: newRetryCount, lastError: analysisErr.message } });
            } catch {}
          }
        }

        // ── Update processing stage to 'analyzed' after AI analysis ──
        await updateProcessingStage(id, 'analyzed');

        // ── Step 4: CLEANUP — Clean artifacts, do NOT fill contentAr with AI analysis ──
        // CRITICAL ARCHITECTURE FIX: contentAr and aiAnalysis MUST be different.
        // - contentAr = REAL translated article from the source URL (Step 2)
        // - aiAnalysis = AI-generated FINANCIAL ANALYSIS (Step 3)
        // If the source URL couldn't be fetched, contentAr stays EMPTY.
        // The article page will hide the "الخبر من المصدر" section and show
        // only the AI analysis. This prevents the duplication bug where both
        // sections showed identical AI-generated text.
        try {
          const finalState = await db.newsItem.findUnique({
            where: { id },
            select: { contentAr: true, aiAnalysis: true, titleAr: true, summaryAr: true },
          });

          const finalContentAr = finalState?.contentAr;
          const finalAiAnalysis = finalState?.aiAnalysis;

          // Clean [object Object] artifacts from existing contentAr if present
          if (finalContentAr?.includes('[object Object]')) {
            const cleaned = cleanObjectArtifacts(finalContentAr);
            if (cleaned.length > 50 && /[\u0600-\u06FF]/.test(cleaned)) {
              await db.newsItem.update({
                where: { id },
                data: { contentAr: cleaned },
              });
              console.log(`[PreProcess] ✓ contentAr cleaned from [object Object] artifacts for "${(currentTitleAr || item.title).slice(0, 40)}..."`);
            }
          }

          // Check if contentAr was wrongly filled with AI analysis text (duplicate bug)
          // CRITICAL FIX: Only clear contentAr if it's EXACTLY the same as aiAnalysis.
          // Previously, similarity > 0.9 was too aggressive — Arabic texts about the same
          // topic naturally share many words, causing real translations to be deleted.
          // Now we require near-exact match (similarity > 0.98 AND similar length ratio)
          // to only catch cases where contentAr was literally copied from aiAnalysis.
          if (finalContentAr && finalAiAnalysis && finalContentAr.length > 50) {
            try {
              const parsed = JSON.parse(finalAiAnalysis);
              const aiFullContent = parsed.fullContent || parsed.body || '';
              // Only check if both texts are substantial
              if (aiFullContent.length > 50) {
                const similarity = calculateSimilarity(finalContentAr, aiFullContent);
                // Check length ratio — if contentAr is much longer/shorter, it's different content
                const lengthRatio = Math.min(finalContentAr.length, aiFullContent.length) / Math.max(finalContentAr.length, aiFullContent.length);
                // Near-exact match: >99% similar AND >95% length match
                // Only catches cases where contentAr was literally copied from aiAnalysis.
                // Arabic texts about the same topic naturally share many words, so
                // we need an extremely high threshold to avoid false positives.
                if (similarity > 0.99 && lengthRatio > 0.95) {
                  await db.newsItem.update({
                    where: { id },
                    data: { contentAr: null },
                  });
                  console.log(`[PreProcess] ✓ Cleared EXACT duplicate contentAr (similarity=${(similarity * 100).toFixed(0)}%, lengthRatio=${(lengthRatio * 100).toFixed(0)}%) for "${(currentTitleAr || item.title).slice(0, 40)}..."`);
                }
              }
            } catch {}
          }

          // V26 CRITICAL FIX: REMOVED V16 code that copied AI analysis to contentAr.
          // That code caused "نص الخبر هو نفسه التحليل" — both sections showed identical text.
          // contentAr should ONLY contain REAL translated source article content.
          // If no source content is available, contentAr stays empty and the article page
          // shows ONLY the AI analysis section (no duplication).

          // Log the final state
          if (!finalContentAr || finalContentAr.length < 50 || !/[\u0600-\u06FF]/.test(finalContentAr)) {
            console.log(`[PreProcess] No real source content for "${(currentTitleAr || item.title).slice(0, 40)}..." — article page will show AI analysis only (no duplication)`);
          }

          // Check if aiAnalysis is missing or a placeholder that needs re-processing
          let needsAnalysis = !finalAiAnalysis || finalAiAnalysis.length < 10;
          if (!needsAnalysis) {
            try {
              const parsed = JSON.parse(finalAiAnalysis!);
              if (parsed.isMinimal === true) needsAnalysis = true;
              if (parsed.isSummaryFallback === true && (!parsed.body || parsed.body.length < 20)) needsAnalysis = true;
            } catch {}
          }

          if (needsAnalysis) {
            console.log(`[PreProcess] Article "${(currentTitleAr || item.title).slice(0, 40)}..." needs real AI analysis — will be retried in next cron run`);
          }
        } catch (fallbackErr: any) {
          console.warn(`[PreProcess] Cleanup step failed for "${item.title.slice(0, 30)}": ${fallbackErr.message}`);
        }

        // ── Step 5: Generate AI illustrative image ──
        // Generate a professional illustrative image for the article.
        // This replaces source images (Reuters, etc.) with AI-generated art.
        // Wrapped in try/catch since generatedImage column may not exist yet.
        try {
          let currentImageState: any = null;
          try {
            // EGRESS FIX: Check image existence via processingStage instead of pulling generatedImage base64
            // If article is at 'imaged' stage, it already has an image — skip generation
            currentImageState = await db.newsItem.findUnique({
              where: { id },
              select: { processingStage: true, imageUrl: true },
            });
          } catch (imgSelectErr: any) {
            // If generatedImage column doesn't exist, skip image generation
            if (imgSelectErr.message?.includes('generatedImage') || imgSelectErr.message?.includes('column')) {
              console.warn(`[PreProcess] generatedImage column not found, skipping image generation`);
            } else {
              throw imgSelectErr;
            }
          }

          // Only generate if no generated image exists yet (EGRESS FIX: use processingStage as proxy)
          if (currentImageState && currentImageState.processingStage !== 'imaged') {
            if (!await ensureZAIConfig()) {
              console.log('[PreProcess] Skipping AI image generation — ZAI not configured');
            } else {
            const ZAI = (await import('z-ai-web-dev-sdk')).default;
            const zai = await ZAI.create();

            const imgTitle = currentTitleAr || item.titleAr || item.title;
            const imgCategory = item.category || 'اقتصاد كلي';
            const imagePrompt = buildArticleImagePrompt(imgTitle, imgCategory);

            const imgResult = await zai.images.generations.create({
              prompt: imagePrompt,
              size: '1344x768',
            });

            if (imgResult.data && imgResult.data.length > 0 && imgResult.data[0].base64) {
              // V1118: Upload to R2 instead of storing base64 in DB
              try {
                const { uploadImageToR2 } = await import('@/lib/image-storage');
                const imgBuffer = Buffer.from(imgResult.data[0].base64, 'base64');
                const r2Result = await uploadImageToR2(id, imgBuffer, 'image/jpeg');
                const imgValue = r2Result.success ? r2Result.url : null;
                await db.newsItem.update({
                  where: { id },
                  data: { generatedImage: imgValue },
                });
              } catch (e) {
                await db.newsItem.update({
                  where: { id },
                  data: { generatedImage: null },
                });
              }
              // V23: Only update processing stage, do NOT set isReady=true here.
              // isReady is set ONLY by pipeline-worker processOneArticleCompletely()
              await updateProcessingStage(id, 'imaged');
              console.log(`[PreProcess] ✓ AI illustrative image generated for "${(currentTitleAr || item.title).slice(0, 40)}..."`);
            }
            } // end else (ZAI configured)
          }
        } catch (imgErr: any) {
          // Non-blocking — image generation failure shouldn't prevent article publishing
          console.warn(`[PreProcess] Image generation failed for "${item.title.slice(0, 30)}": ${imgErr.message}`);
        }

        // ── Step 6: Mark as READY using unified markArticleReady() ──
        // Uses the SINGLE SOURCE OF TRUTH from src/lib/news-ready.ts
        // Criteria: titleAr (Arabic) + slug + (contentAr > 100 OR real aiAnalysis > 100)
        try {
          const { markArticleReady } = await import('@/lib/news-ready');
          const becameReady = await markArticleReady(id || '');
          if (becameReady) {
            console.log(`[PreProcess] ✓ Article marked READY: "${(currentTitleAr || item.title).slice(0, 40)}..."`);
          } else {
            console.log(`[PreProcess] Article NOT ready yet: "${item.title.slice(0, 40)}..." — will be retried`);
          }
        } catch (readyErr: any) {
          console.warn(`[PreProcess] Ready check failed for "${item.title.slice(0, 30)}": ${readyErr.message}`);
        }
      } catch (err: any) {
        console.warn(`[PreProcess] Error processing "${item.title.slice(0, 30)}": ${err.message}`);
        failed++;
      }
    }));

    // Small delay between batches
    if (i + BATCH_SIZE < processableItems.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[PreProcess] ✓ Completed: ${processed} processed, ${skipped} skipped, ${titlesTranslated} titles translated, ${contentTranslated} content translated, ${analysisGenerated} analyses generated, ${failed} failed, ${duration}ms`);
  return { contentTranslated, analysisGenerated, titlesTranslated, failed, processed, skipped, duration };
}

// ── Improved HTML text extractor ──
// Enhanced version that handles more HTML structures and extracts
// more complete article text from various news source formats.
function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, nav, header, footer, and other non-content elements
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<button[\s\S]*?<\/button>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments

  // Try to find article content first (most specific → least specific)
  let contentArea = '';

  // 1. Try <article> tag (most semantic)
  const articleMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    contentArea = articleMatch[1];
  }

  // 2. Try role="article" or role="main"
  if (!contentArea) {
    const roleMatch = clean.match(/<[^>]*role=["'](?:article|main)["'][^>]*>([\s\S]*?)<\/\w+>/i);
    if (roleMatch) contentArea = roleMatch[1];
  }

  // 3. Try common content class names (expanded list)
  if (!contentArea) {
    const contentPatterns = [
      /<div[^>]*class="[^"]*(?:article-body|article__body|article-content|article__content|story-body|story-body-text|post-body|entry-content|main-content|content-body|body-text|article-text|story-content|news-body|article_detail|longform-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*data-component=["'](?:article-body|story-body|article-content)["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*(?:article-body|article-content|story-body|content-body|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]*class="[^"]*(?:content|article|story|body|post)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    for (const pattern of contentPatterns) {
      const match = clean.match(pattern);
      if (match) {
        contentArea = match[1];
        break;
      }
    }
  }

  // Use the content area if found, otherwise use the whole cleaned HTML
  const source = contentArea || clean;

  // Extract text from <p> tags (primary content markers)
  const paragraphs: string[] = [];
  const pMatches = source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const match of pMatches) {
    const text = match[1]
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#\d+;/g, '') // Remove numeric HTML entities
      .trim();

    // Skip very short paragraphs (likely UI elements, bylines, etc.)
    // Also skip paragraphs that look like metadata (dates, author names, etc.)
    if (text.length > 30 && !/^(By|Published|Updated|Copyright|Subscribe|Sign up|Read more|Share|Follow|Advertisement)/i.test(text)) {
      paragraphs.push(text);
    }
  }

  // If we got very few paragraphs, also try <li> and <h2>-<h6> elements as backup
  if (paragraphs.length < 3) {
    const liMatches = source.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    for (const match of liMatches) {
      const text = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .trim();
      if (text.length > 30) {
        paragraphs.push(text);
      }
    }
  }

  return paragraphs.join('\n\n');
}

// ─── Build Article Image Prompt ──────────────────────────────
// Creates a professional, abstract financial illustration prompt
// based on the article's title and category.
// These are NOT literal depictions — they're abstract editorial illustrations
// in the style of Bloomberg/FT, with dark backgrounds and geometric data viz elements.
function buildArticleImagePrompt(title: string, category: string): string {
  // Map category to visual style elements
  const categoryStyles: Record<string, string> = {
    'أسهم': 'stock market trading floor, digital stock tickers, bull and bear symbols, candlestick charts, equity market dashboard',
    'عملات رقمية': 'cryptocurrency visualization, blockchain nodes connected by glowing lines, Bitcoin and Ethereum symbols, digital currency network',
    'طاقة': 'oil derricks silhouette, energy pipelines, solar panels and wind turbines, energy trading dashboard, petroleum industry',
    'اقتصاد أمريكي': 'US Capitol building silhouette, Federal Reserve building, American economic indicators dashboard, Wall Street skyline',
    'اقتصاد كلي': 'global trade routes on a map, world economic connections, international finance symbols, GDP growth curves',
    'سلع': 'commodity trading floor, gold bars gleaming, oil barrels, precious metals, agricultural commodities',
    'عقارات': 'modern cityscape, real estate development, skyscrapers, property market visualization',
    'تقنية': 'circuit board patterns, AI neural networks, tech innovation abstract, digital transformation, silicon chips',
    'سياسة': 'diplomatic meeting room, global summit flags, international relations, political landmarks silhouette',
  };

  const styleForCategory = categoryStyles[category] || categoryStyles['اقتصاد كلي'];

  return `High-quality professional editorial illustration for a financial news article titled: "${title}". Theme: ${styleForCategory}. 3D render style, dynamic composition, cinematic lighting. Clean, corporate aesthetic suitable for Bloomberg or Financial Times. No text, no words, no letters. Make the central subject highly prominent and visually distinct.`;
}
