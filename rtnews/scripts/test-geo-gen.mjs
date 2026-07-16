// V1051: Ultra-simple test — bypass chatCompletion() entirely, use ZAI SDK directly
import ZAI from 'z-ai-web-dev-sdk';

async function test() {
  console.log('[TestGeoGen] Creating ZAI instance...');
  const zai = await ZAI.create();
  console.log('[TestGeoGen] ZAI created. Calling chat for Arabic...');

  const response = await zai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `اكتب تحليلاً احترافياً للمخاطر الجيوسياسية لدولة أوكرانيا باللغة العربية.

اكتب بالتنسيق التالي (Markdown):

## الملخص التنفيذي
[3-4 جمل]

## السياق والخلفية
[فقرة مفصلة]

## التأثير الاقتصادي
[فقرة]

## السيناريوهات
- السيناريو الأساسي (50%): ...
- السيناريو المعاكس (30%): ...
- السيناريو الحاد (20%): ...

## الأصول المتأثرة
- النفط: ...
- الذهب: ...

## التوصيات الاستراتيجية
للمستثمر المحافظ: ...
للمستثمر المتوسط: ...
للمتداول النشط: ...`,
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = response.choices[0]?.message?.content || '';
  console.log('[TestGeoGen] Response length:', content.length);
  console.log('[TestGeoGen] First 500 chars:', content.slice(0, 500));

  if (content.length > 200) {
    console.log('[TestGeoGen] ✅ SUCCESS — AI generated valid content');
  } else {
    console.log('[TestGeoGen] ❌ FAILED — content too short');
  }
}
test().catch(e => console.error('[TestGeoGen] FAILED:', e.message));
