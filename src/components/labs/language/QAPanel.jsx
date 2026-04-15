import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Badge } from '../../ui/badge'
import { useInference } from '../../../hooks/useInference'

const CONTEXT = `The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower from 1887 to 1889 as the centerpiece of the 1889 World's Fair. The tower is 330 metres (1,083 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest human-made structure in the world.`

function HighlightedContext({ context, answer, start, end }) {
  if (!answer || start == null) return <p className="text-sm text-zinc-300 leading-relaxed">{context}</p>
  return (
    <p className="text-sm text-zinc-300 leading-relaxed">
      {context.slice(0, start)}
      <mark className="bg-indigo-500/30 text-indigo-200 rounded px-0.5">{context.slice(start, end)}</mark>
      {context.slice(end)}
    </p>
  )
}

export default function QAPanel() {
  const [device, setDevice] = useState('wasm')
  const [context, setContext] = useState(CONTEXT)
  const [question, setQuestion] = useState('How tall is the Eiffel Tower?')

  const { run, status, progress, result, error } = useInference('qa')

  const handleRun = useCallback(async () => {
    if (!context.trim() || !question.trim()) return
    try {
      await run({ context, question, device })
    } catch {
      // error is already handled by useAIWorker
    }
  }, [context, question, device, run])

  return (
    <LabCard
      title="Question Answering"
      description="Ask questions about a passage and get the answer highlighted in context"
      icon="❓"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Context / Passage</label>
          <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={6} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Your Question</label>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="What do you want to know?"
          />
        </div>

        <Button
          onClick={handleRun}
          disabled={!context.trim() || !question.trim() || status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Finding answer…' : '▶ Answer'}
        </Button>

        {result && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Answer</span>
              <Badge variant="success">{Math.round(result.score * 100)}% confidence</Badge>
            </div>
            <div className="rounded-xl border border-indigo-700/40 bg-indigo-950/30 p-3">
              <p className="text-indigo-200 font-semibold text-base">"{result.answer}"</p>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">In Context</p>
              <HighlightedContext
                context={context}
                answer={result.answer}
                start={result.start}
                end={result.end}
              />
            </div>
          </div>
        )}
      </div>
    </LabCard>
  )
}
