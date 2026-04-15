import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { normalizeDepth, sampleImageAtDepthCoords } from './utils.js'

export class PointCloudRenderer {
  constructor(container) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x09090b)

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.001, 100)
    this.camera.position.set(0, 0, 2.5)

    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08

    this._cloud = null
    this._animId = null

    this._ro = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    })
    this._ro.observe(container)

    const animate = () => {
      this._animId = requestAnimationFrame(animate)
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    }
    animate()
  }

  /**
   * @param {number[]} depthData - raw depth values
   * @param {number} depthWidth
   * @param {number} depthHeight
   * @param {HTMLCanvasElement} imageCanvas - original image for RGB sampling
   * @param {{ depthScale?: number, pointSize?: number, subsample?: number }} options
   */
  build(depthData, depthWidth, depthHeight, imageCanvas, options = {}) {
    const { depthScale = 1.2, pointSize = 0.004, subsample = 1 } = options

    if (this._cloud) {
      this.scene.remove(this._cloud)
      this._cloud.geometry.dispose()
      this._cloud.material.dispose()
      this._cloud = null
    }

    const depthNorm = normalizeDepth(depthData)
    const sample = sampleImageAtDepthCoords(imageCanvas, depthWidth, depthHeight)

    const cols = Math.ceil(depthWidth / subsample)
    const rows = Math.ceil(depthHeight / subsample)
    const positions = new Float32Array(cols * rows * 3)
    const colors = new Float32Array(cols * rows * 3)
    let idx = 0

    for (let dy = 0; dy < depthHeight; dy += subsample) {
      for (let dx = 0; dx < depthWidth; dx += subsample) {
        const d = depthNorm[dy * depthWidth + dx]
        positions[idx * 3]     = (dx / depthWidth - 0.5) * 2
        positions[idx * 3 + 1] = -(dy / depthHeight - 0.5) * 2
        positions[idx * 3 + 2] = d * depthScale - depthScale / 2
        const [r, g, b] = sample(dx, dy)
        colors[idx * 3]     = r
        colors[idx * 3 + 1] = g
        colors[idx * 3 + 2] = b
        idx++
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, idx * 3), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, idx * 3), 3))

    const mat = new THREE.PointsMaterial({ size: pointSize, vertexColors: true, sizeAttenuation: true })
    this._cloud = new THREE.Points(geo, mat)
    this.scene.add(this._cloud)
    this.controls.reset()

    return idx
  }

  dispose() {
    cancelAnimationFrame(this._animId)
    this._ro.disconnect()
    this.controls.dispose()
    if (this._cloud) {
      this._cloud.geometry.dispose()
      this._cloud.material.dispose()
    }
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
