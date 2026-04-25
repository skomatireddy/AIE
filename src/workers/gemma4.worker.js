// Use dynamic import to avoid Vite static analysis issues with new worker files
let _transformers = null
async function getTransformers() {
  if (!_transformers) {
    _transformers = await import('@huggingface/transformers')
    console.log('[gemma4] @huggingface/transformers loaded. Gemma4ForConditionalGeneration:', typeof _transformers.Gemma4ForConditionalGeneration)
  }
  return _transformers
}

self.addEventListener('unhandledrejection', (e) => {
  console.error('[gemma4] Unhandled rejection:', e.reason)
  self.postMessage({ type: 'error', payload: String(e.reason?.message ?? e.reason) })
})

console.log('[gemma4] Worker script executing')

const MODEL_ID = 'onnx-community/gemma-4-E2B-it-ONNX'

let processor = null
let model = null

async function getInstance(device) {
  const { AutoProcessor, Gemma4ForConditionalGeneration, env } = await getTransformers()

  env.allowLocalModels = false
  env.useBrowserCache = true

  if (!model) {
    console.log('[gemma4] Loading processor…')
    try {
      processor = await AutoProcessor.from_pretrained(MODEL_ID, {
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      })
      console.log('[gemma4] Processor loaded. Loading model…', { device, dtype: 'q4f16' })
    } catch (err) {
      console.error('[gemma4] Failed to load processor:', err)
      throw err
    }
    try {
      model = await Gemma4ForConditionalGeneration.from_pretrained(MODEL_ID, {
        device,
        dtype: 'q4f16',
        session_options: { graphOptimizationLevel: 'basic' },
        progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
      })
      console.log('[gemma4] Model loaded successfully.')
    } catch (err) {
      console.error('[gemma4] Failed to load model:', err)
      model = null
      throw err
    }
  }
  return { model, processor }
}

async function generate(processor, model, messages, image, audio, maxTokens = 512) {
  const prompt = processor.apply_chat_template(messages, {
    enable_thinking: false,
    add_generation_prompt: true,
  })
  const inputs = await processor(prompt, image ?? null, audio ?? null, {
    add_special_tokens: false,
  })
  const outputIds = await model.generate({
    ...inputs,
    max_new_tokens: maxTokens,
    do_sample: false,
  })
  const newTokenIds = outputIds.slice(null, [inputs.input_ids.dims.at(-1), null])
  const decoded = processor.batch_decode(newTokenIds, { skip_special_tokens: true })
  return decoded[0].trim()
}

self.addEventListener('message', async ({ data }) => {
  try {
    const device = data.device || 'webgpu'
    const mode = data.mode || 'caption'

    const { load_image } = await getTransformers()
    const { model, processor } = await getInstance(device)
    self.postMessage({ type: 'status', payload: 'running' })

    if (mode === 'asr') {
      const messages = [{
        role: 'user',
        content: [
          { type: 'audio' },
          { type: 'text', text: 'Transcribe the speech in this audio clip. Output only the transcribed text with no extra commentary.' },
        ],
      }]
      const text = await generate(processor, model, messages, null, data.audio, 512)
      self.postMessage({ type: 'result', payload: { mode, text } })

    } else if (mode === 'audiovision') {
      const image = await load_image(data.image)
      const prompt = data.prompt?.trim() || 'Describe what you see in the image and transcribe any speech in the audio.'
      const messages = [{
        role: 'user',
        content: [
          { type: 'image' },
          { type: 'audio' },
          { type: 'text', text: prompt },
        ],
      }]
      const text = await generate(processor, model, messages, image, data.audio, 512)
      self.postMessage({ type: 'result', payload: { mode, text } })

    } else {
      const image = await load_image(data.image)

      let promptText
      if (mode === 'vqa') {
        promptText = data.question?.trim() || 'What is in this image?'
      } else if (mode === 'ocr') {
        promptText = 'Extract and output all text visible in this image. Output only the raw text content, preserving layout where possible.'
      } else if (mode === 'tags') {
        promptText = 'List every unique object, item, and subject visible in this image as a comma-separated list of short lowercase labels (e.g. "cat, wooden table, coffee mug"). Output only the comma-separated tags with no extra commentary.'
      } else {
        promptText = 'Describe this image in rich detail, including objects, colors, actions, setting, and mood.'
      }

      const messages = [{
        role: 'user',
        content: [
          { type: 'image' },
          { type: 'text', text: promptText },
        ],
      }]
      const text = await generate(processor, model, messages, image, null, 512)
      self.postMessage({ type: 'result', payload: { mode, text } })
    }
  } catch (err) {
    console.error('[gemma4] Worker error:', err)
    self.postMessage({ type: 'error', payload: err.message })
  }
})
