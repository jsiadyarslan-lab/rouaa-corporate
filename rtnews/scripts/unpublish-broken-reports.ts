/**
 * V224: Unpublish reports with broken/incomplete titles
 * 
 * Example broken title: "بلاك روك تدرس استثمار مليارات الدولارات في ، وتأثيره..."
 * The comma followed by nothing indicates a missing word (hallucinated title gap)
 * 
 * Usage: npx tsx scripts/unpublish-broken-reports.ts
 */
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function unpublishBrokenReports() {
  console.log('🔍 Scanning for reports with broken/incomplete titles...\n');

  // Find EconomicReports with suspicious titles
  const brokenPatterns = [
    /،\s*،/,           // Double comma
    /\sفي\s*[،,.]/,     // "في ،" or "في ." — missing word after preposition
    /\sعن\s*[،,.]/,     // "عن ،" — missing word after preposition
    /\sمن\s*[،,.]/,     // "من ،" — missing word after preposition
    /[،,]\s*وتأثير/,    // "، وتأثيره..." — common hallucination pattern
    /\.{3,}/,           // Ellipsis at end (truncated title)
    /\s+\|\s*$/,        // Ends with | separator
    /^\s*$/,            // Empty title
  ];

  const economicReports = await db.economicReport.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, slug: true, createdAt: true, confidenceScore: true },
  });

  console.log(`Found ${economicReports.length} published EconomicReports to check.\n`);

  let unpublishCount = 0;
  for (const report of economicReports) {
    const title = report.title || '';
    const isBroken = brokenPatterns.some(pattern => pattern.test(title));
    
    if (isBroken) {
      console.log(`❌ Broken title: "${title}"`);
      console.log(`   ID: ${report.id}`);
      console.log(`   Slug: ${report.slug}`);
      console.log(`   Created: ${report.createdAt}`);
      console.log(`   Confidence: ${report.confidenceScore}%`);
      
      await db.economicReport.update({
        where: { id: report.id },
        data: {
          isPublished: false,
          publishedAt: null,
        },
      });
      
      console.log('   → Unpublished ✓\n');
      unpublishCount++;
    }
  }

  // Also check MarketAnalysis reports
  const marketReports = await db.marketAnalysis.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, slug: true, createdAt: true, confidenceScore: true },
  });

  console.log(`Found ${marketReports.length} published MarketAnalyses to check.\n`);

  for (const report of marketReports) {
    const title = report.title || '';
    const isBroken = brokenPatterns.some(pattern => pattern.test(title));
    
    if (isBroken) {
      console.log(`❌ Broken title: "${title}"`);
      console.log(`   ID: ${report.id}`);
      console.log(`   Slug: ${report.slug}`);
      console.log(`   Created: ${report.createdAt}`);
      console.log(`   Confidence: ${report.confidenceScore}%`);
      
      await db.marketAnalysis.update({
        where: { id: report.id },
        data: {
          isPublished: false,
          publishedAt: null,
        },
      });
      
      console.log('   → Unpublished ✓\n');
      unpublishCount++;
    }
  }

  console.log(`\n✅ Done! Unpublished ${unpublishCount} reports with broken titles.`);
  await db.$disconnect();
}

unpublishBrokenReports().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
