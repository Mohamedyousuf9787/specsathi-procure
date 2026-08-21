import { describe, expect, it } from "vitest";

describe("Tavily provider boundary", () => {
  it("handles one bounded live-search provider response without exposing the key", async () => {
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
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
    const payload = await response.text();
    expect(payload).not.toContain(key);
    if (response.ok) expect(JSON.parse(payload).results).toBeInstanceOf(Array);
  }, 55_000);
});
