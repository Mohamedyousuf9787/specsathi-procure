# Architecture Decisions

## DEC-001 — Local-first static P0

**Decision:** Build P0 as a React/Vite/TypeScript static frontend with local TypeScript fixtures and browser-session state.

**Rationale:** The Grand Finale must succeed without the internet, external providers, retailer credentials, a database, payments, or user accounts. A static application is the smallest safe implementation for the core control loop.

**Consequences:** Optional hosted LLM and live-search providers remain disabled and are not exposed in browser code. If they are later required, the project must add a secure server-side integration rather than placing keys in the client.

## DEC-002 — Deterministic controls own consequential outcomes

**Decision:** Currency, quantities, hard constraints, authorization, workflow transitions, final term re-checks, mock orders, and audit events are deterministic TypeScript logic.

**Rationale:** These outcomes must be repeatable, testable, and trustworthy during an offline demo. An LLM may later assist parsing or explanation only.

## DEC-003 — One source of UI truth

**Decision:** The working page owns the session state and derives all rendering from the procurement batch, item states, and audit events.

**Rationale:** The UI needs no database or global store for a resettable local demo. This keeps the state flow inspectable and avoids speculative dependencies.

## DEC-004 — Calm operational paper visual system

**Decision:** Implement the uploaded design specification as a Notion-inspired warm-paper, single-blue-accent, evidence-first dashboard.

**Rationale:** The visual system makes high-stakes procurement readable without resorting to generic admin-panel chrome.
