import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Billboard, useGLTF } from '@react-three/drei'
import { smooth, ENDING } from './constants'

// ── Harry's girl (R8-A) ───────────────────────────────────────────────────────
// The STANDING beat is now a REAL textured GLB (Hitem3D, simplified to ~70K tris,
// meshopt + webp-2048, 537 KB) so she reads as standing IN the dusk hall rather
// than printed on it — she takes real scene lighting, no grade hack. The pick and
// jump beats stay as Harry's sprites (R7 choreography untouched). At the reach the
// GLB crossfades out (~opacity, depthWrite off) exactly as the pick sprite fades
// in — one girl visible at a time, no double-girl frame, reverse-scrub identical.
const GLB_URL = '/qfp/conveyor/girl.glb'
const STAND_H = 2.15 // world height — matches the old standing sprite so the swap doesn't jump
const GLB_YAW = -0.36 // slight turn toward the approaching box (safe: mesh is clean all round)

// Pick + jump remain sprites. h = world height, aspect = w/h, dx = horizontal offset
// of the plane centre so the pick sprite's held box lands on boxRestX.
const POSES = {
  pick: { url: '/qfp/conveyor/girl-pick.webp', h: 2.28, aspect: 0.739, dx: -0.34 },
  jump: { url: '/qfp/conveyor/girl-jump.webp', h: 2.78, aspect: 0.5433, dx: 0.0 },
}
const ORDER = ['pick', 'jump']
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
  const glbRoot = useRef()
  const layer = useRef({}) // pose -> mesh
  const matRef = useRef({}) // pose -> material
  const shadow = useRef()
  const shadowMat = useRef()

  const tex = useMemo(() => ({ pick: loadTex(POSES.pick.url), jump: loadTex(POSES.jump.url) }), [])
  const shadowTex = useMemo(shadowTexture, [])

  // Real 3D standing girl: compute smooth normals (GLB ships POSITION+UV only, so
  // it takes no lighting until we build normals), match height to the sprite, and
  // plant her feet exactly on the belt surface (y=0). Collect materials for the fade.
  const { scene: glbScene } = useGLTF(GLB_URL)
  const glb = useMemo(() => {
    const box = new THREE.Box3().setFromObject(glbScene)
    const size = box.getSize(new THREE.Vector3())
    const scale = STAND_H / size.y
    const yOffset = -box.min.y * scale // lift feet from min.y up to 0
    const mats = []
    glbScene.traverse((o) => {
      if (!o.isMesh) return
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals()
      o.castShadow = false; o.receiveShadow = false
      const m = o.material
      // transparent + depthWrite are set ONCE (never per-frame — toggling either
      // forces a shader recompile every frame, which tanks fps). At opacity 1 a
      // transparent+depthWrite material is pixel-identical to an opaque one but she
      // can now fade to the pick sprite with no recompile.
      m.transparent = true; m.depthWrite = true
      mats.push(m)
    })
    return { scale, yOffset, mats }
  }, [glbScene])

  useImperativeHandle(ref, () => ({
    get root() { return outer.current },
    // handoff 0..1 = celebration ramp; camX = camera x (for the parallax turn).
    apply(handoff, time, camX = ENDING.girlX) {
      const h = handoff
      // GLB→pick is a REAL pose change (upright 3D → bent sprite), so a 50/50
      // crossfade would show two distinct girls. Instead the GLB fades out FAST and
      // the pick sprite fades in just behind it — their opacities barely overlap, so
      // neither is ever prominent while the other is: no double-girl, no hard pop.
      const standOp = 1 - smooth(0.02, 0.14, h) // GLB standing girl — gone by ~0.14
      const jumpOp = smooth(0.42, 0.54, h) * (1 - smooth(0.74, 0.88, h))
      const pickIn = smooth(0.07, 0.20, h) // pick rises just as the GLB clears
      const pickOp = pickIn * (1 - jumpOp)

      // GLB standing girl: fade out as she reaches (opacity only — no material-state
      // toggling, so no per-frame recompile)
      for (const m of glb.mats) m.opacity = standOp
      if (glbRoot.current) glbRoot.current.visible = standOp > 0.002

      // pick + jump sprites
      const ops = { pick: pickOp, jump: jumpOp }
      let i = 0
      for (const name of ORDER) {
        const m = layer.current[name]; const mat = matRef.current[name]
        if (!m || !mat) continue
        const op = ops[name]
        m.visible = op > 0.002
        mat.opacity = op
        m.renderOrder = 10 + i++
      }

      // hop arc — peaks mid-jump, back to ground by the settle; idle breathing at rest
      const hop = Math.sin(smooth(0.40, 0.90, h) * Math.PI) * HOP_H
      const idle = Math.sin(time * 1.5) * 0.012 * (1 - smooth(0.05, 0.3, h))
      if (lift.current) lift.current.position.y = hop + idle

      // she STEPS left to meet the resting box (reach), then straightens back as she
      // lifts it overhead → the box is picked up, never bumped into her.
      const lean = -LEAN * smooth(0.05, 0.28, h) * (1 - smooth(0.45, 0.72, h))
      if (outer.current) outer.current.position.x = lean

      // contact shadow: shrinks + fades as she leaves the ground
      if (shadow.current && shadowMat.current) {
        const air = hop / HOP_H
        shadow.current.scale.setScalar(1 - air * 0.42)
        shadowMat.current.opacity = 0.5 - air * 0.3
      }

      // parallax turn for the flat sprites only (the GLB is real 3D — it parallaxes
      // for free as the camera dollies)
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
        {/* real 3D standing girl — takes the scene's dusk lighting directly */}
        <group ref={glbRoot} position={[0, glb.yOffset, 0]} scale={glb.scale} rotation={[0, GLB_YAW, 0]}>
          <primitive object={glbScene} />
        </group>

        <Billboard ref={tilt} lockX lockZ>
          {ORDER.map((name) => {
            const P = POSES[name]
            return (
              <mesh
                key={name}
                ref={(m) => (layer.current[name] = m)}
                position={[P.dx, P.h / 2, 0]}
                scale={[P.h * P.aspect, P.h, 1]}
                visible={false}
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
                  opacity={0}
                />
              </mesh>
            )
          })}
        </Billboard>
      </group>
    </group>
  )
})

useGLTF.preload(GLB_URL)

export default Girl
