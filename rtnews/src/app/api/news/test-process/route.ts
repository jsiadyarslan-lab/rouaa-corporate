// ─── Pipeline Process Test Endpoint ────────────────────────────
// Manually triggers processing of ONE article and returns detailed results.
// This helps debug why the pipeline isn't processing articles.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET() {
  const report: any = { steps: {}, timestamp: new Date().toISOString() };

  try {
    // Step 1: Find an unprocessed article
    const article = await db.newsItem.findFirst({
      where: {
        isReady: false,
        retryCount: { lt: 10 },
        processingStage: 'fetched',
      },
      orderBy: { fetchedAt: 'asc' },
      select: {
        id: true, title: true, titleAr: true, summary: true, summaryAr: true,
        url: true, source: true, category: true, originalLanguage: true,
        processingStage: true, retryCount: true, imageUrl: true,
        // EGRESS FIX: removed generatedImage from select — use processingStage to check image existence
        contentAr: true, aiAnalysis: true, slug: true,
      },
    });

    if (!article) {
      report.error = 'No articles at fetched stage to process';
      return NextResponse.json(report);
    }

    report.article = {
      id: article.id,
      title: article.title?.slice(0, 60),
      titleAr: article.titleAr?.slice(0, 60),
      processingStage: article.processingStage,
      originalLanguage: article.originalLanguage,
      hasImage: !!article.imageUrl, // EGRESS FIX: use imageUrl instead of generatedImage
    };

    // Step 2: Test AI provider availability
    try {
      const { getProviderStatus } = await import('@/lib/ai-provider');
      const providers = getProviderStatus();
      report.aiProviders = providers.map((p: any) => ({
        provider: p.provider,
        available: p.available,
        model: p.model,
      }));
    } catch (err: any) {
      report.aiProviders = { error: err.message };
    }

    // Step 3: Test translation
    if (!article.titleAr && article.originalLanguage !== 'ar') {
      try {
        const { translateToArabic } = await import('@/lib/ai-provider');
        report.steps.translation = { status: 'trying...' };
        
        const translation = await Promise.race([
          translateToArabic(article.title, article.summary || ''),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 30000))
        ]) as any;

        report.steps.translation = {
          status: 'success',
          translatedTitle: translation.translatedTitle?.slice(0, 60),
          translatedSummary: translation.translatedSummary?.slice(0, 60),
        };
      } catch (err: any) {
        report.steps.translation = {
          status: 'failed',
          error: err.message?.slice(0, 200),
        };
      }
    }

    // Step 4: Test AI analysis
    try {
      const { chatCompletion } = await import('@/lib/ai-provider');
      report.steps.aiAnalysis = { status: 'trying...' };
      
      const result = await Promise.race([
        chatCompletion(
          [
            { role: 'system', content: 'أجب بكلمة واحدة: نعم' },
            { role: 'user', content: 'هل أنت متاح؟' },
          ],
          { temperature: 0.1, maxTokens: 10, priority: 'generation' }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 30000))
      ]) as any;

      report.steps.aiAnalysis = {
        status: 'success',
        response: result.content?.slice(0, 100),
      };
    } catch (err: any) {
      report.steps.aiAnalysis = {
        status: 'failed',
        error: err.message?.slice(0, 200),
      };
    }

    // Step 5: Try to get pipeline orchestrator stats
    try {
      const { getOrchestratorStats } = await import('@/lib/pipeline/orchestrator');
      const stats = await getOrchestratorStats();
      report.pipelineWorker = stats;
    } catch (err: any) {
      report.pipelineWorker = { error: err.message?.slice(0, 200) };
    }

  } catch (err: any) {
    report.fatalError = err.message;
  }

  return NextResponse.json(report);
}
