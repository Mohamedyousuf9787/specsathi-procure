# SpecSathi Procure — Implementation Plan

## Goal

Deliver a polished, offline-capable procurement-control web application that proves autonomous action within authorization, explicit human approval at policy boundaries, and complete auditability.

| Phase | Status | Scope | Gate |
|---|---|---|---|
| 00 — Discovery | Complete | Requirements, design, skill, and offline-first architecture reconciled. | User approved the minimal web-static build. |
| 01 — Foundation | Complete | Records, project shell, design tokens, reset baseline, and local runtime defaults. | App starts and shows Demo Mode. |
| 02 — Domain data | Complete | Typed local fixtures for two vendors, golden scenario, and deterministic edge cases. | Data loads and validates. |
| 03 — Procurement engine | Complete | Constraints, scoring, recommendation, policy, confirmation guard, and audit functions. | Golden harness produces expected outcomes. |
| 04 — State and approval | Complete | Independent item states, valid transitions, approval/rejection, final re-check. | No unauthorized order can be created. |
| 05 — Core UI | Complete | Intake, preview, workspace, comparison, approval, confirmation, and audit dashboard. | Happy path is understandable without narration. |
| 06 — Edge cases | Complete | Unavailable vendor, no-match, partial quantity, changed terms, and reset. | Failures are safe, visible, and audited. |
| 07 — Optional providers | Deferred | One LLM parser or one live-search adapter only after P0 is stable. | Demo Mode remains identical when disabled. |
| 08 — QA and demo | Planned | Automated checks, accessibility, offline rehearsal, runbook, and QA report. | Five clean rehearsals pass. |

## Current phase

**Phase 08 — QA and demo.** The workflow is implemented and visually verified at desktop and mobile sizes. Final test, build, documentation, and offline-readiness checks remain.
