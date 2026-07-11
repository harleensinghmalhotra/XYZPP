import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { smooth, ENDING } from './constants'

// ── Harry's girl (R8-B) — REAL 3D end to end ─────────────────────────────────
// Two textured GLBs, no sprites anywhere:
//   girl.glb       standing / idle (watches the box arrive)
//   girl-jump.glb  mid-leap, box held overhead (the jump is the FINAL beat)
// Choreography (handoff 0..1 = celebration ramp):
//   watch → anticipation crouch on the standing model → THE LEAP: standing dissolves
//   to the jumping model as it springs up (fast up, brief hang, soft land) and the
//   world box morphs into her overhead hands → she LANDS in the jump pose, grounded,
//   box held high, and HOLDS. No return to standing, no bend, ever.
// She gets her OWN warm key + cool fill + rim so her photo colours pop out of the
// dusk in both states. The jump GLB shipped chrome (metallicFactor 1) — de-metalled
// in the asset AND re-forced here; both GLBs ship POSITION+UV only, so we build
// smooth normals at load or they take no light.
const STAND_URL = '/qfp/conveyor/girl.glb'
const JUMP_URL = '/qfp/conveyor/girl-jump.glb'
const STAND_H = 2.15 // world height of the standing model
const MODEL_SCALE = STAND_H / 1.847 // both GLBs share the character's real scale
const GLB_YAW = -0.36 // standing girl turns slightly toward the approaching box
const JUMP_YAW = -0.2 // the leap faces a touch more to camera
const HOP_MAX = 1.25 // peak height of the leap arc

function prep(scene) {
  const mats = []
  const bbox = new THREE.Box3().setFromObject(scene)
  scene.traverse((o) => {
    if (!o.isMesh) return
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals()
    o.castShadow = false; o.receiveShadow = false
    const m = o.material
    m.metalness = 0; m.roughness = 0.9 // kill any chrome, matte skin/cloth
    m.metalnessMap = null; m.roughnessMap = null
    m.transparent = true; m.depthWrite = true // set ONCE — toggling recompiles every frame
    m.needsUpdate = true
    mats.push(m)
  })
  return { mats, minY: bbox.min.y }
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
  const standRoot = useRef()
  const jumpRoot = useRef()
  const shadow = useRef()
  const shadowMat = useRef()

  const { scene: standScene } = useGLTF(STAND_URL)
  const { scene: jumpScene } = useGLTF(JUMP_URL)
  const stand = useMemo(() => prep(standScene), [standScene])
  const jump = useMemo(() => prep(jumpScene), [jumpScene])
  const standY = -stand.minY * MODEL_SCALE // feet planted on the belt (y=0)
  const jumpY = -jump.minY * MODEL_SCALE // grounded landing height
  const shadowTex = useMemo(shadowTexture, [])

  useImperativeHandle(ref, () => ({
    get root() { return outer.current },
    apply(handoff, time, camX = ENDING.girlX) {
      const h = handoff
      // standing → jumping is a big pose change, so a 50/50 crossfade would show two
      // girls. The standing model fades out FAST and the jump model fades in just
      // behind it (low overlap) — never two prominent girls, no hard pop.
      const standOp = 1 - smooth(0.13, 0.22, h)
      const jumpOp = smooth(0.16, 0.27, h)
      for (const m of stand.mats) m.opacity = standOp
      for (const m of jump.mats) m.opacity = jumpOp
      if (standRoot.current) standRoot.current.visible = standOp > 0.002
      if (jumpRoot.current) jumpRoot.current.visible = jumpOp > 0.002

      // anticipation: the standing model crouches (dip + squash) then releases up
      const crouch = smooth(0.0, 0.09, h) * (1 - smooth(0.12, 0.18, h))
      const idle = Math.sin(time * 1.5) * 0.01 * (1 - smooth(0.0, 0.1, h))
      if (standRoot.current) {
        standRoot.current.position.y = standY - 0.15 * crouch + idle
        const sx = MODEL_SCALE * (1 + 0.04 * crouch)
        standRoot.current.scale.set(sx, MODEL_SCALE * (1 - 0.09 * crouch), sx)
      }

      // the leap arc: fast up (0.16→0.30), brief hang, soft land (0.42→0.74), then
      // grounded through the end HOLD — she never returns to standing.
      const hop = HOP_MAX * smooth(0.16, 0.30, h) * (1 - smooth(0.42, 0.74, h))
      if (jumpRoot.current) jumpRoot.current.position.y = jumpY + hop

      // contact shadow tracks the arc: shrinks + fades airborne, thumps on landing
      if (shadow.current && shadowMat.current) {
        const air = THREE.MathUtils.clamp(hop / HOP_MAX, 0, 1)
        const thump = Math.sin(smooth(0.70, 0.80, h) * Math.PI) * 0.14
        shadow.current.scale.setScalar(1 - air * 0.5 + thump)
        shadowMat.current.opacity = (0.5 - air * 0.34) * (h < 0.16 ? 1 : 1)
      }
    },
  }))

  return (
    <group ref={outer}>
      {/* her own three-point rig — gentle, so she reads as a person in the evening,
          not a lamp. Key is a subtle warm WHITE (not amber) so it lifts her honey
          kurta without tinting it orange or blowing the lit side to white; fill is a
          low, desaturated cool so the shadow side keeps soft form; rim just separates
          her hair from the dusk. Tuned by eye against Harry's source PNGs. */}
      <pointLight position={[1.5, 2.4, 2.0]} intensity={5} distance={8.5} decay={2} color={'#FFF0DC'} />
      <pointLight position={[-1.8, 1.9, 1.6]} intensity={2} distance={8} decay={2} color={'#B8C6DC'} />
      <pointLight position={[-0.6, 3.0, -1.4]} intensity={3} distance={7} decay={2} color={'#FFEACC'} />

      {/* soft elliptical contact shadow on the belt under her */}
      <mesh ref={shadow} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 1.05]} />
        <meshBasicMaterial ref={shadowMat} map={shadowTex} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* real 3D standing girl */}
      <group ref={standRoot} position={[0, standY, 0]} scale={MODEL_SCALE} rotation={[0, GLB_YAW, 0]}>
        <primitive object={standScene} />
      </group>
      {/* real 3D jumping girl — box baked in her overhead hands */}
      <group ref={jumpRoot} position={[0, jumpY, 0]} scale={MODEL_SCALE} rotation={[0, JUMP_YAW, 0]} visible={false}>
        <primitive object={jumpScene} />
      </group>
    </group>
  )
})

useGLTF.preload(STAND_URL)
useGLTF.preload(JUMP_URL)

export default Girl
