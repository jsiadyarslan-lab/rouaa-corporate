// ─── Admin Keys Management API (V400) ──────────────────────
// Full API key management: view, add, remove, test, enable/disable keys
// Supports multi-key per provider with round-robin rotation
// GET: List all providers with their keys, status, assignments, quotas
// PUT: Add key, remove key, toggle provider, change assignment
// POST: Test a specific key

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';
import { getProviders, testProviderDirectly } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';

// ─── Provider key env var mapping (supports multi-key) ──────
const PROVIDER_KEY_CONFIG: Record<string, {
  envVars: string[];       // Primary env vars (comma-separated supported)
  numberedPattern: string; // Pattern for numbered vars (e.g. GROQ_API_KEY_1)
  baseUrl?: string;        // Optional base URL env var
  modelEnvVar?: string;    // Model override env var
  defaultModel: string;    // Default model name
  category: 'text' | 'image' | 'tts' | 'financial' | 'news' | 'storage' | 'messaging' | 'auth';
  descriptionAr: string;
  descriptionEn: string;
  maxNumberedKeys: number; // Max numbered keys to check
}> = {
  // ── Text/Chat AI Providers ──
  groq: {
    envVars: ['GROQ_API_KEY'],
    numberedPattern: 'GROQ_API_KEY',
    modelEnvVar: 'GROQ_MODEL',
    defaultModel: 'llama-3.3-70b-versatile',
    category: 'text',
    descriptionAr: 'نماذج نصية سريعة جداً — Llama 3.3 70B',
    descriptionEn: 'Ultra-fast text models — Llama 3.3 70B',
    maxNumberedKeys: 10,
  },
  grok: {
    envVars: ['XAI_API_KEY'],
    numberedPattern: 'XAI_API_KEY',
    modelEnvVar: 'XAI_MODEL',
    defaultModel: 'grok-3-mini-beta',
    category: 'text',
    descriptionAr: 'نماذج Grok-3 و Grok-3 Mini',
    descriptionEn: 'Grok-3 and Grok-3 Mini models',
    maxNumberedKeys: 10,
  },
  bedrock: {
    envVars: ['AWS_ACCESS_KEY_ID'],
    numberedPattern: 'AWS_ACCESS_KEY_ID',
    modelEnvVar: 'BEDROCK_MODEL',
    defaultModel: 'anthropic.claude-sonnet-4-20250514',
    category: 'text',
    descriptionAr: 'أمازون بيروك — Claude Sonnet 4 (أفضل جودة عربية)',
    descriptionEn: 'Amazon Bedrock — Claude Sonnet 4 (best Arabic quality)',
    maxNumberedKeys: 1,
  },
  gemini: {
    envVars: ['GEMINI_API_KEY', 'GOOGLE_AI_STUDIO_API_KEY'],
    numberedPattern: 'GEMINI_API_KEY',
    modelEnvVar: 'GEMINI_MODEL',
    defaultModel: 'gemini-2.0-flash',
    category: 'text',
    descriptionAr: 'جوجل جيميني — نماذج نصية وصور',
    descriptionEn: 'Google Gemini — text and image models',
    maxNumberedKeys: 10,
  },
  deepseek: {
    envVars: ['DEEPSEEK_API_KEY'],
    numberedPattern: 'DEEPSEEK_API_KEY',
    modelEnvVar: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
    category: 'text',
    descriptionAr: 'ديب سيك — نماذج صينية قوية',
    descriptionEn: 'DeepSeek — powerful Chinese AI models',
    maxNumberedKeys: 10,
  },
  openrouter: {
    envVars: ['OPENROUTER_API_KEY'],
    numberedPattern: 'OPENROUTER_API_KEY',
    modelEnvVar: 'OPENROUTER_MODEL',
    defaultModel: 'deepseek/deepseek-chat-v3-0324:free',
    category: 'text',
    descriptionAr: 'أوبن راوتر — بوابة لنماذج مجانية متعددة',
    descriptionEn: 'OpenRouter — gateway to multiple free models',
    maxNumberedKeys: 10,
  },
  cerebras: {
    envVars: ['CEREBRAS_API_KEY'],
    numberedPattern: 'CEREBRAS_API_KEY',
    modelEnvVar: 'CEREBRAS_MODEL',
    defaultModel: 'llama-3.3-70b',
    category: 'text',
    descriptionAr: 'سيريبيراس — استدلال فائق السرعة',
    descriptionEn: 'Cerebras — ultra-fast inference',
    maxNumberedKeys: 10,
  },
  mistral: {
    envVars: ['MISTRAL_API_KEY'],
    numberedPattern: 'MISTRAL_API_KEY',
    modelEnvVar: 'MISTRAL_MODEL',
    defaultModel: 'mistral-small-latest',
    category: 'text',
    descriptionAr: 'ميسترال — نماذج فرنسية الأصل',
    descriptionEn: 'Mistral — French-native AI models',
    maxNumberedKeys: 10,
  },
  nvidia: {
    envVars: ['NVIDIA_API_KEY'],
    numberedPattern: 'NVIDIA_API_KEY',
    modelEnvVar: 'NVIDIA_MODEL',
    defaultModel: 'meta/llama-3.1-405b-instruct',
    category: 'text',
    descriptionAr: 'إنفيديا NIM — نماذج كبيرة مجانية',
    descriptionEn: 'NVIDIA NIM — free large models',
    maxNumberedKeys: 10,
  },
  glm: {
    envVars: ['GLM_API_KEY'],
    numberedPattern: 'GLM_API_KEY',
    baseUrl: 'GLM_BASE_URL',
    modelEnvVar: 'GLM_MODEL',
    defaultModel: 'glm-4-flash',
    category: 'text',
    descriptionAr: 'ChatGLM — نماذج صينية متعددة اللغات',
    descriptionEn: 'ChatGLM — multilingual Chinese models',
    maxNumberedKeys: 10,
  },
  sambanova: {
    envVars: ['SAMBANOVA_API_KEY'],
    numberedPattern: 'SAMBANOVA_API_KEY',
    modelEnvVar: 'SAMBANOVA_MODEL',
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
    category: 'text',
    descriptionAr: 'سامبانوفا — نماذج مفتوحة المصدر سريعة',
    descriptionEn: 'SambaNova — fast open-source models',
    maxNumberedKeys: 10,
  },
  cohere: {
    envVars: ['COHERE_API_KEY'],
    numberedPattern: 'COHERE_API_KEY',
    modelEnvVar: 'COHERE_MODEL',
    defaultModel: 'command-a',
    category: 'text',
    descriptionAr: 'كوهير — نماذج أوامر متقدمة',
    descriptionEn: 'Cohere — advanced command models',
    maxNumberedKeys: 10,
  },
  siliconflow: {
    envVars: ['SILICONFLOW_API_KEY'],
    numberedPattern: 'SILICONFLOW_API_KEY',
    modelEnvVar: 'SILICONFLOW_MODEL',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    category: 'text',
    descriptionAr: 'سيليكون فلو — نماذج مجانية متنوعة',
    descriptionEn: 'SiliconFlow — diverse free models',
    maxNumberedKeys: 10,
  },
  deepinfra: {
    envVars: ['DEEPINFRA_API_KEY'],
    numberedPattern: 'DEEPINFRA_API_KEY',
    modelEnvVar: 'DEEPINFRA_MODEL',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
    category: 'text',
    descriptionAr: 'ديب إنفرا — 1M توكن مجاني يومياً',
    descriptionEn: 'DeepInfra — 1M free tokens/day',
    maxNumberedKeys: 10,
  },
  zukijourney: {
    envVars: ['ZUKIJOURNEY_API_KEY'],
    numberedPattern: 'ZUKIJOURNEY_API_KEY',
    defaultModel: 'gpt-4o-mini',
    category: 'text',
    descriptionAr: 'زوكي جورني — نماذج مجانية',
    descriptionEn: 'ZukiJourney — free models',
    maxNumberedKeys: 10,
  },
  nagaai: {
    envVars: ['NAGAAI_API_KEY'],
    numberedPattern: 'NAGAAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    category: 'text',
    descriptionAr: 'ناجا AI — نماذج مجانية متعددة',
    descriptionEn: 'NagaAI — multiple free models',
    maxNumberedKeys: 10,
  },
  ollama: {
    envVars: ['OLLAMA_API_KEY'],
    numberedPattern: 'OLLAMA_API_KEY',
    baseUrl: 'OLLAMA_BASE_URL',
    modelEnvVar: 'OLLAMA_MODEL',
    defaultModel: 'gemma3:12b',
    category: 'text',
    descriptionAr: 'أولاما — محلي أو سحابي (ollama.com)، لا يحتاج مفتاح محلياً',
    descriptionEn: 'Ollama — local or cloud (ollama.com), no key needed locally',
    maxNumberedKeys: 5,
  },
  hf: {
    envVars: ['HF_API_KEY', 'HF_API_TOKEN', 'HF_TOKEN'],
    numberedPattern: 'HF_API_KEY',
    modelEnvVar: 'HF_IMAGE_MODEL',
    defaultModel: 'black-forest-labs/FLUX.1-schnell',
    category: 'image',
    descriptionAr: 'هجينج فيس — نماذج نصية وصور (FLUX)',
    descriptionEn: 'HuggingFace — text and image models (FLUX)',
    maxNumberedKeys: 10,
  },
  cloudflare: {
    envVars: ['CLOUDFLARE_API_TOKEN'],
    numberedPattern: 'CLOUDFLARE_API_TOKEN',
    modelEnvVar: 'CLOUDFLARE_MODEL',
    defaultModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    category: 'text',
    descriptionAr: 'كلاودفلير وركرز AI — نص وصور FLUX',
    descriptionEn: 'Cloudflare Workers AI — text and FLUX images',
    maxNumberedKeys: 5,
  },
  together: {
    envVars: ['TOGETHER_API_KEY'],
    numberedPattern: 'TOGETHER_API_KEY',
    modelEnvVar: 'TOGETHER_IMAGE_MODEL',
    defaultModel: 'black-forest-labs/FLUX.1-schnell-Free',
    category: 'image',
    descriptionAr: 'توغذر AI — توليد صور FLUX مجاني',
    descriptionEn: 'Together AI — free FLUX image generation',
    maxNumberedKeys: 10,
  },
  prodia: {
    envVars: ['PRODIA_API_KEY'],
    numberedPattern: 'PRODIA_API_KEY',
    defaultModel: 'FLUX schnell',
    category: 'image',
    descriptionAr: 'بروديا — توليد صور سريع',
    descriptionEn: 'Prodia — fast image generation',
    maxNumberedKeys: 5,
  },
  stablehorde: {
    envVars: ['STABLEHORDE_API_KEY'],
    numberedPattern: 'STABLEHORDE_API_KEY',
    defaultModel: 'SDXL',
    category: 'image',
    descriptionAr: 'ستيبل هورد — صور مجانية مفتوحة المصدر',
    descriptionEn: 'Stable Horde — free open-source images',
    maxNumberedKeys: 5,
  },
  // ── Financial Data ──
  finnhub: {
    envVars: ['FINNHUB_API_KEY'],
    numberedPattern: 'FINNHUB_API_KEY',
    defaultModel: 'stock-data',
    category: 'financial',
    descriptionAr: 'فينهب — بيانات الأسعار والأخبار المالية',
    descriptionEn: 'Finnhub — stock prices and financial news',
    maxNumberedKeys: 5,
  },
  fmp: {
    envVars: ['FMP_API_KEY'],
    numberedPattern: 'FMP_API_KEY',
    defaultModel: 'financial-statements',
    category: 'financial',
    descriptionAr: 'FMP — القوائم المالية والبيانات الأساسية',
    descriptionEn: 'FMP — financial statements and fundamental data',
    maxNumberedKeys: 5,
  },
  alphavantage: {
    envVars: ['ALPHA_VANTAGE_API_KEY'],
    numberedPattern: 'ALPHA_VANTAGE_API_KEY',
    defaultModel: 'market-data',
    category: 'financial',
    descriptionAr: 'ألفا فانتاج — بيانات السوق والمؤشرات',
    descriptionEn: 'Alpha Vantage — market data and indicators',
    maxNumberedKeys: 5,
  },
  fred: {
    envVars: ['FRED_API_KEY'],
    numberedPattern: 'FRED_API_KEY',
    defaultModel: 'economic-data',
    category: 'financial',
    descriptionAr: 'FRED — البيانات الاقتصادية الفيدرالية',
    descriptionEn: 'FRED — Federal Reserve Economic Data',
    maxNumberedKeys: 5,
  },
  exchangerate: {
    envVars: ['EXCHANGE_RATE_API_KEY'],
    numberedPattern: 'EXCHANGE_RATE_API_KEY',
    defaultModel: 'currency-rates',
    category: 'financial',
    descriptionAr: 'Exchange Rate API — أسعار الصرف',
    descriptionEn: 'Exchange Rate API — currency exchange rates',
    maxNumberedKeys: 5,
  },
  // ── News Sources ──
  newsapi: {
    envVars: ['NEWS_API_KEY'],
    numberedPattern: 'NEWS_API_KEY',
    defaultModel: 'news-feed',
    category: 'news',
    descriptionAr: 'NewsAPI — مصدر أخبار إنجليزي',
    descriptionEn: 'NewsAPI — English news source',
    maxNumberedKeys: 5,
  },
  currentsapi: {
    envVars: ['CURRENTS_API_KEY'],
    numberedPattern: 'CURRENTS_API_KEY',
    defaultModel: 'news-feed',
    category: 'news',
    descriptionAr: 'Currents API — مصدر أخبار متعدد اللغات',
    descriptionEn: 'Currents API — multilingual news source',
    maxNumberedKeys: 5,
  },
  acled: {
    envVars: ['ACLED_API_KEY'],
    numberedPattern: 'ACLED_API_KEY',
    defaultModel: 'conflict-data',
    category: 'news',
    descriptionAr: 'ACLED — بيانات الصراعات والمخاطر الجيوسياسية',
    descriptionEn: 'ACLED — conflict and geopolitical risk data',
    maxNumberedKeys: 5,
  },
  // ── Storage ──
  r2: {
    envVars: ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
    numberedPattern: 'CLOUDFLARE_R2_ACCESS_KEY_ID',
    defaultModel: 'image-storage',
    category: 'storage',
    descriptionAr: 'Cloudflare R2 — تخزين الصور',
    descriptionEn: 'Cloudflare R2 — image storage',
    maxNumberedKeys: 5,
  },
  // ── Messaging ──
  telegram: {
    envVars: ['TELEGRAM_BOT_TOKEN'],
    numberedPattern: 'TELEGRAM_BOT_TOKEN',
    defaultModel: 'notifications',
    category: 'messaging',
    descriptionAr: 'تيليجرام بوت — إرسال الإشعارات',
    descriptionEn: 'Telegram Bot — sending notifications',
    maxNumberedKeys: 5,
  },
};

