# Capability Hardening Audit

## Scope

This record covers the complete capability list requested for the final Specanic release. It separates deterministic procurement controls from external-provider checks and preserves the project’s simulated-purchase boundary.

| Capability | Verified implementation and evidence | Audit outcome |
| --- | --- | --- |
| Irrelevant request rejection | `brief-parser.ts` rejects missing procurement intent, unsafe overrides, and clearly non-purchasable content; parser regression covers `I want a joke under ₹500 each.` | Hardened during this audit. |
| Vendor confirmation and counter-offer | `generic-vendor-flow.ts` requires acceptance, supports rejection, and re-evaluates authority after counter-offers; generic-flow and workspace-interaction regressions cover the hold. | Verified. |
| All-candidates comparison | `GenericProcurementWorkspace.tsx` retains ranked Vendor A/B candidates, policy state, decision reason, and zero-catalog explanation; rendered and interaction tests cover both candidate and no-catalog states. | Verified. |
| Finance handoff and exports | `finance-handoff.ts` and the multi-item workspace produce an auditable simulated handoff and client-side JSON/CSV decision packages without payments; domain and interaction tests cover it. | Verified. |
| Curated demos | Laptop, mobile, furniture, and tyre fixtures use explicit requirement profiles and labelled deterministic Vendor A/B provenance. | Verified. |
| Secure NLP and graceful degradation | Consent controls precede the real extraction path. Gemini structured extraction, prompt-injection blocking, deterministic fallback, and 429 handling are covered by server regressions. A bounded live extraction returned `source: gemini` and `productCategory: laptop`. | Verified. |
| Live marketplace cards | Server-side SerpAPI normalizes in-app product cards. The timeout is bounded at 25 seconds; a transient laptop fallback retried successfully, and current laptop, mobile, furniture, and tyre checks returned live cards or retained explicit fallback behavior. | Verified with truthful provider fallback. |
| On-demand specifications | Firecrawl runs only through the explicit product-card action. Unit and interaction regressions prove no initial scrape; a bounded live enrichment returned `status: live`, `profile: laptop`, and a sourced Processor field. | Verified. |
| Presentation | `rockathon_final_round_deck/slide_state.json` records 10 edited slides covering workflow, evidence, comparison, confirmation, unavailable vendor, curated demos, finance handoff, and walkthrough. | Verified. |
| Responsive UI | Desktop and mobile visual checks cover intake, laptop challenge, multi-item finance handoff, and tyre confirmation. The comparison table intentionally scrolls horizontally on narrow screens rather than hiding evidence. | Verified. |

## Safety Boundaries

Every vendor, finance-handoff, approval, and order outcome is simulated. Marketplace cards remain comparison candidates, not a purchase authority or a verified commercial offer. Local Vendor A/B records are visibly deterministic and never presented as live market data. When a provider is unavailable, the UI preserves the applicable safe state rather than inventing products or relaxing policy.

## Current Verification Set

The audit is completed against the full Vitest suite, TypeScript validation, production build, desktop/mobile visual checks, a live Gemini structured-extraction call, live SerpAPI product-card checks, and an explicit live Firecrawl enrichment call. Final counts are refreshed in `QA_REPORT.md` after the complete post-audit suite is rerun.
