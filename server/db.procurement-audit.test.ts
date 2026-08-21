import { describe, expect, it } from "vitest";
import { sanitizeProcurementAuditEvent } from "./db";

describe("procurement audit persistence privacy", () => {
  it("accepts only bounded audit fields and strips unknown raw content", () => {
    const event = sanitizeProcurementAuditEvent({ sessionKey: "session".repeat(30), eventType: "PURCHASED", actor: "Procurement agent", itemId: "laptop".repeat(30), summary: "Decision summary".repeat(40), rawBrief: "must not persist", providerKey: "must not persist" } as never);
    expect(event).toEqual({ sessionKey: "session".repeat(30).slice(0, 120), eventType: "PURCHASED", actor: "Procurement agent", itemId: "laptop".repeat(30).slice(0, 120), summary: "Decision summary".repeat(40).slice(0, 255) });
    expect(event).not.toHaveProperty("rawBrief");
    expect(event).not.toHaveProperty("providerKey");
  });
});
