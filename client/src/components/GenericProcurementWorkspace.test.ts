import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getSupportingSourcesDisclosure, SupportingEvidenceDisclosure } from "./GenericProcurementWorkspace";

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
});
