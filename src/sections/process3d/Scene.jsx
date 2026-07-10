import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll, ContactShadows } from '@react-three/drei'
import { useTranslation } from 'react-i18next'
import Belt from './Belt'
import Station from './Station'
import Book from './Book'
import { STATIONS, N, stationX, EKTA } from './constants'

// The whole rig. Always mounted inside <ScrollControls>, so useScroll is safe.
// `frozen` (reduced-motion) pins progress at the final station — a static
// composed "You're Covered" shot — and stops the belt.
export default function Scene({ frozen = false }) {
  const { t } = useTranslation('homeProcess')
  const { camera } = useThree()
  const scroll = useScroll()
  const bookRef = useRef()
  const glowRefs = useRef([])
  const [bookState, setBookState] = useState(frozen ? 'covered' : 'pages')

  const xs = useMemo(() => STATIONS.map((_, i) => stationX(i)), [])

  useFrame((state) => {
    const p = frozen ? 1 : scroll.offset
    const activeF = p * (N - 1)
    const idx = THREE.MathUtils.clamp(Math.round(activeF), 0, N - 1)
    const nextState = STATIONS[idx].state
    if (nextState !== bookState) setBookState(nextState)

    // book rides the belt; a gentle bob + rotation gives it life
    const bx = THREE.MathUtils.lerp(xs[0], xs[N - 1], p)
    if (bookRef.current) {
      bookRef.current.position.x = bx
      const tt = state.clock.elapsedTime
      bookRef.current.position.y = frozen ? 0.02 : 0.02 + Math.sin(tt * 1.6) * 0.03
      bookRef.current.rotation.y = frozen ? -0.5 : -0.4 + Math.sin(tt * 0.6) * 0.08
    }

    // stations light up as the book arrives and stay lit behind it
    glowRefs.current.forEach((m, i) => {
      if (!m) return
      const on = THREE.MathUtils.clamp(activeF - i + 1.1, 0, 1)
      m.emissiveIntensity = on * 1.3
    })

    // camera eases along to keep the travelling book framed
    const tx = bx * 0.62
    camera.position.x += (tx - camera.position.x) * (frozen ? 1 : 0.09)
    camera.lookAt(bx * 0.85, 1.0, 0)
  })

  return (
    <>
      <color attach="background" args={[EKTA.cream]} />
      <fog attach="fog" args={[EKTA.cream, 20, 46]} />

      {/* soft studio lighting, gold-tinted key + cool navy fill */}
      <ambientLight intensity={0.75} color={EKTA.cream} />
      <directionalLight position={[-6, 10, 8]} intensity={1.15} color={'#FBEFD4'} />
      <directionalLight position={[9, 6, -4]} intensity={0.35} color={'#9FB0D8'} />
      <hemisphereLight args={[EKTA.cream, EKTA.cream2, 0.4]} />

      <Belt running={!frozen} />

      {STATIONS.map((s, i) => (
        <group key={s.key} position={[stationX(i), 0, 0]}>
          <Station
            index={i}
            title={t(`stages.${s.key}.name`)}
            variant={s.variant}
            accent={s.accent}
            glowRef={(el) => (glowRefs.current[i] = el)}
          />
        </group>
      ))}

      <Book ref={bookRef} state={bookState} />

      {/* ground + subtle grounded shadow catch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[90, 55]} />
        <meshStandardMaterial color={EKTA.cream2} roughness={1} />
      </mesh>
      <ContactShadows position={[0, -0.89, 0]} scale={46} blur={2.6} opacity={0.32} far={7} color={EKTA.navy} />
    </>
  )
}
