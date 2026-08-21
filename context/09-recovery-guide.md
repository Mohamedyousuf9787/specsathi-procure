---
type: recovery-guide
id: CTX-009
phase: phase-01-foundation
status: active
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[01-current-state]]"
---

# Recovery Guide

If interrupted, read [[01-current-state]], [[checkpoints/CP-014-generalization-release]], and `docs/MIGRATION_REPORT.md`; then run `pnpm vitest run`, `pnpm check`, and `pnpm build`. Keep Demo Mode enabled and use the local Vendor A/Vendor B provider. Do not introduce credentials or replace local fallback behavior before the regression matrix passes again.
