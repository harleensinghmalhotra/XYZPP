import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'
import { smooth } from './constants'

// ── Harry's Pixar-style girl (R6) ────────────────────────────────────────────
// Camera-facing sprites at the belt's end. Waiting = the box-free standing pose
// (so the delivered 3D tick-box beside her is the ONLY box); on catch she swaps to
// girl-jump (box overhead) and hops. Soft contact shadow, world-scaled, lit by the
// final light pool. Poses carry their own aspect/height, applied on swap.
const POSES = {
  wait: { url: '/qfp/conveyor/girl-stand.webp', h: 1.55, aspect: 640 / 741 },
  jump: { url: '/qfp/conveyor/girl-jump.webp', h: 2.15, aspect: 382 / 761 }, // taller: box overhead
}

function loadTex(url) {
  const t = new THREE.TextureLoader().load(url)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

const Girl = forwardRef(function Girl({ floorY = -0.42 }, ref) {
  const outer = useRef()
  const lift = useRef()
  const plane = useRef()
  const mat = useRef()
  const shadow = useRef()
  const shadowMat = useRef()

  const tex = useMemo(() => ({ wait: loadTex(POSES.wait.url), jump: loadTex(POSES.jump.url) }), [])
  const shadowTex = useMemo(shadowTexture, [])
  const pose = useRef('wait')

  const setPose = (name) => {
    pose.current = name
    const P = POSES[name]
    if (mat.current) { mat.current.map = tex[name]; mat.current.needsUpdate = true }
    if (plane.current) { plane.current.scale.set(P.h * P.aspect, P.h, 1); plane.current.position.y = P.h / 2 }
  }

  useImperativeHandle(ref, () => ({
    get root() { return outer.current },
    // handoff: 0 = waiting; crosses 0.5 = box caught → jump + settle bounce
    apply(handoff, time) {
      const caught = handoff >= 0.5
      const want = caught ? 'jump' : 'wait'
      if (pose.current !== want) setPose(want)
      const hop = Math.sin(smooth(0.5, 0.9, handoff) * Math.PI) * 0.24 // gentle joyful hop
      const settled = smooth(0.85, 1, handoff)
      const idle = Math.sin(time * 1.5) * 0.01 * (1 - handoff)
      const bounce = Math.sin(time * 3) * 0.04 * settled
      if (lift.current) lift.current.position.y = hop + bounce + idle
      if (shadow.current && shadowMat.current) {
        const air = hop / 0.24
        shadow.current.scale.setScalar(1 - air * 0.35)
        shadowMat.current.opacity = 0.45 - air * 0.22
      }
    },
  }))

  return (
    <group ref={outer}>
      <mesh ref={shadow} position={[0, floorY + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial ref={shadowMat} map={shadowTex} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={lift}>
        <Billboard lockX lockZ>
          <mesh ref={plane} position={[0, POSES.wait.h / 2, 0]} scale={[POSES.wait.h * POSES.wait.aspect, POSES.wait.h, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial ref={mat} map={tex.wait} transparent alphaTest={0.06} toneMapped={false} />
          </mesh>
        </Billboard>
      </group>
    </group>
  )
})

export default Girl
