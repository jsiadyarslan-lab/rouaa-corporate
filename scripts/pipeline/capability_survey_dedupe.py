#!/usr/bin/env python3
"""Deduplicate survey_data.jsonl keeping the latest entry per institution."""
import json
from pathlib import Path

JSONL_FILE = Path("/home/z/my-project/rouaa-corporate/docs/evidence/capability_survey/survey_data.jsonl")

entries = []
with open(JSONL_FILE) as f:
    for line in f:
        try:
            entries.append(json.loads(line))
        except:
            pass

print(f"Total entries: {len(entries)}")

# Keep latest entry per institution (later entries overwrite earlier)
by_institution = {}
for e in entries:
    by_institution[e["institution"]] = e

deduped = list(by_institution.values())
deduped.sort(key=lambda x: x["index"])

print(f"After dedup: {len(deduped)}")

# Write back
with open(JSONL_FILE, "w") as f:
    for e in deduped:
        f.write(json.dumps(e, indent=None, ensure_ascii=False) + "\n")

print(f"Deduplicated JSONL written.")

# Print summary
print("\n--- ALL 32 SOURCES ---")
for r in deduped:
    print(f"  [{r['index']:2}/32] [{r['stratum']}] {r['institution'][:45]:45s} → {r['rendering_classification']} (static={r['static_document_url_count']}, lang={r['primary_language']}, en={r['english_version_available']})")
