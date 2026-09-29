/**
 * Admin Component: TabProfessors (Fully Localized)
 */
window.TabProfessors = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <section id="panel-professors" class="hidden w-full space-y-4">
        <!-- Filter Bar -->
        <div class="bg-white border-2 border-klein p-4 shadow-sm crosshair-corner flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <select id="profs-filter-dept" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('profs.filterDept')}</option>
              <option value="CS">資訊工程學系 (CS)</option>
              <option value="IM">資訊管理學系 (IM)</option>
              <option value="AI">人工智慧學系 (AI)</option>
            </select>
          </div>

          <button onclick="TabProfessors.openAddProfModal()" class="btn-cyber px-4 py-2 bg-klein hover:bg-deep-klein text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
            <i class="fa-solid fa-user-tie"></i> <span>${t('profs.addProf')}</span>
          </button>
        </div>

        <!-- Professors Grid -->
        <div id="profs-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div class="col-span-full p-8 text-center text-klein/50 font-mono">${t('profs.loading')}</div>
        </div>
      </section>
    `;
  }

  function init() {
    document.getElementById('profs-filter-dept')?.addEventListener('change', () => loadProfessors());
  }

  async function loadProfessors() {
    const dept = document.getElementById('profs-filter-dept')?.value || 'all';
    const grid = document.getElementById('profs-grid');
    if (grid) grid.innerHTML = `<div class="col-span-full p-8 text-center text-klein/50 font-mono">${t('profs.loading')}</div>`;

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/professors?dept=${dept}`);
      if (res && res.status === 'ok') {
        const profs = res.professors || [];
        if (profs.length === 0) {
          grid.innerHTML = `<div class="col-span-full p-8 text-center text-klein/50 font-mono">${t('profs.noProfs')}</div>`;
          return;
        }

        grid.innerHTML = profs.map(p => `
          <div class="bg-white border-2 border-klein p-5 space-y-3 shadow-sm crosshair-corner flex flex-col justify-between">
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-klein text-white font-bold text-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    ${p.avatar ? `<img src="${p.avatar}" class="w-full h-full object-cover">` : p.name.charAt(0)}
                  </div>
                  <div>
                    <h4 class="font-heading font-bold text-base text-klein">${p.name} <span class="text-xs font-normal text-klein/60 font-mono">(${p.title})</span></h4>
                    <span class="px-2 py-0.5 bg-klein/10 text-klein font-mono text-[10px] font-bold uppercase">${p.department}</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 text-[10px] font-bold font-mono ${p.acceptingStudents ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                  ${p.acceptingStudents ? t('profs.accepting') : t('profs.full')}
                </span>
              </div>

              <div class="font-mono text-xs space-y-1 text-klein">
                <div><strong>${t('profs.lab')}</strong> ${p.labName || '專任研究室'}</div>
                <div><strong>${t('profs.research')}</strong></div>
                <div class="flex flex-wrap gap-1 pt-0.5">
                  ${(p.researchFields || []).map(f => `<span class="px-1.5 py-0.5 bg-klein/5 border border-klein/20 text-[10px] font-mono">${f}</span>`).join('')}
                </div>
                <div><strong>${t('profs.office')}</strong> ${p.office || '主顧樓'} · <strong>${t('profs.email')}</strong> ${p.email || 'pu.edu.tw'}</div>
              </div>
            </div>

            <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
              <button onclick="TabProfessors.openEditProfModal('${p._id}')" class="px-2.5 py-1 border border-klein/30 text-klein hover:border-klein font-mono text-xs font-bold">
                <i class="fa-solid fa-pen"></i> ${t('common.edit')}
              </button>
              <button onclick="TabProfessors.confirmDeleteProf('${p._id}', '${p.name}')" class="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-mono text-xs font-bold transition-colors">
                <i class="fa-solid fa-trash"></i> ${t('common.delete')}
              </button>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.error('[TabProfessors loadProfessors Error]:', e);
    }
  }

  function openAddProfModal() {
    AdminApp.showModal(`
      <div class="max-w-md bg-white border-2 border-klein p-6 space-y-4 crosshair-corner max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-klein/20 pb-3">
          <h3 class="font-heading font-bold text-lg text-klein uppercase">${t('profs.modalAddTitle')}</h3>
          <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <form id="form-add-prof" onsubmit="TabProfessors.submitAddProf(event)" class="space-y-3 font-mono text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-klein mb-1">${t('profs.nameLabel')}</label>
              <input name="name" type="text" required placeholder="Dr. Smith" class="w-full p-2.5 border border-klein/30" />
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('profs.titleLabel')}</label>
              <input name="title" type="text" value="副教授 (Associate Prof)" class="w-full p-2.5 border border-klein/30" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('profs.deptLabel')}</label>
            <select name="department" class="w-full p-2.5 border border-klein/30">
              <option value="CS">資訊工程學系 (CS)</option>
              <option value="IM">資訊管理學系 (IM)</option>
              <option value="AI">人工智慧學系 (AI)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('profs.labNameLabel')}</label>
            <input name="labName" type="text" placeholder="Cloud Architecture Lab" class="w-full p-2.5 border border-klein/30" />
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('profs.fieldsLabel')}</label>
            <input name="researchFields" type="text" placeholder="Cloud Computing, Kubernetes, DevOps" class="w-full p-2.5 border border-klein/30" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-klein mb-1">${t('profs.officeLabel')}</label>
              <input name="office" type="text" placeholder="Building Room 412" class="w-full p-2.5 border border-klein/30" />
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">Email</label>
              <input name="email" type="email" placeholder="prof@pu.edu.tw" class="w-full p-2.5 border border-klein/30" />
            </div>
          </div>

          <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
            <button type="button" onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
            <button type="submit" class="px-4 py-2 bg-klein text-white font-bold hover:bg-deep-klein">${t('profs.btnCreate')}</button>
          </div>
        </form>
      </div>
    `);
  }

  async function submitAddProf(e) {
    e.preventDefault();
    const form = document.getElementById('form-add-prof');
    const formData = new FormData(form);

    const fields = (formData.get('researchFields') || '').split(',').map(s => s.trim()).filter(Boolean);
    formData.set('researchFields', JSON.stringify(fields));

    const res = await CareerDNA_DB.adminApiCall('/api/admin/professors', {
      method: 'POST',
      body: formData
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '師資資料建立成功！' : 'Faculty entry created!', 'success');
      loadProfessors();
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  async function openEditProfModal(id) {
    try {
      const res = await CareerDNA_DB.adminApiCall('/api/admin/professors');
      const p = (res?.professors || []).find(item => item._id === id);
      if (!p) return;

      AdminApp.showModal(`
        <div class="max-w-md bg-white border-2 border-klein p-6 space-y-4 crosshair-corner max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-klein/20 pb-3">
            <h3 class="font-heading font-bold text-lg text-klein uppercase">${t('profs.modalEditTitle')}</h3>
            <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
          </div>

          <form id="form-edit-prof" onsubmit="TabProfessors.submitEditProf(event, '${id}')" class="space-y-3 font-mono text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-klein mb-1">${t('profs.nameLabel')}</label>
                <input name="name" type="text" required value="${p.name || ''}" class="w-full p-2.5 border border-klein/30" />
              </div>
              <div>
                <label class="block font-bold text-klein mb-1">${t('profs.titleLabel')}</label>
                <input name="title" type="text" value="${p.title || '副教授'}" class="w-full p-2.5 border border-klein/30" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-klein mb-1">${t('profs.deptLabel')}</label>
              <select name="department" class="w-full p-2.5 border border-klein/30">
                <option value="CS" ${p.department === 'CS' ? 'selected' : ''}>資訊工程學系 (CS)</option>
                <option value="IM" ${p.department === 'IM' ? 'selected' : ''}>資訊管理學系 (IM)</option>
                <option value="AI" ${p.department === 'AI' ? 'selected' : ''}>人工智慧學系 (AI)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-klein mb-1">${t('profs.labNameLabel')}</label>
              <input name="labName" type="text" value="${p.labName || ''}" class="w-full p-2.5 border border-klein/30" />
            </div>

            <div>
              <label class="block font-bold text-klein mb-1">${t('profs.fieldsLabel')}</label>
              <input name="researchFields" type="text" value="${(p.researchFields || []).join(', ')}" class="w-full p-2.5 border border-klein/30" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-klein mb-1">${t('profs.officeLabel')}</label>
                <input name="office" type="text" value="${p.office || ''}" class="w-full p-2.5 border border-klein/30" />
              </div>
              <div>
                <label class="block font-bold text-klein mb-1">Email</label>
                <input name="email" type="email" value="${p.email || ''}" class="w-full p-2.5 border border-klein/30" />
              </div>
            </div>

            <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
              <button type="button" onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
              <button type="submit" class="px-4 py-2 bg-klein text-white font-bold hover:bg-deep-klein">${t('common.save')}</button>
            </div>
          </form>
        </div>
      `);
    } catch (e) {
      AdminApp.showToast(e.message, 'error');
    }
  }

  async function submitEditProf(e, id) {
    e.preventDefault();
    const form = document.getElementById('form-edit-prof');
    const formData = new FormData(form);

    const fields = (formData.get('researchFields') || '').split(',').map(s => s.trim()).filter(Boolean);
    formData.set('researchFields', JSON.stringify(fields));

    const res = await CareerDNA_DB.adminApiCall(`/api/admin/professors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: formData
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '教授資料已更新！' : 'Faculty entry updated!', 'success');
      loadProfessors();
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  function confirmDeleteProf(id, name) {
    AdminApp.showModal(`
      <div class="max-w-sm bg-white border-2 border-rose-600 p-6 space-y-4 crosshair-corner">
        <div class="flex items-center gap-3 text-rose-600">
          <i class="fa-solid fa-trash text-2xl"></i>
          <h3 class="font-heading font-black text-lg uppercase">${t('profs.modalDeleteTitle')}</h3>
        </div>
        <p class="font-mono text-xs text-slate-700">${t('profs.deleteConfirmMsg', { name })}</p>
        <div class="pt-3 flex justify-end gap-2 font-mono text-xs font-bold">
          <button onclick="AdminApp.closeModal()" class="px-3 py-1.5 border border-slate-300 text-slate-700">${t('common.cancel')}</button>
          <button onclick="TabProfessors.executeDeleteProf('${id}')" class="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700">${t('common.delete')}</button>
        </div>
      </div>
    `);
  }

  async function executeDeleteProf(id) {
    const res = await CareerDNA_DB.adminApiCall(`/api/admin/professors/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '教授名錄已刪除' : 'Entry deleted', 'success');
      loadProfessors();
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  return {
    render,
    init,
    loadProfessors,
    openAddProfModal,
    submitAddProf,
    openEditProfModal,
    submitEditProf,
    confirmDeleteProf,
    executeDeleteProf
  };
})();
