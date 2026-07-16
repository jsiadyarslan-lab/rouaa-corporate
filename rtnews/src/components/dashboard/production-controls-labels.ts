// ─── Production Controls Labels ──────────────────────────
// Locale-specific strings for the shared ProductionControls component

export interface AssetClassItem {
  id: string;
  name: string;
  color: string;
}

export interface SpecialEventItem {
  id: string;
  name: string;
  color: string;
}

export interface ProductionControlsLabels {
  title: string;
  subtitle: string;
  localeBadge: string;
  dir: 'rtl' | 'ltr';
  localeFlag: string;
  pipelineLocaleLabel: string;
  tabs: {
    stats: string;
    pipeline: string;
    reports: string;
    newsPrompts: string;
    reportPrompts: string;
    models: string;
  };
  stats: {
    publishedNews: string;
    publishedReports: string;
    infographics: string;
    videos: string;
    totalFetched: string;
    todayPublished: string;
    todayFetched: string;
    thisWeek: string;
    thisMonth: string;
    byStage: string;
    byCategory: string;
    successRate: string;
    avgDuration: string;
    pipelineRuns: string;
    completedRuns: string;
    failedRuns: string;
    lastRun: string;
    avgPerRun: string;
    newsSection: string;
    reportsSection: string;
    infographicsSection: string;
    videosSection: string;
    pipelineSection: string;
    noStatsTitle: string;
    noStatsSubtitle: string;
    top5Categories: string;
    newsStages: string;
    byType: string;
    byAssetClass: string;
    todayGen: string;
    weekGen: string;
    monthGen: string;
    published: string;
    today: string;
    sec: string;
    articlesPerDay: string;
    articlesPerHour: string;
  };
  prompts: {
    newsTitle: string;
    newsSubtitle: string;
    reportTitle: string;
    reportSubtitle: string;
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
    close: string;
    view: string;
    toggleActive: string;
    toggleInactive: string;
    defaultContent: string;
    customContent: string;
    customBadge: string;
    codeBadge: string;
    settingsBadge: string;
  };
  models: {
    providers: string;
    activeCount: string;
    available: string;
    disabledManually: string;
    unavailable: string;
    noApiKey: string;
    enabled: string;
    disabledLabel: string;
    pipelineMappings: string;
    mappingsCount: string;
    default: string;
    custom: string;
    circuitBreakers: string;
    circuitBreakersSubtitle: string;
    open: string;
    closed: string;
    openProtected: string;
    closedWorking: string;
    noModelsTitle: string;
  };
  pipeline: {
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
    pendingJobs: string;
    runningJobs: string;
    done24h: string;
    failed24h: string;
    productionLimits: string;
    dailyLimit: string;
    hourlyLimit: string;
    save: string;
    startPipeline: string;
  };
  reports: {
    schedule: string;
    scheduleHeader: string;
    scheduleSubtitle: string;
    temporalReports: string;
    temporalBadge: string;
    daily: string;
    weekly: string;
    monthly: string;
    quarterly: string;
    special: string;
    technicalAnalysis: string;
    strategic: string;
    enabled: string;
    disabled: string;
    manual: string;
    scheduled: string;
    timesPerDay: string;
    dayOfWeek: string;
    dayOfMonth: string;
    everyQuarter: string;
    auto3x: string;
    deepAnalysis: string;
    save: string;
    generate: string;
    generateAll: string;
    generateManual: string;
    manualCategoriesTitle: string;
    manualCategoriesSubtitle: string;
    marketAnalysesTitle: string;
    marketAnalysesBadge: string;
    quickGenTitle: string;
    quickGenBadge: string;
    specialEventsTitle: string;
    specialEventsBadge: string;
    strategicPageLink: string;
    clickToGenerate: string;
    lastGeneration: string;
    generating: string;
  };
  genModal: {
    title: string;
    titleLabel: string;
    typeLabel: string;
    assetClassLabel: string;
    specialEventLabel: string;
    wordCount: string;
    customPrompt: string;
    forceGenerate: string;
    autoPublish: string;
    summaryTitle: string;
    summaryType: string;
    summaryAsset: string;
    summaryEvent: string;
    summaryWords: string;
    summaryTitle2: string;
    summaryPublish: string;
    summaryYes: string;
    summaryNo: string;
    general: string;
    notSet: string;
    automatic: string;
    generateNow: string;
    generating: string;
  };
  genStatus: {
    completed: string;
    failed: string;
    running: string;
    queued: string;
    generationTimeout: string;
    generationFailedUnknown: string;
  };
  toast: {
    settingsSaved: string;
    settingsSaveFailed: string;
    reportGenerated: string;
    reportGenerateFailed: string;
    generationStarted: string;
    generationStartedBg: string;
    connectionFailed: string;
    limitsSaved: string;
    limitsSaveFailed: string;
    pipelineStarted: string;
    pipelineStartFailed: string;
    mappingUpdated: string;
    mappingUpdateFailed: string;
    modelEnabled: string;
    modelDisabled: string;
    modelToggleFailed: string;
    promptSaved: string;
    promptSaveFailed: string;
    promptDisabled: string;
    promptEnabled: string;
    promptToggleFailed: string;
    generationComplete: string;
    generationFailed: string;
    generationTimeout: string;
  };
  daysOfWeek: string[];
  assetClasses: AssetClassItem[];
  specialEvents: SpecialEventItem[];
  noneOption: string;
  reportTypes: {
    daily: string;
    weekly: string;
    monthly: string;
    quarterly: string;
    special: string;
  };
}

