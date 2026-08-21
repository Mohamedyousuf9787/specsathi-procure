# Generalization Migration Checklist

## Real Integration Checklist

## Confirmed Product Listing Upgrade

- [x] Store the user-provided Gemini and SerpAPI credentials securely and validate each server-side provider without exposing keys.
- [x] Preserve the current real-integration baseline and document the product-listing architecture and data-evidence boundaries.
- [x] Implement server-side Gemini structured brief extraction with the existing deterministic parser as a fallback.
- [x] Replace the read-only normalized review with editable category, quantity, budget, delivery, authorization, and requirement controls.
- [x] Require explicit user confirmation of the edited requirement record before any product search request.
- [x] Implement server-side SerpAPI shopping search and normalize products into safe in-app listing records.
- [x] Render comparable product listing cards with image, title, merchant, price, rating, availability, delivery, source link, and evidence completeness.
- [x] Evaluate product cards deterministically as eligible, approval-needed, blocked, or unverified without treating incomplete marketplace data as verified terms.
- [x] Display availability and explicitly handle unknown availability on every product card.
- [x] Implement and test the complete product-card policy states: eligible, approval-needed, blocked, and unverified.
- [x] Verify the product-listing architecture records and create the product-listing baseline checkpoint before release.
- [x] Add explicit eligible-listing regression coverage and verify the final product-listing checkpoint records before release.
- [x] Add tests for simple language, extraction fallback, editable corrections, product normalization, missing fields, rate limits, and listing/policy decisions.
- [x] Run full API, security, visual, responsive, regression, and context-documentation QA before the final checkpoint.
- [x] Add automated coverage for editable requirement corrections and the Gemini simple-language extraction path.
- [x] Run and record a final source and runtime secret-exposure scan for the Gemini and SerpAPI slice.
- [x] Verify editable confirmation and in-app product listings at desktop and mobile sizes, then read back final QA context records.
- [x] Add server-procedure coverage for Gemini simple-language extraction with a mocked structured response.
- [x] Verify live Gemini and SerpAPI runtime responses and server logs contain no provider secret values.
- [x] Capture desktop and mobile verification for editable confirmation and rendered product listings, then re-read final QA context.
- [x] Diagnose why the current live listing experience is perceived as web links rather than usable in-app product cards.
- [x] Evaluate and document a genuinely free product-data source and in-app listing approach, including evidence and rate-limit boundaries.
- [x] Replace the current listing presentation with the selected free in-app product-card flow while retaining deterministic policy labels and offline fallback.
- [x] Evaluate an automatic product-discovery approach that avoids manual Google Sheet maintenance and an eBay developer account.
- [x] Make automatic in-app product cards visually primary while retaining web links only as secondary supporting evidence.
- [x] Redesign the procurement workspace around a product-card-first results header, summary, and clear policy legend.
- [x] Move live web links into a collapsed supporting-evidence disclosure that does not compete with marketplace product cards.
- [x] Add explicit no-results, provider-fallback, and product-card loading states that explain the next safe action.
- [x] Add regression coverage and desktop/mobile visual verification for the card-first product-results journey.
- [x] Document the automatic card-first approach, its marketplace-evidence boundary, and provider/rate-limit fallback behavior in the repository.
- [x] Display a visible product-policy legend explaining Eligible, Approval needed, Blocked, and Unverified.
- [x] Add regression coverage for the product-card no-results/fallback language and supporting-source secondary treatment.
- [x] Re-read the final QA and card-first context records before saving the release checkpoint.
- [x] Add regression coverage that proves supporting sources remain a secondary collapsed disclosure, then rerun the suite.
- [x] Read back the finalized QA report and card-first checkpoint record after the last updates.
- [x] Define reusable category specification profiles for laptops, motorcycles, and unsupported categories.
- [x] Evaluate server-side product-page extraction providers and evidence requirements without exposing provider credentials.
- [x] Normalize and display sourced product specifications beneath each marketplace product card.
- [x] Keep unknown, unverified, and conflicting specification values explicit and separate from procurement policy decisions.
- [x] Add extraction, normalization, and responsive product-card specification-panel regression coverage.
- [x] Configure server-only Firecrawl primary and fallback credentials and validate failover without secret exposure.
- [x] Extract evidence-bound product specifications from marketplace product URLs using category-aware schemas.
- [x] Detect and explicitly surface conflicting sourced specification values without changing procurement policy state.
- [x] Add a Firecrawl router failover regression proving the fallback key is used only after a retryable primary failure.
- [x] Align the category-aware extraction contract and documentation with the implemented profile-based parser, including source-bound field definitions.
- [x] Re-read final specification QA and checkpoint context before saving the enrichment release checkpoint.
- [x] Verify the saved specification documentation, QA report, and CP-019 context record match the final profile, conflict, failover, and 53-test implementation.
- [x] Read back the finalized specification QA and CP-019 records immediately before saving the enrichment release checkpoint.
- [x] Audit malformed or link-like specification values and the end-to-end product-search latency path.
- [x] Replace blocking dynamic product-page enrichment with a faster specification strategy while keeping source evidence explicit.
- [x] Define and implement an explicit requester policy-agreement statement before a procurement decision boundary.
- [x] Define and implement a vendor statement that records normalized offer terms, evidence completeness, and verification status.
- [x] Add clear user-facing explanations for policy agreement, vendor statements, and simulated purchase boundaries.
- [x] Add regression, latency, and responsive QA for fast specifications and the new procurement-control statements.
- [x] Define and test a fast card-specification contract using only safe marketplace result fields.
- [x] Add a required requester policy-agreement acknowledgement before product search and record it in the local audit trail.
- [x] Render a normalized vendor offer statement on each marketplace card with clear evidence completeness and outstanding verification needs.
- [x] Change full product-page specification extraction to an explicit per-card verification action that never blocks initial search results.
- [x] Add clear loading, success, unavailable, and conflict states for on-demand full-specification verification.
- [x] Add and record a regression proving initial marketplace search does not invoke Firecrawl specification extraction automatically.
- [x] Read back final streamlined QA and CP-020 context records before saving the release checkpoint.
- [x] Add a flow-level regression proving initial product-search success does not invoke Firecrawl enrichment.
- [x] Add a flow-level regression proving Firecrawl enrichment starts only after the requester triggers per-card full verification.
- [x] Add rendered-component coverage proving the supporting-sources disclosure is closed by default and secondary.
- [x] Re-read the final QA report and card-first checkpoint record after the final rendered-coverage update.
- [x] Diagnose why the laptop product-card path falls into error/fallback despite local Vendor A/B messaging.
- [x] Define deterministic pre-built laptop marketplace-card and vendor templates for the challenge scenario without presenting them as live marketplace data.
- [x] Add a clear best-fit recommendation that compares the pre-built laptop templates against confirmed hard requirements and policy limits.
- [x] Ensure successful laptop cards show the policy agreement, normalized vendor statement, and explicit demo/evidence status.
- [x] Add regression and desktop/mobile verification for the reliable laptop challenge journey.
- [x] Re-read final laptop challenge QA records before saving the reliable demo checkpoint.
- [x] Surface the confirmed policy-agreement summary in the laptop challenge product-result area and add regression coverage.
- [x] Add an integration regression proving the actual laptop fallback helper returns deterministic Vendor A/B cards for unavailable or empty live results.
- [x] Verify the laptop challenge cards through the real fallback route at desktop and mobile sizes without a development-only fixture.
- [x] Add Home-flow integration coverage for both provider-error and empty-live-result laptop fallback paths.
- [x] Capture desktop and mobile visual verification through a genuine live-search fallback trigger rather than the dedicated demo route.
- [x] Re-read final laptop challenge QA and CP-020 records immediately before saving the reliable demo checkpoint.
- [x] Add a normal Home user-flow interaction test proving product-search failure displays deterministic laptop cards after explicit policy agreement.
- [x] Re-read the final QA and CP-020 records after the normal-flow test and save the reliable laptop challenge checkpoint.
- [x] Extract and structure every functional, control, evidence, and deliverable requirement from the Rockathon 2026 challenge statement.
- [x] Map the current application, tests, and demo behavior to each challenge requirement with an evidence-based compliance status.
- [x] Identify and prioritize any gaps that prevent an honest claim of full challenge compliance.
- [x] Produce a structured Rockathon requirement inventory covering functional, policy, audit, edge-case, scope, and Round 1 deliverable criteria.
- [x] Produce an evidence-backed requirement-by-requirement compliance matrix tied to concrete product flows, code, and tests.
- [x] Present the remaining P1 gaps and obtain the user’s decision to extend the final-round scope with curated category demos, finance handoff, and a presentation deck.
- [x] Diagnose whether real-time product-card unavailability is caused by provider quota, credentials, upstream response, request validation, or client-state handling.
- [x] Correct the real-time product-card path so verified live results are visible when the provider succeeds and fallback remains explicit only when it fails.
- [x] Run provider, regression, type, build, and runtime-log verification after the real-time card fix.
- [x] Save a release checkpoint and push the complete verified project to the user’s GitHub account.
- [x] Verify the live SerpAPI account and Google Shopping request status without exposing credentials.
- [x] Restore the normal Laptop demo to the real-time search and editable confirmation path; keep deterministic Vendor A/B cards as an explicitly labelled fallback/demo mode.
- [x] Make live-result versus deterministic-fallback provenance unambiguous in the user-facing controls and product-result header.
- [x] Exercise the restored live product-search procedure and inspect recent runtime logs for product-search errors or unexpected fallback messages.

