// Dev-only. Exports the plaque texture TEMPLATE KIT for Harry → "FLOW assets/
// plaque templates/". Reproduces Station.jsx's makeLabelTexture() VERBATIM in a
// real browser (same Google-fonts stack, same label-plate.webp), so every file
// is bit-faithful to what the live conveyor draws today. No dev server needed.
//
//   plaque-current-<key>.png / -fr.png  — the CURRENT rendered face, all 6 stages
//   plaque-template-blank.png            — plate ground, NO text
//   plaque-guide.png                     — blank + safe-zone / centre / index guides
//   README.txt                           — the spec + Harry's naming
//
// Run: node src/sections/process3d/_export-plaques.mjs
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const OUT = 'FLOW assets/plaque templates'
mkdirSync(OUT, { recursive: true })

// The plate the live texture paints as its ground (public/qfp/conveyor/…).
const PLATE_PATH = 'public/qfp/conveyor/label-plate.webp'
const plateDataUrl = 'data:image/webp;base64,' + readFileSync(PLATE_PATH).toString('base64')

// Stage keys are LAW (constants.js STATIONS) — verbatim, in belt order. Titles
// pulled from the homeProcess locale so the export matches the live plaque copy.
const en = JSON.parse(readFileSync('src/locales/en/homeProcess.json', 'utf8')).stages
const fr = JSON.parse(readFileSync('src/locales/fr/homeProcess.json', 'utf8')).stages
const KEYS = ['print', 'quality', 'fulfillment', 'warehouse', 'ship', 'covered']
const STAGES = KEYS.map((key, i) => ({ key, num: i + 1, en: en[key].name, fr: fr[key].name }))

// Exact Google-fonts stack the app loads (index.html) — DPR-independent, so the
// native-resolution export needs no scaling.
const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap'

function savePng(name, dataUrl) {
  writeFileSync(`${OUT}/${name}`, Buffer.from(dataUrl.split(',')[1], 'base64'))
}

