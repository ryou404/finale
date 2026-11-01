# 🚀 CAREERDNA // AI 履歷健檢「複製內容優化」與「A4 動態即時編輯」實作計畫

> **專案目標**：
> 1. 突破靜態履歷預覽限制，讓學生能在瀏覽器 A4 紙張上**直接點擊打字修改（全時動態編輯）**，並提供「重設為原始履歷」安全復原按鈕。
> 2. 解決複製到 Google Docs 後遺失醒目顏色的痛點，採用**雙模剪貼簿（Dual Clipboard Payload）**，確保貼至 Google Docs 時能維持黃色螢光高亮標記。
> 3. 點擊「複製內容」時彈出置中 **Cyber-Brutalist 視覺化教學彈窗**，清楚指引 Google 文件的 Markdown 設定步驟與貼上技巧。

---

## 🎯 核心規格與決策確認 (User Aligned Specs)

```
+----------------------------------------------------------------------------------------------------+
|                                    A4 履歷預覽工具列 (Resume Toolbar)                               |
|  [📄 A4 履歷預覽]    [↺ 重設為原始履歷]    [📋 複製內容 (含教學)]    [🖨️ 列印/PDF]    [⬇️ 匯出 PDF]  |
+----------------------------------------------------------------------------------------------------+
                                                  |
           +--------------------------------------+--------------------------------------+
           | (點擊打字編輯)                                                              | (點擊複製)
           v                                                                             v
+------------------------------------+                         +------------------------------------+
|       A4 履歷即時編輯紙張          |                         |    雙模剪貼簿寫入 (Dual Payload)   |
|   - contenteditable="true"         |                         |   - text/html (保留黃色螢光高亮)    |
|   - 支援編輯任何 STAR 經歷/自傳    |                         |   - text/plain (Markdown 行內晶片) |
|   - 實時同步至複製內容狀態         |                         +------------------------------------+
+------------------------------------+                                           |
                                                                                 v
                                                               +------------------------------------+
                                                               |   Cyber-Brutalist 教學卡片彈窗     |
                                                               |   - 偏好設定 -> 啟用 Markdown      |
                                                               |   - 快捷鍵貼上與黃色標記說明       |
                                                               |   - 一鍵直達 docs.new 建立文件     |
                                                               +------------------------------------+
```

---

## 📋 變更項目規劃 (Proposed Changes)

### 1. 前端頁面結構與樣式調整
#### [MODIFY] [`career_fit.html`](file:///c:/Users/rex10_qggh92p/Desktop/finale-main/career_fit.html)

#### A. 工具列新增「重設為原始履歷」按鈕
在 `#resume-preview-panel` 工具列區域，新增按鈕：
```html
<button type="button" onclick="window.App.resetOriginalResume()" class="hover-spring bg-white text-klein/80 hover:text-klein border border-klein/20 hover:border-klein font-mono text-xs font-bold py-2 px-3 flex items-center gap-1.5 transition-all" title="放棄目前的修改，還原成系統生成的原始履歷">
    <i class="fa-solid fa-rotate-left text-klein/60"></i> 重設為原始履歷
</button>
```

#### B. A4 紙張開啟 `contenteditable="true"` 與編輯視覺回饋
在 `#resume-output` 預覽紙張容器上設定：
```html
<div id="resume-output" 
     contenteditable="true" 
     spellcheck="false"
     class="bg-white border border-klein/20 p-6 md:p-10 max-h-[700px] overflow-y-auto shadow-sm text-klein/90 leading-relaxed font-body focus:outline-none focus:ring-2 focus:ring-klein/30 focus:border-klein transition-all">
    <!-- 履歷內容 -->
</div>
```
同時在頂部加入輕量級提示小標籤：
```html
<div class="flex items-center justify-between text-[11px] font-mono text-klein/60 mb-2 px-1">
    <span class="flex items-center gap-1.5">
        <i class="fa-solid fa-pen-to-square text-klein"></i> 支援動態編輯：點擊 A4 任意文字可直接輸入修改，複製時將保留最新內容。
    </span>
    <span id="resume-edit-indicator" class="hidden text-amber-600 font-bold flex items-center gap-1">
        <i class="fa-solid fa-circle-dot animate-pulse"></i> 已編輯修改
    </span>
</div>
```

