/**
 * CareerDNA Database Seeder
 * - Ensures default Admin account exists (admin / admin123)
 * - Seeds Learning Resources into MongoDB from static data
 * - Seeds Providence University Professors & Labs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models/User');
const { Resource } = require('./models/Resource');
const { Professor } = require('./models/Professor');
const Category = require('./models/Category');
const { connectDB } = require('./connection');

const DEFAULT_CATEGORIES = [
  { categoryId: 'cat_academic', name: '學科資源', nameEn: 'Academic', icon: '📚', order: 1, description: '課堂教材、演算法、程式語言與期中期末筆記' },
  { categoryId: 'cat_lab', name: '實驗室資訊', nameEn: 'Lab Info', icon: '🔬', order: 2, description: '教授專任研究室、產學合作與專題題目指南' },
  { categoryId: 'cat_career', name: '職涯發展', nameEn: 'Career', icon: '💼', order: 3, description: '實習求職、履歷面試、軟體工程師求職攻略' },
  { categoryId: 'cat_exam', name: '考試備戰', nameEn: 'Exams', icon: '📑', order: 4, description: '研究所推甄、程式檢定 (CPE / LeetCode)、證照考試' },
  { categoryId: 'cat_tools', name: '常用工具', nameEn: 'Tools', icon: '⚙️', order: 5, description: 'Git/GitHub、Docker、DevOps、開發軟體工具箱' }
];

const DEFAULT_RESOURCES = [
  // 資工系 (CS) 資源
  {
    resourceId: 'cs_prog_fundamentals',
    title: '程式設計基礎 — C 語言完整筆記',
    category: '學科資源',
    type: '筆記',
    departments: ['資工系', '資管系', '人工智慧系'],
    grades: [1, 2],
    description: '涵蓋指標、陣列、結構體與動態記憶體配置，附上常見錯誤解析與除錯技巧。',
    url: 'https://hackmd.io',
    tags: ['C語言', '程式設計', '大一必修'],
    featured: true,
    icon: '📝',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'cs_data_structures',
    title: '資料結構與演算法 — 完整期末攻略',
    category: '學科資源',
    type: '筆記',
    departments: ['資工系', '人工智慧系'],
    grades: [1, 2],
    description: '包含 Stack、Queue、Tree、Graph 的實作，以及 BFS/DFS/DP 動態規劃解題模板。',
    url: 'https://leetcode.com',
    tags: ['資料結構', '演算法', '期末考'],
    featured: true,
    icon: '🌲',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'cs_network_security',
    title: '計算機網路 — OSI七層模型視覺化筆記',
    category: '學科資源',
    type: '筆記',
    departments: ['資工系'],
    grades: [2, 3],
    description: '以視覺化方式解析 TCP/IP 協定堆疊、HTTP/HTTPS 流程、DNS 查詢與常見網路攻擊原理。',
    url: 'https://hackmd.io',
    tags: ['計算機網路', 'TCP/IP', '資安'],
    featured: false,
    icon: '🌐',
    updatedAtFormatted: '2025-08'
  },
  {
    resourceId: 'cs_os_notes',
    title: '作業系統 — Process、Memory 管理重點整理',
    category: '學科資源',
    type: '筆記',
    departments: ['資工系'],
    grades: [2, 3],
    description: '涵蓋 Process Scheduling、Deadlock 預防、Virtual Memory 與 Page Replacement 演算法。',
    url: 'https://hackmd.io',
    tags: ['作業系統', 'OS', '期末重點'],
    featured: false,
    icon: '💻',
    updatedAtFormatted: '2025-07'
  },
  {
    resourceId: 'cs_embedded_lab',
    title: '嵌入式系統實驗室 — 研究方向與加入指南',
    category: '實驗室資訊',
    type: '介紹',
    departments: ['資工系'],
    grades: [2, 3, 4],
    description: '介紹靜宜大學資工系嵌入式系統實驗室的研究方向（IoT、RTOS），以及如何申請加入、所需能力與論文方向。',
    url: 'https://csie.pu.edu.tw',
    tags: ['實驗室', 'IoT', '嵌入式'],
    featured: true,
    icon: '🔬',
    updatedAtFormatted: '2025-09'
  },
  // 資管系 (IM) 資源
  {
    resourceId: 'im_database_notes',
    title: '資料庫管理系統 — SQL 完整語法速查表',
    category: '學科資源',
    type: '速查表',
    departments: ['資管系', '資工系'],
    grades: [1, 2],
    description: '涵蓋 SELECT、JOIN、GROUP BY、子查詢、索引優化，以及 ER-Diagram 設計方法論。',
    url: 'https://hackmd.io',
    tags: ['資料庫', 'SQL', '期中考'],
    featured: true,
    icon: '🗄️',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'im_project_management',
    title: '資訊專案管理 — 敏捷開發 Scrum 實戰筆記',
    category: '學科資源',
    type: '筆記',
    departments: ['資管系'],
    grades: [2, 3],
    description: '包含 Scrum 框架、Sprint 規劃、User Story 撰寫技巧與甘特圖製作，附上期末報告模板。',
    url: 'https://hackmd.io',
    tags: ['專案管理', 'Scrum', '敏捷開發'],
    featured: false,
    icon: '📋',
    updatedAtFormatted: '2025-08'
  },
  {
    resourceId: 'im_systems_analysis',
    title: '系統分析與設計 — UML 圖示完整教學',
    category: '學科資源',
    type: '教學',
    departments: ['資管系'],
    grades: [2, 3],
    description: '詳解 Use Case Diagram、Class Diagram、Sequence Diagram 的繪製方法與常見陷阱。',
    url: 'https://hackmd.io',
    tags: ['系統分析', 'UML', '設計模式'],
    featured: false,
    icon: '📐',
    updatedAtFormatted: '2025-07'
  },
  {
    resourceId: 'im_fintech_lab',
    title: '金融科技實驗室 — 研究方向與合作企業清單',
    category: '實驗室資訊',
    type: '介紹',
    departments: ['資管系'],
    grades: [2, 3, 4],
    description: '介紹靜宜大學資管系金融科技實驗室，包含研究項目、合作企業與學生實習機會。',
    url: 'https://im.pu.edu.tw',
    tags: ['實驗室', 'FinTech', '金融科技'],
    featured: true,
    icon: '💰',
    updatedAtFormatted: '2025-09'
  },
  // 人工智慧系 (AI) 資源
  {
    resourceId: 'ai_machine_learning',
    title: '機器學習入門 — scikit-learn 實作教學',
    category: '學科資源',
    type: '教學',
    departments: ['人工智慧系', '資工系'],
    grades: [2, 3],
    description: '從線性回歸到隨機森林，完整說明 scikit-learn 的使用方法，附帶 Kaggle 競賽實戰案例。',
    url: 'https://scikit-learn.org',
    tags: ['機器學習', 'Python', 'scikit-learn'],
    featured: true,
    icon: '🤖',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'ai_deep_learning',
    title: '深度學習實戰 — PyTorch 從零到一',
    category: '學科資源',
    type: '教學',
    departments: ['人工智慧系'],
    grades: [2, 3, 4],
    description: '涵蓋 CNN、RNN、Transformer 架構原理，以及如何在靜宜 GPU 伺服器上訓練模型。',
    url: 'https://pytorch.org/tutorials',
    tags: ['深度學習', 'PyTorch', 'CNN'],
    featured: false,
    icon: '🧠',
    updatedAtFormatted: '2025-08'
  },
  // 通用資源 (全系所)
  {
    resourceId: 'general_git_tutorial',
    title: 'Git / GitHub 版本控制完整教學',
    category: '常用工具',
    type: '教學',
    departments: ['資工系', '資管系', '人工智慧系'],
    grades: [1, 2, 3, 4],
    description: '從 git init 到 Pull Request，涵蓋分支策略、衝突解決與 GitHub Actions CI/CD 自動化。',
    url: 'https://learngitbranching.js.org/?locale=zh_TW',
    tags: ['Git', 'GitHub', '版本控制', '必學工具'],
    featured: true,
    icon: '🔀',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'general_internship_guide',
    title: '2025 靜宜資訊人實習指南 — 求職、履歷、面試全攻略',
    category: '職涯發展',
    type: '指南',
    departments: ['資工系', '資管系', '人工智慧系'],
    grades: [3, 4],
    description: '整理靜宜資訊學院學生常見的實習求職管道、履歷撰寫技巧，以及各大科技公司的面試題型分析。',
    url: 'https://hackmd.io',
    tags: ['實習', '履歷', '面試', '職涯'],
    featured: true,
    icon: '💼',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'general_coding_interview',
    title: 'LeetCode 刷題策略 — 資訊系學生面試地圖',
    category: '職涯發展',
    type: '指南',
    departments: ['資工系', '資管系', '人工智慧系'],
    grades: [3, 4],
    description: '針對台灣科技業面試的 LeetCode 刷題路線圖，包含 Easy/Medium 必刷題單與解題思路。',
    url: 'https://leetcode.com',
    tags: ['LeetCode', '面試準備', '演算法'],
    featured: false,
    icon: '🏆',
    updatedAtFormatted: '2025-08'
  },
  {
    resourceId: 'general_python_basics',
    title: 'Python 程式設計基礎 — 互動式入門',
    category: '學科資源',
    type: '線上課程',
    departments: ['資工系', '資管系', '人工智慧系'],
    grades: [1, 2],
    description: '透過 Codecademy 互動式平台，從零開始學習 Python 語法、函式、物件導向程式設計。',
    url: 'https://www.codecademy.com/learn/learn-python-3',
    tags: ['Python', '大一必學', '線上課程'],
    featured: false,
    icon: '🐍',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'general_web_dev',
    title: 'Web 前端開發入門 — HTML/CSS/JavaScript',
    category: '常用工具',
    type: '線上課程',
    departments: ['資工系', '資管系', '人工智慧系'],
    grades: [1, 2],
    description: 'MDN Web Docs 完整教學路線，適合想學習網頁開發基礎的同學。',
    url: 'https://developer.mozilla.org/zh-TW/docs/Learn',
    tags: ['HTML', 'CSS', 'JavaScript', '前端'],
    featured: false,
    icon: '🌐',
    updatedAtFormatted: '2025-09'
  },
  {
    resourceId: 'general_midterm_tips',
    title: '靜宜資訊學院 — 期中考備考技巧與時間管理',
    category: '考試備戰',
    type: '指南',
    departments: ['資工系', '資管系', '人工智慧系'],
    grades: [1, 2, 3, 4],
    description: '針對靜宜資訊學院各年級常見必修科目的期中考備考建議，包含時間分配與重點科目優先順序。',
    url: 'https://hackmd.io',
    tags: ['期中考', '時間管理', '備考'],
    featured: false,
    icon: '📆',
    updatedAtFormatted: '2025-09'
  }
];

const DEFAULT_PROFESSORS = [
  {
    name: "陳教授",
    title: "特聘教授 / 實驗室主持人",
    department: "CS",
    labName: "物聯網與分散式系統實驗室 (IoT & Distributed Systems Lab)",
    researchFields: ["IoT", "Edge Computing", "Cybersecurity", "Network Architecture"],
    email: "prof_chen@pu.edu.tw",
    office: "主顧樓 412 室",
    bio: "專注於智慧物聯網邊緣運算與輕量化安全協定研發，近年與台積電、光寶科技密切產學合作。",
    acceptingStudents: true
  },
  {
    name: "林主任",
    title: "系主任 / 教授",
    department: "IM",
    labName: "商業智慧與大數據決策實驗室 (BI & Data Analytics Lab)",
    researchFields: ["Data Warehousing", "ERP Systems", "Business Intelligence", "FinTech"],
    email: "prof_lin@pu.edu.tw",
    office: "主顧樓 308 室",
    bio: "深耕企業資源規劃 (ERP) 與金融大數據預測分析，主持鼎新電腦產學合作專案。",
    acceptingStudents: true
  },
  {
    name: "張博士",
    title: "副教授 / AI實驗室負責人",
    department: "AI",
    labName: "電腦視覺與深度學習實驗室 (Computer Vision & Deep Learning Lab)",
    researchFields: ["Computer Vision", "Deep Learning", "Generative AI", "Medical Imaging"],
    email: "prof_chang@pu.edu.tw",
    office: "主顧樓 518 室",
    bio: "專攻生成式 AI 與智慧醫療影像診斷，曾獲國科會優秀年輕學者研究計畫。",
    acceptingStudents: true
  }
];

/**
 * Seed initial Admin user
 */
