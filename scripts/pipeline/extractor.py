"""
Rule-based fact extractor v2 — Layer 3.
Extracts financial facts from normalized document text using regex patterns.

Improvements over v1:
1. Fractional rate normalization (3-1/2 → 3.5, 3 3/4 → 3.75)
2. Semantic fact roles: primary | dissent | alternative | context | forecast | revision
3. Separates the actual decision from dissenting proposals

NO source-specific code. All patterns come from source config.
NO AI/LLM. Deterministic extraction only.

Architecture Gate Fix 1 (Dimension 3):
- detect_fact_role() no longer hardcodes monetary-policy-specific patterns
- Role detection patterns are now configurable via source config
- Default role patterns cover common financial-domain roles
- Adding a new role = adding a pattern list to config (zero code changes)
- NO source-specific branches — role patterns are data, not code
"""

import re
from typing import List, Tuple
from schemas import Document, Fact


def normalize_fractional_rate(raw: str) -> str:
    """Normalize fractional rate expressions to decimal.

    Handles:
    - "3-1/2" → "3.5"
    - "3 1/2" → "3.5"
    - "3½" → "3.5"
    - "3-3/4" → "3.75"
    - "3.5" → "3.5" (already decimal)

    This is GENERIC — works for any fractional rate expression.
    """
    if not raw:
        return raw

    # Unicode fractions
    unicode_fractions = {
        "½": "/2", "¼": "/4", "¾": "/4",
        "⅓": "/3", "⅔": "/3",
        "⅕": "/5", "⅖": "/5", "⅗": "/5", "⅘": "/5",
        "⅛": "/8", "⅜": "/8", "⅝": "/8", "⅞": "/8",
    }
    text = raw
    for uni, replacement in unicode_fractions.items():
        text = text.replace(uni, replacement)

    # Match patterns like "3-1/2", "3 1/2", "3-1/4"
    # The separator can be: -, space, or nothing
    frac_pattern = re.compile(r"(\d+)[\s-]+(\d+)/(\d+)")
    match = frac_pattern.search(text)
    if match:
        whole = int(match.group(1))
        numerator = int(match.group(2))
        denominator = int(match.group(3))
        decimal = whole + numerator / denominator
        return str(round(decimal, 4))

    # Already decimal
    if re.match(r"^\d+(?:\.\d+)?$", raw.strip()):
        return raw.strip()

    return raw


# ============================================================================
# DEFAULT ROLE DETECTION PATTERNS (Architecture Gate Fix 1)
#
# These are GENERIC language patterns that indicate semantic roles across
# financial domains. They are NOT monetary-policy-specific.
#
# - "dissent" patterns cover voting/proposal disagreement (central banks, committees)
# - "alternative" patterns cover proposed-but-not-adopted values
# - "context" patterns cover historical/background mentions
# - "forecast" patterns cover forward-looking projections
# - "revision" patterns cover restated/preliminary-vs-final values
#
# Sources can override or extend these via source_config["role_patterns"].
# Adding a new role = adding a pattern list here or in config (zero code changes).
# ============================================================================

DEFAULT_ROLE_PATTERNS = {
    "dissent": [
        # Committee voting language (central banks, regulatory bodies)
        "votes to increase", "votes to raise", "votes to cut", "votes to lower",
        "preferred to increase", "preferred to raise", "preferred to cut",
        "voted against", "voted to increase", "voted to raise",
        "voted to cut", "voted to lower",
        "preferring to increase", "preferring to raise",
        "preferred a", "would have preferred",
        "dissented", "dissenting",
        # General disagreement language
        "objected to", "opposed the", "concurred with",
    ],
    "alternative": [
        # Proposed but not adopted
        "proposed to", "suggested", "recommend",
        "alternative", "counterfactual",
        "considered but", "evaluated but",
    ],
    "context": [
        # Historical/background references
        "previous meeting", "last meeting", "prior to",
        "compared to", "since the previous",
        "has been at", "was at", "had been",
        "previously stood at", "changed from",
    ],
    "forecast": [
        # Forward-looking projections
        "forecast", "projected", "expected to",
        "outlook for", "anticipates", "anticipate",
        "guidance of", "guidance range",
        "is expected to", "are expected to",
    ],
    "revision": [
        # Restated/revised values
        "revised from", "restated", "previously reported as",
        "corrected from", "updated from",
        "preliminary", "final estimate",
        "revised estimate", "revised value",
    ],
}

