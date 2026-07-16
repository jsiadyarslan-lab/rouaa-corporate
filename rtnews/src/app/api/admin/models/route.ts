// ─── Admin Models & Pipeline Mapping API (Enhanced) ──────────────────
// Manages AI provider configurations and pipeline-to-model mappings
// GET: Returns all providers + current mappings + quota + capabilities + key info
// PUT: Save model mapping or provider enable/disable toggle
// POST: Test a specific provider directly

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';
import { getProviders, testProviderDirectly } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';

// ─── Pipeline definitions with their default providers ──────────────
const PIPELINE_DEFINITIONS = [
  // Arabic
  { key: 'models_ar_news', label: 'أخبار عربية', labelEn: 'Arabic News', defaultProvider: 'bedrock', locale: 'ar', type: 'news' },
  { key: 'models_ar_reports', label: 'تقارير عربية', labelEn: 'Arabic Reports', defaultProvider: 'bedrock', locale: 'ar', type: 'reports' },
  { key: 'models_ar_infographic', label: 'إنفوغرافيك عربي', labelEn: 'Arabic Infographic', defaultProvider: 'bedrock', locale: 'ar', type: 'infographic' },
  { key: 'models_ar_video', label: 'فيديو عربي', labelEn: 'Arabic Video', defaultProvider: 'bedrock', locale: 'ar', type: 'video' },
  { key: 'models_ar_image', label: 'صور عربية', labelEn: 'Arabic Images', defaultProvider: 'cloudflare', locale: 'ar', type: 'image' },
  // English
  { key: 'models_en_news', label: 'أخبار إنجليزية', labelEn: 'English News', defaultProvider: 'groq', locale: 'en', type: 'news' },
  { key: 'models_en_reports', label: 'تقارير إنجليزية', labelEn: 'English Reports', defaultProvider: 'groq', locale: 'en', type: 'reports' },
  { key: 'models_en_infographic', label: 'إنفوغرافيك إنجليزي', labelEn: 'English Infographic', defaultProvider: 'groq', locale: 'en', type: 'infographic' },
  { key: 'models_en_video', label: 'فيديو إنجليزي', labelEn: 'English Video', defaultProvider: 'groq', locale: 'en', type: 'video' },
  { key: 'models_en_image', label: 'صور إنجليزية', labelEn: 'English Images', defaultProvider: 'cloudflare', locale: 'en', type: 'image' },
  // French
  { key: 'models_fr_news', label: 'أخبار فرنسية', labelEn: 'French News', defaultProvider: 'groq', locale: 'fr', type: 'news' },
  { key: 'models_fr_reports', label: 'تقارير فرنسية', labelEn: 'French Reports', defaultProvider: 'groq', locale: 'fr', type: 'reports' },
  { key: 'models_fr_infographic', label: 'إنفوغرافيك فرنسي', labelEn: 'French Infographic', defaultProvider: 'groq', locale: 'fr', type: 'infographic' },
  { key: 'models_fr_video', label: 'فيديو فرنسي', labelEn: 'French Video', defaultProvider: 'groq', locale: 'fr', type: 'video' },
  { key: 'models_fr_image', label: 'صور فرنسية', labelEn: 'French Images', defaultProvider: 'cloudflare', locale: 'fr', type: 'image' },
  // Spanish
  { key: 'models_es_news', label: 'أخبار إسبانية', labelEn: 'Spanish News', defaultProvider: 'groq', locale: 'es', type: 'news' },
  { key: 'models_es_reports', label: 'تقارير إسبانية', labelEn: 'Spanish Reports', defaultProvider: 'groq', locale: 'es', type: 'reports' },
  { key: 'models_es_infographic', label: 'إنفوغرافيك إسباني', labelEn: 'Spanish Infographic', defaultProvider: 'groq', locale: 'es', type: 'infographic' },
  { key: 'models_es_video', label: 'فيديو إسباني', labelEn: 'Spanish Video', defaultProvider: 'groq', locale: 'es', type: 'video' },
  { key: 'models_es_image', label: 'صور إسبانية', labelEn: 'Spanish Images', defaultProvider: 'cloudflare', locale: 'es', type: 'image' },
  // Turkish
  { key: 'models_tr_news', label: 'أخبار تركية', labelEn: 'Turkish News', defaultProvider: 'groq', locale: 'tr', type: 'news' },
  { key: 'models_tr_reports', label: 'تقارير تركية', labelEn: 'Turkish Reports', defaultProvider: 'groq', locale: 'tr', type: 'reports' },
  { key: 'models_tr_infographic', label: 'إنفوغرافيك تركي', labelEn: 'Turkish Infographic', defaultProvider: 'groq', locale: 'tr', type: 'infographic' },
  { key: 'models_tr_video', label: 'فيديو تركي', labelEn: 'Turkish Video', defaultProvider: 'groq', locale: 'tr', type: 'video' },
  { key: 'models_tr_image', label: 'صور تركية', labelEn: 'Turkish Images', defaultProvider: 'cloudflare', locale: 'tr', type: 'image' },
];

