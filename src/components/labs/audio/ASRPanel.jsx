import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { AudioDropzone } from '../../upload/AudioDropzone'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { useInference } from '../../../hooks/useInference'

function Chunk({ chunk }) {
  const fmt = (s) => {
    if (s == null) return ''
    const mins = Math.floor(s / 60)
    const secs = (s % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, '0')}`
  }
  return (
    <div className="flex gap-3 text-sm">
      {chunk.timestamp && (
        <span className="text-zinc-500 font-mono text-xs whitespace-nowrap pt-0.5">
          {fmt(chunk.timestamp[0])}
        </span>
      )}
      <span className="text-zinc-200">{chunk.text}</span>
    </div>
  )
}

export default function ASRPanel() {
  const [device, setDevice] = useState('wasm')
  const [audioData, setAudioData] = useState(null)

  const { run, status, progress, result, error } = useInference('asr')

  const handleRun = useCallback(async () => {
    if (!audioData?.length) return
    try {
      // Transfer the underlying ArrayBuffer to avoid an expensive copy into the worker
      const copy = new Float32Array(audioData)
      await run({ audio: copy, device }, [copy.buffer])
    } catch {
      // error is already handled by useAIWorker
    }
  }, [audioData, device, run])

  const chunks = result?.chunks
  const fullText = result?.text

  return (
    <LabCard
      title="Speech Recognition (Whisper)"
      description="Transcribe speech from microphone or audio files using OpenAI Whisper"
      icon="🎙️"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-amber-600/30 bg-amber-600/10 p-3">
          <p className="text-xs text-amber-400">
            Whisper Tiny (~40MB) — first run downloads and caches the model.
            Best with clear speech in English.
          </p>
        </div>

        <AudioDropzone onAudioLoad={setAudioData} />

        <Button
          onClick={handleRun}
          disabled={!audioData || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Transcribing…' : '▶ Transcribe'}
        </Button>

        {fullText && (
          <div className="flex flex-col gap-3">
            {chunks && chunks.length > 1 ? (
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex flex-col gap-2">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">
                  {chunks.length} segments
                </p>
                {chunks.map((c, i) => <Chunk key={i} chunk={c} />)}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
                <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Transcription</p>
                <p className="text-zinc-100 text-sm leading-relaxed">{fullText}</p>
              </div>
            )}
            <Badge variant="secondary" className="self-start">
              {fullText.trim().split(/\s+/).length} words
            </Badge>
          </div>
        )}
      </div>
    </LabCard>
  )
}
