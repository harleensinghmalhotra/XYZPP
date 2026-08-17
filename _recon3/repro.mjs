// Read-only reproduction + instrumentation for the Awards/Certifications blank-band bug.
// Drives a HEADED Chromium at 1536x743 DPR1.25, normal motion. Writes screenshots + JSON
// into _recon3/. Does not touch src/ or public/.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || 'http://localhost:5199'
const OUT = 'D:\\WEBSITES\\Website University\\_recon3'
const SMOKE = process.argv.includes('--smoke')

const VIEW = { width: 1536, height: 743 }
const DSF = 1.25

// probe: sample doc height + section offsetTop every frame from page start (~12s)
const PROBE = `
window.__probe = { samples: [], firstSeen: {}, err: null };
const t0 = performance.now();
function sample(){
  try {
    const de = document.documentElement;
    if (!de) { requestAnimationFrame(sample); return; }
    const t = performance.now() - t0;
    const rec = { t: Math.round(t), dh: de.scrollHeight, sy: Math.round(window.scrollY), ih: window.innerHeight };
    for (const id of ['awards','certifications']){
      const el = document.getElementById(id);
      if (el){
        const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
        rec[id] = top;
        if (!window.__probe.firstSeen[id]) window.__probe.firstSeen[id] = { t: Math.round(t), offsetTop: top, dh: rec.dh };
      }
    }
    window.__probe.samples.push(rec);
    if (t < 12000) requestAnimationFrame(sample);
  } catch (e) { window.__probe.err = String(e); if ((performance.now()-t0) < 12000) requestAnimationFrame(sample); }
}
requestAnimationFrame(sample);
`

const READ = `
(async () => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, exists: false };
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { sel, exists: true, opacity: cs.opacity, visibility: cs.visibility,
             transform: cs.transform === 'none' ? 'none' : 'set', display: cs.display,
             w: Math.round(r.width), h: Math.round(r.height) };
  };
  const targets = {
    awHead: pick('#awards .aw-head'),
    plq: pick('#awards .plq'),
    plqCount: document.querySelectorAll('#awards .plq').length,
    certsTitle: pick('#certifications .certs-title'),
    certsSeal: pick('#certifications .certs-seal'),
    certCard: pick('#certifications .cert-card'),
    certCount: document.querySelectorAll('#certifications .cert-card').length,
  };
  // ScrollTrigger instances via the same singleton module Vite already served
  let st = { ok: false };
  try {
    const urls = performance.getEntriesByType('resource').map(r => r.name);
    let stUrl = urls.find(u => /ScrollTrigger/i.test(u));
    if (stUrl) {
      const mod = await import(stUrl);
      const ST = mod.ScrollTrigger || mod.default;
      if (ST && ST.getAll) {
        st = { ok: true, triggers: ST.getAll().map(tr => {
          const g = tr.trigger;
          const tag = g ? (g.id ? '#'+g.id : '.'+String(g.className||'').trim().split(/\\s+/).join('.')) : 'null';
          return { trigger: tag, start: Math.round(tr.start), end: Math.round(tr.end),
                   progress: +tr.progress.toFixed(3), isActive: tr.isActive };
        }) };
      } else st = { ok:false, reason:'no getAll', keys:Object.keys(mod) };
    } else st = { ok:false, reason:'ST url not found', gsapish: urls.filter(u=>/gsap|scroll/i.test(u)).slice(0,5) };
  } catch (e) { st = { ok:false, reason:String(e) }; }
  const sect = (id) => { const el=document.getElementById(id); if(!el) return null; return { offsetTop: Math.round(el.getBoundingClientRect().top+window.scrollY), h: Math.round(el.getBoundingClientRect().height) }; };
  const samples = window.__probe?.samples || [];
  return { targets, st, docHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight,
           awards: sect('awards'), certifications: sect('certifications'),
           firstSeen: window.__probe?.firstSeen, probeErr: window.__probe?.err, sampleCount: samples.length,
           firstDH: samples[0]?.dh, lastDH: samples.at(-1)?.dh,
           timeline: samples.filter((_, i) => i % 8 === 0 || i === samples.length - 1) };
})()
`

