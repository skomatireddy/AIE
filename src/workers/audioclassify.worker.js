import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let instance = null

async function getInstance(device) {
  if (!instance) {
    instance = await pipeline(
      'audio-classification',
      'Xenova/ast-finetuned-audioset-10-10-0.4593',
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
    const result = await pipe(data.audio, { topk: 10 })
    self.postMessage({ type: 'result', payload: result })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
