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
