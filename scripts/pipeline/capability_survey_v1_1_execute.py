#!/usr/bin/env python3
"""
Capability Survey V1.1 — Execution Script (Resumable / Incremental)
Per CAPABILITY_SURVEY_PROTOCOL_V1_1.md (FROZEN at 14de356).
Resumable: skips already-completed sources. Writes each result immediately.
"""
import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Tuple, List, Optional

OUTPUT_DIR = Path("/home/z/my-project/rouaa-corporate/docs/evidence/capability_survey")
MANIFEST_FILE = OUTPUT_DIR / "sample_manifest.json"
V1_JSONL_FILE = OUTPUT_DIR / "survey_data.jsonl"
JSONL_FILE = OUTPUT_DIR / "survey_data_v1_1.jsonl"
SUMMARY_FILE = OUTPUT_DIR / "survey_results_summary_v1_1.json"

STRATA_INTEL_TYPES = {
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

INTEL_KEYWORDS = {
    "monetary_policy": ["monetary", "policy", "rate", "interest", "decision",
                       "press-release", "press_release", "pressrelease"],
    "regulatory_enforcement": ["enforcement", "action", "sanction", "penalty",
                                "fine", "order", "consent", "cease", "desist",
                                "decision", "press-release", "press_release"],
    "statistical_release": ["release", "statistic", "data", "publication",
                            "indicator", "report", "press-release", "press_release"],
    "fiscal_policy": ["fiscal", "budget", "tax", "spending", "treasury",
                      "debt", "press-release", "press_release"],
    "financial_coordination": ["communique", "statement", "coordination",
                                "standard", "press-release", "press_release",
                                "publication"],
    "market_structure": ["announcement", "notice", "rule", "regulation",
                         "market", "press-release", "press_release"],
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


def fetch_static(url, timeout=15):
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
            return True, resp.read().decode("utf-8", errors="replace"), ""
    except urllib.error.HTTPError as e:
        return False, "", f"HTTP {e.code}"
    except urllib.error.URLError as e:
        return False, "", f"URL error: {str(e.reason)[:80]}"
    except Exception as e:
        return False, "", f"{type(e).__name__}: {str(e)[:80]}"


def fetch_rendered(url, timeout=25):
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
                page.wait_for_timeout(2500)
                return True, page.content(), ""
            finally:
                browser.close()
    except Exception as e:
        return False, "", f"{type(e).__name__}: {str(e)[:80]}"


NAV_PATTERNS = re.compile(
    r"(about|contact|privacy|cookie|login|sign|sitemap|menu|"
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


def count_document_urls(html):
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


def detect_language(html):
    m = re.search(r'<html[^>]*\blang=["\']([a-zA-Z\-]+)["\']', html, re.IGNORECASE)
    if m:
        return m.group(1).lower()[:2]
    m = re.search(r'<meta[^>]*content-language["\']\s+content=["\']([a-zA-Z\-]+)["\']', html, re.IGNORECASE)
    if m:
        return m.group(1).lower()[:2]
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if body_match:
        text = re.sub(r'<[^>]+>', ' ', body_match.group(1))
        text = re.sub(r'\s+', ' ', text)[:5000]
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


def has_english_version(html):
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


def crawl_homepage_for_candidates(base_url):
    success, html, error = fetch_static(base_url)
    if not success or len(html) < 1000:
        success, html, error = fetch_rendered(base_url)
        if not success or len(html) < 1000:
            return []
    href_pattern = re.compile(r'<a\s+[^>]*href=["\']([^"\']+)["\']', re.IGNORECASE)
    hrefs = href_pattern.findall(html)
    candidates = []
    content_keywords = re.compile(
        r"(press|release|news|announcement|publication|communiqu|bulletin|"
        r"notice|statement|media|communications|monetary|policy|enforcement|"
        r"statistic|publication|speech|decision|regulation|directive|rule)",
        re.IGNORECASE,
    )
    for href in hrefs:
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        if any(social in href.lower() for social in
               ["facebook.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "instagram.com"]):
            continue
        if href.startswith("http"):
            if base_url.replace("https://", "").replace("http://", "").split("/")[0] not in href:
                continue
            abs_url = href
        elif href.startswith("/"):
            protocol = "https://" if base_url.startswith("https") else "http://"
            domain = base_url.replace("https://", "").replace("http://", "").split("/")[0]
            abs_url = f"{protocol}{domain}{href}"
        else:
            abs_url = base_url.rstrip("/") + "/" + href
        path_lower = abs_url.lower()
        if NAV_PATTERNS.search(path_lower):
            continue
        if not (content_keywords.search(href) or href.count("/") >= 2):
            continue
        candidates.append(abs_url)
    seen = set()
    unique = []
    for u in candidates:
        if u not in seen:
            seen.add(u)
            unique.append(u)
    return unique[:15]


def is_semantically_relevant(candidate_url, intel_types):
    url_lower = candidate_url.lower()
    for intel_type in intel_types:
        keywords = INTEL_KEYWORDS.get(intel_type, [])
        for kw in keywords:
            if kw in url_lower:
                return True
    return False


def select_content_path(institution, stratum):
    base_url = INSTITUTION_URLS.get(institution, "")
    if not base_url:
        return "", "NO_BASE_URL", []
    intel_types = STRATA_INTEL_TYPES.get(stratum, [])
    candidates = crawl_homepage_for_candidates(base_url)
    if not candidates:
        return "", "STAGE1_FAILED", [base_url]
    eligible = []
    for url in candidates:
        success, html, error = fetch_static(url)
        if success and len(html) > 1000:
            doc_count, _ = count_document_urls(html)
            eligible.append((url, html, doc_count))
    if not eligible:
        return "", "STAGE2_FAILED", candidates
    semantically_relevant = [(u, h, c) for (u, h, c) in eligible
                              if is_semantically_relevant(u, intel_types)]
    if not semantically_relevant:
        return "", "NO_SEMANTIC_MATCH", [e[0] for e in eligible]
    semantically_relevant.sort(key=lambda x: -x[2])
    selected_url, selected_html, _ = semantically_relevant[0]
    return selected_url, "STAGE2_OK", [e[0] for e in eligible]


def classify_browser_rendering(selected_url):
    success, static_html, error = fetch_static(selected_url)
    if not success:
        return {
            "rendering_classification": "INCONCLUSIVE",
            "static_html_length": 0,
            "static_document_url_count": 0,
            "rendered_attempted": False,
            "rendered_html_length": 0,
            "rendered_document_url_count": 0,
            "rendering_notes": f"Static fetch failed: {error}",
        }
    static_count, _ = count_document_urls(static_html)
    if static_count > 3:
        return {
            "rendering_classification": "STATIC_SUFFICIENT",
            "static_html_length": len(static_html),
            "static_document_url_count": static_count,
            "rendered_attempted": False,
            "rendered_html_length": 0,
            "rendered_document_url_count": 0,
            "rendering_notes": "Static fetch produced sufficient documents",
        }
    rendered_success, rendered_html, rendered_error = fetch_rendered(selected_url)
    if not rendered_success:
        return {
            "rendering_classification": "INCONCLUSIVE",
            "static_html_length": len(static_html),
            "static_document_url_count": static_count,
            "rendered_attempted": True,
            "rendered_html_length": 0,
            "rendered_document_url_count": 0,
            "rendering_notes": f"Playwright on selected path failed: {rendered_error}",
        }
    rendered_count, _ = count_document_urls(rendered_html)
    if rendered_count >= 5:
        return {
            "rendering_classification": "BROWSER_RENDERED",
            "static_html_length": len(static_html),
            "static_document_url_count": static_count,
            "rendered_attempted": True,
            "rendered_html_length": len(rendered_html),
            "rendered_document_url_count": rendered_count,
            "rendering_notes": "Static <=3, Playwright >=5 (selected content path)",
        }
    elif rendered_count <= 3:
        return {
            "rendering_classification": "SPARSE_CONTENT",
            "static_html_length": len(static_html),
            "static_document_url_count": static_count,
            "rendered_attempted": True,
            "rendered_html_length": len(rendered_html),
            "rendered_document_url_count": rendered_count,
            "rendering_notes": "Static and rendered both sparse — likely wrong content path",
        }
    else:
        return {
            "rendering_classification": "AMBIGUOUS",
            "static_html_length": len(static_html),
            "static_document_url_count": static_count,
            "rendered_attempted": True,
            "rendered_html_length": len(rendered_html),
            "rendered_document_url_count": rendered_count,
            "rendering_notes": f"Rendered count={rendered_count} in 4-range",
        }


def extract_document_urls_for_inspection(html, base_url, limit=3):
    _, samples = count_document_urls(html)
    if not samples:
        return []
    abs_samples = []
    for s in samples[:limit]:
        if s.startswith("http"):
            abs_samples.append(s)
        elif s.startswith("/"):
            protocol = "https://" if base_url.startswith("https") else "http://"
            domain = base_url.replace("https://", "").replace("http://", "").split("/")[0]
            abs_samples.append(f"{protocol}{domain}{s}")
        else:
            abs_samples.append(base_url.rstrip("/") + "/" + s)
    return abs_samples


def extract_title_and_summary(html):
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else ""
    title = re.sub(r'\s+', ' ', title)[:300]
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    body_text = ""
    if body_match:
        text = re.sub(r'<script[^>]*>.*?</script>', ' ', body_match.group(1), flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style[^>]*>.*?</style>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        body_text = text[:500]
    return title, body_text


def classify_intelligence_type(title, summary):
    text = (title + " " + summary).lower()
    types_found = []
    if any(kw in text for kw in ["policy rate", "interest rate", "monetary policy", "key rate",
                                   "refinancing", "policy decision", "rate decision",
                                   "maintain", "raise", "cut", "lower", "hike"]):
        if any(kw in text for kw in ["policy rate", "interest rate", "monetary policy",
                                       "key rate", "refinancing", "rate decision"]):
            types_found.append("monetary_policy")
    if any(kw in text for kw in ["enforcement", "consent order", "cease and desist",
                                   "civil money penalty", "consent prohibition",
                                   "sanction", "penalty", "fine", "violation",
                                   "defendant", "charged", "settled"]):
        types_found.append("regulatory_enforcement")
    if any(kw in text for kw in ["cpi", "inflation rate", "gdp", "unemployment rate",
                                   "statistical release", "employment level",
                                   "consumer price", "producer price",
                                   "retail sales", "industrial production",
                                   "trade balance", "balance of payments"]):
        types_found.append("statistical_release")
    if any(kw in text for kw in ["earnings", "revenue", "eps", "net income",
                                   "dividend", "quarterly results"]):
        types_found.append("earnings_release")
    if any(kw in text for kw in ["sanctions list", "designated entity", "sdn list",
                                   "ofac", "sanctions program", "designated person"]):
        types_found.append("sanctions_designation")
    if any(kw in text for kw in ["fx turnover", "ird turnover", "cds turnover",
                                   "triennial survey", "market statistic"]):
        types_found.append("market_statistic_release")
    if any(kw in text for kw in ["budget", "fiscal", "tax", "spending",
                                   "deficit", "treasury", "debt management"]):
        types_found.append("fiscal_policy")
    if any(kw in text for kw in ["communique", "standard-setting", "international standard",
                                   "coordination", "joint statement", "principles",
                                   "basel", "iosco", "iais"]):
        types_found.append("financial_coordination")
    if any(kw in text for kw in ["supervisory", "prudential", "banking oversight",
                                   "supervision", "supervisory letter"]):
        types_found.append("prudential_supervision")
    if any(kw in text for kw in ["export control", "trade compliance", "trade sanction"]):
        types_found.append("trade_compliance")
    if any(kw in text for kw in ["consumer protection", "consumer warning",
                                   "product intervention", "consumer complaint"]):
        types_found.append("consumer_protection")
    if any(kw in text for kw in ["market structure", "competition assessment",
                                   "market report", "market integrity"]):
        types_found.append("market_structure")
    if not types_found:
        types_found.append("other")
    seen = set()
    unique = []
    for t in types_found:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    return unique


COVERED_EVENT_TYPES = {
    "monetary_policy", "regulatory_enforcement", "statistical_release",
    "earnings_release", "sanctions_designation", "market_statistic_release",
}


def uncovered_types(types):
    return [t for t in types if t not in COVERED_EVENT_TYPES]


def load_v1_results():
    v1 = {}
    if V1_JSONL_FILE.exists():
        with open(V1_JSONL_FILE) as f:
            for line in f:
                try:
                    r = json.loads(line)
                    v1[r["institution"]] = r
                except:
                    pass
    return v1


def load_v1_1_completed():
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


def append_v1_1_result(result):
    with open(JSONL_FILE, "a") as f:
        f.write(json.dumps(result, indent=None, ensure_ascii=False) + "\n")


def process_source(src, v1_results, index):
    institution = src["institution"]
    stratum = src["stratum"]
    v1 = v1_results.get(institution, {})
    print(f"  [{index:2}/32] {institution[:50]:50s} [{stratum}]", end=" ", flush=True)
    result = {
        "index": index,
        "institution": institution,
        "stratum": stratum,
        "country": src["country"],
        "v1_rendering_classification": v1.get("rendering_classification", "UNKNOWN"),
        "v1_primary_language": v1.get("primary_language", "unknown"),
        "v1_english_version_available": v1.get("english_version_available", "UNKNOWN"),
        "v1_1_rendering_classification": v1.get("rendering_classification", "UNKNOWN"),
        "v1_1_primary_language": v1.get("primary_language", "unknown"),
        "v1_1_english_version_available": v1.get("english_version_available", "UNKNOWN"),
        "rerun_performed": False,
        "rerun_discovery_method": "",
        "rerun_selected_content_path": "",
        "rerun_candidates_tried": [],
        "content_inspection_performed": False,
        "content_inspection_documents_fetched": 0,
        "content_inspection_document_classifications": [],
        "content_inspection_combined_intelligence_types": [],
        "content_inspection_uncovered_types": [],
        "content_inspection_notes": "",
    }
    if v1.get("rendering_classification") == "INCONCLUSIVE":
        result["rerun_performed"] = True
        selected_url, discovery_method, candidates_tried = select_content_path(institution, stratum)
        result["rerun_discovery_method"] = discovery_method
        result["rerun_candidates_tried"] = candidates_tried
        if discovery_method == "STAGE2_OK" and selected_url:
            result["rerun_selected_content_path"] = selected_url
            rendering = classify_browser_rendering(selected_url)
            result["v1_1_rendering_classification"] = rendering["rendering_classification"]
            result["v1_1_static_html_length"] = rendering["static_html_length"]
            result["v1_1_static_document_url_count"] = rendering["static_document_url_count"]
            result["v1_1_rendered_attempted"] = rendering["rendered_attempted"]
            result["v1_1_rendered_html_length"] = rendering["rendered_html_length"]
            result["v1_1_rendered_document_url_count"] = rendering["rendered_document_url_count"]
            result["v1_1_rendering_notes"] = rendering["rendering_notes"]
            success, html, _ = fetch_static(selected_url)
            if success:
                result["v1_1_primary_language"] = detect_language(html)
                result["v1_1_english_version_available"] = has_english_version(html)
            else:
                result["v1_1_primary_language"] = "unknown"
                result["v1_1_english_version_available"] = "UNKNOWN"
        else:
            result["v1_1_rendering_classification"] = "INCONCLUSIVE"
            result["v1_1_rendering_notes"] = f"Re-run failed at {discovery_method}"
            result["v1_1_primary_language"] = "unknown"
            result["v1_1_english_version_available"] = "UNKNOWN"

    result["content_inspection_performed"] = True
    content_path = ""
    if result["rerun_performed"] and result["rerun_selected_content_path"]:
        content_path = result["rerun_selected_content_path"]
    elif v1.get("selected_content_path"):
        content_path = v1["selected_content_path"]
    elif v1.get("rendering_classification") in ("STATIC_SUFFICIENT", "BROWSER_RENDERED"):
        sel_url, _, _ = select_content_path(institution, stratum)
        content_path = sel_url
    else:
        sel_url, _, _ = select_content_path(institution, stratum)
        content_path = sel_url
    if not content_path:
        result["content_inspection_notes"] = "No content path available for inspection"
        print(f"→ {result['v1_1_rendering_classification']} (no content path)")
        return result
    success, html, error = fetch_static(content_path)
    if not success or len(html) < 1000:
        success, html, error = fetch_rendered(content_path)
        if not success or len(html) < 1000:
            result["content_inspection_notes"] = f"Content path fetch failed: {error}"
            print(f"→ {result['v1_1_rendering_classification']} (inspection failed)")
            return result
    doc_urls = extract_document_urls_for_inspection(html, content_path, limit=3)
    if not doc_urls:
        result["content_inspection_notes"] = "No document URLs found in content path"
        print(f"→ {result['v1_1_rendering_classification']} (no doc URLs)")
        return result
    classifications = []
    for doc_url in doc_urls:
        doc_success, doc_html, doc_error = fetch_static(doc_url)
        if not doc_success or len(doc_html) < 500:
            doc_success, doc_html, doc_error = fetch_rendered(doc_url)
            if not doc_success or len(doc_html) < 500:
                classifications.append({"url": doc_url, "title": "", "summary": "", "types": ["FETCH_FAILED"]})
                continue
        title, summary = extract_title_and_summary(doc_html)
        types = classify_intelligence_type(title, summary)
        classifications.append({"url": doc_url, "title": title, "summary": summary[:200], "types": types})
    result["content_inspection_documents_fetched"] = sum(1 for c in classifications if "FETCH_FAILED" not in c["types"])
    result["content_inspection_document_classifications"] = classifications
    combined = set()
    for c in classifications:
        for t in c["types"]:
            if t != "FETCH_FAILED":
                combined.add(t)
    result["content_inspection_combined_intelligence_types"] = sorted(combined)
    result["content_inspection_uncovered_types"] = uncovered_types(sorted(combined))
    print(f"→ {result['v1_1_rendering_classification']} | docs={result['content_inspection_documents_fetched']} | types={','.join(combined)[:60]}")
    return result


def main():
    with open(MANIFEST_FILE) as f:
        manifest = json.load(f)
    v1_results = load_v1_results()
    completed = load_v1_1_completed()
    print(f"Capability Survey V1.1 — Execution (per 14de356 FROZEN)")
    print(f"Sample: {manifest['sample_size']} sources | Already completed: {len(completed)}")
    print("=" * 70)
    for i, src in enumerate(manifest["sample"], 1):
        if src["institution"] in completed:
            print(f"  [{i:2}/32] {src['institution'][:50]:50s} — SKIPPED (already done)")
            continue
        try:
            r = process_source(src, v1_results, i)
            append_v1_1_result(r)
        except Exception as e:
            err_result = {
                "index": i, "institution": src["institution"], "stratum": src["stratum"],
                "country": src["country"],
                "v1_rendering_classification": v1_results.get(src["institution"], {}).get("rendering_classification", "UNKNOWN"),
                "v1_primary_language": v1_results.get(src["institution"], {}).get("primary_language", "unknown"),
                "v1_english_version_available": v1_results.get(src["institution"], {}).get("english_version_available", "UNKNOWN"),
                "v1_1_rendering_classification": "INCONCLUSIVE",
                "v1_1_primary_language": "unknown",
                "v1_1_english_version_available": "UNKNOWN",
                "rerun_performed": False, "rerun_discovery_method": "",
                "rerun_selected_content_path": "", "rerun_candidates_tried": [],
                "content_inspection_performed": False,
                "content_inspection_documents_fetched": 0,
                "content_inspection_document_classifications": [],
                "content_inspection_combined_intelligence_types": [],
                "content_inspection_uncovered_types": [],
                "content_inspection_notes": f"EXCEPTION: {type(e).__name__}: {str(e)[:120]}",
            }
            append_v1_1_result(err_result)
            print(f"  [{i:2}/32] EXCEPTION: {type(e).__name__}: {str(e)[:80]}")

    print("\n" + "=" * 70)
    print("Building V1.1 summary...")
    results = []
    if JSONL_FILE.exists():
        with open(JSONL_FILE) as f:
            for line in f:
                try:
                    results.append(json.loads(line))
                except:
                    pass
    summary = {
        "protocol_version": "CAPABILITY_SURVEY_PROTOCOL_V1_1.md (FROZEN at 14de356)",
        "sample_size": len(results),
        "executed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "rendering_classification_counts_v1": {},
        "rendering_classification_counts_v1_1": {},
        "language_distribution_v1_1": {},
        "english_version_distribution_v1_1": {},
        "uncovered_intelligence_type_counts": {},
        "content_inspection_completeness": 0,
        "v1_inconclusive_promoted_to_v1_1_measured": 0,
    }
    v1_counts = {}; v11_counts = {}; lang_v11 = {}; en_v11 = {}; uncovered = {}
    content_ok = 0; promoted = 0
    for r in results:
        v1c = r.get("v1_rendering_classification", "UNKNOWN")
        v1_counts[v1c] = v1_counts.get(v1c, 0) + 1
        v11c = r.get("v1_1_rendering_classification", "UNKNOWN")
        v11_counts[v11c] = v11_counts.get(v11c, 0) + 1
        lang = r.get("v1_1_primary_language", "unknown")
        lang_v11[lang] = lang_v11.get(lang, 0) + 1
        en = r.get("v1_1_english_version_available", "UNKNOWN")
        en_v11[en] = en_v11.get(en, 0) + 1
        if r.get("content_inspection_documents_fetched", 0) > 0:
            content_ok += 1
            for t in r.get("content_inspection_uncovered_types", []):
                uncovered[t] = uncovered.get(t, 0) + 1
        if v1c == "INCONCLUSIVE" and v11c != "INCONCLUSIVE":
            promoted += 1
    summary["rendering_classification_counts_v1"] = v1_counts
    summary["rendering_classification_counts_v1_1"] = v11_counts
    summary["language_distribution_v1_1"] = lang_v11
    summary["english_version_distribution_v1_1"] = en_v11
    summary["uncovered_intelligence_type_counts"] = uncovered
    summary["content_inspection_completeness"] = content_ok
    summary["v1_inconclusive_promoted_to_v1_1_measured"] = promoted
    with open(SUMMARY_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"Summary saved to: {SUMMARY_FILE}")
    print(f"\nRendering classifications:")
    print(f"  V1:   {dict(sorted(v1_counts.items()))}")
    print(f"  V1.1: {dict(sorted(v11_counts.items()))}")
    print(f"\nV1 INCONCLUSIVE → V1.1 measured: {promoted}")
    print(f"\nLanguage V1.1: {dict(sorted(lang_v11.items()))}")
    print(f"\nEnglish V1.1: {dict(sorted(en_v11.items()))}")
    print(f"\nContent inspection: {content_ok}/{len(results)}")
    print(f"\nUncovered types: {dict(sorted(uncovered.items()))}")


if __name__ == "__main__":
    main()
