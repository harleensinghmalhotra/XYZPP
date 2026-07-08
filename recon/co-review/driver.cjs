// Persistent headed-browser control server for the interactive co-review session.
// Owns ONE Chromium window + page for the whole session. Driven via HTTP.
const http = require('http');
const { URL } = require('url');
const path = require('path');
const { chromium } = require(path.join('d:/WEBSITES/Website University', 'node_modules', 'playwright'));

const SHOTS = 'd:/WEBSITES/Website University/recon/co-review/shots';
const PORT = 8791;
let page, browser;

async function currentScrollY() {
  return await page.evaluate(() => Math.round(window.scrollY));
}

async function boot() {
  browser = await chromium.launch({ headless: false, slowMo: 300, args: ['--window-position=0,0'] });
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 });
  page = await ctx.newPage();
  await page.goto('https://www.alternativinc.com', { waitUntil: 'domcontentloaded', timeout: 90000 });
  // let the preloader + heavy assets settle; site is scroll-pinned
  await page.waitForTimeout(6000);
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    const p = u.pathname;
    if (p === '/health') {
      return res.end(JSON.stringify({ ok: true, scrollY: await currentScrollY() }));
    }
    if (p === '/scroll') {
      // real wheel events, chunked so scrub animations respond naturally
      const dy = parseInt(u.searchParams.get('dy') || '150', 10);
      const step = dy >= 0 ? 30 : -30;
      let done = 0;
      while (Math.abs(done) < Math.abs(dy)) {
        const inc = Math.abs(dy - done) < Math.abs(step) ? (dy - done) : step;
        await page.mouse.wheel(0, inc);
        await page.waitForTimeout(60);
        done += inc;
      }
      await page.waitForTimeout(500); // settle scrub
      return res.end(JSON.stringify({ ok: true, scrollY: await currentScrollY() }));
    }
    if (p === '/shot') {
      const label = (u.searchParams.get('label') || 'cp').replace(/[^a-z0-9_-]/gi, '_');
      const file = path.join(SHOTS, `${label}.png`);
      await page.screenshot({ path: file });
      const y = await currentScrollY();
      // also grab basic diagnostic state
      const info = await page.evaluate(() => ({
        docHeight: document.documentElement.scrollHeight,
        innerH: window.innerHeight,
        winScrollY: Math.round(window.scrollY),
      }));
      return res.end(JSON.stringify({ ok: true, file, scrollY: y, ...info }));
    }
    if (p === '/eval') {
      const expr = u.searchParams.get('expr') || '1';
      const out = await page.evaluate((e) => {
        try { return { v: eval(e) }; } catch (err) { return { err: String(err) }; }
      }, expr);
      return res.end(JSON.stringify(out));
    }
    res.statusCode = 404; res.end(JSON.stringify({ error: 'unknown' }));
  } catch (e) {
    res.statusCode = 500; res.end(JSON.stringify({ error: String(e && e.stack || e) }));
  }
});

boot().then(() => {
  server.listen(PORT, () => console.log('DRIVER_READY on ' + PORT));
}).catch(e => { console.error('BOOT_FAIL', e); process.exit(1); });
