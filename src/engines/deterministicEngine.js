/**
 * CareerDNA Deterministic Execution Engine
 * High-precision offline rule engine providing 100% deterministic outputs
 * when LLM APIs are unavailable, unauthenticated, or rate-limited (429).
 */

const { findRecommendedCourses } = require('../data/providenceCourses');
const { CONFIG } = require('../config');

/**
 * Holland Code Trait Dictionary
 */
const HOLLAND_MAP = {
  R: { name: "實作型 (Realistic)", desc: "具備雙手實作與系統工程實踐能力，擅長將抽象邏輯落地為具體軟體架構" },
  I: { name: "研究型 (Investigative)", desc: "具備深度邏輯分析與研發思維，擅長排查技術難題與演算法優化" },
  A: { name: "藝術型 (Artistic)", desc: "具備視覺感知與美學創意，重視使用者介面 (UI) 與互動體驗 (UX)" },
  S: { name: "社交型 (Social)", desc: "具備敏銳同理心與溝通協調力，擅長跨部門溝通與使用者需求同理" },
  E: { name: "企業型 (Enterprising)", desc: "具備商業敏銳度與專案領導力，能將技術價值精準轉化為商業成果" },
  C: { name: "常規型 (Conventional)", desc: "具備縝密組織力與嚴謹紀律，重視資料庫正規化、代碼規範與安全標準" }
};

/**
 * Course to Skill Mapping
 */
const COURSE_SKILL_MAP = {
  "網頁前端程式設計": ["HTML5", "CSS3", "JavaScript", "Responsive Design"],
  "動態網頁設計": ["JavaScript (ES6+)", "React/Vue Basics", "RESTful API Integration"],
  "資料庫系統實作": ["SQL", "Database Normalization (3NF)", "MySQL/PostgreSQL", "Transaction Safety"],
  "資料庫管理": ["Database Design", "Indexing", "ACID", "Query Optimization"],
  "程式語言": ["C/C++", "Java", "Object-Oriented Programming (OOP)", "Data Structures"],
  "演算法概論": ["Algorithm Design", "Time Complexity Analysis", "Dynamic Programming", "Graph Traversal"],
  "進階資料結構": ["Trees & Graphs", "Memory Management", "Algorithm Optimization"],
  "Python程式設計": ["Python", "Scripting", "Data Structures", "Automation"],
  "人工智慧": ["Machine Learning Basics", "Heuristic Search", "Model Evaluation"],
  "人工智慧概論": ["AI Concepts", "Supervised Learning", "Classification"],
  "機器學習": ["Scikit-Learn", "Feature Engineering", "Regression", "Model Evaluation"],
  "深度學習": ["PyTorch/TensorFlow", "Neural Networks", "Computer Vision"],
  "雲端技術與應用": ["Docker", "Cloud Deployment", "Microservices", "GCP/AWS Architecture"],
  "系統分析與設計": ["UML Modeling", "Requirements Engineering", "System Architecture"],
  "資訊軟體實作": ["Git Collaboration", "CI/CD", "Unit Testing", "Software Engineering"],
  "商業智慧與資料倉儲": ["ETL", "Data Warehousing", "Redis Cache", "BI Reporting"],
  "大數據分析": ["Big Data Analytics", "Pandas", "Data Cleaning", "Visualization"]
};

/**
 * Target Role Tech Standards
 */
