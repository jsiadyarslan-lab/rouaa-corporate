#!/usr/bin/env python3
"""
Capability Survey V1 — Execution Script (Resumable / Incremental)

Per CAPABILITY_SURVEY_PROTOCOL_V1.md (corrected at 2e33039, APPROVED by user).

Features:
- Writes each source's result to JSONL immediately after completion
- Resumable: skips sources already in survey_data.jsonl
- Shorter fetch timeouts (15s static, 25s Playwright)
- Skip Playwright unless static count <= 3

Outputs:
- docs/evidence/capability_survey/survey_data.jsonl (incremental)
- docs/evidence/capability_survey/survey_results_summary.json (after all done)
"""
import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Tuple, List

OUTPUT_DIR = Path("/home/z/my-project/rouaa-corporate/docs/evidence/capability_survey")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MANIFEST_FILE = OUTPUT_DIR / "sample_manifest.json"
JSONL_FILE = OUTPUT_DIR / "survey_data.jsonl"
SUMMARY_FILE = OUTPUT_DIR / "survey_results_summary.json"

STRATA_URL_HINTS = {
    "B1": {  # Central Banks
        "url_suffix_options": [
            "/en/press-releases", "/en/news", "/en/communications",
            "/en/monetary-policy", "/web/en/press", "/en/about-us/news",
        ],
        "fallback_is_root": True,
    },
    "B2": {  # Financial Regulators
        "url_suffix_options": [
            "/news", "/news/press-releases", "/en/news",
            "/en/press-releases", "/about/news-press-releases",
        ],
        "fallback_is_root": True,
    },
    "B3": {  # Statistical Agencies
        "url_suffix_options": [
            "/releases", "/en/news", "/news", "/statistics",
            "/en/statistics", "/releases/latest",
        ],
        "fallback_is_root": True,
    },
    "B4": {  # Ministries of Finance
        "url_suffix_options": ["/news", "/en/news", "/press-releases", "/en/press-releases"],
        "fallback_is_root": True,
    },
    "B5": {  # Market Infrastructure
        "url_suffix_options": ["/news", "/en/news", "/news-and-insights", "/media/news"],
        "fallback_is_root": True,
    },
    "B6": {  # Public/Sovereign
        "url_suffix_options": ["/news", "/en/news", "/media/news", "/news-and-media"],
        "fallback_is_root": True,
    },
    "B7": {  # Multilateral
        "url_suffix_options": ["/news", "/en/news", "/news-and-events", "/about/news"],
        "fallback_is_root": True,
    },
    "B8": {  # Disclosure Systems
        "url_suffix_options": ["/announcements", "/search", "/en/announcements"],
        "fallback_is_root": True,
    },
    "B9": {  # Other Authoritative
        "url_suffix_options": ["/news", "/en/news", "/about/news", "/press-releases"],
        "fallback_is_root": True,
    },
}

INSTITUTION_URLS = {
    "Bangladesh Bank": "https://www.bb.org.bd",
    "Banco Central do Brasil": "https://www.bcb.gov.br",
    "People's Bank of China": "https://www.pbc.gov.cn",
    "Bank of Korea": "https://www.bok.or.kr",
    "South African Reserve Bank": "https://www.resbank.co.za",
    "Banco de España": "https://www.bde.es",
    "Central Bank of Egypt": "https://www.cbe.org.eg",
    "Central Bank of the UAE": "https://www.centralbank.ae",
    "SEC Philippines": "https://www.sec.gov.ph",
    "MAS (Singapore)": "https://www.mas.gov.sg",
    "CSRC (China)": "http://www.csrc.gov.cn",
    "Federal Financial Supervisory Authority (BaFin)": "https://www.bafin.de",
    "NCUA": "https://www.ncua.gov",
    "AMF (France)": "https://www.amf-france.org",
    "SC (Malaysia)": "https://www.sc.com.my",
    "DANE (Colombia)": "https://www.dane.gov.co",
    "NSO (India)": "https://www.mospi.gov.in",
    "CBS (Netherlands)": "https://www.cbs.nl",
    "FSO (Switzerland)": "https://www.bfs.admin.ch",
    "Ministry of Finance (Saudi Arabia)": "https://www.mof.gov.sa",
    "Ministère de l'Économie (France)": "https://www.economie.gouv.fr",
    "Department of Finance (Canada)": "https://www.canada.ca/en/department-finance.html",
    "Euronext": "https://www.euronext.com",
    "LSE Group": "https://www.lseg.com",
    "China Investment Corporation": "https://www.china-inv.cn",
    "PIF (Saudi Arabia)": "https://www.pif.gov.sa",
    "ADIA (UAE)": "https://www.adia.ae",
    "Basel Committee": "https://www.bis.org/bcbs/",
    "G20": "https://g20.org",
    "SEDAR+ (Canada)": "https://www.sedarplus.ca",
    "SGXNET (Singapore)": "https://www.sgx.com",
    "EIOPA": "https://www.eiopa.europa.eu",
}


