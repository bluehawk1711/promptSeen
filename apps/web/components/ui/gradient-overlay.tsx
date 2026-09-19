import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

const gradientOverlayVariants = cva(
  'pointer-events-none absolute inset-0',
  {
    variants: {
      direction: {
        up: 'bg-gradient-to-t from-black/80 via-black/30 to-transparent',
        down: 'bg-gradient-to-b from-black/80 via-black/30 to-transparent',
        diagonal: 'bg-gradient-to-br from-black/60 via-transparent to-black/80',
        subtle: 'bg-gradient-to-t from-black/50 to-transparent',
      },
    },
    defaultVariants: {
      direction: 'up',
    },
  }
)

export interface GradientOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientOverlayVariants> {}

const GradientOverlay = forwardRef<HTMLDivElement, GradientOverlayProps>(
  ({ className, direction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gradientOverlayVariants({ direction, className }))}
        {...props}
      />
    )
  }
)
GradientOverlay.displayName = 'GradientOverlay'

export { GradientOverlay, gradientOverlayVariants }
