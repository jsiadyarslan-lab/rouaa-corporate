// ─── Language Dashboard Labels ──────────────────────────────
// Locale-specific strings for the LanguageDashboard component
// Organized by content-type tabs with sub-sections for each

export interface LanguageDashboardLabels {
  title: string;
  subtitle: string;
  localeFlag: string;
  dir: 'rtl' | 'ltr';
  loading: string;
  tabs: {
    news: string;
    reports: string;
    strategic: string;
    infographic: string;
    video: string;
  };
  subSections: {
    stats: string;
    prompts: string;
    models: string;
    controls: string;
    generate: string;
  };
  stats: {
    totalPublished: string;
    todayPublished: string;
    todayGen: string;
    thisWeek: string;
    thisMonth: string;
    totalFetched: string;
    successRate: string;
    byCategory: string;
    byType: string;
    byAssetClass: string;
    newsStages: string;
    pipelineSection: string;
    published: string;
    noStatsTitle: string;
    noStatsSubtitle: string;
  };
  prompts: {
    fetchGroup: string;
    analyzeGroup: string;
    translateGroup: string;
    classifyGroup: string;
    otherGroup: string;
    reportsGroup: string;
    infographicGroup: string;
    videoGroup: string;
    otherReportGroup: string;
    categoryReports: string;
    noPrompts: string;
    source: string;
    active: string;
    inactive: string;
    edit: string;
    save: string;
    cancel: string;
    customBadge: string;
    customContent: string;
    defaultContent: string;
  };
  models: {
    currentAssignment: string;
    providers: string;
    activeCount: string;
    available: string;
    disabledManually: string;
    unavailable: string;
    noApiKey: string;
    enabled: string;
    disabledLabel: string;
    allMappings: string;
    currentTab: string;
    custom: string;
    default: string;
    resetToDefault: string;
    circuitBreakers: string;
    open: string;
    closed: string;
    noModelsTitle: string;
  };
  pipeline: {
    status: string;
    running: string;
    stopped: string;
    cycle: string;
    published: string;
    failed: string;
    totalArticles: string;
    ready: string;
    pending: string;
    translated: string;
    analyzed: string;
    imaged: string;
    rejected: string;
    queueStatus: string;
    pendingJobs: string;
    runningJobs: string;
    done24h: string;
    failed24h: string;
    productionLimits: string;
    dailyLimit: string;
    hourlyLimit: string;
    save: string;
    startPipeline: string;
    consecutiveErrors: string;
  };
  generate: {
    title: string;
    triggerNewsPipeline: string;
    triggerNewsDesc: string;
    fetchNews: string;
    generateReport: string;
    reportType: string;
    assetClass: string;
    forceGenerate: string;
    asyncGenerate: string;
    generateBtn: string;
    generating: string;
    generateAnalysis: string;
    topic: string;
    topicPlaceholder: string;
    region: string;
    regionPlaceholder: string;
    sectors: string;
    sourceType: string;
    sourceId: string;
    sourceIdPlaceholder: string;
    symbol: string;
    symbolPlaceholder: string;
    reportId: string;
    reportIdPlaceholder: string;
    marketImpact: string;
    daily: string;
    weekly: string;
    monthly: string;
    quarterly: string;
    special: string;
    strategicType: string;
    stocks: string;
    commodities: string;
    forex: string;
    crypto: string;
    bonds: string;
    energy: string;
    realEstate: string;
    economy: string;
    banking: string;
    technicalAnalysis: string;
    arabMarkets: string;
    earnings: string;
    sourceNews: string;
    sourceEconomicReport: string;
    sourceMarketAnalysis: string;
    selectType: string;
    selectAssetClass: string;
    customPrompt: string;
    customPromptPlaceholder: string;
    publishAfterGenerate: string;
    generateAll: string;
    generatingAll: string;
    generatingCategory: string;
    allCategories: string;
    quickGenerate: string;
    quickGenerateDesc: string;
  };
  toast: {
    limitsSaved: string;
    limitsSaveFailed: string;
    connectionFailed: string;
    promptSaved: string;
    promptSaveFailed: string;
    promptEnabled: string;
    promptDisabled: string;
    promptToggleFailed: string;
    mappingUpdated: string;
    mappingUpdateFailed: string;
    modelEnabled: string;
    modelDisabled: string;
    modelToggleFailed: string;
    pipelineStarted: string;
    pipelineStartFailed: string;
    generateStarted: string;
    generateFailed: string;
    generateSuccess: string;
  };
}

