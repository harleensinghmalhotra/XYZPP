import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { EKTA, transform, smooth, lerp } from './constants'

// ── The hero object (R5). ONE continuous object that evolves down the dusk line:
// a generous fanned sheet-stack → navy hardcover (gold frame + emblem) → kraft
// twine bundle → open box → sealed box, then a GREEN delivered tick stamps on and
// the box rides on to the girl (Scene handles the travel + hand-off). No lift.

// open-book emblem for the cover
function emblemTexture(fg) {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.clearRect(0, 0, S, S)
  g.strokeStyle = fg; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round'
  g.beginPath()
  g.moveTo(64, 40); g.quadraticCurveTo(40, 30, 24, 40); g.lineTo(24, 92); g.quadraticCurveTo(40, 84, 64, 92)
  g.moveTo(64, 40); g.quadraticCurveTo(88, 30, 104, 40); g.lineTo(104, 92); g.quadraticCurveTo(88, 84, 64, 92)
  g.lineTo(64, 40); g.stroke()
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
}

// fine page lines for the fore-edge (reads as a stack of sheets)
function pageLinesTexture() {
  const c = document.createElement('canvas')
  c.width = 8; c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = '#EFE7D6'; g.fillRect(0, 0, 8, 64)
  g.strokeStyle = 'rgba(150,135,105,0.5)'; g.lineWidth = 1
  for (let y = 3; y < 64; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(8, y); g.stroke() }
  const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6); return t
}

// green delivered tick — clean flat badge, white check on a green disc
function tickTexture() {
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  g.clearRect(0, 0, S, S)
  g.fillStyle = '#3EA65C'; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill()
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 100, 0, 7); g.stroke()
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 30; g.lineCap = 'round'; g.lineJoin = 'round'
  g.beginPath(); g.moveTo(78, 132); g.lineTo(116, 172); g.lineTo(182, 92); g.stroke()
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t
}

