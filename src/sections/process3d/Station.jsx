import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { BELT, EKTA, BEAM_TOP, LABEL_Y } from './constants'

// A floating label plate: cream card, navy title, gold hairline + step number —
// drawn to a canvas so it needs no external font (troika) and stays crisp & 3D.
function makeLabelTexture(num, title) {
  const W = 512
  const H = 224
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  // plate
  g.fillStyle = EKTA.cream
  g.fillRect(0, 0, W, H)
  g.strokeStyle = 'rgba(15,36,68,0.12)'
  g.lineWidth = 3
  g.strokeRect(2, 2, W - 4, H - 4)
  // gold top hairline — her signature accent
  g.fillStyle = EKTA.gold
  g.fillRect(0, 0, W, 8)
  // step number (mono, wide-tracked)
  g.fillStyle = EKTA.gold
  g.font = '600 34px "DM Mono", ui-monospace, monospace'
  g.textBaseline = 'middle'
  g.fillText(`0${num}`, 34, 66)
  // eyebrow
  g.fillStyle = 'rgba(28,32,25,0.5)'
  g.font = '600 22px Inter, system-ui, sans-serif'
  g.fillText('S T A T I O N', 104, 64)
  // title
  g.fillStyle = EKTA.navy
  g.font = '500 62px "Inter Tight", Inter, system-ui, sans-serif'
  g.fillText(title, 32, 150)
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

// Small radial glow, reused for the accent-bar bloom halo (no postprocessing).
function makeGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,0.9)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export default function Station({ index, title, variant, accent, register }) {
  const labelTex = useMemo(() => makeLabelTexture(index + 1, title), [index, title])
  const glowTex = useMemo(makeGlowTexture, [])
  const accentColor = accent === 'olive' ? EKTA.olive : EKTA.gold
  const halfW = BELT.width / 2 + 0.35
  const pillarH = BEAM_TOP

  // One mutable api object per station — Scene fills nothing; it only reads these
  // THREE refs each frame to drive arrival (glow, label rise, emissive pulse).
  const api = useMemo(() => ({ glow: null, halo: null, labelG: null, labelMat: null, accentColor }), [accentColor])
  useEffect(() => { register(api) }, [register, api])

  return (
    <group>
      {/* pillars straddling the belt — brushed navy metal */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, pillarH / 2, s * halfW]} castShadow receiveShadow>
          <boxGeometry args={[0.32, pillarH, 0.32]} />
          <meshStandardMaterial color={EKTA.navy} roughness={0.38} metalness={0.55} />
        </mesh>
      ))}
      {/* thin brushed-steel collars for material richness */}
      {[-1, 1].map((s) => (
        <mesh key={`c${s}`} position={[0, 0.18, s * halfW]}>
          <boxGeometry args={[0.4, 0.12, 0.4]} />
          <meshStandardMaterial color={EKTA.navy2} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}

      {/* cross-beam — flat gate, or an arch */}
      {variant === 'arch' ? (
        <mesh position={[0, BEAM_TOP, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[halfW, 0.16, 16, 24, Math.PI]} />
          <meshStandardMaterial color={EKTA.navy2} roughness={0.4} metalness={0.5} />
        </mesh>
      ) : (
        <mesh position={[0, BEAM_TOP, 0]} castShadow>
          <boxGeometry args={[0.34, 0.34, halfW * 2 + 0.34]} />
          <meshStandardMaterial color={EKTA.navy2} roughness={0.4} metalness={0.5} />
        </mesh>
      )}

      {/* machine block on the far side (variant = machine) — matte with a screen */}
      {variant === 'machine' && (
        <group position={[0, 0.55, -halfW - 0.55]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.1, 0.7]} />
            <meshStandardMaterial color={EKTA.navy} roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.15, 0.36]}>
            <planeGeometry args={[0.9, 0.5]} />
            <meshStandardMaterial color={EKTA.navy2} emissive={accentColor} emissiveIntensity={0.35} roughness={0.3} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* emissive accent bar — this is what "lights up" as the book arrives */}
      <mesh position={[0, BEAM_TOP + 0.28, 0]}>
        <boxGeometry args={[0.12, 0.12, halfW * 2]} />
        <meshStandardMaterial
          ref={(m) => (api.glow = m)}
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0}
          toneMapped={false}
          roughness={0.4}
        />
      </mesh>
      {/* additive halo behind the bar — reads as bloom when lit */}
      <mesh ref={(m) => (api.halo = m)} position={[0, BEAM_TOP + 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, halfW * 2 + 1]} />
        <meshBasicMaterial map={glowTex} color={accentColor} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* floating label plate — rises + fades in on arrival (Scene drives it) */}
      <group ref={(g) => (api.labelG = g)} position={[0, LABEL_Y - 0.32, 0.2]}>
        <mesh>
          <planeGeometry args={[2.3, 1.0]} />
          <meshBasicMaterial ref={(m) => (api.labelMat = m)} map={labelTex} transparent opacity={0} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
