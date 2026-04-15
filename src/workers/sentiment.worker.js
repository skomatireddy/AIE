import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let sentimentPipe = null
let zeroShotPipe = null

async function getSentimentPipe(device) {
  if (!sentimentPipe) {
    sentimentPipe = await pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      {
        device,
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return sentimentPipe
}

async function getZeroShotPipe(device) {
  if (!zeroShotPipe) {
    zeroShotPipe = await pipeline(
      'zero-shot-classification',
      'Xenova/nli-deberta-v3-small',
      {
        device,
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return zeroShotPipe
}

self.addEventListener('message', async ({ data }) => {
  try {
    self.postMessage({ type: 'status', payload: 'running' })

    if (data.mode === 'zero-shot') {
      const pipe = await getZeroShotPipe(data.device || 'wasm')
      const result = await pipe(data.text, data.labels, { multi_label: true })
      self.postMessage({ type: 'result', payload: result })
    } else {
      const pipe = await getSentimentPipe(data.device || 'wasm')
      const result = await pipe(data.text, { topk: null })
      self.postMessage({ type: 'result', payload: result })
    }
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
