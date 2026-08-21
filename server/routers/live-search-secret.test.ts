import { describe, expect, it } from "vitest";

describe("Tavily credential health", () => {
  it("authenticates with one bounded live-search request without exposing the key", async () => {
    const key = process.env.TAVILY_API_KEY;
    expect(key).toBeTruthy();
    let response: Response | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 2 && !response; attempt += 1) {
      try {
        response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: "Tavily API", search_depth: "basic", max_results: 1, include_answer: false, include_raw_content: false }),
          signal: AbortSignal.timeout(25_000),
        });
      } catch (error) {
        lastError = error;
      }
    }
    if (!response) throw lastError;
    expect(response.ok).toBe(true);
    expect((await response.json()).results).toBeInstanceOf(Array);
  }, 55_000);
});
