// ═══════════════════════════════════════════════════════════════
// Infographic Locale Migration Script (V1219k)
// ═══════════════════════════════════════════════════════════════
// Problem: 824 infographics all stored with locale='ar', but ~80% are
// non-Arabic content (Spanish, French, English, Turkish).
//
// This script:
// 1. Fetches all infographics with locale='ar'
// 2. Detects actual language from title + slides content
// 3. Updates locale field if it doesn't match detected language
//
// Run: node --experimental-strip-types scripts/migrate-infographic-locales.ts
// Or:  npx tsx scripts/migrate-infographic-locales.ts
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Language detection based on Unicode ranges
function detectLocale(title: string, slides: any): string {
  const text = (title || '') + ' ' + (typeof slides === 'string' ? slides : JSON.stringify(slides || ''));

  // Count characters per language range
  let arabic = 0, latin = 0, french = 0, spanish = 0, turkish = 0;

  for (const ch of text) {
    const code = ch.charCodeAt(0);
    // Arabic range
    if (code >= 0x0600 && code <= 0x06FF) arabic++;
    // Latin (basic)
    if (code >= 0x0041 && code <= 0x007A) latin++;
  }

  // If significant Arabic content → ar
  if (arabic > 5 && arabic > latin / 3) return 'ar';

  // For Latin text, detect specific language by keywords
  const lowerText = text.toLowerCase();

  // French indicators
  const frenchWords = ['le ', 'la ', 'les ', 'des ', 'une ', 'dans ', 'pour ', 'avec ', 'sur ', 'par ', 'que ', 'qui ', 'est ', 'sont ', 'marché', 'analyse', 'rapport', 'économique'];
  const frenchCount = frenchWords.filter(w => lowerText.includes(w)).length;
  if (frenchCount >= 3) return 'fr';

  // Spanish indicators
  const spanishWords = ['el ', 'la ', 'los ', 'las ', 'una ', 'en ', 'para ', 'con ', 'por ', 'que ', 'es ', 'son ', 'mercado', 'análisis', 'informe', 'económico', 'del ', 'al '];
  const spanishCount = spanishWords.filter(w => lowerText.includes(w)).length;
  if (spanishCount >= 3) return 'es';

  // Turkish indicators
  const turkishChars = (text.match(/[çğıİşöüÇĞŞÖÜ]/g) || []).length;
  const turkishWords = ['bir ', 've ', 'için ', 'ile ', 'bu ', 'olan ', 'olarak ', 'pazar', 'analiz', 'rapor', 'ekonomik'];
  const turkishCount = turkishWords.filter(w => lowerText.includes(w)).length;
  if (turkishChars > 3 || turkishCount >= 3) return 'tr';

  // Default: English (if Latin but no specific language detected)
  if (latin > 10) return 'en';

  // Fallback: keep as Arabic if we can't determine
  return 'ar';
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('Infographic Locale Migration (V1219k)');
  console.log('═══════════════════════════════════════════════════\n');

  // Fetch all infographics currently marked as 'ar'
  const infographics = await db.infographic.findMany({
    where: { locale: 'ar' },
    select: { id: true, title: true, slides: true, locale: true, slug: true },
  });

  console.log(`Total infographics with locale='ar': ${infographics.length}\n`);

  const updates: Record<string, string[]> = {
    ar: [], en: [], fr: [], es: [], tr: [],
  };
  const samples: Record<string, string[]> = { ar: [], en: [], fr: [], es: [], tr: [] };

  for (const ig of infographics) {
    const detected = detectLocale(ig.title, ig.slides);
    if (detected !== 'ar') {
      updates[detected].push(ig.id);
      if (samples[detected].length < 3) {
        samples[detected].push(ig.title.slice(0, 60));
      }
    } else {
      updates.ar.push(ig.id);
    }
  }

  console.log('Detection results:');
  for (const [locale, ids] of Object.entries(updates)) {
    console.log(`  ${locale}: ${ids.length} infographics`);
    if (samples[locale]) {
      for (const s of samples[locale]) {
        console.log(`    → "${s}..."`);
      }
    }
  }

  // Perform updates
  console.log('\nUpdating database...');
  let totalUpdated = 0;
  for (const [locale, ids] of Object.entries(updates)) {
    if (locale === 'ar' || ids.length === 0) continue;
    const result = await db.infographic.updateMany({
      where: { id: { in: ids } },
      data: { locale },
    });
    console.log(`  Updated ${result.count} infographics → locale='${locale}'`);
    totalUpdated += result.count;
  }

  console.log(`\n✓ Migration complete. ${totalUpdated} infographics reclassified.`);
  console.log(`  Remaining as 'ar': ${updates.ar.length}`);

  // Verify
  const verifyCounts = await db.infographic.groupBy({
    by: ['locale'],
    _count: true,
  });
  console.log('\nFinal locale distribution:');
  for (const v of verifyCounts) {
    console.log(`  ${v.locale}: ${v._count}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
