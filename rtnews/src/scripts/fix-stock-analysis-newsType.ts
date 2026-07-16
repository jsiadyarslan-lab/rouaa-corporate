// V374: Fix existing stock analysis NewsItem records
// Changes newsType from 'article' to 'stock_analysis' for all items
// created by the stock-analysis-pipeline.
// This ensures they are properly filtered out of news feeds.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStockAnalysisNewsType() {
  try {
    console.log('[V374 Migration] Updating stock analysis NewsItem records...');

    // Find all stock analysis items that still have newsType='article'
    const result = await prisma.newsItem.updateMany({
      where: {
        source: 'stock-analysis-pipeline',
        newsType: 'article',
      },
      data: {
        newsType: 'stock_analysis',
      },
    });

    console.log(`[V374 Migration] Updated ${result.count} stock analysis records from newsType='article' to 'stock_analysis'`);

    // Also check for any stock analysis items with other newsTypes
    const otherStockItems = await prisma.newsItem.count({
      where: {
        source: 'stock-analysis-pipeline',
        newsType: { not: 'stock_analysis' },
      },
    });

    if (otherStockItems > 0) {
      const fixResult = await prisma.newsItem.updateMany({
        where: {
          source: 'stock-analysis-pipeline',
          newsType: { not: 'stock_analysis' },
        },
        data: {
          newsType: 'stock_analysis',
        },
      });
      console.log(`[V374 Migration] Fixed ${fixResult.count} additional stock analysis records`);
    }

    // Summary
    const totalStockAnalyses = await prisma.newsItem.count({
      where: { source: 'stock-analysis-pipeline' },
    });
    console.log(`[V374 Migration] Total stock analysis NewsItem records: ${totalStockAnalyses}`);
    console.log('[V374 Migration] Done! Stock analyses will no longer appear in news feeds.');
  } catch (err: any) {
    console.error('[V374 Migration] Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixStockAnalysisNewsType();
