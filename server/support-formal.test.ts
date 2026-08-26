import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { aggregateKpiMetrics } from "./supportDb";
import { supportConversations, supportMessages, supportTickets } from "../drizzle/schema";
import { enforceReplyGuardrails } from "./support";
import type { TrpcContext } from "./_core/context";

type UserRole = "user" | "admin";

function makeContext(role: UserRole): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-test`,
      name: role,
      email: `${role}@example.com`,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const baseReply = {
  answer: "已確認相關限制，請提供畫面上的完整訊息。",
  confidence: 0.92,
  confidenceLabel: "高" as const,
  citations: ["A01"],
  nextStep: "請提供限制訊息",
  needsHuman: false,
  askField: null,
  summary: "客戶詢問粉絲團限制。",
};

describe("formal support guardrails", () => {
  it("blocks an unrelated payment answer for a page restriction question", () => {
    expect(() => enforceReplyGuardrails({ ...baseReply, answer: "請重新新增信用卡付款方式。" }, "我的粉絲團被封鎖了", { confidence: 0.95, knowledge: { intent: "Page restriction" }, missingFields: [] })).toThrow("AI_RESULT_INTENT_MISMATCH");
  });

  it("forces handoff when no reliable knowledge is available", () => {
    const result = enforceReplyGuardrails(baseReply, "我遇到一個知識庫沒有記載的問題", { confidence: 0.4, knowledge: {}, missingFields: ["F01"] });
    expect(result.needsHuman).toBe(true);
    expect(result.confidenceLabel).toBe("低");
    expect(result.citations).toEqual([]);
    expect(result.askField).toBe("F01");
  });

  it("aggregates formal KPI values from conversation, message, and ticket rows", () => {
    const base = new Date("2026-08-26T00:00:00Z");
    const conversations = [{ id: 10, publicId: "conv_a", channel: "line", customerName: null, intent: "Page restriction", summary: "", status: "pending" as const, firstResponseAt: new Date(base.getTime() + 30000), resolvedAt: null, createdAt: base, updatedAt: base } satisfies typeof supportConversations.$inferSelect, { id: 11, publicId: "conv_b", channel: "web", customerName: null, intent: "Payment", summary: "", status: "resolved" as const, firstResponseAt: new Date(base.getTime() + 90000), resolvedAt: new Date(base.getTime() + 120000), createdAt: base, updatedAt: base } satisfies typeof supportConversations.$inferSelect];
    const messages = [{ id: 1, conversationId: 10, role: "customer" as const, content: "粉絲團被封鎖", responderUserId: null, createdAt: base }, { id: 2, conversationId: 10, role: "agent" as const, content: "請提供限制訊息", responderUserId: 1, createdAt: new Date(base.getTime() + 30000) }, { id: 3, conversationId: 11, role: "customer" as const, content: "付款失敗", responderUserId: null, createdAt: base }, { id: 4, conversationId: 11, role: "assistant" as const, content: "請確認付款方式", responderUserId: null, createdAt: new Date(base.getTime() + 90000) }] satisfies Array<typeof supportMessages.$inferSelect>;
    const tickets = [{ id: 20, ticketNo: "CS-TEST", conversationId: 10, reason: "需要人工查核", summary: "粉絲團限制", missingFields: null, status: "in_progress" as const, createdBy: 1, resolvedAt: null, createdAt: base, updatedAt: base }] satisfies Array<typeof supportTickets.$inferSelect>;
    const result = aggregateKpiMetrics("7d", conversations, messages, tickets);
    expect(result.totalCases).toBe(2);
    expect(result.averageFirstResponseSeconds).toBe(60);
    expect(result.handoffRate).toBe(0.5);
    expect(result.resolutionRate).toBe(0.5);
    expect(result.cases.find((item) => item.id === "conv_a")).toMatchObject({ handedOff: true, resolved: false });
  });

  it("prevents non-admin users from viewing or replying to tickets", async () => {
    const caller = appRouter.createCaller(makeContext("user"));
    await expect(caller.support.ticketList({ limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.support.agentReply({ ticketNo: "CS-NOT-REAL", content: "客服回覆" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
