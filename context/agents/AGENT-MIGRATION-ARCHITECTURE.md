---
type: agent-note
id: AGENT-MIGRATION-ARCHITECTURE
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-11-generalization-baseline]]"
  - "[[phases/phase-12-generic-domain-model]]"
---

# Migration Architecture Note

The engine should become category-agnostic through normalized requirements and offer attributes, but it should retain a compatibility bridge for the existing stand/chair/monitor data. The UI should have one natural-language intake path plus explicit demo shortcuts, never a mandatory category tab strip. The validator, policy engine, mock confirmation, and audit log remain deterministic.