// ═══════════════════════════════════════════════════════════
// ARABIC LABELS
// ═══════════════════════════════════════════════════════════
export const arDashboardLabels: LanguageDashboardLabels = {
  title: 'لوحة تحكم خط الإنتاج العربي',
  subtitle: 'العدادات والبرومبتات وتعيين النماذج والتحكم — كل شيء حسب نوع المحتوى',
  localeFlag: '🇸🇦',
  dir: 'rtl',
  loading: 'جارٍ التحميل...',
  tabs: {
    news: 'أخبار',
    reports: 'تقارير',
    strategic: 'تقارير استراتيجية',
    infographic: 'إنفوغرافيك',
    video: 'فيديو',
  },
  subSections: {
    stats: 'لوحة العدادات',
    prompts: 'البرومبتات',
    models: 'تعيين النموذج',
    controls: 'التحكم',
    generate: 'توليد',
  },
  stats: {
    totalPublished: 'إجمالي المنشور',
    todayPublished: 'نشر اليوم',
    todayGen: 'توليد اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    totalFetched: 'إجمالي الجلب',
    successRate: 'معدل النجاح',
    byCategory: 'حسب التصنيف',
    byType: 'حسب النوع',
    byAssetClass: 'حسب فئة الأصول',
    newsStages: 'مراحل الأخبار',
    pipelineSection: 'إحصائيات الأنابيب',
    published: 'منشور',
    noStatsTitle: 'لا توجد بيانات إحصائية متاحة حالياً',
    noStatsSubtitle: 'سيتم التحميل تلقائياً كل 60 ثانية',
  },
  prompts: {
    fetchGroup: 'جلب الأخبار',
    analyzeGroup: 'تحليل الأخبار',
    translateGroup: 'ترجمة الأخبار',
    classifyGroup: 'تصنيف الأخبار',
    otherGroup: 'أخرى (أخبار)',
    reportsGroup: 'تقارير',
    infographicGroup: 'إنفوغرافيك',
    videoGroup: 'فيديو',
    otherReportGroup: 'أخرى',
    categoryReports: 'تقارير التصنيفات',
    noPrompts: 'لا توجد برومبتات متاحة لهذا المحتوى',
    source: 'المصدر',
    active: 'مفعّل',
    inactive: 'معطّل',
    edit: 'تعديل',
    save: 'حفظ',
    cancel: 'إلغاء',
    customBadge: 'مخصّص',
    customContent: 'محتوى مخصّص',
    defaultContent: 'كود افتراضي',
  },
  models: {
    currentAssignment: 'تعيين النموذج الحالي',
    providers: 'مزودو الذكاء الاصطناعي',
    activeCount: 'فعّال',
    available: 'متاح',
    disabledManually: 'معطّل يدوياً',
    unavailable: 'غير متاح',
    noApiKey: 'لا مفتاح API',
    enabled: 'مفعّل',
    disabledLabel: 'معطّل',
    allMappings: 'جميع تعيينات خطوط الإنتاج',
    currentTab: 'التبويب الحالي',
    custom: 'مخصّص',
    default: 'الافتراضي',
    resetToDefault: 'إعادة للإفتراضي',
    circuitBreakers: 'حالة قواطع الدائرة',
    open: 'مفتوح — محمي',
    closed: 'مغلق — يعمل',
    noModelsTitle: 'لا توجد بيانات نماذج متاحة حالياً',
  },
  pipeline: {
    status: 'حالة الأنابيب',
    running: 'الأنابيب تعمل',
    stopped: 'الأنابيب متوقفة',
    cycle: 'دورة',
    published: 'منشور',
    failed: 'فاشل',
    totalArticles: 'إجمالي المقالات',
    ready: 'منشورة',
    pending: 'قيد الانتظار',
    translated: 'مترجمة',
    analyzed: 'محللة',
    imaged: 'مصوّرة',
    rejected: 'مرفوضة',
    queueStatus: 'حالة الطابور',
    pendingJobs: 'مهام منتظرة',
    runningJobs: 'مهام جارية',
    done24h: 'مكتملة (24س)',
    failed24h: 'فاشلة (24س)',
    productionLimits: 'حدود الإنتاج',
    dailyLimit: 'الحد اليومي',
    hourlyLimit: 'الحد الساعي',
    save: 'حفظ',
    startPipeline: 'تشغيل الأنابيب',
    consecutiveErrors: 'أخطاء متتالية',
  },
  generate: {
    title: 'توليد المحتوى',
    triggerNewsPipeline: 'تشغيل أنابيب الأخبار',
    triggerNewsDesc: 'جلب ومعالجة الأخبار الجديدة من المصادر',
    fetchNews: 'جلب الأخبار',
    generateReport: 'توليد تقرير',
    reportType: 'نوع التقرير',
    assetClass: 'فئة الأصول',
    forceGenerate: 'توليد إجباري',
    asyncGenerate: 'توليد غير متزامن',
    generateBtn: 'توليد',
    generating: 'جارٍ التوليد...',
    generateAnalysis: 'توليد تحليل سوقي',
    topic: 'الموضوع',
    topicPlaceholder: 'أدخل موضوع التقرير الاستراتيجي',
    region: 'المنطقة',
    regionPlaceholder: 'الشرق الأوسط',
    sectors: 'القطاعات',
    sourceType: 'نوع المصدر',
    sourceId: 'معرف المصدر',
    sourceIdPlaceholder: 'أدخل معرف المحتوى المصدر',
    symbol: 'رمز السهم',
    symbolPlaceholder: 'مثال: AAPL',
    reportId: 'معرف التقرير',
    reportIdPlaceholder: 'أدخل معرف التقرير المصدر',
    marketImpact: 'التأثير السوقي',
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    special: 'خاص',
    strategicType: 'استراتيجي',
    stocks: 'أسهم',
    commodities: 'سلع',
    forex: 'فوركس',
    crypto: 'عملات رقمية',
    bonds: 'سندات',
    energy: 'طاقة',
    realEstate: 'عقارات',
    economy: 'اقتصاد',
    banking: 'بنوك',
    technicalAnalysis: 'تحليل فني',
    arabMarkets: 'أسواق عربية',
    earnings: 'نتائج أعمال',
    sourceNews: 'خبر',
    sourceEconomicReport: 'تقرير اقتصادي',
    sourceMarketAnalysis: 'تحليل سوقي',
    selectType: 'اختر النوع',
    selectAssetClass: 'اختر فئة الأصول',
    customPrompt: 'برومبت مخصص',
    customPromptPlaceholder: 'اتركه فارغاً لاستخدام الافتراضي',
    publishAfterGenerate: 'نشر بعد التوليد',
    generateAll: 'ولّد الكل',
    generatingAll: 'جارٍ توليد الكل...',
    generatingCategory: 'جارٍ التوليد...',
    allCategories: 'جميع التصنيفات',
    quickGenerate: 'توليد سريع حسب التصنيف',
    quickGenerateDesc: 'اضغط على أي تصنيف لتوليد تقرير/تحليل له فوراً',
  },
  toast: {
    limitsSaved: 'تم حفظ حدود الإنتاج',
    limitsSaveFailed: 'فشل حفظ الإعدادات',
    connectionFailed: 'فشل الاتصال بالخادم',
    promptSaved: 'تم حفظ البرومبت',
    promptSaveFailed: 'فشل الحفظ',
    promptEnabled: 'تم تفعيل البرومبت',
    promptDisabled: 'تم تعطيل البرومبت',
    promptToggleFailed: 'فشل التحديث',
    mappingUpdated: 'تم تحديث التعيين',
    mappingUpdateFailed: 'فشل تحديث التعيين',
    modelEnabled: 'مفعّل',
    modelDisabled: 'معطّل',
    modelToggleFailed: 'فشل تحديث الحالة',
    pipelineStarted: 'تم تشغيل الأنابيب',
    pipelineStartFailed: 'فشل تشغيل الأنابيب',
    generateStarted: 'بدأ التوليد',
    generateFailed: 'فشل التوليد',
    generateSuccess: 'تم التوليد بنجاح',
  },
};

