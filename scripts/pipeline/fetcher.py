"""
Generic RSS/HTML fetcher — Layer 2 Step 1.
Takes a source config, fetches RSS feed, extracts publications.

NO source-specific code. All differences are in the source config.
Works with any standard RSS 2.0 / Atom feed.

Access strategy (generic, no source-specific branches):
1. Try urllib with browser-like headers (fast, works for most sources)
2. On HTTP 403, fall back to Playwright headless browser (handles JS/cookie challenges)
3. If both fail with 403, classify source as access_blocked

The classification is returned as fetch_method: "urllib" | "playwright" | "blocked".
No `if source == X` logic — any source that blocks urllib will automatically
try the browser fallback, and any source that blocks both gets classified.
"""

import re
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Tuple
from dataclasses import dataclass

from schemas import Document, SourceRef


def fetch_url(url: str, timeout: int = 30) -> Tuple[bool, str, str]:
    """Fetch a URL via urllib with browser-like headers.

    Returns (success, content, error_message).

    For binary content (PDF, etc.), content is encoded as latin-1 string to
    preserve byte values. The normalizer detects PDF via magic bytes and
    re-decodes to bytes for pdfplumber.

    This is generic — no source-specific logic. Content-type detection happens
    at the normalization layer, not here.
    """
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw_bytes = resp.read()
            # Check if content is binary (PDF, image, etc.)
            # PDFs start with %PDF-, images have various magic bytes
            if raw_bytes[:5] == b"%PDF-":
                # PDF — preserve as latin-1 string (lossless byte->str->byte round-trip)
                content = raw_bytes.decode("latin-1", errors="replace")
            else:
                # Text content (HTML, RSS, JSON, etc.)
                content = raw_bytes.decode("utf-8", errors="replace")
            return True, content, ""
    except urllib.error.HTTPError as e:
        return False, "", f"HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, "", f"URL error: {e.reason}"
    except Exception as e:
        return False, "", f"Fetch error: {str(e)}"


