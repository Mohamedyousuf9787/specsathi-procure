# Test Plan

## Deterministic domain checks

Test currency totals, quantity availability, required specifications, delivery deadline, return policy, availability, score ordering, authorization overage, no-match behavior, unavailable-vendor re-ranking, changed terms, approval-before-order, rejection-without-order, and approval-after-recheck.

## UI checks

Test loading the golden scenario, starting procurement, rendering the parsed brief, showing recommended offers, displaying an approval requirement, approving and rejecting an exception, showing a mock confirmation, rendering audit events, reset behavior, keyboard access, and mobile layout.

## Release checks

Run TypeScript check, production build, browser smoke flows, no-secret scan, no-network demo path, and at least five clean reset-to-completion rehearsals.
