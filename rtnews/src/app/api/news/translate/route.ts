// ─── AI Translation Endpoint V48 ────────────────────────────────
// ADMIN-ONLY endpoint for translating financial news from English to Arabic.
// Translation must happen ONLY in the background (via cron pipeline).
// V48: Auth is now handled by middleware.ts — removed custom isAuthorized()
// that used hardcoded 'rouaa-cron' header (security bypass).
import { NextResponse } from 'next/server';
import { translateToArabic, chatCompletion, getProviderStatus } from '@/lib/ai-provider';
import { sanitizePromptInput } from '@/lib/sanitize';

export async function POST(request: Request) {

  try {
    const body = await request.json();
    const { title, summary, text, type } = body;

    // ── Format 1: { text, type } — arbitrary text translation ──
    if (text && typeof text === 'string' && type) {
      const startTime = Date.now();

      if (type === 'title') {
        const translation = await translateToArabic(text, '');
        const duration = Date.now() - startTime;
        const isTranslated = translation.translatedTitle && /[\u0600-\u06FF]/.test(translation.translatedTitle);

        return NextResponse.json({
          translatedText: isTranslated ? translation.translatedTitle : text,
          isTranslated,
          duration,
          method: 'title-translation',
        });
      }

      if (type === 'content' || type === 'summary') {
        const sanitizedText = sanitizePromptInput(text.slice(0, 6000));

        const result = await chatCompletion(
          [
            {
              role: 'system',
              content: `أنت مترجم مالي محترف من الإنجليزية إلى العربية. ترجم النص التالي بدقة عالية مع الحفاظ على المصطلحات المالية (الفيدرالي، مؤشر أسعار المستهلك، الناتج المحلي، إلخ). اكتب الترجمة فقط بدون أي شرح إضافي أو علامات تنسيق.`,
            },
            {
              role: 'user',
              content: `ترجم النص المالي التالي من الإنجليزية إلى العربية:\n\n${sanitizedText}`,
            },
          ],
          { temperature: 0.2, maxTokens: 3000, priority: 'translation' }  // V54: Auto-select best available provider
        );

        const duration = Date.now() - startTime;
        const translatedText = result.content?.trim() || text;
        const isTranslated = /[\u0600-\u06FF]/.test(translatedText);

        return NextResponse.json({
          translatedText,
          isTranslated,
          duration,
          provider: result.provider,
          method: 'content-translation',
        });
      }

      // Unknown type — treat as generic translation
      const translation = await translateToArabic(text, '');
      const duration = Date.now() - startTime;
      const isTranslated = translation.translatedTitle && /[\u0600-\u06FF]/.test(translation.translatedTitle);

      return NextResponse.json({
        translatedText: isTranslated ? translation.translatedTitle : text,
        isTranslated,
        duration,
        method: 'generic-translation',
      });
    }

    // ── Format 2: { title, summary } — original format ──
    if (!title) {
      return NextResponse.json({ error: 'النص مطلوب للترجمة' }, { status: 400 });
    }

    const startTime = Date.now();
    const translation = await translateToArabic(title, summary || '');
    const duration = Date.now() - startTime;

    const isTranslated = translation.translatedTitle && /[\u0600-\u06FF]/.test(translation.translatedTitle);

    return NextResponse.json({
      translation,
      isTranslated,
      duration,
      powered: 'AI Translation'
    });

  } catch (error: any) {
    console.error('Translation API error:', error);

    const providers = getProviderStatus();
    const availableProviders = providers.filter(p => p.available);

    if (availableProviders.length === 0) {
      return NextResponse.json({
        error: 'No AI provider configured. Set at least one: GROQ_API_KEY, GOOGLE_AI_STUDIO_API_KEY, GLM_API_KEY, etc.',
        translation: null,
        providerStatus: providers.map(p => ({ provider: p.provider, available: p.available })),
      }, { status: 503 });
    }

    return NextResponse.json({
      error: error.message || 'Translation failed',
      translation: null,
      availableProviders: availableProviders.map(p => p.provider),
    }, { status: 500 });
  }
}
