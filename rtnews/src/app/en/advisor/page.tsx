// ─── English Ru'aa AI Advisor Page ────────────────────────────────
// Full implementation mirrors the Arabic advisor page with English translations
// Design is identical to the Arabic version — LTR direction

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dynamicImport from 'next/dynamic';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Shield,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  X,
  ChevronDown,
  BarChart3,
  Target,
  Lightbulb,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  BellOff,
  Clock,
  DollarSign,
  Award,
  TrendingDown,
  Eye,
  Activity,
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: string;
  title: string;
  titleEn?: string;
  summary: string;
  reasoning: string;
  actionItems: string[];
  relatedAssetClasses: string[];
  relatedSymbols: string[];
  confidenceScore: number;
  urgencyLevel: string;
  validFrom: string;
  validUntil: string;
  isRead: boolean;
  isActioned: boolean;
  createdAt: string;
  reportId?: string;
  reportSlug?: string;
  reportTitle?: string;
  asset?: string;
  action?: string;
  entryPrice?: string;
  targetPrice?: string;
  stopLoss?: string;
  timeHorizon?: string;
  allocationPercent?: string;
  feedbackType?: string;
  executedAt?: string;
  executionPrice?: string;
  actualProfitLoss?: number;
  isSuccessful?: boolean;
  sourceData?: {
    livePrice?: number;
    priceSource?: string;
    targetChangePercent?: string;
    stopLossChangePercent?: string;
    livePriceUnavailable?: boolean;
  };
}

interface Profile {
  experienceLevel: string;
  riskTolerance: string;
  investmentHorizon: string;
  onboardingComplete: boolean;
  advisorEnabled: boolean;
  lastAdvisorRun: string | null;
  preferredAssets?: string[];
  excludedAssets?: string[];
  minConfidenceScore?: number;
  successRate?: number;
  allowGeneralRecommendations?: boolean;
}

interface Stats {
  total: number;
  unread: number;
  critical: number;
  high: number;
  actioned: number;
  estimatedSuccessRate: number;
}

// V229→V341: Trading Operations Room Dashboard (unified — locale prop)
const TradingOpsDashboard = dynamicImport(() => import('@/components/advisor/TradingOpsDashboard'), {
  ssr: false,
});

