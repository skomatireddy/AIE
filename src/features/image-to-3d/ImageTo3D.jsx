import { useState, useRef, useEffect, useCallback } from 'react'
import { LabCard } from '../../components/shared/LabCard'
import { ImageDropzone } from '../../components/upload/ImageDropzone'
import { Button } from '../../components/ui/button'
import { Slider } from '../../components/ui/slider'
import { useAIWorker } from '../../hooks/useAIWorker'
import { PointCloudRenderer } from './pointCloudRenderer'
import { DepthMeshRenderer } from './depthMeshRenderer'

export default function ImageTo3D() {
  const [device, setDevice] = useState('wasm')
  const [imageData, setImageData] = useState(null)
  const [viewMode, setViewMode] = useState('pointcloud') // 'pointcloud' | 'mesh'
  const [depthScale, setDepthScale] = useState(1.2)
  const [pointSize, setPointSize] = useState(0.004)
  const [pointCount, setPointCount] = useState(0)

  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const lastResultRef = useRef(null)

  const { run, status, progress, result, error } = useAIWorker(
    () => new Worker(new URL('../../workers/depth.worker.js', import.meta.url), { type: 'module' }),
    'img3d'
  )

  // Build / rebuild scene whenever result, viewMode, depthScale, or pointSize changes
  const buildScene = useCallback((depthResult, imgData) => {
    if (!depthResult || !imgData || !containerRef.current) return

    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }

    const { depthData, width, height } = depthResult

    if (viewMode === 'mesh') {
      const r = new DepthMeshRenderer(containerRef.current)
      r.build(depthData, width, height, imgData.canvas, { depthScale })
      rendererRef.current = r
      setPointCount(0)
    } else {
      const r = new PointCloudRenderer(containerRef.current)
      const count = r.build(depthData, width, height, imgData.canvas, { depthScale, pointSize })
      rendererRef.current = r
      setPointCount(count)
    }
  }, [viewMode, depthScale, pointSize])

  // When new depth result arrives, cache it and build
  useEffect(() => {
    if (!result) return
    lastResultRef.current = result
    buildScene(result, imageData)
  }, [result])

  // Rebuild when view options change (use cached result)
  useEffect(() => {
    if (lastResultRef.current && imageData) {
      buildScene(lastResultRef.current, imageData)
    }
  }, [viewMode, depthScale, pointSize])

  // Dispose on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) rendererRef.current.dispose()
    }
  }, [])

  // Reset scene when image changes
  const handleImageLoad = useCallback((data) => {
    setImageData(data)
    lastResultRef.current = null
    setPointCount(0)
    if (rendererRef.current) {
      rendererRef.current.dispose()
      rendererRef.current = null
    }
  }, [])

  const handleRun = useCallback(async () => {
    if (!imageData) return
    const dataUrl = imageData.canvas.toDataURL('image/jpeg', 0.9)
    try {
      await run({ image: dataUrl, device })
    } catch {
      // handled by useAIWorker
    }
  }, [imageData, device, run])

  const isWorking = status === 'loading' || status === 'running'
  const hasResult = !!lastResultRef.current

  return (
    <LabCard
      title="2D → 3D Viewer"
      description="Convert any photo into an interactive 3D scene using Depth Anything V2"
      icon="🌐"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        {/* View mode toggle */}
        <div className="flex gap-2">
          {['pointcloud', 'mesh'].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                viewMode === m
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {m === 'pointcloud' ? '✦ Point Cloud' : '▦ Mesh'}
            </button>
          ))}
        </div>

        <ImageDropzone onImageLoad={handleImageLoad} />

        {/* Controls (show when result exists) */}
        {hasResult && (
          <div className="grid grid-cols-2 gap-3">
            <Slider
              label="Depth Scale"
              value={depthScale}
              min={0.3}
              max={3}
              step={0.1}
              onChange={setDepthScale}
            />
            {viewMode === 'pointcloud' && (
              <Slider
                label="Point Size"
                value={pointSize}
                min={0.001}
                max={0.015}
                step={0.001}
                onChange={setPointSize}
              />
            )}
          </div>
        )}

        <Button
          onClick={handleRun}
          disabled={!imageData || isWorking}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…'
           : status === 'running' ? 'Estimating depth…'
           : hasResult ? '↺ Re-run'
           : '▶ Convert to 3D'}
        </Button>

        {/* Three.js container — always mounted so containerRef is available on first result */}
        <div className="flex flex-col gap-1" style={{ display: hasResult ? undefined : 'none' }}>
          <div
            ref={containerRef}
            className="w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800"
            style={{ height: '460px' }}
          />
          <p className="text-xs text-zinc-600 text-center py-1">
            {viewMode === 'pointcloud' && pointCount > 0
              ? `${pointCount.toLocaleString()} points — `
              : ''}
            Drag to orbit · Scroll to zoom · Right-drag to pan
          </p>
        </div>
      </div>
    </LabCard>
  )
}