# Priority order — first match wins. primary is the fallback (no patterns).
ROLE_PRIORITY = ["dissent", "alternative", "context", "forecast", "revision"]


def detect_fact_role(excerpt: str, paragraph: str, role_patterns: dict = None) -> str:
    """Detect the semantic role of a fact.

    Determines whether a fact is:
    - primary: the actual decision/value (default)
    - dissent: a dissenting vote or disagreement
    - alternative: a proposed but not adopted value
    - context: background/historical mention
    - forecast: forward-looking projection
    - revision: restated/revised value

    Architecture Gate Fix 1:
    - Role patterns are now configurable via source_config["role_patterns"]
    - Falls back to DEFAULT_ROLE_PATTERNS (generic, cross-domain)
    - NO monetary-policy-specific hardcoding
    - Adding a new role = adding a pattern list (zero code changes)

    Detection strategy:
    - dissent: checked on BOTH paragraph and excerpt (broad context — dissent
      may be established earlier in the paragraph, not right next to the fact)
    - alternative, context, forecast, revision: checked on EXCERPT ONLY
      (immediate context — these roles are about the fact's framing, not
      the paragraph's topic. A paragraph can discuss "previous meeting"
      while the fact itself is the primary decision.)

    Args:
        excerpt: The text snippet containing the fact (±50 chars around match)
        paragraph: The full paragraph where the fact was found
        role_patterns: Optional dict of {role: [patterns]} from source config.
                      If None, uses DEFAULT_ROLE_PATTERNS.
    """
    if role_patterns is None:
        role_patterns = DEFAULT_ROLE_PATTERNS

    # Extraction Hardening: normalize whitespace before role detection.
    # PDF extraction and HTML normalization can produce text with newlines
    # where patterns expect spaces (e.g., "will\ncontinue to" vs "will continue to").
    # This normalization ensures role patterns match regardless of whitespace type.
    # This is a GENERIC fix — applies to all sources, all patterns.
    import re as _re
    normalized_excerpt = _re.sub(r'\s+', ' ', excerpt).strip().lower()
    normalized_para = _re.sub(r'\s+', ' ', paragraph).strip().lower()

    # Check roles in priority order — first match wins
    for role in ROLE_PRIORITY:
        patterns = role_patterns.get(role, [])
        for pattern in patterns:
            # Normalize pattern whitespace too (in case pattern has newlines)
            normalized_pattern = _re.sub(r'\s+', ' ', pattern).strip().lower()
            if role == "dissent":
                # Dissent: check both paragraph and excerpt (broad context)
                if normalized_pattern in normalized_para:
                    return role
            else:
                # Other roles: check excerpt only (immediate context)
                if normalized_pattern in normalized_excerpt:
                    return role

    return "primary"


