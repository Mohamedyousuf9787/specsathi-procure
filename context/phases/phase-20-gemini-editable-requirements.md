---
type: phase
id: phase-20-gemini-editable-requirements
status: complete
created: 2026-08-21
updated: 2026-08-21
---

# Phase 20 — Gemini and Editable Requirements

The user-supplied Gemini secret passed its server-side health test. `nlp.extractBrief` now calls Gemini 3.5 Flash Lite with JSON-mode output, validates with Zod, normalizes aliases, and retains prompt-injection, timeout, rate-limit, and local-parser fallback behavior. Ordinary-language requests land in `EditableRequirementReview`, where category, quantity, budgets, delivery, authority, and individual requirements are user-controlled before any product search.
