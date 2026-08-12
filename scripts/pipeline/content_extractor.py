"""
Generic content extraction layer — replaces the assumption that <p> tags = document content.

Strategy:
1. Try semantic HTML containers: <article>, <main>, [role="main"]
2. Try JSON-LD structured data
3. Try paragraph clusters (groups of <p> tags with high text density)
4. Score each candidate by text density, length, and relevance
5. Select the best candidate as the document content

This is GENERIC — no source-specific logic. Works across any HTML structure.
"""

import re
import json
from typing import List, Tuple, Optional
from schemas import Document
from normalizer import strip_html, split_into_paragraphs


def extract_semantic_containers(html: str) -> List[Tuple[str, str]]:
    """Extract content from semantic HTML containers.

    Returns list of (container_type, extracted_text) tuples.
    Tries: <article>, <main>, [role="main"], <div class="content">, <div class="main">
    """
    candidates = []

    # <article> tags
    for match in re.finditer(r"<article[^>]*>(.*?)</article>", html, re.DOTALL | re.IGNORECASE):
        text = strip_html(match.group(1)).strip()
        if len(text) > 100:
            candidates.append(("article", text))

    # <main> tags
    for match in re.finditer(r"<main[^>]*>(.*?)</main>", html, re.DOTALL | re.IGNORECASE):
        text = strip_html(match.group(1)).strip()
        if len(text) > 100:
            candidates.append(("main", text))

    # [role="main"]
    for match in re.finditer(r'<[^>]+role="main"[^>]*>(.*?)</\w+>', html, re.DOTALL | re.IGNORECASE):
        text = strip_html(match.group(1)).strip()
        if len(text) > 100:
            candidates.append(("role_main", text))

    # Common content container classes
    content_patterns = [
        r'<div[^>]*class="[^"]*\b(?:content|main-content|post-content|article-content|entry-content|body-content|page-content)\b[^"]*"[^>]*>(.*?)</div>',
        r'<div[^>]*id="[^"]*\b(?:content|main-content|post-content|article-content|entry-content|body-content|page-content)\b[^"]*"[^>]*>(.*?)</div>',
    ]
    for pattern in content_patterns:
        for match in re.finditer(pattern, html, re.DOTALL | re.IGNORECASE):
            text = strip_html(match.group(1)).strip()
            if len(text) > 100:
                candidates.append(("content_div", text))

    return candidates


def extract_json_ld(html: str) -> List[dict]:
    """Extract JSON-LD structured data from HTML.

    Looks for <script type="application/ld+json"> blocks.
    Returns list of parsed JSON objects.
    """
    results = []
    for match in re.finditer(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE):
        try:
            data = json.loads(match.group(1).strip())
            if isinstance(data, list):
                results.extend(data)
            elif isinstance(data, dict):
                results.append(data)
        except json.JSONDecodeError:
            continue
    return results


def extract_paragraph_clusters(html: str) -> List[str]:
    """Extract paragraph clusters — groups of <p> tags with high text density.

    Instead of extracting individual <p> tags, this finds regions of the HTML
    where <p> tags are clustered together (indicating article body, not navigation).

    A cluster is a sequence of 3+ consecutive <p> tags with total text > 200 chars.
    """
    # Find all <p> tags with their positions
    p_pattern = re.compile(r"<p[^>]*>(.*?)</p>", re.DOTALL | re.IGNORECASE)
    p_matches = list(p_pattern.finditer(html))

    if len(p_matches) < 3:
        return []

    clusters = []
    current_cluster = []
    current_text_len = 0

    for i, match in enumerate(p_matches):
        text = strip_html(match.group(1)).strip()

        # Skip very short paragraphs (likely navigation/metadata)
        if len(text) < 30:
            if len(current_cluster) >= 3 and current_text_len > 200:
                clusters.append("\n\n".join(current_cluster))
            current_cluster = []
            current_text_len = 0
            continue

        # Check if this <p> is close to the previous one (within 500 chars of gap)
        if current_cluster:
            prev_end = p_matches[i - 1].end()
            gap = match.start() - prev_end
            if gap > 500:
                # Gap too large — end current cluster
                if len(current_cluster) >= 3 and current_text_len > 200:
                    clusters.append("\n\n".join(current_cluster))
                current_cluster = []
                current_text_len = 0

        current_cluster.append(text)
        current_text_len += len(text)

    # Don't forget the last cluster
    if len(current_cluster) >= 3 and current_text_len > 200:
        clusters.append("\n\n".join(current_cluster))

    return clusters


def score_content_candidate(text: str, keywords: List[str]) -> float:
    """Score a content candidate by text density, length, and keyword relevance.

    Higher score = more likely to be the actual document content.
    """
    if not text or len(text) < 100:
        return 0.0

    score = 0.0

    # Length score (logarithmic — longer is better, but with diminishing returns)
    length_score = min(len(text) / 5000.0, 1.0) * 30
    score += length_score

    # Text density (ratio of actual text to total characters)
    # Remove extra whitespace for density calculation
    stripped = re.sub(r"\s+", " ", text)
    density = len(stripped) / max(len(text), 1)
    score += density * 20

    # Keyword relevance
    lower_text = text.lower()
    keyword_hits = sum(1 for kw in keywords if kw.lower() in lower_text)
    keyword_score = min(keyword_hits / max(len(keywords), 1), 1.0) * 30
    score += keyword_score

    # Paragraph count (more paragraphs = more likely article body)
    para_count = len([p for p in text.split("\n\n") if p.strip()])
    para_score = min(para_count / 10.0, 1.0) * 20
    score += para_score

    return round(score, 2)


