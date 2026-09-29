/**
 * Admin Component: TabUsers (Fully Localized)
 */
window.TabUsers = (function () {
  let currentPage = 1;
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <section id="panel-users" class="hidden w-full space-y-4">
        <!-- Filter Bar -->
        <div class="bg-white border-2 border-klein p-4 shadow-sm crosshair-corner flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <!-- Search Box -->
            <div class="relative flex-1 min-w-[200px]">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-klein/40 text-xs"></i>
              <input id="users-search" type="text" placeholder="${t('users.searchPlaceholder')}" class="w-full pl-9 pr-3 py-2 bg-white border border-klein/30 focus:border-klein font-mono text-xs focus:outline-none" />
            </div>

            <!-- Dept Filter -->
            <select id="users-filter-dept" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('users.filterDept')}</option>
              <option value="CS">資工系 (CS)</option>
              <option value="IM">資管系 (IM)</option>
              <option value="AI">人工智慧系 (AI)</option>
            </select>

            <!-- Grade Filter -->
            <select id="users-filter-grade" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('users.filterGrade')}</option>
              <option value="大一">大一 (Freshman)</option>
              <option value="大二">大二 (Sophomore)</option>
              <option value="大三">大三 (Junior)</option>
              <option value="大四">大四 (Senior)</option>
              <option value="碩士">碩士 (Master)</option>
            </select>

            <!-- Role Filter -->
            <select id="users-filter-role" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('users.filterRole')}</option>
              <option value="user">一般學生 (User)</option>
              <option value="admin">管理員 (Admin)</option>
            </select>

            <!-- Status Filter -->
            <select id="users-filter-status" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('users.filterStatus')}</option>
              <option value="active">啟用中 (Active)</option>
              <option value="inactive">已停用 (Inactive)</option>
            </select>
          </div>

          <!-- Add User Button -->
          <button onclick="TabUsers.openAddUserModal()" class="btn-cyber px-4 py-2 bg-klein hover:bg-deep-klein text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
            <i class="fa-solid fa-user-plus"></i> <span>${t('users.addUser')}</span>
          </button>
        </div>

        <!-- Users Data Table -->
        <div class="bg-white border-2 border-klein shadow-sm crosshair-corner overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead class="bg-klein/5 border-b-2 border-klein text-klein font-bold uppercase tracking-wider">
                <tr>
                  <th class="p-3.5">${t('users.thUser')}</th>
                  <th class="p-3.5">${t('users.thDeptGrade')}</th>
                  <th class="p-3.5">${t('users.thTests')}</th>
                  <th class="p-3.5">${t('users.thRole')}</th>
                  <th class="p-3.5">${t('users.thStatus')}</th>
                  <th class="p-3.5">${t('users.thUpdated')}</th>
                  <th class="p-3.5 text-right">${t('users.thActions')}</th>
                </tr>
              </thead>
              <tbody id="users-table-tbody" class="divide-y divide-klein/10">
                <tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('users.loading')}</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="p-3.5 bg-slate-50 border-t border-klein/20 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div id="users-pagination-info" class="text-klein/70">--</div>
            <div class="flex items-center gap-1.5">
              <button id="users-prev-page" class="px-2.5 py-1 border border-klein/30 hover:border-klein bg-white text-klein disabled:opacity-30 disabled:pointer-events-none">&larr; ${t('users.prevPage')}</button>
              <span id="users-current-page" class="px-3 py-1 font-bold text-klein">1</span>
              <button id="users-next-page" class="px-2.5 py-1 border border-klein/30 hover:border-klein bg-white text-klein disabled:opacity-30 disabled:pointer-events-none">${t('users.nextPage')} &rarr;</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function init() {
    ['users-search', 'users-filter-dept', 'users-filter-grade', 'users-filter-role', 'users-filter-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => loadUsers(1));
      if (el && el.tagName === 'INPUT') el.addEventListener('input', () => loadUsers(1));
    });

    document.getElementById('users-prev-page')?.addEventListener('click', () => {
      if (currentPage > 1) loadUsers(currentPage - 1);
    });
    document.getElementById('users-next-page')?.addEventListener('click', () => {
      loadUsers(currentPage + 1);
    });
  }

  async function loadUsers(page = 1) {
    currentPage = page;
    const search = document.getElementById('users-search')?.value || '';
    const dept = document.getElementById('users-filter-dept')?.value || 'all';
    const grade = document.getElementById('users-filter-grade')?.value || 'all';
    const role = document.getElementById('users-filter-role')?.value || 'all';
    const status = document.getElementById('users-filter-status')?.value || 'all';

    const tbody = document.getElementById('users-table-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('users.loading')}</td></tr>`;

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/users?page=${page}&limit=15&search=${encodeURIComponent(search)}&dept=${dept}&grade=${grade}&role=${role}&status=${status}`);
      if (res && res.status === 'ok') {
        const users = res.users || [];
        if (users.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-klein/50 font-mono">${t('users.noResults')}</td></tr>`;
          return;
        }

        tbody.innerHTML = users.map(u => `
          <tr class="hover:bg-klein/5 transition-colors">
            <td class="p-3.5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-klein text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  ${(u.name || u.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span class="font-bold text-klein block">${u.name || u.displayName || u.username}</span>
                  <span class="text-[11px] text-klein/60 font-mono block">${u.email || u.username}</span>
                  <span class="text-[9px] text-klein/40 font-mono">UID: ${u.uid}</span>
                </div>
              </div>
            </td>
            <td class="p-3.5">
              <span class="font-bold text-klein block">${u.department || 'IM'}</span>
              <span class="text-[11px] text-klein/60">${u.grade || '大三'}</span>
            </td>
            <td class="p-3.5">
              <div class="flex flex-wrap gap-1">
                <span class="px-1.5 py-0.5 text-[9px] font-bold ${u.hasBrand ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}">BRAND</span>
                <span class="px-1.5 py-0.5 text-[9px] font-bold ${u.hasResume ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}">ATS_RESUME</span>
                <span class="px-1.5 py-0.5 text-[9px] font-bold ${u.hasLab ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-400'}">LAB_FIT</span>
              </div>
            </td>
            <td class="p-3.5">
              <span class="px-2 py-0.5 text-[10px] font-bold ${u.role === 'admin' ? 'bg-flame-orange text-white' : 'bg-klein/10 text-klein'}">
                ${u.role === 'admin' ? 'ADMIN' : 'USER'}
              </span>
            </td>
            <td class="p-3.5">
              <span class="inline-flex items-center gap-1 font-bold ${u.isActive !== false ? 'text-emerald-600' : 'text-rose-600'}">
                <span class="w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                ${u.isActive !== false ? t('users.active') : t('users.inactive')}
              </span>
            </td>
            <td class="p-3.5 text-klein/60 text-[11px]">
              ${new Date(u.updatedAt || Date.now()).toLocaleDateString()}
            </td>
            <td class="p-3.5 text-right space-x-1">
              <button onclick="TabUsers.viewUserDossier('${u.uid}')" class="p-1.5 hover:bg-klein/10 text-klein rounded transition-colors" title="${t('users.modalDossierTitle')}">
                <i class="fa-solid fa-id-card"></i>
              </button>
              <button onclick="TabUsers.openEditUserModal('${u.uid}')" class="p-1.5 hover:bg-klein/10 text-klein rounded transition-colors" title="${t('common.edit')}">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="TabUsers.openResetPasswordModal('${u.uid}', '${u.username || u.name}')" class="p-1.5 hover:bg-amber-50 text-amber-600 rounded transition-colors" title="${t('users.modalResetPwdTitle')}">
                <i class="fa-solid fa-key"></i>
              </button>
              <button onclick="TabUsers.confirmDeleteUser('${u.uid}', '${u.username || u.name}')" class="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors" title="${t('common.delete')}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `).join('');

        // Pagination updates
        document.getElementById('users-pagination-info').innerText = t('users.pageInfo', {
          page: res.page,
          totalPages: res.totalPages,
          total: res.total
        });
        document.getElementById('users-current-page').innerText = res.page;
        document.getElementById('users-prev-page').disabled = res.page <= 1;
        document.getElementById('users-next-page').disabled = res.page >= res.totalPages;
      }
    } catch (e) {
      console.error('[TabUsers loadUsers Error]:', e);
    }
  }

  async function viewUserDossier(uid) {
    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/users/${encodeURIComponent(uid)}`);
      if (res && res.status === 'ok') {
        const u = res.user;
        const brand = u.brand_results?.latest || {};
        const resume = u.resume_data?.latest || {};

        AdminApp.showModal(`
          <div class="max-w-2xl bg-white border-2 border-klein p-6 space-y-5 crosshair-corner">
            <div class="flex items-center justify-between border-b-2 border-klein pb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-klein text-white font-bold text-lg flex items-center justify-center">
                  ${(u.name || u.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 class="font-heading font-black text-xl text-klein">${u.name || u.displayName || u.username}</h3>
                  <p class="font-mono text-xs text-klein/60">UID: ${u.uid} · ${u.email || 'No email'}</p>
                </div>
              </div>
              <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <div class="p-2.5 bg-klein/5 border border-klein/10">
                <span class="text-klein/50 block">${t('users.deptLabel')} / ${t('users.gradeLabel')}</span>
                <strong class="text-klein">${u.department || 'IM'} · ${u.grade || '大三'}</strong>
              </div>
              <div class="p-2.5 bg-klein/5 border border-klein/10">
                <span class="text-klein/50 block">${t('users.roleLabel')}</span>
                <strong class="${u.role === 'admin' ? 'text-flame-orange' : 'text-klein'}">${u.role.toUpperCase()}</strong>
              </div>
              <div class="p-2.5 bg-klein/5 border border-klein/10">
                <span class="text-klein/50 block">Holland Code</span>
                <strong class="text-klein">${brand.topHollandCode || brand.hollandCode || t('common.none')}</strong>
              </div>
              <div class="p-2.5 bg-klein/5 border border-klein/10">
                <span class="text-klein/50 block">ATS Score</span>
                <strong class="text-emerald-600">${resume.scores?.total || 0} pts</strong>
              </div>
            </div>

            <!-- Holland RIASEC Strengths -->
            <div class="p-4 border border-klein/20 bg-slate-50 space-y-2">
              <h4 class="font-heading font-bold text-xs text-klein uppercase">${t('users.hollandStrengths')}</h4>
              <div class="flex flex-wrap gap-1.5">
                ${(brand.topStrengths || []).map(s => `<span class="px-2 py-1 bg-klein text-white font-mono text-[10px] font-bold">${typeof s === 'object' ? (s.name || s.code) : s}</span>`).join('') || `<span class="font-mono text-xs text-klein/40">${t('common.none')}</span>`}
              </div>
            </div>

            <!-- Resume Analysis Summary -->
            <div class="p-4 border border-klein/20 bg-slate-50 space-y-2">
              <h4 class="font-heading font-bold text-xs text-klein uppercase">${t('users.resumeSummary')}</h4>
              <div class="font-mono text-xs text-klein"><strong>${t('users.targetRole')}：</strong> ${resume.targetRole || t('common.none')}</div>
              <ul class="list-disc pl-4 font-mono text-[11px] text-klein/80 space-y-1">
                ${(resume.actionItems || []).map(item => `<li>${item}</li>`).join('') || `<li>${t('common.none')}</li>`}
              </ul>
            </div>

            <div class="text-right pt-2 border-t border-klein/10">
              <button onclick="AdminApp.closeModal()" class="px-4 py-2 bg-klein text-white font-mono text-xs font-bold uppercase hover:bg-deep-klein transition-all">${t('common.close')}</button>
            </div>
          </div>
        `);
      }
    } catch (e) {
      AdminApp.showToast(e.message, 'error');
    }
  }

  function openAddUserModal() {
    AdminApp.showModal(`
      <div class="max-w-md bg-white border-2 border-klein p-6 space-y-4 crosshair-corner">
        <div class="flex items-center justify-between border-b border-klein/20 pb-3">
          <h3 class="font-heading font-bold text-lg text-klein uppercase flex items-center gap-2">
            <i class="fa-solid fa-user-plus"></i> ${t('users.modalAddTitle')}
          </h3>
          <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <form onsubmit="TabUsers.submitAddUser(event)" class="space-y-3 font-mono text-xs">
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.nameLabel')}</label>
            <input id="new-user-name" type="text" required placeholder="例如：黃小明 / Alex" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.usernameLabel')}</label>
            <input id="new-user-username" type="text" required placeholder="student01" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.emailLabel')}</label>
            <input id="new-user-email" type="email" placeholder="student@pu.edu.tw" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.passwordLabel')}</label>
            <input id="new-user-password" type="password" required placeholder="••••••" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-klein mb-1">${t('users.deptLabel')}</label>
              <select id="new-user-dept" class="w-full p-2.5 border border-klein/30">
                <option value="IM">資管系 (IM)</option>
                <option value="CS">資工系 (CS)</option>
                <option value="AI">人工智慧系 (AI)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('users.gradeLabel')}</label>
              <select id="new-user-grade" class="w-full p-2.5 border border-klein/30">
                <option value="大一">大一</option>
                <option value="大二">大二</option>
                <option value="大三" selected>大三</option>
                <option value="大四">大四</option>
                <option value="碩士">碩士</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.roleLabel')}</label>
            <select id="new-user-role" class="w-full p-2.5 border border-klein/30">
              <option value="user">一般學生 (User)</option>
              <option value="admin">系統管理員 (Admin)</option>
            </select>
          </div>

          <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
            <button type="button" onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
            <button type="submit" class="px-4 py-2 bg-klein text-white font-bold hover:bg-deep-klein">${t('users.btnCreate')}</button>
          </div>
        </form>
      </div>
    `);
  }

  async function submitAddUser(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('new-user-name').value.trim(),
      username: document.getElementById('new-user-username').value.trim(),
      email: document.getElementById('new-user-email').value.trim(),
      password: document.getElementById('new-user-password').value,
      department: document.getElementById('new-user-dept').value,
      grade: document.getElementById('new-user-grade').value,
      role: document.getElementById('new-user-role').value
    };

    const res = await CareerDNA_DB.adminApiCall('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '用戶建立成功！' : 'User created successfully!', 'success');
      loadUsers(currentPage);
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  async function openEditUserModal(uid) {
    const res = await CareerDNA_DB.adminApiCall(`/api/admin/users/${encodeURIComponent(uid)}`);
    if (!res || res.status !== 'ok') {
      AdminApp.showToast('Failed to load user', 'error');
      return;
    }
    const u = res.user;

    AdminApp.showModal(`
      <div class="max-w-md bg-white border-2 border-klein p-6 space-y-4 crosshair-corner">
        <div class="flex items-center justify-between border-b border-klein/20 pb-3">
          <h3 class="font-heading font-bold text-lg text-klein uppercase">${t('users.modalEditTitle')}</h3>
          <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <form onsubmit="TabUsers.submitEditUser(event, '${u.uid}')" class="space-y-3 font-mono text-xs">
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.nameLabel')}</label>
            <input id="edit-user-name" type="text" value="${u.name || u.displayName || ''}" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.emailLabel')}</label>
            <input id="edit-user-email" type="email" value="${u.email || ''}" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-klein mb-1">${t('users.deptLabel')}</label>
              <select id="edit-user-dept" class="w-full p-2.5 border border-klein/30">
                <option value="IM" ${u.department === 'IM' ? 'selected' : ''}>資管系 (IM)</option>
                <option value="CS" ${u.department === 'CS' ? 'selected' : ''}>資工系 (CS)</option>
                <option value="AI" ${u.department === 'AI' ? 'selected' : ''}>人工智慧系 (AI)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('users.gradeLabel')}</label>
              <select id="edit-user-grade" class="w-full p-2.5 border border-klein/30">
                <option value="大一" ${u.grade === '大一' ? 'selected' : ''}>大一</option>
                <option value="大二" ${u.grade === '大二' ? 'selected' : ''}>大二</option>
                <option value="大三" ${u.grade === '大三' ? 'selected' : ''}>大三</option>
                <option value="大四" ${u.grade === '大四' ? 'selected' : ''}>大四</option>
                <option value="碩士" ${u.grade === '碩士' ? 'selected' : ''}>碩士</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-klein mb-1">${t('users.roleLabel')}</label>
              <select id="edit-user-role" class="w-full p-2.5 border border-klein/30 font-bold">
                <option value="user" ${u.role === 'user' ? 'selected' : ''}>一般學生 (User)</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>系統管理員 (Admin)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('users.statusLabel')}</label>
              <select id="edit-user-status" class="w-full p-2.5 border border-klein/30 font-bold">
                <option value="true" ${u.isActive !== false ? 'selected' : ''}>${t('users.active')}</option>
                <option value="false" ${u.isActive === false ? 'selected' : ''}>${t('users.inactive')}</option>
              </select>
            </div>
          </div>

          <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
            <button type="button" onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
            <button type="submit" class="px-4 py-2 bg-klein text-white font-bold hover:bg-deep-klein">${t('users.btnSave')}</button>
          </div>
        </form>
      </div>
    `);
  }

  async function submitEditUser(e, uid) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('edit-user-name').value.trim(),
      email: document.getElementById('edit-user-email').value.trim(),
      department: document.getElementById('edit-user-dept').value,
      dept: document.getElementById('edit-user-dept').value,
      grade: document.getElementById('edit-user-grade').value,
      role: document.getElementById('edit-user-role').value,
      isActive: document.getElementById('edit-user-status').value === 'true'
    };

    const res = await CareerDNA_DB.adminApiCall(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '用戶資料已更新' : 'User updated successfully', 'success');
      loadUsers(currentPage);
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  function openResetPasswordModal(uid, username) {
    AdminApp.showModal(`
      <div class="max-w-sm bg-white border-2 border-klein p-6 space-y-4 crosshair-corner">
        <div class="flex items-center justify-between border-b border-klein/20 pb-3">
          <h3 class="font-heading font-bold text-base text-klein uppercase">${t('users.modalResetPwdTitle')}</h3>
          <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <p class="font-mono text-xs text-klein/70">UID: <strong>${username}</strong></p>
        <form onsubmit="TabUsers.submitResetPassword(event, '${uid}')" class="space-y-3 font-mono text-xs">
          <div>
            <label class="block font-bold text-klein mb-1">${t('users.newPasswordLabel')}</label>
            <input id="reset-pwd-input" type="password" required minlength="4" placeholder="••••••" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="AdminApp.closeModal()" class="px-3 py-1.5 border border-klein/30 text-klein">${t('common.cancel')}</button>
            <button type="submit" class="px-3 py-1.5 bg-flame-orange text-white font-bold hover:bg-orange-600">${t('users.btnReset')}</button>
          </div>
        </form>
      </div>
    `);
  }

  async function submitResetPassword(e, uid) {
    e.preventDefault();
    const newPassword = document.getElementById('reset-pwd-input').value;
    const res = await CareerDNA_DB.adminApiCall(`/api/admin/users/${encodeURIComponent(uid)}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword })
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '密碼重設成功！' : 'Password reset successfully!', 'success');
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  function confirmDeleteUser(uid, username) {
    AdminApp.showModal(`
      <div class="max-w-sm bg-white border-2 border-rose-600 p-6 space-y-4 crosshair-corner">
        <div class="flex items-center gap-3 text-rose-600">
          <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
          <h3 class="font-heading font-black text-lg uppercase">${t('users.modalDeleteTitle')}</h3>
        </div>

        <p class="font-mono text-xs text-slate-700">
          ${t('users.deleteConfirmMsg', { username })}
        </p>

        <div class="pt-3 border-t border-slate-200 flex flex-col gap-2 font-mono text-xs font-bold">
          <button onclick="TabUsers.executeDeleteUser('${uid}', false)" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white transition-colors">
            <i class="fa-solid fa-ban"></i> ${t('users.btnSoftDelete')}
          </button>
          <button onclick="TabUsers.executeDeleteUser('${uid}', true)" class="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white transition-colors">
            <i class="fa-solid fa-trash-can"></i> ${t('users.btnHardDelete')}
          </button>
          <button onclick="AdminApp.closeModal()" class="w-full py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors">
            ${t('common.cancel')}
          </button>
        </div>
      </div>
    `);
  }

  async function executeDeleteUser(uid, permanent = false) {
    const res = await CareerDNA_DB.adminApiCall(`/api/admin/users/${encodeURIComponent(uid)}?permanent=${permanent}`, {
      method: 'DELETE'
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(res.message || 'Success', 'success');
      loadUsers(currentPage);
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  return {
    render,
    init,
    loadUsers,
    viewUserDossier,
    openAddUserModal,
    submitAddUser,
    openEditUserModal,
    submitEditUser,
    openResetPasswordModal,
    submitResetPassword,
    confirmDeleteUser,
    executeDeleteUser
  };
})();
