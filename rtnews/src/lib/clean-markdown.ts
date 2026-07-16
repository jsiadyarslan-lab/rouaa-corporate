/**
 * cleanMarkdown — Enhanced Markdown-to-HTML converter for رؤى reports.
 *
 * V320 improvements:
 * 1. Unified stripMarkdownHeadings() — THE single source of truth for #/## removal
 * 2. Strips raw # / ## heading markers ULTRA-AGGRESSIVELY (UI renders section titles)
 * 3. Keeps ### and #### for sub-section rendering
 * 4. Merges duplicate sections (e.g., "الملخص التنفيذي" appearing twice)
 * 5. Converts Markdown formatting to clean HTML
 * 6. Preserves numbers, percentages, and analysis content
 * 7. Handles RTL/LTR marks, leading whitespace, no-space patterns, zero-width chars
 * 8. V320: Enhanced merged-heading splitting (3+ headings on one line)
 * 9. V320: Robust Arabic word boundary detection for concatenated AI output
 * 10. V320: Post-processing verification of space separation
 */

// ═══════════════════════════════════════════════════════════════
// V210: UNIFIED stripMarkdownHeadings() — Single Source of Truth
// Used by: page.tsx (server), ReportDetailClient.tsx (client),
//          cleanMarkdown() (HTML path), and ReportViewer.tsx
// ═══════════════════════════════════════════════════════════════

/**
 * Comprehensive invisible/zero-width character class.
 * Covers: zero-width space/joiner/non-joiner, RTL/LTR marks,
 * bidi controls, word joiner, bidi isolate/override chars, BOM.
 */
const ZW = '[\\u200B-\\u200D\\u200E\\u200F\\u202A-\\u202E\\u2060\\u2066-\\u2069\\uFEFF]*';

/**
 * stripMarkdownHeadings — V210: THE definitive function for removing
 * raw # and ## markdown heading markers from report text.
 *
 * Design principles:
 * - UI renders section titles, so #/## headings are ALWAYS redundant
 * - ### and #### are preserved for sub-section rendering
 * - Handles ALL known edge cases: zero-width chars, RTL marks,
 *   no-space patterns, numbered headings, inline headings
 * - Must be safe to call multiple times (idempotent)
 *
 * @param text Raw markdown text from AI-generated reports
 * @returns Cleaned text with ALL #/## markers removed
 */