// ═══════════════════════════════════════════════════════════
// ENGLISH LABELS
// ═══════════════════════════════════════════════════════════
export const enDashboardLabels: LanguageDashboardLabels = {
  title: 'English Production Dashboard',
  subtitle: 'Stats, prompts, model assignment & controls — organized by content type',
  localeFlag: '🇬🇧',
  dir: 'ltr',
  loading: 'Loading...',
  tabs: {
    news: 'News',
    reports: 'Reports',
    strategic: 'Strategic',
    infographic: 'Infographic',
    video: 'Video',
  },
  subSections: {
    stats: 'Statistics',
    prompts: 'Prompts',
    models: 'Model Assignment',
    controls: 'Controls',
    generate: 'Generate',
  },
  stats: {
    totalPublished: 'Total Published',
    todayPublished: 'Published Today',
    todayGen: 'Generated Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    totalFetched: 'Total Fetched',
    successRate: 'Success Rate',
    byCategory: 'By Category',
    byType: 'By Type',
    byAssetClass: 'By Asset Class',
    newsStages: 'News Stages',
    pipelineSection: 'Pipeline Statistics',
    published: 'Published',
    noStatsTitle: 'No statistics data available',
    noStatsSubtitle: 'Auto-refresh every 60 seconds',
  },
  prompts: {
    fetchGroup: 'Fetch News',
    analyzeGroup: 'Analyze News',
    translateGroup: 'Translate News',
    classifyGroup: 'Classify News',
    otherGroup: 'Other (News)',
    reportsGroup: 'Reports',
    infographicGroup: 'Infographic',
    videoGroup: 'Video',
    otherReportGroup: 'Other',
    categoryReports: 'Category Reports',
    noPrompts: 'No prompts available for this content type',
    source: 'Source',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    customBadge: 'Custom',
    customContent: 'Custom content',
    defaultContent: 'Default code',
  },
  models: {
    currentAssignment: 'Current Model Assignment',
    providers: 'AI Providers',
    activeCount: 'Active',
    available: 'Available',
    disabledManually: 'Manually disabled',
    unavailable: 'Unavailable',
    noApiKey: 'No API key',
    enabled: 'Enabled',
    disabledLabel: 'Disabled',
    allMappings: 'All Pipeline Mappings',
    currentTab: 'Current Tab',
    custom: 'Custom',
    default: 'Default',
    resetToDefault: 'Reset to default',
    circuitBreakers: 'Circuit Breaker Status',
    open: 'Open — Protected',
    closed: 'Closed — Working',
    noModelsTitle: 'No model data available',
  },
  pipeline: {
    status: 'Pipeline Status',
    running: 'Pipeline Running',
    stopped: 'Pipeline Stopped',
    cycle: 'Cycle',
    published: 'Published',
    failed: 'Failed',
    totalArticles: 'Total Articles',
    ready: 'Ready',
    pending: 'Pending',
    translated: 'Translated',
    analyzed: 'Analyzed',
    imaged: 'Imaged',
    rejected: 'Rejected',
    queueStatus: 'Queue Status',
    pendingJobs: 'Pending Jobs',
    runningJobs: 'Running Jobs',
    done24h: 'Done (24h)',
    failed24h: 'Failed (24h)',
    productionLimits: 'Production Limits',
    dailyLimit: 'Daily Limit',
    hourlyLimit: 'Hourly Limit',
    save: 'Save',
    startPipeline: 'Start Pipeline',
    consecutiveErrors: 'consecutive errors',
  },
  generate: {
    title: 'Content Generation',
    triggerNewsPipeline: 'Trigger News Pipeline',
    triggerNewsDesc: 'Fetch and process new articles from sources',
    fetchNews: 'Fetch News',
    generateReport: 'Generate Report',
    reportType: 'Report Type',
    assetClass: 'Asset Class',
    forceGenerate: 'Force Generate',
    asyncGenerate: 'Async Generate',
    generateBtn: 'Generate',
    generating: 'Generating...',
    generateAnalysis: 'Generate Market Analysis',
    topic: 'Topic',
    topicPlaceholder: 'Enter strategic report topic',
    region: 'Region',
    regionPlaceholder: 'Middle East',
    sectors: 'Sectors',
    sourceType: 'Source Type',
    sourceId: 'Source ID',
    sourceIdPlaceholder: 'Enter source content ID',
    symbol: 'Symbol',
    symbolPlaceholder: 'e.g. AAPL',
    reportId: 'Report ID',
    reportIdPlaceholder: 'Enter source report ID',
    marketImpact: 'Market Impact',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    special: 'Special',
    strategicType: 'Strategic',
    stocks: 'Stocks',
    commodities: 'Commodities',
    forex: 'Forex',
    crypto: 'Crypto',
    bonds: 'Bonds',
    energy: 'Energy',
    realEstate: 'Real Estate',
    economy: 'Economy',
    banking: 'Banking',
    technicalAnalysis: 'Technical Analysis',
    arabMarkets: 'Arab Markets',
    earnings: 'Earnings',
    sourceNews: 'News',
    sourceEconomicReport: 'Economic Report',
    sourceMarketAnalysis: 'Market Analysis',
    selectType: 'Select type',
    selectAssetClass: 'Select asset class',
    customPrompt: 'Custom Prompt',
    customPromptPlaceholder: 'Leave empty for default',
    publishAfterGenerate: 'Publish after generation',
    generateAll: 'Generate All',
    generatingAll: 'Generating all...',
    generatingCategory: 'Generating...',
    allCategories: 'All Categories',
    quickGenerate: 'Quick Generate by Category',
    quickGenerateDesc: 'Click any category to generate a report/analysis instantly',
  },
  toast: {
    limitsSaved: 'Production limits saved',
    limitsSaveFailed: 'Failed to save settings',
    connectionFailed: 'Server connection failed',
    promptSaved: 'Prompt saved',
    promptSaveFailed: 'Failed to save',
    promptEnabled: 'Prompt enabled',
    promptDisabled: 'Prompt disabled',
    promptToggleFailed: 'Failed to update',
    mappingUpdated: 'Mapping updated',
    mappingUpdateFailed: 'Failed to update mapping',
    modelEnabled: 'Enabled',
    modelDisabled: 'Disabled',
    modelToggleFailed: 'Failed to update status',
    pipelineStarted: 'Pipeline started',
    pipelineStartFailed: 'Failed to start pipeline',
    generateStarted: 'Generation started',
    generateFailed: 'Generation failed',
    generateSuccess: 'Generated successfully',
  },
};

