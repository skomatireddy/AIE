import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { ImageDropzone } from '../../upload/ImageDropzone'
import { AudioDropzone } from '../../upload/AudioDropzone'
import { Button } from '../../ui/button'
import { useInference } from '../../../hooks/useInference'

const MODES = [
  { id: 'caption',      icon: '💬', label: 'Caption',      desc: 'Detailed image description' },
  { id: 'vqa',          icon: '❓', label: 'VQA',          desc: 'Ask questions about an image' },
  { id: 'tags',         icon: '🏷️', label: 'Tags',         desc: 'Generate labels for items in image' },
  { id: 'ocr',          icon: '📄', label: 'OCR',          desc: 'Extract text from images' },
  { id: 'asr',          icon: '🎙️', label: 'Transcribe',   desc: 'Speech to text via audio' },
  { id: 'audiovision',  icon: '🎬', label: 'AudioVision',  desc: 'Understand image + audio together' },
]

export default function Gemma4Panel() {
  const [device, setDevice] = useState('webgpu')
  const [mode, setMode] = useState('caption')
  const [imageData, setImageData] = useState(null)
  const [audioData, setAudioData] = useState(null)
  const [question, setQuestion] = useState('')
  const [avPrompt, setAvPrompt] = useState('')

  const { run, status, progress, result, error } = useInference('gemma4')

  const needsImage = mode !== 'asr'
  const needsAudio = mode === 'asr' || mode === 'audiovision'

  const canRun = (
    status !== 'loading' && status !== 'running' &&
    (needsImage ? imageData !== null : true) &&
    (needsAudio ? audioData !== null : true) &&
    (mode === 'vqa' ? question.trim().length > 0 : true)
  )

  const handleRun = useCallback(async () => {
    const dataUrl = imageData?.canvas?.toDataURL('image/jpeg', 0.9) ?? null
    const payload = { device, mode }
    const transferables = []

    if (dataUrl) payload.image = dataUrl
    if (audioData) {
      payload.audio = audioData
      transferables.push(audioData.buffer)
    }
    if (mode === 'vqa')         payload.question = question
    if (mode === 'audiovision') payload.prompt = avPrompt

    try {
      await run(payload, transferables)
    } catch {
      // error surfaced via useInference
    }
  }, [imageData, audioData, device, mode, question, avPrompt, run])

  const outputText = result?.text ?? null

  const activeMode = MODES.find(m => m.id === mode)

  return (
    <LabCard
      title="Gemma 4 Explorer"
      description="Gemma 4 E2B — multimodal: vision, VQA, OCR, audio transcription, and AudioVision"
      icon="✨"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">

        {/* Mode tabs */}
        <div className="grid grid-cols-6 gap-1 rounded-lg border border-zinc-700 p-1">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex flex-col items-center gap-0.5 rounded-md px-1 py-2 text-xs transition-colors ${
                mode === m.id
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="text-base">{m.icon}</span>
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-500 -mt-2">{activeMode.desc}</p>

        {/* Inputs */}
        {needsImage && (
          <ImageDropzone onImageLoad={setImageData} />
        )}

        {needsAudio && (
          <AudioDropzone onAudioLoad={setAudioData} />
        )}

        {mode === 'vqa' && (
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question about the image…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        )}

        {mode === 'audiovision' && (
          <input
            type="text"
            value={avPrompt}
            onChange={e => setAvPrompt(e.target.value)}
            placeholder="Custom prompt (optional) — e.g. 'What is happening in the video?'"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        )}

        <Button onClick={handleRun} disabled={!canRun} className="w-full">
          {status === 'loading'
            ? 'Loading Gemma 4…'
            : status === 'running'
              ? `Running ${activeMode.label}…`
              : `▶ Run ${activeMode.label}`}
        </Button>

        {/* WebGPU hint */}
        {device === 'webgpu' && (
          <p className="text-xs text-zinc-600 text-center -mt-2">
            Gemma 4 runs best on WebGPU (~38 tok/s). Switch to WASM only if WebGPU is unavailable.
          </p>
        )}

        {/* Output */}
        {outputText && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex flex-col gap-2">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              {activeMode.icon} {activeMode.label} Output
            </p>
            {mode === 'tags' ? (
              <div className="flex flex-wrap gap-2">
                {outputText.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap">{outputText}</p>
            )}
          </div>
        )}

        {result && !outputText && status === 'done' && (
          <p className="text-sm text-zinc-500 text-center py-4">No output returned.</p>
        )}
      </div>
    </LabCard>
  )
}
