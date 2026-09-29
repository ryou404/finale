const path = require('path');
require('dotenv').config();
const { connectDB } = require('../db/connection');
const { KnowledgeChunk } = require('../db/models/KnowledgeChunk');
const { ingestDocument } = require('../services/ingestionService');

const OFFICIAL_GUIDE_TEXT = `
# 靜宜大學 CareerDNA 智能職涯與知識導航系統 使用手冊
# Providence University CareerDNA Platform User Guide & Knowledge Base

## 1. 系統介紹 (System Overview)
CareerDNA 是專為靜宜大學（Providence University）資訊學院（資訊工程學系 CS、資訊管理學系 IM、人工智慧應用學系 AI）學生設計的一站式 AI 職涯導航與專業發展平台。
本系統深度整合多代理人架構（Multi-Agent System）、RAG 向量知識庫（MongoDB Atlas Vector Search）與高精度 ATS 履歷健檢引擎，為學生提供從入學探索、學期選課、能力盤點到求職實習的全方位指引。

---

## 2. 核心功能模組 (Core Modules)

### (1) AI 履歷健檢與生成 (career_fit_v2.html)
- **ATS 人資檢核標準**：採用國際 Golden Triangle ATS 檢核體系，全面掃描關鍵字匹配度、版面排版相容性與語意清晰度。
- **Micro-STAR (STAR-L) 原則**：情境（Situation）、任務（Task）、行動（Action）、結果（Result）、學習延伸（Learning）。
- **Google XYZ 量化公式**：引導學生將專案經歷量化為「Accomplished [X] as measured by [Y], by doing [Z]」。
- **專業樣式與 PDF 匯出**：提供 Classic（經典商務）、Modern（現代科技藍）、Minimal（極簡極速）3 款標準 A4 履歷版型，並支援一鍵無損匯出向量 PDF。

### (2) 品牌測驗與性格探索 (brand_test.html)
- **Holland RIASEC 六大職業性格測驗**：
  - R (Realistic 實用型)：偏好動手操作、機械工具與實務開發。
  - I (Investigative 研究型)：熱愛邏輯思考、演算法分析與學術探究。
  - A (Artistic 藝術型)：注重視覺設計、UI/UX 介面互動與創新創意。
  - S (Social 社交型)：善於團隊溝通、教學分享與跨領域整合。
  - E (Enterprising 企業型)：具備專案領導、商業思維與創業推廣精神。
  - C (Conventional 常規型)：注重資料結構、資安規範、流程品質與資料庫維護。
- **蓋洛普個人優勢分析 (Gallup Strengths)**：發掘個人主導優勢與職涯定位。

### (3) 科系適配與實驗室導航 (lab_recommendation.html)
- 提供靜宜大學資工系、資管系、人工智慧系三大系所之專業特色、核心必修、重點研究領域與教授實驗室導覽。
- 學生可根據興趣領域（如生成式 AI、物聯網、大數據、資訊安全、雲端系統）快速媒合指導教授與研究主題。

### (4) 學習資源庫與技能樹 (resource_library.html)
- 涵蓋軟體工程、全端開發、機器學習、雲端架構、國際專業證照（如 AWS、Google Cloud、CISSP）學習地圖與精選教材推薦。

### (5) 個人檔案與典藏庫 (profile.html)
- 個人化管理學歷資料、技能武器庫（Tech Stack）、歷史 ATS 診斷紀錄與多版本履歷典藏庫。

### (6) AI 智能助理 (CareerDNA Global RAG Assistant)
- 支援靜宜大學資訊學院所有課程綱要即時檢索（選課代號、上課教室、上課時間節次、授課教師、必選修別、教科書及教材）。
- 支援已登入用戶之個人測驗分數、履歷健檢報告、帳號狀態即時安全查詢。
`;

async function updateGuide() {
  await connectDB();
  console.log('--- 正在更新官方知識庫文件 doc_careerdna_guide_official ---');

  await KnowledgeChunk.deleteMany({ docId: 'doc_careerdna_guide_official' });

  const res = await ingestDocument({
    docId: 'doc_careerdna_guide_official',
    title: 'CareerDNA 平台使用手冊與知識庫 (CareerDNA Platform User Guide)',
    content: OFFICIAL_GUIDE_TEXT.trim(),
    scope: 'public',
    userId: null,
    metadata: {
      category: 'System Manual',
      source: 'official_guide'
    }
  });

  console.log(`[完成] 成功導入官方手冊！總切片數: ${res.totalChunks}`);
  process.exit(0);
}

updateGuide().catch(err => {
  console.error('Error updating guide:', err);
  process.exit(1);
});
