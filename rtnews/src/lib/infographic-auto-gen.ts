// ─── Internal Infographic Auto-Generation V313 ─────────────────
// NOTE: Auto-generation is DISABLED in V313 (manual only).
// This module is kept for potential future re-enablement.
// Admin now triggers generation from the dashboard.
//
// Original: Extracted from /api/infographics/generate route for use by the
// report scheduler. Generates infographics from published reports
// and analyses without requiring an HTTP request.
//
// This avoids the admin auth check (the scheduler IS the admin)
// and runs directly in the server process.

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { generateSlideImages, isValidImageUrl } from '@/lib/image-gen';

export interface AutoGenResult {
  success: boolean;
  infographicId?: string;
  title?: string;
  isPublished?: boolean;
  error?: string;
}

// ─── Fetch Source Content ──────────────────────────────────
async function fetchSource(sourceType: string, sourceId: string) {
  if (sourceType === 'news') {
    const news = await db.newsItem.findUnique({
      where: { id: sourceId },
      select: {
        id: true, titleAr: true, title: true, contentAr: true, content: true,
        summaryAr: true, summary: true, category: true, sentiment: true,
        impactScore: true, aiAnalysis: true, slug: true,
      },
    });
    if (!news) return null;
    return {
      type: 'news' as const,
      id: news.id,
      title: news.titleAr || news.title,
      content: news.contentAr || news.content || '',
      summary: news.summaryAr || news.summary || '',
      category: news.category,
      sentiment: news.sentiment,
      impactScore: news.impactScore,
      aiAnalysis: news.aiAnalysis,
      slug: news.slug,
    };
  }

  if (sourceType === 'economic_report') {
    const report = await db.economicReport.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, summary: true, content: true,
        reportType: true, scope: true, sectors: true, countries: true,
        keyIndicators: true, marketImpact: true, confidenceScore: true, slug: true,
      },
    });
    if (!report) return null;
    return {
      type: 'economic_report' as const,
      id: report.id,
      title: report.title,
      content: report.content,
      summary: report.summary,
      category: report.reportType,
      sectors: report.sectors,
      countries: report.countries,
      keyIndicators: report.keyIndicators,
      marketImpact: report.marketImpact,
      confidenceScore: report.confidenceScore,
      slug: report.slug,
    };
  }

  if (sourceType === 'market_analysis') {
    const analysis = await db.marketAnalysis.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, content: true, assetClass: true,
        analysisType: true, timeFrame: true, indicators: true,
        priceTarget: true, riskLevel: true, sentiment: true,
        confidenceScore: true, slug: true,
      },
    });
    if (!analysis) return null;
    return {
      type: 'market_analysis' as const,
      id: analysis.id,
      title: analysis.title,
      content: analysis.content,
      category: analysis.assetClass,
      timeFrame: analysis.timeFrame,
      riskLevel: analysis.riskLevel,
      sentiment: analysis.sentiment,
      confidenceScore: analysis.confidenceScore,
      slug: analysis.slug,
    };
  }

  return null;
}

