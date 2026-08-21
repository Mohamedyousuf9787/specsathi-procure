# Migration QA Report

## Release status

**Ready for the offline generalization demo.** The application now has a natural-language primary path, a laptop-focused demo, a preserved multi-item compatibility demo, deterministic validation, two-source local vendor search, policy enforcement, approval controls, mock confirmation, simulated order records, and a generic audit trail.

## Verification summary

| Check | Result | Evidence |
|---|---|---|
| Legacy multi-item regression | Passed | Original six policy tests remain green. |
| Generic contracts | Passed | Generic brief, requirement, offer, category profile, and compatibility adapters are tested. |
| Parser and validator | Passed | Laptop, chair, monitor, printer, missing-budget, conflicting-budget, and unrelated-text cases are tested. |
| Generic vendor flow | Passed | Laptop, approval, chair, monitor, unavailable-monitor re-ranking, unknown printer, rejection, and changed terms are tested. |
| Repeatability | Passed | The full 21-test suite passed five consecutive runs. |
| TypeScript | Passed | `pnpm check`. |
| Production build | Passed | `pnpm build`; static-template chunk-size warning remains non-blocking. |
| Credential scan | Passed | No configured provider secrets or OpenAI-style keys in tracked project files. |
| Desktop and mobile visual review | Passed | 1440px and 390px generic intake renders reviewed. |

## Offline and API status

Demo Mode is local-only. LLM is disabled; live search is disabled; Vendor A and Vendor B are simulated local sources. No network call, API key, payment, database, or persistent user account is needed for the demonstrated flow.

## Known limitations

The deterministic parser recognizes a focused set of common product and requirement patterns. Unrecognized product categories remain valid briefs but block safely if no local catalog exists. Production expansion should add one secure server-side provider for broader language parsing or live search only after preserving the existing local fallback and test matrix.

## Real-integration verification

| Check | Result |
|---|---|
| Server-side NLP | Passed: strict-schema Gemini 3.5 Flash Lite extraction returned a normalized laptop brief through tRPC. |
| Consent and fallback | Passed: UI requires opt-in; unselected or failed NLP uses the deterministic parser and exposes a retry control. |
| Tavily credential | Passed: bounded server-side authenticated health test; no key appears in source or browser payload. |
| Live web evidence | Passed: authenticated server query returned normalized external titles, URLs, excerpts, and relevance. |
| Provider failure | Passed: timeout mock returned local fallback without blocking procurement. |
| Combined regression | Passed: 53 tests across 20 files, TypeScript, and production build. |
| Privacy audit metadata | Passed: `provider_audit_events` schema exists; unit test verifies metadata bounds and excludes untyped raw brief/query/key fields. |
| Visual integration review | Passed: the secure-NLP consent disclosure and procurement-control intake render clearly at desktop size. |
| Procurement audit trail | Passed: authenticated persistence route rejects anonymous writes; authenticated sessions persist bounded actual audit events, while anonymous sessions retain local-only history. |
| Injection and rate limits | Passed: instruction-override text is blocked before model extraction; mocked 429 tests prove both the complete NLP procedure and Tavily search fall back safely to deterministic local behavior. |
| Gemini ordinary-language extraction | Passed: the configured Gemini 3.5 Flash Lite route returned a structured laptop requirement record through local tRPC smoke testing. |
| SerpAPI product listings | Passed: a live Google Shopping query returned normalized in-app product data; tests cover complete, over-budget, approval-needed, and unverified mappings. |
| Editable confirmation gate | Passed: structured fields remain user-editable and the only product-search mutation is called from the explicit confirmation action. |
| Product-listing secret scan | Passed: application and documentation sources contain no committed Gemini or SerpAPI values. |
| Responsive procurement entry | Passed: desktop and 390px mobile renders preserve a readable ordinary-language request, secure-NLP consent, and explanation of the confirmation flow. |
| Gemini ordinary-language adapter | Passed: mocked structured response for a plain-language laptop request normalizes category, quantity, price ceiling, deadline, RAM, and storage into the procurement contract. |
| Runtime provider secrecy | Passed: live Gemini and SerpAPI procedure payloads and recent server logs contain no provider-key identifiers or credential-shaped strings. |
| Responsive confirmation and listings | Passed: 1280px and 390px captures show the editable confirmation form, its explicit search boundary, and the rendered Eligible, Approval needed, Blocked, and Unverified card states. |
| Card-first automatic results | Passed: marketplace cards now lead the workspace with a policy-state summary, visible policy legend, per-card source links, clear loading and no-result states, and a collapsed supporting-web-evidence disclosure. |
| Card-first responsive review | Passed: 1280px and 390px captures confirm marketplace cards and their policy legend precede every local-comparison and web-link element. |
| Supporting-source separation | Passed: regression coverage proves web evidence is absent while idle and otherwise represented as a closed Supporting sources only disclosure, never as a primary product result. |
| Firecrawl primary and fallback credentials | Passed: both server-only credentials completed independent lightweight scrape health checks without values appearing in test output, source, or browser payloads. |
| Category specification normalization | Passed: sourced laptop hardware, motorcycle engine/fuel/mileage/braking, and generic product-detail values normalize through explicit category profiles; values without source text remain absent. |
| Specification-panel rendering | Passed: server-rendered regression covers sourced category panels and an explicit unavailable state stating that no values were inferred. |
| Responsive specification review | Passed: 1280px and 390px renders show laptop and motorcycle specification panels beneath marketplace-card evidence, before policy state and source link. |
| Specification conflict boundary | Passed: contradictory sourced RAM values are marked as conflicts in the normalized record and rendered as Conflicting source values without changing any product policy state. |
| Firecrawl retry boundary | Passed: a mocked 429 primary request invokes the fallback credential; a mocked non-retryable 400 primary response does not invoke fallback. |
| Category field contracts | Passed: explicit laptop, motorcycle, and generic profile field contracts define exactly which source-bound values can be shown. |
