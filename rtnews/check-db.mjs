import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = 'postgresql://postgres.esghffynnmpeypnfsrbf:bM6jZ00bLE1xxNbX@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?connection_limit=1&pool_timeout=30';

const prisma = new PrismaClient({ datasourceUrl: SUPABASE_URL });

async function check() {
  try {
    console.log('--- Supabase DB Check ---');
    
    const total = await prisma.newsItem.count();
    console.log('Total NewsItem articles:', total);
    
    const byLocale = await prisma.newsItem.groupBy({ 
      by: ['locale'], 
      _count: true, 
      orderBy: { _count: { locale: 'desc' } } 
    });
    console.log('By locale:', JSON.stringify(byLocale, null, 2));
    
    const published = await prisma.newsItem.count({ 
      where: { isPublished: true, isReady: true } 
    });
    console.log('Published & ready articles:', published);

    // Check other tables
    const reportCount = await prisma.economicReport.count();
    console.log('EconomicReport count:', reportCount);
    
    const analysisCount = await prisma.marketAnalysis.count();
    console.log('MarketAnalysis count:', analysisCount);
    
    const infographicCount = await prisma.infographic.count();
    console.log('Infographic count:', infographicCount);
    
    const signalCount = await prisma.councilSignal.count();
    console.log('CouncilSignal count:', signalCount);

    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    // Check DB size
    const dbSize = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`;
    console.log('DB size:', dbSize);

    // List all tables and their row counts
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    console.log('\nAll tables:', tables.map(t => t.tablename).join(', '));

  } catch(e) {
    console.error('DB ERROR:', e.message?.slice(0, 500));
  }
  await prisma.$disconnect();
}

check();