// ═══════════════════════════════════════════════════════════
// ARABIC LABELS
// ═══════════════════════════════════════════════════════════
export const arLabels: ProductionControlsLabels = {
  title: 'التحكم بإنتاج العربي',
  subtitle: 'التحكم بخط الإنتاج العربي — العدادات والأنابيب والبرومبتات والنماذج',
  localeBadge: 'locale=ar',
  dir: 'rtl',
  localeFlag: '🇸🇦',
  pipelineLocaleLabel: 'خط الإنتاج العربي',
  tabs: {
    stats: 'لوحة العدادات',
    pipeline: 'حالة الأنابيب',
    reports: 'جدول التقارير',
    newsPrompts: 'برومبتات الأخبار',
    reportPrompts: 'برومبتات التقارير',
    models: 'تعيين النماذج',
  },
  stats: {
    publishedNews: 'أخبار منشورة',
    publishedReports: 'تقارير منشورة',
    infographics: 'إنفوغرافيك',
    videos: 'فيديوهات',
    totalFetched: 'إجمالي الجلب',
    todayPublished: 'نشر اليوم',
    todayFetched: 'جلب اليوم',
    thisWeek: 'نشر الأسبوع',
    thisMonth: 'نشر الشهر',
    byStage: 'مراحل الأخبار',
    byCategory: 'أعلى 5 تصنيفات',
    successRate: 'معدل النجاح',
    avgDuration: 'متوسط مدة الجلب',
    pipelineRuns: 'إجمالي التشغيل',
    completedRuns: 'مكتملة',
    failedRuns: 'فاشلة',
    lastRun: 'آخر تشغيل',
    avgPerRun: 'متوسط مقالات/تشغيل',
    newsSection: 'إحصائيات الأخبار',
    reportsSection: 'إحصائيات التقارير',
    infographicsSection: 'الإنفوغرافيك',
    videosSection: 'الفيديوهات',
    pipelineSection: 'إحصائيات الأنابيب',
    noStatsTitle: 'لا توجد بيانات إحصائية متاحة حالياً',
    noStatsSubtitle: 'سيتم التحميل تلقائياً كل 60 ثانية',
    top5Categories: 'أعلى 5 تصنيفات',
    newsStages: 'مراحل الأخبار',
    byType: 'حسب النوع',
    byAssetClass: 'حسب فئة الأصول',
    todayGen: 'توليد اليوم',
    weekGen: 'توليد الأسبوع',
    monthGen: 'توليد الشهر',
    published: 'منشور',
    today: 'اليوم',
    sec: 'ث',
    articlesPerDay: 'مقال / يوم',
    articlesPerHour: 'مقال / ساعة',
  },
  prompts: {
    newsTitle: 'برومبتات الأخبار',
    newsSubtitle: 'برومبتات جلب وتحليل وترجمة وتصنيف الأخبار',
    reportTitle: 'برومبتات التقارير',
    reportSubtitle: 'برومبتات التقارير والإنفوغرافيك والفيديو',
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
    noPrompts: 'لا توجد برومبتات متاحة',
    source: 'المصدر',
    active: 'مفعّل',
    inactive: 'معطّل',
    edit: 'تعديل',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    view: 'عرض',
    toggleActive: 'تم تعطيل البرومبت',
    toggleInactive: 'تم تفعيل البرومبت',
    defaultContent: 'كود',
    customContent: 'إعدادات',
    customBadge: 'مخصّص',
    codeBadge: 'كود',
    settingsBadge: 'إعدادات',
  },
  models: {
    providers: 'مزودو الذكاء الاصطناعي',
    activeCount: 'فعّال',
    available: 'متاح',
    disabledManually: 'معطّل يدوياً',
    unavailable: 'غير متاح',
    noApiKey: 'لا مفتاح API',
    enabled: 'مفعّل',
    disabledLabel: 'معطّل',
    pipelineMappings: 'خط الإنتاج',
    mappingsCount: 'تعيين',
    default: 'الافتراضي',
    custom: 'مخصّص',
    circuitBreakers: 'حالة قواطع الدائرة',
    circuitBreakersSubtitle: 'حماية تلقائية ضد الأعطال',
    open: 'مفتوح — محمي',
    closed: 'مغلق — يعمل',
    openProtected: 'مفتوح — محمي',
    closedWorking: 'مغلق — يعمل',
    noModelsTitle: 'لا توجد بيانات نماذج متاحة حالياً',
  },
  pipeline: {
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
    pendingJobs: 'مهام منتظرة',
    runningJobs: 'مهام جارية',
    done24h: 'مكتملة (24س)',
    failed24h: 'فاشلة (24س)',
    productionLimits: 'حدود الإنتاج',
    dailyLimit: 'الحد اليومي',
    hourlyLimit: 'الحد الساعي',
    save: 'حفظ',
    startPipeline: 'تشغيل الأنابيب',
  },
  reports: {
    schedule: 'جدول التقارير',
    scheduleHeader: 'آلية توليد التقارير — جميع التصنيفات',
    scheduleSubtitle: '5 أنواع زمنية + 10 تصنيفات أصول + 10 أحداث خاصة = 25 مسار توليد',
    temporalReports: 'التقارير الزمنية',
    temporalBadge: '5 أنواع',
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    quarterly: 'فصلي',
    special: 'خاص',
    technicalAnalysis: 'تحليل فني',
    strategic: 'استراتيجي',
    enabled: 'مفعّل',
    disabled: 'متوقف',
    manual: 'يدوي',
    scheduled: 'مجدول',
    timesPerDay: '/يوم',
    dayOfWeek: 'كل',
    dayOfMonth: 'يوم',
    everyQuarter: 'كل ربع سنة',
    auto3x: '3x/يوم تلقائي',
    deepAnalysis: 'تحليل معمّق مخصص',
    save: 'حفظ الإعدادات',
    generate: 'توليد',
    generateAll: 'توليد الكل',
    generateManual: 'توليد تقرير يدوي',
    manualCategoriesTitle: 'تحليلات الأسواق — توليد يدوي كل ٦ ساعات',
    manualCategoriesSubtitle: '',
    marketAnalysesTitle: 'تحليلات الأسواق حسب التصنيف',
    marketAnalysesBadge: '10 تصنيفات',
    quickGenTitle: 'التحليلات حسب فئة الأصول',
    quickGenBadge: 'توليد سريع',
    specialEventsTitle: 'تقارير الأحداث الخاصة',
    specialEventsBadge: '10 أحداث',
    strategicPageLink: 'صفحة التقرير الاستراتيجي',
    clickToGenerate: 'اضغط للتوليد',
    lastGeneration: 'آخر توليد',
    generating: 'جارٍ...',
  },
  genModal: {
    title: 'توليد تقرير يدوي',
    titleLabel: 'عنوان التقرير (اختياري)',
    typeLabel: 'نوع التقرير',
    assetClassLabel: 'تصنيف الأصول (اختياري)',
    specialEventLabel: 'نوع الحدث الخاص',
    wordCount: 'عدد الكلمات',
    customPrompt: 'توجيه مخصص للذكاء الاصطناعي (اختياري)',
    forceGenerate: 'توليد بالقوة',
    autoPublish: 'نشر تلقائي',
    summaryTitle: 'ملخص التوليد',
    summaryType: 'النوع',
    summaryAsset: 'التصنيف',
    summaryEvent: 'الحدث',
    summaryWords: 'الكلمات',
    summaryTitle2: 'العنوان',
    summaryPublish: 'النشر',
    summaryYes: 'نعم',
    summaryNo: 'لا',
    general: 'عام',
    notSet: 'غير محدد',
    automatic: 'تلقائي',
    generateNow: 'توليد التقرير الآن',
    generating: 'جارٍ التوليد...',
  },
  genStatus: {
    completed: '✅ اكتمل التوليد',
    failed: '❌ فشل التوليد',
    running: '⏳ جارٍ التوليد...',
    queued: '⏳ في قائمة الانتظار...',
    generationTimeout: 'انتهت مهلة التوليد',
    generationFailedUnknown: 'خطأ غير معروف',
  },
  toast: {
    settingsSaved: 'تم حفظ إعدادات التقارير بنجاح',
    settingsSaveFailed: 'فشل حفظ الإعدادات',
    reportGenerated: 'تم توليد التقرير بنجاح',
    reportGenerateFailed: 'فشل توليد التقرير',
    generationStarted: 'تم بدء توليد التقرير في الخلفية',
    generationStartedBg: 'تم بدء توليد التقرير في الخلفية',
    connectionFailed: 'فشل الاتصال بالخادم',
    limitsSaved: 'تم حفظ حدود الإنتاج',
    limitsSaveFailed: 'فشل حفظ الإعدادات',
    pipelineStarted: 'تم تشغيل الأنابيب',
    pipelineStartFailed: 'فشل تشغيل الأنابيب',
    mappingUpdated: 'تم تحديث التعيين',
    mappingUpdateFailed: 'فشل تحديث التعيين',
    modelEnabled: 'مفعّل',
    modelDisabled: 'معطّل',
    modelToggleFailed: 'فشل تحديث الحالة',
    promptSaved: 'تم حفظ البرومبت',
    promptSaveFailed: 'فشل الحفظ',
    promptDisabled: 'تم تعطيل البرومبت',
    promptEnabled: 'تم تفعيل البرومبت',
    promptToggleFailed: 'فشل التحديث',
    generationComplete: 'تم توليد التقرير بنجاح!',
    generationFailed: 'فشل التوليد',
    generationTimeout: 'انتهت مهلة التوليد',
  },
  daysOfWeek: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  assetClasses: [
    { id: 'stocks', name: 'الأسهم', color: '#00E5FF' },
    { id: 'commodities', name: 'السلع', color: '#D4AF37' },
    { id: 'forex', name: 'الفوركس', color: '#8B5CF6' },
    { id: 'crypto', name: 'العملات الرقمية', color: '#F59E0B' },
    { id: 'bonds', name: 'السندات', color: '#22C55E' },
    { id: 'energy', name: 'الطاقة', color: '#EF5350' },
    { id: 'economy', name: 'الاقتصاد', color: '#3BA7F0' },
    { id: 'banking', name: 'البنوك', color: '#A78BFA' },
    { id: 'technicalAnalysis', name: 'تحليل فني', color: '#00C896' },
    { id: 'earnings', name: 'أرباح الشركات', color: '#FB923C' },
  ],
  specialEvents: [
    { id: 'fomc', name: 'اجتماع الفيدرالي (FOMC)', color: '#00E5FF' },
    { id: 'opec', name: 'اجتماع أوبك', color: '#EF5350' },
    { id: 'nfp', name: 'بيانات التوظيف (NFP)', color: '#22C55E' },
    { id: 'cpi', name: 'بيانات التضخم (CPI)', color: '#F59E0B' },
    { id: 'gdp', name: 'الناتج المحلي (GDP)', color: '#8B5CF6' },
    { id: 'ecb', name: 'البنك المركزي الأوروبي', color: '#3BA7F0' },
    { id: 'boj', name: 'بنك اليابان', color: '#A78BFA' },
    { id: 'fed-chairs', name: 'تصريحات رئيس الفيدرالي', color: '#D4AF37' },
    { id: 'geopolitical', name: 'تطورات جيوسياسية', color: '#FB923C' },
    { id: 'oil-shock', name: 'صدمة نفطية', color: '#EF5350' },
  ],
  noneOption: 'بدون',
  reportTypes: {
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    quarterly: 'فصلي',
    special: 'خاص',
  },
};

