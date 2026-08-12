# Phase B — Cold Run Discovery Report

**Date**: 2026-08-12
**Run**: Phase B Wave 1 (Cold Run — no code modifications)
**Sources tested**: 10 (BOJ, RBNZ, SEC, FCA, ONS, BIS_STATS, APPLE, ARAMCO, OFAC, BIS_QR)

## Cold Run Results

| Source | Type | Fetch | Norm | Facts | Events | IOs | Quality | Discoveries |
|--------|------|-------|------|-------|--------|-----|---------|-------------|
| BOJ | central_bank | ✓ | ✓ | 0 | 0 | 0 | reject | 1 (manual) |
| RBNZ | central_bank | ✓ | ✓ | 0 | 0 | 0 | reject | 1 (manual) |
| SEC | financial_regulator | ✓ | ✓ | 0 | 0 | 0 | reject | 1 |
| FCA | financial_regulator | ✓ | ✓ | 0 | 0 | 0 | reject | 1 |
| ONS | statistical_authority | ✓ | ✓ | 0 | 0 | 0 | reject | 1 |
| BIS_STATS | statistical_authority | ✓ | ✓ | 0 | 0 | 0 | reject | 1 |
| APPLE | corporate_ir | ✓ | ✓ | 0 | 0 | 0 | reject | 1 |
| ARAMCO | corporate_ir | ✗ | ✗ | 0 | 0 | 0 | blocked | 1 |
| OFAC | government_regulatory | ✗ | ✗ | 0 | 0 | 0 | reject | 1 |
| BIS_QR | pdf_heavy | ✗ | ✗ | 0 | 0 | 0 | reject | 1 |

**Outcome**: 0/9 accessible sources PASS. 1/10 blocked.

## Distinct Abstraction Gaps Discovered

### Gap 1: Extractor only processes `rate_patterns` (Layer 3)

**Affected sources**: SEC, FCA, ONS, BIS_STATS, APPLE (5 sources)

**Root cause**: `extractor.py` calls `extract_facts(doc, config["rate_patterns"])` — hardcoded to a single pattern category. Sources with `regulatory_patterns`, `statistical_patterns`, or `earnings_patterns` have their patterns defined in config but the extractor ignores them.

**Generic fix**: Extend extractor to iterate over all pattern categories in config:
```python
all_patterns = []
for category in ["rate_patterns", "regulatory_patterns", "statistical_patterns", "earnings_patterns"]:
    all_patterns.extend(config.get(category, []))
facts = extract_facts(doc, all_patterns)
```

**Generic change count**: 1 change, benefits 5 sources.

### Gap 2: Fetcher assumes RSS/Atom — no HTML index support (Layer 2)

**Affected sources**: OFAC (1 source)

**Root cause**: `fetcher.py` always calls `parse_rss_feed()` on fetched content. OFAC's `feedUrl` is an HTML index page (`https://ofac.treasury.gov/recent-actions`) with date-based URLs (`/recent-actions/20260807`). The fetcher tries to parse it as XML and fails.

**Generic fix**: Add HTML-index-to-documents adapter:
- If `feed_format == "html_index"` in config, parse HTML to extract document URLs
- Create Document objects with `raw_content_url` set to each discovered URL
- Then fetch each URL's full content (same as RSS path)

**Implementation**: Add `parse_html_index()` function that extracts links matching a configurable pattern. The pattern itself is in source config (e.g., `link_pattern: r"/recent-actions/\d{8}"`), not hardcoded.

**Generic change count**: 1 change (new function + branch in `fetch_source_publications`), benefits 1 source but pattern is reusable.

### Gap 3: Fetcher assumes RSS/Atom — no PDF support (Layer 2)

**Affected sources**: BIS_QR, BOJ (2 sources — BOJ's RSS points to PDFs)

**Root cause**: BOJ's RSS feed contains URLs ending in `.pdf` (e.g., `opi260731.pdf`). The fetcher downloads the PDF content but `parse_rss_feed()` and `normalize_documents_v2()` expect HTML. The PDF binary content gets passed through and pattern matching fails.

For BIS_QR, the `feedUrl` IS the PDF directly — no RSS at all.

**Generic fix**: Add PDF-to-text adapter:
- If content starts with `%PDF-` OR `feed_format == "pdf"` in config, use pdfplumber to extract text
- Convert PDF to paragraph-separated text
- Then run through normal extractor

**Implementation**: Add `extract_pdf_text()` function using pdfplumber (already installed). Integrate into `normalize_documents_v2()` — if content is PDF, extract text first.

**Generic change count**: 1 change (new function + branch in normalizer), benefits 2 sources.

### Gap 4: RSS descriptions too thin — content URLs blocked (Layer 2)

**Affected sources**: RBNZ (1 source)

**Root cause**: RBNZ's RSS feed works, but the actual press release URLs (`rbnz.govt.nz/news-and-events/news/...`) return 403 on both urllib and Playwright. The RSS `<description>` contains only a short summary (1-2 sentences) without the actual OCR rate value. So even though patterns are correct, there's no substantive content to match against.

This is different from ARAMCO (full access_blocked) — RBNZ's RSS is accessible, but full-content URLs are blocked.

**Generic fix**: This is an access pattern issue, not an abstraction gap. The generic access adapter already tries browser fallback. The discovery here is that some sources have **mixed access** — RSS open, content blocked.

**Classification**: Add `partial_blocked` access status. Source is fetched (RSS works) but content is too thin for extraction. This is an environmental constraint, similar to fully blocked sources.

**Generic change count**: 0 code changes (classification only). Benefits: clearer reporting.

### Gap 5: ARAMCO fully access_blocked (Layer 2)

**Affected sources**: ARAMCO (1 source)

**Root cause**: Aramco's website (`aramco.com`) returns 403 on all paths via both urllib and Playwright. Akamai edge blocking (same as RBA in Phase A.2).

**Generic fix**: None needed — the generic access adapter already classifies this correctly as `access_blocked`. This is an environmental constraint.

**Generic change count**: 0 (already handled by Phase A.2 access adapter).

## Summary: 4 Generic Changes Needed

| # | Change | Layer | Sources Benefiting |
|---|--------|-------|-------------------|
| 1 | Extend extractor for multi-pattern categories | L3 | SEC, FCA, ONS, BIS_STATS, APPLE (5) |
| 2 | Add HTML-index-to-documents adapter | L2 | OFAC (1, but pattern reusable) |
| 3 | Add PDF-to-text adapter | L2 | BIS_QR, BOJ (2) |
| 4 | Add `partial_blocked` access classification | L2 | RBNZ (1 — classification only, no code) |

**Total generic changes**: 3 code changes + 1 classification addition
**Average generic changes per source**: 3/10 = 0.3 (well below the 3.0 threshold for "abstraction decay")

## Decision: Proceed with Wave 2 (Extractor Extension)

The cold run confirms the abstraction is **not decaying** — the gaps are concentrated in 3 well-defined layers (extractor pattern handling, HTML index support, PDF support), and each fix is genuinely generic (benefits multiple source types, no source-specific branches).

Per user rule: "If a layer needs redesign, STOP and fix before adding more sources." — none of these need redesign. They're additive extensions to existing layers.

**Next**: Implement Wave 2 (extractor extension) → re-run → observe → Wave 3 (HTML index) → Wave 4 (PDF).
