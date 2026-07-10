// RECON: measure our live card anatomy + try Alternativ live for theirs.
import { chromium } from 'playwright'
const b = await chromium.launch()

// ---- OURS ----
{
  const p = await b.newPage({ viewport: { width: 1536, height: 743 }, deviceScaleFactor: 1.25 })
  await p.goto('http://localhost:5175', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.getElementById('services').scrollIntoView())
  await p.waitForTimeout(600)
  const m = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('#services .wwp-card')]
    const section = getComputedStyle(document.querySelector('.wwp-section'))
    const per = cards.map((card) => {
      const cr = card.getBoundingClientRect()
      const img = card.querySelector('.wwp-img'), ir = img.getBoundingClientRect()
      const pop = card.querySelector('.wwp-pop').getBoundingClientRect()
      const name = card.querySelector('.wwp-name').getBoundingClientRect()
      const cs = getComputedStyle(img)
      return {
        n: card.querySelector('.wwp-num').textContent,
        cardW: Math.round(cr.width), cardH: Math.round(cr.height),
        imgW: Math.round(ir.width), imgH: Math.round(ir.height),
        imgWpctCard: Math.round(100 * ir.width / cr.width),
        overhangPx: Math.round(cr.top - ir.top),                 // how far img top is above card top
        overhangPctCardH: +(100 * (cr.top - ir.top) / cr.height).toFixed(1),
        imgBottomToName: Math.round(name.top - ir.bottom),       // gap image bottom -> label
        filter: cs.filter, transform: cs.transform,
        radius: getComputedStyle(card).borderRadius,
      }
    })
    return {
      cardBg: getComputedStyle(cards[0]).backgroundColor,
      sectionBg: section.backgroundColor,
      shadow: getComputedStyle(cards[0]).boxShadow,
      heights: per.map((c) => c.cardH),
      per,
    }
  })
  console.log('=== OURS ===')
  console.log('cardBg', m.cardBg, 'sectionBg', m.sectionBg)
  console.log('cardShadow', m.shadow)
  console.log('card heights', m.heights, 'variance', Math.max(...m.heights) - Math.min(...m.heights))
  console.table(m.per.map(({ filter, transform, ...r }) => r))
  console.log('img filter (shadow):', m.per[0].filter)
  console.log('img transform:', m.per.map((c) => c.transform).join(' | '))
  await p.close()
}

// ---- THEIRS (live) ----
try {
  const p = await b.newPage({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 })
  await p.goto('https://www.alternativinc.com/', { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(2500)
  // scroll to the products/services cards
  await p.evaluate(() => window.scrollTo(0, 2600))
  await p.waitForTimeout(1500)
  const t = await p.evaluate(() => {
    // heuristics: find images that look like product cutouts inside link cards
    const imgs = [...document.querySelectorAll('img')].filter((im) => /books|bags|pack|toys/i.test(im.src))
    return imgs.slice(0, 6).map((im) => {
      const card = im.closest('a') || im.parentElement
      const cr = card.getBoundingClientRect(), ir = im.getBoundingClientRect()
      const cs = getComputedStyle(im)
      return {
        src: im.src.split('/').pop().slice(-24),
        cardW: Math.round(cr.width), cardH: Math.round(cr.height),
        imgW: Math.round(ir.width), imgH: Math.round(ir.height),
        imgWpctCard: Math.round(100 * ir.width / cr.width),
        overhangPx: Math.round(cr.top - ir.top),
        overhangPctCardH: +(100 * (cr.top - ir.top) / cr.height).toFixed(1),
        transform: cs.transform, filter: cs.filter,
        cardBg: getComputedStyle(card).backgroundColor, cardRadius: getComputedStyle(card).borderRadius,
      }
    })
  })
  console.log('\n=== THEIRS (alternativinc.com live) ===')
  if (t.length) { console.table(t.map(({ transform, filter, ...r }) => r)); console.log('their transforms:', t.map((x) => x.transform)); console.log('their filters:', t.map((x) => x.filter)) }
  else console.log('no product-cutout imgs found at that scroll pos (layout may differ)')
  await p.close()
} catch (e) {
  console.log('\n=== THEIRS live: UNREACHABLE ===', e.message.split('\n')[0])
}
await b.close()
