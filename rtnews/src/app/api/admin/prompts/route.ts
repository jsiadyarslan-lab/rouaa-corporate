// ─── Admin Prompts Management API ──────────────────────────────
// GET: Returns all prompts with default values and custom overrides
// PUT: Save a custom prompt override to SiteSettings

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// ─── Prompt Definitions ──────────────────────────────────
// Each prompt has: key (SiteSettings key), name (Arabic), source (file path), default content
interface PromptDefinition {
  key: string;
  name: string;
  description: string;
  source: string;
  locale: 'ar' | 'en' | 'fr';
  category: 'news' | 'reports' | 'infographic' | 'video';
  getDefaultContent: () => string;
}

const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    key: 'prompt_ar_news_unified',
    name: 'معالج الأخبار الموحّد',
    description: 'البرومبت الرئيسي لمعالجة الأخبار العربية — ترجمة + 4 بوابات تحليل في طلب واحد',
    source: 'src/lib/pipeline/agents/unified-processor.ts',
    locale: 'ar',
    category: 'news',
    getDefaultContent: () => {
      // This is a simplified version — the actual prompt is dynamically constructed
      return `أنت نظام معالجة أخبار مالية متكامل لمنصة "رؤى". مهمتك معالجة الخبر بالكامل عبر بوابة تصفية ثم 4 بوابات إلزامية في طلب واحد، وإنتاج العنوان العربي + الملخص العربي + المحتوى العربي + التحليل المالي الكامل.

═══ بوابة التصفية — هل هذا الخبر مالي؟ ═══
[... محتوى البرومبت الكامل موجود في src/lib/pipeline/agents/unified-processor.ts ...]

═══ البوابة 0 — استخراج البيانات الخام ═══
═══ البوابة 1 — تصنيف الموضوع وتحديد المسار ═══
═══ البوابة 2 — تحرير الخبر بالعربية ═══
═══ البوابة 3 — التحليل ═══
═══ البوابة 4 — التحقق النهائي ═══`;
    },
  },
  {
    key: 'prompt_ar_news_analyzer',
    name: 'محلل الأخبار القديم',
    description: 'البرومبت القديم لتحليل الأخبار العربية (4 بوابات) — يُستخدم كاحتياطي',
    source: 'src/lib/pipeline/agents/analyzer.ts',
    locale: 'ar',
    category: 'news',
    getDefaultContent: () => 'أنت محلل أخبار مالية عربي لمنصة "رؤى". [المحتوى الكامل في src/lib/pipeline/agents/analyzer.ts]',
  },
  {
    key: 'prompt_ar_reports_system',
    name: 'برومبت توليد التقارير',
    description: 'البرومبت الرئيسي لتوليد التقارير الاقتصادية العربية',
    source: 'src/lib/report-templates.ts',
    locale: 'ar',
    category: 'reports',
    getDefaultContent: () => 'أنت محرر صحفي متخصص في التحليل المالي والاقتصادي، تكتب لجمهور عربي مهتم بالأسواق المالية العالمية. [المحتوى الكامل في src/lib/report-templates.ts]',
  },
  {
    key: 'prompt_ar_reports_analysis',
    name: 'برومبت تحليل التقارير',
    description: 'البرومبت المستخدم لتحليل البيانات في التقارير العربية',
    source: 'src/lib/report-templates.ts (ANALYSIS_SYSTEM_PROMPT)',
    locale: 'ar',
    category: 'reports',
    getDefaultContent: () => 'أنت محلل بيانات مالية متقدم. [المحتوى الكامل في src/lib/report-templates.ts]',
  },
  {
    key: 'prompt_ar_infographic',
    name: 'برومبت الإنفوغرافيك',
    description: 'البرومبت المستخدم لتوليد بيانات الإنفوغرافيك العربية',
    source: 'src/lib/infographic-auto-gen.ts',
    locale: 'ar',
    category: 'infographic',
    getDefaultContent: () => 'أنت مولّد إنفوغرافيك مالية لمنصة "رؤى". [المحتوى الكامل في src/lib/infographic-auto-gen.ts]',
  },
  {
    key: 'prompt_ar_video',
    name: 'برومبت الفيديو',
    description: 'البرومبت المستخدم لتحليل وتوليد فيديوهات التقارير العربية',
    source: 'scripts/video-renderer.mjs',
    locale: 'ar',
    category: 'video',
    getDefaultContent: () => 'أنت محلل أسواق مالية لفيديوهات تقارير "رؤى". [المحتوى الكامل في scripts/video-renderer.mjs]',
  },
  {
    key: 'prompt_en_news_analyzer',
    name: 'English News Analyzer',
    description: 'The prompt used for analyzing English news articles',
    source: 'src/lib/pipeline/agents/en-analyzer.ts',
    locale: 'en',
    category: 'news',
    getDefaultContent: () => 'You are a financial news analyst for the "Rouaa" platform. [Full content in src/lib/pipeline/agents/en-analyzer.ts]',
  },
  {
    key: 'prompt_en_reports_system',
    name: 'English Report Generator',
    description: 'The prompt used for generating English economic reports',
    source: 'src/lib/report-templates.ts',
    locale: 'en',
    category: 'reports',
    getDefaultContent: () => 'You are a financial news editor specializing in market analysis. [Full content in src/lib/report-templates.ts]',
  },
  {
    key: 'prompt_en_infographic',
    name: 'English Infographic Generator',
    description: 'The prompt used for generating English infographic data',
    source: 'src/lib/infographic-auto-gen.ts',
    locale: 'en',
    category: 'infographic',
    getDefaultContent: () => 'You are a financial infographic data generator. [Full content in src/lib/infographic-auto-gen.ts]',
  },
  {
    key: 'prompt_en_video',
    name: 'English Video Analyzer',
    description: 'The prompt used for English video report analysis',
    source: 'scripts/video-renderer.mjs',
    locale: 'en',
    category: 'video',
    getDefaultContent: () => 'You are a financial market analyst for video reports. [Full content in scripts/video-renderer.mjs]',
  },
  {
    key: 'prompt_fr_news_analyzer',
    name: 'Analyseur de nouvelles françaises',
    description: 'Le prompt utilisé pour analyser les articles de nouvelles françaises',
    source: 'src/lib/pipeline/agents/fr-analyzer.ts',
    locale: 'fr',
    category: 'news',
    getDefaultContent: () => 'Vous êtes un analyste de nouvelles financières. [Contenu complet dans src/lib/pipeline/agents/fr-analyzer.ts]',
  },
  {
    key: 'prompt_fr_reports_system',
    name: 'Générateur de rapports français',
    description: 'Le prompt utilisé pour générer des rapports économiques français',
    source: 'src/lib/report-templates.ts',
    locale: 'fr',
    category: 'reports',
    getDefaultContent: () => 'Vous êtes un rédacteur financier spécialisé. [Contenu complet dans src/lib/report-templates.ts]',
  },
  {
    key: 'prompt_fr_infographic',
    name: 'Générateur d\'infographies françaises',
    description: 'Le prompt utilisé pour générer des données d\'infographies françaises',
    source: 'src/lib/infographic-auto-gen.ts',
    locale: 'fr',
    category: 'infographic',
    getDefaultContent: () => 'Vous êtes un générateur de données d\'infographies financières. [Contenu complet dans src/lib/infographic-auto-gen.ts]',
  },
  {
    key: 'prompt_fr_video',
    name: 'Analyseur vidéo français',
    description: 'Le prompt utilisé pour l\'analyse de rapports vidéo français',
    source: 'scripts/video-renderer.mjs',
    locale: 'fr',
    category: 'video',
    getDefaultContent: () => 'Vous êtes un analyste de marchés financiers. [Contenu complet dans scripts/video-renderer.mjs]',
  },
];

