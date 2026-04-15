import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Badge } from '../../ui/badge'
import { useInference } from '../../../hooks/useInference'

const SAMPLE = `Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term "artificial intelligence" had previously been used to describe machines that mimic and display "human" cognitive skills associated with the human mind, such as "learning" and "problem-solving". This definition has since been rejected by major AI researchers who now describe AI in terms of rationality and acting rationally, which does not limit how intelligence can be articulated. AI applications include advanced web search engines (e.g., Google Search), recommendation systems (used by YouTube, Amazon, and Netflix), understanding human speech (such as Siri and Alexa), self-driving cars (e.g., Waymo), generative or creative tools (ChatGPT and AI art), automated decision-making, and competing at the highest level in strategic games (such as chess and Go). As machines become increasingly capable, tasks considered to require "intelligence" are often removed from the definition of AI, a phenomenon known as the AI effect. For instance, optical character recognition is frequently excluded from things considered to be AI, having become a routine technology.`

function wordCount(s) {
  return s.trim().split(/\s+/).filter(Boolean).length
}

export default function SummarizePanel() {
  const [device, setDevice] = useState('wasm')
  const [text, setText] = useState(SAMPLE)

  const { run, status, progress, result, error } = useInference('summarize')

  const handleRun = useCallback(async () => {
    if (!text.trim()) return
    try {
      await run({ text, device })
    } catch {
      // error is already handled by useAIWorker
    }
  }, [text, device, run])

  const summary = result && Array.isArray(result) ? result[0]?.summary_text : null

  return (
    <LabCard
      title="Text Summarization"
      description="Condense long articles and documents into concise summaries"
      icon="📝"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400">Article / Text</label>
            <Badge variant="secondary">{wordCount(text)} words</Badge>
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Paste a long article…" />
        </div>

        <Button
          onClick={handleRun}
          disabled={!text.trim() || wordCount(text) < 20 || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Summarising…' : '▶ Summarise'}
        </Button>

        {summary && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Summary</p>
              <Badge variant="success">{wordCount(summary)} words — {Math.round(wordCount(summary) / wordCount(text) * 100)}% of original</Badge>
            </div>
            <p className="text-zinc-100 text-sm leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
    </LabCard>
  )
}