def fetch_static(url: str, timeout: int = 15) -> Tuple[bool, str, str]:
    """Fetch URL via urllib (static)."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return True, raw.decode("utf-8", errors="replace"), ""
    except urllib.error.HTTPError as e:
        return False, "", f"HTTP {e.code}"
    except urllib.error.URLError as e:
        return False, "", f"URL error: {str(e.reason)[:100]}"
    except Exception as e:
        return False, "", f"{type(e).__name__}: {str(e)[:100]}"


def fetch_rendered(url: str, timeout: int = 25) -> Tuple[bool, str, str]:
    """Fetch URL via Playwright (rendered)."""
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
                    return False, "", "No response"
                if response.status >= 400:
                    return False, "", f"HTTP {response.status}"
                page.wait_for_timeout(2000)
                content = page.content()
                return True, content, ""
            finally:
                browser.close()
    except Exception as e:
        return False, "", f"{type(e).__name__}: {str(e)[:100]}"


NAV_PATTERNS = re.compile(
    r"(about|contact|privacy|cookie|login|sign|search|sitemap|menu|"
    r"home|index|faq|help|careers|accessibility|disclaimer|copyright|"
    r"facebook|twitter|linkedin|youtube|instagram|share|print|email)",
    re.IGNORECASE,
)

DOCUMENT_KEYWORDS = re.compile(
    r"(press|release|news|statistic|enforcement|announcement|document|"
    r"communiqu|bulletin|notice|decision|order|sanction|designation|"
    r"statement|publication|report|letter|minutes|speech|warning|alert|"
    r"consultation|exposure|draft|proposed|final|interim|update|"
    r"regulation|directive|guideline|policy|circular)",
    re.IGNORECASE,
)


def count_document_urls(html: str) -> Tuple[int, List[str]]:
    """Count <a href> URLs that point to individual documents (not nav)."""
    href_pattern = re.compile(r'<a\s+[^>]*href=["\']([^"\']+)["\']', re.IGNORECASE)
    hrefs = href_pattern.findall(html)
    doc_urls = []
    for href in hrefs:
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        if any(social in href.lower() for social in
               ["facebook.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "instagram.com"]):
            continue
        if NAV_PATTERNS.search(href):
            continue
        if href.startswith("http"):
            continue
        path = href.split("?")[0].split("#")[0]
        if path.count("/") >= 2 or DOCUMENT_KEYWORDS.search(href) or re.search(r"\d{4}|\d{6,}", href):
            doc_urls.append(href)
    seen = set()
    unique = []
    for u in doc_urls:
        if u not in seen:
            seen.add(u)
            unique.append(u)
    return len(unique), unique[:20]


def detect_language(html: str) -> str:
    """Detect primary language from HTML."""
    m = re.search(r'<html[^>]*\blang=["\']([a-zA-Z\-]+)["\']', html, re.IGNORECASE)
    if m:
        return m.group(1).lower()[:2]
    m = re.search(r'<meta[^>]*content-language["\']\s+content=["\']([a-zA-Z\-]+)["\']', html, re.IGNORECASE)
    if m:
        return m.group(1).lower()[:2]
    m = re.search(r'<meta[^>]*name=["\']language["\'][^>]*content=["\']([a-zA-Z\-]+)["\']', html, re.IGNORECASE)
    if m:
        return m.group(1).lower()[:2]
    # Fallback: scan body text for CJK / Cyrillic / Arabic
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if body_match:
        text = re.sub(r'<[^>]+>', ' ', body_match.group(1))
        text = re.sub(r'\s+', ' ', text)[:5000]
        # CJK
        if re.search(r'[\u4e00-\u9fff]', text):
            return "zh"
        if re.search(r'[\u3040-\u309f\u30a0-\u30ff]', text):
            return "ja"
        if re.search(r'[\uac00-\ud7af]', text):
            return "ko"
        if re.search(r'[\u0600-\u06ff]', text):
            return "ar"
        if re.search(r'[\u0400-\u04ff]', text):
            return "ru"
    return "unknown"


def has_english_version(html: str) -> str:
    """Check if English version is available."""
    en_patterns = [
        r'href=["\']/?en/[^"\']+["\']',
        r'href=["\'][^"\']*/english[^"\']*["\']',
        r'hreflang=["\']en[^"\']*["\']',
        r'data-lang=["\']en["\']',
        r'>(English|ENGLISH|english)<',
    ]
    for pat in en_patterns:
        if re.search(pat, html, re.IGNORECASE):
            return "YES"
    return "NO"


def classify_intelligence_type(stratum: str) -> List[str]:
    """Classify intelligence types by stratum (conservative heuristic)."""
    stratum_types = {
        "B1": ["monetary_policy", "statistical_release"],
        "B2": ["regulatory_enforcement"],
        "B3": ["statistical_release"],
        "B4": ["fiscal_policy", "financial_coordination"],
        "B5": ["market_structure"],
        "B6": ["market_structure"],
        "B7": ["financial_coordination", "statistical_release"],
        "B8": ["regulatory_enforcement"],
        "B9": ["regulatory_enforcement"],
    }
    return stratum_types.get(stratum, ["other"])


COVERED_EVENT_TYPES = {
    "monetary_policy", "regulatory_enforcement", "statistical_release",
    "earnings_release", "sanctions_designation", "market_statistic_release",
}


def uncovered_types(types: List[str]) -> List[str]:
    return [t for t in types if t not in COVERED_EVENT_TYPES]


def try_urls_for_source(institution: str, stratum: str) -> List[str]:
    """Build a list of candidate URLs to try."""
    base = INSTITUTION_URLS.get(institution)
    if not base:
        return []
    hints = STRATA_URL_HINTS[stratum]
    candidates = [base + suffix for suffix in hints["url_suffix_options"]]
    if hints.get("fallback_is_root"):
        candidates.append(base)
    return candidates


def survey_one_source(src: dict, index: int) -> dict:
    """Run the full survey for one source."""
    institution = src["institution"]
    stratum = src["stratum"]
    print(f"  [{index:2}/32] {institution[:50]:50s} [{stratum}]", end=" ", flush=True)

    result = {
        "index": index,
        "institution": institution,
        "stratum": stratum,
        "country": src["country"],
        "region": src["region"],
        "tier": src["tier"],
        "universe_status": src["universe_status"],
        "candidate_urls_tried": [],
        "selected_content_path": "",
        "http_status_static": "",
        "static_html_length": 0,
        "static_document_url_count": 0,
        "static_document_url_samples": [],
        "rendered_attempted": False,
        "rendered_html_length": 0,
        "rendered_document_url_count": 0,
        "rendered_document_url_samples": [],
        "rendering_classification": "INCONCLUSIVE",
        "primary_language": "unknown",
        "english_version_available": "UNKNOWN",
        "intelligence_types_observed": classify_intelligence_type(stratum),
        "uncovered_intelligence_types": [],
        "notes": "",
    }

    candidate_urls = try_urls_for_source(institution, stratum)
    if not candidate_urls:
        result["notes"] = "No base URL mapping for this institution"
        print(f"→ INCONCLUSIVE (no URL mapping)")
        return result

    selected_url = ""
    static_html = ""
    for url in candidate_urls[:5]:  # limit to first 5 candidates
        result["candidate_urls_tried"].append(url)
        success, content, error = fetch_static(url)
        if success and len(content) > 1000:
            selected_url = url
            static_html = content
            result["http_status_static"] = "200 OK"
            break

    if not selected_url:
        result["notes"] = f"All {len(result['candidate_urls_tried'])} candidates failed (static)"
        print(f"→ INCONCLUSIVE (URL fetch failed)")
        return result

    result["selected_content_path"] = selected_url
    result["static_html_length"] = len(static_html)

    static_count, static_samples = count_document_urls(static_html)
    result["static_document_url_count"] = static_count
    result["static_document_url_samples"] = static_samples

    result["primary_language"] = detect_language(static_html)
    result["english_version_available"] = has_english_version(static_html)

    if static_count <= 3:
        result["rendered_attempted"] = True
        success, rendered_html, error = fetch_rendered(selected_url)
        if success:
            result["rendered_html_length"] = len(rendered_html)
            rendered_count, rendered_samples = count_document_urls(rendered_html)
            result["rendered_document_url_count"] = rendered_count
            result["rendered_document_url_samples"] = rendered_samples

            if rendered_count >= 5:
                result["rendering_classification"] = "BROWSER_RENDERED"
            elif rendered_count <= 3:
                result["rendering_classification"] = "SPARSE_CONTENT"
            else:
                result["rendering_classification"] = "AMBIGUOUS"
        else:
            result["rendering_classification"] = "INCONCLUSIVE"
            result["notes"] = f"Playwright failed: {error}"
    else:
        result["rendering_classification"] = "STATIC_SUFFICIENT"

    result["uncovered_intelligence_types"] = uncovered_types(result["intelligence_types_observed"])

    print(f"→ {result['rendering_classification']} (static={static_count}, lang={result['primary_language']}, en={result['english_version_available']})")
    return result


def load_completed() -> set:
    """Load institutions already in JSONL (for resume)."""
    completed = set()
    if JSONL_FILE.exists():
        with open(JSONL_FILE) as f:
            for line in f:
                try:
                    r = json.loads(line)
                    completed.add(r["institution"])
                except:
                    pass
    return completed


def append_result(result: dict):
    """Append a result to JSONL immediately."""
    with open(JSONL_FILE, "a") as f:
        f.write(json.dumps(result, indent=None, ensure_ascii=False) + "\n")


def main():
    with open(MANIFEST_FILE) as f:
        manifest = json.load(f)

    completed = load_completed()
    print(f"Capability Survey V1 — Resumable Execution")
    print(f"Sample: {manifest['sample_size']} sources | Already completed: {len(completed)}")
    print("=" * 70)

    for i, src in enumerate(manifest["sample"], 1):
        if src["institution"] in completed:
            print(f"  [{i:2}/32] {src['institution'][:50]:50s} — SKIPPED (already done)")
            continue
        try:
            r = survey_one_source(src, i)
            append_result(r)
        except Exception as e:
            err_result = {
                "index": i,
                "institution": src["institution"],
                "stratum": src["stratum"],
                "country": src["country"],
                "region": src["region"],
                "tier": src["tier"],
                "universe_status": src["universe_status"],
                "rendering_classification": "INCONCLUSIVE",
                "notes": f"EXCEPTION: {type(e).__name__}: {str(e)[:150]}",
                "candidate_urls_tried": [],
                "selected_content_path": "",
                "http_status_static": "",
                "static_html_length": 0,
                "static_document_url_count": 0,
                "static_document_url_samples": [],
                "rendered_attempted": False,
                "rendered_html_length": 0,
                "rendered_document_url_count": 0,
                "rendered_document_url_samples": [],
                "primary_language": "unknown",
                "english_version_available": "UNKNOWN",
                "intelligence_types_observed": classify_intelligence_type(src["stratum"]),
                "uncovered_intelligence_types": [],
            }
            append_result(err_result)
            print(f"  [{i:2}/32] EXCEPTION: {type(e).__name__}: {str(e)[:80]}")

    # Build summary from all results in JSONL
    print("\n" + "=" * 70)
    print("Building summary...")
    results = []
    if JSONL_FILE.exists():
        with open(JSONL_FILE) as f:
            for line in f:
                try:
                    results.append(json.loads(line))
                except:
                    pass

    by_stratum = {}
    for r in results:
        s = r["stratum"]
        by_stratum.setdefault(s, []).append(r)

    summary = {
        "protocol_version": manifest["protocol_version"],
        "random_seed": manifest["random_seed"],
        "sample_size": len(results),
        "executed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "by_stratum": {},
        "rendering_classification_counts": {},
        "language_distribution": {},
        "english_version_distribution": {},
        "uncovered_intelligence_type_counts": {},
    }

    for s in sorted(by_stratum.keys()):
        items = by_stratum[s]
        classifications = {}
        for r in items:
            c = r["rendering_classification"]
            classifications[c] = classifications.get(c, 0) + 1
        summary["by_stratum"][s] = {
            "count": len(items),
            "classifications": classifications,
            "institutions": [r["institution"] for r in items],
        }

    for r in results:
        c = r["rendering_classification"]
        summary["rendering_classification_counts"][c] = \
            summary["rendering_classification_counts"].get(c, 0) + 1
        lang = r["primary_language"]
        summary["language_distribution"][lang] = \
            summary["language_distribution"].get(lang, 0) + 1
        en = r["english_version_available"]
        summary["english_version_distribution"][en] = \
            summary["english_version_distribution"].get(en, 0) + 1
        for t in r["uncovered_intelligence_types"]:
            summary["uncovered_intelligence_type_counts"][t] = \
                summary["uncovered_intelligence_type_counts"].get(t, 0) + 1

    with open(SUMMARY_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"Summary saved to: {SUMMARY_FILE}")

    print(f"\nRendering classifications (n={len(results)}):")
    for c, n in sorted(summary["rendering_classification_counts"].items()):
        pct = 100 * n / len(results)
        print(f"  {c:20s}: {n:2d}/{len(results)} ({pct:.1f}%)")
    print(f"\nLanguage distribution:")
    for lang, n in sorted(summary["language_distribution"].items(), key=lambda x: -x[1]):
        print(f"  {lang:10s}: {n}")
    print(f"\nEnglish version available:")
    for en, n in summary["english_version_distribution"].items():
        print(f"  {en:10s}: {n}")
    print(f"\nUncovered intelligence types (heuristic):")
    for t, n in sorted(summary["uncovered_intelligence_type_counts"].items(), key=lambda x: -x[1]):
        print(f"  {t:30s}: {n}")


if __name__ == "__main__":
    main()