// ═══════════════════════════════════════════════════════════
// ENGLISH LABELS
// ═══════════════════════════════════════════════════════════
export const enLabels: ProductionControlsLabels = {
  title: 'English Production Controls',
  subtitle: 'English production line — stats, pipeline, prompts & models',
  localeBadge: 'locale=en',
  dir: 'ltr',
  localeFlag: '🇬🇧',
  pipelineLocaleLabel: 'English Production Line',
  tabs: {
    stats: 'Statistics Dashboard',
    pipeline: 'Pipeline Status',
    reports: 'Report Schedule',
    newsPrompts: 'News Prompts',
    reportPrompts: 'Report Prompts',
    models: 'Model Assignment',
  },
  stats: {
    publishedNews: 'Published News',
    publishedReports: 'Published Reports',
    infographics: 'Infographics',
    videos: 'Videos',
    totalFetched: 'Total Fetched',
    todayPublished: 'Published Today',
    todayFetched: 'Fetched Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    byStage: 'News Stages',
    byCategory: 'Top 5 Categories',
    successRate: 'Success Rate',
    avgDuration: 'Avg Fetch Duration',
    pipelineRuns: 'Total Runs',
    completedRuns: 'Completed',
    failedRuns: 'Failed',
    lastRun: 'Last Run',
    avgPerRun: 'Avg Articles/Run',
    newsSection: 'News Statistics',
    reportsSection: 'Report Statistics',
    infographicsSection: 'Infographics',
    videosSection: 'Videos',
    pipelineSection: 'Pipeline Statistics',
    noStatsTitle: 'No statistics data available',
    noStatsSubtitle: 'Auto-refresh every 60 seconds',
    top5Categories: 'Top 5 Categories',
    newsStages: 'News Stages',
    byType: 'By Type',
    byAssetClass: 'By Asset Class',
    todayGen: 'Generated Today',
    weekGen: 'Generated This Week',
    monthGen: 'Generated This Month',
    published: 'Published',
    today: 'Today',
    sec: 's',
    articlesPerDay: 'articles / day',
    articlesPerHour: 'articles / hour',
  },
  prompts: {
    newsTitle: 'News Prompts',
    newsSubtitle: 'Fetch, analyze, translate & classify news prompts',
    reportTitle: 'Report Prompts',
    reportSubtitle: 'Reports, infographic & video prompts',
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
    noPrompts: 'No prompts available',
    source: 'Source',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    view: 'View',
    toggleActive: 'Prompt disabled',
    toggleInactive: 'Prompt enabled',
    defaultContent: 'Code',
    customContent: 'Settings',
    customBadge: 'Custom',
    codeBadge: 'Code',
    settingsBadge: 'Settings',
  },
  models: {
    providers: 'AI Providers',
    activeCount: 'Active',
    available: 'Available',
    disabledManually: 'Manually disabled',
    unavailable: 'Unavailable',
    noApiKey: 'No API key',
    enabled: 'Enabled',
    disabledLabel: 'Disabled',
    pipelineMappings: 'Production Line',
    mappingsCount: 'mappings',
    default: 'Default',
    custom: 'Custom',
    circuitBreakers: 'Circuit Breaker Status',
    circuitBreakersSubtitle: 'Automatic fault protection',
    open: 'Open — Protected',
    closed: 'Closed — Working',
    openProtected: 'Open — Protected',
    closedWorking: 'Closed — Working',
    noModelsTitle: 'No model data available',
  },
  pipeline: {
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
    pendingJobs: 'Pending Jobs',
    runningJobs: 'Running Jobs',
    done24h: 'Done (24h)',
    failed24h: 'Failed (24h)',
    productionLimits: 'Production Limits',
    dailyLimit: 'Daily Limit',
    hourlyLimit: 'Hourly Limit',
    save: 'Save',
    startPipeline: 'Start Pipeline',
  },
  reports: {
    schedule: 'Report Schedule',
    scheduleHeader: 'Report Generation — All Categories',
    scheduleSubtitle: '5 temporal types + 10 asset classes + 10 special events = 25 generation paths',
    temporalReports: 'Temporal Reports',
    temporalBadge: '5 types',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    special: 'Special',
    technicalAnalysis: 'Technical Analysis',
    strategic: 'Strategic',
    enabled: 'Enabled',
    disabled: 'Disabled',
    manual: 'Manual',
    scheduled: 'Scheduled',
    timesPerDay: '/day',
    dayOfWeek: 'Every',
    dayOfMonth: 'Day',
    everyQuarter: 'Every quarter',
    auto3x: '3x/day auto',
    deepAnalysis: 'Custom deep analysis',
    save: 'Save Settings',
    generate: 'Generate',
    generateAll: 'Generate All',
    generateManual: 'Manual Report Generation',
    manualCategoriesTitle: 'Market Analyses — Manual generation every 6 hours',
    manualCategoriesSubtitle: '',
    marketAnalysesTitle: 'Market Analyses by Category',
    marketAnalysesBadge: '10 categories',
    quickGenTitle: 'Analyses by Asset Class',
    quickGenBadge: 'Quick Generate',
    specialEventsTitle: 'Special Event Reports',
    specialEventsBadge: '10 events',
    strategicPageLink: 'Strategic Report Page',
    clickToGenerate: 'Click to generate',
    lastGeneration: 'Last generated',
    generating: 'Generating...',
  },
  genModal: {
    title: 'Manual Report Generation',
    titleLabel: 'Report title (optional)',
    typeLabel: 'Report type',
    assetClassLabel: 'Asset class (optional)',
    specialEventLabel: 'Special event type',
    wordCount: 'Word count',
    customPrompt: 'Custom AI prompt (optional)',
    forceGenerate: 'Force generate',
    autoPublish: 'Auto publish',
    summaryTitle: 'Generation Summary',
    summaryType: 'Type',
    summaryAsset: 'Asset',
    summaryEvent: 'Event',
    summaryWords: 'Words',
    summaryTitle2: 'Title',
    summaryPublish: 'Publish',
    summaryYes: 'Yes',
    summaryNo: 'No',
    general: 'General',
    notSet: 'Not set',
    automatic: 'Automatic',
    generateNow: 'Generate Report Now',
    generating: 'Generating...',
  },
  genStatus: {
    completed: '✅ Generation Complete',
    failed: '❌ Generation Failed',
    running: '⏳ Generating...',
    queued: '⏳ Queued...',
    generationTimeout: 'Generation timed out',
    generationFailedUnknown: 'Unknown error',
  },
  toast: {
    settingsSaved: 'Report settings saved successfully',
    settingsSaveFailed: 'Failed to save settings',
    reportGenerated: 'Report generated successfully',
    reportGenerateFailed: 'Failed to generate report',
    generationStarted: 'Report generation started',
    generationStartedBg: 'Report generation started in background',
    connectionFailed: 'Server connection failed',
    limitsSaved: 'Production limits saved',
    limitsSaveFailed: 'Failed to save settings',
    pipelineStarted: 'Pipeline started',
    pipelineStartFailed: 'Failed to start pipeline',
    mappingUpdated: 'Mapping updated',
    mappingUpdateFailed: 'Failed to update mapping',
    modelEnabled: 'Enabled',
    modelDisabled: 'Disabled',
    modelToggleFailed: 'Failed to update status',
    promptSaved: 'Prompt saved',
    promptSaveFailed: 'Failed to save',
    promptDisabled: 'Prompt disabled',
    promptEnabled: 'Prompt enabled',
    promptToggleFailed: 'Failed to update',
    generationComplete: 'Report generated successfully!',
    generationFailed: 'Generation failed',
    generationTimeout: 'Generation timed out',
  },
  daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  assetClasses: [
    { id: 'stocks', name: 'Stocks', color: '#00E5FF' },
    { id: 'commodities', name: 'Commodities', color: '#D4AF37' },
    { id: 'forex', name: 'Forex', color: '#8B5CF6' },
    { id: 'crypto', name: 'Crypto', color: '#F59E0B' },
    { id: 'bonds', name: 'Bonds', color: '#22C55E' },
    { id: 'energy', name: 'Energy', color: '#EF5350' },
    { id: 'economy', name: 'Economy', color: '#3BA7F0' },
    { id: 'banking', name: 'Banking', color: '#A78BFA' },
    { id: 'technicalAnalysis', name: 'Tech. Analysis', color: '#00C896' },
    { id: 'earnings', name: 'Earnings', color: '#FB923C' },
  ],
  specialEvents: [
    { id: 'fomc', name: 'FOMC', color: '#00E5FF' },
    { id: 'opec', name: 'OPEC', color: '#EF5350' },
    { id: 'nfp', name: 'NFP', color: '#22C55E' },
    { id: 'cpi', name: 'CPI', color: '#F59E0B' },
    { id: 'gdp', name: 'GDP', color: '#8B5CF6' },
    { id: 'ecb', name: 'ECB', color: '#3BA7F0' },
    { id: 'boj', name: 'BOJ', color: '#A78BFA' },
    { id: 'fed-chairs', name: 'Fed Chair', color: '#D4AF37' },
    { id: 'geopolitical', name: 'Geopolitical', color: '#FB923C' },
    { id: 'oil-shock', name: 'Oil Shock', color: '#EF5350' },
  ],
  noneOption: 'None',
  reportTypes: {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    special: 'Special',
  },
};