// ═══════════════════════════════════════════════════════════
// FRENCH LABELS
// ═══════════════════════════════════════════════════════════
export const frDashboardLabels: LanguageDashboardLabels = {
  title: 'Tableau de Bord de Production Français',
  subtitle: 'Stats, prompts, attribution des modèles et contrôles — organisé par type de contenu',
  localeFlag: '🇫🇷',
  dir: 'ltr',
  loading: 'Chargement...',
  tabs: {
    news: 'Actualités',
    reports: 'Rapports',
    strategic: 'Stratégiques',
    infographic: 'Infographie',
    video: 'Vidéo',
  },
  subSections: {
    stats: 'Statistiques',
    prompts: 'Prompts',
    models: 'Attribution Modèle',
    controls: 'Contrôles',
    generate: 'Générer',
  },
  stats: {
    totalPublished: 'Total Publié',
    todayPublished: 'Publié Aujourd\'hui',
    todayGen: 'Généré Aujourd\'hui',
    thisWeek: 'Cette Semaine',
    thisMonth: 'Ce Mois',
    totalFetched: 'Total Récupéré',
    successRate: 'Taux de Réussite',
    byCategory: 'Par Catégorie',
    byType: 'Par Type',
    byAssetClass: 'Par Classe d\'Actifs',
    newsStages: 'Étapes Actualités',
    pipelineSection: 'Statistiques Pipeline',
    published: 'Publié',
    noStatsTitle: 'Aucune donnée statistique disponible',
    noStatsSubtitle: 'Actualisation automatique toutes les 60 secondes',
  },
  prompts: {
    fetchGroup: 'Récupération',
    analyzeGroup: 'Analyse',
    translateGroup: 'Traduction',
    classifyGroup: 'Classification',
    otherGroup: 'Autres (Actualités)',
    reportsGroup: 'Rapports',
    infographicGroup: 'Infographie',
    videoGroup: 'Vidéo',
    otherReportGroup: 'Autres',
    categoryReports: 'Rapports par Catégorie',
    noPrompts: 'Aucun prompt disponible pour ce type de contenu',
    source: 'Source',
    active: 'Actif',
    inactive: 'Inactif',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    customBadge: 'Personnalisé',
    customContent: 'Contenu personnalisé',
    defaultContent: 'Code par défaut',
  },
  models: {
    currentAssignment: 'Attribution du Modèle Actuel',
    providers: 'Fournisseurs IA',
    activeCount: 'Actif',
    available: 'Disponible',
    disabledManually: 'Désactivé manuellement',
    unavailable: 'Indisponible',
    noApiKey: 'Pas de clé API',
    enabled: 'Activé',
    disabledLabel: 'Désactivé',
    allMappings: 'Tous les Mappings Pipeline',
    currentTab: 'Onglet Actuel',
    custom: 'Personnalisé',
    default: 'Par défaut',
    resetToDefault: 'Réinitialiser',
    circuitBreakers: 'État des Disjoncteurs',
    open: 'Ouvert — Protégé',
    closed: 'Fermé — Actif',
    noModelsTitle: 'Aucune donnée de modèle disponible',
  },
  pipeline: {
    status: 'État du Pipeline',
    running: 'Pipeline en Cours',
    stopped: 'Pipeline Arrêté',
    cycle: 'Cycle',
    published: 'Publié',
    failed: 'Échoué',
    totalArticles: 'Total Articles',
    ready: 'Prêt',
    pending: 'En Attente',
    translated: 'Traduit',
    analyzed: 'Analysé',
    imaged: 'Imagé',
    rejected: 'Rejeté',
    queueStatus: 'État de la File',
    pendingJobs: 'Tâches en Attente',
    runningJobs: 'Tâches en Cours',
    done24h: 'Terminé (24h)',
    failed24h: 'Échoué (24h)',
    productionLimits: 'Limites de Production',
    dailyLimit: 'Limite Quotidienne',
    hourlyLimit: 'Limite Horaire',
    save: 'Enregistrer',
    startPipeline: 'Démarrer le Pipeline',
    consecutiveErrors: 'erreurs consécutives',
  },
  generate: {
    title: 'Génération de Contenu',
    triggerNewsPipeline: 'Déclencher le Pipeline d\'Actualités',
    triggerNewsDesc: 'Récupérer et traiter de nouveaux articles depuis les sources',
    fetchNews: 'Récupérer les Actualités',
    generateReport: 'Générer un Rapport',
    reportType: 'Type de Rapport',
    assetClass: 'Classe d\'Actifs',
    forceGenerate: 'Génération Forcée',
    asyncGenerate: 'Génération Asynchrone',
    generateBtn: 'Générer',
    generating: 'Génération en cours...',
    generateAnalysis: 'Générer une Analyse de Marché',
    topic: 'Sujet',
    topicPlaceholder: 'Entrez le sujet du rapport stratégique',
    region: 'Région',
    regionPlaceholder: 'Moyen-Orient',
    sectors: 'Secteurs',
    sourceType: 'Type de Source',
    sourceId: 'ID Source',
    sourceIdPlaceholder: 'Entrez l\'ID du contenu source',
    symbol: 'Symbole',
    symbolPlaceholder: 'ex. AAPL',
    reportId: 'ID Rapport',
    reportIdPlaceholder: 'Entrez l\'ID du rapport source',
    marketImpact: 'Impact Marché',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    special: 'Spécial',
    strategicType: 'Stratégique',
    stocks: 'Actions',
    commodities: 'Matières Premières',
    forex: 'Forex',
    crypto: 'Crypto',
    bonds: 'Obligations',
    energy: 'Énergie',
    realEstate: 'Immobilier',
    economy: 'Économie',
    banking: 'Banques',
    technicalAnalysis: 'Analyse Technique',
    arabMarkets: 'Marchés Arabes',
    earnings: 'Résultats',
    sourceNews: 'Actualité',
    sourceEconomicReport: 'Rapport Économique',
    sourceMarketAnalysis: 'Analyse de Marché',
    selectType: 'Sélectionner le type',
    selectAssetClass: 'Sélectionner la classe d\'actifs',
    customPrompt: 'Prompt Personnalisé',
    customPromptPlaceholder: 'Laisser vide pour le défaut',
    publishAfterGenerate: 'Publier après génération',
    generateAll: 'Générer Tout',
    generatingAll: 'Génération de tout...',
    generatingCategory: 'Génération...',
    allCategories: 'Toutes les Catégories',
    quickGenerate: 'Génération Rapide par Catégorie',
    quickGenerateDesc: 'Cliquez sur une catégorie pour générer un rapport/analyse instantanément',
  },
  toast: {
    limitsSaved: 'Limites de production enregistrées',
    limitsSaveFailed: 'Échec de l\'enregistrement',
    connectionFailed: 'Échec de la connexion au serveur',
    promptSaved: 'Prompt enregistré',
    promptSaveFailed: 'Échec de l\'enregistrement',
    promptEnabled: 'Prompt activé',
    promptDisabled: 'Prompt désactivé',
    promptToggleFailed: 'Échec de la mise à jour',
    mappingUpdated: 'Mapping mis à jour',
    mappingUpdateFailed: 'Échec de la mise à jour du mapping',
    modelEnabled: 'Activé',
    modelDisabled: 'Désactivé',
    modelToggleFailed: 'Échec de la mise à jour du statut',
    pipelineStarted: 'Pipeline démarré',
    pipelineStartFailed: 'Échec du démarrage du pipeline',
    generateStarted: 'Génération démarrée',
    generateFailed: 'Échec de la génération',
    generateSuccess: 'Généré avec succès',
  },
};

