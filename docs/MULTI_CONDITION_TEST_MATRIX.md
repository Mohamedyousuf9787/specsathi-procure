# Multi-Condition Reliability Matrix

The following deterministic test matrix checks that policy control remains correct when multiple facts interact. Live providers are intentionally excluded from this matrix so any failure is reproducible and does not consume external-provider quota.

| Scenario | Expected safe outcome | Regression surface |
| --- | --- | --- |
| Valid specific-model mouse request | Three ranked local candidates; best eligible candidate waits for confirmation. | `reliability-matrix.test.ts` |
| Missing budget | Clarification only; no vendor search or recommendation. | `brief-parser.test.ts`; `reliability-matrix.test.ts` |
| Non-purchase content | Invalid record; no normalization or search. | `brief-parser.test.ts`; `reliability-matrix.test.ts` |
| Incompatible requirement | Blocked with all candidates retained and no order. | `reliability-matrix.test.ts` |
| Authority exception | Pending approval; no simulated order. | `reliability-matrix.test.ts`; generic-flow tests |
| Counter-offer | Every candidate is re-evaluated; crossed authority remains pending approval. | `reliability-matrix.test.ts`; generic-flow tests |
| Top supplier unavailable | Re-rank to the next eligible offer without relaxing the brief. | `reliability-matrix.test.ts`; generic-flow tests |
| Unsupported category | Controlled zero-catalog hold with explicit audit event. | `reliability-matrix.test.ts`; workspace tests |
| Marketplace fallback | Labeled local candidates remain separate from live cards; audit records provenance. | `reliability-matrix.test.ts`; product outcome tests |
| Incomplete marketplace card | Not automatically recommended; full-page specification check is explicit and seller confirmation remains required. | product-panel tests and interactions |