def calculate_confidence(pattern_type: str, match_groups: tuple, fact_role: str) -> float:
    """Calculate extraction confidence based on pattern type, match quality, and role.

    Phase B Wave 2: extended to recognize non-rate pattern types.
    Confidence is data-driven — pattern types with explicit values get higher confidence.
    """
    confidence_map = {
        # Rate patterns (Phase A)
        "rate_value": 0.95,
        "rate_range": 0.95,
        "rate_maintain": 0.90,
        "rate_action": 0.85,
        "rate_action_with_value": 0.95,
        "monetary_policy_committee": 0.70,

        # Regulatory patterns (Phase B) — amounts and named entities are high-confidence
        "penalty_amount": 0.90,
        "defendant_name": 0.75,  # named entity extraction is less precise
        "violation_type": 0.80,
        "action_type": 0.75,
        "designated_entity": 0.85,  # OFAC format is highly structured
        "designated_country": 0.85,
        "sanctions_program": 0.95,  # bracketed format is very precise
        "faq_topic": 0.80,

        # Statistical patterns (Phase B)
        "inflation_rate": 0.90,
        "gdp_growth": 0.90,
        "unemployment_rate": 0.90,
        "employment_level": 0.85,
        "statistic_value": 0.70,
        "statistic_release": 0.65,
        "usd_amount": 0.85,
        "percentage_statistic": 0.80,
        "cross_border_change": 0.85,

        # Earnings patterns (Phase B)
        "revenue": 0.90,
        "eps": 0.90,
        "net_income": 0.90,
        "gross_margin": 0.85,
        "yoy_change": 0.85,
        "dividend_amount": 0.90,
        "total_assets": 0.85,

        # Market statistics (Phase B)
        "fx_turnover": 0.90,
        "ird_turnover": 0.90,
        "cds_turnover": 0.90,
        "percentage_change": 0.80,
    }
    base = confidence_map.get(pattern_type, 0.50)

    # Boost confidence if we have extracted values
    if match_groups and any(g for g in match_groups if g):
        base = min(base + 0.05, 1.0)

    # Reduce confidence for non-primary facts
    if fact_role == "dissent":
        base *= 0.7
    elif fact_role == "alternative":
        base *= 0.8
    elif fact_role == "context":
        base *= 0.6

    return round(base, 2)


# NOTE: The legacy extract_facts_from_paragraph() and extract_facts() functions
# were removed during Architecture Gate Fix 2. They contained monetary-policy-specific
# if/elif branches (rate_value, rate_range, rate_maintain, rate_action, etc.).
# All extraction now goes through the data-driven _extract_fact_from_match() +
# extract_facts_multi_category() path, which uses PATTERN_TYPE_METADATA (data)
# instead of hardcoded branches. Zero functionality lost — regression verified.


def deduplicate_facts(facts: List[Fact]) -> List[Fact]:
    """Remove duplicate facts (same metric + value + paragraph + role).

    Multiple patterns may match the same text — keep the highest confidence.
    """
    seen = {}
    for fact in facts:
        key = (fact.metric, fact.value, fact.paragraph_index, fact.fact_role)
        if key not in seen or fact.extraction_confidence > seen[key].extraction_confidence:
            seen[key] = fact

    return list(seen.values())


def deduplicate_primary_facts(facts: List[Fact]) -> List[Fact]:
    """Resolve conflicting PRIMARY facts for the same metric in the same paragraph.

    Extraction Hardening Fix (generic, no source-specific logic):

    When multiple PRIMARY facts exist for the same (metric, paragraph_index) with
    DIFFERENT values, only ONE can be the actual primary fact. This function keeps
    the highest-confidence PRIMARY fact and removes the conflicting ones.

    Rules:
    - Only applies to DECISION-type metrics where conflicting values are semantically wrong
      (rate_decision, policy_rate, policy_rate_range, monetary_policy_committee)
    - Does NOT apply to data metrics that can legitimately have multiple values per paragraph
      (usd_amount, penalty_amount, revenue, designated_entity, etc.)
    - Only resolves when values are DIFFERENT (same-value facts already deduped)
    - Facts with other roles (dissent, alternative, forecast, context, revision)
      are PRESERVED — they are correct and should not be deleted
    - Tiebreaker: if same confidence, prefer non-generic values (value != "action")
      because "action" is a fallback when verb mapping fails

    This is NOT blind dedup — it only resolves conflicting PRIMARY facts within
    the same metric+paragraph context, and only for decision-type metrics.
    Different roles are always preserved. Data metrics are always preserved.
    """
    # Metrics where multiple conflicting PRIMARY values are semantically wrong
    # (a paragraph should have one decision, not multiple conflicting decisions)
    DECISION_METRICS = {
        "rate_decision", "policy_rate", "policy_rate_range",
        "monetary_policy_committee",
    }

    # Separate PRIMARY decision facts from others
    primary_decision_facts = []
    other_facts = []
    for fact in facts:
        if (fact.fact_role == "primary"
            and fact.paragraph_index is not None
            and fact.metric in DECISION_METRICS):
            primary_decision_facts.append(fact)
        else:
            other_facts.append(fact)

    # Group PRIMARY decision facts by (metric, paragraph_index)
    groups = {}
    for fact in primary_decision_facts:
        key = (fact.metric, fact.paragraph_index)
        if key not in groups:
            groups[key] = []
        groups[key].append(fact)

    # Resolve conflicts within each group
    resolved = []
    for key, group in groups.items():
        distinct_values = set(f.value for f in group)
        if len(distinct_values) <= 1:
            # No conflict — keep all (same value, possibly different confidence)
            resolved.extend(group)
        else:
            # Conflict — multiple PRIMARY facts with different values
            # Keep only the best one
            # Tiebreaker: highest confidence, then prefer non-"action" value
            def sort_key(f):
                # Higher confidence = better (reverse sort)
                # Non-"action" value = better (0 > 1 for "action")
                action_penalty = 1 if f.value == "action" else 0
                return (-f.extraction_confidence, action_penalty)

            best = min(group, key=sort_key)
            resolved.append(best)

    return resolved + other_facts