// ═══════════════════════════════════════════════════════════
// TURKISH LABELS
// ═══════════════════════════════════════════════════════════
export const trDashboardLabels: LanguageDashboardLabels = {
  title: 'Türkçe Üretim Kontrol Paneli',
  subtitle: 'İstatistikler, promptlar, model ataması ve kontroller — içerik türüne göre düzenlenmiş',
  localeFlag: '🇹🇷',
  dir: 'ltr',
  loading: 'Yükleniyor...',
  tabs: {
    news: 'Haberler',
    reports: 'Raporlar',
    strategic: 'Stratejik',
    infographic: 'İnfografik',
    video: 'Video',
  },
  subSections: {
    stats: 'İstatistikler',
    prompts: 'Promptlar',
    models: 'Model Ataması',
    controls: 'Kontroller',
    generate: 'Oluştur',
  },
  stats: {
    totalPublished: 'Toplam Yayınlanan',
    todayPublished: 'Bugün Yayınlanan',
    todayGen: 'Bugün Oluşturulan',
    thisWeek: 'Bu Hafta',
    thisMonth: 'Bu Ay',
    totalFetched: 'Toplam Çekilen',
    successRate: 'Başarı Oranı',
    byCategory: 'Kategoriye Göre',
    byType: 'Türe Göre',
    byAssetClass: 'Varlık Sınıfına Göre',
    newsStages: 'Haber Aşamaları',
    pipelineSection: 'İşlem Hattı İstatistikleri',
    published: 'Yayınlanan',
    noStatsTitle: 'İstatistik verisi mevcut değil',
    noStatsSubtitle: '60 saniyede otomatik yenilenir',
  },
  prompts: {
    fetchGroup: 'Haber Çekme',
    analyzeGroup: 'Haber Analizi',
    translateGroup: 'Haber Çevirisi',
    classifyGroup: 'Haber Sınıflandırma',
    otherGroup: 'Diğer (Haberler)',
    reportsGroup: 'Raporlar',
    infographicGroup: 'İnfografik',
    videoGroup: 'Video',
    otherReportGroup: 'Diğer',
    categoryReports: 'Kategori Raporları',
    noPrompts: 'Bu içerik türü için prompt mevcut değil',
    source: 'Kaynak',
    active: 'Aktif',
    inactive: 'İnaktif',
    edit: 'Düzenle',
    save: 'Kaydet',
    cancel: 'İptal',
    customBadge: 'Özel',
    customContent: 'Özel içerik',
    defaultContent: 'Varsayılan kod',
  },
  models: {
    currentAssignment: 'Mevcut Model Ataması',
    providers: 'Yapay Zeka Sağlayıcıları',
    activeCount: 'Aktif',
    available: 'Kullanılabilir',
    disabledManually: 'Manuel devre dışı',
    unavailable: 'Kullanılamaz',
    noApiKey: 'API anahtarı yok',
    enabled: 'Etkin',
    disabledLabel: 'Devre Dışı',
    allMappings: 'Tüm İşlem Hattı Atamaları',
    currentTab: 'Mevcut Sekme',
    custom: 'Özel',
    default: 'Varsayılan',
    resetToDefault: 'Varsayılana sıfırla',
    circuitBreakers: 'Devre Kesici Durumu',
    open: 'Açık — Korumalı',
    closed: 'Kapalı — Çalışıyor',
    noModelsTitle: 'Model verisi mevcut değil',
  },
  pipeline: {
    status: 'İşlem Hattı Durumu',
    running: 'İşlem Hattı Çalışıyor',
    stopped: 'İşlem Hattı Durduruldu',
    cycle: 'Döngü',
    published: 'Yayınlanan',
    failed: 'Başarısız',
    totalArticles: 'Toplam Makale',
    ready: 'Hazır',
    pending: 'Beklemede',
    translated: 'Çevrilen',
    analyzed: 'Analiz Edilen',
    imaged: 'Görselli',
    rejected: 'Reddedilen',
    queueStatus: 'Kuyruk Durumu',
    pendingJobs: 'Bekleyen İşler',
    runningJobs: 'Çalışan İşler',
    done24h: 'Tamamlanan (24s)',
    failed24h: 'Başarısız (24s)',
    productionLimits: 'Üretim Limitleri',
    dailyLimit: 'Günlük Limit',
    hourlyLimit: 'Saatlik Limit',
    save: 'Kaydet',
    startPipeline: 'İşlem Hattını Başlat',
    consecutiveErrors: 'ardışık hata',
  },
  generate: {
    title: 'İçerik Oluşturma',
    triggerNewsPipeline: 'Haber İşlem Hattını Tetikle',
    triggerNewsDesc: 'Kaynaklardan yeni makaleler çek ve işle',
    fetchNews: 'Haberleri Çek',
    generateReport: 'Rapor Oluştur',
    reportType: 'Rapor Türü',
    assetClass: 'Varlık Sınıfı',
    forceGenerate: 'Zorla Oluştur',
    asyncGenerate: 'Asenkron Oluştur',
    generateBtn: 'Oluştur',
    generating: 'Oluşturuluyor...',
    generateAnalysis: 'Piyasa Analizi Oluştur',
    topic: 'Konu',
    topicPlaceholder: 'Stratejik rapor konusunu girin',
    region: 'Bölge',
    regionPlaceholder: 'Orta Doğu',
    sectors: 'Sektörler',
    sourceType: 'Kaynak Türü',
    sourceId: 'Kaynak ID',
    sourceIdPlaceholder: 'Kaynak içerik ID girin',
    symbol: 'Sembol',
    symbolPlaceholder: 'örn. AAPL',
    reportId: 'Rapor ID',
    reportIdPlaceholder: 'Kaynak rapor ID girin',
    marketImpact: 'Piyasa Etkisi',
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    quarterly: 'Üç Aylık',
    special: 'Özel',
    strategicType: 'Stratejik',
    stocks: 'Hisseler',
    commodities: 'Emtialar',
    forex: 'Forex',
    crypto: 'Kripto',
    bonds: 'Tahviller',
    energy: 'Enerji',
    realEstate: 'Gayrimenkul',
    economy: 'Ekonomi',
    banking: 'Bankacılık',
    technicalAnalysis: 'Teknik Analiz',
    arabMarkets: 'Arap Piyasaları',
    earnings: 'Kazançlar',
    sourceNews: 'Haber',
    sourceEconomicReport: 'Ekonomik Rapor',
    sourceMarketAnalysis: 'Piyasa Analizi',
    selectType: 'Tür seçin',
    selectAssetClass: 'Varlık sınıfı seçin',
    customPrompt: 'Özel Prompt',
    customPromptPlaceholder: 'Varsayılan için boş bırakın',
    publishAfterGenerate: 'Oluşturduktan sonra yayınla',
    generateAll: 'Tümünü Oluştur',
    generatingAll: 'Tümü oluşturuluyor...',
    generatingCategory: 'Oluşturuluyor...',
    allCategories: 'Tüm Kategoriler',
    quickGenerate: 'Kategoriye Göre Hızlı Oluştur',
    quickGenerateDesc: 'Anında rapor/analiz oluşturmak için herhangi bir kategoriye tıklayın',
  },
  toast: {
    limitsSaved: 'Üretim limitleri kaydedildi',
    limitsSaveFailed: 'Ayarlar kaydedilemedi',
    connectionFailed: 'Sunucu bağlantısı başarısız',
    promptSaved: 'Prompt kaydedildi',
    promptSaveFailed: 'Kaydetme başarısız',
    promptEnabled: 'Prompt etkinleştirildi',
    promptDisabled: 'Prompt devre dışı bırakıldı',
    promptToggleFailed: 'Güncelleme başarısız',
    mappingUpdated: 'Atama güncellendi',
    mappingUpdateFailed: 'Atama güncellenemedi',
    modelEnabled: 'Etkin',
    modelDisabled: 'Devre Dışı',
    modelToggleFailed: 'Durum güncellenemedi',
    pipelineStarted: 'İşlem hattı başlatıldı',
    pipelineStartFailed: 'İşlem hattı başlatılamadı',
    generateStarted: 'Oluşturma başlatıldı',
    generateFailed: 'Oluşturma başarısız',
    generateSuccess: 'Başarıyla oluşturuldu',
  },
};

