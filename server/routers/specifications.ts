import { z } from "zod";
import { recordProviderAudit } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const specificationSchema = z.object({ label: z.string(), value: z.string(), conflict: z.boolean().optional() });
const productInputSchema = z.object({ id: z.string().trim().min(1).max(180), title: z.string().trim().min(1).max(260), productUrl: z.string().url().max(2_000) });
const firecrawlProductSchema = z.object({ title: z.string().optional(), brand: z.string().optional(), category: z.string().optional(), description: z.string().optional() }).passthrough();
const firecrawlResponseSchema = z.object({ success: z.boolean().optional(), data: z.object({ markdown: z.string().optional(), product: firecrawlProductSchema.optional() }).passthrough().optional() }).passthrough();

export type SpecificationProfile = "laptop" | "mobile" | "tyre" | "furniture" | "gpu" | "mouse" | "printer" | "motorcycle" | "generic";
export type EnrichedProductSpecifications = { id: string; profile: SpecificationProfile; status: "sourced" | "unavailable"; specifications: Array<z.infer<typeof specificationSchema>>; sourceUrl: string };
export const specificationFieldContracts: Record<SpecificationProfile, Array<{ label: string; sourceDefinition: string }>> = {
  laptop: [{ label: "Processor", sourceDefinition: "CPU or processor model" }, { label: "RAM", sourceDefinition: "Installed memory capacity and generation" }, { label: "Storage", sourceDefinition: "Installed SSD, HDD, or NVMe capacity" }, { label: "Graphics", sourceDefinition: "Named GPU or integrated graphics model" }, { label: "Display", sourceDefinition: "Screen size, panel, or resolution" }, { label: "Operating system", sourceDefinition: "Named operating system" }],
  mobile: [{ label: "Processor", sourceDefinition: "Mobile processor or chipset" }, { label: "RAM", sourceDefinition: "Installed memory capacity" }, { label: "Storage", sourceDefinition: "Internal storage capacity" }, { label: "Display", sourceDefinition: "Screen size, panel, or resolution" }, { label: "Camera", sourceDefinition: "Camera configuration" }, { label: "Battery", sourceDefinition: "Battery capacity" }, { label: "Network", sourceDefinition: "Network generation" }, { label: "Warranty", sourceDefinition: "Declared warranty" }],
  tyre: [{ label: "Size", sourceDefinition: "Tyre size and fitment" }, { label: "Construction", sourceDefinition: "Radial, tubeless, or bias construction" }, { label: "Load index", sourceDefinition: "Load index" }, { label: "Speed rating", sourceDefinition: "Speed rating" }, { label: "Warranty", sourceDefinition: "Declared warranty" }],
  furniture: [{ label: "Material", sourceDefinition: "Declared material" }, { label: "Dimensions", sourceDefinition: "Declared dimensions" }, { label: "Weight capacity", sourceDefinition: "Declared weight capacity" }, { label: "Adjustability", sourceDefinition: "Height, armrest, or backrest adjustability" }, { label: "Support", sourceDefinition: "Lumbar or ergonomic support" }, { label: "Warranty", sourceDefinition: "Declared warranty" }],
  gpu: [{ label: "GPU model", sourceDefinition: "Named graphics processor" }, { label: "VRAM", sourceDefinition: "Graphics memory capacity" }, { label: "Memory type", sourceDefinition: "Graphics memory type" }, { label: "Form factor", sourceDefinition: "Card dimensions or slot format" }, { label: "Warranty", sourceDefinition: "Declared warranty" }],
  mouse: [{ label: "Connection", sourceDefinition: "Wireless or wired connection" }, { label: "Sensitivity", sourceDefinition: "Sensor resolution" }, { label: "Buttons", sourceDefinition: "Button count" }, { label: "Compatibility", sourceDefinition: "Supported operating systems or devices" }, { label: "Warranty", sourceDefinition: "Declared warranty" }],
  printer: [{ label: "Print mode", sourceDefinition: "Duplex, color, or monochrome mode" }, { label: "Print speed", sourceDefinition: "Pages per minute" }, { label: "Connectivity", sourceDefinition: "USB, Wi-Fi, or network connectivity" }, { label: "Paper size", sourceDefinition: "Supported paper sizes" }, { label: "Warranty", sourceDefinition: "Declared warranty" }],
  motorcycle: [{ label: "Engine", sourceDefinition: "Engine displacement" }, { label: "Mileage", sourceDefinition: "Claimed mileage or fuel efficiency" }, { label: "Fuel tank", sourceDefinition: "Fuel-tank capacity" }, { label: "Power", sourceDefinition: "Claimed maximum power" }, { label: "Torque", sourceDefinition: "Claimed maximum torque" }, { label: "Transmission", sourceDefinition: "Gearbox or transmission" }, { label: "Brakes", sourceDefinition: "Brake and ABS configuration" }, { label: "Kerb weight", sourceDefinition: "Kerb or curb weight" }],
  generic: [{ label: "Model", sourceDefinition: "Named product model" }, { label: "Capacity", sourceDefinition: "Declared capacity" }, { label: "Dimensions", sourceDefinition: "Declared dimensions" }, { label: "Material", sourceDefinition: "Declared material" }, { label: "Warranty", sourceDefinition: "Declared warranty" }],
};

