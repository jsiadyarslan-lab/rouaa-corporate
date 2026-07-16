// ─── Admin Pipeline API Route V47 ───────────────────────────
// GET: Get pipeline status and queue statistics (supports ?section= parameter)
// POST: Control pipeline (start/stop/pause/resume/reset)
// V47: Added in-handler auth check + sanitized error responses

import { NextRequest, NextResponse } from 'next/server';
import { getOrchestratorStats, startOrchestrator, stopOrchestrator, pauseOrchestrator, resumeOrchestrator, ensureRunning } from '@/lib/pipeline/orchestrator';
import { getQueueStats, resetStuckRetries, purgeOldFailures } from '@/lib/pipeline/queue/job-manager';
import { resetBedrockCircuitBreaker, resetGeminiQuota, getProviderStatus } from '@/lib/ai-provider';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// GET with section support
export async function GET(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'all';

    if (section === 'providers') {
      return await getProvidersSection();
    }

    if (section === 'jobs') {
      return await getJobsSection();
    }

    // section === 'overview' or 'all'
    return await getOverviewSection();
  } catch (err) {
    return apiError(err, 'جلب بيانات Pipeline');
  }
}

async function getOverviewSection() {
  const [orchestratorStats, queueStats] = await Promise.all([
    getOrchestratorStats(),
    getQueueStats(),
  ]);

  // Count articles by processing stage
  const stageCounts = await db.newsItem.groupBy({
    by: ['processingStage'],
    _count: { id: true },
  });

  const byStage: Record<string, number> = {};
  for (const result of stageCounts) {
    byStage[result.processingStage || 'unknown'] = result._count.id;
  }

  // Transform into the format the pipeline page expects
  const pipeline = {
    version: 'V47-Agent',
    isRunning: orchestratorStats.isRunning,
    workerStarted: orchestratorStats.isRunning,
    cycleCount: orchestratorStats.cycleCount,
    totalPublished: orchestratorStats.totalPublished,
    totalFailed: orchestratorStats.totalErrors,
    lastProcessError: orchestratorStats.lastError || '',
    consecutiveErrors: 0,
    lastSuccessfulCycle: orchestratorStats.lastCycleTime,
    lastCycleStart: orchestratorStats.lastCycleTime,
  };

  const queue = {
    byType: {} as Record<string, { pending: number; running: number; done: number; failed: number }>,
    totalPending: queueStats.byStage['fetched'] || 0,
    totalRunning: 0,
    totalDone24h: queueStats.ready,
    totalFailed24h: queueStats.failed,
    avgDurationMs: 0,
  };

  // V123: Fixed stage mapping — rejected was wrongly mapped to 'publish',
  // causing rejected articles to show as 'جاري النشر' (publishing in progress).
  const stageToType: Record<string, string> = {
    fetched: 'fetch',
    content_loaded: 'translate',  // unified processor stage
    translated: 'translate',
    analyzed: 'analyze',
    imaged: 'image',  // articles with images generated, waiting for publisher
    rejected: 'reject',  // V123: rejected articles shown as rejected, NOT as publishing
  };
  for (const [stage, count] of Object.entries(queueStats.byStage)) {
    const type = stageToType[stage] || stage;
    queue.byType[type] = {
      pending: count,
      running: 0,
      done: 0,
      failed: 0,
    };
  }

  const articles = {
    total: queueStats.total,
    ready: queueStats.ready,
    pending: queueStats.total - queueStats.ready,
    fetched: byStage['fetched'] || 0,
    contentLoaded: byStage['content_loaded'] || 0,
    translated: byStage['translated'] || 0,
    analyzed: byStage['analyzed'] || 0,
    imaged: byStage['imaged'] || 0,
    rejected: byStage['rejected'] || 0,  // V123: Show rejected count
  };

  return NextResponse.json({
    pipeline,
    queue,
    articles,
    timestamp: new Date().toISOString(),
  });
}

async function getProvidersSection() {
  try {
    // Get AI provider usage from the last 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentArticles = await db.newsItem.findMany({
      where: {
        updatedAt: { gte: cutoff },
        processingStage: { not: 'fetched' },
      },
      select: {
        id: true,
        processingStage: true,
        titleAr: true,
        contentAr: true,
        // EGRESS FIX: removed generatedImage from select — use processingStage as proxy
        aiAnalysis: true,
        updatedAt: true,
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
    });

    const providers: Record<string, { calls: number; avgDurationMs: number; estimatedCost: number; byType: Record<string, number> }> = {};

    const translated = recentArticles.filter(a => a.titleAr).length;
    const analyzed = recentArticles.filter(a => a.aiAnalysis).length;
    const imaged = recentArticles.filter(a => a.processingStage === 'imaged').length; // EGRESS FIX: use processingStage

    const defaultProvider = 'bedrock';  // V123: Bedrock is the primary provider
    if (!providers[defaultProvider]) {
      providers[defaultProvider] = { calls: 0, avgDurationMs: 2500, estimatedCost: 0, byType: {} };
    }

    if (translated > 0) {
      providers[defaultProvider].calls += translated;
      providers[defaultProvider].byType['translate'] = translated;
    }
    if (analyzed > 0) {
      providers[defaultProvider].calls += analyzed;
      providers[defaultProvider].byType['analyze'] = analyzed;
    }
    if (imaged > 0) {
      providers[defaultProvider].calls += imaged;
      providers[defaultProvider].byType['image'] = imaged;
    }

    const fallbackProviders = ['glm', 'gemini', 'groq', 'ollama', 'cerebras', 'mistral', 'nvidia'];
    for (const name of fallbackProviders) {
      if (!providers[name]) {
        providers[name] = { calls: 0, avgDurationMs: 0, estimatedCost: 0, byType: {} };
      }
    }

    const totalCalls = Object.values(providers).reduce((sum, p) => sum + p.calls, 0);

    return NextResponse.json({
      providers,
      totalCalls,
      totalEstimatedCost: 0,
      period: '24 ساعة',
    });
  } catch (err) {
    return NextResponse.json({
      providers: {},
      totalCalls: 0,
      totalEstimatedCost: 0,
      period: '24 ساعة',
    });
  }
}

