/**
 * Admin Component: Sidebar Navigation (Fully Localized & Unified Aesthetic)
 */
window.AdminSidebar = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <aside class="w-full md:w-72 lg:w-80 md:min-w-[18rem] lg:min-w-[20rem] flex-shrink-0">
        <div class="bg-white border-2 border-klein p-3 sm:p-3.5 md:p-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 md:gap-1.5 shadow-sm md:sticky md:top-24 crosshair-corner">
          <!-- Section Title Header -->
          <div class="hidden md:flex items-center justify-between px-3.5 py-2.5 text-[10px] font-mono font-bold text-klein/60 uppercase tracking-widest border-b border-klein/15 mb-2">
            <span>${t('sidebar.title', {}, 'NAVIGATION')}</span>
            <i class="fa-solid fa-terminal text-[10px] text-klein/40"></i>
          </div>

          <!-- Nav Item: Dashboard -->
          <button onclick="AdminApp.switchTab('dashboard')" id="nav-tab-dashboard" class="sidebar-tab-btn active shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein bg-klein/10 border-b-2 md:border-b-0 md:border-l-4 border-klein transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-chart-pie w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.dashboard')}</span>
            </span>
            <i class="fa-solid fa-chevron-right text-[10px] opacity-70 hidden md:inline ml-2 flex-shrink-0"></i>
          </button>

          <!-- Nav Item: Users -->
          <button onclick="AdminApp.switchTab('users')" id="nav-tab-users" class="sidebar-tab-btn shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-b-2 md:border-b-0 md:border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-users w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.users')}</span>
            </span>
            <span id="badge-users-count" class="bg-klein/10 text-klein px-2 py-0.5 font-mono text-[10px] font-bold rounded-sm border border-klein/20 ml-2 shrink-0">0</span>
          </button>

          <!-- Nav Item: Resources -->
          <button onclick="AdminApp.switchTab('resources')" id="nav-tab-resources" class="sidebar-tab-btn shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-b-2 md:border-b-0 md:border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-book-bookmark w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.resources')}</span>
            </span>
            <span id="badge-resources-count" class="bg-klein/10 text-klein px-2 py-0.5 font-mono text-[10px] font-bold rounded-sm border border-klein/20 ml-2 shrink-0">0</span>
          </button>

          <!-- Nav Item: Files (Cloudflare R2) -->
          <button onclick="AdminApp.switchTab('files')" id="nav-tab-files" class="sidebar-tab-btn shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-b-2 md:border-b-0 md:border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-cloud-arrow-up w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.files')}</span>
            </span>
            <span class="bg-klein/10 text-klein font-bold px-2 py-0.5 font-mono text-[10px] rounded-sm border border-klein/20 ml-2 shrink-0">R2</span>
          </button>

          <!-- Nav Item: RAG Knowledge Base -->
          <button onclick="AdminApp.switchTab('rag')" id="nav-tab-rag" class="sidebar-tab-btn shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-b-2 md:border-b-0 md:border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-brain w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.rag', null, 'RAG 向量知識庫')}</span>
            </span>
            <span id="badge-rag-count" class="bg-klein/10 text-klein font-bold px-2 py-0.5 font-mono text-[10px] rounded-sm border border-klein/20 ml-2 shrink-0">RAG</span>
          </button>

          <!-- Nav Item: Professors & Labs -->
          <button onclick="AdminApp.switchTab('professors')" id="nav-tab-professors" class="sidebar-tab-btn shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-b-2 md:border-b-0 md:border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-chalkboard-user w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.professors')}</span>
            </span>
            <span id="badge-profs-count" class="bg-klein/10 text-klein px-2 py-0.5 font-mono text-[10px] font-bold rounded-sm border border-klein/20 ml-2 shrink-0">0</span>
          </button>

          <!-- Nav Item: Audit Logs -->
          <button onclick="AdminApp.switchTab('auditlogs')" id="nav-tab-auditlogs" class="sidebar-tab-btn shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-b-2 md:border-b-0 md:border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-list-check w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.auditlogs')}</span>
            </span>
            <span id="badge-logs-count" class="bg-klein/10 text-klein px-2 py-0.5 font-mono text-[10px] font-bold rounded-sm border border-klein/20 ml-2 shrink-0">0</span>
          </button>

          <!-- Nav Item: System Diagnostics -->
          <button onclick="AdminApp.switchTab('system')" id="nav-tab-system" class="sidebar-tab-btn shrink-0 md:w-full flex items-center justify-between px-3.5 md:px-4 py-2.5 md:py-3 font-mono text-xs font-bold uppercase tracking-wider text-klein/70 hover:text-klein hover:bg-klein/5 border-b-2 md:border-b-0 md:border-l-4 border-transparent transition-all">
            <span class="flex items-center gap-2.5 md:gap-3 min-w-0">
              <i class="fa-solid fa-server w-5 text-center text-sm flex-shrink-0"></i>
              <span class="truncate">${t('tabs.system')}</span>
            </span>
            <i class="fa-solid fa-microchip text-[10px] opacity-60 hidden md:inline ml-2 flex-shrink-0"></i>
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
    const elRag = document.getElementById('badge-rag-count');

    if (elUsers && metrics.totalUsers !== undefined) elUsers.innerText = metrics.totalUsers;
    if (elRes && metrics.totalResources !== undefined) elRes.innerText = metrics.totalResources;
    if (elProfs && metrics.totalProfessors !== undefined) elProfs.innerText = metrics.totalProfessors;
    if (elLogs && metrics.totalAuditLogs !== undefined) elLogs.innerText = metrics.totalAuditLogs;
    if (elRag && metrics.totalRagDocs !== undefined) elRag.innerText = metrics.totalRagDocs;
  }

  return {
    render,
    updateActive,
    updateBadges
  };
})();
