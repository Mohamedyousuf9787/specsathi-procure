import { describe, expect, it } from "vitest";
import { normalizeShoppingResults } from "./products";

describe("shopping product normalization", () => {
  it("normalizes comparable product-card fields and labels incomplete marketplace data", () => {
    const listings = normalizeShoppingResults({ shopping_results: [{ position: 1, title: "Business laptop 16 GB RAM", source: "Example Store", price: "₹44,999", extracted_price: 44999, rating: 4.4, reviews: 120, thumbnail: "https://example.com/laptop.png", product_link: "https://example.com/laptop", delivery: "Delivery in 3 days", availability: "In stock" }, { position: 2, title: "Unknown laptop" }] }, 40000, 35000);
    expect(listings[0]).toMatchObject({ merchant: "Example Store", priceInr: 44999, completeness: "complete", policy: "blocked", availability: "In stock" });
    expect(listings[1]).toMatchObject({ completeness: "unverified", priceInr: null, policy: "unverified" });
  });
  it("maps a complete listing above authority but within the ceiling to approval needed", () => {
    const [listing] = normalizeShoppingResults({ shopping_results: [{ title: "Business laptop", source: "Store", price: "₹44,000", extracted_price: 44000, product_link: "https://example.com/product", availability: "In stock" }] }, 45000, 40000);
    expect(listing?.policy).toBe("approval_needed");
  });

  it("marks a complete in-stock listing within price and authority limits eligible", () => {
    const [listing] = normalizeShoppingResults({ shopping_results: [{ title: "Business laptop", source: "Store", price: "₹39,000", extracted_price: 39000, product_link: "https://example.com/product", availability: "In stock" }] }, 45000, 40000);
    expect(listing?.policy).toBe("eligible");
  });
});
