// ─── Turkish News Cron API Route V3 ──────────────────────────
// FULL PIPELINE: fetch → AI analysis → image generation → publish
//
// Turkish adaptation of the French cron route.
// - `process` action: Full pipeline processing for TR articles
//   (tr-processor → imager → publisher) — NO bypasses
// - `full-cycle` action: fetch + process in one call (main cron action)
// - `direct-publish` kept as emergency fast-path ONLY (adds Canvas image)
// - `reprocess` action: Re-processes published articles missing AI analysis/images
//
// This is an ADDITIVE file — the Arabic, English and French cron routes are untouched.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TR_PIPELINE_CONFIG, getTrPipelineLimits } from '@/lib/pipeline/tr-pipeline-config';
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

// ─── Turkish RSS Fetcher ───────────────────────────────────

interface TrFetchResult {
  fetched: number;
  duplicates: number;
  filtered: number;
  errors: number;
  duration: number;
}

/**
 * Fetch articles from Turkish RSS feeds defined in TR_PIPELINE_CONFIG.
 * Saves them to DB with locale: 'tr' and processingStage: 'fetched'.
 */
async function fetchTurkishRSSFeeds(): Promise<TrFetchResult> {
  const startTime = Date.now();
  const result: TrFetchResult = { fetched: 0, duplicates: 0, filtered: 0, errors: 0, duration: 0 };

  try {
    console.log('[TR Cron V3] Türk RSS akışları alınıyor...');

    const feeds = TR_PIPELINE_CONFIG.RSS_FEEDS_TR;
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
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.5',
            'Cache-Control': 'no-cache',
          },
          next: { revalidate: 300 },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[TR Cron V3] RSS akışı ${feed.source} ${response.status} döndürdü`);
          continue;
        }

        const xml = await response.text();
        const items = parseRSSXML(xml, feed.category, feed.source);
        allItems.push(...items);
      } catch (err: any) {
        console.warn(`[TR Cron V3] ${feed.source} akışı alınamadı: ${err.message}`);
        result.errors++;
      }
    }

    if (allItems.length === 0) {
      console.log('[TR Cron V3] Türk RSS akışlarından hiçbir makale alınamadı');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[TR Cron V3] ${feeds.length} Türk akışından ${allItems.length} makale alındı. Kaydediliyor...`);

    // Financial keyword filter (Turkish + English — Turkish sources may use either language)
    const FINANCIAL_KEYWORDS = [
      // Core financial (English — many Turkish sources use English terms)
      /\bstocks?\b/i, /\bshares?\b/i, /\bmarkets?\b/i, /\btrading?\b/i, /\binvest/i,
      /\beconom/i, /\bfinanc/i, /\bbanks?\b/i, /\brates?\b/i, /\bbonds?\b/i, /\byields?\b/i,
      /\bgdp\b/i, /\binflat/i, /\bfed\b/i, /\bfederal reserve\b/i, /\binterest/i,
      /\bcrypto\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\boil\b/i, /\bgold\b/i,
      /\bdollars?\b/i, /\bcurrenc(?:y|ies)\b/i, /\bforex\b/i, /\brecession\b/i, /\bprofits?\b/i,
      /\brevenue/i, /\bearnings?\b/i, /\bipo\b/i, /\bmergers?\b/i, /\bacquisit/i,
      /\betf\b/i, /\bwall street\b/i, /\bnasdaq\b/i, /\bs&p\b/i,
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
      // Turkish financial terms
      /\bborsa/i, /\bhisse/i, /\bpiyasa/i, /\bişlem/i, /\byatırım/i,
      /\bekonomi/i, /\bfinans/i, /\bbanka/i, /\bfaiz/i, /\btahvil/i, /\bgetiri/i,
      /\bgsyh/i, /\benflasyon/i, /\bmb\b/i, /\bmerkez\s+bankası/i,
      /\bkripto/i, /\bbitcoin/i, /\bethereum/i, /\bpetrol/i, /\baltın/i,
      /\bdöviz/i, /\bkur/i, /\bdolar/i, /\beuro/i, /\bforex/i,
      /\bdış\s+ticaret/i, /\bihracat/i, /\bithalat/i,
      /\bkredi/i, /\bborç/i, /\baçık/i,
      /\bmaliye/i, /\bpara\s+politikası/i, /\bemtia/i, /\bfiyat/i,
      /\bşirket/i, /\bkurumsal/i, /\bgirişim/i, /\bsermaye/i,
      /\biflas/i, /\bişsizlik/i, /\bistihdam/i,
      /\btedarik\s+zinciri/i, /\bünite/i, /\büretim/i, /\btüketici/i,
      /\bperakende/i, /\bsatış/i, /\bbeklenti/i, /\btahmin/i,
      /\bhissedar/i, /\btemettü/i, /\bdevralma/i, /\bsözleşme/i,
      /\bsektör/i, /\bendüstri/i, /\bkonut/i, /\bgayrimenkul/i,
      /\benerji/i, /\bteknoloji/i, /\botomotiv/i, /\bsigorta/i,
      /\bihracatçı/i, /\bithalatçı/i, /\bticaret/i,
      /\bbütçe/i, /\baçık/i, /\bborçlanma/i,
      /\bfüzyon/i, /\bdevralma/i, /\bhalka\s+arz/i,
      /\bkâr/i, /\bzarar/i, /\bciro/i,
      /\bcbrt/i, /\btcmb/i, /\bimf\b/i, /\bopec/i,
      /\bbist/i, /\bbist\s*100/i, /\bendeks/i,
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

        // Locale-aware deduplication: check against Turkish articles only
        const existing = await db.newsItem.findFirst({
          where: { url: item.url, locale: 'tr' },
          select: { id: true },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Get category in Turkish from TR_PIPELINE_CONFIG
        const trCategory = TR_PIPELINE_CONFIG.CATEGORY_MAP_TR[item.category] || 'Ekonomi';

        // Generate slug from Turkish title (includes random suffix)
        const { generateSlug } = await import('@/lib/slug');
        const slug = generateSlug(item.title);

        // Simple sentiment analysis (Turkish + English words)
        const positiveWords = ['rise', 'surge', 'gain', 'rally', 'boost', 'jump', 'climb', 'record', 'beat', 'growth', 'profit',
          'yükseliş', 'artış', 'kazanç', 'rekor', 'büyüme', 'kâr', 'iyileşme', 'toparlanma', 'olumlu', 'güçlü'];
        const negativeWords = ['fall', 'drop', 'decline', 'slide', 'sink', 'crash', 'loss', 'low', 'miss', 'cut', 'recession', 'plunge',
          'düşüş', 'gerileme', 'kayıp', 'kriz', 'çöküş', 'zarar', 'daralma', 'resesyon', 'olumsuz', 'zayıf'];
        const lowerText = textToCheck.toLowerCase();
        let posScore = 0, negScore = 0;
        positiveWords.forEach(w => { if (lowerText.includes(w)) posScore += 10; });
        negativeWords.forEach(w => { if (lowerText.includes(w)) negScore += 10; });
        const sentiment = posScore > negScore + 10 ? 'positive' : negScore > posScore + 10 ? 'negative' : 'neutral';
        const sentimentScore = posScore > negScore + 10 ? Math.min(55 + posScore, 95) : negScore > posScore + 10 ? Math.min(55 + negScore, 95) : 55;

        // Use the RSS summary as initial content — tr-processor will enhance it
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
              result.duplicates++;
            }
          } else {
            throw createErr;
          }
        }
      } catch (err: any) {
        result.errors++;
        console.error(`[TR Cron V3] Kaydetme hatası "${item.title?.slice(0, 40)}": ${err.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`[TR Cron V3] Tamamlandı: ${result.fetched} yeni, ${result.duplicates} kopya, ${result.filtered} finansal olmayan filtrelendi, ${result.errors} hata ${result.duration}ms`);
    return result;
  } catch (err: any) {
    result.errors++;
    result.duration = Date.now() - startTime;
    console.error('[TR Cron V3] Kritik alma hatası:', err.message);
    return result;
  }
}

// ─── RSS XML Parser ────────────────────────────────────────
// parseRSSXML is now imported from shared-pipeline-utils

// ─── V3: Full Pipeline Processing for Turkish Articles ────────

interface TrProcessResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  details: string[];
  duration: number;
}

async function processTurkishArticles(maxArticles: number = 20): Promise<TrProcessResult> {
  const startTime = Date.now();
  const result: TrProcessResult = { processed: 0, published: 0, failed: 0, skipped: 0, details: [], duration: 0 };
  const errorDetails: string[] = [];

  try {
    const unprocessedArticles = await db.newsItem.findMany({
      where: {
        locale: 'tr',
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
      result.details.push('İşlenecek makale yok');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[TR Cron V3] işleme: ${unprocessedArticles.length} işlenecek Türk makalesi bulundu`);

    const trLimits = await getTrPipelineLimits();
    const maxDaily = trLimits.maxDailyTrNews;
    const maxHourly = trLimits.maxHourlyTrNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V377: Added newsType: 'live' — quota should ONLY count live news articles
    // (reports/analyses should NOT consume the daily/hourly limit)
    const trPublishedFilter = {
      locale: 'tr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...trPublishedFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...trPublishedFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    console.log(`[TR Cron V3] işleme: Kota — saat: ${publishedThisHour}/${maxHourly}, gün: ${publishedToday}/${maxDaily}`);

    if (remainingHourly <= 0 || remainingDaily <= 0) {
      result.details.push(`Kota doldu — saat: ${publishedThisHour}/${maxHourly}, gün: ${publishedToday}/${maxDaily}`);
      result.duration = Date.now() - startTime;
      return result;
    }

    let publishCount = 0;

    for (const article of unprocessedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unprocessedArticles.length - result.processed;
        result.details.push(`${publishCount} makaleden sonra kota doldu`);
        break;
      }

      // Live quota re-check every 5 articles
      if (publishCount > 0 && publishCount % 5 === 0) {
        try {
          const [liveToday, liveHour] = await Promise.all([
            db.newsItem.count({ where: { ...trPublishedFilter, publishedAt: { gte: todayStart } } }),
            db.newsItem.count({ where: { ...trPublishedFilter, publishedAt: { gte: hourStart } } }),
          ]);
          const liveRemainingHour = maxHourly > 0 ? maxHourly - liveHour : 999;
          const liveRemainingDay = maxDaily > 0 ? maxDaily - liveToday : 999;
          if (liveRemainingHour <= 0 || liveRemainingDay <= 0) {
            console.log(`[TR Cron V358] Canlı kota kontrolü: sınır doldu (saat=${liveHour}/${maxHourly}, gün=${liveToday}/${maxDaily}). ${publishCount} yayımlanmış sonra durdu.`);
            result.skipped += unprocessedArticles.length - result.processed;
            break;
          }
        } catch (reCheckErr: any) {
          console.warn(`[TR Cron V358] Canlı kota kontrolü başarısız: ${reCheckErr.message}`);
        }
      }

      try {
        // Reset skipped articles back to fetched before processing
        if (article.processingStage === 'skipped') {
          await db.newsItem.update({
            where: { id: article.id },
            data: { processingStage: 'fetched', retryCount: 0, lastError: null },
          });
          console.log(`[TR Cron V373] Atlanan makale ${article.id} → yeniden işleme için fetched olarak sıfırlandı`);
        }

        let publishSuccess = false;

        // Articles in 'imaged' stage already have everything — just try publishing directly
        if (article.processingStage === 'imaged') {
          try {
            const { publishArticle } = await import('@/lib/pipeline/agents/publisher');
            const pubResult = await publishArticle(article.id);
            if (pubResult.success) {
              publishSuccess = true;
              publishCount++;
              result.published++;
              result.processed++;
              console.log(`[TR Cron V3] ✓ Makale ${article.id} (imaged) BAŞARIYLA YAYIMLANDI`);
            } else {
              console.warn(`[TR Cron V3] yayıncı reddetti (imaged) ${article.id}: ${pubResult.reason}`);
              result.failed++;
            }
          } catch (pubErr: any) {
            console.error(`[TR Cron V3] Yayıncı hatası (imaged) ${article.id}: ${pubErr.message}`);
            result.failed++;
          }
          continue; // Skip full processing for imaged articles
        }

        console.log(`[TR Cron V3] Makale işleniyor ${article.id}: "${article.title?.slice(0, 50)}..." (aşama: ${article.processingStage})`);

        // ── Step 0: Run content-loader if article is still in 'fetched' stage ──
        if (article.processingStage === 'fetched') {
          try {
            await runContentLoaderStep(article.id, 'tr');
          } catch (clErr: any) {
            console.warn(`[TR Cron V3] Content loader error for ${article.id}: ${clErr.message}`);
          }
        }

        // ── Step 1: Run tr-processor (AI analysis + content enhancement) ──
        let processorSuccess = false;
        try {
          const { processArticleTr } = await import('@/lib/pipeline/agents/tr-processor');
          const trResult = await processArticleTr(article.id);
          if (trResult.success) {
            processorSuccess = true;
            recordAISuccess('tr');
            console.log(`[TR Cron V3] tr-processor başarılı ${article.id}: alanlar=${trResult.fields.join(',')}`);
          } else {
            const errMsg = `tr-processor başarısız ${article.id}: ${trResult.error}`;
            console.warn(`[TR Cron V3] ${errMsg} — yeniden deneniyor`);
            errorDetails.push(errMsg);
            const retryResult = await processArticleTr(article.id);
            if (retryResult.success) {
              processorSuccess = true;
              recordAISuccess('tr');
              console.log(`[TR Cron V3] tr-processor yeniden deneme başarılı ${article.id}`);
            } else {
              const retryErrMsg = `tr-processor yeniden deneme de başarısız ${article.id}: ${retryResult.error}`;
              console.warn(`[TR Cron V3] ${retryErrMsg}`);
              errorDetails.push(retryErrMsg);
              recordAIFailure('tr');
            }
          }
        } catch (procErr: any) {
          const fatalErrMsg = `tr-processor kritik hata ${article.id}: ${procErr.message}`;
          console.error(`[TR Cron V3] ${fatalErrMsg}`);
          errorDetails.push(fatalErrMsg);
          recordAIFailure('tr');
        }

        if (!processorSuccess) {
          console.log(`[TR Cron V3] tr-processor başarısız — ${article.id} için Canvas görsel + doğrudan yayınlama deneniyor`);
        }

        // ── Step 2: Run imager ──
        let imageSuccess = false;
        try {
          const { imageArticle } = await import('@/lib/pipeline/agents/imager');
          const imageResult = await imageArticle(article.id);
          if (imageResult.success) {
            imageSuccess = true;
            console.log(`[TR Cron V3] imager başarılı ${article.id}: kaynak=${imageResult.imageSource}`);
          } else {
            console.warn(`[TR Cron V3] imager başarısız ${article.id}: ${imageResult.error}`);
          }
        } catch (imgErr: any) {
          console.error(`[TR Cron V3] imager kritik hata ${article.id}: ${imgErr.message}`);
        }

        // ── Step 3: Run publisher ──
        // (publishSuccess already declared above)
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
              console.log(`[TR Cron V3] ✓ Makale ${article.id} BAŞARIYLA YAYIMLANDI`);
            } else {
              console.warn(`[TR Cron V3] yayıncı reddetti ${article.id}: ${pubResult.reason}`);
            }
          } else {
            // Canvas image fallback + direct publish
            console.log(`[TR Cron V3] Makale ${article.id} 'imaged' aşamasında değil — Canvas görsel + doğrudan yayınlama deneniyor`);

            try {
              const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
              const title = updatedArticle?.title || article.title || 'Finans Haberleri';

              const articleFull = await db.newsItem.findUnique({
                where: { id: article.id },
                select: { category: true, categoryId: true, newsType: true, sentiment: true, sourceName: true, source: true },
              });

              const canvasBuffer = await generateArticleImage({
                title,
                category: articleFull?.categoryId || articleFull?.category || 'economy',
                locale: 'tr',
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
                    console.log(`[TR Cron V3] ✓ Makale ${article.id} Canvas görsel ile yayıncı üzerinden YAYIMLANDI`);
                  }
                } else {
                  // V1064: GOLDEN RULE — never publish without full AI analysis
                  // Removes the previous condition that allowed publishing when content was missing
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

                  console.warn(`[TR Cron V1064] Article ${article.id}: görsel kaydedildi ama YAYIMLANMADI — ${!hasContent ? 'içerik' : 'analiz'} eksik. Sonraki döngüde tekrar denenecek.`);
                }
              }
            } catch (canvasErr: any) {
              console.error(`[TR Cron V3] Canvas yedek görsel başarısız ${article.id}: ${canvasErr.message}`);
            }
          }
        } catch (pubErr: any) {
          console.error(`[TR Cron V3] Yayıncı hatası ${article.id}: ${pubErr.message}`);
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
        console.error(`[TR Cron V3] Makale işleme hatası ${article.id}: ${err.message}`);
        try {
          const { recordError } = await import('@/lib/pipeline/queue/job-manager');
          await recordError(article.id, `TR pipeline error: ${err.message}`);
        } catch { /* non-critical */ }
      }
    }

    result.details.push(`İşlenen: ${result.processed}, Yayımlanan: ${result.published}, Başarısız: ${result.failed}, Atlanan: ${result.skipped}`);
    if (errorDetails.length > 0) {
      result.details.push(...errorDetails.slice(0, 10));
    }
    console.log(`[TR Cron V3] işleme tamamlandı: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Kritik hata: ${err.message}`);
    console.error(`[TR Cron V3] Kritik işleme hatası: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── Reprocess published articles missing AI analysis/images ──

async function reprocessTurkishArticles(maxArticles: number = 5): Promise<TrProcessResult> {
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
      result.details.push('Yeniden işlenecek eksik makale yok');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[TR Cron V3] yeniden işleme: ${incompleteArticles.length} analiz/görsel eksik TR makalesi bulundu`);

    for (const article of incompleteArticles) {
      try {
        const needsAnalysis = !article.aiAnalysis || article.aiAnalysis.length < 50;
        // EGRESS FIX: use processingStage instead of generatedImage to determine if image is needed
        const needsImage = article.processingStage !== 'imaged';

        console.log(`[TR Cron V3] Yeniden işleme ${article.id}: needsAnalysis=${needsAnalysis}, needsImage=${needsImage}`);

        if (needsAnalysis) {
          try {
            const { processArticleTr } = await import('@/lib/pipeline/agents/tr-processor');
            const trResult = await processArticleTr(article.id);
            if (trResult.success) {
              console.log(`[TR Cron V3] yeniden işleme: tr-processor başarılı ${article.id}`);
            } else {
              console.warn(`[TR Cron V3] yeniden işleme: tr-processor başarısız ${article.id}: ${trResult.error}`);
            }
          } catch (procErr: any) {
            console.warn(`[TR Cron V3] yeniden işleme: tr-processor hatası ${article.id}: ${procErr.message}`);
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
              console.log(`[TR Cron V3] yeniden işleme: imager başarılı ${article.id}: kaynak=${imgResult.imageSource}`);
            } else {
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
                  console.log(`[TR Cron V3] yeniden işleme: Canvas görsel kaydedildi ${article.id}`);
                }
              } catch (canvasErr: any) {
                console.warn(`[TR Cron V3] yeniden işleme: Canvas yedek başarısız ${article.id}: ${canvasErr.message}`);
              }
            }
          } catch (imgErr: any) {
            console.warn(`[TR Cron V3] yeniden işleme: imager hatası ${article.id}: ${imgErr.message}`);
          }
        }

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
        console.error(`[TR Cron V3] Yeniden işleme hatası ${article.id}: ${err.message}`);
      }
    }

    result.details.push(`Yeniden işlenen: ${result.processed}, Geliştirilen: ${result.published}, Başarısız: ${result.failed}`);
    console.log(`[TR Cron V3] yeniden işleme tamamlandı: ${result.details.join(' | ')}`);
  } catch (err: any) {
    result.failed++;
    result.details.push(`Kritik hata: ${err.message}`);
    console.error(`[TR Cron V3] Kritik yeniden işleme hatası: ${err.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ─── Turkish Pipeline Trigger ───────────────────────────────

async function triggerTrPipeline(): Promise<{ message: string; orchestrator: any }> {
  try {
    const { ensureTrRunning } = await import('@/lib/pipeline/tr-orchestrator');
    const result = ensureTrRunning();
    const { getTrOrchestratorStats } = await import('@/lib/pipeline/tr-orchestrator');
    const stats = await getTrOrchestratorStats();

    return {
      message: result?.restarted ? 'Türk boru hattı yeniden başlatıldı (durmuş veya bekliyordu)' : 'Türk boru hattı zaten çalışıyor',
      orchestrator: stats,
    };
  } catch (err: any) {
    return {
      message: `TR orkestratör mevcut değil: ${err.message}`,
      orchestrator: null,
    };
  }
}

// ─── V2 Legacy: Direct Publish (emergency fast-path only) ────

async function directPublishTurkish(): Promise<{
  published: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const result = { published: 0, skipped: 0, errors: 0, details: [] as string[] };

  try {
    const unpublishedArticles = await db.newsItem.findMany({
      where: {
        locale: 'tr',
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
        aiAnalysis: true,
      },
      take: 50,
    });

    console.log(`[TR Cron V3] doğrudan-yayınlama: ${unpublishedArticles.length} yayımlanmamış Türk makalesi bulundu`);

    const trDirectLimits = await getTrPipelineLimits();
    const maxDaily = trDirectLimits.maxDailyTrNews;
    const maxHourly = trDirectLimits.maxHourlyTrNews;
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setUTCMinutes(0, 0, 0);
    const todayStart = getTodayStart(TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

    // V377: Added newsType: 'live' — quota should ONLY count live news articles
    const trVisibilityFilter = {
      locale: 'tr',
      isReady: true,
      isPublished: true,
      newsType: 'live',
      slug: { not: '' },
      title: { not: '' },
    };

    const [publishedToday, publishedThisHour] = await Promise.all([
      db.newsItem.count({ where: { ...trVisibilityFilter, publishedAt: { gte: todayStart } } }),
      db.newsItem.count({ where: { ...trVisibilityFilter, publishedAt: { gte: hourStart } } }),
    ]);

    const remainingHourly = maxHourly > 0 ? Math.max(0, maxHourly - publishedThisHour) : 999;
    const remainingDaily = maxDaily > 0 ? Math.max(0, maxDaily - publishedToday) : 999;

    let publishCount = 0;
    const ARABIC_REGEX = /[\u0600-\u06FF]/;

    for (const article of unpublishedArticles) {
      if (publishCount >= remainingHourly || publishCount >= remainingDaily) {
        result.skipped += unpublishedArticles.length - publishCount;
        result.details.push(`${publishCount} makaleden sonra kota doldu`);
        break;
      }

      const hasTurkishTitle = !!(
        article.title &&
        article.title.length > 5 &&
        /[a-zA-ZşçöüğıİŞÇÖÜĞ]/.test(article.title) &&
        !ARABIC_REGEX.test(article.title)
      );

      if (!hasTurkishTitle || !article.slug || article.slug.length < 2) {
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

      // FIX: If REQUIRE_AI_ANALYSIS is true, skip articles without aiAnalysis
      if (TR_PIPELINE_CONFIG.REQUIRE_AI_ANALYSIS) {
        const hasAnalysis = !!(article.aiAnalysis && article.aiAnalysis.length > 50);
        if (!hasAnalysis) {
          result.skipped++;
          console.warn(`[TR Cron V3] doğrudan-yayınlama: ${article.id} ATLANDI — aiAnalysis eksik (REQUIRE_AI_ANALYSIS=true)`);
          continue;
        }
      }

      try {
        let generatedImage: string | null = null;
        try {
          const { generateArticleImage } = await import('@/lib/image-templates/template-engine');
          const canvasBuffer = await generateArticleImage({
            title: article.title,
            category: article.categoryId || article.category || 'economy',
            locale: 'tr',
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
          console.warn(`[TR Cron V3] doğrudan-yayınlama: Canvas görsel başarısız ${article.id}: ${canvasErr.message}`);
        }

        // V361: Check quota BEFORE direct publish
        try {
          const { canPublish } = await import('@/lib/pipeline/publish-quota');
          const quotaCheck = await canPublish('tr');
          if (!quotaCheck.allowed) {
            console.warn(`[TR Cron V361] doğrudan-yayınlama KOTA NEDENİYLE ENGELLENDİ ${article.id}: ${quotaCheck.reason}`);
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
            publishedAt: article.fetchedAt || new Date(),
            generatedImage: generatedImage,
            imageUrl: generatedImage
              ? (generatedImage.startsWith('http') ? generatedImage : `/api/article-image/${article.id}`)
              : `https://image.pollinations.ai/prompt/${encodeURIComponent(article.title.slice(0, 60))}%20finans%20haberleri?width=1200&height=675&nologo=true&seed=${article.id.slice(0, 8)}&model=flux`,
          },
        });

        // V361: Record publish in quota manager
        try {
          const { recordPublish } = await import('@/lib/pipeline/publish-quota');
          recordPublish('tr');
        } catch { /* non-critical */ }

        publishCount++;
        result.published++;
      } catch (pubErr: any) {
        result.errors++;
        console.error(`[TR Cron V3] doğrudan-yayınlama: Hata ${article.id}: ${pubErr.message}`);
      }
    }

    result.details.push(`${result.published} yayımlandı, ${result.skipped} atlandı, ${result.errors} hata`);
  } catch (err: any) {
    result.errors++;
    result.details.push(`Kritik hata: ${err.message}`);
    console.error(`[TR Cron V3] doğrudan-yayınlama kritik hata: ${err.message}`);
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
        const todayStart = getTodayStart(TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0);

        // V376: Visibility filter MUST match the frontend news page filter.
        const trVisFilter = {
          locale: 'tr' as const,
          isReady: true,
          isPublished: true,
          newsType: 'live' as const,
          slug: { not: '' },
          title: { not: '' },
        };

        const [trReady, trPublished, trPublishedToday, trPending, trPublishedThisHour, trFetched, trWithoutImageRaw] = await Promise.all([
          db.newsItem.count({ where: { locale: 'tr', isReady: true } }),
          // V376: Use visibility filter for published counts — matches frontend
          db.newsItem.count({ where: trVisFilter }),
          db.newsItem.count({ where: { ...trVisFilter, publishedAt: { gte: todayStart } } }),
          db.newsItem.count({ where: { locale: 'tr', isReady: false, retryCount: { lt: 15 } } }),
          db.newsItem.count({ where: { ...trVisFilter, publishedAt: { gte: oneHourAgo } } }),
          db.newsItem.count({ where: { locale: 'tr', isReady: false, processingStage: { in: ['fetched', 'content_loaded', 'analyzed', 'translated', 'skipped', 'imaged'] } } }),
          // EGRESS FIX: use count instead of findMany with generatedImage select
          db.newsItem.count({
            where: { locale: 'tr', isReady: true, isPublished: true, OR: [{ generatedImage: null }, { generatedImage: '' }] },
          }),
        ]);
        const trWithoutImage = trWithoutImageRaw; // EGRESS FIX: count query already filters null/empty

        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          pipeline: {
            totalReady: trReady,
            totalPublished: trPublished,
            publishedToday: trPublishedToday,
            publishedThisHour: trPublishedThisHour,
            pending: trPending,
            awaitingProcessing: trFetched,
            publishedWithoutImage: trWithoutImage,
            limits: {
              maxDaily: (await getTrPipelineLimits()).maxDailyTrNews,
              maxHourly: (await getTrPipelineLimits()).maxHourlyTrNews,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'full-cycle': {
        const fetchResult = await fetchTurkishRSSFeeds();
        const processResult = await processTurkishArticles(limit);
        const reprocessResult = await reprocessTurkishArticles(5);

        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          version: 'V3',
          fetch: fetchResult,
          process: processResult,
          reprocess: reprocessResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'fetch': {
        const fetchResult = await fetchTurkishRSSFeeds();
        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          fetch: fetchResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'process': {
        const processResult = await processTurkishArticles(limit);
        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          process: processResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'reprocess': {
        const reprocessResult = await reprocessTurkishArticles(limit);
        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          reprocess: reprocessResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'direct-publish': {
        const publishResult = await directPublishTurkish();
        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          publish: publishResult,
          timestamp: new Date().toISOString(),
        });
      }

      case 'mark-ready': {
        const markLimits = await getTrPipelineLimits();
        const markResult = await markReadyWithQuotaCap('tr', markLimits.maxDailyTrNews, markLimits.maxHourlyTrNews, TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0, 'title');

        // Step 3: Auto-start orchestrator if not running (like Arabic pipeline)
        try {
          const { ensureTrRunning } = await import('@/lib/pipeline/tr-orchestrator');
          const orchResult = ensureTrRunning();
          if (orchResult?.restarted) {
            console.log(`[TR Cron V52] mark-ready: TR orchestrator ${orchResult.wasStale ? 'was STALE — force-restarted' : 'was NOT running — started'}`);
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
        const resetResult = await strongReset('tr', 15);
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
          message: `Unlocked ${resetCount} Turkish articles`,
          count: resetCount,
          timestamp: new Date().toISOString(),
        });
      }

      case 'fix-published': {
        // Fix articles with isReady=true but isPublished=false
        const fixLimits = await getTrPipelineLimits();
        const fixNow = new Date();
        const fixHourStart = new Date(fixNow);
        fixHourStart.setUTCMinutes(0, 0, 0);
        const fixResetHour = TR_PIPELINE_CONFIG.DAILY_LIMIT_RESET_HOUR || 0;
        const fixTodayStart = getTodayStart(fixResetHour);

        // V379: Added newsType: 'live' — only live news counts toward quota
        const fixVisFilter = {
          locale: 'tr',
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

        const fixRemainingHourly = fixLimits.maxHourlyTrNews > 0
          ? Math.max(0, fixLimits.maxHourlyTrNews - fixPubThisHour) : 999;
        const fixRemainingDaily = fixLimits.maxDailyTrNews > 0
          ? Math.max(0, fixLimits.maxDailyTrNews - fixPubToday) : 999;
        const fixMaxToFix = Math.min(fixRemainingHourly, fixRemainingDaily);

        if (fixMaxToFix <= 0) {
          return NextResponse.json({
            status: 'ok',
            message: `Quota reached — cannot fix-published. Hour: ${fixPubThisHour}/${fixLimits.maxHourlyTrNews}, Day: ${fixPubToday}/${fixLimits.maxDailyTrNews}`,
            count: 0,
            quotaExceeded: true,
            timestamp: new Date().toISOString(),
          });
        }

        const articlesToFix = await db.newsItem.findMany({
          where: {
            isReady: true,
            isPublished: false,
            locale: 'tr',
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
              recordPublish('tr');
            }
          } catch { /* non-critical */ }
        }

        return NextResponse.json({
          status: 'ok',
          message: `Fixed ${fixedCount} Turkish articles (limited by quota: hour=${fixPubThisHour}/${fixLimits.maxHourlyTrNews}, day=${fixPubToday}/${fixLimits.maxDailyTrNews})`,
          count: fixedCount,
          quotaRemaining: { hourly: fixRemainingHourly - fixedCount, daily: fixRemainingDaily - fixedCount },
          timestamp: new Date().toISOString(),
        });
      }

      // V379: Reset HIGH-RETRY TR articles (retryCount >= 15) — permanently excluded from processing
      case 'reset-high-retry': {
        const highRetryReset = await db.newsItem.updateMany({
          where: {
            locale: 'tr',
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

        console.log(`[TrCron V379] reset-high-retry: Reset ${highRetryReset.count} TR articles with retryCount>=15 back to fetched`);

        return NextResponse.json({
          status: 'ok',
          action: 'reset-high-retry',
          resetCount: highRetryReset.count,
          message: `Reset ${highRetryReset.count} TR articles with retryCount>=15 back to 'fetched' stage with retryCount=0`,
        });
      }

      case 'reset-stuck': {
        const stuckStages = ['content_loaded', 'translated'];
        const resetResult = await db.newsItem.updateMany({
          where: {
            locale: 'tr',
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
            locale: 'tr',
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

        // Also reset articles with retryCount >= 15 (permanently stuck)
        const resetMaxRetry = await db.newsItem.updateMany({
          where: {
            locale: 'tr',
            isReady: false,
            isPublished: false,
            retryCount: { gte: 15 },
          },
          data: {
            processingStage: 'fetched',
            retryCount: 0,
            lastError: null,
          },
        });

        const totalReset = resetResult.count + resetAnalyzed.count + resetMaxRetry.count;
        console.log(`[TR Cron V317] reset-stuck: content_loaded/translated: ${resetResult.count}, analyzed: ${resetAnalyzed.count}, max-retry: ${resetMaxRetry.count}`);

        return NextResponse.json({
          status: 'ok',
          locale: 'tr',
          message: `${resetResult.count} content_loaded/translated, ${resetAnalyzed.count} analyzed, ${resetMaxRetry.count} max-retry → sıfırlandı`,
          reset: { contentLoaded: resetResult.count, analyzed: resetAnalyzed.count, maxRetry: resetMaxRetry.count, total: totalReset },
          timestamp: new Date().toISOString(),
        });
      }

      default: {
        return NextResponse.json({
          status: 'error',
          message: `Bilinmeyen eylem: ${action}. Geçerli eylemler: status, full-cycle, fetch, process, reprocess, direct-publish, mark-ready, reset-stuck`,
        }, { status: 400 });
      }
    }
  } catch (error: any) {
    console.error('[TR Cron V3] İşleyici hatası:', error.message);
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
