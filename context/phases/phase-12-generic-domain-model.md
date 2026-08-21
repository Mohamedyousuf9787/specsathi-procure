---
type: phase
id: phase-12-generic-domain-model
status: planned
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-11-generalization-baseline]]"
  - "[[decisions/DEC-011-generic-procurement-schema]]"
---

# Phase 12 — Generic Domain Model

Introduce `BuyingBrief`, normalized `Requirement`, generic `VendorOffer`, optional `CategoryProfile`, and a compatibility adapter for existing scenario fixtures. Do not change recommendation semantics until the legacy regression tests still pass through the adapter.
