---
type: checkpoint
id: CP-020
phase: streamlined-product-control
status: complete
created: 2026-08-21
updated: 2026-08-21
---

# Checkpoint CP-020 — Fast Product Details and Control Statements

The initial marketplace comparison no longer waits for Firecrawl to scrape every product URL. Search results render immediately with concise category-aware details derived only from the bounded marketplace title and extension fields. Link-like, lengthy, or unrecognized values are discarded rather than shown as specifications.

Each requester must now acknowledge a **Policy agreement** before search. The agreement records their confirmed requirement, price, delivery, and authority boundaries while stating that marketplace cards are not an order, payment authorization, or verified offer. Each product card now includes a **Normalized vendor offer statement** that distinguishes reported merchant, price, stock, delivery, evidence completeness, and verification work still outstanding.

Full product-page extraction is now an explicit **Verify full specifications** action on one card. It changes only that card’s loading, success, unavailable, or conflict state; it does not block initial comparison and never changes policy status. A DOM interaction regression enforces that initial marketplace-card rendering invokes no page verification and that only an explicit card action invokes the verification callback.

For the challenge laptop scenario, the visible Laptop demo action now exercises the same production provider-failure fallback resolver used by the Home product-search flow. Provider-error and empty-live-result laptop paths resolve four clearly labelled pre-built Vendor A/B template cards rather than an error. Atlas Business 14 is visibly marked as the best fit for the confirmed demo requirements; non-fitting alternatives remain blocked. The recorded policy agreement is visible above the cards, and each card has a normalized vendor statement with explicit demonstration-data provenance. A DOM interaction test also completes the ordinary Home brief, policy agreement, product-search initiation, provider error, and deterministic card render without the demo route. The release passed 68 tests across 24 files, TypeScript, production build, and real-route desktop/mobile visual review.
