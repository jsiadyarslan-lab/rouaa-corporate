// ─── Video Generation API Route (V4) ────────────────────────────
// Server-side MP4 video generation using Playwright + HTML/CSS rendering
// Bloomberg/Al Jazeera-style economic report videos with Arabic voiceover
// V4: Playwright-based rendering replaces Python Pillow for professional quality

import { NextRequest, NextResponse } from 'next/server';
import { db, safeDBQuery } from '@/lib/db';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { uploadVideoToR2, uploadThumbnailToR2, isR2VideoUrl, isR2VideoAvailable } from '@/lib/video-storage';
import { tryAcquireLock, isVideoGenerating } from '@/lib/video-engine/queue';
import { generateImagesForVideo } from '@/lib/image-gen';

// V5 FIX: Removed duplicate rawPrisma — use shared db singleton from @/lib/db
// The old rawPrisma was a SECOND PrismaClient that exhausted Supabase connection pool
const execFileAsync = promisify(execFile);

// V350: In-process video generation lock — only one video can render at a time
let currentGenerationPromise: Promise<any> | null = null;

// V4: Persistent video output directory (NOT /tmp — survives restarts)
const VIDEO_DIR = join(process.cwd(), 'public', 'generated', 'videos');

function ensureVideoDir() {
  if (!existsSync(VIDEO_DIR)) {
    mkdirSync(VIDEO_DIR, { recursive: true });
  }
}

// ─── Node.js Rendering Script Paths ───────────────────────────
const RENDERER_SCRIPT_PULSE = join(process.cwd(), 'scripts', 'video-renderer.mjs');
const RENDERER_SCRIPT_DATAVIZ = join(process.cwd(), 'scripts', 'video-renderer-dataviz.mjs');
const RENDERER_SCRIPT_GOLD = join(process.cwd(), 'scripts', 'video-renderer-gold.mjs');
const RENDERER_SCRIPT_OBSERVATORY = join(process.cwd(), 'scripts', 'video-renderer-observatory.mjs');

// ─── Find report with fallback ──────────────────────────────
async function findEconomicReport(id: string) {
  console.log(`[VideoGen V5] Looking for EconomicReport with id/slug: "${id}"`);

  // V5 FIX: Use safeDBQuery with auto-recovery instead of duplicate PrismaClient
  const report = await safeDBQuery(
    () => db.economicReport.findFirst({ where: { OR: [{ id }, { slug: id }] } }),
    'findEconomicReport'
  );
  if (report) {
    console.log(`[VideoGen V5] Found EconomicReport: "${report.title}"`);
  }
  return report;
}

async function findMarketAnalysis(id: string) {
  return await safeDBQuery(
    () => db.marketAnalysis.findFirst({ where: { id } }),
    'findMarketAnalysis'
  );
}

