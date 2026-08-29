/**
 * Admin Component: TabSystem (Fully Localized)
 */
window.TabSystem = (function () {
  const t = (key, params, fb) => AdminI18N.t(key, params, fb);

  function render() {
    return `
      <section id="panel-system" class="hidden w-full space-y-6">
        <!-- Server Diagnostics Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- MongoDB Health -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner space-y-3">
            <div class="flex items-center justify-between border-b border-klein/10 pb-2">
              <span class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-database"></i> ${t('sys.mongoTitle')}
              </span>
              <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
            <div class="font-mono text-xs space-y-1.5 text-klein/80">
              <div><strong>${t('sys.connected')}</strong></div>
              <div><strong>${t('sys.dbName')}</strong> <span id="sys-db-name">career</span></div>
              <div><strong>${t('sys.dbHost')}</strong> <span id="sys-db-host" class="break-all text-[10px]">Atlas Replica Set</span></div>
            </div>
          </div>

          <!-- Cloudflare R2 Health -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner space-y-3">
            <div class="flex items-center justify-between border-b border-klein/10 pb-2">
              <span class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-cloud"></i> ${t('sys.r2Title')}
              </span>
              <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
            <div class="font-mono text-xs space-y-1.5 text-klein/80">
              <div><strong>${t('sys.r2Bucket')}</strong> <span id="sys-r2-bucket">career</span></div>
              <div><strong>${t('sys.r2Domain')}</strong> <span id="sys-r2-url" class="break-all text-[10px]">pub-*.r2.dev</span></div>
              <div><strong>${t('sys.r2ApiStatus')}</strong> <span class="text-emerald-600 font-bold">Operational (S3 API)</span></div>
            </div>
          </div>

          <!-- Node.js Runtime -->
          <div class="bg-white border-2 border-klein p-5 shadow-sm crosshair-corner space-y-3">
            <div class="flex items-center justify-between border-b border-klein/10 pb-2">
              <span class="font-heading font-bold text-sm text-klein uppercase tracking-wider flex items-center gap-2">
                <i class="fa-brands fa-node-js"></i> ${t('sys.nodeTitle')}
              </span>
              <span class="font-mono text-[10px] text-klein/60">v20+</span>
            </div>
            <div class="font-mono text-xs space-y-1.5 text-klein/80">
              <div><strong>${t('sys.uptime')}</strong> <span id="sys-uptime">--</span></div>
              <div><strong>${t('sys.heap')}</strong> <span id="sys-memory">--</span></div>
              <div><strong>${t('sys.temp')}</strong> <span class="text-flame-orange font-bold">&le; 0.3 (Locked)</span></div>
            </div>
          </div>
        </div>

        <!-- Database Maintenance Tools -->
        <div class="bg-white border-2 border-klein p-6 shadow-sm crosshair-corner space-y-4">
          <div class="flex items-center justify-between border-b border-klein/10 pb-3">
            <h4 class="font-heading font-bold text-base text-klein uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-screwdriver-wrench"></i>
              <span>${t('sys.maintenanceTools')}</span>
            </h4>
            <span class="bg-flame-orange/10 text-flame-orange font-mono text-[10px] font-bold px-2 py-0.5 uppercase">ADMIN ACTIONS</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Reseed Database -->
            <div class="p-4 border border-klein/20 bg-klein/5 space-y-2">
              <div class="font-heading font-bold text-sm text-klein">${t('sys.reseedTitle')}</div>
              <p class="font-mono text-[11px] text-klein/70">${t('sys.reseedDesc')}</p>
              <button onclick="AdminApp.triggerReseed()" class="btn-cyber w-full py-2 bg-klein hover:bg-deep-klein text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                <i class="fa-solid fa-arrows-rotate"></i> ${t('sys.btnReseed')}
              </button>
            </div>

            <!-- Export All JSON -->
            <div class="p-4 border border-klein/20 bg-klein/5 space-y-2">
              <div class="font-heading font-bold text-sm text-klein">${t('sys.backupTitle')}</div>
              <p class="font-mono text-[11px] text-klein/70">${t('sys.backupDesc')}</p>
              <button onclick="TabSystem.exportSystemData()" class="btn-cyber w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                <i class="fa-solid fa-download"></i> ${t('sys.btnBackup')}
              </button>
            </div>

            <!-- Refresh System Status -->
            <div class="p-4 border border-klein/20 bg-klein/5 space-y-2">
              <div class="font-heading font-bold text-sm text-klein">${t('sys.pingTitle')}</div>
              <p class="font-mono text-[11px] text-klein/70">${t('sys.pingDesc')}</p>
              <button onclick="TabSystem.loadSystemStatus(true)" class="btn-cyber w-full py-2 bg-white border-2 border-klein text-klein hover:bg-klein hover:text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                <i class="fa-solid fa-heart-pulse"></i> ${t('sys.btnPing')}
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadSystemStatus(showNotification = false) {
    try {
      const res = await CareerDNA_DB.adminApiCall('/api/admin/system/status');
      if (res && res.status === 'ok') {
        const db = res.database || {};
        const r2 = res.cloudStorage || {};
        const server = res.server || {};

        const dbNameEl = document.getElementById('sys-db-name');
        const dbHostEl = document.getElementById('sys-db-host');
        const r2BucketEl = document.getElementById('sys-r2-bucket');
        const r2UrlEl = document.getElementById('sys-r2-url');
        const uptimeEl = document.getElementById('sys-uptime');
        const memoryEl = document.getElementById('sys-memory');

        if (dbNameEl) dbNameEl.innerText = db.name || 'career';
        if (dbHostEl) dbHostEl.innerText = db.host || 'Atlas Cluster0';

        if (r2BucketEl) r2BucketEl.innerText = r2.bucket || 'career';
        if (r2UrlEl) r2UrlEl.innerText = r2.publicUrl || 'https://pub-*.r2.dev';

        const uptimeMin = Math.floor((server.uptimeSeconds || 0) / 60);
        const uptimeHrs = (uptimeMin / 60).toFixed(1);
        if (uptimeEl) uptimeEl.innerText = `${uptimeHrs} hrs (${server.uptimeSeconds || 0} s)`;
        if (memoryEl) memoryEl.innerText = `${server.memoryUsageMb?.heapUsed || 0} MB / ${server.memoryUsageMb?.heapTotal || 0} MB`;

        if (showNotification) {
          AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '系統狀態與雲端儲存庫連線檢測正常！' : 'System & Cloud storage status is healthy!', 'success');
        }
      }
    } catch (e) {
      console.error('[TabSystem loadSystemStatus Error]:', e);
    }
  }

  async function exportSystemData() {
    try {
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '正在產生系統資料匯出包...' : 'Generating backup package...', 'info');
      const [usersRes, resRes, profsRes, logsRes] = await Promise.all([
        CareerDNA_DB.adminApiCall('/api/admin/users?limit=1000'),
        CareerDNA_DB.adminApiCall('/api/admin/resources?limit=1000'),
        CareerDNA_DB.adminApiCall('/api/admin/professors'),
        CareerDNA_DB.adminApiCall('/api/admin/audit-logs?limit=1000')
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        system: 'CareerDNA Multi-Agent Admin Platform',
        version: '2.0.0',
        users: usersRes.users || [],
        resources: resRes.resources || [],
        professors: profsRes.professors || [],
        auditLogs: logsRes.logs || []
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `careerdna_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      AdminApp.showToast(AdminI18N.getLang() === 'zh' ? '備份檔下載完成！' : 'Backup downloaded successfully!', 'success');
    } catch (e) {
      AdminApp.showToast(e.message, 'error');
    }
  }

  return {
    render,
    loadSystemStatus,
    exportSystemData
  };
})();
