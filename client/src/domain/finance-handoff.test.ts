import { describe, expect, it } from "vitest";
import { runDemo } from "./procurement";
import { buildFinanceHandoff, getFinanceHandoffFilename, serializeFinanceHandoffCsv, serializeFinanceHandoffJson } from "./finance-handoff";

describe("multi-item finance handoff", () => {
  it("summarizes the deterministic multi-item batch without creating a payment instruction", () => {
    const handoff = buildFinanceHandoff(runDemo());
    expect(handoff.scope).toBe("SIMULATED FINANCE HANDOFF — NO PAYMENT");
    expect(handoff.lines).toHaveLength(3);
    expect(handoff.totalInr).toBeGreaterThan(0);
    expect(handoff.lines.every((line) => line.vendor !== null)).toBe(true);
  });

  it("serializes a compact, auditable JSON and CSV package with stable filenames", () => {
    const handoff = buildFinanceHandoff(runDemo());
    expect(JSON.parse(serializeFinanceHandoffJson(handoff)).handoffId).toBe(handoff.handoffId);
    expect(serializeFinanceHandoffCsv(handoff)).toContain('"handoff_id"');
    expect(serializeFinanceHandoffCsv(handoff)).toContain('"SIMULATED FINANCE HANDOFF — NO PAYMENT"');
    expect(getFinanceHandoffFilename(handoff, "json")).toMatch(/\.json$/);
    expect(getFinanceHandoffFilename(handoff, "csv")).toMatch(/\.csv$/);
  });
});
