import { cn } from '../../lib/cn'

export function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={cn('flex flex-col gap-4', className)} data-tabs data-value={value}>
      {typeof children === 'function' ? children({ value, onValueChange }) : children}
    </div>
  )
}

export function TabsList({ children, className }) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-zinc-800 p-1 w-fit', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, activeValue, onValueChange, children, className }) {
  const isActive = value === activeValue
  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn(
        'px-3 py-1.5 text-sm rounded-md transition-colors font-medium',
        isActive
          ? 'bg-zinc-700 text-white shadow-sm'
          : 'text-zinc-400 hover:text-zinc-200'
      , className)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, activeValue, children, className }) {
  if (value !== activeValue) return null
  return <div className={className}>{children}</div>
}
