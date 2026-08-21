import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

type ServiceState = "Operational" | "Degraded" | "Unavailable" | "Not configured";
export type SystemServiceStatus = {
  id: string;
  label: string;
  state: ServiceState;
  detail: string;
  checkedAt: string;
};

const checkedAt = () => new Date().toISOString();
const configured = (id: string, label: string, detail: string): SystemServiceStatus => ({ id, label, state: "Not configured", detail, checkedAt: checkedAt() });
const result = (id: string, label: string, state: ServiceState, detail: string): SystemServiceStatus => ({ id, label, state, detail, checkedAt: checkedAt() });

async function checkHttpProvider({ id, label, url, configuredMessage }: { id: string; label: string; url: string; configuredMessage: string }) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) return result(id, label, response.status === 429 ? "Degraded" : "Unavailable", response.status === 429 ? "Provider rate limit reached; the application will use its safe fallback." : `Provider returned HTTP ${response.status}.`);
  return result(id, label, "Operational", configuredMessage);
}

async function checkGemini(): Promise<SystemServiceStatus> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return configured("ai", "AI service", "No server-side Gemini API key is configured; deterministic extraction remains available.");
  try {
    return await checkHttpProvider({ id: "ai", label: "AI service", url: `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(apiKey)}`, configuredMessage: "Gemini model listing responded successfully." });
  } catch {
    return result("ai", "AI service", "Unavailable", "Gemini could not be reached within the status-check timeout.");
  }
}

async function checkSerpApi(): Promise<SystemServiceStatus> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return configured("serpapi", "SerpAPI", "No server-side SerpAPI key is configured; product search will report an explicit fallback.");
  try {
    return await checkHttpProvider({ id: "serpapi", label: "SerpAPI", url: `https://serpapi.com/account.json?api_key=${encodeURIComponent(apiKey)}`, configuredMessage: "SerpAPI account endpoint responded successfully." });
  } catch {
    return result("serpapi", "SerpAPI", "Unavailable", "SerpAPI could not be reached within the status-check timeout.");
  }
}

async function checkTavily(): Promise<SystemServiceStatus> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return configured("tavily", "Supporting web evidence", "No server-side Tavily key is configured; supporting web evidence remains optional.");
  try {
    const response = await fetch("https://api.tavily.com/search", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: "status", search_depth: "basic", max_results: 1, include_answer: false }), signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return result("tavily", "Supporting web evidence", response.status === 429 ? "Degraded" : "Unavailable", response.status === 429 ? "Supporting evidence is rate-limited; product cards remain the source of procurement facts." : `Provider returned HTTP ${response.status}.`);
    return result("tavily", "Supporting web evidence", "Operational", "Supporting evidence search responded successfully.");
  } catch {
    return result("tavily", "Supporting web evidence", "Unavailable", "Supporting evidence search could not be reached within the status-check timeout.");
  }
}

async function checkFirecrawl(): Promise<SystemServiceStatus> {
  if (!process.env.FIRECRAWL_API_KEY && !process.env.FIRECRAWL_FALLBACK_API_KEY) return configured("firecrawl", "Firecrawl", "No server-side Firecrawl key is configured; page verification will remain explicitly unavailable.");
  return result("firecrawl", "Firecrawl", "Degraded", "A Firecrawl key is configured. Page verification validates the provider during an explicit product-page request.");
}

async function checkDatabase(): Promise<SystemServiceStatus> {
  if (!process.env.DATABASE_URL) return configured("database", "Storage / database", "DATABASE_URL is not configured; local session data remains available.");
  try {
    const db = await getDb();
    if (!db) return result("database", "Storage / database", "Unavailable", "The database client could not be initialized.");
    await db.execute(sql`select 1`);
    return result("database", "Storage / database", "Operational", "Database connectivity check succeeded.");
  } catch {
    return result("database", "Storage / database", "Unavailable", "Database connectivity check failed; local records remain available.");
  }
}

export const statusRouter = router({
  get: publicProcedure.query(async () => {
    const checks = await Promise.all([
      Promise.resolve(result("frontend", "Frontend", "Operational", "The application status endpoint is reachable.")),
      Promise.resolve(result("backend", "Backend / server", "Operational", "The server responded to this status request.")),
      checkGemini(),
      checkSerpApi(),
      checkTavily(),
      checkFirecrawl(),
      Promise.resolve(result("comparison", "Vendor comparison", "Operational", "Requirement matching and scoring run in the application code.")),
      Promise.resolve(result("export", "Export functionality", "Operational", "JSON, CSV, and PDF exports are available in the client workflow.")),
      checkDatabase(),
    ]);
    return { checkedAt: checkedAt(), services: checks };
  }),
});
