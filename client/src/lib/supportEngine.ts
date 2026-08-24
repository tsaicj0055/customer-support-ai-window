import workbook from "../data/knowledge-base.json";

export type KnowledgeItem = Record<string, string | null>;
export type ConversationMessage = { role: "customer" | "assistant"; content: string; time: string };
export type SupportState = {
  intent?: string;
  category?: string;
  confidence: number;
  resolutionType?: string;
  matchedKb?: KnowledgeItem;
  collectedFields: Record<string, string>;
  missingFields: string[];
  needsHuman: boolean;
  ruleFlags: { customerRequestedHuman: boolean; ruleConflict: boolean; privacyRisk: boolean };
  handoffReason: string;
  summary: string;
};

const kb = workbook.knowledgeBase as KnowledgeItem[];
const fields = workbook.fieldDictionary as KnowledgeItem[];
const rules = workbook.decisionRules as KnowledgeItem[];

const normalize = (value: string) => value.toLowerCase().replace(/[，。！？、,.!?；;:：]/g, " ");
const tokens = (value: string) => Array.from(normalize(value).matchAll(/[A-Za-z0-9]+|[\u4e00-\u9fff]{2}/g)).map((match) => match[0]);
const topicFamily = (value: string) => /(付款|扣款|信用卡|欠款)/.test(value) ? "payment" : /(粉絲團|粉專|粉絲頁|封鎖|Page)/i.test(value) ? "page" : /(廣告|Campaign|Ad Account|投放)/i.test(value) ? "ads" : /(登入|帳號)/i.test(value) ? "account" : "other";
const sharedFieldIds = new Set(["F01", "F02", "F06", "F07"]);
const keepSharedFields = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).filter(([id]) => sharedFieldIds.has(id)));