async function seedAdminUser(customAdmin = {}) {
  const username = customAdmin.username || 'admin';
  const email = (customAdmin.email || 'admin@careerdna.pu.edu.tw').toLowerCase();
  const password = customAdmin.password || 'admin123';
  const name = customAdmin.name || '系統超級管理員 (Super Admin)';

  let adminUser = await User.findOne({
    $or: [{ username }, { email }, { role: 'admin' }]
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(password, 10);
    adminUser = await User.create({
      uid: 'admin_root_' + Date.now().toString(36),
      username,
      email,
      password: hashedPassword,
      name,
      displayName: name,
      school: '靜宜大學',
      department: 'IM',
      dept: 'IM',
      grade: '碩士',
      role: 'admin',
      isActive: true
    });
    console.log(`[Seeder] ✅ Created Default Admin: ${username} (password: ${password})`);
  } else {
    // Ensure role is admin
    if (adminUser.role !== 'admin' || !adminUser.isActive) {
      adminUser.role = 'admin';
      adminUser.isActive = true;
      await adminUser.save();
      console.log(`[Seeder] 🔄 Elevated existing user ${adminUser.username} to role: admin`);
    }
  }
  return adminUser;
}

/**
 * Seed resources from static array into MongoDB
 */
async function seedResources(force = false) {
  const count = await Resource.countDocuments();
  if (count === 0 || force) {
    let inserted = 0;
    for (const r of DEFAULT_RESOURCES) {
      await Resource.findOneAndUpdate(
        { resourceId: r.resourceId },
        { $set: r },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      inserted++;
    }
    console.log(`[Seeder] ✅ Synced ${inserted} Learning Resources to MongoDB`);
  }
}

/**
 * Seed professors
 */
async function seedProfessors(force = false) {
  const count = await Professor.countDocuments();
  if (count === 0 || force) {
    for (const p of DEFAULT_PROFESSORS) {
      await Professor.findOneAndUpdate(
        { name: p.name, department: p.department },
        { $set: p },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seeder] ✅ Seeded ${DEFAULT_PROFESSORS.length} Professors`);
  }
}

/**
 * Seed Categories
 */
async function seedCategories(force = false) {
  const count = await Category.countDocuments();
  if (count === 0 || force) {
    for (const c of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: c.name },
        { $set: c },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`[Seeder] ✅ Seeded ${DEFAULT_CATEGORIES.length} Categories`);
  }
}

/**
 * Master Seed Function
 */
async function runAllSeeds(options = {}) {
  try {
    await seedAdminUser(options.admin);
    await seedCategories(options.forceCategories);
    await seedResources(options.forceResources);
    await seedProfessors(options.forceProfessors);
    return { status: 'ok', message: 'Database seeding completed successfully' };
  } catch (err) {
    console.error('[Seeder Error]:', err);
    return { status: 'error', message: err.message };
  }
}

// Support direct CLI execution: node src/db/seed.js
if (require.main === module) {
  require('dotenv').config();
  (async () => {
    await connectDB();
    await runAllSeeds({ forceResources: true, forceProfessors: true });
    console.log('[Seeder CLI] Finished.');
    process.exit(0);
  })();
}

module.exports = {
  runAllSeeds,
  seedAdminUser,
  seedResources,
  seedProfessors
};
