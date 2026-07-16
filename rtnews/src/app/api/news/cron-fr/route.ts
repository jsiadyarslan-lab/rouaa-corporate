// ─── French News Cron API Route V3 ──────────────────────────
// FULL PIPELINE: fetch → AI analysis → image generation → publish
//
// V3 KEY CHANGES (French adaptation of English cron):
// - `process` action: Full pipeline processing for FR articles
//   (fr-processor → imager → publisher) — NO bypasses
// - `full-cycle` action: fetch + process in one call (main cron action)
// - `direct-publish` kept as emergency fast-path ONLY (adds Canvas image)
// - `reprocess` action: Re-processes published articles missing AI analysis/images
// - Removed auto-direct-publish from fetch action
//
// This is an ADDITIVE file — the Arabic and English cron routes are untouched.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FR_PIPELINE_CONFIG, getFrPipelineLimits } from '@/lib/pipeline/fr-pipeline-config';
import { isSvgPlaceholderImage } from '@/lib/image-storage';
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

// ─── French RSS Fetcher ───────────────────────────────────

interface FrFetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;
  errors: number;
  duration: number;
}

/**
 * Fetch articles from French RSS feeds defined in FR_PIPELINE_CONFIG.
 * Saves them to DB with locale: 'fr' and processingStage: 'fetched'.
 */
