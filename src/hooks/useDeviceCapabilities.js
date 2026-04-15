import { useState, useEffect } from 'react'

export function useDeviceCapabilities() {
  const [hasWebGPU, setHasWebGPU] = useState(false)
  const [hasSharedArrayBuffer, setHasSharedArrayBuffer] = useState(false)

  useEffect(() => {
    // Check WebGPU
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      navigator.gpu.requestAdapter().then(adapter => {
        setHasWebGPU(!!adapter)
      }).catch(() => {
        setHasWebGPU(false)
      })
    }

    // Check SharedArrayBuffer (requires COOP/COEP headers)
    setHasSharedArrayBuffer(typeof SharedArrayBuffer !== 'undefined')
  }, [])

  return { hasWebGPU, hasSharedArrayBuffer }
}
