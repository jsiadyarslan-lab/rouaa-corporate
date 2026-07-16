// ═══════════════════════════════════════════════════════════════
// Turkish Pipeline Orchestrator V1
// ─────────────────────────────────────────────────────────────
// Continuous-loop orchestrator for the Turkish news pipeline.
// Modeled after the English orchestrator (en-orchestrator.ts) but
// runs independently with its own schedule and state.
//
// CYCLE: fetch Turkish RSS → process (tr-processor → imager → publisher)
// REPORTS: daily brief every 24h, weekly analysis every 168h
//
// CRITICAL DESIGN:
// - Crash-resilient: auto-restarts on any error
// - Watchdog: auto-restarts if no cycle in 5 minutes (V318: was 20 min)
// - Full-pipeline: each article goes through all stages in one pass
// - Independent: does NOT affect the Arabic or English pipelines
// ═══════════════════════════════════════════════════════════════

import { db, pingDB, recoverConnection, startDBKeepalive } from '@/lib/db';
import { TR_PIPELINE_CONFIG, getTrPipelineLimits } from './tr-pipeline-config';
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
let cycleTimer: ReturnType<typeof setTimeout> | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;

// V56: Smart Watchdog — track consecutive empty cycles
let consecutiveEmptyCycles = 0;
const MAX_EMPTY_CYCLES_BEFORE_RESET = 10;

// V120: Track strong reset count for archive detection
let strongResetCount = 0;
const MAX_STRONG_RESETS_BEFORE_ARCHIVE = 3;

// Report scheduling
let lastDailyBriefTime = 0;
let lastWeeklyAnalysisTime = 0;
let lastMonthlyOutlookTime = 0;
let lastTechnicalAnalysisTime = 0;
let lastQuarterlyReviewTime = 0;

// ── Turkish RSS Fetcher ──

interface TrFetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;
  errors: number;
  duration: number;
}

async function fetchTurkishRSSFeeds(): Promise<TrFetchResult> {
  const startTime = Date.now();
  const result: TrFetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[TrOrchestrator] Türk RSS akışları alınıyor...');

    const feeds = TR_PIPELINE_CONFIG.RSS_FEEDS_TR;
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
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[TrOrchestrator] RSS akışı ${feed.source} ${response.status} döndürdü`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSXML(xml, feed.category, feed.source);
        allItems.push(...items);
      } catch (err: any) {
        console.warn(`[TrOrchestrator] ${feed.source} akışı alınamadı: ${err.message}`);
        result.errors++;
      }
    }

    if (allItems.length === 0) {
      result.duration = Date.now() - startTime;
      return result;
    }

    // Turkish financial keyword filter
    // Broad filter to catch legitimate financial/economic articles in Turkish
    const FINANCIAL_KEYWORDS = [
      // General finance (Turkish)
      /\bhisse/i, /\bborsa/i, /\bpiyasa/i, /\btrading/i, /\binvest/i, /\byatırım/i,
      /\bekonom/i, /\bfinans/i, /\bbanka/i, /\bfaiz/i, /\btahvil/i, /\bgetiri/i,
      /\bkür/i, /\benflasyon/i, /\bmb\b/i, /\bfed\b/i, /\bmerkez\s*bankas/i,
      // Assets
      /\bcrypto\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\bpetrol/i, /\baltın/i, /\balt[iı]n/i,
      /\bdolar/i, /\beuro/i, /\bdöviz/i, /\bforex\b/i, /\bresesyon/i, /\bkâr/i, /\bkar\b/i, /\bzarar/i,
      /\bciro/i, /\bsonuç/i, /\bbirleşme/i, /\bdevralma/i, /\bedinim/i,
      /\betf\b/i, /\bwall street\b/i, /\bnasdaq\b/i, /\bs&p\b/i, /\bbist\b/i, /\bnikkei\b/i, /\bdax\b/i, /\bftse\b/i,
      // Commerce & politics
      /\bgümrük/i, /\bticaret/i, /\bithalat/i, /\bihracat/i,
      /\bipotek/i, /\bkredi/i, /\bborç/i, /\baçık/i, /\baç[iı]k/i,
      /\bmali/i, /\bparas/i, /\bemtia/i, /\bfiyat/i,
      // Corporate
      /\bceo\b/i, /\bcfo\b/i, /\byönetici/i, /\bşirket/i, /\bkurumsal/i,
      /\bgirişim/i, /\bdeğerleme/i, /\bsermaye/i, /\bventure/i,
      /\biflas/i, /\bişten\s*çıkarma/i, /\bişsizlik/i, /\bistihdam/i,
      /\btedarik/i, /\bsanayi/i, /\büretim/i, /\btüketim/i,
      /\bperakende/i, /\bsatış/i, /\bbeklenti/i, /\btahmin/i, /\böngör/i,
      /\bhissedar/i, /\btemettü/i, /\bgeri\s*alım/i, /\banlaşma/i, /\bsözleşme/i,
      /\bsektör/i, /\bkonut/i, /\bgayrimenkul/i,
      /\bgaz\b/i, /\benerji/i, /\bteknoloj/i, /\btech\b/i,
      /\botomotiv/i, /\bhavayolu/i, /\bilaç/i, /\bsigorta/i,
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
          where: { url: item.url, locale: 'tr' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        const trCategory = TR_PIPELINE_CONFIG.CATEGORY_MAP_TR[item.category] || 'Ekonomi';
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Simple Turkish sentiment analysis
        const positiveWords = ['yükseliş', 'artış', 'kazanç', 'toparlanma', 'uyarıcı', 'sıçrama', 'rekor', 'aşma', 'büyüme', 'kâr', 'iyileşme', 'ilerleme', 'çıkış', 'pozitif', 'güçlenme', 'gerileme', 'canlanma'];
        const negativeWords = ['düşüş', 'çöküş', 'gerileme', 'azalma', 'çökme', 'crash', 'zarar', 'dip', 'eksik', 'kesinti', 'resesyon', 'batma', 'kötüleşme', 'negatif', 'kayıp', 'bunalım', 'kriz'];
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
              category: trCategory,
              categoryId: item.category,
              sentiment,
              sentimentScore,
              impactLevel: 'medium',
              impactScore: 30,
              originalLanguage: 'tr',
              newsType: 'live',
              affectedAssets: '[]',
              isPublished: false,
              isReady: false,
              processingStage: 'fetched',
              retryCount: 0,
              slug: slug || `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              locale: 'tr',
            },
          });

          result.fetched++;
        } catch (createErr: any) {
          // V256: P2002 on slug+locale — yeni slug ile tekrar dene (rastgele sonek)
          if (createErr.code === 'P2002') {
            try {
              const retrySlug = generateSlug(item.title); // Yeni rastgele sonek
              await db.newsItem.create({
                data: {
                  title: item.title,
                  summary: item.summary,
                  content: contentFromSummary,
                  source: item.source,
                  sourceName: item.source,
                  url: item.url,
                  category: trCategory,
                  categoryId: item.category,
                  sentiment,
                  sentimentScore,
                  impactLevel: 'medium',
                  impactScore: 30,
                  originalLanguage: 'tr',
                  newsType: 'live',
                  affectedAssets: '[]',
                  isPublished: false,
                  isReady: false,
                  processingStage: 'fetched',
                  retryCount: 0,
                  slug: retrySlug,
                  locale: 'tr',
                },
              });
              result.fetched++;
            } catch (retryErr: any) {
              // Second P2002 = gerçek kopya
              result.duplicates++;
            }
          } else {
            throw createErr; // Dış catch'e yeniden fırlat
          }
        }
      } catch (err: any) {
        // P2002 olmayan hata — kaydedip devam et
        result.errors++;
        console.error(`[TrOrchestrator] Kayıt hatası "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    if (result.fetched > 0) {
      console.log(`[TrOrchestrator] ${result.fetched} yeni alındı, ${result.duplicates} kopya, ${result.filtered} filtrelenmiş, ${result.errors} hata ${result.duration}ms'de`);
    }
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[TrOrchestrator] Akış alımı sırasında ölümcül hata:', err.message);
    return result;
  }
}

