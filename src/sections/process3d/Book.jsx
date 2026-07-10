import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { EKTA, transform, smooth, bell, lerp } from './constants'

// ── The hero. ONE continuous object that evolves down the whole belt ──────────
// No visibility swaps: every part is built once and its transform/opacity is a
// smooth function of `activeF` (0..N-1 station space). The book physically
// gathers → binds → gets wrapped → drops into a box → seals → is stamped.
// Scene owns the single useFrame and drives us through the imperative `apply()`.

// Lid stack heights (local, book-space). Each layer sits a CLEAR epsilon proud of
// the one below so coplanar surfaces never z-fight; decals also get polygonOffset.
const BOX_TOP = 0.64
const LINER_Y = 0.585
const SHORT_FLAP_Y = 0.66
const LONG_FLAP_Y = 0.705
const TAPE_Y = 0.735
const LABEL_Y = 0.752
const SEAL_FLOAT_Y = 1.12 // badge floats above the sealed box, facing camera
const SEAL_TILT_X = -0.32 // face up toward the elevated camera
const SEAL_TILT_Y = 0.56 // turn toward the +x camera (counters the book's -0.3 yaw)

// Soft radial glow sprite — poor-man's bloom (no postprocessing dep).
function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,236,183,0.95)')
  grd.addColorStop(0.35, 'rgba(230,178,74,0.55)')
  grd.addColorStop(1, 'rgba(230,178,74,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// Shipping-label face — drawn once to a canvas so it needs no font loader.
function labelTexture() {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 176
  const g = c.getContext('2d')
  g.fillStyle = EKTA.paper; g.fillRect(0, 0, 256, 176)
  g.fillStyle = EKTA.gold; g.fillRect(0, 0, 256, 10)
  g.fillStyle = 'rgba(28,32,25,0.85)'
  g.font = '700 22px Inter, system-ui, sans-serif'
  g.fillText('QUARTERFOLD', 18, 48)
  g.strokeStyle = 'rgba(28,32,25,0.35)'; g.lineWidth = 2
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(18, 70 + i * 16); g.lineTo(150, 70 + i * 16); g.stroke() }
  for (let x = 18, i = 0; x < 238; x += 3 + (i % 3), i++) {
    g.fillStyle = i % 2 ? EKTA.ink : 'rgba(0,0,0,0)'
    g.fillRect(x, 132, 2 + (i % 2), 30)
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
}

// The stamped seal: a gold certification medallion — navy double ring, arced
// "QUARTERFOLD" wordmark, and a bold ✓ dead-centre. Reads instantly at distance.
function sealTexture() {
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const cx = S / 2, cy = S / 2
  // gold disc with a soft highlight
  const grd = g.createRadialGradient(cx - 60, cy - 70, 30, cx, cy, 250)
  grd.addColorStop(0, '#E7C877')
  grd.addColorStop(0.55, EKTA.gold2)
  grd.addColorStop(1, '#B0862F')
  g.fillStyle = grd
  g.beginPath(); g.arc(cx, cy, 244, 0, Math.PI * 2); g.fill()
  // navy rings
  g.strokeStyle = EKTA.navy
  g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, 228, 0, Math.PI * 2); g.stroke()
  g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, 190, 0, Math.PI * 2); g.stroke()
  // arced wordmark
  const arc = (text, r, a0, a1, size) => {
    g.fillStyle = EKTA.navy
    g.font = `700 ${size}px Inter, system-ui, sans-serif`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    const n = text.length
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))
      g.save(); g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.rotate(a + Math.PI / 2); g.fillText(text[i], 0, 0); g.restore()
    }
  }
  arc('QUARTERFOLD', 208, Math.PI * 1.30, Math.PI * 1.70, 34) // top arc
  arc('★  PRINTABILITIES  ★', 208, Math.PI * 0.72, Math.PI * 0.28, 24) // bottom arc (reversed)
  // bold check
  g.strokeStyle = EKTA.navy; g.lineWidth = 42; g.lineCap = 'round'; g.lineJoin = 'round'
  g.beginPath(); g.moveTo(cx - 92, cy + 6); g.lineTo(cx - 26, cy + 74); g.lineTo(cx + 96, cy - 78); g.stroke()
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.needsUpdate = true; return t
}

