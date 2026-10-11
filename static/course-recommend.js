/**
 * CareerDNA Course Recommendation Widget
 * Shared by career_fit.html (after brand test) and profile.html.
 * Supports hover quick-preview and click full syllabus modal.
 * Usage: window.CourseRec.render(containerEl, { dept, grade, pathway, limit });
 */
(function () {
  if (typeof window === 'undefined' || window.CourseRec) return;

  const DEPT_NAMES = { CS: '資訊工程學系', IM: '資訊管理學系', AI: '人工智慧學系' };
  const YEAR_LABEL = { 1: '大一', 2: '大二', 3: '大三', 4: '大四' };
  let lastLoadedCourses = [];

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

  function ensureModal() {
    let modal = document.getElementById('course-rec-detail-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'course-rec-detail-modal';
    modal.className = 'fixed inset-0 z-[120] hidden flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-close-modal="1"></div>
      <div class="relative z-10 bg-white border-2 border-klein w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl crosshair-corner overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 bg-klein text-white">
          <div class="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase">
            <i class="fa-solid fa-calendar-week"></i>
            <span id="crm-code-badge">COURSE SYLLABUS // DETAIL</span>
          </div>
          <button type="button" data-close-modal="1" class="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white hover:text-klein transition-all font-bold text-sm">✕</button>
        </div>
        <div id="crm-body" class="p-6 overflow-y-auto space-y-6 text-klein"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target && e.target.getAttribute('data-close-modal') === '1') {
        modal.classList.add('hidden');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
      }
    });
    return modal;
  }

  function openCourseModal(idx) {
    const c = lastLoadedCourses[idx];
    if (!c) return;
    const modal = ensureModal();
    const codeBadge = document.getElementById('crm-code-badge');
    const body = document.getElementById('crm-body');

    if (codeBadge) {
      codeBadge.textContent = `選課代號 #${c.code || '----'} // ${DEPT_NAMES[c.dept] || c.dept}・${YEAR_LABEL[c.year] || ''}`;
    }

    const scheduleRows = (c.weeklySchedule || []).map(r => `
      <tr class="border-b border-klein/10 hover:bg-klein/[0.02]">
        <td class="py-2 px-3 font-mono font-bold text-xs text-klein whitespace-nowrap">第 ${esc(r.week)} 週</td>
        <td class="py-2 px-3 font-body text-xs text-klein/90">${esc(r.topic)}</td>
        <td class="py-2 px-3 font-body text-[11px] text-klein/60">${esc(r.note)}</td>
      </tr>
    `).join('');

    body.innerHTML = `
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="text-xs font-mono font-bold px-2 py-0.5 bg-klein text-white">${YEAR_LABEL[c.year] || ''}</span>
          <span class="text-xs font-mono font-bold px-2 py-0.5 border border-klein/30 text-klein">${esc(c.type || '選修')}</span>
          <span class="text-xs font-mono font-bold px-2 py-0.5 border border-klein/30 text-klein">${c.credits || 0} 學分 (${esc(c.creditRaw || '')})</span>
          ${(c.reasons || []).map(r => `<span class="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">🎯 ${esc(r)}</span>`).join('')}
        </div>
        <h3 class="font-heading font-black text-2xl text-klein">${esc(c.name)}</h3>
      </div>

      <!-- Course Metadata Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-klein/[0.03] border border-klein/15 font-mono text-xs">
        <div>
          <div class="text-[10px] text-klein/50 uppercase">授課教師 (Instructor)</div>
          <div class="font-bold text-klein mt-0.5"><i class="fa-solid fa-chalkboard-user mr-1 text-klein/70"></i>${esc(c.teacher || '未定')}</div>
        </div>
        <div>
          <div class="text-[10px] text-klein/50 uppercase">時間地點 (Schedule & Room)</div>
          <div class="font-bold text-klein mt-0.5"><i class="fa-regular fa-clock mr-1 text-klein/70"></i>${esc(c.schedule || '依學校公告')}</div>
        </div>
        <div>
          <div class="text-[10px] text-klein/50 uppercase">上課班級 (Class)</div>
          <div class="font-bold text-klein mt-0.5"><i class="fa-solid fa-users mr-1 text-klein/70"></i>${esc(c.className || '—')}</div>
        </div>
        <div>
          <div class="text-[10px] text-klein/50 uppercase">授課語言 (Language)</div>
          <div class="font-bold text-klein mt-0.5"><i class="fa-solid fa-globe mr-1 text-klein/70"></i>${esc(c.language || '中文')}</div>
        </div>
      </div>

      <!-- Full Intro -->
      <div>
        <h4 class="font-mono text-xs font-bold uppercase tracking-wider text-klein border-b border-klein/15 pb-1.5 mb-2 flex items-center gap-2">
          <i class="fa-solid fa-book-open text-klein"></i> 課程簡介 (Course Description)
        </h4>
        <p class="font-body text-xs leading-relaxed text-klein/80 whitespace-pre-line">${esc(c.fullIntro || c.intro || '尚無課程簡介')}</p>
      </div>

      <!-- Grading & Textbook -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-3.5 border border-klein/15 bg-white">
          <h4 class="font-mono text-xs font-bold uppercase tracking-wider text-klein mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-chart-pie text-klein"></i> 評分方式及比重
          </h4>
          <div class="font-mono text-xs text-klein/80 whitespace-pre-line leading-relaxed">${esc(c.grading || '依授課教師課堂公告為準')}</div>
        </div>
        <div class="p-3.5 border border-klein/15 bg-white">
          <h4 class="font-mono text-xs font-bold uppercase tracking-wider text-klein mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-bookmark text-klein"></i> 主要教科書與參考書
          </h4>
          <div class="font-body text-xs text-klein/80 whitespace-pre-line leading-relaxed">${esc(c.textbook || '依授課教師自編講義或指定教材')}</div>
        </div>
      </div>

      <!-- 18-Week Syllabus Table -->
      <div>
        <h4 class="font-mono text-xs font-bold uppercase tracking-wider text-klein border-b border-klein/15 pb-1.5 mb-2 flex items-center gap-2">
          <i class="fa-solid fa-list-ol text-klein"></i> 18 週授課進度與課表 (Weekly Syllabus)
        </h4>
        ${scheduleRows ? `
          <div class="border border-klein/15 max-h-72 overflow-y-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-klein/5 border-b border-klein/15 sticky top-0">
                <tr>
                  <th class="py-2 px-3 font-mono text-[11px] font-bold text-klein w-20">週次</th>
                  <th class="py-2 px-3 font-mono text-[11px] font-bold text-klein">主題內容 / 章節 / 活動</th>
                  <th class="py-2 px-3 font-mono text-[11px] font-bold text-klein w-1/3">備註</th>
                </tr>
              </thead>
              <tbody>${scheduleRows}</tbody>
            </table>
          </div>
        ` : `<div class="p-3 bg-klein/[0.02] border border-klein/10 font-mono text-xs text-klein/50">尚無週次進度表資料</div>`}
      </div>

      <div class="flex justify-end items-center gap-3 pt-2 border-t border-klein/10">
        <a href="resource_library.html?search=${encodeURIComponent(c.name)}" target="_blank" class="px-4 py-2 border border-klein text-klein hover:bg-klein/5 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5">
          <span>於課程資料庫開啟</span> <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
        </a>
        <button type="button" data-close-modal="1" class="px-5 py-2 bg-klein text-white hover:bg-klein/90 font-mono text-xs font-bold uppercase tracking-wider transition-all">
          關閉視窗
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  function card(c, idx) {
    const typeCls = c.required
      ? 'bg-flame-orange/10 text-flame-orange border-flame-orange/30'
      : 'bg-klein/5 text-klein/70 border-klein/20';
    const reason = (c.reasons || []).map(r =>
      `<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">🎯 ${esc(r)}</span>`
    ).join('');

    const previewWeeks = (c.weeklySchedule || []).slice(0, 3).map(w =>
      `<div class="truncate text-[11px] text-klein/75"><span class="font-mono font-bold text-klein">W${esc(w.week)}:</span> ${esc(w.topic)}</div>`
    ).join('');

    return `
      <div data-course-idx="${idx}" class="group relative border border-klein/10 bg-white p-4 hover:border-klein hover:shadow-md transition-all cursor-pointer">
        <div class="flex flex-wrap items-start justify-between gap-2 mb-1.5">
          <h4 class="font-heading font-black text-sm text-klein group-hover:text-blue-700 flex items-center gap-1.5">
            <span>${esc(c.name)}</span>
            <i class="fa-solid fa-circle-info text-[11px] text-klein/40 group-hover:text-klein transition-colors" title="點擊查看完整課表"></i>
          </h4>
          <div class="flex flex-wrap gap-1.5">
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-klein text-white">${YEAR_LABEL[c.year] || ''}</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 border ${typeCls}">${esc(c.type || '選修')}</span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 border border-klein/20 text-klein/70">${c.credits || 0} 學分</span>
          </div>
        </div>

        <!-- Quick Schedule & Instructor Bar -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-klein/70 mb-2">
          <span><i class="fa-solid fa-chalkboard-user mr-1 text-klein/50"></i>${esc(c.teacher || '未定')}</span>
          <span><i class="fa-regular fa-clock mr-1 text-klein/50"></i>${esc(c.schedule || '時間未定')}</span>
          ${c.code ? `<span class="text-klein/50">#${esc(c.code)}</span>` : ''}
        </div>

        ${reason ? `<div class="mb-2 flex flex-wrap gap-1">${reason}</div>` : ''}
        <p class="font-body text-[12px] leading-relaxed text-klein/70">${esc(c.intro || '（尚無課程簡介）')}</p>

        <!-- Hover Expandable Quick Schedule Preview -->
        <div class="hidden group-hover:block mt-3 pt-2.5 border-t border-dashed border-klein/20 bg-klein/[0.02] p-2.5 space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-mono font-bold text-klein uppercase tracking-wider">
            <span><i class="fa-solid fa-calendar-days mr-1"></i>課表與評分預覽 (${esc(c.className || '')})</span>
            <span class="underline text-blue-700">點擊展開 18 週完整課綱 ➔</span>
          </div>
          ${c.grading ? `<div class="text-[11px] font-mono text-klein/80 truncate"><strong>評分：</strong>${esc(c.grading.replace(/\s*\n+\s*/g, ' / '))}</div>` : ''}
          ${previewWeeks ? `<div class="space-y-0.5 pt-0.5">${previewWeeks}</div>` : ''}
        </div>
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
        ? `已依您的 UCAN 測驗結果（職能路徑：<strong>${esc(ucan.profPathway || '—')}</strong>）排序推薦。<span class="text-emerald-700 font-bold">（滑鼠移入可預覽課表，點擊卡片可展開完整 18 週課綱）</span>`
        : `尚未完成品牌測驗，目前依系所與年級顯示課程。<a href="brand_test.html" class="underline font-bold">前往品牌測驗</a> 可取得個人化推薦。`;
      const yearsText = (data.years || []).map(y => YEAR_LABEL[y]).join(' / ');

      if (!data.courses || data.courses.length === 0) {
        el.innerHTML = `
          <div class="p-4 border border-klein/20 bg-klein/[0.02] font-mono text-xs text-klein/70">
            ${esc(DEPT_NAMES[dept])}・${esc(yearsText)} 目前沒有可顯示的課程資料。
          </div>`;
        return;
      }

      lastLoadedCourses = data.courses;
      el.innerHTML = `
        <div class="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-mono">
          <strong>${esc(DEPT_NAMES[dept])}・${esc(yearsText)}</strong>（共 ${data.total} 門）<br>${hint}
        </div>
        <div class="space-y-3 max-h-[560px] overflow-y-auto pr-1">${data.courses.map((c, i) => card(c, i)).join('')}</div>`;

      el.querySelectorAll('[data-course-idx]').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
          const idx = parseInt(cardEl.getAttribute('data-course-idx'), 10);
          openCourseModal(idx);
        });
      });
    } catch (e) {
      console.error('[CourseRec] load failed:', e);
      el.innerHTML = '<div class="font-mono text-xs text-flame-orange p-4">推薦課程載入失敗，請稍後再試。</div>';
    }
  }

  window.CourseRec = { render, normalizeDept, openCourseModal };
})();
