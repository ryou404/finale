/**
 * Admin Component: AccessDenied (Fully Localized)
 */
window.AdminAccessDenied = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <div class="max-w-xl mx-auto my-8 p-6 md:p-8 bg-white border-2 border-flame-orange shadow-2xl space-y-6 crosshair-corner animate-in fade-in zoom-in-95 duration-200">
        <div class="text-center space-y-2">
          <div class="w-14 h-14 bg-flame-orange/10 text-flame-orange mx-auto flex items-center justify-center text-2xl border border-flame-orange/30">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <h2 class="font-heading font-black text-2xl text-klein uppercase tracking-tight">${t('access.title')}</h2>
          <p class="font-mono text-xs text-klein/70">
            ${t('access.desc')}
          </p>
        </div>

        <!-- Direct Inline Admin Login Form -->
        <form id="admin-inline-login-form" onsubmit="AdminAccessDenied.handleSubmit(event)" class="p-4 bg-slate-50 border border-klein/20 space-y-3 font-mono text-xs">
          <div>
            <label class="block font-bold text-klein mb-1">${t('access.idLabel')}</label>
            <input id="inline-admin-id" type="text" value="admin" required class="w-full p-2.5 bg-white border border-klein/30 text-klein font-bold focus:border-klein focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('access.pwdLabel')}</label>
            <input id="inline-admin-pwd" type="password" value="admin123" required class="w-full p-2.5 bg-white border border-klein/30 text-klein font-bold focus:border-klein focus:outline-none" />
          </div>
          <button type="submit" id="btn-inline-admin-submit" class="w-full py-3 bg-klein hover:bg-deep-klein text-white font-heading font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md">
            <i class="fa-solid fa-key"></i> ${t('access.btnLogin')}
          </button>
          <div id="inline-admin-msg" class="text-center font-mono text-xs hidden"></div>
        </form>

        <div class="pt-2 flex flex-wrap items-center justify-center gap-3 border-t border-klein/10">
          <button type="button" onclick="window.CareerDNA_DB.showAuthModal((u) => window.location.reload())" class="px-4 py-2 border border-klein text-klein font-mono text-xs font-bold uppercase hover:bg-klein hover:text-white transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-users"></i> ${t('access.btnModal')}
          </button>
          <a href="index.html" class="px-4 py-2 border border-slate-300 text-slate-600 font-mono text-xs font-bold uppercase hover:bg-slate-100 transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-house"></i> ${t('access.btnHome')}
          </a>
        </div>
      </div>
    `;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const identifier = document.getElementById('inline-admin-id').value.trim();
    const password = document.getElementById('inline-admin-pwd').value;
    const submitBtn = document.getElementById('btn-inline-admin-submit');
    const msgEl = document.getElementById('inline-admin-msg');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
    msgEl.className = 'text-center font-mono text-xs text-klein animate-pulse';
    msgEl.innerText = 'Connecting to MongoDB Atlas...';
    msgEl.classList.remove('hidden');

    try {
      const res = await window.CareerDNA_DB.login(identifier, password);
      if (res && res.status === 'ok' && res.user) {
        if (res.user.role !== 'admin') {
          msgEl.className = 'text-center font-mono text-xs text-rose-600 font-bold';
          msgEl.innerText = '❌ Access Denied: Admin role required';
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-key"></i> ${t('access.btnLogin')}`;
          return;
        }

        window.CareerDNA_DB.setCurrentUser(res.user);
        msgEl.className = 'text-center font-mono text-xs text-emerald-600 font-bold';
        msgEl.innerText = '✅ Admin verified! Loading console...';
        setTimeout(() => window.location.reload(), 500);
      } else {
        msgEl.className = 'text-center font-mono text-xs text-rose-600 font-bold';
        msgEl.innerText = '❌ ' + (res.message || 'Login failed');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-key"></i> ${t('access.btnLogin')}`;
      }
    } catch (err) {
      msgEl.className = 'text-center font-mono text-xs text-rose-600 font-bold';
      msgEl.innerText = '❌ ' + err.message;
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-key"></i> ${t('access.btnLogin')}`;
    }
  }

  return {
    render,
    handleSubmit
  };
})();
