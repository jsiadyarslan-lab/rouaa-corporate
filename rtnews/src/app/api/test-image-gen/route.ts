import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: string[] = [];
  
  // Check z-ai-config files
  const fs = await import('fs');
  
  const configPaths = ['/app/.z-ai-config', '/etc/.z-ai-config', '.z-ai-config'];
  for (const p of configPaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        // Mask sensitive values
        const masked = content.replace(/"apiKey"\s*:\s*"[^"]+"/g, '"apiKey":"***masked***"')
          .replace(/"token"\s*:\s*"[^"]+"/g, '"token":"***masked***"');
        results.push(`✅ Config found at ${p}: ${masked.slice(0, 200)}`);
      } else {
        results.push(`❌ No config at ${p}`);
      }
    } catch (err: any) {
      results.push(`❌ Error reading ${p}: ${err.message?.slice(0, 80)}`);
    }
  }
  
  // Check env vars (masked)
  const envVars = ['ZAI_BASE_URL', 'ZAI_API_KEY', 'ZAI_CHAT_ID', 'ZAI_USER_ID', 'ZAI_TOKEN'];
  for (const v of envVars) {
    const val = process.env[v];
    if (val) {
      results.push(`✅ ${v} = ${v.includes('KEY') || v.includes('TOKEN') ? val.slice(0, 8) + '***' : val}`);
    } else {
      results.push(`❌ ${v} not set`);
    }
  }
  
  return NextResponse.json({ results });
}
