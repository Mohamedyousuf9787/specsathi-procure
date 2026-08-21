import type { BuyingBrief } from "./generic-procurement";
import { evaluateGenericOffer, genericLocalCatalog, recommendGenericOffer } from "./generic-vendor-flow";

export type LaptopChallengeTemplateCard = {
  id: string;
  title: string;
  merchant: string;
  priceText: string;
  rating: null;
  reviews: null;
  imageUrl: null;
  productUrl: null;
  delivery: string;
  availability: string;
  completeness: "complete";
  policy: "eligible" | "approval_needed" | "blocked";
  specificationStatus: "sourced";
  specificationSource: "template";
  specificationProfile: "laptop";
  specifications: Array<{ label: string; value: string }>;
  recordKind: "laptop_challenge_template";
  bestMatch: boolean;
  matchSummary: string;
};

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function buildLaptopChallengeTemplateCards(brief: BuyingBrief): LaptopChallengeTemplateCard[] {
  if (!/laptop|notebook|ultrabook|macbook/i.test(brief.productCategory)) return [];
  const offers = genericLocalCatalog.filter(offer => offer.productCategory === "laptop");
  const recommendation = recommendGenericOffer(brief, offers);
  return offers.map(offer => {
    const evaluation = evaluateGenericOffer(brief, offer);
    const policy = !evaluation.eligible ? "blocked" as const : evaluation.requiresApproval ? "approval_needed" as const : "eligible" as const;
    const cpu = String(offer.attributes.cpu ?? "Not stated");
    const ram = offer.attributes.ram_gb;
    const storage = offer.attributes.storage_gb;
    const display = offer.attributes.display_inches;
    const bestMatch = recommendation.selected?.offer.id === offer.id;
    return {
      id: `challenge-${offer.id}`,
      title: offer.productName,
      merchant: `${offer.vendorName} · pre-built laptop template`,
      priceText: rupees(offer.unitPriceInr),
      rating: null,
      reviews: null,
      imageUrl: null,
      productUrl: null,
      delivery: offer.deliveryDays ? `${offer.deliveryDays} days` : "Not stated",
      availability: `${offer.availableQuantity} units · ${offer.availability === "in_stock" ? "In stock" : offer.availability === "low_stock" ? "Low stock" : "Unavailable"}`,
      completeness: "complete" as const,
      policy,
      specificationStatus: "sourced" as const,
      specificationSource: "template" as const,
      specificationProfile: "laptop" as const,
      specifications: [{ label: "Processor", value: cpu }, ...(typeof ram === "number" ? [{ label: "RAM", value: `${ram} GB` }] : []), ...(typeof storage === "number" ? [{ label: "Storage", value: `${storage >= 1024 ? `${storage / 1024} TB` : storage} SSD` }] : []), ...(typeof display === "number" ? [{ label: "Display", value: `${display} inch` }] : [])],
      recordKind: "laptop_challenge_template" as const,
      bestMatch,
      matchSummary: bestMatch ? `Best fit: meets confirmed requirements with a score of ${evaluation.score}/100.` : evaluation.eligible ? `Eligible alternative: score ${evaluation.score}/100.` : evaluation.hardFailures[0] ?? "Does not meet the confirmed requirement record.",
    };
  });
}

export function resolveLaptopChallengeFallback(brief: BuyingBrief | null, liveSearchMessage: string) {
  const listings = brief ? buildLaptopChallengeTemplateCards(brief) : [];
  if (!listings.length) return null;
  return { status: "live" as const, message: `${liveSearchMessage} Showing deterministic Vendor A/B laptop challenge templates instead; these are not live marketplace offers.`, listings };
}