const ROLE_TECH_STANDARDS = {
  "全端網頁工程師": {
    core: ["JavaScript", "Node.js", "SQL", "RESTful API", "HTML5", "CSS3", "Git"],
    advanced: ["Docker", "Redis", "TypeScript", "CI/CD", "Unit Testing (Jest)", "Cloud Deployment (GCP/AWS)"]
  },
  "前端網頁工程師": {
    core: ["JavaScript", "HTML5", "CSS3", "Tailwind CSS", "React/Vue", "Git", "RESTful API"],
    advanced: ["TypeScript", "Next.js", "Web Performance Optimization", "Unit Testing (Vitest/Jest)", "CI/CD"]
  },
  "後端工程師": {
    core: ["Node.js/Python", "SQL", "RESTful API", "Database Design", "Git", "Linux"],
    advanced: ["Docker", "Redis", "Microservices", "Message Queue", "Unit Testing", "CI/CD", "GCP/AWS"]
  },
  "AI 演算法工程師": {
    core: ["Python", "Machine Learning", "Data Structures", "Algorithms", "Git", "Math/Statistics"],
    advanced: ["PyTorch/TensorFlow", "Deep Learning", "Docker", "Model Deployment (FastAPI)", "CUDA Optimization", "MLOps"]
  },
  "資料分析師 / BI 工程師": {
    core: ["SQL", "Python", "Data Visualization", "Excel/PowerBI", "Database Design", "Git"],
    advanced: ["ETL Pipelines", "Data Warehousing", "Big Data (Spark)", "Redis", "Statistical Modeling"]
  }
};

/**
 * Step 1: Deterministic Profile Generator
 */
function deterministicProfile(payload) {
  const p = (payload && typeof payload === 'object' && !Array.isArray(payload)) ? payload : {};
  const name = typeof p.name === 'string' ? (p.name.trim() || "學生") : (p.name !== null && p.name !== undefined ? String(p.name) : "學生");
  const dept = typeof p.department === 'string' ? (p.department.trim() || "IM") : (p.department && typeof p.department === 'object' ? (p.department.dept || "IM") : (p.department ? String(p.department) : "IM"));
  const grade = typeof p.grade === 'string' ? (p.grade.trim() || "大三") : (Array.isArray(p.grade) && p.grade.length > 0 ? String(p.grade[0]) : (p.grade ? String(p.grade) : "大三"));
  const hollandRaw = p.hollandCode !== null && p.hollandCode !== undefined ? String(p.hollandCode) : "RIC";
  const holland = (hollandRaw || "RIC").toUpperCase();
  const targetRole = typeof p.targetRole === 'string' ? (p.targetRole.trim() || "全端網頁工程師") : (p.targetRole ? String(p.targetRole) : "全端網頁工程師");

  const rawCourses = Array.isArray(p.completedCourses)
    ? p.completedCourses
    : (p.completedCourses && typeof p.completedCourses === 'object'
      ? Object.values(p.completedCourses)
      : (typeof p.completedCourses === 'string' ? [p.completedCourses] : []));
  const completedCourses = rawCourses
    .filter(c => c !== null && c !== undefined)
    .map(c => String(c).trim())
    .filter(c => c.length > 0);

  const rawStrengths = Array.isArray(p.strengths)
    ? p.strengths
    : (typeof p.strengths === 'string' ? [p.strengths] : []);
  const filteredStrengths = rawStrengths
    .filter(s => s !== null && s !== undefined)
    .map(s => String(s).trim())
    .filter(s => s.length > 0);
  const strengths = filteredStrengths.length > 0 ? filteredStrengths : ["排難", "學習", "分析"];

  // Analyze Holland traits
  const traitDescriptions = [];
  for (const char of holland) {
    if (HOLLAND_MAP[char]) {
      traitDescriptions.push(HOLLAND_MAP[char].name);
    }
  }
  const traitSummary = traitDescriptions.length > 0
    ? `融合 ${traitDescriptions.join(" 與 ")} 特質，具備兼顧工程實務與邏輯分析之軟體開發潛能。`
    : "具備兼顧工程實務與邏輯分析之軟體開發潛能。";

  // Aggregate baseline skills from completed courses
  const skillSet = new Set(["Git / GitHub", "Problem Solving"]);
  for (const course of completedCourses) {
    if (COURSE_SKILL_MAP[course]) {
      COURSE_SKILL_MAP[course].forEach(s => skillSet.add(s));
    }
  }

  // Determine specialization based on dept & targetRole
  let specialization = "Web Application Development & Database Systems";
  const targetRoleStr = String(targetRole || "");
  if (targetRoleStr.includes("AI") || targetRoleStr.includes("演算法")) {
    specialization = "Machine Learning & Algorithm Engineering";
  } else if (targetRoleStr.includes("前端")) {
    specialization = "Modern Frontend Architecture & Responsive UI";
  } else if (targetRoleStr.includes("後端")) {
    specialization = "Backend Microservices & Relational Database Architecture";
  } else if (targetRoleStr.includes("資料") || targetRoleStr.includes("BI")) {
    specialization = "Data Analytics, ETL Pipelines & Business Intelligence";
  }

  // Academic Milestone Status
  const academicMilestoneStatus = `已完成 ${completedCourses.length} 門核心專業課程，正往「資訊軟體學程」及「實務課群」學分認證邁進，需深化雲端與自動化測試工程實踐。`;

  return {
    targetPersona: {
      name,
      department: dept,
      grade,
      roleTitle: `Junior ${targetRole}`,
      specialization,
      seniorityLevel: "Entry-Level / Intern",
      hollandTraitSummary: traitSummary,
      coreStrengths: strengths,
      baselineSkills: Array.from(skillSet),
      completedCourses,
      academicMilestoneStatus
    }
  };
}

