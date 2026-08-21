---
type: decision
id: DEC-011
status: accepted
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-12-generic-domain-model]]"
  - "[[decisions/DEC-001-initial-architecture]]"
---

# DEC-011 — Generic contracts behind a compatibility bridge

The migration adds a generic domain layer instead of rewriting the proven legacy engine. Generic briefs use normalized requirements; generic offers store product-specific data in attributes; existing stand/chair/monitor fixtures convert through compatibility adapters. This minimizes regression risk and lets the next vendor flow exercise the generic contracts before the old engine is retired.
