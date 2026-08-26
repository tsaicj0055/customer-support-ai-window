# 客服智能工作臺

客服智能工作臺是一個以繁體中文為主的 AI 客服作業原型。它不是只提供聊天回答，而是將 Excel 知識庫、欄位字典、Rules、對話脈絡、信心評估與人工轉接流程整合在同一個工作臺中，協助客服快速理解問題、取得有依據的回答，並在資訊不足或風險較高時安全地補問或轉接。

## 產品能力

| 主要功能 | 主要功能（續） | 使用技術 | 運用 API／服務 |
|---|---|---|---|
| 多輪繁體中文對話 | 保留對話歷史、切換新主題時避免舊意圖污染 | React 19、TypeScript、Wouter | tRPC API、伺服器端 LLM |
| Excel 知識庫匯入 | 目前 UI 匯入按鈕載入 KB 工作表；內建資料另含欄位字典、狀態流程、Decision Rules 與測試情境 | SheetJS／xlsx、結構化 JSON | 瀏覽器端 File API；後續可擴充完整工作簿同步與 S3／Database |
| RAG 知識檢索 | 依問題、同義詞、Intent、Category 與回答內容排序 | 自訂檢索引擎、中文雙字詞、意圖權重 | 目前使用本地知識資料；可延伸 Embedding／Vector DB |
| Rules Guardrail | 隱私風險、客戶要求人工、規則衝突與必要欄位檢查 | TypeScript rule engine、欄位白名單 | 可延伸 CRM、Helpdesk 或通知 API |
| LLM 回答 | 依據檢索結果與對話狀態輸出自然繁中回答 | Express、tRPC、結構化 JSON schema | Manus Built-in LLM／Forge API |
| 單一補問 | 只詢問目前最必要的一個欄位，不一次丟出多個問題 | Field dictionary、狀態機、回答 fallback | 可接表單、CRM 欄位或工單 API |
| 信心與依據 | 顯示信心狀態、來源、Resolution、下一步 | Structured response、來源 metadata | 可記錄至資料庫或品質分析服務 |
| 人工轉接／工單 | 產生摘要、已知欄位、缺漏欄位與轉接原因 | React UI、Rules、LLM summary | 可接 Zendesk、Intercom、Freshdesk、Slack 或 Email |
| 管理者改善檢視 | 檢查測試情境、低信心與知識庫改善方向 | React、Tailwind CSS、Vitest | 後續可接 analytics／observability API |

## 技術架構

```text
客戶訊息
   │
   ▼
React 客服工作臺
   │  對話歷史、輸入、來源、信心、工單預覽
   ▼
tRPC API / Express Server
   │
   ├─ 對話脈絡與主題家族辨識
   ├─ Excel 結構化知識與 RAG 檢索
   ├─ Rules Guardrail 與必要欄位檢查
   ├─ 結構化 LLM 回答
   └─ 低信心 fallback／人工轉接
   │
   ├─ KB／Field Dictionary／Rules JSON
   ├─ Manus Built-in LLM
   └─ 後續可接 CRM、Helpdesk、Database、通知服務
```

### 目前使用的主要技術

本專案前端使用 **React 19、TypeScript、Vite、Tailwind CSS 4、Radix UI 與 Lucide Icons**，負責建立客服工作臺、訊息氣泡、來源卡片、信心狀態與響應式版面。路由與前後端資料契約使用 **Wouter 與 tRPC 11**。

伺服器使用 **Express 4**，AI 回答位於伺服器端程序，避免把敏感金鑰放在瀏覽器。資料層預留 **Drizzle ORM 與 MySQL／TiDB**，目前提供的 workbook 已先轉成前端可讀的結構化 JSON，包含知識庫、欄位字典、狀態流程、Decision Rules 與測試情境；畫面上的 `.xlsx` 匯入按鈕目前實際載入的是知識庫工作表。正式版本可再擴充為一次同步解析完整工作簿，並將知識版本、匯入紀錄、工單與對話摘要持久化到資料庫。

測試使用 **Vitest**，目前涵蓋直接回答、低信心澄清、必要欄位補問、隱私風險、客戶要求人工，以及「付款問題切換到粉絲團被封鎖」的跨意圖回歸測試。

