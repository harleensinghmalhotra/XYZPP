import { useCallback, useEffect, useRef, useState } from 'react'

// Canvas image-sequence player. Preloads priority frames first (opening frames
// + settled tail), streams the rest, and draws a chosen frame to a <canvas>
// with object-fit: cover. Returns { canvasRef, ready, draw }.
//
// Avoids video.currentTime scrubbing (which stutters on codec keyframes) —
// every frame is an independent decoded image, so any index draws instantly.
export function useImageSequence(urls) {
  const canvasRef = useRef(null)
  const imgs = useRef([])
  const loaded = useRef([])
  const drawnIndex = useRef(-1)
  const [ready, setReady] = useState(false)

  // draw(index): cover-fit the frame into the canvas backing store
  const draw = useCallback((indexFloat) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const n = urls.length
    let idx = Math.round(indexFloat)
    idx = Math.max(0, Math.min(n - 1, idx))
    // snap to nearest already-loaded frame so we never blank out mid-stream
    if (!loaded.current[idx]) {
      let lo = idx, hi = idx
      while (lo >= 0 || hi < n) {
        if (lo >= 0 && loaded.current[lo]) { idx = lo; break }
        if (hi < n && loaded.current[hi]) { idx = hi; break }
        lo--; hi++
      }
    }
    if (!loaded.current[idx] || idx === drawnIndex.current) return
    const img = imgs.current[idx]
    const ctx = canvas.getContext('2d')
    const cw = canvas.width, ch = canvas.height
    const ir = img.width / img.height, cr = cw / ch
    let dw, dh, dx, dy
    if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0 }
    else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2 }
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
    drawnIndex.current = idx
  }, [urls])

  useEffect(() => {
    const n = urls.length
    imgs.current = new Array(n)
    loaded.current = new Array(n).fill(false)
    let alive = true
    let firstReady = false

    const load = (i) =>
      new Promise((res) => {
        if (i < 0 || i >= n || imgs.current[i]) return res()
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          if (!alive) return
          imgs.current[i] = img
          loaded.current[i] = true
          if (!firstReady) { firstReady = true; setReady(true); draw(0) }
          res()
        }
        img.onerror = () => res()
        img.src = urls[i]
      })

    ;(async () => {
      // priority: first 20 opening frames, then last 10 settled frames…
      const priority = [
        ...Array.from({ length: Math.min(20, n) }, (_, k) => k),
        ...Array.from({ length: Math.min(10, n) }, (_, k) => n - 1 - k),
      ]
      for (const i of priority) { if (!alive) return; await load(i) }
      // …then everything else, in order, in the background
      for (let i = 0; i < n; i++) { if (!alive) return; await load(i) }
    })()

    return () => { alive = false }
  }, [urls])

  return { canvasRef, ready, draw }
}
