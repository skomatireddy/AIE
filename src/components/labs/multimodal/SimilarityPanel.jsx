import { useState, useCallback } from 'react'
import { LabCard } from '../../shared/LabCard'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { useInference } from '../../../hooks/useInference'

function ImageCard({ src, score, rank }) {
  const pct = Math.round(score * 100)
  return (
    <div className="flex flex-col gap-1 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
      <div className="relative">
        <img src={src} alt="" className="w-full h-32 object-cover" />
        {rank === 0 && (
          <div className="absolute top-1 right-1 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            Best Match
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-zinc-400">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

export default function SimilarityPanel() {
  const [device, setDevice] = useState('wasm')
  const [tab, setTab] = useState('image-search')
  const [query, setQuery] = useState('a sunset over the ocean')
  const [images, setImages] = useState([])  // { url, dataUrl }
  const [textA, setTextA] = useState('The cat sat on the mat.')
  const [textB, setTextB] = useState('A feline rested on a rug.')

  const { run, status, progress, result, error } = useInference('embed')

  const addImages = useCallback((e) => {
    const files = Array.from(e.target.files).slice(0, 6 - images.length)
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        setImages(prev => [...prev, { url, dataUrl: canvas.toDataURL('image/jpeg', 0.8) }])
      }
      img.src = url
    })
  }, [images])

  const handleRun = useCallback(async () => {
    try {
      if (tab === 'image-search') {
        if (images.length === 0) return
        await run({ mode: 'image-search', images: images.map(i => i.dataUrl), query, device })
      } else {
        if (!textA.trim() || !textB.trim()) return
        await run({ mode: 'text-similarity', textA, textB, device })
      }
    } catch {
      // error is already handled by useAIWorker
    }
  }, [tab, images, query, textA, textB, device, run])

  // result for image search is an array of { index, score } sorted by score
  const imageResults = tab === 'image-search' && result && Array.isArray(result) ? result : []
  const textSim = tab === 'text-similarity' && result?.similarity != null ? result.similarity : null

  return (
    <LabCard
      title="Semantic Similarity & Image Search"
      description="Use CLIP + MiniLM to search images with text or compare sentence similarity"
      icon="🔗"
      status={status}
      progress={progress}
      error={error}
      device={device}
      onDeviceChange={setDevice}
    >
      <div className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="image-search" activeValue={tab} onValueChange={setTab}>Image Search (CLIP)</TabsTrigger>
            <TabsTrigger value="text-similarity" activeValue={tab} onValueChange={setTab}>Text Similarity</TabsTrigger>
          </TabsList>

          <TabsContent value="image-search" activeValue={tab}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400">Text Query</label>
                <Textarea value={query} onChange={e => setQuery(e.target.value)} rows={2} placeholder="Describe what you're looking for…" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400">Images ({images.length}/6)</label>
                  {images.length < 6 && (
                    <label className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
                      + Add images
                      <input type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
                    </label>
                  )}
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <button
                          className="absolute top-1 right-1 bg-zinc-900/80 text-zinc-300 rounded px-1 text-xs"
                          onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text-similarity" activeValue={tab}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400">Sentence A</label>
                <Textarea value={textA} onChange={e => setTextA(e.target.value)} rows={4} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400">Sentence B</label>
                <Textarea value={textB} onChange={e => setTextB(e.target.value)} rows={4} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleRun}
          disabled={status === 'loading' || status === 'running'}
          className="w-full"
        >
          {status === 'loading' ? 'Loading model…' : status === 'running' ? 'Computing…' : '▶ Compute Similarity'}
        </Button>

        {imageResults.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Images ranked by similarity to "{query}"</p>
            <div className="grid grid-cols-3 gap-2">
              {imageResults.map((r, rank) => (
                <ImageCard key={r.index} src={images[r.index]?.url} score={r.score} rank={rank} />
              ))}
            </div>
          </div>
        )}

        {textSim != null && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex flex-col gap-3">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Cosine Similarity</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.round(Math.max(0, textSim) * 100)}%` }}
                />
              </div>
              <Badge variant={textSim > 0.7 ? 'success' : textSim > 0.4 ? 'default' : 'secondary'} className="text-base font-mono px-3">
                {textSim.toFixed(3)}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">
              {textSim > 0.8 ? '🟢 Very similar meaning'
                : textSim > 0.6 ? '🟡 Somewhat related'
                : textSim > 0.3 ? '🟠 Loosely related'
                : '🔴 Very different topics'}
            </p>
          </div>
        )}
      </div>
    </LabCard>
  )
}
