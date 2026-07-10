import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Sparkles, MeshReflectorMaterial } from '@react-three/drei'
import { useTranslation } from 'react-i18next'
import Belt from './Belt'
import Station from './Station'
import Book from './Book'
import { STATIONS, N, stationX, EKTA, CAM, smooth, bell, lerp } from './constants'

// Warm cream gradient backdrop (ref: soft cream studio wall), drawn once.
function makeBackdrop() {
  const c = document.createElement('canvas')
  c.width = 16; c.height = 256
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, '#EFE7D6')
  grd.addColorStop(0.5, '#F4EDDF')
  grd.addColorStop(1, '#EAE1CF')
  g.fillStyle = grd
  g.fillRect(0, 0, 16, 256)
  return new THREE.CanvasTexture(c)
}

// The whole rig. `progress` is a mutable ref (0..1) driven by the homepage's GSAP
// ScrollTrigger scrub — one page scroll system. `frozen` pins the final station.
export default function Scene({ frozen = false, progress }) {
  const { t } = useTranslation('homeProcess')
  const { camera } = useThree()
  const bookApi = useRef()
  const stationApis = useRef([])
  const backdrop = useMemo(makeBackdrop, [])

  const xs = useMemo(() => STATIONS.map((_, i) => stationX(i)), [])
  const lookX = useRef(xs[0])
  const rim = useRef()

  useFrame((state) => {
    const time = frozen ? 0 : state.clock.elapsedTime
    const p = frozen ? 1 : THREE.MathUtils.clamp(progress?.current ?? 0, 0, 1)
    const activeF = p * (N - 1)
    const bx = lerp(xs[0], xs[N - 1], p)

    // ── the hero rides the belt, transforming as it goes ──
    const book = bookApi.current
    if (book?.root) {
      book.root.position.x = bx
      book.root.position.y = frozen ? 0 : Math.sin(time * 1.6) * 0.015
      book.root.rotation.y = frozen ? -0.3 : -0.28 + Math.sin(time * 0.5) * 0.05
      book.apply(activeF, time)
    }

    // ── stations: subtle gold-trim glow on the passing arch; Quality scanner ──
    stationApis.current.forEach((a, i) => {
      if (!a) return
      const arr = bell(activeF, i, 0.6)
      const em = arr * 0.5
      if (a.trimF) a.trimF.emissiveIntensity = em
      if (a.trimB) a.trimB.emissiveIntensity = em
      if (a.coneMat) {
        const s = bell(activeF, i, 0.5)
        a.coneMat.opacity = s * (0.1 + (frozen ? 0 : Math.sin(time * 5) * 0.02))
        if (a.laserMat) a.laserMat.opacity = s * 0.7
      }
    })

    // ── MAIN-style camera: elevated 3/4 that looks partway down the line ──
    const k = frozen ? 1 : CAM.ease
    const tx = bx + CAM.side + Math.sin(time * 0.16) * CAM.drift
    const ty = CAM.y + Math.sin(time * 0.22) * 0.08
    const d = Math.abs(activeF - Math.round(activeF))
    const push = frozen ? 0 : (1 - THREE.MathUtils.clamp(d / 0.5, 0, 1)) ** 2
    const tz = CAM.z - push * 0.6
    camera.position.x += (tx - camera.position.x) * k
    camera.position.y += (ty - camera.position.y) * k
    camera.position.z += (tz - camera.position.z) * k
    lookX.current += (bx - lookX.current) * (frozen ? 1 : 0.12)
    camera.lookAt(lookX.current, CAM.lookY + Math.sin(time * 0.2) * 0.03, 0)
    if (rim.current) rim.current.position.set(bx + 1.5, 2.4, 4.2)
  })

  return (
    <>
      <color attach="background" args={['#F1E9D8']} />
      <fog attach="fog" args={['#EDE4D2', 16, 46]} />

      {/* warm cream backdrop, far behind the line */}
      <mesh position={[0, 6, -20]} scale={[90, 30, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={backdrop} toneMapped={false} depthWrite={false} fog={false} />
      </mesh>

      {/* warm soft studio light — matte feel, gold reserved for trim + seal */}
      <ambientLight intensity={0.6} color={'#FBF3E2'} />
      <directionalLight position={[-5, 8, 6]} intensity={1.25} color={'#FBEED6'} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[7, 5, -3]} intensity={0.3} color={'#AEBBDA'} />
      <hemisphereLight args={['#F6EFDF', '#D8CFBB', 0.4]} />
      <pointLight ref={rim} position={[xs[0] + 1.5, 2.4, 4.2]} intensity={9} distance={9} decay={2} color={'#F6E2B4'} />

      <Belt running={!frozen} />

      {STATIONS.map((s, i) => (
        <group key={s.key} position={[stationX(i), 0, 0]}>
          <Station
            index={i}
            title={t(`stages.${s.key}.name`)}
            scan={s.key === 'quality'}
            register={(api) => (stationApis.current[i] = api)}
          />
        </group>
      ))}

      <Book ref={bookApi} />

      {/* faint warm dust motes in the light */}
      <Sparkles count={50} scale={[26, 3.5, 3]} position={[0, 1.6, 0]} size={1.4} speed={frozen ? 0 : 0.22} opacity={0.4} color={'#E6D6AE'} />

      {/* polished concrete floor with a soft reflection + grounded contact */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]}>
        <planeGeometry args={[140, 70]} />
        <MeshReflectorMaterial
          resolution={256}
          mixBlur={2.2}
          mixStrength={0.6}
          blur={[400, 120]}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          depthScale={1}
          roughness={0.95}
          metalness={0}
          color={'#DED7C6'}
          mirror={0}
        />
      </mesh>
      <ContactShadows position={[0, -0.41, 0]} scale={44} blur={2.4} opacity={0.3} far={5} color={EKTA.navy} frames={frozen ? 1 : Infinity} />
    </>
  )
}
