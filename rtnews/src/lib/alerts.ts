// ─── Smart Alert Engine V62 ───────────────────────────────────
// Detects significant market events and generates alert notifications
// Used by /api/alerts and other alert-related endpoints

import { db } from '@/lib/db';
import { getArabicMarketData } from './arabic-markets';

// ─── Types ──────────────────────────────────────────────────

export interface MarketAlert {
  id: string;
  type: 'price_move' | 'sentiment_shift' | 'new_report' | 'economic_event';
  symbol: string;
  message: string;
  messageAr: string;
  severity: 'info' | 'warning' | 'critical';
  data: Record<string, unknown>;
  detectedAt: Date;
}

interface PriceCheckResult {
  symbol: string;
  name: string;
  nameAr: string;
  current: number;
  change: number;
  changePercent: number;
  isSignificant: boolean;
}

// ─── Constants ──────────────────────────────────────────────

const SIGNIFICANT_MOVE_THRESHOLD = 2; // % change that triggers alert
const CRITICAL_MOVE_THRESHOLD = 4; // % change that triggers critical alert

const SEVERITY_LABELS: Record<string, string> = {
  info: 'معلومات',
  warning: 'تحذير',
  critical: 'حرج',
};

// ─── Main Alert Checker ─────────────────────────────────────

/**
 * Check for significant market moves and events.
 * Returns a list of active alerts.
 */
export async function checkMarketAlerts(): Promise<MarketAlert[]> {
  const alerts: MarketAlert[] = [];

  try {
    // 1. Check for significant price moves in Arabic markets
    const priceAlerts = await checkPriceMoves();
    alerts.push(...priceAlerts);

    // 2. Check for sentiment shifts in recent news
    const sentimentAlerts = await checkSentimentShifts();
    alerts.push(...sentimentAlerts);

    // 3. Check for new published reports
    const reportAlerts = await checkNewReports();
    alerts.push(...reportAlerts);

    // 4. Check for upcoming economic events
    const eventAlerts = await checkUpcomingEvents();
    alerts.push(...eventAlerts);
  } catch (error: any) {
    console.error('[AlertEngine] Error checking alerts:', error.message);
  }

  return alerts;
}

// ─── Price Move Checker ─────────────────────────────────────

