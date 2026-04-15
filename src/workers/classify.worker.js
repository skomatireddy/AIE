import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let classifyPipe = null
let zeroShotPipe = null

async function getClassifyPipe(device) {
  if (!classifyPipe) {
    classifyPipe = await pipeline(
      'image-classification',
      'Xenova/swin-base-patch4-window7-224-in22k',
      {
        device,
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return classifyPipe
}

async function getZeroShotPipe(device) {
  if (!zeroShotPipe) {
    zeroShotPipe = await pipeline(
      'zero-shot-image-classification',
      'Xenova/clip-vit-base-patch32',
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
    const device = data.device || 'wasm'

    if (data.mode === 'zero-shot') {
      const pipe = await getZeroShotPipe(device)
      const result = await pipe(data.image, data.labels)
      self.postMessage({ type: 'result', payload: { mode: 'zero-shot', data: result } })
    } else {
      const pipe = await getClassifyPipe(device)
      const predictions = await pipe(data.image, { topk: 10 })
      const confident = predictions.filter(p => p.score >= 0.05)
      const source = confident.length > 0 ? confident : predictions.slice(0, 1)
      const clean = s => s.replace(/_/g, ' ').trim()
      const tags = [...new Set(
        source.flatMap(p => p.label.split(',').map(t => clean(t))).filter(Boolean)
      )]
      const caption = source.slice(0, 3).map(p => clean(p.label.split(',')[0])).join(', ')
      self.postMessage({ type: 'result', payload: { mode: 'caption', caption, tags } })
    }
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
