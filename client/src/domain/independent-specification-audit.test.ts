import { describe, expect, it } from "vitest";
import { parseBuyingBrief } from "./brief-parser";
import { mobileDemoBrief } from "./generic-procurement";
import { recordMarketplaceSearchOutcome, resolveVendorConfirmation, runGenericProcurement } from "./generic-vendor-flow";

const parsed = (source: string) => {
  const result = parseBuyingBrief(source);
  if (result.status !== "valid" || !result.normalizedBrief) throw new Error(`Expected a valid brief: ${source}`);
  return result.normalizedBrief;
};

describe("independent overall-specification audit", () => {
  it("keeps an offer exactly at the authority boundary in confirmation, then records only a simulated purchase after explicit acceptance", async () => {
    const session = await runGenericProcurement({
      ...mobileDemoBrief,
      id: "audit-exact-authority",
      quantity: 1,
      maxUnitPriceInr: 19900,
      authorizationLimitInr: 19900,
    });
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.selected?.offer.id).toBe("mobile-a-1");

    const accepted = resolveVendorConfirmation(session, "accept");
    expect(accepted.status).toBe("PURCHASED");
    expect(accepted.order).toMatchObject({ vendorName: "Vendor A", totalInr: 19900 });
    expect(accepted.audit.at(-1)).toMatchObject({ type: "MOCK_PURCHASE_CONFIRMED", detail: "No real payment was created." });
  });

  it("blocks a request when every otherwise compatible mobile offer breaches the confirmed batch-total cap", async () => {
    const session = await runGenericProcurement({
      ...mobileDemoBrief,
      id: "audit-total-cap",
      quantity: 2,
      maxUnitPriceInr: 22000,
      maxTotalPriceInr: 39000,
      authorizationLimitInr: 22000,
    });
    expect(session.status).toBe("BLOCKED");
    expect(session.order).toBeUndefined();
    expect(session.recommendation.candidates.filter(candidate => candidate.hardFailures.some(failure => failure.includes("Batch total exceeds")))).toHaveLength(2);
  });

  it("does not create an order when the requester rejects final vendor terms", async () => {
    const session = await runGenericProcurement({ ...mobileDemoBrief, id: "audit-reject-terms", quantity: 1 });
    const rejected = resolveVendorConfirmation(session, "reject");
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.order).toBeUndefined();
    expect(rejected.audit.at(-1)?.type).toBe("VENDOR_CONFIRMATION_REJECTED");
  });

  it("preserves the portable-printer qualifier in the lazy common-goods fallback and records both simulated sources", async () => {
    const brief = parsed("Find 3 portable printers with duplex printing under ₹20,000 each within 5 days.");
    const session = await runGenericProcurement(brief);
    expect(session.status).toBe("CONFIRMING");
    expect(session.recommendation.candidates).toHaveLength(2);
    expect(session.recommendation.candidates.map(candidate => candidate.offer.productName)).toEqual([
      "Vendor A · Portable Printer template",
      "Vendor B · Portable Printer template",
    ]);
    expect(session.recommendation.candidates.every(candidate => candidate.offer.sourceType === "simulated")).toBe(true);
  });

  it("keeps incomplete marketplace cards outside the local recommendation and writes the explicit verification boundary to the audit", async () => {
    const session = await runGenericProcurement({ ...mobileDemoBrief, id: "audit-marketplace-separation", quantity: 1 });
    const recorded = recordMarketplaceSearchOutcome(session, { status: "live", listingCount: 12, unverifiedListingCount: 12 });
    const marketplaceEvent = recorded.audit.at(-1);
    expect(marketplaceEvent?.type).toBe("MARKETPLACE_RESULTS_RECEIVED");
    expect(marketplaceEvent?.detail).toContain("12 cards are incomplete");
    expect(marketplaceEvent?.detail).toContain("explicit page or seller verification");
    expect(recorded.recommendation.selected?.offer.sourceType).toBe("simulated");
  });
});
