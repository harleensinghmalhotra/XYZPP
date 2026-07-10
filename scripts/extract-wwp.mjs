import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage()
await p.goto(process.argv[2] || 'http://localhost:5175', { waitUntil: 'networkidle' })
const cards = await p.evaluate(() =>
  [...document.querySelectorAll('#services .wwp-card')].map((c) => ({
    n: c.querySelector('.wwp-num').textContent,
    name: c.querySelector('.wwp-name').textContent,
    sub: c.querySelector('.wwp-sub').textContent,
    bullets: [...c.querySelectorAll('.wwp-list li')].map((li) => li.textContent),
  })))
console.log(JSON.stringify(cards, null, 1))
await b.close()