export function stripMarkdownHeadings(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  // ── PASS 0: Split merged heading lines ──
  // V320: Handles patterns like "## مقدمة التقرير ## الملخص التنفيذي ## التوصيات"
  // where multiple ## headings are concatenated on the same line.
  // Split them into separate lines so subsequent passes can handle each.
  // V320: Repeated pass to handle 3+ merged headings on one line.
  for (let i = 0; i < 5; i++) {
    const prev = cleaned;
    cleaned = cleaned.replace(/(#{1,2}(?!#)\s*[\u0600-\u06FF\w][^\n#]*?)\s*(#{1,2}(?!#)\s*[\u0600-\u06FF])/g, '$1\n$2');
    if (cleaned === prev) break; // No more changes needed
  }
  // Also split patterns like "##1. Title ##2. Title" (numbered headings merged)
  for (let i = 0; i < 3; i++) {
    const prev = cleaned;
    cleaned = cleaned.replace(/(#{1,2}(?!#)\s*\d+[\.\s]*[\u0600-\u06FF\w][^\n#]*?)\s*(#{1,2}(?!#)\s*\d+[\.\s]*[\u0600-\u06FF])/g, '$1\n$2');
    if (cleaned === prev) break;
  }

  // ── PASS 1: Remove ## heading LINES (entire line including title text) ──
  // The UI renders section titles, so the entire ## line is redundant.
  // Handles: ## Title, ##1. Title, ## 1. Title, [ZW]## Title,   ## Title
  cleaned = cleaned.replace(new RegExp(`^\\s*${ZW}##(?!#)\\s*\\d*[\\.\\s]*.*$`, 'gm'), '');

  // ── PASS 2: Remove # heading LINES (entire line including title text) ──
  // Same as above but for # (h1) level headings.
  // The negative lookahead (?!#) ensures we don't match ## or ###
  cleaned = cleaned.replace(new RegExp(`^\\s*${ZW}#(?!#)\\s*\\d*[\\.\\s]*.*$`, 'gm'), '');

  // ── PASS 3: Remove orphaned # markers (lines with only # and whitespace) ──
  cleaned = cleaned.replace(new RegExp(`^\\s*${ZW}#{1,6}\\s*$`, 'gm'), '');

  // ── PASS 4: Remove inline ## markers (anywhere in text) ──
  // Catches ## that appear mid-paragraph, not at line start.
  // Preserves the text after ##, only removes the marker itself.
  // Handles: ##Title, ## Title, ##1. Title, ## 2.Title
  // Does NOT affect ### or #### (negative lookahead)
  cleaned = cleaned.replace(/##(?!#)\s*(?:\d+[\.\s]*)?/g, '');

  // ── PASS 5: Remove inline # markers (at word boundaries or line start) ──
  // Only removes # when preceded by whitespace or line start
  // to avoid removing # in contexts like "C#" or "Issue #123"
  // Does NOT affect ## or ### (negative lookahead)
  cleaned = cleaned.replace(/(?<=\s|^)#(?!#)\s*(?:\d+[\.\s]*)?/gm, '');

  // ── PASS 6: NUCLEAR FINAL PASS ──
  // Catch ANY remaining # or ## at the absolute start of a line.
  // This is the safety net for patterns all previous passes missed.
  // The negative lookahead (?=[^\n#]) ensures we don't strip ###
  cleaned = cleaned.replace(/^#{1,2}(?=[^\n#])/gm, '');

  // ── PASS 6b: ULTRA-NUKE — Remove #/## before Arabic text anywhere ──
  // V220: Catches patterns like "##التحليل" or "# 1. المقدمة" that
  // previous passes might miss due to zero-width chars or other edge cases.
  // Only removes #/## when followed by Arabic, digits, or whitespace+content.
  cleaned = cleaned.replace(/#{1,2}(?!#)\s*(?=[\u0600-\u06FF\d])/gm, '');

  // ── PASS 7: Clean up artifacts left by heading removal ──
  // Orphaned section numbers like "1. " or "3. " on their own line
  cleaned = cleaned.replace(/^\s*\d+\.\s*$/gm, '');
  // Collapse excessive newlines (3+ → 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * stripSummaryMarkdown — Clean markdown from summary text for
 * card/list display. More aggressive than stripMarkdownHeadings
 * because summaries need to be clean single-line text.
 *
 * @param text Raw summary text that may contain markdown
 * @returns Clean plain text suitable for card display
 */
export function stripSummaryMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;
  // Remove #/## heading lines
  cleaned = cleaned.replace(/^\s*[\u200F\u200E]*#{1,2}(?!#)\s*.*$/gm, '');
  // Remove inline #/## before Arabic text
  cleaned = cleaned.replace(/#{1,2}(?!#)\s*(?:\d+[\.\s]*)?[\u0600-\u06FF]/g, m => m.replace(/#{1,2}\s*(?:\d+[\.\s]*)?/, ''));
  // Remove bold/italic markers
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  // Remove list markers
  cleaned = cleaned.replace(/^[-*]\s+/gm, '');

  // V225: Strip standalone heading lines BEFORE collapsing newlines.
  // AI-generated sections often have a sub-heading on its own line like:
  //   الأهمية الاستراتيجية بالأرقام\n\nتمثل الديون السيادية...
  // The heading is 2-8 words, followed by a blank line, then the body.
  // We detect these by checking: short line (<60 chars, 2-8 words)
  // followed by a longer line or blank line.
  cleaned = cleaned.replace(/^([\u0600-\u06FF\w\s]{5,60})\n{1,2}/gm, (match, heading) => {
    const trimmedHeading = heading.trim();
    const wordCount = trimmedHeading.split(/\s+/).length;
    // Only strip if it looks like a heading: 2-8 words, no sentence-ending punctuation
    if (wordCount >= 2 && wordCount <= 8 && !/[.!؟？。]$/.test(trimmedHeading)) {
      return '';
    }
    return match;
  });

  // Clean up whitespace
  cleaned = cleaned.replace(/\n{3,}/g, ' ').replace(/\s+/g, ' ').trim();

  // V225: Strip leading sub-headings followed by a colon (e.g., "الأهمية الاستراتيجية بالأرقام:")
  cleaned = cleaned.replace(/^[\u0600-\u06FF\w\s]{5,50}[:\u061A\u061B\u061F]\s*/g, (match) => {
    const prefix = match.replace(/[:\u061A\u061B\u061F]\s*$/, '').trim();
    const wordCount = prefix.split(/\s+/).length;
    if (wordCount <= 8 && wordCount >= 2) return '';
    return match;
  });

  // V225: Strip leading sub-headings WITHOUT colon that got merged with body text.
  // Pattern: "الأهمية الاستراتيجية بالأرقام تمثل الديون السيادية..."
  // The heading "الأهمية الاستراتيجية بالأرقام" (2-8 words, no verb) got merged
  // with the body text after newline collapsing. We detect this by checking if the
  // first N words form a noun phrase (no verb) that doesn't start a proper sentence.
  // Known heading patterns from AI-generated reports:
  const knownHeadingPatterns = [
    'الأهمية الاستراتيجية بالأرقام',
    'السياق والأبعاد',
    'خلفية الأحداث',
    'الأبعاد الاستراتيجية',
    'نظرة عامة',
    'الأرقام الرئيسية',
    'الصورة الكلية',
    'ملخص الوضع',
    'أبرز التطورات',
    'السياق التاريخي',
  ];
  for (const heading of knownHeadingPatterns) {
    if (cleaned.startsWith(heading + ' ')) {
      cleaned = cleaned.slice(heading.length).trim();
      break;
    }
    if (cleaned.startsWith(heading)) {
      cleaned = cleaned.slice(heading.length).trim();
      break;
    }
  }

  return cleaned;
}

/**
 * truncateAtBoundary — V225: Smart truncation that respects Arabic word/sentence boundaries.
 *
 * Instead of blindly slicing at an arbitrary character count (which cuts mid-word
 * producing garbage like "هذا" at the end), this function:
 * 1. Prefers to truncate at a sentence boundary (。. ！! ؟ ?)
 * 2. Falls back to truncating at a word boundary (space)
 * 3. Only uses hard slice as last resort (when no boundary found within range)
 *
 * @param text The text to truncate
 * @param maxChars Maximum character count (will not exceed this)
 * @param ellipsis Optional suffix to append (default: '...')
 * @param minBoundary Minimum chars before looking for a boundary (default: 70% of maxChars)
 * @returns Truncated text that doesn't cut mid-word
 */
export function truncateAtBoundary(text: string, maxChars: number, ellipsis = '...', minBoundary?: number): string {
  if (!text || text.length <= maxChars) return text;
  const min = minBoundary ?? Math.floor(maxChars * 0.7);
  // Ensure min is not greater than maxChars - ellipsis length
  const effectiveMin = Math.min(min, maxChars - ellipsis.length);

  // Strategy 1: Find the last sentence boundary within [min, maxChars]
  // Arabic sentence endings: 。 . ！ ! ؟ ? \n
  const searchRange = text.slice(effectiveMin, maxChars + 1);
  const sentenceEndings = /[。.!！؟?\n]/g;
  let lastSentenceEnd = -1;
  let match;
  while ((match = sentenceEndings.exec(searchRange)) !== null) {
    lastSentenceEnd = match.index;
  }
  if (lastSentenceEnd >= 0) {
    const cutAt = effectiveMin + lastSentenceEnd + 1; // Include the punctuation
    return text.slice(0, cutAt).trimEnd() + ellipsis;
  }

  // Strategy 2: Find the last word boundary (space) within [min, maxChars]
  const lastSpace = text.lastIndexOf(' ', maxChars);
  if (lastSpace >= effectiveMin) {
    return text.slice(0, lastSpace).trimEnd() + ellipsis;
  }

  // Strategy 3: Hard cut at maxChars (last resort)
  return text.slice(0, maxChars - ellipsis.length).trimEnd() + ellipsis;
}

// --- Section deduplication helpers ---

interface Section {
  title: string;
  content: string;
  level: number;
}

/**
 * Parse a Markdown string into sections based on heading markers.
 */
function parseSections(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headingMatch[2].trim(),
        content: '',
        level: headingMatch[1].length,
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    } else {
      // Content before any heading — create an intro section
      if (!currentSection && line.trim()) {
        currentSection = {
          title: '',
          content: line + '\n',
          level: 0,
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Normalize Arabic text for comparison (remove diacritics, trim, lowercase).
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics (tashkeel)
    .replace(/[\u200F\u200E]/g, '')         // Remove RTL/LTR marks
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Check if two section titles are effectively the same (duplicates).
 * Handles cases like:
 * - Exact match: "الملخص التنفيذي" === "الملخص التنفيذي"
 * - Close match: "النتائج الرئيسية" ≈ "أبرز النقاط" (semantic siblings)
 */
function areDuplicateTitles(title1: string, title2: string): boolean {
  const n1 = normalizeArabic(title1);
  const n2 = normalizeArabic(title2);

  // Exact match after normalization
  if (n1 === n2) return true;

  // One is a substring of the other
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Known semantic duplicate pairs in Arabic financial reports
  const duplicatePairs: [string, string][] = [
    ['النتائج الرئيسية', 'أبرز النقاط'],
    ['الملخص التنفيذي', 'أهم النتائج'],
    ['التوصيات', 'الخطوات الموصى بها'],
    ['السيناريو المتفائل', 'السيناريو الإيجابي'],
    ['السيناريو المتشائم', 'السيناريو السلبي'],
    ['المؤشرات الرئيسية', 'أهم المؤشرات'],
    ['تأثير على السوق', 'التأثير على السوق'],
    ['نقاط التحليل', 'keyAnalysisPoints'],
  ];

  for (const [a, b] of duplicatePairs) {
    const na = normalizeArabic(a);
    const nb = normalizeArabic(b);
    if ((n1 === na && n2 === nb) || (n1 === nb && n2 === na)) return true;
  }

  return false;
}

/**
 * Merge duplicate sections: keep the longer/more detailed version.
 */
function mergeDuplicateSections(sections: Section[]): Section[] {
  const result: Section[] = [];
  const seen: Map<string, number> = new Map(); // normalized title -> index in result

  for (const section of sections) {
    const normalizedTitle = normalizeArabic(section.title);

    if (!section.title.trim()) {
      // Intro section with no title — keep as-is
      result.push(section);
      continue;
    }

    // Check if we've seen this title before
    let foundDuplicate = false;
    for (const [existingTitle, existingIdx] of seen.entries()) {
      if (areDuplicateTitles(existingTitle, section.title)) {
        // Merge: keep the longer content
        const existing = result[existingIdx];
        if (section.content.length > existing.content.length) {
          // New version is longer, replace
          result[existingIdx] = {
            ...existing,
            content: section.content,
          };
        }
        // If existing is longer, keep it (discard the duplicate)
        foundDuplicate = true;
        break;
      }
    }

    if (!foundDuplicate) {
      seen.set(normalizedTitle, result.length);
      result.push(section);
    }
  }

  return result;
}

// --- Markdown to HTML conversion ---

/**
 * Convert inline Markdown formatting to HTML.
 * Handles: **bold**, *italic*, `code`, [links](url)
 */
function convertInlineMarkdown(text: string): string {
  let result = text;

  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:var(--text-head,inherit)">$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong style="font-weight:700;color:var(--text-head,inherit)">$1</strong>');

  // Italic: *text* or _text_ (but not inside ** **)
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Inline code: `text`
  result = result.replace(/`(.+?)`/g, '<code style="padding:2px 6px;border-radius:4px;background:rgba(128,128,128,0.1);font-size:0.9em;font-family:var(--font-mono,monospace)">$1</code>');

  // Links: [text](url)
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:var(--accent,inherit);text-decoration:underline" target="_blank" rel="noopener">$1</a>');

  return result;
}

/**
 * Convert a Markdown block line to HTML.
 */
function convertBlockLine(line: string): string {
  const trimmed = line.trim();

  // Empty line → paragraph break
  if (!trimmed) return '';

  // V204: Heading markers that slipped through — for h1/h2 STRIP entirely,
  // for h3+ render as styled heading. The UI renders section titles,
  // so any # or ## heading is ALWAYS redundant and must not appear.
  // V220: Also catch ##Title (no space) and #1.Title patterns
  const headingMatch = trimmed.match(/^(#{1,6})\s*(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const title = convertInlineMarkdown(headingMatch[2]);
    // V204: h1/h2 headings are ALWAYS redundant — return empty to suppress
    if (level <= 2) return '';
    // h3+ headings are sub-section headings — render them
    const sizes: Record<number, string> = { 3: '1.1em', 4: '1em', 5: '0.95em', 6: '0.9em' };
    const size = sizes[level] || '1em';
    const tag = `h${Math.min(level, 6)}`;
    return `<${tag} style="font-size:${size};font-weight:700;margin-top:20px;margin-bottom:10px;color:var(--text-head,inherit);line-height:1.6;padding-bottom:6px;border-bottom:1px solid rgba(128,128,128,0.12)">${title}</${tag}>`;
  }

  // Blockquote: > text
  if (trimmed.startsWith('> ')) {
    const content = convertInlineMarkdown(trimmed.slice(2));
    return `<blockquote style="margin:8px 0;padding:8px 16px;border-right:3px solid var(--accent,currentColor);background:rgba(128,128,128,0.03);font-style:italic;color:var(--text2,inherit)">${content}</blockquote>`;
  }

  // Unordered list: - item or * item
  if (/^[-*]\s+/.test(trimmed)) {
    const content = convertInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''));
    return `<li style="font-size:13px;line-height:1.9;color:var(--text2,inherit);margin-bottom:4px;list-style-type:disc">${content}</li>`;
  }

  // Ordered list: 1. item
  if (/^\d+\.\s+/.test(trimmed)) {
    const content = convertInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''));
    return `<li style="font-size:13px;line-height:1.9;color:var(--text2,inherit);margin-bottom:4px;list-style-type:decimal">${content}</li>`;
  }

  // Horizontal rule: --- or ***
  if (/^[-*_]{3,}\s*$/.test(trimmed)) {
    return `<hr style="border:none;border-top:1px solid rgba(128,128,128,0.12);margin:20px 0">`;
  }

  // Regular paragraph
  const content = convertInlineMarkdown(trimmed);
  return `<p style="margin:8px 0;font-size:13px;line-height:1.9;color:var(--text2,inherit)">${content}</p>`;
}

/**
 * Wrap consecutive list items in <ol> or <ul> tags.
 */
function wrapListItems(html: string): string {
  // Wrap consecutive decimal list items in <ol>
  html = html.replace(
    /(<li[^>]*list-style-type:decimal[^>]*>[\s\S]*?<\/li>)(?:\s*(<li[^>]*list-style-type:decimal[^>]*>[\s\S]*?<\/li>))*/g,
    (match) => `<ol style="list-style:decimal;padding-right:20px;margin:8px 0">${match}</ol>`
  );

  // Wrap consecutive disc list items in <ul>
  html = html.replace(
    /(<li[^>]*list-style-type:disc[^>]*>[\s\S]*?<\/li>)(?:\s*(<li[^>]*list-style-type:disc[^>]*>[\s\S]*?<\/li>))*/g,
    (match) => `<ul style="list-style:disc;padding-right:20px;margin:8px 0">${match}</ul>`
  );

  return html;
}

/**
 * fixMissingSpaces — V300: Insert missing spaces between Arabic and Latin/digit text.
 *
 * AI-generated reports often have concatenated text like:
 * - "تحليلصعوديAI" → "تحليل صعودي AI"
 * - "السوق55%" → "السوق 55%"
 * - "NVDAشراء" → "NVDA شراء"
 * - "70%صعودي" → "70% صعودي"
 *
 * This function adds spaces at script boundaries:
 * - Arabic ↔ Latin letters
 * - Arabic ↔ digits
 * - Digits ↔ Arabic (after punctuation like %)
 * - Latin letters ↔ Arabic
 */
export function fixMissingSpaces(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let fixed = text;

  // 1. Arabic letter followed by Latin letter (no space between)
  // "تحليلصعوديAI" → "تحليلصعودي AI" (we can't split Arabic words, but we add space before Latin)
  fixed = fixed.replace(/([\u0600-\u06FF])([A-Za-z])/g, '$1 $2');

  // 2. Latin letter followed by Arabic letter
  // "NVDAشراء" → "NVDA شراء"
  fixed = fixed.replace(/([A-Za-z])([\u0600-\u06FF])/g, '$1 $2');

  // 3. Arabic letter followed by digit
  // "السوق55" → "السوق 55"
  fixed = fixed.replace(/([\u0600-\u06FF])(\d)/g, '$1 $2');

  // 4. Digit followed by Arabic letter (but not after % which is handled separately)
  // "55مليون" → "55 مليون"
  fixed = fixed.replace(/(\d)([\u0600-\u06FF])/g, '$1 $2');

  // 5. Percent/degree sign followed by Arabic
  // "70%صعودي" → "70% صعودي"
  fixed = fixed.replace(/([%°٪])([\u0600-\u06FF])/g, '$1 $2');

  // 6. Arabic followed by opening parenthesis/bracket (Latin)
  fixed = fixed.replace(/([\u0600-\u06FF])([\[(<])/g, '$1 $2');

  // 7. Closing parenthesis/bracket (Latin) followed by Arabic
  fixed = fixed.replace(/([\])>])([\u0600-\u06FF])/g, '$1 $2');

  // V320: Pre-pass — fix common AI concatenation patterns BEFORE general rules.
  // These patterns appear when AI merges Arabic analysis text with labels/tags.
  // "تحليلصعوديAI" → "تحليل صعودي AI" (split Arabic word at label boundary)
  // V320: Expanded label list with more financial/domain terms
  const ARABIC_LABELS = [
    'صعودي', 'هبوطي', 'محايد', 'إيجابي', 'سلبي', 'عالي', 'منخفض',
    'متوسط', 'مرتفع', 'كبير', 'صغير', 'قوي', 'ضعيف',
    'متفائل', 'متشائم', 'مستقر', 'مضطرب', 'آمن', 'مخاطر',
    'شراء', 'بيع', 'تجميع', 'مراقبة', 'استقرار', 'انخفاض',
    'ارتفاع', 'نمو', 'تراجع', 'تحسن', 'تدهور', 'تعافي',
    'اختراق', 'انهيار', 'تذبذب', 'ضغط', 'دعم', 'مقاومة',
    'إيرادات', 'أرباح', 'خسائر', 'مديونية', 'سيولة',
  ];
  const labelPattern = ARABIC_LABELS.join('|');
  const arabicLabelRegex = new RegExp(`([\\u0600-\\u06FF])((${labelPattern}))`, 'g');
  fixed = fixed.replace(arabicLabelRegex, '$1 $2');

  // V310: 8. Arabic punctuation (؟ ، ؛) followed by Arabic letter without space
  fixed = fixed.replace(/([؟،؛])([\u0600-\u06FF])/g, '$1 $2');

  // V310: 9. Arabic letter followed by English punctuation (: ; ! ?)
  fixed = fixed.replace(/([\u0600-\u06FF])([:;!?])/g, '$1 $2');

  // V310: 10. English punctuation followed by Arabic letter
  fixed = fixed.replace(/([:;!?])([\u0600-\u06FF])/g, '$1 $2');

  // V310: 11. Fix "##Title" patterns — add space after ## when followed by Arabic/digit
  fixed = fixed.replace(/(#{1,3})([\u0600-\u06FF])/g, '$1 $2');
  fixed = fixed.replace(/(#{1,3})(\d)/g, '$1 $2');

  // 12. Clean up double spaces created by the above
  fixed = fixed.replace(/  +/g, ' ');

  // V320: 13. Post-processing verification — ensure no Arabic↔Latin/Digit boundaries without space
  // This is a safety net that catches any patterns missed by the above rules.
  // Re-apply rules 1-4 to catch any new boundaries created by label splitting.
  fixed = fixed.replace(/([؀-ۿ])([A-Za-z])/g, '$1 $2');
  fixed = fixed.replace(/([A-Za-z])([؀-ۿ])/g, '$1 $2');
  fixed = fixed.replace(/([؀-ۿ])(�[�-�]|�[�-�]|�[�-�])/g, '$1 $2'); // Arabic→Emoji
  fixed = fixed.replace(/(�[�-�]|�[�-�]|�[�-�])([؀-ۿ])/g, '$1 $2'); // Emoji→Arabic

  // V320: 14. Final cleanup
  fixed = fixed.replace(/  +/g, ' ');

  return fixed;
}

/**
 * Main cleanMarkdown function.
 *
 * Takes raw Markdown text from AI-generated reports and converts it to clean HTML.
 * Phase 1 features:
 * - Strips raw # / ## / ### markers
 * - Merges duplicate sections (e.g., repeated "الملخص التنفيذي")
 * - Fixes missing spaces between Arabic/Latin/digit text
 * - Converts Markdown formatting to styled HTML
 * - Preserves numbers, percentages, and financial data
 */
export function cleanMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';

  // V320: Fix missing spaces between Arabic/Latin/digit text FIRST.
  // This handles concatenation issues like "تحليلصعوديAI" → "تحليل صعودي AI"
  let text = fixMissingSpaces(markdown);

  // V320: Pre-split merged heading lines BEFORE stripMarkdownHeadings.
  // This ensures "## مقدمة ## الملخص" on one line gets properly separated.
  text = splitMergedHeadings(text);

  // V210: Use the unified stripMarkdownHeadings() as the FIRST step.
  // This is THE single source of truth for #/## removal.
  text = stripMarkdownHeadings(text);

  // Remove overly-long heading markers (7+ hashes — not standard markdown)
  text = text.replace(/^#{7,}\s+/gm, '');

  // Step 1: Parse into sections
  const sections = parseSections(text);

  // Step 2: Merge duplicate sections
  const mergedSections = mergeDuplicateSections(sections);

  // V210: Apply stripMarkdownHeadings again to each section's content,
  // plus additional cleanup for prompt artifacts and decorative elements.
  for (const section of mergedSections) {
    section.content = stripMarkdownHeadings(section.content)
      .replace(/^[━═─\-_=~•·]{3,}\s*$/gm, '')        // Remove decorative lines
      .replace(/^\s*⚠️\s+(مهم|ممنوع|قاعدة|إلزامي|تحذير صارم|قبل كتابة|مهم جداً|V\d+|راقب|انتبه|تأكد|لا تنس|تذكر).*$/gm, '')  // Remove prompt artifacts
      .replace(/^\s*⚠️\s+(?:.{40,})$/gm, '')         // V200: Remove long ⚠️ instruction lines
      .replace(/^تحذير:\s*(هذا تقرير|هذه توصيات|هذا التحليل).*$/gm, '')  // Remove disclaimer duplicates
      .replace(/^قرارات عملية مباشرة\s*[-—:]?\s*ماذا تفعل الآن\??\s*$/gm, '')  // V200: Prompt artifacts
      .replace(/^تحليل أكاديمي موضوعي\s*[-—:]?\s*ماذا تقول البيانات\??\s*$/gm, '')  // V200: Prompt artifacts
      .replace(/^صوت الكتابة:.*$/gm, '')               // V200: Prompt artifacts
      .replace(/^القارئ يريد.*$/gm, '')                 // V200: Prompt artifacts
      .replace(/خوف شديد\s*خوف\s*محايد\s*جشع\s*جشع شديد/g, '')  // Raw sentiment text
      .replace(/\*\*\s*\*\*/g, '')                    // Empty bold markers
      .replace(/__\s*__/g, '')                          // Empty underline markers
      .replace(/\n{3,}/g, '\n\n');                     // Collapse excessive newlines
  }

  // Step 3: Convert each section to HTML
  const htmlParts: string[] = [];

  for (const section of mergedSections) {
    if (section.title) {
      // V201: For h1/h2 level sections, DON'T render heading — UI already shows section titles.
      // Only render h3+ level sections as visible headings.
      if (section.level >= 3) {
        const sizes: Record<number, string> = {
          3: '1.1em',
          4: '1em',
          5: '0.95em',
          6: '0.9em',
        };
        const size = sizes[section.level] || '1.1em';
        const tag = `h${Math.min(section.level, 6)}`;
        htmlParts.push(
          `<${tag} style="font-size:${size};font-weight:700;margin-top:20px;margin-bottom:10px;color:var(--text-head,inherit);line-height:1.6;padding-bottom:6px;border-bottom:1px solid rgba(128,128,128,0.12)">${convertInlineMarkdown(section.title)}</${tag}>`
        );
      }
      // h1/h2 level: skip the heading, just render the content (UI shows section titles)
    }

    // Convert section content line by line
    const lines = section.content.split('\n');
    const contentParts: string[] = [];

    for (const line of lines) {
      const html = convertBlockLine(line);
      if (html) contentParts.push(html);
    }

    let sectionHtml = contentParts.join('\n');

    // Wrap list items in proper list tags
    sectionHtml = wrapListItems(sectionHtml);

    htmlParts.push(sectionHtml);
  }

  return htmlParts.join('\n');
}

/**
 * V320: splitMergedHeadings — Pre-split merged heading lines before processing.
 * Handles the common AI pattern where multiple ## headings appear on one line:
 *   "## مقدمة التقرير ## الملخص التنفيذي ## التحليل"
 *   "##1. المقدمة ##2. الملخص التنفيذي"
 *   "### السيناريو المتفائل ### السيناريو المحايد"
 *
 * Also handles inline heading markers that got concatenated with content:
 *   "مقدمة التقرير## الملخص التنفيذي" (missing newline before ##)
 */
function splitMergedHeadings(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let result = text;

  // Pattern 1: Multiple ## or # headings on the same line (separated by optional spaces)
  // e.g., "## مقدمة ## الملخص" or "## 1. المقدمة ## 2. الملخص"
  for (let i = 0; i < 5; i++) {
    const prev = result;
    result = result.replace(
      /([\u0600-\u06FF\w\s."'\-–—,.:؛؟)]+)\s*(#{1,3}(?!#)\s*(?:\d+[\.\s]*)?[\u0600-\u06FF])/g,
      (match, before, headingStart) => {
        // Only split if 'before' looks like end of a heading (not mid-content)
        // Heuristic: the text before the ## should be 2-8 words (heading-like)
        const words = before.trim().split(/\s+/);
        if (words.length >= 1 && words.length <= 12) {
          return before + '\n' + headingStart;
        }
        return match;
      }
    );
    if (result === prev) break;
  }

  // Pattern 2: Content text followed immediately by ## without newline
  // e.g., "بشكل إيجابي## التوصيات"
  result = result.replace(
    /([\u0600-\u06FF])\s*(#{1,2}(?!#)\s*[\u0600-\u06FF])/g,
    '$1\n$2'
  );

  return result;
}

/**
 * sanitizeDisplayText — V235: Final-stage display text sanitizer.
 * Removes ALL remaining garbage that slipped through earlier pipeline stages.
 * Apply this to ANY text shown to the user (titles, summaries, content snippets).
 *
 * Removes:
 * - Random English words/fragments: "70% seo alle gmt gE", "gmt gE", etc.
 * - Orphaned markdown/bracket symbols: [, ], {, }, #, @ when not part of valid content
 * - Duplicate consecutive sentences
 * - Zero-width and RTL/LTR control characters in wrong positions
 * - Empty brackets: [], {}, ()
 * - Stray backticks, pipes, tildes
 */
export function sanitizeDisplayText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  // 1. Remove known garbage patterns from AI generation artifacts
  cleaned = cleaned.replace(/\b(?:seo|alle|gmt|gE|readmore|read more|click here|content here)\b/gi, '');
  
  // 2. Remove percentage+word garbage like "70% seo" 
  cleaned = cleaned.replace(/\d+%\s*(?:seo|alle|gmt|gE|read|click|content)\b/gi, '');

  // 3. Remove orphaned markdown symbols (not inside words)
  // Remove # when not followed by a known financial ticker pattern (C#, F#)
  cleaned = cleaned.replace(/(?<![A-Za-z0-9])#+(?![A-Za-z0-9\u0600-\u06FF])/g, '');
  
  // 4. Remove empty brackets: [], {}, ()
  cleaned = cleaned.replace(/\[\s*\]/g, '');
  cleaned = cleaned.replace(/\{\s*\}/g, '');
  cleaned = cleaned.replace(/\(\s*\)/g, '');
  
  // 5. Remove stray brackets when they appear at start/end of text or adjacent to spaces
  cleaned = cleaned.replace(/(?<=\s)[\[\{\(](?=\s)/g, '');
  cleaned = cleaned.replace(/(?<=\s)[\]\}\)](?=\s|$)/g, '');
  
  // 6. Remove standalone @ symbols (not part of @mentions or email)
  cleaned = cleaned.replace(/(?<!\w)@(?!\w)/g, '');
  
  // 7. Remove stray backticks, tildes, pipes
  cleaned = cleaned.replace(/`{1,3}/g, '');
  cleaned = cleaned.replace(/~{1,3}/g, '');
  cleaned = cleaned.replace(/(?<!\|)\|(?!\|)/g, ''); // Single pipe not part of || or table

  // 8. Remove zero-width chars except where intentional
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // 9. Remove duplicate consecutive sentences (split by sentence-ending punctuation)
  const sentences = cleaned.split(/(?<=[.؟!。！；;])\s+/);
  const uniqueSentences: string[] = [];
  const seenSentences = new Set<string>();
  for (const sentence of sentences) {
    const normalized = sentence.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalized.length > 5 && !seenSentences.has(normalized)) {
      seenSentences.add(normalized);
      uniqueSentences.push(sentence.trim());
    } else if (normalized.length <= 5) {
      uniqueSentences.push(sentence.trim());
    }
  }
  cleaned = uniqueSentences.join(' ').trim();

  // 10. Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

/**
 * Extract recommendations from report content.
 * Looks for patterns like "التوصيات" or "نقاط التحليل" sections and
 * extracts individual recommendations.
 */
export interface Recommendation {
  id: string;
  text: string;
  category?: string;
  assets?: string[];
}

export function extractRecommendations(markdown: string): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const lines = markdown.split('\n');
  let inRecommendationSection = false;
  let recIndex = 0;

  const sectionTriggers = [
    'التوصيات',
    'نقاط التحليل',
    'keyAnalysisPoints',
    'الخطوات الموصى بها',
    'التوصيات القابلة للتنفيذ',
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if we're entering a recommendation section
    if (/^#{1,6}\s+/.test(trimmed)) {
      const title = trimmed.replace(/^#{1,6}\s+/, '').trim();
      inRecommendationSection = sectionTriggers.some(t =>
        normalizeArabic(title).includes(normalizeArabic(t))
      );
      continue;
    }

    if (inRecommendationSection && trimmed) {
      // End recommendation section at next heading
      if (/^#{1,6}\s+/.test(trimmed) && !sectionTriggers.some(t => trimmed.includes(t))) {
        inRecommendationSection = false;
        continue;
      }

      // Extract individual recommendation
      const cleanText = trimmed
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .trim();

      if (cleanText.length > 10) { // Only include substantive recommendations
        // Try to extract asset symbols (e.g., QQQ, SPY, GLD, BTC)
        const assetMatches = cleanText.match(/\b[A-Z]{2,5}\b/g);
        const relevantAssets = assetMatches?.filter(a =>
          ['QQQ', 'SPY', 'GLD', 'BTC', 'ETH', 'WTI', 'XAU', 'USO', 'UNG', 'BNO', 'USO'].includes(a)
        ) || [];

        recommendations.push({
          id: `rec-${recIndex++}`,
          text: cleanText,
          assets: relevantAssets.length > 0 ? relevantAssets : undefined,
        });
      }
    }
  }

  return recommendations;
}
// V310 deployment trigger
