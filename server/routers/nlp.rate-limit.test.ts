import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ recordProviderAudit: vi.fn().mockResolvedValue(false) }));

import { nlpRouter } from "./nlp";

describe("NLP provider rate limiting", () => {
  it("returns deterministic fallback when the real extraction provider reports 429", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 429 })));
    const caller = nlpRouter.createCaller({ user: null } as never);
    const result = await caller.extractBrief({ text: "Purchase 10 laptops with 16 GB RAM under ₹45,000 each." });
    expect(result).toMatchObject({ source: "deterministic_fallback", candidate: null });
    expect(result.message).toContain("rate-limited");
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("continues with deterministic extraction without calling Gemini when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const caller = nlpRouter.createCaller({ user: null } as never);
    const result = await caller.extractBrief({ text: "Purchase 10 laptops with 16 GB RAM under ₹45,000 each." });
    expect(result).toMatchObject({ source: "deterministic_fallback", candidate: null });
    expect(result.message).toContain("temporarily unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});
