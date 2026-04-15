import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { INFERENCE_APIS } from '../api/index.js'

const TWO_HOURS = 2 * 60 * 60 * 1000

/**
 * Drop-in replacement for useAIWorker backed by TanStack Query useMutation.
 * Results are kept in the query cache for 2 hours after the component unmounts,
 * so navigating back to a panel preserves the last inference output.
 *
 * Returns the same shape as useAIWorker: { run, status, progress, result, error, reset }
 *
 * @param {'caption'|'classify'|'detect'|'depth'|'segment'|'ner'|'qa'|
 *          'sentiment'|'summarize'|'translate'|'asr'|'audioclassify'|'embed'} apiKey
 */
export function useInference(apiKey) {
  const [progress, setProgress] = useState(null)
  const [workerStatus, setWorkerStatus] = useState(null)

  const apiFn = INFERENCE_APIS[apiKey]

  const mutation = useMutation({
    mutationKey: [apiKey],
    mutationFn: ({ payload, transferables = [] }) =>
      apiFn(payload, { onProgress: setProgress, onStatus: setWorkerStatus }, transferables),
    onSettled: () => {
      setProgress(null)
      setWorkerStatus(null)
    },
    gcTime: TWO_HOURS,
  })

  // Map TanStack mutation states → the status string the panels expect
  const status = mutation.isPending
    ? (workerStatus ?? 'loading')
    : mutation.isSuccess ? 'done'
    : mutation.isError   ? 'error'
    : 'idle'

  const run = useCallback(
    (payload, transferables = []) => mutation.mutateAsync({ payload, transferables }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutation.mutateAsync],
  )

  const reset = useCallback(() => {
    mutation.reset()
    setProgress(null)
    setWorkerStatus(null)
  }, [mutation.reset])

  return {
    run,
    status,
    progress,
    result: mutation.data ?? null,
    error:  mutation.error?.message ?? null,
    reset,
  }
}
