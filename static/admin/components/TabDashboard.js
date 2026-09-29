/**
 * Admin Component: TabDashboard (Fully Localized)
 */
window.TabDashboard = (function () {
  let charts = {};
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <section id="panel-dashboard" class="w-full space-y-6">
        <!-- HUD KPI Cards Grid (6 Metric Cards) -->
        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 md:gap-4">
          <!-- Total Users -->
          <div class="bg-white border-2 border-klein p-4 relative overflow-hidden shadow-sm crosshair-corner">
            <div class="font-mono text-[11px] text-klein/70 uppercase tracking-wider">${t('dash.totalUsers')}</div>
            <div id="stat-total-users" class="font-heading font-black text-2xl md:text-3xl text-klein mt-1">--</div>
            <div class="font-mono text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-bold">
              <i class="fa-solid fa-user-check"></i> <span id="stat-active-users">--</span> <span>${t('dash.active')}</span>
            </div>
          </div>

          <!-- Admins Count -->
          <div class="bg-white border-2 border-flame-orange p-4 relative overflow-hidden shadow-sm crosshair-corner">
            <div class="font-mono text-[11px] text-flame-orange uppercase tracking-wider font-bold">${t('dash.adminCount')}</div>
            <div id="stat-admin-count" class="font-heading font-black text-2xl md:text-3xl text-flame-orange mt-1">--</div>
            <div class="font-mono text-[10px] text-flame-orange/80 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-shield-halved"></i> <span>SUPER_ROLES</span>
            </div>
          </div>

          <!-- Resources Count -->
          <div class="bg-white border-2 border-klein p-4 relative overflow-hidden shadow-sm crosshair-corner">
            <div class="font-mono text-[11px] text-klein/70 uppercase tracking-wider">${t('dash.totalResources')}</div>
            <div id="stat-total-resources" class="font-heading font-black text-2xl md:text-3xl text-klein mt-1">--</div>
            <div class="font-mono text-[10px] text-blue-600 mt-1 flex items-center gap-1 font-bold">
              <i class="fa-solid fa-database"></i> <span>MongoDB Atlas</span>
            </div>
          </div>

          <!-- Stored Files on R2 -->
          <div class="bg-white border-2 border-klein p-4 relative overflow-hidden shadow-sm crosshair-corner">
            <div class="font-mono text-[11px] text-klein/70 uppercase tracking-wider">${t('dash.totalFiles')}</div>
            <div id="stat-total-files" class="font-heading font-black text-2xl md:text-3xl text-klein mt-1">--</div>
            <div class="font-mono text-[10px] text-cyan-600 mt-1 flex items-center gap-1 font-bold">
              <i class="fa-solid fa-cloud"></i> <span>Cloudflare R2</span>
            </div>
          </div>

          <!-- ATS Audits -->
          <div class="bg-white border-2 border-klein p-4 relative overflow-hidden shadow-sm crosshair-corner">
            <div class="font-mono text-[11px] text-klein/70 uppercase tracking-wider">${t('dash.totalAudits')}</div>
            <div id="stat-total-audits" class="font-heading font-black text-2xl md:text-3xl text-klein mt-1">--</div>
            <div class="font-mono text-[10px] text-indigo-600 mt-1 flex items-center gap-1 font-bold">
              <i class="fa-solid fa-bolt"></i> <span>DeepSeek AI</span>
            </div>
          </div>

          <!-- ATS Avg Score -->
          <div class="bg-white border-2 border-klein p-4 relative overflow-hidden shadow-sm crosshair-corner">
            <div class="font-mono text-[11px] text-klein/70 uppercase tracking-wider">${t('dash.avgAtsScore')}</div>
            <div id="stat-avg-score" class="font-heading font-black text-2xl md:text-3xl text-klein mt-1">--</div>
            <div class="font-mono text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-bold">
              <i class="fa-solid fa-star"></i> <span>Golden Triangle</span>
            </div>
          </div>
        </div>

        <!-- Quick Action Bar -->
        <div class="bg-white border-2 border-klein p-4 flex flex-wrap items-center justify-between gap-3 crosshair-corner shadow-sm">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-flame-orange"></span>
            <span class="font-heading font-bold text-sm text-klein uppercase tracking-wider">${t('dash.quickActions')}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="TabUsers.openAddUserModal()" class="btn-cyber px-3 py-1.5 bg-klein hover:bg-deep-klein text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-user-plus"></i> <span>${t('users.addUser')}</span>
            </button>
            <button onclick="TabResources.openAddResourceModal()" class="btn-cyber px-3 py-1.5 bg-klein hover:bg-deep-klein text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-plus"></i> <span>${t('res.addResource')}</span>
            </button>
            <button onclick="TabFiles.openUploadFileModal()" class="btn-cyber px-3 py-1.5 bg-flame-orange hover:bg-orange-600 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-cloud-arrow-up"></i> <span>${t('files.uploadDirect')}</span>
            </button>
            <button onclick="AdminApp.triggerReseed()" class="btn-cyber px-3 py-1.5 bg-white border border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5">
              <i class="fa-solid fa-arrows-rotate"></i> <span>${t('dash.reseed')}</span>
            </button>
          </div>
        </div>

        <!-- Distribution Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Department Breakdown -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3 border-b border-klein/10 pb-2">
                <h4 class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-building-columns"></i>
                  <span>${t('dash.deptDist')}</span>
                </h4>
                <span class="font-mono text-[10px] text-klein/50">PROVIDENCE CS/IM/AI</span>
              </div>
              <div class="h-44 flex items-center justify-center">
                <canvas id="chart-dept"></canvas>
              </div>
            </div>
            <div id="dept-legend" class="grid grid-cols-3 gap-2 text-center font-mono text-xs mt-3 pt-3 border-t border-klein/10"></div>
          </div>

          <!-- Grade Breakdown -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3 border-b border-klein/10 pb-2">
                <h4 class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-graduation-cap"></i>
                  <span>${t('dash.gradeDist')}</span>
                </h4>
                <span class="font-mono text-[10px] text-klein/50">GRADE LEVELS</span>
              </div>
              <div class="h-44 flex items-center justify-center">
                <canvas id="chart-grade"></canvas>
              </div>
            </div>
            <div id="grade-legend" class="flex justify-around font-mono text-xs mt-3 pt-3 border-t border-klein/10"></div>
          </div>

          <!-- Resource Categories Breakdown -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3 border-b border-klein/10 pb-2">
                <h4 class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-folder-tree"></i>
                  <span>${t('dash.catDist')}</span>
                </h4>
                <span class="font-mono text-[10px] text-klein/50">CATEGORIES</span>
              </div>
              <div class="h-44 flex items-center justify-center">
                <canvas id="chart-categories"></canvas>
              </div>
            </div>
            <div id="category-legend" class="flex flex-wrap justify-center gap-3 font-mono text-xs mt-3 pt-3 border-t border-klein/10"></div>
          </div>
        </div>

        <!-- Recent Activities Table -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Users -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner">
            <div class="flex items-center justify-between mb-3 border-b border-klein/10 pb-2">
              <h4 class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-user-clock"></i>
                <span>${t('dash.recentUsers')}</span>
              </h4>
              <button onclick="AdminApp.switchTab('users')" class="font-mono text-xs text-klein hover:underline">${t('common.viewAll')} &rarr;</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="border-b border-klein/20 text-klein/60">
                    <th class="py-2">${t('dash.thUser')}</th>
                    <th class="py-2">${t('dash.thDept')}</th>
                    <th class="py-2">${t('dash.thRole')}</th>
                    <th class="py-2">${t('dash.thTime')}</th>
                  </tr>
                </thead>
                <tbody id="recent-users-tbody" class="divide-y divide-klein/10">
                  <tr><td colspan="4" class="py-4 text-center text-klein/40">${t('common.loading')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent ATS Logs -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner">
            <div class="flex items-center justify-between mb-3 border-b border-klein/10 pb-2">
              <h4 class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>${t('dash.recentAudits')}</span>
              </h4>
              <button onclick="AdminApp.switchTab('auditlogs')" class="font-mono text-xs text-klein hover:underline">${t('common.viewAll')} &rarr;</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="border-b border-klein/20 text-klein/60">
                    <th class="py-2">${t('dash.thRoleTarget')}</th>
                    <th class="py-2">${t('dash.thScore')}</th>
                    <th class="py-2">${t('dash.thLatency')}</th>
                    <th class="py-2">${t('dash.thAuditTime')}</th>
                  </tr>
                </thead>
                <tbody id="recent-logs-tbody" class="divide-y divide-klein/10">
                  <tr><td colspan="4" class="py-4 text-center text-klein/40">${t('common.loading')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadData() {
    try {
      const res = await CareerDNA_DB.adminApiCall('/api/admin/dashboard');
      if (res && res.status === 'ok') {
        const m = res.metrics || {};
        const elTotalUsers = document.getElementById('stat-total-users');
        const elActiveUsers = document.getElementById('stat-active-users');
        const elAdminCount = document.getElementById('stat-admin-count');
        const elTotalRes = document.getElementById('stat-total-resources');
        const elTotalFiles = document.getElementById('stat-total-files');
        const elTotalAudits = document.getElementById('stat-total-audits');
        const elAvgScore = document.getElementById('stat-avg-score');

        if (elTotalUsers) elTotalUsers.innerText = m.totalUsers || 0;
        if (elActiveUsers) elActiveUsers.innerText = m.activeUsers || 0;
        if (elAdminCount) elAdminCount.innerText = m.adminCount || 0;
        if (elTotalRes) elTotalRes.innerText = m.totalResources || 0;
        if (elTotalFiles) elTotalFiles.innerText = m.totalUploadedFiles || 0;
        if (elTotalAudits) elTotalAudits.innerText = m.totalAuditLogs || 0;
        if (elAvgScore) elAvgScore.innerText = (m.avgAtsScore || 0) + (AdminI18N.getLang() === 'zh' ? ' 分' : ' pts');

        // Update sidebar badges
        AdminSidebar.updateBadges(m);

        // Render Charts
        renderDeptChart(res.distributions?.departments || []);
        renderGradeChart(res.distributions?.grades || []);
        renderCategoryChart(res.distributions?.categories || []);

        // Render Recent Users
        const usersTbody = document.getElementById('recent-users-tbody');
        if (usersTbody) {
          if (!res.recentUsers || res.recentUsers.length === 0) {
            usersTbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-klein/40">${t('dash.noUsers')}</td></tr>`;
          } else {
            usersTbody.innerHTML = res.recentUsers.map(u => `
              <tr class="hover:bg-klein/5 transition-colors">
                <td class="py-2.5 flex items-center gap-2">
                  <div class="w-6 h-6 bg-klein text-white text-[10px] font-bold flex items-center justify-center">
                    ${(u.name || u.username || 'U').charAt(0)}
                  </div>
                  <div>
                    <span class="font-bold text-klein block">${u.name || u.username}</span>
                    <span class="text-[10px] text-klein/50">${u.email || u.uid}</span>
                  </div>
                </td>
                <td class="py-2.5 font-bold">${u.department || 'IM'} · ${u.grade || '大三'}</td>
                <td class="py-2.5">
                  <span class="px-1.5 py-0.5 text-[10px] font-bold ${u.role === 'admin' ? 'bg-flame-orange text-white' : 'bg-klein/10 text-klein'}">
                    ${u.role === 'admin' ? 'ADMIN' : 'USER'}
                  </span>
                </td>
                <td class="py-2.5 text-klein/60 text-[10px]">${new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
              </tr>
            `).join('');
          }
        }

        // Render Recent Logs
        const logsTbody = document.getElementById('recent-logs-tbody');
        if (logsTbody) {
          if (!res.recentLogs || res.recentLogs.length === 0) {
            logsTbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-klein/40">${t('dash.noAudits')}</td></tr>`;
          } else {
            logsTbody.innerHTML = res.recentLogs.map(l => `
              <tr class="hover:bg-klein/5 transition-colors">
                <td class="py-2.5 font-bold text-klein">${l.targetRole || 'Software Engineer'}</td>
                <td class="py-2.5">
                  <span class="px-1.5 py-0.5 text-[10px] font-bold ${l.overallScore >= 80 ? 'bg-emerald-100 text-emerald-800' : (l.overallScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}">
                    ${l.overallScore} pts (${l.grade || 'B'})
                  </span>
                </td>
                <td class="py-2.5 text-klein/60">${l.pipelineLatencyMs || 0}ms</td>
                <td class="py-2.5 text-klein/60 text-[10px]">${new Date(l.createdAt || Date.now()).toLocaleDateString()}</td>
              </tr>
            `).join('');
          }
        }
      }
    } catch (e) {
      console.error('[TabDashboard loadData Error]:', e);
    }
  }

  function renderDeptChart(data) {
    const ctx = document.getElementById('chart-dept');
    if (!ctx) return;
    if (charts.dept) charts.dept.destroy();

    const labels = data.map(d => d.dept);
    const counts = data.map(d => d.count);
    const colors = ['#002fa7', '#00e5ff', '#ff4500', '#10b981', '#8b5cf6'];

    charts.dept = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: counts.length ? counts : [1],
          backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '68%'
      }
    });

    const legendEl = document.getElementById('dept-legend');
    if (legendEl) {
      legendEl.innerHTML = data.map((d, i) => `
        <div class="flex flex-col items-center">
          <span class="font-bold text-klein">${d.dept}</span>
          <span class="text-[10px] text-klein/60">${d.count}</span>
        </div>
      `).join('');
    }
  }

  function renderGradeChart(data) {
    const ctx = document.getElementById('chart-grade');
    if (!ctx) return;
    if (charts.grade) charts.grade.destroy();

    const labels = data.map(d => d.grade);
    const counts = data.map(d => d.count);

    charts.grade = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: counts.length ? counts : [0],
          backgroundColor: '#002fa7',
          borderColor: '#001a5e',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'monospace' } } },
          x: { grid: { display: false }, ticks: { font: { family: 'monospace', size: 10 } } }
        }
      }
    });

    const legendEl = document.getElementById('grade-legend');
    if (legendEl) {
      legendEl.innerHTML = data.map(d => `
        <div class="text-center">
          <span class="font-bold text-klein">${d.grade}</span>
          <span class="text-[10px] text-klein/60 block">${d.count}</span>
        </div>
      `).join('');
    }
  }

  function renderCategoryChart(data) {
    const ctx = document.getElementById('chart-categories');
    if (!ctx) return;
    if (charts.categories) charts.categories.destroy();

    const labels = data.map(d => d.category);
    const counts = data.map(d => d.count);
    const colors = ['#002fa7', '#10b981', '#8b5cf6', '#f59e0b', '#64748b'];

    charts.categories = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: counts.length ? counts : [1],
          backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });

    const legendEl = document.getElementById('category-legend');
    if (legendEl) {
      legendEl.innerHTML = data.map((d, i) => `
        <div class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full" style="background:${colors[i % colors.length]}"></span>
          <span class="text-klein">${d.category} (${d.count})</span>
        </div>
      `).join('');
    }
  }

  return {
    render,
    loadData
  };
})();
