# CareerDNA 專案現況與未來開發路線圖 (Project Status & Roadmap)

**最後更新時間**：2026-09-29  
**專案名稱**：CareerDNA - 靜宜大學基於 UCAN 數據驅動之多智能體職涯導航與 RAG 知識庫系統  
**後端伺服器**：`http://localhost:3001` (Node.js Express + MongoDB Atlas + Multi-Agent RAG Engine)  
**國際化支援**：繁體中文 (Traditional Chinese, zh-TW) & 英文 (English, en)

---

## 🎯 一、 核心轉型定位 (Core Pivot & System Architecture)

本專案已全面升級為**「UCAN 數據驅動 + 校級真實課綱 RAG 檢索 + 多智能體安全問答」**之旗艦架構：
1. **真實課綱接地 (Ground Truth Curriculum)**：直接對接靜宜大學（Providence University）資訊學院三科系（資工系 CS、資管系 IM、人工智慧應用學系 AI）完整 270 門正式課綱。
2. **企業級 RAG 向量知識庫 (MongoDB Atlas Vector Search)**：
   - 採用 OpenAI 標準 1536 維度向量嵌入模型（`text-embedding-3-small`）。
   - 具備**結構化元數據（Course-Aware Metadata Extraction）**與**混合搜尋（Hybrid Search）**，杜絕代號混淆與幻覺。
3. **嚴格多租戶與資料隔離安全 (Multi-Tenant Zero-Leakage Architecture)**：
   - 公用知識庫（`scope: 'public'`）開放給全校學生與訪客查閱課綱與平台指南。
   - 用戶個人機密資料（`scope: 'user'`，測驗成績、歷史履歷、個人檔案）透過專屬 Session 與 Tool Calling 動態呼叫，徹底阻絕跨用戶數據洩漏。

---

## 📊 二、 目前已完成里程碑 (Completed Milestones)