const hidden = (t) => t && t.exists && (parseFloat(t.opacity) < 0.5 || t.visibility === 'hidden')
const verdict = (targets) => ({
  awards: (!targets.awHead.exists || !targets.plq.exists) ? 'NO-DOM'
        : (hidden(targets.awHead) || hidden(targets.plq)) ? 'HIDDEN' : 'VISIBLE',
  certs: (!targets.certsTitle.exists || !targets.certCard.exists) ? 'NO-DOM'
        : (hidden(targets.certsTitle) || hidden(targets.certCard) || hidden(targets.certsSeal)) ? 'HIDDEN' : 'VISIBLE',
})

async function slowScrollTo(page, id) {
  await page.evaluate(async (id) => {
    const target = () => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top + window.scrollY - 120 : document.documentElement.scrollHeight; };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let guard = 0;
    while (window.scrollY < target() && guard++ < 400) { window.scrollBy(0, 150); await sleep(45); }
  }, id)
  await page.waitForTimeout(700)
}
async function fastScrollBottom(page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(700)
}

async function runOne(browser, { pagePath, throttle, scroll, idx, tag, nav = 'soft', via = '/' }) {
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DSF, reducedMotion: 'no-preference' })
  await context.addInitScript({ content: PROBE })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  const consoleErr = []
  page.on('console', (m) => { if (m.type() === 'error' || /hot updated|hmr/i.test(m.text())) consoleErr.push(`[${m.type()}] ${m.text()}`.slice(0, 200)) })

  if (nav === 'hard') {
    if (throttle === 'slow3g') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8 })
    await page.goto(BASE + pagePath, { waitUntil: 'domcontentloaded' })
  } else {
    // SOFT SPA NAV: fully load a referrer page first (so window 'load' already fired),
    // then client-side navigate via a React-Router <Link> — no load event, no auto-refresh.
    await page.goto(BASE + via, { waitUntil: 'load' })
    await page.waitForTimeout(1500) // let referrer settle (Lenis, globe, etc.)
    if (throttle === 'slow3g') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8 })
    // click the first nav Link to the target path (React Router intercepts → soft nav)
    const link = page.locator(`a[href="${pagePath}"]`).first()
    await link.waitFor({ state: 'attached', timeout: 5000 })
    await link.click({ force: true, timeout: 5000 })
    await page.waitForFunction((p) => location.pathname === p, pagePath, { timeout: 8000 }).catch(() => {})
    await page.waitForSelector('#awards, #certifications', { timeout: 8000 }).catch(() => {})
  }

  // PEEK — capture trigger start/end + section offsetTop the instant the section exists,
  // BEFORE scrolling (so once:true hasn't fired/killed anything). This is the trigger's
  // start "at mount" vs the section's not-yet-settled offsetTop.
  const peek = await page.evaluate(READ).catch(() => null)

  if (scroll === 'fast') { await fastScrollBottom(page) }
  else { await slowScrollTo(page, 'awards'); await slowScrollTo(page, 'certifications') }
  // settle
  await page.waitForTimeout(600)

  const data = await page.evaluate(READ)
  const v = verdict(data.targets)
  const fail = v.awards !== 'VISIBLE' || v.certs !== 'VISIBLE'

  if (fail || idx === 0) {
    // screenshot both sections
    for (const id of ['awards', 'certifications']) {
      const el = await page.$('#' + id)
      if (el) { try { await el.screenshot({ path: path.join(OUT, `shot_${tag}_${idx}_${id}_${v[id === 'awards' ? 'awards' : 'certs']}.png`) }) } catch {} }
    }
  }
  const rec = { tag, idx, pagePath, throttle, scroll, verdict: v, fail,
    targets: data.targets, docHeight: data.docHeight, firstSeen: data.firstSeen, probeErr: data.probeErr,
    sampleCount: data.sampleCount, firstDH: data.firstDH, lastDH: data.lastDH,
    awardsOffsetTop: data.awards?.offsetTop, certsOffsetTop: data.certifications?.offsetTop,
    st: data.st, consoleNoise: consoleErr.slice(0, 6),
    peek: peek ? { st: peek.st, awardsTop: peek.awards?.offsetTop, certsTop: peek.certifications?.offsetTop, docHeight: peek.docHeight, verdict: verdict(peek.targets) } : null,
    timeline: (fail || idx === 0) ? data.timeline : undefined }
  await context.close()
  return rec
}

