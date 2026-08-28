/**
 * Providence University (靜宜大學) CS & IM Course Catalog and Skill Matrix
 * Covers 4 Major Academic Programs (四大學程) and 10 Practical Course Clusters (10大實務課群).
 */

const PROVIDENCE_PROGRAMS = [
  {
    id: "prog_soft",
    name: "資訊軟體學程",
    englishName: "Information & Software Track",
    targetDept: ["資管系", "資工系"],
    requiredCredits: 15,
    courses: [
      { name: "網頁前端程式設計", credits: 3, grade: "二/三", skills: ["Frontend", "HTML5", "CSS3", "JavaScript", "UI Design"] },
      { name: "動態網頁設計", credits: 3, grade: "三", skills: ["JavaScript", "React", "Vue", "Async Web", "REST API"] },
      { name: "進階資料結構", credits: 3, grade: "二/三", skills: ["Data Structures", "Algorithms", "Performance Optimization", "Complexity Analysis"] },
      { name: "資料庫管理", credits: 3, grade: "三", skills: ["Database", "SQL", "Database Design", "Indexing", "ACID", "MySQL"] },
      { name: "資料庫系統實作", credits: 3, grade: "三", skills: ["SQL", "Database Normalization", "Backend Integration", "PostgreSQL", "MySQL"] },
      { name: "資訊軟體實作", credits: 3, grade: "三/四", skills: ["Unit Testing", "CI/CD", "Git Workflow", "Software Engineering", "Full-Stack Project"] },
      { name: "系統分析與設計", credits: 3, grade: "三", skills: ["UML", "Requirements Analysis", "System Architecture", "Wireframing"] },
      { name: "網路程式設計", credits: 3, grade: "三", skills: ["Socket Programming", "TCP/IP", "RESTful API", "Backend Networking"] },
      { name: "程式語言", credits: 3, grade: "一/二", skills: ["C/C++", "Java", "OOP", "Algorithm Basics"] },
      { name: "演算法概論", credits: 3, grade: "二/三", skills: ["Algorithms", "Dynamic Programming", "Graph Theory", "Optimization"] },
      { name: "行動應用軟體開發", credits: 3, grade: "三", skills: ["Mobile Apps", "Flutter", "Android", "iOS", "Client-Side UI"] }
    ]
  },
  {
    id: "prog_ai",
    name: "人工智慧應用學程",
    englishName: "Applied Artificial Intelligence Track",
    targetDept: ["資管系", "資工系", "人工智慧系"],
    requiredCredits: 15,
    courses: [
      { name: "人工智慧概論", credits: 3, grade: "二", skills: ["AI Fundamentals", "Machine Learning", "Search Algorithms"] },
      { name: "Python程式設計", credits: 3, grade: "一/二", skills: ["Python", "Scripting", "Data Structures", "Automation"] },
      { name: "物聯網概論", credits: 3, grade: "二", skills: ["IoT", "Sensors", "MQTT", "Embedded Basics"] },
      { name: "大數據分析", credits: 3, grade: "三", skills: ["Big Data", "Pandas", "NumPy", "Data Cleaning", "Data Analytics"] },
      { name: "Python應用實務", credits: 3, grade: "三", skills: ["Python", "FastAPI", "Web Scraping", "Data Visualization"] },
      { name: "機器學習", credits: 3, grade: "三", skills: ["Machine Learning", "Scikit-Learn", "Regression", "Classification", "Model Tuning"] },
      { name: "深度學習", credits: 3, grade: "三/四", skills: ["Deep Learning", "PyTorch", "TensorFlow", "CNN", "Transformer", "LLM"] },
      { name: "雲端技術與應用", credits: 3, grade: "四", skills: ["Cloud Deployment", "Docker", "Kubernetes", "GCP", "AWS", "Microservices"] },
      { name: "智慧物聯網應用實務", credits: 3, grade: "三/四", skills: ["AIoT", "Edge AI", "Computer Vision", "Raspberry Pi"] }
    ]
  },
  {
    id: "prog_erp",
    name: "智慧企業學程",
    englishName: "Smart Enterprise & ERP Track",
    targetDept: ["資管系"],
    requiredCredits: 15,
    courses: [
      { name: "企業資源規劃", credits: 3, grade: "三", skills: ["ERP", "SAP", "Business Process", "Enterprise Architecture"] },
      { name: "運籌管理資訊系統", credits: 3, grade: "三", skills: ["Supply Chain", "SCM", "Logistics", "Operations Research"] },
      { name: "財務會計資訊系統", credits: 3, grade: "三", skills: ["FinTech", "Accounting Systems", "Financial Workflows"] },
      { name: "人力資源管理系統", credits: 3, grade: "三", skills: ["HR Systems", "Talent Management", "Payroll Workflows"] },
      { name: "ABAP 程式設計", credits: 3, grade: "三/四", skills: ["SAP ABAP", "Enterprise Dev", "SAP BAPI"] },
      { name: "企業流程管理", credits: 3, grade: "三", skills: ["BPM", "Workflow Engine", "Process Optimization"] },
      { name: "專案管理", credits: 3, grade: "四", skills: ["Agile", "Scrum", "Project Planning", "Risk Management", "Jira"] },
      { name: "商業智慧與資料倉儲", credits: 3, grade: "三/四", skills: ["Data Warehouse", "ETL", "BI", "Redis Cache", "SQL Analytics", "PowerBI"] }
    ]
  },
  {
    id: "prog_data",
    name: "大數據與社群商務學程",
    englishName: "Big Data & Social Commerce Track",
    targetDept: ["資管系"],
    requiredCredits: 15,
    courses: [
      { name: "巨量資料分析導論", credits: 3, grade: "二", skills: ["Big Data", "Data Pipeline", "Statistical Analysis"] },
      { name: "商業智慧與資料倉儲", credits: 3, grade: "三", skills: ["Data Warehouse", "OLAP", "Redis", "ETL", "Analytics"] },
      { name: "電子商務", credits: 3, grade: "二/三", skills: ["E-Commerce", "Payment Gateways", "Shopping Platforms", "SEO"] },
      { name: "網路行銷", credits: 3, grade: "二", skills: ["Digital Marketing", "GA4", "Growth Hacking", "Ad Operations"] },
      { name: "電商社群媒體經營", credits: 3, grade: "三", skills: ["Social Media", "Community Ops", "Content Strategy"] },
      { name: "顧客關係管理", credits: 3, grade: "三", skills: ["CRM", "User Retention", "Customer Segmentation"] }
    ]
  }
];

