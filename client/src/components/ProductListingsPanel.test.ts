import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductListingsPanel, { getExplicitFullVerificationRequest, getInitialProductSearchState, getProductSearchGuidance, prepareInitialMarketplaceListings, SpecificationPanel, summarizeProductListings, VendorOfferStatement, type ProductListing } from "./ProductListingsPanel";

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

  it("renders sourced category specifications and makes an unavailable extraction explicit", () => {
    const sourced = { ...listing("eligible"), specificationStatus: "sourced" as const, specificationProfile: "laptop" as const, specifications: [{ label: "RAM", value: "16 GB DDR5", conflict: true }, { label: "Graphics", value: "RTX 4050" }] };
    const sourcedMarkup = renderToStaticMarkup(createElement(SpecificationPanel, { listing: sourced }));
    expect(sourcedMarkup).toContain("Laptop specifications");
    expect(sourcedMarkup).toContain("RAM");
    expect(sourcedMarkup).toContain("16 GB DDR5");
    expect(sourcedMarkup).toContain("Sourced from page");
    expect(sourcedMarkup).toContain("Conflicting source values");
    const unavailableMarkup = renderToStaticMarkup(createElement(SpecificationPanel, { listing: { ...listing("unverified"), specificationStatus: "unavailable" } }));
    expect(unavailableMarkup).toContain("Specifications unavailable from the product page. No values were inferred.");
  });

  it("keeps marketplace vendor statements normalized and makes full-page verification an explicit action", () => {
    const marketplace = { ...listing("eligible"), specificationStatus: "sourced" as const, specificationSource: "marketplace" as const, specificationProfile: "laptop" as const, specifications: [{ label: "RAM", value: "16 GB RAM" }] };
    expect(renderToStaticMarkup(createElement(VendorOfferStatement, { listing: marketplace }))).toContain("Normalized vendor offer statement");
    const panelMarkup = renderToStaticMarkup(createElement(SpecificationPanel, { listing: marketplace, onVerifyFullSpecifications: () => undefined }));
    expect(panelMarkup).toContain("Marketplace result");
    expect(panelMarkup).toContain("Verify full specifications");
  });

  it("prepares initial cards from marketplace data without starting page verification", () => {
    const [prepared] = prepareInitialMarketplaceListings([listing("eligible")]);
    expect(prepared).toMatchObject({ specificationStatus: "sourced", specificationSource: "marketplace" });
    expect(prepared.specificationStatus).not.toBe("loading");
  });

  it("creates no Firecrawl request during initial search and creates one only for an explicit product verification", () => {
    const candidate = listing("eligible");
    expect(getInitialProductSearchState([candidate]).verificationRequest).toBeNull();
    expect(getExplicitFullVerificationRequest("laptop", candidate)).toEqual({ category: "laptop", products: [{ id: candidate.id, title: candidate.title, productUrl: "https://example.test/product" }] });
    expect(getExplicitFullVerificationRequest("laptop", { ...candidate, productUrl: null })).toBeNull();
  });

  it("renders the confirmed policy agreement above successful product cards", () => {
    const markup = renderToStaticMarkup(createElement(ProductListingsPanel, { state: { status: "live", listings: [listing("eligible")] }, policyAgreement: "Confirmed category, budget, delivery, and authority boundary." }));
    expect(markup).toContain("Confirmed policy agreement:");
    expect(markup).toContain("Confirmed category, budget, delivery, and authority boundary.");
  });
});
