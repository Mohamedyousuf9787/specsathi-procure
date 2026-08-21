import { describe, expect, it } from "vitest";
import { getProductSearchGuidance, summarizeProductListings, type ProductListing } from "./ProductListingsPanel";

const listing = (policy: ProductListing["policy"]): ProductListing => ({ id: policy, title: "Example product", merchant: "Example merchant", priceText: "₹1,000", rating: null, reviews: null, imageUrl: null, productUrl: "https://example.test/product", delivery: "3 days", availability: "In stock", completeness: policy === "unverified" ? "unverified" : "complete", policy });

describe("marketplace product-card summary", () => {
  it("keeps every policy state visible in the primary product-results summary", () => {
    expect(summarizeProductListings([listing("eligible"), listing("eligible"), listing("approval_needed"), listing("blocked"), listing("unverified")])).toEqual({ eligible: 2, approval_needed: 1, blocked: 1, unverified: 1 });
  });

  it("keeps empty and provider-fallback guidance distinct instead of substituting web links", () => {
    expect(getProductSearchGuidance("live", 0)).toMatchObject({ tone: "empty", title: "No marketplace product cards matched this confirmed request." });
    expect(getProductSearchGuidance("fallback", 0)).toMatchObject({ tone: "fallback", title: "Marketplace cards are temporarily unavailable." });
    expect(getProductSearchGuidance("live", 1)).toBeNull();
  });
});
