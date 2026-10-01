import { cn } from "cn";

interface SectionProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Content on paper, separated by spacing and a hairline, not a card.
 * Only interactive groups get a surface (see `Group`).
 */
export function Section({ title, description, action, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title || action ? (
        <div className="flex items-baseline justify-between gap-4">
          {title ? <h2 className="text-sm font-medium text-ink-soft">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
      {children}
    </section>
  );
}

/** A grouped surface for interactive rows (lists of taps, settings). */
export function Group({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("divide-y divide-hairline overflow-hidden rounded-[16px] bg-surface", className)}>
      {children}
    </div>
  );
}

export function Hairline({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-hairline", className)} />;
}

export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-3 py-6">
      <p className="text-base text-ink-soft">{children}</p>
      {action}
    </div>
  );
}
