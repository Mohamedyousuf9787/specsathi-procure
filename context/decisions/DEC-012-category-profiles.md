---
type: decision
id: DEC-012
status: accepted
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-12-generic-domain-model]]"
---

# DEC-012 — Laptop profile plus generic fallback

The first specialized profile is `laptop`, with RAM, SSD, processor, and display attributes. Every unrecognized category uses the generic profile rather than being coerced into a laptop or hidden tab. This preserves a polished laptop demonstration while keeping the engine category-agnostic.