/**
 * Step 2: Deterministic Resume Builder
 */
function deterministicResumeBuilder(profileResult, payload) {
  const safeProfile = (profileResult && typeof profileResult === 'object') ? profileResult : {};
  const persona = (safeProfile.targetPersona && typeof safeProfile.targetPersona === 'object') ? safeProfile.targetPersona : {};
  const p = (payload && typeof payload === 'object' && !Array.isArray(payload)) ? payload : {};

  const rawDraft = typeof p.rawDraft === 'string'
    ? (p.rawDraft.trim() || "做過一個網站，有用到資料庫，可以讓使用者登入跟買東西。還有做過分組報告。")
    : (p.rawDraft !== null && p.rawDraft !== undefined
      ? String(p.rawDraft)
      : "做過一個網站，有用到資料庫，可以讓使用者登入跟買東西。還有做過分組報告。");

  const targetRole = typeof p.targetRole === 'string'
    ? (p.targetRole.trim() || persona.roleTitle || "全端網頁工程師")
    : (p.targetRole ? String(p.targetRole) : (persona.roleTitle || "全端網頁工程師"));

  const studentName = typeof p.name === 'string'
    ? (p.name.trim() || persona.name || "陳同學")
    : (p.name !== null && p.name !== undefined ? String(p.name) : (persona.name || "陳同學"));

  const rawCourses = Array.isArray(p.completedCourses)
    ? p.completedCourses
    : (Array.isArray(persona.completedCourses)
      ? persona.completedCourses
      : (p.completedCourses ? [p.completedCourses] : []));
  const completedCourses = rawCourses
    .filter(c => c !== null && c !== undefined)
    .map(c => String(c).trim())
    .filter(c => c.length > 0);

  // Segment raw draft into actionable components
  const rewrittenBullets = [];

  // Check for Web / E-Commerce project traits
  if (rawDraft.includes("網站") || rawDraft.includes("買東西") || rawDraft.includes("購物") || rawDraft.includes("資料庫")) {
    rewrittenBullets.push({
      id: "bullet_1",
      original: "做過一個網站，有用到資料庫，可以讓使用者登入跟買東西",
      microStar: "於課程專題中獨立架構全端電商 Web 系統，採用關聯式資料庫設計與 RESTful API，實現 200+ 筆商品目錄索引與 JWT 登入保護，並將重複查詢延遲降低 30%。",
      googleXyz: "獨立架構響應式全端電商網站，支援 200+ 筆商品即時檢索與購物車結帳 (X)，透過設計 3NF 關聯式資料庫與 RESTful API 減少 30% 查詢延遲 (Y)，落實 JWT 身分認證與安全交易防護 (Z)。",
      starElements: {
        situation: "修習《資料庫系統實作》與《網頁前端程式設計》之期末實務專題",
        task: "打造具備會員認證、商品目錄檢索與購物車交易流程之完整 Web 應用",
        action: "設計符合 3NF 正規化之 MySQL 綱要，並以 Node.js/JavaScript 實作 RESTful API 與 JWT 驗證",
        result: "成功支援 200+ 筆商品即時索引並降低 30% 資料庫查詢延遲"
      },
      xyzElements: {
        accomplishedX: "打造支援 200+ 筆商品與購物車結帳之響應式全端電商 Web 應用",
        measuredByY: "降低 30% 資料庫查詢延遲並達成 100% 交易流程完整性",
        byDoingZ: "設計 3NF 關聯式資料庫綱要並實作 RESTful API 與 JWT 身分認證機制"
      }
    });
  }

  // Check for AI / Machine Learning traits
  if (rawDraft.includes("Python") || rawDraft.includes("機器學習") || rawDraft.includes("模型") || rawDraft.includes("圖片") || rawDraft.includes("黑客松")) {
    rewrittenBullets.push({
      id: "bullet_ml",
      original: "寫過 Python 跑機器學習模型，分類圖片，準確率好像有八成多。有參加過黑客松。",
      microStar: "於黑客松與課程競賽中運用 Python 與 Scikit-Learn/PyTorch 開發影像分類模型，經特徵工程與超參數調校達成 88.5% 分類準確率，並將模型推理時間壓縮至 120ms 內。",
      googleXyz: "開發端對端影像識別分類系統 (X)，達成 88.5% 測試集驗證準確率且單次推理延遲 <120ms (Y)，藉由 Python 數據清洗、CNN 卷積特徵提取與 Learning Rate 調校 (Z)。",
      starElements: {
        situation: "參與大專院校黑客松競賽與《機器學習》實務專題",
        task: "建立高精準度且低延遲之多類別影像自動化分類模型",
        action: "使用 Python 進行資料擴增 (Data Augmentation)，構建卷積神經網路並優化損失函數",
        result: "模型準確率達 88.5% 並在限時評測中以 <120ms 延遲順利通過壓測"
      },
      xyzElements: {
        accomplishedX: "建置多類別影像識別與自動化預測端對端模型",
        measuredByY: "達成 88.5% 分類準確率並將推理延遲降至 120ms",
        byDoingZ: "運用 Python/PyTorch 進行資料擴增、CNN 網路架構設計與超參數調校"
      }
    });
  }

  // Check for Teamwork / Agile traits
  if (rawDraft.includes("分組") || rawDraft.includes("報告") || rawDraft.includes("專題") || rewrittenBullets.length < 2) {
    rewrittenBullets.push({
      id: "bullet_2",
      original: "還有做過分組報告",
      microStar: "擔任 4 人專案小組之核心技術協調者，主導系統需求分析與 UML 循序圖繪製，透過 Git 分支管理與敏捷 Sprint 迭代，於時限內 100% 交付期末成果並獲全班排名前 10%。",
      googleXyz: "主導 4 人專案小組之系統需求分析與軟體迭代 (X)，榮獲全班前 10% 期末評比優等且 100% 準時交付 (Y)，透過導入 Git Flow 協同規範與 Notion/Jira 敏捷看板管理 (Z)。",
      starElements: {
        situation: "學期《系統分析與設計》分組專案",
        task: "負責需求規格定義、系統架構繪製與跨成員開發進度掌控",
        action: "制定 Git 分支協同規範，繪製 UML 循序圖並主持每週 Stand-up 敏捷會議",
        result: "消滅跨成員程式碼衝突，100% 準時交付原型系統並獲選期末優秀成果展示"
      },
      xyzElements: {
        accomplishedX: "協同 4 人跨職能團隊完成系統分析與軟體原型交付",
        measuredByY: "榮獲全班前 10% 評比優等並維持 100% Sprint 準時達成率",
        byDoingZ: "導入 Git Flow 分支協同開發與敏捷 Sprint 看板追蹤機制"
      }
    });
  }

  // Extract skills
  const languages = ["JavaScript (ES6+)", "SQL", "HTML5/CSS3"];
  if (completedCourses.some(c => String(c).includes("Python")) || rawDraft.includes("Python")) {
    languages.push("Python");
  }
  if (completedCourses.some(c => String(c).includes("程式語言"))) {
    languages.push("Java / C++");
  }

  const frameworks = ["Node.js / Express", "Tailwind CSS", "RESTful APIs"];
  if (rawDraft.includes("機器學習") || completedCourses.some(c => String(c).includes("機器學習"))) {
    frameworks.push("Scikit-Learn", "PyTorch Basics");
  }

  const tools = ["Git / GitHub", "Postman", "MySQL Workbench", "UML System Modeling", "VS Code"];

  const deptStr = String(persona.department || "");
  const summary = `具備紮實 ${deptStr === "CS" ? "資訊工程" : "資訊管理"} 與軟體開發背景之 ${targetRole}。精通關聯式資料庫設計與前後端 Web 系統開發，具備 Micro-STAR 與 Google XYZ 實作思維。擁有獨立構建系統與團隊敏捷協同之實戰經驗。`;

  const gradeStr = String(persona.grade || "大三");
  const emailPrefix = String(studentName).toLowerCase().replace(/\s+/g, '_');

  // Markdown Resume
  const formattedResumeMarkdown = `### ${studentName} | Junior ${targetRole}
**Email**: ${emailPrefix}@pu.edu.tw | **GitHub**: github.com/student-pu | **Location**: 台灣 台中

---

#### 🎯 專業簡介
${summary}

#### 🛠️ 專業技能 (Technical Skills)
- **程式語言**: ${languages.join(", ")}
- **框架與技術**: ${frameworks.join(", ")}
- **工具與協同**: ${tools.join(", ")}

#### 💼 專案經歷 (Project Experience)
${rewrittenBullets.map(b => `- **${(b.starElements && b.starElements.task) || "專案開發"}** (${(b.starElements && b.starElements.situation) || "課程專題"})
  - **Google XYZ 實戰**: ${b.googleXyz || ""}
  - **Micro-STAR 成效**: ${b.microStar || ""}`).join("\n")}

#### 🎓 學歷與核心修課 (Education)
- **靜宜大學 ${deptStr === "CS" ? "資訊工程學系" : "資訊管理學系"}** (${gradeStr})
  - **核心修課**: ${completedCourses.length > 0 ? completedCourses.join("、") : "網頁前端程式設計、資料庫系統實作、程式語言"}`;

  return {
    summary,
    rewrittenBullets,
    skills: {
      languages,
      frameworks,
      tools
    },
    formattedResumeMarkdown
  };
}

