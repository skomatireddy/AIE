import { cn } from '../../lib/cn'

export function Select({ value, onValueChange, options = [], className, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        'h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer',
        className
      )}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
