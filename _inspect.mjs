import {chromium} from 'playwright'
import {readFileSync} from 'node:fs'

const PID = 'z8o5rxfi', base = 'http://localhost:3333'
const token = readFileSync('studio/.env', 'utf8').match(/SANITY_AUTH_TOKEN=(.+)/)[1].trim()
const browser = await chromium.launch()
const page = await (await browser.newContext({viewport: {width: 1440, height: 900}})).newPage()
await page.goto(base, {waitUntil: 'domcontentloaded'})
await page.evaluate(([k, v]) => localStorage.setItem(k, v), [`__studio_auth_token_${PID}`, JSON.stringify({token, time: new Date().toISOString()})])
await page.goto(`${base}/structure/all-posts`, {waitUntil: 'domcontentloaded'})
await page.waitForSelector('text=Quarterfold', {timeout: 30000}).catch(() => {})
await page.waitForTimeout(2000)

const info = await page.evaluate(() => {
  const nav = document.querySelector('[data-ui="Navbar"]')
  const myImg = document.querySelector('img[alt="QFP Newsroom"]')
  // find the header/navbar root (top bar)
  const header = document.querySelector('header') || nav
  const firstBar = header ? header.outerHTML.slice(0, 1400) : '(no header)'
  // sample the top-left logo region
  const logoRegion = nav ? nav.outerHTML.slice(0, 900) : '(no [data-ui=Navbar])'
  return {
    hasNavbarUi: !!nav,
    hasMyLogoImg: !!myImg,
    myImgSrc: myImg ? myImg.getAttribute('src') : null,
    headerTag: header ? header.tagName : null,
    firstBar,
    logoRegion,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
