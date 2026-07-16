// ─── مساعد رؤى — Main Export (PR#23 → PR#25) ────────────────
// نقطة الدخول الرئيسية لنظام التوصيات الشخصية

export { analyzeProfile } from './profile-analyzer';
export { scoreReportsForProfile } from './report-scorer';
export { generateRecommendations, refreshRecommendationPrice } from './recommendation-engine';
export type { Locale } from './recommendation-engine';
export { monitorPortfolio, reviewExecutedRecommendations } from './portfolio-monitor';
export { runAdvisorForUser, runAdvisorForAllUsers, runPortfolioReviewForAllUsers } from './orchestrator';
export type * from './types';
