import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const page = await b.newPage()
const r = await page.evaluate(() => {
  const RES = 1280, TRACK = -0.015, FILL = RES * 0.66, MAX_PX = Math.round(RES * 0.30)
  const nameFont = (px) => `700 ${px}px "Inter Tight", Inter, system-ui, sans-serif`
  const g = document.createElement('canvas').getContext('2d')
  const occ = (title) => {
    g.font = nameFont(100); g.letterSpacing = `${TRACK * 100}px`
    const w100 = g.measureText(title).width
    const px = Math.min(MAX_PX, Math.round(100 * FILL / w100))
    const width = w100 * px / 100
    return { title, px, faceFrac: +(width / RES).toFixed(2) }
  }
  const EN = ['Print', 'Quality', 'Fulfillment', 'Warehouse', 'Shipping', "You're Covered"]
  const FR = ['Impression', 'Contrôle qualité', 'Logistique', 'Entreposage', 'Expédition', 'Tout est couvert']
  return { EN: EN.map(occ), FR: FR.map(occ) }
})
for (const loc of ['EN', 'FR']) { console.log(loc); r[loc].forEach(o => console.log('  ', o.title.padEnd(18), o.px + 'px', (o.faceFrac * 100) + '% of face')) }
await b.close()