// ═══════════════════════════════════════════════════════════
// SPANISH LABELS
// ═══════════════════════════════════════════════════════════
export const esDashboardLabels: LanguageDashboardLabels = {
  title: 'Panel de Control de Producción Española',
  subtitle: 'Estadísticas, prompts, asignación de modelos y controles — organizado por tipo de contenido',
  localeFlag: '🇪🇸',
  dir: 'ltr',
  loading: 'Cargando...',
  tabs: {
    news: 'Noticias',
    reports: 'Informes',
    strategic: 'Estratégicos',
    infographic: 'Infografías',
    video: 'Videos',
  },
  subSections: {
    stats: 'Estadísticas',
    prompts: 'Prompts',
    models: 'Asignación de Modelo',
    controls: 'Controles',
    generate: 'Generar',
  },
  stats: {
    totalPublished: 'Total Publicados',
    todayPublished: 'Publicados Hoy',
    todayGen: 'Generados Hoy',
    thisWeek: 'Esta Semana',
    thisMonth: 'Este Mes',
    totalFetched: 'Total Obtenidos',
    successRate: 'Tasa de Éxito',
    byCategory: 'Por Categoría',
    byType: 'Por Tipo',
    byAssetClass: 'Por Clase de Activos',
    newsStages: 'Etapas de Noticias',
    pipelineSection: 'Estadísticas del Pipeline',
    published: 'Publicado',
    noStatsTitle: 'No hay datos estadísticos disponibles',
    noStatsSubtitle: 'Actualización automática cada 60 segundos',
  },
  prompts: {
    fetchGroup: 'Obtener Noticias',
    analyzeGroup: 'Analizar Noticias',
    translateGroup: 'Traducir Noticias',
    classifyGroup: 'Clasificar Noticias',
    otherGroup: 'Otros (Noticias)',
    reportsGroup: 'Informes',
    infographicGroup: 'Infografías',
    videoGroup: 'Videos',
    otherReportGroup: 'Otros',
    categoryReports: 'Informes por Categoría',
    noPrompts: 'No hay prompts disponibles para este tipo de contenido',
    source: 'Fuente',
    active: 'Activo',
    inactive: 'Inactivo',
    edit: 'Editar',
    save: 'Guardar',
    cancel: 'Cancelar',
    customBadge: 'Personalizado',
    customContent: 'Contenido personalizado',
    defaultContent: 'Código predeterminado',
  },
  models: {
    currentAssignment: 'Asignación de Modelo Actual',
    providers: 'Proveedores de IA',
    activeCount: 'Activos',
    available: 'Disponible',
    disabledManually: 'Desactivado manualmente',
    unavailable: 'No disponible',
    noApiKey: 'Sin clave API',
    enabled: 'Activado',
    disabledLabel: 'Desactivado',
    allMappings: 'Todas las Asignaciones del Pipeline',
    currentTab: 'Pestaña Actual',
    custom: 'Personalizado',
    default: 'Predeterminado',
    resetToDefault: 'Restablecer predeterminado',
    circuitBreakers: 'Estado de Disyuntores',
    open: 'Abierto — Protegido',
    closed: 'Cerrado — Funcionando',
    noModelsTitle: 'No hay datos de modelos disponibles',
  },
  pipeline: {
    status: 'Estado del Pipeline',
    running: 'Pipeline en Ejecución',
    stopped: 'Pipeline Detenido',
    cycle: 'Ciclo',
    published: 'Publicado',
    failed: 'Fallido',
    totalArticles: 'Total Artículos',
    ready: 'Listo',
    pending: 'Pendiente',
    translated: 'Traducido',
    analyzed: 'Analizado',
    imaged: 'Con Imagen',
    rejected: 'Rechazado',
    queueStatus: 'Estado de Cola',
    pendingJobs: 'Trabajos Pendientes',
    runningJobs: 'Trabajos en Ejecución',
    done24h: 'Completados (24h)',
    failed24h: 'Fallidos (24h)',
    productionLimits: 'Límites de Producción',
    dailyLimit: 'Límite Diario',
    hourlyLimit: 'Límite Por Hora',
    save: 'Guardar',
    startPipeline: 'Iniciar Pipeline',
    consecutiveErrors: 'errores consecutivos',
  },
  generate: {
    title: 'Generación de Contenido',
    triggerNewsPipeline: 'Activar Pipeline de Noticias',
    triggerNewsDesc: 'Obtener y procesar nuevos artículos desde las fuentes',
    fetchNews: 'Obtener Noticias',
    generateReport: 'Generar Informe',
    reportType: 'Tipo de Informe',
    assetClass: 'Clase de Activos',
    forceGenerate: 'Generación Forzada',
    asyncGenerate: 'Generación Asíncrona',
    generateBtn: 'Generar',
    generating: 'Generando...',
    generateAnalysis: 'Generar Análisis de Mercado',
    topic: 'Tema',
    topicPlaceholder: 'Ingrese el tema del informe estratégico',
    region: 'Región',
    regionPlaceholder: 'América Latina',
    sectors: 'Sectores',
    sourceType: 'Tipo de Fuente',
    sourceId: 'ID de Fuente',
    sourceIdPlaceholder: 'Ingrese el ID del contenido fuente',
    symbol: 'Símbolo',
    symbolPlaceholder: 'ej. AAPL',
    reportId: 'ID de Informe',
    reportIdPlaceholder: 'Ingrese el ID del informe fuente',
    marketImpact: 'Impacto de Mercado',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    special: 'Especial',
    strategicType: 'Estratégico',
    stocks: 'Acciones',
    commodities: 'Materias Primas',
    forex: 'Forex',
    crypto: 'Criptomonedas',
    bonds: 'Bonos',
    energy: 'Energía',
    realEstate: 'Bienes Raíces',
    economy: 'Economía',
    banking: 'Banca',
    technicalAnalysis: 'Análisis Técnico',
    arabMarkets: 'Mercados Árabes',
    earnings: 'Ganancias',
    sourceNews: 'Noticia',
    sourceEconomicReport: 'Informe Económico',
    sourceMarketAnalysis: 'Análisis de Mercado',
    selectType: 'Seleccionar tipo',
    selectAssetClass: 'Seleccionar clase de activos',
    customPrompt: 'Prompt Personalizado',
    customPromptPlaceholder: 'Dejar vacío para predeterminado',
    publishAfterGenerate: 'Publicar después de generar',
    generateAll: 'Generar Todo',
    generatingAll: 'Generando todo...',
    generatingCategory: 'Generando...',
    allCategories: 'Todas las Categorías',
    quickGenerate: 'Generación Rápida por Categoría',
    quickGenerateDesc: 'Haga clic en cualquier categoría para generar un informe/análisis instantáneamente',
  },
  toast: {
    limitsSaved: 'Límites de producción guardados',
    limitsSaveFailed: 'Error al guardar la configuración',
    connectionFailed: 'Error de conexión al servidor',
    promptSaved: 'Prompt guardado',
    promptSaveFailed: 'Error al guardar',
    promptEnabled: 'Prompt activado',
    promptDisabled: 'Prompt desactivado',
    promptToggleFailed: 'Error al actualizar',
    mappingUpdated: 'Asignación actualizada',
    mappingUpdateFailed: 'Error al actualizar la asignación',
    modelEnabled: 'Activado',
    modelDisabled: 'Desactivado',
    modelToggleFailed: 'Error al actualizar el estado',
    pipelineStarted: 'Pipeline iniciado',
    pipelineStartFailed: 'Error al iniciar el pipeline',
    generateStarted: 'Generación iniciada',
    generateFailed: 'Error en la generación',
    generateSuccess: 'Generado exitosamente',
  },
};
