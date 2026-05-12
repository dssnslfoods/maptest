import { cn } from '@/lib/utils';

interface DeveloperFooterProps {
  className?: string;
  /** When the footer sits on a colorful ambient background (login, test) */
  onAmbient?: boolean;
}

export function DeveloperFooter({ className, onAmbient = false }: DeveloperFooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={cn(
        'flex items-center justify-center gap-1.5 px-4 py-5 text-center text-[11px] tracking-wide',
        onAmbient ? 'text-foreground/55' : 'text-foreground/45',
        className,
      )}
    >
      <span>Developed by</span>
      <span className="font-semibold text-foreground/70">Arnon Arpaket</span>
      <span aria-hidden>·</span>
      <span>© {year}</span>
    </footer>
  );
}
