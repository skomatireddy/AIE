import { useRef } from 'react'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'

const statusConfig = {
  idle:    { variant: 'secondary', label: 'Ready' },
  loading: { variant: 'warning',   label: 'Loading model…' },
  running: { variant: 'default',   label: 'Running inference…' },
  done:    { variant: 'success',   label: 'Done' },
  error:   { variant: 'destructive', label: 'Error' },
}

export function ModelStatus({ status, progress, error }) {
  const cfg = statusConfig[status] || statusConfig.idle

  const lastModelName = useRef(null)
  if (progress?.name) lastModelName.current = progress.name

  const pct = progress
    ? progress.progress != null
      ? progress.progress
      : progress.loaded && progress.total
        ? Math.round((progress.loaded / progress.total) * 100)
        : null
    : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {(status === 'loading' || status === 'running') && (
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        )}
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
        {lastModelName.current && (
          <span className="text-xs text-zinc-500 truncate max-w-xs">{lastModelName.current}</span>
        )}
      </div>

      {status === 'loading' && pct != null && (
        <Progress value={pct} className="h-1" />
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-950/40 rounded px-2 py-1">{error}</p>
      )}
    </div>
  )
}
