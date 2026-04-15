import { useEffect, useRef } from 'react'

export default function DepthMap({ depthData, depthWidth, depthHeight, originalImage }) {
  const depthCanvasRef = useRef(null)

  useEffect(() => {
    if (!depthData || !depthWidth || !depthHeight) return
    const canvas = depthCanvasRef.current
    if (!canvas) return
    canvas.width = depthWidth
    canvas.height = depthHeight
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(depthWidth, depthHeight)

    const float32 = new Float32Array(depthData)
    let min = Infinity, max = -Infinity
    for (let i = 0; i < float32.length; i++) {
      if (float32[i] < min) min = float32[i]
      if (float32[i] > max) max = float32[i]
    }
    const range = max - min || 1

    for (let i = 0; i < float32.length; i++) {
      const norm = (float32[i] - min) / range
      // Viridis-like heat map
      const r = Math.floor(Math.max(0, (norm - 0.5) * 2) * 255)
      const g = Math.floor((1 - Math.abs(norm - 0.5) * 2) * 200)
      const b = Math.floor(Math.max(0, (0.5 - norm) * 2) * 255)
      imageData.data[i * 4]     = r
      imageData.data[i * 4 + 1] = g
      imageData.data[i * 4 + 2] = b
      imageData.data[i * 4 + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
  }, [depthData, depthWidth, depthHeight])

  return (
    <div className="flex flex-col gap-4 mt-3">
      <div className="grid grid-cols-2 gap-3">
        {originalImage && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400 font-medium">Original</span>
            <img
              src={originalImage.src}
              alt="Original"
              className="w-full rounded-lg object-contain bg-zinc-800 max-h-60"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400 font-medium">Depth Map</span>
          <canvas
            ref={depthCanvasRef}
            className="w-full rounded-lg object-contain bg-zinc-800 max-h-60"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="w-12 h-2 rounded bg-gradient-to-r from-blue-500 via-green-400 to-red-500 inline-block" />
        <span>Far → Near</span>
      </div>
    </div>
  )
}
