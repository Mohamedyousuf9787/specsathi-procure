import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GenericProcurementWorkspace, { getRecordedPolicyAgreement, getSupportingSourcesDisclosure, SupportingEvidenceDisclosure } from "./GenericProcurementWorkspace";
import { parseBuyingBrief } from "@/domain/brief-parser";
import { runGenericProcurement } from "@/domain/generic-vendor-flow";

describe("supporting sources disclosure", () => {
  it("keeps web evidence absent until present and renders supporting links closed by default", () => {
    expect(getSupportingSourcesDisclosure({ status: "idle", results: [] })).toBeNull();
    const state = { status: "live" as const, results: [{ title: "Evidence", url: "https://example.test", excerpt: "Context", relevance: 0.8 }] };
    expect(getSupportingSourcesDisclosure(state)).toEqual({ label: "Supporting sources only", title: "External web links do not replace marketplace product cards." });
    const markup = renderToStaticMarkup(createElement(SupportingEvidenceDisclosure, { state }));
    expect(markup).toContain("<details");
    expect(markup).not.toContain("<details open");
    expect(markup).toContain("Supporting sources only");
    expect(markup).toContain("External web links do not replace marketplace product cards.");
  });

  it("returns the requester policy agreement for the primary product-result surface", () => {
    const session = { audit: [{ type: "POLICY_AGREEMENT", summary: "Policy agreement recorded", detail: "Confirmed category, budget, delivery, and authority boundary." }] } as never;
    expect(getRecordedPolicyAgreement(session)).toBe("Confirmed category, budget, delivery, and authority boundary.");
  });

  it("explains an unsupported local category as a policy hold instead of rendering an empty comparison table", async () => {
    const parsed = parseBuyingBrief("Find 5 industrial reactors with corrosion shielding under ₹75,000 total.");
    if (parsed.status !== "valid" || !parsed.normalizedBrief) throw new Error("Expected a normalized unsupported industrial-reactor brief");
    const session = await runGenericProcurement(parsed.normalizedBrief);
    const markup = renderToStaticMarkup(createElement(GenericProcurementWorkspace, {
      session,
      onSessionChange: () => undefined,
      onNewBrief: () => undefined,
      onLoadMultiDemo: () => undefined,
      liveEvidence: { status: "fallback", results: [], message: "Live search unavailable" },
      productListings: { status: "fallback", listings: [], message: "Product listing search unavailable" },
      auditPersistence: "local",
    }));
    expect(markup).toContain("Policy is correctly paused — no local offer is available.");
    expect(markup).toContain("No local candidates were fabricated.");
    expect(markup).toContain("No labelled deterministic Vendor A/B catalog covers industrial-reactor");
  });
});
