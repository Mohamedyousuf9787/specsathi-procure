import { afterEach, describe, expect, it, vi } from "vitest";
import { extractWithGemini } from "./nlp";

describe("Gemini structured brief extraction", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes a simple ordinary-language laptop request into procurement contract keys", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ productCategory: "laptops", productDescription: "new staff laptops", quantity: 10, hardRequirements: [{ key: "ram", label: "RAM", operator: "at_least", value: 16, unit: "GB" }, { key: "storage", label: "SSD", operator: "at_least", value: 512, unit: "GB" }], softPreferences: [], maxUnitPriceInr: 45000, maxTotalPriceInr: null, deliveryDeadlineDays: 5, returnPolicyRequirement: null, sellerRequirement: null }) }] } }] }), { status: 200 })));
    const result = await extractWithGemini("Need laptops for 10 new staff below ₹45,000 each with 16 GB RAM and 512 GB SSD within 5 days.");
    expect(result).toMatchObject({ productCategory: "laptop", quantity: 10, maxUnitPriceInr: 45000, deliveryDeadlineDays: 5 });
    expect(result.hardRequirements).toEqual(expect.arrayContaining([expect.objectContaining({ key: "ram_gb", value: 16 }), expect.objectContaining({ key: "storage_gb", value: 512 })]));
  });
});
