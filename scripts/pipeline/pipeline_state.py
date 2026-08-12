"""
Pipeline state model — observability layer.

Architecture Gate Fix 3:
- Explicit state machine for tracking pipeline progress
- Each source moves through states: PENDING → ACCESSIBLE → DOCUMENTED → EXTRACTED → EVIDENCED → GOVERNED → PUBLISHABLE
- Any state can transition to FAILED or BLOCKED with a failure_reason
- This is OBSERVABILITY, not architecture — the pipeline behavior is unchanged
- States are derived from existing metrics, made explicit for reporting

States:
  PENDING      — source not yet processed
  ACCESSIBLE   — fetch succeeded, documents retrieved
  DOCUMENTED   — documents normalized successfully
  EXTRACTED    — facts extracted from documents
  EVIDENCED    — evidence records built for facts
  GOVERNED     — provenance chains verified
  PUBLISHABLE  — Intelligence Object generated and meets quality threshold
  BLOCKED      — source is access_blocked (environmental, not pipeline failure)
  FAILED       — pipeline error at some stage (with failure_reason)
"""

from typing import Optional


# State constants
PENDING = "PENDING"
ACCESSIBLE = "ACCESSIBLE"
DOCUMENTED = "DOCUMENTED"
EXTRACTED = "EXTRACTED"
EVIDENCED = "EVIDENCED"
GOVERNED = "GOVERNED"
PUBLISHABLE = "PUBLISHABLE"
BLOCKED = "BLOCKED"
FAILED = "FAILED"


# Ordered states — each is a prerequisite for the next
ORDERED_STATES = [
    PENDING,
    ACCESSIBLE,
    DOCUMENTED,
    EXTRACTED,
    EVIDENCED,
    GOVERNED,
    PUBLISHABLE,
]

# Terminal states (no further transitions)
TERMINAL_STATES = {PUBLISHABLE, BLOCKED, FAILED}


def derive_state(
    access_status: str,
    fetch_success: bool,
    document_normalization: bool,
    fact_extraction: bool,
    event_detection: bool,
    evidence_generation: bool,
    provenance_completeness: bool,
    intelligence_object: bool,
    output_quality: str,
) -> tuple:
    """Derive the current pipeline state from metrics.

    Returns (state, failure_reason).

    This is observability — the state is computed from existing metrics,
    not stored separately. The pipeline behavior is unchanged.

    Args:
        All metrics from the results dict.
    Returns:
        (state, failure_reason) where failure_reason is "" if no failure.
    """
    # Check for blocked first (environmental)
    if access_status == "blocked" or output_quality == "blocked":
        return BLOCKED, "access_blocked"

    # Walk through the ordered states — return the first one that isn't satisfied
    if not fetch_success:
        return FAILED, "fetch_failed"

    if not document_normalization:
        return FAILED, "normalization_failed"

    if not fact_extraction:
        # Not necessarily a failure — some documents may not contain facts
        # But if we got here, the pipeline couldn't extract anything
        return DOCUMENTED, ""  # Partial progress — documented but no facts

    if not event_detection:
        return EXTRACTED, ""  # Partial progress — facts extracted but no event

    if not evidence_generation:
        return FAILED, "evidence_generation_failed"

    if not provenance_completeness:
        return EVIDENCED, ""  # Partial progress — evidence built but chains incomplete

    if not intelligence_object:
        return FAILED, "io_generation_failed"

    if output_quality != "accept":
        return GOVERNED, ""  # Partial progress — governed but quality threshold not met

    return PUBLISHABLE, ""


def state_progressPercentage(state: str) -> int:
    """Return the percentage of pipeline completion for a state.

    PENDING = 0%, PUBLISHABLE = 100%, BLOCKED/FAILED = based on last successful state.
    """
    if state in ORDERED_STATES:
        idx = ORDERED_STATES.index(state)
        return int((idx / (len(ORDERED_STATES) - 1)) * 100)
    if state == BLOCKED:
        return 0  # Never started processing
    if state == FAILED:
        return 0  # Failed — no useful progress
    return 0