const PROVIDENCE_PRACTICAL_CLUSTERS = [
  {
    id: "cluster_net",
    name: "網路管理",
    requiredCredits: 9,
    courses: [
      { name: "計算機網路", credits: 3, grade: "二", skills: ["Networking", "TCP/IP", "DNS", "HTTP/HTTPS", "Routing"] },
      { name: "系統與網路管理", credits: 3, grade: "三", skills: ["Linux", "SysAdmin", "Shell Scripting", "Nginx"] },
      { name: "網路安全", credits: 3, grade: "三", skills: ["Network Security", "Firewall", "Penetration Testing", "SSL/TLS"] },
      { name: "網路通訊協定", credits: 3, grade: "四", skills: ["Protocols", "WebSocket", "gRPC", "Network Architecture"] },
      { name: "網路系統建構實務", credits: 3, grade: "四", skills: ["Network Infrastructure", "Cloud Networking", "VPC"] }
    ]
  },
  {
    id: "cluster_iot",
    name: "物聯網應用",
    requiredCredits: 9,
    courses: [
      { name: "互動設計入門", credits: 3, grade: "二", skills: ["Interaction Design", "Prototyping", "UI/UX"] },
      { name: "互動式微控原理與應用", credits: 3, grade: "二", skills: ["Microcontrollers", "Arduino", "Sensors"] },
      { name: "行動物聯網", credits: 3, grade: "三", skills: ["Mobile IoT", "BLE", "MQTT", "Location Services"] },
      { name: "嵌入式微控制器與物聯網實作", credits: 3, grade: "三", skills: ["Embedded C", "ESP32", "Hardware Prototyping"] },
      { name: "數位系統與設計", credits: 3, grade: "四", skills: ["Digital Systems", "FPGA", "Hardware Logic"] }
    ]
  },
  {
    id: "cluster_ai",
    name: "人工智慧(AI)",
    requiredCredits: 9,
    courses: [
      { name: "人工智慧", credits: 3, grade: "二/四", skills: ["AI", "Heuristic Search", "Expert Systems", "Machine Learning"] },
      { name: "機器學習", credits: 3, grade: "三", skills: ["Machine Learning", "Model Evaluation", "Classification", "Feature Engineering"] },
      { name: "智慧醫療", credits: 3, grade: "三", skills: ["HealthTech", "Medical Data Analytics", "Bioinformatics"] },
      { name: "深度學習", credits: 3, grade: "三", skills: ["Deep Learning", "Neural Networks", "PyTorch", "Computer Vision"] },
      { name: "智慧製造", credits: 3, grade: "四", skills: ["Smart Manufacturing", "Predictive Maintenance", "Industry 4.0"] }
    ]
  },
  {
    id: "cluster_mobile",
    name: "行動軟體",
    requiredCredits: 9,
    courses: [
      { name: "行動應用軟體開發", credits: 3, grade: "三", skills: ["Mobile App", "Flutter", "iOS/Android", "State Management"] },
      { name: "人機介面與使用者經驗設計", credits: 3, grade: "三", skills: ["UI/UX Design", "Figma", "Usability Testing", "Wireframing"] },
      { name: "進階行動應用軟體開發", credits: 3, grade: "三", skills: ["Advanced Mobile", "Native Modules", "Mobile Architecture"] },
      { name: "網站系統實作", credits: 3, grade: "四", skills: ["Web Systems", "Full-Stack Dev", "Production Deployment", "DevOps"] }
    ]
  },
  {
    id: "cluster_design",
    name: "文創動漫設計",
    requiredCredits: 9,
    courses: [
      { name: "數位特效與影像美學", credits: 3, grade: "二", skills: ["Visual Aesthetics", "Motion Graphics", "Video Editing"] },
      { name: "當代動漫美學與文化", credits: 3, grade: "三", skills: ["Media Culture", "Narrative Design", "Character Design"] },
      { name: "數位插畫與動態繪本創作", credits: 3, grade: "三", skills: ["Digital Illustration", "2D Animation", "Storyboarding"] },
      { name: "影視媒介與當代流行文化", credits: 3, grade: "三", skills: ["Media Production", "Visual Storytelling"] }
    ]
  },
  {
    id: "cluster_sec",
    name: "資訊安全",
    requiredCredits: 9,
    courses: [
      { name: "資訊安全概論", credits: 3, grade: "二", skills: ["InfoSec", "Cryptography", "Threat Modeling", "OWASP"] },
      { name: "資訊安全管理", credits: 3, grade: "二", skills: ["Security Governance", "ISO 27001", "Risk Compliance"] },
      { name: "安全程式設計", credits: 3, grade: "三", skills: ["Secure Coding", "XSS/SQLi Defense", "Input Sanitization", "Code Audit"] },
      { name: "系統安全", credits: 3, grade: "四", skills: ["System Security", "Access Control", "Kernel Hardening", "Forensics"] }
    ]
  },
  {
    id: "cluster_mcom",
    name: "行動商務",
    requiredCredits: 9,
    courses: [
      { name: "網路行銷", credits: 3, grade: "二", skills: ["Digital Marketing", "SEO/SEM", "Conversion Optimization"] },
      { name: "行動電子商務", credits: 3, grade: "三", skills: ["Mobile Commerce", "Payment Gateway", "Omnichannel"] },
      { name: "資料庫系統實作", credits: 3, grade: "三", skills: ["Database", "SQL", "Transaction Management", "Schema Design"] },
      { name: "雲端技術與應用", credits: 3, grade: "四", skills: ["Cloud Computing", "Docker", "GCP", "Microservices", "CI/CD"] },
      { name: "行動應用軟體開發/ iOS APP 實務設計", credits: 3, grade: "三", skills: ["iOS", "Swift", "Mobile UX", "App Store Release"] }
    ]
  },
  {
    id: "cluster_bi",
    name: "智慧資料分析",
    requiredCredits: 9,
    courses: [
      { name: "商業智慧與資料倉儲", credits: 3, grade: "三", skills: ["Data Warehouse", "Redis", "ETL", "OLAP", "BI Dashboards"] },
      { name: "資料挖掘概論/大數據分析", credits: 3, grade: "三/四", skills: ["Data Mining", "Big Data", "Pattern Recognition", "Clustering"] },
      { name: "專案管理", credits: 3, grade: "四", skills: ["Agile Management", "Sprint Planning", "Jira", "Risk Mitigation"] },
      { name: "人工智慧", credits: 3, grade: "四", skills: ["AI Modeling", "Deep Learning Applications"] },
      { name: "Python應用實務", credits: 3, grade: "三", skills: ["Python", "FastAPI", "Pandas", "Automation Scripts"] }
    ]
  },
  {
    id: "cluster_intern",
    name: "企業實習",
    requiredCredits: 9,
    courses: [
      { name: "企業實習", credits: 9, grade: "四", skills: ["Industry Experience", "Professional Practice", "Cross-Functional Teamwork"] }
    ]
  },
  {
    id: "cluster_study",
    name: "寰宇學習",
    requiredCredits: 9,
    courses: [
      { name: "寰宇學習", credits: 9, grade: "三/四", skills: ["Global Perspectives", "International Exchange", "Cross-Cultural Communication"] }
    ]
  }
];

