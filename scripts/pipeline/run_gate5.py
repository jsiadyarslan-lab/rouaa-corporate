#!/usr/bin/env python3
"""
Gate 5 Validation Runner — runs pipeline for a single Gate 5 source and saves results.
Usage: python run_gate5.py <source_code>
"""
import sys
import os
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from source_configs import SOURCES
from run_pipeline import run_pipeline_for_source

OUTPUT_DIR = Path("/home/z/my-project/scripts/pipeline/output/gate5")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def run_gate5(source_code: str):
    """Run Gate 5 validation for a single source."""
    if source_code not in SOURCES:
        print(f"ERROR: Source '{source_code}' not found in SOURCES")
        print(f"Available: {sorted(SOURCES.keys())}")
        return None

    config = SOURCES[source_code]
    print(f"\n{'='*60}")
    print(f"Gate 5 Validation: {source_code} — {config['name']}")
    print(f"{'='*60}")

    # Run pipeline
    results = run_pipeline_for_source(source_code)

    # Add metadata
    results["gate5_metadata"] = {
        "source_code": source_code,
        "source_name": config["name"],
        "source_type": config["type"],
        "feed_url": config.get("feedUrl", ""),
        "feed_format": config.get("feed_format", "rss"),
        "has_rate_patterns": bool(config.get("rate_patterns")),
        "has_regulatory_patterns": bool(config.get("regulatory_patterns")),
        "has_statistical_patterns": bool(config.get("statistical_patterns")),
        "has_earnings_patterns": bool(config.get("earnings_patterns")),
        "has_role_patterns": bool(config.get("role_patterns")),
        "content_keywords": config.get("content_keywords", []),
        "event_type": config.get("event_type", ""),
        "run_timestamp": datetime.utcnow().isoformat() + "Z",
        "queue_version": "V1.1 (001d349)",
        "prescreening_commit": "4443553",
    }

    # Save results
    output_file = OUTPUT_DIR / f"gate5_{source_code}_results.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n{'='*60}")
    print(f"Results saved to: {output_file}")
    print(f"{'='*60}")

    # Print summary
    m = results.get("metrics", {})
    print(f"\n--- Gate 5 Summary for {source_code} ---")
    print(f"  Pipeline state:       {results.get('pipeline_state', 'N/A')}")
    print(f"  Failure reason:      {results.get('failure_reason', 'none')}")
    print(f"  Access status:        {results.get('access_status', 'N/A')}")
    print(f"  Fetch method:         {results.get('fetch_method', 'N/A')}")
    print(f"  Documents fetched:    {results.get('documents_fetched', 0)}")
    print(f"  Documents normalized: {results.get('documents_normalized', 0)}")
    print(f"  Facts extracted:     {results.get('facts_extracted', 0)}")
    print(f"  Events detected:     {results.get('events_detected', 0)}")
    print(f"  Evidence records:    {results.get('evidence_records', 0)}")
    print(f"  Provenance chains:   {results.get('provenance_chains', 0)}")
    print(f"  Intelligence objects: {results.get('intelligence_objects', 0)}")
    print(f"  Output quality:       {m.get('output_quality', 'N/A')}")
    print(f"  Source-specific code: {m.get('source_specific_code', 0)}")
    print(f"  Reproducible:         {m.get('reproducible', False)}")

    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_gate5.py <source_code>")
        print(f"Available Gate 5 sources: US_TREASURY")
        sys.exit(1)

    source_code = sys.argv[1]
    run_gate5(source_code)
