// ═══════════════════════════════════════════════════════════════
// Spanish Pipeline Orchestrator V1
// ─────────────────────────────────────────────────────────────
// Continuous-loop orchestrator for the Spanish news pipeline.
// Modeled after the French orchestrator (fr-orchestrator.ts) but
// runs independently with its own schedule and state.
//
// CYCLE: fetch Spanish RSS → process (es-processor → imager → publisher)
//
// CRITICAL DESIGN:
// - Crash-resilient: auto-restarts on any error
// - Watchdog: auto-restarts if no cycle in 5 minutes
// - Full-pipeline: each article goes through all stages in one pass
// - Independent: does NOT affect the French, Arabic, or English pipelines
// ═══════════════════════════════════════════════════════════════

import { db, pingDB, recoverConnection, startDBKeepalive } from '@/lib/db';
import { ES_PIPELINE_CONFIG, getEsPipelineLimits } from './es-pipeline-config';
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
const WATCHDOG_MAX_IDLE_MS = 5 * 60 * 1000;   // Auto-restart if no cycle in 5 minutes

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

// V120: Strong reset archive — track consecutive strong resets
let strongResetCount = 0;
const MAX_STRONG_RESETS_BEFORE_ARCHIVE = 3;

// ── Spanish Financial Keywords ──
const ES_FINANCIAL_KEYWORDS = [
  /\bacciones\b/i, /\bbolsa\b/i, /\bmercado/i, /\binvers/i, /\beconom/i,
  /\bfinanc/i, /\bbanco/i, /\btipo de interés/i, /\bbono/i, /\brenta/i,
  /\bPIB\b/i, /\binflac/i, /\bfed\b/i, /\breserva federal/i, /\bBCE\b/i,
  /\bcrypto\b/i, /\bbitcóin\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\bpetróleo\b/i,
  /\boro\b/i, /\bdólar/i, /\bdivisa/i, /\bforex\b/i, /\brecesión\b/i, /\bbeneficio/i,
  /\bingresos/i, /\bcotiz/i, /\bOPEP\b/i, /\bcommodit/i, /\bprecio/i,
  /\bIPC\b/i, /\bempleo/i, /\bparo\b/i, /\bsector/i, /\bindustria/i,
  /\bempresa/i, /\bcorporat/i, /\bstartup/i, /\bcapital/i, /\bdeuda/i,
  /\bfiscal/i, /\bmonetar/i, /\bhipotec/i, /\bcrédito/i, /\bregulac/i,
  /\bganancia/i, /\bcrecimiento/i, /\balza/i, /\bbaja/i, /\bpérdida/i,
];

// ── Spanish Sentiment Words ──
const ES_POSITIVE_WORDS = ['sube', 'crecimiento', 'alza', 'récord', 'beneficio', 'ganancia', 'impulso', 'recuperación', 'mejora'];
const ES_NEGATIVE_WORDS = ['cae', 'baja', 'pérdida', 'crisis', 'recesión', 'desplome', 'hundimiento', 'recorte', 'deterioro'];

// ── Spanish RSS Fetcher ──

interface EsFetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;
  errors: number;
  duration: number;
}

