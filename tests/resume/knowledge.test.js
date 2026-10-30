const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Require the universal module
const ResumeKnowledge = require('../../static/resume-knowledge.js');

describe('Resume Knowledge Engine (靜態履歷知識庫與證據推導)', () => {

    test('1. 防偽斷言：勾選「網路行銷」絕不能輸出 Linux、Docker 或 TCP/IP', () => {
        const model = ResumeKnowledge.buildEvidence({
            selectedCourses: ['網路行銷', '網路消費者行為'],
            selectedExps: [],
            roleKey: 'backend'
        });

        const skillNames = model.skills.map(s => s.name).join(' ');
        const skillBases = model.skills.map(s => s.basis).join(' ');
        const allText = skillNames + ' ' + skillBases;

        assert.strictEqual(allText.includes('Linux'), false, '網路行銷不應觸發 Linux 技能');
        assert.strictEqual(allText.includes('Docker'), false, '網路行銷不應觸發 Docker 技能');
        assert.strictEqual(allText.includes('TCP/IP'), false, '網路行銷不應觸發 TCP/IP 技能');
    });

    test('2. 防偽斷言：只勾選「程式設計」不得冒稱精通「Python」', () => {
        const model = ResumeKnowledge.buildEvidence({
            selectedCourses: ['程式設計'],
            selectedExps: [],
            roleKey: 'fullstack'
        });

        // 技能列表內不應包含特定 Python 實務應用（除非有 Python程式設計）
        const pythonSkill = model.skills.find(s => s.name.includes('Python 實務應用'));
        assert.strictEqual(pythonSkill, undefined, '單純「程式設計」課綱多班為 Java/C++，不得硬寫成 Python');

        // 應包含基礎物件導向概念
        const oopSkill = model.skills.find(s => s.name.includes('物件導向程式設計思維 (OOP)'));
        assert.ok(oopSkill, '應正確匹配「物件導向程式設計思維 (OOP)」');
    });

    test('3. 防偽斷言：勾選「人工智慧概論」絕不出現 PyTorch（靜宜資院課綱 0 次）', () => {
        const model = ResumeKnowledge.buildEvidence({
            selectedCourses: ['人工智慧概論'],
            selectedExps: [],
            roleKey: 'data_ai'
        });

        const allSkillsText = JSON.stringify(model.skills);
        assert.strictEqual(allSkillsText.includes('PyTorch'), false, '人工智慧概論不應輸出未在課綱出現之 PyTorch');
    });

    test('4. 課綱實證：「大數據分析」應輸出 TensorFlow/Keras，且不含 PyTorch', () => {
        const model = ResumeKnowledge.buildEvidence({
            selectedCourses: ['大數據分析'],
            selectedExps: [],
            roleKey: 'data_ai'
        });

        const tfSkill = model.skills.find(s => s.name.includes('TensorFlow/Keras'));
        assert.ok(tfSkill, '大數據分析應明確輸出課綱載明之 TensorFlow/Keras 應用基礎');
        assert.strictEqual(JSON.stringify(model.skills).includes('PyTorch'), false);
    });

    test('5. 課綱實證：只有「雲端技術與應用」才授予 Docker 容器化技術', () => {
        const modelWithoutCloud = ResumeKnowledge.buildEvidence({
            selectedCourses: ['計算機網路', '系統分析與設計'],
            selectedExps: []
        });
        assert.strictEqual(JSON.stringify(modelWithoutCloud.skills).includes('Docker'), false, '未修雲端課不應出現 Docker');

        const modelWithCloud = ResumeKnowledge.buildEvidence({
            selectedCourses: ['雲端技術與應用'],
            selectedExps: []
        });
        const dockerSkill = modelWithCloud.skills.find(s => s.name.includes('Docker'));
        assert.ok(dockerSkill, '雲端技術與應用應輸出 Docker');
    });

    test('6. 杜絕假數據：未提供使用者輸入時，履歷本文不含任何假數據或假聯絡方式', () => {
        const model = ResumeKnowledge.buildEvidence({
            selectedCourses: ['資料庫系統實作'],
            selectedExps: ['exp_intern', 'exp_compete'],
            userProfile: {} // 未填個人資訊
        });

        const html = ResumeKnowledge.renderResumeHTML(model);
        const md = ResumeKnowledge.renderResumeMarkdown(model);

        // 不應出現舊版的寫死假資訊
        assert.strictEqual(html.includes('0912-345-678'), false, '不應含有舊版假手機');
        assert.strictEqual(html.includes('student@pu.edu.tw'), false, '不應含有舊版假 Email');
        assert.strictEqual(html.includes('pu-student'), false, '不應含有舊版假 GitHub');
        assert.strictEqual(html.includes('降低約 25%'), false, '不應含有寫死之 25% 數據');
        assert.strictEqual(html.includes('滿意度達 92%'), false, '不應含有寫死之 92% 數據');
        assert.strictEqual(html.includes('院級前 15%'), false, '不應含有寫死之 前 15% 數據');
        assert.strictEqual(html.includes('靜宜資訊學士候選人'), false, '不應含有佔位假姓名');

        // 應包含【使用者自行輸入：...】佔位標記
        assert.ok(html.includes('【使用者自行輸入：'), '應包含使用者自行輸入佔位標記');
        assert.ok(md.includes('【使用者自行輸入：'), 'Markdown 也應包含使用者自行輸入佔位標記');

        // checklist 應正確檢測出佔位數量
        assert.ok(model.checklist.totalPlaceholders > 0, '應偵測出未填欄位');
        assert.strictEqual(model.checklist.hasPhone, false, '手機應為未填');
    });

    test('7. 誠實分級機制：修 1 門、修 2 門、修 2 門+專題 應有明確口吻區分', () => {
        // 修 1 門：基礎概念養成
        const m1 = ResumeKnowledge.buildEvidence({
            selectedCourses: ['資料庫系統實作'],
            selectedExps: []
        });
        assert.strictEqual(m1.skills[0].levelText, '基礎概念養成');

        // 修 2 門：進階實作具備
        const m2 = ResumeKnowledge.buildEvidence({
            selectedCourses: ['資料庫系統實作', '資料庫管理'],
            selectedExps: []
        });
        assert.strictEqual(m2.skills[0].levelText, '進階實作具備');

        // 修 2 門 + 專案：專案實戰應用
        const m3 = ResumeKnowledge.buildEvidence({
            selectedCourses: ['資料庫系統實作', '資料庫管理'],
            selectedExps: ['exp_project']
        });
        assert.strictEqual(m3.skills[0].levelText, '專案實戰應用');
    });

    test('8. JD 對焦表機制：正確計算職缺要求之證據狀態 (has_evidence / partial / gap)', () => {
        // 全端職缺：若修了「資料庫系統實作」與「資料庫管理」，SQL 需求應為 has_evidence
        const model = ResumeKnowledge.buildEvidence({
            selectedCourses: ['資料庫系統實作', '資料庫管理'],
            roleKey: 'fullstack'
        });

        const sqlItem = model.jdAlignment.find(j => j.jdRequirement.includes('SQL'));
        assert.ok(sqlItem, '應有 SQL JD 對焦點');
        assert.strictEqual(sqlItem.status, 'has_evidence', '修 2 門資料庫課應達標 has_evidence');

        // 沒修前端課，HTML/CSS 應為 gap
        const feItem = model.jdAlignment.find(j => j.jdRequirement.includes('HTML5'));
        assert.ok(feItem, '應有 HTML5 JD 對焦點');
        assert.strictEqual(feItem.status, 'gap', '未修網頁課應為 gap');
    });

    test('9. 年級補強路徑：大一、大三、大四分流建議均有回傳', () => {
        ['大一', '大三', '大四'].forEach(gr => {
            const m = ResumeKnowledge.buildEvidence({
                selectedCourses: [],
                grade: gr,
                roleKey: 'backend'
            });
            assert.ok(m.gapRecommendations.length > 0, `${gr} 應有補強建議`);
            assert.ok(m.gapRecommendations[0].advice.includes(gr === '大一' ? '大一/二 打底期' : gr === '大三' ? '大三 專案實作期' : '大四 實習就業期'));
        });
    });

    test('10. 自傳篇幅與結構：自傳三要 (我是誰、我會什麼、我想做什麼) 篇幅合理', () => {
        const model = ResumeKnowledge.buildEvidence({
            selectedCourses: ['程式設計', '資料結構', '系統分析與設計', '資料庫系統實作'],
            selectedExps: ['exp_project'],
            grade: '大三',
            dept: 'IM',
            userProfile: { name: '王小明', targetJob: '後端軟體工程師' }
        });

        assert.ok(model.autobiography.totalWords >= 450 && model.autobiography.totalWords <= 900, `自傳字數應落在 450~900 字之間，目前為 ${model.autobiography.totalWords}`);
        assert.ok(model.autobiography.whoAmI.includes('靜宜大學'), '應包含背景陳述');
        assert.ok(model.autobiography.whatICanDo.includes('核心專長') || model.autobiography.whatICanDo.includes('專業累積'), '應包含核心專長與專業累積');
        assert.ok(model.autobiography.whatIWantToDo.includes('求職動機') || model.autobiography.whatIWantToDo.includes('立志投身'), '應包含我想做什麼與求職動機');
    });

});
