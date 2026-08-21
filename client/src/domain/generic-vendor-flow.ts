/**
 * Calm operational paper: generic local vendor flow with deterministic policy outcomes.
 * No provider or parser output may approve a purchase; all checks remain code-owned.
 */
import type { AuditEvent, ProcurementStatus } from "./procurement";
import { laptopDemoBrief, type BuyingBrief, type Requirement, type VendorOffer } from "./generic-procurement";

export interface VendorSearchProvider {
  search(input: { brief: BuyingBrief; query: string }): Promise<VendorOffer[]>;
}

export type GenericOfferEvaluation = {
  offer: VendorOffer;
  score: number;
  hardFailures: string[];
  eligible: boolean;
  requiresApproval: boolean;
  scoreBreakdown: Record<string, number>;
};

export type GenericRecommendation = {
  brief: BuyingBrief;
  candidates: GenericOfferEvaluation[];
  selected?: GenericOfferEvaluation;
  decision: "AUTO_AUTHORIZED" | "PENDING_APPROVAL" | "BLOCKED";
  reason: string;
};

export type GenericMockOrder = {
  id: string;
  briefId: string;
  productCategory: string;
  vendorName: string;
  totalInr: number;
  deliveryDays?: number;
};

export type GenericProcurementSession = {
  brief: BuyingBrief;
  query: string;
  status: ProcurementStatus;
  recommendation: GenericRecommendation;
  audit: AuditEvent[];
  approvedException: boolean;
  scenario?: "unavailable-top-vendor";
  order?: GenericMockOrder;
};

const localOffers: VendorOffer[] = [
  { id: "laptop-a-1", vendorId: "vendor-a", vendorName: "Vendor A", productCategory: "laptop", productName: "Atlas Business 14", description: "Intel i5 business laptop, 16 GB RAM, 512 GB SSD", attributes: { ram_gb: 16, storage_gb: 512, cpu: "i5", display_inches: 14 }, unitPriceInr: 44200, availableQuantity: 14, availability: "in_stock", deliveryDays: 4, sellerRating: 4.8, returnDays: 14, returnPolicy: "14 days", sourceType: "simulated", sourceReference: "laptop-a-1" },
  { id: "laptop-b-1", vendorId: "vendor-b", vendorName: "Vendor B", productCategory: "laptop", productName: "Vector Work 14", description: "Intel i5 business laptop, 16 GB RAM, 512 GB SSD", attributes: { ram_gb: 16, storage_gb: 512, cpu: "i5", display_inches: 14 }, unitPriceInr: 42800, availableQuantity: 16, availability: "in_stock", deliveryDays: 5, sellerRating: 4.3, returnDays: 7, returnPolicy: "7 days", sourceType: "simulated", sourceReference: "laptop-b-1" },
  { id: "laptop-a-2", vendorId: "vendor-a", vendorName: "Vendor A", productCategory: "laptop", productName: "Atlas Lite 14", description: "Intel i5 laptop, 8 GB RAM, 512 GB SSD", attributes: { ram_gb: 8, storage_gb: 512, cpu: "i5", display_inches: 14 }, unitPriceInr: 39800, availableQuantity: 20, availability: "in_stock", deliveryDays: 3, sellerRating: 4.5, returnDays: 14, returnPolicy: "14 days", sourceType: "simulated", sourceReference: "laptop-a-2" },
  { id: "laptop-b-2", vendorId: "vendor-b", vendorName: "Vendor B", productCategory: "laptop", productName: "Vector Plus 15", description: "Intel i5 laptop, 16 GB RAM, 1 TB SSD", attributes: { ram_gb: 16, storage_gb: 1024, cpu: "i5", display_inches: 15 }, unitPriceInr: 48600, availableQuantity: 4, availability: "low_stock", deliveryDays: 4, sellerRating: 4.6, returnDays: 10, returnPolicy: "10 days", sourceType: "simulated", sourceReference: "laptop-b-2" },
  { id: "chair-a-generic", vendorId: "vendor-a", vendorName: "Vendor A", productCategory: "chair", productName: "Ergo Frame Chair", description: "Ergonomic office chair with adjustable height and lumbar support", attributes: { ergonomic: true, adjustable_height: true, lumbar_support: true }, unitPriceInr: 9700, availableQuantity: 30, availability: "in_stock", deliveryDays: 3, sellerRating: 4.7, returnDays: 14, returnPolicy: "14 days", sourceType: "simulated", sourceReference: "chair-a-generic" },
  { id: "chair-b-generic", vendorId: "vendor-b", vendorName: "Vendor B", productCategory: "chair", productName: "Posture Desk Chair", description: "Ergonomic chair with adjustable height", attributes: { ergonomic: true, adjustable_height: true }, unitPriceInr: 8900, availableQuantity: 28, availability: "in_stock", deliveryDays: 5, sellerRating: 4.2, returnDays: 7, returnPolicy: "7 days", sourceType: "simulated", sourceReference: "chair-b-generic" },
  { id: "monitor-a-generic", vendorId: "vendor-a", vendorName: "Vendor A", productCategory: "monitor", productName: "Canvas QHD 27", description: "27 inch QHD monitor with HDMI", attributes: { display_inches: 27, resolution: "qhd", hdmi: true }, unitPriceInr: 23200, availableQuantity: 11, availability: "in_stock", deliveryDays: 5, sellerRating: 4.6, returnDays: 7, returnPolicy: "7 days", sourceType: "simulated", sourceReference: "monitor-a-generic" },
  { id: "monitor-b-generic", vendorId: "vendor-b", vendorName: "Vendor B", productCategory: "monitor", productName: "Focus Panel 27", description: "27 inch QHD monitor with HDMI", attributes: { display_inches: 27, resolution: "qhd", hdmi: true }, unitPriceInr: 20700, availableQuantity: 15, availability: "in_stock", deliveryDays: 6, sellerRating: 4.0, returnDays: 7, returnPolicy: "7 days", sourceType: "simulated", sourceReference: "monitor-b-generic" },
];

