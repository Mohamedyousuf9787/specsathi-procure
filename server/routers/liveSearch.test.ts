import { afterEach, describe, expect, it, vi } from "vitest";
import { liveSearchRouter, normalizeTavilyEvidence } from "./liveSearch";

describe("live vendor evidence adapter", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("keeps only normalized source evidence and does not turn search snippets into purchasable offers", () => {
    const evidence = normalizeTavilyEvidence({ query: "business laptop 16 GB", response_time: 0.4, results: [{ title: "Example vendor", url: "https://example.com/laptop", content: "A long listing description.", score: 0.92 }] });
    expect(evidence).toEqual([{ title: "Example vendor", url: "https://example.com/laptop", excerpt: "A long listing description.", relevance: 0.92 }]);
    expect(evidence[0]).not.toHaveProperty("unitPriceInr");
  });

  it("returns the local fallback when the provider times out or fails", async () => {
    const previous = process.env.TAVILY_API_KEY;
    process.env.TAVILY_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("provider timeout"); }));
    const caller = liveSearchRouter.createCaller({} as never);
    const result = await caller.searchEvidence({ query: "business laptop 16 GB RAM" });
    expect(result).toMatchObject({ status: "fallback", provider: "local", results: [] });
    process.env.TAVILY_API_KEY = previous;
  });
  it("returns the local fallback when the provider rate-limits a request", async () => {
    const previous = process.env.TAVILY_API_KEY;
    process.env.TAVILY_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 429 })));
    const caller = liveSearchRouter.createCaller({} as never);
    const result = await caller.searchEvidence({ query: "business laptop 16 GB RAM" });
    expect(result).toMatchObject({ status: "fallback", provider: "local" });
    expect(result.message).toContain("rate-limited");
    process.env.TAVILY_API_KEY = previous;
  });
});
