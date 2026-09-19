import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

const gradientHeaderVariants = cva(
  'relative overflow-hidden rounded-2xl p-6 md:p-8',
  {
    variants: {
      variant: {
        subtle: 'bg-gradient-to-br from-primary/[0.06] via-background to-background',
        vivid: 'bg-gradient-to-br from-[#7C3AED]/15 via-[#A855F7]/5 to-background',
        dark: 'bg-gradient-to-br from-[#7C3AED]/20 via-[#A855F7]/10 to-background text-white',
      },
    },
    defaultVariants: {
      variant: 'subtle',
    },
  }
)

export interface GradientHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientHeaderVariants> {}

const GradientHeader = forwardRef<HTMLDivElement, GradientHeaderProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gradientHeaderVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
GradientHeader.displayName = 'GradientHeader'

export { GradientHeader, gradientHeaderVariants }
