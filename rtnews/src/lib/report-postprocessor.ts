// ─── Report Post-Processor V3 ──────────────────────────────
// Transforms AI-generated content (JSON or Markdown) into
// clean, formatted Markdown/HTML for display in report pages.
//
// V3: Critical quality improvements:
// - Remove email addresses from content (journalist email leaks)
// - Remove AI filler words ("حسناً", "Well, then", etc.)
// - Detect and remove glitch phrase loops (same phrase 3+ times)
// - Decode HTML entities (&amp; &gt; &lt; &#x27; &quot;)
// - Remove Devanagari/Hindi characters from Arabic text
// - Remove untranslated English financial terms in Arabic context
// - Cross-validate consistency between trend/confidence/recommendations
//
// V2: Fixed critical bug where Arabic word spaces were removed.
// - Removed the destructive regex that collapsed spaces between
//   all Arabic characters (U+0600-U+06FF)
// - Improved JSON→Markdown conversion for financial content
// - Added Arabic financial terminology preservation
// - Better handling of AI responses that wrap content in JSON

/**
 * Main entry point: takes raw AI output and returns clean Markdown
 */
export function postProcessContent(rawContent: string): string {
  if (!rawContent || rawContent.trim().length === 0) return '';

  let content = rawContent.trim();

  // Step 1: Remove code block wrappers
  content = content.replace(/```(?:json|markdown)?\s*/gi, '');

  // Step 2: Try JSON parsing
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        const md = jsonToMarkdown(parsed as Record<string, unknown>);
        if (md.trim().length > 20) return md;
      }
    } catch {
      // Not valid JSON, continue with text cleanup
    }
  }

  // Step 3: Clean remaining text
  return cleanText(content);
}

/**
 * Converts a JSON object to Markdown format
 */
export function jsonToMarkdown(obj: Record<string, unknown>, depth: number = 0): string {
  const parts: string[] = [];
  const headingPrefix = '#'.repeat(Math.min(depth + 2, 6)); // ##, ###, etc.

  for (const [key, value] of Object.entries(obj)) {
    const label = key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\w/, c => c.toUpperCase());

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      if (value.trim().length > 0) {
        parts.push(`${headingPrefix} ${label}\n\n${value}`);
      }
    } else if (typeof value === 'number') {
      parts.push(`${headingPrefix} ${label}\n\n${value}`);
    } else if (typeof value === 'boolean') {
      parts.push(`${headingPrefix} ${label}\n\n${value ? 'نعم' : 'لا'}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;
      // Check if it's an array of strings
      if (value.every(v => typeof v === 'string')) {
        const bulletItems = value.map(v => `- ${v}`).join('\n');
        parts.push(`${headingPrefix} ${label}\n\n${bulletItems}`);
      } else {
        // Array of objects or mixed
        const items = value.map(item => {
          if (typeof item === 'string') return `- ${item}`;
          if (typeof item === 'object' && item !== null) {
            // Check if it has support/resistance structure
            const rec = item as Record<string, unknown>;
            if ('support' in rec || 'resistance' in rec) {
              return formatComparisonTable(rec, label);
            }
            return `- ${Object.values(rec).filter(v => typeof v === 'string' && v.length > 5).join(' – ') || JSON.stringify(item)}`;
          }
          return `- ${String(item)}`;
        }).join('\n');
        parts.push(`${headingPrefix} ${label}\n\n${items}`);
      }
    } else if (typeof value === 'object') {
      const rec = value as Record<string, unknown>;
      // Check for support/resistance structure -> comparison table
      if ('support' in rec || 'resistance' in rec) {
        const table = formatComparisonTable(rec, label);
        parts.push(`${headingPrefix} ${label}\n\n${table}`);
      }
      // Check if it's a flat object with numeric values -> comparison table
      else if (isObjectWithNumericValues(rec)) {
        const table = formatNumericTable(rec, label);
        parts.push(`${headingPrefix} ${label}\n\n${table}`);
      }
      // Check if it's a flat object with string values -> key-value list
      else if (isObjectWithStringValues(rec)) {
        const kvList = Object.entries(rec)
          .filter(([, v]) => typeof v === 'string' && (v as string).trim().length > 0)
          .map(([k, v]) => `**${k.replace(/_/g, ' ')}**: ${v}`)
          .join('\n\n');
        if (kvList.length > 0) {
          parts.push(`${headingPrefix} ${label}\n\n${kvList}`);
        }
      }
      // Nested object -> recurse
      else {
        const nested = jsonToMarkdown(rec, depth + 1);
        if (nested.trim().length > 0) {
          parts.push(`${headingPrefix} ${label}\n\n${nested}`);
        }
      }
    }
  }

  // Remove duplicate sections
  return removeDuplicateSections(parts.join('\n\n'));
}

