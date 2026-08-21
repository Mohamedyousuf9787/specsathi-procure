import { describe, expect, it } from "vitest";

async function fetchWithOneTransientRetry(url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(25_000) });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

describe("product-listing provider credentials", () => {
  it("validates the server-only Gemini and SerpAPI keys with lightweight provider requests", async () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const serpApiKey = process.env.SERPAPI_API_KEY;
    expect(geminiKey).toBeTruthy();
    expect(serpApiKey).toBeTruthy();

    const [geminiResponse, serpApiResponse] = await Promise.all([
      fetchWithOneTransientRetry(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey!)}`),
      fetchWithOneTransientRetry(`https://serpapi.com/account.json?api_key=${encodeURIComponent(serpApiKey!)}`),
    ]);

    expect(geminiResponse.ok).toBe(true);
    expect(serpApiResponse.ok).toBe(true);
  }, 55_000);
});