// ─── Rate limits per provider (RPM) ──────────────────────────
const PROVIDER_RATE_LIMITS: Record<string, { rpm: number; dailyLimit?: number; tier: string }> = {
  groq: { rpm: 28, dailyLimit: 14400, tier: 'free' },
  grok: { rpm: 30, dailyLimit: undefined, tier: 'free' },
  bedrock: { rpm: 40, dailyLimit: undefined, tier: 'paid' },
  gemini: { rpm: 28, dailyLimit: 1200, tier: 'free' },
  deepseek: { rpm: 25, dailyLimit: undefined, tier: 'free' },
  openrouter: { rpm: 30, dailyLimit: undefined, tier: 'free' },
  cerebras: { rpm: 30, dailyLimit: undefined, tier: 'free' },
  mistral: { rpm: 25, dailyLimit: undefined, tier: 'free' },
  nvidia: { rpm: 15, dailyLimit: undefined, tier: 'free' },
  glm: { rpm: 30, dailyLimit: undefined, tier: 'free' },
  sambanova: { rpm: 25, dailyLimit: undefined, tier: 'free' },
  cohere: { rpm: 10, dailyLimit: 1000, tier: 'free' },
  siliconflow: { rpm: 14, dailyLimit: undefined, tier: 'free' },
  deepinfra: { rpm: 25, dailyLimit: undefined, tier: 'free' },
  zukijourney: { rpm: 10, dailyLimit: undefined, tier: 'free' },
  nagaai: { rpm: 20, dailyLimit: undefined, tier: 'free' },
  ollama: { rpm: 60, dailyLimit: undefined, tier: 'free' },
  hf: { rpm: 10, dailyLimit: undefined, tier: 'free' },
  cloudflare: { rpm: 20, dailyLimit: 10000, tier: 'free' },
  together: { rpm: 10, dailyLimit: undefined, tier: 'free' },
  prodia: { rpm: 10, dailyLimit: undefined, tier: 'free' },
  stablehorde: { rpm: 5, dailyLimit: undefined, tier: 'free' },
  finnhub: { rpm: 60, dailyLimit: 6000, tier: 'free' },
  fmp: { rpm: 300, dailyLimit: 1500, tier: 'free' },
  alphavantage: { rpm: 5, dailyLimit: 25, tier: 'free' },
  fred: { rpm: 120, dailyLimit: undefined, tier: 'free' },
  exchangerate: { rpm: 1500, dailyLimit: undefined, tier: 'free' },
  newsapi: { rpm: 60, dailyLimit: 1000, tier: 'free' },
  currentsapi: { rpm: 60, dailyLimit: undefined, tier: 'free' },
  acled: { rpm: 30, dailyLimit: undefined, tier: 'free' },
  r2: { rpm: 1000, dailyLimit: undefined, tier: 'free' },
  telegram: { rpm: 30, dailyLimit: undefined, tier: 'free' },
};

