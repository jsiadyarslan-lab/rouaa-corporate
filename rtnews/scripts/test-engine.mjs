#!/usr/bin/env node
// Test the Video Script Engine on a report JSON
// Usage: node test-engine.mjs --input report.json --output scenes.json --report report.md

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { generateVideoScript } from './video-script-engine.mjs';

const args = process.argv.slice(2);
let INPUT = '', OUTPUT = '', REPORT_OUTPUT = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--input' && args[i+1]) INPUT = args[++i];
  if (args[i] === '--output' && args[i+1]) OUTPUT = args[++i];
  if (args[i] === '--report' && args[i+1]) REPORT_OUTPUT = args[++i];
}
if (!INPUT || !OUTPUT) {
  console.error('Usage: node test-engine.mjs --input report.json --output scenes.json [--report report.md]');
  process.exit(1);
}
if (!REPORT_OUTPUT) REPORT_OUTPUT = OUTPUT.replace('.json', '.md');

async function main() {
  console.log('Loading report from:', INPUT);
  const report = JSON.parse(readFileSync(INPUT, 'utf-8'));
  console.log('Report title:', report.title);
  console.log('Report locale:', report.locale);

  const result = await generateVideoScript(report, { lang: report.locale || 'ar' });

  if (!result.success) {
    console.error('Engine failed:', result.error);
    process.exit(1);
  }

  const videoScript = {
    title: report.title,
    locale: report.locale || 'ar',
    outroText: 'تابعنا لمزيد من التحليلات الاستراتيجية. رؤى — حيث يلتقي المال بالمعرفة.',
    scenes: result.scenes.map(s => ({
      title: s.sceneTitle,
      sceneType: s.sceneType,
      motionDirection: s.motionDirection,
      narrationText: s.narrationText,
      displayText: s.displayText,
      imagePrompt: s.imagePrompt,
      duration: s.duration,
    })),
    _meta: {
      N: result.N,
      totalDuration: result.totalDuration,
      brokenCount: result.brokenCount,
      action: result.action,
      elapsed: result.elapsed,
      generatedAt: new Date().toISOString(),
    },
  };

  mkdirSync(OUTPUT.split('/').slice(0, -1).join('/') || '.', { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(videoScript, null, 2), 'utf-8');
  console.log(`\n✓ Scenes JSON written: ${OUTPUT}`);

  let md = `# Engine Test Report\n\n`;
  md += `**Report**: ${report.title}\n`;
  md += `**Language**: ${report.locale || 'ar'}\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Engine elapsed**: ${result.elapsed}s\n`;
  md += `**Total scenes**: ${result.scenes.length} (target N=${result.N})\n`;
  md += `**Total duration**: ${result.totalDuration}s\n`;
  md += `**Broken scenes**: ${result.brokenCount}\n`;
  md += `**Action**: ${result.action}\n\n---\n\n## Scenes\n\n`;
  for (const s of result.scenes) {
    md += `### Scene #${s.id} — ${s.sceneTitle}\n\n`;
    md += `- **sceneType**: \`${s.sceneType}\`\n`;
    md += `- **motionDirection**: \`${s.motionDirection}\`\n`;
    md += `- **duration**: ${s.duration}s\n`;
    if (s.placeholder) md += `- ⚠️ **PLACEHOLDER**\n`;
    md += `\n**narrationText**:\n> ${s.narrationText}\n\n`;
    md += `**displayText**:\n> ${s.displayText}\n\n`;
    md += `**imagePrompt**:\n> \`${s.imagePrompt}\`\n\n---\n\n`;
  }
  writeFileSync(REPORT_OUTPUT, md, 'utf-8');
  console.log(`✓ Human-readable report: ${REPORT_OUTPUT}`);

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SUMMARY`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`Scenes:     ${result.scenes.length} (target N=${result.N})`);
  console.log(`Duration:   ${result.totalDuration}s`);
  console.log(`Broken:     ${result.brokenCount}`);
  console.log(`Action:     ${result.action}`);
  console.log(`Elapsed:    ${result.elapsed}s`);
  console.log(`${'═'.repeat(70)}`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
