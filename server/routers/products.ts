import { z } from "zod";
import { recordProviderAudit } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const shoppingResultSchema = z.object({
  position: z.number().optional(), title: z.string().default("Untitled product"), source: z.string().optional(), price: z.string().optional(), extracted_price: z.number().optional(), rating: z.number().optional(), reviews: z.number().optional(), thumbnail: z.string().url().optional(), product_link: z.string().url().optional(), link: z.string().url().optional(), delivery: z.string().optional(), availability: z.string().optional(), extensions: z.array(z.string()).optional(),
});
const shoppingResponseSchema = z.object({ shopping_results: z.array(shoppingResultSchema).default([]) });
const PRODUCT_SEARCH_TIMEOUT_MS = 25_000;
const PRODUCT_SEARCH_CACHE_TTL_MS = 60_000;
const PRODUCT_SEARCH_CACHE_MAX_ENTRIES = 50;

export type ProductListing = { id: string; title: string; merchant: string | null; priceText: string | null; priceInr: number | null; rating: number | null; reviews: number | null; imageUrl: string | null; productUrl: string | null; delivery: string | null; availability: string | null; completeness: "complete" | "unverified"; policy: "eligible" | "approval_needed" | "blocked" | "unverified"; specificationProfile: "laptop" | "motorcycle" | "generic"; specifications: Array<{ label: string; value: string }> };
type ProductSearchResponse = { status: "live" | "fallback"; listings: ProductListing[]; message: string };
type ProductSearchInput = { query: string; category: string; maxUnitPriceInr?: number; authorizationLimitInr?: number };

const productSearchCache = new Map<string, { expiresAt: number; response: ProductSearchResponse }>();
const productSearchInFlight = new Map<string, Promise<ProductSearchResponse>>();

export function productSearchCacheKey(input: ProductSearchInput) {
  return [input.query.trim().toLowerCase(), input.category.trim().toLowerCase(), input.maxUnitPriceInr ?? "", input.authorizationLimitInr ?? ""].join("|");
}

export function clearProductSearchCacheForTests() {
  productSearchCache.clear();
  productSearchInFlight.clear();
}

function cacheLiveProductSearch(cacheKey: string, response: ProductSearchResponse) {
  if (!productSearchCache.has(cacheKey) && productSearchCache.size >= PRODUCT_SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = productSearchCache.keys().next().value;
    if (oldestKey) productSearchCache.delete(oldestKey);
  }
  productSearchCache.set(cacheKey, { expiresAt: Date.now() + PRODUCT_SEARCH_CACHE_TTL_MS, response });
}

const captureFastValue = (text: string, expression: RegExp) => {
  const value = text.match(expression)?.[1]?.replace(/\s+/g, " ").trim();
  return value && value.length <= 72 && !/https?:|www\./i.test(value) ? value : null;
};
const fastProfile = (category: string, title: string): ProductListing["specificationProfile"] => /laptop|notebook|ultrabook|macbook/i.test(`${category} ${title}`) ? "laptop" : /motorcycle|motorbike|motor bike|bike\b|scooter/i.test(`${category} ${title}`) ? "motorcycle" : "generic";
const addFast = (target: Array<{ label: string; value: string }>, label: string, value: string | null) => { if (value && !target.some(specification => specification.label === label)) target.push({ label, value }); };

export function normalizeFastMarketplaceSpecifications(category: string, title: string, extensions: string[] = []) {
  const profile = fastProfile(category, title);
  const text = `${title} ${extensions.join(" ")}`.replace(/\s+/g, " ");
  const specifications: Array<{ label: string; value: string }> = [];
  if (profile === "laptop") {
    addFast(specifications, "RAM", captureFastValue(text, /(\d+(?:\.\d+)?\s*GB(?:\s*(?:DDR[345]|LPDDR[45]))?(?:\s*RAM)?)/i));
    addFast(specifications, "Storage", captureFastValue(text, /(\d+(?:\.\d+)?\s*(?:GB|TB)\s*(?:SSD|HDD|NVMe))/i));
    addFast(specifications, "Processor", captureFastValue(text, /((?:Intel\s+(?:Core|Ultra)\s+[A-Za-z0-9\-]+|AMD\s+Ryzen\s+[A-Za-z0-9\-]+|Apple\s+M\d(?:\s*(?:Pro|Max))?))/i));
    addFast(specifications, "Graphics", captureFastValue(text, /((?:NVIDIA\s+)?(?:GeForce\s+)?RTX\s*\d{3,4}(?:\s*(?:Ti|Super))?|Radeon\s+RX\s*\d{3,4}|Intel\s+(?:Arc|Iris)\s*[A-Za-z0-9\-]*)/i));
    addFast(specifications, "Display", captureFastValue(text, /(\d{2}(?:\.\d+)?\s*(?:inch|in)\s*(?:FHD|QHD|UHD|OLED|IPS)?)/i));
  } else if (profile === "motorcycle") {
    addFast(specifications, "Engine", captureFastValue(text, /(\d+(?:\.\d+)?\s*cc)/i));
    addFast(specifications, "Mileage", captureFastValue(text, /(\d+(?:\.\d+)?\s*(?:kmpl|km\/l|km per litre))/i));
    addFast(specifications, "Fuel tank", captureFastValue(text, /(?:fuel tank|tank capacity)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:litres?|l))/i));
    addFast(specifications, "Brakes", captureFastValue(text, /((?:dual|single)?\s*(?:channel\s*)?ABS|disc brakes?)/i));
  } else {
    addFast(specifications, "Capacity", captureFastValue(text, /(\d+(?:\.\d+)?\s*(?:GB|TB|ml|litres?|L|kg))/i));
  }
  return { specificationProfile: profile, specifications: specifications.slice(0, 4) };
}

