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


## 正式營運功能

目前專案已從前端示範資料升級為可保存真實案件的版本。對話與回覆資料會寫入資料庫，人工轉接會產生正式工單，管理者可從工單中心查看工單列表、摘要、缺漏欄位、狀態事件與完整對話；客服營運儀表板則從資料庫計算平均首次回應時間、人工轉接率與案件解決率。

相關閱讀入口如下：

| 主題 | 文件／程式 | 說明 |
|---|---|---|
| 資料表與 migration | `drizzle/schema.ts`、`drizzle/migrations/` | 對話、訊息、工單與事件資料模型 |
| 資料存取 | `server/supportDb.ts` | 正式寫入、查詢、狀態更新與 KPI 聚合 |
| 客服 API | `server/routers.ts` | 對話、回覆、fallback 保存、工單與 KPI tRPC 程序 |
| 工單中心 | `client/src/pages/Home.tsx` | 管理者工單列表與詳細對話檢視 |
| KPI 儀表板 | `client/src/lib/kpiMetrics.ts`、`server/supportDb.ts` | 原型指標計算與正式資料庫聚合的邊界 |
| 視覺驗證 | `docs/kpi-dashboard-verification.md` | 桌面與手機版 KPI 儀表板驗證記錄 |

正式功能仍需由具備管理者角色的帳號查看管理資料；LINE、Messenger、Instagram、WhatsApp 與 CRM／Helpdesk 尚未接入，需另行完成官方 API、Webhook、Secrets 與身份合併設定。
