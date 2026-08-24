import { describe, expect, it } from "vitest";
import { analyzeMessage, buildLocalReply, getKnowledgeBase, retrieveKnowledge } from "./supportEngine";

describe("supportEngine", () => {
  it("retrieves the payment method knowledge item from a natural Chinese query", () => {
    const result = retrieveKnowledge("我要新增信用卡付款");
    expect(result[0]?.item["KB ID"]).toBe("A04");
  });

  it("asks only for the first missing required field on ticket routes", () => {
    const state = analyzeMessage("我的信用卡付款失敗", [], {});
    expect(state.resolutionType).toBe("NEED_TICKET");
    expect(state.missingFields[0]).toBe("F01");
    expect(buildLocalReply("我的信用卡付款失敗", state)).toContain("Ad Account ID");
  });

  it("does not invent an answer when the query has no reliable match", () => {
    const state = analyzeMessage("火星上的帳號顏色怎麼改", [], {});
    expect(state.matchedKb).toBeUndefined();
    expect(buildLocalReply("火星上的帳號顏色怎麼改", state)).toContain("請問你遇到的是帳號");
  });

  it("supports an imported knowledge source", () => {
    const imported = [{ "KB ID": "CUSTOM-1", Intent: "自訂登入問題", "Customer Examples": "登入無法完成", Category: "帳號", Answer: "請重新確認登入狀態", "Resolution Type": "DIRECT_ANSWER", "Source Title": "內部手冊", "Source URL": "https://example.com" }];
    const result = analyzeMessage("登入無法完成", [], {}, imported);
    expect(result.matchedKb?.["KB ID"]).toBe("CUSTOM-1");
  });
});
