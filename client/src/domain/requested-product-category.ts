export function inferRequestedProductCategory(text: string) {
  const source = text.toLowerCase();
  if (/\b(?:android\s+)?smartphones?|mobile\s+phones?|iphone|android\s+phone\b/.test(source)) return "mobile";
  if (/\b(?:laptops?|notebooks?|ultrabooks?|macbooks?)\b/.test(source)) return "laptop";
  if (/\b(?:office\s+)?chairs?\b/.test(source)) return "chair";
  if (/\b(?:tyres?|tires?)\b/.test(source)) return "tyre";
  if (/\b(?:graphics\s+cards?|video\s+cards?|gpus?)\b/.test(source)) return "gpu";
  if (/\bportable\s+printers?\b/.test(source)) return "portable printer";
  if (/\b(?:printers?)\b/.test(source)) return "printer";
  if (/\b(?:mice|mouse)\b/.test(source)) return "mouse";
  return null;
}
