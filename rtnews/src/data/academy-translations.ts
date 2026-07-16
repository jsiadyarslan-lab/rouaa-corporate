// ════════════════════════════════════════════════════════════════════
// Academy & Library Translations (V1040)
// ════════════════════════════════════════════════════════════════════
// Locale-aware translation layer for the Arabic-only mock-data.ts.
// Arabic data is the canonical source; this file adds English/French/
// Turkish/Spanish translations for displayed fields:
//   - lesson.title, lesson.duration, lesson.category
//   - term.full, term.description
//   - academyCategory.name
//   - ebook.title, ebook.author, ebook.description, ebook.category
//   - ebook.chapters[].title, ebook.chapters[].summary
//
// Lesson.content and keyPoints remain in Arabic for now — these are only
// shown on the lesson detail page (/XX/academy/lesson/[id]) and are
// long-form educational text (~500 words each). Translating all 32
// lessons × 4 languages = 128 × 500 = 64,000 words of original copy.
// That is out of scope for this fix and would require a separate effort.
// The short display fields (title/category/duration) cover what the user
// sees on the academy listing page and category cards, which is what
// they explicitly asked to translate.

export type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

// ─── Academy Categories ─────────────────────────────────────────────
export const ACADEMY_CATEGORY_NAMES: Record<Locale, Record<string, string>> = {
  ar: {
    forex: 'فوركس',
    technical: 'تحليل فني',
    fundamental: 'تحليل أساسي',
    risk: 'إدارة مخاطر',
    crypto: 'كريبتو',
    commodities: 'سلع',
    strategies: 'استراتيجيات',
    ai: 'ذكاء اصطناعي',
  },
  en: {
    forex: 'Forex',
    technical: 'Technical Analysis',
    fundamental: 'Fundamental Analysis',
    risk: 'Risk Management',
    crypto: 'Crypto',
    commodities: 'Commodities',
    strategies: 'Strategies',
    ai: 'Artificial Intelligence',
  },
  fr: {
    forex: 'Forex',
    technical: 'Analyse Technique',
    fundamental: 'Analyse Fondamentale',
    risk: 'Gestion des Risques',
    crypto: 'Crypto',
    commodities: 'Matières Premières',
    strategies: 'Stratégies',
    ai: 'Intelligence Artificielle',
  },
  tr: {
    forex: 'Forex',
    technical: 'Teknik Analiz',
    fundamental: 'Temel Analiz',
    risk: 'Risk Yönetimi',
    crypto: 'Kripto',
    commodities: 'Emtia',
    strategies: 'Stratejiler',
    ai: 'Yapay Zeka',
  },
  es: {
    forex: 'Forex',
    technical: 'Análisis Técnico',
    fundamental: 'Análisis Fundamental',
    risk: 'Gestión de Riesgos',
    crypto: 'Cripto',
    commodities: 'Materias Primas',
    strategies: 'Estrategias',
    ai: 'Inteligencia Artificial',
  },
};

// ─── Ebook Categories ───────────────────────────────────────────────
// Arabic ebook categories use different keys than academy categories.
// These map ebook.category (Arabic string) → translated string.
export const EBOOK_CATEGORY_NAMES: Record<Locale, Record<string, string>> = {
  ar: {
    'AI تداول': 'AI تداول',
    'تحليل فني': 'تحليل فني',
    'إدارة مخاطر': 'إدارة مخاطر',
    'فوركس': 'فوركس',
    'كريبتو': 'كريبتو',
    'أسواق عربية': 'أسواق عربية',
    'تحليل أساسي': 'تحليل أساسي',
  },
  en: {
    'AI تداول': 'AI Trading',
    'تحليل فني': 'Technical Analysis',
    'إدارة مخاطر': 'Risk Management',
    'فوركس': 'Forex',
    'كريبتو': 'Crypto',
    'أسواق عربية': 'Arab Markets',
    'تحليل أساسي': 'Fundamental Analysis',
  },
  fr: {
    'AI تداول': 'Trading IA',
    'تحليل فني': 'Analyse technique',
    'إدارة مخاطر': 'Gestion des risques',
    'فوركس': 'Forex',
    'كريبتو': 'Crypto',
    'أسواق عربية': 'Marchés arabes',
    'تحليل أساسي': 'Analyse fondamentale',
  },
  tr: {
    'AI تداول': 'AI İşlem',
    'تحليل فني': 'Teknik Analiz',
    'إدارة مخاطر': 'Risk Yönetimi',
    'فوركس': 'Forex',
    'كريبتو': 'Kripto',
    'أسواق عربية': 'Arap Piyasaları',
    'تحليل أساسي': 'Temel Analiz',
  },
  es: {
    'AI تداول': 'Trading IA',
    'تحليل فني': 'Análisis técnico',
    'إدارة مخاطر': 'Gestión de riesgos',
    'فوركس': 'Forex',
    'كريبتو': 'Cripto',
    'أسواق عربية': 'Mercados árabes',
    'تحليل أساسي': 'Análisis fundamental',
  },
};

// ─── Lesson Durations ───────────────────────────────────────────────
export const LESSON_DURATION_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  ar: {
    '15 دقيقة': '15 دقيقة',
    '18 دقيقة': '18 دقيقة',
    '20 دقيقة': '20 دقيقة',
    '22 دقيقة': '22 دقيقة',
    '25 دقيقة': '25 دقيقة',
    '30 دقيقة': '30 دقيقة',
    '35 دقيقة': '35 دقيقة',
  },
  en: {
    '15 دقيقة': '15 min',
    '18 دقيقة': '18 min',
    '20 دقيقة': '20 min',
    '22 دقيقة': '22 min',
    '25 دقيقة': '25 min',
    '30 دقيقة': '30 min',
    '35 دقيقة': '35 min',
  },
  fr: {
    '15 دقيقة': '15 min',
    '18 دقيقة': '18 min',
    '20 دقيقة': '20 min',
    '22 دقيقة': '22 min',
    '25 دقيقة': '25 min',
    '30 دقيقة': '30 min',
    '35 دقيقة': '35 min',
  },
  tr: {
    '15 دقيقة': '15 dk',
    '18 دقيقة': '18 dk',
    '20 دقيقة': '20 dk',
    '22 دقيقة': '22 dk',
    '25 دقيقة': '25 dk',
    '30 دقيقة': '30 dk',
    '35 دقيقة': '35 dk',
  },
  es: {
    '15 دقيقة': '15 min',
    '18 دقيقة': '18 min',
    '20 دقيقة': '20 min',
    '22 دقيقة': '22 min',
    '25 دقيقة': '25 min',
    '30 دقيقة': '30 min',
    '35 دقيقة': '35 min',
  },
};

