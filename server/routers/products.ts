import { z } from "zod";
import { recordProviderAudit } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const shoppingResultSchema = z.object({
  position: z.number().optional(), title: z.string().default("Untitled product"), source: z.string().optional(), price: z.string().optional(), extracted_price: z.number().optional(), rating: z.number().optional(), reviews: z.number().optional(), thumbnail: z.string().url().optional(), product_link: z.string().url().optional(), link: z.string().url().optional(), delivery: z.string().optional(), availability: z.string().optional(),
});
const shoppingResponseSchema = z.object({ shopping_results: z.array(shoppingResultSchema).default([]) });

export type ProductListing = { id: string; title: string; merchant: string | null; priceText: string | null; priceInr: number | null; rating: number | null; reviews: number | null; imageUrl: string | null; productUrl: string | null; delivery: string | null; availability: string | null; completeness: "complete" | "unverified"; policy: "eligible" | "approval_needed" | "blocked" | "unverified" };

export function normalizeShoppingResults(payload: z.infer<typeof shoppingResponseSchema>, maxUnitPriceInr?: number, authorizationLimitInr?: number): ProductListing[] {
  return payload.shopping_results.slice(0, 12).map((item, index) => {
    const priceInr = typeof item.extracted_price === "number" && item.extracted_price > 0 ? Math.round(item.extracted_price) : null;
    const merchant = item.source ?? null;
    const productUrl = item.product_link ?? item.link ?? null;
    const availability = item.availability?.trim() || null;
    const completeness = priceInr && merchant && productUrl && availability ? "complete" : "unverified" as const;
    const unavailable = Boolean(availability && /out of stock|unavailable|sold out/i.test(availability));
    const policy = completeness === "unverified" ? "unverified" as const : unavailable || (maxUnitPriceInr && priceInr !== null && priceInr > maxUnitPriceInr) ? "blocked" as const : authorizationLimitInr && priceInr !== null && priceInr > authorizationLimitInr ? "approval_needed" as const : "eligible" as const;
    return { id: `serp-${item.position ?? index + 1}-${item.title.slice(0, 36).replace(/[^a-z0-9]/gi, "-").toLowerCase()}`, title: item.title, merchant, priceText: item.price ?? null, priceInr, rating: item.rating ?? null, reviews: item.reviews ?? null, imageUrl: item.thumbnail ?? null, productUrl, delivery: item.delivery ?? null, availability, completeness, policy };
  });
}

export const productsRouter = router({
  search: publicProcedure.input(z.object({ query: z.string().trim().min(3).max(600), maxUnitPriceInr: z.number().int().positive().max(100000000).optional(), authorizationLimitInr: z.number().int().positive().max(100000000).optional() })).mutation(async ({ input, ctx }) => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) return { status: "fallback" as const, listings: [] as ProductListing[], message: "Product listing search is not configured. Local Vendor A and Vendor B remain active." };
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.search = new URLSearchParams({ engine: "google_shopping", q: input.query, gl: "in", hl: "en", api_key: apiKey }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (response.status === 429) return { status: "fallback" as const, listings: [] as ProductListing[], message: "Product listing search is rate-limited. Local Vendor A and Vendor B remain active." };
      if (!response.ok) throw new Error(`SerpAPI returned ${response.status}`);
      const listings = normalizeShoppingResults(shoppingResponseSchema.parse(await response.json()), input.maxUnitPriceInr, input.authorizationLimitInr);
      await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "serpapi", outcome: "success", summary: "Shopping product listings were retrieved.", metadata: { inputLength: input.query.length, resultCount: listings.length } });
      return { status: "live" as const, listings, message: "Live product listings are marketplace records. Price, stock, delivery, and returns still require confirmation before they become eligible offers." };
    } catch (error) {
      await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "local", outcome: "fallback", summary: "Shopping listings were unavailable; local vendors retained.", metadata: { inputLength: input.query.length } });
      return { status: "fallback" as const, listings: [] as ProductListing[], message: "Product listing search is unavailable. Local Vendor A and Vendor B remain active." };
    }
  }),
});
