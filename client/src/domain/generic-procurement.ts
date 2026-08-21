/**
 * Calm operational paper: generic procurement contracts with a legacy-demo bridge.
 * Consequential decisions remain deterministic; these types only normalize product data.
 */
import type { BuyingItem as LegacyBuyingItem, VendorOffer as LegacyVendorOffer } from "./procurement";

export type RequirementOperator = "equals" | "at_least" | "at_most" | "contains" | "within_days" | "preferred";
export type AttributeValue = string | number | boolean;

export type Requirement = {
  key: string;
  label: string;
  operator: RequirementOperator;
  value: AttributeValue;
  unit?: string;
  isHard: boolean;
  sourceText?: string;
};

export type BuyingBrief = {
  id: string;
  productCategory: string;
  productDescription?: string;
  quantity: number;
  hardRequirements: Requirement[];
  softPreferences: Requirement[];
  maxUnitPriceInr?: number;
  maxTotalPriceInr?: number;
  deliveryDeadlineDays?: number;
  returnPolicyRequirement?: string;
  sellerRequirement?: string;
  authorizationLimitInr?: number;
  sourceText: string;
  confidence: number;
};

export type VendorOffer = {
  id: string;
  vendorId: string;
  vendorName: string;
  productCategory: string;
  productName: string;
  description?: string;
  attributes: Record<string, AttributeValue>;
  unitPriceInr: number;
  availableQuantity: number;
  availability: "in_stock" | "low_stock" | "unavailable";
  deliveryDays?: number;
  sellerRating?: number;
  returnPolicy?: string;
  returnDays?: number;
  sourceType: "simulated" | "live";
  sourceReference?: string;
};

export type AttributeDefinition = { key: string; label: string; type: "text" | "number" | "boolean"; unit?: string };
export type ValidationFinding = { level: "warning" | "invalid"; message: string };
export type CategoryProfile = {
  categoryId: string;
  displayName: string;
  aliases: string[];
  knownAttributes: AttributeDefinition[];
  validateRequirement?: (requirement: Requirement) => ValidationFinding[];
  explainRequirement?: (requirement: Requirement) => string;
};

const laptopAttributes: AttributeDefinition[] = [
  { key: "ram_gb", label: "RAM", type: "number", unit: "GB" },
  { key: "storage_gb", label: "SSD storage", type: "number", unit: "GB" },
  { key: "cpu", label: "Processor", type: "text" },
  { key: "display_inches", label: "Display", type: "number", unit: "inch" },
];
const mobileAttributes: AttributeDefinition[] = [
  { key: "storage_gb", label: "Storage", type: "number", unit: "GB" },
  { key: "network_5g", label: "5G", type: "boolean" },
  { key: "battery_mah", label: "Battery", type: "number", unit: "mAh" },
];
const furnitureAttributes: AttributeDefinition[] = [
  { key: "ergonomic", label: "Ergonomic design", type: "boolean" },
  { key: "adjustable_height", label: "Adjustable height", type: "boolean" },
  { key: "lumbar_support", label: "Lumbar support", type: "boolean" },
];
const tyreAttributes: AttributeDefinition[] = [
  { key: "tyre_size", label: "Tyre size", type: "text" },
  { key: "vehicle_model", label: "Vehicle model", type: "text" },
  { key: "tubeless", label: "Tubeless", type: "boolean" },
];

const profileExplanation = (requirement: Requirement) => `${requirement.label} must ${requirement.operator.replaceAll("_", " ")} ${String(requirement.value)}${requirement.unit ? ` ${requirement.unit}` : ""}.`;
const profileValidator = (attributes: AttributeDefinition[], name: string) => (requirement: Requirement) => attributes.some(attribute => attribute.key === requirement.key) ? [] : [{ level: "warning" as const, message: `${requirement.label} is not a known ${name} attribute and will be checked as generic text.` }];

