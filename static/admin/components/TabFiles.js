/**
 * Admin Component: TabFiles (Cloudflare R2 Storage Manager - Fully Localized)
 */
window.TabFiles = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <section id="panel-files" class="hidden w-full space-y-4">
        <!-- R2 Storage HUD Banner -->
        <div class="bg-gradient-to-r from-klein to-deep-klein text-white p-5 border-2 border-klein shadow-sm crosshair-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 bg-flame-orange text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest mb-1.5">
              <i class="fa-solid fa-cloud"></i> ${t('files.bannerTag')}
            </div>
            <h3 class="font-heading font-black text-xl md:text-2xl tracking-tight">${t('files.bannerTitle')}</h3>
            <p class="font-mono text-xs text-white/80 mt-0.5">${t('files.bannerSub')}</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="TabFiles.openUploadFileModal()" class="btn-cyber px-4 py-2.5 bg-flame-orange hover:bg-orange-600 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg">
              <i class="fa-solid fa-cloud-arrow-up"></i> <span>${t('files.uploadDirect')}</span>
            </button>
          </div>
        </div>

        <!-- Storage Explorer Filter -->
        <div class="bg-white border-2 border-klein p-4 shadow-sm crosshair-corner flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1">
            <div class="relative flex-1 min-w-[200px]">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-klein/40 text-xs"></i>
              <input id="files-search" type="text" placeholder="${t('files.searchPlaceholder')}" class="w-full pl-9 pr-3 py-2 bg-white border border-klein/30 focus:border-klein font-mono text-xs focus:outline-none" />
            </div>

            <select id="files-filter-folder" class="px-3 py-2 bg-white border border-klein/30 font-mono text-xs focus:border-klein focus:outline-none cursor-pointer">
              <option value="all">${t('files.filterFolder')}</option>
              <option value="documents">${t('files.folderDocs')}</option>
              <option value="resources">${t('files.folderRes')}</option>
              <option value="avatars">${t('files.folderAvatars')}</option>
              <option value="professors">${t('files.folderProfs')}</option>
            </select>
          </div>

          <button onclick="TabFiles.loadFiles()" class="px-3 py-2 bg-white border border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-rotate"></i> <span>${t('files.refresh')}</span>
          </button>
        </div>

        <!-- Files Table -->
        <div class="bg-white border-2 border-klein shadow-sm crosshair-corner overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead class="bg-klein/5 border-b-2 border-klein text-klein font-bold uppercase tracking-wider">
                <tr>
                  <th class="p-3.5">${t('files.thName')}</th>
                  <th class="p-3.5">${t('files.thKey')}</th>
                  <th class="p-3.5">${t('files.thSize')}</th>
                  <th class="p-3.5">${t('files.thFolder')}</th>
                  <th class="p-3.5">${t('files.thUploader')}</th>
                  <th class="p-3.5">${t('files.thTime')}</th>
                  <th class="p-3.5 text-right">${t('files.thActions')}</th>
                </tr>
              </thead>
              <tbody id="files-table-tbody" class="divide-y divide-klein/10">
                <tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('files.loading')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function init() {
    ['files-search', 'files-filter-folder'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => loadFiles());
      if (el && el.tagName === 'INPUT') el.addEventListener('input', () => loadFiles());
    });
  }

  async function loadFiles() {
    const search = document.getElementById('files-search')?.value || '';
    const folder = document.getElementById('files-filter-folder')?.value || 'all';

    const tbody = document.getElementById('files-table-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-klein/50 font-mono">${t('files.loading')}</td></tr>`;

    try {
      const res = await CareerDNA_DB.adminApiCall(`/api/admin/files?folder=${folder}&search=${encodeURIComponent(search)}`);
      if (res && res.status === 'ok') {
        const files = res.files || [];
        if (files.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-klein/50 font-mono">${t('files.noFiles')}</td></tr>`;
          return;
        }

        tbody.innerHTML = files.map(f => {
          const sizeKb = Math.round((f.size || 0) / 1024);
          const sizeMb = (sizeKb / 1024).toFixed(2);
          const sizeDisplay = sizeKb > 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

          return `
            <tr class="hover:bg-klein/5 transition-colors">
              <td class="p-3.5 font-bold text-klein">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-file text-sm text-klein/50"></i>
                  <span>${f.originalName || 'file'}</span>
                </div>
              </td>
              <td class="p-3.5 font-mono text-[10px] text-klein/70 break-all max-w-[200px]">${f.key}</td>
              <td class="p-3.5 font-mono text-[11px] font-bold text-klein">${sizeDisplay}</td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 bg-klein/10 text-klein text-[10px] font-mono">${f.folder || 'documents'}</span>
              </td>
              <td class="p-3.5 text-[11px] text-klein/70">${f.uploadedBy || 'admin'}</td>
              <td class="p-3.5 text-[11px] font-mono text-klein/60">${new Date(f.createdAt || Date.now()).toLocaleDateString()}</td>
              <td class="p-3.5 text-right space-x-1">
                <button onclick="AdminApp.copyUrl('${f.url}')" class="p-1.5 bg-klein/10 hover:bg-klein hover:text-white text-klein rounded transition-colors" title="Copy Public CDN URL">
                  <i class="fa-solid fa-copy"></i>
                </button>
                <a href="${f.url}" target="_blank" class="p-1.5 inline-block bg-klein/10 hover:bg-klein hover:text-white text-klein rounded transition-colors" title="Open in new tab">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <button onclick="TabFiles.confirmDeleteFile('${f.key}', '${f.originalName}')" class="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors" title="${t('common.delete')}">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('[TabFiles loadFiles Error]:', e);
    }
  }

  function openUploadFileModal() {
    AdminApp.showModal(`
      <div class="max-w-md bg-white border-2 border-klein p-6 space-y-4 crosshair-corner">
        <div class="flex items-center justify-between border-b border-klein/20 pb-3">
          <h3 class="font-heading font-bold text-lg text-klein uppercase flex items-center gap-2">
            <i class="fa-solid fa-cloud-arrow-up"></i> ${t('files.modalUploadTitle')}
          </h3>
          <button onclick="AdminApp.closeModal()" class="text-klein/40 hover:text-klein text-xl font-bold">&times;</button>
        </div>

        <form id="form-upload-file" onsubmit="TabFiles.submitUploadFile(event)" class="space-y-4 font-mono text-xs">
          <div class="p-4 border-2 border-dashed border-klein/30 bg-klein/5 text-center space-y-2">
            <i class="fa-solid fa-cloud-arrow-up text-3xl text-klein"></i>
            <div class="font-bold text-klein">${t('files.dragUploadHint')}</div>
            <input name="file" type="file" required class="w-full text-xs font-mono file:mr-3 file:py-1.5 file:px-3 file:border file:border-klein file:bg-white file:text-klein file:font-bold hover:file:bg-klein hover:file:text-white" />
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('files.targetFolderLabel')}</label>
            <select name="folder" class="w-full p-2.5 border border-klein/30">
              <option value="documents">${t('files.folderDocs')}</option>
              <option value="resources">${t('files.folderRes')}</option>
              <option value="resumes">履歷與附件目錄 (resumes/)</option>
              <option value="avatars">${t('files.folderAvatars')}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-klein mb-1">${t('files.descLabel')}</label>
            <input name="description" type="text" placeholder="e.g. PU_CS_Internship_Guide_2026.pdf" class="w-full p-2.5 border border-klein/30" />
          </div>

          <div class="pt-3 border-t border-klein/10 flex justify-end gap-2">
            <button type="button" onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein/30 text-klein font-bold">${t('common.cancel')}</button>
            <button type="submit" class="px-4 py-2 bg-flame-orange hover:bg-orange-600 text-white font-bold transition-all shadow-md">
              ${t('files.btnStartUpload')}
            </button>
          </div>
        </form>
      </div>
    `);
  }

  async function submitUploadFile(e) {
    e.preventDefault();
    const form = document.getElementById('form-upload-file');
    const formData = new FormData(form);

    try {
      const res = await CareerDNA_DB.adminApiCall('/api/admin/files/upload', {
        method: 'POST',
        body: formData
      });

      if (res && res.status === 'ok') {
        AdminApp.closeModal();
        AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '檔案已成功上傳至 Cloudflare R2！' : 'File uploaded to R2 successfully!', 'success');
        loadFiles();
      } else {
        AdminApp.showToast(res.message || 'Upload error', 'error');
      }
    } catch (err) {
      AdminApp.showToast(err.message, 'error');
    }
  }

  function confirmDeleteFile(key, name) {
    AdminApp.showModal(`
      <div class="max-w-sm bg-white border-2 border-rose-600 p-6 space-y-4 crosshair-corner">
        <div class="flex items-center gap-3 text-rose-600">
          <i class="fa-solid fa-trash-can text-2xl"></i>
          <h3 class="font-heading font-black text-lg uppercase">${t('files.modalDeleteTitle')}</h3>
        </div>
        <p class="font-mono text-xs text-slate-700">
          ${t('files.deleteConfirmMsg', { name: name || key })}
        </p>
        <div class="pt-3 flex justify-end gap-2 font-mono text-xs font-bold">
          <button onclick="AdminApp.closeModal()" class="px-3 py-1.5 border border-slate-300 text-slate-700">${t('common.cancel')}</button>
          <button onclick="TabFiles.executeDeleteFile('${key}')" class="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700">${t('common.delete')}</button>
        </div>
      </div>
    `);
  }

  async function executeDeleteFile(key) {
    const res = await CareerDNA_DB.adminApiCall('/api/admin/files', {
      method: 'DELETE',
      body: JSON.stringify({ key })
    });

    if (res && res.status === 'ok') {
      AdminApp.closeModal();
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '檔案已自 R2 儲存庫刪除' : 'File purged from R2', 'success');
      loadFiles();
    } else {
      AdminApp.showToast(res.message || 'Error', 'error');
    }
  }

  return {
    render,
    init,
    loadFiles,
    openUploadFileModal,
    submitUploadFile,
    confirmDeleteFile,
    executeDeleteFile
  };
})();
