import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'
import { ARCH, APEX_Y, LABEL_Y, EKTA } from './constants'

// ── Dormant Canva-override swap path ─────────────────────────────────────────
// If Harry drops a finished plaque PNG at
//   public/qfp/conveyor/plaques/plaque-<key>[-fr].png
// it REPLACES the canvas-drawn plaque face for that station; when the folder is
// empty (as shipped) the canvas text renders exactly as before — pixel-identical.
// We PROBE with a HEAD fetch first: a 404 resolves to res.ok===false (no console
// error, unlike a failed <img>/texture load), and we only load when the response
// is a real image, so an SPA 200-fallback can never poison the plaque either.
// Template kit + spec: "FLOW assets/plaque templates/".
const overrideUrl = (key, lang) => {
  const fr = typeof lang === 'string' && lang.toLowerCase().startsWith('fr')
  return `/qfp/conveyor/plaques/plaque-${key}${fr ? '-fr' : ''}.png`
}

// ── Reference arch gate (ref V1/MAIN), shortened for R5 ──────────────────────
// Slim rounded "∩" hoop, matte navy, thin gold inner trim; the white label sign is
// now a camera-facing BILLBOARD floating above the apex (readable flat-on). Quality
// carries the scanner head (ref V2). Warm light pools live in Scene.

function archShape(half, band) {
  const ro = half + band / 2
  const ri = half - band / 2
  const h = ARCH.legH
  const s = new THREE.Shape()
  s.moveTo(-ro, 0)
  s.lineTo(-ro, h)
  s.absarc(0, h, ro, Math.PI, 0, true)
  s.lineTo(ro, 0)
  s.lineTo(ri, 0)
  s.lineTo(ri, h)
  s.absarc(0, h, ri, 0, Math.PI, false)
  s.lineTo(-ri, 0)
  s.closePath()
  return s
}

// Harry's cream + gold-frame plate (FRAME.jpeg → label-plate.webp), loaded once
// and shared; station text is drawn on the cream face, shown on a billboard.
const PLATE_ASPECT = 862 / 649
const plateImg = typeof Image !== 'undefined' ? new Image() : null
if (plateImg) plateImg.src = '/qfp/conveyor/label-plate.webp'

// ── Plaque typography (keynote weight) ────────────────────────────────────────
// Hi-res canvas (knife-sharp at DPR 1.25), Inter Tight 700, Apple-signature TIGHT
// tracking (−1.5%), deep INK on the warm cream face. Each word is sized PER-PLAQUE
// to OWN its face — it fills ~FILL of the plate width so short words ("Print",
// "Quality") read just as big and confident as the long ones, keynote-style (a
// single shared size left the short words small — that was the miss). A height cap
// keeps a very short word from turning cartoonishly tall. The DM Mono index eyebrow
// keeps its own wide tracking, unchanged.
const RES = 1280 // up from 1024 → still knife-sharp at the larger type
const H = Math.round(RES / PLATE_ASPECT)
const FILL = RES * 0.66 // the word fills ~66% of the (near-full-width) plate face
const MAX_PX = Math.round(RES * 0.30) // height cap — only catches 1–2 char words; our shortest ("Print") fills width first
const TRACK = -0.015 // tight letter-spacing ratio (−1.5%)
const nameFont = (px) => `700 ${px}px "Inter Tight", Inter, system-ui, sans-serif`

// Size THIS word so it owns the face: fill FILL of the width, capped for height.
function fitPx(g, title) {
  g.font = nameFont(100); g.letterSpacing = `${TRACK * 100}px`
  const w100 = Math.max(1, g.measureText(title).width)
  return Math.min(MAX_PX, Math.round((100 * FILL) / w100))
}

// Lane 14c: EVERY plaque face — the canvas fallback plate (FRAME.jpeg) AND Harry's
// shipped Canva override PNGs (plaque-*.png) — bakes a soft dark drop-shadow into its
// transparent TOP MARGIN, above the gold frame. Invisible on the old navy sky, it reads
// as a grey smudge above each plaque on the new white sky. On both faces the gold frame
// starts ~21% down, so wherever we draw a face we wipe that top strip back to transparent.
// (Lane 14b only cleared the canvas plate — but 5 of 6 stations show the override PNG,
// so the smudge survived on everything except Quality, which skips the override.)
const TOP_CLEAR = 0.21

// Draw an already-decoded plaque image onto a canvas with its shadowed top margin wiped,
// returned as a texture — used for the Canva override faces so they get the same fix.
function makeTrimmedTexture(img) {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0, w, h)
  g.clearRect(0, 0, w, Math.round(h * TOP_CLEAR)) // wipe the baked top-margin shadow
  return new THREE.CanvasTexture(c)
}

function makeLabelTexture(title) {
  const c = document.createElement('canvas')
  c.width = RES; c.height = H
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8
  const draw = () => {
    g.clearRect(0, 0, RES, H)
    if (plateImg && plateImg.complete && plateImg.naturalWidth) g.drawImage(plateImg, 0, 0, RES, H)
    // wipe the plate PNG's baked top-margin shadow (see TOP_CLEAR above)
    g.clearRect(0, 0, RES, Math.round(H * TOP_CLEAR))
    g.textAlign = 'center'; g.textBaseline = 'middle'
    // No index eyebrow — Harry: no numbers anywhere (the shipped Canva PNG faces
    // already carry the NAME only; this fallback face now matches them). The name
    // is centred on the plate, the sole mark on the face.
    // station name — Inter Tight 700, tight, deep ink, sized to own the face
    const namePx = fitPx(g, title)
    g.letterSpacing = `${TRACK * namePx}px`
    g.fillStyle = EKTA.ink
    g.font = nameFont(namePx)
    g.fillText(title, RES / 2, H * 0.5) // centred — no eyebrow above it now
    g.letterSpacing = '0px'
    t.needsUpdate = true
  }
  draw()
  if (plateImg && !plateImg.complete) plateImg.addEventListener('load', draw, { once: true })
  // redraw once the webfont is ready, so the plaque never sticks on a fallback face
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(draw)
  return t
}

