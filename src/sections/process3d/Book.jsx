import { forwardRef } from 'react'
import { EKTA } from './constants'

// The hero object: a book that transforms as it rides the belt. Six swappable
// states, one per station. Instant swaps (visibility toggle) are fine at scaffold
// stage — the mesh/group for each state is prepared up front. Order matches
// STATIONS[*].state: pages → bound → wrapped → boxed → sealed → covered.

// 01 · Print — a loose stack of freshly-printed sheets, slightly askew
function Pages() {
  const sheets = [0, 1, 2, 3, 4, 5]
  return (
    <group position={[0, 0.02, 0]}>
      {sheets.map((i) => (
        <mesh
          key={i}
          position={[(i - 2.5) * 0.012, 0.03 + i * 0.035, (i % 2 ? 1 : -1) * 0.02]}
          rotation={[0, (i - 2.5) * 0.03, 0]}
          castShadow
        >
          <boxGeometry args={[1.15, 0.02, 0.82]} />
          <meshStandardMaterial color={EKTA.paper} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// 02 · Quality — a bound book, checked. Navy cover, cream page-edge, tick glow.
function Bound() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[1.18, 0.28, 0.86]} />
        <meshStandardMaterial color={EKTA.navy} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* cream page block, slightly inset, protruding on the fore-edge */}
      <mesh position={[0.03, 0.16, 0]} castShadow>
        <boxGeometry args={[1.16, 0.22, 0.8]} />
        <meshStandardMaterial color={EKTA.paper} roughness={0.85} />
      </mesh>
      {/* gold spine stripe */}
      <mesh position={[-0.57, 0.16, 0]}>
        <boxGeometry args={[0.06, 0.29, 0.87]} />
        <meshStandardMaterial color={EKTA.gold} roughness={0.4} metalness={0.5} toneMapped={false} />
      </mesh>
      {/* subtle tick glow floating above */}
      <group position={[0, 0.75, 0]} rotation={[0, 0, -0.35]}>
        <mesh position={[-0.08, -0.02, 0]}>
          <boxGeometry args={[0.09, 0.2, 0.05]} />
          <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[0.12, 0.05, 0]} rotation={[0, 0, 1.9]}>
          <boxGeometry args={[0.09, 0.34, 0.05]} />
          <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

// 03 · Fulfillment — the book wrapped/kitted into a bundle with cross straps
function Wrapped() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.2, 0.34, 0.88]} />
        <meshStandardMaterial color={EKTA.cream2} roughness={0.9} />
      </mesh>
      {/* cross straps */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[1.22, 0.04, 0.14]} />
        <meshStandardMaterial color={EKTA.olive} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.14, 0.04, 0.9]} />
        <meshStandardMaterial color={EKTA.olive} roughness={0.6} />
      </mesh>
    </group>
  )
}

// 04 · Warehouse — the bundle placed in an open cardboard box
function Boxed() {
  const wall = (args, pos, rot) => (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
    </mesh>
  )
  return (
    <group position={[0, 0.02, 0]}>
      {/* box body */}
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.44, 0.56, 1.04]} />
        <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
      </mesh>
      {/* darker inner rim to read as "open" */}
      <mesh position={[0, 0.57, 0]}>
        <boxGeometry args={[1.24, 0.02, 0.84]} />
        <meshStandardMaterial color={EKTA.kraftDark} roughness={1} />
      </mesh>
      {/* content peeking */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.1, 0.16, 0.74]} />
        <meshStandardMaterial color={EKTA.cream2} roughness={0.9} />
      </mesh>
      {/* two open flaps */}
      {wall([1.44, 0.5, 0.02], [0, 0.78, -0.52], [-0.9, 0, 0])}
      {wall([1.44, 0.5, 0.02], [0, 0.78, 0.52], [0.9, 0, 0])}
    </group>
  )
}

// 05 · Ship — a sealed shipping box with tape + shipping label
function Sealed() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.46, 0.6, 1.06]} />
        <meshStandardMaterial color={EKTA.kraft} roughness={0.95} />
      </mesh>
      {/* packing tape seam across the top */}
      <mesh position={[0, 0.605, 0]}>
        <boxGeometry args={[1.47, 0.02, 0.2]} />
        <meshStandardMaterial color={EKTA.kraftDark} roughness={0.7} />
      </mesh>
      {/* shipping label */}
      <mesh position={[0, 0.605, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.34]} />
        <meshStandardMaterial color={EKTA.paper} roughness={0.9} />
      </mesh>
    </group>
  )
}

// 06 · You're Covered — the sealed box, secured, with a glowing seal/shield
function Covered() {
  return (
    <group position={[0, 0.02, 0]}>
      <Sealed />
      {/* gold seal ring floating above — the "we've got it" flourish */}
      <group position={[0, 1.05, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.05, 16, 40]} />
          <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.3} toneMapped={false} />
        </mesh>
        <mesh position={[-0.06, -0.02, 0]} rotation={[0, 0, -0.35]}>
          <boxGeometry args={[0.06, 0.14, 0.04]} />
          <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        <mesh position={[0.08, 0.03, 0]} rotation={[0, 0, 1.9]}>
          <boxGeometry args={[0.06, 0.24, 0.04]} />
          <meshStandardMaterial color={EKTA.gold2} emissive={EKTA.gold2} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

const STATES = ['pages', 'bound', 'wrapped', 'boxed', 'sealed', 'covered']

const Book = forwardRef(function Book({ state = 'pages' }, ref) {
  return (
    <group ref={ref}>
      <group visible={state === 'pages'}><Pages /></group>
      <group visible={state === 'bound'}><Bound /></group>
      <group visible={state === 'wrapped'}><Wrapped /></group>
      <group visible={state === 'boxed'}><Boxed /></group>
      <group visible={state === 'sealed'}><Sealed /></group>
      <group visible={state === 'covered'}><Covered /></group>
    </group>
  )
})

export { STATES }
export default Book