export function retrieveKnowledge(query: string, history: ConversationMessage[] = [], sourceKb: KnowledgeItem[] = kb) {
  const newTopicSignal = /(付款|扣款|信用卡|粉絲團|粉專|粉絲頁|封鎖|停用|限制|廣告|登入|發票|帳號|連不起來|找不到)/.test(query);
  const corpus = newTopicSignal ? query : [query, ...history.slice(-2).map((m) => m.content)].join(" ");
  const queryTokens = tokens(corpus);
  return sourceKb
    .map((item) => {
      const text = normalize([item["Intent"], item["Customer Examples"], item["Category"], item["Answer"]].filter(Boolean).join(" "));
      const phrase = normalize(String(item["Customer Examples"] ?? ""));
      const exactPhraseBonus = phrase && normalize(corpus).includes(phrase) ? 8 : 0;
      const intentBoost = (["新增", "付款", "扣款", "停用", "限制", "無法發布", "付款失敗", "欠款"] as string[]).reduce((total, keyword) => total + (normalize(corpus).includes(keyword) && text.includes(keyword) ? 3 : 0), 0);
      const pageRestrictionBoost = /(粉絲團|粉專|粉絲頁|封鎖)/.test(corpus) && /(page|disabled|restriction|停用|限制)/i.test(text) ? 6 : 0;
      const score = exactPhraseBonus + intentBoost + pageRestrictionBoost + queryTokens.reduce((total, token) => total + (text.includes(token) ? (token.length > 2 ? 2 : 1) : 0), 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function extractFields(text: string, current: Record<string, string>) {
  const next = { ...current };
  const patterns: Record<string, RegExp> = {
    F01: /(?:ad\s*account\s*id|帳號(?:編號|id)?)[：:\s]*([A-Za-z0-9_-]{4,})/i,
    F03: /(?:campaign\s*id|campaign)[：:\s]*([A-Za-z0-9_-]{4,})/i,
    F08: /(?:錯誤(?:訊息|碼)?|error(?:\s*message)?)[：:\s]*(.+)/i,
    F09: /(?:截圖|screenshot)[：:\s]*(.+)/i,
    F10: /(?:發生時間|開始時間|issue\s*start\s*time)[：:\s]*(.+)/i,
    F11: /(?:付款方式|卡片末四碼|payment\s*method)[：:\s]*(.+)/i,
    F12: /(?:扣款日期|交易日期)[：:\s]*(.+)/i,
    F13: /(?:扣款金額|金額|amount)[：:\s]*([$＄]?\s?[\d,.]+[^，。\n]*)/i,
    F14: /(?:欠款|餘額|outstanding\s*balance)[：:\s]*([$＄]?\s?[\d,.]+[^，。\n]*)/i,
    F15: /(?:交易描述|交易名稱|transaction)[：:\s]*(.+)/i,
  };
  for (const field of fields) {
    const id = String(field["Field ID"] ?? "");
    const match = patterns[id]?.exec(text);
    if (match?.[1]) next[id] = match[1].trim();
  }
  return next;
}

function requiredIds(item?: KnowledgeItem) {
  return String(item?.["Required Field IDs"] ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

export function analyzeMessage(text: string, history: ConversationMessage[], currentFields: Record<string, string>, sourceKb: KnowledgeItem[] = kb): SupportState {
  const results = retrieveKnowledge(text, history, sourceKb);
  const best = results[0];
  const score = best?.score ?? 0;
  const confidence = Math.min(0.98, Math.max(0.32, 0.42 + score * 0.09));
  const previousCustomer = [...history].reverse().find((message) => message.role === "customer")?.content ?? "";
  const changedTopic = history.length > 0 && topicFamily(text) !== "other" && topicFamily(previousCustomer) !== "other" && topicFamily(text) !== topicFamily(previousCustomer);
  const effectiveFields = changedTopic ? keepSharedFields(currentFields) : currentFields;
  const collectedFields = extractFields(text, effectiveFields);
  const item = score >= 5 && confidence >= 0.55 ? best?.item : undefined;
  const missingFields = item ? requiredIds(item).filter((id) => !collectedFields[id]) : [];
  const resolutionType = String(item?.["Resolution Type"] ?? "");
  const customerRequestedHuman = /(人工|真人|專員|客服人員|轉接)/.test(text);
  const privacyRisk = /(完整卡號|信用卡號|cvv|安全碼|密碼)/i.test(text);
  const ruleConflict = resolutionType === "DIRECT_ANSWER" && missingFields.length > 0;
  const needsHuman = confidence < 0.8 || resolutionType === "NEED_TICKET" || missingFields.length > 0 || customerRequestedHuman || privacyRisk || ruleConflict;
  const handoffReason = customerRequestedHuman ? "客戶要求人工協助" : privacyRisk ? "偵測到付款隱私風險，禁止收集敏感資料" : ruleConflict ? "回答路由與欄位規則衝突" : confidence < 0.8 ? "信心低於 0.80，避免強行匹配" : resolutionType === "NEED_TICKET" ? "此類問題需個案查核" : missingFields.length > 0 ? "仍有必要欄位缺漏" : "客戶要求人工協助";
  const summaryHistory = changedTopic ? [] : history.slice(-5);
  const summary = [...summaryHistory, { role: "customer", content: text, time: "" }]
    .map((m) => `${m.role === "customer" ? "客戶" : "客服"}：${m.content}`)
    .join("｜");
  return {
    intent: item?.["Intent"] ?? "待澄清問題",
    category: item?.["Category"] ?? "未分類",
    confidence,
    resolutionType: resolutionType || "CLARIFY",
    matchedKb: item,
    collectedFields,
    missingFields,
    needsHuman,
    ruleFlags: { customerRequestedHuman, ruleConflict, privacyRisk },
    handoffReason,
    summary,
  };
}

export function buildLocalReply(text: string, state: SupportState) {
  const item = state.matchedKb;
  if (!item || state.confidence < 0.55) {
    return "為了協助你找到正確的處理方式，請問你遇到的是帳號、付款、廣告投放，還是其他 Meta 廣告問題？";
  }
  if (state.resolutionType === "DIRECT_ANSWER") {
    return `${item["Answer"]}\n\n參考：${item["Source Title"]}`;
  }
  if (state.missingFields.length > 0) {
    const first = fields.find((field) => field["Field ID"] === state.missingFields[0]);
    return `${item["Answer"]}\n\n為了替你進一步確認個案，請提供${first?.["AI Question"] ?? "必要的案件資訊"}`;
  }
  return `${item["Answer"]}\n\n我已整理目前資訊，下一步可以建立人工工單讓專員接續處理。`;
}

export function getRules() { return rules; }
export function getFieldDictionary() { return fields; }
export function getKnowledgeBase() { return kb; }