async function run() {
  const errors = []
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

  await page.setContent(
    `<!doctype html><html><head><meta charset="utf8">
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link rel="stylesheet" href="${FONT_LINK}"></head><body></body></html>`,
    { waitUntil: 'networkidle' },
  )
  // Make sure the exact weights we draw with are actually parsed before we render.
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('700 200px "Inter Tight"'),
      document.fonts.load('600 48px "DM Mono"'),
    ])
    await document.fonts.ready
  })

  const out = await page.evaluate(async ({ plateDataUrl, STAGES }) => {
    // ── makeLabelTexture() constants + draw, copied VERBATIM from Station.jsx ──
    const PLATE_ASPECT = 862 / 649
    const RES = 1280
    const H = Math.round(RES / PLATE_ASPECT)
    const FILL = RES * 0.66
    const MAX_PX = Math.round(RES * 0.30)
    const TRACK = -0.015
    const INK = '#1C2019' // EKTA.ink
    const nameFont = (px) => `700 ${px}px "Inter Tight", Inter, system-ui, sans-serif`
    const fitPx = (g, title) => {
      g.font = nameFont(100); g.letterSpacing = `${TRACK * 100}px`
      const w100 = Math.max(1, g.measureText(title).width)
      return Math.min(MAX_PX, Math.round((100 * FILL) / w100))
    }

    const plate = await new Promise((res) => {
      const im = new Image(); im.onload = () => res(im); im.src = plateDataUrl
    })

    // Draw the plate ground; optionally the index + name (text=null → blank plate).
    const drawFace = (num, title) => {
      const c = document.createElement('canvas')
      c.width = RES; c.height = H
      const g = c.getContext('2d')
      g.clearRect(0, 0, RES, H)
      g.drawImage(plate, 0, 0, RES, H)
      if (title != null) {
        g.textAlign = 'center'; g.textBaseline = 'middle'
        g.letterSpacing = '2.5px'
        g.fillStyle = 'rgba(15,36,68,0.5)'
        g.font = '600 48px "DM Mono", ui-monospace, monospace'
        g.fillText(`0${num}`, RES / 2, H * 0.30)
        const namePx = fitPx(g, title)
        g.letterSpacing = `${TRACK * namePx}px`
        g.fillStyle = INK
        g.font = nameFont(namePx)
        g.fillText(title, RES / 2, H * 0.585)
        g.letterSpacing = '0px'
      }
      return c.toDataURL('image/png')
    }

    // Guide overlay on the blank: centre cross, safe-text width (FILL, 66%), the
    // index band (y=0.30H) and name band (y=0.585H, capped MAX_PX tall).
    const drawGuide = () => {
      const c = document.createElement('canvas')
      c.width = RES; c.height = H
      const g = c.getContext('2d')
      g.drawImage(plate, 0, 0, RES, H)
      const cx = RES / 2
      const safeL = (RES - FILL) / 2, safeR = RES - safeL
      const idxY = H * 0.30, nameY = H * 0.585
      g.lineWidth = 2
      // safe-text width band (66% of canvas, where a word is auto-fit)
      g.strokeStyle = 'rgba(200,60,60,0.85)'
      g.setLineDash([10, 8])
      g.strokeRect(safeL, H * 0.18, FILL, H * 0.60)
      g.setLineDash([])
      // centre cross
      g.strokeStyle = 'rgba(20,120,200,0.7)'
      g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, H); g.moveTo(0, H / 2); g.lineTo(RES, H / 2); g.stroke()
      // index + name centre lines
      g.strokeStyle = 'rgba(20,160,90,0.85)'
      g.beginPath(); g.moveTo(safeL, idxY); g.lineTo(safeR, idxY); g.stroke()
      g.strokeStyle = 'rgba(160,90,190,0.9)'
      g.beginPath(); g.moveTo(safeL, nameY); g.lineTo(safeR, nameY); g.stroke()
      // MAX height cap for the name (centred on nameY)
      g.strokeStyle = 'rgba(160,90,190,0.4)'
      g.setLineDash([4, 6])
      g.strokeRect(safeL, nameY - MAX_PX / 2, FILL, MAX_PX)
      g.setLineDash([])
      // labels
      g.fillStyle = 'rgba(200,60,60,0.95)'
      g.font = '600 26px "DM Mono", monospace'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'
      g.fillText(`SAFE TEXT ZONE  ${Math.round(FILL)}px wide (66%)`, safeL + 6, H * 0.18 - 10)
      g.fillStyle = 'rgba(20,160,90,0.95)'
      g.fillText(`"01" index  ·  centre y = ${Math.round(idxY)}px`, safeL + 6, idxY - 10)
      g.fillStyle = 'rgba(160,90,190,0.95)'
      g.fillText(`STATION NAME  ·  centre y = ${Math.round(nameY)}px  ·  cap ${MAX_PX}px`, safeL + 6, nameY - MAX_PX / 2 - 10)
      g.fillStyle = 'rgba(20,120,200,0.9)'
      g.textAlign = 'center'
      g.fillText(`canvas ${RES}×${H}  ·  aspect ${(RES / H).toFixed(3)}  ·  centre x = ${cx}`, cx, H - 16)
      return c.toDataURL('image/png')
    }

    const faces = {}
    for (const s of STAGES) {
      faces[`en:${s.key}`] = drawFace(s.num, s.en)
      faces[`fr:${s.key}`] = drawFace(s.num, s.fr)
    }
    return { RES, H, FILL, MAX_PX, faces, blank: drawFace(1, null), guide: drawGuide() }
  }, { plateDataUrl, STAGES })

  // ── write the kit ──────────────────────────────────────────────────────────
  for (const s of STAGES) {
    savePng(`plaque-current-${s.key}.png`, out.faces[`en:${s.key}`])
    savePng(`plaque-current-${s.key}-fr.png`, out.faces[`fr:${s.key}`])
  }
  savePng('plaque-template-blank.png', out.blank)
  savePng('plaque-guide.png', out.guide)

  const safe = Math.round((out.RES - out.FILL) / 2)
  const README = `PLAQUE FACE — CANVA TEMPLATE KIT  (Quantum Fusion Prints conveyor)
================================================================

WHAT THIS IS
  The "Print / Quality / …" signs floating above each conveyor arch are a live
  canvas texture. This kit lets you redesign that face in Canva and drop the PNGs
  straight into the site — no code change. Until you add files, the site keeps
  drawing the text itself, unchanged.

CANVAS / EXPORT SPEC
  Size        ${out.RES} × ${out.H} px  (EXACT — export at this size, do not scale)
  Aspect      ${(out.RES / out.H).toFixed(4)} : 1  (=862:649, the plate's own ratio)
  Format      PNG, 32-bit WITH TRANSPARENCY (the plaque is a floating sign — the
              area OUTSIDE the cream plate must stay transparent, exactly like
              plaque-template-blank.png).
  DPI/DPR     Native 1:1. The site already renders crisp at high-DPR; just match
              ${out.RES} × ${out.H}.

SAFE ZONE  (keep all text inside)
  Width       ${Math.round(out.FILL)} px centred  →  x ${safe} … ${out.RES - safe}
  Index "0N"  centred on  y = ${Math.round(out.H * 0.30)} px
  Station name centred on y = ${Math.round(out.H * 0.585)} px, max height ${out.MAX_PX} px
  Centre      x = ${out.RES / 2} px  (everything is centre-aligned)
  See plaque-guide.png for these lines drawn over the blank plate.

THE FILES IN THIS KIT
  plaque-current-<stage>.png       what the site draws NOW (English) — your before
  plaque-current-<stage>-fr.png    the French face
  plaque-template-blank.png        the cream plate + gold frame, NO text
  plaque-guide.png                 the blank with safe-zone / centre / baseline guides

  <stage> is one of:  print  quality  fulfillment  warehouse  ship  covered
  (display names: Print · Quality · Fulfillment · Warehouse · Shipping · You're Covered)

NAME YOUR VERSIONS EXACTLY LIKE THIS, then drop them in
  public/qfp/conveyor/plaques/ :

  plaque-print.png        plaque-print-fr.png
  plaque-quality.png      plaque-quality-fr.png
  plaque-fulfillment.png  plaque-fulfillment-fr.png
  plaque-warehouse.png    plaque-warehouse-fr.png
  plaque-ship.png         plaque-ship-fr.png        (this is the "Shipping" sign)
  plaque-covered.png      plaque-covered-fr.png

  The English (no -fr) file shows in English; the -fr file shows in French. You can
  add just some stages — any stage without a file keeps the current drawn text.
  Filename must match the stage key above exactly (lowercase, "ship" not "shipping").
`
  writeFileSync(`${OUT}/README.txt`, README)

  await browser.close()

  console.log('KIT →', OUT)
  console.log('  canvas         :', `${out.RES} × ${out.H}`)
  console.log('  safe width     :', `${Math.round(out.FILL)}px  (x ${safe}…${out.RES - safe})`)
  console.log('  files written  :', STAGES.length * 2 + 3, '(12 current + blank + guide + README)')
  console.log('  console errors :', errors.length)
  errors.forEach((e) => console.log('   -', e))
}

run().catch((e) => { console.error(e); process.exit(1) })
