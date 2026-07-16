// V69: Direct Bedrock test endpoint for debugging pipeline issues
import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai-provider';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt } = body;
    
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    
    const result = await chatCompletion(messages, { 
      temperature: 0.1, 
      maxTokens: 500,
      provider: 'bedrock' as any
    });
    
    return NextResponse.json({
      success: true,
      rawContent: result.content,
      contentLength: result.content?.length || 0,
      provider: result.provider,
      model: result.model,
      duration: result.duration,
      tokensUsed: result.tokensUsed,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
