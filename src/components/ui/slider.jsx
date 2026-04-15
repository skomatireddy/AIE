import { cn } from '../../lib/cn'

export function Slider({ value, min = 0, max = 100, step = 1, onChange, className, label }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{label}</span>
          <span>{value}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-zinc-700 cursor-pointer accent-indigo-500"
      />
    </div>
  )
}
