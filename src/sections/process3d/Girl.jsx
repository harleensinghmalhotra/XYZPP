import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'
import { smooth, ENDING } from './constants'

// ── Harry's Pixar-style girl (R7) ────────────────────────────────────────────
// Three camera-facing sprite poses at the belt's end, crossfaded (never hard-cut):
//   stand  → idle, hands at her sides, no box
//   pick   → bent, hands meeting the delivered box (box baked in her hands)
//   jump   → the celebration, box raised overhead
// Choreography (driven by `handoff` 0..1, the celebration ramp):
//   reach: stand→pick as the world box stops · morph: world box fades as the pick
//   sprite's box fades in (one box at any instant) · jump: pick→jump + hop arc ·
//   settle: jump→pick, lands holding the box, then HOLDS for the end beat.
// The planes are lit meshStandardMaterial (tone-mapped, dusk-graded) — not flat
// meshBasic stickers — with a soft contact shadow that scales/fades through the
// jump, and a 1–2° parallax turn so she never reads as a cardboard cutout.

// Per-pose world height (h), sprite aspect (w/h), and dx (horizontal offset of the
// plane centre from the girl's anchor, so her body stays put across poses and the
// pick sprite's held box lands on boxRestX). Tuned by eye against the ending frame.
const POSES = {
  stand: { url: '/qfp/conveyor/girl-stand.webp', h: 2.15, aspect: 0.4575, dx: 0.0 },
  pick: { url: '/qfp/conveyor/girl-pick.webp', h: 2.28, aspect: 0.739, dx: -0.34 },
  jump: { url: '/qfp/conveyor/girl-jump.webp', h: 2.78, aspect: 0.5433, dx: 0.0 },
}
const ORDER = ['stand', 'pick', 'jump']
const HOP_H = 0.5 // world height of the celebration hop
const LEAN = 0.8 // how far she steps LEFT toward the resting box during the reach

function loadTex(url) {
  const t = new THREE.TextureLoader().load(url)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  grd.addColorStop(0, 'rgba(0,0,0,0.6)'); grd.addColorStop(0.7, 'rgba(0,0,0,0.22)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

const Girl = forwardRef(function Girl({ floorY = -0.42 }, ref) {
  const outer = useRef()
  const tilt = useRef()
  const lift = useRef()
  const layer = useRef({}) // pose -> mesh
  const matRef = useRef({}) // pose -> material
  const shadow = useRef()
  const shadowMat = useRef()

  const tex = useMemo(() => ({
    stand: loadTex(POSES.stand.url), pick: loadTex(POSES.pick.url), jump: loadTex(POSES.jump.url),
  }), [])
  const shadowTex = useMemo(shadowTexture, [])

  useImperativeHandle(ref, () => ({
    get root() { return outer.current },
    // handoff 0..1 = celebration ramp; camX = camera x (for the parallax turn).
    apply(handoff, time, camX = ENDING.girlX) {
      const h = handoff
      // crossfade opacities — at most two poses are ever non-zero at once
      const standOp = 1 - smooth(0.05, 0.28, h)
      const jumpOp = smooth(0.42, 0.54, h) * (1 - smooth(0.74, 0.88, h))
      const pickOp = THREE.MathUtils.clamp(1 - standOp - jumpOp, 0, 1)
      const ops = { stand: standOp, pick: pickOp, jump: jumpOp }
      let i = 0
      for (const name of ORDER) {
        const m = layer.current[name]; const mat = matRef.current[name]
        if (!m || !mat) continue
        const op = ops[name]
        m.visible = op > 0.002
        mat.opacity = op
        m.renderOrder = 10 + i++ // stable back-to-front order for the crossfade
      }

      // hop arc — peaks mid-jump, back to ground by the settle; idle breathing at rest
      const hop = Math.sin(smooth(0.40, 0.90, h) * Math.PI) * HOP_H
      const idle = Math.sin(time * 1.5) * 0.012 * (1 - smooth(0.05, 0.3, h))
      if (lift.current) lift.current.position.y = hop + idle

      // she STEPS left to meet the resting box (reach), then straightens back as she
      // lifts it overhead → the box is picked up, never bumped into her.
      const lean = -LEAN * smooth(0.05, 0.28, h) * (1 - smooth(0.45, 0.72, h))
      if (outer.current) outer.current.position.x = lean

      // contact shadow: shrinks + fades as she leaves the ground, thumps back on land
      if (shadow.current && shadowMat.current) {
        const air = hop / HOP_H
        shadow.current.scale.setScalar(1 - air * 0.42)
        shadowMat.current.opacity = 0.5 - air * 0.3
      }

      // parallax: a subtle turn INTO the camera as it dollies, so she has depth
      if (tilt.current) {
        const off = THREE.MathUtils.clamp((ENDING.girlX - camX) * 0.02, -0.035, 0.035)
        tilt.current.rotation.y += (off - tilt.current.rotation.y) * 0.1
      }
    },
  }))

  return (
    <group ref={outer}>
      {/* soft elliptical contact shadow, on the belt surface under her feet */}
      <mesh ref={shadow} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.15, 1.05]} />
        <meshBasicMaterial ref={shadowMat} map={shadowTex} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>

      <group ref={lift}>
        <Billboard ref={tilt} lockX lockZ>
          {ORDER.map((name) => {
            const P = POSES[name]
            return (
              <mesh
                key={name}
                ref={(m) => (layer.current[name] = m)}
                position={[P.dx, P.h / 2, 0]}
                scale={[P.h * P.aspect, P.h, 1]}
                visible={name === 'stand'}
              >
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial
                  ref={(m) => (matRef.current[name] = m)}
                  map={tex[name]}
                  transparent
                  alphaTest={0.04}
                  depthWrite={false}
                  roughness={0.9}
                  metalness={0}
                  color={'#F3E4CE'}
                  emissive={'#20304F'}
                  emissiveIntensity={0.28}
                  opacity={name === 'stand' ? 1 : 0}
                />
              </mesh>
            )
          })}
        </Billboard>
      </group>
    </group>
  )
})

export default Girl
