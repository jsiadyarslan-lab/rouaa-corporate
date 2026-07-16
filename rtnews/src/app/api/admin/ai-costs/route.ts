// ─── AI Cost Tracking API V47 ────────────────────────────────
// Tracks AI usage and estimates costs per provider
// V47: Added in-handler auth check + sanitized error responses

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

// ─── Provider Pricing (per 1M tokens) ───────────────────────
// Based on publicly listed prices as of 2025
const PROVIDER_PRICING: Record<string, {
  name: string;
  nameAr: string;
  inputPer1M: number;  // USD per 1M input tokens
  outputPer1M: number; // USD per 1M output tokens
  imagePerCall: number; // USD per image generation
  freeTier: string;
  color: string;
}> = {
  'z-ai-sdk': {
    name: 'z-ai SDK',
    nameAr: 'z-ai SDK',
    inputPer1M: 0,
    outputPer1M: 0,
    imagePerCall: 0,
    freeTier: 'مجاني بالكامل',
    color: '#00E5FF',
  },
  'glm': {
    name: 'GLM-4 (ZhipuAI)',
    nameAr: 'GLM-4',
    inputPer1M: 0.15,
    outputPer1M: 0.15,
    imagePerCall: 0,
    freeTier: 'طبقة مجانية سخية',
    color: '#8B5CF6',
  },
  'gemini': {
    name: 'Gemini 2.5 Flash',
    nameAr: 'جيميناي 2.5 فلاش',
    inputPer1M: 0.00, // V258: Free tier (Google AI Studio)
    outputPer1M: 0.00,
    imagePerCall: 0,
    freeTier: 'مجاني (~1,500 طلب/يوم)',
    color: '#00C896',
  },
  'groq': {
    name: 'Groq (Llama 70B)',
    nameAr: 'جروك (ليما)',
    inputPer1M: 0.59,
    outputPer1M: 0.79,
    imagePerCall: 0,
    freeTier: 'محدود يومياً',
    color: '#FF6B35',
  },
  'bedrock': {
    name: 'AWS Bedrock (Claude 4.5 Haiku)',
    nameAr: 'بيروك (كلود 4.5 هايكو)',
    inputPer1M: 1.00,
    outputPer1M: 5.00,
    imagePerCall: 0,
    freeTier: 'بدون طبقة مجانية ($1/$5 لكل 1M توكن)',
    color: '#FF9900',
  },
  'ollama': {
    name: 'Ollama (Local)',
    nameAr: 'أولاما (محلي)',
    inputPer1M: 0,
    outputPer1M: 0,
    imagePerCall: 0,
    freeTier: 'مجاني (محلي)',
    color: '#6366F1',
  },
  'hf': {
    name: 'HuggingFace',
    nameAr: 'هاغينغ فيس',
    inputPer1M: 0.40,
    outputPer1M: 0.40,
    imagePerCall: 0,
    freeTier: 'طبقة مجانية محدودة',
    color: '#FFD21E',
  },
  'pollinations': {
    name: 'Pollinations.ai',
    nameAr: 'بولينيشنز',
    inputPer1M: 0,
    outputPer1M: 0,
    imagePerCall: 0,
    freeTier: 'مجاني بالكامل',
    color: '#E879F9',
  },
  'cerebras': {
    name: 'Cerebras',
    nameAr: 'سيبريس',
    inputPer1M: 0,
    outputPer1M: 0,
    imagePerCall: 0,
    freeTier: 'مجاني بالكامل',
    color: '#3BA7F0',
  },
  'mistral': {
    name: 'Mistral',
    nameAr: 'ميسترال',
    inputPer1M: 0.2,
    outputPer1M: 0.6,
    imagePerCall: 0,
    freeTier: 'طبقة مجانية محدودة',
    color: '#FF6B35',
  },
  'nvidia': {
    name: 'NVIDIA NIM',
    nameAr: 'إنفيديا',
    inputPer1M: 0,
    outputPer1M: 0,
    imagePerCall: 0,
    freeTier: 'أرصدة مجانية',
    color: '#76B900',
  },
};

// Estimate tokens from text length (rough: 1 token ~ 4 chars for English, ~2 chars for Arabic)
function estimateTokens(text: string): number {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const otherChars = text.length - arabicChars;
  return Math.ceil(arabicChars / 2 + otherChars / 4);
}

