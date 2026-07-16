// ═══════════════════════════════════════════════════════════════
// Agency Service — Day 1: Migration Check Query (READ-ONLY)
// ═══════════════════════════════════════════════════════════════
// Purpose: Check for duplicate (url, locale) pairs in NewsItem
// before adding @@unique([url, locale]) constraint.
//
// This script is READ-ONLY — it does NOT modify any data.
// Run: node scripts/agency/check-url-duplicates.mjs
// ═══════════════════════════════════════════════════════════════

import pg from 'pg';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 
      'postgresql://postgres.esghffynnmpeypnfsrbf:bM6jZ00bLE1xxNbX@db.esghffynnmpeypnfsrbf.supabase.co:5432/postgres',
    connectionTimeoutMillis: 15000,
  });

  client.on('error', (e) => console.error('[DB Client error]', e.code, e.message?.slice(0, 150)));

  try {
    console.log('[1/4] Connecting to Postgres...');
    await client.connect();
    console.log('      ✓ Connected');

    // ─── Check 1: Total NewsItem count ───────────────────
    console.log('\n[2/4] Counting total NewsItem rows...');
    const total = await client.query('SELECT count(*) FROM "NewsItem"');
    console.log(`      ✓ Total NewsItem rows: ${total.rows[0].count}`);

    // ─── Check 2: Rows with non-empty url ────────────────
    console.log('\n[3/4] Counting rows with non-empty url...');
    const withUrl = await client.query(`SELECT count(*) FROM "NewsItem" WHERE url != '' AND url IS NOT NULL`);
    console.log(`      ✓ Rows with url: ${withUrl.rows[0].count}`);

    // ─── Check 3: Duplicate (url, locale) pairs ──────────
    console.log('\n[4/4] Checking for duplicate (url, locale) pairs...');
    const duplicates = await client.query(`
      SELECT url, locale, COUNT(*) as dup_count
      FROM "NewsItem" 
      WHERE url != '' AND url IS NOT NULL
      GROUP BY url, locale 
      HAVING COUNT(*) > 1
      ORDER BY dup_count DESC
      LIMIT 20
    `);

    if (duplicates.rows.length === 0) {
      console.log('      ✓ NO duplicates found — safe to add @@unique([url, locale]) constraint');
      console.log('\n═══ RESULT: PASS ═══');
      console.log('Migration can proceed safely.');
    } else {
      console.log(`      ⚠️  FOUND ${duplicates.rows.length} duplicate (url, locale) pairs (showing top 20):`);
      console.log('');
      for (const row of duplicates.rows) {
        console.log(`        url=${row.url.slice(0, 60)}... | locale=${row.locale} | count=${row.dup_count}`);
      }
      
      // Get total count of duplicate rows (not just distinct pairs)
      const totalDupRows = await client.query(`
        SELECT COUNT(*) as total FROM (
          SELECT url, locale 
          FROM "NewsItem" 
          WHERE url != '' AND url IS NOT NULL
          GROUP BY url, locale 
          HAVING COUNT(*) > 1
        ) dups
      `);
      console.log(`\n      Total duplicate pairs: ${totalDupRows.rows[0].total}`);
      console.log('\n═══ RESULT: FAIL ═══');
      console.log('Must clean duplicates BEFORE adding constraint.');
      console.log('Suggested cleanup: keep the most recent, delete older duplicates.');
    }

  } catch (e) {
    console.error('\n═══ RESULT: ERROR ═══');
    console.error('Failed:', e.code, '|', e.message?.slice(0, 300));
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