const TEXT: Record<string, Record<string, string>> = {
  en: {
    'activateAdvisor': "Activate Ru'aa Advisor",
    'activateDesc': 'Complete the quick setup to receive personalized investment recommendations based on your profile and goals',
    'startSetup': 'Start Setup',
    'opsRoom': "Ru'aa Operations Room",
    'opsRoomDesc': 'Trader Dashboard — Live Data & Smart Recommendations',
    'updating': 'Updating...',
    'refreshPrices': 'Refresh Prices',
    'generating': 'Generating...',
    'newRecommendations': 'New Recommendations',
    'smartRecommendations': 'Smart Recommendations',
    'activeRecs': 'Active Recommendations',
    'unread': 'Unread',
    'urgentCritical': 'Urgent/Critical',
    'executed': 'Executed',
    'successRate': 'Success Rate',
    'riskTolerance': 'Risk Tolerance:',
    'conservative': 'Conservative',
    'aggressive': 'Aggressive',
    'moderate': 'Moderate',
    'experience': 'Experience:',
    'beginner': 'Beginner',
    'professional': 'Professional',
    'advanced': 'Advanced',
    'intermediate': 'Intermediate',
    'assets': 'Assets:',
    'assetCrypto': 'Crypto',
    'assetForex': 'Forex',
    'assetCommodities': 'Commodities',
    'assetRealEstate': 'Real Estate',
    'assetStocks': 'Stocks',
    'assetIndices': 'Indices',
    'successRateLabel': 'Success Rate:',
    'generalRecs': 'General Recommendations ✓',
    'personalizedOnly': 'Personalized Only',
    'editProfile': 'Edit Profile →',
    'filterAll': 'All',
    'filterUnread': 'Unread',
    'filterUrgent': 'Urgent',
    'loadingRecs': 'Loading recommendations...',
    'noRecsYet': 'No recommendations yet',
    'noRecsEmpty': 'Click "New Recommendations" to generate personalized recommendations based on reports and your preferred markets',
    'noRecsCategory': 'No new recommendations in',
    'categoryOr': 'or',
    'enableGeneralOrEdit': 'category. You can enable "General Recommendations" or edit your interests.',
    'tryChangingFilter': 'Try changing the filter or wait for new reports to generate different recommendations',
    'generateRecs': 'Generate Recommendations',
    'enableGeneralRecs': 'Enable General Recommendations',
    'recOn': 'Recommendation on',
    'entry': 'Entry:',
    'target': 'Target:',
    'stopLoss': 'Stop Loss:',
    'allocation': 'Allocation:',
    'livePrices': 'Live Prices',
    'readFullReport': 'Read Full Report',
    'confidence': 'Confidence:',
    'low': 'Low',
    'btnExecuted': 'Executed',
    'useful': 'Useful',
    'notUseful': 'Not Useful',
    'ignore': 'Ignore',
    'targetHit': 'Target Hit',
    'targetNotYetHit': 'Target Not Yet Hit',
    'reasoning': 'Reasoning',
    'actionItems': 'Action Items',
    'relatedSymbols': 'Related Symbols',
    'relatedAssetClasses': 'Related Asset Classes',
    'recordExecution': 'Record Execution',
    'enterExecutionPrice': 'Enter the execution price for this recommendation on',
    'confirmExecution': 'Confirm Execution',
    'cancel': 'Cancel',
    'typeAssetFocus': 'Asset Focus',
    'typeMarketOpportunity': 'Market Opportunity',
    'typeRiskAlert': 'Risk Alert',
    'typeRebalance': 'Rebalance',
    'typeEducational': 'Educational',
    'actionBuy': 'Buy',
    'actionSell': 'Sell',
    'actionAccumulate': 'Accumulate',
    'actionMonitor': 'Monitor',
    'urgencyLow': 'Low',
    'urgencyNormal': 'Normal',
    'urgencyHigh': 'High',
    'urgencyCritical': 'Critical',
    'feedbackExecuted': 'Executed',
    'feedbackIgnored': 'Ignored',
    'feedbackDismissed': 'Dismissed',
    'feedbackUseful': 'Useful',
    'feedbackNotUseful': 'Not Useful',
  },
  es: {
    'activateAdvisor': "Activar Asesor de Ru'aa",
    'activateDesc': 'Completa la configuración rápida para recibir recomendaciones de inversión personalizadas basadas en tu perfil y objetivos',
    'startSetup': 'Iniciar Configuración',
    'opsRoom': "Sala de Operaciones de Ru'aa",
    'opsRoomDesc': 'Panel del Trader — Datos en Vivo y Recomendaciones Inteligentes',
    'updating': 'Actualizando...',
    'refreshPrices': 'Actualizar Precios',
    'generating': 'Generando...',
    'newRecommendations': 'Nuevas Recomendaciones',
    'smartRecommendations': 'Recomendaciones Inteligentes',
    'activeRecs': 'Recomendaciones Activas',
    'unread': 'No Leídas',
    'urgentCritical': 'Urgente/Crítico',
    'executed': 'Ejecutadas',
    'successRate': 'Tasa de Éxito',
    'riskTolerance': 'Tolerancia al Riesgo:',
    'conservative': 'Conservador',
    'aggressive': 'Agresivo',
    'moderate': 'Moderado',
    'experience': 'Experiencia:',
    'beginner': 'Principiante',
    'professional': 'Profesional',
    'advanced': 'Avanzado',
    'intermediate': 'Intermedio',
    'assets': 'Activos:',
    'assetCrypto': 'Cripto',
    'assetForex': 'Forex',
    'assetCommodities': 'Materias Primas',
    'assetRealEstate': 'Bienes Raíces',
    'assetStocks': 'Acciones',
    'assetIndices': 'Índices',
    'successRateLabel': 'Tasa de Éxito:',
    'generalRecs': 'Recomendaciones Generales ✓',
    'personalizedOnly': 'Solo Personalizadas',
    'editProfile': 'Editar Perfil →',
    'filterAll': 'Todas',
    'filterUnread': 'No Leídas',
    'filterUrgent': 'Urgente',
    'loadingRecs': 'Cargando recomendaciones...',
    'noRecsYet': 'Aún no hay recomendaciones',
    'noRecsEmpty': 'Haz clic en "Nuevas Recomendaciones" para generar recomendaciones personalizadas basadas en informes y tus mercados preferidos',
    'noRecsCategory': 'No hay nuevas recomendaciones en la categoría',
    'categoryOr': 'o',
    'enableGeneralOrEdit': 'Puedes activar "Recomendaciones Generales" o editar tus intereses.',
    'tryChangingFilter': 'Intenta cambiar el filtro o espera nuevos informes para generar diferentes recomendaciones',
    'generateRecs': 'Generar Recomendaciones',
    'enableGeneralRecs': 'Activar Recomendaciones Generales',
    'recOn': 'Recomendación sobre',
    'entry': 'Entrada:',
    'target': 'Objetivo:',
    'stopLoss': 'Stop Loss:',
    'allocation': 'Asignación:',
    'livePrices': 'Precios en Vivo',
    'readFullReport': 'Leer Informe Completo',
    'confidence': 'Confianza:',
    'low': 'Baja',
    'btnExecuted': 'Ejecutado',
    'useful': 'Útil',
    'notUseful': 'No Útil',
    'ignore': 'Ignorar',
    'targetHit': 'Objetivo Alcanzado',
    'targetNotYetHit': 'Objetivo No Alcanzado Aún',
    'reasoning': 'Razonamiento',
    'actionItems': 'Pasos a Seguir',
    'relatedSymbols': 'Símbolos Relacionados',
    'relatedAssetClasses': 'Clases de Activos Relacionadas',
    'recordExecution': 'Registrar Ejecución',
    'enterExecutionPrice': 'Ingresa el precio de ejecución para esta recomendación sobre',
    'confirmExecution': 'Confirmar Ejecución',
    'cancel': 'Cancelar',
    'typeAssetFocus': 'Enfoque de Activos',
    'typeMarketOpportunity': 'Oportunidad de Mercado',
    'typeRiskAlert': 'Alerta de Riesgo',
    'typeRebalance': 'Reequilibrar',
    'typeEducational': 'Educativo',
    'actionBuy': 'Comprar',
    'actionSell': 'Vender',
    'actionAccumulate': 'Acumular',
    'actionMonitor': 'Monitorear',
    'urgencyLow': 'Baja',
    'urgencyNormal': 'Normal',
    'urgencyHigh': 'Alta',
    'urgencyCritical': 'Crítica',
    'feedbackExecuted': 'Ejecutado',
    'feedbackIgnored': 'Ignorado',
    'feedbackDismissed': 'Descartado',
    'feedbackUseful': 'Útil',
    'feedbackNotUseful': 'No Útil',
  },
  ar: {
    'activateAdvisor': "تفعيل مستشار رؤية",
    'activateDesc': 'أكمل الإعداد السريع لتلقي توصيات استثمارية مخصصة بناءً على ملفك وأهدافك',
    'startSetup': 'بدء الإعداد',
    'opsRoom': "غرفة عمليات رؤية",
    'opsRoomDesc': 'لوحة المتداول — بيانات مباشرة وتوصيات ذكية',
    'updating': 'جارٍ التحديث...',
    'refreshPrices': 'تحديث الأسعار',
    'generating': 'جارٍ التوليد...',
    'newRecommendations': 'توصيات جديدة',
    'smartRecommendations': 'توصيات ذكية',
    'activeRecs': 'توصيات نشطة',
    'unread': 'غير مقروءة',
    'urgentCritical': 'عاجل/حرج',
    'executed': 'منفذة',
    'successRate': 'نسبة النجاح',
    'riskTolerance': 'تحمل المخاطر:',
    'conservative': 'محافظ',
    'aggressive': 'عدواني',
    'moderate': 'معتدل',
    'experience': 'الخبرة:',
    'beginner': 'مبتدئ',
    'professional': 'محترف',
    'advanced': 'متقدم',
    'intermediate': 'متوسط',
    'assets': 'الأصول:',
    'assetCrypto': 'عملات رقمية',
    'assetForex': 'فوركس',
    'assetCommodities': 'سلع',
    'assetRealEstate': 'عقارات',
    'assetStocks': 'أسهم',
    'assetIndices': 'مؤشرات',
    'successRateLabel': 'نسبة النجاح:',
    'generalRecs': 'توصيات عامة ✓',
    'personalizedOnly': 'مخصصة فقط',
    'editProfile': 'تعديل الملف ←',
    'filterAll': 'الكل',
    'filterUnread': 'غير مقروءة',
    'filterUrgent': 'عاجل',
    'loadingRecs': 'جارٍ تحميل التوصيات...',
    'noRecsYet': 'لا توجد توصيات بعد',
    'noRecsEmpty': 'انقر على "توصيات جديدة" لإنشاء توصيات مخصصة بناءً على التقارير والأسواق المفضلة لديك',
    'noRecsCategory': 'لا توجد توصيات جديدة في فئة',
    'categoryOr': 'أو',
    'enableGeneralOrEdit': 'يمكنك تفعيل "التوصيات العامة" أو تعديل اهتماماتك.',
    'tryChangingFilter': 'حاول تغيير الفلتر أو انتظر تقارير جديدة لتوليد توصيات مختلفة',
    'generateRecs': 'توليد التوصيات',
    'enableGeneralRecs': 'تفعيل التوصيات العامة',
    'recOn': 'توصية على',
    'entry': 'الدخول:',
    'target': 'الهدف:',
    'stopLoss': 'وقف الخسارة:',
    'allocation': 'التخصيص:',
    'livePrices': 'أسعار مباشرة',
    'readFullReport': 'قراءة التقرير الكامل',
    'confidence': 'الثقة:',
    'low': 'منخفض',
    'btnExecuted': 'تم التنفيذ',
    'useful': 'مفيد',
    'notUseful': 'غير مفيد',
    'ignore': 'تجاهل',
    'targetHit': 'تم بلوغ الهدف',
    'targetNotYetHit': 'لم يُبلغ الهدف بعد',
    'reasoning': 'السببية',
    'actionItems': 'خطوات التنفيذ',
    'relatedSymbols': 'الرموز ذات الصلة',
    'relatedAssetClasses': 'فئات الأصول ذات الصلة',
    'recordExecution': 'تسجيل التنفيذ',
    'enterExecutionPrice': 'أدخل سعر التنفيذ لهذه التوصية على',
    'confirmExecution': 'تأكيد التنفيذ',
    'cancel': 'إلغاء',
    'typeAssetFocus': 'تركيز الأصول',
    'typeMarketOpportunity': 'فرصة سوقية',
    'typeRiskAlert': 'تنبيه مخاطر',
    'typeRebalance': 'إعادة التوازن',
    'typeEducational': 'تعليمي',
    'actionBuy': 'شراء',
    'actionSell': 'بيع',
    'actionAccumulate': 'تجميع',
    'actionMonitor': 'مراقبة',
    'urgencyLow': 'منخفض',
    'urgencyNormal': 'عادي',
    'urgencyHigh': 'مرتفع',
    'urgencyCritical': 'حرج',
    'feedbackExecuted': 'تم التنفيذ',
    'feedbackIgnored': 'تم التجاهل',
    'feedbackDismissed': 'تم الرفض',
    'feedbackUseful': 'مفيد',
    'feedbackNotUseful': 'غير مفيد',
  },
  fr: {
    'activateAdvisor': "Activer le Conseiller Ru'aa",
    'activateDesc': 'Complétez la configuration rapide pour recevoir des recommandations d\'investissement personnalisées basées sur votre profil et vos objectifs',
    'startSetup': 'Démarrer la configuration',
    'opsRoom': "Salle des Opérations Ru'aa",
    'opsRoomDesc': 'Tableau de bord Trader — Données en direct et Recommandations intelligentes',
    'updating': 'Mise à jour...',
    'refreshPrices': 'Actualiser les prix',
    'generating': 'Génération...',
    'newRecommendations': 'Nouvelles Recommandations',
    'smartRecommendations': 'Recommandations Intelligentes',
    'activeRecs': 'Recommandations Actives',
    'unread': 'Non lues',
    'urgentCritical': 'Urgent/Critique',
    'executed': 'Exécutées',
    'successRate': 'Taux de réussite',
    'riskTolerance': 'Tolérance au risque :',
    'conservative': 'Conservateur',
    'aggressive': 'Agressif',
    'moderate': 'Modéré',
    'experience': 'Expérience :',
    'beginner': 'Débutant',
    'professional': 'Professionnel',
    'advanced': 'Avancé',
    'intermediate': 'Intermédiaire',
    'assets': 'Actifs :',
    'assetCrypto': 'Crypto',
    'assetForex': 'Forex',
    'assetCommodities': 'Matières premières',
    'assetRealEstate': 'Immobilier',
    'assetStocks': 'Actions',
    'assetIndices': 'Indices',
    'successRateLabel': 'Taux de réussite :',
    'generalRecs': 'Recommandations Générales ✓',
    'personalizedOnly': 'Personnalisées uniquement',
    'editProfile': 'Modifier le profil →',
    'filterAll': 'Toutes',
    'filterUnread': 'Non lues',
    'filterUrgent': 'Urgentes',
    'loadingRecs': 'Chargement des recommandations...',
    'noRecsYet': 'Aucune recommandation pour le moment',
    'noRecsEmpty': 'Cliquez sur "Nouvelles Recommandations" pour générer des recommandations personnalisées basées sur les rapports et vos marchés préférés',
    'noRecsCategory': 'Aucune nouvelle recommandation dans la catégorie',
    'categoryOr': 'ou',
    'enableGeneralOrEdit': 'Vous pouvez activer les "Recommandations Générales" ou modifier vos intérêts.',
    'tryChangingFilter': 'Essayez de changer le filtre ou attendez de nouveaux rapports pour générer différentes recommandations',
    'generateRecs': 'Générer des Recommandations',
    'enableGeneralRecs': 'Activer les Recommandations Générales',
    'recOn': 'Recommandation sur',
    'entry': 'Entrée :',
    'target': 'Objectif :',
    'stopLoss': 'Stop Loss :',
    'allocation': 'Allocation :',
    'livePrices': 'Prix en direct',
    'readFullReport': 'Lire le rapport complet',
    'confidence': 'Confiance :',
    'low': 'Faible',
    'btnExecuted': 'Exécuté',
    'useful': 'Utile',
    'notUseful': 'Pas utile',
    'ignore': 'Ignorer',
    'targetHit': 'Objectif atteint',
    'targetNotYetHit': 'Objectif non encore atteint',
    'reasoning': 'Raisonnement',
    'actionItems': 'Actions à entreprendre',
    'relatedSymbols': 'Symboles associés',
    'relatedAssetClasses': "Classes d'actifs associées",
    'recordExecution': 'Enregistrer l\'exécution',
    'enterExecutionPrice': 'Entrez le prix d\'exécution pour cette recommandation sur',
    'confirmExecution': "Confirmer l'exécution",
    'cancel': 'Annuler',
    'typeAssetFocus': "Focus d'actifs",
    'typeMarketOpportunity': 'Opportunité de marché',
    'typeRiskAlert': 'Alerte de risque',
    'typeRebalance': 'Rééquilibrer',
    'typeEducational': 'Éducatif',
    'actionBuy': 'Acheter',
    'actionSell': 'Vendre',
    'actionAccumulate': 'Accumuler',
    'actionMonitor': 'Surveiller',
    'urgencyLow': 'Faible',
    'urgencyNormal': 'Normale',
    'urgencyHigh': 'Élevée',
    'urgencyCritical': 'Critique',
    'feedbackExecuted': 'Exécuté',
    'feedbackIgnored': 'Ignoré',
    'feedbackDismissed': 'Rejeté',
    'feedbackUseful': 'Utile',
    'feedbackNotUseful': 'Pas utile',
  },
  tr: {
    'activateAdvisor': "Ru'aa Danışmanını Etkinleştir",
    'activateDesc': 'Profilinize ve hedeflerinize dayalı kişiselleştirilmiş yatırım önerileri almak için hızlı kurulumu tamamlayın',
    'startSetup': 'Kurulumu Başlat',
    'opsRoom': "Ru'aa Operasyon Odası",
    'opsRoomDesc': 'Trader Paneli — Canlı Veri ve Akıllı Öneriler',
    'updating': 'Güncelleniyor...',
    'refreshPrices': 'Fiyatları Yenile',
    'generating': 'Oluşturuluyor...',
    'newRecommendations': 'Yeni Öneriler',
    'smartRecommendations': 'Akıllı Öneriler',
    'activeRecs': 'Aktif Öneriler',
    'unread': 'Okunmamış',
    'urgentCritical': 'Acil/Kritik',
    'executed': 'Gerçekleştirilen',
    'successRate': 'Başarı Oranı',
    'riskTolerance': 'Risk Toleransı:',
    'conservative': 'Muhafazakar',
    'aggressive': 'Agresif',
    'moderate': 'Orta',
    'experience': 'Deneyim:',
    'beginner': 'Başlangıç',
    'professional': 'Profesyonel',
    'advanced': 'İleri',
    'intermediate': 'Orta',
    'assets': 'Varlıklar:',
    'assetCrypto': 'Kripto',
    'assetForex': 'Forex',
    'assetCommodities': 'Emtia',
    'assetRealEstate': 'Gayrimenkul',
    'assetStocks': 'Hisse Senetleri',
    'assetIndices': 'Endeksler',
    'successRateLabel': 'Başarı Oranı:',
    'generalRecs': 'Genel Öneriler ✓',
    'personalizedOnly': 'Sadece Kişiselleştirilmiş',
    'editProfile': 'Profili Düzenle →',
    'filterAll': 'Tümü',
    'filterUnread': 'Okunmamış',
    'filterUrgent': 'Acil',
    'loadingRecs': 'Öneriler yükleniyor...',
    'noRecsYet': 'Henüz öneri yok',
    'noRecsEmpty': 'Raporlara ve tercih ettiğiniz piyasalara dayalı kişiselleştirilmiş öneriler oluşturmak için "Yeni Öneriler"e tıklayın',
    'noRecsCategory': 'Kategoride yeni öneri yok',
    'categoryOr': 'veya',
    'enableGeneralOrEdit': '"Genel Öneriler"i etkinleştirebilir veya ilgi alanlarınızı düzenleyebilirsiniz.',
    'tryChangingFilter': 'Filtreyi değiştirmeyi deneyin veya farklı öneriler oluşturmak için yeni raporları bekleyin',
    'generateRecs': 'Öneri Oluştur',
    'enableGeneralRecs': 'Genel Önerileri Etkinleştir',
    'recOn': 'Üzerine öneri',
    'entry': 'Giriş:',
    'target': 'Hedef:',
    'stopLoss': 'Zarar Durdurma:',
    'allocation': 'Tahsis:',
    'livePrices': 'Canlı Fiyatlar',
    'readFullReport': 'Tam Raporu Oku',
    'confidence': 'Güven:',
    'low': 'Düşük',
    'btnExecuted': 'Gerçekleştirildi',
    'useful': 'Faydalı',
    'notUseful': 'Faydalı Değil',
    'ignore': 'Yoksay',
    'targetHit': 'Hedefe Ulaşıldı',
    'targetNotYetHit': 'Henüz Hedefe Ulaşılmadı',
    'reasoning': 'Gerekçe',
    'actionItems': 'Yapılacaklar',
    'relatedSymbols': 'İlgili Semboller',
    'relatedAssetClasses': 'İlgili Varlık Sınıfları',
    'recordExecution': 'İşlemi Kaydet',
    'enterExecutionPrice': 'Bu öneri için işlem fiyatını girin',
    'confirmExecution': 'İşlemi Onayla',
    'cancel': 'İptal',
    'typeAssetFocus': 'Varlık Odak',
    'typeMarketOpportunity': 'Piyasa Fırsatı',
    'typeRiskAlert': 'Risk Uyarısı',
    'typeRebalance': 'Yeniden Dengeleme',
    'typeEducational': 'Eğitim',
    'actionBuy': 'Al',
    'actionSell': 'Sat',
    'actionAccumulate': 'Biriktir',
    'actionMonitor': 'İzle',
    'urgencyLow': 'Düşük',
    'urgencyNormal': 'Normal',
    'urgencyHigh': 'Yüksek',
    'urgencyCritical': 'Kritik',
    'feedbackExecuted': 'Gerçekleştirildi',
    'feedbackIgnored': 'Yoksayıldı',
    'feedbackDismissed': 'Reddedildi',
    'feedbackUseful': 'Faydalı',
    'feedbackNotUseful': 'Faydalı Değil',
  },
};

