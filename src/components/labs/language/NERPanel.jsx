import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { useInference } from '../../../hooks/useInference'

const ENTITY_COLORS = {
  PER: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40', label: 'Person' },
  ORG: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40', label: 'Organisation' },
  LOC: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', label: 'Location' },
  MISC: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', label: 'Misc' },
}

function getColor(entityGroup) {
  for (const key of Object.keys(ENTITY_COLORS)) {
    if (entityGroup.includes(key)) return ENTITY_COLORS[key]
  }
  return { bg: 'bg-zinc-700', text: 'text-zinc-300', border: 'border-zinc-600', label: entityGroup }
}

function HighlightedText({ text, entities }) {
  if (!entities || entities.length === 0) {
    return <p className="text-zinc-300 text-sm leading-relaxed">{text}</p>
  }

  const segments = []
  let pos = 0
  const sorted = [...entities].sort((a, b) => a.start - b.start)

  for (const ent of sorted) {
    if (ent.start > pos) segments.push({ type: 'text', value: text.slice(pos, ent.start) })
    segments.push({ type: 'entity', value: text.slice(ent.start, ent.end), entity: ent })
    pos = ent.end
  }
  if (pos < text.length) segments.push({ type: 'text', value: text.slice(pos) })

  return (
    <p className="text-zinc-300 text-sm leading-relaxed">
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.value}</span>
        const c = getColor(seg.entity.entity_group || '')
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded px-0.5 border ${c.bg} ${c.text} ${c.border}`}
            title={`${seg.entity.entity_group} (${Math.round(seg.entity.score * 100)}%)`}
          >
            {seg.value}
            <span className="text-[9px] opacity-60 font-mono">{seg.entity.entity_group}</span>
          </span>
        )
      })}
    </p>
  )
}

const SAMPLE = `Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in Cupertino, California in April 1976. Today, Tim Cook leads the company from its headquarters in Silicon Valley.`

export default function NERPanel() {
  const [device, setDevice] = useState('wasm')
  const [text, setText] = useState(SAMPLE)

  const { run, status, progress, result, error } = useInference('ner')

  const handleRun = useCallback(async () => {
    if (!text.trim()) return
    try {
      await run({ text, device })
    } catch {
      // error is already handled by useAIWorker
    }
  }, [text, device, run])

  return (
    <LabCard
      title="Named Entity Recognition"
      description="Identify and highlight people, organisations, and locations in text"
      icon="🏷"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Enter text…" />

        <Button
          onClick={handleRun}
          disabled={!text.trim() || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Analysing…' : '▶ Find Entities'}
        </Button>

        <div className="flex gap-3 flex-wrap">
          {Object.entries(ENTITY_COLORS).map(([key, c]) => (
            <span key={key} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>
              {c.label}
            </span>
          ))}
        </div>

        {result && Array.isArray(result) && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">
              {result.length} entities found
            </p>
            <HighlightedText text={text} entities={result} />
          </div>
        )}
      </div>
    </LabCard>
  )
}
