import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-white/40 backdrop-blur ring-1 ring-inset ring-white/40',
          className,
        )}
        {...props}
      >
        <div
          className="h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(91,107,255,0.55)]"
          style={{
            width: `${pct}%`,
            backgroundImage:
              'linear-gradient(90deg, hsl(235 88% 65%), hsl(280 80% 65%), hsl(330 80% 65%))',
          }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';
