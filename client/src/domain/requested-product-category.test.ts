import { describe, expect, it } from "vitest";
import { inferRequestedProductCategory } from "./requested-product-category";

describe("requested product category guard", () => {
  it("keeps an Android smartphone request in the mobile category even when camera is only a preference", () => {
    expect(inferRequestedProductCategory("Find 2 Android smartphones under ₹30,000 with a good camera and rating above 4 stars.")).toBe("mobile");
    expect(inferRequestedProductCategory("Android smartphone")).toBe("mobile");
  });
  it("recognizes the supported requested product nouns without inventing a category", () => {
    expect(inferRequestedProductCategory("Buy 4 ergonomic office chairs")).toBe("chair");
    expect(inferRequestedProductCategory("Find tyres under ₹10,000 each")).toBe("tyre");
    expect(inferRequestedProductCategory("Find 3 portable printers with duplex printing")).toBe("portable printer");
    expect(inferRequestedProductCategory("Good camera quality and rating above 4 stars")).toBeNull();
  });
});
