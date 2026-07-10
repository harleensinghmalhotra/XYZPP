import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BELT, EKTA } from './constants'

// Low-profile navy belt (ref MAIN/V1): a matte navy bed with a subtly perforated
// running surface and a lighter side rail. Not a tall deck — it hugs the floor.
function makeSurfaceTexture() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = '#16294a'; g.fillRect(0, 0, 128, 64)
  // faint perforation dots
  g.fillStyle = 'rgba(255,255,255,0.05)'
  for (let y = 8; y < 64; y += 12) {
    for (let x = 8 + ((y / 12) % 2) * 6; x < 128; x += 12) {
      g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(BELT.length / 1.2, 1)
  t.anisotropy = 4
  return t
}

// Small 4-point brand sparkle drawn onto the rail (ref V2/V3 detail).
function makeSparkleTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  g.clearRect(0, 0, 64, 64)
  g.fillStyle = 'rgba(220,205,165,0.5)'
  g.beginPath()
  g.moveTo(32, 8); g.quadraticCurveTo(34, 30, 56, 32); g.quadraticCurveTo(34, 34, 32, 56)
  g.quadraticCurveTo(30, 34, 8, 32); g.quadraticCurveTo(30, 30, 32, 8)
  g.fill()
  return new THREE.CanvasTexture(c)
}

export default function Belt({ running = true }) {
  const surf = useMemo(makeSurfaceTexture, [])
  const spark = useMemo(makeSparkleTexture, [])
  const halfW = BELT.width / 2
  const topY = BELT.y

  useFrame((_, dt) => {
    if (running) surf.offset.x -= Math.min(dt, 0.05) * 0.12
  })

  const sparkXs = [-6.6, 2.2, 9.9]

  return (
    <group>
      {/* running surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, topY + 0.001, 0]} receiveShadow>
        <planeGeometry args={[BELT.length, BELT.width]} />
        <meshStandardMaterial map={surf} color={'#1a2f52'} roughness={0.72} metalness={0.12} />
      </mesh>

      {/* bed body — low box under the surface */}
      <mesh position={[0, topY - BELT.deck / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BELT.length, BELT.deck, BELT.width]} />
        <meshStandardMaterial color={EKTA.navy} roughness={0.6} metalness={0.18} />
      </mesh>

      {/* lighter side rails along the top edges */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, topY - 0.05, s * (halfW + 0.006)]}>
          <boxGeometry args={[BELT.length, 0.09, 0.03]} />
          <meshStandardMaterial color={EKTA.navy2} roughness={0.45} metalness={0.35} />
        </mesh>
      ))}

      {/* brand sparkles on the front rail */}
      {sparkXs.map((x) => (
        <mesh key={x} position={[x, topY - 0.14, halfW + 0.02]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshBasicMaterial map={spark} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}

      {/* support legs */}
      {[-9, -4.5, 0, 4.5, 9].map((x) =>
        [-1, 1].map((s) => (
          <mesh key={`${x}-${s}`} position={[x, topY - BELT.deck - 0.1, s * (halfW - 0.16)]} castShadow>
            <boxGeometry args={[0.14, 0.2, 0.14]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.6} metalness={0.2} />
          </mesh>
        )),
      )}
    </group>
  )
}