export class LocalDemoVendorProvider implements VendorSearchProvider {
  constructor(private readonly offers: VendorOffer[] = localOffers) {}

  async search({ brief }: { brief: BuyingBrief; query: string }): Promise<VendorOffer[]> {
    return this.offers.filter((offer) => offer.productCategory === brief.productCategory).map((offer) => ({ ...offer, attributes: { ...offer.attributes } }));
  }

  sources() {
    return ["Vendor A", "Vendor B"] as const;
  }
}

export const localDemoVendorProvider = new LocalDemoVendorProvider();

export function buildVendorQuery(brief: BuyingBrief) {
  const requirements = brief.hardRequirements.map((requirement) => requirement.label).join(", ") || "no product-specific requirements";
  const budget = brief.maxUnitPriceInr ? `₹${brief.maxUnitPriceInr.toLocaleString("en-IN")} per unit` : brief.maxTotalPriceInr ? `₹${brief.maxTotalPriceInr.toLocaleString("en-IN")} total` : "budget pending";
  return `category: ${brief.productCategory}; quantity: ${brief.quantity}; requirements: ${requirements}; budget: ${budget}; availability: online purchase`;
}

function requirementMatches(offer: VendorOffer, requirement: Requirement) {
  const value = requirement.key === "return_days" ? offer.returnDays : offer.attributes[requirement.key];
  const description = `${offer.description ?? ""} ${offer.productName}`.toLowerCase();
  if (value === undefined) return requirement.operator === "contains" && description.includes(String(requirement.value).toLowerCase());
  if (requirement.operator === "equals") return String(value).toLowerCase() === String(requirement.value).toLowerCase();
  if (requirement.operator === "at_least") return Number(value) >= Number(requirement.value);
  if (requirement.operator === "at_most" || requirement.operator === "within_days") return Number(value) <= Number(requirement.value);
  if (requirement.operator === "contains") return typeof value === "boolean" ? value : String(value).toLowerCase().includes(String(requirement.value).toLowerCase());
  return true;
}

