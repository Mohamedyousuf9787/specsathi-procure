# Rockathon’26 PS1 Compliance Assessment

## Assessment conclusion

> **The application substantially satisfies the core functional build requirements for Problem Statement 1, but it is not yet defensible to claim 100% challenge compliance.**

The implementation has a strong, working procurement-control core: ordinary-language intake, deterministic two-vendor discovery, policy-owned comparison, authorisation holds, mock ordering, audit events, and explicit safe fallback behavior. The main gaps are in the *demonstration and completion layer*: an interactive negotiation simulation, a clearly visible all-candidates comparison table, a multi-brief finance handoff, an explicit unavailable-top-vendor demonstration, and—if entering Round 1—the required 10–15 slide submission.

## Requirement inventory and evidence matrix

| Challenge requirement | Status | Evidence in the current build | Assessment |
|---|---|---|---|
| Natural-language buying brief with budget, quantity, specifications, delivery, and authorisation constraints | **Satisfied** | `client/src/domain/brief-parser.ts`; Gemini extraction plus editable confirmation; `EditableRequirementReview` | The requester can enter ordinary text, correct extracted fields, and explicitly agree to the policy record before search. |
| Online-purchase scope; irrelevant requests must not be answered | **Satisfied** | `brief-parser.ts` rejects unrelated/non-procurement intent; parser regression coverage | The system asks for a procurement brief instead of answering arbitrary questions. |
| Discover options from at least two sources; simulated data allowed | **Satisfied for the demonstration** | `LocalDemoVendorProvider` provides Vendor A and Vendor B; reliable laptop fallback exposes four clearly labelled Vendor A/B templates | The brief expressly permits mock/simulated data. Templates are visibly identified as deterministic rather than live offers. |
| Compare on at least four dimensions and return a ranked recommendation with reasoning | **Satisfied in decision logic; presentation is partial** | `evaluateGenericOffer()` scores requirements, price, delivery, seller reliability, and returns; `recommendGenericOffer()` ranks candidates | Five dimensions are evaluated in code and audit events. The UI should still add a visible all-candidates comparison table for the strongest judge-facing proof. |
| Enforce authorisation limit and pause for human approval | **Satisfied** | `recommendGenericOffer()` returns `PENDING_APPROVAL`; `resolveGenericApproval()` requires an explicit decision and re-checks changed terms | The agent cannot auto-authorise beyond the stated authority. |
| Simulate a purchase confirmation; no real payment | **Satisfied** | `MOCK_PURCHASE_CONFIRMED`, mock order records, and the visible “SIMULATED PURCHASE — NO REAL PAYMENT” boundary | The app logs a confirmed mock order without payment or vendor-site purchasing. |
| Structured human-readable audit trail covering search, comparison, decision, reason, and action | **Satisfied** | Procurement audit events in `generic-vendor-flow.ts`; audit workspace; authenticated persistence path | The sequence is inspectable and includes normalization, searches, comparisons, approval, vendor confirmation, and mock purchase. |
| Edge case: no vendor meets constraints | **Satisfied** | `recommendGenericOffer()` returns `BLOCKED` and logs `WORKFLOW_BLOCKED` | The system preserves constraints instead of inventing or relaxing an offer. |
| Edge case: top vendor unavailable | **Partially satisfied** | Availability is a hard failure in `evaluateGenericOffer()` and eligible alternatives can be selected | The behavior exists, but it needs a clearly named unavailable-top-vendor scenario, regression, and judge-visible demo state. |
| Explain why the agent chose the recommended vendor | **Satisfied** | Recommendation reason, score breakdown, best-fit laptop label, policy labels, and audit log | The selected option is explained in terms of fit and authorisation. |
| Simulate negotiation or vendor-confirmation interaction | **Partially satisfied** | Existing `VENDOR_CONFIRMED` and `TERMS_CHANGED` audit transitions, plus approval re-check logic | There is confirmation/re-validation logic, but not a visible negotiation interaction such as a counter-offer, acceptance/rejection, and re-evaluation screen. |
| Ravi-style three-brief workflow, draft confirmations, finance handoff | **Partially satisfied** | Legacy multi-item demo and per-brief generic flow; persisted audit records | The app can demonstrate multiple categories, but it lacks a clear batch three-brief orchestration and a finance export/send action. |

## What is already strong for judging

The strongest parts of the solution are the **authorization boundary**, **explicit requester agreement**, **honest evidence labels**, **deterministic fallback**, and **auditability**. The product does not pretend that pre-built Vendor A/B templates are live marketplace offers. It also prevents slow page scraping from blocking initial comparison and makes deep verification an explicit per-card action.

## Gaps that prevent a 100% claim

| Priority | Gap | Why it matters | Smallest credible completion |
|---|---|---|---|
| P0 | Visible candidate comparison table | Judges need to see every Vendor A/B option compared across the required dimensions, not infer it from a single recommendation card | Add a ranked table for all candidates with requirement fit, unit price, delivery, reliability, return window, policy state, and decision reason. |
| P0 | Interactive negotiation/vendor confirmation | The challenge explicitly calls for a simulated negotiation or confirmation interaction | Add a vendor-confirmation drawer with an unchanged-terms confirmation and a changed-price/delivery counter-offer that triggers re-evaluation or approval. |
| P0 | Unavailable-top-vendor scenario | It is one of the two named mandatory edge cases | Add a demo scenario where the nominal top-priced/score vendor is unavailable and the agent selects the next eligible option; cover it with a visible audit event and regression. |
| P1 | Three-brief batch and finance handoff | Mirrors the supplied real-world scenario and demonstrates end-to-end operational usefulness | Add a batch dashboard for chairs, stands, and monitors plus downloadable JSON/CSV finance audit export or a clearly simulated finance-send event. |
| P1 | Challenge presentation assets | Round 1 explicitly requires a 10–15 slide PPT/PDF, while a judge-facing architecture flow strengthens the live build | Prepare the required slide deck: cover, scenario, architecture, decision logic, approvals, audit, tools, limits, edge cases, and demo walkthrough. |

## Final judgement

The correct statement today is:

> **“SpecSathi Procure meets the principal functional requirements of Rockathon’26 PS1 in a working, offline-safe demonstration, but it needs the P0 items above before we claim full end-to-end challenge coverage.”**

Completing the three P0 items would make the live-build claim materially stronger. Completing the P1 items would align the experience with the full Ravi scenario and the Round 1 submission requirements.

## Source

[1] Rockathon’26, *Problem Statement 1 — Autonomous Commerce Engineering*, attached PDF, pages 3–5.
