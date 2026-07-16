import pg from 'pg';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function main() {
  const client = new pg.Client({
    host: 'aws-1-eu-west-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.esghffynnmpeypnfsrbf',
    password: 'bM6jZ00bLE1xxNbX',
    connectionTimeoutMillis: 15000,
  });
  
  client.on('error', (e) => console.log('Client error:', e.code, e.message?.slice(0,150)));
  
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected! Trying SELECT 1...');
    const r = await client.query('SELECT 1 as x');
    console.log('Result:', r.rows);
    
    // Try a real query
    const cnt = await client.query('SELECT count(*) FROM "NewsItem"');
    console.log('NewsItem count:', cnt.rows[0].count);
    
  } catch(e: any) {
    console.error('Failed:', e.code, '|', e.message?.slice(0, 300));
  }
  await client.end().catch(()=>{});
}

main();
