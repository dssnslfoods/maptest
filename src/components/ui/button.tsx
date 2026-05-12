import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ' +
    'transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ' +
    'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'glass-tint-primary hover:brightness-110 hover:-translate-y-px ' +
          'hover:shadow-[0_14px_36px_-8px_rgba(70,80,240,0.55)]',
        secondary:
          'glass text-foreground hover:bg-white/75 hover:-translate-y-px',
        destructive:
          'bg-[hsl(0_85%_60%/0.92)] text-white border border-white/25 ' +
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_10px_30px_-8px_rgba(220,38,38,0.45)] ' +
          'backdrop-blur-md hover:brightness-110 hover:-translate-y-px',
        outline:
          'border border-white/60 bg-white/30 backdrop-blur-xl text-foreground ' +
          'hover:bg-white/55 hover:-translate-y-px',
        ghost:
          'text-foreground/80 hover:bg-white/55 hover:backdrop-blur-md hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success:
          'bg-[hsl(152_70%_42%/0.92)] text-white border border-white/25 ' +
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_10px_30px_-8px_rgba(16,160,90,0.45)] ' +
          'backdrop-blur-md hover:brightness-110 hover:-translate-y-px',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-2xl px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