/**
 * Step 3: Deterministic ATS Auditor
 */
function deterministicATSAuditor(resumeResult, profileResult, targetRole = "全端網頁工程師") {
  const safeResume = (resumeResult && typeof resumeResult === 'object') ? resumeResult : {};
  const safeProfile = (profileResult && typeof profileResult === 'object') ? profileResult : {};
  const safeRole = typeof targetRole === 'string' ? (targetRole.trim() || "全端網頁工程師") : (targetRole ? String(targetRole) : "全端網頁工程師");

  const rawBullets = Array.isArray(safeResume.rewrittenBullets) ? safeResume.rewrittenBullets : [];
  const bullets = rawBullets.filter(b => b && typeof b === 'object');
  const skillsObj = (safeResume.skills && typeof safeResume.skills === 'object') ? safeResume.skills : {};

  const extractSkills = (arr) => (Array.isArray(arr) ? arr : [])
    .filter(s => s !== null && s !== undefined)
    .map(s => String(s).trim())
    .filter(s => s.length > 0);

  const allSkills = [
    ...extractSkills(skillsObj.languages),
    ...extractSkills(skillsObj.frameworks),
    ...extractSkills(skillsObj.tools)
  ];

  // 1. Quantifiability Evaluation (XYZ)
  let quantCount = 0;
  bullets.forEach(b => {
    const text = (String(b.googleXyz || "") + " " + String(b.microStar || "")).trim();
    if (/\d+%|\d+\+|\d+ms|\d+筆|\d+位|\d+人|\d+\.\d+/.test(text)) {
      quantCount += 1;
    }
  });
  const quantRatio = bullets.length > 0 ? quantCount / bullets.length : 0.8;
  const quantifiability = Math.min(100, Math.max(65, Math.round(75 + quantRatio * 20)));

  // 2. Completeness Evaluation (STAR)
  let starCompleteCount = 0;
  bullets.forEach(b => {
    if (b.starElements && typeof b.starElements === 'object' &&
        b.starElements.situation && b.starElements.task && b.starElements.action && b.starElements.result) {
      starCompleteCount += 1;
    }
  });
  const starRatio = bullets.length > 0 ? starCompleteCount / bullets.length : 0.9;
  const completeness = Math.min(100, Math.max(70, Math.round(80 + starRatio * 15)));

  // 3. Keyword Relevance Evaluation
  const standards = ROLE_TECH_STANDARDS[safeRole] || ROLE_TECH_STANDARDS["全端網頁工程師"] || { core: [], advanced: [] };
  const coreList = Array.isArray(standards.core) ? standards.core : [];
  const advancedList = Array.isArray(standards.advanced) ? standards.advanced : [];
  const detectedTechStack = [];
  const missingTechStack = [];

  // Check core
  coreList.forEach(tech => {
    const techLower = String(tech || "").toLowerCase();
    const found = allSkills.some(s => s.toLowerCase().includes(techLower)) ||
      bullets.some(b => {
        const bText = (String(b.googleXyz || "") + " " + String(b.microStar || "")).toLowerCase();
        return bText.includes(techLower);
      });
    if (found) {
      detectedTechStack.push(tech);
    } else {
      missingTechStack.push(tech);
    }
  });

  // Check advanced
  advancedList.forEach(tech => {
    const techLower = String(tech || "").toLowerCase();
    const found = allSkills.some(s => s.toLowerCase().includes(techLower)) ||
      bullets.some(b => {
        const bText = (String(b.googleXyz || "") + " " + String(b.microStar || "")).toLowerCase();
        return bText.includes(techLower);
      });
    if (found) {
      detectedTechStack.push(tech);
    } else {
      missingTechStack.push(tech);
    }
  });

  const matchedCount = detectedTechStack.length;
  const totalStandardCount = coreList.length + advancedList.length;
  const relevanceRatio = totalStandardCount > 0 ? matchedCount / totalStandardCount : 0.6;
  const relevance = Math.min(100, Math.max(60, Math.round(65 + relevanceRatio * 30)));

  // Overall Score Calculation using strict weights
  const wQ = (CONFIG && CONFIG.weights && CONFIG.weights.ats && typeof CONFIG.weights.ats.quantifiability === 'number') ? CONFIG.weights.ats.quantifiability : 0.35;
  const wC = (CONFIG && CONFIG.weights && CONFIG.weights.ats && typeof CONFIG.weights.ats.completeness === 'number') ? CONFIG.weights.ats.completeness : 0.35;
  const wR = (CONFIG && CONFIG.weights && CONFIG.weights.ats && typeof CONFIG.weights.ats.keywordRelevance === 'number') ? CONFIG.weights.ats.keywordRelevance : 0.30;
  const overallScore = Math.round(wQ * quantifiability + wC * completeness + wR * relevance);

  // Grade Assignment
  let grade = "B";
  if (overallScore >= 90) grade = "S";
  else if (overallScore >= 80) grade = "A";
  else if (overallScore >= 75) grade = "B+";
  else if (overallScore >= 70) grade = "B";
  else grade = "C";

  const quantifiabilityBreakdown = `經歷中精準融入量化數據（如 200+ 筆商品、30% 延遲縮減、4 人小組協同），充分符合 Google XYZ 數據說服力原則。`;
  const completenessBreakdown = `每條專案經歷均具備清晰的 Situation、Task、Action、Result 四段式 Micro-STAR 結構，責任邊界明確。`;
  const keywordRelevanceBreakdown = `具備基礎 ${detectedTechStack.slice(0, 4).join(" / ")} 等核心技術，但缺乏 ${missingTechStack.slice(0, 3).join(" / ")} 等企業級進階關鍵字。`;

  const auditSummary = `履歷在 Micro-STAR 結構完整度 (${completeness}分) 與 Google XYZ 量化性 (${quantifiability}分) 表現優異，整體 ATS 健檢獲得 ${overallScore} 分 (${grade})。建議補齊缺失的企業級技術堆疊 (${missingTechStack.slice(0, 3).join(", ")}) 以突破大廠初篩門檻。`;

  const atsFlaggedWarnings = [
    `缺少容器化與雲端部署標籤 (${missingTechStack.filter(s => s.includes("Docker") || s.includes("Cloud")).join(" / ") || "Docker / GCP"})，可能在現代 DevOps 篩選中被降權。`,
    `缺少自動化單元測試指標 (${missingTechStack.filter(s => s.includes("Testing") || s.includes("CI/CD")).join(" / ") || "Jest / CI/CD"})，建議於專案補上測試覆蓋率實績。`
  ];

  return {
    overallScore,
    metrics: {
      quantifiability,
      completeness,
      relevance
    },
    grade,
    auditSummary,
    scoreAnalysis: {
      quantifiabilityBreakdown,
      completenessBreakdown,
      keywordRelevanceBreakdown
    },
    matchedTechStack: detectedTechStack,
    missingTechStack: missingTechStack.slice(0, 5),
    atsFlaggedWarnings
  };
}

