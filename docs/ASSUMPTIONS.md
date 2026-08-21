# Assumptions

| Assumption | Validation / fallback | Status |
|---|---|---|
| The core presentation may be offline. | Bundle all data and logic locally; do not require credentials. | Confirmed design rule. |
| English is the demo language. | Keep UX and fixtures in English; defer Hindi translation. | Safe default. |
| A single demo requester can authorize an exception. | Use the explicit actor label `Finance approver` in local state. | Safe default. |
| An approval is not a financial transaction. | Use visible simulated-purchase labels and mock order IDs only. | Confirmed requirement. |
| A ₹20,000 monitor authorization limit applies per unit. | Test the ₹23,200 recommendation as a ₹3,200 over-limit exception. | Golden scenario rule. |
| The visual asset generator may finish asynchronously. | Use reserved asset paths; UI stays valid when images load after the application. | Accepted. |
