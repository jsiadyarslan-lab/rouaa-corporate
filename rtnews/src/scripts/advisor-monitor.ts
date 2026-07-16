// ─── سكريبت مراجعة التوصيات المنفذة ──────────────────────
// npm run advisor:monitor
// يراجع التوصيات المنفذة ويحدّث الأرباح/الخسائر ومعدلات النجاح

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Advisor Monitor Script ===');
  console.log('Reviewing executed recommendations for all users...\n');

  const startTime = Date.now();

  try {
    // جلب المستخدمين الذين لديهم توصيات منفذة
    const usersWithExecutedRecs = await prisma.personalizedRecommendation.groupBy({
      by: ['userId'],
      where: { feedbackType: 'executed' },
      _count: { id: true },
    });

    console.log(`Found ${usersWithExecutedRecs.length} users with executed recommendations`);

    let totalReviewed = 0;
    let totalPnlUpdated = 0;

    for (const userGroup of usersWithExecutedRecs) {
      try {
        console.log(`\nReviewing user: ${userGroup.userId} (${userGroup._count.id} executed recs)...`);

        // استدعاء API الداخلي للمراجعة
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userGroup.userId, action: 'review-portfolio' }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`  ✓ Reviewed: ${result.reviewedCount}, PnL updated: ${result.updatedPnlCount}`);
          totalReviewed += result.reviewedCount || 0;
          totalPnlUpdated += result.updatedPnlCount || 0;
        } else {
          const error = await response.text();
          console.error(`  ✗ Failed: ${error}`);
        }
      } catch (err: any) {
        console.error(`  ✗ Error: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const duration = Date.now() - startTime;
    console.log(`\n=== Monitor Complete ===`);
    console.log(`Users reviewed: ${usersWithExecutedRecs.length}`);
    console.log(`Recommendations reviewed: ${totalReviewed}`);
    console.log(`PnL updated: ${totalPnlUpdated}`);
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  } catch (error: any) {
    console.error('Monitor script error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