// ── Turkish Pipeline Processing ──

interface TrProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

async function processTurkishArticles(maxArticles: number = MAX_ARTICLES_PER_CYCLE): Promise<TrProcessResult> {
  const startTime = Date.now();
  const result: TrProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'tr',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped', 'imaged'] },
        retryCount: { lt: MAX_RETRY_COUNT },
        title: { not: '' },
      },
      orderBy: [
        { processingStage: 'desc' },  // Gelişmiş aşamaları önce işle (yayıma en yakın olanlar)
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
      result.details.push('İşlenecek makale yok');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[TrOrchestrator] ${unprocessedArticles.length} Türk makalesi işlenecek`);

    // TR yayın limitleri kontrol ediliyor — V314: DB'den dinamik
    const trLimits = await getTrPipelineLimits();
    const maxDaily = trLimits.maxDailyTrNews;
    const maxHourly = trLimits.maxHourlyTrNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' — quota should ONLY count live news articles,
    // NOT reports/analyses. Without this, reports were counted against the daily
    // limit, causing the pipeline to stop publishing news prematurely.
    const trPublishedFilter = {
      locale: 'tr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    // V317: Kota sayımı için fetchedAt yerine publishedAt kullan
    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...trPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...trPublishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Kota doldu — saatlik: ${publishedThisHour}/${maxHourly}, günlük: ${publishedToday}/${maxDaily}`);
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
        const quotaExceeded = await liveQuotaReCheck('tr', todayStart, hourStart, maxDaily, maxHourly, publishCount);
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
          console.log(`[TrOrchestrator V373] Reset skipped article ${article.id} → fetched for reprocessing`);
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
              console.warn(`[TrOrchestrator V415] Publisher rejected imaged article ${article.id}, trying Canvas fallback...`);
              try {
                const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
                const articleFull = await db.newsItem.findUnique({
                  where: { id: article.id },
                  select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true, title: true, content: true, aiAnalysis: true, fetchedAt: true },
                });
                const canvasBuffer = await generateArticleImage({
                  title: articleFull?.title || article.title || 'Finans Haberleri',
                  category: articleFull?.categoryId || articleFull?.category || 'economy',
                  locale: 'tr',
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
                    recordPublish('tr');
                  } catch { /* non-critical */ }
                  publishSuccess = true;
                }
              } catch (canvasErr: any) {
                console.error(`[TrOrchestrator V415] Canvas fallback failed for imaged article ${article.id}: ${canvasErr.message}`);
              }
            }
          } catch (pubErr: any) {
            console.error(`[TrOrchestrator V415] Publisher error for imaged article ${article.id}: ${pubErr.message}`);
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

        // Step 0: Load full article content from source URL
        if (article.processingStage === 'fetched') {
          try {
            await runContentLoaderStep(article.id, 'tr');
          } catch (clErr: any) {
            console.warn(`[TrOrchestrator] Content loader error for ${article.id}: ${clErr.message}`);
          }
        }

        // ── Aşama 1: tr-processor çalıştır (AI analizi + içerik zenginleştirme) ──
        let processorSuccess = false;
        try {
          const { processArticleTr } = await import('@/lib/pipeline/agents/tr-processor');
          const trResult = await processArticleTr(article.id);
          if (trResult.success) {
            processorSuccess = true;
            recordAISuccess('tr');
          } else {
            // Bir kez tekrar dene
            const retryResult = await processArticleTr(article.id);
            if (retryResult.success) {
              processorSuccess = true;
              recordAISuccess('tr');
            } else {
              recordAIFailure('tr');
            }
          }
        } catch (procErr: any) {
          recordAIFailure('tr');
          console.error(`[TrOrchestrator] ${article.id} için tr-processor hatası: ${procErr.message}`);
        }

        // ── Aşama 2: Imager çalıştır ──
        let imageSuccess = false;
        try {
          const { imageArticle } = await import('@/lib/pipeline/agents/imager');
          const imageResult = await imageArticle(article.id);
          if (imageResult.success) {
            imageSuccess = true;
          }
        } catch (imgErr: any) {
          console.error(`[TrOrchestrator] ${article.id} için imager hatası: ${imgErr.message}`);
        }

        // ── Aşama 3: Yayıncı çalıştır ──
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
            // Canvas görsel geri dönüşüm + doğrudan yayım
            try {
              const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
              const articleFull = await db.newsItem.findUnique({
                where: { id: article.id },
                select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
              });

              const canvasBuffer = await generateArticleImage({
                title: updatedArticle?.title || article.title || 'Finans Haberleri',
                category: articleFull?.categoryId || articleFull?.category || 'economy',
                locale: 'tr',
                newsType: articleFull?.newsType || undefined,
                sentiment: articleFull?.sentiment || undefined,
                source: articleFull?.sourceName || articleFull?.source || undefined,
              });

              if (canvasBuffer && canvasBuffer.length > 500) {
                const { uploadImageToR2 } = await import('@/lib/image-storage');
                const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
                const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                const storedValue = r2Result.success ? r2Result.url : null;

                // V413: Use MIN_TR_CONTENT_LENGTH instead of hardcoded 200
                const hasContent = (updatedArticle?.content && updatedArticle.content.length >= TR_PIPELINE_CONFIG.MIN_TR_CONTENT_LENGTH);
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
                  // Düşürülmüş mod — missing content and/or AI analysis
                  // FIX: If REQUIRE_AI_ANALYSIS is true and aiAnalysis is missing,
                  // do NOT publish. Keep isReady: false so next cron cycle picks it up.
                  if (TR_PIPELINE_CONFIG.REQUIRE_AI_ANALYSIS && !hasAnalysis) {
                    // Save the generated image but do NOT publish — article stays in pipeline
                    const { generateSlug } = await import('@/lib/slug');
                    const slug = updatedArticle?.title ? generateSlug(updatedArticle.title) : article.id;
                    await db.newsItem.update({
                      where: { id: article.id },
                      data: {
                        generatedImage: storedValue,
                        imageUrl: storedValue.startsWith('http') ? storedValue : `/api/article-image/${article.id}`,
                        isReady: false,
                        isPublished: false,
                        processingStage: 'content_loaded',
                        slug: slug || article.id,
                      },
                    });
                    console.warn(`[TrOrchestrator] Canvas fallback for ${article.id}: image saved but NOT published — aiAnalysis missing (REQUIRE_AI_ANALYSIS=true). Will retry next cycle.`);
                  } else {
                    // V359: Check quota BEFORE direct publish (bypasses publisher agent)
                    let quotaAllowed = true;
                    try {
                      const { canPublish } = await import('./publish-quota');
                      const quotaCheck = await canPublish('tr');
                      if (!quotaCheck.allowed) {
                        quotaAllowed = false;
                        console.warn(`[TrOrchestrator V359] Canvas fallback BLOCKED by quota: ${quotaCheck.reason}`);
                      }
                    } catch { /* açık-bırak */ }

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
                        recordPublish('tr');
                      } catch { /* kritik değil */ }
                      publishSuccess = true;
                      publishCount++;
                      result.published++;
                    }
                  }
                }
              }
            } catch (canvasErr: any) {
              console.error(`[TrOrchestrator] ${article.id} için Canvas geri dönüşümü başarısız: ${canvasErr.message}`);
            }
          }
        } catch (pubErr: any) {
          console.error(`[TrOrchestrator] ${article.id} için yayıncı hatası: ${pubErr.message}`);
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
        console.error(`[TrOrchestrator] ${article.id} makalesi işlenirken hata: ${err.message}`);
        try {
          const { recordError } = await import('@/lib/pipeline/queue/job-manager');
          await recordError(article.id, `TR işlem hattı hatası: ${err.message}`);
        } catch { /* kritik değil */ }
      }
    }

    result.details.push(`İşlenen: ${result.processed}, Yayınlanan: ${result.published}, Başarısız: ${result.failed}, Atlanan: ${result.skipped}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Ölümcül hata: ${err.message}`);
    console.error(`[TrOrchestrator] İşleme sırasında ölümcül hata: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Eksik makaleleri yeniden işle ──

async function reprocessTurkishArticles(maxArticles: number = 3): Promise<TrProcessResult> {
  const startTime = Date.now();
  const result: TrProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const candidateArticles = await db.newsItem.findMany({
      where: {
        locale: 'tr',
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
      result.details.push('Eksik makale yok');
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
            const { processArticleTr } = await import('@/lib/pipeline/agents/tr-processor');
            await processArticleTr(article.id);
          } catch { /* kritik değil */ }
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
              // Canvas geri dönüşümü
              try {
                const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
                const articleData = await db.newsItem.findUnique({
                  where: { id: article.id },
                  select: { title: true, category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
                });
                const canvasBuffer = await generateArticleImage({
                  title: articleData?.title || article.title || 'Finans Haberleri',
                  category: articleData?.categoryId || articleData?.category || 'economy',
                  locale: 'tr',
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
              } catch { /* kritik değil */ }
            }
          } catch { /* kritik değil */ }
        }

        // imageUrl güncelle
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

// ── Rapor oluşturma ──

async function generateReportsIfNeeded(): Promise<void> {
  const now = Date.now();

  // V400: Only update timer on SUCCESS — prevents 24h dead zone when generation fails
  // 24 saatte bir günlük özet
  if (now - lastDailyBriefTime >= TR_PIPELINE_CONFIG.TR_DAILY_INTERVAL_MS) {
    try {
      console.log('[TrOrchestrator] Türk günlük özeti oluşturuluyor...');
      const { generateDailyBriefTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      const report = await generateDailyBriefTr('daily');
      if (report) {
        console.log(`[TrOrchestrator] Günlük özet oluşturuldu: "${report.title}" (${report.confidenceScore}%)`);
        lastDailyBriefTime = now;
      } else {
        console.log('[TrOrchestrator V400] Günlük özet null döndü — zamanlayıcı güncellenmedi');
      }
    } catch (err: any) {
      console.warn(`[TrOrchestrator] Günlük özet oluşturma başarısız: ${err.message}`);
    }
  }

  // Tüm aktif varlık sınıfları için 7 günde bir haftalık analizler
  if (now - lastWeeklyAnalysisTime >= TR_PIPELINE_CONFIG.TR_WEEKLY_INTERVAL_MS) {
    try {
      console.log('[TrOrchestrator] Türk haftalık analizleri oluşturuluyor...');
      const { generateWeeklyAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      const assetClasses = TR_PIPELINE_CONFIG.TR_REPORT_ASSET_CLASSES;
      let generated = 0;
      for (const ac of assetClasses) {
        try {
          const analysis = await generateWeeklyAnalysisTr(ac as any);
          if (analysis) generated++;
        } catch { /* başarısız varlık sınıflarını yoksay */ }
      }
      if (generated > 0) {
        console.log(`[TrOrchestrator] ${assetClasses.length} varlık sınıfından ${generated} haftalık analiz oluşturuldu`);
        lastWeeklyAnalysisTime = now;
      }
    } catch (err: any) {
      console.warn(`[TrOrchestrator] Haftalık analiz oluşturma başarısız: ${err.message}`);
    }
  }

  // 30 günde bir aylık bakış
  if (now - lastMonthlyOutlookTime >= TR_PIPELINE_CONFIG.TR_MONTHLY_INTERVAL_MS) {
    try {
      console.log('[TrOrchestrator] Türk aylık bakışı oluşturuluyor...');
      const { generateMonthlyOutlookTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      const report = await generateMonthlyOutlookTr();
      if (report) {
        console.log(`[TrOrchestrator] Aylık bakış oluşturuldu: "${report.title}" (${report.confidenceScore}%)`);
        lastMonthlyOutlookTime = now;
      }
    } catch (err: any) {
      console.warn(`[TrOrchestrator] Aylık bakış oluşturma başarısız: ${err.message}`);
    }
  }

  // 8 saatte bir teknik analiz
  if (now - lastTechnicalAnalysisTime >= TR_PIPELINE_CONFIG.TR_TECHNICAL_INTERVAL_MS) {
    try {
      console.log('[TrOrchestrator] Türk teknik analizi oluşturuluyor...');
      const { generateTechnicalAnalysisTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      const analysis = await generateTechnicalAnalysisTr();
      if (analysis) {
        console.log(`[TrOrchestrator] Teknik analiz oluşturuldu: "${analysis.title}" (${analysis.confidenceScore}%)`);
        lastTechnicalAnalysisTime = now;
      }
    } catch (err: any) {
      console.warn(`[TrOrchestrator] Teknik analiz oluşturma başarısız: ${err.message}`);
    }
  }

  // 90 günde bir üç aylık değerlendirme
  if (now - lastQuarterlyReviewTime >= TR_PIPELINE_CONFIG.TR_QUARTERLY_INTERVAL_MS) {
    try {
      console.log('[TrOrchestrator] Türk üç aylık değerlendirmesi oluşturuluyor...');
      const { generateDailyBriefTr } = await import('@/lib/pipeline/agents/tr-report-generator');
      const report = await generateDailyBriefTr('quarterly');
      if (report) {
        console.log(`[TrOrchestrator] Üç aylık değerlendirme oluşturuldu: "${report.title}" (${report.confidenceScore}%)`);
        lastQuarterlyReviewTime = now;
      }
    } catch (err: any) {
      console.warn(`[TrOrchestrator] Üç aylık değerlendirme oluşturma başarısız: ${err.message}`);
    }
  }

  // V413: Auto-infographic generation DISABLED — manual only via /api/infographics/generate-tr
}

// ── Maintenance ──

async function runHousekeeping(): Promise<void> {
  try {
    // V356: isReady=true ama isPublished=false olanları limit kontrolüyle düzelt
    const trHkLimits = await getTrPipelineLimits();
    const trHkNow = new Date();
    const trHkHourStart = new Date(trHkNow);
    trHkHourStart.setUTCMinutes(0, 0, 0);
    const trHkTodayStart = getTodayStart(TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' to match quota filter
    const trHkVisFilter = {
      locale: 'tr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [trHkPubToday, trHkPubThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...trHkVisFilter, publishedAt: { gte: trHkTodayStart } } }),
      db.newsItem.count({ where: { ...trHkVisFilter, publishedAt: { gte: trHkHourStart } } }),
    ]);

    const trHkRemainingHourly = trHkLimits.maxHourlyTrNews > 0
      ? Math.max(0, trHkLimits.maxHourlyTrNews - trHkPubThisHour) : 999;
    const trHkRemainingDaily = trHkLimits.maxDailyTrNews > 0
      ? Math.max(0, trHkLimits.maxDailyTrNews - trHkPubToday) : 999;
    const trHkMaxFix = Math.min(trHkRemainingHourly, trHkRemainingDaily);

    if (trHkMaxFix > 0) {
      // V1044: Only publish articles with complete analysis + image (golden rule)
      const articlesToTrFix = await db.newsItem.findMany({
        where: {
          isReady: true,
          isPublished: false,
          locale: 'tr',
          aiAnalysis: { contains: 'fullContent' },
          generatedImage: { not: '' },
        },
        select: { id: true, fetchedAt: true },
        take: trHkMaxFix,
      });
      if (articlesToTrFix.length > 0) {
        // Fix publishedAt = fetchedAt for each article individually
        for (const fixArticle of articlesToTrFix) {
          await db.newsItem.update({
            where: { id: fixArticle.id },
            data: { isPublished: true, publishedAt: fixArticle.fetchedAt || new Date() },
          });
        }
        // V359: Record publishes in quota manager's in-process tracking
        try {
          const { recordPublish } = await import('./publish-quota');
          for (let i = 0; i < articlesToTrFix.length; i++) {
            recordPublish('tr');
          }
        } catch { /* kritik değil */ }
        console.log(`[TrOrchestrator V356] ${articlesToTrFix.length} TR makale düzeltildi (kota: saatlik=${trHkPubThisHour}/${trHkLimits.maxHourlyTrNews}, günlük=${trHkPubToday}/${trHkLimits.maxDailyTrNews})`);
      }
    } else {
      console.log(`[TrOrchestrator V356] Kota doldu — düzeltme atlandı. Saatlik: ${trHkPubThisHour}/${trHkLimits.maxHourlyTrNews}, Günlük: ${trHkPubToday}/${trHkLimits.maxDailyTrNews}`);
    }
  } catch (err: any) {
    console.warn(`[TrOrchestrator] Bakım başarısız: ${err.message}`);
  }

  try {
    // Kilitlenen TR makalelerini sıfırla
    const stuckArticles = await db.newsItem.findMany({
      where: {
        locale: 'tr',
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
      console.log(`[TrOrchestrator] ${stuckArticles.length} kilitlenen TR makalesi sıfırlandı`);
    }
  } catch (err: any) {
    console.warn(`[TrOrchestrator] Kilitlenen makaleleri sıfırlama başarısız: ${err.message}`);
  }

  // Mark-ready with 30% quota cap (matching Arabic pipeline)
  try {
    const markReadyLimits = await getTrPipelineLimits();
    const markResult = await markReadyWithQuotaCap('tr', markReadyLimits.maxDailyTrNews, markReadyLimits.maxHourlyTrNews, TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');
    if (markResult.markedCount > 0 || markResult.fixedPublishedCount > 0) {
      console.log(`[TrOrchestrator] Mark-ready: ${markResult.markedCount} marked, ${markResult.fixedPublishedCount} fixed`);
    }
  } catch (markErr: any) {
    console.warn(`[TrOrchestrator] Mark-ready error: ${markErr.message}`);
  }

  // Strong reset for stuck articles (with V120 archive logic)
  try {
    strongResetCount++;

    // V120: After MAX_STRONG_RESETS_BEFORE_ARCHIVE consecutive strong resets,
    // archive (delete) permanently stuck articles with high retry counts and errors.
    if (strongResetCount >= MAX_STRONG_RESETS_BEFORE_ARCHIVE) {
      const stuckToArchive = await db.newsItem.findMany({
        where: {
          locale: 'tr',
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
          where: { id: { in: stuckToArchive.map(a => a.id) } },
        });
        console.warn(`[TrOrchestrator V120] ARCHIVED ${archived.count} permanently stuck articles after ${strongResetCount} strong resets. Errors: ${stuckToArchive.slice(0, 3).map(a => a.lastError?.substring(0, 60)).join(' | ')}`);
      }

      strongResetCount = 0;
    }

    await strongReset('tr', MAX_RETRY_COUNT);
  } catch (resetErr: any) {
    console.warn(`[TrOrchestrator] Strong reset error: ${resetErr.message}`);
  }

  try {
    // V372: Reset skipped articles back to fetched instead of deleting them
    // Previously, articles >12h in 'fetched' stage were DELETED — this caused massive data loss
    // Now we reset them for reprocessing instead
    const ageCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const resetOld = await db.newsItem.updateMany({
      where: {
        locale: 'tr',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'skipped', 'imaged'] },
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
      console.log(`[TrOrchestrator V372] Reset ${resetOld.count} eski TR makalesi (>12s) silme yerine yeniden işleme`);
    }

    // Purge only truly stuck articles (>24h, already retried many times)
    const veryOldCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const purged = await db.newsItem.deleteMany({
      where: {
        locale: 'tr',
        isReady: false,
        isPublished: false,
        processingStage: 'fetched',
        fetchedAt: { lt: veryOldCutoff },
        retryCount: { gte: MAX_RETRY_COUNT },
      },
    });
    if (purged.count > 0) {
      console.log(`[TrOrchestrator V372] ${purged.count} kilitlenmiş TR makalesi temizlendi (>24s, maks deneme)`);
    }
  } catch (err: any) {
    console.warn(`[TrOrchestrator] Süresi dolmuş makaleleri temizleme başarısız: ${err.message}`);
  }
}

// ── Ana döngü ──

async function runCycle(): Promise<void> {
  if (!isRunning) return;
  if (isPaused) {
    scheduleNextCycle();
    return;
  }

  cycleCount++;
  const cycleStart = Date.now();

  // ── V322→V323: Döngü öncesi DB sağlık kontrolü ile geliştirilmiş kurtarma ──
  // Herhangi bir şey yapmadan önce veritabanının erişilebilir olduğunu kontrol et.
  // Değilse, kurtarma dene (3 denemeye kadar) ve hepsi başarısız olursa bu döngüyü atla.
  let dbOk = await pingDB();
  if (!dbOk) {
    console.warn(`[TrOrchestrator V323] DB erişilemez — kurtarma denemesi...`);
    for (let recoveryAttempt = 1; recoveryAttempt <= 3; recoveryAttempt++) {
      const recovered = await recoverConnection();
      if (recovered) {
        dbOk = await pingDB();
        if (dbOk) {
          console.log(`[TrOrchestrator V323] ✓ DB ${recoveryAttempt}. denemede kurtarıldı — döngü #${cycleCount} devam ediyor`);
          break;
        }
      }
      // Sonraki kurtarma denemesinden önce bekle
      console.warn(`[TrOrchestrator V323] Kurtarma denemesi ${recoveryAttempt}/3 başarısız — ${recoveryAttempt * 5}s bekleniyor...`);
      await new Promise(r => setTimeout(r, recoveryAttempt * 5000));
    }
    if (!dbOk) {
      console.error(`[TrOrchestrator V323] ✗ 3 DB kurtarma denemesi de başarısız — döngü #${cycleCount} atlandı`);
      lastError = 'Veritabanı bağlantısı başarısız — 3 kurtarma denemesi sonuçsuz';
      totalErrors++;
      scheduleNextCycle();
      return;
    }
  }

  console.log(`[TrOrchestrator] Döngü #${cycleCount} yürütülüyor...`);

  try {
    // V359: Early quota check — skip processing if limits reached.
    try {
      const { canPublish } = await import('./publish-quota');
      const quotaCheck = await canPublish('tr');
      if (!quotaCheck.allowed) {
        // Still fetch to keep queue fresh, but skip processing
        const fetchResult = await fetchTurkishRSSFeeds();
        totalFetched += fetchResult.fetched;
        console.log(`[TrOrchestrator V359] Kota doldu — işleme atlandı. Alınan: ${fetchResult.fetched}. ${quotaCheck.reason}`);
        lastCycleTime = Date.now();
        scheduleNextCycle();
        return;
      }
    } catch (quotaErr: any) {
      console.warn(`[TrOrchestrator V359] Kota doğrulama başarısız: ${quotaErr.message}`);
    }

    // ── Aşama 1: Yeni Türk makalelerini al ──
    const fetchResult = await fetchTurkishRSSFeeds();
    totalFetched += fetchResult.fetched;

    // V121: CASCADE FAILURE — log warning but CONTINUE processing.
    // If multiple AI providers are rate-limited, it's still better to process SOME
    // articles with available providers than to process ZERO articles.
    if (isCascadeFailure()) {
      console.warn(`[TrOrchestrator V121] AI provider CASCADE FAILURE detected — continuing processing with available providers. ` +
        `Multiple providers are rate-limited but pipeline will NOT stop.`);
    }

    // ── Aşama 2: Alınan makaleleri tam işlem hattında işle ──
    const processResult = await processTurkishArticles(MAX_ARTICLES_PER_CYCLE);

    // ── Aşama 3: Yayınlanan eksik makaleleri yeniden işle ──
    let reprocessResult: TrProcessResult | null = null;
    if (cycleCount % 3 === 0) { // Her 3 döngüde bir (~45 dk)
      reprocessResult = await reprocessTurkishArticles(3);
    }

    totalProcessed += processResult.processed;
    totalPublished += processResult.published;
    totalErrors += processResult.failed;
    lastError = null;

    // V56: Smart Watchdog — track consecutive empty cycles
    const publishedThisCycle = processResult.published;
    const processedThisCycle = processResult.processed;
    if (publishedThisCycle === 0 && processedThisCycle > 0) {
      consecutiveEmptyCycles++;
      if (consecutiveEmptyCycles >= MAX_EMPTY_CYCLES_BEFORE_RESET) {
        console.warn(`[TrOrchestrator V56] Smart Watchdog: ${consecutiveEmptyCycles} consecutive empty cycles! Triggering strong reset...`);
        await strongReset('tr', MAX_RETRY_COUNT);
        consecutiveEmptyCycles = 0;
      }
    } else if (publishedThisCycle > 0) {
      consecutiveEmptyCycles = 0;
    }

    // ── Aşama 4: Gerekirse raporları oluştur ──
    await generateReportsIfNeeded();

    // ── Aşama 5: Bakım (V373: 10 yerine her 3 döngüde bir — atılan durumdan daha hızlı kurtarma) ──
    if (cycleCount % 3 === 0) {
      await runHousekeeping();
    }

    // V125→V244: Reset terminal-stage articles (rejected + skipped) back to 'fetched'.
    // 'skipped' articles were previously lost forever — they had valid content from
    // the source but AI refused to process them. Now they get re-processed.
    // 'rejected' articles are reset for the same reason.
    // Only for locale 'tr' and articles newer than 24h.
    try {
      const terminalCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const terminalArticles = await db.newsItem.findMany({
        where: {
          locale: 'tr',
          processingStage: { in: ['rejected', 'skipped'] },
          isReady: false,
          isPublished: false,
          fetchedAt: { gte: terminalCutoff },
        },
        select: { id: true },
        take: 100,
      });
      if (terminalArticles.length > 0) {
        const resetTerminal = await db.newsItem.updateMany({
          where: { id: { in: terminalArticles.map(a => a.id) } },
          data: { processingStage: 'fetched', retryCount: 0, lastError: null },
        });
        if (resetTerminal.count > 0) {
          console.log(`[TrOrchestrator V244] Reset ${resetTerminal.count} terminal-stage (rejected/skipped) articles → fetched for reprocessing`);
        }
      }
    } catch (termErr: any) {
      console.warn(`[TrOrchestrator V244] Terminal-stage reset failed: ${termErr.message}`);
    }

    const cycleDuration = Date.now() - cycleStart;
    lastCycleTime = Date.now();

    if (processResult.published > 0 || fetchResult.fetched > 0) {
      console.log(`[TrOrchestrator] Döngü #${cycleCount} tamamlandı: ${fetchResult.fetched} alındı, ${processResult.published} yayınlandı, ${processResult.failed} başarısız${reprocessResult ? `, ${reprocessResult.processed} yeniden işlendi` : ''} ${cycleDuration}ms'de`);
    }
  } catch (err: any) {
    lastError = err.message;
    totalErrors++;
    console.error(`[TrOrchestrator] ÖLÜMCÜL HATA Döngü #${cycleCount}:`, err.message);
  }

  scheduleNextCycle();
}

