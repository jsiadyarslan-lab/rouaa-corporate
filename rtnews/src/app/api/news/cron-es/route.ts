// ─── Spanish News Cron API Route V3 ──────────────────────────
// FULL PIPELINE: fetch → AI analysis → image generation → publish
//
// V3 KEY CHANGES:
// - Uses getEsPipelineLimits() from es-pipeline-config (300/day, 50/hour)
//   instead of hardcoded 60/day, 8/hour that was throttling the pipeline
// - Uses ES_PIPELINE_CONFIG.RSS_FEEDS_ES (~40 feeds) instead of hardcoded 7
// - Added 'skipped' to processing stages (resets skipped articles for reprocessing)
// - Added content:encoded parsing for richer RSS content
// - Added live quota re-check every 5 articles (like FR/TR routes)
// - Added reprocess function for published articles missing AI analysis
// - Added direct-publish fallback with Canvas image (like TR route)
//
// This is an ADDITIVE file — the Arabic, English, French and Turkish cron routes are untouched.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ES_PIPELINE_CONFIG, getEsPipelineLimits } from '@/lib/pipeline/es-pipeline-config';
import { getTodayStart, liveQuotaReCheck, runContentLoaderStep, markReadyWithQuotaCap, strongReset, recordAIFailure, recordAISuccess, isDegradedMode, parseRSSXML } from '@/lib/pipeline/shared-pipeline-utils';

// V1070: Official source detection
const OFFICIAL_DOMAINS_V1070 = ['federalreserve.gov', 'ecb.europa.eu', 'bis.org', 'imf.org', 'worldbank.org', 'sec.gov', 'treasury.gov', 'bankofengland.co.uk', 'boj.or.jp', 'opec.org', 'eia.gov', 'iea.org', 'moodys.com', 'fitchratings.com', 'spglobal.com', 'brookings.edu', 'oecd.org', 'wto.org', 'nyse.com', 'nasdaq.com', 'cmegroup.com', 'sama.gov.sa', 'spa.gov.sa', 'wam.ae', 'qna.org.qa', 'pif.gov.sa', 'lme.com', 'fda.gov', 'bea.gov', 'bls.gov', 'census.gov', 'bruegel.org', 'chathamhouse.org', 'amf.org.ae', 'kuna.net.kw', 'map.org.ma', 'eib.org', 'ebrd.com', 'aiib.org', 'afdb.org', 'adb.org', 'iadb.org', 'isdb.org', 'euronext.com', 'hkex.com.hk', 'deutsche-boerse.com', 'saudiexchange.sa', 'adx.ae', 'dfm.ae', 'boursakuwait.com', 'theice.com', 'lseg.com', 'cato.org', 'heritage.org', 'cepr.org', 'ifri.org', 'cfr.org', 'lowyinstitute.org'];
const OFFICIAL_NAMES_V1070 = ['Federal Reserve', 'European Central Bank', 'ECB', 'Bank of England', 'Bank of Japan', 'BIS', 'IMF', 'World Bank', 'SEC', 'Treasury', 'Central Bank', 'Ministry of Finance', 'WTO', 'OECD', 'Moodys', 'Fitch', 'S&P Global', 'NYSE', 'Nasdaq', 'Euronext', 'LME', 'CME', 'IEA', 'OPEC', 'EIA', 'Brookings', 'Chatham House', 'Saudi Press Agency', 'WAM', 'QNA', 'KUNA', 'Arab Monetary Fund', 'PIF', 'Asian Development Bank', 'African Development Bank', 'European Investment Bank', 'EBRD', 'AIIB', 'IsDB', 'BLS', 'BEA', 'Census Bureau'];
function isOfficialSourceUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return OFFICIAL_DOMAINS_V1070.some(d => lower.includes(d));
}
function isOfficialSourceName(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return OFFICIAL_NAMES_V1070.some(n => lower.includes(n.toLowerCase()));
}

export const dynamic = 'force-dynamic';

// ─── Spanish Financial Keywords ──────────────────────────
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
  // English financial terms (many Spanish sources use English terms)
  /\bstocks?\b/i, /\bshares?\b/i, /\bmarkets?\b/i, /\btrading?\b/i, /\binvest/i,
  /\bbanks?\b/i, /\brates?\b/i, /\bbonds?\b/i, /\byields?\b/i,
  /\bgdp\b/i, /\binterest/i, /\bcrypto\b/i, /\boil\b/i, /\bgold\b/i,
  /\bcurrenc(?:y|ies)\b/i, /\bforex\b/i, /\brecession\b/i, /\bprofits?\b/i,
  /\brevenue/i, /\bearnings?\b/i, /\betf\b/i, /\bnasdaq\b/i, /\bs&p\b/i,
  /\btariffs?\b/i, /\btrade/i, /\bcommodit/i, /\bprices?\b/i,
  /\bceo\b/i, /\bcompany\b/i, /\bcorporate/i, /\bcapital/i,
  /\benergy\b/i, /\btech\b/i, /\btechnology\b/i,
];

