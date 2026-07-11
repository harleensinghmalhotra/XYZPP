import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'
import { smooth } from './constants'

const GIRL_H = 1.72 // world height (feet at 0)
const PICKUP_URL = '/qfp/conveyor/girl-pickup.png'
const JUMP_URL = '/qfp/conveyor/girl-jump.png'

// Placeholder sprite (used only until Harry's real PNGs load) — a simple flat
// Pixar-ish girl in Ekta palette so positioning/shadow/catch/jump are verifiable.
function placeholder(pose) {
  const W = 300, H = 512
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.clearRect(0, 0, W, H)
  const cx = W / 2
  const up = pose === 'jump'
  // legs
  g.strokeStyle = '#3A2E22'; g.lineWidth = 22; g.lineCap = 'round'
  const legY = up ? 396 : 470
  g.beginPath(); g.moveTo(cx - 26, 330); g.lineTo(cx - 34, legY); g.moveTo(cx + 26, 330); g.lineTo(cx + 34, legY); g.stroke()
  // shoes
  g.fillStyle = '#B23A2E'
  g.beginPath(); g.ellipse(cx - 36, legY, 22, 12, 0, 0, 7); g.ellipse(cx + 36, legY, 22, 12, 0, 0, 7); g.fill()
  // dress (teal)
  g.fillStyle = '#2E6E6A'
  g.beginPath(); g.moveTo(cx - 42, 190); g.lineTo(cx + 42, 190); g.lineTo(cx + 70, 350); g.lineTo(cx - 70, 350); g.closePath(); g.fill()
  // arms
  g.strokeStyle = '#E7C6A0'; g.lineWidth = 20
  if (up) {
    g.beginPath(); g.moveTo(cx - 40, 210); g.lineTo(cx - 74, 120); g.moveTo(cx + 40, 210); g.lineTo(cx + 74, 120); g.stroke()
    g.fillStyle = '#E7C6A0'; g.beginPath(); g.arc(cx - 78, 112, 14, 0, 7); g.arc(cx + 78, 112, 14, 0, 7); g.fill()
  } else {
    g.beginPath(); g.moveTo(cx - 40, 210); g.lineTo(cx - 64, 300); g.moveTo(cx + 40, 210); g.lineTo(cx + 64, 300); g.stroke()
    g.fillStyle = '#E7C6A0'; g.beginPath(); g.arc(cx - 66, 306, 14, 0, 7); g.arc(cx + 66, 306, 14, 0, 7); g.fill()
  }
  // head
  g.fillStyle = '#E7C6A0'; g.beginPath(); g.arc(cx, 150, 46, 0, 7); g.fill()
  // hair
  g.fillStyle = '#2B2119'; g.beginPath(); g.arc(cx, 138, 50, Math.PI, 0); g.fill()
  g.fillRect(cx - 50, 138, 14, 60); g.fillRect(cx + 36, 138, 14, 60)
  // face
  g.fillStyle = '#241f1a'; g.beginPath(); g.arc(cx - 15, 150, 5, 0, 7); g.arc(cx + 15, 150, 5, 0, 7); g.fill()
  g.strokeStyle = '#8a4a3a'; g.lineWidth = 4; g.beginPath(); g.arc(cx, 162, 12, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke()
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t
}

// soft contact-shadow blob
function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  grd.addColorStop(0, 'rgba(0,0,0,0.5)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

const Girl = forwardRef(function Girl({ floorY = -0.42 }, ref) {
  const outer = useRef()
  const lift = useRef()
  const plane = useRef()
  const mat = useRef()
  const shadowMat = useRef()
  const shadow = useRef()

  // start on placeholders; swap in Harry's real PNGs if/when they load
  const pickupTex = useMemo(() => placeholder('pickup'), [])
  const jumpTex = useMemo(() => placeholder('jump'), [])
  const shadowTex = useMemo(shadowTexture, [])
  const aspect = useRef(300 / 512)
  const state = useRef('pickup')

  useEffect(() => {
    const swap = (url, tex, isPickup) => {
      const img = new Image()
      img.onload = () => {
        tex.image = img; tex.needsUpdate = true
        if (isPickup) { aspect.current = img.width / img.height; if (plane.current) plane.current.scale.x = GIRL_H * aspect.current }
      }
      img.src = url
    }
    swap(PICKUP_URL, pickupTex, true)
    swap(JUMP_URL, jumpTex, false)
  }, [pickupTex, jumpTex])

  useImperativeHandle(ref, () => ({
    get root() { return outer.current },
    // handoff: 0 = waiting (pickup), →1 = box caught, jump + settle to bounce loop
    apply(handoff, time) {
      const caught = handoff >= 0.5
      const want = caught ? 'jump' : 'pickup'
      if (state.current !== want && mat.current) {
        state.current = want
        mat.current.map = caught ? jumpTex : pickupTex
        mat.current.needsUpdate = true
      }
      const hop = Math.sin(smooth(0.5, 0.84, handoff) * Math.PI) * 0.42 // up-arc on catch
      const settled = smooth(0.8, 1, handoff)
      const idle = Math.sin(time * 1.6) * 0.01 * (1 - handoff) // tiny wait sway
      const bounce = Math.sin(time * 3) * 0.05 * settled
      if (lift.current) lift.current.position.y = hop + bounce + idle
      if (shadow.current && shadowMat.current) {
        const air = hop / 0.42
        shadow.current.scale.setScalar(1 - air * 0.35)
        shadowMat.current.opacity = 0.42 - air * 0.2
      }
    },
  }))

  return (
    <group ref={outer}>
      <mesh ref={shadow} position={[0, floorY + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial ref={shadowMat} map={shadowTex} transparent opacity={0.42} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={lift}>
        <Billboard lockX lockZ position={[0, GIRL_H / 2, 0]}>
          <mesh ref={plane} scale={[GIRL_H * (300 / 512), GIRL_H, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial ref={mat} map={pickupTex} transparent alphaTest={0.04} toneMapped={false} />
          </mesh>
        </Billboard>
      </group>
    </group>
  )
})

export default Girl