export default function Station({ title, scan, register, swapKey, lang }) {
  const navyGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(archShape(ARCH.half, ARCH.legW), {
      depth: ARCH.depth, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 30,
    })
    g.translate(0, 0, -ARCH.depth / 2)
    return g
  }, [])
  const trimGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(archShape(ARCH.half - 0.004, ARCH.trim), { depth: 0.028, bevelEnabled: false, curveSegments: 30 })
    return g
  }, [])
  const labelTex = useMemo(() => makeLabelTexture(title), [title])

  // Dormant swap: if a Canva PNG exists for this station it takes over the plaque
  // face; absent, the canvas texture above stays in place (nothing changes today).
  const plaqueMat = useRef(null)
  useEffect(() => {
    if (!swapKey || typeof fetch === 'undefined') return
    // Lane 14 (interim): the Quality plaque name changed to "Quality Check" but the
    // baked Canva PNG still reads "QUALITY". Skip the PNG override for THIS station
    // only, so the canvas fallback renders the new localised name from the locale.
    // Harry re-exports plaque-quality[-fr|-es].png with the new name to restore the art.
    if (swapKey === 'quality') return
    let cancelled = false
    let overrideTex = null
    const url = overrideUrl(swapKey, lang)
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (cancelled || !res.ok) return
        const ct = res.headers.get('content-type') || ''
        if (!ct.startsWith('image/')) return // SPA 200-fallback or non-image → keep canvas
        new THREE.TextureLoader().load(
          url,
          (tx) => {
            if (cancelled || !plaqueMat.current) { tx.dispose(); return }
            // The Canva override PNG carries the same baked top-margin shadow as the
            // canvas plate — redraw it through makeTrimmedTexture so the strip above the
            // gold frame is wiped clean, then swap that in (and drop the raw texture).
            const trimmed = makeTrimmedTexture(tx.image)
            trimmed.anisotropy = 8
            trimmed.colorSpace = labelTex.colorSpace
            tx.dispose()
            overrideTex = trimmed
            plaqueMat.current.map = trimmed
            plaqueMat.current.needsUpdate = true
          },
          undefined,
          () => {}, // load failed → silently keep the canvas face
        )
      })
      .catch(() => {})
    return () => { cancelled = true; if (overrideTex) overrideTex.dispose() }
  }, [swapKey, lang, labelTex])

  const api = useMemo(() => ({ trimF: null, trimB: null, coneMat: null, laserMat: null }), [])
  useEffect(() => { register(api) }, [register, api])

  const ro = ARCH.half + ARCH.legW / 2
  const scanTopY = APEX_Y - 0.34
  const coneH = scanTopY - 0.24

  return (
    <group>
      {/* navy arch — straddles the belt in Z, faces ±X */}
      <mesh geometry={navyGeo} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={EKTA.navy} roughness={0.6} metalness={0.18} />
      </mesh>
      {/* gold trim, proud on each face */}
      <mesh geometry={trimGeo} rotation={[0, Math.PI / 2, 0]} position={[ARCH.depth / 2 - 0.004, 0, 0]}>
        <meshStandardMaterial ref={(m) => (api.trimF = m)} color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={0.15} roughness={0.32} metalness={0.75} toneMapped={false} />
      </mesh>
      <mesh geometry={trimGeo} rotation={[0, -Math.PI / 2, 0]} position={[-ARCH.depth / 2 + 0.004, 0, 0]}>
        <meshStandardMaterial ref={(m) => (api.trimB = m)} color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={0.15} roughness={0.32} metalness={0.75} toneMapped={false} />
      </mesh>

      {/* foot plates */}
      {[-ro, ro].map((z) => (
        <mesh key={z} position={[0, 0.02, z]} castShadow>
          <boxGeometry args={[0.32, 0.05, 0.32]} />
          <meshStandardMaterial color={EKTA.navy2} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* short stub + camera-facing billboard label above the apex */}
      <mesh position={[0, APEX_Y + 0.12, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshStandardMaterial color={EKTA.navy2} roughness={0.5} metalness={0.3} />
      </mesh>
      <Billboard position={[0, LABEL_Y, 0]}>
        <mesh>
          <planeGeometry args={[0.94, 0.94 / (862 / 649)]} />
          <meshBasicMaterial ref={plaqueMat} map={labelTex} transparent toneMapped={false} />
        </mesh>
      </Billboard>

      {/* Quality scanner (ref V2): head at apex + soft blue cone + laser line */}
      {scan && (
        <group>
          <mesh position={[0, scanTopY + 0.1, 0]}>
            <cylinderGeometry args={[0.11, 0.13, 0.2, 20]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.5} metalness={0.35} />
          </mesh>
          <mesh position={[0, scanTopY, 0]}>
            <cylinderGeometry args={[0.075, 0.095, 0.07, 20]} />
            <meshStandardMaterial color={EKTA.navy2} emissive={'#BFE0FF'} emissiveIntensity={0.7} roughness={0.3} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.24 + coneH / 2, 0]}>
            <coneGeometry args={[0.42, coneH, 32, 1, true]} />
            <meshBasicMaterial ref={(m) => (api.coneMat = m)} color={'#A9CDF2'} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, ARCH.half * 1.7, 8]} />
            <meshBasicMaterial ref={(m) => (api.laserMat = m)} color={'#EAF4FF'} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.34, ARCH.half - 0.02]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.2} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}
