import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { EKTA, transform, smooth, lerp } from './constants'

// ── The hero object (R5 → L11). ONE continuous object that evolves down the dusk
// line: a wide WHITE press-sheet stack → THREE textbooks (Quality) → kraft twine
// bundle → open box → sealed box, then a GREEN delivered tick stamps on and the box
// rides on to the girl (Scene handles the travel + hand-off). No lift.
//
// Lane 11 (client): the paper is now a LARGE, PURE-WHITE, wide press-sheet stack
// (web-offset stock, ~2:1 footprint) — not office cream. The single navy/gold book
// at Quality is replaced by THREE mock textbooks with SWAPPABLE cover materials, so
// tomorrow's real photos are a texture drop only (see TEXTBOOK_SWAP below).

// ── Dormant textbook-cover swap ──────────────────────────────────────────────
// Drop real cover art at public/qfp/conveyor/textbook-{1,2,3}.webp and it REPLACES
// the placeholder canvas cover for that book (front cover + spine share one slot).
// Absent (as shipped) the placeholder renders — nothing changes today. We HEAD-probe
// first (a 404 → res.ok===false, no console error) and only load a real image, so an
// SPA 200-fallback can never poison the cover either. Mirrors Station's plaque swap.
const textbookUrl = (i) => `/qfp/conveyor/textbook-${i}.webp`

// Placeholder cover — a clean on-palette mock: base colour, a title band, two blind
// title bars + a footer rule. Portrait proportions. Swapped out by the real webp.
function textbookCover(bg, band, ink) {
  const W = 256, H = 332
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  g.fillStyle = band; g.fillRect(0, Math.round(H * 0.17), W, Math.round(H * 0.15))
  g.fillStyle = ink
  g.fillRect(Math.round(W * 0.16), Math.round(H * 0.205), Math.round(W * 0.62), 10)
  g.fillRect(Math.round(W * 0.16), Math.round(H * 0.255), Math.round(W * 0.40), 10)
  g.fillStyle = band
  g.fillRect(Math.round(W * 0.16), Math.round(H * 0.82), Math.round(W * 0.36), 6)
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// green delivered tick — clean flat badge, white check on a green disc
function tickTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.clearRect(0, 0, S, S)
  g.fillStyle = '#3EA65C'; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill()
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 100, 0, 7); g.stroke()
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 30; g.lineCap = 'round'; g.lineJoin = 'round'
  g.beginPath(); g.moveTo(78, 132); g.lineTo(116, 172); g.lineTo(182, 92); g.stroke()
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
}

// ── Three mock textbooks (Quality station) ───────────────────────────────────
// Portrait proportions, modest thickness variation, arranged as an offset stack so
// all three covers + spines read clearly from the scroll camera's side-on angle.
// PALETTE LAW (covers): navy #0F2444, cream #FDFAF4, gold #9B7420 only.
// dims [w(X, cover width) · t(Y, thickness) · h(Z, cover height, portrait h>w)].
const PAGE = '#F3EFE6' // pale paper-white page block
// Composition: two lying flat (offset stack) + one leaning upright against them,
// its full cover to the camera — reads unmistakably as THREE books from the scroll
// camera's shallow side-on angle. rot = [x,y,z] radians.
const TEXTBOOKS = [
  { w: 0.60, t: 0.11, h: 0.76, pos: [-0.14, 0.055, 0.05], rot: [0, 0.12, 0], cover: { bg: EKTA.cream, band: EKTA.navy, ink: EKTA.navy } },
  { w: 0.54, t: 0.10, h: 0.68, pos: [-0.05, 0.16, -0.04], rot: [0, -0.16, 0], cover: { bg: EKTA.navy, band: EKTA.gold, ink: EKTA.cream } },
  { w: 0.50, t: 0.09, h: 0.66, pos: [0.30, 0.30, -0.02], rot: [1.24, 0.36, 0], cover: { bg: EKTA.gold, band: EKTA.navy, ink: EKTA.cream } },
]

