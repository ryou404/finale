const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const P = require('../../static/ucan-parser.js');

const fx = n => fs.readFileSync(path.join(__dirname, 'fixtures', `ucan-${n}.txt`), 'utf8');

test('detects report types', () => {
    assert.deepEqual(P.parseReport(fx('holland')).types, ['holland']);
    assert.deepEqual(P.parseReport(fx('common')).types, ['common']);
    assert.deepEqual(P.parseReport(fx('professional')).types, ['professional']);
});

test('holland report: six types, code, 16 clusters, top clusters', () => {
    const r = P.parseReport(fx('holland'));
    assert.equal(r.date, '2024-05-22');
    assert.equal(r.holland.code, 'AES');
    assert.deepEqual(r.holland.scores.A, { score: 6, pr: 72, name: '藝術型' });
    assert.deepEqual(r.holland.scores.I, { score: 1, pr: 12, name: '研究型' });
    assert.equal(Object.keys(r.holland.scores).length, 6);
    assert.equal(r.holland.clusters.length, 16);
    const it = r.holland.clusters.find(c => c.name === '資訊科技');
    assert.deepEqual([it.score, it.pr], [2.35, 72]);
    assert.deepEqual(r.holland.topClusters, ['藝文與影音傳播', '資訊科技', '教育與訓練', '司法、法律與公共安全']);
});

test('common report: 8 competencies with PR then score', () => {
    const r = P.parseReport(fx('common'));
    assert.equal(Object.keys(r.common).length, 8);
    assert.deepEqual(r.common['人際互動'], { pr: 14, score: 3.17 });
    assert.deepEqual(r.common['科技應用'], { pr: 66, score: 4 });
    assert.deepEqual(r.common['工作責任'], { pr: 15, score: 3.43 });
});

test('professional report: pathway, items (page-overlap de-duplicated), average', () => {
    const r = P.parseReport(fx('professional'));
    assert.equal(r.professional.cluster, '藝文與影音傳播');
    assert.equal(r.professional.pathway, '視覺藝術');
    assert.deepEqual(r.professional.avg, { pr: 55, score: 3.5 });
    assert.equal(r.professional.items.length, 4);
    assert.deepEqual(r.professional.items.map(i => i.pr), [74, 41, 80, 59]);
    assert.ok(r.professional.items[3].name.startsWith('保存並鑑定文化創意作品'));
});

test('student info is parsed and anonymised fixtures contain no real data', () => {
    const r = P.parseReport(fx('holland'));
    assert.equal(r.student.school, '靜宜大學');
    assert.equal(r.student.name, '王小明');
    assert.match(r.student.dept, /資訊管理學系/);
});

test('buildProfile merges three reports and never invents numbers', () => {
    const p = P.buildProfile(['holland', 'common', 'professional'].map(n => P.parseReport(fx(n))));
    assert.equal(p.schemaVersion, 2);
    assert.equal(p.hollandCode, 'AES');
    assert.equal(p.primaryHolland, 'A');
    assert.deepEqual(p.hollandTop3, ['A', 'E', 'S']);
    assert.equal(p.profPathway, '視覺藝術');
    assert.equal(p.profItems.length, 4);
    assert.deepEqual(p.missing, []);
    assert.equal(p.reportDates.holland, '2024-05-22');
    assert.equal(p.reportDates.common, '2025-02-27');
});

test('buildProfile with a single report marks the others as missing (no defaults)', () => {
    const p = P.buildProfile([P.parseReport(fx('holland'))]);
    assert.deepEqual(p.missing.sort(), ['common', 'professional']);
    assert.deepEqual(p.commonComps, {});
    assert.equal(p.profPathway, '');
    assert.equal(p.profPr, null);
});

test('empty / unrelated text yields an empty profile', () => {
    const p = P.buildProfile([P.parseReport('hello world')]);
    assert.deepEqual(p.missing.sort(), ['common', 'holland', 'professional']);
    assert.equal(p.hollandCode, '');
});

test('holland code is derived from real scores when the report omits it', () => {
    const code = P.deriveHollandCode({ R: { score: 3, pr: 32 }, I: { score: 1, pr: 12 }, A: { score: 6, pr: 72 }, S: { score: 4, pr: 40 }, E: { score: 4, pr: 54 }, C: { score: 3, pr: 34 } });
    assert.equal(code, 'AES'); // E beats S on PR when scores tie
});

test('levelFromPr uses UCAN thirds', () => {
    assert.equal(P.levelFromPr(67), 'strong');
    assert.equal(P.levelFromPr(66), 'mid');
    assert.equal(P.levelFromPr(34), 'mid');
    assert.equal(P.levelFromPr(33), 'weak');
});

test('validateProfile rejects out-of-range manual input', () => {
    const bad = { holland: { A: { score: 13, pr: 50 } }, commonComps: { 創新: { score: 6, pr: 0 } }, profPathway: '視覺藝術', profScore: 3, profPr: 50 };
    assert.equal(P.validateProfile(bad).length, 3);
    const ok = { holland: { A: { score: 6, pr: 72 } }, commonComps: { 創新: { score: 3.67, pr: 48 } }, profPathway: '視覺藝術', profScore: 3.5, profPr: 55 };
    assert.deepEqual(P.validateProfile(ok), []);
});