## AI 回答流程

系統不會把全部歷史對話無限制地塞給模型。當目前訊息出現新的主題家族，例如「付款」、「粉絲團」、「封鎖」、「廣告」或「帳號」，系統會優先使用當前問題重新檢索；跨主題時只保留可共用的客戶欄位，並重建摘要，避免上一題的付款意圖污染下一題的粉絲團問題。

接著系統會依序執行知識檢索、意圖判斷、Rules Guardrail、必要欄位檢查與信心評估。若資料足夠，LLM 依據知識來源產生繁體中文回答；若只缺一項資料，系統只補問一個最必要欄位；若信心不足、規則衝突、涉及隱私或客戶要求人工，則產生人工轉接資訊，而不是臆測答案。

## API 與金鑰

目前可區分為三類 API：

| 類別 | 用途 | 金鑰位置 | 目前狀態 |
|---|---|---|---|
| 內部 tRPC API | 前端呼叫伺服器端客服回答程序 | 由專案伺服器處理 | 已整合 |
| Manus Built-in LLM／Forge API | 產生結構化繁體中文回答、信心、依據與下一步 | Server-side environment variables | 已預留／已整合回答程序 |
| 外部 CRM／Helpdesk API | 建立正式工單、同步案件與人工轉接 | Server-side secrets | 尚未接入 |

**不要把 API key 寫進 React、`client/src`、`README.md`、Git commit 或 `.env` 檔案。** 正式專案應使用專案的 Secrets 管理流程，環境變數只在伺服器端讀取。若未來使用 Google Gemini API，應另行申請 Google AI Studio／Google Cloud 的 API key，並以伺服器端環境變數保存；這和 Google Opal 的登入或分享權限不是同一件事。

## Google Opal 的適用範圍

Google Opal 是用自然語言建立、編輯與分享 AI mini-app 的 no-code 工具，官方文件說明它可以串接多步驟 prompt、模型呼叫與工具，並由 Opal 處理 mini-app 託管。[1] 因此，Opal 適合用來快速驗證一個 AI 工作流程或製作內部展示版；本 Repository 則適合承載可控的 React／Express 程式、Excel 解析、Rules、測試、權限與正式外部 API 整合。

建議不要把「Opal 的分享連結」當成「本 Repository 的 API key」。如果需要由本專案呼叫 Google 模型，應使用 Google 官方 API 的金鑰與伺服器端環境變數；如果只是用 Opal 做流程概念驗證，則可以把本專案的客服流程圖與 prompt 搬到 Opal，但兩者仍是不同的執行環境。

## 開發與執行

```bash
pnpm install
pnpm dev
```

執行型別檢查、測試與正式建置：

```bash
pnpm check
pnpm test
pnpm build
```

開發預覽會由專案管理環境提供 URL。請不要在程式中硬編碼 port，也不要把需要長時間執行的 worker 寫進單次 Web request。

## Repository 結構

```text
client/src/pages/Home.tsx          # 客服工作臺主要畫面
client/src/lib/supportEngine.ts   # Excel 知識檢索、意圖與 guardrail
client/src/data/                  # 結構化知識庫資料
server/support.ts                 # 伺服器端結構化 AI 回答
server/routers.ts                 # tRPC API 路由
server/*.test.ts                  # Vitest 測試
drizzle/schema.ts                 # 使用者與後續資料模型
TECHNICAL_OVERVIEW.md              # 功能／技術／API 詳細對照
docs/index.md                     # 文件導覽
```

## GitHub／Repository 建議流程

1. 先在本地執行 `pnpm test`、`pnpm check` 與 `pnpm build`。
2. 確認沒有把 API key、客戶真實個資、上傳檔案或 `.env` 加入版本控制。
3. 以專案管理介面的 GitHub 匯出功能建立 Repository，或由工程團隊依公司 GitHub 權限另行匯出。
4. 在 GitHub Repository Secrets 設定正式環境金鑰，不要直接提交秘密值。
5. 使用 README、`TECHNICAL_OVERVIEW.md` 與 `docs/index.md` 作為交接入口。

## References

[1]: https://developers.google.com/opal "Google for Developers — Opal"