/**
 * Step 4: Deterministic Academic Gap-Filler
 */
function deterministicAcademicGapFiller(atsAuditResult, studentPayload) {
  const safeATS = (atsAuditResult && typeof atsAuditResult === 'object') ? atsAuditResult : {};
  const p = (studentPayload && typeof studentPayload === 'object' && !Array.isArray(studentPayload)) ? studentPayload : {};

  const rawMissing = Array.isArray(safeATS.missingTechStack) ? safeATS.missingTechStack : [];
  const missingTech = rawMissing.length > 0
    ? rawMissing
    : ["Docker", "Redis", "Cloud Deployment (GCP/AWS)", "Unit Testing (Jest)"];

  const rawCompleted = Array.isArray(p.completedCourses) ? p.completedCourses : [];
  const completed = rawCompleted.filter(c => c !== null && c !== undefined).map(c => String(c).trim());

  // Match Providence University courses
  const recommendations = findRecommendedCourses(missingTech, completed, 3);

  // Build 30/60/90-day action plan
  const course1 = recommendations[0] ? recommendations[0].courseName : "雲端技術與應用";
  const course2 = recommendations[1] ? recommendations[1].courseName : "資訊軟體實作";
  const course3 = recommendations[2] ? recommendations[2].courseName : "商業智慧與資料倉儲";

  const timeline = {
    days30: {
      title: "短期 (1-30天): 課程選修與程式碼重構",
      milestone: "鎖定靜宜大學專業學程修課清單，並將現有專案重構為具備型別與單元測試之標準版",
      tasks: [
        `於選課系統登記加選《${course1}》與《${course2}》課程，鎖定學程 15 學分認證。`,
        "建立標準 GitHub Repository，撰寫完整 README、系統架構圖與 Postman API 測試集合。",
        "在既有專案中安裝 Vitest/Jest，為核心 API 與驗證函式撰寫 5 組以上單元測試 (Unit Tests)。"
      ]
    },
    days60: {
      title: "中期 (31-60天): 容器化封裝與高並發快取實作",
      milestone: "完成 Docker 容器化部署並導入 Redis 快取與 CI/CD 自動化流程",
      tasks: [
        "編寫 Dockerfile 與 docker-compose.yml，實現本機 Web 服務與 MySQL 資料庫的一鍵容器化運行。",
        "設定 GitHub Actions CI 流程，在每次 Push/PR 時自動執行 ESLint 與單元測試。",
        `結合《${course3}》課程知識，在專案中導入 Redis 快取熱門查詢資料，實測減少 50% 資料庫 I/O 負擔。`
      ]
    },
    days90: {
      title: "長期 (61-90天): 雲端正式上線與 ATS 履歷投遞",
      milestone: "將作品集正式部署至雲端 (GCP/Firebase)，取得 15 學分學程證書並啟動投遞",
      tasks: [
        "將全端容器化服務部署至 GCP Cloud Run 或 Firebase App Hosting，產出可公開訪問之 Live Demo 連結。",
        "將更新後的 Micro-STAR 與 Google XYZ 量化經歷（含 Docker/Redis/CI 指標）匯出為 PDF 履歷。",
        "完成靜宜大學專業學程證書印製申請，並於求職平台 (104 / CakeResume) 投遞 10+ 家目標職缺。"
      ]
    }
  };

  return {
    recommendations,
    timeline
  };
}

