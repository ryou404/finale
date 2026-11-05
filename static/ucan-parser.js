/**
 * UCAN 報告解析器 (UCAN report parser)
 * --------------------------------------------------------------
 * 把教育部 UCAN 平台三份診斷報告 (PDF 抽出的純文字) 轉成結構化資料：
 *   1. 職業興趣探索診斷結果  -> Holland 六型 + 16 職涯類型
 *   2. 職場共通職能診斷結果  -> 8 項共通職能
 *   3. 專業職能診斷結果      -> 職涯類型 / 就業途徑 / 各專業職能項目
 *
 * 設計原則：
 *   - 只回報報告裡「真的有」的數字；缺的欄位一律留空，絕不補預設值。
 *   - 同時支援瀏覽器 (window.UcanParser) 與 Node (require)，方便寫測試。
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.UcanParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const HOLLAND = [
        { key: 'R', name: '實用型', en: 'Realistic' },
        { key: 'I', name: '研究型', en: 'Investigative' },
        { key: 'A', name: '藝術型', en: 'Artistic' },
        { key: 'S', name: '社會型', en: 'Social' },
        { key: 'E', name: '企業型', en: 'Enterprising' },
        { key: 'C', name: '事務型', en: 'Conventional' }
    ];

    // UCAN 16 職涯類型 (Career Clusters)
    const CLUSTERS = [
        '建築營造', '天然資源、食品與農業', '藝文與影音傳播', '企業經營管理',
        '教育與訓練', '金融財務', '政府公共事務', '醫療保健',
        '個人及社會服務', '休閒與觀光旅遊', '資訊科技', '司法、法律與公共安全',
        '行銷與銷售', '製造', '科學、技術、工程、數學', '物流運輸'
    ];

    // UCAN 8 項共通職能：報告原名 -> 本系統使用的短名
    const COMMON = [
        { report: '溝通表達', short: '溝通表達' },
        { report: '持續學習', short: '持續學習' },
        { report: '人際互動', short: '人際互動' },
        { report: '團隊合作', short: '團隊合作' },
        { report: '問題解決', short: '問題解決' },
        { report: '創新', short: '創新' },
        { report: '工作責任及紀律', short: '工作責任' },
        { report: '資訊科技應用', short: '科技應用' }
    ];
    const COMMON_KEYS = COMMON.map(c => c.short);

    /** UCAN 的三分位：PR 67 以上為優勢，34~66 為中等，33 以下尚待加強 */
    function levelFromPr(pr) {
        if (typeof pr !== 'number' || isNaN(pr)) return null;
        if (pr >= 67) return 'strong';
        if (pr >= 34) return 'mid';
        return 'weak';
    }
    const LEVEL_LABEL = { strong: '優勢', mid: '中等', weak: '待加強' };

    function flatten(text) {
        return String(text || '')
            .replace(/\r/g, '')
            .replace(/[\s\u00a0\u3000]+/g, ' ')
            .trim();
    }
    function compact(text) { return String(text || '').replace(/\s+/g, ''); }
    function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

    function parseDate(flat) {
        const m = flat.match(/施測日期\s*[：:]\s*(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        if (!m) return null;
        return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
    }

    function parseStudent(flat) {
        const s = {};
        const name = flat.match(/姓名\s*[：:]\s*(\S+)/);
        const school = flat.match(/學校\s*[：:]\s*(\S+)/);
        const dept = flat.match(/系級\s*[：:]\s*(.+?)\s*學號/);
        const id = flat.match(/學號\s*[：:]\s*([0-9A-Za-z]+)/);
        if (name) s.name = name[1];
        if (school) s.school = school[1];
        if (dept) s.dept = dept[1].trim();
        if (id) s.id = id[1];
        return s;
    }

    /** 判斷文字屬於哪一份報告 */
    function detectReportType(flat) {
        const c = compact(flat);
        const types = [];
        if (c.includes('職業興趣探索診斷結果') || c.includes('您的職業性格代碼')) types.push('holland');
        if (c.includes('職場共通職能診斷結果')) types.push('common');
        if (c.includes('專業職能診斷結果')) types.push('professional');
        return types;
    }

    function parseHolland(flat) {
        const out = { scores: {}, clusters: [], topClusters: [], code: null };

        HOLLAND.forEach(h => {
            // 例：藝術型 A 6 72   (滿分 12 分；PR 1~100)
            const re = new RegExp(`${h.name}\\s*${h.key}\\s+(\\d{1,2})\\s+(\\d{1,3})(?!\\d)`);
            const m = flat.match(re);
            if (m) {
                const score = parseInt(m[1], 10), pr = parseInt(m[2], 10);
                if (score <= 12 && pr <= 100) out.scores[h.key] = { score, pr, name: h.name };
            }
        });

        const code = flat.match(/您的職業性格代碼\s*([RIASEC]{1,4})(?![A-Za-z])/);
        if (code) out.code = code[1];

        // 16 職涯類型：只在「16職涯類型PR值」到「全體PR值」之間找，避免誤抓內文
        const startIdx = flat.indexOf('16職涯類型PR值') >= 0 ? flat.indexOf('16職涯類型PR值') : flat.search(/16\s*職涯類型\s*PR\s*值/);
        let section = startIdx >= 0 ? flat.slice(startIdx) : flat;
        const endIdx = section.search(/1\.\s*全體\s*PR/);
        if (endIdx > 0) section = section.slice(0, endIdx);
        CLUSTERS.forEach(name => {
            const re = new RegExp(`${esc(name)}\\s+(\\d+(?:\\.\\d+)?)\\s+(\\d{1,3})(?!\\d)`);
            const m = section.match(re);
            if (m) out.clusters.push({ name, score: num(m[1]), pr: parseInt(m[2], 10) });
        });

        const top = flat.match(/興趣度最高的前幾名依序是\s*[：:]\s*(.+?)\s*興趣度高/);
        // 「司法、法律與公共安全」這類名稱本身含「、」，不能直接用「、」切，改用 16 類型清單比對
        if (top) out.topClusters = regroupClusters(top[1]);
        return out;
    }

    /** 把用「、」切開的類型名稱，依 16 類型清單還原 (因為名稱本身含「、」) */
    function regroupClusters(text) {
        const found = [];
        let rest = text.replace(/\s+/g, '');
        while (rest.length) {
            const hit = CLUSTERS.filter(c => rest.startsWith(c)).sort((a, b) => b.length - a.length)[0];
            if (!hit) break;
            found.push(hit);
            rest = rest.slice(hit.length).replace(/^[、,，]/, '');
        }
        return found;
    }

    function parseCommon(flat) {
        const comps = {};
        const start = flat.indexOf('職場共通職能分數');
        let section = start >= 0 ? flat.slice(start) : flat;
        const end = section.search(/優勢能力\s*\(/);
        if (end > 0) section = section.slice(0, end);

        // 表格：溝通表達 27 3.43  (PR 在前、原始分數在後)
        COMMON.forEach(c => {
            const re = new RegExp(`${esc(c.report)}\\s+(\\d{1,3})\\s+(\\d(?:\\.\\d+)?)(?![\\d.])`);
            const m = section.match(re);
            if (m) comps[c.short] = { pr: parseInt(m[1], 10), score: num(m[2]) };
        });

        // 內文補洞：您在「創新」這項共通職能的原始分數是3.67分，PR值是48
        const para = /您在「([^」]+)」這項共通職能的原始分數是\s*([\d.]+)\s*分\s*[，,]\s*PR\s*值是\s*(\d+)/g;
        let pm;
        while ((pm = para.exec(flat)) !== null) {
            const c = COMMON.find(x => x.report === pm[1].trim() || x.short === pm[1].trim());
            if (c && !comps[c.short]) comps[c.short] = { pr: parseInt(pm[3], 10), score: num(pm[2]) };
        }
        return comps;
    }

    /**
     * 解析「專業職能分數」表格。表格每列：職能說明 PR 分數 (例：…創作 74 4)。
     * PDF 分頁時，pdf.js 會把頁尾的列重複輸出、並夾雜「能力強度PR值 0 99」「1 / 4」等雜訊，
     * 這裡先清除雜訊，再用「名稱互相包含」去除重複列。
     */
    function parseProfessionalItems(text) {
        const cleaned = text
            .replace(/能力強度\s*PR\s*值\s*\d+\s+\d+/g, ' ')
            .replace(/\b\d+\s*\/\s*\d+\b/g, ' ')
            .replace(/\s+/g, ' ');
        const cjk = '\\u4e00-\\u9fff，、；。：（）';
        const squeeze = s => s.replace(new RegExp(`([${cjk}])\\s+(?=[${cjk}])`, 'g'), '$1').trim();
        const items = [];
        const itemRe = /(.+?)\s(\d{1,3})\s(\d(?:\.\d+)?)(?=\s|$)/g;
        let m;
        while ((m = itemRe.exec(cleaned)) !== null) {
            let name = squeeze(m[1]);
            const pr = parseInt(m[2], 10), score = num(m[3]);
            if (!name || pr > 100 || score < 1 || score > 5) continue;
            const key = name.replace(/\s+/g, '');
            // 與已收錄的列重複，或含有已收錄列的整段名稱 (分頁殘留的前綴) 就略過
            const dup = items.some(it => { const k = it.name.replace(/\s+/g, ''); return k === key || key.includes(k); });
            if (dup) continue;
            items.push({ name, pr, score });
        }
        return items;
    }

    function parseProfessional(flat) {
        // 只取報告第一份 (PDF 每頁可能重複相同內容)
        const first = flat.indexOf('專業職能診斷結果');
        const second = first >= 0 ? flat.indexOf('專業職能診斷結果', first + 10) : -1;
        let body = flat;
        if (second > 0) body = flat.slice(0, second);

        const out = { cluster: null, pathway: null, items: [], avg: null };
        const cluster = body.match(/職涯類型\s*[：:]\s*(.+?)\s*就業途徑/);
        const pathway = body.match(/就業途徑\s*[：:]\s*(.+?)\s*專業職能\s*分數/);
        if (cluster) out.cluster = cluster[1].trim();
        if (pathway) out.pathway = pathway[1].trim();

        const seg = body.match(/專業職能\s*分數\s*(.+?)\s*「([^」]*)」\s*平均數\s*(\d{1,3})\s+(\d(?:\.\d+)?)/);
        if (seg) {
            out.avg = { pr: parseInt(seg[3], 10), score: num(seg[4]) };
            out.items = parseProfessionalItems(seg[1]);
        }
        if (!out.avg) {
            const alt = body.match(/(\d(?:\.\d+)?)\s*分\s*\/\s*PR\s*(\d{1,3})/);
            if (alt) out.avg = { score: num(alt[1]), pr: parseInt(alt[2], 10) };
        }
        return out;
    }

    /**
     * 解析單一份 PDF 的純文字。
     * @returns {{types:string[], student:object, date:string|null, holland?:object, common?:object, professional?:object}}
     */
    function parseReport(rawText) {
        const flat = flatten(rawText);
        const types = detectReportType(flat);
        const result = { types, student: parseStudent(flat), date: parseDate(flat) };
        if (types.includes('holland')) result.holland = parseHolland(flat);
        if (types.includes('common')) result.common = parseCommon(flat);
        if (types.includes('professional')) result.professional = parseProfessional(flat);
        return result;
    }

    /** 由分數推導 Holland 代碼 (僅在報告沒有明列代碼時使用)：取前三高，同分比 PR */
    function deriveHollandCode(scores) {
        return Object.keys(scores)
            .sort((a, b) => (scores[b].score - scores[a].score) || (scores[b].pr - scores[a].pr))
            .slice(0, 3).join('');
    }

    /**
     * 把一份或多份解析結果合併成「UCAN 個人資料 (v2)」。
     * 欄位名稱沿用舊版 (holland / commonComps / profPathway ...)，
     * career_fit、course-recommend 等頁面仍可直接讀取。
     * 缺少的報告會列在 missing，不會補任何預設值。
     */
    function buildProfile(parts) {
        const list = Array.isArray(parts) ? parts : [parts];
        const p = {
            schemaVersion: 2,
            source: 'ucan',
            student: {},
            reportDates: {},
            holland: {}, hollandCode: '', primaryHolland: '', hollandTop3: [],
            clusters: [], topClusters: [],
            commonComps: {},
            profPathway: '', profCareerCluster: '', profScore: null, profPr: null, profItems: [],
            missing: []
        };

        list.forEach(r => {
            if (!r) return;
            Object.assign(p.student, r.student || {});
            if (r.holland && Object.keys(r.holland.scores).length) {
                Object.keys(r.holland.scores).forEach(k => { p.holland[k] = { score: r.holland.scores[k].score, pr: r.holland.scores[k].pr }; });
                if (r.holland.code) p.hollandCode = r.holland.code;
                if (r.holland.clusters.length) p.clusters = r.holland.clusters;
                if (r.holland.topClusters.length) p.topClusters = r.holland.topClusters;
                if (r.date) p.reportDates.holland = r.date;
            }
            if (r.common && Object.keys(r.common).length) {
                Object.assign(p.commonComps, r.common);
                if (r.date) p.reportDates.common = r.date;
            }
            if (r.professional && r.professional.pathway) {
                p.profPathway = r.professional.pathway;
                p.profCareerCluster = r.professional.cluster || '';
                if (r.professional.avg) { p.profScore = r.professional.avg.score; p.profPr = r.professional.avg.pr; }
                p.profItems = r.professional.items || [];
                if (r.date) p.reportDates.professional = r.date;
            }
        });

        if (Object.keys(p.holland).length) {
            if (!p.hollandCode) p.hollandCode = deriveHollandCode(p.holland);
            p.hollandTop3 = p.hollandCode.split('').slice(0, 3);
            p.primaryHolland = p.hollandCode[0];
        } else p.missing.push('holland');
        if (!Object.keys(p.commonComps).length) p.missing.push('common');
        if (!p.profPathway) p.missing.push('professional');

        const dates = Object.values(p.reportDates).sort();
        p.date = dates.length ? dates[dates.length - 1] : '';
        return p;
    }

    /** 檢查「手動輸入」的範圍是否合理；回傳錯誤訊息陣列 (空陣列代表通過) */
    function validateProfile(p) {
        const errs = [];
        const inRange = (v, lo, hi) => typeof v === 'number' && !isNaN(v) && v >= lo && v <= hi;
        Object.keys(p.holland || {}).forEach(k => {
            if (!inRange(p.holland[k].score, 0, 12)) errs.push(`Holland ${k} 分數需介於 0–12`);
            if (!inRange(p.holland[k].pr, 1, 100)) errs.push(`Holland ${k} PR 需介於 1–100`);
        });
        Object.keys(p.commonComps || {}).forEach(k => {
            if (!inRange(p.commonComps[k].score, 1, 5)) errs.push(`${k} 分數需介於 1–5`);
            if (!inRange(p.commonComps[k].pr, 1, 100)) errs.push(`${k} PR 需介於 1–100`);
        });
        if (p.profPathway) {
            if (p.profScore != null && !inRange(p.profScore, 1, 5)) errs.push('專業職能分數需介於 1–5');
            if (p.profPr != null && !inRange(p.profPr, 1, 100)) errs.push('專業職能 PR 需介於 1–100');
        }
        return errs;
    }

    return {
        HOLLAND, CLUSTERS, COMMON, COMMON_KEYS, LEVEL_LABEL,
        levelFromPr, parseReport, buildProfile, validateProfile, deriveHollandCode, regroupClusters
    };
});