def fetch_with_browser(url: str, timeout: int = 30) -> Tuple[bool, str, str]:
    """Fetch a URL via Playwright headless browser.

    Generic fallback for sources that block urllib-based requests.
    NO source-specific logic — uses a standard browser context.

    Returns (success, content, error_message).
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return False, "", "Playwright not installed"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                context = browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                    locale="en-US",
                )
                page = context.new_page()
                response = page.goto(url, timeout=timeout * 1000, wait_until="domcontentloaded")
                if response is None:
                    return False, "", "No response from browser"
                if response.status >= 400:
                    return False, "", f"HTTP {response.status}"
                content = page.content()
                return True, content, ""
            finally:
                browser.close()
    except Exception as e:
        return False, "", f"Browser error: {type(e).__name__}: {str(e)}"


def fetch_with_fallback(url: str, timeout: int = 30) -> Tuple[bool, str, str, str]:
    """Fetch a URL with generic fallback strategy.

    Returns (success, content, error_message, fetch_method).
    fetch_method is one of: "urllib" | "playwright" | "blocked"

    Strategy:
    1. Try urllib with browser headers (fast)
    2. On HTTP 403, try Playwright headless browser
    3. If both fail with 403, return blocked classification

    This is GENERIC — no source-specific logic. Any source that
    blocks urllib will automatically try the browser fallback.
    """
    # Step 1: urllib
    success, content, error = fetch_url(url, timeout=timeout)
    if success:
        return True, content, "", "urllib"

    # Step 2: If 403, try browser fallback
    if "HTTP 403" in error:
        b_success, b_content, b_error = fetch_with_browser(url, timeout=timeout)
        if b_success:
            return True, b_content, "", "playwright"
        # Both failed with 403 → blocked
        combined = f"urllib: {error} | playwright: {b_error}"
        return False, "", combined, "blocked"

    # Other errors (404, 500, timeout, etc.) — no fallback
    return False, "", error, "urllib"


def parse_rss_feed(xml_content: str, source_code: str) -> List[Document]:
    """Parse RSS 2.0, Atom, or RDF/RSS 1.0 feed into Document objects.

    Generic parser — works with any standard RSS/Atom/RDF feed.
    No source-specific logic.
    """
    documents = []

    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        print(f"  [ERROR] XML parse failed: {e}")
        return documents

    # RSS 2.0: <rss><channel><item>
    # Atom: <feed><entry>
    # RDF/RSS 1.0: <rdf:RDF><item> (with namespace)
    items = root.findall(".//item")  # RSS 2.0
    if not items:
        items = root.findall(".//{http://www.w3.org/2005/Atom}entry")  # Atom
    if not items:
        items = root.findall(".//{http://purl.org/rss/1.0/}item")  # RDF/RSS 1.0

    # Define namespace prefixes for content extraction
    ns_rss1 = "{http://purl.org/rss/1.0/}"
    ns_atom = "{http://www.w3.org/2005/Atom}"
    ns_dc = "{http://purl.org/dc/elements/1.1/}"

    for item in items:
        doc = Document(source_code=source_code)

        # Title — try multiple namespaces (handle RSS 2.0, RDF/RSS 1.0, Atom)
        title_el = item.find("title")
        if title_el is None:
            title_el = item.find(f"{ns_rss1}title")
        if title_el is None:
            title_el = item.find(f"{ns_atom}title")
        if title_el is not None and title_el.text:
            doc.title = title_el.text.strip()

        # Link / URL
        link_el = item.find("link")
        if link_el is None:
            link_el = item.find(f"{ns_rss1}link")
        if link_el is not None and link_el.text:
            doc.raw_content_url = link_el.text.strip()
        else:
            # Atom: <link href="..." />
            link_el = item.find(f"{ns_atom}link")
            if link_el is not None:
                href = link_el.get("href")
                if href:
                    doc.raw_content_url = href

        # Publication date — try multiple namespaces
        date_el = item.find("pubDate")
        if date_el is None:
            date_el = item.find(f"{ns_dc}date")
        if date_el is None:
            date_el = item.find(f"{ns_atom}published")
        if date_el is None:
            date_el = item.find(f"{ns_atom}updated")
        if date_el is not None and date_el.text:
            doc.published_at = date_el.text.strip()

        # Content / description
        content_el = item.find("description")
        if content_el is None:
            content_el = item.find(f"{ns_rss1}description")
        if content_el is None:
            content_el = item.find(f"{ns_atom}summary")
        if content_el is None:
            content_el = item.find(f"{ns_atom}content")
        if content_el is not None and content_el.text:
            doc.content_text = content_el.text.strip()

        if doc.title or doc.raw_content_url:
            doc.fetch_status = "fetched"
            documents.append(doc)

    return documents


def fetch_full_content(url: str) -> Tuple[bool, str, str]:
    """Fetch the full HTML content of a publication URL.

    Returns (success, html_content, error_message).
    """
    return fetch_url(url)


def fetch_full_content_with_fallback(url: str, timeout: int = 30) -> Tuple[bool, str, str, str]:
    """Fetch full HTML content using generic fallback strategy.

    Returns (success, content, error, fetch_method).
    """
    return fetch_with_fallback(url, timeout=timeout)


def is_relevant_content(doc: Document, keywords: List[str]) -> bool:
    """Check if a document is relevant to the source's content domain.

    Generic keyword matching — no source-specific logic.
    Keywords come from the source config (content_keywords field).
    Works for any domain: monetary policy, regulatory, statistical, earnings, etc.
    """
    text = (doc.title + " " + doc.content_text).lower()
    return any(kw.lower() in text for kw in keywords)


def parse_html_index(html: str, source_config: dict, max_items: int = 20) -> List[Document]:
    """Parse an HTML index page to discover document URLs.

    Generic HTML-index-to-documents adapter. Uses `link_pattern` from source
    config to find document URLs via regex. NO source-specific logic —
    any source with feed_format="html_index" and a link_pattern can use this.

    Returns list of Document objects (without full content — caller must fetch).
    """
    documents = []
    source_code = source_config["code"]

    link_pattern = source_config.get("link_pattern")
    if not link_pattern:
        print(f"  [ERROR] feed_format=html_index but no link_pattern in config for {source_code}")
        return documents

    prefix = source_config.get("link_pattern_prefix", "")

    # Find all unique URLs matching the pattern
    matches = re.findall(link_pattern, html)
    seen = set()
    for match in matches[:max_items * 2]:  # fetch a few extra in case some fail
        # match is the URL path (or a captured group)
        url_path = match if isinstance(match, str) else match[0]
        if url_path in seen:
            continue
        seen.add(url_path)

        # Build full URL
        if url_path.startswith("http"):
            full_url = url_path
        else:
            full_url = prefix + url_path

        # Extract date from URL if possible (for OFAC: /recent-actions/20260807)
        date_match = re.search(r"(\d{8})", url_path)
        published_at = ""
        if date_match:
            d = date_match.group(1)
            published_at = f"{d[:4]}-{d[4:6]}-{d[6:8]}"

        doc = Document(
            source_code=source_code,
            title=f"{source_code} Action {published_at}" if published_at else f"{source_code} Action",
            raw_content_url=full_url,
            published_at=published_at,
            fetch_status="pending",
        )
        documents.append(doc)

    return documents[:max_items]


def fetch_source_publications(source_config: dict, max_items: int = 20) -> Tuple[List[Document], str, str]:
    """Fetch publications from a source.

    Supports three feed formats (driven by config, no source-specific code):
    - rss (default): parse RSS 2.0 / Atom / RDF feed
    - html_index: parse HTML index page to discover document URLs
    - pdf: fetch PDF directly (content extracted by normalizer)

    Returns (documents, access_status, fetch_method).
      access_status: "open" | "blocked"
      fetch_method: "urllib" | "playwright" | "blocked"
    """
    source_code = source_config["code"]
    feed_url = source_config.get("feedUrl") or source_config.get("alt_feedUrl", "")
    keywords = source_config.get("content_keywords", [])
    feed_format = source_config.get("feed_format", "rss")

    print(f"  Fetching {source_code} ({feed_format}): {feed_url}")

    # Step 1: Fetch the feed/index (with generic browser fallback)
    success, content, error, fetch_method = fetch_with_fallback(feed_url)
    if not success:
        if fetch_method == "blocked":
            print(f"  [BLOCKED] Source {source_code} is access_blocked: {error}")
            return [], "blocked", "blocked"
        print(f"  [FAIL] {feed_format} fetch failed for {source_code}: {error}")
        # Try alt feed if available
        alt_url = source_config.get("alt_feedUrl", "")
        if alt_url and alt_url != feed_url:
            print(f"  Trying alt feed: {alt_url}")
            success, content, error, fetch_method = fetch_with_fallback(alt_url)
            if not success:
                if fetch_method == "blocked":
                    return [], "blocked", "blocked"
                print(f"  [FAIL] Alt feed also failed: {error}")
                return [], "open", fetch_method
        else:
            return [], "open", fetch_method

    print(f"  [OK] {feed_format} fetched via {fetch_method} ({len(content)} bytes)")

    # Step 2: Parse based on feed_format (config-driven, not source-specific)
    if feed_format == "html_index":
        documents = parse_html_index(content, source_config, max_items=max_items)
        print(f"  Parsed {len(documents)} document URLs from HTML index")
    elif feed_format == "pdf":
        # PDF source — create a single Document with the PDF as content
        # The normalizer will detect PDF and extract text
        doc = Document(source_code=source_code)
        doc.title = f"{source_code} PDF Document"
        doc.raw_content_url = feed_url
        doc.content_text = content  # PDF binary content (normalizer will handle)
        doc.fetch_status = "fetched"
        # Use published_at from config if available (config-driven, not source-specific)
        doc.published_at = source_config.get("published_at", "")
        documents = [doc]
        print(f"  Created 1 PDF document")
    else:
        # Default: RSS/Atom/RDF
        documents = parse_rss_feed(content, source_code)
        print(f"  Parsed {len(documents)} items from RSS feed")

    # Step 3: Filter for relevant content (skip for PDF — single document)
    if feed_format != "pdf" and keywords:
        filtered = [d for d in documents if is_relevant_content(d, keywords)]
        print(f"  Filtered to {len(filtered)} relevant items")
        documents = filtered[:max_items]

    # Step 4: Fetch full content for each document (with generic browser fallback)
    # Always fetch full page content for RSS sources — RSS descriptions are typically
    # too short for meaningful fact extraction. Full page HTML contains the actual text.
    # Skip for PDF (already have binary content) and html_index (URLs already point to full pages,
    # and content_text is empty so they'll be fetched).
    if feed_format != "pdf":
        for doc in documents:
            if doc.raw_content_url:
                print(f"    Fetching full content: {doc.raw_content_url[:80]}...")
                success, html, error, method = fetch_full_content_with_fallback(doc.raw_content_url)
                if success:
                    doc.content_text = html  # Replace RSS description with full page
                    doc.fetch_status = "fetched"
                    if method != "urllib":
                        print(f"    [OK] via {method}")
                else:
                    print(f"    [WARN] Full content fetch failed: {error}")

    return documents, "open", fetch_method
