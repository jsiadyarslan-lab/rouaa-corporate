// ─── مساعد رؤى — Recommendation Engine Agent (PR#25 → PR#26) ──
// المحرك الرئيسي لتوليد التوصيات باستخدام AI
// PR#25: أسعار حية + أهداف + وقف خسارة
// PR#26: تصفية حسب الأصول المفضلة + تحقق من ربط التقرير بالكلمات المفتاحية

import { chatCompletion } from '@/lib/ai-provider';
import { db } from '@/lib/db';
import { getQuote } from '@/lib/financial-apis';
import type { InvestorProfile, MarketContext, ScoredReport, Recommendation, AdvisorResult } from './types';

// ─── Locale Support ──────────────────────────────────────────────────
export type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

// ─── Localized System Prompts ────────────────────────────────────────
const LOCALE_SYSTEM_PROMPTS: Record<Locale, string> = {
  ar: `أنت مستشار استثماري ذكي في منصة "رؤى" المالية. مهمتك توليد توصيات شخصية مبنية على بيانات السوق الحقيقية وملف المستثمر.

قواعد صارمة:
1. كل توصية يجب أن تكون مرتبطة بتقرير حقيقي من القائمة أعلاه — ضع معرف التقرير في reportId
2. استخرج أرقام محددة من محتوى التقارير ومن حقل "أسعار الهدف" — استخدمها كـ entryPrice, targetPrice, stopLoss
3. إذا وجدت إشارة نشطة بأسعار محددة، استخدم أرقامها مباشرة
4. إذا لم تتوفر أرقام دقيقة في التقرير، قدّر أرقاماً معقولة بناءً على السيناريوهات واكتب "تقديري" في التعليل
5. إذا كان التحليل عاماً ولا يسمح بأرقام، اجعل action = "مراقبة" و entryPrice = null
6. لا تنصح بأصول لا تتناسب مع تحمل المخاطر أو أفق الاستثمار
7. إذا كان userProfile.riskTolerance منخفضاً، تجنب التوصيات بوقف خسارة أقل من 5% من سعر الدخول
8. نسبة allocationPercent يجب ألا تتجاوز 10% لتوصية واحدة
9. أضف دائماً إخلاء مسؤولية أن هذه توصيات عامة وليست نصيحة استثمارية
10. اكتب بالعربية الفصحى مع المصطلحات المالية المناسبة
11. لا تخترع أرقاماً أو بيانات غير موجودة — استخدم فقط ما في السياق

أنواع التوصيات:
- asset_focus: تركيز على فئة أصول معينة
- market_opportunity: فرصة سوقية محددة
- risk_alert: تنبيه مخاطر
- portfolio_rebalance: إعادة توازن المحفظة
- educational: محتوى تعليمي مناسب

أنواع الإجراءات (action):
- شراء: توصية بالدخول في مركز شراء
- بيع: توصية بالدخول في مركز بيع
- تجميع: شراء تدريجي على مستويات مختلفة
- مراقبة: متابعة دون اتخاذ إجراء حالي`,

  en: `You are an intelligent investment advisor on the "Ru'a" financial platform. Your task is to generate personalized recommendations based on real market data and the investor's profile.

Strict rules:
1. Every recommendation must be linked to a real report from the list above — put the report ID in reportId
2. Extract specific numbers from report content and from the "price targets" field — use them as entryPrice, targetPrice, stopLoss
3. If you find an active signal with specific prices, use its numbers directly
4. If exact numbers are not available in the report, estimate reasonable numbers based on scenarios and write "estimated" in the reasoning
5. If the analysis is general and does not allow numbers, set action = "monitor" and entryPrice = null
6. Do not recommend assets that do not match the risk tolerance or investment horizon
7. If userProfile.riskTolerance is low, avoid recommendations with stop loss less than 5% from entry price
8. The allocationPercent must not exceed 10% for a single recommendation
9. Always add a disclaimer that these are general recommendations and not investment advice
10. Write in formal English with appropriate financial terminology
11. Do not invent numbers or data that do not exist — use only what is in the context

Recommendation types:
- asset_focus: Focus on a specific asset class
- market_opportunity: Specific market opportunity
- risk_alert: Risk warning
- portfolio_rebalance: Portfolio rebalancing
- educational: Suitable educational content

Action types:
- buy: Recommendation to enter a long position
- sell: Recommendation to enter a short position
- accumulate: Gradual buying at different levels
- monitor: Watch without taking action now`,

  fr: `Vous êtes un conseiller en investissement intelligent sur la plateforme financière "Ru'a". Votre tâche est de générer des recommandations personnalisées basées sur des données de marché réelles et le profil de l'investisseur.

Règles strictes:
1. Chaque recommandation doit être liée à un rapport réel de la liste ci-dessus — mettez l'identifiant du rapport dans reportId
2. Extrayez des chiffres spécifiques du contenu des rapports et du champ "objectifs de prix" — utilisez-les comme entryPrice, targetPrice, stopLoss
3. Si vous trouvez un signal actif avec des prix spécifiques, utilisez ses chiffres directement
4. Si des chiffres exacts ne sont pas disponibles dans le rapport, estimez des chiffres raisonnables basés sur les scénarios et écrivez "estimé" dans le raisonnement
5. Si l'analyse est générale et ne permet pas de chiffres, définissez action = "surveiller" et entryPrice = null
6. Ne recommandez pas d'actifs qui ne correspondent pas à la tolérance au risque ou à l'horizon d'investissement
7. Si userProfile.riskTolerance est faible, évitez les recommandations avec un stop loss inférieur à 5% du prix d'entrée
8. Le allocationPercent ne doit pas dépasser 10% pour une seule recommandation
9. Ajoutez toujours une clause de non-responsabilité indiquant qu'il s'agit de recommandations générales et non de conseils en investissement
10. Écrivez en français formel avec la terminologie financière appropriée
11. N'inventez pas de chiffres ou de données inexistants — utilisez uniquement ce qui figure dans le contexte

Types de recommandations:
- asset_focus: Concentration sur une classe d'actifs spécifique
- market_opportunity: Opportunité de marché spécifique
- risk_alert: Alerte de risque
- portfolio_rebalance: Rééquilibrage de portefeuille
- educational: Contenu éducatif approprié

Types d'actions:
- acheter: Recommandation d'entrer en position longue
- vendre: Recommandation d'entrer en position courte
- accumuler: Achat progressif à différents niveaux
- surveiller: Observer sans agir pour le moment`,

  tr: `"Ru'a" finans platformasında akıllı bir yatırım danışmanısınız. Göreviniz, gerçek piyasa verilerine ve yatırımcı profiline dayalı kişiselleştirilmiş tavsiyeler üretmektir.

Katı kurallar:
1. Her tavsiye yukarıdaki listedeki gerçek bir raporla bağlantılı olmalıdır — rapor kimliğini reportId alanına koyun
2. Rapor içeriğinden ve "fiyat hedefleri" alanından belirli rakamlar çıkarın — bunları entryPrice, targetPrice, stopLoss olarak kullanın
3. Belirli fiyatları olan aktif bir sinyal bulursanız, rakamlarını doğrudan kullanın
4. Raporda kesin rakamlar mevcut değilse, senaryolara dayalı makul rakamlar tahmin edin ve gerekçeye "tahmini" yazın
5. Analiz genelse ve rakamlara izin vermiyorsa, action = "izle" ve entryPrice = null olarak ayarlayın
6. Risk toleransı veya yatırım ufkuyla uyuşmayan varlıkları tavsiye etmeyin
7. userProfile.riskTolerance düşükse, giriş fiyatından %5'ten az stop loss olan tavsiyelerden kaçının
8. allocationPercent tek bir tavsiye için %10'u aşmamalıdır
9. Bunların genel tavsiyeler olduğunu ve yatırım tavsiyesi olmadığını belirten bir sorumluluk reddi her zaman ekleyin
10. Resmi Türkçe ile uygun finansal terminoloji kullanarak yazın
11. Var olmayan rakamlar veya veriler uydurmayın — sadece bağlamda olanları kullanın

Tavsiye türleri:
- asset_focus: Belirli bir varlık sınıfına odaklanma
- market_opportunity: Belirli piyasa fırsatı
- risk_alert: Risk uyarısı
- portfolio_rebalance: Portföy yeniden dengeleme
- educational: Uygun eğitici içerik

Eylem türleri:
- satın_al: Uzun pozisyona giriş tavsiyesi
- sat: Kısa pozisyona giriş tavsiyesi
- biriktir: Farklı seviyelerde kademeli satın alma
- izle: Şu anda işlem yapmadan izleme`,

  es: `Eres un asesor de inversiones inteligente en la plataforma financiera "Ru'a". Tu tarea es generar recomendaciones personalizadas basadas en datos de mercado reales y el perfil del inversor.

Reglas estrictas:
1. Cada recomendación debe estar vinculada a un informe real de la lista anterior — pon el ID del informe en reportId
2. Extrae números específicos del contenido de los informes y del campo "objetivos de precio" — úsalos como entryPrice, targetPrice, stopLoss
3. Si encuentras una señal activa con precios específicos, usa sus números directamente
4. Si no hay números exactos disponibles en el informe, estima números razonables basados en escenarios y escribe "estimado" en el razonamiento
5. Si el análisis es general y no permite números, establece action = "monitorear" y entryPrice = null
6. No recomiendes activos que no coincidan con la tolerancia al riesgo o el horizonte de inversión
7. Si userProfile.riskTolerance es bajo, evita recomendaciones con stop loss inferior al 5% del precio de entrada
8. El allocationPercent no debe exceder el 10% para una sola recomendación
9. Siempre añade un descargo de responsabilidad de que estas son recomendaciones generales y no asesoramiento de inversión
10. Escribe en español formal con la terminología financiera apropiada
11. No inventes números o datos que no existan — usa solo lo que está en el contexto

Tipos de recomendaciones:
- asset_focus: Enfoque en una clase de activo específica
- market_opportunity: Oportunidad de mercado específica
- risk_alert: Alerta de riesgo
- portfolio_rebalance: Reequilibrio de cartera
- educational: Contenido educativo apropiado

Tipos de acciones:
- comprar: Recomendación para entrar en posición larga
- vender: Recomendación para entrar en posición corta
- acumular: Compra gradual en diferentes niveles
- monitorear: Observar sin tomar acción ahora`,
};

