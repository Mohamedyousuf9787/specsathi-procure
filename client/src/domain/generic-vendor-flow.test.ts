import { describe, expect, it } from "vitest";
import { parseBuyingBrief } from "./brief-parser";
import { laptopDemoBrief } from "./generic-procurement";
import { resolveGenericApproval, runGenericProcurement } from "./generic-vendor-flow";

const valid = (text: string) => {
  const result = parseBuyingBrief(text);
  if (result.status !== "valid" || !result.normalizedBrief) throw new Error(`Expected valid brief: ${text}`);
  return result.normalizedBrief;
};

describe("generic local vendor flow", () => {
  it("auto-purchases a compliant laptop through two simulated vendor sources", async () => {
    const session = await runGenericProcurement(laptopDemoBrief);
    expect(session.status).toBe("PURCHASED");
    expect(session.order?.vendorName).toBe("Vendor A");
    expect(session.audit.filter((event) => event.type === "VENDOR_SEARCHED")).toHaveLength(2);
  });

  it("requests approval for a category-agnostic over-limit laptop and only orders after approval", async () => {
    const overLimit = { ...laptopDemoBrief, id: "laptop-over-limit", maxUnitPriceInr: 50000, authorizationLimitInr: 40000 };
    const pending = await runGenericProcurement(overLimit);
    expect(pending.status).toBe("PENDING_APPROVAL");
    expect(resolveGenericApproval(pending, false).order).toBeUndefined();
    expect(resolveGenericApproval(pending, true).status).toBe("PURCHASED");
  });

  it("auto-purchases a compliant chair and supports a monitor request", async () => {
    expect((await runGenericProcurement(valid("Buy 20 ergonomic chairs with adjustable height under ₹10,000 each within 5 days."))).status).toBe("PURCHASED");
    expect((await runGenericProcurement(valid("Find 5 27 inch QHD HDMI monitors under ₹25,000 each within 7 days."))).status).toBe("PURCHASED");
  });

  it("fails an unknown category safely after searching both sources", async () => {
    const session = await runGenericProcurement(valid("Find 5 office printers with duplex printing under ₹75,000 total."));
    expect(session.status).toBe("BLOCKED");
    expect(session.order).toBeUndefined();
    expect(session.audit.filter((event) => event.type === "VENDOR_SEARCHED")).toHaveLength(2);
  });

  it("returns to approval when generic vendor terms change during confirmation", async () => {
    const pending = await runGenericProcurement({ ...laptopDemoBrief, id: "laptop-changed-terms", maxUnitPriceInr: 50000, authorizationLimitInr: 40000 });
    const changed = resolveGenericApproval(pending, true, { unitPriceInr: 47000 });
    expect(changed.status).toBe("PENDING_APPROVAL");
    expect(changed.order).toBeUndefined();
    expect(changed.audit.some((event) => event.type === "TERMS_CHANGED")).toBe(true);
  });
});