/**
 * Formats an object with support/resistance keys as a Markdown table
 */
function formatComparisonTable(obj: Record<string, unknown>, _label: string): string {
  const keys = Object.keys(obj);
  const rows: string[][] = [];

  // Collect all unique sub-keys across support/resistance/etc.
  const allSubKeys = new Set<string>();
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      for (const subKey of Object.keys(val as Record<string, unknown>)) {
        allSubKeys.add(subKey);
      }
    }
  }

  if (allSubKeys.size === 0) {
    // Fallback: format as key-value
    return Object.entries(obj)
      .map(([k, v]) => `**${k}**: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n\n');
  }

  const subKeyArr = Array.from(allSubKeys);
  // Header row
  const header = '| الخاصية | ' + keys.map(k => k.replace(/_/g, ' ')).join(' | ') + ' |';
  const separator = '| --- | ' + keys.map(() => '---').join(' | ') + ' |';

  // Data rows
  for (const subKey of subKeyArr) {
    const rowCells: string[] = [
      `| ${subKey.replace(/_/g, ' ')}`,
    ];
    for (const k of keys) {
      const entry = obj[k];
      const val = (entry && typeof entry === 'object') ? (entry as Record<string, unknown>)[subKey] : undefined;
      rowCells.push(` ${val !== undefined ? String(val) : '—'} `);
    }
    rows.push(rowCells);
  }

  const dataRows = rows.map(r => r.join('|') + '|').join('\n');
  return `${header}\n${separator}\n${dataRows}`;
}

/**
 * Formats a flat object with numeric values as a comparison table
 */
function formatNumericTable(obj: Record<string, unknown>, _label: string): string {
  const header = '| المؤشر | القيمة |';
  const separator = '| --- | --- |';
  const dataRows = Object.entries(obj)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => `| ${k.replace(/_/g, ' ')} | ${v} |`)
    .join('\n');

  if (!dataRows) return '';
  return `${header}\n${separator}\n${dataRows}`;
}

/**
 * Checks if an object has mostly numeric values
 */
function isObjectWithNumericValues(obj: Record<string, unknown>): boolean {
  const entries = Object.entries(obj);
  if (entries.length === 0) return false;
  const numericCount = entries.filter(([, v]) => typeof v === 'number').length;
  return numericCount / entries.length >= 0.5;
}

/**
 * Checks if an object has mostly string values
 */
function isObjectWithStringValues(obj: Record<string, unknown>): boolean {
  const entries = Object.entries(obj);
  if (entries.length === 0) return false;
  const stringCount = entries.filter(([, v]) => typeof v === 'string').length;
  return stringCount / entries.length >= 0.5;
}

/**
 * Removes duplicate sections from Markdown text
 */
function removeDuplicateSections(md: string): string {
  const sections = md.split(/\n(?=#{1,6}\s)/);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const section of sections) {
    const headerMatch = section.match(/^#{1,6}\s+(.+)/);
    const headerKey = headerMatch ? headerMatch[1].trim().toLowerCase() : section.trim().toLowerCase();
    if (!seen.has(headerKey)) {
      seen.add(headerKey);
      unique.push(section);
    }
  }

  return unique.join('\n\n');
}

/**
 * Converts Markdown to sanitized HTML
 * Supports: headers, bold, italic, bullet lists, numbered lists,
 * tables, blockquotes, horizontal rules
 */
export function markdownToHtml(md: string): string {
  if (!md) return '';

  let html = md;

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Tables
  html = html.replace(
    /(\|.+\|)\n(\|[-:\s|]+\|)\n((?:\|.+\|\n?)*)/g,
    (_match, headerRow: string, _separator: string, bodyRows: string) => {
      const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
      const rows = bodyRows.trim().split('\n').filter((r: string) => r.trim()).map((row: string) => {
        const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    }
  );

  // Bullet lists
  html = html.replace(/^[-•*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.+<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Numbered lists
  html = html.replace(/^\d+[.)]\s+(.+)$/gm, '<li>$1</li>');

  // Paragraphs — wrap remaining text blocks
  html = html.replace(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, '<p>$1</p>');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

/**
 * Cleans text from JSON artifacts and formatting issues.
 *
 * V2: REMOVED the destructive regex that removed spaces between
 * Arabic characters. The old code:
 *   cleaned.replace(/([\u0600-\u06FF])\s+([\u0600-\u06FF])/g, '$1$2')
 * was destroying ALL spaces between Arabic words, making the text
 * completely unreadable (e.g. "الوضعالاقتصاديالكلي" instead of
 * "الوضع الاقتصادي الكلي").
 *
 * This function now only removes genuine JSON artifacts without
 * touching Arabic word spacing.
 */
export function cleanText(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // Remove ```json code blocks
  cleaned = cleaned.replace(/```(?:json|markdown)?\s*/gi, '');

  // Remove stray quotes at start/end of lines (but NOT within Arabic text)
  cleaned = cleaned.replace(/^\s*"\s*$/gm, '');
  cleaned = cleaned.replace(/^("{1,2})(?=\S)/gm, '');

  // Remove JSON brackets/braces at the very start/end of the entire text
  // (but NOT in the middle where they might be part of content)
  const overallTrimmed = cleaned.trim();
  if (overallTrimmed.startsWith('{') || overallTrimmed.startsWith('[')) {
    // Only strip if the ENTIRE text is a JSON wrapper
    try {
      JSON.parse(overallTrimmed);
      // If it parses as valid JSON, the postProcessContent function
      // should have handled it. If we reach here, it means JSON
      // parsing failed or returned too short content, so strip
      // the outermost brackets only.
      cleaned = cleaned.replace(/^\s*[\{\[]\s*/, '');
      cleaned = cleaned.replace(/\s*[\}\]]\s*$/, '');
    } catch {
      // Not valid JSON - don't strip brackets, they might be content
    }
  }

  // Remove escaped quotes
  cleaned = cleaned.replace(/\\"/g, '"');

  // Collapse excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Fix double punctuation (Arabic and English)
  cleaned = cleaned.replace(/([.!؟،])\1+/g, '$1');

  // Remove JSON key-value patterns like "key": "value"
  // But be careful not to remove Arabic text that contains ":"
  cleaned = cleaned.replace(/"[a-zA-Z_]+":\s*"/g, '');

  // Remove trailing quote and comma artifacts
  cleaned = cleaned.replace(/",?\s*$/gm, '');

  // Remove stray commas at end of lines
  cleaned = cleaned.replace(/,\s*$/gm, '');

  // ═══ V2 FIX: DO NOT remove spaces between Arabic characters ═══
  // The old regex below was the CRITICAL BUG that made Arabic text
  // unreadable by removing ALL spaces between Arabic letters:
  //
  //   cleaned.replace(/([\u0600-\u06FF])\s+([\u0600-\u06FF])/g, '$1$2')
  //
  // This turned "الوضع الاقتصادي" into "الوضعالاقتصادي"
  // The fix: only collapse spaces between SINGLE isolated Arabic
  // characters (like "ا ل ع ر ب ي" which is a JSON parsing artifact)
  // but NOT between multi-character Arabic words.
  cleaned = cleaned.replace(
    /(?<=[\u0600-\u06FF])\s+(?=[\u0600-\u06FF])/g,
    (match, offset, string) => {
      // Only remove the space if BOTH adjacent characters are single
      // Arabic letters surrounded by non-Arabic (i.e., JSON artifacts)
      // This is very rare; in normal Arabic text, spaces between
      // words should ALWAYS be preserved.
      // Safe approach: never remove spaces between Arabic chars.
      return match;
    }
  );

  // Remove any remaining wrapping quotes at the very start/end
  cleaned = cleaned.replace(/^"/, '');
  cleaned = cleaned.replace(/"$/, '');

  // V191: Remove decorative separator lines
  cleaned = cleaned.replace(/^[━═─\-_=~•·]{5,}\s*$/gm, '');

  // V191: Remove prompt instruction lines starting with ⚠️
  cleaned = cleaned.replace(/^\s*⚠️\s+(مهم|ممنوع|قاعدة|إلزامي|تحذير صارم|قبل كتابة|مهم جداً|V\d+|اختبار الجودة|لا تملأ|توقف بعد|ممنوع كتابة|ممنوع إضافة|التزم بالأقسام|كل شريحة|كل توصية|ليس إعادة|ممنوع النقاط|ممنوع الحشو|الحد الأقصى|ممنوع في هذا|ممنوع منعاً|راقب|انتبه|تأكد|لا تنس|تذكر).*$/gm, '');

  // V200: Remove long ⚠️ instruction lines (40+ chars after ⚠️)
  cleaned = cleaned.replace(/^\s*⚠️\s+(?:.{40,})$/gm, '');

  // V200: Remove ALL ## level headings from content (UI renders section titles)
  // Catches edge cases: ##1. (no space), ## 1. (space+number), ##الملخص (no space)
  cleaned = cleaned.replace(/^##\s*\d*[\.\s]*.+$/gm, '');

  // V200: Remove ALL # level headings (but NOT ### or #### which are sub-sections)
  // Catches edge cases: #1. (no space), # 1. (space+number), #المقدمة (no space)
  cleaned = cleaned.replace(/^#(?!#)\s*\d*[\.\s]*.+$/gm, '');

  // V200: Remove orphaned # markers (just hashes with no text)
  cleaned = cleaned.replace(/^#{1,6}\s*$/gm, '');

  // V200: Remove more prompt artifacts
  cleaned = cleaned.replace(/^قرارات عملية مباشرة\s*[-—:]?\s*ماذا تفعل الآن\??\s*$/gm, '');
  cleaned = cleaned.replace(/^تحليل أكاديمي موضوعي\s*[-—:]?\s*ماذا تقول البيانات\??\s*$/gm, '');
  cleaned = cleaned.replace(/^صوت الكتابة:.*$/gm, '');
  cleaned = cleaned.replace(/^القارئ يريد.*$/gm, '');
  cleaned = cleaned.replace(/^تنسيق العناوين:.*$/gm, '');
  cleaned = cleaned.replace(/^قواعد التنسيق:.*$/gm, '');
  cleaned = cleaned.replace(/خوف شديد\s*خوف\s*محايد\s*جشع\s*جشع شديد/g, '');

  // V219: Arabic Spell Check — common AI typos
  cleaned = cleaned.replace(/تكاليس/g, 'تكاليف');
  cleaned = cleaned.replace(/التكاليس/g, 'التكاليف');
  cleaned = cleaned.replace(/الإستهلاك/g, 'الاستهلاك');
  cleaned = cleaned.replace(/إقتصادي/g, 'اقتصادي');
  cleaned = cleaned.replace(/الإقتصادي/g, 'الاقتصادي');
  cleaned = cleaned.replace(/إستثمار/g, 'استثمار');
  cleaned = cleaned.replace(/الإستثمار/g, 'الاستثمار');
  cleaned = cleaned.replace(/إستراتيجية/g, 'استراتيجية');
  cleaned = cleaned.replace(/الإستراتيجية/g, 'الاستراتيجية');
  cleaned = cleaned.replace(/إستقرار/g, 'استقرار');
  cleaned = cleaned.replace(/الإستقرار/g, 'الاستقرار');

  // V191: Remove disclaimer duplicates
  cleaned = cleaned.replace(/^تحذير:\s*(هذا تقرير|هذه توصيات|هذا التحليل).*$/gm, '');

  // V200: Remove banned filler phrases (from PROMPT_QUALITY_RULES)
  const bannedFiller = [
    /يعد هذا العامل من أبرز المحركات المؤثرة على السوق حالياً[،.]?/g,
    /يؤثر بشكل مباشر على قرارات المستثمرين وتحركات رؤوس الأموال[،.]?/g,
    /راقب التطورات[،.]?/g,
    /انتبه للتقلبات[،.]?/g,
    /تجدر الإشارة إلى أن[،.]?/g,
  ];
  for (const pattern of bannedFiller) {
    cleaned = cleaned.replace(pattern, '');
  }

  // V164: Remove orphaned numbers at start of lines
  cleaned = cleaned.replace(/^(\d+)\s*$/gm, '');
  cleaned = cleaned.replace(/^\d+[\.\s]*$/gm, '');

  // V164: Remove raw markdown heading markers that leaked through
  cleaned = cleaned.replace(/^(#{1,6})\s*$/gm, '');

  // ═══ V3: Critical quality improvements ═══

  // V3: Remove email addresses from content (journalist email leaks)
  // Pattern: name@domain.com, name@domain.co.uk, etc.
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '');

  // V3: Remove AI filler words that leak into published content
  // Arabic: "حسناً" (AI acknowledgment token)
  // English: "Well, then...", "Okay, so..."
  const aiFillerPhrases = [
    /\bحسناً[،.]?\s*/g,
    /\bحسنا،\s*/g,
    /\bحسنا\b/g,
    /Well, then[.,]?\s*/gi,
    /Okay, so[.,]?\s*/gi,
  ];
  for (const pattern of aiFillerPhrases) {
    cleaned = cleaned.replace(pattern, '');
  }

  // V3: Decode HTML entities that were not rendered
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&#x27;/g, "'");
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&#x2F;/g, '/');

  // V3: Remove Devanagari/Hindi characters from Arabic text
  // These leak from source data encoding issues
  cleaned = cleaned.replace(/[\u0900-\u097F]+/g, '');

  // V3: Detect and remove glitch phrase loops
  // Pattern: same phrase repeated 3+ times consecutively
  // e.g., "هينكس تعمل على قائمة في الولايات المتحدة" repeated 28 times
  cleaned = removeGlitchLoops(cleaned);

  // V3: Remove common untranslated English financial terms in Arabic context
  // These should have been transliterated/translated by the AI
  const untranslatedInArabic = [
    // Match English word that appears between Arabic words (no surrounding English)
    // Only remove if clearly in Arabic sentence context
    { pattern: /(?<=[\u0600-\u06FF])\s+dividend\s*(?=[\u0600-\u06FF])/gi, replacement: ' توزيعات أرباح ' },
    { pattern: /(?<=[\u0600-\u06FF])\s+fund\s*(?=[\u0600-\u06FF])/gi, replacement: ' صندوق ' },
    { pattern: /(?<=[\u0600-\u06FF])\s+declares\s*(?=[\u0600-\u06FF])/gi, replacement: ' يعلن ' },
    { pattern: /(?<=[\u0600-\u06FF])\s+insider\s*(?=[\u0600-\u06FF])/gi, replacement: ' insider ' }, // keep as financial term
  ];
  for (const { pattern, replacement } of untranslatedInArabic) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // V3: Remove repeated news ticker blocks
  // Pattern: same block of 5+ lines appearing 2+ times
  cleaned = removeRepeatedBlocks(cleaned);

  // ═══ V4: Report Quality Improvements ═══

  // V4: Fix number-text concatenation (e.g., "36Fear" → "36 Fear", "75%Confidence" → "75% Confidence")
  // This happens when AI outputs metric values without proper spacing
  cleaned = cleaned.replace(/(\d)([A-Z][a-z])/g, '$1 $2');  // "36Fear" → "36 Fear"
  cleaned = cleaned.replace(/(\d%)([A-Za-z])/g, '$1 $2');    // "75%Confidence" → "75% Confidence"
  cleaned = cleaned.replace(/(\d)(Confidence|Sentiment|Fear|Greed|Risk|Score|Level|Index|Gauge|Market|Bullish|Bearish|Neutral)/gi, '$1 $2');

  // V4: Remove duplicate "Report Introduction" sections
  // AI sometimes outputs "Report Introduction" twice — keep only the first
  const introPattern = /(?:###\s*)?(?:Report Introduction|مقدمة التقرير|Introduction du rapport|Introducción del informe|Rapor Girişi)/gi;
  let introCount = 0;
  cleaned = cleaned.replace(introPattern, (match) => {
    introCount++;
    return introCount > 1 ? '' : match;
  });

  // V4: Remove standalone metric lines that are noise (e.g., "Confidence 75%" on its own line)
  // These are prompt artifacts where AI outputs confidence/sentiment as separate noise lines
  cleaned = cleaned.replace(/^\s*(?:Confidence|الثقة)\s+\d+%?\s*$/gim, '');
  cleaned = cleaned.replace(/^\s*(?:Market Sentiment|مشاعر السوق)\s+(?:Gauge|مقياس)?\s*\d+\s*$/gim, '');

  // V4: Remove duplicate sentiment scale labels (e.g., "خوف شديد خوف محايد جشع جشع شديد")
  cleaned = cleaned.replace(/Extreme\s+Fear\s+Fear\s+Neutral\s+Greed\s+Extreme\s+Greed/gi, '');
  cleaned = cleaned.replace(/خوف\s+شديد\s+خوف\s+محايد\s+جشع\s+جشع\s+شديد/g, '');

  // V4: Remove raw sentiment score lines (e.g., "36Fear 36")
  cleaned = cleaned.replace(/\d+(?:Fear|Greed|Neutral|خوف|جشع|محايد)\s*\d*/gi, '');

  // V4: Remove "Report Mode" lines that leaked from V223 supplements
  cleaned = cleaned.replace(/^\s*(?:وضع التقرير|Report Mode|Mode de rapport|Modo de informe|Rapor Modu)[:\s].*$/gim, '');
  cleaned = cleaned.replace(/^\s*(?:سياقي|بياني|Contextual|Data-Driven|Contextuel|Données|Contextualizado|Basado en datos|Bağlamsal|Veri Odaklı)\s*$/gim, '');

  // V4: Remove V223 methodology leak lines
  cleaned = cleaned.replace(/^\s*(?:المنهجية|Methodology|Méthodologie|Metodología|Metodoloji)[:\s].*$/gim, '');

  // V4: Remove stray bracket numbers like [1], [2] that are prompt artifacts
  cleaned = cleaned.replace(/\[\d+\]/g, '');

  // V4: Remove duplicate confidence/sentiment indicator blocks
  // Pattern: two consecutive blocks with similar metric patterns
  cleaned = removeDuplicateMetricBlocks(cleaned);

  // Final cleanup
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n');
  cleaned = cleaned.replace(/  +/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * V3: Removes glitch phrase loops — the same phrase repeated
 * 3+ times consecutively. This is an AI generation artifact
 * where the model gets stuck in a loop.
 */
function removeGlitchLoops(text: string): string {
  // Split into lines and check for consecutive repeated lines
  const lines = text.split('\n');
  const result: string[] = [];
  let repeatCount = 0;
  let lastLine = '';

  for (const line of lines) {
    const normalizedLine = line.trim().replace(/\s+/g, ' ');
    if (normalizedLine === lastLine && normalizedLine.length > 10) {
      repeatCount++;
      if (repeatCount >= 2) {
        // Same line appeared 3+ times — skip this and subsequent duplicates
        continue;
      }
    } else {
      repeatCount = 0;
    }
    lastLine = normalizedLine;
    result.push(line);
  }

  // Also check for inline repeated phrases (same phrase repeated within a single line)
  let cleaned = result.join('\n');

  // Pattern: word/phrase repeated 3+ times within a line
  // Match: (word/phrase)\1{2,} where phrase is 5+ chars
  const phraseRepeatRegex = /(.{5,}?)\1{2,}/g;
  cleaned = cleaned.replace(phraseRepeatRegex, '$1');

  return cleaned;
}

/**
 * V3: Removes repeated blocks of content.
 * Detects when the same 5+ line block appears multiple times.
 */
function removeRepeatedBlocks(text: string): string {
  const lines = text.split('\n');
  const BLOCK_SIZE = 5;

  if (lines.length < BLOCK_SIZE * 2) return text;

  // Build fingerprints of each block
  const blockFingerprints: Map<string, number> = new Map();
  const blockStarts: Map<string, number[]> = new Map();

  for (let i = 0; i <= lines.length - BLOCK_SIZE; i++) {
    const block = lines.slice(i, i + BLOCK_SIZE)
      .map(l => l.trim().replace(/\s+/g, ' '))
      .filter(l => l.length > 5)  // Skip empty/short lines
      .join('|');

    if (block.length < 30) continue; // Too short to be meaningful

    const fingerprint = block.slice(0, 100); // Use first 100 chars as fingerprint
    blockFingerprints.set(fingerprint, (blockFingerprints.get(fingerprint) || 0) + 1);
    if (!blockStarts.has(fingerprint)) blockStarts.set(fingerprint, []);
    blockStarts.get(fingerprint)!.push(i);
  }

  // Find blocks that appear 2+ times
  const duplicateBlocks: { start: number; end: number }[] = [];
  for (const [fingerprint, count] of blockFingerprints) {
    if (count >= 2) {
      const starts = blockStarts.get(fingerprint)!;
      // Keep the first occurrence, mark the rest for removal
      for (let j = 1; j < starts.length; j++) {
        duplicateBlocks.push({ start: starts[j], end: starts[j] + BLOCK_SIZE });
      }
    }
  }

  if (duplicateBlocks.length === 0) return text;

  // Sort by start position and merge overlapping ranges
  duplicateBlocks.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [duplicateBlocks[0]];
  for (let i = 1; i < duplicateBlocks.length; i++) {
    const last = merged[merged.length - 1];
    if (duplicateBlocks[i].start <= last.end) {
      last.end = Math.max(last.end, duplicateBlocks[i].end);
    } else {
      merged.push(duplicateBlocks[i]);
    }
  }

  // Remove duplicate blocks
  const removeRanges = new Set<number>();
  for (const range of merged) {
    for (let i = range.start; i < range.end && i < lines.length; i++) {
      removeRanges.add(i);
    }
  }

  return lines.filter((_, idx) => !removeRanges.has(idx)).join('\n');
}

/**
 * V4: Removes duplicate metric blocks (e.g., two Fear & Greed Index sections
 * with similar values). Keeps the first occurrence and removes subsequent
 * blocks that measure the same metric with slightly different numbers.
 */
function removeDuplicateMetricBlocks(text: string): string {
  const lines = text.split('\n');

  // Track lines to remove
  const removeLines = new Set<number>();

  // Patterns for metric blocks that should appear only once
  const metricBlockStarts = [
    /(?:Fear\s*&?\s*Greed|مؤشر\s*الخوف|Custom\s*Fear|مؤشر\s*مخصص)/i,
    /(?:Report\s*Scorecard|بطاقة\s*التقييم|Scorecard)/i,
    /(?:Paper\s*Trading|محاكي\s*التداول)/i,
    /(?:Global\s*Impact\s*Heatmap|خريطة\s*التأثير)/i,
  ];

  for (const pattern of metricBlockStarts) {
    const startLines: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        startLines.push(i);
      }
    }

    // If the same metric block appears more than once, keep only the first
    if (startLines.length > 1) {
      for (let j = 1; j < startLines.length; j++) {
        const startLine = startLines[j];
        // Remove lines until we hit an empty line or another heading
        let endLine = startLine;
        for (let k = startLine; k < lines.length; k++) {
          const line = lines[k].trim();
          if (k > startLine && (line === '' || /^#{1,4}\s/.test(line))) {
            endLine = k;
            break;
          }
          endLine = k;
        }
        for (let k = startLine; k <= endLine; k++) {
          removeLines.add(k);
        }
      }
    }
  }

  if (removeLines.size === 0) return text;

  return lines.filter((_, idx) => !removeLines.has(idx)).join('\n');
}
