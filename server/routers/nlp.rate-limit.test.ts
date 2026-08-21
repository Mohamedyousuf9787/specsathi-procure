import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ recordProviderAudit: vi.fn().mockResolvedValue(false) }));

import { nlpRouter } from "./nlp";

describe("NLP provider rate limiting", () => {
  it("returns deterministic fallback when the real extraction provider reports 429", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 429 })));
    const caller = nlpRouter.createCaller({ user: null } as never);
    const result = await caller.extractBrief({ text: "Purchase 10 laptops with 16 GB RAM under ₹45,000 each." });
    expect(result).toMatchObject({ source: "deterministic_fallback", candidate: null });
    expect(result.message).toContain("rate-limited");
    vi.unstubAllGlobals();
  });
});
