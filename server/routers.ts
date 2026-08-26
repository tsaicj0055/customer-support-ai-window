import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { supportReply } from "./support";
import { addAgentReply, createConversation, createTicket, getKpiMetrics, getTicket, listTickets, recordMessage, updateTicketStatus } from "./supportDb";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  support: router({
    createConversation: publicProcedure.input(z.object({ channel: z.string().max(32).optional(), customerName: z.string().max(160).optional() })).mutation(({ input }) => createConversation(input)),
    reply: supportReply,
    recordMessage: publicProcedure.input(z.object({ conversationPublicId: z.string().min(1), role: z.enum(["customer", "assistant", "agent", "system"]), content: z.string().min(1).max(10000) })).mutation(({ input, ctx }) => recordMessage({ ...input, responderUserId: input.role === "agent" ? ctx.user?.id : undefined })),
    createTicket: publicProcedure.input(z.object({ conversationPublicId: z.string().min(1), reason: z.string().min(1).max(255), summary: z.string().min(1), missingFields: z.array(z.string()).max(20).optional() })).mutation(({ input, ctx }) => createTicket({ ...input, createdBy: ctx.user?.id })),
    ticketList: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional()).query(({ input }) => listTickets(input?.limit)),
    ticketDetail: adminProcedure.input(z.object({ ticketNo: z.string().min(1) })).query(({ input }) => getTicket(input.ticketNo)),
    updateTicketStatus: adminProcedure.input(z.object({ ticketNo: z.string().min(1), status: z.enum(["open", "in_progress", "resolved", "closed"]), note: z.string().max(500).optional() })).mutation(({ input, ctx }) => updateTicketStatus({ ...input, actorUserId: ctx.user.id })),
    agentReply: adminProcedure.input(z.object({ ticketNo: z.string().min(1), content: z.string().min(1).max(10000) })).mutation(({ input, ctx }) => addAgentReply({ ...input, actorUserId: ctx.user.id })),
    kpi: adminProcedure.input(z.object({ period: z.enum(["today", "7d", "current"]), conversationPublicId: z.string().optional() })).query(({ input }) => getKpiMetrics(input.period, input.conversationPublicId)),
  }),
});

export type AppRouter = typeof appRouter;
