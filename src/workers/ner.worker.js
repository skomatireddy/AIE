import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let instance = null

async function getInstance(device) {
  if (!instance) {
    instance = await pipeline(
      'token-classification',
      'Xenova/bert-base-NER',
      {
        device,
        dtype: 'fp32',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return instance
}

// Resolve character positions, normalise entity_group, and merge adjacent same-type spans.
// Handles models that return individual tokens without start/end (no aggregation).
function normaliseEntities(entities, text) {
  let searchPos = 0
  const resolved = []

  for (const ent of entities) {
    const rawLabel = ent.entity_group || ent.entity || ''
    const entity_group = rawLabel.replace(/^[BI]-/, '') // strip B-/I- prefix

    let { start, end } = ent
    if (typeof start !== 'number' || typeof end !== 'number') {
      const word = (ent.word || '').replace(/^##/, '')
      if (!word) continue
      const idx = text.indexOf(word, searchPos)
      if (idx === -1) continue
      start = idx
      end = idx + word.length
    }
    searchPos = end
    resolved.push({ ...ent, entity_group, start, end })
  }

  // Merge adjacent/touching spans of the same entity type
  const merged = []
  for (const ent of resolved) {
    const prev = merged[merged.length - 1]
    if (prev && prev.entity_group === ent.entity_group && ent.start <= prev.end + 1) {
      prev.end = ent.end
      prev.word = text.slice(prev.start, prev.end)
    } else {
      merged.push({ ...ent })
    }
  }

  return merged
}

self.addEventListener('message', async ({ data }) => {
  try {
    const pipe = await getInstance(data.device || 'wasm')
    self.postMessage({ type: 'status', payload: 'running' })
    const raw = await pipe(data.text, { aggregation_strategy: 'simple' })
    const result = normaliseEntities(Array.isArray(raw) ? raw : [raw], data.text)
    self.postMessage({ type: 'result', payload: result })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
