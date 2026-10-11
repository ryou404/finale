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
- **Holland RIASEC 測驗**：透過 30 題實力與特質問答，分析個人的 Holland 職業興趣代碼（如 R、I、A、S、E、C）。
- **UCAN 官方報告匯入**：支援直接輸入教育部 UCAN 測驗結果（如 RIA, IAE 等）進行資料整合。

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

