/**
 * Convert a depth tensor + original image canvas into Float32Arrays
 * suitable for a Three.js BufferGeometry point cloud.
 *
 * @param {Float32Array} depthData  - Raw depth values from the model tensor (H*W)
 * @param {number} depthWidth       - Width of the depth map
 * @param {number} depthHeight      - Height of the depth map
 * @param {HTMLCanvasElement} imgCanvas - Original image canvas to sample RGB from
 * @param {number} depthScale       - Z-axis exaggeration (user-controlled)
 * @param {string} colorMode        - 'original' | 'depth'
 * @returns {{ positions: Float32Array, colors: Float32Array, count: number }}
 */
export function depthToPointCloud(
  depthData,
  depthWidth,
  depthHeight,
  imgCanvas,
  depthScale = 1.5,
  colorMode = 'original'
) {
  // Sample every Nth pixel to keep point count manageable (~100k max)
  const targetPoints = 80000
  const totalPixels = depthWidth * depthHeight
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / targetPoints)))

  // Gather pixel colours from the original image
  let imgPixels = null
  if (colorMode === 'original' && imgCanvas) {
    const ctx = imgCanvas.getContext('2d')
    try {
      imgPixels = ctx.getImageData(0, 0, imgCanvas.width, imgCanvas.height).data
    } catch {
      // tainted canvas — fall back to depth colour
    }
  }

  // Find min/max depth for normalization
  let minD = Infinity, maxD = -Infinity
  for (let i = 0; i < depthData.length; i++) {
    if (depthData[i] < minD) minD = depthData[i]
    if (depthData[i] > maxD) maxD = depthData[i]
  }
  const range = maxD - minD || 1

  const sampledCount = Math.ceil(depthWidth / step) * Math.ceil(depthHeight / step)
  const positions = new Float32Array(sampledCount * 3)
  const colors = new Float32Array(sampledCount * 3)
  let idx = 0

  const imgW = imgCanvas ? imgCanvas.width : depthWidth
  const imgH = imgCanvas ? imgCanvas.height : depthHeight

  for (let dy = 0; dy < depthHeight; dy += step) {
    for (let dx = 0; dx < depthWidth; dx += step) {
      const depthIdx = dy * depthWidth + dx
      const raw = depthData[depthIdx]
      const norm = (raw - minD) / range  // 0..1, closer = higher value in many models

      // World-space X, Y centred at 0
      positions[idx * 3]     = (dx / depthWidth  - 0.5) * 2
      positions[idx * 3 + 1] = -(dy / depthHeight - 0.5) * 2
      positions[idx * 3 + 2] = norm * depthScale

      if (colorMode === 'original' && imgPixels) {
        // Map depth pixel coords to image pixel coords
        const ix = Math.floor((dx / depthWidth)  * imgW)
        const iy = Math.floor((dy / depthHeight) * imgH)
        const pIdx = (iy * imgW + ix) * 4
        colors[idx * 3]     = imgPixels[pIdx]     / 255
        colors[idx * 3 + 1] = imgPixels[pIdx + 1] / 255
        colors[idx * 3 + 2] = imgPixels[pIdx + 2] / 255
      } else {
        // Heat-map: blue (far) → green → red (near)
        const r = Math.max(0, (norm - 0.5) * 2)
        const g = 1 - Math.abs(norm - 0.5) * 2
        const b = Math.max(0, (0.5 - norm) * 2)
        colors[idx * 3]     = r
        colors[idx * 3 + 1] = g
        colors[idx * 3 + 2] = b
      }

      idx++
    }
  }

  return {
    positions: positions.slice(0, idx * 3),
    colors: colors.slice(0, idx * 3),
    count: idx,
  }
}