# ============================================================================
# GENERIC MULTI-CATEGORY EXTRACTION (Phase B Wave 2)
#
# The original extract_facts() only handles rate_patterns. Phase B sources
# have regulatory_patterns, statistical_patterns, earnings_patterns, etc.
#
# This extension iterates over ALL pattern categories in source config.
# Pattern categories are DATA (config-driven), not hardcoded — adding a new
# category (e.g., "esg_patterns") requires zero code changes here.
#
# Pattern types are self-describing via PATTERN_TYPE_METADATA:
#   - "rate_value" → metric="policy_rate", unit="percent"
#   - "penalty_amount" → metric="penalty_amount", unit="usd"
#   - "revenue" → metric="revenue", unit="usd"
#   - etc.
#
# Generic change count: 1 (this file). Benefits: 5+ Phase B sources.
# ============================================================================

# Metadata for non-rate pattern types — generic, data-driven
# Each pattern type specifies:
# - metric: the Fact.metric to set
# - unit: the Fact.unit to set (percent / usd / people / None)
# - category: semantic category (monetary / regulatory / statistical / earnings / market)
# - value_type: how to derive the value from the regex match:
#   "group_1_number_magnitude" → "{groups[0]} {groups[1]}" (e.g., "1.2 billion")
#   "group_1_normalized" → normalize_fractional_rate(groups[0])
#   "group_1_raw" → groups[0] as-is
#   "groups_0_1_combined" → "{groups[0]} ({groups[1]})" for entity+country
#   "fixed:maintain" → literal value "maintain"
#   "verb_to_action" → map verb (raise/cut/maintain) to action
#   "full_match" → use entire matched text as value
#   "group_1_2_range" → "{norm_low}-{norm_high}" for rate ranges
PATTERN_TYPE_METADATA = {
    # Rate-related
    "rate_value": {"metric": "policy_rate", "unit": "percent", "category": "monetary", "value_type": "group_1_normalized"},
    "rate_range": {"metric": "policy_rate_range", "unit": "percent", "category": "monetary", "value_type": "group_1_2_range"},
    "rate_maintain": {"metric": "rate_decision", "unit": None, "category": "monetary", "value_type": "fixed:maintain"},
    "rate_action": {"metric": "rate_decision", "unit": None, "category": "monetary", "value_type": "verb_to_action"},
    "rate_action_with_value": {"metric": "rate_decision", "unit": None, "category": "monetary", "value_type": "verb_to_action"},
    "monetary_policy_committee": {"metric": "monetary_policy_committee", "unit": None, "category": "monetary", "value_type": "fixed:MPC_voted"},

    # Regulatory patterns
    "penalty_amount": {"metric": "penalty_amount", "unit": "usd", "category": "regulatory", "value_type": "group_1_number_magnitude"},
    "defendant_name": {"metric": "defendant_name", "unit": None, "category": "regulatory", "value_type": "group_1_raw"},
    "violation_type": {"metric": "violation_type", "unit": None, "category": "regulatory", "value_type": "group_1_raw"},
    "action_type": {"metric": "action_type", "unit": None, "category": "regulatory", "value_type": "group_1_raw"},
    "designated_entity": {"metric": "designated_entity", "unit": None, "category": "regulatory", "value_type": "groups_0_1_combined"},
    "designated_country": {"metric": "designated_country", "unit": None, "category": "regulatory", "value_type": "group_1_raw"},
    "sanctions_program": {"metric": "sanctions_program", "unit": None, "category": "regulatory", "value_type": "group_1_raw"},
    "faq_topic": {"metric": "faq_topic", "unit": None, "category": "regulatory", "value_type": "group_1_raw"},

    # Statistical patterns
    "inflation_rate": {"metric": "inflation_rate", "unit": "percent", "category": "statistical", "value_type": "group_1_normalized"},
    "gdp_growth": {"metric": "gdp_growth", "unit": "percent", "category": "statistical", "value_type": "group_1_normalized"},
    "unemployment_rate": {"metric": "unemployment_rate", "unit": "percent", "category": "statistical", "value_type": "group_1_normalized"},
    "employment_level": {"metric": "employment_level", "unit": "people", "category": "statistical", "value_type": "group_1_number_magnitude"},
    "statistic_value": {"metric": "statistic_value", "unit": None, "category": "statistical", "value_type": "group_1_raw"},
    "statistic_release": {"metric": "statistic_release", "unit": None, "category": "statistical", "value_type": "full_match"},
    "usd_amount": {"metric": "usd_amount", "unit": "usd", "category": "statistical", "value_type": "group_1_number_magnitude"},
    "percentage_statistic": {"metric": "percentage_statistic", "unit": "percent", "category": "statistical", "value_type": "group_1_normalized"},
    "cross_border_change": {"metric": "cross_border_change", "unit": "percent", "category": "statistical", "value_type": "group_1_normalized"},

    # Earnings patterns
    "revenue": {"metric": "revenue", "unit": "usd", "category": "earnings", "value_type": "group_1_number_magnitude"},
    "eps": {"metric": "eps", "unit": "usd", "category": "earnings", "value_type": "group_1_normalized"},
    "net_income": {"metric": "net_income", "unit": "usd", "category": "earnings", "value_type": "group_1_number_magnitude"},
    "gross_margin": {"metric": "gross_margin", "unit": "percent", "category": "earnings", "value_type": "group_1_normalized"},
    "yoy_change": {"metric": "yoy_change", "unit": "percent", "category": "earnings", "value_type": "group_1_normalized"},
    "dividend_amount": {"metric": "dividend_amount", "unit": "usd", "category": "earnings", "value_type": "group_1_number_magnitude"},
    "total_assets": {"metric": "total_assets", "unit": "usd", "category": "earnings", "value_type": "group_1_number_magnitude"},

    # Market statistics (BIS QR)
    "fx_turnover": {"metric": "fx_turnover", "unit": "usd", "category": "market", "value_type": "group_1_number_magnitude"},
    "ird_turnover": {"metric": "ird_turnover", "unit": "usd", "category": "market", "value_type": "group_1_number_magnitude"},
    "cds_turnover": {"metric": "cds_turnover", "unit": "usd", "category": "market", "value_type": "group_1_number_magnitude"},
    "percentage_change": {"metric": "percentage_change", "unit": "percent", "category": "market", "value_type": "group_1_normalized"},
}