// ─── All valid provider names for toggling ──────────────────────────
const ALL_VALID_PROVIDERS = [
  'bedrock', 'gemini', 'groq', 'grok', 'cerebras', 'mistral', 'deepseek', 'glm',
  'nvidia', 'hf', 'z-ai-sdk', 'ollama', 'openrouter', 'sambanova', 'cohere',
  'cloudflare', 'siliconflow', 'deepinfra', 'zukijourney', 'nagaai', 'acytoo',
  // Image generation providers
  'together', 'prodia', 'stablehorde', 'pollinations', 'cloudflare-image',
];

// ─── Provider capabilities mapping ──────────────────────────────────
const PROVIDER_CAPABILITIES: Record<string, { text: boolean; image: boolean; tts: boolean }> = {
  bedrock: { text: true, image: false, tts: false },
  gemini: { text: true, image: true, tts: false },
  groq: { text: true, image: false, tts: true },
  grok: { text: true, image: false, tts: false },
  cerebras: { text: true, image: false, tts: false },
  mistral: { text: true, image: false, tts: false },
  deepseek: { text: true, image: false, tts: false },
  glm: { text: true, image: false, tts: false },
  nvidia: { text: true, image: false, tts: false },
  hf: { text: true, image: true, tts: false },
  'z-ai-sdk': { text: true, image: true, tts: true },
  ollama: { text: true, image: false, tts: false },
  openrouter: { text: true, image: false, tts: false },
  sambanova: { text: true, image: false, tts: false },
  cohere: { text: true, image: false, tts: false },
  cloudflare: { text: true, image: false, tts: false },
  siliconflow: { text: true, image: false, tts: false },
  deepinfra: { text: true, image: false, tts: false },
  zukijourney: { text: true, image: false, tts: false },
  nagaai: { text: true, image: false, tts: false },
  together: { text: false, image: true, tts: false },
  prodia: { text: false, image: true, tts: false },
  stablehorde: { text: false, image: true, tts: false },
  pollinations: { text: false, image: true, tts: false },
  'cloudflare-image': { text: false, image: true, tts: false },
};

// ─── API key env var mapping ────────────────────────────────────────
const API_KEY_MAP: Record<string, { envVar: string; providers: string[] }> = {
  'AWS_ACCESS_KEY_ID': { envVar: 'AWS_ACCESS_KEY_ID', providers: ['bedrock'] },
  'AWS_SECRET_ACCESS_KEY': { envVar: 'AWS_SECRET_ACCESS_KEY', providers: ['bedrock'] },
  'GEMINI_API_KEY': { envVar: 'GEMINI_API_KEY', providers: ['gemini'] },
  'GOOGLE_AI_STUDIO_API_KEY': { envVar: 'GOOGLE_AI_STUDIO_API_KEY', providers: ['gemini'] },
  'GROQ_API_KEY': { envVar: 'GROQ_API_KEY', providers: ['groq'] },
  'CEREBRAS_API_KEY': { envVar: 'CEREBRAS_API_KEY', providers: ['cerebras'] },
  'MISTRAL_API_KEY': { envVar: 'MISTRAL_API_KEY', providers: ['mistral'] },
  'DEEPSEEK_API_KEY': { envVar: 'DEEPSEEK_API_KEY', providers: ['deepseek'] },
  'GLM_API_KEY': { envVar: 'GLM_API_KEY', providers: ['glm'] },
  'NVIDIA_API_KEY': { envVar: 'NVIDIA_API_KEY', providers: ['nvidia'] },
  'HF_API_KEY': { envVar: 'HF_API_KEY', providers: ['hf'] },
  'HF_API_TOKEN': { envVar: 'HF_API_TOKEN', providers: ['hf'] },
  'HF_TOKEN': { envVar: 'HF_TOKEN', providers: ['hf'] },
  'OPENROUTER_API_KEY': { envVar: 'OPENROUTER_API_KEY', providers: ['openrouter'] },
  'SAMBANOVA_API_KEY': { envVar: 'SAMBANOVA_API_KEY', providers: ['sambanova'] },
  'COHERE_API_KEY': { envVar: 'COHERE_API_KEY', providers: ['cohere'] },
  'CLOUDFLARE_API_TOKEN': { envVar: 'CLOUDFLARE_API_TOKEN', providers: ['cloudflare', 'cloudflare-image'] },
  'CLOUDFLARE_ACCOUNT_ID': { envVar: 'CLOUDFLARE_ACCOUNT_ID', providers: ['cloudflare', 'cloudflare-image'] },
  'SILICONFLOW_API_KEY': { envVar: 'SILICONFLOW_API_KEY', providers: ['siliconflow'] },
  'DEEPINFRA_API_KEY': { envVar: 'DEEPINFRA_API_KEY', providers: ['deepinfra'] },
  'ZUKIJOURNEY_API_KEY': { envVar: 'ZUKIJOURNEY_API_KEY', providers: ['zukijourney'] },
  'NAGAAI_API_KEY': { envVar: 'NAGAAI_API_KEY', providers: ['nagaai'] },
  'OLLAMA_API_KEY': { envVar: 'OLLAMA_API_KEY', providers: ['ollama'] },
  'XAI_API_KEY': { envVar: 'XAI_API_KEY', providers: ['grok'] },
  'TOGETHER_API_KEY': { envVar: 'TOGETHER_API_KEY', providers: ['together'] },
  'PRODIA_API_KEY': { envVar: 'PRODIA_API_KEY', providers: ['prodia'] },
  'STABLEHORDE_API_KEY': { envVar: 'STABLEHORDE_API_KEY', providers: ['stablehorde'] },
};

