import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

const gradientCardVariants = cva(
  'relative rounded-2xl transition-all duration-300',
  {
    variants: {
      variant: {
        border:
          'bg-card border border-transparent ring-1 ring-primary/10 hover:ring-primary/25 hover:shadow-lg hover:shadow-primary/5',
        solid:
          'bg-gradient-to-br from-[#7C3AED]/10 via-card to-[#A855F7]/5 border border-primary/10',
        glow: 'bg-card border border-primary/20 shadow-xl shadow-primary/10',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'border',
      padding: 'md',
    },
  }
)

export interface GradientCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientCardVariants> {}

const GradientCard = forwardRef<HTMLDivElement, GradientCardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gradientCardVariants({ variant, padding, className }))}
        {...props}
      />
    )
  }
)
GradientCard.displayName = 'GradientCard'

const GradientCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1.5 pb-4', className)} {...props} />
))
GradientCardHeader.displayName = 'GradientCardHeader'

const GradientCardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
))
GradientCardTitle.displayName = 'GradientCardTitle'

const GradientCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
GradientCardContent.displayName = 'GradientCardContent'

export { GradientCard, GradientCardHeader, GradientCardTitle, GradientCardContent, gradientCardVariants }
