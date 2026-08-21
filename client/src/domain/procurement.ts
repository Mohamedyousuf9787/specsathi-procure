/**
 * Calm operational paper: deterministic procurement logic for an offline demo.
 * The blue UI accent signals actions; policy outcomes remain data, never color-only.
 */

export type ProcurementStatus =
  | "DRAFT"
  | "PARSED"
  | "SEARCHING"
  | "RECOMMENDED"
  | "AUTO_AUTHORIZED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CONFIRMING"
  | "PURCHASED"
  | "BLOCKED";

export type DemoVariant = "golden" | "vendor-unavailable" | "no-match" | "changed-terms";

export type BuyingItem = {
  id: string;
  name: string;
  quantity: number;
  requiredSpecs: string[];
  authorizationLimit: number;
  deliveryDays: number;
  minReturnDays?: number;
};

export type VendorOffer = {
  id: string;
  vendor: "Vendor A" | "Vendor B";
  product: string;
  category: string;
  unitPrice: number;
  stock: number;
  specs: string[];
  deliveryDays: number;
  sellerRating: number;
  returnDays: number;
  available: boolean;
  confirmation?: Partial<Pick<VendorOffer, "unitPrice" | "deliveryDays" | "stock" | "available">>;
};

export type OfferEvaluation = {
  offer: VendorOffer;
  score: number;
  hardFailures: string[];
  eligible: boolean;
  requiresApproval: boolean;
  scoreBreakdown: Record<string, number>;
};

export type Recommendation = {
  item: BuyingItem;
  candidates: OfferEvaluation[];
  selected?: OfferEvaluation;
  decision: "AUTO_AUTHORIZED" | "PENDING_APPROVAL" | "BLOCKED";
  reason: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  type: string;
  actor: "Procurement agent" | "Finance approver" | "Requester";
  itemId?: string;
  summary: string;
  detail?: string;
};

export type MockOrder = {
  id: string;
  itemId: string;
  vendor: VendorOffer["vendor"];
  total: number;
  deliveryDays: number;
};

export type ProcurementItemState = {
  item: BuyingItem;
  status: ProcurementStatus;
  recommendation: Recommendation;
  approvedException: boolean;
  order?: MockOrder;
};

export type ProcurementSession = {
  variant: DemoVariant;
  brief: string;
  itemStates: ProcurementItemState[];
  audit: AuditEvent[];
};

