import { useMemo } from 'react'
import * as THREE from 'three'

// ── Soft dust motes (R8-D) ────────────────────────────────────────────────────
// Replaces drei <Sparkles>. The old motes were hard 1–2px points that strobed
// (bright↔dark) as they crossed pixel boundaries during camera motion. These are
// SOFT: a radial-falloff sprite so sub-pixel movement blends instead of popping,
// and screen-space sized (sizeAttenuation off) so nothing ever renders below a few
// pixels. Static geometry (no per-frame update) → they drift by camera parallax
// while scrolling and are perfectly still at rest (never regress the idle freeze).
function dustTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.35, 'rgba(255,255,255,0.5)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true
  return t
}

export default function Dust({ count = 14, scale = [1.4, 1.8, 1.2], position = [0, 0, 0], size = 5, color = '#F0D49A', opacity = 0.5 }) {
  const tex = useMemo(dustTexture, [])
  const geom = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * scale[0]
      pos[i * 3 + 1] = (Math.random() - 0.5) * scale[1]
      pos[i * 3 + 2] = (Math.random() - 0.5) * scale[2]
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <points position={position} geometry={geom}>
      <pointsMaterial
        map={tex}
        size={size}
        sizeAttenuation={false} // screen-space px → never sub-pixel, never strobes
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
