import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { AudioDropzone } from '../../upload/AudioDropzone'
import { Button } from '../../ui/button'
import { useInference } from '../../../hooks/useInference'

const COLORS = ['bg-indigo-500','bg-violet-500','bg-purple-500','bg-fuchsia-500','bg-pink-500',
  'bg-sky-500','bg-cyan-500','bg-teal-500','bg-emerald-500','bg-green-500']

export default function AudioClassPanel() {
  const [device, setDevice] = useState('wasm')
  const [audioData, setAudioData] = useState(null)

  const { run, status, progress, result, error } = useInference('audioclassify')

  const handleRun = useCallback(async () => {
    if (!audioData) return
    try {
      await run({ audio: audioData, device })
    } catch {
      // error is already handled by useAIWorker
    }
  }, [audioData, device, run])

  const predictions = result && Array.isArray(result) ? result : []

  return (
    <LabCard
      title="Audio Classification"
      description="Classify sounds from audio files — music, speech, ambient, instruments"
      icon="🔊"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <AudioDropzone onAudioLoad={setAudioData} />

        <Button
          onClick={handleRun}
          disabled={!audioData || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Classifying…' : '▶ Classify Audio'}
        </Button>

        {predictions.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Top Sound Classes</h4>
            {predictions.map((p, i) => (
              <div key={p.label} className="flex items-center gap-3">
                <span className="text-sm text-zinc-300 w-48 truncate flex-shrink-0" title={p.label}>{p.label}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${COLORS[i % COLORS.length]} transition-all duration-500`}
                    style={{ width: `${Math.round(p.score * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 w-10 text-right">{Math.round(p.score * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </LabCard>
  )
}
