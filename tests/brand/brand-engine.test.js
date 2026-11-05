const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const P = require('../../static/ucan-parser.js');
const KB = require('../../static/brand-knowledge.js');
const E = require('../../static/brand-engine.js');

const fx = n => P.parseReport(fs.readFileSync(path.join(__dirname, 'fixtures', `ucan-${n}.txt`), 'utf8'));
const designer = P.buildProfile([fx('holland'), fx('common'), fx('professional')]);

/** 手工建立的測試用 UCAN 資料 (虛構學生，只用來驗證規則) */
function mk(opts) {
    const holland = {};
    Object.keys(opts.h).forEach(k => { holland[k] = { score: opts.h[k][0], pr: opts.h[k][1] }; });
    const comps = {};
    Object.keys(opts.c || {}).forEach(k => { comps[k] = { score: 3.5, pr: opts.c[k] }; });
    return {
        schemaVersion: 2, student: { dept: '資訊工程學系 日間部' }, holland,
        hollandCode: Object.keys(opts.h).sort((a, b) => opts.h[b][0] - opts.h[a][0]).slice(0, 3).join(''),
        hollandTop3: Object.keys(opts.h).sort((a, b) => opts.h[b][0] - opts.h[a][0]).slice(0, 3),
        clusters: (opts.clusters || []).map(([name, pr]) => ({ name, score: 1, pr })),
        topClusters: opts.top || [], commonComps: comps,
        profPathway: opts.pathway || '', profCareerCluster: opts.cluster || '', profPr: opts.profPr == null ? null : opts.profPr, profScore: 3.5,
        profItems: opts.items || [], missing: []
    };
}
const backendDev = mk({
    h: { I: [9, 90], R: [7, 70], C: [6, 60], A: [2, 20], S: [2, 20], E: [3, 30] },
    clusters: [['資訊科技', 90], ['科學、技術、工程、數學', 80]], top: ['資訊科技', '科學、技術、工程、數學'],
    c: { 問題解決: 85, 科技應用: 90, 持續學習: 70, 溝通表達: 40, 人際互動: 30, 團隊合作: 50, 創新: 55, 工作責任: 60 },
    pathway: '軟體開發', cluster: '資訊科技', profPr: 80
});
const manager = mk({
    h: { E: [10, 92], S: [8, 80], C: [5, 50], A: [3, 30], I: [2, 20], R: [1, 10] },
    clusters: [['企業經營管理', 90], ['行銷與銷售', 80], ['資訊科技', 50]], top: ['企業經營管理', '行銷與銷售'],
    c: { 溝通表達: 88, 團隊合作: 85, 人際互動: 82, 問題解決: 55, 工作責任: 60, 科技應用: 40, 創新: 50, 持續學習: 60 },
    pathway: '專案管理', cluster: '企業經營管理', profPr: 75
});

/* ------------------------- 知識庫完整性 ------------------------- */
test('KB: every tool / term used is explained in the glossary', () => {
    const missing = new Set();
    const check = t => (t.tools || []).forEach(x => { if (!KB.glossary[x]) missing.add(x); });
    KB.roles.forEach(r => ['d30', 'd60', 'd90'].forEach(k => r.plan[k].tasks.forEach(check)));
    Object.values(KB.gapActions).forEach(g => ['d30', 'd60', 'd90'].forEach(k => check(g[k])));
    KB.roles.forEach(r => { [r.platform.primary, r.platform.secondary].forEach(id => { const n = KB.platforms[id] && KB.platforms[id].name; if (!n) missing.add('platform:' + id); }); });
    assert.deepEqual([...missing], []);
});

test('KB: each role is complete (3 phases, 3+ concrete tasks, 2-3 creators, valid platform)', () => {
    assert.ok(KB.roles.length >= 12);
    KB.roles.forEach(r => {
        ['d30', 'd60', 'd90'].forEach(k => {
            assert.ok(r.plan[k].theme, `${r.id} ${k} theme`);
            assert.ok(r.plan[k].tasks.length >= 3, `${r.id} ${k} tasks`);
            r.plan[k].tasks.forEach(t => ['action', 'output', 'hours', 'done'].forEach(f => assert.ok(t[f], `${r.id} ${k} missing ${f}`)));
        });
        assert.ok(r.creators.length >= 2 && r.creators.length <= 3, `${r.id} creators`);
        r.creators.forEach(id => assert.ok(KB.creators[id], `${r.id} unknown creator ${id}`));
        assert.ok(r.platform.cadence.length >= 2 && r.platform.postIdeas.length >= 3 && r.platform.bio.includes('{dept}'));
        r.match.holland.forEach(k => assert.ok('RIASEC'.includes(k)));
        r.focus.forEach(k => assert.ok(P.COMMON_KEYS.includes(k), `${r.id} focus ${k}`));
        assert.ok(r.match.depts.length >= 1 && r.match.depts.every(d => ['CS', 'IM', 'AI'].includes(d)), `${r.id} depts`);
        assert.equal(r.resume, undefined, 'resume draft was removed from the product');
    });
});

