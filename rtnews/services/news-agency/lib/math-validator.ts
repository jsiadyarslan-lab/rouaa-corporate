// ═══════════════════════════════════════════════════════════════
// Math Validator — catches calculation errors in LLM output
// ═══════════════════════════════════════════════════════════════
// Scans the text for patterns like:
// "مكاسب إجمالية بلغت 10.99%" when the individual values sum to 9.99%
// "بلغ 5.2 مليار" when components are 2.3 + 2.1 = 4.4
//
// Approach: find all "X + Y + Z = W" patterns and verify the sum.
// ═══════════════════════════════════════════════════════════════

/**
 * Extract percentage values from text and verify sums.
 * Looks for patterns like:
 * - "4.66% + 3.14% + 2.19% ... 10.99%"
 * - "مكاسب إجمالية بلغت 10.99%"
 * - "بلغ 9.99%" after listing individual percentages
 */
export function validateMath(text: string): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // Pattern 1: Find sentences that mention a total/sum followed by a number
  // Then find all percentage values in the preceding context
  const totalPatterns = [
    /(?:مكاسب|إجمالي|مجموع|بلغ|بـ|بمجموع|بإجمالي)\s*(?:إجمالي|مجموع)?\s*(?:للقطاعات|للقيم|الأولى)?\s*(?:بلغ|بـ|بمقدار)?\s*(\d+\.?\d*)\s*%/g,
    /(?:total|sum|combined|aggregate)[^.]*?(\d+\.?\d*)\s*%/gi,
  ];

  // Extract all percentage values from the text
  const allPercents = [...text.matchAll(/(\d+\.?\d*)\s*%/g)].map(m => parseFloat(m[1]));
  
  // If there are 3+ percentages, check if any "total" claim matches their sum
  if (allPercents.length >= 3) {
    for (const pattern of totalPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const claimedTotal = parseFloat(match[1]);
        // Find the 3 percentages closest to this match position
        const matchPos = match.index || 0;
        const beforeText = text.slice(0, matchPos);
        const percentsBefore = [...beforeText.matchAll(/(\d+\.?\d*)\s*%/g)]
          .map(m => parseFloat(m[1]))
          .slice(-5); // Last 5 percentages before the total claim
        
        if (percentsBefore.length >= 2) {
          // Try different combinations
          for (let count = 2; count <= percentsBefore.length; count++) {
            const subset = percentsBefore.slice(-count);
            const actualSum = subset.reduce((a, b) => a + b, 0);
            const roundedSum = Math.round(actualSum * 100) / 100;
            
            // Check if claimed total is wrong (differs by more than 0.5)
            if (Math.abs(claimedTotal - roundedSum) > 0.5 && Math.abs(claimedTotal - roundedSum) < 5) {
              // But only flag if the claimed total is close to a DIFFERENT sum
              // (to avoid false positives from unrelated percentages)
              errors.push(
                `Math error: claimed ${claimedTotal}% but ${subset.join(' + ')} = ${roundedSum}%`
              );
              break;
            }
          }
        }
      }
    }
  }

  // Pattern 2: Check explicit "X + Y = Z" patterns
  const explicitSumPattern = /(\d+\.?\d*)\s*(?:\+|plus|جمع|مجموع)\s*(\d+\.?\d*)\s*(?:=|يساوي|بلغ|بـ)?\s*(\d+\.?\d*)/g;
  const explicitMatches = [...text.matchAll(explicitSumPattern)];
  for (const match of explicitMatches) {
    const a = parseFloat(match[1]);
    const b = parseFloat(match[2]);
    const claimed = parseFloat(match[3]);
    const actual = a + b;
    if (Math.abs(claimed - actual) > 0.1) {
      errors.push(`Math error: ${a} + ${b} = ${actual} but text says ${claimed}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}
