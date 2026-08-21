/**
 * Calm operational paper: deterministic brief understanding with explicit uncertainty.
 * Parsing suggests normalized fields; validation, policy, and orders remain code-owned.
 */
import {
  canonicalCategory,
  getCategoryProfile,
  type BuyingBrief,
  type Requirement,
} from "./generic-procurement";

export type ValidationConflict = { field: string; message: string };

export type ValidationResult = {
  status: "valid" | "needs_clarification" | "invalid";
  normalizedBrief?: BuyingBrief;
  missingFields: string[];
  conflicts: ValidationConflict[];
  warnings: string[];
  clarifyingQuestions: string[];
};

const unrelatedPattern = /^(?:what|why|who|when|where|how|tell me|explain|hello|hi)\b/i;
const procurementVerbPattern = /\b(?:buy|purchase|order|find|source|get|need|want)\b/i;
const promptInjectionPattern = /\b(?:ignore|disregard|override)\s+(?:all\s+)?(?:previous|prior|system|developer|instructions?|rules?)\b|\b(?:reveal|show)\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message|instructions?)\b|\bbypass\s+(?:policy|approval|authorization|guardrail)/i;

const fixedRequirementPatterns: Array<{ pattern: RegExp; requirement: (match: RegExpMatchArray) => Requirement }> = [
  { pattern: /\b(\d+)\s*GB\s*RAM\b/i, requirement: (match) => ({ key: "ram_gb", label: "RAM", operator: "at_least", value: Number(match[1]), unit: "GB", isHard: true, sourceText: match[0] }) },
  { pattern: /\b(\d+)\s*GB\s*(?:SSD|storage)\b/i, requirement: (match) => ({ key: "storage_gb", label: "SSD storage", operator: "at_least", value: Number(match[1]), unit: "GB", isHard: true, sourceText: match[0] }) },
  { pattern: /\b(i[357]|ryzen\s*[357])\b/i, requirement: (match) => ({ key: "cpu", label: "Processor", operator: "contains", value: match[1].toLowerCase(), isHard: true, sourceText: match[0] }) },
  { pattern: /\b(\d{2})\s*(?:inch|\")\s*(?:qhd|monitor|display)?\b/i, requirement: (match) => ({ key: "display_inches", label: "Display size", operator: "equals", value: Number(match[1]), unit: "inch", isHard: true, sourceText: match[0] }) },
  { pattern: /\bduplex(?:\s+printing)?\b/i, requirement: (match) => ({ key: "duplex", label: "Duplex printing", operator: "equals", value: true, isHard: true, sourceText: match[0] }) },
  { pattern: /\bergonomic\b/i, requirement: (match) => ({ key: "ergonomic", label: "Ergonomic design", operator: "contains", value: "ergonomic", isHard: true, sourceText: match[0] }) },
  { pattern: /\badjustable height\b/i, requirement: (match) => ({ key: "adjustable_height", label: "Adjustable height", operator: "contains", value: "adjustable height", isHard: true, sourceText: match[0] }) },
  { pattern: /\bqhd\b/i, requirement: (match) => ({ key: "resolution", label: "QHD resolution", operator: "contains", value: "qhd", isHard: true, sourceText: match[0] }) },
  { pattern: /\bhdmi\b/i, requirement: (match) => ({ key: "hdmi", label: "HDMI", operator: "equals", value: true, isHard: true, sourceText: match[0] }) },
  { pattern: /\b(\d{3}\s*\/\s*\d{2}\s*(?:ZR?|R)\s*\d{2})\b/i, requirement: (match) => ({ key: "tyre_size", label: "Tyre size", operator: "contains", value: match[1].replace(/\s+/g, " ").replace(/\s*\/\s*/g, "/").toUpperCase(), isHard: true, sourceText: match[0] }) },
  { pattern: /\b(?:for|compatible\s+with)\s+([A-Za-z0-9][A-Za-z0-9 -]{1,35}?)(?=\s+(?:with|under|within|each|per|tubeless)\b|[.,]|$)/i, requirement: (match) => ({ key: "vehicle_model", label: "Vehicle model", operator: "contains", value: match[1].trim().toLowerCase(), isHard: true, sourceText: match[0] }) },
  { pattern: /\btubeless\b/i, requirement: (match) => ({ key: "tubeless", label: "Tubeless", operator: "equals", value: true, isHard: true, sourceText: match[0] }) },
];

function numberFrom(value: string | undefined) {
  return value ? Number(value.replace(/,/g, "")) : undefined;
}

function extractQuantity(text: string) {
  const match = text.match(/\b(?:buy|purchase|order|find|source|get|need|want)\s+(\d+)\b/i) ?? text.match(/\b(\d+)\s+(?:new\s+)?(?:laptops?|chairs?|monitors?|printers?|cameras?|stands?|tyres?|tires?)\b/i);
  return match ? Number(match[1]) : undefined;
}

function extractCategory(text: string) {
  const known = ["laptop", "notebook", "chair", "monitor", "printer", "camera", "stand", "tyre", "tire"];
  const match = known.find((term) => new RegExp(`\\b${term}s?\\b`, "i").test(text));
  if (match) return canonicalCategory(match);
  const generic = text.match(/\b(?:buy|purchase|order|find|source|get|need|want)\s+(?:\d+\s+)?(?:an?|some)?\s*([a-z][a-z -]{2,45}?)(?=\s+(?:with|under|within|for|that|each|per|by|compatible)\b|[.,]|$)/i);
  return generic?.[1]?.trim() ? canonicalCategory(generic[1].trim()) : undefined;
}

function extractRequirements(text: string) {
  return fixedRequirementPatterns.flatMap(({ pattern, requirement }) => {
    const match = text.match(pattern);
    return match ? [requirement(match)] : [];
  });
}

export function parseBuyingBrief(sourceText: string): ValidationResult {
  const text = sourceText.trim();
  if (promptInjectionPattern.test(text)) {
    return {
      status: "invalid",
      missingFields: ["safe procurement intent"],
      conflicts: [{ field: "unsafe_instruction", message: "The brief contains instruction-override text and was not processed." }],
      warnings: ["Procurement controls cannot be disabled from within a buying brief."],
      clarifyingQuestions: ["Please submit a plain buying request without instructions to override system, policy, approval, or authorization controls."],
    };
  }
  if (!text || unrelatedPattern.test(text) || !procurementVerbPattern.test(text)) {
    return {
      status: "invalid",
      missingFields: ["procurement intent"],
      conflicts: [],
      warnings: [],
      clarifyingQuestions: ["Please describe an online purchase with a product, quantity, and constraints."],
    };
  }

  const quantity = extractQuantity(text);
  const category = extractCategory(text);
  const maxTotalPriceInr = numberFrom(text.match(/\b(?:under|below|up to)\s*₹?\s*([\d,]+)\s*(?:in\s*)?total\b/i)?.[1]);
  const maxUnitPriceInr = numberFrom(text.match(/\b(?:under|below|up to)\s*₹?\s*([\d,]+)\s*(?:each|per\s+(?:unit|item))\b/i)?.[1]);
  const deliveryDeadlineDays = numberFrom(text.match(/\bwithin\s+(\d+)\s+days?\b/i)?.[1]);
  const returnDays = numberFrom(text.match(/\b(\d+)\s*(?:day|days)\s+return\b/i)?.[1]);
  const hardRequirements = extractRequirements(text);
  if (returnDays) hardRequirements.push({ key: "return_days", label: "Return window", operator: "at_least", value: returnDays, unit: "days", isHard: true, sourceText: `${returnDays} day return` });

  const missingFields: string[] = [];
  const conflicts: ValidationConflict[] = [];
  const warnings: string[] = [];
  const clarifyingQuestions: string[] = [];
  if (!category) {
    missingFields.push("product category");
    clarifyingQuestions.push("What product category would you like to purchase online?");
  }
  if (!quantity) {
    missingFields.push("quantity");
    clarifyingQuestions.push("How many units do you need?");
  }
  if (!maxUnitPriceInr && !maxTotalPriceInr) {
    missingFields.push("budget or authorization limit");
    clarifyingQuestions.push("What is the maximum unit price or total budget the agent may use?");
  }
  if (quantity && maxUnitPriceInr && maxTotalPriceInr && quantity * maxUnitPriceInr > maxTotalPriceInr) {
    conflicts.push({ field: "budget", message: `The unit ceiling of ₹${maxUnitPriceInr.toLocaleString("en-IN")} for ${quantity} units exceeds the stated total cap of ₹${maxTotalPriceInr.toLocaleString("en-IN")}.` });
    clarifyingQuestions.push("Which budget should control: the stated unit ceiling or the stated total cap?");
  }
  if (quantity !== undefined && quantity <= 0) conflicts.push({ field: "quantity", message: "Quantity must be a positive number." });
  if (!deliveryDeadlineDays) warnings.push("No delivery deadline was provided; delivery time will influence ranking but not block an otherwise compliant offer.");
  if (!hardRequirements.length) warnings.push("No product-specific requirements were identified; the result will be evaluated using price, availability, delivery, seller reliability, and returns.");

  if (conflicts.length) return { status: "invalid", missingFields, conflicts, warnings, clarifyingQuestions };
  if (missingFields.length) return { status: "needs_clarification", missingFields, conflicts, warnings, clarifyingQuestions };
  const profile = getCategoryProfile(category!);
  hardRequirements.forEach((requirement) => profile.validateRequirement?.(requirement).forEach((finding) => warnings.push(finding.message)));
  const confidence = Math.min(1, 0.45 + (category ? 0.15 : 0) + (quantity ? 0.15 : 0) + (maxUnitPriceInr || maxTotalPriceInr ? 0.15 : 0) + (hardRequirements.length ? 0.1 : 0));
  const normalizedBrief: BuyingBrief = {
    id: `brief-${canonicalCategory(category!)}-${quantity}`,
    productCategory: category!,
    productDescription: category!,
    quantity: quantity!,
    hardRequirements,
    softPreferences: [],
    maxUnitPriceInr,
    maxTotalPriceInr,
    deliveryDeadlineDays,
    returnPolicyRequirement: returnDays ? `${returnDays} days` : undefined,
    authorizationLimitInr: maxUnitPriceInr ?? (maxTotalPriceInr && quantity ? Math.floor(maxTotalPriceInr / quantity) : undefined),
    sourceText: text,
    confidence,
  };
  return { status: "valid", normalizedBrief, missingFields, conflicts, warnings, clarifyingQuestions };
}
