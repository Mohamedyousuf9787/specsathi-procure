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

export type ProductRequirement = { key: string; label: string; operator: "equals" | "at_least" | "at_most" | "contains" | "within_days"; value: string | number | boolean; unit?: string };
export type MarketplaceRequirementMatch = { label: string; requested: string; actual: string; status: "PASS" | "PARTIAL" | "FAIL" | "UNKNOWN" };
export type ProductListing = { id: string; title: string; merchant: string | null; priceText: string | null; priceInr: number | null; rating: number | null; reviews: number | null; imageUrl: string | null; productUrl: string | null; delivery: string | null; availability: string | null; completeness: "complete" | "partial" | "unverified"; policy: "eligible" | "approval_needed" | "blocked" | "unverified"; specificationProfile: "laptop" | "mobile" | "tyre" | "furniture" | "gpu" | "mouse" | "printer" | "motorcycle" | "generic"; specifications: Array<{ label: string; value: string }>; requirementMatches?: MarketplaceRequirementMatch[]; matchSummary?: string };
type ProductSearchResponse = { status: "live" | "fallback"; listings: ProductListing[]; message: string };
type ProductSearchInput = { query: string; category: string; maxUnitPriceInr?: number; authorizationLimitInr?: number; hardRequirements?: ProductRequirement[] };

const productSearchCache = new Map<string, { expiresAt: number; response: ProductSearchResponse }>();
const productSearchInFlight = new Map<string, Promise<ProductSearchResponse>>();

