# Project TODO

- [x] 建立優雅、精緻、繁體中文優先的客服工作台與對話視窗
- [x] 支援客戶連續輸入多個問題並清楚呈現可捲動對話歷史
- [x] 解析 Excel（.xlsx）中的欄位字典、FAQ／問答內容與 rules
- [x] 將 Excel 資料轉為可檢索的結構化知識與規則模型
- [x] 實作以檢索結果、意圖辨識、對話摘要與當前脈絡為基礎的回答流程
- [x] 所有對客回答強制使用繁體中文
- [x] 在生成回答前套用 rules、客戶條件與必要欄位檢查
- [x] 資訊不足時僅補問一個明確且最必要的問題
- [x] 避免臆測 Excel 知識庫不存在的答案，清楚顯示無法確認狀態
- [x] 顯示回答依據、信心狀態與建議下一步
- [x] 支援低信心、規則衝突與客戶要求時建立人工轉接／工單紀錄
- [x] 工單包含對話摘要、已知欄位、缺少欄位與轉接原因
- [x] 提供多問題、追問、資料缺漏、規則衝突與無法回答的原型測試情境
- [x] 提供管理者檢視改善重點的介面
- [x] 撰寫並執行 Vitest 測試，覆蓋規則比對、檢索、補問、信心與人工轉接流程
- [x] 進行桌面與手機版視覺驗證、TypeScript 檢查與正式建置
- [x] 建立最終 checkpoint 並交付可預覽版本

- [x] 實作可驗證的 rules／customer-condition 前置判斷層，匯入新 xlsx 時同步更新 rules 與欄位字典
- [x] 加入規則衝突偵測與「客戶要求人工」觸發條件
- [x] 在工單預覽中顯示缺少欄位清單
- [x] 補齊管理者檢視介面，呈現測試案例結果、失敗原因與改善重點
- [x] 修正 Vitest 設定，確保 supportEngine 測試實際執行並補測規則／信心／轉接
- [x] 補做手機版截圖驗證並執行 pnpm build

- [x] 修正跨意圖對話脈絡污染：新問題「粉絲團被封鎖」不可沿用上一題付款意圖
- [x] 讓當前訊息意圖權重高於舊對話，僅保留必要的客戶欄位與摘要脈絡
- [x] 新增付款問題切換至粉絲團封鎖的跨意圖回歸測試
- [x] 驗證新問題的回答依據、信心狀態、補問欄位與人工轉接路由

- [x] 實作跨意圖欄位保留策略：新意圖出現時清除不相關欄位，只保留可跨意圖共用的客戶資訊
- [x] 定義跨意圖摘要策略：新主題出現時重建摘要，避免舊付款脈絡污染新問題
- [x] 補測粉絲團封鎖切換後的 matched KB、source、confidence、缺少欄位、補問內容與 handoff route

- [x] 盤點客服智能工作臺目前已使用的主要功能與技術
- [x] 整理主要功能、續項功能、使用技術與運用 API 對照表
- [x] 說明 Excel、RAG、Rules、LLM、對話脈絡與人工轉接的技術流程
- [x] 建立 Opal／Google 金鑰、環境變數與安全使用說明
- [x] 建立 Repository 使用說明與 GitHub 匯出前檢查清單
- [x] 更新專案 README.md，加入安裝、開發、測試、建置與整合文件
- [x] 建立 index 導覽文件，方便非工程使用者理解系統架構與操作方式
- [x] 驗證文件內容與目前程式實作一致，並通過既有測試

- [x] 修正文檔：明確區分目前匯入按鈕只載入 KB 工作表與內建結構化資料的完整範圍
- [x] 補上文件一致性檢查清單，驗證匯入流程與 README／技術總覽描述一致

- [x] 加入品牌語氣設定 demo：專業、親切、精簡三種風格
- [x] 加入多語言回答 demo：繁體中文、English、日本語
- [x] 同一問題切換語氣／語言時保留相同意圖、來源、Rules 與信心
- [x] 顯示 AI 身份透明提示與可轉人工入口
- [x] 新增品牌語氣與多語言 demo 的 Vitest 測試
- [x] 驗證桌面／手機版 demo 並建立新的 checkpoint

