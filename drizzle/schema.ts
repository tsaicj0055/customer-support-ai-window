import { mysqlEnum, mysqlTable, int, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

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
  active: tinyint("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const supportConversations = mysqlTable("support_conversations", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 64 }).notNull().unique(),
  channel: varchar("channel", { length: 32 }).default("web").notNull(),
  customerName: varchar("customerName", { length: 160 }),
  status: mysqlEnum("status", ["open", "pending", "resolved", "closed"]).default("open").notNull(),
  intent: varchar("intent", { length: 160 }),
  summary: text("summary"),
  firstResponseAt: timestamp("firstResponseAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supportMessages = mysqlTable("support_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["customer", "assistant", "agent", "system"]).notNull(),
  content: text("content").notNull(),
  channelMessageId: varchar("channelMessageId", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  responderUserId: int("responderUserId"),
});

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNo: varchar("ticketNo", { length: 32 }).notNull().unique(),
  conversationId: int("conversationId").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  missingFields: text("missingFields"),
  createdBy: int("createdBy"),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const supportTicketEvents = mysqlTable("support_ticket_events", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  note: text("note"),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportConversation = typeof supportConversations.$inferSelect;
export type InsertSupportConversation = typeof supportConversations.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketEvent = typeof supportTicketEvents.$inferSelect;
export type InsertSupportTicketEvent = typeof supportTicketEvents.$inferInsert;