export function evaluateGenericOffer(brief: BuyingBrief, offer: VendorOffer): GenericOfferEvaluation {
  const hardFailures = [
    offer.availability === "unavailable" && "Vendor reported this offer unavailable",
    offer.availableQuantity < brief.quantity && `Only ${offer.availableQuantity} units available for a request of ${brief.quantity}`,
    ...brief.hardRequirements.filter((requirement) => !requirementMatches(offer, requirement)).map((requirement) => `Missing or unverified requirement: ${requirement.label}`),
    brief.deliveryDeadlineDays && offer.deliveryDays && offer.deliveryDays > brief.deliveryDeadlineDays && `Delivery is ${offer.deliveryDays} days; deadline is ${brief.deliveryDeadlineDays} days`,
    brief.maxUnitPriceInr && offer.unitPriceInr > brief.maxUnitPriceInr && `Unit price exceeds the stated budget of ₹${brief.maxUnitPriceInr.toLocaleString("en-IN")}`,
    brief.maxTotalPriceInr && offer.unitPriceInr * brief.quantity > brief.maxTotalPriceInr && `Batch total exceeds the stated budget of ₹${brief.maxTotalPriceInr.toLocaleString("en-IN")}`,
  ].filter(Boolean) as string[];
  const totalRequirements = Math.max(1, brief.hardRequirements.length);
  const matchedRequirements = brief.hardRequirements.filter((requirement) => requirementMatches(offer, requirement)).length;
  const requirementFit = Math.round((matchedRequirements / totalRequirements) * 30);
  const referencePrice = brief.maxUnitPriceInr ?? (brief.maxTotalPriceInr ? Math.floor(brief.maxTotalPriceInr / brief.quantity) : offer.unitPriceInr);
  const priceValue = Math.max(0, Math.round((1 - Math.max(0, offer.unitPriceInr - referencePrice) / Math.max(1, referencePrice)) * 25));
  const delivery = brief.deliveryDeadlineDays && offer.deliveryDays ? Math.max(0, Math.round((1 - Math.max(0, offer.deliveryDays - 1) / brief.deliveryDeadlineDays) * 20)) : 16;
  const reliability = Math.round(((offer.sellerRating ?? 0) / 5) * 15);
  const returns = Math.min(10, Math.round(((offer.returnDays ?? 0) / 10) * 10));
  return {
    offer,
    hardFailures,
    eligible: hardFailures.length === 0,
    requiresApproval: Boolean(brief.authorizationLimitInr && offer.unitPriceInr > brief.authorizationLimitInr),
    score: requirementFit + priceValue + delivery + reliability + returns,
    scoreBreakdown: { requirements: requirementFit, priceValue, delivery, reliability, returns },
  };
}

export function recommendGenericOffer(brief: BuyingBrief, offers: VendorOffer[]): GenericRecommendation {
  const candidates = offers.map((offer) => evaluateGenericOffer(brief, offer)).sort((a, b) => b.score - a.score);
  const selected = candidates.find((candidate) => candidate.eligible);
  if (!selected) return { brief, candidates, decision: "BLOCKED", reason: offers.length ? "No offer can be verified against the requested quantity, requirements, budget, delivery, and availability constraints." : `No local simulated catalog is available for “${brief.productCategory}”.` };
  if (selected.requiresApproval) {
    const overage = selected.offer.unitPriceInr - (brief.authorizationLimitInr ?? 0);
    return { brief, candidates, selected, decision: "PENDING_APPROVAL", reason: `${selected.offer.vendorName} is the highest eligible fit, but exceeds the authorization limit by ₹${overage.toLocaleString("en-IN")} per unit.` };
  }
  return { brief, candidates, selected, decision: "AUTO_AUTHORIZED", reason: `${selected.offer.vendorName} is the highest eligible verified offer within the authorization limit.` };
}

function addEvent(audit: AuditEvent[], event: Omit<AuditEvent, "id" | "timestamp">) {
  audit.push({ ...event, id: `generic-audit-${audit.length + 1}`, timestamp: `2026-08-21T11:${String(audit.length + 1).padStart(2, "0")}:00+05:30` });
}

function orderFor(brief: BuyingBrief, offer: VendorOffer, sequence: number): GenericMockOrder {
  return { id: `GEN-ORD-${2200 + sequence}`, briefId: brief.id, productCategory: brief.productCategory, vendorName: offer.vendorName, totalInr: brief.quantity * offer.unitPriceInr, deliveryDays: offer.deliveryDays };
}