- [x] 修正手機版隱藏語氣／多語言 Demo 入口，確保窄螢幕也能開啟示範

- [x] 將語氣／語言 demo 改為讀取實際案件 state，顯示 live intent、source、rules 與 confidence
- [x] 在 demo 視窗加入可操作的轉人工入口，沿用既有工單預覽流程
- [x] 補測 demo 切換語氣／語言不改變案件判斷欄位
- [x] 拍攝已開啟 demo 視窗的桌面與手機版畫面並建立新 checkpoint

- [x] 新增 demo view model，讓語氣／語言切換共用同一筆 live case state
- [x] 補測所有語氣／語言切換後 intent、source、rules、confidence、route 與缺漏欄位不變
- [x] 支援以 demo query 開啟 modal，並拍攝已開啟 demo 的桌面與手機版畫面
- [x] 保存本次 demo 修正版 checkpoint

- [x] 針對 getDemoViewModel 遍歷所有語言／語氣組合，斷言案件欄位完全不變
- [x] 完成包含 live state、demo query 與人工轉接入口的最新 checkpoint

- [x] 重現今天跳針案例並記錄完整多輪輸入、回覆與案件 state
- [x] 比較目前版本與昨日 checkpoint 的模型路由、fallback、檢索與上下文組裝差異
- [x] 檢查 Demo 固定案件內容是否污染實際客服對話 state
- [x] 修正新問題意圖優先與多輪上下文切換，避免舊答案重複輸出
- [x] 新增昨天式多輪對話回歸測試，覆蓋付款後切換粉絲團封鎖等情境
- [x] 執行測試、型別檢查、建置與預覽驗證後建立修正版 checkpoint

- [x] 對本輪修正執行付款／付款失敗後切換新主題的預覽回歸驗證
- [x] 保存包含最新意圖優先與客服歷史過濾修正的新 checkpoint

- [x] 新增可重現的 `switchScenario` 預覽情境，展示付款後切換粉絲團封鎖的實際對話與新 state
- [x] 以 switchScenario 預覽截圖驗證回答、intent、source 與 confidence 不再沿用付款案件
- [x] 保存包含本輪跳針修正與預覽情境的新 checkpoint

- [x] 保存 switchScenario 截圖驗證摘要：明確記錄畫面為 Ad Account Disabled、A01、98／100、F16／F09／F10
- [x] 建立包含 switchScenario 預覽情境的最新 checkpoint

- [x] 將 switchScenario 驗證結果寫入可檢查文件或 checkpoint 描述
- [x] 重新保存包含 switchScenario 預覽情境與最新跳針修正的 checkpoint

- [x] 定義平均首次回應時間、人工轉接率與案件解決率的計算公式與資料欄位
- [x] 建立可重算的 KPI 指標模組，區分展示資料與正式持久化資料
- [x] 在儀表板加入三項 KPI 卡片、趨勢／狀態說明與案件樣本摘要
- [x] 讓管理者可切換今日、近 7 日與目前案件範圍
- [x] 補寫 KPI 計算與邊界條件的 Vitest 測試
- [x] 驗證儀表板桌面／手機版版面、測試與正式建置
- [x] 建立 KPI 儀表板 checkpoint

- [x] 支援以 `?dashboard=1` 直接開啟客服營運儀表板
- [x] 擷取桌面與手機版 KPI 儀表板畫面並驗證三項指標可讀性

- [x] 補上 KPI 趨勢資訊與案件樣本摘要區塊，並加入對應測試
- [x] 將目前案件範圍改為讀取客服對話的實際 state
- [x] 寫入桌面／手機版 KPI 儀表板視覺驗證紀錄
- [x] 保存 KPI 儀表板修改後的新 checkpoint

- [x] 補測 rateDelta／secondsDelta 趨勢計算與 current live state 的 handoff／resolution 摘要
- [x] 保存明確包含 KPI 儀表板、趨勢、案件摘要、dashboard query 與驗證文件的新 checkpoint

