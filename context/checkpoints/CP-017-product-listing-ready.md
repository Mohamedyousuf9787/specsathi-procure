---
type: checkpoint
id: CP-017
phase: phase-22-product-policy-and-qa
status: complete
created: 2026-08-21
updated: 2026-08-21
---

# Checkpoint CP-017 — Product Listing Ready

The user journey now begins with a short natural-language procurement need, optionally extracts requirements with Gemini, presents every material field as editable, and requires a confirmation action before product search. SerpAPI Google Shopping records are displayed inside Specanic with image, title, merchant, rupee price, rating, availability, delivery, source link, evidence completeness, and a deterministic `eligible`, `approval needed`, `blocked`, or `unverified` label. Listing evidence cannot authorize or create an order.

Gemini and SerpAPI keys passed server-only health checks. Both live adapters were exercised. The four-state product policy matrix, editable-requester correction, and mocked Gemini ordinary-language extraction are covered by regression tests. Source and runtime response/log scans found no committed or exposed provider values. The test suite has 41 passing tests across 16 files; TypeScript and production build pass. Desktop and mobile QA captures confirm the editable review and policy-labelled product-listing layouts.
