// ═══════════════════════════════════════════════════════════════
// French Pipeline Orchestrator V1
// ─────────────────────────────────────────────────────────────
// Continuous-loop orchestrator for the French news pipeline.
// Modeled after the English orchestrator (en-orchestrator.ts) but
// runs independently with its own schedule and state.
//
// CYCLE: fetch French RSS → process (fr-processor → imager → publisher)
// REPORTS: daily brief every 24h, weekly analysis every 168h
//
// CRITICAL DESIGN:
// - Crash-resilient: auto-restarts on any error
// - Watchdog: auto-restarts if no cycle in 5 minutes (V318: was 20 min)
// - Full-pipeline: each article goes through all stages in one pass
// - Independent: does NOT affect the Arabic or English pipelines
// ═══════════════════════════════════════════════════════════════

import { db, pingDB, recoverConnection, startDBKeepalive } from '@/lib/db';
import { FR_PIPELINE_CONFIG, getFrPipelineLimits } from './fr-pipeline-config';
import { isSvgPlaceholderImage } from '@/lib/image-storage';
import { getTodayStart, parseRSSXML, liveQuotaReCheck, runContentLoaderStep, markReadyWithQuotaCap, strongReset, recordAIFailure, recordAISuccess, isDegradedMode } from './shared-pipeline-utils';
import { isCascadeFailure } from '@/lib/ai/ai-provider';

// ── Configurable Intervals ──
const NEWS_CYCLE_INTERVAL_MS = 10 * 60 * 1000;    // 10 minutes between news cycles
const STARTUP_DELAY_MS = 30_000;                   // 30s delay before first cycle
const MAX_ARTICLES_PER_CYCLE = 20;                  // Max articles to process per cycle
const MAX_RETRY_COUNT = 15;                         // Max retries before giving up

// ── Watchdog ──
const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;   // Check every 5 minutes
const WATCHDOG_MAX_IDLE_MS = 5 * 60 * 1000;   // V318: Reduced from 20min to 5min (matching Arabic)

// ── State ──
let isRunning = false;
let isPaused = false;
let cycleCount = 0;
let lastCycleTime = 0;
let lastError: string | null = null;
let totalPublished = 0;
let totalProcessed = 0;
let totalErrors = 0;
let totalFetched = 0;
// V56: Smart Watchdog — track consecutive empty cycles
let consecutiveEmptyCycles = 0;
const MAX_EMPTY_CYCLES_BEFORE_RESET = 10;

// V120: Track strong reset count to detect permanently stuck articles
let strongResetCount = 0;
const MAX_STRONG_RESETS_BEFORE_ARCHIVE = 3;

let cycleTimer: ReturnType<typeof setTimeout> | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;

// Report scheduling
let lastDailyBriefTime = 0;
let lastWeeklyAnalysisTime = 0;
let lastMonthlyOutlookTime = 0;
let lastTechnicalAnalysisTime = 0;
let lastQuarterlyReviewTime = 0;

// ── French RSS Fetcher ──

interface FrFetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;
  errors: number;
  duration: number;
}