export function normalizeShoppingResults(payload: z.infer<typeof shoppingResponseSchema>, maxUnitPriceInr?: number, authorizationLimitInr?: number, category = ""): ProductListing[] {
  return payload.shopping_results.slice(0, 12).map((item, index) => {
    const priceInr = typeof item.extracted_price === "number" && item.extracted_price > 0 ? Math.round(item.extracted_price) : null;
    const merchant = item.source ?? null;
    const productUrl = item.product_link ?? item.link ?? null;
    const availability = item.availability?.trim() || null;
    const completeness = priceInr && merchant && productUrl && availability ? "complete" : "unverified" as const;
    const unavailable = Boolean(availability && /out of stock|unavailable|sold out/i.test(availability));
    const policy = completeness === "unverified" ? "unverified" as const : unavailable || (maxUnitPriceInr && priceInr !== null && priceInr > maxUnitPriceInr) ? "blocked" as const : authorizationLimitInr && priceInr !== null && priceInr > authorizationLimitInr ? "approval_needed" as const : "eligible" as const;
    const fastSpecifications = normalizeFastMarketplaceSpecifications(category, item.title, item.extensions);
    return { id: `serp-${item.position ?? index + 1}-${item.title.slice(0, 36).replace(/[^a-z0-9]/gi, "-").toLowerCase()}`, title: item.title, merchant, priceText: item.price ?? null, priceInr, rating: item.rating ?? null, reviews: item.reviews ?? null, imageUrl: item.thumbnail ?? null, productUrl, delivery: item.delivery ?? null, availability, completeness, policy, ...fastSpecifications };
  });
}

export const productsRouter = router({
  search: publicProcedure.input(z.object({ query: z.string().trim().min(3).max(600), category: z.string().trim().min(1).max(100), maxUnitPriceInr: z.number().int().positive().max(100000000).optional(), authorizationLimitInr: z.number().int().positive().max(100000000).optional() })).mutation(async ({ input, ctx }) => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) return { status: "fallback" as const, listings: [] as ProductListing[], message: "Product listing search is not configured. Local Vendor A and Vendor B remain active." };
    const cacheKey = productSearchCacheKey(input);
    const cached = productSearchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.response;
    if (cached) productSearchCache.delete(cacheKey);
    const pending = productSearchInFlight.get(cacheKey);
    if (pending) return await pending;
    const request = (async (): Promise<ProductSearchResponse> => {
      try {
      const url = new URL("https://serpapi.com/search.json");
      url.search = new URLSearchParams({ engine: "google_shopping", q: input.query, gl: "in", hl: "en", api_key: apiKey }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(PRODUCT_SEARCH_TIMEOUT_MS) });
      if (response.status === 429) return { status: "fallback" as const, listings: [] as ProductListing[], message: "Product listing search is rate-limited. Local Vendor A and Vendor B remain active." };
      if (!response.ok) throw new Error(`SerpAPI returned ${response.status}`);
      const listings = normalizeShoppingResults(shoppingResponseSchema.parse(await response.json()), input.maxUnitPriceInr, input.authorizationLimitInr, input.category);
      await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "serpapi", outcome: "success", summary: "Shopping product listings were retrieved.", metadata: { inputLength: input.query.length, resultCount: listings.length } });
      return { status: "live" as const, listings, message: "Live product listings are marketplace records. Price, stock, delivery, and returns still require confirmation before they become eligible offers." };
      } catch (error) {
      await recordProviderAudit({ userId: ctx.user?.id, eventType: "live_search.evidence", provider: "local", outcome: "fallback", summary: "Shopping listings were unavailable; local vendors retained.", metadata: { inputLength: input.query.length } });
      return { status: "fallback" as const, listings: [] as ProductListing[], message: "Product listing search is unavailable. Local Vendor A and Vendor B remain active." };
      }
    })();
    productSearchInFlight.set(cacheKey, request);
    try {
      const result = await request;
      if (result.status === "live") cacheLiveProductSearch(cacheKey, result);
      return result;
    } finally {
      productSearchInFlight.delete(cacheKey);
    }
  }),
});
