import { cn } from '../../lib/cn'

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
        'placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500',
        'resize-y min-h-[100px]',
        className
      )}
      {...props}
    />
  )
}
