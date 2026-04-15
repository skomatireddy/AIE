import { useDeviceCapabilities } from '../../hooks/useDeviceCapabilities'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export function BackendToggle({ value, onChange }) {
  const { hasWebGPU } = useDeviceCapabilities()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">Backend:</span>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={value === 'wasm' ? 'default' : 'outline'}
          onClick={() => onChange('wasm')}
        >
          WASM
        </Button>
        <Button
          size="sm"
          variant={value === 'webgpu' ? 'default' : 'outline'}
          onClick={() => onChange('webgpu')}
          disabled={!hasWebGPU}
          title={!hasWebGPU ? 'WebGPU not available in this browser' : 'Use GPU acceleration'}
        >
          WebGPU
          {hasWebGPU && <Badge variant="success" className="ml-1 scale-75">✓</Badge>}
        </Button>
      </div>
    </div>
  )
}