async function fetchFrenchRSSFeeds(): Promise<FrFetchResult> {
  const startTime = Date.now();
  const result: FrFetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[FR Cron V3] Récupération des flux RSS français...');

    const feeds = FR_PIPELINE_CONFIG.RSS_FEEDS_FR;
    const allItems: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      category: string;
      date: string;
    }> = [];

    // Fetch each feed
    for (const feed of feeds) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': feed.url.includes('sec.gov') ? 'Rouaa News Agent contact@rouaa.com' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
            'Cache-Control': 'no-cache',
          },
          next: { revalidate: 300 },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[FR Cron V3] Flux RSS ${feed.source} a retourné ${response.status}`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSXML(xml, feed.category, feed.source);
        allItems.push(...items);
      } catch (err: any) {
        console.warn(`[FR Cron V3] Échec de récupération de ${feed.source}: ${err.message}`);
        result.errors++;
      }
    }

    if (allItems.length === 0) {
      console.log('[FR Cron V3] Aucun article récupéré des flux RSS français');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[FR Cron V3] ${allItems.length} articles récupérés de ${feeds.length} flux français. Sauvegarde...`);

    // Financial keyword filter (French + English — French sources may use either language)
    // V321: Broadened financial keyword filter — includes French financial terms
    const FINANCIAL_KEYWORDS = [
      // Core financial (English — many French sources use English terms)
      /\bstocks?\b/i, /\bshares?\b/i, /\bmarkets?\b/i, /\btrading?\b/i, /\binvest/i,
      /\beconom/i, /\bfinanc/i, /\bbanks?\b/i, /\brates?\b/i, /\bbonds?\b/i, /\byields?\b/i,
      /\bgdp\b/i, /\binflat/i, /\bfed\b/i, /\bfederal reserve\b/i, /\binterest/i,
      /\bcrypto\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\boil\b/i, /\bgold\b/i,
      /\bdollars?\b/i, /\bcurrenc(?:y|ies)\b/i, /\bforex\b/i, /\brecession\b/i, /\bprofits?\b/i,
      /\brevenue/i, /\bearnings?\b/i, /\bipo\b/i, /\bmergers?\b/i, /\bacquisit/i,
      /\betf\b/i, /\bwall street\b/i, /\bnasdaq\b/i, /\bs&p\b/i, /\bdax\b/i, /\bftse\b/i, /\bcac\s*40\b/i,
      /\btariffs?\b/i, /\btrade/i, /\bimports?\b/i, /\bexports?\b/i,
      /\bmortgages?\b/i, /\bloans?\b/i, /\bdebts?\b/i, /\bdeficits?\b/i,
      /\bfiscal\b/i, /\bmonetary\b/i, /\bcommodit/i, /\bprices?\b/i,
      /\bceo\b/i, /\bcfo\b/i, /\bexecutive/i, /\bcompany\b/i, /\bcorporate/i,
      /\bstartup/i, /\bvaluation/i, /\bfundrais/i, /\bventure/i, /\bcapital/i,
      /\bbankrupt/i, /\blayoffs?\b/i, /\bjobs?\b/i, /\bemployment/i, /\bunemploy/i,
      /\bsupply\s+chain/i, /\bmanufactur/i, /\bproduction/i, /\bconsumer/i,
      /\bretail/i, /\bsales?\b/i, /\boutlook/i, /\bforecast/i, /\bguidance/i,
      /\bshareholder/i, /\bdividend/i, /\bbuyout/i, /\bdeal/i, /\bcontract/i,
      /\bsector\b/i, /\bindustry\b/i, /\bhousing/i, /\bproperty/i, /\breal\s+estate/i,
      /\bgas\b/i, /\benergy\b/i, /\butility/i, /\btech\b/i, /\btechnology\b/i,
      /\bauto\b/i, /\bautomaker/i, /\bairline/i, /\bpharma/i, /\binsurance/i,
      // French financial terms
      /\bactions?\b/i, /\bmarchés?\b/i, /\bcours\b/i, /\bbourse/i, /\bcotation/i,
      /\binvestissement/i, /\binvestir/i, /\bfinanc(?:ier|ière|ières)?\b/i,
      /\béconom(?:ie|ique|iques)?\b/i, /\bbanque/i, /\bbancaire/i,
      /\btaux\b/i, /\bobligations?\b/i, /\brendement/i, /\bintérêts?\b/i,
      /\bpi[bc]/i, /\binflation/i, /\bdéflation/i, /\bcroissance/i,
      /\bchômage/i, /\bemploi/i, /\bemploi\b/i, /\bsalaire/i,
      /\bdevise/i, /\bforex/i, /\bchange/i,
      /\bcrypto/i, /\bbitco[io]n/i, /\bethereum/i,
      /\bpétrole/i, /\bor\b/i, /\bmatières?\s+premières?/i,
      /\bimmobilier/i, /\bpropriété/i, /\blogement/i,
      /\bassurance/i, /\bsanté/i, /\bpharmacie/i,
      /\btechnologie/i, /\bnumérique/i, /\bintelligence\s+artificielle/i,
      /\bpolitique/i, /\bgéopolitique/i, /\bdiplomat/i,
      /\bbudget/i, /\bdéficit/i, /\bdette/i, /\bsurplus/i,
      /\bfusion/i, /\bacquisition/i, /\braison\b/i, /\bOPA/i,
      /\bdividende/i, /\bactionnaire/i, /\bcapital/i,
      /\bbénéfice/i, /\bperte/i, /\bchiffre\s+d'affaires/i, /\bCA\b/i,
      /\bBCE\b/i, /\bBanque\s+Centrale\b/i, /\bFMI\b/i, /\bOPEP/i,
      /\bCAC\s*40/i, /\bSBF\s*120/i, /\bEuronext/i, /\bNIKKEI/i,
      /\bimport/i, /\bexport/i, /\bcommerce/i, /\bbalance\s+commerciale/i,
    ];

    // Save to database
    for (const item of allItems) {
      try {
        if (!item.url || item.url.length < 5) {
          result.errors++;
          continue;
        }

        // Financial keyword filter
        const textToCheck = `${item.title} ${item.summary}`;
        const isFinancial = FINANCIAL_KEYWORDS.some(pattern => pattern.test(textToCheck));
        if (!isFinancial) {
          result.filtered++;
          continue;
        }

        // Locale-aware deduplication: check against French articles only
        const existing = await db.newsItem.findFirst({
          where: { url: item.url, locale: 'fr' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Get category in French from FR_PIPELINE_CONFIG
        const frCategory = FR_PIPELINE_CONFIG.CATEGORY_MAP_FR[item.category] || 'Économie';

        // Generate slug from French title (includes random suffix)
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Simple sentiment analysis (French + English words)
        const positiveWords = ['rise', 'surge', 'gain', 'rally', 'boost', 'jump', 'climb', 'record', 'beat', 'growth', 'profit',
          'hausse', 'progression', 'bond', 'record', 'croissance', 'bénéfice', 'rebond', 'amélioration', 'reprise', 'gains'];
        const negativeWords = ['fall', 'drop', 'decline', 'slide', 'sink', 'crash', 'loss', 'low', 'miss', 'cut', 'recession', 'plunge',
          'baisse', 'chute', 'recul', 'effondrement', 'perte', 'crise', 'déclin', 'récession', 'plongeon', 'dégradation'];
        const lowerText = textToCheck.toLowerCase();
        let posScore = 0, negScore = 0;
        positiveWords.forEach(w => { if (lowerText.includes(w)) posScore += 10; });
        negativeWords.forEach(w => { if (lowerText.includes(w)) negScore += 10; });
        const sentiment = posScore > negScore + 10 ? 'positive' : negScore > posScore + 10 ? 'negative' : 'neutral';
        const sentimentScore = posScore > negScore + 10 ? Math.min(55 + posScore, 95) : negScore > posScore + 10 ? Math.min(55 + negScore, 95) : 55;

        // V3: Use the RSS summary as initial content — fr-processor will enhance it
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
          // V256: P2002 on slug+locale — retry with a fresh slug (new random suffix)
          if (createErr.code === 'P2002') {
            try {
              const retrySlug = generateSlug(item.title); // New random suffix
              await db.newsItem.create({
                data: {
                  title: item.title,
                  summary: item.summary,
                  content: contentFromSummary,
                  source: item.source,
                  sourceName: item.source,
                  url: item.url,
                  isOfficialSource: isOfficialSourceUrl(item.url) || isOfficialSourceName(item.source), // V1070
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
              // Second P2002 = true duplicate
              result.duplicates++;
            }
          } else {
            throw createErr; // Re-throw to outer catch
          }
        }
      } catch (err: any) {
        // Non-P2002 error — log and continue
        result.errors++;
        console.error(`[FR Cron V3] Erreur de sauvegarde "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`[FR Cron V3] Terminé: ${result.fetched} nouveaux, ${result.duplicates} doublons, ${result.filtered} non-financiers filtrés, ${result.errors} erreurs en ${result.duration}ms`);
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[FR Cron V3] Erreur fatale de récupération:', err.message);
    return result;
  }
}

// ─── V3: Full Pipeline Processing for French Articles ────────
// Processes articles through: fr-processor → imager → publisher
// This is the PROPER pipeline — no shortcuts, full quality.

interface FrProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

async function processFrenchArticles(maxArticles: number = 20): Promise<FrProcessResult> {
  const startTime = Date.now();
  const result: FrProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };
  const errorDetails: string[] = []; // V355: Collect error details for debugging

  try {
    // Find French articles that need processing (fetched or content_loaded stage)
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'fr',
        isReady: false,
        isPublished: false,
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
      result.details.push('Aucun article à traiter');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[FR Cron V3] traitement: ${unprocessedArticles.length} articles français à traiter trouvés`);

    // Check FR-specific publish limits
    // V314: Use dynamic limits from DB (admin can change without redeployment)
    const frLimits = await getFrPipelineLimits();
    const maxDaily = frLimits.maxDailyFrNews;
    const maxHourly = frLimits.maxHourlyFrNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(FR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V377: Added newsType: 'live' — quota should ONLY count live news articles
    // (reports/analyses should NOT consume the daily/hourly limit)
    const frPublishedFilter = {
      locale: 'fr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    // V317: Use publishedAt instead of fetchedAt for accurate daily/hourly counts
    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...frPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...frPublishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    console.log(`[FR Cron V3] traitement: Quota — heure: ${publishedThisHour}/${maxHourly}, jour: ${publishedToday}/${maxDaily}`);

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Quota atteint — heure: ${publishedThisHour}/${maxHourly}, jour: ${publishedToday}/${maxDaily}`);
      result.duration = Date.now() - startTime;
      return result;
    }

    // Process each article through the full pipeline
    let publishCount = 0;

    for (const article of unprocessedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unprocessedArticles.length - result.processed;
        result.details.push(`Quota atteint après ${publishCount} articles`);
        break;
      }

      // V358: Live quota re-check every 5 articles — catches concurrent publishing
      // from the FR orchestrator or other cron routes.
      if (publishCount > 0 && publishCount % 5 === 0) {
        try {
          const [liveToday, liveHour] = await Promise.all([
            db.newsItem.count({ where: { ...frPublishedFilter, publishedAt: { gte: todayStart } } }),
            db.newsItem.count({ where: { ...frPublishedFilter, publishedAt: { gte: hourStart } } }),
          ]);
          const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
          const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;
          if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
            console.log(`[FR Cron V358] Vérification quota en direct: limite atteinte (heure=${liveHour}/${maxHourly}, jour=${liveToday}/${maxDaily}). Arrêt après ${publishCount} publiés.`);
            result.skipped += unprocessedArticles.length - result.processed;
            break;
          }
        } catch (reCheckErr: any) {
          console.warn(`[FR Cron V358] Vérification quota en direct échouée: ${reCheckErr.message}`);
        }
      }

      try {
        // V373: Reset skipped articles back to fetched before processing
        if (article.processingStage === 'skipped') {
          await db.newsItem.update({
            where: { id: article.id },
            data: { processingStage: 'fetched', retryCount: 0, lastError: null },
          });
          console.log(`[FR Cron V373] Reset skipped article ${article.id} → fetched for reprocessing`);
        }

        console.log(`[FR Cron V3] Traitement de l'article ${article.id}: "${article.title?.slice(0, 50)}..." (étape: ${article.processingStage})`);

        // Step 0: Load full article content from source URL
        if (article.processingStage === 'fetched') {
          try {
            await runContentLoaderStep(article.id, 'fr');
          } catch (clErr: any) {
            console.warn(`[FR Cron V3] Content loader error for ${article.id}: ${clErr.message}`);
          }
        }

        // ── Step 1: Run fr-processor (AI analysis + content enhancement) ──
        let processorSuccess = false;
        try {
          const { processArticleFr } = await import('@/lib/pipeline/agents/fr-processor');
          const frResult = await processArticleFr(article.id);
          if (frResult.success) {
            processorSuccess = true;
            recordAISuccess('fr');
            console.log(`[FR Cron V3] fr-processor réussi pour ${article.id}: champs=${frResult.fields.join(',')}`);
          } else {
            const errMsg = `fr-processor échoué pour ${article.id}: ${frResult.error}`;
            console.warn(`[FR Cron V3] ${errMsg} — nouvel essai`);
            errorDetails.push(errMsg);
            // Retry once
            const retryResult = await processArticleFr(article.id);
            if (retryResult.success) {
              processorSuccess = true;
              console.log(`[FR Cron V3] fr-processor nouvel essai réussi pour ${article.id}`);
            } else {
              const retryErrMsg = `fr-processor nouvel essai également échoué pour ${article.id}: ${retryResult.error}`;
              console.warn(`[FR Cron V3] ${retryErrMsg}`);
              errorDetails.push(retryErrMsg);
              recordAIFailure('fr');
            }
          }
        } catch (procErr: any) {
          const fatalErrMsg = `fr-processor erreur fatale pour ${article.id}: ${procErr.message}`;
          console.error(`[FR Cron V3] ${fatalErrMsg}`);
          errorDetails.push(fatalErrMsg);
          recordAIFailure('fr');
        }

        if (!processorSuccess) {
          console.log(`[FR Cron V3] fr-processor échoué — tentative d'image Canvas + publication directe pour ${article.id}`);
        }

        // ── Step 2: Run imager (hybrid: ZAI SDK → Pollinations → Canvas/Sharp) ──
        let imageSuccess = false;
        try {
          const { imageArticle } = await import('@/lib/pipeline/agents/imager');
          const imageResult = await imageArticle(article.id);
          if (imageResult.success) {
            imageSuccess = true;
            console.log(`[FR Cron V3] imager réussi pour ${article.id}: source=${imageResult.imageSource}`);
          } else {
            console.warn(`[FR Cron V3] imager échoué pour ${article.id}: ${imageResult.error}`);
          }
        } catch (imgErr: any) {
          console.error(`[FR Cron V3] imager erreur fatale pour ${article.id}: ${imgErr.message}`);
        }

        // ── Step 3: Run publisher (quality validation + publish) ──
        let publishSuccess = false;
        try {
          // Check if article is at 'imaged' stage now
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
              console.log(`[FR Cron V3] ✓ Article ${article.id} PUBLIÉ avec succès`);
            } else {
              console.warn(`[FR Cron V3] éditeur rejeté ${article.id}: ${pubResult.reason}`);
            }
          } else {
            // Article didn't reach imaged stage — try Canvas image fallback + direct publish
            console.log(`[FR Cron V3] Article ${article.id} pas à l'étape 'imaged' — tentative d'image Canvas + publication directe`);

            // Generate Canvas image as guaranteed fallback
            try {
              const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
              const title = updatedArticle?.title || article.title || 'Actualités Financières';

              // Get category from article
              const articleFull = await db.newsItem.findUnique({
                where: { id: article.id },
                select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
              });

              const canvasBuffer = await generateArticleImage({
                title,
                category: articleFull?.categoryId || articleFull?.category || 'economy',
                locale: 'fr',
                newsType: articleFull?.newsType || undefined,
                sentiment: articleFull?.sentiment || undefined,
                source: articleFull?.sourceName || articleFull?.source || undefined,
              });

              if (canvasBuffer && canvasBuffer.length > 500) {
                // Save the Canvas image
                const { uploadImageToR2 } = await import('@/lib/image-storage');
                const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;

                let storedValue: string;
                // Try R2 first
                const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
                if (r2Result.success) {
                  storedValue = r2Result.url;
                } else {
                  storedValue = null;
                }

                // Check if we have minimum content for publishing
                const hasContent = (updatedArticle?.content && updatedArticle.content.length >= 200);
                const hasAnalysis = (updatedArticle?.aiAnalysis && updatedArticle.aiAnalysis.length > 50);

                if (hasContent && hasAnalysis) {
                  // Full quality — use publisher
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
                    console.log(`[FR Cron V3] ✓ Article ${article.id} PUBLIÉ avec image Canvas via éditeur`);

                    // V312: Submit Stable Horde in background for AI image replacement
                    try {
                      const { submitToStableHordeBackground } = await import('@/lib/pipeline/agents/imager');
                      const articleFull = await db.newsItem.findUnique({ where: { id: article.id } });
                      if (articleFull) {
                        submitToStableHordeBackground(article.id, articleFull).catch(err => {
                          console.warn(`[FR Cron V3] Soumission Horde en arrière-plan échouée pour ${article.id}: ${err?.message?.slice(0, 80)}`);
                        });
                      }
                    } catch (hordeErr: any) {
                      console.warn(`[FR Cron V3] Import Horde échoué pour ${article.id}: ${hordeErr.message?.slice(0, 80)}`);
                    }
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

                  console.warn(`[FR Cron V1064] Article ${article.id}: image enregistrée mais NON publiée — ${!hasContent ? 'contenu' : 'analyse'} manquant. Réessai au prochain cycle.`);
                }
              }
            } catch (canvasErr: any) {
              console.error(`[FR Cron V3] Image Canvas de secours échouée pour ${article.id}: ${canvasErr.message}`);
            }
          }
        } catch (pubErr: any) {
          console.error(`[FR Cron V3] Erreur éditeur pour ${article.id}: ${pubErr.message}`);
        }

        if (publishSuccess) {
          result.processed++;
        } else if (processorSuccess || imageSuccess) {
          // Partial progress — will be retried next cycle
          result.processed++;
          result.failed++;
        } else {
          result.failed++;
        }

      } catch (err: any) {
        result.failed++;
        console.error(`[FR Cron V3] Erreur de traitement de l'article ${article.id}: ${err.message}`);
        // Record error in DB for retry tracking
        try {
          const { recordError } = await import('@/lib/pipeline/queue/job-manager');
          await recordError(article.id, `FR pipeline error: ${err.message}`);
        } catch { /* non-critical */ }
      }
    }

    result.details.push(`Traités: ${result.processed}, Publiés: ${result.published}, Échoués: ${result.failed}, Ignorés: ${result.skipped}`);
    // V355: Include error details in response for debugging
    if (errorDetails.length > 0) {
      result.details.push(...errorDetails.slice(0, 10)); // Max 10 error details
    }
    // V372: Also log each article's processing result for debugging
    console.log(`[FR Cron V3] traitement terminé: ${result.details.join(' | ')}`);
    if (errorDetails.length > 0) {
      console.log(`[FR Cron V372] Error details: ${errorDetails.join(' | ')}`);
    }
  } catch (err: any) {
    result.failed++;
    result.details.push(`Erreur fatale: ${err.message}`);
    console.error(`[FR Cron V3] Erreur fatale de traitement: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── V3: Reprocess published articles missing AI analysis/images ──
// Finds already-published FR articles that lack aiAnalysis or generatedImage
// and re-processes them through the full pipeline.

async function reprocessFrenchArticles(maxArticles: number = 5): Promise<FrProcessResult> {
  const startTime = Date.now();
  const result: FrProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };

  try {
    // Find published FR articles missing AI analysis or generated image
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
      select: {
        id: true,
        title: true,
        aiAnalysis: true,
        processingStage: true,
      },
      take: maxArticles * 3,
    });

    // EGRESS FIX: simplified filter — where clause already ensures null/empty generatedImage is caught
    // SVG placeholder detection is handled by auto-migrate
    const incompleteArticles = candidateArticles.filter((a: any) => {
      const hasAnalysis = a.aiAnalysis && a.aiAnalysis.length >= 50;
      // Articles with null/empty generatedImage are already caught by the OR where clause
      return !hasAnalysis;
    }).slice(0, maxArticles);

    if (incompleteArticles.length === 0) {
      result.details.push('Aucun article incomplet à retraiter');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[FR Cron V3] retraitement: ${incompleteArticles.length} articles FR publiés manquant analyse/images trouvés`);

    for (const article of incompleteArticles) {
      try {
        const needsAnalysis = !article.aiAnalysis || article.aiAnalysis.length < 50;
        // EGRESS FIX: use processingStage instead of generatedImage to determine if image is needed
        const needsImage = article.processingStage !== 'imaged';

        console.log(`[FR Cron V3] Retraitement de ${article.id}: needsAnalysis=${needsAnalysis}, needsImage=${needsImage}`);

        // Step 1: Re-run fr-processor if missing analysis
        if (needsAnalysis) {
          try {
            const { processArticleFr } = await import('@/lib/pipeline/agents/fr-processor');
            const frResult = await processArticleFr(article.id);
            if (frResult.success) {
              console.log(`[FR Cron V3] retraitement: fr-processor réussi pour ${article.id}`);
            } else {
              console.warn(`[FR Cron V3] retraitement: fr-processor échoué pour ${article.id}: ${frResult.error}`);
            }
          } catch (procErr: any) {
            console.warn(`[FR Cron V3] retraitement: erreur fr-processor pour ${article.id}: ${procErr.message}`);
          }
        }

        // Step 2: Re-run imager if missing image
        if (needsImage) {
          try {
            // Reset to 'analyzed' stage so imager picks it up
            await db.newsItem.update({
              where: { id: article.id },
              data: { generatedImage: null, processingStage: 'analyzed' },
            });
            const { imageArticle } = await import('@/lib/pipeline/agents/imager');
            const imgResult = await imageArticle(article.id);
            if (imgResult.success) {
              console.log(`[FR Cron V3] retraitement: imager réussi pour ${article.id}: source=${imgResult.imageSource}`);
            } else {
              // Canvas fallback
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
                  console.log(`[FR Cron V3] retraitement: Image Canvas sauvegardée pour ${article.id}`);
                }
              } catch (canvasErr: any) {
                console.warn(`[FR Cron V3] retraitement: Canvas de secours échoué pour ${article.id}: ${canvasErr.message}`);
              }
            }
          } catch (imgErr: any) {
            console.warn(`[FR Cron V3] retraitement: erreur imager pour ${article.id}: ${imgErr.message}`);
          }
        }

        // Update imageUrl to point to generatedImage
        // EGRESS FIX: always use API route for imageUrl instead of pulling base64 generatedImage
        await db.newsItem.update({
          where: { id: article.id },
          data: {
            imageUrl: `/api/article-image/${article.id}`,
          },
        });

        result.processed++;
        result.published++; // Already published, just enhanced
      } catch (err: any) {
        result.failed++;
        console.error(`[FR Cron V3] Erreur de retraitement pour ${article.id}: ${err.message}`);
      }
    }

    result.details.push(`Retraités: ${result.processed}, Améliorés: ${result.published}, Échoués: ${result.failed}`);
    console.log(`[FR Cron V3] retraitement terminé: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Erreur fatale: ${err.message}`);
    console.error(`[FR Cron V3] Erreur fatale de retraitement: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── French Pipeline Trigger ───────────────────────────────

async function triggerFrPipeline(): Promise<{ message: string; orchestrator: any }> {
  try {
    const { ensureFrRunning } = await import('@/lib/pipeline/fr-orchestrator');
    const result = ensureFrRunning();
    const { getFrOrchestratorStats } = await import('@/lib/pipeline/fr-orchestrator');
    const stats = await getFrOrchestratorStats();

    return {
      message: result?.restarted ? 'Pipeline français redémarré (était arrêté ou en attente)' : 'Pipeline français déjà en cours',
      orchestrator: stats,
    };
  } catch (err: any) {
    // fr-orchestrator may not exist yet — return gracefully
    return {
      message: `Orchestrateur FR non disponible: ${err.message}`,
      orchestrator: null,
    };
  }
}

// ─── V2 Legacy: Direct Publish (emergency fast-path only) ────
// Adds Canvas/Sharp image for guaranteed visual quality.
// Use ONLY for breaking news when AI processing is down.

async function directPublishFrench(): Promise<{
  published: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const result = { published: 0, skipped: 0, errors: 0, details: [] as string[] };

  try {
    const unpublishedArticles = await db.newsItem.findMany({
      where: {
        locale: 'fr',
        isReady: false,
        isPublished: false,
        title: { not: '' },
        slug: { not: '' },
      },
      orderBy: { fetchedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        slug: true,
        category: true,
        categoryId: true,
        newsType: true,
        sentiment: true,
        sourceName: true,
        source: true,
        fetchedAt: true,
      },
      take: 50,
    });

    console.log(`[FR Cron V3] publication-directe: ${unpublishedArticles.length} articles français non publiés trouvés`);

    // V314: Use dynamic limits from DB
    const frDirectLimits = await getFrPipelineLimits();
    const maxDaily = frDirectLimits.maxDailyFrNews;
    const maxHourly = frDirectLimits.maxHourlyFrNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(FR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V377: Added newsType: 'live' — quota should ONLY count live news articles
    const frVisibilityFilter = {
      locale: 'fr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    // V317: Use publishedAt instead of fetchedAt for accurate counts
    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...frVisibilityFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...frVisibilityFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    let publishCount = 0;
    const ARABIC_REGEX = /[\u0600-\u06FF]/;

    for (const article of unpublishedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unpublishedArticles.length - publishCount;
        result.details.push(`Quota atteint après ${publishCount} articles`);
        break;
      }

      // V358: Live quota re-check every 5 articles
      if (publishCount > 0 && publishCount % 5 === 0) {
        try {
          const [liveToday, liveHour] = await Promise.all([
            db.newsItem.count({ where: { ...frVisibilityFilter, publishedAt: { gte: todayStart } } }),
            db.newsItem.count({ where: { ...frVisibilityFilter, publishedAt: { gte: hourStart } } }),
          ]);
          const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
          const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;
          if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
            console.log(`[FR Cron V358] publication-directe: Vérification quota: limite atteinte (heure=${liveHour}/${maxHourly}, jour=${liveToday}/${maxDaily}). Arrêt après ${publishCount} publiés.`);
            result.skipped += unpublishedArticles.length - publishCount;
            result.details.push(`Quota atteint après ${publishCount} articles (vérification en direct)`);
            break;
          }
        } catch (reCheckErr: any) {
          console.warn(`[FR Cron V358] publication-directe: Vérification quota échouée: ${reCheckErr.message}`);
        }
      }

      const hasFrenchTitle = !!(
        article.title &&
        article.title.length > 5 &&
        /[a-zA-Zàâäéèêëïîôùûüÿçœæ]/.test(article.title) &&
        !ARABIC_REGEX.test(article.title)
      );

      if (!hasFrenchTitle || !article.slug || article.slug.length < 2) {
        result.skipped++;
        continue;
      }

      const hasContent = !!(
        (article.summary && article.summary.length > 5) ||
        (article.content && article.content.length > 20)
      );

      if (!hasContent) {
        result.skipped++;
        continue;
      }

      try {
        // V3: Generate Canvas/Sharp image as guaranteed fallback
        let generatedImage: string | null = null;
        try {
          const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
          const canvasBuffer = await generateArticleImage({
            title: article.title,
            category: article.categoryId || article.category || 'economy',
            locale: 'fr',
            newsType: article.newsType || undefined,
            sentiment: article.sentiment || undefined,
            source: article.sourceName || article.source || undefined,
          });

          if (canvasBuffer && canvasBuffer.length > 500) {
            const { uploadImageToR2 } = await import('@/lib/image-storage');
            const base64DataUrl = `data:image/jpeg;base64,${canvasBuffer.toString('base64')}`;
            const r2Result = await uploadImageToR2(article.id, canvasBuffer, 'image/jpeg');
            generatedImage = r2Result.success ? r2Result.url : null;
          }
        } catch (canvasErr: any) {
          console.warn(`[FR Cron V3] publication-directe: Image Canvas échouée pour ${article.id}: ${canvasErr.message}`);
        }

        // V361: Check quota BEFORE direct publish
        try {
          const { canPublish } = await import('@/lib/pipeline/publish-quota');
          const quotaCheck = await canPublish('fr');
          if (!quotaCheck.allowed) {
            console.warn(`[FR Cron V361] publication-directe BLOQUÉE par quota pour ${article.id}: ${quotaCheck.reason}`);
            result.skipped++;
            continue;
          }
        } catch { /* fail-open */ }

        await db.newsItem.update({
          where: { id: article.id },
          data: {
            isReady: true,
            isPublished: true,
            processingStage: 'imaged',
            publishedAt: article.fetchedAt || new Date(), // Use fetchedAt for accurate quota counting
            generatedImage: generatedImage,
            imageUrl: generatedImage
              ? (generatedImage.startsWith('http') ? generatedImage : `/api/article-image/${article.id}`)
              : `https://image.pollinations.ai/prompt/${encodeURIComponent(article.title.slice(0, 60))}%20actualités%20financières?width=1200&height=675&nologo=true&seed=${article.id.slice(0, 8)}&model=flux`,
          },
        });

        // V361: Record publish in quota manager
        try {
          const { recordPublish } = await import('@/lib/pipeline/publish-quota');
          recordPublish('fr');
        } catch { /* non-critical */ }

        publishCount++;
        result.published++;

        // V312: Submit Stable Horde in background for AI image replacement
        if (generatedImage) {
          try {
            const { submitToStableHordeBackground } = await import('@/lib/pipeline/agents/imager');
            submitToStableHordeBackground(article.id, article).catch(err => {
              console.warn(`[FR Cron V3] publication-directe: Soumission Horde en arrière-plan échouée pour ${article.id}: ${err?.message?.slice(0, 80)}`);
            });
          } catch { /* non-critical */ }
        }
      } catch (pubErr: any) {
        result.errors++;
        console.error(`[FR Cron V3] publication-directe: Erreur pour ${article.id}: ${pubErr.message}`);
      }
    }

    result.details.push(`${result.published} publiés, ${result.skipped} ignorés, ${result.errors} erreurs`);
  } catch (err: any) {
    result.errors++;
    result.details.push(`Erreur fatale: ${err.message}`);
    console.error(`[FR Cron V3] publication-directe erreur fatale: ${err.message}`);
  }

  return result;
}