// GET: Return all prompts with their current values
export async function GET(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    // Get custom overrides from SiteSettings
    const customPrompts = await db.siteSetting.findMany({
      where: { group: 'prompts' },
    });

    const customMap: Record<string, string> = {};
    for (const s of customPrompts) {
      customMap[s.key] = s.value;
    }

    // Build response
    const prompts = PROMPT_DEFINITIONS.map(def => ({
      key: def.key,
      name: def.name,
      description: def.description,
      source: def.source,
      locale: def.locale,
      category: def.category,
      defaultContent: def.getDefaultContent(),
      customContent: customMap[def.key] || null,
      isActive: !!customMap[def.key], // If custom exists, it's the active one
    }));

    return NextResponse.json({ prompts });
  } catch (error) {
    return apiError(error, 'جلب البرومبتات');
  }
}

// PUT: Save a custom prompt override
export async function PUT(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { key, content, action } = await request.json() as {
      key: string;
      content?: string;
      action?: 'save' | 'reset';
    };

    if (!key) {
      return NextResponse.json({ error: 'مفتاح البرومبت مطلوب' }, { status: 400 });
    }

    const validKeys = PROMPT_DEFINITIONS.map(d => d.key);
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'مفتاح برومبت غير صالح' }, { status: 400 });
    }

    if (action === 'reset') {
      // Remove custom override — fall back to code default
      await db.siteSetting.deleteMany({
        where: { key, group: 'prompts' },
      });
      console.log(`[Prompts] Reset prompt: ${key} — reverted to default`);
    } else {
      // Save custom override
      if (!content || content.trim().length < 10) {
        return NextResponse.json({ error: 'محتوى البرومبت قصير جداً' }, { status: 400 });
      }

      await db.siteSetting.upsert({
        where: { key },
        update: { value: content },
        create: { key, value: content, group: 'prompts', type: 'string' },
      });

      console.log(`[Prompts] Saved custom prompt: ${key} (${content.length} chars)`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, 'حفظ البرومبت');
  }
}
