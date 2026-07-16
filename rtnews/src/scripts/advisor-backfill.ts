// ─── سكريبت توليد التوصيات لجميع المستخدمين ──────────────
// npm run advisor:backfill
// يولّد توصيات لجميع المستخدمين بناءً على آخر 30 تقريراً

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Advisor Backfill Script ===');
  console.log('Generating recommendations for all active users...\n');

  const startTime = Date.now();

  try {
    // جلب المستخدمين النشطين
    const activeProfiles = await prisma.userProfile.findMany({
      where: {
        onboardingComplete: true,
        advisorEnabled: true,
      },
      select: { userId: true, lastAdvisorRun: true },
    });

    console.log(`Found ${activeProfiles.length} active profiles`);

    let successCount = 0;
    let failCount = 0;

    for (const profile of activeProfiles) {
      try {
        console.log(`\nProcessing user: ${profile.userId}...`);

        // استدعاء API الداخلي لتوليد التوصيات
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.userId, action: 'generate' }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`  ✓ Generated ${result.count} recommendations`);
          successCount++;
        } else {
          const error = await response.text();
          console.error(`  ✗ Failed: ${error}`);
          failCount++;
        }
      } catch (err: any) {
        console.error(`  ✗ Error: ${err.message}`);
        failCount++;
      }

      // تأخير بين المستخدمين
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const duration = Date.now() - startTime;
    console.log(`\n=== Backfill Complete ===`);
    console.log(`Total: ${activeProfiles.length} users`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  } catch (error: any) {
    console.error('Backfill script error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
