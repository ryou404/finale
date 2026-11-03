/**
 * 個人品牌知識庫 (Brand Knowledge Base)
 * --------------------------------------------------------------
 * 全部內容由團隊「人工整理、逐項確認」，不由 LLM 即時生成，目的：
 *   1. 避免 AI 幻覺 (口試委員最在意的點)
 *   2. 每一句建議、每個名詞，團隊都能自己解釋
 *
 * 維護規則：
 *   - 新增任何工具 / 平台 / 名詞，必須先在 glossary 寫一句白話解釋 (tests 會檢查)。
 *   - 新增人物 / 連結，必須先實際打開確認，並填 verifiedAt；沒把握的標 needsTeamReview。
 *   - 團隊不熟的名詞，直接刪掉，不要留。
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.BrandKB = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const VERSION = '2026.11-r1';
    const VERIFIED = '2026-11-03';

    /* ------------------------------------------------------------------
     * 名詞小辭典：每個名詞一句白話
     * ------------------------------------------------------------------ */
    const glossary = {
        'Figma': '免費的雲端介面設計工具，可多人同時編輯，是目前 UI/UX 設計最常用的軟體。',
        'Prototype': '原型：把設計畫面串成「可以點擊」的模擬產品，用來在開發前先測試操作流程。',
        'Wireframe': '線框圖：只用方框與線條畫出畫面配置的草稿，先決定內容擺哪裡，不處理顏色與美術。',
        'Usability Test': '易用性測試：請真實使用者完成指定任務，觀察他們在哪裡卡住，用來改善設計。',
        'Case Study': '案例研究：把一個專案的「問題、做法、結果、反思」寫成完整故事，是設計師作品集最重要的內容。',
        'Portfolio': '作品集：把你做過的專案整理在一處，讓面試官一眼看到你的實力。',
        'Behance': 'Adobe 旗下的創作者作品平台，設計師常在這裡發表完整專案；招募人員與同行可以直接瀏覽。',
        'Instagram': '圖片與短影片社群平台；設計與行銷領域常用它展示作品、累積追蹤者。',
        'Notion': '筆記與文件整合工具，可以做成看板、資料庫，也能公開成網頁當作品集或知識庫。',
        'Canva': '線上排版設計工具，範本多，適合快速做社群圖卡、簡報與簡易作品集。',
        'Linktree': '把多個連結(作品集、LinkedIn、信箱)整合成一個網址的工具，適合放在社群自介。',
        'Carousel': '輪播貼文：IG 一則貼文放多張圖片，讓人左右滑動閱讀，適合拆解專案步驟。',
        'Reels': 'IG 的短影片功能，適合放縮時錄影、操作示範。',
        'GitHub': '程式碼託管與協作平台，程式作品放上去後，招募人員可直接看到你的程式與開發紀錄。',
        'Git': '版本控制工具，記錄程式碼每次修改，方便回復與多人合作。',
        'README': '放在專案根目錄的說明文件，寫明專案用途、安裝與使用方式，是 GitHub 專案的門面。',
        'Commit': 'Git 中的一次「存檔」，附上說明文字，記錄你改了什麼。',
        'HTML/CSS/JavaScript': '網頁三大基礎技術：HTML 負責內容結構、CSS 負責外觀、JavaScript 負責互動。',
        'React': '由 Meta 推出的前端 JavaScript 函式庫，用「元件」組合出網頁畫面，業界使用很普遍。',
        'API': '程式之間交換資料的約定介面，例如前端向後端要資料就是呼叫 API。',
        'REST API': '最常見的 API 設計風格，用網址加上 GET / POST 等動作來取得或修改資料。',
        'Postman': '用來測試 API 的工具，可以手動送出請求並查看回應。',
        'SQL': '操作關聯式資料庫的查詢語言，可新增、查詢、修改、刪除資料。',
        'Docker': '把程式與執行環境一起打包成「容器」，讓程式在任何電腦上用同樣方式執行。',
        'Linux': '常用於伺服器的作業系統，維運與後端工作經常需要在命令列操作。',
        'CI/CD': '自動化流程：程式一更新就自動測試(CI)並自動部署(CD)，減少人工出錯。',
        'GitHub Actions': 'GitHub 內建的自動化服務，可在程式更新時自動執行測試或部署。',
        'Python': '語法簡潔、套件豐富的程式語言，常用於資料分析、AI 與自動化腳本。',
        'Pandas': 'Python 的資料處理套件，用來讀取、清理、統計表格型資料。',
        'Jupyter Notebook': '可以一邊寫程式、一邊顯示結果與說明文字的筆記本，常用於資料分析與機器學習。',
        'Kaggle': '資料科學競賽與公開資料集平台，可下載資料練習並查看別人的分析範例。',
        'Tableau/Power BI': '資料視覺化儀表板工具，把表格資料做成互動圖表，供主管快速掌握重點。',
        'Machine Learning': '機器學習：讓電腦從資料中找出規律並做預測，例如分類、推薦。',
        'scikit-learn': 'Python 的機器學習套件，內建常見的分類、迴歸、分群演算法。',
        'Test Case': '測試案例：寫明「輸入什麼、預期得到什麼」的檢查項目，用來驗證功能是否正確。',
        'Bug Report': '錯誤回報單：清楚寫出重現步驟、預期與實際結果，讓開發者能照著重現問題。',
        'Selenium/Playwright': '可用程式自動操作瀏覽器的測試工具，用來做網站自動化測試。',
        'Wireshark': '網路封包分析工具，可以看到網路上實際傳送的資料，用於排查網路問題。',
        'Nmap': '網路掃描工具，用來找出主機開了哪些連接埠與服務，只能用在自己或獲得授權的環境。',
        'PRD': '產品需求文件：寫明產品要解決什麼問題、有哪些功能、如何驗收，是 PM 與工程師溝通的基礎。',
        'Agile/Scrum': '敏捷開發：把工作切成短週期(Sprint)，每個週期交付可用成果並檢討調整。',
        'Trello/Jira': '任務看板工具，把工作寫成卡片，移動卡片表示進度。',
        'User Story': '使用者故事：用「身為○○，我想要○○，以便○○」描述一項需求。',
        'UML/Use Case': 'UML 是系統設計的標準圖示；Use Case 圖畫出「誰可以對系統做什麼事」。',
        'ER 圖': '實體關係圖：畫出資料庫有哪些資料表，以及它們之間的關係。',
        'Google Analytics': 'Google 的網站流量分析工具，可看有多少人來、從哪裡來、做了什麼。',
        'SEO': '搜尋引擎優化：讓網站內容更容易在 Google 搜尋結果中被找到。',
        'A/B Test': '把使用者分成兩組，各看不同版本，比較哪一版成效較好。',
        'Unity': '常用的遊戲與互動內容開發引擎，使用 C# 撰寫程式。',
        'C#': '微軟設計的程式語言，是 Unity 遊戲開發使用的語言。',
        'Game Jam': '限時(通常 48 小時)的遊戲開發活動，大家分組在期限內做出一款遊戲。',
        'Medium': '英文與中文都很多人使用的文章發表平台，適合發表技術或產品心得。',
        'iT 邦幫忙鐵人賽': '台灣最大的 IT 技術社群 iT 邦幫忙舉辦的 30 天連載競賽，是練習寫技術文章的好機會。',
        'LinkedIn': '全球職場社群平台，用來放履歷、與業界人士建立連結。',
        'Cake': '台灣的履歷與求職平台，可建立線上履歷與作品集。',
        '電梯簡報': 'Elevator Pitch：用 1~3 分鐘講清楚「你是誰、做了什麼、為什麼重要」。',
        'STAR': '面試回答架構：情境(Situation)、任務(Task)、行動(Action)、結果(Result)。',
        'Hashtag': '社群貼文的主題標籤(#開頭)，方便別人搜尋到你的內容。',
        '職業訪談': 'UCAN 建議的探索方式：訪問實際從事目標職業的人，了解真實的工作內容與要求。',
        'Google 試算表': 'Google 的線上試算表，可用函式與圖表整理、分析資料。',
        'Slack/Discord': '團隊即時通訊工具，常用於社群與專案溝通。',
        'AWS/GCP': '兩大雲端服務平台(亞馬遜與 Google)，可租用伺服器、資料庫等資源。',
        'Terraform': '用程式碼描述並建立雲端資源的工具，讓架構可重複建置。',
        'Nginx': '常用的網頁伺服器與反向代理軟體。',
        'OWASP Top 10': 'OWASP 組織整理的十大常見網站資安風險清單，是學習網站安全的入門地圖。',
        'CTF': 'Capture The Flag：資安解題競賽，透過解題練習攻防技巧。',
        'Google Ads': 'Google 的廣告投放平台，可依關鍵字或受眾投放廣告並查看成效。',
        'Meta 廣告': 'Facebook 與 Instagram 的廣告平台。',
        'Shopify': '電商開店平台，不需寫程式即可建立線上商店。',
        'Blender': '免費的 3D 建模與動畫軟體。',
        'Prompt': '給 AI 模型的指令文字；本專案只用於輔助，內容仍需自己理解與確認。'
    };

    /* ------------------------------------------------------------------
     * 可參考的成功經營者 / 社群 (已確認連結可開啟，優先台灣)
     * type: person 個人 | community 社群或共筆 | discovery 探索入口
     * ------------------------------------------------------------------ */
    const creators = {
        huli: { name: 'Huli', platform: '個人技術部落格', url: 'https://blog.huli.tw', type: 'person',
            focus: '前端、JavaScript、網站資安與學習心得', learn: '看他如何把複雜的網路與資安觀念，用白話文一步一步講清楚；文章結構(問題→原因→解法)很適合模仿。', verifiedAt: VERIFIED },
        pjchender: { name: 'PJCHENder', platform: '個人技術筆記站', url: 'https://pjchender.dev', type: 'person',
            focus: 'JavaScript、React、Git、前端與後端工具筆記', learn: '學習怎麼把學過的東西整理成有目錄、有範例的筆記站；也可當作學習時的查閱手冊。', verifiedAt: VERIFIED },
        orange: { name: 'Orange Tsai', platform: '個人資安部落格', url: 'https://blog.orange.tw', type: 'person',
            focus: '網站與系統資安研究(漏洞分析)', learn: '看資安研究者如何完整記錄「發現過程、原理、修補建議」，這是資安作品集最有說服力的寫法。', verifiedAt: VERIFIED },
        chechia: { name: 'Che-Chia Chang', platform: '個人技術網站', url: 'https://chechia.net', type: 'person',
            focus: '雲端原生、Kubernetes、DevOps / SRE', learn: '了解雲端與維運領域在台灣實務上的主題與社群(如 CNTUG)，可作為延伸閱讀方向。', verifiedAt: VERIFIED },
        chusiang: { name: '凍仁的筆記', platform: '個人技術筆記站', url: 'https://note.drx.tw', type: 'person',
            focus: 'Linux、Git、Docker、Ansible 等維運與自動化實作筆記', learn: '看他如何把一次次實作過程寫成步驟筆記，適合模仿做出自己的維運筆記。', verifiedAt: VERIFIED },
        leemeng: { name: 'LeeMeng (李孟)', platform: '個人資料科學部落格', url: 'https://leemeng.tw', type: 'person',
            focus: '機器學習、深度學習、資料視覺化', learn: '學習如何用圖表與互動範例解釋演算法，是「讓別人看得懂你的分析」的好示範。', verifiedAt: VERIFIED },
        haosquare: { name: '好豪筆記', platform: '個人技術部落格', url: 'https://haosquare.com', type: 'person',
            focus: '推薦系統、A/B 測試、因果推論與業界案例閱讀心得', learn: '看他如何把業界技術文章消化後寫成自己的整理，適合練習「讀完就輸出」。', verifiedAt: VERIFIED },
        hylee: { name: '李宏毅 (台大)', platform: '大學課程網站', url: 'https://speech.ee.ntu.edu.tw/~hylee/index.php', type: 'person',
            focus: '機器學習 / 深度學習公開課程與投影片', learn: '用中文系統化學習 AI 基礎；課程網站也展示了教學資料如何公開整理。', verifiedAt: VERIFIED },
        jimmyhong: { name: 'Jimmy Hong', platform: '個人 QA 網站', url: 'https://qa-lens.com', type: 'person',
            focus: '自動化測試、Appium 行動測試、GitHub Actions 整合、測試流程設計', learn: '看 QA 工程師如何用文章呈現「測試策略+實作+成果」，這是 QA 作品集的寫法。', verifiedAt: VERIFIED },
        junemilktea: { name: 'Miss 六月奶茶', platform: '個人 PM 知識庫網站', url: 'https://junemilktea.com', type: 'person',
            focus: '數位產品經理(PM)養成、職場溝通、敏捷與數據分析筆記', learn: '學習 PM 如何把工作方法寫成系列文章，建立「懂產品、會溝通」的形象。', verifiedAt: VERIFIED },
        byxblife: { name: '老布下班後', platform: '個人網站', url: 'https://byxblife.com', type: 'person',
            focus: '工業設計背景轉數位 PM、PRD 與產品開發檢查表', learn: '看他如何把「PRD 撰寫、上架交付」整理成可直接套用的檢查清單，實用性高。', verifiedAt: VERIFIED },
        gelis: { name: 'ggelis 部落格', platform: 'Blogspot 部落格', url: 'https://gelis.blogspot.com', type: 'person',
            focus: '系統分析與設計(SA/SD)、UML 與程式實作銜接', learn: '參考如何把需求圖(Use Case / Sequence)連到實際程式。', verifiedAt: VERIFIED, needsTeamReview: true },
        harris: { name: 'Harris 先生', platform: '個人網站', url: 'https://yesharris.com', type: 'person',
            focus: '數位行銷、SEO、網站數據分析(Google Analytics)', learn: '看他如何用淺顯文章教 SEO 與數據分析，適合初學者建立行銷基礎。', verifiedAt: VERIFIED, botBlocked: true },
        gameislearning: { name: '遊戲式學習 (王啟榮老師)', platform: '教學網站', url: 'https://gameislearning.url.tw', type: 'person',
            focus: 'Unity 開發、AR / VR 教學與遊戲式學習平台', learn: '用繁體中文學習 Unity 基本操作與腳本，並看教學內容如何包裝成作品。', verifiedAt: VERIFIED },
        featherchung: { name: '羽毛的電玩新手村', platform: 'WordPress 部落格', url: 'https://featherchung.wordpress.com', type: 'person',
            focus: 'Unity 自學心得、Game Jam 參賽經驗', learn: '看獨立開發者如何記錄自學與參賽過程；這類「過程紀錄」文章很適合初學者模仿。', verifiedAt: VERIFIED, needsTeamReview: true, botBlocked: true },
        opendesign: { name: 'UX 四神湯開放平台', platform: '台灣設計社群資源庫', url: 'https://opendesign.tw', type: 'community',
            focus: '台灣設計社群整理的設計資源庫，供設計師與學生查閱', learn: '瀏覽台灣設計社群如何整理資源，並找到可參考的作品集與資源。', verifiedAt: VERIFIED },
        apodesign: { name: '一塊設計 (apo design)', platform: '設計共筆部落格', url: 'https://apodesign.tw', type: 'community',
            focus: 'UI/UX、網頁設計、設計思考與設計工作實務', learn: '閱讀台灣設計師的實務經驗文章，學習如何描述自己的設計決策。', verifiedAt: VERIFIED },
        behanceTw: { name: 'Behance 搜尋：Taiwan UI/UX', platform: 'Behance', url: 'https://www.behance.net/search/projects?search=Taiwan%20UI%20UX', type: 'discovery',
            focus: '以關鍵字搜尋台灣設計師的完整案例', learn: '找 2~3 位風格接近你的設計師，觀察他們的案例如何分段(問題、過程、成果)，再模仿結構。', verifiedAt: VERIFIED, botBlocked: true },
        ithelp: { name: 'iT 邦幫忙', platform: '台灣 IT 技術社群', url: 'https://ithelp.ithome.com.tw', type: 'community',
            focus: '台灣工程師的技術文章與鐵人賽系列', learn: '搜尋你的目標領域，閱讀完賽系列文，並規劃自己的 30 天挑戰。', verifiedAt: VERIFIED },
        sitcon: { name: 'SITCON 學生計算機年會', platform: '台灣學生技術社群', url: 'https://sitcon.org', type: 'community',
            focus: '由學生舉辦的技術研討會與社群，歡迎學生參與與擔任講者', learn: '參加或擔任志工，認識業界前輩與同齡開發者。', verifiedAt: VERIFIED },
        coscup: { name: 'COSCUP 開源人年會', platform: '台灣開源社群', url: 'https://coscup.org', type: 'community',
            focus: '開源軟體社群年會，議程涵蓋多種技術與產品主題', learn: '看議程找感興趣的主題，參加後寫心得文，是很好的第一篇社群貼文題材。', verifiedAt: VERIFIED }
    };

    /* ------------------------------------------------------------------
     * 社群平台
     * ------------------------------------------------------------------ */
    const platforms = {
        behance: { name: 'Behance', url: 'https://www.behance.net', role: '視覺與設計作品集' },
        instagram: { name: 'Instagram', url: 'https://www.instagram.com', role: '作品預告與設計過程分享' },
        github: { name: 'GitHub', url: 'https://github.com', role: '程式作品與開發紀錄' },
        medium: { name: 'Medium', url: 'https://medium.com', role: '技術與產品文章' },
        ithelp: { name: 'iT 邦幫忙', url: 'https://ithelp.ithome.com.tw', role: '台灣技術文章與鐵人賽' },
        linkedin: { name: 'LinkedIn', url: 'https://www.linkedin.com', role: '職場人脈與專案成果' },
        notion: { name: 'Notion', url: 'https://www.notion.so', role: '公開的作品集與知識庫' },
        kaggle: { name: 'Kaggle', url: 'https://www.kaggle.com', role: '資料分析作品與競賽' },
        cake: { name: 'Cake', url: 'https://www.cake.me', role: '台灣求職履歷與作品集' }
    };

    /* ------------------------------------------------------------------
     * 共通職能「補強任務」：UCAN 共通職能 PR 低於 34 時，自動加入每個階段
     * ------------------------------------------------------------------ */
    const gapActions = {
        '溝通表達': {
            d30: { action: '每週錄 1 支 3 分鐘語音或影片，向「非本科系」的朋友介紹你正在做的作品，請對方複述重點，檢查自己有沒有講清楚。', output: '3 支錄音 + 朋友複述的重點紀錄', tools: ['電梯簡報'], hours: '每週 1 小時', done: '朋友能不看筆記說出作品在做什麼' },
            d60: { action: '在課堂或社團做 1 次 5 分鐘分享：投影片最多 5 頁，結尾留 2 分鐘問答。', output: '5 頁投影片 + 現場回饋 3 條', tools: ['電梯簡報'], hours: '準備 3 小時', done: '完成分享並收到至少 3 條回饋' },
            d90: { action: '把本計畫中的一個專案寫成 800 字文章，或做成 5 分鐘簡報，發表在你的作品集平台。', output: '1 篇文章或 1 份簡報', tools: ['STAR'], hours: '4 小時', done: '用 STAR 架構寫完並公開' }
        },
        '持續學習': {
            d30: { action: '寫下「未來 90 天想學的 3 件事」，每週固定 3 小時學習時段並加入行事曆提醒。', output: '學習清單 + 行事曆截圖', tools: ['Notion'], hours: '1 小時設定', done: '前 2 週都有按時完成學習時段' },
            d60: { action: '每週日花 20 分鐘複盤：本週學了什麼、卡在哪、下週怎麼調整，寫在 Notion。', output: '4 則週複盤', tools: ['Notion'], hours: '每週 20 分鐘', done: '連續 4 週沒有中斷' },
            d90: { action: '挑 UCAN 專業職能中分數最低的項目，做一個小作品補強，並寫下 90 天的成長紀錄。', output: '1 個小作品 + 1 篇成長紀錄', tools: ['Notion'], hours: '6 小時', done: '紀錄中有前後對比' }
        },
        '人際互動': {
            d30: { action: '依 UCAN 建議做 1 次「職業訪談」：訪問 1 位目標職務的學長姐或業界人員，先準備 5 個問題。', output: '5 題問題清單 + 訪談筆記', tools: ['職業訪談'], hours: '訪談 30 分鐘 + 整理 1 小時', done: '取得 3 個你原本不知道的資訊' },
            d60: { action: '參加 1 場技術或設計社群活動(如 SITCON、COSCUP 或校內講座)，主動認識 2 位新朋友並互相追蹤。', output: '活動心得 + 新增 2 位聯絡人', tools: ['LinkedIn'], hours: '活動半天', done: '活動後 3 天內主動傳訊息致意' },
            d90: { action: '請 2 位認識的人針對你的作品給回饋，回覆感謝並說明你改了什麼。', output: '2 份回饋 + 改版說明', tools: ['LinkedIn'], hours: '3 小時', done: '兩位都收到你的回覆' }
        },
        '團隊合作': {
            d30: { action: '加入 1 個社團或專題小組，認領一個明確角色(如文件、測試或設計)。', output: '角色分工表', tools: ['Slack/Discord'], hours: '每週 2 小時', done: '小組知道你負責什麼' },
            d60: { action: '用看板工具管理小組任務，每週固定同步 1 次進度。', output: '看板截圖 + 4 次進度紀錄', tools: ['Trello/Jira'], hours: '每週 30 分鐘', done: '連續 4 週更新' },
            d90: { action: '參加 1 次黑客松、Game Jam 或課程專題競賽，賽後寫下你的角色與貢獻回顧。', output: '1 篇團隊合作回顧', tools: ['Game Jam', 'STAR'], hours: '活動 1~2 天', done: '回顧中寫出具體貢獻與學到的事' }
        },
        '問題解決': {
            d30: { action: '每次遇到錯誤或問題，用四行記錄：現象 → 假設 → 驗證 → 結論，累積 5 則。', output: '5 則問題紀錄', tools: ['Notion'], hours: '每則 15 分鐘', done: '每則都有「驗證」與「結論」' },
            d60: { action: '挑專案中最難的一個問題，寫成 1 頁紀錄(含失敗的嘗試)。', output: '1 頁問題解決紀錄', tools: ['Notion'], hours: '2 小時', done: '別人能照紀錄重現你的思路' },
            d90: { action: '把 3 則紀錄整理進作品集或貼文，面試時可用 STAR 講「我如何拆解問題」。', output: '1 篇貼文或作品集章節', tools: ['STAR'], hours: '3 小時', done: '能在 2 分鐘內口頭講完一個案例' }
        },
        '創新': {
            d30: { action: '每天寫下 3 個「現有 App 可以怎麼更好」的點子，持續 2 週。', output: '約 40 個點子的清單', tools: ['Notion'], hours: '每天 10 分鐘', done: '清單中標出 3 個最有感的' },
            d60: { action: '從點子中挑 1 個做成最小可行版本(草圖或可點擊原型)。', output: '1 個原型或草圖', tools: ['Figma', 'Prototype'], hours: '6 小時', done: '可以給別人操作' },
            d90: { action: '向 3 位目標使用者展示並收集回饋，決定要繼續迭代或換方向。', output: '3 份使用者回饋 + 決策紀錄', tools: ['Usability Test'], hours: '3 小時', done: '寫出「為什麼繼續/為什麼放棄」' }
        },
        '工作責任': {
            d30: { action: '為本計畫每個任務訂「完成日」，加入行事曆提醒；每週交付 1 次可檢查的成果。', output: '行事曆截圖 + 每週成果清單', tools: ['Notion'], hours: '每週 30 分鐘', done: '前 4 週準時交付' },
            d60: { action: '每次交付前用檢核表自查：檔名、連結、錯字、截圖是否完整。', output: '1 份個人交付檢核表', tools: ['Notion'], hours: '1 小時製作', done: '之後每次交付都有打勾' },
            d90: { action: '對一件已交付的作品做事後檢討：準時嗎？品質如何？下次怎麼改？', output: '1 頁事後檢討', tools: ['STAR'], hours: '1 小時', done: '寫出 2 個具體改進行動' }
        },
        '科技應用': {
            d30: { action: '挑一項你不熟的數位工具(如 Git、Google 試算表函式、Notion 自動化)，學到能向別人示範。', output: '1 支 3 分鐘示範影片', tools: ['Git', 'Google 試算表'], hours: '每週 3 小時', done: '別人能照示範做出來' },
            d60: { action: '用該工具改善一個真實流程(如整理社團名單、自動備份作業)，並記錄節省的時間。', output: '改善前後的時間對比', tools: ['Google 試算表'], hours: '4 小時', done: '有具體數字' },
            d90: { action: '再學 1 項進階數位技能(資訊安全基礎、資料分析或雲端基礎擇一)，並產出筆記。', output: '1 份學習筆記', tools: ['Notion'], hours: '8 小時', done: '筆記附上自己做的小練習' }
        }
    };

    /* ------------------------------------------------------------------
     * 職務劇本 (Role Playbook)
     * 每個職務：UCAN 對應條件 + 30/60/90 天任務 + 社群策略 + 人物
     * ------------------------------------------------------------------ */
    const roles = [
        /* ============================ UI/UX ============================ */
        {
            id: 'ui-ux', title: 'UI/UX 設計師', en: 'UI/UX Designer',
            summary: '負責把使用者的需求變成好用、好看的介面，工作包含研究、畫草稿、做原型與測試。',
            match: { holland: ['A', 'E', 'S'], clusters: ['藝文與影音傳播', '資訊科技'], pathways: ['視覺藝術', '藝術', '設計', '影音'], depts: ['IM', 'AI'] },
            focus: ['創新', '溝通表達', '科技應用'],
            plan: {
                d30: { theme: '學會工具，做出第一個真實畫面', tasks: [
                    { action: '完成 Figma 基礎：Frame、Auto Layout、Component，跟著任一入門教學做出一個登入頁(手機與桌機兩種尺寸)。', output: '1 個 Figma 檔(登入頁)', tools: ['Figma'], hours: '每週 5 小時', done: '檔案有分享連結，元件有命名' },
                    { action: '選一個你每天用的 App 或校內系統，截圖找出 3 個操作痛點，並用紙筆畫出改版 Wireframe。', output: '3 個痛點清單 + 紙本 Wireframe 照片', tools: ['Wireframe'], hours: '3 小時', done: '每個痛點都有截圖與一句原因說明' },
                    { action: '建立 Behance 與 Instagram 帳號，自我介紹寫一句話定位(誰＋做什麼設計)。', output: '2 個帳號 + 一句話自介', tools: ['Behance', 'Instagram', 'Portfolio'], hours: '1 小時', done: '帳號已公開並放上自介' }
                ] },
                d60: { theme: '做出可操作的原型，並找人測試', tasks: [
                    { action: '把改版 Wireframe 做成可點擊的 Prototype：至少 5 個畫面、2 條完整操作流程。', output: '1 個可點擊原型連結', tools: ['Figma', 'Prototype'], hours: '每週 6 小時', done: '陌生人不需你解說也能走完流程' },
                    { action: '找 5 位同學做 Usability Test，每人給 1 個任務，記錄是否完成與卡關位置。', output: '測試紀錄表(5 人)', tools: ['Usability Test'], hours: '3 小時', done: '整理出前 3 名問題' },
                    { action: '依測試結果改出第二版，保留改版前後對照圖。', output: 'Before/After 對照圖', tools: ['Figma'], hours: '4 小時', done: '每個修改都寫得出原因' }
                ] },
                d90: { theme: '把過程寫成案例，公開並請人檢視', tasks: [
                    { action: '把整個專案寫成 1 篇 Case Study：問題 → 研究 → 草稿 → 最終設計 → 測試回饋 → 反思，發表在 Behance。', output: '1 篇 Behance 案例', tools: ['Case Study', 'Behance'], hours: '8 小時', done: '案例有至少 6 個段落與 8 張圖' },
                    { action: '用 Notion 或 Canva 整理 2~3 個作品成簡易作品集，連結放到履歷與 Cake。', output: '作品集網址 + 更新後的履歷', tools: ['Portfolio', 'Notion', 'Cake'], hours: '4 小時', done: '履歷裡可以點到作品' },
                    { action: '請 2 位設計相關的學長姐或業界人員看作品集並給回饋，並把心得發成一則 IG 貼文。', output: '2 份回饋 + 1 則貼文', tools: ['Instagram', 'Carousel'], hours: '3 小時', done: '貼文有說明你根據回饋改了什麼' }
                ] }
            },
            platform: {
                primary: 'behance', secondary: 'instagram',
                why: '設計職缺的招募者最常看「完整案例」與「視覺呈現」，Behance 適合放完整案例，IG 適合持續曝光過程。',
                cadence: ['每月發表 1 篇 Behance 案例(完整故事)', '每週 1 則 IG 輪播(Carousel)：拆解一個設計決策', '每月 1 支 30 秒 Reels：從草稿到 Figma 成品的縮時'],
                postIdeas: ['我如何改善某個常用 App 的 3 個操作痛點(改版前後對照)', '從紙本草稿到 Figma 原型的設計過程(縮時)', '5 位同學測試我的原型後，我改了什麼'],
                bio: '{dept}｜UI/UX 設計練習中｜專注使用者體驗與直覺互動｜作品集：[貼上 Behance / Linktree 連結]'
            },
            creators: ['opendesign', 'apodesign', 'behanceTw'],
            resume: '我是熱愛使用者體驗的設計新鮮人，習慣先觀察使用者、再動手設計。曾以 {專案名稱} 完成從痛點調查、原型到 5 人測試的完整流程，並依回饋改版。希望在 UI/UX 設計職務中持續累積實戰經驗。'
        },
        /* ============================ 前端 ============================ */
        {
            id: 'frontend', title: '前端工程師', en: 'Frontend Engineer',
            summary: '把設計稿變成真正能操作的網站或 App 畫面，同時顧及速度與相容性。',
            match: { holland: ['A', 'I', 'R'], clusters: ['資訊科技'], pathways: ['軟體', '網頁', '互動多媒體', '前端'], depts: ['CS', 'IM'] },
            focus: ['科技應用', '問題解決', '創新'],
            plan: {
                d30: { theme: '網頁三基礎＋第一個作品', tasks: [
                    { action: '學習 HTML/CSS/JavaScript 基礎，完成一個「個人介紹頁」，要能在手機與電腦正常顯示。', output: '1 個個人介紹網頁(已部署)', tools: ['HTML/CSS/JavaScript', 'GitHub'], hours: '每週 6 小時', done: '有公開網址，手機版不破版' },
                    { action: '建立 GitHub 帳號，把作品放上去並寫 README(用途、畫面截圖、如何執行)。', output: '1 個含 README 的 GitHub 專案', tools: ['GitHub', 'README', 'Git'], hours: '2 小時', done: 'README 有截圖與執行步驟' },
                    { action: '練習把一張設計稿(可在 Figma 社群找免費稿)還原成網頁。', output: '1 個還原作品', tools: ['Figma', 'HTML/CSS/JavaScript'], hours: '6 小時', done: '與設計稿對照差異小於 5%' }
                ] },
                d60: { theme: '學框架，做會跟資料互動的網站', tasks: [
                    { action: '學習 React 基礎(元件、狀態)，做出一個 Todo 或天氣查詢小工具，串接公開 API。', output: '1 個串接 API 的 React 小專案', tools: ['React', 'API'], hours: '每週 6 小時', done: '能處理載入中與錯誤狀態' },
                    { action: '每週至少 2 次有意義的 Commit，commit 訊息寫清楚改了什麼。', output: 'GitHub 近 4 週的 Commit 紀錄', tools: ['Commit', 'Git'], hours: '融入開發', done: '連續 4 週有紀錄' },
                    { action: '用瀏覽器開發者工具檢查一個網站的載入速度，寫下 3 個可優化點並實作其中 1 個。', output: '1 篇優化紀錄', tools: ['HTML/CSS/JavaScript'], hours: '3 小時', done: '有優化前後數據' }
                ] },
                d90: { theme: '完整作品＋公開輸出', tasks: [
                    { action: '做 1 個完整作品(例如校園活動網站)，包含設計、前端與部署，並邀請 5 位使用者試用。', output: '1 個上線作品 + 5 份使用回饋', tools: ['React', 'GitHub'], hours: '每週 8 小時', done: '有公開網址與使用回饋' },
                    { action: '把開發過程寫成 1 篇技術文章，發表在 iT 邦幫忙或 Medium。', output: '1 篇技術文章', tools: ['iT 邦幫忙鐵人賽', 'Medium'], hours: '5 小時', done: '文章含問題、解法與程式片段' },
                    { action: '更新 GitHub 首頁與履歷，挑 3 個代表作釘選。', output: '更新後的 GitHub 與履歷', tools: ['GitHub', 'Cake'], hours: '2 小時', done: '3 個專案都有 README 與截圖' }
                ] }
            },
            platform: {
                primary: 'github', secondary: 'ithelp',
                why: '前端職缺最看「真的做過什麼」，GitHub 提供可驗證的程式紀錄，技術文章則展現你能不能把事情講清楚。',
                cadence: ['每週至少 2 次有意義的 Commit', '每月 1 篇技術文章(Debug 或做法紀錄)', '每季整理 1 次 GitHub 首頁與 README'],
                postIdeas: ['我如何把一張設計稿還原成網頁(遇到的 3 個問題)', '第一次串接 API 時遇到的錯誤與解法', '用開發者工具把網頁載入時間縮短的紀錄'],
                bio: '{dept}｜前端開發練習中｜HTML/CSS/JavaScript、React｜作品與程式碼：[貼上 GitHub 連結]'
            },
            creators: ['huli', 'pjchender', 'ithelp'],
            resume: '我是喜歡把畫面做出來的前端新鮮人，熟悉 HTML/CSS/JavaScript 與 React。曾完成 {作品名稱}，串接 {API 或資料來源}，並公開程式碼於 GitHub。希望在前端職務中持續精進網頁效能與使用者體驗。'
        },
        /* ============================ 後端 ============================ */
        {
            id: 'backend', title: '後端工程師', en: 'Backend Engineer',
            summary: '負責網站與 App 背後的資料、邏輯與 API，確保系統穩定且資料正確。',
            match: { holland: ['I', 'R', 'C'], clusters: ['資訊科技', '科學、技術、工程、數學'], pathways: ['軟體', '資料庫', '系統'], depts: ['CS', 'IM'] },
            focus: ['問題解決', '科技應用', '持續學習'],
            plan: {
                d30: { theme: '一門語言＋資料庫基礎', tasks: [
                    { action: '選定 1 種後端語言(例如 Python 或 Node.js)，完成基礎語法練習，並寫 1 個能讀寫檔案的小程式。', output: '1 個命令列小程式', tools: ['Python', 'Git'], hours: '每週 6 小時', done: '程式能處理錯誤輸入' },
                    { action: '學習 SQL 基礎(SELECT、JOIN、GROUP BY)，用公開資料集做 10 題查詢練習。', output: '10 題 SQL 練習紀錄', tools: ['SQL'], hours: '4 小時', done: '每題都有查詢與結果說明' },
                    { action: '建立 GitHub 專案，寫 README 說明專案用途與執行方式。', output: '1 個 GitHub 專案', tools: ['GitHub', 'README'], hours: '2 小時', done: '別人能照 README 執行成功' }
                ] },
                d60: { theme: '做出有資料庫的 API', tasks: [
                    { action: '用一個後端框架做出具備新增、查詢、修改、刪除功能的 REST API，並串接資料庫。', output: '1 個 CRUD REST API 專案', tools: ['REST API', 'SQL', 'Postman'], hours: '每週 6 小時', done: '用 Postman 測過每個功能' },
                    { action: '為資料庫畫 ER 圖，並說明為什麼這樣設計資料表。', output: '1 張 ER 圖 + 說明', tools: ['ER 圖'], hours: '2 小時', done: '資料表之間的關係有標註' },
                    { action: '為 API 寫基本測試，確認常見輸入與錯誤輸入。', output: '5 個以上測試案例', tools: ['Test Case', 'Postman'], hours: '3 小時', done: '測試可重複執行' }
                ] },
                d90: { theme: '部署上線，並記錄學到的事', tasks: [
                    { action: '把專案用 Docker 打包，並部署到雲端免費方案或自己的主機，提供公開網址。', output: '1 個上線的 API + Dockerfile', tools: ['Docker', 'AWS/GCP'], hours: '8 小時', done: '用公開網址可以呼叫 API' },
                    { action: '寫 1 篇文章說明專案架構、遇到的問題與解法(含流程圖)。', output: '1 篇技術文章', tools: ['iT 邦幫忙鐵人賽', 'Medium'], hours: '5 小時', done: '文章有架構圖' },
                    { action: '設定 GitHub Actions 讓程式更新時自動執行測試。', output: '1 條 CI 流程', tools: ['CI/CD', 'GitHub Actions'], hours: '3 小時', done: 'Actions 顯示通過' }
                ] }
            },
            platform: {
                primary: 'github', secondary: 'ithelp',
                why: '後端面試看的是你的設計與除錯能力，GitHub 與技術文章能呈現你的思考過程。',
                cadence: ['每週至少 2 次 Commit', '每月 1 篇技術複盤(Debug 或架構設計)', '每個專案都附架構圖與 README'],
                postIdeas: ['我的 API 如何設計資料表(ER 圖說明)', '一次實際除錯的紀錄：現象→假設→驗證→結論', '把專案用 Docker 部署上線的完整流程'],
                bio: '{dept}｜後端開發練習中｜Python、SQL、API 設計｜專案與開發日誌：[貼上 GitHub 連結]'
            },
            creators: ['huli', 'chechia', 'ithelp'],
            resume: '我是重視邏輯與穩定性的後端新鮮人，熟悉 {程式語言}、SQL 與 REST API 設計。曾完成 {專案名稱}，包含資料表設計、API 測試與雲端部署。希望在後端職務中把系統做得更穩定。'
        },
        /* ============================ 資料分析 ============================ */
        {
            id: 'data-analyst', title: '資料分析師', en: 'Data Analyst',
            summary: '把資料整理、分析並用圖表說明，幫助團隊做決策。',
            match: { holland: ['I', 'C', 'E'], clusters: ['資訊科技', '科學、技術、工程、數學', '金融財務', '行銷與銷售'], pathways: ['資料', '數據', '統計', '分析'], depts: ['AI', 'IM'] },
            focus: ['問題解決', '科技應用', '溝通表達'],
            plan: {
                d30: { theme: '資料處理基本功', tasks: [
                    { action: '學習 Python 與 Pandas 基礎，用 1 份政府開放資料完成資料清理(缺值、重複值、格式)。', output: '1 本 Jupyter Notebook', tools: ['Python', 'Pandas', 'Jupyter Notebook'], hours: '每週 6 小時', done: 'Notebook 有每一步清理的說明文字' },
                    { action: '學習 SQL 基礎，完成 10 題查詢練習。', output: '10 題 SQL 練習', tools: ['SQL'], hours: '4 小時', done: '每題都有結果說明' },
                    { action: '建立 Kaggle 與 GitHub 帳號，把 Notebook 公開。', output: '2 個帳號 + 公開 Notebook', tools: ['Kaggle', 'GitHub'], hours: '1 小時', done: '連結可以公開開啟' }
                ] },
                d60: { theme: '從資料找出答案並視覺化', tasks: [
                    { action: '針對一個你有興趣的問題(如校園、交通、消費)做探索性分析，產出 5 張圖與 3 個發現。', output: '1 份分析報告(含 5 張圖)', tools: ['Python', 'Pandas', 'Jupyter Notebook'], hours: '每週 6 小時', done: '每個發現都有數據佐證' },
                    { action: '用視覺化工具做 1 個互動儀表板。', output: '1 個儀表板', tools: ['Tableau/Power BI'], hours: '6 小時', done: '別人不需解釋就能看懂重點' },
                    { action: '練習 A/B Test 的基本概念，並用範例資料算一次兩組差異。', output: '1 份 A/B Test 練習紀錄', tools: ['A/B Test'], hours: '3 小時', done: '寫得出結論與限制' }
                ] },
                d90: { theme: '完整專案＋講給非專業者聽', tasks: [
                    { action: '完成 1 個完整分析專案：提出問題、取得資料、分析、給建議，並寫成 1 頁摘要。', output: '1 份專案報告 + 1 頁摘要', tools: ['Python', 'Kaggle'], hours: '每週 8 小時', done: '摘要可讓不懂技術的人看懂' },
                    { action: '把專案發表成文章或簡報，並請 2 位非本科系的人聽完後說出重點。', output: '1 篇文章 + 2 份理解回饋', tools: ['Medium', '電梯簡報'], hours: '4 小時', done: '對方能複述結論' },
                    { action: '更新 GitHub、Kaggle 與履歷，挑 2 個代表作。', output: '更新後的作品集', tools: ['GitHub', 'Cake'], hours: '2 小時', done: '代表作都有 README' }
                ] }
            },
            platform: {
                primary: 'kaggle', secondary: 'medium',
                why: '資料分析的招募者想看你處理過的資料與結論，Kaggle 可公開 Notebook，文章能展現你的說明能力。',
                cadence: ['每月完成 1 份公開 Notebook', '每月 1 篇「資料問題→發現→建議」文章', '每季更新 GitHub 作品集'],
                postIdeas: ['我用政府開放資料回答的一個問題(含 5 張圖)', '資料清理時最常遇到的 3 個坑', '把分析結果講給非專業者聽的經驗'],
                bio: '{dept}｜資料分析練習中｜Python、SQL、視覺化｜分析筆記：[貼上 Kaggle / Medium 連結]'
            },
            creators: ['leemeng', 'haosquare', 'ithelp'],
            resume: '我擅長把資料整理成能支持決策的結論，熟悉 Python、Pandas 與 SQL。曾以 {資料來源} 完成 {分析主題}，產出圖表並提出 {建議}。希望在資料分析職務中幫助團隊用數據做決定。'
        },
        /* ============================ AI/ML ============================ */
        {
            id: 'ai-ml', title: 'AI / 機器學習工程師', en: 'AI / Machine Learning Engineer',
            summary: '訓練與應用機器學習模型，解決預測、分類或推薦等問題。',
            match: { holland: ['I', 'R', 'A'], clusters: ['資訊科技', '科學、技術、工程、數學'], pathways: ['資料科學', '人工智慧', 'AI', '資料'], depts: ['AI'] },
            focus: ['問題解決', '持續學習', '創新'],
            plan: {
                d30: { theme: '工具與基礎觀念', tasks: [
                    { action: '用中文公開課程(例如李宏毅教授的機器學習課程)學習前幾講，並寫 1 頁重點筆記。', output: '1 頁課程筆記', tools: ['Machine Learning'], hours: '每週 5 小時', done: '筆記用自己的話寫成' },
                    { action: '安裝 Python 與 scikit-learn，用內建資料集完成 1 個分類範例。', output: '1 本 Jupyter Notebook', tools: ['Python', 'scikit-learn', 'Jupyter Notebook'], hours: '4 小時', done: '寫出準確率與你的觀察' },
                    { action: '建立 GitHub 與 Kaggle 帳號。', output: '2 個帳號', tools: ['GitHub', 'Kaggle'], hours: '1 小時', done: '已公開自我介紹' }
                ] },
                d60: { theme: '完整做一次資料→模型→評估', tasks: [
                    { action: '從 Kaggle 挑 1 個入門資料集，完成資料清理、訓練、評估並比較 2 種模型。', output: '1 份比較 2 種模型的 Notebook', tools: ['Kaggle', 'scikit-learn', 'Pandas'], hours: '每週 6 小時', done: '有評估指標與模型比較表' },
                    { action: '寫下你選擇指標與模型的理由，以及模型錯在哪裡。', output: '1 頁錯誤分析', tools: ['Machine Learning'], hours: '2 小時', done: '至少分析 5 個預測錯誤的例子' },
                    { action: '把 Notebook 整理成 README 與圖表，放上 GitHub。', output: '1 個完整 GitHub 專案', tools: ['GitHub', 'README'], hours: '3 小時', done: '別人能重現你的結果' }
                ] },
                d90: { theme: '做成可展示的應用', tasks: [
                    { action: '把模型包成簡單網頁或 API，讓別人可以輸入資料得到預測。', output: '1 個可操作的展示頁', tools: ['Python', 'API'], hours: '每週 8 小時', done: '朋友可自行操作' },
                    { action: '寫 1 篇文章說明專案、限制與未來改進。', output: '1 篇技術文章', tools: ['Medium', 'iT 邦幫忙鐵人賽'], hours: '5 小時', done: '文章有明確寫出限制' },
                    { action: '更新履歷，專案用 STAR 描述並量化成果。', output: '更新後的履歷', tools: ['STAR', 'Cake'], hours: '2 小時', done: '每個專案有 1 個數字成果' }
                ] }
            },
            platform: {
                primary: 'kaggle', secondary: 'github',
                why: 'AI 職缺重視可重現的實驗與清楚的分析，Kaggle 與 GitHub 可以公開驗證。',
                cadence: ['每月完成 1 個資料集練習', '每個專案都附評估指標與錯誤分析', '每季發表 1 篇心得文章'],
                postIdeas: ['我如何比較兩種模型的表現(附圖表)', '模型預測錯誤的 5 個例子與原因', '把模型包成網頁的過程'],
                bio: '{dept}｜AI / 機器學習練習中｜Python、scikit-learn｜實驗與程式碼：[貼上 GitHub / Kaggle 連結]'
            },
            creators: ['hylee', 'leemeng', 'haosquare'],
            resume: '我對 AI 與資料充滿好奇，熟悉 Python 與 scikit-learn。曾在 {專案名稱} 中比較 {模型} 並分析錯誤原因，將結果公開於 GitHub。希望在 AI 相關職務中持續學習與實作。'
        },
        /* ============================ QA ============================ */
        {
            id: 'qa', title: '軟體測試工程師 (QA)', en: 'QA / Test Engineer',
            summary: '在產品上線前找出問題，設計測試方法，確保品質。',
            match: { holland: ['C', 'I', 'R'], clusters: ['資訊科技'], pathways: ['測試', '品質', '軟體'], depts: ['CS', 'IM'] },
            focus: ['工作責任', '問題解決', '科技應用'],
            plan: {
                d30: { theme: '學會設計測試案例', tasks: [
                    { action: '學習測試基本觀念(黑箱／白箱測試)，為一個你常用的 App 寫 20 個 Test Case。', output: '20 個 Test Case(表格)', tools: ['Test Case'], hours: '每週 4 小時', done: '每個案例有步驟、預期結果' },
                    { action: '實際執行這些案例，找到的問題用 Bug Report 格式記錄。', output: '至少 3 份 Bug Report', tools: ['Bug Report'], hours: '3 小時', done: '開發者能照步驟重現' },
                    { action: '建立 GitHub 帳號，把測試文件放上去。', output: '1 個 GitHub 專案', tools: ['GitHub', 'README'], hours: '1 小時', done: '有 README' }
                ] },
                d60: { theme: '自動化測試入門', tasks: [
                    { action: '學習 Python 或 JavaScript 基礎，並用自動化工具操作一個網站完成登入流程測試。', output: '1 支自動化測試腳本', tools: ['Selenium/Playwright', 'Python'], hours: '每週 6 小時', done: '腳本可重複執行' },
                    { action: '用 Postman 測試一組公開 API，記錄正常與錯誤情境。', output: '1 份 API 測試集合', tools: ['Postman', 'REST API'], hours: '3 小時', done: '包含至少 3 種錯誤情境' },
                    { action: '把測試結果整理成 1 頁測試報告。', output: '1 頁測試報告', tools: ['Test Case'], hours: '2 小時', done: '報告有通過率與問題清單' }
                ] },
                d90: { theme: '整合進流程並公開成果', tasks: [
                    { action: '用 GitHub Actions 讓自動化測試在程式更新時自動執行。', output: '1 條 CI 測試流程', tools: ['CI/CD', 'GitHub Actions'], hours: '4 小時', done: 'Actions 顯示結果' },
                    { action: '幫同學的專題或開源專案找 Bug，並用 Bug Report 回報。', output: '至少 3 份真實 Bug Report', tools: ['Bug Report', 'GitHub'], hours: '6 小時', done: '至少 1 份被對方確認' },
                    { action: '寫 1 篇文章分享你的測試策略與結果。', output: '1 篇文章', tools: ['Medium', 'iT 邦幫忙鐵人賽'], hours: '4 小時', done: '文章包含策略、實作、成果' }
                ] }
            },
            platform: {
                primary: 'github', secondary: 'medium',
                why: 'QA 職缺看你的測試思維與自動化能力，測試案例與腳本放在 GitHub 最有說服力。',
                cadence: ['每週整理 1 份 Test Case 或測試腳本', '每月 1 篇測試策略文章', '作品附上測試報告'],
                postIdeas: ['我為常用 App 設計的 20 個 Test Case', '一次找到 Bug 的過程與回報方式', '我的第一支自動化測試腳本'],
                bio: '{dept}｜軟體測試(QA)練習中｜Test Case、自動化測試｜測試文件與腳本：[貼上 GitHub 連結]'
            },
            creators: ['jimmyhong', 'ithelp', 'sitcon'],
            resume: '我是注重細節的 QA 新鮮人，能設計測試案例並撰寫清楚的 Bug Report。曾針對 {產品名稱} 設計 {數量} 個測試案例，找出 {數量} 個問題，並建立自動化測試。希望在 QA 職務中守住產品品質。'
        },
        /* ============================ PM ============================ */
        {
            id: 'pm', title: '數位產品經理 / 專案管理 (PM)', en: 'Product / Project Manager',
            summary: '負責釐清需求、安排優先順序、協調設計與工程團隊，讓產品如期上線。',
            match: { holland: ['E', 'S', 'A'], clusters: ['企業經營管理', '資訊科技', '行銷與銷售'], pathways: ['專案', '管理', '產品', '企劃'], depts: ['IM'] },
            focus: ['溝通表達', '團隊合作', '人際互動'],
            plan: {
                d30: { theme: '學會寫需求與管理任務', tasks: [
                    { action: '學習 Agile/Scrum 基本流程，並用 Trello 或 Jira 管理一個小組作業(任務、負責人、期限)。', output: '1 個任務看板', tools: ['Agile/Scrum', 'Trello/Jira'], hours: '每週 4 小時', done: '每張卡片有負責人與期限' },
                    { action: '選一個你常用的產品，為它的一項新功能寫 5 則 User Story。', output: '5 則 User Story', tools: ['User Story'], hours: '3 小時', done: '每則都有驗收條件' },
                    { action: '閱讀 1 位 PM 的實務文章(見下方推薦)，寫出 3 個你學到的做法。', output: '1 份閱讀筆記', tools: ['Notion'], hours: '2 小時', done: '寫得出如何應用在自己的專案' }
                ] },
                d60: { theme: '完整寫一份 PRD 並測試想法', tasks: [
                    { action: '為一個校園或社團需求寫 1 份 PRD：問題、目標、功能清單、優先順序、驗收方式。', output: '1 份 PRD', tools: ['PRD'], hours: '每週 5 小時', done: '有明確的不做清單' },
                    { action: '訪談 5 位目標使用者，驗證需求是否真的存在。', output: '5 份訪談摘要', tools: ['職業訪談', 'Notion'], hours: '4 小時', done: '整理出 3 個共同痛點' },
                    { action: '畫出簡易 Wireframe，與 1 位工程或設計背景的同學確認可行性。', output: '1 份 Wireframe + 可行性回饋', tools: ['Wireframe', 'Figma'], hours: '3 小時', done: '得到具體修改意見' }
                ] },
                d90: { theme: '實際帶一次專案並復盤', tasks: [
                    { action: '擔任一個專題或活動的組長，帶領小組在期限內交付成果，並每週同步進度。', output: '專案成果 + 4 週進度紀錄', tools: ['Agile/Scrum', 'Trello/Jira'], hours: '每週 4 小時', done: '準時交付並記錄風險與處理' },
                    { action: '寫 1 篇專案復盤：目標、做法、結果、下次改進。', output: '1 篇復盤文章', tools: ['STAR', 'Medium'], hours: '3 小時', done: '有量化的結果' },
                    { action: '更新履歷與 LinkedIn，用 STAR 寫出 2 段專案管理經驗。', output: '更新後的履歷與 LinkedIn', tools: ['STAR', 'LinkedIn', 'Cake'], hours: '2 小時', done: '每段有數字成果' }
                ] }
            },
            platform: {
                primary: 'linkedin', secondary: 'medium',
                why: 'PM 的價值在於溝通與成果，LinkedIn 讓人看到你的專案管理成果，文章展現你的思考方式。',
                cadence: ['每兩週 1 篇產品分析或專案復盤', '每月 1 則 LinkedIn 專案成果貼文', '每季整理 1 份 PRD 範本'],
                postIdeas: ['我如何用 5 則 User Story 拆解一個新功能', '帶 4 人小組如何在期限內完成專題(時程與工具)', '拆解一個知名 App 的功能優先順序'],
                bio: '{dept}｜產品與專案管理練習中｜擅長需求拆解與團隊協作｜專案成果：[貼上 LinkedIn / Notion 連結]'
            },
            creators: ['junemilktea', 'byxblife', 'ithelp'],
            resume: '我是目標導向的專案管理新鮮人，習慣用 User Story 與看板管理任務。曾擔任 {專案名稱} 組長，帶領 {人數} 人於 {期限} 內完成 {成果}。希望在 PM 職務中累積產品與團隊協作經驗。'
        },
        /* ============================ SA/BA ============================ */
        {
            id: 'sa-ba', title: '系統分析師 / 商業分析師 (SA/BA)', en: 'System / Business Analyst',
            summary: '訪談使用者、釐清流程與需求，把需求整理成工程師能實作的規格。',
            match: { holland: ['E', 'C', 'I'], clusters: ['資訊科技', '企業經營管理'], pathways: ['系統分析', '資訊管理', '管理', '企業'], depts: ['IM'] },
            focus: ['溝通表達', '問題解決', '工作責任'],
            plan: {
                d30: { theme: '學會畫需求與流程', tasks: [
                    { action: '學習 UML 的 Use Case 圖與活動圖，為一個校園系統(如選課)畫出主要使用情境。', output: '1 張 Use Case 圖 + 1 張流程圖', tools: ['UML/Use Case'], hours: '每週 4 小時', done: '每個情境都寫得出誰、做什麼、為什麼' },
                    { action: '訪談 2 位實際使用者，記錄他們的流程與痛點。', output: '2 份訪談紀錄', tools: ['職業訪談', 'Notion'], hours: '3 小時', done: '整理出 3 個痛點' },
                    { action: '把需求寫成 5 則 User Story。', output: '5 則 User Story', tools: ['User Story'], hours: '2 小時', done: '每則有驗收條件' }
                ] },
                d60: { theme: '寫出完整的需求規格', tasks: [
                    { action: '為這個系統寫 1 份需求規格(功能需求與非功能需求)。', output: '1 份需求規格文件', tools: ['PRD', 'UML/Use Case'], hours: '每週 5 小時', done: '每個需求有編號且可驗收' },
                    { action: '設計資料庫並畫 ER 圖，與 1 位工程背景同學確認。', output: '1 張 ER 圖', tools: ['ER 圖', 'SQL'], hours: '4 小時', done: '得到具體回饋' },
                    { action: '畫出簡易 Wireframe，與使用者確認流程。', output: '1 份 Wireframe', tools: ['Wireframe', 'Figma'], hours: '3 小時', done: '使用者確認過主要流程' }
                ] },
                d90: { theme: '把分析成果公開並簡報', tasks: [
                    { action: '把整份分析整理成 1 份簡報，向 3 位對象做 10 分鐘說明並收集提問。', output: '1 份簡報 + 提問紀錄', tools: ['電梯簡報', 'Canva'], hours: '5 小時', done: '回答得出每個提問' },
                    { action: '寫 1 篇文章分享你如何從訪談到規格。', output: '1 篇文章', tools: ['Medium', 'iT 邦幫忙鐵人賽'], hours: '4 小時', done: '包含流程圖與範例' },
                    { action: '更新履歷與作品集，放入規格、圖表與簡報。', output: '更新後的作品集', tools: ['Portfolio', 'Notion', 'Cake'], hours: '2 小時', done: '作品集可公開閱讀' }
                ] }
            },
            platform: {
                primary: 'notion', secondary: 'linkedin',
                why: 'SA/BA 的成果是文件與圖表，用 Notion 公開頁面最能呈現完整分析，LinkedIn 則用來被業界看見。',
                cadence: ['每月整理 1 份分析案例(流程圖＋規格)', '每月 1 則 LinkedIn 貼文分享方法', '作品集附上需求規格範例'],
                postIdeas: ['我如何訪談使用者並整理需求', '用 Use Case 圖拆解校園選課系統', '從 ER 圖到資料表的設計思路'],
                bio: '{dept}｜系統與商業分析練習中｜UML、需求規格、流程設計｜分析案例：[貼上 Notion 連結]'
            },
            creators: ['gelis', 'byxblife', 'junemilktea'],
            resume: '我擅長把需求整理成清楚的規格，熟悉 UML、User Story 與 ER 圖。曾針對 {系統名稱} 訪談 {人數} 位使用者並完成需求規格。希望在系統分析或商業分析職務中成為團隊與使用者之間的橋樑。'
        },
        /* ============================ 技術業務 ============================ */
        {
            id: 'presales', title: 'IT 客服 / 技術業務 (Pre-sales)', en: 'Technical Support / Pre-sales',
            summary: '用技術背景向客戶說明產品價值、解決客戶問題，是技術與客戶之間的橋樑。',
            match: { holland: ['S', 'E'], clusters: ['行銷與銷售', '資訊科技', '個人及社會服務'], pathways: ['業務', '客服', '銷售', '技術支援'], depts: ['IM'] },
            focus: ['人際互動', '溝通表達', '團隊合作'],
            plan: {
                d30: { theme: '搞懂一個產品，講得清楚', tasks: [
                    { action: '選一項你感興趣的技術產品(如雲端服務)，整理它解決什麼問題、適合誰、價格方式。', output: '1 頁產品說明', tools: ['Notion'], hours: '每週 4 小時', done: '一頁內講完且不含難懂術語' },
                    { action: '練習用 3 分鐘向不懂技術的人講解這項產品。', output: '3 次練習錄音', tools: ['電梯簡報'], hours: '3 小時', done: '對方能複述產品價值' },
                    { action: '訪談 1 位從事技術業務或客服的人，了解工作日常。', output: '1 份訪談筆記', tools: ['職業訪談'], hours: '2 小時', done: '得到 3 個你原本不知道的資訊' }
                ] },
                d60: { theme: '簡報與處理異議', tasks: [
                    { action: '製作 1 份 10 頁產品簡報，並列出客戶最可能問的 10 個問題與回答。', output: '1 份簡報 + 10 題 Q&A', tools: ['Canva', '電梯簡報'], hours: '每週 5 小時', done: '每題回答都有依據' },
                    { action: '找 3 位同學扮演客戶，進行模擬簡報並收集回饋。', output: '3 份回饋', tools: ['STAR'], hours: '3 小時', done: '寫出 3 個改進行動' },
                    { action: '寫一份常見問題(FAQ)文件，用客戶聽得懂的語言說明。', output: '1 份 FAQ', tools: ['Notion'], hours: '3 小時', done: '朋友看得懂並能照做' }
                ] },
                d90: { theme: '實戰與人脈', tasks: [
                    { action: '參加 1 場技術社群活動，認識 3 位業界人士，活動後主動聯絡。', output: '活動心得 + 3 位新聯絡人', tools: ['LinkedIn'], hours: '活動半天', done: '3 天內完成聯絡' },
                    { action: '擔任校內助教或社團講師，教別人使用一項工具。', output: '1 次教學紀錄 + 學員回饋', tools: ['STAR'], hours: '4 小時', done: '收到至少 3 條回饋' },
                    { action: '更新履歷與 LinkedIn，用 STAR 描述你的溝通成果。', output: '更新後的履歷', tools: ['STAR', 'LinkedIn', 'Cake'], hours: '2 小時', done: '有量化結果' }
                ] }
            },
            platform: {
                primary: 'linkedin', secondary: 'instagram',
                why: '技術業務靠人脈與說服力，LinkedIn 能讓業界看見你的互動與成果。',
                cadence: ['每週 1 則活動或專題心得', '每月主動聯絡 2 位業界前輩請益', '每季整理 1 次人脈與回饋'],
                postIdeas: ['參加技術研討會的 3 個收穫', '如何用 3 分鐘向外行人解釋一項技術', '我做的模擬客戶簡報，得到的回饋'],
                bio: '{dept}｜技術溝通與客戶服務練習中｜擅長把技術講白話｜歡迎交流：[貼上 LinkedIn 連結]'
            },
            creators: ['sitcon', 'coscup', 'ithelp'],
            resume: '我善於把技術用客戶聽得懂的方式說明，也樂於協助他人解決問題。曾在 {活動或社團} 擔任 {角色}，成功 {成果}。希望在技術客服或技術業務職務中成為客戶與團隊之間的橋樑。'
        },
        /* ============================ 網路/DevOps ============================ */
        {
            id: 'network-devops', title: '網路與系統維運 / DevOps', en: 'Network / DevOps Engineer',
            summary: '負責讓網路與伺服器穩定運作，並用自動化減少人工操作。',
            match: { holland: ['R', 'C', 'I'], clusters: ['資訊科技', '製造'], pathways: ['網路', '系統維運', '維運', '雲端'], depts: ['CS'] },
            focus: ['問題解決', '工作責任', '科技應用'],
            plan: {
                d30: { theme: '網路與 Linux 基礎', tasks: [
                    { action: '學習網路基礎(IP、DNS、TCP/HTTP)，用 Wireshark 擷取你自己電腦的一次網頁連線，說明看到的封包。', output: '1 份封包分析筆記', tools: ['Wireshark'], hours: '每週 5 小時', done: '寫出每個步驟在做什麼' },
                    { action: '在虛擬機或雲端主機練習 Linux 常用指令，並架一個簡單網站。', output: '1 個自架網站', tools: ['Linux', 'Nginx'], hours: '5 小時', done: '外部可連線' },
                    { action: '用 Git 管理你的設定檔與筆記。', output: '1 個 GitHub 專案', tools: ['Git', 'GitHub'], hours: '1 小時', done: '有 README' }
                ] },
                d60: { theme: '自動化與容器', tasks: [
                    { action: '寫 1 支 Shell 或 Python 腳本，自動備份指定資料夾並記錄結果。', output: '1 支備份腳本', tools: ['Linux', 'Python'], hours: '每週 5 小時', done: '排程可自動執行' },
                    { action: '把你的網站用 Docker 打包並重新部署。', output: '1 個 Dockerfile + 部署紀錄', tools: ['Docker'], hours: '5 小時', done: '一行指令可啟動' },
                    { action: '設定基本監控(例如檢查網站是否存活)，故障時通知你。', output: '1 套簡易監控', tools: ['Python'], hours: '3 小時', done: '模擬故障能收到通知' }
                ] },
                d90: { theme: '雲端與流程', tasks: [
                    { action: '把網站部署到雲端免費方案，並說明費用與安全設定。', output: '1 個雲端部署 + 設定說明', tools: ['AWS/GCP', 'Docker'], hours: '每週 6 小時', done: '公開網址可用，有基本防護設定' },
                    { action: '設定 GitHub Actions，程式更新後自動部署。', output: '1 條自動部署流程', tools: ['CI/CD', 'GitHub Actions'], hours: '4 小時', done: '更新程式後網站自動更新' },
                    { action: '寫 1 篇維運筆記，記錄你遇到的故障與排查步驟。', output: '1 篇維運筆記', tools: ['iT 邦幫忙鐵人賽', 'Medium'], hours: '4 小時', done: '包含現象、排查、解法' }
                ] }
            },
            platform: {
                primary: 'github', secondary: 'ithelp',
                why: '維運職缺看實作與問題排查，筆記與腳本放在 GitHub 與技術社群最能證明。',
                cadence: ['每週 1 則實作筆記', '每月 1 篇故障排查文章', '所有腳本附 README'],
                postIdeas: ['我如何用 Wireshark 看懂一次網頁連線', '自動備份腳本的設計與測試', '一次網站故障的排查紀錄'],
                bio: '{dept}｜網路與維運練習中｜Linux、Docker、自動化｜實作筆記：[貼上 GitHub 連結]'
            },
            creators: ['chusiang', 'chechia', 'ithelp'],
            resume: '我喜歡動手讓系統穩定運作，熟悉 Linux、Docker 與基本自動化。曾自行部署 {專案名稱}，並建立自動備份與監控。希望在維運或 DevOps 職務中持續精進。'
        },
        /* ============================ 資安 ============================ */
        {
            id: 'security', title: '資安工程師', en: 'Security Engineer',
            summary: '找出系統弱點、提出修補建議，保護資料與服務安全。',
            match: { holland: ['I', 'R', 'C'], clusters: ['資訊科技', '司法、法律與公共安全'], pathways: ['資訊安全', '資安', '網路'], depts: ['CS'] },
            focus: ['問題解決', '工作責任', '持續學習'],
            plan: {
                d30: { theme: '網站安全基礎', tasks: [
                    { action: '閱讀 OWASP Top 10，挑 3 項用自己的話寫成筆記(原理、例子、防禦)。', output: '3 則資安筆記', tools: ['OWASP Top 10'], hours: '每週 5 小時', done: '每則都能舉出一個例子' },
                    { action: '在自己架設的練習環境(或合法的練習平台)嘗試 1 種常見漏洞，並記錄修補方式。', output: '1 份漏洞練習紀錄', tools: ['Linux'], hours: '5 小時', done: '有重現與修補步驟' },
                    { action: '建立 GitHub 帳號，將筆記整理成專案。', output: '1 個 GitHub 專案', tools: ['GitHub', 'README'], hours: '2 小時', done: '有 README' }
                ] },
                d60: { theme: '動手解題與工具', tasks: [
                    { action: '參加或練習 1 場 CTF(合法解題競賽)，解出至少 3 題並寫解題報告。', output: '3 份解題報告', tools: ['CTF'], hours: '每週 6 小時', done: '報告寫出思路與工具' },
                    { action: '學習用 Wireshark 與 Nmap(只在自己的環境)觀察網路行為，寫筆記。', output: '1 份筆記', tools: ['Wireshark', 'Nmap'], hours: '4 小時', done: '筆記有截圖與說明' },
                    { action: '閱讀 1 篇資安研究文章(見推薦)，用自己的話整理成 1 頁摘要。', output: '1 頁摘要', tools: ['Notion'], hours: '2 小時', done: '寫出原理與防禦建議' }
                ] },
                d90: { theme: '公開輸出與規範意識', tasks: [
                    { action: '把你的練習過程寫成 1 篇文章，明確標示只在合法環境進行。', output: '1 篇資安文章', tools: ['iT 邦幫忙鐵人賽', 'Medium'], hours: '5 小時', done: '包含原理、重現、防禦' },
                    { action: '為你的 GitHub 專案做基本安全檢查(密碼是否寫在程式裡、相依套件)，並改善。', output: '1 份安全檢查紀錄', tools: ['GitHub', 'Git'], hours: '3 小時', done: '修正至少 2 個問題' },
                    { action: '更新履歷，把解題與練習用 STAR 描述。', output: '更新後的履歷', tools: ['STAR', 'Cake'], hours: '2 小時', done: '有具體成果' }
                ] }
            },
            platform: {
                primary: 'github', secondary: 'ithelp',
                why: '資安領域重視「發現過程與防禦」的完整紀錄，解題報告與筆記能展現實力。',
                cadence: ['每月 1 篇解題或研究筆記', '每週練習並記錄', '所有實作都標示合法環境'],
                postIdeas: ['OWASP Top 10 其中一項的原理與防禦', 'CTF 解題報告(思路與工具)', '我的 GitHub 專案如何避免密碼外洩'],
                bio: '{dept}｜資訊安全練習中｜OWASP、CTF｜學習筆記：[貼上 GitHub 連結]'
            },
            creators: ['orange', 'huli', 'ithelp'],
            resume: '我對資訊安全抱持熱情，熟悉 OWASP Top 10 並實作過 CTF 解題。曾針對 {主題} 撰寫解題報告與防禦建議。希望在資安職務中保護系統與資料安全。'
        },
        /* ============================ 數位行銷 ============================ */
        {
            id: 'digital-marketing', title: '數位行銷 / 電商營運', en: 'Digital Marketing / E-commerce',
            summary: '用內容、廣告與數據讓更多人認識品牌並購買。',
            match: { holland: ['E', 'A', 'S'], clusters: ['行銷與銷售', '藝文與影音傳播', '企業經營管理'], pathways: ['行銷', '電子商務', '電商', '數位'], depts: ['IM'] },
            focus: ['溝通表達', '創新', '人際互動'],
            plan: {
                d30: { theme: '基礎觀念與第一個內容', tasks: [
                    { action: '學習 SEO 與 Google Analytics 基礎，替一個虛擬或朋友的小店寫出 10 個關鍵字清單。', output: '10 個關鍵字清單', tools: ['SEO', 'Google Analytics'], hours: '每週 4 小時', done: '每個關鍵字有搜尋意圖說明' },
                    { action: '用 Canva 做 3 張社群圖卡，主題一致。', output: '3 張圖卡', tools: ['Canva', 'Instagram'], hours: '3 小時', done: '風格統一且文字清楚' },
                    { action: '建立 IG 帳號，自介寫清楚你的領域。', output: '1 個 IG 帳號', tools: ['Instagram', 'Linktree'], hours: '1 小時', done: '自介一句話講清楚' }
                ] },
                d60: { theme: '做出可測量的行銷活動', tasks: [
                    { action: '為一個小店或社團規劃 2 週社群活動，設定目標(如追蹤數或留言數)。', output: '1 份活動企劃', tools: ['Instagram', 'Hashtag'], hours: '每週 5 小時', done: '有目標數字與時程' },
                    { action: '製作 4 則貼文並觀察成效，記錄哪一則表現最好、可能原因。', output: '4 則貼文 + 成效紀錄', tools: ['Instagram', 'Carousel'], hours: '4 小時', done: '寫出 1 個成效洞察' },
                    { action: '做 1 次 A/B Test(例如兩種標題)，比較結果。', output: '1 份 A/B Test 紀錄', tools: ['A/B Test'], hours: '3 小時', done: '結論有數據支持' }
                ] },
                d90: { theme: '成果整理與公開', tasks: [
                    { action: '把活動整理成 1 篇案例：目標、做法、結果、檢討。', output: '1 篇行銷案例', tools: ['Medium', 'Portfolio'], hours: '5 小時', done: '有量化成果' },
                    { action: '學習 Meta 廣告或 Google Ads 基礎，並做 1 份廣告企劃(不一定投放)。', output: '1 份廣告企劃', tools: ['Meta 廣告', 'Google Ads'], hours: '4 小時', done: '包含受眾、預算與衡量指標' },
                    { action: '更新履歷與 LinkedIn，加入活動成果。', output: '更新後的履歷', tools: ['STAR', 'LinkedIn', 'Cake'], hours: '2 小時', done: '成果有數字' }
                ] }
            },
            platform: {
                primary: 'instagram', secondary: 'linkedin',
                why: '行銷職缺會直接看你經營帳號的成果，IG 展現內容能力，LinkedIn 展現專案成果。',
                cadence: ['每週 2 則貼文', '每月 1 篇成效檢討', '每季整理 1 份行銷案例'],
                postIdeas: ['我為小店規劃 2 週活動的成果', '兩種標題的 A/B Test 結果', '拆解一個品牌的社群策略'],
                bio: '{dept}｜數位行銷練習中｜社群內容與數據分析｜行銷案例：[貼上 Linktree / LinkedIn 連結]'
            },
            creators: ['harris', 'ithelp', 'sitcon'],
            resume: '我熱愛用內容與數據讓更多人認識品牌，熟悉社群經營與 SEO 基礎。曾替 {對象} 規劃 {活動}，達成 {成果}。希望在數位行銷或電商職務中持續累積實戰成果。'
        },
        /* ============================ 遊戲/互動多媒體 ============================ */
        {
            id: 'game-multimedia', title: '遊戲與互動多媒體開發', en: 'Game / Interactive Media Developer',
            summary: '用遊戲引擎與程式製作遊戲或互動體驗，結合美感與技術。',
            match: { holland: ['A', 'R', 'I'], clusters: ['藝文與影音傳播', '資訊科技'], pathways: ['互動多媒體', '遊戲', '多媒體', '影音', '視覺藝術'], depts: ['AI'] },
            focus: ['創新', '問題解決', '科技應用'],
            plan: {
                d30: { theme: '學引擎，做第一個小遊戲', tasks: [
                    { action: '安裝 Unity，跟著入門教學完成一個簡單的 2D 小遊戲(移動、碰撞、計分)。', output: '1 個可執行的小遊戲', tools: ['Unity', 'C#'], hours: '每週 6 小時', done: '朋友可以玩完一局' },
                    { action: '用 Git 管理專案，推到 GitHub 並寫 README。', output: '1 個 GitHub 專案', tools: ['Git', 'GitHub', 'README'], hours: '2 小時', done: 'README 有遊戲截圖與操作方式' },
                    { action: '閱讀 1 篇開發者的自學心得(見推薦)，列出 3 個你可以模仿的做法。', output: '1 份閱讀筆記', tools: ['Notion'], hours: '2 小時', done: '寫出如何套用' }
                ] },
                d60: { theme: '做出有完整流程的遊戲', tasks: [
                    { action: '擴充遊戲：加入開始畫面、難度變化與結束畫面。', output: '1 個有完整流程的遊戲', tools: ['Unity', 'C#'], hours: '每週 6 小時', done: '從開始到結束沒有錯誤' },
                    { action: '找 5 位玩家試玩，記錄他們卡關或覺得無聊的地方。', output: '5 份試玩回饋', tools: ['Usability Test'], hours: '3 小時', done: '整理出前 3 名問題' },
                    { action: '依回饋調整遊戲，並錄 1 支 30 秒玩法預告。', output: '改版遊戲 + 1 支預告', tools: ['Reels', 'Instagram'], hours: '4 小時', done: '預告說明了核心玩法' }
                ] },
                d90: { theme: '參賽與公開作品', tasks: [
                    { action: '參加 1 次 Game Jam，在期限內完成並提交一款遊戲。', output: '1 款 Game Jam 作品', tools: ['Game Jam', 'Unity'], hours: '活動 1~2 天', done: '作品成功提交' },
                    { action: '把開發歷程寫成 1 篇文章，包含遇到的問題與解法。', output: '1 篇開發日誌', tools: ['Medium', 'iT 邦幫忙鐵人賽'], hours: '4 小時', done: '包含截圖與程式片段' },
                    { action: '建立作品集頁面，放入遊戲、影片與 GitHub 連結。', output: '1 個作品集頁面', tools: ['Portfolio', 'Notion', 'Behance'], hours: '3 小時', done: '遊戲可以直接下載或試玩' }
                ] }
            },
            platform: {
                primary: 'github', secondary: 'instagram',
                why: '遊戲職缺看作品能不能玩、過程是否完整，GitHub 放程式，IG 放玩法預告最容易被看見。',
                cadence: ['每週 1 則開發進度', '每月 1 支玩法預告', '每次 Game Jam 後 1 篇回顧'],
                postIdeas: ['我的第一款 Unity 小遊戲開發紀錄', '玩家試玩後我改了什麼', 'Game Jam 48 小時的分工與時程'],
                bio: '{dept}｜遊戲與互動開發練習中｜Unity、C#｜作品與試玩：[貼上 GitHub / Linktree 連結]'
            },
            creators: ['gameislearning', 'featherchung', 'ithelp'],
            resume: '我結合美感與程式能力，熟悉 Unity 與 C#。曾完成 {遊戲名稱}，邀請 {人數} 位玩家試玩並依回饋改版，也參加過 {活動}。希望在遊戲或互動多媒體職務中持續創作。'
        }
    ];

    /* ------------------------------------------------------------------
     * UCAN 官方對「8 項職場共通職能」的說明 (主要指標 / 相關知識技能 / 相關活動)
     * 來源：教育部 UCAN 平台「職場共通職能查詢」公開頁面，2026-11-03 擷取。
     * 用途：補強任務旁顯示「UCAN 官方怎麼定義這項能力、建議做哪些活動」。
     * 內容照官方頁面原文整理，若官方更新請重新擷取並更新 refFetchedAt。
     * ------------------------------------------------------------------ */
    const UCAN_REF_URL = 'https://ucan.moe.edu.tw/search/search_1_3.aspx';
    const UCAN_REF_FETCHED = '2026-11-03';
    const ucanRef = {
        "溝通表達": {
          "intro": "透過口頭、書面等方式，表達自己的想法使他人瞭解，並努力理解他人所傳達的資訊。",
          "indicators": [
            "工作上與人談話時，能先確認彼此的主題與目的。",
            "與人談話時，能專注傾聽觀察對方傳達的訊息，即使他人和自己意見不相同，仍然樂於傾聽接納。",
            "會依據不同對象，運用適當方法技巧，清楚表達訊息及進行對話。",
            "能夠正確解讀工作相關文件，如文字或圖表資料、技術文件、測試報告等。",
            "能夠使用正確的文法、格式或邏輯製作符合組織或工作所要求之書面資料。",
            "能對不同對象，能以書面方式適切地陳述欲表達之訊息。",
            "運用組織或工作所要求之外語能力進行資訊溝通傳達。"
          ],
          "skills": [
            "口語表達技巧",
            "口語簡報技巧",
            "企劃書撰寫技巧",
            "肢體語言表達技巧",
            "資料收集及分析",
            "寫作技巧",
            "談判技巧",
            "簡報製作技巧"
          ],
          "activities": [
            "參與各類社團的運作或擔任幹部。",
            "參加校內外簡報、演說或討論活動。",
            "經常寫作，紀錄個人心得，例如筆記、學術文章、專題報告、部落格文章、文學創作。",
            "參加說故事、辯論、廣播等活動，練習表達。",
            "參加讀書會、經典著作研討會等閱讀活動。",
            "志工服務。"
          ]
        },
        "持續學習": {
          "intro": "了解能力發展的重要性，並能探索、規劃和有效管理自身的能力，並保持繼續成長的企圖心。",
          "indicators": [
            "能夠持續表現出對學習新事物及知識技能的好奇心。",
            "能明確掌握個人職涯發展所需知識、技能和必要條件。",
            "能夠對自己能力的成長訂定具體目標",
            "了解並進行職涯發展上所需的持續學習和訓練。",
            "能夠持續因應產業趨勢進行專業能力發展 。",
            "能從與他人的互動中，汲取正面有益的經驗。",
            "持續應用各種方法及管道提升自己的能力。"
          ],
          "skills": [
            "生涯規劃",
            "時間管理",
            "目標管理",
            "終身學習"
          ],
          "activities": [
            "經常閱讀。",
            "隨時記錄有用資訊。",
            "參加相關專業學會。",
            "參加專題競賽或研究。",
            "參與自我成長/教育活動。",
            "利用課堂、演講等機會，勇於發問問題。",
            "透過期刊、雜誌、網站、專業協會和其他資源掌握對目前職場發展趨勢與機會。",
            "關心社會及全球性議題(如環境保護、生物保育、貧窮、人權、經貿與科技研究等)。"
          ]
        },
        "人際互動": {
          "intro": "依不同情境，運用適當方法及個人風格，與他人互動或共事。",
          "indicators": [
            "能以同理心主動瞭解他人的需求與感受，藉以建立良好的人際關係。",
            "能夠分析自己的領域，主動找出需要建立或改善的重要關係。",
            "會尋找或製造機會去接觸他人，並與其建立人脈關係。",
            "工作時對於能提供資訊或協助的人會主動表達善意。",
            "工作上能提供他人協助及支持，以建立彼此未來的互惠合作關係。",
            "會運用適當方法有系統地管理人脈資源。"
          ],
          "skills": [
            "溝通協調",
            "傾聽技巧",
            "人際心理",
            "衝突管理",
            "情緒管理",
            "同理心",
            "人脈管理"
          ],
          "activities": [
            "透過書報雜誌、傳播媒體、旅行、日常生活的觀察，探索多元生活環境與接觸不同領域及文化的人。",
            "參加校內外之有益身心活動，增進與他人(家人、師長、朋友、同學、陌生人)互動。",
            "參與學科或主題的討論(如團體討論、讀書會、演講活動)分享個人觀點並提供他人回饋。",
            "參與服務學習活動。"
          ]
        },
        "團隊合作": {
          "intro": "能積極參與團隊任務，並與團隊成員有良好互動，以共同完成目標",
          "indicators": [
            "能夠以團隊目標為優先，支持團隊的決定。",
            "積極參與團隊並真誠地表達個人的看法。",
            "對於團隊成員提出的意見能夠給予建設性的回應。",
            "真誠地重視團隊成員的意見和專業知識，願意向其學習。",
            "會以正面的話語來談論團隊成員，不會背地批評。",
            "能將個人喜好排除，在必要時調整自己的角色或行為。",
            "能夠與團隊成員共同解決問題並承擔責任。"
          ],
          "skills": [
            "目標管理",
            "溝通技巧",
            "團隊建立",
            "領導技巧",
            "激勵理論與技巧",
            "衝突管理"
          ],
          "activities": [
            "參與各類社團的運作或擔任幹部。",
            "參與各類學習分組專案。",
            "參與團體活動或競賽。",
            "主持會議或活動。",
            "參加學校專題研究或產學合作計畫。",
            "志工服務。"
          ]
        },
        "問題解決": {
          "intro": "遇到狀況時能釐清問題，透過系統化的資訊蒐集與分析，提出解決方案。",
          "indicators": [
            "系統化的收集與所發生狀況相關的資訊",
            "能夠根據事實證據、謹慎評估並合理判斷可能的問題所在",
            "能夠以系統化的方式釐清問題",
            "透過各種管道蒐集相關資料及意見，提供解決問題的各種可能方案",
            "能夠評估各種解決方案的利弊，找出最佳問題解決方案",
            "為可能發生的問題預作準備，找出解決問題可能需要的資訊"
          ],
          "skills": [
            "獨立思考",
            "批判性思考",
            "問題分析能力",
            "邏輯能力"
          ],
          "activities": [
            "經常閱讀。",
            "參加專題競賽或研究。",
            "從事思考類休閒活動，如圍棋、象棋、跳棋。",
            "養成動手做的習慣。",
            "參加圖書館資訊檢索研習課程，熟悉資訊檢索策略及工具。"
          ]
        },
        "創新": {
          "intro": "在有限的資源下，不侷限既有的工作模式，能夠主動提出新的建議或想法，並落實於工作中。",
          "indicators": [
            "能評估原來的作法，並提出有效改善、簡化服務、制度和流程的方法。",
            "不會侷限於原有的作法，能夠嘗試用新的方式達成目標或解決問題。",
            "能夠蒐集、分析及組織各方意見與想法，並提出嶄新的觀點或見解。",
            "能提出新穎且具體可行的產品或服務構想。",
            "能夠想像及預測可能的新趨勢及發展。",
            "能夠在任務進行中保持彈性。"
          ],
          "skills": [
            "組織能力",
            "創意思考",
            "問題分析",
            "分析歸納能力",
            "觀察"
          ],
          "activities": [
            "廣泛閱讀。",
            "涉獵世界產經趨勢發展資訊。",
            "參加校內外各類專題競賽、創業競賽、設計發明競賽。",
            "常在日常活動中發想新作法。"
          ]
        },
        "工作責任": {
          "intro": "瞭解並執行個人在組織中的責任，遵守組織及專業上對倫理、制度及誠信的要求。",
          "indicators": [
            "能夠認同組織的目標或價值，並積極為組織的利益努力。",
            "能了解並積極完成自己應負責的工作任務及確保產出品質。",
            "了解並確實遵循組織的紀律、制度與工作規範。",
            "能注意確保個人的工作安全與身心健康。",
            "找出自我排解壓力的適當方式，並勇於承擔需要面對的壓力。",
            "了解並遵循組織倫理及各部門及人員合理的互動關係與方式。",
            "以誠信為行事原則，瞭解違反組織及專業上的道德法律標準之後果，並落實責任與紀律於日常工作表現。"
          ],
          "skills": [
            "工作倫理",
            "誠信",
            "職場安全",
            "健康管理",
            "職場道德",
            "公民教育"
          ],
          "activities": [
            "透過企業參訪、企業實習、短期工讀，體驗工作環境。",
            "參與各類社團的運作或擔任幹部。",
            "關心新聞時事案例與人權、法律議題。",
            "志工服務。"
          ]
        },
        "科技應用": {
          "intro": "運用各行業所需的資訊技術工具，有效存取、管理、整合並傳遞訊息。",
          "indicators": [
            "能夠依據不同的情況，判斷並選擇使用/運用資訊科技工具，有效率地完成工作任務。",
            "透過網路瀏覽和檢索資訊，經過篩選與衡量後，進一步管理、儲存及分析資料。",
            "能有效運用資訊科技工具，產出數位內容(如文字、照片、影像)，以符合組織或工作任務之要求。",
            "能依據不同的狀況與情境，使用適當的資訊科技工具與他人進行溝通及互動。",
            "瞭解使用資訊/數位內容版權與授權的規範。",
            "瞭解數位環境中存在的風險及威脅，並以適當的措施保護個人資料及使用裝置之安全。",
            "能夠透過使用資訊科技工具解決自己碰到的問題或找出相應的解決方法。",
            "能將產業的相關知識與資訊科技工具結合，並應用在工作任務上。"
          ],
          "skills": [
            "文書軟體使用",
            "試算表使用",
            "簡報工具使用",
            "資料庫應用",
            "資訊倫理",
            "電子郵件使用",
            "網路基本知識",
            "資料儲存與管理",
            "個人裝置防護"
          ],
          "activities": [
            "參觀資訊展或電腦展，了解資通訊科技(ICT)發展趨勢。",
            "利用資訊網路工具進行資料蒐集。",
            "運用網路工具與他人聯繫互動。",
            "運用電腦管理個人檔案及製作報告、文件、作品。",
            "參加校內外相關電腦研習活動。"
          ]
        }
    };

    return { VERSION, glossary, creators, platforms, gapActions, roles, ucanRef, UCAN_REF_URL, UCAN_REF_FETCHED };
});
