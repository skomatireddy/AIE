import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function PointCloud({ positions, colors, count, pointSize = 0.005 }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current || !positions || count === 0) return

    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight || 400

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#09090b')

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.001, 100)
    camera.position.set(0, 0, 2.5)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    // Points
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = mount.clientWidth
      const h = mount.clientHeight || 400
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(mount)

    // Animation loop
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
      controls.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [positions, colors, count, pointSize])

  return (
    <div className="flex flex-col gap-1 mt-3">
      <div
        ref={mountRef}
        className="w-full rounded-xl overflow-hidden bg-zinc-950"
        style={{ height: '420px' }}
      />
      <p className="text-xs text-zinc-600 text-center py-1">
        {count.toLocaleString()} points — drag to rotate, scroll to zoom
      </p>
    </div>
  )
}
