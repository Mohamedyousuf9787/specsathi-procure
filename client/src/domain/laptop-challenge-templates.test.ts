import { describe, expect, it } from "vitest";
import { laptopDemoBrief } from "./generic-procurement";
import { buildLaptopChallengeTemplateCards, resolveLaptopChallengeFallback } from "./laptop-challenge-templates";

describe("laptop challenge templates", () => {
  it("returns pre-built Vendor A/B cards with a deterministic single best fit", () => {
    const cards = buildLaptopChallengeTemplateCards(laptopDemoBrief);
    expect(cards).toHaveLength(4);
    expect(cards).toEqual(expect.arrayContaining([expect.objectContaining({ merchant: "Vendor A · pre-built laptop template", recordKind: "laptop_challenge_template", specificationSource: "template" }), expect.objectContaining({ merchant: "Vendor B · pre-built laptop template", recordKind: "laptop_challenge_template", specificationSource: "template" })]));
    expect(cards.filter(card => card.bestMatch)).toHaveLength(1);
    expect(cards.find(card => card.bestMatch)).toMatchObject({ title: "Atlas Business 14", policy: "eligible" });
    expect(cards.find(card => card.title === "Atlas Lite 14")).toMatchObject({ policy: "blocked" });
  });

  it("does not expose laptop challenge cards for an unrelated category", () => {
    expect(buildLaptopChallengeTemplateCards({ ...laptopDemoBrief, productCategory: "office chair" })).toEqual([]);
  });

  it("turns an unavailable laptop marketplace result into visible deterministic Vendor A/B cards", () => {
    const fallback = resolveLaptopChallengeFallback(laptopDemoBrief, "Live product search could not be reached.");
    expect(fallback).toMatchObject({ status: "live" });
    expect(fallback?.message).toContain("deterministic Vendor A/B laptop challenge templates");
    expect(fallback?.listings).toHaveLength(4);
    expect(resolveLaptopChallengeFallback({ ...laptopDemoBrief, productCategory: "office chair" }, "Unavailable")).toBeNull();
  });
});
