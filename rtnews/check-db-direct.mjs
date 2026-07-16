import pg from 'pg';
const { Client } = pg;

// Try direct connection (port 5432) instead of pooler (port 6543)
const client = new Client({
  connectionString: 'postgresql://postgres.esghffynnmpeypnfsrbf:bM6jZ00bLE1xxNbX@db.esghffynnmpeypnfsrbf.supabase.co:5432/postgres',
  connectionTimeoutMillis: 15000,
  query_timeout: 15000,
});

async function check() {
  try {
    console.log('Connecting to Supabase direct (port 5432)...');
    await client.connect();
    console.log('Connected!');
    
    const total = await client.query('SELECT count(*) as total FROM "NewsItem"');
    console.log('Total NewsItem articles:', total.rows[0].total);
    
    const byLocale = await client.query('SELECT locale, count(*) as count FROM "NewsItem" GROUP BY locale ORDER BY count DESC');
    console.log('By locale:', byLocale.rows);
    
    const published = await client.query('SELECT count(*) as total FROM "NewsItem" WHERE "isPublished" = true AND "isReady" = true');
    console.log('Published & ready:', published.rows[0].total);
    
    const dbSize = await client.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
    console.log('DB size:', dbSize.rows[0].size);

    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log('\nAll tables:', tables.rows.map(r => r.tablename).join(', '));
    console.log('Total tables:', tables.rows.length);
    
    // Row counts for important tables
    for (const row of tables.rows) {
      try {
        const cnt = await client.query(`SELECT count(*) as c FROM "${row.tablename}"`);
        console.log(`  ${row.tablename}: ${cnt.rows[0].c} rows`);
      } catch(e) {
        console.log(`  ${row.tablename}: (error)`);
      }
    }
    
  } catch(e) {
    console.error('CONNECTION ERROR:', e.message?.slice(0, 500));
  }
  await client.end();
}

check();