async function fetchSpanishRSSFeeds(): Promise<EsFetchResult> {
  const startTime = Date.now();
  const result: EsFetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[EsOrchestrator] Obteniendo feeds RSS españoles...');

    const feeds = ES_PIPELINE_CONFIG.RSS_FEEDS_ES;
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
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[EsOrchestrator] Feed RSS ${feed.source} devolvió ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSXML(xml, feed.category, feed.source);
        allItems.push(...items);
      } catch (err: any) {
        console.warn(`[EsOrchestrator] Error al obtener ${feed.source}: ${err.message}`);
        result.errors++;
      }
    }

    if (allItems.length === 0) {
      result.duration = Date.now() - startTime;
      return result;
    }

    for (const item of allItems) {
      try {
        if (!item.url || item.url.length < 5) {
          result.errors++;
          continue;
        }

        const textToCheck = `${item.title} ${item.summary}`;
        const isFinancial = ES_FINANCIAL_KEYWORDS.some(pattern => pattern.test(textToCheck));
        if (!isFinancial) {
          result.filtered++;
          continue;
        }

        const existing = await db.newsItem.findFirst({
          where: { url: item.url, locale: 'es' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        const esCategory = ES_PIPELINE_CONFIG.CATEGORY_MAP_ES[item.category] || 'Economía';
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Análisis de sentimiento simple (español)
        const lowerText = textToCheck.toLowerCase();
        let posScore = 0, negScore = 0;
        ES_POSITIVE_WORDS.forEach(w => { if (lowerText.includes(w)) posScore += 10; });
        ES_NEGATIVE_WORDS.forEach(w => { if (lowerText.includes(w)) negScore += 10; });
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
              category: esCategory,
              categoryId: item.category,
              sentiment,
              sentimentScore,
              impactLevel: 'medium',
              impactScore: 30,
              originalLanguage: 'es',
              newsType: 'live',
              affectedAssets: '[]',
              isPublished: false,
              isReady: false,
              processingStage: 'fetched',
              retryCount: 0,
              slug: slug || `es-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              locale: 'es',
            },
          });

          result.fetched++;
        } catch (createErr: any) {
          // P2002 on slug+locale — retry with a new slug (random suffix)
          if (createErr.code === 'P2002') {
            try {
              const retrySlug = generateSlug(item.title);
              await db.newsItem.create({
                data: {
                  title: item.title,
                  summary: item.summary,
                  content: contentFromSummary,
                  source: item.source,
                  sourceName: item.source,
                  url: item.url,
                  category: esCategory,
                  categoryId: item.category,
                  sentiment,
                  sentimentScore,
                  impactLevel: 'medium',
                  impactScore: 30,
                  originalLanguage: 'es',
                  newsType: 'live',
                  affectedAssets: '[]',
                  isPublished: false,
                  isReady: false,
                  processingStage: 'fetched',
                  retryCount: 0,
                  slug: retrySlug,
                  locale: 'es',
                },
              });
              result.fetched++;
            } catch (retryErr: any) {
              // Second P2002 = true duplicate
              result.duplicates++;
            }
          } else {
            throw createErr;
          }
        }
      } catch (err: any) {
        result.errors++;
        console.error(`[EsOrchestrator] Error al guardar "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    if (result.fetched > 0) {
      console.log(`[EsOrchestrator] Obtenido(s) ${result.fetched} nuevo(s), ${result.duplicates} duplicado(s), ${result.filtered} filtrado(s), ${result.errors} error(es) en ${result.duration}ms`);
    }
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[EsOrchestrator] Error fatal al obtener feeds:', err.message);
    return result;
  }
}

// ── Spanish Pipeline Processing ──

interface EsProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

async function processSpanishArticles(maxArticles: number = MAX_ARTICLES_PER_CYCLE): Promise<EsProcessResult> {
  const startTime = Date.now();
  const result: EsProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'es',
        isReady: false,
        isPublished: false,
        processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped', 'imaged'] },
        retryCount: { lt: MAX_RETRY_COUNT },
        title: { not: '' },
      },
      orderBy: [
        { processingStage: 'desc' },  // Process advanced stages first (closest to publishing)
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
      result.details.push('No hay artículos para procesar');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EsOrchestrator] Encontrado(s) ${unprocessedArticles.length} artículo(s) español(es) para procesar`);

    // Check ES publishing limits — dynamic from DB
    const esLimits = await getEsPipelineLimits();
    const maxDaily = esLimits.maxDailyEsNews;
    const maxHourly = esLimits.maxHourlyEsNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(ES_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' — quota should ONLY count live news articles,
    // NOT reports/analyses. Without this, reports were counted against the daily
    // limit, causing the pipeline to stop publishing news prematurely.
    const esPublishedFilter = {
      locale: 'es',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...esPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...esPublishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Cuota alcanzada — hora: ${publishedThisHour}/${maxHourly}, día: ${publishedToday}/${maxDaily}`);
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
        const quotaExceeded = await liveQuotaReCheck('es', todayStart, hourStart, maxDaily, maxHourly, publishCount);
        if (quotaExceeded) {
          result.skipped += unprocessedArticles.length - result.processed;
          break;
        }
      }

      try {
        // Reset skipped articles back to fetched before processing
        if (article.processingStage === 'skipped') {
          await db.newsItem.update({
            where: { id: article.id },
            data: { processingStage: 'fetched', retryCount: 0, lastError: null },
          });
          console.log(`[EsOrchestrator] Artículo omitido ${article.id} reiniciado → fetched para reprocesamiento`);
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
              console.warn(`[EsOrchestrator V415] Publisher rejected imaged article ${article.id}, trying Canvas fallback...`);
              try {
                const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
                const articleFull = await db.newsItem.findUnique({
                  where: { id: article.id },
                  select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true, title: true, content: true, aiAnalysis: true, fetchedAt: true },
                });
                const canvasBuffer = await generateArticleImage({
                  title: articleFull?.title || article.title || 'Noticias financieras',
                  category: articleFull?.categoryId || articleFull?.category || 'economy',
                  locale: 'es',
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
                    recordPublish('es');
                  } catch { /* non-critical */ }
                  publishSuccess = true;
                }
              } catch (canvasErr: any) {
                console.error(`[EsOrchestrator V415] Canvas fallback failed for imaged article ${article.id}: ${canvasErr.message}`);
              }
            }
          } catch (pubErr: any) {
            console.error(`[EsOrchestrator V415] Publisher error for imaged article ${article.id}: ${pubErr.message}`);
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
            await runContentLoaderStep(article.id, 'es');
          } catch (clErr: any) {
            console.warn(`[EsOrchestrator] Content loader error for ${article.id}: ${clErr.message}`);
          }
        }

        // ── Step 1: Run es-processor (AI analysis + content enrichment) ──
        let processorSuccess = false;
        try {
          const { processArticleEs } = await import('@/lib/pipeline/agents/es-processor');
          const esResult = await processArticleEs(article.id);
          if (esResult.success) {
            processorSuccess = true;
            recordAISuccess('es');
          } else {
            // Retry once
            const retryResult = await processArticleEs(article.id);
            if (retryResult.success) {
              processorSuccess = true;
              recordAISuccess('es');
            } else {
              recordAIFailure('es');
            }
          }
        } catch (procErr: any) {
          console.error(`[EsOrchestrator] Error es-processor para ${article.id}: ${procErr.message}`);
          recordAIFailure('es');
        }

        // ── Step 2: Run imager ──
        let imageSuccess = false;
        try {
          const { imageArticle } = await import('@/lib/pipeline/agents/imager');
          const imageResult = await imageArticle(article.id);
          if (imageResult.success) {
            imageSuccess = true;
          }
        } catch (imgErr: any) {
          console.error(`[EsOrchestrator] Error imager para ${article.id}: ${imgErr.message}`);
        }

        // ── Step 3: Run publisher ──
        let publishSuccess = false;
        try {
          const updatedArticle = await db.newsItem.findUnique({
            where: { id: article.id },
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
            // Canvas image fallback + direct publish
            try {
              const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
              const articleFull = await db.newsItem.findUnique({
                where: { id: article.id },
                select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
              });

              const canvasBuffer = await generateArticleImage({
                title: updatedArticle?.title || article.title || 'Noticias Financieras',
                category: articleFull?.categoryId || articleFull?.category || 'economy',
                locale: 'es',
                newsType: articleFull?.newsType || undefined,
                sentiment: articleFull?.sentiment || undefined,
                source: articleFull?.sourceName || articleFull?.source || undefined,
              });

              if (canvasBuffer && canvasBuffer.length > 500) {
                const { uploadImageToR2 } = await import('@/lib/image-storage');
                const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
                const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                const storedValue = r2Result.success ? r2Result.url : null;

                // V413: Use MIN_ES_CONTENT_LENGTH instead of hardcoded 200
                const hasContent = (updatedArticle?.content && updatedArticle.content.length >= ES_PIPELINE_CONFIG.MIN_ES_CONTENT_LENGTH);
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
                  // Degraded mode — check quota BEFORE direct publish
                  let quotaAllowed = true;
                  try {
                    const { canPublish } = await import('./publish-quota');
                    const quotaCheck = await canPublish('es');
                    if (!quotaCheck.allowed) {
                      quotaAllowed = false;
                      console.warn(`[EsOrchestrator] Fallback Canvas BLOQUEADO por cuota: ${quotaCheck.reason}`);
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
                    // Record publish in quota manager
                    try {
                      const { recordPublish } = await import('./publish-quota');
                      recordPublish('es');
                    } catch { /* non-critical */ }
                    publishSuccess = true;
                    publishCount++;
                    result.published++;
                  }
                }
              }
            } catch (canvasErr: any) {
              console.error(`[EsOrchestrator] Fallback Canvas fallido para ${article.id}: ${canvasErr.message}`);
            }
          }
        } catch (pubErr: any) {
          console.error(`[EsOrchestrator] Error publisher para ${article.id}: ${pubErr.message}`);
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
        console.error(`[EsOrchestrator] Error procesando artículo ${article.id}: ${err.message}`);
        try {
          const { recordError } = await import('@/lib/pipeline/queue/job-manager');
          await recordError(article.id, `Error pipeline ES: ${err.message}`);
        } catch { /* non-critical */ }
      }
    }

    result.details.push(`Procesados: ${result.processed}, Publicados: ${result.published}, Fallidos: ${result.failed}, Omitidos: ${result.skipped}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Error fatal: ${err.message}`);
    console.error(`[EsOrchestrator] Error fatal de procesamiento: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ── Reprocess Incomplete Articles ──

async function reprocessSpanishArticles(maxArticles: number = 3): Promise<EsProcessResult> {
  const startTime = Date.now();
  const result: EsProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    const candidateArticles = await db.newsItem.findMany({
      where: {
        locale: 'es',
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
      select: { id: true, title: true, aiAnalysis: true, processingStage: true },
      take: maxArticles * 3,
    });

    const incompleteArticles = candidateArticles.filter((a: any) => {
      const hasAnalysis = a.aiAnalysis && a.aiAnalysis.length >= 50;
      return !hasAnalysis;
    }).slice(0, maxArticles);

    if (incompleteArticles.length === 0) {
      result.details.push('No hay artículos incompletos');
      result.duration = Date.now() - startTime;
      return result;
    }

    for (const article of incompleteArticles) {
      try {
        const needsAnalysis = !article.aiAnalysis || article.aiAnalysis.length < 50;
        const needsImage = article.processingStage !== 'imaged';

        if (needsAnalysis) {
          try {
            const { processArticleEs } = await import('@/lib/pipeline/agents/es-processor');
            await processArticleEs(article.id);
          } catch { /* non-critical */ }
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
              // Canvas fallback
              try {
                const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
                const articleData = await db.newsItem.findUnique({
                  where: { id: article.id },
                  select: { title: true, category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
                });
                const canvasBuffer = await generateArticleImage({
                  title: articleData?.title || article.title || 'Noticias Financieras',
                  category: articleData?.categoryId || articleData?.category || 'economy',
                  locale: 'es',
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
              } catch { /* non-critical */ }
            }
          } catch { /* non-critical */ }
        }

        // Update imageUrl
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

// ── Housekeeping ──

async function runHousekeeping(): Promise<void> {
  try {
    // Fix isReady=true but isPublished=false WITH limit checks
    const esHkLimits = await getEsPipelineLimits();
    const esHkNow = new Date();
    const esHkHourStart = new Date(esHkNow);
    esHkHourStart.setUTCMinutes(0, 0, 0);
    const esHkTodayStart = getTodayStart(ES_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V376: Added newsType: 'live' to match quota filter
    const esHkVisFilter = {
      locale: 'es',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [esHkPubToday, esHkPubThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...esHkVisFilter, publishedAt: { gte: esHkTodayStart } } }),
      db.newsItem.count({ where: { ...esHkVisFilter, publishedAt: { gte: esHkHourStart } } }),
    ]);

    const esHkRemainingHourly = esHkLimits.maxHourlyEsNews > 0
      ? Math.max(0, esHkLimits.maxHourlyEsNews - esHkPubThisHour) : 999;
    const esHkRemainingDaily = esHkLimits.maxDailyEsNews > 0
      ? Math.max(0, esHkLimits.maxDailyEsNews - esHkPubToday) : 999;
    const esHkMaxFix = Math.min(esHkRemainingHourly, esHkRemainingDaily);

    if (esHkMaxFix > 0) {
      // V1044: Only publish articles with complete analysis + image (golden rule)
      const articlesToEsFix = await db.newsItem.findMany({
        where: {
          isReady: true,
          isPublished: false,
          locale: 'es',
          aiAnalysis: { contains: 'fullContent' },
          generatedImage: { not: '' },
        },
        select: { id: true, fetchedAt: true },
        take: esHkMaxFix,
      });
      if (articlesToEsFix.length > 0) {
        // Set publishedAt = fetchedAt for each article (not new Date())
        for (const article of articlesToEsFix) {
          await db.newsItem.update({
            where: { id: article.id },
            data: { isPublished: true, publishedAt: article.fetchedAt || new Date() },
          });
        }
        const fixCount = articlesToEsFix.length;
        if (fixCount > 0) {
          // Record publishes in quota manager's in-process tracking
          try {
            const { recordPublish } = await import('./publish-quota');
            for (let i = 0; i < fixCount; i++) {
              recordPublish('es');
            }
          } catch { /* non-critical */ }
          console.log(`[EsOrchestrator] Corregido(s) ${fixCount} artículo(s) ES (cuota: hora=${esHkPubThisHour}/${esHkLimits.maxHourlyEsNews}, día=${esHkPubToday}/${esHkLimits.maxDailyEsNews})`);
        }
      }
    } else {
      console.log(`[EsOrchestrator] Cuota alcanzada — corrección omitida. Hora: ${esHkPubThisHour}/${esHkLimits.maxHourlyEsNews}, Día: ${esHkPubToday}/${esHkLimits.maxDailyEsNews}`);
    }
  } catch (err: any) {
    console.warn(`[EsOrchestrator] Error en mantenimiento: ${err.message}`);
  }

  try {
    // Reset stuck ES articles
    const stuckArticles = await db.newsItem.findMany({
      where: {
        locale: 'es',
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
      console.log(`[EsOrchestrator] Reiniciado(s) ${stuckArticles.length} artículo(s) ES bloqueado(s)`);
    }

    // Strong reset for stuck/skipped/old articles
    // V120: Track strong reset count. After MAX_STRONG_RESETS_BEFORE_ARCHIVE,
    // archive (delete) permanently stuck articles instead of infinitely retrying them.
    try {
      await strongReset('es', MAX_RETRY_COUNT);
      strongResetCount++;

      if (strongResetCount >= MAX_STRONG_RESETS_BEFORE_ARCHIVE) {
        // Archive articles that keep failing after multiple strong resets.
        // These are articles where AI/processing consistently fails.
        // Delete them — they're invisible anyway (isReady=false) and just
        // waste AI resources on infinite retry loops.
        const stuckToArchive = await db.newsItem.findMany({
          where: {
            locale: 'es',
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
          console.warn(`[EsOrchestrator V120] ARCHIVED ${archived.count} permanently stuck articles after ${strongResetCount} strong resets. Errors: ${stuckToArchive.slice(0, 3).map(a => a.lastError?.substring(0, 60)).join(' | ')}`);
        }

        // Reset the counter — give remaining/new articles a fresh chance
        strongResetCount = 0;
      }
    } catch (resetErr: any) {
      console.warn(`[EsOrchestrator] Strong reset error: ${resetErr.message}`);
    }
  } catch (err: any) {
    console.warn(`[EsOrchestrator] Error al reiniciar artículos bloqueados: ${err.message}`);
  }

  try {
    // Reset skipped articles back to fetched instead of deleting them
    // Articles >12h in 'fetched' stage are reset for reprocessing instead of deleted
    const ageCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const resetOld = await db.newsItem.updateMany({
      where: {
        locale: 'es',
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
      console.log(`[EsOrchestrator] Reiniciado(s) ${resetOld.count} artículo(s) ES antiguo(s) (>12h) para reprocesamiento en lugar de eliminación`);
    }

    // Purge only truly stuck articles (>24h, already retried many times)
    const veryOldCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const purged = await db.newsItem.deleteMany({
      where: {
        locale: 'es',
        isReady: false,
        isPublished: false,
        processingStage: 'fetched',
        fetchedAt: { lt: veryOldCutoff },
        retryCount: { gte: MAX_RETRY_COUNT },
      },
    });
    if (purged.count > 0) {
      console.log(`[EsOrchestrator] Eliminado(s) ${purged.count} artículo(s) ES realmente atascado(s) (>24h, reintentos máx.)`);
    }
  } catch (err: any) {
    console.warn(`[EsOrchestrator] Error al purgar artículos expirados: ${err.message}`);
  }

  try {
    // Fix articles with SVG placeholder images
    const svgPlaceholderArticles = await db.newsItem.findMany({
      where: {
        locale: 'es',
        isReady: true,
        isPublished: true,
        generatedImage: { not: null },
      },
      select: { id: true, generatedImage: true },
      take: 20,
    });

    const svgArticleIds: string[] = [];
    for (const article of svgPlaceholderArticles) {
      if (article.generatedImage && isSvgPlaceholderImage(article.generatedImage)) {
        svgArticleIds.push(article.id);
      }
    }

    if (svgArticleIds.length > 0) {
      await db.newsItem.updateMany({
        where: { id: { in: svgArticleIds } },
        data: { generatedImage: null, processingStage: 'analyzed' },
      });
      console.log(`[EsOrchestrator] Limpiado(s) ${svgArticleIds.length} artículo(s) ES con imagen SVG placeholder`);
    }
  } catch (err: any) {
    console.warn(`[EsOrchestrator] Error al limpiar imágenes SVG: ${err.message}`);
  }

  // Mark-ready with 30% quota cap (matching Arabic pipeline)
  try {
    const esMrLimits = await getEsPipelineLimits();
    const markResult = await markReadyWithQuotaCap('es', esMrLimits.maxDailyEsNews, esMrLimits.maxHourlyEsNews, ES_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');
    if (markResult.markedCount > 0 || markResult.fixedPublishedCount > 0) {
      console.log(`[EsOrchestrator] Mark-ready: ${markResult.markedCount} marked, ${markResult.fixedPublishedCount} fixed`);
    }
  } catch (markErr: any) {
    console.warn(`[EsOrchestrator] Mark-ready error: ${markErr.message}`);
  }

  // V125→V244: Reset terminal-stage articles (rejected + skipped) back to 'fetched'.
  // 'skipped' articles were previously lost forever — they had valid content from
  // the source but AI refused to process them. Now they get re-processed.
  // 'rejected' articles are reset for the same reason.
  // Only articles newer than 24h, only locale 'es'.
  try {
    const terminalCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const terminalArticles = await db.newsItem.findMany({
      where: {
        locale: 'es',
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
        console.log(`[EsOrchestrator V244] Reset ${resetResult.count} terminal-stage (rejected/skipped) articles back to 'fetched' for re-processing`);
      }
    }
  } catch (err: any) {
    console.warn(`[EsOrchestrator V244] Terminal-stage reset failed: ${err.message}`);
  }
}

// ── Main Cycle ──

async function runCycle(): Promise<void> {
  if (!isRunning) return;
  if (isPaused) {
    scheduleNextCycle();
    return;
  }

  cycleCount++;
  const cycleStart = Date.now();

  // Pre-cycle DB health check with improved recovery
  let dbOk = await pingDB();
  if (!dbOk) {
    console.warn(`[EsOrchestrator] DB inaccesible — intentando recuperación...`);
    for (let recoveryAttempt = 1; recoveryAttempt <= 3; recoveryAttempt++) {
      const recovered = await recoverConnection();
      if (recovered) {
        dbOk = await pingDB();
        if (dbOk) {
          console.log(`[EsOrchestrator] ✓ DB recuperada en intento ${recoveryAttempt} — continuando ciclo #${cycleCount}`);
          break;
        }
      }
      console.warn(`[EsOrchestrator] Intento de recuperación ${recoveryAttempt}/3 fallido — esperando ${recoveryAttempt * 5}s...`);
      await new Promise(r => setTimeout(r, recoveryAttempt * 5000));
    }
    if (!dbOk) {
      console.error(`[EsOrchestrator] ✗ Los 3 intentos de recuperación DB fallaron — ciclo #${cycleCount} omitido`);
      lastError = 'Conexión a la base de datos fallida — 3 intentos de recuperación infructuosos';
      totalErrors++;
      scheduleNextCycle();
      return;
    }
  }

  console.log(`[EsOrchestrator] Ciclo #${cycleCount} en progreso...`);

  try {
    // Early quota check — skip processing if limits reached
    try {
      const { canPublish } = await import('./publish-quota');
      const quotaCheck = await canPublish('es');
      if (!quotaCheck.allowed) {
        // Still fetch to keep queue fresh, but skip processing
        const fetchResult = await fetchSpanishRSSFeeds();
        totalFetched += fetchResult.fetched;
        console.log(`[EsOrchestrator] Cuota alcanzada — procesamiento omitido. Fetch: ${fetchResult.fetched}. ${quotaCheck.reason}`);
        lastCycleTime = Date.now();
        scheduleNextCycle();
        return;
      }
    } catch (quotaErr: any) {
      console.warn(`[EsOrchestrator] Error al verificar cuota: ${quotaErr.message}`);
    }

    // ── Step 1: Fetch new Spanish articles ──
    const fetchResult = await fetchSpanishRSSFeeds();
    totalFetched += fetchResult.fetched;

    // V121: CASCADE FAILURE — log warning but CONTINUE processing.
    // Instead of stopping the cycle when AI providers hit rate limits,
    // we log a warning and let processing continue. Individual article
    // failures are handled by retry logic. It's better to process SOME
    // articles with available providers than to process ZERO articles.
    if (isCascadeFailure()) {
      console.warn(`[EsOrchestrator V121] AI provider CASCADE FAILURE detected — continuing processing with available providers. ` +
        `Multiple providers are rate-limited but pipeline will NOT stop.`);
    }

    // ── Step 2: Process articles through the full pipeline ──
    const processResult = await processSpanishArticles(MAX_ARTICLES_PER_CYCLE);

    // ── Step 3: Reprocess incomplete published articles ──
    let reprocessResult: EsProcessResult | null = null;
    if (cycleCount % 3 === 0) { // Every 3 cycles (~30 min)
      reprocessResult = await reprocessSpanishArticles(3);
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
        console.warn(`[EsOrchestrator V56] Smart Watchdog: ${consecutiveEmptyCycles} consecutive empty cycles! Triggering strong reset...`);
        try {
          await strongReset('es', MAX_RETRY_COUNT);
        } catch (resetErr: any) {
          console.warn(`[EsOrchestrator] Smart Watchdog strong reset error: ${resetErr.message}`);
        }
        consecutiveEmptyCycles = 0; // Reset counter after strong reset
      }
    } else if (publishedThisCycle > 0) {
      consecutiveEmptyCycles = 0; // Reset on successful publish
    }

    // ── Step 4: Housekeeping (every 3 cycles) ──
    if (cycleCount % 3 === 0) {
      await runHousekeeping();
    }

    // V413: Auto-infographic generation DISABLED — manual only via /api/infographics/generate-es

    const cycleDuration = Date.now() - cycleStart;
    lastCycleTime = Date.now();

    if (processResult.published > 0 || fetchResult.fetched > 0) {
      console.log(`[EsOrchestrator] Ciclo #${cycleCount} completado: obtenido(s) ${fetchResult.fetched}, publicado(s) ${processResult.published}, fallido(s) ${processResult.failed}${reprocessResult ? `, reprocesado(s) ${reprocessResult.processed}` : ''} en ${cycleDuration}ms`);
    }
  } catch (err: any) {
    lastError = err.message;
    totalErrors++;
    console.error(`[EsOrchestrator] ERROR FATAL Ciclo #${cycleCount}:`, err.message);
  }

  scheduleNextCycle();
}

