import { describe, expect, it } from "vitest";
import { parseBuyingBrief } from "./brief-parser";
import { furnitureDemoBrief, gpuDemoBrief, laptopDemoBrief, mobileDemoBrief, mouseDemoBrief } from "./generic-procurement";
import { genericLocalCatalog, LocalDemoVendorProvider, recordMarketplaceSearchOutcome, resolveGenericApproval, resolveVendorConfirmation, runGenericProcurement, runUnavailableTopVendorScenario } from "./generic-vendor-flow";

const valid = (text: string) => {
  const result = parseBuyingBrief(text);
  if (result.status !== "valid" || !result.normalizedBrief) throw new Error(`Expected valid brief: ${text}`);
  return result.normalizedBrief;
};

describe("generic local vendor flow", () => {
  it("holds a compliant laptop for explicit vendor confirmation after searching two simulated sources", async () => {
    const session = await runGenericProcurement(laptopDemoBrief);
    expect(session.status).toBe("CONFIRMING");
    expect(session.order).toBeUndefined();
    expect(session.audit.filter((event) => event.type === "VENDOR_SEARCHED")).toHaveLength(2);
    const confirmed = resolveVendorConfirmation(session, "accept");
    expect(confirmed.status).toBe("PURCHASED");
    expect(confirmed.order?.vendorName).toBe("Vendor A");
  });

  it("requests approval for a category-agnostic over-limit laptop and only orders after approval", async () => {
    const overLimit = { ...laptopDemoBrief, id: "laptop-over-limit", maxUnitPriceInr: 50000, authorizationLimitInr: 40000 };
    const pending = await runGenericProcurement(overLimit);
    expect(pending.status).toBe("PENDING_APPROVAL");
    expect(resolveGenericApproval(pending, false).order).toBeUndefined();
    expect(resolveGenericApproval(pending, true).status).toBe("PURCHASED");
  });

  it("holds compliant chair and monitor requests for vendor confirmation", async () => {
    expect((await runGenericProcurement(valid("Buy 20 ergonomic chairs with adjustable height under ₹10,000 each within 5 days."))).status).toBe("CONFIRMING");
    expect((await runGenericProcurement(valid("Find 5 27 inch QHD HDMI monitors under ₹25,000 each within 7 days."))).status).toBe("CONFIRMING");
  });

  it("evaluates curated mobile and furniture records through the same Vendor A/Vendor B policy boundary", async () => {
    const mobile = await runGenericProcurement(mobileDemoBrief);
    const furniture = await runGenericProcurement(furnitureDemoBrief);
    expect(mobile.status).toBe("CONFIRMING");
    expect(mobile.recommendation.selected?.offer.id).toBe("mobile-a-1");
    expect(furniture.status).toBe("CONFIRMING");
    expect(furniture.recommendation.selected?.offer.id).toBe("furniture-a-1");
  });

  it("ranks labelled tyre/model candidates and holds the selected tyre at vendor confirmation", async () => {
    const session = await runGenericProcurement(valid("I want 1 tubeless 205/55 R16 tyre for Honda City under ₹8,000 each within 4 days."));
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.candidates).toHaveLength(3);
    expect(session.recommendation.selected?.offer.id).toBe("tyre-a-1");
    expect(session.audit.some((event) => event.type === "OFFERS_COMPARED")).toBe(true);
  });

  it("ranks labelled mouse-model candidates, retains a non-compliant alternative, and holds the selected mouse for confirmation", async () => {
    const session = await runGenericProcurement(mouseDemoBrief);
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.candidates).toHaveLength(3);
    expect(session.recommendation.selected?.offer.id).toBe("mouse-a-1");
    expect(session.recommendation.candidates.find((candidate) => candidate.offer.id === "mouse-b-2")?.hardFailures).toContain("Missing or unverified requirement: Mouse model");
    expect(session.audit.some((event) => event.type === "OFFERS_COMPARED")).toBe(true);
    expect(resolveVendorConfirmation(session, "accept").status).toBe("PURCHASED");
  });

  it("ranks labelled GPU candidates for a zero-marketplace-card fallback and holds the compatible offer for confirmation", async () => {
    const session = await runGenericProcurement(gpuDemoBrief);
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.candidates).toHaveLength(3);
    expect(session.recommendation.selected?.offer.id).toBe("gpu-a-1");
    expect(session.recommendation.candidates.find((candidate) => candidate.offer.id === "gpu-b-2")?.hardFailures).toContain("Missing or unverified requirement: GPU model");
    const recorded = recordMarketplaceSearchOutcome(session, { status: "fallback", listingCount: 0, message: "No cards returned" });
    expect(recorded.audit.at(-1)?.detail).toContain("3 labelled deterministic Vendor A/B candidates remain available");
  });

  it("re-ranks a monitor when the top vendor becomes unavailable", async () => {
    const provider = new LocalDemoVendorProvider(genericLocalCatalog.map((offer) => offer.id === "monitor-a-generic" ? { ...offer, availableQuantity: 0, availability: "unavailable" as const } : offer));
    const session = await runGenericProcurement(valid("Find 5 27 inch QHD HDMI monitors under ₹25,000 each within 7 days."), provider);
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.selected?.offer.vendorName).toBe("Vendor B");
  });

  it("fails a category outside the common-goods catalog safely after searching both sources", async () => {
    const session = await runGenericProcurement(valid("Find 5 industrial reactors with corrosion shielding under ₹75,000 total."));
    expect(session.status).toBe("BLOCKED");
    expect(session.order).toBeUndefined();
    expect(session.audit.filter((event) => event.type === "VENDOR_SEARCHED")).toHaveLength(2);
    expect(session.audit.some((event) => event.type === "LOCAL_CATALOG_UNAVAILABLE")).toBe(true);
    expect(session.recommendation.reason).toContain("No labelled deterministic Vendor A/B catalog");
  });

  it("records marketplace fallback provenance without falsely claiming local coverage for unsupported categories", async () => {
    const session = await runGenericProcurement(valid("Find 5 industrial reactors with corrosion shielding under ₹75,000 total."));
    const recorded = recordMarketplaceSearchOutcome(session, { status: "fallback", listingCount: 0, message: "Product listing search is unavailable." });
    const event = recorded.audit.at(-1);
    expect(event?.type).toBe("MARKETPLACE_FALLBACK");
    expect(event?.detail).toContain("No labelled deterministic Vendor A/B catalog covers");
    expect(event?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("records the count and safe next action for incomplete live marketplace cards", async () => {
    const session = await runGenericProcurement(mouseDemoBrief);
    const recorded = recordMarketplaceSearchOutcome(session, { status: "live", listingCount: 8, unverifiedListingCount: 3 });
    const event = recorded.audit.at(-1);
    expect(event?.type).toBe("MARKETPLACE_RESULTS_RECEIVED");
    expect(event?.detail).toContain("3 cards are incomplete");
    expect(event?.detail).toContain("explicit page or seller verification");
  });

  it("returns to approval when generic vendor terms change during confirmation", async () => {
    const pending = await runGenericProcurement({ ...laptopDemoBrief, id: "laptop-changed-terms", maxUnitPriceInr: 50000, authorizationLimitInr: 40000 });
    const changed = resolveGenericApproval(pending, true, { unitPriceInr: 47000 });
    expect(changed.status).toBe("PENDING_APPROVAL");
    expect(changed.order).toBeUndefined();
    expect(changed.audit.some((event) => event.type === "TERMS_CHANGED")).toBe(true);
  });

  it("re-evaluates a vendor counter-offer and pauses again when it crosses authority", async () => {
    const session = await runGenericProcurement({ ...laptopDemoBrief, maxUnitPriceInr: 50000, authorizationLimitInr: 45000 });
    const countered = resolveVendorConfirmation(session, "counter", { unitPriceInr: 47000, deliveryDays: 4 });
    expect(countered.status).toBe("PENDING_APPROVAL");
    expect(countered.order).toBeUndefined();
    expect(countered.audit.some((event) => event.type === "VENDOR_COUNTER_OFFER")).toBe(true);
    expect(countered.audit.some((event) => event.type === "OFFERS_REEVALUATED")).toBe(true);
  });

  it("provides a named unavailable-top-vendor scenario that re-ranks to the next eligible offer", async () => {
    const session = await runUnavailableTopVendorScenario();
    expect(session.scenario).toBe("unavailable-top-vendor");
    expect(session.recommendation.selected?.offer.vendorName).toBe("Vendor B");
    expect(session.recommendation.candidates.find((candidate) => candidate.offer.id === "laptop-a-1")?.hardFailures).toContain("Vendor reported this offer unavailable");
    expect(session.audit.some((event) => event.type === "TOP_VENDOR_UNAVAILABLE")).toBe(true);
  });
});
