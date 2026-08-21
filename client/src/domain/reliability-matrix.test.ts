import { describe, expect, it } from "vitest";
import { parseBuyingBrief } from "./brief-parser";
import { mouseDemoBrief } from "./generic-procurement";
import { genericLocalCatalog, LocalDemoVendorProvider, recordMarketplaceSearchOutcome, resolveVendorConfirmation, runGenericProcurement } from "./generic-vendor-flow";

const parsed = (source: string) => {
  const result = parseBuyingBrief(source);
  if (result.status !== "valid" || !result.normalizedBrief) throw new Error(`Expected a valid brief: ${source}`);
  return result.normalizedBrief;
};

describe("multi-condition procurement reliability matrix", () => {
  it("holds a valid specific-model request at confirmation with all local candidates retained", async () => {
    const session = await runGenericProcurement(mouseDemoBrief);
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.candidates).toHaveLength(3);
    expect(session.recommendation.selected?.offer.id).toBe("mouse-a-1");
    expect(session.audit.map(event => event.type)).toEqual(expect.arrayContaining(["VENDOR_SEARCHED", "OFFERS_COMPARED", "RECOMMENDATION_CREATED", "VENDOR_CONFIRMATION_REQUESTED"]));
  });

  it("does not search when a budget is absent and blocks non-purchase content", () => {
    expect(parseBuyingBrief("I need 1 wireless M185 mouse with 1000 DPI.").status).toBe("needs_clarification");
    expect(parseBuyingBrief("I want a funny story under ₹2,000 each.").status).toBe("invalid");
  });

  it("blocks an incompatible request without inventing a compliant offer", async () => {
    const impossible = { ...mouseDemoBrief, id: "mouse-impossible-sensor", hardRequirements: mouseDemoBrief.hardRequirements.map(requirement => requirement.key === "dpi" ? { ...requirement, value: 9000 } : requirement) };
    const session = await runGenericProcurement(impossible);
    expect(session.status).toBe("BLOCKED");
    expect(session.recommendation.selected).toBeUndefined();
    expect(session.recommendation.candidates).toHaveLength(3);
    expect(session.order).toBeUndefined();
  });

  it("holds an authority exception and re-evaluates a counter-offer before any simulated order", async () => {
    const constrained = { ...mouseDemoBrief, id: "mouse-authority-limit", authorizationLimitInr: 1200 };
    const pending = await runGenericProcurement(constrained);
    expect(pending.status).toBe("PENDING_APPROVAL");
    expect(pending.order).toBeUndefined();

    const confirming = await runGenericProcurement(mouseDemoBrief);
    const countered = resolveVendorConfirmation(confirming, "counter", { unitPriceInr: 2200, deliveryDays: 4 });
    expect(countered.status).toBe("CONFIRMING");
    expect(countered.order).toBeUndefined();
    expect(countered.audit.some(event => event.type === "OFFERS_REEVALUATED")).toBe(true);
    expect(countered.audit.some(event => event.type === "VENDOR_CONFIRMATION_REQUESTED")).toBe(true);
    expect(resolveVendorConfirmation(countered, "accept").status).toBe("PURCHASED");
  });

  it("re-ranks to Vendor B when Vendor A becomes unavailable without relaxing the request", async () => {
    const provider = new LocalDemoVendorProvider(genericLocalCatalog.map(offer => offer.id === "mouse-a-1" ? { ...offer, availability: "unavailable" as const, availableQuantity: 0 } : offer));
    const session = await runGenericProcurement(mouseDemoBrief, provider);
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.selected?.offer.vendorName).toBe("Vendor B");
    expect(session.recommendation.candidates.find(candidate => candidate.offer.id === "mouse-a-1")?.hardFailures).toContain("Vendor reported this offer unavailable");
  });

  it("keeps unsupported categories and marketplace fallback provenance explicit in the audit trail", async () => {
    const unsupported = await runGenericProcurement(parsed("Find 3 industrial reactors with corrosion shielding under ₹60,000 total."));
    expect(unsupported.status).toBe("BLOCKED");
    expect(unsupported.audit.some(event => event.type === "LOCAL_CATALOG_UNAVAILABLE")).toBe(true);

    const supported = await runGenericProcurement(mouseDemoBrief);
    const recorded = recordMarketplaceSearchOutcome(supported, { status: "fallback", listingCount: 0, message: "Provider timeout" });
    expect(recorded.audit.at(-1)?.detail).toContain("labelled deterministic Vendor A/B candidates remain available");
  });
});