// ── Schedule Next Cycle ──

function scheduleNextCycle(): void {
  if (!isRunning) return;
  cycleTimer = setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[EsOrchestrator] Ciclo fallido: ${err.message}`);
      scheduleNextCycle(); // Always keep the loop running
    }
  }, NEWS_CYCLE_INTERVAL_MS);
}

// ── Watchdog ──

function watchdog(): void {
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    if (!isRunning) return;
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[EsOrchestrator Watchdog] OBSOLETO — último ciclo hace ${Math.round(idleMs / 60000)} min. ¡Reinicio forzado!`);
      stopEsOrchestratorInternal();
      startEsOrchestrator();
    }
  }, WATCHDOG_INTERVAL_MS);
}

// ── Internal stop helper ──

function stopEsOrchestratorInternal(): void {
  isRunning = false;
  if (cycleTimer) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

// ── Public API ──

export function startEsOrchestrator(): void {
  if (isRunning) {
    const idleMs = Date.now() - lastCycleTime;
    if (lastCycleTime > 0 && idleMs > WATCHDOG_MAX_IDLE_MS) {
      console.warn(`[EsOrchestrator] EN EJECUCIÓN pero OBSOLETO — último ciclo hace ${Math.round(idleMs / 60000)} min. ¡Reinicio forzado!`);
      stopEsOrchestratorInternal();
    } else {
      console.log('[EsOrchestrator] Ya está en ejecución');
      return;
    }
  }

  isRunning = true;
  isPaused = false;

  // Start DB keepalive to prevent Supabase from dropping idle connections
  try {
    startDBKeepalive();
    console.log('[EsOrchestrator] ✓ Keepalive DB iniciado (ping cada 2 min)');
  } catch {
    console.warn('[EsOrchestrator] Error al iniciar keepalive DB — se basará en recuperación por ciclo');
  }

  console.log(`[EsOrchestrator] Iniciando — ciclo cada ${NEWS_CYCLE_INTERVAL_MS / 1000}s, máx ${MAX_ARTICLES_PER_CYCLE} artículos/ciclo. Watchdog: reinicia si inactivo > ${WATCHDOG_MAX_IDLE_MS / 60000} min.`);

  // Start watchdog
  watchdog();

  // Start the first cycle after the startup delay
  setTimeout(async () => {
    try {
      await runCycle();
    } catch (err: any) {
      console.error(`[EsOrchestrator] Ciclo inicial fallido: ${err.message}`);
      scheduleNextCycle();
    }
  }, STARTUP_DELAY_MS);
}

export function stopEsOrchestrator(): void {
  stopEsOrchestratorInternal();
  console.log('[EsOrchestrator] Detenido');
}

export function pauseEsOrchestrator(): void {
  isPaused = true;
  console.log('[EsOrchestrator] En pausa');
}

export function resumeEsOrchestrator(): void {
  isPaused = false;
  console.log('[EsOrchestrator] Reanudado');
}

export async function getEsOrchestratorStatus() {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const esLimits = await getEsPipelineLimits();

  // V377: Query DB for actual total published count with visibility filter
  // (only count live news visible on the frontend, not reports/analyses)
  let dbTotalPublished = totalPublished; // fallback to in-memory counter
  try {
    dbTotalPublished = await db.newsItem.count({
      where: {
        locale: 'es',
        isReady: true,
        isPublished: true,
        newsType: 'live',
        slug: { not: '' },
        title: { not: '' },
      },
    });
  } catch (dbErr: any) {
    console.warn(`[EsOrchestrator V377] DB totalPublished count failed: ${dbErr.message}`);
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
      maxArticlesPerCycle: MAX_ARTICLES_PER_CYCLE,
      maxRetryCount: MAX_RETRY_COUNT,
      maxDailyPublished: esLimits.maxDailyEsNews,
      maxHourlyPublished: esLimits.maxHourlyEsNews,
    },
  };
}

// ensureEsRunning — called by external triggers (health checks, cron, etc.)
export function ensureEsRunning(): { wasRunning: boolean; wasStale: boolean; restarted: boolean } {
  const idleMs = lastCycleTime > 0 ? Date.now() - lastCycleTime : null;
  const wasStale = idleMs !== null && idleMs > WATCHDOG_MAX_IDLE_MS;
  const wasRunning = isRunning;

  if (!isRunning || wasStale) {
    if (wasStale) {
      console.warn(`[EsOrchestrator] ensureEsRunning: OBSOLETO (inactivo ${Math.round((idleMs || 0) / 60000)} min) — reinicio forzado`);
      stopEsOrchestratorInternal();
    } else {
      console.log(`[EsOrchestrator] ensureEsRunning: NO está en ejecución — iniciando`);
    }
    startEsOrchestrator();
    return { wasRunning, wasStale, restarted: true };
  }

  return { wasRunning: true, wasStale: false, restarted: false };
}