async function fetchFrenchRSSFeeds(): Promise<FrFetchResult> {
  const startTime = Date.now();
  const result: FrFetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[FrOrchestrator] Récupération des flux RSS français...');

    const feeds = FR_PIPELINE_CONFIG.RSS_FEEDS_FR;
    const allItems: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      category: string;
      date: string;
    }> = [];

    for (const feed of feeds) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[FrOrchestrator] Flux RSS ${feed.source} a retourné ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSXML(xml, feed.category, feed.source);
        allItems.push(...items);
      } catch (err: any) {
        console.warn(`[FrOrchestrator] Échec de récupération ${feed.source}: ${err.message}`);
        result.errors++;
      }
    }

    if (allItems.length === 0) {
      result.duration = Date.now() - startTime;
      return result;
    }

    // Filtre par mots-clés financiers (français)
    // V321: Filtre élargi — la version précédente était trop stricte,
    // rejetant des articles économiques légitimes
    const FINANCIAL_KEYWORDS = [
      // Finance générale
      /\bactions?\b/i, /\bbourse/i, /\bmarchés?\b/i, /\btrading/i, /\binvest/i,
      /\béconom/i, /\bfinanc/i, /\bbanques?\b/i, /\btaux\b/i, /\bobligations?\b/i, /\brendements?\b/i,
      /\bpib\b/i, /\binflat/i, /\bbce\b/i, /\bfed\b/i, /\bintérêts?\b/i,
      // Actifs
      /\bcrypto\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\bpétrole\b/i, /\bor\b/i,
      /\bdollars?\b/i, /\beuros?\b/i, /\bdevises?\b/i, /\bforex\b/i, /\brécession\b/i, /\bprofits?\b/i,
      /\bchiffre\s+d'affaires/i, /\brésultats?\b/i, /\bintroduction\b/i, /\bfusion/i, /\bacquisit/i,
      /\betf\b/i, /\bwall street\b/i, /\bnasdaq\b/i, /\bs&p\b/i, /\bcac\s*40\b/i, /\bnikkei\b/i, /\bdax\b/i, /\bftse\b/i,
      // Commerce & politique
      /\bdroits\s+de\s+douane/i, /\bcommerce/i, /\bimport/i, /\bexport/i,
      /\bhypothèques?\b/i, /\bprêts?\b/i, /\bdettes?\b/i, /\bdéficits?\b/i,
      /\bfiscal/i, /\bmonét/i, /\bmatières?\s+premières/i, /\bprix\b/i,
      // Entreprise & corporatif
      /\bpdg\b/i, /\bdaf\b/i, /\bdirigeant/i, /\bentreprise\b/i, /\bcorporate/i,
      /\bstartup/i, /\bvalorisation/i, /\blevée\s+de\s+fonds/i, /\bventure/i, /\bcapital/i,
      /\bfaillite/i, /\blicenciement/i, /\bemplois?\b/i, /\bchômage/i,
      /\bchaîne\s+d'approvisionnement/i, /\bindustri/i, /\bproduction/i, /\bconsomm/i,
      /\bdétail/i, /\bventes?\b/i, /\bperspective/i, /\bprévision/i, /\borientation/i,
      /\bactionnaire/i, /\bdividende/i, /\brachat/i, /\baccord/i, /\bcontrat/i,
      /\bsecteur\b/i, /\bfilière\b/i, /\blogement/i, /\bimmobilier/i,
      /\bgaz\b/i, /\bénergie\b/i, /\btechnolog/i, /\btech\b/i,
      /\bautomobile/i, /\bcompagnie\s+aérienne/i, /\bpharma/i, /\bassurance/i,
    ];

    for (const item of allItems) {
      try {
        if (!item.url || item.url.length < 5) {
          result.errors++;
          continue;
        }

        const textToCheck = `${item.title} ${item.summary}`;
        const isFinancial = FINANCIAL_KEYWORDS.some(pattern => pattern.test(textToCheck));
        if (!isFinancial) {
          result.filtered++;
          continue;
        }

        const existing = await db.newsItem.findFirst({
          where: { url: item.url, locale: 'fr' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        const frCategory = FR_PIPELINE_CONFIG.CATEGORY_MAP_FR[item.category] || 'Économie';
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Analyse de sentiment simple (français)
        const positiveWords = ['hausse', 'progression', 'gain', 'rebond', 'stimulus', 'bond', 'record', 'dépasse', 'croissance', 'profit', 'amélioration', 'progresser', 'monter', 'grimper'];
        const negativeWords = ['baisse', 'chute', 'recul', 'déclin', 'effondrement', 'crash', 'perte', 'creux', 'manque', 'coupe', 'récession', 'plonger', 'détérioration', 'reculer'];
        const lowerText = textToCheck.toLowerCase();
        let posScore = 0, negScore = 0;
        positiveWords.forEach(w => { if (lowerText.includes(w)) posScore += 10; });
        negativeWords.forEach(w => { if (lowerText.includes(w)) negScore += 10; });
        const sentiment = posScore > negScore + 10 ? 'positive' : negScore > posScore + 10 ? 'negative' : 'neutral';
        const sentimentScore = posScore > negScore + 10 ? Math.min(55 + posScore, 95) : negScore > posScore + 10 ? Math.min(55 + negScore, 95) : 55;

        const contentFromSummary = item.summary || '';

        try {
          await db.newsItem.create({
            data: {
              title: item.title,
              summary: item.summary,
              content: contentFromSummary,
              source: item.source,
              sourceName: item.source,
              url: item.url,
              category: frCategory,
              categoryId: item.category,
              sentiment,
              sentimentScore,
              impactLevel: 'medium',
              impactScore: 30,
              originalLanguage: 'fr',
              newsType: 'live',
              affectedAssets: '[]',
              isPublished: false,
              isReady: false,
              processingStage: 'fetched',
              retryCount: 0,
              slug: slug || `fr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              locale: 'fr',
            },
          });

          result.fetched++;
        } catch (createErr: any) {
          // V256: P2002 on slug+locale — retry avec un nouveau slug (suffixe aléatoire)
          if (createErr.code === 'P2002') {
            try {
              const retrySlug = generateSlug(item.title); // Nouveau suffixe aléatoire
              await db.newsItem.create({
                data: {
                  title: item.title,
                  summary: item.summary,
                  content: contentFromSummary,
                  source: item.source,
                  sourceName: item.source,
                  url: item.url,
                  category: frCategory,
                  categoryId: item.category,
                  sentiment,
                  sentimentScore,
                  impactLevel: 'medium',
                  impactScore: 30,
                  originalLanguage: 'fr',
                  newsType: 'live',
                  affectedAssets: '[]',
                  isPublished: false,
                  isReady: false,
                  processingStage: 'fetched',
                  retryCount: 0,
                  slug: retrySlug,
                  locale: 'fr',
                },
              });
              result.fetched++;
            } catch (retryErr: any) {
              // Second P2002 = vrai doublon
              result.duplicates++;
            }
          } else {
            throw createErr; // Re-lancer vers le catch externe
          }
        }
      } catch (err: any) {
        // Erreur non-P2002 — logger et continuer
        result.errors++;
        console.error(`[FrOrchestrator] Erreur lors de la sauvegarde "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    if (result.fetched > 0) {
      console.log(`[FrOrchestrator] Récupéré ${result.fetched} nouveau(x), ${result.duplicates} doublon(s), ${result.filtered} filtré(s), ${result.errors} erreur(s) en ${result.duration}ms`);
    }
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[FrOrchestrator] Erreur fatale lors de la récupération:', err.message);
    return result;
  }
}

// ── French Pipeline Processing ──

interface FrProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

async function processFrenchArticles(maxArticles: number = MAX_ARTICLES_PER_CYCLE): Promise<FrProcessResult> {
  const startTime = Date.now();
  const result: FrProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'fr',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped', 'imaged'] },
        retryCount: { lt: MAX_RETRY_COUNT },
        title: { not: '' },
      },
      orderBy: [
        { processingStage: 'desc' },  // Traiter les étapes avancées en premier (plus proches de la publication)
        { fetchedAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        processingStage: true,
        retryCount: true,
      },
      take: maxArticles,
    });

    if (unprocessedArticles.length === 0) {
      result.details.push('Aucun article à traiter');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[FrOrchestrator] Trouvé ${unprocessedArticles.length} articles français à traiter`);

    // Vérifier les limites de publication FR — V314: dynamique depuis la DB
    const frLimits = await getFrPipelineLimits();
    const maxDaily = frLimits.maxDailyFrNews;
    const maxHourly = frLimits.maxHourlyFrNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(FR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' — quota should ONLY count live news articles,
    // NOT reports/analyses. Without this, reports were counted against the daily
    // limit, causing the pipeline to stop publishing news prematurely.
    const frPublishedFilter = {
      locale: 'fr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    // V317: Utiliser publishedAt au lieu de fetchedAt pour un comptage précis des quotas
    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...frPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...frPublishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Quota atteint — heure: ${publishedThisHour}/${maxHourly}, jour: ${publishedToday}/${maxDaily}`);
      result.duration = Date.now() - startTime;
      return result;
    }

    let publishCount = 0;

    for (const article of unprocessedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unprocessedArticles.length - result.processed;
        break;
      }

      // V358: Live quota re-check every 5 articles
      if (publishCount > 0 && publishCount % 5 === 0) {
        const quotaExceeded = await liveQuotaReCheck('fr', todayStart, hourStart, maxDaily, maxHourly, publishCount);
        if (quotaExceeded) {
          result.skipped += unprocessedArticles.length - result.processed;
          break;
        }
      }

      try {
        // V373: Reset skipped articles back to fetched before processing
        if (article.processingStage === 'skipped') {
          await db.newsItem.update({
            where: { id: article.id },
            data: { processingStage: 'fetched', retryCount: 0, lastError: null },
          });
          console.log(`[FrOrchestrator V373] Reset skipped article ${article.id} → fetched for reprocessing`);
        }

        // V415 FIX: If article is already at 'imaged' stage, skip processor and imager — go directly to publisher.
        // Previously, the orchestrator ran processor on 'imaged' articles, which set
        // processingStage='analyzed' (DOWNGRADE!), creating an infinite loop:
        //   imaged → processor(analyzed) → imager(imaged) → processor(analyzed) → ...
        if (article.processingStage === 'imaged') {
          let publishSuccess = false;
          try {
            const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
            const pubResult = await publishArticle(article.id);
            if (pubResult.success) {
              publishSuccess = true;
            } else {
              // Publisher rejected — try Canvas direct publish
              console.warn(`[FrOrchestrator V415] Publisher rejected imaged article ${article.id}, trying Canvas fallback...`);
              try {
                const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
                const articleFull = await db.newsItem.findUnique({
                  where: { id: article.id },
                  select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true, title: true, content: true, aiAnalysis: true, fetchedAt: true },
                });
                const canvasBuffer = await generateArticleImage({
                  title: articleFull?.title || article.title || 'Actualités financières',
                  category: articleFull?.categoryId || articleFull?.category || 'economy',
                  locale: 'fr',
                  newsType: articleFull?.newsType || undefined,
                  sentiment: articleFull?.sentiment || undefined,
                  source: articleFull?.sourceName || articleFull?.source || undefined,
                });
                if (canvasBuffer && canvasBuffer.length > 500) {
                  const { uploadImageToR2 } = await import('@/lib/image-storage');
                  const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
                  const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                  const storedValue = r2Result.success ? r2Result.url : null;
                  const { generateSlug } = await import('@/lib/slug');
                  const slug = articleFull?.title ? generateSlug(articleFull.title) : article.id;
                  await db.newsItem.update({
                    where: { id: article.id },
                    data: {
                      generatedImage: storedValue,
                      imageUrl: storedValue.startsWith('http') ? storedValue : `/api/article-image/${article.id}`,
                      isReady: true,
                      isPublished: true,
                      processingStage: 'imaged',
                      publishedAt: articleFull?.fetchedAt || new Date(),
                      slug: slug || article.id,
                    },
                  });
                  try {
                    const { recordPublish } = await import('./publish-quota');
                    recordPublish('fr');
                  } catch { /* non-critical */ }
                  publishSuccess = true;
                }
              } catch (canvasErr: any) {
                console.error(`[FrOrchestrator V415] Canvas fallback failed for imaged article ${article.id}: ${canvasErr.message}`);
              }
            }
          } catch (pubErr: any) {
            console.error(`[FrOrchestrator V415] Publisher error for imaged article ${article.id}: ${pubErr.message}`);
          }
          if (publishSuccess) {
            publishCount++;
            result.published++;
            result.processed++;
          } else {
            result.failed++;
          }
          continue; // Skip full processing for imaged articles
        }

        // ── Step 0: Load full article content from source URL (if not already loaded) ──
        if (article.processingStage === 'fetched') {
          try {
            await runContentLoaderStep(article.id, 'fr');
          } catch (clErr: any) {
            console.warn(`[FrOrchestrator] Content loader error for ${article.id}: ${clErr.message}`);
          }
        }

        // ── Étape 1: Exécuter fr-processor (analyse IA + enrichissement du contenu) ──
        let processorSuccess = false;
        try {
          const { processArticleFr } = await import('@/lib/pipeline/agents/fr-processor');
          const frResult = await processArticleFr(article.id);
          if (frResult.success) {
            processorSuccess = true;
            recordAISuccess('fr');
          } else {
            // Réessayer une fois
            const retryResult = await processArticleFr(article.id);
            if (retryResult.success) {
              processorSuccess = true;
              recordAISuccess('fr');
            } else {
              recordAIFailure('fr');
            }
          }
        } catch (procErr: any) {
          console.error(`[FrOrchestrator] Erreur fr-processor pour ${article.id}: ${procErr.message}`);
          recordAIFailure('fr');
        }

        // ── Étape 2: Exécuter l'imager ──
        let imageSuccess = false;
        try {
          const { imageArticle } = await import('@/lib/pipeline/agents/imager');
          const imageResult = await imageArticle(article.id);
          if (imageResult.success) {
            imageSuccess = true;
          }
        } catch (imgErr: any) {
          console.error(`[FrOrchestrator] Erreur imager pour ${article.id}: ${imgErr.message}`);
        }

        // ── Étape 3: Exécuter l'éditeur ──
        let publishSuccess = false;
        try {
          const updatedArticle = await db.newsItem.findUnique({
            where: { id: article.id },
            // EGRESS FIX: removed generatedImage from select — use processingStage to check image existence
            select: { processingStage: true, aiAnalysis: true, content: true, title: true },
          });

          if (updatedArticle?.processingStage === 'imaged') {
            const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
            const pubResult = await publishArticle(article.id);
            if (pubResult.success) {
              publishSuccess = true;
              publishCount++;
              result.published++;
            }
          } else {
            // Repli sur image Canvas + publication directe
            try {
              const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
              const articleFull = await db.newsItem.findUnique({
                where: { id: article.id },
                select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
              });

              const canvasBuffer = await generateArticleImage({
                title: updatedArticle?.title || article.title || 'Actualités Financières',
                category: articleFull?.categoryId || articleFull?.category || 'economy',
                locale: 'fr',
                newsType: articleFull?.newsType || undefined,
                sentiment: articleFull?.sentiment || undefined,
                source: articleFull?.sourceName || articleFull?.source || undefined,
              });

              if (canvasBuffer && canvasBuffer.length > 500) {
                const { uploadImageToR2 } = await import('@/lib/image-storage');
                const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
                const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                const storedValue = r2Result.success ? r2Result.url : null;

                // V413: Use MIN_FR_CONTENT_LENGTH (80) instead of hardcoded 200
                const hasContent = (updatedArticle?.content && updatedArticle.content.length >= FR_PIPELINE_CONFIG.MIN_FR_CONTENT_LENGTH);
                const hasAnalysis = (updatedArticle?.aiAnalysis && updatedArticle.aiAnalysis.length > 50);

                if (hasContent && hasAnalysis) {
                  await db.newsItem.update({
                    where: { id: article.id },
                    data: { generatedImage: storedValue, processingStage: 'imaged' },
                  });
                  const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
                  const pubResult = await publishArticle(article.id);
                  if (pubResult.success) {
                    publishSuccess = true;
                    publishCount++;
                    result.published++;
                  }
                } else {
                  // Mode dégradé
                  const degraded = isDegradedMode('fr');
                  // V359: Check quota BEFORE direct publish (bypasses publisher agent)
                  let quotaAllowed = true;
                  try {
                    const { canPublish } = await import('./publish-quota');
                    const quotaCheck = await canPublish('fr');
                    if (!quotaCheck.allowed) {
                      quotaAllowed = false;
                      console.warn(`[FrOrchestrator V359] Canvas fallback BLOCKED by quota: ${quotaCheck.reason}`);
                    }
                  } catch { /* fail-open */ }

                  if (quotaAllowed) {
                    const { generateSlug } = await import('@/lib/slug');
                    const slug = updatedArticle?.title ? generateSlug(updatedArticle.title) : article.id;
                    const articleForDate = await db.newsItem.findUnique({ where: { id: article.id }, select: { fetchedAt: true } });
                    await db.newsItem.update({
                      where: { id: article.id },
                      data: {
                        generatedImage: storedValue,
                        imageUrl: storedValue.startsWith('http') ? storedValue : `/api/article-image/${article.id}`,
                        isReady: true,
                        isPublished: true,
                        processingStage: 'imaged',
                        publishedAt: articleForDate?.fetchedAt || new Date(),
                        slug: slug || article.id,
                      },
                    });
                    // V359: Record publish in quota manager
                    try {
                      const { recordPublish } = await import('./publish-quota');
                      recordPublish('fr');
                    } catch { /* non-critical */ }
                    publishSuccess = true;
                    publishCount++;
                    result.published++;
                  }
                }
              }
            } catch (canvasErr: any) {
              console.error(`[FrOrchestrator] Échec du repli Canvas pour ${article.id}: ${canvasErr.message}`);
            }
          }
        } catch (pubErr: any) {
          console.error(`[FrOrchestrator] Erreur éditeur pour ${article.id}: ${pubErr.message}`);
        }

        if (publishSuccess) {
          result.processed++;
        } else if (processorSuccess || imageSuccess) {
          result.processed++;
          result.failed++;
        } else {
          result.failed++;
        }
      } catch (err: any) {
        result.failed++;
        console.error(`[FrOrchestrator] Erreur de traitement de l'article ${article.id}: ${err.message}`);
        try {
          const { recordError } = await import('@/lib/pipeline/queue/job-manager');
          await recordError(article.id, `Erreur pipeline FR: ${err.message}`);
        } catch { /* non critique */ }
      }
    }

    result.details.push(`Traités: ${result.processed}, Publiés: ${result.published}, Échoués: ${result.failed}, Ignorés: ${result.skipped}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Erreur fatale: ${err.message}`);
    console.error(`[FrOrchestrator] Erreur fatale de traitement: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Retraiter les articles incomplets ──

async function reprocessFrenchArticles(maxArticles: number = 3): Promise<FrProcessResult> {
  const startTime = Date.now();
  const result: FrProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const candidateArticles = await db.newsItem.findMany({
      where: {
        locale: 'fr',
        isReady: true,
        isPublished: true,
        OR: [
          { aiAnalysis: null },
          { aiAnalysis: '' },
          { generatedImage: null },
          { generatedImage: '' },
        ],
      },
      orderBy: { fetchedAt: 'desc' },
      // EGRESS FIX: removed generatedImage from select — where clause already filters null/empty
      select: { id: true, title: true, aiAnalysis: true, processingStage: true },
      take: maxArticles * 3,
    });

    // EGRESS FIX: simplified filter — where clause already ensures null/empty generatedImage is caught
    // SVG placeholder detection is handled by auto-migrate
    const incompleteArticles = candidateArticles.filter((a: any) => {
      const hasAnalysis = a.aiAnalysis && a.aiAnalysis.length >= 50;
      // Articles with null/empty generatedImage are already caught by the OR where clause
      // Articles with generatedImage set are assumed valid (SVG handled by auto-migrate)
      return !hasAnalysis;
    }).slice(0, maxArticles);

    if (incompleteArticles.length === 0) {
      result.details.push('Aucun article incomplet');
      result.duration = Date.now() - startTime;
      return result;
    }

    for (const article of incompleteArticles) {
      try {
        const needsAnalysis = !article.aiAnalysis || article.aiAnalysis.length < 50;
        // EGRESS FIX: use processingStage instead of generatedImage to determine if image is needed
        const needsImage = article.processingStage !== 'imaged';

        if (needsAnalysis) {
          try {
            const { processArticleFr } = await import('@/lib/pipeline/agents/fr-processor');
            await processArticleFr(article.id);
          } catch { /* non critique */ }
        }

        if (needsImage) {
          try {
            await db.newsItem.update({
              where: { id: article.id },
              data: { generatedImage: null, processingStage: 'analyzed' },
            });
            const { imageArticle } = await import('@/lib/pipeline/agents/imager');
            const imgResult = await imageArticle(article.id);
            if (!imgResult.success) {
              // Repli Canvas
              try {
                const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
                const articleData = await db.newsItem.findUnique({
                  where: { id: article.id },
                  select: { title: true, category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
                });
                const canvasBuffer = await generateArticleImage({
                  title: articleData?.title || article.title || 'Actualités Financières',
                  category: articleData?.categoryId || articleData?.category || 'economy',
                  locale: 'fr',
                  newsType: articleData?.newsType || undefined,
                  sentiment: articleData?.sentiment || undefined,
                  source: articleData?.sourceName || articleData?.source || undefined,
                });
                if (canvasBuffer && canvasBuffer.length > 500) {
                  const { uploadImageToR2 } = await import('@/lib/image-storage');
                  const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
                  const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                  const storedValue = r2Result.success ? r2Result.url : null;
                  await db.newsItem.update({
                    where: { id: article.id },
                    data: { generatedImage: storedValue },
                  });
                }
              } catch { /* non critique */ }
            }
          } catch { /* non critique */ }
        }

        // Mettre à jour imageUrl
        // EGRESS FIX: always use API route for imageUrl instead of pulling base64 generatedImage
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            imageUrl: `/api/article-image/${article.id}`,
          },
        });

        result.processed++;
        result.published++;
      } catch (err: any) {
        result.failed++;
      }
    }
  } catch (err: any) {
    result.failed++;
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Génération de rapports ──

async function generateReportsIfNeeded(): Promise<void> {
  const now = Date.now();

  // V400: Only update timer on SUCCESS — prevents 24h dead zone when generation fails
  // Résumé quotidien toutes les 24h
  if (now - lastDailyBriefTime >= FR_PIPELINE_CONFIG.FR_DAILY_INTERVAL_MS) {
    try {
      console.log('[FrOrchestrator] Génération du résumé quotidien français...');
      const { generateDailyBriefFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      const report = await generateDailyBriefFr('daily');
      if (report) {
        console.log(`[FrOrchestrator] Résumé quotidien généré: "${report.title}" (${report.confidenceScore}%)`);
        lastDailyBriefTime = now;
      } else {
        console.log('[FrOrchestrator V400] Résumé quotidien null — minuteur NON mis à jour');
      }
    } catch (err: any) {
      console.warn(`[FrOrchestrator] Échec de la génération du résumé quotidien: ${err.message}`);
    }
  }

  // Analyses hebdomadaires pour TOUTES les classes d'actifs activées tous les 7 jours
  if (now - lastWeeklyAnalysisTime >= FR_PIPELINE_CONFIG.FR_WEEKLY_INTERVAL_MS) {
    try {
      console.log('[FrOrchestrator] Génération des analyses hebdomadaires françaises...');
      const { generateWeeklyAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      const assetClasses = FR_PIPELINE_CONFIG.FR_REPORT_ASSET_CLASSES;
      let generated = 0;
      for (const ac of assetClasses) {
        try {
          const analysis = await generateWeeklyAnalysisFr(ac as any);
          if (analysis) generated++;
        } catch { /* ignorer les classes d'actifs échouées */ }
      }
      if (generated > 0) {
        console.log(`[FrOrchestrator] Généré ${generated} analyses hebdomadaires sur ${assetClasses.length} classes d'actifs`);
        lastWeeklyAnalysisTime = now;
      }
    } catch (err: any) {
      console.warn(`[FrOrchestrator] Échec de la génération des analyses hebdomadaires: ${err.message}`);
    }
  }

  // Perspective mensuelle tous les 30 jours
  if (now - lastMonthlyOutlookTime >= FR_PIPELINE_CONFIG.FR_MONTHLY_INTERVAL_MS) {
    try {
      console.log('[FrOrchestrator] Génération de la perspective mensuelle française...');
      const { generateMonthlyOutlookFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      const report = await generateMonthlyOutlookFr();
      if (report) {
        console.log(`[FrOrchestrator] Perspective mensuelle générée: "${report.title}" (${report.confidenceScore}%)`);
        lastMonthlyOutlookTime = now;
      }
    } catch (err: any) {
      console.warn(`[FrOrchestrator] Échec de la génération de la perspective mensuelle: ${err.message}`);
    }
  }

  // Analyse technique toutes les 8 heures
  if (now - lastTechnicalAnalysisTime >= FR_PIPELINE_CONFIG.FR_TECHNICAL_INTERVAL_MS) {
    try {
      console.log('[FrOrchestrator] Génération de l\'analyse technique française...');
      const { generateTechnicalAnalysisFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      const analysis = await generateTechnicalAnalysisFr();
      if (analysis) {
        console.log(`[FrOrchestrator] Analyse technique générée: "${analysis.title}" (${analysis.confidenceScore}%)`);
        lastTechnicalAnalysisTime = now;
      }
    } catch (err: any) {
      console.warn(`[FrOrchestrator] Échec de la génération de l'analyse technique: ${err.message}`);
    }
  }

  // Revue trimestrielle tous les 90 jours
  if (now - lastQuarterlyReviewTime >= FR_PIPELINE_CONFIG.FR_QUARTERLY_INTERVAL_MS) {
    try {
      console.log('[FrOrchestrator] Génération de la revue trimestrielle française...');
      const { generateDailyBriefFr } = await import('@/lib/pipeline/agents/fr-report-generator');
      const report = await generateDailyBriefFr('quarterly');
      if (report) {
        console.log(`[FrOrchestrator] Revue trimestrielle générée: "${report.title}" (${report.confidenceScore}%)`);
        lastQuarterlyReviewTime = now;
      }
    } catch (err: any) {
      console.warn(`[FrOrchestrator] Échec de la génération de la revue trimestrielle: ${err.message}`);
    }
  }

  // V413: Auto-infographic generation DISABLED — manual only via /api/infographics/generate-fr
}

// ── Maintenance ──

async function runHousekeeping(): Promise<void> {
  // Fetch limits once at the top level so all blocks can use them
  const frHkLimits = await getFrPipelineLimits();

  try {
    // V356: Corriger isReady=true mais isPublished=false AVEC contrôle des limites
    const frHkNow = new Date();
    const frHkHourStart = new Date(frHkNow);
    frHkHourStart.setUTCMinutes(0, 0, 0);
    const frHkTodayStart = getTodayStart(FR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' to match quota filter
    const frHkVisFilter = {
      locale: 'fr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [frHkPubToday, frHkPubThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...frHkVisFilter, publishedAt: { gte: frHkTodayStart } } }),
      db.newsItem.count({ where: { ...frHkVisFilter, publishedAt: { gte: frHkHourStart } } }),
    ]);

    const frHkRemainingHourly = frHkLimits.maxHourlyFrNews > 0
      ? Math.max(0, frHkLimits.maxHourlyFrNews - frHkPubThisHour) : 999;
    const frHkRemainingDaily = frHkLimits.maxDailyFrNews > 0
      ? Math.max(0, frHkLimits.maxDailyFrNews - frHkPubToday) : 999;
    const frHkMaxFix = Math.min(frHkRemainingHourly, frHkRemainingDaily);

    if (frHkMaxFix > 0) {
      // V1044: Only publish articles with complete analysis + image (golden rule)
      const articlesToFrFix = await db.newsItem.findMany({
        where: {
          isReady: true,
          isPublished: false,
          locale: 'fr',
          aiAnalysis: { contains: 'fullContent' },
          generatedImage: { not: '' },
        },
        select: { id: true, fetchedAt: true },
        take: frHkMaxFix,
      });
      if (articlesToFrFix.length > 0) {
        // Set publishedAt = fetchedAt for each article (not new Date())
        for (const article of articlesToFrFix) {
          await db.newsItem.update({
            where: { id: article.id },
            data: { isPublished: true, publishedAt: article.fetchedAt || new Date() },
          });
        }
        if (articlesToFrFix.length > 0) {
          // V359: Record publishes in quota manager's in-process tracking
          try {
            const { recordPublish } = await import('./publish-quota');
            for (let i = 0; i < articlesToFrFix.length; i++) {
              recordPublish('fr');
            }
          } catch { /* non-critical */ }
          console.log(`[FrOrchestrator V356] Corrigé ${articlesToFrFix.length} articles FR (quota: heure=${frHkPubThisHour}/${frHkLimits.maxHourlyFrNews}, jour=${frHkPubToday}/${frHkLimits.maxDailyFrNews})`);
        }
      }
    } else {
      console.log(`[FrOrchestrator V356] Quota atteint — correction ignorée. Heure: ${frHkPubThisHour}/${frHkLimits.maxHourlyFrNews}, Jour: ${frHkPubToday}/${frHkLimits.maxDailyFrNews}`);
    }
  } catch (err: any) {
    console.warn(`[FrOrchestrator] Échec de la maintenance: ${err.message}`);
  }

  // Mark-ready with 30% quota cap (matching Arabic pipeline)
  try {
    const markResult = await markReadyWithQuotaCap('fr', frHkLimits.maxDailyFrNews, frHkLimits.maxHourlyFrNews, FR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');
    if (markResult.markedCount > 0 || markResult.fixedPublishedCount > 0) {
      console.log(`[FrOrchestrator] Mark-ready: ${markResult.markedCount} marked, ${markResult.fixedPublishedCount} fixed`);
    }
  } catch (markErr: any) {
    console.warn(`[FrOrchestrator] Mark-ready error: ${markErr.message}`);
  }

  try {
    // Réinitialiser les articles FR bloqués
    const stuckArticles = await db.newsItem.findMany({
      where: {
        locale: 'fr',
        isReady: false,
        isPublished: false,
        retryCount: { gte: MAX_RETRY_COUNT },
      },
      select: { id: true },
      take: 50,
    });

    if (stuckArticles.length > 0) {
      await db.newsItem.updateMany({
        where: { id: { in: stuckArticles.map((a: any) => a.id) } },
        data: { retryCount: 0, lastError: null, processingStage: 'fetched' },
      });
      console.log(`[FrOrchestrator] Réinitialisé ${stuckArticles.length} articles FR bloqués`);
    }
  } catch (err: any) {
    console.warn(`[FrOrchestrator] Échec de la réinitialisation des articles bloqués: ${err.message}`);
  }

  // Strong reset for stuck/skipped articles (matching Arabic pipeline)
  // V120: After 3 consecutive strong resets, archive permanently stuck articles
  try {
    await strongReset('fr', MAX_RETRY_COUNT);
    strongResetCount++;

    if (strongResetCount >= MAX_STRONG_RESETS_BEFORE_ARCHIVE) {
      // Archive articles that keep failing after multiple strong resets.
      const stuckToArchive = await db.newsItem.findMany({
        where: {
          locale: 'fr',
          isReady: false,
          isPublished: false,
          retryCount: { gte: Math.floor(MAX_RETRY_COUNT / 2) },
          lastError: { not: null },
        },
        orderBy: { fetchedAt: 'desc' },
        select: { id: true, lastError: true },
        take: 200,
      });

      if (stuckToArchive.length > 0) {
        const archived = await db.newsItem.deleteMany({
          where: {
            id: { in: stuckToArchive.map(a => a.id) },
          },
        });
        console.warn(`[FrOrchestrator V120] ARCHIVED ${archived.count} permanently stuck articles after ${strongResetCount} strong resets. Errors: ${stuckToArchive.slice(0, 3).map(a => a.lastError?.substring(0, 60)).join(' | ')}`);
      }

      strongResetCount = 0;
    }
  } catch (resetErr: any) {
    console.warn(`[FrOrchestrator] Strong reset error: ${resetErr.message}`);
  }

  try {
    // V372: Reset skipped articles back to fetched instead of deleting them
    // Previously, articles >12h in 'fetched' stage were DELETED — this caused massive data loss
    // Now we reset them for reprocessing instead
    const ageCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const resetOld = await db.newsItem.updateMany({
      where: {
        locale: 'fr',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'skipped'] },
        fetchedAt: { lt: ageCutoff },
        retryCount: { lt: MAX_RETRY_COUNT },
      },
      data: {
        processingStage: 'fetched',
        retryCount: 0,
        lastError: null,
      },
    });
    if (resetOld.count > 0) {
      console.log(`[FrOrchestrator V372] Reset ${resetOld.count} old FR articles (>12h) for reprocessing instead of deleting`);
    }

    // Purge only truly stuck articles (>24h, already retried many times)
    const veryOldCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const purged = await db.newsItem.deleteMany({
      where: {
        locale: 'fr',
        isReady: false,
        isPublished: false,
        processingStage: 'fetched',
        fetchedAt: { lt: veryOldCutoff },
        retryCount: { gte: MAX_RETRY_COUNT },
      },
    });
    if (purged.count > 0) {
      console.log(`[FrOrchestrator V372] Purged ${purged.count} truly stuck FR articles (>24h, max retries)`);
    }
  } catch (err: any) {
    console.warn(`[FrOrchestrator] Échec de la purge des articles expirés: ${err.message}`);
  }
}

