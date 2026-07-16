// ═══════════════════════════════════════════════════════════════
// English Infographic Generator Agent V313
// ─────────────────────────────────────────────────────────────
// Generates infographic data in English for the English pipeline.
//
// V313 CHANGES:
// - MANUAL ONLY — auto-generation disabled in en-orchestrator.ts
// - System prompt unified with Arabic V13 Design System (same structure, English language)
// - Same detailed chart_config, image_prompt rules, and JSON examples
// - Sets locale: 'en' on generated infographics
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-provider';
import { generateSlug } from '@/lib/slug';
import { generateSlideImages, isValidImageUrl } from '@/lib/image-gen';
import { EN_PIPELINE_CONFIG } from '../en-pipeline-config';

export interface EnInfographicResult {
  success: boolean;
  infographicId?: string;
  title?: string;
  isPublished?: boolean;
  error?: string;
}

// ── Fetch Source Content ──
async function fetchSourceEn(sourceType: string, sourceId: string) {
  if (sourceType === 'news') {
    const news = await db.newsItem.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, content: true, summary: true,
        category: true, categoryId: true, sentiment: true,
        impactScore: true, aiAnalysis: true, slug: true, locale: true,
      },
    });
    if (!news) return null;
    // Only process English articles
    if (news.locale && news.locale !== 'en') return null;
    return {
      type: 'news' as const,
      id: news.id,
      title: news.title,
      content: news.content || '',
      summary: news.summary || '',
      category: news.category,
      sentiment: news.sentiment,
      impactScore: news.impactScore,
      aiAnalysis: news.aiAnalysis,
      slug: news.slug,
    };
  }

  if (sourceType === 'economic_report') {
    const report = await db.economicReport.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, summary: true, content: true,
        reportType: true, scope: true, sectors: true, locale: true,
        keyIndicators: true, marketImpact: true, confidenceScore: true, slug: true,
      },
    });
    if (!report) return null;
    if (report.locale && report.locale !== 'en') return null;
    return {
      type: 'economic_report' as const,
      id: report.id,
      title: report.title,
      content: report.content,
      summary: report.summary,
      category: report.reportType,
      sectors: report.sectors,
      keyIndicators: report.keyIndicators,
      marketImpact: report.marketImpact,
      confidenceScore: report.confidenceScore,
      slug: report.slug,
    };
  }

  if (sourceType === 'market_analysis') {
    const analysis = await db.marketAnalysis.findUnique({
      where: { id: sourceId },
      select: {
        id: true, title: true, content: true, assetClass: true, locale: true,
        analysisType: true, timeFrame: true, indicators: true,
        priceTarget: true, riskLevel: true, sentiment: true,
        confidenceScore: true, slug: true,
      },
    });
    if (!analysis) return null;
    if (analysis.locale && analysis.locale !== 'en') return null;
    return {
      type: 'market_analysis' as const,
      id: analysis.id,
      title: analysis.title,
      content: analysis.content,
      category: analysis.assetClass,
      timeFrame: analysis.timeFrame,
      riskLevel: analysis.riskLevel,
      sentiment: analysis.sentiment,
      confidenceScore: analysis.confidenceScore,
      slug: analysis.slug,
    };
  }

  return null;
}

