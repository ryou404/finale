# CareerDNA Engine - AI 履歷健檢與職涯導航系統

![CareerDNA](https://img.shields.io/badge/CareerDNA-v2026-002fa7) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Docker](https://img.shields.io/badge/Docker-Ready-blue)

CareerDNA 是一個專為大學生與應屆畢業生設計的 **AI 履歷健檢與職涯導航系統**。結合 Holland 職業興趣測驗、靜宜大學校本位課程資料庫與 LLM 履歷優化技術，協助求職者打造具個人特色且符合業界 ATS (Applicant Tracking System) 標準的專業履歷。

---

## 🌟 核心功能亮點

### 1. 🤖 雙軌制 AI 履歷健檢 (ATS Audit)
- **線上 LLM 模式 (Gemini LLM)**：自動對履歷進行量化程度、完整度與關鍵字匹配度分析，並輸出具體改寫建議。
- **零額度靜態離線模式 (Static Fallback)**：當 API 額度耗盡或離線時，秒速產生符合 **Yourator 與 1111 人力銀行最佳實務** 的專業履歷填空模板。
- **標準經歷改寫框架**：強制要求每一項經歷融入 **Micro-STAR (S-T-A-R)** 及 **Google XYZ 句型** (`Accomplished [X] as measured by [Y], by doing [Z]`)。
- **嚴格反造假/防過度美化機制 (Anti-Embellishment Guardrails)**：指令層級限制 AI 只能重組使用者提供的客觀事實，禁止無中生有或捏造虛假數據，保持求職者的誠懇質樸。

### 2. 🎯 個人品牌與職業興趣測驗 (Personal Brand Test)
- **完全使用 UCAN 官方數據**：不再使用任何自編題目。匯入教育部 UCAN 平台三份診斷報告（職業興趣探索、職場共通職能、專業職能診斷），支援 PDF 上傳或手動輸入；缺少的報告不會補預設值。
- **依「未來目標」產生專屬 30/60/90 天行動計畫**：先由 UCAN 數據推薦 3 個目標職務（也可自選），再依目標、就業途徑與偏低的共通職能產生不同計畫；每個任務都有「成果、時間、完成標準」，並標示來自哪個 UCAN 數字。
- **社群經營策略 + 值得參考的人**：每個職務推薦主要/輔助平台、經營節奏、Bio 草稿，並列出 2–3 位台灣經營者或社群（附可直接點擊的連結與「可以學什麼」）。
- **可解釋、無 AI 幻覺**：規則與內容集中在 `static/brand-knowledge.js`（人工整理）與 `static/brand-engine.js`（可解釋的規則）；報告附「為什麼是這個目標」與名詞小辭典。
- **系所推薦也改用 UCAN 數據** (`lab_recommendation.html`)：依 Holland、職涯類型興趣、專業職能與共通職能推薦資工 / 資管 / 人工智慧系，並列出依據。
- **測試與維護**：`npm run test:brand`（解析器與規則引擎）、`npm run check:links`（檢查人物/平台連結是否仍可開啟）。

### 3. 🔗 測驗與履歷自動閉環整合
- **Holland 個人特質帶入**：系統會將個人的品牌測驗結果（Holland 核心特質）自動注入至履歷生成的**【關於我 (About Me)】**區塊中，讓履歷充滿個人特色與軟實力優勢。

### 4. 🔑 使用者身份驗證
- **Firebase Auth**：整合 Google 帳號快速登入/註冊機制，方便使用者儲存與管理個人評鑑紀錄與履歷資料。

---

## 🛠️ 技術架構

- **前端 Frontend**：HTML5, Tailwind CSS (CDN), FontAwesome 6, Marked.js (Markdown 渲染)
- **後端 Backend**：Node.js 18+, Express.js
- **身份驗證與資料庫 Auth & DB**：Firebase Auth (Google Sign-In), Cloud Firestore
- **AI 引擎 AI Integration**：Gemini API (Interactions Protocol) / Deterministic Fallback Engine
- **容器化部署 Deployment**：Docker, Render Web Service

---

## 🚀 本地開發與部署說明

### 本地啟動 (Local Development)
```bash
# 安裝依賴套件
npm install

# 啟動 Express 伺服器
npm start
```
啟動後瀏覽器開啟 `http://localhost:3000` 即可訪問系統。

### Docker 容器化與 Render 部署
專案根目錄已配置 `Dockerfile` 與 `.dockerignore`，推送至 GitHub 後可直接與 Render 連動進行 Auto-Deploy：
- **Build Command**: `docker build` (或直接使用 Render Docker 預設環境)
- **Port**: `3000`

---

## 📝 最新更新日誌 (Latest Updates)

- **[2026-08-28]**：
  1. 清理頁面裝飾性小字（如 Status/Latency 等），提升 UI 閱讀舒適度。
  2. 恢復 Navbar 上的 Firebase Google 登入/註冊與登出系統。
  3. 升級 Gemini Prompt：融入 Holland 測驗特質至履歷簡介，並加入嚴格防造假與反過度美化限制。
  4. 重構離線模式模板：參考 Yourator/1111 標準，剔除技能能量條，導入 Micro-STAR / Google XYZ 離線填空框架。
  5. 移除 `brand_test.html` 之 AI Copilot 閉環區塊，簡化測驗報告呈現。
  6. 新增專案 `Dockerfile` 確保 Render Docker 部署正常運作。



- **[2026-09-30]**：
  一、 核心轉型定位 (Core Pivot)

本專案已從早期的「自創 AI 題目測驗」全面升級為**「基於 UCAN 真實測驗數據驅動」**：

客觀信度：直接採用靜宜大學大一新生必測之 教育部 UCAN 平台診斷數據（6 大職業性格、8 大共通職能、資訊專業職能 PR 值）。
依序修課：摒棄憑空捏造的選課推薦，改為對接校內真實課綱的能力指標，為大一、大二學生規劃階梯式修課路徑。

- **[2026-11-03] 個人品牌模組改為完整 UCAN 驅動**：
  1. 新增 `static/ucan-parser.js`：解析 3 份 UCAN PDF（含 16 職涯類型、專業職能逐項 PR），不再補任何預設值（舊版 `submitUCAN` 的假分數已移除）。
  2. 新增 `static/brand-knowledge.js` / `static/brand-engine.js`：13 個職務的 30/60/90 天劇本、共通職能補強任務、社群策略與台灣人物連結。
  3. `brand_test.html` 新增「選擇未來目標」步驟與「為什麼推薦」說明；`lab_recommendation.html` 移除 6 題情境題，改用 UCAN 數據。
  4. 修正雲端同步：前端改呼叫 `saveBrandResult / getBrandResult`，後端 `brand_results` 保存 `ucanProfile`、`goalRoleId`。
  5. 新增 `tests/brand/`（22 項測試，使用匿名化的 UCAN 文字範例）與 `scripts/check_links.js`。

- **[2026-10-12] 全站視覺光譜升級、課表互動預覽與體驗優化**：
  1. **🎨 全站視覺色彩系統升級（克萊茵藍同色相清透光譜 Monochromatic Luminous）**：
     - 導入 Impeccable 設計規範，解決原本純雙色（`#002FA7` + `#FFFFFF`）長期觀看易產生視覺單調與疲勞的問題。
     - 採用五階同色相清透光譜：`#002FA7`（國際克萊茵藍主體）、`#1F50CD`（皇家亮藍中繼互動色）、`#1E3A8A`（深群青舒適長文閱讀色）、`#EBF2FF` / `#C7DCFF`（清透冰晶填色與結構線）、以及 `#F8FAFF` 極淨冰白畫布襯托 `#FFFFFF` 純白卡片，兼顧品牌辨識度與極致乾淨度。
  2. **📅 AI 履歷健檢「推薦課程」新增互動預覽與 18 週完整課表彈窗 (`career_fit.html` / `static/course-recommend.js`)**：
     - 推薦課程卡片直接顯示授課教師與上課時間地點。
     - **滑鼠靠近（Hover）**：自動展開該課程的「教學目標摘要、評分比重標籤、前 4 週課綱重點預覽」。
     - **滑鼠點擊（Click）**：跳出完整課表詳細資訊 Modal，內含學分/必選修/上課時段、視覺化評分比重進度條、核心能力指標，以及完整 **18 週課程進度時間軸**。
  3. **⚖️ 個人品牌定位報告排版對稱重構 (`brand_test.html`)**：
     - 將原本左一右四極度不對稱的報告版面，重構為 **左 3 卡（社群經營策略、品牌行動卡片、30/60/90 天成長計畫）× 右 3 卡（Holland 性格維度分析、UCAN 職能紅綠燈、Top 5 天賦優勢）** 的 6:6 雙欄等高對齊版面。
     - 30/60/90 天行動計畫與社群發文靈感支援 Checkbox 勾選完成狀態（自動記憶於 `localStorage`），並支援乾淨的 A4 雙頁 PDF 匯出。
     - 移除導覽列測試用的 `DEMO MODE` 按鈕與首頁 Logo 下方無意義裝飾小字。
  4. **👤 個人檔案精簡與本地端離線登入支援 (`profile.html` / `src/db/offlineAdapter.js`)**：
     - 移除個人檔案頁面多餘的「專屬專業技能與擅長工具」區塊，聚焦於個人學籍資訊、Cloudflare R2 頭像上傳與儲存的履歷紀錄。
     - 新增本地端離線 JSON 資料庫轉接器 (`src/db/offlineAdapter.js`)，當本地開發未連線雲端 MongoDB 時可自動無縫切換，支援本地端直接註冊與登入測試。
  5. **🧹 專案結構整理**：
     - 將散落於根目錄的參考圖片歸檔至 `docs/reference_images/`，課綱轉換腳本移至 `scripts/generate_courses_data.py`，保持專案根目錄整潔。


- **[2026-10-14] 全面去化偽科技裝飾標籤與確立 UI 極簡規範 (/impeccable × /learn)**：
  1. **全站移除無意義裝飾性文字與偽遙測標籤**：
     - `index.html`：徹底清除架構區塊無意義的 `01 / 02 / 03` 序號、英文裝飾標籤（`ATS AUDIT`、`UCAN × HOLLAND`、`CS · IM · AI`）、副標徽章（`三大職涯模組・資料跨頁自動連動`）及底部次級小字（`五元三要評分`、`30/60/90 行動表`、`教授實驗室媒合`），使卡片聚焦核心內容與引導。
     - 全站導覽列（Navbar）：全面移除 Logo 底下的冗餘小字（`BRAND_POSITIONING // v2026`、`RESUME_ANALYSIS // v2026`、`ACADEMIC_LAB // v2026`、`COURSE_LIBRARY // v2026`、`USER_PROFILE // v2026` 等）。
     - 全站頁尾（Footer）與介面彈窗：移除虛構的假遙測（`STATUS: ONLINE`、`LATENCY: <12ms`、`SYS // ...` 假黑客代碼），替換為標準極簡版權宣告。
     - `404.html`：簡化為自然流暢的台灣繁體中文提示，移除偽終端機診斷讀數。
  2. **確立持久化專案設計規範 (`.agent/rules/no-meaningless-decorative-text.md`)**：
     - 正式導入工作區規範，杜絕未來任何代理人或模組擴充時產生 AI 裝飾性廢字、假系統代碼與虛擬遙測，確保全站貫徹克萊茵藍高質感極簡風格。

- **[2026-10-16] 系所推薦頁面去 AI 味與排版互動優化 (/impeccable × /speak-human-tw)**：
  1. **文案去 AI 味與大白話重構**：
     - 首頁 Hero 導言：去除浮誇公關腔（「高辨識度思維情境測評」、「深度拆解你的工程邏輯」、「學術戰場」），改為直接明瞭的「不知道自己適合資工、資管還是人工智慧？只需 2 分鐘回答 6 題情境選擇...」。
     - 三大科系卡片描述：摒棄生硬課綱術語堆疊，改為針對探索期學生的親切對話說明（「資工：專注於軟體開發、硬體整合與系統底層...」、「資管：結合資訊科技與商業思維...」、「AI：專攻機器學習、資料分析與智慧互動...」）。
     - 測驗結果文案：移除「未來的創造者！」與過期熱詞「元宇宙」，還原客觀專業的分析語感。
  2. **介面純淨度與互動體驗升級**：
     - 移除主標題鏤空描邊字（`outline-text`），改用純粹實心克萊茵藍字體。
     - 徹底移除 `CS // TRACK`、`IM // TRACK`、`AI // TRACK`、`ASSESSMENT PROGRESS`、`COMPATIBILITY SPECTRUM //` 等偽科技英文標籤。
     - 卡片互動改用同色相淺藍浮起體驗（`hover:border-klein hover:bg-[#F2F6FF]`），取代原先突兀的全深藍反白，大幅提升視覺舒適度。


- **[2026-11-01] 系統安全性加固、整合職涯頁面與多代理人效能優化**：
  1. **補強系統安全與隱私防護**：
     - 限制靜態檔案讀取權限，直接擋掉 `/src`、`/.env` 等後端程式與設定檔，避免敏感資訊被直接下載。
     - 處理使用者資料時（包含後台查詢與 JSON 轉換），強制拿掉密碼雜湊，防止密碼外洩。
     - 修正課程搜尋與動態清單的輸入文字跳脫，防範正則表達式卡死（ReDoS）與 XSS 攻擊。
     - 修正第三方登入邏輯，避免同信箱的使用者用 Google 登入時不小心蓋掉原本設定的本地密碼。
  2. **頁面整併與清理**：
     - 刪除舊版的 `career_fit_v2.html`，全站統一收斂到正式的 `career_fit.html`。
     - 伺服器補上 301 轉址，舊網址會自動跳轉到新頁面，不影響舊連結。
     - 完整保留繁體中文與越南文（Tiếng Việt）多語系切換功能。
  3. **履歷生成管線除錯與速度優化**：
     - 修復 4 個 Agent（個人資料、履歷生成、ATS 審查、課綱補差）因為漏宣告 `startTime` 變數導致執行噴錯的問題。
     - 將原本排隊執行的「ATS 審查」與「課綱補差」改為同時並行（`Promise.all`），省下不必要的等待時間。
  4. **靜宜課綱與 UCAN 指標對齊**：
     - 整理資管、資工、AI 三個系所的真實課綱，把 A/B 班合併開課的課號整合成一致代碼。
     - 加入 UCAN 8 大職場能力指標（1 到 5 級權重），讓推薦選課能照能力重要性比對。
  5. **資料庫防護與審計紀錄**：
     - 限制每個帳號的履歷歷史紀錄最多存 50 筆，避免資料庫被無限塞爆。
     - 履歷健檢與生成流程補上審計日誌（AuditLog），讓後台可以完整追蹤操作紀錄。
