const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
    console.log('=== Starting E2E Resume Refactor Test ===');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });

        const downloadDir = path.resolve(__dirname, '../../temp_downloads_e2e');
        if (fs.existsSync(downloadDir)) {
            fs.rmSync(downloadDir, { recursive: true, force: true });
        }
        fs.mkdirSync(downloadDir, { recursive: true });

        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir
        });

        // Auto-accept confirmation dialogs if any appear
        page.on('dialog', async dialog => {
            console.log('BROWSER DIALOG MESSAGE:', dialog.message());
            await dialog.accept();
        });

        page.on('console', msg => {
            if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
        });

        console.log('1. Navigating to http://localhost:3000/career_fit.html...');
        await page.goto('http://localhost:3000/career_fit.html', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#pdf-content', { timeout: 10000 });
        console.log('✔ Found #pdf-content in DOM');

        // Check Section 03 presence
        const hasProfileCard = await page.$('#resume-profile-card');
        assert.ok(hasProfileCard, 'Section 03 (Resume Profile Card) must be present in DOM');
        console.log('✔ Section 03 (Resume Profile Card) is present');

        // Check initial rendered text for anti-hallucination / no hardcoded fake numbers
        const initialPdfHtml = await page.$eval('#pdf-content', el => el.innerHTML);
        assert.strictEqual(initialPdfHtml.includes('0912-345-678'), false, 'Initial resume must not contain fake phone 0912-345-678');
        assert.strictEqual(initialPdfHtml.includes('student@pu.edu.tw'), false, 'Initial resume must not contain fake email');
        assert.strictEqual(initialPdfHtml.includes('pu-student'), false, 'Initial resume must not contain fake github');
        assert.strictEqual(initialPdfHtml.includes('降低約 25%'), false, 'Initial resume must not contain fake 25%');
        assert.strictEqual(initialPdfHtml.includes('滿意度達 92%'), false, 'Initial resume must not contain fake 92%');
        assert.strictEqual(initialPdfHtml.includes('院級前 15%'), false, 'Initial resume must not contain fake 15%');
        assert.strictEqual(initialPdfHtml.includes('靜宜資訊學士候選人'), false, 'Initial resume must not contain fake name');
        assert.ok(initialPdfHtml.includes('【使用者自行輸入：'), 'Initial resume must contain placeholders');
        console.log('✔ Initial resume verified: ZERO fabricated numbers and clean placeholders');

        // Check JD 对焦表 and Anti-NG Guidance in ai-content
        const aiContentHtml = await page.$eval('#ai-content', el => el.innerHTML);
        assert.ok(aiContentHtml.includes('JD 對焦表'), 'Must display JD 對焦表');
        assert.ok(aiContentHtml.includes('防 NG 履歷與 HR 審查標準核心指引'), 'Must display 防 NG 履歷與 HR 審查標準核心指引');
        assert.ok(aiContentHtml.includes('年級專屬補強路徑'), 'Must display 年級專屬補強路徑');
        console.log('✔ JD 对焦表, Anti-NG guidance, and Grade-specific roadmap verified');

        // 2. Simulate User Switching to Resume Tab & Typing in Profile Card
        console.log('2. Simulating User Switching to Resume Tab & Typing in Profile Card...');
        await page.click('#tab-btn-resume');
        await new Promise(r => setTimeout(r, 400));
        await page.type('#resume-user-name', '陳志明');
        await page.type('#resume-user-engname', 'Chih-Ming Chen');
        await page.type('#resume-user-phone', '0987-654321');
        await page.type('#resume-user-email', 'cm.chen@example.com');
        await page.type('#resume-target-company', '趨勢科技 (Trend Micro)');
        await page.select('#resume-target-role', 'backend');

        // Wait for debounce live generate
        await new Promise(r => setTimeout(r, 600));

        const updatedPdfHtml = await page.$eval('#pdf-content', el => el.innerHTML);
        assert.ok(updatedPdfHtml.includes('陳志明'), 'Resume must display updated name 陳志明');
        assert.ok(updatedPdfHtml.includes('Chih-Ming Chen'), 'Resume must display updated English name');
        assert.ok(updatedPdfHtml.includes('0987-654321'), 'Resume must display updated phone');
        assert.ok(updatedPdfHtml.includes('cm.chen@example.com'), 'Resume must display updated email');
        assert.ok(updatedPdfHtml.includes('趨勢科技 (Trend Micro)'), 'Resume must display updated target company');
        assert.ok(updatedPdfHtml.includes('後端軟體工程師'), 'Resume must display updated target role');
        console.log('✔ Live DOM update verified: User profile correctly reflected in A4 resume');

        // 3. Test Export PDF
        console.log('3. Clicking #pdf-export-btn to test PDF export...');
        await page.click('#pdf-export-btn');

        let downloadedFile = null;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const files = fs.readdirSync(downloadDir);
            const pdf = files.find(f => f.endsWith('.pdf'));
            if (pdf && !pdf.endsWith('.crdownload')) {
                downloadedFile = path.join(downloadDir, pdf);
                break;
            }
        }

        if (!downloadedFile) {
            throw new Error('PDF download timed out or failed!');
        }

        const stats = fs.statSync(downloadedFile);
        console.log(`✔ Downloaded PDF: ${path.basename(downloadedFile)}, Size: ${stats.size} bytes`);
        assert.ok(stats.size > 50000, 'PDF size must be substantial (>50KB)');

        const buffer = fs.readFileSync(downloadedFile);
        const str = buffer.toString('latin1');
        const pageCount = (str.match(/\/Type\s*\/Page\b/g) || []).length;
        console.log(`✔ PDF page count: ${pageCount}`);
        assert.strictEqual(pageCount, 2, 'Exported A4 resume must be exactly 2 pages');

        console.log('=== All E2E Resume Tests PASSED Successfully! ===');
    } catch (err) {
        console.error('E2E TEST FAILURE:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
