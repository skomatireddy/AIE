import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let instance = null

async function getInstance(device) {
  if (!instance) {
    instance = await pipeline(
      'question-answering',
      'Xenova/distilbert-base-cased-distilled-squad',
      {
        device,
        dtype: 'q8',
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
    const result = await pipe(data.question, data.context)
    self.postMessage({ type: 'result', payload: result })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
