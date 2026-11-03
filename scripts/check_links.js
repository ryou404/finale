/**
 * 檢查個人品牌知識庫裡的人物 / 平台連結是否仍可開啟。
 * 用法：node scripts/check_links.js
 *
 * - 一般連結：回傳 2xx/3xx 視為通過。
 * - 標記 botBlocked 的連結 (例如有防機器人機制的網站)：403/429 只提醒「請用瀏覽器手動確認」，不算失敗。
 * - 任何連結失敗，結束碼為 1。連結失效時請更新 static/brand-knowledge.js，並重新填 verifiedAt。
 */
const KB = require('../static/brand-knowledge.js');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

async function check(url) {
    for (const method of ['HEAD', 'GET']) {
        try {
            const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
            if (res.status < 400 || method === 'GET') return res.status;
        } catch (e) {
            if (method === 'GET') return `ERR ${e.cause && e.cause.code ? e.cause.code : e.message}`;
        }
    }
    return 'ERR';
}

(async () => {
    const targets = [];
    Object.entries(KB.creators).forEach(([id, c]) => targets.push({ kind: 'creator', id, url: c.url, botBlocked: !!c.botBlocked, review: !!c.needsTeamReview }));
    Object.entries(KB.platforms).forEach(([id, p]) => targets.push({ kind: 'platform', id, url: p.url, botBlocked: ['linkedin', 'instagram', 'behance', 'medium'].includes(id) }));

    let failed = 0;
    for (const t of targets) {
        const status = await check(t.url);
        const ok = typeof status === 'number' && status < 400;
        const soft = !ok && t.botBlocked && (status === 403 || status === 429 || status === 999 || String(status).startsWith('ERR'));
        if (!ok && !soft) failed++;
        const mark = ok ? 'OK  ' : (soft ? 'WARN' : 'FAIL');
        console.log(`${mark} ${String(status).padEnd(10)} ${t.kind.padEnd(8)} ${t.id.padEnd(16)} ${t.url}${t.review ? '   (需團隊再確認內容)' : ''}${soft ? '   (網站擋機器人，請用瀏覽器手動確認)' : ''}`);
    }
    console.log(failed ? `\n${failed} 個連結失敗` : '\n全部連結通過');
    process.exit(failed ? 1 : 0);
})();
