---
type: decision
id: DEC-017
status: accepted
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-17-real-nlp]]"
---

# DEC-017 — Real NLP is server-side structured extraction only

Use the platform-injected built-in LLM through a server tRPC procedure for brief extraction. Select `gpt-5-mini` from the verified live catalog for concise JSON-schema output. The LLM may populate candidate product and constraint fields but cannot make procurement decisions, bypass validation, select a vendor, approve an exception, confirm terms, or create orders. On timeout, schema failure, or unavailable provider, use the existing deterministic parser and disclose the fallback.
