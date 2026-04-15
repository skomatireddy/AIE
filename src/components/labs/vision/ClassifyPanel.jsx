import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { ImageDropzone } from '../../upload/ImageDropzone'
import { Button } from '../../ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { Textarea } from '../../ui/textarea'
import { useInference } from '../../../hooks/useInference'

const BOX_COLORS = [
  '#6366f1','#ec4899','#22c55e','#f59e0b','#14b8a6',
  '#8b5cf6','#f97316','#06b6d4','#ef4444','#a3e635',
]

function ConfidenceBar({ label, score, color = 'bg-indigo-500' }) {
  const pct = Math.round(score * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-300 w-44 truncate flex-shrink-0" title={label}>{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-400 w-10 text-right">{pct}%</span>
    </div>
  )
}

const COLORS = ['bg-indigo-500','bg-violet-500','bg-purple-500','bg-fuchsia-500','bg-pink-500']

function RegionOverlay({ labels, bboxes, imageData }) {
  if (!imageData || !labels?.length) return null
  const w = imageData.canvas.width
  const h = imageData.canvas.height
  return (
    <div className="relative w-full">
      <img src={imageData.canvas.toDataURL()} alt="" className="w-full rounded-lg" />
      {bboxes.map(([x1, y1, x2, y2], i) => {
        const color = BOX_COLORS[i % BOX_COLORS.length]
        return (
          <div
            key={i}
            className="absolute border-2 rounded"
            style={{
              left: `${(x1 / w) * 100}%`,
              top: `${(y1 / h) * 100}%`,
              width: `${((x2 - x1) / w) * 100}%`,
              height: `${((y2 - y1) / h) * 100}%`,
              borderColor: color,
            }}
          >
            <span
              className="absolute -top-5 left-0 text-xs px-1 py-0.5 rounded font-medium whitespace-nowrap"
              style={{ backgroundColor: color, color: '#fff' }}
            >
              {labels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function ClassifyPanel() {
  const [device, setDevice] = useState('wasm')
  const [imageData, setImageData] = useState(null)
  const [tab, setTab] = useState('standard')
  const [customLabels, setCustomLabels] = useState('cat, dog, car, building, food, nature, person')

  const { run, status, progress, result, error } = useInference('classify')

  const handleRun = useCallback(async () => {
    if (!imageData) return
    const dataUrl = imageData.canvas.toDataURL('image/jpeg', 0.9)
    try {
      if (tab === 'zero-shot') {
        const labels = customLabels.split(',').map(l => l.trim()).filter(Boolean)
        await run({ image: dataUrl, device, mode: 'zero-shot', labels })
      } else {
        await run({ image: dataUrl, device, mode: 'standard' })
      }
    } catch {
      // error is already handled by useAIWorker
    }
  }, [imageData, device, tab, customLabels, run])

  return (
    <LabCard
      title="Image Classification"
      description="Classify images with Swin Transformer (ImageNet-22k) or score against custom labels"
      icon="🏷️"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="standard" activeValue={tab} onValueChange={setTab}>Swin + Top Labels</TabsTrigger>
            <TabsTrigger value="zero-shot" activeValue={tab} onValueChange={setTab}>Zero-Shot (Custom Labels)</TabsTrigger>
          </TabsList>

          <TabsContent value="zero-shot" activeValue={tab}>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Your labels (comma-separated)</label>
              <Textarea
                value={customLabels}
                onChange={(e) => setCustomLabels(e.target.value)}
                rows={2}
                placeholder="cat, dog, car…"
              />
            </div>
          </TabsContent>
        </Tabs>

        <ImageDropzone onImageLoad={setImageData} />

        <Button
          onClick={handleRun}
          disabled={!imageData || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Analysing…' : '▶ Classify'}
        </Button>

        {result?.mode === 'caption' && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Top Predictions</p>
              <p className="text-zinc-100 text-sm leading-relaxed">{result.caption || 'Nothing detected above threshold'}</p>
            </div>
            {result.tags?.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Detected Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: BOX_COLORS[i % BOX_COLORS.length] + '33',
                        color: BOX_COLORS[i % BOX_COLORS.length],
                        border: `1px solid ${BOX_COLORS[i % BOX_COLORS.length]}66`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result?.mode === 'zero-shot' && result.data?.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Results</h4>
            {result.data.slice(0, 8).map((p, i) => (
              <ConfidenceBar
                key={p.label}
                label={p.label}
                score={p.score}
                color={COLORS[i % COLORS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </LabCard>
  )
}