// ─── Lesson Titles ──────────────────────────────────────────────────
export const LESSON_TITLES: Record<string, Record<Locale, string>> = {
  l1: {
    ar: 'مقدمة في سوق الفوركس',
    en: 'Introduction to the Forex Market',
    fr: 'Introduction au Marché des Changes',
    tr: 'Forex Piyasasına Giriş',
    es: 'Introducción al Mercado Forex',
  },
  l2: {
    ar: 'آلية تداول العملات',
    en: 'Currency Trading Mechanics',
    fr: 'Mécanique du Trading de Devises',
    tr: 'Döviz İşlem Mekanizması',
    es: 'Mecánica del Trading de Divisas',
  },
  l3: {
    ar: 'فهم أزواج العملات والأسعار',
    en: 'Understanding Currency Pairs and Prices',
    fr: 'Comprendre les Paires de Devises et les Prix',
    tr: 'Döviz Çiftleri ve Fiyatları Anlama',
    es: 'Comprensión de Pares de Divisas y Precios',
  },
  l4: {
    ar: 'ساعات التداول وأفضل الأوقات',
    en: 'Trading Hours and Best Times',
    fr: 'Heures de Trading et Meilleurs Moments',
    tr: 'İşlem Saatleri ve En İyi Zamanlar',
    es: 'Horarios de Trading y Mejores Momentos',
  },
  l5: {
    ar: 'حساب الأرباح والخسائر في الفوركس',
    en: 'Calculating Forex Profit and Loss',
    fr: 'Calculer les Profits et Pertes en Forex',
    tr: 'Forexte Kar ve Zarar Hesaplama',
    es: 'Cálculo de Ganancias y Pérdidas en Forex',
  },
  l6: {
    ar: 'أساسيات التحليل الفني',
    en: 'Technical Analysis Fundamentals',
    fr: 'Fondamentaux de l\'Analyse Technique',
    tr: 'Teknik Analiz Temelleri',
    es: 'Fundamentos del Análisis Técnico',
  },
  l7: {
    ar: 'قراءة الشموع اليابانية',
    en: 'Reading Japanese Candlesticks',
    fr: 'Lire les Bougies Japonaises',
    tr: 'Japon Mumlarını Okuma',
    es: 'Lectura de Velas Japonesas',
  },
  l8: {
    ar: 'مؤشر RSI وكيفية استخدامه',
    en: 'The RSI Indicator and How to Use It',
    fr: 'L\'Indicateur RSI et Comment l\'Utiliser',
    tr: 'RSI Göstergesi ve Kullanımı',
    es: 'El Indicador RSI y Cómo Usarlo',
  },
  l9: {
    ar: 'مؤشر MACD وتطبيقاته',
    en: 'The MACD Indicator and Its Applications',
    fr: 'L\'Indicateur MACD et ses Applications',
    tr: 'MACD Göstergesi ve Uygulamaları',
    es: 'El Indicador MACD y sus Aplicaciones',
  },
  l10: {
    ar: 'أنماط الرسوم البيانية الرئيسية',
    en: 'Key Chart Patterns',
    fr: 'Principaux Motifs Graphiques',
    tr: 'Temel Grafik Formasyonları',
    es: 'Patrones Clave de Gráficos',
  },
  l11: {
    ar: 'ما هو التحليل الأساسي؟',
    en: 'What is Fundamental Analysis?',
    fr: 'Qu\'est-ce que l\'Analyse Fondamentale ?',
    tr: 'Temel Analiz Nedir?',
    es: '¿Qué es el Análisis Fundamental?',
  },
  l12: {
    ar: 'تأثير بيانات التوظيف على الأسواق',
    en: 'Impact of Employment Data on Markets',
    fr: 'Impact des Données d\'Emploi sur les Marchés',
    tr: 'İstihdam Verilerinin Piyasalara Etkisi',
    es: 'Impacto de los Datos de Empleo en los Mercados',
  },
  l13: {
    ar: 'قرارات الفائدة وتأثيرها على العملات',
    en: 'Interest Rate Decisions and Currency Impact',
    fr: 'Décisions de Taux d\'Intérêt et Impact sur les Devises',
    tr: 'Faiz Kararları ve Döviz Etkisi',
    es: 'Decisiones de Tasas de Interés y su Impacto en Divisas',
  },
  l14: {
    ar: 'مؤشر CPI وأثره على التداول',
    en: 'The CPI Indicator and Its Trading Impact',
    fr: 'L\'Indicateur CPI et son Impact sur le Trading',
    tr: 'CPI Göstergesi ve İşlem Etkisi',
    es: 'El Indicador CPI y su Impacto en el Trading',
  },
  l15: {
    ar: 'تحليل البيانات الاقتصادية الكبرى',
    en: 'Analyzing Major Economic Data',
    fr: 'Analyser les Principales Données Économiques',
    tr: 'Büyük Ekonomik Verileri Analiz Etme',
    es: 'Análisis de Datos Económicos Mayores',
  },
  l16: {
    ar: 'أساسيات إدارة المخاطر',
    en: 'Risk Management Fundamentals',
    fr: 'Fondamentaux de la Gestion des Risques',
    tr: 'Risk Yönetimi Temelleri',
    es: 'Fundamentos de Gestión de Riesgos',
  },
  l17: {
    ar: 'وقف الخسارة وجني الأرباح',
    en: 'Stop Loss and Take Profit',
    fr: 'Stop Loss et Take Profit',
    tr: 'Zarar Durdur ve Kar Al',
    es: 'Stop Loss y Take Profit',
  },
  l18: {
    ar: 'حجم الصفقة وإدارة رأس المال',
    en: 'Position Sizing and Capital Management',
    fr: 'Dimensionnement des Positions et Gestion du Capital',
    tr: 'Pozisyon Büyüklüğü ve Sermaye Yönetimi',
    es: 'Tamaño de Posición y Gestión de Capital',
  },
  l19: {
    ar: 'نسبة المخاطرة إلى العائد',
    en: 'Risk-to-Reward Ratio',
    fr: 'Ratio Risque-Rendement',
    tr: 'Risk-Ödül Oranı',
    es: 'Relación Riesgo-Beneficio',
  },
  l20: {
    ar: 'مقدمة في العملات الرقمية',
    en: 'Introduction to Cryptocurrencies',
    fr: 'Introduction aux Cryptomonnaies',
    tr: 'Kripto Para Girişi',
    es: 'Introducción a las Criptomonedas',
  },
  l21: {
    ar: 'تداول البيتكوين والعملات الرئيسية',
    en: 'Trading Bitcoin and Major Cryptocurrencies',
    fr: 'Trader le Bitcoin et les Principales Cryptos',
    tr: 'Bitcoin ve Ana Kripto Para İşlemleri',
    es: 'Trading de Bitcoin y Criptomonedas Principales',
  },
  l22: {
    ar: 'تحليل سوق الكريبتو',
    en: 'Crypto Market Analysis',
    fr: 'Analyse du Marché Crypto',
    tr: 'Kripto Piyasa Analizi',
    es: 'Análisis del Mercado Cripto',
  },
  l23: {
    ar: 'تداول الذهب للمبتدئين',
    en: 'Gold Trading for Beginners',
    fr: 'Trading de l\'Or pour les Débutants',
    tr: 'Yeni Başlayanlar için Altın İşlemleri',
    es: 'Trading de Oro para Principiantes',
  },
  l24: {
    ar: 'النفط وأسواق الطاقة',
    en: 'Oil and Energy Markets',
    fr: 'Pétrole et Marchés de l\'Énergie',
    tr: 'Petrol ve Enerji Piyasaları',
    es: 'Petróleo y Mercados de Energía',
  },
  l25: {
    ar: 'العلاقة بين الدولار والسلع',
    en: 'The Dollar-Commodities Relationship',
    fr: 'La Relation Dollar-Matières Premières',
    tr: 'Dolar-Emtia İlişkisi',
    es: 'La Relación Dolar-Materias Primas',
  },
  l26: {
    ar: 'استراتيجية التداول مع الاتجاه',
    en: 'Trend Following Trading Strategy',
    fr: 'Stratégie de Trading Suivi de Tendance',
    tr: 'Trend Takibi İşlem Stratejisi',
    es: 'Estrategia de Trading Seguir Tendencia',
  },
  l27: {
    ar: 'استراتيجية Breakout',
    en: 'Breakout Strategy',
    fr: 'Stratégie de Breakout',
    tr: 'Breakout Stratejisi',
    es: 'Estrategia de Breakout',
  },
  l28: {
    ar: 'التداول السوينغي',
    en: 'Swing Trading',
    fr: 'Trading Swing',
    tr: 'Swing Trading',
    es: 'Trading Swing',
  },
  l29: {
    ar: 'استراتيجية Scalping',
    en: 'Scalping Strategy',
    fr: 'Stratégie de Scalping',
    tr: 'Scalping Stratejisi',
    es: 'Estrategia de Scalping',
  },
  l30: {
    ar: 'الذكاء الاصطناعي في التداول',
    en: 'Artificial Intelligence in Trading',
    fr: 'L\'Intelligence Artificielle dans le Trading',
    tr: 'İşlemde Yapay Zeka',
    es: 'Inteligencia Artificial en el Trading',
  },
  l31: {
    ar: 'كيف يقرأ AI الأسواق المالية',
    en: 'How AI Reads Financial Markets',
    fr: 'Comment l\'IA Lit les Marchés Financiers',
    tr: 'AI Finansal Piyasaları Nasıl Okur',
    es: 'Cómo la IA Lee los Mercados Financieros',
  },
  l32: {
    ar: 'بناء استراتيجية تداول مدعومة بالذكاء الاصطناعي',
    en: 'Building an AI-Powered Trading Strategy',
    fr: 'Construire une Stratégie de Trading Assistée par IA',
    tr: 'AI Destekli İşlem Stratejisi Oluşturma',
    es: 'Construir una Estrategia de Trading con IA',
  },
};