// ─── System Prompt (same as the API route) ─────────────────
const INFOGRAPHIC_SYSTEM_PROMPT = `أنت مصمم إنفوغرافيك مالي محترف ومحلل بيانات متخصص
في تحويل الأخبار المالية إلى محتوى بصري احترافي.

═══════════════════════════════════
قواعد التصميم الصارمة (V13)
═══════════════════════════════════

١. اللغة:
- عربية فصحى خالصة 100% بلا استثناء
- لا كلمة أجنبية في أي شريحة
- الأرقام بالغربية (0123456789) في كل مكان
- الاتجاه: RTL (من اليمين لليسار) إلزامي في كل النصوص

٢. الأرقام:
- لا تضع رقماً إلا إذا كان موجوداً في الخبر الأصلي
- إذا لم يكن لديك رقم حقيقي → اكتب وصفاً نوعياً
- لا تخترع نسباً أو أسعاراً أبداً

٣. التوصيات:
- إيجابي → شراء فقط
- سلبي → بيع فقط
- محايد → مراقبة فقط

٤. منع الهلوسة:
- لا رمز بورصي مخترع
- لا سعر هدف بدون مصدر
- الجملة السحرية: "بيانات غير كافية — تابع المستجدات"

٥. نظام الصور — AI Image Prompts:
- الوصف يجب أن يكون بالإنجليزية
- وصف خلفية احترافية dark cinematic بدون نصوص
- الشريحة 1 (Hero): image_position "background-full"
- الشرائح 2-5: image_position "right-30"
- الشريحة 6: image_position null — لا صورة

═══════════════════════════════════
هيكل الشرائح الكامل (6 شرائح)
═══════════════════════════════════

── الشريحة 1: Hero (الصدمة البصرية) ──
heroNumber, heroUnit, title, subtitle, tag, status, color, confidence, chart_config: gauge

── الشريحة 2: القصة البصرية ──
pattern (A-D), elements, image_prompt, image_position: "right-30"

── الشريحة 3: الأرقام والبيانات ──
indicators (4-6), chart_config: bar

── الشريحة 4: السيناريوهات ──
3 scenarios, chart_config: slope

── الشريحة 5: الأصول المتأثرة ──
benefiting + harmed, chart_config: treemap

── الشريحة 6: التوصيات والخلاصة ──
recommendations, summary, chart_config: funnel, image_position: null

═══════════════════════════════════
المخرجات المطلوبة (JSON صارم)
═══════════════════════════════════

أجب فقط بـ JSON بدون أي نص خارجه.
لا مقدمة، لا شرح، لا backticks.
فقط JSON نظيف يبدأ بـ { وينتهي بـ }

⛔⛔⛔ قواعد نهائية:
- لا تخترع أرقاماً غير موجودة في الخبر الأصلي
- كل شريحة يجب أن تحتوي محتوى حقيقياً وغنياً
- لا تكرر التوصيات — كل توصية فريدة
- أعد JSON فقط بدون أي نص إضافي أو markdown`;