// ─── Localized Context Labels ────────────────────────────────────────
const LOCALE_CONTEXT_LABELS: Record<Locale, Record<string, string>> = {
  ar: {
    investorProfile: 'ملف المستثمر',
    experienceLevel: 'مستوى الخبرة',
    riskTolerance: 'تحمل المخاطر',
    investmentHorizon: 'أفق الاستثمار',
    preferredAssets: 'الأصول المفضلة',
    preferredMarkets: 'الأسواق المفضلة',
    capitalRange: 'حجم رأس المال',
    tradingFrequency: 'تكرار التداول',
    historicalSuccessRate: 'معدل نجاح التوصيات السابقة',
    currentMarketStatus: 'الوضع السوقي الحالي',
    overallSentiment: 'المشاعر العامة',
    bullishSectors: 'قطاعات صاعدة',
    bearishSectors: 'قطاعات هابطة',
    none: 'لا يوجد',
    latestNews: 'أحدث الأخبار عالية الأهمية',
    impact: 'تأثير',
    activeSignals: 'الإشارات النشطة (مع الأسعار الحقيقية)',
    confidence: 'ثقة',
    entry: 'دخول',
    target: 'هدف',
    stop: 'وقف',
    timeframe: 'إطار',
    upcomingEvents: 'أحداث اقتصادية قادمة',
    strategicReports: 'التقارير الاستراتيجية المتاحة (المحتوى الكامل)',
    report: 'تقرير',
    id: 'المعرف',
    title: 'العنوان',
    relevance: 'صلة',
    urgency: 'إلحاح',
    link: 'الرابط',
    content: 'المحتوى',
    priceTargets: 'أسعار الهدف',
    keyIndicators: 'المؤشرات الرئيسية',
    sentiment: 'المشاعر',
    riskLevel: 'مستوى المخاطر',
    timeFrame: 'الإطار الزمني',
    previousRecommendations: 'التوصيات السابقة وتقييمات المستخدم',
    general: 'عام',
    monitor: 'مراقبة',
    noRating: 'لا تقييم',
    successful: 'ناجحة',
    unsuccessful: 'غير ناجحة',
    buy: 'شراء',
    sell: 'بيع',
  },
  en: {
    investorProfile: 'Investor Profile',
    experienceLevel: 'Experience Level',
    riskTolerance: 'Risk Tolerance',
    investmentHorizon: 'Investment Horizon',
    preferredAssets: 'Preferred Assets',
    preferredMarkets: 'Preferred Markets',
    capitalRange: 'Capital Range',
    tradingFrequency: 'Trading Frequency',
    historicalSuccessRate: 'Historical Success Rate',
    currentMarketStatus: 'Current Market Status',
    overallSentiment: 'Overall Sentiment',
    bullishSectors: 'Bullish Sectors',
    bearishSectors: 'Bearish Sectors',
    none: 'None',
    latestNews: 'Latest High-Impact News',
    impact: 'Impact',
    activeSignals: 'Active Signals (with real prices)',
    confidence: 'Confidence',
    entry: 'Entry',
    target: 'Target',
    stop: 'Stop',
    timeframe: 'Timeframe',
    upcomingEvents: 'Upcoming Economic Events',
    strategicReports: 'Available Strategic Reports (Full Content)',
    report: 'Report',
    id: 'ID',
    title: 'Title',
    relevance: 'Relevance',
    urgency: 'Urgency',
    link: 'Link',
    content: 'Content',
    priceTargets: 'Price Targets',
    keyIndicators: 'Key Indicators',
    sentiment: 'Sentiment',
    riskLevel: 'Risk Level',
    timeFrame: 'Time Frame',
    previousRecommendations: 'Previous Recommendations & User Ratings',
    general: 'General',
    monitor: 'Monitor',
    noRating: 'No rating',
    successful: 'Successful',
    unsuccessful: 'Unsuccessful',
    buy: 'Buy',
    sell: 'Sell',
  },
  fr: {
    investorProfile: 'Profil de l\'investisseur',
    experienceLevel: 'Niveau d\'expérience',
    riskTolerance: 'Tolérance au risque',
    investmentHorizon: 'Horizon d\'investissement',
    preferredAssets: 'Actifs préférés',
    preferredMarkets: 'Marchés préférés',
    capitalRange: 'Plage de capital',
    tradingFrequency: 'Fréquence de trading',
    historicalSuccessRate: 'Taux de réussite historique',
    currentMarketStatus: 'État actuel du marché',
    overallSentiment: 'Sentiment général',
    bullishSectors: 'Secteurs haussiers',
    bearishSectors: 'Secteurs baissiers',
    none: 'Aucun',
    latestNews: 'Dernières nouvelles à fort impact',
    impact: 'Impact',
    activeSignals: 'Signaux actifs (avec prix réels)',
    confidence: 'Confiance',
    entry: 'Entrée',
    target: 'Objectif',
    stop: 'Stop',
    timeframe: 'Horizon',
    upcomingEvents: 'Événements économiques à venir',
    strategicReports: 'Rapports stratégiques disponibles (contenu complet)',
    report: 'Rapport',
    id: 'Identifiant',
    title: 'Titre',
    relevance: 'Pertinence',
    urgency: 'Urgence',
    link: 'Lien',
    content: 'Contenu',
    priceTargets: 'Objectifs de prix',
    keyIndicators: 'Indicateurs clés',
    sentiment: 'Sentiment',
    riskLevel: 'Niveau de risque',
    timeFrame: 'Horizon temporel',
    previousRecommendations: 'Recommandations précédentes et évaluations',
    general: 'Général',
    monitor: 'Surveiller',
    noRating: 'Pas d\'évaluation',
    successful: 'Réussie',
    unsuccessful: 'Non réussie',
    buy: 'Acheter',
    sell: 'Vendre',
  },
  tr: {
    investorProfile: 'Yatırımcı Profili',
    experienceLevel: 'Deneyim Seviyesi',
    riskTolerance: 'Risk Toleransı',
    investmentHorizon: 'Yatırım Ufku',
    preferredAssets: 'Tercih Edilen Varlıklar',
    preferredMarkets: 'Tercih Edilen Piyasalar',
    capitalRange: 'Sermaye Aralığı',
    tradingFrequency: 'İşlem Sıklığı',
    historicalSuccessRate: 'Geçmiş Başarı Oranı',
    currentMarketStatus: 'Mevcut Piyasa Durumu',
    overallSentiment: 'Genel Duygu',
    bullishSectors: 'Yükseliş Sektörleri',
    bearishSectors: 'Düşüş Sektörleri',
    none: 'Yok',
    latestNews: 'Son Yüksek Etkili Haberler',
    impact: 'Etki',
    activeSignals: 'Aktif Sinyaller (gerçek fiyatlarla)',
    confidence: 'Güven',
    entry: 'Giriş',
    target: 'Hedef',
    stop: 'Stop',
    timeframe: 'Zaman Çerçevesi',
    upcomingEvents: 'Yaklaşan Ekonomik Etkinlikler',
    strategicReports: 'Mevcut Stratejik Raporlar (Tam İçerik)',
    report: 'Rapor',
    id: 'Kimlik',
    title: 'Başlık',
    relevance: 'İlgililik',
    urgency: 'Aciliyet',
    link: 'Bağlantı',
    content: 'İçerik',
    priceTargets: 'Fiyat Hedefleri',
    keyIndicators: 'Temel Göstergeler',
    sentiment: 'Duygu',
    riskLevel: 'Risk Seviyesi',
    timeFrame: 'Zaman Çerçevesi',
    previousRecommendations: 'Önceki Tavsiyeler ve Kullanıcı Değerlendirmeleri',
    general: 'Genel',
    monitor: 'İzle',
    noRating: 'Değerlendirme yok',
    successful: 'Başarılı',
    unsuccessful: 'Başarısız',
    buy: 'Satın Al',
    sell: 'Sat',
  },
  es: {
    investorProfile: 'Perfil del inversor',
    experienceLevel: 'Nivel de experiencia',
    riskTolerance: 'Tolerancia al riesgo',
    investmentHorizon: 'Horizonte de inversión',
    preferredAssets: 'Activos preferidos',
    preferredMarkets: 'Mercados preferidos',
    capitalRange: 'Rango de capital',
    tradingFrequency: 'Frecuencia de trading',
    historicalSuccessRate: 'Tasa de éxito histórica',
    currentMarketStatus: 'Estado actual del mercado',
    overallSentiment: 'Sentimiento general',
    bullishSectors: 'Sectores alcistas',
    bearishSectors: 'Sectores bajistas',
    none: 'Ninguno',
    latestNews: 'Últimas noticias de alto impacto',
    impact: 'Impacto',
    activeSignals: 'Señales activas (con precios reales)',
    confidence: 'Confianza',
    entry: 'Entrada',
    target: 'Objetivo',
    stop: 'Stop',
    timeframe: 'Marco temporal',
    upcomingEvents: 'Próximos eventos económicos',
    strategicReports: 'Informes estratégicos disponibles (contenido completo)',
    report: 'Informe',
    id: 'Identificador',
    title: 'Título',
    relevance: 'Relevancia',
    urgency: 'Urgencia',
    link: 'Enlace',
    content: 'Contenido',
    priceTargets: 'Objetivos de precio',
    keyIndicators: 'Indicadores clave',
    sentiment: 'Sentimiento',
    riskLevel: 'Nivel de riesgo',
    timeFrame: 'Marco temporal',
    previousRecommendations: 'Recomendaciones anteriores y evaluaciones',
    general: 'General',
    monitor: 'Monitorear',
    noRating: 'Sin evaluación',
    successful: 'Exitosa',
    unsuccessful: 'No exitosa',
    buy: 'Comprar',
    sell: 'Vender',
  },
};

