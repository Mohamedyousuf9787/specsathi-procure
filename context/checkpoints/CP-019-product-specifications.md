---
type: checkpoint
id: CP-019
phase: product-specification-enrichment
status: complete
created: 2026-08-21
updated: 2026-08-21
---

# Checkpoint CP-019 — Evidence-Bound Product Specifications

SpecSathi now enriches automatic marketplace cards with server-side, category-aware product specifications. Laptop cards can show processor, RAM, storage, graphics, display, and operating-system values. Motorcycle cards can show engine displacement, mileage, fuel-tank capacity, power, torque, transmission, braking, and weight. Categories without a dedicated profile use a generic panel.

The enrichment route scrapes only product URLs already returned by marketplace search. Explicit field contracts limit the laptop, motorcycle, and generic profile values that may appear. It uses a primary Firecrawl credential and retries with a fallback credential only for timeout, rate-limit, or upstream-server conditions; non-retryable responses do not invoke fallback. Scraped fields are normalized into a short, source-bound panel. Missing or unparseable values show an explicit unavailable state, while contradictory values are visibly marked as conflicts. Neither state influences marketplace policy labels, authorization, local Vendor A/B comparison, or simulated purchasing.

Primary and fallback credential health checks, retry-boundary, category-profile, conflict, rendered specification-panel tests, full regression, TypeScript, production build, and desktop/mobile visual review passed. The release contains 53 tests across 20 files.
