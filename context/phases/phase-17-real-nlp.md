---
type: phase
id: phase-17-real-nlp
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[checkpoints/CP-014-generalization-release]]"
  - "[[decisions/DEC-017-real-nlp-boundary]]"
---

# Phase 17 — Real Server-Side NLP

The project was upgraded from static to the secure full-stack template. The `nlp.extractBrief` public tRPC mutation runs `gpt-5-mini` server-side with strict JSON schema, Zod bounds, category/attribute alias normalization, and deterministic post-validation. The primary UI explicitly shows secure NLP processing and falls back to the offline parser on provider failure. A real local endpoint smoke test returned `source: llm`, the normalized `laptop` category, and contract-aligned requirement keys. The unified test command now executes 25 server and client tests.
