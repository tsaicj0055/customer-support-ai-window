# Switch Scenario 預覽驗證紀錄

## 驗證目的

確認客服工作臺在「付款失敗」之後切換至「粉絲團被封鎖」時，當前案件會重新判斷，不再沿用上一題付款案件的回答、意圖或欄位。

## 預覽入口

`/?switchScenario=1`

## 已確認的畫面結果

| 檢查項目 | 預覽畫面結果 |
|---|---|
| 歷史對話 | 先顯示「我的信用卡付款失敗」，再顯示「我的粉絲團被封鎖了，請問要怎麼辦？」 |
| Current Category | 帳號 / Account |
| Current Intent | Ad Account Disabled |
| Resolution | NEED_TICKET |
| Confidence | 98 / 100 |
| Source | A01 · Ad Account Disabled；Meta Business Help Center |
| 缺少欄位 | F16 Restriction / Disabled Message、F09 Screenshot、F10 Issue Start Time |
| 舊付款欄位 | F11 付款方式未出現在粉絲團案件的待補欄位中 |
| 下一步 | 收集粉絲團限制／停用訊息，再由人工案件流程接續處理 |

## 結論

預覽畫面中的最新案件已由付款意圖切換為粉絲團停用／限制案件。畫面仍保留付款對話作為歷史紀錄，但右側即時決策脈絡已使用新案件的 A01、Ad Account Disabled、98／100 與 F16／F09／F10 判斷結果。