const Book = forwardRef(function Book(_props, ref) {
  const root = useRef()
  const inner = useRef()
  const sheetsG = useRef()
  const sheetRefs = useRef([])
  const coverG = useRef()
  const wrapperG = useRef()
  const twineH = useRef()
  const twineV = useRef()
  const boxG = useRef()
  const flapRefs = useRef([])
  const tickG = useRef()

  const coverEmblem = useMemo(() => emblemTexture('#C79A3E'), [])
  const pageLines = useMemo(pageLinesTexture, [])
  const tickTex = useMemo(tickTexture, [])

  // a generous fresh-print pile (bigger for frame-1 presence)
  const SHEETS = useMemo(
    () => Array.from({ length: 13 }, (_, i) => ({
      loose: { x: Math.sin(i * 1.5) * 0.16, y: 0.02 + i * 0.03, z: (i - 6) * 0.05, rot: (i - 6) * 0.05 },
      tight: { x: 0, y: 0.02 + i * 0.022, z: 0, rot: 0 },
    })), [],
  )

  const FLAPS = useMemo(() => [
    { axis: 'x', open: -1.5, group: [0, 0.6, -0.36], off: [0, 0, 0.18], geo: [0.98, 0.02, 0.36], color: EKTA.kraft },
    { axis: 'x', open: 1.5, group: [0, 0.615, 0.36], off: [0, 0, -0.18], geo: [0.98, 0.02, 0.36], color: EKTA.kraft },
    { axis: 'z', open: 1.5, group: [-0.49, 0.585, 0], off: [0.245, 0, 0], geo: [0.49, 0.02, 0.72], color: EKTA.kraftDark },
    { axis: 'z', open: -1.5, group: [0.49, 0.585, 0], off: [-0.245, 0, 0], geo: [0.49, 0.02, 0.72], color: EKTA.kraftDark },
  ], [])

  useImperativeHandle(ref, () => ({
    get root() { return root.current },
    apply(activeF, time) {
      const bind = transform(1, activeF)
      const wrap = transform(2, activeF)
      const box = transform(3, activeF)
      const seal = transform(4, activeF)
      const crown = transform(5, activeF)

      sheetRefs.current.forEach((m, i) => {
        if (!m) return
        const s = SHEETS[i]
        m.position.x = lerp(s.loose.x, s.tight.x, bind)
        m.position.y = lerp(s.loose.y, s.tight.y, bind)
        m.position.z = lerp(s.loose.z, s.tight.z, bind)
        m.rotation.y = lerp(s.loose.rot, s.tight.rot, bind)
      })
      if (sheetsG.current) sheetsG.current.visible = bind < 0.98

      if (coverG.current) {
        const cs = smooth(0.1, 1, bind)
        coverG.current.visible = bind > 0.02 && wrap < 0.985
        coverG.current.scale.set(lerp(0.7, 1, cs), lerp(0.05, 1, cs), lerp(0.7, 1, cs))
      }

      if (wrapperG.current) {
        const w1 = smooth(0, 0.72, wrap)
        const w2 = smooth(0.5, 1, wrap)
        wrapperG.current.visible = wrap > 0.02 && box < 0.6
        wrapperG.current.scale.set(lerp(0.92, 1, w1), lerp(0.92, 1, w1), lerp(0.05, 1, w1))
        if (twineH.current) twineH.current.scale.x = w2
        if (twineV.current) twineV.current.scale.z = w2
      }

      if (inner.current) inner.current.position.y = lerp(0, -0.3, box)
      if (boxG.current) {
        boxG.current.visible = box > 0.02
        boxG.current.scale.y = lerp(0.05, 1, smooth(0, 0.72, box))
      }
      flapRefs.current.forEach((f, i) => {
        if (!f) return
        f.visible = box > 0.12
        const a = lerp(FLAPS[i].open, 0, seal)
        if (FLAPS[i].axis === 'x') f.rotation.x = a
        else f.rotation.z = a
      })

      // Delivered — the green tick STAMPS onto the box face (press + overshoot, stays)
      if (tickG.current) {
        tickG.current.visible = crown > 0.02
        const press = smooth(0.06, 0.45, crown)
        const over = Math.sin(smooth(0.1, 0.6, crown) * Math.PI) * 0.14 // squash overshoot
        const s = press + over
        tickG.current.scale.set(s, s, 1)
      }
    },
  }))

  const decal = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }

  return (
    <group ref={root} scale={1.35}>
      <group ref={inner}>
        {/* fanned printed sheets → gathered block */}
        <group ref={sheetsG}>
          {SHEETS.map((_, i) => (
            <mesh key={i} ref={(m) => (sheetRefs.current[i] = m)} castShadow>
              <boxGeometry args={[0.92, 0.014, 0.64]} />
              <meshStandardMaterial color={'#F3ECDD'} roughness={0.9} />
            </mesh>
          ))}
        </group>

        {/* navy hardcover: cover + page block (clearly proud on the fore-edge, no
            coplanar faces → no jitter) + gold frame + emblem + ribbon */}
        <group ref={coverG} position={[0, 0.09, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.92, 0.15, 0.66]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.5} metalness={0.14} />
          </mesh>
          {/* page block: recessed inside the cover on all faces but the +X fore-edge,
              which protrudes a clear 0.05 → nothing coplanar to z-fight */}
          <mesh position={[0.06, 0, 0]}>
            <boxGeometry args={[0.9, 0.1, 0.58]} />
            <meshStandardMaterial color={'#EFE7D6'} roughness={0.85} map={pageLines} {...decal} />
          </mesh>
          {[[0, 0.24], [0, -0.24]].map(([x, z], i) => (
            <mesh key={`fh${i}`} position={[x, 0.078, z]}>
              <boxGeometry args={[0.62, 0.006, 0.02]} />
              <meshStandardMaterial color={EKTA.gold2} metalness={0.7} roughness={0.32} toneMapped={false} {...decal} />
            </mesh>
          ))}
          {[[0.31, 0], [-0.31, 0]].map(([x, z], i) => (
            <mesh key={`fv${i}`} position={[x, 0.078, z]}>
              <boxGeometry args={[0.02, 0.006, 0.5]} />
              <meshStandardMaterial color={EKTA.gold2} metalness={0.7} roughness={0.32} toneMapped={false} {...decal} />
            </mesh>
          ))}
          <mesh position={[0, 0.079, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.22, 0.22]} />
            <meshBasicMaterial map={coverEmblem} transparent toneMapped={false} {...decal} />
          </mesh>
          <mesh position={[0.42, -0.02, -0.16]}>
            <boxGeometry args={[0.04, 0.006, 0.16]} />
            <meshStandardMaterial color={EKTA.gold} metalness={0.5} roughness={0.4} toneMapped={false} {...decal} />
          </mesh>
        </group>

        {/* kraft wrap + thin twine cross */}
        <group ref={wrapperG} position={[0, 0.11, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.96, 0.26, 0.7]} />
            <meshStandardMaterial color={EKTA.kraft} roughness={0.94} />
          </mesh>
          <mesh ref={twineH} position={[0, 0.135, 0]}>
            <boxGeometry args={[0.98, 0.02, 0.035]} />
            <meshStandardMaterial color={'#B9A778'} roughness={0.8} {...decal} />
          </mesh>
          <mesh ref={twineV} position={[0, 0.145, 0]}>
            <boxGeometry args={[0.035, 0.02, 0.72]} />
            <meshStandardMaterial color={'#B9A778'} roughness={0.8} {...decal} />
          </mesh>
        </group>
      </group>

      {/* cardboard box — body scales up; four flaps hinge open→closed (staggered) */}
      <group ref={boxG} position={[0, 0, 0]} visible={false}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.98, 0.6, 0.72]} />
          <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.3, 0.361]}>
          <boxGeometry args={[0.015, 0.6, 0.006]} />
          <meshStandardMaterial color={EKTA.kraftDark} roughness={1} {...decal} />
        </mesh>
        {FLAPS.map((fl, i) => (
          <group key={i} position={fl.group}>
            <mesh ref={(m) => (flapRefs.current[i] = m)} position={fl.off} castShadow>
              <boxGeometry args={fl.geo} />
              <meshStandardMaterial color={fl.color} roughness={0.96} />
            </mesh>
          </group>
        ))}
        {/* green delivered tick, stamped onto the front (+Z) face */}
        <group ref={tickG} position={[0, 0.34, 0.368]} visible={false}>
          <mesh>
            <circleGeometry args={[0.19, 40]} />
            <meshBasicMaterial map={tickTex} transparent toneMapped={false} {...decal} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

export default Book