test('KB: gap actions exist for all 8 UCAN common competencies and all 3 phases', () => {
    P.COMMON_KEYS.forEach(k => ['d30', 'd60', 'd90'].forEach(p => assert.ok(KB.gapActions[k] && KB.gapActions[k][p], `${k} ${p}`)));
});

test('KB: creators have https links, a verified date, and a reason to follow', () => {
    Object.entries(KB.creators).forEach(([id, c]) => {
        assert.match(c.url, /^https:\/\//, id);
        assert.match(c.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, id);
        assert.ok(c.learn && c.focus && c.name, id);
    });
});

/* ------------------------- 個人化 ------------------------- */
test('designer persona (A + 視覺藝術): UI/UX is #1 and plan is anchored to real UCAN numbers', () => {
    const top = E.suggestRoles(designer, 3);
    assert.equal(top[0].roleId, 'ui-ux');
    assert.equal(top.length, 3);

    const plan = E.buildPlan(designer, 'ui-ux');
    const all = plan.phases.flatMap(p => p.tasks);
    assert.ok(all.some(t => t.tools && t.tools.includes('Figma')));
    // 共通職能補強任務來自真正偏低的項目
    const gapNames = plan.gaps.map(g => g.name);
    assert.deepEqual(gapNames, ['溝通表達', '人際互動']);
    plan.phases.forEach(p => assert.ok(p.tasks.some(t => t.origin === 'ucan-common' && t.ucan.name === '溝通表達')));
    // 專業職能最低分項目被拿來補強
    const pro = all.find(t => t.origin === 'ucan-professional');
    assert.ok(pro && pro.ucan.name.startsWith('企劃、執行並管理') && pro.ucan.pr === 41);
    assert.ok(plan.strengths.some(s => s.name.startsWith('研究藝術史')));
    plan.phases.forEach(p => p.tasks.forEach(t => assert.ok(t.output && t.done)));
});

test('different goals / profiles produce clearly different plans (not just the Holland letter)', () => {
    const planA = E.buildPlan(designer, 'ui-ux');
    const planB = E.buildPlan(backendDev, 'backend');
    const planC = E.buildPlan(manager, 'pm');
    const sig = p => p.phases.map(ph => ph.tasks.map(t => t.action).join('|')).join('||');
    const set = new Set([sig(planA), sig(planB), sig(planC)]);
    assert.equal(set.size, 3);
    assert.equal(E.suggestRoles(backendDev, 1)[0].roleId, 'backend');
    assert.ok(['pm', 'sa-ba'].includes(E.suggestRoles(manager, 1)[0].roleId));
});

test('same Holland letter + different pathway -> different recommendation', () => {
    const h = { A: [8, 90], E: [4, 40], S: [3, 30], I: [2, 20], R: [2, 20], C: [2, 20] };
    const viaVisual = mk({ h, pathway: '視覺藝術', cluster: '藝文與影音傳播', profPr: 70, top: ['藝文與影音傳播'] });
    const viaGame = mk({ h, pathway: '互動多媒體', cluster: '資訊科技', profPr: 70, top: ['資訊科技'] });
    const viaMarketing = mk({ h, pathway: '數位行銷與電子商務', cluster: '行銷與銷售', profPr: 70, top: ['行銷與銷售'] });
    const tops = [viaVisual, viaGame, viaMarketing].map(p => E.suggestRoles(p, 1)[0].roleId);
    assert.equal(new Set(tops).size, 3, tops.join(','));
});

test('two students with the same goal but different weak spots get different gap tasks', () => {
    const base = { h: { I: [9, 90], R: [7, 70], C: [6, 60], A: [2, 20], S: [2, 20], E: [3, 30] }, pathway: '軟體開發', profPr: 70 };
    const a = mk(Object.assign({ c: { 溝通表達: 20, 創新: 80, 問題解決: 80, 科技應用: 80 } }, base));
    const b = mk(Object.assign({ c: { 溝通表達: 80, 創新: 10, 問題解決: 80, 科技應用: 80 } }, base));
    const ga = E.buildPlan(a, 'backend').gaps.map(g => g.name);
    const gb = E.buildPlan(b, 'backend').gaps.map(g => g.name);
    assert.deepEqual(ga, ['溝通表達']);
    assert.deepEqual(gb, ['創新']);
});

test('no UCAN data -> no invented recommendations, nothing throws', () => {
    const empty = P.buildProfile([]);
    assert.ok(E.rankRoles(empty).every(r => r.score === 0));
    const plan = E.buildPlan(empty, 'ui-ux');
    assert.equal(plan.gaps.length, 0);
    assert.equal(plan.phases[0].tasks.every(t => t.origin === 'role'), true);
    assert.ok(E.recommendDepartments(empty).ranked.every(d => d.score === 0));
    assert.equal(E.buildPlan(designer, 'no-such-role'), null);
});

/* ------------------------- 社群策略 ------------------------- */
test('social strategy: 2-3 Taiwanese creators with direct links, bio filled with department, UCAN-based tips', () => {
    const s = E.buildSocial(designer, 'ui-ux');
    assert.equal(s.primary.name, 'Behance');
    assert.ok(s.creators.length >= 2 && s.creators.length <= 3);
    s.creators.forEach(c => assert.match(c.url, /^https:\/\//));
    assert.ok(s.bio.includes('資訊管理學系') && !s.bio.includes('{dept}'));
    assert.ok(s.tips.some(t => t.ucan.includes('溝通表達 PR27')));
    const g = E.glossaryFor(E.buildPlan(designer, 'ui-ux'), s);
    assert.ok(g.some(x => x.term === 'Behance') && g.some(x => x.term === 'Figma'));
});

/* ------------------------- 系所推薦 ------------------------- */
test('department recommendation uses real UCAN numbers and explains them', () => {
    const dev = E.recommendDepartments(backendDev);
    assert.equal(dev.ranked[0].dept, 'CS');
    const mgr = E.recommendDepartments(manager);
    assert.equal(mgr.ranked[0].dept, 'IM');
    const ai = E.recommendDepartments(mk({
        h: { I: [10, 95], R: [5, 50], A: [5, 50], C: [3, 30], S: [1, 10], E: [1, 10] },
        clusters: [['科學、技術、工程、數學', 90], ['資訊科技', 85]], top: ['科學、技術、工程、數學', '資訊科技'],
        c: { 問題解決: 90, 創新: 85, 科技應用: 80, 持續學習: 80 }, pathway: '資料科學與分析', profPr: 85
    }));
    assert.equal(ai.ranked[0].dept, 'AI');
    dev.ranked[0].parts.forEach(p => assert.ok(p.detail && p.source));
    assert.equal(dev.completeness, 3);
});


test('KB: UCAN official reference exists for all 8 common competencies with source info', () => {
    P.COMMON_KEYS.forEach(k => {
        const r = KB.ucanRef[k];
        assert.ok(r, k);
        assert.ok(r.intro && r.indicators.length >= 6 && r.skills.length >= 4 && r.activities.length >= 4, `${k} incomplete`);
    });
    assert.match(KB.UCAN_REF_URL, /^https:\/\/ucan\.moe\.edu\.tw\//);
    assert.match(KB.UCAN_REF_FETCHED, /^\d{4}-\d{2}-\d{2}$/);
});

test('plan: each prioritised weak competency carries its UCAN official reference', () => {
    const plan = E.buildPlan(designer, 'ui-ux');
    assert.deepEqual(plan.gaps.map(g => g.ref && g.ref.intro.length > 10), [true, true]);
    assert.ok(plan.gaps[0].ref.activities.some(a => a.includes('簡報')) );
    assert.equal(plan.refSource.url, KB.UCAN_REF_URL);
});

test('each role maps to the corresponding Providence University IT department(s), first one is primary', () => {
    const ux = E.departmentsFor('ui-ux');
    assert.deepEqual(ux.map(d => d.name), ['資訊管理學系', '人工智慧學系']);
    assert.deepEqual(ux.map(d => d.primary), [true, false]);
    assert.equal(E.departmentsFor('security')[0].name, '資訊工程學系');
    assert.equal(E.departmentsFor('pm')[0].name, '資訊管理學系');
    assert.equal(E.departmentsFor('ai-ml')[0].name, '人工智慧學系');
    assert.deepEqual(E.departmentsFor('nope'), []);
    assert.equal(E.buildPlan(designer, 'ui-ux').depts[0].key, 'IM');
});

