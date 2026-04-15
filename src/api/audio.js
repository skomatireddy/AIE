import { getWorker, callWorker } from './workerBridge.js'

const factories = {
  asr:           () => new Worker(new URL('../workers/asr.worker.js',           import.meta.url), { type: 'module' }),
  audioclassify: () => new Worker(new URL('../workers/audioclassify.worker.js', import.meta.url), { type: 'module' }),
}

export const runASR           = (payload, callbacks, transferables) => callWorker(getWorker('asr',           factories.asr),           payload, callbacks, transferables)
export const runAudioClassify = (payload, callbacks, transferables) => callWorker(getWorker('audioclassify', factories.audioclassify), payload, callbacks, transferables)
