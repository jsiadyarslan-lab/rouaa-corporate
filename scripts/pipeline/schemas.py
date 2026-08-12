"""
Schema definitions for the vertical slice pipeline.
Mirrors the TypeScript shared-types from mvp/packages/shared-types/src/index.ts.

These are the data structures that flow through the pipeline:
  Source → Document → Fact → Event → Evidence → Intelligence Object

Each structure carries provenance fields that enable the traceability test:
  IO → Evidence → Fact → Document → Source (with live URL)
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional, Any
import uuid


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_id() -> str:
    return str(uuid.uuid4())


@dataclass
class SourceRef:
    """Reference to a registered source — carried through the pipeline."""
    code: str
    name: str
    type: str
    country: str
    jurisdiction: str
    trust_tier: int
    website_url: str
    feed_url: str


@dataclass
class Document:
    """Layer 2 — Document Intelligence: a fetched and normalized publication."""
    id: str = field(default_factory=gen_id)
    source_code: str = ""
    title: str = ""
    doc_type: str = "press_release"
    published_at: str = ""
    raw_content_url: str = ""
    content_text: str = ""  # Normalized text content
    content_paragraphs: list = field(default_factory=list)  # Split into paragraphs
    fetch_status: str = "pending"  # pending | fetched | failed
    normalization_status: str = "pending"  # pending | normalized | failed
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Fact:
    """Layer 3 — Financial Fact: an extracted financial metric from a document."""
    id: str = field(default_factory=gen_id)
    source_code: str = ""
    document_id: str = ""
    metric: str = ""  # e.g., "policy_rate", "rate_decision"
    value: str = ""  # e.g., "4.50", "maintain", "5.25-5.50"
    normalized_value: Optional[str] = None  # e.g., "4.5" (from "3-1/2")
    raw_value: Optional[str] = None  # e.g., "3-1/2" (original text)
    unit: Optional[str] = None  # e.g., "percent", "basis_points"
    paragraph_index: Optional[int] = None  # Which paragraph contains this fact
    excerpt: str = ""  # The text snippet that contains the fact
    extraction_confidence: float = 0.0  # 0.0 to 1.0
    extraction_method: str = "rule_based"  # rule_based | manual | model
    fact_role: str = "primary"  # primary | dissent | alternative | context
    published_at: str = ""
    created_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class FinancialEvent:
    """Layer 4 — Event: a categorized financial event from extracted facts."""
    id: str = field(default_factory=gen_id)
    source_code: str = ""
    document_id: str = ""
    event_type: str = ""  # e.g., "monetary_policy_decision"
    event_subtype: str = ""  # e.g., "rate_maintain", "rate_hike", "rate_cut"
    title: str = ""
    description: str = ""
    occurred_at: str = ""  # Publication date of the source document
    confidence_score: float = 0.0
    fact_ids: list = field(default_factory=list)  # Facts that triggered this event
    created_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Evidence:
    """Layer 5 — Evidence: provenance linking a fact to its source document."""
    id: str = field(default_factory=gen_id)
    fact_id: str = ""
    source_code: str = ""
    document_id: str = ""
    paragraph_index: Optional[int] = None
    excerpt: str = ""  # The exact text from the document that supports the fact
    extraction_confidence: float = 0.0
    source_url: str = ""  # Live URL to the official source
    source_name: str = ""  # Official institution name
    document_title: str = ""
    document_date: str = ""
    created_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ProvenanceChain:
    """Complete provenance chain: Source → Document → Fact → Evidence."""
    source_code: str = ""
    source_name: str = ""
    source_url: str = ""
    source_type: str = ""
    source_jurisdiction: str = ""
    source_trust_tier: int = 1
    document_id: str = ""
    document_title: str = ""
    document_url: str = ""
    document_date: str = ""
    fact_id: str = ""
    fact_metric: str = ""
    fact_value: str = ""
    fact_confidence: float = 0.0
    evidence_id: str = ""
    evidence_excerpt: str = ""
    evidence_paragraph: Optional[int] = None
    evidence_confidence: float = 0.0
    chain_verified: bool = False  # True if every link is populated

    def verify(self) -> bool:
        """Verify that every link in the chain is populated."""
        self.chain_verified = all([
            self.source_code, self.source_name, self.source_url,
            self.document_id, self.document_title, self.document_url, self.document_date,
            self.fact_id, self.fact_metric, self.fact_value,
            self.evidence_id, self.evidence_excerpt,
        ])
        return self.chain_verified

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class IntelligenceObject:
    """Layer 7 — The final output: a governed intelligence artifact with embedded evidence."""
    id: str = field(default_factory=gen_id)
    object_type: str = "intelligence"  # Type of intelligence (derived from event_type)
    source_code: str = ""
    source_name: str = ""
    source_url: str = ""
    document_title: str = ""
    document_url: str = ""
    document_date: str = ""
    event_type: str = ""
    event_subtype: str = ""
    headline: str = ""  # Human-readable headline
    summary: str = ""  # Brief summary of the intelligence
    key_facts: list = field(default_factory=list)  # List of fact dicts
    evidence_chains: list = field(default_factory=list)  # List of ProvenanceChain dicts
    confidence: float = 0.0  # Overall confidence (min of all fact confidences)
    provenance_complete: bool = False  # All chains verified
    created_at: str = field(default_factory=utc_now)

    def to_dict(self) -> dict:
        return asdict(self)
