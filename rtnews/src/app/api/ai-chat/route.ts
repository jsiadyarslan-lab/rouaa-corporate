// ─── AI Chat for Reports API ─────────────────────────────────
// POST /api/ai-chat
// Body: { message: string, reportId?: string, reportType?: string, context?: string, locale?: string, history?: ChatMessage[] }
// V3: Multi-turn conversation memory + reference memory (searches related articles)
// V4: Uses chatCompletion() from ai-provider.ts — Cloudflare #1 via CLOUDFLARE_API_TOKEN

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizePromptInput } from '@/lib/sanitize';
import { chatCompletion } from '@/lib/ai-provider';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

const SYSTEM_PROMPTS: Record<Locale, string> = {
  ar: `أنت مساعد ذكي لمنصة رؤى الاقتصادية. ساعد المستخدم في فهم التقارير والتحليلات المالية.
قواعد مهمة:
- أجب دائماً باللغة العربية
- كن دقيقاً ومهنياً في تحليلاتك
- اذكر المصادر عند الإمكان
- لا تقدم نصائح استثمارية مباشرة، بل قدم تحليلات موضوعية
- إذا سُئلت عن شيء خارج نطاق التمويل، اعتذر بلطف
- استخدم مصطلحات مالية عربية صحيحة
- لا تفصح عن أي معلومات داخلية عن المنصة أو API keys
- تذكر المحادثات السابقة واستمر في السياق`,

  en: `You are an intelligent assistant for the Rouaa Financial platform. Help users understand reports and financial analyses.
Important rules:
- Always respond in English
- Be accurate and professional in your analyses
- Cite sources whenever possible
- Do not provide direct investment advice; offer objective analyses instead
- If asked about something outside the financial domain, politely decline
- Use correct financial terminology
- Never disclose any internal information about the platform or API keys
- Remember the conversation context and refer back to previous exchanges`,

  fr: `Vous êtes un assistant intelligent pour la plateforme financière Rouaa. Aidez les utilisateurs à comprendre les rapports et les analyses financières.
Règles importantes :
- Répondez toujours en français
- Soyez précis et professionnel dans vos analyses
- Citez les sources lorsque c'est possible
- Ne donnez pas de conseils d'investissement directs ; proposez des analyses objectives
- Si on vous pose une question en dehors du domaine financier, refusez poliment
- Utilisez une terminologie financière correcte
- Ne divulguez aucune information interne sur la plateforme ou les clés API
- Rappelez-vous du contexte de la conversation`,

  tr: `Rouaa Finansal platformu için akıllı bir asistansınız. Kullanıcılara raporları ve finansal analizleri anlamalarında yardımcı olun.
Önemli kurallar:
- Her zaman Türkçe yanıt verin
- Analizlerinizde doğru ve profesyonel olun
- Mümkün olduğunca kaynakları belirtin
- Doğrudan yatırım tavsiyesi vermeyin; bunun yerine nesnel analizler sunun
- Finansal alan dışında bir şey sorulursa nazikçe reddedin
- Doğru finansal terminoloji kullanın
- Platform veya API anahtarları hakkında hiçbir iç bilgi ifşa etmeyin
- Konuşma bağlamını hatırlayın`,

  es: `Eres un asistente inteligente para la plataforma financiera Rouaa. Ayuda a los usuarios a comprender los informes y análisis financieros.
Reglas importantes:
- Responde siempre en español
- Sé preciso y profesional en tus análisis
- Cita las fuentes cuando sea posible
- No proporciones consejos de inversión directos; ofrece análisis objetivos
- Si te preguntan sobre algo fuera del ámbito financiero, rechaza cortésmente
- Usa terminología financiera correcta
- Nunca reveles información interna sobre la plataforma o las claves API
- Recuerda el contexto de la conversación`,
};

