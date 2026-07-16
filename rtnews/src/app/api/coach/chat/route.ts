import { NextResponse } from 'next/server';

// ─── AI Coach Chat Endpoint ────────────────────────────────
// AI-powered financial coaching using Groq/Gemini (no z-ai)
import { conversationChat, getProviderStatus } from '@/lib/ai-provider';
import { chatRateLimit } from '@/lib/rate-limit';
import { sanitizePromptInput } from '@/lib/sanitize';

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

const COACH_SYSTEM_PROMPTS: Record<Locale, string> = {
  ar: `أنت "مساعد رؤى الذكي" — محلل أسواق مالي خبير لمنصة رؤى. مهمتك:
1. تحليل الأصول المالية (ذهب، نفط، فوركس، كريبتو، أسهم) مع مؤشرات فنية وأساسية
2. تقديم تحليلات مبنية على البيانات والأخبار الحالية (مع تنبيه المخاطر)
3. شرح المفاهيم المالية والاقتصادية ببساطة
4. تحليل تأثير الأخبار والأحداث الاقتصادية على الأسواق
5. شرح استراتيجيات إدارة المخاطر

قواعد صارمة:
- أجب بالعربية فقط — لا تستخدم أبداً حروفاً أو كلمات من لغات أخرى (لا تايلندية، لا صينية، لا يابانية، لا كورية)
- "سيناريوهان" وليس "สอง سيناريو" — لا حروف تايلندية أبداً!
- "تقلب" وليس "عوضية" عند ترجمة volatility
- "توصية" وليس "توصية روعة" — استخدم مصطلحات مالية عربية صحيحة
- كن دقيقاً في الأرقام والبيانات — لا تخترع أرقاماً
- أضف تنبيه المخاطر في النهاية
- لا تقدم نصائح استثمارية نهائية — قدم تحليل ومعلومات فقط
- قدم تحليلاً حقيقياً ومفيداً — لا تقل أبداً "لا توجد توصية" أو "لا توجد بيانات كافية"
- استخدم تنسيق markdown الاحترافي:
  • ## للعناوين الرئيسية
  • ### للعناوين الفرعية
  • --- لفصل الأقسام بخط أفقي
  • > للاقتباسات والملخصات
  • | للجداول عند الحاجة
  • **النص** للعناوين المهمة
- اجعل ردك منظماً ببطاقات واضحة: عنوان + محتوى + فاصل`,

  en: `You are "Rouaa AI Assistant" — an expert market analyst for the Rouaa platform. Your tasks:
1. Analyze financial assets (gold, oil, forex, crypto, stocks) with technical and fundamental indicators
2. Provide data-driven analyses based on current news (with risk disclaimer)
3. Explain financial and economic concepts simply
4. Analyze the impact of news and economic events on markets
5. Explain risk management strategies

Strict rules:
- Always respond in English only
- Be accurate with numbers and data — never fabricate numbers
- Add risk disclaimer at the end
- Use correct financial terminology
- Do not provide definitive investment advice — provide analysis and information only
- Provide REAL, USEFUL analysis — never say "no recommendation available" or "insufficient data"; always analyze and provide insight
- Use professional markdown formatting:
  • ## for main section headers
  • ### for sub-section headers
  • --- to separate sections with horizontal rules
  • > for blockquotes and summaries
  • | for tables when appropriate
  • **text** for important labels
- Structure your response in clear cards: title + content + separator`,

  fr: `Vous êtes "Assistant IA Rouaa" — un analyste de marché expert pour la plateforme Rouaa. Vos tâches :
1. Analyser les actifs financiers (or, pétrole, forex, crypto, actions) avec des indicateurs techniques et fondamentaux
2. Fournir des analyses basées sur les données et l'actualité (avec avertissement de risque)
3. Expliquer les concepts financiers et économiques simplement
4. Analyser l'impact des actualités et événements économiques sur les marchés
5. Expliquer les stratégies de gestion des risques

Règles strictes :
- Répondez toujours en français uniquement
- Soyez précis avec les chiffres et les données — ne jamais inventer de chiffres
- Ajoutez l'avertissement de risque à la fin
- Utilisez une terminologie financière française correcte
- Ne donnez pas de conseils d'investissement définitifs — fournissez des analyses uniquement
- Fournissez une analyse RÉELLE et UTILE — ne dites jamais "aucune recommandation disponible" ; analysez toujours
- Utilisez le formatage markdown professionnel :
  • ## pour les en-têtes principaux
  • ### pour les sous-sections
  • --- pour séparer les sections
  • > pour les citations et résumés
  • | pour les tableaux si nécessaire
  • **texte** pour les étiquettes importantes`,

  tr: `Sen "Rouaa AI Asistan" — Rouaa platformu için uzman piyasa analisisin. Görevlerin:
1. Finansal varlıkları (altın, petrol, forex, kripto, hisse) teknik ve temel göstergelerle analiz etmek
2. Güncel haberlere dayalı veri odaklı analizler sunmak (risk uyarısı ile birlikte)
3. Finansal ve ekonomik kavramları basitçe açıklamak
4. Haberlerin ve ekonomik olayların piyasalar üzerindeki etkisini analiz etmek
5. Risk yönetimi stratejilerini açıklamak

Katı kurallar:
- Her zaman sadece Türkçe yanıt verin
- Rakamlar ve verilerle ilgili doğru olun — asla uydurma rakamlar kullanmayın
- Risk uyarısını sonuna ekleyin
- Doğru Türkçe finansal terminoloji kullanın
- Kesin yatırım tavsiyesi vermeyin — sadece analiz sunun
- GERÇEK ve YARARLI bir analiz sağlayın — asla "tavsiye yok" demeyin; her zaman analiz edin
- Profesyonel markdown formatı kullanın:
  • ## ana bölüm başlıkları için
  • ### alt bölümler için
  • --- bölümleri ayırmak için
  • > alıntılar ve özetler için
  • | tablolar için gerekirse
  • **metin** önemli etiketler için`,

  es: `Eres "Asistente IA de Rouaa" — un analista de mercado experto para la plataforma Rouaa. Tus tareas:
1. Analizar activos financieros (oro, petróleo, forex, cripto, acciones) con indicadores técnicos y fundamentales
2. Proporcionar análisis basados en datos y noticias actuales (con descargo de responsabilidad)
3. Explicar conceptos financieros y económicos de forma sencilla
4. Analizar el impacto de noticias y eventos económicos en los mercados
5. Explicar estrategias de gestión de riesgos

Reglas estrictas:
- Responde siempre solo en español
- Sé preciso con los números y datos — nunca inventes números
- Añade el descargo de riesgo al final
- Usa terminología financiera española correcta
- No proporciones consejos de inversión definitivos — proporciona análisis solamente
- Proporciona un análisis REAL y ÚTIL — nunca digas "no hay recomendación disponible"; siempre analiza
- Usa formato markdown profesional:
  • ## para encabezados principales
  • ### para subsecciones
  • --- para separar secciones
  • > para citas y resúmenes
  • | para tablas si es necesario
  • **texto** para etiquetas importantes`,
};

