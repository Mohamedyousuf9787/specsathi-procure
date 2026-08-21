import { describe, expect, it } from "vitest";
import { laptopDemoBrief } from "./generic-procurement";
import { resolveProductSearchFailure, resolveProductSearchSuccess } from "./product-search-outcome";

describe("Home product-search outcome flow", () => {
  it("uses deterministic Vendor A/B cards after a live-provider error for the confirmed laptop brief", () => {
    const outcome = resolveProductSearchFailure(laptopDemoBrief);
    expect(outcome).toMatchObject({ status: "live" });
    expect(outcome.message).toContain("deterministic Vendor A/B laptop challenge templates");
    expect(outcome.listings).toHaveLength(4);
  });

  it("uses deterministic Vendor A/B cards after an empty live result for the confirmed laptop brief", () => {
    const outcome = resolveProductSearchSuccess(laptopDemoBrief, { status: "live", message: "No live cards found.", listings: [] as Array<{ id: string }> });
    expect(outcome).toMatchObject({ status: "live" });
    expect(outcome.message).toContain("deterministic Vendor A/B laptop challenge templates");
    expect(outcome.listings).toHaveLength(4);
  });

  it("retains an ordinary provider error for a category without a deterministic challenge template", () => {
    expect(resolveProductSearchFailure({ ...laptopDemoBrief, productCategory: "office chair" })).toMatchObject({ status: "fallback", listings: [] });
  });
});