// ─── Transform EconomicReport data to video JSON ──────────────
function transformReportToVideoData(report: any, locale: string): object {
  const content = typeof report.content === 'string'
    ? (() => { try { return JSON.parse(report.content); } catch { return {}; } })()
    : report.content || {};

  const keyIndicators = typeof report.keyIndicators === 'string'
    ? (() => { try { return JSON.parse(report.keyIndicators); } catch { return {}; } })()
    : report.keyIndicators || {};

  // Extract stats from key indicators
  const stats: { label: string; value: string; description: string }[] = [];
  if (keyIndicators && typeof keyIndicators === 'object') {
    for (const [key, val] of Object.entries(keyIndicators)) {
      if (stats.length >= 4) break;
      const numVal = typeof val === 'number' ? val : parseFloat(String(val));
      if (!isNaN(numVal)) {
        // V10.2: Multi-language label dicts — fixes Arabic labels leaking into non-Arabic videos.
        // Previous: labelAr was always used, so English/French/Turkish/Spanish videos showed Arabic labels.
        const LABEL_DICTS: Record<string, Record<string, string>> = {
          ar: {
            gdp: 'الناتج المحلي', inflation: 'التضخم', unemployment: 'البطالة',
            interestRate: 'سعر الفائدة', debt: 'الدين العام', tradeBalance: 'الميزان التجاري',
            oilPrice: 'سعر النفط', goldPrice: 'سعر الذهب', exchangeRate: 'سعر الصرف',
            gdpGrowth: 'نمو الناتج المحلي', cpi: 'مؤشر الأسعار', ppi: 'مؤشر أسعار المنتجين',
            avgSentiment: 'متوسط المشاعر', totalNews: 'إجمالي الأخبار', sentiment: 'المشاعر',
            avg_sentiment: 'متوسط المشاعر', total_news: 'إجمالي الأخبار',
            confidence: 'مستوى الثقة', confidenceScore: 'مستوى الثقة',
            confidence_score: 'مستوى الثقة', impact: 'التأثير', volatility: 'التذبذب',
            marketCap: 'القيمة السوقية', market_cap: 'القيمة السوقية',
            pe_ratio: 'نسبة السعر للربح', eps: 'ربحية السهم', dividend: 'التوزيعات',
            revenue: 'الإيرادات', profit: 'الأرباح', volume: 'حجم التداول',
            change: 'التغير', changePercent: 'نسبة التغير', high: 'أعلى سعر',
            low: 'أدنى سعر', open: 'سعر الافتتاح', close: 'سعر الإغلاق',
            rsi: 'مؤشر القوة النسبية', macd: 'مؤشر التقارب', ma50: 'المتوسط 50',
            ma200: 'المتوسط 200', support: 'الدعم', resistance: 'المقاومة',
            total: 'الإجمالي', neutral: 'محايد', negative: 'سلبي', positive: 'إيجابي',
            bullish: 'صعودي', bearish: 'هبوطي', mixed: 'مختلط',
            count: 'العدد', score: 'النتيجة', level: 'المستوى',
            rate: 'النسبة', ratio: 'النسبة', price: 'السعر', amount: 'المبلغ',
            yield: 'العائد', spread: 'الفرق',
            unemploymentRate: 'نسبة البطالة', inflationRate: 'نسبة التضخم',
          },
          en: {
            gdp: 'GDP', inflation: 'Inflation', unemployment: 'Unemployment',
            interestRate: 'Interest Rate', debt: 'Public Debt', tradeBalance: 'Trade Balance',
            oilPrice: 'Oil Price', goldPrice: 'Gold Price', exchangeRate: 'Exchange Rate',
            gdpGrowth: 'GDP Growth', cpi: 'CPI', ppi: 'PPI',
            avgSentiment: 'Avg Sentiment', totalNews: 'Total News', sentiment: 'Sentiment',
            avg_sentiment: 'Avg Sentiment', total_news: 'Total News',
            confidence: 'Confidence', confidenceScore: 'Confidence Score',
            confidence_score: 'Confidence Score', impact: 'Impact', volatility: 'Volatility',
            marketCap: 'Market Cap', market_cap: 'Market Cap',
            pe_ratio: 'P/E Ratio', eps: 'EPS', dividend: 'Dividend',
            revenue: 'Revenue', profit: 'Profit', volume: 'Volume',
            change: 'Change', changePercent: 'Change %', high: 'High',
            low: 'Low', open: 'Open', close: 'Close',
            rsi: 'RSI', macd: 'MACD', ma50: 'MA50', ma200: 'MA200',
            support: 'Support', resistance: 'Resistance',
            total: 'Total', neutral: 'Neutral', negative: 'Negative', positive: 'Positive',
            bullish: 'Bullish', bearish: 'Bearish', mixed: 'Mixed',
            count: 'Count', score: 'Score', level: 'Level',
            rate: 'Rate', ratio: 'Ratio', price: 'Price', amount: 'Amount',
            yield: 'Yield', spread: 'Spread',
            unemploymentRate: 'Unemployment Rate', inflationRate: 'Inflation Rate',
          },
          fr: {
            gdp: 'PIB', inflation: 'Inflation', unemployment: 'Chômage',
            interestRate: "Taux d'intérêt", debt: 'Dette Publique', tradeBalance: 'Balance Commerciale',
            oilPrice: "Prix du Pétrole", goldPrice: "Prix de l'Or", exchangeRate: "Taux de Change",
            gdpGrowth: 'Croissance PIB', cpi: 'IPC', ppi: 'IPP',
            avgSentiment: 'Sentiment Moyen', totalNews: 'Total Actualités', sentiment: 'Sentiment',
            confidence: 'Confiance', confidenceScore: 'Score de Confiance',
            impact: 'Impact', volatility: 'Volatilité',
            marketCap: 'Capitalisation', market_cap: 'Capitalisation',
            pe_ratio: 'Ratio P/E', eps: 'BPA', dividend: 'Dividende',
            revenue: 'Revenus', profit: 'Profits', volume: 'Volume',
            change: 'Variation', changePercent: 'Variation %', high: 'Haut',
            low: 'Bas', open: 'Ouverture', close: 'Clôture',
            rsi: 'RSI', macd: 'MACD', ma50: 'MM50', ma200: 'MM200',
            support: 'Support', resistance: 'Résistance',
            total: 'Total', neutral: 'Neutre', negative: 'Négatif', positive: 'Positif',
            bullish: 'Haussier', bearish: 'Baissier', mixed: 'Mixte',
          },
          tr: {
            gdp: 'GSYH', inflation: 'Enflasyon', unemployment: 'İşsizlik',
            interestRate: 'Faiz Oranı', debt: 'Kamu Borcu', tradeBalance: 'Ticaret Dengesi',
            oilPrice: 'Petrol Fiyatı', goldPrice: 'Altın Fiyatı', exchangeRate: 'Döviz Kuru',
            gdpGrowth: 'GSYH Büyümesi', cpi: 'TÜFE', ppi: 'ÜFE',
            avgSentiment: 'Ort. Duygu', totalNews: 'Toplam Haber', sentiment: 'Duygu',
            confidence: 'Güven', confidenceScore: 'Güven Skoru',
            impact: 'Etki', volatility: 'Oynaklık',
            marketCap: 'Piyasa Değeri', market_cap: 'Piyasa Değeri',
            pe_ratio: 'F/K Oranı', eps: 'HBA', dividend: 'Temettü',
            revenue: 'Gelir', profit: 'Kâr', volume: 'Hacim',
            change: 'Değişim', changePercent: 'Değişim %', high: 'Yüksek',
            low: 'Düşük', open: 'Açılış', close: 'Kapanış',
            rsi: 'RSI', macd: 'MACD', ma50: 'MA50', ma200: 'MA200',
            support: 'Destek', resistance: 'Direnç',
            total: 'Toplam', neutral: 'Nötr', negative: 'Negatif', positive: 'Pozitif',
            bullish: 'Yükseliş', bearish: 'Düşüş', mixed: 'Karışık',
          },
          es: {
            gdp: 'PIB', inflation: 'Inflación', unemployment: 'Desempleo',
            interestRate: 'Tasa de Interés', debt: 'Deuda Pública', tradeBalance: 'Balanza Comercial',
            oilPrice: 'Precio del Petróleo', goldPrice: 'Precio del Oro', exchangeRate: 'Tipo de Cambio',
            gdpGrowth: 'Crecimiento PIB', cpi: 'IPC', ppi: 'IPP',
            avgSentiment: 'Sentimiento Promedio', totalNews: 'Total Noticias', sentiment: 'Sentimiento',
            confidence: 'Confianza', confidenceScore: 'Puntuación de Confianza',
            impact: 'Impacto', volatility: 'Volatilidad',
            marketCap: 'Capitalización', market_cap: 'Capitalización',
            pe_ratio: 'Ratio P/E', eps: 'BPA', dividend: 'Dividendo',
            revenue: 'Ingresos', profit: 'Beneficios', volume: 'Volumen',
            change: 'Cambio', changePercent: 'Cambio %', high: 'Máximo',
            low: 'Mínimo', open: 'Apertura', close: 'Cierre',
            rsi: 'RSI', macd: 'MACD', ma50: 'MM50', ma200: 'MM200',
            support: 'Soporte', resistance: 'Resistencia',
            total: 'Total', neutral: 'Neutral', negative: 'Negativo', positive: 'Positivo',
            bullish: 'Alcista', bearish: 'Bajista', mixed: 'Mixto',
          },
        };
        const labelDict = LABEL_DICTS[locale] || LABEL_DICTS.en;
        stats.push({
          label: labelDict[key] || key,
          value: `${numVal > 10 ? numVal.toFixed(1) : numVal.toFixed(2)}${key.toLowerCase().includes('rate') || key.toLowerCase().includes('inflation') ? '%' : ''}`,
          description: labelDict[key] || key,
        });
      }
    }
  }

  // Extract key points from content
  const keyPoints: string[] = [];
  if (content?.keyPoints && Array.isArray(content.keyPoints)) {
    keyPoints.push(...content.keyPoints.slice(0, 5));
  } else if (content?.highlights && Array.isArray(content.highlights)) {
    keyPoints.push(...content.highlights.slice(0, 5));
  }

  // If no key points, extract from summary
  if (keyPoints.length === 0 && report.summary) {
    const sentences = report.summary.split(/[.،؛]/).filter((s: string) => s.trim().length > 10);
    keyPoints.push(...sentences.slice(0, 4).map((s: string) => s.trim()));
  }

  // Chart data from content
  const chartData = content?.chartData || content?.chart || null;

  // Date formatting
  const dateLocale = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : 'en-US';
  const dateStr = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long' });

  // Report type label
  const reportTypeLabelsAr: Record<string, string> = {
    weekly: 'تقرير أسبوعي', monthly: 'تقرير شهري', quarterly: 'تقرير ربعي', special: 'تقرير خاص',
  };
  const reportTypeLabelsEn: Record<string, string> = {
    weekly: 'Weekly Report', monthly: 'Monthly Report', quarterly: 'Quarterly Report', special: 'Special Report',
  };
  const reportTypeLabelsFr: Record<string, string> = {
    weekly: 'Rapport hebdomadaire', monthly: 'Rapport mensuel', quarterly: 'Rapport trimestriel', special: 'Rapport spécial',
  };

  // Market impact
  const impactEmoji: Record<string, string> = {
    bullish: '↑', bearish: '↓', neutral: '→',
  };

  // V5: Extract root causes from content (for "Roots" pulse)
  const rootCauses = content?.rootCauses && Array.isArray(content.rootCauses)
    ? content.rootCauses.slice(0, 3)
    : [];

  // V5: Extract historical parallels from content (for "History" pulse)
  const historicalParallels = content?.historicalParallels && Array.isArray(content.historicalParallels)
    ? content.historicalParallels.slice(0, 3)
    : [];

  // V5: Extract strategic takeaways from content (for "Takeaway" pulse)
  const strategicTakeaways = content?.strategicTakeaways && Array.isArray(content.strategicTakeaways)
    ? content.strategicTakeaways.slice(0, 3)
    : [];

  // V5: Extract scenarios from content (for "Alert" pulse)
  const scenarios = content?.scenarios && Array.isArray(content.scenarios)
    ? content.scenarios.slice(0, 3)
    : [];

  // V5: Extract asset recommendations from content (for "Deal" pulse)
  const benefitingAssets = content?.benefitingAssets && Array.isArray(content.benefitingAssets)
    ? content.benefitingAssets.slice(0, 4)
    : [];
  const harmedAssets = content?.harmedAssets && Array.isArray(content.harmedAssets)
    ? content.harmedAssets.slice(0, 4)
    : [];

  // V5: Extract recommendations from content (for "Harvest" pulse)
  const recommendations = content?.recommendations && Array.isArray(content.recommendations)
    ? content.recommendations.slice(0, 3)
    : [];

  // V9.3: Title translation logic — fixes English title leaking into Arabic video.
  // When locale === 'ar', prefer titleAr (if exists). If report.title is in English
  // (Latin chars only), use a generic Arabic title as fallback to avoid showing
  // English in an Arabic-context video. The proper fix is to populate titleAr
  // in the report generation pipeline, but this fallback prevents the visual bug.
  function isMostlyLatin(s: string): boolean {
    if (!s) return false;
    const latin = (s.match(/[a-zA-Z]/g) || []).length;
    const arabic = (s.match(/[\u0600-\u06FF]/g) || []).length;
    return latin > arabic;
  }
  const arTitle = (report as any).titleAr
    || (isMostlyLatin(report.title) ? 'تقرير اقتصادي — رؤى' : report.title);

  return {
    title: locale === 'ar' ? arTitle : locale === 'fr' ? (report.titleFr || report.titleEn || report.title) : locale === 'es' ? (report.titleEn || report.title) : locale === 'tr' ? (report.titleEn || report.title) : (report.titleEn || report.title),
    date: dateStr,
    locale: locale,
    report_type_label: locale === 'ar'
      ? (reportTypeLabelsAr[report.reportType] || 'تقرير اقتصادي')
      : locale === 'fr'
      ? (reportTypeLabelsFr[report.reportType] || 'Rapport économique')
      : locale === 'es'
      ? ({ weekly: 'Informe semanal', monthly: 'Informe mensual', quarterly: 'Informe trimestral', special: 'Informe especial' }[report.reportType] || 'Informe económico')
      : locale === 'tr'
      ? ({ weekly: 'Haftalık Rapor', monthly: 'Aylık Rapor', quarterly: 'Üç Aylık Rapor', special: 'Özel Rapor' }[report.reportType] || 'Ekonomik Rapor')
      : (reportTypeLabelsEn[report.reportType] || 'Economic Report'),
    summary: locale === 'ar' ? (report.summaryAr || report.summary || '') : locale === 'fr' ? (report.summaryFr || report.summary || '') : locale === 'es' ? (report.summary || '') : locale === 'tr' ? (report.summary || '') : (report.summary || ''),
    stats: stats.length > 0 ? stats : [
      { label: locale === 'ar' ? 'مستوى الثقة' : locale === 'fr' ? 'Niveau de confiance' : locale === 'es' ? 'Nivel de confianza' : locale === 'tr' ? 'Güven seviyesi' : 'Confidence', value: `${report.confidenceScore || 50}%`, description: locale === 'ar' ? 'مستوى ثقة التقرير' : locale === 'fr' ? 'Niveau de confiance du rapport' : locale === 'es' ? 'Nivel de confianza del informe' : locale === 'tr' ? 'Rapor güven seviyesi' : 'Report confidence level' },
    ],
    chart_data: chartData,
    key_points: keyPoints.length > 0 ? keyPoints : [locale === 'ar' ? 'لا توجد نقاط رئيسية محددة' : locale === 'fr' ? 'Données insuffisantes' : locale === 'es' ? 'Datos insuficientes' : locale === 'tr' ? 'Yetersiz veri' : 'No specific key points'],
    outlook: content?.outlook || content?.forecast || '',
    market_impact: report.marketImpact || 'neutral',
    impact_emoji: impactEmoji[report.marketImpact] || '→',
    // V5: New fields for intellectual slides
    root_causes: rootCauses,
    historical_parallels: historicalParallels,
    strategic_takeaways: strategicTakeaways,
    scenarios: scenarios,
    benefiting_assets: benefitingAssets,
    harmed_assets: harmedAssets,
    recommendations: recommendations,
    // V6: Article image URL from R2 — avoids re-generating images on Railway
    // The renderer will download this URL instead of calling Pollinations/z-ai-generate
    article_image_url: report.imageUrl || (report.generatedImage && !report.generatedImage.startsWith('data:') ? report.generatedImage : null) || null,
  };
}