export async function runGenericProcurement(brief: BuyingBrief, provider: VendorSearchProvider = localDemoVendorProvider): Promise<GenericProcurementSession> {
  const audit: AuditEvent[] = [];
  const query = buildVendorQuery(brief);
  addEvent(audit, { type: "BRIEF_NORMALIZED", actor: "Requester", itemId: brief.id, summary: `Normalized ${brief.quantity} ${brief.productCategory} request from the buying brief.` });
  const offers = await provider.search({ brief, query });
  (["Vendor A", "Vendor B"] as const).forEach((vendor) => addEvent(audit, { type: "VENDOR_SEARCHED", actor: "Procurement agent", itemId: brief.id, summary: `Searched ${vendor}: ${offers.filter((offer) => offer.vendorName === vendor).length} matching offers found.` }));
  const recommendation = recommendGenericOffer(brief, offers);
  addEvent(audit, { type: "OFFERS_COMPARED", actor: "Procurement agent", itemId: brief.id, summary: `Compared ${recommendation.candidates.length} normalized ${brief.productCategory} offers across requirement fit, price, delivery, seller reliability, and returns.` });
  if (!recommendation.selected) {
    addEvent(audit, { type: "WORKFLOW_BLOCKED", actor: "Procurement agent", itemId: brief.id, summary: recommendation.reason });
    return { brief, query, status: "BLOCKED", recommendation, audit, approvedException: false };
  }
  const selected = recommendation.selected.offer;
  addEvent(audit, { type: "RECOMMENDATION_CREATED", actor: "Procurement agent", itemId: brief.id, summary: `Selected ${selected.vendorName}: ${selected.productName} at ₹${selected.unitPriceInr.toLocaleString("en-IN")} per unit.`, detail: recommendation.reason });
  if (recommendation.decision === "PENDING_APPROVAL") {
    addEvent(audit, { type: "APPROVAL_REQUESTED", actor: "Procurement agent", itemId: brief.id, summary: "Paused before simulated purchase because the selected offer exceeds authority." });
    return { brief, query, status: "PENDING_APPROVAL", recommendation, audit, approvedException: false };
  }
  addEvent(audit, { type: "AUTO_AUTHORIZED", actor: "Procurement agent", itemId: brief.id, summary: "Policy check passed. Purchase is within the agent’s authorization." });
  addEvent(audit, { type: "VENDOR_CONFIRMATION_REQUESTED", actor: "Procurement agent", itemId: brief.id, summary: `Awaiting ${selected.vendorName} confirmation. Terms may be accepted, rejected, or countered before a simulated purchase.` });
  return { brief, query, status: "CONFIRMING", recommendation, audit, approvedException: false };
}

export function resolveVendorConfirmation(session: GenericProcurementSession, decision: "accept" | "reject" | "counter", counterOffer?: Partial<Pick<VendorOffer, "unitPriceInr" | "deliveryDays" | "availableQuantity" | "availability">>): GenericProcurementSession {
  if (session.status !== "CONFIRMING" || !session.recommendation.selected) return session;
  const audit = [...session.audit];
  const selected = session.recommendation.selected.offer;
  if (decision === "reject") {
    addEvent(audit, { type: "VENDOR_CONFIRMATION_REJECTED", actor: "Requester", itemId: session.brief.id, summary: `Vendor confirmation rejected for ${selected.vendorName}. No simulated purchase was created.` });
    return { ...session, status: "REJECTED", audit };
  }
  const amended = { ...selected, ...counterOffer };
  const materialChange = amended.unitPriceInr !== selected.unitPriceInr || amended.deliveryDays !== selected.deliveryDays || amended.availableQuantity !== selected.availableQuantity || amended.availability !== selected.availability;
  if (decision === "counter" && materialChange) {
    addEvent(audit, { type: "VENDOR_COUNTER_OFFER", actor: "Requester", itemId: session.brief.id, summary: `Counter-offer received from ${selected.vendorName}; policy is being re-evaluated before any simulated purchase.`, detail: `Proposed ₹${amended.unitPriceInr.toLocaleString("en-IN")} per unit with ${amended.deliveryDays ?? "unverified"}-day delivery.` });
    const offers = session.recommendation.candidates.map(candidate => candidate.offer.id === selected.id ? amended : candidate.offer);
    const recommendation = recommendGenericOffer(session.brief, offers);
    addEvent(audit, { type: "OFFERS_REEVALUATED", actor: "Procurement agent", itemId: session.brief.id, summary: "Re-evaluated all candidates after the vendor counter-offer across requirement fit, price, delivery, reliability, and returns." });
    if (!recommendation.selected) {
      addEvent(audit, { type: "WORKFLOW_BLOCKED", actor: "Procurement agent", itemId: session.brief.id, summary: recommendation.reason });
      return { ...session, recommendation, status: "BLOCKED", audit };
    }
    if (recommendation.decision === "PENDING_APPROVAL") {
      addEvent(audit, { type: "APPROVAL_REQUESTED", actor: "Procurement agent", itemId: session.brief.id, summary: "The counter-offer crossed the authorization boundary. Explicit approval is required." });
      return { ...session, recommendation, status: "PENDING_APPROVAL", audit, approvedException: false };
    }
    const reselected = recommendation.selected.offer;
    addEvent(audit, { type: "VENDOR_CONFIRMED", actor: "Procurement agent", itemId: session.brief.id, summary: `Counter-offer accepted after re-evaluation: ${reselected.vendorName} at ₹${reselected.unitPriceInr.toLocaleString("en-IN")} per unit.` });
    const order = orderFor(session.brief, reselected, audit.length + 1);
    addEvent(audit, { type: "MOCK_PURCHASE_CONFIRMED", actor: "Procurement agent", itemId: session.brief.id, summary: `Simulated purchase confirmed. Order ${order.id} recorded.`, detail: "No real payment was created." });
    return { ...session, recommendation, status: "PURCHASED", audit, order };
  }
  addEvent(audit, { type: "VENDOR_CONFIRMED", actor: "Procurement agent", itemId: session.brief.id, summary: `Final vendor terms accepted: ₹${selected.unitPriceInr.toLocaleString("en-IN")} per unit, delivery in ${selected.deliveryDays ?? "an unverified"} day window.` });
  const order = orderFor(session.brief, selected, audit.length + 1);
  addEvent(audit, { type: "MOCK_PURCHASE_CONFIRMED", actor: "Procurement agent", itemId: session.brief.id, summary: `Simulated purchase confirmed. Order ${order.id} recorded.`, detail: "No real payment was created." });
  return { ...session, status: "PURCHASED", audit, order };
}

