# CareerDNA - 系統全面升級與功能演進手冊 (System Upgrade & Changelog)

**版本 (Version)**: 2.2.0  
**更新日期 (Date)**: 2026/08/29  
**團隊 (Author)**: CareerDNA 研發工程團隊 (CareerDNA Engineering Team)  

---

## 📑 目錄 (Table of Contents)
1. [系統升級總覽 (System Upgrade Overview)](#1-系統升級總覽-system-upgrade-overview)
2. [核心架構與資料庫設計 (MongoDB Atlas)](#2-核心架構與資料庫設計-mongodb-atlas)
3. [雙層身分驗證與安全機制 (Bcrypt + Email 2FA OTP)](#3-雙層身分驗證與安全機制-bcrypt--email-2fa-otp)
4. [雲端物件儲存整合 (Cloudflare R2 Storage)](#4-雲端物件儲存整合-cloudflare-r2-storage)
5. [AI 履歷生成引擎與 3 款 A4 專業範本 (AI Resume Engine & Templates)](#5-ai-履歷生成引擎與-3-款-a4-專業範本-ai-resume-engine--templates)
6. [個人檔案「AI 履歷典藏庫」與防重機制 (Resume Archive & De-duplication)](#6-個人檔案ai-履歷典藏庫與防重機制-resume-archive--de-duplication)
7. [全站全局 AI 懸浮智能助手 (Global Floating AI Chatbot Assistant)](#7-全站全局-ai-懸浮智能助手-global-floating-ai-chatbot-assistant)
8. [前端介面與行動端響應式優化 (Frontend UI/UX & Responsive)](#8-前端介面與行動端響應式優化-frontend-uiux--responsive)
9. [後端 API 端點完整清單 (Complete API Endpoints)](#9-後端-api-端點完整清單-complete-api-endpoints)
10. [變更檔案總覽清單 (File Structure & Changes Summary)](#10-變更檔案總覽清單-file-structure--changes-summary)
11. [環境配置與啟動指南 (Setup & Deployment Guide)](#11-環境配置與啟動指南-setup--deployment-guide)

---

## 1. 系統升級總覽 (System Upgrade Overview)
**CareerDNA 平台** 歷經全面現代化架構重構，成功從純 Client 端架構遷移至高效穩固的 **Full-Stack Node.js Express + MongoDB Atlas + Cloudflare R2 + Gmail SMTP + DeepSeek AI** 體系：
- **全面語法除錯**：修復全站頁面之 JS/DOM 語法異常，確保前端執行零報錯。
- **資料庫全面遷移**：將用戶檔案、Holland RIASEC 測驗、ATS 履歷健檢與實驗室推薦數據全面集中託管於 **MongoDB Atlas** 雲端叢集。
- **密碼軍規加密**：全面導入 **Bcrypt (Salt rounds = 10)** 雜湊演算法。
- **電子郵件雙因素驗證 (2FA OTP)**：透過 **Gmail SMTP** 實現註冊與忘記密碼 6 碼動態驗證碼機制。
- **高速雲端儲存**：結合 **Cloudflare R2 S3 相容物件儲存**，支援用戶大頭貼與資源附件極速上傳與公開 CDN 串流。
- **AI 履歷真實個資綁定**：嚴格注入用戶真實就讀資訊與技能標籤，杜絕虛構，並提供 **3 款標準 A4 範本** 與向量 PDF 列印。
- **個人檔案履歷典藏庫**：支援過往 AI 生成履歷完整紀錄保存、即時預覽、範本切換重新下載與刪除。
- **全站 AI 智能懸浮助手**：常駐 Cyber-Brutalist 懸浮泡泡，具備打字機動畫、視窗自由拖曳縮放、Markdown 表格自適應排版與繁體中文導覽。

---

## 2. 核心架構與資料庫設計 (MongoDB Atlas)

### 2.1. 連線管理模組 (`src/db/connection.js`)
- 採用 Mongoose 連線至 MongoDB Atlas 雲端 Replica Set，具備斷線自動重連 (`autoReconnect`) 與連線狀態即時監聽。

### 2.2. 資料結構模型 (Collections & Schemas)：
1. **`users` (`src/db/models/User.js`)**：
   - 基本身分：`uid`, `username`, `email`, `password` (Bcrypt 雜湊)。
   - 學歷與個資：`name`, `displayName`, `school`, `department`, `dept`, `grade`, `studentId`, `photoURL`, `skills` (包含等級與熟練度)。
   - 健檢與分析快照：`brand_results`, `resume_data`, `history_brand`, `history_resume` (完整儲存 `cvData`, `templateId`, `metrics`, `actionItems`), `history_lab`。
2. **`otp_tokens` (`src/db/models/OtpToken.js`)**：
   - 包含 `email`, `code`, `type` (`register`, `forgot_password`), `pendingData`。
   - **TTL 自動過期索引**：`createdAt` 設定 **600 秒 (10 分鐘)** 自動物理刪除，確保驗證碼時效安全。
3. **`categories` (`src/db/models/Category.js`)**：
   - 管理學習資源分類與科系標籤關聯。
4. **`professors` (`src/db/models/Professor.js`)**：
   - 靜宜大學資訊學院（資工系、資管系、資傳系、人工智慧學程）教授陣容與專業研究實驗室。
5. **`audit_logs` (`src/db/models/AuditLog.js`)**：
   - 完整記錄系統管理操作、登入日誌與 AI 健檢請求軌跡。

---

## 3. 雙層身分驗證與安全機制 (Bcrypt + Email 2FA OTP)

### 3.1. 郵件發送服務 (`src/services/emailService.js`)
- 採用 Gmail SMTP 協定與 `crypto.randomInt` 生成高強度隨機 6 碼 OTP。
- 自動套用克萊因藍 (Klein Blue) Cyber-Brutalist HTML 郵件版型，清楚提示過期時效與安全警語。

### 3.2. 兩階段註冊流程：
1. **階段一 (發起申請)**：用戶填寫姓名、帳號、Email、密碼、科系與年級 ➔ 後端驗證不重複 ➔ 暫存加密資訊並寄送 OTP 郵件。
2. **階段二 (驗證完成)**：用戶輸入 6 碼 OTP ➔ 後端校驗通過 ➔ 執行 Bcrypt 加密寫入 MongoDB Atlas ➔ 自動發放登入 Session。

### 3.3. 忘記密碼重設流程：
1. 輸入綁定之使用者帳號或 Email。
2. 系統寄送 6 碼重設驗證碼至信箱。
3. 填入驗證碼與新密碼 ➔ 完成更新並即刻生效。

---

## 4. 雲端物件儲存整合 (Cloudflare R2 Storage)

### 4.1. 物件儲存核心服務 (`src/services/r2Service.js`)
- 透過 AWS SDK v3 S3-Client 連接 Cloudflare R2 Bucket (`career`)。
- 設定公開 CDN 網域：`https://pub-a8ce7abf447f4dc8aaa44cce8fbaa433.r2.dev`。
- 自動產生防衝突檔案鍵值：`avatars/{uid}_{timestamp}_{hash}.{ext}`。
- 支援長期快取 Header：`Cache-Control: public, max-age=31536000`。

### 4.2. 大頭貼與多媒體管理 (`profile.html` + `static/db-client.js`)
- 個人檔案頁面支援即時 Hover 互動遮罩與 `FileReader API` 本地毫秒級預覽。
- 透過 `POST /api/users/:uid/avatar` 串流上傳至 R2，限制 5MB 且支援 JPG/PNG/WEBP 等格式。
- 上傳成功後全站 Navbar 即刻同步渲染最新頭像。

---

## 5. AI 履歷生成引擎與 3 款 A4 專業範本 (AI Resume Engine & Templates)

### 5.1. 真實用戶資料綁定與 Prompt 防造假工程
- 在 `career_fit_v2.html` 中自動提取當前登入用戶之真實姓名、學校、科系、年級、自訂專業技能清單與實務修課紀錄。
- 注入 DeepSeek AI Prompt，加入嚴格防護提示詞（禁止編造虛假姓名、經歷與電話），確保生成結果真實可靠。

### 5.2. 3 款標準 A4 履歷範本模組 (`static/cv-templates.js`)
- **經典專業範本 (Classic)**：傳統單欄式排版，標題以克萊因藍深色線條區隔，適合公職、外商與傳統科技業。
- **現代雙欄範本 (Modern)**：左側克萊因藍側邊欄（標記個人資料、技能評級與核心工具），右側呈現經歷與專案。
- **極簡科技範本 (Minimal)**：專為軟體工程師設計，高代碼密度排版與精準邊界，專注展現技術專案。

### 5.3. 深度 Markdown 智慧解析器
- 支援中文方括號標題（如 `【個人簡介】`、`【專案與實務經歷】`）、序號標題（`1. 個人簡介`）及 `##` 標題變體。
- 智慧拆解 **Micro-STAR** (`[Situation]`, `[Action]`, `[Result]`) 與 **Google XYZ** 句型，保證經歷與專案 100% 完整解析不截斷。

### 5.4. PDF 匯出與向量列印修復
- 解決 `html2canvas` 針對滾動容器與絕對定位捕捉導致的「PDF 匯出全白」問題。
- 新增原生「列印 / 向量 PDF」功能（`window.print` 向量渲染），保證列印與 PDF 輸出字體清晰、不失真。

---

## 6. 個人檔案「AI 履歷典藏庫」與防重機制 (Resume Archive & De-duplication)

### 6.1. 典藏庫管理介面 (`profile.html`)
- 在個人檔案頁面中增設專屬「AI 履歷典藏庫」管理區塊，即時呈現所有歷史健檢生成版本。
- 提供單擊開啟 **A4 Fullscreen Preview Modal**，支援在彈窗內即時切換 3 款範本並立即重新下載 PDF。

### 6.2. 15 秒請求防重複儲存機制 (De-duplication)
- 後端 `POST /api/users/:uid/resume` 新增 15 秒內請求防重判斷，若短時間內連續觸發則覆蓋更新最後一筆紀錄，徹底解決重複生成多筆紀錄之問題。
- 支援單筆歷史履歷刪除端點 (`DELETE /api/users/:uid/resume/:resumeId`)。

---

## 7. 全站全局 AI 懸浮智能助手 (Global Floating AI Chatbot Assistant)

### 7.1. 全局懸浮組件 (`static/chat-widget.js`)
- 獨立 IIFE 自封裝組件，自動注入全站所有 7 大主要 HTML 頁面。
- 採用 Cyber-Brutalist 與克萊因藍 HUD 視覺設計，右下角提供脈衝通知圓點。

### 7.2. 打字機漸進輸出 (Typewriter Stream)
- AI 回覆採用流暢打字機效果輸出，游標即時閃爍跟隨，並自動滾動視窗至最新文字。
- 用戶可隨時點擊正在輸出的訊息氣泡，立即結束打字機動畫並展示完整內容。

### 7.3. 自由拖曳縮放與最大化視窗 (Resizable & Maximize)
- **拖曳調整尺寸**：左上角設有專屬調整把手 (`.cdna-resize-handle`)，支援滑鼠按住自由調整寬度與高度，並將偏好尺寸記憶於 `localStorage`。
- **一鍵最大化 / 還原**：頂部工具列設有 `⛶` 按鈕，可將視窗展開至 **820px × 85vh**，寬敞呈現長篇代碼與表格分析。

### 7.4. 自適應 Markdown 表格解析器
- 自動將 Markdown Table 轉換為具備橫向滾動容器 (`.cdna-table-wrapper`) 之標準 HTML 表格，徹底避免欄位過多造成版面破裂。

### 7.5. 專屬知識庫與繁體中文預設 (`/api/ai/chat`)
- 設定 AI 為「CareerDNA AI 智能助手」，全面採用繁體中文（繁體中文），專注於平台功能指引、科系適配與履歷技巧，去除專題與論文等字詞。

---

## 8. 前端介面與行動端響應式優化 (Frontend UI/UX & Responsive)

### 8.1. 導覽列 (Navbar) 排版修復
- 修復 `index.html`、`lab_recommendation.html` 與 `profile.html` 導覽列右側容器缺漏 Flexbox 屬性之問題，確保「立即部署」按鈕與「使用者帳號 / 頭像」維持水平對齊。

### 8.2. 行動端體驗與底部導覽列
- 在手機與小螢幕裝置上將導覽選項整合為底部毛玻璃浮動選單 (`fixed bottom-0`)，並適配 `safe-area-inset-bottom`。
- 全站字體與間距採用響應式階層設計 (`text-[11px] md:text-xs`)。

---

## 9. 後端 API 端點完整清單 (Complete API Endpoints)

| 方法 | 路由端點 (Endpoint) | 功能說明 |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | 使用者帳號/信箱與 Bcrypt 密碼登入 |
| `POST` | `/api/auth/register-request` | 註冊第一階段：檢查資料並發送 6 碼 OTP 郵件 |
| `POST` | `/api/auth/register-verify` | 註冊第二階段：驗證 OTP 並建立正式帳號 |
| `POST` | `/api/auth/forgot-request` | 忘記密碼第一階段：發送重設 OTP 郵件 |
| `POST` | `/api/auth/forgot-verify-reset` | 忘記密碼第二階段：驗證 OTP 並更新密碼 |
| `POST` | `/api/auth/resend-otp` | 重新發送 OTP 郵件 (限制 60 秒冷卻) |
| `GET` | `/api/auth/users-list` | 取得使用者簡要列表供快速切換 |
| `GET` | `/api/users/:uid` | 取得特定用戶完整 Profile 與測驗歷史紀錄 |
| `PUT` | `/api/users/:uid/profile` | 更新用戶個人學籍、科系、年級與技能標籤 |
| `POST` | `/api/users/:uid/avatar` | 上傳用戶大頭貼至 Cloudflare R2 |
| `POST` | `/api/users/:uid/resume` | 儲存 AI 履歷生成快照 (含 15 秒去重) |
| `GET` | `/api/users/:uid/resume` | 取得最新一份履歷健檢分析報告 |
| `DELETE`| `/api/users/:uid/resume/:resumeId` | 刪除典藏庫中特定一筆歷史履歷紀錄 |
| `POST` | `/api/users/:uid/brand` | 儲存 Holland RIASEC 品牌測驗結果 |
| `GET` | `/api/users/:uid/brand` | 取得最新 Holland RIASEC 測驗結果 |
| `POST` | `/api/users/:uid/lab` | 儲存科系適配與實驗室諮詢推薦結果 |
| `POST` | `/api/ai/chat` | 全局 AI 智能助手問答對話 (DeepSeek) |
| `GET` | `/api/professors` | 取得靜宜大學資訊各系所教授與實驗室列表 |
| `GET` | `/api/r2/status` | 檢測 Cloudflare R2 雲端儲存槽連線健康狀態 |
| `GET` | `/api/db/status` | 檢測 MongoDB Atlas 連線健康狀態與紀錄總數 |

---

## 10. 變更檔案總覽清單 (File Structure & Changes Summary)

| 檔案路徑 | 狀態 | 核心變更與模組職責 |
| :--- | :---: | :--- |
| `static/cv-templates.js` | **新增** | 3 款標準 A4 履歷範本渲染、Markdown 智慧解析與 Micro-STAR 結構化工具 |
| `static/chat-widget.js` | **新增** | 全站全局 AI 懸浮聊天元件（打字機效果、視窗拖曳縮放、表格解析） |
| `src/routes/apiRoutes.js` | **修改** | 新增 `/api/ai/chat`、履歷去重機制 (15s)、履歷刪除與歷史查詢端點 |
| `src/db/models/User.js` | **修改** | 擴充 `history_resume` Schema，支援保存 `cvData` 與 `templateId` |
| `static/db-client.js` | **修改** | 封裝履歷歷史查詢與刪除之 Client 端 API 方法 |
| `career_fit_v2.html` | **修改** | 整合真實用戶資訊 Prompt、範本切換器、修復 PDF 匯出與重複儲存 |
| `profile.html` | **修改** | 新增「AI 履歷典藏庫」、A4 預覽 Modal、範本即時切換與刪除 |
| `index.html` 等頁面 | **修改** | 引入 `chat-widget.js`、修復 Navbar 水平對齊與響應式排版 |
| `src/services/r2Service.js` | **新增** | Cloudflare R2 物件儲存核心服務 (S3 Client) |
| `src/services/emailService.js` | **新增** | Gmail SMTP 2FA OTP 郵件發送服務 |
| `src/db/connection.js` | **新增** | Mongoose MongoDB Atlas 連線與重連機制 |
| `src/db/models/OtpToken.js` | **新增** | 10 分鐘自動物理過期 (TTL Index) 驗證碼模型 |

---

## 11. 環境配置與啟動指南 (Setup & Deployment Guide)

### 11.1. 安裝相依套件 (Install Dependencies)
```bash
npm install
```

### 11.2. 環境變數設定 (`.env`)
確認根目錄下 `.env` 包含完整連線資訊：
```env
MONGO_URI=mongodb://hoangtho:...@ac-vsmaqqi-shard-00-00.lshgg13.mongodb.net:27017.../career?...
PORT=3001
GEMINI_API_KEY=AIzaSy...
DEEPSEEK_API_KEY=sk-...
GMAIL_SEND=lehoangtho25122004@gmail.com
GMAIL_SMTP="tpzn cqkb jpzf mdso"
R2_ENDPOINT="https://69cb1e7a43247b468f02c7dd47ceb3d8.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="a572e555e2b571acfdf3df758b7a46e9"
R2_SECRET_ACCESS_KEY="ed109886054079bdf283ae2fb9fd4d6c72739e173e2a4d063fca41e352a45259"
R2_BUCKET_NAME="career"
R2_PUBLIC_URL="https://pub-a8ce7abf447f4dc8aaa44cce8fbaa433.r2.dev"
```

### 11.3. 啟動伺服器 (Start Server)
```bash
npm run dev
# 或
node src/index.js
```

### 11.4. 系統頁面入口 (System URLs)
- 首頁 (Home): [http://localhost:3001/index.html](http://localhost:3001/index.html)
- 個人檔案與 AI 履歷典藏庫 (Profile & Archive): [http://localhost:3001/profile.html](http://localhost:3001/profile.html)
- AI 履歷健檢與範本生成 (AI Resume Fit): [http://localhost:3001/career_fit_v2.html](http://localhost:3001/career_fit_v2.html)
- 個人品牌測驗 (Brand Test): [http://localhost:3001/brand_test.html](http://localhost:3001/brand_test.html)
- 科系與實驗室適配 (Lab Recommendation): [http://localhost:3001/lab_recommendation.html](http://localhost:3001/lab_recommendation.html)
- 學習資源庫 (Resource Library): [http://localhost:3001/resource_library.html](http://localhost:3001/resource_library.html)
- 管理後台 (Admin Panel): [http://localhost:3001/admin.html](http://localhost:3001/admin.html)
