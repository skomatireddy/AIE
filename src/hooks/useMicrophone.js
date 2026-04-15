import { useRef, useState, useCallback } from 'react'
import { blobToFloat32 } from '../lib/audioUtils'

/**
 * Records microphone audio and returns a Float32Array at 16 kHz when stop() resolves.
 *
 * Uses MediaRecorder — simpler and more reliable than ScriptProcessorNode, which
 * Chromium optimizes away when the output gain is 0 (causing onaudioprocess to never fire).
 */
export function useMicrophone() {
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)

  const start = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setError(err.message)
    }
  }, [])

  const stop = useCallback(() => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        const msg = 'No active recording'
        setError(msg)
        return reject(new Error(msg))
      }

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        recorderRef.current = null
        setIsRecording(false)

        const chunks = chunksRef.current
        if (chunks.length === 0) {
          const msg = 'No audio captured — microphone may be muted or blocked'
          setError(msg)
          return reject(new Error(msg))
        }

        try {
          const blob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' })
          const float32 = await blobToFloat32(blob)
          resolve(float32)
        } catch (err) {
          setError(err.message)
          reject(err)
        }
      }

      recorder.stop()
    })
  }, [])

  return { start, stop, isRecording, error }
}
