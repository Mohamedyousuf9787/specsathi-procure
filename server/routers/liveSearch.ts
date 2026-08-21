import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { recordProviderAudit } from "../db";

const rawResultSchema = z.object({ title: z.string().default("Untitled result"), url: z.string().url(), content: z.string().default(""), score: z.number().optional() });
const tavilyResponseSchema = z.object({ query: z.string(), response_time: z.number().optional(), results: z.array(rawResultSchema).max(10) });

export type LiveEvidence = { title: string; url: string; excerpt: string; relevance: number | null };

export function normalizeTavilyEvidence(response: z.infer<typeof tavilyResponseSchema>): LiveEvidence[] {
  return response.results.map((result) => ({ title: result.title, url: result.url, excerpt: result.content.replace(/\s+/g, " ").trim().slice(0, 600), relevance: result.score ?? null }));
}

export const liveSearchRouter = router({
  searchEvidence: publicProcedure.input(z.object({ query: z.string().trim().min(5).max(600) })).mutation(async ({ input, ctx }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "local", outcome: "fallback", summary: "Live evidence was not configured; local vendors retained.", metadata: { inputLength: input.query.length } });
      return { status: "fallback" as const, provider: "local" as const, results: [] as LiveEvidence[], message: "Live vendor evidence is not configured. Local Vendor A and Vendor B remain active." };
    }
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: input.query, search_depth: "basic", max_results: 5, include_answer: false, include_raw_content: false, topic: "general" }),
        signal: AbortSignal.timeout(12_000),
      });
      if (response.status === 429) {
        await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "local", outcome: "fallback", summary: "Live evidence was rate-limited; local vendors retained.", metadata: { inputLength: input.query.length } });
        return { status: "fallback" as const, provider: "local" as const, results: [] as LiveEvidence[], message: "Live web evidence is rate-limited. Local Vendor A and Vendor B remain active." };
      }
      if (!response.ok) throw new Error(`Tavily returned ${response.status}`);
      const evidence = normalizeTavilyEvidence(tavilyResponseSchema.parse(await response.json()));
      await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "tavily", outcome: "success", summary: "Live web evidence was retrieved.", metadata: { inputLength: input.query.length, resultCount: evidence.length } });
      return { status: "live" as const, provider: "tavily" as const, results: evidence, message: "Live web evidence was added. Price, quantity, delivery, and return terms remain unverified until a compliant offer record is confirmed." };
    } catch (error) {
      console.warn("[Live search] Provider unavailable; local fallback retained.", error instanceof Error ? error.message : error);
      await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "local", outcome: "fallback", summary: "Live evidence was unavailable; local vendors retained.", metadata: { inputLength: input.query.length } });
      return { status: "fallback" as const, provider: "local" as const, results: [] as LiveEvidence[], message: "Live web evidence is unavailable. Local Vendor A and Vendor B remain active." };
    }
  }),
});
