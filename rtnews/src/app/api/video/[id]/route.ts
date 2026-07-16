// ─── Video Detail API Route ──────────────────────────────────
// Returns video report data + chart data + technical analysis for the interactive player

import { NextRequest, NextResponse } from 'next/server';
import { db, safeDBQuery } from '@/lib/db';
import { getHistoricalData, getQuote, type HistoricalPoint } from '@/lib/financial-apis';
import { performTechnicalAnalysis, type TechnicalAnalysisResult } from '@/lib/technical-analysis';
import { isR2VideoUrl } from '@/lib/video-storage';
import { getR2Config } from '@/lib/r2-client';

// V5 FIX: Removed duplicate PrismaClient — use shared db singleton from @/lib/db

// ─── Synthetic Fallback Data Generator ─────────────────────────

const SYMBOL_BASE_PRICES: Record<string, number> = {
  'AAPL': 195, 'MSFT': 425, 'NVDA': 880, 'TSLA': 245,
  'GOOGL': 175, 'AMZN': 185, 'META': 500, 'NFLX': 630,
  'BTC-USD': 67000, 'ETH-USD': 3500, 'SOL-USD': 170,
  'XRP-USD': 0.55, 'BNB-USD': 600, 'DOGE-USD': 0.16,
  'GC=F': 2350, 'SI=F': 29, 'CL=F': 78,
  'EURUSD=X': 1.08, 'GBPUSD=X': 1.27, 'USDJPY=X': 155,
};

function generateSyntheticChartData(symbol: string, days: number = 90, realPrice?: number): HistoricalPoint[] {
  // Use the REAL current price if available, otherwise fall back to base prices
  const basePrice = realPrice || SYMBOL_BASE_PRICES[symbol] || 100;
  const points: HistoricalPoint[] = [];
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

  // Start from ~90% of base price (simulating a trend that reached current price)
  let price = basePrice * (0.88 + rand() * 0.08);
  // Trend that brings price toward the current real price
  const targetPrice = basePrice;
  const totalSteps = days * 0.7; // approximate trading days
  const trendPerStep = (targetPrice - price) / totalSteps * (0.8 + rand() * 0.4);

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (!symbol.includes('-') && !symbol.includes('=') && (date.getDay() === 0 || date.getDay() === 6)) continue;

    // Mix of trend toward real price + random noise
    const dailyReturn = trendPerStep / price + (rand() - 0.5) * 0.03;
    price = Math.max(basePrice * 0.7, price * (1 + dailyReturn));

    // As we get closer to today, converge toward the real price
    const progress = (days - i) / days;
    if (progress > 0.85) {
      const convergence = (progress - 0.85) / 0.15; // 0 to 1
      price = price * (1 - convergence * 0.3) + targetPrice * (convergence * 0.3);
    }

    const dayVolatility = 0.005 + rand() * 0.02;
    const high = price * (1 + rand() * dayVolatility * 2);
    const low = price * (1 - rand() * dayVolatility * 2);
    const open = low + rand() * (high - low);
    const close = low + rand() * (high - low);
    const volumeMultiplier = symbol.includes('-') || symbol.includes('=') ? 10000 : 1000000;
    const volume = Math.round(basePrice * volumeMultiplier * (0.3 + rand() * 1.4));

    points.push({
      date: date.toISOString().split('T')[0],
      open: Math.max(0.01, open),
      high: Math.max(0.01, high),
      low: Math.max(0.01, low),
      close: Math.max(0.01, close),
      volume,
    });
  }

  // Force the last candle to close near the real price
  if (points.length > 0 && realPrice) {
    const last = points[points.length - 1];
    const diff = realPrice - last.close;
    last.close = realPrice;
    last.high = Math.max(last.high, realPrice * 1.005);
    last.low = Math.min(last.low, realPrice * 0.995);
    last.open = realPrice - diff * 0.3;
  }

  return points;
}

