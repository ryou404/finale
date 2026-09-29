/**
 * Admin Component: TabRag (MongoDB Atlas Vector Search & RAG Knowledge Management)
 * Fully Internationalized (Traditional Chinese zh-TW & English en) via AdminI18N
 */
window.TabRag = (function () {
  let documents = [];

  const t = (k, p, f) => window.AdminI18N ? window.AdminI18N.t(k, p, f) : (f || k);

  function render() {
    return `
      <section id="panel-rag" class="hidden w-full space-y-4">
        <!-- RAG Vector Search HUD Banner -->
        <div class="bg-gradient-to-r from-blue-900 via-klein to-indigo-900 text-white p-5 border-2 border-klein shadow-sm crosshair-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 bg-emerald-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest mb-1.5">
              <i class="fa-solid fa-brain"></i> MONGODB ATLAS // VECTOR SEARCH 1536-D
            </div>
            <h3 class="font-heading font-black text-xl md:text-2xl tracking-tight">RAG Knowledge Base & Vector Retrieval</h3>
            <p class="font-mono text-xs text-white/80 mt-0.5">${t('rag.bannerSub', {}, '管理知識庫文檔、匯入課程綱要與 FAQ，提供 AI Chatbot 向量搜尋')}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="TabRag.openUploadModal('text')" class="btn-cyber px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg">
              <i class="fa-solid fa-file-circle-plus"></i> <span>${t('rag.btnUploadText', {}, '+ 匯入純文字 / FAQ')}</span>
            </button>
            <button onclick="TabRag.openUploadModal('file')" class="btn-cyber px-4 py-2.5 bg-flame-orange hover:bg-orange-600 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-lg">
              <i class="fa-solid fa-cloud-arrow-up"></i> <span>${t('rag.btnUploadFile', {}, '📁 上傳文檔 (.md, .txt)')}</span>
            </button>
          </div>
        </div>

        <!-- Metrics Overview Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-white border-2 border-klein p-3.5 shadow-sm crosshair-corner">
            <div class="text-[10px] font-mono font-bold text-klein/60 uppercase">${t('rag.totalDocs', {}, '文檔總數')}</div>
            <div id="rag-stat-total-docs" class="text-2xl font-heading font-black text-klein mt-1">0</div>
          </div>
          <div class="bg-white border-2 border-klein p-3.5 shadow-sm crosshair-corner">
            <div class="text-[10px] font-mono font-bold text-klein/60 uppercase">${t('rag.totalChunks', {}, '向量切片總數')}</div>
            <div id="rag-stat-total-chunks" class="text-2xl font-heading font-black text-emerald-600 mt-1">0</div>
          </div>
          <div class="bg-white border-2 border-klein p-3.5 shadow-sm crosshair-corner">
            <div class="text-[10px] font-mono font-bold text-klein/60 uppercase">${t('rag.vectorDim', {}, '向量維度')}</div>
            <div class="text-2xl font-heading font-black text-blue-600 mt-1">1536 D</div>
          </div>
          <div class="bg-white border-2 border-klein p-3.5 shadow-sm crosshair-corner">
            <div class="text-[10px] font-mono font-bold text-klein/60 uppercase">${t('rag.model', {}, 'Embedding 模型')}</div>
            <div class="text-sm font-mono font-bold text-indigo-700 mt-2 truncate" title="text-embedding-3-small">text-embedding-3-small</div>
          </div>
        </div>

        <!-- Document Search & Action Bar -->
        <div class="bg-white border-2 border-klein p-4 shadow-sm crosshair-corner flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1">
            <div class="relative flex-1 min-w-[220px]">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-klein/40 text-xs"></i>
              <input id="rag-search-input" oninput="TabRag.filterLocal()" type="text" placeholder="${t('rag.searchPlaceholder', {}, '搜尋標題、文檔 ID...')}" class="w-full pl-9 pr-3 py-2 bg-white border border-klein/30 focus:border-klein font-mono text-xs focus:outline-none" />
            </div>

            <button onclick="TabRag.openTestSearchModal()" class="px-3.5 py-2 bg-indigo-50 border border-indigo-400 text-indigo-800 hover:bg-indigo-600 hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5">
              <i class="fa-solid fa-microscope"></i> <span>${t('rag.btnTestSearch', {}, '測試向量檢索 (Test Search)')}</span>
            </button>
          </div>

          <button onclick="TabRag.loadDocuments()" class="px-3.5 py-2 bg-white border border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5">
            <i class="fa-solid fa-rotate"></i> <span>${t('rag.btnRefresh', {}, '重新整理')}</span>
          </button>
        </div>

        <!-- Documents Table -->
        <div class="bg-white border-2 border-klein shadow-sm crosshair-corner overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead class="bg-klein/5 border-b-2 border-klein text-klein font-bold uppercase tracking-wider">
                <tr>
                  <th class="p-3.5">${t('rag.thTitle', {}, '文檔標題')}</th>
                  <th class="p-3.5">${t('rag.thDocId', {}, 'Document ID')}</th>
                  <th class="p-3.5">${t('rag.thScope', {}, '範圍 (Scope)')}</th>
                  <th class="p-3.5 text-center">${t('rag.thChunks', {}, '切片數量')}</th>
                  <th class="p-3.5">${t('rag.thSource', {}, '來源')}</th>
                  <th class="p-3.5">${t('rag.thUpdated', {}, '更新時間')}</th>
                  <th class="p-3.5 text-right">${t('rag.thActions', {}, '操作')}</th>
                </tr>
              </thead>
              <tbody id="rag-documents-tbody" class="divide-y divide-klein/10">
                <tr>
                  <td colspan="7" class="p-8 text-center text-klein/50 font-mono">
                    <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> ${t('rag.loadingDocs', {}, '正在載入知識庫向量文檔...')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function init() {
    // Component initialized
  }

  async function loadDocuments() {
    const tbody = document.getElementById('rag-documents-tbody');
    if (!tbody) return;

    try {
      const user = CareerDNA_DB.getCurrentUser();
      const adminUid = user?.uid || user?._id || '';

      const res = await fetch('/api/rag/documents?scope=all&limit=100', {
        headers: { 'x-admin-uid': adminUid }
      });
      const data = await res.json();

      if (data.status === 'ok') {
        documents = data.documents || [];
        renderTable(documents);
        updateStats(documents);
      } else {
        throw new Error(data.message || 'Failed to load documents');
      }
    } catch (err) {
      console.error('[TabRag] Load error:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center text-red-500 font-mono">
            <i class="fa-solid fa-triangle-exclamation mr-2"></i> ${err.message}
          </td>
        </tr>
      `;
    }
  }

  function updateStats(docs) {
    const totalDocsEl = document.getElementById('rag-stat-total-docs');
    const totalChunksEl = document.getElementById('rag-stat-total-chunks');
    const badgeEl = document.getElementById('badge-rag-count');

    const totalDocs = docs.length;
    const totalChunks = docs.reduce((sum, d) => sum + (d.totalChunks || 0), 0);

    if (totalDocsEl) totalDocsEl.textContent = totalDocs;
    if (totalChunksEl) totalChunksEl.textContent = totalChunks;
    if (badgeEl) badgeEl.textContent = totalDocs;
  }

  function renderTable(docs) {
    const tbody = document.getElementById('rag-documents-tbody');
    if (!tbody) return;

    if (!docs || docs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center text-klein/50 font-mono">
            <i class="fa-solid fa-folder-open text-2xl mb-2 block opacity-40"></i>
            ${t('rag.noDocs', {}, '知識庫中尚無文檔。請點擊上方按鈕匯入課程綱要或 FAQ。')}
          </td>
        </tr>
      `;
      return;
    }

    const currentLang = window.AdminI18N ? window.AdminI18N.getLang() : 'zh';
    const localeStr = currentLang === 'en' ? 'en-US' : 'zh-TW';

    tbody.innerHTML = docs.map(doc => {
      const isPublic = doc.scope === 'public';
      const scopeBadge = isPublic
        ? `<span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Public</span>`
        : `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">User: ${doc.userId || 'N/A'}</span>`;

      const updatedStr = doc.updatedAt ? new Date(doc.updatedAt).toLocaleString(localeStr) : '-';

      return `
        <tr class="hover:bg-klein/[0.02] transition-colors">
          <td class="p-3.5 font-bold text-klein">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-file-lines text-klein/60"></i>
              <span class="max-w-[280px] truncate" title="${escapeHtml(doc.title)}">${escapeHtml(doc.title)}</span>
            </div>
          </td>
          <td class="p-3.5 font-mono text-[11px] text-klein/70">
            <span class="bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">${escapeHtml(doc.docId)}</span>
          </td>
          <td class="p-3.5">${scopeBadge}</td>
          <td class="p-3.5 text-center">
            <span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-xs">${doc.totalChunks || 0} chunks</span>
          </td>
          <td class="p-3.5 text-klein/70">
            ${doc.metadata?.source || 'system'}
          </td>
          <td class="p-3.5 text-klein/60 text-[11px]">${updatedStr}</td>
          <td class="p-3.5 text-right space-x-1.5">
            <button onclick="TabRag.deleteDoc('${doc.docId}', '${escapeHtml(doc.title)}')" class="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-300 font-bold text-[11px] transition-all">
              <i class="fa-solid fa-trash-can mr-1"></i> ${t('rag.btnDelete', {}, '刪除')}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function filterLocal() {
    const q = (document.getElementById('rag-search-input')?.value || '').toLowerCase().trim();
    if (!q) {
      renderTable(documents);
      return;
    }
    const filtered = documents.filter(d => 
      (d.title || '').toLowerCase().includes(q) ||
      (d.docId || '').toLowerCase().includes(q)
    );
    renderTable(filtered);
  }

  function openUploadModal(mode = 'text') {
    const modalHtml = `
      <div class="bg-white border-4 border-klein shadow-2xl p-6 w-full font-mono">
        <div class="flex items-center justify-between border-b-2 border-klein pb-3 mb-4">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-brain text-klein text-lg"></i>
            <h3 class="font-heading font-black text-lg text-klein uppercase">${t('rag.modalUploadTitle', {}, '匯入知識庫文檔 (Vector Ingestion)')}</h3>
          </div>
          <button onclick="AdminApp.closeModal()" class="text-klein/50 hover:text-klein text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="flex border-b border-klein/20 mb-4 text-xs font-bold uppercase">
          <button id="tab-btn-text" onclick="TabRag.switchModalSubTab('text')" class="px-4 py-2 border-b-2 border-klein text-klein">
            ${t('rag.btnUploadText', {}, '輸入文字 / FAQ')}
          </button>
          <button id="tab-btn-file" onclick="TabRag.switchModalSubTab('file')" class="px-4 py-2 text-klein/50 border-b-2 border-transparent hover:text-klein">
            ${t('rag.btnUploadFile', {}, '上傳檔案 (.md, .txt)')}
          </button>
        </div>

        <!-- SubTab: Text Ingestion -->
        <div id="modal-sub-text" class="${mode === 'text' ? '' : 'hidden'} space-y-3">
          <div>
            <label class="block text-xs font-bold text-klein mb-1">${t('rag.titleLabel', {}, '文檔標題 (*)')}</label>
            <input id="rag-input-title" type="text" placeholder="${t('rag.titlePlaceholder', {}, '例如：靜宜大學人工智慧系 115 學年度課綱...')}" class="w-full p-2.5 border border-klein/40 focus:border-klein text-xs font-mono focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-klein mb-1">分類標籤 (Category)</label>
            <input id="rag-input-category" type="text" value="FAQ" class="w-full p-2.5 border border-klein/40 focus:border-klein text-xs font-mono focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-klein mb-1">${t('rag.contentLabel', {}, '純文字 / Markdown 內容 (*)')}</label>
            <textarea id="rag-input-content" rows="10" placeholder="${t('rag.contentPlaceholder', {}, '貼上 Markdown 課程內容或常見問答 FAQ...')}" class="w-full p-2.5 border border-klein/40 focus:border-klein text-xs font-mono focus:outline-none"></textarea>
          </div>
        </div>

        <!-- SubTab: File Upload -->
        <div id="modal-sub-file" class="${mode === 'file' ? '' : 'hidden'} space-y-3">
          <div>
            <label class="block text-xs font-bold text-klein mb-1">${t('rag.titleLabel', {}, '文檔標題 (選填)')}</label>
            <input id="rag-file-title" type="text" placeholder="${t('rag.titlePlaceholder', {}, '留空則自動使用檔案名稱')}" class="w-full p-2.5 border border-klein/40 focus:border-klein text-xs font-mono focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-klein mb-1">${t('rag.fileLabel', {}, '選擇文檔檔案 (*.md, *.txt, *.json)')}</label>
            <input id="rag-file-input" type="file" accept=".txt,.md,.json" class="w-full p-2.5 border border-klein/40 focus:border-klein text-xs font-mono focus:outline-none" />
          </div>
          <div class="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs">
            ℹ️ Supports Markdown (.md), Text (.txt), JSON (.json) up to 10MB.
          </div>
        </div>

        <div id="rag-ingest-status" class="hidden mt-3 p-3 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold">
          <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> ${t('rag.ingesting', {}, '正在生成向量並儲存至 Atlas...')}
        </div>

        <div class="mt-5 pt-3 border-t border-klein/20 flex items-center justify-end gap-2">
          <button onclick="AdminApp.closeModal()" class="px-4 py-2 border border-klein text-klein hover:bg-klein/10 text-xs font-bold">
            ${t('common.cancel', {}, '取消')}
          </button>
          <button id="rag-submit-btn" onclick="TabRag.submitIngest()" class="px-5 py-2 bg-klein hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2">
            <i class="fa-solid fa-bolt"></i> <span>${t('rag.btnSubmitIngest', {}, '開始向量化並儲存至 Atlas')}</span>
          </button>
        </div>
      </div>
    `;

    AdminApp.showModal(modalHtml);
  }

  function switchModalSubTab(tab) {
    const isText = tab === 'text';
    document.getElementById('modal-sub-text')?.classList.toggle('hidden', !isText);
    document.getElementById('modal-sub-file')?.classList.toggle('hidden', isText);

    const btnText = document.getElementById('tab-btn-text');
    const btnFile = document.getElementById('tab-btn-file');

    if (btnText && btnFile) {
      btnText.className = isText ? 'px-4 py-2 border-b-2 border-klein text-klein' : 'px-4 py-2 text-klein/50 border-b-2 border-transparent hover:text-klein';
      btnFile.className = !isText ? 'px-4 py-2 border-b-2 border-klein text-klein' : 'px-4 py-2 text-klein/50 border-b-2 border-transparent hover:text-klein';
    }
  }

  async function submitIngest() {
    const isTextMode = !document.getElementById('modal-sub-text')?.classList.contains('hidden');
    const statusBox = document.getElementById('rag-ingest-status');
    const submitBtn = document.getElementById('rag-submit-btn');

    const user = CareerDNA_DB.getCurrentUser();
    const adminUid = user?.uid || user?._id || '';

    try {
      if (statusBox) statusBox.classList.remove('hidden');
      if (submitBtn) submitBtn.disabled = true;

      if (isTextMode) {
        const title = (document.getElementById('rag-input-title')?.value || '').trim();
        const category = (document.getElementById('rag-input-category')?.value || 'General').trim();
        const content = (document.getElementById('rag-input-content')?.value || '').trim();

        if (!title) throw new Error('Please enter document title / 請輸入文檔標題');
        if (!content) throw new Error('Please enter document content / 請輸入文檔內容');

        const res = await fetch('/api/rag/ingest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-uid': adminUid
          },
          body: JSON.stringify({
            title,
            content,
            scope: 'public',
            metadata: { category, source: 'admin_panel' }
          })
        });

        const data = await res.json();
        if (data.status !== 'ok') throw new Error(data.message || 'Ingestion failed');

        AdminApp.closeModal();
        AdminApp.showToast(`✅ "${data.data.title}" (${data.data.totalChunks} chunks)`, 'success');
        loadDocuments();
      } else {
        const fileInput = document.getElementById('rag-file-input');
        const title = (document.getElementById('rag-file-title')?.value || '').trim();

        if (!fileInput?.files?.[0]) throw new Error('Please select a file / 請選擇檔案');

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        if (title) formData.append('title', title);
        formData.append('scope', 'public');

        const res = await fetch('/api/rag/upload-file', {
          method: 'POST',
          headers: { 'x-admin-uid': adminUid },
          body: formData
        });

        const data = await res.json();
        if (data.status !== 'ok') throw new Error(data.message || 'File upload failed');

        AdminApp.closeModal();
        AdminApp.showToast(`✅ "${data.data.title}" uploaded!`, 'success');
        loadDocuments();
      }
    } catch (err) {
      console.error('[TabRag] Submit error:', err);
      if (statusBox) {
        statusBox.className = 'mt-3 p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold';
        statusBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ${err.message}`;
        statusBox.classList.remove('hidden');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function deleteDoc(docId, title) {
    const confirmMsg = t('rag.deleteConfirm', { title }, `確定要刪除「${title}」及其向量切片嗎？`);
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const user = CareerDNA_DB.getCurrentUser();
      const adminUid = user?.uid || user?._id || '';

      const res = await fetch(`/api/rag/documents/${encodeURIComponent(docId)}`, {
        method: 'DELETE',
        headers: { 'x-admin-uid': adminUid }
      });

      const data = await res.json();
      if (data.status === 'ok') {
        AdminApp.showToast(`🗑️ ${data.message}`, 'success');
        loadDocuments();
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('[TabRag] Delete error:', err);
      AdminApp.showToast(`❌ ${err.message}`, 'error');
    }
  }

  function openTestSearchModal() {
    const modalHtml = `
      <div class="bg-white border-4 border-klein shadow-2xl p-6 w-full font-mono">
        <div class="flex items-center justify-between border-b-2 border-klein pb-3 mb-4">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-microscope text-indigo-600 text-lg"></i>
            <h3 class="font-heading font-black text-lg text-klein uppercase">${t('rag.testModalTitle', {}, '測試 Atlas 混合搜尋 (Hybrid Search Test)')}</h3>
          </div>
          <button onclick="AdminApp.closeModal()" class="text-klein/50 hover:text-klein text-xl">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-3">
          <div class="flex gap-2">
            <input id="test-search-query" type="text" placeholder="${t('rag.testQueryPlaceholder', {}, '例如：人工智慧系 1776 網頁前端程式設計...')}" class="flex-1 p-2.5 border border-klein/40 focus:border-klein text-xs font-mono focus:outline-none" />
            <button onclick="TabRag.runTestSearch()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5">
              <i class="fa-solid fa-magnifying-glass"></i> ${t('rag.btnRunTest', {}, '檢索')}
            </button>
          </div>

          <div id="test-search-results" class="border border-klein/20 p-3 max-h-[350px] overflow-y-auto space-y-2 text-xs bg-slate-50">
            <div class="text-slate-400 text-center py-6">${t('rag.testEmptyPrompt', {}, '請輸入查詢詞彙並點擊檢索')}</div>
          </div>
        </div>
      </div>
    `;
    AdminApp.showModal(modalHtml);
  }

  async function runTestSearch() {
    const q = (document.getElementById('test-search-query')?.value || '').trim();
    const resultsBox = document.getElementById('test-search-results');
    if (!q || !resultsBox) return;

    resultsBox.innerHTML = `<div class="text-indigo-600 text-center py-4"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> ${t('rag.testing', {}, '檢索中...')}</div>`;

    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 6 })
      });

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        resultsBox.innerHTML = `<div class="text-amber-600 text-center py-4">${t('rag.testNoResults', {}, '未檢索到相關文檔切片。')}</div>`;
        return;
      }

      resultsBox.innerHTML = data.results.map((r, i) => `
        <div class="p-3 bg-white border border-klein/20 shadow-sm space-y-1">
          <div class="flex items-center justify-between font-bold">
            <span class="text-klein">[${i + 1}] 《${escapeHtml(r.title)}》</span>
            <div class="flex items-center gap-1.5">
              ${r.matchedVia ? `<span class="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5">${escapeHtml(r.matchedVia)}</span>` : ''}
              <span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-bold">Score: ${(r.score || 0).toFixed(4)}</span>
            </div>
          </div>
          <div class="text-slate-700 font-mono text-[11px] whitespace-pre-wrap">${escapeHtml(r.text)}</div>
        </div>
      `).join('');
    } catch (err) {
      resultsBox.innerHTML = `<div class="text-red-500 text-center py-4">Error: ${err.message}</div>`;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    render,
    init,
    loadDocuments,
    filterLocal,
    openUploadModal,
    switchModalSubTab,
    submitIngest,
    deleteDoc,
    openTestSearchModal,
    runTestSearch
  };
})();
