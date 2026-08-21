---
type: checkpoint
id: CP-015
phase: phase-18-live-vendor-search
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-17-real-nlp]]"
  - "[[phases/phase-18-live-vendor-search]]"
---

# Checkpoint CP-015 — Real NLP and Live Evidence

Specanic now has a server-side, opt-in real NLP route with strict schema and deterministic fallback, plus authenticated server-side Tavily evidence search. The live model and Tavily endpoints were exercised successfully. External snippets remain evidence only; local deterministic offers retain control of compliance, policy, confirmation, and mock purchase outcomes. Twenty-five unit tests cover the unified server/client application before the live evidence adapter’s health test is added to the final full suite.

The final verification suite contains 28 tests. Corrected provider enablement order: adapter + normalization test, credential reprovisioning + authenticated health test, fallback regression, then workspace enablement.

The final persistence step added `provider_audit_events` through a reviewed non-destructive schema migration. The final suite contains 29 tests, including metadata privacy bounds. The managed desktop review confirms the opt-in consent and fallback copy are visible.
