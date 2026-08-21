# Fast Product Details and Procurement-Control Statements

## Fast product details

Initial marketplace cards must render as soon as product search returns. They use only safe, bounded fields already available in the marketplace response: product title, structured result extensions, merchant, price, availability, delivery, rating, and original product URL. A category profile extracts concise values from the title and extensions only. It rejects URLs, long prose, and unrecognized values.

| Profile | Immediate card fields | Page verification fields |
|---|---|---|
| Laptop | RAM, storage, processor family, graphics model, display cue | Full processor, RAM generation, storage configuration, GPU, display, operating system |
| Motorcycle | Engine displacement, mileage cue, fuel-tank capacity, braking cue | Engine, mileage, fuel tank, power, torque, transmission, brakes, kerb weight |
| Generic | Bounded capacity or material cue when present | Profile-defined details only when a product page provides them |

## On-demand page verification

Firecrawl is no longer called automatically for every marketplace card. A requester selects **Verify full specifications** on one product card when they need deeper detail. The card alone enters a loading state; all other cards remain usable. Failed or contradictory page data remains explicit and never changes price, availability, eligibility, authorization, or simulated-purchase state.

## Requester policy agreement

Before product search, the requester must affirm a statement covering the confirmed product category, quantity, price ceiling, delivery target, and authority cap. The acknowledgement states that marketplace cards are comparison candidates rather than an order, payment authorization, or verified offer. The local audit thread records the agreement event before product discovery begins.

## Vendor offer statement

Each marketplace card carries a **Normalized vendor offer statement**, not a claim that the vendor has signed or attested to terms. It presents the reported merchant, quoted price, availability, delivery text, original source link, evidence completeness, policy state, and outstanding verification needs. The statement makes clear that stock, seller identity, delivery, return terms, and variant matching may still require verification.
