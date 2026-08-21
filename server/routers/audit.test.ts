import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

describe("authenticated procurement audit persistence", () => {
  it("rejects anonymous attempts to persist audit events", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.audit.persistSession({ sessionKey: "session-1", events: [{ eventType: "OFFERS_COMPARED", actor: "Procurement agent", itemId: "laptop", summary: "Compared normalized offers." }] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