/**
 * Helper to get a locale-aware context label
 */
function getContextLabel(locale: Locale, key: string): string {
  return LOCALE_CONTEXT_LABELS[locale]?.[key] || LOCALE_CONTEXT_LABELS.ar[key] || key;
}

// ─── Localized Fallback Recommendations ──────────────────────────────
const LOCALE_FALLBACK: Record<Locale, {
  bearishAlert: { title: string; summary: string; reasoning: string; actionItems: string[] };
  signalOpportunity: { titlePrefix: string; summaryPrefix: string; reasoning: string; actionItems: string[] };
  beginnerEducation: { title: string; summary: string; reasoning: string; actionItems: string[] };
  economicEvent: { titlePrefix: string; summary: string; reasoningPrefix: string; actionItems: string[] };
  generic: { titlePrefix: string; summary: string; reasoning: string; actionItems: string[] };
  actionLabels: { buy: string; sell: string; monitor: string };
}> = {
  ar: {
    bearishAlert: {
      title: 'تحذير: مشاعر سلبية سائدة في الأسواق',
      summary: 'الأسواق تشهد مشاعر سلبية. ننصح بالحذر وتقليل المراكز المفتوحة.',
      reasoning: 'المشاعر السوقية الحالية سلبية وتتناسب مع مستوى تحمل المخاطر المنخفض لديك. من الأفضل تجنب فتح مراكز جديدة.',
      actionItems: ['مراجعة المراكز المفتوحة', 'تفعيل أوامر وقف الخسارة', 'متابعة الأخبار الاقتصادية عن كثب'],
    },
    signalOpportunity: {
      titlePrefix: 'فرصة تداول',
      summaryPrefix: 'إشارة',
      reasoning: 'إشارة نشطة بثقة عالية. يُنصح بمراقبة الزوج ودراسة الدخول عند مستويات مناسبة لملفك الاستثماري.',
      actionItems: ['مراجعة الرسم البياني', 'تحديد نقطة الدخول المناسبة لملفك', 'وضع أمر وقف خسارة قبل الدخول'],
    },
    beginnerEducation: {
      title: 'تعلّم أساسيات إدارة المخاطر',
      summary: 'قبل الدخول في أي صفقات، تأكد من فهم أساسيات إدارة المخاطر.',
      reasoning: 'كمستثمر مبتديء، فهم إدارة المخاطر هو أهم خطوة يمكنك اتخاذها.',
      actionItems: ['قراءة دليل إدارة المخاطر', 'تحديد نسبة المخاطرة القصوى لكل صفقة', 'تعلم استخدام أوامر وقف الخسارة'],
    },
    economicEvent: {
      titlePrefix: 'حدث اقتصادي مهم',
      summary: 'حدث اقتصادي قادم قد يؤثر على أسواقك المفضلة.',
      reasoningPrefix: 'الحدث',
      actionItems: ['مراقبة السوق قبل وبعد الحدث', 'تجنب فتح مراكز كبيرة قبيل الحدث', 'متابعة التحليلات ذات الصلة'],
    },
    generic: {
      titlePrefix: 'تركز على',
      summary: 'تابع تطورات الأسواق التي تهمك وحافظ على اطلاع مستمر.',
      reasoning: 'بناءً على اهتماماتك، ننصح بمتابعة التطورات في فئات الأصول المفضلة لديك.',
      actionItems: ['مراجعة آخر التحليلات', 'متابعة إشارات التداول', 'قراءة التقارير الأسبوعية'],
    },
    actionLabels: { buy: 'شراء', sell: 'بيع', monitor: 'مراقبة' },
  },
  en: {
    bearishAlert: {
      title: 'Warning: Bearish sentiment prevailing in markets',
      summary: 'Markets are experiencing bearish sentiment. We advise caution and reducing open positions.',
      reasoning: 'Current market sentiment is bearish and aligns with your low risk tolerance. It is best to avoid opening new positions.',
      actionItems: ['Review open positions', 'Activate stop-loss orders', 'Monitor economic news closely'],
    },
    signalOpportunity: {
      titlePrefix: 'Trading opportunity',
      summaryPrefix: 'Signal',
      reasoning: 'An active signal with high confidence. It is recommended to monitor the pair and study entry at levels suitable for your profile.',
      actionItems: ['Review the chart', 'Identify a suitable entry point for your profile', 'Place a stop-loss order before entering'],
    },
    beginnerEducation: {
      title: 'Learn the basics of risk management',
      summary: 'Before entering any trades, make sure you understand the basics of risk management.',
      reasoning: 'As a beginner investor, understanding risk management is the most important step you can take.',
      actionItems: ['Read the risk management guide', 'Determine the maximum risk per trade', 'Learn to use stop-loss orders'],
    },
    economicEvent: {
      titlePrefix: 'Important economic event',
      summary: 'An upcoming economic event may affect your preferred markets.',
      reasoningPrefix: 'The event',
      actionItems: ['Monitor the market before and after the event', 'Avoid opening large positions before the event', 'Follow related analyses'],
    },
    generic: {
      titlePrefix: 'Focus on',
      summary: 'Follow developments in the markets that interest you and stay informed.',
      reasoning: 'Based on your interests, we recommend following developments in your preferred asset classes.',
      actionItems: ['Review the latest analyses', 'Follow trading signals', 'Read weekly reports'],
    },
    actionLabels: { buy: 'Buy', sell: 'Sell', monitor: 'Monitor' },
  },
  fr: {
    bearishAlert: {
      title: 'Alerte : Sentiment baissier prévalant sur les marchés',
      summary: 'Les marchés connaissent un sentiment baissier. Nous conseillons la prudence et la réduction des positions ouvertes.',
      reasoning: 'Le sentiment actuel du marché est baissier et correspond à votre faible tolérance au risque. Il est préférable d\'éviter d\'ouvrir de nouvelles positions.',
      actionItems: ['Examiner les positions ouvertes', 'Activer les ordres stop-loss', 'Suivre de près les actualités économiques'],
    },
    signalOpportunity: {
      titlePrefix: 'Opportunité de trading',
      summaryPrefix: 'Signal',
      reasoning: 'Un signal actif avec une confiance élevée. Il est recommandé de surveiller la paire et d\'étudier l\'entrée à des niveaux adaptés à votre profil.',
      actionItems: ['Examiner le graphique', 'Identifier un point d\'entrée adapté à votre profil', 'Placer un ordre stop-loss avant l\'entrée'],
    },
    beginnerEducation: {
      title: 'Apprenez les bases de la gestion des risques',
      summary: 'Avant d\'entrer dans des transactions, assurez-vous de comprendre les bases de la gestion des risques.',
      reasoning: 'En tant qu\'investisseur débutant, comprendre la gestion des risques est l\'étape la plus importante que vous puissiez prendre.',
      actionItems: ['Lire le guide de gestion des risques', 'Déterminer le risque maximum par transaction', 'Apprendre à utiliser les ordres stop-loss'],
    },
    economicEvent: {
      titlePrefix: 'Événement économique important',
      summary: 'Un événement économique à venir peut affecter vos marchés préférés.',
      reasoningPrefix: 'L\'événement',
      actionItems: ['Surveiller le marché avant et après l\'événement', 'Éviter d\'ouvrir de grandes positions avant l\'événement', 'Suivre les analyses associées'],
    },
    generic: {
      titlePrefix: 'Concentration sur',
      summary: 'Suivez les développements des marchés qui vous intéressent et restez informé.',
      reasoning: 'Based sur vos intérêts, nous recommandons de suivre les développements dans vos classes d\'actifs préférées.',
      actionItems: ['Examiner les dernières analyses', 'Suivre les signaux de trading', 'Lire les rapports hebdomadaires'],
    },
    actionLabels: { buy: 'Acheter', sell: 'Vendre', monitor: 'Surveiller' },
  },
  tr: {
    bearishAlert: {
      title: 'Uyarı: Piyasalarda düşüş duygusu hakim',
      summary: 'Piyasalar düşüş duygusu yaşıyor. Dikkatli olmanızı ve açık pozisyonları azaltmanızı tavsiye ediyoruz.',
      reasoning: 'Mevcut piyasa duygusu düşüş yönlü ve düşük risk toleransınıza uygun. Yeni pozisyon açmaktan kaçınmak en iyisidir.',
      actionItems: ['Açık pozisyonları gözden geçirin', 'Stop-loss emirlerini aktive edin', 'Ekonomik haberleri yakından takip edin'],
    },
    signalOpportunity: {
      titlePrefix: 'İşlem fırsatı',
      summaryPrefix: 'Sinyal',
      reasoning: 'Yüksek güvenle aktif bir sinyal. Çifti izlemeniz ve profilinize uygun seviyelerde giriş çalışmanız önerilir.',
      actionItems: ['Grafikleri inceleyin', 'Profilinize uygun giriş noktası belirleyin', 'Giriş yapmadan önce stop-loss emri koyun'],
    },
    beginnerEducation: {
      title: 'Risk yönetiminin temellerini öğrenin',
      summary: 'Herhangi bir işleme girmeden önce risk yönetiminin temellerini anladığınızdan emin olun.',
      reasoning: 'Yeni başlayan bir yatırımcı olarak, risk yönetimini anlamak alabileceğiniz en önemli adımdır.',
      actionItems: ['Risk yönetimi kılavuzunu okuyun', 'İşlem başına maksimum riski belirleyin', 'Stop-loss emirlerini kullanmayı öğrenin'],
    },
    economicEvent: {
      titlePrefix: 'Önemli ekonomik etkinlik',
      summary: 'Yaklaşan bir ekonomik etkinlik tercih ettiğiniz piyasaları etkileyebilir.',
      reasoningPrefix: 'Etkinlik',
      actionItems: ['Etkinlik öncesi ve sonrası piyasayı izleyin', 'Etkinlik öncesi büyük pozisyon açmaktan kaçının', 'İlgili analizleri takip edin'],
    },
    generic: {
      titlePrefix: 'Odaklanma',
      summary: 'İlgilendiğiniz piyasalardaki gelişmeleri takip edin ve bilgi sahibi olun.',
      reasoning: 'İlgi alanlarınıza dayalı olarak, tercih ettiğiniz varlık sınıflarındaki gelişmeleri takip etmenizi öneriyoruz.',
      actionItems: ['Son analizleri gözden geçirin', 'İşlem sinyallerini takip edin', 'Haftalık raporları okuyun'],
    },
    actionLabels: { buy: 'Satın Al', sell: 'Sat', monitor: 'İzle' },
  },
  es: {
    bearishAlert: {
      title: 'Alerta: Sentimiento bajista predominante en los mercados',
      summary: 'Los mercados están experimentando un sentimiento bajista. Aconsejamos precaución y reducir las posiciones abiertas.',
      reasoning: 'El sentimiento actual del mercado es bajista y se alinea con su baja tolerancia al riesgo. Es mejor evitar abrir nuevas posiciones.',
      actionItems: ['Revisar posiciones abiertas', 'Activar órdenes de stop-loss', 'Monitorear las noticias económicas de cerca'],
    },
    signalOpportunity: {
      titlePrefix: 'Oportunidad de trading',
      summaryPrefix: 'Señal',
      reasoning: 'Una señal activa con alta confianza. Se recomienda monitorear el par y estudiar la entrada en niveles adecuados para su perfil.',
      actionItems: ['Revisar el gráfico', 'Identificar un punto de entrada adecuado para su perfil', 'Colocar una orden de stop-loss antes de entrar'],
    },
    beginnerEducation: {
      title: 'Aprende los fundamentos de la gestión de riesgos',
      summary: 'Antes de entrar en cualquier operación, asegúrate de entender los fundamentos de la gestión de riesgos.',
      reasoning: 'Como inversor principiante, entender la gestión de riesgos es el paso más importante que puedes tomar.',
      actionItems: ['Leer la guía de gestión de riesgos', 'Determinar el riesgo máximo por operación', 'Aprender a usar órdenes de stop-loss'],
    },
    economicEvent: {
      titlePrefix: 'Evento económico importante',
      summary: 'Un evento económico próximo puede afectar sus mercados preferidos.',
      reasoningPrefix: 'El evento',
      actionItems: ['Monitorear el mercado antes y después del evento', 'Evitar abrir posiciones grandes antes del evento', 'Seguir análisis relacionados'],
    },
    generic: {
      titlePrefix: 'Enfoque en',
      summary: 'Sigue los desarrollos en los mercados que te interesan y mantente informado.',
      reasoning: 'Basándote en tus intereses, te recomendamos seguir los desarrollos en tus clases de activos preferidas.',
      actionItems: ['Revisar los últimos análisis', 'Seguir señales de trading', 'Leer informes semanales'],
    },
    actionLabels: { buy: 'Comprar', sell: 'Vender', monitor: 'Monitorear' },
  },
};

