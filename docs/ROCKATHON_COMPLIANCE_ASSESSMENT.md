# Rockathon’26 PS1 Compliance Assessment

## Assessment conclusion

> **SpecSathi Procure now demonstrates the three P0 commerce-control behaviours needed for a defensible final-round core build: a visible all-candidates comparison, an interactive vendor-confirmation/counter-offer boundary, and an explicit unavailable-top-vendor re-ranking scenario.**

The system remains deliberate about its evidence boundary. **Live SerpAPI marketplace cards** are distinct from the clearly labelled deterministic Vendor A/Vendor B challenge data. Every recommendation is policy-scored, every material vendor change is re-evaluated, and all purchases remain simulated with no payment action.

## Requirement inventory and evidence matrix

| Challenge requirement | Status | Product flow | Implementation evidence | Regression evidence |
|---|---|---|---|---|
| Natural-language buying brief with budget, quantity, specifications, delivery, and authorisation constraints | **Satisfied** | A requester enters ordinary language, reviews editable extracted fields, then explicitly accepts the constraint record before search. | `client/src/pages/Home.tsx`; `EditableRequirementReview.tsx`; `server/routers/nlp.ts`; `brief-parser.ts` | `EditableRequirementReview.test.ts`; `server/routers/nlp.test.ts`; `server/routers/nlp.gemini.test.ts`; `brief-parser.test.ts` |
| Online-purchase scope; irrelevant requests are not answered as unrelated chat | **Satisfied** | The intake rejects irrelevant requests and asks for a safe procurement brief. | `client/src/domain/brief-parser.ts` | `client/src/domain/brief-parser.test.ts` covers irrelevant and invalid requests. |
| Discover options from at least two sources; simulated data allowed | **Satisfied for the challenge demonstration** | The deterministic local flow searches Vendor A and Vendor B; live cards remain available through the separate SerpAPI flow. | `LocalDemoVendorProvider` in `generic-vendor-flow.ts`; `server/routers/products.ts` | `generic-vendor-flow.test.ts` verifies both vendor-search events; `server/routers/products.test.ts` verifies marketplace normalization. |
| Compare at least four dimensions and return a ranked recommendation with reasoning | **Satisfied** | The workspace shows every candidate ranked by fit, price, delivery, reliability, returns, policy state, and reason. | `CandidateComparison` and `recommendGenericOffer()` | `GenericProcurementWorkspace.interaction.test.ts`; `generic-vendor-flow.test.ts` |
| Enforce authorisation limit and pause for human approval | **Satisfied** | Over-limit choices pause; approval or rejection is explicit and logged. | `recommendGenericOffer()` and `resolveGenericApproval()` | `generic-vendor-flow.test.ts` verifies pending approval, rejection, and post-approval mock order. |
| Simulate a purchase confirmation; no real payment | **Satisfied** | A final simulated order is recorded only after confirmation or approved exception; the UI states “SIMULATED PURCHASE — NO REAL PAYMENT.” | `resolveVendorConfirmation()`; `resolveGenericApproval()`; `GenericProcurementWorkspace.tsx` | `GenericProcurementWorkspace.interaction.test.ts`; `generic-vendor-flow.test.ts` |
| Structured human-readable audit trail for search, comparison, decision, reason, and action | **Satisfied** | The audit thread includes vendor searches, comparison, re-evaluation, approval, confirmation, and mock-order events. | `addEvent()` in `generic-vendor-flow.ts`; authenticated persistence in `server/db.ts` and `server/routers/audit.ts` | `generic-vendor-flow.test.ts`; `server/db.procurement-audit.test.ts`; `server/routers/audit.test.ts` |
| Edge case: no vendor meets constraints | **Satisfied** | The recommendation becomes blocked and no order is created. | `recommendGenericOffer()` | `generic-vendor-flow.test.ts` — “fails an unknown category safely after searching both sources.” |
| Edge case: top vendor unavailable | **Satisfied** | The named **Demo: top vendor unavailable** control retains the blocked nominal top Vendor A candidate, re-ranks all offers, and selects the next eligible Vendor B offer. | `runUnavailableTopVendorScenario()`; `LocalDecision`; `Home.tsx` | `generic-vendor-flow.test.ts` — named unavailable-top-vendor scenario. |
| Explain why the agent chose the recommended vendor | **Satisfied** | The recommendation ticket, score, decision reason, policy state, and all-candidates table expose the basis for selection. | `GenericRecommendation.reason`; `CandidateComparison` | `GenericProcurementWorkspace.interaction.test.ts`; `generic-vendor-flow.test.ts` |
| Simulate negotiation or vendor-confirmation interaction | **Satisfied** | The confirmation panel allows explicit accept/reject or a price/delivery counter-offer. Material terms trigger deterministic re-evaluation and can reopen approval. | `VendorConfirmation`; `resolveVendorConfirmation()` | `GenericProcurementWorkspace.interaction.test.ts`; `generic-vendor-flow.test.ts` — counter-offer re-evaluation. |
| Ravi-style three-brief workflow, draft confirmations, finance handoff | **Partially satisfied** | The legacy multi-item onboarding demo covers chairs, stands, and monitors, but there is no dedicated finance-export/send control. | `client/src/domain/procurement.ts`; legacy `Workspace` in `Home.tsx` | `client/src/domain/procurement.test.ts`; `client/src/domain/generic-procurement.test.ts` |

## Final-round demonstration sequence

| Step | Judge-visible action | Expected safe result |
|---|---|---|
| 1 | Select **Load live laptop demo**, confirm the editable brief, and acknowledge the policy agreement. | Server-side product search returns live marketplace cards when available; the local policy flow is independently auditable. |
| 2 | Select **Run Vendor A/B challenge**. | Deterministic Vendor A/B cards are visibly labelled as challenge data; the all-candidates table exposes the ranked comparison. |
| 3 | In **Vendor confirmation boundary**, accept, reject, or change the unit price/delivery values. | Accept creates only a simulated order. Reject stops the workflow. A material counter-offer is re-evaluated and can require approval or block. |
| 4 | Select **Demo: top vendor unavailable**. | Vendor A remains visible but blocked as unavailable; the audit records re-ranking and Vendor B becomes the next eligible recommendation. |

## Remaining scope, stated honestly

The core final-round controls are complete. Two useful **P1** additions remain outside the completed P0 build: a dedicated three-brief finance handoff/export and the Round 1 presentation deliverable. They do not alter the deployed policy boundaries, comparison, confirmation, or mandatory unavailable-vendor demonstration.

## Source

[1] Rockathon’26, *Problem Statement 1 — Autonomous Commerce Engineering*, attached challenge PDF, pages 3–5.
