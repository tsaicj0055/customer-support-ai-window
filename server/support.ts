import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { publicProcedure } from "./_core/trpc";
import { appendMessage, createConversation, getConversation, saveConversationState } from "./supportDb";

const messageSchema = z.object({ role: z.enum(["customer", "assistant"]), content: z.string() });

type AiReplyResult = {
  answer: string;
  confidence: number;
  confidenceLabel: "高" | "中" | "低";
  citations: string[];
  nextStep: string;
  needsHuman: boolean;
  askField: string | null;
  summary: string;
};

export function enforceReplyGuardrails(result: AiReplyResult, message: string, context: { confidence: number; knowledge?: Record<string, string | null>; missingFields: string[] }) {
  const current = message.toLowerCase();
  const pageIntent = /粉絲團|粉專|封鎖|停用|限制|page|disabled|restriction/.test(current);
  const paymentAnswer = /付款|信用卡|payment|card|cvv|卡號/.test(result.answer.toLowerCase());
  const reliableKnowledge = Boolean(context.knowledge && Object.keys(context.knowledge).length);
  if (pageIntent && paymentAnswer && !/付款|信用卡|payment|card/.test(current)) {
    throw new Error("AI_RESULT_INTENT_MISMATCH");
  }
  if (!reliableKnowledge) {
    return { ...result, needsHuman: true, confidence: Math.min(result.confidence, 0.54), confidenceLabel: "低" as const, citations: [], askField: result.askField ?? context.missingFields[0] ?? null };
  }
  if (context.confidence < 0.8 || result.confidence < 0.8) {
    return { ...result, needsHuman: true, confidenceLabel: result.confidence < 0.55 ? "低" as const : "中" as const };
  }
  return result;
}

export const supportReply = publicProcedure
  .input(z.object({
    message: z.string().min(1),
    conversationPublicId: z.string().min(1).optional(),
    history: z.array(messageSchema).max(12),
    context: z.object({
      intent: z.string().optional(),
      category: z.string().optional(),
      confidence: z.number(),
      resolutionType: z.string().optional(),
      knowledge: z.record(z.string(), z.string().nullable()).optional(),
      missingFields: z.array(z.string()),
      collectedFields: z.record(z.string(), z.string()),
      rules: z.array(z.record(z.string(), z.string().nullable())),
    }),
  }))
  .mutation(async ({ input }) => {
    const { message, history, context } = input;
    const conversation = input.conversationPublicId ? await getConversation(input.conversationPublicId) : await createConversation({ channel: "web" });
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");
    await appendMessage({ conversationId: conversation.id, role: "customer", content: message });
    const customerHistory = history.filter((entry) => entry.role === "customer").slice(-6);
    const knowledgeText = context.knowledge ? JSON.stringify(context.knowledge) : "無可靠知識匹配";
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是企業客服 AI。所有對客輸出必須使用自然、專業、簡潔的繁體中文。先直接處理「目前客戶訊息」，只有當目前訊息明確是追問或延續時才使用歷史；歷史對話永遠不能覆蓋目前意圖，也不能把上一題的答案重複貼回來。前端提供的 intent、resolutionType、knowledge 與 rules 是目前案件的控制脈絡，必須優先遵守。回答順序是：先給結論或同理一句，再提供知識庫支持的處理方式，最後只給一個下一步。不要重述整段客戶問題，不要每一輪重複固定問候，不要使用空泛的「請耐心等候」。只能根據提供的知識與規則回答，不可捏造 Excel 不存在的資訊、網址或來源；若沒有可靠知識匹配，必須說明目前無法確認並提出一個最必要的澄清問題或轉人工。若信心低於 0.80、規則衝突或需要個案處理，必須誠實說明並提出下一步。資訊不足時只能補問一個最必要的問題，不能一次問多題。不得索取完整信用卡號、CVV、密碼。請將回答控制在清楚的 2 至 5 段，避免機械化與重複用語。`,
        },
        {
          role: "user",
          content: JSON.stringify({ currentCustomerMessage: message, recentCustomerHistory: customerHistory, context: { ...context, knowledge: knowledgeText } }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "support_reply",
          strict: true,
          schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
              confidence: { type: "number" },
              confidenceLabel: { type: "string", enum: ["高", "中", "低"] },
              citations: { type: "array", items: { type: "string" } },
              nextStep: { type: "string" },
              needsHuman: { type: "boolean" },
              askField: { type: ["string", "null"] },
              summary: { type: "string" },
            },
            required: ["answer", "confidence", "confidenceLabel", "citations", "nextStep", "needsHuman", "askField", "summary"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("AI 回答格式無法解析");
    const parsed = JSON.parse(content) as AiReplyResult;
    const result = enforceReplyGuardrails(parsed, message, context);
    await appendMessage({ conversationId: conversation.id, role: "assistant", content: result.answer });
    await saveConversationState(conversation.publicId, {
      intent: context.intent,
      summary: result.summary,
      status: result.needsHuman ? "pending" : context.resolutionType === "DIRECT_ANSWER" ? "resolved" : "open",
    });
    return { ...result, conversationPublicId: conversation.publicId };
  });
