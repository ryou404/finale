/**
 * CareerDNA - Resume Knowledge Engine (靜態履歷知識庫與能力證據推導引擎)
 * 
 * 核心原則（依企業 HR 審查標準與「五元三要」架構）：
 * 1. 課綱實證主義：技能必須有靜宜大學資院課綱依據，嚴禁 includes 模糊匹配與無中生有。
 * 2. 拒絕編造數據：未經使用者填寫之成果、數據、獎項一律以【使用者自行輸入：...】佔位標示。
 * 3. STAR 經驗公式：行動動詞 + 具體做法 + 成果數據 + 職務能力。
 * 4. JD 對焦機制：將企業職缺需求翻譯為個人「可驗證證據」，並依年級給予具體補強路徑。
 * 5. 五元三要：一信 (Cover Letter)、二資 (基本資料)、三歷 (經歷)、四專 (專長證照)、五傳 (自傳 500-800 字)。
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ResumeKnowledge = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ==========================================
    // 1. 課程證據表 (COURSE_EVIDENCE) - 13 群組
    // 全部課名均與靜宜大學 ACADEMIC_DATA 嚴格一致
    // ==========================================
    const COURSE_EVIDENCE = [
        {
            id: 'prog_basics',
            title: '程式基礎與物件導向',
            courses: ['程式設計', '程式語言', '軟體設計與開發', 'Python程式設計', 'Python應用實務'],
            skills: [
                { name: '物件導向程式設計思維 (OOP)', basis: '程式設計 / 程式語言', testCourses: ['程式設計', '程式語言'] },
                { name: '模組化軟體架構與 Git 版本控管', basis: '軟體設計與開發', testCourses: ['軟體設計與開發'] },
                { name: 'Python 實務應用與腳本自動化', basis: 'Python程式設計 / Python應用實務', testCourses: ['Python程式設計', 'Python應用實務'] }
            ],
            forbid: ['若僅修程式設計不得冒稱精通 Python', 'C++ 系統架構師'],
            starPrompt: {
                situation: '在程式核心課程中，需落實模組化設計與清晰程式碼架構',
                task: '負責核心運算邏輯之類別設計、例外處理與單元測試',
                action: '【使用者自行輸入：撰寫業務邏輯時採用的具體做法與物件導向設計】',
                result: '【使用者自行輸入：功能實作成效，如：程式碼可維護性提升、順利通過所有測試範例】'
            },
            jdKeys: ['fullstack', 'frontend', 'backend', 'data_ai', 'sa_pm', 'erp', 'devops_sec']
        },
        {
            id: 'data_structures',
            title: '資料結構與演算法分析',
            courses: ['資料結構', '進階資料結構', '演算法概論', '進階演算法'],
            skills: [
                { name: '核心資料結構 (陣列/堆疊/佇列/樹/圖/雜湊表)', basis: '資料結構 / 進階資料結構', testCourses: ['資料結構', '進階資料結構'] },
                { name: '演算法邏輯與時間/空間複雜度分析 (Big-O)', basis: '演算法概論 / 進階演算法', testCourses: ['演算法概論', '進階演算法'] }
            ],
            forbid: ['LeetCode Hard 精通（除非附個人競程證明）'],
            starPrompt: {
                situation: '面對大量資料之存取、檢索或排序運算效能瓶頸',
                task: '挑選並實作最佳資料結構，優化程式運算效率',
                action: '【使用者自行輸入：評估 Big-O 複雜度並改寫演算法的具體步驟】',
                result: '【使用者自行輸入：執行效率改善成果，如：運算時間複雜度從 O(N^2) 降至 O(N log N)】'
            },
            jdKeys: ['fullstack', 'backend', 'data_ai']
        },
        {
            id: 'databases',
            title: '關聯式資料庫與資料塑模',
            courses: ['資料庫系統實作', '資料庫管理'],
            skills: [
                { name: 'SQL 關聯式查詢語法 (CRUD / JOIN / 聚合運算)', basis: '資料庫系統實作 / 資料庫管理', testCourses: ['資料庫系統實作', '資料庫管理'] },
                { name: 'ER Model 實體關聯圖繪製與資料綱要正規化', basis: '資料庫系統實作', testCourses: ['資料庫系統實作'] }
            ],
            forbid: ['Oracle DBA 認證', '高併發分庫分表（課綱未包含）', 'PostgreSQL / MySQL（課綱未指定特定引擎）'],
            starPrompt: {
                situation: '在專案實作中需為業務流程建置結構化關聯資料模型',
                task: '規劃資料表欄位、主外鍵關聯並消除資料冗餘',
                action: '【使用者自行輸入：正規化至 3NF 之設計過程與複雜 SQL 查詢實作】',
                result: '【使用者自行輸入：資料庫查詢穩定性與資料一致性驗證結果】'
            },
            jdKeys: ['fullstack', 'backend', 'data_ai', 'erp', 'sa_pm']
        },
        {
            id: 'web_frontend',
            title: '網頁前端與人機介面開發',
            courses: ['網頁前端程式設計', '人機介面與使用者經驗設計'],
            skills: [
                { name: '語意化 HTML5 / 現代 CSS3 響應式排版 (RWD)', basis: '網頁前端程式設計', testCourses: ['網頁前端程式設計'] },
                { name: '現代 JavaScript (ES6+) 與 DOM 動態互動處理', basis: '網頁前端程式設計', testCourses: ['網頁前端程式設計'] },
                { name: '人機介面可用性原則與使用者體驗設計 (UI/UX)', basis: '人機介面與使用者經驗設計', testCourses: ['人機介面與使用者經驗設計'] }
            ],
            forbid: ['React/Vue 生態系精通（除非專題實作佐證）', '前端工程化 Webpack/Vite 深度架構'],
            starPrompt: {
                situation: '需為跨裝置使用者打造直覺、易用且排版穩定的網頁介面',
                task: '將設計稿轉化為響應式網頁並處理前端即時互動',
                action: '【使用者自行輸入：運用 HTML/CSS/JS 解決 RWD 或 DOM 互動的具體做法】',
                result: '【使用者自行輸入：介面於手機/平板/桌面各解析度之適配成果】'
            },
            jdKeys: ['fullstack', 'frontend']
        },
        {
            id: 'web_backend',
            title: '動態後端與 API 系統實作',
            courses: ['動態網頁設計', '網站系統實作', '網路程式設計'],
            skills: [
                { name: '動態後端服務架構與 RESTful API 設計概念', basis: '動態網頁設計 / 網站系統實作', testCourses: ['動態網頁設計', '網站系統實作'] },
                { name: '前後端資料串接與 JSON 資料格式處理', basis: '動態網頁設計', testCourses: ['動態網頁設計'] },
                { name: '網路通訊 Socket 程式設計基礎', basis: '網路程式設計', testCourses: ['網路程式設計'] }
            ],
            forbid: ['微服務高可用集群 (課綱未含)', 'Kafka 分散式訊息隊列'],
            starPrompt: {
                situation: '系統需打通前後端資料流並提供安全可靠的 API 服務',
                task: '定義 RESTful 路由規格、實作業務邏輯與例外狀況回應',
                action: '【使用者自行輸入：後端端點實作與前後端資料格式對接做法】',
                result: '【使用者自行輸入：端對端整合測試通過並成功完成系統功能驗證】'
            },
            jdKeys: ['fullstack', 'backend', 'sa_pm']
        },
        {
            id: 'system_analysis',
            title: '系統分析、UML 建模與專案管理',
            courses: ['系統分析與設計', '資訊軟體實作', '專案管理'],
            skills: [
                { name: 'UML 系統建模 (Use Case / Class / Sequence Diagram)', basis: '系統分析與設計', testCourses: ['系統分析與設計'] },
                { name: '軟體需求訪談與功能規格書撰寫 (Spec)', basis: '系統分析與設計', testCourses: ['系統分析與設計'] },
                { name: '專案時程管理與敏捷團隊協作概念', basis: '專案管理', testCourses: ['專案管理'] }
            ],
            forbid: ['PMP 專案管理師認證', '大型跨國企業敏捷教練'],
            starPrompt: {
                situation: '在專案初期面臨多元且可能變動之使用者需求',
                task: '梳理系統業務邏輯，制定明確功能規格與模組邊界',
                action: '【使用者自行輸入：繪製 UML 藍圖與撰寫規格書之具體方法】',
                result: '【使用者自行輸入：團隊依循規格順利推進開發之成效】'
            },
            jdKeys: ['sa_pm', 'erp', 'fullstack']
        },
        {
            id: 'networking',
            title: '網路通訊協定與系統管理',
            courses: ['網路通訊概論', '計算機網路', '系統與網路管理', '網路通訊協定', '網路系統建構實務', '區域網路概論', 'Linux系統與網路管理'],
            skills: [
                { name: '計算機網路協定與 OSI / TCP-IP 核心概念', basis: '計算機網路 / 網路通訊概論', testCourses: ['計算機網路', '網路通訊概論'] },
                { name: 'Linux 伺服器基礎維運與常用指令操作', basis: 'Linux系統與網路管理 / 系統與網路管理', testCourses: ['Linux系統與網路管理', '系統與網路管理'] },
                { name: '區域網路架構與子網切分規劃', basis: '區域網路概論 / 網路系統建構實務', testCourses: ['區域網路概論', '網路系統建構實務'] }
            ],
            forbid: ['CCIE 認證', 'Docker/K8s 容器叢集（應屬雲端課程）'],
            starPrompt: {
                situation: '排查網路傳輸連線異常或設定基礎伺服器運行環境',
                task: '分析網路封包流向與主機網路配置參數',
                action: '【使用者自行輸入：檢視路由、IP 設定或執行 Linux 指令之排查做法】',
                result: '【使用者自行輸入：確保主機與網路環境連線穩定之成果】'
            },
            jdKeys: ['devops_sec', 'backend']
        },
        {
            id: 'ai_data',
            title: '人工智慧、機器學習與大數據分析',
            courses: ['人工智慧概論', '人工智慧', '機器學習', '深度學習', '大數據分析', '巨量資料分析導論', '商業智慧與資料倉儲', '高等人工智慧學', '電腦視覺概論'],
            skills: [
                { name: '機器學習與深度學習核心演算法概念', basis: '人工智慧概論 / 機器學習', testCourses: ['人工智慧概論', '人工智慧', '機器學習', '深度學習'] },
                { name: 'Python 數據分析與 TensorFlow/Keras 應用基礎', basis: '大數據分析 (課綱包含 TensorFlow/Keras)', testCourses: ['大數據分析'] },
                { name: '商業智慧 (BI) 報表分析與資料倉儲概念', basis: '商業智慧與資料倉儲', testCourses: ['商業智慧與資料倉儲'] },
                { name: '數位影像處理與電腦視覺概念', basis: '電腦視覺概論 / 影像處理', testCourses: ['電腦視覺概論', '影像處理'] }
            ],
            forbid: ['PyTorch（靜宜資院課綱出現 0 次，除非個人專案證明）', '大型語言模型 (LLM) 預訓練專家'],
            starPrompt: {
                situation: '面對多元資料集需進行特徵探索與預測模型評估',
                task: '執行資料前處理、特徵清洗並評估演算法指標',
                action: '【使用者自行輸入：使用工具進行資料清洗、特徵工程與模型訓練之做法】',
                result: '【使用者自行輸入：模型在驗證集之準確度指標或資料可視化報告】'
            },
            jdKeys: ['data_ai']
        },
        {
            id: 'erp',
            title: '企業資源規劃 (ERP) 與商業流程管理',
            courses: ['企業資源規劃', '運籌管理資訊系統', '財務會計資訊系統', '人力資源管理系統', 'ABAP程式設計', '企業流程管理', '企業資源規劃系統管理'],
            skills: [
                { name: '企業資源規劃 (ERP) 核心模組與業務流程運作', basis: '企業資源規劃', testCourses: ['企業資源規劃'] },
                { name: 'SAP ABAP 程式語言基礎語法與報表概念', basis: 'ABAP程式設計', testCourses: ['ABAP程式設計'] },
                { name: '供應鏈運籌管理與企業流程 (BPM) 分析', basis: '運籌管理資訊系統 / 企業流程管理', testCourses: ['運籌管理資訊系統', '企業流程管理'] }
            ],
            forbid: ['SAP 官方頂級解決方案架構師認證'],
            starPrompt: {
                situation: '梳理企業跨部門業務傳遞流程與表單資料一致性',
                task: '對齊進銷存/財會作業流程，消弭資訊孤島',
                action: '【使用者自行輸入：以 ERP 概念或 BPM 工具繪製流程圖之做法】',
                result: '【使用者自行輸入：產出結構化之業務流程作業說明文件】'
            },
            jdKeys: ['erp', 'sa_pm']
        },
        {
            id: 'cloud',
            title: '雲端技術與容器化應用',
            courses: ['雲端技術與應用'],
            skills: [
                { name: '容器化應用技術 (Docker)', basis: '雲端技術與應用 (課綱 4/4 班明確教授 Docker)', testCourses: ['雲端技術與應用'] },
                { name: '雲端虛擬化架構與雲端運算部署思維', basis: '雲端技術與應用', testCourses: ['雲端技術與應用'] }
            ],
            forbid: ['Kubernetes 多叢集維運架構師', 'AWS Solution Architect Professional 認證'],
            starPrompt: {
                situation: '需將應用程式封裝為標準映像檔以確保跨環境一致性',
                task: '編寫 Dockerfile、建立容器鏡像並進行端口與環境變數配置',
                action: '【使用者自行輸入：運用 Docker 進行服務容器化之具體指令與流程】',
                result: '【使用者自行輸入：成功在本地及測試主機啟動容器服務，消弭環境相容問題】'
            },
            jdKeys: ['devops_sec', 'fullstack', 'backend']
        },
        {
            id: 'mobile',
            title: '行動終端軟體開發 (Mobile App)',
            courses: ['行動應用軟體開發', '進階行動應用軟體開發', '行動應用軟體開發/ iOS APP 實務設計'],
            skills: [
                { name: '行動裝置應用程式開發 (Mobile App Development)', basis: '行動應用軟體開發', testCourses: ['行動應用軟體開發', '行動應用軟體開發/ iOS APP 實務設計'] },
                { name: '行動端生命週期與互動觸控介面適配', basis: '行動應用軟體開發', testCourses: ['行動應用軟體開發', '進階行動應用軟體開發'] }
            ],
            forbid: ['百萬下載量 App 獨立維運專家'],
            starPrompt: {
                situation: '需為行動裝置使用者開發便於操作之獨立 App 原型',
                task: '實作頁面導航、生命週期事件監聽與本地端資料持久化',
                action: '【使用者自行輸入：行動應用介面設計與 API 串接之實作歷程】',
                result: '【使用者自行輸入：成功於模擬器或實機順暢運行並展示核心功能】'
            },
            jdKeys: ['frontend', 'fullstack']
        },
        {
            id: 'mgmt_stats',
            title: '管理科學、商務決策與統計分析',
            courses: ['管理學', '統計學(一)', '行銷管理', '經濟學', '管理科學'],
            skills: [
                { name: '統計假設檢定與量化資料解讀能力', basis: '統計學(一)', testCourses: ['統計學(一)'] },
                { name: '組織管理思維與跨部門溝通協作邏輯', basis: '管理學', testCourses: ['管理學'] }
            ],
            forbid: ['六標準差黑帶大師認證'],
            starPrompt: {
                situation: '在專案評估或市場分析時需透過量化數據支持推論',
                task: '運用統計工具抽樣並分析樣本分佈與相關性',
                action: '【使用者自行輸入：執行描述性統計與假設檢定之具體過程】',
                result: '【使用者自行輸入：以數據為導向產出客觀且具說服力之決策建議】'
            },
            jdKeys: ['sa_pm', 'erp', 'data_ai']
        },
        {
            id: 'security',
            title: '資訊安全防護與安全軟體開發',
            courses: ['資訊安全概論', '資訊安全管理', '安全程式設計', '系統安全', '資訊安全導論', '網路安全'],
            skills: [
                { name: '資訊安全核心概念與常見網路威脅防護 (OWASP Top 10)', basis: '資訊安全概論 / 安全程式設計', testCourses: ['資訊安全概論', '安全程式設計', '資訊安全導論'] },
                { name: '安全程式設計思維 (輸入驗證與防禦性編程)', basis: '安全程式設計', testCourses: ['安全程式設計'] }
            ],
            forbid: ['CISSP 頂級資安稽核員', '國家級滲透攻防實戰專家'],
            starPrompt: {
                situation: '系統開發過程中需防範潛在安全漏洞與未經授權之資料存取',
                task: '檢視輸入過濾、身分驗證與敏感資料傳輸保護機制',
                action: '【使用者自行輸入：在代碼中落實防禦性編程與漏洞修補做法】',
                result: '【使用者自行輸入：有效防範 SQL 注入與 XSS 等常見攻擊風險】'
            },
            jdKeys: ['devops_sec', 'backend']
        },
        {
            id: 'capstone',
            title: '專案實作與跨領域研究',
            courses: ['專案實作(二)', '專案實作(二)(合授課程)', '個別研究(一)', '論文研討(一)', '研究方法'],
            skills: [
                { name: '大型綜合專題規劃與端對端軟體工程落實', basis: '專案實作(二)', testCourses: ['專案實作(二)', '專案實作(二)(合授課程)'] },
                { name: '技術文獻探討與獨立研究方法論', basis: '個別研究(一) / 研究方法', testCourses: ['個別研究(一)', '研究方法'] }
            ],
            forbid: ['未經實作驗證之過度誇大宣稱'],
            starPrompt: {
                situation: '整合大學數年所學，於團隊中共同完成具備產業可行性之核心專題',
                task: '主導或參與核心模組開發，定期交付 Sprint 進度並通過各階段審查',
                action: '【使用者自行輸入：在專題中所承擔的核心責任與關鍵技術突破】',
                result: '【使用者自行輸入：成果展展示成果與評審肯定反饋】'
            },
            jdKeys: ['fullstack', 'frontend', 'backend', 'data_ai', 'sa_pm', 'erp', 'devops_sec']
        }
    ];

    // ==========================================
    // 2. 職缺預設包 (ROLE_PRESETS) - 7 大科技職缺
    // 深度對齊「JD 對焦表」：企業需求 -> 企業真正要什麼 -> 我的能力證據 (修課) -> 缺口補強
    // ==========================================
    const ROLE_PRESETS = {
        fullstack: {
            key: 'fullstack',
            title: '全端軟體工程師 (Full-Stack Engineer)',
            defaultDept: 'CS',
            description: '負責現代 Web 應用之前後端架構串接、資料庫持久化與完整端對端功能交付。',
            jdItems: [
                {
                    jdRequirement: '具備物件導向程式設計基礎，熟悉至少一種主流程式語言',
                    businessNeed: '代碼結構清晰、易於維護，能迅速理解團隊既有代碼庫並進行模組化擴充',
                    courseEvidenceCourses: ['程式設計', '程式語言', '軟體設計與開發'],
                    actionWhenMissing: '選修《軟體設計與開發》或《程式設計》，掌握物件導向 (OOP) 抽象與封裝思維，並在 GitHub 累積個人練習倉庫。',
                    sampleGoodStar: '在《軟體設計與開發》期末專題中，運用物件導向設計原則拆解 4 個核心業務模組，使模組間耦合度大幅降低，並全數通過單元測試。',
                    ngAntiPattern: '只寫「精通多種程式語言」，卻沒有列出修課佐證或專案實作倉庫。'
                },
                {
                    jdRequirement: '熟悉現代 HTML5/CSS3 響應式排版 (RWD) 與 JavaScript 互動',
                    businessNeed: '能獨立依據 UI/UX 規格產出跨行動與桌面解析度之高相容介面',
                    courseEvidenceCourses: ['網頁前端程式設計', '人機介面與使用者經驗設計'],
                    actionWhenMissing: '選修《網頁前端程式設計》，熟悉現代 Flex/Grid 排版與 DOM 事件控制，建立個人響應式作品集網頁。',
                    sampleGoodStar: '於《網頁前端程式設計》課程中，獨立實作具備 3 種斷點 (Mobile/Tablet/Desktop) 的響應式電商首頁，排版無跑版破圖。',
                    ngAntiPattern: '寫「精通前端前端高手」，但履歷完全沒有作品集 Demo 連結或課堂作業。'
                },
                {
                    jdRequirement: '理解關聯式資料庫設計，具備 SQL 語法編寫與正規化概念',
                    businessNeed: '能設計合理的資料表綱要，避免資料異常冗餘，並能撰寫有效率的查詢',
                    courseEvidenceCourses: ['資料庫系統實作', '資料庫管理'],
                    actionWhenMissing: '選修《資料庫系統實作》，親手繪製 ER Model 正規化至 3NF，並練習多表 JOIN 與彙總查詢。',
                    sampleGoodStar: '在《資料庫系統實作》專案中，規劃 8 張關聯資料表並正規化至 3NF，撰寫包含多表關聯之複合查詢並成功驗證資料一致性。',
                    ngAntiPattern: '寫「熟練 MySQL/PostgreSQL DBA 架構」，但課綱未授課且無實際資料庫調優紀錄。'
                },
                {
                    jdRequirement: '具備 RESTful API 串接與動態服務整合經驗',
                    businessNeed: '能與前端或後端團隊以標準 JSON 格式傳遞資料，妥善處理錯誤狀態碼',
                    courseEvidenceCourses: ['動態網頁設計', '網站系統實作', '網路程式設計'],
                    actionWhenMissing: '選修《動態網頁設計》，實作動態後端端點並與前端表單對接，完成端對端資料持久化。',
                    sampleGoodStar: '修讀《動態網頁設計》，實作 6 支符合 RESTful 規範之 API 端點，支援分頁與條件過濾查詢，並完成前端資料即時渲染。',
                    ngAntiPattern: '僅寫「會寫 API」，未交代所採用的傳輸格式、安全驗證或例外狀況防護機制。'
                }
            ]
        },
        frontend: {
            key: 'frontend',
            title: '前端工程師 (Front-End Engineer)',
            defaultDept: 'CS',
            description: '專注於使用者介面體驗、跨裝置相容排版、動態資料互動與前端效能優化。',
            jdItems: [
                {
                    jdRequirement: '熟練掌握語意化 HTML5 與現代 CSS3 響應式佈局 (RWD)',
                    businessNeed: '確保頁面在不同裝置與瀏覽器上呈現一致且具備良好無障礙基礎',
                    courseEvidenceCourses: ['網頁前端程式設計'],
                    actionWhenMissing: '修讀《網頁前端程式設計》，深入掌握 CSS Flexbox/Grid 佈局模式，完成個人響應式作品展示頁。',
                    sampleGoodStar: '於《網頁前端程式設計》中，手刻語意化 HTML5 標籤與 CSS Grid 排版，於手機、平板與寬螢幕下通過多視窗相容性測試。',
                    ngAntiPattern: '誇大宣稱「精通 CSS 動畫與全套架構」，卻無法回答行動端斷點與語意化標籤差異。'
                },
                {
                    jdRequirement: '熟悉 JavaScript (ES6+) 與非同步資料請求 (Fetch / AJAX / Promise)',
                    businessNeed: '具備串接第三方或後端 API 之能力，能妥善處理載入中、錯誤與成功狀態',
                    courseEvidenceCourses: ['網頁前端程式設計', '動態網頁設計'],
                    actionWhenMissing: '選修《網頁前端程式設計》與《動態網頁設計》，練習原生 JS DOM 操作與非同步資料抓取。',
                    sampleGoodStar: '使用 ES6+ Async/Await 語法串接公開 REST API，於前端實作即時搜尋關鍵字防抖 (Debounce) 與動態列表渲染。',
                    ngAntiPattern: '寫「精通 React/Vue 全家桶」，但若未在專題中落實，面試被問底層生命週期會瞬間破功。'
                },
                {
                    jdRequirement: '具備使用者體驗 (UI/UX) 與人機介面可用性思維',
                    businessNeed: '不僅看代碼，更在意使用者操作流暢度、視覺層次與防呆反饋機制',
                    courseEvidenceCourses: ['人機介面與使用者經驗設計'],
                    actionWhenMissing: '選修《人機介面與使用者經驗設計》，學習介面可用性評估指標，並將專案 Wireframe 納入作品集。',
                    sampleGoodStar: '修讀《人機介面與使用者經驗設計》，完成使用者旅程地圖規劃與操作流程易用性評估，大幅簡化表單輸入步驟。',
                    ngAntiPattern: '自稱「具備美感」，卻無具體之線框圖 (Wireframe) 或易用性評估案例。'
                }
            ]
        },
        backend: {
            key: 'backend',
            title: '後端軟體工程師 (Back-End Engineer)',
            defaultDept: 'CS',
            description: '專注於業務邏輯架構、API 端點安全設計、資料庫查詢調校與高穩定後端服務。',
            jdItems: [
                {
                    jdRequirement: '精熟物件導向程式設計，具備良好的資料結構與演算法底子',
                    businessNeed: '撰寫具備良好抽象性、低耦合之業務邏輯，能在效能與空間複雜度中取得平衡',
                    courseEvidenceCourses: ['程式設計', '資料結構', '演算法概論', '軟體設計與開發'],
                    actionWhenMissing: '修讀《資料結構》與《演算法概論》，打穩 Big-O 評估思維，理解常見樹與圖狀運算機制。',
                    sampleGoodStar: '在《資料結構》課程中，親手實作雜湊表 (Hash Table) 衝突處理與二元搜尋樹遍歷，並完成效能對比評估。',
                    ngAntiPattern: '自稱「演算法大神」，卻寫不出基本的排序複雜度或資料結構選擇依據。'
                },
                {
                    jdRequirement: '熟悉關聯式資料庫設計，能編寫複雜 SQL 並具備資料庫正規化知識',
                    businessNeed: '能依業務需求建構關聯綱要，保證交易完整性與資料庫持久化穩定',
                    courseEvidenceCourses: ['資料庫系統實作', '資料庫管理'],
                    actionWhenMissing: '修讀《資料庫系統實作》，練習從業務需求推導 ER Model 並正規化至 3NF，編寫多表關聯查詢。',
                    sampleGoodStar: '於《資料庫系統實作》專案中，設計涵蓋 10 張實體之正規化關聯模型，並針對核心查詢撰寫 Index 優化方案。',
                    ngAntiPattern: '只寫「熟練 MySQL」，卻沒有交代如何規劃資料綱要或處理關聯限制。'
                },
                {
                    jdRequirement: '具備 RESTful API 開發與網路通訊協定概念',
                    businessNeed: '能規範清晰之 API 接口契約，理解 HTTP 狀態碼與 TCP/IP 基礎',
                    courseEvidenceCourses: ['動態網頁設計', '網路通訊概論', '計算機網路'],
                    actionWhenMissing: '選修《動態網頁設計》與《計算機網路》，理解 HTTP/HTTPS 請求生命週期與 API 設計原則。',
                    sampleGoodStar: '實作具備身分驗證與輸入參數校驗之 RESTful API，妥善處理 400/404/500 等狀態回應，確保後端穩固。',
                    ngAntiPattern: '寫「高併發微服務分散式架構」，但無實際壓測數據與分散式協調實戰，易被人資視為誇大。'
                }
            ]
        },
        data_ai: {
            key: 'data_ai',
            title: '資料分析與 AI 應用工程師 (Data & AI Engineer)',
            defaultDept: 'AI',
            description: '運用統計學方法、機器學習模型與資料前處理技術，挖掘數據價值並輔助商業決策。',
            jdItems: [
                {
                    jdRequirement: '熟悉機器學習與人工智慧基本演算法與評估指標',
                    businessNeed: '能依問題類型（分類/迴歸/分群）選擇合適模型，並能客觀評估準確率、Recall、F1-score',
                    courseEvidenceCourses: ['人工智慧概論', '人工智慧', '機器學習', '深度學習'],
                    actionWhenMissing: '修讀《機器學習》與《人工智慧概論》，理解監督式與非監督式演算法原理，完成特徵工程與交叉驗證。',
                    sampleGoodStar: '在《機器學習》課堂專案中，針對分類數據集進行資料前處理、特徵縮放與混淆矩陣分析，客觀評估模型表現。',
                    ngAntiPattern: '寫「精通 PyTorch 與大型模型訓練」，但在課綱無相關課程且未附 GitHub 訓練代碼時極易失真。'
                },
                {
                    jdRequirement: '具備 Python 數據分析或大數據分析工具應用基礎',
                    businessNeed: '能運用程式語言進行資料清洗、缺失值填補、特徵萃取與視覺化呈現',
                    courseEvidenceCourses: ['大數據分析', 'Python應用實務', 'Python程式設計'],
                    actionWhenMissing: '選修《大數據分析》或《Python應用實務》，掌握數據前處理流程與視覺化圖表產出。',
                    sampleGoodStar: '修讀《大數據分析》，運用 Python 進行萬筆數據之缺失值插補、異常值過濾與散佈圖分佈可視化分析。',
                    ngAntiPattern: '只寫「精通大數據」，未提及實際處理之資料維度、清洗流程或所解決之問題。'
                },
                {
                    jdRequirement: '具備統計推論與量化分析思維，能解讀數據背後商業含意',
                    businessNeed: '避免空談技術，能以統計假設檢定驗證商業假說，產出清晰的決策洞察',
                    courseEvidenceCourses: ['統計學(一)', '商業智慧與資料倉儲', '巨量資料分析導論'],
                    actionWhenMissing: '選修《統計學(一)》與《商業智慧與資料倉儲》，打好假設檢定、信賴區間與 BI 報表分析能力。',
                    sampleGoodStar: '於《商業智慧與資料倉儲》專題中，運用多維度資料立方體 (Cube) 進行樞紐交叉分析，產出具備洞見之分析報告。',
                    ngAntiPattern: '將自傳寫成純理論探討，缺少「數據洞察 -> 業務行動 -> 預期效益」之具體連結。'
                }
            ]
        },
        sa_pm: {
            key: 'sa_pm',
            title: '系統分析與專案管理師 (SA / PM)',
            defaultDept: 'IM',
            description: '跨越技術與業務端之橋樑，負責使用者需求訪談、UML 規格藍圖、時程控管與敏捷協調。',
            jdItems: [
                {
                    jdRequirement: '具備系統分析與 UML 建模能力，能撰寫清晰之功能規格書 (Spec)',
                    businessNeed: '能將模糊之使用者需求轉化為研發團隊可依循之精確藍圖，釐清系統責任邊界',
                    courseEvidenceCourses: ['系統分析與設計', '資訊軟體實作'],
                    actionWhenMissing: '選修《系統分析與設計》，親手繪製 Use Case 圖、活動圖與循序圖，產出標準軟體規格書。',
                    sampleGoodStar: '在《系統分析與設計》期末專案中擔任 SA，訪談利害關係人並產出包含 12 項 Use Case 與活動圖之完整功能規格書。',
                    ngAntiPattern: '寫「具備卓越溝通能力」，卻無任何需求訪談、規格文件或 UML 建模作品佐證。'
                },
                {
                    jdRequirement: '理解資料庫關聯模型與系統資料流向 (Data Flow)',
                    businessNeed: '能與後端架構師流暢對話，確保業務實體關聯設計符合長遠擴充彈性',
                    courseEvidenceCourses: ['資料庫系統實作', '資料庫管理'],
                    actionWhenMissing: '選修《資料庫系統實作》，理解實體關聯圖 (ERD) 與資料正規化流程。',
                    sampleGoodStar: '依據業務場景規劃 ER Model，標記各實體主鍵、外鍵及一對多關係，使開發團隊縮減 30% 之溝通成本。',
                    ngAntiPattern: '只著重管理文字，忽視技術名詞正確性，導致技術面試時無法與工程師溝通。'
                },
                {
                    jdRequirement: '具備專案時程控管、里程碑設定與團隊協調能力',
                    businessNeed: '能掌握敏捷 Sprint 節奏或甘特圖關鍵路徑，在有限時間內協調資源並控管風險',
                    courseEvidenceCourses: ['專案管理', '管理學'],
                    actionWhenMissing: '選修《專案管理》，學習 WBS 工作分解結構、甘特圖排程與風險評估矩陣。',
                    sampleGoodStar: '在分組實作中運用 WBS 拆解專案為 3 個里程碑，主持每週進度同步會議，確保所有任務於期限內全數完成。',
                    ngAntiPattern: '空泛寫「領導能力強」，沒有列舉出遇過何種專案衝突與如何實質解決之案例。'
                }
            ]
        },
        erp: {
            key: 'erp',
            title: 'ERP 系統顧問 / 業務流程分析師 (ERP Consultant)',
            defaultDept: 'IM',
            description: '專精於企業資源規劃、進銷存與財會流程整合，協助企業數位轉型並推動標準流程落地。',
            jdItems: [
                {
                    jdRequirement: '熟悉企業資源規劃 (ERP) 核心概念與跨部門商業流程',
                    businessNeed: '理解訂單到收款 (O2C)、採購到付款 (P2P) 等核心鏈路，能辨別流程斷點',
                    courseEvidenceCourses: ['企業資源規劃', '運籌管理資訊系統', '企業流程管理'],
                    actionWhenMissing: '選修《企業資源規劃》與《運籌管理資訊系統》，系統化梳理企業產銷人發財之流程串接。',
                    sampleGoodStar: '修讀《企業資源規劃》，實機演練進銷存與生產排程流程，深入理解跨部門表單傳遞與過帳邏輯。',
                    ngAntiPattern: '自稱「精通 SAP 全模組實作」，但實際上僅修過概論課，應誠實說明具備流程基礎。'
                },
                {
                    jdRequirement: '理解企業軟體開發邏輯，具備 ABAP 程式語言或客製報表基礎',
                    businessNeed: '能擔任業務端與客製程式設計師之橋樑，撰寫 Functional Spec 並理解程式邏輯',
                    courseEvidenceCourses: ['ABAP程式設計', '程式設計'],
                    actionWhenMissing: '選修《ABAP程式設計》，理解 SAP 資料字典 (Data Dictionary) 與基礎報表語法結構。',
                    sampleGoodStar: '在《ABAP程式設計》中，學習資料字典表格宣告與基礎 Open SQL 查詢語法，完成簡易查詢報表之編寫。',
                    ngAntiPattern: '未曾接觸過 SAP 系統畫面，卻宣稱具備顧問級客製實務。'
                },
                {
                    jdRequirement: '具備商業邏輯思維與企業營運管理觀念',
                    businessNeed: '能以財務、成本與營運效益角度評估流程優化之投資報酬',
                    courseEvidenceCourses: ['財務會計資訊系統', '管理學', '管理科學'],
                    actionWhenMissing: '選修《財務會計資訊系統》或《管理學》，建立損益、資產負債與成本控管觀念。',
                    sampleGoodStar: '修讀《財務會計資訊系統》，熟悉借貸平衡原理與總帳科目立帳流程，具備跨域商業溝通底子。',
                    ngAntiPattern: '缺乏商業常識，將 ERP 當成純資料庫操作軟體，忽視企業內控與稽核概念。'
                }
            ]
        },
        devops_sec: {
            key: 'devops_sec',
            title: '雲端維運與資訊安全工程師 (DevOps & Security)',
            defaultDept: 'CS',
            description: '專注於伺服器維運管理、網路通訊安全防護、容器化標準化部署與系統可靠性工程。',
            jdItems: [
                {
                    jdRequirement: '熟悉 Linux 作業系統常用指令與基礎伺服器網路環境設定',
                    businessNeed: '能獨立於命令列終端機排查連線、檔案權限、進程狀態與日誌檔案',
                    courseEvidenceCourses: ['Linux系統與網路管理', '計算機網路', '系統與網路管理'],
                    actionWhenMissing: '選修《Linux系統與網路管理》，熟練 bash 指令、使用者群組權限與 SSH 連線配置。',
                    sampleGoodStar: '修讀《Linux系統與網路管理》，於虛擬機中配置靜態 IP、SSH 金鑰登入與 firewall 防火牆規則，確保環境安全。',
                    ngAntiPattern: '只修過《網路行銷》或概論課，卻宣稱熟練 Linux 系統維運。'
                },
                {
                    jdRequirement: '理解容器化技術概念 (Docker)，具備應用程式部署思維',
                    businessNeed: '能透過容器封裝應用依賴，確保程式從本機開發到雲端測試機之行為一致',
                    courseEvidenceCourses: ['雲端技術與應用'],
                    actionWhenMissing: '修讀《雲端技術與應用》（資工/資管重點實務課），實際編寫 Dockerfile 並啟動容器服務。',
                    sampleGoodStar: '在《雲端技術與應用》中，編寫 Dockerfile 將 Web 應用封裝為映像檔，並進行連接埠映射與容器掛載測試。',
                    ngAntiPattern: '混淆 Linux 與 Docker，在未修習雲端技術課程時自行編造 Kubernetes 維運經驗。'
                },
                {
                    jdRequirement: '具備資訊安全防護觀念，理解常見網路威脅與防禦原則',
                    businessNeed: '在系統架構中落實最小權限原則，防範 OWASP Top 10 等常見網路弱點',
                    courseEvidenceCourses: ['資訊安全概論', '安全程式設計', '網路安全'],
                    actionWhenMissing: '選修《資訊安全概論》或《安全程式設計》，掌握加密金鑰、雜湊演算與常見漏洞防禦。',
                    sampleGoodStar: '修讀《安全程式設計》，檢視程式碼中之 SQL 注入與 XSS 漏洞，實作參數化查詢與輸入淨化防禦。',
                    ngAntiPattern: '空稱「頂級駭客 / 紅隊滲透」，缺乏可檢驗之靶場或學術研究基礎。'
                }
            ]
        }
    };

    // ==========================================
    // 3. 經歷模板 (EXPERIENCE_TEMPLATES)
    // 嚴格依據 STAR 公式（情境、任務、行動、結果）
    // 絕不自動產生假數字，一律以【使用者自行輸入：...】佔位
    // ==========================================
    const EXPERIENCE_TEMPLATES = {
        exp_intern: {
            id: 'exp_intern',
            type: '實習經歷',
            titleTemplate: '【使用者自行輸入：實習企業全名】 ｜ 【使用者自行輸入：職稱，如：軟體開發實習生】 (【使用者自行輸入：起訖年月，如：2025.07 - 2025.09】)',
            sections: {
                situationTask: '【使用者自行輸入：實習單位部門與所參與的核心業務模組或系統名稱】',
                action: '【使用者自行輸入：個人在實習期間運用的具體技術、工具與落實的開發協作流程】',
                result: '【使用者自行輸入：具體產出與量化成果（如：上線模組數量、測試涵蓋率提升；若無數據可寫主管肯定或順利交付上線）】'
            },
            antiNgTip: '💡 寫作提示 (STAR)：切忌流水帳寫「幫主管打雜」；請依「行動動詞 + 具體做法 + 成果數據 + 職務能力」陳述，並強調團隊 Git 協作與規範交付。',
            sampleDemo: '在研發部實習期間，負責訂單查詢模組之後端 API 實作。運用物件導向思維與參數化查詢，成功交付 2 項新功能並通過單元測試，有效提升資料查詢穩定性。'
        },
        exp_compete: {
            id: 'exp_compete',
            type: '專業競賽',
            titleTemplate: '【使用者自行輸入：競賽正式全名，如：全國大專校院資訊應用創新競賽】 (【使用者自行輸入：參賽年月，如：2025.10】)',
            sections: {
                situationTask: '【使用者自行輸入：競賽主題情境與團隊所鎖定解決之使用者核心痛點】',
                action: '【使用者自行輸入：個人在團隊中的角色分工（如：後端/架構負責人）與採用的關鍵技術實作】',
                result: '【使用者自行輸入：獲得之名次階段或完成成果（如：入選決賽佳作、完成現場 Live Demo 獲評審肯定）】'
            },
            antiNgTip: '💡 寫作提示：人資重視「高抗壓性」、「快速自學未知技術」與「敏捷跨組溝通」。即使未獲大獎，能完成現場 Demo 即是極佳的落地能力證據。',
            sampleDemo: '針對校園二手書媒合痛點，於 36 小時黑客松中由零到一產出 MVP 原型。個人負責資料庫綱要規劃與核心 API 串接，團隊於數十組隊伍中脫穎而出入圍決賽。'
        },
        exp_project: {
            id: 'exp_project',
            type: '畢業專題 / 核心專案',
            titleTemplate: '【使用者自行輸入：專案正式全名】 ｜ 靜宜大學資訊學院畢業專題 (【使用者自行輸入：起訖年月，如：2025.09 - 2026.06】)',
            sections: {
                situationTask: '【使用者自行輸入：專案發想背景、目標使用者與為解決何種實務問題】',
                action: '【使用者自行輸入：個人所主導之核心模組、系統架構設計與前後端或資料庫實作細節】',
                result: '【使用者自行輸入：專題審查結果、展示成效或系統上線運行數據】'
            },
            antiNgTip: '💡 寫作提示：請務必精確標記「個人分工」！企業最忌諱整組寫得天花亂墜卻不知道「你」到底做了什麼。',
            sampleDemo: '開發智慧校園預約平台，個人擔任系統分析與後端主架構。規劃 8 張關聯表並實作符合 RESTful 規範之 API，在期末專題發表會中順利完成 Live Demo 演示。'
        },
        exp_leader: {
            id: 'exp_leader',
            type: '社團 / 組織協調',
            titleTemplate: '【使用者自行輸入：社團或學生組織名稱】 ｜ 【使用者自行輸入：幹部職稱，如：活動長 / 副會長】 (【使用者自行輸入：任期年月，如：2024.09 - 2025.06】)',
            sections: {
                situationTask: '【使用者自行輸入：籌辦活動性質、面臨之挑戰或跨系所協調目標】',
                action: '【使用者自行輸入：制定企劃時程、資源整合、招募宣傳與風險因應之具體做法】',
                result: '【使用者自行輸入：參與人數、滿意度回饋或為組織帶來之具體效益】'
            },
            antiNgTip: '💡 寫作提示：社團經驗請緊扣職場通用能力（溝通協調、時程管理、危機處理），切勿寫成日記流水帳。',
            sampleDemo: '策劃跨系技術研討工作坊，負責場地協調與時程把控。制定詳細甘特圖並協調講師資源，活動吸引超過 50 位學員參與，滿意度達 90% 以上。'
        },
        exp_coursework: {
            id: 'exp_coursework',
            type: '課堂實作專題',
            titleTemplate: '【使用者自行輸入：課堂專案名稱】 ｜ 專業核心課程實作成果 (【使用者自行輸入：學期，如：113學年度第一學期】)',
            sections: {
                situationTask: '【使用者自行輸入：修習該課程時面臨之實作挑戰與系統開發目標】',
                action: '【使用者自行輸入：獨立或分組落實技術實作、模組串接與代碼撰寫過程】',
                result: '【使用者自行輸入：專案功能完成度與課堂成果展示獲評表現】'
            },
            antiNgTip: '💡 寫作提示：無工作或實習經驗之新鮮人，課堂期末大專案即是最好的技術驗證證據！請點出所使用的核心技能。',
            sampleDemo: '於課程期末實作個人記帳管理系統，獨立完成資料表規格化與前後端資料串接，妥善處理金額計算與表單驗證，期末成果發表獲授課教師肯定。'
        }
    };

    // ==========================================
    // 4. 防 NG 履歷與 HR 審查標準指南 (ANTI_NG_GUIDE)
    // 依據講義 17 張投影片整理之核心原則
    // ==========================================
    const ANTI_NG_GUIDE = {
        principles: [
            {
                name: '關鍵 30 秒法則 (HR 6~10 秒掃讀視線流)',
                desc: 'HR 平均僅花 6 至 10 秒快速掃描一份新鮮人履歷。審閱順序為：先看「你是誰」（姓名、照片、學歷） → 再看「學經歷」（專案、實習） → 最後看「符合條件」（專業技能、自傳）。重要資訊必須在第一頁前三分之一目了然。',
                weight: '技能專長 > 畢業科系 > 自傳'
            },
            {
                name: '吸睛履歷五元三要架構 (手掌五指口訣)',
                desc: '一信 (Cover Letter 自薦信，簡明說明你是誰與求職動機)；二資 (基本資料，姓名/手機/Email/學歷/照片)；三歷 (經歷，工作/專案/在校實戰)；四專 (證照與專長，條列技能與作品集)；五傳 (自傳三要：我是誰、我會什麼、我想做什麼，控制在 500~800 字 A4 一頁)。'
            },
            {
                name: '無正式經驗的 STAR 寫作公式',
                desc: '採用「行動動詞 + 具體做法 + 成果數據 + 職務能力」句型。S 情境 (Situation) + T 任務 (Task) + A 行動 (Action) + R 結果 (Result)。無工作經驗者可善用課程專案、競賽、社團活動或自主學習成果作為能力證據。'
            },
            {
                name: 'JD 對焦表（企業語言翻譯）',
                desc: '看清職缺需求 → 盤點自身經歷 → 對照契合點 → 精準撰寫亮點。不要只看職缺表面描述，要將企業需求翻譯成自身的「可驗證證據」，並把與該職缺最相關的證據排在最前面。'
            }
        ],
        commonNgPitfalls: [
            {
                trap: '❌ 虛構或浮誇成果數據',
                risk: '面試官一深入追問即刻破功，留下不誠信紀錄',
                fix: '若無精確百分比數據，請誠實寫出「功能交付數量」、「單元測試通過情況」或「授課教師與主管反饋」，切勿編造假數字（如隨意寫提升 30% 效能）。'
            },
            {
                trap: '❌ 空泛形容詞無案例佐證',
                risk: '寫「抗壓性高、學習熱忱、具領導力」對 HR 而言毫無資訊量',
                fix: '講義要求：「每一項人格特質後面，都要接一個可說明、可驗證的例子」。如寫學習能力強，後面請接「在一週內自學 Docker 並成功將專案容器化上線」。'
            },
            {
                trap: '❌ 投錯職位或未寫明確應徵職務',
                risk: '通篇不知道要投什麼，或同時寫多個不相干職缺（如同時寫 SA / PM / 資料分析師），顯得投機沒有方向',
                fix: '一份履歷僅鎖定一個明確目標職缺（例如：後端軟體工程師），所有技能與專案證據均對齊該職缺需求。'
            },
            {
                trap: '❌ 聯絡資訊缺漏或填錯、錯別字連篇',
                risk: '最毋湯的錯誤！電話少一碼或 Email 拼錯導致 HR 完全聯絡不上',
                fix: '送出前務必反覆檢查手機號碼、電子郵件、GitHub 網址是否能正常點擊開啟。'
            },
            {
                trap: '❌ 自傳寫成童年成長流水帳',
                risk: '從「我出生在一個小康家庭，父母管教嚴格」寫起，浪費寶貴篇幅',
                fix: '新鮮人自傳直接分三段：1.【我是誰】個人背景與核心特質 2.【我會什麼】核心技能與專案能力證據 3.【我想做什麼】求職動機與到職貢獻，控制在 500~800 字。'
            },
            {
                trap: '❌ 照片使用出遊自拍照或墨鏡休閒照',
                risk: '93% 企業表示有附照片優先安排面試，但非正式照片會直接留下不專業印象',
                fix: '請使用正面、五官清晰、乾淨明亮之專業半身證件照或正式照片。'
            }
        ]
    };

    // ==========================================
    // 5. 核心推導純函式：buildEvidence()
    // 純資料處理，無任何 DOM 依賴，保證 Node/瀏覽器雙環境可用
    // ==========================================
    function buildEvidence(options) {
        options = options || {};
        const selectedCourses = Array.isArray(options.selectedCourses) ? options.selectedCourses : [];
        const selectedExps = Array.isArray(options.selectedExps) ? options.selectedExps : [];
        const roleKey = options.roleKey || 'fullstack';
        const userProfile = options.userProfile || {};
        const grade = options.grade || '大三';
        const dept = options.dept || 'IM';
        const ucan = options.ucan || null;

        const rolePreset = ROLE_PRESETS[roleKey] || ROLE_PRESETS.fullstack;

        // 1. 科系全銜與預計畢業時程 (依照年級精確推導，不再有雙層括號)
        const deptNames = { CS: '資訊工程學系', IM: '資訊管理學系', AI: '人工智慧學系' };
        const deptFullName = userProfile.dept || deptNames[dept] || '資訊學院';
        
        let gradTimeline = '【使用者自行輸入：在學學制與預計畢業年月】';
        if (grade === '大四') gradTimeline = '2022.09 入學・預計 2026.06 畢業';
        else if (grade === '大三') gradTimeline = '2023.09 入學・預計 2027.06 畢業';
        else if (grade === '大二') gradTimeline = '2024.09 入學・預計 2028.06 畢業';
        else if (grade === '大一') gradTimeline = '2025.09 入學・預計 2029.06 畢業';
        else if (grade === '碩士') gradTimeline = '碩士班在學・預計 2026.06 畢業';

        // 2. 基本資料建構（若使用者未填，標示【使用者自行輸入：...】）
        const profile = {
            name: userProfile.name ? userProfile.name.trim() : '【使用者自行輸入：中文姓名】',
            engName: userProfile.engName ? userProfile.engName.trim() : '【使用者自行輸入：英文姓名】',
            phone: userProfile.phone ? userProfile.phone.trim() : '【使用者自行輸入：聯絡手機】',
            email: userProfile.email ? userProfile.email.trim() : '【使用者自行輸入：電子郵件】',
            school: '靜宜大學 (Providence University)',
            deptFullName: deptFullName,
            grade: grade,
            gradTimeline: gradTimeline,
            educationDisplay: `靜宜大學 (Providence University) 資訊學院 ${deptFullName} ｜ ${grade}在學（${gradTimeline}）`,
            github: userProfile.github ? userProfile.github.trim() : '【使用者自行輸入：GitHub 倉庫連結】',
            portfolio: userProfile.portfolio ? userProfile.portfolio.trim() : '【使用者自行輸入：作品集 / 簡報展示連結】',
            targetCompany: userProfile.targetCompany ? userProfile.targetCompany.trim() : '【使用者自行輸入：應徵目標企業】',
            targetJob: userProfile.targetJob ? userProfile.targetJob.trim() : rolePreset.title,
            photoUrl: userProfile.photoUrl || null
        };

        // 3. 課程群組與技能匹配（誠實分級制）
        const matchedClusters = [];
        const skills = [];
        const selectedSet = new Set(selectedCourses);

        COURSE_EVIDENCE.forEach(cluster => {
            const hitCourses = cluster.courses.filter(c => selectedSet.has(c));
            if (hitCourses.length > 0) {
                matchedClusters.push({
                    id: cluster.id,
                    title: cluster.title,
                    hitCourses: hitCourses,
                    count: hitCourses.length,
                    starPrompt: cluster.starPrompt
                });

                // 判斷技能熟練度口吻（誠實分級，依據講義「具備...基礎，能參考課堂範例...」）
                let levelText = '';
                let honestyNotice = '';
                const hasProjectOrIntern = selectedExps.includes('exp_project') || selectedExps.includes('exp_intern');

                if (hitCourses.length >= 2 && hasProjectOrIntern) {
                    levelText = '專案實戰應用';
                    honestyNotice = `已修習《${hitCourses.slice(0, 2).join('》、《')}》等多門課程，並於實作中具備交付經驗。`;
                } else if (hitCourses.length >= 2) {
                    levelText = '進階實作具備';
                    honestyNotice = `已完成《${hitCourses.slice(0, 2).join('》、《')}》等課程，能獨立撰寫核心功能並具備除錯能力。`;
                } else {
                    levelText = '基礎概念養成';
                    honestyNotice = `修習《${hitCourses[0]}》，具備核心概念，能參考課堂範例完成基礎實作。`;
                }

                // 挑選符合該群組之具體技能
                cluster.skills.forEach(skill => {
                    const matchEvidence = skill.testCourses.some(tc => selectedSet.has(tc));
                    if (matchEvidence) {
                        skills.push({
                            category: cluster.title,
                            name: skill.name,
                            basis: skill.basis,
                            levelText: levelText,
                            honestyNotice: honestyNotice,
                            clusterId: cluster.id
                        });
                    }
                });
            }
        });

        // 若尚未勾選課程，提供預設指引型技能架構
        if (skills.length === 0) {
            skills.push({
                category: '專業核心程式能力',
                name: '【使用者自行輸入：主修程式語言與核心技能】',
                basis: '尚未勾選課程，請於左側勾選修課以自動對齊課綱證據',
                levelText: '待評估',
                honestyNotice: '建議至少勾選 2~3 門已修習之資訊核心必修課程。',
                clusterId: 'none'
            });
        }

        // 4. 經歷區塊建構（STAR 結構，完全杜絕編造數字）
        const experiences = [];
        const expKeys = [
            { key: 'exp_intern', tpl: EXPERIENCE_TEMPLATES.exp_intern },
            { key: 'exp_compete', tpl: EXPERIENCE_TEMPLATES.exp_compete },
            { key: 'exp_project', tpl: EXPERIENCE_TEMPLATES.exp_project },
            { key: 'exp_leader', tpl: EXPERIENCE_TEMPLATES.exp_leader }
        ];

        expKeys.forEach(item => {
            if (selectedExps.includes(item.key)) {
                experiences.push({
                    id: item.tpl.id,
                    type: item.tpl.type,
                    title: item.tpl.titleTemplate,
                    situationTask: item.tpl.sections.situationTask,
                    action: item.tpl.sections.action,
                    result: item.tpl.sections.result,
                    antiNgTip: item.tpl.antiNgTip,
                    sampleDemo: item.tpl.sampleDemo
                });
            }
        });

        // 若使用者未勾選任何課外經歷，預設加入一項課堂實作專題素材（無經驗新鮮人之黃金救援）
        if (experiences.length === 0) {
            const courseworkTpl = EXPERIENCE_TEMPLATES.exp_coursework;
            const topCourses = selectedCourses.slice(0, 2).join(' 與 ') || '專業核心必修';
            experiences.push({
                id: courseworkTpl.id,
                type: courseworkTpl.type,
                title: `【使用者自行輸入：專案名稱】 ｜ ${topCourses} 課堂專案實作 (【使用者自行輸入：學期】)`,
                situationTask: courseworkTpl.sections.situationTask,
                action: courseworkTpl.sections.action,
                result: courseworkTpl.sections.result,
                antiNgTip: courseworkTpl.antiNgTip,
                sampleDemo: courseworkTpl.sampleDemo
            });
        }

        // 5. 一信：自薦信 (Cover Letter) - 精簡 3~4 行
        const primarySkills = skills.slice(0, 3).map(s => s.name).join('、');
        const coverLetter = `我是 **${profile.name}**，靜宜大學${deptFullName} ${grade}學生，技術主線聚焦於 ${primarySkills}。在校期間穩步累積專業學分，並透過實作專題鍛鍊系統規劃與代碼交付能力。熟悉團隊協作與 Git 版本控管思維，希望能應徵貴團隊【**${profile.targetJob}**】職缺，將所學之工程實力投入專案開發，為團隊創造實質產出，並在實務中持續深化專業！`;

        // 6. 五傳：自傳三要 (我是誰、我會什麼、我想做什麼) - 目標 500~800 字
        // 依照講義「大學新鮮人自傳」標準架構，特質後必接可驗證案例
        let ucanText = '邏輯思考、問題解決與團隊協同';
        if (ucan && ucan.commonComps && typeof ucan.commonComps === 'object') {
            try {
                const keys = Object.keys(ucan.commonComps);
                if (keys.length > 0) {
                    ucanText = keys.slice(0, 3).join('、');
                }
            } catch(e){}
        }

        const bioSection1 = `我是靜宜大學${deptFullName}的${grade}學生。求學歷程中，我始終重視技術的底層運作邏輯與扎實地基，在校內核心課程中維持穩定的學習步調。在教育部 UCAN 共通職能評估中，我展現了【${ucanText}】等突出優勢特質。面對未知技術與架構難題時，我習慣主動查閱官方文件、拆解問題本質，並透過可重現的最小可行代碼 (POC) 進行驗證。我不僅熱愛寫出可讀性高、易於維護的代碼，更重視與組員間的責任分工與溝通對齊，具備高度自主學習熱忱與抗壓性。`;

        const courseNamesJoined = selectedCourses.slice(0, 4).join('」、「') || '專業必修';
        const bioSection2 = `在專業累積方面，我以「${rolePreset.title}」為核心目標，深入修習「${courseNamesJoined}」等實務課程，逐步掌握 ${primarySkills} 等關鍵技能。我理解軟體開發生命週期 (SDLC) 之嚴謹性，在專案中能依據需求規格規劃結構化資料模型與 API 接口，並善用 Git 進行分支管理與 Commit 紀錄追蹤。相較於死記語法，我更在乎資料傳遞之一致性、例外狀況防護與使用者體驗細節。在專題協作中，我主導【使用者自行輸入：個人主導模組與可驗證之技術貢獻】，並順利完成系統端對端功能整合測試。`;

        const bioSection3 = `立志投身於【${profile.targetJob}】領域。我深知身為大學新鮮人，企業最看重的並非無所不知的資歷，而是紮實的基礎知識、誠實面對問題的自學敏捷度，以及將業務需求轉化為穩定軟體的執行力。貴公司在業界的技術積累與團隊文化深具吸引力，若有機會加入團隊，我將積極投入專案交付，主動向資深前輩請益，在最短時間內熟悉開發規範並貢獻實質產值，成為團隊中堅實且值得信賴的研發夥伴！`;

        const bioFullText = `${bioSection1}\n\n${bioSection2}\n\n${bioSection3}`;
        const bioWordCount = bioFullText.replace(/\s+/g, '').length;

        const autobiography = {
            whoAmI: bioSection1,
            whatICanDo: bioSection2,
            whatIWantToDo: bioSection3,
            fullText: bioFullText,
            totalWords: bioWordCount,
            wordCountValid: bioWordCount >= 450 && bioWordCount <= 900
        };

        // 7. JD 對焦表建構 (JD Alignment)
        const jdAlignment = rolePreset.jdItems.map(item => {
            const matchedCourses = item.courseEvidenceCourses.filter(c => selectedSet.has(c));
            let status = 'gap'; // 'has_evidence' | 'partial' | 'gap'
            if (matchedCourses.length >= 2) {
                status = 'has_evidence';
            } else if (matchedCourses.length === 1) {
                status = 'partial';
            }

            return {
                jdRequirement: item.jdRequirement,
                businessNeed: item.businessNeed,
                status: status,
                matchedCourses: matchedCourses,
                requiredCourses: item.courseEvidenceCourses,
                actionWhenMissing: item.actionWhenMissing,
                sampleGoodStar: item.sampleGoodStar,
                ngAntiPattern: item.ngAntiPattern
            };
        });

        // 8. 缺口補強路徑 (依年級分流，提供具體修課與作品集建議)
        const gaps = jdAlignment.filter(j => j.status !== 'has_evidence');
        const gapRecommendations = [];

        gaps.forEach((g, idx) => {
            let gradeAdvice = '';
            if (grade === '大一' || grade === '大二') {
                gradeAdvice = `【大一/二 打底期】建議下學期排入《${g.requiredCourses.join('》或《')}》，並在 GitHub 建立個人程式練習倉庫，踏實累積 commit 紀錄。`;
            } else if (grade === '大三') {
                gradeAdvice = `【大三 專案實作期】距離畢業專題關鍵期，建議立刻選修《${g.requiredCourses[0]}》，並將該課期末大作業擴充為作品集核心專案。`;
            } else {
                gradeAdvice = `【大四 實習就業期】建議透過自主研讀補足《${g.requiredCourses[0]}》核心概念，並於履歷與作品集中展示個人 MVP 小型實作，爭取實習與校園徵才面試。`;
            }

            gapRecommendations.push({
                priority: idx + 1,
                jdRequirement: g.jdRequirement,
                advice: gradeAdvice,
                targetCourses: g.requiredCourses,
                actionWhenMissing: g.actionWhenMissing
            });
        });

        // 9. 匯出前檢核清單 (Checklist)
        // 檢查履歷中是否尚有【使用者自行輸入】之佔位未填
        const allText = JSON.stringify({ profile, coverLetter, skills, experiences, autobiography });
        const placeholderMatches = allText.match(/【使用者自行輸入：[^】]+】/g) || [];
        const uniquePlaceholders = Array.from(new Set(placeholderMatches));

        const checklist = {
            totalPlaceholders: uniquePlaceholders.length,
            unfilledPlaceholders: uniquePlaceholders,
            hasName: !profile.name.includes('【使用者自行輸入'),
            hasPhone: !profile.phone.includes('【使用者自行輸入'),
            hasEmail: !profile.email.includes('【使用者自行輸入'),
            hasPhoto: !!profile.photoUrl,
            bioWordCount: bioWordCount,
            isBioValid: autobiography.wordCountValid,
            isExportReady: uniquePlaceholders.length === 0 && !!profile.photoUrl
        };

        return {
            profile: profile,
            rolePreset: rolePreset,
            coverLetter: coverLetter,
            skills: skills,
            matchedClusters: matchedClusters,
            experiences: experiences,
            autobiography: autobiography,
            jdAlignment: jdAlignment,
            gapRecommendations: gapRecommendations,
            checklist: checklist,
            academicMilestones: {
                selectedCourses: selectedCourses,
                courseCount: selectedCourses.length,
                clusterSummary: matchedClusters.map(c => `${c.title} (${c.count}門)`)
            }
        };
    }

    // ==========================================
    // 6. 履歷渲染器：renderResumeHTML()
    // 專為 A4 兩頁式、高掃讀率排版設計
    // 第 1 頁：二資 (基本資料+照片) -> 一信 (自薦信) -> 四專 (專長表格) -> 三歷 (經歷)
    // 第 2 頁：五傳 (自傳三要 500-800 字) -> 重點修課紀錄
    // ==========================================
    function renderResumeHTML(model) {
        if (!model) return '<p class="text-rose-600 font-mono">履歷模型載入錯誤</p>';

        const p = model.profile;
        const auto = model.autobiography;

        // 格式化帶底線的佔位字串標籤
        function formatPlaceholders(text) {
            if (!text) return '';
            return text.replace(/【使用者自行輸入：([^】]+)】/g, (match, fieldName) => {
                return `<span class="resume-placeholder inline-block bg-amber-50 text-amber-900 border-b-2 border-amber-400 font-mono text-[11px] px-1 py-0.5 mx-0.5 rounded" title="點擊左側基本資料或經歷編輯補齊" data-field="${fieldName}">【使用者自行輸入：${fieldName}】</span>`;
            });
        }

        // 大頭照區塊 (若無照片，顯示精美佔位框並提示上傳)
        let photoHtml = '';
        if (p.photoUrl) {
            photoHtml = `
                <div class="resume-photo-box w-[88px] h-[115px] border-2 border-klein overflow-hidden shadow-sm flex-shrink-0 bg-white">
                    <img src="${p.photoUrl}" alt="證件照片" class="w-full h-full object-cover">
                </div>
            `;
        } else {
            photoHtml = `
                <div class="resume-photo-box w-[88px] h-[115px] border border-dashed border-klein/40 flex flex-col items-center justify-center text-center p-2 text-klein/50 flex-shrink-0 bg-klein/[0.02]">
                    <i class="fa-regular fa-image text-xl mb-1 text-klein/40"></i>
                    <span class="text-[10px] font-mono leading-tight">建議附上<br>正面證件照<br>(3.5×4.5cm)</span>
                </div>
            `;
        }

        // 專長技能表格列
        const displaySkills = model.skills.length > 5 ? model.skills.slice(0, 5) : model.skills;
        const skillRows = displaySkills.map((s, idx) => {
            const isAlt = idx % 2 === 1 ? 'bg-klein/[0.015]' : 'bg-white';
            return `
                <tr class="border-b border-klein/10 ${isAlt} text-xs">
                    <td class="py-1 px-2 font-mono font-bold text-klein whitespace-nowrap">${s.category}</td>
                    <td class="py-1 px-2 font-body font-bold text-klein">${formatPlaceholders(s.name)}</td>
                    <td class="py-1 px-2 font-mono text-[11px] text-klein/70">${s.basis}</td>
                    <td class="py-1 px-2 font-mono text-[11px] text-klein">
                        <span class="inline-block px-1.5 py-0.5 bg-klein/10 text-klein font-bold text-[10px] rounded">${s.levelText}</span>
                    </td>
                </tr>
            `;
        }).join('');

        // 經歷條列
        const experienceHtml = model.experiences.map((exp) => {
            return `
                <div class="mb-2 pb-2 border-b border-klein/10 last:border-b-0 last:mb-0">
                    <div class="flex items-baseline justify-between mb-1.5">
                        <h4 class="font-heading font-black text-sm text-klein tracking-tight">
                            ${formatPlaceholders(exp.title)}
                        </h4>
                    </div>
                    <ul class="space-y-1 text-xs text-klein/85 leading-relaxed font-body list-disc pl-4 marker:text-klein">
                        <li><strong class="font-mono text-klein text-[11px]">情境與任務 (S/T)：</strong>${formatPlaceholders(exp.situationTask)}</li>
                        <li><strong class="font-mono text-klein text-[11px]">具體行動 (Action)：</strong>${formatPlaceholders(exp.action)}</li>
                        <li><strong class="font-mono text-klein text-[11px]">產出實績 (Result - STAR)：</strong>${formatPlaceholders(exp.result)}</li>
                    </ul>
                    <div class="no-print mt-2 p-2 bg-blue-50/70 border-l-2 border-klein text-[11px] text-klein/80 font-mono">
                        <div class="flex items-center gap-1.5 font-bold mb-0.5 text-klein">
                            <i class="fa-solid fa-lightbulb text-amber-500"></i> ${exp.antiNgTip}
                        </div>
                        <div class="text-[10px] text-klein/70">
                            <strong>寫作範例參考：</strong>${exp.sampleDemo}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 重點修課紀錄標籤
        const coursePills = model.academicMilestones.selectedCourses.length > 0
            ? model.academicMilestones.selectedCourses.map(c => `<span class="inline-block px-2 py-0.5 bg-klein/5 border border-klein/15 text-klein font-mono text-[11px] mr-1.5 mb-1.5">${c}</span>`).join('')
            : '<span class="text-xs text-klein/50 font-mono">尚未勾選修課</span>';

        // 組合完整 A4 雙頁 HTML
        return `
            <div class="a4-resume-document max-w-[794px] mx-auto text-klein text-left">
                
                <!-- ==================== PAGE 1 (6~10 秒 HR 掃讀頁) ==================== -->
                <div class="resume-page resume-page-1 bg-white p-6 md:p-8 border border-klein/15 shadow-sm">
                    
                    <!-- 二資：個人基本資料 (Profile) -->
                    <header class="border-b-2 border-klein pb-3 mb-3">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-baseline gap-3 mb-1">
                                    <h1 class="font-heading font-black text-2xl md:text-3xl text-klein tracking-tight">
                                        ${formatPlaceholders(p.name)}
                                    </h1>
                                    <span class="font-mono text-sm text-klein/60 font-medium">
                                        ${formatPlaceholders(p.engName)}
                                    </span>
                                </div>
                                <div class="mb-2">
                                    <span class="inline-block bg-klein text-white font-mono text-xs font-bold px-2 py-0.5 uppercase tracking-wide">
                                        🎯 應徵職務：${formatPlaceholders(p.targetJob)}
                                    </span>
                                    <span class="text-xs text-klein/70 font-mono ml-2">
                                        目標企業：${formatPlaceholders(p.targetCompany)}
                                    </span>
                                </div>
                                <div class="text-xs text-klein/80 font-mono space-y-0.5 leading-relaxed">
                                    <div><i class="fa-solid fa-graduation-cap text-klein mr-1.5"></i>${p.educationDisplay}</div>
                                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                                        <span><i class="fa-solid fa-phone text-klein mr-1"></i>${formatPlaceholders(p.phone)}</span>
                                        <span><i class="fa-solid fa-envelope text-klein mr-1"></i>${formatPlaceholders(p.email)}</span>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-klein">
                                        <span><i class="fa-brands fa-github mr-1"></i>${formatPlaceholders(p.github)}</span>
                                        <span><i class="fa-solid fa-globe mr-1"></i>${formatPlaceholders(p.portfolio)}</span>
                                    </div>
                                </div>
                            </div>
                            ${photoHtml}
                        </div>
                    </header>

                    <!-- 一信：求職自薦信 (Cover Letter) -->
                    <section class="mb-3.5">
                        <h2 class="font-heading font-black text-xs uppercase tracking-wider text-klein border-b border-klein/20 pb-0.5 mb-1.5 flex items-center gap-2">
                            <span class="w-2 h-2 bg-klein"></span> 求職自薦信 (Cover Letter)
                        </h2>
                        <div class="p-3 bg-klein/[0.02] border border-klein/10 text-xs leading-relaxed text-klein/90 font-body">
                            ${formatPlaceholders(model.coverLetter)}
                        </div>
                    </section>

                    <!-- 四專：專業技能與依據 (Skills & Evidence) -->
                    <section class="mb-3.5">
                        <h2 class="font-heading font-black text-xs uppercase tracking-wider text-klein border-b border-klein/20 pb-0.5 mb-1.5 flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-klein"></span> 專業專長與能力依據 (Skills & Evidence)
                            </span>
                            <span class="font-mono text-[10px] text-klein/50 font-normal">依課綱實作與專案誠實評定</span>
                        </h2>
                        <div class="overflow-x-auto border border-klein/20">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-klein text-white font-mono text-[11px]">
                                        <th class="py-1 px-2 font-bold">能力領域</th>
                                        <th class="py-1 px-2 font-bold">核心技術與能力</th>
                                        <th class="py-1 px-2 font-bold">證明來源 (靜宜課綱)</th>
                                        <th class="py-1 px-2 font-bold">熟練度</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${skillRows}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <!-- 三歷：專案與實戰經歷 (Project & Experience - STAR Format) -->
                    <section class="mb-1">
                        <h2 class="font-heading font-black text-xs uppercase tracking-wider text-klein border-b border-klein/20 pb-0.5 mb-2 flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-klein"></span> 專案實作與實戰經歷 (STAR Format)
                            </span>
                            <span class="font-mono text-[10px] text-klein/50 font-normal">S情境・T任務・A行動・R成果</span>
                        </h2>
                        <div class="space-y-2">
                            ${experienceHtml}
                        </div>
                    </section>

                </div>

                <!-- ==================== PAGE 2 (自傳深度評估頁) ==================== -->
                <div class="resume-page resume-page-2 bg-white p-6 md:p-8 mt-6 border border-klein/15 shadow-sm" style="page-break-before: always; break-before: page;">
                    
                    <!-- 五傳：完整自傳 (Autobiography - 我是誰・我會什麼・我想做什麼) -->
                    <section class="mb-4">
                        <div class="flex items-center justify-between border-b-2 border-klein pb-1.5 mb-2.5">
                            <h2 class="font-heading font-black text-lg uppercase tracking-tight text-klein flex items-center gap-2">
                                <span class="w-2.5 h-2.5 bg-klein"></span> 個人自傳 (Autobiography)
                            </h2>
                            <div class="font-mono text-xs text-klein/70">
                                建議篇幅：500~800 字 ｜ 當前篇幅：<strong class="text-klein">${auto.totalWords}</strong> 字
                                ${auto.wordCountValid ? '<span class="text-emerald-600 font-bold ml-1">✔ 符合標準</span>' : '<span class="text-amber-600 font-bold ml-1">△ 建議微調</span>'}
                            </div>
                        </div>

                        <div class="space-y-2.5 text-xs leading-relaxed text-klein/85 font-body">
                            <div>
                                <h3 class="font-heading font-bold text-xs text-klein mb-1 border-l-2 border-klein pl-2">
                                    一、【我是誰】個人背景與優勢特質
                                </h3>
                                <p class="pl-2.5">${formatPlaceholders(auto.whoAmI)}</p>
                            </div>

                            <div>
                                <h3 class="font-heading font-bold text-xs text-klein mb-1 border-l-2 border-klein pl-2">
                                    二、【我會什麼】核心專長與專案成果
                                </h3>
                                <p class="pl-2.5">${formatPlaceholders(auto.whatICanDo)}</p>
                            </div>

                            <div>
                                <h3 class="font-heading font-bold text-xs text-klein mb-1 border-l-2 border-klein pl-2">
                                    三、【我想做什麼】求職動機與職缺連結
                                </h3>
                                <p class="pl-2.5">${formatPlaceholders(auto.whatIWantToDo)}</p>
                            </div>
                        </div>
                    </section>

                    <!-- 重點修課紀錄 (Academic Coursework Milestones) -->
                    <section class="mb-3 pt-2.5 border-t border-klein/20">
                        <h2 class="font-heading font-black text-sm uppercase tracking-wider text-klein border-b border-klein/20 pb-1 mb-2.5 flex items-center justify-between">
                            <span class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-klein"></span> 重點修課里程碑 (Academic Coursework Milestones)
                            </span>
                            <span class="font-mono text-[10px] text-klein/60">共修習 ${model.academicMilestones.courseCount} 門核心課程</span>
                        </h2>
                        <div class="mb-3">
                            <span class="font-mono text-[11px] font-bold text-klein block mb-1">已納入能力證明之課程清單：</span>
                            <div class="flex flex-wrap">${coursePills}</div>
                        </div>
                        <div class="text-[11px] text-klein/70 font-mono">
                            <strong>能力群組分佈：</strong>${model.academicMilestones.clusterSummary.join(' ｜ ') || '尚未形成聚落'}
                        </div>
                    </section>

                    <!-- 頁尾聲明 -->
                    <footer class="mt-4 pt-2 border-t border-klein/10 text-center font-mono text-[10px] text-klein/50">
                        本履歷格式嚴格依循企業人資「五元三要」與 STAR 原則，結合靜宜大學課綱實證與教育部 UCAN 職能數據生成。
                    </footer>

                </div>

            </div>
        `;
    }

    // ==========================================
    // 7. Markdown 渲染器：renderResumeMarkdown()
    // 純文字純 Markdown，供一鍵複製到剪貼簿
    // ==========================================
    function renderResumeMarkdown(model) {
        if (!model) return '';
        const p = model.profile;
        const auto = model.autobiography;

        const skillsMd = model.skills.map(s => `- **${s.category}** ｜ ${s.name} (${s.levelText}) —— *依據：${s.basis}*`).join('\n');

        const expMd = model.experiences.map(e => `### ${e.title}
- **情境與任務 (S/T)**：${e.situationTask}
- **具體行動 (Action)**：${e.action}
- **產出實績 (Result - STAR)**：${e.result}`).join('\n\n');

        return `# ${p.name}
### 🎯 應徵職務：${p.targetJob}

**二資 ｜ 個人基本資料 (Personal Profile)**
- **教育背景**：${p.educationDisplay}
- **聯絡資訊**：${p.phone} ｜ ${p.email}
- **專業連結**：[GitHub](${p.github}) ｜ [作品集](${p.portfolio})
- **應徵企業**：${p.targetCompany}

---

## 一信 ｜ 求職自薦信 (Cover Letter)
${model.coverLetter}

---

## 四專 ｜ 專業專長與能力依據 (Skills & Evidence)
${skillsMd}

---

## 三歷 ｜ 專案實作與實戰經歷 (Project Experience - STAR)
${expMd}

---

## 五傳 ｜ 完整自傳 (Autobiography - 我是誰・我會什麼・我想做什麼)
### 1. 【我是誰】個人背景與特質
${auto.whoAmI}

### 2. 【我會什麼】核心專長與實戰成果
${auto.whatICanDo}

### 3. 【我想做什麼】求職動機與職缺連結
${auto.whatIWantToDo}

---

## 📚 重點修課紀錄 (Academic Coursework Milestones)
- **已修習核心課程 (${model.academicMilestones.courseCount} 門)**：${model.academicMilestones.selectedCourses.join('、') || '尚未勾選'}
- **專業能力聚落**：${model.academicMilestones.clusterSummary.join(' ｜ ') || '無'}

---
*(本履歷格式嚴格依據企業人資「五元三要（一信、二資、三歷、四專、五傳）」黃金規格，結合 UCAN 測驗數據與三軌學制自動生成)*
`;
    }

    // ==========================================
    // 公開 API 匯出
    // ==========================================
    return {
        COURSE_EVIDENCE: COURSE_EVIDENCE,
        ROLE_PRESETS: ROLE_PRESETS,
        EXPERIENCE_TEMPLATES: EXPERIENCE_TEMPLATES,
        ANTI_NG_GUIDE: ANTI_NG_GUIDE,
        buildEvidence: buildEvidence,
        renderResumeHTML: renderResumeHTML,
        renderResumeMarkdown: renderResumeMarkdown
    };
}));
