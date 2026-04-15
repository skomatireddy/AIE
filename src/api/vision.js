import { getWorker, callWorker } from './workerBridge.js'

const factories = {
  caption:  () => new Worker(new URL('../workers/caption.worker.js',  import.meta.url), { type: 'module' }),
  classify: () => new Worker(new URL('../workers/classify.worker.js', import.meta.url), { type: 'module' }),
  detect:   () => new Worker(new URL('../workers/detect.worker.js',   import.meta.url), { type: 'module' }),
  depth:    () => new Worker(new URL('../workers/depth.worker.js',    import.meta.url), { type: 'module' }),
  segment:  () => new Worker(new URL('../workers/segment.worker.js',  import.meta.url), { type: 'module' }),
}

export const runCaption  = (payload, callbacks, transferables) => callWorker(getWorker('caption',  factories.caption),  payload, callbacks, transferables)
export const runClassify = (payload, callbacks, transferables) => callWorker(getWorker('classify', factories.classify), payload, callbacks, transferables)
export const runDetect   = (payload, callbacks, transferables) => callWorker(getWorker('detect',   factories.detect),   payload, callbacks, transferables)
export const runDepth    = (payload, callbacks, transferables) => callWorker(getWorker('depth',    factories.depth),    payload, callbacks, transferables)
export const runSegment  = (payload, callbacks, transferables) => callWorker(getWorker('segment',  factories.segment),  payload, callbacks, transferables)
