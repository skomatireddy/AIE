import { useState, useRef, useEffect, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { ImageDropzone } from '../../upload/ImageDropzone'
import { Button } from '../../ui/button'
import { Slider } from '../../ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { useInference } from '../../../hooks/useInference'
import { depthToPointCloud } from '../../../lib/depthToPointCloud'
import DepthMap from './DepthMap'
import PointCloud from './PointCloud'

export default function DepthPanel() {
  const [device, setDevice] = useState('wasm')
  const [imageData, setImageData] = useState(null)
  const [depthResult, setDepthResult] = useState(null)
  const [depthScale, setDepthScale] = useState(1.5)
  const [pointSize, setPointSize] = useState(0.005)
  const [colorMode, setColorMode] = useState('original')
  const [activeTab, setActiveTab] = useState('depth')
  const [pointCloud, setPointCloud] = useState(null)

  const { run, status, progress, error } = useInference('depth')

  const handleRun = useCallback(async () => {
    if (!imageData) return
    const canvas = imageData.canvas
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    try {
      const result = await run({ image: dataUrl, device })
      setDepthResult(result)
    } catch (err) {
      // error is already handled by useAIWorker
      console.error(err)
    }
  }, [imageData, device, run])

  // Rebuild point cloud whenever depth or controls change
  useEffect(() => {
    if (!depthResult || !imageData) return
    const { depthData, width, height } = depthResult
    const float32 = new Float32Array(depthData)
    const pc = depthToPointCloud(float32, width, height, imageData.canvas, depthScale, colorMode)
    setPointCloud(pc)
  }, [depthResult, depthScale, colorMode, imageData])

  return (
    <LabCard
      title="2D → 3D Depth"
      description="Upload an image to estimate depth and explore it as a 3D point cloud"
      icon="🌐"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-5">
        <ImageDropzone onImageLoad={setImageData} />

        <Button
          onClick={handleRun}
          disabled={!imageData || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Processing…' : '▶ Run Depth Estimation'}
        </Button>

        {depthResult && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Slider
                label="Depth Scale"
                value={depthScale}
                min={0.5}
                max={5}
                step={0.1}
                onChange={setDepthScale}
              />
              <Slider
                label="Point Size"
                value={pointSize}
                min={0.001}
                max={0.02}
                step={0.001}
                onChange={setPointSize}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">Colour Mode</span>
                <div className="flex gap-1">
                  {['original', 'depth'].map(m => (
                    <Button
                      key={m}
                      size="sm"
                      variant={colorMode === m ? 'default' : 'outline'}
                      onClick={() => setColorMode(m)}
                      className="capitalize text-xs"
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {['depth', '3d'].map(t => (
                  <TabsTrigger key={t} value={t} activeValue={activeTab} onValueChange={setActiveTab}>
                    {t === 'depth' ? '🗺 Depth Map' : '🌐 3D Point Cloud'}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="depth" activeValue={activeTab}>
                <DepthMap
                  depthData={depthResult.depthData}
                  depthWidth={depthResult.width}
                  depthHeight={depthResult.height}
                  originalImage={imageData?.img}
                />
              </TabsContent>
              <TabsContent value="3d" activeValue={activeTab}>
                {pointCloud && (
                  <PointCloud
                    positions={pointCloud.positions}
                    colors={pointCloud.colors}
                    count={pointCloud.count}
                    pointSize={pointSize}
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </LabCard>
  )
}
