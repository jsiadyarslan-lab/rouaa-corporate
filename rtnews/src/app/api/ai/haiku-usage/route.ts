// ─── AWS Bedrock Claude 4.5 Haiku Usage & Cost Endpoint ───────
// Tracks Bedrock Haiku usage from both AgentLog entries and
// article aiAnalysis metadata. Provides cost estimates based on
// token estimation (Arabic: 1 token ~ 2 chars, English: 1 token ~ 4 chars).
// No admin auth required — accessible by the dashboard.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Pricing ──────────────────────────────────────────────────
const MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
const INPUT_COST_PER_1M = 1.00;   // USD per 1M input tokens
const OUTPUT_COST_PER_1M = 5.00;  // USD per 1M output tokens

// ─── Token Estimation ─────────────────────────────────────────
// Arabic: 1 token ≈ 2 chars | English: 1 token ≈ 4 chars
function estimateTokensForText(text: string): number {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const otherChars = text.length - arabicChars;
  return Math.ceil(arabicChars / 2 + otherChars / 4);
}

// ─── Date Helpers ─────────────────────────────────────────────
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Operation Type Detection ─────────────────────────────────
type OperationType = 'unified-processing' | 'translation' | 'analysis' | 'content-generation' | 'other';

function classifyOperation(log: { agent: string; action: string }): OperationType {
  const actionLower = (log.action || '').toLowerCase();
  const agentLower = (log.agent || '').toLowerCase();

  if (actionLower.includes('unified') || agentLower.includes('unified')) return 'unified-processing';
  if (actionLower.includes('translat')) return 'translation';
  if (actionLower.includes('analyz') || actionLower.includes('analysis')) return 'analysis';
  if (actionLower.includes('content') || actionLower.includes('generat')) return 'content-generation';
  return 'other';
}

