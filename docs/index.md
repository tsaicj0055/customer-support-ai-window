# 客服智能工作臺文件索引

這是客服智能工作臺的文件入口。建議第一次閱讀時，先看產品定位，再看技術總覽，最後依照開發或整合需求閱讀對應章節。

## 文件導覽

| 文件 | 適合讀者 | 內容 |
|---|---|---|
| [README.md](../README.md) | 全部使用者 | 產品簡介、主要功能、快速開始、Repository 與基本安全原則 |
| [TECHNICAL_OVERVIEW.md](../TECHNICAL_OVERVIEW.md) | 產品、營運、工程 | 功能／技術／API 對照、資料模型、AI 流程與 Opal 邊界 |
| [client/src/lib/supportEngine.ts](../client/src/lib/supportEngine.ts) | 工程人員 | 檢索、主題切換、欄位抽取與 Rules Guardrail |
| [server/support.ts](../server/support.ts) | AI／後端工程人員 | 伺服器端結構化 LLM 回答程序 |
| [server/routers.ts](../server/routers.ts) | 後端工程人員 | tRPC 程序與前後端 API 契約 |
| [server/support-engine.test.ts](../server/support-engine.test.ts) | QA／工程人員 | 回答、信心、補問、轉接與跨意圖測試 |

## 閱讀順序

產品或營運人員可以先閱讀 README 的「產品能力」與「AI 回答流程」，再閱讀技術總覽中的「建議 Excel 資料模型」，理解哪些資料需要維護、哪些工作由 AI 自動完成。

工程人員可以依序閱讀技術總覽的「系統分層」、「API 與金鑰管理」與「Repository 與文件入口」，接著執行 `pnpm test`、`pnpm check` 與 `pnpm build`，最後再修改對應程式與測試。

若要驗證 Google Opal 的概念流程，請先閱讀技術總覽中的「Google Opal 與本專案的關係」。Opal 適合快速驗證 no-code AI mini-app；正式的金鑰、版本控制、Rules、測試與企業 API 整合仍應放在本 Repository 與伺服器端環境中。[1]

## 文件維護原則

文件中的「目前狀態」只描述已存在於專案的功能；外部 CRM、Helpdesk、Google Gemini、向量資料庫與通知服務若尚未接入，會標註為後續整合。每次修改 Excel schema、API contract、Rules 或金鑰變數時，應同步更新 README 與 TECHNICAL_OVERVIEW，並補上測試。

## References

[1]: https://developers.google.com/opal "Google for Developers — Opal"
