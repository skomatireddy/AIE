import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let instance = null

async function getInstance(device) {
  if (!instance) {
    instance = await pipeline(
      'summarization',
      'Xenova/bart-large-cnn',
      {
        device,
        dtype: 'q8',
        session_options: { graphOptimizationLevel: 'basic' },
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return instance
}

self.addEventListener('message', async ({ data }) => {
  try {
    const pipe = await getInstance(data.device || 'wasm')
    self.postMessage({ type: 'status', payload: 'running' })
    const result = await pipe(data.text, {
      max_new_tokens: 512,
      min_length: 100,
      no_repeat_ngram_size: 3,
    })
    self.postMessage({ type: 'result', payload: result })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
