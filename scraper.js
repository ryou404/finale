/**
 * 靜宜大學課程綱要爬蟲 - 終極點擊版 v5
 * 
 * 核心原理：直接在主頁面上操作 DataTables，讓它顯示所有資料
 * 然後使用 DOM click() 點擊 .outlineLink，讓網頁原生邏輯幫我們處理 CSRF 和 POST
 * 並且攔截新開的 popup 分頁，爬完就關。
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  IM: { unitCode: '71', deptName: '資訊管理學系' },
  CS: { unitCode: '72', deptName: '資訊工程學系' },
  AI: { unitCode: '75', deptName: '人工智慧學系' },
};
const BASE_URL = 'https://mypu.pu.edu.tw/Framework/Academic/CourseCatalogSys/';
const OUTPUT_DIR = __dirname;
const SAVE_INTERVAL = 5;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function getArgs() {
  const args = process.argv.slice(2);
  const deptIdx = args.indexOf('--dept');
  return { dept: (deptIdx !== -1 ? args[deptIdx + 1] : 'IM').toUpperCase(), resume: args.includes('--resume') };
}

async function extractCourseDetail(page) {
  return await page.evaluate(() => {
    document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
    const body = document.body.innerText;
    const extractSection = (startMarker, ...endMarkers) => {
      const start = body.indexOf(startMarker);
      if (start === -1) return '';
      let end = body.length;
      for (const em of endMarkers) {
        const idx = body.indexOf(em, start + startMarker.length);
        if (idx !== -1 && idx < end) end = idx;
      }
      return body.substring(start + startMarker.length, end).trim();
    };
    const extractTable = (hasText1, hasText2) => {
      const tables = Array.from(document.querySelectorAll('table'));
      const target = tables.find(t => t.innerText.includes(hasText1) && t.innerText.includes(hasText2));
      if (!target) return [];
      return Array.from(target.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('td, th')).map(c => c.innerText.trim().replace(/[\r\n]+/g, ' '))).filter(r => r.length > 0);
    };
    const extractIndicators = () => {
      const tables = Array.from(document.querySelectorAll('table'));
      const target = tables.find(t => t.innerText.includes('能力指標') && t.innerText.includes('權重(%)'));
      if (!target) return [];
      return Array.from(target.querySelectorAll('tr')).map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
        return cells.length >= 2 ? { indicator: cells[0], weight: cells[1] } : null;
      }).filter(Boolean);
    };
    return {
      code: extractSection('選課代號：', '\n'), teacher: extractSection('授課教師：', '\n'),
      classGroup: extractSection('上課班級：', '\n'), timePlace: extractSection('時間地點：', '\n'),
      type: extractSection('修別：', '\n'), credits: extractSection('學分數/實習時數：', '\n'),
      lang: extractSection('課程授課語言：', '\n'), bookLang: extractSection('主要教科書語言：', '\n'),
      book: extractSection('主要教科書及其他參考書\n', '智慧財產權警語', '課程簡介'),
      intro: extractSection('課程簡介\n', '資訊學院教育目標', '資訊管理學系教育目標', '人工智慧學系教育目標', '資訊工程學系教育目標', '學生能力指標與權重', '評分方式及比重'),
      objective: extractSection('教學目標\n', '學生能力指標與權重', '課程之整體規劃與設計', '評分方式及比重'),
      grading: extractSection('評分方式及比重\n', '課業輔導時間', '授課進度與內容'),
      indicators: extractIndicators(), planTable: extractTable('具體教學目標', '核心能力'), scheduleTable: extractTable('週次', '主題內容'),
    };
  });
}

function formatToMarkdown(course, title, index) {
  let md = `## ${index}. ${title}\n\n`;
  md += `- **選課代號**：${course.code || '無資料'}\n- **授課教師**：${course.teacher || '無資料'}\n- **上課班級**：${course.classGroup || '無資料'}\n`;
  md += `- **時間地點**：${course.timePlace || '無資料'}\n- **修別**：${course.type || '無資料'}\n- **學分數/實習時數**：${course.credits || '無資料'}\n`;
  md += `- **課程授課語言**：${course.lang || '無資料'}\n- **主要教科書語言**：${course.bookLang || '無資料'}\n\n`;
  if (course.book) md += `### 主要教科書及其他參考書\n${course.book}\n\n`;
  if (course.intro) md += `### 課程簡介\n${course.intro}\n\n`;
  if (course.objective) md += `### 教學目標\n${course.objective}\n\n`;
  if (course.grading) md += `### 評分方式及比重\n${course.grading}\n\n`;
  if (course.indicators && course.indicators.length > 0) {
    md += `### 學生能力指標與權重\n| 能力指標 | 權重(%) |\n| --- | --- |\n`;
    for (const ind of course.indicators) md += `| ${ind.indicator} | ${ind.weight} |\n`;
    md += '\n';
  }
  if (course.planTable && course.planTable.length > 1) {
    md += `### 課程之整體規劃與設計\n| ${course.planTable[0].join(' | ')} |\n| ${course.planTable[0].map(() => '---').join(' | ')} |\n`;
    for (let i = 1; i < course.planTable.length; i++) md += `| ${course.planTable[i].join(' | ')} |\n`;
    md += '\n';
  }
  if (course.scheduleTable && course.scheduleTable.length > 1) {
    md += `### 授課進度與內容\n| ${course.scheduleTable[0].join(' | ')} |\n| ${course.scheduleTable[0].map(() => '---').join(' | ')} |\n`;
    for (let i = 1; i < course.scheduleTable.length; i++) md += `| ${course.scheduleTable[i].join(' | ')} |\n`;
    md += '\n';
  }
  return md + '\n---\n\n';
}

async function main() {
  const { dept, resume } = getArgs();
  const conf = CONFIG[dept];
  const outputFile = path.join(OUTPUT_DIR, `pu_courses_${dept}_v5.md`);
  const progressFile = path.join(OUTPUT_DIR, `scraper_progress_${dept}.json`);

  let startIndex = 0;
  if (resume && fs.existsSync(progressFile)) {
    const prog = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    startIndex = (prog.lastCompleted || -1) + 1;
  }

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log(`🔍 搜尋 ${conf.deptName} 課程...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await page.click('.btn-danger');
  await sleep(1500);
  await page.select('#offerUnit', conf.unitCode);
  await sleep(1000);
  const btns = await page.$$('button');
  for (const btn of btns) {
    if ((await btn.evaluate(e => e.innerText)).includes('查詢')) { await btn.click(); break; }
  }
  await sleep(3000);

  // 讓 DataTables 顯示全部列
  await page.evaluate(() => {
    const tables = $.fn.dataTable.tables({ api: true });
    tables.page.len(-1).draw(false);
  });
  await sleep(2000);

  // 取得總共有幾筆課程
  const rowCount = await page.evaluate(() => document.querySelectorAll('table tbody tr:not(.child)').length);
  console.log(`✅ 頁面上顯示了 ${rowCount} 筆課程`);

  if (!resume || !fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, `# 靜宜大學 115-1學期 ${conf.deptName} 詳細課綱（v5 原生點擊版）\n\n> 生成時間：${new Date().toLocaleString('zh-TW')}\n\n---\n\n`);
  }

  let buffer = '';
  for (let i = startIndex; i < rowCount; i++) {
    // 取出課程名稱供 logging
    const cName = await page.evaluate((idx) => {
      const row = document.querySelectorAll('table tbody tr:not(.child)')[idx];
      const outlineL = row.querySelector('.outlineLink');
      if (outlineL) return outlineL.innerText.trim();
      const tds = row.querySelectorAll('td');
      return tds.length > 2 ? tds[2].innerText.trim() : 'Unknown';
    }, i);
    process.stdout.write(`[${i + 1}/${rowCount}] "${cName}"...`);

    try {
      if (cName === 'Unknown' || cName === '沒有連結') {
        throw new Error('此課程沒有詳細課綱連結');
      }

      const newPagePromise = new Promise((resolve, reject) => {
        let timer;
        const targetListener = (target) => {
          clearTimeout(timer);
          resolve(target.page());
        };
        browser.once('targetcreated', targetListener);
        timer = setTimeout(() => {
          browser.off('targetcreated', targetListener);
          reject(new Error('等待新分頁超時 (可能無詳細頁連結)'));
        }, 8000);
      });
      
      // 點擊對應列的 .outlineLink
      await page.evaluate((idx) => {
        const row = document.querySelectorAll('table tbody tr:not(.child)')[idx];
        const link = row.querySelector('.outlineLink');
        if (link) link.click();
      }, i);

      const detailPage = await newPagePromise;
      if (!detailPage) throw new Error("無彈出視窗");

      await detailPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(()=>{});
      await sleep(1000);

      const data = await extractCourseDetail(detailPage);
      buffer += formatToMarkdown(data, cName, i + 1);
      console.log(' ✅ 成功');
      await detailPage.close();

      if ((i + 1) % SAVE_INTERVAL === 0 || i === rowCount - 1) {
        fs.appendFileSync(outputFile, buffer);
        buffer = '';
        fs.writeFileSync(progressFile, JSON.stringify({ lastCompleted: i }, null, 2));
      }
      await sleep(1500);
    } catch (err) {
      console.log(' ❌ 失敗:', err.message);
      buffer += `## ${i + 1}. ${cName} (抓取失敗)\n\n---\n\n`;
    }
  }

  if (buffer.length > 0) fs.appendFileSync(outputFile, buffer);
  console.log(`\n🎉 全部完成！已存入：${outputFile}`);
  if (fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
  await browser.close();
}
main();
