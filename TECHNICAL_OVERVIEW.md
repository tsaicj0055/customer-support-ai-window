# 客服智能工作臺技術總覽

## 文件目的

本文件提供產品、客服、營運與工程團隊共同閱讀的技術說明，區分目前已完成的原型能力與後續可整合項目。系統的核心概念是「知識庫檢索 + 規則護欄 + 多輪對話 + 人工接手」，而不是單純依賴模型自由生成。

## 功能與技術對照

| 主要功能 | 主要功能（續） | 使用技術 | 運用 API |
|---|---|---|---|
| 客戶對話視窗 | 多問題、追問、清楚的對話歷史 | React 19、TypeScript、Tailwind CSS 4 | tRPC、瀏覽器事件 |
| Excel 匯入 | 目前 UI 讀取 KB 工作表；內建 JSON 另含欄位字典、狀態與 Rules | SheetJS／xlsx、JSON mapping | File API；後續可擴充完整工作簿同步與 S3 |
| RAG 檢索 | 依 Intent、範例、Category、Answer 與同義詞排序 | 自訂 TypeScript retrieval engine、中文雙字詞 | 後續可接 Embeddings／Vector DB |
| 意圖切換 | 當前問題優先，避免上一個意圖跳針 | Topic family classifier、權重評分 | 目前為本地引擎 |
| Rules Guardrail | Privacy、規則衝突、人工要求、NEED_TICKET | Deterministic TypeScript rules | 後續可接工單與通知 API |
| 必要欄位補問 | 每次只補問一個最必要欄位 | Field dictionary、狀態判斷 | 後續可接 CRM schema |
| LLM 回答 | 輸出繁中回答、來源、信心、下一步 | Express、tRPC、structured output | Manus Built-in LLM／Forge API |
| 工單轉接 | 摘要、缺漏欄位、轉接原因 | React view model、summary builder | Zendesk／Intercom／Freshdesk 等 |
| 品質管理 | 測試情境、低信心、改善焦點 | React dashboard、Vitest | 後續可接 analytics API |

## 系統分層

### Presentation layer

React 頁面負責客服工作臺、對話輸入、訊息歷史、知識來源、信心狀態、下一步與工單預覽。Tailwind CSS 4 建立響應式視覺系統，桌面採工作區分欄，手機則轉為垂直閱讀流程。

### Conversation intelligence layer

`supportEngine.ts` 負責目前訊息的主題辨識、知識檢索、欄位抽取、Rules 判斷、信心估計與摘要。當偵測到付款、粉絲團、粉專、封鎖、廣告或帳號等新主題，系統會以當前訊息重新檢索，並只保留共用客戶欄位 `F01`、`F02`、`F06`、`F07`。

### AI generation layer

`server/support.ts` 提供伺服器端結構化回答程序。模型輸出受到 schema 與 guardrail 約束，預期欄位包含 `answer`、`confidence`、`evidence`、`nextStep`、`needsHuman` 與 `handoffReason`。若 LLM 不可用，前端仍可使用本地 fallback，避免客服工作臺完全停止。

### Data layer

目前提供的 workbook 已先轉成前端可讀的結構化 JSON；畫面上的 `.xlsx` 匯入按鈕目前實際載入 KB 工作表，欄位字典、狀態流程、Decision Rules 與測試情境則由內建 JSON 提供。正式環境建議將知識版本、匯入者、匯入時間、規則版本、對話摘要與工單紀錄放入資料庫；檔案本體則使用物件儲存，不直接塞入資料庫欄位。

## 建議的 Excel 資料模型

| 工作表 | 目的 | 建議欄位 |
|---|---|---|
| KB_Phase2 | 知識與 FAQ | KB ID、Intent、Customer Examples、Answer、Category、Resolution Type、Source URL |
| Field Dictionary | 必要欄位 | Field ID、Field Name、AI Question、Description、Sensitive |
| Conversation States | 對話狀態 | State、Condition、Allowed Action、Next State |
| Decision Rules | 規則護欄 | Rule ID、Condition、Action、Priority、Escalation |
| Prototype Scenarios | 測試案例 | Scenario、Input、Expected Intent、Expected Route |

資料維護原則是：Excel 優先記錄**事實、條件、規則與下一步**，不要為每種問法手動寫一份答案。AI 應負責將結構化事實轉成不同語氣與格式的回答。

## API 與金鑰管理

目前伺服器可使用系統預先提供的 Built-in Forge／LLM 環境變數。外部 Google、CRM、Helpdesk 或通知 API 應採用以下模式：

```text
前端 React
  → tRPC
    → Express server
      → 外部 API／LLM
```

所有秘密值都應放在 server-side environment variables 或專案 Secrets，不得放在 `client/src`、瀏覽器 bundle、README、Repository commit 或上傳的 Excel 中。若使用 Google Gemini API，應在 Google AI Studio 或 Google Cloud 取得官方 API key，再以伺服器端環境變數注入；Google Opal 的 mini-app 分享與託管帳號，不等同於 Gemini API key。

## Google Opal 與本專案的關係

Google Opal 適合用自然語言快速建立、編輯與分享 AI mini-app，並由 Opal 處理其託管。[1] 它可以用來驗證「讀取輸入 → 模型處理 → 產生結果」的流程概念；本 Repository 則適合維護真正的 React UI、Express server、Excel parser、Rules、測試與企業 API 整合。

因此建議採用雙軌方式：先用 Opal 做 prompt 或工作流程概念驗證，再把已驗證的流程落回本 Repository，使用可測試、可版本控制且可管理金鑰的程式架構。不要在 Opal 介面或公開 Repository 內貼上正式 API key。

## Repository 與文件入口

```text
README.md                  # 快速開始與產品／技術摘要
TECHNICAL_OVERVIEW.md      # 本技術總覽
docs/index.md              # 文件索引與閱讀順序
client/src/pages/Home.tsx  # 主客服工作臺
client/src/lib/supportEngine.ts # 檢索與 Rules 引擎
server/support.ts          # LLM 回答程序
server/routers.ts          # tRPC API
server/*.test.ts           # 測試
```

## References

[1]: https://developers.google.com/opal "Google for Developers — Opal"