// ─── V1058: Transform GeopoliticalRisk to video data ──────────
function transformGeopoliticalRiskToVideoData(risk: any, locale: string): object {
  const dateStr = risk.publishedAt
    ? new Date(risk.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'tr' ? 'tr-TR' : locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString();

  const content = typeof risk.content === 'string' ? risk.content : '';
  const summary = typeof risk.summary === 'string' ? risk.summary : '';

  // Parse affected assets
  let affectedAssets: any[] = [];
  try {
    affectedAssets = typeof risk.affectedAssets === 'string' ? JSON.parse(risk.affectedAssets) : (Array.isArray(risk.affectedAssets) ? risk.affectedAssets : []);
  } catch {}

  // Parse scenarios
  let scenarios: any = null;
  try {
    scenarios = typeof risk.scenarios === 'string' ? JSON.parse(risk.scenarios) : risk.scenarios;
  } catch {}

  // Build stats from risk data
  const stats: { label: string; value: string; description: string }[] = [
    { label: locale === 'ar' ? 'درجة الخطر' : locale === 'fr' ? 'Score de Risque' : locale === 'tr' ? 'Risk Skoru' : locale === 'es' ? 'Puntuación' : 'Risk Score', value: `${risk.riskScore}/100`, description: risk.riskLevel || '' },
  ];
  if (risk.aiGprScore) stats.push({ label: 'AI-GPR', value: risk.aiGprScore.toFixed(1), description: locale === 'ar' ? 'مؤشر المخاطر' : 'Risk Index' });
  if (affectedAssets.length > 0) stats.push({ label: locale === 'ar' ? 'أصول متأثرة' : 'Affected Assets', value: `${affectedAssets.length}`, description: affectedAssets.slice(0, 3).map((a: any) => a.symbol || a.name).join(', ') });

  // Build key points from content
  const keyPoints: string[] = [];
  if (summary) keyPoints.push(summary.slice(0, 200));

  // Build scenarios text
  let outlook = '';
  if (scenarios && typeof scenarios === 'object') {
    if (Array.isArray(scenarios)) {
      outlook = scenarios.map((s: any) => `${s.name || ''} (${s.probability || 0}%): ${s.description || ''}`).join('\n\n');
    } else if (scenarios.base) {
      outlook = `Base (${scenarios.base.probability || 50}%): ${scenarios.base.description || ''}\n\nAdverse (${scenarios.adverse?.probability || 30}%): ${scenarios.adverse?.description || ''}\n\nSevere (${scenarios.severe?.probability || 20}%): ${scenarios.severe?.description || ''}`;
    }
  }

  const catLabels: Record<string, Record<string, string>> = {
    conflict: { ar: 'صراع مسلح', en: 'Armed Conflict', fr: 'Conflit armé', tr: 'Silahlı Çatışma', es: 'Conflicto Armado' },
    trade: { ar: 'حرب تجارية', en: 'Trade War', fr: 'Guerre commerciale', tr: 'Ticaret Savaşı', es: 'Guerra Comercial' },
    energy: { ar: 'أزمة طاقة', en: 'Energy Crisis', fr: 'Crise énergétique', tr: 'Enerji Krizi', es: 'Crisis Energética' },
    political: { ar: 'عدم استقرار سياسي', en: 'Political Instability', fr: 'Instabilité politique', tr: 'Siyasi İstikrarsızlık', es: 'Inestabilidad Política' },
    cyber: { ar: 'تهديد سيبراني', en: 'Cyber Threat', fr: 'Menace cyber', tr: 'Siber Tehdit', es: 'Amenaza Cibernética' },
    sanctions: { ar: 'عقوبات دولية', en: 'Sanctions', fr: 'Sanctions', tr: 'Yaptırımlar', es: 'Sanciones' },
    climate: { ar: 'مخاطر مناخية', en: 'Climate Risk', fr: 'Risque climatique', tr: 'İklim Riski', es: 'Riesgo Climático' },
  };
  const reportTypeLabel = (catLabels[risk.riskCategory] || catLabels.political)[locale] || 'Geopolitical Risk';

  const riskColor = risk.riskScore >= 81 ? '#FF3838' : risk.riskScore >= 61 ? '#FFB302' : risk.riskScore >= 41 ? '#FCE83A' : '#56F000';

  return {
    title: risk.title,
    date: dateStr,
    locale: locale,
    report_type_label: reportTypeLabel,
    summary: summary || (locale === 'ar' ? 'تحليل المخاطر الجيوسياسية وتأثيرها على الأسواق' : 'Geopolitical risk analysis and market impact'),
    stats: stats.length > 0 ? stats : [{ label: 'Risk Score', value: `${risk.riskScore}/100`, description: risk.riskLevel }],
    chart_data: [{ label: 'Risk Score', value: risk.riskScore, color: riskColor }],
    key_points: keyPoints.length > 0 ? keyPoints : [summary || 'Risk analysis'],
    outlook: outlook || '',
    market_impact: 'neutral',
    impact_emoji: '⚔️',
    root_causes: [],
    historical_parallels: [],
    strategic_takeaways: [],
    scenarios: scenarios,
    benefiting_assets: affectedAssets.filter((a: any) => a.direction === 'bullish' || (a.impact || '').includes('+')),
    harmed_assets: affectedAssets.filter((a: any) => a.direction === 'bearish' || (a.impact || '').includes('-')),
    recommendations: [],
    article_image_url: risk.imageUrl || null,
    geopolitical_risk: true,
    risk_score: risk.riskScore,
    risk_level: risk.riskLevel,
    risk_category: risk.riskCategory,
  };
}

// ─── Transform symbol-based analysis to video JSON ─────────────
function transformSymbolToVideoData(
  symbol: string,
  assetName: string,
  locale: string,
  analysisData?: any,
): object {
  const stats: { label: string; value: string; description: string }[] = [];

  if (analysisData?.analysis) {
    const an = analysisData.analysis;
    stats.push({
      label: locale === 'ar' ? 'الاتجاه' : locale === 'fr' ? 'Tendance' : locale === 'es' ? 'Tendencia' : locale === 'tr' ? 'Trend' : 'Trend',
      value: an.trend?.direction === 'bullish' ? (locale === 'ar' ? 'صاعد' : locale === 'fr' ? 'Haussier' : locale === 'es' ? 'Alcista' : locale === 'tr' ? 'Yükseliş' : 'Bullish')
        : an.trend?.direction === 'bearish' ? (locale === 'ar' ? 'هابط' : locale === 'fr' ? 'Baissier' : locale === 'es' ? 'Bajista' : locale === 'tr' ? 'Düşüş' : 'Bearish')
        : (locale === 'ar' ? 'عرضي' : locale === 'fr' ? 'Neutre' : locale === 'es' ? 'Lateral' : locale === 'tr' ? 'Yatay' : 'Sideways'),
      description: `${an.trend?.strength || 0}%`,
    });
    if (an.currentPrice) {
      stats.push({
        label: locale === 'ar' ? 'السعر الحالي' : locale === 'fr' ? 'Prix actuel' : locale === 'es' ? 'Precio actual' : locale === 'tr' ? 'Mevcut fiyat' : 'Current Price',
        value: an.currentPrice.toFixed(2),
        description: `${an.changePercent >= 0 ? '+' : ''}${an.changePercent?.toFixed(2) || '0'}%`,
      });
    }
    for (const ind of (an.indicators || []).slice(0, 2)) {
      stats.push({
        label: ind.name,
        value: ind.value?.toFixed(1) || '0',
        description: ind.descriptionAr || ind.descriptionEn || '',
      });
    }
  }

  return {
    title: locale === 'ar' ? `تحليل ${assetName || symbol}` : locale === 'fr' ? `Analyse de ${assetName || symbol}` : locale === 'es' ? `Análisis de ${assetName || symbol}` : locale === 'tr' ? `${assetName || symbol} Analizi` : `${assetName || symbol} Analysis`,
    date: new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long' }),
    locale,
    report_type_label: locale === 'ar' ? 'تحليل فني' : locale === 'fr' ? 'Analyse technique' : locale === 'es' ? 'Análisis técnico' : locale === 'tr' ? 'Teknik analiz' : 'Technical Analysis',
    summary: analysisData?.analysis?.summaryAr || analysisData?.analysis?.summaryEn || '',
    stats: stats.length > 0 ? stats : [
      { label: locale === 'ar' ? 'الرمز' : locale === 'fr' ? 'Symbole' : locale === 'es' ? 'Símbolo' : locale === 'tr' ? 'Sembol' : 'Symbol', value: symbol, description: assetName || symbol },
    ],
    chart_data: null,
    key_points: analysisData?.analysis ? [
      analysisData.analysis.trend?.descriptionAr || '',
      ...(analysisData.analysis.indicators || []).map((i: any) => i.descriptionAr || i.descriptionEn || '').filter(Boolean),
    ].filter((s: string) => s.length > 5).slice(0, 5) : [],
    outlook: analysisData?.analysis?.tradeSetup?.reasoningAr || '',
    market_impact: analysisData?.analysis?.overallSignal || 'neutral',
    // V5: New fields (empty for symbol-based analysis, renderer generates defaults)
    root_causes: [],
    historical_parallels: [],
    strategic_takeaways: [],
    scenarios: [],
    benefiting_assets: [],
    harmed_assets: [],
    recommendations: [],
  };
}

// ─── Parse renderer output for duration ──────────────────────
function parseRendererOutput(stdout: string): { duration?: number } {
  try {
    // The renderer outputs JSON at the end
    const lines = stdout.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.duration) return { duration: parsed.duration };
      } catch { continue; }
    }
  } catch {}
  return {};
}