// Helper to get text
const T = (locale: string, key: string): string => TEXT[locale]?.[key] || TEXT.en[key] || key;

function getTypeConfig(locale: string): Record<string, { icon: any; label: string; color: string }> {
  return {
    asset_focus: { icon: Target, label: T(locale, 'typeAssetFocus'), color: '#00E5FF' },
    market_opportunity: { icon: TrendingUp, label: T(locale, 'typeMarketOpportunity'), color: '#22C55E' },
    risk_alert: { icon: AlertTriangle, label: T(locale, 'typeRiskAlert'), color: '#EF5350' },
    portfolio_rebalance: { icon: BarChart3, label: T(locale, 'typeRebalance'), color: '#FFB800' },
    educational: { icon: BookOpen, label: T(locale, 'typeEducational'), color: '#8B5CF6' },
  };
}

// Support both Arabic (from DB) and English action keys
function getActionConfig(locale: string): Record<string, { label: string; color: string; icon: any }> {
  return {
    'buy': { label: T(locale, 'actionBuy'), color: '#22C55E', icon: TrendingUp },
    'sell': { label: T(locale, 'actionSell'), color: '#EF5350', icon: TrendingDown },
    'accumulate': { label: T(locale, 'actionAccumulate'), color: '#00E5FF', icon: TrendingUp },
    'monitor': { label: T(locale, 'actionMonitor'), color: '#FFB800', icon: Eye },
    'شراء': { label: T(locale, 'actionBuy'), color: '#22C55E', icon: TrendingUp },
    'بيع': { label: T(locale, 'actionSell'), color: '#EF5350', icon: TrendingDown },
    'تجميع': { label: T(locale, 'actionAccumulate'), color: '#00E5FF', icon: TrendingUp },
    'مراقبة': { label: T(locale, 'actionMonitor'), color: '#FFB800', icon: Eye },
  };
}

