/** @vitest-environment jsdom */
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductListingsPanel, { type ProductListingViewState } from "./ProductListingsPanel";

const state: ProductListingViewState = {
  status: "live",
  listings: [{ id: "candidate-1", title: "Business laptop 16 GB RAM", merchant: "Example merchant", priceText: "₹39,900", rating: null, reviews: null, imageUrl: null, productUrl: "https://example.test/laptop", delivery: "Within 5 days", availability: "In stock", completeness: "complete", policy: "eligible", specificationStatus: "sourced", specificationSource: "marketplace", specificationProfile: "laptop", specifications: [{ label: "RAM", value: "16 GB RAM" }] }],
};

describe("explicit full specification verification", () => {
  it("does not start page verification when marketplace cards first render and starts it only after the requester clicks the card action", () => {
    const verify = vi.fn();
    render(createElement(ProductListingsPanel, { state, onVerifyFullSpecifications: verify }));
    expect(verify).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Verify full page specifications" }));
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith(expect.objectContaining({ id: "candidate-1", productUrl: "https://example.test/laptop" }));
  });
});
