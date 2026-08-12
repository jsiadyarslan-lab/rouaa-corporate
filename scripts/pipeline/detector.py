"""
Event detector — Layer 4.
Classifies financial events from extracted facts.

NO source-specific code. Event classification is based on fact metrics + values.
Generic rules: if we have rate_decision facts, we create a monetary policy event.

Phase B Wave 2 extension: now handles multiple event types based on
configured_event_type. Each event type has its own detection logic,
but the logic is driven by fact metrics (data), not source identity.

Event types supported:
- monetary_policy_decision (Phase A — rate_decisions + policy_rate facts)
- regulatory_enforcement (Phase B — penalty_amount, defendant_name, action_type facts)
- statistical_release (Phase B — inflation_rate, gdp_growth, unemployment_rate facts)
- earnings_release (Phase B — revenue, eps, net_income, dividend_amount facts)
- sanctions_designation (Phase B — designated_entity, sanctions_program facts)
- market_statistic_release (Phase B — fx_turnover, ird_turnover, usd_amount facts)
"""

from typing import List, Optional
from schemas import Fact, FinancialEvent


# Source display name map (data, not code branches)
SOURCE_NAME_MAP = {
    "ECB": "ECB", "BOE": "Bank of England", "FED": "Federal Reserve",
    "BOC": "Bank of Canada", "RBA": "Reserve Bank of Australia",
    "BOJ": "Bank of Japan", "RBNZ": "Reserve Bank of New Zealand",
    "SEC": "SEC", "FCA": "FCA",
    "ONS": "ONS", "BIS_STATS": "BIS",
    "APPLE": "Apple", "ARAMCO": "Aramco",
    "OFAC": "OFAC", "BIS_QR": "BIS",
}


# Event type detection rules — data-driven, no source-specific logic
# Each event type specifies:
# - trigger_metrics: which fact metrics trigger this event type
# - headline_template: how to format the IO headline (data-driven, not hardcoded)
# - headline_subtypes: optional mapping of subtype → headline verb (for monetary policy)
# - summary_metrics: ordered list of metrics to include in IO summary (first found wins)
# - summary_label: human-readable label for the metric in summary
# - summary_format: how to format the value (raw / percent / usd / count)
# - subtype_from: which metric determines the event subtype
#
# Adding a new event type = adding one entry to this dict (zero code changes).
EVENT_TYPE_RULES = {
    "monetary_policy_decision": {
        "trigger_metrics": {"rate_decision", "policy_rate", "policy_rate_range"},
        "headline_template": "{source} {headline_verb}",
        "headline_subtypes": {
            "rate_maintain": "Maintains Policy Rate",
            "rate_hike": "Raises Policy Rate",
            "rate_cut": "Cuts Policy Rate",
            "rate_published": "Monetary Policy Decision",
            "rate_action": "Monetary Policy Decision",
        },
        "subtype_mapping": {
            "maintain": "rate_maintain",
            "hike": "rate_hike",
            "raise": "rate_hike",
            "cut": "rate_cut",
            "lower": "rate_cut",
        },
        "summary_metrics": [
            {"metric": "rate_decision", "label": "Decision", "format": "raw"},
            {"metric": "policy_rate", "label": "Rate", "format": "percent"},
            {"metric": "policy_rate_range", "label": "Rate", "format": "percent"},
        ],
        "subtype_from": "rate_decision",
    },
    "regulatory_enforcement": {
        "trigger_metrics": {"penalty_amount", "defendant_name", "action_type", "violation_type"},
        "headline_template": "{source} Regulatory Enforcement Action",
        "summary_metrics": [
            {"metric": "action_type", "label": "Action", "format": "raw"},
            {"metric": "defendant_name", "label": "Defendant", "format": "raw"},
            {"metric": "penalty_amount", "label": "Penalty", "format": "usd"},
        ],
        "subtype_from": "action_type",
    },
    "statistical_release": {
        "trigger_metrics": {"inflation_rate", "gdp_growth", "unemployment_rate",
                           "employment_level", "statistic_value", "usd_amount",
                           "percentage_statistic", "cross_border_change"},
        "headline_template": "{source} Statistical Release",
        "summary_metrics": [
            {"metric": "inflation_rate", "label": "Inflation Rate", "format": "percent"},
            {"metric": "gdp_growth", "label": "GDP Growth", "format": "percent"},
            {"metric": "unemployment_rate", "label": "Unemployment Rate", "format": "percent"},
            {"metric": "employment_level", "label": "Employment", "format": "raw"},
            {"metric": "cross_border_change", "label": "Cross-Border Change", "format": "percent"},
            {"metric": "usd_amount", "label": "USD Amount", "format": "usd"},
        ],
        "subtype_from": None,
    },
    "earnings_release": {
        "trigger_metrics": {"revenue", "eps", "net_income", "gross_margin",
                           "yoy_change", "dividend_amount", "total_assets"},
        "headline_template": "{source} Earnings Release",
        "summary_metrics": [
            {"metric": "revenue", "label": "Revenue", "format": "usd"},
            {"metric": "net_income", "label": "Net Income", "format": "usd"},
            {"metric": "eps", "label": "EPS", "format": "usd"},
            {"metric": "dividend_amount", "label": "Dividend", "format": "usd"},
            {"metric": "gross_margin", "label": "Gross Margin", "format": "percent"},
        ],
        "subtype_from": None,
    },
    "sanctions_designation": {
        "trigger_metrics": {"designated_entity", "designated_country",
                           "sanctions_program", "action_type", "faq_topic"},
        "headline_template": "{source} Sanctions Action",
        "summary_metrics": [
            {"metric": "designated_entity", "label": "Entities", "format": "count"},
            {"metric": "sanctions_program", "label": "Programs", "format": "list"},
        ],
        "subtype_from": "action_type",
    },
    "market_statistic_release": {
        "trigger_metrics": {"fx_turnover", "ird_turnover", "cds_turnover",
                           "usd_amount", "percentage_change"},
        "headline_template": "{source} Market Statistics Release",
        "summary_metrics": [
            {"metric": "fx_turnover", "label": "FX Turnover", "format": "usd"},
            {"metric": "ird_turnover", "label": "IRD Turnover", "format": "usd"},
            {"metric": "cds_turnover", "label": "CDS Turnover", "format": "usd"},
            {"metric": "usd_amount", "label": "USD Amount", "format": "usd"},
        ],
        "subtype_from": None,
    },
}