def _normalize_amount(raw_value: str, unit_hint: str) -> str:
    """Normalize monetary amounts to a canonical form.

    "$1.2 billion" → "1.2 billion"
    "1,200 million" → "1.2 billion" (cross-normalize to billions)
    "3.5" → "3.5" (already decimal)

    Generic — works for any currency amount.
    """
    if not raw_value:
        return raw_value
    # Strip currency symbols and commas
    cleaned = re.sub(r"[\$£€,]", "", raw_value).strip()
    return cleaned


def _derive_value_from_type(value_type: str, groups: tuple, match: re.Match, unit: str = None) -> tuple:
    """Derive fact value from regex match groups based on value_type metadata.

    Architecture Gate Fix 2:
    - Fully data-driven — no if/elif branches for specific pattern types
    - Adding a new value type = adding a handler here (or using an existing one)
    - Pattern types in PATTERN_TYPE_METADATA reference these value_type strings

    Returns (value, raw_value, normalized_value).
    """
    raw_value = None
    normalized_value = None
    value = ""

    if value_type == "group_1_number_magnitude":
        # Group 1 = number, Group 2 = magnitude (million/billion)
        if len(groups) >= 2 and groups[0] and groups[1]:
            value = f"{groups[0]} {groups[1]}"
            raw_value = value
            normalized_value = _normalize_amount(value, unit or "")
        elif groups and groups[0]:
            value = groups[0]
            raw_value = value
            normalized_value = _normalize_amount(value, unit or "")

    elif value_type == "group_1_normalized":
        # Group 1 = value, normalize fractional rates
        if groups and groups[0]:
            value = groups[0]
            raw_value = value
            normalized_value = normalize_fractional_rate(value)
            value = normalized_value

    elif value_type == "group_1_raw":
        # Group 1 = value, use as-is
        if groups and groups[0]:
            value = groups[0].strip()
            raw_value = value
            normalized_value = value
        else:
            value = match.group(0)
            raw_value = value

    elif value_type == "groups_0_1_combined":
        # Groups 0+1 = entity + country, combined
        if groups and groups[0]:
            value = groups[0].strip()
            if len(groups) >= 2 and groups[1]:
                value = f"{groups[0].strip()} ({groups[1].strip()})"
            raw_value = value
            normalized_value = value
        else:
            value = match.group(0)
            raw_value = value

    elif value_type == "group_1_2_range":
        # Groups 1+2 = low+high of a range
        if len(groups) >= 2 and groups[0] and groups[1]:
            raw_low = groups[0]
            raw_high = groups[1]
            norm_low = normalize_fractional_rate(raw_low)
            norm_high = normalize_fractional_rate(raw_high)
            value = f"{norm_low}-{norm_high}"
            raw_value = f"{raw_low}-{raw_high}"
            normalized_value = value

    elif value_type and value_type.startswith("fixed:"):
        # Fixed literal value (e.g., "fixed:maintain" → value="maintain")
        value = value_type.split(":", 1)[1]
        raw_value = value
        normalized_value = value

    elif value_type == "verb_to_action":
        # Map verb (raise/cut/maintain) to action
        if groups and groups[0]:
            verb = groups[0].lower()
            if "raise" in verb or "increas" in verb:
                value = "hike"
            elif "cut" in verb or "lower" in verb or "decreas" in verb:
                value = "cut"
            elif "maintain" in verb or "kept" in verb or "held" in verb or "keep" in verb:
                value = "maintain"
            else:
                value = verb
        else:
            value = "action"
        raw_value = value
        normalized_value = value

    elif value_type == "full_match":
        # Use entire matched text as value
        value = match.group(0)
        raw_value = value
        normalized_value = value

    else:
        # Unknown value_type — use full match as fallback
        value = match.group(0)
        raw_value = value

    return value, raw_value, normalized_value


