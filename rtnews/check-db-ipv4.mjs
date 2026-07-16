import pg from 'pg';
import dns from 'dns';

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

const { Client } = pg;

// Try pooler with longer timeout
const client = new Client({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.esghffynnmpeypnfsrbf',
  password: 'bM6jZ00bLE1xxNbX',
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
});

async function check() {
  try {
    console.log('Connecting to Supabase pooler (IPv4, port 6543)...');
    await client.connect();
    console.log('Connected!');
    
    // First check: can we even query?
    const test = await client.query('SELECT 1 as ok');
    console.log('Query test:', test.rows);

    const total = await client.query('SELECT count(*) as total FROM "NewsItem"');
    console.log('Total NewsItem articles:', total.rows[0].total);
    
    const byLocale = await client.query('SELECT locale, count(*) as count FROM "NewsItem" GROUP BY locale ORDER BY count DESC');
    console.log('By locale:', byLocale.rows);
    
    const published = await client.query('SELECT count(*) as total FROM "NewsItem" WHERE "isPublished" = true AND "isReady" = true');
    console.log('Published & ready:', published.rows[0].total);
    
    const dbSize = await client.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
    console.log('DB size:', dbSize.rows[0].size);

    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log('\nAll tables (' + tables.rows.length + '):');
    
    for (const row of tables.rows) {
      try {
        const cnt = await client.query(`SELECT count(*) as c FROM "${row.tablename}"`);
        console.log(`  ${row.tablename}: ${cnt.rows[0].c} rows`);
      } catch(e) {
        console.log(`  ${row.tablename}: (error: ${e.message?.slice(0,80)})`);
      }
    }
    
  } catch(e) {
    console.error('ERROR:', e.message?.slice(0, 500));
  }
  await client.end();
}

check();