export const laptopProfile: CategoryProfile = { categoryId: "laptop", displayName: "Laptop", aliases: ["laptop", "laptops", "notebook", "notebooks", "computer", "computers"], knownAttributes: laptopAttributes, validateRequirement: profileValidator(laptopAttributes, "laptop"), explainRequirement: profileExplanation };
export const mobileProfile: CategoryProfile = { categoryId: "mobile", displayName: "Mobile device", aliases: ["mobile", "mobiles", "phone", "phones", "smartphone", "smartphones"], knownAttributes: mobileAttributes, validateRequirement: profileValidator(mobileAttributes, "mobile"), explainRequirement: profileExplanation };
export const furnitureProfile: CategoryProfile = { categoryId: "furniture", displayName: "Office furniture", aliases: ["furniture", "desk", "desks", "table", "tables", "workstation", "workstations"], knownAttributes: furnitureAttributes, validateRequirement: profileValidator(furnitureAttributes, "furniture"), explainRequirement: profileExplanation };
export const tyreProfile: CategoryProfile = { categoryId: "tyre", displayName: "Tyre", aliases: ["tyre", "tyres", "tire", "tires"], knownAttributes: tyreAttributes, validateRequirement: profileValidator(tyreAttributes, "tyre"), explainRequirement: profileExplanation };
export const genericProfile: CategoryProfile = { categoryId: "generic", displayName: "Generic product", aliases: [], knownAttributes: [], explainRequirement: requirement => `${requirement.label} is treated as a ${requirement.isHard ? "hard" : "preference"} requirement.` };
export const categoryProfiles: CategoryProfile[] = [laptopProfile, mobileProfile, furnitureProfile, tyreProfile, genericProfile];

export function canonicalCategory(value: string): string {
  const normalized = value.trim().toLowerCase();
  const match = categoryProfiles.find(profile => profile.aliases.includes(normalized));
  return match?.categoryId ?? (normalized.replace(/\s+/g, "-") || "generic");
}
export function getCategoryProfile(category: string): CategoryProfile {
  const canonical = canonicalCategory(category);
  return categoryProfiles.find(profile => profile.categoryId === canonical) ?? genericProfile;
}

const legacyCategoryLabel: Record<string, string> = { stands: "laptop stand", chairs: "office chair", monitors: "external monitor" };
export function requirementFromLegacySpec(spec: string): Requirement {
  return { key: spec.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), label: spec, operator: "contains", value: spec, isHard: true, sourceText: spec };
}
export function legacyItemToBuyingBrief(item: LegacyBuyingItem, sourceText = item.name): BuyingBrief {
  return { id: `compat-${item.id}`, productCategory: legacyCategoryLabel[item.id] ?? item.name.toLowerCase(), productDescription: item.name, quantity: item.quantity, hardRequirements: item.requiredSpecs.map(requirementFromLegacySpec), softPreferences: [], maxUnitPriceInr: item.authorizationLimit, deliveryDeadlineDays: item.deliveryDays, returnPolicyRequirement: item.minReturnDays ? `${item.minReturnDays} days` : undefined, authorizationLimitInr: item.authorizationLimit, sourceText, confidence: 1 };
}
export function legacyOfferToVendorOffer(offer: LegacyVendorOffer): VendorOffer {
  const attributes = Object.fromEntries(offer.specs.map(spec => [spec.toLowerCase().replace(/[^a-z0-9]+/g, "_"), true]));
  return { id: offer.id, vendorId: offer.vendor.toLowerCase().replace(/\s+/g, "-"), vendorName: offer.vendor, productCategory: legacyCategoryLabel[offer.category] ?? offer.category, productName: offer.product, description: offer.specs.join(", "), attributes: { ...attributes, specifications: offer.specs.join(", ") }, unitPriceInr: offer.unitPrice, availableQuantity: offer.stock, availability: !offer.available ? "unavailable" : offer.stock <= 5 ? "low_stock" : "in_stock", deliveryDays: offer.deliveryDays, sellerRating: offer.sellerRating, returnDays: offer.returnDays, returnPolicy: `${offer.returnDays} days`, sourceType: "simulated", sourceReference: offer.id };
}

