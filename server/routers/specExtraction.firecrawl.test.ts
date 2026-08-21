import { describe, expect, it } from "vitest";

describe("Firecrawl primary credential health", () => {
  it("can complete a lightweight server-side scrape request without returning the credential", async () => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    expect(apiKey).toBeTruthy();
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://example.com", formats: ["markdown"] }), signal: AbortSignal.timeout(40_000) });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { success?: boolean };
    expect(payload.success).toBe(true);
  }, 50_000);

  it("validates the fallback credential independently without returning the credential", async () => {
    const apiKey = process.env.FIRECRAWL_FALLBACK_API_KEY;
    expect(apiKey).toBeTruthy();
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://example.com", formats: ["markdown"] }), signal: AbortSignal.timeout(40_000) });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { success?: boolean };
    expect(payload.success).toBe(true);
  }, 50_000);
});