## Rockathon’26 Final-Round P0 Completion

- [x] Add a judge-visible, ranked all-candidates comparison table with requirement fit, price, delivery, reliability, return window, policy state, and decision reason.
- [x] Add an interactive simulated vendor-confirmation and counter-offer flow that re-evaluates policy before a mock purchase.
- [x] Add a named unavailable-top-vendor demo that records the re-ranking decision and selects the next eligible offer.
- [x] Add domain and rendered interaction regressions for all P0 demonstrations.
- [x] Expand the Rockathon requirement matrix so every listed requirement cites a product flow, code, and specific regression evidence.
- [x] Re-run final-round build, visual, security, and release synchronization verification.

## Rockathon’26 Final-Round P1 Completion

- [x] Define a compact, clearly labelled deterministic demo catalog for laptop, mobile, furniture, and the existing multi-item procurement scenario.
- [x] Add unambiguous category demo controls that seed the normal editable requirement-confirmation path without cluttering the intake experience.
- [x] Extend the local vendor catalog and policy comparisons with curated mobile and furniture offers from both deterministic Vendor A and Vendor B sources.
- [x] Add a finance handoff for the multi-item demo with a concise batch summary, simulated send event, and local JSON/CSV audit exports.
- [x] Add domain and rendered regressions for curated demos and finance handoff/export behavior.
- [x] Write and generate a concise final-round judge presentation within the 12-slide plan limit.
- [x] Run final test, build, visual, source-safety, checkpoint, and GitHub synchronization verification for the complete release.

