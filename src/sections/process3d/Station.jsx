import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { ARCH, BELT, EKTA } from './constants'

// ── Reference arch gate (ref V1/MAIN) ────────────────────────────────────────
// A slim rounded "∩" hoop: straight legs + a semicircle cap, matte navy, with a
// thin continuous GOLD trim following the profile on the camera-facing faces, a
// small white label plaque on a stub above the apex, and small foot plates. All
// six gates are identical; Quality also carries the scanner head (ref V2).

// Closed 2D band outline of the arch (x = across, y = up), for ExtrudeGeometry.
function archShape(half, band) {
  const ro = half + band / 2
  const ri = half - band / 2
  const h = ARCH.legH
  const s = new THREE.Shape()
  s.moveTo(-ro, 0)
  s.lineTo(-ro, h)
  s.absarc(0, h, ro, Math.PI, 0, true) // outer arc over the top
  s.lineTo(ro, 0)
  s.lineTo(ri, 0)
  s.lineTo(ri, h)
  s.absarc(0, h, ri, 0, Math.PI, false) // inner arc back
  s.lineTo(-ri, 0)
  s.closePath()
  return s
}

// Small white label plaque — clean sign face (ref: tiny white plate, faint text).
function makeLabelTexture(num, title) {
  const W = 320, H = 132
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.fillStyle = '#FBF8F2'; g.fillRect(0, 0, W, H)
  g.fillStyle = EKTA.gold; g.fillRect(0, 0, W, 5)
  g.fillStyle = 'rgba(28,32,25,0.45)'
  g.font = '600 18px "DM Mono", ui-monospace, monospace'
  g.textBaseline = 'middle'
  g.fillText(`0${num}`, 20, 40)
  g.fillStyle = EKTA.navy
  g.font = '600 40px "Inter Tight", Inter, system-ui, sans-serif'
  g.fillText(title, 20, 86)
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
}

export default function Station({ index, title, scan, register }) {
  const navyGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(archShape(ARCH.half, ARCH.legW), {
      depth: ARCH.depth, bevelEnabled: true, bevelSize: 0.016, bevelThickness: 0.016, bevelSegments: 2, curveSegments: 30,
    })
    g.translate(0, 0, -ARCH.depth / 2)
    return g
  }, [])
  const trimGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(archShape(ARCH.half - 0.005, ARCH.trim), {
      depth: 0.03, bevelEnabled: false, curveSegments: 30,
    })
    return g
  }, [])
  const labelTex = useMemo(() => makeLabelTexture(index + 1, title), [index, title])

  const api = useMemo(() => ({ trimF: null, trimB: null, cone: null, coneMat: null, laser: null, laserMat: null }), [])
  useEffect(() => { register(api) }, [register, api])

  const ro = ARCH.half + ARCH.legW / 2 // leg centre-out (world ±Z after rotate)
  const apexY = ARCH.legH + ARCH.half

  return (
    <group>
      {/* navy arch — rotated so it straddles the belt in Z and faces ±X */}
      <mesh geometry={navyGeo} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={EKTA.navy} roughness={0.58} metalness={0.16} />
      </mesh>
      {/* gold trim, proud on each face */}
      <mesh geometry={trimGeo} rotation={[0, Math.PI / 2, 0]} position={[ARCH.depth / 2 - 0.005, 0, 0]}>
        <meshStandardMaterial ref={(m) => (api.trimF = m)} color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={0} roughness={0.34} metalness={0.7} toneMapped={false} />
      </mesh>
      <mesh geometry={trimGeo} rotation={[0, -Math.PI / 2, 0]} position={[-ARCH.depth / 2 + 0.005, 0, 0]}>
        <meshStandardMaterial ref={(m) => (api.trimB = m)} color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={0} roughness={0.34} metalness={0.7} toneMapped={false} />
      </mesh>

      {/* foot plates at each leg base */}
      {[-ro, ro].map((z) => (
        <mesh key={z} position={[0, 0.02, z]} castShadow>
          <boxGeometry args={[0.34, 0.05, 0.34]} />
          <meshStandardMaterial color={EKTA.navy2} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* stub + white plaque above the apex, facing the camera (±X) */}
      <mesh position={[0, apexY + 0.14, 0]}>
        <boxGeometry args={[0.05, 0.28, 0.05]} />
        <meshStandardMaterial color={EKTA.navy} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, apexY + 0.42, 0]} castShadow>
        <boxGeometry args={[0.09, 0.34, 0.72]} />
        <meshStandardMaterial color={'#F3EEE4'} roughness={0.7} />
      </mesh>
      {[0.048, -0.048].map((x, i) => (
        <mesh key={i} position={[x, apexY + 0.42, 0]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[0.68, 0.3]} />
          <meshBasicMaterial map={labelTex} toneMapped={false} />
        </mesh>
      ))}

      {/* Quality scanner (ref V2): navy head at the apex + downward light cone +
          a side laser emitter. Cone/laser opacity driven by Scene on arrival. */}
      {scan && (
        <group>
          <mesh position={[0, apexY - 0.18, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.22, 20]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.5} metalness={0.35} />
          </mesh>
          <mesh position={[0, apexY - 0.32, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.08, 20]} />
            <meshStandardMaterial color={EKTA.navy2} emissive={'#BFE0FF'} emissiveIntensity={0.6} roughness={0.3} toneMapped={false} />
          </mesh>
          {/* soft translucent cone of blue-white light onto the belt */}
          <mesh ref={(m) => (api.cone = m)} position={[0, (apexY - 0.36 + 0.2) / 2 + 0.1, 0]}>
            <coneGeometry args={[0.44, apexY - 0.36 - 0.2, 32, 1, true]} />
            <meshBasicMaterial ref={(m) => (api.coneMat = m)} color={'#A9CDF2'} transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* thin bright laser line across the object from a side emitter */}
          <mesh ref={(m) => (api.laser = m)} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, ARCH.half * 1.7, 8]} />
            <meshBasicMaterial ref={(m) => (api.laserMat = m)} color={'#EAF4FF'} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.34, ARCH.half - 0.02]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.2} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}
