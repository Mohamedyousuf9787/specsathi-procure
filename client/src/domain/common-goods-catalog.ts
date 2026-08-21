import type { BuyingBrief, VendorOffer } from "./generic-procurement";

export const COMMON_PRODUCT_BASES = [
  "printer", "scanner", "copier", "shredder", "laminator", "calculator", "keyboard", "webcam", "headset", "microphone",
  "speaker", "monitor-arm", "laptop-stand", "usb-hub", "docking-station", "hard-drive", "flash-drive", "memory-card", "ethernet-switch", "router",
  "access-point", "surge-protector", "ups", "battery-pack", "charger", "power-bank", "adapter", "cable", "hdmi-cable", "ethernet-cable",
  "label-maker", "barcode-scanner", "receipt-printer", "cash-drawer", "tablet", "e-reader", "phone-case", "screen-protector", "smartwatch", "fitness-tracker",
  "camera", "tripod", "ring-light", "projector", "projector-screen", "whiteboard", "notice-board", "paper", "notebook", "binder",
  "folder", "stapler", "hole-punch", "tape-dispenser", "marker", "pen", "pencil", "envelope", "label", "packaging-box",
  "bubble-wrap", "pallet-wrap", "safety-vest", "helmet", "gloves", "mask", "first-aid-kit", "fire-extinguisher", "tool-kit", "drill",
  "screwdriver", "wrench", "pliers", "ladder", "trolley", "storage-bin", "shelving", "cabinet", "desk-lamp", "floor-lamp",
  "fan", "air-purifier", "water-dispenser", "coffee-machine", "microwave", "refrigerator", "kettle", "vacuum-cleaner", "mop", "broom",
  "cleaning-wipes", "soap-dispenser", "sanitizer", "tissue", "printer-toner", "ink-cartridge", "desk", "chair", "monitor", "mouse",
] as const;

export const CATALOG_FAMILIES = ["basic", "standard", "office", "portable", "durable", "compact", "professional", "essential", "bulk", "field"] as const;

export type CommonGoodsDescriptor = {
  id: string;
  base: string;
  family: string;
  displayName: string;
};

const words = (value: string) => value.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

/**
 * Exactly 1,000 labelled category descriptors. They are not marketplace listings,
 * and offer records are deliberately generated only after a matching brief arrives.
 */
export const commonGoodsDescriptors: readonly CommonGoodsDescriptor[] = CATALOG_FAMILIES.flatMap(family => COMMON_PRODUCT_BASES.map(base => ({
  id: `${family}-${base}`,
  base,
  family,
  displayName: `${words(family)} ${words(base)}`,
})));

export const COMMON_GOODS_DESCRIPTOR_COUNT = commonGoodsDescriptors.length;

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesBase(category: string, base: string) {
  const compact = normalized(category);
  return compact === base.replace(/-/g, " ") || compact.includes(base.replace(/-/g, " "));
}

export function resolveCommonGoodsDescriptor(category: string): CommonGoodsDescriptor | undefined {
  const base = COMMON_PRODUCT_BASES.find(candidate => matchesBase(category, candidate));
  if (!base) return undefined;
  const categoryWords = normalized(category).split(" ");
  const family = CATALOG_FAMILIES.find(candidate => categoryWords.includes(candidate)) ?? "standard";
  return commonGoodsDescriptors.find(descriptor => descriptor.base === base && descriptor.family === family);
}

function constraintAttributes(brief: BuyingBrief) {
  return Object.fromEntries(brief.hardRequirements.map(requirement => [requirement.key, requirement.value]));
}

function referenceUnitPrice(brief: BuyingBrief) {
  const budget = brief.maxUnitPriceInr ?? brief.authorizationLimitInr ?? (brief.maxTotalPriceInr ? Math.floor(brief.maxTotalPriceInr / Math.max(1, brief.quantity)) : 10_000);
  return Math.max(100, budget);
}

function deliveryFor(brief: BuyingBrief, defaultDays: number) {
  return brief.deliveryDeadlineDays ? Math.max(1, Math.min(brief.deliveryDeadlineDays, defaultDays)) : defaultDays;
}

/** Creates two clearly simulated comparison candidates only for the active brief. */
export function buildCommonGoodsVendorOffers(brief: BuyingBrief): VendorOffer[] {
  const descriptor = resolveCommonGoodsDescriptor(brief.productCategory);
  if (!descriptor) return [];
  const attributes = constraintAttributes(brief);
  const price = referenceUnitPrice(brief);
  const categoryLabel = descriptor.displayName;
  const create = (vendorId: "vendor-a" | "vendor-b", vendorName: "Vendor A" | "Vendor B", priceMultiplier: number, deliveryDays: number, rating: number, returnDays: number): VendorOffer => ({
    id: `common-goods-${descriptor.id}-${vendorId}`,
    vendorId,
    vendorName,
    productCategory: brief.productCategory,
    productName: `${vendorName} · ${categoryLabel} template`,
    description: `Labelled deterministic ${categoryLabel.toLowerCase()} comparison template matched to the confirmed requirements. This is not a live marketplace listing.`,
    attributes,
    unitPriceInr: Math.max(100, Math.floor(price * priceMultiplier / 10) * 10),
    availableQuantity: Math.max(brief.quantity, 20),
    availability: "in_stock",
    deliveryDays: deliveryFor(brief, deliveryDays),
    sellerRating: rating,
    returnDays,
    returnPolicy: `${returnDays} days`,
    sourceType: "simulated",
    sourceReference: `common-goods-${descriptor.id}`,
  });
  return [
    create("vendor-a", "Vendor A", 0.92, 4, 4.7, 14),
    create("vendor-b", "Vendor B", 0.97, 6, 4.4, 10),
  ];
}