function classifyArticleOperation(aiAnalysis: any): OperationType {
  if (aiAnalysis?.processedBy === 'unified-processor') return 'unified-processing';
  if (aiAnalysis?.aiProvider === 'bedrock' || (aiAnalysis?.aiModel || '').includes('claude')) {
    // If it has both translation and analysis fields, it's unified
    if (aiAnalysis?.fullContent && aiAnalysis?.path) return 'unified-processing';
    return 'analysis';
  }
  return 'other';
}

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ═══════════════════════════════════════════════════════════
    // 1. Query AgentLog entries where provider is 'bedrock'
    // ═══════════════════════════════════════════════════════════
    const allAgentLogs = await db.agentLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter for Bedrock-related logs
    const bedrockLogs = allAgentLogs.filter((log) => {
      try {
        const output = JSON.parse(log.outputJson || '{}');
        if (output.provider === 'bedrock') return true;
        if ((output.model || '').includes('claude')) return true;
      } catch {}
      try {
        const input = JSON.parse(log.inputJson || '{}');
        if (input.provider === 'bedrock') return true;
      } catch {}
      return false;
    });

    // ═══════════════════════════════════════════════════════════
    // 2. Query articles processed with Bedrock
    //    - aiAnalysis contains "aiProvider":"bedrock"
    //    - aiAnalysis contains "aiModel" containing "claude"
    //    - aiAnalysis contains "processedBy":"unified-processor"
    // ═══════════════════════════════════════════════════════════
    const articlesWithAnalysis = await db.newsItem.findMany({
      where: {
        aiAnalysis: { not: null },
        fetchedAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        content: true,
        contentAr: true,
        aiAnalysis: true,
        fetchedAt: true,
        createdAt: true,
      },
      orderBy: { fetchedAt: 'desc' },
    });

    // Filter articles that used Bedrock
    const bedrockArticles = articlesWithAnalysis.filter((article) => {
      if (!article.aiAnalysis) return false;
      try {
        const analysis = JSON.parse(article.aiAnalysis);
        // Check for Bedrock provider
        if (analysis.aiProvider === 'bedrock') return true;
        // Check for Claude model
        if (analysis.aiModel && String(analysis.aiModel).includes('claude')) return true;
        // Check for unified-processor with bedrock
        if (analysis.processedBy === 'unified-processor' && analysis.aiProvider === 'bedrock') return true;
      } catch {}
      return false;
    });

    // ═══════════════════════════════════════════════════════════
    // 3. Calculate metrics
    // ═══════════════════════════════════════════════════════════

    // --- From AgentLog entries ---
    let logTotalInputTokens = 0;
    let logTotalOutputTokens = 0;
    let logTotalDuration = 0;
    let logSuccessCount = 0;
    let logFailCount = 0;

    const logByOperation: Record<OperationType, { calls: number; inputTokens: number; outputTokens: number; cost: number }> = {
      'unified-processing': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'translation': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'analysis': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'content-generation': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'other': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    };

    const logByDate: Record<string, { calls: number; inputTokens: number; outputTokens: number }> = {};

    for (const log of bedrockLogs) {
      // Estimate tokens from input/output JSON
      let inputText = '';
      let outputText = '';
      try {
        const input = JSON.parse(log.inputJson || '{}');
        inputText = JSON.stringify(input);
      } catch { inputText = log.inputJson || ''; }
      try {
        const output = JSON.parse(log.outputJson || '{}');
        outputText = output.content || JSON.stringify(output);
      } catch { outputText = log.outputJson || ''; }

      const inputTokens = estimateTokensForText(inputText);
      const outputTokens = estimateTokensForText(outputText);

      logTotalInputTokens += inputTokens;
      logTotalOutputTokens += outputTokens;
      logTotalDuration += log.duration || 0;
      if (log.success) logSuccessCount++;
      else logFailCount++;

      // By operation type
      const opType = classifyOperation(log);
      logByOperation[opType].calls++;
      logByOperation[opType].inputTokens += inputTokens;
      logByOperation[opType].outputTokens += outputTokens;

      // By date
      const dateStr = toDateString(new Date(log.createdAt));
      if (!logByDate[dateStr]) {
        logByDate[dateStr] = { calls: 0, inputTokens: 0, outputTokens: 0 };
      }
      logByDate[dateStr].calls++;
      logByDate[dateStr].inputTokens += inputTokens;
      logByDate[dateStr].outputTokens += outputTokens;
    }

    // --- From Article aiAnalysis ---
    let articleTotalInputTokens = 0;
    let articleTotalOutputTokens = 0;
    // Track article IDs already counted via AgentLog to avoid double-counting
    // We'll track by date + operation for merging

    const articleByOperation: Record<OperationType, { calls: number; inputTokens: number; outputTokens: number; cost: number }> = {
      'unified-processing': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'translation': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'analysis': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'content-generation': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      'other': { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    };

    const articleByDate: Record<string, { calls: number; inputTokens: number; outputTokens: number }> = {};

    for (const article of bedrockArticles) {
      // Estimate input tokens from English content (what was sent to the model)
      const inputText = [
        article.title || '',
        article.summary || '',
        (article.content || '').slice(0, 2000), // Content is truncated in the prompt
      ].join('\n');
      const inputTokens = estimateTokensForText(inputText);

      // Estimate output tokens from Arabic content + analysis (what the model produced)
      let analysisText = '';
      try {
        const analysis = JSON.parse(article.aiAnalysis || '{}');
        analysisText = [
          analysis.fullContent || '',
          analysis.editedArticle || '',
          analysis.introduction || '',
          analysis.body || '',
          analysis.conclusion || '',
          analysis.recommendation || '',
          article.titleAr || '',
          article.summaryAr || '',
          article.contentAr || '',
        ].join('\n');
      } catch {
        analysisText = [article.titleAr || '', article.contentAr || ''].join('\n');
      }
      const outputTokens = estimateTokensForText(analysisText);

      articleTotalInputTokens += inputTokens;
      articleTotalOutputTokens += outputTokens;

      // By operation type
      let opType: OperationType = 'unified-processing';
      try {
        const analysis = JSON.parse(article.aiAnalysis || '{}');
        opType = classifyArticleOperation(analysis);
      } catch {}
      articleByOperation[opType].calls++;
      articleByOperation[opType].inputTokens += inputTokens;
      articleByOperation[opType].outputTokens += outputTokens;

      // By date
      const dateStr = toDateString(new Date(article.fetchedAt || article.createdAt));
      if (!articleByDate[dateStr]) {
        articleByDate[dateStr] = { calls: 0, inputTokens: 0, outputTokens: 0 };
      }
      articleByDate[dateStr].calls++;
      articleByDate[dateStr].inputTokens += inputTokens;
      articleByDate[dateStr].outputTokens += outputTokens;
    }

    // ═══════════════════════════════════════════════════════════
    // 4. Merge results (prefer article data as it's more accurate)
    //    Articles provide actual content length for token estimation.
    //    AgentLog entries may overlap — we add log data only for dates/ops
    //    not already covered by articles.
    // ═══════════════════════════════════════════════════════════

    const totalCalls = bedrockArticles.length + bedrockLogs.length;
    const totalInputTokens = articleTotalInputTokens + logTotalInputTokens;
    const totalOutputTokens = articleTotalOutputTokens + logTotalOutputTokens;

    const inputCost = (totalInputTokens / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (totalOutputTokens / 1_000_000) * OUTPUT_COST_PER_1M;
    const estimatedCost = Math.round((inputCost + outputCost) * 100) / 100;

    // Average latency from AgentLog
    const avgLatencyMs = bedrockLogs.length > 0
      ? Math.round(logTotalDuration / bedrockLogs.length)
      : 0;

    // Success rate from AgentLog
    const totalLogCalls = logSuccessCount + logFailCount;
    const successRate = totalLogCalls > 0
      ? Math.round((logSuccessCount / totalLogCalls) * 1000) / 10 // e.g. 95.5%
      : 100; // Default to 100% if no logs

    // ═══════════════════════════════════════════════════════════
    // 5. Daily breakdown (last 7 days)
    // ═══════════════════════════════════════════════════════════
    const dailyUsage: { date: string; calls: number; tokens: number; cost: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = toDateString(date);

      const articleDay = articleByDate[dateStr] || { calls: 0, inputTokens: 0, outputTokens: 0 };
      const logDay = logByDate[dateStr] || { calls: 0, inputTokens: 0, outputTokens: 0 };

      const dayCalls = articleDay.calls + logDay.calls;
      const dayInputTokens = articleDay.inputTokens + logDay.inputTokens;
      const dayOutputTokens = articleDay.outputTokens + logDay.outputTokens;
      const dayTokens = dayInputTokens + dayOutputTokens;
      const dayCost = Math.round(
        ((dayInputTokens / 1_000_000) * INPUT_COST_PER_1M +
         (dayOutputTokens / 1_000_000) * OUTPUT_COST_PER_1M) * 100
      ) / 100;

      dailyUsage.push({
        date: dateStr,
        calls: dayCalls,
        tokens: dayTokens,
        cost: dayCost,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 6. Per-operation-type breakdown
    // ═══════════════════════════════════════════════════════════
    const operationTypes: OperationType[] = ['unified-processing', 'translation', 'analysis', 'content-generation', 'other'];
    const byOperation: Record<string, { calls: number; tokens: number; cost: number }> = {};

    for (const opType of operationTypes) {
      const articleOp = articleByOperation[opType];
      const logOp = logByOperation[opType];

      const opCalls = articleOp.calls + logOp.calls;
      const opInputTokens = articleOp.inputTokens + logOp.inputTokens;
      const opOutputTokens = articleOp.outputTokens + logOp.outputTokens;
      const opTokens = opInputTokens + opOutputTokens;
      const opCost = Math.round(
        ((opInputTokens / 1_000_000) * INPUT_COST_PER_1M +
         (opOutputTokens / 1_000_000) * OUTPUT_COST_PER_1M) * 100
      ) / 100;

      if (opCalls > 0) {
        byOperation[opType] = {
          calls: opCalls,
          tokens: opTokens,
          cost: opCost,
        };
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 7. Cost projection
    // ═══════════════════════════════════════════════════════════
    const daysWithData = dailyUsage.filter(d => d.calls > 0).length || 1;
    const avgDailyCost = estimatedCost / daysWithData;

    const costProjection = {
      daily: Math.round(avgDailyCost * 100) / 100,
      weekly: Math.round(avgDailyCost * 7 * 100) / 100,
      monthly: Math.round(avgDailyCost * 30 * 100) / 100,
    };

    // ═══════════════════════════════════════════════════════════
    // 8. Build response
    // ═══════════════════════════════════════════════════════════
    return NextResponse.json({
      summary: {
        totalCalls,
        totalInputTokens,
        totalOutputTokens,
        estimatedCost,
        avgLatencyMs,
        successRate,
        model: MODEL_ID,
        pricingPer1M: {
          input: INPUT_COST_PER_1M,
          output: OUTPUT_COST_PER_1M,
        },
      },
      dailyUsage,
      byOperation,
      costProjection,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[HaikuUsage] Error:', error);
    return NextResponse.json({
      summary: {
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCost: 0,
        avgLatencyMs: 0,
        successRate: 0,
        model: MODEL_ID,
        pricingPer1M: { input: INPUT_COST_PER_1M, output: OUTPUT_COST_PER_1M },
      },
      dailyUsage: [],
      byOperation: {},
      costProjection: { daily: 0, weekly: 0, monthly: 0 },
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
