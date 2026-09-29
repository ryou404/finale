/**
 * Admin Component: Header (Fully Localized)
 */
window.AdminHeader = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render(currentUser) {
    const user = currentUser || {};
    const name = user.name || user.displayName || user.username || 'Admin';
    const initial = name.charAt(0).toUpperCase();

    return `
      <header class="sticky top-0 z-40 bg-white border-b-2 border-klein shadow-sm">
        <div class="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <!-- Brand & HUD Telemetry -->
          <div class="flex items-center gap-2 sm:gap-4 shrink-0">
            <a href="index.html" class="flex items-center gap-1.5 sm:gap-2.5 group">
              <div class="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 bg-klein text-white items-center justify-center font-bold text-sm sm:text-base shadow-sm group-hover:bg-flame-orange transition-colors shrink-0">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div class="flex items-center gap-1 sm:gap-1.5">
                <span class="font-heading font-black text-xs sm:text-lg md:text-xl text-klein tracking-tight">CAREERDNA</span>
                <span class="bg-flame-orange text-white text-[8px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.2 sm:py-0.5 uppercase tracking-wider">ADMIN</span>
              </div>
            </a>

            <!-- Live Status Indicators -->
            <div class="hidden lg:flex items-center gap-3 pl-4 border-l border-klein/20 font-mono text-xs">
              <span class="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span id="header-db-status">${t('hud.atlas')}</span>
              </span>
              <span class="flex items-center gap-1.5 text-klein font-bold bg-klein/5 px-2 py-0.5 border border-klein/20">
                <i class="fa-solid fa-cloud"></i>
                <span id="header-r2-status">${t('hud.r2')}</span>
              </span>
            </div>
          </div>

          <!-- Right Controls: Language Switcher, Return to Main App, Admin Profile, Logout -->
          <div class="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
            <!-- Bilingual Toggle (EN / 繁中) -->
            <button id="lang-toggle-btn" class="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-klein text-klein hover:bg-klein hover:text-white font-mono text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 shadow-sm whitespace-nowrap shrink-0">
              <i class="fa-solid fa-language text-xs sm:text-sm"></i>
              <span id="lang-label">${AdminI18N.getLang() === 'zh' ? '繁中 / EN' : 'EN / 繁中'}</span>
            </button>

            <!-- Return to App Button -->
            <a href="index.html" class="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 border border-klein/30 text-klein hover:border-klein hover:bg-klein/5 font-mono text-xs font-bold transition-all whitespace-nowrap">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              <span>${t('nav.returnApp')}</span>
            </a>

            <!-- Admin User Info Badge -->
            <div id="admin-user-badge" class="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-klein/20 shrink-0">
              <div id="admin-avatar" class="w-7 h-7 sm:w-8 sm:h-8 bg-klein text-white font-bold text-xs sm:text-sm flex items-center justify-center border border-klein overflow-hidden shrink-0">
                ${user.photoURL ? `<img src="${user.photoURL}" class="w-full h-full object-cover">` : initial}
              </div>
              <div class="hidden md:block">
                <div id="admin-name" class="font-heading font-bold text-xs text-klein leading-tight max-w-[100px] truncate">${name}</div>
                <div class="font-mono text-[9px] text-flame-orange font-bold uppercase tracking-wider">SUPER ADMIN</div>
              </div>
            </div>

            <!-- Logout Button -->
            <button id="admin-logout-btn" class="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white font-mono text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 shrink-0" title="${t('nav.logout')}">
              <i class="fa-solid fa-power-off"></i>
              <span class="hidden md:inline">${t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  function init() {
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        AdminI18N.toggleLang();
        const currentLang = AdminI18N.getLang();
        AdminApp.showToast(currentLang === 'zh' ? '語言已切換為：繁體中文' : 'Language switched to: English', 'success');
      });
    }

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        CareerDNA_DB.logout();
        window.location.href = 'index.html';
      });
    }
  }

  return {
    render,
    init
  };
})();
