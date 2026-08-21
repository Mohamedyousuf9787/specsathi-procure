# Urgent Procurement-Flow Repair Findings

## Verified User Evidence

The supplied marketplace-status screenshot states that marketplace cards are temporarily unavailable while asserting that a local Vendor A/B comparison remains available. The supplied ranked-evidence screenshot simultaneously shows **0 compared** and no candidate rows.

The supplied audit screenshot records a normalized **keyboard** request followed by zero matches from both local vendors, zero compared offers, and no local simulated catalog. The associated policy recommendation is correctly marked **Blocked** for that unsupported local category, but the combined user experience is misleading because the visible fallback claim and empty comparison surface contradict one another.

## Repair Objective

The repair must preserve the truthful block for a category without verified local offers, while making the next safe action explicit. Tyre/model requests need their own clearly labelled deterministic Vendor A/B catalog so a provider failure produces candidates, policy evaluation, and an auditable recommendation rather than an empty comparison.

## Confirmed Root Cause

The live shopping provider returned HTTP `200` for the tyre query and reported a `17.68` second provider execution time. The application had a `15` second server-side abort boundary, so a valid slow response was converted to the generic marketplace-fallback state before its product cards could reach the application.

## Implemented Repair

The server-side product-search timeout is now `25` seconds. A direct server procedure check for `1 tyre 205 55 R16 MRF ZVTS India` returned `status: live` and live MRF tyre-card titles after the change.

The deterministic parser now recognizes ordinary phrases such as `I want 1 tyre`, tyre sizes such as `205/55 R16`, `tubeless`, and `for Honda City`. It still requires a budget before a search proceeds. The labelled deterministic Vendor A/Vendor B catalog now includes compatible tyre candidates; these remain explicitly simulated records, not marketplace data.

The fallback and policy surfaces now distinguish two cases. When a supported deterministic catalog has candidates, the UI identifies the exact labelled candidate count and preserves the ranked comparison. When no deterministic catalog covers a category, the marketplace guidance, local-policy badge, empty candidate surface, and audit trail consistently state that no local recommendation was created and no vendor data was invented.

## Audit Integrity Changes

Generic audit events now use actual UTC timestamps. The audit trail records marketplace results or marketplace fallback provenance, the presence or absence of local catalog coverage, the comparison count, and the policy hold or selected recommendation. The attention coloring also includes fallback and catalog-coverage events.

## Verification Record

| Check | Result |
| --- | --- |
| Tyre/model parsing and budget boundary | Passed in deterministic parser tests |
| Tyre Vendor A/B ranking and confirmation hold | Passed with three labelled candidates and a Vendor A recommendation |
| Unsupported-category policy hold | Passed with explicit no-catalog audit events and no fabricated candidates |
| Marketplace fallback copy | Passed for both covered and uncovered local-catalog states |
| Live tyre marketplace route | Returned `status: live` with actual tyre titles after the timeout correction |
| Full application suite | 81 tests across 27 files passed; TypeScript and production build passed |

## Complete Context Source Inventory

At the time of this repair record, the tracked safe context inventory contains **182 files** across the following roots: `client` (100), `server` (41), `shared` (3), `drizzle` (8), `docs` (18), and `rockathon_final_round_deck` (12). The context package also includes the tracked root configuration and delivery files: `.gitignore`, `README.md`, `components.json`, `drizzle.config.ts`, `package.json`, `pnpm-lock.yaml`, `todo.md`, `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`.

The downloadable archive deliberately excludes `node_modules`, `dist`, `.git`, `.env` files, runtime logs, screenshots, temporary files, and generated local build output. This retains all code, tests, context documents, and presentation source needed to review or rebuild the project without exposing credentials or unnecessary machine-specific material.
