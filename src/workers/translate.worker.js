import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

const instances = {}

const MODEL_MAP = {
  'en-fr': 'Xenova/opus-mt-en-fr',
  'en-de': 'Xenova/opus-mt-en-de',
  'en-es': 'Xenova/opus-mt-en-es',
  'en-zh': 'Xenova/opus-mt-en-zh',
  'en-ja': 'Xenova/opus-mt-en-jap',
  'en-ar': 'Xenova/opus-mt-en-ar',
}

async function getInstance(pair, device) {
  if (!instances[pair]) {
    const model = MODEL_MAP[pair] || MODEL_MAP['en-fr']
    instances[pair] = await pipeline(
      'translation',
      model,
      {
        device,
        dtype: 'q8',
        session_options: { graphOptimizationLevel: 'basic' },
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return instances[pair]
}

self.addEventListener('message', async ({ data }) => {
  try {
    const pair = data.pair || 'en-fr'
    const pipe = await getInstance(pair, data.device || 'wasm')
    self.postMessage({ type: 'status', payload: 'running' })
    const result = await pipe(data.text, { max_new_tokens: 512 })
    self.postMessage({ type: 'result', payload: result })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