## GitHub Source Verification Follow-up

- [x] Verify every project source, test, documentation, and presentation-source file is tracked and synchronized to the user’s GitHub repository.

## Urgent Procurement-Flow Repair

- [x] Reproduce the tyre-specific-model and unsupported-category request failures across live search, deterministic comparison, policy controls, candidate evidence, and audit events.
- [x] Add safe, clearly labelled local comparison coverage for tyre/model requests without representing deterministic values as live marketplace evidence.
- [x] Ensure live marketplace failures leave a usable, truthful fallback state rather than an empty policy-controlled workspace.
- [x] Ensure all-candidates ranked evidence always explains zero-result and fallback states, and renders candidate rows when a deterministic fallback is available.
- [x] Correct audit events so they precisely record live-provider outcome, fallback provenance, catalog coverage, policy state, and next safe action.
- [x] Add regression and visual coverage for the repaired tyre request and unsupported-category behavior, then checkpoint and push the correction to GitHub.

## Complete Context Delivery

- [x] Store the urgent repair diagnosis, implementation rationale, verification results, and source inventory in repository documentation.
- [x] Create a downloadable safe complete-context ZIP with project source, tests, documentation, configuration, and presentation source while excluding secrets, dependencies, runtime logs, build artifacts, and Git internals.
- [x] Save a final checkpoint and push all completed repair source and context records to the user’s GitHub repository.

