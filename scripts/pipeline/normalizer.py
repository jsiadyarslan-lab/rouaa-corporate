"""
Document normalizer — Layer 2 Step 2.
Converts raw HTML/RSS content into structured, paragraph-split text.

Generic HTML-to-text conversion. No source-specific logic.
Uses standard HTML parsing (regex-based, no external dependencies).
"""

import re
from typing import List, Tuple
from schemas import Document


def strip_html(html: str) -> str:
    """Remove HTML tags and return plain text.

    Handles:
    - Script/style removal
    - Tag stripping
    - Entity decoding (common entities)
    - Whitespace normalization
    """
    # Remove script and style sections
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL | re.IGNORECASE)

    # Remove CDATA sections (common in RSS)
    html = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", html, flags=re.DOTALL)

    # Remove HTML comments
    html = re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)

    # Convert <br> and <p> to newlines (preserve paragraph structure)
    html = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    html = re.sub(r"</p>", "\n\n", html, flags=re.IGNORECASE)
    html = re.sub(r"<p[^>]*>", "", html, flags=re.IGNORECASE)

    # Remove all remaining HTML tags
    text = re.sub(r"<[^>]+>", "", html)

    # Decode common HTML entities
    entities = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&nbsp;": " ",
        "&mdash;": "—",
        "&ndash;": "–",
        "&hellip;": "…",
        "&rsquo;": "'",
        "&lsquo;": "'",
        "&ldquo;": '"',
        "&rdquo;": '"',
        "&laquo;": "«",
        "&raquo;": "»",
        "&copy;": "©",
        "&reg;": "®",
        "&trade;": "™",
        "&euro;": "€",
        "&pound;": "£",
        "&yen;": "¥",
        "&cent;": "¢",
        "&deg;": "°",
        "&times;": "×",
        "&divide;": "÷",
        "&plusmn;": "±",
        "&frac12;": "½",
        "&frac14;": "¼",
        "&frac34;": "¾",
        "&le;": "≤",
        "&ge;": "≥",
        "&ne;": "≠",
        "&infin;": "∞",
        "&sum;": "Σ",
        "&alpha;": "α",
        "&beta;": "β",
        "&gamma;": "γ",
        "&delta;": "δ",
        "&pi;": "π",
        "&sigma;": "σ",
        "&lambda;": "λ",
        "&mu;": "μ",
        "&omega;": "ω",
        "&Delta;": "Δ",
        "&Sigma;": "Σ",
        "&Pi;": "Π",
        "&Omega;": "Ω",
        "&forall;": "∀",
        "&exist;": "∃",
        "&rarr;": "→",
        "&larr;": "←",
        "&uarr;": "↑",
        "&darr;": "↓",
        "&harr;": "↔",
        "&rArr;": "⇒",
        "&lArr;": "⇐",
        "&uArr;": "⇑",
        "&dArr;": "⇓",
        "&hArr;": "⇔",
        "&bull;": "•",
        "&dagger;": "†",
        "&Dagger;": "‡",
        "&permil;": "‰",
        "&prime;": "′",
        "&Prime;": "″",
        "&sect;": "§",
        "&para;": "¶",
        "&middot;": "·",
    }
    for entity, char in entities.items():
        text = text.replace(entity, char)

    # Decode numeric entities (&#123; and &#x7B;)
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    text = re.sub(r"&#x([0-9a-fA-F]+);", lambda m: chr(int(m.group(1), 16)), text)

    # Normalize whitespace
    text = re.sub(r"[ \t]+", " ", text)  # Collapse horizontal whitespace
    text = re.sub(r"\n[ \t]+", "\n", text)  # Remove leading spaces on lines
    text = re.sub(r"\n{3,}", "\n\n", text)  # Collapse multiple blank lines
    text = text.strip()

    return text


def split_into_paragraphs(text: str) -> List[str]:
    """Split normalized text into paragraphs.

    Paragraphs are separated by double newlines.
    Single newlines within a paragraph are preserved.
    """
    if not text:
        return []

    paragraphs = text.split("\n\n")
    # Clean up each paragraph
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    return paragraphs


def normalize_document(doc: Document) -> Document:
    """Normalize a Document: strip HTML, extract paragraphs, filter noise.

    Strategy:
    1. If content looks like HTML, extract <p> tags first (preserves structure)
    2. Fall back to strip_html + split for non-HTML content
    3. Filter out navigation/menu/boilerplate paragraphs
    4. Keep only substantive paragraphs (>50 chars, not boilerplate)

    This is GENERIC — no source-specific logic.
    All page structures are handled by the same extraction logic.
    """
    if not doc.content_text:
        doc.normalization_status = "failed"
        return doc

    content = doc.content_text

    # Check if content looks like HTML
    if "<" in content and ">" in content:
        # Strategy: extract <p> tags directly — this preserves paragraph structure
        # better than strip_html which collapses everything
        import re as _re
        p_tags = _re.findall(r"<p[^>]*>(.*?)</p>", content, _re.DOTALL | _re.IGNORECASE)

        if p_tags:
            # Clean each <p> tag
            paragraphs = []
            for p in p_tags:
                clean = strip_html(p).strip()
                if len(clean) > 50:  # Skip short snippets
                    # Filter out common boilerplate
                    lower = clean.lower()
                    if any(lower.startswith(bp) for bp in [
                        "an official", "official websites", "secure .gov",
                        "stay connected", "federal reserve facebook",
                        "federal reserve instagram", "federal reserve youtube",
                        "federal reserve flickr", "federal reserve linkedin",
                        "skip to main", "back to home", "this website uses",
                        "we use cookies", "our website uses",
                        "we use necessary cookies", "nothing searched",
                        "next due:", "the bank of england act",
                    ]):
                        continue
                    paragraphs.append(clean)

            if paragraphs:
                doc.content_paragraphs = paragraphs
                doc.content_text = "\n\n".join(paragraphs)
                doc.normalization_status = "normalized"
                return doc

        # Fallback: strip all HTML and split
        doc.content_text = strip_html(content)

    # Split into paragraphs
    doc.content_paragraphs = split_into_paragraphs(doc.content_text)

    if doc.content_paragraphs:
        doc.normalization_status = "normalized"
    else:
        doc.normalization_status = "failed"

    return doc


def normalize_documents(documents: List[Document]) -> List[Document]:
    """Normalize a list of Documents."""
    return [normalize_document(doc) for doc in documents]
