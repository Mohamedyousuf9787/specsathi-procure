---
type: checkpoint
id: CP-011
phase: phase-11-generalization-baseline
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-11-generalization-baseline]]"
  - "[[01-current-state]]"
  - "[[artifacts/screenshots/migration-baseline-workspace]]"
---

# Checkpoint CP-011 — Pre-migration baseline

## Verified behavior

The existing local onboarding demo loads eight laptop stands, eight office chairs, and eight external monitors. Stand and chair offers auto-purchase. The ₹23,200 monitor recommendation pauses at a ₹3,200 per-unit overage and cannot create an order without explicit approval and final-term confirmation.

## Commands

`pnpm vitest run`, `pnpm check`, and `pnpm build` passed on 2026-08-21. The desktop workspace visual baseline was captured at 1440×1000.

## Preservation warning

No laptop scenario exists in the baseline despite the migration prompt’s assumed starting point. Generalization must introduce—not overwrite—the laptop-focused demonstration.

## Resume from here

Read `docs/MIGRATION_BASELINE.md`, preserve the current domain test file, and implement generic abstractions behind compatibility adapters. Roll back to the pre-migration web checkpoint if a baseline safety test fails.