// Context formatting per locale
const CONTEXT_LABELS: Record<Locale, {
  reportContext: string;
  title: string;
  type: string;
  scope: string;
  impact: string;
  confidence: string;
  summary: string;
  content: string;
  keyIndicators: string;
  analysisContext: string;
  assetClass: string;
  analysisType: string;
  sentiment: string;
  riskLevel: string;
  technicalIndicators: string;
  priceTarget: string;
  extraContext: string;
  marketData: string;
  liveMarketData: string;
  report: string;
  analysis: string;
  referenceMemory: string;
  relatedArticle: string;
  conversationHistory: string;
}> = {
  ar: {
    reportContext: 'سياق التقرير',
    title: 'العنوان',
    type: 'النوع',
    scope: 'النطاق',
    impact: 'التأثير',
    confidence: 'مستوى الثقة',
    summary: 'الملخص',
    content: 'المحتوى',
    keyIndicators: 'المؤشرات الرئيسية',
    analysisContext: 'سياق التحليل',
    assetClass: 'فئة الأصول',
    analysisType: 'نوع التحليل',
    sentiment: 'المشاعر',
    riskLevel: 'مستوى المخاطر',
    technicalIndicators: 'المؤشرات الفنية',
    priceTarget: 'هدف السعر',
    extraContext: 'سياق إضافي',
    marketData: 'بيانات السوق الحالية',
    liveMarketData: 'بيانات السوق المباشرة',
    report: 'تقرير',
    analysis: 'تحليل',
    referenceMemory: 'الذاكرة المرجعية - مقالات ذات صلة',
    relatedArticle: 'مقال ذو صلة',
    conversationHistory: 'سجل المحادثة السابقة',
  },
  en: {
    reportContext: 'Report Context',
    title: 'Title',
    type: 'Type',
    scope: 'Scope',
    impact: 'Impact',
    confidence: 'Confidence Level',
    summary: 'Summary',
    content: 'Content',
    keyIndicators: 'Key Indicators',
    analysisContext: 'Analysis Context',
    assetClass: 'Asset Class',
    analysisType: 'Analysis Type',
    sentiment: 'Sentiment',
    riskLevel: 'Risk Level',
    technicalIndicators: 'Technical Indicators',
    priceTarget: 'Price Target',
    extraContext: 'Additional Context',
    marketData: 'Current Market Data',
    liveMarketData: 'Live Market Data',
    report: 'Report',
    analysis: 'Analysis',
    referenceMemory: 'Reference Memory - Related Articles',
    relatedArticle: 'Related Article',
    conversationHistory: 'Previous Conversation History',
  },
  fr: {
    reportContext: 'Contexte du rapport',
    title: 'Titre',
    type: 'Type',
    scope: 'Portée',
    impact: 'Impact',
    confidence: 'Niveau de confiance',
    summary: 'Résumé',
    content: 'Contenu',
    keyIndicators: 'Indicateurs clés',
    analysisContext: "Contexte de l'analyse",
    assetClass: "Classe d'actifs",
    analysisType: "Type d'analyse",
    sentiment: 'Sentiment',
    riskLevel: 'Niveau de risque',
    technicalIndicators: 'Indicateurs techniques',
    priceTarget: 'Objectif de prix',
    extraContext: 'Contexte supplémentaire',
    marketData: 'Données de marché actuelles',
    liveMarketData: 'Données de marché en direct',
    report: 'Rapport',
    analysis: 'Analyse',
    referenceMemory: 'Mémoire de référence - Articles connexes',
    relatedArticle: 'Article connexe',
    conversationHistory: 'Historique de conversation précédent',
  },
  tr: {
    reportContext: 'Rapor Bağlamı',
    title: 'Başlık',
    type: 'Tür',
    scope: 'Kapsam',
    impact: 'Etki',
    confidence: 'Güven Düzeyi',
    summary: 'Özet',
    content: 'İçerik',
    keyIndicators: 'Temel Göstergeler',
    analysisContext: 'Analiz Bağlamı',
    assetClass: 'Varlık Sınıfı',
    analysisType: 'Analiz Türü',
    sentiment: 'Duygu',
    riskLevel: 'Risk Seviyesi',
    technicalIndicators: 'Teknik Göstergeler',
    priceTarget: 'Fiyat Hedefi',
    extraContext: 'Ek Bağlam',
    marketData: 'Mevcut Piyasa Verileri',
    liveMarketData: 'Canlı Piyasa Verileri',
    report: 'Rapor',
    analysis: 'Analiz',
    referenceMemory: 'Referans Belleği - İlgili Makaleler',
    relatedArticle: 'İlgili Makale',
    conversationHistory: 'Önceki Konuşma Geçmişi',
  },
  es: {
    reportContext: 'Contexto del informe',
    title: 'Título',
    type: 'Tipo',
    scope: 'Alcance',
    impact: 'Impacto',
    confidence: 'Nivel de confianza',
    summary: 'Resumen',
    content: 'Contenido',
    keyIndicators: 'Indicadores clave',
    analysisContext: 'Contexto del análisis',
    assetClass: 'Clase de activo',
    analysisType: 'Tipo de análisis',
    sentiment: 'Sentimiento',
    riskLevel: 'Nivel de riesgo',
    technicalIndicators: 'Indicadores técnicos',
    priceTarget: 'Objetivo de precio',
    extraContext: 'Contexto adicional',
    marketData: 'Datos de mercado actuales',
    liveMarketData: 'Datos de mercado en vivo',
    report: 'Informe',
    analysis: 'Análisis',
    referenceMemory: 'Memoria de referencia - Artículos relacionados',
    relatedArticle: 'Artículo relacionado',
    conversationHistory: 'Historial de conversación anterior',
  },
};

