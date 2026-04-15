/**
 * Worker registry — workers are module-level singletons so loaded models
 * survive component unmount/remount without re-downloading.
 */
const registry = new Map()

export function getWorker(key, factory) {
  if (!registry.has(key)) {
    registry.set(key, factory())
  }
  return registry.get(key)
}

/**
 * Send a message to a worker and return a Promise that resolves with the
 * result payload. Progress and status callbacks are optional.
 *
 * @param {Worker}   worker
 * @param {*}        payload
 * @param {{ onProgress?: (p: any) => void, onStatus?: (s: string) => void }} [callbacks]
 * @param {Transferable[]} [transferables]
 */
export function callWorker(worker, payload, callbacks = {}, transferables = []) {
  const { onProgress, onStatus } = callbacks
  return new Promise((resolve, reject) => {
    function onMessage({ data }) {
      switch (data.type) {
        case 'progress':
          onProgress?.(data.payload)
          break
        case 'status':
          onStatus?.(data.payload)
          break
        case 'result':
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
          resolve(data.payload)
          break
        case 'error':
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
          reject(new Error(data.payload))
          break
      }
    }
    function onError(e) {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      console.error('[workerBridge] Worker error event:', {
        message: e?.message,
        filename: e?.filename,
        lineno: e?.lineno,
        colno: e?.colno,
        error: e?.error,
        raw: e,
      })
      const msg = e?.message || e?.error?.message || 'Worker failed to load (check browser console → Workers tab)'
      reject(new Error(msg))
    }
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage(payload, transferables)
  })
}