// ═══════════════════════════════════════════════════════════
// FRENCH LABELS
// ═══════════════════════════════════════════════════════════
export const frLabels: ProductionControlsLabels = {
  title: 'Contrôles de Production Français',
  subtitle: 'Ligne de production française — stats, pipeline, prompts & modèles',
  localeBadge: 'locale=fr',
  dir: 'ltr',
  localeFlag: '🇫🇷',
  pipelineLocaleLabel: 'Ligne de Production Française',
  tabs: {
    stats: 'Tableau de Bord',
    pipeline: 'État du Pipeline',
    reports: 'Programmation des Rapports',
    newsPrompts: 'Prompts Actualités',
    reportPrompts: 'Prompts Rapports',
    models: 'Attribution des Modèles',
  },
  stats: {
    publishedNews: 'Actualités Publiées',
    publishedReports: 'Rapports Publiés',
    infographics: 'Infographies',
    videos: 'Vidéos',
    totalFetched: 'Total Récupéré',
    todayPublished: 'Publié Aujourd\'hui',
    todayFetched: 'Récupéré Aujourd\'hui',
    thisWeek: 'Cette Semaine',
    thisMonth: 'Ce Mois',
    byStage: 'Étapes Actualités',
    byCategory: 'Top 5 Catégories',
    successRate: 'Taux de Réussite',
    avgDuration: 'Durée Moy. Récup.',
    pipelineRuns: 'Total Exécutions',
    completedRuns: 'Terminées',
    failedRuns: 'Échouées',
    lastRun: 'Dernière Exéc.',
    avgPerRun: 'Moy. Articles/Exéc.',
    newsSection: 'Statistiques Actualités',
    reportsSection: 'Statistiques Rapports',
    infographicsSection: 'Infographies',
    videosSection: 'Vidéos',
    pipelineSection: 'Statistiques Pipeline',
    noStatsTitle: 'Aucune donnée statistique disponible',
    noStatsSubtitle: 'Actualisation automatique toutes les 60 secondes',
    top5Categories: 'Top 5 Catégories',
    newsStages: 'Étapes Actualités',
    byType: 'Par Type',
    byAssetClass: 'Par Classe d\'Actifs',
    todayGen: 'Généré Aujourd\'hui',
    weekGen: 'Généré Cette Semaine',
    monthGen: 'Généré Ce Mois',
    published: 'Publié',
    today: 'Aujourd\'hui',
    sec: 's',
    articlesPerDay: 'articles / jour',
    articlesPerHour: 'articles / heure',
  },
  prompts: {
    newsTitle: 'Prompts Actualités',
    newsSubtitle: 'Prompts de récupération, analyse, traduction & classification des actualités',
    reportTitle: 'Prompts Rapports',
    reportSubtitle: 'Prompts de rapports, infographies & vidéos',
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
    noPrompts: 'Aucun prompt disponible',
    source: 'Source',
    active: 'Actif',
    inactive: 'Inactif',
    edit: 'Modifier',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    view: 'Voir',
    toggleActive: 'Prompt désactivé',
    toggleInactive: 'Prompt activé',
    defaultContent: 'Code',
    customContent: 'Paramètres',
    customBadge: 'Personnalisé',
    codeBadge: 'Code',
    settingsBadge: 'Paramètres',
  },
  models: {
    providers: 'Fournisseurs IA',
    activeCount: 'Actif',
    available: 'Disponible',
    disabledManually: 'Désactivé manuellement',
    unavailable: 'Indisponible',
    noApiKey: 'Pas de clé API',
    enabled: 'Activé',
    disabledLabel: 'Désactivé',
    pipelineMappings: 'Ligne de Production',
    mappingsCount: 'mappings',
    default: 'Par défaut',
    custom: 'Personnalisé',
    circuitBreakers: 'État des Disjoncteurs',
    circuitBreakersSubtitle: 'Protection automatique contre les pannes',
    open: 'Ouvert — Protégé',
    closed: 'Fermé — Actif',
    openProtected: 'Ouvert — Protégé',
    closedWorking: 'Fermé — Actif',
    noModelsTitle: 'Aucune donnée de modèle disponible',
  },
  pipeline: {
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
    pendingJobs: 'Tâches en Attente',
    runningJobs: 'Tâches en Cours',
    done24h: 'Terminé (24h)',
    failed24h: 'Échoué (24h)',
    productionLimits: 'Limites de Production',
    dailyLimit: 'Limite Quotidienne',
    hourlyLimit: 'Limite Horaire',
    save: 'Enregistrer',
    startPipeline: 'Démarrer le Pipeline',
  },
  reports: {
    schedule: 'Programmation des Rapports',
    scheduleHeader: 'Génération des Rapports — Toutes Catégories',
    scheduleSubtitle: '5 types temporels + 10 classes d\'actifs + 10 événements spéciaux = 25 chemins de génération',
    temporalReports: 'Rapports Temporels',
    temporalBadge: '5 types',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    special: 'Spécial',
    technicalAnalysis: 'Analyse Technique',
    strategic: 'Stratégique',
    enabled: 'Activé',
    disabled: 'Désactivé',
    manual: 'Manuel',
    scheduled: 'Programmé',
    timesPerDay: '/jour',
    dayOfWeek: 'Chaque',
    dayOfMonth: 'Jour',
    everyQuarter: 'Chaque trimestre',
    auto3x: '3x/jour auto',
    deepAnalysis: 'Analyse approfondie personnalisée',
    save: 'Enregistrer les Paramètres',
    generate: 'Générer',
    generateAll: 'Tout Générer',
    generateManual: 'Génération Manuelle de Rapport',
    manualCategoriesTitle: 'Analyses de Marché — Génération manuelle toutes les 6 heures',
    manualCategoriesSubtitle: '',
    marketAnalysesTitle: 'Analyses de Marché par Catégorie',
    marketAnalysesBadge: '10 catégories',
    quickGenTitle: 'Analyses par Classe d\'Actifs',
    quickGenBadge: 'Génération Rapide',
    specialEventsTitle: 'Rapports Événements Spéciaux',
    specialEventsBadge: '10 événements',
    strategicPageLink: 'Page Rapport Stratégique',
    clickToGenerate: 'Cliquez pour générer',
    lastGeneration: 'Dernière génération',
    generating: 'Génération...',
  },
  genModal: {
    title: 'Génération Manuelle de Rapport',
    titleLabel: 'Titre du rapport (optionnel)',
    typeLabel: 'Type de rapport',
    assetClassLabel: 'Classe d\'actifs (optionnel)',
    specialEventLabel: 'Type d\'événement spécial',
    wordCount: 'Nombre de mots',
    customPrompt: 'Prompt IA personnalisé (optionnel)',
    forceGenerate: 'Forcer la génération',
    autoPublish: 'Publication auto',
    summaryTitle: 'Résumé de Génération',
    summaryType: 'Type',
    summaryAsset: 'Actif',
    summaryEvent: 'Événement',
    summaryWords: 'Mots',
    summaryTitle2: 'Titre',
    summaryPublish: 'Publier',
    summaryYes: 'Oui',
    summaryNo: 'Non',
    general: 'Général',
    notSet: 'Non défini',
    automatic: 'Automatique',
    generateNow: 'Générer le Rapport Maintenant',
    generating: 'Génération en cours...',
  },
  genStatus: {
    completed: '✅ Génération Terminée',
    failed: '❌ Génération Échouée',
    running: '⏳ Génération en cours...',
    queued: '⏳ En file d\'attente...',
    generationTimeout: 'Délai de génération dépassé',
    generationFailedUnknown: 'Erreur inconnue',
  },
  toast: {
    settingsSaved: 'Paramètres des rapports enregistrés avec succès',
    settingsSaveFailed: 'Échec de l\'enregistrement des paramètres',
    reportGenerated: 'Rapport généré avec succès',
    reportGenerateFailed: 'Échec de la génération du rapport',
    generationStarted: 'Génération du rapport démarrée',
    generationStartedBg: 'Génération du rapport démarrée en arrière-plan',
    connectionFailed: 'Échec de la connexion au serveur',
    limitsSaved: 'Limites de production enregistrées',
    limitsSaveFailed: 'Échec de l\'enregistrement des paramètres',
    pipelineStarted: 'Pipeline démarré',
    pipelineStartFailed: 'Échec du démarrage du pipeline',
    mappingUpdated: 'Mapping mis à jour',
    mappingUpdateFailed: 'Échec de la mise à jour du mapping',
    modelEnabled: 'Activé',
    modelDisabled: 'Désactivé',
    modelToggleFailed: 'Échec de la mise à jour du statut',
    promptSaved: 'Prompt enregistré',
    promptSaveFailed: 'Échec de l\'enregistrement',
    promptDisabled: 'Prompt désactivé',
    promptEnabled: 'Prompt activé',
    promptToggleFailed: 'Échec de la mise à jour',
    generationComplete: 'Rapport généré avec succès !',
    generationFailed: 'Échec de la génération',
    generationTimeout: 'Délai de génération dépassé',
  },
  daysOfWeek: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  assetClasses: [
    { id: 'stocks', name: 'Actions', color: '#00E5FF' },
    { id: 'commodities', name: 'Matières Premières', color: '#D4AF37' },
    { id: 'forex', name: 'Forex', color: '#8B5CF6' },
    { id: 'crypto', name: 'Crypto', color: '#F59E0B' },
    { id: 'bonds', name: 'Obligations', color: '#22C55E' },
    { id: 'energy', name: 'Énergie', color: '#EF5350' },
    { id: 'economy', name: 'Économie', color: '#3BA7F0' },
    { id: 'banking', name: 'Banque', color: '#A78BFA' },
    { id: 'technicalAnalysis', name: 'Analyse Tech.', color: '#00C896' },
    { id: 'earnings', name: 'Résultats', color: '#FB923C' },
  ],
  specialEvents: [
    { id: 'fomc', name: 'FOMC', color: '#00E5FF' },
    { id: 'opec', name: 'OPEP', color: '#EF5350' },
    { id: 'nfp', name: 'NFP', color: '#22C55E' },
    { id: 'cpi', name: 'IPC', color: '#F59E0B' },
    { id: 'gdp', name: 'PIB', color: '#8B5CF6' },
    { id: 'ecb', name: 'BCE', color: '#3BA7F0' },
    { id: 'boj', name: 'BJ', color: '#A78BFA' },
    { id: 'fed-chairs', name: 'Président Fed', color: '#D4AF37' },
    { id: 'geopolitical', name: 'Géopolitique', color: '#FB923C' },
    { id: 'oil-shock', name: 'Choc Pétrolier', color: '#EF5350' },
  ],
  noneOption: 'Aucun',
  reportTypes: {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    special: 'Spécial',
  },
};

