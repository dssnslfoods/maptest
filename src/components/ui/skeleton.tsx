import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/40 backdrop-blur-md ring-1 ring-inset ring-white/40',
        className,
      )}
      {...props}
    />
  );
}