export function productSearchCacheKey(input: ProductSearchInput) {
  return [input.query.trim().toLowerCase(), input.category.trim().toLowerCase(), input.maxUnitPriceInr ?? "", input.authorizationLimitInr ?? "", JSON.stringify(input.hardRequirements ?? [])].join("|");
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
const fastProfile = (category: string, title: string): ProductListing["specificationProfile"] => { const text = `${category} ${title}`; if (/laptop|notebook|ultrabook|macbook/i.test(text)) return "laptop"; if (/mobile|phone|smartphone|iphone|android/i.test(text)) return "mobile"; if (/tyre|tire/i.test(text)) return "tyre"; if (/furniture|chair|desk|table|cabinet/i.test(text)) return "furniture"; if (/gpu|graphics card|video card|graphics/i.test(text)) return "gpu"; if (/mouse|mice/i.test(text)) return "mouse"; if (/printer|scanner|copier/i.test(text)) return "printer"; if (/motorcycle|motorbike|motor bike|bike\b|scooter/i.test(text)) return "motorcycle"; return "generic"; };
const addFast = (target: Array<{ label: string; value: string }>, label: string, value: string | null) => { if (value && !target.some(specification => specification.label === label)) target.push({ label, value }); };

export function normalizeFastMarketplaceSpecifications(category: string, title: string, extensions: string[] = []) {
  const profile = fastProfile(category, title);
  const text = `${title} ${extensions.join(" ")}`.replace(/\s+/g, " ");
  const categoryText = category.toLowerCase();
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
  } else if (profile === "furniture") {
    addFast(specifications, "Material", captureFastValue(text, /(?:material|made\s+of)\s*[:\-]?\s*([^,;|.]{2,48})/i));
    addFast(specifications, "Dimensions", captureFastValue(text, /(\d+(?:\.\d+)?\s*(?:x|×)\s*\d+(?:\.\d+)?(?:\s*(?:x|×)\s*\d+(?:\.\d+)?)?\s*(?:cm|mm|in|inch|ft)?)/i));
    addFast(specifications, "Adjustability", captureFastValue(text, /(adjustable\s+(?:height|armrests|backrest)|height[- ]adjustable)/i));
    addFast(specifications, "Support", captureFastValue(text, /(lumbar\s+support|weight\s+capacity\s*[:\-]?\s*\d+\s*kg)/i));
  } else if (/mobile|phone|smartphone|iphone|android/.test(categoryText)) {
    addFast(specifications, "RAM", captureFastValue(text, /(\d+(?:\.\d+)?\s*GB(?:\s*(?:LPDDR[45]|DDR[45]))?\s*RAM)/i));
    addFast(specifications, "Storage", captureFastValue(text, /(\d+(?:\.\d+)?\s*(?:GB|TB)\s*(?:storage|ROM)?)/i));
    addFast(specifications, "Battery", captureFastValue(text, /(\d{3,5}\s*mAh)/i));
    addFast(specifications, "Network", captureFastValue(text, /(\b5G\b)/i));
  } else if (/gpu|graphics card|video card|graphics/.test(categoryText)) {
    addFast(specifications, "Graphics model", captureFastValue(text, /((?:NVIDIA\s+)?(?:GeForce\s+)?RTX\s*\d{3,4}(?:\s*(?:Ti|Super))?|Radeon\s+RX\s*\d{3,4}|Intel\s+Arc\s*[A-Za-z0-9\-]*)/i));
    addFast(specifications, "VRAM", captureFastValue(text, /(\d+(?:\.\d+)?\s*GB\s*GDDR[456X]?)/i));
  } else if (/tyre|tire/.test(categoryText)) {
    addFast(specifications, "Tyre size", captureFastValue(text, /(\d{2,3}\/\d{2}\s*R?\s*\d{2})/i));
    addFast(specifications, "Construction", captureFastValue(text, /(tubeless|radial|bias)/i));
  } else if (/mouse|mice/.test(categoryText)) {
    addFast(specifications, "Connectivity", captureFastValue(text, /(Bluetooth|2\.4\s*GHz|wired|wireless)/i));
    addFast(specifications, "Sensitivity", captureFastValue(text, /(\d{3,5}\s*DPI)/i));
  } else if (/printer/.test(categoryText)) {
    addFast(specifications, "Print mode", captureFastValue(text, /(duplex|single-sided|colour|color|monochrome)/i));
    addFast(specifications, "Print speed", captureFastValue(text, /(\d+(?:\.\d+)?\s*ppm)/i));
  } else {
    addFast(specifications, "Capacity", captureFastValue(text, /(\d+(?:\.\d+)?\s*(?:GB|TB|ml|litres?|L|kg))/i));
  }
  if (!specifications.length && title.trim() && title.trim().toLowerCase() !== "untitled product") addFast(specifications, "Listed model", title.trim());
  return { specificationProfile: profile, specifications: specifications.slice(0, 4) };
}

function matchListingRequirements(listingText: string, specifications: Array<{ label: string; value: string }>, requirements: ProductRequirement[]): MarketplaceRequirementMatch[] {
  const text = listingText.toLowerCase();
  return requirements.map(requirement => {
    const requested = `${String(requirement.value)}${requirement.unit ? ` ${requirement.unit}` : ""}`;
    const numericKey = requirement.key === "ram_gb" ? "RAM" : requirement.key === "storage_gb" ? "Storage" : requirement.key === "battery_mah" ? "Battery" : requirement.key === "vram_gb" ? "VRAM" : requirement.key === "display_inches" ? "Display" : undefined;
    const specification = numericKey ? specifications.find(item => item.label === numericKey) : undefined;
    const actual = specification?.value ?? (text.includes(String(requirement.value).toLowerCase()) ? String(requirement.value) : "Unavailable");
    if (actual === "Unavailable") return { label: requirement.label, requested, actual, status: "UNKNOWN" as const };
    const actualNumber = Number(actual.match(/[0-9]+(?:\.[0-9]+)?/)?.[0]);
    const requestedNumber = Number(requirement.value);
    const status = requirement.operator === "at_least" ? Number.isFinite(actualNumber) && actualNumber >= requestedNumber ? "PASS" : "FAIL" : requirement.operator === "at_most" || requirement.operator === "within_days" ? Number.isFinite(actualNumber) && actualNumber <= requestedNumber ? "PASS" : "FAIL" : requirement.operator === "equals" ? (actual.toLowerCase() === String(requirement.value).toLowerCase() || text.includes(String(requirement.value).toLowerCase()) ? "PASS" : "FAIL") : actual.toLowerCase().includes(String(requirement.value).toLowerCase()) || text.includes(String(requirement.value).toLowerCase()) ? "PASS" : "FAIL";
    return { label: requirement.label, requested, actual, status };
  });
}