// ── Cycle principal ──

async function runCycle(): Promise<void> {
  if (!isRunning) return;
  if (isPaused) {
    scheduleNextCycle();
    return;
  }

  cycleCount++;
  const cycleStart = Date.now();

  // ── V322→V323: Vérification de santé DB pré-cycle avec récupération améliorée ──
  // Avant de faire quoi que ce soit, vérifier que la base de données est accessible.
  // Si non, tenter une récupération (jusqu'à 3 tentatives) et sauter ce cycle si toutes échouent.
  let dbOk = await pingDB();
  if (!dbOk) {
    console.warn(`[FrOrchestrator V323] DB inaccessible — tentative de récupération...`);
    for (let recoveryAttempt = 1; recoveryAttempt <= 3; recoveryAttempt++) {
      const recovered = await recoverConnection();
      if (recovered) {
        dbOk = await pingDB();
        if (dbOk) {
          console.log(`[FrOrchestrator V323] ✓ DB récupérée à la tentative ${recoveryAttempt} — poursuite du cycle #${cycleCount}`);
          break;
        }
      }
      // Attendre avant la prochaine tentative de récupération
      console.warn(`[FrOrchestrator V323] Tentative de récupération ${recoveryAttempt}/3 échouée — attente ${recoveryAttempt * 5}s...`);
      await new Promise(r => setTimeout(r, recoveryAttempt * 5000));
    }
    if (!dbOk) {
      console.error(`[FrOrchestrator V323] ✗ Les 3 tentatives de récupération DB ont échoué — cycle #${cycleCount} ignoré`);
      lastError = 'Connexion à la base de données échouée — 3 tentatives de récupération infructueuses';
      totalErrors++;
      scheduleNextCycle();
      return;
    }
  }

  console.log(`[FrOrchestrator] Cycle #${cycleCount} en cours...`);

  try {
    // V359: Early quota check — skip processing if limits reached.
    try {
      const { canPublish } = await import('./publish-quota');
      const quotaCheck = await canPublish('fr');
      if (!quotaCheck.allowed) {
        // Still fetch to keep queue fresh, but skip processing
        const fetchResult = await fetchFrenchRSSFeeds();
        totalFetched += fetchResult.fetched;
        console.log(`[FrOrchestrator V359] Quota atteint — traitement ignoré. Fetch: ${fetchResult.fetched}. ${quotaCheck.reason}`);
        lastCycleTime = Date.now();
        scheduleNextCycle();
        return;
      }
    } catch (quotaErr: any) {
      console.warn(`[FrOrchestrator V359] Échec de vérification du quota: ${quotaErr.message}`);
    }

    // ── Étape 1: Récupérer les nouveaux articles français ──
    const fetchResult = await fetchFrenchRSSFeeds();
    totalFetched += fetchResult.fetched;

    // V121: CASCADE FAILURE — log warning but CONTINUE processing.
    // It's better to process SOME articles with available providers than ZERO.
    if (isCascadeFailure()) {
      console.warn(`[FrOrchestrator V121] AI provider CASCADE FAILURE detected — continuing processing with available providers. Multiple providers are rate-limited but pipeline will NOT stop.`);
    }

    // ── Étape 2: Traiter les articles récupérés dans le pipeline complet ──
    const processResult = await processFrenchArticles(MAX_ARTICLES_PER_CYCLE);

    // ── Étape 3: Retraiter les articles publiés incomplets ──
    let reprocessResult: FrProcessResult | null = null;
    if (cycleCount % 3 === 0) { // Tous les 3 cycles (~45 min)
      reprocessResult = await reprocessFrenchArticles(3);
    }

    totalProcessed += processResult.processed;
    totalPublished += processResult.published;
    totalErrors += processResult.failed;
    lastError = null;

    // V56: Smart Watchdog — track consecutive empty cycles
    if (processResult.published === 0 && processResult.processed > 0) {
      consecutiveEmptyCycles++;
      if (consecutiveEmptyCycles >= MAX_EMPTY_CYCLES_BEFORE_RESET) {
        console.warn(`[FrOrchestrator V56] Smart Watchdog: ${consecutiveEmptyCycles} consecutive empty cycles! Triggering strong reset...`);
        try {
          await strongReset('fr', MAX_RETRY_COUNT);
        } catch (resetErr: any) {
          console.warn(`[FrOrchestrator V56] Smart Watchdog strong reset error: ${resetErr.message}`);
        }
        consecutiveEmptyCycles = 0;
      }
    } else if (processResult.published > 0) {
      consecutiveEmptyCycles = 0;
    }

    // ── Étape 4: Générer les rapports si nécessaire ──
    await generateReportsIfNeeded();

    // ── Étape 5: Maintenance (V373: every 3 cycles instead of 10 — faster recovery from skipped state) ──
    if (cycleCount % 3 === 0) {
      await runHousekeeping();
    }

    // V244: Reset terminal-stage articles (rejected + skipped) back to 'fetched'.
    // Only for locale 'fr', only articles newer than 24h.
    try {
      const terminalCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const terminalArticles = await db.newsItem.findMany({
        where: {
          locale: 'fr',
          processingStage: { in: ['rejected', 'skipped'] },
          isReady: false,
          isPublished: false,
          fetchedAt: { gte: terminalCutoff },
        },
        select: { id: true },
        take: 100,
      });
      if (terminalArticles.length > 0) {
        const resetResult = await db.newsItem.updateMany({
          where: { id: { in: terminalArticles.map(a => a.id) } },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            lastError: null,
          },
        });
        if (resetResult.count > 0) {
          console.log(`[FrOrchestrator V244] Reset ${resetResult.count} terminal-stage (rejected/skipped) articles back to 'fetched' for re-processing`);
        }
      }
    } catch (err: any) {
      console.warn(`[FrOrchestrator V244] Terminal-stage reset failed: ${err.message}`);
    }

    const cycleDuration = Date.now() - cycleStart;
    lastCycleTime = Date.now();

    if (processResult.published > 0 || fetchResult.fetched > 0) {
      console.log(`[FrOrchestrator] Cycle #${cycleCount} terminé: récupéré ${fetchResult.fetched}, publié ${processResult.published}, échoué ${processResult.failed}${reprocessResult ? `, retraité ${reprocessResult.processed}` : ''} en ${cycleDuration}ms`);
    }
  } catch (err: any) {
    lastError = err.message;
    totalErrors++;
    console.error(`[FrOrchestrator] ERREUR FATALE Cycle #${cycleCount}:`, err.message);
  }

  scheduleNextCycle();
}