class RetryableProviderError extends Error {}

const unique = (specifications: Array<{ label: string; value: string; conflict?: boolean }>) => {
  const labels = new Set<string>();
  return specifications.filter(specification => specification.value && !labels.has(specification.label) && (labels.add(specification.label), true)).slice(0, 8);
};
const capture = (text: string, expression: RegExp) => text.match(expression)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
const captureAll = (text: string, expression: RegExp) => Array.from(text.matchAll(expression), match => match[1]?.replace(/\s+/g, " ").trim()).filter((value): value is string => Boolean(value));

export function getSpecificationProfile(category: string, title = ""): SpecificationProfile {
  const text = `${category} ${title}`.toLowerCase();
  if (/laptop|notebook|ultrabook|macbook/.test(text)) return "laptop";
  if (/mobile|phone|smartphone|iphone|android/.test(text)) return "mobile";
  if (/tyre|tire/.test(text)) return "tyre";
  if (/^furniture\b|\b(?:chair|desk|table|cabinet)\b/.test(category.toLowerCase()) && !/^office\s+chair\b/i.test(category.trim())) return "furniture";
  if (/gpu|graphics card|video card|graphics/.test(text)) return "gpu";
  if (/mouse|mice/.test(text)) return "mouse";
  if (/printer|scanner|copier/.test(text)) return "printer";
  if (/motorcycle|motorbike|motor bike|bike\b|scooter/.test(text)) return "motorcycle";
  return "generic";
}

