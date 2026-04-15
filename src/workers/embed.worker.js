import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let clipPipe = null
let textPipe = null

async function getClipPipe(device) {
  if (!clipPipe) {
    clipPipe = await pipeline(
      'zero-shot-image-classification',
      'Xenova/clip-vit-base-patch32',
      {
        device,
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return clipPipe
}

async function getTextPipe(device) {
  if (!textPipe) {
    textPipe = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        device,
        dtype: 'q8',
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return textPipe
}

self.addEventListener('message', async ({ data }) => {
  try {
    self.postMessage({ type: 'status', payload: 'running' })

    if (data.mode === 'image-search') {
      // Score each image against the text query using CLIP
      const pipe = await getClipPipe(data.device || 'wasm')
      const results = []
      for (let i = 0; i < data.images.length; i++) {
        const r = await pipe(data.images[i], [data.query])
        results.push({ index: i, score: r[0].score, label: r[0].label })
      }
      results.sort((a, b) => b.score - a.score)
      self.postMessage({ type: 'result', payload: results })
    } else {
      // Text similarity: embed both sentences, return cosine scores
      const pipe = await getTextPipe(data.device || 'wasm')
      const [embA, embB] = await Promise.all([
        pipe(data.textA, { pooling: 'mean', normalize: true }),
        pipe(data.textB, { pooling: 'mean', normalize: true }),
      ])
      const vecA = Array.from(embA.data)
      const vecB = Array.from(embB.data)
      let dot = 0
      for (let i = 0; i < vecA.length; i++) dot += vecA[i] * vecB[i]
      self.postMessage({ type: 'result', payload: { similarity: dot } })
    }
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
