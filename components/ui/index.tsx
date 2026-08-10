import type { ReactNode } from "react";

// Modal and StatTile need hooks; keeping them in their own client modules means
// Card/Badge/EmptyState/Field stay server components.
export { Modal } from "./Modal";
export { StatTile } from "./StatTile";
export { Button } from "./Button";

export function Card({
  title,
  action,
  className = "",
  bodyClass = "p-5",
  interactive = false,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClass?: string;
  /** Adds hover lift. Only for cards that are themselves a link or button. */
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`card ${interactive ? "card-interactive" : ""} ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="text-sm font-semibold tracking-tight text-text">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** The 4-up stat row was copy-pasted on four pages. This is that row. */
export function StatGrid({
  cols = 4,
  className = "",
  children,
}: {
  cols?: 3 | 4;
  className?: string;
  children: ReactNode;
}) {
  const colClass = cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return <div className={`grid gap-4 ${colClass} ${className}`}>{children}</div>;
}

const BADGE_TONES: Record<string, string> = {
  default: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  danger: "bg-danger/12 text-danger",
};

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone] ?? BADGE_TONES.default}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring";