// ─── Category display info ──────────────────────────────────
const CATEGORY_INFO: Record<string, { label: string; labelEn: string; icon: string; color: string }> = {
  text: { label: 'نماذج نصية', labelEn: 'Text Models', icon: 'Brain', color: '#3b82f6' },
  image: { label: 'نماذج صور', labelEn: 'Image Models', icon: 'Image', color: '#a855f7' },
  tts: { label: 'نماذج صوتية', labelEn: 'TTS Models', icon: 'Volume2', color: '#f59e0b' },
  financial: { label: 'بيانات مالية', labelEn: 'Financial Data', icon: 'DollarSign', color: '#10b981' },
  news: { label: 'مصادر أخبار', labelEn: 'News Sources', icon: 'Newspaper', color: '#ef4444' },
  storage: { label: 'تخزين', labelEn: 'Storage', icon: 'HardDrive', color: '#6366f1' },
  messaging: { label: 'مراسلة', labelEn: 'Messaging', icon: 'MessageSquare', color: '#06b6d4' },
  auth: { label: 'مصادقة', labelEn: 'Authentication', icon: 'Shield', color: '#f97316' },
};

// ─── Mask a key for display ──────────────────────────────────
function maskKey(val: string | undefined, show: number = 6): string {
  if (!val) return '';
  if (val.length <= show) return '***';
  return val.slice(0, show) + '***' + val.slice(-4);
}

