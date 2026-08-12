#!/usr/bin/env python3
"""
Phase 2 — New-Source Validation: BEA First Attempt

Runs BEA through the pipeline with configuration only.
No core code changes. No source-specific code.
Records all metrics for first-attempt assessment.
"""

import sys
import os
import json
import time
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from source_configs import SOURCES
from schemas import Document, Fact, FinancialEvent, Evidence, ProvenanceChain, IntelligenceObject
from fetcher import fetch_source_publications
from content_extractor import normalize_documents_v2
from extractor import extract_facts_multi_category, deduplicate_facts, deduplicate_primary_facts
from detector import detect_event
from evidence import build_evidence_for_facts, build_provenance_chains, verify_provenance
from intelligence_object import generate_intelligence_object, save_io_to_json, save_readable_output
from pipeline_state import derive_state, PENDING, ACCESSIBLE, DOCUMENTED, EXTRACTED, EVIDENCED, GOVERNED, PUBLISHABLE, BLOCKED, FAILED


OUTPUT_DIR = "/home/z/my-project/scripts/pipeline/output"


def run_bea_first_attempt():
    """Run BEA through pipeline — first attempt, config only."""
    source_code = "BEA"
    config = SOURCES[source_code]
    run_start = time.time()

    results = {
        "source": source_code,
        "source_name": config["name"],
        "source_class": config.get("type", "unknown"),
        "first_attempt_config_only": "PENDING",
        "core_intervention": 0,
        "source_specific_code": 0,
        "iterations": 1,
        "elapsed_time_seconds": 0,
        "elapsed_time_human": "",
        "documents_fetched": 0,
        "documents_normalized": 0,
        "facts": 0,
        "events": 0,
        "evidence_chains": 0,
        "ios": 0,
        "publishable": 0,
        "provenance_verified": False,
        "provenance_percent": 0,
        "reproducibility": "FAIL",
        "semantic_errors": 0,
        "pipeline_state": PENDING,
        "errors": [],
        "io_samples": [],
    }

    print("=" * 70)
    print("PHASE 2 — NEW-SOURCE VALIDATION: BEA FIRST ATTEMPT")
    print("=" * 70)
    print(f"Source: {source_code} — {config['name']}")
    print(f"Class: {config['type']}")
    print(f"Feed: {config['feedUrl']}")
    print(f"Start: {datetime.now().isoformat()}")
    print(f"Rules: config-only, no core changes, no source-specific code")
    print("=" * 70)

    # Step 1: Fetch
    print("\n[1/7] Fetching...")
    try:
        documents, access_status, fetch_method = fetch_source_publications(config, max_items=10)
        results["documents_fetched"] = len(documents)

        if access_status == "blocked":
            results["pipeline_state"] = BLOCKED
            results["first_attempt_config_only"] = "FAIL"
            results["errors"].append("access_blocked")
            print(f"  ⊘ BLOCKED")
            results["elapsed_time_seconds"] = round(time.time() - run_start, 2)
            return results

        if documents:
            print(f"  ✓ Fetched {len(documents)} documents via {fetch_method}")
        else:
            results["pipeline_state"] = FAILED
            results["first_attempt_config_only"] = "FAIL"
            results["errors"].append("no_documents")
            print(f"  ✗ No documents fetched")
            results["elapsed_time_seconds"] = round(time.time() - run_start, 2)
            return results
    except Exception as e:
        results["errors"].append(f"fetch_error: {str(e)[:100]}")
        results["pipeline_state"] = FAILED
        results["first_attempt_config_only"] = "FAIL"
        print(f"  ✗ {e}")
        results["elapsed_time_seconds"] = round(time.time() - run_start, 2)
        return results

    # Step 2: Normalize
    print("[2/7] Normalizing...")
    try:
        keywords = config.get("content_keywords", [])
        documents = normalize_documents_v2(documents, keywords)
        normalized = [d for d in documents if d.normalization_status == "normalized"]
        results["documents_normalized"] = len(normalized)
        if not normalized:
            results["pipeline_state"] = DOCUMENTED
            results["first_attempt_config_only"] = "FAIL"
            results["errors"].append("normalization_failed")
            print(f"  ✗ No documents normalized")
            results["elapsed_time_seconds"] = round(time.time() - run_start, 2)
            return results
        print(f"  ✓ Normalized {len(normalized)}/{len(documents)}")
    except Exception as e:
        results["errors"].append(f"normalization_error: {str(e)[:100]}")
        print(f"  ✗ {e}")
        results["elapsed_time_seconds"] = round(time.time() - run_start, 2)
        return results

    # Step 3: Extract facts
    print("[3/7] Extracting facts...")
    all_facts = []
    try:
        for doc in normalized:
            facts = extract_facts_multi_category(doc, config)
            facts = deduplicate_facts(facts)
            facts = deduplicate_primary_facts(facts)
            all_facts.extend(facts)
    except Exception as e:
        results["errors"].append(f"extraction_error: {str(e)[:100]}")
        print(f"  ✗ {e}")

    results["facts"] = len(all_facts)
    print(f"  → {len(all_facts)} facts")

    # Step 4: Detect events
    print("[4/7] Detecting events...")
    events = []
    doc_with_facts = {}
    for doc in normalized:
        doc_facts = [f for f in all_facts if f.document_id == doc.id]
        if doc_facts:
            event = detect_event(
                facts=doc_facts,
                source_code=source_code,
                document_id=doc.id,
                document_title=doc.title,
                published_at=doc.published_at,
                configured_event_type=config["event_type"],
            )
            if event:
                events.append(event)
                doc_with_facts[doc.id] = (doc, doc_facts)

    results["events"] = len(events)
    print(f"  → {len(events)} events")

    if not all_facts:
        results["pipeline_state"] = DOCUMENTED
        results["first_attempt_config_only"] = "FAIL"
        results["elapsed_time_seconds"] = round(time.time() - run_start, 2)
        return results

    # Step 5: Evidence + Provenance
    print("[5/7] Evidence + Provenance...")
    all_evidence = []
    doc_evidence = {}
    all_chains = []
    doc_chains = {}

    for doc_id, (doc, doc_facts) in doc_with_facts.items():
        ev = build_evidence_for_facts(doc_facts, doc, config)
        all_evidence.extend(ev)
        doc_evidence[doc_id] = ev
        chains = build_provenance_chains(doc_facts, doc, ev, config)
        all_chains.extend(chains)
        doc_chains[doc_id] = chains

    results["evidence_chains"] = len(all_chains)
    results["provenance_verified"] = verify_provenance(all_chains) if all_chains else False
    results["provenance_percent"] = 100 if results["provenance_verified"] else 0
    print(f"  → {len(all_chains)} chains, verified={results['provenance_verified']}")

    # Step 6: Generate IOs
    print("[6/7] Generating IOs...")
    intelligence_objects = []
    for doc_id, (doc, doc_facts) in doc_with_facts.items():
        doc_events = [e for e in events if e.document_id == doc_id]
        event = doc_events[0] if doc_events else None
        if not event:
            continue
        ev_list = doc_evidence.get(doc_id, [])
        chains = doc_chains.get(doc_id, [])
        io = generate_intelligence_object(
            document=doc,
            facts=doc_facts,
            event=event,
            evidence_list=ev_list,
            provenance_chains=chains,
            source_config=config,
        )
        if io:
            intelligence_objects.append(io)

    results["ios"] = len(intelligence_objects)
    good_ios = [io for io in intelligence_objects if io.provenance_complete and io.confidence >= 0.7]
    results["publishable"] = len(good_ios)

    if good_ios:
        results["pipeline_state"] = PUBLISHABLE
        results["first_attempt_config_only"] = "PASS"
    else:
        state, _ = derive_state(
            "open", True, True, len(all_facts) > 0, len(events) > 0,
            len(all_evidence) > 0, results["provenance_verified"],
            len(intelligence_objects) > 0, "reject"
        )
        results["pipeline_state"] = state
        results["first_attempt_config_only"] = "FAIL"

    print(f"  → {len(intelligence_objects)} IOs ({len(good_ios)} publishable)")

    # Save IOs
    if intelligence_objects:
        source_dir = os.path.join(OUTPUT_DIR, source_code)
        os.makedirs(source_dir, exist_ok=True)
        for i, io in enumerate(intelligence_objects):
            save_io_to_json(io, os.path.join(source_dir, f"io_{i+1}.json"))
            save_readable_output(io, os.path.join(source_dir, f"io_{i+1}.txt"))

        for io in intelligence_objects[:5]:
            results["io_samples"].append({
                "headline": io.headline,
                "summary": io.summary[:200],
                "confidence": io.confidence,
                "key_facts_count": len(io.key_facts),
                "event_type": io.event_type,
                "event_subtype": io.event_subtype,
                "provenance_complete": io.provenance_complete,
            })

    # Step 7: Reproducibility
    print("[7/7] Reproducibility...")
    if doc_with_facts and all_facts:
        first_doc_id = list(doc_with_facts.keys())[0]
        first_doc, first_facts = doc_with_facts[first_doc_id]
        re_facts = extract_facts_multi_category(first_doc, config)
        re_facts = deduplicate_facts(re_facts)
        re_facts = deduplicate_primary_facts(re_facts)
        orig_keys = set((f.metric, f.value, f.paragraph_index) for f in first_facts)
        re_keys = set((f.metric, f.value, f.paragraph_index) for f in re_facts)
        if orig_keys == re_keys:
            results["reproducibility"] = "PASS"
            print(f"  ✓ Reproducibility verified")
        else:
            print(f"  ✗ Reproducibility failed")
    else:
        print(f"  ⚠ No facts to verify")

    results["elapsed_time_seconds"] = round(time.time() - run_start, 2)
    results["elapsed_time_human"] = f"{results['elapsed_time_seconds']:.1f}s"

    return results