// ─── parseRSSXML is now imported from shared-pipeline-utils ──

// ─── Spanish RSS Fetcher ─────────────────────────────────

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
    console.log('[EsCron V3] Obteniendo fuentes RSS en español...');

    // V3: Use full RSS feed list from es-pipeline-config (~40 feeds) instead of hardcoded 7
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
            'User-Agent': feed.url.includes('sec.gov') ? 'Rouaa News Agent contact@rouaa.com' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.5',
            'Cache-Control': 'no-cache',
          },
          next: { revalidate: 300 },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[EsCron V3] RSS ${feed.source} devolvió ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSXML(xml, feed.category, feed.source);
        allItems.push(...items);
      } catch (err: any) {
        console.warn(`[EsCron V3] Error al obtener ${feed.source}: ${err.message}`);
        result.errors++;
      }
    }

    if (allItems.length === 0) {
      console.log('[EsCron V3] No se obtuvieron artículos de las fuentes RSS en español');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EsCron V3] Obtenidos ${allItems.length} artículos de ${feeds.length} fuentes españolas. Guardando...`);

    for (const item of allItems) {
      try {
        if (!item.url || item.url.length < 5) {
          result.errors++;
          continue;
        }

        // Financial keyword filter
        const textToCheck = `${item.title} ${item.summary}`;
        const isFinancial = ES_FINANCIAL_KEYWORDS.some(pattern => pattern.test(textToCheck));
        if (!isFinancial) {
          result.filtered++;
          continue;
        }

        // Locale-aware deduplication: check against Spanish articles only
        const existing = await db.newsItem.findFirst({
          where: { url: item.url, locale: 'es' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Get category in Spanish from ES_PIPELINE_CONFIG
        const esCategory = ES_PIPELINE_CONFIG.CATEGORY_MAP_ES[item.category] || 'Economía';

        // Generate slug from Spanish title (includes random suffix)
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Simple sentiment analysis (Spanish + English words)
        const positiveWords = ['sube', 'crecimiento', 'alza', 'récord', 'beneficio', 'ganancia', 'impulso', 'recuperación', 'mejora',
          'rise', 'surge', 'gain', 'rally', 'boost', 'jump', 'climb', 'record', 'beat', 'growth', 'profit'];
        const negativeWords = ['cae', 'baja', 'pérdida', 'crisis', 'recesión', 'desplome', 'hundimiento', 'recorte', 'deterioro',
          'fall', 'drop', 'decline', 'slide', 'sink', 'crash', 'loss', 'low', 'miss', 'cut', 'recession', 'plunge'];
        const lowerText = textToCheck.toLowerCase();
        let posScore = 0, negScore = 0;
        positiveWords.forEach(w => { if (lowerText.includes(w)) posScore += 10; });
        negativeWords.forEach(w => { if (lowerText.includes(w)) negScore += 10; });
        const sentiment = posScore > negScore + 10 ? 'positive' : negScore > posScore + 10 ? 'negative' : 'neutral';
        const sentimentScore = posScore > negScore + 10 ? Math.min(55 + posScore, 95) : negScore > posScore + 10 ? Math.min(55 + negScore, 95) : 55;

        // Use the RSS summary as initial content — es-processor will enhance it
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
              isOfficialSource: isOfficialSourceUrl(item.url) || isOfficialSourceName(item.source), // V1070
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
          // P2002 on slug+locale — retry with a fresh slug (new random suffix)
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
                  isOfficialSource: isOfficialSourceUrl(item.url) || isOfficialSourceName(item.source), // V1070
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
              result.duplicates++;
            }
          } else {
            throw createErr;
          }
        }
      } catch (err: any) {
        result.errors++;
        console.error(`[EsCron V3] Error al guardar "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`[EsCron V3] Completado: ${result.fetched} nuevos, ${result.duplicates} duplicados, ${result.filtered} filtrados, ${result.errors} errores en ${result.duration}ms`);
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[EsCron V3] Error crítico al obtener:', err.message);
    return result;
  }
}

// ─── V3: Full Pipeline Processing for Spanish Articles ────────

interface EsProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

