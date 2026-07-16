// ─── مساعد رؤى — Type Definitions ──────────────────────────
// أنواع البيانات المشتركة لوكلاء القرار — PR#26 محدّث

export interface InvestorProfile {
  userId: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  preferredAssets: string[];
  preferredMarkets: string[];
  capitalRange: string;
  tradingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  interests: string[];
  excludedAssets: string[];
  minConfidenceScore: number;
  successRate: number;
  allowGeneralRecommendations: boolean;
}

export interface MarketContext {
  recentNews: Array<{
    id: string;
    title: string;
    category: string;
    sentiment: string;
    impactLevel: string;
    affectedAssets: string[];
    publishedAt: string;
  }>;
  activeSignals: Array<{
    id: string;
    pair: string;
    action: string;
    confidence: number;
    category: string;
    status: string;
    // حقول أسعار PR#23
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    riskReward?: number;
    timeframe?: string;
  }>;
  marketSentiment: {
    overall: string;
    sectors: Record<string, string>;
  };
  economicEvents: Array<{
    id: string;
    eventName: string;
    importance: string;
    eventDate: string;
    country: string;
  }>;
}

export interface ScoredReport {
  id: string;
  type: string;
  title: string;
  slug?: string;
  relevanceScore: number;  // 0-100
  urgencyScore: number;    // 0-100
  impactScore: number;     // 0-100
  reasons: string[];
  confidenceScore?: number;
  marketImpact?: string;
  assetClass?: string;
  // حقول جديدة PR#23: محتوى التقرير وأسعاره
  content?: string;          // محتوى التقرير الكامل أو ملخصه
  priceTarget?: string;      // JSON: {current, target, stopLoss}
  keyIndicators?: string;    // JSON: مؤشرات رئيسية
  riskLevel?: string;        // low | medium | high | extreme
  analysisType?: string;     // technical | fundamental | sentiment
  timeFrame?: string;        // intraday | daily | weekly | monthly
  sentiment?: string;        // bullish | bearish | neutral
}

export interface Recommendation {
  recommendationType: 'asset_focus' | 'market_opportunity' | 'risk_alert' | 'portfolio_rebalance' | 'educational';
  title: string;
  titleEn?: string;
  summary: string;
  reasoning: string;
  actionItems: string[];
  relatedAssetClasses: string[];
  relatedSymbols: string[];
  relatedReportIds: string[];
  relatedNewsIds: string[];
  confidenceScore: number;  // 0-100
  urgencyLevel: 'low' | 'normal' | 'high' | 'critical';
  validUntilHours: number;  // How long this recommendation is valid
  sourceData: Record<string, unknown>;

  // ─── حقول التوصية المتقدمة (PR#23) ────────────────────────
  reportId?: string;         // معرف التقرير المصدر
  reportSlug?: string;       // slug التقرير للرابط المباشر
  reportTitle?: string;      // عنوان التقرير للعرض السريع
  asset?: string;            // الأصل الموصى به (مثال: BTC/USD)
  action?: string;           // شراء | بيع | تجميع | مراقبة
  entryPrice?: string;       // سعر/مستوى الدخول
  targetPrice?: string;      // سعر الهدف
  stopLoss?: string;         // وقف الخسارة
  timeHorizon?: string;      // أفق زمني (مثال: أسبوعين)
  allocationPercent?: string; // نسبة التخصيص المقترحة (مثال: 5%)
}

export interface AdvisorResult {
  success: boolean;
  recommendations: Recommendation[];
  profileSnapshot: InvestorProfile;
  generatedAt: string;
  error?: string;
}

// ─── أنواع التغذية الراجعة (PR#23) ─────────────────────────

export type FeedbackType = 'executed' | 'ignored' | 'dismissed' | 'useful' | 'not_useful';

export interface FeedbackPayload {
  recommendationId: string;
  feedbackType: FeedbackType;
  executionPrice?: string;
  notes?: string;
}

export interface PortfolioMonitorResult {
  expiredCount: number;
  actionedCount: number;
  unreadCount: number;
  newAlerts: Recommendation[];
  reviewedCount: number;       // عدد التوصيات المراجعة
  updatedPnlCount: number;     // عدد التوصيات المحدّثة بربح/خسارة
  successRateChange: number;   // التغيير في معدل النجاح
}
