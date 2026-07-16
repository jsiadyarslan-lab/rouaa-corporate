// ─── V68 AI Provider Status Endpoint ────────────────────────
// Enhanced status endpoint with V68 health tracking and pipeline info.

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getProviderStatus, chatCompletion } from '@/lib/ai-provider';
import { getV68ProviderStatus, V68_DEFAULT_MODEL, V68_PROVIDER_PRIORITY } from '@/lib/ai/ai-provider';

export const dynamic = 'force-dynamic';

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SECRET || (process.env.NODE_ENV === 'production' ? '' : crypto.randomUUID().repeat(4))
);

async function verifyAdmin(request: Request): Promise<boolean> {
  const token = (request as any).cookies?.get?.('admin_token')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  // Require admin auth for detailed status
  const isAdmin = await verifyAdmin(request);

  try {
    const providers = getProviderStatus();
    const available = providers.filter(p => p.available);
    const unavailable = providers.filter(p => !p.available);

    // Public response: only basic status
    if (!isAdmin) {
      return NextResponse.json({
        status: available.length > 0 ? 'operational' : 'no_providers',
        version: 'V68',
        availableCount: available.length,
        defaultModel: V68_DEFAULT_MODEL,
        timestamp: new Date().toISOString(),
      });
    }

    // Admin response: full details including test
    let testResult: { success: boolean; provider?: string; duration?: number; error?: string } | null = null;

    if (available.length > 0) {
      try {
        const testStart = Date.now();
        const result = await chatCompletion(
          [
            { role: 'system', content: 'أنت مترجم. ترجم إلى العربية.' },
            { role: 'user', content: 'ترجم: Gold prices surge' },
          ],
          { temperature: 0.1, maxTokens: 50 }
        );
        testResult = {
          success: true,
          provider: result.provider,
          duration: Date.now() - testStart,
        };
      } catch (err: any) {
        testResult = {
          success: false,
          error: err.message,
        };
      }
    }

    // V68 Health Status
    const v68Health = getV68ProviderStatus();

    return NextResponse.json({
      version: 'V68',
      status: available.length > 0 ? (testResult?.success ? 'working' : 'degraded') : 'no_providers',
      v68Config: {
        defaultModel: V68_DEFAULT_MODEL,
        providerPriority: V68_PROVIDER_PRIORITY,
        pipeline: '4-gate (Relevance → Quality → Sentiment → Priority)',
        fallbackChain: 'Bedrock (Haiku 4.5 cross-region) → Gemini → Groq',
      },
      availableProviders: available.map(p => ({ provider: p.provider, model: p.model })),
      unavailableProviders: unavailable.map(p => ({ provider: p.provider, reason: 'API key not set' })),
      testTranslation: testResult,
      v68Health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      version: 'V68',
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
