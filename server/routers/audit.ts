import { z } from "zod";
import { recordProcurementAuditEvents } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const auditEventInput = z.object({
  eventType: z.string().trim().min(1).max(64),
  actor: z.string().trim().min(1).max(96),
  itemId: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(255),
});

export const auditRouter = router({
  persistSession: protectedProcedure.input(z.object({ sessionKey: z.string().trim().min(1).max(120), events: z.array(auditEventInput).min(1).max(50) })).mutation(async ({ ctx, input }) => {
    const persisted = await recordProcurementAuditEvents(ctx.user.id, input.events.map(event => ({ sessionKey: input.sessionKey, ...event })));
    return { persisted };
  }),
});