// ─── Main Handler ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    switch (action) {
      case 'status': {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        // V376: Visibility filter MUST match the frontend news page filter.
        const frVisFilter = {
          locale: 'fr' as const,
          isReady: true,
          isPublished: true,
          newsType: 'live' as const,
          slug: { not: '' },
          title: { not: '' },
        };

        const frLimits = await getFrPipelineLimits();

        const [frReady, frPublished, frPublishedToday, frPending, frPublishedThisHour, frFetched, frWithoutImageRaw, frStuckHighRetry, frByStage] = await Promise.all([
          db.newsItem.count({ where: { locale: 'fr', isReady: true } }),
          // V376: Use visibility filter for published counts — matches frontend
          db.newsItem.count({ where: frVisFilter }),
          db.newsItem.count({ where: { ...frVisFilter, publishedAt: { gte: todayStart } } }),
          db.newsItem.count({ where: { locale: 'fr', isReady: false, retryCount: { lt: 15 } } }),
          db.newsItem.count({ where: { ...frVisFilter, publishedAt: { gte: oneHourAgo } } }),
          db.newsItem.count({ where: { locale: 'fr', isReady: false, processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped'] } } }),
          // EGRESS FIX: use count instead of findMany with generatedImage select
          db.newsItem.count({
            where: { locale: 'fr', isReady: true, isPublished: true, OR: [{ generatedImage: null }, { generatedImage: '' }] },
          }),
          // V378: Count stuck articles (retryCount >= 15) — diagnostic
          db.newsItem.count({ where: { locale: 'fr', isReady: false, isPublished: false, retryCount: { gte: 15 } } }),
          // V378: Breakdown by processing stage — diagnostic
          db.newsItem.groupBy({ by: ['processingStage'], where: { locale: 'fr', isReady: false, isPublished: false }, _count: { id: true } }),
        ]);
        const frWithoutImage = frWithoutImageRaw;

        // V378: Build stage breakdown for diagnostics
        const frStageBreakdown: Record<string, number> = {};
        for (const row of frByStage) {
          frStageBreakdown[row.processingStage || 'unknown'] = row._count.id;
        }

        // V378: Quota diagnostic info
        const frRemainingDaily = frLimits.maxDailyFrNews > 0 ? Math.max(0, frLimits.maxDailyFrNews - frPublishedToday) : 999;
        const frRemainingHourly = frLimits.maxHourlyFrNews > 0 ? Math.max(0, frLimits.maxHourlyFrNews - frPublishedThisHour) : 999;

        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          pipeline: {
            totalReady: frReady,
            totalPublished: frPublished,
            publishedToday: frPublishedToday,
            publishedThisHour: frPublishedThisHour,
            pending: frPending,
            awaitingProcessing: frFetched,
            publishedWithoutImage: frWithoutImage,
            stuckHighRetry: frStuckHighRetry,
            stageBreakdown: frStageBreakdown,
            limits: {
              maxDaily: frLimits.maxDailyFrNews,
              maxHourly: frLimits.maxHourlyFrNews,
              remainingDaily: frRemainingDaily,
              remainingHourly: frRemainingHourly,
              dailyQuotaReached: frRemainingDaily <= 0,
              hourlyQuotaReached: frRemainingHourly <= 0,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'full-cycle': {
        // V3 MAIN ACTION: fetch → process → publish (full pipeline)
        const fetchResult = await fetchFrenchRSSFeeds();
        const processResult = await processFrenchArticles(limit);
        const reprocessResult = await reprocessFrenchArticles(5);

        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          version: 'V3',
          fetch: fetchResult,
          process: processResult,
          reprocess: reprocessResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'fetch': {
        const fetchResult = await fetchFrenchRSSFeeds();
        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          fetch: fetchResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'process': {
        const processResult = await processFrenchArticles(limit);
        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          process: processResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'reprocess': {
        const reprocessResult = await reprocessFrenchArticles(limit);
        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          reprocess: reprocessResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'direct-publish': {
        const publishResult = await directPublishFrench();
        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          publish: publishResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'mark-ready': {
        const markLimits = await getFrPipelineLimits();
        const markResult = await markReadyWithQuotaCap('fr', markLimits.maxDailyFrNews, markLimits.maxHourlyFrNews, FR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');

        // Step 3: Auto-start orchestrator if not running (like Arabic pipeline)
        try {
          const { ensureFrRunning } = await import('@/lib/pipeline/fr-orchestrator');
          const orchResult = ensureFrRunning();
          if (orchResult?.restarted) {
            console.log(`[FR Cron V52] mark-ready: FR orchestrator ${orchResult.wasStale ? 'was STALE — force-restarted' : 'was NOT running — started'}`);
          }
        } catch { /* non-critical */ }

        return NextResponse.json({
          status: 'ok',
          message: `Marked ${markResult.markedCount} articles as ready, fixed ${markResult.fixedPublishedCount} published flags`,
          ...markResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'force-reset': {
        const resetResult = await strongReset('fr', 15);
        return NextResponse.json({
          status: 'ok',
          message: `Force-reset: stuck=${resetResult.resetStuck}, skipped=${resetResult.resetSkipped}, old=${resetResult.resetOld}`,
          ...resetResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'unlock': {
        // Reset retry counts for stuck articles
        const { resetStuckRetries } = await import('@/lib/pipeline/queue/job-manager');
        const resetCount = await resetStuckRetries();
        return NextResponse.json({
          status: 'ok',
          message: `Unlocked ${resetCount} French articles`,
          count: resetCount,
          timestamp: new Date().toISOString(),
        });
      }

      case 'fix-published': {
        // Fix articles with isReady=true but isPublished=false
        const fixLimits = await getFrPipelineLimits();
        const fixNow = new Date();
        const fixHourStart = new Date(fixNow);
        fixHourStart.setUTCMinutes(0, 0, 0);
        const fixResetHour = FR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
        const fixTodayStart = getTodayStart(fixResetHour);

        // V379: Added newsType: 'live' — only live news counts toward quota
        const fixVisFilter = {
          locale: 'fr',
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

        const fixRemainingHourly = fixLimits.maxHourlyFrNews > 0
          ? Math.max(0, fixLimits.maxHourlyFrNews - fixPubThisHour) : 999;
        const fixRemainingDaily = fixLimits.maxDailyFrNews > 0
          ? Math.max(0, fixLimits.maxDailyFrNews - fixPubToday) : 999;
        const fixMaxToFix = Math.min(fixRemainingHourly, fixRemainingDaily);

        if (fixMaxToFix <= 0) {
          return NextResponse.json({
            status: 'ok',
            message: `Quota reached — cannot fix-published. Hour: ${fixPubThisHour}/${fixLimits.maxHourlyFrNews}, Day: ${fixPubToday}/${fixLimits.maxDailyFrNews}`,
            count: 0,
            quotaExceeded: true,
            timestamp: new Date().toISOString(),
          });
        }

        const articlesToFix = await db.newsItem.findMany({
          where: {
            isReady: true,
            isPublished: false,
            locale: 'fr',
            // V1044: golden rule — must have analysis + image
            aiAnalysis: { contains: 'fullContent' },
            generatedImage: { not: '' },
          },
          select: { id: true, fetchedAt: true },
          take: fixMaxToFix,
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
          try {
            const { recordPublish } = await import('@/lib/pipeline/publish-quota');
            for (let i = 0; i < fixedCount; i++) {
              recordPublish('fr');
            }
          } catch { /* non-critical */ }
        }

        return NextResponse.json({
          status: 'ok',
          message: `Fixed ${fixedCount} French articles (limited by quota: hour=${fixPubThisHour}/${fixLimits.maxHourlyFrNews}, day=${fixPubToday}/${fixLimits.maxDailyFrNews})`,
          count: fixedCount,
          quotaRemaining: { hourly: fixRemainingHourly - fixedCount, daily: fixRemainingDaily - fixedCount },
          timestamp: new Date().toISOString(),
        });
      }

      // V379: Reset HIGH-RETRY FR articles (retryCount >= 15) — permanently excluded from processing
      case 'reset-high-retry': {
        const highRetryReset = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
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

        console.log(`[FrCron V379] reset-high-retry: Reset ${highRetryReset.count} FR articles with retryCount>=15 back to fetched`);

        return NextResponse.json({
          status: 'ok',
          action: 'reset-high-retry',
          resetCount: highRetryReset.count,
          message: `Reset ${highRetryReset.count} FR articles with retryCount>=15 back to 'fetched' stage with retryCount=0`,
        });
      }

      case 'reset-stuck': {
        const stuckStages = ['content_loaded', 'translated'];
        const resetResult = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isReady: false,
            isPublished: false,
            processingStage: { in: stuckStages },
            retryCount: { lt: 15 },
          },
          data: {
            processingStage: 'fetched',
          },
        });

        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
        const resetAnalyzed = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isReady: false,
            isPublished: false,
            processingStage: 'analyzed',
            retryCount: { lt: 15 },
            fetchedAt: { lt: thirtyMinAgo },
          },
          data: {
            processingStage: 'fetched',
          },
        });

        console.log(`[FR Cron V317] reset-stuck: Réinitialisé ${resetResult.count} articles de content_loaded/translated, ${resetAnalyzed.count} de analyzed`);

        return NextResponse.json({
          status: 'ok',
          action: 'reset-stuck',
          resetFromIntermediate: resetResult.count,
          resetFromAnalyzed: resetAnalyzed.count,
          total: resetResult.count + resetAnalyzed.count,
          message: `${resetResult.count + resetAnalyzed.count} articles bloqués réinitialisés à 'fetched' pour retraitement`,
        });
      }

      // V373: Reset ALL non-processable French articles back to 'fetched' for reprocessing.
      // This includes skipped, analyzed (stale), and high retryCount articles.
      // Also fixes the isPublished=true but isReady=false inconsistency.
      // Use when the pipeline is stuck and articles aren't being published.
      case 'reset-skipped-full': {
        console.log('[FR Cron V373] Resetting ALL non-processable French articles...');

        // V373: First, diagnose — what stages are the pending articles in?
        const stageDistribution = await db.newsItem.groupBy({
          by: ['processingStage', 'isReady', 'isPublished'],
          where: { locale: 'fr' },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        });
        console.log('[FR Cron V373] Full stage/state distribution:', JSON.stringify(stageDistribution));

        // 1. Reset skipped articles (the biggest group — AI rejected them)
        const resetSkipped = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isReady: false,
            isPublished: false,
            processingStage: 'skipped',
          },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            rejectCount: 0,
            lastError: null,
          },
        });

        // 2. Reset stale analyzed articles (no image generated) — V372: removed time constraint
        const resetAnalyzedStale = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isReady: false,
            isPublished: false,
            processingStage: 'analyzed',
          },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
          },
        });

        // 3. Reset content_loaded/translated
        const resetIntermediate = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isReady: false,
            isPublished: false,
            processingStage: { in: ['content_loaded', 'translated'] },
          },
          data: {
            processingStage: 'fetched',
          },
        });

        // 4. Reset high retryCount articles (give them another chance)
        const resetHighRetry = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isReady: false,
            isPublished: false,
            retryCount: { gte: 15 },
            processingStage: { not: 'imaged' },
          },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            rejectCount: 0,
            lastError: null,
          },
        });

        // V372: Reset "imaged" articles that are stuck (have image but not published)
        const resetImaged = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isReady: false,
            isPublished: false,
            processingStage: 'imaged',
          },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
          },
        });

        // V373: Fix inconsistent state — isPublished=true but isReady=false
        // These articles were directly published (degraded mode) but never marked ready
        const fixPublishedNotReady = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isPublished: true,
            isReady: false,
          },
          data: {
            isReady: true,
          },
        });

        // V373: Fix articles with isPublished=true but missing publishedAt
        const fixMissingPublishedAt = await db.newsItem.updateMany({
          where: {
            locale: 'fr',
            isPublished: true,
            publishedAt: null,
          },
          data: {
            publishedAt: new Date(),
          },
        });

        const total = resetSkipped.count + resetAnalyzedStale.count + resetIntermediate.count + resetHighRetry.count + resetImaged.count + fixPublishedNotReady.count;
        console.log(`[FR Cron V373] Full reset: skipped=${resetSkipped.count}, analyzed=${resetAnalyzedStale.count}, intermediate=${resetIntermediate.count}, highRetry=${resetHighRetry.count}, imaged=${resetImaged.count}, publishedNotReady=${fixPublishedNotReady.count}, total=${total}`);

        // Now trigger processing
        const processResult = await processFrenchArticles(20);

        return NextResponse.json({
          status: 'ok',
          action: 'reset-skipped-full',
          version: 'V373',
          reset: {
            skipped: resetSkipped.count,
            analyzedStale: resetAnalyzedStale.count,
            intermediate: resetIntermediate.count,
            highRetry: resetHighRetry.count,
            imaged: resetImaged.count,
            publishedNotReady: fixPublishedNotReady.count,
            missingPublishedAt: fixMissingPublishedAt.count,
            total,
          },
          stageDistribution: stageDistribution.map((s: any) => ({
            stage: s.processingStage,
            ready: s.isReady,
            published: s.isPublished,
            count: s._count.id,
          })),
          process: processResult,
          message: `${total} articles réinitialisés à 'fetched'. Traitement: ${processResult.published} publiés, ${processResult.failed} échoués sur ${processResult.processed} traités`,
          timestamp: new Date().toISOString(),
        });
      }

      case 'test': {
        const [frTotal, frReady, frPublished, frPending, frFetched] = await Promise.all([
          db.newsItem.count({ where: { locale: 'fr' } }),
          db.newsItem.count({ where: { locale: 'fr', isReady: true } }),
          db.newsItem.count({ where: { locale: 'fr', isReady: true, isPublished: true } }),
          db.newsItem.count({ where: { locale: 'fr', isReady: false, retryCount: { lt: 15 } } }),
          db.newsItem.count({ where: { locale: 'fr', isReady: false, processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped'] } } }),
        ]);

        // V373: Diagnostic — stage distribution for ALL FR articles
        const stageDistributionAll = await db.newsItem.groupBy({
          by: ['processingStage'],
          where: { locale: 'fr' },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        });

        // V373: Diagnostic — isPublished=true but isReady=false (inconsistent state)
        const publishedNotReady = await db.newsItem.count({
          where: { locale: 'fr', isPublished: true, isReady: false },
        });

        let canvasTest: { success: boolean; sizeBytes: number; durationMs: number; error?: string } = { success: false, sizeBytes: 0, durationMs: 0, error: 'not tested' };
        try {
          const { testTemplateEngine } = await import('@/lib/image-templates/template-engine');
          canvasTest = await testTemplateEngine();
        } catch (err: any) {
          canvasTest.error = err.message;
        }

        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          version: 'V373',
          stats: {
            total: frTotal,
            ready: frReady,
            published: frPublished,
            pending: frPending,
            fetched: frFetched,
            publishedNotReady,
          },
          stageDistribution: stageDistributionAll.map((s: any) => ({ stage: s.processingStage, count: s._count.id })),
          canvasTest,
          config: {
            maxDaily: (await getFrPipelineLimits()).maxDailyFrNews,
            maxHourly: (await getFrPipelineLimits()).maxHourlyFrNews,
            minFrenchRatio: FR_PIPELINE_CONFIG.MIN_FRENCH_RATIO,
            rssFeeds: FR_PIPELINE_CONFIG.RSS_FEEDS_FR.length,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'trigger':
      case 'monitor': {
        const monitorResult = await triggerFrPipeline();
        const frPipelineStatus = await (async () => {
          try {
            const [frReady, frPublished, frPending] = await Promise.all([
              db.newsItem.count({ where: { locale: 'fr', isReady: true } }),
              // V376: Use visibility filter matching frontend
              db.newsItem.count({ where: { locale: 'fr', isReady: true, isPublished: true, newsType: 'live', slug: { not: '' }, title: { not: '' } } }),
              db.newsItem.count({ where: { locale: 'fr', isReady: false, retryCount: { lt: 15 } } }),
            ]);
            return { totalReady: frReady, totalPublished: frPublished, pending: frPending };
          } catch {
            return null;
          }
        })();
        return NextResponse.json({
          status: 'ok',
          locale: 'fr',
          action: 'monitor',
          pipeline: monitorResult,
          stats: frPipelineStatus,
          timestamp: new Date().toISOString(),
        });
      }

      case 'start-orchestrator': {
        try {
          const { startFrOrchestrator, getFrOrchestratorStats } = await import('@/lib/pipeline/fr-orchestrator');
          startFrOrchestrator();
          const stats = await getFrOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'fr',
            message: 'Orchestrateur français démarré',
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Échec du démarrage de l'orchestrateur FR: ${err.message}`,
          }, { status: 500 });
        }
      }

      case 'stop-orchestrator': {
        try {
          const { stopFrOrchestrator, getFrOrchestratorStats } = await import('@/lib/pipeline/fr-orchestrator');
          stopFrOrchestrator();
          const stats = await getFrOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'fr',
            message: 'Orchestrateur français arrêté',
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Échec de l'arrêt de l'orchestrateur FR: ${err.message}`,
          }, { status: 500 });
        }
      }

      case 'orchestrator-status': {
        try {
          const { getFrOrchestratorStats } = await import('@/lib/pipeline/fr-orchestrator');
          const stats = await getFrOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'fr',
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Échec de l'obtention du statut de l'orchestrateur FR: ${err.message}`,
          }, { status: 500 });
        }
      }

      case 'ensure-orchestrator': {
        try {
          const { ensureFrRunning, getFrOrchestratorStats } = await import('@/lib/pipeline/fr-orchestrator');
          const result = ensureFrRunning();
          const stats = await getFrOrchestratorStats();
          return NextResponse.json({
            status: 'ok',
            locale: 'fr',
            message: result.restarted
              ? `Orchestrateur français redémarré (${result.wasStale ? 'était en attente' : 'était arrêté'})`
              : 'Orchestrateur français déjà en cours',
            wasRunning: result.wasRunning,
            wasStale: result.wasStale,
            restarted: result.restarted,
            orchestrator: stats,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          return NextResponse.json({
            status: 'error',
            error: `Échec de la vérification de l'orchestrateur FR: ${err.message}`,
          }, { status: 500 });
        }
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Action inconnue: ${action}. Actions valides: status, full-cycle, fetch, process, reprocess, direct-publish, mark-ready, force-reset, reset-stuck, reset-skipped-full, test, monitor, start-orchestrator, stop-orchestrator, orchestrator-status, ensure-orchestrator`,
        }, { status: 400 });
      }
    }
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message,
    }, { status: 500 });
  }
}
