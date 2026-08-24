import { describe, expect, it } from "vitest";
import { analyzeMessage, buildLocalReply, retrieveKnowledge } from "../client/src/lib/supportEngine";

describe("support decision guardrails", () => {
  it("matches a direct-answer payment method question", () => {
    const result = retrieveKnowledge("我要新增信用卡付款");
    expect(result[0]?.item["KB ID"]).toBe("A04");
    expect(analyzeMessage("我要新增信用卡付款", [], {}).resolutionType).toBe("DIRECT_ANSWER");
  });
  it("asks for only one missing field and routes ticket cases", () => {
    const state = analyzeMessage("我的信用卡付款失敗", [], {});
    expect(state.resolutionType).toBe("NEED_TICKET");
    expect(state.missingFields[0]).toBe("F01");
    expect(buildLocalReply("我的信用卡付款失敗", state)).toContain("Ad Account ID");
  });
  it("detects customer handoff requests and privacy risks", () => {
    const state = analyzeMessage("請轉真人，我不會提供完整卡號", [], {});
    expect(state.needsHuman).toBe(true);
    expect(state.ruleFlags.customerRequestedHuman).toBe(true);
    expect(state.ruleFlags.privacyRisk).toBe(true);
    expect(state.handoffReason).toContain("人工");
  });
  it("routes low-confidence questions to clarification", () => {
    const state = analyzeMessage("完全不相關的天氣問題", [], {});
    expect(state.confidence).toBeLessThan(0.8);
    expect(state.resolutionType).toBe("CLARIFY");
  });
  it("refuses unsupported topics instead of inventing an answer", () => {
    const state = analyzeMessage("火星上的帳號顏色怎麼改", [], {});
    expect(state.matchedKb).toBeUndefined();
    expect(buildLocalReply("火星上的帳號顏色怎麼改", state)).toContain("請問你遇到的是帳號");
  });
});

  it("switches from payment to page-blocked intent without repeating payment", () => {
    const payment = analyzeMessage("我的信用卡付款失敗", [], {});
    const page = analyzeMessage("我的粉絲團被封鎖了", [{ role: "customer", content: "我的信用卡付款失敗", time: "" }, { role: "assistant", content: "請提供 Ad Account ID", time: "" }], { ...payment.collectedFields, F01: "act_1234", F11: "末四碼 1234" });
    expect(page.matchedKb?.["KB ID"]).toBe("A01");
    expect(page.matchedKb?.["Source Title"]).toBe("Meta Business Help Center");
    expect(page.matchedKb?.["Source URL"]).toContain("facebook.com/business/help");
    expect(page.matchedKb?.["Intent"]).toBe("Ad Account Disabled");
    expect(page.category).not.toContain("付款");
    expect(page.intent).not.toBe("Payment Failed");
    expect(page.confidence).toBeGreaterThan(0.55);
    expect(page.missingFields).not.toContain("F11");
    expect(page.missingFields).toContain("F16");
    expect(buildLocalReply("我的粉絲團被封鎖了", page)).toContain("限制或停用訊息");
    expect(page.ruleFlags.ruleConflict).toBe(false);
    expect(page.handoffReason).toContain("個案查核");
    expect(page.resolutionType).toBe("NEED_TICKET");
    expect(page.summary).toContain("粉絲團被封鎖");
    expect(page.summary).not.toContain("信用卡付款失敗");
  });
