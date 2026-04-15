import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { normalizeDepth, sampleImageAtDepthCoords } from './utils.js'

export class DepthMeshRenderer {
  constructor(container) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x09090b)

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.001, 100)
    this.camera.position.set(0, 0, 2.5)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08

    this._mesh = null
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
   * @param {HTMLCanvasElement} imageCanvas
   * @param {{ depthScale?: number, segments?: number }} options
   */
  build(depthData, depthWidth, depthHeight, imageCanvas, options = {}) {
    const { depthScale = 1.2, segments = 200 } = options

    if (this._mesh) {
      this.scene.remove(this._mesh)
      this._mesh.geometry.dispose()
      this._mesh.material.dispose()
      this._mesh = null
    }

    const depthNorm = normalizeDepth(depthData)
    const sample = sampleImageAtDepthCoords(imageCanvas, depthWidth, depthHeight)

    // PlaneGeometry vertices go left→right, top→bottom after rotation
    const geo = new THREE.PlaneGeometry(2, 2, segments, segments)
    const pos = geo.attributes.position
    const vertexCount = pos.count

    const colorAttr = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3)
    geo.setAttribute('color', colorAttr)

    for (let i = 0; i < vertexCount; i++) {
      // PlaneGeometry: x in [-1,1], y in [-1,1], z=0 initially
      const vx = pos.getX(i)  // -1..1
      const vy = pos.getY(i)  // -1..1

      // Map to depth map coords
      const dx = Math.min(Math.floor((vx * 0.5 + 0.5) * depthWidth), depthWidth - 1)
      const dy = Math.min(Math.floor((0.5 - vy * 0.5) * depthHeight), depthHeight - 1)
      const d = depthNorm[dy * depthWidth + dx]

      // Displace z
      pos.setZ(i, d * depthScale - depthScale / 2)

      // Sample color
      const [r, g, b] = sample(dx, dy)
      colorAttr.setXYZ(i, r, g, b)
    }

    pos.needsUpdate = true
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0,
    })

    // Add a soft ambient + directional light
    if (!this._lightsAdded) {
      this.scene.add(new THREE.AmbientLight(0xffffff, 1.2))
      const dir = new THREE.DirectionalLight(0xffffff, 0.8)
      dir.position.set(1, 2, 3)
      this.scene.add(dir)
      this._lightsAdded = true
    }

    this._mesh = new THREE.Mesh(geo, mat)
    this.scene.add(this._mesh)
    this.controls.reset()
  }

  dispose() {
    cancelAnimationFrame(this._animId)
    this._ro.disconnect()
    this.controls.dispose()
    if (this._mesh) {
      this._mesh.geometry.dispose()
      this._mesh.material.dispose()
    }
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
