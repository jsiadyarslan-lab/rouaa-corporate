import pg from 'pg';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const { Client } = pg;

// Session mode (port 5432 on pooler) for DDL and larger queries
const client = new Client({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.esghffynnmpeypnfsrbf',
  password: 'bM6jZ00bLE1xxNbX',
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 25000,
});

async function check() {
  try {
    console.log('Connecting to Supabase pooler session mode (port 5432)...');
    await client.connect();
    console.log('Connected!');
    
    // Simple query first
    const test = await client.query('SELECT 1 as ok');
    console.log('Query test OK');

    const total = await client.query('SELECT count(*) as total FROM "NewsItem"');
    console.log('Total NewsItem:', total.rows[0].total);
    
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
        console.log(`  ${row.tablename}: ${cnt.rows[0].c}`);
      } catch(e) {
        console.log(`  ${row.tablename}: error`);
      }
    }
    
  } catch(e) {
    console.error('ERROR:', e.message?.slice(0, 500));
  }
  await client.end();
}

check();
