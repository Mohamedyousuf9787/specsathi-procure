---
type: checkpoint
id: CP-018
phase: card-first-product-results
status: complete
created: 2026-08-21
updated: 2026-08-21
---

# Checkpoint CP-018 — Card-First Product Results

SpecSathi now presents automatic marketplace product cards as the first procurement-workspace outcome. The cards show product title, merchant, price, availability, delivery, rating when supplied, evidence completeness, a direct product-source link, and deterministic `Eligible`, `Approval needed`, `Blocked`, or `Unverified` status. A primary policy summary makes the state counts immediately visible.

Live web links are now deliberately collapsed under **Supporting sources only**, so they cannot be mistaken for the primary result or treated as vendor offers. A visible policy legend explains every card status. Product-search loading, no-result, and provider-fallback states state the safe next action, while the local Vendor A/B route remains available. Regression coverage enforces that supporting evidence is secondary and closed by default. The release passed 44 tests across 18 files, TypeScript, production build, and desktop/mobile visual verification.
