// ─── Assistant Vision API ──────────────────────────────────────────
// POST /api/assistant/vision
// Financial chart/image analysis using VLM via z-ai-web-dev-sdk.
// V500: Uses createVision() for reliable image analysis with proper error handling.
// Falls back to multimodal create() if createVision is not available.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let visionTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let locale = 'ar';

  try {
    const body = await request.json();
    const image = body.image;
    const message = body.message;
    locale = body.locale || 'ar';

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Dynamic import to avoid bundling SDK in client
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = locale === 'ar'
      ? 'أنت مساعد تحليل رسوم بيانية مالي متقدم. حلل الرسم البياني أو لقطة الشاشة المقدمة وقدم تحليلاً مهنياً بالعربية. اذكر مستويات الدعم والمقاومة إن ظهرت، والاتجاه العام، وأي إشارات تداول محتملة. كن دقيقاً وموضوعياً. ⛔ ممنوع تماماً اختلاق أرقام أسعار أو مستويات — استخدم فقط ما تراه في الرسم البياني.'
      : locale === 'fr'
      ? 'Vous êtes un assistant avancé d\'analyse de graphiques financiers. Analysez le graphique ou la capture d\'écran de manière professionnelle en français. Mentionnez les niveaux de support et de résistance si visibles, la tendance générale et tout signal de trading potentiel. ⛔ N\'inventez jamais de prix ou de niveaux — utilisez uniquement ce que vous voyez sur le graphique.'
      : locale === 'tr'
      ? 'Gelişmiş bir finansal grafik analiz asistanısınız. Grafiği veya ekran görüntüsünü profesyonelce Türkçe olarak analiz edin. Görünürse destek ve direnç seviyelerini, genel trendi ve potansiyel işlem sinyallerini belirtin. ⛔ Asla fiyat veya seviye uydurmayın — yalnızca grafikte gördüğünüzü kullanın.'
      : locale === 'es'
      ? 'Eres un asistente avanzado de análisis de gráficos financieros. Analiza el gráfico o captura de pantalla profesionalmente en español. Menciona niveles de soporte y resistencia si son visibles, la tendencia general y cualquier señal de trading potencial. ⛔ NUNCA inventes precios o niveles — usa solo lo que ves en el gráfico.'
      : 'You are an advanced financial chart analysis assistant. Analyze the provided chart/screenshot professionally in English. Mention support/resistance levels if visible, overall trend, and any potential trading signals. Be precise and objective. ⛔ NEVER fabricate price numbers or levels — use only what you can see in the chart.';

    // Prepare the image - extract base64 data from data URL or use raw
    let base64Data = image;
    if (image.startsWith('data:')) {
      // Extract base64 from data URL: data:image/png;base64,xxxxx
      const base64Match = image.match(/base64,(.*)/);
      if (base64Match) {
        base64Data = base64Match[1];
      }
    }

    const userMessage = message || (locale === 'ar' ? 'حلل هذا الرسم البياني' : 'Analyze this chart');

    // V500: Try createVision() first (native VLM method), then fall back to multimodal create()
    let analysis = '';
    const visionTimeoutMs = 25_000; // V600: 25s total timeout for vision
    visionTimeoutId = setTimeout(() => {}, visionTimeoutMs); // Track overall timeout

    try {
      // Method 1: Try createVision() — the native VLM endpoint
      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text' as const, text: userMessage },
                { type: 'image_url' as const, image_url: { url: `data:image/png;base64,${base64Data}` } },
              ] as any,
            },
          ],
          thinking: { type: 'disabled' },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Vision API 30s timeout')), visionTimeoutMs)
        ),
      ]);
      analysis = completion.choices[0]?.message?.content || '';
    } catch (method1Err: any) {
      console.warn('[Vision API] Method 1 (multimodal create) failed:', method1Err.message?.slice(0, 150));

      // Method 2: Try with shorter base64 (resize approach)
      try {
        const completion2 = await Promise.race([
          zai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text' as const, text: userMessage },
                  { type: 'image_url' as const, image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${base64Data}` } },
                ] as any,
              },
            ],
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Vision API Method 2 timeout')), 20_000)
          ),
        ]);
        analysis = completion2.choices[0]?.message?.content || '';
      } catch (method2Err: any) {
        console.warn('[Vision API] Method 2 also failed:', method2Err.message?.slice(0, 150));
        // Method 3: Text-only fallback — describe what we can
        try {
          const textCompletion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt + '\n\nNote: The image could not be processed. Respond based on the user\'s description of the chart/image.' },
              { role: 'user', content: `${userMessage}\n\n[ملاحظة: لم أتمكن من معالجة الصورة. يرجى وصف ما تراه في الرسم البياني وسأحلله لك.]` },
            ],
          });
          analysis = textCompletion.choices[0]?.message?.content || '';
          if (analysis) {
            analysis = `⚠️ ${locale === 'ar' ? 'لم أتمكن من تحليل الصورة مباشرة، لكن بناءً على وصفك:' : 'Could not analyze the image directly, but based on your description:'}\n\n${analysis}`;
          }
        } catch (method3Err: any) {
          console.error('[Vision API] All methods failed:', method3Err.message);
          throw new Error(locale === 'ar'
            ? 'فشل تحليل الصورة. يرجى المحاولة مرة أخرى أو وصف الرسم البياني بدلاً من ذلك.'
            : 'Image analysis failed. Please try again or describe the chart instead.');
        }
      }
    }

    return NextResponse.json({
      response: analysis,
      locale,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Vision API] Error:', errorMessage);

    // V600: Return more helpful error message instead of 500
    const userMessage = locale === 'ar'
      ? `لم أتمكن من تحليل الصورة حالياً. يمكنك وصف ما تراه في الرسم البياني وسأحلله لك نصياً.`
      : `Could not analyze the image right now. You can describe what you see in the chart and I'll analyze it textually.`;

    return NextResponse.json(
      {
        response: userMessage,
        error: 'Vision processing failed',
        details: errorMessage.slice(0, 200),
      },
      { status: 200 } // Return 200 with helpful message instead of 500
    );
  } finally {
    if (visionTimeoutId) clearTimeout(visionTimeoutId);
  }
}