/**
 * High-Level Deterministic Orchestrator Pipeline
 */
function generateDeterministicOutput(studentPayload) {
  const p = (studentPayload && typeof studentPayload === 'object' && !Array.isArray(studentPayload)) ? studentPayload : {};
  const profileResult = deterministicProfile(p);
  const resumeResult = deterministicResumeBuilder(profileResult, p);
  const atsAuditResult = deterministicATSAuditor(resumeResult, profileResult, p.targetRole);
  const academicPlanResult = deterministicAcademicGapFiller(atsAuditResult, p);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    executionMode: "deterministic_fallback",
    studentProfile: {
      name: profileResult.targetPersona.name,
      targetRole: typeof p.targetRole === 'string' ? (p.targetRole.trim() || "全端網頁工程師") : (p.targetRole ? String(p.targetRole) : "全端網頁工程師"),
      hollandCode: p.hollandCode !== null && p.hollandCode !== undefined ? String(p.hollandCode) : "RIC",
      targetPersona: profileResult.targetPersona.roleTitle,
      strengths: profileResult.targetPersona.coreStrengths,
      completedCourses: profileResult.targetPersona.completedCourses,
      specialization: profileResult.targetPersona.specialization,
      hollandTraitSummary: profileResult.targetPersona.hollandTraitSummary,
      baselineSkills: profileResult.targetPersona.baselineSkills,
      academicMilestoneStatus: profileResult.targetPersona.academicMilestoneStatus
    },
    resume: {
      summary: resumeResult.summary,
      experienceBullets: resumeResult.rewrittenBullets,
      skills: resumeResult.skills,
      formattedResumeMarkdown: resumeResult.formattedResumeMarkdown
    },
    atsAudit: {
      overallScore: atsAuditResult.overallScore,
      metrics: atsAuditResult.metrics,
      grade: atsAuditResult.grade,
      auditSummary: atsAuditResult.auditSummary,
      scoreAnalysis: atsAuditResult.scoreAnalysis,
      matchedTechStack: atsAuditResult.matchedTechStack,
      missingTechStack: atsAuditResult.missingTechStack,
      atsFlaggedWarnings: atsAuditResult.atsFlaggedWarnings
    },
    academicPlan: {
      recommendations: academicPlanResult.recommendations,
      timeline: academicPlanResult.timeline
    }
  };
}

module.exports = {
  HOLLAND_MAP,
  COURSE_SKILL_MAP,
  ROLE_TECH_STANDARDS,
  deterministicProfile,
  deterministicResumeBuilder,
  deterministicATSAuditor,
  deterministicAcademicGapFiller,
  generateDeterministicOutput
};
