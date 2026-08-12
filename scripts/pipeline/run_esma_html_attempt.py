#!/usr/bin/env python3
"""ESMA HTML Adapter Validation — first attempt, config-only"""
import sys, os, json, time
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from source_configs import SOURCES
from schemas import Document
from fetcher import fetch_source_publications
from content_extractor import normalize_documents_v2
from extractor import extract_facts_multi_category, deduplicate_facts, deduplicate_primary_facts
from detector import detect_event
from evidence import build_evidence_for_facts, build_provenance_chains, verify_provenance
from intelligence_object import generate_intelligence_object, save_io_to_json, save_readable_output
from pipeline_state import PUBLISHABLE, BLOCKED, FAILED

OUTPUT_DIR = "/home/z/my-project/scripts/pipeline/output"

def run():
    source_code = "ESMA_HTML"
    config = SOURCES[source_code]
    run_start = time.time()
    
    results = {
        "source": source_code, "source_name": config["name"], "source_class": config["type"],
        "feed_format": config["feed_format"],
        "first_attempt_config_only": "PENDING", "core_intervention": 0, "source_specific_code": 0,
        "iterations": 1, "human_config_time_minutes": 4, "pipeline_runtime_seconds": 0,
        "documents_fetched": 0, "documents_normalized": 0, "facts": 0, "events": 0,
        "evidence_chains": 0, "ios": 0, "publishable": 0, "provenance_verified": False,
        "provenance_percent": 0, "reproducibility": "FAIL", "semantic_errors": 0,
        "pipeline_state": "PENDING", "errors": [], "io_samples": [],
        "document_dates_found": 0, "document_dates_empty": 0,
    }
    
    print("="*70)
    print("ESMA HTML ADAPTER VALIDATION — FIRST ATTEMPT")
    print("="*70)
    print(f"Source: {source_code} — {config['name']}")
    print(f"Feed format: {config['feed_format']}")
    print(f"Start: {datetime.now().isoformat()}")
    
    # Fetch
    print("\n[1/7] Fetching via HTML adapter...")
    try:
        documents, access_status, fetch_method = fetch_source_publications(config, max_items=10)
        results["documents_fetched"] = len(documents)
        if access_status == "blocked":
            results["pipeline_state"] = BLOCKED; results["first_attempt_config_only"] = "FAIL"
            results["errors"].append("access_blocked"); print("  BLOCKED")
            results["pipeline_runtime_seconds"] = round(time.time() - run_start, 2); return results
        if not documents:
            results["pipeline_state"] = FAILED; results["first_attempt_config_only"] = "FAIL"
            results["errors"].append("no_documents"); print("  No documents")
            results["pipeline_runtime_seconds"] = round(time.time() - run_start, 2); return results
        print(f"  ✓ {len(documents)} docs via {fetch_method}")
        # Check dates
        for d in documents:
            if d.published_at:
                results["document_dates_found"] += 1
            else:
                results["document_dates_empty"] += 1
        print(f"  Dates: {results['document_dates_found']} found, {results['document_dates_empty']} empty")
    except Exception as e:
        results["errors"].append(f"fetch_error: {e}"); results["first_attempt_config_only"] = "FAIL"
        results["pipeline_runtime_seconds"] = round(time.time() - run_start, 2); return results
    
    # Normalize
    print("[2/7] Normalizing...")
    documents = normalize_documents_v2(documents, config.get("content_keywords", []))
    normalized = [d for d in documents if d.normalization_status == "normalized"]
    results["documents_normalized"] = len(normalized)
    if not normalized:
        results["pipeline_state"] = "DOCUMENTED"; results["first_attempt_config_only"] = "FAIL"
        results["errors"].append("normalization_failed")
        results["pipeline_runtime_seconds"] = round(time.time() - run_start, 2); return results
    print(f"  ✓ {len(normalized)} normalized")
    
    # Extract
    print("[3/7] Extracting facts...")
    all_facts = []
    for doc in normalized:
        facts = extract_facts_multi_category(doc, config)
        facts = deduplicate_facts(facts)
        facts = deduplicate_primary_facts(facts)
        all_facts.extend(facts)
    results["facts"] = len(all_facts)
    print(f"  → {len(all_facts)} facts")
    
    # Events
    print("[4/7] Detecting events...")
    events = []
    doc_with_facts = {}
    for doc in normalized:
        doc_facts = [f for f in all_facts if f.document_id == doc.id]
        if doc_facts:
            event = detect_event(facts=doc_facts, source_code=source_code, document_id=doc.id,
                                document_title=doc.title, published_at=doc.published_at,
                                configured_event_type=config["event_type"])
            if event:
                events.append(event)
                doc_with_facts[doc.id] = (doc, doc_facts)
    results["events"] = len(events)
    print(f"  → {len(events)} events")
    
    if not all_facts:
        results["pipeline_state"] = "DOCUMENTED"; results["first_attempt_config_only"] = "FAIL"
        results["pipeline_runtime_seconds"] = round(time.time() - run_start, 2); return results
    
    # Evidence + Provenance
    print("[5/7] Evidence + Provenance...")
    all_evidence = []; doc_evidence = {}; all_chains = []; doc_chains = {}
    for doc_id, (doc, doc_facts) in doc_with_facts.items():
        ev = build_evidence_for_facts(doc_facts, doc, config)
        all_evidence.extend(ev); doc_evidence[doc_id] = ev
        chains = build_provenance_chains(doc_facts, doc, ev, config)
        all_chains.extend(chains); doc_chains[doc_id] = chains
    results["evidence_chains"] = len(all_chains)
    results["provenance_verified"] = verify_provenance(all_chains) if all_chains else False
    results["provenance_percent"] = 100 if results["provenance_verified"] else 0
    print(f"  → {len(all_chains)} chains, verified={results['provenance_verified']}")
    
    # IOs
    print("[6/7] Generating IOs...")
    intelligence_objects = []
    for doc_id, (doc, doc_facts) in doc_with_facts.items():
        doc_events = [e for e in events if e.document_id == doc_id]
        event = doc_events[0] if doc_events else None
        if not event: continue
        io = generate_intelligence_object(document=doc, facts=doc_facts, event=event,
                                         evidence_list=doc_evidence.get(doc_id, []),
                                         provenance_chains=doc_chains.get(doc_id, []),
                                         source_config=config)
        if io: intelligence_objects.append(io)
    results["ios"] = len(intelligence_objects)
    good_ios = [io for io in intelligence_objects if io.provenance_complete and io.confidence >= 0.7]
    results["publishable"] = len(good_ios)
    if good_ios:
        results["pipeline_state"] = PUBLISHABLE; results["first_attempt_config_only"] = "PASS"
    else:
        results["pipeline_state"] = "GOVERNED"; results["first_attempt_config_only"] = "FAIL"
    print(f"  → {len(intelligence_objects)} IOs ({len(good_ios)} publishable)")
    
    if intelligence_objects:
        os.makedirs(os.path.join(OUTPUT_DIR, source_code), exist_ok=True)
        for i, io in enumerate(intelligence_objects):
            save_io_to_json(io, os.path.join(OUTPUT_DIR, source_code, f"io_{i+1}.json"))
            save_readable_output(io, os.path.join(OUTPUT_DIR, source_code, f"io_{i+1}.txt"))
        for io in intelligence_objects[:5]:
            results["io_samples"].append({"headline": io.headline, "summary": io.summary[:200],
                "confidence": io.confidence, "key_facts_count": len(io.key_facts),
                "provenance_complete": io.provenance_complete, "document_date": io.document_date})
    
    # Reproducibility
    print("[7/7] Reproducibility...")
    if doc_with_facts and all_facts:
        first_doc_id = list(doc_with_facts.keys())[0]
        first_doc, first_facts = doc_with_facts[first_doc_id]
        re_facts = extract_facts_multi_category(first_doc, config)
        re_facts = deduplicate_facts(re_facts)
        re_facts = deduplicate_primary_facts(re_facts)
        if set((f.metric, f.value, f.paragraph_index) for f in first_facts) == set((f.metric, f.value, f.paragraph_index) for f in re_facts):
            results["reproducibility"] = "PASS"; print("  ✓ PASS")
    
    results["pipeline_runtime_seconds"] = round(time.time() - run_start, 2)
    return results

if __name__ == "__main__":
    results = run()
    print("\n" + "="*70)
    print("FIRST ATTEMPT RESULTS")
    print("="*70)
    for k in ["source","source_class","feed_format","first_attempt_config_only","core_intervention",
              "source_specific_code","iterations","human_config_time_minutes","pipeline_runtime_seconds",
              "documents_fetched","documents_normalized","facts","events","evidence_chains",
              "ios","publishable","provenance_percent","reproducibility","semantic_errors",
              "pipeline_state","document_dates_found","document_dates_empty"]:
        print(f"  {k}: {results.get(k)}")
    if results.get("io_samples"):
        print("\n=== IO SAMPLES ===")
        for i, s in enumerate(results["io_samples"][:3]):
            print(f"  IO {i+1}: {s['headline']}")
            print(f"    summary: {s['summary'][:150]}")
            print(f"    confidence: {s['confidence']}, facts: {s['key_facts_count']}")
            print(f"    provenance_complete: {s['provenance_complete']}, document_date: {s.get('document_date','')!r}")
    with open(os.path.join(OUTPUT_DIR, "esma_html_attempt_results.json"), "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nResults saved")
