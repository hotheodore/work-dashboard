import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  stats,
  action,
  className = "mb-6",
}: {
  /** Small label above the title — context, e.g. the parent class. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Stat chips rendered at the title's baseline. Used where full stat cards
   *  would cost a whole section of vertical space. */
  stats?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-faint">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {stats && <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-8">{stats}</div>}
      {action}
    </header>
  );
}
