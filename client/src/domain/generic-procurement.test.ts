import { describe, expect, it } from "vitest";
import { goldenItems } from "./procurement";
import {
  canonicalCategory,
  curatedDemoBriefs,
  furnitureDemoBrief,
  getCategoryProfile,
  laptopDemoBrief,
  legacyItemToBuyingBrief,
  legacyOfferToVendorOffer,
  mobileDemoBrief,
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

  it("provides laptop, mobile, and furniture profiles while retaining generic fallback", () => {
    expect(canonicalCategory("Notebooks")).toBe("laptop");
    expect(canonicalCategory("smartphones")).toBe("mobile");
    expect(canonicalCategory("desks")).toBe("furniture");
    expect(getCategoryProfile("printer").categoryId).toBe("generic");
    expect(laptopDemoBrief.hardRequirements).toHaveLength(3);
    expect(mobileDemoBrief.hardRequirements.map((requirement) => requirement.key)).toEqual(["storage_gb", "network_5g", "battery_mah"]);
    expect(furnitureDemoBrief.hardRequirements.map((requirement) => requirement.key)).toEqual(["ergonomic", "adjustable_height", "lumbar_support"]);
    expect(Object.keys(curatedDemoBriefs)).toEqual(["laptop", "mobile", "furniture"]);
  });
});
