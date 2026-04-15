import { useRef, useState, useCallback, useEffect } from 'react'

// Module-level cache — workers survive component unmount/remount so loaded
// models don't need to be re-initialised when navigating between pages.
const workerCache = new Map()

/**
 * Generic hook for communicating with an AI inference Web Worker.
 *
 * @param {() => Worker} createWorker  - Factory function: () => new Worker(...)
 * @param {string}       cacheKey      - Stable key to keep this worker alive across remounts
 * @returns {{ run, status, progress, result, error, reset }}
 */
export function useAIWorker(createWorker, cacheKey) {
  const workerRef = useRef(null)
  const [status, setStatus] = useState('idle')      // idle | loading | running | done | error
  const [progress, setProgress] = useState(null)    // { loaded, total, name } | null
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Lazily create worker, using the cache when a cacheKey is provided
  function getWorker() {
    if (cacheKey) {
      if (!workerCache.has(cacheKey)) {
        workerCache.set(cacheKey, createWorker())
      }
      return workerCache.get(cacheKey)
    }
    if (!workerRef.current) {
      workerRef.current = createWorker()
    }
    return workerRef.current
  }

  // Only terminate workers that are NOT in the cache
  useEffect(() => {
    return () => {
      if (!cacheKey && workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [cacheKey])

  const run = useCallback((payload, transferables = []) => {
    return new Promise((resolve, reject) => {
      setStatus('loading')
      setError(null)
      setResult(null)
      setProgress(null)

      const worker = getWorker()

      function onMessage({ data }) {
        switch (data.type) {
          case 'progress':
            setStatus('loading')
            setProgress(data.payload)
            break
          case 'status':
            setStatus(data.payload)
            break
          case 'result':
            setStatus('done')
            setResult(data.payload)
            setProgress(null)
            worker.removeEventListener('message', onMessage)
            worker.removeEventListener('error', onError)
            resolve(data.payload)
            break
          case 'error':
            setStatus('error')
            setError(data.payload)
            setProgress(null)
            worker.removeEventListener('message', onMessage)
            worker.removeEventListener('error', onError)
            reject(new Error(data.payload))
            break
        }
      }

      function onError(e) {
        setStatus('error')
        setError(e.message || 'Worker failed to initialize')
        setProgress(null)
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
        reject(e)
      }

      worker.addEventListener('message', onMessage)
      worker.addEventListener('error', onError)
      worker.postMessage(payload, transferables)
    })
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
    setProgress(null)
  }, [])

  return { run, status, progress, result, error, reset }
}