function generateSyntheticQuote(symbol: string, chartLastClose?: number): { price: number; change: number; changePercent: number; high: number; low: number; volume: number } {
  // Use chart's last close as the base to ensure consistency
  const basePrice = chartLastClose || SYMBOL_BASE_PRICES[symbol] || 100;
  const changePercent = (Math.random() - 0.48) * 3;
  const price = basePrice * (1 + changePercent / 100);
  return {
    price: Math.max(0.01, Math.round(price * 100) / 100),
    change: Math.round(basePrice * (changePercent / 100) * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    high: Math.round(price * (1 + Math.random() * 0.01) * 100) / 100,
    low: Math.round(price * (1 - Math.random() * 0.01) * 100) / 100,
    volume: Math.round(basePrice * 1000000 * (0.5 + Math.random())),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await safeDBQuery(
      () => db.videoReport.findFirst({ where: { id } }),
      'videoReport.findFirst'
    );

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // Fix stale "processing" status — if processing for more than 30 minutes, mark as failed
    // V9.2: Raised from 15min to 30min — generating 10 pre-images + rendering takes 15-25min on Railway
    if (video.status === 'processing') {
      const processingAge = Date.now() - new Date(video.createdAt).getTime();
      if (processingAge > 30 * 60 * 1000) {
        console.warn(`[VideoDetail] Video ${id} has been processing for ${Math.round(processingAge / 60000)}min — marking as failed`);
        await safeDBQuery(
          () => db.videoReport.update({
            where: { id },
            data: { status: 'failed', error: 'Video generation timed out (30min limit)' },
          }),
          'videoReport.update.timeout'
        );
        video.status = 'failed';
        video.error = 'Video generation timed out (30min limit)';
      }
    }

    // Fix "completed" videos with missing/null videoUrl — try R2 recovery
    // R2 URLs are persistent and don't depend on local disk, so they're always valid.
    // Strategy: If videoUrl is null or local file is missing, construct R2 URL directly.
    // No HeadObject check — HeadObject can fail for many reasons (permissions, timeout, config)
    // even when the file exists. The browser's <video> tag will handle a 404 gracefully.
    if (video.status === 'completed') {
      const needsRecovery = !video.videoUrl || !isR2VideoUrl(video.videoUrl);
      if (needsRecovery) {
        const { existsSync } = require('fs');
        const { join } = require('path');
        const { tmpdir } = require('os');
        const primaryPath = join(process.cwd(), 'public', 'generated', 'videos', `${id}.mp4`);
        const fallbackPath = join(tmpdir(), 'roua-videos', `${id}.mp4`);
        const localFileExists = existsSync(primaryPath) || existsSync(fallbackPath);

        if (!video.videoUrl || !localFileExists) {
          // videoUrl is null OR local file is missing — construct R2 URL
          const r2Config = getR2Config();
          if (r2Config && r2Config.publicUrl) {
            const r2Key = `videos/${id}.mp4`;
            const r2Url = `${r2Config.publicUrl.replace(/\/$/, '')}/${r2Key}`;
            console.log(`[VideoDetail] Video ${id} ${!video.videoUrl ? 'videoUrl is null' : 'local file missing'} — using R2 URL: ${r2Url.slice(0, 80)}...`);
            await safeDBQuery(
              () => db.videoReport.update({
                where: { id },
                data: {
                  videoUrl: r2Url,
                  thumbnailUrl: video.thumbnailUrl && !isR2VideoUrl(video.thumbnailUrl)
                    ? `${r2Config.publicUrl.replace(/\/$/, '')}/videos/${id}_thumb.png`
                    : video.thumbnailUrl,
                },
              }),
              'videoReport.update.r2recovery'
            );
            video.videoUrl = r2Url;
            if (video.thumbnailUrl && !isR2VideoUrl(video.thumbnailUrl)) {
              video.thumbnailUrl = `${r2Config.publicUrl.replace(/\/$/, '')}/videos/${id}_thumb.png`;
            }
          } else if (video.videoUrl) {
            // R2 not configured but we have an existing URL — keep it (don't nullify!)
            console.warn(`[VideoDetail] Video ${id} local file missing and R2 not configured — keeping existing videoUrl`);
          }
        }
      }
    }

    // Increment view count
    await safeDBQuery(
      () => db.videoReport.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      }),
      'videoReport.update.viewCount'
    );

    // Fetch chart data for this symbol
    let chartData: HistoricalPoint[] = [];
    let quoteData: any = null;
    let isSynthetic = false;

    try {
      const [historical, quote] = await Promise.all([
        getHistoricalData(video.symbol, 90),
        getQuote(video.symbol),
      ]);
      chartData = historical;
      quoteData = quote;
    } catch (err) {
      console.warn('[VideoDetail] Failed to fetch chart data:', err);
    }

    // Fallback to synthetic data if real data unavailable
    // IMPORTANT: When generating synthetic data, use the real quote price as base
    // so the chart data is CONSISTENT with the actual current price.
    if (!chartData || chartData.length === 0) {
      const realQuotePrice = quoteData?.price;
      console.log(`[VideoDetail] Using synthetic chart data for ${video.symbol}${realQuotePrice ? ` anchored to real price ${realQuotePrice}` : ''}`);
      chartData = generateSyntheticChartData(video.symbol, 90, realQuotePrice);
      isSynthetic = true;
    } else if (quoteData?.price) {
      // Even with real chart data, ensure the last candle aligns with the real quote
      // This prevents the analysis from using stale data
      const lastChartPrice = chartData[chartData.length - 1]?.close || 0;
      const priceGap = Math.abs(quoteData.price - lastChartPrice) / lastChartPrice;
      if (priceGap > 0.1) {
        // Chart data is >10% off from real price — likely stale
        console.log(`[VideoDetail] Chart data stale (${lastChartPrice.toFixed(2)}) vs real (${quoteData.price.toFixed(2)}), regenerating with anchor`);
        chartData = generateSyntheticChartData(video.symbol, 90, quoteData.price);
        isSynthetic = true;
      }
    }

    if (!quoteData) {
      const lastClose = chartData.length > 0 ? chartData[chartData.length - 1].close : undefined;
      console.log(`[VideoDetail] Using synthetic quote for ${video.symbol}`);
      quoteData = generateSyntheticQuote(video.symbol, lastClose);
      isSynthetic = true;
    }

    // ─── Perform Technical Analysis ───
    const currentPrice = quoteData?.price || (chartData.length > 0 ? chartData[chartData.length - 1].close : 0);
    const changePercent = quoteData?.changePercent || 0;

    const analysis = performTechnicalAnalysis(
      chartData.map(d => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      })),
      video.symbol,
      currentPrice,
      changePercent,
    );

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        slug: video.slug,
        symbol: video.symbol,
        assetName: video.assetName,
        locale: video.locale,
        reportType: video.reportType,
        assetClass: video.assetClass,
        analysisText: video.analysisText,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        chartMode: video.chartMode,
        style: (video as any).style || 'pulse',
        status: video.status,
        error: video.error || null,
        viewCount: video.viewCount + 1,
        createdAt: video.createdAt,
        sourceReportId: video.sourceReportId,
        sourceType: video.sourceType,
      },
      chartData,
      isSynthetic,
      quote: quoteData ? {
        price: quoteData.price,
        change: quoteData.change,
        changePercent: quoteData.changePercent,
        high: quoteData.high,
        low: quoteData.low,
        volume: quoteData.volume,
      } : null,
      analysis,
    });

  } catch (err: any) {
    console.error('[VideoDetail] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ─── DELETE: Delete a video report ───────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await safeDBQuery(
      () => db.videoReport.findFirst({ where: { id } }),
      'videoReport.findFirst.delete'
    );

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // Delete from R2 if the video is stored there
    if (video.videoUrl && isR2VideoUrl(video.videoUrl)) {
      try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const { getR2Client, getR2Config } = await import('@/lib/r2-client');
        const client = getR2Client();
        const config = getR2Config();
        if (client && config) {
          await client.send(new DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: `videos/${id}.mp4`,
          }));
          // Also delete thumbnail from R2
          if (video.thumbnailUrl && isR2VideoUrl(video.thumbnailUrl)) {
            try {
              await client.send(new DeleteObjectCommand({
                Bucket: config.bucketName,
                Key: `videos/${id}_thumb.png`,
              }));
            } catch {}
          }
          console.log(`[VideoDelete] Deleted R2 objects for video ${id}`);
        }
      } catch (r2Err: any) {
        console.warn(`[VideoDelete] R2 deletion failed: ${r2Err.message}`);
      }
    }

    // Delete from database
    await safeDBQuery(
      () => db.videoReport.delete({ where: { id } }),
      'videoReport.delete'
    );

    console.log(`[VideoDelete] Deleted video ${id}`);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[VideoDelete] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update a video report ───────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const video = await safeDBQuery(
      () => db.videoReport.findFirst({ where: { id } }),
      'videoReport.findFirst.update'
    );

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // Build update data — only allow specific fields
    const updateData: Record<string, any> = {};
    const allowedFields = ['title', 'isPublished', 'marketImpact', 'reportType', 'assetClass', 'style', 'locale'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle publishedAt when publishing
    if (body.isPublished === true && !video.publishedAt) {
      updateData.publishedAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updated = await safeDBQuery(
      () => db.videoReport.update({
        where: { id },
        data: updateData,
      }),
      'videoReport.update'
    );

    console.log(`[VideoUpdate] Updated video ${id}: ${Object.keys(updateData).join(', ')}`);
    return NextResponse.json({ success: true, video: updated });

  } catch (err: any) {
    console.error('[VideoUpdate] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
