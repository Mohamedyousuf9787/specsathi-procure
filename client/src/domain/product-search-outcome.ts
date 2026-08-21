import type { BuyingBrief } from "./generic-procurement";
import { resolveLaptopChallengeFallback, type LaptopChallengeTemplateCard } from "./laptop-challenge-templates";

export type ProductSearchOutcome<T> = { status: "live" | "fallback"; message?: string; listings: T[] };

export function resolveProductSearchSuccess<T>(brief: BuyingBrief | null, result: ProductSearchOutcome<T>): ProductSearchOutcome<T | LaptopChallengeTemplateCard> {
  if (result.status === "fallback" || result.listings.length === 0) {
    const fallback = resolveLaptopChallengeFallback(brief, result.message ?? "Live product listing search returned no matching cards.");
    if (fallback) return fallback;
  }
  return result;
}

export function resolveProductSearchFailure(brief: BuyingBrief | null): ProductSearchOutcome<LaptopChallengeTemplateCard> {
  return resolveLaptopChallengeFallback(brief, "Live product listing search could not be reached.") ?? { status: "fallback" as const, message: "Product listing search could not be reached. Local Vendor A and Vendor B remain active.", listings: [] };
}
