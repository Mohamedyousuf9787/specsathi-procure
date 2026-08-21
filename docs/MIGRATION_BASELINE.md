# Generalization Migration Baseline

## Baseline scope

The existing project is a static React/Vite offline procurement demo with a single-page interface, local Vendor A and Vendor B fixture data, deterministic evaluation and authorization logic, mock order creation, and a chronological audit thread. The page has no product-category tabs or product-specific routes.

> **Important discrepancy:** The migration instruction describes an “already-built laptop-focused version.” The actual baseline is a polished **multi-item onboarding scenario** for laptop stands, office chairs, and external monitors. It contains no laptop catalog, laptop-specific requirement profile, or load-laptop-demo action. This factual mismatch is recorded as a migration risk. The generalized migration must preserve the working multi-item demo while adding a new laptop-focused demo path rather than claiming that one already exists.

## Preserved workflow

| Stage | Existing implementation | Migration preservation requirement |
|---|---|---|
| Intake | A text area begins with a fixed three-item buying brief; simple procurement-keyword feedback guards unrelated text. | Replace the fixed scenario dependency with parsed generic briefs, but preserve the offline demo action. |
| Constraints | `BuyingItem` holds quantity, required specs, unit authorization, delivery days, and optional returns. | Adapt it to a generic brief/requirement shape without losing deterministic constraints. |
| Sources | A local catalog provides Vendor A and Vendor B offers grouped by `stands`, `chairs`, and `monitors`. | Keep the catalog as a compatibility fixture behind generic local-provider logic. |
| Comparison | `evaluateOffer` and `recommend` check availability, stock, exact-ish specs, delivery, return policy, price, and score. | Preserve deterministic behavior while moving product attributes into generic offer attributes. |
| Authorization | Over-limit selected offers become `PENDING_APPROVAL`; compliant offers auto-confirm. | Keep category-agnostic policy and explicit approval control. |
| Confirmation | Approval re-checks vendor terms before mock order creation. | Preserve the confirmation guard and changed-term escalation. |
| Audit | Local events record intake, searches, comparison, approval, confirmation, and simulated order. | Make labels dynamic by category and item ID. |

## Baseline commands and results

| Check | Command | Result |
|---|---|---|
| Unit tests | `pnpm vitest run` | Passed: 6 tests. |
| TypeScript | `pnpm check` | Passed. |
| Production build | `pnpm build` | Passed, with a non-blocking static-template chunk-size warning. |
| Visual baseline | Desktop root screenshot at 1440×1000 | Passed: monitor approval surface, Vendor A/B comparison, and audit thread visible. |
| Local startup | `pnpm dev` | Existing managed dev server running on port 3000. |

## Existing product-specific assumptions

The current `runDemo` always loads a fixed three-item onboarding brief and filters offers using three known category IDs. `Home.tsx` defaults directly into that demo, initializes the active item to `monitors`, writes scenario-specific onboarding copy, and assigns colors only for `stands`, `chairs`, and `monitors`. `VendorOffer.specs` and `BuyingItem.requiredSpecs` are product-shaped strings rather than normalized attribute requirements.

## Existing generic-looking controls that are not generic enough

The evaluator, ranker, authorization logic, confirmation guard, mock order, and audit event flow are structurally reusable, but they still rely on `category`, `specs`, `stock`, `available`, and fixed item IDs. The migration should refactor these data contracts through compatibility adapters rather than replace the proven policy flow.

## Files requiring explicit review before modification

| File | Reason |
|---|---|
| `client/src/domain/procurement.ts` | Contains the deterministic safety controls and current fixture data. |
| `client/src/domain/procurement.test.ts` | Defines the regression safety net for the existing demo. |
| `client/src/pages/Home.tsx` | Contains the established approval, confirmation, and audit experience. |
| `README.md` and `docs/DEMO_RUNBOOK.md` | Define the operator path that must remain runnable offline. |
| `context/` records | Are the recovery and traceability source for the migration. |

## Proposed migration boundary

Add a generic domain layer, parser/validator, local-provider interface, optional laptop profile, unknown-category fallback, and new tests. Keep the current policy workflow as a compatibility-driven vertical slice until the generic flow reproduces its safety outcomes.
