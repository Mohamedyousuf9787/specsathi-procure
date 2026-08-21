# Product Specification Enrichment

## Purpose

After a requester confirms a buying brief, Specanic already receives marketplace product URLs with its automatic product cards. The enrichment layer fetches **only those returned product URLs** server-side and displays evidence-bound technical specifications beneath each card. It never invents specifications, treats scraped text as an approved offer, or changes a card’s procurement-policy state.

## Category profiles

| Category profile | Primary specification panel | Typical values shown only when sourced |
|---|---|---|
| Laptop / notebook | Processor, RAM, storage, graphics, display | CPU model, memory capacity, SSD/HDD size, GPU model, screen size, resolution, refresh rate, operating system |
| Motorcycle / bike | Engine, mileage, fuel, braking, dimensions | Displacement, claimed mileage, fuel-tank capacity, power, torque, transmission, brakes, kerb weight, seat height |
| Generic product | Key product details | Brand, model, capacity, dimensions, material, compatibility, warranty, or another clearly sourced product detail |

The profile is chosen from the confirmed procurement category and product title. A category that does not match a dedicated profile uses the generic panel rather than a misleading laptop or motorcycle layout.

## Extraction flow

1. SerpAPI returns up to 12 marketplace cards and original product URLs.
2. The server sends each permissible product URL to Firecrawl’s single-page scrape endpoint using the `markdown` and deterministic `product` formats.
3. An explicit profile field contract limits extraction to category-relevant fields. The laptop contract includes processor, RAM, storage, graphics, display, and operating system; the motorcycle contract includes engine, mileage, fuel tank, power, torque, transmission, brakes, and kerb weight; the generic contract includes model, capacity, dimensions, material, and warranty.
4. A strict profile parser normalizes evidence-bearing text into a short ordered list of `label → value` specifications. Values not found in source material remain absent and are never inferred. Conflicting values for the same field are flagged as **Conflicting source values** rather than silently reconciled.
5. The card receives a **Specifications sourced from product page** panel together with the original source URL. A failed, blocked, or incomplete scrape produces an explicit `Specs unavailable` state without changing marketplace availability, price, eligibility, authority, or local Vendor A/B behavior.

## Provider and cost boundaries

Firecrawl is used only server-side. The primary key is tried first; the fallback key is eligible only for timeout, rate-limit, or upstream-server failures. Non-retryable provider responses do not invoke the fallback key. The browser receives normalized specifications and a source URL, never a provider credential or raw extraction payload.

The implementation limits enrichment to product URLs returned by the automatic marketplace search, caps work at 12 cards per search, restricts concurrent requests to the free-plan safe level, and caches successful URL extractions for a short period. Firecrawl’s current free plan provides 1,000 monthly scrape credits with two concurrent requests; ordinary single-page scrapes cost one credit, while JSON-mode extraction costs extra credits. This design therefore uses product-page scraping rather than web-wide autonomous research. [Firecrawl scrape documentation](https://docs.firecrawl.dev/features/scrape) and [pricing](https://www.firecrawl.dev/pricing) describe these limits.

## Evidence boundary

> A sourced specification explains a product card; it does not verify a purchase term or override procurement policy.

Price, stock, delivery, returns, merchant identity, and authorization remain governed by the existing marketplace-card evidence model and deterministic policy gates. Scraped fields may be stale, incomplete, variant-specific, or unavailable. The interface labels their source and makes missing evidence visible rather than filling gaps with model assumptions.
