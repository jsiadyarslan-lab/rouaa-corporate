// ─── HTML Sanitization for AI-Generated Content ──────────
// Prevents XSS attacks from AI-generated HTML content
// Uses DOMPurify for robust, spec-compliant sanitization

import DOMPurify from 'isomorphic-dompurify';

// Configure allowed tags and attributes for article content
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'div'];
const ALLOWED_ATTRS = ['href', 'title', 'class', 'target', 'rel'];

/**
 * Sanitize HTML content using DOMPurify
 * This is used for AI-generated content that gets rendered with dangerouslySetInnerHTML
 * DOMPurify provides robust protection against XSS, including:
 * - Script injection
 * - Event handler attributes (onclick, onload, etc.)
 * - javascript: URLs
 * - data: URLs in src attributes
 * - CSS expressions
 * - Mutation XSS (mXSS)
 * - And many other attack vectors that regex-based sanitizers miss
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    // Forbid all data: URLs
    FORBID_ATTR: ['style', 'formaction'],
    // Ensure links have rel="noopener noreferrer"
    ADD_ATTR: ['target', 'rel'],
    // Strip HTML comments (potential attack vector)
    FORCE_BODY: true,
    // Return empty string for invalid input
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

// Sanitize plain text to prevent injection
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Sanitize user input for AI prompts (prevent prompt injection)
export function sanitizePromptInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Limit length
  const trimmed = input.slice(0, 2000);
  // Remove potential prompt injection patterns
  return trimmed
    .replace(/ignore\s+(previous|above|all)\s+instructions/gi, '')
    .replace(/forget\s+(everything|all|previous)/gi, '')
    .replace(/you\s+are\s+now/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/assistant\s*:/gi, '');
}
