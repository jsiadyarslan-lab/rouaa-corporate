// ═══════════════════════════════════════════════════════════════
// Text Sanitizer — يزيل البايتات غير الصالحة من النصوص
// ═══════════════════════════════════════════════════════════════
// المشكلة: بعض مصادر RSS/XML ترجع نصوصاً تحتوي على NULL bytes (0x00)
// أو بايتات غير صالحة في UTF-8. PostgreSQL يرفضها بخطأ:
//   "invalid byte sequence for encoding UTF8: 0x00"
// وهذا يكسر agencyEvent.count() والعمليات اللاحقة.
//
// الحل: تنظيف كل نص قبل تمريره لـ Prisma.
// ═══════════════════════════════════════════════════════════════

/**
 * يزيل NULL bytes والبايتات غير الصالحة من نص.
 * - يحذف chr(0) نهائياً (غير مسموح في PostgreSQL text)
 * - يزيل control characters ما عدا \n, \r, \t
 * - يحتفظ بالـ emojis والـ Arabic/Hebrew/CJK
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';

  // 1. تحويل لـ string لو مش string (أحياناً cheerio يرجع كائن)
  let s = typeof input === 'string' ? input : String(input);

  // 2. إزالة NULL bytes نهائياً (السبب الرئيسي للخطأ 22021)
  //    chr(0) = \u0000 = 0x00
  s = s.replace(/\0/g, '');

  // 3. إزالة control characters ما عدا \t \n \r
  //    (هذه قد تأتي من XML/HTML mal-formatted)
  //    Allow: \t (0x09), \n (0x0A), \r (0x0D)
  //    Remove: 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F
  s = s.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // 4. إزالة BOM إذا موجود
  s = s.replace(/^\uFEFF/, '');

  // 5. إزالة surrogates غير صالحة (lone surrogates)
  //    هذه تظهر أحياناً من JSON mal-formed
  s = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
  s = s.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

  // 6. تقليص المسافات البيضاء المتعددة
  s = s.replace(/[ \t]+/g, ' ');

  // 7. تقليص الأسطر الفارغة المتعددة
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

/**
 * يطبق sanitizeText على كل قيم object النصية (deep).
 * مفيد لتنظيف RawEvent بأكمله قبل saveRawEvent.
 */
export function sanitizeEvent<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = sanitizeText(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      cleaned[key] = sanitizeEvent(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(v => typeof v === 'string' ? sanitizeText(v) : v);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}