const Book = forwardRef(function Book(_props, ref) {
  const root = useRef()
  const inner = useRef()
  const sheetsG = useRef()
  const sheetRefs = useRef([])
  const coverG = useRef()
  const wrapperG = useRef()
  const twineH = useRef()
  const twineV = useRef()
  const boxG = useRef()
  const flapRefs = useRef([])
  const tickG = useRef()
  const coverMatRefs = useRef([])

  const tickTex = useMemo(tickTexture, [])

  // Per-book placeholder cover textures (swappable). Built once.
  const coverTex = useMemo(() => TEXTBOOKS.map((b) => textbookCover(b.cover.bg, b.cover.band, b.cover.ink)), [])

  // Per-book 6-material array: +Y front cover + −X spine share the swappable cover
  // slot; the page faces are pale paper-white; back is the cover colour. metalness 0.
  const bookMats = useMemo(() => TEXTBOOKS.map((b, i) => {
    const cover = new THREE.MeshStandardMaterial({ map: coverTex[i], color: '#ffffff', roughness: 0.62, metalness: 0 })
    const spine = new THREE.MeshStandardMaterial({ map: coverTex[i], color: '#ffffff', roughness: 0.62, metalness: 0 })
    const back = new THREE.MeshStandardMaterial({ color: b.cover.bg, roughness: 0.6, metalness: 0 })
    const page = new THREE.MeshStandardMaterial({ color: PAGE, roughness: 0.85, metalness: 0 })
    coverMatRefs.current[i] = cover
    // box face order: +X, −X, +Y, −Y, +Z, −Z
    return [page /* +X fore-edge */, spine /* −X spine */, cover /* +Y front */, back /* −Y back */, page /* +Z */, page /* −Z */]
  }), [coverTex])

  const bookGeo = useMemo(() => TEXTBOOKS.map((b) => new THREE.BoxGeometry(b.w, b.t, b.h)), [])

  // Dormant swap: if textbook-{i}.webp exists it takes over that book's cover + spine.
  useEffect(() => {
    if (typeof fetch === 'undefined') return
    let cancelled = false
    const loaded = []
    TEXTBOOKS.forEach((_, idx) => {
      const url = textbookUrl(idx + 1)
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          if (cancelled || !res.ok) return
          const ct = res.headers.get('content-type') || ''
          if (!ct.startsWith('image/')) return // SPA 200-fallback / non-image → keep placeholder
          const tex = new THREE.TextureLoader().load(
            url,
            (tx) => {
              tx.anisotropy = 8
              tx.colorSpace = THREE.SRGBColorSpace
              const m = coverMatRefs.current[idx]
              if (!cancelled && m) { m.map = tx; m.needsUpdate = true }
            },
            undefined,
            () => {}, // load failed → silently keep the placeholder
          )
          loaded.push(tex)
        })
        .catch(() => {})
    })
    return () => { cancelled = true; loaded.forEach((t) => t.dispose()) }
  }, [])

  // a generous fresh-print pile — WIDE press sheets (web-offset), ~2:1 footprint.
  // Fan Z-spread kept tight so the outermost sheet clears the Print arch legs.
  const SHEETS = useMemo(
    () => Array.from({ length: 13 }, (_, i) => ({
      loose: { x: Math.sin(i * 1.5) * 0.14, y: 0.02 + i * 0.03, z: (i - 6) * 0.028, rot: (i - 6) * 0.045 },
      tight: { x: 0, y: 0.02 + i * 0.022, z: 0, rot: 0 },
    })), [],
  )

  // Four hinged lids at clearly-separated heights so no two lie coplanar when
  // sealed (the under-pair lower, the over-pair higher, each with its own y).
  const FLAPS = useMemo(() => [
    { axis: 'z', open: 1.5, group: [-0.49, 0.585, 0], off: [0.245, 0, 0], geo: [0.49, 0.02, 0.72], color: EKTA.kraftDark },
    { axis: 'z', open: -1.5, group: [0.49, 0.594, 0], off: [-0.245, 0, 0], geo: [0.49, 0.02, 0.72], color: EKTA.kraftDark },
    { axis: 'x', open: -1.5, group: [0, 0.607, -0.36], off: [0, 0, 0.18], geo: [0.98, 0.02, 0.36], color: EKTA.kraft },
    { axis: 'x', open: 1.5, group: [0, 0.62, 0.36], off: [0, 0, -0.18], geo: [0.98, 0.02, 0.36], color: EKTA.kraft },
  ], [])

  useImperativeHandle(ref, () => ({
    get root() { return root.current },
    apply(activeF, time, boxFade = 1) {
      const bind = transform(1, activeF)
      const wrap = transform(2, activeF)
      const box = transform(3, activeF)
      const seal = transform(4, activeF)
      const crown = transform(5, activeF)

      // ── sheets → books: a DISSOLVE, not an overlap. The sheets gather (bind),
      // then fade out (transparent, depthWrite off) as the solid books grow in
      // beneath them. Only the books ever write depth here → no interpenetration,
      // no z-fight (the old cause: both solid + coplanar for the whole morph).
      const sheetOp = 1 - smooth(0.5, 0.72, bind)
      sheetRefs.current.forEach((m, i) => {
        if (!m) return
        const s = SHEETS[i]
        m.position.x = lerp(s.loose.x, s.tight.x, bind)
        m.position.y = lerp(s.loose.y, s.tight.y, bind)
        m.position.z = lerp(s.loose.z, s.tight.z, bind)
        m.rotation.y = lerp(s.loose.rot, s.tight.rot, bind)
        const fading = sheetOp < 0.999
        m.material.transparent = fading
        m.material.depthWrite = !fading
        m.material.opacity = sheetOp
      })
      if (sheetsG.current) sheetsG.current.visible = sheetOp > 0.002

      if (coverG.current) {
        const cs = smooth(0.5, 1, bind) // grows in only once the sheets start dissolving
        coverG.current.visible = bind > 0.48 && wrap < 0.985
        coverG.current.scale.set(lerp(0.82, 1, cs), lerp(0.05, 1, cs), lerp(0.82, 1, cs))
      }

      if (wrapperG.current) {
        const w1 = smooth(0, 0.72, wrap)
        const w2 = smooth(0.5, 1, wrap)
        wrapperG.current.visible = wrap > 0.02 && box < 0.6
        wrapperG.current.scale.set(lerp(0.92, 1, w1), lerp(0.92, 1, w1), lerp(0.05, 1, w1))
        if (twineH.current) twineH.current.scale.x = w2
        if (twineV.current) twineV.current.scale.z = w2
      }

      if (inner.current) inner.current.position.y = lerp(0, -0.3, box)
      if (boxG.current) {
        boxG.current.visible = box > 0.02
        boxG.current.scale.y = lerp(0.05, 1, smooth(0, 0.72, box))
      }
      flapRefs.current.forEach((f, i) => {
        if (!f) return
        f.visible = box > 0.12
        const a = lerp(FLAPS[i].open, 0, seal)
        if (FLAPS[i].axis === 'x') f.rotation.x = a
        else f.rotation.z = a
      })

      // Delivered — the green tick STAMPS onto the box face (press + overshoot, stays)
      if (tickG.current) {
        tickG.current.visible = crown > 0.02
        const press = smooth(0.06, 0.45, crown)
        const over = Math.sin(smooth(0.1, 0.6, crown) * Math.PI) * 0.14 // squash overshoot
        const s = press + over
        tickG.current.scale.set(s, s, 1)
      }

      // ── Fix 4 morph: the whole sealed box fades out as the pick sprite's held
      // box fades in. Opaque parts turn transparent + stop writing depth only while
      // fading; the tick (already alpha-mapped) just dims. Restores cleanly on reverse.
      if (boxG.current) {
        const fading = boxFade < 0.999
        boxG.current.traverse((o) => {
          const m = o.material
          if (!m) return
          if (m.map) { m.opacity = boxFade } // tick — keep its own alpha blending
          else { m.transparent = fading; m.depthWrite = !fading; m.opacity = boxFade }
        })
      }
    },
  }))

  return (
    <group ref={root} scale={1.35}>
      <group ref={inner}>
        {/* fanned WHITE press sheets → gathered block. Wide (~2:1) web-offset stock;
            pure white — emissive white + toneMapped:false so the warm belt pool can
            never yellow it (the scene lights stay warm; only the sheet's response is
            corrected). metalness 0. */}
        <group ref={sheetsG}>
          {SHEETS.map((_, i) => (
            <mesh key={i} ref={(m) => (sheetRefs.current[i] = m)} castShadow>
              <boxGeometry args={[1.34, 0.014, 0.60]} />
              <meshStandardMaterial color={'#FFFFFF'} emissive={'#FFFFFF'} emissiveIntensity={0.42} roughness={0.9} metalness={0} toneMapped={false} />
            </mesh>
          ))}
        </group>

        {/* THREE mock textbooks (Quality). coverG keeps the grow-in scale animation
            from Scene (bind → 1); the three books grow together, then the kraft wrap
            grows over them. Covers are swappable material slots (textbook-{1,2,3}.webp). */}
        <group ref={coverG} position={[0, 0, 0]}>
          {TEXTBOOKS.map((b, i) => (
            <mesh key={i} geometry={bookGeo[i]} material={bookMats[i]} position={b.pos} rotation={b.rot} castShadow receiveShadow />
          ))}
        </group>

        {/* kraft wrap + thin twine cross (twine sits a clear step above the wrap top
            y 0.13, and the two strands cross at different heights → no coplanar faces) */}
        <group ref={wrapperG} position={[0, 0.11, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.96, 0.26, 0.7]} />
            <meshStandardMaterial color={EKTA.kraft} roughness={0.94} />
          </mesh>
          <mesh ref={twineH} position={[0, 0.145, 0]}>
            <boxGeometry args={[0.98, 0.02, 0.035]} />
            <meshStandardMaterial color={'#B9A778'} roughness={0.8} />
          </mesh>
          <mesh ref={twineV} position={[0, 0.153, 0]}>
            <boxGeometry args={[0.035, 0.02, 0.72]} />
            <meshStandardMaterial color={'#B9A778'} roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* cardboard box — body scales up; four flaps hinge open→closed (staggered) */}
      <group ref={boxG} position={[0, 0, 0]} visible={false}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.98, 0.6, 0.72]} />
          <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.3, 0.366]}>
          <boxGeometry args={[0.015, 0.6, 0.006]} />
          <meshStandardMaterial color={EKTA.kraftDark} roughness={1} />
        </mesh>
        {FLAPS.map((fl, i) => (
          <group key={i} position={fl.group}>
            <mesh ref={(m) => (flapRefs.current[i] = m)} position={fl.off} castShadow>
              <boxGeometry args={fl.geo} />
              <meshStandardMaterial color={fl.color} roughness={0.96} />
            </mesh>
          </group>
        ))}
        {/* green delivered tick — a clear 0.006 proud of the box front (z 0.36) so
            it never z-fights the face; alpha-mapped, so it keeps its own blending */}
        <group ref={tickG} position={[0, 0.34, 0.372]} visible={false}>
          <mesh>
            <circleGeometry args={[0.19, 40]} />
            <meshBasicMaterial map={tickTex} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

export default Book