// ── Sonraki döngüyü planla ──

function scheduleNextCycle(): void {
  if (!isRunning) return;
  cycleTimer = setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[TrOrchestrator] Döngü başarısız: ${err.message}`);
      scheduleNextCycle(); // Döngüyü her zaman çalışır halde tut
    }
  }, NEWS_CYCLE_INTERVAL_MS);
}

// ── Genel API ──

export function startTrOrchestrator(): void {
  if (isRunning) {
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[TrOrchestrator] ÇALIŞIYOR ama ESKİ — son döngü ${Math.round(idleMs / 60000)} dk önce. Zorunlu yeniden başlatma!`);
      stopTrOrchestrator();
    } else {
      console.log('[TrOrchestrator] Zaten çalışıyor');
      return;
    }
  }

  isRunning = true;
  isPaused = false;

  // V4: Supabase'in boşta bağlantıları kesmesini önlemek için DB keepalive başlat.
  // Keepalive YALNIZCA ping yapar — pg_terminate_backend ÇAĞIRMAZ (V3'teki yinelenen "DB: Bağlantı Kesildi" sorununun kök nedeniydi).
  try {
    startDBKeepalive();
    console.log('[TrOrchestrator V4] ✓ DB keepalive başlatıldı (2 dk\'da bir ping, pg_terminate_backend yok)');
  } catch {
    console.warn('[TrOrchestrator V4] DB keepalive başlatma başarısız — döngü ile kurtarmaya güvenecek');
  }

  console.log(`[TrOrchestrator] Başlatılıyor — ${NEWS_CYCLE_INTERVAL_MS / 1000}s\'de bir döngü, döngü başına en fazla ${MAX_ARTICLES_PER_CYCLE} makale. Watchdog: ${WATCHDOG_MAX_IDLE_MS / 60000} dk hareketsizlik olursa yeniden başlatır. Raporlar: TR_PIPELINE_CONFIG üzerinden günlük/haftalık/aylık/teknik.`);

  // Rapor zamanlayıcılarını başlat
  if (lastDailyBriefTime === 0) lastDailyBriefTime = Date.now();
  if (lastWeeklyAnalysisTime === 0) lastWeeklyAnalysisTime = Date.now();
  if (lastMonthlyOutlookTime === 0) lastMonthlyOutlookTime = Date.now();
  if (lastTechnicalAnalysisTime === 0) lastTechnicalAnalysisTime = Date.now();
  if (lastQuarterlyReviewTime === 0) lastQuarterlyReviewTime = Date.now();

  // Watchdog başlat
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    if (!isRunning) return;
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[TrOrchestrator Watchdog] ESKİ — son döngü ${Math.round(idleMs / 60000)} dk önce. Zorunlu yeniden başlatma!`);
      stopTrOrchestrator();
      startTrOrchestrator();
    }
  }, WATCHDOG_INTERVAL_MS);

  // Başlangıç gecikmesinden sonra ilk döngüyü başlat
  setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[TrOrchestrator] İlk döngü başarısız: ${err.message}`);
      scheduleNextCycle();
    }
  }, STARTUP_DELAY_MS);
}