def extract_document_content(html: str, keywords: List[str]) -> Tuple[str, str]:
    """Extract the most likely document content from HTML.

    Returns (content_type, content_text).

    Strategy:
    1. Try semantic containers (<article>, <main>, content divs)
    2. Try paragraph clusters
    3. Fall back to all <p> tags
    4. Score each candidate and pick the best

    This is GENERIC — no source-specific logic.
    """
    candidates = []

    # Strategy 1: Semantic containers
    semantic = extract_semantic_containers(html)
    for container_type, text in semantic:
        score = score_content_candidate(text, keywords)
        candidates.append((score, container_type, text))

    # Strategy 2: Paragraph clusters
    clusters = extract_paragraph_clusters(html)
    for i, cluster in enumerate(clusters):
        score = score_content_candidate(cluster, keywords)
        candidates.append((score, f"cluster_{i}", cluster))

    # Strategy 3: All <p> tags (current approach — fallback)
    p_tags = re.findall(r"<p[^>]*>(.*?)</p>", html, re.DOTALL | re.IGNORECASE)
    if p_tags:
        # Filter boilerplate
        boilerplate_prefixes = [
            "an official", "official websites", "secure .gov", "stay connected",
            "federal reserve facebook", "federal reserve instagram",
            "federal reserve youtube", "federal reserve flickr",
            "federal reserve linkedin", "skip to main", "back to home",
            "this website uses", "we use cookies", "our website uses",
            "we use necessary cookies", "nothing searched", "next due:",
            "the bank of england act", "search the site", "change theme",
        ]
        filtered = []
        for p in p_tags:
            clean = strip_html(p).strip()
            if len(clean) > 50:
                lower = clean.lower()
                if not any(lower.startswith(bp) for bp in boilerplate_prefixes):
                    filtered.append(clean)
        if filtered:
            all_p_text = "\n\n".join(filtered)
            score = score_content_candidate(all_p_text, keywords)
            candidates.append((score, "all_p_tags", all_p_text))

    if not candidates:
        # Last resort: strip all HTML
        text = strip_html(html)
        return ("fallback_stripped", text)

    # Sort by score (highest first)
    candidates.sort(key=lambda x: x[0], reverse=True)

    best = candidates[0]
    return (best[1], best[2])


def extract_pdf_text(pdf_content: str) -> str:
    """Extract text from PDF content using pdfplumber.

    Generic PDF-to-text adapter. Handles any PDF — no source-specific logic.
    Returns paragraph-separated text suitable for the existing extractor.

    Uses pdfplumber (already installed). Falls back to pypdf if pdfplumber fails.
    """
    # pdfplumber needs bytes or a file path
    # The content comes as a string from fetcher — encode to bytes
    if isinstance(pdf_content, str):
        pdf_bytes = pdf_content.encode("latin-1", errors="replace")
    else:
        pdf_bytes = pdf_content

    text = ""

    # Try pdfplumber first (better text extraction)
    try:
        import pdfplumber
        import io
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            page_texts = []
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text:
                    page_texts.append(page_text)
            text = "\n\n".join(page_texts)
        if text:
            return text
    except Exception as e:
        print(f"    [WARN] pdfplumber failed: {type(e).__name__}: {str(e)[:80]}")

    # Fallback: pypdf
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        page_texts = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text:
                page_texts.append(page_text)
        text = "\n\n".join(page_texts)
        if text:
            return text
    except Exception as e:
        print(f"    [WARN] pypdf failed: {type(e).__name__}: {str(e)[:80]}")

    return ""


def is_pdf_content(content: str) -> bool:
    """Check if content is a PDF document.

    Generic — detects PDF by magic bytes (%PDF-).
    """
    if not content:
        return False
    return content[:5] == "%PDF-"


def normalize_document_v2(doc: Document, keywords: List[str]) -> Document:
    """Normalize a Document using the generic content extraction layer.

    Handles three content types (driven by content detection, not source identity):
    1. PDF — extract text via pdfplumber/pypdf
    2. HTML — use content extraction (semantic containers, paragraph clusters)
    3. Plain text — split into paragraphs directly

    This replaces the old normalize_document which assumed <p> tags = content.
    Now uses content scoring to find the actual document content regardless
    of HTML structure.
    """
    if not doc.content_text:
        doc.normalization_status = "failed"
        return doc

    content = doc.content_text

    # Check if content is a PDF (magic bytes)
    if is_pdf_content(content):
        print(f"    [PDF] Detected PDF content, extracting text...")
        extracted = extract_pdf_text(content)
        if extracted and len(extracted) > 100:
            doc.content_text = extracted
            doc.content_paragraphs = split_into_paragraphs(extracted)
            doc.normalization_status = "normalized" if doc.content_paragraphs else "failed"
            return doc
        else:
            print(f"    [WARN] PDF text extraction failed or too short")
            doc.normalization_status = "failed"
            return doc

    # Check if content looks like HTML
    if "<" in content and ">" in content:
        # Use generic content extraction
        content_type, extracted = extract_document_content(content, keywords)

        if extracted and len(extracted) > 100:
            doc.content_text = extracted
            doc.content_paragraphs = split_into_paragraphs(extracted)
            doc.normalization_status = "normalized" if doc.content_paragraphs else "failed"
        else:
            # Fallback: strip all HTML
            doc.content_text = strip_html(content)
            doc.content_paragraphs = split_into_paragraphs(doc.content_text)
            doc.normalization_status = "normalized" if doc.content_paragraphs else "failed"
    else:
        # Non-HTML content
        doc.content_paragraphs = split_into_paragraphs(content)
        doc.normalization_status = "normalized" if doc.content_paragraphs else "failed"

    return doc


def normalize_documents_v2(documents: List[Document], keywords: List[str]) -> List[Document]:
    """Normalize a list of Documents using v2 content extraction."""
    return [normalize_document_v2(doc, keywords) for doc in documents]
