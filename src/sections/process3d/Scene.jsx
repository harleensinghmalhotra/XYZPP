import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial, Billboard } from '@react-three/drei'
import { useTranslation } from 'react-i18next'
import Belt from './Belt'
import Station, { fitLabelPx } from './Station'
import Book from './Book'
import Girl from './Girl'
import Dust from './Dust'
import { STATIONS, N, stationX, EKTA, CAM, LABEL_Y, ENDING, mapActiveF, mapBookX, legIndex, handoffOf, smooth, bell, lerp } from './constants'

const FLOOR_Y = -0.42

// Evening-showroom navy wall — a READABLE navy gradient (not black), warmer + a
// clear lift toward the belt line so the hall reads as evening, not a power cut.
function makeBackdrop() {
  const c = document.createElement('canvas')
  c.width = 16; c.height = 256
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, '#182A4E')
  grd.addColorStop(0.5, '#233A62')
  grd.addColorStop(0.82, '#2E4A7A')
  grd.addColorStop(1, '#1C3056')
  g.fillStyle = grd; g.fillRect(0, 0, 16, 256)
  return new THREE.CanvasTexture(c)
}

// Warm gold radial glow — the machine-lamp light pool (floor + shaft).
function makePool() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 2, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,214,140,0.9)')
  grd.addColorStop(0.4, 'rgba(226,168,74,0.42)')
  grd.addColorStop(1, 'rgba(200,150,60,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// Floating stage word — warm-gold italic serif, per leg of the journey.
function makeStageWord(text) {
  const W = 512, H = 128
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.clearRect(0, 0, W, H)
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.font = 'italic 600 60px Georgia, "Times New Roman", serif'
  g.shadowColor = 'rgba(226,170,80,0.55)'; g.shadowBlur = 18
  g.fillStyle = '#E8C070'
  g.fillText(text, W / 2, H / 2 + 4)
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
}

export default function Scene({ frozen = false, progress }) {
  const { t } = useTranslation('homeProcess')
  const { camera } = useThree()
  const bookApi = useRef()
  const girlApi = useRef()
  const stationApis = useRef([])
  const backdrop = useMemo(makeBackdrop, [])
  const pool = useMemo(makePool, [])

  const xs = useMemo(() => STATIONS.map((_, i) => stationX(i)), [])
  const lookX = useRef(xs[0])
  const heroLight = useRef() // warm lamp that travels with the hero through the dusk

  // ── idle-flicker kill ──────────────────────────────────────────────────────
  // All ambient motion (camera drift, breathing, belt, sparkles) runs on `vtime`,
  // a clock that ONLY advances while the user is scrolling. When scroll stops,
  // vtime freezes → every sin(time) holds still → no perpetual sub-pixel edge crawl
  // (the "whole screen flickers at rest" bug). movingRef gates the belt + sparkles.
  const lastP = useRef(0)
  const vel = useRef(0)
  const vtime = useRef(0)
  const movingRef = useRef(true)

  // stage-word textures per leg (EN/FR via locale), + crossfade state. Legs 0..4
  // ride with the box (Paper…Shipped); leg 5 "Delivered" is raised beside the girl
  // only at the catch (never a travelling gate label).
  const legTex = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => makeStageWord(t(`legs.${i}`))), [t])
  // one shared plaque font size for the active locale — fit to the widest station name
  const labelPx = useMemo(() => fitLabelPx(STATIONS.map((s) => t(`stages.${s.key}.name`))), [t])
  const stageMat = useRef()
  const stageGroup = useRef()
  const shownLeg = useRef(-1)

  useFrame((state, delta) => {
    const p = frozen ? 1 : THREE.MathUtils.clamp(progress?.current ?? 0, 0, 1)
    // scroll velocity → is the user actively scrolling? vtime only ticks while moving.
    const dp = Math.abs(p - lastP.current); lastP.current = p
    vel.current = Math.max(dp, vel.current * 0.9)
    const moving = !frozen && vel.current > 2e-4
    movingRef.current = moving
    if (moving) vtime.current += Math.min(delta, 0.05)
    const time = frozen ? 0 : vtime.current
    const activeF = mapActiveF(p)
    const bx = mapBookX(p)

    // ── hero rides the belt; box stops beside the girl (DELIVERED), she celebrates ──
    // R8-B: Harry's jumping GLB is a box-less joy-leap (open, raised hands), so the
    // box is NOT morphed into her hands — it stays DELIVERED on the belt (green tick)
    // at its rest point while she leaps for joy beside it. One box, always on the belt.
    const handoff = handoffOf(p) // 0 = riding/waiting, →1 = leaped + landed
    const book = bookApi.current
    if (book?.root) {
      book.root.position.x = bx
      book.root.position.y = frozen ? 0 : Math.sin(time * 1.6) * 0.012
      book.root.rotation.y = frozen ? -0.28 : -0.26 + Math.sin(time * 0.5) * 0.04
      book.root.visible = true
      book.apply(activeF, time, 1)
    }
    if (girlApi.current) girlApi.current.apply(handoff, time, camera.position.x)
    if (heroLight.current) heroLight.current.position.set(bx, 1.6, 1.3) // travels with the hero

    // ── stations: gold-trim arrival glow + Quality scanner ──
    stationApis.current.forEach((a, i) => {
      if (!a) return
      const arr = bell(activeF, i, 0.6)
      const em = 0.15 + arr * 0.6
      if (a.trimF) a.trimF.emissiveIntensity = em
      if (a.trimB) a.trimB.emissiveIntensity = em
      if (a.coneMat) {
        const s = bell(activeF, i, 0.5)
        a.coneMat.opacity = s * (0.12 + (frozen ? 0 : Math.sin(time * 5) * 0.02))
        if (a.laserMat) a.laserMat.opacity = s * 0.7
      }
    })

    // ── floating stage word ──────────────────────────────────────────────────
    // The leg caption (Paper…Shipped) floats above the box and fades at each gate.
    // "Delivered" arrives the SAME WAY as "Shipped": as the box reaches the final
    // gate/girl zone it fades in (deliv, keyed on p — NOT on the jump), then hangs
    // above the delivery point through the leap and the end HOLD.
    if (stageGroup.current && stageMat.current) {
      const deliv = smooth(0.75, 0.83, p) // Delivered presence — box reaching the girl
      let leg, op, wx, wy
      if (deliv < 0.02) {
        leg = legIndex(activeF) // 0..4 — Paper…Shipped
        const gd = Math.abs(activeF - Math.round(activeF))
        op = smooth(0.09, 0.34, gd)
        wx = bx; wy = 1.34 + Math.sin(time * 0.8) * 0.02
      } else {
        leg = 5 // "Delivered" — hangs above the delivery point, clear of the leap
        op = deliv
        wx = ENDING.girlX - 1.55; wy = 1.46 + Math.sin(time * 0.8) * 0.02
      }
      if (leg !== shownLeg.current) { shownLeg.current = leg; stageMat.current.map = legTex[leg]; stageMat.current.needsUpdate = true }
      stageMat.current.opacity = op
      stageGroup.current.position.set(wx, wy, 0.2)
    }

    // ── telephoto near side-on dolly; straight belt, everything in frame ──
    // At the catch the focus eases from the box toward the girl so the delivery is
    // framed, then holds there through the end beat.
    const focusX = lerp(bx, ENDING.girlX - 0.35, smooth(0.1, 0.72, handoff))
    // the leap goes high — raise the look target and ease the camera back at the apex
    // so the whole arc (and the box overhead) stays framed, then settle for the hold.
    const apex = smooth(0.16, 0.30, handoff) * (1 - smooth(0.42, 0.80, handoff))
    const tx = focusX + CAM.side + Math.sin(time * 0.16) * CAM.drift
    const ty = CAM.y + apex * 0.7 + Math.sin(time * 0.22) * 0.06
    const d = Math.abs(activeF - Math.round(activeF))
    const push = frozen ? 0 : (1 - THREE.MathUtils.clamp(d / 0.5, 0, 1)) ** 2
    const tz = CAM.z - push * 0.5 + apex * 1.4
    // SINGLE OWNER: the camera reads scroll progress DIRECTLY. Lenis already smooths
    // the scroll, so a second damping layer here just chased a smoothed value with
    // another smoothed value → micro overshoot ("palpitation"/ghost double-edges).
    // No lerp now. The sin-drift is a deterministic decoration (frozen at idle via
    // vtime), not a smoother — one smoothing layer total, everywhere.
    camera.position.set(tx, ty, tz)
    lookX.current = focusX
    camera.lookAt(lookX.current, CAM.lookY + apex * 0.85 + Math.sin(time * 0.2) * 0.02, 0)
  })

  return (
    <>
      <color attach="background" args={['#152444']} />
      <fog attach="fog" args={['#1B2E52', 18, 52]} />

      {/* deep-navy dusk wall */}
      <mesh position={[0, 5.5, -16]} scale={[100, 26, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={backdrop} toneMapped={false} depthWrite={false} fog={false} />
      </mesh>

      {/* evening base light — lifted so the hall + belt read; warmth from the pools */}
      <ambientLight intensity={0.55} color={'#4A5C82'} />
      <directionalLight position={[-6, 9, 5]} intensity={0.7} color={'#AFC0E4'} castShadow shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={['#4A5C82', '#141d33', 0.6]} />
      {/* warm lamp travelling with the hero so it never falls into darkness */}
      <pointLight ref={heroLight} position={[xs[0], 1.6, 1.3]} intensity={7} distance={5.5} decay={2} color={'#F7CE86'} />

      <Belt running={!frozen} runningRef={movingRef} />

      {/* stations + their warm light pools (machine lamps at dusk) */}
      {STATIONS.map((s, i) => {
        const x = stationX(i)
        return (
          <group key={s.key}>
            <group position={[x, 0, 0]}>
              <Station index={i} title={t(`stages.${s.key}.name`)} labelPx={labelPx} scan={s.key === 'quality'} register={(api) => (stationApis.current[i] = api)} />
            </group>
            {/* warm lamp above the gate — stronger, warmer machine-lamp pool */}
            <pointLight position={[x, LABEL_Y - 0.2, 0.5]} intensity={11} distance={6.5} decay={2} color={'#F8CE84'} />
            {/* glow pool on the floor */}
            <mesh position={[x, FLOOR_Y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[3.4, 2.6]} />
              <meshBasicMaterial map={pool} transparent opacity={0.72} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            {/* soft glow disc behind the apex (the lamp bloom) */}
            <mesh position={[x, LABEL_Y - 0.35, -0.3]}>
              <planeGeometry args={[2.6, 2.6]} />
              <meshBasicMaterial map={pool} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            {/* soft dust motes in the pool — static, so they drift by parallax while
                scrolling and never strobe or move at rest */}
            <Dust count={14} scale={[1.4, 1.8, 1.2]} position={[x, 0.9, 0]} size={5} opacity={0.5} color={'#F0D49A'} />
          </group>
        )
      })}

      <Book ref={bookApi} />

      {/* floating stage word above the hero */}
      <Billboard ref={stageGroup} position={[xs[0], 1.34, 0.15]}>
        <mesh>
          <planeGeometry args={[2.0, 0.5]} />
          <meshBasicMaterial ref={stageMat} map={legTex[0]} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </Billboard>

      {/* the girl waits at the belt's end and collects the delivered box */}
      <group position={[ENDING.girlX, 0, 0]}>
        <Girl ref={girlApi} floorY={FLOOR_Y} />
        <pointLight position={[0, 1.7, 1.4]} intensity={7} distance={6} decay={2} color={'#F7CE86'} />
        <mesh position={[0, FLOOR_Y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 2.4]} />
          <meshBasicMaterial map={pool} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {/* polished evening floor — lighter navy so the lit gates clearly reflect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]}>
        <planeGeometry args={[150, 70]} />
        <MeshReflectorMaterial
          resolution={256}
          mixBlur={2}
          mixStrength={2.4}
          blur={[380, 120]}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          depthScale={1}
          roughness={0.82}
          metalness={0.2}
          color={'#1A2C4E'}
          mirror={0}
        />
      </mesh>
    </>
  )
}
