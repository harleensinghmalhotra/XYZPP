import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'
import { ARCH, APEX_Y, LABEL_Y, EKTA } from './constants'

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

function makeLabelTexture(num, title) {
  const W = 512, H = Math.round(W / PLATE_ASPECT)
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4
  const draw = () => {
    g.clearRect(0, 0, W, H)
    if (plateImg && plateImg.complete && plateImg.naturalWidth) g.drawImage(plateImg, 0, 0, W, H)
    g.textAlign = 'center'; g.textBaseline = 'middle'
    // small number eyebrow
    g.fillStyle = 'rgba(15,36,68,0.45)'
    g.font = '600 20px "DM Mono", ui-monospace, monospace'
    g.fillText(`0${num}`, W / 2, H * 0.36)
    // station name, navy, sized to fit the cream face
    g.fillStyle = EKTA.navy
    let fs = 62
    g.font = `600 ${fs}px "Inter Tight", Inter, system-ui, sans-serif`
    const maxW = W * 0.7
    while (g.measureText(title).width > maxW && fs > 26) { fs -= 2; g.font = `600 ${fs}px "Inter Tight", Inter, system-ui, sans-serif` }
    g.fillText(title, W / 2, H * 0.56)
    t.needsUpdate = true
  }
  draw()
  if (plateImg && !plateImg.complete) plateImg.addEventListener('load', draw, { once: true })
  return t
}

export default function Station({ index, title, scan, register }) {
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
  const labelTex = useMemo(() => makeLabelTexture(index + 1, title), [index, title])

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
          <meshBasicMaterial map={labelTex} transparent toneMapped={false} />
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
