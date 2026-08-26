export type DemoTone = "專業" | "親切" | "精簡";
export type DemoLanguage = "繁體中文" | "English" | "日本語";

export const demoResponses: Record<DemoLanguage, Record<DemoTone, string>> = {
  "繁體中文": {
    "專業": "您好，這裡是客服智能助理。很抱歉您遇到粉絲團受限制的情況。為了協助確認原因，請提供畫面上顯示的完整限制或停用訊息。",
    "親切": "您好，很抱歉粉絲團突然被限制一定讓您很困擾。我先幫您確認狀況，請把畫面上顯示的限制或停用訊息貼給我，好嗎？",
    "精簡": "很抱歉粉絲團受限制。請提供畫面上的完整限制或停用訊息，我們才能進一步確認。",
  },
  English: {
    "專業": "Hello, I’m the AI support assistant. I’m sorry your Page has been restricted. Please share the exact restriction or disabled message shown on screen so we can identify the next step.",
    "親切": "Hi, I’m sorry your Page was restricted — I know that can be frustrating. Could you share the exact message you see on screen? I’ll help check what to do next.",
    "精簡": "Sorry your Page was restricted. Please share the exact restriction or disabled message shown on screen.",
  },
  "日本語": {
    "專業": "こんにちは、AIサポートアシスタントです。ページが制限されているとのこと、申し訳ございません。画面に表示された制限または停止メッセージを正確にお知らせください。",
    "親切": "ページが突然制限されてしまい、ご不便をおかけしています。画面に表示されているメッセージを送っていただけますか？次の対応を確認します。",
    "精簡": "ページが制限されています。画面に表示された制限または停止メッセージをお知らせください。",
  },
};

import type { SupportState } from "./supportEngine";

export function getDemoViewModel(state: SupportState, language: DemoLanguage, tone: DemoTone) {
  return {
    answer: demoResponses[language][tone],
    intent: state.intent,
    sourceId: state.matchedKb?.["KB ID"] ?? null,
    confidence: state.confidence,
    rulesApplied: true,
    resolutionType: state.resolutionType,
    missingFields: state.missingFields,
  };
}