async function main() {
  const browser = await chromium.launch({ headless: false })
  const matrix = SMOKE
    ? [
        { tag: 'smoke-about-SOFT', pagePath: '/about', throttle: 'none', scroll: 'slow', nav: 'soft', via: '/', n: 3 },
        { tag: 'smoke-about-HARD', pagePath: '/about', throttle: 'none', scroll: 'slow', nav: 'hard', n: 2 },
      ]
    : [
        { tag: 'about-SOFT-normal-slow', pagePath: '/about', throttle: 'none', scroll: 'slow', nav: 'soft', via: '/', n: 10 },
        { tag: 'infra-SOFT-normal-slow', pagePath: '/infrastructure', throttle: 'none', scroll: 'slow', nav: 'soft', via: '/', n: 10 },
        { tag: 'about-SOFT-slow3g-slow', pagePath: '/about', throttle: 'slow3g', scroll: 'slow', nav: 'soft', via: '/', n: 6 },
        { tag: 'infra-SOFT-slow3g-slow', pagePath: '/infrastructure', throttle: 'slow3g', scroll: 'slow', nav: 'soft', via: '/', n: 6 },
        { tag: 'about-HARD-slow3g-slow', pagePath: '/about', throttle: 'slow3g', scroll: 'slow', nav: 'hard', n: 6 },
        { tag: 'about-SOFT-normal-fast', pagePath: '/about', throttle: 'none', scroll: 'fast', nav: 'soft', via: '/', n: 6 },
      ]
  const all = []
  for (const cell of matrix) {
    for (let i = 0; i < cell.n; i++) {
      const rec = await runOne(browser, { ...cell, idx: i })
      all.push(rec)
      const pst = rec.peek?.st?.triggers?.map(x => `${x.trigger}@${x.start}`).join(',') || '-'
      console.log(`${cell.tag} #${i}  aw=${rec.verdict.awards} ce=${rec.verdict.certs}` +
        (rec.fail ? '  <-- FAIL' : '') +
        `  | peekTriggers[${pst}] peekAwTop=${rec.peek?.awardsTop} settledAwTop=${rec.awardsOffsetTop} settledCeTop=${rec.certsOffsetTop} DH ${rec.firstDH}->${rec.lastDH}`)
    }
    const fails = all.filter(r => r.tag === cell.tag && r.fail).length
    const awFails = all.filter(r => r.tag === cell.tag && r.verdict.awards !== 'VISIBLE').length
    const cFails = all.filter(r => r.tag === cell.tag && r.verdict.certs !== 'VISIBLE').length
    console.log(`==== ${cell.tag}: ${fails}/${cell.n} iterations had a blank band (awards ${awFails}/${cell.n}, certs ${cFails}/${cell.n}) ====`)
  }
  fs.writeFileSync(path.join(OUT, SMOKE ? 'repro-smoke.json' : 'repro-results.json'), JSON.stringify(all, null, 2))
  await browser.close()
  console.log('WROTE', SMOKE ? 'repro-smoke.json' : 'repro-results.json')
}
main().catch((e) => { console.error(e); process.exit(1) })
