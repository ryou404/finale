/**
 * CareerDNA MongoDB Atlas Client Adapter & Auth Manager
 * Universal frontend bridge for syncing User Profiles, Holland Test Results,
 * ATS Resume Audits, and Lab Recommendations to MongoDB Atlas.
 * Includes Email OTP Verification on Register & Forgot Password functionality via Gmail SMTP.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CareerDNA_DB = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const STORAGE_KEYS = {
    UID: 'cdna_uid',
    USER: 'careerDNA_user',
    NAME: 'cdna_username',
    SCHOOL: 'cdna_school',
    DEPT: 'cdna_department',
    GRADE: 'cdna_grade'
  };

  // Auto-generate or retrieve a stable guest UID for unauthenticated users
  function getOrCreateGuestUid() {
    let guestUid = localStorage.getItem(STORAGE_KEYS.UID);
    if (!guestUid) {
      guestUid = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEYS.UID, guestUid);
    }
    return guestUid;
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function refreshNavbar() {
    if (typeof document === 'undefined') return;
    const user = getCurrentUser();
    const loginBtn = document.getElementById('nav-login-btn');
    const userInfo = document.getElementById('nav-user-info');
    const userName = document.getElementById('nav-user-name');
    const userAvatar = document.getElementById('nav-user-avatar');

    // Handle Admin Link Button - STRICT ADMIN ACCESS CONTROL ONLY
    const adminBtns = document.querySelectorAll('#dynamic-nav-admin-btn, #static-nav-admin-btn, .nav-admin-btn');
    if (user && user.role === 'admin') {
      adminBtns.forEach(btn => btn.classList.remove('hidden'));
      if (adminBtns.length === 0 && userInfo && userInfo.parentNode) {
        const newBtn = document.createElement('a');
        newBtn.id = 'dynamic-nav-admin-btn';
        newBtn.href = 'admin.html';
        newBtn.className = 'nav-admin-btn px-3 py-1.5 bg-flame-orange hover:bg-orange-600 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm mr-2 cursor-pointer shrink-0';
        newBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> <span>管理後台</span>';
        userInfo.parentNode.insertBefore(newBtn, userInfo);
      }
    } else {
      // Strictly hide from guests and normal users
      adminBtns.forEach(btn => btn.classList.add('hidden'));
    }

    if (user && (user.name || user.username || user.email)) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (userInfo) {
        userInfo.classList.remove('hidden');
        userInfo.className = 'relative group flex items-center gap-3 cursor-pointer py-1.5';
      }
      
      const name = user.name || user.displayName || user.username || '用戶';
      const email = user.email || user.username || '';
      const dept = user.department || user.dept || localStorage.getItem('cdna_department') || '靜宜大學';
      const grade = user.grade || localStorage.getItem('cdna_grade') || '大學部';
      const roleName = user.role === 'admin' ? 'SUPER ADMIN' : 'STUDENT';
      const initial = name.charAt(0).toUpperCase();

      if (userName) userName.innerText = name;
      if (userAvatar) {
        if (user.photoURL) {
          userAvatar.innerHTML = `<img src="${user.photoURL}" alt="avatar" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='${initial}'">`;
          userAvatar.className = 'w-9 h-9 overflow-hidden border border-klein flex items-center justify-center bg-white shadow-sm shrink-0';
        } else {
          userAvatar.innerText = initial;
          userAvatar.className = 'w-9 h-9 bg-klein text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0';
        }
      }

      // Injected User Hover Profile Dropdown (with seamless hover bridge)
      let dropdown = document.getElementById('nav-user-dropdown-menu');
      if (!dropdown && userInfo) {
        dropdown = document.createElement('div');
        dropdown.id = 'nav-user-dropdown-menu';
        dropdown.className = 'absolute right-0 top-full pt-1 w-72 z-50 transition-all duration-150 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto';
        userInfo.appendChild(dropdown);
      }

      if (dropdown) {
        dropdown.innerHTML = `
          <!-- Seamless Invisible Hover Bridge -->
          <div class="bg-white border-2 border-klein shadow-2xl p-4 crosshair-corner relative">
            <!-- Header Profile Summary -->
            <div class="flex items-center gap-3 pb-3 mb-3 border-b border-klein/15">
              <div class="w-12 h-12 bg-klein text-white flex items-center justify-center font-bold text-lg border border-klein overflow-hidden shrink-0 shadow-sm">
                ${user.photoURL ? `<img src="${user.photoURL}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='${initial}'">` : initial}
              </div>
              <div class="min-w-0 flex-1 text-left">
                <div class="font-heading font-black text-sm text-klein truncate leading-tight">${name}</div>
                <div class="font-mono text-[10px] text-klein/60 truncate mt-0.5">${email}</div>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-flame-orange text-white' : 'bg-klein/10 text-klein'}">${roleName}</span>
                  <span class="font-mono text-[10px] text-klein/50 truncate">${dept} · ${grade}</span>
                </div>
              </div>
            </div>

            <!-- Quick Navigation Links -->
            <div class="space-y-1 font-mono text-xs font-bold text-left">
              <a href="profile.html" class="flex items-center justify-between p-2 hover:bg-klein/5 text-klein border border-transparent hover:border-klein/20 transition-all group/item">
                <span class="flex items-center gap-2">
                  <i class="fa-solid fa-user text-klein/60 group-hover/item:text-klein"></i>
                  <span>查看個人檔案與資料</span>
                </span>
                <i class="fa-solid fa-chevron-right text-[10px] text-klein/30 group-hover/item:translate-x-0.5 transition-transform"></i>
              </a>
              <a href="career_fit_v2.html" class="flex items-center justify-between p-2 hover:bg-klein/5 text-klein border border-transparent hover:border-klein/20 transition-all group/item">
                <span class="flex items-center gap-2">
                  <i class="fa-solid fa-wand-magic-sparkles text-klein/60 group-hover/item:text-klein"></i>
                  <span>AI 履歷診斷與健檢</span>
                </span>
                <i class="fa-solid fa-chevron-right text-[10px] text-klein/30 group-hover/item:translate-x-0.5 transition-transform"></i>
              </a>
              <a href="resource_library.html" class="flex items-center justify-between p-2 hover:bg-klein/5 text-klein border border-transparent hover:border-klein/20 transition-all group/item">
                <span class="flex items-center gap-2">
                  <i class="fa-solid fa-book-bookmark text-klein/60 group-hover/item:text-klein"></i>
                  <span>學習資源資料庫</span>
                </span>
                <i class="fa-solid fa-chevron-right text-[10px] text-klein/30 group-hover/item:translate-x-0.5 transition-transform"></i>
              </a>
              ${user.role === 'admin' ? `
                <a href="admin.html" class="flex items-center justify-between p-2 bg-flame-orange/10 hover:bg-flame-orange hover:text-white text-flame-orange border border-flame-orange/20 transition-all group/item">
                  <span class="flex items-center gap-2">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span>進入系統管理後台</span>
                  </span>
                  <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </a>
              ` : ''}
            </div>

            <!-- Logout Action Button -->
            <div class="pt-3 mt-3 border-t border-klein/15">
              <button onclick="window.CareerDNA_DB.logout(); window.location.reload();" class="w-full py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                <i class="fa-solid fa-power-off text-xs"></i>
                <span>登出系統 (LOGOUT)</span>
              </button>
            </div>
          </div>
        `;
      }
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (userInfo) userInfo.classList.add('hidden');
    }
  }

  function setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      refreshNavbar();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    const effectiveUid = user.uid || user._id || getOrCreateGuestUid();
    localStorage.setItem(STORAGE_KEYS.UID, effectiveUid);
    if (user.name || user.displayName) localStorage.setItem(STORAGE_KEYS.NAME, user.name || user.displayName);
    if (user.school) localStorage.setItem(STORAGE_KEYS.SCHOOL, user.school);
    if (user.department || user.dept) localStorage.setItem(STORAGE_KEYS.DEPT, user.department || user.dept);
    if (user.grade) localStorage.setItem(STORAGE_KEYS.GRADE, user.grade);
    refreshNavbar();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', refreshNavbar);
    } else {
      setTimeout(refreshNavbar, 50);
    }
  }

  function getEffectiveUid(user) {
    if (user && (user.uid || user._id)) {
      const uid = user.uid || user._id;
      localStorage.setItem(STORAGE_KEYS.UID, uid);
      return uid;
    }
    const savedUser = getCurrentUser();
    if (savedUser && (savedUser.uid || savedUser._id)) {
      return savedUser.uid || savedUser._id;
    }
    return getOrCreateGuestUid();
  }

  async function apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      let data;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { status: response.ok ? 'ok' : 'error', message: text || `HTTP ${response.status}` };
        }
      }

      if (!response.ok) {
        if (!data || typeof data !== 'object') {
          data = { status: 'error', message: `伺服器回應錯誤 (${response.status})` };
        } else if (!data.status) {
          data.status = 'error';
        }
      }

      return data;
    } catch (err) {
      console.error(`[CareerDNA DB API Error on ${endpoint}]:`, err);
      return { status: 'error', message: err.message };
    }
  }

  // Inject In-Page Auth Modal (with Register Email OTP & Forgot Password)
  function createAuthModal(onSuccessCallback) {
    const existingModal = document.getElementById('cdna-auth-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'cdna-auth-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300';
    
    modal.innerHTML = `
      <div class="relative w-full max-w-xl md:max-w-2xl bg-white border-2 border-klein shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-200 crosshair-corner">
        <!-- Close Button -->
        <button id="cdna-modal-close" class="absolute top-5 right-5 text-klein/50 hover:text-klein hover:bg-klein/5 w-8 h-8 flex items-center justify-center text-xl font-bold transition-all">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- Brand Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-2 bg-klein text-white text-xs font-mono font-bold px-3.5 py-1.5 uppercase tracking-widest mb-2.5">
            <i class="fa-solid fa-shield-halved"></i> MongoDB Atlas & Gmail OTP Auth
          </div>
          <h3 id="auth-main-title" class="font-heading font-black text-2xl md:text-3xl text-klein uppercase tracking-tight">登入 / 切換帳戶</h3>
          <p id="auth-main-subtitle" class="font-mono text-xs md:text-sm text-klein/60 mt-1">雲端資料庫直連 · 支援 Email 驗證碼安全保護</p>
        </div>

        <!-- Navigation Tabs -->
        <div id="auth-tabs-nav" class="flex border-b border-klein/20 mb-6 gap-2">
          <button id="tab-btn-login" class="flex-1 py-3 font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein border-b-2 border-klein transition-all flex items-center justify-center gap-2">
            <i class="fa-solid fa-right-to-bracket"></i> 帳號登入
          </button>
          <button id="tab-btn-reg" class="flex-1 py-3 font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein/50 hover:text-klein border-b-2 border-transparent transition-all flex items-center justify-center gap-2">
            <i class="fa-solid fa-user-plus"></i> 快速註冊
          </button>
          <button id="tab-btn-quick" class="flex-1 py-3 font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein/50 hover:text-klein border-b-2 border-transparent transition-all flex items-center justify-center gap-2">
            <i class="fa-solid fa-users"></i> 現有帳戶
          </button>
        </div>

        <!-- ================= 1. Direct Login Panel ================= -->
        <div id="auth-panel-login" class="space-y-4">
          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1.5">Email 或 使用者名稱</label>
            <input id="auth-input-id" type="text" placeholder="例如：thienper 或 user@example.com" class="w-full p-3.5 bg-white border border-klein/30 focus:border-klein text-klein text-sm md:text-base font-mono focus:outline-none transition-colors" />
          </div>
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein">密碼 (Password)</label>
              <button type="button" id="auth-link-forgot" class="text-xs font-mono font-bold text-klein/70 hover:text-klein underline">忘記密碼？</button>
            </div>
            <div class="relative">
              <input id="auth-input-password" type="password" placeholder="請輸入登入密碼" class="w-full p-3.5 pr-10 bg-white border border-klein/30 focus:border-klein text-klein text-sm md:text-base font-mono focus:outline-none transition-colors" />
              <button type="button" id="auth-toggle-pwd-login" class="absolute right-3 top-1/2 -translate-y-1/2 text-klein/40 hover:text-klein text-sm">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>
          <button id="auth-btn-submit-login" class="w-full py-4 bg-klein hover:bg-deep-klein text-white font-heading font-bold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
            <i class="fa-solid fa-right-to-bracket"></i> 驗證密碼並登入
          </button>
        </div>

        <!-- ================= 2. Register Panel (Step 1: Info) ================= -->
        <div id="auth-panel-reg-step1" class="hidden space-y-3.5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">姓名 / 暱稱 <span class="text-flame-orange">*</span></label>
              <input id="auth-reg-name" type="text" placeholder="例如：黃小明" class="w-full p-3 bg-white border border-klein/30 text-klein text-sm font-mono focus:border-klein focus:outline-none" />
            </div>
            <div>
              <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">帳號名稱 (Username) <span class="text-flame-orange">*</span></label>
              <input id="auth-reg-username" type="text" placeholder="例如：pu_student01" class="w-full p-3 bg-white border border-klein/30 text-klein text-sm font-mono focus:border-klein focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">電子信箱 (Email 用於接收驗證碼) <span class="text-flame-orange">*</span></label>
            <input id="auth-reg-email" type="email" placeholder="your_email@gmail.com" class="w-full p-3 bg-white border border-klein/30 text-klein text-sm font-mono focus:border-klein focus:outline-none" />
          </div>

          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">設定登入密碼 (至少 4 位數) <span class="text-flame-orange">*</span></label>
            <div class="relative">
              <input id="auth-reg-password" type="password" placeholder="請設定您的密碼" class="w-full p-3 pr-10 bg-white border border-klein/30 text-klein text-sm font-mono focus:border-klein focus:outline-none" />
              <button type="button" id="auth-toggle-pwd-reg" class="absolute right-3 top-1/2 -translate-y-1/2 text-klein/40 hover:text-klein text-sm">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">就讀系所</label>
              <select id="auth-reg-dept" class="w-full p-3 bg-white border border-klein/30 text-klein text-xs md:text-sm font-mono cursor-pointer focus:border-klein focus:outline-none">
                <option value="IM">資訊管理學系 (IM)</option>
                <option value="CS">資訊工程學系 (CS)</option>
                <option value="AI">人工智慧學系 (AI)</option>
              </select>
            </div>
            <div>
              <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">年級</label>
              <select id="auth-reg-grade" class="w-full p-3 bg-white border border-klein/30 text-klein text-xs md:text-sm font-mono cursor-pointer focus:border-klein focus:outline-none">
                <option value="大三">大三</option>
                <option value="大四">大四</option>
                <option value="大二">大二</option>
                <option value="大一">大一</option>
              </select>
            </div>
          </div>

          <button id="auth-btn-send-reg-otp" class="w-full py-4 bg-klein hover:bg-deep-klein text-white font-heading font-bold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
            <i class="fa-solid fa-paper-plane"></i> 發送 Email 驗證碼
          </button>
        </div>

        <!-- ================= 2.1 Register Panel (Step 2: OTP Verification) ================= -->
        <div id="auth-panel-reg-step2" class="hidden space-y-4 text-center">
          <div class="p-4 bg-klein/5 border border-klein/20">
            <i class="fa-solid fa-envelope-circle-check text-2xl text-klein mb-2"></i>
            <p class="font-heading font-bold text-sm text-klein">驗證碼已發送至您的 Email</p>
            <p id="auth-reg-otp-email-display" class="font-mono text-xs text-klein/70 mt-1"></p>
            <p class="font-mono text-[11px] text-klein/50 mt-1">（有效期限 10 分鐘，請檢查收件匣或垃圾郵件）</p>
          </div>

          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-2">請輸入 6 位數 OTP 驗證碼</label>
            <input id="auth-reg-otp-code" type="text" maxlength="6" placeholder="例如：123456" class="w-full p-4 bg-white border-2 border-klein text-center font-mono text-2xl font-bold tracking-[8px] text-klein focus:outline-none" />
          </div>

          <button id="auth-btn-verify-reg-otp" class="w-full py-4 bg-klein hover:bg-deep-klein text-white font-heading font-bold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
            <i class="fa-solid fa-check-double"></i> 驗證並完成註冊
          </button>

          <div class="flex items-center justify-between text-xs font-mono pt-2">
            <button type="button" id="auth-btn-back-reg-step1" class="text-klein/60 hover:text-klein underline">
              <i class="fa-solid fa-arrow-left"></i> 返回修改資料
            </button>
            <button type="button" id="auth-btn-resend-reg-otp" class="text-klein font-bold hover:underline">
              重新發送驗證碼 (<span id="auth-reg-countdown">60</span>s)
            </button>
          </div>
        </div>

        <!-- ================= 3. Forgot Password Panel (Step 1: Request) ================= -->
        <div id="auth-panel-forgot-step1" class="hidden space-y-4">
          <div class="p-3.5 bg-flame-orange/5 border border-flame-orange/30 text-xs font-mono text-flame-orange flex items-center gap-2">
            <i class="fa-solid fa-circle-question text-base shrink-0"></i>
            <span>請輸入您的註冊帳號或 Email，系統將發送 6 位數密碼重設驗證碼至您的信箱。</span>
          </div>

          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1.5">帳號 或 註冊 Email</label>
            <input id="auth-forgot-input-id" type="text" placeholder="例如：thienper 或 student@pu.edu.tw" class="w-full p-3.5 bg-white border border-klein/30 focus:border-klein text-klein text-sm md:text-base font-mono focus:outline-none" />
          </div>

          <button id="auth-btn-send-forgot-otp" class="w-full py-4 bg-klein hover:bg-deep-klein text-white font-heading font-bold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
            <i class="fa-solid fa-paper-plane"></i> 發送重設驗證碼
          </button>

          <div class="text-center pt-2">
            <button type="button" id="auth-btn-back-to-login" class="font-mono text-xs text-klein font-bold hover:underline">
              <i class="fa-solid fa-arrow-left"></i> 返回登入
            </button>
          </div>
        </div>

        <!-- ================= 3.1 Forgot Password Panel (Step 2: Reset) ================= -->
        <div id="auth-panel-forgot-step2" class="hidden space-y-4">
          <div class="p-3.5 bg-klein/5 border border-klein/20 text-center">
            <p class="font-heading font-bold text-xs text-klein">重設驗證碼已發送至：</p>
            <p id="auth-forgot-masked-email" class="font-mono text-sm text-klein font-bold mt-0.5"></p>
          </div>

          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">6 位數 OTP 驗證碼</label>
            <input id="auth-forgot-otp-code" type="text" maxlength="6" placeholder="請輸入信箱中的 6 位數代碼" class="w-full p-3 bg-white border-2 border-klein text-center font-mono text-xl font-bold tracking-[6px] text-klein focus:outline-none" />
          </div>

          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">設定新密碼 (至少 4 位數)</label>
            <input id="auth-forgot-new-pwd" type="password" placeholder="請輸入新密碼" class="w-full p-3 bg-white border border-klein/30 text-klein text-sm font-mono focus:border-klein focus:outline-none" />
          </div>

          <div>
            <label class="block font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein mb-1">再次確認新密碼</label>
            <input id="auth-forgot-confirm-pwd" type="password" placeholder="請再次輸入新密碼" class="w-full p-3 bg-white border border-klein/30 text-klein text-sm font-mono focus:border-klein focus:outline-none" />
          </div>

          <button id="auth-btn-submit-reset-pwd" class="w-full py-4 bg-klein hover:bg-deep-klein text-white font-heading font-bold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
            <i class="fa-solid fa-key"></i> 確認變更並立即登入
          </button>

          <div class="flex items-center justify-between text-xs font-mono pt-2">
            <button type="button" id="auth-btn-back-forgot-step1" class="text-klein/60 hover:text-klein underline">
              <i class="fa-solid fa-arrow-left"></i> 上一步
            </button>
            <button type="button" id="auth-btn-resend-forgot-otp" class="text-klein font-bold hover:underline">
              重新發送 (<span id="auth-forgot-countdown">60</span>s)
            </button>
          </div>
        </div>

        <!-- ================= 4. Quick Select Existing Accounts Panel ================= -->
        <div id="auth-panel-quick" class="hidden space-y-4">
          <p class="font-mono text-xs md:text-sm text-klein/70">點擊以下 MongoDB 資料庫中的帳號快速填入登入：</p>
          <div id="auth-quick-list" class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            <div class="p-4 bg-klein/5 border border-klein/20 animate-pulse text-xs font-mono text-center">載入中...</div>
          </div>
        </div>

        <!-- Message Box -->
        <div id="auth-modal-msg" class="mt-4 text-xs md:text-sm font-mono text-center hidden"></div>
      </div>
    `;

    document.body.appendChild(modal);

    // State Variables
    let currentRegEmail = '';
    let currentForgotEmail = '';
    let regCountdownTimer = null;
    let forgotCountdownTimer = null;

    // DOM Elements
    const tabLogin = document.getElementById('tab-btn-login');
    const tabReg = document.getElementById('tab-btn-reg');
    const tabQuick = document.getElementById('tab-btn-quick');
    const tabsNav = document.getElementById('auth-tabs-nav');

    const panelLogin = document.getElementById('auth-panel-login');
    const panelRegStep1 = document.getElementById('auth-panel-reg-step1');
    const panelRegStep2 = document.getElementById('auth-panel-reg-step2');
    const panelForgotStep1 = document.getElementById('auth-panel-forgot-step1');
    const panelForgotStep2 = document.getElementById('auth-panel-forgot-step2');
    const panelQuick = document.getElementById('auth-panel-quick');

    const msgEl = document.getElementById('auth-modal-msg');
    const mainTitle = document.getElementById('auth-main-title');
    const mainSubtitle = document.getElementById('auth-main-subtitle');

    function showMsg(text, type = 'info') {
      msgEl.classList.remove('hidden');
      if (type === 'error') {
        msgEl.className = 'mt-4 text-xs md:text-sm font-mono text-center text-flame-orange font-bold';
      } else if (type === 'success') {
        msgEl.className = 'mt-4 text-xs md:text-sm font-mono text-center text-emerald-600 font-bold';
      } else {
        msgEl.className = 'mt-4 text-xs md:text-sm font-mono text-center text-klein animate-pulse';
      }
      msgEl.innerText = text;
    }

    function hideMsg() {
      msgEl.classList.add('hidden');
    }

    function hideAllPanels() {
      [panelLogin, panelRegStep1, panelRegStep2, panelForgotStep1, panelForgotStep2, panelQuick].forEach(p => p.classList.add('hidden'));
      hideMsg();
    }

    function switchTab(activeTab, targetPanel) {
      tabsNav.classList.remove('hidden');
      [tabLogin, tabReg, tabQuick].forEach(t => {
        t.className = 'flex-1 py-3 font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein/50 hover:text-klein border-b-2 border-transparent transition-all flex items-center justify-center gap-2';
      });
      activeTab.className = 'flex-1 py-3 font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-klein border-b-2 border-klein transition-all flex items-center justify-center gap-2';
      
      hideAllPanels();
      targetPanel.classList.remove('hidden');
      mainTitle.innerText = '登入 / 切換帳戶';
      mainSubtitle.innerText = '雲端資料庫直連 · 支援 Email 驗證碼安全保護';
    }

    // Modal Close
    document.getElementById('cdna-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Tab Listeners
    tabLogin.addEventListener('click', () => switchTab(tabLogin, panelLogin));
    tabReg.addEventListener('click', () => switchTab(tabReg, panelRegStep1));
    tabQuick.addEventListener('click', async () => {
      switchTab(tabQuick, panelQuick);
      const listEl = document.getElementById('auth-quick-list');
      listEl.innerHTML = '<div class="p-3 text-center text-xs font-mono text-klein/50">正在讀取 Atlas 用戶...</div>';
      const res = await CareerDNA_DB.getUsersList();
      if (res && res.users && res.users.length > 0) {
        listEl.innerHTML = res.users.map(u => `
          <div class="auth-quick-item p-3.5 bg-white border border-klein/20 hover:border-klein hover:bg-klein/5 cursor-pointer flex items-center justify-between transition-all group shadow-sm" data-id="${u.username || u.email || u.name}" data-name="${u.name || u.username}">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-klein text-white flex items-center justify-center font-bold text-sm uppercase">
                ${(u.name || u.username || 'U').charAt(0)}
              </div>
              <div>
                <span class="font-heading font-bold text-sm text-klein block">${u.name || u.username || '用戶'}</span>
                <span class="font-mono text-xs text-klein/60">${u.department || 'IM'} · ${u.grade || '大三'} ${u.email ? '· ' + u.email : ''}</span>
              </div>
            </div>
            <span class="text-xs text-klein font-mono font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
              填入登入 <i class="fa-solid fa-arrow-right"></i>
            </span>
          </div>
        `).join('');

        listEl.querySelectorAll('.auth-quick-item').forEach(item => {
          item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-id');
            switchTab(tabLogin, panelLogin);
            const inputId = document.getElementById('auth-input-id');
            const inputPwd = document.getElementById('auth-input-password');
            if (inputId) inputId.value = targetId;
            if (inputPwd) {
              inputPwd.focus();
              showMsg(`已填入帳號「${targetId}」，請輸入密碼以登入`, 'info');
            }
          });
        });
      } else {
        listEl.innerHTML = '<div class="p-3 text-center text-xs font-mono text-klein/50">無現存帳號，請直接輸入登入</div>';
      }
    });

    // Password Toggles
    const togglePwdLogin = document.getElementById('auth-toggle-pwd-login');
    if (togglePwdLogin) {
      togglePwdLogin.addEventListener('click', () => {
        const input = document.getElementById('auth-input-password');
        input.type = input.type === 'password' ? 'text' : 'password';
        togglePwdLogin.innerHTML = input.type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
      });
    }

    const togglePwdReg = document.getElementById('auth-toggle-pwd-reg');
    if (togglePwdReg) {
      togglePwdReg.addEventListener('click', () => {
        const input = document.getElementById('auth-reg-password');
        input.type = input.type === 'password' ? 'text' : 'password';
        togglePwdReg.innerHTML = input.type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
      });
    }

    // --- 1. Login Action ---
    async function handleLogin() {
      const identifier = document.getElementById('auth-input-id').value.trim();
      const password = document.getElementById('auth-input-password').value;

      if (!identifier) return showMsg('請輸入 Email 或 使用者名稱', 'error');
      if (!password) return showMsg('請輸入登入密碼', 'error');

      showMsg('正在向 MongoDB Atlas 驗證身分...', 'info');

      const res = await CareerDNA_DB.login(identifier, password);
      if (res && res.status === 'ok' && res.user) {
        showMsg('登入成功！正在載入資料...', 'success');
        setCurrentUser(res.user);
        setTimeout(() => {
          modal.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 500);
      } else {
        showMsg(res.message || '登入失敗，帳號或密碼不正確', 'error');
      }
    }

    document.getElementById('auth-btn-submit-login').addEventListener('click', handleLogin);
    document.getElementById('auth-input-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });

    // --- 2. Register Step 1: Send OTP ---
    async function handleSendRegOtp() {
      const name = document.getElementById('auth-reg-name').value.trim();
      const username = document.getElementById('auth-reg-username').value.trim();
      const email = document.getElementById('auth-reg-email').value.trim();
      const password = document.getElementById('auth-reg-password').value;
      const dept = document.getElementById('auth-reg-dept').value;
      const grade = document.getElementById('auth-reg-grade').value;

      if (!name) return showMsg('請填寫姓名 / 暱稱', 'error');
      if (!username) return showMsg('請設定帳號名稱 (Username)', 'error');
      if (!email || !email.includes('@')) return showMsg('請填寫正確的 Email 以接收驗證碼', 'error');
      if (!password || password.length < 4) return showMsg('密碼長度至少需 4 個字元', 'error');

      showMsg('正在發送驗證碼至您的 Email，請稍候...', 'info');

      const res = await apiCall('/api/auth/register-request', {
        method: 'POST',
        body: JSON.stringify({ name, username, email, password, department: dept, dept, grade })
      });

      if (res && res.status === 'ok') {
        currentRegEmail = res.email;
        hideAllPanels();
        panelRegStep2.classList.remove('hidden');
        document.getElementById('auth-reg-otp-email-display').innerText = res.maskedEmail || res.email;
        showMsg(res.message, 'success');
        startRegCountdown();
        document.getElementById('auth-reg-otp-code').focus();
      } else {
        showMsg(res.message || '無法發送驗證碼，請檢查資料', 'error');
      }
    }

    document.getElementById('auth-btn-send-reg-otp').addEventListener('click', handleSendRegOtp);

    function startRegCountdown() {
      let seconds = 60;
      const cdEl = document.getElementById('auth-reg-countdown');
      const btn = document.getElementById('auth-btn-resend-reg-otp');
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');

      if (regCountdownTimer) clearInterval(regCountdownTimer);
      regCountdownTimer = setInterval(() => {
        seconds--;
        if (cdEl) cdEl.innerText = seconds;
        if (seconds <= 0) {
          clearInterval(regCountdownTimer);
          btn.disabled = false;
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
          btn.innerHTML = '重新發送驗證碼';
        }
      }, 1000);
    }

    // Resend Reg OTP
    document.getElementById('auth-btn-resend-reg-otp').addEventListener('click', async () => {
      if (!currentRegEmail) return;
      showMsg('正在重新發送驗證碼...', 'info');
      const res = await apiCall('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: currentRegEmail, type: 'register' })
      });
      if (res && res.status === 'ok') {
        showMsg(res.message, 'success');
        startRegCountdown();
      } else {
        showMsg(res.message || '重發失敗', 'error');
      }
    });

    document.getElementById('auth-btn-back-reg-step1').addEventListener('click', () => {
      hideAllPanels();
      panelRegStep1.classList.remove('hidden');
    });

    // --- 2.2 Register Step 2: Verify OTP & Complete ---
    async function handleVerifyRegOtp() {
      const code = document.getElementById('auth-reg-otp-code').value.trim();
      if (!code || code.length < 6) return showMsg('請輸入 6 位數 OTP 驗證碼', 'error');

      showMsg('正在驗證 OTP 並建立帳戶...', 'info');

      const res = await apiCall('/api/auth/register-verify', {
        method: 'POST',
        body: JSON.stringify({ email: currentRegEmail, code })
      });

      if (res && res.status === 'ok' && res.user) {
        showMsg('🎉 驗證成功！帳戶已成功建立並登入', 'success');
        setCurrentUser(res.user);
        setTimeout(() => {
          modal.remove();
          if (onSuccessCallback) onSuccessCallback(res.user);
        }, 800);
      } else {
        showMsg(res.message || '驗證碼錯誤或已過期', 'error');
      }
    }

    document.getElementById('auth-btn-verify-reg-otp').addEventListener('click', handleVerifyRegOtp);
    document.getElementById('auth-reg-otp-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleVerifyRegOtp(); });

    // --- 3. Forgot Password Flow ---
    document.getElementById('auth-link-forgot').addEventListener('click', () => {
      tabsNav.classList.add('hidden');
      hideAllPanels();
      panelForgotStep1.classList.remove('hidden');
      mainTitle.innerText = '忘記密碼';
      mainSubtitle.innerText = '透過安全 Email 驗證碼重設您的登入密碼';
    });

    document.getElementById('auth-btn-back-to-login').addEventListener('click', () => {
      switchTab(tabLogin, panelLogin);
    });

    async function handleSendForgotOtp() {
      const identifier = document.getElementById('auth-forgot-input-id').value.trim();
      if (!identifier) return showMsg('請輸入帳號名稱或 Email', 'error');

      showMsg('正在查詢帳戶並發送重設驗證碼...', 'info');

      const res = await apiCall('/api/auth/forgot-request', {
        method: 'POST',
        body: JSON.stringify({ identifier })
      });

      if (res && res.status === 'ok') {
        currentForgotEmail = res.email;
        hideAllPanels();
        panelForgotStep2.classList.remove('hidden');
        document.getElementById('auth-forgot-masked-email').innerText = res.maskedEmail || res.email;
        showMsg(res.message, 'success');
        startForgotCountdown();
        document.getElementById('auth-forgot-otp-code').focus();
      } else {
        showMsg(res.message || '查詢失敗，請確認帳號或 Email 是否正確', 'error');
      }
    }

    document.getElementById('auth-btn-send-forgot-otp').addEventListener('click', handleSendForgotOtp);

    function startForgotCountdown() {
      let seconds = 60;
      const cdEl = document.getElementById('auth-forgot-countdown');
      const btn = document.getElementById('auth-btn-resend-forgot-otp');
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');

      if (forgotCountdownTimer) clearInterval(forgotCountdownTimer);
      forgotCountdownTimer = setInterval(() => {
        seconds--;
        if (cdEl) cdEl.innerText = seconds;
        if (seconds <= 0) {
          clearInterval(forgotCountdownTimer);
          btn.disabled = false;
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
          btn.innerHTML = '重新發送';
        }
      }, 1000);
    }

    // Resend Forgot OTP
    document.getElementById('auth-btn-resend-forgot-otp').addEventListener('click', async () => {
      if (!currentForgotEmail) return;
      showMsg('正在重新發送重設驗證碼...', 'info');
      const res = await apiCall('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: currentForgotEmail, type: 'forgot_password' })
      });
      if (res && res.status === 'ok') {
        showMsg(res.message, 'success');
        startForgotCountdown();
      } else {
        showMsg(res.message || '重發失敗', 'error');
      }
    });

    document.getElementById('auth-btn-back-forgot-step1').addEventListener('click', () => {
      hideAllPanels();
      panelForgotStep1.classList.remove('hidden');
    });

    // Submit Reset Password
    async function handleResetPassword() {
      const code = document.getElementById('auth-forgot-otp-code').value.trim();
      const newPassword = document.getElementById('auth-forgot-new-pwd').value;
      const confirmPassword = document.getElementById('auth-forgot-confirm-pwd').value;

      if (!code || code.length < 6) return showMsg('請輸入 6 位數 OTP 驗證碼', 'error');
      if (!newPassword || newPassword.length < 4) return showMsg('新密碼長度至少需 4 個字元', 'error');
      if (newPassword !== confirmPassword) return showMsg('兩次輸入的新密碼不一致', 'error');

      showMsg('正在重設密碼並更新至 MongoDB Atlas...', 'info');

      const res = await apiCall('/api/auth/forgot-verify-reset', {
        method: 'POST',
        body: JSON.stringify({ email: currentForgotEmail, code, newPassword })
      });

      if (res && res.status === 'ok') {
        showMsg('✅ 密碼重設成功！已自動登入', 'success');
        if (res.user) setCurrentUser(res.user);
        setTimeout(() => {
          modal.remove();
          if (onSuccessCallback && res.user) onSuccessCallback(res.user);
        }, 800);
      } else {
        showMsg(res.message || '重設密碼失敗，驗證碼錯誤或已過期', 'error');
      }
    }

    document.getElementById('auth-btn-submit-reset-pwd').addEventListener('click', handleResetPassword);
  }

  const CareerDNA_DB = {
    getEffectiveUid,
    getOrCreateGuestUid,
    getCurrentUser,
    setCurrentUser,
    refreshNavbar,
    showAuthModal: createAuthModal,
    openAuthModal: createAuthModal,

    // Database Status Check
    async checkStatus() {
      return await apiCall('/api/db/status');
    },

    // Auth Helpers
    async login(identifier, password = '') {
      return await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });
    },

    async registerRequest(userData) {
      return await apiCall('/api/auth/register-request', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async registerVerify(email, code) {
      return await apiCall('/api/auth/register-verify', {
        method: 'POST',
        body: JSON.stringify({ email, code })
      });
    },

    async forgotRequest(identifier) {
      return await apiCall('/api/auth/forgot-request', {
        method: 'POST',
        body: JSON.stringify({ identifier })
      });
    },

    async forgotReset(email, code, newPassword) {
      return await apiCall('/api/auth/forgot-verify-reset', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword })
      });
    },

    async getUsersList() {
      return await apiCall('/api/auth/users-list');
    },

    logout() {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.UID);
      localStorage.removeItem(STORAGE_KEYS.NAME);
      refreshNavbar();
    },

    // 1. Get Complete User Profile from MongoDB Atlas
    async getUser(uid) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall(`/api/users/${encodeURIComponent(targetUid)}`);
    },

    // 2. Full Sync / Upsert User Document
    async syncFullUser(uid, data) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall('/api/users/sync', {
        method: 'POST',
        body: JSON.stringify({ uid: targetUid, ...data })
      });
    },

    // 3. Save / Update Basic Profile Fields
    async saveProfile(uid, profileData) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall(`/api/users/${encodeURIComponent(targetUid)}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
    },

    // 4. Save Brand / Holland RIASEC & Gallup Test Results
    async saveBrandResult(uid, brandData) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall(`/api/users/${encodeURIComponent(targetUid)}/brand`, {
        method: 'POST',
        body: JSON.stringify(brandData)
      });
    },

    // 5. Get Latest Brand Result
    async getBrandResult(uid) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall(`/api/users/${encodeURIComponent(targetUid)}/brand`);
    },

    // 6. Save Resume & ATS Audit Results
    async saveResumeData(uid, resumeData) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall(`/api/users/${encodeURIComponent(targetUid)}/resume`, {
        method: 'POST',
        body: JSON.stringify(resumeData)
      });
    },

    // 7. Get Latest Resume Data
    async getResumeData(uid) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall(`/api/users/${encodeURIComponent(targetUid)}/resume`);
    },

    // 8. Save Lab Recommendation Result
    async saveLabResult(uid, labData) {
      const targetUid = uid || getEffectiveUid();
      return await apiCall(`/api/users/${encodeURIComponent(targetUid)}/lab`, {
        method: 'POST',
        body: JSON.stringify(labData)
      });
    },

    // 9. Get Faculty / Professors List
    async getProfessors(dept = '') {
      const query = dept ? `?dept=${encodeURIComponent(dept)}` : '';
      return await apiCall(`/api/professors${query}`);
    },

    // 10. Upload Avatar to Cloudflare R2
    async uploadAvatar(uid, file) {
      const targetUid = uid || getEffectiveUid();
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const response = await fetch(`/api/users/${encodeURIComponent(targetUid)}/avatar`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.status === 'ok' && data.user) {
          setCurrentUser(data.user);
        }
        return data;
      } catch (err) {
        console.error('[CareerDNA DB uploadAvatar error]:', err);
        return { status: 'error', message: err.message };
      }
    },

    // 11. Public Resources from MongoDB
    async getResources(filters = {}) {
      const query = new URLSearchParams();
      if (filters.dept) query.append('dept', filters.dept);
      if (filters.category) query.append('category', filters.category);
      if (filters.grade) query.append('grade', filters.grade);
      if (filters.search) query.append('search', filters.search);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return await apiCall(`/api/resources${qs}`);
    },

    async getResourceCategories() {
      return await apiCall('/api/resources/categories');
    },

    // 12. Admin Role Helpers & API Call Bridge
    isAdmin() {
      const user = getCurrentUser();
      return Boolean(user && user.role === 'admin' && user.isActive !== false);
    },

    getAdminUid() {
      const user = getCurrentUser();
      return user ? (user.uid || user._id || user.username) : '';
    },

    async adminApiCall(endpoint, options = {}) {
      const adminUid = this.getAdminUid();
      const headers = {
        'X-Admin-UID': adminUid,
        ...(options.headers || {})
      };
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      return await apiCall(endpoint, {
        ...options,
        headers
      });
    }
  };

  return CareerDNA_DB;
}));