if __name__ == "__main__":
    results = run_bea_first_attempt()

    print("\n" + "=" * 70)
    print("FIRST ATTEMPT RESULTS")
    print("=" * 70)
    print()
    print(f"Source:              {results['source']}")
    print(f"First-attempt:       {results['first_attempt_config_only']}")
    print(f"Core intervention:   {results['core_intervention']}")
    print(f"Source-specific code: {results['source_specific_code']}")
    print(f"Iterations:          {results['iterations']}")
    print(f"Elapsed time:        {results['elapsed_time_human']}")
    print(f"Documents fetched:   {results['documents_fetched']}")
    print(f"Documents normalized: {results['documents_normalized']}")
    print(f"Facts:               {results['facts']}")
    print(f"Events:              {results['events']}")
    print(f"Evidence chains:     {results['evidence_chains']}")
    print(f"IOs:                 {results['ios']}")
    print(f"Publishable:         {results['publishable']}")
    print(f"Provenance:          {results['provenance_percent']}%")
    print(f"Reproducibility:     {results['reproducibility']}")
    print(f"Semantic errors:     {results['semantic_errors']}")
    print(f"Pipeline state:      {results['pipeline_state']}")

    if results["errors"]:
        print(f"Errors:              {results['errors']}")

    if results["io_samples"]:
        print()
        print("=== IO SAMPLES ===")
        for i, s in enumerate(results["io_samples"][:3]):
            print(f"  IO {i+1}:")
            print(f"    headline: {s['headline']}")
            print(f"    summary: {s['summary'][:150]}")
            print(f"    confidence: {s['confidence']}, facts: {s['key_facts_count']}")
            print(f"    provenance_complete: {s['provenance_complete']}")

    # Save results
    results_path = os.path.join(OUTPUT_DIR, "bea_first_attempt_results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nResults saved: {results_path}")
