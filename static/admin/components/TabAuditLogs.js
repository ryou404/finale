/**
 * Admin Component: TabAuditLogs (Fully Localized)
 */
window.TabAuditLogs = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <section id="panel-auditlogs" class="hidden w-full space-y-4">
        <!-- Filter Bar -->
        <div class="bg-white border-2 border-klein p-4 shadow-sm crosshair-corner flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div class="relative flex-1 min-w-[200px]">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-klein/40 text-xs"></i>
              <input id="logs-search" type="text" placeholder="${t('audit.searchPlaceholder')}" class="w-full pl-9 pr-3 py-2 bg-white border border-klein/30 focus:border-klein font-mono text-xs focus:outline-none" />
            </div>

            <select id="logs-filter-score" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('audit.filterScore')}</option>
              <option value="80">${t('audit.scoreHigh')}</option>
              <option value="60">${t('audit.scoreMed')}</option>
              <option value="0">${t('audit.scoreLow')}</option>
            </select>
          </div>

          <button onclick="TabAuditLogs.loadAuditLogs()" class="px-3 py-2 bg-white border border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-rotate"></i> <span>${t('audit.refresh')}</span>
          </button>
        </div>

        <!-- Audit Logs Table -->
        <div class="bg-white border-2 border-klein shadow-sm crosshair-corner overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead class="bg-klein/5 border-b-2 border-klein text-klein font-bold uppercase tracking-wider">
                <tr>
                  <th class="p-3.5">${t('audit.thUid')}</th>
                  <th class="p-3.5">${t('audit.thTarget')}</th>
                  <th class="p-3.5">${t('audit.thOverall')}</th>
                  <th class="p-3.5">${t('audit.thMetrics')}</th>
                  <th class="p-3.5">${t('audit.thLatency')}</th>
                  <th class="p-3.5">${t('audit.thTime')}</th>
                  <th class="p-3.5 text-right">${t('audit.thActions')}</th>
                </tr>
              </thead>
              <tbody id="logs-table-tbody" class="divide-y divide-klein/10">
                <tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('audit.loading')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function init() {
    ['logs-search', 'logs-filter-score'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => loadAuditLogs());
      if (el && el.tagName === 'INPUT') el.addEventListener('input', () => loadAuditLogs());
    });
  }

  async function loadAuditLogs() {
    const search = document.getElementById('logs-search')?.value || '';
    const score = document.getElementById('logs-filter-score')?.value || 'all';

    const tbody = document.getElementById('logs-table-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('audit.loading')}</td></tr>`;

    let minScoreParam = '';
    if (score === '80') minScoreParam = '&minScore=80';
    else if (score === '60') minScoreParam = '&minScore=60&maxScore=79';
    else if (score === '0') minScoreParam = '&maxScore=59';

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/audit-logs?search=${encodeURIComponent(search)}${minScoreParam}`);
      if (res && res.status === 'ok') {
        const logs = res.logs || [];
        if (logs.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-klein/50 font-mono">${t('audit.noAudits')}</td></tr>`;
          return;
        }

        tbody.innerHTML = logs.map(l => {
          const m = l.metrics || {};
          return `
            <tr class="hover:bg-klein/5 transition-colors">
              <td class="p-3.5 font-mono text-[11px] text-klein/70">${l.userId}</td>
              <td class="p-3.5 font-bold text-klein">${l.targetRole || 'Software Engineer'}</td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 text-xs font-bold ${l.overallScore >= 80 ? 'bg-emerald-100 text-emerald-800' : (l.overallScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}">
                  ${l.overallScore} pts (${l.grade || 'B'})
                </span>
              </td>
              <td class="p-3.5">
                <div class="flex gap-2 text-[10px] font-mono">
                  <span>${t('audit.metricQuant')} <strong>${m.quantifiability || 0}%</strong></span>
                  <span>${t('audit.metricComp')} <strong>${m.completeness || 0}%</strong></span>
                  <span>${t('audit.metricKw')} <strong>${m.keywordRelevance || 0}%</strong></span>
                </div>
              </td>
              <td class="p-3.5 font-mono text-klein/70 text-[11px]">${l.pipelineLatencyMs || 0} ms</td>
              <td class="p-3.5 font-mono text-klein/60 text-[11px]">${new Date(l.createdAt || Date.now()).toLocaleString()}</td>
              <td class="p-3.5 text-right">
                <button onclick="TabAuditLogs.viewLogDetail('${encodeURIComponent(JSON.stringify(l))}')" class="p-1.5 hover:bg-klein/10 text-klein rounded" title="${t('audit.modalReportTitle')}">
                  <i class="fa-solid fa-magnifying-glass-chart"></i>
                </button>
                <button onclick="TabAuditLogs.deleteAuditLog('${l._id}')" class="p-1.5 hover:bg-rose-50 text-rose-600 rounded" title="${t('common.delete')}">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('[TabAuditLogs loadLogs Error]:', e);
    }
  }

  function viewLogDetail(encodedLog) {
    try {
      const l = JSON.parse(decodeURIComponent(encodedLog));
      AdminApp.showModal(`
        <div class="max-w-xl bg-white border-2 border-klein p-6 space-y-4 crosshair-corner">
          <div class="flex items-center justify-between border-b-2 border-klein pb-3">
            <h3 class="font-heading font-black text-lg text-klein uppercase">${t('audit.modalReportTitle')}</h3>
            <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
          </div>

          <div class="space-y-3 font-mono text-xs">
            <div><strong>${t('audit.thTarget')}：</strong> ${l.targetRole}</div>
            <div><strong>${t('audit.thOverall')}：</strong> <span class="font-bold text-emerald-600">${l.overallScore} pts (${l.grade})</span></div>
            <div><strong>${t('audit.modalSummary')}</strong></div>
            <div class="p-3 bg-slate-50 border border-klein/20 text-slate-800 text-[11px]">${l.auditSummary || t('common.none')}</div>

            <div class="grid grid-cols-2 gap-2 pt-2">
              <div>
                <span class="font-bold text-emerald-600 block">${t('audit.modalMatchedSkills')}</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  ${(l.matchedTechStack || []).map(tItem => `<span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">${tItem}</span>`).join('') || `<span class="text-gray-400">${t('common.none')}</span>`}
                </div>
              </div>
              <div>
                <span class="font-bold text-rose-600 block">${t('audit.modalMissingSkills')}</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  ${(l.missingTechStack || []).map(tItem => `<span class="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px]">${tItem}</span>`).join('') || `<span class="text-gray-400">${t('common.none')}</span>`}
                </div>
              </div>
            </div>
          </div>

          <div class="text-right pt-2 border-t border-klein/10">
            <button onclick="AdminApp.closeModal()" class="px-4 py-2 bg-klein text-white font-mono text-xs font-bold uppercase hover:bg-deep-klein">${t('common.close')}</button>
          </div>
        </div>
      `);
    } catch (e) {}
  }

  async function deleteAuditLog(id) {
    const res = await CareerDNA_DB.adminApiCall(`/api/admin/audit-logs/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res && res.status === 'ok') {
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '審查日誌已刪除' : 'Audit log deleted', 'success');
      loadAuditLogs();
    }
  }

  return {
    render,
    init,
    loadAuditLogs,
    viewLogDetail,
    deleteAuditLog
  };
})();
