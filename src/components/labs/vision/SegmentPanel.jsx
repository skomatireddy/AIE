import { useState, useCallback, useRef, useEffect } from 'react'
import { LabCard } from '../../shared/LabCard'
import { ImageDropzone } from '../../upload/ImageDropzone'
import { Button } from '../../ui/button'
import { Slider } from '../../ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { useInference } from '../../../hooks/useInference'

const SEG_COLORS = [
  [99,102,241],[236,72,153],[34,197,94],[245,158,11],[20,184,166],
  [139,92,246],[249,115,22],[6,182,212],[168,85,247],[239,68,68],
]

function SegOverlay({ segments, imageData, opacity }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!segments || !imageData || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = imageData.canvas.width
    canvas.height = imageData.canvas.height
    const ctx = canvas.getContext('2d')
    // Draw original image
    ctx.drawImage(imageData.canvas, 0, 0)
    // Overlay each mask
    segments.forEach((seg, i) => {
      if (!seg.mask) return
      const color = SEG_COLORS[i % SEG_COLORS.length]
      const maskData = seg.mask.data
      const w = seg.mask.width
      const h = seg.mask.height
      const imgd = ctx.createImageData(w, h)
      for (let j = 0; j < maskData.length; j++) {
        if (maskData[j] > 0.5) {
          imgd.data[j * 4]     = color[0]
          imgd.data[j * 4 + 1] = color[1]
          imgd.data[j * 4 + 2] = color[2]
          imgd.data[j * 4 + 3] = Math.round(opacity * 255)
        }
      }
      ctx.putImageData(imgd, 0, 0)
    })
  }, [segments, imageData, opacity])

  return <canvas ref={canvasRef} className="w-full rounded-lg" />
}

export default function SegmentPanel() {
  const [device, setDevice] = useState('wasm')
  const [imageData, setImageData] = useState(null)
  const [tab, setTab] = useState('segment')
  const [opacity, setOpacity] = useState(0.6)

  const { run, status, progress, result, error } = useInference('segment')

  const handleRun = useCallback(async () => {
    if (!imageData) return
    const dataUrl = imageData.canvas.toDataURL('image/jpeg', 0.9)
    try {
      await run({ image: dataUrl, device, mode: tab === 'bg-remove' ? 'background-removal' : 'segment' })
    } catch {
      // error is already handled by useAIWorker
    }
  }, [imageData, device, tab, run])

  const segments = result && Array.isArray(result) ? result : []

  return (
    <LabCard
      title="Image Segmentation + BG Removal"
      description="Segment objects semantically or remove image backgrounds"
      icon="✂️"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="segment" activeValue={tab} onValueChange={setTab}>Segmentation</TabsTrigger>
            <TabsTrigger value="bg-remove" activeValue={tab} onValueChange={setTab}>Background Removal</TabsTrigger>
          </TabsList>
        </Tabs>

        <Slider
          label="Mask Opacity"
          value={opacity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={setOpacity}
        />

        <ImageDropzone onImageLoad={setImageData} />

        <Button
          onClick={handleRun}
          disabled={!imageData || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Processing…'
            : tab === 'bg-remove' ? '▶ Remove Background' : '▶ Segment'}
        </Button>

        {imageData && segments.length > 0 && (
          <div className="flex flex-col gap-3">
            <SegOverlay segments={segments} imageData={imageData} opacity={opacity} />
            <div className="flex flex-wrap gap-1">
              {segments.map((seg, i) => (
                <Badge
                  key={i}
                  style={{
                    backgroundColor: `rgba(${SEG_COLORS[i % SEG_COLORS.length].join(',')},0.2)`,
                    color: `rgb(${SEG_COLORS[i % SEG_COLORS.length].join(',')})`,
                    border: `1px solid rgba(${SEG_COLORS[i % SEG_COLORS.length].join(',')},0.4)`
                  }}
                >
                  {seg.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </LabCard>
  )
}