- [x] 抽出 current KPI case mapping 函式，直接測試 needsHuman／resolutionType 到 handoff／resolved 的映射
- [x] 保存包含完整 KPI 儀表板與 current mapping 測試的新 checkpoint

- [x] 保存新的 checkpoint，明確包含 KPI 儀表板、dashboard query、趨勢、案件摘要、toCurrentCaseMetric 與驗證文件

- [x] 定義正式對話、訊息、工單、回覆與結案資料模型
- [x] 以資料庫持久化真實客服對話與 AI／真人回覆時間
- [x] 建立案件建立、人工轉接、狀態更新與結案的伺服器端 API
- [x] 建立由資料庫計算平均首次回應時間、人工轉接率與案件解決率的 KPI API
- [x] 移除營運儀表板對 demoCaseMetrics 的依賴，改讀取正式 KPI 資料
- [x] 加入管理者權限與空資料／資料不足狀態
- [x] 補寫正式資料流程、KPI 聚合與權限的 Vitest 測試
- [x] 驗證真實客服流程、儀表板、TypeScript、建置與部署前 checkpoint

- [x] 建立正式 conversation、message、ticket、ticket_event 與 reply timing 資料模型
- [x] 真實保存客戶訊息、AI 回覆、客服回覆、來源通路與時間戳
- [x] 建立建立工單、查詢工單列表、查看工單詳細內容與更新工單狀態 API
- [x] 將「開啟人工轉接工單」改為真正寫入資料庫而非僅顯示提示
- [x] 在客服介面加入工單佇列與工單詳細檢視
- [x] 改善 AI 多輪對話：當前問題優先、只保留相關上下文、避免重複與跳針
- [x] 改善繁體中文客服語氣、回答結構、同理與下一步引導
- [x] 對 AI 回答加入知識依據、信心、Rules 與上下文一致性攔截
- [x] 將 KPI 儀表板改為讀取正式資料庫聚合，不再依賴 demoCaseMetrics
- [x] 加入正式資料流程、工單 API、AI 回答與權限的 Vitest 測試
- [x] 執行 schema migration、測試、建置、桌面／手機版驗證並建立正式 checkpoint

- [x] 更新 README 與技術總覽，明確說明正式資料庫工單與 KPI API 的使用方式及權限
- [x] 加入正式資料流程、工單 API、AI 回答與權限的錯誤狀態測試說明
- [x] 以預覽驗證正式工單中心與資料庫 KPI 空資料狀態
- [x] 建立正式化版本 checkpoint，並明確標示仍需設定管理者帳號與外部通路 API

- [x] 加入正式 recordMessage API，讓 LLM 暫時失敗時的規則 fallback 回覆仍保存到案件
- [x] 在前端明確提示目前回覆是否已寫入正式案件，避免靜默退回本地模式

- [x] 支援以 `?tickets=1` 直接開啟正式工單中心，方便管理者驗證
- [x] 補拍正式客服工作臺與工單中心畫面，確認空資料狀態與權限提示清楚
- [x] 更新 docs/index.md，加入正式資料庫與工單中心閱讀入口

- [x] 新增並執行 supportDb／support API／KPI／權限相關 Vitest，讓正式資料流程有可驗證測試
- [x] 補上真人客服回覆流程，讓 agent 訊息能透過 UI 或明確 API 寫入資料庫
- [x] 修正來源通路資料，避免 UI 顯示 LINE 但資料庫固定寫 web
- [x] 實作可檢查的前端權限提示與工單／KPI 空資料提示
- [x] 加入 deterministic 的回答一致性與 guardrail 攔截，不只依賴 LLM prompt
- [x] 建立正式化 checkpoint 並在 checkpoint 前完成所有測試與視覺驗證

- [x] 新增 supportDb 與正式工單／KPI tRPC API 的直接測試，覆蓋 createConversation、createTicket、agentReply、kpi 聚合與錯誤分支
- [x] 在 KPI 儀表板加入可檢查的非 admin 權限提示與「目前尚無案件資料」空資料提示
- [x] 保存包含真人客服回覆、通路來源、deterministic guardrail、權限／空狀態修補的新 checkpoint

