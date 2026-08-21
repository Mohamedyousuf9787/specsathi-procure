import { describe, expect, it } from "vitest";
import { runDemo } from "./procurement";
import { buildFinanceAuditPdfDocument } from "./finance-audit-pdf";

describe("finance audit PDF document", () => {
  it("builds a simulated finance handoff document with procurement lines and chronological audit evidence", () => {
    const document = buildFinanceAuditPdfDocument(runDemo());
    expect(document.filename).toMatch(/-audit\.pdf$/);
    expect(document.lines).toEqual(expect.arrayContaining([
      "SPECANIC - FINANCE AUDIT RECORD",
      "PROCUREMENT LINES",
      "AUDIT TRAIL",
      expect.stringContaining("SIMULATED PURCHASES ONLY"),
    ]));
    expect(document.lines.some(line => line.includes("MOCK_PURCHASE_CONFIRMED"))).toBe(true);
  });

  it("never includes provider credential field names in the generated document model", () => {
    const document = buildFinanceAuditPdfDocument(runDemo());
    expect(document.lines.join("\n")).not.toMatch(/API_KEY|SECRET|TOKEN/i);
  });
});
