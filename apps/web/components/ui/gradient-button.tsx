import { forwardRef } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { Loader2 } from 'lucide-react'

const gradientButtonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap text-white transition-all outline-none select-none shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      direction: {
        horizontal: 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7]',
        diagonal: 'bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]',
        vertical: 'bg-gradient-to-b from-[#7C3AED] to-[#A855F7]',
      },
      size: {
        default: 'h-9 gap-1.5 px-5 py-2',
        sm: 'h-8 gap-1 rounded-lg px-3 text-xs',
        lg: 'h-11 gap-2 px-6 text-base',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      direction: 'horizontal',
      size: 'default',
    },
  }
)

export interface GradientButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof gradientButtonVariants> {
  loading?: boolean
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, direction, size, loading, children, disabled, ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        className={cn(gradientButtonVariants({ direction, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </ButtonPrimitive>
    )
  }
)
GradientButton.displayName = 'GradientButton'

export { GradientButton, gradientButtonVariants }