/**
 * Skill-to-Course Mapping Knowledge Base
 */
const SKILL_TO_COURSE_MAPPINGS = [
  {
    skillKeywords: ["cloud", "docker", "gcp", "aws", "container", "kubernetes", "microservices", "雲端", "容器化"],
    courseName: "雲端技術與應用",
    courseCode: "PU-IM-401",
    category: "人工智慧應用學程 / 行動商務課群",
    department: "資管系/資工系",
    credits: 3,
    teachesSkills: ["Docker", "Cloud Deployment (GCP/AWS)", "Microservices Architecture", "Container Orchestration"],
    rationale: "直接補足履歷缺失的雲端容器化 (Docker) 與雲端架構部署經歷，大幅提升 ATS 雲端關鍵字權重與工程實戰力。"
  },
  {
    skillKeywords: ["test", "testing", "jest", "unit test", "ci/cd", "continuous integration", "git workflow", "自動化測試", "單元測試"],
    courseName: "資訊軟體實作",
    courseCode: "PU-IM-305",
    category: "資訊軟體學程",
    department: "資管系",
    credits: 3,
    teachesSkills: ["Unit Testing (Jest/Vitest)", "CI/CD Pipeline", "Team Git Workflow", "Code Review & Quality"],
    rationale: "透過實務專案導入單元測試與 CI/CD 自動化流程，建立企業級軟體工程交付標準，消滅履歷缺乏測試指標的致命弱點。"
  },
  {
    skillKeywords: ["redis", "cache", "data warehouse", "etl", "query optimization", "bi", "快取", "資料倉儲", "資料庫效能"],
    courseName: "商業智慧與資料倉儲",
    courseCode: "PU-IM-308",
    category: "智慧企業學程 / 智慧資料分析課群",
    department: "資管系",
    credits: 3,
    teachesSkills: ["Redis Cache", "ETL Data Pipeline", "Data Warehousing", "Query Performance Optimization"],
    rationale: "強化高並發快取機制 (Redis) 與大數據資料倉儲架構，能將後端查詢效能提升數倍並在履歷展現量化優化實績。"
  },
  {
    skillKeywords: ["typescript", "react", "vue", "frontend", "spa", "動態網頁", "前端框架"],
    courseName: "動態網頁設計",
    courseCode: "PU-IM-302",
    category: "資訊軟體學程",
    department: "資管系/資工系",
    credits: 3,
    teachesSkills: ["TypeScript / Modern JS", "Component-Based Architecture", "State Management", "REST API Integration"],
    rationale: "將原生 JavaScript 升級至現代前端框架與 TypeScript 生態，滿足主流軟體公司對前端/全端工程師的核心門檻。"
  },
  {
    skillKeywords: ["security", "owasp", "xss", "sqli", "auth", "jwt", "資安", "安全程式設計"],
    courseName: "安全程式設計",
    courseCode: "PU-IM-306",
    category: "資訊安全課群",
    department: "資管系/資工系",
    credits: 3,
    teachesSkills: ["OWASP Top 10 Defense", "JWT/OAuth2 Auth Guard", "Secure Coding", "Vulnerability Scanning"],
    rationale: "為後端 API 與使用者驗證機制建立嚴格資安防禦，讓履歷在企業資安審查與 ATS 資安標籤中脫穎而出。"
  },
  {
    skillKeywords: ["python", "ai", "machine learning", "fastapi", "pandas", "機器學習", "人工智慧"],
    courseName: "機器學習",
    courseCode: "PU-AI-301",
    category: "人工智慧應用學程",
    department: "資管系/人工智慧系",
    credits: 3,
    teachesSkills: ["Machine Learning", "Scikit-Learn", "Model Training & Evaluation", "Feature Engineering"],
    rationale: "為軟體專案注入智慧化預測與分析能力，拓展 AI 演算法與智慧應用等高薪職缺方向。"
  },
  {
    skillKeywords: ["agile", "scrum", "jira", "uml", "system analysis", "敏捷開發", "系統分析", "專案管理"],
    courseName: "專案管理",
    courseCode: "PU-IM-403",
    category: "智慧企業學程 / 智慧資料分析課群",
    department: "資管系",
    credits: 3,
    teachesSkills: ["Agile/Scrum Workflow", "Sprint Management", "Jira/Notion Collaboration", "Risk Management"],
    rationale: "強化跨職能團隊敏捷協同與專案管理能力，證明具備團隊協作與專案準時交付的 Soft/Hard Skills。"
  }
];