// ─── POST: Generate Video ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol,
      assetName,
      locale = 'ar',
      title,
      reportType = 'analysis',
      assetClass = 'stocks',
      sourceReportId,
      sourceType,
      marketImpact = 'neutral',
      style = 'gold', // V1051: 'gold' (default Professional) | 'pulse' (Bloomberg) | 'dataviz' (Al Jazeera)
    } = body;

    // ── Validate input ──
    const hasReport = sourceReportId && sourceType;
    const hasSymbol = symbol && typeof symbol === 'string';

    if (!hasReport && !hasSymbol) {
      return NextResponse.json(
        { success: false, error: 'Either sourceReportId+sourceType or symbol is required' },
        { status: 400 },
      );
    }

    console.log(`[VideoGen V5] Starting video generation for ${symbol || sourceReportId} (${locale})`);

    // ── V350: Check video generation lock — prevent OOM from concurrent renders ──
    if (!tryAcquireLock()) {
      return NextResponse.json(
        { success: false, error: 'Video generation already in progress. Please wait for the current generation to finish.', isGenerating: true },
        { status: 429 },
      );
    }

    // ── V5 FIX: Check R2 availability and warn if not configured ──
    const r2Available = isR2VideoAvailable();
    if (!r2Available) {
      console.warn('[VideoGen V5] ⚠️ R2 is NOT configured — videos will be stored locally and LOST on Railway redeployment. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL env vars.');
    }

    // ── V5 FIX: Clean up old local video files (>24h) to prevent disk exhaustion ──
    try {
      ensureVideoDir();
      const { readdirSync, statSync, unlinkSync } = require('fs');
      const now = Date.now();
      const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
      const files = readdirSync(VIDEO_DIR);
      let cleaned = 0;
      for (const file of files) {
        if (!file.endsWith('.mp4') && !file.endsWith('.png') && !file.endsWith('_input.json')) continue;
        const filePath = join(VIDEO_DIR, file);
        try {
          const stats = statSync(filePath);
          if (now - stats.mtimeMs > MAX_AGE_MS) {
            unlinkSync(filePath);
            cleaned++;
          }
        } catch {}
      }
      if (cleaned > 0) {
        console.log(`[VideoGen V5] Cleaned up ${cleaned} old video files (>24h)`);
      }
    } catch {}

    // ── Clean up stuck videos (processing > 15 min) ──
    try {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
      const stuckVideos = await db.videoReport.findMany({
        where: { status: 'processing', createdAt: { lt: fifteenMinAgo } },
        select: { id: true },
      });
      for (const sv of stuckVideos) {
        await db.videoReport.update({ where: { id: sv.id }, data: { status: 'failed', error: 'Processing timed out (auto-cleanup)' } });
      }
      if (stuckVideos.length > 0) {
        console.log(`[VideoGen V4] Cleaned up ${stuckVideos.length} stuck videos`);
      }
    } catch {}

    // ── Step 1: Create VideoReport entry (pending) ──
    const cleanSymbol = symbol ? symbol.replace(/[^A-Za-z0-9:_.-]/g, '').toUpperCase() : 'REPORT';
    const videoId = randomUUID();
    const slug = `${cleanSymbol.toLowerCase()}-${Date.now()}`;

    let videoReport: any;
    try {
      videoReport = await safeDBQuery(
        () => db.videoReport.create({
          data: {
            id: videoId,
            title: title || (locale === 'ar' ? `تقرير فيديو — ${cleanSymbol}` : locale === 'fr' ? `Rapport vidéo — ${cleanSymbol}` : locale === 'es' ? `Informe de vídeo — ${cleanSymbol}` : locale === 'tr' ? `Video Raporu — ${cleanSymbol}` : `Video Report — ${cleanSymbol}`),
            slug,
            symbol: cleanSymbol,
            assetName: assetName || cleanSymbol,
            locale: locale === 'en' ? 'en' : locale === 'fr' ? 'fr' : locale === 'tr' ? 'tr' : locale === 'es' ? 'es' : 'ar',
            reportType,
            assetClass,
            chartMode: style === 'dataviz' ? 'windows' : 'bg',
            style: style || 'gold',
            marketImpact: marketImpact || 'neutral',
            analysisText: '',
            status: 'processing',
            isPublished: false,
            sourceReportId: sourceReportId || null,
            sourceType: sourceType || null,
          },
        }),
        'videoReport.create'
      );
    } catch (dbErr: any) {
      console.error(`[VideoGen V5] videoReport.create failed: ${dbErr.message?.slice(0, 80)}`);
      return NextResponse.json({ success: false, error: 'فشل إنشاء سجل الفيديو' }, { status: 500 });
    }

    // V6 FIX: safeDBQuery can return null on connection errors — guard against it
    if (!videoReport) {
      console.error(`[VideoGen V6] videoReport.create returned null — DB connection issue`);
      return NextResponse.json({ success: false, error: 'فشل الاتصال بقاعدة البيانات' }, { status: 500 });
    }

    // ── Step 2: Generate video data ──
    let videoData: object;

    if (hasReport && sourceType === 'economic_report') {
      const report = await findEconomicReport(sourceReportId);
      if (!report) {
        // Debug: list available reports
        try {
          const count = await db.economicReport.count();
          console.error(`[VideoGen V5] Report not found. Total reports in DB: ${count}`);
          if (count > 0) {
            const samples = await db.economicReport.findMany({
              take: 5,
              select: { id: true, title: true, slug: true },
              orderBy: { createdAt: 'desc' },
            });
            console.error(`[VideoGen V5] Available reports:`, JSON.stringify(samples.map(r => ({ id: r.id.slice(0, 12), title: r.title.slice(0, 40) }))));
          }
        } catch {}

        try {
          await db.videoReport.update({ where: { id: videoId }, data: { status: 'failed', error: 'Report not found' } });
        } catch {}
        return NextResponse.json({
          success: false,
          error: 'التقرير غير موجود',
          debug: `Searched for sourceReportId: "${sourceReportId}"`,
        }, { status: 404 });
      }
      videoData = transformReportToVideoData(report, locale);
    } else if (hasReport && sourceType === 'market_analysis') {
      const analysis = await findMarketAnalysis(sourceReportId);
      if (!analysis) {
        try {
          await db.videoReport.update({ where: { id: videoId }, data: { status: 'failed', error: 'Analysis not found' } });
        } catch {}
        return NextResponse.json({ success: false, error: 'Analysis not found' }, { status: 404 });
      }
      videoData = transformReportToVideoData(analysis, locale);
    } else if (hasReport && sourceType === 'geopolitical_risk') {
      // V1058: Geopolitical risk video generation
      let geoRisk: any = null;
      try {
        geoRisk = await db.geopoliticalRisk.findFirst({
          where: { OR: [{ id: sourceReportId }, { slug: sourceReportId }] },
        });
      } catch (dbErr: any) {
        console.error(`[VideoGen V1058] GeopoliticalRisk query failed: ${dbErr.message?.slice(0, 80)}`);
      }
      if (!geoRisk) {
        try {
          await db.videoReport.update({ where: { id: videoId }, data: { status: 'failed', error: 'Geopolitical risk not found' } });
        } catch {}
        return NextResponse.json({ success: false, error: 'التحليل الجيوسياسي غير موجود' }, { status: 404 });
      }
      console.log(`[VideoGen V1058] Found GeopoliticalRisk: "${geoRisk.title}"`);
      videoData = transformGeopoliticalRiskToVideoData(geoRisk, locale);
    } else {
      videoData = transformSymbolToVideoData(cleanSymbol, assetName || cleanSymbol, locale);
    }

    // ── Step 3: Run Node.js video rendering script ──
    ensureVideoDir();

    const inputJsonPath = join(VIDEO_DIR, `${videoId}_input.json`);
    const outputMp4Path = join(VIDEO_DIR, `${videoId}.mp4`);
    const thumbnailPath = join(VIDEO_DIR, `${videoId}_thumb.png`);

    // Write input JSON
    writeFileSync(inputJsonPath, JSON.stringify(videoData, null, 2), 'utf-8');

    // Select renderer based on style
    const RENDERER_SCRIPT = style === 'dataviz' ? RENDERER_SCRIPT_DATAVIZ : style === 'gold' ? RENDERER_SCRIPT_GOLD : style === 'observatory' ? RENDERER_SCRIPT_OBSERVATORY : RENDERER_SCRIPT_PULSE;
    const styleLabel = style === 'dataviz' ? 'DataViz (Al Jazeera)' : style === 'gold' ? 'Gold (Professional)' : style === 'observatory' ? 'Observatory (Terminal)' : 'Pulse (Bloomberg)';

    // Check if renderer script exists
    if (!existsSync(RENDERER_SCRIPT)) {
      // V323: Update the failed video record instead of throwing, so the admin can see the error
      await safeDBQuery(
        () => db.videoReport.update({
          where: { id: videoId },
          data: { status: 'failed', error: `Renderer script not found: ${RENDERER_SCRIPT}. Style '${style}' may not be supported in this deployment.` },
        }),
        'videoReport.update.missingRenderer'
      );
      return NextResponse.json({
        success: false,
        error: `سكربت العرض غير موجود: ${style} — تأكد من نشر السكربت مع التطبيق`,
        videoId,
      }, { status: 500 });
    }

    // Execute Node.js rendering script
    console.log(`[VideoGen V4] Style: ${styleLabel} | Running: node ${RENDERER_SCRIPT} --input ${inputJsonPath} --output ${outputMp4Path}`);

    // ── ASYNC: Start video generation in background and return immediately ──
    // V5: Added error tracking and cleanup to prevent silent failures
    
    // Return immediately with the videoId
    const immediateResponse = NextResponse.json({
      success: true,
      videoId,
      slug,
      title: videoReport.title,
      status: 'processing',
      message: 'Video generation started. Poll /api/video/[id] for status.',
    }, { status: 202 });

    // Start background generation (fire-and-forget with timeout + error tracking)
    // V350: Release video lock in finally block to prevent OOM from concurrent renders
    (async () => {
      // Timeout wrapper — 25 minutes max for video generation (V9.2: raised from 12min)
      // V9.2: Generating 10 pre-images + 9-scene rendering takes 15-25min on Railway
      const RENDER_TIMEOUT = 25 * 60 * 1000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Video generation timed out after 25 minutes')), RENDER_TIMEOUT)
      );

      let rendererDuration: number | undefined;
      try {
        await Promise.race([
          (async () => {
            // ── V8: Pre-generate 10 background images using the SAME pipeline as infographics ──
            // Runs in the background (not in foreground) to avoid HTTP timeout on Railway.
            // Uses the full 5-provider fallback chain (Cloudflare SDXL → Gemini Flash → Prodia →
            // Pollinations → z-ai SDK → CLI) with 10 professional prompt templates (one per paragraph).
            // If pre-generation fails for any reason, the renderer falls back to its own image generation.
            try {
              const videoImageData = {
                title: (videoData as any)?.title,
                category: (videoData as any)?.report_type_label || reportType,
                locale,
              };
              const preGeneratedImages = await generateImagesForVideo(videoImageData, 6);
              if (preGeneratedImages.length > 0) {
                (videoData as any).pre_generated_images = preGeneratedImages;
                console.log(`[VideoGen V8] ✓ Pre-generated ${preGeneratedImages.length}/6 background images via infographic pipeline`);
                // Re-write input JSON with the pre-generated images
                writeFileSync(inputJsonPath, JSON.stringify(videoData, null, 2), 'utf-8');
              } else {
                console.warn(`[VideoGen V8] ⚠ Pre-generation returned 0 images — renderer will use its own fallback`);
              }
            } catch (imgErr: any) {
              console.warn(`[VideoGen V8] ⚠ Pre-generation failed: ${imgErr.message?.slice(0, 120)} — renderer will use its own fallback`);
            }

            const { stdout, stderr } = await execFileAsync('node', [
              '--max-old-space-size=512',  // V335: Increased from 384 — more heap for frame rendering
              '--expose-gc',  // V5: Enable manual GC for memory-constrained Railway
              '--dns-result-order=ipv4first',  // V328: Fix TypeError: fetch failed in Railway Docker (IPv6 DNS issue)
              RENDERER_SCRIPT,
              '--input', inputJsonPath,
              '--output', outputMp4Path,
            ], {
              timeout: 1500000, // V9.2: 25 minutes max (was 10min) — allows for pre-image gen + rendering
              maxBuffer: 100 * 1024 * 1024,
              env: { ...process.env, NODE_ENV: 'production', RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || '', NODE_OPTIONS: '--dns-result-order=ipv4first' },
            });

            console.log(`[VideoGen V4] Renderer output: ${stdout?.slice(-500) || 'none'}`);
            if (stderr) console.warn(`[VideoGen V4] Renderer stderr: ${stderr?.slice(-300) || 'none'}`);

            // Parse duration from renderer output
            const parsed = parseRendererOutput(stdout || '');
            rendererDuration = parsed.duration;

            // Check output file
            if (!existsSync(outputMp4Path)) {
              throw new Error('Video file was not created');
            }

            // Get file size
            const fileStats = statSync(outputMp4Path);
            const fileSizeMB = fileStats.size / (1024 * 1024);
            console.log(`[VideoGen V4] Video created: ${fileSizeMB.toFixed(1)} MB`);

            // ── V6 CRITICAL FIX: Verify actual video duration with ffprobe ──
            // Previously, broken videos (0.25s/3 frames) were marked as "completed"
            // because the duration defaulted to 90s when renderer output was missing.
            // Now we verify the ACTUAL duration and reject broken videos.
            let actualDuration = rendererDuration || 90;
            try {
              const { execSync } = require('child_process');
              const probeOutput = execSync(
                `ffprobe -v quiet -print_format json -show_format "${outputMp4Path}"`,
                { encoding: 'utf-8', timeout: 10000 }
              );
              const probeData = JSON.parse(probeOutput);
              const probedDuration = parseFloat(probeData?.format?.duration || '0');
              if (probedDuration > 0) {
                actualDuration = Math.round(probedDuration);
                console.log(`[VideoGen V6] ffprobe duration: ${probedDuration.toFixed(1)}s → ${actualDuration}s`);
              }
              // V6: Reject videos shorter than 15 seconds — they are broken
              if (probedDuration > 0 && probedDuration < 15) {
                throw new Error(`Video is only ${probedDuration.toFixed(1)}s — broken render (expected >15s). File size: ${fileSizeMB.toFixed(1)}MB`);
              }
            } catch (probeErr: any) {
              // If it's our duration check error, re-throw it
              if (probeErr.message?.includes('broken render')) {
                throw probeErr;
              }
              console.warn(`[VideoGen V6] ffprobe check failed: ${probeErr.message?.slice(0, 80)}`);
            }

            // ── Generate thumbnail from first frame ──
            try {
              const { execSync } = require('child_process');
              execSync(`ffmpeg -y -i "${outputMp4Path}" -vframes 1 -q:v 2 "${thumbnailPath}"`, {
                timeout: 15000,
                stdio: 'ignore',
              });
            } catch (thumbErr) {
              console.warn(`[VideoGen V4] Thumbnail generation failed: ${thumbErr}`);
            }

            // ── Upload to R2 (persistent cloud storage) ──
            let videoUrl = `/api/video/serve/${videoId}.mp4`;
            let thumbnailUrl = existsSync(thumbnailPath) ? `/api/video/serve/${videoId}_thumb.png` : null;

            try {
              const r2Result = await uploadVideoToR2(videoId, outputMp4Path);
              if (r2Result.success && r2Result.url) {
                videoUrl = r2Result.url;
                console.log(`[VideoGen V4] Video uploaded to R2: ${r2Result.url.slice(0, 80)}...`);
              } else {
                console.warn(`[VideoGen V4] R2 upload failed, using local URL: ${r2Result.error}`);
              }
            } catch (r2Err: any) {
              console.warn(`[VideoGen V4] R2 upload error, using local URL: ${r2Err.message}`);
            }

            // Upload thumbnail to R2 as well
            if (existsSync(thumbnailPath)) {
              try {
                const thumbResult = await uploadThumbnailToR2(videoId, thumbnailPath);
                if (thumbResult.success && thumbResult.url) {
                  thumbnailUrl = thumbResult.url;
                }
              } catch (thumbR2Err: any) {
                console.warn(`[VideoGen V4] Thumbnail R2 upload error: ${thumbR2Err.message}`);
              }
            }

            // ── Update VideoReport (V5: use safeDBQuery for reliability) ──
            // V5 FIX: Don't store full JSON in analysisText — it wastes DB space
            // Store a compact summary instead
            const compactSummary = JSON.stringify({
              title: (videoData as any)?.title || '',
              stats: ((videoData as any)?.stats || []).length,
              keyPoints: ((videoData as any)?.key_points || []).length,
              marketImpact: (videoData as any)?.market_impact || marketImpact || 'neutral',
              locale: (videoData as any)?.locale || locale,
            });
            await safeDBQuery(
              () => db.videoReport.update({
                where: { id: videoId },
                data: {
                  status: 'completed',
                  videoUrl,
                  thumbnailUrl,
                  duration: actualDuration,
                  isPublished: true,
                  publishedAt: new Date(),
                  analysisText: compactSummary,
                },
              }),
              'videoReport.update.completed'
            );

            console.log(`[VideoGen V4] Video generation complete: ${videoId} (${actualDuration}s) — URL: ${videoUrl.startsWith('http') ? 'R2' : 'local'}`);
          })(),
          timeoutPromise,
        ]);
      } catch (rendererError: any) {
        console.error(`[VideoGen V4] Renderer execution failed:`, rendererError?.message || rendererError);

        // Update VideoReport as failed
        const failData: any = {
          status: 'failed',
          error: rendererError?.message?.slice(0, 3000) || 'Video generation failed',
        };
        await safeDBQuery(
          () => db.videoReport.update({ where: { id: videoId }, data: failData }),
          'videoReport.update.failed'
        );
      } finally {
        // Clean up input JSON
        try { unlinkSync(inputJsonPath); } catch {}
        // V5 FIX: Clean up output MP4 after R2 upload — saves disk space on Railway
        if (existsSync(outputMp4Path)) {
          try { unlinkSync(outputMp4Path); } catch {}
        }
        if (existsSync(thumbnailPath)) {
          try { unlinkSync(thumbnailPath); } catch {}
        }
        // V350: Release video generation lock
        currentGenerationPromise = null;
      }
    })();

    return immediateResponse;

  } catch (err: any) {
    console.error('[VideoGen V4] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