export function stopTrOrchestrator(): void {
  isRunning = false;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  console.log('[TrOrchestrator] Durduruldu');
}

export function pauseTrOrchestrator(): void {
  isPaused = true;
  console.log('[TrOrchestrator] Duraklatıldı');
}

export function resumeTrOrchestrator(): void {
  isPaused = false;
  console.log('[TrOrchestrator] Devam ettirildi');
}

export async function getTrOrchestratorStats() {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const trLimits = await getTrPipelineLimits();

  // V359: Query DB for actual total published count instead of in-memory counter.
  // The in-memory counter resets to 0 on server restart, causing impossible stats
  // like totalPublished < todayPublished. The DB count is always accurate.
  // V377: Use visibility filter — only count live news visible on the frontend
  let dbTotalPublished = totalPublished; // fallback to in-memory counter
  try {
    dbTotalPublished = await db.newsItem.count({
      where: {
        locale: 'tr',
        isReady: true,
        isPublished: true,
        newsType: 'live',
        slug: { not: '' },
        title: { not: '' },
      },
    });
  } catch (dbErr: any) {
    console.warn(`[TrOrchestrator V359] DB totalPublished count failed: ${dbErr.message}`);
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
      trDailyIntervalMs: TR_PIPELINE_CONFIG.TR_DAILY_INTERVAL_MS,
      trWeeklyIntervalMs: TR_PIPELINE_CONFIG.TR_WEEKLY_INTERVAL_MS,
      trMonthlyIntervalMs: TR_PIPELINE_CONFIG.TR_MONTHLY_INTERVAL_MS,
      trTechnicalIntervalMs: TR_PIPELINE_CONFIG.TR_TECHNICAL_INTERVAL_MS,
      trQuarterlyIntervalMs: TR_PIPELINE_CONFIG.TR_QUARTERLY_INTERVAL_MS,
      trReportAssetClasses: TR_PIPELINE_CONFIG.TR_REPORT_ASSET_CLASSES,
      maxArticlesPerCycle: MAX_ARTICLES_PER_CYCLE,
      maxRetryCount: MAX_RETRY_COUNT,
      maxDailyPublished: trLimits.maxDailyTrNews,
      maxHourlyPublished: trLimits.maxHourlyTrNews,
    },
    reports: {
      lastDailyBriefTime: lastDailyBriefTime ? new Date(lastDailyBriefTime).toISOString() : null,
      lastWeeklyAnalysisTime: lastWeeklyAnalysisTime ? new Date(lastWeeklyAnalysisTime).toISOString() : null,
      lastMonthlyOutlookTime: lastMonthlyOutlookTime ? new Date(lastMonthlyOutlookTime).toISOString() : null,
      lastTechnicalAnalysisTime: lastTechnicalAnalysisTime ? new Date(lastTechnicalAnalysisTime).toISOString() : null,
      lastQuarterlyReviewTime: lastQuarterlyReviewTime ? new Date(lastQuarterlyReviewTime).toISOString() : null,
      nextDailyBriefIn: lastDailyBriefTime > 0 ? Math.max(0, Math.round((TR_PIPELINE_CONFIG.TR_DAILY_INTERVAL_MS - (Date.now() - lastDailyBriefTime)) / 60000)) : null,
      nextWeeklyAnalysisIn: lastWeeklyAnalysisTime > 0 ? Math.max(0, Math.round((TR_PIPELINE_CONFIG.TR_WEEKLY_INTERVAL_MS - (Date.now() - lastWeeklyAnalysisTime)) / 60000)) : null,
      nextMonthlyOutlookIn: lastMonthlyOutlookTime > 0 ? Math.max(0, Math.round((TR_PIPELINE_CONFIG.TR_MONTHLY_INTERVAL_MS - (Date.now() - lastMonthlyOutlookTime)) / 60000)) : null,
      nextTechnicalAnalysisIn: lastTechnicalAnalysisTime > 0 ? Math.max(0, Math.round((TR_PIPELINE_CONFIG.TR_TECHNICAL_INTERVAL_MS - (Date.now() - lastTechnicalAnalysisTime)) / 60000)) : null,
      nextQuarterlyReviewIn: lastQuarterlyReviewTime > 0 ? Math.max(0, Math.round((TR_PIPELINE_CONFIG.TR_QUARTERLY_INTERVAL_MS - (Date.now() - lastQuarterlyReviewTime)) / 60000)) : null,
    },
  };
}

// ensureTrRunning — dış tetikleyiciler tarafından çağrılır (sağlık kontrolleri, cron vb.)
export function ensureTrRunning(): { wasRunning: boolean; wasStale: boolean; restarted: boolean } {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const wasStale = idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS;
  const wasRunning = isRunning;

  if (!isRunning || wasStale) {
    if (wasStale) {
      console.warn(`[TrOrchestrator] ensureTrRunning: ESKİ (hareketsiz ${Math.round((idleMs || 0) / 60000)} dk) — zorunlu yeniden başlatma`);
      stopTrOrchestrator();
    } else {
      console.log(`[TrOrchestrator] ensureTrRunning: Çalışmıyor — başlatılıyor`);
    }
    startTrOrchestrator();
    return { wasRunning, wasStale, restarted: true };
  }

  return { wasRunning: true, wasStale: false, restarted: false };
}