/**
 * Find recommended Providence University courses based on missing tech stack keywords
 * @param {string[]} missingSkills - Array of missing tech stack strings
 * @param {string[]} completedCourses - Array of already completed course names
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Array} List of recommended course objects
 */
function findRecommendedCourses(missingSkills = [], completedCourses = [], limit = 3) {
  const normalizedCompleted = (Array.isArray(completedCourses) ? completedCourses : (typeof completedCourses === 'string' ? [completedCourses] : []))
    .filter(c => c !== null && c !== undefined)
    .map(c => String(c).trim().toLowerCase())
    .filter(c => c.length > 0);

  const missingLower = (Array.isArray(missingSkills) ? missingSkills : (typeof missingSkills === 'string' ? [missingSkills] : []))
    .filter(s => s !== null && s !== undefined)
    .map(s => String(s).trim().toLowerCase())
    .filter(s => s.length > 0);

  const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 3;

  const matched = [];
  const addedCourseNames = new Set();

  for (const mapping of SKILL_TO_COURSE_MAPPINGS) {
    if (addedCourseNames.has(mapping.courseName)) continue;
    if (normalizedCompleted.includes(String(mapping.courseName || "").toLowerCase())) continue;

    // Check if any missing skill matches keywords in this course mapping
    const isMatched = (mapping.skillKeywords || []).some(keyword => {
      const kwLower = String(keyword || "").toLowerCase();
      return missingLower.some(skill => skill.includes(kwLower) || kwLower.includes(skill));
    });

    if (isMatched) {
      matched.push({
        courseCode: mapping.courseCode,
        courseName: mapping.courseName,
        category: mapping.category,
        department: mapping.department,
        credits: mapping.credits,
        teachesSkills: mapping.teachesSkills,
        reason: mapping.rationale
      });
      addedCourseNames.add(mapping.courseName);
    }
  }

  // If matched count is less than limit, add core high-value courses that haven't been completed
  if (matched.length < safeLimit) {
    for (const mapping of SKILL_TO_COURSE_MAPPINGS) {
      if (matched.length >= safeLimit) break;
      if (!addedCourseNames.has(mapping.courseName) && !normalizedCompleted.includes(String(mapping.courseName || "").toLowerCase())) {
        matched.push({
          courseCode: mapping.courseCode,
          courseName: mapping.courseName,
          category: mapping.category,
          department: mapping.department,
          credits: mapping.credits,
          teachesSkills: mapping.teachesSkills,
          reason: mapping.rationale
        });
        addedCourseNames.add(mapping.courseName);
      }
    }
  }

  return matched.slice(0, safeLimit);
}

module.exports = {
  PROVIDENCE_PROGRAMS,
  PROVIDENCE_PRACTICAL_CLUSTERS,
  SKILL_TO_COURSE_MAPPINGS,
  findRecommendedCourses
};