export async function GET(request: Request) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 24h, 7d, 30d, all

    // Calculate date range
    let since: Date | null = null;
    const now = new Date();
    if (period === '24h') since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    else if (period === '7d') since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === '30d') since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ── Get Agent Logs ──
    const whereClause: any = {};
    if (since) whereClause.createdAt = { gte: since };

    const agentLogs = await db.agentLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // ── Get total article counts ──
    const totalArticles = await db.newsItem.count();
    const readyArticles = await db.newsItem.count({ where: { isReady: true } });
    const pendingArticles = await db.newsItem.count({ where: { isReady: false } });

    // ── Get articles with AI analysis ──
    const analyzedArticles = await db.newsItem.count({
      where: {
        aiAnalysis: { not: null },
        ...(since ? { fetchedAt: { gte: since } } : {}),
      },
    });

    // ── Get articles with generated images ──
    const imagedArticles = await db.newsItem.count({
      where: {
        generatedImage: { not: null },
        ...(since ? { fetchedAt: { gte: since } } : {}),
      },
    });

    // ── Get articles with Arabic translations ──
    const translatedArticles = await db.newsItem.count({
      where: {
        titleAr: { not: null },
        ...(since ? { fetchedAt: { gte: since } } : {}),
      },
    });

    // ── Analyze Agent Logs ──
    const providerStats: Record<string, {
      calls: number;
      successCount: number;
      failCount: number;
      totalDuration: number;
      estimatedInputTokens: number;
      estimatedOutputTokens: number;
      estimatedCost: number;
    }> = {};

    // Categorize by agent action type
    const actionCounts: Record<string, number> = {};
    let totalCalls = 0;
    let totalSuccessCalls = 0;
    let totalFailedCalls = 0;

    for (const log of agentLogs) {
      totalCalls++;

      if (log.success) totalSuccessCalls++;
      else totalFailedCalls++;

      // Determine provider from output
      let provider = 'unknown';
      try {
        const output = JSON.parse(log.outputJson || '{}');
        if (output.provider) provider = output.provider;
      } catch {}

      // Also check input for provider info
      if (provider === 'unknown') {
        try {
          const input = JSON.parse(log.inputJson || '{}');
          if (input.provider) provider = input.provider;
        } catch {}
      }

      // Count by action type
      const action = log.action || 'unknown';
      actionCounts[action] = (actionCounts[action] || 0) + 1;

      // Estimate tokens from input/output
      let inputText = '';
      let outputText = '';
      try {
        const input = JSON.parse(log.inputJson || '{}');
        inputText = JSON.stringify(input);
      } catch {
        inputText = log.inputJson || '';
      }
      try {
        const output = JSON.parse(log.outputJson || '{}');
        outputText = output.content || JSON.stringify(output);
      } catch {
        outputText = log.outputJson || '';
      }

      const inputTokens = estimateTokens(inputText);
      const outputTokens = estimateTokens(outputText);

      if (!providerStats[provider]) {
        providerStats[provider] = {
          calls: 0,
          successCount: 0,
          failCount: 0,
          totalDuration: 0,
          estimatedInputTokens: 0,
          estimatedOutputTokens: 0,
          estimatedCost: 0,
        };
      }

      const stats = providerStats[provider];
      stats.calls++;
      if (log.success) stats.successCount++;
      else stats.failCount++;
      stats.totalDuration += log.duration || 0;
      stats.estimatedInputTokens += inputTokens;
      stats.estimatedOutputTokens += outputTokens;
    }

    // ── Calculate estimated costs ──
    // For pipeline-generated content, estimate based on actual article counts
    // since AgentLog may not capture all pipeline operations
    const pipelineEstimates = {
      translations: translatedArticles,
      analyses: analyzedArticles,
      images: imagedArticles,
    };

    // Estimate costs per operation type
    const translationTokensPerCall = { input: 300, output: 200 }; // avg tokens per translation
    const analysisTokensPerCall = { input: 500, output: 800 };   // avg tokens per analysis
    const contentGenTokensPerCall = { input: 400, output: 600 }; // avg tokens per content generation

    // Use z-ai-sdk pricing (free) as primary, then estimate if paid providers were used
    const operationCosts = {
      translation: {
        count: pipelineEstimates.translations,
        estimatedInputTokens: pipelineEstimates.translations * translationTokensPerCall.input,
        estimatedOutputTokens: pipelineEstimates.translations * translationTokensPerCall.output,
        estimatedCost: 0, // Mostly using free providers
      },
      analysis: {
        count: pipelineEstimates.analyses,
        estimatedInputTokens: pipelineEstimates.analyses * analysisTokensPerCall.input,
        estimatedOutputTokens: pipelineEstimates.analyses * analysisTokensPerCall.output,
        estimatedCost: 0,
      },
      contentGeneration: {
        count: pipelineEstimates.analyses, // Same count as analysis for contentAr
        estimatedInputTokens: pipelineEstimates.analyses * contentGenTokensPerCall.input,
        estimatedOutputTokens: pipelineEstimates.analyses * contentGenTokensPerCall.output,
        estimatedCost: 0,
      },
      imageGeneration: {
        count: pipelineEstimates.images,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        estimatedCost: 0, // Using free Pollinations.ai
      },
    };

    // Calculate total cost for each provider from agent logs
    for (const [provider, stats] of Object.entries(providerStats)) {
      const pricing = PROVIDER_PRICING[provider];
      if (pricing) {
        const inputCost = (stats.estimatedInputTokens / 1_000_000) * pricing.inputPer1M;
        const outputCost = (stats.estimatedOutputTokens / 1_000_000) * pricing.outputPer1M;
        stats.estimatedCost = inputCost + outputCost;
      }
    }

    // Total estimated cost
    const totalEstimatedCost = Object.values(providerStats).reduce((sum, s) => sum + s.estimatedCost, 0);

    // ── Calculate what it WOULD cost with paid providers ──
    const totalEstimatedTokens = {
      input: Object.values(providerStats).reduce((sum, s) => sum + s.estimatedInputTokens, 0)
        + operationCosts.translation.estimatedInputTokens
        + operationCosts.analysis.estimatedInputTokens
        + operationCosts.contentGeneration.estimatedInputTokens,
      output: Object.values(providerStats).reduce((sum, s) => sum + s.estimatedOutputTokens, 0)
        + operationCosts.translation.estimatedOutputTokens
        + operationCosts.analysis.estimatedOutputTokens
        + operationCosts.contentGeneration.estimatedOutputTokens,
    };

    // What it would cost if using Groq for everything
    const hypotheticalCostGroq = (totalEstimatedTokens.input / 1_000_000) * PROVIDER_PRICING.groq.inputPer1M
      + (totalEstimatedTokens.output / 1_000_000) * PROVIDER_PRICING.groq.outputPer1M;

    // What it would cost if using Bedrock for everything
    const hypotheticalCostBedrock = (totalEstimatedTokens.input / 1_000_000) * PROVIDER_PRICING.bedrock.inputPer1M
      + (totalEstimatedTokens.output / 1_000_000) * PROVIDER_PRICING.bedrock.outputPer1M;

    // ── Daily usage trend (last 30 days) ──
    const dailyUsage: { date: string; calls: number; articles: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr + 'T00:00:00Z');
      const dayEnd = new Date(dateStr + 'T23:59:59Z');

      const dayLogs = agentLogs.filter((log: any) => {
        const logDate = new Date(log.createdAt);
        return logDate >= dayStart && logDate <= dayEnd;
      });

      dailyUsage.push({
        date: dateStr,
        calls: dayLogs.length,
        articles: 0, // Will be filled from article data
      });
    }

    // Fill article counts per day
    const articlesByDay = await db.$queryRaw`
      SELECT DATE("fetchedAt") as day, COUNT(*) as count
      FROM news_items
      WHERE "fetchedAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("fetchedAt")
      ORDER BY day ASC
    ` as any[];

    for (const row of articlesByDay || []) {
      const dateStr = row.day instanceof Date ? row.day.toISOString().split('T')[0] : String(row.day).split('T')[0];
      const dayEntry = dailyUsage.find(d => d.date === dateStr);
      if (dayEntry) dayEntry.articles = Number(row.count);
    }

    return NextResponse.json({
      period,
      summary: {
        totalArticles,
        readyArticles,
        pendingArticles,
        analyzedArticles,
        imagedArticles,
        translatedArticles,
        totalAICalls: totalCalls,
        successfulCalls: totalSuccessCalls,
        failedCalls: totalFailedCalls,
        successRate: totalCalls > 0 ? Math.round((totalSuccessCalls / totalCalls) * 100) : 0,
        actualCost: totalEstimatedCost,
        hypotheticalCostGroq: Math.round(hypotheticalCostGroq * 100) / 100,
        hypotheticalCostBedrock: Math.round(hypotheticalCostBedrock * 100) / 100,
        savingsVsGroq: Math.round((hypotheticalCostGroq - totalEstimatedCost) * 100) / 100,
        savingsVsBedrock: Math.round((hypotheticalCostBedrock - totalEstimatedCost) * 100) / 100,
      },
      providerStats: Object.entries(providerStats).map(([provider, stats]) => ({
        provider,
        ...PROVIDER_PRICING[provider] ? {
          name: PROVIDER_PRICING[provider].name,
          nameAr: PROVIDER_PRICING[provider].nameAr,
          color: PROVIDER_PRICING[provider].color,
          freeTier: PROVIDER_PRICING[provider].freeTier,
        } : { name: provider, nameAr: provider, color: '#64748b', freeTier: 'غير معروف' },
        ...stats,
        avgDuration: stats.calls > 0 ? Math.round(stats.totalDuration / stats.calls) : 0,
        successRate: stats.calls > 0 ? Math.round((stats.successCount / stats.calls) * 100) : 0,
      })),
      operationCosts,
      providerPricing: PROVIDER_PRICING,
      actionCounts,
      dailyUsage,
    });
  } catch (error) {
    console.error('[AICosts] Error:', error);
    return NextResponse.json({
      error: 'خطأ في جلب تكاليف الذكاء الاصطناعي',
      summary: null,
      providerStats: [],
      operationCosts: null,
      providerPricing: PROVIDER_PRICING,
      actionCounts: {},
      dailyUsage: [],
    }, { status: 500 });
  }
}
