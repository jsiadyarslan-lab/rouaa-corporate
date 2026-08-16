"""D2 — corrections/versioning operations. Immutable rows; supersession via new versions."""
from __future__ import annotations
from .contracts import ObjState, SupersessionReason
from .store import AppendOnlyStore


def supersede_fact(store: AppendOnlyStore, fact_id: str, new_value: str,
                   reason: SupersessionReason, evidence_ref: str,
                   actor: str, run_id: str, created_at: str = "") -> dict:
    """Same-fact correction (e.g. re-extraction of SAME representation found an error):
    appends version+1; prior row remains intact (readable as history)."""
    current = store.current_fact(fact_id)
    if current is None:
        raise ValueError(f"unknown fact {fact_id}")
    if current["status"] != ObjState.ACTIVE.value:
        raise ValueError(f"fact {fact_id} not ACTIVE (={current['status']})")
    # close old row (new version row carrying SUPERSEDED status + link)
    closed = dict(current)
    closed.update({"fact_version": current["fact_version"] + 1,
                   "status": ObjState.SUPERSEDED.value,
                   "superseded_by": f"{fact_id}:v{current['fact_version'] + 2}",
                   "supersession_reason": reason.value, "supersession_evidence": evidence_ref})
    store.append("facts", closed)
    # new active row
    nxt = dict(current)
    nxt.update({"fact_version": current["fact_version"] + 2, "value": new_value,
                "status": ObjState.ACTIVE.value,
                "supersedes": f"{fact_id}:v{current['fact_version']}",
                "superseded_by": None, "supersession_reason": reason.value,
                "supersession_evidence": evidence_ref})
    store.append("facts", nxt)
    store.audit("FACT_SUPERSEDED", {"fact_id": fact_id, "reason": reason.value,
                                    "evidence": evidence_ref, "actor": actor, "run_id": run_id})
    return nxt


def supersede_fact_by_source(store: AppendOnlyStore, old_fact_id: str,
                             new_fact_row: dict, reason: SupersessionReason,
                             evidence_ref: str, actor: str, run_id: str) -> dict:
    """Source-driven change (SOURCE_REVISION / RETRACTED_BY_SOURCE): the successor is a
    DIFFERENT fact (new representation). Old fact gets a closing SUPERSEDED row pointing at it."""
    current = store.current_fact(old_fact_id)
    if current is None:
        raise ValueError(f"unknown fact {old_fact_id}")
    closed = dict(current)
    closed.update({"fact_version": current["fact_version"] + 1,
                   "status": ObjState.SUPERSEDED.value,
                   "superseded_by": new_fact_row["fact_id"],
                   "supersession_reason": reason.value, "supersession_evidence": evidence_ref})
    store.append("facts", closed)
    store.audit("FACT_SUPERSEDED_BY_SOURCE", {"fact_id": old_fact_id,
                                              "successor": new_fact_row["fact_id"],
                                              "reason": reason.value, "evidence": evidence_ref,
                                              "actor": actor, "run_id": run_id})
    return closed


def recompute_event(store: AppendOnlyStore, event_id: str,
                    derived_at: str = "") -> dict | None:
    """D2 propagation: rebuild derivation from CURRENT ACTIVE facts referenced by the event.
    Appends event_version+1 with a fresh snapshot; prior version remains reproducible."""
    versions = store.event_versions(event_id)
    if not versions:
        raise ValueError(f"unknown event {event_id}")
    latest = versions[-1]
    active_facts = []
    for ref in latest["fact_version_snapshot"]:
        cur = store.current_fact(ref["fact_id"])
        if cur and cur["status"] == ObjState.ACTIVE.value:
            active_facts.append(cur)
    snapshot = [{"fact_id": r["fact_id"], "fact_version": r["fact_version"]} for r in active_facts]
    if not active_facts:
        return None
    if snapshot == latest["fact_version_snapshot"]:
        return latest  # no change — no new version (idempotent)
    new_version = latest["event_version"] + 1
    # close old version FIRST (append-only: last row per id = current view)
    closing = dict(latest)
    closing.update({"status": ObjState.SUPERSEDED.value,
                    "superseded_by_version": new_version})
    store.append("events", closing)
    row = dict(latest)
    row.update({"event_version": new_version, "fact_version_snapshot": snapshot,
                "status": ObjState.ACTIVE.value, "derived_at": derived_at})
    store.append("events", row)
    store.audit("EVENT_RECOMPUTED", {"event_id": event_id, "new_version": new_version})
    return store.current_event(event_id)


def reproduce_event(store: AppendOnlyStore, event_id: str, event_version: int) -> dict | None:
    """Historical reproducibility: the old version's snapshot resolves against RETAINED rows."""
    for r in store.event_versions(event_id):
        if r["event_version"] == event_version:
            facts = [store.fact_row(ref["fact_id"], ref["fact_version"])
                     for ref in r["fact_version_snapshot"]]
            if any(f is None for f in facts):
                return None
            return {"event": r, "facts": facts}
    return None
