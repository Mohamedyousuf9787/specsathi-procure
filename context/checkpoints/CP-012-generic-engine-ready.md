---
type: checkpoint
id: CP-012
phase: phase-14-generic-vendor-flow
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-13-validator-and-parser]]"
  - "[[phases/phase-14-generic-vendor-flow]]"
  - "[[checkpoints/CP-011-laptop-baseline]]"
  - "[[errors/ERR-012-printer-category-expectation]]"
---

# Checkpoint CP-012 — Generic Engine Ready

## Changed modules

- `client/src/domain/generic-procurement.ts`
- `client/src/domain/brief-parser.ts`
- `client/src/domain/generic-vendor-flow.ts`
- Their companion Vitest files.

## Verified outcomes

The full suite has 20 passing tests. The original six legacy tests remain green. Generic tests cover laptop auto-purchase and approval, chair and monitor auto-purchase, printer no-match, missing budget clarification, conflicting budget invalidation, unrelated input rejection, and changed-term re-escalation. TypeScript and the production build pass.

## Resume from here

Connect the generic engine to a single natural-language intake path. Provide `Load laptop demo` and `Load multi-item demo` actions, but do not create mandatory product tabs or enable external providers.