// ─── Image provider definitions ─────────────────────────────────────
const IMAGE_PROVIDER_DEFINITIONS = [
  {
    name: 'cloudflare-image',
    envKey: 'CLOUDFLARE_API_TOKEN',
    model: '@cf/black-forest-labs/FLUX-1-schnell',
    label: 'كلاودفلير (FLUX)',
    labelEn: 'Cloudflare Workers AI',
  },
  {
    name: 'together',
    envKey: 'TOGETHER_API_KEY',
    model: 'black-forest-labs/FLUX.1-schnell',
    label: 'توغذر AI (FLUX)',
    labelEn: 'Together AI (FLUX)',
  },
  {
    name: 'prodia',
    envKey: 'PRODIA_API_KEY',
    model: 'FLUX schnell',
    label: 'بروديا',
    labelEn: 'Prodia',
  },
  {
    name: 'pollinations',
    envKey: '', // No key needed — always available
    model: 'flux',
    label: 'بولينيشنز',
    labelEn: 'Pollinations',
  },
  {
    name: 'stablehorde',
    envKey: 'STABLEHORDE_API_KEY',
    model: 'SDXL',
    label: 'ستيبل هورد',
    labelEn: 'Stable Horde',
  },
];

// ─── Mask a string for display ──────────────────────────────────────
function maskKey(val: string | undefined, show: number = 4): string {
  if (!val) return '';
  if (val.length <= show) return '***';
  return val.slice(0, show) + '***';
}

