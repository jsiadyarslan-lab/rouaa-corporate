/**
 * نقل قاعدة بيانات الموقع الإخباري من Supabase إلى Railway
 * V5: محاولات كثيرة مع انتظار طويل — Supabase يحتاج وقت لتحرير pool
 */

const { Client } = require('pg');

const SUPABASE_URL = 'postgresql://postgres.esghffynnmpeypnfsrbf:bM6jZ00bLE1xxNbX@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';
const RAILWAY_URL  = 'postgresql://postgres:ECwmddGzeOxVuViSsKmjZXKnZTNNqVtm@monorail.proxy.rlwy.net:22754/railway';

const TABLES = [
  'site_settings',
  'news_items',
  'news_item_archives',
  'news_fetch_logs',
  'pipeline_runs',
  'agent_logs',
  'economic_reports',
  'market_analyses',
  'market_indicators',
  'infographics',
  'trading_signals',
  'council_briefs',
  'economic_events',
  'calendar_events',
  'reports',
  'report_views',
  'video_reports',
  'telegram_accounts',
  'discussions',
  'discussion_replies',
  'comments',
  'advertisements',
  'bookmarks',
  'notifications',
  'price_alerts',
  'subscriptions',
  'newsletter_subscribers',
  'contact_messages',
  'smart_alerts',
  'api_keys',
  'report_subscriptions',
  'users',
  'accounts',
  'sessions',
  'verification_tokens',
  'passkeys',
  'user_profiles',
  'personalized_recommendations',
];

async function connectWithRetry(url, label, maxRetries = 10) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000,
        query_timeout: 60000,
        statement_timeout: 55000,
      });
      client.on('error', () => {});
      await client.connect();
      await client.query('SELECT 1');
      console.log(`✅ ${label} متصل (محاولة ${attempt})`);
      return client;
    } catch(e) {
      console.log(`⚠️  ${label} محاولة ${attempt}/${maxRetries}: ${e.code || e.message?.slice(0,60)}`);
      if (attempt < maxRetries) {
        const delay = Math.min(attempt * 10000, 60000); // 10s, 20s, 30s... max 60s
        console.log(`   انتظار ${delay/1000} ثانية...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`فشل الاتصال بـ ${label}`);
}

async function migrate() {
  console.log('🚀 بدء النقل V5\n');

  const dst = await connectWithRetry(RAILWAY_URL, 'Railway', 3);
  const src = await connectWithRetry(SUPABASE_URL, 'Supabase', 10);

  try {
    await dst.query('SET session_replication_role = replica;');
    let totalRows = 0;

    for (const table of TABLES) {
      try {
        const countRes = await src.query(`SELECT COUNT(*) FROM "${table}"`);
        const count = parseInt(countRes.rows[0].count);
        if (count === 0) { console.log(`⏭️  ${table}: فارغ`); continue; }

        const dstCheck = await dst.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '${table}')`);
        if (!dstCheck.rows[0].exists) { console.log(`⚠️  ${table}: غير موجود في Railway`); continue; }

        console.log(`📦 ${table}: ${count.toLocaleString()} صف...`);
        await dst.query(`DELETE FROM "${table}"`);

        const BATCH = 200;
        let offset = 0;
        let inserted = 0;

        while (offset < count) {
          const rows = await src.query(`SELECT * FROM "${table}" ORDER BY 1 LIMIT ${BATCH} OFFSET ${offset}`);
          if (rows.rows.length === 0) break;
          for (const row of rows.rows) {
            const keys = Object.keys(row).map(k => `"${k}"`).join(', ');
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            try { await dst.query(`INSERT INTO "${table}" (${keys}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values); inserted++; } catch (e) {}
          }
          offset += BATCH;
          process.stdout.write(`\r   ${Math.min(offset, count)}/${count} (${inserted} منقول)`);
        }
        console.log(`\r✅ ${table}: ${inserted.toLocaleString()} منقول                 `);
        totalRows += inserted;
      } catch (e) {
        console.log(`\n❌ ${table}: ${e.code || ''} ${e.message?.slice(0, 120)}`);
      }
    }

    await dst.query('SET session_replication_role = DEFAULT;');
    console.log(`\n🎉 اكتمل النقل: ${totalRows.toLocaleString()} صف\n`);

    const checkTables = ['news_items', 'economic_reports', 'market_analyses', 'infographics', 'trading_signals'];
    console.log('🔍 تحقق:');
    for (const t of checkTables) {
      try {
        const s = parseInt((await src.query(`SELECT COUNT(*) FROM "${t}"`)).rows[0].count);
        const d = parseInt((await dst.query(`SELECT COUNT(*) FROM "${t}"`)).rows[0].count);
        console.log(`   ${s === d ? '✅' : '⚠️'} ${t}: ${s} → ${d}`);
      } catch(e) {}
    }
  } catch (e) {
    console.error('❌ خطأ:', e.message?.slice(0, 300));
  } finally {
    await src.end().catch(() => {});
    await dst.end().catch(() => {});
  }
}

migrate();
