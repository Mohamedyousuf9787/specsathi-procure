# Specanic — Rockathon’26 Final Round

## Cover

**Specanic**

**Autonomous procurement control with human-held authorization boundaries**

## Slide 1

### Autonomous buying needs controls, not just recommendations

- Requesters need faster sourcing across online options, but price alone cannot authorize a purchase.
- Procurement decisions must preserve budget, delivery, specification, availability, and approval constraints.
- Specanic turns an ordinary-language brief into an inspectable decision record.

## Slide 2

### The workflow holds exactly where risk begins

- **Record:** Gemini-assisted extraction or deterministic parsing produces an editable requirement record.
- **Compare:** Marketplace cards and deterministic Vendor A/Vendor B evidence are deliberately separated.
- **Control:** Policy scoring decides eligibility; humans retain authority at approval and vendor-confirmation boundaries.

## Slide 3

### Real data is fast; verification remains explicit

- Server-side Google Shopping retrieval creates in-app marketplace product cards.
- Fast category details render immediately from bounded listing fields.
- Full source-page enrichment is a per-card action, never a blocker for initial comparison.
- Provider failure falls back transparently to labelled deterministic Vendor A/Vendor B data.

## Slide 4

### Every candidate remains visible

- The ranked candidate table retains every Vendor A and Vendor B offer.
- Judges can inspect requirement fit, unit price, delivery, seller reliability, return window, policy state, and decision reason.
- Blocked alternatives stay visible; the system never hides a failed constraint or silently relaxes a brief.

## Slide 5

### Vendor confirmation is an active policy boundary

- The selected vendor can be accepted, rejected, or countered on price and delivery.
- A material counter-offer forces deterministic re-evaluation of every candidate.
- If terms cross authority, the workflow pauses for human approval; if terms fail the brief, it blocks safely.

## Slide 6

### Mandatory edge case: the top vendor is unavailable

- The dedicated scenario makes the nominal top-fit Vendor A offer unavailable.
- Specanic records the unavailable evidence, re-ranks the full candidate set, and selects the next eligible Vendor B offer.
- The audit thread records the reason without changing the requester’s requirements.

## Slide 7

### Curated demos broaden the live story without clutter

- **Laptop:** 16 GB RAM, 512 GB SSD, processor, delivery, and authority constraints.
- **Mobile:** 5G, 128 GB storage, battery, budget, and delivery constraints.
- **Furniture:** ergonomic design, adjustable height, lumbar support, budget, and delivery constraints.
- Extra demos are progressively disclosed and always enter through editable confirmation.

## Slide 8

### The multi-item batch ends in an auditable finance package

- The onboarding demo evaluates stands, chairs, and monitors in one policy-controlled batch.
- A simulated finance handoff shows item count, audit count, and confirmed simulated total.
- Local JSON and CSV exports contain decision records only—never a payment instruction or vendor commitment.

## Slide 9

### A live judge walkthrough in four moves

- Submit a plain-language request and correct the extracted requirements.
- Inspect live cards or run the labelled deterministic Vendor A/Vendor B challenge.
- Use the comparison table, then accept, reject, or counter the vendor terms.
- Run the unavailable-vendor demo and finish with the multi-item finance handoff.

