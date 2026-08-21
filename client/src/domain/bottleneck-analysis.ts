import type { BuyingBrief } from "./generic-procurement";
import type { GenericOfferEvaluation } from "./generic-vendor-flow";

export type BottleneckLevel = "HIGH" | "MEDIUM" | "LOW";
export type Bottleneck = { key: string; title: string; level: BottleneckLevel; detail: string };

const levelRank: Record<BottleneckLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const risk = (key: string, title: string, level: BottleneckLevel, detail: string): Bottleneck => ({ key, title, level, detail });

export function analyzeBottlenecks(brief: BuyingBrief, candidates: GenericOfferEvaluation[]): Bottleneck[] {
  const total = candidates.length;
  const eligible = candidates.filter(candidate => candidate.eligible);
  const budgetFailures = candidates.filter(candidate => candidate.hardFailures.some(failure => /budget|price ceiling|total cap/i.test(failure))).length;
  const quantityFailures = candidates.filter(candidate => candidate.hardFailures.some(failure => /units available|quantity availability/i.test(failure))).length;
  const deliveryFailures = candidates.filter(candidate => candidate.hardFailures.some(failure => /delivery/i.test(failure))).length;
  const specificationFailures = candidates.filter(candidate => candidate.hardFailures.some(failure => /requirement|specification|attribute/i.test(failure))).length;
  const unavailable = candidates.filter(candidate => candidate.hardFailures.some(failure => /unavailable|availability/i.test(failure))).length;
  const vendors = new Set(candidates.map(candidate => candidate.offer.vendorName).filter(Boolean));
  const prices = candidates.map(candidate => candidate.offer.unitPriceInr).filter(price => price > 0);
  const priceRange = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0;
  const priceVariation = prices.length > 1 ? priceRange / Math.max(1, Math.min(...prices)) : 0;
  const risks: Bottleneck[] = [];

  if (!total) risks.push(risk("availability", "Product availability", "HIGH", `No candidate data is available for ${brief.productCategory}; the workflow remains paused instead of inventing a vendor result.`));
  else if (!eligible.length) risks.push(risk("availability", "Product availability", "HIGH", "No candidate currently satisfies every mandatory requirement, budget, quantity, delivery, and availability constraint."));
  else if (unavailable || quantityFailures) risks.push(risk("availability", "Product availability", "MEDIUM", `${unavailable + quantityFailures} candidate${unavailable + quantityFailures === 1 ? " has" : "s have"} an availability or quantity constraint that may prevent the full request from being sourced.`));
  else risks.push(risk("availability", "Product availability", "LOW", "At least one candidate reports enough availability for the requested quantity."));

  if (!prices.length || budgetFailures === total) risks.push(risk("budget", "Budget risk", "HIGH", "No candidate has a verified price that satisfies the confirmed budget."));
  else if (budgetFailures) risks.push(risk("budget", "Budget risk", "MEDIUM", `${budgetFailures} of ${total} candidate${total === 1 ? "" : "s"} exceeds the confirmed unit or total budget.`));
  else risks.push(risk("budget", "Budget risk", "LOW", "All compared candidates with reported prices are within the confirmed budget."));

  if (brief.deliveryDeadlineDays && deliveryFailures === total) risks.push(risk("delivery", "Delivery risk", "HIGH", `No candidate verifies delivery within the requested ${brief.deliveryDeadlineDays}-day window.`));
  else if (deliveryFailures) risks.push(risk("delivery", "Delivery risk", "MEDIUM", `${deliveryFailures} candidate${deliveryFailures === 1 ? "" : "s"} misses or does not verify the requested delivery window.`));
  else risks.push(risk("delivery", "Delivery risk", "LOW", brief.deliveryDeadlineDays ? `At least one candidate is within the ${brief.deliveryDeadlineDays}-day delivery target.` : "No delivery deadline was specified; delivery is used as a ranking factor only."));

  if (specificationFailures === total && brief.hardRequirements.length) risks.push(risk("specifications", "Specification fit", "HIGH", "No candidate verifies all mandatory product specifications from the available evidence."));
  else if (specificationFailures) risks.push(risk("specifications", "Specification fit", "MEDIUM", `${specificationFailures} candidate${specificationFailures === 1 ? "" : "s"} misses at least one mandatory specification.`));
  else risks.push(risk("specifications", "Specification fit", "LOW", brief.hardRequirements.length ? "The compared candidates verify the mandatory specification set." : "No product-specific mandatory specifications were stated."));

  if (vendors.size < 2 && total > 1) risks.push(risk("vendors", "Vendor availability", "MEDIUM", "The comparison currently has limited vendor diversity; a second independent vendor source was not available."));
  else risks.push(risk("vendors", "Vendor availability", "LOW", `${vendors.size} vendor source${vendors.size === 1 ? "" : "s"} ${vendors.size === 1 ? "is" : "are"} represented in the comparison.`));

  if (priceVariation >= 0.25) risks.push(risk("price-variation", "Price variation", "MEDIUM", `Reported unit prices vary by ${Math.round(priceVariation * 100)}%, so the cheapest result should not be selected without considering fit and risk.`));
  else risks.push(risk("price-variation", "Price variation", "LOW", prices.length > 1 ? "Reported unit prices are within a relatively narrow range." : "Price variation cannot be assessed from the available candidate set."));

  const warrantyRequired = brief.hardRequirements.some(requirement => /warranty/i.test(requirement.label) || /warranty/i.test(requirement.key));
  if (warrantyRequired && candidates.some(candidate => candidate.hardFailures.some(failure => /warranty/i.test(failure)))) risks.push(risk("warranty", "Warranty coverage", "MEDIUM", "Warranty was requested, but at least one candidate does not verify the required coverage."));
  else risks.push(risk("warranty", "Warranty coverage", "LOW", warrantyRequired ? "Warranty requirements are verified for the eligible candidate set." : "No mandatory warranty requirement was stated."));

  if (brief.maxUnitPriceInr && brief.maxTotalPriceInr && brief.quantity * brief.maxUnitPriceInr > brief.maxTotalPriceInr) risks.push(risk("conflict", "Requirement conflict", "HIGH", "The confirmed unit ceiling and total cap conflict; the request must be corrected before a safe recommendation can proceed."));
  else risks.push(risk("conflict", "Requirement conflict", "LOW", "No conflict was detected between the confirmed quantity and budget constraints."));

  return risks.sort((a, b) => levelRank[b.level] - levelRank[a.level]).slice(0, 6);
}
