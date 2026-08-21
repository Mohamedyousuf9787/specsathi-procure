---
type: phase
id: phase-04-state-machine
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[05-architecture-map]]"
---

# Phase 04 — State Machine

The monitor requires an explicit `PENDING_APPROVAL → APPROVED → CONFIRMING → PURCHASED` path. The deterministic transition guard blocks an impossible direct approval-to-purchase transition. Every material action appends an audit event.
