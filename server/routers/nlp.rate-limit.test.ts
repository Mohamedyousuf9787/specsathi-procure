import { describe, expect, it, vi } from "vitest";

vi.mock("../_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("../db", () => ({ recordProviderAudit: vi.fn().mockResolvedValue(false) }));

import { invokeLLM } from "../_core/llm";
import { nlpRouter } from "./nlp";

describe("NLP provider rate limiting", () => {
  it("returns deterministic fallback when the real extraction provider reports 429", async () => {
    vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("provider returned 429 rate limit"));
    const caller = nlpRouter.createCaller({ user: null } as never);
    const result = await caller.extractBrief({ text: "Purchase 10 laptops with 16 GB RAM under ₹45,000 each." });
    expect(result).toMatchObject({ source: "deterministic_fallback", candidate: null });
    expect(result.message).toContain("rate-limited");
  });
});
