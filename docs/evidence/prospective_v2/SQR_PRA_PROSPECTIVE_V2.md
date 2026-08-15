# Source Qualification Record — PRA (Prospective v2)

**Source**: Prudential Regulation Authority (PRA), Bank of England
**Date**: 2026-08-15
**Base**: Pre-Screening Methodology v2 (FROZEN — `bda3ffb`), SQR Template v2 (FROZEN — `a62ad65`)

---

## Prediction (frozen): UNKNOWN

---

## Gate 1 — Access: PASS
RSS at `https://www.bankofengland.co.uk/rss/prudential-regulation-publications` — HTTP 200, 50 items, 23 KB.

## Gate 2 — Provenance: PASS
RSS `<pubDate>` present (e.g., "Thu, 06 Aug 2026 10:00:00 +0100") — RFC 822 with timezone.

## Gate 3 — Content: PASS
Static HTML, 8,131 chars text per article. No JS rendering required.

## Gate 4 — Pattern Category: PASS
`regulatory_patterns` candidate (financial regulator class; analogs: SEC, FCA, BaFin).

## Content-Path Alignment: NOT ALIGNED
- Selected path: RSS feed `/rss/prudential-regulation-publications`
- Expected intelligence: regulatory enforcement (penalties, defendants, violations)
- Sampled: 3 articles (captive insurance roundtable, regulatory digest, Solvency UK policy statement)
- Observed: general prudential regulation publications (roundtables, digests, policy statements, consultations)
- Enforcement keyword matches are from navigation menu text ("approach to enforcement"), not actual enforcement content
- No monetary penalties, no defendant names, no violation types found in sampled content
- **NOT ALIGNED** — RSS contains regulatory publications, not enforcement actions

## Configuration Contract: NOT ASSESSED (Content-Path NOT ALIGNED)
## Semantic Representation: NOT ASSESSED
## QUALIFICATION_READY: NO (Content-Path NOT ALIGNED)
## Gate 5: NOT ATTEMPTED

## Routing: CONTENT-PATH REVIEW
## Root cause: RSS feed contains general prudential publications, not enforcement orders. PRA enforcement actions may be on a different path.
## Engineering: None