// ─── Localized Risk Parameter Labels ─────────────────────────────────
const LOCALE_TIME_HORIZON: Record<Locale, { conservative: string; moderate: string; aggressive: string }> = {
  ar: { conservative: '2-4 أسابيع', moderate: '1-2 أسبوع', aggressive: '3-7 أيام' },
  en: { conservative: '2-4 weeks', moderate: '1-2 weeks', aggressive: '3-7 days' },
  fr: { conservative: '2-4 semaines', moderate: '1-2 semaines', aggressive: '3-7 jours' },
  tr: { conservative: '2-4 hafta', moderate: '1-2 hafta', aggressive: '3-7 gün' },
  es: { conservative: '2-4 semanas', moderate: '1-2 semanas', aggressive: '3-7 días' },
};

// ─── Localized Enrichment Reasoning Labels ───────────────────────────
const LOCALE_ENRICHMENT: Record<Locale, {
  suggestedLevels: string;
  entryAt: string;
  targetLabel: string;
  stopLossLabel: string;
  calculatedBased: string;
  riskLabels: { conservative: string; moderate: string; aggressive: string };
  checkEntryPrice: string;
}> = {
  ar: {
    suggestedLevels: 'مستويات مقترحة',
    entryAt: 'الدخول عند',
    targetLabel: 'الهدف',
    stopLossLabel: 'وقف الخسارة',
    calculatedBased: 'هذه المستويات محسوبة بناءً على السعر الحي وتحمل المخاطر',
    riskLabels: { conservative: 'محافظ', moderate: 'معتدل', aggressive: 'جريء' },
    checkEntryPrice: 'سعر الدخول',
  },
  en: {
    suggestedLevels: 'Suggested levels',
    entryAt: 'Entry at',
    targetLabel: 'Target',
    stopLossLabel: 'Stop loss',
    calculatedBased: 'These levels are calculated based on the live price and risk tolerance',
    riskLabels: { conservative: 'conservative', moderate: 'moderate', aggressive: 'aggressive' },
    checkEntryPrice: 'entry price',
  },
  fr: {
    suggestedLevels: 'Niveaux suggérés',
    entryAt: 'Entrée à',
    targetLabel: 'Objectif',
    stopLossLabel: 'Stop loss',
    calculatedBased: 'Ces niveaux sont calculés sur la base du prix en direct et de la tolérance au risque',
    riskLabels: { conservative: 'conservateur', moderate: 'modéré', aggressive: 'agressif' },
    checkEntryPrice: "prix d'entrée",
  },
  tr: {
    suggestedLevels: 'Önerilen seviyeler',
    entryAt: 'Giriş',
    targetLabel: 'Hedef',
    stopLossLabel: 'Stop loss',
    calculatedBased: 'Bu seviyeler canlı fiyat ve risk toleransına göre hesaplanmıştır',
    riskLabels: { conservative: 'muhafazakar', moderate: 'ılımlı', aggressive: 'agresif' },
    checkEntryPrice: 'giriş fiyatı',
  },
  es: {
    suggestedLevels: 'Niveles sugeridos',
    entryAt: 'Entrada en',
    targetLabel: 'Objetivo',
    stopLossLabel: 'Stop loss',
    calculatedBased: 'Estos niveles se calculan en función del precio en vivo y la tolerancia al riesgo',
    riskLabels: { conservative: 'conservador', moderate: 'moderado', aggressive: 'agresivo' },
    checkEntryPrice: 'precio de entrada',
  },
};

// ─── PR#26: قاموس الكلمات المفتاحية لكل فئة أصول ─────────────────────
// يُستخدم للتحقق من أن التقرير المصدر مرتبط فعلاً بالأصل الموصى به
const ASSET_KEYWORD_MAP: Record<string, string[]> = {
  'BTC': ['بيتكوين', 'عملات رقمية', 'سيولة', 'سعر الفائدة', 'تضخم', 'الاحتياطي الفيدرالي', 'كريبتو', 'بتكوين', 'Bitcoin', 'crypto', 'blockchain', 'تعدين', 'محفظة رقمية'],
  'ETH': ['إيثيريوم', 'عملات رقمية', 'عقود ذكية', 'DeFi', 'سيولة', 'سعر الفائدة', 'كريبتو', 'Ethereum', 'crypto'],
  'crypto': ['عملات رقمية', 'كريبتو', 'بيتكوين', 'إيثيريوم', 'تعدين', 'blockchain', 'DeFi', 'رمزية', 'عملة مشفرة'],
  'XAU': ['ذهب', 'معادن ثمينة', 'ملاذ آمن', 'تضخم', 'أسعار الذهب', 'XAU', 'Gold', 'سبائك'],
  'XAG': ['فضة', 'معادن ثمينة', 'XAG', 'Silver', 'سبائك'],
  'commodities': ['سلع', 'معادن', 'نفط', 'ذهب', 'غذاء', 'محاصيل', 'مواد خام'],
  'WTI': ['نفط', 'برنت', 'خام', 'أوبك', 'طاقة', 'بترول', 'WTI', 'Crude', 'Oil'],
  'oil': ['نفط', 'برنت', 'خام', 'أوبك', 'طاقة', 'بترول'],
  'forex': ['فوركس', 'عملات', 'أسعار صرف', 'دولار', 'يورو', 'ين', 'بنك مركزي', 'سعر فائدة'],
  'EUR': ['يورو', 'أوروبا', 'بنك مركزي أوروبي', 'ECB', 'منطقة اليورو'],
  'GBP': ['إسترليني', 'بريطانيا', 'بنك إنجلترا', 'بريكست'],
  'JPY': ['ين ياباني', 'اليابان', 'بنك اليابان', 'BOJ'],
  'realEstate': ['عقارات', 'إسكان', 'رهن عقاري', 'أسعار المنازل', 'REIT', 'تطوير عقاري', 'أراضي', 'بناء', 'تشييد', 'سكني'],
  'stocks': ['أسهم', 'بورصة', 'شركات', 'أرباح', 'توزيعات', 'S&P', 'NASDAQ', 'DOW'],
  'indices': ['مؤشرات', 'S&P', 'NASDAQ', 'داو جونز', 'فوتسي', 'نيكي', 'بورصة'],
};

/**
 * PR#26: تحقق من أن التقرير يحتوي على كلمات مفتاحية مرتبطة بالأصل
 * يُرجع true إذا وجد على الأقل كلمة مفتاحية واحدة
 */