const Book = forwardRef(function Book(_props, ref) {
  const root = useRef()
  const inner = useRef()          // cover+pages+wrapper — sinks into the box
  const sheetsG = useRef()
  const sheetRefs = useRef([])
  const coverG = useRef()
  const coverMat = useRef()
  const wrapperG = useRef()
  const strapH = useRef()
  const strapV = useRef()
  const boxG = useRef()
  const flapRefs = useRef([])
  const tapeG = useRef()
  const sealG = useRef()          // stamped gold medallion
  const sealFaceMat = useRef()
  const impactG = useRef()
  const impactMat = useRef()
  const sealHalo = useRef()

  const glowTex = useMemo(glowTexture, [])
  const labelTex = useMemo(labelTexture, [])
  const sealTex = useMemo(sealTexture, [])

  // Loose (printed, askew) vs gathered (tight page-block) pose for each sheet.
  const SHEETS = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        loose: {
          x: Math.sin(i * 2.3) * 0.16,
          y: 0.06 + i * 0.055 + Math.sin(i * 1.1) * 0.015,
          z: (i % 2 ? 1 : -1) * 0.05 + Math.cos(i * 1.7) * 0.05,
          rot: (i - 3) * 0.085,
        },
        tight: { x: 0.02, y: 0.055 + i * 0.026, z: 0, rot: 0 },
      })),
    [],
  )

  // Four box flaps. Short flaps close low, long flaps close a clear layer above —
  // staggered heights so no two lids are ever coplanar.
  const FLAPS = useMemo(
    () => [
      { axis: 'x', open: -1.55, group: [0, LONG_FLAP_Y, -0.55], off: [0, 0, 0.275], geo: [1.5, 0.02, 0.55], color: EKTA.kraft },
      { axis: 'x', open: 1.55, group: [0, LONG_FLAP_Y, 0.55], off: [0, 0, -0.275], geo: [1.5, 0.02, 0.55], color: EKTA.kraft },
      { axis: 'z', open: 1.55, group: [-0.75, SHORT_FLAP_Y, 0], off: [0.375, 0, 0], geo: [0.75, 0.02, 1.1], color: EKTA.kraftDark },
      { axis: 'z', open: -1.55, group: [0.75, SHORT_FLAP_Y, 0], off: [-0.375, 0, 0], geo: [0.75, 0.02, 1.1], color: EKTA.kraftDark },
    ],
    [],
  )

  useImperativeHandle(ref, () => ({
    get root() { return root.current },
    apply(activeF, time) {
      const bind = transform(1, activeF)
      const wrap = transform(2, activeF)
      const box = transform(3, activeF)
      const seal = transform(4, activeF)
      const crown = transform(5, activeF)

      // 01→02  loose sheets gather & compress into a bound block
      sheetRefs.current.forEach((m, i) => {
        if (!m) return
        const s = SHEETS[i]
        m.position.x = lerp(s.loose.x, s.tight.x, bind)
        m.position.y = lerp(s.loose.y, s.tight.y, bind)
        m.position.z = lerp(s.loose.z, s.tight.z, bind)
        m.rotation.y = lerp(s.loose.rot, s.tight.rot, bind)
      })
      if (sheetsG.current) sheetsG.current.visible = wrap < 0.985

      if (coverG.current) {
        const cs = smooth(0.15, 1, bind)
        coverG.current.visible = bind > 0.002 && wrap < 0.985
        coverG.current.scale.set(lerp(0.55, 1, cs), lerp(0.02, 1, cs), lerp(0.5, 1, cs))
      }

      // Quality Check — an additive beam washed out over the bright cream scene
      // (read as a glitch), so the moment is carried by the Quality arch's emissive
      // pulse (Scene) + a cool "being inspected" glow sweeping the navy cover, which
      // reads cleanly over the dark book. A soft bell peaks as it passes Quality.
      if (coverMat.current) {
        coverMat.current.emissiveIntensity = bell(activeF, 1.0, 0.42) * 0.7
      }

      // 02→03  a wrap folds around the book (Z-fold), then cross straps tighten
      if (wrapperG.current) {
        const w1 = smooth(0, 0.72, wrap)
        const w2 = smooth(0.5, 1, wrap)
        wrapperG.current.visible = wrap > 0.002
        wrapperG.current.scale.set(lerp(0.9, 1, w1), lerp(0.9, 1, w1), lerp(0.03, 1, w1))
        if (strapH.current) strapH.current.scale.x = w2
        if (strapV.current) strapV.current.scale.z = w2
      }

      // 03→04  the bundle drops into a rising cardboard box
      if (inner.current) inner.current.position.y = lerp(0, -0.36, box)
      if (boxG.current) {
        boxG.current.visible = box > 0.002
        boxG.current.scale.y = lerp(0.04, 1, smooth(0, 0.72, box))
      }
      flapRefs.current.forEach((f, i) => {
        if (!f) return
        f.visible = box > 0.15
        const a = lerp(FLAPS[i].open, 0, seal)
        if (FLAPS[i].axis === 'x') f.rotation.x = a
        else f.rotation.z = a
      })

      // 04→05  Secure Dispatch — tape seam + shipping label seal the lid
      if (tapeG.current) {
        const s1 = smooth(0.3, 1, seal)
        tapeG.current.visible = seal > 0.02
        tapeG.current.scale.set(lerp(0.2, 1, s1), 1, lerp(0.2, 1, s1))
      }

      // You're Covered — the gold QFP seal stamps down onto the package and
      // settles facing the camera (legible ✓ at distance), then gently floats.
      if (sealG.current) {
        sealG.current.visible = crown > 0.02
        const drop = smooth(0.06, 0.5, crown)           // stamp descent
        const impact = bell(crown, 0.5, 0.12)            // squash + flash on contact
        const settled = smooth(0.5, 1, crown)
        const bob = Math.sin(time * 1.4) * 0.03 * settled
        sealG.current.position.y = lerp(SEAL_FLOAT_Y + 1.15, SEAL_FLOAT_Y, drop) + bob
        sealG.current.scale.set(1 + impact * 0.14, 1 - impact * 0.34, 1 + impact * 0.14)
        sealG.current.rotation.set(SEAL_TILT_X, SEAL_TILT_Y + Math.sin(time * 0.7) * 0.1 * settled, 0)
        if (sealFaceMat.current) sealFaceMat.current.emissiveIntensity = (0.22 + Math.sin(time * 3) * 0.08) * settled + impact * 0.9
      }
      if (impactG.current && impactMat.current) {
        const e = smooth(0.44, 0.95, crown)
        impactG.current.visible = crown > 0.42 && crown < 0.99
        impactG.current.scale.setScalar(lerp(0.5, 2.2, e))
        impactMat.current.opacity = bell(crown, 0.55, 0.2) * 0.8
      }
      if (sealHalo.current) sealHalo.current.material.opacity = (0.32 + 0.12 * Math.sin(time * 3)) * smooth(0.5, 1, crown)
    },
  }))

  // shared polygonOffset props for coplanar-risk decals
  const decal = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }

  return (
    <group ref={root} scale={2.0}>
      <group ref={inner}>
        {/* 01 · printed sheets → page block */}
        <group ref={sheetsG}>
          {SHEETS.map((_, i) => (
            <mesh key={i} ref={(m) => (sheetRefs.current[i] = m)} castShadow>
              <boxGeometry args={[1.16, 0.02, 0.82]} />
              <meshStandardMaterial color={EKTA.paper} roughness={0.88} />
            </mesh>
          ))}
        </group>

        {/* navy cover shell (grows during bind); gold spine sits proud of the face */}
        <group ref={coverG} position={[0, 0.17, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.3, 0.88]} />
            <meshStandardMaterial ref={coverMat} color={EKTA.navy} roughness={0.42} metalness={0.2} emissive={'#2A4A7A'} emissiveIntensity={0} toneMapped={false} />
          </mesh>
          <mesh position={[-0.6, 0, 0]}>
            <boxGeometry args={[0.06, 0.34, 0.94]} />
            <meshStandardMaterial color={EKTA.gold} roughness={0.35} metalness={0.6} toneMapped={false} {...decal} />
          </mesh>
        </group>

        {/* kraft wrapper + olive cross-straps (staggered heights, no crossing z-fight) */}
        <group ref={wrapperG} position={[0, 0.18, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.24, 0.36, 0.92]} />
            <meshStandardMaterial color={EKTA.cream2} roughness={0.92} />
          </mesh>
          <mesh ref={strapH} position={[0, 0.2, 0]}>
            <boxGeometry args={[1.26, 0.05, 0.16]} />
            <meshStandardMaterial color={EKTA.olive} roughness={0.55} {...decal} />
          </mesh>
          <mesh ref={strapV} position={[0, 0.23, 0]}>
            <boxGeometry args={[0.16, 0.05, 0.94]} />
            <meshStandardMaterial color={EKTA.olive} roughness={0.55} {...decal} />
          </mesh>
        </group>
      </group>

      {/* cardboard box — body scales up; four flaps hinge open→closed (staggered) */}
      <group ref={boxG} position={[0, 0, 0]} visible={false}>
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.64, 1.1]} />
          <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
        </mesh>
        {/* inner liner, clearly recessed below the rim (visible while open) */}
        <mesh position={[0, LINER_Y, 0]}>
          <boxGeometry args={[1.3, 0.02, 0.9]} />
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
      </group>

      {/* tape seam + shipping label — each a clear layer proud of the lid */}
      <group ref={tapeG} position={[0, TAPE_Y, 0]} visible={false}>
        <mesh>
          <boxGeometry args={[1.5, 0.02, 0.2]} />
          <meshStandardMaterial color={EKTA.kraftDark} roughness={0.6} {...decal} />
        </mesh>
        <mesh position={[0, LABEL_Y - TAPE_Y, 0.34]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.34]} />
          <meshBasicMaterial map={labelTex} toneMapped={false} {...decal} />
        </mesh>
      </group>

      {/* You're Covered — the gold QFP seal medallion, facing the camera so the ✓
          reads at distance; built in the XY plane, oriented by apply() each frame */}
      <group ref={sealG} position={[0, SEAL_FLOAT_Y, 0.1]} visible={false}>
        {/* soft glow behind */}
        <mesh ref={sealHalo} position={[0, 0, -0.08]}>
          <planeGeometry args={[1.9, 1.9]} />
          <meshBasicMaterial map={glowTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* gold coin body (axis → Z so the faces point at the camera) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 44]} />
          <meshStandardMaterial color={EKTA.gold2} metalness={0.7} roughness={0.28} toneMapped={false} />
        </mesh>
        {/* coin-edge rim (torus lies in XY → faces camera) */}
        <mesh>
          <torusGeometry args={[0.5, 0.035, 16, 48]} />
          <meshStandardMaterial color={'#9B7A2E'} metalness={0.8} roughness={0.3} toneMapped={false} />
        </mesh>
        {/* printed seal face, proud of the coin, facing camera */}
        <mesh position={[0, 0, 0.056]}>
          <circleGeometry args={[0.475, 48]} />
          <meshStandardMaterial ref={sealFaceMat} map={sealTex} emissive={EKTA.gold2} emissiveIntensity={0.22} metalness={0.25} roughness={0.42} toneMapped={false} {...decal} />
        </mesh>
        {/* stamp impact ring — expands + fades on contact, in the badge plane */}
        <group ref={impactG} position={[0, 0, 0.02]} visible={false}>
          <mesh>
            <torusGeometry args={[0.5, 0.02, 12, 56]} />
            <meshBasicMaterial ref={impactMat} color={EKTA.gold2} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

export default Book
