import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-white/60 bg-white/55 px-3.5 py-2 text-sm',
        'backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]',
        'placeholder:text-muted-foreground/80 transition-shadow',
        'focus-visible:outline-none focus-visible:border-primary/40 focus-visible:bg-white/75',
        'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