#### C. 新增「Google 文件編輯教學」置中 Cyber-Brutalist 彈窗
在 `<body>` 末端新增彈窗結構 `id="google-docs-guide-modal"`：
- 黑色半透明背景遮罩 `bg-black/60 backdrop-blur-sm`。
- 高對比 Cyber-Brutalist 框線設計，包含立體陰影與品牌藍標題。
- 三大步驟圖解說明：
  1. **步驟 1：開啟 Markdown 支援**：左上角 `工具` $\to$ `偏好設定` $\to$ 在「一般」標籤頁下方勾選 `啟用 Markdown`。
  2. **步驟 2：貼上履歷**：
     - **推薦方式（保留黃色螢光高亮）**：在 Google 文件直接按 `Ctrl + V` 貼上。
     - **結構方式（Markdown 格式）**：上方選單點選 `編輯` $\to$ `從 Markdown 貼上`。
  3. **步驟 3：填寫黃色標記**：將履歷中鮮豔標記的 `【使用者自行輸入】` 替換為個人真實數據。
- 動作按鈕：
  - 🔗 `前往 Google 文件 (docs.new)`（開新分頁直接開啟空白文件）。
  - ✔️ `我知道了，繼續編輯`（關閉彈窗）。
  - 獨立核取方塊：`下次不再顯示此教學`（儲存於 `localStorage`）。

---

### 2. 邏輯服務與剪貼簿雙模寫入優化
#### [MODIFY] [`career_fit.html`](file:///c:/Users/rex10_qggh92p/Desktop/finale-main/career_fit.html) & [`static/resume-knowledge.js`](file:///c:/Users/rex10_qggh92p/Desktop/finale-main/static/resume-knowledge.js)

#### A. 雙模剪貼簿（Dual Clipboard Payload）演算法
升級 `copyResumeMarkdown()` 函數：
1. 抓取 `#resume-output` 當前即時內容（若使用者已在頁面上修改過，以修改後的最新文字為準）。
2. **HTML 富文字 Payload**：
   將所有 `【使用者自行輸入：...】` 佔位符轉換為 Google Docs 認得的黃色螢光底色與粗體樣式：
   ```html
   <mark style="background-color: #FEF08A; color: #854D0E; font-weight: bold; border-bottom: 2px solid #EAB308; padding: 2px 4px; border-radius: 2px;">
       【使用者自行輸入：${fieldName}】
   </mark>
   ```
3. **純文字 Markdown Payload**：
   將佔位符強化為行內晶片語法：
   ```markdown
   `**【使用者自行輸入：${fieldName}】**`
   ```
4. **寫入剪貼簿**：
   使用標準現代 Web API：
   ```javascript
   const htmlBlob = new Blob([processedHtml], { type: 'text/html' });
   const textBlob = new Blob([processedMarkdown], { type: 'text/plain' });
   await navigator.clipboard.write([
       new ClipboardItem({
           'text/html': htmlBlob,
           'text/plain': textBlob
       })
   ]);
   ```
5. **彈出教學卡片**：
   檢查 `localStorage.getItem('career_dna_hide_gdocs_guide')`，若未被勾選「不再顯示」，則開啟 `#google-docs-guide-modal`。

#### B. 「重設為原始履歷」還原機制
新增 `resetOriginalResume()`：
- 取得 `this.originalGeneratedHtml` 或 `this.lastResumeMarkdown`。
- 還原 `#resume-output` 內容。
- 隱藏已編輯提示燈，彈出 Toast：「已成功重設為系統原始履歷」。

---

## 🔍 驗證計畫 (Verification Plan)

### 1. 本地瀏覽器手動測試
- **動態編輯測試**：
  1. 開啟 `career_fit.html` 並生成一份履歷。
  2. 直接點擊 A4 履歷上的標題、自傳、或「情境與任務 (S/T)」，確認可正常打字、刪除、貼上。
  3. 點擊「重設為原始履歷」，驗證畫面能瞬間還原至未修改前的狀態。
- **複製與彈窗測試**：
  1. 點擊「複製內容」，確認置中 Cyber-Brutalist 教學卡片流暢淡入彈出。
  2. 檢查教學步驟文字是否清晰準確。
  3. 點擊「前往 Google 文件 (docs.new)」，確認能正常於新分頁開啟 Google Docs。
  4. 勾選「下次不再顯示此教學」並關閉，再次點擊「複製內容」，確認後續只會顯示 Toast 提示而不阻礙操作。
- **Google Docs 貼上效果測試**：
  1. 在 Google Docs 按 `Ctrl + V`，確認履歷排版完整且 `【使用者自行輸入】` 帶有鮮明的黃色螢光底色與粗體標記。
  2. 在 Google Docs 啟用 Markdown 並使用 `從 Markdown 貼上`，確認帶有晶片外框標記。

---

## 💬 請您審閱

此實作計畫已完整吸收會議指示與剛才的設計對焦。請確認上方計畫內容，滿意請回覆確認或點擊 Proceed，我們將立刻展開程式碼實作！