// ── Planifier le prochain cycle ──

function scheduleNextCycle(): void {
  if (!isRunning) return;
  cycleTimer = setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[FrOrchestrator] Échec du cycle: ${err.message}`);
      scheduleNextCycle(); // Toujours maintenir la boucle en marche
    }
  }, NEWS_CYCLE_INTERVAL_MS);
}

// ── API publique ──

export function startFrOrchestrator(): void {
  if (isRunning) {
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[FrOrchestrator] EN COURS mais OBSOLÈTE — dernier cycle il y a ${Math.round(idleMs / 60000)} min. Redémarrage forcé!`);
      stopFrOrchestrator();
    } else {
      console.log('[FrOrchestrator] Déjà en cours d\'exécution');
      return;
    }
  }

  isRunning = true;
  isPaused = false;

  // V4: Démarrer le keepalive DB pour empêcher Supabase de supprimer les connexions inactives.
  // Le keepalive fait UNIQUEMENT un ping — il n'appelle PAS pg_terminate_backend (qui était
  // la cause racine du problème récurrent "DB: Déconnecté" dans V3).
  try {
    startDBKeepalive();
    console.log('[FrOrchestrator V4] ✓ Keepalive DB démarré (ping toutes les 2 min, pas de pg_terminate_backend)');
  } catch {
    console.warn('[FrOrchestrator V4] Échec du démarrage du keepalive DB — reposera sur la récupération par cycle');
  }

  console.log(`[FrOrchestrator] Démarrage — cycle toutes les ${NEWS_CYCLE_INTERVAL_MS / 1000}s, max ${MAX_ARTICLES_PER_CYCLE} articles/cycle. Watchdog: redémarre si inactif > ${WATCHDOG_MAX_IDLE_MS / 60000} min. Rapports: quotidien/hebdomadaire/mensuel/technique via FR_PIPELINE_CONFIG.`);

  // Initialiser les minuteurs de rapports
  if (lastDailyBriefTime === 0) lastDailyBriefTime = Date.now();
  if (lastWeeklyAnalysisTime === 0) lastWeeklyAnalysisTime = Date.now();
  if (lastMonthlyOutlookTime === 0) lastMonthlyOutlookTime = Date.now();
  if (lastTechnicalAnalysisTime === 0) lastTechnicalAnalysisTime = Date.now();
  if (lastQuarterlyReviewTime === 0) lastQuarterlyReviewTime = Date.now();

  // Démarrer le watchdog
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    if (!isRunning) return;
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[FrOrchestrator Watchdog] OBSOLÈTE — dernier cycle il y a ${Math.round(idleMs / 60000)} min. Redémarrage forcé!`);
      stopFrOrchestrator();
      startFrOrchestrator();
    }
  }, WATCHDOG_INTERVAL_MS);

  // Démarrer le premier cycle après le délai de démarrage
  setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[FrOrchestrator] Échec du cycle initial: ${err.message}`);
      scheduleNextCycle();
    }
  }, STARTUP_DELAY_MS);
}

