# Specanic — Design Ground Truth

## Reference commitment

The uploaded `designmd.txt` is the **ground-truth visual specification** for this project. This is a Notion-inspired procurement operations dashboard, not a generic dashboard and not a marketing-site clone. Fidelity to the supplied token system, typography discipline, surface treatment, and color-role restrictions overrides generic design preferences.

## Chosen direction — Calm operational paper

### Design movement

The interface adapts Notion's warm document minimalism to a high-trust procurement-control workspace. It should feel like a carefully maintained procurement ledger in good daylight: calm at rest, exact under pressure, and explicit when a human authorization boundary is reached.

### Core principles

1. **Paper before chrome.** The warm paper canvas (`#f6f5f4`) creates a document-like field; white is reserved for functional cards, inputs, and panels.
2. **One action color.** Notion blue (`#0075de`) is the only structural accent and appears only on primary actions, links, active states, and keyboard focus signals.
3. **Policy is legible.** Authorization, constraint failures, and audit evidence must be easy to understand without visual noise or developer narration.
4. **Decorative joy is contained.** The multi-color sticker palette appears only in small icons, category dots, status ornaments, and the top-level night introduction—never as structural fills or primary CTAs.

### Color philosophy

The product operates primarily on a warm paper canvas with near-black text, white surfaces, and quiet hairlines. This preserves the credible, document-first feeling needed for procurement controls. Blue is intentionally scarce so that starting procurement, confirming a compliant action, and granting approval each feel deliberate. Deep indigo (`#213183`) appears only in one introductory identity band. Purple, pink, orange, teal, green, sky, and brown are supporting sticker tones; they may communicate category or status but never compete with the primary action system.

### Layout paradigm

The primary workspace is an asymmetric operations desk: a persistent left context rail for batch context, item status, and demo controls; a broad working canvas for the active step; and a narrow evidence column for real-time audit events and provider status on wide screens. On smaller screens, the rails become ordered stacked panels while preserving the active task at the top.

### Signature elements

1. **Policy tape:** compact hairline-bounded strips that pair a human-readable constraint with a deterministic check outcome.
2. **Vendor tickets:** quiet white offer cards with small decorative category marks, a four-criterion score trail, and an explicit compliance label.
3. **Audit thread:** chronological evidence rows connected by an understated vertical rule, with compact actor and outcome markers.

### Interaction philosophy

All consequential interactions are explicit, reversible where appropriate, and immediately evidenced in the audit thread. Starting a procurement flow, approving an exception, rejecting it, simulating vendor unavailability, and resetting the session must each be visible as a deliberate action. Keyboard interactions are instant; pointer interactions use only brief press and hover feedback.

### Animation

Use a snappy ease-out (under 240ms) for cards entering the active stage, approval panels opening, and audit events arriving. Use transform and opacity only. Do not animate money calculations, policy decisions, or state changes slowly enough to imply uncertainty. Respect reduced-motion preferences.

### Typography system

Use `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` as the accessible substitute for NotionInter. Use tight 700-weight tracking for display and section headings; keep body copy at 400 and 1.5 line-height. Dense data tables and audit rows use 15px body text; labels use 12px/600 eyebrow text. Critical rupee amounts are tabular numbers.

### Brand essence

**Specanic is the procurement control desk for teams that want autonomous buying without surrendering authorization or evidence.**

Personality: **disciplined, calm, accountable**.

### Brand voice

Headlines are concise and operational. CTAs name the irreversible or meaningful action precisely. Microcopy states the agent's evidence and boundary in plain language.

Example lines:

> "Buy within policy. Pause at the boundary."

> "Monitor selection exceeds authority by ₹3,200. Approval is required before a simulated order can continue."

### Wordmark and logo

Use a simple interlocking receipt-and-checkmark symbol: a tall paper slip with one clipped corner and a blue check set inside a deep-indigo outline. It is a graphic mark with no text and should remain legible at navigation size.

### Signature brand color

**Procurement Blue — `#0075de`**. It is the single action color across the application.

## Implementation guardrails

- Do not use purple gradients, generic glassmorphism, heavy shadows, or all-purpose rounded pills.
- Do not use sticker palette colors for primary buttons, top-level structural fills, or universal success/error states.
- Do not use pill fields; inputs have a 4px radius.
- Do not repeat the deep indigo band beyond the single top-level identity moment.
- Every CSS or component file must carry a short top-of-file reminder that this project follows the Calm operational paper direction and its color-role restrictions.

## Style Decisions

- The generic intake must read as a **procurement control record**, never generic SaaS onboarding; visible labels name constraints, evidence, policy boundaries, or audit actions.
- The deep-indigo identity scene remains a single contained moment and is explicitly framed with receipt, approval, and evidence labels.
- The receipt-and-check mark is visually primary in the header; the wordmark remains quiet and secondary.
- Operational hierarchy should come from ledger-like hairlines, concise evidence rows, policy tape, and deterministic language rather than decorative card styling.