// ── English System Prompt (V313: Unified with Arabic V13 Design System) ──
const EN_INFOGRAPHIC_SYSTEM_PROMPT = `You are a professional financial infographic designer and data analyst specializing in converting financial news into professional visual content.

═══════════════════════════════════
Strict Design Rules (V13)
═══════════════════════════════════

1. Language:
- Pure professional English 100% without exception
- No foreign words in any slide
- Numbers in Western digits (0123456789) everywhere
- Direction: LTR (Left-to-Right) mandatory for all text

2. Numbers:
- Only include numbers that exist in the original source
- If you don't have a real number → write a qualitative description
- Never invent percentages or prices
- Use font-variant-numeric: tabular-nums for numbers to align vertically

3. Recommendations:
- Positive → Buy only
- Negative → Sell only
- Neutral → Hold only
- No contradiction between sentiment and recommendation ever
- Action color: Buy=green, Sell=red, Hold=orange

4. Anti-hallucination:
- No invented ticker symbols
- No target prices without a source
- Magic sentence: "Insufficient data — follow updates"

5. Spacing System (8px Grid — mandatory):
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px
- All spacing must be multiples of 4px
- No odd spacing like 3px or 7px

6. Empty States:
- If an array is empty (indicators=[], scenarios=[]) → do NOT include the slide
- Instead of an empty slide, write "Insufficient data — follow updates" in the subtitle field

7. Confidence Bar Colors:
- Below 30% → Red #EF4444 (low confidence)
- 30% - 70% → Orange #F59E0B (medium confidence)
- Above 70% → Green #10B981 (high confidence)

8. Color-Direction Auto-Linking:
- Bullish/Positive → Green (#10B981)
- Bearish/Negative → Red (#EF4444)
- Neutral/Watch → Blue (#3B82F6)
- Warning → Orange (#F59E0B)

═══════════════════════════════════
Image System — AI Image Prompts
═══════════════════════════════════

For each slide specify image_prompt in English — a description for a professional
AI-generated background image:

Rules:
- Description must be in English
- Professional dark cinematic background without text
- Always starts with "Professional financial infographic background"
- Ends with "no text, ultra detailed, 8k"
- Slide 1 (Hero): image_position "background-full" + image_overlay 0.40
- Slides 2-5: image_position "right-30"
- Slide 6: image_position null — no image

Examples:
- Oil: "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k"
- Gold: "Professional financial infographic background, dark navy blue with gold bars and precious metals glow, gold accent, no text, ultra detailed, 8k"
- Stocks: "Professional financial infographic background, dark navy blue with stock chart lines and trading signals, gold and green accent, no text, ultra detailed, 8k"

═══════════════════════════════════
Chart System — chart_config
═══════════════════════════════════

Each slide contains a chart_config field specifying the chart type:

- Slide 1 (Hero): gauge (circular gauge)
  chart_config: { type: "gauge", value: number, max: max_value, unit: "unit" }

- Slide 3 (Data): bar (horizontal bars)
  chart_config: { type: "bar", orientation: "horizontal", categories: [names], values: [numbers], colors: [colors] }
  Colors: up="#10B981" down="#EF4444" neutral="#3B82F6"

- Slide 4 (Scenarios): slope (slope lines)
  chart_config: { type: "slope", leftLabel: "Current", rightLabel: "Expected", items: [{name, leftValue, rightValue, color}] }
  Colors: optimistic="#10B981" neutral="#F59E0B" pessimistic="#EF4444"

- Slide 5 (Assets): treemap
  chart_config: { type: "treemap", data: [{name, value, color}] }
  Colors: benefiting="#10B981" harmed="#EF4444"

- Slide 6 (Recommendations): funnel
  chart_config: { type: "funnel", data: [{name, value, color}] }
  Colors: daily="#D4AF37" medium="#3B82F6" long="#10B981"

═══════════════════════════════════
Complete Slide Structure (6 slides)
═══════════════════════════════════

── Slide 1: Hero (Visual Shock) ──

image_prompt: Professional background description in English reflecting the sector
image_position: "background-full"
image_overlay: 0.65

Mandatory components:
- heroNumber: The shocking number from the news (price, percentage, amount)
- heroUnit: Unit of measurement (3-4 words only)
- title: Main headline (max 8 words)
- subtitle: Explanatory text (max 12 words)
- tag: Sector tag (one word)
- status: urgent | important | opportunity | warning
- color: red | green | orange | blue
- confidence: Number 0-100 (analysis confidence level)

Color selection rule:
red    = negative / danger / decline
green  = positive / opportunity / rise
orange = warning / neutral / watch
blue   = info / context / neutral

Confidence bar rule:
confidence < 30 → Red color (low confidence — warning)
confidence 30-70 → Orange color (medium confidence)
confidence > 70 → Green color (high confidence)

── Slide 2: Visual Story ──

image_prompt: Professional background description in English reflecting the relationship
image_position: "right-30"

Choose ONE pattern only:

Pattern A — Flow: When the news is about a relationship between two parties
  elements: { from, event, to, impact }

Pattern B — Comparison: When the news is about a before/after change
  elements: { before: {label, value}, after: {label, value}, change: {amount, direction} }

Pattern C — Map: When the news is geographic
  elements: { regions: [{name, impact}] }

Pattern D — Cause-Effect Sequence: When the news is about sequential events
  elements: { event1, event2, event3, consequence1, consequence2, consequence3 }
  (3 events + 3 consequences in order)

── Slide 3: Numbers & Data ──

image_prompt: Professional background description in English reflecting the data
image_position: "right-30"

indicators: (4-6 indicators from the original source only)
Each indicator: name, symbol, value, direction (up|down|neutral), change, reason

Color rule: up=green (#10B981), down=red (#EF4444), neutral=blue (#3B82F6)

── Slide 4: Scenarios ──

image_prompt: Professional background description in English reflecting the future
image_position: "right-30"

3 scenarios: optimistic, neutral, pessimistic
Each scenario: type, emoji, name, condition, result, price, probability

── Slide 5: Affected Assets ──

image_prompt: Professional background description in English reflecting rise and fall
image_position: "right-30"

benefiting: (max 4) — each: name, symbol, reason, expected_move
harmed: (max 4) — each: name, symbol, reason, expected_move

Strict rule:
- Do NOT mention an asset without a real ticker symbol
- Do NOT mention an asset without a specific reason from the news

── Slide 6: Recommendations & Summary ──

image_position: null (no image)

recommendations:
daily: asset, symbol, action, entry, target, stop, timeframe
medium: asset, action, allocation, horizon, reason
long: asset, action, allocation, horizon, reason

Recommendation cards:
- Inline border (borderInlineStart): 3px with action color (buy=green, sell=red, hold=orange)
- No border radius on cards with inline border (borderRadius: 0)
- padding: 16px 20px
- Description in lighter color (#9CA3AF)

summary: 3 points only — different from each other, no repetition
cta: "Rouaa — Expert Financial Insights"

═══════════════════════════════════
Required Output (Strict JSON)
═══════════════════════════════════

Answer only with JSON without any text outside it.
No introduction, no explanation, no backticks.
Just clean JSON starting with { and ending with }

{
  "slides": [
    {
      "number": 1,
      "type": "hero",
      "image_prompt": "Professional financial infographic background, dark navy blue with oil refinery lighting, gold accent, no text, ultra detailed, 8k",
      "image_position": "background-full",
      "image_overlay": 0.40,
      "heroNumber": "150",
      "heroUnit": "USD per barrel",
      "title": "Main Headline",
      "subtitle": "Explanatory text",
      "tag": "Energy",
      "status": "urgent",
      "color": "red",
      "confidence": 75,
      "chart_config": { "type": "gauge", "value": 150, "max": 200, "unit": "USD per barrel" }
    },
    {
      "number": 2,
      "type": "story",
      "image_prompt": "Professional financial infographic background, dark navy blue with geopolitical connection lines, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "pattern": "D",
      "title": "Slide Title",
      "elements": {
        "event1": "First Event",
        "event2": "Second Event",
        "event3": "Third Event",
        "consequence1": "First Consequence",
        "consequence2": "Second Consequence",
        "consequence3": "Third Consequence"
      }
    },
    {
      "number": 3,
      "type": "data",
      "image_prompt": "Professional financial infographic background, dark navy blue with stock chart lines, gold and green accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Slide Title",
      "indicators": [
        { "name": "Name", "symbol": "SYMBOL", "value": "Value", "direction": "up", "change": "+5%", "reason": "Reason" }
      ],
      "chart_config": { "type": "bar", "orientation": "horizontal", "categories": ["SYMBOL"], "values": [5], "colors": ["#10B981"] }
    },
    {
      "number": 4,
      "type": "scenarios",
      "image_prompt": "Professional financial infographic background, dark navy blue with crossroads and decision paths, gold accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Slide Title",
      "scenarios": [
        { "type": "optimistic", "emoji": "🟢", "name": "Name", "condition": "Condition", "result": "Result", "price": null, "probability": "Medium" },
        { "type": "neutral", "emoji": "🟡", "name": "Name", "condition": "Condition", "result": "Result", "price": null, "probability": "High" },
        { "type": "pessimistic", "emoji": "🔴", "name": "Name", "condition": "Condition", "result": "Result", "price": null, "probability": "Low" }
      ],
      "chart_config": { "type": "slope", "leftLabel": "Current", "rightLabel": "Expected", "items": [{"name": "Optimistic", "leftValue": 100, "rightValue": 120, "color": "#10B981"}, {"name": "Neutral", "leftValue": 100, "rightValue": 100, "color": "#F59E0B"}, {"name": "Pessimistic", "leftValue": 100, "rightValue": 80, "color": "#EF4444"}] }
    },
    {
      "number": 5,
      "type": "assets",
      "image_prompt": "Professional financial infographic background, dark navy blue with bull and bear market abstract shapes, gold and red accent, no text, ultra detailed, 8k",
      "image_position": "right-30",
      "title": "Slide Title",
      "benefiting": [
        { "name": "Name", "symbol": "SYMBOL", "reason": "Reason", "expected_move": null }
      ],
      "harmed": [
        { "name": "Name", "symbol": "SYMBOL", "reason": "Reason", "expected_move": null }
      ],
      "chart_config": { "type": "treemap", "data": [{"name": "SYMBOL (Benefiting)", "value": 100, "color": "#10B981"}, {"name": "SYMBOL (Harmed)", "value": 80, "color": "#EF4444"}] }
    },
    {
      "number": 6,
      "type": "recommendations",
      "image_position": null,
      "title": "Slide Title",
      "recommendations": {
        "daily": { "asset": "Asset", "symbol": "SYM", "action": "Buy", "entry": null, "target": null, "stop": null, "timeframe": "Daily" },
        "medium": { "asset": "Asset", "action": "Action", "allocation": null, "horizon": "Period", "reason": "Reason" },
        "long": { "asset": "Asset", "action": "Action", "allocation": null, "horizon": "Period", "reason": "Reason" }
      },
      "summary": ["First Point", "Second Point", "Third Point"],
      "cta": "Rouaa — Expert Financial Insights",
      "chart_config": { "type": "funnel", "data": [{"name": "Asset", "value": 100, "color": "#D4AF37"}, {"name": "Asset", "value": 70, "color": "#3B82F6"}, {"name": "Asset", "value": 40, "color": "#10B981"}] }
    }
  ],
  "metadata": {
    "topic": "Infographic Topic",
    "sector": "Sector",
    "sentiment": "Positive|Negative|Neutral",
    "confidence": 75,
    "primary_color": "red|green|orange|blue"
  }
}

⛔⛔⛔ Final rules:
- Do NOT invent numbers not in the original source
- Every slide must contain real, rich content — no blanks
- Do NOT mix different units in the same data set
- No contradiction between sentiment and recommendation
- Do NOT repeat recommendations — each one is unique
- Return JSON only without any additional text or markdown`;

