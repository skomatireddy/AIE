import { getWorker, callWorker } from './workerBridge.js'

const factories = {
  ner:       () => new Worker(new URL('../workers/ner.worker.js',       import.meta.url), { type: 'module' }),
  qa:        () => new Worker(new URL('../workers/qa.worker.js',        import.meta.url), { type: 'module' }),
  sentiment: () => new Worker(new URL('../workers/sentiment.worker.js', import.meta.url), { type: 'module' }),
  summarize: () => new Worker(new URL('../workers/summarize.worker.js', import.meta.url), { type: 'module' }),
  translate: () => new Worker(new URL('../workers/translate.worker.js', import.meta.url), { type: 'module' }),
}

export const runNER       = (payload, callbacks, transferables) => callWorker(getWorker('ner',       factories.ner),       payload, callbacks, transferables)
export const runQA        = (payload, callbacks, transferables) => callWorker(getWorker('qa',        factories.qa),        payload, callbacks, transferables)
export const runSentiment = (payload, callbacks, transferables) => callWorker(getWorker('sentiment', factories.sentiment), payload, callbacks, transferables)
export const runSummarize = (payload, callbacks, transferables) => callWorker(getWorker('summarize', factories.summarize), payload, callbacks, transferables)
export const runTranslate = (payload, callbacks, transferables) => callWorker(getWorker('translate', factories.translate), payload, callbacks, transferables)
