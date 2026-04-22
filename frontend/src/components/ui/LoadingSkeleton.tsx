import clsx from 'clsx'

type Props = {
  variant?: 'rect' | 'text' | 'card' | 'circle'
  width?: string | number
  height?: string | number
  className?: string
}

export default function LoadingSkeleton({ variant = 'rect', width, height, className }: Props) {
  const base = 'animate-pulse bg-white/[0.06]'
  const variantClass =
    variant === 'text' ? 'h-4 rounded-md' :
    variant === 'circle' ? 'rounded-full' :
    variant === 'card' ? 'h-24 rounded-2xl' :
    'rounded-lg'

  const style: React.CSSProperties = {}
  if (width != null) style.width = typeof width === 'number' ? `${width}px` : width
  if (height != null) style.height = typeof height === 'number' ? `${height}px` : height

  return <div aria-hidden="true" className={clsx(base, variantClass, className)} style={style} />
}
