/**
 * Standard Mock Student Payloads for CareerDNA Testing & Demos
 */

const mockStudentIM = {
  name: "林資管",
  department: "IM",
  grade: "大三",
  hollandCode: "RIC",
  strengths: ["排難", "學習", "分析"],
  completedCourses: [
    "網頁前端程式設計",
    "資料庫系統實作",
    "程式語言"
  ],
  experiences: ["exp_project"],
  targetRole: "全端網頁工程師",
  rawDraft: "做過一個網站，有用到資料庫，可以讓使用者登入跟買東西。還有做過分組報告。"
};

const mockStudentCS = {
  name: "張資工",
  department: "CS",
  grade: "大四",
  hollandCode: "RIA",
  strengths: ["思維", "專注", "研發"],
  completedCourses: [
    "演算法概論",
    "進階資料結構",
    "Python程式設計",
    "人工智慧"
  ],
  experiences: ["exp_compete"],
  targetRole: "AI 演算法工程師",
  rawDraft: "寫過 Python 跑機器學習模型，分類圖片，準確率好像有八成多。有參加過黑客松。"
};

const mockQuickDraft = {
  name: "陳同學",
  department: "IM",
  grade: "大二",
  hollandCode: "CSE",
  strengths: ["審慎", "排難", "交往"],
  completedCourses: [
    "網頁前端程式設計",
    "程式語言"
  ],
  experiences: ["exp_project"],
  targetRole: "前端網頁工程師",
  careerGoals: "希望進入知名科技公司擔任前端工程師，專注於現代 Web 應用、響應式設計與極致使用者體驗。",
  rawDraft: "在大二修課時做過一個社群論壇的前端介面，有串接後端 API 顯示文章列表跟留言功能。"
};

module.exports = {
  mockStudentIM,
  mockStudentCS,
  mockQuickDraft
};