// ─── Parse all keys for a provider (including numbered) ──────
function parseAllProviderKeys(config: typeof PROVIDER_KEY_CONFIG[string]): Array<{
  index: number;
  envVar: string;
  value: string;
  masked: string;
  isNumbered: boolean;
}> {
  const keys: Array<{ index: number; envVar: string; value: string; masked: string; isNumbered: boolean }> = [];

  // Primary env var(s) — may contain comma-separated keys
  for (const envVar of config.envVars) {
    const mainValue = (process.env[envVar] || '').trim();
    if (mainValue) {
      // Split by comma for multi-key support
      const parts = mainValue.split(',').map(k => k.trim()).filter(k => k);
      parts.forEach((part, idx) => {
        keys.push({
          index: idx,
          envVar: `${envVar}${parts.length > 1 ? ` (${idx + 1})` : ''}`,
          value: part,
          masked: maskKey(part),
          isNumbered: false,
        });
      });
    }
  }

  // Numbered env vars (e.g., XAI_API_KEY_1, XAI_API_KEY_2)
  for (let i = 1; i <= config.maxNumberedKeys; i++) {
    const numberedEnvVar = `${config.numberedPattern}_${i}`;
    const val = (process.env[numberedEnvVar] || '').trim();
    if (val && !keys.some(k => k.value === val)) {
      keys.push({
        index: keys.length,
        envVar: numberedEnvVar,
        value: val,
        masked: maskKey(val),
        isNumbered: true,
      });
    }
  }

  return keys;
}