export function normalizeShoppingResults(payload: z.infer<typeof shoppingResponseSchema>, maxUnitPriceInr?: number, authorizationLimitInr?: number, category = "", requirements: ProductRequirement[] = []): ProductListing[] {
  return payload.shopping_results.slice(0, 12).map((item, index) => {
    const priceInr = typeof item.extracted_price === "number" && item.extracted_price > 0 ? Math.round(item.extracted_price) : null;
    const merchant = item.source ?? null;
    const productUrl = item.product_link ?? item.link ?? null;
    const availability = item.availability?.trim() || null;
    const hasCoreListingTerms = priceInr !== null && Boolean(merchant && productUrl);
    const completeness = !hasCoreListingTerms ? "unverified" as const : availability ? "complete" as const : "partial" as const;
    const unavailable = Boolean(availability && /out of stock|unavailable|sold out/i.test(availability));
    const fastSpecifications = normalizeFastMarketplaceSpecifications(category, item.title, item.extensions);
    const requirementMatches = matchListingRequirements(`${item.title} ${item.extensions?.join(" ") ?? ""} ${item.availability ?? ""}`, fastSpecifications.specifications, requirements);
    const hasRequirementFailure = requirementMatches.some(match => match.status === "FAIL");
    const hasUnknownRequirement = requirementMatches.some(match => match.status === "UNKNOWN" || match.status === "PARTIAL");
    const policy = completeness !== "complete" || hasUnknownRequirement ? "unverified" as const : hasRequirementFailure || unavailable || (maxUnitPriceInr && priceInr !== null && priceInr > maxUnitPriceInr) ? "blocked" as const : authorizationLimitInr && priceInr !== null && priceInr > authorizationLimitInr ? "approval_needed" as const : "eligible" as const;
    const matchSummary = requirementMatches.length ? `${requirementMatches.filter(match => match.status === "PASS").length}/${requirementMatches.length} confirmed requirements pass; missing data remains unverified.` : undefined;
    return { id: `serp-${item.position ?? index + 1}-${item.title.slice(0, 36).replace(/[^a-z0-9]/gi, "-").toLowerCase()}`, title: item.title, merchant, priceText: item.price ?? null, priceInr, rating: item.rating ?? null, reviews: item.reviews ?? null, imageUrl: item.thumbnail ?? null, productUrl, delivery: item.delivery ?? null, availability, completeness, policy, requirementMatches, matchSummary, ...fastSpecifications };
  });
}

export const productsRouter = router({
  search: publicProcedure.input(z.object({ query: z.string().trim().min(3).max(600), category: z.string().trim().min(1).max(100), maxUnitPriceInr: z.number().int().positive().max(100000000).optional(), authorizationLimitInr: z.number().int().positive().max(100000000).optional(), hardRequirements: z.array(z.object({ key: z.string().max(64), label: z.string().max(80), operator: z.enum(["equals", "at_least", "at_most", "contains", "within_days"]), value: z.union([z.string().max(160), z.number().finite(), z.boolean()]), unit: z.string().max(24).optional() })).max(12).optional() })).mutation(async ({ input, ctx }) => {
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
      const listings = normalizeShoppingResults(shoppingResponseSchema.parse(await response.json()), input.maxUnitPriceInr, input.authorizationLimitInr, input.category, input.hardRequirements);
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