// ─── Financial Term Full Names ──────────────────────────────────────
export const TERM_FULL_NAMES: Record<string, Record<Locale, string>> = {
  NFP: {
    ar: 'بيانات التوظيف غير الزراعية',
    en: 'Non-Farm Payrolls',
    fr: 'Emplois Non Agricoles',
    tr: 'Tarım Dışı İstihdam',
    es: 'Nóminas No Agrícolas',
  },
  CPI: {
    ar: 'مؤشر أسعار المستهلكين',
    en: 'Consumer Price Index',
    fr: 'Indice des Prix à la Consommation',
    tr: 'Tüketici Fiyat Endeksi',
    es: 'Índice de Precios al Consumidor',
  },
  FOMC: {
    ar: 'اللجنة الفيدرالية للسوق المفتوحة',
    en: 'Federal Open Market Committee',
    fr: 'Comité Federal de Marché Ouvert',
    tr: 'Federal Açık Piyasa Komitesi',
    es: 'Comité Federal de Mercado Abierto',
  },
  GDP: {
    ar: 'الناتج المحلي الإجمالي',
    en: 'Gross Domestic Product',
    fr: 'Produit Intérieur Brut',
    tr: 'Gayri Safi Yurt İçi Hasıla',
    es: 'Producto Interno Bruto',
  },
  DXY: {
    ar: 'مؤشر الدولار الأمريكي',
    en: 'US Dollar Index',
    fr: 'Indice du Dollar Américain',
    tr: 'ABD Dolar Endeksi',
    es: 'Índice del Dólar Estadounidense',
  },
  PMI: {
    ar: 'مؤشر مديري المشتريات',
    en: 'Purchasing Managers Index',
    fr: 'Indice des Directeurs d\'Achat',
    tr: 'Satın Alma Yöneticileri Endeksi',
    es: 'Índice de Gestores de Compras',
  },
  VIX: {
    ar: 'مؤشر التقلب',
    en: 'Volatility Index',
    fr: 'Indice de Volatilité',
    tr: 'Oynaklık Endeksi',
    es: 'Índice de Volatilidad',
  },
  RSI: {
    ar: 'مؤشر القوة النسبية',
    en: 'Relative Strength Index',
    fr: 'Indice de Force Relative',
    tr: 'Göreceli Güç Endeksi',
    es: 'Índice de Fuerza Relativa',
  },
  MACD: {
    ar: 'تقارب وتباعد المتوسطات المتحركة',
    en: 'Moving Average Convergence Divergence',
    fr: 'Convergence Divergence des Moyennes Mobiles',
    tr: 'Hareketli Ortalama Yakınsama Iraksama',
    es: 'Convergencia Divergencia de Medias Móviles',
  },
  EPS: {
    ar: 'ربحية السهم',
    en: 'Earnings Per Share',
    fr: 'Bénéfice Par Action',
    tr: 'Hisse Başına Kazanç',
    es: 'Beneficios Por Acción',
  },
  'P/E': {
    ar: 'نسبة السعر إلى الأرباح',
    en: 'Price-to-Earnings Ratio',
    fr: 'Ratio Prix-Bénéfice',
    tr: 'Fiyat-Kazanç Oranı',
    es: 'Ratio Precio-Ganancias',
  },
  Spread: {
    ar: 'السبريد أو الفارق السعري',
    en: 'Bid-Ask Spread',
    fr: 'Spread (Écart Acheteur-Vendeur)',
    tr: 'Spread (Alış-Satış Farkı)',
    es: 'Spread (Diferencial Comprador-Vendedor)',
  },
  Leverage: {
    ar: 'الرافعة المالية',
    en: 'Leverage',
    fr: 'Effet de Levier',
    tr: 'Kaldıraç',
    es: 'Apalancamiento',
  },
  'Stop Loss': {
    ar: 'أمر وقف الخسارة',
    en: 'Stop Loss Order',
    fr: 'Ordre Stop Loss',
    tr: 'Zarar Durdur Emri',
    es: 'Orden Stop Loss',
  },
  Margin: {
    ar: 'الهامش أو الهامش المطلوب',
    en: 'Margin (Required Margin)',
    fr: 'Marge (Marge Requise)',
    tr: 'Teminat (Gerekli Teminat)',
    es: 'Margen (Margen Requerido)',
  },
};

