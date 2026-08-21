---
type: error
id: ERR-012
status: resolved
severity: low
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-13-validator-and-parser]]"
  - "[[agents/AGENT-MIGRATION-QA]]"
---

# ERR-012 — Printer category normalization expectation

## Symptom

The new parser test expected `office-printers`, but the deterministic extractor intentionally recognizes `printer` as the canonical generic category.

## Root cause

The test asserted an over-specific label rather than the parser’s valid canonical category.

## Fix and verification

The assertion now expects `printer`. This category remains unknown to the local catalog and therefore will exercise the required no-match fallback in the vendor-flow phase. The full parser and regression suite must pass after this correction.

## Prevention

Parser tests should assert canonical semantic categories, not incidental source phrasing, unless the source phrase is itself a required hard requirement.
