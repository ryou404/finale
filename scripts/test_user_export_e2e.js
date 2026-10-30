const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
    console.log('Launching headless browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });

        const downloadDir = path.resolve(__dirname, '../temp_downloads_real');
        if (fs.existsSync(downloadDir)) {
            fs.rmSync(downloadDir, { recursive: true, force: true });
        }
        fs.mkdirSync(downloadDir, { recursive: true });

        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir
        });

        // Automatically accept pre-export dialogs
        page.on('dialog', async dialog => {
            console.log('Dialog shown:', dialog.message());
            await dialog.accept();
        });

        page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
        page.on('pageerror', err => console.error('BROWSER ERROR:', err));

        console.log('Navigating to http://localhost:3000/career_fit.html...');
        await page.goto('http://localhost:3000/career_fit.html', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#pdf-content', { timeout: 10000 });
        console.log('Found #pdf-content in DOM!');

        // Scroll down to simulate user browsing
        await page.evaluate(() => window.scrollTo(0, 1800));
        await new Promise(r => setTimeout(r, 600));

        const scrollY = await page.evaluate(() => window.scrollY);
        console.log('Window scrollY before clicking export button:', scrollY);

        console.log('Clicking #pdf-export-btn...');
        await page.click('#pdf-export-btn');

        // Wait for download to complete
        console.log('Waiting for PDF to download...');
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
        console.log(`SUCCESS! Downloaded file: ${path.basename(downloadedFile)}, Size: ${stats.size} bytes`);

        const buffer = fs.readFileSync(downloadedFile);
        const str = buffer.toString('latin1');
        const pageCount = (str.match(/\/Type\s*\/Page\b/g) || []).length;
        const imageCount = (str.match(/\/Subtype\s*\/Image\b/g) || []).length;
        console.log(`PDF Verification: Pages: ${pageCount}, Embedded Canvas Images: ${imageCount}`);

        assert.ok(stats.size > 50000, 'PDF file must be substantial (>50KB)');
        assert.strictEqual(pageCount, 2, 'Exported PDF must be exactly 2 pages');
        console.log('PASS: PDF file has verified 2-page A4 structure and substantial binary size.');

    } catch (e) {
        console.error('Test error:', e);
        process.exit(1);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
