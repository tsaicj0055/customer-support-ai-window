# 文件一致性檢查清單

每次修改客服智能工作臺的功能、資料流程或外部整合時，請在建立 checkpoint 前完成下列核對。這份清單的目的，是避免 README 或技術文件把尚未實作的能力誤寫成已完成。

## 功能與程式核對

| 核對項目 | 實作來源 | 文件來源 | 核對結果 |
|---|---|---|---|
| 客服工作臺畫面與對話輸入 | `client/src/pages/Home.tsx` | `README.md`「產品能力」 | 已核對 |
| Excel 匯入實際範圍 | `Home.tsx` 的 `importWorkbook` | `README.md`、`TECHNICAL_OVERVIEW.md` | 目前只載入 KB 工作表，已如實記載 |
| 內建欄位、狀態與 Rules 資料 | `client/src/data/`、`supportEngine.ts` | `TECHNICAL_OVERVIEW.md`「建議的 Excel 資料模型」 | 已核對 |
| 主題切換與跨意圖摘要 | `client/src/lib/supportEngine.ts` | `README.md`「AI 回答流程」 | 已核對 |
| 伺服器端 LLM 回答 | `server/support.ts`、`server/routers.ts` | README API 表 | 已核對 |
| 測試涵蓋範圍 | `server/*.test.ts` | README 測試段落 | 已核對 |

## API 與金鑰核對

每一個外部 API 都必須標示「已整合」或「尚未接入」，並確認秘密值不出現在前端程式、Markdown 文件、Git commit、測試 fixture 或公開 Excel。Google Opal 的 mini-app 分享／託管能力，必須與 Google Gemini API key 分開描述；若未實際接入 Gemini API，不得在文件中寫成已使用 Gemini。

## xlsx 匯入核對

目前畫面匯入流程會讀取檔案、尋找名稱包含 `KB`、`知識` 或 `Knowledge` 的工作表，並將該工作表的 rows 設為目前知識庫。欄位字典、Conversation States、Decision Rules 與 Prototype Scenarios 目前由預先轉換的結構化資料提供，不應在文件中宣稱畫面匯入按鈕已同步更新全部工作表。若未來擴充完整工作簿匯入，必須同時更新此清單、README、TECHNICAL_OVERVIEW 與對應測試。

## 發佈前命令

```bash
pnpm test
pnpm check
pnpm build
```

上述命令通過後，還需要人工確認文件中的「目前狀態」與實作一致，再保存 checkpoint。