export const laptopDemoBrief: BuyingBrief = {
  id: "demo-laptop-16gb", productCategory: "laptop", productDescription: "Business laptop for new team members", quantity: 10,
  hardRequirements: [
    { key: "ram_gb", label: "RAM", operator: "at_least", value: 16, unit: "GB", isHard: true, sourceText: "16 GB RAM" },
    { key: "storage_gb", label: "SSD storage", operator: "at_least", value: 512, unit: "GB", isHard: true, sourceText: "512 GB SSD" },
    { key: "cpu", label: "Processor", operator: "contains", value: "i5", isHard: true, sourceText: "Intel Core i5 or equivalent" },
  ],
  softPreferences: [{ key: "display_inches", label: "Display", operator: "preferred", value: 14, unit: "inch", isHard: false }], maxUnitPriceInr: 45000, deliveryDeadlineDays: 5, authorizationLimitInr: 45000, sourceText: "Purchase 10 laptops with 16 GB RAM and 512 GB SSD under ₹45,000 each within 5 days.", confidence: 1,
};
export const mobileDemoBrief: BuyingBrief = {
  id: "demo-mobile-5g", productCategory: "mobile", productDescription: "5G mobile device for a field-sales team", quantity: 12,
  hardRequirements: [
    { key: "storage_gb", label: "Storage", operator: "at_least", value: 128, unit: "GB", isHard: true, sourceText: "128 GB storage" },
    { key: "network_5g", label: "5G", operator: "equals", value: true, isHard: true, sourceText: "5G connectivity" },
    { key: "battery_mah", label: "Battery", operator: "at_least", value: 5000, unit: "mAh", isHard: true, sourceText: "5000 mAh battery" },
  ],
  softPreferences: [], maxUnitPriceInr: 22000, deliveryDeadlineDays: 5, authorizationLimitInr: 20000, sourceText: "Purchase 12 5G mobile devices with 128 GB storage and 5000 mAh battery under ₹22,000 each within 5 days.", confidence: 1,
};
export const furnitureDemoBrief: BuyingBrief = {
  id: "demo-furniture-ergonomic", productCategory: "furniture", productDescription: "Ergonomic task chairs for an office expansion", quantity: 6,
  hardRequirements: [
    { key: "ergonomic", label: "Ergonomic design", operator: "equals", value: true, isHard: true, sourceText: "ergonomic chair" },
    { key: "adjustable_height", label: "Adjustable height", operator: "equals", value: true, isHard: true, sourceText: "adjustable height" },
    { key: "lumbar_support", label: "Lumbar support", operator: "equals", value: true, isHard: true, sourceText: "lumbar support" },
  ],
  softPreferences: [], maxUnitPriceInr: 15000, deliveryDeadlineDays: 6, authorizationLimitInr: 15000, sourceText: "Purchase 6 ergonomic adjustable-height office chairs with lumbar support under ₹15,000 each within 6 days.", confidence: 1,
};
export const tyreDemoBrief: BuyingBrief = {
  id: "demo-tyre-city-205-55-r16", productCategory: "tyre", productDescription: "Tubeless tyre for a City 205/55 R16 fitment", quantity: 1,
  hardRequirements: [
    { key: "tyre_size", label: "Tyre size", operator: "contains", value: "205/55 R16", isHard: true, sourceText: "205/55 R16" },
    { key: "vehicle_model", label: "Vehicle model", operator: "contains", value: "city", isHard: true, sourceText: "Honda City" },
    { key: "tubeless", label: "Tubeless", operator: "equals", value: true, isHard: true, sourceText: "tubeless" },
  ],
  softPreferences: [], maxUnitPriceInr: 8000, deliveryDeadlineDays: 4, authorizationLimitInr: 8000, sourceText: "Purchase 1 tubeless 205/55 R16 tyre for Honda City under ₹8,000 each within 4 days.", confidence: 1,
};
export const curatedDemoBriefs = { laptop: laptopDemoBrief, mobile: mobileDemoBrief, furniture: furnitureDemoBrief, tyre: tyreDemoBrief } as const;
