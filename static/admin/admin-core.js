/**
 * CareerDNA Admin Dashboard Core Orchestrator
 * Component-Driven Architecture Controller with Reactive I18N
 */
window.AdminApp = (function () {
  let currentTab = 'dashboard';
  let currentUser = null;

  async function init() {
    console.log('[AdminApp] Initializing Cyber-Brutalist Component System...');
    currentUser = CareerDNA_DB.getCurrentUser();

    // Check if user is authenticated and has admin role
    if (!currentUser || currentUser.role !== 'admin') {
      console.warn('[AdminApp] Access Denied: User is not logged in as Admin');
      renderAccessDeniedLayout();
      return;
    }

    // Render Full Admin Shell Layout
    renderAdminShell();

    // Initialize sub-components
    bindComponents();

    // Apply I18n translation
    AdminI18N.applyI18n();

    // Load initial tab data
    switchTab(currentTab);
  }

  function bindComponents() {
    AdminHeader.init();
    AdminSidebar.updateActive(currentTab);
    TabUsers.init();
    TabResources.init();
    TabFiles.init();
    TabProfessors.init();
    TabAuditLogs.init();
  }

  function onLanguageChange() {
    console.log('[AdminApp] Live Language Change triggered, re-rendering UI in:', AdminI18N.getLang());
    if (!currentUser || currentUser.role !== 'admin') {
      renderAccessDeniedLayout();
      return;
    }

    const savedTab = currentTab;
    renderAdminShell();
    bindComponents();
    AdminI18N.applyI18n();
    switchTab(savedTab);
  }

  function renderAccessDeniedLayout() {
    const appRoot = document.getElementById('admin-app-root');
    if (!appRoot) return;

    appRoot.innerHTML = `
      <!-- Simplified Header -->
      <header class="bg-white border-b-2 border-klein shadow-sm">
        <div class="max-w-[1600px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <a href="index.html" class="flex items-center gap-2.5">
            <div class="w-8 h-8 bg-klein text-white flex items-center justify-center font-bold text-base shadow-sm">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <span class="font-heading font-black text-xl text-klein tracking-tight">
              CAREERDNA <span class="bg-flame-orange text-white text-[10px] font-mono px-1.5 py-0.5 uppercase">ADMIN</span>
            </span>
          </a>
          <div class="flex items-center gap-3">
            <button onclick="AdminI18N.toggleLang()" class="px-2.5 py-1.5 border border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all">
              <span>${AdminI18N.getLang() === 'zh' ? '繁中 / EN' : 'EN / 繁中'}</span>
            </button>
            <a href="index.html" class="text-xs font-mono font-bold text-klein hover:underline">
              <i class="fa-solid fa-house"></i> ${AdminI18N.t('access.btnHome')}
            </a>
          </div>
        </div>
      </header>

      <main class="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        ${AdminAccessDenied.render()}
      </main>

      <div id="modals-root"></div>
      <div id="toast-container" class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"></div>
    `;
  }

  function renderAdminShell() {
    const appRoot = document.getElementById('admin-app-root');
    if (!appRoot) return;

    appRoot.innerHTML = `
      <!-- Dynamic Header Component -->
      ${AdminHeader.render(currentUser)}

      <!-- Main Layout Container -->
      <main class="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex-1">
        <div class="flex flex-col md:flex-row gap-6 w-full items-start">
          <!-- Dynamic Sidebar Component -->
          ${AdminSidebar.render()}

          <!-- Tab Content Area -->
          <div class="flex-1 min-w-0 w-full space-y-6">
            ${TabDashboard.render()}
            ${TabUsers.render()}
            ${TabResources.render()}
            ${TabFiles.render()}
            ${TabProfessors.render()}
            ${TabAuditLogs.render()}
            ${TabSystem.render()}
          </div>
        </div>
      </main>

      <!-- Global Modals Root -->
      <div id="modals-root"></div>

      <!-- Global Toast Notifications Container -->
      <div id="toast-container" class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"></div>
    `;
  }

  function switchTab(tabId) {
    currentTab = tabId;
    AdminSidebar.updateActive(tabId);

    // Toggle panels visibility
    ['dashboard', 'users', 'resources', 'files', 'professors', 'auditlogs', 'system'].forEach(p => {
      const el = document.getElementById(`panel-${p}`);
      if (el) el.classList.toggle('hidden', p !== tabId);
    });

    // Trigger tab-specific data load
    switch (tabId) {
      case 'dashboard':
        TabDashboard.loadData();
        break;
      case 'users':
        TabUsers.loadUsers(1);
        break;
      case 'resources':
        TabResources.loadResources();
        break;
      case 'files':
        TabFiles.loadFiles();
        break;
      case 'professors':
        TabProfessors.loadProfessors();
        break;
      case 'auditlogs':
        TabAuditLogs.loadAuditLogs();
        break;
      case 'system':
        TabSystem.loadSystemStatus();
        break;
    }
  }

  function showModal(contentHtml) {
    const root = document.getElementById('modals-root');
    if (!root) return;

    root.innerHTML = `
      <div id="active-modal-backdrop" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm modal-animate overflow-y-auto">
        <div class="max-h-[92vh] overflow-y-auto w-full max-w-2xl flex justify-center">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  function closeModal() {
    const root = document.getElementById('modals-root');
    if (root) root.innerHTML = '';
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-klein text-white');
    const icon = type === 'success' ? 'fa-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-info');

    toast.className = `${bgClass} px-4 py-3 border-2 border-white shadow-2xl font-mono text-xs font-bold flex items-center gap-2.5 transition-all duration-300 pointer-events-auto crosshair-corner animate-in fade-in slide-in-from-bottom-2`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function copyUrl(url) {
    if (!url) return;
    let fullUrl = url;
    if (url.startsWith('/')) {
      fullUrl = window.location.origin + url;
    }
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast(AdminI18N.getLang() === 'zh' ? 'Public CDN 連結已複製至剪貼簿！' : 'Public CDN URL copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Copy failed', 'error');
    });
  }

  async function triggerReseed() {
    const confirmMsg = AdminI18N.getLang() === 'zh'
      ? '確認重新執行資料庫種子同步？這將更新預設資源與教授名錄。'
      : 'Confirm reseed database? This will refresh default resources and faculty.';
    if (!confirm(confirmMsg)) return;

    try {
      showToast(AdminI18N.getLang() === 'zh' ? '正在執行種子資料庫同步...' : 'Reseeding database...', 'info');
      const res = await CareerDNA_DB.adminApiCall('/api/admin/system/seed', {
        method: 'POST'
      });

      if (res && res.status === 'ok') {
        showToast(AdminI18N.getLang() === 'zh' ? '資料庫種子同步完成！' : 'Database reseeded successfully!', 'success');
        switchTab(currentTab);
      } else {
        showToast(res.message || 'Reseed failed', 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  return {
    init,
    onLanguageChange,
    switchTab,
    showModal,
    closeModal,
    showToast,
    copyUrl,
    triggerReseed
  };
})();

// Auto-boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
