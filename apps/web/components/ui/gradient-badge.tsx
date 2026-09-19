import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

const gradientBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-medium text-white transition-all',
  {
    variants: {
      direction: {
        horizontal: 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7]',
        diagonal: 'bg-gradient-to-br from-[#7C3AED] to-[#A855F7]',
        vertical: 'bg-gradient-to-b from-[#7C3AED] to-[#A855F7]',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      direction: 'horizontal',
      size: 'default',
    },
  }
)

export interface GradientBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof gradientBadgeVariants> {}

const GradientBadge = forwardRef<HTMLSpanElement, GradientBadgeProps>(
  ({ className, direction, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(gradientBadgeVariants({ direction, size, className }))}
        {...props}
      />
    )
  }
)
GradientBadge.displayName = 'GradientBadge'

export { GradientBadge, gradientBadgeVariants }
