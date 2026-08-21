# Requirements Traceability

| ID | Requirement | Planned implementation | Evidence / test | Status |
|---|---|---|---|---|
| R-01 | Natural-language buying brief | Intake text area with procurement-scope validation and deterministic golden parser. | Golden brief loads into structured items. | Complete for P0 golden scenario |
| R-02 | Editable structured constraints | Constraint preview cards with controlled quantity, unit authority, and delivery fields. | Changed fields rerun the local fixture evaluation. | Complete |
| R-03 | Two vendor sources | Local Vendor A and Vendor B fixture adapters. | Both sources appear in each search audit event. | Complete |
| R-04 | Four comparison criteria | Price, specification fit, delivery, reliability, return policy. | Recommendation table shows score breakdown. | Complete |
| R-05 | Deterministic policy enforcement | Constraint and policy functions. | Over-limit monitor requires approval. | Complete |
| R-06 | Autonomous approved action | Auto-authorize and mock-confirm compliant stand/chair offers. | Two mock order records. | Complete |
| R-07 | Explicit human approval | Approval card with approve, reject, revise controls. | No order before approval. | Complete |
| R-08 | Simulated purchase only | Confirmation panel and mock ID. | Persistent simulated label. | Complete |
| R-09 | Complete audit trail | Event array rendered in chronological evidence thread. | Material transitions have events. | Complete |
| R-10 | Unavailable vendor | Demo control changes offer availability and re-ranks. | Re-ranking audit event. | Complete |
| R-11 | No compliant vendor | Demo control blocks eligible offers. | Block state explains constraints. | Complete |
| R-12 | Offline resilience | No network calls, all fixtures bundled. | Browser works after reload with no providers. | Complete |
