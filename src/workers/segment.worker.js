import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let segPipe = null
let bgPipe = null

async function getSegPipe(device) {
  if (!segPipe) {
    segPipe = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      {
        device,
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return segPipe
}

async function getBgPipe(device) {
  if (!bgPipe) {
    bgPipe = await pipeline(
      'background-removal',
      'Xenova/modnet',
      {
        device,
        dtype: 'fp32',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return bgPipe
}

self.addEventListener('message', async ({ data }) => {
  try {
    self.postMessage({ type: 'status', payload: 'running' })

    if (data.mode === 'background-removal') {
      const pipe = await getBgPipe(data.device || 'wasm')
      const result = await pipe(data.image)
      self.postMessage({ type: 'result', payload: result })
    } else {
      const pipe = await getSegPipe(data.device || 'wasm')
      const result = await pipe(data.image)
      self.postMessage({ type: 'result', payload: result })
    }
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
