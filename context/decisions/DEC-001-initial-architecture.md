---
type: decision
id: DEC-001
status: accepted
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[05-architecture-map]]"
  - "[[phases/phase-01-foundation]]"
---

# DEC-001 — Local deterministic demo architecture

Use a static React application with local fixtures, deterministic rules, per-item state, local mock confirmation, and chronological audit evidence. Skip external providers, databases, payments, and authentication for P0. This choice maximizes offline reliability and aligns with Ponytail's minimum-sufficient implementation rule.