// V3: Zod schema with history support
const AiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
  reportId: z.string().optional(),
  reportType: z.enum(['economic_report', 'report', 'market_analysis', 'analysis']).optional(),
  context: z.string().max(1000).optional(),
  locale: z.enum(['ar', 'en', 'fr', 'tr', 'es']).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = AiChatSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { message, reportId, reportType, context, history } = parsed.data;
    const locale: Locale = parsed.data.locale || 'ar';
    const labels = CONTEXT_LABELS[locale];

    // Sanitize user input to prevent prompt injection
    const sanitizedMessage = sanitizePromptInput(message);

    // Build context from report if provided
    let reportContext = '';
    const sources: string[] = [];

    if (reportId) {
      try {
        if (reportType === 'economic_report' || reportType === 'report') {
          const report = await db.economicReport.findUnique({
            where: { id: reportId },
            select: { title: true, summary: true, content: true, reportType: true, scope: true, marketImpact: true, confidenceScore: true, keyIndicators: true },
          });
          if (report) {
            reportContext = `\n\n${labels.reportContext}:\n- ${labels.title}: ${report.title}\n- ${labels.type}: ${report.reportType}\n- ${labels.scope}: ${report.scope}\n- ${labels.impact}: ${report.marketImpact}\n- ${labels.confidence}: ${report.confidenceScore}%\n- ${labels.summary}: ${report.summary}\n- ${labels.content}: ${report.content.slice(0, 3000)}`;
            if (report.keyIndicators) {
              try {
                const indicators = JSON.parse(report.keyIndicators);
                reportContext += `\n- ${labels.keyIndicators}: ${JSON.stringify(indicators)}`;
              } catch { /* ignore */ }
            }
            sources.push(`${labels.report}: ${report.title}`);
          }
        } else if (reportType === 'market_analysis' || reportType === 'analysis') {
          const analysis = await db.marketAnalysis.findUnique({
            where: { id: reportId },
            select: { title: true, content: true, assetClass: true, analysisType: true, sentiment: true, riskLevel: true, confidenceScore: true, indicators: true, priceTarget: true },
          });
          if (analysis) {
            reportContext = `\n\n${labels.analysisContext}:\n- ${labels.title}: ${analysis.title}\n- ${labels.assetClass}: ${analysis.assetClass}\n- ${labels.analysisType}: ${analysis.analysisType}\n- ${labels.sentiment}: ${analysis.sentiment}\n- ${labels.riskLevel}: ${analysis.riskLevel}\n- ${labels.confidence}: ${analysis.confidenceScore}%\n- ${labels.content}: ${analysis.content.slice(0, 3000)}`;
            if (analysis.indicators) {
              try {
                const ind = JSON.parse(analysis.indicators);
                reportContext += `\n- ${labels.technicalIndicators}: ${JSON.stringify(ind)}`;
              } catch { /* ignore */ }
            }
            if (analysis.priceTarget) {
              try {
                const pt = JSON.parse(analysis.priceTarget);
                reportContext += `\n- ${labels.priceTarget}: ${JSON.stringify(pt)}`;
              } catch { /* ignore */ }
            }
            sources.push(`${labels.analysis}: ${analysis.title}`);
          }
        }
      } catch {
        // Report not found or DB error — proceed without context
      }
    }

    // Add extra context if provided
    if (context) {
      reportContext += `\n\n${labels.extraContext}: ${sanitizePromptInput(context)}`;
    }

    // ─── REFERENCE MEMORY: Search for related articles ───────
    // Extract key terms from the user's question and find relevant news
    let referenceContext = '';
    try {
      // Extract key search terms (words longer than 2 chars, excluding common stop words)
      const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'also', 'هل', 'ما', 'من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'التي', 'كيف', 'متى', 'أين', 'لماذا', 'هل', 'لا', 'نعم', 'أن', 'إن', 'كان', 'كانت', 'يكون', 'تكون', 'قد', 'لن', 'لم', 'لقد']);
      const terms = sanitizedMessage.toLowerCase().split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));

      if (terms.length > 0) {
        // Search for the most relevant term (first meaningful word)
        const primaryTerm = terms[0];
        const relatedArticles = await db.newsItem.findMany({
          where: {
            isReady: true,
            OR: [
              { title: { contains: primaryTerm, mode: 'insensitive' } },
              { titleAr: { contains: primaryTerm, mode: 'insensitive' } },
              { summary: { contains: primaryTerm, mode: 'insensitive' } },
              { summaryAr: { contains: primaryTerm, mode: 'insensitive' } },
            ],
          },
          select: {
            title: true,
            titleAr: true,
            summary: true,
            summaryAr: true,
            category: true,
            sentiment: true,
            fetchedAt: true,
          },
          orderBy: { fetchedAt: 'desc' },
          take: 3, // Top 3 related articles
        });

        if (relatedArticles.length > 0) {
          referenceContext = `\n\n${labels.referenceMemory}:\n` +
            relatedArticles.map((a, i) => {
              const title = (locale === 'ar' && a.titleAr) ? a.titleAr : a.title;
              const summary = (locale === 'ar' && a.summaryAr) ? a.summaryAr : a.summary;
              return `${i + 1}. ${labels.relatedArticle}: ${title}\n   ${labels.summary}: ${summary.slice(0, 200)}${summary.length > 200 ? '...' : ''}\n   ${labels.sentiment}: ${a.sentiment} | ${labels.type}: ${a.category}`;
            }).join('\n');

          relatedArticles.forEach(a => {
            sources.push(`${labels.relatedArticle}: ${(locale === 'ar' && a.titleAr) ? a.titleAr : a.title}`);
          });
        }
      }
    } catch {
      // Reference memory search failed — proceed without it
    }

    // Get recent market data for context
    let marketContext = '';
    try {
      const topIndicators = await db.marketIndicator.findMany({
        take: 10,
        orderBy: { lastUpdated: 'desc' },
        select: { nameAr: true, symbol: true, value: true, changePercent: true, category: true },
      });
      if (topIndicators.length > 0) {
        marketContext = `\n\n${labels.marketData}:\n` + topIndicators
          .map((i) => `- ${i.nameAr || i.symbol} (${i.symbol}): ${i.value} (${i.changePercent >= 0 ? '+' : ''}${i.changePercent.toFixed(2)}%)`)
          .join('\n');
        sources.push(labels.liveMarketData);
      }
    } catch { /* silent */ }

    // Build messages for AI
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS[locale] + reportContext + referenceContext + marketContext },
    ];

    // FIX: Add conversation history for multi-turn memory
    if (history && history.length > 0) {
      // Add a system note about the conversation history
      messages.push({
        role: 'system',
        content: `${labels.conversationHistory}:`,
      });
      for (const histMsg of history) {
        messages.push({
          role: histMsg.role,
          content: histMsg.content,
        });
      }
    }

    // Add the current user message
    messages.push({ role: 'user', content: sanitizedMessage });

    // V4: Use chatCompletion() from ai-provider.ts — Cloudflare #1 via CLOUDFLARE_API_TOKEN
    let aiResponse = '';
    try {
      const result = await chatCompletion(
        messages.map((m) => ({ role: m.role, content: m.content })),
        {
          temperature: 0.7,
          maxTokens: 1000,
          locale,
          priority: 'generation',
        }
      );

      aiResponse = result.content || '';
    } catch (aiErr: any) {
      console.error('[AI Chat] chatCompletion error:', aiErr.message);

      // Fallback: locale-aware contextual responses
      const isSummary = message.includes('لخص') || message.includes('ملخص') || message.toLowerCase().includes('summar') || message.toLowerCase().includes('résum') || message.toLowerCase().includes('özetle') || message.toLowerCase().includes('resume');
      const isRecommendation = message.includes('توصيات') || message.includes('توصية') || message.toLowerCase().includes('recommend') || message.toLowerCase().includes('tavsiye') || message.toLowerCase().includes('recomend');

      if (isSummary) {
        if (locale === 'en') {
          aiResponse = reportContext
            ? `Based on available data, here is a summary:\n\n${reportContext.includes('Summary:') ? reportContext.split('Summary:')[1]?.split('\n')[0] || '' : 'No summary available at this time.'}\n\nNote: The AI service is currently unavailable.`
            : 'Sorry, I could not find a report to summarize. Please open a specific report first.';
        } else if (locale === 'fr') {
          aiResponse = reportContext
            ? `Basé sur les données disponibles, voici un résumé :\n\nNote : Le service IA est actuellement indisponible.`
            : "Désolé, je n'ai pas trouvé de rapport à résumer. Veuillez d'abord ouvrir un rapport spécifique.";
        } else if (locale === 'tr') {
          aiResponse = reportContext
            ? `Mevcut verilere göre özet:\n\nNot: AI hizmeti şu anda kullanılamıyor.`
            : 'Üzgünüm, özetlenecek bir rapor bulamadım. Lütfen önce belirli bir rapor açın.';
        } else if (locale === 'es') {
          aiResponse = reportContext
            ? `Basado en los datos disponibles, aquí hay un resumen:\n\nNota: El servicio de IA no está disponible actualmente.`
            : 'Lo siento, no encontré un informe para resumir. Por favor, abre un informe específico primero.';
        } else {
          aiResponse = reportContext
            ? `بناءً على البيانات المتاحة، إليك ملخص:\n\n⚠️ ملاحظة: هذا رد تجريبي. خدمة الذكاء الاصطناعي غير متاحة حالياً.`
            : 'عذراً، لم أتمكن من العثور على تقرير للتلخيص. يرجى فتح تقرير محدد أولاً.';
        }
      } else if (isRecommendation) {
        const noAdviceMsgs: Record<Locale, string> = {
          ar: 'عذراً، لا أقدم توصيات استثمارية مباشرة. يمكنني مساعدتك في فهم التحليلات والمؤشرات لتتخذ قرارك المستنير. خدمة الذكاء الاصطناعي غير متاحة حالياً.',
          en: 'Sorry, I do not provide direct investment advice. I can help you understand analyses and indicators to make informed decisions. The AI service is currently unavailable.',
          fr: "Désolé, je ne donne pas de conseils d'investissement directs. Je peux vous aider à comprendre les analyses et les indicateurs pour prendre des décisions éclairées. Le service IA est actuellement indisponible.",
          tr: 'Üzgünüm, doğrudan yatırım tavsiyesi vermiyorum. Bilinçli kararlar almanız için analizleri ve göstergeleri anlamanıza yardımcı olabilirim. AI hizmeti şu anda kullanılamıyor.',
          es: 'Lo siento, no proporciono consejos de inversión directos. Puedo ayudarte a entender los análisis e indicadores para tomar decisiones informadas. El servicio de IA no está disponible actualmente.',
        };
        aiResponse = noAdviceMsgs[locale];
      } else {
        const genericMsgs: Record<Locale, string> = {
          ar: 'عذراً، خدمة المساعد الذكي غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع فريق الدعم.',
          en: 'Sorry, the AI assistant service is currently unavailable. Please try again later or contact support.',
          fr: "Désolé, le service de l'assistant IA est actuellement indisponible. Veuillez réessayer plus tard ou contacter le support.",
          tr: 'Üzgünüm, AI asistan hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin veya destek ekibiyle iletişime geçin.',
          es: 'Lo siento, el servicio del asistente IA no está disponible actualmente. Por favor, inténtalo más tarde o contacta al soporte.',
        };
        aiResponse = genericMsgs[locale];
      }
    }

    // Clean up response
    if (!aiResponse || aiResponse.trim().length === 0) {
      const emptyMsgs: Record<Locale, string> = {
        ar: 'عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.',
        en: 'Sorry, I could not process your request. Please try again.',
        fr: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        tr: 'Üzgünüm, talebinizi işleyemedim. Lütfen tekrar deneyin.',
        es: 'Lo siento, no pude procesar tu solicitud. Por favor, inténtalo de nuevo.',
      };
      aiResponse = emptyMsgs[locale];
    }

    return NextResponse.json({
      response: aiResponse,
      sources: sources.length > 0 ? sources : undefined,
    });
  } catch (error: any) {
    console.error('[AI Chat API]', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