async function processSpanishArticles(maxArticles: number = 20): Promise<EsProcessResult> {
  const startTime = Date.now();
  const result: EsProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [] as string[], duration: 0 };
  const errorDetails: string[] = [];

  try {
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'es',
        isReady: false,
        isPublished: false,
        // V3: Added 'skipped' and 'translated' to processing stages (like FR/TR routes)
        processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped', 'imaged'] },
        retryCount: { lt: 15 },
        title: { not: '' },
      },
      orderBy: { fetchedAt: 'desc' },
      select: {
        id: true,
        title: true,
        processingStage: true,
        retryCount: true,
        summary: true,
        content: true,
      },
      take: maxArticles,
    });

    if (unprocessedArticles.length === 0) {
      result.details.push('No hay artículos para procesar');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EsCron V3] Procesando: ${unprocessedArticles.length} artículos españoles encontrados`);

    // V3: Use dynamic limits from es-pipeline-config (300/day, 50/hour) instead of hardcoded 60/8
    const esLimits = await getEsPipelineLimits();
    const maxDaily = esLimits.maxDailyEsNews;
    const maxHourly = esLimits.maxHourlyEsNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(ES_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V377: Added newsType: 'live' — quota should ONLY count live news articles
    // (reports/analyses should NOT consume the daily/hourly limit)
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

    console.log(`[EsCron V3] Procesando: Cuota — hora: ${publishedThisHour}/${maxHourly}, día: ${publishedToday}/${maxDaily}`);

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Cuota alcanzada — hora: ${publishedThisHour}/${maxHourly}, día: ${publishedToday}/${maxDaily}`);
      result.duration = Date.now() - startTime;
      return result;
    }

    let publishCount = 0;

    for (const article of unprocessedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unprocessedArticles.length - result.processed;
        result.details.push(`Cuota alcanzada después de ${publishCount} artículos`);
        break;
      }

      // V3: Live quota re-check every 5 articles (like FR/TR routes)
      if (publishCount > 0 && publishCount % 5 === 0) {
        try {
          const [liveToday, liveHour] = await Promise.all([
            db.newsItem.count({ where: { ...esPublishedFilter, publishedAt: { gte: todayStart } } }),
            db.newsItem.count({ where: { ...esPublishedFilter, publishedAt: { gte: hourStart } } }),
          ]);
          const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
          const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;
          if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
            console.log(`[EsCron V3] Verificación de cuota en vivo: límite alcanzado (hora=${liveHour}/${maxHourly}, día=${liveToday}/${maxDaily}). Detenido después de ${publishCount} publicados.`);
            result.skipped += unprocessedArticles.length - result.processed;
            break;
          }
        } catch (reCheckErr: any) {
          console.warn(`[EsCron V3] Verificación de cuota en vivo fallida: ${reCheckErr.message}`);
        }
      }

      try {
        // V3: Reset skipped articles back to fetched before processing
        if (article.processingStage === 'skipped') {
          await db.newsItem.update({
            where: { id: article.id },
            data: { processingStage: 'fetched', retryCount: 0, lastError: null },
          });
          console.log(`[EsCron V3] Artículo omitido ${article.id} → reiniciado a fetched para reprocesamiento`);
        }

        // V3.1: Articles in 'imaged' stage but not published — try publishing directly
        if (article.processingStage === 'imaged') {
          console.log(`[EsCron V3] Artículo ${article.id} en etapa 'imaged' pero no publicado — intentando publicación directa`);
          try {
            const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
            const pubResult = await publishArticle(article.id);
            if (pubResult.success) {
              publishCount++;
              result.published++;
              result.processed++;
              console.log(`[EsCron V3] ✓ Artículo ${article.id} PUBLICADO EXITOSAMENTE (imaged → published)`);
              continue;
            } else {
              // Publisher rejected — force publish as fallback
              // V361: Check quota BEFORE force publish
              let esForceQuotaAllowed = true;
              try {
                const { canPublish } = await import('@/lib/pipeline/publish-quota');
                const quotaCheck = await canPublish('es');
                if (!quotaCheck.allowed) {
                  esForceQuotaAllowed = false;
                  console.warn(`[EsCron V361] Force publish BLOQUEADO por cuota ${article.id}: ${quotaCheck.reason}`);
                }
              } catch { /* fail-open */ }

              if (esForceQuotaAllowed) {
                console.warn(`[EsCron V3] Editor rechazó ${article.id}: ${pubResult.reason} — forzando publicación`);
                const { generateSlug } = await import('@/lib/slug');
                const slug = article.title ? generateSlug(article.title) : article.id;
                const articleForDate = await db.newsItem.findUnique({ where: { id: article.id }, select: { fetchedAt: true } });
                await db.newsItem.update({
                  where: { id: article.id },
                  data: {
                    isReady: true,
                    isPublished: true,
                    publishedAt: articleForDate?.fetchedAt || new Date(),
                    slug: slug || article.id,
                    imageUrl: `/api/article-image/${article.id}`,
                  },
                });
                // V361: Record publish in quota manager
                try {
                  const { recordPublish } = await import('@/lib/pipeline/publish-quota');
                  recordPublish('es');
                } catch { /* non-critical */ }
                publishCount++;
                result.published++;
                result.processed++;
                console.log(`[EsCron V3] ✓ Artículo ${article.id} PUBLICADO (forzado desde imaged)`);
              } else {
                result.skipped++;
                console.warn(`[EsCron V361] Force publish SKIP: cuota alcanzada para ${article.id}`);
              }
              continue;
            }
          } catch (pubErr: any) {
            console.error(`[EsCron V3] Error de publicación directa ${article.id}: ${pubErr.message}`);
            // Fall through to normal processing
          }
        }

        console.log(`[EsCron V3] Procesando artículo ${article.id}: "${article.title?.slice(0, 50)}..." (etapa: ${article.processingStage})`);

        // ── Step 0: Run content loader if article is still in 'fetched' stage ──
        if (article.processingStage === 'fetched') {
          try {
            await runContentLoaderStep(article.id, 'es');
          } catch (clErr: any) {
            console.warn(`[EsCron V3] Content loader error for ${article.id}: ${clErr.message}`);
          }
        }

        // ── Step 1: Run es-processor (AI analysis + content enhancement) ──
        let processorSuccess = false;
        try {
          const { processArticleEs } = await import('@/lib/pipeline/agents/es-processor');
          const esResult = await processArticleEs(article.id);
          if (esResult.success) {
            processorSuccess = true;
            recordAISuccess('es');
            console.log(`[EsCron V3] es-processor exitoso ${article.id}: campos=${esResult.fields?.join(',')}`);
          } else {
            const errMsg = `es-processor falló para ${article.id}: ${esResult.error}`;
            console.warn(`[EsCron V3] ${errMsg} — reintentando`);
            errorDetails.push(errMsg);
            const retryResult = await processArticleEs(article.id);
            if (retryResult.success) {
              processorSuccess = true;
              recordAISuccess('es');
              console.log(`[EsCron V3] es-processor reintento exitoso ${article.id}`);
            } else {
              const retryErrMsg = `es-processor reintento también falló para ${article.id}: ${retryResult.error}`;
              console.warn(`[EsCron V3] ${retryErrMsg}`);
              errorDetails.push(retryErrMsg);
              recordAIFailure('es');
            }
          }
        } catch (procErr: any) {
          const fatalErrMsg = `es-processor error fatal para ${article.id}: ${procErr.message}`;
          console.error(`[EsCron V3] ${fatalErrMsg}`);
          errorDetails.push(fatalErrMsg);
          recordAIFailure('es');
        }

        if (!processorSuccess) {
          console.log(`[EsCron V3] es-processor falló — intentando imagen Canvas + publicación directa para ${article.id}`);
        }

        // ── Step 2: Run imager ──
        let imageSuccess = false;
        try {
          const { imageArticle } = await import('@/lib/pipeline/agents/imager');
          const imageResult = await imageArticle(article.id);
          if (imageResult.success) {
            imageSuccess = true;
            console.log(`[EsCron V3] imager exitoso ${article.id}: fuente=${imageResult.imageSource}`);
          } else {
            console.warn(`[EsCron V3] imager falló ${article.id}: ${imageResult.error}`);
          }
        } catch (imgErr: any) {
          console.error(`[EsCron V3] imager error fatal ${article.id}: ${imgErr.message}`);
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
              console.log(`[EsCron V3] ✓ Artículo ${article.id} PUBLICADO EXITOSAMENTE`);
            } else {
              console.warn(`[EsCron V3] editor rechazó ${article.id}: ${pubResult.reason}`);
            }
          } else {
            // Canvas image fallback + direct publish
            console.log(`[EsCron V3] Artículo ${article.id} no está en etapa 'imaged' — intentando imagen Canvas + publicación directa`);

            try {
              const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
              const title = updatedArticle?.title || article.title || 'Noticias Financieras';

              const articleFull = await db.newsItem.findUnique({
                where: { id: article.id },
                select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
              });

              const canvasBuffer = await generateArticleImage({
                title,
                category: articleFull?.categoryId || articleFull?.category || 'economy',
                locale: 'es',
                newsType: articleFull?.newsType || undefined,
                sentiment: articleFull?.sentiment || undefined,
                source: articleFull?.sourceName || articleFull?.source || undefined,
              });

              if (canvasBuffer && canvasBuffer.length > 500) {
                const { uploadImageToR2 } = await import('@/lib/image-storage');
                const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;

                let storedValue: string;
                const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                if (r2Result.success) {
                  storedValue = r2Result.url;
                } else {
                  storedValue = null;
                }

                const hasContent = (updatedArticle?.content && updatedArticle.content.length >= 200);
                const hasAnalysis = (updatedArticle?.aiAnalysis && updatedArticle.aiAnalysis.length > 50);

                if (hasContent && hasAnalysis) {
                  await db.newsItem.update({
                    where: { id: article.id },
                    data: {
                      generatedImage: storedValue,
                      processingStage: 'imaged',
                    },
                  });

                  const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
                  const pubResult = await publishArticle(article.id);
                  if (pubResult.success) {
                    publishSuccess = true;
                    publishCount++;
                    result.published++;
                    console.log(`[EsCron V3] ✓ Artículo ${article.id} PUBLICADO con imagen Canvas vía editor`);
                  }
                } else {
                  // V1064: GOLDEN RULE — never publish without full AI analysis
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

                  console.warn(`[EsCron V1064] Artículo ${article.id}: imagen guardada pero NO publicada — ${!hasContent ? 'contenido' : 'análisis'} faltante. Se reintentará en el próximo ciclo.`);
                }
              }
            } catch (canvasErr: any) {
              console.error(`[EsCron V3] Canvas fallback falló ${article.id}: ${canvasErr.message}`);
            }
          }
        } catch (pubErr: any) {
          console.error(`[EsCron V3] Error del editor ${article.id}: ${pubErr.message}`);
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
        console.error(`[EsCron V3] Error al procesar artículo ${article.id}: ${err.message}`);
        try {
          const { recordError } = await import('@/lib/pipeline/queue/job-manager');
          await recordError(article.id, `ES pipeline error: ${err.message}`);
        } catch { /* non-critical */ }
      }
    }

    result.details.push(`Procesados: ${result.processed}, Publicados: ${result.published}, Fallidos: ${result.failed}, Omitidos: ${result.skipped}`);
    if (errorDetails.length > 0) {
      result.details.push(...errorDetails.slice(0, 10));
    }
    console.log(`[EsCron V3] Procesamiento completado: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Error fatal: ${err.message}`);
    console.error(`[EsCron V3] Error fatal de procesamiento: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── Reprocess published articles missing AI analysis/images ──

async function reprocessSpanishArticles(maxArticles: number = 5): Promise<EsProcessResult> {
  const startTime = Date.now();
  const result: EsProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [] as string[], duration: 0 };

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
      select: {
        id: true,
        title: true,
        aiAnalysis: true,
        processingStage: true,
      },
      take: maxArticles * 3,
    });

    const incompleteArticles = candidateArticles.filter((a: any) => {
      const hasAnalysis = a.aiAnalysis && a.aiAnalysis.length >= 50;
      return !hasAnalysis;
    }).slice(0, maxArticles);

    if (incompleteArticles.length === 0) {
      result.details.push('No hay artículos incompletos para reprocesar');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[EsCron V3] Reprocesando: ${incompleteArticles.length} artículos ES publicados con análisis/imagen faltante`);

    for (const article of incompleteArticles) {
      try {
        const needsAnalysis = !article.aiAnalysis || article.aiAnalysis.length < 50;
        const needsImage = article.processingStage !== 'imaged';

        console.log(`[EsCron V3] Reprocesando ${article.id}: needsAnalysis=${needsAnalysis}, needsImage=${needsImage}`);

        if (needsAnalysis) {
          try {
            const { processArticleEs } = await import('@/lib/pipeline/agents/es-processor');
            const esResult = await processArticleEs(article.id);
            if (esResult.success) {
              console.log(`[EsCron V3] Reprocesando: es-processor exitoso ${article.id}`);
            } else {
              console.warn(`[EsCron V3] Reprocesando: es-processor falló ${article.id}: ${esResult.error}`);
            }
          } catch (procErr: any) {
            console.warn(`[EsCron V3] Reprocesando: error es-processor ${article.id}: ${procErr.message}`);
          }
        }

        if (needsImage) {
          try {
            await db.newsItem.update({
              where: { id: article.id },
              data: { generatedImage: null, processingStage: 'analyzed' },
            });
            const { imageArticle } = await import('@/lib/pipeline/agents/imager');
            const imgResult = await imageArticle(article.id);
            if (imgResult.success) {
              console.log(`[EsCron V3] Reprocesando: imager exitoso ${article.id}: fuente=${imgResult.imageSource}`);
            } else {
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
                  console.log(`[EsCron V3] Reprocesando: Imagen Canvas guardada para ${article.id}`);
                }
              } catch (canvasErr: any) {
                console.warn(`[EsCron V3] Reprocesando: Canvas fallback falló ${article.id}: ${canvasErr.message}`);
              }
            }
          } catch (imgErr: any) {
            console.warn(`[EsCron V3] Reprocesando: error imager ${article.id}: ${imgErr.message}`);
          }
        }

        // Update imageUrl to use API route
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
        console.error(`[EsCron V3] Error de reprocesamiento para ${article.id}: ${err.message}`);
      }
    }

    result.details.push(`Reprocesados: ${result.processed}, Mejorados: ${result.published}, Fallidos: ${result.failed}`);
    console.log(`[EsCron V3] Reprocesamiento completado: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Error fatal: ${err.message}`);
    console.error(`[EsCron V3] Error fatal de reprocesamiento: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── Spanish Pipeline Trigger ───────────────────────────────

async function triggerEsPipeline(): Promise<{ message: string; orchestrator: any }> {
  try {
    const { ensureEsRunning } = await import('@/lib/pipeline/es-orchestrator');
    const result = ensureEsRunning();
    const { getEsOrchestratorStatus } = await import('@/lib/pipeline/es-orchestrator');
    const stats = await getEsOrchestratorStatus();

    return {
      message: result?.restarted ? 'Pipeline español reiniciado (estaba detenido o en espera)' : 'Pipeline español ya está en ejecución',
      orchestrator: stats,
    };
  } catch (err: any) {
    return {
      message: `Orquestador ES no disponible: ${err.message}`,
      orchestrator: null,
    };
  }
}

// ─── Main GET Handler ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // Status check
    if (action === 'status') {
      const now = new Date();
      const hourStart = new Date(now); hourStart.setUTCMinutes(0, 0, 0);
      const todayStart = getTodayStart(ES_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);
      // V376: Visibility filter MUST match the frontend news page filter — added newsType: 'live'
      const esFilter = { locale: 'es', isReady: true, isPublished: true, newsType: 'live' as const, slug: { not: '' }, title: { not: '' } };

      // V3: Use dynamic limits
      const esLimits = await getEsPipelineLimits();

      const [totalReady, totalPublished, publishedToday, publishedThisHour, pending, publishedWithoutImage, awaitingProcessing, esStuckHighRetry, esByStage] = await Promise.all([
        db.newsItem.count({ where: { ...esFilter } }),
        db.newsItem.count({ where: { ...esFilter, publishedAt: { not: null } } }),
        db.newsItem.count({ where: { ...esFilter, publishedAt: { gte: todayStart } } }),
        db.newsItem.count({ where: { ...esFilter, publishedAt: { gte: hourStart } } }),
        db.newsItem.count({ where: { locale: 'es', isReady: false, isPublished: false, title: { not: '' } } }),
        db.newsItem.count({ where: { locale: 'es', isReady: true, isPublished: true, generatedImage: null, slug: { not: '' } } }),
        db.newsItem.count({ where: { locale: 'es', isReady: false, isPublished: false, processingStage: 'fetched', title: { not: '' } } }),
        // V378: Count stuck articles (retryCount >= 15) — diagnostic
        db.newsItem.count({ where: { locale: 'es', isReady: false, isPublished: false, retryCount: { gte: 15 } } }),
        // V378: Breakdown by processing stage — diagnostic
        db.newsItem.groupBy({ by: ['processingStage'], where: { locale: 'es', isReady: false, isPublished: false }, _count: { id: true } }),
      ]);

      // V378: Build stage breakdown for diagnostics
      const esStageBreakdown: Record<string, number> = {};
      for (const row of esByStage) {
        esStageBreakdown[row.processingStage || 'unknown'] = row._count.id;
      }

      // V378: Quota diagnostic info
      const esRemainingDaily = esLimits.maxDailyEsNews > 0 ? Math.max(0, esLimits.maxDailyEsNews - publishedToday) : 999;
      const esRemainingHourly = esLimits.maxHourlyEsNews > 0 ? Math.max(0, esLimits.maxHourlyEsNews - publishedThisHour) : 999;

      return NextResponse.json({
        status: 'ok',
        locale: 'es',
        version: 'V3',
        pipeline: {
          totalReady, totalPublished, publishedToday, publishedThisHour,
          pending, publishedWithoutImage, awaitingProcessing,
          stuckHighRetry: esStuckHighRetry,
          stageBreakdown: esStageBreakdown,
          limits: {
            maxDaily: esLimits.maxDailyEsNews,
            maxHourly: esLimits.maxHourlyEsNews,
            remainingDaily: esRemainingDaily,
            remainingHourly: esRemainingHourly,
            dailyQuotaReached: esRemainingDaily <= 0,
            hourlyQuotaReached: esRemainingHourly <= 0,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Internal secret check for mutating actions
    const internalSecret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
    const internalHeader = request.headers.get('x-internal');
    if (!internalSecret || internalHeader !== internalSecret) {
      // Allow from dashboard (admin session)
      const adminSession = request.headers.get('cookie') || '';
      if (!adminSession.includes('next-auth.session-token') && !adminSession.includes('__Secure-next-auth.session-token')) {
        return NextResponse.json({ error: 'Unauthorized — internal or admin access required' }, { status: 401 });
      }
    }

    // Fetch RSS
    if (action === 'fetch') {
      const fetchResult = await fetchSpanishRSSFeeds();
      return NextResponse.json({
        status: 'ok', locale: 'es', version: 'V3', action: 'fetch',
        fetch: fetchResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Process articles
    if (action === 'process') {
      const processResult = await processSpanishArticles(limit);
      return NextResponse.json({
        status: 'ok', locale: 'es', version: 'V3', action: 'process',
        process: processResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Full cycle
    if (action === 'full-cycle') {
      const fetchResult = await fetchSpanishRSSFeeds();
      const processResult = await processSpanishArticles(limit);
      return NextResponse.json({
        status: 'ok', locale: 'es', version: 'V3', action: 'full-cycle',
        fetch: fetchResult,
        process: processResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Reprocess
    if (action === 'reprocess') {
      const processResult = await reprocessSpanishArticles(limit);
      return NextResponse.json({
        status: 'ok', locale: 'es', version: 'V3', action: 'reprocess',
        process: processResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Direct publish (emergency)
    if (action === 'direct-publish') {
      const processResult = await processSpanishArticles(limit);
      return NextResponse.json({
        status: 'ok', locale: 'es', version: 'V3', action: 'direct-publish',
        process: processResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Trigger
    if (action === 'trigger') {
      const triggerResult = await triggerEsPipeline();
      return NextResponse.json({
        status: 'ok', locale: 'es', version: 'V3', action: 'trigger',
        trigger: triggerResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Force-reset stuck/skipped/old articles (matches Arabic reference pipeline)
    if (action === 'force-reset') {
      const resetResult = await strongReset('es', 15);
      return NextResponse.json({
        status: 'ok',
        message: `Force-reset: stuck=${resetResult.resetStuck}, skipped=${resetResult.resetSkipped}, old=${resetResult.resetOld}`,
        ...resetResult,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'unlock') {
      // Reset retry counts for stuck articles
      const { resetStuckRetries } = await import('@/lib/pipeline/queue/job-manager');
      const resetCount = await resetStuckRetries();
      return NextResponse.json({
        status: 'ok',
        message: `Unlocked ${resetCount} Spanish articles`,
        count: resetCount,
        timestamp: new Date().toISOString(),
      });
    }

    // Mark-ready with quota cap (30% cap — matches Arabic reference pipeline)
    if (action === 'mark-ready') {
      const markLimits = await getEsPipelineLimits();
      const markResult = await markReadyWithQuotaCap('es', markLimits.maxDailyEsNews, markLimits.maxHourlyEsNews, ES_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');
      // Also ensure ES orchestrator is running (like Arabic ensureRunning())
      try {
        const { ensureEsRunning } = await import('@/lib/pipeline/es-orchestrator');
        ensureEsRunning();
      } catch { /* non-critical */ }
      return NextResponse.json({
        status: 'ok',
        message: `Marked ${markResult.markedCount} articles as ready, fixed ${markResult.fixedPublishedCount} published flags`,
        ...markResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Reset stuck ES articles at intermediate stages back to 'fetched' for reprocessing
    // V379: Reset HIGH-RETRY ES articles (retryCount >= 15) — permanently excluded from processing
    if (action === 'reset-high-retry') {
      const highRetryReset = await db.newsItem.updateMany({
        where: {
          locale: 'es',
          isReady: false,
          isPublished: false,
          retryCount: { gte: 15 },
        },
        data: {
          retryCount: 0,
          processingStage: 'fetched',
          lastError: null,
        },
      });

      console.log(`[EsCron V379] reset-high-retry: Reset ${highRetryReset.count} ES articles with retryCount>=15 back to fetched`);

      return NextResponse.json({
        status: 'ok',
        action: 'reset-high-retry',
        resetCount: highRetryReset.count,
        message: `Reset ${highRetryReset.count} ES articles with retryCount>=15 back to 'fetched' stage with retryCount=0`,
      });
    }

    if (action === 'reset-stuck') {
      const stuckStages = ['content_loaded', 'translated'];
      const resetResult = await db.newsItem.updateMany({
        where: {
          locale: 'es',
          isReady: false,
          isPublished: false,
          processingStage: { in: stuckStages },
          retryCount: { lt: 15 },
        },
        data: {
          processingStage: 'fetched',
        },
      });

      // Also reset articles at 'analyzed' that have been sitting for >30 min
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const resetAnalyzed = await db.newsItem.updateMany({
        where: {
          locale: 'es',
          isReady: false,
          isPublished: false,
          processingStage: 'analyzed',
          fetchedAt: { lt: thirtyMinAgo },
          retryCount: { lt: 15 },
        },
        data: {
          processingStage: 'fetched',
        },
      });

      return NextResponse.json({
        status: 'ok',
        message: `Reset ${resetResult.count} stuck + ${resetAnalyzed.count} stale analyzed ES articles`,
        resetStuck: resetResult.count,
        resetAnalyzed: resetAnalyzed.count,
        timestamp: new Date().toISOString(),
      });
    }

    // Fix-published: fix isReady=true but isPublished=false with quota enforcement
    // (matches Arabic reference pipeline fix-published action)
    if (action === 'fix-published') {
      const fixLimits = await getEsPipelineLimits();
      const fixNow = new Date();
      const fixHourStart = new Date(fixNow);
      fixHourStart.setUTCMinutes(0, 0, 0);
      const fixResetHour = ES_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
      const fixTodayStart = getTodayStart(fixResetHour);

      // V379: Added newsType: 'live' — only live news counts toward quota
      const fixVisFilter = {
        locale: 'es',
        isReady: true,
        isPublished: true,
        newsType: 'live' as const,
        slug: { not: '' },
        title: { not: '' },
      };

      const [fixPubToday, fixPubThisHour] = await Promise.all([
        db.newsItem.count({ where: { ...fixVisFilter, publishedAt: { gte: fixTodayStart } } }),
        db.newsItem.count({ where: { ...fixVisFilter, publishedAt: { gte: fixHourStart } } }),
      ]);

      const fixRemainingHourly = fixLimits.maxHourlyEsNews > 0
        ? Math.max(0, fixLimits.maxHourlyEsNews - fixPubThisHour) : 999;
      const fixRemainingDaily = fixLimits.maxDailyEsNews > 0
        ? Math.max(0, fixLimits.maxDailyEsNews - fixPubToday) : 999;
      const fixMaxFix = Math.min(fixRemainingHourly, fixRemainingDaily);

      if (fixMaxFix <= 0) {
        return NextResponse.json({
          status: 'ok',
          message: `ES Quota reached — cannot fix-published. Hour: ${fixPubThisHour}/${fixLimits.maxHourlyEsNews}, Day: ${fixPubToday}/${fixLimits.maxDailyEsNews}`,
          count: 0,
          quotaExceeded: true,
          timestamp: new Date().toISOString(),
        });
      }

      const articlesToFix = await db.newsItem.findMany({
        where: {
          isReady: true,
          isPublished: false,
          locale: 'es',
          // V1044: golden rule — must have analysis + image
          aiAnalysis: { contains: 'fullContent' },
          generatedImage: { not: '' },
        },
        select: { id: true, fetchedAt: true },
        take: fixMaxFix,
      });

      let fixedCount = 0;
      if (articlesToFix.length > 0) {
        for (const article of articlesToFix) {
          await db.newsItem.update({
            where: { id: article.id },
            data: { isPublished: true, publishedAt: article.fetchedAt || new Date() },
          });
        }
        fixedCount = articlesToFix.length;

        // Record publishes in quota manager
        try {
          const { recordPublish } = await import('@/lib/pipeline/publish-quota');
          for (let i = 0; i < fixedCount; i++) {
            recordPublish('es');
          }
        } catch { /* non-critical */ }
      }

      return NextResponse.json({
        status: 'ok',
        message: `Fixed ${fixedCount} ES articles (limited by quota: hour=${fixPubThisHour}/${fixLimits.maxHourlyEsNews}, day=${fixPubToday}/${fixLimits.maxDailyEsNews})`,
        count: fixedCount,
        quotaRemaining: { hourly: fixRemainingHourly - fixedCount, daily: fixRemainingDaily - fixedCount },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}. Valid: status, fetch, process, full-cycle, reprocess, direct-publish, mark-ready, force-reset, reset-stuck, fix-published, trigger` }, { status: 400 });
  } catch (error: any) {
    console.error('[EsCron V3] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
