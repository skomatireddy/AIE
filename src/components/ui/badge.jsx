import { cn } from '../../lib/cn'

const variants = {
  default: 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30',
  secondary: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  success: 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30',
  warning: 'bg-amber-600/20 text-amber-400 border border-amber-600/30',
  destructive: 'bg-red-600/20 text-red-400 border border-red-600/30',
  outline: 'border border-zinc-700 text-zinc-300',
}

export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