// ─── GET: Return all providers, mappings, quota, capabilities, keys ──
export async function GET(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    // Get live provider status from ai-provider
    const providers = getProviders();

    // Get stored model mappings from SiteSettings
    const modelSettings = await db.siteSetting.findMany({
      where: { group: 'models' },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of modelSettings) {
      settingsMap[s.key] = s.value;
    }

    // Build text providers list with display info
    const providerList = providers.map(p => {
      const capabilities = PROVIDER_CAPABILITIES[p.name] || { text: true, image: false, tts: false };
      return {
        name: p.name,
        model: p.model,
        available: p.available,
        disabled: settingsMap[`models_disabled_${p.name}`] === 'true',
        baseUrl: p.name === 'bedrock' || p.name === 'z-ai-sdk' || p.name === 'ollama'
          ? undefined : p.baseUrl,
        capabilities,
        keyPrefix: p.apiKey && p.apiKey !== 'z-ai-sdk' && p.apiKey !== 'ollama'
          ? maskKey(p.apiKey) : '',
        hasKey: !!(p.apiKey && p.apiKey !== 'ollama'),
      };
    });

    // Build image providers list
    const imageProviders = IMAGE_PROVIDER_DEFINITIONS.map(def => {
      const envVal = process.env[def.envKey] || '';
      const hasKey = !def.envKey || !!envVal; // pollinations has no key
      return {
        name: def.name,
        model: def.model,
        label: def.label,
        labelEn: def.labelEn,
        available: hasKey,
        disabled: settingsMap[`models_disabled_${def.name}`] === 'true',
        keyPrefix: envVal ? maskKey(envVal) : '',
        hasKey,
      };
    });

    // Build pipeline mappings
    const pipelineMappings = PIPELINE_DEFINITIONS.map(def => ({
      key: def.key,
      label: def.label,
      labelEn: def.labelEn,
      locale: def.locale,
      type: def.type,
      defaultProvider: def.defaultProvider,
      currentProvider: settingsMap[def.key] || def.defaultProvider,
      isCustom: !!settingsMap[def.key],
    }));

    // Circuit breaker status
    const circuitBreakers = {
      bedrock: {
        open: !providers.find(p => p.name === 'bedrock')?.available && !!process.env.AWS_ACCESS_KEY_ID,
        description: 'Bedrock circuit breaker — يُفعّل بعد 5 أعطال متتالية ويُعاد بعد 30 ثانية',
      },
      gemini: {
        open: !providers.find(p => p.name === 'gemini')?.available && !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY),
        description: 'Gemini quota exhausted — يُعاد بعد 10 دقائق من استنفاد الحصة',
      },
      zaiSdk: {
        open: !providers.find(p => p.name === 'z-ai-sdk')?.available,
        description: 'z-ai-sdk circuit breaker — يُفعّل عند فشل الاتصال ويُعاد بعد 30 ثانية',
      },
    };

    // Build API keys overview
    const apiKeys = Object.entries(API_KEY_MAP).map(([keyName, info]) => {
      const val = process.env[keyName] || '';
      const exists = !!val;
      // Find which pipelines use providers that need this key
      const usedInPipelines = pipelineMappings
        .filter(m => info.providers.includes(m.currentProvider))
        .map(m => m.label);

      return {
        name: keyName,
        exists,
        keyPrefix: exists ? maskKey(val) : '',
        providers: info.providers,
        usedInPipelines,
      };
    });

    // Summary stats
    const allProviders = [...providerList, ...imageProviders];
    const totalProviders = allProviders.length;
    const availableProviders = allProviders.filter(p => p.available && !p.disabled).length;
    const disabledProviders = allProviders.filter(p => p.disabled).length;
    const activeProviders = allProviders.filter(p => p.available && !p.disabled).length;

    return NextResponse.json({
      // Summary stats
      stats: {
        total: totalProviders,
        available: availableProviders,
        active: activeProviders,
        disabled: disabledProviders,
      },
      // Provider data
      providers: providerList,
      imageProviders,
      pipelineMappings,
      circuitBreakers,
      apiKeys,
    });
  } catch (error) {
    return apiError(error, 'جلب إعدادات النماذج');
  }
}

// ─── PUT: Save model mapping or provider toggle ─────────────────────
export async function PUT(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json() as {
      type: 'mapping' | 'toggle';
      key: string;
      value: string;
    };

    if (!body.type || !body.key) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    if (body.type === 'mapping') {
      // Save pipeline-to-model mapping
      const validKeys = PIPELINE_DEFINITIONS.map(d => d.key);
      if (!validKeys.includes(body.key)) {
        return NextResponse.json({ error: 'مفتاح تعيين غير صالح' }, { status: 400 });
      }

      await db.siteSetting.upsert({
        where: { key: body.key },
        update: { value: body.value },
        create: { key: body.key, value: body.value, group: 'models', type: 'string' },
      });

      console.log(`[Models] Pipeline mapping updated: ${body.key} = ${body.value}`);
    } else if (body.type === 'toggle') {
      // Enable/disable provider
      const toggleKey = `models_disabled_${body.key}`;
      if (!ALL_VALID_PROVIDERS.includes(body.key)) {
        return NextResponse.json({ error: 'مزود غير صالح' }, { status: 400 });
      }

      await db.siteSetting.upsert({
        where: { key: toggleKey },
        update: { value: body.value },
        create: { key: toggleKey, value: body.value, group: 'models', type: 'boolean' },
      });

      console.log(`[Models] Provider toggle updated: ${body.key} disabled = ${body.value}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, 'حفظ إعدادات النماذج');
  }
}

// ─── POST: Test a specific provider ──────────────────────────────────
export async function POST(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json() as {
      action: string;
      provider: string;
    };

    if (body.action === 'test' && body.provider) {
      // Test a text provider
      const validProviders = getProviders().map(p => p.name);
      if (!validProviders.includes(body.provider)) {
        return NextResponse.json({ error: 'مزود غير صالح' }, { status: 400 });
      }

      const result = await testProviderDirectly(body.provider as any);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    return apiError(error, 'اختبار المزود');
  }
}
