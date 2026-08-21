import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const providerAuditEvents = mysqlTable("provider_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  outcome: varchar("outcome", { length: 32 }).notNull(),
  summary: varchar("summary", { length: 255 }).notNull(),
  metadata: text("metadata").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("provider_audit_events_user_created_idx").on(table.userId, table.createdAt)]);

export type ProviderAuditEvent = typeof providerAuditEvents.$inferSelect;
export type InsertProviderAuditEvent = typeof providerAuditEvents.$inferInsert;

export const procurementAuditEvents = mysqlTable("procurement_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionKey: varchar("sessionKey", { length: 120 }).notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  actor: varchar("actor", { length: 96 }).notNull(),
  itemId: varchar("itemId", { length: 120 }).notNull(),
  summary: varchar("summary", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("procurement_audit_events_user_session_idx").on(table.userId, table.sessionKey, table.createdAt)]);

export type ProcurementAuditEvent = typeof procurementAuditEvents.$inferSelect;
