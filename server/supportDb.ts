import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  supportConversations,
  supportMessages,
  supportTicketEvents,
  supportTickets,
} from "../drizzle/schema";
import { getDb } from "./db";

const requireDb = async () => {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db;
};

export async function createConversation(input: { channel?: string; customerName?: string }) {
  const db = await requireDb();
  const publicId = `conv_${nanoid(12)}`;
  await db.insert(supportConversations).values({
    publicId,
    channel: input.channel ?? "web",
    customerName: input.customerName ?? null,
  });
  const rows = await db.select().from(supportConversations).where(eq(supportConversations.publicId, publicId)).limit(1);
  return rows[0];
}

export async function getConversation(publicId: string) {
  const db = await requireDb();
  const rows = await db.select().from(supportConversations).where(eq(supportConversations.publicId, publicId)).limit(1);
  return rows[0];
}

export async function getConversationDetail(publicId: string) {
  const db = await requireDb();
  const conversation = (await db.select().from(supportConversations).where(eq(supportConversations.publicId, publicId)).limit(1))[0];
  if (!conversation) return undefined;
  const messages = await db.select().from(supportMessages).where(eq(supportMessages.conversationId, conversation.id)).orderBy(supportMessages.createdAt);
  const tickets = await db.select().from(supportTickets).where(eq(supportTickets.conversationId, conversation.id)).orderBy(desc(supportTickets.createdAt));
  const ticket = tickets[0];
  const events = ticket ? await db.select().from(supportTicketEvents).where(eq(supportTicketEvents.ticketId, ticket.id)).orderBy(desc(supportTicketEvents.createdAt)) : [];
  return { conversation, ticket, messages, events };
}

export async function saveConversationState(publicId: string, input: { intent?: string; summary?: string; status?: "open" | "pending" | "resolved" | "closed" }) {
  const db = await requireDb();
  await db.update(supportConversations).set({
    intent: input.intent ?? null,
    summary: input.summary ?? null,
    status: input.status,
    updatedAt: new Date(),
    ...(input.status === "resolved" || input.status === "closed" ? { resolvedAt: new Date() } : {}),
  }).where(eq(supportConversations.publicId, publicId));
}

export async function appendMessage(input: {
  conversationId: number;
  role: "customer" | "assistant" | "agent" | "system";
  content: string;
  responderUserId?: number;
}) {
  const db = await requireDb();
  await db.insert(supportMessages).values({
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    responderUserId: input.responderUserId ?? null,
  });
  if (input.role === "assistant" || input.role === "agent") {
    await db.update(supportConversations).set({ firstResponseAt: new Date(), updatedAt: new Date() }).where(
      and(eq(supportConversations.id, input.conversationId), isNull(supportConversations.firstResponseAt)),
    );
  } else {
    await db.update(supportConversations).set({ updatedAt: new Date() }).where(eq(supportConversations.id, input.conversationId));
  }
}

export async function recordMessage(input: { conversationPublicId: string; role: "customer" | "assistant" | "agent" | "system"; content: string; responderUserId?: number }) {
  const conversation = await getConversation(input.conversationPublicId);
  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
  await appendMessage({ conversationId: conversation.id, role: input.role, content: input.content, responderUserId: input.responderUserId });
  return { conversationPublicId: input.conversationPublicId };
}

export async function addAgentReply(input: { ticketNo: string; content: string; actorUserId: number }) {
  const db = await requireDb();
  const ticket = (await db.select().from(supportTickets).where(eq(supportTickets.ticketNo, input.ticketNo)).limit(1))[0];
  if (!ticket) throw new Error("TICKET_NOT_FOUND");
  const conversation = (await db.select().from(supportConversations).where(eq(supportConversations.id, ticket.conversationId)).limit(1))[0];
  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
  await appendMessage({ conversationId: conversation.id, role: "agent", content: input.content, responderUserId: input.actorUserId });
  await db.update(supportTickets).set({ status: "in_progress", updatedAt: new Date() }).where(eq(supportTickets.id, ticket.id));
  await db.insert(supportTicketEvents).values({ ticketId: ticket.id, eventType: "agent_replied", note: input.content.slice(0, 500), actorUserId: input.actorUserId });
  return getTicket(input.ticketNo);
}

