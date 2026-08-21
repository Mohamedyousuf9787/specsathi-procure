import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, procurementAuditEvents, providerAuditEvents, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type ProviderAuditInput = {
  userId?: number;
  eventType: "nlp.extraction" | "live_search.evidence" | "product.specifications";
  provider: "built-in-llm" | "gemini" | "tavily" | "serpapi" | "firecrawl" | "firecrawl_fallback" | "local";
  outcome: "success" | "partial" | "fallback";
  summary: string;
  metadata: { inputLength?: number; category?: string; issueCount?: number; resultCount?: number; requestedCount?: number; sourcedCount?: number; categoryLength?: number };
};

export function serializeProviderAuditMetadata(metadata: ProviderAuditInput["metadata"]): string {
  return JSON.stringify({
    inputLength: Math.min(Math.max(metadata.inputLength ?? 0, 0), 4000),
    category: metadata.category?.slice(0, 80),
    issueCount: Math.min(Math.max(metadata.issueCount ?? 0, 0), 20),
    resultCount: Math.min(Math.max(metadata.resultCount ?? 0, 0), 10),
    ...(metadata.requestedCount !== undefined ? { requestedCount: Math.min(Math.max(metadata.requestedCount, 0), 12) } : {}),
    ...(metadata.sourcedCount !== undefined ? { sourcedCount: Math.min(Math.max(metadata.sourcedCount, 0), 12) } : {}),
    ...(metadata.categoryLength !== undefined ? { categoryLength: Math.min(Math.max(metadata.categoryLength, 0), 100) } : {}),
  });
}

export async function recordProviderAudit(input: ProviderAuditInput): Promise<boolean> {
  const db = await getDb();
  if (!db || !input.userId) return false;
  await db.insert(providerAuditEvents).values({
    userId: input.userId,
    eventType: input.eventType,
    provider: input.provider,
    outcome: input.outcome,
    summary: input.summary.slice(0, 255),
    metadata: serializeProviderAuditMetadata(input.metadata),
  });
  return true;
}

export type ProcurementAuditInput = { sessionKey: string; eventType: string; actor: string; itemId: string; summary: string };

export function sanitizeProcurementAuditEvent(event: ProcurementAuditInput): ProcurementAuditInput {
  return {
    sessionKey: event.sessionKey.slice(0, 120),
    eventType: event.eventType.slice(0, 64),
    actor: event.actor.slice(0, 96),
    itemId: event.itemId.slice(0, 120),
    summary: event.summary.slice(0, 255),
  };
}

export async function recordProcurementAuditEvents(userId: number, events: ProcurementAuditInput[]): Promise<number> {
  const db = await getDb();
  if (!db || !events.length) return 0;
  await db.insert(procurementAuditEvents).values(events.slice(0, 50).map(event => ({ userId, ...sanitizeProcurementAuditEvent(event) })));
  return Math.min(events.length, 50);
}