## Full Capability Hardening Audit

- [x] Verify irrelevant-request rejection preserves online-purchase scope without blocking valid procurement briefs.
- [x] Verify vendor confirmation and counter-offer re-evaluation preserve authority, policy, and simulated-purchase boundaries.
- [x] Verify all-candidates comparison renders ranks, evidence, zero-catalog explanations, and policy states for every supported demo.
- [x] Verify multi-item finance handoff, simulated send event, and JSON/CSV exports contain complete auditable data without payment behavior.
- [x] Verify curated laptop, mobile, furniture, and tyre demos use clear deterministic provenance and supported category requirements.
- [x] Verify consented secure NLP, deterministic fallback, prompt-injection rejection, and rate-limit degradation work together safely.
- [x] Verify live SerpAPI cards and on-demand Firecrawl specification extraction expose correct loading, fallback, and evidence states.
- [x] Verify the 10-slide judge deck and desktop/mobile layouts remain complete, readable, and aligned with implemented behavior.
- [x] Add or update regression coverage for each defect found; then rerun final source-safety, checkpoint, and GitHub-release verification.

## Mouse Comparison and Evidence Repair

- [x] Reproduce and document the empty mouse local-comparison, unverified marketplace, and missing-ranked-evidence states shown by the user.
- [x] Add a clearly labelled deterministic mouse profile, editable demo fixture, and Vendor A/Vendor B candidate records without presenting them as live listings.
- [x] Ensure compatible mouse requests produce ranked local candidate evidence, policy state, vendor confirmation, and audit events.
- [x] Improve marketplace-card guidance so unreported stock and missing concise specifications clearly direct the user to explicit verification without claiming verification prematurely.
- [ ] Add regression and visual coverage for the repaired mouse path and its marketplace-evidence states, then checkpoint and push the repair to GitHub.

- [x] Inspect available connectors and record the approved provider architecture without exposing credentials.
- [x] Upgrade the static application to a secure full-stack project and preserve the local demo path.
- [x] Implement server-side structured NLP extraction with strict schema validation and deterministic post-validation.
- [x] Add real-NLP status, consent, transparent fallback, and retry states to the buying-brief interface.
- [x] Request and configure a single approved live vendor-search API key only after the secure provider adapter is ready.
- [x] Normalize live search results, require evidence, and keep local Vendor A/Vendor B fallback when the provider fails.
- [x] Verify the secure live-search adapter and provider-failure fallback after credential provisioning, then record the corrected enablement order.
- [x] Persist audit records and provider metadata without storing secrets or sensitive raw content unnecessarily.
- [x] Run provider failure, prompt-injection, rate-limit, regression, security, and production QA; update context and delivery records.
- [x] Persist authenticated procurement audit events in addition to provider metadata, while retaining an explicit anonymous-session fallback.
- [x] Add malicious-brief prompt-injection regression coverage that proves system extraction instructions remain controlling.
- [x] Add live NLP and live-search rate-limit fallback handling with regression tests.
- [x] Re-run and record the complete integration QA matrix after audit persistence and safety-hardening changes.
- [x] Test the full NLP procedure’s 429 fallback path with a mocked provider and verify the final hardening records before release.

- [x] Read the full migration prompt and compare it with the current SpecSathi implementation.
- [x] Audit source, tests, documentation, and the existing context vault; record laptop-demo preservation risks.
- [x] Run and record the current baseline test, type, build, and visual checks without changing behavior.
- [x] Add the required Phase 11–16 migration notes, agent notes, error template, and laptop baseline checkpoint.
- [x] Define generic buying brief, requirement, offer, category-profile, parser, validator, and adapter types.
- [x] Preserve the golden scenario through a compatibility adapter and keep it offline-first.
- [x] Implement deterministic parsing and validation for generic category requests, ambiguity, conflicts, and unsupported catalogs.
- [x] Add local generic vendor routing with at least two sources and controlled no-catalog behavior.
- [x] Generalize the intake and confirmation UI without adding fixed product-category tabs.
- [x] Add laptop and non-laptop regression tests, then run repeatable offline QA and visual verification.
- [x] Update migration documentation, save a release checkpoint, and provide revised demo instructions.
