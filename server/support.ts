import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { publicProcedure } from "./_core/trpc";

const messageSchema = z.object({ role: z.enum(["customer", "assistant"]), content: z.string() });

export const supportReply = publicProcedure
  .input(z.object({
    message: z.string().min(1),
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
    const customerHistory = history.filter((entry) => entry.role === "customer").slice(-6);
    const knowledgeText = context.knowledge ? JSON.stringify(context.knowledge) : "無可靠知識匹配";
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是企業客服 AI。所有對客輸出必須使用自然、專業、簡潔的繁體中文。以「目前客戶訊息」為最高優先，不能因歷史對話而回到上一個意圖；歷史對話只用於補足目前訊息明確延續的欄位。前端提供的 intent、resolutionType、knowledge 與 rules 是目前案件的控制脈絡，必須優先遵守。只能根據提供的知識與規則回答，不可捏造 Excel 不存在的資訊、網址或來源；若沒有可靠知識匹配，必須說明目前無法確認並提出一個最必要的澄清問題或轉人工。若信心低於 0.80、規則衝突或需要個案處理，必須誠實說明並提出下一步。資訊不足時只能補問一個最必要的問題，不能一次問多題。不得索取完整信用卡號、CVV、密碼。請將回答控制在清楚的 2 至 5 段。`,
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
    return JSON.parse(content);
  });
