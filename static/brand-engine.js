/**
 * 個人品牌規則引擎 (Brand Engine)
 * --------------------------------------------------------------
 * 輸入：UCAN 個人資料 (由 ucan-parser.js 產生)
 * 輸出：職務推薦、30/60/90 天行動計畫、社群策略、系所推薦，
 *       並且每一項都附上「來自 UCAN 的哪個數字」，方便說明為什麼這樣建議。
 *
 * 這裡全部是「可解釋的規則」，沒有任何即時 AI 生成內容。
 * 權重屬本專案依 Holland 人境適配理論設定的啟發式規則，不是 UCAN 官方公式。
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(require('./ucan-parser.js'), require('./brand-knowledge.js'));
    else root.BrandEngine = factory(root.UcanParser, root.BrandKB);
})(typeof self !== 'undefined' ? self : this, function (UcanParser, KB) {
    'use strict';

    const LEVEL = UcanParser.LEVEL_LABEL;
    const levelOf = UcanParser.levelFromPr;
    const WEAK_PR = 34; // 低於此 PR 視為「尚待加強」(UCAN 三分位)

    const HOLLAND_NAME = { R: '實用型', I: '研究型', A: '藝術型', S: '社會型', E: '企業型', C: '事務型' };

    /* ---------------- 共用小工具 ---------------- */
    const has = o => o && Object.keys(o).length > 0;
    const pr100 = pr => Math.max(0, Math.min(100, pr)) / 100;
    const round = n => Math.round(n);

    function getRole(id) { return KB.roles.find(r => r.id === id) || null; }

    function includesAny(text, words) {
        if (!text) return false;
        return words.some(w => text.includes(w) || w.includes(text));
    }

    function shortDept(profile) {
        const d = profile && profile.student && profile.student.dept;
        if (!d) return '○○系';
        return d.replace(/\s*(日間部|進修部|夜間部|碩士班|博士班).*$/, '').trim() || '○○系';
    }

    /* ---------------- 職務推薦 ---------------- */
    function scoreRole(profile, role) {
        const parts = [];
        const m = role.match;

        if (has(profile.holland)) {
            const w = [0.5, 0.3, 0.2];
            let sum = 0, wsum = 0; const det = [];
            m.holland.slice(0, 3).forEach((k, i) => {
                const h = profile.holland[k];
                if (h) { sum += w[i] * pr100(h.pr); wsum += w[i]; det.push(`${HOLLAND_NAME[k]} ${k} PR${h.pr}`); }
            });
            if (wsum) parts.push({ id: 'holland', label: '職業性格 (Holland)', source: '職業興趣探索', weight: 0.35, value: sum / wsum, detail: det.join('、') });
        }

        if ((profile.clusters && profile.clusters.length) || (profile.topClusters && profile.topClusters.length)) {
            const top = profile.topClusters || [];
            const hitTop = m.clusters.filter(c => top.includes(c));
            let value, det;
            const scored = (profile.clusters || []).filter(c => m.clusters.includes(c.name));
            if (scored.length) {
                const best = scored.slice().sort((a, b) => b.pr - a.pr)[0];
                value = Math.min(1, pr100(best.pr) + (hitTop.length ? 0.1 : 0));
                det = `${best.name} PR${best.pr}` + (hitTop.length ? '（興趣前幾名）' : '');
            } else {
                value = hitTop.length ? 0.9 : 0.3;
                det = hitTop.length ? `${hitTop[0]}（興趣前幾名）` : '興趣前幾名不含此職務相關類型';
            }
            parts.push({ id: 'cluster', label: '職涯類型興趣', source: '職業興趣探索', weight: 0.25, value, detail: det });
        }

        if (profile.profPathway) {
            const matched = includesAny(profile.profPathway, m.pathways);
            let value = 0, det;
            if (matched) { value = 0.7 + 0.3 * (typeof profile.profPr === 'number' ? pr100(profile.profPr) : 0.5); det = `就業途徑「${profile.profPathway}」與此職務相符` + (typeof profile.profPr === 'number' ? `（專業職能 PR${profile.profPr}）` : ''); }
            else if (profile.profCareerCluster && m.clusters.includes(profile.profCareerCluster)) { value = 0.3; det = `職涯類型「${profile.profCareerCluster}」相關`; }
            else det = `就業途徑「${profile.profPathway}」與此職務關聯較低`;
            parts.push({ id: 'pathway', label: '專業職能途徑', source: '專業職能診斷', weight: 0.2, value, detail: det });
        }

        if (has(profile.commonComps)) {
            const vals = role.focus.filter(k => profile.commonComps[k]);
            if (vals.length) {
                const mean = vals.reduce((s, k) => s + pr100(profile.commonComps[k].pr), 0) / vals.length;
                parts.push({ id: 'common', label: '此職務重視的共通職能', source: '職場共通職能', weight: 0.2, value: mean, detail: vals.map(k => `${k} PR${profile.commonComps[k].pr}`).join('、') });
            }
        }

        const wsum = parts.reduce((s, p) => s + p.weight, 0);
        const score = wsum ? parts.reduce((s, p) => s + p.weight * p.value, 0) / wsum : 0;
        return { roleId: role.id, title: role.title, score: round(score * 100), parts };
    }

    /** 依 UCAN 資料替所有職務打分並排序 */
    function rankRoles(profile) {
        return KB.roles.map(r => scoreRole(profile, r)).sort((a, b) => b.score - a.score);
    }
    function suggestRoles(profile, n) { return rankRoles(profile).slice(0, n || 3); }

    /* ---------------- 30/60/90 天計畫 ---------------- */
    function findWeakCommon(profile, role) {
        const comps = profile.commonComps || {};
        return Object.keys(comps)
            .filter(k => comps[k].pr < WEAK_PR && KB.gapActions[k])
            .map(k => ({ name: k, pr: comps[k].pr, score: comps[k].score, inFocus: role.focus.includes(k) }))
            .sort((a, b) => (Number(b.inFocus) - Number(a.inFocus)) || (a.pr - b.pr));
    }

    function findStrengths(profile) {
        const out = [];
        Object.keys(profile.commonComps || {}).forEach(k => { const c = profile.commonComps[k]; if (c.pr >= 67) out.push({ kind: '共通職能', name: k, pr: c.pr }); });
        (profile.profItems || []).forEach(i => { if (i.pr >= 67) out.push({ kind: '專業職能', name: i.name, pr: i.pr }); });
        (profile.hollandTop3 || []).forEach(k => { const h = profile.holland[k]; if (h && h.pr >= 67) out.push({ kind: '職業性格', name: `${HOLLAND_NAME[k]} ${k}`, pr: h.pr }); });
        return out.sort((a, b) => b.pr - a.pr);
    }

    function buildPlan(profile, roleId, opts) {
        const role = getRole(roleId);
        if (!role) return null;
        const maxGaps = (opts && opts.maxGaps) || 2;
        const weak = findWeakCommon(profile, role);
        const picked = weak.slice(0, maxGaps);
        const itemPool = (profile.profItems || []).filter(i => i.pr < 67).sort((a, b) => a.pr - b.pr);
        const proGap = profile.profPathway && includesAny(profile.profPathway, role.match.pathways) && itemPool.length ? itemPool[0] : null;

        const labels = { d30: '第 1–30 天', d60: '第 31–60 天', d90: '第 61–90 天' };
        const phases = ['d30', 'd60', 'd90'].map(key => {
            const ph = role.plan[key];
            const tasks = ph.tasks.map(t => Object.assign({ origin: 'role' }, t));
            picked.forEach(g => {
                const a = KB.gapActions[g.name][key];
                if (a) tasks.push(Object.assign({ origin: 'ucan-common', ucan: { kind: '共通職能', name: g.name, pr: g.pr, score: g.score, level: LEVEL[levelOf(g.pr)] } }, a));
            });
            if (key === 'd60' && proGap) {
                tasks.push({
                    origin: 'ucan-professional',
                    ucan: { kind: '專業職能', name: proGap.name, pr: proGap.pr, score: proGap.score, level: LEVEL[levelOf(proGap.pr)] },
                    action: `針對 UCAN 專業職能「${proGap.name}」(PR ${proGap.pr})，規劃一個 2 週的小作品或讀書報告來補強，並留下可展示的成果。`,
                    output: '1 份小作品或報告', tools: ['Notion'], hours: '每週 3 小時', done: '能向別人說明你學到什麼、做出什麼'
                });
            }
            return { key, label: labels[key], theme: ph.theme, tasks };
        });

        const ranked = scoreRole(profile, role);
        return {
            role: { id: role.id, title: role.title, en: role.en, summary: role.summary },
            fitScore: ranked.score,
            reasons: ranked.parts,
            phases,
            gaps: picked.map(g => Object.assign({}, g, { ref: KB.ucanRef[g.name] || null })),
            refSource: { url: KB.UCAN_REF_URL, fetchedAt: KB.UCAN_REF_FETCHED },
            otherWeak: weak.slice(maxGaps),
            strengths: findStrengths(profile),
            kbVersion: KB.VERSION
        };
    }

    /* ---------------- 社群策略 ---------------- */
    function buildSocial(profile, roleId) {
        const role = getRole(roleId);
        if (!role) return null;
        const pf = role.platform;
        const comps = profile.commonComps || {};
        const tips = [];
        if (comps['溝通表達'] && comps['溝通表達'].pr < WEAK_PR) tips.push({ text: '先從「1 張圖＋3 句話」的短貼文開始，不要一開始就寫長文；每則只講 1 個重點。', ucan: `溝通表達 PR${comps['溝通表達'].pr}` });
        if (comps['工作責任'] && comps['工作責任'].pr < WEAK_PR) tips.push({ text: '把發文日期寫進行事曆，固定每週同一天發布，並在前一天完成草稿。', ucan: `工作責任及紀律 PR${comps['工作責任'].pr}` });
        if (comps['人際互動'] && comps['人際互動'].pr < WEAK_PR) tips.push({ text: '每週在 2 則別人的貼文留下有內容的留言，並主動追蹤下方推薦的人物。', ucan: `人際互動 PR${comps['人際互動'].pr}` });
        if (comps['持續學習'] && comps['持續學習'].pr < WEAK_PR) tips.push({ text: '把貼文當作學習紀錄：每學完一個小單元就發一則，讓持續學習有看得見的成果。', ucan: `持續學習 PR${comps['持續學習'].pr}` });

        return {
            primary: Object.assign({ id: pf.primary }, KB.platforms[pf.primary]),
            secondary: Object.assign({ id: pf.secondary }, KB.platforms[pf.secondary]),
            why: pf.why,
            cadence: pf.cadence.slice(),
            postIdeas: pf.postIdeas.slice(),
            bio: pf.bio.replace('{dept}', shortDept(profile)),
            tips,
            creators: role.creators.map(id => Object.assign({ id }, KB.creators[id]))
        };
    }

    /* ---------------- 名詞辭典 ---------------- */
    function glossaryFor(plan, social) {
        const terms = new Set();
        plan.phases.forEach(p => p.tasks.forEach(t => (t.tools || []).forEach(x => terms.add(x))));
        if (social) { terms.add(social.primary.name); terms.add(social.secondary.name); }
        return Array.from(terms).filter(t => KB.glossary[t]).map(t => ({ term: t, meaning: KB.glossary[t] }));
    }

    /* ---------------- 系所推薦 (lab_recommendation 使用) ---------------- */
    const DEPTS = { CS: '資訊工程學系 (CS)', IM: '資訊管理學系 (IM)', AI: '人工智慧學系 (AI)' };

    const D_HOLLAND = {
        CS: { R: 0.9, I: 0.8, C: 0.5, E: 0.2, A: 0.1, S: 0.1 },
        IM: { E: 0.9, C: 0.7, S: 0.6, A: 0.4, I: 0.4, R: 0.2 },
        AI: { I: 0.9, A: 0.5, R: 0.5, C: 0.4, E: 0.2, S: 0.1 }
    };
    const D_CLUSTER = {
        CS: { '資訊科技': 1, '科學、技術、工程、數學': 0.8, '製造': 0.5, '物流運輸': 0.3 },
        IM: { '企業經營管理': 1, '金融財務': 0.8, '行銷與銷售': 0.8, '資訊科技': 0.7, '物流運輸': 0.4, '政府公共事務': 0.3 },
        AI: { '資訊科技': 1, '科學、技術、工程、數學': 1, '藝文與影音傳播': 0.6, '醫療保健': 0.4 }
    };
    const D_COMMON = {
        CS: { '問題解決': 0.9, '科技應用': 0.8, '持續學習': 0.6, '工作責任': 0.5 },
        IM: { '溝通表達': 0.8, '團隊合作': 0.8, '人際互動': 0.7, '問題解決': 0.5, '工作責任': 0.5 },
        AI: { '問題解決': 0.8, '科技應用': 0.8, '創新': 0.8, '持續學習': 0.7 }
    };
    const D_PATHWAY = [
        { kw: ['軟體'], CS: 0.9, IM: 0.5, AI: 0.5 },
        { kw: ['系統分析'], IM: 1, CS: 0.5, AI: 0.2 },
        { kw: ['資料', '數據', '統計'], AI: 1, IM: 0.5, CS: 0.4 },
        { kw: ['網路', '維運'], CS: 1, IM: 0.3, AI: 0.1 },
        { kw: ['資安', '資訊安全'], CS: 1, IM: 0.3, AI: 0.2 },
        { kw: ['行銷', '電子商務', '電商', '業務', '銷售'], IM: 1, CS: 0.1, AI: 0.2 },
        { kw: ['互動多媒體', '多媒體', '遊戲'], AI: 0.9, CS: 0.4, IM: 0.4 },
        { kw: ['視覺', '藝術', '影音', '設計'], AI: 0.6, IM: 0.5, CS: 0.2 },
        { kw: ['管理', '企劃', '專案', '財務', '金融', '企業資源'], IM: 1, CS: 0.2, AI: 0.2 }
    ];

    function deptParts(profile, dept) {
        const parts = [];
        if (has(profile.holland)) {
            const ranked = Object.keys(profile.holland).sort((a, b) => (profile.holland[b].score - profile.holland[a].score) || (profile.holland[b].pr - profile.holland[a].pr)).slice(0, 3);
            const w = [3, 2, 1];
            let s = 0, ws = 0;
            ranked.forEach((k, i) => { s += w[i] * D_HOLLAND[dept][k]; ws += w[i]; });
            parts.push({ id: 'holland', label: '職業性格 (Holland)', source: '職業興趣探索', weight: 0.35, value: s / ws, detail: `前三高：${ranked.map(k => `${HOLLAND_NAME[k]} ${k}`).join('、')}` });
        }
        if ((profile.clusters && profile.clusters.length) || (profile.topClusters && profile.topClusters.length)) {
            const aff = D_CLUSTER[dept];
            let s = 0, ws = 0; const det = [];
            if (profile.clusters && profile.clusters.length) {
                profile.clusters.forEach(c => { if (aff[c.name]) { s += aff[c.name] * pr100(c.pr); ws += aff[c.name]; if (c.pr >= 50) det.push(`${c.name} PR${c.pr}`); } });
            } else {
                Object.keys(aff).forEach(name => { ws += aff[name]; if (profile.topClusters.includes(name)) { s += aff[name]; det.push(`${name}（興趣前幾名）`); } });
            }
            if (ws) parts.push({ id: 'cluster', label: '職涯類型興趣', source: '職業興趣探索', weight: 0.25, value: s / ws, detail: det.length ? det.join('、') : '相關職涯類型興趣偏低' });
        }
        if (profile.profPathway) {
            const row = D_PATHWAY.find(r => includesAny(profile.profPathway, r.kw));
            if (row) {
                const base = row[dept] || 0.1;
                const v = base * (0.7 + 0.3 * (typeof profile.profPr === 'number' ? pr100(profile.profPr) : 0.5));
                parts.push({ id: 'pathway', label: '專業職能途徑', source: '專業職能診斷', weight: 0.2, value: v, detail: `就業途徑「${profile.profPathway}」` });
            }
        }
        if (has(profile.commonComps)) {
            const aff = D_COMMON[dept];
            let s = 0, ws = 0; const det = [];
            Object.keys(aff).forEach(k => { const c = profile.commonComps[k]; if (c) { s += aff[k] * pr100(c.pr); ws += aff[k]; det.push(`${k} PR${c.pr}`); } });
            if (ws) parts.push({ id: 'common', label: '共通職能', source: '職場共通職能', weight: 0.2, value: s / ws, detail: det.join('、') });
        }
        return parts;
    }

    /** 依 UCAN 資料推薦系所，回傳每個系所的分數與依據 */
    function recommendDepartments(profile) {
        const completeness = 3 - (profile.missing ? profile.missing.length : 0);
        const list = Object.keys(DEPTS).map(dept => {
            const parts = deptParts(profile, dept);
            const wsum = parts.reduce((s, p) => s + p.weight, 0);
            const score = wsum ? parts.reduce((s, p) => s + p.weight * p.value, 0) / wsum : 0;
            return { dept, name: DEPTS[dept], score: round(score * 100), parts };
        }).sort((a, b) => b.score - a.score);
        return { ranked: list, completeness, tie: list.length > 1 && list[0].score - list[1].score <= 2 };
    }

    return {
        WEAK_PR, DEPTS, getRole, shortDept,
        rankRoles, suggestRoles, buildPlan, buildSocial, glossaryFor,
        findWeakCommon, findStrengths, recommendDepartments
    };
});
