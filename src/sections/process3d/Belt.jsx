import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BELT, EKTA } from './constants'

// Classic scrolling-texture trick: a navy belt surface with gold cleat lines,
// its texture offset advanced every frame → the belt appears to run. No physics.
function makeBeltTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = EKTA.navy
  g.fillRect(0, 0, 256, 64)
  // soft gold cleat highlights
  g.strokeStyle = 'rgba(200,154,60,0.22)'
  g.lineWidth = 7
  for (let x = 0; x <= 256; x += 32) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke()
  }
  // dark seams between cleats
  g.strokeStyle = 'rgba(8,20,40,0.9)'
  g.lineWidth = 2
  for (let x = 16; x <= 256; x += 32) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(BELT.length / 2.2, 1)
  t.anisotropy = 4
  return t
}

export default function Belt({ running = true }) {
  const tex = useMemo(makeBeltTexture, [])
  const halfW = BELT.width / 2

  useFrame((_, dt) => {
    if (running) tex.offset.x -= Math.min(dt, 0.05) * 0.14
  })

  const legXs = [-9, -4.5, 0, 4.5, 9]

  return (
    <group>
      {/* running belt surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BELT.y, 0]} receiveShadow>
        <planeGeometry args={[BELT.length, BELT.width]} />
        <meshStandardMaterial map={tex} roughness={0.82} metalness={0.08} />
      </mesh>

      {/* side rails */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, BELT.y - 0.14, s * (halfW + 0.13)]} castShadow receiveShadow>
          <boxGeometry args={[BELT.length, 0.5, 0.26]} />
          <meshStandardMaterial color={EKTA.navy2} roughness={0.45} metalness={0.35} />
        </mesh>
      ))}

      {/* end rollers */}
      {[BELT.x0 - 0.4, BELT.x1 + 0.4].map((x) => (
        <mesh key={x} position={[x, BELT.y - 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, BELT.width + 0.5, 20]} />
          <meshStandardMaterial color={EKTA.gold2} roughness={0.35} metalness={0.6} />
        </mesh>
      ))}

      {/* support legs */}
      {legXs.map((x) =>
        [-1, 1].map((s) => (
          <mesh key={`${x}-${s}`} position={[x, -0.45, s * (halfW - 0.1)]} castShadow>
            <boxGeometry args={[0.22, 0.9, 0.22]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.6} metalness={0.2} />
          </mesh>
        )),
      )}
    </group>
  )
}
