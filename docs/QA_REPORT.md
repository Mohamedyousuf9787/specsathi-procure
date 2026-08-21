# QA Report

## Release status

**Ready for the local offline demo path.** The P0 workflow is implemented, tests are repeatable, the production build succeeds, provider keys are absent, and desktop/mobile workspace renders were reviewed.

## Preliminary verification

The deterministic suite passed six checks: the golden path, explicit approval, rejection without order creation, unavailable-vendor re-ranking, no-match blocking, changed-term re-escalation, and rejection of an impossible direct approval-to-purchase transition. The suite was run five consecutive times successfully. TypeScript checking and the production build passed. A refined credential scan found no configured provider secrets or OpenAI-style keys in tracked project files. The workspace render was reviewed at 1440px and 390px widths; the responsive stack, policy tape, vendor ticket, approval panel, comparison table, and evidence thread remained legible.

## Known limitations

P0 intentionally accepts the validated golden procurement brief and supports editable policy fields rather than attempting arbitrary language extraction. Optional hosted parsing, live search, transcription, image intake, user accounts, a database, notifications, and payments remain deferred. The build output reports a pre-existing main-chunk size warning from the static template dependency set; it does not prevent local demo use.

## Release recommendation

Use the local application as the primary Grand Finale path. Before presenting, a teammate should run the first three actions in `docs/DEMO_RUNBOOK.md` once on the presentation laptop and keep the generated static screenshot or a backup device available.

## Known limitations

- P0 intentionally has no hosted LLM, live web search, database, authentication, payments, voice, or image parsing.
- The final release must be verified without network access.
