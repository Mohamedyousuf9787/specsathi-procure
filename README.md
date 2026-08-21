# SpecSathi Procure

SpecSathi Procure is a **category-agnostic, offline-first procurement-control desk** with a polished laptop demonstration. A user provides a natural-language buying brief; the application normalizes product, quantity, requirements, budget, delivery, and authorization; compares local Vendor A and Vendor B evidence; acts only within policy; pauses at a human authorization boundary; performs a final confirmation check; creates a simulated order; and records every material event.

## Local startup

The release has no required API key, account, database, payment, or network dependency.

```bash
pnpm install
pnpm dev
```

Open the Vite URL. The initial page is the generic buying-brief control record. Use **Load laptop demo** for the primary presentation path, or **Load multi-item demo** for the preserved compatibility scenario.

## Quality commands

```bash
pnpm vitest run
pnpm check
pnpm build
```

The migration suite has 21 tests across the legacy policy engine, generic contracts, parser/validator, and local Vendor A/Vendor B flow. The laptop, chair, monitor, unknown-printer, approval rejection, changed-term, unavailable-vendor, and original multi-item scenarios are covered.

## Demo paths

| Path | Start action | Expected outcome |
|---|---|---|
| Laptop-focused demo | **Load laptop demo** | Ten 16 GB/512 GB laptops are searched across Vendor A and Vendor B, then auto-purchased within the ₹45,000 authority. |
| Generic secondary proof | Enter `Buy 20 ergonomic chairs with adjustable height under ₹10,000 each within 5 days.` | Two local chair offers are compared and the compliant Vendor A offer proceeds automatically. |
| Unknown-category safety | Enter `Find 5 office printers with duplex printing under ₹75,000 total.` | Both local sources are searched; no catalog is invented; the workflow blocks with a readable reason. |
| Compatibility demo | **Load multi-item demo** | The original stand/chair/monitor onboarding flow remains intact, including the monitor approval boundary. |

## Safety boundaries

Every order is explicitly **SIMULATED PURCHASE — NO REAL PAYMENT**. Vendor records are local simulated data. The application never signs in to retailers, checks out, charges a card, stores payment details, or exposes provider keys. Deterministic code owns constraints, budgets, quantities, delivery, authorization, confirmation, mock orders, and audit events. LLM and live-search integrations remain disabled and are not needed for Demo Mode.

## Project records

The build and migration records are in `docs/`; the recoverable Obsidian-compatible context is in `context/`. Start a presentation with `docs/DEMO_RUNBOOK.md`; see `docs/MIGRATION_REPORT.md` for the full migration result and `docs/QA_REPORT.md` for verification details.
