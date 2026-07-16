import { NextResponse } from 'next/server';

// ─── AI News Analysis Endpoint ──────────────────────────────
// Uses Groq/Gemini for financial news analysis (no z-ai)
import { analyzeFinancialNews } from '@/lib/ai-provider';
import { sanitizePromptInput } from '@/lib/sanitize';
import { z } from 'zod';

// V154: Zod schema for input validation
const AnalyzeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  summary: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // V154: Zod validation
    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { title, summary } = parsed.data;

    const sanitizedTitle = sanitizePromptInput(title);
    const sanitizedSummary = sanitizePromptInput(summary || '');
    
    const analysis = await analyzeFinancialNews(sanitizedTitle, sanitizedSummary);
    
    if (analysis) {
      return NextResponse.json({ analysis, powered: 'AI Analysis' });
    }
    
    // Fallback if AI analysis returned null
    return NextResponse.json({ 
      analysis: { 
        summary: title.slice(0, 100), 
        sentiment: 'neutral', 
        confidence: 50,
        affectedAssets: [],
        impactLevel: 'medium',
        recommendation: 'يرجى مراجعة الخبر يدوياً'
      },
      powered: 'Fallback'
    });

  } catch (error: any) {
    console.error('News analysis API error:', error);
    
    return NextResponse.json({ 
      error: 'حدث خطأ في التحليل',
      analysis: null
    }, { status: 500 });
  }
}
