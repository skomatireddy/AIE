import { useState, useRef, useCallback, useEffect } from 'react'
import { LabCard } from '../../shared/LabCard'
import { ImageDropzone } from '../../upload/ImageDropzone'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Slider } from '../../ui/slider'
import { useInference } from '../../../hooks/useInference'

const COLORS = [
  '#6366f1','#ec4899','#22c55e','#f59e0b','#14b8a6','#8b5cf6','#f97316','#06b6d4'
]

function Detection({ box, label, score, color, imgW, imgH }) {
  const pct = (v, dim) => `${(v / dim * 100).toFixed(2)}%`
  return (
    <div
      className="absolute border-2 rounded"
      style={{
        left: pct(box.xmin, imgW),
        top: pct(box.ymin, imgH),
        width: pct(box.xmax - box.xmin, imgW),
        height: pct(box.ymax - box.ymin, imgH),
        borderColor: color,
      }}
    >
      <span
        className="absolute -top-5 left-0 text-xs px-1 py-0.5 rounded font-medium whitespace-nowrap"
        style={{ backgroundColor: color, color: '#fff' }}
      >
        {label}
      </span>
    </div>
  )
}

export default function DetectPanel() {
  const [device, setDevice] = useState('wasm')
  const [imageData, setImageData] = useState(null)
  const [threshold, setThreshold] = useState(0.5)

  const { run, status, progress, result, error } = useInference('detect')

  const handleRun = useCallback(async () => {
    if (!imageData) return
    const dataUrl = imageData.canvas.toDataURL('image/jpeg', 0.9)
    try {
      await run({ image: dataUrl, device, threshold })
    } catch {
      // error is already handled by useAIWorker
    }
  }, [imageData, device, threshold, run])

  const detections = result && Array.isArray(result) ? result : []
  const uniqueLabels = [...new Set(detections.map(d => d.label))]

  return (
    <LabCard
      title="Object Detection"
      description="Detect and locate objects using Florence-2 with bounding boxes"
      icon="🔍"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <ImageDropzone onImageLoad={setImageData} />

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Confidence threshold</span>
            <span>{Math.round(threshold * 100)}%</span>
          </div>
          <Slider
            min={0.1}
            max={0.95}
            step={0.05}
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v)}
          />
        </div>

        <Button
          onClick={handleRun}
          disabled={!imageData || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Detecting…' : '▶ Detect Objects'}
        </Button>

        {imageData && detections.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="relative inline-block w-full">
              <img
                src={imageData.canvas.toDataURL()}
                alt="Detection result"
                className="w-full rounded-lg"
              />
              {detections.map((d, i) => (
                <Detection
                  key={i}
                  box={d.box}
                  label={d.label}
                  score={d.score}
                  color={COLORS[uniqueLabels.indexOf(d.label) % COLORS.length]}
                  imgW={imageData.canvas.width}
                  imgH={imageData.canvas.height}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {uniqueLabels.map((l, i) => (
                <Badge
                  key={l}
                  style={{ borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}
                  variant="outline"
                >
                  {l} ({detections.filter(d => d.label === l).length})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {result && detections.length === 0 && status === 'done' && (
          <p className="text-sm text-zinc-500 text-center py-4">
            No objects detected.
          </p>
        )}
      </div>
    </LabCard>
  )
}
