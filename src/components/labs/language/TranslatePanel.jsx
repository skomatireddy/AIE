import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Select } from '../../ui/select'
import { useInference } from '../../../hooks/useInference'

const LANG_OPTIONS = [
  { value: 'en-fr', label: '🇬🇧 English → 🇫🇷 French' },
  { value: 'en-de', label: '🇬🇧 English → 🇩🇪 German' },
  { value: 'en-es', label: '🇬🇧 English → 🇪🇸 Spanish' },
  { value: 'en-zh', label: '🇬🇧 English → 🇨🇳 Chinese' },
  { value: 'en-ar', label: '🇬🇧 English → 🇸🇦 Arabic' },
]

export default function TranslatePanel() {
  const [device, setDevice] = useState('wasm')
  const [text, setText] = useState('Artificial intelligence is transforming the world in remarkable ways.')
  const [pair, setPair] = useState('en-fr')

  const { run, status, progress, result, error } = useInference('translate')

  const handleRun = useCallback(async () => {
    if (!text.trim()) return
    try {
      await run({ text, device, pair })
    } catch {
      // error is already handled by useAIWorker
    }
  }, [text, device, pair, run])

  const translated = result && Array.isArray(result) ? result[0]?.translation_text : null

  return (
    <LabCard
      title="Translation"
      description="Translate text between languages using neural machine translation"
      icon="🌍"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <Select
          value={pair}
          onValueChange={setPair}
          options={LANG_OPTIONS}
          className="w-full"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Source (English)</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Enter English text…"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Translation</label>
            <div className="min-h-[120px] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
              {translated
                ? <span>{translated}</span>
                : <span className="text-zinc-600 italic">Translation will appear here…</span>
              }
            </div>
          </div>
        </div>

        <Button
          onClick={handleRun}
          disabled={!text.trim() || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Translating…' : '▶ Translate'}
        </Button>
      </div>
    </LabCard>
  )
}
