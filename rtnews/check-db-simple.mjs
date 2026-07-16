import pg from 'pg';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const { Client } = pg;

// Transaction mode pooler - simple queries only, no prepared statements
const client = new Client({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.esghffynnmpeypnfsrbf',
  password: 'bM6jZ00bLE1xxNbX',
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  // Transaction mode pooler: no prepared statements
  options: '-c statement_timeout=20000',
});

async function check() {
  try {
    console.log('Connecting to Supabase transaction mode (port 6543)...');
    await client.connect();
    console.log('Connected!');
    
    // Simplest possible query
    const test = await client.query('SELECT 1');
    console.log('Basic query OK');

    const total = await client.query('SELECT count(*) FROM "NewsItem"');
    console.log('Total NewsItem:', total.rows[0].count);

    const byLocale = await client.query('SELECT locale, count(*) FROM "NewsItem" GROUP BY locale ORDER BY count DESC');
    console.log('By locale:');
    for (const r of byLocale.rows) console.log(`  ${r.locale}: ${r.count}`);

    const pub = await client.query('SELECT count(*) FROM "NewsItem" WHERE "isPublished" = true AND "isReady" = true');
    console.log('Published & ready:', pub.rows[0].count);
    
    const dbSize = await client.query('SELECT pg_size_pretty(pg_database_size(current_database()))');
    console.log('DB size:', dbSize.rows[0].pg_size_pretty);

    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log('\nTables (' + tables.rows.length + '):');
    for (const row of tables.rows) {
      try {
        const cnt = await client.query('SELECT count(*) FROM "' + row.tablename + '"');
        console.log('  ' + row.tablename + ': ' + cnt.rows[0].count);
      } catch(e) {
        console.log('  ' + row.tablename + ': error');
      }
    }

    // Active connections
    const conns = await client.query("SELECT count(*) as total, state FROM pg_stat_activity WHERE datname = 'postgres' GROUP BY state");
    console.log('\nActive connections:', conns.rows);

  } catch(e) {
    console.error('ERROR:', e.message?.slice(0, 500));
  }
  await client.end().catch(() => {});
}

check();
