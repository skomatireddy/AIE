/**
 * Decode an audio file (ArrayBuffer) and resample to 16 kHz mono Float32Array
 * — the format required by Whisper and most audio models.
 */
export async function decodeAudioToFloat32(arrayBuffer, targetSampleRate = 16000) {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  const ctx = new AudioContext({ sampleRate: targetSampleRate })

  const decoded = await ctx.decodeAudioData(arrayBuffer)
  const channelData = decoded.getChannelData(0) // mono

  // If already at target rate, return directly
  if (decoded.sampleRate === targetSampleRate) {
    await ctx.close()
    return channelData
  }

  // Offline resample
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * targetSampleRate),
    targetSampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = decoded
  source.connect(offlineCtx.destination)
  source.start()
  const resampled = await offlineCtx.startRendering()
  await ctx.close()
  return resampled.getChannelData(0)
}

/**
 * Convert a Blob (from MediaRecorder) to Float32Array at 16 kHz.
 */
export async function blobToFloat32(blob, targetSampleRate = 16000) {
  const arrayBuffer = await blob.arrayBuffer()
  return decodeAudioToFloat32(arrayBuffer, targetSampleRate)
}
