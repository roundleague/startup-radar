import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground border-border',
        hot: 'border-transparent bg-[hsl(152_70%_50%/0.15)] text-[hsl(152_70%_60%)] border-[hsl(152_70%_50%/0.3)] border',
        warm: 'border-transparent bg-[hsl(38_92%_55%/0.15)] text-[hsl(38_92%_65%)] border-[hsl(38_92%_55%/0.3)] border',
        neutral: 'border-border bg-muted text-muted-foreground',
        stage: 'border-transparent bg-primary/10 text-primary/80',
        signal: 'border-border/50 bg-accent text-muted-foreground text-[10px] font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
