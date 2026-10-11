/**
 * Course Catalog Service
 * Parses Providence University course markdown files (pu_courses_*_v5.md) once,
 * and serves recommended courses by department / grade / UCAN pathway.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = [
  { file: 'pu_courses_CS_v5.md', dept: 'CS' },
  { file: 'pu_courses_AI_v5.md', dept: 'AI' },
  { file: 'pu_courses_IM_v5.md', dept: 'IM' }
];

const YEAR_MAP = { '一': 1, '二': 2, '三': 3, '四': 4 };

// UCAN professional pathway -> course keywords
const PATHWAY_KEYWORDS = {
  '軟體開發': ['程式設計', '資料結構', '演算法', '網頁前端', '動態網頁', '系統分析', '軟體', '行動應用', '網路程式'],
  '資料科學與分析': ['Python', '大數據', '資料倉儲', '機器學習', '深度學習', '資料庫', '資料挖掘', '商業智慧', '統計'],
  '人工智慧技術應用': ['人工智慧', 'Python', '機器學習', '深度學習', '電腦視覺', '智慧', '影像處理'],
  '資訊安全': ['資訊安全', '安全程式', '系統安全', '網路安全', '計算機網路', 'Linux', '密碼'],
  '網路與系統維運': ['計算機網路', '網路管理', '雲端', 'Linux', '網路安全', '物聯網', '作業系統'],
  '企業資源規劃': ['企業資源規劃', 'ERP', '財務會計', '人力資源', 'ABAP', '商業智慧', '專案管理', '管理']
};

let CATALOG = null;

function pick(section, label) {
  const m = section.match(new RegExp('-\\s*\\*\\*' + label + '\\*\\*[:：]\\s*([^\\n\\r]+)'));
  return m ? m[1].trim() : '';
}

function extractSectionText(section, heading) {
  const m = section.match(new RegExp('###\\s*' + heading + '\\s*\\r?\\n([\\s\\S]*?)(?:\\r?\\n###\\s|\\r?\\n---|$)'));
  if (!m) return '';
  return m[1].replace(/\r/g, '').trim();
}

function extractIntro(section) {
  let text = extractSectionText(section, '課程簡介');
  if (!text) return { short: '', full: '' };
  text = text.split(/\n\s*共同暨通識課程教育目標/)[0].trim();
  const full = text;
  const flat = text.replace(/\s*\n+\s*/g, ' ');
  const short = flat.length > 140 ? flat.slice(0, 140).replace(/[，、；,;\s]+$/, '') + '…' : flat;
  return { short, full };
}

function extractWeeklySchedule(section) {
  const raw = extractSectionText(section, '授課進度與內容');
  if (!raw) return [];
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    if (cells[0] === '週次' || /^-+$/.test(cells[0])) continue;
    rows.push({
      week: cells[0],
      topic: cells[1] || '',
      note: cells[2] || ''
    });
  }
  return rows;
}

function loadCatalog() {
  if (CATALOG) return CATALOG;
  const map = new Map();

  for (const f of FILES) {
    const fp = path.join(ROOT, f.file);
    if (!fs.existsSync(fp)) continue;
    const text = fs.readFileSync(fp, 'utf8');
    const sections = text.split(/\n(?=##\s+\d+\.\s+)/);

    for (const sec of sections) {
      const nm = sec.match(/^##\s+\d+\.\s*([^\n\r]+)/);
      if (!nm) continue;
      const name = nm[1].trim();
      const classGrade = pick(sec, '上課班級');
      const ym = classGrade.match(/(?:資工|資管|人工智慧|AI|IM|CS)\s*([一二三四])/);
      if (!ym) continue; // common/general courses without a clear year
      const year = YEAR_MAP[ym[1]];

      let dept = f.dept;
      if (/資工|CS/.test(classGrade)) dept = 'CS';
      else if (/資管|IM/.test(classGrade)) dept = 'IM';
      else if (/人工智慧|AI/.test(classGrade)) dept = 'AI';

      const creditRaw = pick(sec, '學分數/實習時數');
      const credits = parseFloat(creditRaw) || 0;
      const type = pick(sec, '修別');
      const introObj = extractIntro(sec);

      const key = `${dept}|${year}|${name}`;
      if (map.has(key)) continue;

      map.set(key, {
        code: pick(sec, '選課代號'),
        name,
        dept,
        year,
        type,
        required: /必修/.test(type),
        credits,
        creditRaw,
        teacher: pick(sec, '授課教師'),
        className: classGrade,
        schedule: pick(sec, '時間地點'),
        language: pick(sec, '課程授課語言'),
        textbook: extractSectionText(sec, '主要教科書及其他參考書'),
        grading: extractSectionText(sec, '評分方式及比重'),
        intro: introObj.short,
        fullIntro: introObj.full,
        weeklySchedule: extractWeeklySchedule(sec)
      });
    }
  }

  CATALOG = [...map.values()];
  return CATALOG;
}

function gradeToYears(grade) {
  switch (String(grade || '')) {
    case '大一': return [1, 2]; // UI groups 大一/大二 together
    case '大二': return [2];
    case '大三': return [3];
    case '大四':
    case '碩士': return [4];
    default: return [3];
  }
}

function scoreCourse(course, pathway) {
  let score = 0;
  const reasons = [];
  const kws = PATHWAY_KEYWORDS[pathway] || [];
  if (kws.some(k => course.name.includes(k))) {
    score += 10;
    reasons.push(`契合 UCAN 職能路徑「${pathway}」`);
  }
  if (course.required) score += 3;
  return { score, reasons };
}

/**
 * @param {Object} p
 * @param {string} p.dept     CS | IM | AI
 * @param {string} p.grade    大一 | 大二 | 大三 | 大四 | 碩士
 * @param {string} [p.pathway] UCAN professional pathway
 * @param {number} [p.limit]  max courses
 */
function getRecommendedCourses({ dept, grade, pathway = '', limit = 12 }) {
  const catalog = loadCatalog();
  const years = gradeToYears(grade);

  const items = catalog
    .filter(c => c.dept === dept && years.includes(c.year))
    .map(c => {
      const { score, reasons } = scoreCourse(c, pathway);
      return { ...c, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.year - b.year || b.credits - a.credits);

  return { dept, grade, years, pathway, total: items.length, courses: items.slice(0, limit) };
}

module.exports = { loadCatalog, getRecommendedCourses, gradeToYears };
