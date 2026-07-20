// TEMP P3 verification — branded studio (welcome / list / editor). Deleted after.
import {chromium} from 'playwright'
import {readFileSync} from 'node:fs'
import path from 'node:path'

const OUT = process.env.SHOT_OUT
const PID = 'z8o5rxfi'
const base = 'http://localhost:3333'
const token = readFileSync('studio/.env', 'utf8').match(/SANITY_AUTH_TOKEN=(.+)/)[1].trim()

const browser = await chromium.launch()
const context = await browser.newContext({viewport: {width: 1440, height: 900}})
const page = await context.newPage()
const msgs = []
page.on('console', (m) => { if (m.type() === 'error') msgs.push(m.text().slice(0, 160)) })
page.on('pageerror', (e) => msgs.push('[pageerror] ' + e.message.slice(0, 160)))

const dismiss = async () => {
  await page.locator('button:has-text("Got it")').click({timeout: 1500}).catch(() => {})
}

await page.goto(base, {waitUntil: 'domcontentloaded'})
await page.evaluate(([k, v]) => localStorage.setItem(k, v), [
  `__studio_auth_token_${PID}`, JSON.stringify({token, time: new Date().toISOString()}),
])

// 1. Welcome landing
await page.goto(`${base}/`, {waitUntil: 'domcontentloaded'})
let welcomeOk = true
try { await page.waitForSelector('text=Newsroom Studio', {timeout: 30000}) }
catch { welcomeOk = false; await page.goto(`${base}/home`, {waitUntil: 'domcontentloaded'}).catch(() => {}) }
await page.waitForTimeout(1800)
await dismiss()
await page.waitForTimeout(400)
await page.screenshot({path: path.join(OUT, 'p3-welcome.png')})

// 2. All Posts list (branded chrome + preview rows)
await page.goto(`${base}/structure/all-posts`, {waitUntil: 'domcontentloaded'})
await page.waitForSelector('text=Quarterfold unveils a rebuilt global website', {timeout: 30000}).catch(() => {})
await page.waitForTimeout(1500)
await dismiss()
await page.waitForTimeout(400)
await page.screenshot({path: path.join(OUT, 'p3-list.png')})

// 3. Editor (field groups + descriptions)
await page.goto(`${base}/structure/all-posts;post.quarterfold-launches-new-website`, {waitUntil: 'domcontentloaded'})
await page.waitForSelector('input, textarea', {timeout: 30000}).catch(() => {})
await page.waitForTimeout(2500)
await dismiss()
await page.waitForTimeout(400)
await page.screenshot({path: path.join(OUT, 'p3-editor.png')})

console.log(JSON.stringify({welcomeOk, consoleErrors: msgs.slice(-8)}, null, 2))
await browser.close()
