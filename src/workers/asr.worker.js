import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let instance = null

async function getInstance(device) {
  if (!instance) {
    instance = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en',
      {
        device,
        dtype: 'q4',
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

    // data.audio is a Float32Array at 16kHz
    const result = await pipe(data.audio, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    })

    self.postMessage({ type: 'result', payload: result })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
