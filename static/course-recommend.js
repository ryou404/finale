/**
 * CareerDNA Course Recommendation Widget
 * Shared by career_fit.html (after brand test) and profile.html.
 * Usage: window.CourseRec.render(containerEl, { dept, grade, pathway, limit });
 */
(function () {
  if (typeof window === 'undefined' || window.CourseRec) return;

  const DEPT_NAMES = { CS: '資訊工程學系', IM: '資訊管理學系', AI: '人工智慧學系' };
  const YEAR_LABEL = { 1: '大一', 2: '大二', 3: '大三', 4: '大四' };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normalizeDept(d) {
    const s = String(d || '').trim();
    if (!s) return '';
    if (['CS', 'IM', 'AI'].includes(s.toUpperCase())) return s.toUpperCase();
    if (/資工|工程|computer science/i.test(s)) return 'CS';
    if (/資管|管理|information management/i.test(s)) return 'IM';
    if (/人工智慧|AI/i.test(s)) return 'AI';
    return '';
  }

  function getUcan() {
    try { return JSON.parse(localStorage.getItem('ucan_dna_result') || 'null'); } catch (e) { return null; }
  }

  function card(c) {
    const typeCls = c.required
      ? 'bg-flame-orange/10 text-flame-orange border-flame-orange/30'
      : 'bg-klein/5 text-klein/70 border-klein/20';
    const reason = (c.reasons || []).map(r =>
      `<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">🎯 ${esc(r)}</span>`
    ).join('');
    return `
      <div class="border border-klein/10 bg-white p-4 hover:border-klein transition-all">
        <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
          <h4 class="font-heading font-black text-sm text-klein">${esc(c.name)}</h4>
          <div class="flex flex-wrap gap-1.5">
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-klein text-white">${YEAR_LABEL[c.year] || ''}</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 border ${typeCls}">${esc(c.type || '選修')}</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 border border-klein/20 text-klein/70">${c.credits || 0} 學分</span>
          </div>
        </div>
        ${reason ? `<div class="mb-2 flex flex-wrap gap-1">${reason}</div>` : ''}
        <p class="font-body text-[12px] leading-relaxed text-klein/70">${esc(c.intro || '（尚無課程簡介）')}</p>
      </div>`;
  }

  async function render(el, opts = {}) {
    if (!el) return;
    const ucan = getUcan();
    const dept = normalizeDept(opts.dept || localStorage.getItem('cdna_department'));
    const grade = opts.grade || localStorage.getItem('cdna_grade') || '大三';
    const pathway = opts.pathway !== undefined ? opts.pathway : (ucan && ucan.profPathway) || '';
    const limit = opts.limit || 12;

    if (!dept) {
      el.innerHTML = `
        <div class="p-4 border border-klein/20 bg-klein/[0.02] font-mono text-xs text-klein/70">
          <p class="mb-3">請先選擇就讀系所，系統將依年級顯示推薦課程：</p>
          <div class="flex flex-wrap gap-2">
            ${Object.keys(DEPT_NAMES).map(k => `<button type="button" data-dept="${k}" class="px-3 py-1.5 border border-klein/30 text-klein font-bold hover:bg-klein hover:text-white transition-all">${DEPT_NAMES[k]}</button>`).join('')}
          </div>
        </div>`;
      el.querySelectorAll('button[data-dept]').forEach(b => b.addEventListener('click', () => {
        localStorage.setItem('cdna_department', b.dataset.dept);
        if (typeof opts.onDeptChange === 'function') opts.onDeptChange(b.dataset.dept);
        render(el, Object.assign({}, opts, { dept: b.dataset.dept }));
      }));
      return;
    }

    el.innerHTML = '<div class="font-mono text-xs text-klein/50 p-4">載入推薦課程中...</div>';
    try {
      const qs = new URLSearchParams({ dept, grade, pathway, limit });
      const res = await fetch('/api/courses/recommend?' + qs.toString());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      const hint = ucan
        ? `已依您的 UCAN 測驗結果（職能路徑：<strong>${esc(ucan.profPathway || '—')}</strong>）排序推薦。`
        : `尚未完成品牌測驗，目前依系所與年級顯示課程。<a href="brand_test.html" class="underline font-bold">前往品牌測驗</a> 可取得個人化推薦。`;
      const yearsText = (data.years || []).map(y => YEAR_LABEL[y]).join(' / ');

      if (!data.courses || data.courses.length === 0) {
        el.innerHTML = `
          <div class="p-4 border border-klein/20 bg-klein/[0.02] font-mono text-xs text-klein/70">
            ${esc(DEPT_NAMES[dept])}・${esc(yearsText)} 目前沒有可顯示的課程資料。
          </div>`;
        return;
      }

      el.innerHTML = `
        <div class="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-mono">
          <strong>${esc(DEPT_NAMES[dept])}・${esc(yearsText)}</strong>（共 ${data.total} 門）<br>${hint}
        </div>
        <div class="space-y-3 max-h-[560px] overflow-y-auto pr-1">${data.courses.map(card).join('')}</div>`;
    } catch (e) {
      console.error('[CourseRec] load failed:', e);
      el.innerHTML = '<div class="font-mono text-xs text-flame-orange p-4">推薦課程載入失敗，請稍後再試。</div>';
    }
  }

  window.CourseRec = { render, normalizeDept };
})();
