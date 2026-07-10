import { chromium } from 'playwright'
const b = await chromium.launch({ headless: false })
const p = await (await b.newContext({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })).newPage()
await p.goto('http://localhost:5177/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1000)
// scroll to the very bottom via Lenis so the footer renders in its final state
await p.evaluate(() => window.__lenis?.scrollTo(document.documentElement.scrollHeight, { immediate: true }))
await p.waitForTimeout(1200)
await p.screenshot({ path: 'shots/routing/a07-home-footer.png' })
await b.close()