// ─── GET: List all providers with keys, status, assignments ──
export async function GET(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const providers = getProviders();
    const modelSettings = await db.siteSetting.findMany({
      where: { group: 'models' },
    });
    const settingsMap: Record<string, string> = {};
    for (const s of modelSettings) settingsMap[s.key] = s.value;

    // Build comprehensive provider list
    const providerKeys = Object.entries(PROVIDER_KEY_CONFIG).map(([providerName, config]) => {
      const allKeys = parseAllProviderKeys(config);
      const providerInfo = providers.find(p => p.name === providerName);
      const rateLimit = PROVIDER_RATE_LIMITS[providerName] || { rpm: 0, tier: 'unknown' };
      const category = CATEGORY_INFO[config.category] || CATEGORY_INFO.text;
      const isDisabled = settingsMap[`models_disabled_${providerName}`] === 'true';

      // Determine which pipelines use this provider
      const pipelineAssignments: string[] = [];
      const pipelineTypes = new Set<string>();
      const pipelineDefinitions = [
        { key: 'models_ar_news', locale: 'ar', type: 'news' },
        { key: 'models_ar_reports', locale: 'ar', type: 'reports' },
        { key: 'models_ar_infographic', locale: 'ar', type: 'infographic' },
        { key: 'models_ar_video', locale: 'ar', type: 'video' },
        { key: 'models_ar_image', locale: 'ar', type: 'image' },
        { key: 'models_en_news', locale: 'en', type: 'news' },
        { key: 'models_en_reports', locale: 'en', type: 'reports' },
        { key: 'models_en_infographic', locale: 'en', type: 'infographic' },
        { key: 'models_en_video', locale: 'en', type: 'video' },
        { key: 'models_en_image', locale: 'en', type: 'image' },
        { key: 'models_fr_news', locale: 'fr', type: 'news' },
        { key: 'models_fr_reports', locale: 'fr', type: 'reports' },
        { key: 'models_fr_infographic', locale: 'fr', type: 'infographic' },
        { key: 'models_fr_video', locale: 'fr', type: 'video' },
        { key: 'models_fr_image', locale: 'fr', type: 'image' },
        { key: 'models_es_news', locale: 'es', type: 'news' },
        { key: 'models_es_reports', locale: 'es', type: 'reports' },
        { key: 'models_es_infographic', locale: 'es', type: 'infographic' },
        { key: 'models_es_video', locale: 'es', type: 'video' },
        { key: 'models_es_image', locale: 'es', type: 'image' },
        { key: 'models_tr_news', locale: 'tr', type: 'news' },
        { key: 'models_tr_reports', locale: 'tr', type: 'reports' },
        { key: 'models_tr_infographic', locale: 'tr', type: 'infographic' },
        { key: 'models_tr_video', locale: 'tr', type: 'video' },
        { key: 'models_tr_image', locale: 'tr', type: 'image' },
      ];

      const localeLabels: Record<string, string> = { ar: 'عربي', en: 'إنجليزي', fr: 'فرنسي', es: 'إسباني', tr: 'تركي' };
      const typeLabels: Record<string, string> = { news: 'أخبار', reports: 'تقارير', infographic: 'إنفوغرافيك', video: 'فيديو', image: 'صور' };

      for (const def of pipelineDefinitions) {
        const currentProvider = settingsMap[def.key] || (
          def.type === 'image' ? 'cloudflare' :
          def.locale === 'ar' ? 'bedrock' : 'groq'
        );
        if (currentProvider === providerName) {
          pipelineAssignments.push(`${localeLabels[def.locale]} ${typeLabels[def.type]}`);
          pipelineTypes.add(def.type);
        }
      }

      // Check additional env vars
      const baseUrl = config.baseUrl ? (process.env[config.baseUrl] || '') : '';
      const model = config.modelEnvVar ? (process.env[config.modelEnvVar] || config.defaultModel) : config.defaultModel;

      return {
        name: providerName,
        category: config.category,
        categoryInfo: category,
        descriptionAr: config.descriptionAr,
        descriptionEn: config.descriptionEn,
        available: providerInfo?.available ?? (allKeys.length > 0),
        disabled: isDisabled,
        model,
        baseUrl: baseUrl || (providerInfo?.baseUrl && providerName !== 'bedrock' && providerName !== 'ollama' ? providerInfo.baseUrl : ''),
        keys: allKeys,
        keyCount: allKeys.length,
        hasMultiKeySupport: config.maxNumberedKeys > 1,
        maxNumberedKeys: config.maxNumberedKeys,
        numberedPattern: config.numberedPattern,
        rateLimit,
        pipelineAssignments,
        pipelineTypes: [...pipelineTypes],
        needsKeyForLocal: providerName === 'ollama' ? false : true,
        specialNote: providerName === 'ollama' ? 'لا يحتاج مفتاح عند التشغيل محلياً — مفتاح مطلوب فقط لـ ollama.com السحابي' : undefined,
      };
    });

    // Group by category
    const categories: Record<string, typeof providerKeys> = {};
    for (const pk of providerKeys) {
      if (!categories[pk.category]) categories[pk.category] = [];
      categories[pk.category].push(pk);
    }

    // Summary stats
    const totalProviders = providerKeys.length;
    const providersWithKeys = providerKeys.filter(p => p.keyCount > 0).length;
    const activeProviders = providerKeys.filter(p => p.available && !p.disabled).length;
    const totalKeys = providerKeys.reduce((sum, p) => sum + p.keyCount, 0);
    const multiKeyProviders = providerKeys.filter(p => p.keyCount > 1).length;

    return NextResponse.json({
      stats: {
        totalProviders,
        providersWithKeys,
        activeProviders,
        totalKeys,
        multiKeyProviders,
      },
      categories: Object.entries(categories).map(([cat, providers]) => ({
        key: cat,
        ...CATEGORY_INFO[cat],
        providers,
      })),
      allProviders: providerKeys,
    });
  } catch (error) {
    return apiError(error, 'جلب بيانات المفاتيح');
  }
}