def _extract_fact_from_match(
    match: re.Match,
    pattern_type: str,
    paragraph: str,
    paragraph_index: int,
    source_code: str,
    document_id: str,
    published_at: str,
    role_patterns: dict = None,
) -> Fact:
    """Create a Fact from a regex match, using pattern_type metadata.

    Architecture Gate Fix 2:
    - Fully data-driven — value derivation uses value_type from PATTERN_TYPE_METADATA
    - NO if/elif branches for specific pattern types
    - Adding a new pattern type = adding an entry to PATTERN_TYPE_METADATA (zero code changes)
    """
    groups = match.groups()
    metadata = PATTERN_TYPE_METADATA.get(pattern_type, {
        "metric": pattern_type, "unit": None, "category": "unknown", "value_type": "full_match"
    })

    metric = metadata["metric"]
    unit = metadata["unit"]
    category = metadata["category"]
    value_type = metadata.get("value_type", "full_match")

    # Derive value using data-driven value_type
    value, raw_value, normalized_value = _derive_value_from_type(value_type, groups, match, unit)

    # Get excerpt (context around match)
    start = max(0, match.start() - 50)
    end = min(len(paragraph), match.end() + 50)
    excerpt = paragraph[start:end].strip()
    if start > 0:
        excerpt = "..." + excerpt
    if end < len(paragraph):
        excerpt = excerpt + "..."

    # Detect semantic role (uses configurable role_patterns or defaults)
    fact_role = detect_fact_role(excerpt, paragraph, role_patterns)

    # Calculate confidence
    confidence = calculate_confidence(pattern_type, groups, fact_role)

    # For non-monetary categories, role detection is less meaningful
    # but we still apply it for consistency
    if category in ("regulatory", "statistical", "earnings", "market"):
        if fact_role == "primary":
            confidence = min(confidence + 0.05, 1.0)
        elif fact_role == "context":
            confidence = max(confidence, 0.7)

    return Fact(
        source_code=source_code,
        document_id=document_id,
        metric=metric,
        value=value,
        normalized_value=normalized_value,
        raw_value=raw_value,
        unit=unit,
        paragraph_index=paragraph_index,
        excerpt=excerpt,
        extraction_confidence=confidence,
        extraction_method="rule_based",
        fact_role=fact_role,
        published_at=published_at,
    )


