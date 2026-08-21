import { describe, expect, it } from "vitest";
import { goldenItems } from "./procurement";
import {
  canonicalCategory,
  getCategoryProfile,
  laptopDemoBrief,
  legacyItemToBuyingBrief,
  legacyOfferToVendorOffer,
} from "./generic-procurement";

describe("generic procurement compatibility layer", () => {
  it("represents the existing multi-item fixtures as generic buying briefs", () => {
    const monitor = legacyItemToBuyingBrief(goldenItems[2]);
    expect(monitor.productCategory).toBe("external monitor");
    expect(monitor.hardRequirements.map((requirement) => requirement.value)).toContain("qhd");
    expect(monitor.authorizationLimitInr).toBe(20000);
  });

  it("normalizes legacy offers without losing procurement evidence", () => {
    const offer = legacyOfferToVendorOffer({
      id: "compat-chair", vendor: "Vendor A", product: "Ergo Frame Chair", category: "chairs", unitPrice: 11700, stock: 12,
      specs: ["ergonomic back support", "adjustable height"], deliveryDays: 5, sellerRating: 4.8, returnDays: 14, available: true,
    });
    expect(offer.productCategory).toBe("office chair");
    expect(offer.availability).toBe("in_stock");
    expect(offer.attributes.specifications).toContain("adjustable height");
  });

  it("provides a laptop profile and generic fallback without product tabs", () => {
    expect(canonicalCategory("Notebooks")).toBe("laptop");
    expect(getCategoryProfile("printer").categoryId).toBe("generic");
    expect(laptopDemoBrief.hardRequirements).toHaveLength(3);
  });
});
