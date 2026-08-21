import { describe, expect, it } from "vitest";
import { buildConfirmedBrief, buildPolicyAgreementStatement } from "./EditableRequirementReview";

const brief = { id: "draft", sourceText: "Need a laptop", productCategory: "laptop", productDescription: "laptop", quantity: 1, hardRequirements: [{ key: "ram_gb", label: "RAM", value: 8, unit: "GB", operator: "at_least" as const, isHard: true, sourceText: "Draft" }], softPreferences: [], maxUnitPriceInr: 30000, maxTotalPriceInr: undefined, deliveryDeadlineDays: undefined, authorizationLimitInr: 30000, confidence: 0.7 };

describe("editable procurement confirmation", () => {
  it("uses requester corrections for category, quantity, limits, and requirements", () => {
    const confirmed = buildConfirmedBrief(brief, { category: "Business laptop", quantity: "10", unitBudget: "45000", totalBudget: "450000", deliveryDays: "5", authorization: "40000", requirements: [{ key: "ram", label: "RAM", value: "16", unit: "GB", operator: "at_least", isHard: true }, { key: "storage", label: "SSD", value: "512", unit: "GB", operator: "at_least", isHard: true }] });
    expect(confirmed).toMatchObject({ productCategory: "business laptop", quantity: 10, maxUnitPriceInr: 45000, authorizationLimitInr: 40000 });
    expect(confirmed?.hardRequirements).toHaveLength(2);
    expect(confirmed?.hardRequirements[0]).toMatchObject({ value: 16, sourceText: "Confirmed by requester" });
  });

  it("states that confirmed marketplace comparison is not an order or payment authorization", () => {
    expect(buildPolicyAgreementStatement(brief)).toContain("comparison candidates, not an order, payment authorization, or verified offer");
    expect(buildPolicyAgreementStatement(brief)).toContain("₹30,000");
  });
});