// ─── PUT: Manage keys and settings ──────────────────────────
export async function PUT(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json() as {
      action: 'toggle' | 'add_key' | 'remove_key' | 'set_model';
      provider: string;
      value?: string;
      keyIndex?: number;
      envVar?: string;
    };

    if (!body.action || !body.provider) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const config = PROVIDER_KEY_CONFIG[body.provider];
    if (!config) {
      return NextResponse.json({ error: 'مزود غير صالح' }, { status: 400 });
    }

    switch (body.action) {
      case 'toggle': {
        // Enable/disable provider
        const toggleKey = `models_disabled_${body.provider}`;
        const newValue = body.value || 'false';
        await db.siteSetting.upsert({
          where: { key: toggleKey },
          update: { value: newValue },
          create: { key: toggleKey, value: newValue, group: 'models', type: 'boolean' },
        });
        console.log(`[Keys] Provider ${body.provider} disabled = ${newValue}`);
        return NextResponse.json({ success: true, message: `${body.provider} ${newValue === 'true' ? 'معطل' : 'مفعل'}` });
      }

      case 'add_key': {
        // Add a new key to a provider
        // We store extra keys in SiteSetting with key pattern: provider_key_N
        if (!body.value || body.value.trim().length < 10) {
          return NextResponse.json({ error: 'المفتاح قصير جداً' }, { status: 400 });
        }

        // Find next available slot
        const existingKeys = await db.siteSetting.findMany({
          where: { key: { startsWith: `provider_key_${body.provider}_` } },
        });
        const usedIndices = existingKeys.map(s => {
          const match = s.key.match(/provider_key_.*_(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
        const nextIndex = usedIndices.length > 0 ? Math.max(...usedIndices) + 1 : 1;

        const keySettingKey = `provider_key_${body.provider}_${nextIndex}`;
        await db.siteSetting.upsert({
          where: { key: keySettingKey },
          update: { value: body.value.trim(), group: 'provider_keys', type: 'string' },
          create: { key: keySettingKey, value: body.value.trim(), group: 'provider_keys', type: 'string' },
        });

        console.log(`[Keys] Added key #${nextIndex} for ${body.provider}`);
        return NextResponse.json({ success: true, message: `تمت إضافة مفتاح #${nextIndex} لـ ${body.provider}` });
      }

      case 'remove_key': {
        // Remove a key by its setting key
        if (body.envVar) {
          // If it's a provider_key_N stored in DB, delete it
          if (body.envVar.startsWith('provider_key_')) {
            await db.siteSetting.deleteMany({
              where: { key: body.envVar },
            });
            console.log(`[Keys] Removed key ${body.envVar}`);
            return NextResponse.json({ success: true, message: `تم حذف المفتاح` });
          }
          // Cannot remove env var keys from here — need to update Railway env
          return NextResponse.json({
            success: false,
            message: 'لا يمكن حذف مفاتيح متغيرات البيئة من هنا — يجب حذفها من إعدادات Railway',
          });
        }
        return NextResponse.json({ error: 'لم يتم تحديد المفتاح' }, { status: 400 });
      }

      case 'set_model': {
        // Override model for a provider
        if (!body.value) {
          return NextResponse.json({ error: 'لم يتم تحديد النموذج' }, { status: 400 });
        }
        if (config.modelEnvVar) {
          const modelKey = `provider_model_${body.provider}`;
          await db.siteSetting.upsert({
            where: { key: modelKey },
            update: { value: body.value, group: 'provider_models', type: 'string' },
            create: { key: modelKey, value: body.value, group: 'provider_models', type: 'string' },
          });
          console.log(`[Keys] Model override for ${body.provider}: ${body.value}`);
          return NextResponse.json({ success: true, message: `تم تحديث نموذج ${body.provider}` });
        }
        return NextResponse.json({ error: 'هذا المزود لا يدعم تغيير النموذج' }, { status: 400 });
      }

      default:
        return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }
  } catch (error) {
    return apiError(error, 'إدارة المفاتيح');
  }
}

// ─── POST: Test a provider key ──────────────────────────────
export async function POST(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json() as {
      action: 'test';
      provider: string;
    };

    if (body.action === 'test' && body.provider) {
      const validProviders = getProviders().map(p => p.name);
      if (!validProviders.includes(body.provider)) {
        return NextResponse.json({ error: 'مزود غير صالح للاختبار' }, { status: 400 });
      }

      const result = await testProviderDirectly(body.provider as any);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    return apiError(error, 'اختبار المزود');
  }
}
