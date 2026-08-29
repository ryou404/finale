/**
 * Admin Component: TabResources
 * - Full Dynamic Category Management (CRUD with Client Sync)
 * - Multi-File Upload to Cloudflare R2
 * - Multi-Link Builder (GitHub, Docs, External URLs)
 * - Full Bilingual Support
 */
window.TabResources = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);
  let cachedCategories = [];
  let linkCounter = 0;

  function render() {
    return `
      <section id="panel-resources" class="hidden w-full space-y-4">
        <!-- Filter Bar -->
        <div class="bg-white border-2 border-klein p-4 shadow-sm crosshair-corner flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div class="relative flex-1 min-w-[200px]">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-klein/40 text-xs"></i>
              <input id="res-search" type="text" placeholder="${t('res.searchPlaceholder')}" class="w-full pl-9 pr-3 py-2 bg-white border border-klein/30 focus:border-klein font-mono text-xs focus:outline-none" />
            </div>

            <select id="res-filter-cat" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('res.filterCat')}</option>
              <!-- Dynamically populated -->
            </select>

            <select id="res-filter-dept" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('res.filterDept')}</option>
              <option value="資工系">資工系 (CS)</option>
              <option value="資管系">資管系 (IM)</option>
              <option value="人工智慧系">人工智慧系 (AI)</option>
            </select>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="TabResources.openCategoriesModal()" class="px-3 py-2 bg-slate-50 border-2 border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-tags"></i> <span>${t('res.manageCats')}</span>
            </button>
            <button onclick="AdminApp.triggerReseed()" class="px-3 py-2 bg-white border border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5">
              <i class="fa-solid fa-arrows-rotate"></i> <span>${t('res.reseedBtn')}</span>
            </button>
            <button onclick="TabResources.openAddResourceModal()" class="btn-cyber px-4 py-2 bg-klein hover:bg-deep-klein text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
              <i class="fa-solid fa-plus"></i> <span>${t('res.addResource')}</span>
            </button>
          </div>
        </div>

        <!-- Resources Table -->
        <div class="bg-white border-2 border-klein shadow-sm crosshair-corner overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead class="bg-klein/5 border-b-2 border-klein text-klein font-bold uppercase tracking-wider">
                <tr>
                  <th class="p-3.5">${t('res.thTitle')}</th>
                  <th class="p-3.5">${t('res.thCategory')}</th>
                  <th class="p-3.5">${t('res.thDepts')}</th>
                  <th class="p-3.5">${t('res.thFileLink')}</th>
                  <th class="p-3.5">${t('res.thFeatured')}</th>
                  <th class="p-3.5">${t('res.thUpdated')}</th>
                  <th class="p-3.5 text-right">${t('res.thActions')}</th>
                </tr>
              </thead>
              <tbody id="resources-table-tbody" class="divide-y divide-klein/10">
                <tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('res.loading')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function init() {
    ['res-search', 'res-filter-cat', 'res-filter-dept'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => loadResources());
      if (el && el.tagName === 'INPUT') el.addEventListener('input', () => loadResources());
    });
    loadCategories();
  }

  async function loadCategories() {
    try {
      const res = await CareerDNA_DB.adminApiCall('/api/admin/categories');
      if (res && res.status === 'ok') {
        cachedCategories = res.categories || [];
        const select = document.getElementById('res-filter-cat');
        if (select) {
          const currentVal = select.value;
          select.innerHTML = `<option value="all">${t('res.filterCat')}</option>` +
            cachedCategories.map(c => `<option value="${c.name}">${c.icon || '📁'} ${c.name} (${c.resourceCount || 0})</option>`).join('');
          select.value = currentVal || 'all';
        }
      }
    } catch (e) {
      console.warn('[TabResources loadCategories Error]:', e);
    }
  }

  async function loadResources() {
    await loadCategories();
    const search = document.getElementById('res-search')?.value || '';
    const category = document.getElementById('res-filter-cat')?.value || 'all';
    const dept = document.getElementById('res-filter-dept')?.value || 'all';

    const tbody = document.getElementById('resources-table-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('res.loading')}</td></tr>`;

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/resources?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&dept=${encodeURIComponent(dept)}`);
      if (res && res.status === 'ok') {
        const items = res.resources || [];
        if (items.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-klein/50 font-mono">${t('res.noResources')}</td></tr>`;
          return;
        }

        tbody.innerHTML = items.map(r => {
          const filesCount = (r.files && r.files.length) || (r.fileKey ? 1 : 0);
          const linksCount = (r.links && r.links.length) || (r.url && !r.fileKey ? 1 : 0);

          return `
            <tr class="hover:bg-klein/5 transition-colors">
              <td class="p-3.5">
                <div class="flex items-center gap-2.5">
                  <span class="text-xl">${r.icon || '📚'}</span>
                  <div>
                    <span class="font-bold text-klein block">${r.title}</span>
                    <span class="text-[10px] text-klein/50 font-mono">${r.type || '筆記'} · ID: ${r.resourceId || r._id}</span>
                  </div>
                </div>
              </td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 bg-klein/10 text-klein font-bold text-[10px]">${r.category}</span>
              </td>
              <td class="p-3.5">
                <div class="text-[11px] text-klein font-bold">${(r.departments || []).join(', ') || t('common.all')}</div>
                <div class="text-[10px] text-klein/50 font-mono">年級: ${(r.grades || []).map(g => '大' + g).join(', ') || t('common.all')}</div>
              </td>
              <td class="p-3.5">
                <div class="flex flex-col gap-1 font-mono text-[10px]">
                  ${filesCount > 0 ? `
                    <span class="inline-flex items-center gap-1 text-cyan-800 font-bold bg-cyan-50 px-1.5 py-0.5 border border-cyan-200">
                      <i class="fa-solid fa-cloud-arrow-down"></i> ${filesCount} 個 R2 附件
                    </span>
                  ` : ''}
                  ${linksCount > 0 ? `
                    <span class="inline-flex items-center gap-1 text-indigo-800 font-bold bg-indigo-50 px-1.5 py-0.5 border border-indigo-200">
                      <i class="fa-solid fa-link"></i> ${linksCount} 個外部連結
                    </span>
                  ` : ''}
                  ${filesCount === 0 && linksCount === 0 ? `<span class="text-klein/30">${t('res.noFile')}</span>` : ''}
                </div>
              </td>
              <td class="p-3.5">
                ${r.featured ? `<span class="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px]">${t('res.featuredBadge')}</span>` : `<span class="text-klein/30 text-[10px]">${t('res.normalBadge')}</span>`}
              </td>
              <td class="p-3.5 font-mono text-klein/60">${r.updatedAtFormatted || '2026-03'}</td>
              <td class="p-3.5 text-right space-x-1">
                <button onclick="TabResources.openEditResourceModal('${r.resourceId || r._id}')" class="p-1.5 hover:bg-klein/10 text-klein rounded transition-colors" title="${t('common.edit')}">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="TabResources.confirmDeleteResource('${r.resourceId || r._id}', '${r.title.replace(/'/g, "\\'")}')" class="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors" title="${t('common.delete')}">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('[TabResources loadResources Error]:', e);
    }
  }

  // ================= CATEGORY MANAGEMENT MODAL =================
  async function openCategoriesModal() {
    await loadCategories();
    renderCategoriesModalHtml();
  }

  function renderCategoriesModalHtml() {
    AdminApp.showModal(`
      <div class="max-w-2xl bg-white border-2 border-klein p-6 space-y-5 crosshair-corner max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b-2 border-klein pb-3">
          <h3 class="font-heading font-black text-lg text-klein uppercase flex items-center gap-2">
            <i class="fa-solid fa-tags"></i> ${t('res.modalCatTitle')}
          </h3>
          <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <!-- Add Category Form -->
        <form onsubmit="TabResources.submitAddCategory(event)" class="p-4 bg-slate-50 border border-klein/20 space-y-3 font-mono text-xs">
          <div class="font-heading font-bold text-xs text-klein uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-plus"></i> ${t('res.addCategory')}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div class="md:col-span-2">
              <label class="block font-bold text-klein mb-1">${t('res.catName')}</label>
              <input id="new-cat-name" type="text" required placeholder="例如：人工智慧工具" class="w-full p-2 bg-white border border-klein/30" />
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.catNameEn')}</label>
              <input id="new-cat-name-en" type="text" placeholder="AI Tools" class="w-full p-2 bg-white border border-klein/30" />
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.catIcon')}</label>
              <input id="new-cat-icon" type="text" value="🤖" class="w-full p-2 bg-white border border-klein/30" />
            </div>
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('res.catDesc')}</label>
            <input id="new-cat-desc" type="text" placeholder="分類簡短說明..." class="w-full p-2 bg-white border border-klein/30" />
          </div>
          <div class="flex justify-end">
            <button type="submit" class="px-4 py-2 bg-klein hover:bg-deep-klein text-white font-bold transition-all shadow-sm">
              <i class="fa-solid fa-plus mr-1"></i> ${t('res.addCategory')}
            </button>
          </div>
        </form>

        <!-- Current Categories List -->
        <div class="space-y-2 font-mono text-xs">
          <div class="font-heading font-bold text-xs text-klein uppercase tracking-wider">現有分類列表 (Total: ${cachedCategories.length})</div>
          <div class="border border-klein/20 divide-y divide-klein/10 overflow-hidden">
            ${cachedCategories.map(c => `
              <div class="p-3 bg-white hover:bg-klein/5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">${c.icon || '📁'}</span>
                  <div>
                    <strong class="text-klein text-sm block">${c.name} ${c.nameEn ? `<span class="text-xs text-klein/50 font-normal">(${c.nameEn})</span>` : ''}</strong>
                    <span class="text-[11px] text-klein/60">${c.description || '無描述'} · <strong>${c.resourceCount || 0}</strong> 項資源</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <button onclick="TabResources.openEditCategoryModal('${c._id}')" class="p-1.5 hover:bg-klein/10 text-klein rounded" title="${t('common.edit')}">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button onclick="TabResources.deleteCategory('${c._id}', '${c.name.replace(/'/g, "\\'")}')" class="p-1.5 hover:bg-rose-50 text-rose-600 rounded" title="${t('common.delete')}">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="text-right pt-2 border-t border-klein/10">
          <button onclick="AdminApp.closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs font-bold uppercase transition-all">${t('common.close')}</button>
        </div>
      </div>
    `);
  }

  async function submitAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    const nameEn = document.getElementById('new-cat-name-en').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim() || '📚';
    const description = document.getElementById('new-cat-desc').value.trim();

    try {
      const res = await CareerDNA_DB.adminApiCall('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name, nameEn, icon, description })
      });

      if (res && res.status === 'ok') {
        AdminApp.showToast('分類已成功建立並同步！', 'success');
        await loadCategories();
        renderCategoriesModalHtml();
        loadResources();
      } else {
        AdminApp.showToast(res.message || '建立失敗', 'error');
      }
    } catch (err) {
      AdminApp.showToast(err.message, 'error');
    }
  }

  function openEditCategoryModal(id) {
    const c = cachedCategories.find(item => item._id === id || item.categoryId === id);
    if (!c) return;

    AdminApp.showModal(`
      <div class="max-w-md bg-white border-2 border-klein p-6 space-y-4 crosshair-corner">
        <div class="flex items-center justify-between border-b border-klein/20 pb-3">
          <h3 class="font-heading font-bold text-base text-klein uppercase">${t('res.editCategory')}</h3>
          <button onclick="TabResources.openCategoriesModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <form onsubmit="TabResources.submitEditCategory(event, '${id}')" class="space-y-3 font-mono text-xs">
          <div>
            <label class="block font-bold text-klein mb-1">${t('res.catName')}</label>
            <input id="edit-cat-name" type="text" required value="${c.name}" class="w-full p-2.5 border border-klein/30" />
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('res.catNameEn')}</label>
            <input id="edit-cat-name-en" type="text" value="${c.nameEn || ''}" class="w-full p-2.5 border border-klein/30" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.catIcon')}</label>
              <input id="edit-cat-icon" type="text" value="${c.icon || '📚'}" class="w-full p-2.5 border border-klein/30" />
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.catOrder')}</label>
              <input id="edit-cat-order" type="number" value="${c.order || 0}" class="w-full p-2.5 border border-klein/30" />
            </div>
          </div>
          <div>
            <label class="block font-bold text-klein mb-1">${t('res.catDesc')}</label>
            <input id="edit-cat-desc" type="text" value="${c.description || ''}" class="w-full p-2.5 border border-klein/30" />
          </div>

          <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
            <button type="button" onclick="TabResources.openCategoriesModal()" class="px-3 py-1.5 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
            <button type="submit" class="px-4 py-1.5 bg-klein text-white font-bold hover:bg-deep-klein">${t('common.save')}</button>
          </div>
        </form>
      </div>
    `);
  }

  async function submitEditCategory(e, id) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('edit-cat-name').value.trim(),
      nameEn: document.getElementById('edit-cat-name-en').value.trim(),
      icon: document.getElementById('edit-cat-icon').value.trim(),
      order: parseInt(document.getElementById('edit-cat-order').value) || 0,
      description: document.getElementById('edit-cat-desc').value.trim()
    };

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res && res.status === 'ok') {
        AdminApp.showToast('分類已更新！', 'success');
        await loadCategories();
        openCategoriesModal();
        loadResources();
      } else {
        AdminApp.showToast(res.message || '更新失敗', 'error');
      }
    } catch (err) {
      AdminApp.showToast(err.message, 'error');
    }
  }

  async function deleteCategory(id, name) {
    if (!confirm(`確認刪除分類「${name}」？屬於此分類的學習資源將自動調整為「其他」。`)) return;

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (res && res.status === 'ok') {
        AdminApp.showToast('分類已刪除', 'success');
        await loadCategories();
        renderCategoriesModalHtml();
        loadResources();
      } else {
        AdminApp.showToast(res.message || '刪除失敗', 'error');
      }
    } catch (err) {
      AdminApp.showToast(err.message, 'error');
    }
  }

  // ================= ADD / EDIT RESOURCE WITH MULTI-FILES & MULTI-LINKS =================

  function addLinkRow(title = '', url = '', containerId = 'links-builder-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const rowId = `link-row-${++linkCounter}`;
    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'flex items-center gap-2 p-2 bg-white border border-klein/20';
    row.innerHTML = `
      <input type="text" name="link_titles[]" placeholder="${t('res.linkTitle')} (e.g. GitHub Repo)" value="${title}" class="w-1/3 p-1.5 border border-klein/20 focus:border-klein text-xs font-mono" />
      <input type="url" name="link_urls[]" required placeholder="https://..." value="${url}" class="flex-1 p-1.5 border border-klein/20 focus:border-klein text-xs font-mono" />
      <button type="button" onclick="document.getElementById('${rowId}').remove()" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Remove Link">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    container.appendChild(row);
  }

  async function openAddResourceModal() {
    await loadCategories();
    linkCounter = 0;

    AdminApp.showModal(`
      <div class="max-w-2xl bg-white border-2 border-klein p-6 space-y-4 crosshair-corner max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-klein/20 pb-3">
          <h3 class="font-heading font-bold text-lg text-klein uppercase flex items-center gap-2">
            <i class="fa-solid fa-file-circle-plus"></i> ${t('res.modalAddTitle')}
          </h3>
          <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <form id="form-add-resource" onsubmit="TabResources.submitAddResource(event)" class="space-y-4 font-mono text-xs">
          <div>
            <label class="block font-bold text-klein mb-1">${t('res.titleLabel')}</label>
            <input name="title" type="text" required placeholder="例如：2026 計算機網路期末攻略全筆記" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.categoryLabel')}</label>
              <select name="category" class="w-full p-2.5 border border-klein/30 font-bold">
                ${cachedCategories.map(c => `<option value="${c.name}">${c.icon || '📁'} ${c.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.typeLabel')}</label>
              <input name="type" type="text" placeholder="例如：筆記, 教學, PDF, 專案" value="筆記" class="w-full p-2.5 border border-klein/30" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('res.deptsLabel')}</label>
            <div class="flex gap-4 p-2.5 bg-slate-50 border border-klein/20">
              <label class="inline-flex items-center gap-1.5"><input type="checkbox" name="depts" value="資工系" checked> 資工系 (CS)</label>
              <label class="inline-flex items-center gap-1.5"><input type="checkbox" name="depts" value="資管系" checked> 資管系 (IM)</label>
              <label class="inline-flex items-center gap-1.5"><input type="checkbox" name="depts" value="人工智慧系" checked> 人工智慧系 (AI)</label>
            </div>
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('res.gradesLabel')}</label>
            <div class="flex gap-4 p-2.5 bg-slate-50 border border-klein/20">
              <label class="inline-flex items-center gap-1.5"><input type="checkbox" name="grades" value="1" checked> 大一</label>
              <label class="inline-flex items-center gap-1.5"><input type="checkbox" name="grades" value="2" checked> 大二</label>
              <label class="inline-flex items-center gap-1.5"><input type="checkbox" name="grades" value="3" checked> 大三</label>
              <label class="inline-flex items-center gap-1.5"><input type="checkbox" name="grades" value="4" checked> 大四</label>
            </div>
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('res.descLabel')}</label>
            <textarea name="description" rows="2" placeholder="說明資源的涵蓋重點、考試範圍與適合對象..." class="w-full p-2.5 border border-klein/30"></textarea>
          </div>

          <!-- MULTI-FILE UPLOAD SECTION (Cloudflare R2) -->
          <div class="p-3.5 bg-cyan-50/70 border border-cyan-200 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-cyan-900 flex items-center gap-1.5">
                <i class="fa-solid fa-cloud-arrow-up text-cyan-600"></i> ${t('res.multiFilesLabel')}
              </label>
            </div>
            <input name="files" type="file" multiple class="w-full text-xs font-mono file:mr-3 file:py-1.5 file:px-3 file:border file:border-cyan-600 file:bg-white file:text-cyan-800 file:font-bold hover:file:bg-cyan-600 hover:file:text-white cursor-pointer" />
            <p class="text-[11px] text-cyan-700">支援同時選取多個檔案直接上傳至 Cloudflare R2，全球 CDN 邊緣加速下載。</p>
          </div>

          <!-- MULTI-LINKS BUILDER SECTION -->
          <div class="p-3.5 bg-indigo-50/70 border border-indigo-200 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-bold text-indigo-900 flex items-center gap-1.5">
                <i class="fa-solid fa-link text-indigo-600"></i> ${t('res.multiLinksLabel')}
              </label>
              <button type="button" onclick="TabResources.addLinkRow()" class="px-2.5 py-1 bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-colors flex items-center gap-1">
                <i class="fa-solid fa-plus"></i> ${t('res.addLinkBtn')}
              </button>
            </div>
            <div id="links-builder-container" class="space-y-1.5">
              <!-- Dynamically added links -->
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.tagsLabel')}</label>
              <input name="tags" type="text" placeholder="C語言, 演算法, 期末攻略" class="w-full p-2.5 border border-klein/30" />
            </div>
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.iconLabel')}</label>
              <input name="icon" type="text" value="📚" class="w-full p-2.5 border border-klein/30" />
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input name="featured" type="checkbox" id="res-featured-check" class="w-4 h-4 text-klein" />
            <label for="res-featured-check" class="font-bold text-klein cursor-pointer">${t('res.featureCheckbox')}</label>
          </div>

          <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
            <button type="button" onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
            <button type="submit" class="px-5 py-2 bg-klein text-white font-bold hover:bg-deep-klein shadow-md">${t('res.btnUploadPublish')}</button>
          </div>
        </form>
      </div>
    `);

    // Add 1 default empty link row
    addLinkRow('線上閱讀 / 官方文件', 'https://hackmd.io');
  }

  async function submitAddResource(e) {
    e.preventDefault();
    const form = document.getElementById('form-add-resource');
    const formData = new FormData(form);

    const depts = Array.from(form.querySelectorAll('input[name="depts"]:checked')).map(cb => cb.value);
    const grades = Array.from(form.querySelectorAll('input[name="grades"]:checked')).map(cb => parseInt(cb.value));
    formData.set('departments', JSON.stringify(depts));
    formData.set('grades', JSON.stringify(grades));

    const tags = (formData.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean);
    formData.set('tags', JSON.stringify(tags));
    formData.set('featured', form.querySelector('#res-featured-check').checked ? 'true' : 'false');

    // Parse links from dynamic inputs
    const titles = Array.from(form.querySelectorAll('input[name="link_titles[]"]')).map(i => i.value.trim());
    const urls = Array.from(form.querySelectorAll('input[name="link_urls[]"]')).map(i => i.value.trim());
    const links = [];
    urls.forEach((u, idx) => {
      if (u) links.push({ title: titles[idx] || '參考連結', url: u, type: 'link' });
    });
    formData.set('links', JSON.stringify(links));

    try {
      AdminApp.showToast('正在上傳檔案並發布學習資源...', 'info');
      const res = await CareerDNA_DB.adminApiCall('/api/admin/resources', {
        method: 'POST',
        body: formData
      });

      if (res && res.status === 'ok') {
        AdminApp.closeModal();
        AdminApp.showToast('學習資源已成功發布！', 'success');
        loadResources();
      } else {
        AdminApp.showToast(res.message || '發布失敗', 'error');
      }
    } catch (err) {
      AdminApp.showToast(err.message, 'error');
    }
  }

  async function openEditResourceModal(id) {
    await loadCategories();
    linkCounter = 0;

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/resources?search=${encodeURIComponent(id)}`);
      const r = (res?.resources || []).find(item => item.resourceId === id || item._id === id);
      if (!r) {
        AdminApp.showToast('查無此資源', 'error');
        return;
      }

      let existingFiles = r.files || [];
      if (existingFiles.length === 0 && r.fileKey) {
        existingFiles = [{ name: r.fileName || 'attachment', url: r.url, key: r.fileKey, size: r.fileSize || 0 }];
      }

      let existingLinks = r.links || [];
      if (existingLinks.length === 0 && r.url && !r.fileKey) {
        existingLinks = [{ title: '外部連結', url: r.url, type: 'link' }];
      }

      AdminApp.showModal(`
        <div class="max-w-2xl bg-white border-2 border-klein p-6 space-y-4 crosshair-corner max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-klein/20 pb-3">
            <h3 class="font-heading font-bold text-lg text-klein uppercase flex items-center gap-2">
              <i class="fa-solid fa-pen-to-square"></i> ${t('res.modalEditTitle')}
            </h3>
            <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
          </div>

          <form id="form-edit-resource" onsubmit="TabResources.submitEditResource(event, '${id}')" class="space-y-4 font-mono text-xs">
            <div>
              <label class="block font-bold text-klein mb-1">${t('res.titleLabel')}</label>
              <input name="title" type="text" required value="${r.title || ''}" class="w-full p-2.5 border border-klein/30 focus:border-klein focus:outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-klein mb-1">${t('res.categoryLabel')}</label>
                <select name="category" class="w-full p-2.5 border border-klein/30 font-bold">
                  ${cachedCategories.map(c => `<option value="${c.name}" ${r.category === c.name ? 'selected' : ''}>${c.icon || '📁'} ${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-bold text-klein mb-1">${t('res.typeLabel')}</label>
                <input name="type" type="text" value="${r.type || '筆記'}" class="w-full p-2.5 border border-klein/30" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-klein mb-1">${t('res.descLabel')}</label>
              <textarea name="description" rows="2" class="w-full p-2.5 border border-klein/30">${r.description || ''}</textarea>
            </div>

            <!-- EXISTING & NEW MULTI-FILES SECTION -->
            <div class="p-3.5 bg-cyan-50/70 border border-cyan-200 space-y-2">
              <label class="block font-bold text-cyan-900 flex items-center gap-1.5">
                <i class="fa-solid fa-cloud-arrow-up text-cyan-600"></i> ${t('res.multiFilesLabel')}
              </label>

              <!-- Existing Files List -->
              ${existingFiles.length > 0 ? `
                <div class="space-y-1 py-1">
                  <span class="text-[11px] font-bold text-cyan-800">${t('res.existingFiles')}</span>
                  <div id="existing-files-list" class="space-y-1">
                    ${existingFiles.map((f, i) => `
                      <div id="exist-file-${i}" class="flex items-center justify-between p-2 bg-white border border-cyan-200">
                        <div class="flex items-center gap-2 truncate">
                          <i class="fa-solid fa-file text-cyan-600"></i>
                          <span class="truncate font-bold text-cyan-900">${f.name}</span>
                          <span class="text-[10px] text-cyan-700">(${Math.round((f.size || 0)/1024)} KB)</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <a href="${f.url}" target="_blank" class="text-cyan-600 hover:underline text-[10px]">下載</a>
                          <button type="button" onclick="TabResources.removeExistingFile(${i})" class="text-rose-600 hover:text-rose-800 text-xs font-bold" title="移除此檔案">&times;</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Upload Additional Files -->
              <input name="files" type="file" multiple class="w-full text-xs font-mono file:mr-3 file:py-1.5 file:px-3 file:border file:border-cyan-600 file:bg-white file:text-cyan-800 file:font-bold hover:file:bg-cyan-600 hover:file:text-white cursor-pointer" />
              <p class="text-[10px] text-cyan-700">選擇新檔案將自動上傳並增補至此學習資源附件清單。</p>
            </div>

            <!-- MULTI-LINKS BUILDER SECTION -->
            <div class="p-3.5 bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div class="flex items-center justify-between">
                <label class="block font-bold text-indigo-900 flex items-center gap-1.5">
                  <i class="fa-solid fa-link text-indigo-600"></i> ${t('res.multiLinksLabel')}
                </label>
                <button type="button" onclick="TabResources.addLinkRow()" class="px-2.5 py-1 bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-colors flex items-center gap-1">
                  <i class="fa-solid fa-plus"></i> ${t('res.addLinkBtn')}
                </button>
              </div>
              <div id="links-builder-container" class="space-y-1.5">
                <!-- Pre-populated links -->
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-klein mb-1">${t('res.tagsLabel')}</label>
                <input name="tags" type="text" value="${(r.tags || []).join(', ')}" class="w-full p-2.5 border border-klein/30" />
              </div>
              <div>
                <label class="block font-bold text-klein mb-1">${t('res.iconLabel')}</label>
                <input name="icon" type="text" value="${r.icon || '📚'}" class="w-full p-2.5 border border-klein/30" />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input name="featured" type="checkbox" id="res-featured-check-edit" ${r.featured ? 'checked' : ''} class="w-4 h-4 text-klein" />
              <label for="res-featured-check-edit" class="font-bold text-klein cursor-pointer">${t('res.featureCheckbox')}</label>
            </div>

            <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
              <button type="button" onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
              <button type="submit" class="px-5 py-2 bg-klein text-white font-bold hover:bg-deep-klein shadow-md">${t('common.save')}</button>
            </div>
          </form>
        </div>
      `);

      // Store existing files state on window for removal tracking
      window._editingResourceFiles = existingFiles;

      // Populate existing links
      if (existingLinks.length > 0) {
        existingLinks.forEach(l => addLinkRow(l.title, l.url));
      } else {
        addLinkRow('參考網址', r.url || 'https://');
      }
    } catch (e) {
      AdminApp.showToast(e.message, 'error');
    }
  }

  function removeExistingFile(index) {
    if (window._editingResourceFiles && window._editingResourceFiles[index]) {
      window._editingResourceFiles.splice(index, 1);
      const el = document.getElementById(`exist-file-${index}`);
      if (el) el.remove();
      AdminApp.showToast('附件已自待儲存清單中移除', 'info');
    }
  }

  async function submitEditResource(e, id) {
    e.preventDefault();
    const form = document.getElementById('form-edit-resource');
    const formData = new FormData(form);

    const tags = (formData.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean);
    formData.set('tags', JSON.stringify(tags));
    formData.set('featured', form.querySelector('#res-featured-check-edit').checked ? 'true' : 'false');

    // Parse links from dynamic inputs
    const titles = Array.from(form.querySelectorAll('input[name="link_titles[]"]')).map(i => i.value.trim());
    const urls = Array.from(form.querySelectorAll('input[name="link_urls[]"]')).map(i => i.value.trim());
    const links = [];
    urls.forEach((u, idx) => {
      if (u) links.push({ title: titles[idx] || '參考連結', url: u, type: 'link' });
    });
    formData.set('links', JSON.stringify(links));

    // Pass retained existing files
    if (window._editingResourceFiles) {
      formData.set('existingFiles', JSON.stringify(window._editingResourceFiles));
    }

    try {
      AdminApp.showToast('正在更新學習資源與附件...', 'info');
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/resources/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: formData
      });

      if (res && res.status === 'ok') {
        AdminApp.closeModal();
        AdminApp.showToast('學習資源已更新！', 'success');
        loadResources();
      } else {
        AdminApp.showToast(res.message || '更新失敗', 'error');
      }
    } catch (err) {
      AdminApp.showToast(err.message, 'error');
    }
  }

  function confirmDeleteResource(id, title) {
    AdminApp.showModal(`
      <div class="max-w-sm bg-white border-2 border-rose-600 p-6 space-y-4 crosshair-corner">
        <div class="flex items-center gap-3 text-rose-600">
          <i class="fa-solid fa-trash-can text-2xl"></i>
          <h3 class="font-heading font-black text-lg uppercase">${t('res.modalDeleteTitle')}</h3>
        </div>
        <p class="font-mono text-xs text-slate-700">
          ${t('res.deleteConfirmMsg', { title })}
        </p>
        <div class="pt-3 flex justify-end gap-2 font-mono text-xs font-bold">
          <button onclick="AdminApp.closeModal()" class="px-3 py-1.5 border border-slate-300 text-slate-700">${t('common.cancel')}</button>
          <button onclick="TabResources.executeDeleteResource('${id}')" class="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700">${t('common.delete')}</button>
        </div>
      </div>
    `);
  }

  async function executeDeleteResource(id) {
    const res = await CareerDNA_DB.adminApiCall(`/api/admin/resources/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast('學習資源與所有關聯 R2 檔案已刪除', 'success');
      loadResources();
    } else {
      AdminApp.showToast(res.message || '刪除失敗', 'error');
    }
  }

  return {
    render,
    init,
    loadCategories,
    loadResources,
    openCategoriesModal,
    submitAddCategory,
    openEditCategoryModal,
    submitEditCategory,
    deleteCategory,
    addLinkRow,
    removeExistingFile,
    openAddResourceModal,
    submitAddResource,
    openEditResourceModal,
    submitEditResource,
    confirmDeleteResource,
    executeDeleteResource
  };
})();
