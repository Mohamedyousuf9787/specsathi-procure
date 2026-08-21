# Real Integration Plan

## Architecture

SpecSathi is now a full-stack application. Real NLP will run only in a server-side tRPC procedure using the platform-injected LLM credential. The browser will never receive a model key. The LLM is limited to structured extraction; deterministic validation, vendor comparison, authorization, confirmation, mock purchase, and audit logic remain code-owned.

## Provider decisions

| Capability | Provider plan | Credential status | Fallback |
|---|---|---|---|
| NLP extraction | Built-in server-side LLM with strict JSON schema | Platform-injected; no user key required | Existing deterministic parser and clarification flow. |
| Live vendor discovery | Tavily server-side adapter | Authenticated with user-supplied server secret | Local simulated Vendor A and Vendor B. |
| Purchase execution | Not implemented | Not applicable | Simulated purchase only. |

## Safety controls

The NLP procedure will trim inputs, enforce a request length limit, send a restrictive extraction prompt, require strict JSON-schema output, validate again with Zod and the deterministic parser, label the source (`llm` or `deterministic`), and return a safe clarification/fallback instead of fabricating a purchase decision. Raw provider credentials will not be stored in source, context, audit records, or the browser.

## Integration readiness

The full-stack upgrade completed without overwriting the procurement-control page. The live model catalog includes `gpt-5-mini` for concise schema extraction without reasoning overhead. The Tavily credential passed a bounded server-side health test, and the live evidence procedure returned current laptop evidence. Search snippets are intentionally not transformed into purchasable offers; the local deterministic Vendor A/Vendor B evaluation still owns recommendations and policy decisions.

> **Corrected live-search enablement order:** the server-side adapter and normalized-evidence test were implemented first; the Tavily credential was then reprovisioned and validated with a bounded authenticated health request; the provider-timeout regression verified local fallback; only then was live evidence enabled in the workspace.