export function stopFrOrchestrator(): void {
  isRunning = false;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  console.log('[FrOrchestrator] Arrêté');
}

export function pauseFrOrchestrator(): void {
  isPaused = true;
  console.log('[FrOrchestrator] En pause');
}

export function resumeFrOrchestrator(): void {
  isPaused = false;
  console.log('[FrOrchestrator] Repris');
}

export async function getFrOrchestratorStats() {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const frLimits = await getFrPipelineLimits();

  // V359: Query DB for actual total published count instead of in-memory counter.
  // The in-memory counter resets to 0 on server restart, causing impossible stats
  // like totalPublished < todayPublished. The DB count is always accurate.
  // V377: Use visibility filter — only count live news visible on the frontend
  let dbTotalPublished = totalPublished; // fallback to in-memory counter
  try {
    dbTotalPublished = await db.newsItem.count({
      where: {
        locale: 'fr',
        isReady: true,
        isPublished: true,
        newsType: 'live',
        slug: { not: '' },
        title: { not: '' },
      },
    });
  } catch (dbErr: any) {
    console.warn(`[FrOrchestrator V359] DB totalPublished count failed: ${dbErr.message}`);
  }

  return {
    isRunning,
    isPaused,
    cycleCount,
    lastCycleTime: lastCycleTime ? new Date(lastCycleTime).toISOString() : null,
    idleMinutes: idleMs ? Math.round(idleMs / 60000) : null,
    isStale: idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS,
    lastError,
    totalPublished: dbTotalPublished,
    totalProcessed,
    totalFetched,
    totalErrors,
    config: {
      newsCycleIntervalMs: NEWS_CYCLE_INTERVAL_MS,
      frDailyIntervalMs: FR_PIPELINE_CONFIG.FR_DAILY_INTERVAL_MS,
      frWeeklyIntervalMs: FR_PIPELINE_CONFIG.FR_WEEKLY_INTERVAL_MS,
      frMonthlyIntervalMs: FR_PIPELINE_CONFIG.FR_MONTHLY_INTERVAL_MS,
      frTechnicalIntervalMs: FR_PIPELINE_CONFIG.FR_TECHNICAL_INTERVAL_MS,
      frQuarterlyIntervalMs: FR_PIPELINE_CONFIG.FR_QUARTERLY_INTERVAL_MS,
      frReportAssetClasses: FR_PIPELINE_CONFIG.FR_REPORT_ASSET_CLASSES,
      maxArticlesPerCycle: MAX_ARTICLES_PER_CYCLE,
      maxRetryCount: MAX_RETRY_COUNT,
      maxDailyPublished: frLimits.maxDailyFrNews,
      maxHourlyPublished: frLimits.maxHourlyFrNews,
    },
    reports: {
      lastDailyBriefTime: lastDailyBriefTime ? new Date(lastDailyBriefTime).toISOString() : null,
      lastWeeklyAnalysisTime: lastWeeklyAnalysisTime ? new Date(lastWeeklyAnalysisTime).toISOString() : null,
      lastMonthlyOutlookTime: lastMonthlyOutlookTime ? new Date(lastMonthlyOutlookTime).toISOString() : null,
      lastTechnicalAnalysisTime: lastTechnicalAnalysisTime ? new Date(lastTechnicalAnalysisTime).toISOString() : null,
      lastQuarterlyReviewTime: lastQuarterlyReviewTime ? new Date(lastQuarterlyReviewTime).toISOString() : null,
      nextDailyBriefIn: lastDailyBriefTime > 0 ? Math.max(0, Math.round((FR_PIPELINE_CONFIG.FR_DAILY_INTERVAL_MS - (Date.now() - lastDailyBriefTime)) / 60000)) : null,
      nextWeeklyAnalysisIn: lastWeeklyAnalysisTime > 0 ? Math.max(0, Math.round((FR_PIPELINE_CONFIG.FR_WEEKLY_INTERVAL_MS - (Date.now() - lastWeeklyAnalysisTime)) / 60000)) : null,
      nextMonthlyOutlookIn: lastMonthlyOutlookTime > 0 ? Math.max(0, Math.round((FR_PIPELINE_CONFIG.FR_MONTHLY_INTERVAL_MS - (Date.now() - lastMonthlyOutlookTime)) / 60000)) : null,
      nextTechnicalAnalysisIn: lastTechnicalAnalysisTime > 0 ? Math.max(0, Math.round((FR_PIPELINE_CONFIG.FR_TECHNICAL_INTERVAL_MS - (Date.now() - lastTechnicalAnalysisTime)) / 60000)) : null,
      nextQuarterlyReviewIn: lastQuarterlyReviewTime > 0 ? Math.max(0, Math.round((FR_PIPELINE_CONFIG.FR_QUARTERLY_INTERVAL_MS - (Date.now() - lastQuarterlyReviewTime)) / 60000)) : null,
    },
  };
}

// ensureFrRunning — appelé par des déclencheurs externes (vérifications de santé, cron, etc.)
export function ensureFrRunning(): { wasRunning: boolean; wasStale: boolean; restarted: boolean } {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const wasStale = idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS;
  const wasRunning = isRunning;

  if (!isRunning || wasStale) {
    if (wasStale) {
      console.warn(`[FrOrchestrator] ensureFrRunning: OBSOLÈTE (inactif ${Math.round((idleMs || 0) / 60000)} min) — redémarrage forcé`);
      stopFrOrchestrator();
    } else {
      console.log(`[FrOrchestrator] ensureFrRunning: PAS en cours d'exécution — démarrage`);
    }
    startFrOrchestrator();
    return { wasRunning, wasStale, restarted: true };
  }

  return { wasRunning: true, wasStale: false, restarted: false };
}
