import { describe, expect, it } from "vitest";

describe("product-listing provider credentials", () => {
  it("validates the server-only Gemini and SerpAPI keys with lightweight provider requests", async () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const serpApiKey = process.env.SERPAPI_API_KEY;
    expect(geminiKey).toBeTruthy();
    expect(serpApiKey).toBeTruthy();

    const [geminiResponse, serpApiResponse] = await Promise.all([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey!)}`, { signal: AbortSignal.timeout(25_000) }),
      fetch(`https://serpapi.com/account.json?api_key=${encodeURIComponent(serpApiKey!)}`, { signal: AbortSignal.timeout(25_000) }),
    ]);

    expect(geminiResponse.ok).toBe(true);
    expect(serpApiResponse.ok).toBe(true);
  }, 30_000);
});