// ═══════════════════════════════════════════════════════════
// TURKISH LABELS
// ═══════════════════════════════════════════════════════════
export const trLabels: ProductionControlsLabels = {
  title: 'Türkçe Üretim Kontrolleri',
  subtitle: 'Türkçe üretim hattı — istatistikler, işlem hattı, promptlar ve modeller',
  localeBadge: 'locale=tr',
  dir: 'ltr',
  localeFlag: '🇹🇷',
  pipelineLocaleLabel: 'Türkçe Üretim Hattı',
  tabs: {
    stats: 'Kontrol Paneli',
    pipeline: 'İşlem Hattı Durumu',
    reports: 'Rapor Programı',
    newsPrompts: 'Haber Promptları',
    reportPrompts: 'Rapor Promptları',
    models: 'Model Ataması',
  },
  stats: {
    publishedNews: 'Yayınlanan Haberler',
    publishedReports: 'Yayınlanan Raporlar',
    infographics: 'İnfografikler',
    videos: 'Videolar',
    totalFetched: 'Toplam Çekilen',
    todayPublished: 'Bugün Yayınlanan',
    todayFetched: 'Bugün Çekilen',
    thisWeek: 'Bu Hafta',
    thisMonth: 'Bu Ay',
    byStage: 'Haber Aşamaları',
    byCategory: 'İlk 5 Kategori',
    successRate: 'Başarı Oranı',
    avgDuration: 'Ort. Çekme Süresi',
    pipelineRuns: 'Toplam Çalıştırma',
    completedRuns: 'Tamamlanan',
    failedRuns: 'Başarısız',
    lastRun: 'Son Çalıştırma',
    avgPerRun: 'Ort. Makale/Çalıştırma',
    newsSection: 'Haber İstatistikleri',
    reportsSection: 'Rapor İstatistikleri',
    infographicsSection: 'İnfografikler',
    videosSection: 'Videolar',
    pipelineSection: 'İşlem Hattı İstatistikleri',
    noStatsTitle: 'İstatistik verisi mevcut değil',
    noStatsSubtitle: '60 saniyede otomatik yenilenir',
    top5Categories: 'İlk 5 Kategori',
    newsStages: 'Haber Aşamaları',
    byType: 'Türe Göre',
    byAssetClass: 'Varlık Sınıfına Göre',
    todayGen: 'Bugün Oluşturulan',
    weekGen: 'Bu Hafta Oluşturulan',
    monthGen: 'Bu Ay Oluşturulan',
    published: 'Yayınlanan',
    today: 'Bugün',
    sec: 'sn',
    articlesPerDay: 'makale / gün',
    articlesPerHour: 'makale / saat',
  },
  prompts: {
    newsTitle: 'Haber Promptları',
    newsSubtitle: 'Haber çekme, analiz, çeviri ve sınıflandırma promptları',
    reportTitle: 'Rapor Promptları',
    reportSubtitle: 'Rapor, infografik ve video promptları',
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
    noPrompts: 'Prompt mevcut değil',
    source: 'Kaynak',
    active: 'Aktif',
    inactive: 'İnaktif',
    edit: 'Düzenle',
    save: 'Kaydet',
    cancel: 'İptal',
    close: 'Kapat',
    view: 'Görüntüle',
    toggleActive: 'Prompt devre dışı bırakıldı',
    toggleInactive: 'Prompt etkinleştirildi',
    defaultContent: 'Kod',
    customContent: 'Ayarlar',
    customBadge: 'Özel',
    codeBadge: 'Kod',
    settingsBadge: 'Ayarlar',
  },
  models: {
    providers: 'Yapay Zeka Sağlayıcıları',
    activeCount: 'Aktif',
    available: 'Kullanılabilir',
    disabledManually: 'Manuel devre dışı',
    unavailable: 'Kullanılamaz',
    noApiKey: 'API anahtarı yok',
    enabled: 'Etkin',
    disabledLabel: 'Devre Dışı',
    pipelineMappings: 'Üretim Hattı',
    mappingsCount: 'atama',
    default: 'Varsayılan',
    custom: 'Özel',
    circuitBreakers: 'Devre Kesici Durumu',
    circuitBreakersSubtitle: 'Otomatik arıza koruması',
    open: 'Açık — Korumalı',
    closed: 'Kapalı — Çalışıyor',
    openProtected: 'Açık — Korumalı',
    closedWorking: 'Kapalı — Çalışıyor',
    noModelsTitle: 'Model verisi mevcut değil',
  },
  pipeline: {
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
    pendingJobs: 'Bekleyen İşler',
    runningJobs: 'Çalışan İşler',
    done24h: 'Tamamlanan (24s)',
    failed24h: 'Başarısız (24s)',
    productionLimits: 'Üretim Limitleri',
    dailyLimit: 'Günlük Limit',
    hourlyLimit: 'Saatlik Limit',
    save: 'Kaydet',
    startPipeline: 'İşlem Hattını Başlat',
  },
  reports: {
    schedule: 'Rapor Programı',
    scheduleHeader: 'Rapor Oluşturma — Tüm Kategoriler',
    scheduleSubtitle: '5 zamansal tür + 10 varlık sınıfı + 10 özel etkinlik = 25 oluşturma yolu',
    temporalReports: 'Zamansal Raporlar',
    temporalBadge: '5 tür',
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    quarterly: 'Üç Aylık',
    special: 'Özel',
    technicalAnalysis: 'Teknik Analiz',
    strategic: 'Stratejik',
    enabled: 'Etkin',
    disabled: 'Devre Dışı',
    manual: 'Manuel',
    scheduled: 'Planlanmış',
    timesPerDay: '/gün',
    dayOfWeek: 'Her',
    dayOfMonth: 'Gün',
    everyQuarter: 'Her çeyrek',
    auto3x: '3x/gün otomatik',
    deepAnalysis: 'Özel derin analiz',
    save: 'Ayarları Kaydet',
    generate: 'Oluştur',
    generateAll: 'Tümünü Oluştur',
    generateManual: 'Manuel Rapor Oluşturma',
    manualCategoriesTitle: 'Piyasa Analizleri — 6 saatte bir manuel oluşturma',
    manualCategoriesSubtitle: '',
    marketAnalysesTitle: 'Kategoriye Göre Piyasa Analizleri',
    marketAnalysesBadge: '10 kategori',
    quickGenTitle: 'Varlık Sınıfına Göre Analizler',
    quickGenBadge: 'Hızlı Oluştur',
    specialEventsTitle: 'Özel Etkinlik Raporları',
    specialEventsBadge: '10 etkinlik',
    strategicPageLink: 'Stratejik Rapor Sayfası',
    clickToGenerate: 'Oluşturmak için tıklayın',
    lastGeneration: 'Son oluşturma',
    generating: 'Oluşturuluyor...',
  },
  genModal: {
    title: 'Manuel Rapor Oluşturma',
    titleLabel: 'Rapor başlığı (isteğe bağlı)',
    typeLabel: 'Rapor türü',
    assetClassLabel: 'Varlık sınıfı (isteğe bağlı)',
    specialEventLabel: 'Özel etkinlik türü',
    wordCount: 'Kelime sayısı',
    customPrompt: 'Özel yapay zeka promptu (isteğe bağlı)',
    forceGenerate: 'Zorla oluştur',
    autoPublish: 'Otomatik yayınla',
    summaryTitle: 'Oluşturma Özeti',
    summaryType: 'Tür',
    summaryAsset: 'Varlık',
    summaryEvent: 'Etkinlik',
    summaryWords: 'Kelime',
    summaryTitle2: 'Başlık',
    summaryPublish: 'Yayınla',
    summaryYes: 'Evet',
    summaryNo: 'Hayır',
    general: 'Genel',
    notSet: 'Ayarlanmadı',
    automatic: 'Otomatik',
    generateNow: 'Raporu Şimdi Oluştur',
    generating: 'Oluşturuluyor...',
  },
  genStatus: {
    completed: '✅ Oluşturma Tamamlandı',
    failed: '❌ Oluşturma Başarısız',
    running: '⏳ Oluşturuluyor...',
    queued: '⏳ Sırada bekliyor...',
    generationTimeout: 'Oluşturma zaman aşımına uğradı',
    generationFailedUnknown: 'Bilinmeyen hata',
  },
  toast: {
    settingsSaved: 'Rapor ayarları başarıyla kaydedildi',
    settingsSaveFailed: 'Ayarlar kaydedilemedi',
    reportGenerated: 'Rapor başarıyla oluşturuldu',
    reportGenerateFailed: 'Rapor oluşturma başarısız',
    generationStarted: 'Rapor oluşturma başlatıldı',
    generationStartedBg: 'Rapor oluşturma arka planda başlatıldı',
    connectionFailed: 'Sunucu bağlantısı başarısız',
    limitsSaved: 'Üretim limitleri kaydedildi',
    limitsSaveFailed: 'Ayarlar kaydedilemedi',
    pipelineStarted: 'İşlem hattı başlatıldı',
    pipelineStartFailed: 'İşlem hattı başlatılamadı',
    mappingUpdated: 'Atama güncellendi',
    mappingUpdateFailed: 'Atama güncellenemedi',
    modelEnabled: 'Etkin',
    modelDisabled: 'Devre Dışı',
    modelToggleFailed: 'Durum güncellenemedi',
    promptSaved: 'Prompt kaydedildi',
    promptSaveFailed: 'Kaydetme başarısız',
    promptDisabled: 'Prompt devre dışı bırakıldı',
    promptEnabled: 'Prompt etkinleştirildi',
    promptToggleFailed: 'Güncelleme başarısız',
    generationComplete: 'Rapor başarıyla oluşturuldu!',
    generationFailed: 'Oluşturma başarısız',
    generationTimeout: 'Oluşturma zaman aşımına uğradı',
  },
  daysOfWeek: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  assetClasses: [
    { id: 'stocks', name: 'Hisseler', color: '#00E5FF' },
    { id: 'commodities', name: 'Emtialar', color: '#D4AF37' },
    { id: 'forex', name: 'Forex', color: '#8B5CF6' },
    { id: 'crypto', name: 'Kripto', color: '#F59E0B' },
    { id: 'bonds', name: 'Tahviller', color: '#22C55E' },
    { id: 'energy', name: 'Enerji', color: '#EF5350' },
    { id: 'economy', name: 'Ekonomi', color: '#3BA7F0' },
    { id: 'banking', name: 'Bankacılık', color: '#A78BFA' },
    { id: 'technicalAnalysis', name: 'Teknik Analiz', color: '#00C896' },
    { id: 'earnings', name: 'Kazançlar', color: '#FB923C' },
  ],
  specialEvents: [
    { id: 'fomc', name: 'FOMC', color: '#00E5FF' },
    { id: 'opec', name: 'OPEC', color: '#EF5350' },
    { id: 'nfp', name: 'NFP', color: '#22C55E' },
    { id: 'cpi', name: 'TÜFE', color: '#F59E0B' },
    { id: 'gdp', name: 'GSYH', color: '#8B5CF6' },
    { id: 'ecb', name: 'ECB', color: '#3BA7F0' },
    { id: 'boj', name: 'BOJ', color: '#A78BFA' },
    { id: 'fed-chairs', name: 'Fed Başkanı', color: '#D4AF37' },
    { id: 'geopolitical', name: 'Jeopolitik', color: '#FB923C' },
    { id: 'oil-shock', name: 'Petrol Şoku', color: '#EF5350' },
  ],
  noneOption: 'Yok',
  reportTypes: {
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    quarterly: 'Üç Aylık',
    special: 'Özel',
  },
};
