import { forwardRef, useImperativeHandle, useRef } from 'react'
import { EKTA, celebrate, transform, smooth, lerp } from './constants'

// ── The happy customer (R4 finale) ───────────────────────────────────────────
// A clean minimal low-poly person in Ekta-palette clothing (matte premium-toy
// feel). Stands at the final station; as the sealed box arrives it raises its
// arms and does a joyful little jump, settling into a looped gentle bounce with
// arms up. Driven by the SAME celebrate() curve as the Book's box lift, so the
// box stays just above the raised hands. Imperative apply(crown, time) from Scene.

const SKIN = '#E7C6A0'
const HAIR = '#2B2932'

const Character = forwardRef(function Character(_props, ref) {
  const root = useRef()
  const lArm = useRef()
  const rArm = useRef()
  const legs = useRef()
  const head = useRef()

  useImperativeHandle(ref, () => ({
    get root() { return root.current },
    apply(activeF, time) {
      const crown = transform(5, activeF)
      const cel = celebrate(crown, time)
      const idle = Math.sin(time * 1.5) * 0.015 * (1 - cel.reach) // breathing before the box lands
      if (root.current) root.current.position.y = cel.bodyY + idle
      const armUp = Math.max(cel.reach * 0.5, cel.raise) // reach lifts partway, raise → full overhead
      if (lArm.current) lArm.current.rotation.z = lerp(0.28, 2.92, armUp)
      if (rArm.current) rArm.current.rotation.z = lerp(-0.28, -2.92, armUp)
      const tuck = Math.sin(smooth(0.4, 0.92, crown) * Math.PI) * 0.16 // knees bend at the jump peak
      if (legs.current) legs.current.scale.y = 1 - tuck
      if (head.current) head.current.rotation.x = -cel.raise * 0.22 // look up at the box
    },
  }))

  return (
    <group ref={root}>
      {/* legs + shoes */}
      <group ref={legs}>
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.28, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.32, 4, 10]} />
            <meshStandardMaterial color={EKTA.olive} roughness={0.82} />
          </mesh>
        ))}
        {[-0.1, 0.1].map((x) => (
          <mesh key={`s${x}`} position={[x, 0.05, 0.05]} castShadow>
            <boxGeometry args={[0.13, 0.09, 0.22]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* torso (navy shirt) + gold collar accent */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.3, 6, 12]} />
        <meshStandardMaterial color={EKTA.navy} roughness={0.66} metalness={0.06} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <torusGeometry args={[0.13, 0.016, 8, 20]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color={EKTA.gold2} metalness={0.6} roughness={0.35} toneMapped={false} />
      </mesh>

      {/* head */}
      <group ref={head} position={[0, 1.05, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 22, 22]} />
          <meshStandardMaterial color={SKIN} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.045, -0.01]}>
          <sphereGeometry args={[0.166, 22, 22, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        {[-0.06, 0.06].map((x) => (
          <mesh key={x} position={[x, 0.01, 0.15]}>
            <sphereGeometry args={[0.02, 10, 10]} />
            <meshStandardMaterial color={'#241f1a'} />
          </mesh>
        ))}
        {/* smile */}
        <mesh position={[0, -0.06, 0.145]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.05, 0.013, 8, 16, Math.PI]} />
          <meshStandardMaterial color={'#8a5140'} roughness={0.7} />
        </mesh>
      </group>

      {/* arms — shoulder-pivot groups swing from rest to overhead */}
      <group ref={lArm} position={[-0.2, 0.9, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.36, 4, 8]} />
          <meshStandardMaterial color={SKIN} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.43, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.72} />
        </mesh>
      </group>
      <group ref={rArm} position={[0.2, 0.9, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.36, 4, 8]} />
          <meshStandardMaterial color={SKIN} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.43, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.72} />
        </mesh>
      </group>
    </group>
  )
})

export default Character