function reportMatchesAsset(reportContent: string | undefined, asset: string | null): boolean {
  if (!reportContent || !asset) return false; // لا محتوى أو لا أصل → لا يمكن التحقق

  const contentLower = reportContent.toLowerCase();
  const assetUpper = asset.toUpperCase();

  // البحث عن الكلمات المفتاحية المباشرة للاختصار (BTC, ETH, XAU...)
  const directMatch = assetUpper.split('/')[0]; // BTC من BTC/USD
  if (contentLower.includes(directMatch.toLowerCase())) return true;

  // البحث في قاموس الكلمات المفتاحية
  for (const [key, keywords] of Object.entries(ASSET_KEYWORD_MAP)) {
    if (directMatch === key || assetUpper.includes(key)) {
      for (const kw of keywords) {
        if (contentLower.includes(kw.toLowerCase())) return true;
      }
    }
  }

  return false;
}

/**
 * PR#26: تحقق من أن التوصية تتطابق مع الأصول المفضلة للمستخدم
 * يُرجع: 'preferred' | 'general' | 'mismatch'
 */
function matchPreferredAssets(rec: Recommendation, preferredAssets: string[]): 'preferred' | 'general' | 'mismatch' {
  if (!preferredAssets || preferredAssets.length === 0) return 'general';

  const recAsset = (rec.asset || '').toUpperCase();
  const recClasses = (rec.relatedAssetClasses || []).map(c => c.toLowerCase());

  for (const pref of preferredAssets) {
    const prefLower = pref.toLowerCase();
    const prefUpper = pref.toUpperCase();

    // مطابقة مباشرة لفئة الأصل
    if (recClasses.includes(prefLower)) return 'preferred';

    // مطابقة عبر قاموس الكلمات المفتاحية
    const keywords = ASSET_KEYWORD_MAP[prefUpper] || ASSET_KEYWORD_MAP[prefLower];
    if (keywords) {
      const recText = `${recAsset} ${rec.title} ${rec.summary} ${(rec.relatedSymbols || []).join(' ')}`.toLowerCase();
      for (const kw of keywords) {
        if (recText.includes(kw.toLowerCase())) return 'preferred';
      }
    }

    // مطابقة جزئية (مثلاً: "crypto" مع "BTC/USD")
    if (recAsset.includes(prefUpper) || prefUpper.includes(recAsset.split('/')[0])) {
      return 'preferred';
    }
  }

  return 'mismatch';
}

export async function generateRecommendations(
  profile: InvestorProfile,
  context: MarketContext,
  scoredReports: ScoredReport[],
  locale: Locale = 'ar'
): Promise<AdvisorResult> {
  const startTime = Date.now();

  try {
    // بناء ملخص السياق للذكاء الاصطناعي
    const topReports = scoredReports.slice(0, 8);
    const topNews = context.recentNews.slice(0, 6);
    const activeSignals = context.activeSignals.slice(0, 5);
    const upcomingEvents = context.economicEvents.slice(0, 4);

    // جلب بيانات التوصيات السابقة الناجحة لحساب الثقة
    const pastRecommendations = await db.personalizedRecommendation.findMany({
      where: {
        userId: profile.userId,
        feedbackType: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        asset: true,
        action: true,
        feedbackType: true,
        isSuccessful: true,
        confidenceScore: true,
      },
    });

    const successCount = pastRecommendations.filter(r => r.isSuccessful === true).length;
    const totalFeedback = pastRecommendations.filter(r => r.feedbackType).length;
    const historicalSuccessRate = totalFeedback > 0 ? (successCount / totalFeedback) * 100 : 50;

    // جلب slug التقارير المصدرية
    const reportDetails = await loadReportDetails(topReports);

    const contextSummary = `
${getContextLabel(locale, 'investorProfile')}:
- ${getContextLabel(locale, 'experienceLevel')}: ${profile.experienceLevel}
- ${getContextLabel(locale, 'riskTolerance')}: ${profile.riskTolerance}
- ${getContextLabel(locale, 'investmentHorizon')}: ${profile.investmentHorizon}
- ${getContextLabel(locale, 'preferredAssets')}: ${profile.preferredAssets.join(', ')}
- ${getContextLabel(locale, 'preferredMarkets')}: ${profile.preferredMarkets.join(', ')}
- ${getContextLabel(locale, 'capitalRange')}: ${profile.capitalRange}
- ${getContextLabel(locale, 'tradingFrequency')}: ${profile.tradingFrequency}
- ${getContextLabel(locale, 'historicalSuccessRate')}: ${historicalSuccessRate.toFixed(0)}%

${getContextLabel(locale, 'currentMarketStatus')}:
- ${getContextLabel(locale, 'overallSentiment')}: ${context.marketSentiment.overall}
- ${getContextLabel(locale, 'bullishSectors')}: ${Object.entries(context.marketSentiment.sectors).filter(([, v]) => v === 'bullish').map(([k]) => k).join(', ') || getContextLabel(locale, 'none')}
- ${getContextLabel(locale, 'bearishSectors')}: ${Object.entries(context.marketSentiment.sectors).filter(([, v]) => v === 'bearish').map(([k]) => k).join(', ') || getContextLabel(locale, 'none')}

${getContextLabel(locale, 'latestNews')}:
${topNews.map((n, i) => `${i + 1}. ${n.title} (${n.sentiment}, ${getContextLabel(locale, 'impact')}: ${n.impactLevel})`).join('\n')}

${getContextLabel(locale, 'activeSignals')}:
${activeSignals.map((s, i) => {
  let line = `${i + 1}. ${s.pair}: ${s.action === 'BUY' ? getContextLabel(locale, 'buy') : s.action === 'SELL' ? getContextLabel(locale, 'sell') : s.action} (${getContextLabel(locale, 'confidence')}: ${s.confidence}%)`;
  if (s.entryPrice) line += ` | ${getContextLabel(locale, 'entry')}: ${s.entryPrice}`;
  if (s.takeProfit) line += ` | ${getContextLabel(locale, 'target')}: ${s.takeProfit}`;
  if (s.stopLoss) line += ` | ${getContextLabel(locale, 'stop')}: ${s.stopLoss}`;
  if (s.riskReward) line += ` | R:R = ${s.riskReward}`;
  if (s.timeframe) line += ` | ${getContextLabel(locale, 'timeframe')}: ${s.timeframe}`;
  return line;
}).join('\n')}

${getContextLabel(locale, 'upcomingEvents')}:
${upcomingEvents.map((e, i) => `${i + 1}. ${e.eventName} (${e.importance}, ${e.country})`).join('\n')}

═══════════════════════════════════════
${getContextLabel(locale, 'strategicReports')}:
═══════════════════════════════════════
${topReports.map((r, i) => {
  const detail = reportDetails[r.id];
  let block = `--- ${getContextLabel(locale, 'report')} #${i + 1} [${r.type}] ---\n${getContextLabel(locale, 'id')}: ${r.id}\n${getContextLabel(locale, 'title')}: ${r.title}\n${getContextLabel(locale, 'relevance')}: ${r.relevanceScore}% | ${getContextLabel(locale, 'urgency')}: ${r.urgencyScore}%${detail?.slug ? `\n${getContextLabel(locale, 'link')}: /reports/${detail.slug}` : ''}`;
  // إضافة محتوى التقرير إذا متوفر
  if (r.content) {
    // اقتطاع المحتوى لـ 800 حرف لكل تقرير
    const truncatedContent = r.content.length > 800 ? r.content.slice(0, 800) + '...' : r.content;
    block += `\n${getContextLabel(locale, 'content')}:\n${truncatedContent}`;
  }
  // إضافة أسعار الهدف من MarketAnalysis
  if (r.priceTarget) {
    block += `\n${getContextLabel(locale, 'priceTargets')}: ${r.priceTarget}`;
  }
  if (r.keyIndicators) {
    block += `\n${getContextLabel(locale, 'keyIndicators')}: ${r.keyIndicators}`;
  }
  if (r.sentiment) {
    block += `\n${getContextLabel(locale, 'sentiment')}: ${r.sentiment}`;
  }
  if (r.riskLevel) {
    block += `\n${getContextLabel(locale, 'riskLevel')}: ${r.riskLevel}`;
  }
  if (r.timeFrame) {
    block += `\n${getContextLabel(locale, 'timeFrame')}: ${r.timeFrame}`;
  }
  return block;
}).join('\n\n')}
═══════════════════════════════════════

${getContextLabel(locale, 'previousRecommendations')}:
${pastRecommendations.slice(0, 10).map((r, i) => `${i + 1}. ${r.asset || getContextLabel(locale, 'general')} — ${r.action || getContextLabel(locale, 'monitor')} → ${r.feedbackType || getContextLabel(locale, 'noRating')}${r.isSuccessful !== null ? ` (${r.isSuccessful ? getContextLabel(locale, 'successful') : getContextLabel(locale, 'unsuccessful')})` : ''}`).join('\n')}
`;

    const systemPrompt = LOCALE_SYSTEM_PROMPTS[locale] || LOCALE_SYSTEM_PROMPTS.ar;

    const userPrompt = `${contextSummary}

بناءً على البيانات أعلاه، ولّد 3-5 توصيات شخصية للمستثمر. أجب بتنسيق JSON فقط (بدون markdown):

{
  "recommendations": [
    {
      "recommendationType": "asset_focus|market_opportunity|risk_alert|portfolio_rebalance|educational",
      "title": "توصية بشأن [الأصل]",
      "titleEn": "English title",
      "summary": "ملخص مختصر",
      "reasoning": "المبرر التفصيلي لماذا هذه التوصية مناسبة لهذا المستثمر تحديداً",
      "actionItems": ["خطوة 1", "خطوة 2", "خطوة 3"],
      "relatedAssetClasses": ["forex", "commodities"],
      "relatedSymbols": ["XAU/USD", "EUR/USD"],
      "confidenceScore": 75,
      "urgencyLevel": "normal|high|critical",
      "validUntilHours": 24,
      "reportId": "معرف التقرير المصدر من القائمة أعلاه — إلزامي!",
      "reportTitle": "عنوان التقرير المصدر",
      "asset": "BTC/USD",
      "action": "شراء|بيع|تجميع|مراقبة",
      "entryPrice": "67,500",
      "targetPrice": "72,000",
      "stopLoss": "65,000",
      "timeHorizon": "أسبوعين",
      "allocationPercent": "5%"
    }
  ]
}