export function normalizeSourcedSpecifications(profile: SpecificationProfile, title: string, markdown: string, product?: z.infer<typeof firecrawlProductSchema>): Array<z.infer<typeof specificationSchema>> {
  const source = `${title}\n${product?.title ?? ""}\n${product?.brand ?? ""}\n${product?.category ?? ""}\n${product?.description ?? ""}\n${markdown}`.replace(/\s+/g, " ");
  const specifications: Array<z.infer<typeof specificationSchema>> = [];
  const isUseful = (label: string, rawValue: string) => {
    const value = rawValue.replace(/\s+/g, " ").trim();
    if (!value || value.length > 80 || /\b(?:to its|drive type|available ports|processor brand|cpu graphics|yes refresh)\b/i.test(value)) return false;
    if (label === "Processor") return /\b(?:intel\s+(?:core|ultra|pentium|celeron)|amd\s+ryzen|apple\s+m\d|snapdragon|mediatek)\b/i.test(value);
    if (label === "RAM") return /\b\d+(?:\.\d+)?\s*gb\b/i.test(value);
    if (label === "Storage") return /\b\d+(?:\.\d+)?\s*(?:gb|tb)\s*(?:ssd|hdd|nvme)\b/i.test(value);
    if (label === "Graphics") return /\b(?:nvidia|geforce|rtx\s*\d|radeon\s+rx|intel\s+(?:arc|iris|uhd|hd\s+graphics))\b/i.test(value);
    if (label === "Display") return /\b(?:\d{2}(?:\.\d+)?\s*(?:inch|in)|fhd|qhd|uhd|oled|ips)\b/i.test(value);
    if (label === "Operating system") return /\b(?:windows(?:\s+\d{1,2})?|macos|chromeos|linux)\b/i.test(value) && !/\b(?:processor|graphics|drive|ports)\b/i.test(value);
    return true;
  };
  const add = (label: string, value: string | string[] | null) => {
    const candidates = (Array.isArray(value) ? value : [value]).filter((candidate): candidate is string => Boolean(candidate)).map(candidate => candidate.replace(/\s+/g, " ").trim()).filter(candidate => isUseful(label, candidate)).filter((candidate, index, values) => values.indexOf(candidate) === index);
    if (candidates.length) specifications.push({ label, value: candidates[0], ...(candidates.length > 1 ? { conflict: true } : {}) });
  };
  if (product?.brand) add("Brand", product.brand.trim());
  if (profile === "laptop") {
    add("Processor", capture(source, /(?:processor|cpu)\s*[:\-]?\s*([^,;|.]{3,80})/i) ?? capture(source, /((?:intel\s+(?:core|ultra)\s+[a-z0-9\-]+|amd\s+ryzen\s+[a-z0-9\-]+|apple\s+m[0-9]\s*(?:pro|max)?)[^,;|.]{0,35})/i));
    add("RAM", (() => { const matches = captureAll(source, /(?:ram|memory)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*gb(?:\s*(?:ddr[345]|lpddr[45]))?)/gi); return matches.length ? matches : capture(source, /(\d+(?:\.\d+)?\s*gb(?:\s*(?:ddr[345]|lpddr[45]))?\s*ram)/i); })());
    add("Storage", capture(source, /(?:storage|ssd|hdd)\s*[:\-]?\s*((?:\d+(?:\.\d+)?\s*(?:gb|tb))(?:\s*(?:ssd|hdd|nvme))?)/i) ?? capture(source, /(\d+(?:\.\d+)?\s*(?:gb|tb)\s*(?:ssd|hdd|nvme))/i));
    add("Graphics", capture(source, /(?:graphics|gpu)\s*[:\-]?\s*([^,;|.]{3,70})/i) ?? capture(source, /((?:nvidia\s+)?(?:geforce\s+)?rtx\s*\d{3,4}(?:\s*(?:ti|super))?|radeon\s+rx\s*\d{3,4}|intel\s+(?:arc|iris)\s*[^,;|.]{0,28})/i));
    add("Display", capture(source, /(?:display|screen)\s*[:\-]?\s*([^,;|.]{3,80})/i) ?? capture(source, /(\d{2}(?:\.\d+)?\s*(?:inch|in)\s*(?:fhd|qhd|uhd|oled|ips)?[^,;|.]{0,36})/i));
    add("Operating system", capture(source, /(?:operating system|os)\s*[:\-]?\s*((?:windows|macos|chromeos|linux)[^,;|.]{0,45})/i));
  } else if (profile === "mobile") {
    add("Processor", capture(source, /(?:processor|chipset|snapdragon|mediatek)\s*[:\-]?\s*([^,;|.]{3,60})/i));
    add("RAM", capture(source, /(?:ram|memory)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*gb)/i));
    add("Storage", capture(source, /(?:storage|rom)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:gb|tb))/i));
    add("Display", capture(source, /(?:display|screen)\s*[:\-]?\s*([^,;|.]{3,70})/i));
    add("Camera", capture(source, /(?:camera)\s*[:\-]?\s*([^,;|.]{3,70})/i));
    add("Battery", capture(source, /(?:battery)\s*[:\-]?\s*(\d{3,5}\s*mah)/i));
    add("Network", capture(source, /(\b(?:4g|5g)\b)/i));
    add("Warranty", capture(source, /(?:warranty)\s*[:\-]?\s*([^,;|.]{2,60})/i));
  } else if (profile === "tyre") {
    add("Size", capture(source, /(?:size|fitment)\s*[:\-]?\s*(\d{2,3}\/\d{2}\s*R?\s*\d{2})/i) ?? capture(source, /(\d{2,3}\/\d{2}\s*R?\s*\d{2})/i));
    add("Construction", capture(source, /(tubeless|radial|bias)/i));
    add("Load index", capture(source, /(?:load\s*index)\s*[:\-]?\s*([A-Z0-9]{2,5})/i));
    add("Speed rating", capture(source, /(?:speed\s*rating)\s*[:\-]?\s*([A-Z])\b/i));
    add("Warranty", capture(source, /(?:warranty)\s*[:\-]?\s*([^,;|.]{2,60})/i));
  } else if (profile === "furniture") {
    add("Material", capture(source, /(?:material|made\s+of)\s*[:\-]?\s*([^,;|.]{2,60})/i));
    add("Dimensions", capture(source, /(?:dimensions?)\s*[:\-]?\s*([^,;|.]{3,90})/i));
    add("Weight capacity", capture(source, /(?:weight\s*capacity|supports)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*kg)/i));
    add("Adjustability", capture(source, /(adjustable\s+(?:height|armrests|backrest)|height[- ]adjustable)/i));
    add("Support", capture(source, /(lumbar\s+support|ergonomic)/i));
    add("Warranty", capture(source, /(?:warranty)\s*[:\-]?\s*([^,;|.]{2,60})/i));
  } else if (profile === "gpu") {
    add("GPU model", capture(source, /((?:nvidia\s+)?(?:geforce\s+)?rtx\s*\d{3,4}(?:\s*(?:ti|super))?|radeon\s+rx\s*\d{3,4})/i));
    add("VRAM", capture(source, /(?:vram|graphics\s+memory)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*gb)/i));
    add("Memory type", capture(source, /(GDDR[456X])/i));
    add("Form factor", capture(source, /(?:form\s*factor)\s*[:\-]?\s*([^,;|.]{2,50})/i));
    add("Warranty", capture(source, /(?:warranty)\s*[:\-]?\s*([^,;|.]{2,60})/i));
  } else if (profile === "mouse") {
    add("Connection", capture(source, /(Bluetooth|2\.4\s*GHz|wired|wireless)/i));
    add("Sensitivity", capture(source, /(?:dpi|sensitivity)\s*[:\-]?\s*(\d{3,5}\s*dpi)/i));
    add("Buttons", capture(source, /(?:buttons?)\s*[:\-]?\s*(\d+)/i));
    add("Compatibility", capture(source, /(?:compatib(?:ility|le)|works\s+with)\s*[:\-]?\s*([^,;|.]{3,60})/i));
    add("Warranty", capture(source, /(?:warranty)\s*[:\-]?\s*([^,;|.]{2,60})/i));
  } else if (profile === "printer") {
    add("Print mode", capture(source, /(duplex|single-sided|colour|color|monochrome)/i));
    add("Print speed", capture(source, /(?:print\s+speed)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*ppm)/i));
    add("Connectivity", capture(source, /(?:connectivity|connection)\s*[:\-]?\s*(usb|wi[- ]?fi|ethernet|wireless)/i));
    add("Paper size", capture(source, /(?:paper\s+size|media\s+size)\s*[:\-]?\s*([^,;|.]{2,40})/i));
    add("Warranty", capture(source, /(?:warranty)\s*[:\-]?\s*([^,;|.]{2,60})/i));
  } else if (profile === "motorcycle") {
    add("Engine", capture(source, /(?:engine|displacement)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*cc)/i) ?? capture(source, /(\d+(?:\.\d+)?\s*cc)/i));
    add("Mileage", capture(source, /(?:mileage|fuel efficiency)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kmpl|km\/l|km per litre))/i) ?? capture(source, /(\d+(?:\.\d+)?\s*(?:kmpl|km\/l|km per litre))/i));
    add("Fuel tank", capture(source, /(?:fuel tank|tank capacity)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:litres?|l))/i));
    add("Power", capture(source, /(?:max\s*)?power\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:ps|bhp|kw)(?:\s*@[^,;|]{0,25})?)/i));
    add("Torque", capture(source, /(?:max\s*)?torque\s*[:\-]?\s*(\d+(?:\.\d+)?\s*nm(?:\s*@[^,;|]{0,25})?)/i));
    add("Transmission", capture(source, /(?:transmission|gearbox)\s*[:\-]?\s*([^,;|.]{3,55})/i));
    add("Brakes", capture(source, /(?:brakes?|braking)\s*[:\-]?\s*([^,;|.]{3,70})/i));
    add("Kerb weight", capture(source, /(?:kerb weight|curb weight)\s*[:\-]?\s*(\d+(?:\.\d+)?\s*kg)/i));
  } else {
    add("Model", capture(source, /(?:model)\s*[:\-]?\s*([^,;|.]{2,80})/i));
    add("Capacity", capture(source, /(?:capacity)\s*[:\-]?\s*([^,;|.]{2,80})/i));
    add("Dimensions", capture(source, /(?:dimensions?)\s*[:\-]?\s*([^,;|.]{3,100})/i));
    add("Material", capture(source, /(?:material)\s*[:\-]?\s*([^,;|.]{2,80})/i));
    add("Warranty", capture(source, /(?:warranty)\s*[:\-]?\s*([^,;|.]{2,80})/i));
  }
  return unique(specifications);
}

function isAllowedProductUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:") return false;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(host)) return false;
  return true;
}

async function scrapeProductPage(url: string, apiKey: string) {
  const response = await fetch("https://api.firecrawl.dev/v2/scrape", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ url, formats: ["markdown", "product"] }), signal: AbortSignal.timeout(20_000) });
  if (response.status === 429 || response.status >= 500) throw new RetryableProviderError(`Firecrawl returned ${response.status}`);
  if (!response.ok) throw new Error(`Firecrawl returned ${response.status}`);
  return firecrawlResponseSchema.parse(await response.json());
}

export async function scrapeWithFailover(url: string) {
  const primary = process.env.FIRECRAWL_API_KEY;
  const fallback = process.env.FIRECRAWL_FALLBACK_API_KEY;
  if (!primary && !fallback) throw new Error("Firecrawl is not configured");
  if (!primary && fallback) return { payload: await scrapeProductPage(url, fallback), provider: "firecrawl_fallback" as const };
  try {
    return { payload: await scrapeProductPage(url, primary!), provider: "firecrawl" as const };
  } catch (error) {
    if (!(error instanceof RetryableProviderError) || !fallback) throw error;
    return { payload: await scrapeProductPage(url, fallback), provider: "firecrawl_fallback" as const };
  }
}

const extractionCache = new Map<string, { expiresAt: number; result: EnrichedProductSpecifications }>();
async function enrichProduct(category: string, product: z.infer<typeof productInputSchema>): Promise<{ result: EnrichedProductSpecifications; usedFallback: boolean }> {
  const profile = getSpecificationProfile(category, product.title);
  if (!isAllowedProductUrl(product.productUrl)) return { result: { id: product.id, profile, status: "unavailable", specifications: [], sourceUrl: product.productUrl }, usedFallback: false };
  const cached = extractionCache.get(product.productUrl);
  if (cached && cached.expiresAt > Date.now()) return { result: cached.result, usedFallback: false };
  try {
    const { payload, provider } = await scrapeWithFailover(product.productUrl);
    const data = payload.data;
    const specifications = normalizeSourcedSpecifications(profile, product.title, data?.markdown ?? "", data?.product);
    const result: EnrichedProductSpecifications = { id: product.id, profile, status: specifications.length ? "sourced" : "unavailable", specifications, sourceUrl: product.productUrl };
    extractionCache.set(product.productUrl, { expiresAt: Date.now() + 6 * 60 * 60 * 1_000, result });
    return { result, usedFallback: provider === "firecrawl_fallback" };
  } catch {
    return { result: { id: product.id, profile, status: "unavailable", specifications: [], sourceUrl: product.productUrl }, usedFallback: false };
  }
}

