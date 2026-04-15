import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { ImageDropzone } from '../../upload/ImageDropzone'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { useInference } from '../../../hooks/useInference'

const MODES = [
  { id: 'florence', label: 'Florence-2', description: 'Detailed captions + object tags' },
  { id: 'vit-gpt2', label: 'ViT-GPT2',  description: 'Fast, lightweight captions' },
  { id: 'gemma4',   label: 'Gemma 4',   description: 'Rich descriptions (WebGPU)' },
]

export default function CaptionPanel() {
  const [device, setDevice] = useState('wasm')
  const [imageData, setImageData] = useState(null)
  const [captionMode, setCaptionMode] = useState('florence')

  // Always call both hooks; use the right one based on captionMode
  const captionInference = useInference('caption')
  const gemma4Inference  = useInference('gemma4')

  const { run, status, progress, result, error } =
    captionMode === 'gemma4' ? gemma4Inference : captionInference

  // Gemma 4 works best on webgpu; switch automatically when mode changes
  const effectiveDevice = captionMode === 'gemma4' ? 'webgpu' : device

  const handleRun = useCallback(async () => {
    if (!imageData) return
    const dataUrl = imageData.canvas.toDataURL('image/jpeg', 0.9)
    try {
      if (captionMode === 'gemma4') {
        await run({ image: dataUrl, device: 'webgpu', mode: 'caption' })
      } else {
        await run({ image: dataUrl, device, mode: captionMode })
      }
    } catch {
      // error surfaced via useInference
    }
  }, [imageData, device, captionMode, run])

  // Normalise result shape across all three modes
  const caption = captionMode === 'gemma4'
    ? (result?.text ?? null)
    : (result?.[0]?.generated_text ?? result?.generated_text ?? null)
  const tags = captionMode === 'gemma4' ? [] : (result?.[0]?.tags ?? [])

  return (
    <LabCard
      title="Image Captioning"
      description="Generate natural-language descriptions for any image"
      icon="💬"
      status={status}
      progress={progress}
      error={error}
      device={captionMode === 'gemma4' ? undefined : device}
      onDeviceChange={captionMode === 'gemma4' ? undefined : setDevice}
    >
      <div className="flex flex-col gap-4">

        {/* Mode toggle */}
        <div className="flex gap-2 rounded-lg border border-zinc-700 p-1">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setCaptionMode(m.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 rounded-md px-3 py-2 text-sm transition-colors ${
                captionMode === m.id
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="font-medium">{m.label}</span>
              <span className="text-xs opacity-70">{m.description}</span>
            </button>
          ))}
        </div>

        {captionMode === 'gemma4' && (
          <p className="text-xs text-zinc-500 -mt-2 text-center">
            Requires WebGPU · ~500 MB first load · Gemma 4 E2B
          </p>
        )}

        <ImageDropzone onImageLoad={setImageData} />

        <Button
          onClick={handleRun}
          disabled={!imageData || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading'
            ? 'Loading model…'
            : status === 'running'
              ? 'Generating caption…'
              : '▶ Generate Caption'}
        </Button>

        {caption && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Generated Caption</p>
              <p className="text-zinc-100 text-base leading-relaxed italic">"{caption}"</p>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Detected Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </LabCard>
  )
}
