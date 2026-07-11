import { chromium } from 'playwright'
const BASE = process.env.URL || 'http://localhost:5197'
const glb = process.env.GLB || '/qfp/conveyor/_recon.glb'
const OUT = process.env.OUT || 'shots/conveyor-r8a/mesh-recon'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const b = await chromium.launch({ headless: false })
const page = await (await b.newContext({ viewport: { width: 720, height: 920 }, deviceScaleFactor: 1 })).newPage()
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
await page.goto(`${BASE}/_mesh-recon.html?glb=${encodeURIComponent(glb)}`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 30000 })
const info = await page.evaluate(() => ({ info: window.__meshInfo, error: window.__error }))
console.log('MESH:', JSON.stringify(info))
const angles = { front: 0, 'q-fl': 45, left: 90, 'q-bl': 135, back: 180, 'q-br': 225, right: 270, 'q-fr': 315 }
for (const [name, deg] of Object.entries(angles)) {
  await page.evaluate(d => window.__setYaw(d), deg); await sleep(200)
  await page.screenshot({ path: `${OUT}/${String(deg).padStart(3,'0')}-${name}.png` })
}
console.log('ERRORS:', errs.length); errs.slice(0,8).forEach(e => console.log(' -', e))
await b.close()