// ─── Financial Term Descriptions ────────────────────────────────────
export const TERM_DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  NFP: {
    ar: 'تقرير شهري تصدره وزارة العمل الأمريكية يوضح عدد الوظائف الجديدة المضافة في القطاعات غير الزراعية. يُعد من أقوى المحركات السوقية حيث يؤثر مباشرة على سعر الدولار وأسعار الفائدة المتوقعة. قراءة أعلى من المتوقع تعزز الدولار، بينما قراءة أقل تضعفه.',
    en: 'A monthly report issued by the US Department of Labor showing the number of new jobs added in non-agricultural sectors. It is one of the strongest market drivers as it directly affects the dollar price and expected interest rates. A higher-than-expected reading strengthens the dollar, while a lower reading weakens it.',
    fr: 'Un rapport mensuel publié par le Département du Travail américain indiquant le nombre de nouveaux emplois ajoutés dans les secteurs non agricoles. C\'est l\'un des moteurs de marché les plus puissants car il affecte directement le prix du dollar et les taux d\'intérêt attendus. Une lecture supérieure aux attentes renforce le dollar, tandis qu\'une lecture inférieure l\'affaiblit.',
    tr: 'ABD Çalışma Bakanlığı tarafından yayımlanan ve tarım dışı sektörlerde eklenen yeni iş sayısını gösteren aylık bir rapordur. Dolar fiyatını ve beklenen faiz oranlarını doğrudan etkilediği için en güçlü piyasa itici güçlerinden biridir. Beklenenden yüksek bir okuma doları güçlendirirken, düşük bir okuma zayıflatır.',
    es: 'Un informe mensual emitido por el Departamento de Trabajo de EE.UU. que muestra el número de nuevos empleos añadidos en sectores no agrícolas. Es uno de los impulsores de mercado más potentes ya que afecta directamente el precio del dólar y las tasas de interés esperadas. Una lectura superior a lo esperado fortalece el dólar, mientras que una inferior lo debilita.',
  },
  CPI: {
    ar: 'مؤشر يقيس التغير في مستوى أسعار السلع والخدمات الاستهلاكية عبر الزمن، وهو المقياس الرئيسي للتضخم. ارتفاع CPI يعني تضخماً أعلى مما قد يدفع البنك المركزي لرفع الفائدة، مما يدعم العملة. انخفاضه يشير لتباطؤ تضخمي قد يؤدي لخفض الفائدة.',
    en: 'An index measuring the change in the price level of consumer goods and services over time — the primary inflation gauge. A rising CPI means higher inflation, which may push the central bank to raise interest rates and support the currency. A falling CPI indicates slowing inflation that may lead to rate cuts.',
    fr: 'Un indice mesurant l\'évolution du niveau des prix des biens et services de consommation dans le temps — la principale mesure de l\'inflation. Une hausse du CPI signifie une inflation plus élevée, ce qui peut pousser la banque centrale à augmenter les taux et soutenir la monnaie. Une baisse indique un ralentissement de l\'inflation pouvant entraîner des baisses de taux.',
    tr: 'Zaman içinde tüketim malları ve hizmetlerinin fiyat düzeyindeki değişimi ölçen bir endekstir — ana enflasyon göstergesi. Yükselen CPI, daha yüksek enflasyon anlamına gelir ve bu da merkez bankasını faiz artırmaya ve parayı desteklemeye itebilir. Düşen CPI, faiz indirimlerine yol açabilecek yavaşlayan enflasyonu gösterir.',
    es: 'Un índice que mide el cambio en el nivel de precios de bienes y servicios de consumo a lo largo del tiempo — la principal medida de inflación. Un IPC en alza significa mayor inflación, lo que puede llevar al banco central a subir tasas y apoyar la moneda. Una baja del IPC indica inflación desacelerada que puede llevar a recortes de tasas.',
  },
  FOMC: {
    ar: 'الذراع المسؤول عن السياسة النقدية في الاحتياطي الفيدرالي الأمريكي، تصدر قراراتها 8 مرات سنوياً. تقرر اللجنة رفع أو خفض أو تثبيت سعر الفائدة، وكل قرار يهز الأسواق العالمية. تصريحات الرئيس والبيان المصاحب تحدد توجه الدولار للأسابيع القادمة.',
    en: 'The arm of the US Federal Reserve responsible for monetary policy, issuing decisions 8 times a year. The committee decides to raise, cut, or hold the interest rate, and each decision shakes global markets. The Chair\'s statements and the accompanying statement set the dollar\'s direction for the coming weeks.',
    fr: 'La branche de la Réserve Fédérale américaine responsable de la politique monétaire, publiant ses décisions 8 fois par an. Le comité décide d\'augmenter, réduire ou maintenir le taux d\'intérêt, et chaque décision ébranle les marchés mondiaux. Les déclarations du Président et le communiqué accompagnant déterminent la direction du dollar pour les semaines à venir.',
    tr: 'ABD Federal Rezervi\'nde para politikasından sorumlu olan koldur ve kararlarını yılda 8 kez açıklar. Komite faiz oranını yükseltmeye, düşürmeye veya sabit tutmaya karar verir ve her karar küresel piyasaları sarsar. Başkanın açıklamaları ve eşlik eden bildiri doların önümüzdeki haftalardaki yönünü belirler.',
    es: 'El brazo de la Reserva Federal de EE.UU. responsable de la política monetaria, emitiendo decisiones 8 veces al año. El comité decide subir, bajar o mantener la tasa de interés, y cada decisión sacude los mercados mundiales. Las declaraciones del Presidente y el comunicado adjunto establecen la dirección del dólar para las semanas venideras.',
  },
  GDP: {
    ar: 'إجمالي قيمة السلع والخدمات المنتجة في بلد ما خلال فترة زمنية محددة. الناتج المحلي هو المؤشر الأشمل لصحة الاقتصاد، فنمو إيجابي يعزز العملة ويشجع الاستثمار، بينما انكماشGDP يشير لركود محتمل ويضعف الثقة بالعملة والأسواق.',
    en: 'The total value of goods and services produced in a country over a specific period. GDP is the broadest indicator of economic health — positive growth strengthens the currency and encourages investment, while a contracting GDP signals potential recession and weakens confidence in the currency and markets.',
    fr: 'La valeur totale des biens et services produits dans un pays sur une période donnée. Le PIB est l\'indicateur le plus large de la santé économique — une croissance positive renforce la monnaie et encourage l\'investissement, tandis qu\'un PIB en contraction signale une récession potentielle et affaiblit la confiance dans la monnaie et les marchés.',
    tr: 'Bir ülkenin belirli bir dönemde ürettiği mal ve hizmetlerin toplam değeridir. GSYİH, ekonomik sağlığın en kapsamlı göstergesidir — pozitif büyüme para birimini güçlendirir ve yatırımı teşvik ederken, daralan GSYİHA potansiyel durgunluğu gösterir ve para birimi ile piyasalara güveni zayıflatır.',
    es: 'El valor total de bienes y servicios producidos en un país durante un período específico. El PIB es el indicador más amplio de la salud económica — un crecimiento positivo fortalece la moneda y fomenta la inversión, mientras que un PIB contraído señala recesión potencial y debilita la confianza en la moneda y los mercados.',
  },
  DXY: {
    ar: 'مؤشر يقيس قوة الدولار الأمريكي مقابل سلة من ست عملات رئيسية تشمل اليورو والين والجنيه الإسترليني. ارتفاع DXY يعني قوة الدولار مقابل المنافسين، وانخفاضه يعني ضعفه. يتأثر بقرارات الفائدة وبيانات التضخم ومؤشرات سوق العمل.',
    en: 'An index measuring the strength of the US dollar against a basket of six major currencies including the euro, yen, and British pound. A rising DXY means a stronger dollar against competitors, and a falling one means weakness. It is affected by interest rate decisions, inflation data, and labor market indicators.',
    fr: 'Un indice mesurant la force du dollar américain contre un panier de six devises principales dont l\'euro, le yen et la livre sterling. Un DXY en hausse signifie un dollar plus fort face aux concurrents, et une baisse signifie une faiblesse. Il est affecté par les décisions de taux, les données d\'inflation et les indicateurs du marché du travail.',
    tr: 'ABD dolarının euro, yen ve İngiliz sterlini dahil altı büyük döviz sepetine karşı gücünü ölçen bir endekstir. Yükselen DXY, dollara rakipleri karşı daha güçlü olduğu anlamına gelir, düşen ise zayıflık anlamına gelir. Faiz kararları, enflasyon verileri ve işgücü piyasası göstergelerinden etkilenir.',
    es: 'Un índice que mide la fuerza del dólar estadounidense contra una canasta de seis divisas principales incluyendo el euro, el yen y la libra esterlina. Un DXY en alza significa un dólar más fuerte frente a competidores, y una baja significa debilidad. Se ve afectado por decisiones de tasas, datos de inflación e indicadores del mercado laboral.',
  },
  PMI: {
    ar: 'مؤشر رائد يقيس نشاط القطاع التصنيعي أو الخدمي من خلال استبيان مديري المشتريات. قراءة فوق 50 تعني توسعاً اقتصادياً، وقراءة تحت 50 تعني انكماضاً. يُعد من أقدم المؤشرات الصادرة لذا يُستخدم لتوقع اتجاه الاقتصاد قبل البيانات الرسمية.',
    en: 'A leading index measuring activity in the manufacturing or services sector via a survey of purchasing managers. A reading above 50 means economic expansion, and below 50 means contraction. It is one of the earliest indicators released, so it is used to forecast economic direction ahead of official data.',
    fr: 'Un indice avancé mesurant l\'activité du secteur manufacturier ou des services via une enquête auprès des directeurs d\'achat. Une lecture au-dessus de 50 signifie une expansion économique, et en dessous de 50 une contraction. C\'est l\'un des premiers indicateurs publiés, utilisé pour prévoir la direction économique avant les données officielles.',
    tr: 'Satın alma yöneticilerinin anketi yoluyla imalat veya hizmet sektöründeki aktiviteyi ölçen öncü bir endekstir. 50\'nin üzerindeki bir okuma ekonomik genişleme, altısındaysa daralma anlamına gelir. Yayınlanan en eski göstergelerden biri olduğu için resmi verilerden önce ekonomik yönü tahmin etmek için kullanılır.',
    es: 'Un índice adelantado que mide la actividad del sector manufacturero o de servicios mediante una encuesta a gestores de compras. Una lectura sobre 50 significa expansión económica, y bajo 50 significa contracción. Es uno de los primeros indicadores publicados, usado para predecir la dirección económica antes de los datos oficiales.',
  },
  VIX: {
    ar: 'مؤشر يُعرف بمقياس الخوف في السوق، يحسب التقلب المتوقع في مؤشر S&P 500 خلال الثلاثين يوماً القادمة. ارتفاع VIX فوق 25 يشير لخوف متزايد وبيئة بيعية، بينما قراءة تحت 15 تعني اطمئناناً وبيئة شرائية. المتداولون يستخدمونه كمؤشر عاطفي معاكس.',
    en: 'An index known as the market\'s fear gauge, calculating expected volatility in the S&P 500 over the next 30 days. A VIX above 25 indicates growing fear and a bearish environment, while a reading below 15 means calm and a bullish environment. Traders use it as a contrarian sentiment indicator.',
    fr: 'Un indice connu comme la jauge de peur du marché, calculant la volatilité attendue du S&P 500 sur les 30 prochains jours. Un VIX au-dessus de 25 indique une peur croissante et un environnement baissier, tandis qu\'une lecture sous 15 signifie le calme et un environnement haussier. Les traders l\'utilisent comme indicateur de sentiment contrarien.',
    tr: 'Piyasanın korku ölçer olarak bilinen bir endekstir ve önümüzdeki 30 günde S&P 500\'te beklenen oynaklığı hesaplar. VIX\'in 25\'in üzerinde olması artan korku ve düşüşçi bir ortam gösterirken, 15\'in altındaki bir okuma sakinlik ve yükselişçi bir ortam anlamına gelir. İşlemciler onu aksi yönlü duygu göstergesi olarak kullanır.',
    es: 'Un índice conocido como el medidor de miedo del mercado, calculando la volatilidad esperada del S&P 500 en los próximos 30 días. Un VIX por encima de 25 indica miedo creciente y un entorno bajista, mientras que una lectura bajo 15 significa calma y un entorno alcista. Los traders lo usan como indicador de sentimiento contrario.',
  },
  RSI: {
    ar: 'مؤشر زخري يتأرجح بين 0 و100 يقيس سرعة وحجم حركات السعر الأخيرة. قراءة فوق 70 تشير لشراء مبالغ فيه (تشبع شرائي) وقد تنذر بتصحيح هبوطي، وقراءة تحت 30 تشير لبيع مبالغ فيه (تشبع بيعي) وقد تنذر بارتداد صعودي. يستخدمه المتداولون لتأكيد انعكاسات الاتجاه.',
    en: 'A momentum oscillator oscillating between 0 and 100 that measures the speed and magnitude of recent price movements. A reading above 70 indicates excessive buying (overbought) and may signal a downward correction, while below 30 indicates excessive selling (oversold) and may signal an upward bounce. Traders use it to confirm trend reversals.',
    fr: 'Un oscillateur de momentum oscillant entre 0 et 100 qui mesure la vitesse et l\'ampleur des récents mouvements de prix. Une lecture au-dessus de 70 indique un achat excessif (surachat) et peut signaler une correction baissière, tandis qu\'en dessous de 30 indique une vente excessive (survente) et peut signaler un rebond haussier. Les traders l\'utilisent pour confirmer les renversements de tendance.',
    tr: '0 ile 100 arasında salınan ve son fiyat hareketlerinin hızını ve büyüklüğünü ölçen bir momentum osilatörüdür. 70\'in üzerindeki bir okuma aşırı alım (aşırı alım) gösterir ve düşüş düzeltmesi sinyali verebilirken, 30\'un altındaki okuma aşırı satım (aşırı satım) gösterir ve yukarı dönüş sinyali verebilir. İşlemciler trend dönüşlerini doğrulamak için kullanır.',
    es: 'Un oscilador de momentum que oscila entre 0 y 100 que mide la velocidad y magnitud de los movimientos de precio recientes. Una lectura sobre 70 indica compra excesiva (sobrecompra) y puede señalar una corrección bajista, mientras que bajo 30 indica venta excesiva (sobreventa) y puede señalar un rebote alcista. Los traders lo usan para confirmar reversiones de tendencia.',
  },
  MACD: {
    ar: 'مؤشر يتبع الاتجاه يجمع بين خصائص تتبع الاتجاه ومؤشرات الزخم. يتكون من خط MACD وخط الإشارة والمدرج التكراري. تقاطع خط MACD فوق خط الإشارة إشارة شراء، والعكس إشارة بيع. المدرج التكراري يوضح قوة الاتجاه ويُستخدم لتأكيد الزخم.',
    en: 'A trend-following indicator combining trend-following and momentum properties. It consists of the MACD line, the signal line, and the histogram. A MACD line crossing above the signal line is a buy signal, and the opposite is a sell signal. The histogram shows trend strength and is used to confirm momentum.',
    fr: 'Un indicateur de suivi de tendance combinant les propriétés de suivi de tendance et de momentum. Il se compose de la ligne MACD, de la ligne de signal et de l\'histogramme. Un croisement de la ligne MACD au-dessus de la ligne de signal est un signal d\'achat, et l\'inverse est un signal de vente. L\'histogramme montre la force de la tendance et confirme le momentum.',
    tr: 'Trend takibi ve momentum özelliklerini birleştiren trend takip eden bir göstergedir. MACD çizgisinden, sinyal çizgisinden ve histogramdan oluşur. MACD çizgisinin sinyal çizgisinin üstüne kesmesi bir alım sinyalidir, tersi bir satış sinyalidir. Histogram trend gücünü gösterir ve momentumu doğrulamak için kullanılır.',
    es: 'Un indicador seguidor de tendencia que combina propiedades de seguimiento de tendencia y momentum. Consiste en la línea MACD, la línea de señal y el histograma. Un cruce de la línea MACD por encima de la línea de señal es una señal de compra, y lo contrario es una señal de venta. El histograma muestra la fuerza de la tendencia y se usa para confirmar el momentum.',
  },
  EPS: {
    ar: 'صافي ربح الشركة مقسوماً على عدد أسهمها المصدرة. EPS هو مقياس أساسي لربحية الشركة ويُستخدم في حساب نسبة P/E. ارتفاع EPS عن التوقعات يدفع السهم للصعود عادةً، وانخفاضه يُضعف الثقة ويسبب هبوطاً. يتتبعه المحللون الأساسيون كل ربع سنة.',
    en: 'A company\'s net profit divided by its outstanding shares. EPS is a fundamental measure of profitability used to calculate the P/E ratio. An EPS beating expectations usually pushes the stock up, and a miss weakens confidence and causes declines. Fundamental analysts track it every quarter.',
    fr: 'Le bénéfice net d\'une entreprise divisé par le nombre d\'actions en circulation. Le BPA est une mesure fondamentale de la rentabilité utilisée pour calculer le ratio P/B. Un BPA dépassant les attentes pousse généralement l\'action à la hausse, et un échec affaiblit la confiance et provoque des baisses. Les analystes fondamentaux le suivent chaque trimestre.',
    tr: 'Bir şirketin net kârının ihraç edilen hisse sayısına bölünmesiyle elde edilir. EPS, kârlılığın temel bir ölçüsüdür ve F/K oranı hesaplamada kullanılır. Beklentileri aşan bir EPS genellikle hisseyi yukarı iter, düşük olması güveni zayıflatır ve düşüşlere neden olur. Temel analistler her çeyrekte takip eder.',
    es: 'El beneficio neto de una empresa dividido por sus acciones en circulación. El BPA es una medida fundamental de rentabilidad usada para calcular el ratio P/G. Un BPA que supera expectativas usualmente impulsa la acción al alza, y un fallo debilita la confianza y causa caídas. Los analistas fundamentales lo siguen cada trimestre.',
  },
  'P/E': {
    ar: 'نسبة سعر السهم الحالي إلى ربحية السهم السنوية. P/E منخفض قد يعني أن السهم مُقيّم بأقل من قيمته (فرصة شراء)، وP/E مرتفع قد يعني تقييماً مبالغاً فيه أو توقعات نمو مرتفعة. يُستخدم لمقارنة تقييم الشركات في نفس القطاع.',
    en: 'The ratio of a stock\'s current price to its annual earnings per share. A low P/E may mean the stock is undervalued (a buying opportunity), and a high P/E may mean overvaluation or high growth expectations. It is used to compare valuations of companies in the same sector.',
    fr: 'Le ratio du prix actuel d\'une action par rapport à son bénéfice annuel par action. Un P/B bas peut signifier que l\'action est sous-évaluée (une opportunité d\'achat), et un P/B élevé peut signifier surévaluation ou fortes attentes de croissance. Il est utilisé pour comparer les valorisations des entreprises du même secteur.',
    tr: 'Bir hisse senedinin güncel fiyatının yıllık hisse başına kârına oranı. Düşük F/K hissenin düşük değerlendiği (alım fırsatı) anlamına gelebilir, yüksek F/K aşırı değerleme veya yüksek büyüme beklentileri anlamına gelebilir. Aynı sektördeki şirketlerin değerlemelerini karşılaştırmak için kullanılır.',
    es: 'El ratio del precio actual de una acción respecto a su beneficio anual por acción. Un P/G bajo puede significar que la acción está infravalorada (una oportunidad de compra), y un P/G alto puede significar sobrevaloración o altas expectativas de crecimiento. Se usa para comparar valoraciones de empresas del mismo sector.',
  },
  Spread: {
    ar: 'الفرق بين سعر الطلب (Ask) وسعر العرض (Bid) لأي أداة مالية. السبريد هو تكلفة التداول الرئيسية عند الوسطاء، فكلما كان أضيق كان التداول أرخص. أزواج العملات الرئيسية مثل EUR/USD لديها سبريد ضيق، بينما الأزواج النادرة سبريدها أوسع.',
    en: 'The difference between the Ask and Bid price of any financial instrument. The spread is the main trading cost at brokers — the narrower it is, the cheaper the trading. Major currency pairs like EUR/USD have a tight spread, while exotic pairs have wider spreads.',
    fr: 'La différence entre le prix Ask et Bid de tout instrument financier. Le spread est le principal coût de trading chez les courtiers — plus il est serré, moins cher est le trading. Les principales paires de devises comme EUR/USD ont un spread serré, tandis que les paires exotiques ont des spreads plus larges.',
    tr: 'Herhangi bir finansal enstrümanın Alış ve Satış fiyatı arasındaki farktır. Spread, aracılarda ana işlem maliyetidir — ne kadar dar olursa işlem o kadar ucuzdur. EUR/USD gibi ana döviz çiftleri dar spreade sahipken, egzotik çiftler daha geniş spreadlere sahiptir.',
    es: 'La diferencia entre el precio Ask y Bid de cualquier instrumento financiero. El spread es el principal costo de trading en los brókers — cuanto más estrecho sea, más barato el trading. Los principales pares de divisas como EUR/USD tienen un spread estrecho, mientras que los pares exóticos tienen spreads más amplios.',
  },
  Leverage: {
    ar: 'أداة تتيح للمتداول التحكم بمبلغ أكبر من رأس ماله الفعلي. رافعة 1:100 تعني أن كل دولار واحد يتحكم بمركز بقيمة 100 دولار. الرافعة تضاعف الأرباح والخسائر معاً، لذا إدارتها بحذر ضرورية. المبتدئون ينصحون برافعة منخفضة لا تتجاوز 1:10.',
    en: 'A tool that allows a trader to control a larger amount than their actual capital. A 1:100 leverage means that every $1 controls a position worth $100. Leverage magnifies both profits and losses, so managing it carefully is essential. Beginners are advised to use low leverage not exceeding 1:10.',
    fr: 'Un outil permettant à un trader de contrôler un montant supérieur à son capital réel. Un levier de 1:100 signifie que chaque 1 $ contrôle une position de 100 $. L\'effet de levier amplifie les profits et les pertes, donc une gestion prudente est essentielle. Les débutants sont conseillés d\'utiliser un levier faible ne dépassant pas 1:10.',
    tr: 'Bir işlecinin gerçek sermayesinden daha büyük bir tutarı kontrol etmesine olanak tanıyan bir araçtır. 1:100 kaldıraç, her 1$\'ın 100$ değerinde bir pozisyonu kontrol ettiği anlamına gelir. Kaldıraç hem kârı hem zararı büyütür, bu yüzden dikkatli yönetim esastır. Yeni başlayanlara 1:10\'u aşmayan düşük kaldıraç kullanmaları önerilir.',
    es: 'Una herramienta que permite a un trader controlar un monto mayor que su capital real. Un apalancamiento de 1:100 significa que cada $1 controla una posición de $100. El apalancamiento amplifica tanto las ganancias como las pérdidas, por lo que gestionarlo con cuidado es esencial. Se aconseja a los principiantes usar apalancamiento bajo que no exceda 1:10.',
  },
  'Stop Loss': {
    ar: 'أمر تلقائي يغلق الصفقة عند وصول السعر لمستوى محدد مسبقاً للحد من الخسائر. وقف الخسارة هو خط الدفاع الأول لحماية رأس المال، وعدم استخدامه يعرض الحساب لخسائر قد تكون كارثية. يُحدد عادةً بنسبة 1-2% من رأس المال كحد أقصى للخسارة.',
    en: 'An automatic order that closes a trade when the price reaches a pre-specified level to limit losses. Stop loss is the first line of defense to protect capital, and not using it exposes the account to potentially catastrophic losses. It is usually set at 1-2% of capital as the maximum loss.',
    fr: 'Un ordre automatique qui ferme une transaction lorsque le prix atteint un niveau prédéfini pour limiter les pertes. Le stop loss est la première ligne de défense pour protéger le capital, et ne pas l\'utiliser expose le compte à des pertes potentiellement catastrophiques. Il est généralement fixé à 1-2 % du capital comme perte maximale.',
    tr: 'Fiyat önceden belirlenmiş bir seviyeye ulaştığında işlemi zararı sınırlamak için kapatan otomatik bir emirdir. Zarar durdurma, sermayeyi korumak için ilk savunma hattıdır ve kullanılmaması hesabı potansiyel olarak felaket olan kayıplara maruz bırakır. Genellikle maksimum kayıp olarak sermayenin %1-2\'sine ayarlanır.',
    es: 'Una orden automática que cierra una operación cuando el precio alcanza un nivel preespecificado para limitar pérdidas. El stop loss es la primera línea de defensa para proteger el capital, y no usarlo expone la cuenta a pérdidas potencialmente catastróficas. Generalmente se establece en 1-2% del capital como pérdida máxima.',
  },
  Margin: {
    ar: 'المبلغ المحجوز من حساب المتداول كضمان لفتح صفقة برافعة مالية. الهامش لا يُخصم بل يُجمد ويعود عند إغلاق الصفقة. إذا تجاوزت الخسائر الهامش المتاح يصدر الوسيط نداء هامش (Margin Call) أو يغلق الصفقات تلقائياً لحماية رأس المال المتبقي.',
    en: 'The amount held from a trader\'s account as collateral to open a leveraged position. Margin is not deducted but frozen and returned when the trade is closed. If losses exceed the available margin, the broker issues a margin call or automatically closes positions to protect the remaining capital.',
    fr: 'Le montant retenu du compte d\'un trader comme garantie pour ouvrir une position à effet de levier. La marge n\'est pas déduite mais gelée et restituée à la clôture de la transaction. Si les pertes dépassent la marge disponible, le courtier émet un appel de marge ou ferme automatiquement les positions pour protéger le capital restant.',
    tr: 'Kaldıraçlı bir pozisyon açmak için bir işlecinin hesabından teminat olarak tutulan tutardır. Teminat düşülmez ancak dondurulur ve işlem kapatıldığında iade edilir. Kayıplar kullanılabilir teminatı aşarsa, aracı bir teminat tamamlama çağrısı yapar veya kalan sermayeyi korumak için pozisyonları otomatik olarak kapatır.',
    es: 'El monto retenido de la cuenta de un trader como colateral para abrir una posición apalancada. El margen no se deduce sino que se congela y se devuelve al cerrar la operación. Si las pérdidas exceden el margen disponible, el bróker emite un margin call o cierra automáticamente las posiciones para proteger el capital restante.',
  },
};

