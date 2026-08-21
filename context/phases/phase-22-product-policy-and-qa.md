---
type: phase
id: phase-22-product-policy-and-qa
status: complete
created: 2026-08-21
updated: 2026-08-21
---

# Phase 22 — Product Policy and QA

Server normalization maps every card to `eligible`, `approval_needed`, `blocked`, or `unverified`. Complete marketplace evidence includes merchant, price, source URL, and availability; missing fields remain unverified. Unavailable or over-ceiling products are blocked, while products above authority but within the ceiling require approval. The in-app cards visibly show availability, delivery, rating, evidence completeness, policy state, and source URL. Gemini and SerpAPI credential health checks, real endpoint smoke tests, 41 regression tests across 16 files, TypeScript, production build, source scan, and runtime response/log secrecy scan passed. Desktop and 390px mobile renders verified the plain-language intake, editable confirmation, explicit search boundary, and all four product-card policy states.
