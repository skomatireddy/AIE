/**
 * Normalize a raw depth Float32Array to [0, 1]
 */
export function normalizeDepth(depthData) {
  const arr = new Float32Array(depthData)
  let min = Infinity, max = -Infinity
  for (const v of arr) {
    if (v < min) min = v
    if (v > max) max = v
  }
  const range = max - min || 1
  const out = new Float32Array(arr.length)
  for (let i = 0; i < arr.length; i++) out[i] = (arr[i] - min) / range
  return out
}

/**
 * Sample RGBA pixels from a canvas, mapping depth coords → image coords
 * depthWidth/depthHeight may differ from canvas.width/canvas.height
 */
export function sampleImageAtDepthCoords(canvas, depthWidth, depthHeight) {
  const ctx = canvas.getContext('2d')
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = imgData.data
  const iw = canvas.width
  const ih = canvas.height

  // Returns a function: (dx, dy) => [r, g, b] normalized 0..1
  return (dx, dy) => {
    const ix = Math.min(Math.floor((dx / depthWidth) * iw), iw - 1)
    const iy = Math.min(Math.floor((dy / depthHeight) * ih), ih - 1)
    const i = (iy * iw + ix) * 4
    return [px[i] / 255, px[i + 1] / 255, px[i + 2] / 255]
  }
}