export async function createTicket(input: {
  conversationPublicId: string;
  reason: string;
  summary: string;
  missingFields?: string[];
  createdBy?: number;
}) {
  const db = await requireDb();
  const conversation = await getConversation(input.conversationPublicId);
  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
  const ticketNo = `CS-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
  await db.insert(supportTickets).values({
    ticketNo,
    conversationId: conversation.id,
    reason: input.reason,
    summary: input.summary,
    missingFields: input.missingFields?.length ? JSON.stringify(input.missingFields) : null,
    createdBy: input.createdBy ?? null,
  });
  const ticket = (await db.select().from(supportTickets).where(eq(supportTickets.ticketNo, ticketNo)).limit(1))[0];
  if (!ticket) throw new Error("TICKET_CREATE_FAILED");
  await db.insert(supportTicketEvents).values({ ticketId: ticket.id, eventType: "created", note: input.reason, actorUserId: input.createdBy ?? null });
  await db.update(supportConversations).set({ status: "pending", updatedAt: new Date() }).where(eq(supportConversations.id, conversation.id));
  return ticket;
}

export async function listTickets(limit = 50) {
  const db = await requireDb();
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(Math.min(limit, 100));
}

export async function getTicket(ticketNo: string) {
  const db = await requireDb();
  const ticket = (await db.select().from(supportTickets).where(eq(supportTickets.ticketNo, ticketNo)).limit(1))[0];
  if (!ticket) return undefined;
  const conversation = (await db.select().from(supportConversations).where(eq(supportConversations.id, ticket.conversationId)).limit(1))[0];
  const messages = await db.select().from(supportMessages).where(eq(supportMessages.conversationId, ticket.conversationId)).orderBy(supportMessages.createdAt);
  const events = await db.select().from(supportTicketEvents).where(eq(supportTicketEvents.ticketId, ticket.id)).orderBy(desc(supportTicketEvents.createdAt));
  return { ticket, conversation, messages, events };
}

export async function updateTicketStatus(input: { ticketNo: string; status: "open" | "in_progress" | "resolved" | "closed"; actorUserId?: number; note?: string }) {
  const db = await requireDb();
  const ticket = (await db.select().from(supportTickets).where(eq(supportTickets.ticketNo, input.ticketNo)).limit(1))[0];
  if (!ticket) throw new Error("TICKET_NOT_FOUND");
  await db.update(supportTickets).set({ status: input.status, updatedAt: new Date(), ...(input.status === "resolved" || input.status === "closed" ? { resolvedAt: new Date() } : {}) }).where(eq(supportTickets.id, ticket.id));
  await db.insert(supportTicketEvents).values({ ticketId: ticket.id, eventType: `status_${input.status}`, note: input.note ?? null, actorUserId: input.actorUserId ?? null });
  return getTicket(input.ticketNo);
}

function getStartDate(period: "today" | "7d") {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
}

export function aggregateKpiMetrics(period: "today" | "7d" | "current", conversations: Array<typeof supportConversations.$inferSelect>, messages: Array<typeof supportMessages.$inferSelect>, tickets: Array<typeof supportTickets.$inferSelect>) {
  const ids = new Set(conversations.map((conversation) => conversation.id));
  const relatedMessages = messages.filter((message) => ids.has(message.conversationId));
  const relatedTickets = tickets.filter((ticket) => ids.has(ticket.conversationId));
  const ticketByConversation = new Map(relatedTickets.map((ticket) => [ticket.conversationId, ticket]));
  const cases = conversations.map((conversation) => {
    const related = relatedMessages.filter((message) => message.conversationId === conversation.id);
    const customer = related.find((message) => message.role === "customer");
    const response = related.find((message) => (message.role === "assistant" || message.role === "agent") && (!customer || message.createdAt >= customer.createdAt));
    const ticket = ticketByConversation.get(conversation.id);
      return {
      id: conversation.publicId,
      conversationPublicId: conversation.publicId,
      ticketNo: ticket?.ticketNo ?? null,
      channel: conversation.channel,
      intent: conversation.intent,
      summary: ticket?.summary ?? conversation.summary,
      reason: ticket?.reason ?? null,
      missingFields: ticket?.missingFields ? JSON.parse(ticket.missingFields) : [],
      firstResponseSeconds: customer && response ? Math.max(0, Math.round((response.createdAt.getTime() - customer.createdAt.getTime()) / 1000)) : null,
      handedOff: Boolean(ticket),
      resolved: conversation.status === "resolved" || conversation.status === "closed" || ticket?.status === "resolved" || ticket?.status === "closed",
      status: ticket?.status ?? conversation.status,
    };
  });
  const responseCases = cases.filter((item) => item.firstResponseSeconds !== null);
  const handoffCases = cases.filter((item) => item.handedOff).length;
  const resolvedCases = cases.filter((item) => item.resolved).length;
  return {
    period,
    totalCases: cases.length,
    respondedCases: responseCases.length,
    averageFirstResponseSeconds: responseCases.length ? Math.round(responseCases.reduce((sum, item) => sum + (item.firstResponseSeconds ?? 0), 0) / responseCases.length) : null,
    handoffCases,
    handoffRate: cases.length ? handoffCases / cases.length : null,
    resolvedCases,
    resolutionRate: cases.length ? resolvedCases / cases.length : null,
    cases: cases.slice(0, 20),
  };
}

export async function getKpiMetrics(period: "today" | "7d" | "current", currentPublicId?: string) {
  const db = await requireDb();
  const conversations = period === "current" && currentPublicId
    ? await db.select().from(supportConversations).where(eq(supportConversations.publicId, currentPublicId)).limit(1)
    : await db.select().from(supportConversations).where(gte(supportConversations.createdAt, getStartDate(period === "current" ? "today" : period)));
  const ids = new Set(conversations.map((conversation) => conversation.id));
  const messages = (await db.select().from(supportMessages).orderBy(supportMessages.createdAt)).filter((message) => ids.has(message.conversationId));
  const tickets = (await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt))).filter((ticket) => ids.has(ticket.conversationId));
  return aggregateKpiMetrics(period, conversations, messages, tickets);
}