// ─── Ebook Metadata ─────────────────────────────────────────────────
export const EBOOK_TITLES: Record<string, Record<Locale, string>> = {
  e1: {
    ar: 'أساسيات تداول الفوركس بالذكاء الاصطناعي',
    en: 'Forex Trading Fundamentals with AI',
    fr: 'Fondamentaux du Trading Forex avec IA',
    tr: 'AI ile Forex İşlem Temelleri',
    es: 'Fundamentos de Trading Forex con IA',
  },
  e2: {
    ar: 'استراتيجيات التداول بـ Price Action',
    en: 'Price Action Trading Strategies',
    fr: 'Stratégies de Trading Price Action',
    tr: 'Price Action İşlem Stratejileri',
    es: 'Estrategias de Trading Price Action',
  },
  e3: {
    ar: 'تداول الذهب باستخدام الذكاء الاصطناعي',
    en: 'Gold Trading with AI',
    fr: 'Trading de l\'Or avec IA',
    tr: 'AI ile Altın İşlemleri',
    es: 'Trading de Oro con IA',
  },
  e4: {
    ar: 'البيتكوين والكريبتو بعيون المحلل',
    en: 'Bitcoin & Crypto Through an Analyst\'s Eyes',
    fr: 'Bitcoin & Crypto à Travers les Yeux d\'un Analyste',
    tr: 'Bir Analistin Gözünden Bitcoin & Kripto',
    es: 'Bitcoin & Cripto a Través de los Ojos de un Analista',
  },
  e5: {
    ar: 'إدارة المخاطر — علم حماية رأس المال',
    en: 'Risk Management — The Science of Capital Protection',
    fr: 'Gestion des Risques — La Science de la Protection du Capital',
    tr: 'Risk Yönetimi — Sermaye Koruması Bilimi',
    es: 'Gestión de Riesgos — La Ciencia de Proteger el Capital',
  },
  e6: {
    ar: 'بناء روبوت تداول بـ AI',
    en: 'Building an AI Trading Bot',
    fr: 'Construire un Bot de Trading IA',
    tr: 'AI İşlem Botu Oluşturma',
    es: 'Construir un Bot de Trading con IA',
  },
  e7: {
    ar: 'التحليل الأساسي للأسواق المالية',
    en: 'Fundamental Analysis of Financial Markets',
    fr: 'Analyse Fondamentale des Marchés Financiers',
    tr: 'Finansal Piyasaların Temel Analizi',
    es: 'Análisis Fundamental de los Mercados Financieros',
  },
  e8: {
    ar: 'الشموع اليابانية وأنماط الأسعار',
    en: 'Japanese Candlesticks and Price Patterns',
    fr: 'Bougies Japonaises et Motifs de Prix',
    tr: 'Japon Mumları ve Fiyat Formasyonları',
    es: 'Velas Japonesas y Patrones de Precio',
  },
};

