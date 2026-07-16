/**
 * One-time database fix script:
 * - Finds MarketAnalysis & EconomicReport where isPublished=true AND:
 *     a) content contains "لا تنشر" (Arabic: "do not publish")
 *     b) content contains "ثقة" followed by a number ≤ 6 then "/10" (low confidence)
 * - Also finds records where confidenceScore < 40 and isPublished=true
 * - Sets isPublished=false and publishedAt=null for those records
 *
 * Run: DATABASE_URL="postgresql://..." node scripts/fix-published-reports.cjs
 * Uses the DATABASE_URL environment variable to connect.
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const db = new PrismaClient({
    log: ['warn', 'error'],
  });

  try {
    console.log('=== FIX PUBLISHED REPORTS SCRIPT ===\n');

    // ─────────────────────────────────────────────
    // STEP 1: Find problematic MarketAnalysis records
    // ─────────────────────────────────────────────
    console.log('--- Scanning MarketAnalysis records ---');

    const allPublishedAnalyses = await db.marketAnalysis.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        confidenceScore: true,
        publishedAt: true,
      },
    });

    console.log(`Total published MarketAnalysis: ${allPublishedAnalyses.length}`);

    // Regex for "ثقة" followed by a number ≤ 6 then "/10"
    // Matches patterns like: ثقة 3/10, ثقة 6/10, ثقة 5/10
    const lowConfidenceRegex = /ثقة\s*([0-6])\s*\/\s*10/;

    const badAnalyses = allPublishedAnalyses.filter((a) => {
      const content = a.content || '';
      const hasDoNotPublish = content.includes('لا تنشر');
      const hasLowConfidence = lowConfidenceRegex.test(content);
      const hasLowScore = a.confidenceScore < 40;
      return hasDoNotPublish || hasLowConfidence || hasLowScore;
    });

    console.log(`Found ${badAnalyses.length} problematic MarketAnalysis records`);

    for (const a of badAnalyses) {
      const reasons = [];
      const content = a.content || '';
      if (content.includes('لا تنشر')) reasons.push('contains "لا تنشر"');
      if (lowConfidenceRegex.test(content)) {
        const match = content.match(lowConfidenceRegex);
        reasons.push(`low confidence in text: "${match[0]}"`);
      }
      if (a.confidenceScore < 40) reasons.push(`confidenceScore=${a.confidenceScore} < 40`);
      console.log(`  - [${a.slug}] "${a.title}" — reasons: ${reasons.join(', ')}`);
    }

    // ─────────────────────────────────────────────
    // STEP 2: Find problematic EconomicReport records
    // ─────────────────────────────────────────────
    console.log('\n--- Scanning EconomicReport records ---');

    const allPublishedReports = await db.economicReport.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        confidenceScore: true,
        publishedAt: true,
      },
    });

    console.log(`Total published EconomicReport: ${allPublishedReports.length}`);

    const badReports = allPublishedReports.filter((r) => {
      const content = r.content || '';
      const hasDoNotPublish = content.includes('لا تنشر');
      const hasLowConfidence = lowConfidenceRegex.test(content);
      const hasLowScore = r.confidenceScore < 40;
      return hasDoNotPublish || hasLowConfidence || hasLowScore;
    });

    console.log(`Found ${badReports.length} problematic EconomicReport records`);

    for (const r of badReports) {
      const reasons = [];
      const content = r.content || '';
      if (content.includes('لا تنشر')) reasons.push('contains "لا تنشر"');
      if (lowConfidenceRegex.test(content)) {
        const match = content.match(lowConfidenceRegex);
        reasons.push(`low confidence in text: "${match[0]}"`);
      }
      if (r.confidenceScore < 40) reasons.push(`confidenceScore=${r.confidenceScore} < 40`);
      console.log(`  - [${r.slug}] "${r.title}" — reasons: ${reasons.join(', ')}`);
    }

    // ─────────────────────────────────────────────
    // STEP 3: Fix the records — set isPublished=false, publishedAt=null
    // ─────────────────────────────────────────────
    const analysisIds = badAnalyses.map((a) => a.id);
    const reportIds = badReports.map((r) => r.id);
    const totalFixes = analysisIds.length + reportIds.length;

    if (totalFixes === 0) {
      console.log('\n✅ No problematic records found. Database is clean!');
      return;
    }

    console.log(`\n--- Fixing ${totalFixes} records ---`);

    let analysisUpdated = 0;
    let reportUpdated = 0;

    // Fix MarketAnalysis records one by one (to bypass potential Prisma extensions)
    for (const id of analysisIds) {
      try {
        await db.marketAnalysis.update({
          where: { id },
          data: {
            isPublished: false,
            publishedAt: null,
          },
        });
        analysisUpdated++;
      } catch (err) {
        console.error(`  ❌ Failed to fix MarketAnalysis ${id}: ${err.message}`);
      }
    }

    // Fix EconomicReport records one by one
    for (const id of reportIds) {
      try {
        await db.economicReport.update({
          where: { id },
          data: {
            isPublished: false,
            publishedAt: null,
          },
        });
        reportUpdated++;
      } catch (err) {
        console.error(`  ❌ Failed to fix EconomicReport ${id}: ${err.message}`);
      }
    }

    // ─────────────────────────────────────────────
    // STEP 4: Report results
    // ─────────────────────────────────────────────
    console.log('\n=== RESULTS ===');
    console.log(`MarketAnalysis records unpublished: ${analysisUpdated}/${analysisIds.length}`);
    console.log(`EconomicReport records unpublished: ${reportUpdated}/${reportIds.length}`);
    console.log(`Total records fixed: ${analysisUpdated + reportUpdated}`);

    // Verify: check that no problematic published records remain
    const remainingBadAnalyses = await db.marketAnalysis.findMany({
      where: {
        isPublished: true,
        OR: [
          { content: { contains: 'لا تنشر' } },
          { confidenceScore: { lt: 40 } },
        ],
      },
      select: { id: true, title: true },
    });

    const remainingBadReports = await db.economicReport.findMany({
      where: {
        isPublished: true,
        OR: [
          { content: { contains: 'لا تنشر' } },
          { confidenceScore: { lt: 40 } },
        ],
      },
      select: { id: true, title: true },
    });

    console.log(`\nVerification — remaining problematic published records:`);
    console.log(`  MarketAnalysis: ${remainingBadAnalyses.length}`);
    console.log(`  EconomicReport: ${remainingBadReports.length}`);

    if (remainingBadAnalyses.length === 0 && remainingBadReports.length === 0) {
      console.log('\n✅ All problematic records have been unpublished successfully!');
    } else {
      console.log('\n⚠️  Some records could not be fixed (see above for errors).');
    }

  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
