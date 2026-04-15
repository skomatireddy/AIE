import { Florence2ForConditionalGeneration, AutoProcessor, RawImage, pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

const FLORENCE_MODEL_ID = 'onnx-community/Florence-2-base-ft'
const FLORENCE_TASK = '<MORE_DETAILED_CAPTION>'

let florenceProcessor = null
let florenceModel = null
let vitGpt2Pipe = null

async function getFlorence(device) {
  if (!florenceModel) {
    florenceProcessor = await AutoProcessor.from_pretrained(FLORENCE_MODEL_ID, {
      progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
    })
    florenceModel = await Florence2ForConditionalGeneration.from_pretrained(FLORENCE_MODEL_ID, {
      device,
      dtype: {
        embed_tokens: 'fp16',
        vision_encoder: 'fp16',
        encoder_model: 'q4',
        decoder_model_merged: 'q4',
      },
      session_options: { graphOptimizationLevel: 'basic' },
      progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
    })
  }
  return { model: florenceModel, processor: florenceProcessor }
}

async function getVitGpt2(device) {
  if (!vitGpt2Pipe) {
    vitGpt2Pipe = await pipeline(
      'image-to-text',
      'Xenova/vit-gpt2-image-captioning',
      {
        device,
        dtype: 'q8',
        session_options: { graphOptimizationLevel: 'basic' },
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      }
    )
  }
  return vitGpt2Pipe
}

self.addEventListener('message', async ({ data }) => {
  try {
    const device = data.device || 'wasm'
    const mode = data.mode || 'florence'

    self.postMessage({ type: 'status', payload: 'running' })

    if (mode === 'vit-gpt2') {
      const pipe = await getVitGpt2(device)
      const result = await pipe(data.image)
      self.postMessage({ type: 'result', payload: [{ generated_text: result[0].generated_text, tags: [] }] })
    } else {
      const { model, processor } = await getFlorence(device)

      const image = await RawImage.fromURL(data.image)

      // Caption pass
      const captionInputs = await processor(image, FLORENCE_TASK)
      const captionIds = await model.generate({ ...captionInputs, max_new_tokens: 200 })
      const captionDecoded = processor.batch_decode(captionIds, { skip_special_tokens: false })[0]
      const captionParsed = processor.post_process_generation(captionDecoded, FLORENCE_TASK, {
        width: image.width,
        height: image.height,
      })

      // OD pass — extract unique labels as tags
      const odInputs = await processor(image, '<OD>')
      const odIds = await model.generate({ ...odInputs, max_new_tokens: 256 })
      const odDecoded = processor.batch_decode(odIds, { skip_special_tokens: false })[0]
      const odParsed = processor.post_process_generation(odDecoded, '<OD>', {
        width: image.width,
        height: image.height,
      })
      const tags = [...new Set(odParsed['<OD>'].labels)]

      self.postMessage({ type: 'result', payload: [{ generated_text: captionParsed[FLORENCE_TASK], tags }] })
    }
  } catch (err) {
    self.postMessage({ type: 'error', payload: err.message })
  }
})