// ─── Main Function ──────────────────────────────────────────
export async function generateInfographicInternal(
  sourceType: string,
  sourceId: string,
): Promise<AutoGenResult> {
  // Step 1: Fetch source content
  const source = await fetchSource(sourceType, sourceId);
  if (!source) {
    return { success: false, error: 'المصدر غير موجود' };
  }

  // Step 2: Check for existing infographic
  const existing = await db.infographic.findFirst({
    where: { sourceType, sourceId },
  });
  if (existing) {
    return { success: false, error: 'يوجد إنفوغرافيك لهذا المصدر بالفعل' };
  }

  // Step 3: Build prompt with source data
  const contentForAI = source.content?.slice(0, 6000) || source.summary?.slice(0, 3000) || source.title;
  const aiAnalysisSection = source.aiAnalysis ? `\n\nالتحليل الذكي:\n${source.aiAnalysis.slice(0, 1500)}` : '';
  const sentiment = source.sentiment || 'محايد';
  const sector = source.category || 'عام';
  const currentDate = new Date().toISOString().split('T')[0];

  const userPrompt = `التاريخ الحالي: ${currentDate}
الخبر: ${source.title}
${source.summary ? `الملخص: ${source.summary.slice(0, 800)}` : ''}

المحتوى الكامل:
${contentForAI}${aiAnalysisSection}

القطاع: ${sector}
التصنيف: ${sentiment}

⛔⛔⛔ تذكر:
1. استخرج كل الأرقام من المحتوى فقط — لا تخترع بيانات
2. كل شريحة = محتوى حقيقي وغني — لا فراغ
3. لا تناقض بين التصنيف والتوصية
4. حدد image_prompt لكل شريحة (ما عدا 6) — وصف خلفية احترافية بالإنجليزية
5. حدد chart_config لكل شريحة (ما عدا story) — نوع الرسم البياني وبياناته
6. أعد JSON فقط بدون أي نص إضافي`;

  console.log(`[InfographicAutoGen] Generating from ${sourceType}:${sourceId} — title: "${source.title?.slice(0, 60)}"`);

  // Step 4: Call AI
  let result: any;
  try {
    try {
      result = await chatCompletion([
        { role: 'system', content: INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Increased from 8000 → 16000 to prevent truncated JSON
        priority: 'generation',
      });
    } catch {
      result = await chatCompletion([
        { role: 'system', content: INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Same increase for fallback
        priority: 'translation',
      });
    }
  } catch (aiErr: any) {
    return { success: false, error: `AI failed: ${aiErr.message?.slice(0, 100)}` };
  }

  // Step 5: Parse AI response
  let responseText = result.content?.trim() || '';
  responseText = responseText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  responseText = responseText.replace(/^```/i, '').replace(/```$/i, '');

  let infographicData: any;
  try {
    infographicData = JSON.parse(responseText);
  } catch {
    return { success: false, error: 'JSON parse failed' };
  }

  // Step 6: Validate structure
  if (!infographicData.slides || !Array.isArray(infographicData.slides) || infographicData.slides.length === 0) {
    return { success: false, error: 'No valid slides in response' };
  }

  if (infographicData.slides[0].type !== 'hero') {
    infographicData.slides[0].type = 'hero';
  }

  // Normalize slides
  infographicData.slides.forEach((s: any, i: number) => {
    if (!s.id) s.id = `slide-${i + 1}`;
    s.number = s.number || i + 1;
    if (!s.content) s.content = {};
    // Copy key fields into content
    const copyFields = ['heroNumber', 'heroUnit', 'tag', 'status', 'pattern', 'elements',
      'indicators', 'scenarios', 'benefiting', 'harmed', 'recommendations', 'summary',
      'cta', 'color', 'image_position', 'image_overlay', 'image_url', 'subtitle'];
    for (const f of copyFields) {
      if (s[f] !== undefined && s.content[f] === undefined) s.content[f] = s[f];
    }
  });

  // Filter valid slides
  const validSlides = infographicData.slides.filter((s: any) => {
    if (!s.type || !s.title || !s.title.trim()) return false;
    const c = s.content || {};
    switch (s.type) {
      case 'hero': return true;
      case 'story': return c.elements && (Array.isArray(c.elements) ? c.elements.length > 0 : Object.keys(c.elements).length > 0);
      case 'data': return Array.isArray(c.indicators) && c.indicators.length > 0;
      case 'scenarios': return Array.isArray(c.scenarios) && c.scenarios.length > 0;
      case 'assets': return (Array.isArray(c.benefiting) && c.benefiting.length > 0) || (Array.isArray(c.harmed) && c.harmed.length > 0);
      case 'recommendations': return c.recommendations?.daily || c.recommendations?.medium || c.recommendations?.long || (Array.isArray(c.summary) && c.summary.some((s: string) => s?.trim()));
      default: return true;
    }
  });

  infographicData.slides = validSlides;
  if (validSlides.length < 3) {
    return { success: false, error: `Only ${validSlides.length} valid slides (minimum 3)` };
  }

  // Step 7: Generate AI images
  const infographicCategory = infographicData.metadata?.sector || source.category || null;
  let imageGenerationSuccess = false;
  let slidesWithImages = 0;
  let slidesNeedingImages = 0;

  try {
    for (const slide of infographicData.slides) {
      const position = slide.image_position ?? slide.content?.image_position;
      if (position !== null && slide.type !== 'recommendations' && slide.type !== 'summary') {
        slidesNeedingImages++;
      }
    }

    await generateSlideImages(infographicData.slides, infographicCategory);

    for (const slide of infographicData.slides) {
      const imageUrl = slide.image_url || slide.content?.image_url;
      if (isValidImageUrl(imageUrl)) {
        slidesWithImages++;
      }
    }

    imageGenerationSuccess = slidesWithImages >= slidesNeedingImages;
    console.log(`[InfographicAutoGen] Images: ${slidesWithImages}/${slidesNeedingImages} (success=${imageGenerationSuccess})`);
  } catch (imgErr: any) {
    console.error(`[InfographicAutoGen] Image generation FAILED: ${imgErr.message}`);
    imageGenerationSuccess = false;
  }

  // Step 8: Save to database
  const baseSlug = generateSlug(infographicData.title || source.title);
  const slug = baseSlug + '-' + Date.now().toString(36).slice(-4);

  try {
    const infographic = await db.infographic.create({
      data: {
        slug,
        title: infographicData.title || source.title,
        subtitle: infographicData.subtitle || null,
        sourceType,
        sourceId,
        sourceTitle: source.title,
        category: infographicData.metadata?.sector || infographicData.category || source.category || null,
        slides: infographicData.slides,
        impactScore: source.impactScore != null ? source.impactScore : null,
        isPublished: imageGenerationSuccess,
        publishedAt: imageGenerationSuccess ? new Date() : null,
      },
    });

    console.log(`[InfographicAutoGen] Created: ${infographic.id} — ${validSlides.length} slides — published=${imageGenerationSuccess}`);

    return {
      success: true,
      infographicId: infographic.id,
      title: infographic.title,
      isPublished: imageGenerationSuccess,
    };
  } catch (dbErr: any) {
    return { success: false, error: `DB error: ${dbErr.message?.slice(0, 100)}` };
  }
}