قواعد إلزامية:
- reportId إلزامي — يجب أن يكون معرف تقرير حقيقي من القائمة أعلاه
- إذا وجدت أرقاماً في حقل "أسعار الهدف" للتقرير، انسخها مباشرة إلى entryPrice, targetPrice, stopLoss
- إذا وجدت إشارة نشطة بأرقام، استخدمها كأساس للتوصية
- إذا كان التحليل سياسياً عاماً بدون أرقام، اجعل action = "مراقبة" و entryPrice = null
- لا تكرر الأصول الموصى بها في أكثر من توصية واحدة
- تأكد أن stopLoss أقل من entryPrice في الشراء، وأعلى منه في البيع`;

    const result = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, maxTokens: 3000, priority: 'generation' }
    );

    if (!result.content) {
      throw new Error('AI returned empty response');
    }

    // استخراج JSON من الرد
    let parsed: { recommendations: Recommendation[] };
    try {
      // محاولة استخراج JSON مباشرة
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Advisor:RecommendationEngine] Failed to parse AI response:', result.content.slice(0, 200));
      // إنشاء توصيات احتياطية بناءً على البيانات المتاحة
      parsed = generateFallbackRecommendations(profile, context, scoredReports, reportDetails, locale);
    }

    const rawRecommendations: any[] = (parsed.recommendations || []).map((rec: any) => {
      // حساب الثقة الديناميكية
      const baseConfidence = Math.min(100, Math.max(0, rec.confidenceScore || 50));
      const dynamicConfidence = calculateDynamicConfidence(
        baseConfidence,
        rec,
        profile,
        pastRecommendations,
        scoredReports
      );

      // ربط بالتقرير المصدر
      const reportLink = rec.reportId ? reportDetails[rec.reportId] : null;

      return {
        ...rec,
        recommendationType: rec.recommendationType || 'market_opportunity',
        title: rec.title || 'توصية سوقية',
        titleEn: rec.titleEn,
        summary: rec.summary || '',
        reasoning: rec.reasoning || '',
        actionItems: Array.isArray(rec.actionItems) ? rec.actionItems : [],
        relatedAssetClasses: Array.isArray(rec.relatedAssetClasses) ? rec.relatedAssetClasses : [],
        relatedSymbols: Array.isArray(rec.relatedSymbols) ? rec.relatedSymbols : [],
        relatedReportIds: rec.reportId ? [rec.reportId] : topReports.slice(0, 3).map(r => r.id),
        relatedNewsIds: topNews.slice(0, 3).map(n => n.id),
        confidenceScore: dynamicConfidence,
        urgencyLevel: ['low', 'normal', 'high', 'critical'].includes(rec.urgencyLevel) ? rec.urgencyLevel : 'normal',
        validUntilHours: rec.validUntilHours || 24,
        sourceData: {
          aiProvider: result.provider,
          aiModel: result.model,
          contextNewsCount: context.recentNews.length,
          contextSignalsCount: context.activeSignals.length,
          scoredReportsCount: scoredReports.length,
          historicalSuccessRate,
        },
        // حقول PR#23
        reportId: rec.reportId || null,
        reportSlug: reportLink?.slug || null,
        reportTitle: rec.reportTitle || reportLink?.title || null,
        asset: rec.asset || null,
        action: rec.action || null,
        entryPrice: rec.entryPrice || null,
        targetPrice: rec.targetPrice || null,
        stopLoss: rec.stopLoss || null,
        timeHorizon: rec.timeHorizon || null,
        allocationPercent: rec.allocationPercent || null,
      };
    });

    // ── PR#25: جلب الأسعار الحية وحساب entryPrice/targetPrice/stopLoss ──
    let recommendations: Recommendation[] = await enrichWithLivePrices(rawRecommendations, profile, locale);

    // ── PR#26: التحققق من ربط التقرير بالكلمات المفتاحية ──
    recommendations = recommendations.map(rec => {
      if (rec.reportId && rec.asset) {
        // البحث عن محتوى التقرير المصدر في جميع التقارير المقيّمة
        const sourceReport = scoredReports.find(r => r.id === rec.reportId) || topReports.find(r => r.id === rec.reportId);
        const reportContent = sourceReport?.content || sourceReport?.title || '';
        const isMatch = reportMatchesAsset(reportContent, rec.asset);

        if (!isMatch) {
          // التقرير لا يحتوي على كلمات مفتاحية مرتبطة بالأصل → إزالة الرابط
          console.log(`[Advisor:RecommendationEngine] Report ${rec.reportId} does not match asset ${rec.asset} — unlinking`);
          return {
            ...rec,
            reportId: null,
            reportSlug: null,
            reportTitle: null,
            sourceData: {
              ...rec.sourceData,
              reportUnlinked: true,
              originalReportId: rec.reportId,
              originalReportTitle: rec.reportTitle,
              unlinkReason: 'keyword_mismatch',
            },
          };
        }
      }
      return rec;
    });

    // ── PR#26: تصفية حسب الأصول المفضلة ──
    const preferredAssets = profile.preferredAssets || [];
    const allowGeneral = profile.allowGeneralRecommendations ?? false;

    const filteredRecommendations = recommendations.filter(rec => {
      // تصفية حسب الحد الأدنى للثقة
      if (rec.confidenceScore < profile.minConfidenceScore) return false;

      // تصفية الأصول المستبعدة
      if (rec.asset && profile.excludedAssets.length > 0) {
        const assetLower = rec.asset.toLowerCase();
        if (profile.excludedAssets.some(ex => assetLower.includes(ex.toLowerCase()))) return false;
      }

      // تصفية حسب الأصول المفضلة
      if (preferredAssets.length > 0) {
        const match = matchPreferredAssets(rec, preferredAssets);
        if (match === 'mismatch' && !allowGeneral) {
          return false; // لا تعرض توصيات خارج الأصول المفضلة ما لم يسمح المستخدم
        }
      }

      return true;
    });

    const duration = Date.now() - startTime;
    console.log(`[Advisor:RecommendationEngine] Generated ${recommendations.length} recommendations, ${filteredRecommendations.length} after filtering in ${duration}ms via ${result.provider}`);

    return {
      success: true,
      recommendations: filteredRecommendations,
      profileSnapshot: profile,
      generatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Advisor:RecommendationEngine] Error:', error.message);
    // محاولة توليد توصيات احتياطية
    const fallback = generateFallbackRecommendations(profile, context, scoredReports, {}, locale);
    return {
      success: false,
      recommendations: fallback.recommendations,
      profileSnapshot: profile,
      generatedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * حساب الثقة الديناميكية بناءً على:
 * 1. الثقة الأساسية من AI
 * 2. تشابه التوصية مع توصيات سابقة ناجحة
 * 3. مدى مطابقتها لملف المستخدم
 * 4. درجة ثقة التقرير الأصلي
 */
function calculateDynamicConfidence(
  baseConfidence: number,
  rec: any,
  profile: InvestorProfile,
  pastRecommendations: Array<{ asset: string | null; action: string | null; feedbackType: string | null; isSuccessful: boolean | null; confidenceScore: number }>,
  scoredReports: ScoredReport[]
): number {
  let confidence = baseConfidence;

  // 1. تعديل بناءً على نجاح توصيات مماثلة سابقة
  if (rec.asset && pastRecommendations.length > 0) {
    const similarRecs = pastRecommendations.filter(r =>
      r.asset && rec.asset &&
      r.asset.toLowerCase().includes(rec.asset.split('/')[0].toLowerCase())
    );
    if (similarRecs.length > 0) {
      const successfulSimilar = similarRecs.filter(r => r.isSuccessful === true).length;
      const failedSimilar = similarRecs.filter(r => r.isSuccessful === false).length;
      if (successfulSimilar > failedSimilar) {
        confidence = Math.min(100, confidence + 5); // زيادة الثقة إذا كانت توصيات مماثلة ناجحة
      } else if (failedSimilar > successfulSimilar) {
        confidence = Math.max(0, confidence - 5); // خفض الثقة إذا كانت توصيات مماثلة فاشلة
      }
    }
  }

  // 2. تعديل بناءً على مطابقة ملف المستخدم
  if (rec.relatedAssetClasses) {
    const matchingAssets = rec.relatedAssetClasses.filter((a: string) => profile.preferredAssets.includes(a));
    confidence += matchingAssets.length * 3; // +3 لكل أصل مطابق
  }

  // 3. تعديل بناءً على ثقة التقرير المصدر
  if (rec.reportId) {
    const sourceReport = scoredReports.find(r => r.id === rec.reportId);
    if (sourceReport) {
      const reportConfidence = sourceReport.confidenceScore || 50;
      confidence = (confidence * 0.7) + (reportConfidence * 0.3); // 70% ثقة AI + 30% ثقة التقرير
    }
  }

  return Math.min(100, Math.max(0, Math.round(confidence)));
}

/**
 * جلب تفاصيل التقارير المصدرية (slug, title) للربط
 */
async function loadReportDetails(topReports: ScoredReport[]): Promise<Record<string, { slug: string | null; title: string }>> {
  const details: Record<string, { slug: string | null; title: string }> = {};

  for (const report of topReports) {
    try {
      if (report.type === 'economic_report') {
        const er = await db.economicReport.findUnique({
          where: { id: report.id },
          select: { slug: true, title: true },
        });
        if (er) details[report.id] = { slug: er.slug, title: er.title };
      } else if (report.type === 'market_analysis') {
        const ma = await db.marketAnalysis.findUnique({
          where: { id: report.id },
          select: { slug: true, title: true },
        });
        if (ma) details[report.id] = { slug: ma.slug, title: ma.title };
      }
    } catch {
      // تجاهل أخطاء جلب التفاصيل
    }
  }

  return details;
}

// ─── PR#25: جلب الأسعار الحية وحساب مستويات الدخول/الهدف/وقف الخسارة ────────

/**
 * تحويل رمز الأصل من تنسيق التوصية إلى تنسيق financial-apis
 * مثال: "BTC/USD" → "BINANCE:BTCUSDT", "XAU/USD" → "OANDA:XAU_USD"
 */
function assetToApiSymbol(asset: string): string[] {
  const symbols: string[] = [];
  const clean = asset.trim().toUpperCase();

  // تحليل الزوج: BASE/QUOTE
  const parts = clean.split('/');
  const base = parts[0]?.toUpperCase() || '';
  const quote = parts[1]?.toUpperCase() || 'USD';

  // عملات رقمية
  const cryptoBases = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'DOT', 'MATIC', 'AVAX'];
  if (cryptoBases.includes(base)) {
    if (quote === 'USDT') symbols.push(`BINANCE:${base}USDT`);
    else symbols.push(`BINANCE:${base}USDT`);
    symbols.push(base); // Fallback for Finnhub/CoinGecko
    return symbols;
  }

  // سلع (ذهب، فضة، نفط)
  if (['XAU', 'XAG', 'XPD', 'XPT'].includes(base)) {
    symbols.push(`OANDA:${base}_${quote}`);
    symbols.push(base);
    return symbols;
  }
  if (base === 'WTI' || base === 'OIL' || base === 'CRUDE') {
    symbols.push('OANDA:WTI_USD');
    symbols.push('WTI');
    return symbols;
  }

  // فوركس
  const forexPairs = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD'];
  if (forexPairs.includes(base) || forexPairs.includes(quote)) {
    symbols.push(`OANDA:${base}_${quote}`);
    symbols.push(`${base}${quote}`);
    return symbols;
  }

  // مؤشرات
  const indices: Record<string, string> = {
    'SPX': 'SPX', 'SP500': 'SPX', 'S&P500': 'SPX',
    'NDX': 'NDX', 'NASDAQ': 'NDX',
    'DJI': 'DJI', 'DOW': 'DJI',
    'FTSE': 'FTSE100',
  };
  if (indices[base]) {
    symbols.push(indices[base]);
    return symbols;
  }

  // افتراضي: سهم أو رمز مباشر
  symbols.push(base);
  return symbols;
}

/**
 * حساب نسبة الهدف ووقف الخسارة بناءً على تحمل المخاطر
 */
function getRiskParameters(riskTolerance: string, locale: Locale = 'ar'): {
  targetPercent: number;
  stopLossPercent: number;
  timeHorizon: string;
} {
  const timeHorizons = LOCALE_TIME_HORIZON[locale] || LOCALE_TIME_HORIZON.ar;
  switch (riskTolerance) {
    case 'conservative':
      return { targetPercent: 0.03, stopLossPercent: 0.02, timeHorizon: timeHorizons.conservative };
    case 'moderate':
      return { targetPercent: 0.05, stopLossPercent: 0.03, timeHorizon: timeHorizons.moderate };
    case 'aggressive':
      return { targetPercent: 0.08, stopLossPercent: 0.04, timeHorizon: timeHorizons.aggressive };
    default:
      return { targetPercent: 0.05, stopLossPercent: 0.03, timeHorizon: timeHorizons.moderate };
  }
}

/**
 * جلب السعر الحي لأصل معيّن من financial-apis
 */
async function fetchLivePrice(asset: string): Promise<number | null> {
  const apiSymbols = assetToApiSymbol(asset);

  for (const symbol of apiSymbols) {
    try {
      const quote = await getQuote(symbol);
      if (quote && quote.price > 0) {
        console.log(`[Advisor:RecommendationEngine] Live price fetched: ${asset} (${symbol}) = ${quote.price}`);
        return quote.price;
      }
    } catch (err: any) {
      console.warn(`[Advisor:RecommendationEngine] Price fetch failed for ${symbol}:`, err.message?.slice(0, 80));
    }
  }

  console.warn(`[Advisor:RecommendationEngine] No live price available for ${asset}`);
  return null;
}

/**
 * إثراء التوصيات بالأسعار الحية وحساب مستويات الدخول/الهدف/وقف الخسارة
 * PR#25: إذا لم تكن التوصية تحتوي على أسعار صريحة، نجلب السعر الحي ونحسبها
 */
async function enrichWithLivePrices(
  recs: any[],
  profile: InvestorProfile,
  locale: Locale = 'ar'
): Promise<Recommendation[]> {
  const riskParams = getRiskParameters(profile.riskTolerance, locale);
  const enrichmentLabels = LOCALE_ENRICHMENT[locale] || LOCALE_ENRICHMENT.ar;

  return Promise.all(recs.map(async (rec) => {
    // إذا كانت التوصية "مراقبة" فقط ولا يوجد أصل، لا نحتاج أسعار
    if (rec.action === 'مراقبة' && !rec.asset) {
      return rec as Recommendation;
    }

    // إذا كانت التوصية تحتوي بالفعل على أسعار صريحة وصحيحة، نحتفظ بها
    const hasExplicitPrices = rec.entryPrice && rec.targetPrice && rec.stopLoss
      && !isNaN(parseFloat(String(rec.entryPrice).replace(/,/g, '')))
      && !isNaN(parseFloat(String(rec.targetPrice).replace(/,/g, '')))
      && !isNaN(parseFloat(String(rec.stopLoss).replace(/,/g, '')));

    if (hasExplicitPrices) {
      // التحقق من أن وقف الخسارة أقل من 5% للمحافظين
      const entry = parseFloat(String(rec.entryPrice).replace(/,/g, ''));
      const sl = parseFloat(String(rec.stopLoss).replace(/,/g, ''));
      if (profile.riskTolerance === 'conservative' && entry > 0) {
        const slPercent = Math.abs(entry - sl) / entry;
        if (slPercent < 0.05) {
          // ضبط وقف الخسارة ليكون 5% على الأقل
          rec.stopLoss = formatPrice(entry * 0.95);
          rec.sourceData = { ...rec.sourceData, stopLossAdjusted: true, originalStopLoss: rec.stopLoss };
        }
      }
      return rec as Recommendation;
    }

    // لا يوجد أصل محدد → لا يمكن جلب سعر
    if (!rec.asset) {
      return rec as Recommendation;
    }

    // جلب السعر الحي
    const livePrice = await fetchLivePrice(rec.asset);

    if (!livePrice || livePrice <= 0) {
      // لا سعر حي متاح → تحويل إلى "مراقبة"
      console.log(`[Advisor:RecommendationEngine] No live price for ${rec.asset}, setting action=مراقبة`);
      rec.action = 'مراقبة';
      rec.entryPrice = null;
      rec.targetPrice = null;
      rec.stopLoss = null;
      rec.sourceData = { ...rec.sourceData, livePriceUnavailable: true };
      return rec as Recommendation;
    }

    // حساب المستويات بناءً على السعر الحي ونوع الإجراء
    const action = rec.action || 'مراقبة';

    if (action === 'مراقبة') {
      // مراقبة: نعرض السعر الحالي فقط بدون مستويات
      rec.entryPrice = formatPrice(livePrice);
      rec.targetPrice = null;
      rec.stopLoss = null;
      rec.sourceData = { ...rec.sourceData, livePrice: livePrice, priceSource: 'api' };
      return rec as Recommendation;
    }

    // شراء / بيع / تجميع: حساب المستويات
    let entryPrice: number;
    let targetPrice: number;
    let stopLoss: number;

    if (action === 'شراء' || action === 'تجميع') {
      entryPrice = livePrice; // السعر الحالي كنقطة دخول
      targetPrice = livePrice * (1 + riskParams.targetPercent);
      stopLoss = livePrice * (1 - riskParams.stopLossPercent);
    } else if (action === 'بيع') {
      entryPrice = livePrice;
      targetPrice = livePrice * (1 - riskParams.targetPercent);
      stopLoss = livePrice * (1 + riskParams.stopLossPercent);
    } else {
      entryPrice = livePrice;
      targetPrice = livePrice * (1 + riskParams.targetPercent);
      stopLoss = livePrice * (1 - riskParams.stopLossPercent);
    }

    rec.entryPrice = formatPrice(entryPrice);
    rec.targetPrice = formatPrice(targetPrice);
    rec.stopLoss = formatPrice(stopLoss);
    rec.timeHorizon = rec.timeHorizon || riskParams.timeHorizon;

    // حساب نسبة التغيير للعرض
    const targetChangePercentNum = ((targetPrice - entryPrice) / entryPrice * 100);
    const stopLossChangePercentNum = ((stopLoss - entryPrice) / entryPrice * 100);
    const targetChangePercent = targetChangePercentNum.toFixed(1);
    const stopLossChangePercent = stopLossChangePercentNum.toFixed(1);

    rec.sourceData = {
      ...rec.sourceData,
      livePrice: livePrice,
      priceSource: 'api',
      targetChangePercent: `${targetChangePercentNum > 0 ? '+' : ''}${targetChangePercent}%`,
      stopLossChangePercent: `${stopLossChangePercentNum > 0 ? '+' : ''}${stopLossChangePercent}%`,
    };

    // تحديث التعليل ليشمل الأسعار
    if (rec.reasoning && !rec.reasoning.includes(enrichmentLabels.checkEntryPrice)) {
      const riskLabel = enrichmentLabels.riskLabels[profile.riskTolerance as keyof typeof enrichmentLabels.riskLabels] || enrichmentLabels.riskLabels.moderate;
      rec.reasoning += `\n\n${enrichmentLabels.suggestedLevels}: ${enrichmentLabels.entryAt} ${formatPrice(entryPrice)}، ${enrichmentLabels.targetLabel} ${formatPrice(targetPrice)} (${targetChangePercentNum > 0 ? '+' : ''}${targetChangePercent}%)، ${enrichmentLabels.stopLossLabel} ${formatPrice(stopLoss)} (${stopLossChangePercentNum > 0 ? '+' : ''}${stopLossChangePercent}%). ${enrichmentLabels.calculatedBased} (${riskLabel}).`;
    }

    return rec as Recommendation;
  }));
}

/**
 * تنسيق السعر للعرض (إزالة الأصفار غير الضرورية)
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else {
    return price.toFixed(4);
  }
}

/**
 * جلب السعر الحي لأصل وتحديث التوصية الموجودة في قاعدة البيانات
 * يُستدعى من API تحديث الأسعار
 */
export async function refreshRecommendationPrice(
  recommendationId: string,
  riskTolerance: string = 'moderate',
  locale: Locale = 'ar'
): Promise<{ updated: boolean; livePrice?: number; entryPrice?: string; targetPrice?: string; stopLoss?: string; timeHorizon?: string } | null> {
  try {
    const rec = await db.personalizedRecommendation.findUnique({
      where: { id: recommendationId },
      select: { id: true, asset: true, action: true },
    });

    if (!rec || !rec.asset) return null;

    const livePrice = await fetchLivePrice(rec.asset);
    if (!livePrice || livePrice <= 0) return { updated: false };

    const riskParams = getRiskParameters(riskTolerance, locale);
    const action = rec.action || 'مراقبة';

    let entryPrice: number;
    let targetPrice: number | null = null;
    let stopLoss: number | null = null;

    if (action === 'مراقبة') {
      entryPrice = livePrice;
    } else if (action === 'شراء' || action === 'تجميع') {
      entryPrice = livePrice;
      targetPrice = livePrice * (1 + riskParams.targetPercent);
      stopLoss = livePrice * (1 - riskParams.stopLossPercent);
    } else if (action === 'بيع') {
      entryPrice = livePrice;
      targetPrice = livePrice * (1 - riskParams.targetPercent);
      stopLoss = livePrice * (1 + riskParams.stopLossPercent);
    } else {
      entryPrice = livePrice;
    }

    await db.personalizedRecommendation.update({
      where: { id: recommendationId },
      data: {
        entryPrice: formatPrice(entryPrice),
        targetPrice: targetPrice ? formatPrice(targetPrice) : null,
        stopLoss: stopLoss ? formatPrice(stopLoss) : null,
        timeHorizon: riskParams.timeHorizon,
      },
    });

    return {
      updated: true,
      livePrice,
      entryPrice: formatPrice(entryPrice),
      targetPrice: targetPrice ? formatPrice(targetPrice) : undefined,
      stopLoss: stopLoss ? formatPrice(stopLoss) : undefined,
      timeHorizon: riskParams.timeHorizon,
    };
  } catch (error: any) {
    console.error('[Advisor:RecommendationEngine] refreshRecommendationPrice error:', error.message);
    return null;
  }
}

function generateFallbackRecommendations(
  profile: InvestorProfile,
  context: MarketContext,
  scoredReports: ScoredReport[],
  reportDetails: Record<string, { slug: string | null; title: string }>,
  locale: Locale = 'ar'
): { recommendations: Recommendation[] } {
  const recommendations: Recommendation[] = [];
  const topReport = scoredReports[0];
  const topReportDetail = topReport ? reportDetails[topReport.id] : null;
  const fb = LOCALE_FALLBACK[locale] || LOCALE_FALLBACK.ar;

  // توصية بناءً على المشاعر العامة
  if (context.marketSentiment.overall === 'bearish' && profile.riskTolerance === 'conservative') {
    recommendations.push({
      recommendationType: 'risk_alert',
      title: fb.bearishAlert.title,
      summary: fb.bearishAlert.summary,
      reasoning: fb.bearishAlert.reasoning,
      actionItems: fb.bearishAlert.actionItems,
      relatedAssetClasses: profile.preferredAssets,
      relatedSymbols: [],
      relatedReportIds: scoredReports.slice(0, 2).map(r => r.id),
      relatedNewsIds: context.recentNews.slice(0, 2).map(n => n.id),
      confidenceScore: 70,
      urgencyLevel: 'high',
      validUntilHours: 12,
      sourceData: { type: 'fallback', reason: 'ai_unavailable' },
      action: fb.actionLabels.monitor,
      reportId: topReport?.id || undefined,
      reportSlug: topReportDetail?.slug || undefined,
      reportTitle: topReport?.title || undefined,
    });
  }

  // توصية بناءً على الإشارات النشطة
  if (context.activeSignals.length > 0) {
    const topSignal = context.activeSignals[0];
    const signalAction = topSignal.action === 'BUY' ? fb.actionLabels.buy : topSignal.action === 'SELL' ? fb.actionLabels.sell : fb.actionLabels.monitor;
    recommendations.push({
      recommendationType: 'market_opportunity',
      title: `${fb.signalOpportunity.titlePrefix}: ${topSignal.pair} — ${signalAction}`,
      summary: `${fb.signalOpportunity.summaryPrefix} ${topSignal.action} ${locale === 'ar' ? 'على' : locale === 'fr' ? 'sur' : locale === 'tr' ? '' : locale === 'es' ? 'en' : 'on'} ${topSignal.pair} ${locale === 'ar' ? 'بثقة' : locale === 'fr' ? 'confiance' : locale === 'tr' ? 'güven' : locale === 'es' ? 'confianza' : 'confidence'} ${topSignal.confidence}%.`,
      reasoning: fb.signalOpportunity.reasoning,
      actionItems: fb.signalOpportunity.actionItems,
      relatedAssetClasses: [topSignal.category],
      relatedSymbols: [topSignal.pair],
      relatedReportIds: scoredReports.slice(0, 2).map(r => r.id),
      relatedNewsIds: [],
      confidenceScore: Math.min(85, topSignal.confidence),
      urgencyLevel: topSignal.confidence >= 80 ? 'high' : 'normal',
      validUntilHours: 8,
      sourceData: { type: 'fallback', signalId: topSignal.id },
      asset: topSignal.pair,
      action: signalAction,
      reportId: topReport?.id || undefined,
      reportSlug: topReportDetail?.slug || undefined,
      reportTitle: topReport?.title || undefined,
    });
  }

  // توصية تعليمية للمبتدئين
  if (profile.experienceLevel === 'beginner') {
    recommendations.push({
      recommendationType: 'educational',
      title: fb.beginnerEducation.title,
      summary: fb.beginnerEducation.summary,
      reasoning: fb.beginnerEducation.reasoning,
      actionItems: fb.beginnerEducation.actionItems,
      relatedAssetClasses: [],
      relatedSymbols: [],
      relatedReportIds: [],
      relatedNewsIds: [],
      confidenceScore: 90,
      urgencyLevel: 'low',
      validUntilHours: 168,
      sourceData: { type: 'fallback', reason: 'educational_for_beginner' },
      action: fb.actionLabels.monitor,
    });
  }

  // توصية بناءً على الأحداث الاقتصادية
  if (context.economicEvents.length > 0) {
    const nextEvent = context.economicEvents[0];
    recommendations.push({
      recommendationType: 'market_opportunity',
      title: `${fb.economicEvent.titlePrefix}: ${nextEvent.eventName}`,
      summary: fb.economicEvent.summary,
      reasoning: `${fb.economicEvent.reasoningPrefix} ${nextEvent.eventName} (${nextEvent.country}) ${locale === 'ar' ? 'بأهمية' : locale === 'en' ? 'with importance' : locale === 'fr' ? 'd\'importance' : locale === 'tr' ? 'önem derecesi' : 'con importancia'} ${nextEvent.importance} ${locale === 'ar' ? 'قد يخلق فرصاً تداولية' : locale === 'en' ? 'may create trading opportunities' : locale === 'fr' ? 'peut créer des opportunités de trading' : locale === 'tr' ? 'işlem fırsatları yaratabilir' : 'puede crear oportunidades de trading'}.`,
      actionItems: fb.economicEvent.actionItems,
      relatedAssetClasses: ['forex'],
      relatedSymbols: [],
      relatedReportIds: scoredReports.slice(0, 2).map(r => r.id),
      relatedNewsIds: [],
      confidenceScore: 65,
      urgencyLevel: nextEvent.importance === 'critical' ? 'high' : 'normal',
      validUntilHours: 48,
      sourceData: { type: 'fallback', eventId: nextEvent.id },
      action: fb.actionLabels.monitor,
      reportId: topReport?.id || undefined,
      reportSlug: topReportDetail?.slug || undefined,
      reportTitle: topReport?.title || undefined,
    });
  }

  // توصية عامة إذا لم تتوفر توصيات كافية
  if (recommendations.length === 0) {
    recommendations.push({
      recommendationType: 'asset_focus',
      title: `${fb.generic.titlePrefix} ${profile.preferredAssets[0] || (locale === 'ar' ? 'الأسواق المالية' : locale === 'en' ? 'financial markets' : locale === 'fr' ? 'marchés financiers' : locale === 'tr' ? 'finansal piyasalar' : 'mercados financieros')}`,
      summary: fb.generic.summary,
      reasoning: fb.generic.reasoning,
      actionItems: fb.generic.actionItems,
      relatedAssetClasses: profile.preferredAssets.slice(0, 2),
      relatedSymbols: [],
      relatedReportIds: scoredReports.slice(0, 3).map(r => r.id),
      relatedNewsIds: context.recentNews.slice(0, 3).map(n => n.id),
      confidenceScore: 50,
      urgencyLevel: 'low',
      validUntilHours: 48,
      sourceData: { type: 'fallback', reason: 'generic' },
      action: fb.actionLabels.monitor,
    });
  }

  return { recommendations };
}
