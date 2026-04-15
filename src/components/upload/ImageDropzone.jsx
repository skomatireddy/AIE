import { useRef, useState, useCallback } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../ui/button'

export function ImageDropzone({ onImageLoad, className }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    const img = new Image()
    img.onload = () => {
      // Also expose the data URL for worker transfer
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      onImageLoad({ url, canvas, img })
    }
    img.src = url
  }, [onImageLoad])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [processFile])

  const onFileChange = useCallback((e) => {
    processFile(e.target.files[0])
  }, [processFile])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl cursor-pointer transition-colors',
          'flex flex-col items-center justify-center gap-3 p-8 min-h-[180px]',
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 max-w-full rounded-lg object-contain shadow"
          />
        ) : (
          <>
            <div className="text-3xl">🖼️</div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-300">Drop an image here</p>
              <p className="text-xs text-zinc-500 mt-1">or click to browse — PNG, JPG, WebP</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {preview && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-xs"
          onClick={(e) => {
            e.stopPropagation()
            setPreview(null)
            onImageLoad(null)
          }}
        >
          Clear image
        </Button>
      )}
    </div>
  )
}
