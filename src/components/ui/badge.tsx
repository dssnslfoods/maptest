import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur transition-colors',
  {
    variants: {
      variant: {
        default:    'border-white/40 bg-primary/85 text-primary-foreground shadow-sm',
        secondary:  'border-white/50 bg-white/55 text-foreground/80',
        success:    'border-emerald-200/70 bg-emerald-100/70 text-emerald-800',
        warning:    'border-amber-200/70 bg-amber-100/70 text-amber-900',
        destructive:'border-rose-200/70 bg-rose-100/70 text-rose-700',
        info:       'border-sky-200/70 bg-sky-100/70 text-sky-800',
        outline:    'border-white/60 bg-white/30 text-foreground/80',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