def _format_fact_value(value: str, format_type: str) -> str:
    """Format a fact value for display based on format type.

    Generic — handles common financial value formats.
    """
    if not value:
        return value
    if format_type == "percent":
        return f"{value}%"
    elif format_type == "usd":
        return f"${value}"
    elif format_type == "count":
        # For count format, value is already a count (e.g., "5")
        return value
    elif format_type == "list":
        # For list format, value is a single item; caller handles aggregation
        return value
    else:  # raw
        return value


def _build_event_description(facts: List[Fact], event_type: str) -> str:
    """Build a human-readable description from the extracted facts.

    Architecture Gate Fix 2:
    - Now fully data-driven via EVENT_TYPE_RULES[event_type]["summary_metrics"]
    - NO hardcoded if/elif branches for specific event types
    - Adding a new event type = adding summary_metrics to its rule (zero code changes)
    """
    rules = EVENT_TYPE_RULES.get(event_type)
    if not rules:
        return f"{event_type.replace('_', ' ').title()} detected."

    desc_parts = []
    summary_metrics = rules.get("summary_metrics", [])

    for spec in summary_metrics:
        metric = spec["metric"]
        label = spec["label"]
        fmt = spec["format"]

        matching = [f for f in facts if f.metric == metric]
        if not matching:
            continue

        if fmt == "count":
            # Count format: show number of matching facts
            desc_parts.append(f"{label}: {len(matching)}")
        elif fmt == "list":
            # List format: show unique values
            unique_vals = list(set(f.value for f in matching[:5]))
            desc_parts.append(f"{label}: {', '.join(unique_vals)}")
        else:
            # Single value format (raw / percent / usd)
            formatted = _format_fact_value(matching[0].value, fmt)
            desc_parts.append(f"{label}: {formatted}")

    return " | ".join(desc_parts) if desc_parts else f"{event_type.replace('_', ' ').title()} detected."


