# SpecSathi Procure

SpecSathi Procure is an offline-first procurement-control dashboard for the Rockathon’26 Round 2 demonstration. It proves a safe, complete workflow: a buying brief becomes structured constraints; the agent compares two simulated vendor sources; compliant actions proceed automatically; an over-limit recommendation pauses for explicit human approval; final terms are re-checked; and every material event is recorded in an audit thread.

## Local startup

The P0 release has no required API keys, database, account, or network dependency.

```bash
pnpm install
pnpm dev
```

Open the local address printed by Vite. The intended presentation path is the **Load golden scenario → Review constraints → Start procurement** flow.

## Quality commands

```bash
pnpm vitest run
pnpm check
pnpm build
```

The unit suite proves the core policy controls: two compliant items complete, the ₹23,200 monitor requires approval against its ₹20,000 per-unit authority, rejection creates no order, unavailable-vendor data is re-ranked, no-match data is blocked, and changed vendor terms return to approval.

## Demo path

The golden scenario purchases eight laptop stands and eight office chairs automatically. It then recommends a compliant 27-inch QHD monitor that costs ₹23,200 per unit. Because the authorization limit is ₹20,000 per unit, the agent pauses before purchase. The `Approve exception` control creates an approval event, repeats the vendor-term check, then creates a **simulated** order record.

Use the controls in the left batch rail to demonstrate a selected-vendor outage, no compliant monitor, or changed vendor terms. The `Reset session` control returns the application to the initial buying-brief screen.

## Safety boundaries

This project intentionally uses local Vendor A and Vendor B fixtures. It does not access retailer accounts, payments, real checkout flows, or external APIs. Every order panel is explicitly labeled **SIMULATED PURCHASE — NO REAL PAYMENT**. Optional LLM and live-search capabilities are intentionally deferred until the core local workflow has been approved and can be protected by a server-side integration.

## Project records

The implementation record is in `docs/`. The recoverable agent context and phase checkpoints are in `context/`. The exact presentation flow is maintained in `docs/DEMO_RUNBOOK.md`.