function getUrgencyLabels(locale: string): Record<string, { label: string; color: string }> {
  return {
    low: { label: T(locale, 'urgencyLow'), color: '#64748B' },
    normal: { label: T(locale, 'urgencyNormal'), color: '#00E5FF' },
    high: { label: T(locale, 'urgencyHigh'), color: '#FFB800' },
    critical: { label: T(locale, 'urgencyCritical'), color: '#EF5350' },
  };
}

export default function EnAdvisorPage({ locale = 'en' }: { locale?: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, unread: 0, critical: 0, high: 0, actioned: 0, estimatedSuccessRate: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState<string | null>(null);
  const [executionPriceInput, setExecutionPriceInput] = useState('');
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  const TYPE_CONFIG = getTypeConfig(locale);
  const ACTION_CONFIG = getActionConfig(locale);
  const URGENCY_LABELS = getUrgencyLabels(locale);

  const getUserId = useCallback((): string | null => {
    if (session?.user?.id) {
      localStorage.setItem('rouaa_user_id', session.user.id);
      return session.user.id;
    }
    return localStorage.getItem('rouaa_user_id');
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem('rouaa_user_id', session.user.id);
    }
  }, [session]);

  const fetchRecommendations = useCallback(async () => {
    try {
      try {
        await fetch('/api/advisor/setup', { method: 'POST' });
      } catch {}

      const userId = getUserId();
      if (!userId) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/advisor?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setProfile(data.profile);
        setStats(data.stats || { total: 0, unread: 0, critical: 0, high: 0, actioned: 0, estimatedSuccessRate: 0 });

        if (!data.profile || !data.profile.onboardingComplete) {
          setNeedsOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleGenerate = async () => {
    const userId = getUserId();
    if (!userId) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'generate' }),
      });

      if (res.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (recId: string, action: string) => {
    try {
      const res = await fetch('/api/advisor/recommendation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, action }),
      });

      if (res.ok) {
        await fetchRecommendations();
        if (action === 'read' && selectedRec?.id === recId) {
          setSelectedRec(null);
        }
      }
    } catch (error) {
      console.error('Failed to update recommendation:', error);
    }
  };

  const handleRefreshPrices = async () => {
    const userId = getUserId();
    if (!userId) return;

    setRefreshingPrices(true);
    try {
      const res = await fetch('/api/advisor/refresh-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleFeedback = async (recId: string, feedbackType: string, executionPrice?: string) => {
    try {
      const res = await fetch('/api/advisor/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: recId,
          feedbackType,
          executionPrice: executionPrice || undefined,
        }),
      });

      if (res.ok) {
        setShowExecutionModal(null);
        setExecutionPriceInput('');
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  };

  const filteredRecs = recommendations.filter(r => {
    if (filter === 'unread') return !r.isRead;
    if (filter === 'critical') return r.urgencyLevel === 'critical' || r.urgencyLevel === 'high';
    return true;
  });

  // Needs onboarding state
  if (needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ paddingTop: '80px', background: 'var(--bg)' }}>
        <div className="glass-card text-center" style={{ padding: '40px', maxWidth: '480px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Sparkles size={28} style={{ color: 'var(--purple)' }} />
          </div>
          <h1 className="heading-lg mb-3" style={{ fontSize: '22px' }}>{T(locale, 'activateAdvisor')}</h1>
          <p className="body-text mb-6">
            {T(locale, 'activateDesc')}
          </p>
          <a
            href={locale === 'en' ? '/en/onboarding' : `/${locale}/onboarding`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '10px',
              background: 'var(--cyan)', color: '#000',
              fontSize: '15px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            <Sparkles size={16} />
            {T(locale, 'startSetup')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="ltr" style={{ paddingTop: '80px', background: 'var(--bg)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header — V229: Operations Room */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={22} style={{ color: 'var(--cyan)' }} />
              </div>
              <div>
                <h1 className="heading-lg" style={{ fontSize: '22px' }}>{T(locale, 'opsRoom')}</h1>
                <p className="body-text" style={{ fontSize: 12, marginTop: 2 }}>{T(locale, 'opsRoomDesc')}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefreshPrices}
              disabled={refreshingPrices}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 14px', borderRadius: '10px',
                background: refreshingPrices ? 'var(--bg5)' : 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: refreshingPrices ? 'var(--text4)' : '#22C55E',
                fontSize: '13px', fontWeight: 600,
                cursor: refreshingPrices ? 'not-allowed' : 'pointer',
              }}
            >
              <DollarSign size={14} className={refreshingPrices ? 'animate-spin' : ''} />
              {refreshingPrices ? T(locale, 'updating') : T(locale, 'refreshPrices')}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '10px',
                background: generating ? 'var(--bg5)' : 'var(--cyan)',
                border: 'none',
                color: generating ? 'var(--text4)' : '#000',
                fontSize: '14px', fontWeight: 700,
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? T(locale, 'generating') : T(locale, 'newRecommendations')}
            </button>
          </div>
        </div>

        {/* ═══ V341: Trading Operations Dashboard (unified) ═══ */}
        <TradingOpsDashboard locale={locale} />

        {/* ── Smart Recommendations Section ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 8px rgba(0,229,255,.3)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{T(locale, 'smartRecommendations')}</span>
        </div>

        {/* Stats Bar — PR#23 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: T(locale, 'activeRecs'), value: stats.total, color: 'var(--cyan)', icon: Target },
            { label: T(locale, 'unread'), value: stats.unread, color: 'var(--purple)', icon: Eye },
            { label: T(locale, 'urgentCritical'), value: stats.critical + stats.high, color: 'var(--bear)', icon: AlertTriangle },
            { label: T(locale, 'executed'), value: stats.actioned, color: 'var(--bull)', icon: CheckCircle2 },
            { label: T(locale, 'successRate'), value: `${stats.estimatedSuccessRate}%`, color: '#FFB800', icon: Award },
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
              <stat.icon size={16} style={{ color: stat.color, margin: '0 auto 6px' }} />
              <div className="data-value" style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div className="caption-text" style={{ fontSize: '11px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Profile Summary — PR#26 */}
        {profile && (
          <div className="glass-card mb-6" style={{ padding: '14px 18px' }}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield size={14} style={{ color: 'var(--cyan)' }} />
                <span className="caption-text">{T(locale, 'riskTolerance')}</span>
                <span className="heading-sm" style={{ fontSize: '12px' }}>
                  {profile.riskTolerance === 'conservative' ? T(locale, 'conservative') : profile.riskTolerance === 'aggressive' ? T(locale, 'aggressive') : T(locale, 'moderate')}
                </span>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
              <div className="flex items-center gap-2">
                <BarChart3 size={14} style={{ color: 'var(--purple)' }} />
                <span className="caption-text">{T(locale, 'experience')}</span>
                <span className="heading-sm" style={{ fontSize: '12px' }}>
                  {profile.experienceLevel === 'beginner' ? T(locale, 'beginner') : profile.experienceLevel === 'professional' ? T(locale, 'professional') : profile.experienceLevel === 'advanced' ? T(locale, 'advanced') : T(locale, 'intermediate')}
                </span>
              </div>
              {profile.preferredAssets && profile.preferredAssets.length > 0 && (
                <>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                  <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: '#22C55E' }} />
                    <span className="caption-text">{T(locale, 'assets')}</span>
                    <span className="heading-sm" style={{ fontSize: '12px', color: '#22C55E' }}>
                      {profile.preferredAssets.map(a => {
                        const labels: Record<string, string> = { crypto: T(locale, 'assetCrypto'), forex: T(locale, 'assetForex'), commodities: T(locale, 'assetCommodities'), realEstate: T(locale, 'assetRealEstate'), stocks: T(locale, 'assetStocks'), indices: T(locale, 'assetIndices') };
                        return labels[a] || a;
                      }).join(', ')}
                    </span>
                  </div>
                </>
              )}
              {profile.successRate !== undefined && profile.successRate > 0 && (
                <>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                  <div className="flex items-center gap-2">
                    <Award size={14} style={{ color: '#FFB800' }} />
                    <span className="caption-text">{T(locale, 'successRateLabel')}</span>
                    <span className="heading-sm" style={{ fontSize: '12px', color: '#FFB800' }}>
                      {profile.successRate.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
              {/* PR#26: Allow General Recommendations Toggle */}
              <button
                onClick={async () => {
                  const userId = getUserId();
                  if (!userId) return;
                  const newVal = !profile.allowGeneralRecommendations;
                  await fetch('/api/advisor/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, allowGeneralRecommendations: newVal }),
                  });
                  await fetchRecommendations();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px',
                  background: profile.allowGeneralRecommendations ? 'rgba(34,197,94,0.1)' : 'var(--bg4)',
                  border: `1px solid ${profile.allowGeneralRecommendations ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  color: profile.allowGeneralRecommendations ? '#22C55E' : 'var(--text4)',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Lightbulb size={11} />
                {profile.allowGeneralRecommendations ? T(locale, 'generalRecs') : T(locale, 'personalizedOnly')}
              </button>
              <a href={locale === 'en' ? '/en/onboarding' : `/${locale}/onboarding`} style={{ color: 'var(--cyan)', fontSize: '12px', fontWeight: 600 }}>
                {T(locale, 'editProfile')}
              </a>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all', label: T(locale, 'filterAll') },
            { id: 'unread', label: T(locale, 'filterUnread') },
            { id: 'critical', label: T(locale, 'filterUrgent') },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                padding: '6px 16px', borderRadius: '8px',
                background: filter === f.id ? 'var(--cyan2)' : 'var(--bg4)',
                border: `1px solid ${filter === f.id ? 'var(--cyan)' : 'var(--border)'}`,
                color: filter === f.id ? 'var(--cyan)' : 'var(--text3)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Recommendations List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--cyan)', margin: '0 auto 12px' }} />
            <p className="body-text">{T(locale, 'loadingRecs')}</p>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '40px' }}>
            <Lightbulb size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
            <h3 className="heading-md mb-2" style={{ fontSize: '16px' }}>{T(locale, 'noRecsYet')}</h3>
            <p className="body-text mb-4">
              {recommendations.length === 0
                ? T(locale, 'noRecsEmpty')
                : profile?.preferredAssets && profile.preferredAssets.length > 0
                  ? `${T(locale, 'noRecsCategory')} ${profile.preferredAssets.map(a => {
                      const labels: Record<string, string> = { crypto: T(locale, 'assetCrypto'), forex: T(locale, 'assetForex'), commodities: T(locale, 'assetCommodities'), realEstate: T(locale, 'assetRealEstate'), stocks: T(locale, 'assetStocks'), indices: T(locale, 'assetIndices') };
                      return labels[a] || a;
                    }).join(` ${T(locale, 'categoryOr')} `)} ${T(locale, 'enableGeneralOrEdit')}`
                  : T(locale, 'tryChangingFilter')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  background: 'var(--cyan)', border: 'none',
                  color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {T(locale, 'generateRecs')}
              </button>
              {profile?.preferredAssets && profile.preferredAssets.length > 0 && !profile.allowGeneralRecommendations && (
                <button
                  onClick={async () => {
                    const userId = getUserId();
                    if (!userId) return;
                    await fetch('/api/advisor/profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, allowGeneralRecommendations: true }),
                    });
                    await fetchRecommendations();
                  }}
                  style={{
                    padding: '10px 24px', borderRadius: '10px',
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22C55E', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {T(locale, 'enableGeneralRecs')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRecs.map(rec => {
              const typeConfig = TYPE_CONFIG[rec.type] || TYPE_CONFIG.market_opportunity;
              const urgency = URGENCY_LABELS[rec.urgencyLevel] || URGENCY_LABELS.normal;
              const actionConfig = rec.action ? ACTION_CONFIG[rec.action] : null;
              const Icon = typeConfig.icon;
              const isSelected = selectedRec?.id === rec.id;
              const hasFeedback = !!rec.feedbackType;

              return (
                <div key={rec.id}>
                  <div
                    className="glass-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderColor: isSelected ? typeConfig.color : rec.isRead ? 'var(--border)' : `${typeConfig.color}40`,
                      background: rec.isRead ? 'var(--surface-1)' : `${typeConfig.color}05`,
                      opacity: hasFeedback && rec.feedbackType !== 'useful' ? 0.7 : 1,
                    }}
                    onClick={() => {
                      setSelectedRec(isSelected ? null : rec);
                      if (!rec.isRead) handleAction(rec.id, 'read');
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: `${typeConfig.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, border: `1px solid ${typeConfig.color}30`,
                      }}>
                        <Icon size={18} style={{ color: typeConfig.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Badges Row */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* Action Badge */}
                          {actionConfig && (
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px',
                              background: `${actionConfig.color}20`, color: actionConfig.color,
                              fontSize: '11px', fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: '3px',
                            }}>
                              <actionConfig.icon size={10} />
                              {actionConfig.label}
                            </span>
                          )}
                          {/* Urgency Badge */}
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px',
                            background: `${urgency.color}15`, color: urgency.color,
                            fontSize: '11px', fontWeight: 700,
                          }}>
                            {urgency.label}
                          </span>
                          <span style={{ color: 'var(--text4)', fontSize: '11px' }}>
                            {typeConfig.label}
                          </span>
                          {!rec.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan)' }} />}
                          {/* Feedback Badge */}
                          {hasFeedback && (
                            <span style={{
                              padding: '1px 6px', borderRadius: '3px',
                              background: rec.feedbackType === 'executed' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                              color: rec.feedbackType === 'executed' ? '#22C55E' : '#64748B',
                              fontSize: '10px', fontWeight: 600,
                            }}>
                              {rec.feedbackType === 'executed' ? T(locale, 'feedbackExecuted') : rec.feedbackType === 'ignored' ? T(locale, 'feedbackIgnored') : rec.feedbackType === 'dismissed' ? T(locale, 'feedbackDismissed') : rec.feedbackType === 'useful' ? T(locale, 'feedbackUseful') : rec.feedbackType === 'not_useful' ? T(locale, 'feedbackNotUseful') : ''}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="heading-sm" style={{ fontSize: '14px', marginBottom: '4px' }}>
                          {rec.asset ? `${T(locale, 'recOn')} ${rec.asset}` : rec.title}
                        </h3>
                        <p className="caption-text" style={{ lineHeight: 1.6 }}>{rec.summary}</p>

                        {/* Price Levels — PR#23 + PR#25 */}
                        {(rec.entryPrice || rec.targetPrice || rec.stopLoss) && (
                          <div className="flex flex-wrap gap-3 mt-3" style={{
                            background: 'rgba(11,14,20,0.5)',
                            borderRadius: '8px', padding: '10px 14px',
                            border: '1px solid var(--border)',
                          }}>
                            {rec.entryPrice && (
                              <div className="flex items-center gap-1">
                                <DollarSign size={12} style={{ color: 'var(--cyan)' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>{T(locale, 'entry')}</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: 'var(--cyan)' }}>{rec.entryPrice}</span>
                              </div>
                            )}
                            {rec.targetPrice && (
                              <div className="flex items-center gap-1">
                                <TrendingUp size={12} style={{ color: '#22C55E' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>{T(locale, 'target')}</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: '#22C55E' }}>{rec.targetPrice}</span>
                                {rec.sourceData?.targetChangePercent && (
                                  <span style={{ fontSize: '10px', color: '#22C55E', fontWeight: 600 }}>
                                    ({rec.sourceData.targetChangePercent})
                                  </span>
                                )}
                              </div>
                            )}
                            {rec.stopLoss && (
                              <div className="flex items-center gap-1">
                                <TrendingDown size={12} style={{ color: '#EF5350' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>{T(locale, 'stopLoss')}</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: '#EF5350' }}>{rec.stopLoss}</span>
                                {rec.sourceData?.stopLossChangePercent && (
                                  <span style={{ fontSize: '10px', color: '#EF5350', fontWeight: 600 }}>
                                    ({rec.sourceData.stopLossChangePercent})
                                  </span>
                                )}
                              </div>
                            )}
                            {rec.timeHorizon && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} style={{ color: 'var(--text3)' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>{rec.timeHorizon}</span>
                              </div>
                            )}
                            {rec.allocationPercent && (
                              <div className="flex items-center gap-1">
                                <BarChart3 size={12} style={{ color: '#FFB800' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>{T(locale, 'allocation')}</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: '#FFB800' }}>{rec.allocationPercent}</span>
                              </div>
                            )}
                            {rec.sourceData?.priceSource === 'api' && (
                              <div className="flex items-center gap-1" style={{ opacity: 0.6 }}>
                                <span style={{ fontSize: '9px', color: 'var(--text4)' }}>{T(locale, 'livePrices')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Source Report Link */}
                        {rec.reportSlug && (
                          <a
                            href={`/${locale}/reports/${rec.reportSlug}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              marginTop: '8px', fontSize: '12px', fontWeight: 600,
                              color: 'var(--cyan)', textDecoration: 'none',
                              padding: '4px 10px', borderRadius: '6px',
                              background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,0.2)',
                            }}
                          >
                            <ExternalLink size={12} />
                            {T(locale, 'readFullReport')}
                          </a>
                        )}

                        {/* Confidence Bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="caption-text" style={{ fontSize: '11px' }}>{T(locale, 'confidence')}</span>
                          <div style={{ flex: 1, maxWidth: '120px', height: '4px', borderRadius: '2px', background: 'var(--bg5)' }}>
                            <div style={{
                              width: `${rec.confidenceScore}%`, height: '100%', borderRadius: '2px',
                              background: rec.confidenceScore >= 70 ? '#22C55E' : rec.confidenceScore >= 50 ? '#FFB800' : '#EF5350',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span className="data-value" style={{ fontSize: '11px', color: 'var(--text3)' }}>{rec.confidenceScore}%</span>
                          {rec.confidenceScore < 50 && (
                            <span style={{ fontSize: '10px', color: '#EF5350', fontWeight: 600 }}>{T(locale, 'low')}</span>
                          )}
                        </div>

                        {/* Feedback Buttons — PR#23 */}
                        {!hasFeedback && (
                          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setShowExecutionModal(rec.id)}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                                color: '#22C55E', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              {T(locale, 'btnExecuted')}
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'useful')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
                                color: 'var(--cyan)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <ThumbsUp size={12} />
                              {T(locale, 'useful')}
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'not_useful')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)',
                                color: 'var(--text3)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <ThumbsDown size={12} />
                              {T(locale, 'notUseful')}
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'ignored')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'var(--bg4)', border: '1px solid var(--border)',
                                color: 'var(--text4)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <BellOff size={12} />
                              {T(locale, 'ignore')}
                            </button>
                          </div>
                        )}

                        {/* Executed Recommendation Result */}
                        {rec.actualProfitLoss !== null && rec.actualProfitLoss !== undefined && (
                          <div className="mt-3" style={{
                            padding: '8px 12px', borderRadius: '6px',
                            background: rec.actualProfitLoss >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,83,80,0.1)',
                            border: `1px solid ${rec.actualProfitLoss >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'}`,
                          }}>
                            <span style={{
                              fontSize: '13px', fontWeight: 700,
                              color: rec.actualProfitLoss >= 0 ? '#22C55E' : '#EF5350',
                            }}>
                              {rec.actualProfitLoss >= 0 ? '+' : ''}{rec.actualProfitLoss.toFixed(2)}%
                            </span>
                            <span className="caption-text" style={{ fontSize: '11px', marginLeft: '8px' }}>
                              {rec.isSuccessful ? T(locale, 'targetHit') : T(locale, 'targetNotYetHit')}
                            </span>
                          </div>
                        )}
                      </div>

                      <ChevronDown size={16} style={{ color: 'var(--text4)', transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        {rec.reasoning && (
                          <div className="mb-4">
                            <h4 className="heading-sm mb-2" style={{ fontSize: '13px' }}>{T(locale, 'reasoning')}</h4>
                            <p className="body-text" style={{ fontSize: '13px' }}>{rec.reasoning}</p>
                          </div>
                        )}

                        {rec.actionItems?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="heading-sm mb-2" style={{ fontSize: '13px' }}>{T(locale, 'actionItems')}</h4>
                            <div className="flex flex-col gap-2">
                              {rec.actionItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div style={{
                                    width: '20px', height: '20px', borderRadius: '4px',
                                    background: 'var(--cyan2)', border: '1px solid var(--cyan)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', color: 'var(--cyan)', fontWeight: 700, flexShrink: 0,
                                  }}>
                                    {i + 1}
                                  </div>
                                  <span className="body-text" style={{ fontSize: '13px' }}>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.relatedSymbols?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="heading-sm mb-2" style={{ fontSize: '13px' }}>{T(locale, 'relatedSymbols')}</h4>
                            <div className="flex flex-wrap gap-2">
                              {rec.relatedSymbols.map(sym => (
                                <span key={sym} style={{
                                  padding: '4px 10px', borderRadius: '6px',
                                  background: 'var(--bg5)', border: '1px solid var(--border)',
                                  fontSize: '12px', fontWeight: 600, color: 'var(--cyan)',
                                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                                }}>
                                  {sym}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rec.relatedAssetClasses?.length > 0 && (
                          <div>
                            <h4 className="heading-sm mb-2" style={{ fontSize: '13px' }}>{T(locale, 'relatedAssetClasses')}</h4>
                            <div className="flex flex-wrap gap-2">
                              {rec.relatedAssetClasses.map(cls => (
                                <span key={cls} style={{
                                  padding: '4px 10px', borderRadius: '6px',
                                  background: 'var(--bg5)', border: '1px solid var(--border)',
                                  fontSize: '12px', fontWeight: 600, color: 'var(--text3)',
                                }}>
                                  {cls}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Execution Modal */}
                  {showExecutionModal === rec.id && (
                    <div style={{
                      position: 'fixed', inset: 0, zIndex: 100,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    }}>
                      <div className="glass-card" style={{
                        padding: '24px', maxWidth: '400px', width: '90%',
                        border: '1px solid rgba(34,197,94,0.3)',
                      }}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="heading-sm" style={{ fontSize: '16px' }}>{T(locale, 'recordExecution')}</h3>
                          <button
                            onClick={() => { setShowExecutionModal(null); setExecutionPriceInput(''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p className="caption-text mb-4">
                          {T(locale, 'enterExecutionPrice')} {rec.asset || rec.title}
                        </p>
                        <input
                          type="number"
                          step="any"
                          value={executionPriceInput}
                          onChange={(e) => setExecutionPriceInput(e.target.value)}
                          placeholder="Execution price (optional)"
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: '8px',
                            background: 'var(--bg4)', border: '1px solid var(--border)',
                            color: 'var(--text)', fontSize: '14px', outline: 'none',
                            marginBottom: '16px',
                          }}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleFeedback(showExecutionModal, 'executed', executionPriceInput || undefined)}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '8px',
                              background: '#22C55E', border: 'none',
                              color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            {T(locale, 'confirmExecution')}
                          </button>
                          <button
                            onClick={() => { setShowExecutionModal(null); setExecutionPriceInput(''); }}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '8px',
                              background: 'var(--bg4)', border: '1px solid var(--border)',
                              color: 'var(--text3)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            {T(locale, 'cancel')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