def build_headline(source_name: str, event_type: str, subtype: str) -> str:
    """Build a human-readable headline for an Intelligence Object.

    Architecture Gate Fix 2:
    - Fully data-driven via EVENT_TYPE_RULES[event_type]["headline_template"]
    - NO hardcoded if/elif branches for specific event types
    - Monetary policy subtypes (rate_maintain/hike/cut) handled via headline_subtypes mapping

    If the template requires {headline_verb} but the subtype isn't in headline_subtypes,
    falls back to a generic headline. This prevents KeyError for unmapped subtypes.
    """
    rules = EVENT_TYPE_RULES.get(event_type)
    if not rules:
        return f"{source_name} {event_type.replace('_', ' ').title()}"

    template = rules.get("headline_template", "{source} {event}")
    headline_subtypes = rules.get("headline_subtypes", {})

    # If this event type has subtype-specific headline verbs, use them
    if headline_subtypes and subtype in headline_subtypes:
        headline_verb = headline_subtypes[subtype]
        return template.format(source=source_name, headline_verb=headline_verb)

    # Fallback: if template requires headline_verb but subtype not mapped,
    # use a generic event-type-based headline
    if "{headline_verb}" in template:
        return f"{source_name} {event_type.replace('_', ' ').title()}"

    # Otherwise, use the template directly
    return template.format(source=source_name, event=event_type.replace("_", " ").title())


def build_summary(facts: List[Fact], event_type: str, source_name: str, published_at: str) -> str:
    """Build a human-readable summary for an Intelligence Object.

    Architecture Gate Fix 2:
    - Uses _build_event_description (which is data-driven)
    - Appends source and publication date
    - NO hardcoded metric references
    """
    desc = _build_event_description(facts, event_type)
    parts = [desc]
    if source_name:
        parts.append(f"Source: {source_name}")
    if published_at:
        parts.append(f"Published: {published_at}")
    return " | ".join(parts)


def detect_event(
    facts: List[Fact],
    source_code: str,
    document_id: str,
    document_title: str,
    published_at: str,
    configured_event_type: str,
) -> Optional[FinancialEvent]:
    """Detect a financial event from extracted facts.

    Architecture Gate Fix 2:
    - Subtype detection is now data-driven via EVENT_TYPE_RULES
    - Title generation uses build_headline() (data-driven)
    - NO hardcoded if/elif branches for specific event types
    - Adding a new event type with custom subtypes = adding to EVENT_TYPE_RULES

    Returns None if no triggering facts are found.
    """
    if not facts:
        return None

    rules = EVENT_TYPE_RULES.get(configured_event_type)
    if not rules:
        # Unknown event type — fall back to monetary policy logic (Phase A compat)
        rules = EVENT_TYPE_RULES["monetary_policy_decision"]

    # Check if any facts match the trigger metrics for this event type
    trigger_metrics = rules["trigger_metrics"]
    triggering_facts = [f for f in facts if f.metric in trigger_metrics]

    if not triggering_facts:
        return None

    # Determine subtype — data-driven via rules
    subtype = "unknown"
    subtype_metric = rules.get("subtype_from")
    subtype_mapping = rules.get("subtype_mapping", {})  # e.g., {"maintain": "rate_maintain", ...}

    if subtype_metric:
        subtype_facts = [f for f in facts if f.metric == subtype_metric]
        if subtype_facts:
            raw_value = subtype_facts[0].value.lower()
            # Check if there's a mapping for this value
            mapped = False
            for keyword, mapped_subtype in subtype_mapping.items():
                if keyword in raw_value:
                    subtype = mapped_subtype
                    mapped = True
                    break
            if not mapped:
                # No mapping — use the raw value as subtype
                subtype = subtype_facts[0].value
        elif configured_event_type == "monetary_policy_decision":
            # No rate_decision but we have rate values — Phase A compat
            subtype = "rate_published"
    else:
        # No subtype metric — use event type as subtype
        subtype = configured_event_type

    # Build title using data-driven build_headline()
    source_name = SOURCE_NAME_MAP.get(source_code, source_code)
    title = build_headline(source_name, configured_event_type, subtype)

    # Build description using data-driven _build_event_description()
    description = _build_event_description(facts, configured_event_type)

    # Calculate confidence
    all_confidences = [f.extraction_confidence for f in triggering_facts]
    confidence = max(all_confidences) if all_confidences else 0.0

    # Collect fact IDs (all triggering facts)
    fact_ids = [f.id for f in triggering_facts]

    event = FinancialEvent(
        source_code=source_code,
        document_id=document_id,
        event_type=configured_event_type,
        event_subtype=subtype,
        title=title,
        description=description,
        occurred_at=published_at,
        confidence_score=confidence,
        fact_ids=fact_ids,
    )

    return event