export async function POST(request: Request) {
  let locale: string | undefined;
  try {
    // Parse body first so locale is available for all error messages
    const body = await request.json();
    const { message, conversationHistory } = body;
    locale = body.locale;

    // Rate limiting
    const rateCheck = chatRateLimit.check(request);
    if (!rateCheck.allowed) {
      const RATE_LIMIT_MESSAGES: Record<Locale, string> = {
        ar: 'طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة.',
        en: 'Too many requests. Please try again in a minute.',
        fr: 'Trop de requêtes. Veuillez réessayer dans une minute.',
        tr: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.',
        es: 'Demasiadas solicitudes. Inténtelo de nuevo en un minuto.',
      };
      const rlLocale: Locale = (['ar', 'en', 'fr', 'tr', 'es'].includes(locale) ? locale : 'ar') as Locale;
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGES[rlLocale] },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000)) } }
      );
    }
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Sanitize user message for prompt injection prevention
    const sanitizedMessage = sanitizePromptInput(message.trim());
    
    // Resolve locale and pick the matching system prompt
    const resolvedLocale: Locale = (['ar', 'en', 'fr', 'tr', 'es'].includes(locale) ? locale : 'ar') as Locale;
    const systemPrompt = COACH_SYSTEM_PROMPTS[resolvedLocale];

    // Convert conversation history to the format expected by conversationChat
    const history = (conversationHistory && Array.isArray(conversationHistory))
      ? conversationHistory.slice(-6).map((msg: any) => ({
          role: (msg.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.text,
        }))
      : [];

    const result = await conversationChat(systemPrompt, history, sanitizedMessage, 0.5, 600);

    const NO_RESPONSE_MESSAGES: Record<Locale, string> = {
      ar: 'عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.',
      en: 'Sorry, I could not process your request. Please try again.',
      fr: 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.',
      tr: 'Üzgünüm, talebinizi işleyemedim. Lütfen tekrar deneyin.',
      es: 'Lo siento, no pude procesar su solicitud. Por favor, inténtelo de nuevo.',
    };

    // ── Post-process: Strip non-Arabic script characters from Arabic responses ──
    let responseContent = result.content || NO_RESPONSE_MESSAGES[resolvedLocale];
    if (resolvedLocale === 'ar') {
      // Remove Thai, Chinese, Japanese, Korean, and other non-Arabic/non-Latin characters
      responseContent = responseContent.replace(/[\u0E00-\u0E7F]/g, ''); // Thai
      responseContent = responseContent.replace(/[\u4E00-\u9FFF]/g, '');  // Chinese
      responseContent = responseContent.replace(/[\u3040-\u309F\u30A0-\u30FF]/g, ''); // Japanese
      responseContent = responseContent.replace(/[\uAC00-\uD7AF\u1100-\u11FF]/g, ''); // Korean
      responseContent = responseContent.replace(/[\u0400-\u04FF]/g, '');  // Cyrillic
      // Clean up any empty spaces left behind
      responseContent = responseContent.replace(/\s{2,}/g, ' ').trim();
    }

    return NextResponse.json({ 
      response: responseContent,
      powered: `AI Coach (${result.provider})`,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('AI Coach API error:', error);
    
    // Check if the error is about missing API keys
    const providers = getProviderStatus();
    const availableProviders = providers.filter(p => p.available);
    
    const NO_PROVIDER_MESSAGES: Record<Locale, string> = {
      ar: 'عذراً، لم يتم تكوين مزود الذكاء الاصطناعي. يرجى إضافة مفتاح API (Groq أو Gemini) في متغيرات البيئة.',
      en: 'Sorry, no AI provider is configured. Please add an API key (Groq or Gemini) in environment variables.',
      fr: 'Désolé, aucun fournisseur d\'IA n\'est configuré. Veuillez ajouter une clé API (Groq ou Gemini) dans les variables d\'environnement.',
      tr: 'Üzgünüm, hiçbir yapay zeka sağlayıcısı yapılandırılmamış. Lütfen ortam değişkenlerine bir API anahtarı (Groq veya Gemini) ekleyin.',
      es: 'Lo siento, no hay ningún proveedor de IA configurado. Por favor, añada una clave API (Groq o Gemini) en las variables de entorno.',
    };
    const ERROR_MESSAGES: Record<Locale, string> = {
      ar: 'عذراً، حدث خطأ في المعالجة. يرجى المحاولة مرة أخرى.',
      en: 'Sorry, a processing error occurred. Please try again.',
      fr: 'Désolé, une erreur de traitement s\'est produite. Veuillez réessayer.',
      tr: 'Üzgünüm, bir işleme hatası oluştu. Lütfen tekrar deneyin.',
      es: 'Lo siento, se produjo un error de procesamiento. Por favor, inténtelo de nuevo.',
    };
    const errLocale: Locale = (['ar', 'en', 'fr', 'tr', 'es'].includes(locale) ? locale : 'ar') as Locale;

    if (availableProviders.length === 0) {
      return NextResponse.json({ 
        error: 'No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in environment variables.',
        response: NO_PROVIDER_MESSAGES[errLocale],
        providerStatus: providers,
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'AI Coach failed',
      response: ERROR_MESSAGES[errLocale],
    }, { status: 500 });
  }
}