export async function runUnavailableTopVendorScenario(): Promise<GenericProcurementSession> {
  const provider = new LocalDemoVendorProvider(localOffers.map((offer) => offer.id === "laptop-a-1" ? { ...offer, availability: "unavailable" as const, availableQuantity: 0 } : offer));
  const session = await runGenericProcurement(laptopDemoBrief, provider);
  const audit = [...session.audit];
  addEvent(audit, { type: "TOP_VENDOR_UNAVAILABLE", actor: "Procurement agent", itemId: laptopDemoBrief.id, summary: "Scenario: nominal top-fit Vendor A offer became unavailable. The comparison was re-ranked without relaxing any requirement.", detail: `Selected next eligible offer: ${session.recommendation.selected?.offer.vendorName ?? "none"}.` });
  return { ...session, scenario: "unavailable-top-vendor", audit };
}

export function resolveGenericApproval(session: GenericProcurementSession, approve: boolean, confirmationOverride?: Partial<VendorOffer>): GenericProcurementSession {
  if (session.status !== "PENDING_APPROVAL" || !session.recommendation.selected) return session;
  const audit = [...session.audit];
  if (!approve) {
    addEvent(audit, { type: "APPROVAL_REJECTED", actor: "Finance approver", itemId: session.brief.id, summary: "Exception rejected. No simulated purchase was created." });
    return { ...session, status: "REJECTED", audit };
  }
  const selected = session.recommendation.selected.offer;
  addEvent(audit, { type: "APPROVAL_GRANTED", actor: "Finance approver", itemId: session.brief.id, summary: "Approved the category-agnostic purchase exception." });
  const confirmed = { ...selected, ...confirmationOverride, attributes: { ...selected.attributes, ...(confirmationOverride?.attributes ?? {}) } };
  const confirmation = evaluateGenericOffer(session.brief, confirmed);
  const changed = confirmed.unitPriceInr !== selected.unitPriceInr || confirmed.deliveryDays !== selected.deliveryDays || confirmed.availableQuantity !== selected.availableQuantity || confirmed.availability !== selected.availability;
  if (!confirmation.eligible || changed) {
    addEvent(audit, { type: "TERMS_CHANGED", actor: "Procurement agent", itemId: session.brief.id, summary: "Vendor confirmation changed a material term. Approval must be reviewed again." });
    return { ...session, status: "PENDING_APPROVAL", audit, approvedException: false };
  }
  addEvent(audit, { type: "VENDOR_CONFIRMED", actor: "Procurement agent", itemId: session.brief.id, summary: `Final vendor terms re-checked for ${session.brief.productCategory}.` });
  const order = orderFor(session.brief, confirmed, audit.length + 1);
  addEvent(audit, { type: "MOCK_PURCHASE_CONFIRMED", actor: "Procurement agent", itemId: session.brief.id, summary: `Simulated purchase confirmed. Order ${order.id} recorded.`, detail: "No real payment was created." });
  return { ...session, status: "PURCHASED", audit, approvedException: true, order };
}

export const genericLocalCatalog = localOffers;
