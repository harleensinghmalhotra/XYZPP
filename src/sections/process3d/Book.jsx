import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { EKTA, transform, smooth, lerp } from './constants'

// ── The hero. ONE continuous object that evolves down the whole belt ──────────
// No visibility swaps: every part is built once and its transform/opacity is a
// smooth function of `activeF` (0..N-1 station space). The book physically
// gathers → binds → gets wrapped → drops into a box → seals → is crowned.
// Scene owns the single useFrame and drives us through the imperative `apply()`.

// Soft radial glow sprite — our poor-man's bloom (no postprocessing dep).
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
  // faux barcode
  for (let x = 18, i = 0; x < 238; x += 3 + (i % 3), i++) {
    g.fillStyle = i % 2 ? EKTA.ink : 'rgba(0,0,0,0)'
    g.fillRect(x, 132, 2 + (i % 2), 30)
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
}

const Book = forwardRef(function Book(_props, ref) {
  const root = useRef()
  const inner = useRef()          // cover+pages+wrapper — this is what sinks into the box
  const sheetsG = useRef()
  const sheetRefs = useRef([])
  const coverG = useRef()
  const scanG = useRef()
  const scanMat = useRef()
  const wrapperG = useRef()
  const strapH = useRef()
  const strapV = useRef()
  const boxG = useRef()
  const flapRefs = useRef([])
  const sealG = useRef()
  const crownG = useRef()
  const crownMat = useRef()
  const crownHalo = useRef()

  const glowTex = useMemo(glowTexture, [])
  const labelTex = useMemo(labelTexture, [])

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

  // Four box flaps: [hinge axis 'x'|'z', hinge sign, open angle].
  const FLAPS = useMemo(
    () => [
      { axis: 'x', sign: -1, open: -1.55 },
      { axis: 'x', sign: 1, open: 1.55 },
      { axis: 'z', sign: -1, open: 1.55 },
      { axis: 'z', sign: 1, open: -1.55 },
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

      // navy cover clamps around the gathering pages
      if (coverG.current) {
        const cs = smooth(0.15, 1, bind)
        coverG.current.visible = bind > 0.002 && wrap < 0.985
        coverG.current.scale.set(lerp(0.55, 1, cs), lerp(0.02, 1, cs), lerp(0.5, 1, cs))
      }

      // Quality Check — a bright light-curtain sweeps front-to-back over the book
      if (scanG.current && scanMat.current) {
        const st = (activeF - 0.84) / 0.36
        if (st > 0 && st < 1 && bind > 0.5) {
          scanG.current.visible = true
          scanG.current.position.z = lerp(-0.62, 0.62, st)
          scanMat.current.opacity = Math.sin(st * Math.PI) * 0.85
        } else scanG.current.visible = false
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
      // flaps splay open while boxing, then fold flat while sealing
      flapRefs.current.forEach((f, i) => {
        if (!f) return
        f.visible = box > 0.15
        const a = lerp(FLAPS[i].open, 0, seal)
        if (FLAPS[i].axis === 'x') f.rotation.x = a
        else f.rotation.z = a
      })

      // 04→05  Secure Dispatch — tape seam + shipping label seal the lid
      if (sealG.current) {
        const s1 = smooth(0.3, 1, seal)
        sealG.current.visible = seal > 0.02
        sealG.current.scale.set(lerp(0.2, 1, s1), 1, lerp(0.2, 1, s1))
      }

      // You're Covered — gold seal crown floats up, pulses, slowly turns
      if (crownG.current) {
        const c1 = smooth(0, 1, crown)
        crownG.current.visible = crown > 0.02
        crownG.current.scale.setScalar(lerp(0.25, 1, c1))
        crownG.current.position.y = 1.44 + Math.sin(time * 1.4) * 0.04 * c1
        crownG.current.rotation.y = Math.sin(time * 0.8) * 0.22 // gentle sway, stays readable
        if (crownMat.current) crownMat.current.emissiveIntensity = (1.5 + Math.sin(time * 3) * 0.45) * c1
        if (crownHalo.current) crownHalo.current.material.opacity = (0.6 + 0.2 * Math.sin(time * 3)) * c1
      }
    },
  }))

  return (
    <group ref={root} scale={1.4}>
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

        {/* navy cover shell (grows during bind), gold spine hairline */}
        <group ref={coverG} position={[0, 0.17, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.3, 0.88]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.42} metalness={0.2} />
          </mesh>
          <mesh position={[-0.585, 0, 0]}>
            <boxGeometry args={[0.05, 0.31, 0.89]} />
            <meshStandardMaterial color={EKTA.gold} roughness={0.35} metalness={0.6} toneMapped={false} />
          </mesh>
        </group>

        {/* Quality scan — a vertical additive light-curtain that sweeps in Z */}
        <mesh ref={scanG} position={[0, 0.42, 0]} visible={false}>
          <planeGeometry args={[1.55, 0.95]} />
          <meshBasicMaterial ref={scanMat} color={'#CFE8FF'} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* kraft wrapper + olive cross-straps */}
        <group ref={wrapperG} position={[0, 0.18, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.24, 0.36, 0.92]} />
            <meshStandardMaterial color={EKTA.cream2} roughness={0.92} />
          </mesh>
          <mesh ref={strapH} position={[0, 0.19, 0]}>
            <boxGeometry args={[1.26, 0.05, 0.16]} />
            <meshStandardMaterial color={EKTA.olive} roughness={0.55} />
          </mesh>
          <mesh ref={strapV} position={[0, 0.19, 0]}>
            <boxGeometry args={[0.16, 0.05, 0.94]} />
            <meshStandardMaterial color={EKTA.olive} roughness={0.55} />
          </mesh>
        </group>
      </group>

      {/* cardboard box — body scales up; four flaps hinge open→closed */}
      <group ref={boxG} position={[0, 0, 0]} visible={false}>
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.64, 1.1]} />
          <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.63, 0]}>
          <boxGeometry args={[1.28, 0.02, 0.88]} />
          <meshStandardMaterial color={EKTA.kraftDark} roughness={1} />
        </mesh>
        {/* flaps hinged at the top rim */}
        <group position={[0, 0.64, -0.55]}>
          <mesh ref={(m) => (flapRefs.current[0] = m)} position={[0, 0, 0.275]} castShadow>
            <boxGeometry args={[1.5, 0.02, 0.55]} />
            <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
          </mesh>
        </group>
        <group position={[0, 0.64, 0.55]}>
          <mesh ref={(m) => (flapRefs.current[1] = m)} position={[0, 0, -0.275]} castShadow>
            <boxGeometry args={[1.5, 0.02, 0.55]} />
            <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
          </mesh>
        </group>
        <group position={[-0.75, 0.64, 0]}>
          <mesh ref={(m) => (flapRefs.current[2] = m)} position={[0.375, 0, 0]} castShadow>
            <boxGeometry args={[0.75, 0.02, 1.1]} />
            <meshStandardMaterial color={EKTA.kraftDark} roughness={0.98} />
          </mesh>
        </group>
        <group position={[0.75, 0.64, 0]}>
          <mesh ref={(m) => (flapRefs.current[3] = m)} position={[-0.375, 0, 0]} castShadow>
            <boxGeometry args={[0.75, 0.02, 1.1]} />
            <meshStandardMaterial color={EKTA.kraftDark} roughness={0.98} />
          </mesh>
        </group>
      </group>

      {/* seal — packing-tape seam + shipping label */}
      <group ref={sealG} position={[0, 0.655, 0]} visible={false}>
        <mesh>
          <boxGeometry args={[1.5, 0.02, 0.2]} />
          <meshStandardMaterial color={EKTA.kraftDark} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.012, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.34]} />
          <meshBasicMaterial map={labelTex} toneMapped={false} />
        </mesh>
      </group>

      {/* crown — the "we've got it" gold seal that floats above the sealed box */}
      <group ref={crownG} position={[0, 1.44, 0]} visible={false}>
        <mesh ref={crownHalo} position={[0, 0, -0.03]}>
          <planeGeometry args={[2.4, 2.4]} />
          <meshBasicMaterial map={glowTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* seal ring — faces the camera like a wax medallion, tilted to catch light */}
        <mesh rotation={[0.32, 0, 0]}>
          <torusGeometry args={[0.4, 0.065, 20, 48]} />
          <meshStandardMaterial ref={crownMat} color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.5} metalness={0.7} roughness={0.25} toneMapped={false} />
        </mesh>
        {/* checkmark inside the ring */}
        <mesh position={[-0.1, -0.03, 0]} rotation={[0, 0, -0.42]}>
          <boxGeometry args={[0.075, 0.2, 0.06]} />
          <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        <mesh position={[0.13, 0.06, 0]} rotation={[0, 0, 1.9]}>
          <boxGeometry args={[0.075, 0.36, 0.06]} />
          <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
})

export default Book
