import { getWorker, callWorker } from './workerBridge.js'

const factories = {
  embed:  () => new Worker(new URL('../workers/embed.worker.js',   import.meta.url), { type: 'module' }),
  gemma4: () => new Worker(new URL('../workers/gemma4.worker.js',  import.meta.url), { type: 'module' }),
}

export const runEmbed  = (payload, callbacks, transferables) => callWorker(getWorker('embed',  factories.embed),  payload, callbacks, transferables)
export const runGemma4 = (payload, callbacks, transferables) => callWorker(getWorker('gemma4', factories.gemma4), payload, callbacks, transferables)
