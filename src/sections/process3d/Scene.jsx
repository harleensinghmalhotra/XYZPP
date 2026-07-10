import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll, ContactShadows, Sparkles, MeshReflectorMaterial } from '@react-three/drei'
import { useTranslation } from 'react-i18next'
import Belt from './Belt'
import Station from './Station'
import Book from './Book'
import { STATIONS, N, stationX, EKTA, CAM, LABEL_Y, smooth, bell, lerp } from './constants'

// Warm vertical gradient backdrop in Ekta's palette — cream sky, faint gold
// horizon, deeper cream floor. Drawn once, sits far behind everything.
function makeBackdrop() {
  const c = document.createElement('canvas')
  c.width = 16; c.height = 256
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, '#FDFAF4')
  grd.addColorStop(0.52, '#F6EFDF')
  grd.addColorStop(0.62, '#F2E7CE') // faint gold horizon glow
  grd.addColorStop(1, '#ECE4D4')
  g.fillStyle = grd
  g.fillRect(0, 0, 16, 256)
  const t = new THREE.CanvasTexture(c)
  return t
}

// The whole rig. Always mounted inside <ScrollControls>, so useScroll is safe.
// `frozen` (reduced-motion) pins progress at the final station — a static
// composed "You're Covered" beauty shot — and stops all motion.
export default function Scene({ frozen = false }) {
  const { t } = useTranslation('homeProcess')
  const { camera } = useThree()
  const scroll = useScroll()
  const bookApi = useRef()
  const stationApis = useRef([])
  const backdrop = useMemo(makeBackdrop, [])

  const xs = useMemo(() => STATIONS.map((_, i) => stationX(i)), [])
  const lookX = useRef(xs[0]) // eased look target — lags position → gentle drift
  const rim = useRef() // warm rim light that travels with the hero

  useFrame((state) => {
    const time = frozen ? 0 : state.clock.elapsedTime
    const p = frozen ? 1 : scroll.offset
    const activeF = p * (N - 1)
    const bx = lerp(xs[0], xs[N - 1], p)

    // ── the hero rides the belt, transforming as it goes ──
    const book = bookApi.current
    if (book?.root) {
      book.root.position.x = bx
      book.root.position.y = frozen ? 0 : Math.sin(time * 1.6) * 0.02
      book.root.rotation.y = frozen ? -0.32 : -0.3 + Math.sin(time * 0.5) * 0.06
      book.apply(activeF, time)
    }

    // ── stations: emissive arrival, bloom halo, label plate rises + fades in ──
    stationApis.current.forEach((a, i) => {
      if (!a?.glow) return
      const on = THREE.MathUtils.clamp(activeF - i + 1.1, 0, 1)
      const arr = bell(activeF, i, 0.55) // near this station → pulse
      const pulse = frozen ? 0 : Math.sin(time * 6) * 0.4 + 0.4
      a.glow.emissiveIntensity = on * 1.15 + arr * pulse
      if (a.halo) a.halo.material.opacity = on * 0.22 + arr * 0.3
      const rise = THREE.MathUtils.clamp(activeF - i + 1.2, 0, 1)
      if (a.labelG) a.labelG.position.y = lerp(LABEL_Y - 0.32, LABEL_Y, smooth(0, 1, rise))
      if (a.labelMat) a.labelMat.opacity = smooth(0.12, 1, rise)
    })

    // ── product-film camera: tracks the book with drift + arrival push-in ──
    const k = frozen ? 1 : CAM.ease
    const tx = bx + CAM.side + Math.sin(time * 0.16) * CAM.drift
    const ty = CAM.y + Math.sin(time * 0.22) * 0.1
    const d = Math.abs(activeF - Math.round(activeF)) // 0 at a station
    const push = frozen ? 0 : (1 - THREE.MathUtils.clamp(d / 0.5, 0, 1)) ** 2
    const tz = CAM.z - push * 0.8
    camera.position.x += (tx - camera.position.x) * k
    camera.position.y += (ty - camera.position.y) * k
    camera.position.z += (tz - camera.position.z) * k
    lookX.current += (bx - lookX.current) * (frozen ? 1 : 0.12)
    camera.lookAt(lookX.current, CAM.lookY + Math.sin(time * 0.2) * 0.04, 0)
    if (rim.current) rim.current.position.set(bx + 1.5, 3, 4.5) // rim travels with the book
  })

  return (
    <>
      <color attach="background" args={[EKTA.cream]} />
      <fog attach="fog" args={[EKTA.cream, 19, 48]} />

      {/* warm gradient backdrop, far behind the line */}
      <mesh position={[0, 6, -22]} scale={[80, 34, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={backdrop} toneMapped={false} depthWrite={false} fog={false} />
      </mesh>

      {/* studio lighting: warm gold key with real falloff (contrast = premium),
          cool navy fill for shadow shape, gentle warm hemi bounce */}
      <ambientLight intensity={0.42} color={EKTA.cream} />
      <directionalLight position={[-5, 9, 7]} intensity={1.7} color={'#FBEBCB'} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[9, 6, -4]} intensity={0.4} color={'#9FB0D8'} />
      <hemisphereLight args={[EKTA.cream, EKTA.cream2, 0.34]} />
      {/* soft warm rim on the hero — position tracks the book each frame */}
      <pointLight ref={rim} position={[xs[0] + 1.5, 3, 4.5]} intensity={16} distance={11} decay={2} color={'#F4D89A'} />

      <Belt running={!frozen} />

      {STATIONS.map((s, i) => (
        <group key={s.key} position={[stationX(i), 0, 0]}>
          <Station
            index={i}
            title={t(`stages.${s.key}.name`)}
            variant={s.variant}
            accent={s.accent}
            register={(api) => (stationApis.current[i] = api)}
          />
        </group>
      ))}

      <Book ref={bookApi} />

      {/* paper-dust motes drifting through the light — restraint: faint + slow */}
      <Sparkles count={70} scale={[24, 4.5, 3.5]} position={[0, 2.4, 0]} size={1.6} speed={frozen ? 0 : 0.28} opacity={0.5} color={'#E8D9B0'} />

      {/* polished floor with a soft reflection of the line + grounded contact */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[120, 60]} />
        <MeshReflectorMaterial
          resolution={256}
          mixBlur={1}
          mixStrength={2}
          blur={[200, 50]}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          depthScale={1.1}
          roughness={0.95}
          metalness={0}
          color={EKTA.cream2}
          mirror={0}
        />
      </mesh>
      <ContactShadows position={[0, -0.88, 0]} scale={48} blur={2.6} opacity={0.34} far={7} color={EKTA.navy} frames={frozen ? 1 : Infinity} />
    </>
  )
}
