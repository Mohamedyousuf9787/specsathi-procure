import { describe, expect, it } from "vitest";
import { buildCommonGoodsVendorOffers, COMMON_GOODS_DESCRIPTOR_COUNT, commonGoodsDescriptors, resolveCommonGoodsDescriptor } from "./common-goods-catalog";
import type { BuyingBrief } from "./generic-procurement";
import { runGenericProcurement } from "./generic-vendor-flow";
import { parseBuyingBrief } from "./brief-parser";

const printerBrief: BuyingBrief = {
  id: "common-printer", productCategory: "portable printer", productDescription: "Portable printer", quantity: 4,
  hardRequirements: [{ key: "duplex", label: "Duplex printing", operator: "equals", value: true, isHard: true }],
  softPreferences: [], maxUnitPriceInr: 12_000, deliveryDeadlineDays: 5, authorizationLimitInr: 12_000,
  sourceText: "Purchase 4 portable printers with duplex printing under ₹12,000 each within 5 days.", confidence: 1,
};

describe("on-demand common-goods deterministic catalog", () => {
  it("defines exactly 1,000 unique common-goods descriptors without eagerly materializing vendor cards", () => {
    expect(COMMON_GOODS_DESCRIPTOR_COUNT).toBe(1000);
    expect(new Set(commonGoodsDescriptors.map(descriptor => descriptor.id)).size).toBe(1000);
    expect(resolveCommonGoodsDescriptor("portable printer")?.displayName).toBe("Portable Printer");
  });

  it("preserves a family-qualified common-goods category from a simple requester brief", () => {
    const parsed = parseBuyingBrief("Find 3 portable printers with duplex printing under ₹20,000 each within 5 days.");
    expect(parsed.normalizedBrief?.productCategory).toBe("portable-printer");
  });

  it("creates exactly one labelled simulated Vendor A and one Vendor B record only for the requested category", () => {
    const offers = buildCommonGoodsVendorOffers(printerBrief);
    expect(offers).toHaveLength(2);
    expect(offers.map(offer => offer.vendorName)).toEqual(["Vendor A", "Vendor B"]);
    expect(offers.every(offer => offer.sourceType === "simulated" && offer.sourceReference === "common-goods-portable-printer")).toBe(true);
    expect(offers.every(offer => offer.attributes.duplex === true && offer.availableQuantity >= printerBrief.quantity)).toBe(true);
  });

  it("returns no template for a category outside the defined 1,000-category catalog", () => {
    expect(resolveCommonGoodsDescriptor("industrial reactor")).toBeUndefined();
    expect(buildCommonGoodsVendorOffers({ ...printerBrief, productCategory: "industrial reactor" })).toEqual([]);
  });

  it("keeps common-goods candidates policy-compatible, ranked, held for confirmation, and explicitly audited as deterministic", async () => {
    const session = await runGenericProcurement(printerBrief);
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.candidates).toHaveLength(2);
    expect(session.recommendation.selected?.offer.vendorName).toBe("Vendor A");
    expect(session.audit.filter(event => event.type === "VENDOR_SEARCHED").every(event => event.detail?.includes("on-demand labelled deterministic common-goods template"))).toBe(true);
    expect(session.recommendation.reason).toContain("labelled deterministic offer");
  });

  it("resolves every descriptor on demand with paired records without accumulating eager card state", () => {
    const generatedOfferCount = commonGoodsDescriptors.reduce((total, descriptor) => total + buildCommonGoodsVendorOffers({ ...printerBrief, productCategory: descriptor.displayName }).length, 0);
    expect(generatedOfferCount).toBe(2000);
  });
});
