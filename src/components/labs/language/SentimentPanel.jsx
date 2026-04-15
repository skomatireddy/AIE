import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { useInference } from '../../../hooks/useInference'

function SentimentResult({ result }) {
  if (!result || !Array.isArray(result)) return null
  const sorted = [...result].sort((a, b) => b.score - a.score)
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <Badge variant={r.label === 'POSITIVE' ? 'success' : r.label === 'NEGATIVE' ? 'destructive' : 'secondary'}>
            {r.label}
          </Badge>
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${r.label === 'POSITIVE' ? 'bg-emerald-500' : r.label === 'NEGATIVE' ? 'bg-red-500' : 'bg-zinc-500'}`}
              style={{ width: `${Math.round(r.score * 100)}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 w-10 text-right">{Math.round(r.score * 100)}%</span>
        </div>
      ))}
    </div>
  )
}

function ZeroShotResult({ result }) {
  if (!result || !result.labels) return null
  return (
    <div className="flex flex-col gap-2">
      {result.labels.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-sm text-zinc-300 w-32 truncate">{label}</span>
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.round(result.scores[i] * 100)}%` }} />
          </div>
          <span className="text-xs text-zinc-400 w-10 text-right">{Math.round(result.scores[i] * 100)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function SentimentPanel() {
  const [device, setDevice] = useState('wasm')
  const [text, setText] = useState('I absolutely love this new AI technology! It is incredible.')
  const [labels, setLabels] = useState('technology, sports, politics, entertainment, science, health')
  const [tab, setTab] = useState('sentiment')

  const { run, status, progress, result, error } = useInference('sentiment')

  const handleRun = useCallback(async () => {
    if (!text.trim()) return
    try {
      if (tab === 'zero-shot') {
        const labelList = labels.split(',').map(l => l.trim()).filter(Boolean)
        await run({ text, device, mode: 'zero-shot', labels: labelList })
      } else {
        await run({ text, device, mode: 'sentiment' })
      }
    } catch {
      // error is already handled by useAIWorker
    }
  }, [text, labels, tab, device, run])

  return (
    <LabCard
      title="Sentiment & Zero-Shot Classification"
      description="Analyse text sentiment or classify into any custom categories"
      icon="😊"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="sentiment" activeValue={tab} onValueChange={setTab}>Sentiment</TabsTrigger>
            <TabsTrigger value="zero-shot" activeValue={tab} onValueChange={setTab}>Zero-Shot</TabsTrigger>
          </TabsList>

          <TabsContent value="zero-shot" activeValue={tab}>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Categories (comma-separated)</label>
              <Textarea value={labels} onChange={(e) => setLabels(e.target.value)} rows={2} />
            </div>
          </TabsContent>
        </Tabs>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to analyse…"
          rows={4}
        />

        <Button
          onClick={handleRun}
          disabled={!text.trim() || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Analysing…' : '▶ Analyse'}
        </Button>

        {result && tab === 'sentiment' && <SentimentResult result={result} />}
        {result && tab === 'zero-shot' && <ZeroShotResult result={result} />}
      </div>
    </LabCard>
  )
}
