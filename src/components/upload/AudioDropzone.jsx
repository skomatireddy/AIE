import { useRef, useState, useCallback } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../ui/button'
import { useMicrophone } from '../../hooks/useMicrophone'
import { blobToFloat32 } from '../../lib/audioUtils'

export function AudioDropzone({ onAudioLoad, className }) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const { start, stop, isRecording, error: micError } = useMicrophone()

  const processFile = useCallback(async (file) => {
    if (!file) return
    setFileName(file.name)
    const ab = await file.arrayBuffer()
    const float32 = await blobToFloat32(new Blob([ab]))
    onAudioLoad(float32)
  }, [onAudioLoad])

  const onFileChange = useCallback((e) => {
    processFile(e.target.files[0])
  }, [processFile])

  const handleMic = useCallback(async () => {
    if (isRecording) {
      try {
        const float32 = await stop()
        setFileName('microphone recording')
        onAudioLoad(float32)
      } catch (err) {
        console.error('Mic stop error:', err)
      }
    } else {
      await start()
    }
  }, [isRecording, start, stop, onAudioLoad])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        onClick={() => !isRecording && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl transition-colors',
          'flex flex-col items-center justify-center gap-3 p-8 min-h-[140px]',
          isRecording
            ? 'border-red-500 bg-red-500/10'
            : fileName
              ? 'border-emerald-600 bg-emerald-600/10'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 cursor-pointer'
        )}
      >
        <div className="text-3xl">
          {isRecording ? '🔴' : fileName ? '🎵' : '🎙️'}
        </div>
        <p className="text-sm text-zinc-300 text-center">
          {isRecording
            ? 'Recording… click Stop when done'
            : fileName
              ? fileName
              : 'Drop an audio file here or click to browse'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant={isRecording ? 'destructive' : 'secondary'}
          size="sm"
          onClick={handleMic}
        >
          {isRecording ? '⏹ Stop Recording' : '🎙️ Record from Mic'}
        </Button>
        {fileName && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFileName(null); onAudioLoad(null) }}
          >
            Clear
          </Button>
        )}
      </div>

      {micError && <p className="text-xs text-red-400">{micError}</p>}
    </div>
  )
}
