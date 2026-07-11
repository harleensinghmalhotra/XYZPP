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
  g.fillStyle = '#223A63'; g.fillRect(0, 0, 128, 64)
  // faint perforation dots
  g.fillStyle = 'rgba(255,255,255,0.06)'
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

// (R6: the 4-point brand "sparkle" that sat on the rail was the reference image's
// AI watermark faithfully reproduced — removed. Dust motes in the pools remain.)

export default function Belt({ running = true }) {
  const surf = useMemo(makeSurfaceTexture, [])
  const halfW = BELT.width / 2
  const topY = BELT.y

  useFrame((_, dt) => {
    if (running) surf.offset.x -= Math.min(dt, 0.05) * 0.12
  })

  return (
    <group>
      {/* running surface — navy with a clear sheen that catches the warm pools; a
          clear step above the bed top (no 0.001 near-coplanar gap → no z-fight) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, topY + 0.006, 0]} receiveShadow>
        <planeGeometry args={[BELT.length, BELT.width]} />
        <meshStandardMaterial map={surf} color={'#31517f'} roughness={0.5} metalness={0.35} />
      </mesh>

      {/* bed body — low box under the surface */}
      <mesh position={[0, topY - BELT.deck / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BELT.length, BELT.deck, BELT.width]} />
        <meshStandardMaterial color={EKTA.navy2} roughness={0.55} metalness={0.25} />
      </mesh>

      {/* brushed side rails — catch a gold rim from the pools */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, topY - 0.05, s * (halfW + 0.006)]}>
          <boxGeometry args={[BELT.length, 0.09, 0.03]} />
          <meshStandardMaterial color={'#33507f'} roughness={0.4} metalness={0.5} />
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
