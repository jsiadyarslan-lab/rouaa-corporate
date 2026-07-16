// Batch update isOfficialSource for existing articles
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const OFFICIAL_DOMAINS = [
  'federalreserve.gov', 'ecb.europa.eu', 'bis.org', 'imf.org', 'worldbank.org',
  'sec.gov', 'treasury.gov', 'whitehouse.gov', 'commerce.gov',
  'bankofengland.co.uk', 'boj.or.jp', 'pboc.gov.cn', 'rba.gov.au',
  'banque-france.fr', 'bundesbank.de', 'bancaditalia.it', 'dnb.nl',
  'riksbank.se', 'norges-bank.no', 'bankofcanada.ca',
  'centralbank.org', 'centralbank.gov', 'cbuae.gov.ae', 'sama.gov.sa',
  'mas.gov.sg', 'hkma.gov.hk', 'rbi.org.in', 'bankofkorea.or.kr',
  'tcmb.gov.tr', 'banxico.org.mx', 'bcra.gob.ar', 'bcb.gov.br',
  'centralbanking.com', 'data.bis.org', 'ffiec.gov',
  'stats.gov', 'census.gov', 'bea.gov', 'bls.gov', 'stat.gov.rs', 'eurostat',
  'iosco.org', 'fasb.org', 'ifrs.org', 'iaasb.org',
  'wto.org', 'oecd.org', 'un.org', 'unctad.org', 'financing.desa.un.org',
  'sifma.org', 'iif.com', 'isdb.org', 'wcoomd.org',
  'moodys.com', 'ratings.moodys.com', 'fitchratings.com', 'spglobal.com',
  'govinfo.gov', 'treasurydirect.gov', 'sba.gov', 'trade.gov', 'dol.gov',
  'mof.go.jp', 'mof.gov.cy', 'fcc.gov', 'fda.gov',
  'amf.org.ae', 'spa.gov.sa', 'wam.ae', 'qna.org.qa', 'kuna.net.kw',
  'map.org.ma', 'pif.gov.sa',
  'nyse.com', 'nasdaq.com', 'euronext.com', 'deutsche-boerse.com',
  'jpx.co.jp', 'sse.com.cn', 'szse.cn', 'hkex.com.hk',
  'nseindia.com', 'bseindia.com', 'asx.com.au', 'tsx.com',
  'b3.com.br', 'boursakuwait.com', 'adx.ae', 'dfm.ae',
  'saudiexchange.sa', 'bahrainbourse.net', 'msm.gov.om',
  'qex.qa', 'egx.com.eg', 'bvmt.com.tn', 'casablanca-bourse.com',
  'jse.co.za', 'krx.co.kr', 'twse.com.tw', 'idx.co.id',
  'set.or.th', 'pse.com.ph', 'bvl.com.pe', 'bcba.com.ar',
  'subscribe.news.eu.nasdaq.com', 'lseg.com',
  'cmegroup.com', 'theice.com', 'lme.com',
  'brookings.edu', 'cato.org', 'heritage.org', 'aei.org',
  'bruegel.org', 'cepr.org', 'ifri.org', 'chathamhouse.org',
  'cfr.org', 'lowyinstitute.org',
  'insuranceeurope.eu', 'naic.org', 'eiopa.europa.eu', 'swissre.com', 'munichre.com',
  'iea.org', 'opec.org', 'eia.gov',
  'adb.org', 'afdb.org', 'eib.org', 'ebrd.com', 'aiib.org',
];

const OFFICIAL_SOURCE_NAMES = [
  'Federal Reserve', 'European Central Bank', 'Bank of England',
  'Bank of Japan', 'BIS', 'IMF', 'World Bank',
  'SEC', 'Treasury', 'Central Bank', 'Ministry of Finance',
  'Statistics Office', 'IOSCO', 'WTO', 'OECD',
  'Moody', 'Fitch', 'S&P Global',
  'NYSE', 'Nasdaq', 'Euronext', 'LME', 'CME',
  'IEA', 'OPEC', 'EIA',
  'Brookings', 'Chatham House',
  'Saudi Press Agency', 'WAM', 'QNA', 'KUNA',
  'Arab Monetary Fund', 'PIF',
  'Asian Development Bank', 'African Development Bank',
  'European Investment Bank', 'EBRD', 'AIIB', 'IsDB',
  'NAIC', 'EIOPA', 'Swiss Re', 'Munich Re',
  'FFIEC', 'SBA', 'WCO',
];

export async function GET(request: NextRequest) {
  const authKey = request.nextUrl.searchParams.get('key');
  if (authKey !== process.env.CRON_SECRET && authKey !== 'ai-news-cron') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const articles = await db.newsItem.findMany({
      where: { url: { not: '' } },
      select: { id: true, url: true, source: true, sourceName: true },
      take: 5000,
    });

    let updated = 0;
    const matchedDomains = new Set<string>();

    for (const a of articles) {
      const urlLower = (a.url || '').toLowerCase();
      const sourceLower = (a.sourceName || a.source || '').toLowerCase();
      
      // Check URL against official domains
      const isOfficialByUrl = OFFICIAL_DOMAINS.some(d => urlLower.includes(d));
      // Check source name against official names
      const isOfficialByName = OFFICIAL_SOURCE_NAMES.some(n => sourceLower.includes(n.toLowerCase()));
      const isOfficial = isOfficialByUrl || isOfficialByName;
      
      if (isOfficial) {
        await db.newsItem.update({
          where: { id: a.id },
          data: { isOfficialSource: true },
        });
        updated++;
        OFFICIAL_DOMAINS.forEach(d => {
          if (urlLower.includes(d) || sourceLower.includes(d)) matchedDomains.add(d);
        });
      }
    }

    return NextResponse.json({
      success: true,
      scanned: articles.length,
      updated,
      matchedDomains: Array.from(matchedDomains).slice(0, 20),
      matchedDomainCount: matchedDomains.size,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message?.slice(0, 300) }, { status: 500 });
  }
}