async function checkPriceMoves(): Promise<MarketAlert[]> {
  const alerts: MarketAlert[] = [];

  try {
    // Check Arabic market indices for significant moves
    const arabicData = await getArabicMarketData();

    for (const index of arabicData) {
      const absChange = Math.abs(index.changePercent || 0);

      if (absChange >= CRITICAL_MOVE_THRESHOLD) {
        alerts.push({
          id: `price_critical_${index.symbol}_${Date.now()}`,
          type: 'price_move',
          symbol: index.symbol,
          message: `${index.symbol} moved ${index.changePercent > 0 ? '+' : ''}${index.changePercent.toFixed(2)}% — Critical move detected`,
          messageAr: `${index.symbol} تحرك بنسبة ${index.changePercent > 0 ? '+' : ''}${index.changePercent.toFixed(2)}% — حركة حرجة`,
          severity: 'critical',
          data: {
            symbol: index.symbol,
            change: index.change,
            changePercent: index.changePercent,
            value: index.value,
          },
          detectedAt: new Date(),
        });
      } else if (absChange >= SIGNIFICANT_MOVE_THRESHOLD) {
        alerts.push({
          id: `price_warning_${index.symbol}_${Date.now()}`,
          type: 'price_move',
          symbol: index.symbol,
          message: `${index.symbol} moved ${index.changePercent > 0 ? '+' : ''}${index.changePercent.toFixed(2)}% — Significant move`,
          messageAr: `${index.symbol} تحرك بنسبة ${index.changePercent > 0 ? '+' : ''}${index.changePercent.toFixed(2)}% — حركة ملحوظة`,
          severity: 'warning',
          data: {
            symbol: index.symbol,
            change: index.change,
            changePercent: index.changePercent,
            value: index.value,
          },
          detectedAt: new Date(),
        });
      }
    }

    // Check market indicators in DB for significant moves
    const significantIndicators = await db.marketIndicator.findMany({
      where: {
        OR: [
          { changePercent: { gte: SIGNIFICANT_MOVE_THRESHOLD } },
          { changePercent: { lte: -SIGNIFICANT_MOVE_THRESHOLD } },
        ],
      },
      select: {
        symbol: true,
        name: true,
        nameAr: true,
        value: true,
        change: true,
        changePercent: true,
        category: true,
        region: true,
      },
    });

    for (const indicator of significantIndicators) {
      const absChange = Math.abs(indicator.changePercent);
      const severity: MarketAlert['severity'] = absChange >= CRITICAL_MOVE_THRESHOLD ? 'critical' : 'warning';

      alerts.push({
        id: `price_${indicator.symbol}_${Date.now()}`,
        type: 'price_move',
        symbol: indicator.symbol,
        message: `${indicator.name} ${indicator.changePercent > 0 ? '↑' : '↓'} ${Math.abs(indicator.changePercent).toFixed(2)}% to ${indicator.value.toFixed(2)}`,
        messageAr: `${indicator.nameAr || indicator.name} ${indicator.changePercent > 0 ? '↑' : '↓'} ${Math.abs(indicator.changePercent).toFixed(2)}% إلى ${indicator.value.toFixed(2)}`,
        severity,
        data: {
          symbol: indicator.symbol,
          name: indicator.name,
          nameAr: indicator.nameAr,
          value: indicator.value,
          change: indicator.change,
          changePercent: indicator.changePercent,
          category: indicator.category,
          region: indicator.region,
        },
        detectedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error('[AlertEngine] Price check error:', error.message);
  }

  return alerts;
}

// ─── Sentiment Shift Checker ────────────────────────────────

async function checkSentimentShifts(): Promise<MarketAlert[]> {
  const alerts: MarketAlert[] = [];

  try {
    // Check for significant sentiment changes in recent news
    const recentNews = await db.newsItem.findMany({
      where: {
        isReady: true,
        locale: 'ar',  // V337: Arabic alerts only
        fetchedAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // Last 4 hours
      },
      select: {
        id: true,
        title: true,
        titleAr: true,
        sentiment: true,
        sentimentScore: true,
        impactLevel: true,
        category: true,
      },
      orderBy: { fetchedAt: 'desc' },
      take: 50,
    });

    // Count sentiment distribution
    const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
    for (const news of recentNews) {
      sentimentCounts[news.sentiment as keyof typeof sentimentCounts]++;
    }

    const total = recentNews.length;
    if (total < 5) return alerts; // Not enough data

    const bearishRatio = sentimentCounts.bearish / total;
    const bullishRatio = sentimentCounts.bullish / total;

    // Alert if sentiment is heavily skewed
    if (bearishRatio > 0.6) {
      alerts.push({
        id: `sentiment_bearish_${Date.now()}`,
        type: 'sentiment_shift',
        symbol: 'MARKET',
        message: `Bearish sentiment dominant: ${Math.round(bearishRatio * 100)}% of recent news is bearish`,
        messageAr: `مشاعر هبوطية مهيمنة: ${Math.round(bearishRatio * 100)}% من الأخبار الحديثة هبوطية`,
        severity: bearishRatio > 0.8 ? 'critical' : 'warning',
        data: {
          bearishRatio,
          bullishRatio,
          neutralRatio: sentimentCounts.neutral / total,
          totalNews: total,
          sentimentCounts,
        },
        detectedAt: new Date(),
      });
    } else if (bullishRatio > 0.6) {
      alerts.push({
        id: `sentiment_bullish_${Date.now()}`,
        type: 'sentiment_shift',
        symbol: 'MARKET',
        message: `Bullish sentiment dominant: ${Math.round(bullishRatio * 100)}% of recent news is bullish`,
        messageAr: `مشاعر صعودية مهيمنة: ${Math.round(bullishRatio * 100)}% من الأخبار الحديثة صعودية`,
        severity: bullishRatio > 0.8 ? 'critical' : 'info',
        data: {
          bearishRatio,
          bullishRatio,
          neutralRatio: sentimentCounts.neutral / total,
          totalNews: total,
          sentimentCounts,
        },
        detectedAt: new Date(),
      });
    }

    // Check for high-impact breaking news
    const highImpact = recentNews.filter(n => n.impactLevel === 'high' && n.sentiment !== 'neutral');
    for (const news of highImpact.slice(0, 3)) {
      alerts.push({
        id: `sentiment_news_${news.id}`,
        type: 'sentiment_shift',
        symbol: news.category,
        message: `High impact ${news.sentiment} news: ${news.title}`,
        messageAr: `خبر ذو تأثير عالٍ ${news.sentiment === 'bullish' ? 'إيجابي' : 'سلبي'}: ${news.titleAr || news.title}`,
        severity: news.impactLevel === 'high' ? 'warning' : 'info',
        data: {
          newsId: news.id,
          title: news.title,
          sentiment: news.sentiment,
          impactLevel: news.impactLevel,
          category: news.category,
        },
        detectedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error('[AlertEngine] Sentiment check error:', error.message);
  }

  return alerts;
}

// ─── New Report Checker ─────────────────────────────────────

async function checkNewReports(): Promise<MarketAlert[]> {
  const alerts: MarketAlert[] = [];

  try {
    // Check for reports published in the last 6 hours
    const recentReports = await db.economicReport.findMany({
      where: {
        isPublished: true,
        locale: 'ar',  // V337: Arabic alerts only
        publishedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      select: {
        id: true, title: true, slug: true,
        reportType: true, scope: true,
        marketImpact: true, confidenceScore: true,
      },
      take: 5,
    });

    for (const report of recentReports) {
      alerts.push({
        id: `report_${report.id}`,
        type: 'new_report',
        symbol: report.scope,
        message: `New ${report.reportType} report: ${report.title}`,
        messageAr: `تقرير ${report.reportType === 'weekly' ? 'أسبوعي' : report.reportType === 'monthly' ? 'شهري' : 'يومي'} جديد: ${report.title}`,
        severity: report.confidenceScore >= 80 ? 'warning' : 'info',
        data: {
          reportId: report.id,
          title: report.title,
          slug: report.slug,
          reportType: report.reportType,
          scope: report.scope,
          marketImpact: report.marketImpact,
          confidenceScore: report.confidenceScore,
        },
        detectedAt: new Date(),
      });
    }

    // Check for new market analyses
    const recentAnalyses = await db.marketAnalysis.findMany({
      where: {
        isPublished: true,
        locale: 'ar',  // V337: Arabic alerts only
        publishedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      select: {
        id: true, title: true, slug: true,
        assetClass: true, sentiment: true,
        confidenceScore: true,
      },
      take: 5,
    });

    for (const analysis of recentAnalyses) {
      alerts.push({
        id: `analysis_${analysis.id}`,
        type: 'new_report',
        symbol: analysis.assetClass,
        message: `New ${analysis.assetClass} analysis: ${analysis.title}`,
        messageAr: `تحليل ${analysis.assetClass === 'stocks' ? 'أسهم' : analysis.assetClass === 'commodities' ? 'سلع' : analysis.assetClass === 'forex' ? 'فوركس' : analysis.assetClass === 'crypto' ? 'عملات رقمية' : 'سندات'} جديد: ${analysis.title}`,
        severity: analysis.confidenceScore >= 80 ? 'warning' : 'info',
        data: {
          analysisId: analysis.id,
          title: analysis.title,
          slug: analysis.slug,
          assetClass: analysis.assetClass,
          sentiment: analysis.sentiment,
          confidenceScore: analysis.confidenceScore,
        },
        detectedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error('[AlertEngine] Report check error:', error.message);
  }

  return alerts;
}

// ─── Upcoming Event Checker ─────────────────────────────────

async function checkUpcomingEvents(): Promise<MarketAlert[]> {
  const alerts: MarketAlert[] = [];

  try {
    // Check for economic events in the next 24 hours
    const upcomingEvents = await db.economicEvent.findMany({
      where: {
        eventDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        isActualReleased: false,
      },
      orderBy: { eventDate: 'asc' },
      take: 10,
    });

    for (const event of upcomingEvents) {
      const severity: MarketAlert['severity'] =
        event.importance === 'critical' ? 'critical' :
        event.importance === 'high' ? 'warning' : 'info';

      alerts.push({
        id: `event_${event.id}`,
        type: 'economic_event',
        symbol: event.currency,
        message: `Upcoming ${event.importance} event: ${event.eventName} (${event.country})`,
        messageAr: `حدث اقتصادي ${SEVERITY_LABELS[event.importance] || event.importance} قادم: ${event.eventNameAr || event.eventName} (${event.country})`,
        severity,
        data: {
          eventId: event.id,
          eventName: event.eventName,
          eventNameAr: event.eventNameAr,
          country: event.country,
          currency: event.currency,
          eventDate: event.eventDate,
          importance: event.importance,
          eventType: event.eventType,
          forecast: event.forecast,
          previous: event.previous,
        },
        detectedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error('[AlertEngine] Event check error:', error.message);
  }

  return alerts;
}

// ─── Generate Alert Notifications ───────────────────────────
// This creates Notification records for users with active smart alerts

export async function generateAlertNotifications(alerts: MarketAlert[]): Promise<void> {
  if (alerts.length === 0) return;

  try {
    // Get all active smart alerts
    const activeAlerts = await db.smartAlert.findMany({
      where: { isActive: true, isTriggered: false },
      select: {
        id: true,
        userId: true,
        alertType: true,
        symbol: true,
        condition: true,
        threshold: true,
        keywords: true,
      },
    });

    for (const userAlert of activeAlerts) {
      try {
        const matchingAlerts = alerts.filter(marketAlert => {
          // Match by type
          if (userAlert.alertType === 'price' && marketAlert.type === 'price_move') {
            if (userAlert.symbol && marketAlert.symbol !== userAlert.symbol) return false;
            if (userAlert.threshold) {
              const changePct = Math.abs((marketAlert.data.changePercent as number) || 0);
              if (userAlert.condition === 'above' && changePct < userAlert.threshold) return false;
              if (userAlert.condition === 'below' && changePct > userAlert.threshold) return false;
            }
            return true;
          }

          if (userAlert.alertType === 'sentiment' && marketAlert.type === 'sentiment_shift') {
            return true;
          }

          if (userAlert.alertType === 'breaking' && marketAlert.severity === 'critical') {
            return true;
          }

          if (userAlert.alertType === 'custom' && userAlert.keywords) {
            const keywords = JSON.parse(userAlert.keywords) as string[];
            return keywords.some(k =>
              marketAlert.messageAr.includes(k) || marketAlert.message.includes(k)
            );
          }

          return false;
        });

        if (matchingAlerts.length > 0) {
          // Create notification for this user
          const topAlert = matchingAlerts[0];
          await db.notification.create({
            data: {
              userId: userAlert.userId,
              title: 'تنبيه سوق',
              message: topAlert.messageAr,
              type: 'alert',
              link: topAlert.type === 'new_report' && topAlert.data.slug
                ? `/reports/${topAlert.data.slug}`
                : '/alerts',
            },
          });

          // Mark the smart alert as triggered
          await db.smartAlert.update({
            where: { id: userAlert.id },
            data: {
              isTriggered: true,
              lastTriggeredAt: new Date(),
            },
          });
        }
      } catch (error: any) {
        console.error(`[AlertEngine] Error processing alert ${userAlert.id}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error('[AlertEngine] Error generating notifications:', error.message);
  }
}