const allowedTransitions: Record<ProcurementStatus, ProcurementStatus[]> = {
  DRAFT: ["PARSED"],
  PARSED: ["SEARCHING"],
  SEARCHING: ["RECOMMENDED"],
  RECOMMENDED: ["AUTO_AUTHORIZED", "PENDING_APPROVAL", "BLOCKED"],
  AUTO_AUTHORIZED: ["CONFIRMING"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["CONFIRMING"],
  REJECTED: [],
  CONFIRMING: ["PURCHASED", "PENDING_APPROVAL", "BLOCKED"],
  PURCHASED: [],
  BLOCKED: [],
};

export function transitionStatus(from: ProcurementStatus, to: ProcurementStatus): ProcurementStatus {
  return allowedTransitions[from].includes(to) ? to : "BLOCKED";
}

const goldenBrief =
  "For 8 new joiners, buy adjustable aluminum laptop stands under ₹3,000 each, ergonomic office chairs under ₹12,000 each, and 27-inch QHD HDMI monitors under ₹20,000 each. Delivery is required within 7 days. The agent may approve purchases only within the stated unit limits.";

export const goldenItems: BuyingItem[] = [
  {
    id: "stands",
    name: "Laptop stand",
    quantity: 8,
    requiredSpecs: ["adjustable", "aluminum", "non-slip base"],
    authorizationLimit: 3000,
    deliveryDays: 7,
  },
  {
    id: "chairs",
    name: "Office chair",
    quantity: 8,
    requiredSpecs: ["ergonomic back support", "adjustable height"],
    authorizationLimit: 12000,
    deliveryDays: 7,
    minReturnDays: 7,
  },
  {
    id: "monitors",
    name: "External monitor",
    quantity: 8,
    requiredSpecs: ["27-inch", "qhd", "hdmi"],
    authorizationLimit: 20000,
    deliveryDays: 7,
  },
];

const catalog: VendorOffer[] = [
  { id: "stand-a-1", vendor: "Vendor A", product: "Arc Adjustable Stand", category: "stands", unitPrice: 2360, stock: 15, specs: ["adjustable", "aluminum", "non-slip base"], deliveryDays: 3, sellerRating: 4.7, returnDays: 10, available: true },
  { id: "stand-b-1", vendor: "Vendor B", product: "Lift Aluminum Stand", category: "stands", unitPrice: 2180, stock: 16, specs: ["adjustable", "aluminum", "non-slip base"], deliveryDays: 5, sellerRating: 4.3, returnDays: 7, available: true },
  { id: "stand-a-2", vendor: "Vendor A", product: "Fold Lite Stand", category: "stands", unitPrice: 1980, stock: 20, specs: ["adjustable", "aluminum"], deliveryDays: 4, sellerRating: 4.4, returnDays: 7, available: true },
  { id: "stand-b-2", vendor: "Vendor B", product: "Work Base Stand", category: "stands", unitPrice: 2490, stock: 5, specs: ["adjustable", "aluminum", "non-slip base"], deliveryDays: 4, sellerRating: 4.6, returnDays: 10, available: true },
  { id: "chair-a-1", vendor: "Vendor A", product: "Ergo Frame Chair", category: "chairs", unitPrice: 11700, stock: 12, specs: ["ergonomic back support", "adjustable height"], deliveryDays: 5, sellerRating: 4.8, returnDays: 14, available: true },
  { id: "chair-b-1", vendor: "Vendor B", product: "Posture Desk Chair", category: "chairs", unitPrice: 10400, stock: 20, specs: ["ergonomic back support", "adjustable height"], deliveryDays: 7, sellerRating: 4.2, returnDays: 3, available: true },
  { id: "chair-a-2", vendor: "Vendor A", product: "Seatline Pro", category: "chairs", unitPrice: 12100, stock: 9, specs: ["ergonomic back support", "adjustable height"], deliveryDays: 6, sellerRating: 4.9, returnDays: 14, available: true },
  { id: "chair-b-2", vendor: "Vendor B", product: "Support Flex Chair", category: "chairs", unitPrice: 9800, stock: 5, specs: ["ergonomic back support", "adjustable height"], deliveryDays: 5, sellerRating: 4.1, returnDays: 7, available: true },
  { id: "monitor-a-1", vendor: "Vendor A", product: "Canvas QHD 27", category: "monitors", unitPrice: 23200, stock: 11, specs: ["27-inch", "qhd", "hdmi"], deliveryDays: 5, sellerRating: 4.6, returnDays: 7, available: true },
  { id: "monitor-b-1", vendor: "Vendor B", product: "Studio View QHD", category: "monitors", unitPrice: 19800, stock: 14, specs: ["27-inch", "qhd", "hdmi"], deliveryDays: 12, sellerRating: 4.2, returnDays: 3, available: true },
  { id: "monitor-a-2", vendor: "Vendor A", product: "ClearDesk 27", category: "monitors", unitPrice: 21900, stock: 7, specs: ["27-inch", "qhd", "hdmi"], deliveryDays: 8, sellerRating: 4.5, returnDays: 7, available: true },
  { id: "monitor-b-2", vendor: "Vendor B", product: "Focus Panel 27", category: "monitors", unitPrice: 20700, stock: 3, specs: ["27-inch", "qhd", "hdmi"], deliveryDays: 6, sellerRating: 4.0, returnDays: 7, available: true },
];

const eventTime = (index: number) => `2026-08-21T10:${String(index).padStart(2, "0")}:00+05:30`;
const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const hasSpec = (offer: VendorOffer, spec: string) =>
  offer.specs.some((value) => value.toLowerCase().includes(spec.toLowerCase()));

export function evaluateOffer(item: BuyingItem, offer: VendorOffer): OfferEvaluation {
  const hardFailures = [
    !offer.available && "Vendor reported this offer unavailable",
    offer.stock < item.quantity && `Only ${offer.stock} units available for a request of ${item.quantity}`,
    ...item.requiredSpecs.filter((spec) => !hasSpec(offer, spec)).map((spec) => `Missing required specification: ${spec}`),
    offer.deliveryDays > item.deliveryDays && `Delivery is ${offer.deliveryDays} days; deadline is ${item.deliveryDays} days`,
    item.minReturnDays && offer.returnDays < item.minReturnDays && `Return policy is ${offer.returnDays} days; ${item.minReturnDays} days required`,
  ].filter(Boolean) as string[];
  const specFit = Math.round(((item.requiredSpecs.length - item.requiredSpecs.filter((spec) => !hasSpec(offer, spec)).length) / item.requiredSpecs.length) * 30);
  const priceValue = Math.max(0, Math.round((1 - Math.max(0, offer.unitPrice - item.authorizationLimit) / item.authorizationLimit) * 25));
  const delivery = Math.max(0, Math.round((1 - Math.max(0, offer.deliveryDays - 1) / item.deliveryDays) * 20));
  const reliability = Math.round((offer.sellerRating / 5) * 15);
  const returns = item.minReturnDays ? Math.min(10, Math.round((offer.returnDays / item.minReturnDays) * 10)) : Math.min(10, Math.round((offer.returnDays / 10) * 10));
  return {
    offer,
    hardFailures,
    eligible: hardFailures.length === 0,
    requiresApproval: offer.unitPrice > item.authorizationLimit,
    score: specFit + priceValue + delivery + reliability + returns,
    scoreBreakdown: { specifications: specFit, priceValue, delivery, reliability, returns },
  };
}

export function recommend(item: BuyingItem, offers: VendorOffer[]): Recommendation {
  const candidates = offers.map((offer) => evaluateOffer(item, offer)).sort((a, b) => b.score - a.score);
  const selected = candidates.find((candidate) => candidate.eligible);
  if (!selected) {
    return { item, candidates, decision: "BLOCKED", reason: "No offer meets the required specifications, quantity, delivery, return, and availability constraints." };
  }
  if (selected.requiresApproval) {
    const overage = selected.offer.unitPrice - item.authorizationLimit;
    return { item, candidates, selected, decision: "PENDING_APPROVAL", reason: `${selected.offer.vendor} is the highest eligible fit, but exceeds authority by ${formatRupees(overage)} per unit.` };
  }
  return { item, candidates, selected, decision: "AUTO_AUTHORIZED", reason: `${selected.offer.vendor} is the highest eligible fit within the authorization ceiling.` };
}

const offersForVariant = (variant: DemoVariant): VendorOffer[] => {
  const offers = catalog.map((offer) => ({ ...offer, specs: [...offer.specs] }));
  if (variant === "vendor-unavailable") {
    const recommendedStand = offers.find((offer) => offer.id === "stand-a-1");
    if (recommendedStand) recommendedStand.available = false;
  }
  if (variant === "no-match") {
    offers.filter((offer) => offer.category === "monitors").forEach((offer) => { offer.available = false; });
  }
  if (variant === "changed-terms") {
    const monitor = offers.find((offer) => offer.id === "monitor-a-1");
    if (monitor) monitor.confirmation = { unitPrice: 24500 };
  }
  return offers;
};

const addEvent = (events: AuditEvent[], event: Omit<AuditEvent, "id" | "timestamp">) => {
  events.push({ ...event, id: `audit-${events.length + 1}`, timestamp: eventTime(events.length + 1) });
};

const makeOrder = (item: BuyingItem, offer: VendorOffer, index: number): MockOrder => ({
  id: `DEMO-ORD-${1048 + index}`,
  itemId: item.id,
  vendor: offer.vendor,
  total: item.quantity * offer.unitPrice,
  deliveryDays: offer.deliveryDays,
});

export function runDemo(variant: DemoVariant = "golden", items: BuyingItem[] = goldenItems): ProcurementSession {
  const audit: AuditEvent[] = [];
  const offers = offersForVariant(variant);
  addEvent(audit, { type: "BRIEF_RECEIVED", actor: "Requester", summary: "Buying brief received for eight new joiners." });
  addEvent(audit, { type: "CONSTRAINTS_CONFIRMED", actor: "Requester", summary: "Quantity, delivery deadline, specifications, and authorization ceilings confirmed." });
  const itemStates = items.map((item, index) => {
    const itemOffers = offers.filter((offer) => offer.category === item.id);
    (["Vendor A", "Vendor B"] as const).forEach((vendor) => {
      const found = itemOffers.filter((offer) => offer.vendor === vendor).length;
      addEvent(audit, { type: "VENDOR_SEARCHED", actor: "Procurement agent", itemId: item.id, summary: `Searched ${vendor}: ${found} matching offers found.` });
    });
    const recommendation = recommend(item, itemOffers);
    const rejected = recommendation.candidates.filter((candidate) => !candidate.eligible).length;
    addEvent(audit, { type: "OFFERS_COMPARED", actor: "Procurement agent", itemId: item.id, summary: `Compared ${recommendation.candidates.length} offers across price, specification fit, delivery, seller reliability, and returns.`, detail: rejected ? `${rejected} offer(s) failed a hard constraint.` : undefined });
    if (!recommendation.selected) {
      addEvent(audit, { type: "WORKFLOW_BLOCKED", actor: "Procurement agent", itemId: item.id, summary: recommendation.reason });
      return { item, status: "BLOCKED" as const, recommendation, approvedException: false };
    }
    const selected = recommendation.selected.offer;
    addEvent(audit, { type: "RECOMMENDATION_CREATED", actor: "Procurement agent", itemId: item.id, summary: `Selected ${selected.vendor}: ${selected.product} at ${formatRupees(selected.unitPrice)} per unit.`, detail: recommendation.reason });
    if (recommendation.decision === "PENDING_APPROVAL") {
      addEvent(audit, { type: "APPROVAL_REQUESTED", actor: "Procurement agent", itemId: item.id, summary: `Paused before purchase: ${formatRupees(selected.unitPrice - item.authorizationLimit)} above the authorization ceiling per unit.` });
      return { item, status: "PENDING_APPROVAL" as const, recommendation, approvedException: false };
    }
    addEvent(audit, { type: "AUTO_AUTHORIZED", actor: "Procurement agent", itemId: item.id, summary: "Policy check passed. Purchase is within the agent's authorization." });
    addEvent(audit, { type: "VENDOR_CONFIRMED", actor: "Procurement agent", itemId: item.id, summary: `Final vendor terms re-checked: ${formatRupees(selected.unitPrice)} per unit, delivery in ${selected.deliveryDays} days.` });
    const order = makeOrder(item, selected, index);
    addEvent(audit, { type: "MOCK_PURCHASE_CONFIRMED", actor: "Procurement agent", itemId: item.id, summary: `Simulated purchase confirmed. Order ${order.id} recorded.`, detail: "No real payment was created." });
    return { item, status: "PURCHASED" as const, recommendation, approvedException: false, order };
  });
  return { variant, brief: goldenBrief, itemStates, audit };
}

export function resolveApproval(session: ProcurementSession, itemId: string, approve: boolean): ProcurementSession {
  const next: ProcurementSession = { ...session, itemStates: session.itemStates.map((state) => ({ ...state })), audit: [...session.audit] };
  const state = next.itemStates.find((entry) => entry.item.id === itemId);
  if (!state || state.status !== "PENDING_APPROVAL" || !state.recommendation.selected) return next;
  if (!approve) {
    state.status = "REJECTED";
    addEvent(next.audit, { type: "APPROVAL_REJECTED", actor: "Finance approver", itemId, summary: "Exception rejected. No simulated purchase was created." });
    return next;
  }
  const selected = state.recommendation.selected.offer;
  state.status = transitionStatus(state.status, "APPROVED");
  state.approvedException = true;
  addEvent(next.audit, { type: "APPROVAL_GRANTED", actor: "Finance approver", itemId, summary: `Approved the ${formatRupees(selected.unitPrice - state.item.authorizationLimit)} per-unit exception.` });
  const confirmed = { ...selected, ...selected.confirmation };
  const confirmation = evaluateOffer(state.item, confirmed);
  const changed = confirmed.unitPrice !== selected.unitPrice || confirmed.deliveryDays !== selected.deliveryDays || confirmed.stock !== selected.stock || confirmed.available !== selected.available;
  if (!confirmation.eligible || changed) {
    state.status = "PENDING_APPROVAL";
    state.approvedException = false;
    addEvent(next.audit, { type: "TERMS_CHANGED", actor: "Procurement agent", itemId, summary: "Vendor confirmation changed a material term. Approval must be reviewed again." });
    return next;
  }
  state.status = transitionStatus(state.status, "CONFIRMING");
  addEvent(next.audit, { type: "VENDOR_CONFIRMED", actor: "Procurement agent", itemId, summary: `Final vendor terms re-checked: ${formatRupees(confirmed.unitPrice)} per unit, delivery in ${confirmed.deliveryDays} days.` });
  state.order = makeOrder(state.item, confirmed, next.itemStates.length);
  state.status = transitionStatus(state.status, "PURCHASED");
  addEvent(next.audit, { type: "MOCK_PURCHASE_CONFIRMED", actor: "Procurement agent", itemId, summary: `Simulated purchase confirmed. Order ${state.order.id} recorded.`, detail: "No real payment was created." });
  return next;
}

export const rupees = formatRupees;
