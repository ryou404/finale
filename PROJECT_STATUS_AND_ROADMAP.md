# CareerDNA 專案現況與未來開發路線圖 (Project Status & Roadmap)

**最後更新時間**：2026-09-29  
**專案名稱**：CareerDNA - 基於 UCAN 數據驅動之多智能體履歷與選課導航系統  
**預覽伺服器**：`http://localhost:3000`

---

## 🎯 一、 核心轉型定位 (Core Pivot)

本專案已從早期的「自創 AI 題目測驗」全面升級為**「基於 UCAN 真實測驗數據驅動」**：
1. **客觀信度**：直接採用靜宜大學大一新生必測之 **教育部 UCAN 平台診斷數據**（6 大職業性格、8 大共通職能、資訊專業職能 PR 值）。
2. **依序修課**：摒棄憑空捏造的選課推薦，改為對接校內真實課綱的能力指標，為大一、大二學生規劃階梯式修課路徑。

---

## 📊 二、 目前已完成進度 (Current Progress)

### 1. 學校完整課綱資料庫 (100% 爬取完成)
透過專屬無頭瀏覽器（Puppeteer）自動化腳本，已全數擷取 115-1 學期資訊學院三科系之完整課綱與評分標準：
* 📄 [`pu_courses_IM_v5.md`](file:///c:/Users/User/OneDrive/文件/桌面/the finale project/pu_courses_IM_v5.md) - **資訊管理學系**（104 門課程）
* 📄 [`pu_courses_CS_v5.md`](file:///c:/Users/User/OneDrive/文件/桌面/the finale project/pu_courses_CS_v5.md) - **資訊工程學系**（90 門課程）
* 📄 [`pu_courses_AI_v5.md`](file:///c:/Users/User/OneDrive/文件/桌面/the finale project/pu_courses_AI_v5.md) - **人工智慧學系**（76 門課程）
* **資料深度**：包含課程代號、必選修、學分、課程簡介、教學目標、**學生能力指標與權重（A~M 指標 %）**、18 週進度。

### 2. 前端頁面重構與精簡 (Clean Architecture)
* 🧭 [`brand_test.html`](file:///c:/Users/User/OneDrive/文件/桌面/the finale project/brand_test.html)：
  * 已整合 **UCAN PDF 上傳與自動解析 (pdf.js)**。
  * 具備 **三步驟手動填寫精靈**（防呆備案）。
  * 具備 **紅綠燈優勢能力儀表板**（🟢 PR 67~99 優勢、🟡 PR 34~66 中等、🔴 PR 1~33 待加強）。
* 💼 [`career_fit.html`](file:///c:/Users/User/OneDrive/文件/桌面/the finale project/career_fit.html)：
  * 支援接收 UCAN 測驗 PR 值與上傳舊履歷，進行 AI 履歷改寫與選課推薦。
* 🧹 **程式碼與歷史檔案清理**：已全數移除舊版 `career_fit_v2.html`、`career_fit_v3.html`、`brand_test_v3.html` 以及偵錯腳本/截圖，並校正全站導覽列連結。

---

## 🚀 三、 未來要實作的項目 (Next Steps & Roadmap)

```
[學生上傳 UCAN PDF] 
       │ (解析出 8 大職能 / 專業職能 PR)
       ▼
[紅綠燈儀表板 (brand_test.html)] ──▶ 標記出學生的「弱項指標 (🔴)」
       │
       ▼ (傳遞至 career_fit.html)
[AI 選課推薦引擎 (Agent 4: Gap-Filler)] 
       ▲
       │ (查詢)
[後端真實課程資料庫 (已爬取之 IM/CS/AI 課綱)]
       ▼
[產出：大一、大二階梯式選課補強清單 + 30/60/90 天行動計畫]
```

### 階段 1：後端資料庫串接與資料清洗 (交給後端組員)
* **任務**：將三份 `pu_courses_*_v5.md` 轉成結構化格式（JSON 或入庫至 Firebase Firestore / MongoDB）。
* **重點解析欄位**：
  * `courseCode` (選課代號)
  * `courseName` (課程名稱)
  * `grade` (適合年級：大一 / 大二 / 大三 / 大四)
  * `type` (必修 / 選修)
  * `competencyWeights` (核心能力指標與權重，例如：軟體設計 40%、資料分析 30%)
* **產出 API**：提供依「科系 + 年級 + 目標能力關鍵字」快速篩選課程的查詢介面。

### 階段 2：AI 選課推薦演算法升級 (AI / 邏輯層)
* **修改檔案**：`src/agents/academicGapFillerAgent.js` 與 `src/config.js`。
* **改進點**：
  * **舊版**：Prompt 內硬編碼課程知識，推薦較單一。
  * **新版**：讀取後端真實課程資料庫，比對學生 UCAN 的「待加強能力 (🔴 PR < 34)」，依序推薦大一必修基礎課與大二專業選修課，精準補強短板。

### 階段 3：前後端資料流打通與端到端測試
* 確保從 `brand_test.html` 解析出的 UCAN 數據，能順暢攜帶至 `career_fit.html`。
* 點擊「生成履歷與選課診斷」時，能呼叫後端 Multi-Agent 管道輸出符合真實課綱的完整報告。

---

## 📁 四、 核心檔案結構對照

```text
the finale project/
├── index.html                  # 專案首頁入口
├── brand_test.html             # [核心] UCAN 上傳/填寫 + 個人品牌定位 + 紅綠燈儀表板
├── career_fit.html             # [核心] AI 履歷健檢 + 真實課綱選課推薦
├── lab_recommendation.html     # 輔助：科系與研究室適配
├── profile.html                # 個人檔案中心
├── resource_library.html       # 學習資源庫
│
├── pu_courses_IM_v5.md         # [資料庫] 資管系 104 門詳細課綱
├── pu_courses_CS_v5.md         # [資料庫] 資工系 90 門詳細課綱
├── pu_courses_AI_v5.md         # [資料庫] 人工智慧系 76 門詳細課綱
│
├── src/                        # 後端 Multi-Agent 核心架構
│   ├── index.js                # Express 後端伺服器 (Port 3000)
│   ├── config.js               # Multi-Agent Prompt 與 Schema 定義
│   └── agents/                 # 5 大智能體邏輯
└── scraper.js                  # 靜宜課綱自動化爬蟲 (備用維護工具)
```
