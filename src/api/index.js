import { runCaption, runClassify, runDetect, runDepth, runSegment } from './vision.js'
import { runNER, runQA, runSentiment, runSummarize, runTranslate } from './language.js'
import { runASR, runAudioClassify } from './audio.js'
import { runEmbed, runGemma4 } from './multimodal.js'

export {
  runCaption, runClassify, runDetect, runDepth, runSegment,
  runNER, runQA, runSentiment, runSummarize, runTranslate,
  runASR, runAudioClassify,
  runEmbed, runGemma4,
}

/** Registry used by useInference to look up API functions by key */
export const INFERENCE_APIS = {
  caption:       runCaption,
  classify:      runClassify,
  detect:        runDetect,
  depth:         runDepth,
  segment:       runSegment,
  ner:           runNER,
  qa:            runQA,
  sentiment:     runSentiment,
  summarize:     runSummarize,
  translate:     runTranslate,
  asr:           runASR,
  audioclassify: runAudioClassify,
  embed:         runEmbed,
  gemma4:        runGemma4,
}
