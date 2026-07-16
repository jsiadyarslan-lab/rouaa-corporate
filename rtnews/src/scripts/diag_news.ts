import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNews() {
  try {
    const total = await prisma.newsItem.count();
    const published = await prisma.newsItem.count({ where: { isPublished: true } });
    const ready = await prisma.newsItem.count({ where: { isReady: true } });
    const latest = await prisma.newsItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, isPublished: true, isReady: true, processingStage: true }
    });

    console.log('--- DB DIAGNOSIS ---');
    console.log('Total News:', total);
    console.log('Published:', published);
    console.log('Ready:', ready);
    console.log('Latest 5 items:', JSON.stringify(latest, null, 2));
    
    if (total === 0) {
      console.log('WARNING: DATABASE IS EMPTY!');
    }
  } catch (err: any) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkNews();