- [x] 新增正式客服 API contract 測試，直接覆蓋 createConversation、createTicket、agentReply、updateTicketStatus、kpi 的成功與錯誤分支
- [x] 若無法在測試環境執行真 DB，抽出 service／pure function 或 mock caller 驗證 API 契約
- [x] 保存明確包含真人客服回覆、來源通路、deterministic guardrail、KPI 權限／空資料提示的新 checkpoint

- [x] 保存新的 checkpoint，明確包含真人客服回覆、來源通路選擇、deterministic guardrail、KPI 權限／空資料提示與最新 API contract 測試

- [x] 確認目前專案擁有者帳號與 users.role
- [x] 將專案擁有者帳號設定為 admin
- [x] 驗證管理者可使用工單、KPI 與帳號管理權限

- [x] 實作管理者／客服人員帳號管理 API 與介面，支援帳號列表、角色切換與啟用／停用權限
- [x] 新增 admin 帳號管理權限測試，覆蓋 admin 可存取、一般使用者被拒絕、角色更新成功與錯誤分支
- [x] 以管理者身份預覽驗證工單、KPI 與帳號管理三者皆可開啟與操作
- [x] 保存包含帳號管理功能的新 checkpoint

- [x] 讓 KPI 案件樣本摘要每筆都可點選，透過正式 ticketDetail／conversation 詳情查詢載入內容
- [x] 建立儀表板案件詳細視窗，顯示客戶問題、完整對話、工單、來源、信心、Rules、欄位與事件
- [x] 支援從案件詳細視窗進行真人客服回覆與工單狀態更新
- [x] 加入案件詳細查詢的管理者權限、找不到案件與空資料處理
- [x] 補寫案件詳情 API／互動測試並驗證桌面與手機版
- [x] 保存可查看儀表板案件內容的新 checkpoint

- [x] 新增 users.active 持久化欄位，支援管理者啟用／停用帳號
- [x] 建立 admin 帳號列表與角色／狀態更新 API
- [x] 在前端加入帳號管理介面，支援角色切換與啟用／停用
- [x] 補寫帳號管理 API 權限與錯誤分支測試
- [x] 完成案件詳情與帳號管理的桌面／手機版視覺驗證
- [x] 保存包含案件詳情與帳號管理的新 checkpoint

- [x] 讓 KPI 案件樣本摘要帶出 conversation、ticket、通路與摘要欄位
- [x] 新增 admin conversationDetail 查詢與案件完整內容 modal
- [x] 從案件詳情導向既有工單中心，重用真人回覆與狀態更新流程
- [x] 補上案件詳情查詢的 TypeScript 契約與空資料處理

- [x] 以管理者身份實際預覽並截圖工單中心、KPI 儀表板與帳號管理 modal，記錄三者可開啟與操作
- [x] 在案件詳細視窗補上 source、confidence、Rules 與欄位資訊；未持久化項目需明確標示
- [x] 在案件詳細視窗內直接提供真人客服回覆與工單狀態更新控制
- [x] 補寫 KPI 案件樣本點擊開啟詳情的互動測試，並補拍桌面／手機版案件詳細視窗畫面
- [x] 完成上述驗證後再建立並保存新的 checkpoint

- [x] 評估 GitHub Pages 顯示與 Manus 正式部署一致前端的可行性與限制
- [x] 建立 GitHub Pages 專用 production build／部署流程，正確處理 base path
- [x] 確認 GitHub Pages 前端可安全連接 Manus 正式 API，且不暴露 secrets
- [x] 驗證 GitHub Pages 預覽畫面與正式部署畫面一致
- [x] 更新 README 說明 GitHub Pages、Manus backend 與自訂網域的使用方式
- [x] 保存 GitHub Pages 同步版本 checkpoint

- [x] 讓 GitHub Pages 的登入操作安全導向 Manus 正式網域，避免不存在的 GitHub Pages OAuth callback
- [x] 補做 GitHub Pages 公開 API 跨網域驗證，確認 conversation／ticket 公開流程可用
- [x] 補充自訂網域應綁定 Manus 或 GitHub Pages 的具體設定說明
