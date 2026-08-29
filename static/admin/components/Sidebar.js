/**
 * Admin Component: Sidebar Navigation (Fully Localized)
 */
window.AdminSidebar = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <aside class="w-full md:w-64 md:min-w-[16rem] flex-shrink-0">
        <div class="bg-white border-2 border-klein p-3 md:p-4 space-y-1 shadow-sm sticky top-24 crosshair-corner">
          <div class="px-3 py-2 text-[10px] font-mono font-bold text-klein/50 uppercase tracking-widest border-b border-klein/10 mb-2">
            <span>${t('sidebar.title')}</span>
          </div>

          <!-- Nav Items -->
          <button onclick="AdminApp.switchTab('dashboard')" id="nav-tab-dashboard" class="sidebar-tab-btn active w-full flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-klein bg-klein/10 border-l-4 border-klein transition-all">
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-chart-pie w-4 text-center"></i>
              <span>${t('tabs.dashboard')}</span>
            </span>
            <i class="fa-solid fa-chevron-right text-[10px] opacity-70"></i>
          </button>

          <button onclick="AdminApp.switchTab('users')" id="nav-tab-users" class="sidebar-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-users w-4 text-center"></i>
              <span>${t('tabs.users')}</span>
            </span>
            <span id="badge-users-count" class="bg-klein/10 text-klein px-1.5 py-0.2 font-mono text-[10px]">0</span>
          </button>

          <button onclick="AdminApp.switchTab('resources')" id="nav-tab-resources" class="sidebar-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-book-bookmark w-4 text-center"></i>
              <span>${t('tabs.resources')}</span>
            </span>
            <span id="badge-resources-count" class="bg-klein/10 text-klein px-1.5 py-0.2 font-mono text-[10px]">0</span>
          </button>

          <button onclick="AdminApp.switchTab('files')" id="nav-tab-files" class="sidebar-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-cloud-arrow-up w-4 text-center"></i>
              <span>${t('tabs.files')}</span>
            </span>
            <span class="bg-flame-orange/10 text-flame-orange font-bold px-1.5 py-0.2 font-mono text-[10px]">R2</span>
          </button>

          <button onclick="AdminApp.switchTab('professors')" id="nav-tab-professors" class="sidebar-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-chalkboard-user w-4 text-center"></i>
              <span>${t('tabs.professors')}</span>
            </span>
            <span id="badge-profs-count" class="bg-klein/10 text-klein px-1.5 py-0.2 font-mono text-[10px]">0</span>
          </button>

          <button onclick="AdminApp.switchTab('auditlogs')" id="nav-tab-auditlogs" class="sidebar-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-list-check w-4 text-center"></i>
              <span>${t('tabs.auditlogs')}</span>
            </span>
            <span id="badge-logs-count" class="bg-klein/10 text-klein px-1.5 py-0.2 font-mono text-[10px]">0</span>
          </button>

          <button onclick="AdminApp.switchTab('system')" id="nav-tab-system" class="sidebar-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5">
              <i class="fa-solid fa-server w-4 text-center"></i>
              <span>${t('tabs.system')}</span>
            </span>
            <i class="fa-solid fa-microchip text-[10px] text-klein/40"></i>
          </button>
        </div>
      </aside>
    `;
  }

  function updateActive(tabId) {
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.classList.remove('active', 'bg-klein/10', 'border-klein', 'text-klein');
      btn.classList.add('border-transparent', 'text-klein/70');
    });
    const activeBtn = document.getElementById(`nav-tab-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'bg-klein/10', 'border-klein', 'text-klein');
      activeBtn.classList.remove('border-transparent', 'text-klein/70');
    }
  }

  function updateBadges(metrics = {}) {
    const elUsers = document.getElementById('badge-users-count');
    const elRes = document.getElementById('badge-resources-count');
    const elProfs = document.getElementById('badge-profs-count');
    const elLogs = document.getElementById('badge-logs-count');

    if (elUsers) elUsers.innerText = metrics.totalUsers || 0;
    if (elRes) elRes.innerText = metrics.totalResources || 0;
    if (elProfs) elProfs.innerText = metrics.totalProfessors || 0;
    if (elLogs) elLogs.innerText = metrics.totalAuditLogs || 0;
  }

  return {
    render,
    updateActive,
    updateBadges
  };
})();
