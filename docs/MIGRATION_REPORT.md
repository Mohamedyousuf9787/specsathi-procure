# Generalization Migration Report

## Existing behavior preserved

The original multi-item onboarding workflow remains available through **Load multi-item demo**. Its local Vendor A/Vendor B data, two automatic purchase outcomes, monitor approval boundary, rejection guard, changed-term re-escalation, simulated orders, audit trail, and six baseline tests remain intact.

## Generic capabilities added

The migration introduces normalized `BuyingBrief`, `Requirement`, `VendorOffer`, and `CategoryProfile` contracts; a laptop profile and generic fallback; deterministic natural-language parsing and validation; clarification for missing budget; conflict detection; generic local two-source routing; product-agnostic comparison; authorization; approval/rejection; final-term confirmation; simulated purchase; and audit logging. The UI now starts with one natural-language procurement-control record and no required product tabs.

## Product categories tested

| Category / case | Result |
|---|---|
| Laptop | Validates 16 GB RAM and 512 GB SSD; compares Vendor A/B; auto-purchases within authority; approval flow also tested. |
| Chair | Parses ergonomic and adjustable-height requirements; auto-purchases a compliant local offer. |
| Monitor | Parses size/QHD/HDMI; auto-purchases normally and re-ranks if the top vendor is unavailable. |
| Unknown printer | Parses duplex request; searches both sources; blocks safely with no mock order. |
| Ambiguous / conflicting | Missing budget requests clarification; contradictory total and unit budgets are invalid. |

## Files changed

The principal migration modules are `client/src/domain/generic-procurement.ts`, `client/src/domain/brief-parser.ts`, `client/src/domain/generic-vendor-flow.ts`, `client/src/components/GenericProcurementWorkspace.tsx`, and `client/src/pages/Home.tsx`. Corresponding tests, README, runbook, QA, traceability, decisions, phase notes, checkpoints, and recovery context were updated.

## Tests and verification

The 21-test Vitest suite passed five consecutive times. Legacy regression, generic parser/validator, generic vendor flow, approval rejection, changed terms, unavailable vendor, TypeScript, production build, credential scan, desktop review, mobile review, and Offline Demo Mode all passed.

## API status

LLM is disabled with deterministic parsing fallback. Live search is disabled with local Vendor A/Vendor B fallback. Vendor records are simulated. No secret is exposed.

## Context updates

Current state is `context/01-current-state.md`. Key migration milestones are `context/checkpoints/CP-011-laptop-baseline.md`, `CP-012-generic-engine-ready.md`, and `CP-013-generic-ui-ready.md`. Architecture decisions are `context/decisions/DEC-011-generic-procurement-schema.md` and `DEC-012-category-profiles.md`. The resolved test-expectation note is `context/errors/ERR-012-printer-category-expectation.md`.

## Known limitations

The parser and local catalog are intentionally constrained to a reliable offline demonstration. Unsupported categories do not hallucinate offers. Broader language understanding and live availability require an optional secure provider integration that must not change the local fallback.

## Demo instructions

Use **Load laptop demo** for the primary laptop-focused path, enter the chair example for secondary generic proof, use the printer example for safe unknown-category handling, and use **Load multi-item demo** to demonstrate that the legacy scenario is preserved.