async function getJobsSection() {
  try {
    const recentArticles = await db.newsItem.findMany({
      where: {
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        processingStage: true,
        retryCount: true,
        isReady: true,
        isPublished: true,
        title: true,
        titleAr: true,
        fetchedAt: true,
        updatedAt: true,
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    const jobs = recentArticles.map(article => {
      // V123: Fixed stage→type mapping — rejected was wrongly mapped to 'publish'
      // causing dozens of rejected articles to show as 'جاري النشر' (publishing in progress)
      const type = article.processingStage === 'fetched' ? 'fetch'
        : article.processingStage === 'content_loaded' ? 'translate'
        : article.processingStage === 'translated' ? 'translate'
        : article.processingStage === 'analyzed' ? 'analyze'
        : article.processingStage === 'imaged' ? 'image'  // imaged = has image, waiting for publisher
        : article.processingStage === 'rejected' ? 'reject'  // V123: rejected ≠ publishing!
        : 'unknown';

      // V123: Fixed status logic — articles in queue show as 'pending', NOT 'running'.
      // Only truly published articles show as 'done'. Articles that haven't been
      // picked up yet are 'pending', not 'running' (which confused the dashboard).
      let status = 'pending';
      if (article.isReady && article.isPublished) {
        status = 'done';
      } else if (article.processingStage === 'rejected') {
        status = 'failed';  // V123: rejected = failed, not running
      } else if (article.retryCount >= 15) {  // MAX_RETRY_COUNT from config
        status = 'failed';
      } else if (article.processingStage === 'fetched' && !article.titleAr) {
        status = 'pending';  // Still in fetched, no processing started
      } else {
        status = 'pending';  // V123: In queue waiting to be processed = pending
      }

      return {
        id: article.id,
        type,
        articleId: article.id,
        status,
        priority: 0,
        attempts: article.retryCount + 1,
        maxAttempts: 3,
        lastError: article.retryCount >= 15 ? 'Max retries exceeded' : undefined,
        providerUsed: 'bedrock',  // V123: Bedrock is the primary provider
        durationMs: article.fetchedAt && article.updatedAt
          ? Math.max(0, new Date(article.updatedAt).getTime() - new Date(article.fetchedAt).getTime())
          : undefined,
        createdAt: article.fetchedAt?.toISOString() || article.updatedAt.toISOString(),
        startedAt: article.fetchedAt?.toISOString() || undefined,
        completedAt: article.isReady ? article.updatedAt.toISOString() : undefined,
      };
    });

    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ jobs: [] });
  }
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'status';

    switch (action) {
      case 'start': {
        const result = ensureRunning();  // V52: Use ensureRunning for stale detection
        console.log(`[Pipeline API] Orchestrator ${result.restarted ? 'restarted' : 'started'} by admin`);
        return NextResponse.json({ status: 'ok', message: result.restarted ? 'Pipeline restarted (was stale)' : 'Pipeline started' });
      }

      // Language-specific pipeline controls
      case 'start-en': {
        try {
          const { ensureEnRunning } = await import('@/lib/pipeline/en-orchestrator');
          const result = ensureEnRunning();
          console.log(`[Pipeline API] EN Orchestrator ${result.restarted ? 'restarted' : 'started'} by admin`);
          return NextResponse.json({ success: true, message: result.restarted ? 'English pipeline restarted (was stale)' : 'English pipeline started' });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: `Failed to start English pipeline: ${err.message}` }, { status: 500 });
        }
      }
      case 'start-fr': {
        try {
          const { ensureFrRunning } = await import('@/lib/pipeline/fr-orchestrator');
          const result = ensureFrRunning();
          console.log(`[Pipeline API] FR Orchestrator ${result.restarted ? 'restarted' : 'started'} by admin`);
          return NextResponse.json({ success: true, message: result.restarted ? 'French pipeline restarted (was stale)' : 'French pipeline started' });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: `Failed to start French pipeline: ${err.message}` }, { status: 500 });
        }
      }
      case 'start-tr': {
        try {
          const { ensureTrRunning } = await import('@/lib/pipeline/tr-orchestrator');
          const result = ensureTrRunning();
          console.log(`[Pipeline API] TR Orchestrator ${result.restarted ? 'restarted' : 'started'} by admin`);
          return NextResponse.json({ success: true, message: result.restarted ? 'Turkish pipeline restarted (was stale)' : 'Turkish pipeline started' });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: `Failed to start Turkish pipeline: ${err.message}` }, { status: 500 });
        }
      }

      // V1088: Arabic pipeline — uses main orchestrator (ensureRunning)
      case 'start-ar': {
        try {
          const result = ensureRunning();
          console.log(`[Pipeline API] AR Orchestrator ${result.restarted ? 'restarted' : 'started'} by admin`);
          return NextResponse.json({ success: true, message: result.restarted ? 'Arabic pipeline restarted (was stale)' : 'Arabic pipeline started' });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: `Failed to start Arabic pipeline: ${err.message}` }, { status: 500 });
        }
      }

      // V1088: Spanish pipeline
      case 'start-es': {
        try {
          const { ensureEsRunning } = await import('@/lib/pipeline/es-orchestrator');
          const result = ensureEsRunning();
          console.log(`[Pipeline API] ES Orchestrator ${result.restarted ? 'restarted' : 'started'} by admin`);
          return NextResponse.json({ success: true, message: result.restarted ? 'Spanish pipeline restarted (was stale)' : 'Spanish pipeline started' });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: `Failed to start Spanish pipeline: ${err.message}` }, { status: 500 });
        }
      }

      case 'stop': {
        stopOrchestrator();
        console.log('[Pipeline API] Orchestrator stopped by admin');
        return NextResponse.json({ status: 'ok', message: 'Pipeline stopped' });
      }

      case 'pause': {
        pauseOrchestrator();
        console.log('[Pipeline API] Orchestrator paused by admin');
        return NextResponse.json({ status: 'ok', message: 'Pipeline paused' });
      }

      case 'resume': {
        resumeOrchestrator();
        console.log('[Pipeline API] Orchestrator resumed by admin');
        return NextResponse.json({ status: 'ok', message: 'Pipeline resumed' });
      }

      case 'reset-retries': {
        const resetCount = await resetStuckRetries();
        console.log(`[Pipeline API] Reset ${resetCount} retries by admin`);
        return NextResponse.json({ status: 'ok', message: `Reset ${resetCount} articles for retry`, count: resetCount });
      }

      case 'purge-failures': {
        const purgedCount = await purgeOldFailures();
        console.log(`[Pipeline API] Purged ${purgedCount} failures by admin`);
        return NextResponse.json({ status: 'ok', message: `Purged ${purgedCount} old failures`, count: purgedCount });
      }

      // V94: Reset Bedrock circuit breaker without restarting the whole app
      case 'reset-bedrock': {
        resetBedrockCircuitBreaker();
        const providerStatus = getProviderStatus();
        const bedrockProvider = providerStatus.find(p => p.provider === 'bedrock');
        console.log('[Pipeline API] Bedrock circuit breaker reset by admin. Bedrock available:', bedrockProvider?.available);
        return NextResponse.json({
          status: 'ok',
          message: 'Bedrock circuit breaker reset — will retry on next AI call',
          bedrock: { available: bedrockProvider?.available, model: bedrockProvider?.model },
        });
      }

      // V258: Reset Gemini quota without restarting the whole app
      case 'reset-gemini': {
        resetGeminiQuota();
        const providerStatus = getProviderStatus();
        const geminiProvider = providerStatus.find(p => p.provider === 'gemini');
        console.log('[Pipeline API] Gemini quota reset by admin. Gemini available:', geminiProvider?.available);
        return NextResponse.json({
          status: 'ok',
          message: 'Gemini quota reset — will retry on next AI call',
          gemini: { available: geminiProvider?.available, model: geminiProvider?.model },
        });
      }

      // V258: Reset ALL AI providers (Bedrock circuit breaker + Gemini quota)
      case 'reset-all-ai': {
        resetBedrockCircuitBreaker();
        resetGeminiQuota();
        const providerStatus = getProviderStatus();
        console.log('[Pipeline API] All AI providers reset by admin');
        return NextResponse.json({
          status: 'ok',
          message: 'All AI providers reset — Bedrock circuit breaker + Gemini quota cleared',
          providers: providerStatus.map(p => ({ provider: p.provider, available: p.available, model: p.model })),
        });
      }

      // V94: Get detailed AI provider status
      case 'providers-status': {
        const providerStatus = getProviderStatus();
        return NextResponse.json({
          status: 'ok',
          providers: providerStatus,
        });
      }

      case 'status':
      default: {
        const [orchestratorStats, queueStats] = await Promise.all([
          getOrchestratorStats(),
          getQueueStats(),
        ]);
        return NextResponse.json({
          status: 'ok',
          orchestrator: orchestratorStats,
          queue: queueStats,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    return apiError(err, 'تحكم Pipeline');
  }
}
