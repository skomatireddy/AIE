import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { ModelStatus } from './ModelStatus'
import { BackendToggle } from './BackendToggle'

export function LabCard({
  title,
  description,
  icon,
  status,
  progress,
  error,
  device,
  onDeviceChange,
  children,
}) {
  return (
    <Card className="flex flex-col gap-0 h-full overflow-hidden">
      <CardHeader className="pb-4 border-b border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
            </div>
          </div>
          {onDeviceChange && (
            <BackendToggle value={device} onChange={onDeviceChange} />
          )}
        </div>
        <ModelStatus status={status} progress={progress} error={error} />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-5">
        {children}
      </CardContent>
    </Card>
  )
}
