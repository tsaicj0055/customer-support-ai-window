import { describe, expect, it } from "vitest";
import { demoResponses, getDemoViewModel, type DemoLanguage, type DemoTone } from "../client/src/lib/brandVoiceDemo";
import { analyzeMessage, getKnowledgeBase, getRules } from "../client/src/lib/supportEngine";

describe("brand voice demo", () => {
  const languages: DemoLanguage[] = ["繁體中文", "English", "日本語"];
  const tones: DemoTone[] = ["專業", "親切", "精簡"];

  it("provides every language and tone combination", () => {
    for (const language of languages) {
      for (const tone of tones) {
        expect(demoResponses[language][tone].length).toBeGreaterThan(20);
      }
    }
  });

  it("keeps the same next-step intent across languages", () => {
    expect(demoResponses["繁體中文"]["親切"]).toContain("限制");
    expect(demoResponses.English["親切"]).toContain("restricted");
    expect(demoResponses["日本語"]["親切"]).toContain("制限");
  });

  it("uses the live support case as the shared demo context", () => {
    const state = analyzeMessage("我的粉絲團被封鎖了", [], {}, getKnowledgeBase());
    expect(state.intent).toBeTruthy();
    expect(state.matchedKb).toBeTruthy();
    expect(state.confidence).toBeGreaterThan(0);
    expect(getRules().length).toBeGreaterThan(0);
  });

  it("preserves live case fields for every language and tone", () => {
    const state = analyzeMessage("我的粉絲團被封鎖了", [], {}, getKnowledgeBase());
    const baseline = getDemoViewModel(state, languages[0], tones[0]);
    for (const language of languages) {
      for (const tone of tones) {
        const view = getDemoViewModel(state, language, tone);
        expect(view.intent).toBe(baseline.intent);
        expect(view.sourceId).toBe(baseline.sourceId);
        expect(view.confidence).toBe(baseline.confidence);
        expect(view.resolutionType).toBe(baseline.resolutionType);
        expect(view.missingFields).toEqual(baseline.missingFields);
        expect(view.rulesApplied).toBe(true);
      }
    }
  });
});
