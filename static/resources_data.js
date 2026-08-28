// CareerDNA Resource Library - Static Data
// Managed by admin. Update this file to add/edit resources.

window.RESOURCES_DATA = [
    // ===== 資工系 (CS) 資源 =====
    {
        id: 'cs_prog_fundamentals',
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
        updatedAt: '2025-09'
    },
    {
        id: 'cs_data_structures',
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
        updatedAt: '2025-09'
    },
    {
        id: 'cs_network_security',
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
        updatedAt: '2025-08'
    },
    {
        id: 'cs_os_notes',
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
        updatedAt: '2025-07'
    },
    {
        id: 'cs_embedded_lab',
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
        updatedAt: '2025-09'
    },
    // ===== 資管系 (IM) 資源 =====
    {
        id: 'im_database_notes',
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
        updatedAt: '2025-09'
    },
    {
        id: 'im_project_management',
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
        updatedAt: '2025-08'
    },
    {
        id: 'im_systems_analysis',
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
        updatedAt: '2025-07'
    },
    {
        id: 'im_fintech_lab',
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
        updatedAt: '2025-09'
    },
    // ===== 人工智慧系 (AI) 資源 =====
    {
        id: 'ai_machine_learning',
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
        updatedAt: '2025-09'
    },
    {
        id: 'ai_deep_learning',
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
        updatedAt: '2025-08'
    },
    // ===== 通用資源 (全系所) =====
    {
        id: 'general_git_tutorial',
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
        updatedAt: '2025-09'
    },
    {
        id: 'general_internship_guide',
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
        updatedAt: '2025-09'
    },
    {
        id: 'general_coding_interview',
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
        updatedAt: '2025-08'
    },
    {
        id: 'general_python_basics',
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
        updatedAt: '2025-09'
    },
    {
        id: 'general_web_dev',
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
        updatedAt: '2025-09'
    },
    {
        id: 'general_midterm_tips',
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
        updatedAt: '2025-09'
    }
];

window.RESOURCE_CATEGORIES = [
    { id: 'all', label: '全部資源', icon: '📚', color: 'blue' },
    { id: '學科資源', label: '學科資源', icon: '📖', color: 'indigo' },
    { id: '實驗室資訊', label: '實驗室資訊', icon: '🔬', color: 'purple' },
    { id: '職涯發展', label: '職涯發展', icon: '💼', color: 'teal' },
    { id: '考試備戰', label: '考試備戰', icon: '📋', color: 'amber' },
    { id: '常用工具', label: '常用工具', icon: '⚙️', color: 'slate' }
];

window.DEPT_DISPLAY_MAP = {
    '資工系': { label: '資訊工程系', key: 'CS', color: 'blue' },
    '資管系': { label: '資訊管理系', key: 'IM', color: 'teal' },
    '人工智慧系': { label: '人工智慧系', key: 'AI', color: 'purple' }
};
