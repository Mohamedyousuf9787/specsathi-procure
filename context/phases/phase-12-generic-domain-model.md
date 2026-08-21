---
type: phase
id: phase-12-generic-domain-model
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-11-generalization-baseline]]"
  - "[[decisions/DEC-011-generic-procurement-schema]]"
---

# Phase 12 — Generic Domain Model

`client/src/domain/generic-procurement.ts` now defines generic contracts, a laptop profile, generic fallback, normalized legacy adapters, and a laptop demo brief. The legacy engine and UI remain unchanged. The full suite has nine passing tests; typecheck and production build pass.
