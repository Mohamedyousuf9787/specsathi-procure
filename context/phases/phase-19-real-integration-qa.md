---
type: phase
id: phase-19-real-integration-qa
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-17-real-nlp]]"
  - "[[phases/phase-18-live-vendor-search]]"
---

# Phase 19 — Real Integration QA

The built-in LLM catalog was queried before model selection. Real NLP endpoint smoke testing returned `source: llm` and normalized laptop fields. The Tavily key passed a bounded server-side credential health check after provisioning. The real evidence endpoint returned current web records. A mocked provider-timeout regression returned the explicit local fallback. The full eight-file suite has 28 passing tests, including legacy deterministic procurement coverage, server NLP, live-evidence normalization, secret health, and provider failure. TypeScript and production build passed.

The corrected enablement order was recorded and followed for the final verification: adapter and normalization test → credential reprovisioning and health test → fallback regression → enabled workspace evidence display.

Final hardening added authenticated `procurement_audit_events` persistence for the actual generic audit trail, while anonymous sessions explicitly retain local-only audit history. Prompt-injection text is blocked before any NLP call. NLP and live-search rate limiting produce deterministic local fallback rather than degraded procurement decisions. Both audit schemas were queried successfully. The full NLP procedure has a mocked 429 regression and the final suite has 35 passing tests, TypeScript passes, and the production build passes.

The known non-blocking issue is the template’s main-chunk-size build warning. The historical `dotenv` log is pre-install; the current server starts successfully and TypeScript reports no errors.