export const EBOOK_AUTHORS: Record<Locale, string> = {
  ar: 'فريق رؤى',
  en: 'Rouaa Team',
  fr: 'Équipe Rouaa',
  tr: 'Rouaa Ekibi',
  es: 'Equipo Rouaa',
};

export const EBOOK_DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  e1: {
    ar: 'دليلك الشامل لفهم سوق الفوركس واستخدام أدوات الذكاء الاصطناعي في تحليل الأسواق واتخاذ قرارات تداول أذكى. من المفاهيم الأساسية إلى التطبيق العملي.',
    en: 'Your comprehensive guide to understanding the forex market and using AI tools to analyze markets and make smarter trading decisions. From basic concepts to practical application.',
    fr: 'Votre guide complet pour comprendre le marché des changes et utiliser les outils d\'IA pour analyser les marchés et prendre des décisions de trading plus intelligentes. Des concepts de base à l\'application pratique.',
    tr: 'Forex piyasasını anlamak ve piyasaları analiz etmek, daha akıllı işlem kararları almak için AI araçlarını kullanma kapsamlı rehberiniz. Temel kavramlardan pratik uygulamaya.',
    es: 'Tu guía completa para entender el mercado forex y usar herramientas de IA para analizar mercados y tomar decisiones de trading más inteligentes. Desde conceptos básicos hasta aplicación práctica.',
  },
  e2: {
    ar: 'تعلّم قراءة السعر العاري بدون مؤشرات. دليل عملي لفهم حركة السعر ومناطق العرض والطلب وأنماط الارتداد والاستمرار.',
    en: 'Learn to read naked price action without indicators. A practical guide to understanding price movement, supply and demand zones, and reversal and continuation patterns.',
    fr: 'Apprenez à lire l\'action de prix nue sans indicateurs. Un guide pratique pour comprendre le mouvement des prix, les zones d\'offre et de demande, et les motifs de renversement et de continuation.',
    tr: 'Göstergeler olmadan çıplak fiyat hareketini okumayı öğrenin. Fiyat hareketini, arz ve talep bölgelerini, dönüş ve devam formasyonlarını anlama için pratik bir rehber.',
    es: 'Aprende a leer la acción de precio desnuda sin indicadores. Una guía práctica para entender el movimiento del precio, zonas de oferta y demanda, y patrones de reversión y continuación.',
  },
  e3: {
    ar: 'دليل متخصص لتداول الذهب يعتمد على تحليلات الذكاء الاصطناعي. يشمل العوامل المؤثرة في سعر الذهب واستراتيجيات تداول محددة.',
    en: 'A specialized gold trading guide based on AI analysis. Includes factors affecting gold prices and specific trading strategies.',
    fr: 'Un guide spécialisé de trading de l\'or basé sur l\'analyse IA. Inclut les facteurs affectant les prix de l\'or et des stratégies de trading spécifiques.',
    tr: 'AI analizine dayalı uzmanlaşmış bir altın işlem rehberi. Altın fiyatlarını etkileyen faktörleri ve belirli işlem stratejilerini içerir.',
    es: 'Una guía especializada de trading de oro basada en análisis de IA. Incluye factores que afectan los precios del oro y estrategias de trading específicas.',
  },
  e4: {
    ar: 'دليل شامل لفهم وتحليل سوق العملات الرقمية من منظور محلل محترف. يشمل التحليل الفني والأساسي وتحليل On-Chain.',
    en: 'A comprehensive guide to understanding and analyzing the cryptocurrency market from a professional analyst\'s perspective. Includes technical, fundamental, and on-chain analysis.',
    fr: 'Un guide complet pour comprendre et analyser le marché des cryptomonnaies du point de vue d\'un analyste professionnel. Inclut l\'analyse technique, fondamentale et on-chain.',
    tr: 'Profesyonel bir analistin bakış açısıyla kripto para piyasasını anlama ve analiz etme kapsamlı rehberi. Teknik, temel ve on-chain analizini içerir.',
    es: 'Una guía completa para entender y analizar el mercado de criptomonedas desde la perspectiva de un analista profesional. Incluye análisis técnico, fundamental y on-chain.',
  },
  e5: {
    ar: 'أهم كتاب ستقرؤه في مسيرتك التداولية. تعلّم كيف تحمي رأس مالك وتبقى في السوق طويلاً بقواعد إدارة مخاطر محكمة.',
    en: 'The most important book you\'ll read in your trading career. Learn how to protect your capital and stay in the market long-term with strict risk management rules.',
    fr: 'Le livre le plus important que vous lirez dans votre carrière de trading. Apprenez à protéger votre capital et à rester sur le marché à long terme avec des règles strictes de gestion des risques.',
    tr: 'İşlem kariyerinizde okuyacağınız en önemli kitap. Sermayenizi nasıl koruyacağınızı ve sıkı risk yönetimi kurallarıyla piyasada uzun süre kalacağınızı öğrenin.',
    es: 'El libro más importante que leerás en tu carrera de trading. Aprende a proteger tu capital y permanecer en el mercado a largo plazo con reglas estrictas de gestión de riesgos.',
  },
  e6: {
    ar: 'دليل تقني متقدم لبناء روبوت تداول آلي يستخدم الذكاء الاصطناعي. من الفكرة إلى النشر والمراقبة.',
    en: 'An advanced technical guide to building an automated trading bot using AI. From idea to deployment and monitoring.',
    fr: 'Un guide technique avancé pour construire un bot de trading automatisé utilisant l\'IA. De l\'idée au déploiement et à la surveillance.',
    tr: 'AI kullanan otomatik bir işlem botu oluşturmak için gelişmiş teknik rehber. Fikirden dağıtıma ve izlemeye.',
    es: 'Una guía técnica avanzada para construir un bot de trading automatizado usando IA. Desde la idea hasta el despliegue y monitoreo.',
  },
  e7: {
    ar: 'دليل عملي لفهم العوامل الاقتصادية التي تحرك الأسواق. تعلّم قراءة البيانات الاقتصادية وتفسير قرارات البنوك المركزية.',
    en: 'A practical guide to understanding the economic factors that move markets. Learn to read economic data and interpret central bank decisions.',
    fr: 'Un guide pratique pour comprendre les facteurs économiques qui font bouger les marchés. Apprenez à lire les données économiques et à interpréter les décisions des banques centrales.',
    tr: 'Piyasaları hareket ettiren ekonomik faktörleri anlama kapsamlı rehber. Ekonomik verileri okumayı ve merkez bankası kararlarını yorumlamayı öğrenin.',
    es: 'Una guía práctica para entender los factores económicos que mueven los mercados. Aprende a leer datos económicos e interpretar decisiones de bancos centrales.',
  },
  e8: {
    ar: 'تعلّم قراءة الشموع اليابانية من الصفر. دليل مصور لفهم بنية الشموع وأنماطها الفردية والمركبة وتطبيقاتها العملية.',
    en: 'Learn to read Japanese candlesticks from scratch. An illustrated guide to understanding candle structure, individual and composite patterns, and their practical applications.',
    fr: 'Apprenez à lire les bougies japonaises à partir de zéro. Un guide illustré pour comprendre la structure des bougies, les motifs individuels et composites, et leurs applications pratiques.',
    tr: 'Japon mumlarını sıfırdan okumayı öğrenin. Mum yapısını, bireysel ve kompozit formasyonları ve pratik uygulamalarını anlama için resimli bir rehber.',
    es: 'Aprende a leer velas japonesas desde cero. Una guía ilustrada para entender la estructura de las velas, patrones individuales y compuestos, y sus aplicaciones prácticas.',
  },
};