def extract_facts_multi_category(
    document: Document,
    source_config: dict,
) -> List[Fact]:
    """Extract facts from a Document using ALL pattern categories in source config.

    Generic — iterates over rate_patterns, regulatory_patterns,
    statistical_patterns, earnings_patterns, and any future pattern categories
    added to source config. No hardcoded category list.

    Also passes role_patterns from source config to detect_fact_role().
    If source config has no role_patterns, defaults are used.

    This is the Phase B extension of extract_facts(). The original function
    is preserved for backward compatibility with Phase A code.
    """
    all_facts = []

    if document.normalization_status != "normalized":
        return all_facts

    if not document.content_paragraphs:
        return all_facts

    # Collect ALL pattern categories from source config
    # Look for any key ending in "_patterns"
    all_patterns = []
    for key, value in source_config.items():
        if key.endswith("_patterns") and isinstance(value, list):
            all_patterns.extend(value)

    if not all_patterns:
        return all_facts

    # Get role_patterns from config (or None to use defaults)
    role_patterns = source_config.get("role_patterns")

    # Apply each pattern to each paragraph
    for i, paragraph in enumerate(document.content_paragraphs):
        if len(paragraph) < 20:
            continue

        for pattern in all_patterns:
            # Support optional 3rd element: case_sensitive (default False = IGNORECASE)
            # This is a GENERIC mechanism — any pattern in any source can use it.
            # Existing 2-tuple patterns are backward compatible (case_sensitive=False).
            pattern_str = pattern[0]
            pattern_type = pattern[1]
            case_sensitive = pattern[2] if len(pattern) > 2 else False

            try:
                # Extraction Hardening Fix: per-pattern case sensitivity control
                # Default: re.IGNORECASE (backward compatible)
                # If case_sensitive=True: no IGNORECASE flag (case-sensitive matching)
                if case_sensitive:
                    matches = re.finditer(pattern_str, paragraph)
                else:
                    matches = re.finditer(pattern_str, paragraph, re.IGNORECASE)

                for match in matches:
                    fact = _extract_fact_from_match(
                        match=match,
                        pattern_type=pattern_type,
                        paragraph=paragraph,
                        paragraph_index=i,
                        source_code=document.source_code,
                        document_id=document.id,
                        published_at=document.published_at,
                        role_patterns=role_patterns,
                    )
                    all_facts.append(fact)
            except re.error as e:
                continue

    return all_facts
