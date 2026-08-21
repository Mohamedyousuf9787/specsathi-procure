import { describe, expect, it } from "vitest";
import { resolveApproval, runDemo, transitionStatus } from "./procurement";

describe("SpecSathi deterministic procurement demo", () => {
  it("auto-purchases the compliant items and pauses the monitor exception", () => {
    const session = runDemo();
    expect(session.itemStates.map((state) => state.status)).toEqual(["PURCHASED", "PURCHASED", "PENDING_APPROVAL"]);
    expect(session.itemStates[2].recommendation.selected?.offer.unitPrice).toBe(23200);
  });

  it("creates a monitor order only after explicit approval and a final re-check", () => {
    const approved = resolveApproval(runDemo(), "monitors", true);
    expect(approved.itemStates[2].status).toBe("PURCHASED");
    expect(approved.itemStates[2].order?.id).toMatch(/^DEMO-ORD-/);
    expect(approved.audit.some((event) => event.type === "APPROVAL_GRANTED")).toBe(true);
  });

  it("never creates a monitor order after rejection", () => {
    const rejected = resolveApproval(runDemo(), "monitors", false);
    expect(rejected.itemStates[2].status).toBe("REJECTED");
    expect(rejected.itemStates[2].order).toBeUndefined();
  });

  it("re-ranks after a selected vendor becomes unavailable and blocks a no-match", () => {
    expect(runDemo("vendor-unavailable").itemStates[0].status).toBe("PURCHASED");
    expect(runDemo("no-match").itemStates[2].status).toBe("BLOCKED");
  });

  it("returns to approval when vendor terms change during final confirmation", () => {
    const changedTerms = resolveApproval(runDemo("changed-terms"), "monitors", true);
    expect(changedTerms.itemStates[2].status).toBe("PENDING_APPROVAL");
    expect(changedTerms.itemStates[2].order).toBeUndefined();
    expect(changedTerms.audit.some((event) => event.type === "TERMS_CHANGED")).toBe(true);
  });

  it("blocks an impossible approval-to-purchase transition", () => {
    expect(transitionStatus("PENDING_APPROVAL", "PURCHASED")).toBe("BLOCKED");
    expect(transitionStatus("PENDING_APPROVAL", "APPROVED")).toBe("APPROVED");
  });
});
