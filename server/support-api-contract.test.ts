import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createConversation: vi.fn(async (input: { channel?: string }) => ({ publicId: "conv_contract", channel: input.channel ?? "web" })),
  createTicket: vi.fn(async (input: { conversationPublicId: string; reason: string }) => ({ ticketNo: "CS-CONTRACT", conversationPublicId: input.conversationPublicId, reason: input.reason })),
  addAgentReply: vi.fn(async (input: { ticketNo: string; content: string }) => ({ ticket: { ticketNo: input.ticketNo }, messages: [{ role: "agent", content: input.content }] })),
  updateTicketStatus: vi.fn(async (input: { ticketNo: string; status: string }) => ({ ticket: { ticketNo: input.ticketNo, status: input.status } })),
  getKpiMetrics: vi.fn(async (period: string) => ({ period, totalCases: 2, respondedCases: 2, averageFirstResponseSeconds: 18, handoffCases: 1, handoffRate: 0.5, resolvedCases: 1, resolutionRate: 0.5, cases: [] })),
  listTickets: vi.fn(async () => []),
  getTicket: vi.fn(async () => undefined),
  recordMessage: vi.fn(async (input: { conversationPublicId: string }) => ({ conversationPublicId: input.conversationPublicId })),
  appendMessage: vi.fn(),
  getConversation: vi.fn(),
  saveConversationState: vi.fn(),
}));

vi.mock("./supportDb", () => mocks);

const { appRouter } = await import("./routers");

function makeContext(role: "user" | "admin"): TrpcContext {
  return {
    user: { id: role === "admin" ? 1 : 2, openId: `${role}-contract`, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("support tRPC API contract", () => {
  it("creates a conversation and ticket through the formal procedures", async () => {
    const caller = appRouter.createCaller(makeContext("user"));
    await expect(caller.support.createConversation({ channel: "line" })).resolves.toMatchObject({ publicId: "conv_contract", channel: "line" });
    await expect(caller.support.createTicket({ conversationPublicId: "conv_contract", reason: "需要人工查核", summary: "粉絲團限制", missingFields: ["F16"] })).resolves.toMatchObject({ ticketNo: "CS-CONTRACT" });
    expect(mocks.createConversation).toHaveBeenCalledWith({ channel: "line" });
    expect(mocks.createTicket).toHaveBeenCalledWith(expect.objectContaining({ conversationPublicId: "conv_contract", missingFields: ["F16"], createdBy: 2 }));
  });

  it("supports admin reply, status update, and KPI query", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.support.agentReply({ ticketNo: "CS-CONTRACT", content: "客服已接手處理。" })).resolves.toMatchObject({ ticket: { ticketNo: "CS-CONTRACT" } });
    await expect(caller.support.updateTicketStatus({ ticketNo: "CS-CONTRACT", status: "resolved", note: "已完成處理" })).resolves.toMatchObject({ ticket: { status: "resolved" } });
    await expect(caller.support.kpi({ period: "7d" })).resolves.toMatchObject({ totalCases: 2, handoffRate: 0.5, resolutionRate: 0.5 });
    expect(mocks.addAgentReply).toHaveBeenCalledWith({ ticketNo: "CS-CONTRACT", content: "客服已接手處理。", actorUserId: 1 });
    expect(mocks.updateTicketStatus).toHaveBeenCalledWith({ ticketNo: "CS-CONTRACT", status: "resolved", note: "已完成處理", actorUserId: 1 });
  });

  it("surfaces service errors instead of pretending the operation succeeded", async () => {
    mocks.createTicket.mockRejectedValueOnce(new Error("CONVERSATION_NOT_FOUND"));
    const caller = appRouter.createCaller(makeContext("user"));
    await expect(caller.support.createTicket({ conversationPublicId: "missing", reason: "測試錯誤", summary: "無對話" })).rejects.toThrow("CONVERSATION_NOT_FOUND");
    mocks.getKpiMetrics.mockRejectedValueOnce(new Error("DATABASE_UNAVAILABLE"));
    const adminCaller = appRouter.createCaller(makeContext("admin"));
    await expect(adminCaller.support.kpi({ period: "today" })).rejects.toThrow("DATABASE_UNAVAILABLE");
  });
});
