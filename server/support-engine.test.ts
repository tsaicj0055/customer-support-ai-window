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
