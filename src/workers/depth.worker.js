import { pipeline, env, RawImage } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let instance = null
let currentDevice = null

async function getInstance(device = 'wasm') {
  if (!instance || currentDevice !== device) {
    instance = null
    currentDevice = device
    instance = await pipeline(
      'depth-estimation',
      'onnx-community/depth-anything-v2-base',
      {
        device,
        dtype: 'q8',
        progress_callback: (progress) => {
          self.postMessage({ type: 'progress', payload: progress })
        },
      }
    )
  }
  return instance
}

self.addEventListener('message', async ({ data }) => {
  try {
    const pipe = await getInstance(data.device || 'wasm')
    self.postMessage({ type: 'status', payload: 'running' })

    const result = await pipe(data.image)
    const depthTensor = result.predicted_depth

    // Convert tensor to plain array for transfer
    const depthData = Array.from(depthTensor.data)
    const [height, width] = depthTensor.dims.slice(-2)

    self.postMessage({
      type: 'result',
      payload: { depthData, width, height },
    })
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