### 1. 學校完整課綱資料庫 (100% 爬取入庫)
透過專屬無頭瀏覽器自動化爬蟲腳本，已全數擷取 115-1 學期資訊學院三科系之完整課綱與指標：
- 📄 [`pu_courses_AI_v5.md`](file:///j:/ThoBeo/finale/pu_courses_AI_v5.md) - **人工智慧學系**（76 門課程，125 個結構化切片）
- 📄 [`pu_courses_CS_v5.md`](file:///j:/ThoBeo/finale/pu_courses_CS_v5.md) - **資訊工程學系**（90 門課程，148 個結構化切片）
- 📄 [`pu_courses_IM_v5.md`](file:///j:/ThoBeo/finale/pu_courses_IM_v5.md) - **資訊管理學系**（104 門課程，163 個結構化切片）
- **官方手冊**：`CareerDNA 平台使用手冊與知識庫`（雙語官方指南）

### 2. Course-Aware 課綱智能分塊與元數據抽取引擎
在 [`src/services/ingestionService.js`](file:///j:/ThoBeo/finale/src/services/ingestionService.js) 中實作高精度分塊：
- 自動識別課程主體結構，完整保留選課代號、授課教師、上課班級、時間地點、修別、核心教科書目與評分比重於同一實體切片中，避免傳統字數硬切（Naive Chunking）導致書籍或教師資訊斷裂。
- 自動建立 MongoDB Atlas 索引欄位：
  - `courseCode`: 4 位數選課代號（如 `1776`、`1711`）
  - `courseName`: 課程名稱（如 `網頁前端程式設計`）
  - `instructor`: 授課教師姓名（如 `王岱伊`、`謝孟諺`）
  - `department`: 開課系所（`AI`、`CS`、`IM`）
  - `classGrade`: 上課班級（如 `人工智慧二A`、`資工二A`）
  - `scheduleLocation`: 時間地點（如 `四 1, 2, 3: 主顧322`）

### 3. 高精度混合搜尋引擎 (Hybrid Search Engine)
在 [`src/services/ragSearchService.js`](file:///j:/ThoBeo/finale/src/services/ragSearchService.js) 中結合三重檢索與評分融合：
- **路徑 A（精準稀疏代號匹配 Sparse Code Match）**：針對查詢中出現的選課代號（如 `1776`）執行 MongoDB 直接查詢，符合者給予最高權重（Score 1.0~1.3）並**置頂至 Rank #1**。
- **路徑 B（精準片語/系所過濾 Phrase & Dept Match）**：自動辨識引號關鍵字、系所意圖（AI / CS / IM），自動給予該系所切片相關性加權。
- **路徑 C（密集語意向量搜尋 Dense Vector Search）**：透過 MongoDB Atlas `$vectorSearch` 進行 1536 維度餘弦相似度檢索（`numCandidates: 100`，`limit: 10~14`）。
- **評分融合（Rank Fusion & Deduplication）**：整合各路徑候選切片並依權重降序排序，確保 Top 6~7 個切片完整覆蓋關鍵答案。
- **嚴格防幻覺提示詞 (Anti-Hallucination Guidelines)**：指示 LLM 必須忠實呈現上下文中的選課代號與系所，嚴禁擅自斷定用戶記錯代號。

### 4. 浮動式 AI 智能對話助手 (Global Floating Chat Widget)
在 [`static/chat-widget.js`](file:///j:/ThoBeo/finale/static/chat-widget.js) 中提供全站懸浮對話視窗：
- **視窗互動**：支援滑鼠自由縮放大小（Draggable Resizing）與一鍵最大化/還原（Maximize/Restore）。
- **打字機平滑串流 (Typewriter Streaming)**：自然平滑逐字輸出 AI 回覆。
- **上下文防漂移機制 (Session Context Limit)**：
  - 上限設定為 16 則訊息（約 8 輪對話）。
  - 視窗頂部即時顯示對話計數徽章（如 `1/16`、`16/16`）。
  - 達到上限時自動呈現提示橫幅，引導點擊「開啟新對話 (New Chat)」按鈕，保障模型最佳注意力。
- **豐富排版支援**：完整支援 Markdown 表格、清單、粗體、行內程式碼與文檔引用來源標籤（`📚 參考來源` / `📚 Sources`）。

### 5. 管理後台專屬 RAG 知識庫控制面板 (Admin RAG Tab)
在 [`admin.html`](file:///j:/ThoBeo/finale/admin.html) 與 [`static/admin/components/TabRag.js`](file:///j:/ThoBeo/finale/static/admin/components/TabRag.js) 中建置專屬管理介面：
- **HUD 監控面板**：即時顯示知識庫文檔總數、切片總數、向量維度（1536 D）與 Embedding 模型名稱。
- **雙模式匯入精靈**：支援純文字/FAQ 即時貼上匯入，以及 `.md` / `.txt` / `.json` 文件檔案上傳。
- **即時檢索測試沙盒 (Test Search Modal)**：輸入任意提問即可即時檢視命中切片之分數與匹配途徑。
- **文檔生命週期管理**：支援即時搜尋過濾、詳細資訊檢視與聯動刪除 Atlas 向量切片。

### 6. 全面雙語國際化 (Full Bilingual i18n Standardization)
全系統徹底消除非目標語系，全面實現**繁體中文（zh-TW）與英文（en）雙語標準化**：
- **i18n 引擎 ([`static/admin/i18n.js`](file:///j:/ThoBeo/finale/static/admin/i18n.js))**：擴充完整 `rag.*` 雙語鍵值，管理端可無縫切換。
- **Chat Widget 介面與快捷問答**：根據語系自動適配提示詞與系統橫幅。
- **後端 REST API 訊息**：所有 `/api/rag/*` 回應訊息皆標準化為中英雙語輸出。

### 7. 後台導覽側欄 UI/UX 與視覺色彩全面統一 (Admin Sidebar Optimization)
在 [`static/admin/components/Sidebar.js`](file:///j:/ThoBeo/finale/static/admin/components/Sidebar.js) 中完成導覽體驗精緻化：
- **寬度與字距舒適升級**：側邊欄由預設 `w-64` (256px) 拓寬至 `md:w-72 lg:w-80` (288px ~ 320px)，按鈕內距升級為 `px-3.5 md:px-4 py-2.5 md:py-3`，解決 `CLOUDFLARE R2 STORAGE` 與 `RAG KNOWLEDGE BASE` 等長字串緊繃擠壓的問題。
- **色彩 100% 協調一致**：移除 RAG 腦部圖標之綠色樣式 (`text-emerald-600`) 與 R2 橙色標籤，全數統一為標準 Cyber-Brutalist Klein Blue (`bg-klein/10 text-klein` 標籤邊框與階層式圖標)，確保 8 大管理模組色彩一致、層次分明。

### 8. 多用戶會話隔離與跨帳號防洩漏架構 (Multi-User Chat Isolation & Anti-Leak Protection)
徹底解決使用者切換帳號或登出時對話歷史外洩與身分混淆問題：
- **前端 UID 動態會話儲存**：在 [`static/chat-widget.js`](file:///j:/ThoBeo/finale/static/chat-widget.js) 中將歷史儲存鍵動態綁定用戶 UID（`cdna_chat_history_v3_${uid}`）。
- **登入/登出全域廣播聯動**：在 [`static/db-client.js`](file:///j:/ThoBeo/finale/static/db-client.js) 的 `setCurrentUser` 與 `logout` 中發送 `cdna:auth-changed` 事件，Widget 自動重整對話上下文，杜絕前一帳號私密諮詢資料留存。
- **後端身分強一致性驗證**：在 [`src/services/ragChatService.js`](file:///j:/ThoBeo/finale/src/services/ragChatService.js) 中依據驗證之 `userId` 自 MongoDB 直讀真實用戶檔案注入 System Prompt，並設定嚴格身分隔離規則，防止 LLM 被舊對話歷史牽引產生身分幻覺。

---

## 📁 三、 核心檔案結構對照 (System Architecture Map)

```text
finale/
├── index.html                      # 專案首頁入口
├── admin.html                      # 系統管理後台控制台 (含 RAG 知識庫管理 Tab)
├── brand_test.html                 # [核心] UCAN 上傳/填寫 + 個人品牌定位 + 紅綠燈儀表板
├── career_fit.html                 # [核心] AI 履歷健檢 + 真實課綱選課推薦
├── lab_recommendation.html         # 輔助：科系與研究室適配導覽
├── profile.html                    # 個人檔案中心與歷程紀錄
├── resource_library.html           # 學習資源庫與技能樹地圖
│
├── pu_courses_IM_v5.md             # [資料庫] 資管系 104 門課綱全文
├── pu_courses_CS_v5.md             # [資料庫] 資工系 90 門課綱全文
├── pu_courses_AI_v5.md             # [資料庫] 人工智慧系 76 門課綱全文
│
├── static/                         # 前端共用組件與腳本庫
│   ├── chat-widget.js              # [核心] 全站懸浮 AI 對話助手 (串流、縮放、上下文限制、中英雙語)
│   └── admin/                      # 管理後台前端模組
│       ├── i18n.js                 # [核心] 完整繁中/英文 i18n 翻譯字典
│       ├── admin-core.js           # 管理後台主應用程式控制核心
│       └── components/             # 管理模組組件
│           ├── Sidebar.js          # 後台側邊導覽列 (含 RAG 知識庫捷徑)
│           └── TabRag.js           # [核心] RAG 知識庫管理介面 (上傳、統計、檢索測試、刪除)
│
└── src/                            # 後端核心架構 (Node.js Express + MongoDB)
    ├── index.js                    # 後端服務主入口 (Port 3001)
    ├── config/                     # 系統設定
    │   └── index.js                # 全域配置與環境變數定義
    ├── db/                         # 資料庫連線與模型
    │   ├── connection.js           # MongoDB Atlas 連線模組
    │   ├── models/
    │   │   ├── User.js             # 用戶帳號模型
    │   │   └── KnowledgeChunk.js   # [核心] 1536-D 向量切片模型 (具備課程元數據與複合索引)
    │   └── seed.js                 # 資料庫種子初始化
    ├── services/                   # 業務邏輯服務層
    │   ├── embeddingService.js     # [核心] 批次 Vector Embedding 生成服務 (ShopAIKey)
    │   ├── ingestionService.js     # [核心] Course-Aware 課綱解析與切片儲存服務
    │   ├── ragSearchService.js     # [核心] 混合搜尋引擎 (代號精確比對 + 向量相似度 + 評分融合)
    │   ├── ragChatService.js       # [核心] RAG 對話編排與防幻覺提示詞服務
    │   └── toolCallingService.js   # [核心] 用戶私有資料查詢工具 (Zero-Leakage 安全隔離)
    ├── routes/                     # RESTful API 路由層
    │   ├── apiRoutes.js            # 用戶與測驗認證 API
    │   ├── adminRoutes.js          # 後台管理維護 API
    │   └── ragChatRoutes.js        # [核心] RAG 對話、向量檢索、文檔上傳管理 API
    └── scripts/                    # 離線維護工具腳本
        ├── reingest_courses.js     # 課綱全文批次向量化入庫腳本
        └── update_official_guide.js# 官方手冊向量化更新腳本
```

---

## 🚀 四、 下一步開發路線圖 (Next Steps & Roadmap)

1. **UCAN 能力診斷與 RAG 課綱推薦深度聯動**：
   - 結合 `brand_test.html` 解析之 UCAN PR 值，動態偵測學生弱項職能。
   - 呼叫 RAG Hybrid Search 自動比對課綱中之「能力指標與權重（A~M 指標 %）」，自動生成階梯式補強修課推薦。
2. **多輪對話記憶優化**：
   - 持續精進短期與長期上下文記憶策略，支援跨頁面延續問題解答。
3. **學生選課模擬日程表**：
   - 基於已入庫之時間地點（時間地點格式如 `四 1, 2, 3: 主顧322`），為學生自動產生不衝堂的學期課表排程預覽。
