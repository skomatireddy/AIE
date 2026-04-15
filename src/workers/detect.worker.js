import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

const MODEL_ID = 'Xenova/yolos-small'

let detectPipe = null

async function getInstance(device) {
  if (!detectPipe) {
    detectPipe = await pipeline(
      'object-detection',
      MODEL_ID,
      {
        device,
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return detectPipe
}

self.addEventListener('message', async ({ data }) => {
  try {
    const pipe = await getInstance(data.device || 'wasm')
    self.postMessage({ type: 'status', payload: 'running' })

    const results = await pipe(data.image, { threshold: data.threshold ?? 0.5 })

    // Map to the shape DetectPanel expects: [{ label, score, box: { xmin, ymin, xmax, ymax } }]
    const detections = results.map(r => ({
      label: r.label,
      score: r.score,
      box: r.box,
    }))

    self.postMessage({ type: 'result', payload: detections })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