async function mapWithConcurrency<T, U>(items: T[], concurrency: number, mapper: (item: T) => Promise<U>) {
  const results: U[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => { while (next < items.length) { const index = next++; results[index] = await mapper(items[index]); } }));
  return results;
}

export const specificationsRouter = router({
  enrich: publicProcedure.input(z.object({ category: z.string().trim().min(1).max(100), products: z.array(productInputSchema).min(1).max(12) })).mutation(async ({ input, ctx }) => {
    const enriched = await mapWithConcurrency(input.products, 2, product => enrichProduct(input.category, product));
    const results = enriched.map(item => item.result);
    const sourcedCount = results.filter(result => result.status === "sourced").length;
    await recordProviderAudit({ userId: ctx.user?.id, eventType: "product.specifications", provider: enriched.some(item => item.usedFallback) ? "firecrawl_fallback" : "firecrawl", outcome: sourcedCount ? "success" : "partial", summary: "Marketplace product specifications were enriched from product pages.", metadata: { requestedCount: input.products.length, sourcedCount, categoryLength: input.category.length } });
    return { status: sourcedCount ? "live" as const : "fallback" as const, results, message: sourcedCount ? "Specifications were sourced from product pages. Missing values remain unavailable rather than inferred." : "Product specifications could not be sourced. Marketplace cards and local comparison remain available." };
  }),
});