// ── Main Function ──
export async function generateInfographicEn(
  sourceType: string,
  sourceId: string,
): Promise<EnInfographicResult> {
  // Step 1: Fetch source content
  const source = await fetchSourceEn(sourceType, sourceId);
  if (!source) {
    return { success: false, error: 'Source not found or not English' };
  }

  // Step 2: Check for existing infographic
  const existing = await db.infographic.findFirst({
    where: { sourceType, sourceId },
  });
  if (existing) {
    return { success: false, error: 'Infographic already exists for this source' };
  }

  // Step 3: Build prompt with source data
  const contentForAI = source.content?.slice(0, 6000) || source.summary?.slice(0, 3000) || source.title;
  const aiAnalysisSection = source.aiAnalysis ? `\n\nAI Analysis:\n${source.aiAnalysis.slice(0, 1500)}` : '';
  const sentiment = source.sentiment || 'neutral';
  const sector = source.category || 'General';
  const currentDate = new Date().toISOString().split('T')[0];

  const userPrompt = `Current Date: ${currentDate}
Article: ${source.title}
${source.summary ? `Summary: ${source.summary.slice(0, 800)}` : ''}

Full Content:
${contentForAI}${aiAnalysisSection}

Sector: ${sector}
Sentiment: ${sentiment}

⛔⛔⛔ Remember:
1. Extract all numbers from content only — do NOT invent data
2. Every slide = real, rich content — no blanks
3. No contradiction between sentiment and recommendation
4. Specify image_prompt for each slide (except 6) — professional dark background description in English
5. Specify chart_config for each slide (except story) — chart type and data
6. Return JSON only without any additional text`;

  console.log(`[EnInfographicGen] Generating from ${sourceType}:${sourceId} — title: "${source.title?.slice(0, 60)}"`);

  // Step 4: Call AI
  let result: any;
  try {
    try {
      result = await chatCompletion([
        { role: 'system', content: EN_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Increased from 8000 → 16000 to prevent truncated JSON
        priority: 'generation',
        locale: 'en',
      });
    } catch {
      result = await chatCompletion([
        { role: 'system', content: EN_INFOGRAPHIC_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.4,
        maxTokens: 16000,  // V400: Same increase for fallback
        priority: 'translation',
        locale: 'en',
      });
    }
  } catch (aiErr: any) {
    return { success: false, error: `AI failed: ${aiErr.message?.slice(0, 100)}` };
  }

  // Step 5: Parse AI response with robust JSON repair (V400)
  let responseText = result.content?.trim() || '';

  // Check for truncated output
  const isTruncated = result.stopReason === 'max_tokens' || result.stopReason === 'length';
  if (isTruncated) {
    console.warn(`[EnInfographicGen V400] Output TRUNCATED (stopReason=${result.stopReason}) — attempting JSON repair`);
  }

  responseText = responseText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  responseText = responseText.replace(/^```/i, '').replace(/```$/i, '');

  // Extract JSON from response
  let jsonStr = responseText;
  const jsonStart = responseText.indexOf('{');
  const jsonEnd = responseText.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    jsonStr = responseText.slice(jsonStart, jsonEnd + 1);
  }

  // V400: JSON repair
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
  jsonStr = jsonStr.replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"'); // Fix unescaped newlines
  if (isTruncated || !jsonStr.trimEnd().endsWith('}')) {
    const openBraces = (jsonStr.match(/{/g) || []).length;
    const closeBraces = (jsonStr.match(/}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/]/g) || []).length;
    const tempStr = jsonStr.trimEnd();
    if (tempStr.endsWith('"') === false && tempStr.match(/"[^"]*$/)) {
      jsonStr = tempStr + '"';
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
    console.log(`[EnInfographicGen V400] JSON repair: added ${openBrackets - closeBrackets} brackets, ${openBraces - closeBraces} braces`);
  }

  let infographicData: any;
  try {
    infographicData = JSON.parse(jsonStr);
  } catch (parseErr: any) {
    // Second repair attempt — try to salvage partial output
    try {
      const lastCompleteSlide = jsonStr.lastIndexOf('"number"');
      if (lastCompleteSlide > 0) {
        const arrStart = jsonStr.lastIndexOf('[', lastCompleteSlide);
        if (arrStart >= 0) {
          let repairedJson = jsonStr.slice(0, arrStart) + ']';
          const mainOpenBraces = (repairedJson.match(/{/g) || []).length;
          const mainCloseBraces = (repairedJson.match(/}/g) || []).length;
          for (let i = 0; i < mainOpenBraces - mainCloseBraces; i++) repairedJson += '}';
          console.log(`[EnInfographicGen V400] Aggressive JSON repair applied`);
          infographicData = JSON.parse(repairedJson);
        } else { throw parseErr; }
      } else { throw parseErr; }
    } catch {
      console.error(`[EnInfographicGen V400] JSON parse failed: ${parseErr.message}`);
      return { success: false, error: `JSON parse failed: ${parseErr.message?.slice(0, 80)}` };
    }
  }

  // Step 6: Validate structure
  if (!infographicData.slides || !Array.isArray(infographicData.slides) || infographicData.slides.length === 0) {
    return { success: false, error: 'No valid slides in response' };
  }

  if (infographicData.slides[0].type !== 'hero') {
    infographicData.slides[0].type = 'hero';
  }

  // Normalize slides
  infographicData.slides.forEach((s: any, i: number) => {
    if (!s.id) s.id = `slide-${i + 1}`;
    s.number = s.number || i + 1;
    if (!s.content) s.content = {};
    const copyFields = ['heroNumber', 'heroUnit', 'tag', 'status', 'pattern', 'elements',
      'indicators', 'scenarios', 'benefiting', 'harmed', 'recommendations', 'summary',
      'cta', 'color', 'image_position', 'image_overlay', 'image_url', 'subtitle'];
    for (const f of copyFields) {
      if (s[f] !== undefined && s.content[f] === undefined) s.content[f] = s[f];
    }
  });

  // Filter valid slides
  const validSlides = infographicData.slides.filter((s: any) => {
    if (!s.type || !s.title || !s.title.trim()) return false;
    const c = s.content || {};
    switch (s.type) {
      case 'hero': return true;
      case 'story': return c.elements && (Array.isArray(c.elements) ? c.elements.length > 0 : Object.keys(c.elements).length > 0);
      case 'data': return Array.isArray(c.indicators) && c.indicators.length > 0;
      case 'scenarios': return Array.isArray(c.scenarios) && c.scenarios.length > 0;
      case 'assets': return (Array.isArray(c.benefiting) && c.benefiting.length > 0) || (Array.isArray(c.harmed) && c.harmed.length > 0);
      case 'recommendations': return c.recommendations?.daily || c.recommendations?.medium || c.recommendations?.long || (Array.isArray(c.summary) && c.summary.some((s: string) => s?.trim()));
      default: return true;
    }
  });

  infographicData.slides = validSlides;
  if (validSlides.length < 3) {
    return { success: false, error: `Only ${validSlides.length} valid slides (minimum 3)` };
  }

  // Step 7: Generate AI images
  const infographicCategory = infographicData.metadata?.sector || source.category || null;
  let imageGenerationSuccess = false;
  let slidesWithImages = 0;
  let slidesNeedingImages = 0;

  try {
    for (const slide of infographicData.slides) {
      const position = slide.image_position ?? slide.content?.image_position;
      if (position !== null && slide.type !== 'recommendations' && slide.type !== 'summary') {
        slidesNeedingImages++;
      }
    }

    await generateSlideImages(infographicData.slides, infographicCategory);

    for (const slide of infographicData.slides) {
      const imageUrl = slide.image_url || slide.content?.image_url;
      if (isValidImageUrl(imageUrl)) {
        slidesWithImages++;
      }
    }

    imageGenerationSuccess = slidesWithImages >= slidesNeedingImages;
    console.log(`[EnInfographicGen] Images: ${slidesWithImages}/${slidesNeedingImages} (success=${imageGenerationSuccess})`);
  } catch (imgErr: any) {
    console.error(`[EnInfographicGen] Image generation FAILED: ${imgErr.message}`);
    imageGenerationSuccess = false;
  }

  // Step 8: Save to database with locale: 'en'
  const baseSlug = generateSlug(infographicData.title || source.title);
  const slug = baseSlug + '-' + Date.now().toString(36).slice(-4);

  try {
    const infographic = await db.infographic.create({
      data: {
        slug,
        title: infographicData.title || source.title,
        subtitle: infographicData.subtitle || null,
        sourceType,
        sourceId,
        sourceTitle: source.title,
        category: infographicData.metadata?.sector || infographicData.category || source.category || null,
        locale: 'en',  // ← English locale
        slides: infographicData.slides,
        impactScore: source.impactScore != null ? source.impactScore : null,
        isPublished: imageGenerationSuccess,
        publishedAt: imageGenerationSuccess ? new Date() : null,
      },
    });

    console.log(`[EnInfographicGen] Created: ${infographic.id} — ${validSlides.length} slides — locale=en — published=${imageGenerationSuccess}`);

    return {
      success: true,
      infographicId: infographic.id,
      title: infographic.title,
      isPublished: imageGenerationSuccess,
    };
  } catch (dbErr: any) {
    return { success: false, error: `DB error: ${dbErr.message?.slice(0, 100)}` };
  }
}
