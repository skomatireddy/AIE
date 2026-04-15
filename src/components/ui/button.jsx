import { cn } from '../../lib/cn'

const variants = {
  default: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-zinc-600',
  outline: 'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 focus-visible:ring-zinc-600',
  ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:ring-zinc-600',
  destructive: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-6 text-sm',
  icon: 'h-9 w-9',
}

export function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
